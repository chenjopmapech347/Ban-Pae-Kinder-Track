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
