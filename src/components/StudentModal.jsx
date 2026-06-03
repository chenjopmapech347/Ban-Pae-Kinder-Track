import { useState } from 'react';

const emptyStudent = {
  name: '',
  level: 'K1',
  age: '',
  weight: '',
  height: '',
  studentId: '',
  nationalId: '',
  nickname: '',
  gender: 'ชาย',
  fatherName: '',
  fatherOcc: '',
  motherName: '',
  motherOcc: '',
  address: '',
  phone: '',
  parentPin: '',
};

export default function StudentModal({ isOpen, onClose, onSave, editingStudent }) {
  const [activeSubTab, setActiveSubTab] = useState('personal');
  const [formData, setFormData] = useState(() => editingStudent ?? emptyStudent);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content glass" style={{ maxWidth: '850px', width: '95%' }}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="m-0">{editingStudent ? '📝 แก้ไขข้อมูลนักเรียน' : '👶 เพิ่มข้อมูลใหม่'}</h3>
          <button type="button" className="btn" onClick={onClose}>✕</button>
        </div>

        <div className="flex gap-2 mb-6 border-b">
          <button
            type="button"
            className={`btn ${activeSubTab === 'personal' ? 'btn-primary' : ''}`}
            style={{ borderRadius: '8px 8px 0 0', background: activeSubTab === 'personal' ? '' : 'white', border: '1px solid #eee' }}
            onClick={() => setActiveSubTab('personal')}
          >
            1. ประวัติส่วนตัว
          </button>
          <button
            type="button"
            className={`btn ${activeSubTab === 'family' ? 'btn-primary' : ''}`}
            style={{ borderRadius: '8px 8px 0 0', background: activeSubTab === 'family' ? '' : 'white', border: '1px solid #eee' }}
            onClick={() => setActiveSubTab('family')}
          >
            2. ประวัติครอบครัว
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave(formData);
          }}
        >
          {activeSubTab === 'personal' ? (
            <div className="grid grid-2 gap-4 animate-fade">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold">ชื่อ-นามสกุล</label>
                <input className="input" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div className="grid grid-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold">ชื่อเล่น</label>
                  <input className="input" value={formData.nickname} onChange={(e) => setFormData({ ...formData, nickname: e.target.value })} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold">เพศ</label>
                  <select className="input" value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })}>
                    <option>ชาย</option>
                    <option>หญิง</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold">เลขประจำตัว</label>
                  <input className="input" value={formData.studentId} onChange={(e) => setFormData({ ...formData, studentId: e.target.value })} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold">รหัสผู้ปกครอง (PIN)</label>
                  <input className="input" value={formData.parentPin} onChange={(e) => setFormData({ ...formData, parentPin: e.target.value })} placeholder="4 หลัก" />
                </div>
              </div>
              <div className="grid grid-3 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold">ระดับชั้น</label>
                  <select className="input" value={formData.level} onChange={(e) => setFormData({ ...formData, level: e.target.value })}>
                    <option value="K1">อ.1 (3 ขวบ)</option>
                    <option value="K2">อ.2 (4 ขวบ)</option>
                    <option value="K3">อ.3 (5 ขวบ)</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold">น้ำหนัก (กก.)</label>
                  <input className="input" type="number" step="0.1" value={formData.weight} onChange={(e) => setFormData({ ...formData, weight: e.target.value })} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold">ส่วนสูง (ซม.)</label>
                  <input className="input" type="number" value={formData.height} onChange={(e) => setFormData({ ...formData, height: e.target.value })} />
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-1 gap-4 animate-fade">
              <div className="grid grid-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold">ชื่อ-สกุล บิดา</label>
                  <input className="input" value={formData.fatherName} onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold">อาชีพ</label>
                  <input className="input" value={formData.fatherOcc} onChange={(e) => setFormData({ ...formData, fatherOcc: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold">ชื่อ-สกุล มารดา</label>
                  <input className="input" value={formData.motherName} onChange={(e) => setFormData({ ...formData, motherName: e.target.value })} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold">อาชีพ</label>
                  <input className="input" value={formData.motherOcc} onChange={(e) => setFormData({ ...formData, motherOcc: e.target.value })} />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold">ที่อยู่ติดต่อ</label>
                <textarea className="input" style={{ minHeight: '80px' }} value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 mt-8">
            <button type="button" className="btn" onClick={onClose}>ยกเลิก</button>
            <button type="submit" className="btn btn-primary">💾 บันทึกข้อมูล</button>
          </div>
        </form>
      </div>
    </div>
  );
}
