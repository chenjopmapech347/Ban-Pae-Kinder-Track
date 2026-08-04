// SubDomainSummaryBox.jsx — section-level (มาตรฐาน) summary bar
// Shown below each sub-domain block in the devAssess section.
//
// Props:
//   sub           – sub-domain object { key, label, components[] }
//   domainColor   – domain.color string (e.g. '#2563eb')
//   devAssessData – full assessment data dict

import { levelColor } from './reportHelpers';

export default function SubDomainSummaryBox({ sub, domainColor, devAssessData }) {
  const t1vals = sub.components
    .map(c => devAssessData[c.key]?.t1level ?? 0)
    .filter(v => v > 0);
  const t2vals = sub.components
    .map(c => devAssessData[c.key]?.t2level ?? 0)
    .filter(v => v > 0);

  if (!t1vals.length && !t2vals.length) return null;

  const t1avg = t1vals.length ? t1vals.reduce((a, b) => a + b, 0) / t1vals.length : 0;
  const t2avg = t2vals.length ? t2vals.reduce((a, b) => a + b, 0) / t2vals.length : 0;
  const allVals  = [...t1vals, ...t2vals];
  const combined = allVals.reduce((a, b) => a + b, 0) / allVals.length;
  const summaryLevel = combined >= 2.5 ? 3 : combined >= 1.5 ? 2 : 1;

  const lc1 = levelColor(t1vals.length ? (t1avg >= 2.5 ? 3 : t1avg >= 1.5 ? 2 : 1) : 0);
  const lc2 = levelColor(t2vals.length ? (t2avg >= 2.5 ? 3 : t2avg >= 1.5 ? 2 : 1) : 0);
  const lcs = levelColor(summaryLevel);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '.6rem',
      background: `${domainColor}12`,
      borderLeft: `4px solid ${domainColor}`,
      borderRadius: '0 8px 8px 0',
      padding: '.6rem 1rem .6rem .85rem',
      marginTop: '-.4rem',
    }}>
      <span style={{ fontSize: '.78rem', fontWeight: 800, color: domainColor, flex: '1 1 auto', whiteSpace: 'nowrap' }}>
        📊 สรุปค่ามาตรฐานนี้
      </span>

      {/* ภาคเรียน 1 */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '.63rem', color: '#64748b', fontWeight: 600, marginBottom: '2px' }}>ภาคเรียน 1</div>
        {t1vals.length ? (
          <span style={{
            background: lc1.bg, color: lc1.color,
            borderRadius: '6px', padding: '2px 9px',
            fontWeight: 800, fontSize: '.78rem', whiteSpace: 'nowrap',
          }}>
            {t1avg.toFixed(2)} · {t1avg >= 2.5 ? 'ดี' : t1avg >= 1.5 ? 'พอใช้' : 'ปรับปรุง'}
          </span>
        ) : <span style={{ color: '#9ca3af', fontSize: '.76rem' }}>—</span>}
      </div>

      {/* ภาคเรียน 2 */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '.63rem', color: '#64748b', fontWeight: 600, marginBottom: '2px' }}>ภาคเรียน 2</div>
        {t2vals.length ? (
          <span style={{
            background: lc2.bg, color: lc2.color,
            borderRadius: '6px', padding: '2px 9px',
            fontWeight: 800, fontSize: '.78rem', whiteSpace: 'nowrap',
          }}>
            {t2avg.toFixed(2)} · {t2avg >= 2.5 ? 'ดี' : t2avg >= 1.5 ? 'พอใช้' : 'ปรับปรุง'}
          </span>
        ) : <span style={{ color: '#9ca3af', fontSize: '.76rem' }}>—</span>}
      </div>

      {/* สรุประดับ */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '.63rem', color: '#64748b', fontWeight: 600, marginBottom: '2px' }}>สรุประดับ</div>
        <span style={{
          background: lcs.bg, color: lcs.color,
          borderRadius: '6px', padding: '2px 10px',
          fontWeight: 900, fontSize: '.88rem',
          border: `1.5px solid ${lcs.color}55`,
          whiteSpace: 'nowrap',
        }}>
          {summaryLevel} {summaryLevel === 3 ? 'ดี' : summaryLevel === 2 ? 'พอใช้' : 'ปรับปรุง'}
        </span>
      </div>
    </div>
  );
}
