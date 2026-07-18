import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import Modal, { ModalCancelBtn, ModalConfirmBtn } from '../Modal';

const AFFILIATION_OPTIONS = [
  'สังกัดเทศบาล',
  'สังกัดองค์การบริหารส่วนตำบล (อบต.)',
  'สังกัดองค์การบริหารส่วนจังหวัด (อบจ.)',
  'สังกัดกรุงเทพมหานคร (กทม.)',
  'สังกัดเมืองพัทยา',
  'สังกัดสำนักงานคณะกรรมการการศึกษาขั้นพื้นฐาน (สพฐ.)',
  'สังกัดสำนักงานคณะกรรมการส่งเสริมการศึกษาเอกชน (สช.)',
  'สังกัดกองบัญชาการตำรวจตระเวนชายแดน (ตชด.)',
  'อื่นๆ',
];

const EMPTY_FORM = { name: '', address: '', phone: '', principal: '', affiliation: '', logo: '' };

const FIELDS = [
  ['name',      'ชื่อโรงเรียน'],
  ['address',   'ที่อยู่'],
  ['phone',     'เบอร์โทร'],
  ['principal', 'ชื่อผู้อำนวยการ'],
];

export default function SchoolsTab() {
  const { schools, setSchools, setSchoolLogo } = useApp();
  const [isModal, setIsModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm]       = useState(EMPTY_FORM);

  const openNew  = () => { setEditing(null); setForm(EMPTY_FORM); setIsModal(true); };
  const openEdit = s  => { setEditing(s);    setForm({ ...EMPTY_FORM, ...s }); setIsModal(true); };
  const closeModal   = () => setIsModal(false);

  const handleField = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const handleLogoUpload = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => handleField('logo', ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSave = e => {
    e.preventDefault();
    const updated = editing
      ? schools.map(s => s.id === editing.id ? { ...s, ...form } : s)
      : [...schools, { ...form, id: Date.now() }];
    setSchools(updated);
    setSchoolLogo(form.logo || ''); // sync โลโก้ → AppContext (ใช้กับรายงานทุกอัน)
    closeModal();
  };

  const handleDelete = id => {
    if (confirm('ลบข้อมูลโรงเรียน?')) setSchools(schools.filter(s => s.id !== id));
  };

  return (
    <div className="glass p-6 animate-fade">
      <div className="page-header mb-6">
        <h3>จัดการข้อมูลโรงเรียน</h3>
        <button className="btn btn-primary" onClick={openNew}>+ เพิ่มโรงเรียน</button>
      </div>

      {/* ── School cards ── */}
      <div className="grid grid-2" style={{ gap: '1rem' }}>
        {schools.map(s => (
          <div key={s.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
            <div className="flex justify-between items-start">
              <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                {s.logo && (
                  <img src={s.logo} alt="โลโก้"
                    style={{ width: 48, height: 48, objectFit: 'contain', borderRadius: '8px', border: '1.5px solid #e5e7eb', background: '#fafafa' }} />
                )}
                <div className="font-bold text-primary" style={{ fontSize: '1rem' }}>{s.name}</div>
              </div>
              <div className="flex gap-2">
                <button className="btn btn-sm" onClick={() => openEdit(s)}>แก้ไข</button>
                <button className="btn btn-sm" style={{ color: 'var(--danger)' }}
                  onClick={() => handleDelete(s.id)}>ลบ</button>
              </div>
            </div>
            <div className="text-sm">📍 {s.address}</div>
            <div className="text-sm">📞 {s.phone}</div>
            <div className="text-sm text-muted">👤 ผอ. {s.principal}</div>
            {s.affiliation && <div className="text-sm text-muted">🏢 สังกัด {s.affiliation}</div>}
          </div>
        ))}
      </div>

      {/* ── Add / Edit modal ── */}
      <Modal
        isOpen={isModal}
        onClose={closeModal}
        title={editing ? 'แก้ไขโรงเรียน' : 'เพิ่มโรงเรียนใหม่'}
        size="md"
      >
        <form onSubmit={handleSave}
          style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '.85rem', padding: '1.25rem 1.5rem 1rem' }}>

          {/* Text fields */}
          {FIELDS.map(([key, label]) => (
            <div key={key}>
              <label style={{ display: 'block', marginBottom: '.35rem' }}>{label}</label>
              <input className="input" value={form[key] || ''}
                onChange={e => handleField(key, e.target.value)} />
            </div>
          ))}

          {/* Affiliation select */}
          <div>
            <label style={{ display: 'block', marginBottom: '.35rem' }}>สังกัด</label>
            <select className="input" value={form.affiliation || ''}
              onChange={e => handleField('affiliation', e.target.value)}
              style={{ cursor: 'pointer' }}>
              <option value="">— เลือกสังกัด —</option>
              {AFFILIATION_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>

          {/* Logo upload */}
          <div>
            <label style={{ display: 'block', marginBottom: '.35rem' }}>โลโก้โรงเรียน</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {form.logo && (
                <img src={form.logo} alt="โลโก้"
                  style={{ width: 64, height: 64, objectFit: 'contain', borderRadius: '10px',
                    border: '1.5px solid #e5e7eb', background: '#fafafa', flexShrink: 0 }} />
              )}
              <div style={{ flex: 1 }}>
                <input type="file" accept="image/*" onChange={handleLogoUpload}
                  style={{ fontSize: '.82rem', width: '100%' }} />
                <div style={{ fontSize: '.75rem', color: '#9ca3af', marginTop: '.25rem' }}>
                  PNG/SVG พื้นหลังโปร่งใส — ไม่เกิน 500 KB
                </div>
                {form.logo && (
                  <button type="button" onClick={() => handleField('logo', '')}
                    style={{ marginTop: '.35rem', fontSize: '.75rem', color: '#dc2626',
                      background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    ✕ ลบโลโก้
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-2">
            <ModalCancelBtn onClick={closeModal} />
            <ModalConfirmBtn type="submit" label="💾 บันทึก" />
          </div>
        </form>
      </Modal>
    </div>
  );
}
