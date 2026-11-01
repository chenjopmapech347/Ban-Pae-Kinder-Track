/**
 * export-pins.cjs — ส่งออกรหัสล่าสุดของครูและผู้ปกครองลงไฟล์ CSV ในเครื่อง (ไม่แสดงบนหน้าจอ)
 *   node export-pins.cjs
 * ผลลัพธ์: all-pins-<วันที่>.csv (สิทธิ์อ่านเฉพาะเจ้าของ) — ใช้แล้วลบทิ้ง ห้ามส่งต่อ/อัปขึ้น git
 * หมายเหตุ: PIN แอดมินไม่ได้เก็บบน Firebase แล้ว (อยู่ในหน้าตั้งค่าของแอป/เบราว์เซอร์เครื่องที่ตั้งไว้)
 *           ผู้ปกครองในโหมด Firebase Auth: PIN จริงอยู่ในไฟล์ parent-pins-*.csv ตอนสร้างบัญชี (อ่านย้อนไม่ได้)
 */
const fs = require('fs'), path = require('path');
const admin = require('firebase-admin');
const a = process.argv.slice(2);
const KEY = path.resolve(a.includes('--key') ? a[a.indexOf('--key') + 1] : 'serviceAccount.json');
if (!fs.existsSync(KEY)) { console.error('ไม่พบไฟล์คีย์: ' + KEY); process.exit(1); }
admin.initializeApp({ credential: admin.credential.cert(require(KEY)) });
const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
(async () => {
  const d = (await admin.firestore().doc('schools/default/snapshots/latest').get()).data() || {};
  const rows = [['ประเภท', 'ชื่อ', 'ห้อง', 'username/รหัสนักเรียน', 'อีเมล', 'PIN']];
  (d.teachers || []).filter((t) => t.id !== 9999)
    .forEach((t) => rows.push(['ครู', t.name, t.className, t.username, t.email, t.pin]));
  (d.students || []).filter((s) => s.id !== 9999)
    .forEach((s) => rows.push(['ผู้ปกครอง', s.name, s.className, s.studentCode || s.code || s.id, '', s.parentPin]));
  const f = `all-pins-${new Date().toISOString().slice(0, 10)}.csv`;
  fs.writeFileSync(f, '﻿' + rows.map((r) => r.map(q).join(',')).join('\n') + '\n', { mode: 0o600 });
  console.log(`เขียน ${f}: ครู ${(d.teachers || []).length - 0} รายการ, นักเรียน ${(d.students || []).length} รายการ`);
})().then(() => process.exit(0)).catch((e) => { console.error(e.message); process.exit(1); });
