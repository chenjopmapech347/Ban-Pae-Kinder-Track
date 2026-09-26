/**
 * firebaseSync.js — push/pull app snapshot to/from Firestore
 *
 * โครงสร้าง Firestore:
 *   schools/{schoolId}/snapshots/latest              ← ข้อมูลส่วนกลาง (ไม่มี assessments)
 *   schools/{schoolId}/snapshots/{date}              ← backup รายวัน
 *   schools/{schoolId}/classAssessments/{classKey}   ← คะแนนประเมินแยกรายห้อง
 *     { className, updatedAt, students: { [studentId]: { indicators: {...} } } }
 */
import {
  doc, setDoc, getDoc, getDocs, serverTimestamp, collection, addDoc,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';

const SCHOOL_ID = 'default'; // เปลี่ยนได้ถ้ามีหลายโรงเรียน

function snapshotRef()  { return doc(db, 'schools', SCHOOL_ID, 'snapshots', 'latest'); }
function backupColRef() { return collection(db, 'schools', SCHOOL_ID, 'snapshots'); }

// ชื่อห้องอาจมี "/" เช่น อ.1/1 → ใช้เป็น Firestore doc id ไม่ได้ → แปลงเป็น อ.1_1
function classKey(className) {
  return className.replace(/\//g, '_').replace(/\s+/g, '-');
}
function classAssessRef(className) {
  return doc(db, 'schools', SCHOOL_ID, 'classAssessments', classKey(className));
}
function classAssessColRef() {
  return collection(db, 'schools', SCHOOL_ID, 'classAssessments');
}

/**
 * บันทึกคะแนนประเมินของห้องหนึ่งขึ้น Firestore
 * assessments = { [studentId]: { indicators: { ... } } }
 */
export async function pushClassAssessments(className, assessments) {
  if (!isFirebaseConfigured || !db) return { ok: false };
  try {
    await setDoc(classAssessRef(className), {
      className,
      updatedAt: serverTimestamp(),
      students: assessments,
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, message: e.message };
  }
}

/**
 * ดึงคะแนนประเมินของห้องเดียว
 * returns { ok, students: { [studentId]: { indicators: {...} } } }
 */
export async function pullClassAssessments(className) {
  if (!isFirebaseConfigured || !db) return { ok: false, students: {} };
  try {
    const snap = await getDoc(classAssessRef(className));
    if (!snap.exists()) return { ok: true, students: {} };
    return { ok: true, students: snap.data().students ?? {} };
  } catch (e) {
    return { ok: false, students: {}, message: e.message };
  }
}

/**
 * ดึงคะแนนประเมินของทุกห้อง (สำหรับ admin)
 * returns { ok, students: { [studentId]: { indicators: {...} } } }  ← merged จากทุกห้อง
 */
export async function pullAllClassAssessments() {
  if (!isFirebaseConfigured || !db) return { ok: false, students: {} };
  try {
    const snap = await getDocs(classAssessColRef());
    const merged = {};
    snap.forEach(d => {
      const s = d.data().students ?? {};
      Object.assign(merged, s);
    });
    return { ok: true, students: merged };
  } catch (e) {
    return { ok: false, students: {}, message: e.message };
  }
}

/**
 * อัปโหลดข้อมูลทั้งหมดขึ้น Firestore
 */
export async function pushSnapshotToFirebase(payload) {
  if (!isFirebaseConfigured || !db) {
    return { ok: false, message: 'Firebase ยังไม่ได้ตั้งค่า — กรุณาสร้าง .env' };
  }
  try {
    const data = { ...payload, updatedAt: serverTimestamp() };
    // merge: true — field ที่ไม่ได้ส่ง (เช่น activities ว่างเปล่า) จะคงอยู่ใน Firestore ไม่ถูกลบ
    await setDoc(snapshotRef(), data, { merge: true });

    // สำรองรายวัน — non-blocking เพื่อไม่ให้ backup failure ทำให้ sync แสดงเป็น error
    const dateKey = new Date().toISOString().slice(0, 10);
    addDoc(backupColRef(), { ...data, backupDate: dateKey }).catch(() => {});

    return { ok: true, message: 'อัปโหลดสำเร็จ ✅' };
  } catch (e) {
    return { ok: false, message: 'อัปโหลดไม่สำเร็จ: ' + e.message };
  }
}

/**
 * ดึงข้อมูลล่าสุดจาก Firestore
 */
export async function pullSnapshotFromFirebase() {
  if (!isFirebaseConfigured || !db) {
    return { ok: false, message: 'Firebase ยังไม่ได้ตั้งค่า — กรุณาสร้าง .env' };
  }
  try {
    const snap = await getDoc(snapshotRef());
    if (!snap.exists()) {
      return { ok: false, message: 'ยังไม่มีข้อมูลบน Cloud — อัปโหลดก่อน' };
    }
    const { updatedAt, ...payload } = snap.data();
    const ts = updatedAt?.toDate?.()?.toLocaleString('th-TH') ?? '—';
    return { ok: true, payload, updatedAt: ts };
  } catch (e) {
    return { ok: false, message: 'ดึงข้อมูลไม่สำเร็จ: ' + e.message };
  }
}
