// HighlightsSection.jsx — จุดเด่นและความสามารถผู้เรียน (2 ภาคเรียน)
// Used in: StudentReportTab → activeSection === 'highlights'
//
// Props:
//   highlights    – { combined: { term1: { teacher: string }, term2: { teacher: string } } }
//   saveHighlight – (rowKey, termKey, role, value) => void

const DOMAIN_LABELS = [
  '๑. ด้านสุขภาวะทางกาย',
  '๒. ด้านอารมณ์ จิตใจ และสังคม',
  '๓. ด้านความเป็นพลเมืองและความเป็นไทย',
  '๔. ด้านสติปัญญา',
];

const HL_BG   = { background: '#fefce8', border: '1.5px solid #fde68a', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.5rem' };
const TBL_S   = { width: '100%', borderCollapse: 'collapse', fontSize: '.82rem', marginTop: '.75rem' };
const HDR_TD  = { padding: '8px 10px', border: '1px solid #374151', background: '#f3f4f6', fontWeight: 700, textAlign: 'center', fontSize: '.8rem' };
const BODY_TH = { padding: '8px 10px', border: '1px solid #d1d5db', fontWeight: 600, fontSize: '.8rem', verticalAlign: 'middle', background: '#f9fafb', width: '32%' };
const CELL_TEACHER = { padding: '6px 8px', border: '2px solid #ef4444', verticalAlign: 'top', background: '#fff5f5' };

const TA_STYLE = {
  width: '100%', border: 'none', outline: 'none', resize: 'vertical',
  fontFamily: 'inherit', fontSize: '.82rem', lineHeight: 1.6,
  background: 'transparent', color: '#374151', minHeight: '120px',
};

export default function HighlightsSection({ highlights = {}, saveHighlight }) {
  return (
    <div>
      <div style={{ fontWeight: 800, fontSize: '.9rem', color: '#111', marginBottom: '1rem' }}>
        ✨ จุดเด่นและความสามารถผู้เรียน — บันทึกทั้ง 2 ภาคเรียน
      </div>
      <p style={{ fontSize: '.78rem', color: '#6b7280', marginBottom: '1rem' }}>
        ข้อมูลที่บันทึกจะปรากฏในการพิมพ์รายงาน อ.01 ส่วน "จุดเด่นและความสามารถผู้เรียน"
      </p>

      {[1, 2].map(term => {
        const termKey = `term${term}`;
        const termTh  = term === 1 ? '๑' : '๒';
        const value   = highlights['combined']?.[termKey]?.teacher ?? '';
        return (
          <div key={term} style={HL_BG}>
            <div style={{ fontWeight: 800, fontSize: '.88rem', color: '#92400e', marginBottom: '.75rem' }}>
              📋 ภาคเรียนที่ {termTh}
            </div>
            <table style={TBL_S}>
              <colgroup>
                <col style={{ width: '32%' }} />
                <col style={{ width: '68%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th style={HDR_TD}>ความสามารถผู้เรียน</th>
                  <th style={HDR_TD}>ความคิดเห็นครูประจำชั้น (จุดเด่น)</th>
                </tr>
              </thead>
              <tbody>
                {/* Row 1: domain label + rowspan textarea */}
                <tr>
                  <td style={BODY_TH}>{DOMAIN_LABELS[0]}</td>
                  <td style={CELL_TEACHER} rowSpan={4}>
                    <textarea
                      value={value}
                      onChange={e => saveHighlight('combined', termKey, 'teacher', e.target.value)}
                      placeholder="บันทึกจุดเด่นและความสามารถผู้เรียนในทุกด้าน..."
                      style={TA_STYLE}
                    />
                  </td>
                </tr>
                {/* Rows 2-4: domain labels only */}
                {DOMAIN_LABELS.slice(1).map((label, i) => (
                  <tr key={i}>
                    <td style={BODY_TH}>{label}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
