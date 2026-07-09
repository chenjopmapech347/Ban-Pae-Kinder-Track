import { useState } from 'react';

// ── กรมอนามัย เกณฑ์อ้างอิง (อายุ 2–7 ปี) ───────────────────────────────────
// อ้างอิง: โปรแกรมภาวะโภชนาการ กรมอนามัย (เทศบาลบ้านเพ ๑)
// [median_boy, sd_boy, median_girl, sd_girl]
export const WHO_W_A = {   // น้ำหนักตามอายุ (ก.ก.)
  '2-0':  [12.45, 1.325, 11.75, 1.325],
  '2-6':  [13.60, 1.500, 12.85, 1.525],
  '3-0':  [14.70, 1.700, 14.05, 1.675],
  '3-6':  [15.85, 1.925, 15.20, 1.850],
  '4-0':  [16.95, 2.125, 16.25, 2.075],
  '4-6':  [17.95, 2.325, 17.20, 2.200],
  '5-0':  [19.15, 2.525, 18.30, 2.400],
  '5-6':  [20.25, 2.725, 19.60, 2.650],
  '6-0':  [21.35, 2.925, 20.70, 2.850],
  '6-6':  [22.65, 3.225, 22.35, 3.275],
  '7-0':  [24.05, 3.475, 23.85, 3.675],
};
export const WHO_H_A = {   // ส่วนสูงตามอายุ (ซ.ม.)
  '2-0':  [87.00, 3.000, 85.00, 3.300],
  '2-6':  [91.25, 3.475, 89.35, 3.475],
  '3-0':  [95.15, 3.775, 93.50, 3.700],
  '3-6':  [98.65, 3.975, 97.35, 3.875],
  '4-0':  [102.00, 4.100, 100.90, 4.000],
  '4-6':  [105.35, 4.225, 104.15, 4.125],
  '5-0':  [108.60, 4.350, 107.50, 4.250],
  '5-6':  [111.65, 4.425, 110.90, 4.350],
  '6-0':  [114.50, 4.550, 114.10, 4.450],
  '6-6':  [117.40, 4.750, 117.05, 4.625],
  '7-0':  [120.10, 4.850, 119.55, 4.825],
};

// น้ำหนักตามส่วนสูง (กรมอนามัย) — [med_boy, sd_boy, med_girl, sd_girl] ที่ความสูง cm
export const WHO_WH = {
   85: [12.35, 1.175, 12.00, 1.100],  86: [12.55, 1.175, 12.25, 1.125],
   87: [12.75, 1.175, 12.45, 1.125],  88: [13.00, 1.200, 12.70, 1.150],
   89: [13.30, 1.200, 12.95, 1.175],  90: [13.50, 1.200, 13.15, 1.175],
   91: [13.75, 1.225, 13.40, 1.200],  92: [14.00, 1.250, 13.65, 1.225],
   93: [14.25, 1.275, 13.90, 1.250],  94: [14.60, 1.300, 14.15, 1.275],
   95: [14.85, 1.325, 14.40, 1.300],  96: [15.10, 1.350, 14.70, 1.300],
   97: [15.35, 1.375, 15.00, 1.350],  98: [15.60, 1.400, 15.25, 1.375],
   99: [15.90, 1.400, 15.55, 1.425], 100: [16.15, 1.425, 15.85, 1.425],
  101: [16.40, 1.450, 16.15, 1.475], 102: [16.70, 1.450, 16.40, 1.500],
  103: [16.95, 1.475, 16.65, 1.575], 104: [17.25, 1.525, 16.95, 1.575],
  105: [17.55, 1.525, 17.25, 1.625], 106: [17.80, 1.600, 17.60, 1.650],
  107: [18.15, 1.625, 17.90, 1.700], 108: [18.40, 1.650, 18.25, 1.725],
  109: [18.75, 1.675, 18.60, 1.800], 110: [19.20, 1.750, 18.95, 1.825],
  111: [19.55, 1.775, 19.30, 1.900], 112: [19.85, 1.825, 19.65, 1.925],
  113: [20.25, 1.875, 20.05, 1.975], 114: [20.65, 1.925, 20.45, 2.025],
  115: [21.05, 1.975, 20.85, 2.075], 116: [21.45, 2.025, 21.25, 2.175],
  117: [21.90, 2.100, 21.65, 2.225], 118: [22.35, 2.125, 22.10, 2.300],
  119: [22.80, 2.200, 22.60, 2.400], 120: [23.30, 2.300, 23.15, 2.475],
  121: [23.75, 2.375, 23.60, 2.550], 122: [24.25, 2.425, 24.10, 2.650],
  123: [24.70, 2.500, 24.65, 2.775], 124: [25.25, 2.575, 25.20, 2.850],
  125: [25.70, 2.650, 25.80, 3.000], 126: [26.25, 2.725, 26.30, 3.150],
  127: [26.90, 2.850, 26.90, 3.250], 128: [27.40, 2.950, 27.45, 3.375],
  129: [28.00, 3.050, 28.15, 3.525], 130: [28.60, 3.200, 28.75, 3.675],
};

// คำนวณน้ำหนักตามส่วนสูง — ใช้ตาราง WHO_WH แบบ ±1.5SD / ±2SD / ±3SD
export function calcWHResult(weight, height, gender) {
  if (!weight || !height) return '';
  const h = Math.round(height);
  const ref = WHO_WH[h];
  if (!ref) {
    // fallback to BMI for out-of-range heights
    const bmi = weight / ((height / 100) ** 2);
    if (bmi < 13.5) return 'ผอม';
    if (bmi < 14.5) return 'ค่อนข้างผอม';
    if (bmi < 17.5) return 'สมส่วน';
    if (bmi < 19.0) return 'ท้วม';
    if (bmi < 21.0) return 'เริ่มอ้วน';
    return 'อ้วน';
  }
  const [mb, sb, mg, sg] = ref;
  const [med, sd] = gender === 'ชาย' ? [mb, sb] : [mg, sg];
  const z = (weight - med) / sd;
  if (z < -2)   return 'ผอม';
  if (z < -1.5) return 'ค่อนข้างผอม';
  if (z <= 1.5) return 'สมส่วน';
  if (z <= 2)   return 'ท้วม';
  if (z <= 3)   return 'เริ่มอ้วน';
  return 'อ้วน';
}

export const AGE_KEYS   = ['2-0','2-6','3-0','3-6','4-0','4-6','5-0','5-6','6-0','6-6','7-0'];
export const AGE_MONTHS = [24, 30, 36, 42, 48, 54, 60, 66, 72, 78, 84];

export function nearestKey(ageYear, ageMonth) {
  const totalMonths = ageYear * 12 + ageMonth;
  let best = 0;
  AGE_MONTHS.forEach((m, i) => { if (totalMonths >= m) best = i; });
  return AGE_KEYS[best];
}

// ── กราฟ SVG ─────────────────────────────────────────────────────────────────
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
    sd:  dataTable[k][gIdx + 1],
  }));

  const band = (lows, highs) => {
    const t = highs.map((v, i) => `${pts[i].x},${yS(v)}`).join(' ');
    const b = [...lows].reverse().map((v, i) => `${pts[lows.length-1-i].x},${yS(v)}`).join(' ');
    return `${t} ${b}`;
  };
  const flat = val => pts.map(() => val);
  const p2 = pts.map(p => p.med + 2*p.sd);
  const p1 = pts.map(p => p.med + p.sd);
  const m1 = pts.map(p => p.med - p.sd);
  const m2 = pts.map(p => p.med - 2*p.sd);
  const m0 = pts.map(p => p.med);

  const step = (maxV - minV) / 5;
  const yTicks = Array.from({ length: 6 }, (_, i) => +(minV + step * i).toFixed(1));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block', borderRadius: '8px', border: '1px solid #d1d5db' }}>
      <rect width={W} height={H} fill="#fafafa" />
      <polygon points={band(flat(minV), m2)} fill="#fde8d8" />
      <polygon points={band(m2, m1)}        fill="#fef9c3" />
      <polygon points={band(m1, p1)}        fill="#d1fae5" />
      <polygon points={band(p1, p2)}        fill="#fef9c3" />
      <polygon points={band(p2, flat(maxV))} fill="#fee2e2" />
      {[2,3,4,5,6,7].map(yr => (
        <line key={yr} x1={xS(yr*12)} y1={P.t} x2={xS(yr*12)} y2={H-P.b} stroke="#d1d5db" strokeWidth="0.5" strokeDasharray="4,2" />
      ))}
      {yTicks.map(v => (
        <line key={v} x1={P.l} y1={yS(v)} x2={W-P.r} y2={yS(v)} stroke="#d1d5db" strokeWidth="0.5" strokeDasharray="4,2" />
      ))}
      {[p2, p1, m0, m1, m2].map((vals, ci) => (
        <polyline key={ci} points={vals.map((v, i) => `${pts[i].x},${yS(v)}`).join(' ')}
          fill="none"
          stroke={ci === 2 ? '#10b981' : ci < 2 ? '#f97316' : '#ef4444'}
          strokeWidth={ci === 2 ? 2 : 1}
          strokeDasharray={ci === 2 ? '' : '4,2'} />
      ))}
      {[2,3,4,5,6,7].map(yr => (
        <text key={yr} x={xS(yr*12)} y={H-6} fontSize="9" textAnchor="middle" fill="#4b5563">{yr} ปี</text>
      ))}
      {yTicks.map(v => (
        <text key={v} x={P.l-4} y={yS(v)+3} fontSize="8" textAnchor="end" fill="#4b5563">{v}</text>
      ))}
      <text x={11} y={H/2} fontSize="9" fill="#374151" textAnchor="middle"
        transform={`rotate(-90, 11, ${H/2})`}>{unit}</text>
      <rect x={P.l} y={P.t} width={cW} height={cH} fill="none" stroke="#9ca3af" strokeWidth="1" />
    </svg>
  );
}

// ── ฟังก์ชัน style ────────────────────────────────────────────────────────────
function refTh(extra = {}) {
  return { border:'1px solid #d1d5db', padding:'4px 6px', background:'#f0fdf4', fontWeight:700, fontSize:'.68rem', textAlign:'center', ...extra };
}
function refTd(extra = {}) {
  return { border:'1px solid #e5e7eb', padding:'3px 6px', textAlign:'center', fontSize:'.68rem', ...extra };
}

// ── GrowthReferencePanel (default export) ─────────────────────────────────────
export default function GrowthReferencePanel() {
  const [type, setType] = useState('weight');
  const [sex,  setSex]  = useState('ชาย');

  const dataTable = type === 'weight' ? WHO_W_A : WHO_H_A;
  const gIdx = sex === 'ชาย' ? 0 : 2;
  const minV = type === 'weight' ? 6  : 75;
  const maxV = type === 'weight' ? 32 : 135;
  const unit = type === 'weight' ? 'ก.ก.' : 'ซ.ม.';

  const btnStyle = (active, color) => ({
    padding: '.3rem .85rem', borderRadius: '8px', fontFamily: 'inherit',
    fontSize: '.78rem', fontWeight: 700, cursor: 'pointer',
    background: active ? color : 'white',
    color:      active ? 'white' : color,
    border:     `1.5px solid ${color}`,
  });

  return (
    <div>
      {/* selectors */}
      <div style={{ display:'flex', gap:'.45rem', marginBottom:'.7rem', flexWrap:'wrap', alignItems:'center' }}>
        <button type="button" onClick={() => setType('weight')} style={btnStyle(type==='weight','#065f46')}>⚖️ น้ำหนัก</button>
        <button type="button" onClick={() => setType('height')} style={btnStyle(type==='height','#065f46')}>📏 ส่วนสูง</button>
        <div style={{ width:'1px', height:'20px', background:'#d1d5db', margin:'0 .15rem' }} />
        <button type="button" onClick={() => setSex('ชาย')}  style={btnStyle(sex==='ชาย','#1e40af')}>♂ เพศชาย</button>
        <button type="button" onClick={() => setSex('หญิง')} style={btnStyle(sex==='หญิง','#be185d')}>♀ เพศหญิง</button>
      </div>

      {/* chart */}
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

      {/* reference table */}
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

      {/* explanation */}
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
