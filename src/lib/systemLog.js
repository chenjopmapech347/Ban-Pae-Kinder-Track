/**
 * systemLog.js — บันทึกการใช้งานระบบ (ใครทำอะไรเมื่อไร) ขึ้น Firestore ให้ทุกเครื่องเห็นรายการเดียวกัน
 * Firestore: schools/default/systemLogs/{id} → { id, ts, action, detail, userName, device, version, expireAt }
 * - เขียนแบบ fire-and-forget: ถ้าส่งไม่สำเร็จ (ออฟไลน์/ไม่มีสิทธิ์) เก็บคิวไว้ในเครื่องแล้วส่งใหม่ครั้งถัดไป ไม่กระทบการใช้งาน
 * - เก็บข้อความอย่างย่อ ไม่เก็บข้อมูลส่วนตัวของนักเรียนเกินชื่อที่แสดง
 */
import { collection, doc, getDocs, limit, orderBy, query, setDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { getDeviceId } from './syncLog';

const QUEUE_KEY = 'kt_systemLogQueue';
const MAX_QUEUE = 100;
const RETAIN_DAYS = 180;

function ls() { try { return window.localStorage; } catch { return null; } }
function readQueue() { try { return JSON.parse(ls()?.getItem(QUEUE_KEY) || '[]'); } catch { return []; } }
function writeQueue(q) { try { ls()?.setItem(QUEUE_KEY, JSON.stringify(q.slice(-MAX_QUEUE))); } catch { /* ignore */ } }

/** ชื่อผู้ใช้ที่แสดงในบันทึก เช่น "admin (ผู้ดูแลระบบ)" / "ครูสมชาย (ครู)" */
export function actorName(user, role) {
  const n = user?.name ?? '';
  if (!n) return '';
  if (role === 'admin') return /ผู้ดูแลระบบ/.test(n) ? n : `${n} (ผู้ดูแลระบบ)`;
  if (role === 'teacher') return `${n} (ครู)`;
  if (role === 'parent') return `${n} (ผู้ปกครอง)`;
  return n;
}

export function makeLogEntry(e) {
  return { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, ts: new Date().toISOString(), ...e };
}

async function sendOne(entry) {
  await setDoc(doc(db, 'schools', 'default', 'systemLogs', String(entry.id)), {
    ...entry,
    detail: String(entry.detail ?? '').slice(0, 300),
    device: getDeviceId(),
    version: typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '',
    expireAt: new Date(Date.now() + RETAIN_DAYS * 86400000).toISOString(),
  });
}

/** ส่งขึ้น Firestore (ไม่รอผล) */
export function pushSystemLog(entry) {
  if (!isFirebaseConfigured || !db) return;
  const pending = [...readQueue(), entry];
  writeQueue(pending);
  (async () => {
    const left = [];
    for (const e of pending) {
      try { await sendOne(e); } catch { left.push(e); }
    }
    writeQueue(left);
  })();
}

/** อ่านรายการล่าสุดจาก Firestore (ใหม่ → เก่า) */
export async function fetchSystemLogs(n = 500) {
  if (!isFirebaseConfigured || !db) return [];
  const snap = await getDocs(query(collection(db, 'schools', 'default', 'systemLogs'), orderBy('ts', 'desc'), limit(n)));
  return snap.docs.map(d => d.data());
}
