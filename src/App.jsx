import './index.css';
import { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import LoginPage from './pages/LoginPage';
import SettingsPage from './pages/SettingsPage';
import AdminDashboard from './pages/AdminDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import ParentView from './pages/ParentView';
import ReportPage from './pages/ReportPage';
import StudentReportTab from './components/admin/StudentReportTab';
import EvaluationForm from './components/EvaluationForm';
import StudentModal from './components/StudentModal';
import ChangePasswordModal from './components/ChangePasswordModal';
import { version as APP_VERSION } from '../package.json';

const APP_DEVELOPER = 'นายเจนจบ มาเพ็ชร์';

const ROLE_LABEL = {
  admin:   '🛡️ ผู้ดูแลระบบ',
  teacher: '👨‍🏫 คุณครู',
  parent:  '👨‍👩‍👧 ผู้ปกครอง',
};

const ROLE_AVATAR = {
  admin:   'AD',
  teacher: 'TR',
  parent:  'PR',
};

function AppShell() {
  const {
    role, user, logout,
    academicYears, academicYear, setAcademicYear,
    currentTerm, setCurrentTerm,
    evaluatingStudent, setEvaluatingStudent,
    selectedStudent, setSelectedStudent,
    isSettingsOpen, setIsSettingsOpen,
    isAdding, setIsAdding,
    handleSaveEvaluation, assessmentTopics, addStudent,
    autoSyncStatus, pullSyncStatus, isFirebaseConfigured,
    schools,
  } = useApp();

  const schoolName = schools?.[0]?.name ?? 'KinderTrack';

  const [changePwOpen, setChangePwOpen] = useState(false);

  // แจ้งเตือนเมื่อ localStorage เต็ม (quota exceeded)
  const [lsQuotaWarning, setLsQuotaWarning] = useState(false);
  useEffect(() => {
    const handler = () => {
      setLsQuotaWarning(true);
      setTimeout(() => setLsQuotaWarning(false), 8000);
    };
    window.addEventListener('ls-quota-error', handler);
    return () => window.removeEventListener('ls-quota-error', handler);
  }, []);

  if (!role) return <LoginPage />;

  return (
    <div className="container">
      {/* ── App Header ── */}
      <header className="app-header no-print">
        <div style={{ display: 'flex', alignItems: 'center', gap: '.85rem' }}>
          <img
            src="/logo.png"
            alt={`โลโก้ ${schoolName}`}
            style={{ width: '52px', height: '52px', borderRadius: '50%', objectFit: 'cover',
                     border: '2px solid rgba(255,255,255,0.4)', flexShrink: 0 }}
            onError={e => { e.target.style.display = 'none'; }}
          />
          <div style={{ lineHeight: 1.3 }}>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: 'white' }}>
              ระบบบันทึกพัฒนาการเด็กปฐมวัย
            </div>
            <div style={{ fontSize: '.75rem', color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>
              {schoolName} · KinderTrack
            </div>
            <div className="subtitle" style={{ fontSize: '.7rem', opacity: .75 }}>
              {ROLE_LABEL[role] ?? role}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
          <select value={academicYear} onChange={(e) => setAcademicYear(e.target.value)}>
            {academicYears.map((y) => (
              <option key={y} value={y}>ปีการศึกษา {y}</option>
            ))}
          </select>

          <select value={currentTerm} onChange={(e) => setCurrentTerm(e.target.value)}>
            <option value="1">ภาคเรียนที่ 1</option>
            <option value="2">ภาคเรียนที่ 2</option>
          </select>

          {/* ── Firebase sync status indicators ── */}
          {isFirebaseConfigured && pullSyncStatus === 'pulling' && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '.35rem',
              background: 'rgba(255,255,255,0.15)', borderRadius: '999px',
              padding: '.2rem .7rem', fontSize: '.72rem', fontWeight: 700,
              color: 'white', border: '1.5px solid rgba(255,255,255,0.3)',
            }}>
              <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>🔄</span> กำลังโหลดข้อมูล…
            </div>
          )}
          {isFirebaseConfigured && pullSyncStatus === 'error' && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '.35rem',
              background: 'rgba(255,80,80,0.25)', borderRadius: '999px',
              padding: '.2rem .7rem', fontSize: '.72rem', fontWeight: 700,
              color: 'white', border: '1.5px solid rgba(255,80,80,0.4)',
            }}>
              ⚠️ โหลดข้อมูลไม่สำเร็จ
            </div>
          )}
          {isFirebaseConfigured && autoSyncStatus !== 'idle' && pullSyncStatus !== 'pulling' && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '.35rem',
              background: 'rgba(255,255,255,0.15)', borderRadius: '999px',
              padding: '.2rem .7rem', fontSize: '.72rem', fontWeight: 700,
              color: 'white', border: '1.5px solid rgba(255,255,255,0.3)',
              transition: 'all .3s',
            }}>
              {autoSyncStatus === 'pending'  && <><span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span> รอบันทึก…</>}
              {autoSyncStatus === 'syncing'  && <><span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>🔄</span> กำลังบันทึก…</>}
              {autoSyncStatus === 'done'     && <>✅ บันทึกแล้ว</>}
              {autoSyncStatus === 'error'    && <>❌ บันทึกไม่สำเร็จ</>}
            </div>
          )}

          {role === 'admin' && (
            <button type="button" className="btn btn-sm"
              style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: '1.5px solid rgba(255,255,255,0.35)' }}
              onClick={() => setIsSettingsOpen(true)}>
              ⚙️ ตั้งค่า
            </button>
          )}

          <div className="flex items-center gap-2">
            <div className="user-avatar">{ROLE_AVATAR[role] ?? '?'}</div>
            <div style={{ lineHeight: 1.4 }}>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'white' }}>{user?.name}</div>
              <div style={{ display: 'flex', gap: '.35rem', marginTop: '.15rem', flexWrap: 'wrap' }}>
                {/* เปลี่ยนรหัสผ่าน — เฉพาะ admin และ ครู */}
                {(role === 'admin' || role === 'teacher') && (
                  <button type="button"
                    onClick={() => setChangePwOpen(true)}
                    style={{
                      fontSize: '.68rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                      background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)',
                      border: '1.5px solid rgba(255,255,255,0.3)',
                      borderRadius: '999px', padding: '.15rem .6rem',
                      transition: 'all .15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.22)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}>
                    🔑 เปลี่ยนรหัสผ่าน
                  </button>
                )}
                <button type="button"
                  onClick={logout}
                  style={{
                    fontSize: '.68rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                    background: 'rgba(255,255,255,0.18)', color: 'white',
                    border: '1.5px solid rgba(255,255,255,0.4)',
                    borderRadius: '999px', padding: '.15rem .65rem',
                    transition: 'background .15s',
                  }}>
                  🚪 ออกจากระบบ
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main>
        {evaluatingStudent ? (
          <EvaluationForm student={evaluatingStudent} onSave={handleSaveEvaluation}
            onCancel={() => setEvaluatingStudent(null)} assessmentTopics={assessmentTopics} />
        ) : selectedStudent && role === 'parent' ? (
          <div className="animate-fade">
            <div className="page-header mb-5 no-print">
              <button type="button" className="btn" onClick={() => setSelectedStudent(null)}>← ย้อนกลับ</button>
            </div>
            <StudentReportTab initialStudentId={selectedStudent.id} />
          </div>
        ) : selectedStudent ? (
          <ReportPage />
        ) : isSettingsOpen ? (
          <SettingsPage onBack={() => setIsSettingsOpen(false)} />
        ) : role === 'admin' ? (
          <AdminDashboard />
        ) : role === 'teacher' ? (
          <TeacherDashboard />
        ) : (
          <ParentView />
        )}
      </main>

      <StudentModal key="add-student" isOpen={isAdding} onClose={() => setIsAdding(false)} onSave={addStudent} />
      <ChangePasswordModal isOpen={changePwOpen} onClose={() => setChangePwOpen(false)} />

      {/* ── localStorage quota warning toast ── */}
      {lsQuotaWarning && (
        <div style={{
          position: 'fixed', bottom: '1.2rem', left: '50%', transform: 'translateX(-50%)',
          background: '#dc2626', color: 'white', borderRadius: '12px',
          padding: '.65rem 1.2rem', fontWeight: 700, fontSize: '.82rem',
          boxShadow: '0 4px 24px rgba(0,0,0,0.25)', zIndex: 9999,
          display: 'flex', alignItems: 'center', gap: '.5rem',
        }}>
          ⚠️ พื้นที่เก็บข้อมูลในเครื่องเต็ม — ข้อมูลบางส่วนอาจไม่ได้บันทึก กรุณาแจ้งผู้ดูแลระบบ
        </div>
      )}

      {/* ── Footer ── */}
      <footer className="no-print" style={{
        textAlign: 'center', padding: '.75rem 1rem',
        fontSize: '.7rem', color: 'rgba(255,255,255,0.6)',
        background: 'linear-gradient(135deg,#5b21b6,#6d28d9)',
        borderTop: '1px solid rgba(255,255,255,0.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: '.75rem', flexWrap: 'wrap',
      }}>
        <span>💻 KinderTrack v{APP_VERSION}</span>
        <span style={{ opacity: .35 }}>|</span>
        <span>{schoolName}</span>
        <span style={{ opacity: .35 }}>|</span>
        <span>พัฒนาโดย {APP_DEVELOPER}</span>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
