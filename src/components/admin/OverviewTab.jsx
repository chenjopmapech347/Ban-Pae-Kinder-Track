import { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import ExcelImportPanel from '../ExcelImportPanel';
import { AttendanceBarChart, ClassRadarChart } from '../DevelopmentChart';

const ALL_CLASSES = ['อ.1/1', 'อ.1/2', 'อ.2/1', 'อ.2/2', 'อ.3/1', 'อ.3/2', 'อ.3/3'];
const ROUNDS = [1, 2, 3, 4];

export default function OverviewTab() {
  const { students, teachers, assessmentTopics, announcements, setAnnouncements } = useApp();

  // ── สถานะการประเมินแยกตามห้อง × ครั้ง ──────────────────────────────────────
  const pendingMatrix = useMemo(() => {
    return ALL_CLASSES.map(cls => {
      const sts = students.filter(s => s.className === cls && !s.name.startsWith('(ว่าง)'));
      if (!sts.length) return null;
      const rounds = ROUNDS.map(r => {
        const rKey = `r${r}`;
        const assessed = sts.filter(s => {
          const inds = s.assessments?.indicators ?? {};
          return Object.values(inds).some(actMap =>
            Object.values(actMap).some(scores => scores?.[rKey] != null)
          );
        }).length;
        return assessed; // number of students with ≥1 score in this round
      });
      return { cls, total: sts.length, rounds };
    }).filter(Boolean);
  }, [students]);

  const totalPending = pendingMatrix.reduce((sum, row) =>
    sum + row.rounds.filter(r => r === 0).length, 0
  );

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
          <h4 className="mb-3">📊 การมาเรียน</h4>
          {students.length ? (
            <AttendanceBarChart students={students} />
          ) : (
            <div className="text-center text-muted" style={{ padding: '2rem' }}>ยังไม่มีข้อมูล</div>
          )}
        </div>
        <div className="glass-card">
          <h4 className="mb-3">🌱 พัฒนาการเฉลี่ยแต่ละชั้น</h4>
          <ClassRadarChart students={students} topics={assessmentTopics} />
        </div>
      </div>

      {/* ── สถานะการประเมินรายห้อง ── */}
      <div className="glass-card" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <h4 style={{ margin: 0 }}>📋 สถานะการประเมินรายห้อง</h4>
          {totalPending > 0 && (
            <span style={{
              background: '#fef3c7', border: '1.5px solid #fbbf24', borderRadius: '8px',
              padding: '.15rem .6rem', fontSize: '.73rem', fontWeight: 800, color: '#92400e',
            }}>
              ⚠️ ยังไม่ได้ประเมิน {totalPending} รายการ
            </span>
          )}
          {totalPending === 0 && pendingMatrix.length > 0 && (
            <span style={{
              background: '#d1fae5', border: '1.5px solid #6ee7b7', borderRadius: '8px',
              padding: '.15rem .6rem', fontSize: '.73rem', fontWeight: 800, color: '#065f46',
            }}>
              ✅ ครบทุกห้องทุกครั้ง
            </span>
          )}
        </div>

        <div className="table-wrap">
          <table className="table" style={{ fontSize: '.82rem' }}>
            <thead>
              <tr>
                <th>ห้องเรียน</th>
                <th style={{ textAlign: 'center', width: '60px' }}>นักเรียน</th>
                {ROUNDS.map(r => (
                  <th key={r} style={{ textAlign: 'center', width: '90px' }}>ครั้งที่ {r}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pendingMatrix.map(({ cls, total, rounds }) => (
                <tr key={cls} className="hover-row">
                  <td style={{ fontWeight: 700 }}>{cls}</td>
                  <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{total}</td>
                  {rounds.map((assessed, i) => {
                    const isPending  = assessed === 0;
                    const isPartial  = assessed > 0 && assessed < total;
                    const bg    = isPending ? '#fee2e2' : isPartial ? '#fef3c7' : '#d1fae5';
                    const color = isPending ? '#991b1b' : isPartial ? '#92400e' : '#065f46';
                    const icon  = isPending ? '✕' : isPartial ? '~' : '✓';
                    return (
                      <td key={i} style={{ textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '.2rem',
                          background: bg, color, borderRadius: '7px',
                          padding: '.15rem .5rem', fontWeight: 800, fontSize: '.77rem',
                        }}>
                          {icon} {assessed}/{total}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
              {!pendingMatrix.length && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem' }}>
                    ยังไม่มีข้อมูลนักเรียน
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: '.6rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {[
            { icon: '✓', bg: '#d1fae5', color: '#065f46', label: 'ประเมินครบ' },
            { icon: '~', bg: '#fef3c7', color: '#92400e', label: 'ประเมินบางส่วน' },
            { icon: '✕', bg: '#fee2e2', color: '#991b1b', label: 'ยังไม่ได้ประเมิน' },
          ].map(({ icon, bg, color, label }) => (
            <span key={label} style={{ display: 'flex', alignItems: 'center', gap: '.3rem', fontSize: '.73rem', color: 'var(--text-muted)' }}>
              <span style={{ background: bg, color, borderRadius: '5px', padding: '0 .4rem', fontWeight: 800, fontSize: '.72rem' }}>{icon}</span>
              {label}
            </span>
          ))}
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
