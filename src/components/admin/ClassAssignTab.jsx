// ClassAssignTab.jsx — จัดนักเรียนเข้าห้องเรียน
// ซ้าย: รายชื่อนักเรียน (multi-select)
// ขวา: ห้องเรียนพร้อมครูประจำชั้น (single-select)
// กดตกลง → อัปเดต className ของนักเรียนที่เลือก

import { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';

const LEVEL_LABEL = { K1: 'อนุบาล 1', K2: 'อนุบาล 2', K3: 'อนุบาล 3' };
const LEVEL_COLOR = { K1: '#7c3aed', K2: '#0891b2', K3: '#059669' };

export default function ClassAssignTab() {
  const { students, setStudents, classes, teachers } = useApp();

  // ── Filter state (ซ้าย) ──────────────────────────────────
  const [showUnassigned, setShowUnassigned] = useState(true);
  const [levelFilter, setLevelFilter]       = useState('all');
  const [search, setSearch]                 = useState('');

  // ── Selection state ──────────────────────────────────────
  const [selectedIds, setSelectedIds]   = useState(new Set());  // student IDs
  const [selectedClass, setSelectedClass] = useState(null);     // class object

  // ── Derive filtered student list ─────────────────────────
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      if (s.name?.startsWith('(ว่าง)')) return false;
      if (showUnassigned && s.className) return false;
      if (levelFilter !== 'all' && s.level !== levelFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const nameMatch    = s.name?.toLowerCase().includes(q);
        const classMatch   = s.className?.toLowerCase().includes(q);
        const nickMatch    = s.nickname?.toLowerCase().includes(q);
        if (!nameMatch && !classMatch && !nickMatch) return false;
      }
      return true;
    }).sort((a, b) => (a.className || '').localeCompare(b.className || '') || (a.name || '').localeCompare(b.name || ''));
  }, [students, showUnassigned, levelFilter, search]);

  // ── Derive class list with live student count ─────────────
  const enrichedClasses = useMemo(() => {
    return classes.map(cls => {
      const teacher = teachers.find(t => String(t.id) === String(cls.teacherId));
      const count   = students.filter(s => s.className === cls.name && !s.name?.startsWith('(ว่าง)')).length;
      return { ...cls, teacherNameResolved: teacher?.name ?? cls.teacherName ?? '—', liveCount: count };
    });
  }, [classes, teachers, students]);

  // Group enriched classes by level
  const classByLevel = useMemo(() => {
    const map = {};
    enrichedClasses.forEach(c => {
      (map[c.level] ??= []).push(c);
    });
    return map;
  }, [enrichedClasses]);

  // ── Handlers ─────────────────────────────────────────────
  const toggleStudent = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === filteredStudents.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredStudents.map(s => s.id)));
    }
  };

  const handleAssign = () => {
    if (!selectedClass || selectedIds.size === 0) return;
    if (!confirm(`กำหนดห้อง "${selectedClass.name}" ให้นักเรียน ${selectedIds.size} คน?`)) return;

    setStudents(students.map(s =>
      selectedIds.has(s.id)
        ? { ...s, className: selectedClass.name, level: selectedClass.level }
        : s
    ));
    setSelectedIds(new Set());
    setSelectedClass(null);
  };

  const handleRemoveClass = (studentId) => {
    if (!confirm('ถอดออกจากห้องเรียนนี้?')) return;
    setStudents(students.map(s =>
      s.id === studentId ? { ...s, className: '' } : s
    ));
  };

  const allSelected = filteredStudents.length > 0 && selectedIds.size === filteredStudents.length;
  const canAssign   = selectedIds.size > 0 && selectedClass;

  return (
    <div className="glass p-6 animate-fade">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="page-header mb-4">
        <h3>🏫 จัดนักเรียนเข้าห้องเรียน</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', flexWrap: 'wrap' }}>
          {selectedIds.size > 0 && (
            <span style={{
              background: '#7c3aed', color: 'white', borderRadius: '20px',
              padding: '.25rem .85rem', fontSize: '.82rem', fontWeight: 700,
            }}>
              เลือกแล้ว {selectedIds.size} คน
            </span>
          )}
          {selectedClass && (
            <span style={{
              background: '#059669', color: 'white', borderRadius: '20px',
              padding: '.25rem .85rem', fontSize: '.82rem', fontWeight: 700,
            }}>
              ห้อง: {selectedClass.name}
            </span>
          )}
          <button
            className="btn btn-primary"
            disabled={!canAssign}
            style={{ opacity: canAssign ? 1 : .45 }}
            onClick={handleAssign}
          >
            ✅ กำหนดห้องเรียน
          </button>
        </div>
      </div>

      {/* ── Instruction banner ───────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg,#ede9fe,#dbeafe)',
        border: '1.5px solid #c4b5fd',
        borderRadius: '12px', padding: '.65rem 1rem',
        marginBottom: '1.25rem', fontSize: '.82rem', color: '#4c1d95',
        display: 'flex', gap: '.5rem', alignItems: 'center',
      }}>
        <span style={{ fontSize: '1.1rem' }}>💡</span>
        <span>
          <strong>วิธีใช้:</strong> (1) เลือกนักเรียน 1 คนขึ้นไปด้านซ้าย →
          (2) คลิกห้องเรียนด้านขวา → (3) กดปุ่ม <strong>กำหนดห้องเรียน</strong>
        </span>
      </div>

      {/* ── Two-column layout ──────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', alignItems: 'start' }}>

        {/* ═══════════════ LEFT: Student list ═══════════════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
          <div style={{
            background: 'white', borderRadius: '14px',
            border: '1.5px solid #e5e7eb', overflow: 'hidden',
          }}>
            {/* Filter bar */}
            <div style={{
              background: '#f9fafb', padding: '.75rem 1rem',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex', flexDirection: 'column', gap: '.5rem',
            }}>
              <div style={{ display: 'flex', gap: '.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '.78rem', fontWeight: 700, color: '#6b7280', flexShrink: 0 }}>
                  รายชื่อนักเรียน
                </span>
                {/* Unassigned / All toggle */}
                <div style={{ display: 'flex', borderRadius: '8px', overflow: 'hidden', border: '1.5px solid #7c3aed', flexShrink: 0 }}>
                  {[
                    { val: true,  label: 'ยังไม่มีห้อง' },
                    { val: false, label: 'ทั้งหมด' },
                  ].map(opt => (
                    <button key={String(opt.val)} type="button"
                      onClick={() => { setShowUnassigned(opt.val); setSelectedIds(new Set()); }}
                      style={{
                        padding: '.25rem .65rem', border: 'none', fontFamily: 'inherit',
                        fontSize: '.75rem', fontWeight: 700, cursor: 'pointer',
                        background: showUnassigned === opt.val ? '#7c3aed' : 'white',
                        color:      showUnassigned === opt.val ? 'white'   : '#7c3aed',
                      }}>
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* Level filter */}
                {['all', 'K1', 'K2', 'K3'].map(lv => (
                  <button key={lv} type="button"
                    onClick={() => { setLevelFilter(lv); setSelectedIds(new Set()); }}
                    style={{
                      padding: '.2rem .55rem', borderRadius: '7px', border: 'none',
                      fontFamily: 'inherit', fontSize: '.73rem', fontWeight: 700, cursor: 'pointer',
                      background: levelFilter === lv ? (LEVEL_COLOR[lv] ?? '#6b7280') : '#f3f4f6',
                      color:      levelFilter === lv ? 'white' : '#6b7280',
                    }}>
                    {lv === 'all' ? 'ทุกระดับ' : LEVEL_LABEL[lv]}
                  </button>
                ))}
              </div>

              {/* Search */}
              <input className="input" style={{ fontSize: '.82rem' }}
                placeholder="🔍 ค้นหาชื่อ / ห้อง..."
                value={search}
                onChange={e => { setSearch(e.target.value); setSelectedIds(new Set()); }}
              />
            </div>

            {/* Select-all row */}
            {filteredStudents.length > 0 && (
              <div style={{
                padding: '.5rem 1rem', borderBottom: '1px solid #f3f4f6',
                display: 'flex', alignItems: 'center', gap: '.5rem',
                background: '#faf5ff',
              }}>
                <input type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#7c3aed' }}
                />
                <span style={{ fontSize: '.78rem', fontWeight: 700, color: '#7c3aed' }}>
                  เลือกทั้งหมด ({filteredStudents.length} คน)
                </span>
                {selectedIds.size > 0 && (
                  <span style={{ marginLeft: 'auto', fontSize: '.73rem', color: '#7c3aed', fontWeight: 700 }}>
                    ✓ {selectedIds.size} คน
                  </span>
                )}
              </div>
            )}

            {/* Student rows */}
            <div style={{ maxHeight: '520px', overflowY: 'auto' }}>
              {filteredStudents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af', fontSize: '.85rem' }}>
                  {showUnassigned ? 'นักเรียนทุกคนมีห้องเรียนแล้ว 🎉' : 'ไม่พบนักเรียน'}
                </div>
              ) : (
                filteredStudents.map((s, idx) => {
                  const isChecked = selectedIds.has(s.id);
                  const levelColor = LEVEL_COLOR[s.level] ?? '#6b7280';
                  return (
                    <div key={s.id}
                      onClick={() => toggleStudent(s.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '.6rem',
                        padding: '.5rem 1rem',
                        background: isChecked ? '#f5f3ff' : (idx % 2 === 0 ? 'white' : '#fafafa'),
                        borderBottom: '1px solid #f3f4f6',
                        cursor: 'pointer', transition: 'background .1s',
                        borderLeft: isChecked ? '3px solid #7c3aed' : '3px solid transparent',
                      }}
                    >
                      <input type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleStudent(s.id)}
                        onClick={e => e.stopPropagation()}
                        style={{ width: '15px', height: '15px', cursor: 'pointer', accentColor: '#7c3aed', flexShrink: 0 }}
                      />
                      {/* Level badge */}
                      <span style={{
                        background: levelColor, color: 'white',
                        borderRadius: '5px', padding: '0 .35rem',
                        fontSize: '.65rem', fontWeight: 800, flexShrink: 0,
                      }}>
                        {s.level}
                      </span>
                      {/* Name */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '.83rem', fontWeight: 600, color: '#1f2937', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {s.name}
                          {s.nickname && <span style={{ color: '#9ca3af', fontWeight: 400, marginLeft: '.35rem' }}>({s.nickname})</span>}
                        </div>
                        {s.className ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '.3rem', marginTop: '.1rem' }}>
                            <span style={{ fontSize: '.7rem', color: '#6b7280' }}>ห้อง: {s.className}</span>
                            <button type="button"
                              onClick={e => { e.stopPropagation(); handleRemoveClass(s.id); }}
                              style={{
                                fontSize: '.63rem', color: '#ef4444', fontWeight: 700,
                                background: '#fee2e2', border: 'none', borderRadius: '4px',
                                padding: '0 .3rem', cursor: 'pointer', fontFamily: 'inherit',
                              }}>
                              ✕ ถอดออก
                            </button>
                          </div>
                        ) : (
                          <div style={{ fontSize: '.7rem', color: '#f59e0b', fontWeight: 600, marginTop: '.1rem' }}>
                            ยังไม่มีห้อง
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* ═══════════════ RIGHT: Class list ════════════════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
          <div style={{
            background: 'white', borderRadius: '14px',
            border: '1.5px solid #e5e7eb', overflow: 'hidden',
          }}>
            {/* Header */}
            <div style={{
              background: '#f9fafb', padding: '.75rem 1rem',
              borderBottom: '1px solid #e5e7eb',
            }}>
              <span style={{ fontSize: '.78rem', fontWeight: 700, color: '#6b7280' }}>
                เลือกห้องเรียนปลายทาง
              </span>
            </div>

            <div style={{ padding: '.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {Object.entries(classByLevel).map(([level, classList]) => (
                <div key={level}>
                  {/* Level group header */}
                  <div style={{
                    fontSize: '.72rem', fontWeight: 800, color: LEVEL_COLOR[level] ?? '#6b7280',
                    textTransform: 'uppercase', letterSpacing: '.06em',
                    paddingBottom: '.3rem', marginBottom: '.45rem',
                    borderBottom: `2px solid ${LEVEL_COLOR[level] ?? '#e5e7eb'}30`,
                  }}>
                    {LEVEL_LABEL[level] ?? level}
                  </div>

                  {/* Class cards */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '.45rem' }}>
                    {classList.map(cls => {
                      const isActive = selectedClass?.id === cls.id;
                      const color    = LEVEL_COLOR[cls.level] ?? '#6b7280';
                      return (
                        <div key={cls.id}
                          onClick={() => setSelectedClass(isActive ? null : cls)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '.75rem',
                            padding: '.65rem .9rem', borderRadius: '10px',
                            border: isActive ? `2px solid ${color}` : '1.5px solid #e5e7eb',
                            background: isActive ? `${color}10` : 'white',
                            cursor: 'pointer', transition: 'all .15s',
                            boxShadow: isActive ? `0 3px 10px ${color}25` : 'none',
                          }}
                        >
                          {/* Radio circle */}
                          <div style={{
                            width: '18px', height: '18px', borderRadius: '50%',
                            border: `2px solid ${isActive ? color : '#d1d5db'}`,
                            background: isActive ? color : 'white',
                            flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            {isActive && <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'white' }} />}
                          </div>

                          {/* Class name badge */}
                          <div style={{
                            background: isActive ? color : '#f3f4f6',
                            color: isActive ? 'white' : '#374151',
                            borderRadius: '8px', padding: '.3rem .7rem',
                            fontWeight: 800, fontSize: '.88rem', flexShrink: 0,
                            minWidth: '60px', textAlign: 'center',
                          }}>
                            {cls.name}
                          </div>

                          {/* Teacher + count */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '.8rem', fontWeight: 600, color: '#1f2937', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {cls.teacherNameResolved}
                            </div>
                            <div style={{ fontSize: '.72rem', color: '#9ca3af', marginTop: '.1rem' }}>
                              นักเรียน {cls.liveCount} คน
                            </div>
                          </div>

                          {isActive && (
                            <span style={{ fontSize: '1rem', flexShrink: 0 }}>✅</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {enrichedClasses.length === 0 && (
                <div style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem', fontSize: '.85rem' }}>
                  ยังไม่มีห้องเรียน กรุณาเพิ่มห้องเรียนก่อน
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom action bar ───────────────────────────────── */}
      {canAssign && (
        <div style={{
          marginTop: '1.25rem', padding: '1rem 1.25rem',
          background: 'linear-gradient(135deg,#7c3aed,#6d28d9)',
          borderRadius: '14px', display: 'flex',
          alignItems: 'center', justifyContent: 'space-between',
          gap: '1rem', flexWrap: 'wrap',
          boxShadow: '0 6px 20px #7c3aed35',
        }}>
          <div style={{ color: 'white', fontSize: '.88rem' }}>
            <span style={{ fontWeight: 800, fontSize: '1rem' }}>
              นักเรียน {selectedIds.size} คน
            </span>
            {' '}→ ห้อง{' '}
            <span style={{ fontWeight: 800, fontSize: '1rem' }}>
              {selectedClass.name}
            </span>
            {' '}(ครู: {selectedClass.teacherNameResolved})
          </div>
          <button
            className="btn"
            onClick={handleAssign}
            style={{
              background: 'white', color: '#7c3aed',
              fontWeight: 800, fontSize: '.9rem',
              padding: '.5rem 1.5rem', borderRadius: '10px',
              border: 'none', cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,.15)',
            }}>
            ✅ กำหนดห้องเรียน
          </button>
        </div>
      )}
    </div>
  );
}
