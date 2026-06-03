/**
 * seedFirebase.js
 * ─────────────────────────────────────────────────────────
 * สร้าง Firebase Auth users สำหรับ Admin + Teacher 10 คน
 *
 * วิธีรัน (หลังตั้งค่า .env แล้ว):
 *   node scripts/seedFirebase.js
 *
 * ต้องการ:
 *   npm install firebase-admin dotenv
 *   และมีไฟล์ serviceAccount.json จาก Firebase Console
 *   (Project Settings → Service accounts → Generate new private key)
 * ─────────────────────────────────────────────────────────
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));

// โหลด service account key
let serviceAccount;
try {
  serviceAccount = JSON.parse(
    readFileSync(join(__dir, '..', 'serviceAccount.json'), 'utf8')
  );
} catch {
  console.error('❌ ไม่พบไฟล์ serviceAccount.json');
  console.error('   ดาวน์โหลดได้ที่: Firebase Console → Project Settings → Service accounts');
  process.exit(1);
}

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

// ─── รายชื่อ users ที่จะสร้าง ───────────────────────────
const USERS = [
  // Admin
  { email: 'admin@school.ac.th',       password: 'Admin@2568',   displayName: 'ผู้ดูแลระบบ',            role: 'admin'   },

  // Teacher 10 คน
  { email: 'chalada@school.ac.th',     password: 'Teacher@2568', displayName: 'คุณครูชลดา เมืองใจ',    role: 'teacher' },
  { email: 'vipaporn@school.ac.th',    password: 'Teacher@2568', displayName: 'คุณครูวิภาพร สุขสม',    role: 'teacher' },
  { email: 'napaporn@school.ac.th',    password: 'Teacher@2568', displayName: 'คุณครูนภาพร ดีเลิศ',    role: 'teacher' },
  { email: 'somchai@school.ac.th',     password: 'Teacher@2568', displayName: 'คุณครูสมชาย รักษ์ดี',   role: 'teacher' },
  { email: 'arunee@school.ac.th',      password: 'Teacher@2568', displayName: 'คุณครูอรุณี แสงทอง',    role: 'teacher' },
  { email: 'porntip@school.ac.th',     password: 'Teacher@2568', displayName: 'คุณครูพรทิพย์ มงคลชัย', role: 'teacher' },
  { email: 'sumalee@school.ac.th',     password: 'Teacher@2568', displayName: 'คุณครูสุมาลี ปัญญาดี',  role: 'teacher' },
  { email: 'teerayut@school.ac.th',    password: 'Teacher@2568', displayName: 'คุณครูธีรยุทธ ใจงาม',   role: 'teacher' },
  { email: 'piyanuch@school.ac.th',    password: 'Teacher@2568', displayName: 'คุณครูปิยะนุช สุวรรณดี',role: 'teacher' },
  { email: 'kiat@school.ac.th',        password: 'Teacher@2568', displayName: 'คุณครูเกียรติศักดิ์ ดีงาม',role:'teacher'},
];

// ─── สร้าง users ────────────────────────────────────────
async function seedUsers() {
  console.log('\n🌱 KinderTrack — Firebase Seed Script');
  console.log('=' .repeat(50));
  console.log(`📋 สร้าง ${USERS.length} บัญชี...\n`);

  let created = 0, skipped = 0, failed = 0;

  for (const u of USERS) {
    try {
      const existing = await admin.auth().getUserByEmail(u.email).catch(() => null);
      if (existing) {
        console.log(`  ⏭️  ${u.email} — มีอยู่แล้ว (ข้าม)`);
        skipped++;
        continue;
      }

      await admin.auth().createUser({
        email:        u.email,
        password:     u.password,
        displayName:  u.displayName,
        emailVerified: true,
      });

      // เพิ่ม custom claim สำหรับ role
      const newUser = await admin.auth().getUserByEmail(u.email);
      await admin.auth().setCustomUserClaims(newUser.uid, { role: u.role });

      console.log(`  ✅ ${u.role === 'admin' ? '🛡️ ' : '👨‍🏫 '}${u.displayName} — ${u.email}`);
      created++;

    } catch (e) {
      console.log(`  ❌ ${u.email} — ${e.message}`);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`✅ สร้างใหม่:  ${created} บัญชี`);
  console.log(`⏭️  ข้ามแล้ว:   ${skipped} บัญชี`);
  if (failed) console.log(`❌ ล้มเหลว:   ${failed} บัญชี`);

  console.log('\n📋 สรุปข้อมูลล็อกอิน:');
  console.log('─'.repeat(50));
  console.log('  บทบาท     อีเมล                        รหัสผ่าน');
  console.log('─'.repeat(50));
  console.log('  🛡️ Admin   admin@school.ac.th           Admin@2568');
  console.log('  👨‍🏫 ครูทุกคน [email]@school.ac.th      Teacher@2568');
  console.log('─'.repeat(50));
  console.log('\n⚠️  แนะนำ: ให้ครูแต่ละคนเปลี่ยนรหัสผ่านหลังล็อกอินครั้งแรก');
  console.log('   Admin → ตั้งค่า → ส่งอีเมล Reset รหัสผ่าน\n');

  process.exit(0);
}

seedUsers().catch(e => {
  console.error('Fatal:', e);
  process.exit(1);
});
