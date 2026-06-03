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
    role,
    user,
    logout,
    academicYears,
    academicYear,
    setAcademicYear,
    evaluatingStudent,
    setEvaluatingStudent,
    selectedStudent,
    isSettingsOpen,
    setIsSettingsOpen,
    isAdding,
    setIsAdding,
    handleSaveEvaluation,
    assessmentTopics,
    addStudent,
  } = useApp();

  if (!role) return <LoginPage />;

  return (
    <div className="container">
      {/* ── App Header ── */}
      <header className="app-header no-print">
        <div>
          <h1>🌟 KinderTrack</h1>
          <div className="subtitle">{ROLE_LABEL[role] ?? role}</div>
        </div>

        <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
          <select
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
          >
            {academicYears.map((y) => (
              <option key={y} value={y}>ปีการศึกษา {y}</option>
            ))}
          </select>

          {role === 'admin' && (
            <button
              type="button"
              className="btn btn-sm"
              style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: '1.5px solid rgba(255,255,255,0.35)' }}
              onClick={() => setIsSettingsOpen(true)}
            >
              ⚙️ ตั้งค่า
            </button>
          )}

          <div className="flex items-center gap-2">
            <div className="text-right" style={{ lineHeight: 1.3 }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{user?.name}</div>
              <button
                type="button"
                style={{ fontSize: '0.72rem', opacity: 0.75, background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 0 }}
                onClick={logout}
              >
                ออกจากระบบ
              </button>
            </div>
            <div className="user-avatar">{ROLE_AVATAR[role] ?? '?'}</div>
          </div>
        </div>
      </header>

      <main>
        {evaluatingStudent ? (
          <EvaluationForm
            student={evaluatingStudent}
            onSave={handleSaveEvaluation}
            onCancel={() => setEvaluatingStudent(null)}
            assessmentTopics={assessmentTopics}
          />
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

      <StudentModal
        key="add-student"
        isOpen={isAdding}
        onClose={() => setIsAdding(false)}
        onSave={addStudent}
      />
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
