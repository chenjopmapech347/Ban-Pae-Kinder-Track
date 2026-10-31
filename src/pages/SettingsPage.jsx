import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { exportAttendanceLogExcel } from '../utils/exportExcel';
import { firebaseCreateUser, firebaseSendReset } from '../lib/firebaseAuth';
import GrowthReferencePanel from '../components/GrowthReferencePanel';
import { ui } from '../ui/ui';

const TABS = [
  { key: 'school',   label: '🏫 โรงเรียน' },
  { key: 'security', label: '🔐 ความปลอดภัย' },
  { key: 'cloud',    label: '☁️ Cloud & ข้อมูล' },
  { key: 'services', label: '🔌 บริการเชื่อมต่อ' },
];

export default function SettingsPage({ onBack }) {
  const {
    schoolName, setSchoolName,
    schoolPhilosophy, setSchoolPhilosophy,
    schoolVision, setSchoolVision,
    localGovSlogan, setLocalGovSlogan,
    schoolSlogan, setSchoolSlogan,
    schoolLogo, setSchoolLogo,
    schoolDirectorName, setSchoolDirectorName,
    yearDirectors, setYearDirectors,
    academicYears, setAcademicYears,
    resetAllData, authConfig, updateAuthConfig,
    exportBackupJson, importBackupJson,
    syncPushToCloud, syncPullFromCloud, isSupabaseConfigured,
    syncPushToFirebase, syncPullFromFirebase, isFirebaseConfigured,
    getDailyBackupList, restoreFromDailyBackup, autoSyncStatus,
    students, dailyRecords,
    aiApiKey, setAiApiKey,
    imgbbApiKey, setImgbbApiKey,
    
  } = useApp();

  const [activeTab, setActiveTab]     = useState('school');
  const [cloudBackups, setCloudBackups]   = useState(null);   // null = ยังไม่โหลด
  const [cloudBusy, setCloudBusy]         = useState(false);
  const [cloudMsg, setCloudMsg]           = useState('');
  const [restoreId, setRestoreId]         = useState(null);   // id ที่รอยืนยันกู้คืน

  const [newYear, setNewYear]         = useState('');
  const [adminPin, setAdminPin]       = useState(authConfig.admin.pin);
  const [teacherPin, setTeacherPin]   = useState(authConfig.teacher.pin);
  const [teacherName, setTeacherName] = useState(authConfig.teacher.name);

  // Firebase user management
  const [newEmail, setNewEmail]       = useState('');
  const [newPass, setNewPass]         = useState('');
  const [resetEmail, setResetEmail]   = useState('');

  const [syncMsg, setSyncMsg]         = useState('');
  const [syncing, setSyncing]         = useState(false);
  const [fbMsg, setFbMsg]             = useState('');

  // School info edit mode
  const [schoolEditing, setSchoolEditing] = useState(false);
  const [schoolSaved,   setSchoolSaved]   = useState(false);
  const [schoolDraft, setSchoolDraft] = useState({
    name: schoolName, localGov: localGovSlogan, school: schoolSlogan,
    philosophy: schoolPhilosophy, vision: schoolVision, directorName: schoolDirectorName,
  });

  function handleSchoolEdit() {
    setSchoolDraft({ name: schoolName, localGov: localGovSlogan, school: schoolSlogan,
      philosophy: schoolPhilosophy, vision: schoolVision, directorName: schoolDirectorName });
    setSchoolEditing(true);
    setSchoolSaved(false);
  }
  function handleSchoolSave() {
    setSchoolName(schoolDraft.name);
    setLocalGovSlogan(schoolDraft.localGov);
    setSchoolSlogan(schoolDraft.school);
    setSchoolPhilosophy(schoolDraft.philosophy);
    setSchoolVision(schoolDraft.vision);
    setSchoolDirectorName(schoolDraft.directorName);
    setSchoolEditing(false);
    setSchoolSaved(true);
  }
  function handleSchoolCancel() {
    setSchoolEditing(false);
  }

  const addYear = () => {
    if (newYear && !academicYears.includes(newYear)) {
      setAcademicYears([...academicYears, newYear].sort());
      setNewYear('');
    }
  };

  const saveAuth = () => {
    if (adminPin.length < 4 || teacherPin.length < 4) {
      alert('รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร');
      return;
    }
    updateAuthConfig({ admin: { pin: adminPin }, teacher: { pin: teacherPin, name: teacherName } });
    alert('บันทึกรหัสผ่านเรียบร้อยแล้ว ✅');
  };

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await importBackupJson(file);
    if (result.ok) { alert('นำเข้าข้อมูลสำเร็จ ✅'); window.location.reload(); }
    else alert(result.message);
    e.target.value = '';
  };

  const runSupabaseSync = async (dir) => {
    setSyncing(true); setSyncMsg('');
    const result = dir === 'push' ? await syncPushToCloud() : await syncPullFromCloud();
    setSyncing(false);
    setSyncMsg(result.ok
      ? (dir === 'push' ? 'อัปโหลดขึ้น Supabase สำเร็จ ✅' : 'ดึงข้อมูลจาก Supabase สำเร็จ ✅')
      : '❌ ' + result.message);
    if (result.ok && dir === 'pull') setTimeout(() => window.location.reload(), 1200);
  };

  const loadCloudBackups = async () => {
    setCloudBusy(true); setCloudMsg(''); setRestoreId(null);
    const r = await getDailyBackupList();
    setCloudBusy(false);
    if (r.ok) setCloudBackups(r.backups);
    else setCloudMsg('❌ โหลดรายการไม่สำเร็จ' + (r.message ? ': ' + r.message : ''));
  };

  const runRestoreCloudBackup = async (id) => {
    setCloudBusy(true); setCloudMsg('');
    const r = await restoreFromDailyBackup(id);
    setCloudBusy(false); setRestoreId(null);
    setCloudMsg(r.ok
      ? '✅ กู้คืนข้อมูลแล้ว — ระบบกำลังซิงค์ขึ้น Firebase อัตโนมัติ กรุณาอย่าปิดหน้านี้จนกว่าสถานะจะเป็น "ซิงค์แล้ว"'
      : '❌ ' + (r.message ?? 'กู้คืนไม่สำเร็จ'));
  };

  const runFirebaseSync = async (dir) => {
    setSyncing(true); setSyncMsg('');
    const result = dir === 'push' ? await syncPushToFirebase() : await syncPullFromFirebase();
    setSyncing(false);
    setSyncMsg(result.ok
      ? (dir === 'push'
          ? '🔥 อัปโหลดขึ้น Firebase สำเร็จ ✅'
          : '🔥 ดึงข้อมูลจาก Firebase สำเร็จ ✅' + (result.updatedAt ? ' (' + result.updatedAt + ')' : ''))
      : '❌ ' + result.message);
    if (result.ok && dir === 'pull') setTimeout(() => window.location.reload(), 1200);
  };

  const createFirebaseUser = async () => {
    if (!newEmail || !newPass) return;
    setFbMsg('กำลังสร้างบัญชี...');
    const result = await firebaseCreateUser(newEmail, newPass);
    setFbMsg(result.ok ? '✅ สร้างบัญชี ' + newEmail + ' สำเร็จ' : '❌ ' + result.message);
    if (result.ok) { setNewEmail(''); setNewPass(''); }
  };

  const sendPasswordReset = async () => {
    if (!resetEmail) return;
    const result = await firebaseSendReset(resetEmail);
    setFbMsg(result.ok ? '✅ ส่งอีเมล reset ไปที่ ' + resetEmail : '❌ ' + result.message);
  };

  return (
    <div {...ui('animate-fade')}>
      <div {...ui('page-header mb-6')}>
        <h2>⚙️ ตั้งค่าระบบ</h2>
        <button type="button" {...ui('btn')} onClick={onBack}>← ย้อนกลับ</button>
      </div>

      {/* ── Tab bar ── */}
      <div style={{ display:'flex', gap:'.5rem', flexWrap:'wrap', marginBottom:'1.5rem',
        borderBottom:'2px solid #e5e7eb', paddingBottom:'.75rem' }}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => { setActiveTab(tab.key); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            style={{
              padding:'.45rem 1.1rem',
              borderRadius:'8px',
              border: activeTab === tab.key ? '2px solid #4f46e5' : '2px solid transparent',
              cursor:'pointer',
              fontFamily:'inherit',
              fontSize:'.85rem',
              fontWeight: activeTab === tab.key ? 700 : 500,
              background: activeTab === tab.key ? '#4f46e5' : '#f3f4f6',
              color: activeTab === tab.key ? '#fff' : '#374151',
              transition:'all .15s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>

        {/* ══════════════════════════════════════════
            TAB 1: 🏫 โรงเรียน
            ══════════════════════════════════════════ */}
        {activeTab === 'school' && <>

          {/* ─── School info ─── */}
          <div {...ui('glass p-6')}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem' }}>
              <h3 style={{ margin:0 }}>🏫 ข้อมูลโรงเรียน</h3>
              <div style={{ display:'flex', gap:'.5rem', alignItems:'center' }}>
                {schoolSaved && !schoolEditing && (
                  <span style={{ color:'#059669', fontWeight:700, fontSize:'.82rem' }}>✅ บันทึกแล้ว</span>
                )}
                {!schoolEditing ? (
                  <button type="button" {...ui('btn btn-secondary', { fontSize:'.8rem', padding:'.35rem .9rem' })} onClick={handleSchoolEdit}>
                    ✏️ แก้ไข
                  </button>
                ) : (
                  <>
                    <button type="button" {...ui('btn btn-primary', { fontSize:'.8rem', padding:'.35rem .9rem' })} onClick={handleSchoolSave}>
                      💾 บันทึก
                    </button>
                    <button type="button" onClick={handleSchoolCancel}
                      style={{ fontSize:'.8rem', padding:'.35rem .9rem', borderRadius:'8px',
                        border:'1px solid #d1d5db', background:'white', cursor:'pointer', fontFamily:'inherit' }}>
                      ยกเลิก
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* ── Logo upload ── */}
            <div style={{ marginBottom:'1.25rem', padding:'1rem', background:'#f8fafc', borderRadius:'12px', border:'1px solid #e2e8f0' }}>
              <label style={{ display:'block', marginBottom:'.5rem', fontWeight:700, fontSize:'.85rem' }}>
                🖼️ โลโก้โรงเรียน (ใช้ในรายงานที่พิมพ์ออก)
              </label>
              <div style={{ display:'flex', alignItems:'center', gap:'1rem', flexWrap:'wrap' }}>
                {schoolLogo ? (
                  <img src={schoolLogo} alt="โลโก้โรงเรียน"
                    style={{ height:'72px', width:'72px', objectFit:'contain', borderRadius:'8px', border:'1px solid #e2e8f0', background:'white', padding:'4px' }} />
                ) : (
                  <div style={{ height:'72px', width:'72px', borderRadius:'8px', border:'2px dashed #cbd5e1',
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.75rem', color:'#94a3b8' }}>
                    🏫
                  </div>
                )}
                <div style={{ display:'flex', flexDirection:'column', gap:'.4rem' }}>
                  <label style={{ cursor:'pointer' }}>
                    <span {...ui('btn btn-secondary', { fontSize:'.8rem', padding:'.3rem .85rem', display:'inline-block' })}>
                      📁 เลือกรูปโลโก้
                    </span>
                    <input type="file" accept="image/*" style={{ display:'none' }}
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = ev => setSchoolLogo(ev.target.result);
                        reader.readAsDataURL(file);
                        e.target.value = '';
                      }} />
                  </label>
                  {schoolLogo && (
                    <button type="button" onClick={() => setSchoolLogo('')}
                      style={{ fontSize:'.75rem', color:'#dc2626', background:'none', border:'none',
                        cursor:'pointer', textAlign:'left', fontFamily:'inherit', padding:0 }}>
                      🗑️ ลบโลโก้
                    </button>
                  )}
                  <p style={{ margin:0, fontSize:'.72rem', color:'#94a3b8' }}>
                    รองรับ PNG, JPG, SVG · แนะนำ 200×200px ขึ้นไป
                  </p>
                </div>
              </div>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
              {[
                { label:'ชื่อโรงเรียน', key:'name', type:'input',
                  placeholder:'เช่น โรงเรียนเทศบาลบ้านเพ ๑' },
                { label:'🏛️ คำขวัญขององค์กรปกครองส่วนท้องถิ่น', key:'localGov', type:'input',
                  placeholder:'เช่น เด็กเล็กเบิกบาน วิชาการก้าวหน้า เยาวชนพัฒนา ปวงประชาร่วมใจ' },
                { label:'🎗️ คำขวัญของสถานศึกษาในสังกัดองค์กรปกครองส่วนท้องถิ่น', key:'school', type:'input',
                  placeholder:'เช่น วินัยดี มีวิชา กีฬาเด่น เป็นโรงเรียนของชุมชน' },
                { label:'📖 ปรัชญาการศึกษาปฐมวัย', key:'philosophy', type:'textarea', rows:4 },
                { label:'🎯 วิสัยทัศน์', key:'vision', type:'textarea', rows:3 },
                { label:'👤 ชื่อผู้บริหารสถานศึกษา', key:'directorName', type:'input',
                  placeholder:'เช่น นายสมชาย ใจดี' },
              ].map(({ label, key, type, placeholder, rows }) => (
                <div key={key}>
                  <label style={{ display:'block', marginBottom:'.35rem', fontWeight:700, fontSize:'.85rem' }}>
                    {label}
                  </label>
                  {schoolEditing ? (
                    type === 'textarea' ? (
                      <textarea {...ui('input', { resize:'vertical', lineHeight:1.8 })} rows={rows}
                        value={schoolDraft[key]}
                        onChange={e => setSchoolDraft(d => ({ ...d, [key]: e.target.value }))}
                      />
                    ) : (
                      <input {...ui('input')}
                        value={schoolDraft[key]}
                        onChange={e => setSchoolDraft(d => ({ ...d, [key]: e.target.value }))}
                        placeholder={placeholder}
                      />
                    )
                  ) : (
                    <div style={{
                      padding:'.55rem .85rem', borderRadius:'8px', background:'#f8fafc',
                      border:'1px solid #e2e8f0', fontSize:'.875rem', color:'#374151',
                      lineHeight:1.75, minHeight: type === 'textarea' ? '4rem' : 'auto',
                      whiteSpace:'pre-wrap', wordBreak:'break-word',
                    }}>
                      {(key === 'name' ? schoolName : key === 'localGov' ? localGovSlogan :
                        key === 'school' ? schoolSlogan : key === 'philosophy' ? schoolPhilosophy :
                        key === 'directorName' ? schoolDirectorName : schoolVision)
                        || <span style={{ color:'#9ca3af' }}>{placeholder || '(ยังไม่ได้กรอก)'}</span>}
                    </div>
                  )}
                </div>
              ))}
              <p style={{ fontSize:'.75rem', color:'#9ca3af', marginTop:'-.25rem' }}>
                ข้อมูลจะปรากฏในสมุดรายงานประจำตัวเด็กปฐมวัย (อ.01)
              </p>
            </div>
          </div>

          {/* ─── Academic years ─── */}
          <div {...ui('glass p-6')}>
            <h3 {...ui('mb-4')}>🗓️ จัดการปีการศึกษา</h3>
            <div {...ui('flex gap-2 mb-4')}>
              <input {...ui('input')} type="number" placeholder="เพิ่มปีการศึกษา เช่น 2570"
                value={newYear} onChange={e=>setNewYear(e.target.value)} />
              <button type="button" {...ui('btn btn-primary')} onClick={addYear}>เพิ่ม</button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'.75rem' }}>
              {academicYears.map(y => (
                <div key={y} style={{ border:'1.5px solid #e9d5ff', borderRadius:'12px', padding:'.75rem 1rem', background:'#faf5ff' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'.5rem', flexWrap:'wrap', marginBottom:'.6rem' }}>
                    <div {...ui('badge', { padding:'.4rem .9rem',background:'var(--primary)',color:'white',display:'flex',gap:'.5rem',flexShrink:0 })}>
                      ปีการศึกษา {y}
                      <span style={{ cursor:'pointer' }} onClick={()=>setAcademicYears(academicYears.filter(x=>x!==y))}>×</span>
                    </div>
                    <input
                      {...ui('input', { flex:1, minWidth:'200px', fontSize:'.82rem', padding:'.3rem .6rem' })}
                      placeholder={`ชื่อ ผอ. ปีการศึกษา ${y} (ไม่กรอก = ใช้ค่า default)`}
                      value={yearDirectors?.[y] ?? ''}
                      onChange={e => setYearDirectors(prev => ({ ...prev, [y]: e.target.value }))}
                    />
                  </div>
                  <div style={{ display:'flex', gap:'.5rem', flexWrap:'wrap', paddingLeft:'.25rem' }}>
                    {[1, 2].map(t => (
                      <div key={t} style={{
                        display:'flex', alignItems:'center', gap:'.35rem',
                        background:'white', border:'1.5px solid #d8b4fe',
                        borderRadius:'8px', padding:'.25rem .75rem',
                        fontSize:'.78rem', color:'#7c3aed', fontWeight:600,
                      }}>
                        <span style={{ fontSize:'.9rem' }}>📘</span>
                        ภาคเรียนที่ {t}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ─── Growth Reference ─── */}
          <div {...ui('glass p-6', { border:'1.5px solid #bbf7d0' })}>
            <h3 {...ui('mb-1')}>📊 เกณฑ์อ้างอิงน้ำหนักและส่วนสูง</h3>
            <p {...ui('text-sm text-muted mb-4')}>
              WHO Child Growth Standards 2006 / กรมอนามัย 2563 — อายุ 2–7 ปี (±1SD / ±2SD)
            </p>
            <GrowthReferencePanel />
          </div>
        </>}

        {/* ══════════════════════════════════════════
            TAB 2: 🔐 ความปลอดภัย
            ══════════════════════════════════════════ */}
        {activeTab === 'security' && <>

          {/* ─── PIN passwords (fallback) ─── */}
          <div {...ui('glass p-6')}>
            <h3 {...ui('mb-4')}>🔐 รหัสผ่าน PIN (Fallback)</h3>
            {isFirebaseConfigured && (
              <div {...ui('alert alert-info mb-4 text-sm')}>
                ℹ️ ใช้ Firebase Auth สำหรับ Admin/Teacher แล้ว — PIN ใช้ได้เฉพาะผู้ปกครอง
              </div>
            )}
            <div {...ui('grid grid-2', { gap: '1rem' })}>
              <div><label style={{ display:'block',marginBottom:'.35rem' }}>รหัสผู้ดูแลระบบ</label>
                <input {...ui('input')} type="password" value={adminPin} onChange={e=>setAdminPin(e.target.value)} /></div>
              <div><label style={{ display:'block',marginBottom:'.35rem' }}>รหัสครู</label>
                <input {...ui('input')} type="password" value={teacherPin} onChange={e=>setTeacherPin(e.target.value)} /></div>
              <div style={{ gridColumn:'1/-1' }}>
                <label style={{ display:'block',marginBottom:'.35rem' }}>ชื่อที่แสดงเมื่อครูล็อกอิน</label>
                <input {...ui('input')} value={teacherName} onChange={e=>setTeacherName(e.target.value)} />
              </div>
            </div>
            <p {...ui('text-xs text-muted mt-2')}>รหัสผู้ปกครอง (PIN) ตั้งได้ที่หน้านักเรียน</p>
            <button type="button" {...ui('btn btn-primary mt-4')} onClick={saveAuth}>บันทึกรหัสผ่าน</button>
          </div>

          {/* ─── Firebase Auth (user management) ─── */}
          {isFirebaseConfigured && (
            <div {...ui('glass p-6', { border:'2px solid #fbbf24' })}>
              <div {...ui('flex items-center gap-2 mb-4')}>
                <span style={{ fontSize:'1.5rem' }}>🔥</span>
                <h3 style={{ margin:0 }}>Firebase Auth — จัดการบัญชีผู้ใช้</h3>
                <span {...ui('badge badge-success')}>เชื่อมต่อแล้ว</span>
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
                {/* Create user */}
                <div>
                  <div {...ui('font-bold text-sm mb-2')}>👤 สร้างบัญชี Admin/Teacher ใหม่</div>
                  <div {...ui('flex gap-2 flex-wrap mb-2')}>
                    <input {...ui('input', { maxWidth:'220px' })} type="email" placeholder="อีเมล"
                      value={newEmail} onChange={e=>setNewEmail(e.target.value)} />
                    <input {...ui('input', { maxWidth:'180px' })} type="password" placeholder="รหัสผ่าน (6+ ตัว)"
                      value={newPass} onChange={e=>setNewPass(e.target.value)} />
                    <button type="button" {...ui('btn btn-primary', undefined, undefined, !newEmail || !newPass)} onClick={createFirebaseUser}
                      disabled={!newEmail || !newPass}>
                      สร้างบัญชี
                    </button>
                  </div>
                  <p {...ui('text-xs text-muted')}>หลังสร้างแล้ว ให้แจ้ง email + รหัสผ่านให้ครู/แอดมินที่เกี่ยวข้อง</p>
                </div>

                {/* Password reset */}
                <div style={{ borderTop:'1px solid var(--border-color)', paddingTop:'1rem' }}>
                  <div {...ui('font-bold text-sm mb-2')}>🔑 ส่งอีเมล Reset รหัสผ่าน</div>
                  <div {...ui('flex gap-2 flex-wrap')}>
                    <input {...ui('input', { maxWidth:'240px' })} type="email" placeholder="อีเมลที่ต้องการ reset"
                      value={resetEmail} onChange={e=>setResetEmail(e.target.value)} />
                    <button type="button" {...ui('btn', undefined, undefined, !resetEmail)} onClick={sendPasswordReset}
                      disabled={!resetEmail}>
                      ส่งอีเมล
                    </button>
                  </div>
                </div>

                {fbMsg && (
                  <div {...ui('alert text-sm ' + (fbMsg.includes('❌') ? 'alert-error' : 'alert-success'))}>
                    {fbMsg}
                  </div>
                )}
              </div>
            </div>
          )}

          {!isFirebaseConfigured && (
            <div {...ui('glass p-6', { border:'1.5px solid #e5e7eb' })}>
              <div {...ui('flex items-center gap-2 mb-3')}>
                <span style={{ fontSize:'1.25rem' }}>🔥</span>
                <h3 style={{ margin:0, fontSize:'1rem' }}>Firebase Auth</h3>
                <span {...ui('badge badge-accent')}>ยังไม่ได้ตั้งค่า</span>
              </div>
              <p {...ui('text-sm text-muted')}>
                กำหนดค่า Firebase ในแท็บ <strong>☁️ Cloud & ข้อมูล</strong> ก่อนเพื่อใช้งาน Firebase Auth
              </p>
            </div>
          )}
        </>}

        {/* ══════════════════════════════════════════
            TAB 3: ☁️ Cloud & ข้อมูล
            ══════════════════════════════════════════ */}
        {activeTab === 'cloud' && <>

          {/* ─── Firebase Sync ─── */}
          <div {...ui('glass p-6', { border: '2px solid ' + (isFirebaseConfigured ? '#fbbf24' : '#e8e3f4') })}>
            <div {...ui('flex items-center gap-2 mb-4')}>
              <span style={{ fontSize: '1.5rem' }}>🔥</span>
              <h3 style={{ margin: 0 }}>Firebase Firestore</h3>
              <span {...ui('badge ' + (isFirebaseConfigured ? 'badge-success' : 'badge-accent'))}>
                {isFirebaseConfigured ? 'เชื่อมต่อแล้ว' : 'ยังไม่ได้ตั้งค่า'}
              </span>
            </div>

            {!isFirebaseConfigured ? (
              <div>
                <p {...ui('text-sm text-muted mb-3')}>สร้างไฟล์ <code>.env</code> ในโฟลเดอร์โปรเจกต์:</p>
                <div style={{
                  background: '#1e1b4b', color: '#c4b5fd', borderRadius: '12px',
                  padding: '1rem', fontFamily: 'monospace', fontSize: '.8rem', lineHeight: 1.8,
                  overflowX: 'auto',
                }}>
                  <div>VITE_FIREBASE_API_KEY=<span style={{ color: '#fbbf24' }}>your-api-key</span></div>
                  <div>VITE_FIREBASE_AUTH_DOMAIN=<span style={{ color: '#fbbf24' }}>your-project.firebaseapp.com</span></div>
                  <div>VITE_FIREBASE_PROJECT_ID=<span style={{ color: '#fbbf24' }}>your-project-id</span></div>
                  <div>VITE_FIREBASE_STORAGE_BUCKET=<span style={{ color: '#fbbf24' }}>your-project.appspot.com</span></div>
                  <div>VITE_FIREBASE_MESSAGING_SENDER_ID=<span style={{ color: '#fbbf24' }}>123456789</span></div>
                  <div>VITE_FIREBASE_APP_ID=<span style={{ color: '#fbbf24' }}>1:123:web:abc</span></div>
                </div>
                <p {...ui('text-xs text-muted mt-3')}>
                  📋 ดูค่าได้ที่ Firebase Console → Project Settings → Your apps → Web app
                </p>
              </div>
            ) : (
              <div>
                <div {...ui('font-bold text-sm mb-2')}>☁️ ซิงค์ข้อมูล Firestore</div>
                <div {...ui('flex gap-2 flex-wrap')}>
                  <button type="button" {...ui('btn', { background:'#fef3c7',color:'#92400e' }, undefined, syncing)} disabled={syncing}
                    onClick={() => runFirebaseSync('push')}>
                    🔥 อัปโหลดขึ้น Firebase
                  </button>
                  <button type="button" {...ui('btn', { background:'#ede9fe',color:'#7c3aed' }, undefined, syncing)} disabled={syncing}
                    onClick={() => runFirebaseSync('pull')}>
                    ⬇️ ดึงจาก Firebase
                  </button>
                </div>
                {syncMsg && (
                  <div {...ui('alert mt-3 text-sm ' + (syncMsg.includes('❌') ? 'alert-error' : 'alert-success'))}>
                    {syncMsg}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ─── Backup ─── */}
          <div {...ui('glass p-6')}>
            <h3 {...ui('mb-4')}>💾 สำรองและกู้คืนข้อมูล</h3>
            <p {...ui('text-sm text-muted mb-4')}>ดาวน์โหลดไฟล์ JSON สำรอง หรือนำเข้าจากไฟล์เดิม</p>
            <div {...ui('flex gap-2 flex-wrap')}>
              <button type="button" {...ui('btn btn-primary')} onClick={exportBackupJson}>⬇️ ดาวน์โหลด JSON</button>
              <label {...ui('btn', { cursor:'pointer' })}>
                📂 นำเข้า JSON
                <input type="file" accept=".json,application/json" style={{ display:'none' }} onChange={handleImportFile} />
              </label>
              <button type="button" {...ui('btn', { background:'#dcfce7',color:'#166634' })}
                onClick={() => exportAttendanceLogExcel(students, dailyRecords, schoolName)}>
                📗 ส่งออกบันทึกรายวัน
              </button>
            </div>
          </div>

          {/* ─── Cloud daily backups (Firestore) ─── */}
          {isFirebaseConfigured && (
            <div {...ui('glass p-6')}>
              <h3 {...ui('mb-4')}>🗓️ กู้คืนจาก Backup รายวัน (Firebase)</h3>
              <p {...ui('text-sm text-muted mb-4')}>
                ระบบสำรองข้อมูลขึ้น Firebase ทุกครั้งที่ซิงค์ เลือกจุดย้อนหลังเพื่อกู้คืนได้
                การกู้คืนจะ <strong>แทนที่ข้อมูลปัจจุบันทั้งหมด</strong> ทั้งในเครื่องและบน Firebase
                แนะนำให้กด "ดาวน์โหลด JSON" เก็บไว้ก่อน
              </p>
              <button type="button" {...ui('btn', undefined, undefined, cloudBusy)} disabled={cloudBusy} onClick={loadCloudBackups}>
                {cloudBusy ? 'กำลังโหลด...' : cloudBackups ? '🔄 โหลดรายการใหม่' : '📋 โหลดรายการ Backup'}
              </button>
              {cloudMsg && (
                <div {...ui('alert mt-3 text-sm ' + (cloudMsg.includes('❌') ? 'alert-error' : 'alert-success'))}>
                  {cloudMsg}
                  {cloudMsg.startsWith('✅') && (
                    <div style={{ marginTop: 4, fontWeight: 700 }}>
                      สถานะซิงค์: {{ idle: 'ซิงค์แล้ว', pending: 'รอซิงค์...', syncing: 'กำลังซิงค์...', done: 'ซิงค์แล้ว', error: 'ซิงค์ไม่สำเร็จ ลองใหม่' }[autoSyncStatus] ?? autoSyncStatus}
                    </div>
                  )}
                </div>
              )}
              {cloudBackups && (
                cloudBackups.length === 0
                  ? <p {...ui('text-sm text-muted mt-3')}>ยังไม่มี Backup</p>
                  : (
                    <div style={{ marginTop: 12, maxHeight: 320, overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: 8 }}>
                      {cloudBackups.slice(0, 50).map(b => (
                        <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', padding: '8px 12px', borderBottom: '1px solid #f3f4f6', fontSize: '.8rem' }}>
                          <div style={{ flex: 1, minWidth: 180 }}>
                            <div style={{ fontWeight: 700, color: '#111827' }}>
                              {b.exportedAt ? new Date(b.exportedAt).toLocaleString('th-TH') : (b.backupDate ?? b.id)}
                            </div>
                            <div style={{ color: '#6b7280' }}>นักเรียน {b.studentCount} คน · บันทึกเช็คชื่อ {b.attendanceCount} วัน</div>
                          </div>
                          {restoreId === b.id ? (
                            <>
                              <button type="button" disabled={cloudBusy} onClick={() => runRestoreCloudBackup(b.id)}
                                style={{ padding: '4px 12px', borderRadius: 4, border: 'none', cursor: 'pointer', background: '#dc2626', color: '#fff', fontWeight: 700 }}>
                                ยืนยันกู้คืน
                              </button>
                              <button type="button" disabled={cloudBusy} onClick={() => setRestoreId(null)}
                                style={{ padding: '4px 12px', borderRadius: 4, border: 'none', cursor: 'pointer', background: '#f3f4f6', color: '#374151' }}>
                                ยกเลิก
                              </button>
                            </>
                          ) : (
                            <button type="button" disabled={cloudBusy} onClick={() => setRestoreId(b.id)}
                              style={{ padding: '4px 12px', borderRadius: 4, border: 'none', cursor: 'pointer', background: '#ede9fe', color: '#7c3aed', fontWeight: 700 }}>
                              กู้คืน
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )
              )}
            </div>
          )}

          {/* ─── Supabase (legacy) ─── */}
          {isSupabaseConfigured && (
            <div {...ui('glass p-6')}>
              <h3 {...ui('mb-4')}>☁️ ซิงค์ Supabase (เดิม)</h3>
              <div {...ui('flex gap-2 flex-wrap')}>
                <button type="button" {...ui('btn btn-primary', undefined, undefined, syncing)} disabled={syncing}
                  onClick={() => runSupabaseSync('push')}>อัปโหลด Supabase</button>
                <button type="button" {...ui('btn', undefined, undefined, syncing)} disabled={syncing}
                  onClick={() => runSupabaseSync('pull')}>ดึงจาก Supabase</button>
              </div>
              {syncMsg && <p {...ui('text-sm mt-3')}>{syncMsg}</p>}
            </div>
          )}

          {/* ─── Danger zone ─── */}
          <div {...ui('glass p-6', { border:'1.5px solid #fee2e2' })}>
            <h3 {...ui('mb-4', { color:'var(--danger)' })}>⚠️ พื้นที่อันตราย</h3>
            <p {...ui('text-sm text-muted mb-4')}>ล้างข้อมูลทั้งหมดในเครื่องนี้ (ไม่สามารถย้อนคืนได้)</p>
            <button type="button" {...ui('btn', { color:'var(--danger)',border:'1.5px solid var(--danger)' })}
              onClick={() => confirm('ล้างข้อมูลทั้งหมดใช่หรือไม่?') && resetAllData()}>
              🗑️ ล้างข้อมูลทั้งหมดในระบบ
            </button>
          </div>
        </>}

        {/* ══════════════════════════════════════════
            TAB 4: 🔌 บริการเชื่อมต่อ
            ══════════════════════════════════════════ */}
        {activeTab === 'services' && <>

          {/* ─── AI Settings ─── */}
          <div {...ui('glass p-6', { border: '1.5px solid #e0e7ff' })}>
            <h3 {...ui('mb-2')}>🤖 ตั้งค่า AI (Claude API)</h3>
            <p {...ui('text-sm text-muted mb-4')}>
              ใส่ API Key จาก{' '}
              <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer"
                style={{ color: '#7c3aed' }}>console.anthropic.com</a>
              {' '}เพื่อเปิดใช้งานคำแนะนำ AI หลังประเมินและสรุปพัฒนาการ
            </p>
            <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                {...ui('input', { flex: 1, minWidth: '260px', fontFamily: 'monospace', fontSize: '.85rem' })}
                type="password"
                value={aiApiKey}
                onChange={e => setAiApiKey(e.target.value)}
                placeholder="sk-ant-api03-..."
              />
              <button type="button" {...ui('btn btn-primary')}
                onClick={() => alert(aiApiKey ? '✅ บันทึก API Key แล้ว' : '⚠️ กรุณาใส่ API Key')}>
                💾 บันทึก
              </button>
              {aiApiKey && (
                <span style={{
                  background: '#d1fae5', color: '#065f46', borderRadius: '999px',
                  padding: '.25rem .75rem', fontSize: '.78rem', fontWeight: 700,
                }}>✅ พร้อมใช้งาน</span>
              )}
            </div>
            <div {...ui('text-xs text-muted mt-3')}>
              🔒 Key เก็บในเครื่องของคุณเท่านั้น ไม่ส่งออกไปไหน · ใช้ claude-haiku (ประหยัด ~$0.001/ครั้ง)
            </div>
          </div>

          {/* ─── ImgBB ─── */}
          <div {...ui('glass p-6', { border: '1.5px solid #bfdbfe' })}>
            <h3 {...ui('mb-2')}>🖼️ ตั้งค่า ImgBB (อัปโหลดรูปนักเรียน)</h3>
            <p {...ui('text-sm text-muted mb-4')}>
              ใส่ API Key จาก{' '}
              <a href="https://api.imgbb.com/" target="_blank" rel="noreferrer"
                style={{ color: '#2563eb' }}>api.imgbb.com</a>
              {' '}เพื่ออัปโหลดรูปภาพนักเรียนไปเก็บที่ ImgBB แทนการเก็บใน Firestore
            </p>
            <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                {...ui('input', { flex: 1, minWidth: '260px', fontFamily: 'monospace', fontSize: '.85rem' })}
                type="password"
                value={imgbbApiKey}
                onChange={e => setImgbbApiKey(e.target.value)}
                placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              />
              <button type="button" {...ui('btn btn-primary', { background: '#2563eb' })}
                onClick={() => alert(imgbbApiKey ? '✅ บันทึก ImgBB API Key แล้ว' : '⚠️ กรุณาใส่ API Key')}>
                💾 บันทึก
              </button>
              {imgbbApiKey && (
                <span style={{
                  background: '#dbeafe', color: '#1e40af', borderRadius: '999px',
                  padding: '.25rem .75rem', fontSize: '.78rem', fontWeight: 700,
                }}>✅ พร้อมใช้งาน</span>
              )}
            </div>
            <div {...ui('text-xs text-muted mt-3')}>
              🔒 Key เก็บในเครื่องของคุณเท่านั้น · รูปที่อัปโหลดจะได้ URL ถาวรจาก ImgBB (ฟรี)
            </div>
          </div>
        </>}

      </div>
    </div>
  );
}
