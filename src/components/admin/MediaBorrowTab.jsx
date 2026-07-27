// MediaBorrowTab.jsx — รายการยืม-คืนสื่อการสอน
import { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';

/* ── Thai date helpers ────────────────────────────────────────────────────── */
const THAI_MONTHS_BORROW = [
  'มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
  'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม',
];
// ปี พ.ศ. ใกล้ปัจจุบัน (2565–2575)
const BE_YEARS_BORROW = Array.from({ length: 11 }, (_, i) => 2565 + i);

function parseISO(iso) {
  if (!iso) return { d: '', m: '', y: '' };
  const [ce, m, d] = iso.split('-');
  return { d: d ? Number(d) : '', m: m ? Number(m) : '', y: ce ? Number(ce) + 543 : '' };
}
function buildISO(d, m, y) {
  if (!d || !m || !y) return '';
  return `${Number(y) - 543}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}
function todayParts() {
  const t = new Date();
  return { d: t.getDate(), m: t.getMonth() + 1, y: t.getFullYear() + 543 };
}

const STATUS_META = {
  'กำลังยืม': { badge: '#b45309', bg: '#fef3c7' },
  'คืนแล้ว':  { badge: '#059669', bg: '#d1fae5' },
};

const EMPTY_FORM = {
  mediaId:            '',    // id ของ mediaRecord ที่ยืม (ถ้าเลือกจากรายการ)
  mediaName:          '',    // ชื่อสื่อ (พิมพ์ตรง ถ้าไม่ได้เลือกจากรายการ)
  borrowerName:       '',    // ชื่อผู้ยืม
  className:          '',    // ห้องเรียน
  borrowDate:         '',    // วันที่ยืม
  expectedReturnDate: '',    // กำหนดคืน
  note:               '',    // หมายเหตุ
};

/* ── Format date Thai ─────────────────────────────────────────────────────── */
function thaiDate(isoStr) {
  if (!isoStr) return '—';
  try {
    return new Date(isoStr).toLocaleDateString('th-TH', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch { return isoStr; }
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function isOverdue(record) {
  if (record.status !== 'กำลังยืม' || !record.expectedReturnDate) return false;
  return record.expectedReturnDate < todayISO();
}

/* ── Print borrow list ─────────────────────────────────────────────────────── */
function printBorrowList(records, cn, schoolName, academicYear, schoolLogo) {
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap');
    *{box-sizing:border-box}
    body{font-family:'Sarabun',sans-serif;font-size:11pt;margin:0;padding:0}
    h2{text-align:center;font-size:14pt;font-weight:800;margin:.2rem 0}
    .sub{text-align:center;font-size:10pt;margin:.15rem 0}
    table{width:100%;border-collapse:collapse;margin-top:.6rem;font-size:9.5pt}
    th,td{border:1px solid #555;padding:3px 5px;vertical-align:middle}
    th{background:#ddd;text-align:center;font-weight:700}
    .tc{text-align:center} .tl{text-align:left}
    .overdue{color:#dc2626;font-weight:700}
    @media print{@page{size:A4 portrait;margin:1in}body{margin:0}}
  `;
  const rows = records.map((r, i) => `
    <tr>
      <td class="tc">${i + 1}</td>
      <td class="tl">${r.mediaName ?? ''}</td>
      <td class="tl">${r.className ?? ''}</td>
      <td class="tl">${r.borrowerName ?? ''}</td>
      <td class="tc">${thaiDate(r.borrowDate)}</td>
      <td class="tc ${isOverdue(r) ? 'overdue' : ''}">${thaiDate(r.expectedReturnDate)}</td>
      <td class="tc">${r.status === 'คืนแล้ว' ? '✓' : ''}</td>
      <td class="tc">${thaiDate(r.returnDate)}</td>
      <td class="tl">${r.note ?? ''}</td>
    </tr>`).join('');
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
    <title>รายการยืม-คืนสื่อ</title><style>${css}</style></head>
    <body>
      ${schoolLogo ? `<div style="text-align:center;margin-bottom:4px"><img src="${schoolLogo}" style="height:70px;object-fit:contain"/></div>` : ''}
      <h2>รายการยืม-คืนสื่อการสอน</h2>
      ${academicYear ? `<div class="sub">ปีการศึกษา ${academicYear}</div>` : ''}
      ${cn ? `<div class="sub">ห้องเรียน ${cn}</div>` : ''}
      ${schoolName ? `<div class="sub">${schoolName}</div>` : ''}
      <table>
        <thead>
          <tr>
            <th style="width:26px">ที่</th>
            <th class="tl" style="min-width:160px">ชื่อสื่อ / นวัตกรรม</th>
            <th style="width:72px">ห้อง</th>
            <th class="tl" style="min-width:110px">ผู้ยืม</th>
            <th style="width:84px">วันที่ยืม</th>
            <th style="width:84px">กำหนดคืน</th>
            <th style="width:55px">คืนแล้ว</th>
            <th style="width:84px">วันที่คืน</th>
            <th class="tl" style="min-width:60px">หมายเหตุ</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <script>setTimeout(()=>window.print(),500)</` + `script>
    </body></html>`;
  const w = window.open('', '_blank', 'width=1050,height=750');
  if (!w) { alert('กรุณาอนุญาต popup'); return; }
  w.document.write(html);
  w.document.close();
}

/* ════════════════════════════════════════════════════════════════════════════ */
export default function MediaBorrowTab({ teacherClassFilter = null }) {
  const {
    mediaRecords, mediaBorrowRecords, setMediaBorrowRecords,
    classes, schoolName, academicYear, schoolLogo, user, role,
    addSystemLog,
  } = useApp();

  const isAdmin   = role === 'admin';

  /* ── UI state ── */
  const [showForm,  setShowForm]  = useState(false);
  const [editId,    setEditId]    = useState(null);
  const [form,      setForm]      = useState(EMPTY_FORM);
  const [selClass,  setSelClass]  = useState(teacherClassFilter ?? '');
  const [viewFilter, setViewFilter] = useState('กำลังยืม'); // 'ทั้งหมด' | 'กำลังยืม' | 'คืนแล้ว'
  const [search,    setSearch]    = useState('');

  /* ── Thai date state for form ── */
  const [bdDay,  setBdDay]  = useState('');
  const [bdMon,  setBdMon]  = useState('');
  const [bdYear, setBdYear] = useState('');
  const [rdDay,  setRdDay]  = useState('');
  const [rdMon,  setRdMon]  = useState('');
  const [rdYear, setRdYear] = useState('');

  // sync date parts เมื่อ form เปลี่ยน (openNew / openEdit)
  useEffect(() => {
    const b = parseISO(form.borrowDate);
    setBdDay(b.d); setBdMon(b.m); setBdYear(b.y);
    const r = parseISO(form.expectedReturnDate);
    setRdDay(r.d); setRdMon(r.m); setRdYear(r.y);
  }, [showForm]); // reset ทุกครั้งที่ form เปิด/ปิด

  function handleBorrowDate(part, val) {
    const v = val !== '' ? Number(val) : '';
    let d = bdDay, m = bdMon, y = bdYear;
    if (part === 'd') { d = v; setBdDay(v); }
    if (part === 'm') { m = v; setBdMon(v); }
    if (part === 'y') { y = v; setBdYear(v); }
    const iso = buildISO(d, m, y);
    if (iso) setForm(f => ({ ...f, borrowDate: iso }));
  }
  function handleReturnDate(part, val) {
    const v = val !== '' ? Number(val) : '';
    let d = rdDay, m = rdMon, y = rdYear;
    if (part === 'd') { d = v; setRdDay(v); }
    if (part === 'm') { m = v; setRdMon(v); }
    if (part === 'y') { y = v; setRdYear(v); }
    const iso = buildISO(d, m, y);
    if (iso) setForm(f => ({ ...f, expectedReturnDate: iso }));
  }

  /* ── Class list ── */
  const classList = useMemo(() => {
    if (teacherClassFilter) return [teacherClassFilter];
    return (classes ?? []).map(c => c.name ?? c.id).filter(Boolean).sort();
  }, [classes, teacherClassFilter]);

  const cn = selClass || classList[0] || '';

  /* ── Media pick list — แสดงทุกรายการจากทะเบียนสื่อ (ไม่กรองตามห้อง) ── */
  const mediaOptions = useMemo(() =>
    (mediaRecords ?? [])
      .sort((a, b) => (a.item ?? '').localeCompare(b.item ?? '', 'th')),
    [mediaRecords]
  );

  /* ── Filtered borrow records ── */
  const records = useMemo(() => {
    let list = (mediaBorrowRecords ?? [])
      .filter(r => !cn || r.className === cn);
    if (viewFilter !== 'ทั้งหมด') list = list.filter(r => r.status === viewFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(r =>
        (r.mediaName ?? '').toLowerCase().includes(q) ||
        (r.borrowerName ?? '').toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
  }, [mediaBorrowRecords, cn, viewFilter, search]);

  /* ── Summary stats ── */
  const stats = useMemo(() => {
    const classRecords = (mediaBorrowRecords ?? []).filter(r => !cn || r.className === cn);
    return {
      total:    classRecords.length,
      active:   classRecords.filter(r => r.status === 'กำลังยืม').length,
      returned: classRecords.filter(r => r.status === 'คืนแล้ว').length,
      overdue:  classRecords.filter(r => isOverdue(r)).length,
    };
  }, [mediaBorrowRecords, cn]);

  /* ── Form helpers ── */
  function openNew() {
    setEditId(null);
    const { d, m, y } = todayParts();
    const iso = buildISO(d, m, y);
    setBdDay(d); setBdMon(m); setBdYear(y);
    setRdDay(''); setRdMon(''); setRdYear('');
    setForm({ ...EMPTY_FORM, className: cn, borrowDate: iso });
    setShowForm(true);
  }

  function openEdit(r) {
    setEditId(r.id);
    setForm({
      mediaId:            r.mediaId            ?? '',
      mediaName:          r.mediaName          ?? '',
      borrowerName:       r.borrowerName       ?? '',
      className:          r.className          ?? cn,
      borrowDate:         r.borrowDate         ?? '',
      expectedReturnDate: r.expectedReturnDate ?? '',
      note:               r.note               ?? '',
    });
    setShowForm(true);
  }

  function cancelForm() {
    setForm(EMPTY_FORM);
    setEditId(null);
    setShowForm(false);
  }

  function save(e) {
    e.preventDefault();
    if (!form.mediaName.trim() || !form.borrowerName.trim()) return;
    if (editId) {
      setMediaBorrowRecords(prev =>
        prev.map(r => r.id === editId ? { ...r, ...form, className: cn } : r)
      );
      addSystemLog?.('save', `แก้ไขรายการยืมสื่อ: ${form.mediaName}`, user?.name ?? '');
    } else {
      const newRec = {
        ...form,
        id:        Date.now(),
        className: form.className || cn,
        status:    'กำลังยืม',
        returnDate: null,
        createdAt: new Date().toISOString(),
      };
      setMediaBorrowRecords(prev => [newRec, ...(prev ?? [])]);
      addSystemLog?.('save', `บันทึกการยืมสื่อ: ${form.mediaName} — ${form.borrowerName}`, user?.name ?? '');
    }
    cancelForm();
  }

  function markReturned(rec) {
    if (!confirm(`ยืนยันการคืนสื่อ "${rec.mediaName}"?`)) return;
    setMediaBorrowRecords(prev =>
      prev.map(r => r.id === rec.id
        ? { ...r, status: 'คืนแล้ว', returnDate: todayISO() }
        : r
      )
    );
    addSystemLog?.('save', `บันทึกการคืนสื่อ: ${rec.mediaName} — ${rec.borrowerName}`, user?.name ?? '');
  }

  function deleteBorrow(rec) {
    if (!confirm(`ลบรายการยืม "${rec.mediaName}"?`)) return;
    setMediaBorrowRecords(prev => prev.filter(r => r.id !== rec.id));
  }

  /* ── Inline styles ── */
  const inp = {
    width: '100%', padding: '.4rem .6rem',
    border: '1px solid #d1d5db', borderRadius: '6px',
    fontSize: '.85rem', fontFamily: 'inherit', boxSizing: 'border-box',
  };
  const lbl = {
    fontSize: '.78rem', fontWeight: 700, color: '#374151',
    marginBottom: '.25rem', display: 'block',
  };
  const cell = { border: '1px solid #fef3c7', padding: '.4rem .6rem' };

  return (
    <div className="animate-fade">

      {/* ── Header ── */}
      <div style={{
        background: 'linear-gradient(135deg,#d97706,#f59e0b)',
        borderRadius: '16px', padding: '1.1rem 1.5rem',
        color: 'white', marginBottom: '1.25rem',
        display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: '.2rem' }}>
            🔄 รายการยืม-คืนสื่อการสอน
          </div>
          <div style={{ opacity: .85, fontSize: '.82rem' }}>
            บันทึกการยืมและคืนสื่อ / นวัตกรรมการเรียนการสอน
          </div>
        </div>
        <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {!teacherClassFilter && classList.length > 1 && (
            <select value={selClass} onChange={e => setSelClass(e.target.value)}
              style={{ padding: '.35rem .6rem', borderRadius: '8px', border: 'none', fontSize: '.82rem', fontFamily: 'inherit', background: 'rgba(255,255,255,.2)', color: 'white' }}>
              {classList.map(c => <option key={c} value={c} style={{ color: '#000' }}>{c}</option>)}
            </select>
          )}
          <button type="button"
            onClick={() => printBorrowList(records, cn, schoolName, academicYear, schoolLogo)}
            style={{ padding: '.4rem .9rem', borderRadius: '8px', border: '1.5px solid rgba(255,255,255,.5)', background: 'rgba(255,255,255,.15)', color: 'white', fontFamily: 'inherit', fontWeight: 600, fontSize: '.82rem', cursor: 'pointer' }}>
            🖨️ พิมพ์
          </button>
          <button type="button" onClick={openNew}
            style={{ padding: '.4rem .9rem', borderRadius: '8px', border: 'none', background: 'white', color: '#d97706', fontFamily: 'inherit', fontWeight: 700, fontSize: '.82rem', cursor: 'pointer' }}>
            + บันทึกการยืม
          </button>
        </div>
      </div>

      {/* ── Summary cards ── */}
      <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        {[
          { label: 'รายการทั้งหมด',  value: stats.total,    color: '#7c3aed', icon: '📋' },
          { label: 'กำลังยืม',        value: stats.active,   color: '#d97706', icon: '📤' },
          { label: 'คืนแล้ว',         value: stats.returned, color: '#059669', icon: '✅' },
          { label: 'เกินกำหนด',       value: stats.overdue,  color: '#dc2626', icon: '⚠️' },
        ].map(s => (
          <div key={s.label} style={{
            flex: '1 1 120px', background: 'white',
            border: `1.5px solid ${s.color}22`,
            borderRadius: '14px', padding: '.9rem 1rem',
            display: 'flex', flexDirection: 'column', gap: '.2rem',
            boxShadow: `0 2px 10px ${s.color}10`,
          }}>
            <div style={{ fontSize: '1.2rem', lineHeight: 1 }}>{s.icon}</div>
            <div style={{ fontSize: '1.55rem', fontWeight: 900, color: s.color, lineHeight: 1.1 }}>{s.value}</div>
            <div style={{ fontSize: '.7rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.04em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Borrow Form ── */}
      {showForm && (
        <div style={{
          background: 'white', borderRadius: '12px', border: '1.5px solid #fde68a',
          padding: '1.25rem', marginBottom: '1.25rem',
          boxShadow: '0 4px 16px rgba(217,119,6,.1)',
        }}>
          <div style={{ fontWeight: 800, fontSize: '.95rem', color: '#d97706', marginBottom: '1rem' }}>
            {editId ? '✏️ แก้ไขรายการยืม' : '➕ บันทึกการยืมสื่อใหม่'}
          </div>
          <form onSubmit={save}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>

              {/* เลือกสื่อจากทะเบียน */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={lbl}>ชื่อสื่อ / นวัตกรรม *</label>
                <div style={{ display: 'flex', gap: '.5rem' }}>
                  <select style={{ ...inp, flex: 1 }}
                    value={form.mediaId}
                    onChange={e => {
                      const opt = mediaOptions.find(o => String(o.id) === e.target.value);
                      setForm(f => ({
                        ...f,
                        mediaId:   e.target.value,
                        mediaName: opt?.item ?? f.mediaName,
                      }));
                    }}>
                    <option value="">— เลือกจากทะเบียนสื่อ —</option>
                    {mediaOptions.map(o => (
                      <option key={o.id} value={String(o.id)}>{o.item}</option>
                    ))}
                  </select>
                  <span style={{ alignSelf: 'center', color: '#9ca3af', fontSize: '.8rem', whiteSpace: 'nowrap' }}>หรือพิมพ์:</span>
                  <input style={{ ...inp, flex: 1 }} placeholder="ชื่อสื่อ..."
                    value={form.mediaName}
                    onChange={e => setForm(f => ({ ...f, mediaName: e.target.value, mediaId: '' }))} />
                </div>
              </div>

              {/* ผู้ยืม */}
              <div>
                <label style={lbl}>ผู้ยืม *</label>
                <input style={inp} required placeholder="ชื่อครู / ผู้ยืม..."
                  value={form.borrowerName}
                  onChange={e => setForm(f => ({ ...f, borrowerName: e.target.value }))} />
              </div>

              {/* ห้อง */}
              <div>
                <label style={lbl}>ห้องเรียน</label>
                {teacherClassFilter ? (
                  <input style={{ ...inp, background: '#f9fafb', color: '#6b7280' }}
                    value={cn} readOnly />
                ) : (
                  <select style={inp} value={form.className || cn}
                    onChange={e => setForm(f => ({ ...f, className: e.target.value }))}>
                    {classList.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                )}
              </div>

              {/* วันที่ยืม */}
              <div>
                <label style={lbl}>วันที่ยืม (พ.ศ.)</label>
                <div style={{ display: 'flex', gap: '.35rem' }}>
                  <select style={{ ...inp, flex: '0 0 64px' }} value={bdDay} onChange={e => handleBorrowDate('d', e.target.value)}>
                    <option value="">วัน</option>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <select style={{ ...inp, flex: 1 }} value={bdMon} onChange={e => handleBorrowDate('m', e.target.value)}>
                    <option value="">เดือน</option>
                    {THAI_MONTHS_BORROW.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
                  </select>
                  <select style={{ ...inp, flex: '0 0 80px' }} value={bdYear} onChange={e => handleBorrowDate('y', e.target.value)}>
                    <option value="">ปี</option>
                    {BE_YEARS_BORROW.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              {/* กำหนดคืน */}
              <div>
                <label style={lbl}>กำหนดวันคืน (พ.ศ.)</label>
                <div style={{ display: 'flex', gap: '.35rem' }}>
                  <select style={{ ...inp, flex: '0 0 64px' }} value={rdDay} onChange={e => handleReturnDate('d', e.target.value)}>
                    <option value="">วัน</option>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <select style={{ ...inp, flex: 1 }} value={rdMon} onChange={e => handleReturnDate('m', e.target.value)}>
                    <option value="">เดือน</option>
                    {THAI_MONTHS_BORROW.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
                  </select>
                  <select style={{ ...inp, flex: '0 0 80px' }} value={rdYear} onChange={e => handleReturnDate('y', e.target.value)}>
                    <option value="">ปี</option>
                    {BE_YEARS_BORROW.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              {/* หมายเหตุ */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={lbl}>หมายเหตุ</label>
                <input style={inp} placeholder="หมายเหตุ..."
                  value={form.note}
                  onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button type="button" onClick={cancelForm}
                style={{ padding: '.4rem 1rem', borderRadius: '8px', border: '1.5px solid #d1d5db', background: 'white', fontFamily: 'inherit', fontSize: '.85rem', cursor: 'pointer' }}>
                ยกเลิก
              </button>
              <button type="submit"
                disabled={!form.mediaName.trim() || !form.borrowerName.trim()}
                style={{
                  padding: '.4rem 1.2rem', borderRadius: '8px', border: 'none',
                  background: (form.mediaName.trim() && form.borrowerName.trim()) ? '#d97706' : '#e5e7eb',
                  color: 'white', fontFamily: 'inherit', fontWeight: 700, fontSize: '.85rem',
                  cursor: (form.mediaName.trim() && form.borrowerName.trim()) ? 'pointer' : 'default',
                }}>
                {editId ? '💾 บันทึกการแก้ไข' : '✅ บันทึกการยืม'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Filter bar ── */}
      <div style={{ display: 'flex', gap: '.6rem', flexWrap: 'wrap', marginBottom: '1rem', alignItems: 'center' }}>
        {['ทั้งหมด', 'กำลังยืม', 'คืนแล้ว'].map(f => (
          <button key={f} type="button"
            onClick={() => setViewFilter(f)}
            style={{
              padding: '.35rem .85rem', borderRadius: '999px', border: 'none',
              fontFamily: 'inherit', fontWeight: 700, fontSize: '.82rem', cursor: 'pointer',
              background: viewFilter === f ? '#d97706' : '#f3f4f6',
              color:      viewFilter === f ? 'white'   : '#374151',
            }}>
            {f === 'กำลังยืม' ? `📤 ${f}` : f === 'คืนแล้ว' ? `✅ ${f}` : `📋 ${f}`}
          </button>
        ))}
        <div style={{ position: 'relative', flex: '1 1 180px', minWidth: '150px' }}>
          <span style={{ position: 'absolute', left: '.65rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '.85rem' }}>🔍</span>
          <input style={{ ...inp, paddingLeft: '2rem' }}
            placeholder="ค้นหาชื่อสื่อ / ผู้ยืม..."
            value={search}
            onChange={e => setSearch(e.target.value)} />
        </div>
        <span style={{ marginLeft: 'auto', fontSize: '.78rem', color: '#6b7280', whiteSpace: 'nowrap' }}>
          {records.length} รายการ
        </span>
      </div>

      {/* ── Table ── */}
      {records.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#9ca3af', fontSize: '.9rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '.5rem' }}>🔄</div>
          {(mediaBorrowRecords ?? []).filter(r => !cn || r.className === cn).length === 0
            ? 'ยังไม่มีรายการยืมสื่อ กด "+ บันทึกการยืม" เพื่อเริ่มต้น'
            : 'ไม่พบรายการที่ตรงกับเงื่อนไข'}
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.85rem' }}>
            <thead>
              <tr style={{ background: '#fffbeb' }}>
                <th style={{ ...cell, width: '32px', textAlign: 'center' }}>ที่</th>
                <th style={{ ...cell, textAlign: 'center', minWidth: '160px' }}>ชื่อสื่อ / นวัตกรรม</th>
                <th style={{ ...cell, width: '72px', textAlign: 'center' }}>ห้อง</th>
                <th style={{ ...cell, textAlign: 'center', minWidth: '110px' }}>ผู้ยืม</th>
                <th style={{ ...cell, width: '90px', textAlign: 'center' }}>วันที่ยืม</th>
                <th style={{ ...cell, width: '90px', textAlign: 'center' }}>กำหนดคืน</th>
                <th style={{ ...cell, width: '80px', textAlign: 'center' }}>สถานะ</th>
                <th style={{ ...cell, width: '90px', textAlign: 'center' }}>วันที่คืน</th>
                <th style={{ ...cell, textAlign: 'center', minWidth: '70px' }}>หมายเหตุ</th>
                <th style={{ ...cell, width: '100px', textAlign: 'center' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r, i) => {
                const overdueFlag = isOverdue(r);
                const meta = STATUS_META[r.status] ?? { badge: '#6b7280', bg: '#f3f4f6' };
                return (
                  <tr key={r.id} style={{
                    background: overdueFlag ? '#fff7ed' : i % 2 === 0 ? 'white' : '#fffbeb',
                    verticalAlign: 'middle',
                  }}>
                    <td style={{ ...cell, textAlign: 'center', color: '#9ca3af', fontSize: '.78rem' }}>{i + 1}</td>
                    <td style={{ ...cell, fontWeight: 600, color: '#111827' }}>
                      {r.mediaName}
                    </td>
                    <td style={{ ...cell, textAlign: 'center' }}>
                      <span style={{ background: '#ede9fe', color: '#7c3aed', borderRadius: '6px', padding: '.15rem .45rem', fontSize: '.78rem', fontWeight: 700 }}>
                        {r.className}
                      </span>
                    </td>
                    <td style={{ ...cell, fontSize: '.83rem' }}>{r.borrowerName}</td>
                    <td style={{ ...cell, textAlign: 'center', fontSize: '.78rem', color: '#4b5563' }}>
                      {thaiDate(r.borrowDate)}
                    </td>
                    <td style={{ ...cell, textAlign: 'center', fontSize: '.78rem', color: overdueFlag ? '#dc2626' : '#4b5563', fontWeight: overdueFlag ? 700 : 400 }}>
                      {thaiDate(r.expectedReturnDate)}
                      {overdueFlag && <div style={{ fontSize: '.68rem', color: '#dc2626' }}>⚠️ เกินกำหนด</div>}
                    </td>
                    <td style={{ ...cell, textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-block',
                        background: meta.bg, color: meta.badge,
                        borderRadius: '999px', padding: '.2rem .55rem',
                        fontSize: '.72rem', fontWeight: 700,
                      }}>
                        {r.status}
                      </span>
                    </td>
                    <td style={{ ...cell, textAlign: 'center', fontSize: '.78rem', color: '#4b5563' }}>
                      {r.returnDate ? thaiDate(r.returnDate) : '—'}
                    </td>
                    <td style={{ ...cell, fontSize: '.78rem', color: '#6b7280' }}>{r.note ?? ''}</td>
                    <td style={{ ...cell, textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '.3rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        {r.status === 'กำลังยืม' && (
                          <button type="button" onClick={() => markReturned(r)}
                            style={{ padding: '.2rem .5rem', borderRadius: '5px', border: 'none', background: '#d1fae5', color: '#059669', cursor: 'pointer', fontSize: '.72rem', fontWeight: 700 }}>
                            คืนแล้ว
                          </button>
                        )}
                        <button type="button" onClick={() => openEdit(r)}
                          style={{ padding: '.2rem .5rem', borderRadius: '5px', border: 'none', background: '#e0f2fe', color: '#0891b2', cursor: 'pointer', fontSize: '.72rem', fontWeight: 700 }}>
                          แก้ไข
                        </button>
                        {isAdmin && (
                          <button type="button" onClick={() => deleteBorrow(r)}
                            style={{ padding: '.2rem .5rem', borderRadius: '5px', border: 'none', background: '#fee2e2', color: '#dc2626', cursor: 'pointer', fontSize: '.72rem', fontWeight: 700 }}>
                            ลบ
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
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
