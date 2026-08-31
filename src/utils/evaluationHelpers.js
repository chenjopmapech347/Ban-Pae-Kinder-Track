/** evaluationHelpers.js — daily stats & pct helpers */
import { todayISO } from './helpers';
// ── Daily stats helpers ───────────────────────────────────────────────────────
// คำนวณจำนวนวันและอัตรา % จาก records ที่มี structure:
// { [key]: { className, students: { [sid]: { days: { [day]: value } } } } }
// value: '√' = ทำ, '' = ไม่ทำ (แต่มา), 'X' = ขาด/ลา/ป่วย (auto-fill)
// → นับเฉพาะวันที่มา ('√' และ '') ใน total; 'X' ข้ามทั้ง total และ done
export function computeMonthlyStats(records, studentId, className) {
  let done = 0, total = 0;
  Object.values(records ?? {}).forEach(rec => {
    if (rec.className !== className) return;
    const sData = rec.students?.[String(studentId)];
    if (!sData?.days) return;
    Object.values(sData.days).forEach(v => {
      if (v === 'X') return;   // วันขาด/ลา/ป่วย — ไม่นับในตัวหาร ไม่ลดคะแนน
      total++;
      if (v === '√' || v === 'H') done++;   // นับ '√' = ทำจริง (รองรับข้อมูลเก่า 'H')
    });
  });
  return total > 0 ? { done, total, pct: Math.round(done / total * 100) } : null;
}
// คำนวณจำนวนเดือนที่มีข้อมูลน้ำหนัก/ส่วนสูงของนักเรียนใน nutritionRecords
// done = จำนวนครั้งที่บันทึกของนักเรียนคนนี้, total = จำนวนครั้งที่บันทึกทั้งหมดของห้อง
export function computeNutritionStats(records, studentId, className) {
  let done = 0, total = 0;
  Object.values(records ?? {}).forEach(rec => {
    if (rec.className !== className) return;
    total++;
    const sData = rec.students?.[String(studentId)];
    if (sData?.weight != null && sData.weight !== '') done++;
  });
  return total > 0 ? { done, total, pct: Math.round(done / total * 100) } : null;
}

// ── pickupRecords: { [YYYY-MM-DD]: { [studentId]: { note: '✓'|'C'|'X' } } }
// done = วันที่มีการบันทึกรับกลับ (note '✓' หรือ 'C'), total = วันที่บันทึกทั้งหมดของห้อง
export function computePickupStats(records, studentId, classStudentIds) {
  let done = 0, total = 0;
  const sidSet = new Set(classStudentIds.map(id => String(id)));
  Object.values(records ?? {}).forEach(dayRec => {
    const hasClassData = Object.keys(dayRec).some(id => sidSet.has(id));
    if (!hasClassData) return;
    total++;
    const rec = dayRec[String(studentId)];
    if (rec?.note && rec.note !== 'X') done++;
  });
  return total > 0 ? { done, total, pct: Math.round(done / total * 100) } : null;
}

// ── healthCheckRecords: { [key]: { className, students: { [sid]: { body, hair, cloth, ear, mouth, nail } } } }
// done = จำนวนครั้งที่ตรวจสุขภาพนักเรียน (มีค่าอย่างน้อย 1 รายการ), total = จำนวนครั้งของห้องนี้
export const HEALTH_ITEMS = ['body', 'hair', 'cloth', 'ear', 'mouth', 'nail'];
export function computeHealthCheckStats(records, studentId, className) {
  let done = 0, total = 0;
  Object.values(records ?? {}).forEach(rec => {
    if (rec.className !== className) return;
    total++;
    const sData = rec.students?.[String(studentId)];
    if (sData && HEALTH_ITEMS.some(k => sData[k] != null)) done++;
  });
  return total > 0 ? { done, total, pct: Math.round(done / total * 100) } : null;
}

// ── illnessCheckRecords: { [key]: { className, students: { [sid]: { [day]: { v } } } } }
// √=มาปกติ, C/H/D=มาแต่ป่วย, X=ขาด (ไม่นับ), ''=ว่าง (ไม่นับ)
// done = จำนวนวันที่มาและ "ไม่ป่วย" (v==='√'), total = จำนวนวันที่มา (√+C+H+D)
export function computeIllnessStats(records, studentId, className) {
  let done = 0, total = 0;
  Object.values(records ?? {}).forEach(rec => {
    if (rec.className !== className) return;
    const sData = rec.students?.[String(studentId)];
    if (!sData) return;
    Object.values(sData).forEach(dayEntry => {
      const v = typeof dayEntry === 'object' ? (dayEntry?.v ?? '') : (dayEntry ?? '');
      if (!v || v === 'X') return; // ว่าง / ขาด — ไม่นับ
      total++;                      // มาเรียน (√, C, H, D)
      if (v === '√') done++;        // ไม่ป่วย
    });
  });
  return total > 0 ? { done, total, pct: Math.round(done / total * 100) } : null;
}

// ── cornerRecords / innerCornerRecords: { [`${className}||${monday}`]: { [sid]: { [cornerKey]: bool } } }
// done = จำนวนสัปดาห์ที่นักเรียนใช้มุมอย่างน้อย 1 มุม, total = จำนวนสัปดาห์ทั้งหมดของห้อง
export function computeCornerStats(records, studentId, className) {
  let done = 0, total = 0;
  Object.entries(records ?? {}).forEach(([key, weekData]) => {
    const [cls] = key.split('||');
    if (cls !== className) return;
    total++;
    const sData = weekData[String(studentId)];
    if (sData && Object.values(sData).some(v => v === true)) done++;
  });
  return total > 0 ? { done, total, pct: Math.round(done / total * 100) } : null;
}

// ── specialEvents: { [id]: { scope, participants: { [sid]: bool }, ... } }
// done = จำนวนกิจกรรมที่นักเรียนเข้าร่วม, total = จำนวนกิจกรรมทั้งหมดที่เกี่ยวกับห้องนี้
export function computeEventStats(events, studentId, className) {
  let done = 0, total = 0;
  Object.values(events ?? {}).forEach(ev => {
    if (ev.scope !== 'all' && ev.scope !== className) return;
    total++;
    if (ev.participants?.[String(studentId)] === true) done++;
  });
  return total > 0 ? { done, total, pct: Math.round(done / total * 100) } : null;
}

// ── dailyRoutineRecords: { [key]: { className, days: { [dayNum]: { morning, exercise, ... } } } }
// class-level (ไม่แยกรายนักเรียน) — done = จำนวนวันที่ทำกิจกรรมนั้น, total = จำนวนวันทั้งหมดที่บันทึก
export function computeRoutineStats(records, className, activityKey) {
  let done = 0, total = 0;
  Object.values(records ?? {}).forEach(rec => {
    if (rec.className !== className) return;
    Object.values(rec.days ?? {}).forEach(dayData => {
      total++;
      if (dayData?.[activityKey] === true) done++;
    });
  });
  return total > 0 ? { done, total, pct: Math.round(done / total * 100) } : null;
}

export function pctColor(pct) {
  return pct == null ? '#9ca3af' : pct >= 80 ? '#059669' : pct >= 60 ? '#b45309' : '#dc2626';
}
export function pctBg(pct) {
  return pct == null ? '#f3f4f6' : pct >= 80 ? '#d1fae5' : pct >= 60 ? '#fef3c7' : '#fee2e2';
}
export function pctToScore(pct) {
  return pct == null ? 3 : pct >= 80 ? 3 : pct >= 60 ? 2 : 1;
}

