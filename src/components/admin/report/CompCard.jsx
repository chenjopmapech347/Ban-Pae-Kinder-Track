// CompCard.jsx — individual development-assessment indicator card
// Used in: StudentReportTab → devAssess section, per-domain loop
//
// Props:
//   comp          – indicator object { key, code, label, descriptor, domainId, standardId, indicatorId }
//   ci            – row index (0-based, used for alternating background)
//   domain        – parent domain object { id, color, bg, label, emoji }
//   devAssessData – full assessment data dict { [comp.key]: { t1level, t2level, summary } }
//   student       – student object (passed to rawScoreFromIndicator)
//   saveRec       – (patch) => void — merges patch into the student record in Firestore

import { levelColor, rawScoreFromIndicator } from './reportHelpers';

export default function CompCard({ comp, ci, domain, devAssessData, student, saveRec }) {
  const da  = devAssessData[comp.key] ?? {};
  const t1v = da.t1level ?? 0;
  const t2v = da.t2level ?? 0;
  const lc1 = levelColor(t1v);
  const lc2 = levelColor(t2v);

  const raw1 = rawScoreFromIndicator(student, comp.domainId, comp.standardId, comp.indicatorId, 1);
  const raw2 = rawScoreFromIndicator(student, comp.domainId, comp.standardId, comp.indicatorId, 2);
  const rlc1 = raw1 !== null ? levelColor(raw1 >= 2.5 ? 3 : raw1 >= 1.5 ? 2 : 1) : null;
  const rlc2 = raw2 !== null ? levelColor(raw2 >= 2.5 ? 3 : raw2 >= 1.5 ? 2 : 1) : null;

  const filledVals = [t1v, t2v].filter(v => v > 0);
  const avgLevel   = filledVals.length ? filledVals.reduce((a, b) => a + b, 0) / filledVals.length : 0;
  const summaryInt = avgLevel >= 2.5 ? 3 : avgLevel >= 1.5 ? 2 : avgLevel > 0 ? 1 : 0;
  const lcs        = levelColor(summaryInt);
  const avgLabel   = summaryInt === 3 ? 'ดี' : summaryInt === 2 ? 'พอใช้' : summaryInt === 1 ? 'ปรับปรุง' : null;

  const onChangeT1 = e => {
    const newT1 = Number(e.target.value);
    const vals  = [newT1, t2v].filter(v => v > 0);
    const avg   = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    const newSummary = avg >= 2.5 ? 3 : avg >= 1.5 ? 2 : avg > 0 ? 1 : 0;
    const cur = devAssessData[comp.key] ?? {};
    saveRec({ devAssessment: { ...devAssessData, [comp.key]: { ...cur, t1level: newT1, summary: newSummary } } });
  };

  const onChangeT2 = e => {
    const newT2 = Number(e.target.value);
    const vals  = [t1v, newT2].filter(v => v > 0);
    const avg   = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    const newSummary = avg >= 2.5 ? 3 : avg >= 1.5 ? 2 : avg > 0 ? 1 : 0;
    const cur = devAssessData[comp.key] ?? {};
    saveRec({ devAssessment: { ...devAssessData, [comp.key]: { ...cur, t2level: newT2, summary: newSummary } } });
  };

  const rowBg = ci % 2 === 0 ? 'white' : '#fafafa';

  return (
    <div style={{
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

        {/* ภาคเรียนที่ 1 */}
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
            style={{ width: '100%', padding: '5px 8px', border: '1px solid #d1d5db', borderRadius: '6px',
              fontFamily: 'inherit', fontSize: '.8rem', background: lc1.bg, color: lc1.color, fontWeight: 700 }}>
            <option value={0}>— ระดับ —</option>
            <option value={3}>3  ดี</option>
            <option value={2}>2  พอใช้</option>
            <option value={1}>1  ปรับปรุง</option>
          </select>
        </div>

        {/* ภาคเรียนที่ 2 */}
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
            style={{ width: '100%', padding: '5px 8px', border: '1px solid #d1d5db', borderRadius: '6px',
              fontFamily: 'inherit', fontSize: '.8rem', background: lc2.bg, color: lc2.color, fontWeight: 700 }}>
            <option value={0}>— ระดับ —</option>
            <option value={3}>3  ดี</option>
            <option value={2}>2  พอใช้</option>
            <option value={1}>1  ปรับปรุง</option>
          </select>
        </div>

        {/* สรุประดับ */}
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
}
