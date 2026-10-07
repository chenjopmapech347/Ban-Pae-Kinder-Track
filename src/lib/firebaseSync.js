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
  doc, setDoc, getDoc, getDocFromServer, getDocs, serverTimestamp, collection, addDoc, updateDoc,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';

const SCHOOL_ID = 'default'; // เปลี่ยนได้ถ้ามีหลายโรงเรียน

function snapshotRef()  { return doc(db, 'schools', SCHOOL_ID, 'snapshots', 'latest'); }
function backupColRef() { return collection(db, 'schools', SCHOOL_ID, 'snapshots'); }
function dailyDataRef() { return doc(db, 'schools', SCHOOL_ID, 'dailyData', 'latest'); }

// ข้อมูลที่ครูบันทึกรายวัน — push ด้วย dot-notation updateDoc (key-level merge)
// แต่ละ device เขียนเฉพาะ key ของตัวเอง ไม่ทับ key ที่ device อื่นเขียนไว้
const DAILY_FIELDS = [
  'dailyRecords', 'nutritionRecords', 'milkRecords', 'lunchRecords',
  'toothBrushRecords', 'healthCheckRecords', 'illnessCheckRecords',
  'dailyRoutineRecords', 'cornerRecords', 'innerCornerRecords',
  'studentReportRecords', 'specialEvents', 'pickupRecords',
];

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
 * รายการ daily backup ทั้งหมดใน Firestore (ยกเว้น 'latest')
 * returns { ok, backups: [{ id, exportedAt, backupDate, studentCount }] }
 */
export async function listDailyBackups() {
  if (!isFirebaseConfigured || !db) return { ok: false, backups: [] };
  try {
    const snap = await getDocs(backupColRef());
    const backups = [];
    snap.forEach(d => {
      if (d.id === 'latest') return;
      const data = d.data();
      backups.push({
        id: d.id,
        exportedAt: data.exportedAt ?? null,
        backupDate: data.backupDate ?? null,
        studentCount: Array.isArray(data.students) ? data.students.length : 0,
        attendanceCount: data.dailyRecords ? Object.keys(data.dailyRecords).length : 0,
      });
    });
    backups.sort((a, b) => (b.exportedAt ?? '').localeCompare(a.exportedAt ?? ''));
    return { ok: true, backups };
  } catch (e) {
    return { ok: false, backups: [], message: e.message };
  }
}

/**
 * ดึง daily backup ตาม doc ID
 * returns { ok, payload }
 */
export async function pullDailyBackupById(docId) {
  if (!isFirebaseConfigured || !db) return { ok: false };
  try {
    const ref = doc(db, 'schools', SCHOOL_ID, 'snapshots', docId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return { ok: false, message: 'ไม่พบ backup นี้' };
    const { updatedAt, ...payload } = snap.data();
    return { ok: true, payload };
  } catch (e) {
    return { ok: false, message: e.message };
  }
}

/**
 * Push ข้อมูลรายวัน (volatile) ไปยัง dailyData/latest ด้วย dot-notation merge
 * ใช้ updateDoc เพื่อ merge ระดับ key — Device A เขียน key ของตัวเอง
 * ไม่ลบ key ที่ Device B เขียนไว้ (ต่างจาก setDoc ที่ replace ทั้ง field)
 */
export async function pushDailyDataToFirebase(dailyData) {
  if (!isFirebaseConfigured || !db) return { ok: false };
  try {
    // Flatten เป็น dot-notation: { 'dailyRecords.2024-05-01_อ.1_1': {...} }
    const updates = { updatedAt: serverTimestamp() };
    let hasData = false;
    for (const field of DAILY_FIELDS) {
      const val = dailyData[field];
      if (val && typeof val === 'object' && Object.keys(val).length > 0) {
        Object.entries(val).forEach(([k, v]) => { updates[`${field}.${k}`] = v; });
        hasData = true;
      }
    }
    if (!hasData) return { ok: true }; // ไม่มีข้อมูลใหม่ — ข้าม

    try {
      // updateDoc ทำ key-level merge — ล้มเหลวถ้า doc ยังไม่มี
      await updateDoc(dailyDataRef(), updates);
    } catch (e) {
      if (e.code === 'not-found') {
        // สร้าง doc ใหม่ครั้งแรก — ใช้ setDoc แทน
        const nested = { updatedAt: serverTimestamp() };
        for (const field of DAILY_FIELDS) {
          const val = dailyData[field];
          if (val && typeof val === 'object' && Object.keys(val).length > 0) nested[field] = val;
        }
        await setDoc(dailyDataRef(), nested);
      } else {
        throw e;
      }
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, message: e.message };
  }
}

/**
 * ดึงข้อมูลรายวัน (volatile) จาก Firestore โดยตรง (bypass cache)
 */
export async function pullDailyDataFromFirebase() {
  if (!isFirebaseConfigured || !db) return { ok: true, payload: {} };
  try {
    const snap = await getDocFromServer(dailyDataRef());
    if (!snap.exists()) return { ok: true, payload: {} };
    const { updatedAt, ...payload } = snap.data();
    return { ok: true, payload };
  } catch (e) {
    return { ok: false, payload: {}, message: e.message };
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
    const snap = await getDocFromServer(snapshotRef()); // force server — ข้าม browser cache
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
