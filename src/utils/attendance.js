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
