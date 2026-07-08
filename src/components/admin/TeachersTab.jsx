import { useState } from 'react';
import { useApp } from '../../context/AppContext';

function PinCell({ pin }) {
  const [show, setShow] = useState(false);
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:'.3rem' }}>
      <code style={{ background:'#f5f3ff', padding:'.1rem .4rem', borderRadius:'5px', fontSize:'.8rem', letterSpacing: show ? '0' : '.15em' }}>
        {show ? pin : '••••••'}
      </code>
      <button type="button" onClick={() => setShow(s => !s)}
        style={{ background:'none', border:'none', cursor:'pointer', fontSize:'.85rem', color:'#7c3aed', padding:0 }}>
        {show ? '🙈' : '👁️'}
      </button>
    </span>
  );
}

const CLASS_OPTIONS = {
  K1: ['อ.1/1', 'อ.1/2'],
  K2: ['อ.2/1', 'อ.2/2'],
  K3: ['อ.3/1', 'อ.3/2', 'อ.3/3'],
};

const POSITION_OPTIONS = [
  'ครูผู้ช่วย',
  'ครู',
  'ครูชำนาญการ',
  'ครูชำนาญการพิเศษ',
  'ครูเชี่ยวชาญ',
  'ครูเชี่ยวชาญพิเศษ',
  'ครูอัตราจ้าง',
  'ครูพี่เลี้ยง',
  'พนักงานจ้าง',
  'อื่นๆ',
];

export default function TeachersTab() {
  const { teachers, setTeachers, handleImport } = useApp();
  const [isModal, setIsModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm]       = useState({});

  const openNew  = () => {
    setEditing(null);
    setForm({ firstName:'', lastName:'', position:'', level:'K1', className:'อ.1/1', email:'', phone:'', line:'', facebook:'', instagram:'', tiktok:'', youtube:'' });
    setIsModal(true);
  };
  const openEdit = t => { setEditing(t); setForm(t); setIsModal(true); };

  const handleLevelChange = lv => {
    setForm(f => ({ ...f, level: lv, className: CLASS_OPTIONS[lv]?.[0] ?? '' }));
  };

  const handleSave = e => {
    e.preventDefault();
    // Build display name from firstName + lastName
    const displayName = [form.firstName, form.lastName].filter(Boolean).join(' ');
    const saved = { ...form, name: displayName || form.name || '' };
    if (editing) setTeachers(teachers.map(t => t.id === editing.id ? { ...t, ...saved } : t));
    else setTeachers([...teachers, { ...saved, id: Date.now(), status: 'Active' }]);
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
              <th>ชื่อ-นามสกุล</th>
              <th>ระดับชั้น</th>
              <th>ห้องเรียน</th>
              <th>Username</th>
              <th>รหัสผ่าน</th>
              <th>เบอร์โทร</th>
              <th>สถานะ</th>
              <th>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {teachers.map(t => (
              <tr key={t.id} className="hover-row">
                <td>
                  <div className="font-bold">{t.name}</div>
                  {t.position && <div style={{ fontSize:'.78rem', color:'#7c3aed', fontWeight:600 }}>{t.position}</div>}
                  {t.email && <div style={{ fontSize:'.78rem', color:'#6b7280' }}>{t.email}</div>}
                </td>
                <td><span className={'badge badge-' + t.level.toLowerCase()}>{t.level}</span></td>
                <td>
                  {t.className
                    ? <span style={{ fontWeight: 700, color: 'var(--primary)', background: '#ede9fe', borderRadius: '6px', padding: '.15rem .55rem', fontSize: '.82rem' }}>{t.className}</span>
                    : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                </td>
                <td>
                  <code style={{ background:'#f0f9ff', padding:'.1rem .4rem', borderRadius:'5px', fontSize:'.8rem', color:'#0369a1' }}>
                    {t.username ?? '—'}
                  </code>
                </td>
                <td>{t.pin ? <PinCell pin={t.pin} /> : <span style={{ color:'var(--text-muted)' }}>—</span>}</td>
                <td style={{ fontSize:'.85rem' }}>{t.phone ?? '—'}</td>
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
          <div className="glass p-8 w-full animate-pop"
            style={{ maxWidth:'560px', maxHeight:'90vh', overflowY:'auto' }}
            onClick={e => e.stopPropagation()}>
            <h3 className="mb-4">{editing ? 'แก้ไขข้อมูลครู' : 'เพิ่มคุณครูใหม่'}</h3>
            <form onSubmit={handleSave} style={{ display:'flex',flexDirection:'column',gap:'.85rem' }}>

              {/* ชื่อ + นามสกุล */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.75rem' }}>
                <div>
                  <label style={{ display:'block',marginBottom:'.3rem',fontWeight:600,fontSize:'.85rem' }}>ชื่อ *</label>
                  <input className="input" required
                    value={form.firstName ?? (editing ? '' : '')}
                    onChange={e => setForm({ ...form, firstName: e.target.value })} />
                </div>
                <div>
                  <label style={{ display:'block',marginBottom:'.3rem',fontWeight:600,fontSize:'.85rem' }}>นามสกุล *</label>
                  <input className="input" required
                    value={form.lastName ?? ''}
                    onChange={e => setForm({ ...form, lastName: e.target.value })} />
                </div>
              </div>

              {/* ตำแหน่ง */}
              <div>
                <label style={{ display:'block',marginBottom:'.3rem',fontWeight:600,fontSize:'.85rem' }}>ตำแหน่ง</label>
                <select className="input" value={form.position ?? ''} onChange={e => setForm({ ...form, position: e.target.value })}>
                  <option value="">— เลือกตำแหน่ง —</option>
                  {POSITION_OPTIONS.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              {/* ระดับชั้น + ห้องเรียน */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.75rem' }}>
                <div>
                  <label style={{ display:'block',marginBottom:'.3rem',fontWeight:600,fontSize:'.85rem' }}>ระดับชั้น</label>
                  <select className="input" value={form.level||'K1'} onChange={e => handleLevelChange(e.target.value)}>
                    <option value="K1">อนุบาล 1 (K1)</option>
                    <option value="K2">อนุบาล 2 (K2)</option>
                    <option value="K3">อนุบาล 3 (K3)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display:'block',marginBottom:'.3rem',fontWeight:600,fontSize:'.85rem' }}>ห้องเรียน</label>
                  <select className="input" value={form.className||''} onChange={e=>setForm({...form,className:e.target.value})}>
                    {(CLASS_OPTIONS[form.level||'K1']??[]).map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Email */}
              <div>
                <label style={{ display:'block',marginBottom:'.3rem',fontWeight:600,fontSize:'.85rem' }}>E-mail *</label>
                <input className="input" type="email" required
                  value={form.email ?? ''}
                  onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>

              {/* เบอร์โทร */}
              <div>
                <label style={{ display:'block',marginBottom:'.3rem',fontWeight:600,fontSize:'.85rem' }}>เบอร์โทรศัพท์ *</label>
                <input className="input" required placeholder="0xx-xxx-xxxx"
                  value={form.phone ?? ''}
                  onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>

              {/* Username + PIN */}
              <div style={{ borderTop:'1.5px solid #e5e7eb', paddingTop:'.75rem' }}>
                <div style={{ fontWeight:700, fontSize:'.8rem', color:'#6b7280', marginBottom:'.6rem' }}>
                  🔐 ข้อมูล Login
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.75rem' }}>
                  <div>
                    <label style={{ display:'block',marginBottom:'.3rem',fontWeight:600,fontSize:'.85rem' }}>Username *</label>
                    <input className="input" required placeholder="เช่น teacher01"
                      value={form.username ?? ''}
                      onChange={e => setForm({ ...form, username: e.target.value.toLowerCase().replace(/\s/g,'') })} />
                  </div>
                  <div>
                    <label style={{ display:'block',marginBottom:'.3rem',fontWeight:600,fontSize:'.85rem' }}>รหัสผ่าน (PIN) *</label>
                    <input className="input" required placeholder="เช่น kru01"
                      value={form.pin ?? ''}
                      onChange={e => setForm({ ...form, pin: e.target.value })} />
                  </div>
                </div>
              </div>

              {/* Social — optional */}
              <div style={{ borderTop:'1.5px solid #e5e7eb', paddingTop:'.6rem' }}>
                <div style={{ fontWeight:700,fontSize:'.8rem',color:'#6b7280',marginBottom:'.6rem' }}>
                  📱 ช่องทาง Social (ไม่บังคับ)
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.6rem' }}>
                  {[
                    { key:'line',      label:'LINE',      ph:'@lineId' },
                    { key:'facebook',  label:'Facebook',  ph:'ชื่อเพจ' },
                    { key:'instagram', label:'Instagram', ph:'@username' },
                    { key:'tiktok',    label:'TikTok',    ph:'@username' },
                    { key:'youtube',   label:'YouTube',   ph:'ชื่อช่อง' },
                  ].map(s => (
                    <div key={s.key}>
                      <label style={{ display:'block',marginBottom:'.25rem',fontWeight:600,fontSize:'.8rem' }}>{s.label}</label>
                      <input className="input" style={{ fontSize:'.85rem' }} placeholder={s.ph}
                        value={form[s.key] ?? ''}
                        onChange={e => setForm({ ...form, [s.key]: e.target.value })} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 mt-2">
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
