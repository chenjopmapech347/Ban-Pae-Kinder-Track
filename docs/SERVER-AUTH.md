# ตรวจ PIN ด้วย Firebase Auth (ฟรี ไม่ต้องใช้ Blaze / Cloud Functions)

ค่าเริ่มต้น: แอปทำงานแบบเดิม จนกว่าจะ build ด้วย `VITE_SERVER_AUTH=true`

ทุกบทบาทล็อกอินผ่าน Firebase Auth (Firebase เก็บแฮชและจำกัดการลองผิดให้เอง)
- แอดมิน/ครู: อีเมล + รหัสผ่าน, สิทธิ์ (role, className) ตั้งด้วย `grant-roles.cjs`
- ผู้ปกครอง: รหัสนักเรียน + PIN 6 หลัก (บัญชี `<รหัส>@parent.kindertrack.app`) สร้างด้วย `create-parent-accounts.cjs`
- ผู้ปกครองอ่านได้เฉพาะ `parentView/{studentId}` ของบุตรหลาน (rules บังคับ) ซึ่งแอปของครู/แอดมินเขียนให้ตอน sync

## ขั้น 0 — เตรียม
1. Firebase Console → Authentication → Sign-in method → เปิด **Email/Password**
2. `serviceAccount.json` ต้องอยู่ในโฟลเดอร์โปรเจกต์ (มีอยู่แล้ว, อยู่ใน .gitignore)
3. ใน firebase.json ต้องไม่มี `"functions"` (ถ้าเคยเพิ่มไว้ ให้ลบ)

## ขั้น 1 — สร้างบัญชี (ระบบเดิมยังใช้ได้ตามปกติ)
1. แอดมิน/ครู: Console → Authentication → Add user (อีเมล + รหัสผ่านที่ตั้งเอง ≥ 6 ตัว) แล้ว
   `node grant-roles.cjs --email admin@... --role admin`
   `node grant-roles.cjs --email kru@... --role teacher --class "อ.1/1"`
   อีเมลครูต้องตรงกับช่องอีเมลในหน้า "ครู" ของแอป
2. ผู้ปกครอง: `node create-parent-accounts.cjs` (ดูก่อน) → `node create-parent-accounts.cjs --apply`
   ได้ไฟล์ `parent-pins-<วันที่>.csv` สำหรับแจก PIN (แจกแล้วลบไฟล์)
   นักเรียนใหม่: รันคำสั่งเดิมซ้ำ จะสร้างเฉพาะคนที่ยังไม่มีบัญชี
   รีเซ็ต PIN: `node reset-parent-pin.cjs --code 69001`

## ขั้น 2 — build รุ่นใหม่แล้วให้ครูเปิดแอป 1 ครั้ง
`VITE_SERVER_AUTH=true npm run build && npx firebase-tools deploy --only hosting`
ครู/แอดมินล็อกอินด้วยอีเมล แล้วรอ sync จนสถานะเสร็จ (จะสร้าง parentView ให้ผู้ปกครอง)
ทดสอบผู้ปกครอง: รหัสนักเรียน + PIN จาก CSV ต้องเห็นเฉพาะบุตรหลาน
ย้อนกลับ: build/deploy โดยไม่ตั้ง VITE_SERVER_AUTH

## ขั้น 3 — ปิด rules (หลังขั้น 2 ผ่านครบทุกบทบาท)
1. `cp firestore.rules firestore.rules.before-roles`
2. `cp firestore.rules.role-based firestore.rules`
3. ทดสอบใน Rules Playground แล้ว `npx firebase-tools deploy --only firestore:rules`
ย้อนกลับ: คืน firestore.rules.before-roles แล้ว deploy ซ้ำ
**ข้อควรระวัง:** ผู้ใช้ที่ยังเปิดแอปรุ่นเก่าจะอ่าน/เขียนไม่ได้หลังขั้นนี้ (ต้องรีเฟรช)

## ขั้น 4 — เก็บกวาด (ย้อนกลับไม่ได้)
`node scrub-parent-pins.cjs --apply` แล้ว `node cleanup-backups.cjs --apply`
