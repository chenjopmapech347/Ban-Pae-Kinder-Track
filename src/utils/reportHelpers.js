/**
 * reportHelpers.js
 * Helper functions สำหรับสมุดรายงานประจำตัวเด็ก
 * extracted จาก StudentReportTab.jsx เพื่อลดขนาดไฟล์
 */
import { GROWTH_TABLE, DEV_ASSESS_DOMAINS } from '../data/reportConstants';

export function getGrowthLevel(value, low, high) {
  const v = parseFloat(value);
  if (!v || !low || !high) return 0;
  if (v >= low && v <= high) return 3;
  // ±1SD approximation: midpoint ±15% of range
  const mid = (low + high) / 2;
  const sd1low  = mid - (mid - low) * 0.5;
  const sd1high = mid + (high - mid) * 0.5;
  if (v >= sd1low * 0.93 && v <= sd1high * 1.07) return 2;
  return 1;
}

export function calcGrowthLevels(ageYear, ageMonth, weight, height, gender) {
  const key = `${ageYear}-${ageMonth}`;
  const row = GROWTH_TABLE[key];
  if (!row) return { weightLevel: 0, heightLevel: 0 };
  const isMale = gender === 'male';
  const wl = isMale ? row.bwl : row.gwl;
  const wh = isMale ? row.bwh : row.gwh;
  const hl = isMale ? row.bhl : row.gwl;  // use height columns
  const hh = isMale ? row.bhh : row.ghh;
  // correct height low for female
  const hLow  = isMale ? row.bhl : row.ghl;
  return {
    weightLevel: getGrowthLevel(weight, wl, wh),
    heightLevel: getGrowthLevel(height, hLow, hh),
  };
}

export function levelLabel(n) {
  if (n === 3) return 'ดี';
  if (n === 2) return 'พอใช้';
  if (n === 1) return 'ปรับปรุง';
  return '—';
}
export function levelColor(n) {
  if (n === 3) return { bg: '#d1fae5', color: '#065f46' };
  if (n === 2) return { bg: '#fef3c7', color: '#92400e' };
  if (n === 1) return { bg: '#fee2e2', color: '#991b1b' };
  return { bg: '#f3f4f6', color: '#9ca3af' };
}

// ── term score helpers ────────────────────────────────────────────────────────
// round → term: r1+r2 = term1, r3+r4 = term2
export function getActivityTermScore(actData, term) {
  if (!actData) return null;
  const rounds = term === 1 ? [1, 2] : [3, 4];
  const scores = rounds.map(r => actData[`r${r}`]).filter(v => v != null && v > 0);
  if (!scores.length) return null;
  return parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1));
}

export function getIndicatorTermScore(indData, actIds, term) {
  const scores = actIds
    .map(id => getActivityTermScore(indData?.[id], term))
    .filter(v => v !== null);
  if (!scores.length) return null;
  return parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1));
}

// ── grade label from student.level (K1/K2/K3) ────────────────────────────────
export const GRADE_INFO = {
  K1: { grade: 'อนุบาลปีที่ 1', ageRange: '3–4' },
  K2: { grade: 'อนุบาลปีที่ 2', ageRange: '4–5' },
  K3: { grade: 'อนุบาลปีที่ 3', ageRange: '5–6' },
};
export function gradeLabelOf(student) {
  const info = GRADE_INFO[student?.level];
  if (!info) return '';
  return `${info.grade} (อายุ ${info.ageRange} ปี)`;
}

// ── suggest level from indicator scores (อ้างอิง INDICATORS_DATA) ─────────────
// ดึงคะแนนเฉลี่ยทุก activity ของตัวบ่งชี้นั้น แล้วแปลงเป็น level 1–3
export function suggestLevelFromIndicator(student, domainId, standardId, indicatorId, term) {
  const indKey = `${domainId}__${standardId}__${indicatorId}`;
  const indData = student?.assessments?.indicators?.[indKey];
  if (!indData || !Object.keys(indData).length) return 0;
  const rounds = term === 1 ? ['r1', 'r2'] : ['r3', 'r4'];
  const scores = Object.values(indData)
    .flatMap(actData => rounds.map(r => actData?.[r]).filter(v => v != null && v > 0));
  if (!scores.length) return 0;
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  if (avg >= 2.5) return 3;
  if (avg >= 1.5) return 2;
  return 1;
}

/** คะแนนเฉลี่ยทศนิยมจริงจากกิจกรรมประเมิน (ไม่ปัดเป็นระดับ) */
export function rawScoreFromIndicator(student, domainId, standardId, indicatorId, term) {
  if (!indicatorId) return null;
  const indKey = `${domainId}__${standardId}__${indicatorId}`;
  const indData = student?.assessments?.indicators?.[indKey];
  if (!indData || !Object.keys(indData).length) return null;
  const rounds = term === 1 ? ['r1', 'r2'] : ['r3', 'r4'];
  const scores = Object.values(indData)
    .flatMap(actData => rounds.map(r => actData?.[r]).filter(v => v != null && v > 0));
  if (!scores.length) return null;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

// ── gender helper ─────────────────────────────────────────────────────────────
export function genderOf(student) {
  if (student?.gender === 'male' || student?.gender === 'ชาย') return 'male';
  if (student?.gender === 'female' || student?.gender === 'หญิง') return 'female';
  const name = student?.name ?? '';
  if (name.includes('เด็กชาย') || name.includes('ชาย')) return 'male';
  if (name.includes('เด็กหญิง') || name.includes('หญิง')) return 'female';
  return 'unknown';
}

// ── age in years/months at a given date ───────────────────────────────────────
export function ageAt(birthISO, dateISO) {
  if (!birthISO || !dateISO) return { ageYear: 0, ageMonth: 0 };
  const birth = new Date(birthISO);
  const at    = new Date(dateISO);
  let years   = at.getFullYear() - birth.getFullYear();
  let months  = at.getMonth() - birth.getMonth();
  if (months < 0) { years--; months += 12; }
  return { ageYear: years, ageMonth: months };
}

// ── default physical record ───────────────────────────────────────────────────
export const PHYS_KEYS   = ['t1m1', 't1m2', 't2m1', 't2m2'];
export const PHYS_LABELS = ['ภาคเรียน 1 ครั้งที่ 1', 'ภาคเรียน 1 ครั้งที่ 2',
                     'ภาคเรียน 2 ครั้งที่ 1', 'ภาคเรียน 2 ครั้งที่ 2'];
export const PHYS_MONTH_HINTS = ['มิ.ย.', 'ก.ย.', 'ธ.ค.', 'ก.พ.'];

export function emptyPhys() {
  return Object.fromEntries(
    PHYS_KEYS.map(k => [k, { date: '', weight: '', height: '', weightLevel: 0, heightLevel: 0 }])
  );
}

// ── monthly growth records ────────────────────────────────────────────────────
// โครงสร้างตามแบบฟอร์มจริง อ.01:
//   ภาคเรียน 1 = พ.ค.–ต.ค. (6 เดือน)
//   ภาคเรียน 2 = ธ.ค.–เม.ย. (5 เดือน)   ← ไม่มีพ.ย. แต่มีเม.ย.
export const GROWTH_MONTHS_T1 = [
  { key: 'm5',  num: 5,  label: 'พ.ค.'  },
  { key: 'm6',  num: 6,  label: 'มิ.ย.' },
  { key: 'm7',  num: 7,  label: 'ก.ค.'  },
  { key: 'm8',  num: 8,  label: 'ส.ค.'  },
  { key: 'm9',  num: 9,  label: 'ก.ย.'  },
  { key: 'm10', num: 10, label: 'ต.ค.'  },
];
export const GROWTH_MONTHS_T2 = [
  { key: 'm12', num: 12, label: 'ธ.ค.'  },
  { key: 'm1',  num: 1,  label: 'ม.ค.'  },
  { key: 'm2',  num: 2,  label: 'ก.พ.'  },
  { key: 'm3',  num: 3,  label: 'มี.ค.' },
  { key: 'm4',  num: 4,  label: 'เม.ย.' },
];
export const GROWTH_MONTHS_ALL = [...GROWTH_MONTHS_T1, ...GROWTH_MONTHS_T2];

// วันที่อ้างอิง: วันที่ 15 ของเดือนนั้นในปีการศึกษา (เพื่อคำนวณอายุ)
// เดือน 5–12 → CE = ay-543 ; เดือน 1–4 → CE = ay-542
export function monthRefDate(monthNum, academicYear) {
  const ay = parseInt(String(academicYear || '2568'));
  const ce = monthNum >= 5 ? ay - 543 : ay - 542;
  return `${ce}-${String(monthNum).padStart(2, '0')}-15`;
}

export function emptyGrowth() {
  return Object.fromEntries(
    GROWTH_MONTHS_ALL.map(m => [m.key, { weight: '', height: '' }])
  );
}

// ── อ.01 section: จุดเด่นและความสามารถผู้เรียน — labels ──────────────────────
export const DOMAIN_LABELS = [
  'ด้านสุขภาวะทางกาย',
  'ด้านอารมณ์ จิตใจ และสังคม',
  'ด้านความเป็นพลเมืองและความเป็นไทย',
  'ด้านสติปัญญา',
];
export const D4_STD_LABELS = [
  'สุขภาวะทางสติปัญญาและภาษา (1.5ข) — ภาษา การคิด และความคิดสร้างสรรค์',
];


// ── helpers: support both flat `components` and `subDomains` (d4) ─────────────
export function domainAllComponents(domain) {
  if (domain.subDomains) return domain.subDomains.flatMap(s => s.components);
  return domain.components ?? [];
}

export function emptyDevAssess() {
  const r = {};
  DEV_ASSESS_DOMAINS.forEach(d =>
    domainAllComponents(d).forEach(c => {
      r[c.key] = { t1level: 0, t1highlight: '', t2level: 0, t2highlight: '', summary: 0 };
    })
  );
  return r;
}

// level badge helper for devAssess domains (tab header)
export function devAssessDomainAvg(devAssessment, domainId) {
  const domain = DEV_ASSESS_DOMAINS.find(d => d.id === domainId);
  if (!domain) return 0;
  const levels = domainAllComponents(domain)
    .map(c => devAssessment?.[c.key]?.summary ?? 0)
    .filter(v => v > 0);
  if (!levels.length) return 0;
  return Math.round(levels.reduce((a, b) => a + b, 0) / levels.length);
}

// ═══════════════════════════════════════════════════════════════════════════════
//  Main Component
// ═══════════════════════════════════════════════════════════════════════════════
