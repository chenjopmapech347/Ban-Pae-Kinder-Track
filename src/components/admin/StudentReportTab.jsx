import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { INDICATORS_DATA } from '../../data/indicatorsData';
import { callClaude, buildTeacherCommentPrompt, buildDomainSummaryPrompt } from '../../utils/aiHelper';

// ── helpers ───────────────────────────────────────────────────────────────────
function thaiYear(adYear) { return adYear + 543; }
function thaiMonthShort(m) {
  return ['','ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'][m] ?? '';
}
function isoToThai(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${Number(d)} ${thaiMonthShort(Number(m))} ${thaiYear(Number(y))}`;
}
function todayISO() { return new Date().toISOString().split('T')[0]; }

// WHO growth table per month-of-age (กรมอนามัย พ.ศ. 2543)
// [ageYears, ageMonths] → { boyWeightLow, boyWeightHigh, girlWeightLow, girlWeightHigh,
//                           boyHeightLow, boyHeightHigh, girlHeightLow, girlHeightHigh }
// Low = -2SD, High = +2SD
const GROWTH_TABLE = {
  '3-0':  { bwl:12.1,bwh:17.2,gwl:11.5,gwh:16.5, bhl:89.6,bhh:100.8,ghl:88.1,ghh:92.2 },
  '3-1':  { bwl:12.2,bwh:17.5,gwl:11.7,gwh:16.8, bhl:90.0,bhh:101.5,ghl:88.7,ghh:100.0 },
  '3-2':  { bwl:12.4,bwh:17.7,gwl:11.8,gwh:17.0, bhl:90.5,bhh:102.1,ghl:89.3,ghh:100.6 },
  '3-3':  { bwl:12.5,bwh:18.0,gwl:11.9,gwh:17.3, bhl:91.1,bhh:102.7,ghl:89.9,ghh:101.3 },
  '3-4':  { bwl:12.6,bwh:18.1,gwl:12.0,gwh:17.5, bhl:91.6,bhh:103.4,ghl:90.5,ghh:102.0 },
  '3-5':  { bwl:12.7,bwh:18.4,gwl:12.2,gwh:17.7, bhl:92.2,bhh:104.0,ghl:91.1,ghh:102.7 },
  '3-6':  { bwl:12.8,bwh:18.6,gwl:12.3,gwh:17.9, bhl:92.7,bhh:104.6,ghl:91.6,ghh:103.3 },
  '3-7':  { bwl:13.0,bwh:18.8,gwl:12.4,gwh:18.1, bhl:93.2,bhh:105.2,ghl:92.2,ghh:104.0 },
  '3-8':  { bwl:13.1,bwh:19.0,gwl:12.6,gwh:18.4, bhl:93.8,bhh:105.8,ghl:92.8,ghh:104.6 },
  '3-9':  { bwl:13.2,bwh:19.3,gwl:12.7,gwh:18.6, bhl:94.3,bhh:106.4,ghl:93.3,ghh:105.1 },
  '3-10': { bwl:13.4,bwh:19.5,gwl:12.8,gwh:18.7, bhl:94.8,bhh:107.0,ghl:93.9,ghh:105.7 },
  '3-11': { bwl:13.5,bwh:19.7,gwl:12.9,gwh:18.9, bhl:95.4,bhh:107.6,ghl:94.4,ghh:105.3 },
  '4-0':  { bwl:13.6,bwh:19.9,gwl:13.0,gwh:19.2, bhl:95.9,bhh:108.2,ghl:95.0,ghh:106.9 },
  '4-1':  { bwl:13.7,bwh:20.2,gwl:13.1,gwh:19.4, bhl:96.4,bhh:108.7,ghl:95.5,ghh:107.5 },
  '4-2':  { bwl:13.8,bwh:20.4,gwl:13.2,gwh:19.6, bhl:96.9,bhh:109.3,ghl:96.0,ghh:108.0 },
  '4-3':  { bwl:13.9,bwh:20.6,gwl:13.3,gwh:19.8, bhl:97.5,bhh:109.9,ghl:96.5,ghh:108.6 },
  '4-4':  { bwl:14.0,bwh:20.8,gwl:13.5,gwh:19.9, bhl:98.0,bhh:110.5,ghl:97.0,ghh:109.2 },
  '4-5':  { bwl:14.1,bwh:21.0,gwl:13.6,gwh:20.2, bhl:98.5,bhh:111.1,ghl:97.5,ghh:109.8 },
  '4-6':  { bwl:14.2,bwh:21.2,gwl:13.7,gwh:20.3, bhl:99.0,bhh:111.7,ghl:98.0,ghh:110.4 },
  '4-7':  { bwl:14.4,bwh:21.5,gwl:13.8,gwh:20.5, bhl:99.6,bhh:112.3,ghl:98.5,ghh:111.0 },
  '4-8':  { bwl:14.5,bwh:21.7,gwl:13.9,gwh:20.7, bhl:100.1,bhh:112.8,ghl:99.0,ghh:111.6 },
  '4-9':  { bwl:14.7,bwh:21.9,gwl:14.0,gwh:21.0, bhl:100.6,bhh:113.4,ghl:99.5,ghh:112.1 },
  '4-10': { bwl:14.8,bwh:22.1,gwl:14.1,gwh:21.2, bhl:101.1,bhh:114.0,ghl:100.1,ghh:112.7 },
  '4-11': { bwl:14.9,bwh:22.4,gwl:14.3,gwh:21.4, bhl:101.6,bhh:114.5,ghl:100.6,ghh:113.3 },
  '5-0':  { bwl:15.0,bwh:22.6,gwl:14.4,gwh:21.7, bhl:102.0,bhh:115.1,ghl:101.1,ghh:113.9 },
  '5-1':  { bwl:15.1,bwh:22.9,gwl:14.5,gwh:22.0, bhl:102.5,bhh:115.6,ghl:101.6,ghh:114.5 },
  '5-2':  { bwl:15.3,bwh:23.1,gwl:14.7,gwh:22.2, bhl:103.0,bhh:116.1,ghl:102.2,ghh:115.1 },
  '5-3':  { bwl:15.4,bwh:23.3,gwl:14.9,gwh:22.5, bhl:103.5,bhh:116.7,ghl:102.7,ghh:115.7 },
  '5-4':  { bwl:15.5,bwh:23.5,gwl:15.0,gwh:22.7, bhl:103.9,bhh:117.2,ghl:103.2,ghh:116.3 },
  '5-5':  { bwl:15.7,bwh:23.8,gwl:15.2,gwh:23.0, bhl:104.4,bhh:117.7,ghl:103.7,ghh:116.9 },
  '5-6':  { bwl:15.8,bwh:24.0,gwl:15.3,gwh:23.3, bhl:104.9,bhh:118.2,ghl:104.3,ghh:117.4 },
  '5-7':  { bwl:15.9,bwh:24.3,gwl:15.4,gwh:23.5, bhl:105.4,bhh:118.7,ghl:104.8,ghh:118.0 },
  '5-8':  { bwl:16.1,bwh:24.4,gwl:15.6,gwh:23.8, bhl:105.9,bhh:119.2,ghl:105.3,ghh:118.6 },
  '5-9':  { bwl:16.2,bwh:24.6,gwl:15.7,gwh:24.0, bhl:106.3,bhh:119.8,ghl:105.8,ghh:119.2 },
  '5-10': { bwl:16.4,bwh:24.9,gwl:15.9,gwh:24.2, bhl:106.8,bhh:120.3,ghl:106.3,ghh:119.7 },
  '5-11': { bwl:16.5,bwh:25.2,gwl:16.0,gwh:24.5, bhl:107.2,bhh:120.8,ghl:106.9,ghh:120.3 },
  '6-0':  { bwl:16.6,bwh:25.4,gwl:16.1,gwh:24.7, bhl:107.7,bhh:121.3,ghl:107.4,ghh:120.8 },
};

function getGrowthLevel(value, low, high) {
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

function calcGrowthLevels(ageYear, ageMonth, weight, height, gender) {
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

function levelLabel(n) {
  if (n === 3) return 'ดี';
  if (n === 2) return 'พอใช้';
  if (n === 1) return 'ปรับปรุง';
  return '—';
}
function levelColor(n) {
  if (n === 3) return { bg: '#d1fae5', color: '#065f46' };
  if (n === 2) return { bg: '#fef3c7', color: '#92400e' };
  if (n === 1) return { bg: '#fee2e2', color: '#991b1b' };
  return { bg: '#f3f4f6', color: '#9ca3af' };
}

// ── term score helpers ────────────────────────────────────────────────────────
// round → term: r1+r2 = term1, r3+r4 = term2
function getActivityTermScore(actData, term) {
  if (!actData) return null;
  const rounds = term === 1 ? [1, 2] : [3, 4];
  const scores = rounds.map(r => actData[`r${r}`]).filter(v => v != null && v > 0);
  if (!scores.length) return null;
  return parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1));
}

function getIndicatorTermScore(indData, actIds, term) {
  const scores = actIds
    .map(id => getActivityTermScore(indData?.[id], term))
    .filter(v => v !== null);
  if (!scores.length) return null;
  return parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1));
}

// ── grade label from student.level (K1/K2/K3) ────────────────────────────────
const GRADE_INFO = {
  K1: { grade: 'อนุบาลปีที่ 1', ageRange: '3–4' },
  K2: { grade: 'อนุบาลปีที่ 2', ageRange: '4–5' },
  K3: { grade: 'อนุบาลปีที่ 3', ageRange: '5–6' },
};
function gradeLabelOf(student) {
  const info = GRADE_INFO[student?.level];
  if (!info) return '';
  return `${info.grade} (อายุ ${info.ageRange} ปี)`;
}

// ── suggest level from indicator scores (อ้างอิง INDICATORS_DATA) ─────────────
// ดึงคะแนนเฉลี่ยทุก activity ของตัวบ่งชี้นั้น แล้วแปลงเป็น level 1–3
function suggestLevelFromIndicator(student, domainId, standardId, indicatorId, term) {
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
function rawScoreFromIndicator(student, domainId, standardId, indicatorId, term) {
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
function genderOf(student) {
  if (student?.gender === 'male' || student?.gender === 'ชาย') return 'male';
  if (student?.gender === 'female' || student?.gender === 'หญิง') return 'female';
  const name = student?.name ?? '';
  if (name.includes('เด็กชาย') || name.includes('ชาย')) return 'male';
  if (name.includes('เด็กหญิง') || name.includes('หญิง')) return 'female';
  return 'unknown';
}

// ── age in years/months at a given date ───────────────────────────────────────
function ageAt(birthISO, dateISO) {
  if (!birthISO || !dateISO) return { ageYear: 0, ageMonth: 0 };
  const birth = new Date(birthISO);
  const at    = new Date(dateISO);
  let years   = at.getFullYear() - birth.getFullYear();
  let months  = at.getMonth() - birth.getMonth();
  if (months < 0) { years--; months += 12; }
  return { ageYear: years, ageMonth: months };
}

// ── default physical record ───────────────────────────────────────────────────
const PHYS_KEYS   = ['t1m1', 't1m2', 't2m1', 't2m2'];
const PHYS_LABELS = ['ภาคเรียน 1 ครั้งที่ 1', 'ภาคเรียน 1 ครั้งที่ 2',
                     'ภาคเรียน 2 ครั้งที่ 1', 'ภาคเรียน 2 ครั้งที่ 2'];
const PHYS_MONTH_HINTS = ['มิ.ย.', 'ก.ย.', 'ธ.ค.', 'ก.พ.'];

function emptyPhys() {
  return Object.fromEntries(
    PHYS_KEYS.map(k => [k, { date: '', weight: '', height: '', weightLevel: 0, heightLevel: 0 }])
  );
}

// ── monthly growth records ────────────────────────────────────────────────────
// โครงสร้างตามแบบฟอร์มจริง อ.01:
//   ภาคเรียน 1 = พ.ค.–ต.ค. (6 เดือน)
//   ภาคเรียน 2 = ธ.ค.–เม.ย. (5 เดือน)   ← ไม่มีพ.ย. แต่มีเม.ย.
const GROWTH_MONTHS_T1 = [
  { key: 'm5',  num: 5,  label: 'พ.ค.'  },
  { key: 'm6',  num: 6,  label: 'มิ.ย.' },
  { key: 'm7',  num: 7,  label: 'ก.ค.'  },
  { key: 'm8',  num: 8,  label: 'ส.ค.'  },
  { key: 'm9',  num: 9,  label: 'ก.ย.'  },
  { key: 'm10', num: 10, label: 'ต.ค.'  },
];
const GROWTH_MONTHS_T2 = [
  { key: 'm12', num: 12, label: 'ธ.ค.'  },
  { key: 'm1',  num: 1,  label: 'ม.ค.'  },
  { key: 'm2',  num: 2,  label: 'ก.พ.'  },
  { key: 'm3',  num: 3,  label: 'มี.ค.' },
  { key: 'm4',  num: 4,  label: 'เม.ย.' },
];
const GROWTH_MONTHS_ALL = [...GROWTH_MONTHS_T1, ...GROWTH_MONTHS_T2];

// วันที่อ้างอิง: วันที่ 15 ของเดือนนั้นในปีการศึกษา (เพื่อคำนวณอายุ)
// เดือน 5–12 → CE = ay-543 ; เดือน 1–4 → CE = ay-542
function monthRefDate(monthNum, academicYear) {
  const ay = parseInt(String(academicYear || '2568'));
  const ce = monthNum >= 5 ? ay - 543 : ay - 542;
  return `${ce}-${String(monthNum).padStart(2, '0')}-15`;
}

function emptyGrowth() {
  return Object.fromEntries(
    GROWTH_MONTHS_ALL.map(m => [m.key, { weight: '', height: '' }])
  );
}

// ── print helper ──────────────────────────────────────────────────────────────
function printReport({ student, physData, growthRecords, devAssessment, attendanceSummary, healthServices,
                       devDomains, teacherComments, parentComments, directorsComment,
                       academicYear, schoolName, schoolPhilosophy, schoolVision, schoolLogo,
                       teacherName, directorName }) {
  // ── Compute overall yearly level from all term2 indicator scores ──────────
  const allT2 = devDomains.flatMap(d =>
    d.standards.flatMap(std =>
      std.indicators.map(ind => ind.indScores?.term2).filter(v => v !== null && v !== undefined)
    )
  );
  const overallLevel = allT2.length ? Math.round(allT2.reduce((a, b) => a + b, 0) / allT2.length) : null;
  const overallLevelLabel = overallLevel === 3 ? 'ดี' : overallLevel === 2 ? 'พอใช้' : overallLevel === 1 ? 'ควรส่งเสริม' : '—';
  const levelBg    = overallLevel === 3 ? '#16a34a' : overallLevel === 2 ? '#ca8a04' : '#dc2626';

  // ── Determine next class level ────────────────────────────────────────────
  const cn = student?.className ?? student?.level ?? '';
  const nextLevelLabel = /อ\.?[- ]?1/i.test(cn) ? 'อนุบาลปีที่ 2'
    : /อ\.?[- ]?2/i.test(cn) ? 'อนุบาลปีที่ 3'
    : 'ระดับถัดไป';

  // ── Gender ────────────────────────────────────────────────────────────────
  const genderPrefix = student?.gender === 'F' ? 'เด็กหญิง' : 'เด็กชาย';

  const _philosophy = schoolPhilosophy?.trim() || PHILOSOPHY_TEXT;
  const _vision     = schoolVision?.trim()     || VISION_TEXT;
  const levelTag = (n) => {
    const c = n === 3 ? '#059669' : n === 2 ? '#b45309' : n === 1 ? '#dc2626' : '#9ca3af';
    return `<span style="background:${c}20;color:${c};border-radius:4px;padding:1px 5px;font-size:.75rem;font-weight:700">${levelLabel(n)}</span>`;
  };

  // ── Bar chart data: avg score per domain per term ────────────────────────
  const domainChartData = devDomains.map(domain => {
    const allInds = domain.standards.flatMap(std => std.indicators);
    const t1 = allInds.map(i => i.indScores?.term1).filter(v => v !== null && v !== undefined);
    const t2 = allInds.map(i => i.indScores?.term2).filter(v => v !== null && v !== undefined);
    const avg1 = t1.length ? t1.reduce((a, b) => a + b, 0) / t1.length : 0;
    const avg2 = t2.length ? t2.reduce((a, b) => a + b, 0) / t2.length : 0;
    const avgY = t2.length ? avg2 : (t1.length ? avg1 : 0); // yearly = term2 score
    return { label: domain.name, avg1, avg2, avgY };
  });
  // append overall average group
  const allT2Chart = domainChartData.map(d => d.avg2).filter(v => v > 0);
  const allT1Chart = domainChartData.map(d => d.avg1).filter(v => v > 0);
  const overallAvg1 = allT1Chart.length ? allT1Chart.reduce((a, b) => a + b, 0) / allT1Chart.length : 0;
  const overallAvg2 = allT2Chart.length ? allT2Chart.reduce((a, b) => a + b, 0) / allT2Chart.length : 0;
  domainChartData.push({ label: 'สรุปการประเมินเพื่อ\nความก้าวหน้า', avg1: overallAvg1, avg2: overallAvg2, avgY: overallAvg2, isOverall: true });

  const BAR_MAX = 3;
  const pct = (v) => Math.round((v / BAR_MAX) * 100);
  const chartGroupHtml = domainChartData.map((d, i) => `
    <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px">
      <div style="display:flex;align-items:flex-end;gap:3px;height:160px;border-bottom:2px solid #374151;padding-bottom:0">
        <div style="width:22px;background:#3b82f6;height:${pct(d.avg1)}%;position:relative;border-radius:2px 2px 0 0" title="ภาคเรียนที่ 1: ${d.avg1.toFixed(2)}">
          ${d.avg1 > 0 ? `<span style="position:absolute;top:-16px;left:50%;transform:translateX(-50%);font-size:9px;color:#374151;white-space:nowrap">${d.avg1.toFixed(1)}</span>` : ''}
        </div>
        <div style="width:22px;background:#f59e0b;height:${pct(d.avg2)}%;position:relative;border-radius:2px 2px 0 0" title="ภาคเรียนที่ 2: ${d.avg2.toFixed(2)}">
          ${d.avg2 > 0 ? `<span style="position:absolute;top:-16px;left:50%;transform:translateX(-50%);font-size:9px;color:#374151;white-space:nowrap">${d.avg2.toFixed(1)}</span>` : ''}
        </div>
        <div style="width:22px;background:#9ca3af;height:${pct(d.avgY)}%;position:relative;border-radius:2px 2px 0 0" title="สรุปปี: ${d.avgY.toFixed(2)}">
          ${d.avgY > 0 ? `<span style="position:absolute;top:-16px;left:50%;transform:translateX(-50%);font-size:9px;color:#374151;white-space:nowrap">${d.avgY.toFixed(1)}</span>` : ''}
        </div>
      </div>
      <div style="font-size:.65rem;text-align:center;color:#374151;line-height:1.4;max-width:80px;margin-top:4px;${d.isOverall ? 'font-weight:700' : ''}">
        ${i + 1 <= 4 ? `${i + 1}. ` : ''}${d.label.replace('\n', '<br>')}
      </div>
    </div>
  `).join('');

  const physRows = PHYS_KEYS.map((k, i) => {
    const p = physData[k] ?? {};
    return `<tr>
      <td style="padding:4px 8px;border:1px solid #d1d5db">${PHYS_LABELS[i]}</td>
      <td style="padding:4px 8px;border:1px solid #d1d5db;text-align:center">${isoToThai(p.date) || '—'}</td>
      <td style="padding:4px 8px;border:1px solid #d1d5db;text-align:center">${p.weight || '—'}</td>
      <td style="padding:4px 8px;border:1px solid #d1d5db;text-align:center">${levelTag(p.weightLevel)}</td>
      <td style="padding:4px 8px;border:1px solid #d1d5db;text-align:center">${p.height || '—'}</td>
      <td style="padding:4px 8px;border:1px solid #d1d5db;text-align:center">${levelTag(p.heightLevel)}</td>
    </tr>`;
  }).join('');

  // บันทึกการเจริญเติบโตรายเดือน — layout แนวนอน (เดือนเป็นคอลัมน์)
  function growthAgeLabel(monthNum) {
    if (!student?.birthDate) return '';
    const { ageYear, ageMonth } = ageAt(student.birthDate, monthRefDate(monthNum, academicYear));
    return `${ageYear}ปี ${ageMonth}ด.`;
  }
  const gr = growthRecords ?? {};
  const thStyle = 'padding:3px 6px;border:1px solid #888;text-align:center;background:#d0d0d0;font-size:8.5px';
  const tdStyle = 'padding:3px 4px;border:1px solid #888;text-align:center;font-size:8.5px';
  const t1Cols = GROWTH_MONTHS_T1.map(m => `<th style="${thStyle}">${m.label}</th>`).join('');
  const t2Cols = GROWTH_MONTHS_T2.map(m => `<th style="${thStyle}">${m.label}</th>`).join('');
  const growthHtml = `
    <table style="width:100%;border-collapse:collapse;margin-top:4px">
      <thead>
        <tr>
          <th rowspan="2" style="${thStyle};width:80px;text-align:left;padding-left:6px">รายการ</th>
          <th colspan="6" style="${thStyle}">ภาคเรียนที่ 1</th>
          <th colspan="5" style="${thStyle}">ภาคเรียนที่ 2</th>
        </tr>
        <tr>${t1Cols}${t2Cols}</tr>
      </thead>
      <tbody>
        <tr>
          <td style="${tdStyle};text-align:left;padding-left:6px">อายุ</td>
          ${GROWTH_MONTHS_T1.map(m => `<td style="${tdStyle};font-size:7.5px">${growthAgeLabel(m.num)}</td>`).join('')}
          ${GROWTH_MONTHS_T2.map(m => `<td style="${tdStyle};font-size:7.5px">${growthAgeLabel(m.num)}</td>`).join('')}
        </tr>
        <tr>
          <td style="${tdStyle};text-align:left;padding-left:6px">น้ำหนัก (กก.)</td>
          ${GROWTH_MONTHS_T1.map(m => `<td style="${tdStyle}">${(gr[m.key]?.weight) || ''}</td>`).join('')}
          ${GROWTH_MONTHS_T2.map(m => `<td style="${tdStyle}">${(gr[m.key]?.weight) || ''}</td>`).join('')}
        </tr>
        <tr>
          <td style="${tdStyle};text-align:left;padding-left:6px">ส่วนสูง (ซม.)</td>
          ${GROWTH_MONTHS_T1.map(m => `<td style="${tdStyle}">${(gr[m.key]?.height) || ''}</td>`).join('')}
          ${GROWTH_MONTHS_T2.map(m => `<td style="${tdStyle}">${(gr[m.key]?.height) || ''}</td>`).join('')}
        </tr>
      </tbody>
    </table>
    <div style="font-size:7.5px;color:#555;margin-top:4px">
      <strong>หมายเหตุ:</strong>
      ระดับ 3 หมายถึง ปกติ / เป็นไปตามเกณฑ์มาตรฐาน &nbsp;·&nbsp;
      ระดับ 2 หมายถึง ค่อนข้างปกติ / ค่อนข้างมาก หรือ ค่อนข้างน้อยกว่าเกณฑ์มาตรฐาน &nbsp;·&nbsp;
      ระดับ 1 หมายถึง ไม่ปกติ ควรส่งเสริม / มาก หรือน้อยกว่าเกณฑ์มาตรฐาน
    </div>`;

  // ── ความสามารถผู้เรียน 4 ด้าน — print HTML ──────────────────────────────────
  const da = devAssessment ?? {};
  const lvBadge = (n) => {
    const c = n === 3 ? '#059669' : n === 2 ? '#b45309' : n === 1 ? '#dc2626' : '#9ca3af';
    return n > 0
      ? `<span style="background:${c}20;color:${c};border-radius:4px;padding:1px 6px;font-size:.75rem;font-weight:700">${n}</span>`
      : '<span style="color:#9ca3af">—</span>';
  };
  const thDA = 'padding:5px 8px;border:1px solid #d1d5db;font-weight:700;font-size:.78rem;background:#f3f4f6;text-align:center';
  const tdDA = 'padding:5px 8px;border:1px solid #d1d5db;font-size:.78rem;vertical-align:top';
  const renderDevCompRows = (components, domain, startIdx = 0) =>
    components.map((comp, ci) => {
      const row = da[comp.key] ?? {};
      const rowBg = (startIdx + ci) % 2 === 0 ? 'white' : '#fafafa';
      return `<tr style="background:${rowBg}">
        <td style="${tdDA};white-space:nowrap;color:${domain.color};font-weight:800">${comp.code}</td>
        <td style="${tdDA};font-weight:700">${comp.label}</td>
        <td style="${tdDA};font-size:.72rem;color:#4b5563;white-space:pre-line">${comp.descriptor}</td>
        <td style="${tdDA};text-align:center">${lvBadge(row.t1level ?? 0)}</td>
        <td style="${tdDA};text-align:center">${lvBadge(row.t2level ?? 0)}</td>
        <td style="${tdDA};text-align:center;font-weight:800">${lvBadge(row.summary ?? 0)}</td>
      </tr>`;
    }).join('');

  const devAssessHtml = DEV_ASSESS_DOMAINS.map(domain => {
    const domainHeader = `<tr style="background:${domain.color}20">
        <td colspan="6" style="padding:6px 10px;border:1px solid #d1d5db;font-weight:900;font-size:.85rem;color:${domain.color}">
          ${domain.emoji} พัฒนาการ${domain.label}
        </td>
      </tr>`;
    if (domain.subDomains) {
      // D4: render each sub-domain with its own header row
      let idxOffset = 0;
      const subRows = domain.subDomains.map(sub => {
        const subHeader = `<tr style="background:${domain.color}10">
          <td colspan="6" style="padding:4px 12px;border:1px solid #d1d5db;font-weight:700;font-size:.8rem;color:${domain.color}">
            ${sub.label}
          </td>
        </tr>`;
        const rows = renderDevCompRows(sub.components, domain, idxOffset);
        idxOffset += sub.components.length;
        return subHeader + rows;
      }).join('');
      const dsSummary = da[`__domainSummary_${domain.id}`];
      const dsSummaryRow = dsSummary
        ? `<tr><td colspan="6" style="${tdDA};background:${domain.color}08;padding:8px 12px">
            <strong style="color:${domain.color}">📝 สรุปพัฒนาการด้าน${domain.label}</strong><br/>
            <span style="white-space:pre-line;line-height:1.7">${dsSummary}</span>
           </td></tr>`
        : '';
      return domainHeader + subRows + dsSummaryRow;
    }
    const dsSummary = da[`__domainSummary_${domain.id}`];
    const dsSummaryRow = dsSummary
      ? `<tr><td colspan="6" style="${tdDA};background:${domain.color}08;padding:8px 12px">
          <strong style="color:${domain.color}">📝 สรุปพัฒนาการด้าน${domain.label}</strong><br/>
          <span style="white-space:pre-line;line-height:1.7">${dsSummary}</span>
         </td></tr>`
      : '';
    return domainHeader + renderDevCompRows(domain.components, domain) + dsSummaryRow;
  }).join('');

  const attRows = [1, 2].map(t => {
    const a = attendanceSummary[`term${t}`] ?? {};
    const yearly = t === 2
      ? `<tr><td colspan="2" style="padding:4px 8px;border:1px solid #d1d5db;font-weight:700">ตลอดปี</td>
          <td style="padding:4px 8px;border:1px solid #d1d5db;text-align:center">${(attendanceSummary.term1?.totalDays ?? 0) + (attendanceSummary.term2?.totalDays ?? 0)}</td>
          <td style="padding:4px 8px;border:1px solid #d1d5db;text-align:center">${(attendanceSummary.term1?.presentDays ?? 0) + (attendanceSummary.term2?.presentDays ?? 0)}</td>
          <td style="padding:4px 8px;border:1px solid #d1d5db;text-align:center">${(attendanceSummary.term1?.absentDays ?? 0) + (attendanceSummary.term2?.absentDays ?? 0)}</td>
         </tr>` : '';
    return `<tr>
      <td colspan="2" style="padding:4px 8px;border:1px solid #d1d5db">ภาคเรียนที่ ${t}</td>
      <td style="padding:4px 8px;border:1px solid #d1d5db;text-align:center">${a.totalDays ?? '—'}</td>
      <td style="padding:4px 8px;border:1px solid #d1d5db;text-align:center">${a.presentDays ?? '—'}</td>
      <td style="padding:4px 8px;border:1px solid #d1d5db;text-align:center">${a.absentDays ?? '—'}</td>
    </tr>${yearly}`;
  }).join('');

  const hsRows = (healthServices ?? []).map(h =>
    `<tr>
      <td style="padding:4px 8px;border:1px solid #d1d5db">${isoToThai(h.date) || '—'}</td>
      <td style="padding:4px 8px;border:1px solid #d1d5db">${h.service || '—'}</td>
      <td style="padding:4px 8px;border:1px solid #d1d5db">${h.note || ''}</td>
    </tr>`
  ).join('') || `<tr><td colspan="3" style="padding:8px;text-align:center;color:#9ca3af">ไม่มีข้อมูล</td></tr>`;

  const devHtml = devDomains.map(domain => {
    const stdRows = domain.standards.map(std => {
      const indRows = std.indicators.map(ind => {
        const actRows = ind.actIds.map(actId => {
          const t1 = ind.scores[actId]?.term1 ?? null;
          const t2 = ind.scores[actId]?.term2 ?? null;
          return `<tr>
            <td style="padding:3px 8px;border:1px solid #d1d5db;font-size:.78rem">${ind.actLabels[actId] || actId}</td>
            <td style="padding:3px 8px;border:1px solid #d1d5db;text-align:center">${t1 !== null ? levelTag(Math.round(t1)) : '—'}</td>
            <td style="padding:3px 8px;border:1px solid #d1d5db;text-align:center">${t2 !== null ? levelTag(Math.round(t2)) : '—'}</td>
          </tr>`;
        }).join('');
        const st1 = ind.indScores.term1, st2 = ind.indScores.term2;
        return `${actRows}
          <tr style="background:#f9fafb">
            <td style="padding:4px 8px;border:1px solid #d1d5db;font-weight:700;font-size:.8rem">สรุปตัวบ่งชี้ ${ind.label}</td>
            <td style="padding:4px 8px;border:1px solid #d1d5db;text-align:center;font-weight:700">${st1 !== null ? st1.toFixed(1) : '—'}</td>
            <td style="padding:4px 8px;border:1px solid #d1d5db;text-align:center;font-weight:700">${st2 !== null ? st2.toFixed(1) : '—'}</td>
          </tr>`;
      }).join('');
      return `<tr style="background:${domain.bg}">
          <td colspan="3" style="padding:5px 8px;border:1px solid #d1d5db;font-weight:800;font-size:.82rem;color:${domain.color}">${std.title}</td>
        </tr>${indRows}`;
    }).join('');
    return `<tr style="background:${domain.color}20">
        <td colspan="3" style="padding:6px 8px;border:1px solid #d1d5db;font-weight:900;font-size:.88rem;color:${domain.color}">${domain.emoji} พัฒนาการด้าน${domain.label}</td>
      </tr>${stdRows}`;
  }).join('');

  const photoHtml = student?.photo
    ? `<img src="${student.photo}" alt="รูปนักเรียน"
         style="width:160px;height:160px;border-radius:50%;object-fit:cover;
                border:4px solid #4f46e5;box-shadow:0 4px 16px rgba(79,70,229,.25)">`
    : `<div style="width:160px;height:160px;border-radius:50%;
                   background:linear-gradient(135deg,#e0e7ff,#c7d2fe);
                   border:4px solid #4f46e5;display:flex;align-items:center;
                   justify-content:center;font-size:5rem;line-height:1">
         ${(student?.name ?? '').includes('ชาย') ? '👦' : '👧'}
       </div>`;

  const html = `<!DOCTYPE html><html><head>
    <meta charset="utf-8">
    <title>สมุดรายงานประจำตัว — ${student?.name ?? ''}</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700;800&display=swap');
      body { font-family:'Sarabun',sans-serif; font-size:13px; margin:20px; color:#111; }
      h1 { text-align:center; font-size:1.1rem; margin-bottom:4px; }
      h2 { font-size:.95rem; margin:14px 0 4px; background:#f3f4f6; padding:4px 8px; border-radius:4px; }
      table { width:100%; border-collapse:collapse; margin-bottom:12px; }
      th { background:#f3f4f6; padding:5px 8px; border:1px solid #d1d5db; font-weight:700; font-size:.8rem; }
      .page-break { page-break-after:always; break-after:page; margin-bottom:20px; }
      @page { size:A4 portrait; margin:1in; }
      @media print {
        body { margin:0; }
        .page-break { page-break-after:always; break-after:page; }
      }
    </style>
  </head><body>

    <!-- ══ หน้าปก ══ -->
    <div class="page-break" style="
      min-height:calc(100vh - 40px);
      display:flex; flex-direction:column; align-items:center; justify-content:center;
      text-align:center; padding:40px 20px; box-sizing:border-box;
      background:linear-gradient(160deg,#f5f3ff 0%,#ede9fe 40%,#e0e7ff 100%);
      border:3px solid #4f46e5; border-radius:8px;
    ">
      <!-- ดวงตราสถานศึกษา / header bar -->
      <div style="
        background:linear-gradient(135deg,#4f46e5,#7c3aed);
        color:white; width:100%; padding:14px 20px; margin-bottom:36px;
        border-radius:6px; box-shadow:0 4px 16px rgba(79,70,229,.3);
      ">
        ${schoolLogo ? `<div style="margin-bottom:8px"><img src="${schoolLogo}" style="height:60px;object-fit:contain;filter:brightness(0) invert(1)"/></div>` : ''}
        <div style="font-size:1.1rem;font-weight:800;letter-spacing:.5px">
          โรงเรียน${schoolName}
        </div>
        <div style="font-size:.85rem;opacity:.85;margin-top:3px">
          สังกัดสำนักการศึกษา กรุงเทพมหานคร
        </div>
      </div>

      <!-- ชื่อสมุด -->
      <div style="margin-bottom:8px">
        <div style="font-size:1.5rem;font-weight:800;color:#1e1b4b;letter-spacing:.5px;line-height:1.4">
          สมุดรายงานประจำตัว
        </div>
        <div style="font-size:1.3rem;font-weight:800;color:#1e1b4b">
          เด็กปฐมวัย
        </div>
        <div style="font-size:.82rem;color:#6b7280;margin-top:6px">
          (ตามหลักสูตรการศึกษาปฐมวัย พุทธศักราช 2560)
        </div>
      </div>

      <!-- เส้นคั่น -->
      <div style="width:80px;height:3px;background:linear-gradient(90deg,#4f46e5,#7c3aed);
                  border-radius:2px;margin:18px auto"></div>

      <!-- รูปเด็ก -->
      <div style="margin:18px 0">
        ${photoHtml}
      </div>

      <!-- ชื่อนักเรียน -->
      <div style="
        background:white; border:2px solid #c7d2fe; border-radius:12px;
        padding:16px 40px; margin:16px 0; box-shadow:0 2px 8px rgba(79,70,229,.1);
        min-width:280px;
      ">
        <div style="font-size:.72rem;font-weight:700;color:#6b7280;letter-spacing:.5px;margin-bottom:6px">
          ชื่อ–สกุล
        </div>
        <div style="font-size:1.2rem;font-weight:800;color:#1e1b4b">
          ${student?.name ?? '—'}
        </div>
        <div style="height:1px;background:#e0e7ff;margin:10px 0"></div>
        <div style="display:flex;justify-content:center;gap:32px;font-size:.85rem">
          <div>
            <div style="font-size:.7rem;color:#9ca3af;font-weight:600">ชั้น/ห้อง</div>
            <div style="font-weight:700;color:#4f46e5">${student?.className ?? student?.level ?? '—'}</div>
          </div>
          <div>
            <div style="font-size:.7rem;color:#9ca3af;font-weight:600">ปีการศึกษา</div>
            <div style="font-weight:700;color:#4f46e5">${academicYear}</div>
          </div>
          ${student?.birthDate ? `<div>
            <div style="font-size:.7rem;color:#9ca3af;font-weight:600">วันเกิด</div>
            <div style="font-weight:700;color:#4f46e5">${isoToThai(student.birthDate)}</div>
          </div>` : ''}
        </div>
      </div>

      <!-- ลายเซ็น -->
      <div style="margin-top:36px;display:flex;gap:64px;justify-content:center">
        <div style="text-align:center">
          <div style="height:48px"></div>
          <div style="border-top:1px solid #6b7280;width:160px;padding-top:5px;font-size:.78rem;color:#4b5563">
            ลงชื่อครูประจำชั้น
          </div>
        </div>
        <div style="text-align:center">
          <div style="height:48px"></div>
          <div style="border-top:1px solid #6b7280;width:160px;padding-top:5px;font-size:.78rem;color:#4b5563">
            ลงชื่อผู้อำนวยการ
          </div>
        </div>
      </div>

      <!-- footer -->
      <div style="margin-top:auto;padding-top:32px;font-size:.72rem;color:#9ca3af">
        KinderTrack · ระบบบันทึกพัฒนาการเด็กปฐมวัย
      </div>
    </div>

    <!-- ══ หน้า 1: คำชี้แจงถึงผู้ปกครอง ══ -->
    <div class="page-break">
      <h1 style="margin-bottom:16px">สมุดรายงานประจำตัวเด็กปฐมวัย</h1>
      <p style="text-align:center;margin-bottom:20px;font-size:.85rem;color:#555">
        โรงเรียน${schoolName} · ปีการศึกษา ${academicYear}
      </p>
      <p style="font-size:.9rem;font-weight:700;margin-bottom:12px">เรียน ท่านผู้ปกครอง</p>
      <div style="font-size:.85rem;line-height:2;text-align:justify;white-space:pre-line">${INTRO_LETTER}</div>
      <div style="margin-top:48px;text-align:right">
        <div style="display:inline-block;text-align:center">
          <div style="height:60px"></div>
          <div style="border-top:1px solid #000;width:220px;padding-top:4px;font-size:.82rem">
            ลงชื่อ (ผู้อำนวยการสถานศึกษา)
          </div>
        </div>
      </div>
    </div>

    <!-- ══ หน้า 2: ปรัชญา/วิสัยทัศน์ ══ -->
    <div class="page-break">
      <div style="border:2px solid #333;padding:8px 16px;text-align:center;font-size:1rem;font-weight:800;margin-bottom:20px;display:inline-block">
        ปรัชญาการศึกษาปฐมวัย
      </div>
      <p style="font-size:.87rem;line-height:2;text-align:justify;text-indent:2em;margin-bottom:28px">${_philosophy}</p>
      <div style="border:2px solid #333;padding:8px 16px;text-align:center;font-size:1rem;font-weight:800;margin-bottom:20px;display:inline-block">
        วิสัยทัศน์
      </div>
      <p style="font-size:.87rem;line-height:2;text-align:justify;text-indent:2em">${_vision}</p>
    </div>

    <!-- ══ หน้า 3: จุดมุ่งหมายของหลักสูตร ══ -->
    <div class="page-break">
      <div style="border:2px solid #333;padding:8px 16px;text-align:center;font-size:1rem;font-weight:800;margin-bottom:20px;display:inline-block">
        จุดมุ่งหมายของหลักสูตรการศึกษาปฐมวัย พุทธศักราช 2560
      </div>
      <p style="font-size:.85rem;line-height:1.9;text-align:justify;margin-bottom:20px">
        หลักสูตรการศึกษาปฐมวัย พุทธศักราช 2560 มุ่งให้เด็กอายุตั้งแต่แรกเกิดจนถึง 6 ปีบริบูรณ์ ได้รับการพัฒนาทุกด้านอย่างสมดุลและต่อเนื่อง โดยมีจุดมุ่งหมายให้เด็กมีคุณลักษณะที่พึงประสงค์ ดังนี้
      </p>
      <ol style="font-size:.87rem;line-height:2.2;padding-left:1.4em;margin:0">
        ${AIMS.map(a => `<li style="margin-bottom:4px">${a}</li>`).join('')}
      </ol>
    </div>

    <!-- ══ หน้า 4: เกณฑ์มาตรฐานน้ำหนักและส่วนสูง ══ -->
    <div class="page-break">
      <h2 style="text-align:center;font-size:.95rem;margin-bottom:12px">
        ตารางแสดงการเจริญเติบโตของเพศชายและหญิง อายุ 3–6 ปี
      </h2>
      <p style="text-align:center;font-size:.72rem;color:#666;margin-bottom:10px">
        กองโภชนาการ กรมอนามัย กระทรวงสาธารณสุข พ.ศ. 2543 · ต่ำแหน่ง = –2SD · บนสุด = +2SD
      </p>
      <table style="font-size:.72rem">
        <thead>
          <tr style="background:#1e3a5f;color:white">
            <th rowspan="3" style="padding:4px 6px;border:1px solid #374151;text-align:center">ปี</th>
            <th rowspan="3" style="padding:4px 6px;border:1px solid #374151;text-align:center">เดือน</th>
            <th colspan="4" style="padding:4px 6px;border:1px solid #374151;text-align:center">น้ำหนักมาตรฐาน (กิโลกรัม)</th>
            <th colspan="4" style="padding:4px 6px;border:1px solid #374151;text-align:center">ส่วนสูงมาตรฐาน (เซนติเมตร)</th>
          </tr>
          <tr style="background:#1e3a5f;color:white">
            <th colspan="2" style="padding:3px 6px;border:1px solid #374151;text-align:center">ชาย</th>
            <th colspan="2" style="padding:3px 6px;border:1px solid #374151;text-align:center">หญิง</th>
            <th colspan="2" style="padding:3px 6px;border:1px solid #374151;text-align:center">ชาย</th>
            <th colspan="2" style="padding:3px 6px;border:1px solid #374151;text-align:center">หญิง</th>
          </tr>
          <tr style="background:#2d4a6e;color:#e5e7eb;font-size:.65rem">
            ${['ต่ำแหน่ง','บนสุด','ต่ำแหน่ง','บนสุด','ต่ำแหน่ง','บนสุด','ต่ำแหน่ง','บนสุด'].map(l => `<th style="padding:2px 5px;border:1px solid #374151;text-align:center">${l}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${GROWTH_ROWS.map((r, idx) => `
            <tr style="background:${r.month === 0 ? '#eff6ff' : idx % 2 === 0 ? 'white' : '#f9fafb'}">
              <td style="padding:3px 6px;border:1px solid #e5e7eb;text-align:center;font-weight:${r.month === 0 ? 700 : 400}">${r.month === 0 ? r.year : ''}</td>
              <td style="padding:3px 6px;border:1px solid #e5e7eb;text-align:center">${r.month}</td>
              <td style="padding:3px 6px;border:1px solid #e5e7eb;text-align:center">${r.bwl}</td>
              <td style="padding:3px 6px;border:1px solid #e5e7eb;text-align:center">${r.bwh}</td>
              <td style="padding:3px 6px;border:1px solid #e5e7eb;text-align:center">${r.gwl}</td>
              <td style="padding:3px 6px;border:1px solid #e5e7eb;text-align:center">${r.gwh}</td>
              <td style="padding:3px 6px;border:1px solid #e5e7eb;text-align:center">${r.bhl}</td>
              <td style="padding:3px 6px;border:1px solid #e5e7eb;text-align:center">${r.bhh}</td>
              <td style="padding:3px 6px;border:1px solid #e5e7eb;text-align:center">${r.ghl}</td>
              <td style="padding:3px 6px;border:1px solid #e5e7eb;text-align:center">${r.ghh}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>

    <!-- ══ หน้า 4+: ข้อมูลนักเรียน ══ -->
    <h1>สมุดรายงานประจำตัวเด็กปฐมวัย</h1>
    <div style="text-align:center;margin-bottom:12px;font-size:.85rem;color:#6b7280">
      ปีการศึกษา ${academicYear} · โรงเรียน${schoolName}
    </div>
    <table style="margin-bottom:12px">
      <tr>
        <td style="padding:3px 8px;width:25%"><strong>ชื่อ-สกุล:</strong></td>
        <td style="padding:3px 8px">${student?.name ?? '—'}</td>
        <td style="padding:3px 8px;width:20%"><strong>ชั้น:</strong></td>
        <td style="padding:3px 8px">${student?.className ?? student?.level ?? '—'}</td>
      </tr>
      <tr>
        <td style="padding:3px 8px"><strong>วันเกิด:</strong></td>
        <td style="padding:3px 8px">${isoToThai(student?.birthDate) || '—'}</td>
        <td style="padding:3px 8px"><strong>ผู้ปกครอง:</strong></td>
        <td style="padding:3px 8px">${student?.parentName ?? '—'}</td>
      </tr>
    </table>

    <h2>1. บันทึกพัฒนาการด้านร่างกาย (น้ำหนัก/ส่วนสูง)</h2>
    <table>
      <tr>
        <th>ครั้งที่</th><th>วันที่วัด</th>
        <th>น้ำหนัก (กก.)</th><th>ระดับ</th>
        <th>ส่วนสูง (ซม.)</th><th>ระดับ</th>
      </tr>
      ${physRows}
    </table>

    <h2 style="margin-top:14px">บันทึกการเจริญเติบโตของร่างกาย</h2>
    ${growthHtml}

    <h2>2. บันทึกการบริการทางสุขภาพ (การให้ภูมิคุ้มกัน)</h2>
    <table>
      <tr><th>วัน/เดือน/ปี</th><th>การให้ภูมิคุ้มกัน</th><th>หมายเหตุ</th></tr>
      ${hsRows}
    </table>

    <h2>3. เวลามาเรียน (คิดเป็นวัน)</h2>
    <table>
      <tr><th colspan="2">ภาคเรียน</th><th>เวลาเรียนเต็ม</th><th>มาเรียน</th><th>ไม่มาเรียน</th></tr>
      ${attRows}
    </table>

    <h2>4. บันทึกผลการประเมินพัฒนาการ — ความสามารถผู้เรียนเมื่อจบชั้นปี</h2>
    <p style="font-size:.78rem;color:#555;margin-bottom:6px">อนุบาลปีที่ 2 (อายุ 4–5 ปี) · ระดับ 3 = ดี · ระดับ 2 = พอใช้ · ระดับ 1 = ปรับปรุง</p>
    <table>
      <tr>
        <th style="${thDA};width:48px">รหัส</th>
        <th style="${thDA}">องค์ประกอบ</th>
        <th style="${thDA}">สภาพที่พึงประสงค์</th>
        <th style="${thDA};width:52px">ภาค 1</th>
        <th style="${thDA};width:52px">ภาค 2</th>
        <th style="${thDA};width:52px">สรุป</th>
      </tr>
      ${devAssessHtml}
    </table>

    <h2>4.1 ผลการประเมินตัวบ่งชี้ (จากระบบประเมิน)</h2>
    <table>
      <tr><th style="width:60%">พฤติกรรม / ตัวบ่งชี้</th><th>ภาคเรียน 1</th><th>ภาคเรียน 2</th></tr>
      ${devHtml}
    </table>

    <h2>5. สรุปผลการประเมินพัฒนาการตามมาตรฐานคุณลักษณะที่พึงประสงค์</h2>
    <table>
      <tr>
        <th style="width:40px">ลำดับ</th>
        <th>มาตรฐานคุณลักษณะที่พึงประสงค์</th>
        <th colspan="3" style="text-align:center">ภาคเรียน 1</th>
        <th colspan="3" style="text-align:center">ภาคเรียน 2</th>
        <th>สรุปตลอดปี</th>
      </tr>
      <tr>
        <th></th><th></th>
        <th>3</th><th>2</th><th>1</th>
        <th>3</th><th>2</th><th>1</th>
        <th></th>
      </tr>
      ${devDomains.map(domain => {
        const domainRows = domain.standards.map((std, si) => {
          const stdNum = domain.standards.reduce((acc, _, i) => i < si ? acc + 1 : acc, 0);
          // compute average score per term for this standard
          const allIndScores1 = std.indicators.map(ind => ind.indScores.term1).filter(v => v !== null);
          const allIndScores2 = std.indicators.map(ind => ind.indScores.term2).filter(v => v !== null);
          const t1 = allIndScores1.length ? Math.round(allIndScores1.reduce((a,b)=>a+b,0)/allIndScores1.length) : null;
          const t2 = allIndScores2.length ? Math.round(allIndScores2.reduce((a,b)=>a+b,0)/allIndScores2.length) : null;
          const yearly = t2; // หมายเหตุ: สรุปตลอดปีใช้ค่าภาคเรียน 2
          return `<tr>
            <td style="padding:4px 8px;border:1px solid #d1d5db;text-align:center">${std.stdNo ?? (si+1)}</td>
            <td style="padding:4px 8px;border:1px solid #d1d5db;font-size:.78rem">${std.title}</td>
            <td style="padding:4px 8px;border:1px solid #d1d5db;text-align:center">${t1 === 3 ? '✓' : ''}</td>
            <td style="padding:4px 8px;border:1px solid #d1d5db;text-align:center">${t1 === 2 ? '✓' : ''}</td>
            <td style="padding:4px 8px;border:1px solid #d1d5db;text-align:center">${t1 === 1 ? '✓' : ''}</td>
            <td style="padding:4px 8px;border:1px solid #d1d5db;text-align:center">${t2 === 3 ? '✓' : ''}</td>
            <td style="padding:4px 8px;border:1px solid #d1d5db;text-align:center">${t2 === 2 ? '✓' : ''}</td>
            <td style="padding:4px 8px;border:1px solid #d1d5db;text-align:center">${t2 === 1 ? '✓' : ''}</td>
            <td style="padding:4px 8px;border:1px solid #d1d5db;text-align:center;font-weight:700">${yearly !== null ? yearly : '—'}</td>
          </tr>`;
        }).join('');
        const allDomainT2 = domain.standards.flatMap(std =>
          std.indicators.map(ind => ind.indScores.term2).filter(v => v !== null)
        );
        const domainYearly = allDomainT2.length ? Math.round(allDomainT2.reduce((a,b)=>a+b,0)/allDomainT2.length) : null;
        return `<tr style="background:#f0f0f0">
          <td colspan="8" style="padding:5px 8px;border:1px solid #d1d5db;font-weight:800">${domain.emoji} ด้าน${domain.label}</td>
          <td style="padding:5px 8px;border:1px solid #d1d5db;text-align:center;font-weight:800">${domainYearly !== null ? domainYearly : '—'}</td>
        </tr>${domainRows}`;
      }).join('')}
    </table>
    <p style="font-size:.75rem;color:#666">หมายเหตุ: สรุปตลอดปีการศึกษา นำผลการประเมินภาคเรียนที่ 2 มารวมกัน แล้วหารด้วยจำนวนมาตรฐานในด้านพัฒนาการนั้น</p>

    <!-- ══ หน้า: จุดเด่นและความสามารถผู้เรียน (ภาคเรียนที่ 1 และ 2) ══ -->
    ${[1, 2].map(term => {
      const termTh = term === 1 ? '๑' : '๒';
      // domain 4 sub-items from INDICATORS_DATA (index 3)
      const d4 = devDomains[3];
      const d4Subs = d4 ? d4.standards.map((std, si) => {
        const subNums = ['๔.๑','๔.๒','๔.๓','๔.๔','๔.๕'];
        return `<tr>
          <td style="padding:6px 8px;border:1px solid #374151;font-size:.78rem;vertical-align:top">
            <span style="font-weight:600">${subNums[si] ?? `๔.${si+1}`}</span> ${std.name}
          </td>
          <td style="padding:6px 8px;border:1px solid #374151;min-height:50px;font-size:.78rem;vertical-align:top"> </td>
          <td style="padding:6px 8px;border:1px solid #374151;font-size:.78rem;vertical-align:top"> </td>
        </tr>`;
      }).join('') : '';

      const mainRows = [
        { num:'๑', name: devDomains[0]?.name ?? 'ด้านสุขภาวะทางกาย' },
        { num:'๒', name: devDomains[1]?.name ?? 'ด้านอารมณ์ จิตใจ และสังคม' },
        { num:'๓', name: devDomains[2]?.name ?? 'ด้านความเป็นพลเมืองและความเป็นไทย' },
      ].map(r => `<tr>
        <td style="padding:8px;border:1px solid #374151;font-weight:600;font-size:.8rem;vertical-align:top">
          ${r.num}. ${r.name}
        </td>
        <td style="padding:6px 8px;border:1px solid #374151;min-height:60px;font-size:.78rem;vertical-align:top"> </td>
        <td style="padding:6px 8px;border:1px solid #374151;font-size:.78rem;vertical-align:top"> </td>
      </tr>`).join('');

      const d4Header = `<tr>
        <td style="padding:8px;border:1px solid #374151;font-weight:600;font-size:.8rem;vertical-align:top">
          ๔. ${devDomains[3]?.name ?? 'ด้านสติปัญญา'}
        </td>
        <td style="padding:6px 8px;border:1px solid #374151;font-size:.78rem;vertical-align:top"> </td>
        <td style="padding:6px 8px;border:1px solid #374151;font-size:.78rem;vertical-align:top"> </td>
      </tr>`;

      return `
      <div class="page-break">
        <div style="text-align:center;margin-bottom:16px;font-size:.95rem;font-weight:700">
          จุดเด่นและความสามารถผู้เรียน ภาคเรียนที่ ${termTh}
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:.82rem">
          <colgroup>
            <col style="width:28%">
            <col style="width:52%">
            <col style="width:20%">
          </colgroup>
          <thead>
            <tr>
              <th style="padding:8px;border:1px solid #374151;background:#f3f4f6;text-align:center">ความสามารถผู้เรียน</th>
              <th style="padding:8px;border:1px solid #374151;background:#f3f4f6;text-align:center" colspan="1">
                ภาคเรียนที่ ${termTh}<br>
                <span style="font-weight:400;font-size:.75rem">ความคิดเห็นครูประจำชั้น (จุดเด่น)</span><br>
                <span style="font-weight:400;font-size:.72rem">ลงชื่อ ............................................</span><br>
                <span style="font-weight:400;font-size:.72rem">(ครูประจำชั้น)</span>
              </th>
              <th style="padding:8px;border:1px solid #374151;background:#f3f4f6;text-align:center">
                ความคิดเห็นผู้ปกครอง<br>
                <span style="font-weight:400;font-size:.72rem">ลงชื่อ ..........................</span><br>
                <span style="font-weight:400;font-size:.72rem">(ผู้ปกครอง)</span>
              </th>
            </tr>
          </thead>
          <tbody>
            ${mainRows}
            ${d4Header}
            ${d4Subs}
          </tbody>
        </table>
      </div>`;
    }).join('')}

    <!-- ══ หน้า: สมรรถนะผู้เรียน (bar chart) ══ -->
    <div class="page-break">
      <div style="text-align:center;margin-bottom:20px">
        <div style="display:inline-block;border:2px solid #333;padding:6px 20px;font-size:1rem;font-weight:800">
          สมรรถนะผู้เรียน
        </div>
      </div>
      <div style="display:flex;align-items:flex-end;gap:12px;padding:20px 8px 0;border:1px solid #e5e7eb;border-radius:8px;background:#fafafa;position:relative">
        <!-- Y-axis labels -->
        <div style="display:flex;flex-direction:column;justify-content:space-between;height:160px;padding-bottom:0;font-size:.7rem;color:#6b7280;text-align:right;min-width:20px;flex-shrink:0">
          <span>๓</span><span>๒</span><span>๑</span><span>๐</span>
        </div>
        ${chartGroupHtml}
      </div>
      <!-- Legend -->
      <div style="display:flex;gap:20px;justify-content:center;margin-top:16px;font-size:.75rem">
        <div style="display:flex;align-items:center;gap:5px"><div style="width:14px;height:14px;background:#3b82f6;border-radius:2px"></div>ภาคเรียนที่ ๑</div>
        <div style="display:flex;align-items:center;gap:5px"><div style="width:14px;height:14px;background:#f59e0b;border-radius:2px"></div>ภาคเรียนที่ ๒</div>
        <div style="display:flex;align-items:center;gap:5px"><div style="width:14px;height:14px;background:#9ca3af;border-radius:2px"></div>สรุปปี ${academicYear}</div>
      </div>
    </div>

    <h2>6. ความคิดเห็นของครู</h2>
    <p style="font-weight:700">ภาคเรียนที่ 1:</p>
    <p style="min-height:60px;border:1px solid #d1d5db;border-radius:4px;padding:8px;font-size:.85rem">${teacherComments?.term1 || '—'}</p>
    <p style="font-weight:700">ภาคเรียนที่ 2:</p>
    <p style="min-height:60px;border:1px solid #d1d5db;border-radius:4px;padding:8px;font-size:.85rem">${teacherComments?.term2 || '—'}</p>

    <h2>7. ความคิดเห็นของผู้ปกครอง</h2>
    <p style="font-weight:700">ภาคเรียนที่ 1:</p>
    <p style="min-height:60px;border:1px solid #d1d5db;border-radius:4px;padding:8px;font-size:.85rem">${parentComments?.term1 || '—'}</p>
    <p style="font-weight:700">ภาคเรียนที่ 2:</p>
    <p style="min-height:60px;border:1px solid #d1d5db;border-radius:4px;padding:8px;font-size:.85rem">${parentComments?.term2 || '—'}</p>

    <h2>8. ความคิดเห็นของผู้อำนวยการสถานศึกษา</h2>
    <p style="min-height:60px;border:1px solid #d1d5db;border-radius:4px;padding:8px;font-size:.85rem">${directorsComment || '—'}</p>

    ${overallLevel !== null ? `
    <div style="margin-top:28px;padding:14px 18px;border:1.5px solid #d1d5db;border-radius:8px;background:#f9fafb;font-size:.87rem;line-height:2;text-align:justify">
      สรุปผลการประเมินภาพรวมเมื่อจบชั้นปีการศึกษา ${academicYear} จากการประเมินพัฒนาการทั้ง ๔ ด้าน
      พบว่า ${genderPrefix} ${student?.name ?? ''} มีผลการประเมินอยู่ในเกณฑ์
      <strong style="display:inline-block;padding:1px 10px;border-radius:4px;background:${levelBg};color:#fff;margin:0 4px">
        ระดับ ${overallLevel} (${overallLevelLabel})
      </strong>
      มีความพร้อมในการเลื่อนชั้นขึ้นสู่ระดับชั้น <strong>${nextLevelLabel}</strong> ต่อไป
    </div>` : ''}

    <div style="margin-top:32px;display:flex;justify-content:space-around;text-align:center">
      <div style="min-width:200px">
        <div style="height:52px"></div>
        <div style="border-top:1px solid #000;padding-top:6px;font-size:.85rem">
          ลงชื่อ..................................ครูประจำชั้น
        </div>
        ${teacherName ? `<div style="font-size:.82rem;color:#374151;margin-top:4px">(${teacherName})</div>` : ''}
      </div>
      <div style="min-width:200px">
        <div style="height:52px"></div>
        <div style="border-top:1px solid #000;padding-top:6px;font-size:.85rem">
          ลงชื่อ..................................ผู้บริหารสถานศึกษา
        </div>
        ${directorName ? `<div style="font-size:.82rem;color:#374151;margin-top:4px">(${directorName})</div>` : ''}
      </div>
    </div>
  </body></html>`;
  const _blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const _blobUrl = URL.createObjectURL(_blob);
  const win = window.open(_blobUrl, '_blank', 'width=900,height=1200');
  if (!win) { URL.revokeObjectURL(_blobUrl); return; }
  win.addEventListener('load', () => {
    win.focus();
    win.print();
    URL.revokeObjectURL(_blobUrl);
  });
}

// ── static book content ──────────────────────────────────────────────────────
const INTRO_LETTER = `การจัดการศึกษาสำหรับเด็กปฐมวัย มุ่งเน้นให้เด็กมีพัฒนาการที่เหมาะสมกับวัยตามความสามารถ และความแตกต่างระหว่างบุคคล ทั้งทางด้านร่างกาย อารมณ์ จิตใจ สังคม และสติปัญญา เมื่อเด็กจบการศึกษาในระดับการศึกษาปฐมวัยแล้ว จะมีมาตรฐานคุณลักษณะที่พึงประสงค์ตามตัวบ่งชี้ และสภาพที่พึงประสงค์ตามหลักสูตรการศึกษาปฐมวัย พุทธศักราช 2560 ที่กำหนดไว้

สมุดรายงานประจำตัวเด็กฉบับนี้ เป็นการรายงานผลการพัฒนาของบุตร-หลานท่าน ว่ามีพัฒนาการและความพร้อมที่จะเรียนต่อในระดับที่สูงขึ้นหรือไม่ โดยครูจะสังเกต สนทนา สัมภาษณ์ บันทึกพฤติกรรมเด็กและวิเคราะห์ข้อมูลผลงานที่เก็บอย่างเป็นระบบ ผ่านกิจวัตรและกิจกรรมประจำวัน โดยมีเกณฑ์การประเมิน 3 ระดับ คือ

ระดับ 3 คือ ดี          หมายถึง สามารถแสดงพฤติกรรมหรือปฏิบัติถูกต้องได้คล่องแคล่ว ชัดเจนและมั่นคง
ระดับ 2 คือ พอใช้     หมายถึง สามารถแสดงพฤติกรรมถูกต้องแต่ยังไม่คล่องแคล่ว ไม่มั่นคง
ระดับ 1 คือ ปรับปรุง  หมายถึง ยังแสดงพฤติกรรมได้น้อยหรือไม่ได้เลย แสดงพฤติกรรมหรือปฏิบัติได้บ้าง แต่ต้องให้ความช่วยเหลือ

ผู้ปกครองสามารถสังเกตจากการแสดงออกของบุตร-หลานได้ และหากผู้ปกครองมีข้อเสนอแนะใดๆ เกี่ยวกับเด็ก ขณะที่อยู่บ้าน สามารถแสดงความคิดเห็นได้ในตอนท้ายของสมุดรายงานเล่มนี้ ทั้งนี้ โรงเรียนมุ่งหวังที่จะร่วมมือกับผู้ปกครองในการพัฒนาบุตร-หลาน ให้มีความเจริญงอกงามอย่างสมดุล รอบด้านเต็มความสามารถของเด็กเพื่อให้เป็นทรัพยากรบุคคลที่มีคุณภาพต่อไป`;

const PHILOSOPHY_TEXT = `การศึกษาปฐมวัย เป็นการพัฒนาเด็กตั้งแต่แรกเกิดถึง 6 ปีบริบูรณ์ อย่างเป็นองค์รวม บนพื้นฐานการอบรมเลี้ยงดูและการส่งเสริมกระบวนการเรียนรู้ที่สนองต่อธรรมชาติและพัฒนาการตามวัยของเด็กแต่ละคนให้เต็มตามศักยภาพ ภายใต้บริบทสังคมและวัฒนธรรมที่เด็กอาศัยอยู่ ด้วยความรัก ความเอื้ออาทร และความเข้าใจของทุกคน เพื่อสร้างรากฐานคุณภาพชีวิตให้เด็กพัฒนาไปสู่ความเป็นมนุษย์ที่สมบูรณ์ เกิดคุณค่าต่อตนเอง ครอบครัว ชุมชน สังคม และประเทศชาติ`;

const VISION_TEXT = `หลักสูตรการศึกษาปฐมวัยมุ่งพัฒนาเด็กทุกคนให้ได้รับการพัฒนาด้านร่างกาย อารมณ์ จิตใจ สังคมและสติปัญญา อย่างมีคุณภาพและต่อเนื่อง ได้รับการจัดประสบการณ์การเรียนรู้อย่างมีความสุขและเหมาะสมตามวัย มีทักษะชีวิต และปฏิบัติตนตามหลักปรัชญาของเศรษฐกิจพอเพียง เป็นคนดี มีวินัย และสำนึกความเป็นไทย โดยความร่วมมือระหว่างสถานศึกษา พ่อแม่ ครอบครัว ชุมชน และทุกฝ่ายที่เกี่ยวข้องกับการพัฒนาเด็ก`;

const AIMS = [
  'ร่างกายเจริญเติบโตตามวัยและมีสุขนิสัยที่ดี',
  'สุขภาพจิตดี มีความสุข ร่าเริงแจ่มใส และมีคุณธรรม จริยธรรม',
  'มีทักษะชีวิตและปฏิบัติตนตามหลักปรัชญาของเศรษฐกิจพอเพียง มีทักษะในการใช้เทคโนโลยีที่เหมาะสมกับวัย',
  'มีทักษะในการคิดและการแก้ปัญหาได้เหมาะสมกับวัย มีจินตนาการและความคิดสร้างสรรค์',
  'มีจิตสำนึกในการอนุรักษ์วัฒนธรรมและสิ่งแวดล้อม มีจิตสาธารณะและช่วยเหลือแบ่งปัน',
];

// sorted GROWTH_TABLE rows for rendering
const GROWTH_ROWS = Object.entries(GROWTH_TABLE)
  .map(([key, v]) => {
    const [y, m] = key.split('-').map(Number);
    return { year: y, month: m, ...v };
  })
  .sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month);

// ── ความสามารถผู้เรียน 4 ด้าน (อ.01) ────────────────────────────────────────
// อ้างอิงตัวบ่งชี้ตรงกับ ประเมินผลพัฒนาการ (INDICATORS_DATA)
// หลักสูตรการศึกษาปฐมวัย พ.ศ. 2560 — ครบ 41 ตัวบ่งชี้ (8+9+12+12)
// ทุกด้านใช้ subDomains จัดกลุ่มตามมาตรฐาน / domainId+standardId+indicatorId ใช้ lookup คะแนน
const DEV_ASSESS_DOMAINS = [

  // ─── D1: ด้านร่างกาย (8 ตัวบ่งชี้) ─────────────────────────────────────────
  {
    id: 'd1', label: 'ด้านร่างกาย', emoji: '🏃',
    color: '#059669', bg: '#ecfdf5',
    subDomains: [
      {
        key: 'qa3', label: 'ระบบที่ 1 — มาตรฐาน ดย. ตัวบ่งชี้ 3.1–3.3',
        components: [
          { code: '3.1', key: 'd1_qa3_3_1',
            label: 'น้ำหนักและส่วนสูงตามเกณฑ์มาตรฐานของกรมอนามัย',
            descriptor: 'น้ำหนักตามเกณฑ์มาตรฐาน / ส่วนสูงตามเกณฑ์มาตรฐาน',
            domainId: 'physical', standardId: 'qa-3', indicatorId: '3.1' },
          { code: '3.2', key: 'd1_qa3_3_2',
            label: 'มีสุขภาพอนามัยที่ดีและมีสุขนิสัยที่ดี',
            descriptor: 'สุขอนามัยส่วนตัว / ความปลอดภัยในชีวิตประจำวัน',
            domainId: 'physical', standardId: 'qa-3', indicatorId: '3.2' },
          { code: '3.3', key: 'd1_qa3_3_3',
            label: 'มีทักษะการเคลื่อนไหวตามวัย',
            descriptor: 'กล้ามเนื้อมัดใหญ่ (Gross Motor) / กล้ามเนื้อมัดเล็ก (Fine Motor)',
            domainId: 'physical', standardId: 'qa-3', indicatorId: '3.3' },
        ],
      },
      {
        key: 'std1', label: 'มาตรฐานที่ 1 ร่างกายเจริญเติบโตตามวัยและมีสุขนิสัยที่ดี',
        components: [
          { code: '1.1', key: 'd1_std1_1_1',
            label: 'น้ำหนักและส่วนสูงตามเกณฑ์ของกรมอนามัย',
            descriptor: 'ชั่งน้ำหนัก วัดส่วนสูง บันทึกและติดตามพัฒนาการตามเกณฑ์มาตรฐาน',
            domainId: 'physical', standardId: 'std-1', indicatorId: '1.1' },
          { code: '1.2', key: 'd1_std1_1_2',
            label: 'มีสุขภาพอนามัยและสุขนิสัยที่ดี',
            descriptor: 'รับประทานอาหารที่มีประโยชน์ ล้างมือ แปรงฟัน นอนพักผ่อนเป็นเวลา',
            domainId: 'physical', standardId: 'std-1', indicatorId: '1.2' },
          { code: '1.3', key: 'd1_std1_1_3',
            label: 'รักษาความปลอดภัยของตนเองและผู้อื่น',
            descriptor: 'เล่นและทำกิจกรรมต่างๆ อย่างปลอดภัยด้วยตนเอง ระมัดระวังอันตรายจากสิ่งแวดล้อม',
            domainId: 'physical', standardId: 'std-1', indicatorId: '1.3' },
        ],
      },
      {
        key: 'std2', label: 'มาตรฐานที่ 2 กล้ามเนื้อใหญ่และกล้ามเนื้อเล็กแข็งแรงใช้ได้อย่างคล่องแคล่ว',
        components: [
          { code: '2.1', key: 'd1_std2_2_1',
            label: 'เคลื่อนไหวร่างกายอย่างคล่องแคล่วและทรงตัวได้',
            descriptor: 'เดินต่อเท้า กระโดดสองขา วิ่งแล้วหยุด รับและโยนลูกบอล ยืนขาเดียว กระโดดขาเดียว',
            domainId: 'physical', standardId: 'std-2', indicatorId: '2.1' },
          { code: '2.2', key: 'd1_std2_2_2',
            label: 'ใช้มือ-ตาประสานสัมพันธ์กัน',
            descriptor: 'จับดินสอถูกต้อง ตัดกระดาษเส้นตรง วาดรูปคน ปั้นดินน้ำมัน ร้อยวัสดุ ประกอบชิ้นส่วน',
            domainId: 'physical', standardId: 'std-2', indicatorId: '2.2' },
        ],
      },
    ],
  },

  // ─── D2: ด้านอารมณ์-จิตใจ (9 ตัวบ่งชี้) ──────────────────────────────────
  {
    id: 'd2', label: 'ด้านอารมณ์-จิตใจ', emoji: '❤️',
    color: '#e11d48', bg: '#fff1f2',
    subDomains: [
      {
        key: 'qa4', label: 'ระบบที่ 1 — มาตรฐาน ดย. ตัวบ่งชี้ 4.1–4.3',
        components: [
          { code: '4.1', key: 'd2_qa4_4_1',
            label: 'มีสุขภาพจิตดี มีความสุข ร่าเริงแจ่มใส',
            descriptor: 'แสดงออกทางอารมณ์ได้เหมาะสม / ความเชื่อมั่นและภาคภูมิใจในตนเอง',
            domainId: 'emotional', standardId: 'qa-4', indicatorId: '4.1' },
          { code: '4.2', key: 'd2_qa4_4_2',
            label: 'มีคุณธรรม จริยธรรม และจิตใจที่ดีงาม',
            descriptor: 'ซื่อสัตย์สุจริต / เมตตากรุณา น้ำใจ / ความรับผิดชอบ',
            domainId: 'emotional', standardId: 'qa-4', indicatorId: '4.2' },
          { code: '4.3', key: 'd2_qa4_4_3',
            label: 'สนใจ มีความสุขและแสดงออกผ่านงานศิลปะ ดนตรี และการเคลื่อนไหว',
            descriptor: 'ศิลปะ ดนตรี และการเคลื่อนไหวสร้างสรรค์',
            domainId: 'emotional', standardId: 'qa-4', indicatorId: '4.3' },
        ],
      },
      {
        key: 'std3', label: 'มาตรฐานที่ 3 มีสุขภาพจิตดีและมีความสุข',
        components: [
          { code: '3.1', key: 'd2_std3_3_1',
            label: 'แสดงออกทางอารมณ์ได้อย่างเหมาะสม',
            descriptor: 'แสดงอารมณ์ความรู้สึก (ดีใจ เสียใจ โกรธ กลัว) ได้เหมาะสมกับสถานการณ์ ควบคุมอารมณ์ตนเองได้',
            domainId: 'emotional', standardId: 'std-3', indicatorId: '3.1' },
          { code: '3.2', key: 'd2_std3_3_2',
            label: 'มีความรู้สึกที่ดีต่อตนเองและผู้อื่น',
            descriptor: 'พูดถึงตนเองในทางบวก มีความภาคภูมิใจในผลงาน ชื่นชมและให้กำลังใจเพื่อน',
            domainId: 'emotional', standardId: 'std-3', indicatorId: '3.2' },
        ],
      },
      {
        key: 'std4', label: 'มาตรฐานที่ 4 ชื่นชมสุนทรียภาพ ดนตรี การเคลื่อนไหว และศิลปะ',
        components: [
          { code: '4.1', key: 'd2_std4_4_1',
            label: 'สนใจ มีความสุขและแสดงออกผ่านงานศิลปะ ดนตรีและการเคลื่อนไหว',
            descriptor: 'วาดภาพระบายสี ร้องเพลง ทำงานประดิษฐ์ศิลปะ เล่นเครื่องดนตรี ตามจินตนาการ',
            domainId: 'emotional', standardId: 'std-4', indicatorId: '4.1' },
        ],
      },
      {
        key: 'std5', label: 'มาตรฐานที่ 5 มีคุณธรรม จริยธรรมและมีจิตใจที่ดีงาม',
        components: [
          { code: '5.1', key: 'd2_std5_5_1',
            label: 'ซื่อสัตย์สุจริต',
            descriptor: 'พูดความจริง ไม่หยิบของผู้อื่นโดยไม่ได้รับอนุญาต สารภาพและรับผิดชอบเมื่อทำผิดพลาด',
            domainId: 'emotional', standardId: 'std-5', indicatorId: '5.1' },
          { code: '5.2', key: 'd2_std5_5_2',
            label: 'มีความเมตตากรุณา มีน้ำใจและช่วยเหลือแบ่งปัน',
            descriptor: 'ช่วยเหลือเพื่อนเมื่อต้องการ แบ่งปันสิ่งของและของเล่นให้ผู้อื่นด้วยความเต็มใจ',
            domainId: 'emotional', standardId: 'std-5', indicatorId: '5.2' },
          { code: '5.3', key: 'd2_std5_5_3',
            label: 'มีความรับผิดชอบ',
            descriptor: 'ทำงานที่ได้รับมอบหมายจนสำเร็จด้วยตนเอง รับผิดชอบดูแลรักษาทรัพย์สินส่วนรวมของห้องเรียน',
            domainId: 'emotional', standardId: 'std-5', indicatorId: '5.3' },
        ],
      },
    ],
  },

  // ─── D3: ด้านสังคม (12 ตัวบ่งชี้) ──────────────────────────────────────────
  {
    id: 'd3', label: 'ด้านสังคม', emoji: '🤝',
    color: '#7c3aed', bg: '#f5f3ff',
    subDomains: [
      {
        key: 'qa5', label: 'ระบบที่ 1 — มาตรฐาน ดย. ตัวบ่งชี้ 5.1–5.4',
        components: [
          { code: '5.1', key: 'd3_qa5_5_1',
            label: 'ช่วยเหลือตนเองในการปฏิบัติกิจวัตรประจำวัน',
            descriptor: 'ดูแลตนเองและกิจวัตรประจำวัน — แต่งตัว รับประทานอาหาร เก็บของเล่นของใช้เข้าที่',
            domainId: 'social', standardId: 'qa-5', indicatorId: '5.1' },
          { code: '5.2', key: 'd3_qa5_5_2',
            label: 'มีวินัย รับผิดชอบ เคารพกฎกติกา',
            descriptor: 'วินัยและกฎกติกาของห้องเรียน / มารยาทและวัฒนธรรมไทย — ไหว้ทักทาย กล่าวขอบคุณและขอโทษ',
            domainId: 'social', standardId: 'qa-5', indicatorId: '5.2' },
          { code: '5.3', key: 'd3_qa5_5_3',
            label: 'ยอมรับความเหมือนและความแตกต่างระหว่างบุคคล',
            descriptor: 'ยอมรับและเคารพความแตกต่างของผู้อื่น เล่นและทำงานร่วมกับเพื่อนที่แตกต่างจากตน',
            domainId: 'social', standardId: 'qa-5', indicatorId: '5.3' },
          { code: '5.4', key: 'd3_qa5_5_4',
            label: 'ทำงานร่วมกับผู้อื่น เล่นและทำกิจกรรมร่วมกันได้',
            descriptor: 'ปฏิสัมพันธ์และการทำงานเป็นทีม — เล่นร่วมกัน รอคอยตามลำดับ ผลัดกัน',
            domainId: 'social', standardId: 'qa-5', indicatorId: '5.4' },
        ],
      },
      {
        key: 'std6', label: 'มาตรฐานที่ 6 มีทักษะชีวิตและปฏิบัติตนตามหลักปรัชญาเศรษฐกิจพอเพียง',
        components: [
          { code: '6.1', key: 'd3_std6_6_1',
            label: 'ช่วยเหลือตนเองในการปฏิบัติกิจวัตรประจำวัน',
            descriptor: 'แต่งตัวด้วยตนเอง (ใส่เสื้อผ้า ติดกระดุม ผูกเชือกรองเท้า) รับประทานอาหารด้วยตนเองและมีมารยาท',
            domainId: 'social', standardId: 'std-6', indicatorId: '6.1' },
          { code: '6.2', key: 'd3_std6_6_2',
            label: 'มีวินัยในตนเอง',
            descriptor: 'เก็บของเล่นของใช้เข้าที่เรียบร้อย เข้าแถวตามลำดับก่อนหลัง ปฏิบัติตามกฎกติกาของห้องเรียนและโรงเรียน',
            domainId: 'social', standardId: 'std-6', indicatorId: '6.2' },
          { code: '6.3', key: 'd3_std6_6_3',
            label: 'ประหยัดและพอเพียง',
            descriptor: 'ใช้สิ่งของเครื่องใช้อย่างประหยัดและรู้จักพอเพียง ไม่ทิ้งอาหาร รับประทานแต่พอดีไม่เหลือทิ้ง',
            domainId: 'social', standardId: 'std-6', indicatorId: '6.3' },
        ],
      },
      {
        key: 'std7', label: 'มาตรฐานที่ 7 รักธรรมชาติ สิ่งแวดล้อม วัฒนธรรม และความเป็นไทย',
        components: [
          { code: '7.1', key: 'd3_std7_7_1',
            label: 'ดูแลรักษาธรรมชาติและสิ่งแวดล้อม',
            descriptor: 'ทิ้งขยะได้ถูกที่และแยกขยะเบื้องต้น ดูแลรดน้ำต้นไม้ ไม่ทำลายทรัพยากรธรรมชาติและสิ่งแวดล้อม',
            domainId: 'social', standardId: 'std-7', indicatorId: '7.1' },
          { code: '7.2', key: 'd3_std7_7_2',
            label: 'มีมารยาทตามวัฒนธรรมไทยและรักความเป็นไทย',
            descriptor: 'ไหว้ทักทายและกล่าวขอบคุณ-ขอโทษตามกาลเทศะ ยืนตรงเมื่อได้ยินเพลงชาติ เข้าร่วมกิจกรรมวัฒนธรรมไทย',
            domainId: 'social', standardId: 'std-7', indicatorId: '7.2' },
        ],
      },
      {
        key: 'std8', label: 'มาตรฐานที่ 8 อยู่ร่วมกับผู้อื่นได้อย่างมีความสุขและปฏิบัติตนเป็นสมาชิกที่ดีของสังคม',
        components: [
          { code: '8.1', key: 'd3_std8_8_1',
            label: 'ยอมรับความเหมือนและความแตกต่างระหว่างบุคคล',
            descriptor: 'เล่นและทำกิจกรรมร่วมกับเด็กที่มีความแตกต่าง เคารพสิทธิ์และรับฟังความคิดเห็นของผู้อื่น',
            domainId: 'social', standardId: 'std-8', indicatorId: '8.1' },
          { code: '8.2', key: 'd3_std8_8_2',
            label: 'มีปฏิสัมพันธ์ที่ดีกับผู้อื่น',
            descriptor: 'เล่นและทำงานร่วมกับเพื่อนได้อย่างมีความสุข รู้จักรอคิวและผลัดกันพูดในกลุ่ม',
            domainId: 'social', standardId: 'std-8', indicatorId: '8.2' },
          { code: '8.3', key: 'd3_std8_8_3',
            label: 'ปฏิบัติตนเบื้องต้นในการเป็นสมาชิกที่ดีของสังคม',
            descriptor: 'ปฏิบัติตนเป็นผู้นำและผู้ตามได้เหมาะสมกับสถานการณ์ ช่วยเหลืองานส่วนรวมของห้องเรียนและโรงเรียน',
            domainId: 'social', standardId: 'std-8', indicatorId: '8.3' },
        ],
      },
    ],
  },

  // ─── D4: ด้านสติปัญญา (12 ตัวบ่งชี้) ────────────────────────────────────────
  {
    id: 'd4', label: 'ด้านสติปัญญา', emoji: '💡',
    color: '#b45309', bg: '#fffbeb',
    subDomains: [
      {
        key: 'qa6', label: 'ระบบที่ 1 — มาตรฐาน ดย. ตัวบ่งชี้ 6.1–6.3',
        components: [
          { code: '6.1', key: 'd4_qa6_6_1',
            label: 'ใช้ภาษาสื่อสารได้เหมาะสมกับวัย',
            descriptor: 'ทักษะการฟังและพูด / ทักษะการอ่านและเขียนเบื้องต้น',
            domainId: 'mental', standardId: 'qa-6', indicatorId: '6.1' },
          { code: '6.2', key: 'd4_qa6_6_2',
            label: 'มีความสามารถในการคิดและแก้ปัญหาเบื้องต้น',
            descriptor: 'ทักษะการสังเกต จำแนก และเปรียบเทียบ / ทักษะการคิดและการแก้ปัญหา',
            domainId: 'mental', standardId: 'qa-6', indicatorId: '6.2' },
          { code: '6.3', key: 'd4_qa6_6_3',
            label: 'มีจินตนาการและความคิดสร้างสรรค์',
            descriptor: 'จินตนาการและการสร้างสรรค์ผลงาน — สร้างผลงานตามความคิดและจินตนาการของตนเอง',
            domainId: 'mental', standardId: 'qa-6', indicatorId: '6.3' },
        ],
      },
      {
        key: 'std9', label: 'มาตรฐานที่ 9 ใช้ภาษาสื่อสารได้เหมาะสมกับวัย',
        components: [
          { code: '9.1', key: 'd4_std9_9_1',
            label: 'รับรู้และเข้าใจความหมายของภาษา',
            descriptor: 'สนทนาโต้ตอบ เล่าเรื่องราว ฟังนิทานและตอบคำถาม ปฏิบัติตามคำสั่งต่อเนื่อง 2–3 ขั้นตอน',
            domainId: 'mental', standardId: 'std-9', indicatorId: '9.1' },
          { code: '9.2', key: 'd4_std9_9_2',
            label: 'แสดงออกและสื่อสารความคิด ความรู้สึก',
            descriptor: 'อ่านภาพและสัญลักษณ์ง่ายๆ เขียนชื่อตนเองตามแบบ เล่าเรื่องราวจากภาพหรือประสบการณ์',
            domainId: 'mental', standardId: 'std-9', indicatorId: '9.2' },
        ],
      },
      {
        key: 'std10', label: 'มาตรฐานที่ 10 มีความสามารถในการคิดที่เป็นพื้นฐานในการเรียนรู้',
        components: [
          { code: '10.1', key: 'd4_std10_10_1',
            label: 'มีความสามารถในการคิดรวบยอด',
            descriptor: 'บอกลักษณะสิ่งต่างๆ จับคู่ เปรียบเทียบ จำแนกหมวดหมู่ เรียงลำดับสิ่งของอย่างน้อย 5 ลำดับ',
            domainId: 'mental', standardId: 'std-10', indicatorId: '10.1' },
          { code: '10.2', key: 'd4_std10_10_2',
            label: 'มีความสามารถในการคิดเชิงเหตุผล',
            descriptor: 'ระบุสาเหตุหรือผลที่เกิดขึ้นในเหตุการณ์ต่างๆ คาดเดาหรือคาดคะเนสิ่งที่จะเกิดขึ้นต่อไปได้',
            domainId: 'mental', standardId: 'std-10', indicatorId: '10.2' },
          { code: '10.3', key: 'd4_std10_10_3',
            label: 'มีความสามารถในการคิดแก้ปัญหาและตัดสินใจ',
            descriptor: 'ตัดสินใจในเรื่องง่ายๆ และรับผิดชอบต่อผลที่เกิดขึ้น แก้ปัญหาเบื้องต้นในชีวิตประจำวันด้วยตนเอง',
            domainId: 'mental', standardId: 'std-10', indicatorId: '10.3' },
        ],
      },
      {
        key: 'std11', label: 'มาตรฐานที่ 11 มีจินตนาการและความคิดสร้างสรรค์',
        components: [
          { code: '11.1', key: 'd4_std11_11_1',
            label: 'สร้างผลงานตามจินตนาการและความคิดสร้างสรรค์',
            descriptor: 'สร้างผลงานศิลปะเพื่อสื่อสารความคิดและความรู้สึก ต่อก้อนไม้หรือบล็อกสร้างสิ่งต่างๆ ตามจินตนาการ',
            domainId: 'mental', standardId: 'std-11', indicatorId: '11.1' },
          { code: '11.2', key: 'd4_std11_11_2',
            label: 'แสดงท่าทาง/เคลื่อนไหวตามจินตนาการ',
            descriptor: 'เคลื่อนไหวท่าทางเพื่อสื่อสารความคิดและความรู้สึกของตนเอง แสดงบทบาทสมมติตามจินตนาการและประสบการณ์',
            domainId: 'mental', standardId: 'std-11', indicatorId: '11.2' },
        ],
      },
      {
        key: 'std12', label: 'มาตรฐานที่ 12 มีเจตคติที่ดีต่อการเรียนรู้และมีทักษะในการแสวงหาความรู้',
        components: [
          { code: '12.1', key: 'd4_std12_12_1',
            label: 'มีเจตคติที่ดีต่อการเรียนรู้',
            descriptor: 'สนใจซักถามเกี่ยวกับสัญลักษณ์หรือตัวหนังสือที่พบเห็น กระตือรือร้นและมีความสุขในการเรียนรู้',
            domainId: 'mental', standardId: 'std-12', indicatorId: '12.1' },
          { code: '12.2', key: 'd4_std12_12_2',
            label: 'มีทักษะในการแสวงหาความรู้',
            descriptor: 'ค้นหาคำตอบของข้อสงสัยต่างๆ ด้วยตนเอง ใช้คำถาม "ทำไม" "อย่างไร" "เมื่อไหร่" ในการค้นหาความรู้',
            domainId: 'mental', standardId: 'std-12', indicatorId: '12.2' },
        ],
      },
    ],
  },
];

// ── helpers: support both flat `components` and `subDomains` (d4) ─────────────
function domainAllComponents(domain) {
  if (domain.subDomains) return domain.subDomains.flatMap(s => s.components);
  return domain.components ?? [];
}

function emptyDevAssess() {
  const r = {};
  DEV_ASSESS_DOMAINS.forEach(d =>
    domainAllComponents(d).forEach(c => {
      r[c.key] = { t1level: 0, t1highlight: '', t2level: 0, t2highlight: '', summary: 0 };
    })
  );
  return r;
}

// level badge helper for devAssess domains (tab header)
function devAssessDomainAvg(devAssessment, domainId) {
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
export default function StudentReportTab({ teacherClassFilter = null }) {
  const {
    students, classes, teachers, academicYear, schoolName,
    schoolPhilosophy, schoolVision, schoolLogo, schoolDirectorName,
    dailyRecords,
    studentReportRecords, setStudentReportRecords,
    indicators, activities, assessmentTopics,
    aiApiKey,
    measurementDates,
  } = useApp();

  const [aiCommentLoading, setAiCommentLoading] = useState({ 1: false, 2: false });
  const [aiCommentError,   setAiCommentError]   = useState({ 1: '', 2: '' });
  const [aiDomainLoading,  setAiDomainLoading]  = useState({});
  const [aiDomainError,    setAiDomainError]    = useState({});

  const [selStudentId, setSelStudentId] = useState(null);
  const [activeSection, setActiveSection] = useState('physical');
  const [devAssessTab, setDevAssessTab] = useState('d1');
  const [newHs, setNewHs] = useState({ date: todayISO(), service: '', note: '' });

  // ── filtered students ─────────────────────────────────────────────────────
  const filteredStudents = useMemo(() => {
    if (teacherClassFilter) return students.filter(s => s.className === teacherClassFilter);
    return students;
  }, [students, teacherClassFilter]);

  // sorted students by class then name
  const sortedStudents = useMemo(() =>
    [...filteredStudents].sort((a, b) =>
      (a.className ?? '').localeCompare(b.className ?? '', 'th') ||
      (a.name ?? '').localeCompare(b.name ?? '', 'th')
    ), [filteredStudents]);

  const student = useMemo(() =>
    students.find(s => String(s.id) === String(selStudentId)) ?? null
  , [students, selStudentId]);

  // ── record key ────────────────────────────────────────────────────────────
  const recKey = selStudentId ? `${selStudentId}__${academicYear}` : null;

  const rec = useMemo(() => {
    if (!recKey) return null;
    return studentReportRecords[recKey] ?? {
      studentId: selStudentId,
      academicYear,
      physicalRecords: emptyPhys(),
      growthRecords: emptyGrowth(),
      devAssessment: emptyDevAssess(),
      healthServices: [],
      teacherComments:  { term1: '', term2: '' },
      parentComments:   { term1: '', term2: '' },
      directorsComment: '',
    };
  }, [recKey, studentReportRecords, selStudentId, academicYear]);

  // ดึงข้อมูลจากบันทึก — ถ้ายังไม่มีวันที่ ให้ใช้ค่าเริ่มต้นจากเมนู "กำหนดวันวัดน้ำหนัก/ส่วนสูง"
  const physData = (() => {
    const raw = rec?.physicalRecords ?? emptyPhys();
    if (!measurementDates) return raw;
    const result = {};
    PHYS_KEYS.forEach(k => {
      result[k] = { ...raw[k], date: raw[k].date || (measurementDates[k] ?? '') };
    });
    return result;
  })();
  const growthData     = rec?.growthRecords  ?? emptyGrowth();
  const devAssessData  = rec?.devAssessment  ?? emptyDevAssess();
  const healthServices = rec?.healthServices ?? [];
  const teacherComments  = rec?.teacherComments  ?? { term1: '', term2: '' };
  const parentComments   = rec?.parentComments   ?? { term1: '', term2: '' };
  const directorsComment = rec?.directorsComment ?? '';

  // ── save helper ───────────────────────────────────────────────────────────
  const saveRec = useCallback((patch) => {
    if (!recKey) return;
    setStudentReportRecords(prev => ({
      ...prev,
      [recKey]: { ...(prev[recKey] ?? { studentId: selStudentId, academicYear, physicalRecords: emptyPhys(), growthRecords: emptyGrowth(), devAssessment: emptyDevAssess(), healthServices: [], teacherComments: { term1: '', term2: '' }, parentComments: { term1: '', term2: '' }, directorsComment: '' }), ...patch },
    }));
  }, [recKey, setStudentReportRecords, selStudentId, academicYear]);

  // ── physical record update ────────────────────────────────────────────────
  const updatePhys = useCallback((key, field, value) => {
    const current = physData[key] ?? { date: '', weight: '', height: '', weightLevel: 0, heightLevel: 0 };
    const updated  = { ...current, [field]: value };

    // auto-calc levels if we have weight/height + student birth date
    if ((field === 'weight' || field === 'height' || field === 'date') && updated.date && student?.birthDate) {
      const { ageYear, ageMonth } = ageAt(student.birthDate, updated.date);
      const gender = genderOf(student);
      const lvls = calcGrowthLevels(ageYear, ageMonth, updated.weight, updated.height, gender);
      if (updated.weight) updated.weightLevel = lvls.weightLevel;
      if (updated.height) updated.heightLevel = lvls.heightLevel;
    }

    saveRec({ physicalRecords: { ...physData, [key]: updated } });
  }, [physData, saveRec, student]);

  // ── monthly growth record update ──────────────────────────────────────────
  const updateGrowth = useCallback((key, field, value) => {
    const current = growthData[key] ?? { weight: '', height: '' };
    saveRec({ growthRecords: { ...growthData, [key]: { ...current, [field]: value } } });
  }, [growthData, saveRec]);

  // ── dev assess update ─────────────────────────────────────────────────────
  const updateDevAssess = useCallback((key, field, value) => {
    const current = devAssessData[key] ?? { t1level: 0, t1highlight: '', t2level: 0, t2highlight: '', summary: 0 };
    saveRec({ devAssessment: { ...devAssessData, [key]: { ...current, [field]: value } } });
  }, [devAssessData, saveRec]);

  // ── suggest levels from indicator scores for a whole domain ──────────────
  const handleSuggestDomain = useCallback((domain) => {
    if (!student) return;
    const comps = domainAllComponents(domain);
    const updates = {};
    let hasAny = false;
    comps.forEach(comp => {
      const t1 = suggestLevelFromIndicator(student, comp.domainId, comp.standardId, comp.indicatorId, 1);
      const t2 = suggestLevelFromIndicator(student, comp.domainId, comp.standardId, comp.indicatorId, 2);
      if (t1 > 0 || t2 > 0) {
        const current = devAssessData[comp.key] ?? { t1level: 0, t1highlight: '', t2level: 0, t2highlight: '', summary: 0 };
        const summary = t2 > 0 ? t2 : (t1 > 0 ? t1 : current.summary);
        updates[comp.key] = {
          ...current,
          ...(t1 > 0 ? { t1level: t1 } : {}),
          ...(t2 > 0 ? { t2level: t2 } : {}),
          summary,
        };
        hasAny = true;
      }
    });
    if (hasAny) {
      saveRec({ devAssessment: { ...devAssessData, ...updates } });
    } else {
      alert('ไม่พบข้อมูลประเมินผลพัฒนาการสำหรับด้านนี้');
    }
  }, [student, devAssessData, saveRec]);

  // ── AI domain summary ─────────────────────────────────────────────────────
  const handleAIDomainSummary = useCallback(async (domain) => {
    if (!aiApiKey || !student) return;
    const comps = domainAllComponents(domain);
    const compScores = comps.map(comp => {
      const d = devAssessData[comp.key] ?? {};
      return { code: comp.code, label: comp.label, t1level: d.t1level ?? 0, t2level: d.t2level ?? 0 };
    });
    setAiDomainLoading(p => ({ ...p, [domain.id]: true }));
    setAiDomainError(p => ({ ...p, [domain.id]: '' }));
    try {
      const result = await callClaude(aiApiKey, buildDomainSummaryPrompt(student, domain, compScores));
      const key = `__domainSummary_${domain.id}`;
      saveRec({ devAssessment: { ...devAssessData, [key]: result } });
    } catch (e) {
      setAiDomainError(p => ({ ...p, [domain.id]: e.message }));
    } finally {
      setAiDomainLoading(p => ({ ...p, [domain.id]: false }));
    }
  }, [aiApiKey, student, devAssessData, saveRec]);

  // ── auto-fill devAssess levels from indicator scores on student select ───────
  // เมื่อเลือกนักเรียนใหม่ ดึงคะแนนจากระบบประเมินพัฒนาการมาเติมให้อัตโนมัติ
  // (เติมเฉพาะช่องที่ยังเป็น 0 — ไม่ทับค่าที่ครูกรอกแล้ว)
  const autoFilledRecRef = useRef(null);

  useEffect(() => {
    if (!student || !recKey) return;
    if (autoFilledRecRef.current === recKey) return; // ป้องกันรัน 2 ครั้งสำหรับ student เดิม
    autoFilledRecRef.current = recKey;

    const currentDA = studentReportRecords[recKey]?.devAssessment ?? emptyDevAssess();
    const updates = {};
    let hasAny = false;

    DEV_ASSESS_DOMAINS.forEach(domain => {
      domainAllComponents(domain).forEach(comp => {
        if (!comp.domainId || !comp.standardId || !comp.indicatorId) return;
        const cur = currentDA[comp.key] ?? { t1level: 0, t2level: 0, summary: 0 };
        const fillT1 = (cur.t1level ?? 0) === 0
          ? suggestLevelFromIndicator(student, comp.domainId, comp.standardId, comp.indicatorId, 1)
          : 0;
        const fillT2 = (cur.t2level ?? 0) === 0
          ? suggestLevelFromIndicator(student, comp.domainId, comp.standardId, comp.indicatorId, 2)
          : 0;
        if (fillT1 > 0 || fillT2 > 0) {
          const fillSummary = (cur.summary ?? 0) === 0 ? (fillT2 || fillT1) : 0;
          updates[comp.key] = {
            ...cur,
            ...(fillT1 > 0 && { t1level: fillT1 }),
            ...(fillT2 > 0 && { t2level: fillT2 }),
            ...(fillSummary > 0 && { summary: fillSummary }),
          };
          hasAny = true;
        }
      });
    });

    if (!hasAny) return;
    setStudentReportRecords(prev => ({
      ...prev,
      [recKey]: {
        ...(prev[recKey] ?? {
          studentId: selStudentId, academicYear,
          physicalRecords: emptyPhys(), growthRecords: emptyGrowth(),
          devAssessment: emptyDevAssess(), healthServices: [],
          teacherComments: { term1: '', term2: '' },
          parentComments: { term1: '', term2: '' },
          directorsComment: '',
        }),
        devAssessment: { ...currentDA, ...updates },
      },
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student?.id, recKey]);

  // ── attendance summary (computed from dailyRecords) ───────────────────────
  const attendanceSummary = useMemo(() => {
    if (!student) return { term1: {}, term2: {} };
    // gather all dates with a record for this student
    const summary = { term1: { totalDays: 0, presentDays: 0, absentDays: 0 },
                      term2: { totalDays: 0, presentDays: 0, absentDays: 0 } };
    Object.entries(dailyRecords).forEach(([date, dayRecs]) => {
      const stuRec = dayRecs?.[String(student.id)];
      if (!stuRec) return;
      const m = new Date(date).getMonth() + 1; // 1-12
      // term1 = May–Sep (5–9), term2 = Oct–Mar (10–12, 1–4)
      const term = (m >= 5 && m <= 9) ? 1 : 2;
      const t = `term${term}`;
      summary[t].totalDays++;
      if (stuRec.status === 'present' || stuRec.present) summary[t].presentDays++;
      else summary[t].absentDays++;
    });
    return summary;
  }, [dailyRecords, student]);

  // ── developmental domains (from indicators + student.assessments) ─────────
  const devDomains = useMemo(() => {
    if (!student) return [];
    return INDICATORS_DATA.map(domain => ({
      ...domain,
      standards: domain.standards.map(std => ({
        ...std,
        indicators: std.indicators.map(ind => {
          const indKey  = `${domain.id}__${std.id}__${ind.id}`;
          const indData = student.assessments?.indicators?.[indKey] ?? {};
          const actIds  = [];
          const actLabels = {};
          ind.items.forEach(item => {
            item.activities.forEach(act => {
              const actKey = `${indKey}__${item.id}__${act.no}`;
              // find in activities store (may have been renamed)
              const stored = activities.find(a => a.id === actKey);
              actIds.push(actKey);
              actLabels[actKey] = stored?.label ?? act.label;
            });
          });
          const scores = {};
          actIds.forEach(id => {
            scores[id] = {
              term1: getActivityTermScore(indData[id], 1),
              term2: getActivityTermScore(indData[id], 2),
            };
          });
          const indScores = {
            term1: getIndicatorTermScore(indData, actIds, 1),
            term2: getIndicatorTermScore(indData, actIds, 2),
          };
          return { ...ind, indKey, actIds, actLabels, scores, indScores };
        }),
      })),
    }));
  }, [student, activities]);

  // ── section tabs ──────────────────────────────────────────────────────────
  const SECTIONS = [
    { id: 'physical',    label: '⚖️ ร่างกาย'              },
    { id: 'health',      label: '💉 บริการสุขภาพ'          },  // อ.01: ส่วนที่ 2
    { id: 'attendance',  label: '📅 เวลาเรียน'             },  // อ.01: ส่วนที่ 3
    { id: 'devreport',   label: '📋 พัฒนาการ'              },
    { id: 'summary',     label: '📊 สรุป 12 มาตรฐาน'      },
    { id: 'domain4',    label: '🎯 สรุปพัฒนาการ 4 ด้าน'  },
    { id: 'comments',    label: '💬 ความคิดเห็น'           },
    { id: 'philosophy',  label: '📖 ปรัชญา/วิสัยทัศน์'    },
    { id: 'growthtable', label: '📏 เกณฑ์การเจริญเติบโต'  },
  ];

  // ── classes for selector ──────────────────────────────────────────────────
  const classNames = useMemo(() => {
    const all = teacherClassFilter
      ? [teacherClassFilter]
      : [...new Set(sortedStudents.map(s => s.className).filter(Boolean))].sort();
    return all;
  }, [sortedStudents, teacherClassFilter]);

  const [selClass, setSelClass] = useState(classNames[0] ?? '');
  const studentsInClass = useMemo(() =>
    sortedStudents.filter(s => s.className === selClass),
  [sortedStudents, selClass]);

  // ── UI ────────────────────────────────────────────────────────────────────
  const ACCENT = '#7c3aed';
  const BG     = '#f5f3ff';

  return (
    <div className="glass p-6 animate-fade">
      <div className="page-header mb-5">
        <h3>📒 สมุดรายงานประจำตัวเด็กปฐมวัย (อ.01)</h3>
      </div>

      {/* ── Selector ── */}
      <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {/* Class selector */}
        <div style={{ minWidth: '140px' }}>
          <div style={{ fontSize: '.72rem', fontWeight: 700, color: '#6b7280', marginBottom: '.25rem' }}>ห้องเรียน</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.3rem' }}>
            {classNames.map(cn => (
              <button key={cn} type="button"
                onClick={() => { setSelClass(cn); setSelStudentId(null); }}
                style={{
                  padding: '.28rem .65rem', borderRadius: '8px', border: `1.5px solid ${selClass === cn ? ACCENT : '#e5e7eb'}`,
                  background: selClass === cn ? ACCENT : 'white', color: selClass === cn ? 'white' : '#4b5563',
                  fontFamily: 'inherit', fontWeight: 700, fontSize: '.8rem', cursor: 'pointer',
                }}>
                {cn}
              </button>
            ))}
          </div>
        </div>

        {/* Student selector */}
        <div style={{ flex: 1, minWidth: '200px' }}>
          <div style={{ fontSize: '.72rem', fontWeight: 700, color: '#6b7280', marginBottom: '.25rem' }}>
            นักเรียน ({studentsInClass.length} คน)
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.3rem', maxHeight: '120px', overflowY: 'auto' }}>
            {studentsInClass.map(s => {
              const isActive = String(s.id) === String(selStudentId);
              return (
                <button key={s.id} type="button"
                  onClick={() => setSelStudentId(String(s.id))}
                  style={{
                    padding: '.28rem .65rem', borderRadius: '8px',
                    border: `1.5px solid ${isActive ? ACCENT : '#e5e7eb'}`,
                    background: isActive ? BG : 'white', color: isActive ? ACCENT : '#4b5563',
                    fontFamily: 'inherit', fontWeight: isActive ? 700 : 500, fontSize: '.8rem', cursor: 'pointer',
                  }}>
                  {s.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {!student ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af', fontSize: '.9rem' }}>
          เลือกนักเรียนเพื่อดูสมุดรายงาน
        </div>
      ) : (
        <>
          {/* ── Student Info Bar ── */}
          <div style={{
            background: BG, border: `1.5px solid ${ACCENT}30`, borderRadius: '12px',
            padding: '.75rem 1.25rem', marginBottom: '1.25rem',
            display: 'flex', flexWrap: 'wrap', gap: '.5rem 2rem', alignItems: 'center',
          }}>
            <span style={{ fontWeight: 800, fontSize: '.95rem', color: ACCENT }}>{student.name}</span>
            <span style={{ fontSize: '.82rem', color: '#6b7280' }}>ชั้น {student.className ?? student.level}</span>
            {student.birthDate && (
              <span style={{ fontSize: '.82rem', color: '#6b7280' }}>เกิด {isoToThai(student.birthDate)}</span>
            )}
            {student.parentName && (
              <span style={{ fontSize: '.82rem', color: '#6b7280' }}>ผู้ปกครอง: {student.parentName}</span>
            )}
            <button type="button"
              onClick={() => {
                const classTeacher = teachers?.find(t => t.className === (student?.className ?? student?.level));
                printReport({ student, physData, growthRecords: growthData, devAssessment: devAssessData, attendanceSummary, healthServices, devDomains, teacherComments, parentComments, directorsComment, academicYear, schoolName, schoolPhilosophy, schoolVision, schoolLogo, teacherName: classTeacher?.name ?? '', directorName: schoolDirectorName ?? '' });
              }}
              style={{
                marginLeft: 'auto', padding: '.35rem 1rem', borderRadius: '8px', border: 'none',
                background: ACCENT, color: 'white', fontFamily: 'inherit', fontWeight: 700, fontSize: '.82rem', cursor: 'pointer',
              }}>
              🖨️ พิมพ์รายงาน
            </button>
          </div>

          {/* ── Section Navigation ── */}
          <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
            {SECTIONS.map(sec => {
              const isAct = activeSection === sec.id;
              return (
                <button key={sec.id} type="button" onClick={() => setActiveSection(sec.id)}
                  style={{
                    padding: '.35rem .85rem', borderRadius: '8px', cursor: 'pointer',
                    border: `1.5px solid ${isAct ? ACCENT : '#e5e7eb'}`,
                    background: isAct ? ACCENT : 'white', color: isAct ? 'white' : '#4b5563',
                    fontFamily: 'inherit', fontWeight: isAct ? 700 : 500, fontSize: '.82rem',
                    transition: 'all .15s',
                  }}>
                  {sec.label}
                </button>
              );
            })}
          </div>

          {/* ══════════════════════════════════════════════════════════
              SECTION 1: Physical Measurements
          ══════════════════════════════════════════════════════════ */}
          {activeSection === 'physical' && (
            <div>
              <div style={{ fontWeight: 800, fontSize: '.9rem', color: '#111', marginBottom: '1rem' }}>
                บันทึกพัฒนาการด้านร่างกาย (น้ำหนัก/ส่วนสูง)
              </div>
              <div style={{ fontSize: '.75rem', color: '#6b7280', marginBottom: '.75rem' }}>
                ระดับ 3 = ดี (ตามเกณฑ์) · ระดับ 2 = พอใช้ (ค่อนข้างเกิน/ต่ำ) · ระดับ 1 = ปรับปรุง (เกิน/ต่ำกว่าเกณฑ์)
                {student.birthDate ? '' : ' · ⚠️ ไม่พบวันเกิด — ไม่สามารถคำนวณระดับอัตโนมัติ'}
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.82rem' }}>
                  <thead>
                    <tr style={{ background: '#f3f4f6' }}>
                      <th style={{ padding: '8px 10px', border: '1px solid #e5e7eb', textAlign: 'center', minWidth: '160px' }}>การวัด</th>
                      <th style={{ padding: '8px 10px', border: '1px solid #e5e7eb', textAlign: 'center', minWidth: '140px' }}>
                        วันที่วัด<br/>
                        <span style={{ fontWeight: 400, fontSize: '.72rem', color: '#9ca3af' }}>(เดือนอ้างอิง)</span>
                      </th>
                      <th style={{ padding: '8px 10px', border: '1px solid #e5e7eb', textAlign: 'center', width: '110px' }}>น้ำหนัก (กก.)</th>
                      <th style={{ padding: '8px 10px', border: '1px solid #e5e7eb', textAlign: 'center', width: '90px' }}>ระดับ</th>
                      <th style={{ padding: '8px 10px', border: '1px solid #e5e7eb', textAlign: 'center', width: '110px' }}>ส่วนสูง (ซม.)</th>
                      <th style={{ padding: '8px 10px', border: '1px solid #e5e7eb', textAlign: 'center', width: '90px' }}>ระดับ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PHYS_KEYS.map((k, i) => {
                      const p   = physData[k] ?? { date: '', weight: '', height: '', weightLevel: 0, heightLevel: 0 };
                      const wc  = levelColor(p.weightLevel);
                      const hc  = levelColor(p.heightLevel);
                      const isT2 = i >= 2;
                      return (
                        <tr key={k} style={{ background: isT2 ? '#f0fdf4' : 'white' }}>
                          <td style={{ padding: '8px 10px', border: '1px solid #e5e7eb', fontWeight: 700 }}>
                            {PHYS_LABELS[i]}
                            <div style={{ fontSize: '.7rem', color: '#9ca3af', fontWeight: 400 }}>
                              อ้างอิงเดือน {PHYS_MONTH_HINTS[i]}
                            </div>
                          </td>
                          <td style={{ padding: '6px 10px', border: '1px solid #e5e7eb' }}>
                            <input type="date" value={p.date}
                              onChange={e => updatePhys(k, 'date', e.target.value)}
                              style={{ width: '100%', padding: '4px 6px', border: '1px solid #d1d5db', borderRadius: '6px', fontFamily: 'inherit', fontSize: '.8rem' }} />
                          </td>
                          <td style={{ padding: '6px 10px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                            <input type="number" value={p.weight} min={0} step={0.1}
                              onChange={e => updatePhys(k, 'weight', e.target.value)}
                              placeholder="0.0"
                              style={{ width: '80px', padding: '4px 6px', border: '1px solid #d1d5db', borderRadius: '6px', fontFamily: 'inherit', fontSize: '.8rem', textAlign: 'center' }} />
                          </td>
                          <td style={{ padding: '8px 10px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                            <select value={p.weightLevel}
                              onChange={e => updatePhys(k, 'weightLevel', Number(e.target.value))}
                              style={{ padding: '4px 6px', border: '1px solid #d1d5db', borderRadius: '6px', fontFamily: 'inherit', fontSize: '.8rem', background: wc.bg, color: wc.color, fontWeight: 700 }}>
                              <option value={0}>—</option>
                              <option value={3}>3 ดี</option>
                              <option value={2}>2 พอใช้</option>
                              <option value={1}>1 ปรับปรุง</option>
                            </select>
                          </td>
                          <td style={{ padding: '6px 10px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                            <input type="number" value={p.height} min={0} step={0.1}
                              onChange={e => updatePhys(k, 'height', e.target.value)}
                              placeholder="0.0"
                              style={{ width: '80px', padding: '4px 6px', border: '1px solid #d1d5db', borderRadius: '6px', fontFamily: 'inherit', fontSize: '.8rem', textAlign: 'center' }} />
                          </td>
                          <td style={{ padding: '8px 10px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                            <select value={p.heightLevel}
                              onChange={e => updatePhys(k, 'heightLevel', Number(e.target.value))}
                              style={{ padding: '4px 6px', border: '1px solid #d1d5db', borderRadius: '6px', fontFamily: 'inherit', fontSize: '.8rem', background: hc.bg, color: hc.color, fontWeight: 700 }}>
                              <option value={0}>—</option>
                              <option value={3}>3 ดี</option>
                              <option value={2}>2 พอใช้</option>
                              <option value={1}>1 ปรับปรุง</option>
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: '1rem', padding: '.75rem 1rem', background: '#fefce8', border: '1px solid #fde047', borderRadius: '8px', fontSize: '.78rem', color: '#713f12' }}>
                <strong>หมายเหตุ:</strong> ระดับคุณภาพอ้างอิงเกณฑ์มาตรฐานน้ำหนักและส่วนสูงกรมอนามัย กระทรวงสาธารณสุข พ.ศ. 2543
                — อายุ 3–6 ปี · ระบบจะคำนวณอัตโนมัติเมื่อกรอกวันที่วัดและมีวันเกิดของนักเรียน
              </div>

              {/* ── บันทึกการเจริญเติบโตรายเดือน (แนวนอน) ── */}
              <div style={{ fontWeight: 800, fontSize: '.9rem', color: '#111', margin: '1.5rem 0 .6rem' }}>
                📈 บันทึกการเจริญเติบโตของร่างกาย
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ borderCollapse: 'collapse', fontSize: '.8rem', minWidth: '700px' }}>
                  <thead>
                    {/* แถว 1: รายการ | ภาคเรียน 1 | ภาคเรียน 2 */}
                    <tr style={{ background: '#f3f4f6' }}>
                      <th rowSpan={2} style={{ padding: '7px 12px', border: '1px solid #e5e7eb', textAlign: 'left', minWidth: '110px' }}>รายการ</th>
                      <th colSpan={6} style={{ padding: '6px 10px', border: '1px solid #e5e7eb', textAlign: 'center', background: '#dbeafe', color: '#1e40af' }}>
                        ภาคเรียนที่ 1
                      </th>
                      <th colSpan={5} style={{ padding: '6px 10px', border: '1px solid #e5e7eb', textAlign: 'center', background: '#d1fae5', color: '#065f46' }}>
                        ภาคเรียนที่ 2
                      </th>
                    </tr>
                    {/* แถว 2: เดือน */}
                    <tr>
                      {GROWTH_MONTHS_T1.map(m => (
                        <th key={m.key} style={{ padding: '5px 8px', border: '1px solid #e5e7eb', textAlign: 'center', background: '#eff6ff', minWidth: '62px', fontSize: '.75rem' }}>
                          {m.label}
                        </th>
                      ))}
                      {GROWTH_MONTHS_T2.map(m => (
                        <th key={m.key} style={{ padding: '5px 8px', border: '1px solid #e5e7eb', textAlign: 'center', background: '#f0fdf4', minWidth: '62px', fontSize: '.75rem' }}>
                          {m.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* แถวอายุ — คำนวณอัตโนมัติ */}
                    <tr>
                      <td style={{ padding: '6px 12px', border: '1px solid #e5e7eb', fontWeight: 600 }}>อายุ</td>
                      {GROWTH_MONTHS_ALL.map(m => {
                        const { ageYear, ageMonth } = ageAt(student?.birthDate, monthRefDate(m.num, academicYear));
                        return (
                          <td key={m.key} style={{ padding: '5px 4px', border: '1px solid #e5e7eb', textAlign: 'center', color: '#4b5563', fontSize: '.72rem' }}>
                            {student?.birthDate ? `${ageYear}ปี ${ageMonth}ด.` : ''}
                          </td>
                        );
                      })}
                    </tr>
                    {/* แถวน้ำหนัก */}
                    <tr>
                      <td style={{ padding: '6px 12px', border: '1px solid #e5e7eb', fontWeight: 600 }}>น้ำหนัก (กก.)</td>
                      {GROWTH_MONTHS_ALL.map(m => {
                        const g = growthData[m.key] ?? {};
                        return (
                          <td key={m.key} style={{ padding: '3px 4px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                            <input type="number" value={g.weight ?? ''} min={0} step={0.1}
                              onChange={e => updateGrowth(m.key, 'weight', e.target.value)}
                              placeholder="—"
                              style={{ width: '52px', padding: '3px 4px', border: '1px solid #d1d5db', borderRadius: '5px', fontFamily: 'inherit', fontSize: '.78rem', textAlign: 'center' }} />
                          </td>
                        );
                      })}
                    </tr>
                    {/* แถวส่วนสูง */}
                    <tr>
                      <td style={{ padding: '6px 12px', border: '1px solid #e5e7eb', fontWeight: 600 }}>ส่วนสูง (ซม.)</td>
                      {GROWTH_MONTHS_ALL.map(m => {
                        const g = growthData[m.key] ?? {};
                        return (
                          <td key={m.key} style={{ padding: '3px 4px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                            <input type="number" value={g.height ?? ''} min={0} step={0.1}
                              onChange={e => updateGrowth(m.key, 'height', e.target.value)}
                              placeholder="—"
                              style={{ width: '52px', padding: '3px 4px', border: '1px solid #d1d5db', borderRadius: '5px', fontFamily: 'inherit', fontSize: '.78rem', textAlign: 'center' }} />
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: '.5rem', fontSize: '.72rem', color: '#9ca3af' }}>
                อายุคำนวณอัตโนมัติจากวันเกิด ณ วันที่ 15 ของแต่ละเดือน &nbsp;·&nbsp;
                ระดับ 3 = ปกติ / ตามเกณฑ์ &nbsp;·&nbsp; ระดับ 2 = ค่อนข้างปกติ &nbsp;·&nbsp; ระดับ 1 = ไม่ปกติ ควรส่งเสริม
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              SECTION 2: Attendance
          ══════════════════════════════════════════════════════════ */}
          {activeSection === 'attendance' && (
            <div>
              <div style={{ fontWeight: 800, fontSize: '.9rem', color: '#111', marginBottom: '1rem' }}>
                เวลามาเรียน (คิดเป็นวัน)
              </div>
              <table style={{ borderCollapse: 'collapse', fontSize: '.84rem' }}>
                <thead>
                  <tr style={{ background: '#f3f4f6' }}>
                    <th style={{ padding: '8px 16px', border: '1px solid #e5e7eb', textAlign: 'center' }}>ภาคเรียน</th>
                    <th style={{ padding: '8px 16px', border: '1px solid #e5e7eb', textAlign: 'center' }}>เวลาเรียนเต็ม</th>
                    <th style={{ padding: '8px 16px', border: '1px solid #e5e7eb', textAlign: 'center' }}>มาเรียน</th>
                    <th style={{ padding: '8px 16px', border: '1px solid #e5e7eb', textAlign: 'center' }}>ไม่มาเรียน</th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2].map(t => {
                    const a = attendanceSummary[`term${t}`] ?? {};
                    return (
                      <tr key={t}>
                        <td style={{ padding: '8px 16px', border: '1px solid #e5e7eb', fontWeight: 700 }}>ภาคเรียนที่ {t}</td>
                        <td style={{ padding: '8px 16px', border: '1px solid #e5e7eb', textAlign: 'center' }}>{a.totalDays ?? 0}</td>
                        <td style={{ padding: '8px 16px', border: '1px solid #e5e7eb', textAlign: 'center', color: '#059669', fontWeight: 700 }}>{a.presentDays ?? 0}</td>
                        <td style={{ padding: '8px 16px', border: '1px solid #e5e7eb', textAlign: 'center', color: '#dc2626', fontWeight: 700 }}>{a.absentDays ?? 0}</td>
                      </tr>
                    );
                  })}
                  <tr style={{ background: '#f0fdf4', fontWeight: 800 }}>
                    <td style={{ padding: '8px 16px', border: '1px solid #e5e7eb' }}>ตลอดปี</td>
                    <td style={{ padding: '8px 16px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                      {(attendanceSummary.term1?.totalDays ?? 0) + (attendanceSummary.term2?.totalDays ?? 0)}
                    </td>
                    <td style={{ padding: '8px 16px', border: '1px solid #e5e7eb', textAlign: 'center', color: '#059669' }}>
                      {(attendanceSummary.term1?.presentDays ?? 0) + (attendanceSummary.term2?.presentDays ?? 0)}
                    </td>
                    <td style={{ padding: '8px 16px', border: '1px solid #e5e7eb', textAlign: 'center', color: '#dc2626' }}>
                      {(attendanceSummary.term1?.absentDays ?? 0) + (attendanceSummary.term2?.absentDays ?? 0)}
                    </td>
                  </tr>
                </tbody>
              </table>
              <div style={{ marginTop: '.75rem', fontSize: '.78rem', color: '#6b7280' }}>
                ข้อมูลคำนวณจากการบันทึกการมาเรียนในระบบ (ภาคเรียน 1 = พ.ค.–ก.ย., ภาคเรียน 2 = ต.ค.–เม.ย.)
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              SECTION 3: Health Services
          ══════════════════════════════════════════════════════════ */}
          {activeSection === 'health' && (
            <div>
              <div style={{ fontWeight: 800, fontSize: '.9rem', color: '#111', marginBottom: '1rem' }}>
                บันทึกการบริการทางสุขภาพ (การให้ภูมิคุ้มกัน)
              </div>

              {/* Add row */}
              <div style={{
                background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px',
                padding: '.75rem 1rem', marginBottom: '1rem',
                display: 'flex', gap: '.5rem', flexWrap: 'wrap', alignItems: 'flex-end',
              }}>
                <div>
                  <div style={{ fontSize: '.72rem', fontWeight: 700, color: '#6b7280', marginBottom: '.2rem' }}>วัน/เดือน/ปี</div>
                  <input type="date" value={newHs.date}
                    onChange={e => setNewHs(p => ({ ...p, date: e.target.value }))}
                    style={{ padding: '5px 8px', border: '1px solid #d1d5db', borderRadius: '6px', fontFamily: 'inherit', fontSize: '.82rem' }} />
                </div>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ fontSize: '.72rem', fontWeight: 700, color: '#6b7280', marginBottom: '.2rem' }}>การให้ภูมิคุ้มกัน / บริการสุขภาพ</div>
                  <input type="text" value={newHs.service} placeholder="เช่น วัคซีน MMR, ตรวจสุขภาพ..."
                    onChange={e => setNewHs(p => ({ ...p, service: e.target.value }))}
                    style={{ width: '100%', padding: '5px 8px', border: '1px solid #d1d5db', borderRadius: '6px', fontFamily: 'inherit', fontSize: '.82rem', boxSizing: 'border-box' }} />
                </div>
                <div style={{ flex: 1, minWidth: '150px' }}>
                  <div style={{ fontSize: '.72rem', fontWeight: 700, color: '#6b7280', marginBottom: '.2rem' }}>หมายเหตุ</div>
                  <input type="text" value={newHs.note} placeholder="หมายเหตุ (ถ้ามี)"
                    onChange={e => setNewHs(p => ({ ...p, note: e.target.value }))}
                    style={{ width: '100%', padding: '5px 8px', border: '1px solid #d1d5db', borderRadius: '6px', fontFamily: 'inherit', fontSize: '.82rem', boxSizing: 'border-box' }} />
                </div>
                <button type="button"
                  disabled={!newHs.service.trim()}
                  onClick={() => {
                    if (!newHs.service.trim()) return;
                    const newEntry = { id: Date.now(), ...newHs };
                    saveRec({ healthServices: [...healthServices, newEntry] });
                    setNewHs({ date: todayISO(), service: '', note: '' });
                  }}
                  style={{
                    padding: '.42rem 1rem', borderRadius: '8px', border: 'none',
                    background: '#059669', color: 'white', fontFamily: 'inherit', fontWeight: 700,
                    fontSize: '.82rem', cursor: 'pointer', opacity: newHs.service.trim() ? 1 : 0.5,
                  }}>
                  + เพิ่ม
                </button>
              </div>

              {/* Table */}
              {healthServices.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af', fontSize: '.85rem' }}>
                  ยังไม่มีบันทึก — กรอกข้อมูลด้านบนเพื่อเพิ่ม
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.82rem' }}>
                  <thead>
                    <tr style={{ background: '#f3f4f6' }}>
                      <th style={{ padding: '8px 10px', border: '1px solid #e5e7eb', textAlign: 'center', width: '130px' }}>วัน/เดือน/ปี</th>
                      <th style={{ padding: '8px 10px', border: '1px solid #e5e7eb', textAlign: 'center' }}>การให้ภูมิคุ้มกัน / บริการสุขภาพ</th>
                      <th style={{ padding: '8px 10px', border: '1px solid #e5e7eb', textAlign: 'center' }}>หมายเหตุ</th>
                      <th style={{ padding: '8px 10px', border: '1px solid #e5e7eb', textAlign: 'center', width: '60px' }}>ลบ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {healthServices.map((h, idx) => (
                      <tr key={h.id ?? idx} style={{ background: idx % 2 === 0 ? 'white' : '#fafafa' }}>
                        <td style={{ padding: '7px 10px', border: '1px solid #e5e7eb' }}>{isoToThai(h.date)}</td>
                        <td style={{ padding: '7px 10px', border: '1px solid #e5e7eb' }}>{h.service}</td>
                        <td style={{ padding: '7px 10px', border: '1px solid #e5e7eb', color: '#6b7280' }}>{h.note}</td>
                        <td style={{ padding: '7px 10px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                          <button type="button"
                            onClick={() => saveRec({ healthServices: healthServices.filter((_, i) => i !== idx) })}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: '.9rem' }}>
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              SECTION 4: Dev Assessment — 4 Domains (อ.01 form)
          ══════════════════════════════════════════════════════════ */}
          {activeSection === 'devreport' && (
            <div>
              <div style={{ fontWeight: 800, fontSize: '.9rem', color: '#111', marginBottom: '.25rem' }}>
                บันทึกผลการประเมินพัฒนาการ (ความสามารถผู้เรียน)
              </div>
              <div style={{ fontSize: '.75rem', color: '#6b7280', marginBottom: '1rem' }}>
                ระดับ 3 = ดี · ระดับ 2 = พอใช้ · ระดับ 1 = ปรับปรุง · สรุประดับคุณภาพคำนวณจากค่าเฉลี่ยภาคเรียนที่ 2
              </div>

              {/* ── Domain tabs ── */}
              <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                {DEV_ASSESS_DOMAINS.map(d => {
                  const avg = devAssessDomainAvg(devAssessData, d.id);
                  const isAct = devAssessTab === d.id;
                  const lc = avg > 0 ? levelColor(avg) : { bg: '#f3f4f6', color: '#6b7280' };
                  return (
                    <button key={d.id} type="button" onClick={() => setDevAssessTab(d.id)}
                      style={{
                        padding: '.35rem .9rem', borderRadius: '10px', cursor: 'pointer',
                        border: `2px solid ${isAct ? d.color : '#e5e7eb'}`,
                        background: isAct ? d.bg : 'white',
                        color: isAct ? d.color : '#4b5563',
                        fontFamily: 'inherit', fontWeight: isAct ? 800 : 500, fontSize: '.82rem',
                        display: 'flex', alignItems: 'center', gap: '.45rem',
                        transition: 'all .15s',
                      }}>
                      <span>{d.emoji} {d.label}</span>
                      {avg > 0 && (
                        <span style={{
                          padding: '1px 7px', borderRadius: '12px', fontSize: '.72rem',
                          fontWeight: 800, ...lc,
                        }}>{avg}</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* ── Active domain content ── */}
              {DEV_ASSESS_DOMAINS.filter(d => d.id === devAssessTab).map(domain => {
                // Shared component card renderer
                const CompCard = ({ comp, ci }) => {
                  const da = devAssessData[comp.key] ?? {};
                  const t1v = da.t1level ?? 0;
                  const t2v = da.t2level ?? 0;
                  const lc1 = levelColor(t1v);
                  const lc2 = levelColor(t2v);

                  // คะแนนเฉลี่ยทศนิยมจากกิจกรรม
                  const raw1 = rawScoreFromIndicator(student, comp.domainId, comp.standardId, comp.indicatorId, 1);
                  const raw2 = rawScoreFromIndicator(student, comp.domainId, comp.standardId, comp.indicatorId, 2);
                  const rlc1 = raw1 !== null ? levelColor(raw1 >= 2.5 ? 3 : raw1 >= 1.5 ? 2 : 1) : null;
                  const rlc2 = raw2 !== null ? levelColor(raw2 >= 2.5 ? 3 : raw2 >= 1.5 ? 2 : 1) : null;

                  // สรุประดับ = เฉลี่ยทศนิยมจาก t1 + t2
                  const filledVals = [t1v, t2v].filter(v => v > 0);
                  const avgLevel   = filledVals.length ? filledVals.reduce((a, b) => a + b, 0) / filledVals.length : 0;
                  const summaryInt = avgLevel >= 2.5 ? 3 : avgLevel >= 1.5 ? 2 : avgLevel > 0 ? 1 : 0;
                  const lcs        = levelColor(summaryInt);
                  const avgLabel   = summaryInt === 3 ? 'ดี' : summaryInt === 2 ? 'พอใช้' : summaryInt === 1 ? 'ปรับปรุง' : null;

                  // onChange — batch-save ทั้ง term level และ summary ที่คำนวณใหม่
                  const onChangeT1 = e => {
                    const newT1 = Number(e.target.value);
                    const vals = [newT1, t2v].filter(v => v > 0);
                    const avg  = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
                    const newSummary = avg >= 2.5 ? 3 : avg >= 1.5 ? 2 : avg > 0 ? 1 : 0;
                    const cur = devAssessData[comp.key] ?? {};
                    saveRec({ devAssessment: { ...devAssessData, [comp.key]: { ...cur, t1level: newT1, summary: newSummary } } });
                  };
                  const onChangeT2 = e => {
                    const newT2 = Number(e.target.value);
                    const vals = [t1v, newT2].filter(v => v > 0);
                    const avg  = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
                    const newSummary = avg >= 2.5 ? 3 : avg >= 1.5 ? 2 : avg > 0 ? 1 : 0;
                    const cur = devAssessData[comp.key] ?? {};
                    saveRec({ devAssessment: { ...devAssessData, [comp.key]: { ...cur, t2level: newT2, summary: newSummary } } });
                  };

                  const rowBg = ci % 2 === 0 ? 'white' : '#fafafa';
                  return (
                    <div key={comp.key} style={{
                      background: rowBg,
                      border: '1px solid #e5e7eb', borderRadius: '10px',
                      padding: '1rem', marginBottom: '.75rem',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '.5rem', marginBottom: '.6rem' }}>
                        <span style={{
                          background: domain.color, color: 'white',
                          borderRadius: '6px', padding: '2px 8px', fontSize: '.75rem', fontWeight: 800,
                          whiteSpace: 'nowrap', flexShrink: 0,
                        }}>{comp.code}</span>
                        <span style={{ fontWeight: 700, fontSize: '.84rem', color: '#111' }}>{comp.label}</span>
                      </div>
                      <div style={{
                        background: '#f9fafb', border: '1px solid #f0f0f0',
                        borderRadius: '6px', padding: '.45rem .75rem',
                        fontSize: '.75rem', color: '#4b5563', lineHeight: '1.6',
                        marginBottom: '.75rem', whiteSpace: 'pre-line',
                      }}>
                        {comp.descriptor}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '.75rem', alignItems: 'start' }}>

                        {/* ── ภาคเรียนที่ 1 ── */}
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', marginBottom: '.3rem' }}>
                            <span style={{ fontSize: '.72rem', fontWeight: 700, color: '#1e40af' }}>ภาคเรียนที่ 1</span>
                            {raw1 !== null && rlc1 && (
                              <span style={{
                                fontSize: '.72rem', fontWeight: 800,
                                background: rlc1.bg, color: rlc1.color,
                                borderRadius: '5px', padding: '1px 7px',
                              }}>{raw1.toFixed(2)}</span>
                            )}
                          </div>
                          <select value={t1v} onChange={onChangeT1}
                            style={{ width: '100%', padding: '5px 8px', border: '1px solid #d1d5db', borderRadius: '6px', fontFamily: 'inherit', fontSize: '.8rem', background: lc1.bg, color: lc1.color, fontWeight: 700 }}>
                            <option value={0}>— ระดับ —</option>
                            <option value={3}>3  ดี</option>
                            <option value={2}>2  พอใช้</option>
                            <option value={1}>1  ปรับปรุง</option>
                          </select>
                        </div>

                        {/* ── ภาคเรียนที่ 2 ── */}
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', marginBottom: '.3rem' }}>
                            <span style={{ fontSize: '.72rem', fontWeight: 700, color: '#065f46' }}>ภาคเรียนที่ 2</span>
                            {raw2 !== null && rlc2 && (
                              <span style={{
                                fontSize: '.72rem', fontWeight: 800,
                                background: rlc2.bg, color: rlc2.color,
                                borderRadius: '5px', padding: '1px 7px',
                              }}>{raw2.toFixed(2)}</span>
                            )}
                          </div>
                          <select value={t2v} onChange={onChangeT2}
                            style={{ width: '100%', padding: '5px 8px', border: '1px solid #d1d5db', borderRadius: '6px', fontFamily: 'inherit', fontSize: '.8rem', background: lc2.bg, color: lc2.color, fontWeight: 700 }}>
                            <option value={0}>— ระดับ —</option>
                            <option value={3}>3  ดี</option>
                            <option value={2}>2  พอใช้</option>
                            <option value={1}>1  ปรับปรุง</option>
                          </select>
                        </div>

                        {/* ── สรุประดับ — อัตโนมัติจากเฉลี่ย 2 ภาคเรียน ── */}
                        <div style={{ minWidth: '90px' }}>
                          <div style={{ fontSize: '.72rem', fontWeight: 700, color: '#374151', marginBottom: '.3rem' }}>สรุประดับ</div>
                          {avgLevel > 0 ? (
                            <div style={{
                              background: lcs.bg, color: lcs.color,
                              border: `1.5px solid ${lcs.color}60`,
                              borderRadius: '6px', padding: '5px 8px',
                              textAlign: 'center', fontWeight: 800,
                            }}>
                              <div style={{ fontSize: '.95rem', lineHeight: 1.1 }}>{avgLevel.toFixed(2)}</div>
                              <div style={{ fontSize: '.68rem', opacity: 0.85, marginTop: '2px' }}>{avgLabel}</div>
                            </div>
                          ) : (
                            <div style={{
                              background: '#f9fafb', border: '1px dashed #d1d5db',
                              borderRadius: '6px', padding: '10px 8px',
                              textAlign: 'center', color: '#9ca3af', fontSize: '.75rem',
                            }}>—</div>
                          )}
                        </div>

                      </div>
                    </div>
                  );
                };

                return (
                  <div key={domain.id}>
                    {/* domain header */}
                    <div style={{
                      background: domain.bg, border: `2px solid ${domain.color}30`,
                      borderRadius: '10px', padding: '.55rem 1rem', marginBottom: '1rem',
                      fontWeight: 900, fontSize: '.88rem', color: domain.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                      <span>{domain.emoji} พัฒนาการ{domain.label}{gradeLabelOf(student) ? ` — ${gradeLabelOf(student)}` : ''}</span>
                      <button
                        onClick={() => handleSuggestDomain(domain)}
                        style={{
                          background: domain.color, color: 'white', border: 'none',
                          borderRadius: '6px', padding: '4px 10px', cursor: 'pointer',
                          fontSize: '.75rem', fontWeight: 700, flexShrink: 0,
                        }}
                        title="แนะนำระดับจากข้อมูลประเมินผลพัฒนาการ"
                      >
                        ✨ แนะนำระดับ
                      </button>
                    </div>

                    {domain.subDomains ? (
                      // all domains: render sub-domain sections
                      (() => {
                        let globalIdx = 0;
                        return domain.subDomains.map(sub => (
                          <div key={sub.key} style={{ marginBottom: '1.25rem' }}>
                            <div style={{
                              background: `${domain.color}15`, borderLeft: `4px solid ${domain.color}`,
                              borderRadius: '6px', padding: '.4rem .9rem', marginBottom: '.6rem',
                              fontWeight: 800, fontSize: '.82rem', color: domain.color,
                            }}>
                              {sub.label}
                            </div>
                            {sub.components.map((comp) => {
                              const ci = globalIdx++;
                              return <CompCard key={comp.key} comp={comp} ci={ci} />;
                            })}

                            {/* ── Section-level (มาตรฐาน) summary ── */}
                            {(() => {
                              const t1vals = sub.components
                                .map(c => devAssessData[c.key]?.t1level ?? 0)
                                .filter(v => v > 0);
                              const t2vals = sub.components
                                .map(c => devAssessData[c.key]?.t2level ?? 0)
                                .filter(v => v > 0);
                              if (!t1vals.length && !t2vals.length) return null;
                              const t1avg = t1vals.length
                                ? t1vals.reduce((a, b) => a + b, 0) / t1vals.length : 0;
                              const t2avg = t2vals.length
                                ? t2vals.reduce((a, b) => a + b, 0) / t2vals.length : 0;
                              const allVals = [...t1vals, ...t2vals];
                              const combined = allVals.reduce((a, b) => a + b, 0) / allVals.length;
                              const summaryLevel = combined >= 2.5 ? 3 : combined >= 1.5 ? 2 : 1;
                              const lc1 = levelColor(t1vals.length ? (t1avg >= 2.5 ? 3 : t1avg >= 1.5 ? 2 : 1) : 0);
                              const lc2 = levelColor(t2vals.length ? (t2avg >= 2.5 ? 3 : t2avg >= 1.5 ? 2 : 1) : 0);
                              const lcs = levelColor(summaryLevel);
                              return (
                                <div style={{
                                  display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '.6rem',
                                  background: `${domain.color}12`,
                                  borderLeft: `4px solid ${domain.color}`,
                                  borderRadius: '0 8px 8px 0',
                                  padding: '.6rem 1rem .6rem .85rem',
                                  marginTop: '-.4rem',
                                }}>
                                  <span style={{ fontSize: '.78rem', fontWeight: 800, color: domain.color, flex: '1 1 auto', whiteSpace: 'nowrap' }}>
                                    📊 สรุปค่ามาตรฐานนี้
                                  </span>

                                  {/* ภาคเรียน 1 avg */}
                                  <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '.63rem', color: '#64748b', fontWeight: 600, marginBottom: '2px' }}>ภาคเรียน 1</div>
                                    {t1vals.length ? (
                                      <span style={{
                                        background: lc1.bg, color: lc1.color,
                                        borderRadius: '6px', padding: '2px 9px',
                                        fontWeight: 800, fontSize: '.78rem', whiteSpace: 'nowrap',
                                      }}>
                                        {t1avg.toFixed(2)} · {t1avg >= 2.5 ? 'ดี' : t1avg >= 1.5 ? 'พอใช้' : 'ปรับปรุง'}
                                      </span>
                                    ) : <span style={{ color: '#9ca3af', fontSize: '.76rem' }}>—</span>}
                                  </div>

                                  {/* ภาคเรียน 2 avg */}
                                  <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '.63rem', color: '#64748b', fontWeight: 600, marginBottom: '2px' }}>ภาคเรียน 2</div>
                                    {t2vals.length ? (
                                      <span style={{
                                        background: lc2.bg, color: lc2.color,
                                        borderRadius: '6px', padding: '2px 9px',
                                        fontWeight: 800, fontSize: '.78rem', whiteSpace: 'nowrap',
                                      }}>
                                        {t2avg.toFixed(2)} · {t2avg >= 2.5 ? 'ดี' : t2avg >= 1.5 ? 'พอใช้' : 'ปรับปรุง'}
                                      </span>
                                    ) : <span style={{ color: '#9ca3af', fontSize: '.76rem' }}>—</span>}
                                  </div>

                                  {/* สรุประดับ */}
                                  <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '.63rem', color: '#64748b', fontWeight: 600, marginBottom: '2px' }}>สรุประดับ</div>
                                    <span style={{
                                      background: lcs.bg, color: lcs.color,
                                      borderRadius: '6px', padding: '2px 10px',
                                      fontWeight: 900, fontSize: '.88rem',
                                      border: `1.5px solid ${lcs.color}55`,
                                      whiteSpace: 'nowrap',
                                    }}>
                                      {summaryLevel} {summaryLevel === 3 ? 'ดี' : summaryLevel === 2 ? 'พอใช้' : 'ปรับปรุง'}
                                    </span>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        ));
                      })()
                    ) : (
                      // D1-D3: flat components
                      domain.components.map((comp, ci) => (
                        <CompCard key={comp.key} comp={comp} ci={ci} />
                      ))
                    )}

                    {/* ── Domain-level summary ─────────────────────────── */}
                    {(() => {
                      const dsKey   = `__domainSummary_${domain.id}`;
                      const dsValue = devAssessData[dsKey] ?? '';
                      const loading = aiDomainLoading[domain.id] ?? false;
                      const errMsg  = aiDomainError[domain.id] ?? '';
                      return (
                        <div style={{
                          marginTop: '1.25rem',
                          background: `${domain.color}08`,
                          border: `1.5px solid ${domain.color}35`,
                          borderRadius: '10px',
                          padding: '.85rem 1.1rem',
                        }}>
                          {(() => {
                            const domAvg = devAssessDomainAvg(devAssessData, domain.id);
                            const avgLabel = domAvg === 3 ? 'ดี' : domAvg === 2 ? 'พอใช้' : domAvg === 1 ? 'ปรับปรุง' : null;
                            const lc = levelColor(domAvg);
                            return (
                              <div style={{
                                display: 'flex', alignItems: 'center',
                                gap: '.6rem', marginBottom: '.5rem', flexWrap: 'wrap',
                              }}>
                                <span style={{ fontWeight: 800, fontSize: '.83rem', color: domain.color }}>
                                  📝 สรุปพัฒนาการด้าน{domain.label}
                                </span>
                                {aiApiKey && (
                                  <button
                                    type="button"
                                    onClick={() => handleAIDomainSummary(domain)}
                                    disabled={loading}
                                    style={{
                                      padding: '.2rem .65rem', borderRadius: '6px', border: 'none',
                                      background: domain.color, color: 'white', fontFamily: 'inherit',
                                      fontWeight: 700, fontSize: '.75rem',
                                      cursor: loading ? 'wait' : 'pointer',
                                      opacity: loading ? .65 : 1, flexShrink: 0,
                                    }}
                                  >
                                    {loading ? '⏳ กำลังเขียน…' : '✨ AI สรุปให้'}
                                  </button>
                                )}
                                {/* เฉลี่ยด้าน + badge */}
                                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '.5rem', flexShrink: 0 }}>
                                  {domAvg > 0 && (
                                    <span style={{ fontSize: '.75rem', color: '#6b7280', fontWeight: 600 }}>
                                      เฉลี่ยด้าน
                                    </span>
                                  )}
                                  {domAvg > 0 ? (
                                    <span style={{
                                      background: lc.bg, color: lc.color,
                                      border: `1.5px solid ${lc.color}60`,
                                      borderRadius: '8px', padding: '3px 14px',
                                      fontWeight: 900, fontSize: '.88rem',
                                      minWidth: '72px', textAlign: 'center',
                                      display: 'inline-block',
                                    }}>
                                      {domAvg} — {avgLabel}
                                    </span>
                                  ) : (
                                    <span style={{
                                      border: '1.5px dashed #d1d5db', borderRadius: '8px',
                                      padding: '3px 14px', color: '#9ca3af',
                                      fontSize: '.78rem', minWidth: '72px', textAlign: 'center',
                                      display: 'inline-block',
                                    }}>
                                      ยังไม่มีข้อมูล
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                          {errMsg && (
                            <div style={{ fontSize: '.78rem', color: '#dc2626', marginBottom: '.3rem' }}>
                              ❌ {errMsg}
                            </div>
                          )}
                          <textarea
                            value={dsValue}
                            onChange={e => saveRec({ devAssessment: { ...devAssessData, [`__domainSummary_${domain.id}`]: e.target.value } })}
                            rows={4}
                            placeholder={`เขียนสรุปพัฒนาการด้าน${domain.label}ของนักเรียน หรือกด ✨ AI สรุปให้`}
                            style={{
                              width: '100%', padding: '8px 10px',
                              border: `1px solid ${domain.color}50`,
                              borderRadius: '8px', fontFamily: 'inherit',
                              fontSize: '.82rem', lineHeight: 1.75,
                              resize: 'vertical', boxSizing: 'border-box',
                              background: 'white',
                            }}
                          />
                        </div>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              SECTION 5: Summary — 12 Standards
          ══════════════════════════════════════════════════════════ */}
          {activeSection === 'summary' && (
            <div>
              <div style={{ fontWeight: 800, fontSize: '.9rem', color: '#111', marginBottom: '.5rem' }}>
                สรุปผลการประเมินพัฒนาการตามมาตรฐานคุณลักษณะที่พึงประสงค์การศึกษาปฐมวัย
              </div>
              <div style={{ fontSize: '.75rem', color: '#6b7280', marginBottom: '1rem' }}>
                คำนวณจากค่าเฉลี่ยของตัวบ่งชี้ในแต่ละมาตรฐาน · สรุปตลอดปี = นำค่าภาคเรียน 2 มาหารจำนวนมาตรฐานในด้านนั้น
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.8rem' }}>
                  <thead>
                    <tr style={{ background: '#f3f4f6' }}>
                      <th style={{ padding: '7px 8px', border: '1px solid #e5e7eb', textAlign: 'center', width: '40px' }}>ลำดับ</th>
                      <th style={{ padding: '7px 8px', border: '1px solid #e5e7eb', textAlign: 'center' }}>มาตรฐานคุณลักษณะที่พึงประสงค์</th>
                      <th colSpan={3} style={{ padding: '7px 8px', border: '1px solid #e5e7eb', textAlign: 'center' }}>ภาคเรียน 1</th>
                      <th colSpan={3} style={{ padding: '7px 8px', border: '1px solid #e5e7eb', textAlign: 'center' }}>ภาคเรียน 2</th>
                      <th style={{ padding: '7px 8px', border: '1px solid #e5e7eb', textAlign: 'center', minWidth: '70px' }}>สรุปตลอดปี</th>
                    </tr>
                    <tr style={{ background: '#f9fafb', fontSize: '.72rem' }}>
                      <th style={{ padding: '4px 8px', border: '1px solid #e5e7eb' }}></th>
                      <th style={{ padding: '4px 8px', border: '1px solid #e5e7eb' }}></th>
                      {[1,2,3].map(n => (
                        <th key={`t1-${n}`} style={{ padding: '4px 8px', border: '1px solid #e5e7eb', textAlign: 'center', width: '36px', ...levelColor(n) }}>{n}</th>
                      ))}
                      {[1,2,3].map(n => (
                        <th key={`t2-${n}`} style={{ padding: '4px 8px', border: '1px solid #e5e7eb', textAlign: 'center', width: '36px', ...levelColor(n) }}>{n}</th>
                      ))}
                      <th style={{ padding: '4px 8px', border: '1px solid #e5e7eb' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {devDomains.map(domain => {
                      const domainT2Scores = domain.standards.flatMap(std =>
                        std.indicators.map(ind => ind.indScores.term2).filter(v => v !== null)
                      );
                      const domainYearly = domainT2Scores.length
                        ? Math.round(domainT2Scores.reduce((a,b)=>a+b,0)/domainT2Scores.length)
                        : null;
                      return [
                        <tr key={`dom-${domain.id}`} style={{ background: domain.bg }}>
                          <td colSpan={8} style={{ padding: '5px 10px', border: '1px solid #e5e7eb', fontWeight: 900, fontSize: '.82rem', color: domain.color }}>
                            {domain.emoji} ด้าน{domain.label}
                          </td>
                          <td style={{ padding: '5px 10px', border: '1px solid #e5e7eb', textAlign: 'center', fontWeight: 900, fontSize: '.82rem', color: domain.color,
                            ...(domainYearly ? levelColor(domainYearly) : {}) }}>
                            {domainYearly ?? '—'}
                          </td>
                        </tr>,
                        ...domain.standards.map((std, si) => {
                          const t1Scores = std.indicators.map(ind => ind.indScores.term1).filter(v => v !== null);
                          const t2Scores = std.indicators.map(ind => ind.indScores.term2).filter(v => v !== null);
                          const t1 = t1Scores.length ? Math.round(t1Scores.reduce((a,b)=>a+b,0)/t1Scores.length) : null;
                          const t2 = t2Scores.length ? Math.round(t2Scores.reduce((a,b)=>a+b,0)/t2Scores.length) : null;
                          return (
                            <tr key={`std-${std.id}`} style={{ background: si % 2 === 0 ? 'white' : '#fafafa' }}>
                              <td style={{ padding: '6px 8px', border: '1px solid #e5e7eb', textAlign: 'center', fontWeight: 700, color: '#6b7280' }}>{std.stdNo ?? ''}</td>
                              <td style={{ padding: '6px 8px', border: '1px solid #e5e7eb', fontSize: '.78rem' }}>{std.title}</td>
                              {[3,2,1].map(n => (
                                <td key={`r1-${n}`} style={{ padding: '6px 8px', border: '1px solid #e5e7eb', textAlign: 'center', fontWeight: 700, ...( t1 === n ? levelColor(n) : {}) }}>
                                  {t1 === n ? '✓' : ''}
                                </td>
                              ))}
                              {[3,2,1].map(n => (
                                <td key={`r2-${n}`} style={{ padding: '6px 8px', border: '1px solid #e5e7eb', textAlign: 'center', fontWeight: 700, ...( t2 === n ? levelColor(n) : {}) }}>
                                  {t2 === n ? '✓' : ''}
                                </td>
                              ))}
                              <td style={{ padding: '6px 8px', border: '1px solid #e5e7eb', textAlign: 'center', fontWeight: 800, ...(t2 ? levelColor(t2) : {}) }}>
                                {t2 ?? '—'}
                              </td>
                            </tr>
                          );
                        }),
                      ];
                    })}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              SECTION 6: 4-Domain Yearly Summary + Criteria
          ══════════════════════════════════════════════════════════ */}
          {activeSection === 'domain4' && (
            <div>
              <div style={{ fontWeight: 800, fontSize: '.9rem', color: '#111', marginBottom: '.75rem' }}>
                ผลการประเมินความพร้อมด้านพัฒนาการทั้ง 4 ด้าน ตลอดปีการศึกษา
              </div>
              <table style={{ borderCollapse: 'collapse', fontSize: '.84rem', width: '100%', maxWidth: '540px' }}>
                <thead>
                  <tr style={{ background: '#f3f4f6' }}>
                    <th style={{ padding: '9px 18px', border: '1px solid #e5e7eb', textAlign: 'center', minWidth: '160px' }}>พัฒนาการ</th>
                    {[3,2,1].map(n => (
                      <th key={n} style={{ padding: '9px 18px', border: '1px solid #e5e7eb', textAlign: 'center', width: '110px', ...levelColor(n) }}>
                        {n === 3 ? 'ปฏิบัติได้ดี' : n === 2 ? 'ปฏิบัติได้พอใช้' : 'ปรับปรุง'}<br/>
                        <span style={{ fontSize: '.72rem', fontWeight: 400 }}>({n})</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {devDomains.map(domain => {
                    const allT2 = domain.standards.flatMap(std =>
                      std.indicators.map(ind => ind.indScores.term2).filter(v => v !== null)
                    );
                    const yearly = allT2.length ? Math.round(allT2.reduce((a,b)=>a+b,0)/allT2.length) : null;
                    return (
                      <tr key={domain.id}>
                        <td style={{ padding: '9px 18px', border: '1px solid #e5e7eb', fontWeight: 700 }}>
                          {domain.emoji} ด้าน{domain.label}
                        </td>
                        {[3,2,1].map(n => (
                          <td key={n} style={{ padding: '9px 18px', border: '1px solid #e5e7eb', textAlign: 'center',
                            fontWeight: yearly === n ? 800 : 400, ...(yearly === n ? levelColor(n) : {}) }}>
                            {yearly === n ? '✓' : ''}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div style={{ marginTop: '.5rem', fontSize: '.72rem', color: '#6b7280' }}>
                หมายเหตุ: นำผลการประเมินภาคเรียนที่ 2 ในมาตรฐานของด้านพัฒนาการมารวมกัน แล้วหารด้วยจำนวนมาตรฐานในด้านนั้น
              </div>

              {/* เกณฑ์สรุปผลการตัดสิน */}
              <div style={{
                marginTop: '1.75rem',
                border: '1.5px solid #e5e7eb',
                borderRadius: '12px',
                padding: '1.1rem 1.25rem',
                background: '#fafafa',
              }}>
                <div style={{ fontWeight: 800, fontSize: '.88rem', color: '#111', marginBottom: '1rem' }}>
                  เกณฑ์สรุปผลการตัดสิน
                </div>
                {[
                  { n: 3, label: 'ดี', desc: 'ผ่านเกณฑ์การประเมินในระดับดี มีพัฒนาการสูงกว่าหรือเป็นไปตามเกณฑ์มาตรฐาน' },
                  { n: 2, label: 'พอใช้', desc: 'ผ่านเกณฑ์การประเมินในระดับพอใช้ มีพัฒนาการเป็นไปตามเกณฑ์แต่ควรได้รับการส่งเสริมบางส่วน' },
                  { n: 1, label: 'ควรส่งเสริม', desc: 'ยังไม่ผ่านเกณฑ์การประเมินในบางรายการ ควรได้รับการดูแลช่วยเหลือเป็นพิเศษ' },
                ].map(({ n, label, desc }) => {
                  const lc = levelColor(n);
                  return (
                    <div key={n} style={{ display: 'flex', alignItems: 'flex-start', gap: '.85rem', marginBottom: '.75rem' }}>
                      <span style={{
                        flexShrink: 0,
                        background: lc.bg, color: lc.color,
                        borderRadius: '8px', padding: '3px 12px',
                        fontWeight: 800, fontSize: '.82rem',
                        border: `1.5px solid ${lc.color}55`,
                        whiteSpace: 'nowrap',
                      }}>
                        ระดับ {n} ({label})
                      </span>
                      <span style={{ fontSize: '.84rem', color: '#374151', lineHeight: 1.7, paddingTop: '2px' }}>
                        {desc}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              SECTION 7: Comments (Teacher / Parent / Director)
          ══════════════════════════════════════════════════════════ */}
          {activeSection === 'comments' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

              {/* Teacher Comments */}
              <div style={{ background: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: '12px', padding: '1rem 1.25rem' }}>
                <div style={{ fontWeight: 800, fontSize: '.88rem', color: '#1d4ed8', marginBottom: '1rem' }}>
                  🧑‍🏫 ความคิดเห็นของครู
                </div>
                {[1, 2].map(t => {
                  const topicScores = assessmentTopics?.map(topic => {
                    const inds = indicators.filter(i => i.domainId === topic.id);
                    const scores = inds.flatMap(ind =>
                      activities.filter(a => a.indicatorId === ind.id)
                        .map(act => student?.assessments?.indicators?.[ind.id]?.[act.id]?.score ?? null)
                    ).filter(v => v !== null);
                    return { label: topic.label, score: scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null };
                  }) ?? [];

                  const handleAiComment = async () => {
                    if (!aiApiKey || !student) return;
                    setAiCommentLoading(p => ({ ...p, [t]: true }));
                    setAiCommentError(p => ({ ...p, [t]: '' }));
                    try {
                      const result = await callClaude(aiApiKey, buildTeacherCommentPrompt(student, topicScores, t));
                      saveRec({ teacherComments: { ...teacherComments, [`term${t}`]: result } });
                    } catch (e) {
                      setAiCommentError(p => ({ ...p, [t]: e.message }));
                    } finally {
                      setAiCommentLoading(p => ({ ...p, [t]: false }));
                    }
                  };

                  return (
                    <div key={t} style={{ marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '.35rem' }}>
                        <div style={{ fontWeight: 700, fontSize: '.8rem', color: '#374151' }}>ภาคเรียนที่ {t}</div>
                        {aiApiKey && student && (
                          <button type="button" onClick={handleAiComment} disabled={aiCommentLoading[t]}
                            style={{
                              padding: '.2rem .65rem', borderRadius: '6px', border: 'none',
                              background: '#dbeafe', color: '#1d4ed8', fontFamily: 'inherit',
                              fontWeight: 700, fontSize: '.75rem', cursor: aiCommentLoading[t] ? 'wait' : 'pointer',
                            }}>
                            {aiCommentLoading[t] ? '⏳ กำลังเขียน…' : '✨ AI ช่วยเขียน'}
                          </button>
                        )}
                      </div>
                      {aiCommentError[t] && (
                        <div style={{ fontSize: '.78rem', color: '#dc2626', marginBottom: '.3rem' }}>❌ {aiCommentError[t]}</div>
                      )}
                      <textarea
                        value={teacherComments[`term${t}`]}
                        onChange={e => saveRec({ teacherComments: { ...teacherComments, [`term${t}`]: e.target.value } })}
                        rows={4}
                        placeholder={`บันทึกความคิดเห็นของครูประจำชั้น ภาคเรียนที่ ${t}...`}
                        style={{
                          width: '100%', padding: '8px 10px', border: '1px solid #93c5fd',
                          borderRadius: '8px', fontFamily: 'inherit', fontSize: '.82rem',
                          resize: 'vertical', boxSizing: 'border-box', background: 'white',
                        }}
                      />
                      <div style={{ display: 'flex', gap: '3rem', marginTop: '.5rem', fontSize: '.75rem', color: '#6b7280' }}>
                        <span>ลงชื่อ _________________________ (ครูประจำชั้น)</span>
                        <span>ลงชื่อ _________________________ (ผู้อำนวยการ)</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Parent Comments — read-only for teachers; editable via ParentView */}
              <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: '12px', padding: '1rem 1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '1rem' }}>
                  <div style={{ fontWeight: 800, fontSize: '.88rem', color: '#15803d' }}>
                    👨‍👩‍👧 ความคิดเห็นของผู้ปกครอง
                  </div>
                  <span style={{
                    fontSize: '.7rem', fontWeight: 700, padding: '.1rem .55rem',
                    borderRadius: '99px', background: '#dcfce7', color: '#15803d',
                    border: '1px solid #86efac',
                  }}>
                    ผู้ปกครองกรอกเอง
                  </span>
                </div>
                {[1, 2].map(t => (
                  <div key={t} style={{ marginBottom: '1rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '.8rem', color: '#374151', marginBottom: '.35rem' }}>
                      ภาคเรียนที่ {t}
                    </div>
                    <div style={{
                      minHeight: '68px', padding: '8px 10px',
                      border: '1px solid #86efac', borderRadius: '8px',
                      fontSize: '.82rem', lineHeight: '1.6', background: '#f7fdf9',
                      color: parentComments[`term${t}`] ? '#111827' : '#9ca3af',
                      fontStyle: parentComments[`term${t}`] ? 'normal' : 'italic',
                      whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                    }}>
                      {parentComments[`term${t}`] || `(ยังไม่มีความคิดเห็น — ผู้ปกครองจะกรอกผ่านหน้า Parent View)`}
                    </div>
                    <div style={{ marginTop: '.5rem', fontSize: '.75rem', color: '#6b7280' }}>
                      ลงชื่อ _________________________ (ผู้ปกครอง)
                    </div>
                  </div>
                ))}
              </div>

              {/* Director's Comment — read-only for teachers; editable by Admin */}
              <div style={{ background: '#fdf4ff', border: '1.5px solid #e9d5ff', borderRadius: '12px', padding: '1rem 1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.75rem' }}>
                  <div style={{ fontWeight: 800, fontSize: '.88rem', color: '#7e22ce' }}>
                    🏛️ ความคิดเห็นของผู้อำนวยการสถานศึกษา (ตลอดปีการศึกษา)
                  </div>
                  <span style={{
                    fontSize: '.7rem', fontWeight: 700, padding: '.1rem .55rem',
                    borderRadius: '99px', background: '#f3e8ff', color: '#7e22ce',
                    border: '1px solid #d8b4fe',
                  }}>
                    ผู้อำนวยการกรอกเอง
                  </span>
                </div>
                <div style={{
                  minHeight: '68px', padding: '8px 10px',
                  border: '1px solid #d8b4fe', borderRadius: '8px',
                  fontSize: '.82rem', lineHeight: '1.6', background: '#fdf8ff',
                  color: directorsComment ? '#111827' : '#9ca3af',
                  fontStyle: directorsComment ? 'normal' : 'italic',
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                }}>
                  {directorsComment || '(ยังไม่มีความคิดเห็น — ผู้อำนวยการจะกรอกในส่วนของ Admin)'}
                </div>
                <div style={{ marginTop: '.5rem', fontSize: '.75rem', color: '#6b7280' }}>
                  ลงชื่อ _________________________ (ผู้อำนวยการสถานศึกษา)
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              SECTION 7: Philosophy & Vision (static)
          ══════════════════════════════════════════════════════════ */}
          {activeSection === 'philosophy' && (
            <div>
              {/* Philosophy */}
              <div style={{
                background: '#fefce8', border: '2px solid #fde047',
                borderRadius: '12px', padding: '1.25rem 1.5rem', marginBottom: '1.25rem',
              }}>
                <div style={{ fontWeight: 900, fontSize: '.95rem', color: '#713f12', textAlign: 'center', marginBottom: '.75rem', letterSpacing: '.04em' }}>
                  ปรัชญาการศึกษาปฐมวัย
                </div>
                <p style={{ fontSize: '.85rem', color: '#374151', lineHeight: 1.9, margin: 0, textAlign: 'justify', textIndent: '2em' }}>
                  {schoolPhilosophy?.trim() || PHILOSOPHY_TEXT}
                </p>
              </div>

              {/* Vision */}
              <div style={{
                background: '#f0fdf4', border: '2px solid #86efac',
                borderRadius: '12px', padding: '1.25rem 1.5rem',
              }}>
                <div style={{ fontWeight: 900, fontSize: '.95rem', color: '#15803d', textAlign: 'center', marginBottom: '.75rem', letterSpacing: '.04em' }}>
                  วิสัยทัศน์
                </div>
                <p style={{ fontSize: '.85rem', color: '#374151', lineHeight: 1.9, margin: 0, textAlign: 'justify', textIndent: '2em' }}>
                  {schoolVision?.trim() || VISION_TEXT}
                </p>
              </div>

              <div style={{ marginTop: '.75rem', fontSize: '.72rem', color: '#9ca3af', textAlign: 'center' }}>
                ตามหลักสูตรการศึกษาปฐมวัย พุทธศักราช 2560
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              SECTION 8: Growth Standard Table (กรมอนามัย พ.ศ. 2543)
          ══════════════════════════════════════════════════════════ */}
          {activeSection === 'growthtable' && (
            <div>
              <div style={{ fontWeight: 800, fontSize: '.9rem', color: '#111', marginBottom: '.25rem' }}>
                ตารางแสดงการเจริญเติบโตของเพศชายและหญิง อายุ 3–6 ปี
              </div>
              <div style={{ fontSize: '.72rem', color: '#6b7280', marginBottom: '.75rem' }}>
                กองโภชนาการ กรมอนามัย กระทรวงสาธารณสุข พ.ศ. 2543 · ต่ำแหน่ง = –2SD · บนสุด = +2SD
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ borderCollapse: 'collapse', fontSize: '.76rem', width: '100%' }}>
                  <thead>
                    <tr style={{ background: '#1e3a5f', color: 'white' }}>
                      <th rowSpan={3} style={{ padding: '6px 10px', border: '1px solid #374151', textAlign: 'center' }}>ปี</th>
                      <th rowSpan={3} style={{ padding: '6px 10px', border: '1px solid #374151', textAlign: 'center' }}>เดือน</th>
                      <th colSpan={4} style={{ padding: '6px 10px', border: '1px solid #374151', textAlign: 'center' }}>น้ำหนักมาตรฐาน (กิโลกรัม)</th>
                      <th colSpan={4} style={{ padding: '6px 10px', border: '1px solid #374151', textAlign: 'center' }}>ส่วนสูงมาตรฐาน (เซนติเมตร)</th>
                    </tr>
                    <tr style={{ background: '#1e3a5f', color: 'white' }}>
                      <th colSpan={2} style={{ padding: '4px 8px', border: '1px solid #374151', textAlign: 'center' }}>ชาย</th>
                      <th colSpan={2} style={{ padding: '4px 8px', border: '1px solid #374151', textAlign: 'center' }}>หญิง</th>
                      <th colSpan={2} style={{ padding: '4px 8px', border: '1px solid #374151', textAlign: 'center' }}>ชาย</th>
                      <th colSpan={2} style={{ padding: '4px 8px', border: '1px solid #374151', textAlign: 'center' }}>หญิง</th>
                    </tr>
                    <tr style={{ background: '#2d4a6e', color: '#e5e7eb', fontSize: '.7rem' }}>
                      {['ต่ำแหน่ง','บนสุด','ต่ำแหน่ง','บนสุด','ต่ำแหน่ง','บนสุด','ต่ำแหน่ง','บนสุด'].map((l,i) => (
                        <th key={i} style={{ padding: '3px 6px', border: '1px solid #374151', textAlign: 'center', fontWeight: 500 }}>{l}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {GROWTH_ROWS.map((r, idx) => {
                      const isFirstOfYear = r.month === 0;
                      return (
                        <tr key={idx} style={{ background: isFirstOfYear ? '#eff6ff' : idx % 2 === 0 ? 'white' : '#f9fafb' }}>
                          <td style={{ padding: '4px 8px', border: '1px solid #e5e7eb', textAlign: 'center', fontWeight: isFirstOfYear ? 800 : 400 }}>{r.month === 0 ? r.year : ''}</td>
                          <td style={{ padding: '4px 8px', border: '1px solid #e5e7eb', textAlign: 'center' }}>{r.month}</td>
                          <td style={{ padding: '4px 8px', border: '1px solid #e5e7eb', textAlign: 'center' }}>{r.bwl}</td>
                          <td style={{ padding: '4px 8px', border: '1px solid #e5e7eb', textAlign: 'center' }}>{r.bwh}</td>
                          <td style={{ padding: '4px 8px', border: '1px solid #e5e7eb', textAlign: 'center' }}>{r.gwl}</td>
                          <td style={{ padding: '4px 8px', border: '1px solid #e5e7eb', textAlign: 'center' }}>{r.gwh}</td>
                          <td style={{ padding: '4px 8px', border: '1px solid #e5e7eb', textAlign: 'center' }}>{r.bhl}</td>
                          <td style={{ padding: '4px 8px', border: '1px solid #e5e7eb', textAlign: 'center' }}>{r.bhh}</td>
                          <td style={{ padding: '4px 8px', border: '1px solid #e5e7eb', textAlign: 'center' }}>{r.ghl}</td>
                          <td style={{ padding: '4px 8px', border: '1px solid #e5e7eb', textAlign: 'center' }}>{r.ghh}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Legend */}
              <div style={{
                marginTop: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap',
                padding: '.75rem 1rem', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', fontSize: '.78rem',
              }}>
                <div><strong>น้ำหนักตามเกณฑ์อายุ:</strong> ดัชนีบ่งชี้ภาวะโภชนาการที่เป็นอยู่ปัจจุบัน</div>
                <div><strong>ส่วนสูงตามเกณฑ์อายุ:</strong> ดัชนีบ่งชี้ภาวะโภชนาการระยะยาว (การเจริญเติบโตทางโครงสร้าง)</div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
