// AssignInnerCornersTab.jsx — กำหนดกิจกรรมภายในห้องเรียนของแต่ละห้องเรียน
// ใช้เลือกว่าห้องเรียนไหนใช้มุมประสบการณ์ไหนบ้าง
import { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';

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

  // กำหนดค่า default: ถ้าห้องไม่มีการตั้งค่า = เลือกทั้งหมด (null/undefined → all)
  function getKeysForClass(cls) {
    if (!cls) return [];
    const stored = classInnerCornerKeys[cls];
    if (!stored) return innerCornerDefs.map(d => d.key); // default = ทั้งหมด
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
    setClassInnerCornerKeys(prev => ({ ...prev, [selectedClass]: next }));
  }

  function selectAll() {
    if (!selectedClass) return;
    setClassInnerCornerKeys(prev => ({
      ...prev,
      [selectedClass]: innerCornerDefs.map(d => d.key),
    }));
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

  const selectedCount = currentKeys.length;
  const totalCount = innerCornerDefs.length;
  const isDefault = !classInnerCornerKeys[selectedClass];

  return (
    <div className="glass p-6 animate-fade">
      {/* Header */}
      <div className="page-header mb-4">
        <div>
          <h3>🏡 กำหนดกิจกรรมภายในห้องเรียน</h3>
          <p className="text-xs text-muted" style={{ marginTop: '.25rem' }}>
            เลือกว่าแต่ละห้องเรียนจะใช้มุมประสบการณ์ไหนบ้าง — จะแสดงเฉพาะมุมที่เลือกในแบบบันทึก
          </p>
        </div>
        {selectedClass && (
          <div style={{
            background: '#f0fdf4', border: '1.5px solid #86efac',
            borderRadius: '10px', padding: '.4rem .85rem',
            color: '#15803d', fontWeight: 700, fontSize: '.85rem',
          }}>
            {selectedCount} / {totalCount} มุม
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
                const stored = classInnerCornerKeys[cls];
                const count  = stored ? stored.length : innerCornerDefs.length;
                const isActive = cls === selectedClass;
                return (
                  <button
                    key={cls}
                    onClick={() => setSelectedClass(cls)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '.5rem .75rem', borderRadius: '10px', cursor: 'pointer',
                      fontFamily: 'inherit', fontSize: '.88rem', fontWeight: isActive ? 700 : 500,
                      border: `1.5px solid ${isActive ? '#4ade80' : '#e5e7eb'}`,
                      background: isActive ? '#f0fdf4' : 'white',
                      color: isActive ? '#15803d' : '#374151',
                      textAlign: 'left',
                    }}
                  >
                    <span>{cls}</span>
                    <span style={{
                      fontSize: '.72rem', fontWeight: 700,
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

        {/* ── ขวา: กำหนดมุมประสบการณ์ ── */}
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
                <span style={{ fontWeight: 700, fontSize: '.95rem', color: '#15803d' }}>
                  🏡 {selectedClass}
                </span>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '.4rem' }}>
                  <button
                    onClick={selectAll}
                    style={{ padding: '.3rem .75rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: '.78rem', background: '#dcfce7', color: '#15803d' }}
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

              {innerCornerDefs.length === 0 ? (
                <p className="text-muted text-sm">ยังไม่มีมุมประสบการณ์ — กรุณาเพิ่มใน "จัดการกิจกรรมภายในห้องเรียน" ก่อน</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '.5rem' }}>
                  {innerCornerDefs.map(def => {
                    const checked = isChecked(def.key);
                    return (
                      <label
                        key={def.key}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '.6rem',
                          padding: '.55rem .8rem', borderRadius: '10px', cursor: 'pointer',
                          background: checked ? '#f0fdf4' : 'white',
                          border: `1.5px solid ${checked ? '#4ade80' : '#e5e7eb'}`,
                          transition: 'all .12s',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggle(def.key)}
                          style={{ width: '16px', height: '16px', accentColor: '#16a34a', cursor: 'pointer' }}
                        />
                        <span style={{ fontWeight: checked ? 700 : 500, fontSize: '.88rem', color: checked ? '#15803d' : '#374151' }}>
                          {def.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}

              <p className="text-xs text-muted" style={{ marginTop: '.85rem' }}>
                💡 การเปลี่ยนแปลงบันทึกทันที — ห้องเรียนที่ไม่กำหนด จะแสดงทุกมุม (ค่าเริ่มต้น)
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
