/**
 * backup-firestore.mjs
 * สำรองข้อมูล Firestore → JSON files
 *
 * วิธีรัน (จากโฟลเดอร์ kinder-track):
 *   node backup-firestore.mjs
 *
 * ผลลัพธ์: โฟลเดอร์  backups/YYYY-MM-DD_HH-MM-SS/
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

// ── Firebase config ──────────────────────────────────────
const firebaseConfig = {
  apiKey:            'AIzaSyB4zokDQo4AcUuOhw-mmheD_mxDZ1gzVP4',
  authDomain:        'kinder-track-57770.firebaseapp.com',
  projectId:         'kinder-track-57770',
  storageBucket:     'kinder-track-57770.firebasestorage.app',
  messagingSenderId: '648130056832',
  appId:             '1:648130056832:web:db70b15f8f646ba9a00c65',
};

// ── collections ที่ต้องสำรอง ─────────────────────────────
const COLLECTIONS = [
  'settings',       // std1_ratings (admin checklist ม.2)
  'std2_ratings',   // per-teacher self-assessment (ม.3)
  'activityLogs',   // บันทึกกิจกรรม / ประเมินนักเรียน
  'students',       // ข้อมูลนักเรียน
  'users',          // ผู้ใช้งาน
  'classrooms',     // ห้องเรียน
];

// ── สร้างโฟลเดอร์ backup ──────────────────────────────────
const now = new Date();
const ts  = now.toISOString().slice(0, 19).replace(/[T:]/g, '_').replace(/-/g, '-');
const dir = join('backups', ts);
mkdirSync(dir, { recursive: true });

// ── รับ email/password จาก command-line args ─────────────
const [,, email, password] = process.argv;
if (!email || !password) {
  console.error('❌ ใส่ email และ password ด้วยครับ:\n   node backup-firestore.mjs <email> <password>');
  process.exit(1);
}

// ── init Firebase + sign in ──────────────────────────────
const app  = initializeApp(firebaseConfig);
const db   = getFirestore(app);
const auth = getAuth(app);

console.log(`🔐 กำลัง sign in เป็น ${email} ...`);
try {
  await signInWithEmailAndPassword(auth, email, password);
  console.log('✅ Sign in สำเร็จ\n');
} catch (err) {
  console.error('❌ Sign in ล้มเหลว:', err.message);
  process.exit(1);
}

let totalDocs = 0;

for (const colName of COLLECTIONS) {
  try {
    const snap = await getDocs(collection(db, colName));
    const data = {};
    snap.forEach(doc => { data[doc.id] = doc.data(); });
    const count = Object.keys(data).length;

    const filePath = join(dir, `${colName}.json`);
    writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');

    console.log(`✅ ${colName.padEnd(16)} — ${count} docs  →  ${filePath}`);
    totalDocs += count;
  } catch (err) {
    console.warn(`⚠️  ${colName}: ${err.message}`);
  }
}

// ── บันทึก metadata ──────────────────────────────────────
writeFileSync(
  join(dir, '_backup_info.json'),
  JSON.stringify({
    timestamp: now.toISOString(),
    project:   firebaseConfig.projectId,
    collections: COLLECTIONS,
    totalDocs,
    note: 'Backup ก่อน Task #3 — เพิ่ม UI รายการพิจารณา (sub-items) ปี 68',
  }, null, 2),
  'utf8'
);

console.log(`\n📦 Backup เสร็จ — ${totalDocs} docs → ${dir}/`);
process.exit(0);
