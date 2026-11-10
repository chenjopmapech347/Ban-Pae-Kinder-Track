import { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { INDICATORS_DATA_68 } from '../../data/indicatorsData_68';
import { COMPETENCY_ACTIVITY_MAP } from '../../data/competencyActivityMap';
import { COMPETENCIES_C68_อ1 } from '../../data/competenciesData_อ1_68';

const noKor = x => String(x ?? '').replace(/(\d)ข/g, '$1'); // แสดงผลเท่านั้น

const card = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '1rem', marginBottom: '1rem' };
const h3 = { margin: '0 0 .6rem', fontSize: '.95rem', fontWeight: 800, color: '#111827' };
const th = { padding: '6px 8px', border: '1px solid #e5e7eb', background: '#f3f4f6', fontSize: '.74rem', fontWeight: 700, textAlign: 'center', whiteSpace: 'nowrap' };
const td = { padding: '5px 8px', border: '1px solid #e5e7eb', fontSize: '.78rem', verticalAlign: 'top' };

function Stat({ label, value, color }) {
  return (
    <div style={{ flex: '1 1 150px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '.6rem .8rem' }}>
      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: color ?? '#4f46e5' }}>{value}</div>
      <div style={{ fontSize: '.72rem', color: '#6b7280' }}>{label}</div>
    </div>
  );
}

function Bar({ label, sub, value, max, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', margin: '3px 0' }}>
      <div style={{ width: '46%', minWidth: 120, fontSize: '.74rem', color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={`${label} ${sub ?? ''}`}>
        <strong>{label}</strong> {sub}
      </div>
      <div style={{ flex: 1, background: '#f3f4f6', borderRadius: '4px', height: 16, position: 'relative' }}>
        <div style={{ width: `${max ? (value / max) * 100 : 0}%`, minWidth: value ? 4 : 0, height: '100%', background: color, borderRadius: '4px' }} />
      </div>
      <div style={{ width: 24, textAlign: 'right', fontSize: '.76rem', fontWeight: 700, color: value ? '#111827' : '#dc2626' }}>{value}</div>
    </div>
  );
}

const heat = (n) => (n >= 3 ? '#059669' : n === 2 ? '#34d399' : n === 1 ? '#a7f3d0' : 'transparent');

export default function ActivityMappingTab() {
  const { indicators, activities } = useApp();
  const [domainFilter, setDomainFilter] = useState('all');

  const domainMeta = useMemo(() => Object.fromEntries(
    INDICATORS_DATA_68.map(d => [d.id, { label: d.label, emoji: d.emoji, color: d.color, bg: d.bg }])), []);

  // ตัวบ่งชี้ + กิจกรรมที่ผูกอยู่ (จากข้อมูลที่ใช้งานจริงในระบบ)
  const rows = useMemo(() => {
    const byInd = {};
    (activities ?? []).forEach(a => { (byInd[a.indicatorId] ||= []).push(a); });
    return (indicators ?? [])
      .map(ind => {
        const acts = (byInd[ind.id] ?? []).slice().sort((a, b) => Number(a.no) - Number(b.no));
        const items = new Set(acts.map(a => a.itemLabel).filter(Boolean));
        return { ind, acts, itemCount: items.size };
      })
      .sort((a, b) => String(a.ind.indicatorCode).localeCompare(String(b.ind.indicatorCode), 'th', { numeric: true }));
  }, [indicators, activities]);

  const shown = domainFilter === 'all' ? rows : rows.filter(r => r.ind.domainId === domainFilter);

  // ความสามารถผู้เรียน 33 ข้อ ↔ กิจกรรม
  const comps = useMemo(() => COMPETENCIES_C68_อ1.map(c => ({
    code: c.code, label: c.label, domainId: c.domainId,
    acts: (COMPETENCY_ACTIVITY_MAP[c.code] ?? []).map(String),
  })), []);
  const compDomainColor = { d1: '#059669', d2: '#db2777', d3: '#d97706', d4: '#2563eb' };

  const actCount = rows.reduce((s, r) => s + r.acts.length, 0);
  const indWithAct = rows.filter(r => r.acts.length > 0).length;
  const compCovered = comps.filter(c => c.acts.length > 0).length;
  const compWeak = comps.filter(c => c.acts.length <= 1);
  const maxActs = Math.max(1, ...rows.map(r => r.acts.length));
  const maxCompActs = Math.max(1, ...comps.map(c => c.acts.length));

  return (
    <div>
      <h2 style={{ margin: '0 0 .3rem', fontSize: '1.15rem', fontWeight: 800 }}>🧭 Mapping กิจกรรม ↔ ตัวบ่งชี้ ↔ ความสามารถผู้เรียน</h2>
      <p style={{ margin: '0 0 1rem', fontSize: '.8rem', color: '#6b7280' }}>
        ดูว่ากิจกรรมแต่ละรายการรองรับตัวบ่งชี้และความสามารถผู้เรียนข้อใด และข้อใดยังมีหลักฐานน้อย (อ่านจากข้อมูลกิจกรรมที่ใช้งานอยู่ในระบบ)
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.6rem', marginBottom: '1rem' }}>
        <Stat label="ตัวบ่งชี้ทั้งหมด" value={rows.length} />
        <Stat label="กิจกรรมทั้งหมด" value={actCount} />
        <Stat label="ตัวบ่งชี้ที่มีกิจกรรมรองรับ" value={`${indWithAct}/${rows.length}`} color={indWithAct === rows.length ? '#059669' : '#d97706'} />
        <Stat label="ความสามารถที่มีกิจกรรมรองรับ" value={`${compCovered}/${comps.length}`} color={compCovered === comps.length ? '#059669' : '#d97706'} />
        <Stat label="ความสามารถที่หลักฐานน้อย (0–1 กิจกรรม)" value={compWeak.length} color={compWeak.length ? '#dc2626' : '#059669'} />
      </div>

      <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap', marginBottom: '.8rem' }}>
        {[{ id: 'all', label: 'ทุกด้าน' }, ...Object.entries(domainMeta).map(([id, d]) => ({ id, label: `${d.emoji} ${d.label}` }))].map(t => (
          <button key={t.id} type="button" onClick={() => setDomainFilter(t.id)} style={{
            padding: '.3rem .8rem', borderRadius: '999px', border: '1px solid #d1d5db', cursor: 'pointer', fontFamily: 'inherit',
            fontSize: '.78rem', fontWeight: domainFilter === t.id ? 700 : 500,
            background: domainFilter === t.id ? '#4f46e5' : '#fff', color: domainFilter === t.id ? '#fff' : '#374151',
          }}>{t.label}</button>
        ))}
      </div>

      {/* แผนภูมิ 1: กิจกรรมต่อตัวบ่งชี้ */}
      <div style={card}>
        <h3 style={h3}>📊 จำนวนกิจกรรมต่อตัวบ่งชี้</h3>
        {shown.map(({ ind, acts }) => (
          <Bar key={ind.id} label={noKor(ind.indicatorCode)}
            sub={noKor(String(ind.label).replace(/^ตัวบ่งชี้\s*[\d.ข]+\s*/, ''))}
            value={acts.length} max={maxActs} color={domainMeta[ind.domainId]?.color ?? '#6366f1'} />
        ))}
        {!shown.length && <div style={{ color: '#9ca3af', fontSize: '.8rem' }}>ไม่มีข้อมูล</div>}
      </div>

      {/* ตาราง 1: ตัวบ่งชี้ → รายการ → กิจกรรม */}
      <div style={{ ...card, overflowX: 'auto' }}>
        <h3 style={h3}>📋 ตารางตัวบ่งชี้ → กิจกรรม</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={th}>ด้าน</th><th style={th}>รหัส</th><th style={{ ...th, textAlign: 'left' }}>ตัวบ่งชี้</th>
              <th style={th}>รายการ</th><th style={th}>กิจกรรม</th><th style={{ ...th, textAlign: 'left' }}>กิจกรรม (ลำดับ — ชื่อ)</th>
            </tr>
          </thead>
          <tbody>
            {shown.map(({ ind, acts, itemCount }) => {
              const dm = domainMeta[ind.domainId];
              return (
                <tr key={ind.id} style={{ background: acts.length ? undefined : '#fef2f2' }}>
                  <td style={{ ...td, background: dm?.bg, whiteSpace: 'nowrap' }}>{dm?.emoji} {dm?.label}</td>
                  <td style={{ ...td, textAlign: 'center', fontWeight: 800, color: dm?.color }}>{noKor(ind.indicatorCode)}</td>
                  <td style={td}>{noKor(ind.label)}</td>
                  <td style={{ ...td, textAlign: 'center' }}>{itemCount}</td>
                  <td style={{ ...td, textAlign: 'center', fontWeight: 700, color: acts.length ? '#111827' : '#dc2626' }}>{acts.length}</td>
                  <td style={td}>
                    {acts.length ? acts.map(a => (
                      <div key={a.id} style={{ marginBottom: 2 }}>
                        <span style={{ display: 'inline-block', minWidth: 22, textAlign: 'center', background: '#eef2ff', color: '#4338ca', borderRadius: 4, fontWeight: 700, marginRight: 6, padding: '0 4px' }}>{a.no}</span>
                        {a.label}
                      </div>
                    )) : <span style={{ color: '#dc2626' }}>ยังไม่มีกิจกรรม</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* แผนภูมิ 2: กิจกรรมต่อความสามารถ */}
      <div style={card}>
        <h3 style={h3}>🎯 จำนวนกิจกรรมต่อความสามารถผู้เรียน (33 ข้อ)</h3>
        <div style={{ fontSize: '.72rem', color: '#6b7280', marginBottom: '.4rem' }}>
          สีแดง = ยังไม่มีกิจกรรม · สีเหลือง = 1 กิจกรรม (หลักฐานน้อย) · สีเขียว = ตั้งแต่ 2 กิจกรรมขึ้นไป
        </div>
        {comps.map(c => (
          <Bar key={c.code} label={c.code} sub={c.label} value={c.acts.length} max={maxCompActs}
            color={c.acts.length === 0 ? '#dc2626' : c.acts.length === 1 ? '#f59e0b' : (compDomainColor[c.domainId] ?? '#10b981')} />
        ))}
      </div>

      {/* ตารางแมทริกซ์: ตัวบ่งชี้ × ความสามารถ */}
      <div style={{ ...card, overflowX: 'auto' }}>
        <h3 style={h3}>🔗 แมทริกซ์ ตัวบ่งชี้ × ความสามารถผู้เรียน</h3>
        <div style={{ fontSize: '.72rem', color: '#6b7280', marginBottom: '.4rem' }}>
          ตัวเลข = จำนวนกิจกรรมของตัวบ่งชี้นั้นที่รองรับความสามารถข้อนั้น (เชื่อมผ่านกิจกรรม)
        </div>
        <table style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ ...th, position: 'sticky', left: 0, zIndex: 1 }}>ตัวบ่งชี้</th>
              {comps.map(c => <th key={c.code} style={{ ...th, color: compDomainColor[c.domainId] }} title={c.label}>{c.code}</th>)}
            </tr>
          </thead>
          <tbody>
            {shown.map(({ ind, acts }) => {
              const nos = new Set(acts.map(a => String(a.no)));
              return (
                <tr key={ind.id}>
                  <td style={{ ...td, position: 'sticky', left: 0, background: '#fff', fontWeight: 700, whiteSpace: 'nowrap' }}>{noKor(ind.indicatorCode)}</td>
                  {comps.map(c => {
                    const n = c.acts.filter(a => nos.has(a)).length;
                    return <td key={c.code} style={{ ...td, textAlign: 'center', padding: '3px 0', minWidth: 28, background: heat(n), color: n >= 2 ? '#fff' : '#065f46', fontWeight: 700 }}>{n || ''}</td>;
                  })}
                </tr>
              );
            })}
            <tr>
              <td style={{ ...td, position: 'sticky', left: 0, background: '#f3f4f6', fontWeight: 800 }}>รวมกิจกรรม</td>
              {comps.map(c => <td key={c.code} style={{ ...td, textAlign: 'center', padding: '3px 0', background: '#f3f4f6', fontWeight: 800, color: c.acts.length ? '#111827' : '#dc2626' }}>{c.acts.length}</td>)}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
