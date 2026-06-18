// FormReportsTab.jsx — แบบฟอร์มพิมพ์ 12 รายการ
import { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';

// ── constants ────────────────────────────────────────────────────────────────
const THAI_MONTHS = [
  { num:5,  short:'พ.ค.',  full:'พฤษภาคม',   days:31, be:2568, ce:2025 },
  { num:6,  short:'มิ.ย.', full:'มิถุนายน',   days:30, be:2568, ce:2025 },
  { num:7,  short:'ก.ค.',  full:'กรกฎาคม',    days:31, be:2568, ce:2025 },
  { num:8,  short:'ส.ค.',  full:'สิงหาคม',    days:31, be:2568, ce:2025 },
  { num:9,  short:'ก.ย.',  full:'กันยายน',    days:30, be:2568, ce:2025 },
  { num:10, short:'ต.ค.',  full:'ตุลาคม',     days:31, be:2568, ce:2025 },
  { num:11, short:'พ.ย.',  full:'พฤศจิกายน',  days:30, be:2568, ce:2025 },
  { num:12, short:'ธ.ค.',  full:'ธันวาคม',    days:31, be:2568, ce:2025 },
  { num:1,  short:'ม.ค.',  full:'มกราคม',     days:31, be:2569, ce:2026 },
  { num:2,  short:'ก.พ.',  full:'กุมภาพันธ์', days:28, be:2569, ce:2026 },
  { num:3,  short:'มี.ค.', full:'มีนาคม',     days:31, be:2569, ce:2026 },
];

const THAI_DAYS_SHORT = ['อา','จ','อ','พ','พฤ','ศ','ส'];

const INDOOR_CORNERS = [
  'มุมบล็อก','มุมนิทาน','มุมแต่งตัว','มุมสร้างสรรค์','มุมบทบาทสมมติ',
  'มุมสื่อ','มุมทราย/น้ำ','มุมธรรมชาติ','มุมออกกำลังกาย',
];
const OUTDOOR_CORNERS = [
  'คัดแยกขยะ (mRS)','ขยะอินทรีย์','แปลงปลูกผัก',
  'ห้องแหล่งเรียนรู้','ห้องคอมพิวเตอร์','เครื่องหมายจราจร',
];

const REPORT_TYPES = [
  { id:'health',      label:'คัดกรองอาการป่วย',                                          icon:'🩺', hasCls:true,  hasMo:true  },
  { id:'lunch',       label:'การรับประทานอาหารกลางวัน',                                  icon:'🍱', hasCls:true,  hasMo:true  },
  { id:'milk',        label:'การดื่มนม',                                                  icon:'🥛', hasCls:true,  hasMo:true  },
  { id:'pickup',      label:'การรับ-ส่งนักเรียน',                                        icon:'🚌', hasCls:true,  hasMo:true  },
  { id:'corners_in',  label:'การเล่นมุมประสบการณ์ภายในห้องเรียน',                        icon:'🏠', hasCls:true,  hasWk:true  },
  { id:'corners_out', label:'การเล่นมุมประสบการณ์ภายนอกห้องเรียน',                       icon:'🌳', hasCls:true,  hasWk:true  },
  { id:'wh',          label:'วัดน้ำหนัก-ส่วนสูง',                                        icon:'📏', hasCls:true                },
  { id:'teeth',       label:'การแปรงฟัน',                                                 icon:'🦷', hasCls:true,  hasMo:true  },
  { id:'attend',      label:'ลงเวลาเรียน',                                                icon:'📋', hasCls:true,  hasMo:true  },
  { id:'dev',         label:'การประเมินพัฒนาการ การศึกษาปฐมวัย',                          icon:'🌱', hasCls:true                },
];

// ── helpers ──────────────────────────────────────────────────────────────────
// 'print' = print-optimized (compact, fixed widths, auto window.print()),
// 'preview' = screen-optimized (larger text, columns auto-fit to content)
let RENDER_MODE = 'print';

function printHtml(title, html, landscape = true) {
  if (RENDER_MODE === 'preview') { previewHtml(title, html, landscape); return; }
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap');
    *{box-sizing:border-box}
    body{font-family:'Sarabun',sans-serif;font-size:10px;margin:0;padding:0;background:#fff;color:#000}
    h2{font-size:12px;font-weight:800;margin:0 0 1px;text-align:center}
    .sub{font-size:9px;color:#444;margin-bottom:4px;text-align:center}
    table{width:100%;border-collapse:collapse}
    th,td{border:1px solid #888;padding:1.5px 2px;text-align:center;vertical-align:middle;font-size:8.5px}
    th{background:#d0d0d0;font-weight:700}
    .tl{text-align:left!important;padding-left:4px!important}
    .wd{width:20px;min-width:20px}
    .sig{margin-top:14px;text-align:right}
    .sig-inner{display:inline-block;text-align:center}
    .sig-line{width:155px;border-bottom:1px solid #555;margin:18px auto 2px}
    .legend{font-size:8px;color:#555;margin-top:2px}
    .pg{page-break-after:always}
    @media print{body{margin:0}@page{margin:1in;size:A4 ${landscape?'landscape':'portrait'}}}
  `;
  const w = window.open('','_blank','width=1100,height=750');
  if (!w) { alert('กรุณาอนุญาต popup'); return; }
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title><style>${css}</style></head><body>${html}<script>setTimeout(()=>window.print(),600)</` + `script></body></html>`);
  w.document.close();
}

// แสดงตัวอย่างก่อนพิมพ์ — เหมาะกับการดูบนจอ คอลัมน์ปรับความกว้างตามเนื้อหา
function previewHtml(title, html, landscape = true) {
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap');
    *{box-sizing:border-box}
    body{font-family:'Sarabun',sans-serif;margin:0;padding:0;color:#111}
    .preview-bar{
      position:sticky;top:0;z-index:10;display:flex;align-items:center;justify-content:space-between;
      gap:1rem;background:#fff;border-bottom:2px solid #ddd6fe;padding:.7rem 1.2rem;
      font-weight:800;font-size:.95rem;color:#7c3aed;
    }
    .preview-bar button{
      font-family:inherit;font-weight:800;font-size:.85rem;color:#fff;background:#7c3aed;
      border:none;border-radius:8px;padding:.5rem 1.1rem;cursor:pointer;
    }
    .preview-bar button:hover{background:#6d28d9}
    h2{font-size:12px;font-weight:800;margin:0 0 1px;text-align:center}
    .sub{font-size:9px;color:#444;margin-bottom:4px;text-align:center}
    table{width:100%;border-collapse:collapse}
    th,td{border:1px solid #888;padding:1.5px 2px;text-align:center;vertical-align:middle;font-size:8.5px}
    th{background:#d0d0d0;font-weight:700}
    .tl{text-align:left!important;padding-left:4px!important}
    .wd{width:20px;min-width:20px}
    .sig{margin-top:14px;text-align:right}
    .sig-inner{display:inline-block;text-align:center}
    .sig-line{width:155px;border-bottom:1px solid #555;margin:18px auto 2px}
    .legend{font-size:8px;color:#555;margin-top:2px}
    .pg{page-break-after:always}

    /* จอภาพ: ขยายตัวอักษร/ระยะห่าง และปรับคอลัมน์ให้พอดีกับเนื้อหา */
    @media screen{
      html{background:#e5e7eb}
      body{font-size:15px;background:#e5e7eb}
      .preview-content{padding:1.2rem;overflow-x:auto}
      h2{font-size:20px;margin:0 0 4px}
      .sub{font-size:14px;margin-bottom:10px}
      table{width:auto;max-width:none;table-layout:auto;margin:0 auto 16px;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.08)}
      th,td{padding:6px 12px;font-size:14px;white-space:nowrap}
      th{background:#ede9fe}
      .tl{padding-left:8px!important;white-space:normal}
      .wd{width:auto!important;min-width:32px!important}
      th[style*="width"],td[style*="width"]{width:auto!important;min-width:0!important}
      .sig{margin-top:20px}
      .sig-line{width:200px;margin:24px auto 4px}
      .legend{font-size:13px;margin-top:6px}
      .pg{border-bottom:3px dashed #c4b5fd;padding-bottom:24px;margin-bottom:24px}
    }

    /* พิมพ์: ใช้สัดส่วนเดียวกับปุ่ม "พิมพ์แบบฟอร์ม" ให้ผลลัพธ์ตรงกัน */
    @media print{
      .preview-bar{display:none}
      .preview-content{padding:0}
      @page{margin:1in;size:A4 ${landscape?'landscape':'portrait'}}
    }
  `;
  const w = window.open('','_blank','width=1200,height=850');
  if (!w) { alert('กรุณาอนุญาต popup'); return; }
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>ตัวอย่าง: ${title}</title><style>${css}</style></head><body>
    <div class="preview-bar">
      <span>👁️ ตัวอย่างก่อนพิมพ์ — ${title}</span>
      <button onclick="window.print()">🖨️ พิมพ์</button>
    </div>
    <div class="preview-content">${html}</div>
  </body></html>`);
  w.document.close();
}

function gender(name) {
  if (!name) return '';
  if (/เด็กชาย|ด\.ช\./.test(name)) return 'ช';
  if (/เด็กหญิง|ด\.ญ\./.test(name)) return 'ญ';
  return '';
}

function teacherName(teachers, className) {
  const t = (teachers ?? []).find(t => t.className === className);
  if (!t) return '';
  if (t.firstName && t.lastName) return `${t.firstName} ${t.lastName}`;
  return t.name ?? '';
}

function realSts(students, className) {
  return (students ?? [])
    .filter(s => s.className === className && !String(s.name).startsWith('(ว่าง)'))
    .sort((a, b) => Number(a.id) - Number(b.id));
}

function getDOW(ce, mo, day) { return new Date(ce, mo - 1, day).getDay(); }

function getWeekdays(ce, mo, totalDays) {
  const days = [];
  for (let d = 1; d <= totalDays; d++) {
    const dow = getDOW(ce, mo, d);
    if (dow >= 1 && dow <= 5) days.push({ day: d, dow });
  }
  return days;
}

function weekRange(weekNum) {
  // Academic year week 1 starts Mon May 5, 2025
  const base = new Date(2025, 4, 5);
  const ws = new Date(base.getTime() + (weekNum - 1) * 7 * 86400000);
  const we = new Date(ws.getTime() + 4 * 86400000);
  const fmt = d => `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()+543}`;
  return `${fmt(ws)}–${fmt(we)}`;
}

function sigHtml(name, pos = 'ครูประจำชั้น') {
  return `<div class="sig"><div class="sig-inner">
    <div class="sig-line"></div>
    <div style="font-size:9px">(${name || '........................................'})</div>
    <div style="font-size:8.5px;color:#555">${pos}</div>
  </div></div>`;
}

function dayDateKey(m, d) {
  return `${m.ce}-${String(m.num).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}

// ── print functions ───────────────────────────────────────────────────────────

// 1. แบบคัดกรองอาการป่วย
function printHealth(students, teachers, dailyRecords, schoolName, cn, mi) {
  const sts = realSts(students, cn);
  const m = THAI_MONTHS[mi];
  const tName = teacherName(teachers, cn);
  const dHdr = Array.from({length:m.days},(_,i)=>`<th class="wd">${i+1}</th>`).join('');
  const rows = sts.map((s,idx) => {
    const cells = Array.from({length:m.days},(_,i) => {
      const rec = dailyRecords?.[dayDateKey(m,i+1)]?.[String(s.id)];
      const v = rec?.attendance==='ขาด'?'X':rec?.attendance==='ป่วย'?'C':rec?.attendance==='มา'?'✓':'';
      return `<td>${v}</td>`;
    }).join('');
    return `<tr><td>${idx+1}</td><td class="tl">${s.name}</td><td>${s.weight??''}</td><td>${s.height??''}</td>${cells}</tr>`;
  }).join('');
  printHtml(`คัดกรองอาการป่วย ${cn} ${m.short}${m.be}`, `
    <h2>แบบคัดกรองอาการป่วยรายห้องเรียน</h2>
    <div class="sub">ห้อง ${cn} &nbsp;|&nbsp; เดือน ${m.full} พ.ศ.${m.be} &nbsp;|&nbsp; ${schoolName}</div>
    <table><thead>
      <tr><th rowspan="2" style="width:26px">ลำดับ</th><th rowspan="2" class="tl" style="min-width:120px">ชื่อ-สกุล</th>
        <th rowspan="2" style="width:34px">น.น.<br/>(กก.)</th><th rowspan="2" style="width:34px">ส่วนสูง<br/>(ซม.)</th>
        <th colspan="${m.days}">วันที่</th></tr>
      <tr>${dHdr}</tr>
    </thead><tbody>${rows}</tbody></table>
    <div class="legend">✓ = ปกติ &nbsp; C = ป่วย &nbsp; X = ขาดเรียน</div>
    ${sigHtml(tName)}`, true);
}

// 2. อาหารกลางวัน
function printLunch(students, teachers, dailyRecords, schoolName, cn, mi) {
  const sts = realSts(students, cn);
  const m = THAI_MONTHS[mi];
  const tName = teacherName(teachers, cn);
  const dHdr = Array.from({length:m.days},(_,i)=>`<th class="wd">${i+1}</th>`).join('');
  const rows = sts.map((s,idx) => {
    const cells = Array.from({length:m.days},(_,i) => {
      const rec = dailyRecords?.[dayDateKey(m,i+1)]?.[String(s.id)];
      let v = '';
      if (rec?.attendance==='ขาด'||rec?.attendance==='ป่วย') v='–';
      else if (rec?.attendance==='มา') v='ห';
      return `<td>${v}</td>`;
    }).join('');
    return `<tr><td>${idx+1}</td><td class="tl">${s.name}</td><td>${cn}</td><td>${gender(s.name)}</td>${cells}</tr>`;
  }).join('');
  printHtml(`อาหารกลางวัน ${cn} ${m.short}${m.be}`, `
    <h2>แบบบันทึกการรับประทานอาหารกลางวัน</h2>
    <div class="sub">ห้อง ${cn} &nbsp;|&nbsp; เดือน ${m.full} พ.ศ.${m.be} &nbsp;|&nbsp; ${schoolName}</div>
    <table><thead>
      <tr><th rowspan="2" style="width:26px">ลำดับ</th><th rowspan="2" class="tl" style="min-width:120px">ชื่อ-นามสกุล</th>
        <th rowspan="2" style="width:50px">ชั้น/ห้อง</th><th rowspan="2" style="width:26px">เพศ</th>
        <th colspan="${m.days}">วันที่</th></tr>
      <tr>${dHdr}</tr>
    </thead><tbody>${rows}</tbody></table>
    <div class="legend">ห = รับประทาน &nbsp; x = ไม่รับ &nbsp; – = ขาดเรียน</div>
    ${sigHtml(tName)}`, true);
}

// 3. ดื่มนม
function printMilk(students, teachers, dailyRecords, schoolName, cn, mi) {
  const sts = realSts(students, cn);
  const m = THAI_MONTHS[mi];
  const tName = teacherName(teachers, cn);
  const dHdr = Array.from({length:m.days},(_,i)=>`<th class="wd">${i+1}</th>`).join('');
  const rows = sts.map((s,idx) => {
    const cells = Array.from({length:m.days},(_,i) => {
      const rec = dailyRecords?.[dayDateKey(m,i+1)]?.[String(s.id)];
      let v = '';
      if (rec?.attendance==='ขาด'||rec?.attendance==='ป่วย') v='–';
      else if (rec?.milk===true) v='ห';
      else if (rec?.milk===false&&rec?.attendance==='มา') v='x';
      return `<td>${v}</td>`;
    }).join('');
    return `<tr><td>${idx+1}</td><td class="tl">${s.name}</td><td>${cn}</td><td>${gender(s.name)}</td>${cells}</tr>`;
  }).join('');
  printHtml(`ดื่มนม ${cn} ${m.short}${m.be}`, `
    <h2>แบบบันทึกการดื่มนมโรงเรียนรายเดือน</h2>
    <div class="sub">ห้อง ${cn} &nbsp;|&nbsp; เดือน ${m.full} พ.ศ.${m.be} &nbsp;|&nbsp; ${schoolName}</div>
    <table><thead>
      <tr><th rowspan="2" style="width:26px">ลำดับ</th><th rowspan="2" class="tl" style="min-width:120px">ชื่อ-นามสกุล</th>
        <th rowspan="2" style="width:50px">ชั้น/ห้อง</th><th rowspan="2" style="width:26px">เพศ</th>
        <th colspan="${m.days}">วันที่</th></tr>
      <tr>${dHdr}</tr>
    </thead><tbody>${rows}</tbody></table>
    <div class="legend">ห = ดื่มนม &nbsp; x = ไม่ดื่ม &nbsp; – = ขาดเรียน</div>
    ${sigHtml(tName)}`, true);
}

// 4. รับ-ส่ง
function printPickup(students, teachers, schoolName, cn, mi) {
  const sts = realSts(students, cn);
  const m = THAI_MONTHS[mi];
  const tName = teacherName(teachers, cn);
  const wds = getWeekdays(m.ce, m.num, m.days);
  const dateHdr = wds.map(w=>`<th colspan="2" style="font-size:8px">${w.day}</th>`).join('');
  const srHdr   = wds.map(()=>`<th style="font-size:7.5px">ส่ง</th><th style="font-size:7.5px">รับ</th>`).join('');
  const rows = sts.map((s,idx) =>
    `<tr><td>${idx+1}</td><td class="tl">${s.name}</td>${wds.map(()=>'<td></td><td></td>').join('')}</tr>`
  ).join('');
  printHtml(`รับ-ส่ง ${cn} ${m.short}${m.be}`, `
    <h2>แบบบันทึกการรับ-ส่งนักเรียน</h2>
    <div class="sub">ห้อง ${cn} &nbsp;|&nbsp; เดือน ${m.full} พ.ศ.${m.be} &nbsp;|&nbsp; ${schoolName}</div>
    <table><thead>
      <tr><th rowspan="3" style="width:26px">ลำดับ</th><th rowspan="3" class="tl" style="min-width:120px">ชื่อ-นามสกุล</th>
        <th colspan="${wds.length*2}">วันที่ (จันทร์–ศุกร์)</th></tr>
      <tr>${dateHdr}</tr>
      <tr>${srHdr}</tr>
    </thead><tbody>${rows}</tbody></table>
    ${sigHtml(tName)}`, true);
}

// 5. มุมประสบการณ์ภายใน
function printCornersIn(students, teachers, schoolName, cn, wk) {
  const sts = realSts(students, cn);
  const tName = teacherName(teachers, cn);
  const sHdr = sts.map(s=>`<th style="writing-mode:vertical-rl;min-width:20px;font-size:7.5px">${s.name.replace(/เด็กชาย|เด็กหญิง|ด\.ช\.|ด\.ญ\./g,'').trim()}</th>`).join('');
  const rows = INDOOR_CORNERS.map(c=>
    `<tr><td class="tl">${c}</td>${sts.map(()=>'<td></td>').join('')}</tr>`
  ).join('');
  printHtml(`มุมภายใน ${cn} สัปดาห์${wk}`, `
    <h2>แบบบันทึกการเล่นตามมุมประสบการณ์ภายในห้องเรียน รายสัปดาห์</h2>
    <div class="sub">ห้อง ${cn} &nbsp;|&nbsp; สัปดาห์ที่ ${wk} (${weekRange(wk)}) &nbsp;|&nbsp; ${schoolName}</div>
    <table><thead><tr><th class="tl" style="min-width:110px">มุมประสบการณ์</th>${sHdr}</tr></thead>
    <tbody>${rows}
      <tr style="background:#eee"><td class="tl"><strong>รวมทั้งหมด</strong></td>${sts.map(()=>'<td></td>').join('')}</tr>
    </tbody></table>
    <div class="legend">บันทึกจำนวนครั้งที่เด็กเล่นในแต่ละมุม</div>
    ${sigHtml(tName)}`, false);
}

// 6. มุมประสบการณ์ภายนอก
function printCornersOut(students, teachers, schoolName, cn, wk) {
  const sts = realSts(students, cn);
  const tName = teacherName(teachers, cn);
  const sHdr = sts.map(s=>`<th style="writing-mode:vertical-rl;min-width:20px;font-size:7.5px">${s.name.replace(/เด็กชาย|เด็กหญิง|ด\.ช\.|ด\.ญ\./g,'').trim()}</th>`).join('');
  const rows = OUTDOOR_CORNERS.map(c=>
    `<tr><td class="tl">${c}</td>${sts.map(()=>'<td></td>').join('')}</tr>`
  ).join('');
  printHtml(`มุมภายนอก ${cn} สัปดาห์${wk}`, `
    <h2>แบบบันทึกการเล่นตามมุมประสบการณ์ภายนอกห้องเรียน รายสัปดาห์</h2>
    <div class="sub">ห้อง ${cn} &nbsp;|&nbsp; สัปดาห์ที่ ${wk} (${weekRange(wk)}) &nbsp;|&nbsp; ${schoolName}</div>
    <table><thead><tr><th class="tl" style="min-width:120px">มุมประสบการณ์</th>${sHdr}</tr></thead>
    <tbody>${rows}
      <tr style="background:#eee"><td class="tl"><strong>รวมทั้งหมด</strong></td>${sts.map(()=>'<td></td>').join('')}</tr>
    </tbody></table>
    <div class="legend">บันทึกจำนวนครั้งที่เด็กเล่นในแต่ละมุม</div>
    ${sigHtml(tName)}`, false);
}

// 7. น้ำหนัก-ส่วนสูง
function printWH(students, teachers, schoolName, cn) {
  const sts = realSts(students, cn);
  const tName = teacherName(teachers, cn);
  const rows = sts.map((s,idx) => `
    <tr>
      <td>${idx+1}</td><td class="tl">${s.name}</td><td>${cn}</td><td>${gender(s.name)}</td>
      <td style="font-size:8px">${s.birthdate??''}</td><td>${s.age??''}</td>
      <td>${s.height??''}</td><td>${s.weight??''}</td><td></td>
      <td>${s.height??''}</td><td>${s.weight??''}</td><td></td>
      <td></td>
    </tr>`).join('');
  printHtml(`น้ำหนัก-ส่วนสูง ${cn}`, `
    <h2>แบบบันทึกน้ำหนัก-ส่วนสูง นักเรียน</h2>
    <div class="sub">ห้อง ${cn} &nbsp;|&nbsp; ปีการศึกษา 2568 &nbsp;|&nbsp; ${schoolName}</div>
    <table><thead>
      <tr>
        <th rowspan="2" style="width:26px">ลำดับ</th>
        <th rowspan="2" class="tl" style="min-width:120px">ชื่อ-สกุล</th>
        <th rowspan="2" style="width:50px">ชั้น/ห้อง</th>
        <th rowspan="2" style="width:26px">เพศ</th>
        <th rowspan="2" style="width:65px">วันเกิด</th>
        <th rowspan="2" style="width:42px">อายุ<br/>(ปี)</th>
        <th colspan="3">ครั้งที่ 1</th>
        <th colspan="3">ครั้งที่ 2</th>
        <th rowspan="2" style="width:50px">หมายเหตุ</th>
      </tr>
      <tr>
        <th style="width:38px">ส่วนสูง<br/>(ซม.)</th><th style="width:38px">น.น.<br/>(กก.)</th><th style="width:45px">เกณฑ์</th>
        <th style="width:38px">ส่วนสูง<br/>(ซม.)</th><th style="width:38px">น.น.<br/>(กก.)</th><th style="width:45px">เกณฑ์</th>
      </tr>
    </thead><tbody>${rows}</tbody></table>
    ${sigHtml(tName)}`, true);
}

// 8. แปรงฟัน
function printTeeth(students, teachers, dailyRecords, schoolName, cn, mi) {
  const sts = realSts(students, cn);
  const m = THAI_MONTHS[mi];
  const tName = teacherName(teachers, cn);
  const dHdr1 = Array.from({length:m.days},(_,i)=>`<th class="wd">${i+1}</th>`).join('');
  const dHdr2 = Array.from({length:m.days},(_,i)=>
    `<th style="font-size:7px;background:#e8e8e8">${THAI_DAYS_SHORT[getDOW(m.ce,m.num,i+1)]}</th>`
  ).join('');
  const rows = sts.map((s,idx) => {
    const cells = Array.from({length:m.days},(_,i) => {
      const rec = dailyRecords?.[dayDateKey(m,i+1)]?.[String(s.id)];
      let v='';
      if (rec?.brush===true) v='✓';
      else if (rec?.brush===false&&rec?.attendance==='มา') v='x';
      else if (rec?.attendance==='ขาด'||rec?.attendance==='ป่วย') v='–';
      return `<td>${v}</td>`;
    }).join('');
    return `<tr><td>${idx+1}</td><td class="tl">${s.name}</td>${cells}</tr>`;
  }).join('');
  printHtml(`แปรงฟัน ${cn} ${m.short}${m.be}`, `
    <h2>แบบบันทึกการแปรงฟัน</h2>
    <div class="sub">ห้อง ${cn} &nbsp;|&nbsp; เดือน ${m.full} พ.ศ.${m.be} &nbsp;|&nbsp; ${schoolName}</div>
    <table><thead>
      <tr><th rowspan="3" style="width:26px">เลขที่</th><th rowspan="3" class="tl" style="min-width:120px">ชื่อ-สกุล</th>
        <th colspan="${m.days}">วันที่</th></tr>
      <tr>${dHdr1}</tr>
      <tr>${dHdr2}</tr>
    </thead><tbody>${rows}</tbody></table>
    <div class="legend">✓ = แปรงฟัน &nbsp; x = ไม่แปรง &nbsp; – = ขาดเรียน</div>
    ${sigHtml(tName)}`, true);
}

// 9. ทะเบียนผลิตสื่อ
function printMedia(teachers, schoolName, cn) {
  const tName = teacherName(teachers, cn);
  const rows = Array.from({length:30},(_,i)=>`
    <tr><td>${i+1}</td><td class="tl"></td><td class="tl"></td><td></td><td></td><td></td><td class="tl"></td></tr>`
  ).join('');
  printHtml(`ทะเบียนผลิตสื่อ ${cn}`, `
    <h2>ทะเบียนผลิตสื่อ / นวัตกรรมการเรียนการสอน</h2>
    <div class="sub">ห้อง ${cn} &nbsp;|&nbsp; ปีการศึกษา 2568 &nbsp;|&nbsp; ${schoolName}</div>
    <table><thead><tr>
      <th style="width:26px">ที่</th>
      <th class="tl" style="min-width:160px">รายการสื่อ / นวัตกรรม</th>
      <th class="tl" style="min-width:120px">ประกอบการสอนหน่วย</th>
      <th style="width:55px">สื่อทำมือ</th>
      <th style="width:50px">สื่อ AI</th>
      <th style="width:55px">ประเภทสื่อ<br/>(เก่า/ใหม่)</th>
      <th class="tl" style="min-width:80px">หมายเหตุ</th>
    </tr></thead><tbody>${rows}</tbody></table>
    ${sigHtml(tName)}`, false);
}

// 10. บันทึกเวลาเรียน
function printAttend(students, teachers, dailyRecords, schoolName, cn, mi) {
  const sts = realSts(students, cn);
  const m = THAI_MONTHS[mi];
  const tName = teacherName(teachers, cn);
  const dHdr1 = Array.from({length:m.days},(_,i)=>`<th class="wd">${i+1}</th>`).join('');
  const dHdr2 = Array.from({length:m.days},(_,i)=>
    `<th style="font-size:7px;background:#e8e8e8">${THAI_DAYS_SHORT[getDOW(m.ce,m.num,i+1)]}</th>`
  ).join('');
  const rows = sts.map((s,idx) => {
    let cM=0,cP=0,cL=0,cK=0;
    const cells = Array.from({length:m.days},(_,i) => {
      const rec = dailyRecords?.[dayDateKey(m,i+1)]?.[String(s.id)];
      let v='';
      if (rec?.attendance==='มา') {v='มา';cM++;}
      else if (rec?.attendance==='ป่วย') {v='ป';cP++;}
      else if (rec?.attendance==='ลา') {v='ล';cL++;}
      else if (rec?.attendance==='ขาด') {v='ข';cK++;}
      return `<td style="font-size:7.5px">${v}</td>`;
    }).join('');
    return `<tr><td>${idx+1}</td><td class="tl">${s.name}</td>${cells}<td>${cM||''}</td><td>${cP||''}</td><td>${cL||''}</td><td>${cK||''}</td></tr>`;
  }).join('');
  printHtml(`บันทึกเวลาเรียน ${cn} ${m.short}${m.be}`, `
    <h2>บันทึกเวลาเรียน</h2>
    <div class="sub">ห้อง ${cn} &nbsp;|&nbsp; เดือน ${m.full} พ.ศ.${m.be} &nbsp;|&nbsp; ${schoolName}</div>
    <table><thead>
      <tr>
        <th rowspan="3" style="width:26px">เลขที่</th>
        <th rowspan="3" class="tl" style="min-width:120px">ชื่อ-สกุล</th>
        <th colspan="${m.days}">วันที่</th>
        <th rowspan="3" style="width:22px">มา</th>
        <th rowspan="3" style="width:22px">ป</th>
        <th rowspan="3" style="width:22px">ล</th>
        <th rowspan="3" style="width:22px">ข</th>
      </tr>
      <tr>${dHdr1}</tr>
      <tr>${dHdr2}</tr>
    </thead><tbody>${rows}</tbody></table>
    <div class="legend">มา=มาเรียน &nbsp; ป=ป่วย &nbsp; ล=ลา &nbsp; ข=ขาดเรียน</div>
    ${sigHtml(tName)}`, true);
}

// 11. แบบบันทึกผลการประเมินพัฒนาการ
function printDev(students, teachers, schoolName, cn, topics, indicators, activities) {
  const sts = realSts(students, cn);
  const tName = teacherName(teachers, cn);
  const tpList = (topics ?? []);
  const tHdr1 = tpList.map(t=>`<th colspan="3" style="font-size:8px">${t.emoji||''}${t.label}</th>`).join('');
  const tHdr2 = tpList.map(()=>`<th style="font-size:7.5px">1</th><th style="font-size:7.5px">2</th><th style="font-size:7.5px">สรุป</th>`).join('');
  const rows = sts.map((s,idx) => {
    const cells = tpList.map(t => {
      const inds = (indicators??[]).filter(i=>i.domainId===t.id);
      const r1sc = inds.flatMap(ind=>(activities??[]).filter(a=>a.indicatorId===ind.id)
        .map(act=>s.assessments?.indicators?.[ind.id]?.[act.id]?.r1??null)).filter(v=>v!==null);
      const r2sc = inds.flatMap(ind=>(activities??[]).filter(a=>a.indicatorId===ind.id)
        .map(act=>s.assessments?.indicators?.[ind.id]?.[act.id]?.r2??null)).filter(v=>v!==null);
      const r1 = r1sc.length?Math.round(r1sc.reduce((a,b)=>a+b,0)/r1sc.length):'';
      const r2 = r2sc.length?Math.round(r2sc.reduce((a,b)=>a+b,0)/r2sc.length):'';
      return `<td>${r1}</td><td>${r2}</td><td style="font-weight:700">${r2||r1||''}</td>`;
    }).join('');
    return `<tr><td>${idx+1}</td><td class="tl">${s.name}</td>${cells}</tr>`;
  }).join('');
  printHtml(`แบบบันทึกพัฒนาการ ${cn}`, `
    <h2>แบบบันทึกผลการประเมินพัฒนาการ การศึกษาปฐมวัย</h2>
    <div class="sub">ห้อง ${cn} &nbsp;|&nbsp; ปีการศึกษา 2568 &nbsp;|&nbsp; ${schoolName}</div>
    <table><thead>
      <tr>
        <th rowspan="2" style="width:26px">เลขที่</th>
        <th rowspan="2" class="tl" style="min-width:110px">ชื่อ-สกุล</th>
        ${tHdr1}
      </tr>
      <tr>${tHdr2}</tr>
    </thead><tbody>${rows}</tbody></table>
    <div class="legend">1 = ต้องปรับปรุง &nbsp; 2 = พอใช้ &nbsp; 3 = ดี &nbsp; (ครั้งที่ 1, 2 = ภาคเรียน)</div>
    ${sigHtml(tName)}`, true);
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function FormReportsTab({ teacherClassFilter = null, defaultReport = 'health' }) {
  const {
    students, teachers, classes, schools,
    dailyRecords, assessmentTopics, indicators, activities,
  } = useApp();

  const [selReport,  setSelReport]  = useState(defaultReport);
  const [selClass,   setSelClass]   = useState('');
  const [selMonth,   setSelMonth]   = useState(1); // default มิ.ย.
  const [selWeek,    setSelWeek]    = useState(1);
  const [selStudent, setSelStudent] = useState(''); // '' = ทั้งหมด

  const schoolName = schools?.[0]?.name ?? 'โรงเรียน';

  const classList = useMemo(() => {
    if (teacherClassFilter) return [teacherClassFilter];
    return (classes ?? []).map(c => c.name ?? c.id).filter(Boolean).sort();
  }, [classes, teacherClassFilter]);

  // auto-select first class
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!selClass && classList.length) setSelClass(classList[0]);
  }, [classList, selClass]);

  const rpt = REPORT_TYPES.find(r => r.id === selReport);
  const cn  = selClass || classList[0] || '';
  const classStudents = useMemo(() => realSts(students, cn), [students, cn]);
  const cnt = classStudents.length;

  // reset student selection when class changes or switching away from book
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setSelStudent(''); }, [cn, selReport]);

  const runReport = () => {
    if (!cn && rpt?.hasCls) return;
    switch (selReport) {
      case 'health':      printHealth(students, teachers, dailyRecords, schoolName, cn, selMonth); break;
      case 'lunch':       printLunch(students, teachers, dailyRecords, schoolName, cn, selMonth); break;
      case 'milk':        printMilk(students, teachers, dailyRecords, schoolName, cn, selMonth); break;
      case 'pickup':      printPickup(students, teachers, schoolName, cn, selMonth); break;
      case 'corners_in':  printCornersIn(students, teachers, schoolName, cn, selWeek); break;
      case 'corners_out': printCornersOut(students, teachers, schoolName, cn, selWeek); break;
      case 'wh':          printWH(students, teachers, schoolName, cn); break;
      case 'teeth':       printTeeth(students, teachers, dailyRecords, schoolName, cn, selMonth); break;
      case 'media':       printMedia(teachers, schoolName, cn); break;
      case 'attend':      printAttend(students, teachers, dailyRecords, schoolName, cn, selMonth); break;
      case 'dev':         printDev(students, teachers, schoolName, cn, assessmentTopics, indicators, activities); break;
    }
  };

  const handlePrint = () => { RENDER_MODE = 'print'; runReport(); };
  const handlePreview = () => { RENDER_MODE = 'preview'; runReport(); };

  return (
    <div>
      {/* ── Report type selector ── */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ fontSize: '.75rem', fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '.5rem' }}>
          เลือกแบบฟอร์ม
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.3rem' }}>
          {REPORT_TYPES.map(r => {
            const active = selReport === r.id;
            return (
              <button key={r.id} type="button" onClick={() => setSelReport(r.id)} style={{
                padding: '.3rem .7rem', borderRadius: '9px', cursor: 'pointer',
                border: `2px solid ${active ? '#7c3aed' : '#e5e7eb'}`,
                background: active ? '#f5f3ff' : '#f9fafb',
                fontFamily: 'inherit', fontWeight: 700, fontSize: '.76rem',
                color: active ? '#7c3aed' : '#6b7280', transition: 'all .12s',
                whiteSpace: 'nowrap',
              }}>{r.icon} {r.label}</button>
            );
          })}
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div style={{
        background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '12px',
        padding: '.85rem 1.1rem', marginBottom: '1.1rem',
        display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-start',
      }}>
        {/* Class */}
        {rpt?.hasCls && (
          <div>
            <div style={{ fontSize: '.72rem', fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', marginBottom: '.35rem' }}>ห้องเรียน</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.28rem' }}>
              {classList.map(c => {
                const active = selClass === c;
                return (
                  <button key={c} type="button" onClick={() => setSelClass(c)} style={{
                    padding: '.25rem .6rem', borderRadius: '7px', cursor: 'pointer',
                    border: `2px solid ${active ? '#7c3aed' : '#e5e7eb'}`,
                    background: active ? '#f5f3ff' : 'white',
                    fontFamily: 'inherit', fontWeight: 700, fontSize: '.78rem',
                    color: active ? '#7c3aed' : '#6b7280',
                  }}>{c}</button>
                );
              })}
            </div>
          </div>
        )}

        {/* Month */}
        {rpt?.hasMo && (
          <div>
            <div style={{ fontSize: '.72rem', fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', marginBottom: '.35rem' }}>เดือน</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.28rem' }}>
              {THAI_MONTHS.map((m, i) => {
                const active = selMonth === i;
                return (
                  <button key={i} type="button" onClick={() => setSelMonth(i)} style={{
                    padding: '.25rem .55rem', borderRadius: '7px', cursor: 'pointer',
                    border: `2px solid ${active ? '#2563eb' : '#e5e7eb'}`,
                    background: active ? '#eff6ff' : 'white',
                    fontFamily: 'inherit', fontWeight: 700, fontSize: '.75rem',
                    color: active ? '#2563eb' : '#6b7280',
                  }}>{m.short}{m.be}</button>
                );
              })}
            </div>
          </div>
        )}

        {/* Week */}
        {rpt?.hasWk && (
          <div>
            <div style={{ fontSize: '.72rem', fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', marginBottom: '.35rem' }}>สัปดาห์ที่</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.28rem' }}>
              {Array.from({ length: 20 }, (_, i) => i + 1).map(w => {
                const active = selWeek === w;
                return (
                  <button key={w} type="button" onClick={() => setSelWeek(w)} style={{
                    padding: '.22rem .5rem', borderRadius: '7px', cursor: 'pointer',
                    border: `2px solid ${active ? '#059669' : '#e5e7eb'}`,
                    background: active ? '#ecfdf5' : 'white',
                    fontFamily: 'inherit', fontWeight: 700, fontSize: '.75rem',
                    color: active ? '#059669' : '#6b7280', minWidth: '30px',
                  }}>{w}</button>
                );
              })}
            </div>
          </div>
        )}

        {/* Student — shown only for สมุดรายงาน */}
        {rpt?.hasStu && classStudents.length > 0 && (
          <div style={{ width: '100%' }}>
            <div style={{ fontSize: '.72rem', fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', marginBottom: '.35rem' }}>
              เลือกนักเรียน
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.28rem' }}>
              {/* ทั้งหมด button */}
              <button type="button" onClick={() => setSelStudent('')} style={{
                padding: '.25rem .7rem', borderRadius: '7px', cursor: 'pointer',
                border: `2px solid ${selStudent === '' ? '#dc2626' : '#e5e7eb'}`,
                background: selStudent === '' ? '#fef2f2' : 'white',
                fontFamily: 'inherit', fontWeight: 700, fontSize: '.76rem',
                color: selStudent === '' ? '#dc2626' : '#6b7280',
              }}>
                📋 ทั้งหมด ({classStudents.length} คน)
              </button>
              {classStudents.map(s => {
                const active = selStudent === String(s.id);
                const shortName = s.name
                  .replace(/^เด็กชาย\s*/,'').replace(/^เด็กหญิง\s*/,'')
                  .replace(/^ด\.ช\.\s*/,'').replace(/^ด\.ญ\.\s*/,'');
                return (
                  <button key={s.id} type="button" onClick={() => setSelStudent(String(s.id))} title={s.name} style={{
                    padding: '.25rem .6rem', borderRadius: '7px', cursor: 'pointer',
                    border: `2px solid ${active ? '#ea580c' : '#e5e7eb'}`,
                    background: active ? '#fff7ed' : 'white',
                    fontFamily: 'inherit', fontWeight: 700, fontSize: '.74rem',
                    color: active ? '#ea580c' : '#6b7280',
                    maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{shortName}</button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Preview info + print button ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
        background: '#faf5ff', border: '1.5px solid #ddd6fe', borderRadius: '12px',
        padding: '.85rem 1.1rem',
      }}>
        <button
          type="button"
          className="btn"
          onClick={handlePreview}
          style={{ padding: '.5rem 1.4rem', fontSize: '.9rem', fontWeight: 800, flexShrink: 0 }}
        >
          👁️ แสดงตัวอย่างก่อนพิมพ์
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handlePrint}
          style={{ padding: '.5rem 1.4rem', fontSize: '.9rem', fontWeight: 800, flexShrink: 0 }}
        >
          🖨️ พิมพ์แบบฟอร์ม
        </button>
        <div style={{ fontSize: '.82rem', color: '#374151' }}>
          <div style={{ fontWeight: 800, marginBottom: '.2rem' }}>
            {rpt?.icon} {rpt?.label}
          </div>
          <div style={{ fontSize: '.75rem', color: '#7c3aed', display: 'flex', gap: '.6rem', flexWrap: 'wrap' }}>
            {rpt?.hasCls && <span>🏫 ห้อง {cn || '—'} · {cnt} คน</span>}
            {rpt?.hasMo  && <span>📅 {THAI_MONTHS[selMonth].full} {THAI_MONTHS[selMonth].be}</span>}
            {rpt?.hasWk  && <span>📆 สัปดาห์ {selWeek} ({weekRange(selWeek)})</span>}
            {rpt?.hasStu && (
              <span>👤 {selStudent
                ? (classStudents.find(s => String(s.id) === selStudent)?.name ?? '—')
                : `ทั้งหมด ${cnt} คน`}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
