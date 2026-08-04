// DomainSummaryBox.jsx — domain-level summary textarea + AI button + avg badge
// Shown at the bottom of each domain's assessment section.
//
// Props:
//   domain        – domain object { id, label, color, bg }
//   domAvg        – integer 1–3 or 0 (precomputed from devAssessDomainAvg)
//   dsValue       – current textarea value (devAssessData[`__domainSummary_${domain.id}`])
//   aiApiKey      – truthy string when Claude API key is configured
//   loading       – boolean, true while AI is generating
//   error         – error string or empty string
//   onAiSummary   – () => void, called when ✨ button clicked
//   onSave        – (value: string) => void, called on textarea change

import { levelColor } from './reportHelpers';

export default function DomainSummaryBox({
  domain,
  domAvg = 0,
  dsValue = '',
  aiApiKey,
  loading = false,
  error = '',
  onAiSummary,
  onSave,
}) {
  const avgLabel = domAvg === 3 ? 'ดี' : domAvg === 2 ? 'พอใช้' : domAvg === 1 ? 'ปรับปรุง' : null;
  const lc = levelColor(domAvg);

  return (
    <div style={{
      marginTop: '1.25rem',
      background: `${domain.color}08`,
      border: `1.5px solid ${domain.color}35`,
      borderRadius: '10px',
      padding: '.85rem 1.1rem',
    }}>
      {/* Header row: title + AI button + avg badge */}
      <div style={{
        display: 'flex', alignItems: 'center',
        gap: '.6rem', marginBottom: '.5rem', flexWrap: 'wrap',
      }}>
        <span style={{ fontWeight: 800, fontSize: '.83rem', color: domain.color }}>
          📝 สรุปพัฒนาการด้าน{domain.label}
        </span>
        {aiApiKey && (
          <button
            type="button"
            onClick={onAiSummary}
            disabled={loading}
            style={{
              padding: '.2rem .65rem', borderRadius: '6px', border: 'none',
              background: domain.color, color: 'white', fontFamily: 'inherit',
              fontWeight: 700, fontSize: '.75rem',
              cursor: loading ? 'wait' : 'pointer',
              opacity: loading ? .65 : 1, flexShrink: 0,
            }}
          >
            {loading ? '⏳ กำลังเขียน…' : '✨ AI สรุปให้'}
          </button>
        )}

        {/* เฉลี่ยด้าน badge */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '.5rem', flexShrink: 0 }}>
          {domAvg > 0 && (
            <span style={{ fontSize: '.75rem', color: '#6b7280', fontWeight: 600 }}>
              เฉลี่ยด้าน
            </span>
          )}
          {domAvg > 0 ? (
            <span style={{
              background: lc.bg, color: lc.color,
              border: `1.5px solid ${lc.color}60`,
              borderRadius: '8px', padding: '3px 14px',
              fontWeight: 900, fontSize: '.88rem',
              minWidth: '72px', textAlign: 'center',
              display: 'inline-block',
            }}>
              {domAvg} — {avgLabel}
            </span>
          ) : (
            <span style={{
              border: '1.5px dashed #d1d5db', borderRadius: '8px',
              padding: '3px 14px', color: '#9ca3af',
              fontSize: '.78rem', minWidth: '72px', textAlign: 'center',
              display: 'inline-block',
            }}>
              ยังไม่มีข้อมูล
            </span>
          )}
        </div>
      </div>

      {error && (
        <div style={{ fontSize: '.78rem', color: '#dc2626', marginBottom: '.3rem' }}>
          ❌ {error}
        </div>
      )}

      <textarea
        value={dsValue}
        onChange={e => onSave(e.target.value)}
        rows={4}
        placeholder={`เขียนสรุปพัฒนาการด้าน${domain.label}ของนักเรียน หรือกด ✨ AI สรุปให้`}
        style={{
          width: '100%', padding: '8px 10px',
          border: `1px solid ${domain.color}50`,
          borderRadius: '8px', fontFamily: 'inherit',
          fontSize: '.82rem', lineHeight: 1.75,
          resize: 'vertical', boxSizing: 'border-box',
          background: 'white',
        }}
      />
    </div>
  );
}
