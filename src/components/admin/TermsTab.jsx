// TermsTab.jsx — ตั้งค่าวันเปิดและปิดเรียนแต่ละภาคเรียน
import { useState } from 'react';
import { useApp } from '../../context/AppContext';

const TERM_COLORS = [
  { bg: '#eff6ff', border: '#bfdbfe', color: '#1d4ed8', accent: '#3b82f6' },
  { bg: '#f0fdf4', border: '#bbf7d0', color: '#15803d', accent: '#22c55e' },
];

function toThaiDate(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  const MONTHS = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.',
                  'ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
  return `${parseInt(d)} ${MONTHS[parseInt(m)-1]} ${parseInt(y)+543}`;
}

function daysBetween(start, end) {
  if (!start || !end) return null;
  const ms = new Date(end) - new Date(start);
  return Math.round(ms / 86400000);
}

export default function TermsTab() {
  const { schoolTerms, setSchoolTerms, academicYear } = useApp();
  const [editing, setEditing] = useState(null); // { termIdx, field }

  const terms = schoolTerms?.[academicYear] ?? [
    { label: 'ภาคเรียนที่ 1', open: '', close: '' },
    { label: 'ภาคเรียนที่ 2', open: '', close: '' },
  ];

  const updateTerm = (idx, field, value) => {
    const next = terms.map((t, i) => i === idx ? { ...t, [field]: value } : t);
    setSchoolTerms(prev => ({ ...(prev ?? {}), [academicYear]: next }));
  };

  const addTerm = () => {
    const next = [...terms, { label: `ภาคเรียนที่ ${terms.length + 1}`, open: '', close: '' }];
    setSchoolTerms(prev => ({ ...(prev ?? {}), [academicYear]: next }));
  };

  const removeTerm = (idx) => {
    if (!confirm('ลบภาคเรียนนี้?')) return;
    const next = terms.filter((_, i) => i !== idx);
    setSchoolTerms(prev => ({ ...(prev ?? {}), [academicYear]: next }));
  };

  return (
    <div className="glass p-6 animate-fade">
      <div className="page-header mb-6">
        <div>
          <h3>📅 วันเปิด-ปิดเรียน ปีการศึกษา {academicYear}</h3>
          <div className="text-xs text-muted mt-1">ตั้งค่าวันเปิดและปิดเรียนแต่ละภาคเรียน</div>
        </div>
        <button className="btn btn-primary" onClick={addTerm}>+ เพิ่มภาคเรียน</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {terms.map((term, idx) => {
          const c = TERM_COLORS[idx % TERM_COLORS.length];
          const days = daysBetween(term.open, term.close);
          return (
            <div key={idx} style={{
              background: c.bg, border: `2px solid ${c.border}`,
              borderRadius: '16px', padding: '1.25rem 1.5rem',
              borderLeft: `5px solid ${c.accent}`,
            }}>
              {/* Term header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>{idx === 0 ? '🌞' : '🌙'}</span>
                  <div>
                    <input
                      className="input"
                      value={term.label}
                      onChange={e => updateTerm(idx, 'label', e.target.value)}
                      style={{ fontWeight: 800, fontSize: '1rem', color: c.color,
                               background: 'transparent', border: 'none', padding: 0,
                               width: 'auto', minWidth: '120px', outline: 'none' }}
                    />
                    {days !== null && days > 0 && (
                      <div style={{ fontSize: '.72rem', color: c.color, opacity: .75 }}>
                        {days} วัน ({Math.round(days / 7)} สัปดาห์)
                      </div>
                    )}
                  </div>
                </div>
                {terms.length > 1 && (
                  <button type="button" className="btn btn-sm" style={{ color: 'var(--danger)' }}
                    onClick={() => removeTerm(idx)}>ลบ</button>
                )}
              </div>

              {/* Date fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '.35rem', fontWeight: 700,
                                  fontSize: '.8rem', color: c.color }}>
                    📖 วันเปิดเรียน
                  </label>
                  <input
                    type="date"
                    className="input"
                    value={term.open}
                    onChange={e => updateTerm(idx, 'open', e.target.value)}
                    style={{ borderColor: c.border }}
                  />
                  {term.open && (
                    <div style={{ fontSize: '.72rem', color: c.color, marginTop: '.3rem' }}>
                      {toThaiDate(term.open)}
                    </div>
                  )}
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '.35rem', fontWeight: 700,
                                  fontSize: '.8rem', color: c.color }}>
                    🔚 วันปิดเรียน
                  </label>
                  <input
                    type="date"
                    className="input"
                    value={term.close}
                    onChange={e => updateTerm(idx, 'close', e.target.value)}
                    min={term.open || undefined}
                    style={{ borderColor: c.border }}
                  />
                  {term.close && (
                    <div style={{ fontSize: '.72rem', color: c.color, marginTop: '.3rem' }}>
                      {toThaiDate(term.close)}
                    </div>
                  )}
                </div>
              </div>

              {/* Status badge */}
              {term.open && term.close && (() => {
                const today = new Date().toISOString().slice(0,10);
                const isActive = today >= term.open && today <= term.close;
                const isPast   = today > term.close;
                const isFuture = today < term.open;
                return (
                  <div style={{ marginTop: '.75rem' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '.35rem',
                      padding: '.25rem .8rem', borderRadius: '999px', fontSize: '.72rem', fontWeight: 700,
                      background: isActive ? '#dcfce7' : isPast ? '#f1f5f9' : '#fef3c7',
                      color: isActive ? '#15803d' : isPast ? '#64748b' : '#92400e',
                    }}>
                      {isActive ? '✅ กำลังเรียน' : isPast ? '⏹ สิ้นสุดแล้ว' : '⏳ ยังไม่เริ่ม'}
                    </span>
                  </div>
                );
              })()}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      {terms.some(t => t.open && t.close) && (
        <div style={{
          marginTop: '1.5rem', padding: '1rem 1.25rem',
          background: '#f8fafc', border: '1.5px solid #e2e8f0',
          borderRadius: '12px',
        }}>
          <div style={{ fontWeight: 700, marginBottom: '.6rem', fontSize: '.85rem' }}>
            📊 สรุปภาคเรียน ปีการศึกษา {academicYear}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.35rem' }}>
            {terms.filter(t => t.open && t.close).map((t, i) => (
              <div key={i} style={{ fontSize: '.8rem', color: '#374151', display: 'flex', gap: '.5rem', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, minWidth: '100px' }}>{t.label}</span>
                <span>{toThaiDate(t.open)}</span>
                <span style={{ color: '#9ca3af' }}>ถึง</span>
                <span>{toThaiDate(t.close)}</span>
                {daysBetween(t.open, t.close) && (
                  <span style={{ color: '#6b7280', fontSize: '.72rem' }}>
                    ({daysBetween(t.open, t.close)} วัน)
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
