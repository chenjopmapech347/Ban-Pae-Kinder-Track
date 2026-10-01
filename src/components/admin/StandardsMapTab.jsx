// StandardsMapTab.jsx — ตารางแมปมาตรฐานการศึกษาปฐมวัย (หลักสูตรปฐมวัย 2568)

const STD68 = { label: 'ปี 68 ม.1', bg: '#fdf4ff', color: '#7e22ce', border: '#e9d5ff' };

function Tag({ text }) {
  return (
    <span style={{
      display: 'inline-block', fontSize: '.68rem', fontWeight: 700,
      padding: '2px 7px', borderRadius: '999px', margin: '2px 2px 0 0',
      background: STD68.bg, color: STD68.color, border: `1px solid ${STD68.border}`,
    }}>{STD68.label} {text}</span>
  );
}

// ── ข้อมูลตารางแมป (4 ด้าน หลักสูตรปฐมวัย 2568 — ม.1 คุณภาพเด็ก กลุ่ม ข) ──
const MAP_ROWS = [

  // ─── 1. สุขภาวะทางกาย (1.1ข, 1.6ข, 1.2ข) ──────────────────────────────
  {
    domain: '🏃 สุขภาวะทางกาย', domainColor: '#059669', domainBg: '#ecfdf5',
    rows: [
      { std68: '1.1ข น้ำหนักและส่วนสูงตามเกณฑ์มาตรฐาน' },
      { std68: '1.6ข ความปลอดภัยในชีวิตประจำวัน' },
      { std68: '1.2ข กล้ามเนื้อมัดใหญ่-มัดเล็กแข็งแรงและคล่องแคล่ว' },
    ],
    evidence: [
      'บันทึกน้ำหนัก-ส่วนสูง',
      'สมุดสุขภาพรายบุคคล',
      'บันทึกกิจกรรม GM/FM',
      'ภาพถ่ายกิจกรรมพลศึกษา',
      'บันทึกกิจกรรมความปลอดภัยและสุขอนามัย',
    ],
  },

  // ─── 2. อารมณ์ จิตใจ และสังคม (1.3ข, 1.4ข) ────────────────────────────
  {
    domain: '❤️ อารมณ์ จิตใจ และสังคม', domainColor: '#e11d48', domainBg: '#fff1f2',
    rows: [
      { std68: '1.3ข มีสุขภาวะทางอารมณ์และจิตใจที่ดี' },
      { std68: '1.3ข / 1.4ข สุขภาวะอารมณ์-จิตใจและสังคม' },
      { std68: '1.4ข มีสุขภาวะทางสังคมที่ดี' },
      { std68: '1.4ข มีสุขภาวะทางสังคมที่ดี' },
      { std68: '1.4ข มีสุขภาวะทางสังคมที่ดี' },
    ],
    evidence: [
      'บันทึกพฤติกรรมเด็ก',
      'แผนการจัดประสบการณ์ด้านอารมณ์-สังคม',
      'แบบสังเกตพฤติกรรม',
      'ภาพถ่ายกิจกรรมกลุ่ม',
      'แฟ้มสะสมผลงาน',
    ],
  },

  // ─── 3. ความเป็นพลเมืองและความเป็นไทย (1.7ข) ──────────────────────────
  {
    domain: '🇹🇭 ความเป็นพลเมืองและความเป็นไทย', domainColor: '#1d4ed8', domainBg: '#eff6ff',
    rows: [
      { std68: '1.7ข คุณธรรม จริยธรรม จิตสำนึกสาธารณะ และความภูมิใจในความเป็นไทย' },
      { std68: '1.7ข จิตสำนึกสาธารณะ รักและภูมิใจในความเป็นไทย ดูแลสิ่งแวดล้อม' },
    ],
    evidence: [
      'บันทึกพฤติกรรมคุณธรรม',
      'กิจกรรมวัฒนธรรมไทย',
      'บันทึกการทำความดี',
      'ภาพถ่ายกิจกรรมจิตสาธารณะ',
      'ภาพถ่ายกิจกรรมดูแลสิ่งแวดล้อม',
    ],
  },

  // ─── 4. สติปัญญา (1.5ข) ─────────────────────────────────────────────────
  {
    domain: '💡 สติปัญญา', domainColor: '#b45309', domainBg: '#fffbeb',
    rows: [
      { std68: '1.5ข ภาษาสื่อสารและทักษะการอ่าน-เขียนพื้นฐาน' },
      { std68: '1.5ข การคิดและแก้ปัญหาเบื้องต้น' },
      { std68: '1.5ข จินตนาการและความคิดสร้างสรรค์' },
    ],
    evidence: [
      'บันทึกคำพูด-คำถามเด็ก',
      'บันทึกกิจกรรมอ่านและเล่านิทาน',
      'ชิ้นงานเด็ก (วาด ปั้น ขีดเขียน ตัวอักษร)',
      'แฟ้มสะสมผลงาน',
      'วีดิทัศน์กิจกรรมคิด-สร้างสรรค์',
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────

export default function StandardsMapTab() {
  return (
    <div className="glass p-6 animate-fade">
      <div className="page-header mb-4">
        <h3>📋 มาตรฐานการศึกษาปฐมวัย</h3>
      </div>

      <div style={{ fontSize: '.78rem', color: 'var(--text-muted)', marginBottom: '1rem', background: '#f5f3ff', border: '1px solid #c4b5fd', borderRadius: '8px', padding: '.65rem 1rem' }}>
        ✨ <strong>หลักสูตรปฐมวัย 2568 (ปี 68)</strong> ใช้ทดแทนมาตรฐาน ดย. · หลักสูตรปฐมวัย 2560 · และ สมศ. — หลักฐานจากกิจกรรมเดียวกันสามารถใช้รายงานต่อมาตรฐานใหม่ ปี 68 ได้ทั้งหมด
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.8rem' }}>
          <thead>
            <tr>
              <th style={{ background: '#1e40af', color: 'white', padding: '.6rem .85rem', textAlign: 'center', width: '7%', verticalAlign: 'middle' }}>ด้าน</th>
              <th style={{ background: '#7e22ce', color: 'white', padding: '.6rem .85rem', textAlign: 'center', width: '30%', verticalAlign: 'middle', lineHeight: 1.4 }}>
                ✨ หลักสูตรปฐมวัย 2568<br/><span style={{ fontSize: '.7rem', fontWeight: 400 }}>(ม.1 คุณภาพเด็ก กลุ่ม ข)</span>
              </th>
              <th style={{ background: '#374151', color: 'white', padding: '.6rem .85rem', textAlign: 'center', verticalAlign: 'middle' }}>หลักฐานร่วม</th>
            </tr>
          </thead>
          <tbody>
            {MAP_ROWS.map((domain, di) =>
              domain.rows.map((row, ri) => (
                <tr key={`${di}-${ri}`} style={{ background: ri % 2 === 0 ? domain.domainBg : 'white' }}>
                  {ri === 0 && (
                    <td
                      rowSpan={domain.rows.length}
                      style={{
                        background: domain.domainColor, color: 'white', fontWeight: 800,
                        fontSize: '.75rem', textAlign: 'center', padding: '.5rem .6rem',
                        verticalAlign: 'middle', whiteSpace: 'nowrap',
                      }}
                    >
                      {domain.domain}
                    </td>
                  )}
                  <td style={{ padding: '.55rem .75rem', borderBottom: '1px solid #e5e7eb', verticalAlign: 'top', whiteSpace: 'normal' }}>
                    {row.std68 && <Tag text={row.std68} />}
                  </td>
                  {ri === 0 && (
                    <td
                      rowSpan={domain.rows.length}
                      style={{ padding: '.55rem .75rem', borderBottom: '1px solid #e5e7eb', verticalAlign: 'top', fontSize: '.72rem', color: '#6b7280' }}
                    >
                      {domain.evidence.map((e, i) => <div key={i}>• {e}</div>)}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
