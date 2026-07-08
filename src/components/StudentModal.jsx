import { useState } from 'react';
import { useApp } from '../context/AppContext';

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

export default function StudentModal({ isOpen, onClose, onSave, editingStudent, anchorY }) {
  const { allClassNames } = useApp();
  const ALL_CLASSES = allClassNames;
  const [activeSubTab, setActiveSubTab] = useState('personal');
  const [formData, setFormData] = useState(() => ({ ...emptyStudent, ...(editingStudent ?? {}) }));

  if (!isOpen) return null;

  const f = (key) => ({
    value: formData[key] ?? '',
    onChange: (e) => setFormData(set(formData, key, e.target.value)),
  });

  const TABS = [
    { id: 'personal', label: '1. ประวัติส่วนตัว' },
    { id: 'family',   label: '2. ครอบครัว' },
    { id: 'address',  label: '3. ที่อยู่ / ติดต่อ' },
  ];

  const content = (
    <div className="modal-content glass" style={{ maxWidth: '850px', width: '95%' }}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="m-0">{editingStudent ? '📝 แก้ไขข้อมูลนักเรียน' : '👶 เพิ่มข้อมูลใหม่'}</h3>
        <button type="button" className="btn" onClick={onClose}>✕</button>
      </div>

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

            {/* วันเกิด + อายุ */}
            <div className="grid grid-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold">วัน เดือน ปีเกิด</label>
                <input className="input" type="date" {...f('birthDate')} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold">อายุ (ปี)</label>
                <input className="input" type="number" min="0" max="10" {...f('age')} />
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
          <button type="button" className="btn" onClick={onClose}>ยกเลิก</button>
          <button type="submit" className="btn btn-primary">💾 บันทึกข้อมูล</button>
        </div>
      </form>
    </div>
  );

  /* Anchored overlay — render near click position */
  if (anchorY != null) {
    return (
      <div style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,.45)',
        zIndex: 300,
        overflowY: 'auto',
        paddingTop: Math.max(12, anchorY - 120) + 'px',
        paddingBottom: '24px',
        display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
      }}
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div style={{ width: '100%', maxWidth: '850px', margin: '0 1rem' }}
          onClick={e => e.stopPropagation()}>
          {content}
        </div>
      </div>
    );
  }

  /* Default — centered overlay */
  return (
    <div className="modal-overlay">
      {content}
    </div>
  );
}
