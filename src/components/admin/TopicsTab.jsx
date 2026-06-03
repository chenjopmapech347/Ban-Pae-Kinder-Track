import { useState } from 'react';
import { useApp } from '../../context/AppContext';

export default function TopicsTab() {
  const { assessmentTopics, setAssessmentTopics } = useApp();
  const [isModal, setIsModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm]       = useState({});

  const openNew  = () => { setEditing(null); setForm({ label:'', emoji:'✨' }); setIsModal(true); };
  const openEdit = t => { setEditing(t); setForm(t); setIsModal(true); };

  const handleSave = e => {
    e.preventDefault();
    if (editing) setAssessmentTopics(assessmentTopics.map(t => t.id === editing.id ? { ...t, ...form } : t));
    else setAssessmentTopics([...assessmentTopics, { ...form, id: 'topic_' + Date.now() }]);
    setIsModal(false);
  };

  return (
    <div className="glass p-6 animate-fade">
      <div className="page-header mb-6">
        <h3>จัดการหัวข้อการประเมิน</h3>
        <button className="btn btn-primary" onClick={openNew}>+ เพิ่มหัวข้อ</button>
      </div>

      <div className="grid grid-2" style={{ gap:'1rem' }}>
        {assessmentTopics.map(t => (
          <div key={t.id} className="glass-card flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div style={{ fontSize:'2rem' }}>{t.emoji}</div>
              <div>
                <div className="font-bold">ด้าน{t.label}</div>
                <div className="text-xs text-muted">รหัส: {t.id}</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="btn btn-sm" onClick={() => openEdit(t)}>แก้ไข</button>
              <button className="btn btn-sm" style={{ color:'var(--danger)' }}
                onClick={() => { if(confirm('ลบหัวข้อนี้?')) setAssessmentTopics(assessmentTopics.filter(x => x.id !== t.id)); }}>ลบ</button>
            </div>
          </div>
        ))}
      </div>

      {isModal && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100 }}>
          <div className="glass p-8 w-full max-w-md animate-pop">
            <h3 className="mb-4">{editing ? 'แก้ไขหัวข้อ' : 'เพิ่มหัวข้อใหม่'}</h3>
            <form onSubmit={handleSave} style={{ display:'flex',flexDirection:'column',gap:'1rem' }}>
              <div><label style={{ display:'block',marginBottom:'.35rem' }}>ชื่อด้านพัฒนาการ</label>
                <input className="input" value={form.label||''} onChange={e=>setForm({...form,label:e.target.value})} required /></div>
              <div><label style={{ display:'block',marginBottom:'.35rem' }}>อิโมจิ</label>
                <input className="input" value={form.emoji||''} onChange={e=>setForm({...form,emoji:e.target.value})} placeholder="เช่น 🏃, ❤️, 💡" /></div>
              <div className="flex gap-2">
                <button type="button" className="btn flex-1" onClick={()=>setIsModal(false)}>ยกเลิก</button>
                <button type="submit" className="btn btn-primary flex-1">บันทึก</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
