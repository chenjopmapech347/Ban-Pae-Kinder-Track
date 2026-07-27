import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { useIsTermLocked } from '../../hooks/useIsTermLocked';

// ── สัญลักษณ์ ────────────────────────────────────────────────────────────────
// √  = รับประทานอาหารกลางวัน (ate lunch)
// X  = ไม่มาเรียน / ขาด
// '' = ว่าง (วันหยุด / ยังไม่บันทึก)
const CYCLE = ['', '√', 'X'];
const DONE_SYM = '√'; // เดิมใช้ 'H'

const CELL_STYLE = {
  '√': { bg: '#fef3c7', color: '#92400e', fw: 800 }, // ส้มอ่อน = กินอาหาร
  H:   { bg: '#fef3c7', color: '#92400e', fw: 800 }, // backward compat (ข้อมูลเก่า)
  X:   { bg: '#f3f4f6', color: '#9ca3af', fw: 700 }, // เทา = ไม่มาเรียน
  '':  { bg: 'white',   color: '#d1d5db', fw: 400 }, // ว่าง
};
function isDone(v) { return v === DONE_SYM || v === 'H'; } // รองรับข้อมูลเก่า

const DOW_SHORT   = ['อา','จ','อ','พ','พฤ','ศ','ส'];
const THAI_MONTHS = ['','มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
  'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
const THAI_MONTHS_SHORT = ['','ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];

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
function nextSym(cur) {
  const i = CYCLE.indexOf(cur ?? '');
  return CYCLE[(i + 1) % CYCLE.length];
}
function countH(days) {
  return Object.values(days ?? {}).filter(v => isDone(v)).length;
}

// ไม่ auto-fill — default ตารางว่าง ครูเติมเอง
function patchCurrentMonth(rec) { return rec; }

// สร้าง record เริ่มต้น: ตารางว่าง ครูเติมเอง
function makeDefaultRecord(k, cls, ay, yr, mo, sd, studs) {
  const studsData = {};
  studs.forEach(s => { studsData[s.id] = { days: {} }; });
  return { id: k, className: cls, academicYear: ay, year: yr, month: mo, schoolDays: sd, students: studsData };
}

// ── LunchTab ──────────────────────────────────────────────────────────────────
export default function LunchTab({ teacherClassFilter = null }) {
  const {
    students, classes, teachers, role, user,
    academicYear, schoolLogo,
    lunchRecords, setLunchRecords,
    holidays,
  } = useApp();

  // Set ของวันหยุด (ISO YYYY-MM-DD) เพื่อ highlight เหมือนวันเสาร์-อาทิตย์
  const holidayISOs = useMemo(() => {
    const s = new Set();
    holidays.forEach(h => {
      if (!h.date) return;
      if (h.date.includes('/')) {
        const [dd, mm, bYear] = h.date.split('/');
        s.add(`${parseInt(bYear,10)-543}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}`);
      } else {
        s.add(h.date);
      }
    });
    return s;
  }, [holidays]);

  // วันที่ปิดเรียน = วันหยุดราชการ + เสาร์-อาทิตย์
  function isSchoolOff(ty, mo, d) {
    if (isWeekend(ty, mo, d)) return true;
    const iso = `${ty-543}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    return holidayISOs.has(iso);
  }

  const isTeacher = role === 'teacher';
  const myClass   = teacherClassFilter ?? (isTeacher ? user?.className : null);

  const now = new Date();
  const [selClass,   setSelClass]   = useState(() => myClass ?? (classes[0]?.name ?? ''));
  const [selYear,    setSelYear]    = useState(now.getFullYear() + 543);
  const [selMonth,   setSelMonth]   = useState(now.getMonth() + 1);
  const [schoolDays, setSchoolDays] = useState(20);
  const [saved, setSaved] = useState(false);
  const isLocked = useIsTermLocked(`${selYear - 543}-${String(selMonth).padStart(2, '0')}-01`);

  const key     = useMemo(() => recKey(selClass, academicYear, selYear, selMonth), [selClass, academicYear, selYear, selMonth]);
  const numDays = useMemo(() => daysInMonth(selYear, selMonth), [selYear, selMonth]);
  const dayArr  = useMemo(() => Array.from({ length: numDays }, (_, i) => i + 1), [numDays]);

  const classStudents = useMemo(() =>
    students
      .filter(s => s.className === selClass && !s.name.startsWith('(ว่าง)'))
      .sort((a, b) => Number(a.id) - Number(b.id)),
    [students, selClass]
  );

  const [draft, setDraft] = useState(() => {
    const ex = lunchRecords[key];
    if (ex) return patchCurrentMonth(ex, selYear, selMonth);
    const initStuds = students.filter(s => s.className === selClass && !s.name.startsWith('(ว่าง)')).sort((a,b)=>Number(a.id)-Number(b.id));
    return makeDefaultRecord(key, selClass, academicYear, selYear, selMonth, 20, initStuds);
  });

  // Re-sync draft เมื่อ lunchRecords อัปเดตจากภายนอก (เช่น auto-fill จาก saveDailyAttendance)
  const prevKeyRef = useRef(key);
  useEffect(() => {
    const keyChanged = prevKeyRef.current !== key;
    prevKeyRef.current = key;
    const ex = lunchRecords[key];
    if (!ex) return;
    if (keyChanged) {
      setDraft(patchCurrentMonth(ex, selYear, selMonth));
      setSchoolDays(ex.schoolDays ?? 20);
    } else {
      setDraft(prev => {
        const merged = { ...prev, students: { ...prev.students } };
        Object.entries(ex.students ?? {}).forEach(([sid, sData]) => {
          const prevDays = merged.students[sid]?.days ?? {};
          const newDays  = sData.days ?? {};
          const days = { ...prevDays };
          Object.entries(newDays).forEach(([d, v]) => {
            if (!days[d] || days[d] === '') days[d] = v; // auto-fill เฉพาะช่องว่าง
          });
          merged.students[sid] = { ...(merged.students[sid] ?? {}), days };
        });
        return merged;
      });
    }
  }, [lunchRecords, key]); // eslint-disable-line react-hooks/exhaustive-deps

  const switchRecord = useCallback((cls, yr, mo) => {
    const k = recKey(cls, academicYear, yr, mo);
    const ex = lunchRecords[k];
    if (ex) {
      setDraft(patchCurrentMonth(ex, yr, mo));
      setSchoolDays(ex.schoolDays ?? 20);
    } else {
      const studs = students.filter(s => s.className === cls && !s.name.startsWith('(ว่าง)')).sort((a,b)=>Number(a.id)-Number(b.id));
      setDraft(makeDefaultRecord(k, cls, academicYear, yr, mo, 20, studs));
      setSchoolDays(20);
    }
    setSaved(false);
  }, [lunchRecords, academicYear, students]);

  function handleClassChange(cls) { setSelClass(cls); switchRecord(cls, selYear, selMonth); }
  function handleYearChange(yr)   { const y=Number(yr); setSelYear(y);  switchRecord(selClass, y, selMonth); }
  function handleMonthChange(mo)  { const m=Number(mo); setSelMonth(m); switchRecord(selClass, selYear, m); }
  function handleSchoolDays(v)    {
    const n = Number(v) || 0;
    setSchoolDays(n);
    setDraft(prev => ({ ...prev, schoolDays: n }));
    setSaved(false);
  }

  function cycleCell(studentId, day) {
    setSaved(false);
    setDraft(prev => {
      const cur  = prev.students[studentId]?.days?.[day] ?? '';
      const next = nextSym(cur);
      const sData = prev.students[studentId] ?? { days: {} };
      return {
        ...prev,
        students: {
          ...prev.students,
          [studentId]: { ...sData, days: { ...(sData.days ?? {}), [day]: next } },
        },
      };
    });
  }

  function toggleAllH(day) {
    if (isSchoolOff(selYear, selMonth, day)) return;
    const allH = classStudents.length > 0 &&
      classStudents.every(s => isDone(draft.students[s.id]?.days?.[day]));
    setSaved(false);
    setDraft(prev => {
      const updated = { ...prev.students };
      classStudents.forEach(s => {
        const sData = updated[s.id] ?? { days: {} };
        updated[s.id] = { ...sData, days: { ...(sData.days ?? {}), [day]: allH ? '' : DONE_SYM } };
      });
      return { ...prev, students: updated };
    });
  }

  function handleSave() {
    setLunchRecords(prev => ({ ...prev, [key]: { ...draft, schoolDays } }));
    setSaved(true);
  }

  function handleClear() {
    if (!window.confirm(`ล้างข้อมูลอาหารกลางวัน ${THAI_MONTHS[selMonth]} ${selYear} ห้อง ${selClass}?`)) return;
    const blank = { id: key, className: selClass, academicYear, year: selYear, month: selMonth, schoolDays, students: {} };
    setDraft(blank);
    setLunchRecords(prev => { const n = { ...prev }; delete n[key]; return n; });
    setSaved(false);
  }

  const teacherName = useMemo(() => {
    if (isTeacher) return user?.name ?? '';
    const t = teachers.find(t => t.className === selClass);
    return t?.name ?? '';
  }, [isTeacher, user, teachers, selClass]);

  const daySummary = useMemo(() =>
    dayArr.map(d => classStudents.filter(s => isDone(draft.students[s.id]?.days?.[d])).length),
    [draft, classStudents, dayArr]
  );

  // ── Print ───────────────────────────────────────────────────────────────────
  function handlePrint() {
    const thRow1 = dayArr.map(d => {
      const wknd = isSchoolOff(selYear, selMonth, d);
      return `<th class="${wknd?'wknd':'hdc'}">${d}</th>`;
    }).join('');
    const thRow2 = dayArr.map(d => {
      const wknd = isSchoolOff(selYear, selMonth, d);
      const dow  = getDow(selYear, selMonth, d);
      return `<th class="${wknd?'wknd':'hdc2'}">${DOW_SHORT[dow]}</th>`;
    }).join('');

    const rows = classStudents.map((s, idx) => {
      const sData = draft.students[s.id] ?? { days: {} };
      const cells = dayArr.map(d => {
        const v    = sData.days?.[d] ?? '';
        const wknd = isSchoolOff(selYear, selMonth, d);
        const cls  = wknd ? 'wknd' : isDone(v) ? 'eat' : v === 'X' ? 'abs' : '';
        return `<td class="${cls}">${v}</td>`;
      }).join('');
      const total = countH(sData.days);
      const nameShort = s.name.replace('เด็กชาย','ด.ช.').replace('เด็กหญิง','ด.ญ.');
      return `<tr><td class="no">${idx+1}</td><td class="name">${nameShort}</td>${cells}<td class="tot">${total||''}</td></tr>`;
    }).join('');

    const footRow = dayArr.map((d, i) => {
      const wknd = isSchoolOff(selYear, selMonth, d);
      const cnt  = daySummary[i];
      return `<td class="footd">${!wknd && cnt > 0 ? cnt : ''}</td>`;
    }).join('');

    const win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>บันทึกการรับประทานอาหารกลางวัน</title>
<style>
  @page { size: A4 landscape; margin: 1in }
  body { font-family: 'TH Sarabun New', Sarabun, sans-serif; font-size: 10pt }
  h3, h4 { text-align: center; margin: 2px 0 }
  h3 { font-size: 13pt }
  h4 { font-size: 10pt; font-weight: normal }
  table { border-collapse: collapse; width: 100% }
  td, th { border: 1px solid #555; padding: 1px 2px; text-align: center; font-size: 7.5pt }
  .no  { min-width: 18px; font-weight: bold }
  .name{ text-align: left; padding-left: 4px; min-width: 90px; font-weight: 600 }
  .tot { min-width: 20px; font-weight: bold; background: #fef3c7 }
  .hd  { background: #fef3c7; font-weight: bold; font-size: 8pt }
  .hdc { background: #fef3c7; min-width: 16px }
  .hdc2{ background: #fde68a; font-size: 7pt; color: #78350f }
  .wknd{ background: #e5e7eb; color: #9ca3af; min-width: 16px }
  .eat { background: #fef3c7; color: '#92400e'; font-weight: 800 }
  .abs { background: #f3f4f6; color: #9ca3af }
  .footd{ background: #fef9c3; color: '#78350f'; font-weight: 700 }
  .sig  { margin-top: 14px; display: flex; justify-content: center; gap: 100pt; font-size: 9pt; line-height: 2 }
</style></head><body>
${schoolLogo ? `<div style="text-align:center;margin-bottom:4px"><img src="${schoolLogo}" style="height:70px;object-fit:contain"/></div>` : ''}
<h3>บันทึกการรับประทานอาหารกลางวัน</h3>
<h4>เดือน ${THAI_MONTHS[selMonth]} พ.ศ. ${selYear} &nbsp;&nbsp;&nbsp; เวลาเรียนในรอบเดือน ${schoolDays} วัน</h4>
<h4>ชั้น${selClass} &nbsp; ครู ${teacherName || '.........................'} &nbsp; จำนวน ${classStudents.length} คน</h4>
<br/>
<table>
  <thead>
    <tr>
      <th rowspan="2" class="hd">เลขที่</th>
      <th rowspan="2" class="hd" style="text-align:left;padding-left:4px">ชื่อ-นามสกุล</th>
      ${thRow1}
      <th rowspan="2" class="hd">รวม<br/>เวลา</th>
    </tr>
    <tr>${thRow2}</tr>
  </thead>
  <tbody>${rows}</tbody>
  <tfoot>
    <tr>
      <td class="footd" style="font-size:7pt">รวม</td>
      <td class="footd"></td>
      ${footRow}
      <td class="footd"></td>
    </tr>
  </tfoot>
</table>
<div class="sig">
  <div>ลงชื่อ .............................................<br/>(${teacherName || '.....................................'})<br/>ครูประจำชั้น</div>
  <div>ลงชื่อ .............................................<br/>(...............................................)<br/>ผู้อำนวยการสถานศึกษา</div>
</div>
</body></html>`);
    win.document.close();
    win.print();
  }

  // ── UI ──────────────────────────────────────────────────────────────────────
  return (
    <div className="glass p-6 animate-fade">
      <div className="page-header mb-4">
        <h3>🍱 บันทึกการรับประทานอาหารกลางวัน</h3>
      </div>

      {/* ── Controls ── */}
      <div style={{
        display:'flex', flexWrap:'wrap', gap:'.75rem', alignItems:'flex-end',
        background:'#fffbeb', borderRadius:'12px', padding:'.75rem 1rem',
        border:'1px solid #fde68a', marginBottom:'1rem',
      }}>
        {!myClass && (
          <div>
            <label style={lbl}>ห้องเรียน</label>
            <select className="input" value={selClass} onChange={e => handleClassChange(e.target.value)}
              style={{ fontSize:'.8rem', padding:'.3rem .6rem', minWidth:'120px' }}>
              {classes.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
          </div>
        )}
        <div>
          <label style={lbl}>ปี พ.ศ.</label>
          <input type="number" className="input" value={selYear} min={2560} max={2599}
            onChange={e => handleYearChange(e.target.value)}
            style={{ fontSize:'.8rem', padding:'.3rem .6rem', width:'90px' }} />
        </div>
        <div>
          <label style={lbl}>เดือน</label>
          <select className="input" value={selMonth} onChange={e => handleMonthChange(e.target.value)}
            style={{ fontSize:'.8rem', padding:'.3rem .6rem' }}>
            {THAI_MONTHS.slice(1).map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl}>เวลาเรียนในรอบเดือน (วัน)</label>
          <input type="number" className="input" value={schoolDays} min={1} max={31}
            onChange={e => handleSchoolDays(e.target.value)}
            style={{ fontSize:'.8rem', padding:'.3rem .6rem', width:'70px' }} />
        </div>
        <div style={{ marginLeft:'auto', textAlign:'right', fontSize:'.72rem', color:'#78350f' }}>
          <div>ห้อง <strong>{selClass}</strong> · {classStudents.length} คน</div>
          {teacherName && <div>ครู {teacherName}</div>}
        </div>
      </div>

      {/* ── Legend ── */}
      <div style={{ display:'flex', gap:'.5rem', flexWrap:'wrap', marginBottom:'.75rem', fontSize:'.72rem', alignItems:'center' }}>
        {[
          ['√','รับประทานอาหาร','#fef3c7','#92400e'],
          ['X','ไม่มาเรียน','#f3f4f6','#9ca3af'],
          ['—','วันหยุด/ไม่บันทึก','white','#d1d5db'],
        ].map(([sym, label, bg, color]) => (
          <span key={sym} style={{ background:bg, color, fontWeight:700, padding:'2px 8px', borderRadius:'6px', border:'1px solid rgba(0,0,0,.07)' }}>
            {sym} {label}
          </span>
        ))}
        <span style={{ color:'#6b7280' }}>คลิก = วนสถานะ · ☑️ ช่องใต้วันที่ = H/ว่าง ทั้งห้อง</span>
      </div>

      {/* ── Table ── */}
      {classStudents.length === 0 ? (
        <div style={{ textAlign:'center', color:'#9ca3af', padding:'3rem' }}>ไม่พบนักเรียนในห้อง {selClass}</div>
      ) : (
        <div style={{ overflowX:'auto' }}>
          <table style={{ borderCollapse:'collapse', fontSize:'.72rem' }}>
            <thead>
              <tr>
                <th rowSpan={3} style={th({ minWidth:'32px', background:'#fef3c7', color:'#92400e' })}>เลขที่</th>
                <th rowSpan={3} style={th({ minWidth:'110px', textAlign:'left', padding:'2px 6px', background:'#fef3c7', color:'#92400e' })}>ชื่อ-นามสกุล</th>
                {dayArr.map(d => {
                  const wknd = isSchoolOff(selYear, selMonth, d);
                  return (
                    <th key={d}
                      style={{
                        ...th({ minWidth:'22px', maxWidth:'26px', fontSize:'.65rem' }),
                        background: wknd ? '#e5e7eb' : '#fef3c7',
                        color: wknd ? '#9ca3af' : '#92400e',
                        cursor: 'default',
                      }}>
                      {d}
                    </th>
                  );
                })}
                <th rowSpan={3} style={th({ minWidth:'32px', background:'#fde68a', color:'#78350f', fontWeight:800 })}>รวม<br/>เวลา</th>
              </tr>
              <tr>
                {dayArr.map(d => {
                  const wknd = isSchoolOff(selYear, selMonth, d);
                  const dow  = getDow(selYear, selMonth, d);
                  return (
                    <th key={d} style={{
                      ...th({ fontSize:'.6rem', padding:'1px' }),
                      background: wknd ? '#e5e7eb' : '#fde68a',
                      color: wknd ? '#9ca3af' : '#78350f',
                    }}>
                      {DOW_SHORT[dow]}
                    </th>
                  );
                })}
              </tr>
              {/* Row 3: Checkbox — คลิก = H ทั้งคอลัมน์ */}
              <tr>
                {dayArr.map(d => {
                  const wknd = isSchoolOff(selYear, selMonth, d);
                  if (wknd) return <td key={d} style={{ border:'1px solid #e5e7eb', background:'#e5e7eb', padding:'1px' }} />;
                  const allH = classStudents.length > 0 &&
                    classStudents.every(s => isDone(draft.students[s.id]?.days?.[d]));
                  return (
                    <td key={d}
                      onClick={() => toggleAllH(d)}
                      title={allH ? 'ยกเลิก H ทั้งคอลัมน์' : 'H ทุกคน'}
                      style={{ textAlign:'center', cursor:'pointer', padding:'2px', border:'1px solid #d1d5db', background: allH ? '#fef3c7' : '#f9fafb' }}>
                      <input
                        type="checkbox" checked={allH}
                        onChange={() => toggleAllH(d)}
                        onClick={e => e.stopPropagation()}
                        style={{ cursor:'pointer', width:'11px', height:'11px', accentColor:'#d97706' }}
                      />
                    </td>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {classStudents.map((s, idx) => {
                const sData = draft.students[s.id] ?? { days: {} };
                const total = countH(sData.days);
                return (
                  <tr key={s.id} style={{ background: idx%2===0 ? 'white' : '#fffdf5' }}>
                    <td style={{ textAlign:'center', border:'1px solid #e5e7eb', padding:'2px', color:'#6b7280', fontWeight:700 }}>{idx+1}</td>
                    <td style={{ border:'1px solid #e5e7eb', padding:'2px 6px', fontWeight:600, fontSize:'.72rem', whiteSpace:'nowrap' }}>
                      {s.name.replace('เด็กชาย','ด.ช.').replace('เด็กหญิง','ด.ญ.')}
                    </td>
                    {dayArr.map(d => {
                      const v    = sData.days?.[d] ?? '';
                      const wknd = isSchoolOff(selYear, selMonth, d);
                      const st   = CELL_STYLE[v] ?? CELL_STYLE[''];
                      return (
                        <td key={d}
                          onClick={() => !wknd && cycleCell(s.id, d)}
                          style={{
                            textAlign:'center', border:'1px solid #e5e7eb',
                            minWidth:'22px', maxWidth:'26px', padding:'3px 1px',
                            background: wknd ? '#e5e7eb' : st.bg,
                            color: wknd ? '#d1d5db' : st.color,
                            fontWeight: st.fw, fontSize:'.72rem',
                            cursor: wknd ? 'default' : 'pointer',
                            userSelect: 'none',
                          }}>
                          {wknd ? '' : (v || '·')}
                        </td>
                      );
                    })}
                    <td style={{
                      textAlign:'center', border:'1px solid #e5e7eb',
                      fontWeight:800, fontSize:'.78rem',
                      background: total >= schoolDays ? '#d1fae5' : total > 0 ? '#fef3c7' : 'white',
                      color: total >= schoolDays ? '#065f46' : total > 0 ? '#92400e' : '#d1d5db',
                    }}>
                      {total > 0 ? total : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background:'#fef9c3' }}>
                <td style={{ border:'1px solid #d1d5db', textAlign:'center', fontWeight:800, fontSize:'.65rem', color:'#78350f' }}>รวม</td>
                <td style={{ border:'1px solid #d1d5db' }} />
                {daySummary.map((cnt, i) => {
                  const wknd = isSchoolOff(selYear, selMonth, i + 1);
                  return (
                    <td key={i} style={{
                      border:'1px solid #d1d5db', textAlign:'center', fontSize:'.65rem',
                      fontWeight: cnt > 0 ? 800 : 400,
                      color: cnt === classStudents.length ? '#065f46' : cnt > 0 ? '#92400e' : '#d1d5db',
                      background: wknd ? '#e5e7eb' : cnt > 0 ? '#fef3c7' : 'white',
                    }}>
                      {!wknd && cnt > 0 ? cnt : ''}
                    </td>
                  );
                })}
                <td style={{ border:'1px solid #d1d5db' }} />
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
      <div style={{ display:'flex', gap:'.6rem', marginTop:'1rem', flexWrap:'wrap', alignItems:'center' }}>
        <button className="btn btn-primary" onClick={handleSave}
          disabled={isLocked} style={{ opacity: isLocked ? 0.5 : 1, cursor: isLocked ? 'not-allowed' : 'pointer' }}>
          {isLocked ? '🔒 ล็อกแล้ว' : '💾 บันทึก'}
        </button>
        <button className="btn btn-secondary" onClick={handlePrint}>🖨️ พิมพ์แบบฟอร์ม</button>
        <button type="button" onClick={handleClear}
          style={{ padding:'.35rem .9rem', borderRadius:'8px', border:'1px solid #fca5a5', background:'#fff5f5', color:'#dc2626', fontFamily:'inherit', fontSize:'.8rem', cursor:'pointer' }}>
          🗑️ ล้างข้อมูลเดือนนี้
        </button>
        {saved && <span style={{ color:'#059669', fontWeight:700, fontSize:'.82rem' }}>✅ บันทึกแล้ว</span>}

        <div style={{ marginLeft:'auto', fontSize:'.72rem', color:'#92400e', textAlign:'right' }}>
          กินครบ {classStudents.filter(s => countH(draft.students[s.id]?.days) >= schoolDays).length} คน
          · มีข้อมูล {classStudents.filter(s => countH(draft.students[s.id]?.days) > 0).length} คน
        </div>
      </div>

      {/* ── Month History ── */}
      <MonthHistory
        lunchRecords={lunchRecords}
        selClass={selClass}
        academicYear={academicYear}
        selYear={selYear}
        selMonth={selMonth}
        onSelect={(yr, mo) => { handleYearChange(yr); handleMonthChange(mo); }}
      />
    </div>
  );
}

// ── MonthHistory ──────────────────────────────────────────────────────────────
function MonthHistory({ lunchRecords, selClass, academicYear, selYear, selMonth, onSelect }) {
  const records = useMemo(() =>
    Object.values(lunchRecords)
      .filter(r => r.className === selClass && r.academicYear === academicYear)
      .sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month),
    [lunchRecords, selClass, academicYear]
  );
  if (records.length === 0) return null;
  return (
    <div style={{ marginTop:'1.25rem', padding:'.75rem 1rem', background:'#fffbeb', borderRadius:'12px', border:'1px solid #fde68a' }}>
      <div style={{ fontSize:'.75rem', fontWeight:800, color:'#78350f', marginBottom:'.5rem' }}>
        📅 ประวัติการรับประทานอาหารกลางวัน — ห้อง {selClass} ปีการศึกษา {academicYear}
      </div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:'.35rem' }}>
        {records.map(r => {
          const active = r.year === selYear && r.month === selMonth;
          return (
            <button key={r.id} type="button" onClick={() => onSelect(r.year, r.month)}
              style={{
                padding:'.25rem .7rem', borderRadius:'8px', fontFamily:'inherit', cursor:'pointer',
                fontSize:'.75rem', fontWeight: active ? 800 : 500,
                background: active ? '#d97706' : 'white',
                color: active ? 'white' : '#374151',
                border: `1.5px solid ${active ? '#d97706' : '#fde68a'}`,
              }}>
              {THAI_MONTHS_SHORT[r.month]} {r.year}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Style helpers ─────────────────────────────────────────────────────────────
function th(extra = {}) {
  return { border:'1px solid #d1d5db', padding:'3px 2px', background:'#f9fafb', fontWeight:700, fontSize:'.7rem', ...extra };
}
const lbl = { fontSize:'.72rem', fontWeight:700, color:'#78350f', display:'block', marginBottom:'.2rem' };
