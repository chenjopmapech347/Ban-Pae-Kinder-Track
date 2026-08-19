import { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';

// ── คำชี้แจงการประเมินพัฒนาการ ──────────────────────────────────────────────
const KHAM_CHIAENG = [
  {
    no: 1,
    text: 'การประเมินพัฒนาการเด็กปฐมวัย หมายถึง กระบวนการสังเกตพฤติกรรมของเด็กในขณะทำกิจกรรม ทั้งกิจกรรมการเรียนรู้และกิจวัตรประจำวัน แล้วจดบันทึกลงในเครื่องมือที่ครูสร้างขึ้นมาหรือกำหนดขึ้นอย่างต่อเนื่อง เพื่อเปรียบเทียบพฤติกรรมที่เด็กแสดงออกในแต่ละครั้งเป็นข้อมูลในการพัฒนาการจัดกิจกรรมให้เด็กได้รับการพัฒนาอย่างเต็มตามศักยภาพ',
  },
  {
    no: 2,
    bold: 'หลักการประเมินพัฒนาการของเด็ก',
    list: [
      'ประเมินพัฒนาการของเด็กครบทุกด้านและนำผลมาพัฒนาเด็ก',
      'ประเมินเป็นรายบุคคลอย่างสม่ำเสมอต่อเนื่องตลอดปี',
      'สภาพการประเมินควรมีลักษณะเช่นเดียวกับการปฏิบัติกิจวัตรประจำวัน',
      'ประเมินอย่างเป็นระบบ มีการวางแผน เลือกใช้เครื่องมือและจดบันทึกไว้เป็นหลักฐาน',
      'ประเมินตามสภาพจริงด้วยวิธีการที่หลากหลายเหมาะกับเด็ก รวมทั้งใช้แหล่งข้อมูลหลายๆ ด้าน ไม่ควรใช้การทดสอบ',
    ],
  },
  {
    no: 3,
    bold: 'ขั้นตอนการประเมินพัฒนาการ',
    list: [
      'ศึกษาและทำความเข้าใจพัฒนาการของเด็กในแต่ละช่วงอายุทุกด้าน',
      'วางแผนเลือกใช้วิธีการและเครื่องมือที่เหมาะสมสำหรับใช้บันทึกและประเมินพัฒนาการ',
      'ดำเนินการประเมินและบันทึกพัฒนาการในเครื่องมือ และในแบบบันทึกผลการประเมินพัฒนาการ',
      'ประเมินและสรุป การประเมินและสรุปนั้น ต้องดูจากผลการประเมินหลายๆ ครั้ง มิใช่เพียงครั้งเดียว หรือนำผลการประเมินเพียงครั้งเดียวมาสรุป อาจทำให้ผิดพลาดได้ แล้วบันทึกผลการประเมินพัฒนาการลงในสมุดบันทึกพัฒนาการเด็กปฐมวัย (อ.02)',
      'รายงานผล โดยคัดลอกข้อมูลจากสมุดบันทึกพัฒนาการเด็กปฐมวัย (อ.02) ลงในสมุดรายงานประจำตัวเด็กปฐมวัย (อ.01) และรายงานผู้อำนวยการสถานศึกษาและผู้ปกครองต่อไป',
    ],
  },
  {
    no: 5,
    bold: 'ระดับพัฒนาการของการสรุปผลการประเมินพัฒนาการ',
    levels: [
      { label: 'ระดับ 3 = ดี', desc: 'สามารถปฏิบัติได้อย่างถูกต้อง คล่องแคล่ว มั่นคง แม่นยำ/ชัดเจนตามเกณฑ์มาตรฐาน' },
      { label: 'ระดับ 2 = พอใช้', desc: 'สามารถปฏิบัติได้อย่างถูกต้อง แต่บางครั้งไม่คล่องแคล่วหรือไม่มั่นคง หรือไม่ชัดเจน น้ำหนัก: ส่วนสูง : ค่อนข้างสูง หรือ ค่อนข้างน้อยกว่า เกณฑ์มาตรฐาน' },
      { label: 'ระดับ 1 = ปรับปรุง', desc: 'สามารถปฏิบัติได้บ้างแต่ต้องได้รับความช่วยเหลือหรือแนะนำ' },
    ],
  },
  {
    no: 6,
    bold: 'การบันทึกระดับพัฒนาการ',
    text: 'ให้บันทึกเลข 3, 2, 1 ตามที่ครูพิจารณาสรุปผลการประเมินในช่องแต่ละพฤติกรรม ในแต่ละครั้งที่ประเมิน ในแต่ละภาคเรียนที่ทำการประเมิน',
  },
  {
    no: 7,
    bold: 'การสรุปผลการประเมินในแต่ละภาคเรียน',
    text: 'ให้นำผลการประเมินในแต่ละครั้งมารวมกัน แล้วหารด้วยจำนวนครั้งที่ประเมิน ได้ผลการหารเฉลี่ยเท่าใด (ยังไม่ต้องปัดเศษจุดทศนิยม) นำไปกรอกในช่อง สรุป',
    highlight: true,
  },
  {
    no: 8,
    bold: 'การสรุปผลการประเมินแต่ละตัวบ่งชี้',
    text: 'ให้นำผลการประเมินของแต่ละพฤติกรรมในตัวบ่งชี้นั้นมารวมกัน หารด้วยจำนวนพฤติกรรมในตัวบ่งชี้นั้น ได้ผลการหารเฉลี่ยเท่าใด (ยังไม่ต้องปัดเศษจุดทศนิยม / ให้คงจุดทศนิยม 1 ตำแหน่งไว้) นำไปกรอกในช่อง สรุป',
    highlight: true,
  },
  {
    no: 9,
    bold: 'การสรุปผลการประเมินแต่ละมาตรฐาน',
    text: 'ให้นำผลการประเมินของแต่ละตัวบ่งชี้ในมาตรฐานมารวมกัน แล้วหารด้วยจำนวนตัวบ่งชี้ในมาตรฐานนั้น ได้ผลการหารเฉลี่ยเท่าใด ถ้าเป็นจุดทศนิยม 1 ตำแหน่งไป ให้ปัดขึ้น ถ้าต่ำกว่า .5 ให้ปัดทิ้ง นำไปกรอกในช่อง สรุปผลภาคเรียน',
    highlight: true,
  },
  {
    no: 10,
    bold: 'การสรุปผลการประเมินประจำปีการศึกษา',
    text: 'นำผลการประเมินในภาคเรียนที่ 2 ซึ่งเป็นพัฒนาการปัจจุบันของเด็กครั้งสุดท้าย สรุปเป็นการพัฒนาการประจำปี',
    highlight: true,
  },
];

function printKhamChiaeng() {
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700;800&display=swap');
    *{box-sizing:border-box}
    body{font-family:'Sarabun',sans-serif;font-size:13px;margin:0;padding:24px 32px;color:#1e293b;line-height:1.8}
    h1{font-size:16px;font-weight:800;text-align:center;margin:0 0 4px}
    .sub{font-size:12px;text-align:center;color:#555;margin-bottom:20px}
    .item{margin-bottom:14px;display:flex;gap:8px;align-items:flex-start}
    .no{font-weight:800;color:#92400e;min-width:20px;padding-top:1px}
    .content{flex:1}
    .bold{font-weight:800;color:#1e293b}
    .highlight{background:#fef9c3;padding:1px 5px;border-radius:4px;color:#713f12}
    ol{margin:5px 0 0 18px;padding:0}
    li{margin-bottom:3px}
    .level-row{display:flex;gap:10px;align-items:flex-start;margin-bottom:5px}
    .level-badge{font-weight:800;min-width:100px;flex-shrink:0;padding:2px 8px;border-radius:6px;text-align:center;font-size:12px}
    .lv3{background:#d1fae5;color:#065f46}
    .lv2{background:#fef3c7;color:#92400e}
    .lv1{background:#fee2e2;color:#991b1b}
    .formula-box{margin-top:16px;padding:12px 16px;background:#f0fdf4;border-radius:10px;border:1px solid #86efac}
    .formula-title{font-weight:800;color:#166534;margin-bottom:8px;font-size:13px}
    .formula-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:11.5px;color:#14532d}
    .formula-grid div{line-height:1.6}
    @media print{@page{size:A4 portrait;margin:1in} body{padding:0}}
  `;

  const items = KHAM_CHIAENG.map(item => {
    const listHtml = item.list
      ? `<ol>${item.list.map(l => `<li>${l}</li>`).join('')}</ol>` : '';
    const levelsHtml = item.levels
      ? item.levels.map((lv, i) =>
          `<div class="level-row">
            <span class="level-badge ${i===0?'lv3':i===1?'lv2':'lv1'}">${lv.label}</span>
            <span>${lv.desc}</span>
          </div>`).join('') : '';
    const textHtml = item.text
      ? `<span class="${item.highlight?'highlight':''}">${item.text}</span>` : '';
    return `
      <div class="item">
        <span class="no">${item.no}.</span>
        <div class="content">
          ${item.bold ? `<span class="bold">${item.bold} </span>` : ''}
          ${textHtml}${listHtml}${levelsHtml}
        </div>
      </div>`;
  }).join('');

  const formula = `
    <div class="formula-box">
      <div class="formula-title">📐 สรุปสูตรการคำนวณ</div>
      <div class="formula-grid">
        <div><strong>สรุปภาคเรียน (กิจกรรม)</strong><br/>= ครั้งล่าสุดที่ประเมิน (ค2 ถ้ามี, ไม่มีใช้ ค1)</div>
        <div><strong>สรุปตัวบ่งชี้ (ต่อภาคเรียน)</strong><br/>= ค่าเฉลี่ยของ สรุปกิจกรรมทุกรายการ (1 ทศนิยม ไม่ปัด)</div>
        <div><strong>สรุปมาตรฐาน (ต่อภาคเรียน)</strong><br/>= ค่าเฉลี่ยของ สรุปตัวบ่งชี้ ปัดทศนิยม (≥.5 ปัดขึ้น)</div>
        <div><strong>สรุปประจำปี</strong><br/>= ผลภาคเรียน 2 (พัฒนาการปัจจุบัน)</div>
      </div>
    </div>`;

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
    <title>คำชี้แจงการประเมินพัฒนาการเด็กปฐมวัย</title>
    <style>${css}</style></head>
    <body>
      <h1>คำชี้แจงการประเมินพัฒนาการเด็กปฐมวัย</h1>
      <div class="sub">หลักสูตรการศึกษาปฐมวัย พ.ศ. 2560</div>
      ${items}${formula}
    </body></html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank', 'width=900,height=1000');
  if (!win) { URL.revokeObjectURL(url); return; }
  win.addEventListener('load', () => { win.focus(); win.print(); URL.revokeObjectURL(url); });
}

function KhamChiaeng() {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      marginBottom: '1rem', border: '1.5px solid #fbbf24',
      borderRadius: '12px', overflow: 'hidden',
    }}>
      <button type="button" onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '.65rem 1.1rem', background: '#fffbeb', border: 'none', cursor: 'pointer',
          fontFamily: 'inherit', fontWeight: 700, fontSize: '.85rem', color: '#92400e',
        }}>
        <span>📋 คำชี้แจงการประเมินพัฒนาการเด็กปฐมวัย (หลักสูตรปฐมวัย พ.ศ. 2560)</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
          <span
            role="button" tabIndex={0}
            onClick={e => { e.stopPropagation(); printKhamChiaeng(); }}
            onKeyDown={e => e.key === 'Enter' && (e.stopPropagation(), printKhamChiaeng())}
            style={{
              background: '#92400e', color: 'white', borderRadius: '7px',
              padding: '.2rem .65rem', fontSize: '.75rem', fontWeight: 700, cursor: 'pointer',
            }}>
            🖨️ พิมพ์
          </span>
          <span style={{ fontSize: '1rem' }}>{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {open && (
        <div style={{ padding: '1rem 1.25rem', background: 'white', fontSize: '.78rem', lineHeight: 1.7 }}>
          {KHAM_CHIAENG.map(item => (
            <div key={item.no} style={{ marginBottom: '.9rem' }}>
              <div style={{ display: 'flex', gap: '.5rem', alignItems: 'flex-start' }}>
                <span style={{ fontWeight: 800, color: '#92400e', minWidth: '1.4rem' }}>{item.no}.</span>
                <div style={{ flex: 1 }}>
                  {item.bold && (
                    <span style={{ fontWeight: 800, color: '#1e293b' }}>{item.bold} </span>
                  )}
                  {item.text && (
                    <span style={{
                      background: item.highlight ? '#fef9c3' : 'transparent',
                      padding: item.highlight ? '1px 4px' : 0,
                      borderRadius: '4px',
                      color: item.highlight ? '#713f12' : 'inherit',
                    }}>
                      {item.text}
                    </span>
                  )}
                  {item.list && (
                    <ol style={{ margin: '.3rem 0 0 1rem', paddingLeft: '.5rem' }}>
                      {item.list.map((l, i) => (
                        <li key={i} style={{ marginBottom: '.2rem' }}>{l}</li>
                      ))}
                    </ol>
                  )}
                  {item.levels && (
                    <div style={{ marginTop: '.4rem', display: 'flex', flexDirection: 'column', gap: '.3rem' }}>
                      {item.levels.map((lv, i) => (
                        <div key={i} style={{ display: 'flex', gap: '.6rem', alignItems: 'flex-start' }}>
                          <span style={{
                            fontWeight: 800, minWidth: '110px', flexShrink: 0,
                            color: i === 0 ? '#065f46' : i === 1 ? '#92400e' : '#991b1b',
                            background: i === 0 ? '#d1fae5' : i === 1 ? '#fef3c7' : '#fee2e2',
                            padding: '1px 8px', borderRadius: '6px', textAlign: 'center',
                          }}>
                            {lv.label}
                          </span>
                          <span style={{ color: '#374151' }}>{lv.desc}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* สูตรสรุป quick-reference */}
          <div style={{
            marginTop: '.5rem', padding: '.75rem 1rem',
            background: '#f0fdf4', borderRadius: '10px', border: '1px solid #86efac',
          }}>
            <div style={{ fontWeight: 800, color: '#166534', marginBottom: '.4rem', fontSize: '.8rem' }}>
              📐 สรุปสูตรการคำนวณ
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.4rem', fontSize: '.75rem', color: '#14532d' }}>
              <div><strong>สรุปภาคเรียน (กิจกรรม)</strong><br/>= ครั้งล่าสุดที่ประเมิน (ค2 ถ้ามี, ไม่มีใช้ ค1)</div>
              <div><strong>สรุปตัวบ่งชี้ (ต่อภาคเรียน)</strong><br/>= ค่าเฉลี่ยของ สรุปกิจกรรมทุกรายการ (1 ทศนิยม ไม่ปัด)</div>
              <div><strong>สรุปมาตรฐาน (ต่อภาคเรียน)</strong><br/>= ค่าเฉลี่ยของ สรุปตัวบ่งชี้ ปัดทศนิยม (≥.5 ปัดขึ้น)</div>
              <div><strong>สรุปประจำปี</strong><br/>= ผลภาคเรียน 2 (พัฒนาการปัจจุบัน)</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── มาตรฐาน 1-12 (หลักสูตรปฐมวัย พ.ศ. 2560) ─────────────────────────────────
const STANDARD_DEFS = [
  { id: 'std-1',  no: 1,  domain: 'physical',     title: 'มาตรฐานที่ 1 ร่างกายเจริญเติบโตตามวัยและมีสุขนิสัยที่ดี' },
  { id: 'std-2',  no: 2,  domain: 'physical',     title: 'มาตรฐานที่ 2 กล้ามเนื้อใหญ่และกล้ามเนื้อเล็กแข็งแรง' },
  { id: 'std-3',  no: 3,  domain: 'emotional',    title: 'มาตรฐานที่ 3 มีสุขภาพจิตดีและมีความสุข' },
  { id: 'std-4',  no: 4,  domain: 'emotional',    title: 'มาตรฐานที่ 4 ชื่นชมและแสดงออกทางศิลปะ ดนตรี และการเคลื่อนไหว' },
  { id: 'std-5',  no: 5,  domain: 'emotional',    title: 'มาตรฐานที่ 5 มีคุณธรรม จริยธรรม และมีจิตใจที่ดีงาม' },
  { id: 'std-6',  no: 6,  domain: 'social',       title: 'มาตรฐานที่ 6 มีทักษะชีวิตและปฏิบัติตามหลักปรัชญาของเศรษฐกิจพอเพียง' },
  { id: 'std-7',  no: 7,  domain: 'social',       title: 'มาตรฐานที่ 7 รักธรรมชาติ สิ่งแวดล้อม วัฒนธรรม และความเป็นไทย' },
  { id: 'std-8',  no: 8,  domain: 'social',       title: 'มาตรฐานที่ 8 อยู่ร่วมกับผู้อื่นได้อย่างมีความสุข' },
  { id: 'std-9',  no: 9,  domain: 'intellectual', title: 'มาตรฐานที่ 9 ใช้ภาษาสื่อสารได้เหมาะสมกับวัย' },
  { id: 'std-10', no: 10, domain: 'intellectual', title: 'มาตรฐานที่ 10 มีความสามารถในการคิดที่เป็นพื้นฐานในการเรียนรู้' },
  { id: 'std-11', no: 11, domain: 'intellectual', title: 'มาตรฐานที่ 11 มีจินตนาการและความคิดสร้างสรรค์' },
  { id: 'std-12', no: 12, domain: 'intellectual', title: 'มาตรฐานที่ 12 มีเจตคติที่ดีต่อการเรียนรู้ และมีความสามารถในการแสวงหาความรู้' },
];

const DOMAIN_DEFS = [
  { id: 'physical',     label: 'ด้านร่างกาย',       emoji: '🏃', color: '#059669', bg: '#ecfdf5', border: '#6ee7b7', stds: [1,2] },
  { id: 'emotional',    label: 'ด้านอารมณ์-จิตใจ',  emoji: '❤️', color: '#e11d48', bg: '#fff1f2', border: '#fda4af', stds: [3,4,5] },
  { id: 'social',       label: 'ด้านสังคม',          emoji: '🤝', color: '#7c3aed', bg: '#f5f3ff', border: '#c4b5fd', stds: [6,7,8] },
  { id: 'intellectual', label: 'ด้านสติปัญญา',       emoji: '🧠', color: '#0891b2', bg: '#f0f9ff', border: '#7dd3fc', stds: [9,10,11,12] },
];

const LEVEL_AGE = { K1: '3-4 ปี', K2: '4-5 ปี', K3: '5-6 ปี' };

// ── Score helpers ─────────────────────────────────────────────────────────────
// r1=ภาค1ครั้ง1  r2=ภาค1ครั้ง2  r3=ภาค2ครั้ง1  r4=ภาค2ครั้ง2
function getR(student, activity, round) {
  return student?.assessments?.indicators?.[activity.indicatorId]?.[activity.id]?.[`r${round}`] ?? 0;
}
function actT1(student, act) { const r2 = getR(student, act, 2); return r2 > 0 ? r2 : getR(student, act, 1); }
function actT2(student, act) { const r4 = getR(student, act, 4); return r4 > 0 ? r4 : getR(student, act, 3); }
function avg(arr) {
  const v = arr.filter(x => x > 0);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
}
function fmt1(v) { return v > 0 ? v.toFixed(1) : '—'; }
function fmtI(v) { return v > 0 ? String(Math.round(v)) : '—'; }
function fmtR(v) { return v > 0 ? String(v) : '—'; }

// ── ScoreCell ─────────────────────────────────────────────────────────────────
const SCORE_STYLE = {
  0: { bg: '#f9fafb', color: '#d1d5db' },
  1: { bg: '#fee2e2', color: '#991b1b' },
  2: { bg: '#fef3c7', color: '#92400e' },
  3: { bg: '#d1fae5', color: '#065f46' },
};
function ScoreCell({ v, frac = false, avg: isAvg = false }) {
  const rounded = v > 0 ? Math.round(v) : 0;
  const { bg, color } = SCORE_STYLE[Math.min(rounded, 3)] ?? SCORE_STYLE[0];
  return (
    <td style={{
      textAlign: 'center', border: '1px solid #e5e7eb',
      background: isAvg ? (v > 0 ? '#eff6ff' : '#f9fafb') : bg,
      color: isAvg ? (v > 0 ? '#1e40af' : '#d1d5db') : (v > 0 ? color : '#d1d5db'),
      fontWeight: isAvg ? 800 : 600, fontSize: '.73rem', padding: '3px 4px', minWidth: '30px',
    }}>
      {v > 0 ? (frac ? fmt1(v) : fmtI(v)) : '—'}
    </td>
  );
}

// ── IndicatorTable — ตารางหนึ่งตัวบ่งชี้ ─────────────────────────────────────
function IndicatorTable({ students, indActivities }) {
  const rows = useMemo(() => students.map(s => {
    const actData = indActivities.map(a => ({
      r1: getR(s, a, 1), r2: getR(s, a, 2), t1s: actT1(s, a),
      r3: getR(s, a, 3), r4: getR(s, a, 4), t2s: actT2(s, a),
    }));
    const t1 = avg(actData.map(a => a.t1s));
    const t2 = avg(actData.map(a => a.t2s));
    return { s, actData, t1, t2 };
  }), [students, indActivities]);

  // class averages
  const colAvg = useMemo(() => {
    const n = rows.length;
    if (!n) return null;
    const actAvgs = indActivities.map((_, ai) => ({
      r1: avg(rows.map(r => r.actData[ai].r1)),
      r2: avg(rows.map(r => r.actData[ai].r2)),
      t1s: avg(rows.map(r => r.actData[ai].t1s)),
      r3: avg(rows.map(r => r.actData[ai].r3)),
      r4: avg(rows.map(r => r.actData[ai].r4)),
      t2s: avg(rows.map(r => r.actData[ai].t2s)),
    }));
    return { actAvgs, t1: avg(rows.map(r => r.t1)), t2: avg(rows.map(r => r.t2)) };
  }, [rows, indActivities]);

  const th = (txt, extra = {}) => (
    <th style={{ border: '1px solid #d1d5db', padding: '3px 5px', background: '#f3f4f6', fontWeight: 700, fontSize: '.68rem', ...extra }}>{txt}</th>
  );
  const thBlue = (txt, extra = {}) => th(txt, { background: '#dbeafe', color: '#1e40af', ...extra });

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          {/* Row 1: กิจกรรม headers + สรุปตัวบ่งชี้ */}
          <tr>
            <th rowSpan={3} style={{ border: '1px solid #d1d5db', padding: '3px 6px', background: '#f9fafb', fontSize: '.68rem', minWidth: '34px' }}>ลำดับ</th>
            <th rowSpan={3} style={{ border: '1px solid #d1d5db', padding: '3px 8px', background: '#f9fafb', fontSize: '.68rem', minWidth: '130px', textAlign: 'center' }}>ชื่อ-สกุล</th>
            {indActivities.map((a, i) => (
              <th key={a.id} colSpan={6}
                style={{ border: '1px solid #d1d5db', padding: '3px', background: '#eff6ff', color: '#1e40af', fontWeight: 700, fontSize: '.68rem' }}>
                กิจกรรมที่ {i + 1}
              </th>
            ))}
            <th colSpan={2} rowSpan={2}
              style={{ border: '1px solid #d1d5db', padding: '3px', background: '#bfdbfe', color: '#1e40af', fontWeight: 800, fontSize: '.7rem' }}>
              สรุปตัวบ่งชี้
            </th>
            <th rowSpan={3} style={{ border: '1px solid #d1d5db', padding: '3px', background: '#f9fafb', fontSize: '.68rem', minWidth: '50px' }}>หมายเหตุ</th>
          </tr>
          {/* Row 2: ภาคเรียน 1/2 per activity */}
          <tr>
            {indActivities.map(a => (
              <>
                <th key={`${a.id}-t1h`} colSpan={3}
                  style={{ border: '1px solid #d1d5db', padding: '2px', background: '#e0f2fe', color: '#0369a1', fontSize: '.65rem', fontWeight: 700 }}>
                  ภาคเรียนที่ 1
                </th>
                <th key={`${a.id}-t2h`} colSpan={3}
                  style={{ border: '1px solid #d1d5db', padding: '2px', background: '#fce7f3', color: '#9d174d', fontSize: '.65rem', fontWeight: 700 }}>
                  ภาคเรียนที่ 2
                </th>
              </>
            ))}
          </tr>
          {/* Row 3: ครั้ง 1, 2, สรุป per term per activity */}
          <tr>
            {indActivities.map(a => (
              <>
                {[['ค1','#e0f2fe','#0369a1'],['ค2','#e0f2fe','#0369a1'],['สรุป','#bae6fd','#0c4a6e']].map(([lbl, bg, color]) => (
                  <th key={`${a.id}-t1-${lbl}`} style={{ border: '1px solid #d1d5db', padding: '2px 3px', background: bg, color, fontSize: '.63rem', fontWeight: 700, minWidth: '28px' }}>{lbl}</th>
                ))}
                {[['ค1','#fce7f3','#9d174d'],['ค2','#fce7f3','#9d174d'],['สรุป','#fbcfe8','#831843']].map(([lbl, bg, color]) => (
                  <th key={`${a.id}-t2-${lbl}`} style={{ border: '1px solid #d1d5db', padding: '2px 3px', background: bg, color, fontSize: '.63rem', fontWeight: 700, minWidth: '28px' }}>{lbl}</th>
                ))}
              </>
            ))}
            {thBlue('ภาค1', { fontSize: '.65rem' })}
            {thBlue('ภาค2', { fontSize: '.65rem' })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={row.s.id} style={{ background: idx % 2 === 0 ? 'white' : '#fafafa' }}>
              <td style={{ textAlign: 'center', border: '1px solid #e5e7eb', fontSize: '.72rem', padding: '3px' }}>{idx + 1}</td>
              <td style={{ border: '1px solid #e5e7eb', fontSize: '.72rem', padding: '3px 6px', whiteSpace: 'nowrap' }}>{row.s.name}</td>
              {row.actData.map((a, ai) => (
                <>
                  <ScoreCell key={`${ai}-r1`} v={a.r1} />
                  <ScoreCell key={`${ai}-r2`} v={a.r2} />
                  <ScoreCell key={`${ai}-t1s`} v={a.t1s} />
                  <ScoreCell key={`${ai}-r3`} v={a.r3} />
                  <ScoreCell key={`${ai}-r4`} v={a.r4} />
                  <ScoreCell key={`${ai}-t2s`} v={a.t2s} />
                </>
              ))}
              <ScoreCell v={row.t1} frac avg />
              <ScoreCell v={row.t2} frac avg />
              <td style={{ border: '1px solid #e5e7eb', minWidth: '50px' }} />
            </tr>
          ))}
        </tbody>
        {/* Average footer */}
        {colAvg && (
          <tfoot>
            <tr style={{ background: '#f1f5f9' }}>
              <td colSpan={2} style={{ border: '1px solid #d1d5db', textAlign: 'center', fontSize: '.7rem', fontWeight: 800, color: '#475569', padding: '3px 6px' }}>
                ค่าเฉลี่ยชั้น
              </td>
              {colAvg.actAvgs.map((a, ai) => (
                <>
                  <ScoreCell key={`avg-${ai}-r1`} v={a.r1} frac />
                  <ScoreCell key={`avg-${ai}-r2`} v={a.r2} frac />
                  <ScoreCell key={`avg-${ai}-t1s`} v={a.t1s} frac />
                  <ScoreCell key={`avg-${ai}-r3`} v={a.r3} frac />
                  <ScoreCell key={`avg-${ai}-r4`} v={a.r4} frac />
                  <ScoreCell key={`avg-${ai}-t2s`} v={a.t2s} frac />
                </>
              ))}
              <ScoreCell v={colAvg.t1} frac avg />
              <ScoreCell v={colAvg.t2} frac avg />
              <td style={{ border: '1px solid #d1d5db' }} />
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}

// ── Standard Summary mini-table ───────────────────────────────────────────────
function StandardSummary({ students, indicators, activities, stdDef, domDef }) {
  const stdInds = useMemo(() => indicators.filter(i => i.standardId === stdDef.id), [indicators, stdDef]);
  const rows = useMemo(() => {
    return stdInds.map(ind => {
      const acts = activities.filter(a => a.indicatorId === ind.id);
      const t1 = avg(students.map(s => avg(acts.map(a => actT1(s, a)))).filter(v => v > 0));
      const t2 = avg(students.map(s => avg(acts.map(a => actT2(s, a)))).filter(v => v > 0));
      return { ind, t1, t2 };
    });
  }, [stdInds, students, activities]);
  const stdT1 = avg(rows.map(r => r.t1).filter(v => v > 0));
  const stdT2 = avg(rows.map(r => r.t2).filter(v => v > 0));

  return (
    <div style={{
      marginTop: '1.25rem', padding: '1rem 1.25rem',
      background: domDef.bg, border: `1.5px solid ${domDef.border}`,
      borderRadius: '12px',
    }}>
      <div style={{ fontSize: '.78rem', fontWeight: 800, color: domDef.color, marginBottom: '.6rem' }}>
        สรุปผลการประเมิน {stdDef.title}
      </div>
      <table style={{ borderCollapse: 'collapse', fontSize: '.75rem' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #d1d5db', padding: '4px 10px', background: 'white', textAlign: 'center', fontSize: '.7rem' }}>ตัวบ่งชี้</th>
            <th style={{ border: '1px solid #d1d5db', padding: '4px 14px', background: '#e0f2fe', color: '#0369a1', fontSize: '.7rem' }}>ภาคเรียน 1</th>
            <th style={{ border: '1px solid #d1d5db', padding: '4px 14px', background: '#fce7f3', color: '#9d174d', fontSize: '.7rem' }}>ภาคเรียน 2</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.ind.id}>
              <td style={{ border: '1px solid #d1d5db', padding: '3px 10px', background: 'white', fontSize: '.7rem' }}>
                {r.ind.label.replace(/^ตัวบ่งชี้ที่\s*/u, 'ตัวบ่งชี้ที่ ')}
              </td>
              <td style={{ border: '1px solid #d1d5db', textAlign: 'center', background: r.t1 > 0 ? '#bae6fd' : '#f9fafb', color: r.t1 > 0 ? '#0c4a6e' : '#d1d5db', fontWeight: 800 }}>
                {fmt1(r.t1)}
              </td>
              <td style={{ border: '1px solid #d1d5db', textAlign: 'center', background: r.t2 > 0 ? '#fbcfe8' : '#f9fafb', color: r.t2 > 0 ? '#831843' : '#d1d5db', fontWeight: 800 }}>
                {fmt1(r.t2)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td style={{ border: '1px solid #d1d5db', padding: '4px 10px', background: domDef.bg, fontWeight: 800, color: domDef.color, fontSize: '.72rem' }}>สรุปมาตรฐาน</td>
            <td style={{ border: '1px solid #d1d5db', textAlign: 'center', background: stdT1 > 0 ? '#0369a1' : '#e0f2fe', color: stdT1 > 0 ? 'white' : '#d1d5db', fontWeight: 800, fontSize: '.78rem' }}>
              {fmt1(stdT1)}
            </td>
            <td style={{ border: '1px solid #d1d5db', textAlign: 'center', background: stdT2 > 0 ? '#9d174d' : '#fce7f3', color: stdT2 > 0 ? 'white' : '#d1d5db', fontWeight: 800, fontSize: '.78rem' }}>
              {fmt1(stdT2)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

// ── Summary View (สรุปทุกมาตรฐาน) ────────────────────────────────────────────
function SummaryView({ students, indicators, activities, className, schoolName, academicYear }) {
  const data = useMemo(() => students.map(s => {
    const stds = {};
    STANDARD_DEFS.forEach(sd => {
      const inds = indicators.filter(i => i.standardId === sd.id);
      const t1 = avg(inds.map(ind => { const acts = activities.filter(a => a.indicatorId === ind.id); return avg(acts.map(a => actT1(s, a))); }).filter(v => v > 0));
      const t2 = avg(inds.map(ind => { const acts = activities.filter(a => a.indicatorId === ind.id); return avg(acts.map(a => actT2(s, a))); }).filter(v => v > 0));
      stds[sd.id] = { t1, t2 };
    });
    const domains = {};
    DOMAIN_DEFS.forEach(dom => {
      const t1 = avg(dom.stds.map(n => stds[`std-${n}`]?.t1 ?? 0).filter(v => v > 0));
      const t2 = avg(dom.stds.map(n => stds[`std-${n}`]?.t2 ?? 0).filter(v => v > 0));
      domains[dom.id] = { t1, t2 };
    });
    return { s, stds, domains };
  }), [students, indicators, activities]);

  function printSummary() {
    const ageRange = students[0] ? LEVEL_AGE[students[0].level] ?? '' : '';
    const rows = data.map((d, idx) => {
      const stdCells = STANDARD_DEFS.map(sd => `<td class="sc">${fmtI(d.stds[sd.id].t1)}</td><td class="sc">${fmtI(d.stds[sd.id].t2)}</td>`).join('');
      const domCells = DOMAIN_DEFS.map(dom => `<td class="sc">${fmtI(d.domains[dom.id].t1)}</td><td class="sc">${fmtI(d.domains[dom.id].t2)}</td>`).join('');
      return `<tr><td class="sc">${idx + 1}</td><td class="nm">${d.s.name}</td>${stdCells}${domCells}<td class="nt"></td></tr>`;
    }).join('');
    const win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>สรุปผลการประเมินพัฒนาการ</title>
<style>
  @page{size:A4 landscape;margin:1in}
  body{font-family:'TH Sarabun New',Sarabun,sans-serif;font-size:10pt}
  h3{text-align:center;margin:3px 0}
  table{border-collapse:collapse;width:100%}
  td,th{border:1px solid #333;padding:2px 3px;text-align:center}
  .nm{text-align:left;min-width:110px}
  .sc{min-width:22px}
  .hd{background:#f3f4f6;font-weight:bold}
  .nt{min-width:50px}
</style></head><body>
${schoolLogo ? `<div style="text-align:center;margin-bottom:4px"><img src="${schoolLogo}" style="height:70px;object-fit:contain"/></div>` : ''}
<h3>สรุปผลการประเมินพัฒนาการ เด็กปฐมวัย อายุ ${ageRange}</h3>
<h3>ห้อง ${className} &nbsp; โรงเรียน${schoolName} &nbsp; ปีการศึกษา ${academicYear}</h3><br/>
<table>
<tr>
  <th rowspan="2" class="hd">เลขที่</th>
  <th rowspan="2" class="hd">ชื่อ-สกุล</th>
  ${DOMAIN_DEFS.map(d=>`<th colspan="${d.stds.length*2+2}" class="hd">${d.label}</th>`).join('')}
  <th rowspan="2" class="hd">หมายเหตุ</th>
</tr>
<tr>
  ${DOMAIN_DEFS.map(dom=>[
    ...dom.stds.map(n=>`<th colspan="2" class="hd">มาตรฐาน ${n}<br/><small>ภาค1 / ภาค2</small></th>`),
    `<th colspan="2" class="hd">สรุป${dom.label}<br/><small>ภาค1 / ภาค2</small></th>`
  ].join('')).join('')}
</tr>
${rows}
</table></body></html>`);
    win.document.close(); win.print();
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '.6rem' }}>
        <button className="btn btn-secondary" onClick={printSummary} style={{ fontSize: '.8rem' }}>🖨️ พิมพ์สรุปผล</button>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: '.70rem', width: '100%' }}>
          <thead>
            <tr>
              <th rowSpan={3} style={hdCell({ minWidth: '34px' })}>เลขที่</th>
              <th rowSpan={3} style={hdCell({ minWidth: '130px', textAlign: 'center' })}>ชื่อ-สกุล</th>
              {DOMAIN_DEFS.map(dom => (
                <th key={dom.id} colSpan={dom.stds.length * 2 + 2}
                  style={hdCell({ background: dom.bg, color: dom.color, fontWeight: 800, fontSize: '.72rem' })}>
                  {dom.emoji} {dom.label}
                </th>
              ))}
              <th rowSpan={3} style={hdCell({ minWidth: '50px' })}>หมายเหตุ</th>
            </tr>
            <tr>
              {DOMAIN_DEFS.map(dom => (
                <>
                  {dom.stds.map(n => (
                    <th key={n} colSpan={2} style={hdCell({ background: '#f1f5f9', fontSize: '.65rem' })}>มาตรฐาน {n}</th>
                  ))}
                  <th colSpan={2} style={hdCell({ background: dom.bg, color: dom.color, fontSize: '.65rem', fontWeight: 800 })}>สรุปด้าน</th>
                </>
              ))}
            </tr>
            <tr>
              {DOMAIN_DEFS.map(dom => (
                <>
                  {dom.stds.map(n => (
                    <>
                      <th key={`${n}t1`} style={hdCell({ background: '#e0f2fe', color: '#0369a1', fontSize: '.62rem' })}>ภาค1</th>
                      <th key={`${n}t2`} style={hdCell({ background: '#fce7f3', color: '#9d174d', fontSize: '.62rem' })}>ภาค2</th>
                    </>
                  ))}
                  <th style={hdCell({ background: dom.bg, color: dom.color, fontSize: '.62rem' })}>ภาค1</th>
                  <th style={hdCell({ background: dom.bg, color: dom.color, fontSize: '.62rem' })}>ภาค2</th>
                </>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((d, idx) => (
              <tr key={d.s.id} style={{ background: idx % 2 === 0 ? 'white' : '#fafafa' }}>
                <td style={{ textAlign: 'center', border: '1px solid #e5e7eb', padding: '3px' }}>{idx + 1}</td>
                <td style={{ border: '1px solid #e5e7eb', padding: '3px 6px', whiteSpace: 'nowrap' }}>{d.s.name}</td>
                {DOMAIN_DEFS.map(dom => (
                  <>
                    {dom.stds.map(n => (
                      <>
                        <ScoreCell key={`${n}t1`} v={d.stds[`std-${n}`].t1} />
                        <ScoreCell key={`${n}t2`} v={d.stds[`std-${n}`].t2} />
                      </>
                    ))}
                    <ScoreCell v={d.domains[dom.id].t1} avg />
                    <ScoreCell v={d.domains[dom.id].t2} avg />
                  </>
                ))}
                <td style={{ border: '1px solid #e5e7eb', minWidth: '50px' }} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function hdCell(extra = {}) {
  return { border: '1px solid #d1d5db', padding: '3px 5px', background: '#f9fafb', fontWeight: 700, ...extra };
}

// ── Detail View — ทีละตัวบ่งชี้ ──────────────────────────────────────────────
function DetailView({ students, indicators, activities, className, schoolName, academicYear }) {
  const [selDomain, setSelDomain] = useState('physical');
  const [selStdId, setSelStdId]   = useState('std-1');
  const [selIndIdx, setSelIndIdx] = useState(0);

  const domDef  = DOMAIN_DEFS.find(d => d.id === selDomain);
  const stdDef  = STANDARD_DEFS.find(s => s.id === selStdId);
  const stdInds = useMemo(() => indicators.filter(i => i.standardId === selStdId), [indicators, selStdId]);
  const curInd  = stdInds[selIndIdx] ?? null;
  const curActs = useMemo(() => curInd ? activities.filter(a => a.indicatorId === curInd.id) : [], [activities, curInd]);

  function handleDomainChange(domId) {
    setSelDomain(domId);
    const domDef2 = DOMAIN_DEFS.find(d => d.id === domId);
    const firstStd = `std-${domDef2.stds[0]}`;
    setSelStdId(firstStd);
    setSelIndIdx(0);
  }
  function handleStdChange(stdId) { setSelStdId(stdId); setSelIndIdx(0); }

  function printStandard() {
    if (!stdDef || !domDef) return;
    const ageRange = students[0] ? LEVEL_AGE[students[0].level] ?? '' : '';
    const win = window.open('', '_blank');

    const allRows = (() => {
      const studentRows = students.map((s, idx) => {
        let cells = '';
        stdInds.forEach(ind => {
          const acts = activities.filter(a => a.indicatorId === ind.id);
          const actData = acts.map(a => ({
            r1: getR(s, a, 1), r2: getR(s, a, 2), t1s: actT1(s, a),
            r3: getR(s, a, 3), r4: getR(s, a, 4), t2s: actT2(s, a),
          }));
          actData.forEach(a => {
            cells += `<td class="sc">${fmtR(a.r1)}</td><td class="sc">${fmtR(a.r2)}</td><td class="sc">${fmtI(a.t1s)}</td>`;
            cells += `<td class="sc">${fmtR(a.r3)}</td><td class="sc">${fmtR(a.r4)}</td><td class="sc">${fmtI(a.t2s)}</td>`;
          });
          const t1 = avg(actData.map(a => a.t1s));
          const t2 = avg(actData.map(a => a.t2s));
          cells += `<td class="sc">${fmt1(t1)}</td><td class="sc">${fmt1(t2)}</td>`;
        });
        const allT1 = avg(stdInds.map(ind => { const acts = activities.filter(a => a.indicatorId === ind.id); return avg(acts.map(a => actT1(s, a))); }).filter(v => v > 0));
        const allT2 = avg(stdInds.map(ind => { const acts = activities.filter(a => a.indicatorId === ind.id); return avg(acts.map(a => actT2(s, a))); }).filter(v => v > 0));
        cells += `<td class="sc">${fmt1(allT1)}</td><td class="sc">${fmt1(allT2)}</td>`;
        return `<tr><td class="sc">${idx + 1}</td><td class="nm">${s.name}</td>${cells}<td class="nt"></td></tr>`;
      });
      return studentRows.join('');
    })();

    // Build headers
    let hdr1 = ''; let hdr2 = ''; let hdr3 = '';
    stdInds.forEach(ind => {
      const acts = activities.filter(a => a.indicatorId === ind.id);
      const cols = acts.length * 6 + 2;
      hdr1 += `<th colspan="${cols}" class="hd">${ind.label}</th>`;
      acts.forEach((_, i) => { hdr2 += `<th colspan="3" class="hd2">ภาคเรียน 1<br/>กิจกรรมที่ ${i+1}</th><th colspan="3" class="hd3">ภาคเรียน 2<br/>กิจกรรมที่ ${i+1}</th>`; });
      hdr2 += `<th colspan="2" class="hd">สรุปตัวบ่งชี้</th>`;
      acts.forEach(() => { hdr3 += `<th>ค1</th><th>ค2</th><th>สรุป</th><th>ค1</th><th>ค2</th><th>สรุป</th>`; });
      hdr3 += `<th>ภาค1</th><th>ภาค2</th>`;
    });

    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>${stdDef.title}</title>
<style>
  @page{size:A4 landscape;margin:1in}
  body{font-family:'TH Sarabun New',Sarabun,sans-serif;font-size:9pt}
  h3{text-align:center;margin:3px 0}
  table{border-collapse:collapse;width:100%}
  td,th{border:1px solid #555;padding:1px 3px;text-align:center;font-size:8pt}
  .nm{text-align:left;min-width:100px}
  .sc{min-width:18px}
  .nt{min-width:40px}
  .hd{background:#dbeafe;font-weight:bold}
  .hd2{background:#e0f2fe}
  .hd3{background:#fce7f3}
</style></head><body>
${schoolLogo ? `<div style="text-align:center;margin-bottom:4px"><img src="${schoolLogo}" style="height:70px;object-fit:contain"/></div>` : ''}
<h3>${stdDef.title}</h3>
<h3>ห้อง ${className} &nbsp; อายุ ${ageRange} &nbsp; โรงเรียน${schoolName} &nbsp; ปีการศึกษา ${academicYear}</h3><br/>
<table>
<tr><th rowspan="3" class="hd">เลขที่</th><th rowspan="3" class="hd">ชื่อ-สกุล</th>${hdr1}<th colspan="2" rowspan="2" class="hd">สรุปมาตรฐาน</th><th rowspan="3" class="hd">หมายเหตุ</th></tr>
<tr>${hdr2}</tr>
<tr>${hdr3}<th>ภาค1</th><th>ภาค2</th></tr>
${allRows}
</table></body></html>`);
    win.document.close(); win.print();
  }

  return (
    <div>
      {/* Domain tabs */}
      <div style={{ display: 'flex', gap: '.35rem', flexWrap: 'wrap', marginBottom: '.75rem' }}>
        {DOMAIN_DEFS.map(dom => (
          <button key={dom.id} type="button" onClick={() => handleDomainChange(dom.id)}
            style={{
              padding: '.35rem .9rem', borderRadius: '10px', fontFamily: 'inherit', cursor: 'pointer',
              fontSize: '.82rem', fontWeight: selDomain === dom.id ? 800 : 500,
              background: selDomain === dom.id ? dom.color : 'white',
              color: selDomain === dom.id ? 'white' : '#4b5563',
              border: `2px solid ${selDomain === dom.id ? dom.color : '#e5e7eb'}`,
            }}>
            {dom.emoji} {dom.label}
          </button>
        ))}
      </div>

      {/* Standard tabs within domain */}
      {domDef && (
        <div style={{ display: 'flex', gap: '.35rem', flexWrap: 'wrap', marginBottom: '1rem', paddingLeft: '.5rem', borderLeft: `3px solid ${domDef.color}` }}>
          {domDef.stds.map(n => {
            const sd = STANDARD_DEFS.find(s => s.no === n);
            const active = selStdId === sd.id;
            return (
              <button key={sd.id} type="button" onClick={() => handleStdChange(sd.id)}
                style={{
                  padding: '.28rem .75rem', borderRadius: '8px', fontFamily: 'inherit', cursor: 'pointer',
                  fontSize: '.78rem', fontWeight: active ? 700 : 500,
                  background: active ? domDef.bg : 'white',
                  color: active ? domDef.color : '#6b7280',
                  border: `1.5px solid ${active ? domDef.color : '#e5e7eb'}`,
                }}>
                มาตรฐาน {n}
              </button>
            );
          })}
        </div>
      )}

      {/* Standard title + print button */}
      {stdDef && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '.8rem', fontWeight: 800, color: domDef?.color }}>{stdDef.title}</div>
            <div style={{ fontSize: '.7rem', color: '#6b7280', marginTop: '.15rem' }}>{stdInds.length} ตัวบ่งชี้</div>
          </div>
          <button className="btn btn-secondary" onClick={printStandard} style={{ fontSize: '.8rem', flexShrink: 0 }}>
            🖨️ พิมพ์มาตรฐานนี้
          </button>
        </div>
      )}

      {/* Indicator navigator */}
      {stdInds.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '.5rem',
          background: '#f8fafc', borderRadius: '10px', padding: '.5rem .75rem',
          border: '1px solid #e2e8f0', marginBottom: '1rem', flexWrap: 'wrap',
        }}>
          <button type="button" onClick={() => setSelIndIdx(i => Math.max(0, i - 1))}
            disabled={selIndIdx === 0}
            style={{ padding: '.3rem .7rem', borderRadius: '7px', border: '1px solid #e5e7eb', background: 'white', cursor: selIndIdx === 0 ? 'not-allowed' : 'pointer', opacity: selIndIdx === 0 ? .4 : 1 }}>
            ◀ ก่อนหน้า
          </button>

          <div style={{ display: 'flex', gap: '.3rem', flexWrap: 'wrap', flex: 1, justifyContent: 'center' }}>
            {stdInds.map((ind, i) => (
              <button key={ind.id} type="button" onClick={() => setSelIndIdx(i)}
                style={{
                  padding: '.25rem .6rem', borderRadius: '7px', fontFamily: 'inherit', cursor: 'pointer',
                  fontSize: '.75rem', fontWeight: i === selIndIdx ? 800 : 500,
                  background: i === selIndIdx ? (domDef?.color ?? '#7c3aed') : 'white',
                  color: i === selIndIdx ? 'white' : '#6b7280',
                  border: `1.5px solid ${i === selIndIdx ? (domDef?.color ?? '#7c3aed') : '#e5e7eb'}`,
                }}>
                ตัวบ่งชี้ {ind.indicatorCode}
              </button>
            ))}
          </div>

          <button type="button" onClick={() => setSelIndIdx(i => Math.min(stdInds.length - 1, i + 1))}
            disabled={selIndIdx === stdInds.length - 1}
            style={{ padding: '.3rem .7rem', borderRadius: '7px', border: '1px solid #e5e7eb', background: 'white', cursor: selIndIdx === stdInds.length - 1 ? 'not-allowed' : 'pointer', opacity: selIndIdx === stdInds.length - 1 ? .4 : 1 }}>
            ถัดไป ▶
          </button>
        </div>
      )}

      {/* Current indicator info */}
      {curInd && (
        <div style={{
          padding: '.6rem 1rem', background: domDef?.bg ?? '#f5f3ff',
          border: `1.5px solid ${domDef?.border ?? '#c4b5fd'}`,
          borderRadius: '10px', marginBottom: '1rem',
        }}>
          <div style={{ fontSize: '.78rem', fontWeight: 800, color: domDef?.color }}>
            {curInd.label}
          </div>
          <div style={{ fontSize: '.7rem', color: '#6b7280', marginTop: '.2rem' }}>
            {curActs.length} กิจกรรม · ตัวบ่งชี้ที่ {selIndIdx + 1} จาก {stdInds.length}
          </div>
        </div>
      )}

      {/* Main indicator table */}
      {curInd && curActs.length > 0 ? (
        <IndicatorTable students={students} indicator={curInd} indActivities={curActs} />
      ) : (
        <div style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>— ยังไม่มีกิจกรรมในตัวบ่งชี้นี้ —</div>
      )}

      {/* Activity legend */}
      {curActs.length > 0 && (
        <div style={{ marginTop: '.75rem', padding: '.6rem 1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '.68rem', fontWeight: 800, color: '#475569', marginBottom: '.35rem' }}>รายการกิจกรรม</div>
          {curActs.map((a, i) => (
            <div key={a.id} style={{ fontSize: '.68rem', color: '#4b5563', marginBottom: '.15rem' }}>
              <span style={{ fontWeight: 800, color: domDef?.color }}>กิจกรรมที่ {i + 1}:</span> {a.label}
            </div>
          ))}
        </div>
      )}

      {/* Standard summary */}
      {stdDef && domDef && (
        <StandardSummary students={students} indicators={indicators} activities={activities} stdDef={stdDef} domDef={domDef} />
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function DevelopmentalReportTab({ teacherClassFilter = null }) {
  const { students, classes, indicators, activities, role, user, schoolName, schoolLogo, academicYear } = useApp();

  const isTeacher = role === 'teacher';
  const myClass = teacherClassFilter ?? (isTeacher ? user?.className : null);

  const [selClass, setSelClass] = useState(() => myClass ?? (classes[0]?.name ?? ''));
  const [viewMode, setViewMode] = useState('detail'); // 'summary' | 'detail'

  const classStudents = useMemo(() =>
    students
      .filter(s => s.className === selClass && !s.name.startsWith('(ว่าง)'))
      .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '', 'th')),
    [students, selClass]
  );

  const ageRange = classStudents[0] ? LEVEL_AGE[classStudents[0].level] ?? '' : '';

  return (
    <div className="glass p-6 animate-fade">
      <div className="page-header mb-4">
        <h3>📋 รายงานสรุปผลการประเมินพัฒนาการ</h3>
      </div>

      {/* คำชี้แจง */}
      <KhamChiaeng />

      {/* Controls */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '.75rem', alignItems: 'center',
        background: '#f8fafc', borderRadius: '12px', padding: '.75rem 1rem',
        border: '1px solid #e2e8f0', marginBottom: '1.25rem',
      }}>
        {!myClass && (
          <div>
            <label style={{ fontSize: '.72rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '.2rem' }}>ห้องเรียน</label>
            <select className="input" value={selClass} onChange={e => setSelClass(e.target.value)}
              style={{ fontSize: '.8rem', padding: '.3rem .6rem', minWidth: '120px' }}>
              {classes.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
          </div>
        )}

        <div>
          <label style={{ fontSize: '.72rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '.2rem' }}>รูปแบบ</label>
          <div style={{ display: 'flex', gap: '.35rem' }}>
            {[
              { id: 'detail',  label: '📋 รายละเอียดรายตัวบ่งชี้' },
              { id: 'summary', label: '📊 สรุปทุกมาตรฐาน' },
            ].map(m => (
              <button key={m.id} type="button" onClick={() => setViewMode(m.id)}
                style={{
                  padding: '.28rem .75rem', borderRadius: '8px', fontSize: '.78rem',
                  fontFamily: 'inherit', fontWeight: viewMode === m.id ? 700 : 500, cursor: 'pointer',
                  background: viewMode === m.id ? '#7c3aed' : 'white',
                  color: viewMode === m.id ? 'white' : '#4b5563',
                  border: `1.5px solid ${viewMode === m.id ? '#7c3aed' : '#e5e7eb'}`,
                }}>
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div style={{ fontSize: '.73rem', color: '#6b7280' }}>
            ห้อง <strong>{selClass}</strong>{ageRange ? ` (อายุ ${ageRange})` : ''} · {classStudents.length} คน
          </div>
          <div style={{ fontSize: '.7rem', color: '#9ca3af' }}>ปีการศึกษา {academicYear}</div>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap', marginBottom: '.75rem', fontSize: '.68rem' }}>
        {[
          { label: '3 ดี', bg: '#d1fae5', c: '#065f46' },
          { label: '2 พอใช้', bg: '#fef3c7', c: '#92400e' },
          { label: '1 ต้องพัฒนา', bg: '#fee2e2', c: '#991b1b' },
          { label: '— ยังไม่ประเมิน', bg: '#f9fafb', c: '#9ca3af' },
        ].map(l => (
          <span key={l.label} style={{ padding: '2px 8px', borderRadius: '6px', background: l.bg, color: l.c, border: '1px solid rgba(0,0,0,.08)' }}>
            {l.label}
          </span>
        ))}
        <span style={{ color: '#9ca3af', alignSelf: 'center', marginLeft: '.25rem' }}>
          ค1 = ครั้งที่ 1 · ค2 = ครั้งที่ 2 · สรุป = ค่าสรุปภาคเรียน
        </span>
      </div>

      {/* Content */}
      {classStudents.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#9ca3af', padding: '3rem' }}>ไม่พบนักเรียนในห้อง {selClass}</div>
      ) : viewMode === 'summary' ? (
        <SummaryView students={classStudents} indicators={indicators} activities={activities}
          className={selClass} schoolName={schoolName} academicYear={academicYear} />
      ) : (
        <DetailView students={classStudents} indicators={indicators} activities={activities}
          className={selClass} schoolName={schoolName} academicYear={academicYear} />
      )}
    </div>
  );
}
