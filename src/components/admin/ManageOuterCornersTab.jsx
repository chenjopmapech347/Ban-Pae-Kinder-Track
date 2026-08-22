// ManageOuterCornersTab.jsx — จัดการแหล่งเรียนรู้ภายนอกห้องเรียน (cornerDefs)
import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { genUniqueKey } from '../../utils/helpers';

export default function ManageOuterCornersTab() {
  const { cornerDefs, setCornerDefs } = useApp();

  const [newLabel, setNewLabel] = useState('');
  const [editIdx, setEditIdx]   = useState(null);
  const [editVal, setEditVal]   = useState('');

  /* ── เพิ่ม ── */
  function addNew() {
    const label = newLabel.trim();
    if (!label) return;
    setCornerDefs(prev => [...prev, { key: genUniqueKey('corner'), label }]);
    setNewLabel('');
  }

  /* ── แก้ไข ── */
  function startEdit(i) { setEditIdx(i); setEditVal(cornerDefs[i].label); }
  function saveEdit(i) {
    const val = editVal.trim();
    if (!val) return;
    setCornerDefs(prev => prev.map((d, idx) => idx === i ? { ...d, label: val } : d));
    setEditIdx(null);
  }
  function cancelEdit() { setEditIdx(null); }

  /* ── ลบ ── */
  function remove(i) {
    if (!window.confirm(`ลบ "${cornerDefs[i].label}" ?`)) return;
    setCornerDefs(prev => prev.filter((_, idx) => idx !== i));
  }

  /* ── เรียง ── */
  function moveUp(i) {
    if (i === 0) return;
    setCornerDefs(prev => { const a = [...prev]; [a[i-1], a[i]] = [a[i], a[i-1]]; return a; });
  }
  function moveDown(i) {
    if (i === cornerDefs.length - 1) return;
    setCornerDefs(prev => { const a = [...prev]; [a[i], a[i+1]] = [a[i+1], a[i]]; return a; });
  }

  const row = {
    display: 'flex', alignItems: 'center', gap: '.5rem',
    padding: '.55rem .75rem', borderRadius: '10px',
    background: '#f0f9ff', border: '1px solid #bae6fd', marginBottom: '.4rem',
  };
  const btn = (bg = '#e0f2fe', color = '#0369a1') => ({
    background: bg, color, border: 'none', borderRadius: '7px',
    padding: '.28rem .55rem', cursor: 'pointer',
    fontFamily: 'inherit', fontWeight: 700, fontSize: '.78rem',
  });

  return (
    <div className="glass p-6 animate-fade">
      {/* Header */}
      <div className="page-header mb-6">
        <div>
          <h3>🌿 จัดการกิจกรรมภายนอกห้องเรียน</h3>
          <p className="text-xs text-muted" style={{ marginTop: '.25rem' }}>
            กำหนดชื่อแหล่งเรียนรู้นอกห้องเรียน — แก้ไข เรียงลำดับ และลบได้ตามต้องการ
          </p>
        </div>
        <div style={{ background: '#e0f2fe', border: '1.5px solid #7dd3fc', borderRadius: '10px',
          padding: '.4rem .85rem', color: '#0369a1', fontWeight: 700, fontSize: '.85rem' }}>
          {cornerDefs.length} แหล่ง
        </div>
      </div>

      {/* รายการปัจจุบัน */}
      {cornerDefs.length === 0 ? (
        <div className="text-center text-muted" style={{ padding: '2.5rem', fontSize: '.9rem' }}>
          ยังไม่มีแหล่งเรียนรู้ กรุณาเพิ่มด้านล่าง
        </div>
      ) : (
        <div style={{ marginBottom: '1.25rem' }}>
          {cornerDefs.map((d, i) => (
            <div key={d.key} style={row}>
              <span style={{ color: '#7dd3fc', fontWeight: 800, fontSize: '.75rem', minWidth: '22px', textAlign: 'center' }}>
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
                      border: '1.5px solid #38bdf8', fontFamily: 'inherit', fontSize: '.88rem' }}
                  />
                  <button style={btn('#0284c7', 'white')} onClick={() => saveEdit(i)}>บันทึก</button>
                  <button style={btn()} onClick={cancelEdit}>ยกเลิก</button>
                </>
              ) : (
                <>
                  <span style={{ flex: 1, fontWeight: 600, fontSize: '.9rem', color: '#0c4a6e' }}>
                    {d.label}
                  </span>
                  <button style={btn()} onClick={() => startEdit(i)} title="แก้ไขชื่อ">✏️</button>
                  <button style={btn()} onClick={() => moveUp(i)}   title="เลื่อนขึ้น" disabled={i === 0}>↑</button>
                  <button style={btn()} onClick={() => moveDown(i)} title="เลื่อนลง"  disabled={i === cornerDefs.length - 1}>↓</button>
                  <button style={btn('#fee2e2', '#991b1b')} onClick={() => remove(i)} title="ลบ">🗑️</button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* เพิ่มแหล่งเรียนรู้ใหม่ */}
      <div style={{ borderTop: '1.5px solid #bae6fd', paddingTop: '1.25rem' }}>
        <div style={{ fontWeight: 700, fontSize: '.88rem', color: '#0284c7', marginBottom: '.6rem' }}>
          ➕ เพิ่มแหล่งเรียนรู้ใหม่
        </div>
        <div style={{ display: 'flex', gap: '.5rem' }}>
          <input
            className="input"
            value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addNew()}
            placeholder="ชื่อแหล่งเรียนรู้ใหม่ เช่น สวนผัก, ห้องดนตรี, สนามเด็กเล่น..."
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
          💡 การเปลี่ยนแปลงจะบันทึกทันที และส่งผลต่อแบบบันทึกแหล่งเรียนรู้นอกห้องเรียน
        </p>
      </div>
    </div>
  );
}
