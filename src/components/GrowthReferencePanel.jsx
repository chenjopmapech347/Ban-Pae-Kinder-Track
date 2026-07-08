import { useState } from 'react';

// ── WHO/กรมอนามัย เกณฑ์อ้างอิง (อายุ 2–7 ปี) ───────────────────────────────
// อ้างอิง: WHO Child Growth Standards 2006 + กรมอนามัย 2563
// [median_boy, sd_boy, median_girl, sd_girl]
export const WHO_W_A = {   // น้ำหนัก (ก.ก.)
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
export const WHO_H_A = {   // ส่วนสูง (ซ.ม.)
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
