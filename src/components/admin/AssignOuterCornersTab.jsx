// AssignOuterCornersTab.jsx — กำหนดกิจกรรมภายนอกห้องเรียนของแต่ละห้องเรียน
// ใช้เลือกว่าห้องเรียนไหนใช้แหล่งเรียนรู้ไหนบ้าง
import { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';

export default function AssignOuterCornersTab() {
  const {
    cornerDefs,
    classOuterCornerKeys,
    setClassOuterCornerKeys,
    allClassNames,
  } = useApp();

  const classNames = useMemo(
    () => (allClassNames ?? []).filter(Boolean),
    [allClassNames],
  );

  const [selectedClass, setSelectedClass] = useState('');

  function getKeysForClass(cls) {
    if (!cls) return [];
    const stored = classOuterCornerKeys[cls];
    if (!stored) return cornerDefs.map(d => d.key); // default = ทั้งหมด
    return stored;
  }

  const currentKeys = selectedClass ? getKeysForClass(selectedClass) : [];

  function isChecked(key) {
    return currentKeys.includes(key);
  }

  function toggle(key) {
    if (!selectedClass) return;
    const current = getKeysForClass(selectedClass);
    const next = current.includes(key)
      ? current.filter(k => k !== key)
      : [...current, key];
    setClassOuterCornerKeys(prev => ({ ...prev, [selectedClass]: next }));
  }

  function selectAll() {
    if (!selectedClass) return;
    setClassOuterCornerKeys(prev => ({
      ...prev,
      [selectedClass]: cornerDefs.map(d => d.key),
    }));
  }

  function selectNone() {
    if (!selectedClass) return;
    setClassOuterCornerKeys(prev => ({ ...prev, [selectedClass]: [] }));
  }

  function resetToDefault() {
    if (!selectedClass) return;
    if (!window.confirm('รีเซ็ตเป็นเลือกทั้งหมด (ค่าเริ่มต้น)?')) return;
    setClassOuterCornerKeys(prev => {
      const n = { ...prev };
      delete n[selectedClass];
      return n;
    });
  }

  const selectedCount = currentKeys.length;
  const totalCount = cornerDefs.length;
  const isDefault = !classOuterCornerKeys[selectedClass];

  return (
    <div className="glass p-6 animate-fade">
      {/* Header */}
      <div className="page-header mb-4">
        <div>
          <h3>🌿 กำหนดกิจกรรมภายนอกห้องเรียน</h3>
          <p className="text-xs text-muted" style={{ marginTop: '.25rem' }}>
            เลือกว่าแต่ละห้องเรียนจะใช้แหล่งเรียนรู้ไหนบ้าง — จะแสดงเฉพาะที่เลือกในแบบบันทึก
          </p>
        </div>
        {selectedClass && (
          <div style={{
            background: '#eff6ff', border: '1.5px solid #93c5fd',
            borderRadius: '10px', padding: '.4rem .85rem',
            color: '#1d4ed8', fontWeight: 700, fontSize: '.85rem',
          }}>
            {selectedCount} / {totalCount} แหล่ง
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>

        {/* ── ซ้าย: เลือกห้องเรียน ── */}
        <div style={{ minWidth: '180px', flexShrink: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '.82rem', color: '#6b7280', marginBottom: '.5rem', textTransform: 'uppercase' }}>
            ห้องเรียน
          </div>
          {classNames.length === 0 ? (
            <p className="text-muted text-sm">ยังไม่มีห้องเรียน</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.3rem' }}>
              {classNames.map(cls => {
                const stored = classOuterCornerKeys[cls];
                const count  = stored ? stored.length : cornerDefs.length;
                const isActive = cls === selectedClass;
                return (
                  <button
                    key={cls}
                    onClick={() => setSelectedClass(cls)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '.5rem .75rem', borderRadius: '10px', cursor: 'pointer',
                      fontFamily: 'inherit', fontSize: '.88rem', fontWeight: isActive ? 700 : 500,
                      border: `1.5px solid ${isActive ? '#60a5fa' : '#e5e7eb'}`,
                      background: isActive ? '#eff6ff' : 'white',
                      color: isActive ? '#1d4ed8' : '#374151',
                      textAlign: 'left',
                    }}
                  >
                    <span>{cls}</span>
                    <span style={{
                      fontSize: '.72rem', fontWeight: 700,
                      background: isActive ? '#93c5fd' : '#f3f4f6',
                      color: isActive ? '#1e3a8a' : '#6b7280',
                      borderRadius: '999px', padding: '0 .45rem',
                    }}>
                      {count}/{cornerDefs.length}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── ขวา: กำหนดแหล่งเรียนรู้ ── */}
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
              <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: '.95rem', color: '#1d4ed8' }}>
                  🌿 {selectedClass}
                </span>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '.4rem' }}>
                  <button
                    onClick={selectAll}
                    style={{ padding: '.3rem .75rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: '.78rem', background: '#dbeafe', color: '#1d4ed8' }}
                  >เลือกทั้งหมด</button>
                  <button
                    onClick={selectNone}
                    style={{ padding: '.3rem .75rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: '.78rem', background: '#fee2e2', color: '#991b1b' }}
                  >ล้างทั้งหมด</button>
                  {!isDefault && (
                    <button
                      onClick={resetToDefault}
                      style={{ padding: '.3rem .75rem', borderRadius: '8px', border: '1px solid #e5e7eb', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: '.78rem', background: 'white', color: '#6b7280' }}
                    >↺ รีเซ็ต</button>
                  )}
                </div>
              </div>

              {cornerDefs.length === 0 ? (
                <p className="text-muted text-sm">ยังไม่มีแหล่งเรียนรู้ — กรุณาเพิ่มใน "จัดการกิจกรรมภายนอกห้องเรียน" ก่อน</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '.5rem' }}>
                  {cornerDefs.map(def => {
                    const checked = isChecked(def.key);
                    return (
                      <label
                        key={def.key}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '.6rem',
                          padding: '.55rem .8rem', borderRadius: '10px', cursor: 'pointer',
                          background: checked ? '#eff6ff' : 'white',
                          border: `1.5px solid ${checked ? '#60a5fa' : '#e5e7eb'}`,
                          transition: 'all .12s',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggle(def.key)}
                          style={{ width: '16px', height: '16px', accentColor: '#2563eb', cursor: 'pointer' }}
                        />
                        <span style={{ fontWeight: checked ? 700 : 500, fontSize: '.88rem', color: checked ? '#1d4ed8' : '#374151' }}>
                          {def.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}

              <p className="text-xs text-muted" style={{ marginTop: '.85rem' }}>
                💡 การเปลี่ยนแปลงบันทึกทันที — ห้องเรียนที่ไม่กำหนด จะแสดงทุกแหล่งเรียนรู้ (ค่าเริ่มต้น)
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
