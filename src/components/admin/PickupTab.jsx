// PickupTab.jsx — บันทึกการรับ-ส่งนักเรียนรายวัน
// โครงสร้างข้อมูล pickupRecords:
//   { [YYYY-MM-DD]: { [studentId]: PickupRecord } }
//
// PickupRecord (backward compat — ฟิลด์เก่าเดิมยังใช้ได้):
//   dropoffRelation: 'บิดา'|'มารดา'|'ย่า-ยาย'|'ปู่-ตา'|'อื่นๆ'|''  — ผู้ส่ง (เช้า)
//   dropoffName:     string   — ชื่อผู้ส่ง (กรณีอื่นๆ หรือกรอกเอง)
//   dropoffTime:     'HH:MM'  — เวลาส่ง
//   relation:        string   — ผู้รับ (เย็น) [backward compat]
//   time:            'HH:MM'  — เวลารับ [backward compat]
//   note:            '✓'|'C'|'X'|string — หมายเหตุ
//   savedAt:         ISO string
//   otherName/otherPhone/otherId: string [backward compat กรณีผู้รับอื่นๆ]
import { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { todayISO, formatDateThai } from '../../utils/helpers';
import Modal, { ModalCancelBtn, ModalConfirmBtn } from '../Modal';

// ALL_CLASSES ดึงจาก allClassNames ใน AppContext

const RELATIONS = ['บิดา', 'มารดา', 'ย่า-ยาย', 'ปู่-ตา', 'อื่นๆ'];

const REL_ICON = {
  บิดา:       '👨',
  มารดา:      '👩',
  'ย่า-ยาย':  '👵',
  'ปู่-ตา':   '👴',
  อื่นๆ:      '🧑',
};

const REL_COLOR = {
  บิดา:       { bg: '#dbeafe', color: '#1e40af', border: '#93c5fd' },
  มารดา:      { bg: '#fce7f3', color: '#9d174d', border: '#f9a8d4' },
  'ย่า-ยาย':  { bg: '#fef9c3', color: '#713f12', border: '#fde047' },
  'ปู่-ตา':   { bg: '#dcfce7', color: '#14532d', border: '#86efac' },
  อื่นๆ:      { bg: '#f3f4f6', color: '#374151', border: '#d1d5db' },
};

// หมายเหตุ quick-select (จากแบบฟอร์มกระดาษ)
const NOTE_OPTS = [
  { value: '✓', label: '✓',  desc: 'ปกติ',   bg: '#d1fae5', color: '#065f46' },
  { value: 'C', label: 'C',  desc: 'ค้าง',   bg: '#fef3c7', color: '#92400e' },
  { value: 'X', label: 'X',  desc: 'ขาด',    bg: '#fee2e2', color: '#991b1b' },
];

function nowHHMM() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function shortName(name) {
  return name.replace('เด็กชาย', 'ด.ช.').replace('เด็กหญิง', 'ด.ญ.');
}

const EMPTY_FORM = {
  // ── ผู้ส่ง (เช้า) ──
  dropoffRelation: '',
  dropoffName:     '',
  dropoffTime:     '',
  // ── ผู้รับ (เย็น) ──
  relation:        'บิดา',
  otherName:       '',
  otherPhone:      '',
  otherId:         '',
  time:            '',
  // ── หมายเหตุ ──
  note:            '✓',
};

// ── พิมพ์รายชื่อรับ-ส่งรายวัน ─────────────────────────────────────────────
function printPickupSheet(rows, dateStr, className, schoolName, teacher, schoolLogo) {
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap');
    *{box-sizing:border-box}
    body{font-family:'Sarabun',sans-serif;font-size:10.5pt;margin:0;padding:0}
    h2{text-align:center;font-size:13pt;font-weight:800;margin:.15rem 0}
    .sub{text-align:center;font-size:9.5pt;margin:.1rem 0}
    table{width:100%;border-collapse:collapse;margin-top:.6rem;font-size:9pt}
    th,td{border:1px solid #555;padding:3px 5px;vertical-align:middle}
    th{background:#ddd;text-align:center;font-weight:700}
    .tc{text-align:center}
    .tl{text-align:left}
    .sig{margin-top:2rem;text-align:center;font-size:9.5pt}
    @media print{@page{size:A4 portrait;margin:1in}body{margin:0}}
  `;
  const dateLabel = dateStr
    ? new Date(dateStr).toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : '';
  const bodyRows = rows.map((r, i) => `
    <tr>
      <td class="tc">${i + 1}</td>
      <td class="tl">${r.name}</td>
      <td class="tl">${r.dropoffDisplay}</td>
      <td class="tl">${r.pickupDisplay}</td>
      <td class="tc">${r.note ?? ''}</td>
    </tr>`).join('');
  const teacherLine = teacher ? `${teacher.name ?? ''}` : '';
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
    <title>รายชื่อรับ-ส่ง</title><style>${css}</style></head>
    <body>
      ${schoolLogo ? `<div style="text-align:center;margin-bottom:4px"><img src="${schoolLogo}" style="height:70px;object-fit:contain"/></div>` : ''}
      <h2>รายชื่อนักเรียน${className ? ` ${className}` : ''}</h2>
      ${schoolName ? `<div class="sub">${schoolName}</div>` : ''}
      <div class="sub">${dateLabel}</div>
      <table>
        <thead>
          <tr>
            <th style="width:28px">ลำดับ</th>
            <th class="tl" style="min-width:160px">ชื่อ – นามสกุล</th>
            <th style="width:110px">ส่ง</th>
            <th style="width:110px">รับ</th>
            <th style="width:60px">หมายเหตุ</th>
          </tr>
        </thead>
        <tbody>${bodyRows}</tbody>
      </table>
      <div class="sig">ลงชื่อ ................................................ ครูประจำชั้น<br/>${teacherLine ? `( ${teacherLine} )` : '( ....................................... )'}</div>
      <script>setTimeout(()=>window.print(),500)</` + `script>
    </body></html>`;
  const w = window.open('', '_blank', 'width=1000,height=750');
  if (!w) { alert('กรุณาอนุญาต popup'); return; }
  w.document.write(html);
  w.document.close();
}

export default function PickupTab({ defaultClass }) {
  const { students, teachers, pickupRecords, setPickupRecords, classes, allClassNames } = useApp();
  const ALL_CLASSES = allClassNames;

  const classList = useMemo(
    () => (classes ?? []).map(c => c.name ?? c.id).filter(Boolean).sort(),
    [classes]
  );
  const defaultCls = defaultClass ?? classList[0] ?? ALL_CLASSES[0];

  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [filterClass,  setFilterClass]  = useState(defaultCls);
  const [modal, setModal] = useState(null);
  const [form,  setForm]  = useState(EMPTY_FORM);
  const [saved, setSaved] = useState(null);

  const isToday = selectedDate === todayISO();
  const teacher = teachers?.find(t => t.className === filterClass);

  const classStudents = useMemo(
    () => students.filter(s => s.className === filterClass && !s.name.startsWith('(ว่าง)')).sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '', 'th')),
    [students, filterClass]
  );

  const dayRecords = useMemo(() => pickupRecords[selectedDate] ?? {}, [pickupRecords, selectedDate]);

  // summary counts per relation (pickup)
  const summary = useMemo(() => {
    const cnts = {};
    RELATIONS.forEach(r => { cnts[r] = 0; });
    Object.values(dayRecords).forEach(r => { if (r.relation && cnts[r.relation] !== undefined) cnts[r.relation]++; });
    return cnts;
  }, [dayRecords]);

  const totalPickedUp = classStudents.filter(s => dayRecords[s.id]?.relation).length;
  const totalDroppedOff = classStudents.filter(s => dayRecords[s.id]?.dropoffRelation || dayRecords[s.id]?.dropoffName).length;

  // ── quick-save: บันทึกผู้ส่ง (เช้า) จาก defaultDropoff ──
  function saveDropoffDefault(student) {
    const rel  = student.defaultDropoffRelation || '';
    const name = student.defaultDropoffName || '';
    setPickupRecords(prev => ({
      ...prev,
      [selectedDate]: {
        ...(prev[selectedDate] ?? {}),
        [student.id]: {
          ...(prev[selectedDate]?.[student.id] ?? {}),
          dropoffRelation: rel,
          dropoffName:     name,
          dropoffTime:     nowHHMM(),
          savedAt:         new Date().toISOString(),
        },
      },
    }));
    setSaved(`d-${student.id}`);
    setTimeout(() => setSaved(null), 2000);
  }

  // ── quick-save: บันทึกผู้รับ (เย็น) จาก defaultPickup ──
  function savePickupDefault(student) {
    const rel  = student.defaultPickupRelation || 'บิดา';
    const name = student.defaultPickupName || '';
    const existing = dayRecords[student.id] ?? {};
    setPickupRecords(prev => ({
      ...prev,
      [selectedDate]: {
        ...(prev[selectedDate] ?? {}),
        [student.id]: {
          ...existing,
          relation:  rel,
          time:      nowHHMM(),
          note:      existing.note || '✓',
          savedAt:   new Date().toISOString(),
          ...(rel === 'อื่นๆ' && name ? { otherName: name } : {}),
        },
      },
    }));
    setSaved(`p-${student.id}`);
    setTimeout(() => setSaved(null), 2000);
  }

  function openModal(student) {
    const existing = dayRecords[student.id];
    setForm(existing
      ? { ...EMPTY_FORM, ...existing }
      : {
          ...EMPTY_FORM,
          time:            nowHHMM(),
          dropoffTime:     nowHHMM(),
          dropoffRelation: student.defaultDropoffRelation || '',
          dropoffName:     student.defaultDropoffName || '',
          relation:        student.defaultPickupRelation || 'บิดา',
        }
    );
    setModal({ student });
  }

  function saveRecord() {
    if (form.relation === 'อื่นๆ') {
      if (!form.otherName.trim() && !form.otherPhone.trim() && !form.otherId.trim()) {
        alert('กรุณาระบุชื่อ / เบอร์โทร / หมายเลขบัตรประชาชนของผู้รับอย่างใดอย่างหนึ่ง');
        return;
      }
    }
    const rec = {
      // ── ผู้ส่ง ──
      dropoffRelation: form.dropoffRelation,
      dropoffName:     form.dropoffName.trim(),
      dropoffTime:     form.dropoffTime,
      // ── ผู้รับ ──
      relation:        form.relation,
      time:            form.time,
      note:            form.note,
      savedAt:         new Date().toISOString(),
      ...(form.relation === 'อื่นๆ' ? {
        otherName:  form.otherName.trim(),
        otherPhone: form.otherPhone.trim(),
        otherId:    form.otherId.trim(),
      } : {}),
    };
    setPickupRecords(prev => ({
      ...prev,
      [selectedDate]: { ...(prev[selectedDate] ?? {}), [modal.student.id]: rec },
    }));
    setSaved(modal.student.id);
    setTimeout(() => setSaved(null), 2500);
    setModal(null);
  }

  function deleteRecord(studentId) {
    setPickupRecords(prev => {
      const day = { ...(prev[selectedDate] ?? {}) };
      delete day[studentId];
      return { ...prev, [selectedDate]: day };
    });
  }

  // ── rows for print ──
  const { schoolName, schoolLogo } = useApp();
  const printRows = classStudents.map(s => {
    const rec = dayRecords[s.id] ?? {};
    const dropoffDisplay = rec.dropoffRelation
      ? `${REL_ICON[rec.dropoffRelation] ?? ''} ${rec.dropoffRelation}${rec.dropoffName ? ` (${rec.dropoffName})` : ''}${rec.dropoffTime ? ' ' + rec.dropoffTime : ''}`
      : (rec.dropoffName || '');
    const pickupDisplay = rec.relation
      ? `${REL_ICON[rec.relation] ?? ''} ${rec.relation}${rec.relation === 'อื่นๆ' && rec.otherName ? ` (${rec.otherName})` : ''}${rec.time ? ' ' + rec.time : ''}`
      : '';
    return { name: s.name, dropoffDisplay, pickupDisplay, note: rec.note ?? '' };
  });

  const inp = (extra = {}) => ({ className: 'input', style: { fontSize: '.85rem', ...extra } });

  return (
    <div className="animate-fade">
      {/* ── Header ── */}
      <div style={{
        background: 'linear-gradient(135deg,#f59e0b,#f97316)',
        borderRadius: '16px', padding: '1.25rem 1.5rem',
        color: 'white', marginBottom: '1.25rem',
        display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '.25rem' }}>
            🚌 บันทึกการรับ-ส่งนักเรียน
          </div>
          <div style={{ opacity: .88, fontSize: '.83rem' }}>
            {isToday ? '🟢 วันนี้ — ' : ''}{formatDateThai(selectedDate)}
          </div>
        </div>
        {/* summary */}
        <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ background: 'rgba(255,255,255,.2)', borderRadius: '10px', padding: '.3rem .7rem', textAlign: 'center' }}>
            <div style={{ fontWeight: 900, fontSize: '1rem' }}>{totalDroppedOff}/{classStudents.length}</div>
            <div style={{ fontSize: '.62rem', opacity: .9 }}>ส่งแล้ว</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,.2)', borderRadius: '10px', padding: '.3rem .7rem', textAlign: 'center' }}>
            <div style={{ fontWeight: 900, fontSize: '1rem' }}>{totalPickedUp}/{classStudents.length}</div>
            <div style={{ fontSize: '.62rem', opacity: .9 }}>รับแล้ว</div>
          </div>
          {RELATIONS.map(r => summary[r] > 0 && (
            <div key={r} style={{ background: 'rgba(255,255,255,.2)', borderRadius: '10px', padding: '.3rem .7rem', textAlign: 'center' }}>
              <div style={{ fontWeight: 900, fontSize: '1rem' }}>{summary[r]}</div>
              <div style={{ fontSize: '.62rem', opacity: .9 }}>{REL_ICON[r]} {r}</div>
            </div>
          ))}
          <button type="button"
            onClick={() => printPickupSheet(printRows, selectedDate, filterClass, schoolName, teacher, schoolLogo)}
            style={{ padding: '.4rem .9rem', borderRadius: '8px', border: '1.5px solid rgba(255,255,255,.5)', background: 'rgba(255,255,255,.15)', color: 'white', fontFamily: 'inherit', fontWeight: 600, fontSize: '.82rem', cursor: 'pointer' }}>
            🖨️ พิมพ์
          </button>
        </div>
      </div>

      {/* ── Controls ── */}
      <div style={{
        background: 'white', border: '1.5px solid #e5e7eb',
        borderRadius: '14px', padding: '.85rem 1rem',
        display: 'flex', gap: '.75rem', alignItems: 'center',
        flexWrap: 'wrap', marginBottom: '1rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
          <span style={{ fontSize: '.8rem', fontWeight: 700, color: '#6b7280' }}>📅 วันที่</span>
          <input type="date" className="input" style={{ width: '170px', fontSize: '.85rem' }}
            value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
          {!isToday && (
            <button className="btn btn-sm" onClick={() => setSelectedDate(todayISO())}
              style={{ fontSize: '.75rem' }}>วันนี้</button>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
          <span style={{ fontSize: '.8rem', fontWeight: 700, color: '#6b7280' }}>🏫 ห้อง</span>
          <select className="input" style={{ width: '120px', fontSize: '.85rem' }}
            value={filterClass} onChange={e => setFilterClass(e.target.value)}>
            {(classList.length ? classList : ALL_CLASSES).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        {teacher && (
          <span style={{ fontSize: '.82rem', color: '#6b7280', fontWeight: 600 }}>
            👩‍🏫 {teacher.name ?? [teacher.firstName, teacher.lastName].filter(Boolean).join(' ')}
          </span>
        )}
      </div>

      {/* ── Progress bars ── */}
      {classStudents.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.3rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
            <span style={{ fontSize: '.72rem', color: '#6b7280', width: '40px', textAlign: 'right' }}>ส่ง</span>
            <div style={{ flex: 1, height: 7, borderRadius: '99px', background: '#fef3c7', overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: '99px', width: `${(totalDroppedOff / classStudents.length) * 100}%`, background: 'linear-gradient(90deg,#f59e0b,#fbbf24)', transition: 'width .4s' }} />
            </div>
            <span style={{ fontSize: '.72rem', color: '#6b7280', width: '40px' }}>{totalDroppedOff}/{classStudents.length}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
            <span style={{ fontSize: '.72rem', color: '#6b7280', width: '40px', textAlign: 'right' }}>รับ</span>
            <div style={{ flex: 1, height: 7, borderRadius: '99px', background: '#fef3c7', overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: '99px', width: `${(totalPickedUp / classStudents.length) * 100}%`, background: 'linear-gradient(90deg,#f97316,#ef4444)', transition: 'width .4s' }} />
            </div>
            <span style={{ fontSize: '.72rem', color: '#6b7280', width: '40px' }}>{totalPickedUp}/{classStudents.length}</span>
          </div>
        </div>
      )}

      {/* ── Table ── */}
      <div className="glass-card" style={{ padding: '1rem 1.25rem' }}>
        <div className="table-wrap">
          <table className="table" style={{ fontSize: '.84rem' }}>
            <thead>
              <tr>
                <th style={{ width: '36px' }}>#</th>
                <th>ชื่อ-นามสกุล</th>
                <th style={{ textAlign: 'center', width: '62px' }}>🌅 เวลาส่ง</th>
                <th style={{ textAlign: 'center', width: '110px' }}>ผู้ส่ง</th>
                <th style={{ textAlign: 'center', width: '74px' }}>บันทึกส่ง</th>
                <th style={{ textAlign: 'center', width: '62px' }}>🌆 เวลารับ</th>
                <th style={{ textAlign: 'center', width: '110px' }}>ผู้รับ</th>
                <th style={{ textAlign: 'center', width: '74px' }}>บันทึกรับ</th>
                <th style={{ textAlign: 'center', width: '58px' }}>แก้ไข</th>
              </tr>
            </thead>
            <tbody>
              {classStudents.map((s, idx) => {
                const rec     = dayRecords[s.id];
                const isBoy   = s.name.includes('ชาย');

                // ── ผู้ส่ง ──
                const defDropRel  = s.defaultDropoffRelation || '';
                const defDropName = s.defaultDropoffName || '';
                const actDropRel  = rec?.dropoffRelation || '';
                const actDropName = rec?.dropoffName || '';
                const showDropRel = actDropRel || defDropRel;   // ชื่อที่แสดง
                const dropSaved   = !!(rec?.dropoffRelation || rec?.dropoffName || rec?.dropoffTime);
                const dropDiffers = dropSaved && actDropRel !== defDropRel;
                const dropC       = REL_COLOR[showDropRel] ?? REL_COLOR['อื่นๆ'];

                // ── ผู้รับ ──
                const defPickRel  = s.defaultPickupRelation || 'บิดา';
                const defPickName = s.defaultPickupName || '';
                const actPickRel  = rec?.relation || '';
                const actPickName = rec?.otherName || '';
                const showPickRel = actPickRel || defPickRel;
                const pickSaved   = !!rec?.relation;
                const pickDiffers = pickSaved && actPickRel !== defPickRel;
                const pickC       = REL_COLOR[showPickRel] ?? REL_COLOR['อื่นๆ'];

                const dropJustSaved = saved === `d-${s.id}`;
                const pickJustSaved = saved === `p-${s.id}`;

                // helper สร้าง person chip
                const personChip = (rel, name, color, differs, saved) => {
                  if (!rel) return <span style={{ color: '#d1d5db', fontSize: '.75rem' }}>—</span>;
                  return (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '.2rem',
                      background: saved ? color.bg : '#f9fafb',
                      color:      saved ? color.color : '#9ca3af',
                      border:     `1.5px ${saved ? 'solid' : 'dashed'} ${saved ? color.border : '#d1d5db'}`,
                      borderRadius: '8px', padding: '.15rem .5rem',
                      fontWeight: 700, fontSize: '.75rem',
                      outline: differs ? '2px solid #f59e0b' : 'none',
                      outlineOffset: '1px',
                    }}>
                      {REL_ICON[rel] ?? '🧑'} {rel}
                      {name && <span style={{ fontWeight: 400, fontSize: '.68rem', opacity: .8 }}>({name})</span>}
                      {differs && <span style={{ fontSize: '.65rem', color: '#b45309', marginLeft: '.1rem' }}>⚠️</span>}
                    </span>
                  );
                };

                return (
                  <tr key={s.id} className="hover-row" style={{
                    background: (dropJustSaved || pickJustSaved) ? '#f0fdf4' : undefined,
                  }}>
                    <td style={{ color: 'var(--text-muted)', textAlign: 'center' }}>{idx + 1}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                        <div style={{
                          width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                          background: isBoy ? '#dbeafe' : '#fce7f3',
                          color: isBoy ? '#1e40af' : '#9d174d',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '.7rem', fontWeight: 800,
                        }}>{isBoy ? '♂' : '♀'}</div>
                        <span style={{ fontWeight: 600 }}>{shortName(s.name)}</span>
                      </div>
                    </td>

                    {/* เวลาส่ง */}
                    <td style={{ textAlign: 'center', fontWeight: rec?.dropoffTime ? 700 : 400,
                      color: rec?.dropoffTime ? '#374151' : '#d1d5db', fontSize: '.8rem' }}>
                      {rec?.dropoffTime ?? '—'}
                    </td>

                    {/* ผู้ส่ง */}
                    <td style={{ textAlign: 'center' }}>
                      {personChip(
                        dropSaved ? actDropRel : defDropRel,
                        dropSaved ? actDropName : defDropName,
                        dropC, dropDiffers, dropSaved
                      )}
                    </td>

                    {/* ปุ่ม บันทึก ส่ง */}
                    <td style={{ textAlign: 'center' }}>
                      {dropSaved ? (
                        <span style={{ fontSize: '.72rem', color: '#059669', fontWeight: 700 }}>✅ ส่งแล้ว</span>
                      ) : (
                        <button onClick={() => saveDropoffDefault(s)} style={{
                          padding: '.22rem .5rem', borderRadius: '7px', border: 'none',
                          background: '#f59e0b', color: 'white',
                          fontFamily: 'inherit', fontWeight: 700, fontSize: '.72rem', cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}>+ บันทึก</button>
                      )}
                    </td>

                    {/* เวลารับ */}
                    <td style={{ textAlign: 'center', fontWeight: rec?.time ? 700 : 400,
                      color: rec?.time ? '#374151' : '#d1d5db', fontSize: '.8rem' }}>
                      {rec?.time ?? '—'}
                    </td>

                    {/* ผู้รับ */}
                    <td style={{ textAlign: 'center' }}>
                      {personChip(
                        pickSaved ? actPickRel : defPickRel,
                        pickSaved ? actPickName : defPickName,
                        pickC, pickDiffers, pickSaved
                      )}
                    </td>

                    {/* ปุ่ม บันทึก รับ */}
                    <td style={{ textAlign: 'center' }}>
                      {pickSaved ? (
                        <span style={{ fontSize: '.72rem', color: '#059669', fontWeight: 700 }}>✅ รับแล้ว</span>
                      ) : (
                        <button onClick={() => savePickupDefault(s)} style={{
                          padding: '.22rem .5rem', borderRadius: '7px', border: 'none',
                          background: '#10b981', color: 'white',
                          fontFamily: 'inherit', fontWeight: 700, fontSize: '.72rem', cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}>+ บันทึก</button>
                      )}
                    </td>

                    {/* แก้ไข */}
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '.25rem', justifyContent: 'center' }}>
                        <button onClick={() => openModal(s)} style={{
                          padding: '.22rem .45rem', borderRadius: '7px', border: 'none',
                          background: '#f3f4f6', color: '#374151',
                          fontFamily: 'inherit', fontWeight: 700, fontSize: '.72rem', cursor: 'pointer',
                        }}>✏️</button>
                        {rec && (
                          <button onClick={() => deleteRecord(s.id)} style={{
                            padding: '.22rem .45rem', borderRadius: '7px', border: 'none',
                            background: '#fee2e2', color: '#991b1b',
                            fontFamily: 'inherit', fontWeight: 700, fontSize: '.72rem', cursor: 'pointer',
                          }}>🗑</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {classStudents.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                    ไม่มีนักเรียนในห้องนี้
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Legend ── */}
      <div style={{
        marginTop: '1rem', display: 'flex', gap: '.65rem', flexWrap: 'wrap',
        padding: '.6rem 1rem', background: '#fffbeb', borderRadius: '10px',
        border: '1px solid #fde68a',
      }}>
        {RELATIONS.map(r => {
          const c = REL_COLOR[r];
          return (
            <span key={r} style={{ display: 'flex', alignItems: 'center', gap: '.3rem', fontSize: '.78rem' }}>
              <span style={{
                background: c.bg, color: c.color, border: `1px solid ${c.border}`,
                borderRadius: '6px', padding: '0 .4rem', fontWeight: 700, fontSize: '.74rem',
              }}>{REL_ICON[r]} {r}</span>
            </span>
          );
        })}
        <span style={{ borderLeft: '1px solid #fde68a', paddingLeft: '.65rem', display: 'flex', gap: '.4rem', alignItems: 'center' }}>
          {NOTE_OPTS.map(n => (
            <span key={n.value} style={{ background: n.bg, color: n.color, borderRadius: '6px', padding: '0 .4rem', fontWeight: 800, fontSize: '.78rem' }}>
              {n.value} {n.desc}
            </span>
          ))}
        </span>
      </div>

      {/* ── Modal ── */}
      <Modal
        isOpen={!!modal}
        onClose={() => setModal(null)}
        title={modal ? `🚌 รับ-ส่ง — ${shortName(modal.student.name)}` : '🚌 รับ-ส่ง'}
        size="md"
      >
        {modal && (
          <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>
            {/* ── Section: ผู้ส่ง ── */}
            <div style={{ background: '#fffbeb', borderRadius: '12px', padding: '1rem', border: '1.5px solid #fde68a' }}>
              <div style={{ fontWeight: 700, fontSize: '.82rem', color: '#92400e', marginBottom: '.65rem' }}>🌅 ผู้ส่ง (ตอนเช้า)</div>
              <div style={{ display: 'flex', gap: '.35rem', flexWrap: 'wrap', marginBottom: '.55rem' }}>
                <button type="button" onClick={() => setForm(f => ({ ...f, dropoffRelation: '' }))}
                  style={{ padding: '.3rem .7rem', borderRadius: '8px', fontFamily: 'inherit', fontWeight: 700, fontSize: '.8rem', cursor: 'pointer', border: !form.dropoffRelation ? '2px solid #f59e0b' : '1.5px solid #e5e7eb', background: !form.dropoffRelation ? '#fef3c7' : 'white', color: !form.dropoffRelation ? '#92400e' : '#6b7280' }}>
                  ไม่ระบุ
                </button>
                {RELATIONS.map(r => {
                  const isActive = form.dropoffRelation === r;
                  const c = REL_COLOR[r];
                  return (
                    <button key={r} type="button" onClick={() => setForm(f => ({ ...f, dropoffRelation: r }))}
                      style={{ padding: '.3rem .7rem', borderRadius: '8px', border: isActive ? `2px solid ${c.border}` : '1.5px solid #e5e7eb', background: isActive ? c.bg : 'white', color: isActive ? c.color : '#6b7280', fontFamily: 'inherit', fontWeight: 700, fontSize: '.8rem', cursor: 'pointer' }}>
                      {REL_ICON[r]} {r}
                    </button>
                  );
                })}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '.5rem' }}>
                <div>
                  <label style={{ fontSize: '.75rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '.2rem' }}>ชื่อ (กรณีอื่นๆ)</label>
                  <input {...inp()} placeholder="ชื่อผู้ส่ง..." value={form.dropoffName}
                    onChange={e => setForm(f => ({ ...f, dropoffName: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: '.75rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '.2rem' }}>⏰ เวลาส่ง</label>
                  <input type="time" {...inp()} value={form.dropoffTime}
                    onChange={e => setForm(f => ({ ...f, dropoffTime: e.target.value }))} />
                </div>
              </div>
            </div>

            {/* ── Section: ผู้รับ ── */}
            <div style={{ background: '#f0fdf4', borderRadius: '12px', padding: '1rem', border: '1.5px solid #86efac' }}>
              <div style={{ fontWeight: 700, fontSize: '.82rem', color: '#14532d', marginBottom: '.65rem' }}>🌆 ผู้รับ (ตอนเย็น)</div>
              <div style={{ display: 'flex', gap: '.35rem', flexWrap: 'wrap', marginBottom: '.55rem' }}>
                {RELATIONS.map(r => {
                  const isActive = form.relation === r;
                  const c = REL_COLOR[r];
                  return (
                    <button key={r} type="button" onClick={() => setForm(f => ({ ...f, relation: r }))}
                      style={{ padding: '.3rem .7rem', borderRadius: '8px', border: isActive ? `2px solid ${c.border}` : '1.5px solid #e5e7eb', background: isActive ? c.bg : 'white', color: isActive ? c.color : '#6b7280', fontFamily: 'inherit', fontWeight: 700, fontSize: '.8rem', cursor: 'pointer' }}>
                      {REL_ICON[r]} {r}
                    </button>
                  );
                })}
              </div>
              {form.relation === 'อื่นๆ' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', marginBottom: '.55rem' }}>
                  <input {...inp()} placeholder="ชื่อ-นามสกุล" value={form.otherName}
                    onChange={e => setForm(f => ({ ...f, otherName: e.target.value }))} />
                  <input {...inp()} placeholder="เบอร์โทรศัพท์" value={form.otherPhone}
                    onChange={e => setForm(f => ({ ...f, otherPhone: e.target.value }))} />
                  <input {...inp()} placeholder="เลขบัตรประชาชน" maxLength={17} value={form.otherId}
                    onChange={e => setForm(f => ({ ...f, otherId: e.target.value }))} />
                </div>
              )}
              <div>
                <label style={{ fontSize: '.75rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '.2rem' }}>⏰ เวลารับ</label>
                <input type="time" {...inp({ width: '130px' })} value={form.time}
                  onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
              </div>
            </div>

            {/* ── หมายเหตุ ── */}
            <div>
              <div style={{ fontWeight: 700, fontSize: '.82rem', color: '#374151', marginBottom: '.5rem' }}>📝 หมายเหตุ</div>
              <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                {NOTE_OPTS.map(n => (
                  <button key={n.value} type="button" onClick={() => setForm(f => ({ ...f, note: f.note === n.value ? '' : n.value }))}
                    style={{ padding: '.3rem .8rem', borderRadius: '8px', fontFamily: 'inherit', fontWeight: 800, fontSize: '.9rem', cursor: 'pointer', border: form.note === n.value ? `2px solid ${n.color}` : '1.5px solid #e5e7eb', background: form.note === n.value ? n.bg : 'white', color: form.note === n.value ? n.color : '#6b7280' }}>
                    {n.value} <span style={{ fontWeight: 400, fontSize: '.75rem' }}>{n.desc}</span>
                  </button>
                ))}
                <input {...inp({ flex: 1, minWidth: '80px' })} placeholder="หมายเหตุอื่นๆ..."
                  value={NOTE_OPTS.some(n => n.value === form.note) ? '' : (form.note ?? '')}
                  onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
              </div>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '.6rem' }}>
              <ModalCancelBtn onClick={() => setModal(null)} />
              <ModalConfirmBtn onClick={saveRecord} label="💾 บันทึก" />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
