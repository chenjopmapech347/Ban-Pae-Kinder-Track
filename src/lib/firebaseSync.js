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
  doc, setDoc, getDoc, getDocFromServer, getDocs, getDocsFromServer, serverTimestamp, collection, deleteField,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';

const SCHOOL_ID = 'default'; // เปลี่ยนได้ถ้ามีหลายโรงเรียน

function snapshotRef()  { return doc(db, 'schools', SCHOOL_ID, 'snapshots', 'latest'); }
function dailyDataRef() { return doc(db, 'schools', SCHOOL_ID, 'dailyData', 'latest'); }   // เอกสารเดิม (อ่านอย่างเดียว — เต็ม 1MB แล้ว)
function dailyColRef()  { return collection(db, 'schools', SCHOOL_ID, 'dailyData'); }

// ── แบ่งข้อมูลรายวันเป็นหลายเอกสาร (shard) เพราะเอกสารเดียวจำกัด 1MB ──────────────────────────
// id = `${field}__${bucket}` — key ที่มีวันที่ (YYYY-MM-DD) แบ่งตามครึ่งเดือน, key อื่นแบ่งด้วย hash 8 กลุ่ม
function bucketOf(key) {
  const m = /(\d{4})-(\d{2})-(\d{2})/.exec(String(key));
  if (m) return `${m[1]}-${m[2]}${Number(m[3]) <= 15 ? 'a' : 'b'}`;
  let h = 0;
  const str = String(key);
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return `k${h % 8}`;
}
function shardId(field, bucket) { return `${field}__${bucket}`; }

// แปลงข้อความ error ของ Firestore ให้อ่านง่าย (โดยเฉพาะเอกสารเกิน 1MB)
function friendlyErr(e) {
  const msg = e?.message ?? String(e);
  if (/exceeds the maximum|cannot be written because its size/i.test(msg)) {
    const path = /documents\/([^\s'"]+)/.exec(msg)?.[1] ?? '';
    return `เอกสารบนฐานข้อมูลเต็ม (เกิน 1MB) ${path ? '[' + path + '] ' : ''}— แจ้งผู้ดูแลระบบ`;
  }
  return msg;
}

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

// ความลับที่ห้ามอยู่บน Firebase (เอกสารอ่านได้สาธารณะ) — เก็บเฉพาะในเครื่อง
const LOCAL_ONLY_KEYS = ['authConfig', 'imgbbApiKey'];
function stripSecrets(obj) {
  const out = { ...obj };
  LOCAL_ONLY_KEYS.forEach(k => { delete out[k]; });
  return out;
}

const BACKUP_INDEX_ID = 'backupIndex';
const BACKUP_MIN_INTERVAL_MS = 30 * 60 * 1000; // เขียน backup ซ้ำไม่เกินทุก 30 นาที/เครื่อง
let lastBackupAt = 0;

function backupIndexRef() { return doc(db, 'schools', SCHOOL_ID, 'dailyData', BACKUP_INDEX_ID); }

function writeDailyBackup(data, payload) {
  const now = Date.now();
  if (now - lastBackupAt < BACKUP_MIN_INTERVAL_MS) return;
  lastBackupAt = now;
  const dateKey = new Date().toISOString().slice(0, 10);
  const meta = {
    exportedAt: payload.exportedAt ?? new Date().toISOString(),
    backupDate: dateKey,
    studentCount: Array.isArray(payload.students) ? payload.students.length : 0,
    attendanceCount: payload.dailyRecords ? Object.keys(payload.dailyRecords).length : 0,
  };
  setDoc(doc(db, 'schools', SCHOOL_ID, 'snapshots', dateKey), { ...data, backupDate: dateKey })
    .then(() => setDoc(backupIndexRef(), { [dateKey]: meta }, { merge: true }))
    .catch(() => { lastBackupAt = 0; });
}

/**
 * อัปโหลดข้อมูลทั้งหมดขึ้น Firestore
 */
export async function pushSnapshotToFirebase(payload) {
  if (!isFirebaseConfigured || !db) {
    return { ok: false, message: 'Firebase ยังไม่ได้ตั้งค่า — กรุณาสร้าง .env' };
  }
  try {
    // JSON round-trip: ตัดค่า undefined ออก (Firestore ไม่รับ undefined) — ข้อมูลทั้งหมดเป็น JSON ล้วนอยู่แล้ว
    const clean = JSON.parse(JSON.stringify(stripSecrets(payload)));
    const data = { ...clean, updatedAt: serverTimestamp() };
    // merge: true — field ที่ไม่ได้ส่ง (เช่น activities ว่างเปล่า) จะคงอยู่ใน Firestore ไม่ถูกลบ
    // ยกเว้นความลับ: สั่งลบของเดิมที่เคยอัปไว้ด้วย deleteField()
    const latestData = { ...data };
    LOCAL_ONLY_KEYS.forEach(k => { latestData[k] = deleteField(); });
    await setDoc(snapshotRef(), latestData, { merge: true });

    // สำรองรายวัน — 1 เอกสารต่อวัน (id = YYYY-MM-DD) เขียนทับด้วยสถานะล่าสุดของวันนั้น
    // non-blocking เพื่อไม่ให้ backup failure ทำให้ sync แสดงเป็น error
    writeDailyBackup(data, clean);

    return { ok: true, message: 'อัปโหลดสำเร็จ ✅' };
  } catch (e) {
    return { ok: false, message: 'อัปโหลดไม่สำเร็จ: ' + friendlyErr(e) };
  }
}

/**
 * รายการ daily backup ทั้งหมดใน Firestore (ยกเว้น 'latest')
 * returns { ok, backups: [{ id, exportedAt, backupDate, studentCount }] }
 */
export async function listDailyBackups() {
  if (!isFirebaseConfigured || !db) return { ok: false, backups: [] };
  try {
    // อ่านเฉพาะเอกสาร index เล็ก ๆ 1 ตัว — ไม่ดึง backup ทั้งคอลเลกชัน
    const snap = await getDoc(backupIndexRef());
    const idx = snap.exists() ? snap.data() : {};
    const backups = Object.entries(idx)
      .filter(([k, v]) => /^\d{4}-\d{2}-\d{2}$/.test(k) && v && typeof v === 'object')
      .map(([id, v]) => ({
        id,
        exportedAt: v.exportedAt ?? null,
        backupDate: v.backupDate ?? id,
        studentCount: v.studentCount ?? 0,
        attendanceCount: v.attendanceCount ?? 0,
      }));
    backups.sort((x, y) => y.id.localeCompare(x.id));
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
    const { updatedAt, ...raw } = snap.data();
    const payload = stripSecrets(raw);
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
// ลายนิ้วมือ (JSON) ของแต่ละ key ที่ส่ง/ดึงมาแล้ว — ส่งเฉพาะ key ที่เปลี่ยน แทนการส่งทั้งก้อนทุกครั้งที่บันทึก
const dailySent = new Map();   // field -> Map(key -> json)
function sentMap(field) {
  if (!dailySent.has(field)) dailySent.set(field, new Map());
  return dailySent.get(field);
}

/** ตั้งฐานอ้างอิงจากข้อมูลที่ดึงมาจากเซิร์ฟเวอร์ → การบันทึกครั้งแรกไม่ต้องส่งทั้งก้อน */
export function seedDailyBaseline(payload) {
  DAILY_FIELDS.forEach((field) => {
    const val = payload?.[field];
    if (!val || typeof val !== 'object') return;
    const m = sentMap(field);
    Object.entries(val).forEach(([k, v]) => { m.set(k, JSON.stringify(v)); });
  });
}

export async function pushDailyDataToFirebase(dailyData) {
  if (!isFirebaseConfigured || !db) return { ok: false };
  try {
    // setDoc + merge:true = merge ระดับ key ของแมป (Device A ไม่ลบ key ของ Device B)
    // ห้ามใช้ updateDoc + dot-notation: key เช่น 'อ.1/1__2569__2026-11-01' มี '.' และ '/'
    // ส่งเฉพาะ key ที่เปลี่ยนจากที่เคยส่ง/ดึงมาแล้ว (delta) และเขียนลง shard ตามช่วงวันที่ — ไม่ชนขีดจำกัด 1MB
    const shards = new Map();   // shardId -> { field, delta, staged }
    for (const field of DAILY_FIELDS) {
      const val = dailyData[field];
      if (!val || typeof val !== 'object') continue;
      const m = sentMap(field);
      for (const [k, v] of Object.entries(val)) {
        const json = JSON.stringify(v);
        if (m.get(k) === json) continue;
        const id = shardId(field, bucketOf(k));
        if (!shards.has(id)) shards.set(id, { field, delta: {}, staged: [] });
        const sh = shards.get(id);
        sh.delta[k] = JSON.parse(json);
        sh.staged.push([field, k, json]);
      }
    }
    if (shards.size === 0) return { ok: true }; // ไม่มีข้อมูลใหม่ — ข้าม
    let firstErr = null;
    await Promise.all([...shards.entries()].map(async ([id, sh]) => {
      try {
        await setDoc(doc(db, 'schools', SCHOOL_ID, 'dailyData', id),
          { field: sh.field, updatedAt: serverTimestamp(), data: sh.delta }, { merge: true });
        sh.staged.forEach(([field, k, json]) => sentMap(field).set(k, json));   // จำเฉพาะ shard ที่เขียนสำเร็จ
      } catch (e) { firstErr = firstErr ?? e; }
    }));
    if (firstErr) return { ok: false, message: friendlyErr(firstErr) };
    return { ok: true };
  } catch (e) {
    return { ok: false, message: friendlyErr(e) };
  }
}

/**
 * ดึงข้อมูลรายวัน (volatile) จาก Firestore โดยตรง (bypass cache)
 */
export async function pullDailyDataFromFirebase() {
  if (!isFirebaseConfigured || !db) return { ok: true, payload: {} };
  try {
    // 1) เอกสารเดิม dailyData/latest (ข้อมูลก่อนแบ่ง shard)  2) shard ใหม่ — ค่าใน shard ทับค่าเดิมในระดับ key
    const [legacySnap, shardSnap] = await Promise.all([
      getDocFromServer(dailyDataRef()),
      getDocsFromServer(dailyColRef()),
    ]);
    const raw = legacySnap.exists() ? { ...legacySnap.data() } : {};
    delete raw.updatedAt;
    const payload = stripSecrets(raw);
    shardSnap.forEach((d) => {
      const x = d.data();
      if (!x?.field || !DAILY_FIELDS.includes(x.field) || !x.data) return;
      payload[x.field] = { ...(payload[x.field] ?? {}), ...x.data };
    });
    return { ok: true, payload };
  } catch (e) {
    return { ok: false, payload: {}, message: friendlyErr(e) };
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
    const { updatedAt, ...raw } = snap.data();
    const payload = stripSecrets(raw);
    const ts = updatedAt?.toDate?.()?.toLocaleString('th-TH') ?? '—';
    return { ok: true, payload, updatedAt: ts };
  } catch (e) {
    return { ok: false, message: 'ดึงข้อมูลไม่สำเร็จ: ' + e.message };
  }
}

// ── parentView: ข้อมูลรายบุตรหลานสำหรับผู้ปกครอง (เขียนโดยแอปของครู/แอดมิน) ──
// schools/default/parentView/{studentId} — rules ให้ผู้ปกครองอ่านได้เฉพาะเอกสารของตัวเอง
function parentViewRef(sid) { return doc(db, 'schools', SCHOOL_ID, 'parentView', String(sid)); }

const pvHash = new Map();   // studentId -> JSON ล่าสุดที่เขียนแล้ว (เขียนเฉพาะที่เปลี่ยน)
let pvTimer = null;
let pvLastRun = 0;
let pvPending = null;
const PV_MIN_INTERVAL_MS = 60 * 1000;

async function runParentViews({ students, teachers, announcements, dailyRecords, schoolName }, className) {
  const teachersLite = (teachers || []).map(t => ({ id: t.id, name: t.name, className: t.className, level: t.level }));
  const list = (students || []).filter(s => !className || s.className === className);
  const jobs = [];
  for (const s of list) {
    const sid = String(s.id);
    const { parentPin: _p, nationalId: _n, ...safe } = s;
    const dr = {};
    Object.entries(dailyRecords || {}).forEach(([date, byStudent]) => {
      if (byStudent && byStudent[sid] !== undefined) dr[date] = { [sid]: byStudent[sid] };
    });
    const view = {
      student: safe,
      teachers: teachersLite.filter(t => t.className === s.className),
      announcements: announcements || [],
      dailyRecords: dr,
      schoolName: schoolName || '',
    };
    const str = JSON.stringify(view);
    if (pvHash.get(sid) === str) continue;
    jobs.push(() => setDoc(parentViewRef(sid), { ...view, updatedAt: serverTimestamp() })
      .then(() => { pvHash.set(sid, str); }));
  }
  for (let i = 0; i < jobs.length; i += 20) {
    await Promise.allSettled(jobs.slice(i, i + 20).map(j => j()));
  }
}

/** เรียกหลัง sync ปกติ — จำกัดไม่เกินนาทีละครั้ง ครูเขียนเฉพาะห้องตัวเอง (className) แอดมินเขียนทุกห้อง */
export function scheduleParentViewPush(source, className = null) {
  if (!isFirebaseConfigured || !db) return;
  pvPending = { source, className };
  if (pvTimer) return;
  const wait = Math.max(0, PV_MIN_INTERVAL_MS - (Date.now() - pvLastRun));
  pvTimer = setTimeout(() => {
    pvTimer = null; pvLastRun = Date.now();
    const job = pvPending; pvPending = null;
    if (job) runParentViews(job.source, job.className).catch(() => {});
  }, wait);
}

/** ผู้ปกครอง: อ่านเอกสารของบุตรหลานตัวเอง */
export async function pullParentView(studentId) {
  if (!isFirebaseConfigured || !db) return { ok: false, message: 'Firebase ยังไม่ได้ตั้งค่า' };
  try {
    const snap = await getDocFromServer(parentViewRef(studentId));
    if (!snap.exists()) return { ok: false, message: 'ยังไม่มีข้อมูล กรุณาให้ครูเปิดแอปเพื่อซิงก์ก่อน' };
    const { updatedAt: _u, student, ...rest } = snap.data();
    return { ok: true, payload: { ...rest, students: [student] } };
  } catch (e) {
    return { ok: false, message: e.message };
  }
}
