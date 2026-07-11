import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';

// ── กิจกรรมที่ติดตาม ─────────────────────────────────────────────────────────
// บันทึกระดับชั้นเรียน (ไม่ใช่รายนักเรียน) — ครูเพียงติ๊กว่ากิจกรรมนั้นเกิดขึ้นวันนั้นหรือไม่

const ROUTINE_DEFS = [
  {
    key: 'morning',
    emoji: '🌅',
    label: 'กิจกรรมเช้า',
    desc: 'เคารพธงชาติ · สวดมนต์ · ร้องเพลง',
    color: '#f59e0b',
    bg: '#fffbeb',
  },
  {
    key: 'exercise',
    emoji: '🏃',
    label: 'ออกกำลังกาย',
    desc: 'กิจกรรมพลศึกษา / บริหารร่างกาย',
    color: '#ef4444',
    bg: '#fff1f2',
  },
  {
    key: 'circle',
    emoji: '💬',
    label: 'กิจกรรมวงกลม',
    desc: 'เรียนรู้ร่วมกัน · ถาม-ตอบ · สนทนา',
    color: '#8b5cf6',
    bg: '#f5f3ff',
  },
  {
    key: 'story',
    emoji: '📖',
    label: 'เล่านิทาน',
    desc: 'นิทาน / หนังสือ / เรื่องเล่า',
    color: '#3b82f6',
    bg: '#eff6ff',
  },
  {
    key: 'cleanup',
    emoji: '🧹',
    label: 'เก็บของ / ทำความสะอาด',
    desc: 'เก็บของเล่น · ดูแลห้องเรียน',
    color: '#10b981',
    bg: '#ecfdf5',
  },
  {
    key: 'dressing',
    emoji: '👗',
    label: 'แต่งตัว / เปลี่ยนชุด',
    desc: 'แต่งตัวด้วยตนเอง · ผูกเชือกรองเท้า',
    color: '#ec4899',
    bg: '#fdf2f8',
  },
];

const ROUTINE_KEYS = ROUTINE_DEFS.map(d => d.key);

const DOW_SHORT   = ['อา','จ','อ','พ','พฤ','ศ','ส'];
const THAI_MONTHS = ['','มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
  'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
const THAI_MONTHS_SHORT = ['','ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.',
  'ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];

function daysInMonth(thaiYear, month) {
  return new Date(thaiYear - 543, month, 0).getDate();
}
function getDow(thaiYear, month, day) {
  return new Date(thaiYear - 543, month - 1, day).getDay();
}
function isWeekend(thaiYear, month, day) {
  const d = getDow(thaiYear, month, day);
  return d === 0 || d === 6;
}
function recKey(className, academicYear, year, month) {
  return `${className}__${academicYear}__${year}-${String(month).padStart(2, '0')}`;
}

function makeDefaultRecord(key, cls, ay, yr, mo) {
  return { id: key, className: cls, academicYear: ay, year: yr, month: mo, days: {} };
}

// นับจำนวนวันที่ทำกิจกรรม
function countKey(days, key) {
  return Object.values(days ?? {}).filter(d => d?.[key] === true).length;
}
// นับจำนวนวันที่บันทึก (วันที่มีข้อมูลอย่างน้อย 1 key)
function countRecorded(days) {
  return Object.values(days ?? {}).filter(d =>
    d && ROUTINE_KEYS.some(k => d[k] === true || d[k] === false)
  ).length;
}

// ── DailyRoutineTab ──────────────────────────────────────────────────────────
export default function DailyRoutineTab({ teacherClassFilter = null }) {
  const {
    students, classes, role, user, academicYear,
    dailyRoutineRecords, setDailyRoutineRecords,
  } = useApp();

  const isTeacher = role === 'teacher';
  const myClass   = teacherClassFilter ?? (isTeacher ? user?.className : null);

  const now = new Date();
  const [selClass,  setSelClass]  = useState(() => myClass ?? (classes[0]?.name ?? ''));
  const [selYear,   setSelYear]   = useState(now.getFullYear() + 543);
  const [selMonth,  setSelMonth]  = useState(now.getMonth() + 1);
  const [saved, setSaved]         = useState(false);
  const [view, setView]           = useState('grid'); // 'grid' | 'summary'

  const key     = useMemo(() => recKey(selClass, academicYear, selYear, selMonth), [selClass, academicYear, selYear, selMonth]);
  const numDays = useMemo(() => daysInMonth(selYear, selMonth), [selYear, selMonth]);
  const dayArr  = useMemo(() => Array.from({ length: numDays }, (_, i) => i + 1), [numDays]);

  // ── Draft state ───────────────────────────────────────────────────────────
  const [draft, setDraft] = useState(() => {
    const ex = dailyRoutineRecords[key];
    return ex ?? makeDefaultRecord(key, selClass, academicYear, selYear, selMonth);
  });

  const prevKeyRef = useRef(key);
  useEffect(() => {
    const keyChanged = prevKeyRef.current !== key;
    prevKeyRef.current = key;
    const ex = dailyRoutineRecords[key];
    if (keyChanged) {
      setDraft(ex ?? makeDefaultRecord(key, selClass, academicYear, selYear, selMonth));
    }
  }, [key, dailyRoutineRecords, selClass, academicYear, selYear, selMonth]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const classCount = useMemo(() =>
    students.filter(s => s.className === selClass && !s.name.startsWith('(ว่าง)')).length,
    [students, selClass]
  );

  const getDayVal = useCallback((day, routineKey) =>
    draft.days?.[day]?.[routineKey] ?? null,
    [draft]
  );

  // Toggle: null → true → false → null
  const toggle = useCallback((day, routineKey) => {
    setDraft(prev => {
      const cur = prev.days?.[day]?.[routineKey] ?? null;
      const next = cur === null ? true : cur === true ? false : null;
      const newDayData = { ...(prev.days?.[day] ?? {}) };
      if (next === null) {
        delete newDayData[routineKey];
      } else {
        newDayData[routineKey] = next;
      }
      // ถ้าไม่มีข้อมูลวันนี้เลย ลบออก (เพื่อประหยัด storage)
      const updatedDays = { ...prev.days };
      if (Object.keys(newDayData).length === 0) {
        delete updatedDays[day];
      } else {
        updatedDays[day] = newDayData;
      }
      return { ...prev, days: updatedDays };
    });
    setSaved(false);
  }, []);

  // ติ๊กทั้งวัน (เปิด/ปิดทุก activity ในวันเดียวกัน)
  const toggleAllDay = useCallback((day) => {
    setDraft(prev => {
      const existing = prev.days?.[day] ?? {};
      const allTrue  = ROUTINE_KEYS.every(k => existing[k] === true);
      const newDayData = allTrue
        ? {} // ปิดทั้งหมด
        : Object.fromEntries(ROUTINE_KEYS.map(k => [k, true])); // เปิดทั้งหมด
      const updatedDays = { ...prev.days };
      if (Object.keys(newDayData).length === 0) {
        delete updatedDays[day];
      } else {
        updatedDays[day] = newDayData;
      }
      return { ...prev, days: updatedDays };
    });
    setSaved(false);
  }, []);

  // ติ๊กทั้ง column (เปิด/ปิดกิจกรรมทุกวันทำการ)
  const toggleAllCol = useCallback((routineKey) => {
    setDraft(prev => {
      const schoolDayNums = dayArr.filter(d => !isWeekend(selYear, selMonth, d));
      const allTrue = schoolDayNums.every(d => prev.days?.[d]?.[routineKey] === true);
      const updatedDays = { ...prev.days };
      schoolDayNums.forEach(d => {
        const cur = { ...(updatedDays[d] ?? {}) };
        if (allTrue) {
          delete cur[routineKey];
        } else {
          cur[routineKey] = true;
        }
        if (Object.keys(cur).length === 0) {
          delete updatedDays[d];
        } else {
          updatedDays[d] = cur;
        }
      });
      return { ...prev, days: updatedDays };
    });
    setSaved(false);
  }, [dayArr, selYear, selMonth]);

  // ── บันทึก ────────────────────────────────────────────────────────────────
  const handleSave = useCallback(() => {
    setDailyRoutineRecords(prev => ({ ...prev, [key]: draft }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [draft, key, setDailyRoutineRecords]);

  // ── สรุปรายเดือน ──────────────────────────────────────────────────────────
  const summary = useMemo(() => {
    const schoolDays = dayArr.filter(d => !isWeekend(selYear, selMonth, d)).length;
    return ROUTINE_DEFS.map(def => ({
      ...def,
      done:  countKey(draft.days, def.key),
      total: schoolDays,
      pct:   schoolDays > 0 ? Math.round(countKey(draft.days, def.key) / schoolDays * 100) : 0,
    }));
  }, [draft.days, dayArr, selYear, selMonth]);

  const recorded = useMemo(() => countRecorded(draft.days), [draft.days]);

  // ── Cell renderer ─────────────────────────────────────────────────────────
  function CellIcon({ val }) {
    if (val === true)  return <span style={{ fontSize: '1.1rem', userSelect: 'none' }}>✅</span>;
    if (val === false) return <span style={{ fontSize: '1.1rem', color: '#d1d5db', userSelect: 'none' }}>—</span>;
    return <span style={{ fontSize: '1rem', color: '#e5e7eb', userSelect: 'none' }}>·</span>;
  }

  const classOpts = myClass ? [myClass] : classes.map(c => c.name);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '1rem', maxWidth: '100%', fontFamily: 'Sarabun, sans-serif' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#1e293b' }}>
            🗓️ บันทึกกิจกรรมประจำวัน
          </h2>
          <p style={{ margin: '2px 0 0', fontSize: '.78rem', color: '#64748b' }}>
            บันทึกระดับชั้นเรียน · ครูติ๊กกิจกรรมที่ทำในแต่ละวัน
          </p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '.5rem', alignItems: 'center' }}>
          {/* View toggle */}
          <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '8px', padding: '2px' }}>
            {[{id:'grid',label:'📋 ตาราง'},{id:'summary',label:'📊 สรุป'}].map(v => (
              <button key={v.id} onClick={() => setView(v.id)}
                style={{ padding: '.3rem .75rem', borderRadius: '6px', border: 'none', cursor: 'pointer',
                  fontSize: '.78rem', fontWeight: 700, fontFamily: 'inherit',
                  background: view === v.id ? 'white' : 'transparent',
                  color:      view === v.id ? '#1e293b' : '#64748b',
                  boxShadow:  view === v.id ? '0 1px 3px rgba(0,0,0,.12)' : 'none',
                }}>
                {v.label}
              </button>
            ))}
          </div>
          <button onClick={handleSave}
            style={{ padding: '.45rem 1.1rem', background: saved ? '#10b981' : '#6366f1', color: 'white',
              border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '.85rem',
              cursor: 'pointer', fontFamily: 'inherit', transition: 'background .2s' }}>
            {saved ? '✓ บันทึกแล้ว' : '💾 บันทึก'}
          </button>
        </div>
      </div>

      {/* ── Filters ── */}
      <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap', marginBottom: '1rem',
        background: '#f8fafc', borderRadius: '10px', padding: '.75rem', border: '1px solid #e2e8f0' }}>
        {!myClass && (
          <label style={{ display: 'flex', alignItems: 'center', gap: '.4rem', fontSize: '.85rem', fontWeight: 600, color: '#374151' }}>
            🏫 ห้อง:
            <select value={selClass} onChange={e => setSelClass(e.target.value)}
              style={{ border: '1px solid #d1d5db', borderRadius: '6px', padding: '.3rem .6rem', fontSize: '.85rem', fontFamily: 'inherit' }}>
              {classOpts.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
        )}
        <label style={{ display: 'flex', alignItems: 'center', gap: '.4rem', fontSize: '.85rem', fontWeight: 600, color: '#374151' }}>
          📅 เดือน:
          <select value={selMonth} onChange={e => setSelMonth(Number(e.target.value))}
            style={{ border: '1px solid #d1d5db', borderRadius: '6px', padding: '.3rem .6rem', fontSize: '.85rem', fontFamily: 'inherit' }}>
            {THAI_MONTHS.slice(1).map((m, i) => (
              <option key={i+1} value={i+1}>{m}</option>
            ))}
          </select>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '.4rem', fontSize: '.85rem', fontWeight: 600, color: '#374151' }}>
          ปี พ.ศ.:
          <select value={selYear} onChange={e => setSelYear(Number(e.target.value))}
            style={{ border: '1px solid #d1d5db', borderRadius: '6px', padding: '.3rem .6rem', fontSize: '.85rem', fontFamily: 'inherit' }}>
            {[2567,2568,2569,2570,2571].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </label>
        {myClass && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '.4rem', fontSize: '.85rem', fontWeight: 700, color: '#1e293b' }}>
            🏫 {selClass}
          </span>
        )}
        {/* Stats chip */}
        <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center',
          background: recorded > 0 ? '#d1fae5' : '#f1f5f9',
          color: recorded > 0 ? '#065f46' : '#64748b',
          borderRadius: '20px', padding: '.2rem .8rem', fontSize: '.78rem', fontWeight: 700 }}>
          บันทึกแล้ว {recorded} วัน · {classCount} คน
        </span>
      </div>

      {/* ── Legend ── */}
      <div style={{ display: 'flex', gap: '.75rem', marginBottom: '.75rem', flexWrap: 'wrap' }}>
        {[
          { sym: '✅', label: 'ทำกิจกรรม', bg: '#f0fdf4', color: '#166534' },
          { sym: '—',  label: 'ไม่ได้ทำ',   bg: '#fafafa', color: '#6b7280' },
          { sym: '·',  label: 'ยังไม่บันทึก', bg: '#fafafa', color: '#9ca3af' },
        ].map(l => (
          <span key={l.sym} style={{ display: 'inline-flex', alignItems: 'center', gap: '.35rem',
            background: l.bg, color: l.color, fontSize: '.75rem', fontWeight: 600,
            padding: '.2rem .65rem', borderRadius: '6px' }}>
            <span style={{ fontSize: '.95rem' }}>{l.sym}</span> {l.label}
          </span>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: '.72rem', color: '#94a3b8', alignSelf: 'center' }}>
          คลิกเพื่อวนสลับ: ยังไม่บันทึก → ✅ → — → ยังไม่บันทึก
        </span>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          VIEW: GRID
         ══════════════════════════════════════════════════════════════════════ */}
      {view === 'grid' && (
        <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
            <thead>
              {/* ── Row 1: Activity headers ── */}
              <tr style={{ background: '#f8fafc' }}>
                <th rowSpan={2} style={{
                  padding: '.6rem .75rem', textAlign: 'center', fontWeight: 800,
                  fontSize: '.78rem', color: '#475569', borderRight: '2px solid #e2e8f0',
                  borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap', minWidth: '70px' }}>
                  วันที่
                </th>
                <th rowSpan={2} style={{
                  padding: '.6rem .5rem', textAlign: 'center', fontWeight: 700,
                  fontSize: '.72rem', color: '#94a3b8', borderRight: '1px solid #e2e8f0',
                  borderBottom: '2px solid #e2e8f0', minWidth: '36px' }}>
                  วัน
                </th>
                {ROUTINE_DEFS.map(def => (
                  <th key={def.key}
                    onClick={() => toggleAllCol(def.key)}
                    title={`คลิกเพื่อติ๊ก/ยกเลิกทั้ง column: ${def.label}`}
                    style={{
                      padding: '.5rem .5rem .4rem', textAlign: 'center',
                      borderRight: '1px solid #e2e8f0', borderBottom: '2px solid #e2e8f0',
                      cursor: 'pointer', transition: 'background .15s',
                      background: '#f8fafc', minWidth: '80px',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                    onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}
                  >
                    <div style={{ fontSize: '1.25rem', lineHeight: 1 }}>{def.emoji}</div>
                    <div style={{ fontSize: '.68rem', fontWeight: 700, color: def.color, lineHeight: 1.2, marginTop: '2px' }}>
                      {def.label}
                    </div>
                  </th>
                ))}
                <th style={{
                  padding: '.6rem .5rem', textAlign: 'center', fontWeight: 700,
                  fontSize: '.72rem', color: '#94a3b8', borderBottom: '2px solid #e2e8f0',
                  minWidth: '40px' }}>
                  ✓
                </th>
              </tr>
            </thead>
            <tbody>
              {dayArr.map(day => {
                const weekend = isWeekend(selYear, selMonth, day);
                const dow     = getDow(selYear, selMonth, day);
                const dayData = draft.days?.[day] ?? {};
                const doneCount = ROUTINE_KEYS.filter(k => dayData[k] === true).length;
                const isToday =
                  selYear  === now.getFullYear() + 543 &&
                  selMonth === now.getMonth() + 1 &&
                  day      === now.getDate();

                return (
                  <tr key={day}
                    style={{
                      background: weekend ? '#f8f9fb' : isToday ? '#fffbeb' : 'white',
                      opacity: weekend ? 0.55 : 1,
                    }}>
                    {/* วันที่ */}
                    <td style={{
                      padding: '.45rem .75rem', textAlign: 'center', fontWeight: isToday ? 900 : 600,
                      fontSize: '.85rem', color: isToday ? '#b45309' : '#374151',
                      borderRight: '2px solid #e2e8f0', borderBottom: '1px solid #f1f5f9',
                      cursor: weekend ? 'default' : 'pointer',
                    }}
                      onClick={() => !weekend && toggleAllDay(day)}
                      title={weekend ? '' : 'คลิกเพื่อติ๊กทั้งวัน'}>
                      {day}
                      {isToday && <span style={{ display: 'block', fontSize: '.6rem', color: '#b45309', fontWeight: 700 }}>วันนี้</span>}
                    </td>
                    {/* วัน */}
                    <td style={{
                      padding: '.45rem .4rem', textAlign: 'center', fontSize: '.72rem',
                      color: dow === 0 ? '#ef4444' : dow === 6 ? '#3b82f6' : '#94a3b8',
                      fontWeight: 600, borderRight: '1px solid #f1f5f9',
                      borderBottom: '1px solid #f1f5f9' }}>
                      {DOW_SHORT[dow]}
                    </td>
                    {/* Activity cells */}
                    {ROUTINE_DEFS.map(def => {
                      const val = dayData[def.key] ?? null;
                      return (
                        <td key={def.key}
                          onClick={() => !weekend && toggle(day, def.key)}
                          style={{
                            padding: '.45rem .5rem', textAlign: 'center',
                            borderRight: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9',
                            cursor: weekend ? 'default' : 'pointer',
                            background: val === true ? def.bg : 'transparent',
                            transition: 'background .1s',
                          }}
                          onMouseEnter={e => { if (!weekend) e.currentTarget.style.background = val === true ? def.bg : '#f8fafc'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = val === true ? def.bg : 'transparent'; }}
                          title={def.label}>
                          <CellIcon val={val} />
                        </td>
                      );
                    })}
                    {/* รวม */}
                    <td style={{
                      padding: '.45rem .5rem', textAlign: 'center',
                      borderBottom: '1px solid #f1f5f9', fontSize: '.8rem', fontWeight: 800,
                      color: doneCount === ROUTINE_KEYS.length ? '#065f46'
                        : doneCount > 0 ? '#374151' : '#d1d5db' }}>
                      {weekend ? '' : doneCount > 0 ? `${doneCount}/${ROUTINE_KEYS.length}` : ''}
                    </td>
                  </tr>
                );
              })}
              {/* ── Footer summary row ── */}
              <tr style={{ background: '#f8fafc', borderTop: '2px solid #e2e8f0' }}>
                <td colSpan={2} style={{ padding: '.5rem .75rem', fontSize: '.8rem', fontWeight: 800, color: '#374151',
                  borderRight: '2px solid #e2e8f0' }}>
                  รวม (วัน)
                </td>
                {ROUTINE_DEFS.map(def => {
                  const cnt = countKey(draft.days, def.key);
                  return (
                    <td key={def.key} style={{ padding: '.5rem .4rem', textAlign: 'center',
                      borderRight: '1px solid #e2e8f0', fontWeight: 800, fontSize: '.85rem',
                      color: def.color }}>
                      {cnt > 0 ? cnt : '—'}
                    </td>
                  );
                })}
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          VIEW: SUMMARY
         ══════════════════════════════════════════════════════════════════════ */}
      {view === 'summary' && (
        <div>
          <h3 style={{ margin: '0 0 .75rem', fontSize: '.95rem', fontWeight: 800, color: '#1e293b' }}>
            📊 สรุปเดือน{THAI_MONTHS[selMonth]} {selYear} · ห้อง {selClass}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '.85rem' }}>
            {summary.map(def => (
              <div key={def.key} style={{
                background: 'white', border: `1px solid ${def.color}30`,
                borderRadius: '12px', padding: '1rem', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '.6rem' }}>
                  <span style={{ fontSize: '1.6rem' }}>{def.emoji}</span>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '.9rem', color: '#1e293b' }}>{def.label}</div>
                    <div style={{ fontSize: '.72rem', color: '#64748b' }}>{def.desc}</div>
                  </div>
                </div>
                {/* Progress bar */}
                <div style={{ background: '#f1f5f9', borderRadius: '8px', overflow: 'hidden', height: '8px', marginBottom: '.5rem' }}>
                  <div style={{
                    width: `${def.pct}%`, height: '100%', background: def.color,
                    borderRadius: '8px', transition: 'width .4s',
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '.8rem', color: '#64748b' }}>
                    {def.done} / {def.total} วัน
                  </span>
                  <span style={{
                    fontWeight: 900, fontSize: '1rem',
                    color: def.pct >= 80 ? '#065f46' : def.pct >= 60 ? '#92400e' : def.pct > 0 ? '#991b1b' : '#d1d5db',
                  }}>
                    {def.total > 0 ? `${def.pct}%` : '—'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Monthly activity calendar overview */}
          <h3 style={{ margin: '1.5rem 0 .5rem', fontSize: '.9rem', fontWeight: 800, color: '#1e293b' }}>
            🗓️ ภาพรวมรายวัน
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {dayArr.map(day => {
              const weekend = isWeekend(selYear, selMonth, day);
              const dayData = draft.days?.[day] ?? {};
              const done    = ROUTINE_KEYS.filter(k => dayData[k] === true).length;
              const pct     = done / ROUTINE_KEYS.length;
              const bg = weekend ? '#f8f9fb'
                : done === ROUTINE_KEYS.length ? '#10b981'
                : done >= 4 ? '#6ee7b7'
                : done >= 2 ? '#fcd34d'
                : done > 0  ? '#fca5a5'
                : '#f1f5f9';
              return (
                <div key={day} title={`วันที่ ${day}: ${done} กิจกรรม`}
                  style={{ width: '36px', height: '36px', borderRadius: '8px', background: bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '.75rem', fontWeight: 800,
                    color: weekend ? '#cbd5e1' : done === 0 ? '#94a3b8' : 'white',
                    border: weekend ? 'none' : '1px solid rgba(0,0,0,.06)' }}>
                  {day}
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: '.75rem', marginTop: '.5rem', flexWrap: 'wrap' }}>
            {[
              { bg: '#10b981', label: 'ครบทุกกิจกรรม (6/6)' },
              { bg: '#6ee7b7', label: '4–5 กิจกรรม' },
              { bg: '#fcd34d', label: '2–3 กิจกรรม' },
              { bg: '#fca5a5', label: '1 กิจกรรม' },
              { bg: '#f1f5f9', label: 'ยังไม่บันทึก' },
            ].map(l => (
              <span key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '.35rem',
                fontSize: '.72rem', color: '#64748b' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px',
                  background: l.bg, display: 'inline-block', border: '1px solid rgba(0,0,0,.08)' }} />
                {l.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Save bar ── */}
      <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '.75rem' }}>
        <button onClick={handleSave}
          style={{ padding: '.55rem 1.5rem', background: saved ? '#10b981' : '#6366f1', color: 'white',
            border: 'none', borderRadius: '8px', fontWeight: 800, fontSize: '.9rem',
            cursor: 'pointer', fontFamily: 'inherit', transition: 'background .2s' }}>
          {saved ? '✓ บันทึกเรียบร้อยแล้ว' : '💾 บันทึกข้อมูล'}
        </button>
      </div>
    </div>
  );
}
