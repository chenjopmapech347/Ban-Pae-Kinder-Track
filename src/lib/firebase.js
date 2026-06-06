/**
 * Firebase initialisation — KinderTrack
 * ทั้ง Firestore (ฐานข้อมูล) และ Auth (ล็อกอิน)
 */
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

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
let _db = null, _auth = null;

if (isFirebaseConfigured) {
  try {
    const app = initializeApp(firebaseConfig);
    _db   = getFirestore(app);
    _auth = getAuth(app);
  } catch (e) {
    console.warn('[KinderTrack] Firebase init failed:', e.message);
  }
}

export const db   = _db;
export const auth = _auth;
