import { useApp } from '../../context/AppContext';
import ExcelImportPanel from '../ExcelImportPanel';
import { AttendanceBarChart, ClassOverviewChart } from '../DevelopmentChart';

export default function OverviewTab() {
  const { students, teachers, assessmentTopics, announcements, setAnnouncements } = useApp();

  const stats = {
    total:    students.length,
    boys:     students.filter(s => s.name.includes('ชาย')).length,
    girls:    students.filter(s => s.name.includes('หญิง')).length,
    assessed: students.filter(s => s.assessments?.summary).length,
    pending:  students.filter(s => !s.assessments?.summary).length,
    teachers: teachers.length,
    rate: (() => {
      const tot = students.reduce((a,s) => a + (s.attendance?.total || 0), 0);
      const pre = students.reduce((a,s) => a + (s.attendance?.present || 0), 0);
      return tot ? ((pre / tot) * 100).toFixed(1) : '0';
    })(),
  };

  return (
    <div className="animate-fade">
      <ExcelImportPanel />

      {/* Stat Cards */}
      <div className="grid grid-4 mb-6" style={{ gap: '.75rem' }}>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg,#3b82f6,#60a5fa)' }}>
          <span className="stat-icon">👨‍🏫</span>
          <div className="stat-value">{stats.teachers}</div>
          <div className="stat-label">จำนวนคุณครู</div>
        </div>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg,#10b981,#34d399)' }}>
          <span className="stat-icon">👶</span>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">นักเรียนทั้งหมด · ชาย {stats.boys} หญิง {stats.girls}</div>
        </div>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }}>
          <span className="stat-icon">📋</span>
          <div className="stat-value">{stats.assessed}</div>
          <div className="stat-label">ประเมินแล้ว · รอ {stats.pending} คน</div>
        </div>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg,#f59e0b,#fbbf24)' }}>
          <span className="stat-icon">📅</span>
          <div className="stat-value">{stats.rate}%</div>
          <div className="stat-label">การมาเรียนภาพรวม</div>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-2 mb-6" style={{ gap: '1.25rem' }}>
        <div className="glass-card">
          <h4 className="mb-3">📊 การมาเรียนรายนักเรียน</h4>
          {students.length ? (
            <AttendanceBarChart students={students} />
          ) : (
            <div className="text-center text-muted" style={{ padding: '2rem' }}>ยังไม่มีข้อมูล</div>
          )}
        </div>
        <div className="glass-card">
          <h4 className="mb-3">🌱 พัฒนาการเฉลี่ยแต่ละชั้น</h4>
          {students.some(s => s.assessments?.summary) ? (
            <ClassOverviewChart students={students} topics={assessmentTopics} />
          ) : (
            <div className="text-center text-muted" style={{ padding: '2rem' }}>ยังไม่มีข้อมูลการประเมิน</div>
          )}
        </div>
      </div>

      {/* Announcements */}
      <div className="glass-card">
        <div className="flex justify-between items-center mb-4">
          <h4>📢 ข่าวสารและประกาศล่าสุด</h4>
          <button className="btn btn-sm btn-primary" onClick={() => {
            const title = prompt('หัวข้อประกาศ:');
            if (title) setAnnouncements([
              { id: Date.now(), title, date: new Date().toLocaleDateString('th-TH') },
              ...announcements,
            ]);
          }}>+ เพิ่มข่าว</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
          {announcements.slice(0, 4).map(n => (
            <div key={n.id} style={{
              display: 'flex', alignItems: 'flex-start', gap: '.75rem',
              padding: '.65rem .85rem', borderRadius: '12px', background: '#f5f3ff',
            }}>
              <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>📌</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '.9rem', marginBottom: '.15rem' }}>{n.title}</div>
                <div style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>{n.date}</div>
              </div>
              <span className="badge badge-info" style={{ fontSize: '.6rem', flexShrink: 0 }}>NEWS</span>
            </div>
          ))}
          {!announcements.length && (
            <div className="text-center text-muted" style={{ padding: '1.5rem' }}>ยังไม่มีประกาศ</div>
          )}
        </div>
      </div>
    </div>
  );
}
