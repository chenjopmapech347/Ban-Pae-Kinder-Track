import { useState, useMemo, useCallback } from 'react';
import { useApp } from '../../context/AppContext';

// ── ตัวเลือกผลประเมิน ────────────────────────────────────────────────────────
const WEIGHT_AGE_OPTS = [
  'น้ำหนักตามเกณฑ์',
  'น้ำหนักค่อนข้างน้อย',
  'น้ำหนักน้อยกว่าเกณฑ์',
  'น้ำหนักค่อนข้างมาก',
  'น้ำหนักมากกว่าเกณฑ์',
];
const HEIGHT_AGE_OPTS = [
  'ส่วนสูงตามเกณฑ์',
  'ส่วนสูงค่อนข้างเตี้ย',
  'เตี้ย',
  'ส่วนสูงค่อนข้างสูง',
  'สูง',
];
const WEIGHT_HEIGHT_OPTS = [
  'สมส่วน',
  'ท้วม',
  'เริ่มอ้วน',
  'อ้วน',
  'ค่อนข้างผอม',
  'ผอม',
];

// ── สีของผลประเมิน ────────────────────────────────────────────────────────────
function resultColor(val) {
  if (!val) return { bg:'white', color:'#9ca3af' };
  if (val.includes('ตามเกณฑ์') || val === 'สมส่วน') return { bg:'#d1fae5', color:'#065f46' };
  if (val.includes('ค่อนข้าง'))  return { bg:'#fef3c7', color:'#92400e' };
  if (val.includes('มากกว่า') || val.includes('อ้วน')) return { bg:'#fee2e2', color:'#991b1b' };
  if (val.includes('น้อยกว่า') || val === 'ผอม' || val === 'เตี้ย') return { bg:'#ede9fe', color:'#6d28d9' };
  return { bg:'#f9fafb', color:'#374151' };
}

// ── WHO/กรมอนามัย เกณฑ์อย่างง่าย (อายุ 3–6 ปี) ─────────────────────────────
// ใช้ค่ากลาง ± ช่วง (ค่อนข้าง = ±1SD, เกิน = ±2SD)
// อ้างอิง: WHO Child Growth Standards 2006 + กรมอนามัย 2563
const WHO_W_A = {   // [median_boy, sd_boy, median_girl, sd_girl]  kg
  '3-0':  [14.3, 1.6, 13.9, 1.6],
  '3-6':  [15.3, 1.7, 14.8, 1.7],
  '4-0':  [16.3, 1.9, 15.9, 1.9],
  '4-6':  [17.4, 2.0, 17.0, 2.0],
  '5-0':  [18.3, 2.1, 17.9, 2.1],
  '5-6':  [19.4, 2.3, 19.0, 2.3],
  '6-0':  [20.7, 2.5, 20.2, 2.5],
};
const WHO_H_A = {   // [median_boy, sd_boy, median_girl, sd_girl]  cm
  '3-0':  [96.1, 3.8, 95.1, 3.8],
  '3-6':  [99.9, 4.0, 99.0, 4.0],
  '4-0':  [103.3, 4.1, 102.7, 4.1],
  '4-6':  [106.7, 4.2, 106.2, 4.2],
  '5-0':  [110.0, 4.4, 109.4, 4.4],
  '5-6':  [113.3, 4.5, 112.8, 4.5],
  '6-0':  [116.0, 4.6, 115.5, 4.6],
};

function nearestKey(ageYear, ageMonth) {
  const totalMonths = ageYear * 12 + ageMonth;
  const keys = ['3-0','3-6','4-0','4-6','5-0','5-6','6-0'];
  const months = [36, 42, 48, 54, 60, 66, 72];
  let best = 0;
  months.forEach((m, i) => { if (totalMonths >= m) best = i; });
  return keys[best];
}

function calcWeightAge(weight, ageYear, ageMonth, gender) {
  const k = nearestKey(ageYear, ageMonth);
  const ref = WHO_W_A[k]; if (!ref) return '';
  const [mb, sb, mg, sg] = ref;
  const [med, sd] = gender === 'ชาย' ? [mb, sb] : [mg, sg];
  const z = (weight - med) / sd;
  if (z < -2)  return 'น้ำหนักน้อยกว่าเกณฑ์';
  if (z < -1)  return 'น้ำหนักค่อนข้างน้อย';
  if (z <= 1)  return 'น้ำหนักตามเกณฑ์';
  if (z <= 2)  return 'น้ำหนักค่อนข้างมาก';
  return 'น้ำหนักมากกว่าเกณฑ์';
}

function calcHeightAge(height, ageYear, ageMonth, gender) {
  const k = nearestKey(ageYear, ageMonth);
  const ref = WHO_H_A[k]; if (!ref) return '';
  const [mb, sb, mg, sg] = ref;
  const [med, sd] = gender === 'ชาย' ? [mb, sb] : [mg, sg];
  const z = (height - med) / sd;
  if (z < -2)  return 'เตี้ย';
  if (z < -1)  return 'ส่วนสูงค่อนข้างเตี้ย';
  if (z <= 1)  return 'ส่วนสูงตามเกณฑ์';
  if (z <= 2)  return 'ส่วนสูงค่อนข้างสูง';
  return 'สูง';
}

function calcWeightHeight(weight, height) {
  // ใช้ BMI อย่างง่าย (เด็กอนุบาล 3-6 ปี)
  if (!weight || !height) return '';
  const bmi = weight / ((height / 100) ** 2);
  if (bmi < 13.5) return 'ผอม';
  if (bmi < 14.5) return 'ค่อนข้างผอม';
  if (bmi < 17.5) return 'สมส่วน';
  if (bmi < 19.0) return 'ท้วม';
  if (bmi < 21.0) return 'เริ่มอ้วน';
  return 'อ้วน';
}

function autoCalc(row, gender) {
  return {
    weightForAge:    calcWeightAge(row.weight, row.ageYear, row.ageMonth, gender),
    heightForAge:    calcHeightAge(row.height, row.ageYear, row.ageMonth, gender),
    weightForHeight: calcWeightHeight(row.weight, row.height),
  };
}

// ── วันที่ไทย ────────────────────────────────────────────────────────────────
function thaiDateStr(date) {
  const [y, m, d] = date.split('-');
  const MONTHS = ['','ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
  return `${parseInt(d)} ${MONTHS[parseInt(m)]} ${parseInt(y) + 543}`;
}
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function recKey(className, academicYear, date) {
  return `${className}__${academicYear}__${date}`;
}

// ── genderOf ─────────────────────────────────────────────────────────────────
function genderOf(student) {
  if (student.gender) return student.gender;
  if (student.name?.includes('ชาย')) return 'ชาย';
  if (student.name?.includes('หญิง')) return 'หญิง';
  return 'ชาย';
}

// ── NutritionTab ──────────────────────────────────────────────────────────────
export default function NutritionTab({ teacherClassFilter = null }) {
  const {
    students, classes, teachers, role, user,
    academicYear, schoolName,
    nutritionRecords, setNutritionRecords,
  } = useApp();

  const isTeacher = role === 'teacher';
  const myClass   = teacherClassFilter ?? (isTeacher ? user?.className : null);

  const [selClass, setSelClass] = useState(() => myClass ?? (classes[0]?.name ?? ''));
  const [selDate,  setSelDate]  = useState(todayISO());
  const [saved, setSaved] = useState(false);

  const key = useMemo(() => recKey(selClass, academicYear, selDate), [selClass, academicYear, selDate]);

  const classStudents = useMemo(() =>
    students
      .filter(s => s.className === selClass && !s.name.startsWith('(ว่าง)'))
      .sort((a, b) => Number(a.id) - Number(b.id)),
    [students, selClass]
  );

  // draft: { [studentId]: { ageYear, ageMonth, weight, height, weightForAge, heightForAge, weightForHeight } }
  const [draft, setDraft] = useState(() => buildDraft(nutritionRecords[key], classStudents));

  function buildDraft(existing, sList) {
    const base = {};
    sList.forEach(s => {
      const ex = existing?.students?.[s.id];
      const gender = genderOf(s);
      const row = {
        ageYear:    ex?.ageYear    ?? (typeof s.age === 'number' ? s.age : 5),
        ageMonth:   ex?.ageMonth   ?? 0,
        weight:     ex?.weight     ?? (s.weight ?? 0),
        height:     ex?.height     ?? (s.height ?? 0),
        weightForAge:    ex?.weightForAge    ?? '',
        heightForAge:    ex?.heightForAge    ?? '',
        weightForHeight: ex?.weightForHeight ?? '',
        locked:     Boolean(ex),
      };
      base[s.id] = row;
    });
    return base;
  }

  const switchRecord = useCallback((cls, date) => {
    const k = recKey(cls, academicYear, date);
    const sList = students
      .filter(s => s.className === cls && !s.name.startsWith('(ว่าง)'))
      .sort((a, b) => Number(a.id) - Number(b.id));
    setDraft(buildDraft(nutritionRecords[k], sList));
    setSaved(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nutritionRecords, academicYear, students]);

  function handleClassChange(cls) { setSelClass(cls); switchRecord(cls, selDate); }
  function handleDateChange(d)    { setSelDate(d);    switchRecord(selClass, d); }

  function updateRow(studentId, patch) {
    setSaved(false);
    setDraft(prev => ({ ...prev, [studentId]: { ...prev[studentId], ...patch } }));
  }

  // คำนวณอัตโนมัติแถวเดียว
  function recalcRow(studentId) {
    const s   = classStudents.find(x => x.id === studentId);
    const row = draft[studentId];
    if (!s || !row) return;
    const calc = autoCalc(row, genderOf(s));
    updateRow(studentId, calc);
  }

  // คำนวณทั้งหมด
  function recalcAll() {
    setSaved(false);
    setDraft(prev => {
      const next = { ...prev };
      classStudents.forEach(s => {
        const row = prev[s.id];
        if (!row) return;
        next[s.id] = { ...row, ...autoCalc(row, genderOf(s)) };
      });
      return next;
    });
  }

  function handleSave() {
    setNutritionRecords(prev => ({
      ...prev,
      [key]: {
        id: key, className: selClass, academicYear, assessmentDate: selDate,
        students: Object.fromEntries(
          Object.entries(draft).map(([sid, row]) => {
            const { locked: _l, ...data } = row;
            return [sid, data];
          })
        ),
      },
    }));
    setSaved(true);
  }

  function handleClear() {
    if (!window.confirm(`ล้างข้อมูลประเมิน ${thaiDateStr(selDate)} ห้อง ${selClass}?`)) return;
    setNutritionRecords(prev => { const n = { ...prev }; delete n[key]; return n; });
    setDraft(buildDraft(null, classStudents));
    setSaved(false);
  }

  const teacherName = useMemo(() => {
    if (isTeacher) return user?.name ?? '';
    const t = teachers.find(t => t.className === selClass);
    return t?.name ?? '';
  }, [isTeacher, user, teachers, selClass]);

  // ── สรุปผล ──────────────────────────────────────────────────────────────────
  const summary = useMemo(() => {
    const all = classStudents.map(s => draft[s.id]).filter(Boolean);
    const count = (arr, fn) => arr.filter(fn).length;
    return {
      normal:      count(all, r => r.weightForHeight === 'สมส่วน'),
      obese:       count(all, r => ['ท้วม','เริ่มอ้วน','อ้วน'].includes(r.weightForHeight)),
      thin:        count(all, r => ['ผอม','ค่อนข้างผอม'].includes(r.weightForHeight)),
      assessed:    count(all, r => r.weightForAge !== ''),
    };
  }, [draft, classStudents]);

  // ── Print ────────────────────────────────────────────────────────────────────
  function handlePrint() {
    const rows = classStudents.map((s, idx) => {
      const r = draft[s.id] ?? {};
      const gender = genderOf(s);
      const wcol = resultColor(r.weightForAge);
      const hcol = resultColor(r.heightForAge);
      const whcol = resultColor(r.weightForHeight);
      return `<tr>
        <td>${idx+1}</td>
        <td style="text-align:left">${s.name}</td>
        <td>${gender === 'ชาย' ? '♂' : '♀'}</td>
        <td>${r.ageYear ?? ''}</td>
        <td>${r.ageMonth ?? ''}</td>
        <td>${r.weight || ''}</td>
        <td>${r.height || ''}</td>
        <td style="background:${wcol.bg};color:${wcol.color}">${r.weightForAge || ''}</td>
        <td style="background:${hcol.bg};color:${hcol.color}">${r.heightForAge || ''}</td>
        <td style="background:${whcol.bg};color:${whcol.color}">${r.weightForHeight || ''}</td>
      </tr>`;
    }).join('');

    const win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>ประเมินภาวะโภชนาการ</title>
<style>
  @page { size: A4 landscape; margin: 10mm }
  body { font-family: 'TH Sarabun New', Sarabun, sans-serif; font-size: 11pt }
  h3, h4, p { text-align: center; margin: 2px 0 }
  h3 { font-size: 14pt }
  table { border-collapse: collapse; width: 100%; margin-top: 8px }
  td, th { border: 1px solid #555; padding: 3px 5px; text-align: center; font-size: 9pt }
  th { background: #e8f4fd; font-weight: bold }
  .sig { margin-top: 16px; display: flex; justify-content: space-between; font-size: 10pt; line-height: 2 }
</style></head><body>
<h3>การประเมินภาวะโภชนาการ</h3>
<p>${schoolName || 'โรงเรียน...'}</p>
<p>ครู/ผู้ดูแลเด็ก ${teacherName || '.......................'} &nbsp; ชั้น${selClass} &nbsp; จำนวนเด็กที่รับผิดชอบ ${classStudents.length} คน &nbsp; วันที่ ${thaiDateStr(selDate)}</p>
<table>
  <thead>
    <tr>
      <th rowspan="2">เลข<br/>ประจำตัว</th>
      <th rowspan="2">ชื่อ นามสกุล</th>
      <th rowspan="2">เพศ</th>
      <th colspan="2">อายุ</th>
      <th rowspan="2">น้ำหนัก<br/>(ก.ก.)</th>
      <th rowspan="2">ส่วนสูง<br/>(ซ.ม.)</th>
      <th rowspan="2">น้ำหนักเทียบกับอายุ</th>
      <th rowspan="2">ส่วนสูงเทียบกับอายุ</th>
      <th rowspan="2">ส่วนสูงเทียบกับน้ำหนัก</th>
    </tr>
    <tr><th>ปี</th><th>เดือน</th></tr>
  </thead>
  <tbody>${rows}</tbody>
</table>
<div class="sig">
  <div>ลงชื่อ .............................................<br/>(${teacherName || '.....................................'})<br/>ครูประจำชั้น</div>
  <div>ลงชื่อ .............................................<br/>(...............................................)<br/>ผู้อำนวยการสถานศึกษา</div>
</div>
</body></html>`);
    win.document.close();
    win.print();
  }

  // ── UI ────────────────────────────────────────────────────────────────────────
  return (
    <div className="glass p-6 animate-fade">
      <div className="page-header mb-4">
        <h3>⚖️ การประเมินภาวะโภชนาการ</h3>
      </div>

      {/* ── Controls ── */}
      <div style={{
        display:'flex', flexWrap:'wrap', gap:'.75rem', alignItems:'flex-end',
        background:'#f0fdf4', borderRadius:'12px', padding:'.75rem 1rem',
        border:'1px solid #bbf7d0', marginBottom:'1rem',
      }}>
        {!myClass && (
          <div>
            <label style={lbl}>ห้องเรียน</label>
            <select className="input" value={selClass} onChange={e => handleClassChange(e.target.value)}
              style={{ fontSize:'.8rem', padding:'.3rem .6rem', minWidth:'120px' }}>
              {classes.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
          </div>
        )}
        <div>
          <label style={lbl}>วันที่ประเมิน</label>
          <input type="date" className="input" value={selDate}
            onChange={e => handleDateChange(e.target.value)}
            style={{ fontSize:'.8rem', padding:'.3rem .6rem' }} />
        </div>
        <div style={{ marginLeft:'auto', textAlign:'right', fontSize:'.72rem', color:'#065f46' }}>
          <div>ห้อง <strong>{selClass}</strong> · {classStudents.length} คน · {thaiDateStr(selDate)}</div>
          {teacherName && <div>ครู {teacherName}</div>}
        </div>
      </div>

      {/* ── Summary badges ── */}
      {summary.assessed > 0 && (
        <div style={{ display:'flex', gap:'.5rem', flexWrap:'wrap', marginBottom:'.75rem', fontSize:'.78rem' }}>
          {[
            ['✅ สมส่วน', summary.normal, '#d1fae5', '#065f46'],
            ['⚠️ เกินเกณฑ์', summary.obese, '#fee2e2', '#991b1b'],
            ['💙 ต่ำกว่าเกณฑ์', summary.thin, '#ede9fe', '#6d28d9'],
            ['📊 ประเมินแล้ว', summary.assessed, '#dbeafe', '#1e40af'],
          ].map(([label, val, bg, color]) => (
            <span key={label} style={{ background:bg, color, fontWeight:700, padding:'3px 10px', borderRadius:'8px', border:'1px solid rgba(0,0,0,.07)' }}>
              {label}: {val} คน
            </span>
          ))}
        </div>
      )}

      {/* ── Table ── */}
      {classStudents.length === 0 ? (
        <div style={{ textAlign:'center', color:'#9ca3af', padding:'3rem' }}>ไม่พบนักเรียนในห้อง {selClass}</div>
      ) : (
        <div style={{ overflowX:'auto' }}>
          <table style={{ borderCollapse:'collapse', fontSize:'.75rem', width:'100%' }}>
            <thead>
              <tr>
                <th rowSpan={2} style={th({ minWidth:'36px' })}>เลขที่</th>
                <th rowSpan={2} style={th({ minWidth:'160px', textAlign:'left', paddingLeft:'8px' })}>ชื่อ นามสกุล</th>
                <th rowSpan={2} style={th({ minWidth:'44px' })}>เพศ</th>
                <th colSpan={2} style={th({ background:'#bbf7d0', color:'#065f46' })}>อายุ</th>
                <th rowSpan={2} style={th({ minWidth:'68px', background:'#fef9c3', color:'#78350f' })}>น้ำหนัก<br/>(ก.ก.)</th>
                <th rowSpan={2} style={th({ minWidth:'68px', background:'#dbeafe', color:'#1e40af' })}>ส่วนสูง<br/>(ซ.ม.)</th>
                <th rowSpan={2} style={th({ minWidth:'120px' })}>น้ำหนัก<br/>เทียบกับอายุ</th>
                <th rowSpan={2} style={th({ minWidth:'120px' })}>ส่วนสูง<br/>เทียบกับอายุ</th>
                <th rowSpan={2} style={th({ minWidth:'120px' })}>ส่วนสูง<br/>เทียบกับน้ำหนัก</th>
                <th rowSpan={2} style={th({ minWidth:'60px' })}>คำนวณ</th>
              </tr>
              <tr>
                <th style={th({ background:'#bbf7d0', color:'#065f46', minWidth:'42px' })}>ปี</th>
                <th style={th({ background:'#bbf7d0', color:'#065f46', minWidth:'48px' })}>เดือน</th>
              </tr>
            </thead>
            <tbody>
              {classStudents.map((s, idx) => {
                const r      = draft[s.id] ?? {};
                const gender = genderOf(s);
                const wc = resultColor(r.weightForAge);
                const hc = resultColor(r.heightForAge);
                const whc = resultColor(r.weightForHeight);
                return (
                  <tr key={s.id} style={{ background: idx%2===0 ? 'white' : '#f8fffe' }}>
                    <td style={tdc({ color:'#6b7280', fontWeight:700 })}>{idx+1}</td>
                    <td style={{ ...tdc(), textAlign:'left', paddingLeft:'8px' }}>{s.name}</td>
                    <td style={tdc({ color: gender==='ชาย' ? '#1e40af' : '#be185d', fontWeight:700 })}>
                      {gender === 'ชาย' ? '♂ ชาย' : '♀ หญิง'}
                    </td>
                    {/* อายุ ปี */}
                    <td style={tdc()}>
                      <input type="number" min={0} max={8} value={r.ageYear ?? ''}
                        onChange={e => updateRow(s.id, { ageYear: Number(e.target.value) })}
                        style={numInput} />
                    </td>
                    {/* อายุ เดือน */}
                    <td style={tdc()}>
                      <input type="number" min={0} max={11} value={r.ageMonth ?? ''}
                        onChange={e => updateRow(s.id, { ageMonth: Number(e.target.value) })}
                        style={numInput} />
                    </td>
                    {/* น้ำหนัก */}
                    <td style={tdc({ background:'#fffde7' })}>
                      <input type="number" min={0} max={60} step={0.1} value={r.weight ?? ''}
                        onChange={e => updateRow(s.id, { weight: parseFloat(e.target.value) || 0 })}
                        style={{ ...numInput, width:'56px' }} />
                    </td>
                    {/* ส่วนสูง */}
                    <td style={tdc({ background:'#eff6ff' })}>
                      <input type="number" min={0} max={160} step={0.1} value={r.height ?? ''}
                        onChange={e => updateRow(s.id, { height: parseFloat(e.target.value) || 0 })}
                        style={{ ...numInput, width:'56px' }} />
                    </td>
                    {/* น้ำหนักเทียบกับอายุ */}
                    <td style={{ ...tdc(), background: wc.bg }}>
                      <select value={r.weightForAge ?? ''} onChange={e => updateRow(s.id, { weightForAge: e.target.value })}
                        style={{ ...selInput, color: wc.color, background: wc.bg }}>
                        <option value="">—</option>
                        {WEIGHT_AGE_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </td>
                    {/* ส่วนสูงเทียบกับอายุ */}
                    <td style={{ ...tdc(), background: hc.bg }}>
                      <select value={r.heightForAge ?? ''} onChange={e => updateRow(s.id, { heightForAge: e.target.value })}
                        style={{ ...selInput, color: hc.color, background: hc.bg }}>
                        <option value="">—</option>
                        {HEIGHT_AGE_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </td>
                    {/* ส่วนสูงเทียบกับน้ำหนัก */}
                    <td style={{ ...tdc(), background: whc.bg }}>
                      <select value={r.weightForHeight ?? ''} onChange={e => updateRow(s.id, { weightForHeight: e.target.value })}
                        style={{ ...selInput, color: whc.color, background: whc.bg }}>
                        <option value="">—</option>
                        {WEIGHT_HEIGHT_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </td>
                    {/* ปุ่มคำนวณรายคน */}
                    <td style={tdc()}>
                      <button type="button" onClick={() => recalcRow(s.id)}
                        title="คำนวณอัตโนมัติ"
                        style={{ padding:'2px 6px', borderRadius:'6px', border:'1px solid #bbf7d0', background:'#d1fae5', color:'#065f46', fontSize:'.7rem', cursor:'pointer', fontFamily:'inherit' }}>
                        🔄
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Actions ── */}
      <div style={{ display:'flex', gap:'.6rem', marginTop:'1rem', flexWrap:'wrap', alignItems:'center' }}>
        <button className="btn btn-primary" onClick={handleSave}>💾 บันทึก</button>
        <button type="button" className="btn btn-secondary"
          style={{ background:'#d1fae5', color:'#065f46', borderColor:'#bbf7d0' }}
          onClick={recalcAll}>
          🔄 คำนวณทั้งหมด (อัตโนมัติ)
        </button>
        <button className="btn btn-secondary" onClick={handlePrint}>🖨️ พิมพ์แบบฟอร์ม</button>
        <button type="button" onClick={handleClear}
          style={{ padding:'.35rem .9rem', borderRadius:'8px', border:'1px solid #fca5a5', background:'#fff5f5', color:'#dc2626', fontFamily:'inherit', fontSize:'.8rem', cursor:'pointer' }}>
          🗑️ ล้างข้อมูลวันที่นี้
        </button>
        {saved && <span style={{ color:'#059669', fontWeight:700, fontSize:'.82rem' }}>✅ บันทึกแล้ว</span>}
      </div>

      {/* ── หมายเหตุการคำนวณ ── */}
      <div style={{ marginTop:'.75rem', padding:'.6rem .9rem', background:'#f0fdf4', borderRadius:'8px', border:'1px solid #bbf7d0', fontSize:'.7rem', color:'#374151' }}>
        <strong>📌 หมายเหตุ:</strong> ปุ่ม 🔄 คำนวณอัตโนมัติโดยใช้ค่าอ้างอิง WHO Child Growth Standards 2006
        (เกณฑ์อย่างง่าย ±1SD / ±2SD) &nbsp;·&nbsp; ครูสามารถแก้ไขผลได้ด้วยตนเองจาก dropdown
      </div>

      {/* ── Assessment History ── */}
      <AssessHistory nutritionRecords={nutritionRecords} selClass={selClass} academicYear={academicYear} selDate={selDate} onSelect={handleDateChange} />
    </div>
  );
}

// ── ประวัติการประเมิน ────────────────────────────────────────────────────────
function AssessHistory({ nutritionRecords, selClass, academicYear, selDate, onSelect }) {
  const records = useMemo(() =>
    Object.values(nutritionRecords)
      .filter(r => r.className === selClass && r.academicYear === academicYear)
      .sort((a, b) => b.assessmentDate.localeCompare(a.assessmentDate)),
    [nutritionRecords, selClass, academicYear]
  );
  if (records.length === 0) return null;
  return (
    <div style={{ marginTop:'1.25rem', padding:'.75rem 1rem', background:'#f0fdf4', borderRadius:'12px', border:'1px solid #bbf7d0' }}>
      <div style={{ fontSize:'.75rem', fontWeight:800, color:'#065f46', marginBottom:'.5rem' }}>
        📅 ประวัติการประเมิน — ห้อง {selClass} ปีการศึกษา {academicYear}
      </div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:'.35rem' }}>
        {records.map(r => {
          const active = r.assessmentDate === selDate;
          const assessed = Object.values(r.students ?? {}).filter(s => s.weightForAge).length;
          return (
            <button key={r.id} type="button" onClick={() => onSelect(r.assessmentDate)}
              style={{
                padding:'.25rem .85rem', borderRadius:'8px', fontFamily:'inherit', cursor:'pointer',
                fontSize:'.75rem', fontWeight: active ? 800 : 500,
                background: active ? '#059669' : 'white',
                color: active ? 'white' : '#374151',
                border: `1.5px solid ${active ? '#059669' : '#bbf7d0'}`,
              }}>
              {thaiDateStr(r.assessmentDate)}
              <span style={{ marginLeft:'4px', fontSize:'.68rem', opacity:.8 }}>({assessed} คน)</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Style helpers ────────────────────────────────────────────────────────────
function th(extra = {}) {
  return { border:'1px solid #d1d5db', padding:'4px 3px', background:'#f0fdf4', fontWeight:700, fontSize:'.7rem', textAlign:'center', ...extra };
}
function tdc(extra = {}) {
  return { border:'1px solid #e5e7eb', padding:'2px 3px', textAlign:'center', fontSize:'.73rem', ...extra };
}
const lbl = { fontSize:'.72rem', fontWeight:700, color:'#065f46', display:'block', marginBottom:'.2rem' };
const numInput = {
  width:'42px', textAlign:'center', border:'1px solid #d1d5db', borderRadius:'5px',
  fontSize:'.7rem', padding:'2px 3px', fontFamily:'inherit',
};
const selInput = {
  width:'100%', minWidth:'100px', border:'none', borderRadius:'5px',
  fontSize:'.68rem', padding:'2px 2px', fontFamily:'inherit', cursor:'pointer',
  fontWeight:600,
};
