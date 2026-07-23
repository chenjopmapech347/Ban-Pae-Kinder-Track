/**
 * firebaseSync.js — push/pull app snapshot to/from Firestore
 *
 * โครงสร้าง Firestore:
 *   schools/{schoolId}/snapshots/latest   ← ข้อมูลทั้งหมด
 *   schools/{schoolId}/snapshots/{date}   ← backup รายวัน
 */
import {
  doc, setDoc, getDoc, serverTimestamp, collection, addDoc,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';

const SCHOOL_ID = 'default'; // เปลี่ยนได้ถ้ามีหลายโรงเรียน

function snapshotRef()  { return doc(db, 'schools', SCHOOL_ID, 'snapshots', 'latest'); }
function backupColRef() { return collection(db, 'schools', SCHOOL_ID, 'snapshots'); }

/**
 * อัปโหลดข้อมูลทั้งหมดขึ้น Firestore
 */
export async function pushSnapshotToFirebase(payload) {
  if (!isFirebaseConfigured || !db) {
    return { ok: false, message: 'Firebase ยังไม่ได้ตั้งค่า — กรุณาสร้าง .env' };
  }
  try {
    const data = { ...payload, updatedAt: serverTimestamp() };
    await setDoc(snapshotRef(), data);

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
