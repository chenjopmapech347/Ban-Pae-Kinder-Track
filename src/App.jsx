import './index.css';
import { AppProvider, useApp } from './context/AppContext';
import LoginPage from './pages/LoginPage';
import SettingsPage from './pages/SettingsPage';
import AdminDashboard from './pages/AdminDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import ParentView from './pages/ParentView';
import ReportPage from './pages/ReportPage';
import EvaluationForm from './components/EvaluationForm';
import StudentModal from './components/StudentModal';
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
    evaluatingStudent, setEvaluatingStudent,
    selectedStudent,
    isSettingsOpen, setIsSettingsOpen,
    isAdding, setIsAdding,
    handleSaveEvaluation, assessmentTopics, addStudent,
    autoSyncStatus, isFirebaseConfigured,
  } = useApp();

  if (!role) return <LoginPage />;

  return (
    <div className="container">
      {/* ── App Header ── */}
      <header className="app-header no-print">
        <div style={{ display: 'flex', alignItems: 'center', gap: '.85rem' }}>
          <img
            src="/logo.png"
            alt="โลโก้โรงเรียนเทศบาลบ้านเพ ๑"
            style={{ width: '52px', height: '52px', borderRadius: '50%', objectFit: 'cover',
                     border: '2px solid rgba(255,255,255,0.4)', flexShrink: 0 }}
            onError={e => { e.target.style.display = 'none'; }}
          />
          <div style={{ lineHeight: 1.3 }}>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: 'white' }}>
              ระบบบันทึกพัฒนาการเด็กปฐมวัย
            </div>
            <div style={{ fontSize: '.75rem', color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>
              โรงเรียนเทศบาลบ้านเพ ๑ · Ban Phe 1 KinderTrack
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

          {/* ── Firebase auto-sync status indicator ── */}
          {isFirebaseConfigured && autoSyncStatus !== 'idle' && (
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
              <button type="button"
                onClick={logout}
                style={{
                  fontSize: '.72rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
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
      </header>

      <main>
        {evaluatingStudent ? (
          <EvaluationForm student={evaluatingStudent} onSave={handleSaveEvaluation}
            onCancel={() => setEvaluatingStudent(null)} assessmentTopics={assessmentTopics} />
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
        <span>โรงเรียนเทศบาลบ้านเพ ๑</span>
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
