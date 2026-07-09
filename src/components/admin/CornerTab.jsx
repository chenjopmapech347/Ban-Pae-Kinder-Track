// CornerTab.jsx — แบบบันทึกการใช้แหล่งเรียนรู้นอกห้องเรียนรายสัปดาห์
import { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { getMondayOf, getWeekLabel, genUniqueKey } from '../../utils/helpers';
import Modal, { ModalCancelBtn, ModalConfirmBtn } from '../Modal';

// ── พิมพ์แบบบันทึก ───────────────────────────────────────────────────────────
function printCornerSheet(rows, CORNERS, weekNo, weekDate, className, schoolName, teacher, academicYear, schoolLogo) {
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap');
    *{box-sizing:border-box}
    body{font-family:'Sarabun',sans-serif;font-size:10.5pt;margin:0;padding:0}
    h2{text-align:center;font-size:13pt;font-weight:800;margin:.15rem 0}
    .sub{text-align:center;font-size:9.5pt;margin:.1rem 0}
    .hint{font-size:8.5pt;margin:.5rem 0 .3rem;line-height:1.5}
    table{width:100%;border-collapse:collapse;margin-top:.4rem;font-size:8.5pt}
    th,td{border:1px solid #555;padding:2px 3px;vertical-align:middle}
    th{background:#ddd;text-align:center;font-weight:700;white-space:pre-line;line-height:1.3}
    .tc{text-align:center} .tl{text-align:left}
    .sig{margin-top:2rem;text-align:right;font-size:9.5pt}
    @media print{@page{margin:1.5cm;size:A4 portrait}body{margin:0}}
  `;
  const thCell = (t) => `<th style="width:58px" class="tc">${t}</th>`;
  const headerRow = `<tr><th style="width:24px">ที่</th><th style="min-width:140px" class="tl">ชื่อ – นามสกุล</th>${CORNERS.map(c => thCell(c.label)).join('')}</tr>`;
  const bodyRows = rows.map((r, i) => {
    const cells = CORNERS.map(c => `<td class="tc">${r[c.key] ? '✓' : ''}</td>`).join('');
    return `<tr><td class="tc">${i + 1}</td><td class="tl">${r.name ?? ''}</td>${cells}</tr>`;
  }).join('');
  const teacherLine = teacher ? `ชื่อ – สกุล ${teacher.name ?? ''}  ตำแหน่ง ${teacher.position ?? ''}` : '';
  const weekLabel   = weekDate ? `(${getWeekLabel(weekDate)})` : '';
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
    <title>แบบบันทึกการใช้แหล่งเรียนรู้</title><style>${css}</style></head>
    <body>
      ${schoolLogo ? `<div style="text-align:center;margin-bottom:4px"><img src="${schoolLogo}" style="height:70px;object-fit:contain"/></div>` : ''}
      <h2>แบบบันทึกการใช้แหล่งเรียนรู้นอกห้องเรียนรายสัปดาห์</h2>
      ${schoolName  ? `<div class="sub">${schoolName}${academicYear ? ` ปีการศึกษา ${academicYear}` : ''}</div>` : ''}
      ${teacherLine ? `<div class="sub">${teacherLine}  ห้อง ${className}</div>` : `<div class="sub">ห้อง ${className}</div>`}
      <div class="sub">สัปดาห์ที่ ${weekNo ?? '___'}  ${weekLabel}</div>
      <div class="hint">คำชี้แจง : ให้ทำเครื่องหมาย ✓ บันทึกข้อมูลการใช้แหล่งเรียนรู้นอกห้องเรียน เพื่อประเมินการใช้พื้นที่/มุมประสบการณ์ และนำข้อมูลไปพัฒนาต่อไป</div>
      <table>
        <thead>
          <tr><th colspan="2" style="background:#c8e6fa">รายชื่อนักเรียน</th><th colspan="${CORNERS.length}" style="background:#c8e6fa">มุมเสริมประสบการณ์แหล่งเรียนรู้นอกห้องเรียน</th></tr>
          ${headerRow}
        </thead>
        <tbody>${bodyRows}</tbody>
      </table>
      <div class="sig">ลงชื่อ ................................................ผู้บันทึก<br/>${teacher ? `( ${teacher.name ?? ''} )` : '( ....................................... )'}</div>
      <script>setTimeout(()=>window.print(),500)</` + `script>
    </body></html>`;
  const w = window.open('', '_blank', 'width=1000,height=750');
  if (!w) { alert('กรุณาอนุญาต popup'); return; }
  w.document.write(html);
  w.document.close();
}

// ── Modal จัดการมุม ───────────────────────────────────────────────────────────
function ManageDefsModal({ defs, onSave, onClose }) {
  const [list, setList] = useState(defs.map(d => ({ ...d })));
  const [newLabel, setNewLabel] = useState('');
  const [editIdx, setEditIdx]   = useState(null);
  const [editVal, setEditVal]   = useState('');

  function startEdit(i) { setEditIdx(i); setEditVal(list[i].label); }
  function saveEdit(i) {
    if (!editVal.trim()) return;
    setList(prev => prev.map((d, idx) => idx === i ? { ...d, label: editVal.trim() } : d));
    setEditIdx(null);
  }
  function addNew() {
    if (!newLabel.trim()) return;
    setList(prev => [...prev, { key: genUniqueKey('corner'), label: newLabel.trim() }]);
    setNewLabel('');
  }
  function remove(i) {
    if (!window.confirm(`ลบ "${list[i].label}" ?`)) return;
    setList(prev => prev.filter((_, idx) => idx !== i));
  }
  function moveUp(i)   { if (i === 0) return; setList(prev => { const a = [...prev]; [a[i-1], a[i]] = [a[i], a[i-1]]; return a; }); }
  function moveDown(i) { if (i === list.length-1) return; setList(prev => { const a = [...prev]; [a[i], a[i+1]] = [a[i+1], a[i]]; return a; }); }

  const row = { display:'flex', alignItems:'center', gap:'.5rem', padding:'.5rem .75rem', borderRadius:'10px', background:'#f0f9ff', border:'1px solid #e0f2fe', marginBottom:'.4rem' };
  const btn = (bg='#e0f2fe', color='#0369a1') => ({ background:bg, color, border:'none', borderRadius:'7px', padding:'.28rem .55rem', cursor:'pointer', fontFamily:'inherit', fontWeight:700, fontSize:'.78rem' });

  return (
    <Modal isOpen={true} onClose={onClose} title="⚙️ จัดการมุมแหล่งเรียนรู้" size="md">
        <div>

          {/* รายการปัจจุบัน */}
          <div style={{ marginBottom:'.75rem', fontWeight:700, fontSize:'.85rem', color:'#0369a1' }}>
            มุมที่มีอยู่ ({list.length} มุม)
          </div>
          {list.length === 0 && (
            <div style={{ textAlign:'center', color:'#9ca3af', padding:'1rem', fontSize:'.85rem' }}>ยังไม่มีมุม กรุณาเพิ่ม</div>
          )}
          {list.map((d, i) => (
            <div key={d.key} style={row}>
              <span style={{ color:'#94a3b8', fontWeight:700, fontSize:'.75rem', minWidth:'20px' }}>{i+1}</span>
              {editIdx === i ? (
                <>
                  <input value={editVal} onChange={e => setEditVal(e.target.value)}
                    onKeyDown={e => { if (e.key==='Enter') saveEdit(i); if (e.key==='Escape') setEditIdx(null); }}
                    autoFocus style={{ flex:1, padding:'.3rem .5rem', borderRadius:'7px', border:'1.5px solid #38bdf8', fontFamily:'inherit', fontSize:'.85rem' }} />
                  <button style={btn('#0284c7','white')} onClick={() => saveEdit(i)}>บันทึก</button>
                  <button style={btn()} onClick={() => setEditIdx(null)}>ยกเลิก</button>
                </>
              ) : (
                <>
                  <span style={{ flex:1, fontWeight:600, fontSize:'.88rem' }}>{d.label}</span>
                  <button style={btn()} onClick={() => startEdit(i)} title="แก้ไขชื่อ">✏️</button>
                  <button style={btn()} onClick={() => moveUp(i)}   title="เลื่อนขึ้น" disabled={i===0}>↑</button>
                  <button style={btn()} onClick={() => moveDown(i)} title="เลื่อนลง"  disabled={i===list.length-1}>↓</button>
                  <button style={btn('#fee2e2','#991b1b')} onClick={() => remove(i)} title="ลบ">🗑️</button>
                </>
              )}
            </div>
          ))}

          {/* เพิ่มมุมใหม่ */}
          <div style={{ marginTop:'1rem', paddingTop:'1rem', borderTop:'1px solid #e0f2fe' }}>
            <div style={{ fontWeight:700, fontSize:'.85rem', color:'#0369a1', marginBottom:'.5rem' }}>➕ เพิ่มมุมใหม่</div>
            <div style={{ display:'flex', gap:'.5rem' }}>
              <input value={newLabel} onChange={e => setNewLabel(e.target.value)}
                onKeyDown={e => e.key==='Enter' && addNew()}
                placeholder="ชื่อมุมใหม่ เช่น ห้องดนตรี"
                style={{ flex:1, padding:'.4rem .65rem', borderRadius:'8px', border:'1.5px solid #bae6fd', fontFamily:'inherit', fontSize:'.85rem' }} />
              <button onClick={addNew}
                style={{ padding:'.4rem .9rem', borderRadius:'8px', background:'#0284c7', color:'white', border:'none', fontFamily:'inherit', fontWeight:700, fontSize:'.85rem', cursor:'pointer' }}>
                เพิ่ม
              </button>
            </div>
          </div>

          {/* ปุ่มบันทึก */}
          <div style={{ display:'flex', gap:'.5rem', marginTop:'1.25rem', justifyContent:'flex-end' }}>
            <ModalCancelBtn onClick={onClose} />
            <ModalConfirmBtn onClick={() => { onSave(list); onClose(); }} label="💾 บันทึกการเปลี่ยนแปลง" />
          </div>
        </div>
    </Modal>
  );
}

// ── Component หลัก ────────────────────────────────────────────────────────────
export default function CornerTab({ teacherClassFilter = null }) {
  const {
    cornerRecords, setCornerRecords,
    cornerDefs, setCornerDefs,
    students, teachers, classes, schoolName, schoolLogo, academicYear,
  } = useApp();

  const today = new Date().toISOString().slice(0, 10);
  const [selClass, setSelClass]     = useState(teacherClassFilter ?? '');
  const [selDate,  setSelDate]      = useState(today);
  const [weekNo,   setWeekNo]       = useState('');
  const [showMgmt, setShowMgmt]     = useState(false);

  const classList = useMemo(() => {
    if (teacherClassFilter) return [teacherClassFilter];
    return (classes ?? []).map(c => c.name ?? c.id).filter(Boolean).sort();
  }, [classes, teacherClassFilter]);

  const cn      = selClass || classList[0] || '';
  const monday  = getMondayOf(selDate);
  const weekKey = `${cn}||${monday}`;

  const classTeacher = useMemo(
    () => teachers?.find(t => t.className === cn) ?? null,
    [teachers, cn]
  );

  const classStudents = useMemo(
    () => (students ?? []).filter(s => s.className === cn && !s.name.startsWith('(ว่าง)')),
    [students, cn]
  );

  const weekData = cornerRecords[weekKey] ?? {};
  const CORNERS  = cornerDefs ?? [];
  const emptyRec = Object.fromEntries(CORNERS.map(c => [c.key, false]));

  function toggleCorner(studentId, cornerKey) {
    const sid = String(studentId);
    const cur = weekData[sid] ?? { ...emptyRec };
    setCornerRecords(prev => ({ ...prev, [weekKey]: { ...weekData, [sid]: { ...cur, [cornerKey]: !cur[cornerKey] } } }));
  }

  function toggleAll(cornerKey) {
    const allOn = classStudents.every(s => weekData[String(s.id)]?.[cornerKey]);
    const updated = {};
    classStudents.forEach(s => {
      const sid = String(s.id);
      updated[sid] = { ...(weekData[sid] ?? { ...emptyRec }), [cornerKey]: !allOn };
    });
    setCornerRecords(prev => ({ ...prev, [weekKey]: { ...weekData, ...updated } }));
  }

  function clearWeek() {
    if (!window.confirm(`ล้างข้อมูลสัปดาห์นี้ (${getWeekLabel(monday)})?`)) return;
    setCornerRecords(prev => { const next = { ...prev }; delete next[weekKey]; return next; });
  }

  const printRows = classStudents.map(s => ({ name: s.name, ...(weekData[String(s.id)] ?? emptyRec) }));

  const cell = { border:'1px solid #e0f2fe', padding:'.3rem .5rem', textAlign:'center', verticalAlign:'middle' };
  const thSt = { ...cell, background:'#f0f9ff', fontWeight:700, fontSize:'.78rem', lineHeight:1.3, whiteSpace:'pre-line' };

  return (
    <div className="animate-fade">
      {/* ── Header ── */}
      <div style={{ background:'linear-gradient(135deg,#0284c7,#38bdf8)', borderRadius:'16px', padding:'1.1rem 1.5rem', color:'white', marginBottom:'1.25rem', display:'flex', alignItems:'center', gap:'1rem', flexWrap:'wrap' }}>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:800, fontSize:'1.05rem', marginBottom:'.2rem' }}>🌿 แบบบันทึกการใช้แหล่งเรียนรู้นอกห้องเรียนรายสัปดาห์</div>
          <div style={{ opacity:.85, fontSize:'.82rem' }}>บันทึก checkmark รายนักเรียน × แหล่งเรียนรู้ทั้ง {CORNERS.length} แห่ง</div>
        </div>
        <div style={{ display:'flex', gap:'.5rem', flexWrap:'wrap', alignItems:'center' }}>
          {!teacherClassFilter && classList.length > 1 && (
            <select value={cn} onChange={e => setSelClass(e.target.value)}
              style={{ padding:'.35rem .6rem', borderRadius:'8px', border:'none', fontSize:'.82rem', fontFamily:'inherit', background:'rgba(255,255,255,.2)', color:'white' }}>
              {classList.map(c => <option key={c} value={c} style={{ color:'#000' }}>{c}</option>)}
            </select>
          )}
          <input type="date" value={selDate} onChange={e => setSelDate(e.target.value)}
            style={{ padding:'.35rem .6rem', borderRadius:'8px', border:'none', fontSize:'.82rem', fontFamily:'inherit', background:'rgba(255,255,255,.2)', color:'white' }} />
          <input type="number" min="1" max="52" value={weekNo} onChange={e => setWeekNo(e.target.value)}
            placeholder="สัปดาห์ที่"
            style={{ width:'90px', padding:'.35rem .6rem', borderRadius:'8px', border:'none', fontSize:'.82rem', fontFamily:'inherit', background:'rgba(255,255,255,.2)', color:'white' }} />
          <button type="button" onClick={() => setShowMgmt(true)}
            style={{ padding:'.4rem .9rem', borderRadius:'8px', border:'1.5px solid rgba(255,255,255,.5)', background:'rgba(255,255,255,.15)', color:'white', fontFamily:'inherit', fontWeight:600, fontSize:'.82rem', cursor:'pointer' }}>
            ⚙️ จัดการมุม
          </button>
          <button type="button" onClick={() => printCornerSheet(printRows, CORNERS, weekNo, monday, cn, schoolName, classTeacher, academicYear, schoolLogo)}
            style={{ padding:'.4rem .9rem', borderRadius:'8px', border:'1.5px solid rgba(255,255,255,.5)', background:'rgba(255,255,255,.15)', color:'white', fontFamily:'inherit', fontWeight:600, fontSize:'.82rem', cursor:'pointer' }}>
            🖨️ พิมพ์
          </button>
          <button type="button" onClick={clearWeek}
            style={{ padding:'.4rem .9rem', borderRadius:'8px', border:'1.5px solid rgba(255,255,255,.4)', background:'rgba(255,0,0,.15)', color:'white', fontFamily:'inherit', fontWeight:600, fontSize:'.82rem', cursor:'pointer' }}>
            🗑️ ล้าง
          </button>
        </div>
      </div>

      {/* ── สัปดาห์ info ── */}
      <div style={{ background:'#f0f9ff', borderRadius:'10px', padding:'.55rem 1rem', marginBottom:'1rem', fontSize:'.83rem', color:'#0369a1', fontWeight:600 }}>
        📅 สัปดาห์ที่ {weekNo || '—'}  ({getWeekLabel(monday)})  ·  ห้อง {cn}  ·  นักเรียน {classStudents.length} คน
      </div>

      {/* ── ตาราง ── */}
      {CORNERS.length === 0 ? (
        <div style={{ textAlign:'center', padding:'3rem 1rem', color:'#9ca3af', fontSize:'.9rem' }}>
          ยังไม่มีมุมแหล่งเรียนรู้ กด <strong>⚙️ จัดการมุม</strong> เพื่อเพิ่ม
        </div>
      ) : classStudents.length === 0 ? (
        <div style={{ textAlign:'center', padding:'3rem 1rem', color:'#9ca3af', fontSize:'.9rem' }}>
          ยังไม่มีข้อมูลนักเรียนในห้องนี้
        </div>
      ) : (
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'.85rem' }}>
            <thead>
              <tr style={{ background:'#bae6fd' }}>
                <th style={{ ...thSt, width:'36px' }}>ที่</th>
                <th style={{ ...thSt, textAlign:'left', minWidth:'170px' }}>ชื่อ – นามสกุล</th>
                {CORNERS.map(c => (
                  <th key={c.key} style={{ ...thSt, width:'82px', cursor:'pointer' }}
                    title={`คลิกเพื่อเลือก/ยกเลิกทั้งหมด — ${c.label}`}
                    onClick={() => toggleAll(c.key)}>
                    {c.label}
                    <div style={{ fontSize:'.62rem', fontWeight:400, color:'#0369a1', marginTop:'.1rem' }}>(คลิกเลือกทั้งหมด)</div>
                  </th>
                ))}
                <th style={{ ...thSt, width:'52px' }}>รวม</th>
              </tr>
            </thead>
            <tbody>
              {classStudents.map((s, i) => {
                const sid = String(s.id);
                const rec = weekData[sid] ?? {};
                const count = CORNERS.filter(c => rec[c.key]).length;
                return (
                  <tr key={s.id} style={{ background: i % 2 === 0 ? 'white' : '#f0f9ff', verticalAlign:'middle' }}>
                    <td style={{ ...cell, color:'#6b7280' }}>{i+1}</td>
                    <td style={{ ...cell, textAlign:'left', fontWeight:600 }}>{s.name}</td>
                    {CORNERS.map(c => (
                      <td key={c.key} style={{ ...cell, cursor:'pointer' }} onClick={() => toggleCorner(s.id, c.key)}>
                        {rec[c.key]
                          ? <span style={{ color:'#0891b2', fontWeight:800, fontSize:'1.1rem' }}>✓</span>
                          : <span style={{ color:'#e2e8f0', fontSize:'1rem' }}>○</span>}
                      </td>
                    ))}
                    <td style={{ ...cell, fontWeight:700, color: count > 0 ? '#0369a1' : '#9ca3af' }}>
                      {count > 0 ? count : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background:'#e0f2fe' }}>
                <td colSpan={2} style={{ ...cell, textAlign:'right', fontWeight:700, fontSize:'.78rem', color:'#0369a1' }}>จำนวนที่ไป (คน)</td>
                {CORNERS.map(c => {
                  const cnt = classStudents.filter(s => weekData[String(s.id)]?.[c.key]).length;
                  return (
                    <td key={c.key} style={{ ...cell, fontWeight:800, color: cnt > 0 ? '#0369a1' : '#9ca3af' }}>
                      {cnt > 0 ? cnt : '—'}
                    </td>
                  );
                })}
                <td style={cell} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <div style={{ marginTop:'.75rem', fontSize:'.75rem', color:'#9ca3af', lineHeight:1.6 }}>
        💡 คลิกที่เซลล์เพื่อบันทึก ✓ · คลิกหัวคอลัมน์เพื่อเลือก/ยกเลิกทั้งห้อง · กด ⚙️ จัดการมุม เพื่อเพิ่ม/แก้ไข/ลบ/เรียงมุม
      </div>

      {/* ── Modal จัดการมุม ── */}
      {showMgmt && (
        <ManageDefsModal
          defs={CORNERS}
          onSave={setCornerDefs}
          onClose={() => setShowMgmt(false)}
        />
      )}
    </div>
  );
}
