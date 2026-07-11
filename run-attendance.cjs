/**
 * KinderTrack — ลงเวลามาเรียน "มา" ทุกคน
 * 18 พ.ค. 2569 (2026-05-18) ถึง 30 มิ.ย. 2569 (2026-06-30)
 *
 * รันด้วย: node run-attendance.cjs
 * (ต้องอยู่ในโฟลเดอร์ kinder-track)
 */
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc, updateDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey:            'AIzaSyB4zokDQo4AcUuOhw-mmheD_mxDZ1gzVP4',
  authDomain:        'kinder-track-57770.firebaseapp.com',
  projectId:         'kinder-track-57770',
  storageBucket:     'kinder-track-57770.firebasestorage.app',
  messagingSenderId: '648130056832',
  appId:             '1:648130056832:web:db70b15f8f646ba9a00c65',
};

const START_DATE = '2026-05-18';
const END_DATE   = '2026-06-30';

async function main() {
  const app = initializeApp(firebaseConfig);
  const db  = getFirestore(app);
  const snapshotRef = doc(db, 'schools', 'default', 'snapshots', 'latest');

  console.log('📥 กำลังอ่านข้อมูลจาก Firestore...');
  const snap = await getDoc(snapshotRef);

  if (!snap.exists()) {
    console.error('❌ ไม่พบ snapshot — กรุณา Push ขึ้น Cloud จากในแอปก่อน');
    process.exit(1);
  }

  const data         = snap.data();
  const students     = data.students     || [];
  const holidays     = data.holidays     || [];
  const dailyRecords = data.dailyRecords || {};

  console.log('✅ นักเรียน ' + students.length + ' คน');

  // สร้างรายการวันทำการ จ-ศ ยกเว้นวันหยุด
  const holidaySet = new Set((Array.isArray(holidays) ? holidays : []).map(h => h.date || h));
  const workDays = [];
  const d = new Date(START_DATE);
  const end = new Date(END_DATE);
  while (d <= end) {
    const iso = d.toISOString().slice(0,10);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6 && !holidaySet.has(iso)) workDays.push(iso);
    d.setDate(d.getDate() + 1);
  }
  console.log('📅 ' + workDays.length + ' วันทำการ (' + workDays[0] + ' ถึง ' + workDays[workDays.length-1] + ')');

  // ลงเวลา "มา" ทุกคน
  const studentIds = students.map(s => String(s.id));
  let added = 0, skipped = 0;
  workDays.forEach(date => {
    if (!dailyRecords[date]) dailyRecords[date] = {};
    studentIds.forEach(sid => {
      const ex = dailyRecords[date][sid];
      if (!ex || !ex.attendance) {
        dailyRecords[date][sid] = Object.assign({}, ex || {}, { attendance: 'มา' });
        added++;
      } else {
        skipped++;
      }
    });
  });
  console.log('✏️  เพิ่มใหม่: ' + added + ' | ข้าม (มีอยู่แล้ว): ' + skipped);

  console.log('📤 กำลังบันทึกขึ้น Firestore...');
  await updateDoc(snapshotRef, { dailyRecords });
  console.log('✅ บันทึกสำเร็จ!');
  console.log('');
  console.log('👉 เปิดแอป → ตั้งค่า → "ดึงข้อมูลจาก Cloud" เพื่อโหลดข้อมูลใหม่');
  process.exit(0);
}

main().catch(e => {
  console.error('❌ Error:', e.message);
  process.exit(1);
});
