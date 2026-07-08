import { useState, useMemo, useCallback } from 'react';
import { useApp } from '../../context/AppContext';

// ── รายการตรวจสุขภาพ 6 หมวด ──────────────────────────────────────────────────
const CHECK_ITEMS = [
  { id: 'body',  label: 'ร่างกาย',  emoji: '🧍' },
  { id: 'hair',  label: 'ผม',       emoji: '💈' },
  { id: 'cloth', label: 'เสื้อผ้า', emoji: '👕' },
  { id: 'ear',   label: 'ใบหู',     emoji: '👂' },
  { id: 'mouth', label: 'ช่องปาก',  emoji: '🦷' },
  { id: 'nail',  label: 'เล็บ',     emoji: '💅' },
];

// จำนวนวันตรวจต่อสัปดาห์ (ค่าคงที่ตามแบบฟอร์ม = 3 วัน)
const DAYS_PER_WEEK = 3;

// สร้าง record key
function recordKey(className, academicYear, weekNo) {
  return `${className}__${academicYear}__w${weekNo}`;
}

// สร้าง student entry เริ่มต้น (ยังไม่ตรวจ)
function emptyStudentEntry() {
  return CHECK_ITEMS.reduce((acc, item) => {
    acc[item.id] = [false, false, false];
    return acc;
  }, { note: '' });
}

// สร้าง student entry pre-filled — ผ่านทุกรายการ
function defaultStudentEntry() {
  return CHECK_ITEMS.reduce((acc, item) => {
    acc[item.id] = [true, true, true];
    return acc;
  }, { note: '' });
}

// สร้าง record เปล่าพร้อม pre-fill ผ่านทุกคน ทุกรายการ
function makeDefaultRecord(k, cls, ay, wkNo, wkDate, studs) {
  const studsData = {};
  studs.forEach(s => { studsData[s.id] = defaultStudentEntry(); });
  return { id: k, className: cls, academicYear: ay, weekNo: wkNo, weekDate: wkDate, students: studsData };
}

// นับจำนวนผ่านในแถว
function countPass(entry) {
  return CHECK_ITEMS.reduce((n, item) => n + entry[item.id].filter(Boolean).length, 0);
}

// ── CheckCell ─────────────────────────────────────────────────────────────────
function CheckCell({ checked, onChange }) {
  return (
    <td
      onClick={onChange}
      style={{
        textAlign: 'center', cursor: 'pointer', userSelect: 'none',
        border: '1px solid #e5e7eb', padding: '4px 2px', minWidth: '26px',
        background: checked ? '#d1fae5' : 'white',
        fontSize: '.85rem', fontWeight: 700, color: checked ? '#065f46' : '#e5e7eb',
        transition: 'background .1s',
      }}
      title={checked ? 'ผ่าน (คลิกเพื่อยกเลิก)' : 'คลิกเพื่อทำเครื่องหมาย'}
    >
      {checked ? '/' : '·'}
    </td>
  );
}

// ── HealthCheckTab ────────────────────────────────────────────────────────────
export default function HealthCheckTab({ teacherClassFilter = null }) {
  const {
    students, classes, teachers, role, user,
    academicYear, schoolLogo,
    healthCheckRecords, setHealthCheckRecords,
  } = useApp();

  const isTeacher = role === 'teacher';
  const myClass   = teacherClassFilter ?? (isTeacher ? user?.className : null);

  // ── Selectors ─────────────────────────────────────────────────────────────
  const [selClass, setSelClass] = useState(() => myClass ?? (classes[0]?.name ?? ''));
  const [weekNo,   setWeekNo]   = useState(1);
  const [weekDate, setWeekDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - d.getDay() + 1); // Monday
    return d.toISOString().slice(0, 10);
  });
  const [saved, setSaved] = useState(false);

  const key = useMemo(() => recordKey(selClass, academicYear, weekNo), [selClass, academicYear, weekNo]);

  // กรองนักเรียนในห้อง เรียงตาม id
  const classStudents = useMemo(() =>
    students
      .filter(s => s.className === selClass && !s.name.startsWith('(ว่าง)'))
      .sort((a, b) => Number(a.id) - Number(b.id)),
    [students, selClass]
  );

  // โหลด record ปัจจุบัน หรือสร้างใหม่
  const [draft, setDraft] = useState(() => {
    const existing = healthCheckRecords[key];
    if (existing) return existing;
    const initStuds = students.filter(s => s.className === selClass && !s.name.startsWith('(ว่าง)')).sort((a,b)=>Number(a.id)-Number(b.id));
    return makeDefaultRecord(key, selClass, academicYear, weekNo, weekDate, initStuds);
  });

  // เมื่อเปลี่ยน key ให้โหลด record ใหม่
  const loadRecord = useCallback((newKey, newClass, newWeekNo, newWeekDate) => {
    const existing = healthCheckRecords[newKey];
    if (existing) {
      setDraft(existing);
    } else {
      const studs = students.filter(s => s.className === newClass && !s.name.startsWith('(ว่าง)')).sort((a,b)=>Number(a.id)-Number(b.id));
      setDraft(makeDefaultRecord(newKey, newClass, academicYear, newWeekNo, newWeekDate, studs));
    }
    setSaved(false);
  }, [healthCheckRecords, academicYear, students]);

  function handleClassChange(cls) {
    setSelClass(cls);
    const k = recordKey(cls, academicYear, weekNo);
    loadRecord(k, cls, weekNo, weekDate);
  }
  function handleWeekChange(wk) {
    const w = Number(wk);
    setWeekNo(w);
    const k = recordKey(selClass, academicYear, w);
    loadRecord(k, selClass, w, weekDate);
  }
  function handleWeekDateChange(d) {
    setWeekDate(d);
    setDraft(prev => ({ ...prev, weekDate: d }));
    setSaved(false);
  }

  // แก้ไข checkbox
  function toggleCheck(studentId, itemId, dayIdx) {
    setSaved(false);
    setDraft(prev => {
      const entry = prev.students[studentId] ?? emptyStudentEntry();
      const days  = [...(entry[itemId] ?? [false, false, false])];
      days[dayIdx] = !days[dayIdx];
      return {
        ...prev,
        students: {
          ...prev.students,
          [studentId]: { ...entry, [itemId]: days },
        },
      };
    });
  }

  function handleNote(studentId, val) {
    setSaved(false);
    setDraft(prev => {
      const entry = prev.students[studentId] ?? emptyStudentEntry();
      return {
        ...prev,
        students: { ...prev.students, [studentId]: { ...entry, note: val } },
      };
    });
  }

  // บันทึก
  function handleSave() {
    setHealthCheckRecords(prev => ({ ...prev, [key]: { ...draft, weekDate } }));
    setSaved(true);
  }

  // ล้างข้อมูลสัปดาห์นี้
  function handleClear() {
    if (!window.confirm(`ล้างข้อมูลการตรวจสุขภาพสัปดาห์ที่ ${weekNo} ห้อง ${selClass}?`)) return;
    const blank = {
      id: key, className: selClass, academicYear, weekNo, weekDate,
      students: {},
    };
    setDraft(blank);
    setHealthCheckRecords(prev => { const n = { ...prev }; delete n[key]; return n; });
    setSaved(false);
  }

  // ตรวจสอบครูผู้สอน
  const teacherName = useMemo(() => {
    if (isTeacher) return user?.name ?? '';
    const t = teachers.find(t => t.className === selClass);
    return t?.name ?? '';
  }, [isTeacher, user, teachers, selClass]);

  // ─── Print ─────────────────────────────────────────────────────────────────
  function handlePrint() {
    const rows = classStudents.map((s, idx) => {
      const entry = draft.students[s.id] ?? emptyStudentEntry();
      let cells = '';
      CHECK_ITEMS.forEach(item => {
        entry[item.id].forEach(d => {
          cells += `<td class="cc">${d ? '/' : ''}</td>`;
        });
      });
      return `<tr>
        <td class="no">${idx + 1}</td>
        <td class="nm">${s.name}</td>
        ${cells}
        <td class="nt">${entry.note ?? ''}</td>
      </tr>`;
    }).join('');

    // header rows
    const itemCols = CHECK_ITEMS.map(item =>
      `<th colspan="${DAYS_PER_WEEK}" class="hd">${item.label}</th>`
    ).join('');
    const dayCols = CHECK_ITEMS.map(() =>
      [1,2,3].map(d => `<th class="hdc">${d}</th>`).join('')
    ).join('');

    const win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>แบบบันทึกการตรวจสุขภาพประจำสัปดาห์</title>
<style>
  @page { size: A4 landscape; margin: 10mm }
  body { font-family: 'TH Sarabun New', Sarabun, sans-serif; font-size: 11pt }
  h3 { text-align: center; margin: 2px 0; font-size: 13pt }
  table { border-collapse: collapse; width: 100% }
  td, th { border: 1px solid #444; padding: 2px 4px; text-align: center; font-size: 9pt }
  .nm { text-align: left; min-width: 130px; font-size: 9.5pt }
  .no { min-width: 24px }
  .cc { min-width: 22px }
  .nt { min-width: 60px }
  .hd { background: #f3f4f6; font-weight: bold; font-size: 9.5pt }
  .hdc { background: #f9fafb; font-size: 8.5pt }
  .sig { margin-top: 28px; text-align: right; font-size: 10pt; line-height: 2 }
</style></head><body>
${schoolLogo ? `<div style="text-align:center;margin-bottom:4px"><img src="${schoolLogo}" style="height:70px;object-fit:contain"/></div>` : ''}
<h3>แบบบันทึกการตรวจสุขภาพประจำสัปดาห์</h3>
<h3>ชั้น${selClass} &nbsp; ปีการศึกษา ${academicYear}</h3>
<h3>สัปดาห์ที่ ${weekNo} &nbsp; วันที่ ${weekDate ? new Date(weekDate).toLocaleDateString('th-TH', { day:'numeric', month:'long', year:'numeric' }) : ''}</h3>
<br/>
<table>
  <thead>
    <tr>
      <th rowspan="2" class="hd">ที่</th>
      <th rowspan="2" class="hd">ชื่อ-สกุล</th>
      <th colspan="${CHECK_ITEMS.length * DAYS_PER_WEEK}" class="hd">รายการที่ตรวจ</th>
      <th rowspan="2" class="hd">หมายเหตุ</th>
    </tr>
    <tr>${itemCols}</tr>
    <tr>
      <th class="hdc"></th><th class="hdc"></th>
      ${dayCols}
      <th class="hdc"></th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
</table>
<div class="sig">
  ลงชื่อ .............................................<br/>
  (${teacherName || '........................................'})<br/>
  ครูประจำชั้น${selClass}
</div>
</body></html>`);
    win.document.close();
    win.print();
  }

  // ─── UI ────────────────────────────────────────────────────────────────────
  return (
    <div className="glass p-6 animate-fade">
      <div className="page-header mb-4">
        <h3>🏥 การตรวจสุขภาพประจำสัปดาห์</h3>
      </div>

      {/* ── Controls ── */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '.75rem', alignItems: 'flex-end',
        background: '#f8fafc', borderRadius: '12px', padding: '.75rem 1rem',
        border: '1px solid #e2e8f0', marginBottom: '1.25rem',
      }}>
        {/* ห้อง */}
        {!myClass && (
          <div>
            <label style={lbl}>ห้องเรียน</label>
            <select className="input" value={selClass} onChange={e => handleClassChange(e.target.value)}
              style={{ fontSize: '.8rem', padding: '.3rem .6rem', minWidth: '120px' }}>
              {classes.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
          </div>
        )}

        {/* สัปดาห์ที่ */}
        <div>
          <label style={lbl}>สัปดาห์ที่</label>
          <input type="number" className="input" min={1} max={52} value={weekNo}
            onChange={e => handleWeekChange(e.target.value)}
            style={{ fontSize: '.8rem', padding: '.3rem .6rem', width: '80px' }} />
        </div>

        {/* วันที่ */}
        <div>
          <label style={lbl}>วันที่ (วันแรกของสัปดาห์)</label>
          <input type="date" className="input" value={weekDate}
            onChange={e => handleWeekDateChange(e.target.value)}
            style={{ fontSize: '.8rem', padding: '.3rem .6rem' }} />
        </div>

        {/* Info */}
        <div style={{ marginLeft: 'auto', textAlign: 'right', fontSize: '.72rem', color: '#6b7280' }}>
          <div>ห้อง <strong>{selClass}</strong> · {classStudents.length} คน</div>
          <div>ปีการศึกษา {academicYear}</div>
          {teacherName && <div>ครู {teacherName}</div>}
        </div>
      </div>

      {/* ── Legend ── */}
      <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center', marginBottom: '.75rem', fontSize: '.72rem', flexWrap: 'wrap' }}>
        <span style={{ background: '#d1fae5', color: '#065f46', fontWeight: 700, padding: '2px 10px', borderRadius: '6px', border: '1px solid #a7f3d0' }}>/ ผ่าน</span>
        <span style={{ color: '#9ca3af' }}>· ยังไม่ได้ตรวจ</span>
        <span style={{ color: '#6b7280' }}>· คลิกเพื่อเปลี่ยนสถานะ | ตัวเลข 1,2,3 = วันที่ตรวจในสัปดาห์</span>
      </div>

      {/* ── Table ── */}
      {classStudents.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#9ca3af', padding: '3rem' }}>ไม่พบนักเรียนในห้อง {selClass}</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '.75rem' }}>
            <thead>
              <tr>
                <th rowSpan={2} style={th({ minWidth: '32px' })}>ที่</th>
                <th rowSpan={2} style={th({ minWidth: '160px', textAlign: 'left' })}>ชื่อ-สกุล</th>
                {CHECK_ITEMS.map(item => (
                  <th key={item.id} colSpan={DAYS_PER_WEEK}
                    style={th({ background: '#eff6ff', color: '#1e40af', fontWeight: 800 })}>
                    {item.emoji} {item.label}
                  </th>
                ))}
                <th rowSpan={2} style={th({ minWidth: '60px' })}>ผ่าน<br/>ทั้งหมด</th>
                <th rowSpan={2} style={th({ minWidth: '80px' })}>หมายเหตุ</th>
              </tr>
              <tr>
                {CHECK_ITEMS.map(item =>
                  [1, 2, 3].map(d => (
                    <th key={`${item.id}-${d}`}
                      style={th({ background: '#f1f5f9', fontSize: '.65rem', color: '#475569' })}>
                      วัน{d}
                    </th>
                  ))
                )}
              </tr>
            </thead>
            <tbody>
              {classStudents.map((s, idx) => {
                const entry = draft.students[s.id] ?? emptyStudentEntry();
                const passCount = countPass(entry);
                const totalChecks = CHECK_ITEMS.length * DAYS_PER_WEEK;
                return (
                  <tr key={s.id} style={{ background: idx % 2 === 0 ? 'white' : '#fafafa' }}>
                    <td style={{ textAlign: 'center', border: '1px solid #e5e7eb', padding: '3px', color: '#6b7280' }}>{idx + 1}</td>
                    <td style={{ border: '1px solid #e5e7eb', padding: '3px 8px', whiteSpace: 'nowrap' }}>{s.name}</td>
                    {CHECK_ITEMS.map(item =>
                      [0, 1, 2].map(dayIdx => (
                        <CheckCell
                          key={`${item.id}-${dayIdx}`}
                          checked={entry[item.id]?.[dayIdx] ?? false}
                          onChange={() => toggleCheck(s.id, item.id, dayIdx)}
                        />
                      ))
                    )}
                    <td style={{
                      textAlign: 'center', border: '1px solid #e5e7eb', padding: '3px',
                      fontWeight: 800, fontSize: '.78rem',
                      color: passCount === totalChecks ? '#065f46' : passCount > 0 ? '#92400e' : '#9ca3af',
                      background: passCount === totalChecks ? '#d1fae5' : passCount > 0 ? '#fef3c7' : 'white',
                    }}>
                      {passCount > 0 ? `${passCount}/${totalChecks}` : '—'}
                    </td>
                    <td style={{ border: '1px solid #e5e7eb', padding: '2px 4px' }}>
                      <input
                        type="text"
                        value={entry.note ?? ''}
                        onChange={e => handleNote(s.id, e.target.value)}
                        placeholder="—"
                        style={{
                          border: 'none', outline: 'none', width: '100%',
                          background: 'transparent', fontSize: '.72rem', color: '#374151',
                        }}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {/* สรุปแต่ละหมวด */}
            <tfoot>
              <tr style={{ background: '#f1f5f9' }}>
                <td colSpan={2} style={{ border: '1px solid #d1d5db', textAlign: 'center', fontWeight: 800, fontSize: '.72rem', color: '#475569', padding: '3px 6px' }}>
                  จำนวน ✓
                </td>
                {CHECK_ITEMS.map(item =>
                  [0, 1, 2].map(dayIdx => {
                    const count = classStudents.filter(s => draft.students[s.id]?.[item.id]?.[dayIdx]).length;
                    return (
                      <td key={`sum-${item.id}-${dayIdx}`}
                        style={{
                          border: '1px solid #d1d5db', textAlign: 'center',
                          fontWeight: 800, fontSize: '.72rem', padding: '3px',
                          color: count === classStudents.length ? '#065f46' : count > 0 ? '#92400e' : '#9ca3af',
                          background: count === classStudents.length ? '#d1fae5' : count > 0 ? '#fef3c7' : 'white',
                        }}>
                        {count > 0 ? count : '—'}
                      </td>
                    );
                  })
                )}
                <td style={{ border: '1px solid #d1d5db' }} />
                <td style={{ border: '1px solid #d1d5db' }} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* ── Actions ── */}
      <div style={{ display: 'flex', gap: '.6rem', marginTop: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <button className="btn btn-primary" onClick={handleSave}>
          💾 บันทึก
        </button>
        <button className="btn btn-secondary" onClick={handlePrint}>
          🖨️ พิมพ์แบบฟอร์ม
        </button>
        <button
          type="button" onClick={handleClear}
          style={{ padding: '.35rem .9rem', borderRadius: '8px', border: '1px solid #fca5a5', background: '#fff5f5', color: '#dc2626', fontFamily: 'inherit', fontSize: '.8rem', cursor: 'pointer' }}>
          🗑️ ล้างข้อมูลสัปดาห์นี้
        </button>

        {saved && (
          <span style={{ color: '#059669', fontWeight: 700, fontSize: '.82rem' }}>✅ บันทึกแล้ว</span>
        )}

        {/* Weekly overview — สรุปสัปดาห์ที่มีข้อมูล */}
        <div style={{ marginLeft: 'auto', fontSize: '.72rem', color: '#6b7280' }}>
          มีข้อมูล {Object.keys(healthCheckRecords).filter(k => k.startsWith(`${selClass}__${academicYear}__`)).length} สัปดาห์
        </div>
      </div>

      {/* ── History panel ── */}
      <WeekHistory
        healthCheckRecords={healthCheckRecords}
        selClass={selClass}
        academicYear={academicYear}
        currentWeekNo={weekNo}
        onSelect={wk => handleWeekChange(wk)}
      />
    </div>
  );
}

// ── WeekHistory ───────────────────────────────────────────────────────────────
function WeekHistory({ healthCheckRecords, selClass, academicYear, currentWeekNo, onSelect }) {
  const weeks = useMemo(() => {
    return Object.values(healthCheckRecords)
      .filter(r => r.className === selClass && r.academicYear === academicYear)
      .sort((a, b) => a.weekNo - b.weekNo);
  }, [healthCheckRecords, selClass, academicYear]);

  if (weeks.length === 0) return null;

  return (
    <div style={{
      marginTop: '1.25rem', padding: '.75rem 1rem',
      background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0',
    }}>
      <div style={{ fontSize: '.75rem', fontWeight: 800, color: '#475569', marginBottom: '.5rem' }}>
        📅 ประวัติการตรวจสุขภาพ — ห้อง {selClass} ปีการศึกษา {academicYear}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.35rem' }}>
        {weeks.map(r => (
          <button key={r.weekNo} type="button" onClick={() => onSelect(r.weekNo)}
            style={{
              padding: '.25rem .65rem', borderRadius: '8px', fontFamily: 'inherit', cursor: 'pointer',
              fontSize: '.75rem', fontWeight: r.weekNo === currentWeekNo ? 800 : 500,
              background: r.weekNo === currentWeekNo ? '#3b82f6' : 'white',
              color: r.weekNo === currentWeekNo ? 'white' : '#374151',
              border: `1.5px solid ${r.weekNo === currentWeekNo ? '#3b82f6' : '#e5e7eb'}`,
            }}>
            สัปดาห์ {r.weekNo}
            {r.weekDate && (
              <span style={{ fontSize: '.65rem', opacity: .8, marginLeft: '.3rem' }}>
                ({new Date(r.weekDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })})
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Style helpers ─────────────────────────────────────────────────────────────
function th(extra = {}) {
  return {
    border: '1px solid #d1d5db', padding: '3px 5px',
    background: '#f9fafb', fontWeight: 700, fontSize: '.72rem', ...extra,
  };
}
const lbl = {
  fontSize: '.72rem', fontWeight: 700, color: '#475569',
  display: 'block', marginBottom: '.2rem',
};
