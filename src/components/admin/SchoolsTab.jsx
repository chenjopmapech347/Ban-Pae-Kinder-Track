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

export default function SchoolsTab() {
  const { schools, setSchools } = useApp();
  const [isModal, setIsModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm]       = useState({});

  const openNew  = () => { setEditing(null); setForm({ name:'',address:'',phone:'',principal:'',affiliation:'' }); setIsModal(true); };
  const openEdit = s => { setEditing(s); setForm(s); setIsModal(true); };

  const handleSave = e => {
    e.preventDefault();
    if (editing) setSchools(schools.map(s => s.id === editing.id ? { ...s, ...form } : s));
    else setSchools([...schools, { ...form, id: Date.now() }]);
    setIsModal(false);
  };

  return (
    <div className="glass p-6 animate-fade">
      <div className="page-header mb-6">
        <h3>จัดการข้อมูลโรงเรียน</h3>
        <button className="btn btn-primary" onClick={openNew}>+ เพิ่มโรงเรียน</button>
      </div>

      <div className="grid grid-2" style={{ gap:'1rem' }}>
        {schools.map(s => (
          <div key={s.id} className="glass-card" style={{ display:'flex',flexDirection:'column',gap:'.5rem' }}>
            <div className="flex justify-between items-start">
              <div className="font-bold text-primary" style={{ fontSize:'1rem' }}>{s.name}</div>
              <div className="flex gap-2">
                <button className="btn btn-sm" onClick={() => openEdit(s)}>แก้ไข</button>
                <button className="btn btn-sm" style={{ color:'var(--danger)' }}
                  onClick={() => { if(confirm('ลบข้อมูลโรงเรียน?')) setSchools(schools.filter(x=>x.id!==s.id)); }}>ลบ</button>
              </div>
            </div>
            <div className="text-sm">📍 {s.address}</div>
            <div className="text-sm">📞 {s.phone}</div>
            <div className="text-sm text-muted">👤 ผอ. {s.principal}</div>
            {s.affiliation && <div className="text-sm text-muted">🏢 สังกัด {s.affiliation}</div>}
          </div>
        ))}
      </div>

      <Modal
        isOpen={isModal}
        onClose={() => setIsModal(false)}
        title={editing ? 'แก้ไขโรงเรียน' : 'เพิ่มโรงเรียนใหม่'}
        size="md"
      >
        <form onSubmit={handleSave} style={{ display:'flex',flexDirection:'column',gap:'.85rem' }}>
          {[['name','ชื่อโรงเรียน'],['address','ที่อยู่'],['phone','เบอร์โทร'],['principal','ชื่อผู้อำนวยการ']].map(([k,l])=>(
            <div key={k}><label style={{ display:'block',marginBottom:'.35rem' }}>{l}</label>
              <input className="input" value={form[k]||''} onChange={e=>setForm({...form,[k]:e.target.value})} /></div>
          ))}
          <div>
            <label style={{ display:'block',marginBottom:'.35rem' }}>สังกัด</label>
            <select className="input" value={form.affiliation||''} onChange={e=>setForm({...form,affiliation:e.target.value})} style={{ cursor:'pointer' }}>
              <option value="">— เลือกสังกัด —</option>
              {AFFILIATION_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
          <div className="flex gap-2 mt-2">
            <ModalCancelBtn onClick={() => setIsModal(false)} />
            <ModalConfirmBtn type="submit" label="💾 บันทึก" />
          </div>
        </form>
      </Modal>
    </div>
  );
}
