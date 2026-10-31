/**
 * ui.js — แทนที่ className เดิม (index.css) ด้วย inline style
 *
 *   <button {...ui('btn btn-primary', { marginLeft: 8 }, { onMouseEnter }, disabled)}>
 *
 * - รับสตริงคลาสแบบเดิม แปลงเป็น style object ตามกฎใน uiRules.js (เรียงตาม specificity/ลำดับใน CSS เดิม)
 * - :hover / :focus / :active ทำด้วย event handler (แก้ style ของ element ตรง ๆ ไม่ re-render)
 * - media query (max-width) ตรวจตอน render — ใช้ useViewport() ที่ root เพื่อ re-render เมื่อข้ามจุดตัด
 * - style ที่ส่งเข้ามาตรง ๆ (extra) ชนะเสมอ เหมือน inline style ชนะคลาสใน CSS เดิม
 * - สิ่งที่ inline ทำไม่ได้ (pseudo-element, print, descendant selector) ใช้ data-ui + กฎใน index.css
 */
import { useSyncExternalStore } from 'react';
import { RULES } from './uiRules';

// คลาสที่ยังต้องมี CSS (ดู index.css ส่วน data-ui) — ใส่เป็น attribute data-ui
const DATA_UI = new Set(['table', 'app-header', 'tab-bar', 'report-table', 'stat-card',
  'no-print', 'report-book', 'glass', 'container', 'page-header', 'stat-grid']);

const BREAKPOINTS = [420, 480, 640, 768, 1024];
const bucket = () => (typeof window === 'undefined' ? 9999 : BREAKPOINTS.find(b => window.innerWidth <= b) ?? 9999);
const width = () => (typeof window === 'undefined' ? 9999 : window.innerWidth);

// ── index: token → rules ──
const BY_TOKEN = new Map();
for (const r of RULES) for (const t of r.t) {
  if (!BY_TOKEN.has(t)) BY_TOKEN.set(t, []);
  BY_TOKEN.get(t).push(r);
}

const cache = new Map();
function resolve(classStr) {
  const toks = [...new Set(String(classStr).split(/\s+/).filter(Boolean))];
  const w = width();
  const key = toks.join(' ') + '|' + bucket();
  const hit = cache.get(key);
  if (hit) return hit;
  const set = new Set(toks);
  const seen = new Set(); const cand = [];
  for (const t of toks) for (const r of BY_TOKEN.get(t) ?? []) {
    if (seen.has(r)) continue; seen.add(r);
    if (r.t.every(x => set.has(x)) && (r.m == null || w <= r.m)) cand.push(r);
  }
  cand.sort((a, b) => a.s - b.s || a.o - b.o);
  const base = {}; const states = { hover: {}, focus: {}, 'focus-visible': {}, active: {}, disabled: {} };
  const stateRules = { hover: [], focus: [], 'focus-visible': [], active: [], disabled: [] };
  for (const r of cand) {
    if (!r.p) Object.assign(base, r.d);
    else stateRules[r.p].push(r);
  }
  const hasState = {};
  for (const p of Object.keys(stateRules)) {
    for (const r of stateRules[p]) Object.assign(states[p], r.d);
    hasState[p] = stateRules[p].length > 0;
  }
  const dataUi = toks.filter(t => DATA_UI.has(t)).join(' ');
  const out = { base, states, hasState, dataUi, interactive: hasState.hover || hasState.focus || hasState['focus-visible'] || hasState.active };
  if (cache.size > 2000) cache.clear();
  cache.set(key, out);
  return out;
}

// ── state handlers (แก้ style ตรง ๆ แล้วคืนค่าเดิมเมื่อออก) ──
const live = new WeakMap(); // el -> { flags:Set, saved:{ key:{prev,val} } }
const ORDER = ['focus', 'focus-visible', 'hover', 'active'];
function apply(el, res, extra) {
  const st = live.get(el);
  for (const k of Object.keys(st.saved)) {
    if (el.style[k] === st.saved[k].val) el.style[k] = st.saved[k].prev; // ถ้า React เปลี่ยนค่าไปแล้ว ไม่ทับ
  }
  st.saved = {};
  const merged = {};
  for (const f of ORDER) if (st.flags.has(f)) Object.assign(merged, res.states[f]);
  for (const k of Object.keys(merged)) {
    if (extra && k in extra) continue; // inline style ที่ระบุเอง ชนะ :hover เดิม
    const prev = el.style[k];
    el.style[k] = merged[k];
    st.saved[k] = { prev, val: el.style[k] };
  }
}
function setFlag(e, flag, on, res, extra, disabled) {
  const el = e.currentTarget;
  if (on && (el.disabled || disabled)) return;
  let st = live.get(el);
  if (!st) { st = { flags: new Set(), saved: {} }; live.set(el, st); }
  if (on) st.flags.add(flag); else st.flags.delete(flag);
  apply(el, res, extra);
}
function makeHandlers(res, extra, user, disabled) {
  const h = {};
  const f = (e, flag, on) => setFlag(e, flag, on, res, extra, disabled);
  if (res.hasState.hover) {
    h.onMouseEnter = (e) => { f(e, 'hover', true); user?.onMouseEnter?.(e); };
    h.onMouseLeave = (e) => { f(e, 'hover', false); f(e, 'active', false); user?.onMouseLeave?.(e); };
  }
  if (res.hasState.active) {
    h.onMouseDown = (e) => { f(e, 'active', true); user?.onMouseDown?.(e); };
    h.onMouseUp   = (e) => { f(e, 'active', false); user?.onMouseUp?.(e); };
  }
  if (res.hasState.focus || res.hasState['focus-visible']) {
    h.onFocus = (e) => {
      if (res.hasState.focus) f(e, 'focus', true);
      if (res.hasState['focus-visible'] && e.currentTarget.matches?.(':focus-visible')) f(e, 'focus-visible', true);
      user?.onFocus?.(e);
    };
    h.onBlur = (e) => { f(e, 'focus', false); f(e, 'focus-visible', false); user?.onBlur?.(e); };
  }
  for (const k of Object.keys(user ?? {})) if (!(k in h)) h[k] = user[k]; // handler อื่นของ element ส่งต่อตามเดิม
  return h;
}

/**
 * @param {string}  classStr  สตริงคลาสแบบเดิม (ยอมรับค่า falsy)
 * @param {object}  [extra]   style ที่ระบุเอง (ชนะคลาส)
 * @param {object}  [user]    event handler เดิมของ element (onMouseEnter ฯลฯ)
 * @param {boolean} [disabled] สถานะ disabled (ใช้กับ .btn:disabled)
 */
// ค่าว่าง ('' / null / undefined / false) ใน inline style ถือว่า "ไม่ได้ตั้ง" → ไม่ทับสไตล์จากคลาส (เหมือน React/CSS เดิม)
function cleanStyle(st) {
  if (!st) return st;
  const o = {};
  for (const k of Object.keys(st)) { const v = st[k]; if (v !== '' && v != null && v !== false) o[k] = v; }
  return o;
}

export function ui(classStr, extraIn, user, disabled) {
  const extra = cleanStyle(extraIn);
  if (!classStr) { const o = {}; if (extra) o.style = extra; if (user) Object.assign(o, user); return o; }
  const res = resolve(classStr);
  const style = { ...res.base };
  if (disabled && res.hasState.disabled) Object.assign(style, res.states.disabled);
  if (extra) Object.assign(style, extra);
  const props = { style };
  if (res.dataUi) props['data-ui'] = res.dataUi;
  if (res.interactive) Object.assign(props, makeHandlers(res, extra, user, disabled));
  else if (user) Object.assign(props, user);
  return props;
}

// ── re-render เมื่อข้ามจุดตัดของ media query ──
let listeners = new Set();
let current = bucket();
if (typeof window !== 'undefined') {
  window.addEventListener('resize', () => {
    const b = bucket();
    if (b !== current) { current = b; listeners.forEach(l => l()); }
  });
}
const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l); };
/** เรียกที่ root (App) หนึ่งครั้ง เพื่อให้ทั้งแอป re-render เมื่อหน้าจอข้ามจุดตัด */
export function useViewport() {
  return useSyncExternalStore(subscribe, () => current, () => 9999);
}
