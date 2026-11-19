/**
 * Firebase initialisation — KinderTrack
 * ทั้ง Firestore (ฐานข้อมูล) และ Auth (ล็อกอิน)
 */
import { initializeApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

// ตรวจสอบว่า config ครบไหม
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.apiKey !== 'your-api-key'
);

// Init เฉพาะเมื่อ config ครบ
let _app = null, _db = null, _auth = null, _storage = null;

if (isFirebaseConfigured) {
  try {
    const app  = initializeApp(firebaseConfig);
    _app       = app;
    // ignoreUndefinedProperties: ฟิลด์ที่เป็น undefined จะถูกข้าม แทนที่จะทำให้การบันทึกทั้งก้อนล้มเหลว
    // เครือข่ายบางแห่ง (พร็อกซี/ไฟร์วอลล์โรงเรียน) หน่วงสตรีมของ Firestore ทำให้บันทึกช้า 10–25 วินาที
    // → เปิด auto-detect long polling ให้ทุกเครื่อง และบังคับ long polling ได้รายเครื่องด้วย
    //   localStorage.setItem('kt_longpoll','1') แล้วรีเฟรช (ปิด: removeItem('kt_longpoll'))
    let forceLP = false;
    try { forceLP = localStorage.getItem('kt_longpoll') === '1'; } catch { /* ignore */ }
    _db        = initializeFirestore(app, forceLP
      ? { ignoreUndefinedProperties: true, experimentalForceLongPolling: true }
      : { ignoreUndefinedProperties: true, experimentalAutoDetectLongPolling: true });
    _auth      = getAuth(app);
    _storage   = getStorage(app);
  } catch (e) {
    console.warn('[KinderTrack] Firebase init failed:', e.message);
  }
}

export const firebaseApp = _app;
export const db      = _db;
export const auth    = _auth;
export const storage = _storage;
