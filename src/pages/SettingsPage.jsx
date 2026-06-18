import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { exportAttendanceLogExcel } from '../utils/exportExcel';
import { firebaseCreateUser, firebaseSendReset } from '../lib/firebaseAuth';

export default function SettingsPage({ onBack }) {
  const {
    schoolName, setSchoolName,
    schoolPhilosophy, setSchoolPhilosophy,
    schoolVision, setSchoolVision,
    localGovSlogan, setLocalGovSlogan,
    schoolSlogan, setSchoolSlogan,
    academicYears, setAcademicYears,
    resetAllData, authConfig, updateAuthConfig,
    exportBackupJson, importBackupJson,
    syncPushToCloud, syncPullFromCloud, isSupabaseConfigured,
    syncPushToFirebase, syncPullFromFirebase, isFirebaseConfigured,
    students, dailyRecords,
    aiApiKey, setAiApiKey,
  } = useApp();

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
    <div className="animate-fade">
      <div className="page-header mb-6">
        <h2>⚙️ ตั้งค่าระบบ</h2>
        <button type="button" className="btn" onClick={onBack}>← ย้อนกลับ</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* ─── PIN passwords (fallback) ─── */}
        <div className="glass p-6">
          <h3 className="mb-4">🔐 รหัสผ่าน PIN (Fallback)</h3>
          {isFirebaseConfigured && (
            <div className="alert alert-info mb-4 text-sm">
              ℹ️ ใช้ Firebase Auth สำหรับ Admin/Teacher แล้ว — PIN ใช้ได้เฉพาะผู้ปกครอง
            </div>
          )}
          <div className="grid grid-2" style={{ gap: '1rem' }}>
            <div><label style={{ display:'block',marginBottom:'.35rem' }}>รหัสผู้ดูแลระบบ</label>
              <input className="input" type="password" value={adminPin} onChange={e=>setAdminPin(e.target.value)} /></div>
            <div><label style={{ display:'block',marginBottom:'.35rem' }}>รหัสครู</label>
              <input className="input" type="password" value={teacherPin} onChange={e=>setTeacherPin(e.target.value)} /></div>
            <div style={{ gridColumn:'1/-1' }}>
              <label style={{ display:'block',marginBottom:'.35rem' }}>ชื่อที่แสดงเมื่อครูล็อกอิน</label>
              <input className="input" value={teacherName} onChange={e=>setTeacherName(e.target.value)} />
            </div>
          </div>
          <p className="text-xs text-muted mt-2">รหัสผู้ปกครอง (PIN) ตั้งได้ที่หน้านักเรียน</p>
          <button type="button" className="btn btn-primary mt-4" onClick={saveAuth}>บันทึกรหัสผ่าน</button>
        </div>

        {/* ─── School name ─── */}
        <div className="glass p-6">
          <h3 className="mb-4">🏫 ข้อมูลโรงเรียน</h3>
          <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            <div>
              <label style={{ display:'block',marginBottom:'.35rem',fontWeight:700,fontSize:'.85rem' }}>
                ชื่อโรงเรียน
              </label>
              <input className="input" value={schoolName} onChange={e=>setSchoolName(e.target.value)}
                placeholder="เช่น โรงเรียนเทศบาลบ้านเพ ๑" />
            </div>
            <div>
              <label style={{ display:'block',marginBottom:'.35rem',fontWeight:700,fontSize:'.85rem' }}>
                🏛️ คำขวัญขององค์กรปกครองส่วนท้องถิ่น
              </label>
              <input className="input"
                value={localGovSlogan}
                onChange={e => setLocalGovSlogan(e.target.value)}
                placeholder="เช่น เด็กเล็กเบิกบาน วิชาการก้าวหน้า เยาวชนพัฒนา ปวงประชาร่วมใจ"
              />
            </div>
            <div>
              <label style={{ display:'block',marginBottom:'.35rem',fontWeight:700,fontSize:'.85rem' }}>
                🎗️ คำขวัญของสถานศึกษาในสังกัดองค์กรปกครองส่วนท้องถิ่น
              </label>
              <input className="input"
                value={schoolSlogan}
                onChange={e => setSchoolSlogan(e.target.value)}
                placeholder="เช่น วินัยดี มีวิชา กีฬาเด่น เป็นโรงเรียนของชุมชน"
              />
            </div>
            <div>
              <label style={{ display:'block',marginBottom:'.35rem',fontWeight:700,fontSize:'.85rem' }}>
                📖 ปรัชญาการศึกษาปฐมวัย
              </label>
              <textarea className="input" rows={4}
                value={schoolPhilosophy}
                onChange={e => setSchoolPhilosophy(e.target.value)}
                placeholder="กรอกปรัชญาการศึกษาปฐมวัยของโรงเรียน (ถ้าไม่กรอก ระบบจะใช้ค่าเริ่มต้น)"
                style={{ resize:'vertical', lineHeight:1.8 }}
              />
            </div>
            <div>
              <label style={{ display:'block',marginBottom:'.35rem',fontWeight:700,fontSize:'.85rem' }}>
                🎯 วิสัยทัศน์
              </label>
              <textarea className="input" rows={3}
                value={schoolVision}
                onChange={e => setSchoolVision(e.target.value)}
                placeholder="กรอกวิสัยทัศน์ของโรงเรียน (ถ้าไม่กรอก ระบบจะใช้ค่าเริ่มต้น)"
                style={{ resize:'vertical', lineHeight:1.8 }}
              />
            </div>
            <p style={{ fontSize:'.75rem', color:'#9ca3af', marginTop:'-.25rem' }}>
              ข้อมูลจะปรากฏในสมุดรายงานประจำตัวเด็กปฐมวัย (อ.01)
            </p>
          </div>
        </div>

        {/* ─── Academic years ─── */}
        <div className="glass p-6">
          <h3 className="mb-4">🗓️ จัดการปีการศึกษา</h3>
          <div className="flex gap-2 mb-4">
            <input className="input" type="number" placeholder="เพิ่มปีการศึกษา เช่น 2570"
              value={newYear} onChange={e=>setNewYear(e.target.value)} />
            <button type="button" className="btn btn-primary" onClick={addYear}>เพิ่ม</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {academicYears.map(y => (
              <div key={y} className="badge" style={{ padding:'.5rem 1rem',background:'var(--primary)',color:'white',display:'flex',gap:'.5rem' }}>
                ปี {y}
                <span style={{ cursor:'pointer' }} onClick={()=>setAcademicYears(academicYears.filter(x=>x!==y))}>×</span>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Firebase Sync + Auth ─── */}
        <div className="glass p-6" style={{ border: '2px solid ' + (isFirebaseConfigured ? '#fbbf24' : '#e8e3f4') }}>
          <div className="flex items-center gap-2 mb-4">
            <span style={{ fontSize: '1.5rem' }}>🔥</span>
            <h3 style={{ margin: 0 }}>Firebase (Firestore + Auth)</h3>
            <span className={'badge ' + (isFirebaseConfigured ? 'badge-success' : 'badge-accent')}>
              {isFirebaseConfigured ? 'เชื่อมต่อแล้ว' : 'ยังไม่ได้ตั้งค่า'}
            </span>
          </div>

          {!isFirebaseConfigured ? (
            <div>
              <p className="text-sm text-muted mb-3">สร้างไฟล์ <code>.env</code> ในโฟลเดอร์โปรเจกต์:</p>
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
              <p className="text-xs text-muted mt-3">
                📋 ดูค่าได้ที่ Firebase Console → Project Settings → Your apps → Web app
              </p>
            </div>
          ) : (
            <div style={{ display:'flex',flexDirection:'column',gap:'1.25rem' }}>
              {/* Sync buttons */}
              <div>
                <div className="font-bold text-sm mb-2">☁️ ซิงค์ข้อมูล Firestore</div>
                <div className="flex gap-2 flex-wrap">
                  <button type="button" className="btn" disabled={syncing}
                    style={{ background:'#fef3c7',color:'#92400e' }}
                    onClick={() => runFirebaseSync('push')}>
                    🔥 อัปโหลดขึ้น Firebase
                  </button>
                  <button type="button" className="btn" disabled={syncing}
                    style={{ background:'#ede9fe',color:'#7c3aed' }}
                    onClick={() => runFirebaseSync('pull')}>
                    ⬇️ ดึงจาก Firebase
                  </button>
                </div>
                {syncMsg && (
                  <div className={'alert mt-3 text-sm ' + (syncMsg.includes('❌') ? 'alert-error' : 'alert-success')}>
                    {syncMsg}
                  </div>
                )}
              </div>

              {/* Create user */}
              <div style={{ borderTop:'1px solid var(--border-color)',paddingTop:'1rem' }}>
                <div className="font-bold text-sm mb-2">👤 สร้างบัญชี Admin/Teacher ใหม่</div>
                <div className="flex gap-2 flex-wrap mb-2">
                  <input className="input" type="email" placeholder="อีเมล"
                    value={newEmail} onChange={e=>setNewEmail(e.target.value)}
                    style={{ maxWidth:'220px' }} />
                  <input className="input" type="password" placeholder="รหัสผ่าน (6+ ตัว)"
                    value={newPass} onChange={e=>setNewPass(e.target.value)}
                    style={{ maxWidth:'180px' }} />
                  <button type="button" className="btn btn-primary" onClick={createFirebaseUser}
                    disabled={!newEmail || !newPass}>
                    สร้างบัญชี
                  </button>
                </div>
                <p className="text-xs text-muted">หลังสร้างแล้ว ให้แจ้ง email + รหัสผ่านให้ครู/แอดมินที่เกี่ยวข้อง</p>
              </div>

              {/* Password reset */}
              <div style={{ borderTop:'1px solid var(--border-color)',paddingTop:'1rem' }}>
                <div className="font-bold text-sm mb-2">🔑 ส่งอีเมล Reset รหัสผ่าน</div>
                <div className="flex gap-2 flex-wrap">
                  <input className="input" type="email" placeholder="อีเมลที่ต้องการ reset"
                    value={resetEmail} onChange={e=>setResetEmail(e.target.value)}
                    style={{ maxWidth:'240px' }} />
                  <button type="button" className="btn" onClick={sendPasswordReset}
                    disabled={!resetEmail}>
                    ส่งอีเมล
                  </button>
                </div>
              </div>

              {fbMsg && (
                <div className={'alert text-sm ' + (fbMsg.includes('❌') ? 'alert-error' : 'alert-success')}>
                  {fbMsg}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ─── Backup ─── */}
        <div className="glass p-6">
          <h3 className="mb-4">💾 สำรองและกู้คืนข้อมูล</h3>
          <p className="text-sm text-muted mb-4">ดาวน์โหลดไฟล์ JSON สำรอง หรือนำเข้าจากไฟล์เดิม</p>
          <div className="flex gap-2 flex-wrap">
            <button type="button" className="btn btn-primary" onClick={exportBackupJson}>⬇️ ดาวน์โหลด JSON</button>
            <label className="btn" style={{ cursor:'pointer' }}>
              📂 นำเข้า JSON
              <input type="file" accept=".json,application/json" style={{ display:'none' }} onChange={handleImportFile} />
            </label>
            <button type="button" className="btn" style={{ background:'#dcfce7',color:'#166634' }}
              onClick={() => exportAttendanceLogExcel(students, dailyRecords, schoolName)}>
              📗 ส่งออกบันทึกรายวัน
            </button>
          </div>
        </div>

        {/* ─── Supabase (legacy) ─── */}
        {isSupabaseConfigured && (
          <div className="glass p-6">
            <h3 className="mb-4">☁️ ซิงค์ Supabase (เดิม)</h3>
            <div className="flex gap-2 flex-wrap">
              <button type="button" className="btn btn-primary" disabled={syncing}
                onClick={() => runSupabaseSync('push')}>อัปโหลด Supabase</button>
              <button type="button" className="btn" disabled={syncing}
                onClick={() => runSupabaseSync('pull')}>ดึงจาก Supabase</button>
            </div>
            {syncMsg && <p className="text-sm mt-3">{syncMsg}</p>}
          </div>
        )}

        {/* ─── AI Settings ─── */}
        <div className="glass p-6" style={{ border: '1.5px solid #e0e7ff' }}>
          <h3 className="mb-2">🤖 ตั้งค่า AI (Claude API)</h3>
          <p className="text-sm text-muted mb-4">
            ใส่ API Key จาก{' '}
            <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer"
              style={{ color: '#7c3aed' }}>console.anthropic.com</a>
            {' '}เพื่อเปิดใช้งานคำแนะนำ AI หลังประเมินและสรุปพัฒนาการ
          </p>
          <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              className="input"
              type="password"
              value={aiApiKey}
              onChange={e => setAiApiKey(e.target.value)}
              placeholder="sk-ant-api03-..."
              style={{ flex: 1, minWidth: '260px', fontFamily: 'monospace', fontSize: '.85rem' }}
            />
            <button type="button" className="btn btn-primary"
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
          <div className="text-xs text-muted mt-3">
            🔒 Key เก็บในเครื่องของคุณเท่านั้น ไม่ส่งออกไปไหน · ใช้ claude-haiku (ประหยัด ~$0.001/ครั้ง)
          </div>
        </div>

        {/* ─── Danger zone ─── */}
        <div className="glass p-6" style={{ border:'1.5px solid #fee2e2' }}>
          <h3 className="mb-4" style={{ color:'var(--danger)' }}>⚠️ พื้นที่อันตราย</h3>
          <p className="text-sm text-muted mb-4">ล้างข้อมูลทั้งหมดในเครื่องนี้ (ไม่สามารถย้อนคืนได้)</p>
          <button type="button" className="btn" style={{ color:'var(--danger)',border:'1.5px solid var(--danger)' }}
            onClick={() => confirm('ล้างข้อมูลทั้งหมดใช่หรือไม่?') && resetAllData()}>
            🗑️ ล้างข้อมูลทั้งหมดในระบบ
          </button>
        </div>
      </div>
    </div>
  );
}
