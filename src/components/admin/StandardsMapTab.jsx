// StandardsMapTab.jsx — ตารางแมปเชื่อมโยงมาตรฐานการศึกษาปฐมวัย
// หลักสูตรปฐมวัย 2568 (ปี 68) ทดแทน ดย. (3.x–6.x) · หลักสูตรปฐมวัย 2560 · สมศ.
import { useState } from 'react';

// ── สีและ style สำหรับแต่ละกรอบ ──────────────────────────────────────────
const FRAME = {
  dcy:      { label: 'ดย.',       full: 'กรมกิจการเด็กและเยาวชน (มาตรฐานเดิม)',              bg: '#dbeafe', color: '#1e40af', border: '#93c5fd' },
  cur:      { label: 'ปวัย.2560', full: 'หลักสูตรการศึกษาปฐมวัย พ.ศ. 2560 (มาตรฐานเดิม)',   bg: '#dcfce7', color: '#15803d', border: '#86efac' },
  onesqa:   { label: 'สมศ.',      full: 'สำนักงานรับรองมาตรฐานฯ สมศ. (มาตรฐานเดิม)',        bg: '#ffedd5', color: '#c2410c', border: '#fdba74' },
  std68:    { label: 'ปี 68 ม.1', full: 'หลักสูตรปฐมวัย 2568 (ปี 68) — ทดแทนมาตรฐานเดิมทั้ง 3 กรอบข้างต้น', bg: '#fdf4ff', color: '#7e22ce', border: '#e9d5ff' },
};

function Tag({ type, text }) {
  const f = FRAME[type];
  return (
    <span style={{
      display: 'inline-block', fontSize: '.68rem', fontWeight: 700,
      padding: '2px 7px', borderRadius: '999px', margin: '2px 2px 0 0',
      background: f.bg, color: f.color, border: `1px solid ${f.border}`,
      whiteSpace: 'nowrap',
    }}>{f.label} {text}</span>
  );
}

// ── ข้อมูลตารางแมป ────────────────────────────────────────────────────────
const MAP_ROWS = [
  // ร่างกาย
  {
    domain: '🏃 ร่างกาย', domainColor: '#059669', domainBg: '#ecfdf5',
    evidenceBg: '#f0fdf4',
    rows: [
      { dcy: { code: '3.1', desc: 'น้ำหนักและส่วนสูงตามเกณฑ์กรมอนามัย' },
        cur: [{ code: '1', desc: 'ร่างกายเจริญเติบโตตามวัยและมีสุขนิสัยที่ดี' }],
        onesqa: '1.1', std68: '1.1ข น้ำหนักและส่วนสูงตามเกณฑ์' },
      { dcy: { code: '3.2', desc: 'มีสุขภาพอนามัยที่ดีและมีสุขนิสัยที่ดี' },
        cur: [{ code: '1', desc: 'ตัวบ่งชี้ 1.2–1.3 สุขนิสัย ความปลอดภัย' }],
        onesqa: '1.1', std68: '1.6ข ความปลอดภัยในชีวิตประจำวัน' },
      { dcy: { code: '3.3', desc: 'มีทักษะการเคลื่อนไหวตามวัย (GM/FM)' },
        cur: [{ code: '2', desc: 'กล้ามเนื้อใหญ่และกล้ามเนื้อเล็กแข็งแรง คล่องแคล่ว' }],
        onesqa: '1.1', std68: '1.2ข กล้ามเนื้อมัดใหญ่และมัดเล็ก' },
    ],
    evidence: ['บันทึกน้ำหนัก-ส่วนสูง', 'สมุดสุขภาพรายบุคคล', 'บันทึกกิจกรรม GM/FM', 'ภาพถ่ายกิจกรรมพลศึกษา'],
  },
  // อารมณ์-จิตใจ
  {
    domain: '❤️ อารมณ์-จิตใจ', domainColor: '#e11d48', domainBg: '#fff1f2',
    evidenceBg: '#fdf4ff',
    rows: [
      { dcy: { code: '4.1', desc: 'มีสุขภาพจิตดี มีความสุข ร่าเริงแจ่มใส' },
        cur: [{ code: '3', desc: 'มีสุขภาพจิตดีและมีความสุข' }],
        onesqa: '1.4', std68: '1.3ข สุขภาวะอารมณ์-จิตใจ' },
      { dcy: { code: '4.2', desc: 'มีคุณธรรม จริยธรรม และจิตใจที่ดีงาม' },
        cur: [{ code: '4', desc: 'ชื่นชมและแสดงออกทางศิลปะ ดนตรี การเคลื่อนไหว' },
              { code: '5', desc: 'มีคุณธรรม จริยธรรม และจิตใจที่ดีงาม' }],
        onesqa: '1.4', std68: '1.7ข คุณธรรม จริยธรรม และจิตสาธารณะ' },
      { dcy: { code: '4.3', desc: 'เล่นอิสระ เล่นสมมติ ทำตามกฎกติกา (PS)' },
        cur: [{ code: '3', desc: 'ตัวบ่งชี้ 3.1–3.2' }],
        onesqa: '1.4', std68: '1.3ข / 1.4ข สุขภาวะอารมณ์-สังคม' },
    ],
    evidence: ['บันทึกพฤติกรรมเด็ก', 'แผนการสอนด้านอารมณ์', 'ผลงานศิลปะ-ดนตรี', 'แฟ้มสะสมผลงาน'],
  },
  // สังคม
  {
    domain: '🤝 สังคม', domainColor: '#7c3aed', domainBg: '#f5f3ff',
    evidenceBg: '#fff7ed',
    rows: [
      { dcy: { code: '5.1', desc: 'ช่วยเหลือตนเองในกิจวัตรประจำวัน' },
        cur: [{ code: '5', desc: 'คุณธรรม จริยธรรม จิตใจดีงาม' },
              { code: '6', desc: 'ทักษะชีวิต เศรษฐกิจพอเพียง' }],
        onesqa: '1.5', std68: '1.4ข สุขภาวะสังคม' },
      { dcy: { code: '5.2', desc: 'มีวินัย ดูแลสิ่งแวดล้อม มารยาทไทย' },
        cur: [{ code: '6', desc: 'ทักษะชีวิต ช่วยเหลือตนเอง มีวินัย' },
              { code: '7', desc: 'รักธรรมชาติ วัฒนธรรม ความเป็นไทย' }],
        onesqa: '1.5', std68: '1.4ข / 1.7ข คุณธรรม-สังคม' },
      { dcy: { code: '5.3', desc: 'ยอมรับความเหมือนและความแตกต่างระหว่างบุคคล' },
        cur: [{ code: '8', desc: 'อยู่ร่วมกับผู้อื่น ปฏิบัติตนเป็นสมาชิกที่ดีของสังคม' }],
        onesqa: '1.5', std68: '1.4ข สุขภาวะสังคม' },
      { dcy: { code: '5.4', desc: 'ปฏิสัมพันธ์ที่ดีกับผู้อื่น ทำงานร่วมกัน (PS)' },
        cur: [{ code: '8', desc: 'ตัวบ่งชี้ 8.2–8.3' }],
        onesqa: '1.5', std68: '1.4ข สุขภาวะสังคม' },
    ],
    evidence: ['บันทึกพฤติกรรมสังคม', 'กิจกรรมกลุ่ม', 'แบบสังเกตพฤติกรรม', 'ภาพถ่ายกิจกรรมสังคม'],
  },
  // สติปัญญา
  {
    domain: '💡 สติปัญญา', domainColor: '#b45309', domainBg: '#fffbeb',
    evidenceBg: '#f0fdf4',
    rows: [
      { dcy: { code: '6.1', desc: 'ใช้ภาษาสื่อสารได้เหมาะสมกับวัย (LG/RL)' },
        cur: [{ code: '9', desc: 'ใช้ภาษาสื่อสารได้เหมาะสมกับวัย' }],
        onesqa: '1.3', std68: '1.5ข ด้านภาษา-การสื่อสาร' },
      { dcy: { code: '6.2', desc: 'มีความสามารถในการคิดและแก้ปัญหา (CG)' },
        cur: [{ code: '10', desc: 'มีความสามารถในการคิดที่เป็นพื้นฐานในการเรียนรู้' }],
        onesqa: '1.2', std68: '1.5ข ด้านการคิด-แก้ปัญหา' },
      { dcy: { code: '6.3', desc: 'มีจินตนาการและความคิดสร้างสรรค์ (CG)' },
        cur: [{ code: '11', desc: 'มีจินตนาการและความคิดสร้างสรรค์' },
              { code: '12', desc: 'มีเจตคติที่ดีต่อการเรียนรู้และแสวงหาความรู้' }],
        onesqa: '1.2', std68: '1.5ข ด้านจินตนาการ-สร้างสรรค์' },
    ],
    evidence: ['บันทึกคำพูด-คำถามเด็ก', 'ผลงานเด็ก (วาด ปั้น เขียน)', 'แฟ้มสะสมผลงาน', 'วีดิทัศน์กิจกรรม'],
  },
];

// ── สรุป สมศ. 3 มาตรฐาน ──────────────────────────────────────────────────
const ONESQA_STANDARDS = [
  { code: '1', title: 'ผลลัพธ์คุณภาพของเด็กปฐมวัย', desc: '5 ตัวชี้วัด — วัดที่ตัวเด็ก',
    subs: [
      { code: '1.1', desc: 'เจริญเติบโตสมวัย สุขภาพแข็งแรง พัฒนาการเคลื่อนไหว' },
      { code: '1.2', desc: 'พัฒนาการด้านสติปัญญา เรียนรู้ และสร้างสรรค์' },
      { code: '1.3', desc: 'พัฒนาการด้านภาษาและการสื่อสาร' },
      { code: '1.4', desc: 'พัฒนาการด้านอารมณ์และจิตใจ' },
      { code: '1.5', desc: 'พัฒนาการด้านสังคมและคุณธรรม' },
    ],
  },
  { code: '2', title: 'การบริหารจัดการสถานพัฒนาเด็กปฐมวัย', desc: '10 ตัวชี้วัด — วัดที่ผู้บริหาร',
    subs: [
      { code: '2.1–2.5', desc: 'วิสัยทัศน์ · กลยุทธ์ · ภาวะผู้นำ · พัฒนาบุคลากร · นิเทศ' },
      { code: '2.6–2.10', desc: 'สื่อการเรียนรู้ · สภาพแวดล้อม · สวัสดิการ · คัดกรองเด็ก · เครือข่าย' },
    ],
  },
  { code: '3', title: 'การพัฒนาคุณภาพการจัดประสบการณ์', desc: '3 ตัวชี้วัด — วัดที่ครู',
    subs: [
      { code: '3.1', desc: 'หลักสูตรและแผนการจัดประสบการณ์การเรียนรู้' },
      { code: '3.2', desc: 'จัดกิจกรรมพัฒนาคุณลักษณะพึงประสงค์เหมาะสมกับวัย' },
      { code: '3.3', desc: 'ประเมินพัฒนาการเด็กอย่างเป็นระบบและต่อเนื่อง' },
    ],
  },
];

// ── ดย. มาตรฐาน 1–2 (บริหาร + ครู) ──────────────────────────────────────
const DCY_ADMIN = [
  { code: '1.1–1.5', title: 'มาตรฐาน 1 — การบริหารจัดการสถานพัฒนาเด็กปฐมวัย',
    desc: 'วิสัยทัศน์ · บุคลากร · สภาพแวดล้อม · สุขภาพ · ชุมชน', onesqa: '2.1–2.10' },
  { code: '2.1–2.5', title: 'มาตรฐาน 2 — ครู/ผู้ดูแลเด็กให้การดูแลและจัดประสบการณ์',
    desc: 'แผนการสอน · ร่างกาย · อารมณ์-สังคม · สติปัญญา · ประเมินพัฒนาการ', onesqa: '3.1–3.3' },
];

// ─────────────────────────────────────────────────────────────────────────────

export default function StandardsMapTab() {
  const [activeSection, setActiveSection] = useState('map');

  return (
    <div className="glass p-6 animate-fade">
      <div className="page-header mb-4">
        <h3>📋 มาตรฐานการศึกษาปฐมวัย</h3>
      </div>

      {/* คำอธิบาย 3 กรอบ */}
      {/* กรอบมาตรฐานเดิม (3 กรอบ) + ปี 68 (ทดแทน) */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ fontSize: '.72rem', fontWeight: 700, color: '#6b7280', marginBottom: '.4rem', textTransform: 'uppercase', letterSpacing: '.05em' }}>
          ⏮ มาตรฐานเดิม (ถูกทดแทน)
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '.6rem', marginBottom: '.75rem', opacity: 0.7 }}>
          {['dcy', 'cur', 'onesqa'].map(k => {
            const f = FRAME[k];
            return (
              <div key={k} style={{ background: f.bg, border: `1.5px solid ${f.border}`, borderRadius: '10px', padding: '.7rem .9rem', position: 'relative' }}>
                <div style={{ fontWeight: 800, fontSize: '.78rem', color: f.color, marginBottom: '.2rem', textDecoration: 'line-through', textDecorationColor: f.color }}>{f.label}</div>
                <div style={{ fontSize: '.72rem', color: '#6b7280', lineHeight: 1.4 }}>{f.full}</div>
              </div>
            );
          })}
        </div>
        <div style={{ fontSize: '.72rem', fontWeight: 700, color: '#7e22ce', marginBottom: '.4rem', textTransform: 'uppercase', letterSpacing: '.05em' }}>
          ✨ มาตรฐานใหม่ (ทดแทนทั้ง 3 กรอบข้างต้น)
        </div>
        {(() => { const f = FRAME.std68; return (
          <div style={{ background: '#faf5ff', border: '2px solid #a855f7', borderRadius: '12px', padding: '.85rem 1rem' }}>
            <div style={{ fontWeight: 800, fontSize: '.85rem', color: f.color, marginBottom: '.25rem' }}>หลักสูตรปฐมวัย 2568 (ปี 68)</div>
            <div style={{ fontSize: '.75rem', color: '#374151', lineHeight: 1.5 }}>{f.full}</div>
          </div>
        ); })()}
      </div>

      {/* Sub-nav */}
      <div style={{ display: 'flex', gap: '.4rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {[
          { id: 'map',    label: '🔗 ตารางแมปรวม' },
          { id: 'onesqa', label: '🔍 กรอบ สมศ.' },
          { id: 'dcy',    label: '🏛 มาตรฐาน ดย.' },
        ].map(s => (
          <button
            key={s.id} type="button"
            onClick={() => setActiveSection(s.id)}
            className={'tab-btn' + (activeSection === s.id ? ' active' : '')}
            style={{ fontSize: '.8rem', padding: '.45rem .9rem' }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* ── ตารางแมปรวม ── */}
      {activeSection === 'map' && (
        <div>
          <div style={{ fontSize: '.78rem', color: 'var(--text-muted)', marginBottom: '1rem', background: '#f5f3ff', border: '1px solid #c4b5fd', borderRadius: '8px', padding: '.65rem 1rem' }}>
            ✨ <strong>หลักสูตรปฐมวัย 2568 (ปี 68)</strong> ใช้ทดแทนมาตรฐาน ดย. · หลักสูตรปฐมวัย 2560 · และ สมศ. — หลักฐานจากกิจกรรมเดียวกันสามารถใช้รายงานต่อมาตรฐานใหม่ ปี 68 ได้ทั้งหมด
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.8rem' }}>
              <thead>
                {/* แถว 1 — grouping header */}
                <tr>
                  <th rowSpan={2} style={{ background: '#374151', color: 'white', padding: '.6rem .85rem', textAlign: 'center', width: '7%', verticalAlign: 'middle' }}>ด้าน</th>
                  <th colSpan={3} style={{ background: '#4b5563', color: '#d1d5db', padding: '.45rem .85rem', textAlign: 'center', fontSize: '.75rem', borderBottom: '1px solid #6b7280' }}>
                    ⏮ มาตรฐานเดิม (ถูกทดแทนโดย ปี 68)
                  </th>
                  <th rowSpan={2} style={{ background: '#7e22ce', color: 'white', padding: '.6rem .85rem', textAlign: 'center', width: '20%', verticalAlign: 'middle', lineHeight: 1.4 }}>
                    ✨ หลักสูตรปฐมวัย 2568<br/><span style={{ fontSize: '.7rem', fontWeight: 400 }}>(ม.1 คุณภาพเด็ก กลุ่ม ข)</span>
                  </th>
                  <th rowSpan={2} style={{ background: '#374151', color: 'white', padding: '.6rem .85rem', textAlign: 'center', verticalAlign: 'middle' }}>หลักฐานร่วม</th>
                </tr>
                {/* แถว 2 — ชื่อคอลัมน์เดิม (strikethrough) */}
                <tr>
                  <th style={{ background: '#6b7280', color: '#e5e7eb', padding: '.35rem .6rem', textAlign: 'center', width: '22%', fontSize: '.72rem', textDecoration: 'line-through', textDecorationColor: '#9ca3af' }}>มาตรฐาน ดย. (3.x–6.x)</th>
                  <th style={{ background: '#6b7280', color: '#e5e7eb', padding: '.35rem .6rem', textAlign: 'center', width: '26%', fontSize: '.72rem', textDecoration: 'line-through', textDecorationColor: '#9ca3af' }}>หลักสูตรปฐมวัย 2560</th>
                  <th style={{ background: '#6b7280', color: '#e5e7eb', padding: '.35rem .6rem', textAlign: 'center', width: '8%',  fontSize: '.72rem', textDecoration: 'line-through', textDecorationColor: '#9ca3af' }}>สมศ.</th>
                </tr>
              </thead>
              <tbody>
                {MAP_ROWS.map((domain, di) => (
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
                      <td style={{ padding: '.55rem .75rem', borderBottom: '1px solid #e5e7eb', verticalAlign: 'top' }}>
                        <Tag type="dcy" text={row.dcy.code} />
                        <div style={{ marginTop: '.25rem', color: '#374151' }}>{row.dcy.desc}</div>
                      </td>
                      <td style={{ padding: '.55rem .75rem', borderBottom: '1px solid #e5e7eb', verticalAlign: 'top' }}>
                        {row.cur.map((c, i) => (
                          <div key={i} style={{ marginBottom: i < row.cur.length - 1 ? '.35rem' : 0 }}>
                            <Tag type="cur" text={c.code} />
                            <span style={{ fontSize: '.75rem', color: '#374151' }}> {c.desc}</span>
                          </div>
                        ))}
                      </td>
                      {ri === 0 && (
                        <td
                          rowSpan={domain.rows.length}
                          style={{ padding: '.55rem .75rem', borderBottom: '1px solid #e5e7eb', verticalAlign: 'middle', textAlign: 'center' }}
                        >
                          <Tag type="onesqa" text={domain.rows[0].onesqa} />
                        </td>
                      )}
                      <td style={{ padding: '.55rem .75rem', borderBottom: '1px solid #e5e7eb', verticalAlign: 'top' }}>
                        {row.std68 && <Tag type="std68" text={row.std68} />}
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── กรอบ สมศ. ── */}
      {activeSection === 'onesqa' && (
        <div>
          <div style={{ marginBottom: '.75rem', fontSize: '.82rem', color: 'var(--text-muted)' }}>
            สำนักงานรับรองมาตรฐานและประเมินคุณภาพการศึกษา — 3 มาตรฐาน 18 ตัวชี้วัด
          </div>
          {ONESQA_STANDARDS.map(std => (
            <div key={std.code} className="glass-card mb-3" style={{ borderLeft: '4px solid #ea580c' }}>
              <div style={{ fontWeight: 800, color: '#c2410c', marginBottom: '.35rem' }}>
                มาตรฐานที่ {std.code} — {std.title}
              </div>
              <div style={{ fontSize: '.75rem', color: 'var(--text-muted)', marginBottom: '.5rem' }}>{std.desc}</div>
              {std.subs.map(sub => (
                <div key={sub.code} style={{ display: 'flex', gap: '.5rem', alignItems: 'flex-start', marginBottom: '.3rem' }}>
                  <Tag type="onesqa" text={sub.code} />
                  <span style={{ fontSize: '.78rem', color: '#374151' }}>{sub.desc}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* ── มาตรฐาน ดย. ── */}
      {activeSection === 'dcy' && (
        <div>
          <div style={{ marginBottom: '.75rem', fontSize: '.82rem', color: 'var(--text-muted)' }}>
            กรมกิจการเด็กและเยาวชน — มาตรฐานสถานพัฒนาเด็กปฐมวัยแห่งชาติ พ.ศ. 2561 (3 ด้าน)
          </div>

          {/* มาตรฐาน 3 คุณภาพเด็ก */}
          <div className="glass-card mb-3" style={{ borderLeft: '4px solid #1d4ed8' }}>
            <div style={{ fontWeight: 800, color: '#1e40af', marginBottom: '.35rem' }}>
              มาตรฐานด้านที่ 3 — คุณภาพเด็กปฐมวัย 3–6 ปี <span style={{ fontSize: '.72rem', fontWeight: 600, color: '#6b7280' }}>(วัดที่ตัวเด็ก)</span>
            </div>
            <div style={{ fontSize: '.75rem', color: 'var(--text-muted)', marginBottom: '.6rem' }}>
              ตัวบ่งชี้ 3.1–6.3 แบ่งตาม 4 ด้านพัฒนาการ — ตรงกับระบบที่ 1 ใน "ตัวบ่งชี้" ของ KinderTrack
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: '.5rem' }}>
              {[
                { range: '3.1–3.3', label: '🏃 ร่างกาย', color: '#059669' },
                { range: '4.1–4.3', label: '❤️ อารมณ์-จิตใจ', color: '#e11d48' },
                { range: '5.1–5.4', label: '🤝 สังคม', color: '#7c3aed' },
                { range: '6.1–6.3', label: '💡 สติปัญญา', color: '#b45309' },
              ].map(d => (
                <div key={d.range} style={{ background: '#eff6ff', borderRadius: '8px', padding: '.5rem .75rem', border: '1px solid #bfdbfe' }}>
                  <Tag type="dcy" text={d.range} />
                  <div style={{ fontWeight: 700, color: d.color, marginTop: '.2rem', fontSize: '.8rem' }}>{d.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* มาตรฐาน 1-2 */}
          {DCY_ADMIN.map(d => (
            <div key={d.code} className="glass-card mb-3" style={{ borderLeft: '4px solid #1d4ed8' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '.5rem' }}>
                <div>
                  <div style={{ fontWeight: 800, color: '#1e40af', marginBottom: '.2rem' }}>
                    <Tag type="dcy" text={d.code} /> {d.title}
                  </div>
                  <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>{d.desc}</div>
                </div>
                <div style={{ fontSize: '.72rem' }}>
                  เชื่อมกับ <Tag type="onesqa" text={d.onesqa} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
