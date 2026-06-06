import { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { getDayRecord } from '../../utils/attendance';
import { todayISO, formatDateThai } from '../../utils/helpers';

const ALL_CLASSES = ['อ.1/1', 'อ.1/2', 'อ.2/1', 'อ.2/2', 'อ.3/1', 'อ.3/2', 'อ.3/3'];

const ATT_OPTS  = ['มา', 'ขาด', 'ลา', 'ป่วย'];
const ATT_COLOR = {
  มา:   { bg: '#d1fae5', color: '#065f46', dot: '#10b981' },
  ขาด:  { bg: '#fee2e2', color: '#991b1b', dot: '#ef4444' },
  ลา:   { bg: '#fef3c7', color: '#92400e', dot: '#f59e0b' },
  ป่วย: { bg: '#dbeafe', color: '#1e40af', dot: '#3b82f6' },
  '-':  { bg: '#f5f3ff', color: '#6b7280', dot: '#d1d5db' },
};

const LUNCH_OPTS  = ['หมด', 'เกือบหมด', 'ครึ่งเดียว', 'ไม่ทาน'];
const LUNCH_COLOR = { หมด: '#10b981', เกือบหมด: '#34d399', ครึ่งเดียว: '#f59e0b', ไม่ทาน: '#ef4444' };

// ── Ticker — เวลาปัจจุบัน ──────────────────────────────────────────────
function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}>
      {now.toLocaleTimeString('th-TH')}
    </span>
  );
}

// ── แถบสรุปรายห้อง ─────────────────────────────────────────────────────
function ClassSummaryBar({ counts, total }) {
  const { มา = 0, ขาด = 0, ลา = 0, ป่วย = 0 } = counts;
  const notIn = ขาด + ลา + ป่วย;
  const pct   = total ? Math.round((มา / total) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', flexWrap: 'wrap' }}>
      {[
        { label: 'มา',   val: มา,   bg: '#d1fae5', color: '#065f46' },
        { label: 'ขาด',  val: ขาด,  bg: '#fee2e2', color: '#991b1b' },
        { label: 'ลา',   val: ลา,   bg: '#fef3c7', color: '#92400e' },
        { label: 'ป่วย', val: ป่วย, bg: '#dbeafe', color: '#1e40af' },
        { label: 'ยังไม่บันทึก', val: total - มา - notIn, bg: '#f5f3ff', color: '#6b7280' },
      ].map(r => r.val > 0 && (
        <span key={r.label} style={{
          background: r.bg, color: r.color,
          borderRadius: '8px', padding: '.15rem .6rem',
          fontWeight: 800, fontSize: '.78rem',
        }}>{r.label} {r.val}</span>
      ))}
      <span style={{ marginLeft: 'auto', fontWeight: 800, fontSize: '.85rem',
        color: pct >= 80 ? '#065f46' : pct >= 60 ? '#92400e' : '#991b1b' }}>
        {pct}%
      </span>
    </div>
  );
}

export default function AttendanceTab({ defaultClass }) {
  const { students, dailyRecords, teachers, saveDailyAttendance } = useApp();

  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [filterClass,  setFilterClass]  = useState(defaultClass ?? 'ทั้งหมด');
  const [viewMode,     setViewMode]     = useState('card');  // 'card' | 'table'
  const [showHygiene,  setShowHygiene]  = useState(false);
  const [markingClass, setMarkingClass] = useState(null);   // cls being bulk-marked

  // bulk mark ห้องทั้งห้องเป็น "มา"
  const handleMarkAllPresent = (cls) => {
    const clsStudents = students.filter(s => s.className === cls && !s.name.startsWith('(ว่าง)'));
    if (!clsStudents.length) return;
    const patch = {};
    clsStudents.forEach(s => { patch[s.id] = { attendance: 'มา' }; });
    saveDailyAttendance(selectedDate, patch);
    setMarkingClass(null);
  };

  const isToday = selectedDate === todayISO();
  const dateLabel = formatDateThai(selectedDate);

  // ── กรองห้องที่แสดง ────────────────────────────────────────────────
  const displayClasses = filterClass === 'ทั้งหมด' ? ALL_CLASSES : [filterClass];

  // ── สรุปรวมทุกห้อง ─────────────────────────────────────────────────
  const grandSummary = useMemo(() => {
    const real = students.filter(s => !s.name.startsWith('(ว่าง)'));
    const counts = { มา: 0, ขาด: 0, ลา: 0, ป่วย: 0, none: 0 };
    real.forEach(s => {
      const r = getDayRecord(dailyRecords, selectedDate, s.id);
      const att = r?.attendance;
      if (att && counts[att] !== undefined) counts[att]++;
      else counts.none++;
    });
    return { counts, total: real.length };
  }, [students, dailyRecords, selectedDate]);

  // ── ข้อมูลรายห้อง ─────────────────────────────────────────────────
  const classSections = useMemo(() => {
    return displayClasses.map(cls => {
      const sts = students.filter(s => s.className === cls && !s.name.startsWith('(ว่าง)'));
      const teacher = teachers?.find(t => t.className === cls);
      const rows = sts.map(s => {
        const rec = getDayRecord(dailyRecords, selectedDate, s.id);
        return { ...s, rec };
      });
      const counts = {};
      ATT_OPTS.forEach(o => { counts[o] = rows.filter(r => r.rec?.attendance === o).length; });
      return { cls, teacher, rows, counts, total: sts.length };
    });
  }, [displayClasses, students, dailyRecords, selectedDate, teachers]);

  return (
    <div className="animate-fade">
      {/* ── Header ── */}
      <div style={{
        background: 'linear-gradient(135deg,#7c3aed,#a855f7)',
        borderRadius: '16px', padding: '1.25rem 1.5rem',
        color: 'white', marginBottom: '1.25rem',
        display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '.25rem' }}>
            📅 การมาเรียนรายนักเรียน
          </div>
          <div style={{ opacity: .85, fontSize: '.83rem' }}>
            {isToday ? '🟢 วันนี้ — ' : ''}{dateLabel} · <LiveClock />
          </div>
        </div>

        {/* Grand summary pills */}
        <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
          {[
            { label: 'มา',   val: grandSummary.counts.มา,   bg: 'rgba(16,185,129,.25)' },
            { label: 'ขาด',  val: grandSummary.counts.ขาด,  bg: 'rgba(239,68,68,.25)' },
            { label: 'ลา',   val: grandSummary.counts.ลา,   bg: 'rgba(245,158,11,.25)' },
            { label: 'ป่วย', val: grandSummary.counts.ป่วย, bg: 'rgba(59,130,246,.25)' },
            { label: 'ยังไม่บันทึก', val: grandSummary.counts.none, bg: 'rgba(255,255,255,.15)' },
          ].map(p => (
            <div key={p.label} style={{
              background: p.bg, borderRadius: '10px',
              padding: '.3rem .7rem', textAlign: 'center',
            }}>
              <div style={{ fontWeight: 900, fontSize: '1.1rem' }}>{p.val}</div>
              <div style={{ fontSize: '.65rem', opacity: .9 }}>{p.label}</div>
            </div>
          ))}
          <div style={{
            background: 'rgba(255,255,255,.2)', borderRadius: '10px',
            padding: '.3rem .7rem', textAlign: 'center',
          }}>
            <div style={{ fontWeight: 900, fontSize: '1.1rem' }}>{grandSummary.total}</div>
            <div style={{ fontSize: '.65rem', opacity: .9 }}>ทั้งหมด</div>
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
        {/* Date picker */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
          <span style={{ fontSize: '.8rem', fontWeight: 700, color: '#6b7280' }}>📅 วันที่</span>
          <input type="date" className="input" style={{ width: '170px', fontSize: '.85rem' }}
            value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
          {!isToday && (
            <button className="btn btn-sm" onClick={() => setSelectedDate(todayISO())}
              style={{ fontSize: '.75rem' }}>วันนี้</button>
          )}
        </div>

        {/* Class filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
          <span style={{ fontSize: '.8rem', fontWeight: 700, color: '#6b7280' }}>🏫 ห้อง</span>
          <select className="input" style={{ width: '120px', fontSize: '.85rem' }}
            value={filterClass} onChange={e => setFilterClass(e.target.value)}>
            <option value="ทั้งหมด">ทั้งหมด</option>
            {ALL_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Hygiene toggle */}
        <label style={{ display: 'flex', alignItems: 'center', gap: '.4rem',
          cursor: 'pointer', fontSize: '.83rem', fontWeight: 600, userSelect: 'none' }}>
          <input type="checkbox" checked={showHygiene}
            onChange={e => setShowHygiene(e.target.checked)} />
          🥛 แสดงกิจวัตร
        </label>

        {/* View mode */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '.35rem' }}>
          {[{ id: 'card', icon: '⊞' }, { id: 'table', icon: '☰' }].map(v => (
            <button key={v.id} type="button"
              onClick={() => setViewMode(v.id)}
              style={{
                border: 'none', borderRadius: '8px', padding: '.3rem .6rem',
                fontFamily: 'inherit', fontSize: '1rem', cursor: 'pointer',
                background: viewMode === v.id ? '#7c3aed' : '#f3f4f6',
                color: viewMode === v.id ? 'white' : '#6b7280',
              }}>{v.icon}</button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {classSections.map(({ cls, teacher, rows, counts, total }) => (
          <div key={cls} className="glass-card" style={{ padding: '1rem 1.25rem' }}>
            {/* Class header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem',
              marginBottom: '.85rem', flexWrap: 'wrap' }}>
              <div style={{
                background: 'linear-gradient(135deg,#7c3aed,#a855f7)',
                color: 'white', borderRadius: '10px', padding: '.25rem .75rem',
                fontWeight: 800, fontSize: '.9rem', flexShrink: 0,
              }}>
                🏫 ห้อง {cls}
              </div>
              {teacher && (
                <span style={{ fontSize: '.8rem', color: '#6b7280', fontWeight: 600 }}>
                  👩‍🏫 {teacher.name}
                </span>
              )}
              <div style={{ flex: 1, minWidth: '200px' }}>
                <ClassSummaryBar counts={counts} total={total} />
              </div>
              {/* ── ปุ่มเลือกทั้งหมด ── */}
              {markingClass === cls ? (
                <div style={{ display: 'flex', gap: '.4rem', flexShrink: 0 }}>
                  <span style={{ fontSize: '.78rem', fontWeight: 700, color: '#374151', alignSelf: 'center' }}>
                    ยืนยันเช็คชื่อทั้งห้อง?
                  </span>
                  <button
                    onClick={() => handleMarkAllPresent(cls)}
                    style={{
                      padding: '.25rem .7rem', borderRadius: '8px', border: 'none',
                      background: '#10b981', color: 'white', fontFamily: 'inherit',
                      fontWeight: 700, fontSize: '.75rem', cursor: 'pointer',
                    }}
                  >✅ ยืนยัน</button>
                  <button
                    onClick={() => setMarkingClass(null)}
                    style={{
                      padding: '.25rem .7rem', borderRadius: '8px', border: '1.5px solid #e5e7eb',
                      background: 'white', color: '#6b7280', fontFamily: 'inherit',
                      fontWeight: 700, fontSize: '.75rem', cursor: 'pointer',
                    }}
                  >ยกเลิก</button>
                </div>
              ) : (
                <button
                  onClick={() => setMarkingClass(cls)}
                  style={{
                    padding: '.25rem .75rem', borderRadius: '8px', flexShrink: 0,
                    border: '1.5px solid #10b981', background: '#f0fdf4',
                    color: '#065f46', fontFamily: 'inherit',
                    fontWeight: 700, fontSize: '.75rem', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '.3rem',
                  }}
                >
                  ☑️ เลือกทั้งหมด (มา)
                </button>
              )}
            </div>

            {/* Progress bar */}
            <div style={{
              height: '6px', borderRadius: '99px', background: '#f3f4f6', marginBottom: '1rem', overflow: 'hidden',
              display: 'flex', gap: '2px',
            }}>
              {ATT_OPTS.map(o => counts[o] > 0 && (
                <div key={o} style={{
                  height: '100%',
                  width: `${(counts[o] / total) * 100}%`,
                  background: ATT_COLOR[o].dot,
                  borderRadius: '99px', transition: 'width .4s',
                }} />
              ))}
            </div>

            {/* CARD MODE */}
            {viewMode === 'card' && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '.5rem',
              }}>
                {rows.map((s, idx) => {
                  const att = s.rec?.attendance;
                  const c   = att ? (ATT_COLOR[att] ?? ATT_COLOR['-']) : ATT_COLOR['-'];
                  const isBoy = s.name.includes('ชาย');
                  return (
                    <div key={s.id} style={{
                      background: c.bg, borderRadius: '12px',
                      padding: '.6rem .85rem',
                      display: 'flex', alignItems: 'center', gap: '.6rem',
                      border: `1.5px solid ${att ? c.dot + '40' : '#e5e7eb'}`,
                    }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                        background: isBoy ? '#dbeafe' : '#fce7f3',
                        color: isBoy ? '#1e40af' : '#9d174d',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '.9rem', fontWeight: 800,
                      }}>
                        {idx + 1}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontWeight: 700, fontSize: '.78rem', color: c.color,
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                          {s.name.replace('เด็กชาย', 'ด.ช.').replace('เด็กหญิง', 'ด.ญ.')}
                        </div>
                        <div style={{ fontSize: '.7rem', color: c.color, opacity: .8, marginTop: '.1rem' }}>
                          {att ?? '⏳ ยังไม่บันทึก'}
                        </div>
                        {showHygiene && att && (
                          <div style={{ display: 'flex', gap: '.25rem', marginTop: '.25rem', flexWrap: 'wrap' }}>
                            {s.rec?.milk  && <span style={{ fontSize: '.65rem', background: '#d1fae5', color: '#065f46', borderRadius: '5px', padding: '0 .3rem' }}>🥛</span>}
                            {s.rec?.brush && <span style={{ fontSize: '.65rem', background: '#dbeafe', color: '#1e40af', borderRadius: '5px', padding: '0 .3rem' }}>🪥</span>}
                            {s.rec?.lunch && (
                              <span style={{ fontSize: '.6rem', borderRadius: '5px', padding: '0 .3rem',
                                background: '#fef3c7', color: '#92400e' }}>
                                🍱{s.rec.lunch}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      {att && (
                        <div style={{
                          width: 10, height: 10, borderRadius: '50%',
                          background: c.dot, flexShrink: 0,
                        }} />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* TABLE MODE */}
            {viewMode === 'table' && (
              <div className="table-wrap">
                <table className="table" style={{ fontSize: '.83rem' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '36px' }}>#</th>
                      <th>ชื่อ-นามสกุล</th>
                      <th style={{ width: '90px', textAlign: 'center' }}>สถานะ</th>
                      {showHygiene && <>
                        <th style={{ width: '60px', textAlign: 'center' }}>🥛 นม</th>
                        <th style={{ width: '60px', textAlign: 'center' }}>🪥 ฟัน</th>
                        <th style={{ width: '100px', textAlign: 'center' }}>🍱 อาหาร</th>
                      </>}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((s, idx) => {
                      const att = s.rec?.attendance;
                      const c   = att ? (ATT_COLOR[att] ?? ATT_COLOR['-']) : ATT_COLOR['-'];
                      return (
                        <tr key={s.id} className="hover-row">
                          <td style={{ color: 'var(--text-muted)', textAlign: 'center' }}>{idx + 1}</td>
                          <td style={{ fontWeight: 600 }}>
                            {s.name.replace('เด็กชาย', 'ด.ช.').replace('เด็กหญิง', 'ด.ญ.')}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {att ? (
                              <span style={{
                                background: c.bg, color: c.color,
                                borderRadius: '8px', padding: '.15rem .55rem',
                                fontWeight: 700, fontSize: '.78rem',
                              }}>{att}</span>
                            ) : (
                              <span style={{ color: '#d1d5db', fontSize: '.78rem' }}>⏳</span>
                            )}
                          </td>
                          {showHygiene && <>
                            <td style={{ textAlign: 'center' }}>
                              {s.rec?.milk ? '✅' : <span style={{ color: '#d1d5db' }}>—</span>}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {s.rec?.brush ? '✅' : <span style={{ color: '#d1d5db' }}>—</span>}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {s.rec?.lunch ? (
                                <span style={{
                                  fontSize: '.75rem', borderRadius: '6px', padding: '.1rem .4rem',
                                  background: '#fef3c7', color: '#92400e', fontWeight: 600,
                                }}>{s.rec.lunch}</span>
                              ) : <span style={{ color: '#d1d5db' }}>—</span>}
                            </td>
                          </>}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {rows.length === 0 && (
              <div className="text-center text-muted" style={{ padding: '1.5rem' }}>
                ไม่มีนักเรียนในห้องนี้
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Legend ── */}
      <div style={{
        marginTop: '1rem', display: 'flex', gap: '.75rem', flexWrap: 'wrap',
        padding: '.6rem 1rem', background: '#f9fafb', borderRadius: '10px',
        border: '1px solid #e5e7eb',
      }}>
        {ATT_OPTS.map(o => (
          <span key={o} style={{ display: 'flex', alignItems: 'center', gap: '.35rem', fontSize: '.78rem', color: '#6b7280' }}>
            <span style={{
              width: 10, height: 10, borderRadius: '50%',
              background: ATT_COLOR[o].dot, display: 'inline-block',
            }} />
            {o}
          </span>
        ))}
        <span style={{ display: 'flex', alignItems: 'center', gap: '.35rem', fontSize: '.78rem', color: '#6b7280' }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#d1d5db', display: 'inline-block' }} />
          ยังไม่บันทึก
        </span>
        <span style={{ marginLeft: 'auto', fontSize: '.72rem', color: '#9ca3af', fontStyle: 'italic' }}>
          🔄 ข้อมูลอัปเดตจาก localStorage อัตโนมัติ
        </span>
      </div>
    </div>
  );
}
