import { useState } from 'react';
import { useApp } from '../../context/AppContext';

const CLASS_OPTIONS = {
  K1: ['อ.1/1', 'อ.1/2'],
  K2: ['อ.2/1', 'อ.2/2'],
  K3: ['อ.3/1', 'อ.3/2', 'อ.3/3'],
};

export default function TeachersTab() {
  const { teachers, setTeachers, handleImport } = useApp();
  const [isModal, setIsModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm]       = useState({});

  const openNew  = () => { setEditing(null); setForm({ name:'', level:'K1', className:'อ.1/1' }); setIsModal(true); };
  const openEdit = t => { setEditing(t); setForm(t); setIsModal(true); };

  const handleLevelChange = lv => {
    setForm(f => ({ ...f, level: lv, className: CLASS_OPTIONS[lv]?.[0] ?? '' }));
  };

  const handleSave = e => {
    e.preventDefault();
    if (editing) setTeachers(teachers.map(t => t.id === editing.id ? { ...t, ...form } : t));
    else setTeachers([...teachers, { ...form, id: Date.now(), status: 'Active' }]);
    setIsModal(false);
  };

  return (
    <div className="glass p-6 animate-fade">
      <div className="page-header mb-6">
        <h3>จัดการรายชื่อคุณครู</h3>
        <div className="flex gap-2">
          <button className="btn" style={{ background: '#f0f9ff' }} onClick={() => {
            const text = prompt('วาง CSV (ชื่อ, ระดับชั้น)\nเช่น: ครูใจดี, K1');
            if (text) { const r = handleImport('teachers','name,level\n'+text); alert(r.ok?'✅ นำเข้าสำเร็จ!':r.message); }
          }}>📥 CSV</button>
          <button className="btn btn-primary" onClick={openNew}>+ เพิ่มคุณครู</button>
        </div>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>ชื่อคุณครู</th>
              <th>ระดับชั้น</th>
              <th>ห้องเรียน</th>
              <th>สถานะ</th>
              <th>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {teachers.map(t => (
              <tr key={t.id} className="hover-row">
                <td className="font-bold">{t.name}</td>
                <td><span className={'badge badge-' + t.level.toLowerCase()}>{t.level}</span></td>
                <td>
                  {t.className
                    ? <span style={{ fontWeight: 700, color: 'var(--primary)', background: '#ede9fe', borderRadius: '6px', padding: '.15rem .55rem', fontSize: '.82rem' }}>{t.className}</span>
                    : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                </td>
                <td><span className="text-success">● {t.status}</span></td>
                <td>
                  <div className="row-actions">
                    <button className="btn btn-sm" onClick={() => openEdit(t)}>แก้ไข</button>
                    <button className="btn btn-sm" style={{ color:'var(--danger)' }}
                      onClick={() => setTeachers(teachers.filter(x => x.id !== t.id))}>ลบ</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModal && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100 }}
          onClick={e => { if (e.target === e.currentTarget) setIsModal(false); }}>
          <div className="glass p-8 w-full max-w-md animate-pop" onClick={e => e.stopPropagation()}>
            <h3 className="mb-4">{editing ? 'แก้ไขข้อมูลครู' : 'เพิ่มคุณครูใหม่'}</h3>
            <form onSubmit={handleSave} style={{ display:'flex',flexDirection:'column',gap:'1rem' }}>

              <div>
                <label style={{ display:'block',marginBottom:'.35rem',fontWeight:600 }}>ชื่อ-นามสกุล</label>
                <input className="input" value={form.name||''} onChange={e=>setForm({...form,name:e.target.value})} required />
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.75rem' }}>
                <div>
                  <label style={{ display:'block',marginBottom:'.35rem',fontWeight:600 }}>ระดับชั้น</label>
                  <select className="input" value={form.level||'K1'} onChange={e => handleLevelChange(e.target.value)}>
                    <option value="K1">อนุบาล 1 (K1)</option>
                    <option value="K2">อนุบาล 2 (K2)</option>
                    <option value="K3">อนุบาล 3 (K3)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display:'block',marginBottom:'.35rem',fontWeight:600 }}>ห้องเรียน</label>
                  <select className="input" value={form.className||''} onChange={e=>setForm({...form,className:e.target.value})}>
                    {(CLASS_OPTIONS[form.level||'K1']??[]).map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-2">
                <button type="button" className="btn flex-1" onClick={() => setIsModal(false)}>ยกเลิก</button>
                <button type="submit" className="btn btn-primary flex-1">💾 บันทึก</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
