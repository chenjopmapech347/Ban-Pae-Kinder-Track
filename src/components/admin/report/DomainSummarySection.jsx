// DomainSummarySection.jsx — 4-domain yearly summary table + bar chart
// Used in: StudentReportTab → activeSection === 'domain4'
//
// Props:
//   devDomains    – array of domain objects with standards/indicators/scores
//   academicYear  – string, e.g. '2567'

import { levelColor } from './reportHelpers';

export default function DomainSummarySection({ devDomains = [], academicYear = '' }) {
  const uiData = devDomains.map(domain => {
    const allInds = domain.standards.flatMap(std => std.indicators);
    const t1 = allInds.map(i => i.indScores?.term1).filter(v => v !== null && v !== undefined);
    const t2 = allInds.map(i => i.indScores?.term2).filter(v => v !== null && v !== undefined);
    const avg1 = t1.length ? t1.reduce((a, b) => a + b, 0) / t1.length : null;
    const avg2 = t2.length ? t2.reduce((a, b) => a + b, 0) / t2.length : null;
    const avgY = avg2 !== null ? avg2 : avg1;
    return { label: domain.label, emoji: domain.emoji, avg1, avg2, avgY };
  });

  const vals1 = uiData.map(d => d.avg1).filter(v => v !== null);
  const vals2 = uiData.map(d => d.avg2).filter(v => v !== null);
  const oAvg1 = vals1.length ? vals1.reduce((a, b) => a + b, 0) / vals1.length : null;
  const oAvg2 = vals2.length ? vals2.reduce((a, b) => a + b, 0) / vals2.length : null;
  const oAvgY = oAvg2 !== null ? oAvg2 : oAvg1;

  const toLevel = avg => avg === null ? 0 : avg >= 2.5 ? 3 : avg >= 1.5 ? 2 : 1;
  const fmt     = v  => v !== null ? v.toFixed(2) : '—';

  const scoreCellStyle = avg => {
    const lc = levelColor(toLevel(avg));
    return {
      padding: '9px 14px', border: '1px solid #e5e7eb', textAlign: 'center', fontWeight: 700,
      background: avg !== null ? lc.bg : 'white',
      color: avg !== null ? lc.color : '#9ca3af',
    };
  };

  const BAR_H = 130;
  const pct   = v => v !== null ? Math.max(3, Math.round((v / 3) * BAR_H)) : 0;

  const chartGroups = [
    ...uiData.map((d, i) => ({ ...d, shortLabel: `${i + 1}. ด้าน${d.label}`, isOverall: false })),
    { label: 'สรุปเฉลี่ยรวม', emoji: '⭐', avg1: oAvg1, avg2: oAvg2, avgY: oAvgY,
      shortLabel: 'สรุปเฉลี่ยรวมทุกด้าน', isOverall: true },
  ];

  return (
    <>
      {/* ──── Summary table ──── */}
      <div style={{ marginBottom: '1.5rem', overflowX: 'auto' }}>
        <div style={{ fontSize: '.78rem', fontWeight: 800, color: '#6d28d9', marginBottom: '.5rem' }}>
          📊 สรุปความสามารถผู้เรียนทั้ง ๔ ด้าน เมื่อจบชั้นปี
        </div>
        <table style={{ borderCollapse: 'collapse', fontSize: '.84rem', width: '100%', maxWidth: '620px' }}>
          <thead>
            <tr style={{ background: '#ede9fe' }}>
              <th style={{ padding: '9px 16px', border: '1px solid #ddd6fe', textAlign: 'left',
                minWidth: '190px', color: '#5b21b6', fontWeight: 800 }}>ด้านพัฒนาการ</th>
              <th style={{ padding: '9px 14px', border: '1px solid #ddd6fe', textAlign: 'center',
                width: '110px', color: '#1d4ed8', fontWeight: 800 }}>ภาคเรียนที่ ๑</th>
              <th style={{ padding: '9px 14px', border: '1px solid #ddd6fe', textAlign: 'center',
                width: '110px', color: '#b45309', fontWeight: 800 }}>ภาคเรียนที่ ๒</th>
              <th style={{ padding: '9px 14px', border: '1px solid #ddd6fe', textAlign: 'center',
                width: '120px', color: '#374151', fontWeight: 800 }}>สรุปปี {academicYear}</th>
            </tr>
          </thead>
          <tbody>
            {uiData.map((d, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                <td style={{ padding: '9px 16px', border: '1px solid #e5e7eb', fontWeight: 600 }}>
                  {d.emoji} ด้าน{d.label}
                </td>
                <td style={scoreCellStyle(d.avg1)}>{fmt(d.avg1)}</td>
                <td style={scoreCellStyle(d.avg2)}>{fmt(d.avg2)}</td>
                <td style={scoreCellStyle(d.avgY)}>{fmt(d.avgY)}</td>
              </tr>
            ))}
            <tr style={{ background: '#f3f4f6' }}>
              <td style={{ padding: '9px 16px', border: '1px solid #e5e7eb', fontWeight: 800 }}>
                ⭐ สรุปผลการประเมินเฉลี่ยรวมทุกด้าน
              </td>
              <td style={{ ...scoreCellStyle(oAvg1), fontWeight: 800 }}>{fmt(oAvg1)}</td>
              <td style={{ ...scoreCellStyle(oAvg2), fontWeight: 800 }}>{fmt(oAvg2)}</td>
              <td style={{ ...scoreCellStyle(oAvgY), fontWeight: 800 }}>{fmt(oAvgY)}</td>
            </tr>
          </tbody>
        </table>
        <div style={{ marginTop: '.4rem', fontSize: '.7rem', color: '#6b7280' }}>
          หมายเหตุ: คะแนนเฉลี่ยจากตัวชี้วัดทั้งหมดในแต่ละด้าน (คะแนนเต็ม 3) · สรุปปีใช้ผลภาคเรียนที่ 2 เป็นหลัก
        </div>
      </div>

      {/* ──── Bar chart ──── */}
      <div style={{
        border: '1.5px solid #e5e7eb', borderRadius: '12px',
        padding: '1rem 1rem 1.1rem', background: '#fafafa', marginBottom: '1.5rem',
      }}>
        <div style={{ fontSize: '.78rem', fontWeight: 800, color: '#374151', marginBottom: '.85rem' }}>
          📈 สมรรถนะผู้เรียน
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '1.1rem', marginBottom: '.9rem', flexWrap: 'wrap' }}>
          {[
            { color: '#3b82f6', label: 'ภาคเรียนที่ ๑' },
            { color: '#f59e0b', label: 'ภาคเรียนที่ ๒' },
            { color: '#9ca3af', label: 'สรุปปี' },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '.35rem', fontSize: '.74rem' }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: color, flexShrink: 0 }} />
              <span>{label}</span>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', borderBottom: '2px solid #9ca3af', paddingBottom: 0 }}>
          {/* Y-axis ticks */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            height: BAR_H + 'px', paddingRight: '4px', flexShrink: 0 }}>
            {[3, 2, 1].map(v => (
              <div key={v} style={{ fontSize: '.62rem', color: '#9ca3af', lineHeight: 1 }}>{v}</div>
            ))}
          </div>

          {/* Bar groups */}
          {chartGroups.map((g, gi) => (
            <div key={gi} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: BAR_H + 'px' }}>
                {[
                  { avg: g.avg1, color: '#3b82f6' },
                  { avg: g.avg2, color: '#f59e0b' },
                  { avg: g.avgY, color: '#9ca3af' },
                ].map(({ avg, color }, bi) => (
                  <div key={bi} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'flex-end', height: '100%' }}>
                    {avg !== null && (
                      <div style={{ fontSize: '.58rem', color: '#374151', fontWeight: 700,
                        marginBottom: '1px', lineHeight: 1, whiteSpace: 'nowrap' }}>
                        {avg.toFixed(1)}
                      </div>
                    )}
                    <div style={{
                      width: '14px',
                      height: avg !== null ? pct(avg) + 'px' : 0,
                      background: avg !== null ? color : 'transparent',
                      borderRadius: '2px 2px 0 0',
                      minHeight: avg !== null ? '2px' : 0,
                    }} />
                  </div>
                ))}
              </div>
              {/* Group label */}
              <div style={{
                fontSize: '.6rem', textAlign: 'center', lineHeight: 1.35,
                color: g.isOverall ? '#5b21b6' : '#374151',
                fontWeight: g.isOverall ? 800 : 500,
                marginTop: '5px', maxWidth: '70px', wordBreak: 'keep-all',
                paddingBottom: '.2rem',
              }}>
                {g.shortLabel}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
