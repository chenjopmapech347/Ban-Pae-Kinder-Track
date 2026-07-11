import { useState } from 'react';
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

// ช่วงปี พ.ศ. ที่แสดงใน dropdown (2555–2570)
const BE_YEARS = Array.from({ length: 16 }, (_, i) => 2555 + i).reverse();

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

  // ── Thai birth date ──
  const birthParts = parseBirthISO(formData.birthDate);
  const handleBirthChange = (part, val) => {
    const parts = { ...birthParts, [part]: val !== '' ? Number(val) : '' };
    const newISO = buildBirthISO(parts.day, parts.month, parts.yearBE);
    setFormData(fd => ({
      ...fd,
      birthDate: newISO,
      age: newISO ? calcAge(newISO) : fd.age,
    }));
  };

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
                  value={birthParts.day}
                  onChange={e => handleBirthChange('day', e.target.value)}>
                  <option value="">วัน</option>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>

                {/* เดือน */}
                <select className="input" style={{ width: '148px' }}
                  value={birthParts.month}
                  onChange={e => handleBirthChange('month', e.target.value)}>
                  <option value="">เดือน</option>
                  {THAI_MONTHS.map((m, i) => (
                    <option key={i + 1} value={i + 1}>{m}</option>
                  ))}
                </select>

                {/* ปี พ.ศ. */}
                <select className="input" style={{ width: '108px' }}
                  value={birthParts.yearBE}
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

            {/* เลขประจำตัวนักเรียน + PIN */}
            <div className="grid grid-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold">เลขประจำตัวนักเรียน</label>
                <input className="input" {...f('studentId')} />
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
                  style={{ color: (formData.status ?? 'ปกติ') === 'นอกระบบ' ? '#6b7280' : '#065f46', fontWeight: 700 }}>
                  <option value="ปกติ">✅ ปกติ</option>
                  <option value="นอกระบบ">⛔ นอกระบบ</option>
                </select>
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
