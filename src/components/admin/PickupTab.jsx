import { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { todayISO, formatDateThai } from '../../utils/helpers';

const ALL_CLASSES = ['อ.1/1', 'อ.1/2', 'อ.2/1', 'อ.2/2', 'อ.3/1', 'อ.3/2', 'อ.3/3'];

const RELATIONS = ['บิดา', 'มารดา', 'ย่า-ยาย', 'ปู่-ตา', 'อื่นๆ'];

const REL_ICON = {
  บิดา:    '👨',
  มารดา:   '👩',
  'ย่า-ยาย': '👵',
  'ปู่-ตา':  '👴',
  อื่นๆ:   '🧑',
};

const REL_COLOR = {
  บิดา:    { bg: '#dbeafe', color: '#1e40af', border: '#93c5fd' },
  มารดา:   { bg: '#fce7f3', color: '#9d174d', border: '#f9a8d4' },
  'ย่า-ยาย': { bg: '#fef9c3', color: '#713f12', border: '#fde047' },
  'ปู่-ตา':  { bg: '#dcfce7', color: '#14532d', border: '#86efac' },
  อื่นๆ:   { bg: '#f3f4f6', color: '#374151', border: '#d1d5db' },
};

function nowHHMM() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

const EMPTY_FORM = {
  relation: 'บิดา',
  otherName: '',
  otherPhone: '',
  otherId: '',
  time: nowHHMM(),
  note: '',
};

export default function PickupTab({ defaultClass }) {
  const { students, teachers, pickupRecords, setPickupRecords } = useApp();

  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [filterClass,  setFilterClass]  = useState(defaultClass ?? ALL_CLASSES[0]);
  const [modal, setModal] = useState(null);   // { student } or null
  const [form,  setForm]  = useState(EMPTY_FORM);
  const [saved, setSaved] = useState(null);   // studentId of last saved

  const isToday = selectedDate === todayISO();

  const teacher = teachers?.find(t => t.className === filterClass);

  // students in current class
  const classStudents = useMemo(() =>
    students.filter(s => s.className === filterClass && !s.name.startsWith('(ว่าง)')),
    [students, filterClass]
  );

  // existing records for date
  const dayRecords = pickupRecords[selectedDate] ?? {};

  // summary counts per relation
  const summary = useMemo(() => {
    const cnts = {};
    RELATIONS.forEach(r => { cnts[r] = 0; });
    Object.values(dayRecords).forEach(r => { if (cnts[r.relation] !== undefined) cnts[r.relation]++; });
    return cnts;
  }, [dayRecords]);

  const totalPickedUp = classStudents.filter(s => dayRecords[s.id]).length;

  function openModal(student) {
    const existing = dayRecords[student.id];
    setForm(existing ? { ...EMPTY_FORM, ...existing } : { ...EMPTY_FORM, time: nowHHMM() });
    setModal({ student });
  }

  function saveRecord() {
    // validate อื่นๆ — ต้องมีอย่างน้อยหนึ่งอย่าง
    if (form.relation === 'อื่นๆ') {
      if (!form.otherName.trim() && !form.otherPhone.trim() && !form.otherId.trim()) {
        alert('กรุณาระบุชื่อ / เบอร์โทร / หมายเลขบัตรประชาชนอย่างน้อยหนึ่งอย่าง');
        return;
      }
    }
    const rec = {
      relation:  form.relation,
      time:      form.time,
      note:      form.note,
      savedAt:   new Date().toISOString(),
      ...(form.relation === 'อื่นๆ' ? {
        otherName:  form.otherName.trim(),
        otherPhone: form.otherPhone.trim(),
        otherId:    form.otherId.trim(),
      } : {}),
    };
    setPickupRecords(prev => ({
      ...prev,
      [selectedDate]: {
        ...(prev[selectedDate] ?? {}),
        [modal.student.id]: rec,
      },
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

  function shortName(name) {
    return name.replace('เด็กชาย', 'ด.ช.').replace('เด็กหญิง', 'ด.ญ.');
  }

  return (
    <div className="animate-fade">
      {/* ── Header gradient ── */}
      <div style={{
        background: 'linear-gradient(135deg,#f59e0b,#f97316)',
        borderRadius: '16px', padding: '1.25rem 1.5rem',
        color: 'white', marginBottom: '1.25rem',
        display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '.25rem' }}>
            🏠 บันทึกรับกลับบ้าน
          </div>
          <div style={{ opacity: .88, fontSize: '.83rem' }}>
            {isToday ? '🟢 วันนี้ — ' : ''}{formatDateThai(selectedDate)}
          </div>
        </div>

        {/* Summary pills */}
        <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
          {RELATIONS.map(r => summary[r] > 0 && (
            <div key={r} style={{
              background: 'rgba(255,255,255,.2)', borderRadius: '10px',
              padding: '.3rem .7rem', textAlign: 'center',
            }}>
              <div style={{ fontWeight: 900, fontSize: '1rem' }}>{summary[r]}</div>
              <div style={{ fontSize: '.62rem', opacity: .9 }}>{REL_ICON[r]} {r}</div>
            </div>
          ))}
          <div style={{
            background: 'rgba(255,255,255,.2)', borderRadius: '10px',
            padding: '.3rem .7rem', textAlign: 'center',
          }}>
            <div style={{ fontWeight: 900, fontSize: '1rem' }}>
              {totalPickedUp}/{classStudents.length}
            </div>
            <div style={{ fontSize: '.62rem', opacity: .9 }}>รับแล้ว</div>
          </div>
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
            {ALL_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {teacher && (
          <span style={{ fontSize: '.82rem', color: '#6b7280', fontWeight: 600 }}>
            👩‍🏫 {[teacher.firstName, teacher.lastName].filter(Boolean).join(' ') || teacher.name}
          </span>
        )}
      </div>

      {/* ── Progress bar ── */}
      {classStudents.length > 0 && (
        <div style={{
          height: 8, borderRadius: '99px', background: '#fef3c7',
          overflow: 'hidden', marginBottom: '1rem',
        }}>
          <div style={{
            height: '100%', borderRadius: '99px',
            width: `${(totalPickedUp / classStudents.length) * 100}%`,
            background: 'linear-gradient(90deg,#f59e0b,#f97316)',
            transition: 'width .4s',
          }} />
        </div>
      )}

      {/* ── Student list ── */}
      <div className="glass-card" style={{ padding: '1rem 1.25rem' }}>
        <div className="table-wrap">
          <table className="table" style={{ fontSize: '.85rem' }}>
            <thead>
              <tr>
                <th style={{ width: '36px' }}>#</th>
                <th>ชื่อ-นามสกุล</th>
                <th style={{ textAlign: 'center', width: '120px' }}>ผู้รับ</th>
                <th style={{ textAlign: 'center', width: '80px' }}>เวลา</th>
                <th style={{ textAlign: 'center', width: '80px' }}>รายละเอียด</th>
                <th style={{ textAlign: 'center', width: '80px' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {classStudents.map((s, idx) => {
                const rec = dayRecords[s.id];
                const c   = rec ? (REL_COLOR[rec.relation] ?? REL_COLOR['อื่นๆ']) : null;
                const isBoy = s.name.includes('ชาย');
                const justSaved = saved === s.id;
                return (
                  <tr key={s.id} className="hover-row" style={{
                    background: justSaved ? '#f0fdf4' : undefined,
                  }}>
                    <td style={{ color: 'var(--text-muted)', textAlign: 'center' }}>{idx + 1}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                          background: isBoy ? '#dbeafe' : '#fce7f3',
                          color: isBoy ? '#1e40af' : '#9d174d',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '.72rem', fontWeight: 800,
                        }}>
                          {isBoy ? '♂' : '♀'}
                        </div>
                        <span style={{ fontWeight: 600 }}>{shortName(s.name)}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {rec ? (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '.3rem',
                          background: c.bg, color: c.color,
                          border: `1px solid ${c.border}`,
                          borderRadius: '8px', padding: '.2rem .65rem',
                          fontWeight: 700, fontSize: '.8rem',
                        }}>
                          {REL_ICON[rec.relation]} {rec.relation}
                          {rec.relation === 'อื่นๆ' && (rec.otherName || rec.otherPhone || rec.otherId) && (
                            <span style={{ fontWeight: 400, fontSize: '.7rem', opacity: .8, marginLeft: '.15rem' }}>
                              {rec.otherName || rec.otherPhone || rec.otherId}
                            </span>
                          )}
                        </span>
                      ) : (
                        <span style={{ color: '#d1d5db', fontSize: '.8rem' }}>⏳ รอรับ</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center', color: rec ? '#374151' : '#d1d5db', fontWeight: rec ? 700 : 400 }}>
                      {rec?.time ?? '—'}
                    </td>
                    <td style={{ textAlign: 'center', fontSize: '.75rem', color: '#6b7280' }}>
                      {rec?.note ? (
                        <span title={rec.note} style={{ cursor: 'help' }}>📝</span>
                      ) : '—'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '.3rem', justifyContent: 'center' }}>
                        <button
                          onClick={() => openModal(s)}
                          style={{
                            padding: '.2rem .55rem', borderRadius: '7px', border: 'none',
                            background: rec ? '#fef3c7' : '#f59e0b',
                            color: rec ? '#92400e' : 'white',
                            fontFamily: 'inherit', fontWeight: 700, fontSize: '.72rem', cursor: 'pointer',
                          }}
                        >
                          {rec ? '✏️ แก้' : '+ บันทึก'}
                        </button>
                        {rec && (
                          <button
                            onClick={() => deleteRecord(s.id)}
                            style={{
                              padding: '.2rem .45rem', borderRadius: '7px', border: 'none',
                              background: '#fee2e2', color: '#991b1b',
                              fontFamily: 'inherit', fontWeight: 700, fontSize: '.72rem', cursor: 'pointer',
                            }}
                          >🗑</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {classStudents.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                    ไม่มีนักเรียนในห้องนี้
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Relation legend ── */}
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
      </div>

      {/* ── Modal ── */}
      {modal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: '1rem',
        }}
          onClick={e => { if (e.target === e.currentTarget) setModal(null); }}
        >
          <div style={{
            background: 'white', borderRadius: '20px', width: '100%', maxWidth: '460px',
            padding: '1.75rem', boxShadow: '0 20px 60px rgba(0,0,0,.2)',
          }}>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '.6rem' }}>
              🏠 บันทึกผู้รับ —
              <span style={{ color: '#f59e0b' }}>{shortName(modal.student.name)}</span>
            </div>

            {/* Relation selector */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '.8rem', fontWeight: 700, color: '#374151', marginBottom: '.5rem' }}>
                ความสัมพันธ์ผู้รับ *
              </div>
              <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
                {RELATIONS.map(r => {
                  const isActive = form.relation === r;
                  const c = REL_COLOR[r];
                  return (
                    <button
                      key={r}
                      onClick={() => setForm(f => ({ ...f, relation: r }))}
                      style={{
                        padding: '.35rem .85rem', borderRadius: '10px',
                        border: isActive ? `2px solid ${c.border}` : '1.5px solid #e5e7eb',
                        background: isActive ? c.bg : 'white',
                        color: isActive ? c.color : '#6b7280',
                        fontFamily: 'inherit', fontWeight: 700, fontSize: '.85rem', cursor: 'pointer',
                        transition: 'all .15s',
                      }}
                    >
                      {REL_ICON[r]} {r}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* อื่นๆ fields */}
            {form.relation === 'อื่นๆ' && (
              <div style={{
                background: '#fffbeb', border: '1.5px solid #fde68a',
                borderRadius: '12px', padding: '1rem', marginBottom: '1rem',
              }}>
                <div style={{ fontSize: '.78rem', fontWeight: 700, color: '#92400e', marginBottom: '.65rem' }}>
                  🧑 ระบุข้อมูลผู้รับ (อย่างใดอย่างหนึ่ง) *
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
                  <div>
                    <label style={{ fontSize: '.75rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '.2rem' }}>
                      ชื่อ-นามสกุล
                    </label>
                    <input className="input" placeholder="เช่น นายสมชาย ใจดี"
                      value={form.otherName}
                      onChange={e => setForm(f => ({ ...f, otherName: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ fontSize: '.75rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '.2rem' }}>
                      เบอร์โทรศัพท์
                    </label>
                    <input className="input" placeholder="0xx-xxx-xxxx"
                      value={form.otherPhone}
                      onChange={e => setForm(f => ({ ...f, otherPhone: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ fontSize: '.75rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '.2rem' }}>
                      หมายเลขบัตรประชาชน
                    </label>
                    <input className="input" placeholder="x-xxxx-xxxxx-xx-x" maxLength={17}
                      value={form.otherId}
                      onChange={e => setForm(f => ({ ...f, otherId: e.target.value }))} />
                  </div>
                </div>
              </div>
            )}

            {/* Time + Note row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '.75rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ fontSize: '.78rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '.2rem' }}>
                  ⏰ เวลารับ
                </label>
                <input type="time" className="input"
                  value={form.time}
                  onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: '.78rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '.2rem' }}>
                  📝 หมายเหตุ
                </label>
                <input className="input" placeholder="(ไม่บังคับ)"
                  value={form.note}
                  onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
              </div>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '.6rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setModal(null)}
                style={{
                  padding: '.5rem 1.25rem', borderRadius: '10px',
                  border: '1.5px solid #e5e7eb', background: 'white',
                  color: '#6b7280', fontFamily: 'inherit', fontWeight: 700,
                  fontSize: '.9rem', cursor: 'pointer',
                }}
              >ยกเลิก</button>
              <button
                onClick={saveRecord}
                style={{
                  padding: '.5rem 1.4rem', borderRadius: '10px', border: 'none',
                  background: 'linear-gradient(135deg,#f59e0b,#f97316)',
                  color: 'white', fontFamily: 'inherit', fontWeight: 800,
                  fontSize: '.9rem', cursor: 'pointer',
                }}
              >💾 บันทึก</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
