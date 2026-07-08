import { useState, useMemo, useCallback } from 'react';
import { useApp } from '../../context/AppContext';

// H  = ดื่มนม
// X  = ไม่มาเรียน / ขาด
// '' = ว่าง (วันหยุด / ยังไม่บันทึก)
const CYCLE = ['', 'H', 'X'];

const CELL_STYLE = {
  H:  { bg: '#dbeafe', color: '#1e40af', fw: 800 }, // ฟ้าอ่อน = ดื่มนม
  X:  { bg: '#f3f4f6', color: '#9ca3af', fw: 700 }, // เทา = ไม่มาเรียน
  '': { bg: 'white',   color: '#d1d5db', fw: 400 },
};

const DOW_SHORT   = ['อา','จ','อ','พ','พฤ','ศ','ส'];
const THAI_MONTHS = ['','มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
  'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
const THAI_MONTHS_SHORT = ['','ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];

function daysInMonth(thaiYear, month) { return new Date(thaiYear - 543, month, 0).getDate(); }
function getDow(thaiYear, month, day) { return new Date(thaiYear - 543, month - 1, day).getDay(); }
function isWeekend(thaiYear, month, day) { const d = getDow(thaiYear, month, day); return d === 0 || d === 6; }
function recKey(className, academicYear, year, month) {
  return `${className}__${academicYear}__${year}-${String(month).padStart(2, '0')}`;
}
function nextSym(cur) { const i = CYCLE.indexOf(cur ?? ''); return CYCLE[(i + 1) % CYCLE.length]; }
function countH(days) { return Object.values(days ?? {}).filter(v => v === 'H').length; }

export default function MilkTab({ teacherClassFilter = null }) {
  const {
    students, classes, teachers, role, user,
    academicYear, schoolLogo,
    milkRecords, setMilkRecords,
  } = useApp();

  const isTeacher = role === 'teacher';
  const myClass   = teacherClassFilter ?? (isTeacher ? user?.className : null);

  const now = new Date();
  const [selClass,   setSelClass]   = useState(() => myClass ?? (classes[0]?.name ?? ''));
  const [selYear,    setSelYear]    = useState(now.getFullYear() + 543);
  const [selMonth,   setSelMonth]   = useState(now.getMonth() + 1);
  const [schoolDays, setSchoolDays] = useState(20);
  const [saved, setSaved] = useState(false);

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
    const ex = milkRecords[key];
    return ex ?? { id: key, className: selClass, academicYear, year: selYear, month: selMonth, schoolDays: 20, students: {} };
  });

  const switchRecord = useCallback((cls, yr, mo) => {
    const k = recKey(cls, academicYear, yr, mo);
    const ex = milkRecords[k];
    const rec = ex ?? { id: k, className: cls, academicYear, year: yr, month: mo, schoolDays: 20, students: {} };
    setDraft(rec);
    setSchoolDays(rec.schoolDays ?? 20);
    setSaved(false);
  }, [milkRecords, academicYear]);

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

  function markAllH(day) {
    setSaved(false);
    setDraft(prev => {
      const updated = { ...prev.students };
      classStudents.forEach(s => {
        const sData = updated[s.id] ?? { days: {} };
        updated[s.id] = { ...sData, days: { ...(sData.days ?? {}), [day]: 'H' } };
      });
      return { ...prev, students: updated };
    });
  }

  function handleSave() {
    setMilkRecords(prev => ({ ...prev, [key]: { ...draft, schoolDays } }));
    setSaved(true);
  }

  function handleClear() {
    if (!window.confirm(`ล้างข้อมูลดื่มนม ${THAI_MONTHS[selMonth]} ${selYear} ห้อง ${selClass}?`)) return;
    const blank = { id: key, className: selClass, academicYear, year: selYear, month: selMonth, schoolDays, students: {} };
    setDraft(blank);
    setMilkRecords(prev => { const n = { ...prev }; delete n[key]; return n; });
    setSaved(false);
  }

  const teacherName = useMemo(() => {
    if (isTeacher) return user?.name ?? '';
    const t = teachers.find(t => t.className === selClass);
    return t?.name ?? '';
  }, [isTeacher, user, teachers, selClass]);

  const daySummary = useMemo(() =>
    dayArr.map(d => classStudents.filter(s => draft.students[s.id]?.days?.[d] === 'H').length),
    [draft, classStudents, dayArr]
  );

  function handlePrint() {
    const thRow1 = dayArr.map(d => {
      const wknd = isWeekend(selYear, selMonth, d);
      return `<th class="${wknd?'wknd':'hdc'}">${d}</th>`;
    }).join('');
    const thRow2 = dayArr.map(d => {
      const wknd = isWeekend(selYear, selMonth, d);
      const dow  = getDow(selYear, selMonth, d);
      return `<th class="${wknd?'wknd':'hdc2'}">${DOW_SHORT[dow]}</th>`;
    }).join('');
    const rows = classStudents.map((s, idx) => {
      const sData = draft.students[s.id] ?? { days: {} };
      const cells = dayArr.map(d => {
        const v    = sData.days?.[d] ?? '';
        const wknd = isWeekend(selYear, selMonth, d);
        const cls  = wknd ? 'wknd' : v === 'H' ? 'milk' : v === 'X' ? 'abs' : '';
        return `<td class="${cls}">${v}</td>`;
      }).join('');
      const total = countH(sData.days);
      const nameShort = s.name.replace('เด็กชาย','ด.ช.').replace('เด็กหญิง','ด.ญ.');
      return `<tr><td class="no">${idx+1}</td><td class="name">${nameShort}</td>${cells}<td class="tot">${total||''}</td></tr>`;
    }).join('');
    const footRow = dayArr.map((d, i) => {
      const wknd = isWeekend(selYear, selMonth, d);
      const cnt  = daySummary[i];
      return `<td class="footd">${!wknd && cnt > 0 ? cnt : ''}</td>`;
    }).join('');

    const win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>บันทึกการดื่มนม</title>
<style>
  @page { size: A4 landscape; margin: 8mm }
  body { font-family: 'TH Sarabun New', Sarabun, sans-serif; font-size: 10pt }
  h3, h4 { text-align: center; margin: 2px 0 }
  h3 { font-size: 13pt }
  h4 { font-size: 10pt; font-weight: normal }
  table { border-collapse: collapse; width: 100% }
  td, th { border: 1px solid #555; padding: 1px 2px; text-align: center; font-size: 7.5pt }
  .no  { min-width: 18px; font-weight: bold }
  .name{ text-align: left; padding-left: 4px; min-width: 90px; font-weight: 600 }
  .tot { min-width: 20px; font-weight: bold; background: #dbeafe }
  .hdc { background: #dbeafe; min-width: 16px }
  .hdc2{ background: #bfdbfe; font-size: 7pt; color: #1e3a8a }
  .wknd{ background: #e5e7eb; color: #9ca3af; min-width: 16px }
  .milk{ background: #dbeafe; color: #1e40af; font-weight: 800 }
  .abs { background: #f3f4f6; color: #9ca3af }
  .footd{ background: #eff6ff; color: #1e40af; font-weight: 700 }
  .sig  { margin-top: 14px; display: flex; justify-content: space-between; font-size: 9pt; line-height: 2 }
</style></head><body>
${schoolLogo ? `<div style="text-align:center;margin-bottom:4px"><img src="${schoolLogo}" style="height:70px;object-fit:contain"/></div>` : ''}
<h3>บันทึกการดื่มนม</h3>
<h4>เดือน ${THAI_MONTHS[selMonth]} พ.ศ. ${selYear} &nbsp;&nbsp;&nbsp; เวลาเรียนในรอบเดือน ${schoolDays} วัน</h4>
<h4>ชั้น${selClass} &nbsp; ครู ${teacherName || '.........................'} &nbsp; จำนวน ${classStudents.length} คน</h4>
<br/>
<table>
  <thead>
    <tr>
      <th rowspan="2" style="background:#dbeafe;font-weight:bold">เลขที่</th>
      <th rowspan="2" class="hd" style="text-align:left;padding-left:4px">ชื่อ-นามสกุล</th>
      ${thRow1}
      <th rowspan="2" style="background:#bfdbfe;font-weight:800">รวม<br/>เวลา</th>
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

  return (
    <div className="glass p-6 animate-fade">
      <div className="page-header mb-4">
        <h3>🥛 บันทึกการดื่มนม</h3>
      </div>

      {/* Controls */}
      <div style={{
        display:'flex', flexWrap:'wrap', gap:'.75rem', alignItems:'flex-end',
        background:'#eff6ff', borderRadius:'12px', padding:'.75rem 1rem',
        border:'1px solid #bfdbfe', marginBottom:'1rem',
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
        <div style={{ marginLeft:'auto', textAlign:'right', fontSize:'.72rem', color:'#1e40af' }}>
          <div>ห้อง <strong>{selClass}</strong> · {classStudents.length} คน</div>
          {teacherName && <div>ครู {teacherName}</div>}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display:'flex', gap:'.5rem', flexWrap:'wrap', marginBottom:'.75rem', fontSize:'.72rem', alignItems:'center' }}>
        {[
          ['H','ดื่มนม','#dbeafe','#1e40af'],
          ['X','ไม่มาเรียน','#f3f4f6','#9ca3af'],
          ['—','วันหยุด/ไม่บันทึก','white','#d1d5db'],
        ].map(([sym, label, bg, color]) => (
          <span key={sym} style={{ background:bg, color, fontWeight:700, padding:'2px 8px', borderRadius:'6px', border:'1px solid rgba(0,0,0,.07)' }}>
            {sym} {label}
          </span>
        ))}
        <span style={{ color:'#6b7280' }}>คลิก = วนสถานะ · ดับเบิลคลิกหัวคอลัมน์ = H ทั้งห้อง</span>
      </div>

      {/* Table */}
      {classStudents.length === 0 ? (
        <div style={{ textAlign:'center', color:'#9ca3af', padding:'3rem' }}>ไม่พบนักเรียนในห้อง {selClass}</div>
      ) : (
        <div style={{ overflowX:'auto' }}>
          <table style={{ borderCollapse:'collapse', fontSize:'.72rem' }}>
            <thead>
              <tr>
                <th rowSpan={2} style={th({ minWidth:'32px', background:'#dbeafe', color:'#1e40af' })}>เลขที่</th>
                <th rowSpan={2} style={th({ minWidth:'110px', textAlign:'left', padding:'2px 6px', background:'#dbeafe', color:'#1e40af' })}>ชื่อ-นามสกุล</th>
                {dayArr.map(d => {
                  const wknd = isWeekend(selYear, selMonth, d);
                  return (
                    <th key={d}
                      onDoubleClick={() => !wknd && markAllH(d)}
                      title={wknd ? '' : 'ดับเบิลคลิกเพื่อ H ทุกคน'}
                      style={{
                        ...th({ minWidth:'22px', maxWidth:'26px', fontSize:'.65rem' }),
                        background: wknd ? '#e5e7eb' : '#dbeafe',
                        color: wknd ? '#9ca3af' : '#1e40af',
                        cursor: wknd ? 'default' : 'pointer',
                      }}>
                      {d}
                    </th>
                  );
                })}
                <th rowSpan={2} style={th({ minWidth:'32px', background:'#bfdbfe', color:'#1e3a8a', fontWeight:800 })}>รวม<br/>เวลา</th>
              </tr>
              <tr>
                {dayArr.map(d => {
                  const wknd = isWeekend(selYear, selMonth, d);
                  const dow  = getDow(selYear, selMonth, d);
                  return (
                    <th key={d} style={{
                      ...th({ fontSize:'.6rem', padding:'1px' }),
                      background: wknd ? '#e5e7eb' : '#bfdbfe',
                      color: wknd ? '#9ca3af' : '#1e3a8a',
                    }}>
                      {DOW_SHORT[dow]}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {classStudents.map((s, idx) => {
                const sData = draft.students[s.id] ?? { days: {} };
                const total = countH(sData.days);
                return (
                  <tr key={s.id} style={{ background: idx%2===0 ? 'white' : '#f8fbff' }}>
                    <td style={{ textAlign:'center', border:'1px solid #e5e7eb', padding:'2px', color:'#6b7280', fontWeight:700 }}>{idx+1}</td>
                    <td style={{ border:'1px solid #e5e7eb', padding:'2px 6px', fontWeight:600, fontSize:'.72rem', whiteSpace:'nowrap' }}>
                      {s.name.replace('เด็กชาย','ด.ช.').replace('เด็กหญิง','ด.ญ.')}
                    </td>
                    {dayArr.map(d => {
                      const v    = sData.days?.[d] ?? '';
                      const wknd = isWeekend(selYear, selMonth, d);
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
                      background: total >= schoolDays ? '#d1fae5' : total > 0 ? '#dbeafe' : 'white',
                      color: total >= schoolDays ? '#065f46' : total > 0 ? '#1e40af' : '#d1d5db',
                    }}>
                      {total > 0 ? total : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background:'#eff6ff' }}>
                <td style={{ border:'1px solid #d1d5db', textAlign:'center', fontWeight:800, fontSize:'.65rem', color:'#1e40af' }}>รวม</td>
                <td style={{ border:'1px solid #d1d5db' }} />
                {daySummary.map((cnt, i) => {
                  const wknd = isWeekend(selYear, selMonth, i + 1);
                  return (
                    <td key={i} style={{
                      border:'1px solid #d1d5db', textAlign:'center', fontSize:'.65rem',
                      fontWeight: cnt > 0 ? 800 : 400,
                      color: cnt === classStudents.length ? '#065f46' : cnt > 0 ? '#1e40af' : '#d1d5db',
                      background: wknd ? '#e5e7eb' : cnt > 0 ? '#dbeafe' : 'white',
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

      {/* Actions */}
      <div style={{ display:'flex', gap:'.6rem', marginTop:'1rem', flexWrap:'wrap', alignItems:'center' }}>
        <button className="btn btn-primary" onClick={handleSave}>💾 บันทึก</button>
        <button className="btn btn-secondary" onClick={handlePrint}>🖨️ พิมพ์แบบฟอร์ม</button>
        <button type="button" onClick={handleClear}
          style={{ padding:'.35rem .9rem', borderRadius:'8px', border:'1px solid #fca5a5', background:'#fff5f5', color:'#dc2626', fontFamily:'inherit', fontSize:'.8rem', cursor:'pointer' }}>
          🗑️ ล้างข้อมูลเดือนนี้
        </button>
        {saved && <span style={{ color:'#059669', fontWeight:700, fontSize:'.82rem' }}>✅ บันทึกแล้ว</span>}
        <div style={{ marginLeft:'auto', fontSize:'.72rem', color:'#1e40af', textAlign:'right' }}>
          ดื่มนมครบ {classStudents.filter(s => countH(draft.students[s.id]?.days) >= schoolDays).length} คน
          · มีข้อมูล {classStudents.filter(s => countH(draft.students[s.id]?.days) > 0).length} คน
        </div>
      </div>

      <MonthHistory
        milkRecords={milkRecords}
        selClass={selClass}
        academicYear={academicYear}
        selYear={selYear}
        selMonth={selMonth}
        onSelect={(yr, mo) => { handleYearChange(yr); handleMonthChange(mo); }}
      />
    </div>
  );
}

function MonthHistory({ milkRecords, selClass, academicYear, selYear, selMonth, onSelect }) {
  const records = useMemo(() =>
    Object.values(milkRecords)
      .filter(r => r.className === selClass && r.academicYear === academicYear)
      .sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month),
    [milkRecords, selClass, academicYear]
  );
  if (records.length === 0) return null;
  return (
    <div style={{ marginTop:'1.25rem', padding:'.75rem 1rem', background:'#eff6ff', borderRadius:'12px', border:'1px solid #bfdbfe' }}>
      <div style={{ fontSize:'.75rem', fontWeight:800, color:'#1e40af', marginBottom:'.5rem' }}>
        📅 ประวัติการดื่มนม — ห้อง {selClass} ปีการศึกษา {academicYear}
      </div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:'.35rem' }}>
        {records.map(r => {
          const active = r.year === selYear && r.month === selMonth;
          const MONTHS_SHORT = ['','ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
          return (
            <button key={r.id} type="button" onClick={() => onSelect(r.year, r.month)}
              style={{
                padding:'.25rem .7rem', borderRadius:'8px', fontFamily:'inherit', cursor:'pointer',
                fontSize:'.75rem', fontWeight: active ? 800 : 500,
                background: active ? '#1d4ed8' : 'white',
                color: active ? 'white' : '#374151',
                border: `1.5px solid ${active ? '#1d4ed8' : '#bfdbfe'}`,
              }}>
              {MONTHS_SHORT[r.month]} {r.year}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function th(extra = {}) {
  return { border:'1px solid #d1d5db', padding:'3px 2px', background:'#f9fafb', fontWeight:700, fontSize:'.7rem', ...extra };
}
const lbl = { fontSize:'.72rem', fontWeight:700, color:'#1e40af', display:'block', marginBottom:'.2rem' };
