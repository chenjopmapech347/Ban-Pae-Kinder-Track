import { useState, useMemo, lazy, Suspense } from 'react';
import { useApp } from '../context/AppContext';
import { todayISO, formatDateThai } from '../utils/helpers';
import { getDayRecord, hasHygieneToday } from '../utils/attendance';
import StudentModal from '../components/StudentModal';
import DashboardSidebar from '../components/ui/DashboardSidebar';

const EvaluationTab          = lazy(() => import('../components/admin/EvaluationTab'));
const ReportsTab             = lazy(() => import('../components/admin/ReportsTab'));
const MediaTab               = lazy(() => import('../components/admin/MediaTab'));
const CornerTab              = lazy(() => import('../components/admin/CornerTab'));
const InnerCornerTab         = lazy(() => import('../components/admin/InnerCornerTab'));
const DevelopmentalReportTab = lazy(() => import('../components/admin/DevelopmentalReportTab'));
const HealthCheckTab         = lazy(() => import('../components/admin/HealthCheckTab'));
const IllnessCheckTab        = lazy(() => import('../components/admin/IllnessCheckTab'));
const ToothBrushTab          = lazy(() => import('../components/admin/ToothBrushTab'));
const LunchTab               = lazy(() => import('../components/admin/LunchTab'));
const MilkTab                = lazy(() => import('../components/admin/MilkTab'));
const NutritionTab           = lazy(() => import('../components/admin/NutritionTab'));
const StudentReportTab       = lazy(() => import('../components/admin/StudentReportTab'));
const OverviewTab            = lazy(() => import('../components/admin/OverviewTab'));
const AdminAttTab            = lazy(() => import('../components/admin/AttendanceTab'));
const PickupTab              = lazy(() => import('../components/admin/PickupTab'));
const ActivityLogTab         = lazy(() => import('../components/admin/ActivityLogTab'));
const QaStandardView         = lazy(() => import('../components/QaStandardView'));
const Std2SelfTab            = lazy(() => import('../components/teacher/Std2SelfTab'));
const NationalStandardsTab   = lazy(() => import('../components/admin/NationalStandardsTab'));
const AIChatTab              = lazy(() => import('../components/AIChatTab'));

/* ── Menu definition ───────────────────────────────────────────────────────── */
const TEACHER_TAB_GROUPS = [
  {
    label: 'หน้าหลัก',
    color: '#7c3aed',
    tabs: [
      { id: 'main',            label: '🏠 หน้าหลัก'      },
      { id: 'students',        label: '👨‍🎓 นักเรียน'      },
      { id: 'pins',            label: '🔑 PIN ผู้ปกครอง' },
      { id: 'teacherannounce', label: '📢 ประกาศ'         },
      { id: 'aichat',          label: '🤖 AI ผู้ช่วย'    },
    ],
  },
  {
    label: 'บันทึกประจำวัน',
    color: '#0891b2',
    tabs: [
      { id: 'overview',     label: '📊 ภาพรวมวันนี้'       },
      { id: 'attendance',   label: '✅ การมาเรียน'          },
      { id: 'pickup',       label: '🚗 รับกลับบ้าน'        },  /* 🚗 not 🏠 */
      { id: 'healthcheck',  label: '🏥 ตรวจสุขภาพ'          },
      { id: 'illnesscheck', label: '🤒 คัดกรองอาการป่วย'    },
      { id: 'toothbrush',   label: '🪥 แปรงฟัน'             },
      { id: 'lunch',        label: '🍱 อาหารกลางวัน'        },
      { id: 'milk',         label: '🥛 ดื่มนม'              },
      { id: 'nutrition',    label: '⚖️ ภาวะโภชนาการ'        },
    ],
  },
  {
    label: 'ผลการเรียน',
    color: '#4f46e5',
    tabs: [
      { id: 'studentreport', label: '📒 สมุดรายงาน อ.01' },
      { id: 'evaluation',    label: '✏️ ประเมินพัฒนาการ'  },
      { id: 'formreports',   label: '📄 รายงานสรุป'       },
      { id: 'activitylog',   label: '📜 ประวัติการประเมิน' },
    ],
  },
  {
    label: 'สื่อและสภาพแวดล้อม',
    color: '#d97706',
    tabs: [
      { id: 'medialist',   label: '📋 รายการทะเบียนสื่อ'    },  /* 📋 not 📚 */
      { id: 'media',       label: '📚 ทะเบียนผลิตสื่อ'      },
      { id: 'corner',      label: '🌿 แหล่งเรียนรู้นอกห้อง' },
      { id: 'innercorner', label: '🏡 มุมประสบการณ์ในห้อง'  },
      { id: 'devreport',   label: '📑 รายงานพัฒนาการ'        },
    ],
  },
  {
    label: 'มาตรฐานและโปรไฟล์',
    color: '#6b7280',
    tabs: [
      { id: 'std2self',    label: '👩‍🏫 มาตรฐานที่ 2'          },
      { id: 'nationalstd', label: '🏛 มาตรฐานแห่งชาติ'        },
      { id: 'standards',   label: '🗺️ มาตรฐานปฐมวัย'          },
      { id: 'profile',     label: '👤 โปรไฟล์ของฉัน'          },
    ],
  },
];

/* ── Constants ─────────────────────────────────────────────────────────────── */
const ATT_OPTS   = ['มา', 'ขาด', 'ลา', 'ป่วย'];
const LUNCH_OPTS = ['หมด', 'เกือบหมด', 'ครึ่งเดียว', 'ไม่ทาน'];
const ATT_COLOR  = {
  มา:   { bg: '#d1fae5', color: '#065f46' },
  ขาด:  { bg: '#fee2e2', color: '#991b1b' },
  ลา:   { bg: '#fef3c7', color: '#92400e' },
  ป่วย: { bg: '#dbeafe', color: '#1e40af' },
};

/* ── Sub-components (must be outside TeacherDashboard to avoid re-mount) ──── */
function StudentPinRow({ student, onSave }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal]         = useState(student.parentPin ?? '');
  const [show, setShow]       = useState(false);
  if (!editing) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', padding: '.5rem .75rem',
      background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
      <span style={{ flex: 1, fontWeight: 600, fontSize: '.9rem' }}>{student.name}</span>
      <span style={{ fontSize: '.8rem', color: '#6b7280' }}>PIN:</span>
      <code style={{ background: '#ede9fe', padding: '.15rem .5rem', borderRadius: '5px', fontSize: '.82rem', letterSpacing: show ? '0' : '.15em' }}>
        {show ? (student.parentPin ?? '—') : '••••'}
      </code>
      <button type="button" onClick={() => setShow(s => !s)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '.8rem', padding: 0 }}>
        {show ? '🙈' : '👁️'}
      </button>
      <button type="button" className="btn btn-sm"
        onClick={() => { setVal(student.parentPin ?? ''); setEditing(true); }}>
        ✏️ แก้ไข
      </button>
    </div>
  );
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', padding: '.5rem .75rem',
      background: '#faf5ff', borderRadius: '8px', border: '2px solid #a78bfa' }}>
      <span style={{ flex: 1, fontWeight: 600, fontSize: '.9rem' }}>{student.name}</span>
      <span style={{ fontSize: '.8rem', color: '#6b7280' }}>PIN ใหม่:</span>
      <input style={{ width: '110px', padding: '.3rem .5rem', borderRadius: '6px',
        border: '1.5px solid #a78bfa', fontFamily: 'inherit', fontSize: '.85rem' }}
        value={val} onChange={e => setVal(e.target.value)} autoFocus />
      <button type="button" className="btn btn-sm btn-primary"
        onClick={() => { onSave(val); setEditing(false); }}>บันทึก</button>
      <button type="button" className="btn btn-sm"
        onClick={() => setEditing(false)}>ยกเลิก</button>
    </div>
  );
}

function AttendanceView({ students, draft, updateDraft, recordDate, loadDraftForDate, isSaved, dateLabel, onSave, onBack }) {
  return (
    <div className="animate-fade">
      <div className="page-header">
        <h2>📝 บันทึกการมาเรียน</h2>
        <button type="button" className="btn" onClick={onBack}>← ย้อนกลับ</button>
      </div>
      <div className="glass-card mb-4" style={{ background: '#faf9ff' }}>
        <div className="flex gap-2 items-center flex-wrap mb-3">
          <span className="font-bold text-sm">📅 วันที่:</span>
          <input type="date" className="input" style={{ width: '180px' }} value={recordDate}
            onChange={e => loadDraftForDate(e.target.value)} />
          <span className="text-sm text-muted">({dateLabel})</span>
        </div>
        <div className={'alert ' + (isSaved ? 'alert-success' : 'alert-info') + ' text-sm'}>
          {isSaved ? '✅ บันทึกแล้วสำหรับวันที่เลือก' : 'ℹ️ ยังไม่ได้บันทึก — กด "บันทึกการมาเรียน" ด้านล่าง'}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem', marginBottom: '5rem' }}>
        {students.map((s, i) => {
          const att = draft[s.id]?.attendance ?? 'มา';
          const c   = ATT_COLOR[att] ?? { bg: '#f5f3ff', color: '#6b7280' };
          return (
            <div key={s.id} className="glass-card"
              style={{ padding: '.9rem 1.1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div className="student-avatar"
                style={{ background: c.bg, color: c.color, fontSize: '1rem', fontWeight: 800 }}>
                {i + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="font-bold" style={{ fontSize: '.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {s.name}
                </div>
                <span className={'badge badge-' + (s.level?.toLowerCase())} style={{ marginTop: '.2rem' }}>{s.level}</span>
              </div>
              <select className="input"
                style={{ width: '110px', fontWeight: 700, background: c.bg, color: c.color, border: 'none' }}
                value={att} onChange={e => updateDraft(s.id, { attendance: e.target.value })}>
                {ATT_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          );
        })}
      </div>
      <div className="flex justify-end gap-2" style={{ position: 'sticky', bottom: 16 }}>
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
      <div className="glass-card mb-4" style={{ background: '#faf9ff' }}>
        <div className="flex gap-2 items-center flex-wrap">
          <span className="font-bold text-sm">📅 วันที่:</span>
          <input type="date" className="input" style={{ width: '180px' }} value={recordDate}
            onChange={e => loadDraftForDate(e.target.value)} />
        </div>
      </div>
      {/* ── ปุ่มเลือกทั้งหมด ── */}
      <div className="glass-card mb-3" style={{ padding: '.75rem 1rem', background: '#f0fdf4' }}>
        <div style={{ fontSize: '.8rem', fontWeight: 800, color: '#166534', marginBottom: '.5rem' }}>
          ⚡ เลือกทั้งหมด
        </div>
        <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-sm"
            style={{ background: '#d1fae5', color: '#065f46', fontWeight: 700 }}
            onClick={() => students.forEach(s => updateDraft(s.id, { milk: true, brush: true }))}>
            🥛🪥 เลือกทั้งหมด (นม + แปรงฟัน)
          </button>
          <button type="button" className="btn btn-sm"
            style={{ background: '#dcfce7', color: '#166534', fontWeight: 700 }}
            onClick={() => students.forEach(s => updateDraft(s.id, { milk: true }))}>
            🥛 เลือกทั้งหมด (นม)
          </button>
          <button type="button" className="btn btn-sm"
            style={{ background: '#dbeafe', color: '#1e40af', fontWeight: 700 }}
            onClick={() => students.forEach(s => updateDraft(s.id, { brush: true }))}>
            🪥 เลือกทั้งหมด (แปรงฟัน)
          </button>
          <button type="button" className="btn btn-sm"
            style={{ background: '#f3f4f6', color: '#6b7280', fontWeight: 700, marginLeft: 'auto' }}
            onClick={() => students.forEach(s => updateDraft(s.id, { milk: false, brush: false }))}>
            ✕ ยกเลิกทั้งหมด
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem', marginBottom: '5rem' }}>
        {students.map(s => (
          <div key={s.id} className="glass-card" style={{ padding: '.9rem 1.1rem' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="student-avatar" style={{ background: '#ede9fe', color: '#7c3aed' }}>🧒</div>
              <div>
                <div className="font-bold" style={{ fontSize: '.95rem' }}>{s.name}</div>
                <span className={'badge badge-' + (s.level?.toLowerCase())}>{s.level}</span>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '.5rem' }}>
              <label style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.3rem',
                padding: '.6rem', borderRadius: '12px', cursor: 'pointer',
                background: draft[s.id]?.milk ? '#d1fae5' : '#f5f3ff',
                border: '2px solid ' + (draft[s.id]?.milk ? '#10b981' : 'transparent'),
                transition: 'all .15s',
              }}>
                <span style={{ fontSize: '1.4rem' }}>🥛</span>
                <span style={{ fontSize: '.72rem', fontWeight: 700, color: draft[s.id]?.milk ? '#065f46' : '#6b7280' }}>ดื่มนม</span>
                <input type="checkbox" checked={Boolean(draft[s.id]?.milk)}
                  onChange={e => updateDraft(s.id, { milk: e.target.checked })} style={{ display: 'none' }} />
              </label>
              <label style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.3rem',
                padding: '.6rem', borderRadius: '12px', cursor: 'pointer',
                background: draft[s.id]?.brush ? '#dbeafe' : '#f5f3ff',
                border: '2px solid ' + (draft[s.id]?.brush ? '#3b82f6' : 'transparent'),
                transition: 'all .15s',
              }}>
                <span style={{ fontSize: '1.4rem' }}>🪥</span>
                <span style={{ fontSize: '.72rem', fontWeight: 700, color: draft[s.id]?.brush ? '#1e40af' : '#6b7280' }}>แปรงฟัน</span>
                <input type="checkbox" checked={Boolean(draft[s.id]?.brush)}
                  onChange={e => updateDraft(s.id, { brush: e.target.checked })} style={{ display: 'none' }} />
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.3rem' }}>
                <span style={{ fontSize: '1.4rem' }}>🍱</span>
                <select style={{
                  border: '1.5px solid #e8e3f4', borderRadius: '8px', fontSize: '.72rem', fontWeight: 700,
                  padding: '.25rem', textAlign: 'center', width: '100%', background: '#fef3c7',
                  color: '#92400e', fontFamily: 'inherit', cursor: 'pointer',
                }} value={draft[s.id]?.lunch ?? 'หมด'}
                  onChange={e => updateDraft(s.id, { lunch: e.target.value })}>
                  {LUNCH_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-2" style={{ position: 'sticky', bottom: 16 }}>
        <button type="button" className="btn" onClick={onBack}>ยกเลิก</button>
        <button type="button" className="btn btn-success" onClick={onSave}>✅ บันทึกกิจวัตร</button>
      </div>
    </div>
  );
}

function buildDraft(students, dailyRecords, date) {
  const d = {};
  students.forEach(s => {
    const r = getDayRecord(dailyRecords, date, s.id);
    d[s.id] = { attendance: r?.attendance ?? 'มา', milk: r?.milk ?? true, brush: r?.brush ?? true, lunch: r?.lunch ?? 'หมด' };
  });
  return d;
}

/* ── StudentList — shared between main tab and students tab ─────────────────── */
function StudentList({ myStudents, filtered, search, setSearch, myClass, today, dailyRecords,
  setSelectedStudent, setEvaluatingStudent, setEditingStudentLocal, handleDelete }) {
  return (
    <div className="glass" style={{ padding: '1.5rem' }}>
      <div className="page-header" style={{ marginBottom: '1rem' }}>
        <h3>👨‍🎓 รายชื่อนักเรียน{myClass ? ` ห้อง ${myClass}` : ''} ({filtered.length}/{myStudents.length} คน)</h3>
        <input className="input" style={{ maxWidth: '220px' }} placeholder="🔍 ค้นหาชื่อ..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
        {filtered.map(s => {
          const isInactive = (s.status ?? 'ปกติ') === 'นอกระบบ';
          const rec   = getDayRecord(dailyRecords, today, s.id);
          const hygOk = hasHygieneToday(rec);
          const att   = rec?.attendance;
          const ac    = att ? (ATT_COLOR[att] ?? { bg: '#f5f3ff', color: '#6b7280' }) : null;
          const isBoy = s.name.includes('ชาย');
          const pct   = s.attendance?.total
            ? Math.round((s.attendance.present / s.attendance.total) * 100) : 0;
          return (
            <div key={s.id} className="student-card"
              style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', opacity: isInactive ? 0.6 : 1 }}>
              <div className="student-avatar"
                style={{
                  background: isInactive ? '#f3f4f6' : (isBoy ? '#dbeafe' : '#fce7f3'),
                  color: isInactive ? '#9ca3af' : (isBoy ? '#1e40af' : '#9d174d'),
                }}>
                {isInactive ? '⛔' : (isBoy ? '👦' : '👧')}
              </div>
              <div style={{ flex: 1, minWidth: '130px' }}>
                <div className="font-bold" style={{ fontSize: '.92rem' }}>{s.name}</div>
                <div className="flex gap-1 mt-1" style={{ flexWrap: 'wrap' }}>
                  <span className={'badge badge-' + (s.level?.toLowerCase())}>{s.level}</span>
                  {isInactive && <span className="badge" style={{ background: '#f3f4f6', color: '#6b7280' }}>นอกระบบ</span>}
                  {!isInactive && att && <span className="badge" style={{ background: ac?.bg, color: ac?.color }}>{att}</span>}
                  {!isInactive && hygOk && <><span className="badge badge-success">🥛</span><span className="badge badge-info">🪥</span></>}
                </div>
              </div>
              {!isInactive && (
                <div style={{ textAlign: 'center', minWidth: '52px' }}>
                  <div style={{ fontSize: '1rem', fontWeight: 800,
                    color: pct >= 80 ? 'var(--success)' : pct >= 60 ? 'var(--accent)' : 'var(--danger)' }}>
                    {pct}%
                  </div>
                  <div className="text-xs text-muted">มาเรียน</div>
                </div>
              )}
              {!isInactive && (
                <div style={{ textAlign: 'center', minWidth: '48px' }}>
                  {s.assessments?.summary
                    ? <div style={{ color: 'var(--success)', fontSize: '1.25rem' }}>✅</div>
                    : <div style={{ color: '#d1d5db', fontSize: '1.25rem' }}>○</div>}
                  <div className="text-xs text-muted">ประเมิน</div>
                </div>
              )}
              <div className="flex gap-1" style={{ flexWrap: 'wrap' }}>
                <button type="button" className="btn btn-sm"
                  style={{ background: '#ede9fe', color: 'var(--primary)' }}
                  onClick={() => setSelectedStudent(s)}>📄</button>
                <button type="button" className="btn btn-sm"
                  style={{ background: '#fef9c3', color: '#92400e' }}
                  onClick={() => setEditingStudentLocal(s)}>✏️</button>
                {!isInactive && (
                  <button type="button" className="btn btn-sm btn-primary"
                    onClick={() => setEvaluatingStudent(s)}>📊</button>
                )}
                <button type="button" className="btn btn-sm"
                  style={{ color: 'var(--danger)' }}
                  onClick={() => handleDelete(s.id)}>🗑️</button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center text-muted" style={{ padding: '3rem 1rem' }}>
            ไม่พบนักเรียนที่ค้นหา
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function TeacherDashboard() {
  const {
    students, setStudents,
    setSelectedStudent, setEvaluatingStudent,
    handleImport, announcements, setAnnouncements, dailyRecords,
    saveDailyAttendance, saveDailyHygiene,
    user, teachers, setTeachers,
  } = useApp();

  const [activeTab,  setActiveTab]  = useState('main');
  const [activeView, setActiveView] = useState('main');
  const [recordDate, setRecordDate] = useState(todayISO());

  /* ── Local student add / edit ── */
  const [isAddingLocal,       setIsAddingLocal]       = useState(false);
  const [editingStudentLocal, setEditingStudentLocal] = useState(null);

  /* ── Profile edit ── */
  const myTeacher  = teachers?.find(t => t.id === user?.id);
  const [profileForm,  setProfileForm]  = useState(null);
  const [profileSaved, setProfileSaved] = useState(false);

  /* ── Teacher announce state ── */
  const [annTitle, setAnnTitle] = useState('');
  const [annBody,  setAnnBody]  = useState('');
  const [annSaved, setAnnSaved] = useState(false);

  /* ── Students filtered to teacher's class ── */
  const myClass    = user?.className;
  const myStudents = useMemo(
    () => students.filter(s => s.className === myClass && !s.name.startsWith('(ว่าง)')),
    [students, myClass],
  );
  const activeStudents = useMemo(
    () => myStudents.filter(s => (s.status ?? 'ปกติ') === 'ปกติ'),
    [myStudents],
  );

  /* ── Announcements visible to this teacher ── */
  const myAnnouncements = useMemo(
    () => (announcements ?? [])
      .filter(a => !a.target || a.target === 'all' || a.target === myClass)
      .slice(0, 3),
    [announcements, myClass],
  );

  const [draft,  setDraft]  = useState(() => buildDraft(activeStudents, dailyRecords, todayISO()));
  const [search, setSearch] = useState('');

  const today     = todayISO();
  const dateLabel = formatDateThai(recordDate);

  const isSaved = useMemo(
    () => activeStudents.every(s => getDayRecord(dailyRecords, recordDate, s.id)?.attendance),
    [activeStudents, dailyRecords, recordDate],
  );

  const filtered = useMemo(
    () => myStudents.filter(s => s.name.includes(search.trim())),
    [myStudents, search],
  );

  const stats = useMemo(() => ({
    total:    activeStudents.length,
    attend:   activeStudents.filter(s => getDayRecord(dailyRecords, today, s.id)?.attendance === 'มา').length,
    hygiene:  activeStudents.filter(s => hasHygieneToday(getDayRecord(dailyRecords, today, s.id))).length,
    assessed: activeStudents.filter(s => s.assessments?.summary).length,
  }), [activeStudents, dailyRecords, today]);

  const loadDraft   = date => { setRecordDate(date); setDraft(buildDraft(activeStudents, dailyRecords, date)); };
  const updateDraft = (id, patch) => setDraft(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  const saveAttendance = () => {
    const rec = {};
    activeStudents.forEach(s => { rec[String(s.id)] = { attendance: draft[s.id]?.attendance ?? 'มา' }; });
    saveDailyAttendance(recordDate, rec);
    alert('บันทึกการมาเรียนเรียบร้อยแล้ว ✅');
    setActiveView('main');
  };

  const saveHygiene = () => {
    const rec = {};
    activeStudents.forEach(s => {
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

  const handleAddStudentLocal = data => {
    setStudents(prev => [...prev, {
      ...data, id: Date.now(), className: myClass,
      status: data.status || 'ปกติ', assessments: {},
      attendance: { present: 0, absent: 0, total: 0 },
      parentPin: data.parentPin || String(1000 + Math.floor(Math.random() * 9000)),
    }]);
    setIsAddingLocal(false);
  };

  const handleEditStudentLocal = data => {
    setStudents(students.map(s => s.id === editingStudentLocal.id ? { ...s, ...data } : s));
    setEditingStudentLocal(null);
  };

  /* ── Full-page attendance / hygiene views (no sidebar) ── */
  if (activeView === 'attendance')
    return <AttendanceView students={activeStudents} draft={draft} updateDraft={updateDraft}
      recordDate={recordDate} loadDraftForDate={loadDraft} isSaved={isSaved} dateLabel={dateLabel}
      onSave={saveAttendance} onBack={() => setActiveView('main')} />;

  if (activeView === 'hygiene')
    return <HygieneView students={activeStudents} draft={draft} updateDraft={updateDraft}
      recordDate={recordDate} loadDraftForDate={loadDraft}
      onSave={saveHygiene} onBack={() => setActiveView('main')} />;

  /* ── SOCIAL fields for profile ── */
  const SOCIAL = [
    { key: 'line',      label: 'LINE',      placeholder: '@lineId' },
    { key: 'facebook',  label: 'Facebook',  placeholder: 'ชื่อเพจ/โปรไฟล์' },
    { key: 'instagram', label: 'Instagram', placeholder: '@username' },
    { key: 'tiktok',    label: 'TikTok',    placeholder: '@username' },
    { key: 'youtube',   label: 'YouTube',   placeholder: 'ชื่อช่อง' },
  ];

  /* ── Main sidebar layout ── */
  return (
    <div className="animate-fade" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>

      {/* ── Left sidebar ── */}
      <DashboardSidebar
        groups={TEACHER_TAB_GROUPS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        badge={myClass ? `🏫 ห้อง ${myClass}` : undefined}
      />

      {/* ── Main content ── */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <Suspense fallback={
          <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af', fontSize: '.9rem' }}>
            กำลังโหลด…
          </div>
        }>

          {/* ── Overview (daily) ── */}
          {activeTab === 'overview'    && <OverviewTab />}
          {activeTab === 'attendance'  && <AdminAttTab defaultClass={myClass} />}
          {activeTab === 'pickup'      && <PickupTab defaultClass={myClass} />}
          {activeTab === 'healthcheck'  && <HealthCheckTab teacherClassFilter={myClass} />}
          {activeTab === 'illnesscheck' && <IllnessCheckTab teacherClassFilter={myClass} />}
          {activeTab === 'toothbrush'   && <ToothBrushTab teacherClassFilter={myClass} />}
          {activeTab === 'lunch'        && <LunchTab teacherClassFilter={myClass} />}
          {activeTab === 'milk'         && <MilkTab teacherClassFilter={myClass} />}
          {activeTab === 'nutrition'    && <NutritionTab teacherClassFilter={myClass} />}

          {/* ── Learning results ── */}
          {activeTab === 'studentreport' && <StudentReportTab teacherClassFilter={myClass} />}
          {activeTab === 'evaluation'    && <EvaluationTab />}
          {activeTab === 'formreports'   && <ReportsTab teacherClassFilter={myClass} />}
          {activeTab === 'activitylog'   && <ActivityLogTab />}

          {/* ── Media & environment ── */}
          {activeTab === 'medialist'   && <MediaTab teacherClassFilter={myClass} viewMode="report" />}
          {activeTab === 'media'       && <MediaTab teacherClassFilter={myClass} viewMode="entry" />}
          {activeTab === 'corner'      && <CornerTab teacherClassFilter={myClass} />}
          {activeTab === 'innercorner' && <InnerCornerTab teacherClassFilter={myClass} />}
          {activeTab === 'devreport'   && <DevelopmentalReportTab teacherClassFilter={myClass} />}

          {/* ── Standards ── */}
          {activeTab === 'std2self'    && <Std2SelfTab />}
          {activeTab === 'nationalstd' && <NationalStandardsTab />}
          {activeTab === 'aichat'      && <AIChatTab />}
          {activeTab === 'standards'   && (
            <div className="glass p-6">
              <h3 className="mb-6">🗺️ สรุปมาตรฐานสถานพัฒนาเด็กปฐมวัย (ปี 2569)</h3>
              <QaStandardView />
            </div>
          )}

          {/* ── PIN tab ── */}
          {activeTab === 'pins' && (
            <div className="glass p-6 animate-fade">
              <div className="page-header mb-4">
                <h3>🔑 รหัส PIN ผู้ปกครอง</h3>
                <span style={{
                  background: '#ede9fe', color: '#7c3aed',
                  borderRadius: '999px', padding: '.22rem .85rem',
                  fontSize: '.78rem', fontWeight: 800,
                }}>ห้อง {myClass} · {myStudents.length} คน</span>
              </div>
              <p style={{ fontSize: '.83rem', color: '#6b7280', marginBottom: '1.25rem' }}>
                แก้ไข PIN สำหรับผู้ปกครองใช้เข้าสู่ระบบดูข้อมูลบุตรหลาน (ห้อง {myClass})
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                {myStudents.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem 0', fontSize: '.85rem' }}>
                    ยังไม่มีนักเรียนในห้องนี้
                  </div>
                ) : myStudents.map(s => (
                  <StudentPinRow key={s.id} student={s}
                    onSave={pin => setStudents(prev => prev.map(x => x.id === s.id ? { ...x, parentPin: pin } : x))} />
                ))}
              </div>
            </div>
          )}

          {/* ── Announce tab ── */}
          {activeTab === 'teacherannounce' && (
            <div className="glass p-6 animate-fade">
              <div className="page-header mb-4">
                <h3>📢 ประกาศ</h3>
                {myClass && (
                  <span style={{ background: '#ede9fe', color: '#7c3aed', borderRadius: '999px', padding: '.22rem .85rem', fontSize: '.78rem', fontWeight: 800 }}>
                    ห้อง {myClass}
                  </span>
                )}
              </div>
              <div style={{ background: '#faf5ff', border: '1.5px solid #ede9fe', borderRadius: '14px', padding: '1.25rem 1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ fontWeight: 700, color: '#7c3aed', marginBottom: '.85rem', fontSize: '.88rem' }}>
                  ✍️ สร้างประกาศ{myClass ? ` (ห้อง ${myClass})` : ''}
                </div>
                <div style={{ marginBottom: '.7rem' }}>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '.82rem', color: '#374151', marginBottom: '.35rem' }}>หัวข้อ *</label>
                  <input className="input" placeholder="หัวข้อประกาศ..." value={annTitle} onChange={e => setAnnTitle(e.target.value)} />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '.82rem', color: '#374151', marginBottom: '.35rem' }}>รายละเอียด (ไม่บังคับ)</label>
                  <textarea className="input" rows={3} placeholder="รายละเอียดเพิ่มเติม..." value={annBody}
                    onChange={e => setAnnBody(e.target.value)} style={{ resize: 'vertical', fontFamily: 'inherit' }} />
                </div>
                {annSaved && <div className="alert alert-success mb-3">✅ เพิ่มประกาศเรียบร้อยแล้ว</div>}
                <button type="button" className="btn btn-primary" disabled={!annTitle.trim()}
                  onClick={() => {
                    if (!annTitle.trim()) return;
                    const now  = new Date();
                    const date = now.toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric', calendar: 'buddhist' });
                    setAnnouncements([
                      { id: Date.now(), date, title: annTitle.trim(), body: annBody.trim(), target: myClass ?? 'all' },
                      ...(announcements ?? []),
                    ]);
                    setAnnTitle(''); setAnnBody('');
                    setAnnSaved(true);
                    setTimeout(() => setAnnSaved(false), 2500);
                  }}>
                  📢 ประกาศ
                </button>
              </div>
              <div style={{ fontWeight: 700, color: '#374151', marginBottom: '.85rem', fontSize: '.88rem' }}>
                📋 ประกาศล่าสุด (ที่เกี่ยวกับห้อง {myClass})
              </div>
              {myAnnouncements.length === 0 ? (
                <div className="text-center text-muted" style={{ padding: '2rem' }}>ยังไม่มีประกาศ</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.7rem' }}>
                  {myAnnouncements.map((a, idx) => (
                    <div key={a.id} style={{
                      display: 'flex', gap: '1rem', alignItems: 'flex-start',
                      padding: '1rem 1.25rem', borderRadius: '12px',
                      background: idx === 0 ? '#faf5ff' : 'white',
                      border: `1.5px solid ${idx === 0 ? '#ddd6fe' : '#e5e7eb'}`,
                    }}>
                      <div style={{ fontSize: '1.4rem', marginTop: '.1rem' }}>📢</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', gap: '.4rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '.3rem' }}>
                          {idx === 0 && <span style={{ background: '#7c3aed', color: 'white', fontSize: '.65rem', fontWeight: 800, padding: '1px 8px', borderRadius: '999px' }}>ล่าสุด</span>}
                          {(!a.target || a.target === 'all') ? (
                            <span style={{ background: '#dbeafe', color: '#1e40af', fontSize: '.68rem', fontWeight: 700, padding: '1px 8px', borderRadius: '999px' }}>ทุกคน</span>
                          ) : (
                            <span style={{ background: '#ede9fe', color: '#7c3aed', fontSize: '.68rem', fontWeight: 700, padding: '1px 8px', borderRadius: '999px' }}>ห้อง {a.target}</span>
                          )}
                          <span style={{ fontSize: '.72rem', color: '#9ca3af' }}>📅 {a.date}</span>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '.9rem', color: '#111827', marginBottom: a.body ? '.3rem' : 0 }}>{a.title}</div>
                        {a.body && <div style={{ fontSize: '.83rem', color: '#4b5563', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{a.body}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Students tab ── */}
          {activeTab === 'students' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '.75rem', marginBottom: '1.25rem' }}>
                <button type="button" className="btn"
                  style={{ background: '#dbeafe', color: '#1e40af', padding: '.85rem', fontSize: '.9rem', borderRadius: '14px' }}
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
                  style={{ padding: '.85rem', fontSize: '.9rem', borderRadius: '14px' }}
                  onClick={() => setIsAddingLocal(true)}>
                  ➕ เพิ่มนักเรียน
                </button>
              </div>
              <StudentList myStudents={myStudents} filtered={filtered} search={search} setSearch={setSearch}
                myClass={myClass} today={today} dailyRecords={dailyRecords}
                setSelectedStudent={setSelectedStudent} setEvaluatingStudent={setEvaluatingStudent}
                setEditingStudentLocal={setEditingStudentLocal} handleDelete={handleDelete} />
            </>
          )}

          {/* ── Profile tab ── */}
          {activeTab === 'profile' && (
            <div className="glass p-6">
              <div className="page-header mb-6">
                <h3>👤 ข้อมูลของฉัน</h3>
                {!profileForm && (
                  <button type="button" className="btn btn-primary"
                    onClick={() => { setProfileForm({ ...myTeacher }); setProfileSaved(false); }}>
                    ✏️ แก้ไขข้อมูล
                  </button>
                )}
              </div>
              {profileSaved && <div className="alert alert-success mb-4">✅ บันทึกข้อมูลเรียบร้อยแล้ว</div>}
              {!profileForm ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '520px' }}>
                  <div style={{
                    display: 'flex', gap: '1rem', alignItems: 'center',
                    padding: '.6rem .85rem', borderRadius: '10px',
                    background: '#f1f5f9', border: '1.5px solid #e2e8f0',
                  }}>
                    <span style={{ minWidth: '100px', fontWeight: 700, color: '#6b7280', fontSize: '.85rem' }}>Username</span>
                    <code style={{ fontWeight: 700, fontSize: '.9rem', color: '#374151', letterSpacing: '.02em' }}>
                      {myTeacher?.username ?? '—'}
                    </code>
                    <span style={{ marginLeft: 'auto', fontSize: '.68rem', color: '#94a3b8', background: '#e2e8f0', padding: '2px 7px', borderRadius: '5px' }}>
                      🔒 แก้ไขไม่ได้
                    </span>
                  </div>
                  {[
                    { label: 'ชื่อ',      value: myTeacher?.firstName ?? myTeacher?.name ?? '—' },
                    { label: 'นามสกุล',   value: myTeacher?.lastName ?? '—' },
                    { label: 'E-mail',    value: myTeacher?.email ?? '—' },
                    { label: 'เบอร์โทร',  value: myTeacher?.phone ?? '—' },
                    { label: 'ห้องเรียน', value: myTeacher?.className ?? '—' },
                  ].map(r => (
                    <div key={r.label} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                      <span style={{ minWidth: '100px', fontWeight: 700, color: '#6b7280', fontSize: '.85rem' }}>{r.label}</span>
                      <span style={{ fontWeight: 600 }}>{r.value}</span>
                    </div>
                  ))}
                  {SOCIAL.map(s => myTeacher?.[s.key] ? (
                    <div key={s.key} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                      <span style={{ minWidth: '100px', fontWeight: 700, color: '#6b7280', fontSize: '.85rem' }}>{s.label}</span>
                      <span style={{ fontWeight: 600 }}>{myTeacher[s.key]}</span>
                    </div>
                  ) : null)}
                </div>
              ) : (
                <form onSubmit={e => {
                  e.preventDefault();
                  const { _newPin, ...rest } = profileForm;
                  const patch = _newPin?.trim() ? { ...rest, pin: _newPin.trim() } : rest;
                  setTeachers(teachers.map(t => t.id === myTeacher.id ? { ...t, ...patch } : t));
                  setProfileForm(null);
                  setProfileSaved(true);
                }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '520px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '.35rem', fontWeight: 600, fontSize: '.85rem' }}>ชื่อ *</label>
                      <input className="input" required value={profileForm.firstName ?? ''}
                        onChange={e => setProfileForm(f => ({ ...f, firstName: e.target.value }))} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '.35rem', fontWeight: 600, fontSize: '.85rem' }}>นามสกุล *</label>
                      <input className="input" required value={profileForm.lastName ?? ''}
                        onChange={e => setProfileForm(f => ({ ...f, lastName: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '.35rem', fontWeight: 600, fontSize: '.85rem' }}>E-mail *</label>
                    <input className="input" type="email" required value={profileForm.email ?? ''}
                      onChange={e => setProfileForm(f => ({ ...f, email: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '.35rem', fontWeight: 600, fontSize: '.85rem' }}>เบอร์โทรศัพท์ *</label>
                    <input className="input" required placeholder="0xx-xxx-xxxx" value={profileForm.phone ?? ''}
                      onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))} />
                  </div>
                  <div style={{ borderTop: '1.5px solid #e5e7eb', paddingTop: '.75rem', marginTop: '.25rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '.85rem', color: '#6b7280', marginBottom: '.75rem' }}>
                      📱 ช่องทางติดต่อ Social (ไม่บังคับ)
                    </div>
                    {SOCIAL.map(s => (
                      <div key={s.key} style={{ marginBottom: '.6rem' }}>
                        <label style={{ display: 'block', marginBottom: '.3rem', fontWeight: 600, fontSize: '.85rem' }}>{s.label}</label>
                        <input className="input" placeholder={s.placeholder} value={profileForm[s.key] ?? ''}
                          onChange={e => setProfileForm(f => ({ ...f, [s.key]: e.target.value }))} />
                      </div>
                    ))}
                  </div>
                  <div style={{ borderTop: '1.5px solid #e5e7eb', paddingTop: '.75rem', marginTop: '.25rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '.85rem', color: '#6b7280', marginBottom: '.75rem' }}>
                      🔐 เปลี่ยนรหัสผ่าน Login
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '.35rem', fontWeight: 600, fontSize: '.85rem' }}>Username</label>
                        <input className="input" value={profileForm.username ?? ''} readOnly
                          style={{ background: '#f9fafb', color: '#6b7280' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '.35rem', fontWeight: 600, fontSize: '.85rem' }}>รหัสผ่านใหม่</label>
                        <input className="input" placeholder="เว้นว่างถ้าไม่เปลี่ยน"
                          value={profileForm._newPin ?? ''}
                          onChange={e => setProfileForm(f => ({ ...f, _newPin: e.target.value }))} />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button type="button" className="btn flex-1" onClick={() => setProfileForm(null)}>ยกเลิก</button>
                    <button type="submit" className="btn btn-primary flex-1">💾 บันทึก</button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ── Main tab ── */}
          {activeTab === 'main' && (
            <>
              {myAnnouncements.map((a, idx) => (
                <div key={a.id} className="announce-banner mb-3">
                  <span className="announce-icon">📢</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: '.4rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '.15rem' }}>
                      {(!a.target || a.target === 'all') ? (
                        <span style={{ background: '#dbeafe', color: '#1e40af', fontSize: '.65rem', fontWeight: 700, padding: '1px 7px', borderRadius: '999px' }}>ทุกคน</span>
                      ) : (
                        <span style={{ background: '#ede9fe', color: '#7c3aed', fontSize: '.65rem', fontWeight: 700, padding: '1px 7px', borderRadius: '999px' }}>ห้อง {a.target}</span>
                      )}
                      {idx === 0 && <span style={{ background: '#7c3aed', color: 'white', fontSize: '.63rem', fontWeight: 800, padding: '1px 6px', borderRadius: '999px' }}>ล่าสุด</span>}
                    </div>
                    <div className="announce-title">{a.title}</div>
                    {a.body && <div style={{ fontSize: '.78rem', color: '#4b5563', marginTop: '.15rem' }}>{a.body}</div>}
                    <div className="announce-date">📅 {a.date}</div>
                  </div>
                </div>
              ))}

              {/* Stats */}
              <div className="grid grid-4 mb-6" style={{ gap: '.75rem' }}>
                <div className="stat-card" style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }}>
                  <span className="stat-icon">👶</span>
                  <div className="stat-value">{stats.total}</div>
                  <div className="stat-label">นักเรียน (ปกติ)</div>
                </div>
                <div className="stat-card" style={{ background: 'linear-gradient(135deg,#10b981,#34d399)' }}>
                  <span className="stat-icon">✅</span>
                  <div className="stat-value">{stats.attend}</div>
                  <div className="stat-label">มาเรียนวันนี้</div>
                </div>
                <div className="stat-card" style={{ background: 'linear-gradient(135deg,#f59e0b,#fbbf24)' }}>
                  <span className="stat-icon">🥛</span>
                  <div className="stat-value">{stats.hygiene}</div>
                  <div className="stat-label">บันทึกกิจวัตรแล้ว</div>
                </div>
                <div className="stat-card" style={{ background: 'linear-gradient(135deg,#3b82f6,#60a5fa)' }}>
                  <span className="stat-icon">📋</span>
                  <div className="stat-value">{stats.assessed}</div>
                  <div className="stat-label">ประเมินแล้ว</div>
                </div>
              </div>

              {/* Quick actions */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '.75rem', marginBottom: '1.5rem' }}>
                <button type="button" className="btn"
                  style={{ background: '#d1fae5', color: '#065f46', padding: '.85rem', fontSize: '.9rem', borderRadius: '14px' }}
                  onClick={() => { loadDraft(today); setActiveView('hygiene'); }}>
                  🥛 บันทึกกิจวัตร
                </button>
                <button type="button" className="btn"
                  style={{ background: '#fef3c7', color: '#92400e', padding: '.85rem', fontSize: '.9rem', borderRadius: '14px' }}
                  onClick={() => { loadDraft(today); setActiveView('attendance'); }}>
                  ✅ เช็คชื่อ
                </button>
                <button type="button" className="btn"
                  style={{ background: '#dbeafe', color: '#1e40af', padding: '.85rem', fontSize: '.9rem', borderRadius: '14px' }}
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
                  style={{ padding: '.85rem', fontSize: '.9rem', borderRadius: '14px' }}
                  onClick={() => setIsAddingLocal(true)}>
                  ➕ เพิ่มนักเรียน
                </button>
              </div>

              {/* Student list */}
              <StudentList myStudents={myStudents} filtered={filtered} search={search} setSearch={setSearch}
                myClass={myClass} today={today} dailyRecords={dailyRecords}
                setSelectedStudent={setSelectedStudent} setEvaluatingStudent={setEvaluatingStudent}
                setEditingStudentLocal={setEditingStudentLocal} handleDelete={handleDelete} />
            </>
          )}

        </Suspense>
      </div>

      {/* ── Student modals ── */}
      <StudentModal
        isOpen={isAddingLocal}
        onClose={() => setIsAddingLocal(false)}
        onSave={handleAddStudentLocal}
      />
      <StudentModal
        key={editingStudentLocal?.id ?? 'edit'}
        isOpen={editingStudentLocal !== null}
        onClose={() => setEditingStudentLocal(null)}
        editingStudent={editingStudentLocal}
        onSave={handleEditStudentLocal}
      />
    </div>
  );
}
