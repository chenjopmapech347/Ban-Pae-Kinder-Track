/**
 * firebaseAuth.js — Firebase Auth helpers สำหรับ Admin/Teacher
 */
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from './firebase';

/**
 * ล็อกอินด้วย email + password
 */
export async function firebaseLogin(email, password) {
  if (!isFirebaseConfigured || !auth) {
    return { ok: false, message: 'Firebase ยังไม่ได้ตั้งค่า' };
  }
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return { ok: true, user: cred.user };
  } catch (e) {
    const msg = {
      'auth/invalid-credential':       'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
      'auth/user-not-found':           'ไม่พบบัญชีนี้',
      'auth/wrong-password':           'รหัสผ่านไม่ถูกต้อง',
      'auth/too-many-requests':        'พยายามล็อกอินหลายครั้งเกินไป ลองใหม่ภายหลัง',
      'auth/network-request-failed':   'ไม่มีการเชื่อมต่ออินเตอร์เน็ต',
    }[e.code] ?? e.message;
    return { ok: false, message: msg };
  }
}

/**
 * สร้างบัญชีใหม่ (admin ใช้ใน SettingsPage)
 */
export async function firebaseCreateUser(email, password) {
  if (!isFirebaseConfigured || !auth) {
    return { ok: false, message: 'Firebase ยังไม่ได้ตั้งค่า' };
  }
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    return { ok: true, user: cred.user };
  } catch (e) {
    const msg = {
      'auth/email-already-in-use': 'อีเมลนี้ใช้งานแล้ว',
      'auth/weak-password':        'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร',
      'auth/invalid-email':        'รูปแบบอีเมลไม่ถูกต้อง',
    }[e.code] ?? e.message;
    return { ok: false, message: msg };
  }
}

/**
 * ออกจากระบบ Firebase
 */
export async function firebaseLogout() {
  if (!auth) return;
  try { await signOut(auth); } catch { /* ignore */ }
}

/**
 * ส่งอีเมล reset รหัสผ่าน
 */
export async function firebaseSendReset(email) {
  if (!isFirebaseConfigured || !auth) {
    return { ok: false, message: 'Firebase ยังไม่ได้ตั้งค่า' };
  }
  try {
    await sendPasswordResetEmail(auth, email);
    return { ok: true };
  } catch (e) {
    return { ok: false, message: e.message };
  }
}

/**
 * Subscribe auth state (ใช้ใน AppContext)
 */
export function onFirebaseAuthChange(callback) {
  if (!auth) return () => {};
  return onAuthStateChanged(auth, callback);
}

/** ดู current user */
export function getCurrentFirebaseUser() {
  return auth?.currentUser ?? null;
}
