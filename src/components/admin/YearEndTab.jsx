// YearEndTab.jsx — จัดการสิ้นปีการศึกษา
// Operations: ย้ายห้องเรียน | เลื่อนชั้น | จบการศึกษา | ลาออก | พักการเรียน
import { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';

const LEVEL_LABEL = { K1: 'อ.1', K2: 'อ.2', K3: 'อ.3' };
const LEVEL_NEXT  = { K1: 'K2', K2: 'K3' };

// helper: ถ้าไม่มี status ถือว่ากำลังเรียน
const isActive = s => !s.status || s.status === 'กำลังเรียน';

const todayStr = () => new Date().toISOString().split('T')[0];

// ─── ปุ่มและสีตาม operation ───────────────────────────────────────────────
const OP_META = [
  { id: 'move',     label: '🚪 ย้ายห้องเรียน',   color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
  { id: 'promote',  label: '⬆️ เลื่อนชั้น',       color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  { id: 'graduate', label: '🎓 จบการศึกษา',       color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
  { id: 'withdraw', label: '📤 ลาออก',             color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  { id: 'leave',    label: '⏸️ พักการเรียน',      color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
];

// ─── Component หลัก ──────────────────────────────────────────────────────
export default function YearEndTab() {
  const { students, setStudents, classes } = useApp();
  const [op, setOp] = useState('move');

  const meta = OP_META.find(m => m.id === op);

  return (
    <div className="glass p-6 animate-fade">
      {/* Header */}
      <div className="page-header mb-4">
        <div>
          <h3>🎓 จัดการสิ้นปีการศึกษา</h3>
          <p className="text-xs text-muted" style={{ marginTop: '.25rem' }}>
            ดำเนินการปลายปีการศึกษา — ย้ายห้อง เลื่อนชั้น จบการศึกษา ลาออก พักการเรียน
          </p>
        </div>
        <div style={{
          background: meta.bg, border: `1.5px solid ${meta.border}`,
          borderRadius: '10px', padding: '.4rem .85rem',
          color: meta.color, fontWeight: 700, fontSize: '.85rem',
        }}>
          {students.filter(isActive).length} คนกำลังเรียน
        </div>
      </div>

      {/* Operation selector */}
      <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {OP_META.map(m => (
          <button
            key={m.id}
            onClick={() => setOp(m.id)}
            style={{
              padding: '.45rem 1rem', borderRadius: '10px', cursor: 'pointer',
              fontFamily: 'inherit', fontWeight: 700, fontSize: '.82rem',
              border: `1.5px solid ${op === m.id ? m.color : '#e5e7eb'}`,
              background: op === m.id ? m.bg : 'white',
              color: op === m.id ? m.color : '#6b7280',
              transition: 'all .15s',
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Panel */}
      <div style={{
        background: meta.bg, border: `1.5px solid ${meta.border}`,
        borderRadius: '14px', padding: '1.25rem',
      }}>
        {op === 'move'     && <MovePanel     students={students} setStudents={setStudents} classes={classes} meta={meta} />}
        {op === 'promote'  && <PromotePanel  students={students} setStudents={setStudents} classes={classes} meta={meta} />}
        {op === 'graduate' && <GraduatePanel students={students} setStudents={setStudents} meta={meta} />}
        {op === 'withdraw' && <StatusPanel   students={students} setStudents={setStudents} meta={meta} statusVal="ลาออก"       opLabel="ลาออก" />}
        {op === 'leave'    && <StatusPanel   students={students} setStudents={setStudents} meta={meta} statusVal="พักการเรียน" opLabel="พักการเรียน" />}
      </div>
    </div>
  );
}

// ─── ย้ายห้องเรียน ────────────────────────────────────────────────────────
function MovePanel({ students, setStudents, classes, meta }) {
  const allClassNames = useMemo(
    () => [...new Set(students.filter(isActive).map(s => s.className).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'th')),
    [students],
  );

  const [srcClass, setSrcClass]   = useState('');
  const [dstClass, setDstClass]   = useState('');
  const [selected, setSelected]   = useState(new Set());
  const [done, setDone]           = useState(false);

  const srcStudents = useMemo(
    () => students.filter(s => isActive(s) && s.className === srcClass),
    [students, srcClass],
  );

  const dstOptions = useMemo(
    () => {
      // ห้องปลายทาง = ทุกชื่อห้องที่มีในระบบ (classes) ยกเว้นห้องต้นทาง
      const fromClasses = classes.map(c => c.name).filter(n => n && n !== srcClass);
      return fromClasses.sort((a, b) => a.localeCompare(b, 'th'));
    },
    [classes, srcClass],
  );

  function toggleAll(e) {
    if (e.target.checked) setSelected(new Set(srcStudents.map(s => s.id)));
    else setSelected(new Set());
  }

  function toggle(id) {
    setSelected(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  function handleMove() {
    if (!selected.size || !dstClass) return;
    if (!window.confirm(`ย้าย ${selected.size} คน ไปห้อง "${dstClass}" ใช่ไหม?`)) return;
    setStudents(prev => prev.map(s =>
      selected.has(s.id) ? { ...s, className: dstClass } : s,
    ));
    setSelected(new Set());
    setSrcClass('');
    setDstClass('');
    setDone(true);
    setTimeout(() => setDone(false), 3000);
  }

  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: '.95rem', color: meta.color, marginBottom: '1rem' }}>
        🚪 ย้ายนักเรียนระหว่างห้องเรียน
      </div>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <div style={{ flex: 1, minWidth: '180px' }}>
          <label className="text-sm" style={{ fontWeight: 600, display: 'block', marginBottom: '.35rem' }}>ห้องต้นทาง</label>
          <select className="input" value={srcClass} onChange={e => { setSrcClass(e.target.value); setSelected(new Set()); setDstClass(''); }}>
            <option value="">— เลือกห้อง —</option>
            {allClassNames.map(n => <option key={n}>{n}</option>)}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: '180px' }}>
          <label className="text-sm" style={{ fontWeight: 600, display: 'block', marginBottom: '.35rem' }}>ห้องปลายทาง</label>
          <select className="input" value={dstClass} onChange={e => setDstClass(e.target.value)} disabled={!srcClass}>
            <option value="">— เลือกห้อง —</option>
            {dstOptions.map(n => <option key={n}>{n}</option>)}
          </select>
        </div>
      </div>

      {srcClass && srcStudents.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.5rem' }}>
            <input type="checkbox"
              checked={selected.size === srcStudents.length && srcStudents.length > 0}
              onChange={toggleAll}
            />
            <span className="text-sm" style={{ fontWeight: 600 }}>
              เลือกทั้งหมด ({srcStudents.length} คน)
            </span>
          </div>
          <div style={{ maxHeight: '260px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '.3rem' }}>
            {srcStudents.map(s => (
              <label key={s.id} style={{
                display: 'flex', alignItems: 'center', gap: '.6rem',
                padding: '.4rem .7rem', borderRadius: '8px',
                background: selected.has(s.id) ? 'rgba(59,130,246,.08)' : 'white',
                border: `1px solid ${selected.has(s.id) ? '#93c5fd' : '#e5e7eb'}`,
                cursor: 'pointer',
              }}>
                <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggle(s.id)} />
                <span style={{ fontWeight: 600, fontSize: '.88rem' }}>{s.name}</span>
                <span className="text-xs text-muted">{LEVEL_LABEL[s.level] || s.level}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {srcClass && srcStudents.length === 0 && (
        <p className="text-muted text-sm" style={{ marginBottom: '1rem' }}>ไม่มีนักเรียนในห้องนี้</p>
      )}

      <button
        className="btn btn-primary"
        onClick={handleMove}
        disabled={!selected.size || !dstClass}
      >
        ย้าย {selected.size > 0 ? `${selected.size} คน` : ''} ไปห้อง {dstClass || '...'}
      </button>

      {done && <span style={{ marginLeft: '1rem', color: '#059669', fontWeight: 700, fontSize: '.88rem' }}>✅ ย้ายเรียบร้อยแล้ว</span>}
    </div>
  );
}

// ─── เลื่อนชั้น ───────────────────────────────────────────────────────────
function PromotePanel({ students, setStudents, classes, meta }) {
  const [fromLevel, setFromLevel] = useState('K1');
  const [dstClass,  setDstClass]  = useState('');
  const [selected,  setSelected]  = useState(new Set());
  const [done,      setDone]      = useState(false);

  const toLevel = LEVEL_NEXT[fromLevel]; // K2 or K3

  const srcStudents = useMemo(
    () => students.filter(s => isActive(s) && s.level === fromLevel),
    [students, fromLevel],
  );

  const dstOptions = useMemo(
    () => classes.map(c => c.name).filter(Boolean).sort((a, b) => a.localeCompare(b, 'th')),
    [classes],
  );

  function toggleAll(e) {
    if (e.target.checked) setSelected(new Set(srcStudents.map(s => s.id)));
    else setSelected(new Set());
  }

  function toggle(id) {
    setSelected(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  function handlePromote() {
    if (!selected.size || !dstClass) return;
    const label = `${LEVEL_LABEL[fromLevel]} → ${LEVEL_LABEL[toLevel]}`;
    if (!window.confirm(`เลื่อน ${selected.size} คน จาก ${label} ไปห้อง "${dstClass}" ใช่ไหม?`)) return;
    setStudents(prev => prev.map(s =>
      selected.has(s.id) ? { ...s, level: toLevel, className: dstClass } : s,
    ));
    setSelected(new Set());
    setDstClass('');
    setDone(true);
    setTimeout(() => setDone(false), 3000);
  }

  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: '.95rem', color: meta.color, marginBottom: '1rem' }}>
        ⬆️ เลื่อนชั้นนักเรียน
      </div>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <div style={{ flex: 1, minWidth: '180px' }}>
          <label className="text-sm" style={{ fontWeight: 600, display: 'block', marginBottom: '.35rem' }}>ระดับชั้นปัจจุบัน</label>
          <select className="input" value={fromLevel} onChange={e => { setFromLevel(e.target.value); setSelected(new Set()); setDstClass(''); }}>
            <option value="K1">อ.1 → อ.2</option>
            <option value="K2">อ.2 → อ.3</option>
          </select>
        </div>
        <div style={{ flex: 1, minWidth: '180px' }}>
          <label className="text-sm" style={{ fontWeight: 600, display: 'block', marginBottom: '.35rem' }}>
            ห้องปลายทาง ({LEVEL_LABEL[toLevel]})
          </label>
          <select className="input" value={dstClass} onChange={e => setDstClass(e.target.value)}>
            <option value="">— เลือกห้อง —</option>
            {dstOptions.map(n => <option key={n}>{n}</option>)}
          </select>
        </div>
      </div>

      {srcStudents.length > 0 ? (
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.5rem' }}>
            <input type="checkbox"
              checked={selected.size === srcStudents.length}
              onChange={toggleAll}
            />
            <span className="text-sm" style={{ fontWeight: 600 }}>
              เลือกทั้งหมด ({srcStudents.length} คน {LEVEL_LABEL[fromLevel]})
            </span>
          </div>
          <div style={{ maxHeight: '260px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '.3rem' }}>
            {srcStudents.map(s => (
              <label key={s.id} style={{
                display: 'flex', alignItems: 'center', gap: '.6rem',
                padding: '.4rem .7rem', borderRadius: '8px',
                background: selected.has(s.id) ? 'rgba(124,58,237,.07)' : 'white',
                border: `1px solid ${selected.has(s.id) ? '#c4b5fd' : '#e5e7eb'}`,
                cursor: 'pointer',
              }}>
                <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggle(s.id)} />
                <span style={{ fontWeight: 600, fontSize: '.88rem' }}>{s.name}</span>
                <span className="text-xs text-muted">{s.className}</span>
              </label>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-muted text-sm" style={{ marginBottom: '1rem' }}>
          ไม่มีนักเรียนระดับ {LEVEL_LABEL[fromLevel]} ที่กำลังเรียนอยู่
        </p>
      )}

      <button
        className="btn btn-primary"
        onClick={handlePromote}
        disabled={!selected.size || !dstClass}
      >
        เลื่อน {selected.size > 0 ? `${selected.size} คน` : ''} ขึ้น {LEVEL_LABEL[toLevel]}
      </button>

      {done && <span style={{ marginLeft: '1rem', color: '#059669', fontWeight: 700, fontSize: '.88rem' }}>✅ เลื่อนชั้นเรียบร้อยแล้ว</span>}
    </div>
  );
}

// ─── จบการศึกษา ───────────────────────────────────────────────────────────
function GraduatePanel({ students, setStudents, meta }) {
  const k3Students = useMemo(
    () => students.filter(s => isActive(s) && s.level === 'K3'),
    [students],
  );
  const [selected, setSelected] = useState(new Set());
  const [done, setDone] = useState(0);

  function toggleAll(e) {
    if (e.target.checked) setSelected(new Set(k3Students.map(s => s.id)));
    else setSelected(new Set());
  }

  function toggle(id) {
    setSelected(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  function handleGraduate() {
    if (!selected.size) return;
    if (!window.confirm(`บันทึก ${selected.size} คน จบการศึกษา ใช่ไหม?`)) return;
    const date = todayStr();
    setStudents(prev => prev.map(s =>
      selected.has(s.id) ? { ...s, status: 'จบการศึกษา', statusDate: date, statusNote: '' } : s,
    ));
    setDone(selected.size);
    setSelected(new Set());
  }

  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: '.95rem', color: meta.color, marginBottom: '.5rem' }}>
        🎓 บันทึกนักเรียนจบการศึกษา (ระดับ อ.3)
      </div>
      <p className="text-xs text-muted" style={{ marginBottom: '1rem' }}>
        เฉพาะนักเรียน อ.3 — หลังบันทึกจะไม่แสดงในรายชื่อกำลังเรียนอีก
      </p>

      {k3Students.length > 0 ? (
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.5rem' }}>
            <input type="checkbox"
              checked={selected.size === k3Students.length && k3Students.length > 0}
              onChange={toggleAll}
            />
            <span className="text-sm" style={{ fontWeight: 600 }}>
              เลือกทั้งหมด ({k3Students.length} คน อ.3)
            </span>
          </div>
          <div style={{ maxHeight: '260px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '.3rem' }}>
            {k3Students.map(s => (
              <label key={s.id} style={{
                display: 'flex', alignItems: 'center', gap: '.6rem',
                padding: '.4rem .7rem', borderRadius: '8px',
                background: selected.has(s.id) ? 'rgba(5,150,105,.07)' : 'white',
                border: `1px solid ${selected.has(s.id) ? '#6ee7b7' : '#e5e7eb'}`,
                cursor: 'pointer',
              }}>
                <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggle(s.id)} />
                <span style={{ fontWeight: 600, fontSize: '.88rem' }}>{s.name}</span>
                <span className="text-xs text-muted">{s.className}</span>
              </label>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ padding: '1.5rem', textAlign: 'center', color: '#6b7280', fontSize: '.9rem' }}>
          {done > 0
            ? `✅ บันทึกจบการศึกษาแล้ว ${done} คน`
            : 'ไม่มีนักเรียน อ.3 ที่กำลังเรียน'}
        </div>
      )}

      {k3Students.length > 0 && (
        <button
          className="btn btn-primary"
          onClick={handleGraduate}
          disabled={!selected.size}
          style={{ background: meta.color }}
        >
          บันทึกจบการศึกษา {selected.size > 0 ? `${selected.size} คน` : ''}
        </button>
      )}

      {done > 0 && k3Students.length > 0 && (
        <span style={{ marginLeft: '1rem', color: '#059669', fontWeight: 700, fontSize: '.88rem' }}>
          ✅ บันทึกแล้ว {done} คน
        </span>
      )}
    </div>
  );
}

// ─── ลาออก / พักการเรียน (ใช้ component เดียวกัน) ─────────────────────────
function StatusPanel({ students, setStudents, meta, statusVal, opLabel }) {
  const activeStudents = useMemo(
    () => students.filter(isActive).sort((a, b) => a.name.localeCompare(b.name, 'th')),
    [students],
  );

  const [studentId, setStudentId] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(todayStr());
  const [done, setDone] = useState('');

  const selectedStudent = activeStudents.find(s => String(s.id) === studentId);

  function handleSave() {
    if (!selectedStudent) return;
    if (!window.confirm(`บันทึก "${selectedStudent.name}" ${opLabel} ใช่ไหม?`)) return;
    setStudents(prev => prev.map(s =>
      s.id === selectedStudent.id
        ? { ...s, status: statusVal, statusDate: date, statusNote: note }
        : s,
    ));
    setDone(selectedStudent.name);
    setStudentId('');
    setNote('');
    setDate(todayStr());
  }

  const emoji = statusVal === 'ลาออก' ? '📤' : '⏸️';

  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: '.95rem', color: meta.color, marginBottom: '1rem' }}>
        {emoji} บันทึกนักเรียน{opLabel}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '.9rem', maxWidth: '480px' }}>
        <div>
          <label className="text-sm" style={{ fontWeight: 600, display: 'block', marginBottom: '.35rem' }}>
            เลือกนักเรียน
          </label>
          <select className="input" value={studentId} onChange={e => setStudentId(e.target.value)}>
            <option value="">— เลือกนักเรียน —</option>
            {activeStudents.map(s => (
              <option key={s.id} value={String(s.id)}>
                {s.name} ({LEVEL_LABEL[s.level] || s.level} / {s.className})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm" style={{ fontWeight: 600, display: 'block', marginBottom: '.35rem' }}>
            วันที่{opLabel}
          </label>
          <input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} />
        </div>

        <div>
          <label className="text-sm" style={{ fontWeight: 600, display: 'block', marginBottom: '.35rem' }}>
            หมายเหตุ (ถ้ามี)
          </label>
          <textarea
            className="input"
            rows={2}
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder={`เหตุผลที่${opLabel}...`}
            style={{ resize: 'vertical' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={!selectedStudent}
            style={{ background: meta.color }}
          >
            บันทึก{opLabel}
          </button>
          {done && (
            <span style={{ color: '#059669', fontWeight: 700, fontSize: '.88rem' }}>
              ✅ บันทึก "{done}" แล้ว
            </span>
          )}
        </div>
      </div>

      {/* แสดงรายชื่อที่บันทึกแล้ว */}
      {(() => {
        const done2 = students.filter(s => s.status === statusVal);
        if (!done2.length) return null;
        return (
          <div style={{ marginTop: '1.5rem', borderTop: `1.5px solid ${meta.border}`, paddingTop: '1rem' }}>
            <div style={{ fontWeight: 700, fontSize: '.85rem', color: meta.color, marginBottom: '.5rem' }}>
              รายชื่อที่บันทึก{opLabel}แล้ว ({done2.length} คน)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.3rem' }}>
              {done2.map(s => (
                <div key={s.id} style={{
                  display: 'flex', alignItems: 'center', gap: '.75rem',
                  padding: '.4rem .7rem', borderRadius: '8px',
                  background: 'white', border: `1px solid ${meta.border}`,
                  fontSize: '.85rem',
                }}>
                  <span style={{ fontWeight: 600, flex: 1 }}>{s.name}</span>
                  <span className="text-muted">{LEVEL_LABEL[s.level] || s.level} / {s.className}</span>
                  {s.statusDate && <span className="text-muted">{s.statusDate}</span>}
                  {s.statusNote && <span className="text-muted" style={{ fontStyle: 'italic' }}>"{s.statusNote}"</span>}
                  <button
                    title="ยกเลิก (คืนสถานะกำลังเรียน)"
                    onClick={() => {
                      if (!window.confirm(`คืนสถานะ "${s.name}" กลับเป็นกำลังเรียน?`)) return;
                      setStudents(prev => prev.map(x =>
                        x.id === s.id ? { ...x, status: 'กำลังเรียน', statusDate: '', statusNote: '' } : x,
                      ));
                    }}
                    style={{
                      background: '#fee2e2', color: '#991b1b', border: 'none',
                      borderRadius: '6px', padding: '.2rem .45rem', cursor: 'pointer',
                      fontFamily: 'inherit', fontSize: '.75rem', fontWeight: 700,
                    }}
                  >
                    ยกเลิก
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
