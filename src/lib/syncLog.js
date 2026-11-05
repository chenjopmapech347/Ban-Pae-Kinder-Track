/**
 * syncLog.js — เก็บบันทึกการซิงก์ (เวลา/ขนาด/ข้อผิดพลาด/สภาพเครือข่าย) จากทุกเครื่องขึ้น Firestore
 * เพื่อให้ผู้ดูแลตรวจย้อนหลังได้ (ใช้ช่วงทดสอบ ~1 สัปดาห์ แล้วปิดได้ด้วย SYNC_LOG_ENABLED = false)
 *
 * ไม่เก็บข้อมูลนักเรียน — เก็บเฉพาะ: เวลา, ชื่อส่วนที่ซิงก์, ms, KB, ข้อความ error (ตัดสั้น), บทบาท/ห้องของผู้ใช้, สภาพเครือข่าย
 * Firestore: schools/default/syncLogs/{เวลา}_{deviceId}  → { device, role, userName, className, version, ua, entries:[...] }
 * ถ้าส่งไม่สำเร็จ (เช่นออฟไลน์) จะเก็บคิวในเครื่องแล้วส่งใหม่ภายหลัง — ความล้มเหลวของบันทึกนี้ไม่กระทบการซิงก์จริง
 */
import { doc, setDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';

export const SYNC_LOG_ENABLED = true;
const QUEUE_KEY = 'kt_syncLogQueue';
const DEVICE_KEY = 'kt_deviceId';
const MAX_QUEUE = 200;
const FLUSH_EVERY = 15;                 // ส่งเมื่อมี 15 รายการ
const FLUSH_INTERVAL_MS = 30 * 60 * 1000;   // หรืออย่างน้อยทุก 30 นาที
const ERROR_FLUSH_DELAY_MS = 4000;      // เกิด error → ส่งเร็ว (หน่วง 4 วิ รวมหลายรายการ)
const RETAIN_DAYS = 7;

let flushTimer = null;
let lastFlushAt = 0;
let flushing = false;
let ctx = { role: '', userName: '', className: '' };

function ls() { try { return window.localStorage; } catch { return null; } }
function readQueue() { try { return JSON.parse(ls()?.getItem(QUEUE_KEY) || '[]'); } catch { return []; } }
function writeQueue(q) { try { ls()?.setItem(QUEUE_KEY, JSON.stringify(q.slice(-MAX_QUEUE))); } catch { /* ignore */ } }

export function getDeviceId() {
  try {
    let id = ls()?.getItem(DEVICE_KEY);
    if (!id) { id = Math.random().toString(36).slice(2, 8); ls()?.setItem(DEVICE_KEY, id); }
    return id;
  } catch { return 'unknown'; }
}

/** บอกว่าใครกำลังใช้เครื่องนี้ (เรียกเมื่อ role/user เปลี่ยน) */
export function setSyncLogContext(next) { ctx = { ...ctx, ...next }; }

function netInfo() {
  const c = typeof navigator !== 'undefined' ? navigator.connection : null;
  return {
    online: typeof navigator !== 'undefined' ? navigator.onLine : null,
    type: c?.effectiveType ?? null,   // 4g/3g/2g
    rtt: c?.rtt ?? null,              // ms
    down: c?.downlink ?? null,        // Mbps
  };
}

/** บันทึก 1 รายการ: { part:'snap'|'daily'|'all', ok, ms, kb, error } */
export function logSync(entry) {
  if (!SYNC_LOG_ENABLED) return;
  const q = readQueue();
  q.push({ t: new Date().toISOString(), ...entry,
    error: entry.error ? String(entry.error).slice(0, 300) : undefined, net: netInfo() });
  writeQueue(q);
  const failed = entry.ok === false;
  if (failed || q.length >= FLUSH_EVERY || Date.now() - lastFlushAt > FLUSH_INTERVAL_MS) {
    clearTimeout(flushTimer);
    flushTimer = setTimeout(flushSyncLogs, failed ? ERROR_FLUSH_DELAY_MS : 1500);
  }
}

export async function flushSyncLogs() {
  if (!SYNC_LOG_ENABLED || flushing || !isFirebaseConfigured || !db) return;
  const q = readQueue();
  if (!q.length) return;
  flushing = true;
  try {
    const sent = q.slice(0, 100);
    const id = `${new Date().toISOString().replace(/[:.]/g, '-')}_${getDeviceId()}`;
    await setDoc(doc(db, 'schools', 'default', 'syncLogs', id), {
      device: getDeviceId(),
      role: ctx.role, userName: ctx.userName, className: ctx.className,
      version: typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '',
      ua: (typeof navigator !== 'undefined' ? navigator.userAgent : '').slice(0, 160),
      at: new Date().toISOString(),
      expireAt: new Date(Date.now() + RETAIN_DAYS * 86400000).toISOString(),
      entries: sent,
    });
    writeQueue(readQueue().slice(sent.length));   // ลบเฉพาะที่ส่งแล้ว
    lastFlushAt = Date.now();
  } catch { /* ส่งไม่ได้ (ออฟไลน์/ไม่มีสิทธิ์) — เก็บคิวไว้ ลองใหม่รอบหน้า */ } finally { flushing = false; }
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => { setTimeout(flushSyncLogs, 2000); });
}
