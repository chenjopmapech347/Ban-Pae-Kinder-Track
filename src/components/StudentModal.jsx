import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import Modal, { ModalCancelBtn, ModalConfirmBtn } from './Modal';

// ── Thai date helpers ──────────────────────────────────────────────────────
const THAI_MONTHS = [
  'มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
  'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม',
];

/** คำนวณอายุ (ปี) จาก YYYY-MM-DD (CE) */
function calcAge(iso) {
  if (!iso) return '';
  const birth = new Date(iso);
  if (isNaN(birth)) return '';
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  if (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate())) age--;
  return age < 0 ? 0 : age;
}

/** แปลง YYYY-MM-DD → { day, month, yearBE } */
function parseBirthISO(iso) {
  if (!iso) return { day: '', month: '', yearBE: '' };
  const [y, m, d] = iso.split('-');
  return {
    day:    d ? Number(d)   : '',
    month:  m ? Number(m)   : '',
    yearBE: y ? Number(y) + 543 : '',
  };
}

/** แปลง { day, month, yearBE } → YYYY-MM-DD (CE) */
function buildBirthISO(day, month, yearBE) {
  if (!day || !month || !yearBE) return '';
  const yearCE = Number(yearBE) - 543;
  return `${yearCE}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
}

// ช่วงปี พ.ศ. ที่แสดงใน dropdown (2550–2578 ครอบคลุมเด็กอนุบาลและกรณีข้อมูลพิเศษ)
const BE_YEARS = Array.from({ length: 29 }, (_, i) => 2550 + i).reverse();

const emptyStudent = {
  // ── ข้อมูลพื้นฐาน ──────────────────────────────────────
  name:        '',
  nickname:    '',
  gender:      'ชาย',
  birthDate:   '',          // วัน เดือน ปีเกิด (YYYY-MM-DD)
  nationalId:  '',          // เลขประจำตัวประชาชน 13 หลัก
  studentId:   '',          // เลขประจำตัวนักเรียน (รหัสห้อง)
  parentPin:   '',          // PIN ผู้ปกครองสำหรับ login
  level:       'K1',
  className:   '',
  status:      'ปกติ',
  withdrawDate: '',         // วันที่ลาออก (YYYY-MM-DD) — ใช้เมื่อ status='ลาออก'
  weight:      '',
  height:      '',
  age:         '',

  // ── ข้อมูลบิดา ──────────────────────────────────────────
  fatherName:  '',
  fatherOcc:   '',

  // ── ข้อมูลมารดา ─────────────────────────────────────────
  motherName:  '',
  motherOcc:   '',

  // ── ข้อมูลผู้ปกครอง ─────────────────────────────────────
  guardianName:     '',     // ชื่อ-สกุลผู้ปกครอง
  guardianOcc:      '',     // อาชีพผู้ปกครอง
  guardianRelation: 'มารดา', // ความเกี่ยวข้อง (มารดา/บิดา/อื่น)
  parentPhone:      '',     // เบอร์โทรผู้ปกครอง

  // ── การรับ-ส่ง (ค่าเริ่มต้น) ────────────────────────────────
  defaultDropoffRelation: 'บิดา',   // ผู้ส่งเช้า (ค่า default)
  defaultDropoffName:     '',        // ชื่อเพิ่มเติมกรณีอื่นๆ
  defaultPickupRelation:  'มารดา',  // ผู้รับเย็น (ค่า default)
  defaultPickupName:      '',        // ชื่อเพิ่มเติมกรณีอื่นๆ

  // ── รูปภาพ ──────────────────────────────────────────────────
  photo:       '',          // base64 data URL

  // ── ที่อยู่ (แยกฟิลด์) ──────────────────────────────────
  houseNo:     '',          // บ้านเลขที่
  moo:         '',          // หมู่ที่/ตรอก/ซอย
  road:        '',          // ถนน
  subdistrict: '',          // ตำบล
  district:    '',          // อำเภอ
  province:    'ระยอง',    // จังหวัด
  address:     '',          // (legacy — ที่อยู่แบบข้อความ สำหรับ backward compat)
};

const set = (fd, key, val) => ({ ...fd, [key]: val });

export default function StudentModal({ isOpen, onClose, onSave, editingStudent }) {
  const { allClassNames } = useApp();
  const ALL_CLASSES = allClassNames;
  const [activeSubTab, setActiveSubTab] = useState('personal');
  const [formData, setFormData] = useState(() => ({ ...emptyStudent, ...(editingStudent ?? {}) }));

  const f = (key) => ({
    value: formData[key] ?? '',
    onChange: (e) => setFormData(set(formData, key, e.target.value)),
  });

  // ── Thai birth date — แยก state 3 ส่วน เพื่อป้องกัน intermediate value หาย ──
  const initParts = parseBirthISO(editingStudent?.birthDate);
  const [bDay,   setBDay]   = useState(() => initParts.day);
  const [bMonth, setBMonth] = useState(() => initParts.month);
  const [bYear,  setBYear]  = useState(() => initParts.yearBE);

  // sync เมื่อ editingStudent เปลี่ยน (เปิด modal คนละคน)
  useEffect(() => {
    const p = parseBirthISO(editingStudent?.birthDate);
    setBDay(p.day); setBMonth(p.month); setBYear(p.yearBE);
  }, [editingStudent]);

  const photoInputRef = useRef(null);

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setFormData(fd => ({ ...fd, photo: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const handleBirthChange = (part, val) => {
    const v = val !== '' ? Number(val) : '';
    let d = bDay, m = bMonth, y = bYear;
    if (part === 'day')    { d = v; setBDay(v); }
    if (part === 'month')  { m = v; setBMonth(v); }
    if (part === 'yearBE') { y = v; setBYear(v); }
    const newISO = buildBirthISO(d, m, y);
    setFormData(fd => ({
      ...fd,
      ...(newISO ? { birthDate: newISO, age: calcAge(newISO) } : {}),
    }));
  };

  const PICKUP_RELATIONS = ['บิดา', 'มารดา', 'ย่า-ยาย', 'ปู่-ตา', 'อื่นๆ'];
  const PICKUP_REL_ICON  = { บิดา: '👨', มารดา: '👩', 'ย่า-ยาย': '👵', 'ปู่-ตา': '👴', อื่นๆ: '🧑' };

  const TABS = [
    { id: 'personal', label: '1. ประวัติส่วนตัว' },
    { id: 'family',   label: '2. ครอบครัว' },
    { id: 'address',  label: '3. ที่อยู่ / ติดต่อ' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingStudent ? '📝 แก้ไขข้อมูลนักเรียน' : '👶 เพิ่มข้อมูลใหม่'}
      size="xl"
    >
      <div style={{ padding: '1.5rem', overflowY: 'auto' }}>
      {/* ── Sub-tabs ── */}
      <div className="flex gap-2 mb-6 border-b">
        {TABS.map(t => (
          <button
            key={t.id}
            type="button"
            className={`btn ${activeSubTab === t.id ? 'btn-primary' : ''}`}
            style={{ borderRadius: '8px 8px 0 0', background: activeSubTab === t.id ? '' : 'white', border: '1px solid #eee' }}
            onClick={() => setActiveSubTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }}>

        {/* ════ Tab 1: ประวัติส่วนตัว ════ */}
        {activeSubTab === 'personal' && (
          <div className="grid grid-2 gap-4 animate-fade">

            {/* ── รูปภาพนักเรียน ── */}
            <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '.25rem' }}>
              {/* Avatar circle — คลิกเพื่อเลือกรูป */}
              <div
                onClick={() => photoInputRef.current?.click()}
                title="คลิกเพื่อเลือกรูป"
                style={{
                  width: 90, height: 90, borderRadius: '50%', flexShrink: 0,
                  border: '2.5px dashed #a78bfa', cursor: 'pointer',
                  background: formData.photo ? 'transparent' : '#f5f3ff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden', transition: 'border-color .15s',
                  position: 'relative',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#7c3aed'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#a78bfa'}
              >
                {formData.photo ? (
                  <img
                    src={formData.photo}
                    alt="รูปนักเรียน"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                  />
                ) : (
                  <div style={{ textAlign: 'center', pointerEvents: 'none' }}>
                    <div style={{ fontSize: '1.6rem', lineHeight: 1 }}>📷</div>
                    <div style={{ fontSize: '.6rem', color: '#9ca3af', marginTop: '.2rem', fontWeight: 600 }}>อัปโหลดรูป</div>
                  </div>
                )}
              </div>

              {/* ข้อความอธิบาย + ปุ่มลบรูป */}
              <div>
                <div style={{ fontWeight: 700, fontSize: '.82rem', color: '#374151', marginBottom: '.35rem' }}>
                  รูปภาพนักเรียน
                </div>
                <div style={{ fontSize: '.75rem', color: '#6b7280', marginBottom: '.5rem', lineHeight: 1.5 }}>
                  คลิกที่รูปเพื่อเลือกภาพ<br />รองรับ JPG, PNG · ขนาดแนะนำ 300×300 px
                </div>
                {formData.photo && (
                  <button
                    type="button"
                    onClick={() => setFormData(fd => ({ ...fd, photo: '' }))}
                    style={{
                      fontSize: '.72rem', padding: '.18rem .55rem', borderRadius: '6px',
                      border: '1px solid #fca5a5', background: '#fee2e2',
                      color: '#991b1b', cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit',
                    }}
                  >
                    ✕ ลบรูป
                  </button>
                )}
              </div>

              {/* hidden file input */}
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handlePhotoChange}
              />
            </div>

            {/* ชื่อ-นามสกุล */}
            <div className="flex flex-col gap-1" style={{ gridColumn: '1 / -1' }}>
              <label className="text-xs font-bold">ชื่อ-นามสกุล *</label>
              <input className="input" {...f('name')} required />
            </div>

            {/* ชื่อเล่น + เพศ */}
            <div className="grid grid-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold">ชื่อเล่น</label>
                <input className="input" {...f('nickname')} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold">เพศ</label>
                <select className="input" {...f('gender')}>
                  <option>ชาย</option>
                  <option>หญิง</option>
                </select>
              </div>
            </div>

            {/* วันเกิด + อายุอัตโนมัติ */}
            <div className="flex flex-col gap-1" style={{ gridColumn: '1 / -1' }}>
              <label className="text-xs font-bold">วัน เดือน ปีเกิด (พ.ศ.)</label>
              <div style={{ display: 'flex', gap: '.4rem', alignItems: 'center', flexWrap: 'wrap' }}>

                {/* วัน */}
                <select className="input" style={{ width: '75px' }}
                  value={bDay}
                  onChange={e => handleBirthChange('day', e.target.value)}>
                  <option value="">วัน</option>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>

                {/* เดือน */}
                <select className="input" style={{ width: '148px' }}
                  value={bMonth}
                  onChange={e => handleBirthChange('month', e.target.value)}>
                  <option value="">เดือน</option>
                  {THAI_MONTHS.map((m, i) => (
                    <option key={i + 1} value={i + 1}>{m}</option>
                  ))}
                </select>

                {/* ปี พ.ศ. */}
                <select className="input" style={{ width: '108px' }}
                  value={bYear}
                  onChange={e => handleBirthChange('yearBE', e.target.value)}>
                  <option value="">ปี พ.ศ.</option>
                  {BE_YEARS.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>

                {/* อายุ — คำนวณอัตโนมัติ */}
                {formData.age !== '' && formData.age !== null && (
                  <span style={{
                    fontSize: '.83rem', fontWeight: 700, color: '#7c3aed',
                    background: '#f5f3ff', border: '1.5px solid #ddd6fe',
                    borderRadius: '8px', padding: '.22rem .7rem', whiteSpace: 'nowrap',
                  }}>
                    🎂 อายุ {formData.age} ปี
                  </span>
                )}
              </div>
            </div>

            {/* เลขประจำตัวประชาชน */}
            <div className="flex flex-col gap-1" style={{ gridColumn: '1 / -1' }}>
              <label className="text-xs font-bold">เลขประจำตัวประชาชน</label>
              <input className="input" placeholder="x-xxxx-xxxxx-xx-x" {...f('nationalId')} />
            </div>

            {/* รหัสประจำตัวนักเรียน + PIN */}
            <div className="grid grid-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold">รหัสประจำตัว</label>
                <input className="input" placeholder="เช่น 001, 2567001" {...f('studentId')} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold">รหัสผู้ปกครอง (PIN)</label>
                <input className="input" {...f('parentPin')} placeholder="4 หลัก" />
              </div>
            </div>

            {/* ห้องเรียน + สถานะ */}
            <div className="grid grid-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold">ห้องเรียน</label>
                <select className="input" value={formData.className ?? ''} onChange={e => setFormData(set(formData, 'className', e.target.value))}>
                  <option value="">— ยังไม่กำหนด —</option>
                  {ALL_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold">สถานะ</label>
                <select className="input" value={formData.status ?? 'ปกติ'}
                  onChange={e => setFormData(set(formData, 'status', e.target.value))}
                  style={{
                    color: (formData.status ?? 'ปกติ') === 'นอกระบบ' ? '#6b7280'
                         : (formData.status ?? 'ปกติ') === 'ลาออก'   ? '#b45309'
                         : '#065f46',
                    fontWeight: 700,
                  }}>
                  <option value="ปกติ">✅ ปกติ</option>
                  <option value="ลาออก">🚪 ลาออก</option>
                  <option value="นอกระบบ">⛔ นอกระบบ</option>
                </select>
                {(formData.status ?? 'ปกติ') === 'ลาออก' && (
                  <div className="flex flex-col gap-1 mt-1">
                    <label className="text-xs text-amber-700 font-bold">📅 วันที่ลาออก</label>
                    <input className="input" type="date" {...f('withdrawDate')}
                      style={{ borderColor: '#f59e0b', color: '#92400e' }} />
                    <p className="text-xs text-amber-600" style={{ margin: 0 }}>
                      ชื่อยังแสดงในระบบ — กิจกรรมจะหยุดนับตั้งแต่วันนี้
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* ระดับชั้น + น้ำหนัก + ส่วนสูง */}
            <div className="grid grid-3 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold">ระดับชั้น</label>
                <select className="input" {...f('level')}>
                  <option value="K1">อ.1 (3 ขวบ)</option>
                  <option value="K2">อ.2 (4 ขวบ)</option>
                  <option value="K3">อ.3 (5 ขวบ)</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold">น้ำหนัก (กก.)</label>
                <input className="input" type="number" step="0.1" {...f('weight')} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold">ส่วนสูง (ซม.)</label>
                <input className="input" type="number" {...f('height')} />
              </div>
            </div>
          </div>
        )}

        {/* ════ Tab 2: ครอบครัว ════ */}
        {activeSubTab === 'family' && (
          <div className="grid grid-1 gap-4 animate-fade">
            {/* บิดา */}
            <div style={{ background: '#f0f9ff', borderRadius: '10px', padding: '.75rem 1rem' }}>
              <div className="text-xs font-bold mb-3" style={{ color: '#0369a1' }}>👨 บิดา</div>
              <div className="grid grid-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold">ชื่อ-สกุล</label>
                  <input className="input" {...f('fatherName')} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold">อาชีพ</label>
                  <input className="input" {...f('fatherOcc')} />
                </div>
              </div>
            </div>

            {/* มารดา */}
            <div style={{ background: '#fdf2f8', borderRadius: '10px', padding: '.75rem 1rem' }}>
              <div className="text-xs font-bold mb-3" style={{ color: '#9d174d' }}>👩 มารดา</div>
              <div className="grid grid-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold">ชื่อ-สกุล</label>
                  <input className="input" {...f('motherName')} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold">อาชีพ</label>
                  <input className="input" {...f('motherOcc')} />
                </div>
              </div>
            </div>

            {/* 🚌 การรับ-ส่ง (ค่าเริ่มต้น) */}
            <div style={{ background: '#fffbeb', borderRadius: '10px', padding: '.75rem 1rem', border: '1.5px solid #fde68a' }}>
              <div className="text-xs font-bold mb-3" style={{ color: '#92400e' }}>🚌 การรับ-ส่ง (ผู้ส่ง-รับประจำ)</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {/* ผู้ส่ง เช้า */}
                <div>
                  <div className="text-xs font-bold mb-2" style={{ color: '#b45309' }}>🌅 ผู้ส่ง (ตอนเช้า)</div>
                  <div style={{ display: 'flex', gap: '.3rem', flexWrap: 'wrap', marginBottom: '.5rem' }}>
                    {PICKUP_RELATIONS.map(r => (
                      <button key={r} type="button"
                        onClick={() => setFormData(fd => ({ ...fd, defaultDropoffRelation: r }))}
                        style={{
                          padding: '.2rem .55rem', borderRadius: '8px', fontFamily: 'inherit',
                          fontWeight: 700, fontSize: '.75rem', cursor: 'pointer',
                          border: formData.defaultDropoffRelation === r ? '2px solid #f59e0b' : '1.5px solid #e5e7eb',
                          background: formData.defaultDropoffRelation === r ? '#fef3c7' : 'white',
                          color: formData.defaultDropoffRelation === r ? '#92400e' : '#6b7280',
                        }}>
                        {PICKUP_REL_ICON[r]} {r}
                      </button>
                    ))}
                  </div>
                  <input className="input" placeholder="ชื่อเพิ่มเติม (กรณีอื่นๆ)"
                    style={{ fontSize: '.82rem' }}
                    value={formData.defaultDropoffName ?? ''}
                    onChange={e => setFormData(fd => ({ ...fd, defaultDropoffName: e.target.value }))} />
                </div>
                {/* ผู้รับ เย็น */}
                <div>
                  <div className="text-xs font-bold mb-2" style={{ color: '#166534' }}>🌆 ผู้รับ (ตอนเย็น)</div>
                  <div style={{ display: 'flex', gap: '.3rem', flexWrap: 'wrap', marginBottom: '.5rem' }}>
                    {PICKUP_RELATIONS.map(r => (
                      <button key={r} type="button"
                        onClick={() => setFormData(fd => ({ ...fd, defaultPickupRelation: r }))}
                        style={{
                          padding: '.2rem .55rem', borderRadius: '8px', fontFamily: 'inherit',
                          fontWeight: 700, fontSize: '.75rem', cursor: 'pointer',
                          border: formData.defaultPickupRelation === r ? '2px solid #86efac' : '1.5px solid #e5e7eb',
                          background: formData.defaultPickupRelation === r ? '#dcfce7' : 'white',
                          color: formData.defaultPickupRelation === r ? '#14532d' : '#6b7280',
                        }}>
                        {PICKUP_REL_ICON[r]} {r}
                      </button>
                    ))}
                  </div>
                  <input className="input" placeholder="ชื่อเพิ่มเติม (กรณีอื่นๆ)"
                    style={{ fontSize: '.82rem' }}
                    value={formData.defaultPickupName ?? ''}
                    onChange={e => setFormData(fd => ({ ...fd, defaultPickupName: e.target.value }))} />
                </div>
              </div>
            </div>

            {/* ผู้ปกครอง */}
            <div style={{ background: '#f0fdf4', borderRadius: '10px', padding: '.75rem 1rem' }}>
              <div className="text-xs font-bold mb-3" style={{ color: '#166534' }}>🏠 ผู้ปกครอง</div>
              <div className="grid grid-3 gap-3">
                <div className="flex flex-col gap-1" style={{ gridColumn: '1 / 3' }}>
                  <label className="text-xs font-bold">ชื่อ-สกุล</label>
                  <input className="input" {...f('guardianName')} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold">ความเกี่ยวข้อง</label>
                  <select className="input" {...f('guardianRelation')}>
                    <option>มารดา</option>
                    <option>บิดา</option>
                    <option>ปู่/ย่า</option>
                    <option>ตา/ยาย</option>
                    <option>อื่น ๆ</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-1 mt-3">
                <label className="text-xs font-bold">อาชีพ</label>
                <input className="input" {...f('guardianOcc')} />
              </div>
            </div>
          </div>
        )}

        {/* ════ Tab 3: ที่อยู่ / ติดต่อ ════ */}
        {activeSubTab === 'address' && (
          <div className="grid grid-2 gap-4 animate-fade">
            {/* บ้านเลขที่ + หมู่ที่/ซอย */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold">บ้านเลขที่</label>
              <input className="input" placeholder="เช่น 14/1" {...f('houseNo')} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold">หมู่ที่ / ตรอก / ซอย</label>
              <input className="input" {...f('moo')} />
            </div>

            {/* ถนน + ตำบล */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold">ถนน</label>
              <input className="input" {...f('road')} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold">ตำบล</label>
              <input className="input" placeholder="เช่น เพ" {...f('subdistrict')} />
            </div>

            {/* อำเภอ + จังหวัด */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold">อำเภอ</label>
              <input className="input" placeholder="เช่น เมืองระยอง" {...f('district')} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold">จังหวัด</label>
              <input className="input" {...f('province')} />
            </div>

            {/* เบอร์โทร */}
            <div className="flex flex-col gap-1" style={{ gridColumn: '1 / -1' }}>
              <label className="text-xs font-bold">เบอร์โทรผู้ปกครอง 📞</label>
              <input className="input" placeholder="0xx-xxx-xxxx" {...f('parentPhone')} />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 mt-8">
          <ModalCancelBtn onClick={onClose} />
          <ModalConfirmBtn type="submit" label="💾 บันทึกข้อมูล" />
        </div>
      </form>
      </div>
    </Modal>
  );
}
