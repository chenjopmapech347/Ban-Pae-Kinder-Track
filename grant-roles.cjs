/**
 * grant-roles.cjs — กำหนด role ให้บัญชี Firebase Auth (อีเมล) ของแอดมิน/ครู
 *
 *   node grant-roles.cjs --email admin@school.ac.th --role admin
 *   node grant-roles.cjs --email kru@school.ac.th  --role teacher --class "อ.1/1"
 *   node grant-roles.cjs --list                      ดูบัญชีทั้งหมดพร้อม role
 * บัญชีต้องสร้างไว้ก่อน (Firebase Console → Authentication → Add user) ผู้ใช้ต้องล็อกอินใหม่เพื่อรับสิทธิ์
 */
const fs = require('fs'), path = require('path');
const admin = require('firebase-admin');
const a = process.argv.slice(2);
const v = (n) => { const i = a.indexOf(n); return i >= 0 ? a[i + 1] : undefined; };
const KEY = path.resolve(v('--key') || 'serviceAccount.json');
if (!fs.existsSync(KEY)) { console.error('ไม่พบไฟล์คีย์: ' + KEY); process.exit(1); }
admin.initializeApp({ credential: admin.credential.cert(require(KEY)) });

(async () => {
  if (a.includes('--list')) {
    const r = await admin.auth().listUsers(1000);
    r.users.forEach((u) => console.log(u.email, JSON.stringify(u.customClaims || {})));
    return;
  }
  const email = v('--email'), role = v('--role'), cls = v('--class');
  if (!email || !['admin', 'teacher'].includes(role)) { console.error('ต้องระบุ --email และ --role admin|teacher'); process.exit(1); }
  if (role === 'teacher' && !cls) { console.error('ครูต้องระบุ --class เช่น "อ.1/1"'); process.exit(1); }
  const u = await admin.auth().getUserByEmail(email);
  const claims = role === 'teacher' ? { role, className: cls } : { role };
  await admin.auth().setCustomUserClaims(u.uid, claims);
  console.log('ตั้งค่าแล้ว:', email, JSON.stringify(claims));
})().then(() => process.exit(0)).catch((e) => { console.error(e.message); process.exit(1); });
