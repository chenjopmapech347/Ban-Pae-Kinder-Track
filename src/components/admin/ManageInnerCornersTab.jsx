// ManageInnerCornersTab.jsx — จัดการมุมประสบการณ์ภายในห้องเรียน (innerCornerDefs)
import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { genUniqueKey } from '../../utils/helpers';

export default function ManageInnerCornersTab() {
  const { innerCornerDefs, setInnerCornerDefs } = useApp();

  const [newLabel, setNewLabel] = useState('');
  const [editIdx, setEditIdx]   = useState(null);
  const [editVal, setEditVal]   = useState('');

  /* ── เพิ่ม ── */
  function addNew() {
    const label = newLabel.trim();
    if (!label) return;
    setInnerCornerDefs(prev => [...prev, { key: genUniqueKey('inner'), label }]);
    setNewLabel('');
  }

  /* ── แก้ไข ── */
  function startEdit(i) { setEditIdx(i); setEditVal(innerCornerDefs[i].label); }
  function saveEdit(i) {
    const val = editVal.trim();
    if (!val) return;
    setInnerCornerDefs(prev => prev.map((d, idx) => idx === i ? { ...d, label: val } : d));
    setEditIdx(null);
  }
  function cancelEdit() { setEditIdx(null); }

  /* ── ลบ ── */
  function remove(i) {
    if (!window.confirm(`ลบ "${innerCornerDefs[i].label}" ?`)) return;
    setInnerCornerDefs(prev => prev.filter((_, idx) => idx !== i));
  }

  /* ── เรียง ── */
  function moveUp(i) {
    if (i === 0) return;
    setInnerCornerDefs(prev => { const a = [...prev]; [a[i-1], a[i]] = [a[i], a[i-1]]; return a; });
  }
  function moveDown(i) {
    if (i === innerCornerDefs.length - 1) return;
    setInnerCornerDefs(prev => { const a = [...prev]; [a[i], a[i+1]] = [a[i+1], a[i]]; return a; });
  }

  const row = {
    display: 'flex', alignItems: 'center', gap: '.5rem',
    padding: '.55rem .75rem', borderRadius: '10px',
    background: '#f0fdf4', border: '1px solid #bbf7d0', marginBottom: '.4rem',
  };
  const btn = (bg = '#dcfce7', color = '#15803d') => ({
    background: bg, color, border: 'none', borderRadius: '7px',
    padding: '.28rem .55rem', cursor: 'pointer',
    fontFamily: 'inherit', fontWeight: 700, fontSize: '.78rem',
  });

  return (
    <div className="glass p-6 animate-fade">
      {/* Header */}
      <div className="page-header mb-6">
        <div>
          <h3>🏡 จัดการกิจกรรมภายในห้องเรียน</h3>
          <p className="text-xs text-muted" style={{ marginTop: '.25rem' }}>
            กำหนดชื่อมุมประสบการณ์ภายในห้องเรียน — แก้ไข เรียงลำดับ และลบได้ตามต้องการ
          </p>
        </div>
        <div style={{ background: '#dcfce7', border: '1.5px solid #86efac', borderRadius: '10px',
          padding: '.4rem .85rem', color: '#15803d', fontWeight: 700, fontSize: '.85rem' }}>
          {innerCornerDefs.length} มุม
        </div>
      </div>

      {/* รายการปัจจุบัน */}
      {innerCornerDefs.length === 0 ? (
        <div className="text-center text-muted" style={{ padding: '2.5rem', fontSize: '.9rem' }}>
          ยังไม่มีมุมประสบการณ์ กรุณาเพิ่มด้านล่าง
        </div>
      ) : (
        <div style={{ marginBottom: '1.25rem' }}>
          {innerCornerDefs.map((d, i) => (
            <div key={d.key} style={row}>
              <span style={{ color: '#86efac', fontWeight: 800, fontSize: '.75rem', minWidth: '22px', textAlign: 'center' }}>
                {i + 1}
              </span>

              {editIdx === i ? (
                <>
                  <input
                    value={editVal}
                    onChange={e => setEditVal(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter')  saveEdit(i);
                      if (e.key === 'Escape') cancelEdit();
                    }}
                    autoFocus
                    style={{ flex: 1, padding: '.3rem .5rem', borderRadius: '7px',
                      border: '1.5px solid #4ade80', fontFamily: 'inherit', fontSize: '.88rem' }}
                  />
                  <button style={btn('#16a34a', 'white')} onClick={() => saveEdit(i)}>บันทึก</button>
                  <button style={btn()} onClick={cancelEdit}>ยกเลิก</button>
                </>
              ) : (
                <>
                  <span style={{ flex: 1, fontWeight: 600, fontSize: '.9rem', color: '#166534' }}>
                    {d.label}
                  </span>
                  <button style={btn()} onClick={() => startEdit(i)} title="แก้ไขชื่อ">✏️</button>
                  <button style={btn()} onClick={() => moveUp(i)}   title="เลื่อนขึ้น" disabled={i === 0}>↑</button>
                  <button style={btn()} onClick={() => moveDown(i)} title="เลื่อนลง"  disabled={i === innerCornerDefs.length - 1}>↓</button>
                  <button style={btn('#fee2e2', '#991b1b')} onClick={() => remove(i)} title="ลบ">🗑️</button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* เพิ่มมุมใหม่ */}
      <div style={{ borderTop: '1.5px solid #bbf7d0', paddingTop: '1.25rem' }}>
        <div style={{ fontWeight: 700, fontSize: '.88rem', color: '#16a34a', marginBottom: '.6rem' }}>
          ➕ เพิ่มมุมใหม่
        </div>
        <div style={{ display: 'flex', gap: '.5rem' }}>
          <input
            className="input"
            value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addNew()}
            placeholder="ชื่อมุมใหม่ เช่น มุมหนังสือ, มุมบล็อก, มุมบ้าน..."
          />
          <button
            type="button"
            className="btn btn-primary"
            onClick={addNew}
            disabled={!newLabel.trim()}
          >
            เพิ่ม
          </button>
        </div>
        <p className="text-xs text-muted" style={{ marginTop: '.5rem' }}>
          💡 การเปลี่ยนแปลงจะบันทึกทันที และส่งผลต่อแบบบันทึกมุมประสบการณ์ในห้องเรียน
        </p>
      </div>
    </div>
  );
}
