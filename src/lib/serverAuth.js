/**
 * serverAuth.js — ล็อกอินด้วย Firebase Auth ทุกบทบาท (ไม่ต้องใช้ Cloud Functions / Blaze)
 *
 * ผู้ปกครอง: บัญชี Firebase Auth อีเมลสมมติ `<รหัสนักเรียน>@parent.kindertrack.app`
 *            รหัสผ่าน = PIN 6 หลัก (Firebase เก็บแฮชและจำกัดการลองผิดให้เอง)
 *            สิทธิ์ (custom claims role=parent, studentId) ตั้งด้วยสคริปต์ create-parent-accounts.cjs
 * ผู้ปกครองอ่านได้เฉพาะ parentView/{studentId} ของบุตรหลานตัวเอง (rules บังคับ)
 *
 * เปิดใช้เมื่อ build ด้วย VITE_SERVER_AUTH=true เท่านั้น (ค่าเริ่มต้น = ระบบเดิม)
 */
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, isFirebaseConfigured } from './firebase';
import { pullParentView } from './firebaseSync';

export const SERVER_AUTH = import.meta.env.VITE_SERVER_AUTH === 'true' && isFirebaseConfigured;

export const PARENT_EMAIL_DOMAIN = 'parent.kindertrack.app';
export const parentEmail = (code) => `${String(code).trim().toLowerCase()}@${PARENT_EMAIL_DOMAIN}`;

/** ผู้ปกครอง: รหัสนักเรียน + PIN */
export async function parentLoginServer(code, pin) {
  if (!auth) return { ok: false, message: 'Firebase ยังไม่ได้ตั้งค่า' };
  const c = String(code ?? '').trim();
  if (!c || !pin) return { ok: false, message: 'กรอกรหัสนักเรียนและ PIN' };
  try {
    const cred = await signInWithEmailAndPassword(auth, parentEmail(c), String(pin));
    const { claims } = await cred.user.getIdTokenResult(true);
    if (claims.role !== 'parent' || !claims.studentId) {
      await signOut(auth);
      return { ok: false, message: 'บัญชีนี้ไม่ใช่บัญชีผู้ปกครอง' };
    }
    return { ok: true, studentId: String(claims.studentId) };
  } catch (e) {
    const msg = {
      'auth/invalid-credential':     'รหัสนักเรียนหรือ PIN ไม่ถูกต้อง',
      'auth/user-not-found':         'รหัสนักเรียนหรือ PIN ไม่ถูกต้อง',
      'auth/wrong-password':         'รหัสนักเรียนหรือ PIN ไม่ถูกต้อง',
      'auth/invalid-email':          'รหัสนักเรียนไม่ถูกต้อง',
      'auth/too-many-requests':      'ลองผิดหลายครั้งเกินไป กรุณารอสักครู่แล้วลองใหม่',
      'auth/network-request-failed': 'ไม่มีการเชื่อมต่ออินเทอร์เน็ต',
    }[e.code];
    return { ok: false, message: msg ?? 'เข้าสู่ระบบไม่สำเร็จ' };
  }
}

/** ผู้ปกครอง: ดึงข้อมูลเฉพาะบุตรหลานของตัวเอง (parentView) */
export async function fetchMyChild() {
  const claims = (await auth?.currentUser?.getIdTokenResult())?.claims ?? {};
  if (claims.role !== 'parent' || !claims.studentId) {
    return { ok: false, message: 'ต้องเข้าสู่ระบบในฐานะผู้ปกครอง' };
  }
  return pullParentView(String(claims.studentId));
}

/** claims ของผู้ที่ล็อกอินอยู่ (role, className, studentId) */
export async function currentClaims() {
  const t = await auth?.currentUser?.getIdTokenResult(true);
  return t?.claims ?? {};
}
