// HighlightsSection.jsx — จุดเด่นและความสามารถผู้เรียน (2 ภาคเรียน)
// Used in: StudentReportTab → activeSection === 'highlights'
//
// Props:
//   devDomains    – full domain array (used for d4.standards.length count)
//   highlights    – { [rowKey]: { [termKey]: { teacher: string, parent: string } } }
//   saveHighlight – (rowKey, termKey, role, value) => void

const DOMAIN_LABELS = [
  'ด้านสุขภาวะทางกาย',
  'ด้านอารมณ์ จิตใจ และสังคม',
  'ด้านความเป็นพลเมืองและความเป็นไทย',
  'ด้านสติปัญญา',
];

const D4_STD_LABELS = [
  'ภาษาและการรู้หนังสือ',
  'การคิดรวบยอดและการคิดคำนวณ',
  'การคิดแก้ปัญหาและตัดสินใจ',
  'การแสวงหาความรู้',
  'จินตนาการและความคิดสร้างสรรค์',
];

const HL_BG   = { background: '#fefce8', border: '1.5px solid #fde68a', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.5rem' };
const TBL_S   = { width: '100%', borderCollapse: 'collapse', fontSize: '.82rem', marginTop: '.75rem' };
const HDR_TD  = { padding: '8px 10px', border: '1px solid #374151', background: '#f3f4f6', fontWeight: 700, textAlign: 'center', fontSize: '.8rem' };
const BODY_TH = { padding: '8px', border: '1px solid #d1d5db', fontWeight: 700, fontSize: '.8rem', verticalAlign: 'top', background: '#f9fafb', whiteSpace: 'pre-wrap', width: '26%' };
const CELL_TEACHER = { padding: '4px 6px', border: '2px solid #ef4444', verticalAlign: 'top', background: '#fff5f5' };
const CELL_PARENT  = { padding: '4px 6px', border: '2px solid #3b82f6', verticalAlign: 'top', background: '#eff6ff' };

const TA_STYLE = {
  width: '100%', border: 'none', outline: 'none', resize: 'vertical',
  fontFamily: 'inherit', fontSize: '.78rem', lineHeight: 1.5,
  background: 'transparent', color: '#374151',
};

export default function HighlightsSection({ devDomains = [], highlights = {}, saveHighlight }) {
  const d4 = devDomains[3];
  const d4StdCount = d4?.standards?.length ?? 0;

  const mainDomainRows = [
    { num: '๑', label: DOMAIN_LABELS[0], key: 'd0' },
    { num: '๒', label: DOMAIN_LABELS[1], key: 'd1' },
    { num: '๓', label: DOMAIN_LABELS[2], key: 'd2' },
  ];

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
        return (
          <div key={term} style={HL_BG}>
            <div style={{ fontWeight: 800, fontSize: '.88rem', color: '#92400e', marginBottom: '.75rem' }}>
              📋 ภาคเรียนที่ {termTh}
            </div>
            <table style={TBL_S}>
              <colgroup>
                <col style={{ width: '26%' }} />
                <col style={{ width: '42%' }} />
                <col style={{ width: '32%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th style={HDR_TD}>ความสามารถผู้เรียน</th>
                  <th style={HDR_TD}>ความคิดเห็นครูประจำชั้น (จุดเด่น)</th>
                  <th style={HDR_TD}>ความคิดเห็นผู้ปกครอง</th>
                </tr>
              </thead>
              <tbody>
                {/* domains 1–3 */}
                {mainDomainRows.map(r => (
                  <tr key={r.key}>
                    <td style={BODY_TH}>{r.num}. {r.label}</td>
                    <td style={CELL_TEACHER}>
                      <textarea
                        value={highlights[r.key]?.[termKey]?.teacher ?? ''}
                        onChange={e => saveHighlight(r.key, termKey, 'teacher', e.target.value)}
                        placeholder="จุดเด่น..."
                        rows={3}
                        style={TA_STYLE}
                      />
                    </td>
                    <td style={CELL_PARENT}>
                      <textarea
                        value={highlights[r.key]?.[termKey]?.parent ?? ''}
                        onChange={e => saveHighlight(r.key, termKey, 'parent', e.target.value)}
                        placeholder="ความเห็นผู้ปกครอง..."
                        rows={3}
                        style={TA_STYLE}
                      />
                    </td>
                  </tr>
                ))}

                {/* domain 4 header */}
                <tr>
                  <td colSpan={3} style={{ padding: '6px 8px', border: '1px solid #d1d5db', fontWeight: 800, fontSize: '.8rem', background: '#f3f4f6' }}>
                    ๔. {DOMAIN_LABELS[3]}
                  </td>
                </tr>

                {/* domain 4 sub-items */}
                {Array.from({ length: d4StdCount }).map((_, si) => {
                  const subNums = ['๔.๑', '๔.๒', '๔.๓', '๔.๔', '๔.๕'];
                  const hKey    = `d3s${si}`;
                  return (
                    <tr key={hKey}>
                      <td style={{ ...BODY_TH, paddingLeft: '20px', fontWeight: 600, fontSize: '.78rem' }}>
                        {subNums[si] ?? `๔.${si + 1}`} {D4_STD_LABELS[si] ?? ''}
                      </td>
                      <td style={CELL_TEACHER}>
                        <textarea
                          value={highlights[hKey]?.[termKey]?.teacher ?? ''}
                          onChange={e => saveHighlight(hKey, termKey, 'teacher', e.target.value)}
                          placeholder="จุดเด่น..."
                          rows={3}
                          style={TA_STYLE}
                        />
                      </td>
                      <td style={CELL_PARENT}>
                        <textarea
                          value={highlights[hKey]?.[termKey]?.parent ?? ''}
                          onChange={e => saveHighlight(hKey, termKey, 'parent', e.target.value)}
                          placeholder="ความเห็นผู้ปกครอง..."
                          rows={3}
                          style={TA_STYLE}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
