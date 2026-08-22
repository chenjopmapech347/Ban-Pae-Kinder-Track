// AssignInnerCornersTab.jsx — กำหนดกิจกรรมภายในห้องเรียนของแต่ละห้องเรียน
// รองรับการกำหนดวันและเวลาสำหรับแต่ละกิจกรรม
import { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';

const DAYS = [
  { key: 'จันทร์',    label: 'จ.' },
  { key: 'อังคาร',   label: 'อ.' },
  { key: 'พุธ',      label: 'พ.' },
  { key: 'พฤหัสบดี', label: 'พฤ.' },
  { key: 'ศุกร์',    label: 'ศ.' },
];

// Backward compat: old format was string[], new is {key, days, time}[]
function normalizeEntries(stored) {
  if (!stored || stored.length === 0) return stored ?? [];
  if (typeof stored[0] === 'string') {
    return stored.map(key => ({ key, days: [], time: '' }));
  }
  return stored;
}

export default function AssignInnerCornersTab() {
  const {
    innerCornerDefs,
    classInnerCornerKeys,
    setClassInnerCornerKeys,
    allClassNames,
  } = useApp();

  const classNames = useMemo(
    () => (allClassNames ?? []).filter(Boolean),
    [allClassNames],
  );

  const [selectedClass, setSelectedClass] = useState('');

  function getEntriesForClass(cls) {
    if (!cls) return [];
    const stored = classInnerCornerKeys[cls];
    if (!stored) {
      // default: all activities selected, no days/time configured yet
      return innerCornerDefs.map(d => ({ key: d.key, days: [], time: '' }));
    }
    return normalizeEntries(stored);
  }

  const currentEntries = selectedClass ? getEntriesForClass(selectedClass) : [];

  function isChecked(key) {
    return currentEntries.some(e => e.key === key);
  }

  function toggle(key) {
    if (!selectedClass) return;
    const entries = getEntriesForClass(selectedClass);
    const exists = entries.some(e => e.key === key);
    const next = exists
      ? entries.filter(e => e.key !== key)
      : [...entries, { key, days: [], time: '' }];
    setClassInnerCornerKeys(prev => ({ ...prev, [selectedClass]: next }));
  }

  function updateDays(key, day) {
    if (!selectedClass) return;
    const entries = getEntriesForClass(selectedClass);
    const next = entries.map(e => {
      if (e.key !== key) return e;
      const days = (e.days ?? []).includes(day)
        ? e.days.filter(d => d !== day)
        : [...(e.days ?? []), day];
      return { ...e, days };
    });
    setClassInnerCornerKeys(prev => ({ ...prev, [selectedClass]: next }));
  }

  function updateTime(key, time) {
    if (!selectedClass) return;
    const entries = getEntriesForClass(selectedClass);
    const next = entries.map(e => e.key === key ? { ...e, time } : e);
    setClassInnerCornerKeys(prev => ({ ...prev, [selectedClass]: next }));
  }

  function selectAll() {
    if (!selectedClass) return;
    const existing = getEntriesForClass(selectedClass);
    const next = innerCornerDefs.map(d => {
      const found = existing.find(e => e.key === d.key);
      return found ?? { key: d.key, days: [], time: '' };
    });
    setClassInnerCornerKeys(prev => ({ ...prev, [selectedClass]: next }));
  }

  function selectNone() {
    if (!selectedClass) return;
    setClassInnerCornerKeys(prev => ({ ...prev, [selectedClass]: [] }));
  }

  function resetToDefault() {
    if (!selectedClass) return;
    if (!window.confirm('รีเซ็ตเป็นเลือกทั้งหมด (ค่าเริ่มต้น)?')) return;
    setClassInnerCornerKeys(prev => {
      const n = { ...prev };
      delete n[selectedClass];
      return n;
    });
  }

  const selectedCount = currentEntries.length;
  const totalCount    = innerCornerDefs.length;
  const isDefault     = !classInnerCornerKeys[selectedClass];

  // Count entries that have both days + time configured
  const scheduledCount = currentEntries.filter(e => e.days?.length > 0 && e.time).length;

  return (
    <div className="glass p-6 animate-fade">
      {/* Header */}
      <div className="page-header mb-4">
        <div>
          <h3>🏡 กำหนดกิจกรรมภายในห้องเรียน</h3>
          <p className="text-xs text-muted" style={{ marginTop: '.25rem' }}>
            เลือกกิจกรรม พร้อมกำหนด<strong>วัน</strong>และ<strong>เวลา</strong>สำหรับแต่ละห้องเรียน
          </p>
        </div>
        {selectedClass && (
          <div style={{
            background: '#f0fdf4', border: '1.5px solid #86efac',
            borderRadius: '10px', padding: '.4rem .85rem',
            color: '#15803d', fontWeight: 700, fontSize: '.85rem',
            display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '.15rem',
          }}>
            <span>{selectedCount} / {totalCount} มุม</span>
            {scheduledCount > 0 && (
              <span style={{ fontSize: '.75rem', color: '#15803d', fontWeight: 600 }}>
                📅 กำหนดตาราง {scheduledCount} กิจกรรม
              </span>
            )}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>

        {/* ── Left: class list ── */}
        <div style={{ minWidth: '180px', flexShrink: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '.82rem', color: '#6b7280',
                        marginBottom: '.5rem', textTransform: 'uppercase' }}>
            ห้องเรียน
          </div>
          {classNames.length === 0 ? (
            <p className="text-muted text-sm">ยังไม่มีห้องเรียน</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.3rem' }}>
              {classNames.map(cls => {
                const stored  = classInnerCornerKeys[cls];
                const entries = stored ? normalizeEntries(stored) : null;
                const count   = entries ? entries.length : innerCornerDefs.length;
                const sched   = entries ? entries.filter(e => e.days?.length > 0 && e.time).length : 0;
                const isActive = cls === selectedClass;
                return (
                  <button
                    key={cls}
                    onClick={() => setSelectedClass(cls)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '.5rem .75rem', borderRadius: '10px', cursor: 'pointer',
                      fontFamily: 'inherit', fontSize: '.88rem',
                      fontWeight: isActive ? 700 : 500,
                      border: `1.5px solid ${isActive ? '#4ade80' : '#e5e7eb'}`,
                      background: isActive ? '#f0fdf4' : 'white',
                      color: isActive ? '#15803d' : '#374151',
                      textAlign: 'left',
                    }}
                  >
                    <div>
                      <div>{cls}</div>
                      {sched > 0 && (
                        <div style={{ fontSize: '.68rem', color: isActive ? '#15803d' : '#9ca3af', fontWeight: 600 }}>
                          📅 {sched} ตาราง
                        </div>
                      )}
                    </div>
                    <span style={{
                      fontSize: '.72rem', fontWeight: 700, flexShrink: 0, marginLeft: '.35rem',
                      background: isActive ? '#4ade80' : '#f3f4f6',
                      color: isActive ? '#14532d' : '#6b7280',
                      borderRadius: '999px', padding: '0 .45rem',
                    }}>
                      {count}/{innerCornerDefs.length}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Right: activity grid ── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {!selectedClass ? (
            <div style={{
              padding: '3rem', textAlign: 'center', color: '#9ca3af',
              border: '2px dashed #e5e7eb', borderRadius: '14px', fontSize: '.9rem',
            }}>
              👈 เลือกห้องเรียนด้านซ้ายเพื่อกำหนดกิจกรรม
            </div>
          ) : (
            <>
              {/* Toolbar */}
              <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1rem',
                            flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: '.95rem', color: '#15803d' }}>
                  🏡 {selectedClass}
                </span>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '.4rem' }}>
                  <button
                    onClick={selectAll}
                    style={{ padding: '.3rem .75rem', borderRadius: '8px', border: 'none',
                             cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700,
                             fontSize: '.78rem', background: '#dcfce7', color: '#15803d' }}
                  >เลือกทั้งหมด</button>
                  <button
                    onClick={selectNone}
                    style={{ padding: '.3rem .75rem', borderRadius: '8px', border: 'none',
                             cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700,
                             fontSize: '.78rem', background: '#fee2e2', color: '#991b1b' }}
                  >ล้างทั้งหมด</button>
                  {!isDefault && (
                    <button
                      onClick={resetToDefault}
                      style={{ padding: '.3rem .75rem', borderRadius: '8px',
                               border: '1px solid #e5e7eb', cursor: 'pointer',
                               fontFamily: 'inherit', fontWeight: 700,
                               fontSize: '.78rem', background: 'white', color: '#6b7280' }}
                    >↺ รีเซ็ต</button>
                  )}
                </div>
              </div>

              {innerCornerDefs.length === 0 ? (
                <p className="text-muted text-sm">
                  ยังไม่มีมุมประสบการณ์ — กรุณาเพิ่มใน "จัดการกิจกรรมภายในห้องเรียน" ก่อน
                </p>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
                  gap: '.5rem',
                }}>
                  {innerCornerDefs.map(def => {
                    const checked   = isChecked(def.key);
                    const entry     = currentEntries.find(e => e.key === def.key);
                    const entryDays = entry?.days ?? [];
                    const entryTime = entry?.time ?? '';
                    return (
                      <div
                        key={def.key}
                        style={{
                          borderRadius: '10px', padding: '.6rem .8rem',
                          background: checked ? '#f0fdf4' : 'white',
                          border: `1.5px solid ${checked ? '#4ade80' : '#e5e7eb'}`,
                          transition: 'all .12s',
                        }}
                      >
                        {/* Checkbox row */}
                        <label style={{ display: 'flex', alignItems: 'center',
                                        gap: '.6rem', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggle(def.key)}
                            style={{ width: '16px', height: '16px',
                                     accentColor: '#16a34a', cursor: 'pointer', flexShrink: 0 }}
                          />
                          <span style={{
                            fontWeight: checked ? 700 : 500, fontSize: '.88rem',
                            color: checked ? '#15803d' : '#374151',
                          }}>
                            {def.label}
                          </span>
                          {checked && entryDays.length > 0 && entryTime && (
                            <span style={{
                              marginLeft: 'auto', fontSize: '.68rem', fontWeight: 700,
                              background: '#dcfce7', color: '#15803d',
                              borderRadius: '99px', padding: '1px 7px', flexShrink: 0,
                            }}>
                              ✔ มีตาราง
                            </span>
                          )}
                        </label>

                        {/* Day + time — shown when checked */}
                        {checked && (
                          <div style={{
                            marginTop: '.6rem', paddingTop: '.55rem',
                            borderTop: '1px solid #bbf7d0',
                          }}>
                            {/* Day toggles */}
                            <div style={{
                              fontSize: '.7rem', color: '#6b7280',
                              fontWeight: 700, marginBottom: '.3rem',
                            }}>
                              📅 วันที่ใช้งาน
                            </div>
                            <div style={{ display: 'flex', gap: '.25rem',
                                          flexWrap: 'wrap', marginBottom: '.5rem' }}>
                              {DAYS.map(d => {
                                const active = entryDays.includes(d.key);
                                return (
                                  <button
                                    key={d.key}
                                    onClick={() => updateDays(def.key, d.key)}
                                    style={{
                                      padding: '3px 9px', borderRadius: '20px',
                                      border: 'none', cursor: 'pointer',
                                      fontSize: '.74em', fontWeight: 700,
                                      background: active ? '#16a34a' : '#dcfce7',
                                      color: active ? 'white' : '#15803d',
                                      transition: 'all .12s',
                                    }}
                                  >
                                    {d.label}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Time input */}
                            <div style={{
                              fontSize: '.7rem', color: '#6b7280',
                              fontWeight: 700, marginBottom: '.25rem',
                            }}>
                              ⏰ เวลาเริ่ม
                            </div>
                            <input
                              type="text"
                              value={entryTime}
                              onChange={e => updateTime(def.key, e.target.value)}
                              placeholder="เช่น 09.00"
                              style={{
                                width: '100%', padding: '5px 9px',
                                borderRadius: '7px',
                                border: `1.5px solid ${entryTime ? '#4ade80' : '#bbf7d0'}`,
                                fontSize: '.82em', fontFamily: 'inherit',
                                outline: 'none', boxSizing: 'border-box',
                                background: 'white', color: '#15803d',
                              }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <p className="text-xs text-muted" style={{ marginTop: '.85rem' }}>
                💡 ข้อมูลบันทึกทันที — วัน/เวลาที่กำหนดจะใช้ใน "เติมตารางอัตโนมัติ" ในหน้าตารางกิจกรรม
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
