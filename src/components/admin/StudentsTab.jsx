import { useApp } from '../../context/AppContext';
import StudentModal from '../StudentModal';
import AssessmentWizard from '../AssessmentWizard';
import { exportStudentsListExcel } from '../../utils/exportExcel';
import { useState, useRef, useEffect } from 'react';
import Modal, { ModalCancelBtn, ModalConfirmBtn } from '../Modal';
// wizardRef ใช้ anchor scroll fallback

export default function StudentsTab() {
  const {
    students, setStudents, assessmentTopics,
    handleImport, setSelectedStudent,
    schoolName, schoolLogo, academicYear, allClassNames, classMap,
    addSystemLog, user,
  } = useApp();

  // ── ฟังก์ชันพิมพ์รายชื่อนักเรียน (รูปแบบแบบสำรวจ) ──
  const printRoster = (termNo = 1) => {
    const ALL_CLASSES = allClassNames;
    // กรองห้องตามที่เลือก
    let CLASS_ORDER;
    if (selectedClass !== 'all') {
      CLASS_ORDER = [selectedClass];
    } else if (selectedLevel !== 'all') {
      CLASS_ORDER = ALL_CLASSES.filter(c => students.find(s => s.className === c && s.level === selectedLevel));
    } else {
      CLASS_ORDER = ALL_CLASSES;
    }
    const pages = CLASS_ORDER.map(cls => {
      const list = students
        .filter(s => s.className === cls && !s.name.startsWith('(ว่าง)'))
        .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '', 'th'));
      if (!list.length) return '';
      const levelLabel = cls.replace('อ.', 'อนุบาล ');
      const rows = list.map((s, i) => `
        <tr>
          <td class="center">${i + 1}</td>
          <td class="center">${s.id}</td>
          <td>${s.name}</td>
          <td class="center" style="font-size:11pt">${s.nationalId ?? ''}</td>
          <td></td>
        </tr>`).join('');
      return `
        <div class="page">
          ${schoolLogo ? `<div style="text-align:center;margin-bottom:4px"><img src="${schoolLogo}" style="height:70px;object-fit:contain"/></div>` : ''}
          <div class="title">แบบสำรวจนักเรียน</div>
          <div class="sub">ประจำภาคเรียนที่ ${termNo} ปีการศึกษา ${academicYear}</div>
          <div class="sub">${schoolName || 'โรงเรียนเทศบาลบ้านเพ ๑'}</div>
          <div class="sub cls">นักเรียนระดับชั้น ${levelLabel}</div>
          <table>
            <thead>
              <tr>
                <th style="width:44px">ลำดับ</th>
                <th style="width:88px">รหัสประจำตัว</th>
                <th>ชื่อ - นามสกุล</th>
                <th style="width:162px">เลขประจำตัวประชาชน</th>
                <th style="width:70px">หมายเหตุ</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <div class="count">จำนวนนักเรียนทั้งหมด ${list.length} คน</div>
        </div>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html lang="th"><head><meta charset="UTF-8">
<style>
  * { box-sizing: border-box; }
  body { font-family: 'TH Sarabun New', Sarabun, sans-serif; font-size: 14pt; margin: 0; }
  .page { padding: 15mm 20mm; page-break-after: always; }
  .page:last-of-type { page-break-after: avoid; }
  .title { text-align:center; font-size:18pt; font-weight:bold; margin-bottom:2px; }
  .sub   { text-align:center; font-size:14pt; margin-bottom:2px; }
  .cls   { font-weight:bold; margin-bottom:10px; }
  .count { text-align:right; margin-top:6px; font-size:12pt; }
  table  { width:100%; border-collapse:collapse; margin-top:8px; }
  th, td { border:1px solid #000; padding:3px 6px; font-size:13pt; }
  th     { background:#e8e8e8; text-align:center; font-weight:bold; }
  .center { text-align:center; }
  @page { size: A4 portrait; margin: 1in; }
  @media print {
    .page { padding: 0; }
  }
</style>
</head><body>${pages}</body></html>`;

    const w = window.open('', '_blank');
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 400);
  };

  const [isModalOpen, setIsModalOpen]     = useState(false);
  const [editingItem, setEditingItem]     = useState(null);
  const [assessingStudent, setAssessing]  = useState(null);
  const [exportOpen, setExportOpen]       = useState(false);
  const [importOpen, setImportOpen]       = useState(false);
  const wizardRef = useRef(null);

  /* ── ช่วงอายุ ── */
  const getAgeRange = (s) => {
    // รองรับทั้ง birthDate (camelCase จาก StudentModal) และ birthdate (legacy)
    const dateStr = s.birthDate || s.birthdate;
    if (dateStr) {
      const birth = new Date(dateStr);
      const today = new Date();
      const age = today.getFullYear() - birth.getFullYear() -
        (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate()) ? 1 : 0);
      return `${age}–${age + 1} ปี`;
    }
    if (s.age != null && s.age !== '') {
      const a = Number(s.age);
      if (!isNaN(a) && a > 0) return `${a}–${a + 1} ปี`;
    }
    const lvMap = { K1: '3–4', K2: '4–5', K3: '5–6' };
    return lvMap[s.level] ? `${lvMap[s.level]} ปี` : '—';
  };

  /* ── helpers ── */
  const fileInputRef = useRef(null);

  const downloadTemplate = () => {
    const BOM = '﻿';
    const header = 'ชื่อ-นามสกุล,ชื่อเล่น,เพศ,เลขประจำตัว,เลขบัตรประชาชน,ระดับ,ห้องเรียน,วันเกิด,อายุ,น้ำหนัก,ส่วนสูง,parentPin,ชื่อบิดา,อาชีพบิดา,ชื่อมารดา,อาชีพมารดา,เบอร์ผู้ปกครอง,ที่อยู่';
    const rows = [
      'เด็กชายตัวอย่าง ใจดี,ตัวอย่าง,ชาย,69001,1-2199-00000-00-0,K1,อ.1/1,2022-06-15,,18.5,105,1001,นายบิดา ใจดี,เกษตรกร,นางมารดา ใจดี,แม่บ้าน,0812345678,123 ถ.ตัวอย่าง',
      'เด็กหญิงตัวอย่าง สวยงาม,สวย,หญิง,69002,1-2199-00000-00-1,K2,อ.2/1,2021-03-20,,20,110,1002,นายบิดา สวยงาม,ค้าขาย,นางมารดา สวยงาม,พยาบาล,0898765432,456 ถ.ตัวอย่าง',
    ];
    const csv = BOM + header + '\n' + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'student_template.csv';
    a.click(); URL.revokeObjectURL(url);
  };

  const importCSV = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      // ลบ BOM ถ้ามี
      const raw = ev.target.result.replace(/^﻿/, '');
      const r = handleImport('students', raw);
      alert(r.ok ? `✅ นำเข้าสำเร็จ! เพิ่มนักเรียน ${r.count ?? ''} คน` : r.message);
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  };

  const autoSetPin = () => {
    const updated = students.map(s => ({ ...s, parentPin: s.studentId ?? s.code ?? String(s.id) }));
    setStudents(updated);
    alert(`✅ ตั้ง PIN ให้นักเรียน ${updated.length} คน เรียบร้อยแล้ว`);
  };

  // ── bulk-assign classroom ──
  const [assignOpen, setAssignOpen]   = useState(false);
  const [assignLevel, setAssignLevel] = useState('K1');
  const [assignClass, setAssignClass] = useState(() => classMap?.K1?.[0] ?? '');
  const ASSIGN_CLASS_MAP = classMap; // dynamic จาก AppContext
  const noClassStudents = students.filter(s => !s.className && !s.name.startsWith('(ว่าง)'));
  const assignTargets   = students.filter(s => s.level === assignLevel && !s.className && !s.name.startsWith('(ว่าง)'));

  const handleBulkAssign = () => {
    if (!assignClass) return;
    const ids = new Set(assignTargets.map(s => s.id));
    setStudents(prev => prev.map(s => ids.has(s.id) ? { ...s, className: assignClass } : s));
    alert(`✅ กำหนดห้อง ${assignClass} ให้นักเรียน ${assignTargets.length} คน เรียบร้อยแล้ว`);
    setAssignOpen(false);
  };

  const startAssess = (s) => {
    setAssessing(s);
  };
  const [search, setSearch]           = useState('');
  const [selectedLevel, setLevel]     = useState('all');
  const [selectedClass, setClass]     = useState('all');
  const [showAll, setShowAll]         = useState(false); // false = กำลังเรียนเท่านั้น

  const LEVEL_META = [
    { level: 'all', label: 'ทั้งหมด',   emoji: '📚', color: '#7c3aed', bg: '#f5f3ff' },
    { level: 'K1',  label: 'อนุบาล 1', emoji: '🟢', color: '#059669', bg: '#ecfdf5' },
    { level: 'K2',  label: 'อนุบาล 2', emoji: '🟡', color: '#b45309', bg: '#fffbeb' },
    { level: 'K3',  label: 'อนุบาล 3', emoji: '🔵', color: '#2563eb', bg: '#eff6ff' },
  ];
  const CLASS_MAP = classMap; // dynamic จาก AppContext

  const handleLevelClick = (lv) => {
    setLevel(lv);
    setClass('all');
  };

  const filtered = students.filter(s => {
    const matchName   = s.name.includes(search.trim());
    const matchLevel  = selectedLevel === 'all' || s.level === selectedLevel;
    const matchClass  = selectedClass === 'all' || s.className === selectedClass;
    const matchStatus = showAll || !s.status || s.status === 'กำลังเรียน';
    return matchName && matchLevel && matchClass && matchStatus;
  }).sort((a, b) => {
    const idA = Number(a.studentId || a.code || a.id) || 0;
    const idB = Number(b.studentId || b.code || b.id) || 0;
    return idA - idB;
  });

  const [openMenuId, setOpenMenuId] = useState(null);
  useEffect(() => {
    if (!openMenuId) return;
    const close = () => setOpenMenuId(null);
    document.addEventListener('click', close, { capture: true, once: true });
    return () => document.removeEventListener('click', close, { capture: true });
  }, [openMenuId]);

  return (
    <div className="glass p-6 animate-fade">
      <div className="page-header mb-6">
        <h3>จัดการนักเรียนทั้งหมด</h3>
        <div className="flex gap-2" style={{ flexWrap: 'wrap', alignItems: 'center' }}>

          {/* ── ค้นหา ── */}
          <input className="input" style={{ maxWidth: '180px' }} placeholder="🔍 ค้นหา..."
            value={search} onChange={e => setSearch(e.target.value)} />

          {/* ── สถานะ toggle ── */}
          <button
            type="button"
            onClick={() => setShowAll(v => !v)}
            style={{
              padding: '.38rem .8rem', borderRadius: '8px', cursor: 'pointer',
              fontFamily: 'inherit', fontWeight: 700, fontSize: '.8rem', border: 'none',
              background: showAll ? '#fef3c7' : '#f0fdf4',
              color: showAll ? '#92400e' : '#15803d',
            }}
            title={showAll ? 'แสดงทุกสถานะ' : 'แสดงเฉพาะกำลังเรียน'}
          >
            {showAll ? '📋 ทุกสถานะ' : '✅ กำลังเรียน'}
          </button>

          {/* ── ส่งออก dropdown ── */}
          <div style={{ position: 'relative' }}>
            <button type="button" className="btn" style={{ background: '#dcfce7', color: '#166534', fontWeight: 700 }}
              onClick={() => { setExportOpen(o => !o); setImportOpen(false); }}>
              📤 ส่งออก ▾
            </button>
            {exportOpen && (
              <div style={{
                position: 'absolute', top: '110%', right: 0, zIndex: 200,
                background: 'white', borderRadius: '10px', boxShadow: '0 4px 20px rgba(0,0,0,.15)',
                minWidth: '180px', padding: '.4rem 0', border: '1px solid #e5e7eb',
              }}
                onMouseLeave={() => setExportOpen(false)}>
                <button type="button"
                  style={{ display:'flex', alignItems:'center', gap:'.6rem', width:'100%', padding:'.55rem 1rem', background:'none', border:'none', cursor:'pointer', fontSize:'.88rem', color:'#166534' }}
                  onClick={() => { exportStudentsListExcel(students, assessmentTopics, schoolName, academicYear); setExportOpen(false); }}>
                  📗 ส่งออก Excel
                </button>
                <button type="button"
                  style={{ display:'flex', alignItems:'center', gap:'.6rem', width:'100%', padding:'.55rem 1rem', background:'none', border:'none', cursor:'pointer', fontSize:'.88rem', color:'#92400e' }}
                  onClick={() => { printRoster(1); setExportOpen(false); }}>
                  🖨️ พิมพ์รายชื่อ
                </button>
              </div>
            )}
          </div>

          {/* ── นำเข้า dropdown ── */}
          {/* hidden file input สำหรับ import CSV */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            style={{ display: 'none' }}
            onChange={handleFileImport}
          />

          <div style={{ position: 'relative' }}>
            <button type="button" className="btn" style={{ background: '#f0f9ff', color: '#0369a1', fontWeight: 700 }}
              onClick={() => { setImportOpen(o => !o); setExportOpen(false); }}>
              📥 นำเข้า ▾
            </button>
            {importOpen && (
              <div style={{
                position: 'absolute', top: '110%', right: 0, zIndex: 200,
                background: 'white', borderRadius: '10px', boxShadow: '0 4px 20px rgba(0,0,0,.15)',
                minWidth: '210px', padding: '.4rem 0', border: '1px solid #e5e7eb',
              }}
                onMouseLeave={() => setImportOpen(false)}>
                <div style={{ padding:'.3rem 1rem .2rem', fontSize:'.72rem', fontWeight:800, color:'#9ca3af', textTransform:'uppercase' }}>
                  ไฟล์
                </div>
                <button type="button"
                  style={{ display:'flex', alignItems:'center', gap:'.6rem', width:'100%', padding:'.55rem 1rem', background:'none', border:'none', cursor:'pointer', fontSize:'.88rem', color:'#0369a1' }}
                  onClick={() => { downloadTemplate(); setImportOpen(false); }}>
                  📋 ดาวน์โหลด Template CSV
                </button>
                <button type="button"
                  style={{ display:'flex', alignItems:'center', gap:'.6rem', width:'100%', padding:'.55rem 1rem', background:'none', border:'none', cursor:'pointer', fontSize:'.88rem', color:'#374151' }}
                  onClick={() => { importCSV(); setImportOpen(false); }}>
                  📂 นำเข้าจาก CSV
                </button>
                <div style={{ height:'1px', background:'#f3f4f6', margin:'.3rem 0' }} />
                <div style={{ padding:'.3rem 1rem .2rem', fontSize:'.72rem', fontWeight:800, color:'#9ca3af', textTransform:'uppercase' }}>
                  เครื่องมือ
                </div>
                <button type="button"
                  style={{ display:'flex', alignItems:'center', gap:'.6rem', width:'100%', padding:'.55rem 1rem', background:'none', border:'none', cursor:'pointer', fontSize:'.88rem', color:'#713f12' }}
                  onClick={() => { autoSetPin(); setImportOpen(false); }}>
                  🔑 ตั้ง PIN = รหัสประจำตัว
                </button>
              </div>
            )}
          </div>

          {/* ── เพิ่มนักเรียน ── */}
          <button className="btn btn-primary" onClick={() => { setEditingItem(null); setIsModalOpen(true); }}>
            + เพิ่มนักเรียน
          </button>
        </div>
      </div>

      {/* ── แจ้งเตือน: นักเรียนไม่มีห้องเรียน ── */}
      {noClassStudents.length > 0 && (
        <div style={{ background:'#fef9c3', border:'1.5px solid #fbbf24', borderRadius:'10px', padding:'.65rem 1rem', marginBottom:'.75rem', display:'flex', alignItems:'center', gap:'.75rem', flexWrap:'wrap' }}>
          <span style={{ fontSize:'.85rem', color:'#78350f', fontWeight:700 }}>
            ⚠️ มีนักเรียน {noClassStudents.length} คน ยังไม่ได้กำหนดห้องเรียน — จะไม่แสดงในหน้าการมาเรียน
          </span>
          <button type="button"
            style={{ marginLeft:'auto', padding:'.3rem .85rem', borderRadius:'8px', fontFamily:'inherit', fontSize:'.8rem', fontWeight:700, cursor:'pointer', background:'#92400e', color:'white', border:'none' }}
            onClick={() => { setAssignLevel('K1'); setAssignClass('อ.1/1'); setAssignOpen(true); }}>
            🏠 กำหนดห้องเรียน
          </button>
        </div>
      )}

      {/* ── Filter: ระดับชั้น → ห้องเรียน ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', marginBottom: '1rem' }}>
        {/* แถว 1: ระดับชั้น */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', minWidth: '60px' }}>ระดับ</span>
          {LEVEL_META.map(({ level, label, emoji, color, bg }) => {
            const count = level === 'all' ? students.length : students.filter(s => s.level === level).length;
            const active = selectedLevel === level;
            return (
              <div key={level} onClick={() => handleLevelClick(level)} style={{
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '.35rem',
                background: active ? bg : '#f9fafb',
                border: `2px solid ${active ? color : '#e5e7eb'}`,
                borderRadius: '10px', padding: '.3rem .75rem',
                fontWeight: 700, fontSize: '.83rem',
                color: active ? color : '#6b7280', transition: 'all .15s',
              }}>
                <span>{emoji} {label}</span>
                <span style={{ background: active ? color : '#e5e7eb', color: active ? 'white' : '#6b7280', borderRadius: '999px', padding: '0 .45rem', fontSize: '.72rem' }}>
                  {count}
                </span>
              </div>
            );
          })}
          <span style={{ marginLeft: 'auto', fontSize: '.8rem', color: 'var(--text-muted)' }}>
            แสดง {filtered.length} รายการ
          </span>
        </div>

        {/* แถว 2: ห้องเรียน (แสดงเฉพาะเมื่อเลือกระดับ) */}
        {selectedLevel !== 'all' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', flexWrap: 'wrap', paddingLeft: '72px' }}>
            <span style={{ fontSize: '.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', minWidth: '0' }}>ห้อง</span>
            {[{ cls: 'all', label: 'ทุกห้อง' }, ...(CLASS_MAP[selectedLevel] ?? []).map(c => ({ cls: c, label: c }))].map(({ cls, label }) => {
              const count = cls === 'all'
                ? students.filter(s => s.level === selectedLevel).length
                : students.filter(s => s.className === cls).length;
              const active = selectedClass === cls;
              const meta = LEVEL_META.find(m => m.level === selectedLevel);
              return (
                <div key={cls} onClick={() => setClass(cls)} style={{
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '.3rem',
                  background: active ? meta.bg : '#f9fafb',
                  border: `2px solid ${active ? meta.color : '#e5e7eb'}`,
                  borderRadius: '8px', padding: '.25rem .65rem',
                  fontWeight: 700, fontSize: '.82rem',
                  color: active ? meta.color : '#6b7280', transition: 'all .15s',
                }}>
                  <span>{label}</span>
                  <span style={{ background: active ? meta.color : '#e5e7eb', color: active ? 'white' : '#6b7280', borderRadius: '999px', padding: '0 .4rem', fontSize: '.7rem' }}>
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: '130px' }}>รหัสประจำตัว</th>
              <th>ชื่อ-นามสกุล</th>
              <th style={{ width: '60px' }}>ชั้น</th>
              <th style={{ width: '75px' }}>อายุ</th>
              <th style={{ width: '100px' }}>สถานะ</th>
              <th style={{ width: '90px' }}>PIN</th>
              <th style={{ position: 'sticky', right: 0, background: '#f8fafc', zIndex: 2, width: '175px', boxShadow: '-3px 0 8px rgba(0,0,0,.06)' }}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => {
              return (
                <tr key={s.id} className="hover-row">
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                      {/* รูปภาพเด็ก */}
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                        overflow: 'hidden', border: '2px solid #e5e7eb',
                        background: s.name.includes('ชาย') ? '#dbeafe' : '#fce7f3',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {s.photo
                          ? <img src={s.photo} alt={s.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>
                              {s.name.includes('ชาย') ? '👦' : '👧'}
                            </span>
                        }
                      </div>
                      <code style={{ fontSize: '.75rem', background: '#f1f5f9', padding: '.1rem .4rem', borderRadius: '5px', color: '#475569', fontWeight: 700 }}>
                        {s.studentId || s.code || '—'}
                      </code>
                    </div>
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => setSelectedStudent(s)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer',
                        fontFamily: 'inherit', fontWeight: 600, color: 'var(--primary)',
                        textDecoration: 'underline', padding: 0, textAlign: 'left' }}
                    >{s.name}</button>
                  </td>
                  <td><span className={'badge badge-' + s.level.toLowerCase()}>{s.level}</span></td>
                  <td>
                    <span style={{ fontSize: '.82rem', color: '#475569', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {getAgeRange(s)}
                    </span>
                  </td>
                  <td>
                    {(!s.status || s.status === 'กำลังเรียน' || s.status === 'ปกติ')
                      ? <span className="badge" style={{ background:'#d1fae5',color:'#065f46' }}>✅ เรียนอยู่</span>
                      : s.status === 'จบการศึกษา'
                        ? <span className="badge" style={{ background:'#dbeafe',color:'#1e40af' }}>🎓 จบแล้ว</span>
                        : s.status === 'ลาออก'
                          ? <span className="badge" style={{ background:'#fee2e2',color:'#991b1b' }}>📤 ลาออก</span>
                          : s.status === 'พักการเรียน'
                            ? <span className="badge" style={{ background:'#fef3c7',color:'#92400e' }}>⏸️ พัก</span>
                            : <span className="badge" style={{ background:'#f3f4f6',color:'#6b7280' }}>{s.status}</span>}
                  </td>
                  <td><code style={{ background: '#f5f3ff', padding: '.15rem .5rem', borderRadius: '6px', fontSize: '.8rem' }}>{s.parentPin ?? '—'}</code></td>
                  <td style={{ position: 'sticky', right: 0, background: 'white', zIndex: 1, boxShadow: '-3px 0 8px rgba(0,0,0,.06)' }}>
                    <div style={{ display: 'flex', gap: '.35rem', alignItems: 'center' }}>
                      <button className="btn btn-sm" style={{ background: '#ede9fe', color: 'var(--primary)', whiteSpace: 'nowrap' }}
                        onClick={() => setSelectedStudent(s)}>📄 รายงาน</button>
                      <button className="btn btn-sm btn-primary" style={{ whiteSpace: 'nowrap' }}
                        onClick={() => startAssess(s)}>✏️ ประเมิน</button>
                      {/* ⋮ dropdown */}
                      <div style={{ position: 'relative' }}>
                        <button className="btn btn-sm" style={{ padding: '.25rem .5rem', fontWeight: 900, fontSize: '1rem', lineHeight: 1 }}
                          onClick={() => setOpenMenuId(openMenuId === s.id ? null : s.id)}>⋮</button>
                        {openMenuId === s.id && (
                          <div style={{
                            position: 'absolute', top: '110%', right: 0, zIndex: 300,
                            background: 'white', borderRadius: '10px',
                            boxShadow: '0 4px 20px rgba(0,0,0,.15)',
                            minWidth: '130px', padding: '.3rem 0',
                            border: '1px solid #e5e7eb',
                          }}
                            onMouseLeave={() => setOpenMenuId(null)}>
                            <button type="button"
                              style={{ display:'flex', alignItems:'center', gap:'.6rem', width:'100%', padding:'.5rem 1rem', background:'none', border:'none', cursor:'pointer', fontSize:'.85rem', color:'#374151', fontFamily:'inherit' }}
                              onClick={() => { setEditingItem(s); setIsModalOpen(true); setOpenMenuId(null); }}>
                              ✏️ แก้ไขข้อมูล
                            </button>
                            <div style={{ height:'1px', background:'#f3f4f6', margin:'.2rem 0' }} />
                            <button type="button"
                              style={{ display:'flex', alignItems:'center', gap:'.6rem', width:'100%', padding:'.5rem 1rem', background:'none', border:'none', cursor:'pointer', fontSize:'.85rem', color:'#dc2626', fontFamily:'inherit' }}
                              onClick={() => {
                                setOpenMenuId(null);
                                if (confirm('ลบข้อมูลนักเรียน?')) {
                                  setStudents(students.filter(x => x.id !== s.id));
                                  addSystemLog?.('delete_student', `ลบนักเรียน: ${s.name} — ${s.className ?? ''}`, user?.name ?? 'admin');
                                }
                              }}>
                              🗑️ ลบนักเรียน
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!filtered.length && (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>ไม่พบข้อมูล</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <StudentModal
        key={editingItem?.id ? 'edit-' + editingItem.id : 'new-admin'}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={data => {
          if (editingItem) {
            setStudents(students.map(s => s.id === editingItem.id ? { ...s, ...data } : s));
            addSystemLog?.('edit_student', `แก้ไขนักเรียน: ${data.name} — ${data.className ?? ''}`, user?.name ?? 'admin');
          } else {
            setStudents([...students, { ...data, id: Date.now() }]);
            addSystemLog?.('add_student', `เพิ่มนักเรียนใหม่: ${data.name} — ${data.className ?? ''}`, user?.name ?? 'admin');
          }
          setIsModalOpen(false);
        }}
        editingStudent={editingItem}
      />

      {/* Assessment Wizard */}
      <Modal
        isOpen={!!assessingStudent}
        onClose={() => setAssessing(null)}
        title={`✏️ ประเมินพัฒนาการ${assessingStudent ? ` — ${assessingStudent.name}` : ''}`}
        size="xl"
      >
        {assessingStudent && (
          <div ref={wizardRef} style={{ padding: '1rem', overflowY: 'auto' }}>
            <AssessmentWizard
              student={assessingStudent}
              onSave={updatedAssessments => {
                const updated = students.map(s =>
                  s.id === assessingStudent.id
                    ? { ...s, assessments: updatedAssessments }
                    : s
                );
                setStudents(updated);
                setAssessing(prev => ({ ...prev, assessments: updatedAssessments }));
              }}
              onCancel={() => setAssessing(null)}
            />
          </div>
        )}
      </Modal>

      {/* Modal: bulk assign classroom */}
      <Modal
        isOpen={assignOpen}
        onClose={() => setAssignOpen(false)}
        title="🏠 กำหนดห้องเรียน"
        size="sm"
      >
        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
          <p style={{ margin:0, fontSize:'.8rem', color:'var(--text-muted)' }}>
            กำหนดห้องเรียนให้นักเรียนที่ยังไม่มีห้อง โดยเลือกระดับชั้น → ห้อง
          </p>

          <div>
            <label style={{ display:'block', fontWeight:700, fontSize:'.83rem', marginBottom:'.3rem' }}>ระดับชั้น</label>
            <div style={{ display:'flex', gap:'.4rem' }}>
              {['K1','K2','K3'].map(lv => (
                <button key={lv} type="button"
                  style={{ flex:1, padding:'.35rem', borderRadius:'8px', fontFamily:'inherit', fontWeight:700, fontSize:'.82rem', cursor:'pointer',
                    background: assignLevel===lv ? '#7c3aed' : '#f5f3ff',
                    color: assignLevel===lv ? 'white' : '#7c3aed',
                    border: '1.5px solid #7c3aed' }}
                  onClick={() => { setAssignLevel(lv); setAssignClass(ASSIGN_CLASS_MAP[lv]?.[0] ?? ''); }}>
                  {lv === 'K1' ? 'อนุบาล 1' : lv === 'K2' ? 'อนุบาล 2' : 'อนุบาล 3'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display:'block', fontWeight:700, fontSize:'.83rem', marginBottom:'.3rem' }}>ห้องเรียน</label>
            <div style={{ display:'flex', gap:'.4rem', flexWrap:'wrap' }}>
              {(ASSIGN_CLASS_MAP[assignLevel] || []).map(cls => (
                <button key={cls} type="button"
                  style={{ padding:'.35rem .85rem', borderRadius:'8px', fontFamily:'inherit', fontWeight:700, fontSize:'.82rem', cursor:'pointer',
                    background: assignClass===cls ? '#059669' : '#f0fdf4',
                    color: assignClass===cls ? 'white' : '#059669',
                    border: '1.5px solid #059669' }}
                  onClick={() => setAssignClass(cls)}>
                  {cls}
                </button>
              ))}
            </div>
          </div>

          <div style={{ background:'#f0fdf4', borderRadius:'8px', padding:'.6rem .85rem', fontSize:'.82rem', color:'#065f46' }}>
            {assignTargets.length > 0
              ? `✅ จะกำหนดห้อง "${assignClass}" ให้นักเรียน ${assignTargets.length} คน (ระดับ ${assignLevel} ที่ยังไม่มีห้อง)`
              : `ℹ️ ไม่มีนักเรียนระดับ ${assignLevel} ที่รอกำหนดห้อง`}
          </div>

          <div style={{ display:'flex', gap:'.6rem' }}>
            <ModalCancelBtn onClick={() => setAssignOpen(false)} />
            <ModalConfirmBtn
              onClick={handleBulkAssign}
              label="🏠 กำหนดห้องเรียน"
              disabled={assignTargets.length === 0}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
