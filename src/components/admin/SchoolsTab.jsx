import { useState } from 'react';
import { useApp } from '../../context/AppContext';

export default function SchoolsTab() {
  const { schools, setSchools } = useApp();
  const [isModal, setIsModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm]       = useState({});

  const openNew  = () => { setEditing(null); setForm({ name:'',address:'',phone:'',principal:'' }); setIsModal(true); };
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
          </div>
        ))}
      </div>

      {isModal && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100 }}>
          <div className="glass p-8 w-full max-w-md animate-pop">
            <h3 className="mb-4">{editing?'แก้ไขโรงเรียน':'เพิ่มโรงเรียนใหม่'}</h3>
            <form onSubmit={handleSave} style={{ display:'flex',flexDirection:'column',gap:'.85rem' }}>
              {[['name','ชื่อโรงเรียน'],['address','ที่อยู่'],['phone','เบอร์โทร'],['principal','ชื่อผู้อำนวยการ']].map(([k,l])=>(
                <div key={k}><label style={{ display:'block',marginBottom:'.35rem' }}>{l}</label>
                  <input className="input" value={form[k]||''} onChange={e=>setForm({...form,[k]:e.target.value})} /></div>
              ))}
              <div className="flex gap-2 mt-2">
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
