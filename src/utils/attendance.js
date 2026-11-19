import { getClassSchoolDays, holidayISOSet } from './helpers';

const ABSENT_STATUSES = ['ขาด', 'ลา', 'ป่วย'];

/** คำนวณสถิติมาเรียนจากบันทึกรายวันทั้งหมด */
export function recomputeAttendanceFromDailyRecords(dailyRecords, studentId) {
  let present = 0;
  let absent = 0;

  Object.values(dailyRecords).forEach((day) => {
    const rec = day[String(studentId)];
    if (!rec?.attendance) return;
    if (rec.attendance === 'มา') present += 1;
    else if (ABSENT_STATUSES.includes(rec.attendance)) absent += 1;
  });

  return { present, absent, total: present + absent };
}

export function getDayRecord(dailyRecords, date, studentId) {
  return dailyRecords[date]?.[String(studentId)] ?? null;
}

export function hasHygieneToday(record) {
  if (!record) return false;
  return Boolean(record.milk && record.brush);
}

export function mergeDayRecords(dailyRecords, date, patchByStudentId) {
  const day = { ...(dailyRecords[date] ?? {}) };
  Object.entries(patchByStudentId).forEach(([id, patch]) => {
    day[id] = { ...(day[id] ?? {}), ...patch };
  });
  return { ...dailyRecords, [date]: day };
}

/**
 * คำนวณสถิติมาเรียนของนักเรียนทุกคนด้วยนิยาม "วันเรียนจริงของห้อง" (เหมือนสมุดรายงานประจำตัว)
 *  - total  = จำนวนวันเรียนจริงของห้อง (เฉพาะวันที่ห้องมีบันทึก ไม่รวมเสาร์–อาทิตย์/วันหยุด/นอกช่วงเปิด–ปิดเรียน)
 *  - present = วันที่นักเรียนคนนั้น "มา" ในวันเรียนจริงเหล่านั้น
 *  - absent = total − present (ขาด/ลา/ป่วย/ไม่มีบันทึก)
 * คืนค่าอาร์เรย์เดิม (same reference) ถ้าไม่มีอะไรเปลี่ยน เพื่อไม่ให้เกิดการซิงค์ซ้ำโดยไม่จำเป็น
 */
export function recomputeAllAttendanceBySchoolDays(students, dailyRecords, terms, holidays) {
  if (!Array.isArray(students) || !dailyRecords || Object.keys(dailyRecords).length === 0) return students;
  const holidaySet = holidayISOSet(holidays);
  const idsByClass = {};
  students.forEach(s => {
    if (String(s.name ?? '').startsWith('(ว่าง)')) return;
    (idsByClass[s.className] ??= []).push(String(s.id));
  });
  const daysByClass = {};
  Object.entries(idsByClass).forEach(([cls, ids]) => {
    const d = getClassSchoolDays({ dailyRecords, studentIds: ids, terms: terms ?? [], holidaySet });
    daysByClass[cls] = [...d.term1, ...d.term2];
  });
  let changed = false;
  const next = students.map(s => {
    const days = daysByClass[s.className] ?? [];
    const sid = String(s.id);
    let present = 0;
    days.forEach(date => {
      const rec = dailyRecords[date]?.[sid];
      const att = rec?.attendance ?? rec?.status;
      if (att === 'มา' || att === 'present') present += 1;
    });
    const total = days.length;
    const cur = s.attendance;
    if (cur && cur.present === present && cur.total === total && cur.absent === total - present) return s;
    changed = true;
    return { ...s, attendance: { present, absent: total - present, total } };
  });
  return changed ? next : students;
}
