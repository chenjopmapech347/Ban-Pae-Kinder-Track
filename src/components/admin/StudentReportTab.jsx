import { useState, useMemo, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { INDICATORS_DATA } from '../../data/indicatorsData';

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

// ── print helper ──────────────────────────────────────────────────────────────
function printReport({ student, physData, attendanceSummary, healthServices,
                       devDomains, teacherComments, parentComments, directorsComment,
                       academicYear, schoolName, schoolPhilosophy, schoolVision }) {
  const _philosophy = schoolPhilosophy?.trim() || PHILOSOPHY_TEXT;
  const _vision     = schoolVision?.trim()     || VISION_TEXT;
  const levelTag = (n) => {
    const c = n === 3 ? '#059669' : n === 2 ? '#b45309' : n === 1 ? '#dc2626' : '#9ca3af';
    return `<span style="background:${c}20;color:${c};border-radius:4px;padding:1px 5px;font-size:.75rem;font-weight:700">${levelLabel(n)}</span>`;
  };

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

  const html = `<!DOCTYPE html><html><head>
    <meta charset="utf-8">
    <title>สมุดรายงานประจำตัว — ${student?.name ?? ''}</title>
    <style>
      body { font-family:'Sarabun',sans-serif; font-size:13px; margin:20px; color:#111; }
      h1 { text-align:center; font-size:1.1rem; margin-bottom:4px; }
      h2 { font-size:.95rem; margin:14px 0 4px; background:#f3f4f6; padding:4px 8px; border-radius:4px; }
      table { width:100%; border-collapse:collapse; margin-bottom:12px; }
      th { background:#f3f4f6; padding:5px 8px; border:1px solid #d1d5db; font-weight:700; font-size:.8rem; }
      .page-break { page-break-after:always; break-after:page; margin-bottom:20px; }
      @media print { body { margin:8mm; } .page-break { page-break-after:always; break-after:page; } }
    </style>
  </head><body>

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

    <!-- ══ หน้า 3: เกณฑ์มาตรฐานน้ำหนักและส่วนสูง ══ -->
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

    <h2>2. เวลามาเรียน (คิดเป็นวัน)</h2>
    <table>
      <tr><th colspan="2">ภาคเรียน</th><th>เวลาเรียนเต็ม</th><th>มาเรียน</th><th>ไม่มาเรียน</th></tr>
      ${attRows}
    </table>

    <h2>3. บันทึกการบริการทางสุขภาพ (การให้ภูมิคุ้มกัน)</h2>
    <table>
      <tr><th>วัน/เดือน/ปี</th><th>การให้ภูมิคุ้มกัน</th><th>หมายเหตุ</th></tr>
      ${hsRows}
    </table>

    <h2>4. บันทึกผลการประเมินพัฒนาการ</h2>
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

    <div style="margin-top:24px;display:flex;justify-content:space-around;text-align:center">
      <div>
        <div style="border-top:1px solid #000;width:180px;margin:0 auto;padding-top:4px">ครูประจำชั้น</div>
      </div>
      <div>
        <div style="border-top:1px solid #000;width:180px;margin:0 auto;padding-top:4px">ผู้อำนวยการ</div>
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

// sorted GROWTH_TABLE rows for rendering
const GROWTH_ROWS = Object.entries(GROWTH_TABLE)
  .map(([key, v]) => {
    const [y, m] = key.split('-').map(Number);
    return { year: y, month: m, ...v };
  })
  .sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month);

// ═══════════════════════════════════════════════════════════════════════════════
//  Main Component
// ═══════════════════════════════════════════════════════════════════════════════
export default function StudentReportTab({ teacherClassFilter = null }) {
  const {
    students, classes, academicYear, schoolName,
    schoolPhilosophy, schoolVision,
    dailyRecords,
    studentReportRecords, setStudentReportRecords,
    indicators, activities,
  } = useApp();

  const [selStudentId, setSelStudentId] = useState(null);
  const [activeSection, setActiveSection] = useState('physical');
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
      healthServices: [],
      teacherComments:  { term1: '', term2: '' },
      parentComments:   { term1: '', term2: '' },
      directorsComment: '',
    };
  }, [recKey, studentReportRecords, selStudentId, academicYear]);

  const physData       = rec?.physicalRecords ?? emptyPhys();
  const healthServices = rec?.healthServices ?? [];
  const teacherComments  = rec?.teacherComments  ?? { term1: '', term2: '' };
  const parentComments   = rec?.parentComments   ?? { term1: '', term2: '' };
  const directorsComment = rec?.directorsComment ?? '';

  // ── save helper ───────────────────────────────────────────────────────────
  const saveRec = useCallback((patch) => {
    if (!recKey) return;
    setStudentReportRecords(prev => ({
      ...prev,
      [recKey]: { ...(prev[recKey] ?? { studentId: selStudentId, academicYear, physicalRecords: emptyPhys(), healthServices: [], teacherComments: { term1: '', term2: '' }, parentComments: { term1: '', term2: '' }, directorsComment: '' }), ...patch },
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
    { id: 'physical',   label: '⚖️ ร่างกาย'           },
    { id: 'attendance', label: '📅 เวลาเรียน'           },
    { id: 'health',     label: '💉 บริการสุขภาพ'       },
    { id: 'devreport',  label: '📋 พัฒนาการ'           },
    { id: 'summary',     label: '📊 สรุป 12 มาตรฐาน'      },
    { id: 'comments',    label: '💬 ความคิดเห็น'            },
    { id: 'philosophy',  label: '📖 ปรัชญา/วิสัยทัศน์'     },
    { id: 'growthtable', label: '📏 เกณฑ์การเจริญเติบโต'   },
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
              onClick={() => printReport({ student, physData, attendanceSummary, healthServices, devDomains, teacherComments, parentComments, directorsComment, academicYear, schoolName, schoolPhilosophy, schoolVision })}
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
                      <th style={{ padding: '8px 10px', border: '1px solid #e5e7eb', textAlign: 'left', minWidth: '160px' }}>การวัด</th>
                      <th style={{ padding: '8px 10px', border: '1px solid #e5e7eb', textAlign: 'left', minWidth: '140px' }}>
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
                    <th style={{ padding: '8px 16px', border: '1px solid #e5e7eb', textAlign: 'left' }}>ภาคเรียน</th>
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
                      <th style={{ padding: '8px 10px', border: '1px solid #e5e7eb', textAlign: 'left', width: '130px' }}>วัน/เดือน/ปี</th>
                      <th style={{ padding: '8px 10px', border: '1px solid #e5e7eb', textAlign: 'left' }}>การให้ภูมิคุ้มกัน / บริการสุขภาพ</th>
                      <th style={{ padding: '8px 10px', border: '1px solid #e5e7eb', textAlign: 'left' }}>หมายเหตุ</th>
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
              SECTION 4: Developmental Report
          ══════════════════════════════════════════════════════════ */}
          {activeSection === 'devreport' && (
            <div>
              <div style={{ fontWeight: 800, fontSize: '.9rem', color: '#111', marginBottom: '.5rem' }}>
                บันทึกผลการประเมินพัฒนาการ
              </div>
              <div style={{ fontSize: '.78rem', color: '#6b7280', marginBottom: '1rem' }}>
                ดึงข้อมูลจากการประเมินในระบบ · ครั้งที่ 1–2 = ภาคเรียนที่ 1 · ครั้งที่ 3–4 = ภาคเรียนที่ 2
              </div>

              {devDomains.map(domain => (
                <div key={domain.id} style={{ marginBottom: '1.5rem' }}>
                  <div style={{
                    background: domain.bg, border: `2px solid ${domain.color}30`,
                    borderRadius: '10px', padding: '.6rem 1rem', marginBottom: '.5rem',
                    fontWeight: 900, fontSize: '.88rem', color: domain.color,
                  }}>
                    {domain.emoji} พัฒนาการด้าน{domain.label}
                  </div>

                  {domain.standards.map(std => (
                    <div key={std.id} style={{ marginBottom: '.75rem', marginLeft: '.5rem' }}>
                      <div style={{ fontWeight: 700, fontSize: '.8rem', color: '#374151', marginBottom: '.35rem', padding: '.3rem .75rem', background: '#f9fafb', borderRadius: '6px' }}>
                        {std.title}
                      </div>

                      {std.indicators.map(ind => {
                        const t1 = ind.indScores.term1;
                        const t2 = ind.indScores.term2;
                        const hasAny = ind.actIds.some(id => ind.scores[id].term1 !== null || ind.scores[id].term2 !== null);
                        return (
                          <div key={ind.indKey} style={{ marginLeft: '.5rem', marginBottom: '.5rem' }}>
                            <div style={{
                              display: 'flex', alignItems: 'center', gap: '.75rem',
                              padding: '.4rem .75rem', background: '#f3f4f6', borderRadius: '6px',
                              fontSize: '.8rem', marginBottom: '.25rem',
                            }}>
                              <span style={{ fontWeight: 700, flex: 1 }}>{ind.label}</span>
                              <span style={{ fontSize: '.72rem', color: '#6b7280' }}>ภาคเรียน 1:</span>
                              <span style={{
                                fontWeight: 800, fontSize: '.82rem', minWidth: '32px', textAlign: 'center',
                                ...levelColor(t1 !== null ? Math.round(t1) : 0),
                                padding: '2px 8px', borderRadius: '4px',
                              }}>
                                {t1 !== null ? t1.toFixed(1) : '—'}
                              </span>
                              <span style={{ fontSize: '.72rem', color: '#6b7280' }}>ภาคเรียน 2:</span>
                              <span style={{
                                fontWeight: 800, fontSize: '.82rem', minWidth: '32px', textAlign: 'center',
                                ...levelColor(t2 !== null ? Math.round(t2) : 0),
                                padding: '2px 8px', borderRadius: '4px',
                              }}>
                                {t2 !== null ? t2.toFixed(1) : '—'}
                              </span>
                            </div>

                            {hasAny && (
                              <div style={{ marginLeft: '.75rem', overflowX: 'auto' }}>
                                <table style={{ borderCollapse: 'collapse', fontSize: '.76rem', width: '100%' }}>
                                  <thead>
                                    <tr style={{ background: '#f9fafb' }}>
                                      <th style={{ padding: '4px 8px', border: '1px solid #e5e7eb', textAlign: 'left', fontWeight: 600 }}>สภาพที่พึงประสงค์</th>
                                      <th style={{ padding: '4px 8px', border: '1px solid #e5e7eb', textAlign: 'center', width: '90px', fontWeight: 600 }}>ภาคเรียน 1</th>
                                      <th style={{ padding: '4px 8px', border: '1px solid #e5e7eb', textAlign: 'center', width: '90px', fontWeight: 600 }}>ภาคเรียน 2</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {ind.actIds.map((actId, ai) => {
                                      const sc = ind.scores[actId];
                                      if (sc.term1 === null && sc.term2 === null) return null;
                                      const t1c = levelColor(sc.term1 !== null ? Math.round(sc.term1) : 0);
                                      const t2c = levelColor(sc.term2 !== null ? Math.round(sc.term2) : 0);
                                      return (
                                        <tr key={actId} style={{ background: ai % 2 === 0 ? 'white' : '#fafafa' }}>
                                          <td style={{ padding: '4px 8px', border: '1px solid #e5e7eb' }}>{ind.actLabels[actId]}</td>
                                          <td style={{ padding: '4px 8px', border: '1px solid #e5e7eb', textAlign: 'center', ...t1c, fontWeight: 700 }}>
                                            {sc.term1 !== null ? sc.term1.toFixed(1) : '—'}
                                          </td>
                                          <td style={{ padding: '4px 8px', border: '1px solid #e5e7eb', textAlign: 'center', ...t2c, fontWeight: 700 }}>
                                            {sc.term2 !== null ? sc.term2.toFixed(1) : '—'}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            )}

                            {!hasAny && (
                              <div style={{ marginLeft: '.75rem', fontSize: '.75rem', color: '#9ca3af', fontStyle: 'italic', padding: '.2rem .5rem' }}>
                                ยังไม่มีการประเมินในตัวบ่งชี้นี้
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              ))}
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
                      <th style={{ padding: '7px 8px', border: '1px solid #e5e7eb', textAlign: 'left' }}>มาตรฐานคุณลักษณะที่พึงประสงค์</th>
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

              {/* 4-Domain Yearly Summary */}
              <div style={{ marginTop: '1.5rem', fontWeight: 800, fontSize: '.88rem', color: '#111', marginBottom: '.75rem' }}>
                ผลการประเมินความพร้อมด้านพัฒนาการทั้ง 4 ด้าน ตลอดปีการศึกษา
              </div>
              <table style={{ borderCollapse: 'collapse', fontSize: '.82rem' }}>
                <thead>
                  <tr style={{ background: '#f3f4f6' }}>
                    <th style={{ padding: '8px 16px', border: '1px solid #e5e7eb', textAlign: 'left', minWidth: '160px' }}>พัฒนาการ</th>
                    {[3,2,1].map(n => (
                      <th key={n} style={{ padding: '8px 16px', border: '1px solid #e5e7eb', textAlign: 'center', width: '100px', ...levelColor(n) }}>
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
                        <td style={{ padding: '8px 16px', border: '1px solid #e5e7eb', fontWeight: 700 }}>
                          {domain.emoji} ด้าน{domain.label}
                        </td>
                        {[3,2,1].map(n => (
                          <td key={n} style={{ padding: '8px 16px', border: '1px solid #e5e7eb', textAlign: 'center',
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
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              SECTION 6: Comments (Teacher / Parent / Director)
          ══════════════════════════════════════════════════════════ */}
          {activeSection === 'comments' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

              {/* Teacher Comments */}
              <div style={{ background: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: '12px', padding: '1rem 1.25rem' }}>
                <div style={{ fontWeight: 800, fontSize: '.88rem', color: '#1d4ed8', marginBottom: '1rem' }}>
                  🧑‍🏫 ความคิดเห็นของครู
                </div>
                {[1, 2].map(t => (
                  <div key={t} style={{ marginBottom: '1rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '.8rem', color: '#374151', marginBottom: '.35rem' }}>
                      ภาคเรียนที่ {t}
                    </div>
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
                ))}
              </div>

              {/* Parent Comments */}
              <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: '12px', padding: '1rem 1.25rem' }}>
                <div style={{ fontWeight: 800, fontSize: '.88rem', color: '#15803d', marginBottom: '1rem' }}>
                  👨‍👩‍👧 ความคิดเห็นของผู้ปกครอง
                </div>
                {[1, 2].map(t => (
                  <div key={t} style={{ marginBottom: '1rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '.8rem', color: '#374151', marginBottom: '.35rem' }}>
                      ภาคเรียนที่ {t}
                    </div>
                    <textarea
                      value={parentComments[`term${t}`]}
                      onChange={e => saveRec({ parentComments: { ...parentComments, [`term${t}`]: e.target.value } })}
                      rows={3}
                      placeholder={`บันทึกความคิดเห็นของผู้ปกครอง ภาคเรียนที่ ${t}...`}
                      style={{
                        width: '100%', padding: '8px 10px', border: '1px solid #86efac',
                        borderRadius: '8px', fontFamily: 'inherit', fontSize: '.82rem',
                        resize: 'vertical', boxSizing: 'border-box', background: 'white',
                      }}
                    />
                    <div style={{ marginTop: '.5rem', fontSize: '.75rem', color: '#6b7280' }}>
                      ลงชื่อ _________________________ (ผู้ปกครอง)
                    </div>
                  </div>
                ))}
              </div>

              {/* Director's Comment */}
              <div style={{ background: '#fdf4ff', border: '1.5px solid #e9d5ff', borderRadius: '12px', padding: '1rem 1.25rem' }}>
                <div style={{ fontWeight: 800, fontSize: '.88rem', color: '#7e22ce', marginBottom: '.75rem' }}>
                  🏛️ ความคิดเห็นของผู้อำนวยการสถานศึกษา (ตลอดปีการศึกษา)
                </div>
                <textarea
                  value={directorsComment}
                  onChange={e => saveRec({ directorsComment: e.target.value })}
                  rows={3}
                  placeholder="บันทึกความคิดเห็นของผู้อำนวยการสถานศึกษา..."
                  style={{
                    width: '100%', padding: '8px 10px', border: '1px solid #d8b4fe',
                    borderRadius: '8px', fontFamily: 'inherit', fontSize: '.82rem',
                    resize: 'vertical', boxSizing: 'border-box', background: 'white',
                  }}
                />
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
