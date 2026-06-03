import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { todayISO, formatDateThai } from '../utils/helpers';
import { getDayRecord, hasHygieneToday } from '../utils/attendance';

const ATT_OPTS   = ['มา','ขาด','ลา','ป่วย'];
const LUNCH_OPTS = ['หมด','เกือบหมด','ครึ่งเดียว','ไม่ทาน'];
const ATT_COLOR  = {
  มา:  { bg:'#d1fae5',color:'#065f46' },
  ขาด: { bg:'#fee2e2',color:'#991b1b' },
  ลา:  { bg:'#fef3c7',color:'#92400e' },
  ป่วย:{ bg:'#dbeafe',color:'#1e40af' },
};

function buildDraft(students, dailyRecords, date) {
  const d = {};
  students.forEach(s => {
    const r = getDayRecord(dailyRecords, date, s.id);
    d[s.id] = { attendance: r?.attendance ?? 'มา', milk: r?.milk ?? false, brush: r?.brush ?? false, lunch: r?.lunch ?? 'หมด' };
  });
  return d;
}

function AttendanceView({ students, draft, updateDraft, recordDate, loadDraftForDate, isSaved, dateLabel, onSave, onBack }) {
  return (
    <div className="animate-fade">
      <div className="page-header">
        <h2>📝 บันทึกการมาเรียน</h2>
        <button type="button" className="btn" onClick={onBack}>← ย้อนกลับ</button>
      </div>
      <div className="glass-card mb-4" style={{ background:'#faf9ff' }}>
        <div className="flex gap-2 items-center flex-wrap mb-3">
          <span className="font-bold text-sm">📅 วันที่:</span>
          <input type="date" className="input" style={{ width:'180px' }} value={recordDate}
            onChange={e => loadDraftForDate(e.target.value)} />
          <span className="text-sm text-muted">({dateLabel})</span>
        </div>
        <div className={'alert ' + (isSaved ? 'alert-success' : 'alert-info') + ' text-sm'}>
          {isSaved ? '✅ บันทึกแล้วสำหรับวันที่เลือก' : 'ℹ️ ยังไม่ได้บันทึก — กด "บันทึกการมาเรียน" ด้านล่าง'}
        </div>
      </div>
      <div style={{ display:'flex',flexDirection:'column',gap:'.6rem',marginBottom:'5rem' }}>
        {students.map((s,i) => {
          const att = draft[s.id]?.attendance ?? 'มา';
          const c   = ATT_COLOR[att] ?? { bg:'#f5f3ff',color:'#6b7280' };
          return (
            <div key={s.id} className="glass-card"
              style={{ padding:'.9rem 1.1rem',display:'flex',alignItems:'center',gap:'1rem' }}>
              <div className="student-avatar"
                style={{ background:c.bg,color:c.color,fontSize:'1rem',fontWeight:800 }}>
                {i+1}
              </div>
              <div style={{ flex:1,minWidth:0 }}>
                <div className="font-bold" style={{ fontSize:'.95rem',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis' }}>
                  {s.name}
                </div>
                <span className={'badge badge-' + (s.level?.toLowerCase())} style={{ marginTop:'.2rem' }}>{s.level}</span>
              </div>
              <select className="input"
                style={{ width:'110px',fontWeight:700,background:c.bg,color:c.color,border:'none' }}
                value={att} onChange={e => updateDraft(s.id,{ attendance:e.target.value })}>
                {ATT_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          );
        })}
      </div>
      <div className="flex justify-end gap-2" style={{ position:'sticky',bottom:16 }}>
        <button type="button" className="btn" onClick={onBack}>ยกเลิก</button>
        <button type="button" className="btn btn-primary" onClick={onSave}>✅ บันทึกการมาเรียน</button>
      </div>
    </div>
  );
}

function HygieneView({ students, draft, updateDraft, recordDate, loadDraftForDate, onSave, onBack }) {
  return (
    <div className="animate-fade">
      <div className="page-header">
        <h2>🥛 บันทึกกิจวัตรประจำวัน</h2>
        <button type="button" className="btn" onClick={onBack}>← ย้อนกลับ</button>
      </div>
      <div className="glass-card mb-4" style={{ background:'#faf9ff' }}>
        <div className="flex gap-2 items-center flex-wrap">
          <span className="font-bold text-sm">📅 วันที่:</span>
          <input type="date" className="input" style={{ width:'180px' }} value={recordDate}
            onChange={e => loadDraftForDate(e.target.value)} />
        </div>
      </div>
      <div style={{ display:'flex',flexDirection:'column',gap:'.6rem',marginBottom:'5rem' }}>
        {students.map(s => (
          <div key={s.id} className="glass-card" style={{ padding:'.9rem 1.1rem' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="student-avatar" style={{ background:'#ede9fe',color:'#7c3aed' }}>🧒</div>
              <div>
                <div className="font-bold" style={{ fontSize:'.95rem' }}>{s.name}</div>
                <span className={'badge badge-' + (s.level?.toLowerCase())}>{s.level}</span>
              </div>
            </div>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'.5rem' }}>
              <label style={{
                display:'flex',flexDirection:'column',alignItems:'center',gap:'.3rem',
                padding:'.6rem',borderRadius:'12px',cursor:'pointer',
                background: draft[s.id]?.milk ? '#d1fae5' : '#f5f3ff',
                border: '2px solid ' + (draft[s.id]?.milk ? '#10b981' : 'transparent'),
                transition:'all .15s',
              }}>
                <span style={{ fontSize:'1.4rem' }}>🥛</span>
                <span style={{ fontSize:'.72rem',fontWeight:700,color:draft[s.id]?.milk?'#065f46':'#6b7280' }}>ดื่มนม</span>
                <input type="checkbox" checked={Boolean(draft[s.id]?.milk)}
                  onChange={e => updateDraft(s.id,{ milk:e.target.checked })} style={{ display:'none' }} />
              </label>
              <label style={{
                display:'flex',flexDirection:'column',alignItems:'center',gap:'.3rem',
                padding:'.6rem',borderRadius:'12px',cursor:'pointer',
                background: draft[s.id]?.brush ? '#dbeafe' : '#f5f3ff',
                border: '2px solid ' + (draft[s.id]?.brush ? '#3b82f6' : 'transparent'),
                transition:'all .15s',
              }}>
                <span style={{ fontSize:'1.4rem' }}>🪥</span>
                <span style={{ fontSize:'.72rem',fontWeight:700,color:draft[s.id]?.brush?'#1e40af':'#6b7280' }}>แปรงฟัน</span>
                <input type="checkbox" checked={Boolean(draft[s.id]?.brush)}
                  onChange={e => updateDraft(s.id,{ brush:e.target.checked })} style={{ display:'none' }} />
              </label>
              <div style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:'.3rem' }}>
                <span style={{ fontSize:'1.4rem' }}>🍱</span>
                <select style={{
                  border:'1.5px solid #e8e3f4',borderRadius:'8px',fontSize:'.72rem',fontWeight:700,
                  padding:'.25rem',textAlign:'center',width:'100%',background:'#fef3c7',
                  color:'#92400e',fontFamily:'inherit',cursor:'pointer',
                }} value={draft[s.id]?.lunch ?? 'หมด'}
                  onChange={e => updateDraft(s.id,{ lunch:e.target.value })}>
                  {LUNCH_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-2" style={{ position:'sticky',bottom:16 }}>
        <button type="button" className="btn" onClick={onBack}>ยกเลิก</button>
        <button type="button" className="btn btn-success" onClick={onSave}>✅ บันทึกกิจวัตร</button>
      </div>
    </div>
  );
}

export default function TeacherDashboard() {
  const {
    students, setStudents, setIsAdding, setSelectedStudent, setEvaluatingStudent,
    handleImport, announcements, dailyRecords, saveDailyAttendance, saveDailyHygiene,
  } = useApp();

  const [activeView, setActiveView] = useState('main');
  const [recordDate, setRecordDate] = useState(todayISO);
  const [draft, setDraft]           = useState(() => buildDraft(students, dailyRecords, todayISO()));
  const [search, setSearch]         = useState('');

  const today     = todayISO();
  const dateLabel = formatDateThai(recordDate);

  const isSaved = useMemo(
    () => students.every(s => getDayRecord(dailyRecords, recordDate, s.id)?.attendance),
    [students, dailyRecords, recordDate],
  );

  const filtered = useMemo(
    () => students.filter(s => s.name.includes(search.trim())),
    [students, search],
  );

  const stats = useMemo(() => ({
    total:      students.length,
    attend:     students.filter(s => getDayRecord(dailyRecords, today, s.id)?.attendance === 'มา').length,
    hygiene:    students.filter(s => hasHygieneToday(getDayRecord(dailyRecords, today, s.id))).length,
    assessed:   students.filter(s => s.assessments?.summary).length,
  }), [students, dailyRecords, today]);

  const loadDraft = date => { setRecordDate(date); setDraft(buildDraft(students, dailyRecords, date)); };
  const updateDraft = (id, patch) => setDraft(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  const saveAttendance = () => {
    const rec = {};
    students.forEach(s => { rec[String(s.id)] = { attendance: draft[s.id]?.attendance ?? 'มา' }; });
    saveDailyAttendance(recordDate, rec);
    alert('บันทึกการมาเรียนเรียบร้อยแล้ว ✅');
    setActiveView('main');
  };

  const saveHygiene = () => {
    const rec = {};
    students.forEach(s => {
      const d = draft[s.id];
      rec[String(s.id)] = { milk: Boolean(d?.milk), brush: Boolean(d?.brush), lunch: d?.lunch ?? 'หมด' };
    });
    saveDailyHygiene(recordDate, rec);
    alert('บันทึกกิจวัตรประจำวันเรียบร้อยแล้ว ✅');
    setActiveView('main');
  };

  const handleDelete = id => {
    if (confirm('คุณต้องการลบข้อมูลนักเรียนรายนี้ใช่หรือไม่?'))
      setStudents(students.filter(s => s.id !== id));
  };

  if (activeView === 'attendance')
    return <AttendanceView students={students} draft={draft} updateDraft={updateDraft}
      recordDate={recordDate} loadDraftForDate={loadDraft} isSaved={isSaved} dateLabel={dateLabel}
      onSave={saveAttendance} onBack={() => setActiveView('main')} />;

  if (activeView === 'hygiene')
    return <HygieneView students={students} draft={draft} updateDraft={updateDraft}
      recordDate={recordDate} loadDraftForDate={loadDraft}
      onSave={saveHygiene} onBack={() => setActiveView('main')} />;

  return (
    <div className="animate-fade">
      {announcements[0] && (
        <div className="announce-banner mb-6">
          <span className="announce-icon">📢</span>
          <div style={{ flex:1,minWidth:0 }}>
            <div className="announce-title">{announcements[0].title}</div>
            <div className="announce-date">📅 {announcements[0].date}</div>
          </div>
        </div>
      )}

      <div className="grid grid-4 mb-6" style={{ gap:'.75rem' }}>
        <div className="stat-card" style={{ background:'linear-gradient(135deg,#7c3aed,#a855f7)' }}>
          <span className="stat-icon">👶</span>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">นักเรียนทั้งหมด</div>
        </div>
        <div className="stat-card" style={{ background:'linear-gradient(135deg,#10b981,#34d399)' }}>
          <span className="stat-icon">✅</span>
          <div className="stat-value">{stats.attend}</div>
          <div className="stat-label">มาเรียนวันนี้</div>
        </div>
        <div className="stat-card" style={{ background:'linear-gradient(135deg,#f59e0b,#fbbf24)' }}>
          <span className="stat-icon">🥛</span>
          <div className="stat-value">{stats.hygiene}</div>
          <div className="stat-label">บันทึกกิจวัตรแล้ว</div>
        </div>
        <div className="stat-card" style={{ background:'linear-gradient(135deg,#3b82f6,#60a5fa)' }}>
          <span className="stat-icon">📋</span>
          <div className="stat-value">{stats.assessed}</div>
          <div className="stat-label">ประเมินแล้ว</div>
        </div>
      </div>

      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:'.75rem',marginBottom:'1.5rem' }}>
        <button type="button" className="btn"
          style={{ background:'#d1fae5',color:'#065f46',padding:'.85rem',fontSize:'.9rem',borderRadius:'14px' }}
          onClick={() => { loadDraft(today); setActiveView('hygiene'); }}>
          🥛 บันทึกกิจวัตร
        </button>
        <button type="button" className="btn"
          style={{ background:'#fef3c7',color:'#92400e',padding:'.85rem',fontSize:'.9rem',borderRadius:'14px' }}
          onClick={() => { loadDraft(today); setActiveView('attendance'); }}>
          📅 เช็คชื่อ
        </button>
        <button type="button" className="btn"
          style={{ background:'#dbeafe',color:'#1e40af',padding:'.85rem',fontSize:'.9rem',borderRadius:'14px' }}
          onClick={() => {
            const text = prompt('วางข้อมูล CSV (ชื่อ, ชั้น, อายุ, น้ำหนัก, ส่วนสูง)\nเช่น: เด็กชายดีใจ, K3, 5, 18.5, 110');
            if (text) {
              const r = handleImport('students', 'name,level,age,weight,height\n' + text);
              alert(r.ok ? 'นำเข้าข้อมูลสำเร็จ! ✅' : r.message);
            }
          }}>
          📥 นำเข้าข้อมูล
        </button>
        <button type="button" className="btn btn-primary"
          style={{ padding:'.85rem',fontSize:'.9rem',borderRadius:'14px' }}
          onClick={() => setIsAdding(true)}>
          ➕ เพิ่มนักเรียน
        </button>
      </div>

      <div className="glass" style={{ padding:'1.5rem' }}>
        <div className="page-header" style={{ marginBottom:'1rem' }}>
          <h3>👨‍🎓 รายชื่อนักเรียน ({filtered.length}/{students.length} คน)</h3>
          <input className="input" style={{ maxWidth:'220px' }} placeholder="🔍 ค้นหาชื่อ..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div style={{ display:'flex',flexDirection:'column',gap:'.6rem' }}>
          {filtered.map(s => {
            const rec     = getDayRecord(dailyRecords, today, s.id);
            const hygOk   = hasHygieneToday(rec);
            const att     = rec?.attendance;
            const ac      = att ? (ATT_COLOR[att] ?? { bg:'#f5f3ff',color:'#6b7280' }) : null;
            const isBoy   = s.name.includes('ชาย');
            const pct     = s.attendance?.total
              ? Math.round((s.attendance.present / s.attendance.total) * 100) : 0;

            return (
              <div key={s.id} className="student-card"
                style={{ display:'flex',alignItems:'center',gap:'1rem',flexWrap:'wrap' }}>
                <div className="student-avatar"
                  style={{ background:isBoy?'#dbeafe':'#fce7f3', color:isBoy?'#1e40af':'#9d174d' }}>
                  {isBoy ? '👦' : '👧'}
                </div>
                <div style={{ flex:1,minWidth:'130px' }}>
                  <div className="font-bold" style={{ fontSize:'.92rem' }}>{s.name}</div>
                  <div className="flex gap-1 mt-1" style={{ flexWrap:'wrap' }}>
                    <span className={'badge badge-' + (s.level?.toLowerCase())}>{s.level}</span>
                    {att && <span className="badge" style={{ background:ac?.bg,color:ac?.color }}>{att}</span>}
                    {hygOk && <><span className="badge badge-success">🥛</span><span className="badge badge-info">🪥</span></>}
                  </div>
                </div>
                <div style={{ textAlign:'center',minWidth:'52px' }}>
                  <div style={{ fontSize:'1rem',fontWeight:800,
                    color:pct>=80?'var(--success)':pct>=60?'var(--accent)':'var(--danger)' }}>
                    {pct}%
                  </div>
                  <div className="text-xs text-muted">มาเรียน</div>
                </div>
                <div style={{ textAlign:'center',minWidth:'48px' }}>
                  {s.assessments?.summary
                    ? <div style={{ color:'var(--success)',fontSize:'1.25rem' }}>✅</div>
                    : <div style={{ color:'#d1d5db',fontSize:'1.25rem' }}>○</div>}
                  <div className="text-xs text-muted">ประเมิน</div>
                </div>
                <div className="flex gap-1" style={{ flexWrap:'wrap' }}>
                  <button type="button" className="btn btn-sm"
                    style={{ background:'#ede9fe',color:'var(--primary)' }}
                    onClick={() => setSelectedStudent(s)}>📄</button>
                  <button type="button" className="btn btn-sm btn-primary"
                    onClick={() => setEvaluatingStudent(s)}>✏️</button>
                  <button type="button" className="btn btn-sm"
                    style={{ color:'var(--danger)' }}
                    onClick={() => handleDelete(s.id)}>🗑️</button>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center text-muted" style={{ padding:'3rem 1rem' }}>
              ไม่พบนักเรียนที่ค้นหา
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
