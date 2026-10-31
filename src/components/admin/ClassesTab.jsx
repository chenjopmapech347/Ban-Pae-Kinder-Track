import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import Modal, { ModalCancelBtn, ModalConfirmBtn } from '../Modal';
import { ui } from '../../ui/ui';

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
    <div {...ui('glass p-6 animate-fade')}>
      <div {...ui('page-header mb-6')}>
        <h3>จัดการห้องเรียน / ระดับชั้น</h3>
        <button {...ui('btn btn-primary')} onClick={openNew}>+ เพิ่มห้องเรียน</button>
      </div>

      <div {...ui('grid grid-2', { gap: '1rem' })}>
        {[...classes].sort((a, b) => a.name.localeCompare(b.name, 'th')).map(c => (
          <div key={c.id} {...ui('glass-card flex justify-between items-center')}>
            <div>
              <div {...ui('font-bold')}>{c.name}</div>
              <div {...ui('text-sm text-muted')}>จำนวนนักเรียน: {c.count} คน</div>
            </div>
            <div {...ui('flex gap-2')}>
              <button {...ui('btn btn-sm')} onClick={() => openEdit(c)}>แก้ไข</button>
              <button {...ui('btn btn-sm', { color:'var(--danger)' })}
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
            <input {...ui('input')} value={form.name||''} onChange={e=>setForm({...form,name:e.target.value})} required /></div>
          <div><label style={{ display:'block',marginBottom:'.35rem' }}>จำนวนนักเรียน</label>
            <input {...ui('input')} type="number" value={form.count||0} onChange={e=>setForm({...form,count:Number(e.target.value)})} /></div>
          <div {...ui('flex gap-2 mt-2')}>
            <ModalCancelBtn onClick={() => setIsModal(false)} />
            <ModalConfirmBtn type="submit" label="💾 บันทึก" />
          </div>
        </form>
      </Modal>
    </div>
  );
}
