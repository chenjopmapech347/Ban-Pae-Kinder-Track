import { useState } from 'react';

const SECTIONS = [
  {
    id: 'overview',
    icon: '🏠',
    title: 'ภาพรวมระบบ KinderTrack',
    color: '#7c3aed',
    bg: '#faf5ff',
    border: '#ddd6fe',
    content: [
      {
        type: 'para',
        text: 'KinderTrack คือระบบบันทึกพัฒนาการเด็กปฐมวัย ออกแบบสำหรับโรงเรียนอนุบาลและศูนย์เด็กเล็ก ครอบคลุมการบันทึกกิจกรรมประจำวัน การประเมินพัฒนาการ รายงานโภชนาการ และการสื่อสารกับผู้ปกครอง',
      },
      {
        type: 'roles',
        items: [
          { icon: '🛡️', role: 'ผู้ดูแลระบบ (Admin)', desc: 'จัดการข้อมูลทั้งหมด: นักเรียน ครู ห้องเรียน ตั้งค่าระบบ ดูรายงานรวม' },
          { icon: '👩‍🏫', role: 'ครู (Teacher)', desc: 'บันทึกกิจกรรมประจำวัน เช็คชื่อ ประเมินพัฒนาการ ดูรายงานห้องตัวเอง' },
          { icon: '👨‍👩‍👧', role: 'ผู้ปกครอง (Parent)', desc: 'ดูข้อมูลบุตรหลาน: การมาเรียน การประเมิน รายงานพัฒนาการ' },
        ],
      },
    ],
  },
  {
    id: 'login',
    icon: '🔐',
    title: 'การเข้าสู่ระบบ',
    color: '#0891b2',
    bg: '#f0f9ff',
    border: '#bae6fd',
    content: [
      {
        type: 'steps',
        items: [
          'เปิดแอป → กด "เข้าสู่ระบบ"',
          'ใส่ชื่อผู้ใช้ (username) และ PIN 4 หลัก',
          'ระบบจะตรวจสอบบทบาทโดยอัตโนมัติ (admin / ครู / ผู้ปกครอง)',
          'เข้าสู่หน้าหลักตามสิทธิ์ของบัญชีนั้นๆ',
        ],
      },
      {
        type: 'tip',
        text: 'ผู้ปกครองเข้าสู่ระบบด้วย PIN ที่ครูกำหนดให้ ดูได้ที่เมนู "🔑 PIN ผู้ปกครอง" ในหน้าครู',
      },
    ],
  },
  {
    id: 'daily',
    icon: '📅',
    title: 'กิจกรรมประจำวัน',
    color: '#0891b2',
    bg: '#f0f9ff',
    border: '#bae6fd',
    content: [
      {
        type: 'grid',
        items: [
          { icon: '✅', title: 'การมาเรียน', desc: 'เช็คชื่อรายวัน: มา / ขาด / ลา / ป่วย กด Auto-fill ให้ครบทุกคนเป็น "มา" แล้วแก้เฉพาะที่ขาด' },
          { icon: '🚗', title: 'รับกลับบ้าน', desc: 'บันทึกว่าใครมารับเด็กแต่ละคนวันนี้ — ผู้ปกครอง / พี่เลี้ยง / อื่นๆ' },
          { icon: '🏥', title: 'ตรวจสุขภาพ', desc: 'บันทึกผลตรวจสุขภาพรายวัน 3 ช่วงต่อสัปดาห์: ตา หู ฟัน ผิวหนัง' },
          { icon: '🤒', title: 'คัดกรองอาการป่วย', desc: 'บันทึกสัญลักษณ์ P/S/A/O รายวันในตารางรายเดือน แสดงครบทุกวันในเดือน' },
          { icon: '🪥', title: 'แปรงฟัน', desc: 'ทำเครื่องหมาย ✓ เมื่อเด็กแปรงฟันหลังอาหาร กดปุ่ม "ครบทุกคน" เพื่อความรวดเร็ว' },
          { icon: '🍱', title: 'อาหารกลางวัน', desc: 'บันทึกปริมาณที่เด็กทาน: หมด / เกือบหมด / ครึ่งเดียว / ไม่ทาน' },
          { icon: '🥛', title: 'ดื่มนม', desc: 'ทำเครื่องหมายว่าเด็กดื่มนมวันนี้ครบหรือไม่ กดปุ่มเติมครบได้เลย' },
          { icon: '⚖️', title: 'ภาวะโภชนาการ', desc: 'บันทึกน้ำหนัก/ส่วนสูงรายเดือน คำนวณ BMI และเปรียบกับมาตรฐาน WHO อัตโนมัติ' },
        ],
      },
      {
        type: 'tip',
        text: 'กิจกรรมประจำวันใช้ตาราง "ห้องเรียน × วันที่" — ต้องเลือกห้องเรียนให้ถูกก่อนบันทึก',
      },
    ],
  },
  {
    id: 'evaluation',
    icon: '📊',
    title: 'การประเมินพัฒนาการ',
    color: '#4f46e5',
    bg: '#eef2ff',
    border: '#c7d2fe',
    content: [
      {
        type: 'steps',
        items: [
          'ไปที่เมนู "✏️ ประเมินพัฒนาการ" หรือกดปุ่ม 📊 หน้าชื่อเด็ก',
          'เลือกเด็กที่ต้องการประเมิน',
          'เลือกหัวข้อ → ตัวบ่งชี้ → บันทึกระดับ (ผ่าน / ไม่ผ่าน / กำลังพัฒนา)',
          'ระบบ AI ผู้ช่วยจะแนะนำกิจกรรมเสริมอัตโนมัติ',
          'ดูสรุปผลได้ที่ "📈 รายงานสรุปการประเมิน" และ "📒 สมุดรายงาน อ.01"',
        ],
      },
      {
        type: 'info',
        text: 'ประวัติการประเมินเก็บไว้ใน "📜 ประวัติการประเมิน" — ดูย้อนหลังได้ทุกครั้งที่บันทึก',
      },
    ],
  },
  {
    id: 'students',
    icon: '👶',
    title: 'การจัดการนักเรียน',
    color: '#059669',
    bg: '#ecfdf5',
    border: '#a7f3d0',
    content: [
      {
        type: 'steps',
        items: [
          'ไปที่ "👶 นักเรียน" → กด "➕ เพิ่มนักเรียน"',
          'กรอกข้อมูล: ชื่อ, ห้องเรียน, ชั้น, เพศ, วันเกิด, น้ำหนัก, ส่วนสูง',
          'ระบบคำนวณอายุ (ปี/เดือน) จากวันเกิดให้อัตโนมัติ',
          'กด "🚪 จัดนักเรียนเข้าห้อง" เพื่อย้ายห้องหรือจัดกลุ่ม',
          'นักเรียนที่ไม่ใช้งานแล้ว เปลี่ยนสถานะเป็น "นอกระบบ" แทนการลบ',
        ],
      },
      {
        type: 'tip',
        text: 'นำเข้าข้อมูลหลายคนพร้อมกันด้วย CSV: ชื่อ, ชั้น, อายุ, น้ำหนัก, ส่วนสูง (คั่นด้วยจุลภาค)',
      },
    ],
  },
  {
    id: 'newyear',
    icon: '🗓️',
    title: 'การเปลี่ยนปีการศึกษา',
    color: '#d97706',
    bg: '#fffbeb',
    border: '#fde68a',
    content: [
      {
        type: 'warning',
        text: 'ข้อมูลทั้งหมดในระบบผูกกับปีการศึกษา เมื่อเปลี่ยนปี ข้อมูลเก่าจะถูกเก็บรักษาไว้ และเริ่มบันทึกใหม่ในปีใหม่',
      },
      {
        type: 'steps',
        items: [
          '① ตั้งค่าระบบ → "📅 ภาคเรียน" → เพิ่มวันที่ภาคเรียน 1 และ 2 ของปีใหม่',
          '② ตั้งค่าระบบ → "🏖️ วันหยุด" → เพิ่มวันหยุดประจำปีใหม่',
          '③ Admin → "👶 นักเรียน" → เพิ่มนักเรียนใหม่ / อัปเดตชั้น / เปลี่ยนสถานะเด็กที่จบ',
          '④ Admin → "🚪 จัดนักเรียนเข้าห้อง" → จัดห้องเรียนใหม่',
          '⑤ กดที่ปีการศึกษาในหัว (dropdown) → เลือกปีใหม่ (เช่น 2570)',
          '⑥ หากยังไม่มีปีใหม่ในรายการ → ตั้งค่า → เพิ่มปีการศึกษาก่อน',
        ],
      },
      {
        type: 'info',
        text: 'สลับดูข้อมูลเก่าได้ตลอดเวลา — แค่เลือกปีการศึกษาเก่าจาก dropdown ในหัวแอป',
      },
    ],
  },
  {
    id: 'reports',
    icon: '📈',
    title: 'รายงานและการส่งออก',
    color: '#4f46e5',
    bg: '#eef2ff',
    border: '#c7d2fe',
    content: [
      {
        type: 'grid',
        items: [
          { icon: '📒', title: 'สมุดรายงาน อ.01', desc: 'รายงานพัฒนาการมาตรฐาน พร้อม Export เป็น Word (.docx)' },
          { icon: '📈', title: 'รายงานสรุปการประเมิน', desc: 'สรุปผลรายห้อง รายบุคคล พร้อมกราฟแท่ง' },
          { icon: '⚖️', title: 'ภาวะโภชนาการ', desc: 'เปรียบ BMI กับมาตรฐาน WHO — Export Excel ได้' },
          { icon: '📑', title: 'ผลการประเมินพัฒนาการ', desc: 'ผลการประเมินพัฒนาการรายนักเรียนแบบละเอียด' },
        ],
      },
      {
        type: 'tip',
        text: 'รายงานส่วนใหญ่ Export ได้ทั้ง Word (.docx) และ Excel (.xlsx) — หาปุ่ม Export ที่มุมขวาบนของแต่ละเมนู',
      },
    ],
  },
  {
    id: 'settings',
    icon: '⚙️',
    title: 'การตั้งค่าระบบ',
    color: '#6b7280',
    bg: '#f9fafb',
    border: '#e5e7eb',
    content: [
      {
        type: 'grid',
        items: [
          { icon: '🏛️', title: 'โรงเรียน', desc: 'ตั้งค่าชื่อโรงเรียน ที่อยู่ และข้อมูลองค์กร' },
          { icon: '👩‍🏫', title: 'ครู', desc: 'เพิ่ม/ลบ/แก้ไขบัญชีครู กำหนด PIN เข้าระบบ' },
          { icon: '🏫', title: 'ห้องเรียน', desc: 'เพิ่ม/ลบห้องเรียน กำหนดครูประจำชั้น' },
          { icon: '📅', title: 'ภาคเรียน', desc: 'กำหนดวันเปิด-ปิด ภาคเรียน 1 และ 2 รายปีการศึกษา' },
          { icon: '🏖️', title: 'วันหยุด', desc: 'ตั้งวันหยุดประจำปี ใช้คำนวณวันเรียนจริงในรายงาน' },
          { icon: '📝', title: 'หัวข้อประเมิน / ตัวบ่งชี้', desc: 'เพิ่มหัวข้อและตัวบ่งชี้พัฒนาการที่ต้องการประเมิน' },
        ],
      },
    ],
  },
  {
    id: 'faq',
    icon: '❓',
    title: 'คำถามที่พบบ่อย',
    color: '#7c3aed',
    bg: '#faf5ff',
    border: '#ddd6fe',
    content: [
      {
        type: 'faq',
        items: [
          {
            q: 'ข้อมูลหายไปหลังเปลี่ยนปีการศึกษา?',
            a: 'ข้อมูลไม่ได้หาย แต่ถูกแยกตามปีการศึกษา สลับกลับไปดูปีเก่าได้ที่ dropdown ปีการศึกษาในหัวแอป',
          },
          {
            q: 'เพิ่มปีการศึกษาใหม่ยังไง?',
            a: 'ตั้งค่าระบบ → เลือกเมนู "ปีการศึกษา" (ถ้ามี) หรือแก้ในหน้าตั้งค่าปีการศึกษา แล้วพิมพ์ปี พ.ศ. ใหม่',
          },
          {
            q: 'ลืม PIN เข้าระบบ?',
            a: 'Admin สามารถรีเซ็ต PIN ได้ที่เมนู "👩‍🏫 ครู" → แก้ไขข้อมูลครูคนนั้น',
          },
          {
            q: 'ผู้ปกครองล็อคอินไม่ได้?',
            a: 'ครูต้องตั้ง PIN ผู้ปกครองก่อน ไปที่หน้าครู → เมนู "🔑 PIN ผู้ปกครอง" → กรอก PIN ให้แต่ละครอบครัว',
          },
          {
            q: 'ตารางโภชนาการแสดงไม่ครบ?',
            a: 'เลื่อนซ้าย-ขวาได้ในตาราง (scroll) ข้อมูลแสดงครบทุกคน แต่ต้องใช้พื้นที่กว้าง',
          },
          {
            q: 'Export Word / Excel ไม่ได้?',
            a: 'ตรวจว่าเบราว์เซอร์ไม่ได้บล็อก popup/download ลองกดที่แถบดาวน์โหลดของเบราว์เซอร์',
          },
        ],
      },
    ],
  },
];

function SectionBlock({ section, isOpen, onToggle }) {
  return (
    <div style={{
      border: `1.5px solid ${isOpen ? section.border : '#e5e7eb'}`,
      borderRadius: '16px',
      overflow: 'hidden',
      transition: 'border-color .2s',
      background: 'white',
    }}>
      {/* Header */}
      <button
        type="button"
        onClick={onToggle}
        style={{
          width: '100%', textAlign: 'left', padding: '1rem 1.25rem',
          display: 'flex', alignItems: 'center', gap: '.85rem',
          background: isOpen ? section.bg : 'white',
          border: 'none', cursor: 'pointer',
          transition: 'background .2s',
        }}
      >
        <span style={{ fontSize: '1.35rem', lineHeight: 1 }}>{section.icon}</span>
        <span style={{ flex: 1, fontWeight: 700, fontSize: '.95rem', color: isOpen ? section.color : '#374151' }}>
          {section.title}
        </span>
        <span style={{ fontSize: '1rem', color: '#9ca3af', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>▾</span>
      </button>

      {/* Body */}
      {isOpen && (
        <div style={{ padding: '1rem 1.25rem 1.25rem', borderTop: `1px solid ${section.border}` }}>
          {section.content.map((block, bi) => (
            <ContentBlock key={bi} block={block} color={section.color} bg={section.bg} border={section.border} />
          ))}
        </div>
      )}
    </div>
  );
}

function ContentBlock({ block, color, bg, border }) {
  if (block.type === 'para') {
    return (
      <p style={{ color: '#374151', lineHeight: 1.7, fontSize: '.88rem', margin: '0 0 .75rem' }}>{block.text}</p>
    );
  }

  if (block.type === 'roles') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem', marginBottom: '.75rem' }}>
        {block.items.map((item, i) => (
          <div key={i} style={{
            display: 'flex', gap: '.85rem', alignItems: 'flex-start',
            background: bg, border: `1px solid ${border}`,
            borderRadius: '10px', padding: '.7rem 1rem',
          }}>
            <span style={{ fontSize: '1.3rem', lineHeight: 1, marginTop: '.1rem' }}>{item.icon}</span>
            <div>
              <div style={{ fontWeight: 700, color, fontSize: '.88rem', marginBottom: '.2rem' }}>{item.role}</div>
              <div style={{ color: '#6b7280', fontSize: '.83rem', lineHeight: 1.5 }}>{item.desc}</div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (block.type === 'steps') {
    return (
      <ol style={{ margin: '0 0 .75rem', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '.45rem' }}>
        {block.items.map((step, i) => (
          <li key={i} style={{ color: '#374151', fontSize: '.88rem', lineHeight: 1.6 }}>{step}</li>
        ))}
      </ol>
    );
  }

  if (block.type === 'grid') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '.6rem', marginBottom: '.75rem' }}>
        {block.items.map((item, i) => (
          <div key={i} style={{
            background: bg, border: `1px solid ${border}`,
            borderRadius: '10px', padding: '.75rem 1rem',
          }}>
            <div style={{ fontSize: '1.2rem', marginBottom: '.3rem' }}>{item.icon}</div>
            <div style={{ fontWeight: 700, color, fontSize: '.85rem', marginBottom: '.25rem' }}>{item.title}</div>
            <div style={{ color: '#6b7280', fontSize: '.8rem', lineHeight: 1.5 }}>{item.desc}</div>
          </div>
        ))}
      </div>
    );
  }

  if (block.type === 'tip') {
    return (
      <div style={{
        background: '#fef9c3', border: '1px solid #fde68a',
        borderRadius: '10px', padding: '.65rem 1rem',
        color: '#92400e', fontSize: '.83rem', lineHeight: 1.6,
        marginBottom: '.75rem',
      }}>
        💡 <strong>เคล็ดลับ:</strong> {block.text}
      </div>
    );
  }

  if (block.type === 'info') {
    return (
      <div style={{
        background: '#dbeafe', border: '1px solid #bfdbfe',
        borderRadius: '10px', padding: '.65rem 1rem',
        color: '#1e40af', fontSize: '.83rem', lineHeight: 1.6,
        marginBottom: '.75rem',
      }}>
        ℹ️ {block.text}
      </div>
    );
  }

  if (block.type === 'warning') {
    return (
      <div style={{
        background: '#fff7ed', border: '1px solid #fed7aa',
        borderRadius: '10px', padding: '.65rem 1rem',
        color: '#9a3412', fontSize: '.83rem', lineHeight: 1.6,
        marginBottom: '.75rem',
      }}>
        ⚠️ <strong>สำคัญ:</strong> {block.text}
      </div>
    );
  }

  if (block.type === 'faq') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
        {block.items.map((item, i) => (
          <div key={i} style={{
            borderRadius: '10px', border: `1px solid ${border}`,
            overflow: 'hidden',
          }}>
            <div style={{ background: bg, padding: '.6rem 1rem', fontWeight: 700, fontSize: '.85rem', color }}>
              ❓ {item.q}
            </div>
            <div style={{ padding: '.6rem 1rem', fontSize: '.83rem', color: '#374151', lineHeight: 1.6 }}>
              {item.a}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return null;
}

export default function HelpTab() {
  const [openId, setOpenId] = useState('overview');

  return (
    <div className="glass animate-fade" style={{ padding: '1.5rem' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '1rem',
        marginBottom: '1.5rem', paddingBottom: '1rem',
        borderBottom: '2px solid #e5e7eb',
      }}>
        <div style={{
          width: '48px', height: '48px', borderRadius: '14px',
          background: 'linear-gradient(135deg,#7c3aed,#a855f7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.6rem', flexShrink: 0,
        }}>📖</div>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#1f2937' }}>
            คู่มือการใช้งาน KinderTrack
          </h2>
          <p style={{ margin: '0.2rem 0 0', fontSize: '.82rem', color: '#6b7280' }}>
            คลิกหัวข้อเพื่อดูรายละเอียด
          </p>
        </div>
      </div>

      {/* Accordion sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
        {SECTIONS.map(section => (
          <SectionBlock
            key={section.id}
            section={section}
            isOpen={openId === section.id}
            onToggle={() => setOpenId(prev => prev === section.id ? null : section.id)}
          />
        ))}
      </div>

      {/* Footer */}
      <div style={{
        marginTop: '1.5rem', padding: '1rem', borderRadius: '12px',
        background: '#f3f4f6', textAlign: 'center',
        color: '#9ca3af', fontSize: '.78rem',
      }}>
        KinderTrack — ระบบบันทึกพัฒนาการเด็กปฐมวัย
      </div>
    </div>
  );
}
