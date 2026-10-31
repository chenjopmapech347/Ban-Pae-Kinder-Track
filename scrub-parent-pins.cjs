/**
 * scrub-parent-pins.cjs — ลบ parentPin (ข้อความธรรมดา) ออกจาก snapshots/latest
 * ทำเมื่อแอปรุ่น VITE_SERVER_AUTH=true ใช้งานจริงและผู้ปกครองล็อกอินได้แล้วเท่านั้น (ย้อนกลับไม่ได้)
 *   node scrub-parent-pins.cjs          DRY-RUN     |   node scrub-parent-pins.cjs --apply
 */
const fs = require('fs'), path = require('path');
const admin = require('firebase-admin');
const a = process.argv.slice(2);
const KEY = path.resolve(a.includes('--key') ? a[a.indexOf('--key') + 1] : 'serviceAccount.json');
if (!fs.existsSync(KEY)) { console.error('ไม่พบไฟล์คีย์: ' + KEY); process.exit(1); }
admin.initializeApp({ credential: admin.credential.cert(require(KEY)) });
const ref = admin.firestore().doc('schools/default/snapshots/latest');
(async () => {
  const students = ((await ref.get()).data() || {}).students || [];
  const n = students.filter((s) => s.parentPin).length;
  console.log(`นักเรียน ${students.length} คน, มี parentPin ${n} คน`);
  if (!a.includes('--apply')) { console.log('DRY-RUN — รันซ้ำด้วย --apply'); return; }
  await ref.update({ students: students.map(({ parentPin: _p, ...rest }) => rest) });
  console.log('ลบ parentPin ออกแล้ว (backup รายวันเก่ายังมีอยู่ ให้รัน cleanup-backups.cjs ต่อ)');
})().then(() => process.exit(0)).catch((e) => { console.error(e.message); process.exit(1); });
