import { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { exportActivityLogExcel } from '../../utils/exportExcel';

function thaiDateTime(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    const date = d.toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const time = d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    return `${date} ${time}`;
  } catch { return iso; }
}

const SCORE_COLOR = {
  s3: { bg: '#d1fae5', color: '#065f46', label: 'ดีมาก' },
  s2: { bg: '#fef3c7', color: '#92400e', label: 'พอใช้' },
  s1: { bg: '#fee2e2', color: '#991b1b', label: 'ต้องพัฒนา' },
};

export default function ActivityLogTab() {
  const { activityLogs } = useApp();

  const [filterClass, setFilterClass]   = useState('');
  const [filterTeacher, setFilterTeacher] = useState('');
  const [filterRound, setFilterRound]   = useState('');
  const [page, setPage]                 = useState(1);
  const PAGE_SIZE = 20;

  // unique values for filters
  const classes  = useMemo(() => [...new Set(activityLogs.map(l => l.className))].sort(), [activityLogs]);
  const teachers = useMemo(() => [...new Set(activityLogs.map(l => l.recordedBy))].sort(), [activityLogs]);

  const filtered = useMemo(() => {
    return activityLogs.filter(l => {
      if (filterClass   && l.className   !== filterClass)   return false;
      if (filterTeacher && l.recordedBy  !== filterTeacher) return false;
      if (filterRound   && String(l.round) !== filterRound) return false;
      return true;
    });
  }, [activityLogs, filterClass, filterTeacher, filterRound]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleFilterChange = (setter) => (e) => { setter(e.target.value); setPage(1); };

  if (activityLogs.length === 0) {
    return (
      <div className="glass p-6 animate-fade">
        <div className="page-header mb-4">
          <h3>📋 ประวัติการประเมิน (Audit Trail)</h3>
        </div>
        <div style={{
          textAlign: 'center', padding: '4rem 1rem',
          color: 'var(--text-muted)', background: '#f8fafc',
          borderRadius: '14px', border: '1.5px dashed #e2e8f0',
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '.75rem' }}>📋</div>
          <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '.4rem' }}>ยังไม่มีประวัติการประเมิน</div>
          <div style={{ fontSize: '.85rem' }}>เมื่อครูบันทึกผลการประเมิน ประวัติจะปรากฏที่นี่</div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass p-6 animate-fade">
      <div className="page-header mb-4">
        <h3>📋 ประวัติการประเมิน (Audit Trail)</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            ทั้งหมด {filtered.length} รายการ
          </span>
          <button
            className="btn btn-sm"
            style={{ background: '#16a34a', color: 'white', border: 'none' }}
            onClick={() => exportActivityLogExcel(filtered)}
          >
            📥 Export Excel
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex', gap: '.75rem', flexWrap: 'wrap', marginBottom: '1.25rem',
        background: '#f8fafc', padding: '.85rem 1rem', borderRadius: '12px',
        border: '1.5px solid #e2e8f0',
      }}>
        <div>
          <label style={{ fontSize: '.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '.2rem' }}>ห้องเรียน</label>
          <select className="input" style={{ width: '120px', fontSize: '.82rem' }}
            value={filterClass} onChange={handleFilterChange(setFilterClass)}>
            <option value="">ทั้งหมด</option>
            {classes.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: '.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '.2rem' }}>ผู้ประเมิน</label>
          <select className="input" style={{ width: '170px', fontSize: '.82rem' }}
            value={filterTeacher} onChange={handleFilterChange(setFilterTeacher)}>
            <option value="">ทั้งหมด</option>
            {teachers.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: '.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '.2rem' }}>ครั้งที่</label>
          <select className="input" style={{ width: '110px', fontSize: '.82rem' }}
            value={filterRound} onChange={handleFilterChange(setFilterRound)}>
            <option value="">ทั้งหมด</option>
            {[1,2,3,4].map(r => <option key={r} value={r}>ครั้งที่ {r}</option>)}
          </select>
        </div>
        {(filterClass || filterTeacher || filterRound) && (
          <div style={{ alignSelf: 'flex-end' }}>
            <button className="btn btn-sm" onClick={() => { setFilterClass(''); setFilterTeacher(''); setFilterRound(''); setPage(1); }}
              style={{ color: 'var(--danger)' }}>✕ ล้างตัวกรอง</button>
          </div>
        )}
      </div>

      {/* Log entries */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
        {paginated.map(log => (
          <div key={log.id} style={{
            background: 'white', border: '1.5px solid #e2e8f0',
            borderRadius: '12px', padding: '.85rem 1.1rem',
          }}>
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '.75rem', flexWrap: 'wrap', marginBottom: '.5rem' }}>
              <div style={{
                background: '#f0fdf4', border: '1.5px solid #bbf7d0',
                borderRadius: '8px', padding: '.2rem .6rem',
                fontSize: '.72rem', fontWeight: 800, color: '#166534', flexShrink: 0,
              }}>
                ครั้งที่ {log.round}
              </div>
              <div style={{ fontWeight: 800, fontSize: '.88rem', flex: 1, minWidth: '150px' }}>
                [{log.activityLabel}]
              </div>
              <div style={{ fontSize: '.75rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                🕐 {thaiDateTime(log.timestamp)}
              </div>
            </div>

            {/* Detail row */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '.5rem' }}>
              <span style={{ fontSize: '.78rem', color: '#475569' }}>
                🏫 <strong>ห้อง {log.className}</strong>
              </span>
              <span style={{ fontSize: '.78rem', color: '#475569' }}>
                👤 {log.recordedBy}
              </span>
              <span style={{ fontSize: '.78rem', color: '#475569' }}>
                📂 {log.topicLabel} › [{log.indicatorCode}]
              </span>
            </div>

            {/* Score summary */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '.75rem', color: '#9ca3af', fontWeight: 600 }}>
                ประเมิน {log.assessed}/{log.totalStudents} คน:
              </span>
              {['s3','s2','s1'].map(k => {
                const v = log.scores?.[k] ?? 0;
                if (!v) return null;
                const { bg, color, label } = SCORE_COLOR[k];
                return (
                  <span key={k} style={{ background: bg, color, borderRadius: '6px', padding: '0 .5rem', fontSize: '.75rem', fontWeight: 800 }}>
                    {label} {v}
                  </span>
                );
              })}
              {!log.assessed && (
                <span style={{ fontSize: '.75rem', color: '#d1d5db' }}>— ไม่มีคะแนน</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '.5rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
          <button className="btn btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>‹ ก่อนหน้า</button>
          <span style={{ fontSize: '.82rem', fontWeight: 700, alignSelf: 'center', color: 'var(--text-muted)' }}>
            หน้า {page}/{totalPages}
          </span>
          <button className="btn btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>ถัดไป ›</button>
        </div>
      )}
    </div>
  );
}
