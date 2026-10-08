/**
 * import_อ31_กค2569_firestore.mjs
 * นำเข้าข้อมูล อ.3/1 กรกฎาคม 2569 เข้า Firestore โดยตรง
 *
 * รันด้วย: node import_อ31_กค2569_firestore.mjs
 * (รันจาก ~/Desktop/Project/kinder-track/)
 */

import { initializeApp } from './node_modules/firebase/app/dist/esm/index.esm.js';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp }
  from './node_modules/firebase/firestore/dist/esm/index.esm.js';

// ─── Firebase config (จาก .env) ──────────────────────────────────────────────
const firebaseConfig = {
  apiKey:            "AIzaSyB4zokDQo4AcUuOhw-mmheD_mxDZ1gzVP4",
  authDomain:        "kinder-track-57770.firebaseapp.com",
  projectId:         "kinder-track-57770",
  storageBucket:     "kinder-track-57770.firebasestorage.app",
  messagingSenderId: "648130056832",
  appId:             "1:648130056832:web:db70b15f8f646ba9a00c65",
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

// ─── อ่าน academicYear จาก Firestore snapshot ────────────────────────────────
const snapRef = doc(db, 'schools', 'default', 'snapshots', 'latest');
console.log('📡 กำลังเชื่อมต่อ Firestore...');
const snapDoc = await getDoc(snapRef);
const AY = snapDoc.exists() ? (snapDoc.data().academicYear ?? '2569') : '2569';
console.log('📌 academicYear:', AY);

// ─── Keys ────────────────────────────────────────────────────────────────────
const ILL_KEY = `อ.3/1__${AY}__2569-07`;
const NUT_KEY = `อ.3/1__${AY}__2026-07-01`;
console.log('🔑 illness key:', ILL_KEY);
console.log('🔑 nutrition key:', NUT_KEY);

// ─── Illness data ─────────────────────────────────────────────────────────────
// 15 นักเรียน อ.3/1 | กรกฎาคม 2569 | วันเรียน 18 วัน
// √ = มาเรียน  C = ป่วย/หัวชั้น  X = ขาดเรียน
const illnessRecord = {
  id: ILL_KEY, className: 'อ.3/1', academicYear: AY, year: 2569, month: 7,
  students: {
    "1289": { weight: 18.5, height: 110.0, days: {
      "1":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "2":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "3":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "6":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "7":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "8":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "9":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "10":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "13":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "14":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "15":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "16":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "17":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "20":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "21":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "22":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "23":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "24":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
    }},
    "1291": { weight: 15.7, height: 109.0, days: {
      "1":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "2":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "3":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "6":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "7":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "8":{"v":"X","sep":0,"home":false,"fam":false,"note":""},
      "9":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "10":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "13":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "14":{"v":"X","sep":0,"home":false,"fam":false,"note":""},
      "15":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "16":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "17":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "20":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "21":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "22":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "23":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "24":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
    }},
    "1309": { weight: 18.0, height: 110.0, days: {
      "1":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "2":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "3":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "6":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "7":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "8":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "9":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "10":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "13":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "14":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "15":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "16":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "17":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "20":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "21":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "22":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "23":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "24":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
    }},
    "1312": { weight: 32.8, height: 120.0, days: {
      "1":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "2":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "3":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "6":{"v":"X","sep":0,"home":false,"fam":false,"note":""},
      "7":{"v":"C","sep":0,"home":false,"fam":false,"note":""},
      "8":{"v":"C","sep":0,"home":false,"fam":false,"note":""},
      "9":{"v":"C","sep":0,"home":false,"fam":false,"note":""},
      "10":{"v":"C","sep":0,"home":false,"fam":false,"note":""},
      "13":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "14":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "15":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "16":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "17":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "20":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "21":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "22":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "23":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "24":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
    }},
    "1315": { weight: 24.7, height: 115.0, days: {
      "1":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "2":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "3":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "6":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "7":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "8":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "9":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "10":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "13":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "14":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "15":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "16":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "17":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "20":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "21":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "22":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "23":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "24":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
    }},
    "1332": { weight: 25.7, height: 121.0, days: {
      "1":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "2":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "3":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "6":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "7":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "8":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "9":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "10":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "13":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "14":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "15":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "16":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "17":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "20":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "21":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "22":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "23":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "24":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
    }},
    "1334": { weight: 20.8, height: 109.0, days: {
      "1":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "2":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "3":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "6":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "7":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "8":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "9":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "10":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "13":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "14":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "15":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "16":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "17":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "20":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "21":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "22":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "23":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "24":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
    }},
    "1335": { weight: 18.8, height: 111.0, days: {
      "1":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "2":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "3":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "6":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "7":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "8":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "9":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "10":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "13":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "14":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "15":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "16":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "17":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "20":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "21":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "22":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "23":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "24":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
    }},
    "1303": { weight: 42.4, height: 118.0, days: {
      "1":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "2":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "3":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "6":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "7":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "8":{"v":"C","sep":0,"home":false,"fam":false,"note":""},
      "9":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "10":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "13":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "14":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "15":{"v":"C","sep":0,"home":false,"fam":false,"note":""},
      "16":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "17":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "20":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "21":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "22":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "23":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "24":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
    }},
    "1302": { weight: 15.0, height: 101.0, days: {
      "1":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "2":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "3":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "6":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "7":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "8":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "9":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "10":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "13":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "14":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "15":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "16":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "17":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "20":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "21":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "22":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "23":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "24":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
    }},
    "1299": { weight: 14.7, height: 105.0, days: {
      "1":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "2":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "3":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "6":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "7":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "8":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "9":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "10":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "13":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "14":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "15":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "16":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "17":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "20":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "21":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "22":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "23":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "24":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
    }},
    "1254": { weight: 30.6, height: 119.0, days: {
      "1":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "2":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "3":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "6":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "7":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "8":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "9":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "10":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "13":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "14":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "15":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "16":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "17":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "20":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "21":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "22":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "23":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "24":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
    }},
    "1321": { weight: 19.0, height: 111.0, days: {
      "1":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "2":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "3":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "6":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "7":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "8":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "9":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "10":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "13":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "14":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "15":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "16":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "17":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "20":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "21":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "22":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "23":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "24":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
    }},
    "1342": { weight: 21.0, height: 121.0, days: {
      "1":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "2":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "3":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "6":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "7":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "8":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "9":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "10":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "13":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "14":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "15":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "16":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "17":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "20":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "21":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "22":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "23":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "24":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
    }},
    "1344": { weight: 24.7, height: 115.0, days: {
      "1":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "2":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "3":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "6":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "7":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "8":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "9":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "10":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "13":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "14":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "15":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "16":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "17":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "20":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "21":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "22":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "23":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
      "24":{"v":"√","sep":0,"home":false,"fam":false,"note":""},
    }},
  }
};

// ─── Nutrition data ───────────────────────────────────────────────────────────
const nutritionRecord = {
  id: NUT_KEY, className: 'อ.3/1', academicYear: AY, assessmentDate: '2026-07-01',
  students: {
    "1289": { ageYear:"5", ageMonth:"11", weight:18.5, height:110.0, weightForAge:"น้ำหนักตามเกณฑ์", heightForAge:"ส่วนสูงตามเกณฑ์", weightForHeight:"สมส่วน" },
    "1291": { ageYear:"6", ageMonth:"0",  weight:15.7, height:109.0, weightForAge:"น้ำหนักค่อนข้างน้อย", heightForAge:"ส่วนสูงตามเกณฑ์", weightForHeight:"ค่อนข้างผอม" },
    "1309": { ageYear:"5", ageMonth:"7",  weight:18.0, height:110.0, weightForAge:"น้ำหนักตามเกณฑ์", heightForAge:"ส่วนสูงตามเกณฑ์", weightForHeight:"สมส่วน" },
    "1312": { ageYear:"6", ageMonth:"1",  weight:32.8, height:120.0, weightForAge:"น้ำหนักมากเกินเกณฑ์", heightForAge:"ค่อนข้างสูง", weightForHeight:"อ้วน" },
    "1315": { ageYear:"5", ageMonth:"8",  weight:24.7, height:115.0, weightForAge:"น้ำหนักมากกว่าเกณฑ์", heightForAge:"ส่วนสูงตามเกณฑ์", weightForHeight:"ท้วม" },
    "1332": { ageYear:"5", ageMonth:"9",  weight:25.7, height:121.0, weightForAge:"น้ำหนักมากกว่าเกณฑ์", heightForAge:"ค่อนข้างสูง", weightForHeight:"สมส่วน" },
    "1334": { ageYear:"5", ageMonth:"5",  weight:20.8, height:109.0, weightForAge:"น้ำหนักมากกว่าเกณฑ์", heightForAge:"ส่วนสูงตามเกณฑ์", weightForHeight:"สมส่วน" },
    "1335": { ageYear:"5", ageMonth:"11", weight:18.8, height:111.0, weightForAge:"น้ำหนักตามเกณฑ์", heightForAge:"ส่วนสูงตามเกณฑ์", weightForHeight:"สมส่วน" },
    "1303": { ageYear:"5", ageMonth:"6",  weight:42.4, height:118.0, weightForAge:"น้ำหนักมากเกินเกณฑ์", heightForAge:"ส่วนสูงตามเกณฑ์", weightForHeight:"อ้วน" },
    "1302": { ageYear:"5", ageMonth:"11", weight:15.0, height:101.0, weightForAge:"น้ำหนักตามเกณฑ์", heightForAge:"ส่วนสูงตามเกณฑ์", weightForHeight:"สมส่วน" },
    "1299": { ageYear:"5", ageMonth:"10", weight:14.7, height:105.0, weightForAge:"น้ำหนักตามเกณฑ์", heightForAge:"ส่วนสูงตามเกณฑ์", weightForHeight:"ผอม" },
    "1254": { ageYear:"6", ageMonth:"8",  weight:30.6, height:119.0, weightForAge:"น้ำหนักมากเกินเกณฑ์", heightForAge:"ค่อนข้างสูง", weightForHeight:"อ้วน" },
    "1321": { ageYear:"5", ageMonth:"7",  weight:19.0, height:111.0, weightForAge:"น้ำหนักตามเกณฑ์", heightForAge:"ส่วนสูงตามเกณฑ์", weightForHeight:"สมส่วน" },
    "1342": { ageYear:"5", ageMonth:"9",  weight:21.0, height:121.0, weightForAge:"น้ำหนักมากกว่าเกณฑ์", heightForAge:"ค่อนข้างสูง", weightForHeight:"สมส่วน" },
    "1344": { ageYear:"5", ageMonth:"9",  weight:24.7, height:115.0, weightForAge:"น้ำหนักมากกว่าเกณฑ์", heightForAge:"ส่วนสูงตามเกณฑ์", weightForHeight:"ท้วม" },
  }
};

// ─── Merge into Firestore dailyData ──────────────────────────────────────────
const dailyRef = doc(db, 'schools', 'default', 'dailyData', 'latest');
const dailyDoc = await getDoc(dailyRef);
const existing = dailyDoc.exists() ? dailyDoc.data() : {};

const merged = {
  ...existing,
  illnessCheckRecords: {
    ...(existing.illnessCheckRecords || {}),
    [ILL_KEY]: illnessRecord,
  },
  nutritionRecords: {
    ...(existing.nutritionRecords || {}),
    [NUT_KEY]: nutritionRecord,
  },
  updatedAt: serverTimestamp(),
};

await setDoc(dailyRef, merged, { merge: true });
console.log('✅ Illness อ.3/1 ก.ค.2569 → Firestore OK');
console.log('✅ Nutrition อ.3/1 ก.ค.2569 → Firestore OK');

// NOTE: ข้าม snapshot/latest เพราะเอกสารใหญ่เกิน Firestore index limit
// ข้อมูลอยู่ใน dailyData/latest แล้ว — app จะ pull ได้ปกติ

console.log('\n🎉 Done! ข้อมูลเข้า dailyData/latest แล้ว');
console.log('   → เปิด KinderTrack แล้วกด "ดึงข้อมูลจาก Firebase" (sync) หรือ reload ครับ');
process.exit(0);
