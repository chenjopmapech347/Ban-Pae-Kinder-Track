/**
 * reset-parent-pin.cjs — รีเซ็ต PIN ผู้ปกครองรายคน
 *   node reset-parent-pin.cjs --code 69001            สุ่ม PIN 6 หลักใหม่แล้วแสดง
 *   node reset-parent-pin.cjs --code 69001 --pin 123456
 */
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const admin = require('firebase-admin');
const a = process.argv.slice(2);
const v = (n) => { const i = a.indexOf(n); return i >= 0 ? a[i + 1] : undefined; };
const KEY = path.resolve(v('--key') || 'serviceAccount.json');
if (!fs.existsSync(KEY)) { console.error('ไม่พบไฟล์คีย์: ' + KEY); process.exit(1); }
const code = (v('--code') || '').trim().toLowerCase();
const pin = v('--pin') || String(crypto.randomInt(0, 1000000)).padStart(6, '0');
if (!code) { console.error('ต้องระบุ --code <รหัสนักเรียน>'); process.exit(1); }
if (!/^\d{6}$/.test(pin)) { console.error('PIN ต้องเป็นตัวเลข 6 หลัก'); process.exit(1); }
admin.initializeApp({ credential: admin.credential.cert(require(KEY)) });
(async () => {
  const u = await admin.auth().getUserByEmail(`${code}@parent.kindertrack.app`);
  await admin.auth().updateUser(u.uid, { password: pin });
  console.log(`รีเซ็ตแล้ว: รหัส ${code}  PIN ใหม่ ${pin}`);
})().then(() => process.exit(0)).catch((e) => { console.error(e.message); process.exit(1); });
