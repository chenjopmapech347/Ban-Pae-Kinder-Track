import { useApp } from '../../context/AppContext';
import StudentModal from '../StudentModal';
import AssessmentWizard from '../AssessmentWizard';
import { exportStudentsListExcel } from '../../utils/exportExcel';
import { useState, useRef } from 'react';
// wizardRef ใช้ anchor scroll fallback

export default function StudentsTab() {
  const {
    students, setStudents, assessmentTopics,
    handleImport, setSelectedStudent,
    schoolName, academicYear,
  } = useApp();

  // ── ฟังก์ชันพิมพ์รายชื่อนักเรียน (รูปแบบแบบสำรวจ) ──
  const printRoster = (termNo = 1) => {
    const ALL_CLASSES = ['อ.1/1','อ.1/2','อ.2/1','อ.2/2','อ.3/1','อ.3/2','อ.3/3'];
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
        .sort((a, b) => Number(a.id) - Number(b.id));
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
  @media print {
    .page { padding: 10mm 15mm; }
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
  const [assessAnchorY,    setAssessAnchorY] = useState(null);
  const wizardRef = useRef(null);

  const startAssess = (e, s) => {
    setAssessAnchorY(e.clientY);
    setAssessing(s);
  };
  const [search, setSearch]           = useState('');
  const [selectedLevel, setLevel]     = useState('all');
  const [selectedClass, setClass]     = useState('all');

  const LEVEL_META = [
    { level: 'all', label: 'ทั้งหมด',   emoji: '📚', color: '#7c3aed', bg: '#f5f3ff' },
    { level: 'K1',  label: 'อนุบาล 1', emoji: '🟢', color: '#059669', bg: '#ecfdf5' },
    { level: 'K2',  label: 'อนุบาล 2', emoji: '🟡', color: '#b45309', bg: '#fffbeb' },
    { level: 'K3',  label: 'อนุบาล 3', emoji: '🔵', color: '#2563eb', bg: '#eff6ff' },
  ];
  const CLASS_MAP = {
    K1: ['อ.1/1', 'อ.1/2'],
    K2: ['อ.2/1', 'อ.2/2'],
    K3: ['อ.3/1', 'อ.3/2', 'อ.3/3'],
  };

  const handleLevelClick = (lv) => {
    setLevel(lv);
    setClass('all');
  };

  const filtered = students.filter(s => {
    const matchName  = s.name.includes(search.trim());
    const matchLevel = selectedLevel === 'all' || s.level === selectedLevel;
    const matchClass = selectedClass === 'all' || s.className === selectedClass;
    return matchName && matchLevel && matchClass;
  });

  return (
    <div className="glass p-6 animate-fade">
      <div className="page-header mb-6">
        <h3>จัดการนักเรียนทั้งหมด</h3>
        <div className="flex gap-2" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
          <input className="input" style={{ maxWidth: '180px' }} placeholder="🔍 ค้นหา..."
            value={search} onChange={e => setSearch(e.target.value)} />

          {/* ── ตั้ง PIN ให้ตรงกับรหัสประจำตัว ── */}
          <button type="button" className="btn" style={{ background: '#fef9c3', color: '#713f12', fontWeight: 700 }}
            onClick={() => {
              const updated = students.map(s => ({
                ...s,
                parentPin: s.code ?? String(s.id),
              }));
              setStudents(updated);
              alert(`✅ ตั้ง PIN ให้นักเรียน ${updated.length} คน เรียบร้อยแล้ว`);
            }}>
            🔑 ตั้ง PIN = รหัสประจำตัว
          </button>

          <button type="button" className="btn" style={{ background: '#dcfce7', color: '#166534' }}
            onClick={() => exportStudentsListExcel(students, assessmentTopics, schoolName, academicYear)}>
            📗 Excel
          </button>
          <button type="button" className="btn" style={{ background: '#fef3c7', color: '#92400e' }}
            onClick={() => printRoster(1)}>
            🖨️ พิมพ์รายชื่อ
          </button>
          <button className="btn" style={{ background: '#f0f9ff' }} onClick={() => {
            const text = prompt('วาง CSV (ชื่อ, ชั้น, อายุ, น้ำหนัก, ส่วนสูง)');
            if (text) {
              const r = handleImport('students', 'name,level,age,weight,height\n' + text);
              alert(r.ok ? 'นำเข้าสำเร็จ! ✅' : r.message);
            }
          }}>📥 CSV</button>
          <button className="btn btn-primary" onClick={() => { setEditingItem(null); setIsModalOpen(true); }}>
            + เพิ่มนักเรียน
          </button>
        </div>
      </div>

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
              <th style={{ width: '90px' }}>รหัสประจำตัว</th>
              <th>ชื่อ-นามสกุล</th>
              <th>ชั้น</th>
              <th>PIN ผู้ปกครอง</th>
              <th>สถานะประเมิน</th>
              <th>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => {
              const indCount = Object.keys(s.assessments?.indicators ?? {}).length;
              const actCount = Object.values(s.assessments?.indicators ?? {}).reduce((sum, m) => sum + Object.keys(m).length, 0);
              return (
                <tr key={s.id} className="hover-row">
                  <td>
                    <code style={{ fontSize: '.75rem', background: '#f1f5f9', padding: '.1rem .4rem', borderRadius: '5px', color: '#475569', fontWeight: 700 }}>
                      {s.code ?? s.id}
                    </code>
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
                  <td><code style={{ background: '#f5f3ff', padding: '.15rem .5rem', borderRadius: '6px', fontSize: '.8rem' }}>{s.parentPin ?? '—'}</code></td>
                  <td>
                    {actCount > 0
                      ? <span className="badge badge-success" title={`${indCount} ตัวบ่งชี้ · ${actCount} กิจกรรม`}>
                          ✅ {actCount} กิจกรรม
                        </span>
                      : <span className="badge badge-accent">⏳ ยังไม่ประเมิน</span>}
                  </td>
                  <td>
                    <div className="row-actions">
                      <button className="btn btn-sm" style={{ background: '#ede9fe', color: 'var(--primary)' }}
                        onClick={() => setSelectedStudent(s)}>📄 รายงาน</button>
                      <button className="btn btn-sm btn-primary"
                        onClick={e => startAssess(e, s)}>✏️ ประเมิน</button>
                      <button className="btn btn-sm"
                        onClick={() => { setEditingItem(s); setIsModalOpen(true); }}>แก้ไข</button>
                      <button className="btn btn-sm" style={{ color: 'var(--danger)' }}
                        onClick={() => { if(confirm('ลบข้อมูลนักเรียน?')) setStudents(students.filter(x => x.id !== s.id)); }}>ลบ</button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!filtered.length && (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>ไม่พบข้อมูล</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <StudentModal
        key={editingItem?.id ? 'edit-' + editingItem.id : 'new-admin'}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={data => {
          if (editingItem) setStudents(students.map(s => s.id === editingItem.id ? { ...s, ...data } : s));
          else setStudents([...students, { ...data, id: Date.now() }]);
          setIsModalOpen(false);
        }}
        editingStudent={editingItem}
      />

      {/* Assessment Wizard — overlay modal near click */}
      {assessingStudent && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,.45)',
          zIndex: 300,
          overflowY: 'auto',
          paddingTop: Math.max(12, (assessAnchorY ?? window.innerHeight / 2) - 120) + 'px',
          paddingBottom: '24px',
          display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
        }}
          onClick={e => { if (e.target === e.currentTarget) setAssessing(null); }}
        >
          <div ref={wizardRef} style={{ width: '100%', maxWidth: '780px', margin: '0 1rem' }}
            onClick={e => e.stopPropagation()}>
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
              onCancel={() => { setAssessing(null); setAssessAnchorY(null); }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
