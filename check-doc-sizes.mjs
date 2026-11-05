/**
 * check-doc-sizes.mjs — ตรวจขนาดเอกสารบน Firestore (อ่านอย่างเดียว ไม่เขียน/ไม่ลบอะไร)
 * ขีดจำกัดของ Firestore = 1,048,576 bytes ต่อเอกสาร
 *
 * รัน (จาก ~/Desktop/Project/kinder-track/):   node check-doc-sizes.mjs
 */
const { initializeApp } = await import('./node_modules/firebase/app/dist/esm/index.esm.js');
const { getFirestore, doc, getDoc, getDocs, collection } = await import('./node_modules/firebase/firestore/dist/esm/index.esm.js');
const db = getFirestore(initializeApp({
  apiKey: 'AIzaSyB4zokDQo4AcUuOhw-mmheD_mxDZ1gzVP4',
  authDomain: 'kinder-track-57770.firebaseapp.com',
  projectId: 'kinder-track-57770',
  storageBucket: 'kinder-track-57770.firebasestorage.app',
  messagingSenderId: '648130056832',
  appId: '1:648130056832:web:db70b15f8f646ba9a00c65',
}));
const LIMIT = 1048576;
const kb = (n) => (n / 1024).toFixed(0).padStart(6) + ' KB';
const size = (v) => Buffer.byteLength(JSON.stringify(v ?? null));

function report(name, data) {
  const total = size(data);
  const flag = total > LIMIT * 0.9 ? '  ⚠️ ใกล้/เกินขีดจำกัด' : '';
  console.log(`\n📄 ${name}  ≈ ${kb(total)} (${Math.round(total / LIMIT * 100)}% ของ 1MB)${flag}`);
  Object.entries(data ?? {})
    .map(([k, v]) => [k, size(v)])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .forEach(([k, n]) => console.log(`     ${kb(n)}  ${k}`));
}

const base = ['schools', 'default'];
const snap = await getDoc(doc(db, ...base, 'snapshots', 'latest'));
if (snap.exists()) report('snapshots/latest', snap.data()); else console.log('ไม่พบ snapshots/latest');

const latest = await getDoc(doc(db, ...base, 'dailyData', 'latest'));
if (latest.exists()) report('dailyData/latest', latest.data()); else console.log('ไม่พบ dailyData/latest');

const col = await getDocs(collection(db, ...base, 'dailyData'));
const others = [];
col.forEach((d) => { if (d.id !== 'latest') others.push([d.id, size(d.data())]); });
console.log(`\nเอกสารอื่นใน dailyData: ${others.length} ใบ`);
others.sort((a, b) => b[1] - a[1]).slice(0, 8).forEach(([id, n]) => console.log(`     ${kb(n)}  ${id}`));
process.exit(0);
