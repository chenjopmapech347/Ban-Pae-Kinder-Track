/**
 * create-parent-accounts.cjs — สร้างบัญชี Firebase Auth ให้ผู้ปกครองทุกคน (รันบนเครื่องผู้ดูแล, ไม่ต้องใช้ Blaze)
 *
 *   node create-parent-accounts.cjs            DRY-RUN: นับ/ตรวจรหัสซ้ำ ไม่สร้างอะไร
 *   node create-parent-accounts.cjs --apply    สร้างบัญชีที่ยังไม่มี + ตั้ง claims + เขียน parent-pins-<วันที่>.csv
 *   node create-parent-accounts.cjs --apply --keep-existing   ถ้า PIN เดิมเป็นเลข 6 หลักให้ใช้ต่อ ที่เหลือสุ่มใหม่
 *
 * ตัวระบุของผู้ปกครอง = studentCode (ถ้าไม่มีใช้ id) → อีเมล <ตัวระบุ>@parent.kindertrack.app
 * ไฟล์ CSV มี PIN ตัวจริง ใช้แจกผู้ปกครองแล้วลบทิ้ง (ไม่ขึ้น git) รันซ้ำได้: ข้ามบัญชีที่มีแล้ว
 */
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const admin = require('firebase-admin');
const a = process.argv.slice(2);
const APPLY = a.includes('--apply'), KEEP = a.includes('--keep-existing');
const ki = a.indexOf('--key');
const KEY = path.resolve(ki >= 0 ? a[ki + 1] : 'serviceAccount.json');
if (!fs.existsSync(KEY)) { console.error('ไม่พบไฟล์คีย์: ' + KEY); process.exit(1); }
admin.initializeApp({ credential: admin.credential.cert(require(KEY)) });
const DOMAIN = 'parent.kindertrack.app';

(async () => {
  console.log(APPLY ? '*** ทำจริง ***' : '--- DRY-RUN ---');
  const snap = await admin.firestore().doc('schools/default/snapshots/latest').get();
  const students = (snap.data() || {}).students || [];
  const items = students.map((s) => ({ s, code: String(s.studentCode || s.code || s.id).trim().toLowerCase() }))
    .filter((x) => x.s.id !== 9999);
  const seen = new Map(); const dup = [];
  items.forEach((x) => { if (seen.has(x.code)) dup.push(x); else seen.set(x.code, x); });
  console.log(`นักเรียน ${items.length} คน, รหัสซ้ำ ${dup.length}`);
  dup.forEach((x) => console.log('  ซ้ำ:', x.code, x.s.name));
  const bad = items.filter((x) => !/^[a-z0-9._-]+$/.test(x.code));
  bad.forEach((x) => console.log('  รหัสมีอักขระแปลก (ข้าม):', x.code, x.s.name));
  const todo = items.filter((x) => seen.get(x.code) === x && !bad.includes(x));
  if (!APPLY) { console.log(`จะสร้างได้สูงสุด ${todo.length} บัญชี (ที่มีอยู่แล้วจะข้าม)\nรันซ้ำด้วย --apply เมื่อพร้อม`); return; }

  const rows = []; let created = 0, skipped = 0;
  for (const { s, code } of todo) {
    const email = `${code}@${DOMAIN}`;
    try { await admin.auth().getUserByEmail(email); skipped++; continue; } catch (e) { if (e.code !== 'auth/user-not-found') throw e; }
    const old = String(s.parentPin || '');
    const pin = KEEP && /^\d{6}$/.test(old) ? old : String(crypto.randomInt(0, 1000000)).padStart(6, '0');
    const u = await admin.auth().createUser({ email, password: pin, displayName: `ผู้ปกครอง ${s.name}` });
    await admin.auth().setCustomUserClaims(u.uid, { role: 'parent', studentId: String(s.id) });
    rows.push([s.className || '', s.name, code, pin]); created++;
  }
  console.log(`สร้าง ${created} บัญชี, ข้าม (มีแล้ว) ${skipped}`);
  if (rows.length) {
    const f = `parent-pins-${new Date().toISOString().slice(0, 10)}.csv`;
    const csv = '﻿ห้อง,ชื่อนักเรียน,รหัสนักเรียน(ใช้ล็อกอิน),PIN\n' + rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n') + '\n';
    fs.writeFileSync(f, csv, { mode: 0o600 });
    console.log('เขียน', f, '(มี PIN จริง — แจกแล้วลบไฟล์นี้)');
  }
})().then(() => process.exit(0)).catch((e) => { console.error(e.message); process.exit(1); });
