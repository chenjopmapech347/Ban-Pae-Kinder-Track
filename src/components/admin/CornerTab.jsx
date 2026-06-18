// CornerTab.jsx — แบบบันทึกการใช้แหล่งเรียนรู้นอกห้องเรียนรายสัปดาห์
// โครงสร้างข้อมูล cornerRecords:
//   { [`${className}||${YYYY-MM-DD}`]: { [studentId]: { wasteSort, organicWaste, garden, learningRoom, computerRoom, trafficSign } } }
//   YYYY-MM-DD = วันจันทร์ต้นสัปดาห์
import { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';

// ── 6 มุมประสบการณ์นอกห้องเรียน (จากแบบฟอร์มกระดาษ) ──────────────────────
const CORNERS = [
  { key: 'wasteSort',    label: 'คัดแยกขยะ\n(กRS)', short: 'คัดแยกขยะ' },
  { key: 'organicWaste', label: 'ขยะอินทรีย์',       short: 'ขยะอินทรีย์' },
  { key: 'garden',       label: 'แปลงปลูกผัก',       short: 'แปลงปลูกผัก' },
  { key: 'learningRoom', label: 'ห้องแหล่ง\nเรียนรู้', short: 'ห้องแหล่งเรียนรู้' },
  { key: 'computerRoom', label: 'ห้อง\nคอมพิวเตอร์', short: 'ห้องคอมพิวเตอร์' },
  { key: 'trafficSign',  label: 'เครื่องหมาย\nจราจร', short: 'เครื่องหมายจราจร' },
];

// สร้างค่าเริ่มต้น record นักเรียนคนหนึ่ง (ยังไม่ได้ไปไหน)
const EMPTY_CORNER_RECORD = Object.fromEntries(CORNERS.map(c => [c.key, false]));

// ── helper: หา Monday ของสัปดาห์ ────────────────────────────────────────────
function getMondayOf(dateStr) {
  const d = new Date(dateStr);
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

function getWeekLabel(mondayStr) {
  const d = new Date(mondayStr);
  const end = new Date(d); end.setDate(d.getDate() + 6);
  const fmt = (x) => x.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
  return `${fmt(d)} – ${fmt(end)}`;
}

// ── พิมพ์แบบบันทึก ───────────────────────────────────────────────────────────
function printCornerSheet(rows, weekNo, weekDate, className, schoolName, teacher, academicYear) {
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
    .tc{text-align:center}
    .tl{text-align:left}
    .check{font-size:11pt;color:#000}
    .sig{margin-top:2rem;text-align:right;font-size:9.5pt}
    @media print{@page{margin:1.5cm;size:A4 portrait}body{margin:0}}
  `;
  const th = (t) => `<th style="width:58px" class="tc">${t}</th>`;
  const headerRow = `<tr><th style="width:24px">ที่</th><th style="min-width:140px" class="tl">ชื่อ – นามสกุล</th>${CORNERS.map(c => th(c.label)).join('')}</tr>`;
  const bodyRows = rows.map((r, i) => {
    const cells = CORNERS.map(c => `<td class="tc check">${r[c.key] ? '✓' : ''}</td>`).join('');
    return `<tr><td class="tc">${i + 1}</td><td class="tl">${r.name ?? ''}</td>${cells}</tr>`;
  }).join('');
  const teacherLine = teacher ? `ชื่อ – สกุล ${teacher.name ?? ''}  ตำแหน่ง ${teacher.position ?? ''}` : '';
  const weekLabel  = weekDate ? `(${getWeekLabel(weekDate)})` : '';
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
    <title>แบบบันทึกการใช้แหล่งเรียนรู้</title><style>${css}</style></head>
    <body>
      <h2>แบบบันทึกการใช้แหล่งเรียนรู้นอกห้องเรียนรายสัปดาห์</h2>
      ${schoolName    ? `<div class="sub">${schoolName}${academicYear ? ` ปีการศึกษา ${academicYear}` : ''}</div>` : ''}
      ${teacherLine   ? `<div class="sub">${teacherLine}  ห้อง ${className}</div>` : `<div class="sub">ห้อง ${className}</div>`}
      <div class="sub">สัปดาห์ที่ ${weekNo ?? '___'}  ${weekLabel}</div>
      <div class="hint">คำชี้แจง : ให้ทำเครื่องหมาย ✓ บันทึกข้อมูลการใช้แหล่งเรียนรู้นอกห้องเรียน เพื่อประเมินการใช้พื้นที่/มุมประสบการณ์ และนำข้อมูลไปพัฒนาต่อไป</div>
      <table>
        <thead>
          <tr><th colspan="2" style="background:#c8e6fa">มุมเสริมประสบการณ์แหล่งเรียนรู้นอกห้องเรียน</th><th colspan="${CORNERS.length}" style="background:#c8e6fa">มุมเสริมประสบการณ์แหล่งเรียนรู้นอกห้องเรียน</th></tr>
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

// ── Component ─────────────────────────────────────────────────────────────────
export default function CornerTab({ teacherClassFilter = null }) {
  const { cornerRecords, setCornerRecords, students, teachers, classes, schoolName, academicYear } = useApp();

  const today = new Date().toISOString().slice(0, 10);
  const [selClass, setSelClass]   = useState(teacherClassFilter ?? '');
  const [selDate,  setSelDate]    = useState(today); // จะ normalize เป็น Monday
  const [weekNo,   setWeekNo]     = useState('');    // สัปดาห์ที่ (กรอกเอง)

  const classList = useMemo(() => {
    if (teacherClassFilter) return [teacherClassFilter];
    return (classes ?? []).map(c => c.name ?? c.id).filter(Boolean).sort();
  }, [classes, teacherClassFilter]);

  const cn       = selClass || classList[0] || '';
  const monday   = getMondayOf(selDate);
  const weekKey  = `${cn}||${monday}`;

  // ครูประจำห้อง
  const classTeacher = useMemo(
    () => teachers?.find(t => t.className === cn) ?? null,
    [teachers, cn]
  );

  // นักเรียนในห้อง (ไม่รวม placeholder)
  const classStudents = useMemo(
    () => (students ?? []).filter(s => s.className === cn && !s.name.startsWith('(ว่าง)')),
    [students, cn]
  );

  // record สัปดาห์นี้
  const weekData = cornerRecords[weekKey] ?? {};

  function toggleCorner(studentId, cornerKey) {
    const sid = String(studentId);
    const cur = weekData[sid] ?? { ...EMPTY_CORNER_RECORD };
    const updated = { ...weekData, [sid]: { ...cur, [cornerKey]: !cur[cornerKey] } };
    setCornerRecords(prev => ({ ...prev, [weekKey]: updated }));
  }

  function toggleAll(cornerKey) {
    const allOn = classStudents.every(s => weekData[String(s.id)]?.[cornerKey]);
    const updated = {};
    classStudents.forEach(s => {
      const sid = String(s.id);
      updated[sid] = { ...(weekData[sid] ?? { ...EMPTY_CORNER_RECORD }), [cornerKey]: !allOn };
    });
    setCornerRecords(prev => ({ ...prev, [weekKey]: { ...weekData, ...updated } }));
  }

  function clearWeek() {
    if (!window.confirm(`ล้างข้อมูลสัปดาห์นี้ (${getWeekLabel(monday)})?`)) return;
    setCornerRecords(prev => {
      const next = { ...prev };
      delete next[weekKey];
      return next;
    });
  }

  // rows for print
  const printRows = classStudents.map(s => ({
    name: s.name,
    ...( weekData[String(s.id)] ?? EMPTY_CORNER_RECORD ),
  }));

  const cell  = { border: '1px solid #e0f2fe', padding: '.3rem .5rem', textAlign: 'center', verticalAlign: 'middle' };
  const thSt  = { ...cell, background: '#f0f9ff', fontWeight: 700, fontSize: '.78rem', lineHeight: 1.3, whiteSpace: 'pre-line' };

  return (
    <div className="animate-fade">
      {/* ── Header ── */}
      <div style={{
        background: 'linear-gradient(135deg,#0284c7,#38bdf8)',
        borderRadius: '16px', padding: '1.1rem 1.5rem',
        color: 'white', marginBottom: '1.25rem',
        display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: '.2rem' }}>
            🌿 แบบบันทึกการใช้แหล่งเรียนรู้นอกห้องเรียนรายสัปดาห์
          </div>
          <div style={{ opacity: .85, fontSize: '.82rem' }}>
            บันทึก checkmark รายนักเรียน × แหล่งเรียนรู้ทั้ง {CORNERS.length} แห่ง
          </div>
        </div>
        <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* เลือกห้อง */}
          {!teacherClassFilter && classList.length > 1 && (
            <select value={cn} onChange={e => setSelClass(e.target.value)}
              style={{ padding: '.35rem .6rem', borderRadius: '8px', border: 'none', fontSize: '.82rem', fontFamily: 'inherit', background: 'rgba(255,255,255,.2)', color: 'white' }}>
              {classList.map(c => <option key={c} value={c} style={{ color: '#000' }}>{c}</option>)}
            </select>
          )}
          {/* วันที่ */}
          <input type="date" value={selDate} onChange={e => setSelDate(e.target.value)}
            style={{ padding: '.35rem .6rem', borderRadius: '8px', border: 'none', fontSize: '.82rem', fontFamily: 'inherit', background: 'rgba(255,255,255,.2)', color: 'white' }} />
          {/* สัปดาห์ที่ */}
          <input type="number" min="1" max="52" value={weekNo} onChange={e => setWeekNo(e.target.value)}
            placeholder="สัปดาห์ที่"
            style={{ width: '90px', padding: '.35rem .6rem', borderRadius: '8px', border: 'none', fontSize: '.82rem', fontFamily: 'inherit', background: 'rgba(255,255,255,.2)', color: 'white' }} />
          <button type="button" onClick={() => printCornerSheet(printRows, weekNo, monday, cn, schoolName, classTeacher, academicYear)}
            style={{ padding: '.4rem .9rem', borderRadius: '8px', border: '1.5px solid rgba(255,255,255,.5)', background: 'rgba(255,255,255,.15)', color: 'white', fontFamily: 'inherit', fontWeight: 600, fontSize: '.82rem', cursor: 'pointer' }}>
            🖨️ พิมพ์
          </button>
          <button type="button" onClick={clearWeek}
            style={{ padding: '.4rem .9rem', borderRadius: '8px', border: '1.5px solid rgba(255,255,255,.4)', background: 'rgba(255,0,0,.15)', color: 'white', fontFamily: 'inherit', fontWeight: 600, fontSize: '.82rem', cursor: 'pointer' }}>
            🗑️ ล้าง
          </button>
        </div>
      </div>

      {/* ── สัปดาห์ info ── */}
      <div style={{ background: '#f0f9ff', borderRadius: '10px', padding: '.55rem 1rem', marginBottom: '1rem', fontSize: '.83rem', color: '#0369a1', fontWeight: 600 }}>
        📅 สัปดาห์ที่ {weekNo || '—'}  ({getWeekLabel(monday)})  ·  ห้อง {cn}  ·  นักเรียน {classStudents.length} คน
      </div>

      {/* ── ตาราง ── */}
      {classStudents.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#9ca3af', fontSize: '.9rem' }}>
          ยังไม่มีข้อมูลนักเรียนในห้องนี้
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.85rem' }}>
            <thead>
              <tr style={{ background: '#bae6fd' }}>
                <th style={{ ...thSt, width: '36px' }}>ที่</th>
                <th style={{ ...thSt, textAlign: 'left', minWidth: '170px' }}>ชื่อ – นามสกุล</th>
                {CORNERS.map(c => (
                  <th key={c.key} style={{ ...thSt, width: '82px', cursor: 'pointer' }}
                    title={`คลิกเพื่อเลือก/ยกเลิกทั้งหมด — ${c.short}`}
                    onClick={() => toggleAll(c.key)}>
                    {c.label}
                    <div style={{ fontSize: '.65rem', fontWeight: 400, color: '#0369a1', marginTop: '.1rem' }}>( คลิกเลือกทั้งหมด )</div>
                  </th>
                ))}
                <th style={{ ...thSt, width: '52px' }}>รวม</th>
              </tr>
            </thead>
            <tbody>
              {classStudents.map((s, i) => {
                const sid = String(s.id);
                const rec = weekData[sid] ?? {};
                const count = CORNERS.filter(c => rec[c.key]).length;
                return (
                  <tr key={s.id} style={{ background: i % 2 === 0 ? 'white' : '#f0f9ff', verticalAlign: 'middle' }}>
                    <td style={{ ...cell, color: '#6b7280' }}>{i + 1}</td>
                    <td style={{ ...cell, textAlign: 'left', fontWeight: 600 }}>{s.name}</td>
                    {CORNERS.map(c => (
                      <td key={c.key} style={{ ...cell, cursor: 'pointer' }}
                        onClick={() => toggleCorner(s.id, c.key)}>
                        {rec[c.key]
                          ? <span style={{ color: '#0891b2', fontWeight: 800, fontSize: '1.1rem' }}>✓</span>
                          : <span style={{ color: '#e2e8f0', fontSize: '1rem' }}>○</span>
                        }
                      </td>
                    ))}
                    <td style={{ ...cell, fontWeight: 700, color: count > 0 ? '#0369a1' : '#9ca3af' }}>
                      {count > 0 ? count : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {/* ── footer: ยอดรวมแต่ละมุม ── */}
            <tfoot>
              <tr style={{ background: '#e0f2fe' }}>
                <td colSpan={2} style={{ ...cell, textAlign: 'right', fontWeight: 700, fontSize: '.78rem', color: '#0369a1' }}>
                  จำนวนที่ไป (คน)
                </td>
                {CORNERS.map(c => {
                  const cnt = classStudents.filter(s => weekData[String(s.id)]?.[c.key]).length;
                  return (
                    <td key={c.key} style={{ ...cell, fontWeight: 800, color: cnt > 0 ? '#0369a1' : '#9ca3af' }}>
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

      {/* ── คำชี้แจง ── */}
      <div style={{ marginTop: '.75rem', fontSize: '.75rem', color: '#9ca3af', lineHeight: 1.6 }}>
        💡 คลิกที่เซลล์เพื่อบันทึก ✓ · คลิกหัวคอลัมน์เพื่อเลือก/ยกเลิกทั้งห้อง · เลือกวันที่ใดก็จะอ้างอิงสัปดาห์นั้น (จันทร์–อาทิตย์)
      </div>
    </div>
  );
}
