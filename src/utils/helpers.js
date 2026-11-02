/**
 * ตรวจสอบว่านักเรียนยังเรียนอยู่ ณ วันที่ dateISO (YYYY-MM-DD)
 * - ปกติ → true เสมอ
 * - ลาออก → true ก็ต่อเมื่อ dateISO < withdrawDate (ก่อนวันลาออก)
 * - นอกระบบ → false เสมอ
 */
export function isStudentActive(student, dateISO) {
  const st = student?.status ?? 'ปกติ';
  if (st === 'นอกระบบ') return false;
  if (st === 'ลาออก') {
    if (!student.withdrawDate) return false;
    return dateISO < student.withdrawDate;
  }
  return true; // ปกติ
}

export function getLevelColor(level) {
  switch (level) {
    case 'K1':
      return 'badge-k1';
    case 'K2':
      return 'badge-k2';
    case 'K3':
      return 'badge-k3';
    default:
      return '';
  }
}

export function getQualityText(score) {
  if (score === 3) return 'ดี';
  if (score === 2) return 'พอใช้';
  return 'ควรส่งเสริม';
}

export function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const THAI_MONTHS_LONG = [
  '','มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
  'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม',
];
export function formatDateThai(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  const day   = parseInt(d, 10);
  const month = parseInt(m, 10);
  const year  = parseInt(y, 10) + 543;
  return `${day} ${THAI_MONTHS_LONG[month]} ${year}`;
}

/** หา Monday ของสัปดาห์ที่ dateStr อยู่ (YYYY-MM-DD) */
export function getMondayOf(dateStr) {
  const d = new Date(dateStr);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

/** ป้ายกำกับสัปดาห์ จันทร์–ศุกร์ เช่น "2 มิ.ย. – 6 มิ.ย." */
export function getWeekLabel(mondayStr) {
  const d = new Date(mondayStr);
  const end = new Date(d); end.setDate(d.getDate() + 4); // จันทร์ + 4 = ศุกร์
  const fmt = (x) => x.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
  return `${fmt(d)} – ${fmt(end)}`;
}

/** สร้าง unique key สำหรับ corner/item ใหม่ */
export function genUniqueKey(prefix = 'key') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// ── Thai date helpers (short format) ─────────────────────────────────────────
const THAI_MONTHS_SHORT = [
  '','ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.',
  'ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.',
];

/** แปลง ค.ศ. → พ.ศ. */
export function thaiYear(adYear) { return adYear + 543; }

/** เลขเดือน → ชื่อเดือนย่อ (1 → 'ม.ค.') */
export function thaiMonthShort(m) { return THAI_MONTHS_SHORT[m] ?? ''; }

/**
 * แปลง ISO date string → วันเดือนปีไทย (ย่อ)
 * - YYYY-MM-DD  → "2 มิ.ย. 2568"
 * - YYYY-MM     → "มิ.ย. 2568"
 */
export function isoToThai(iso) {
  if (!iso) return '';
  const dateOnly = String(iso).split('T')[0];
  const [y, m, d] = dateOnly.split('-');
  const day = Number(d);
  if (isNaN(day) || !day) return `${thaiMonthShort(Number(m))} ${thaiYear(Number(y))}`;
  return `${day} ${thaiMonthShort(Number(m))} ${thaiYear(Number(y))}`;
}

// ── Calendar helpers (ใช้ใน Tab ที่มีตารางรายเดือน) ──────────────────────────

/** จำนวนวันในเดือน (รับ พ.ศ.) */
export function daysInMonth(buddhistYear, month) {
  return new Date(buddhistYear - 543, month, 0).getDate();
}

/** หาวันในสัปดาห์ 0=อา…6=ส (รับ พ.ศ.) */
export function getDow(buddhistYear, month, day) {
  return new Date(buddhistYear - 543, month - 1, day).getDay();
}

/** ตรวจว่าวันนั้นเป็นวันหยุดสุดสัปดาห์ (รับ พ.ศ.) */
export function isWeekendDay(buddhistYear, month, day) {
  const dow = getDow(buddhistYear, month, day);
  if (dow !== 0 && dow !== 6) return false;
  // เสาร์–อาทิตย์ที่ตั้งเป็น "วันเรียนชดเชย" ถือเป็นวันเรียนปกติ
  const iso = `${buddhistYear - 543}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return !isMakeupDate(iso);
}

// ── วันเรียนชดเชย (ตั้งค่าจากเมนู "วันหยุดพิเศษและวันชดเชย") ──
// เก็บเป็นตัวแปรกลางของโมดูล เพื่อให้ฟังก์ชันตรวจวันหยุดทุกหน้าเรียกใช้ได้โดยไม่ต้องส่งค่าต่อกันหลายชั้น
let _makeupDates = new Set();
export function registerMakeupDates(isoList) { _makeupDates = new Set(isoList ?? []); }
export function isMakeupDate(iso) { return _makeupDates.has(iso); }

/** วันหยุดสุดสัปดาห์จริงหรือไม่ (รับ ISO ค.ศ.) — ไม่นับวันเรียนชดเชย */
export function isWeekendISO(iso) {
  const dow = new Date(iso).getDay();
  return (dow === 0 || dow === 6) && !isMakeupDate(iso);
}

/** เปรียบเทียบชื่อห้องเรียนแบบตัวเลขตามธรรมชาติ (อ.1/2 ก่อน อ.1/10, อ.1/x ก่อน อ.2/x) */
export function compareClassNames(a, b) {
  return String(a ?? '').localeCompare(String(b ?? ''), 'th', { numeric: true });
}

/** เปรียบเทียบนักเรียน: เรียงตามห้องก่อน แล้วตามเลขประจำตัว */
export function compareByClassThenCode(a, b) {
  return compareClassNames(a?.className, b?.className) || compareStudents(a, b);
}

/** เลขประจำตัวนักเรียน (รองรับชื่อฟิลด์เก่า) */
export function studentCodeOf(s) {
  return String(s?.studentCode ?? s?.code ?? s?.studentId ?? '').trim();
}

/**
 * เปรียบเทียบนักเรียนเพื่อเรียงตามเลขประจำตัว (เรียงแบบตัวเลข: 69002 ก่อน 69010)
 * คนที่ไม่มีเลขประจำตัวไปอยู่ท้าย แล้วเรียงตามชื่อ
 */
export function compareStudents(a, b) {
  const ca = studentCodeOf(a), cb = studentCodeOf(b);
  if (ca && cb) {
    const r = ca.localeCompare(cb, 'th', { numeric: true });
    if (r) return r;
  } else if (ca) return -1;
  else if (cb) return 1;
  return (a?.name ?? '').localeCompare(b?.name ?? '', 'th');
}

/**
 * นักเรียนคนนี้ "ถูกประเมินแล้ว" หรือยัง
 * นับทั้งผลสรุปรายด้าน (assessments.summary จากปุ่ม 📊 / ตัวช่วยประเมิน)
 * และผลรายกิจกรรมจากเมนู "ประเมินพัฒนาการ" (assessments.indicators[ตัวบ่งชี้][กิจกรรม] → score / r1..r4)
 */
export function isAssessed(s) {
  const a = s?.assessments;
  if (!a) return false;
  if (a.summary && Object.keys(a.summary).length > 0) return true;
  const inds = a.indicators;
  if (!inds || typeof inds !== 'object') return false;
  return Object.values(inds).some(acts =>
    acts && typeof acts === 'object' &&
    Object.values(acts).some(v =>
      v && typeof v === 'object' &&
      (Number(v.score) > 0 || [1, 2, 3, 4].some(r => Number(v[`r${r}`]) > 0))));
}
