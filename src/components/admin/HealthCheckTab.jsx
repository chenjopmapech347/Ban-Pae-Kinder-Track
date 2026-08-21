import { useState, useMemo, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { useIsTermLocked } from '../../hooks/useIsTermLocked';

// ── รายการตรวจสุขภาพ 6 หมวด ──────────────────────────────────────────────────
const CHECK_ITEMS = [
  { id: 'body',  label: 'ร่างกาย',  emoji: '🧍' },
  { id: 'hair',  label: 'ผม',       emoji: '💈' },
  { id: 'cloth', label: 'เสื้อผ้า', emoji: '👕' },
  { id: 'ear',   label: 'ใบหู',     emoji: '👂' },
  { id: 'mouth', label: 'ช่องปาก',  emoji: '🦷' },
  { id: 'nail',  label: 'เล็บ',     emoji: '💅' },
];

// ป้ายสัปดาห์ที่ 1 2 3 (ใช้ทั้ง UI และ print)
const WEEK_LABELS = ['①', '②', '③'];

// สร้าง student entry เริ่มต้น — ทุกหมวดเป็น null (ยังไม่ได้เลือกสัปดาห์)
function emptyStudentEntry() {
  return {
    ...CHECK_ITEMS.reduce((acc, item) => {
      acc[item.id] = null;
      return acc;
    }, {}),
    note: '',
  };
}

// ─── Helper: ดึงสัปดาห์ที่เลือกสำหรับ student+category ─────────────────────
// รองรับ format ใหม่ (null | 1 | 2 | 3) และ format เก่า ({ v1, v2, v3 })
function getSelectedWeek(entry, itemId) {
  const val = entry[itemId];
  if (val == null) return null;
  if (typeof val === 'number' && [1, 2, 3].includes(val)) return val;
  // Backward compat: format เก่าที่เก็บเป็น { v1: score, v2: score, v3: score }
  if (typeof val === 'object' && !Array.isArray(val)) {
    if (val.v1 != null) return 1;
    if (val.v2 != null) return 2;
    if (val.v3 != null) return 3;
  }
  return null;
}

// record key รายวัน
function recordKey(className, academicYear, date) {
  return `${className}__${academicYear}__${date}`;
}

// สร้าง record เปล่า
function makeDefaultRecord(k, cls, ay, date, studs) {
  const studsData = {};
  studs.forEach(s => { studsData[s.id] = emptyStudentEntry(); });
  return { id: k, className: cls, academicYear: ay, date, students: studsData };
}

// format วันที่เป็นภาษาไทย
function toThaiDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('th-TH', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

// นับหมวดที่มีสัปดาห์ถูกเลือก (0-6)
function countFilled(entry) {
  return CHECK_ITEMS.filter(item => getSelectedWeek(entry, item.id) != null).length;
}

// ── HealthCheckTab ────────────────────────────────────────────────────────────
export default function HealthCheckTab({ teacherClassFilter = null }) {
  const {
    students, classes, teachers, role, user,
    academicYear, schoolLogo, holidays,
    healthCheckRecords, setHealthCheckRecords,
    backfillHealthCheckRecords,
  } = useApp();

  const isTeacher = role === 'teacher';
  const myClass   = teacherClassFilter ?? (isTeacher ? user?.className : null);

  const todayIso = new Date().toISOString().slice(0, 10);

  // ── ตรวจสอบวันหยุด ────────────────────────────────────────────────────────
  const holidayInfo = useMemo(() => {
    return (holidays ?? []).find(h => {
      if (!h.date) return false;
      if (h.date.includes('/')) {
        const [dd, mm, bYear] = h.date.split('/');
        return `${Number(bYear) - 543}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}` === selDate;
      }
      return h.date === selDate;
    }) ?? null;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [holidays, selDate]);

  const [selClass, setSelClass] = useState(() => myClass ?? (classes[0]?.name ?? ''));
  const [selDate,  setSelDate]  = useState(todayIso);
  const [saved,         setSaved]         = useState(false);
  const [backfillMsg,   setBackfillMsg]   = useState('');
  const isLocked = useIsTermLocked(selDate);

  const key = useMemo(() => recordKey(selClass, academicYear, selDate), [selClass, academicYear, selDate]);

  const classStudents = useMemo(() =>
    students
      .filter(s => s.className === selClass && !s.name.startsWith('(ว่าง)'))
      .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '', 'th')),
    [students, selClass]
  );

  const [draft, setDraft] = useState(() => {
    const existing = healthCheckRecords[key];
    if (existing) return existing;
    const initStuds = students
      .filter(s => s.className === selClass && !s.name.startsWith('(ว่าง)'))
      .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '', 'th'));
    return makeDefaultRecord(key, selClass, academicYear, selDate, initStuds);
  });

  const loadRecord = useCallback((newKey, newClass, newDate) => {
    const existing = healthCheckRecords[newKey];
    if (existing) {
      setDraft(existing);
    } else {
      const studs = students
        .filter(s => s.className === newClass && !s.name.startsWith('(ว่าง)'))
        .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '', 'th'));
      setDraft(makeDefaultRecord(newKey, newClass, academicYear, newDate, studs));
    }
    setSaved(false);
  }, [healthCheckRecords, academicYear, students]);

  function handleClassChange(cls) {
    setSelClass(cls);
    const k = recordKey(cls, academicYear, selDate);
    loadRecord(k, cls, selDate);
  }

  function handleDateChange(d) {
    setSelDate(d);
    const k = recordKey(selClass, academicYear, d);
    loadRecord(k, selClass, d);
  }

  // ── เลือกสัปดาห์ (radio: คลิกซ้ำ = ยกเลิก, คลิกต่างสัปดาห์ = สลับ) ───────
  function selectWeek(studentId, itemId, weekNum) {
    setSaved(false);
    setDraft(prev => {
      const entry = prev.students[studentId] ?? emptyStudentEntry();
      const current = getSelectedWeek(entry, itemId);
      const newVal = current === weekNum ? null : weekNum;
      return {
        ...prev,
        students: {
          ...prev.students,
          [studentId]: { ...entry, [itemId]: newVal },
        },
      };
    });
  }

  // ── fill ทุกคนด้วยสัปดาห์ที่ระบุ (ถ้าทุกคนมีแล้ว = ล้าง) ──────────────────
  function fillCategoryWeek(itemId, weekNum) {
    const allHave = classStudents.length > 0 &&
      classStudents.every(s =>
        getSelectedWeek(draft.students[s.id] ?? emptyStudentEntry(), itemId) === weekNum
      );
    setSaved(false);
    setDraft(prev => {
      const newStudents = { ...prev.students };
      classStudents.forEach(s => {
        const entry = newStudents[s.id] ?? emptyStudentEntry();
        newStudents[s.id] = { ...entry, [itemId]: allHave ? null : weekNum };
      });
      return { ...prev, students: newStudents };
    });
  }

  // ── คลิกชื่อ — toggle ทุกหมวด (fill สัปดาห์ ① ถ้ายังไม่ครบ, ล้างถ้าครบ) ───
  function toggleRow(studentId) {
    const entry = draft.students[studentId] ?? emptyStudentEntry();
    const filled = countFilled(entry);
    const newVal = filled === CHECK_ITEMS.length ? null : 1;
    setSaved(false);
    setDraft(prev => {
      const newEntry = { ...prev.students[studentId] ?? emptyStudentEntry() };
      CHECK_ITEMS.forEach(item => { newEntry[item.id] = newVal; });
      return { ...prev, students: { ...prev.students, [studentId]: newEntry } };
    });
  }

  function handleNote(studentId, val) {
    setSaved(false);
    setDraft(prev => {
      const entry = prev.students[studentId] ?? emptyStudentEntry();
      return { ...prev, students: { ...prev.students, [studentId]: { ...entry, note: val } } };
    });
  }

  function handleSave() {
    setHealthCheckRecords(prev => ({ ...prev, [key]: { ...draft, date: selDate } }));
    setSaved(true);
  }

  function handleClear() {
    if (!window.confirm(`ล้างข้อมูลการตรวจสุขภาพวันที่ ${selDate} ห้อง ${selClass}?`)) return;
    setDraft(makeDefaultRecord(key, selClass, academicYear, selDate, classStudents));
    setHealthCheckRecords(prev => { const n = { ...prev }; delete n[key]; return n; });
    setSaved(false);
  }

  const teacherName = useMemo(() => {
    if (isTeacher) return user?.name ?? '';
    const t = teachers.find(t => t.className === selClass);
    return t?.name ?? '';
  }, [isTeacher, user, teachers, selClass]);

  // ─── Print ─────────────────────────────────────────────────────────────────
  function handlePrint() {
    const rows = classStudents.map((s, idx) => {
      const entry = draft.students[s.id] ?? emptyStudentEntry();
      const cells = CHECK_ITEMS.flatMap(item =>
        [1, 2, 3].map(weekNum => {
          const sel = getSelectedWeek(entry, item.id) === weekNum;
          return `<td class="cc">${sel ? '✓' : ''}</td>`;
        })
      ).join('');
      const filled = countFilled(entry);
      return `<tr>
        <td class="no">${idx + 1}</td>
        <td class="nm">${s.name}</td>
        ${cells}
        <td class="cc">${filled > 0 ? filled + '/' + CHECK_ITEMS.length : ''}</td>
        <td class="nt">${entry.note ?? ''}</td>
      </tr>`;
    }).join('');

    const itemCols = CHECK_ITEMS.map(item =>
      `<th class="hd" colspan="3">${item.label}</th>`
    ).join('');

    const visitLabels = CHECK_ITEMS.flatMap(() =>
      WEEK_LABELS.map(w => `<th class="hd">${w}</th>`)
    ).join('');

    const win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>แบบบันทึกการตรวจสุขภาพประจำสัปดาห์</title>
<style>
  @page { size: A4 landscape; margin: 1in }
  body { font-family: 'TH Sarabun New', Sarabun, sans-serif; font-size: 11pt }
  h3 { text-align: center; margin: 2px 0; font-size: 13pt }
  table { border-collapse: collapse; width: 100% }
  td, th { border: 1px solid #444; padding: 2px 3px; text-align: center; font-size: 9pt }
  .nm { text-align: left; min-width: 110px }
  .no { min-width: 22px }
  .cc { min-width: 20px }
  .nt { min-width: 60px }
  .hd { background: #f3f4f6; font-weight: bold }
  .sig { margin-top: 24px; text-align: center; font-size: 10pt; line-height: 2 }
</style></head><body>
${schoolLogo ? `<div style="text-align:center;margin-bottom:6px"><img src="${schoolLogo}" style="height:60px;object-fit:contain"/></div>` : ''}
<h3>แบบบันทึกการตรวจสุขภาพประจำสัปดาห์</h3>
<h3>ชั้น${selClass} &nbsp; ปีการศึกษา ${academicYear}</h3>
<h3>วันที่ ${toThaiDate(selDate)}</h3>
<br/>
<table>
  <thead>
    <tr>
      <th class="hd" rowspan="2">ที่</th>
      <th class="hd" rowspan="2">ชื่อ-สกุล</th>
      ${itemCols}
      <th class="hd" rowspan="2">รวม</th>
      <th class="hd" rowspan="2">หมายเหตุ</th>
    </tr>
    <tr>${visitLabels}</tr>
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

  const recordCount = useMemo(() =>
    Object.keys(healthCheckRecords).filter(k => k.startsWith(`${selClass}__${academicYear}__`)).length,
    [healthCheckRecords, selClass, academicYear]
  );

  // ─── UI ────────────────────────────────────────────────────────────────────
  return (
    <div className="glass p-6 animate-fade">
      <div className="page-header mb-4">
        <h3>🏥 การตรวจสุขภาพประจำสัปดาห์</h3>
      </div>

      {/* ── แบนเนอร์วันหยุด ── */}
      {holidayInfo && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '.75rem',
          background: '#fef3c7', border: '1.5px solid #f59e0b',
          borderRadius: '12px', padding: '.75rem 1rem', marginBottom: '1rem',
        }}>
          <span style={{ fontSize: '1.4rem' }}>🎌</span>
          <div>
            <div style={{ fontWeight: 800, color: '#92400e', fontSize: '.9rem' }}>
              วันหยุด — {holidayInfo.label}
            </div>
            <div style={{ fontSize: '.78rem', color: '#b45309', marginTop: '.1rem' }}>
              วันที่เลือกเป็นวันหยุดราชการ ข้อมูลที่บันทึกจะยังคงอยู่
            </div>
          </div>
        </div>
      )}

      {/* ── Controls ── */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '.75rem', alignItems: 'flex-end',
        background: '#f8fafc', borderRadius: '12px', padding: '.75rem 1rem',
        border: '1px solid #e2e8f0', marginBottom: '1.25rem',
      }}>
        {!myClass && (
          <div>
            <label style={lbl}>ห้องเรียน</label>
            <select className="input" value={selClass} onChange={e => handleClassChange(e.target.value)}
              style={{ fontSize: '.8rem', padding: '.3rem .6rem', minWidth: '120px' }}>
              {classes.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
          </div>
        )}
        <div>
          <label style={lbl}>วันที่ตรวจ</label>
          <input type="date" className="input" value={selDate}
            onChange={e => handleDateChange(e.target.value)}
            style={{ fontSize: '.8rem', padding: '.3rem .6rem' }} />
        </div>
        <div style={{ display: 'flex', gap: '.35rem', alignSelf: 'flex-end' }}>
          <button type="button" className="btn btn-secondary"
            style={{ fontSize: '.75rem', padding: '.3rem .65rem' }}
            onClick={() => {
              const d = new Date(selDate); d.setDate(d.getDate() - 1);
              handleDateChange(d.toISOString().slice(0, 10));
            }}>◀ วันก่อน</button>
          <button type="button" className="btn btn-secondary"
            style={{ fontSize: '.75rem', padding: '.3rem .65rem', background: todayIso === selDate ? '#eff6ff' : undefined }}
            onClick={() => handleDateChange(todayIso)}>วันนี้</button>
          <button type="button" className="btn btn-secondary"
            style={{ fontSize: '.75rem', padding: '.3rem .65rem' }}
            onClick={() => {
              const d = new Date(selDate); d.setDate(d.getDate() + 1);
              handleDateChange(d.toISOString().slice(0, 10));
            }}>วันถัดไป ▶</button>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right', fontSize: '.72rem', color: '#6b7280' }}>
          <div>ห้อง <strong>{selClass}</strong> · {classStudents.length} คน</div>
          <div>ปีการศึกษา {academicYear}</div>
          {teacherName && <div>ครู {teacherName}</div>}
          <div style={{ color: recordCount > 0 ? '#059669' : '#9ca3af' }}>มีข้อมูล {recordCount} สัปดาห์</div>
        </div>
      </div>

      {/* ── Legend ── */}
      <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center', marginBottom: '.75rem', fontSize: '.72rem', flexWrap: 'wrap' }}>
        <span style={{ background: '#d1fae5', color: '#065f46', fontWeight: 700, padding: '2px 10px', borderRadius: '6px', border: '1px solid #a7f3d0', fontSize: '.8rem' }}>✓</span>
        <span style={{ color: '#374151' }}>ตรวจแล้ว</span>
        <span style={{ color: '#9ca3af', margin: '0 .25rem' }}>·</span>
        <span style={{ color: '#6b7280' }}>① ② ③ = สัปดาห์ที่ 1 2 3 ที่ตรวจ</span>
        <span style={{ color: '#9ca3af', margin: '0 .25rem' }}>·</span>
        <span style={{ color: '#6b7280' }}>เลือกได้ 1 สัปดาห์ต่อหมวด | คลิกซ้ำ = ยกเลิก | คลิก ☑ ในหัวคอลัมน์ = fill ทุกคน</span>
      </div>

      {/* ── Table ── */}
      {classStudents.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#9ca3af', padding: '3rem' }}>ไม่พบนักเรียนในห้อง {selClass}</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', fontSize: '.73rem', tableLayout: 'auto' }}>
            <thead>
              {/* แถว 1: หัวหมวด (colspan=3) */}
              <tr>
                <th rowSpan={3} style={th({ minWidth: '28px' })}>ที่</th>
                <th rowSpan={3} style={th({ minWidth: '140px', textAlign: 'center' })}>ชื่อ-สกุล</th>
                {CHECK_ITEMS.map(item => (
                  <th key={item.id} colSpan={3}
                    style={th({ background: '#eff6ff', color: '#1e40af', fontWeight: 800, whiteSpace: 'nowrap' })}>
                    {item.emoji} {item.label}
                  </th>
                ))}
                <th rowSpan={3} style={th({ minWidth: '38px' })}>รวม<br/><span style={{ fontSize: '.62rem', fontWeight: 400, color: '#9ca3af' }}>/{CHECK_ITEMS.length}</span></th>
                <th rowSpan={3} style={th({ minWidth: '70px' })}>หมายเหตุ</th>
              </tr>

              {/* แถว 2: ป้าย ① ② ③ */}
              <tr>
                {CHECK_ITEMS.flatMap(item =>
                  WEEK_LABELS.map((wl, wi) => (
                    <th key={`lbl-${item.id}-w${wi + 1}`}
                      style={th({
                        padding: '3px 1px', background: '#f0f9ff',
                        fontSize: '.78rem', fontWeight: 800, color: '#1d4ed8',
                        minWidth: '28px',
                      })}>
                      {wl}
                    </th>
                  ))
                )}
              </tr>

              {/* แถว 3: fill ทั้งคอลัมน์ (คลิก = fill สัปดาห์นั้นให้ทุกคน) */}
              <tr style={{ background: '#f8fafc' }}>
                {CHECK_ITEMS.flatMap(item =>
                  [1, 2, 3].map(weekNum => {
                    const allHave = classStudents.length > 0 &&
                      classStudents.every(s =>
                        getSelectedWeek(draft.students[s.id] ?? emptyStudentEntry(), item.id) === weekNum
                      );
                    return (
                      <td key={`cb-${item.id}-w${weekNum}`}
                        onClick={() => fillCategoryWeek(item.id, weekNum)}
                        title={`Fill สัปดาห์ ${weekNum} ให้ทุกคนในหมวด${item.label} (คลิกซ้ำ = ล้าง)`}
                        style={{
                          textAlign: 'center', cursor: 'pointer', userSelect: 'none',
                          border: '1px solid #d1d5db', padding: '2px',
                          background: allHave ? '#d1fae5' : '#f8fafc',
                        }}>
                        <input
                          type="checkbox"
                          checked={allHave}
                          onChange={() => fillCategoryWeek(item.id, weekNum)}
                          onClick={e => e.stopPropagation()}
                          style={{ cursor: 'pointer', width: '13px', height: '13px', accentColor: '#059669' }}
                        />
                      </td>
                    );
                  })
                )}
              </tr>
            </thead>

            <tbody>
              {classStudents.map((s, idx) => {
                const entry = draft.students[s.id] ?? emptyStudentEntry();
                const filled = countFilled(entry);
                const allFilled = filled === CHECK_ITEMS.length;
                return (
                  <tr key={s.id} style={{ background: idx % 2 === 0 ? 'white' : '#fafafa' }}>
                    <td style={{ textAlign: 'center', border: '1px solid #e5e7eb', padding: '3px', color: '#6b7280' }}>{idx + 1}</td>
                    <td
                      onClick={() => toggleRow(s.id)}
                      title="คลิกเพื่อ fill ทุกหมวดด้วยสัปดาห์ ① (คลิกซ้ำ = ล้างทั้งแถว)"
                      style={{
                        border: '1px solid #e5e7eb', padding: '3px 7px',
                        whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none',
                        fontWeight: allFilled ? 700 : 400,
                        color: allFilled ? '#065f46' : '#1f2937',
                      }}>
                      {s.name}
                    </td>

                    {CHECK_ITEMS.flatMap(item =>
                      [1, 2, 3].map(weekNum => {
                        const selected = getSelectedWeek(entry, item.id) === weekNum;
                        return (
                          <td
                            key={`${item.id}-w${weekNum}`}
                            onClick={() => selectWeek(s.id, item.id, weekNum)}
                            title={`${item.label} สัปดาห์ที่ ${weekNum} — คลิกเพื่อเลือก`}
                            style={{
                              textAlign: 'center', cursor: 'pointer', userSelect: 'none',
                              border: '1px solid #e5e7eb', padding: '3px 1px', minWidth: '28px',
                              background: selected ? '#d1fae5' : 'white',
                              fontWeight: 800, fontSize: '.85rem',
                              color: selected ? '#065f46' : '#d1d5db',
                              transition: 'background .12s',
                            }}>
                            {selected ? '✓' : '·'}
                          </td>
                        );
                      })
                    )}

                    <td style={{
                      textAlign: 'center', border: '1px solid #e5e7eb', padding: '3px',
                      fontWeight: 700, fontSize: '.72rem',
                      color: allFilled ? '#065f46' : filled > 0 ? '#92400e' : '#9ca3af',
                      background: allFilled ? '#d1fae5' : filled > 0 ? '#fef3c7' : 'white',
                    }}>
                      {filled > 0 ? `${filled}/${CHECK_ITEMS.length}` : '—'}
                    </td>
                    <td style={{ border: '1px solid #e5e7eb', padding: '2px 4px' }}>
                      <input
                        type="text"
                        value={entry.note ?? ''}
                        onChange={e => handleNote(s.id, e.target.value)}
                        placeholder="—"
                        style={{
                          border: 'none', outline: 'none', width: '100%',
                          background: 'transparent', fontSize: '.7rem', color: '#374151',
                        }}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* สรุป: จำนวนที่เลือกแต่ละสัปดาห์ต่อหมวด */}
            <tfoot>
              <tr style={{ background: '#f1f5f9' }}>
                <td colSpan={2} style={{ border: '1px solid #d1d5db', textAlign: 'center', fontWeight: 800, fontSize: '.68rem', color: '#475569', padding: '3px 6px' }}>
                  จำนวนที่ตรวจ
                </td>
                {CHECK_ITEMS.flatMap(item =>
                  [1, 2, 3].map(weekNum => {
                    const count = classStudents.filter(s =>
                      getSelectedWeek(draft.students[s.id] ?? emptyStudentEntry(), item.id) === weekNum
                    ).length;
                    return (
                      <td key={`sum-${item.id}-w${weekNum}`}
                        style={{
                          border: '1px solid #d1d5db', textAlign: 'center',
                          fontWeight: 700, fontSize: '.68rem', padding: '3px',
                          color: count === classStudents.length ? '#065f46'
                            : count > 0 ? '#92400e' : '#9ca3af',
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

      {/* Lock banner */}
      {isLocked && (
        <div style={{ padding:'.6rem 1rem', background:'#fef2f2', border:'1.5px solid #fca5a5',
          borderRadius:'10px', color:'#b91c1c', fontWeight:700, fontSize:'.82rem',
          marginTop:'.75rem', display:'flex', alignItems:'center', gap:'.5rem' }}>
          🔒 ภาคเรียนนี้ถูกล็อกแล้ว — ไม่สามารถบันทึกหรือแก้ไขข้อมูลได้
        </div>
      )}
      {/* ── Actions ── */}
      <div style={{ display: 'flex', gap: '.6rem', marginTop: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <button className="btn btn-primary" onClick={handleSave}
          disabled={isLocked} style={{ opacity: isLocked ? 0.5 : 1, cursor: isLocked ? 'not-allowed' : 'pointer' }}>
          {isLocked ? '🔒 ล็อกแล้ว' : '💾 บันทึก'}
        </button>
        <button className="btn btn-secondary" onClick={handlePrint}>🖨️ พิมพ์แบบฟอร์ม</button>
        <button
          type="button" onClick={handleClear}
          style={{ padding: '.35rem .9rem', borderRadius: '8px', border: '1px solid #fca5a5', background: '#fff5f5', color: '#dc2626', fontFamily: 'inherit', fontSize: '.8rem', cursor: 'pointer' }}>
          🗑️ ล้างข้อมูลวันนี้
        </button>
        {!isLocked && (
          <button
            type="button"
            onClick={() => {
              const n = backfillHealthCheckRecords();
              setBackfillMsg(`✅ ตรวจสอบย้อนหลังแล้ว ${n} สัปดาห์`);
              setTimeout(() => setBackfillMsg(''), 4000);
            }}
            style={{ padding: '.35rem .9rem', borderRadius: '8px', border: '1px solid #a5b4fc', background: '#eef2ff', color: '#4338ca', fontFamily: 'inherit', fontSize: '.8rem', cursor: 'pointer' }}>
            🔄 ตรวจสอบย้อนหลัง
          </button>
        )}
        {saved && <span style={{ color: '#059669', fontWeight: 700, fontSize: '.82rem' }}>✅ บันทึกแล้ว</span>}
        {backfillMsg && <span style={{ color: '#4338ca', fontWeight: 700, fontSize: '.82rem' }}>{backfillMsg}</span>}
      </div>

      {/* ── History panel ── */}
      <DayHistory
        healthCheckRecords={healthCheckRecords}
        selClass={selClass}
        academicYear={academicYear}
        currentDate={selDate}
        onSelect={d => handleDateChange(d)}
      />
    </div>
  );
}

// ── DayHistory ────────────────────────────────────────────────────────────────
function DayHistory({ healthCheckRecords, selClass, academicYear, currentDate, onSelect }) {
  const days = useMemo(() => {
    const prefix = `${selClass}__${academicYear}__`;
    return Object.values(healthCheckRecords)
      .filter(r => r.className === selClass && r.academicYear === academicYear)
      .map(r => r.date ?? r.id?.replace(prefix, ''))
      .filter(Boolean)
      .sort((a, b) => b.localeCompare(a));
  }, [healthCheckRecords, selClass, academicYear]);

  if (days.length === 0) return null;

  return (
    <div style={{
      marginTop: '1.25rem', padding: '.75rem 1rem',
      background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0',
    }}>
      <div style={{ fontSize: '.75rem', fontWeight: 800, color: '#475569', marginBottom: '.5rem' }}>
        📅 ประวัติการตรวจสุขภาพ — ห้อง {selClass} ปีการศึกษา {academicYear} ({days.length} สัปดาห์)
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.35rem' }}>
        {days.map(d => {
          const isActive = d === currentDate;
          return (
            <button key={d} type="button" onClick={() => onSelect(d)}
              style={{
                padding: '.25rem .65rem', borderRadius: '8px', fontFamily: 'inherit', cursor: 'pointer',
                fontSize: '.75rem', fontWeight: isActive ? 800 : 500,
                background: isActive ? '#3b82f6' : 'white',
                color: isActive ? 'white' : '#374151',
                border: `1.5px solid ${isActive ? '#3b82f6' : '#e5e7eb'}`,
              }}>
              {new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
              <span style={{ fontSize: '.65rem', opacity: .75, marginLeft: '.25rem' }}>
                ({new Date(d).toLocaleDateString('th-TH', { weekday: 'short' })})
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Style helpers ─────────────────────────────────────────────────────────────
function th(extra = {}) {
  return {
    border: '1px solid #d1d5db', padding: '4px 3px',
    background: '#f9fafb', fontWeight: 700, fontSize: '.7rem',
    textAlign: 'center', ...extra,
  };
}
const lbl = {
  fontSize: '.72rem', fontWeight: 700, color: '#475569',
  display: 'block', marginBottom: '.2rem',
};
