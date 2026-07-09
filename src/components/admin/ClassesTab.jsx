import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import Modal, { ModalCancelBtn, ModalConfirmBtn } from '../Modal';

export default function ClassesTab() {
  const { classes, setClasses } = useApp();
  const [isModal, setIsModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm]       = useState({});

  const openNew  = () => { setEditing(null); setForm({ name:'', count:0 }); setIsModal(true); };
  const openEdit = c => { setEditing(c); setForm(c); setIsModal(true); };

  const handleSave = e => {
    e.preventDefault();
    if (editing) setClasses(classes.map(c => c.id === editing.id ? { ...c, ...form } : c));
    else setClasses([...classes, { ...form, id: Date.now() }]);
    setIsModal(false);
  };

  return (
    <div className="glass p-6 animate-fade">
      <div className="page-header mb-6">
        <h3>จัดการห้องเรียน / ระดับชั้น</h3>
        <button className="btn btn-primary" onClick={openNew}>+ เพิ่มห้องเรียน</button>
      </div>

      <div className="grid grid-2" style={{ gap: '1rem' }}>
        {classes.map(c => (
          <div key={c.id} className="glass-card flex justify-between items-center">
            <div>
              <div className="font-bold">{c.name}</div>
              <div className="text-sm text-muted">จำนวนนักเรียน: {c.count} คน</div>
            </div>
            <div className="flex gap-2">
              <button className="btn btn-sm" onClick={() => openEdit(c)}>แก้ไข</button>
              <button className="btn btn-sm" style={{ color:'var(--danger)' }}
                onClick={() => setClasses(classes.filter(x => x.id !== c.id))}>ลบ</button>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={isModal}
        onClose={() => setIsModal(false)}
        title={editing ? 'แก้ไขห้องเรียน' : 'เพิ่มห้องเรียนใหม่'}
        size="sm"
      >
        <form onSubmit={handleSave} style={{ display:'flex',flexDirection:'column',gap:'1rem' }}>
          <div><label style={{ display:'block',marginBottom:'.35rem' }}>ชื่อห้องเรียน</label>
            <input className="input" value={form.name||''} onChange={e=>setForm({...form,name:e.target.value})} required /></div>
          <div><label style={{ display:'block',marginBottom:'.35rem' }}>จำนวนนักเรียน</label>
            <input className="input" type="number" value={form.count||0} onChange={e=>setForm({...form,count:Number(e.target.value)})} /></div>
          <div className="flex gap-2 mt-2">
            <ModalCancelBtn onClick={() => setIsModal(false)} />
            <ModalConfirmBtn type="submit" label="💾 บันทึก" />
          </div>
        </form>
      </Modal>
    </div>
  );
}
