// MediaTab.jsx — ทะเบียนผลิตสื่อ / นวัตกรรมการเรียนการสอน
import { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';

const EMPTY_FORM = { item: '', topic: '', handmade: false, ai: false, category: 'ใหม่', note: '' };

function printMediaList(records, cn, schoolName) {
  const css = `
    body{font-family:'Sarabun',sans-serif;font-size:11pt;margin:0}
    h2{text-align:center;font-size:13pt;margin:.3rem 0}
    .sub{text-align:center;font-size:9pt;color:#555;margin-bottom:.6rem}
    table{width:100%;border-collapse:collapse;font-size:9pt}
    th,td{border:1px solid #333;padding:3px 5px}
    th{background:#eee;text-align:center}
    .tl{text-align:left}
    @media print{body{margin:0}@page{margin:.6in;size:A4 landscape}}
  `;
  const rows = records.map((r, i) => `
    <tr>
      <td style="text-align:center">${i + 1}</td>
      <td class="tl">${r.item}</td>
      <td class="tl">${r.topic ?? ''}</td>
      <td style="text-align:center">${r.handmade ? '✓' : ''}</td>
      <td style="text-align:center">${r.ai ? '✓' : ''}</td>
      <td style="text-align:center">${r.category ?? ''}</td>
      <td class="tl">${r.note ?? ''}</td>
    </tr>`).join('');
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
    <title>ทะเบียนผลิตสื่อ ${cn}</title><style>${css}</style></head>
    <body>
      <h2>ทะเบียนผลิตสื่อ / นวัตกรรมการเรียนการสอน</h2>
      <div class="sub">ห้อง ${cn} &nbsp;|&nbsp; ${schoolName ?? 'โรงเรียน'}</div>
      <table><thead><tr>
        <th style="width:26px">ที่</th>
        <th class="tl" style="min-width:160px">รายการสื่อ / นวัตกรรม</th>
        <th class="tl" style="min-width:120px">ประกอบการสอนหน่วย</th>
        <th style="width:55px">สื่อทำมือ</th>
        <th style="width:50px">สื่อ AI</th>
        <th style="width:60px">ประเภท<br/>(เก่า/ใหม่)</th>
        <th class="tl" style="min-width:80px">หมายเหตุ</th>
      </tr></thead><tbody>${rows}</tbody></table>
      <script>setTimeout(()=>window.print(),400)</` + `script>
    </body></html>`;
  const w = window.open('', '_blank', 'width=1100,height=750');
  if (!w) { alert('กรุณาอนุญาต popup'); return; }
  w.document.write(html);
  w.document.close();
}

export default function MediaTab({ teacherClassFilter = null, viewMode = 'entry' }) {
  const { mediaRecords, setMediaRecords, classes, schoolName } = useApp();

  const [form, setForm]       = useState(EMPTY_FORM);
  const [editId, setEditId]   = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selClass, setSelClass] = useState(teacherClassFilter ?? '');

  const classList = useMemo(() => {
    if (teacherClassFilter) return [teacherClassFilter];
    return (classes ?? []).map(c => c.name ?? c.id).filter(Boolean).sort();
  }, [classes, teacherClassFilter]);

  const cn = selClass || classList[0] || '';

  const records = useMemo(() =>
    (mediaRecords ?? [])
      .filter(r => !cn || r.className === cn)
      .sort((a, b) => a.id - b.id),
    [mediaRecords, cn]
  );

  function save() {
    if (!form.item.trim()) return;
    if (editId) {
      setMediaRecords(prev => prev.map(r =>
        r.id === editId ? { ...r, ...form, className: cn } : r
      ));
      setEditId(null);
    } else {
      setMediaRecords(prev => [...(prev ?? []), {
        ...form,
        id: Date.now(),
        className: cn,
        createdAt: new Date().toISOString(),
      }]);
    }
    setForm(EMPTY_FORM);
    setShowForm(false);
  }

  function startEdit(r) {
    setForm({ item: r.item, topic: r.topic ?? '', handmade: r.handmade, ai: r.ai, category: r.category ?? 'ใหม่', note: r.note ?? '' });
    setEditId(r.id);
    setShowForm(true);
  }

  function cancelForm() {
    setForm(EMPTY_FORM);
    setEditId(null);
    setShowForm(false);
  }

  function del(id) {
    if (window.confirm('ลบรายการนี้?')) {
      setMediaRecords(prev => prev.filter(r => r.id !== id));
    }
  }

  const inputStyle = {
    width: '100%', padding: '.4rem .6rem', border: '1px solid #d1d5db',
    borderRadius: '6px', fontSize: '.85rem', fontFamily: 'inherit',
    boxSizing: 'border-box',
  };
  const labelStyle = { fontSize: '.78rem', fontWeight: 700, color: '#374151', marginBottom: '.25rem', display: 'block' };

  return (
    <div className="animate-fade">
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg,#0891b2,#06b6d4)',
        borderRadius: '16px', padding: '1.1rem 1.5rem',
        color: 'white', marginBottom: '1.25rem',
        display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: '.2rem' }}>
            📚 ทะเบียนผลิตสื่อ / นวัตกรรมการเรียนการสอน
          </div>
          <div style={{ opacity: .85, fontSize: '.82rem' }}>
            {viewMode === 'entry' ? 'บันทึกและจัดการรายการสื่อการสอน' : 'รายการสื่อการสอนทั้งหมด'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Class selector */}
          {!teacherClassFilter && classList.length > 1 && (
            <select value={cn} onChange={e => setSelClass(e.target.value)}
              style={{ padding: '.35rem .6rem', borderRadius: '8px', border: 'none', fontSize: '.82rem', fontFamily: 'inherit', background: 'rgba(255,255,255,.2)', color: 'white' }}>
              {classList.map(c => <option key={c} value={c} style={{ color: '#000' }}>{c}</option>)}
            </select>
          )}
          {/* Print button */}
          <button type="button" onClick={() => printMediaList(records, cn, schoolName)}
            style={{ padding: '.4rem .9rem', borderRadius: '8px', border: '1.5px solid rgba(255,255,255,.5)', background: 'rgba(255,255,255,.15)', color: 'white', fontFamily: 'inherit', fontWeight: 600, fontSize: '.82rem', cursor: 'pointer' }}>
            🖨️ พิมพ์
          </button>
          {/* Add button (entry mode only) */}
          {viewMode === 'entry' && (
            <button type="button" onClick={() => { cancelForm(); setShowForm(true); }}
              style={{ padding: '.4rem .9rem', borderRadius: '8px', border: 'none', background: 'white', color: '#0891b2', fontFamily: 'inherit', fontWeight: 700, fontSize: '.82rem', cursor: 'pointer' }}>
              + เพิ่มรายการ
            </button>
          )}
        </div>
      </div>

      {/* Add / Edit form */}
      {showForm && viewMode === 'entry' && (
        <div style={{
          background: 'white', borderRadius: '12px', border: '1.5px solid #bae6fd',
          padding: '1.25rem', marginBottom: '1.25rem',
          boxShadow: '0 4px 16px rgba(8,145,178,.1)',
        }}>
          <div style={{ fontWeight: 800, fontSize: '.95rem', color: '#0891b2', marginBottom: '1rem' }}>
            {editId ? '✏️ แก้ไขรายการ' : '➕ เพิ่มรายการสื่อใหม่'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>รายการสื่อ / นวัตกรรม *</label>
              <input style={inputStyle} placeholder="ชื่อสื่อการสอน..." value={form.item}
                onChange={e => setForm(f => ({ ...f, item: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>ประกอบการสอนหน่วย</label>
              <input style={inputStyle} placeholder="หน่วยการเรียนรู้..." value={form.topic}
                onChange={e => setForm(f => ({ ...f, topic: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>ประเภทสื่อ (เก่า/ใหม่)</label>
              <select style={inputStyle} value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                <option value="ใหม่">ใหม่</option>
                <option value="เก่า">เก่า</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', paddingTop: '.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '.4rem', fontSize: '.85rem', fontWeight: 600, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.handmade} onChange={e => setForm(f => ({ ...f, handmade: e.target.checked }))} />
                สื่อทำมือ
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '.4rem', fontSize: '.85rem', fontWeight: 600, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.ai} onChange={e => setForm(f => ({ ...f, ai: e.target.checked }))} />
                สื่อ AI
              </label>
            </div>
            <div>
              <label style={labelStyle}>หมายเหตุ</label>
              <input style={inputStyle} placeholder="หมายเหตุ..." value={form.note}
                onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button type="button" onClick={cancelForm}
              style={{ padding: '.4rem 1rem', borderRadius: '8px', border: '1.5px solid #d1d5db', background: 'white', fontFamily: 'inherit', fontSize: '.85rem', cursor: 'pointer' }}>
              ยกเลิก
            </button>
            <button type="button" onClick={save}
              disabled={!form.item.trim()}
              style={{ padding: '.4rem 1.2rem', borderRadius: '8px', border: 'none', background: form.item.trim() ? '#0891b2' : '#cbd5e1', color: 'white', fontFamily: 'inherit', fontWeight: 700, fontSize: '.85rem', cursor: form.item.trim() ? 'pointer' : 'default' }}>
              {editId ? '💾 บันทึกการแก้ไข' : '✅ บันทึก'}
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {records.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#9ca3af', fontSize: '.9rem' }}>
          {viewMode === 'entry' ? 'ยังไม่มีรายการสื่อ กด "+ เพิ่มรายการ" เพื่อเริ่มต้น' : 'ยังไม่มีข้อมูลทะเบียนสื่อ'}
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.85rem' }}>
            <thead>
              <tr style={{ background: '#f0f9ff' }}>
                <th style={{ border: '1px solid #bae6fd', padding: '.45rem .6rem', width: '36px' }}>ที่</th>
                <th style={{ border: '1px solid #bae6fd', padding: '.45rem .6rem', textAlign: 'left', minWidth: '180px' }}>รายการสื่อ / นวัตกรรม</th>
                <th style={{ border: '1px solid #bae6fd', padding: '.45rem .6rem', textAlign: 'left', minWidth: '140px' }}>ประกอบการสอนหน่วย</th>
                <th style={{ border: '1px solid #bae6fd', padding: '.45rem .6rem', width: '60px' }}>ทำมือ</th>
                <th style={{ border: '1px solid #bae6fd', padding: '.45rem .6rem', width: '50px' }}>AI</th>
                <th style={{ border: '1px solid #bae6fd', padding: '.45rem .6rem', width: '65px' }}>ประเภท</th>
                <th style={{ border: '1px solid #bae6fd', padding: '.45rem .6rem', textAlign: 'left', minWidth: '80px' }}>หมายเหตุ</th>
                {viewMode === 'entry' && (
                  <th style={{ border: '1px solid #bae6fd', padding: '.45rem .6rem', width: '80px' }}>จัดการ</th>
                )}
              </tr>
            </thead>
            <tbody>
              {records.map((r, i) => (
                <tr key={r.id} style={{ background: i % 2 === 0 ? 'white' : '#f0f9ff' }}>
                  <td style={{ border: '1px solid #e0f2fe', padding: '.4rem .6rem', textAlign: 'center', color: '#6b7280' }}>{i + 1}</td>
                  <td style={{ border: '1px solid #e0f2fe', padding: '.4rem .6rem', fontWeight: 600 }}>{r.item}</td>
                  <td style={{ border: '1px solid #e0f2fe', padding: '.4rem .6rem', color: '#374151' }}>{r.topic ?? ''}</td>
                  <td style={{ border: '1px solid #e0f2fe', padding: '.4rem .6rem', textAlign: 'center' }}>
                    {r.handmade ? <span style={{ color: '#059669', fontWeight: 700 }}>✓</span> : ''}
                  </td>
                  <td style={{ border: '1px solid #e0f2fe', padding: '.4rem .6rem', textAlign: 'center' }}>
                    {r.ai ? <span style={{ color: '#7c3aed', fontWeight: 700 }}>✓</span> : ''}
                  </td>
                  <td style={{ border: '1px solid #e0f2fe', padding: '.4rem .6rem', textAlign: 'center' }}>
                    <span style={{
                      background: r.category === 'ใหม่' ? '#dcfce7' : '#f1f5f9',
                      color: r.category === 'ใหม่' ? '#15803d' : '#64748b',
                      borderRadius: '999px', padding: '.1rem .5rem', fontSize: '.75rem', fontWeight: 700,
                    }}>{r.category ?? 'ใหม่'}</span>
                  </td>
                  <td style={{ border: '1px solid #e0f2fe', padding: '.4rem .6rem', color: '#6b7280', fontSize: '.8rem' }}>{r.note ?? ''}</td>
                  {viewMode === 'entry' && (
                    <td style={{ border: '1px solid #e0f2fe', padding: '.4rem .6rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '.3rem', justifyContent: 'center' }}>
                        <button type="button" onClick={() => startEdit(r)}
                          style={{ padding: '.2rem .5rem', borderRadius: '5px', border: 'none', background: '#e0f2fe', color: '#0891b2', cursor: 'pointer', fontSize: '.75rem', fontWeight: 600 }}>
                          แก้ไข
                        </button>
                        <button type="button" onClick={() => del(r.id)}
                          style={{ padding: '.2rem .5rem', borderRadius: '5px', border: 'none', background: '#fee2e2', color: '#dc2626', cursor: 'pointer', fontSize: '.75rem', fontWeight: 600 }}>
                          ลบ
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: '.5rem', fontSize: '.78rem', color: '#6b7280', textAlign: 'right' }}>
            รวม {records.length} รายการ
          </div>
        </div>
      )}
    </div>
  );
}
