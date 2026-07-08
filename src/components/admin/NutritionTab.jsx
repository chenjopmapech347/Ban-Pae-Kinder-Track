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

// ── WHO/กรมอนามัย เกณฑ์อ้างอิง (อายุ 2–7 ปี) ───────────────────────────────
// อ้างอิง: WHO Child Growth Standards 2006 + กรมอนามัย 2563
// [median_boy, sd_boy, median_girl, sd_girl]
const WHO_W_A = {   // น้ำหนัก (ก.ก.)
  '2-0':  [12.2, 1.4, 11.5, 1.3],
  '2-6':  [13.3, 1.5, 12.5, 1.5],
  '3-0':  [14.3, 1.6, 13.9, 1.6],
  '3-6':  [15.3, 1.7, 14.8, 1.7],
  '4-0':  [16.3, 1.9, 15.9, 1.9],
  '4-6':  [17.4, 2.0, 17.0, 2.0],
  '5-0':  [18.3, 2.1, 17.9, 2.1],
  '5-6':  [19.4, 2.3, 19.0, 2.3],
  '6-0':  [20.7, 2.5, 20.2, 2.5],
  '6-6':  [21.8, 2.7, 21.5, 2.7],
  '7-0':  [23.1, 3.0, 22.8, 3.0],
};
const WHO_H_A = {   // ส่วนสูง (ซ.ม.)
  '2-0':  [87.8, 3.4, 86.4, 3.3],
  '2-6':  [92.2, 3.6, 91.2, 3.5],
  '3-0':  [96.1, 3.8, 95.1, 3.8],
  '3-6':  [99.9, 4.0, 99.0, 4.0],
  '4-0':  [103.3, 4.1, 102.7, 4.1],
  '4-6':  [106.7, 4.2, 106.2, 4.2],
  '5-0':  [110.0, 4.4, 109.4, 4.4],
  '5-6':  [113.3, 4.5, 112.8, 4.5],
  '6-0':  [116.0, 4.6, 115.5, 4.6],
  '6-6':  [119.5, 4.7, 118.7, 4.7],
  '7-0':  [122.0, 4.8, 121.7, 4.8],
};

const AGE_KEYS   = ['2-0','2-6','3-0','3-6','4-0','4-6','5-0','5-6','6-0','6-6','7-0'];
const AGE_MONTHS = [24, 30, 36, 42, 48, 54, 60, 66, 72, 78, 84];

function nearestKey(ageYear, ageMonth) {
  const totalMonths = ageYear * 12 + ageMonth;
  let best = 0;
  AGE_MONTHS.forEach((m, i) => { if (totalMonths >= m) best = i; });
  return AGE_KEYS[best];
}

// ── กราฟอ้างอิง SVG ──────────────────────────────────────────────────────────
function GrowthChartSVG({ dataTable, gIdx, minV, maxV, unit }) {
  const W = 580, H = 210;
  const P = { l: 46, r: 10, t: 12, b: 32 };
  const cW = W - P.l - P.r, cH = H - P.t - P.b;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const xS = m => P.l + (m - 24) / 60 * cW;
  const yS = v => P.t + (1 - clamp((v - minV) / (maxV - minV), 0, 1)) * cH;

  const pts = AGE_KEYS.map((k, i) => ({
    x: xS(AGE_MONTHS[i]),
    med: dataTable[k][gIdx],
    sd: dataTable[k][gIdx + 1],
  }));

  const band = (lows, highs) => {
    const t = highs.map((v, i) => `${pts[i].x},${yS(v)}`).join(' ');
    const b = [...lows].reverse().map((v, i) => `${pts[lows.length-1-i].x},${yS(v)}`).join(' ');
    return `${t} ${b}`;
  };
  const flat = val => pts.map(() => val);
  const p2 = pts.map(p => p.med + 2*p.sd);
  const p1 = pts.map(p => p.med + p.sd);
  const m0 = pts.map(p => p.med);
  const m1 = pts.map(p => p.med - p.sd);
  const m2 = pts.map(p => p.med - 2*p.sd);

  const step = (maxV - minV) / 5;
  const yTicks = Array.from({ length: 6 }, (_, i) => +(minV + step * i).toFixed(1));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block', borderRadius: '8px', border: '1px solid #d1d5db' }}>
      <rect width={W} height={H} fill="#fafafa" />
      {/* colour bands */}
      <polygon points={band(flat(minV), m2)} fill="#fde8d8" />
      <polygon points={band(m2, m1)} fill="#fef9c3" />
      <polygon points={band(m1, p1)} fill="#d1fae5" />
      <polygon points={band(p1, p2)} fill="#fef9c3" />
      <polygon points={band(p2, flat(maxV))} fill="#fee2e2" />
      {/* grid */}
      {[2,3,4,5,6,7].map(yr => <line key={yr} x1={xS(yr*12)} y1={P.t} x2={xS(yr*12)} y2={H-P.b} stroke="#d1d5db" strokeWidth="0.5" strokeDasharray="4,2" />)}
      {yTicks.map(v => <line key={v} x1={P.l} y1={yS(v)} x2={W-P.r} y2={yS(v)} stroke="#d1d5db" strokeWidth="0.5" strokeDasharray="4,2" />)}
      {/* reference curves */}
      {[p2, p1, m0, m1, m2].map((vals, ci) => (
        <polyline key={ci} points={vals.map((v, i) => `${pts[i].x},${yS(v)}`).join(' ')}
          fill="none"
          stroke={ci === 2 ? '#10b981' : ci < 2 ? '#f97316' : '#ef4444'}
          strokeWidth={ci === 2 ? 2 : 1}
          strokeDasharray={ci === 2 ? '' : '4,2'} />
      ))}
      {/* x labels */}
      {[2,3,4,5,6,7].map(yr => (
        <text key={yr} x={xS(yr*12)} y={H-6} fontSize="9" textAnchor="middle" fill="#4b5563">{yr} ปี</text>
      ))}
      {/* y labels */}
      {yTicks.map(v => (
        <text key={v} x={P.l - 4} y={yS(v) + 3} fontSize="8" textAnchor="end" fill="#4b5563">{v}</text>
      ))}
      <text x={11} y={H/2} fontSize="9" fill="#374151" textAnchor="middle"
        transform={`rotate(-90, 11, ${H/2})`}>{unit}</text>
      <rect x={P.l} y={P.t} width={cW} height={cH} fill="none" stroke="#9ca3af" strokeWidth="1" />
    </svg>
  );
}

function GrowthReference() {
  const [type, setType] = useState('weight');
  const [sex,  setSex]  = useState('ชาย');
  const dataTable = type === 'weight' ? WHO_W_A : WHO_H_A;
  const gIdx = sex === 'ชาย' ? 0 : 2;
  const minV = type === 'weight' ? 6 : 75;
  const maxV = type === 'weight' ? 32 : 135;
  const unit = type === 'weight' ? 'ก.ก.' : 'ซ.ม.';

  const btnStyle = (active, baseColor) => ({
    padding: '.3rem .85rem', borderRadius: '8px', fontFamily: 'inherit',
    fontSize: '.78rem', fontWeight: 700, cursor: 'pointer',
    background: active ? baseColor : 'white',
    color: active ? 'white' : baseColor,
    border: `1.5px solid ${baseColor}`,
  });

  return (
    <div style={{ marginTop: '1rem', padding: '1rem 1.1rem', background: '#f0fdf4', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
      <div style={{ fontWeight: 800, fontSize: '.85rem', color: '#065f46', marginBottom: '.6rem' }}>
        📊 เกณฑ์อ้างอิงน้ำหนักและส่วนสูง — WHO 2006 / กรมอนามัย 2563 — อายุ 2–7 ปี
      </div>

      {/* selectors */}
      <div style={{ display: 'flex', gap: '.45rem', marginBottom: '.7rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <button type="button" onClick={() => setType('weight')} style={btnStyle(type==='weight','#065f46')}>⚖️ น้ำหนัก</button>
        <button type="button" onClick={() => setType('height')} style={btnStyle(type==='height','#065f46')}>📏 ส่วนสูง</button>
        <div style={{ width:'1px', height:'20px', background:'#d1d5db', margin:'0 .15rem' }} />
        <button type="button" onClick={() => setSex('ชาย')}  style={btnStyle(sex==='ชาย','#1e40af')}>♂ เพศชาย</button>
        <button type="button" onClick={() => setSex('หญิง')} style={btnStyle(sex==='หญิง','#be185d')}>♀ เพศหญิง</button>
      </div>

      {/* SVG Chart */}
      <GrowthChartSVG dataTable={dataTable} gIdx={gIdx} minV={minV} maxV={maxV} unit={unit} />

      {/* legend */}
      <div style={{ display:'flex', gap:'.4rem', flexWrap:'wrap', marginTop:'.45rem', fontSize:'.69rem' }}>
        {[
          ['#d1fae5','#065f46','ตามเกณฑ์ (±1SD)'],
          ['#fef9c3','#78350f','ค่อนข้างสูง/น้อย (±1–2SD)'],
          ['#fde8d8','#7c2d12','น้อยกว่าเกณฑ์ (<-2SD)'],
          ['#fee2e2','#991b1b','มากกว่าเกณฑ์ (>+2SD)'],
        ].map(([bg, color, label]) => (
          <span key={label} style={{ background:bg, color, padding:'2px 8px', borderRadius:'6px', fontWeight:600, border:'1px solid rgba(0,0,0,.06)' }}>{label}</span>
        ))}
      </div>

      {/* Reference table */}
      <div style={{ overflowX:'auto', marginTop:'.7rem' }}>
        <table style={{ borderCollapse:'collapse', fontSize:'.68rem', width:'100%', minWidth:'500px' }}>
          <thead>
            <tr>
              <th style={refTh()}>อายุ</th>
              <th style={refTh({background:'#fde8d8',color:'#7c2d12'})}>น้อยมาก<br/>{'<'}-2SD</th>
              <th style={refTh({background:'#fef9c3',color:'#78350f'})}>ค่อนข้างน้อย<br/>-1 ถึง -2SD</th>
              <th style={refTh({background:'#d1fae5',color:'#065f46'})}>ตามเกณฑ์<br/>±1SD</th>
              <th style={refTh({background:'#fef9c3',color:'#78350f'})}>ค่อนข้างมาก<br/>+1 ถึง +2SD</th>
              <th style={refTh({background:'#fee2e2',color:'#991b1b'})}>มากกว่าเกณฑ์<br/>{'>'} +2SD</th>
              <th style={refTh()}>ค่ากลาง ({unit})</th>
            </tr>
          </thead>
          <tbody>
            {AGE_KEYS.map((k, i) => {
              const [mb, sb, mg, sg] = dataTable[k];
              const med = gIdx === 0 ? mb : mg;
              const sd  = gIdx === 0 ? sb : sg;
              const m = AGE_MONTHS[i];
              const ageLabel = `${Math.floor(m/12)} ปี${m%12 ? ` ${m%12} เดือน` : ''}`;
              return (
                <tr key={k} style={{ background: i%2===0 ? 'white' : '#f0fdf4' }}>
                  <td style={refTd({fontWeight:700})}>{ageLabel}</td>
                  <td style={refTd({background:'#fde8d8',color:'#7c2d12'})}>{'<'} {(med-2*sd).toFixed(1)}</td>
                  <td style={refTd({background:'#fef9c3',color:'#78350f'})}>{(med-2*sd).toFixed(1)} – {(med-sd).toFixed(1)}</td>
                  <td style={refTd({background:'#d1fae5',color:'#065f46',fontWeight:700})}>{(med-sd).toFixed(1)} – {(med+sd).toFixed(1)}</td>
                  <td style={refTd({background:'#fef9c3',color:'#78350f'})}>{(med+sd).toFixed(1)} – {(med+2*sd).toFixed(1)}</td>
                  <td style={refTd({background:'#fee2e2',color:'#991b1b'})}>{'>'} {(med+2*sd).toFixed(1)}</td>
                  <td style={refTd({fontWeight:700,color:'#065f46'})}>{med.toFixed(1)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Explanation (from dept of health) */}
      <div style={{ marginTop:'.75rem', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.6rem', fontSize:'.72rem' }}>
        {[
          ['⚖️ น้ำหนักตามเกณฑ์อายุ', 'เป็นดัชนีบ่งชี้ภาวะโภชนาการที่เป็นอยู่ในปัจจุบัน บ่งบอกว่ามีน้ำหนักเหมาะสมกับอายุหรือไม่ ถ้าร่างกายขาดอาหารหรือเจ็บป่วย จะมีผลกระทบต่อขนาดของร่างกาย ทำให้น้ำหนักลดลง และถ้าขาดอาหารระยะยาว เตี้ยน้ำหนักตามเกณฑ์อายุจึงนิยมใช้ เพราะครอบคลุมปัญหาทั้งการขาดสารอาหารโดยรวมและใช้แพร่หลายในทารกและเด็กก่อนวัยเรียน'],
          ['📏 ส่วนสูงตามเกณฑ์อายุ', 'เป็นดัชนีบ่งชี้ภาวะโภชนาการระยะยาวที่ผ่านมา บ่งบอกว่าส่วนสูงเหมาะสมกับอายุหรือไม่ ถ้าร่างกายมีการขาดสารอาหารแบบเรื้อรัง เป็นระยะเวลานานจะมีผลต่อการเจริญเติบโตทางโครงสร้าง ทำให้เด็กเตี้ยกว่าเด็กในวัยเดียวกัน'],
        ].map(([title, desc]) => (
          <div key={title} style={{ background:'white', borderRadius:'8px', padding:'.6rem .8rem', border:'1px solid #bbf7d0' }}>
            <div style={{ fontWeight:800, color:'#065f46', marginBottom:'.25rem' }}>{title}</div>
            <p style={{ margin:0, color:'#374151', lineHeight:1.55 }}>{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function refTh(extra = {}) {
  return { border:'1px solid #d1d5db', padding:'4px 6px', background:'#f0fdf4', fontWeight:700, fontSize:'.68rem', textAlign:'center', ...extra };
}
function refTd(extra = {}) {
  return { border:'1px solid #e5e7eb', padding:'3px 6px', textAlign:'center', fontSize:'.68rem', ...extra };
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
    academicYear, schoolName, schoolLogo,
    nutritionRecords, setNutritionRecords,
  } = useApp();

  const isTeacher = role === 'teacher';
  const myClass   = teacherClassFilter ?? (isTeacher ? user?.className : null);

  const [selClass, setSelClass] = useState(() => myClass ?? (classes[0]?.name ?? ''));
  const [selDate,  setSelDate]  = useState(todayISO());
  const [saved, setSaved] = useState(false);
  const [showRef, setShowRef] = useState(false);

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
${schoolLogo ? `<div style="text-align:center;margin-bottom:4px"><img src="${schoolLogo}" style="height:70px;object-fit:contain"/></div>` : ''}
<h3>การประเมินภาวะโภชนาการ</h3>
<p>${schoolName || 'โรงเรียน...'}</p>
<p>ครู/ผู้ดูแลเด็ก ${teacherName || '.......................'} &nbsp; ชั้น${selClass} &nbsp; จำนวนเด็กที่รับผิดชอบ ${classStudents.length} คน &nbsp; วันที่ ${thaiDateStr(selDate)}</p>
<br/>
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
      <div style={{ marginTop:'.75rem', padding:'.6rem .9rem', background:'#f0fdf4', borderRadius:'8px', border:'1px solid #bbf7d0', fontSize:'.7rem', color:'#374151', display:'flex', alignItems:'center', gap:'1rem', flexWrap:'wrap' }}>
        <span><strong>📌 หมายเหตุ:</strong> ปุ่ม 🔄 คำนวณอัตโนมัติโดยใช้ค่าอ้างอิง WHO Child Growth Standards 2006 (±1SD / ±2SD) อายุ 2–7 ปี &nbsp;·&nbsp; ครูสามารถแก้ไขผลได้ด้วยตนเองจาก dropdown</span>
        <button type="button" onClick={() => setShowRef(v => !v)}
          style={{ marginLeft:'auto', padding:'.3rem .85rem', borderRadius:'8px', fontFamily:'inherit', fontSize:'.75rem', fontWeight:700, cursor:'pointer', background: showRef ? '#065f46' : 'white', color: showRef ? 'white' : '#065f46', border:'1.5px solid #065f46', whiteSpace:'nowrap' }}>
          {showRef ? '▲ ซ่อนเกณฑ์อ้างอิง' : '📊 ดูเกณฑ์อ้างอิง 2–7 ปี'}
        </button>
      </div>

      {/* ── Growth Reference Panel ── */}
      {showRef && <GrowthReference />}

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
