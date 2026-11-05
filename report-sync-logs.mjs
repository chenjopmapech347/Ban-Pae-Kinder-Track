/**
 * report-sync-logs.mjs — สรุปบันทึกการซิงก์จากทุกเครื่อง (อ่านอย่างเดียว)
 *   node report-sync-logs.mjs            # ทั้งหมดที่มี
 *   node report-sync-logs.mjs --days 3   # เฉพาะ 3 วันล่าสุด
 * แสดง: จำนวนครั้ง/สำเร็จ/ล้มเหลว, เวลามัธยฐานและ p95 แยกส่วน (snap=ข้อมูลหลัก, daily=รายวัน), error ที่พบบ่อย, สรุปแยกตามผู้ใช้/ห้อง/เครือข่าย
 */
const { initializeApp } = await import('./node_modules/firebase/app/dist/esm/index.esm.js');
const { getFirestore, collection, getDocs } = await import('./node_modules/firebase/firestore/dist/esm/index.esm.js');
const db = getFirestore(initializeApp({
  apiKey: 'AIzaSyB4zokDQo4AcUuOhw-mmheD_mxDZ1gzVP4',
  authDomain: 'kinder-track-57770.firebaseapp.com',
  projectId: 'kinder-track-57770',
  storageBucket: 'kinder-track-57770.firebasestorage.app',
  messagingSenderId: '648130056832',
  appId: '1:648130056832:web:db70b15f8f646ba9a00c65',
}));
const di = process.argv.indexOf('--days');
const since = di > 0 ? Date.now() - Number(process.argv[di + 1]) * 86400000 : 0;

const snap = await getDocs(collection(db, 'schools', 'default', 'syncLogs'));
const rows = [];
snap.forEach((d) => {
  const x = d.data();
  (x.entries ?? []).forEach((e) => {
    if (Date.parse(e.t) >= since) rows.push({ ...e, device: x.device, role: x.role, user: x.userName, cls: x.className, ver: x.version });
  });
});
console.log(`\nพบ ${rows.length} รายการ จาก ${snap.size} เอกสาร`);
if (!rows.length) process.exit(0);

const q = (arr, p) => { const a = [...arr].sort((m, n) => m - n); return a.length ? a[Math.min(a.length - 1, Math.floor(p * a.length))] : null; };
const stat = (list) => {
  const ms = list.map((r) => r.ms).filter((v) => typeof v === 'number');
  return `${String(list.length).padStart(4)} ครั้ง | ล้มเหลว ${String(list.filter((r) => r.ok === false).length).padStart(3)} | มัธยฐาน ${q(ms, 0.5) ?? '-'} ms | p95 ${q(ms, 0.95) ?? '-'} ms`;
};

console.log('\n── แยกตามส่วน ──');
['snap', 'daily', 'all'].forEach((p) => { const l = rows.filter((r) => r.part === p); if (l.length) console.log(`${p.padEnd(6)} ${stat(l)}`); });

console.log('\n── แยกตามผู้ใช้/ห้อง ──');
const by = (keyFn) => { const m = new Map(); rows.forEach((r) => { const k = keyFn(r); (m.get(k) ?? m.set(k, []).get(k)).push(r); }); return m; };
[...by((r) => `${r.role || '?'} ${r.user || ''} ${r.cls || ''} [${r.device}]`).entries()]
  .sort((a, b) => b[1].filter((r) => r.ok === false).length - a[1].filter((r) => r.ok === false).length)
  .forEach(([k, l]) => console.log(`${k.padEnd(48)} ${stat(l)}`));

console.log('\n── แยกตามเครือข่าย ──');
[...by((r) => r.net?.online === false ? 'ออฟไลน์' : (r.net?.type ?? 'ไม่ทราบ')).entries()].forEach(([k, l]) => console.log(`${k.padEnd(10)} ${stat(l)}`));

console.log('\n── ข้อผิดพลาดที่พบบ่อย ──');
const errs = new Map();
rows.filter((r) => r.ok === false).forEach((r) => { const k = (r.error ?? '(ไม่มีข้อความ)').slice(0, 110); errs.set(k, (errs.get(k) ?? 0) + 1); });
[...errs.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).forEach(([k, n]) => console.log(`${String(n).padStart(4)}×  ${k}`));
if (!errs.size) console.log('(ไม่พบข้อผิดพลาด)');
process.exit(0);
