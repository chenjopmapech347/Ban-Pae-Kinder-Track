import { useState, useMemo, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import Modal, { ModalCancelBtn, ModalConfirmBtn } from '../Modal';
import { WHO_W_A, WHO_H_A, nearestKey, calcWHResult } from '../GrowthReferencePanel';

// ── ฟังก์ชันคำนวณโภชนาการ (กรมอนามัย ±1.5SD) ────────────────────────────────
function calcWeightAge(weight, ageYear, ageMonth, gender) {
  const k = nearestKey(ageYear, ageMonth);
  const ref = WHO_W_A[k]; if (!ref) return '';
  const [mb, sb, mg, sg] = ref;
  const [med, sd] = gender === 'ชาย' ? [mb, sb] : [mg, sg];
  const z = (weight - med) / sd;
  if (z < -2)   return 'น้ำหนักน้อยกว่าเกณฑ์';
  if (z < -1.5) return 'น้ำหนักค่อนข้างน้อย';
  if (z <= 1.5) return 'น้ำหนักตามเกณฑ์';
  if (z <= 2)   return 'น้ำหนักค่อนข้างมาก';
  return 'น้ำหนักมากกว่าเกณฑ์';
}
function calcHeightAge(height, ageYear, ageMonth, gender) {
  const k = nearestKey(ageYear, ageMonth);
  const ref = WHO_H_A[k]; if (!ref) return '';
  const [mb, sb, mg, sg] = ref;
  const [med, sd] = gender === 'ชาย' ? [mb, sb] : [mg, sg];
  const z = (height - med) / sd;
  if (z < -2)   return 'เตี้ย';
  if (z < -1.5) return 'ค่อนข้างเตี้ย';
  if (z <= 1.5) return 'ส่วนสูงตามเกณฑ์';
  if (z <= 2)   return 'ค่อนข้างสูง';
  return 'สูง';
}
function calcWeightHeight(weight, height, gender) {
  return calcWHResult(weight, height, gender);
}
function genderOf(student) {
  if (student.gender) return student.gender;
  if (student.name?.includes('ชาย')) return 'ชาย';
  if (student.name?.includes('หญิง')) return 'หญิง';
  return 'ชาย';
}

// ── สัญลักษณ์การบันทึก ────────────────────────────────────────────────────────
// √  = มาเรียนปกติ
// C  = มาเรียน + อาการหวัด/ไข้ (โรคทั่วไป)
// H  = มาเรียน + อาการมือเท้าปาก
// D  = มาเรียน + อุจจาระร่วง
// X  = ไม่มาเรียน
// '' = ว่าง (วันหยุด / ยังไม่บันทึก)

const SYMBOLS = ['', '√', 'X', 'C', 'H', 'D'];

// วงจรคลิก: ว่าง → √ → X → C → H → D → ว่าง
function nextSymbol(current) {
  const i = SYMBOLS.indexOf(current ?? '');
  return SYMBOLS[(i + 1) % SYMBOLS.length];
}

// สีพื้นหลังตามสัญลักษณ์
const SYM_STYLE = {
  '':  { bg: 'white',   color: '#d1d5db', fw: 400 },
  '√': { bg: '#d1fae5', color: '#065f46', fw: 700 },
  'X': { bg: '#f3f4f6', color: '#9ca3af', fw: 700 },
  'C': { bg: '#fef3c7', color: '#92400e', fw: 800 },
  'H': { bg: '#fee2e2', color: '#991b1b', fw: 800 },
  'D': { bg: '#ede9fe', color: '#5b21b6', fw: 800 },
};

// ชื่อเดือนภาษาไทย
const THAI_MONTHS = ['', 'มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
  'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];

// จำนวนวันในเดือน
function daysInMonth(year, month) {
  return new Date(year - 543, month, 0).getDate(); // year เป็นพ.ศ. → ค.ศ. = year-543
}

// Record key
function recKey(className, academicYear, year, month) {
  return `${className}__${academicYear}__${year}-${String(month).padStart(2, '0')}`;
}

// Empty day entry
function emptyDay() {
  return { v: '', sep: 0, home: false, fam: false, note: '' };
}

// Default day entry — √ มาเรียนปกติ
function defaultDay() {
  return { v: '√', sep: 0, home: false, fam: false, note: '' };
}

// สร้าง record เปล่า (ตารางว่าง — ครูกด checkbox เลือกเอง)
function makeDefaultRecord(k, cls, ay, yr, mo) {
  return { id: k, className: cls, academicYear: ay, year: yr, month: mo, students: {} };
}

// นับวันป่วย
function countSick(days) {
  return Object.values(days ?? {}).filter(d => ['C','H','D'].includes(d?.v)).length;
}

// นับวันมาเรียน
function countPresent(days) {
  return Object.values(days ?? {}).filter(d => d?.v === '√' || ['C','H','D'].includes(d?.v)).length;
}

// ── DayCell ───────────────────────────────────────────────────────────────────
function DayCell({ value, onCycle, onDetail, isWeekend }) {
  const sym = value?.v ?? '';
  const style = SYM_STYLE[sym] ?? SYM_STYLE[''];
  return (
    <td
      onClick={onCycle}
      onContextMenu={e => { e.preventDefault(); onDetail(); }}
      title={sym ? `${sym} — คลิกขวาเพื่อแก้ไขรายละเอียด` : 'คลิกเพื่อบันทึก'}
      style={{
        textAlign: 'center', cursor: 'pointer', userSelect: 'none',
        border: '1px solid #e5e7eb',
        minWidth: '24px', maxWidth: '28px', padding: '3px 1px',
        background: isWeekend ? '#f9fafb' : (style.bg),
        color: isWeekend ? '#d1d5db' : style.color,
        fontWeight: style.fw, fontSize: '.72rem',
        position: 'relative',
      }}
    >
      {sym || (isWeekend ? '' : '·')}
      {value?.fam  && <span style={{ position:'absolute', top:0, right:'1px', fontSize:'.55rem', color:'#e11d48' }}>*</span>}
      {value?.home && <span style={{ position:'absolute', bottom:0, right:'1px', fontSize:'.55rem', color:'#0891b2' }}>○</span>}
    </td>
  );
}

// ── DayDetailModal ────────────────────────────────────────────────────────────
function DayDetailModal({ studentName, day, month, year, entry, onSave, onClose }) {
  const [local, setLocal] = useState({ ...emptyDay(), ...entry });

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={studentName}
      subtitle={`วันที่ ${day} ${THAI_MONTHS[month]} ${year}`}
      size="sm"
    >
      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
        {/* สถานะ */}
        <div>
          <label style={lbl}>สถานะ</label>
          <div style={{ display:'flex', gap:'.35rem', flexWrap:'wrap' }}>
            {SYMBOLS.map(s => (
              <button key={s || 'blank'} type="button" onClick={() => setLocal(p=>({...p,v:s}))}
                style={{
                  padding:'.25rem .65rem', borderRadius:'8px', fontFamily:'inherit', cursor:'pointer',
                  fontWeight: local.v === s ? 800 : 500, fontSize:'.82rem',
                  background: local.v === s ? (SYM_STYLE[s]?.bg || '#f3f4f6') : 'white',
                  color: local.v === s ? (SYM_STYLE[s]?.color || '#374151') : '#6b7280',
                  border: `1.5px solid ${local.v === s ? (SYM_STYLE[s]?.color || '#9ca3af') : '#e5e7eb'}`,
                }}>
                {s || '—'}
              </button>
            ))}
          </div>
        </div>

        {/* การแยกเด็ก (แสดงเฉพาะตอนป่วย C/H/D) */}
        {['C','H','D'].includes(local.v) && (
          <div>
            <label style={lbl}>การแยกเด็กป่วย</label>
            <div style={{ display:'flex', gap:'.35rem' }}>
              {[[0,'ไม่แยก'],[1,'แยกนอนที่ห้อง'],[2,'ส่งกลับบ้าน']].map(([v,label]) => (
                <button key={v} type="button" onClick={() => setLocal(p=>({...p,sep:v}))}
                  style={{
                    padding:'.2rem .6rem', borderRadius:'7px', fontFamily:'inherit', cursor:'pointer',
                    fontSize:'.75rem', fontWeight: local.sep===v ? 700 : 400,
                    background: local.sep===v ? '#0891b2' : 'white',
                    color: local.sep===v ? 'white' : '#6b7280',
                    border: `1px solid ${local.sep===v ? '#0891b2' : '#e5e7eb'}`,
                  }}>
                  {v}: {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Checkboxes */}
        <div style={{ display:'flex', gap:'1rem' }}>
          <label style={{ display:'flex', alignItems:'center', gap:'.4rem', cursor:'pointer', fontSize:'.8rem' }}>
            <input type="checkbox" checked={local.home}
              onChange={e => setLocal(p=>({...p,home:e.target.checked}))} />
            ○ รักษามาจากบ้าน
          </label>
          <label style={{ display:'flex', alignItems:'center', gap:'.4rem', cursor:'pointer', fontSize:'.8rem' }}>
            <input type="checkbox" checked={local.fam}
              onChange={e => setLocal(p=>({...p,fam:e.target.checked}))} />
            * คนในบ้านป่วยด้วย
          </label>
        </div>

        {/* หมายเหตุ */}
        <div>
          <label style={lbl}>หมายเหตุ</label>
          <input type="text" className="input" value={local.note}
            onChange={e => setLocal(p=>({...p,note:e.target.value}))}
            placeholder="เช่น กลับเขมร, กลับต่างจังหวัด"
            style={{ fontSize:'.8rem', width:'100%' }} />
        </div>

        <div style={{ display:'flex', gap:'.5rem' }}>
          <ModalCancelBtn onClick={onClose} />
          <ModalConfirmBtn onClick={() => { onSave(local); onClose(); }} label="บันทึก" />
        </div>
      </div>
    </Modal>
  );
}

// ── IllnessCheckTab ───────────────────────────────────────────────────────────
export default function IllnessCheckTab({ teacherClassFilter = null }) {
  const {
    students, classes, teachers, role, user,
    academicYear, schoolName, schoolLogo,
    illnessCheckRecords, setIllnessCheckRecords,
    nutritionRecords,
  } = useApp();

  const isTeacher = role === 'teacher';
  const myClass   = teacherClassFilter ?? (isTeacher ? user?.className : null);

  const now = new Date();
  const currentThaiYear  = now.getFullYear() + 543;
  const currentMonth     = now.getMonth() + 1;

  const [selClass, setSelClass] = useState(() => myClass ?? (classes[0]?.name ?? ''));
  const [selYear,  setSelYear]  = useState(currentThaiYear);
  const [selMonth, setSelMonth] = useState(currentMonth);
  const [saved,    setSaved]    = useState(false);

  // Modal state
  const [modal, setModal] = useState(null); // { studentId, studentName, day }

  const key     = useMemo(() => recKey(selClass, academicYear, selYear, selMonth), [selClass, academicYear, selYear, selMonth]);
  const numDays = useMemo(() => daysInMonth(selYear, selMonth), [selYear, selMonth]);

  // วันในสัปดาห์ของวันที่ 1 (0=อาทิตย์)
  const firstDow = useMemo(() => new Date(selYear - 543, selMonth - 1, 1).getDay(), [selYear, selMonth]);
  const isWeekend = (day) => {
    const dow = (firstDow + day - 1) % 7;
    return dow === 0 || dow === 6;
  };

  const classStudents = useMemo(() =>
    students
      .filter(s => s.className === selClass && !s.name.startsWith('(ว่าง)'))
      .sort((a, b) => Number(a.id) - Number(b.id)),
    [students, selClass]
  );

  // ── ดึงน้ำหนัก/ส่วนสูงล่าสุดของแต่ละคนจาก nutritionRecords ──
  // NutritionTab เป็น source of truth; IllnessCheck แสดง read-only
  const latestMeasures = useMemo(() => {
    const prefix = `${selClass}__${academicYear}__`;
    // เรียงตาม key ลดลง (key มี ISO date → ล่าสุดมาก่อน)
    const sorted = Object.entries(nutritionRecords)
      .filter(([k]) => k.startsWith(prefix))
      .sort(([a], [b]) => b.localeCompare(a));

    const measures = {};
    classStudents.forEach(s => {
      for (const [, rec] of sorted) {
        const sData = rec.students?.[String(s.id)];
        if (sData && (Number(sData.weight) > 0 || Number(sData.height) > 0)) {
          measures[String(s.id)] = {
            weight: sData.weight ?? 0,
            height: sData.height ?? 0,
            date:   rec.assessmentDate ?? '',
          };
          break;
        }
      }
    });
    return measures;
  }, [nutritionRecords, selClass, academicYear, classStudents]);

  // โหลด/สร้าง draft
  const [draft, setDraft] = useState(() => {
    const ex = illnessCheckRecords[key];
    if (ex) return ex;
    return makeDefaultRecord(key, selClass, academicYear, selYear, selMonth);
  });

  // sync draft เมื่อ key เปลี่ยน
  const switchRecord = useCallback((cls, yr, mo) => {
    const k = recKey(cls, academicYear, yr, mo);
    const ex = illnessCheckRecords[k];
    setDraft(ex ?? makeDefaultRecord(k, cls, academicYear, yr, mo));
    setSaved(false);
  }, [illnessCheckRecords, academicYear]);

  function handleClassChange(cls) { setSelClass(cls); switchRecord(cls, selYear, selMonth); }
  function handleYearChange(yr)   { const y=Number(yr); setSelYear(y);  switchRecord(selClass, y, selMonth); }
  function handleMonthChange(mo)  { const m=Number(mo); setSelMonth(m); switchRecord(selClass, selYear, m); }

  // คลิก cell วน symbol
  function cycleCell(studentId, day) {
    setSaved(false);
    setDraft(prev => {
      const sData = prev.students[studentId] ?? { days: {}, weight: 0, height: 0 };
      const cur   = sData.days?.[day] ?? emptyDay();
      const next  = { ...cur, v: nextSymbol(cur.v) };
      return {
        ...prev,
        students: {
          ...prev.students,
          [studentId]: { ...sData, days: { ...(sData.days ?? {}), [day]: next } },
        },
      };
    });
  }

  // กด checkbox บนหัวตาราง → เลือก/ยกเลิก √ ทุกคนในคอลัมน์วันนั้น
  function toggleDayColumn(day) {
    if (isWeekend(day)) return;
    const allChecked = classStudents.length > 0 &&
      classStudents.every(s => draft.students[s.id]?.days?.[day]?.v === '√');
    setSaved(false);
    setDraft(prev => {
      const newStudents = { ...prev.students };
      classStudents.forEach(s => {
        const sData = newStudents[s.id] ?? { days: {}, weight: 0, height: 0 };
        const days = { ...(sData.days ?? {}) };
        days[day] = allChecked ? emptyDay() : defaultDay();
        newStudents[s.id] = { ...sData, days };
      });
      return { ...prev, students: newStudents };
    });
  }

  // บันทึกจาก modal
  function saveDetail(studentId, day, entry) {
    setSaved(false);
    setDraft(prev => {
      const sData = prev.students[studentId] ?? { days: {}, weight: 0, height: 0 };
      return {
        ...prev,
        students: {
          ...prev.students,
          [studentId]: { ...sData, days: { ...(sData.days ?? {}), [day]: entry } },
        },
      };
    });
  }


  function handleSave() {
    // 1. บันทึกคัดกรองอาการป่วย (เดิม)
    setIllnessCheckRecords(prev => ({ ...prev, [key]: draft }));
    setSaved(true);

    // หมายเหตุ: น้ำหนัก/ส่วนสูงอ่านมาจาก NutritionTab (ทิศทาง: Nutrition → IllnessCheck)
    // ไม่มีการเขียนกลับไปที่ nutritionRecords จากที่นี่
  }

  function handleClear() {
    if (!window.confirm(`ล้างข้อมูลคัดกรองอาการป่วย ${THAI_MONTHS[selMonth]} ${selYear} ห้อง ${selClass}?`)) return;
    const blank = { id: key, className: selClass, academicYear, year: selYear, month: selMonth, students: {} };
    setDraft(blank);
    setIllnessCheckRecords(prev => { const n={...prev}; delete n[key]; return n; });
    setSaved(false);
  }

  const teacherName = useMemo(() => {
    if (isTeacher) return user?.name ?? '';
    const t = teachers.find(t => t.className === selClass);
    return t?.name ?? '';
  }, [isTeacher, user, teachers, selClass]);

  // ── Print ────────────────────────────────────────────────────────────────────
  function handlePrint() {
    const days = Array.from({ length: numDays }, (_, i) => i + 1);
    const thDays = days.map(d => `<th class="${isWeekend(d)?'wknd':'hdc'}">${d}</th>`).join('');

    const rows = classStudents.map((s, idx) => {
      const sData     = draft.students[s.id] ?? { days:{} };
      const measure   = latestMeasures[String(s.id)];
      const dayCells = days.map(d => {
        const e = sData.days?.[d];
        const sym = e?.v ?? '';
        const wknd = isWeekend(d);
        const marks = (e?.fam?'*':'') + (e?.home?'○':'');
        const sepMark = e?.sep===2?'↑' : e?.sep===1?'_' : '';
        return `<td class="${wknd?'wknd':'dc'} ${sym==='√'?'pres':sym==='X'?'abs':sym?'sick':''}">${sym}${sepMark}${marks}</td>`;
      }).join('');
      const total = countPresent(sData.days);
      return `<tr>
        <td class="no">${idx+1}</td>
        <td class="nm">${s.name}</td>
        <td class="wt">${measure?.weight||''}</td>
        <td class="ht">${measure?.height||''}</td>
        ${dayCells}
        <td class="tot">${total||''}</td>
      </tr>`;
    }).join('');

    const win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>แบบคัดกรองอาการป่วยรายห้องเรียน</title>
<style>
  @page { size: A4 landscape; margin: 8mm }
  body { font-family: 'TH Sarabun New', Sarabun, sans-serif; font-size: 10pt }
  h3 { text-align: center; margin: 2px 0; font-size: 12pt }
  h4 { text-align: center; margin: 2px 0; font-size: 10pt; font-weight: normal }
  table { border-collapse: collapse; width: 100% }
  td, th { border: 1px solid #666; padding: 1px 2px; text-align: center; font-size: 7.5pt }
  .nm { text-align: left; min-width: 110px; font-size: 8pt }
  .no { min-width: 18px }
  .wt,.ht { min-width: 22px }
  .dc { min-width: 16px }
  .tot { min-width: 20px; font-weight: bold }
  .hd { background: #dbeafe; font-weight: bold }
  .hdc { background: #f1f5f9 }
  .wknd { background: #f3f4f6; color: #9ca3af }
  .pres { background: #d1fae5; color: #065f46; font-weight: bold }
  .abs  { background: #f9fafb; color: #9ca3af }
  .sick { background: #fef3c7; color: #92400e; font-weight: bold }
  .note { font-size: 8pt; margin-top: 10px }
  .sig  { margin-top: 16px; display: flex; justify-content: space-between; font-size: 9pt; line-height: 2 }
</style></head><body>
${schoolLogo ? `<div style="text-align:center;margin-bottom:4px"><img src="${schoolLogo}" style="height:70px;object-fit:contain"/></div>` : ''}
<h3>แบบคัดกรองอาการป่วยรายห้องเรียน</h3>
<h4>ห้อง ${selClass} &nbsp;|&nbsp; เดือน ${THAI_MONTHS[selMonth]} พ.ศ.${selYear} &nbsp;|&nbsp; ${schoolName || ''}</h4>
<h4>ครู/ผู้ดูแลเด็ก ${teacherName || '...................................'} &nbsp; จำนวนเด็กที่รับผิดชอบ ${classStudents.length} คน</h4>
<br/>
<table>
  <thead>
    <tr>
      <th rowspan="2" class="hd">ลำดับ</th>
      <th rowspan="2" class="hd">ชื่อ-สกุล</th>
      <th rowspan="2" class="hd">นน.</th>
      <th rowspan="2" class="hd">ส่วนสูง</th>
      <th colspan="${numDays}" class="hd">ประจำเดือน ${THAI_MONTHS[selMonth]} พ.ศ.${selYear}</th>
      <th rowspan="2" class="hd">รวม</th>
    </tr>
    <tr>${thDays}</tr>
  </thead>
  <tbody>${rows}</tbody>
</table>
<div class="note">
  <strong>หมายเหตุ:</strong> สัญลักษณ์ในการบันทึกข้อมูล<br/>
  ๑. โรคที่พบบ่อย: หวัด = C &nbsp; มือ เท้า ปาก = H &nbsp; อุจจาระร่วง = D &nbsp; √ = มาเรียนปกติ &nbsp; X = ไม่มาเรียน<br/>
  ๒. การแยกเด็กป่วย: ไม่แยก = 0 &nbsp; แยกนอนที่ห้อง = 1 (ขีดใต้สัญลักษณ์) &nbsp; ส่งกลับบ้าน = 2 (ลูกศรขึ้น)<br/>
  ๓. ○ = รักษามาจากบ้าน &nbsp; * = คนในบ้านป่วยด้วย
</div>
<div class="sig">
  <div>ลงชื่อ .............................................<br/>(${teacherName || '....................................'})<br/>ครูประจำชั้น${selClass}</div>
  <div>ลงชื่อ .............................................<br/>(...............................................)<br/>ผู้อำนวยการสถานศึกษา</div>
</div>
</body></html>`);
    win.document.close();
    win.print();
  }

  // ── Day columns (array 1..numDays) ──
  const dayArr = useMemo(() => Array.from({ length: numDays }, (_, i) => i + 1), [numDays]);

  // ── Summary row — นับรวมแต่ละวัน ──
  const daySummary = useMemo(() => {
    return dayArr.map(d => {
      const syms = classStudents.map(s => draft.students[s.id]?.days?.[d]?.v ?? '');
      return {
        present: syms.filter(v => v === '√' || ['C','H','D'].includes(v)).length,
        sick:    syms.filter(v => ['C','H','D'].includes(v)).length,
        absent:  syms.filter(v => v === 'X').length,
      };
    });
  }, [draft, classStudents, dayArr]);

  // ── แสดง modal ──
  const curModal = useMemo(() => {
    if (!modal) return null;
    const s = classStudents.find(s => s.id === modal.studentId);
    const sData = draft.students[modal.studentId] ?? { days:{} };
    return { ...modal, studentName: s?.name ?? '', entry: sData.days?.[modal.day] ?? emptyDay() };
  }, [modal, classStudents, draft]);

  return (
    <div className="glass p-6 animate-fade">
      <div className="page-header mb-4">
        <h3>🤒 แบบคัดกรองอาการป่วยรายห้องเรียน</h3>
      </div>

      {/* ── Controls ── */}
      <div style={{
        display:'flex', flexWrap:'wrap', gap:'.75rem', alignItems:'flex-end',
        background:'#f8fafc', borderRadius:'12px', padding:'.75rem 1rem',
        border:'1px solid #e2e8f0', marginBottom:'1rem',
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
            {THAI_MONTHS.slice(1).map((m,i) => <option key={i+1} value={i+1}>{m}</option>)}
          </select>
        </div>
        <div style={{ marginLeft:'auto', textAlign:'right', fontSize:'.72rem', color:'#6b7280' }}>
          <div>ห้อง <strong>{selClass}</strong> · {classStudents.length} คน</div>
          {teacherName && <div>ครู {teacherName}</div>}
        </div>
      </div>

      {/* ── Legend ── */}
      <div style={{ display:'flex', gap:'.4rem', flexWrap:'wrap', marginBottom:'.75rem', fontSize:'.7rem', alignItems:'center' }}>
        {[
          ['√','มาปกติ','#d1fae5','#065f46'],
          ['C','หวัด/ไข้','#fef3c7','#92400e'],
          ['H','มือเท้าปาก','#fee2e2','#991b1b'],
          ['D','อุจจาระร่วง','#ede9fe','#5b21b6'],
          ['X','ไม่มาเรียน','#f3f4f6','#9ca3af'],
        ].map(([sym,label,bg,color]) => (
          <span key={sym} style={{ background:bg, color, fontWeight:700, padding:'2px 8px', borderRadius:'6px', border:'1px solid rgba(0,0,0,.06)' }}>
            {sym} {label}
          </span>
        ))}
        <span style={{ color:'#6b7280', marginLeft:'.25rem' }}>คลิก = วนสถานะ · คลิกขวา = รายละเอียด (การแยก/หมายเหตุ)</span>
        <span style={{ color:'#0891b2', fontWeight:700 }}>○</span><span style={{ color:'#6b7280', fontSize:'.68rem' }}>รักษาจากบ้าน</span>
        <span style={{ color:'#e11d48', fontWeight:700 }}>*</span><span style={{ color:'#6b7280', fontSize:'.68rem' }}>คนในบ้านป่วยด้วย</span>
      </div>

      {/* ── Table ── */}
      {classStudents.length === 0 ? (
        <div style={{ textAlign:'center', color:'#9ca3af', padding:'3rem' }}>ไม่พบนักเรียนในห้อง {selClass}</div>
      ) : (
        <div style={{ overflowX:'auto' }}>
          <table style={{ borderCollapse:'collapse', fontSize:'.72rem' }}>
            <thead>
              {/* แถว 1: หัวตาราง */}
              <tr>
                <th rowSpan={2} style={th({ minWidth:'28px' })}>ที่</th>
                <th rowSpan={2} style={th({ minWidth:'160px', textAlign:'left' })}>ชื่อ-สกุล</th>
                <th rowSpan={2} style={th({ minWidth:'38px' })}>นน.</th>
                <th rowSpan={2} style={th({ minWidth:'44px' })}>ส่วนสูง</th>
                {dayArr.map(d => (
                  <th key={d} style={{
                    ...th({ minWidth:'28px', fontSize:'.68rem', padding:'2px 1px' }),
                    background: isWeekend(d) ? '#f3f4f6' : '#dbeafe',
                    color: isWeekend(d) ? '#9ca3af' : '#1e40af',
                  }}>{d}</th>
                ))}
                <th rowSpan={2} style={th({ minWidth:'30px', background:'#bfdbfe', color:'#1e40af', fontWeight:800 })}>รวม</th>
              </tr>
              {/* แถว 2: checkbox เลือกทั้งคอลัมน์ */}
              <tr>
                {dayArr.map(d => {
                  if (isWeekend(d)) return (
                    <td key={d} style={{ border:'1px solid #e5e7eb', background:'#f3f4f6', minWidth:'22px', padding:'1px' }} />
                  );
                  const allChecked = classStudents.length > 0 &&
                    classStudents.every(s => draft.students[s.id]?.days?.[d]?.v === '√');
                  return (
                    <td key={d}
                      onClick={() => toggleDayColumn(d)}
                      title={allChecked ? 'ยกเลิกทั้งคอลัมน์' : 'เลือก √ ทั้งคอลัมน์'}
                      style={{
                        textAlign:'center', cursor:'pointer', padding:'2px',
                        border:'1px solid #d1d5db', minWidth:'22px',
                        background: allChecked ? '#d1fae5' : '#f0f9ff',
                      }}>
                      <input
                        type="checkbox"
                        checked={allChecked}
                        onChange={() => toggleDayColumn(d)}
                        onClick={e => e.stopPropagation()}
                        style={{ cursor:'pointer', width:'11px', height:'11px', accentColor:'#059669' }}
                      />
                    </td>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {classStudents.map((s, idx) => {
                const sData = draft.students[s.id] ?? { days:{}, weight:0, height:0 };
                const total = countPresent(sData.days);
                return (
                  <tr key={s.id} style={{ background: idx%2===0 ? 'white' : '#fafafa' }}>
                    <td style={{ textAlign:'center', border:'1px solid #e5e7eb', padding:'2px', color:'#6b7280' }}>{idx+1}</td>
                    <td style={{ border:'1px solid #e5e7eb', padding:'2px 6px', whiteSpace:'nowrap' }}>{s.name}</td>
                    {/* นน. — อ่านจาก NutritionTab (read-only) */}
                    <td style={{ border:'1px solid #e5e7eb', padding:'1px 2px', textAlign:'center' }}
                        title={latestMeasures[String(s.id)]?.date ? `วัดเมื่อ ${latestMeasures[String(s.id)].date}` : 'ยังไม่มีข้อมูลน้ำหนัก'}>
                      <span style={{ fontSize:'.7rem', color: latestMeasures[String(s.id)]?.weight ? '#1e40af' : '#d1d5db' }}>
                        {latestMeasures[String(s.id)]?.weight || '—'}
                      </span>
                    </td>
                    {/* ส่วนสูง — อ่านจาก NutritionTab (read-only) */}
                    <td style={{ border:'1px solid #e5e7eb', padding:'1px 2px', textAlign:'center' }}
                        title={latestMeasures[String(s.id)]?.date ? `วัดเมื่อ ${latestMeasures[String(s.id)].date}` : 'ยังไม่มีข้อมูลส่วนสูง'}>
                      <span style={{ fontSize:'.7rem', color: latestMeasures[String(s.id)]?.height ? '#1e40af' : '#d1d5db' }}>
                        {latestMeasures[String(s.id)]?.height || '—'}
                      </span>
                    </td>
                    {/* วันที่ 1-31 */}
                    {dayArr.map(d => (
                      <DayCell
                        key={d}
                        value={sData.days?.[d]}
                        isWeekend={isWeekend(d)}
                        onCycle={() => cycleCell(s.id, d)}
                        onDetail={() => setModal({ studentId: s.id, day: d })}
                      />
                    ))}
                    {/* รวม */}
                    <td style={{
                      textAlign:'center', border:'1px solid #e5e7eb', fontWeight:800, fontSize:'.75rem',
                      background: total > 0 ? '#eff6ff' : 'white',
                      color: total > 0 ? '#1e40af' : '#d1d5db',
                    }}>
                      {total || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {/* Summary footer */}
            <tfoot>
              <tr style={{ background:'#f1f5f9' }}>
                <td colSpan={4} style={{ border:'1px solid #d1d5db', textAlign:'center', fontWeight:800, fontSize:'.68rem', color:'#475569', padding:'2px' }}>มาเรียน</td>
                {daySummary.map((ds, i) => (
                  <td key={i} style={{
                    border:'1px solid #d1d5db', textAlign:'center', fontSize:'.65rem', padding:'1px',
                    fontWeight:700, color: ds.present > 0 ? '#065f46' : '#d1d5db',
                    background: ds.present === classStudents.length ? '#d1fae5' : 'white',
                    minWidth:'26px',
                  }}>
                    {ds.present > 0 ? ds.present : ''}
                  </td>
                ))}
                <td style={{ border:'1px solid #d1d5db' }} />
              </tr>
              <tr style={{ background:'#fff1f2' }}>
                <td colSpan={4} style={{ border:'1px solid #d1d5db', textAlign:'center', fontWeight:800, fontSize:'.68rem', color:'#9f1239', padding:'2px' }}>ป่วย</td>
                {daySummary.map((ds, i) => (
                  <td key={i} style={{
                    border:'1px solid #d1d5db', textAlign:'center', fontSize:'.65rem', padding:'1px',
                    fontWeight:700, color: ds.sick > 0 ? '#991b1b' : '#d1d5db',
                    minWidth:'26px',
                    background: ds.sick > 0 ? '#fee2e2' : 'white',
                  }}>
                    {ds.sick > 0 ? ds.sick : ''}
                  </td>
                ))}
                <td style={{ border:'1px solid #d1d5db' }} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* ── Actions ── */}
      <div style={{ display:'flex', gap:'.6rem', marginTop:'1rem', flexWrap:'wrap', alignItems:'center' }}>
        <button className="btn btn-primary" onClick={handleSave}>💾 บันทึก</button>
        <button className="btn btn-secondary" onClick={handlePrint}>🖨️ พิมพ์แบบฟอร์ม</button>
        <button type="button" onClick={handleClear}
          style={{ padding:'.35rem .9rem', borderRadius:'8px', border:'1px solid #fca5a5', background:'#fff5f5', color:'#dc2626', fontFamily:'inherit', fontSize:'.8rem', cursor:'pointer' }}>
          🗑️ ล้างข้อมูลเดือนนี้
        </button>
        {saved && <span style={{ color:'#059669', fontWeight:700, fontSize:'.82rem' }}>✅ บันทึกแล้ว</span>}

        {/* สรุปเดือนนี้ */}
        <div style={{ marginLeft:'auto', fontSize:'.72rem', color:'#6b7280', textAlign:'right' }}>
          <span>มาเรียน {classStudents.filter(s => countPresent(draft.students[s.id]?.days)>0).length} คน มีข้อมูล · </span>
          <span style={{ color:'#991b1b' }}>ป่วย {classStudents.filter(s => countSick(draft.students[s.id]?.days)>0).length} คน</span>
        </div>
      </div>


      {/* ── Month History ── */}
      <MonthHistory
        illnessCheckRecords={illnessCheckRecords}
        selClass={selClass}
        academicYear={academicYear}
        selYear={selYear}
        selMonth={selMonth}
        onSelect={(yr, mo) => { handleYearChange(yr); handleMonthChange(mo); }}
      />

      {/* ── Modal ── */}
      {curModal && (
        <DayDetailModal
          studentName={curModal.studentName}
          day={curModal.day}
          month={selMonth}
          year={selYear}
          entry={curModal.entry}
          onSave={entry => saveDetail(curModal.studentId, curModal.day, entry)}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

// ── MonthHistory ──────────────────────────────────────────────────────────────
function MonthHistory({ illnessCheckRecords, selClass, academicYear, selYear, selMonth, onSelect }) {
  const records = useMemo(() =>
    Object.values(illnessCheckRecords)
      .filter(r => r.className === selClass && r.academicYear === academicYear)
      .sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month),
    [illnessCheckRecords, selClass, academicYear]
  );
  if (records.length === 0) return null;
  return (
    <div style={{ marginTop:'1.25rem', padding:'.75rem 1rem', background:'#f8fafc', borderRadius:'12px', border:'1px solid #e2e8f0' }}>
      <div style={{ fontSize:'.75rem', fontWeight:800, color:'#475569', marginBottom:'.5rem' }}>
        📅 ประวัติการคัดกรอง — ห้อง {selClass} ปีการศึกษา {academicYear}
      </div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:'.35rem' }}>
        {records.map(r => {
          const active = r.year === selYear && r.month === selMonth;
          const sickCount = Object.values(r.students ?? {}).reduce((n, s) => n + countSick(s.days), 0);
          return (
            <button key={r.id} type="button" onClick={() => onSelect(r.year, r.month)}
              style={{
                padding:'.25rem .7rem', borderRadius:'8px', fontFamily:'inherit', cursor:'pointer',
                fontSize:'.75rem', fontWeight: active ? 800 : 500,
                background: active ? '#e11d48' : 'white',
                color: active ? 'white' : '#374151',
                border: `1.5px solid ${active ? '#e11d48' : '#e5e7eb'}`,
              }}>
              {THAI_MONTHS[r.month]} {r.year}
              {sickCount > 0 && <span style={{ marginLeft:'.3rem', fontSize:'.65rem', opacity:.8 }}>🤒{sickCount}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Style helpers ─────────────────────────────────────────────────────────────
function th(extra = {}) {
  return { border:'1px solid #d1d5db', padding:'3px 3px', background:'#f9fafb', fontWeight:700, fontSize:'.7rem', ...extra };
}
const lbl = { fontSize:'.72rem', fontWeight:700, color:'#475569', display:'block', marginBottom:'.2rem' };
