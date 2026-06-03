import { useApp } from '../../context/AppContext';
import StudentModal from '../StudentModal';
import AssessmentWizard from '../AssessmentWizard';
import { exportStudentsListExcel } from '../../utils/exportExcel';
import { useState } from 'react';

export default function StudentsTab() {
  const {
    students, setStudents, assessmentTopics,
    handleImport, setSelectedStudent, setEvaluatingStudent,
    schoolName, academicYear,
  } = useApp();

  const [isModalOpen, setIsModalOpen]     = useState(false);
  const [editingItem, setEditingItem]     = useState(null);
  const [assessingStudent, setAssessing]  = useState(null);
  const [search, setSearch]               = useState('');
  const [levelFilter, setLevelFilter]     = useState('all');

  const filtered = students.filter(s => {
    const matchName  = s.name.includes(search.trim());
    const matchLevel = levelFilter === 'all' || s.level === levelFilter;
    return matchName && matchLevel;
  });

  return (
    <div className="glass p-6 animate-fade">
      <div className="page-header mb-6">
        <h3>จัดการนักเรียนทั้งหมด</h3>
        <div className="flex gap-2" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
          <input className="input" style={{ maxWidth: '180px' }} placeholder="🔍 ค้นหา..."
            value={search} onChange={e => setSearch(e.target.value)} />

          {/* Dropdown filter K1/K2/K3 */}
          <select
            className="input"
            style={{ maxWidth: '140px' }}
            value={levelFilter}
            onChange={e => setLevelFilter(e.target.value)}
          >
            <option value="all">📚 ทุกระดับชั้น</option>
            <option value="K1">🟢 K1 (อนุบาล 1)</option>
            <option value="K2">🟡 K2 (อนุบาล 2)</option>
            <option value="K3">🔵 K3 (อนุบาล 3)</option>
          </select>

          <button type="button" className="btn" style={{ background: '#dcfce7', color: '#166534' }}
            onClick={() => exportStudentsListExcel(students, assessmentTopics, schoolName, academicYear)}>
            📗 Excel
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

      {/* สรุปจำนวน */}
      <div className="flex gap-3 mb-4" style={{ flexWrap: 'wrap' }}>
        {[
          { label: 'ทั้งหมด', level: 'all',  color: '#7c3aed', bg: '#f5f3ff' },
          { label: 'K1',      level: 'K1',   color: '#059669', bg: '#ecfdf5' },
          { label: 'K2',      level: 'K2',   color: '#b45309', bg: '#fffbeb' },
          { label: 'K3',      level: 'K3',   color: '#2563eb', bg: '#eff6ff' },
        ].map(item => (
          <div
            key={item.level}
            onClick={() => setLevelFilter(item.level)}
            style={{
              cursor: 'pointer',
              background: levelFilter === item.level ? item.bg : '#f9fafb',
              border: `2px solid ${levelFilter === item.level ? item.color : '#e5e7eb'}`,
              borderRadius: '10px', padding: '.4rem .9rem',
              display: 'flex', alignItems: 'center', gap: '.4rem',
              fontWeight: 700, fontSize: '.85rem', color: levelFilter === item.level ? item.color : '#6b7280',
              transition: 'all .2s',
            }}
          >
            <span>{item.label}</span>
            <span style={{
              background: levelFilter === item.level ? item.color : '#e5e7eb',
              color: levelFilter === item.level ? 'white' : '#6b7280',
              borderRadius: '999px', padding: '0 .5rem', fontSize: '.75rem',
            }}>
              {item.level === 'all' ? students.length : students.filter(s => s.level === item.level).length}
            </span>
          </div>
        ))}
        <div style={{ marginLeft: 'auto', fontSize: '.82rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
          แสดง {filtered.length} รายการ
        </div>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
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
                        onClick={() => setAssessing(s)}>✏️ ประเมิน</button>
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

      {/* Assessment Wizard */}
      {assessingStudent && (
        <AssessmentWizard
          student={assessingStudent}
          onSave={updatedAssessments => {
            const updated = students.map(s =>
              s.id === assessingStudent.id
                ? { ...s, assessments: updatedAssessments }
                : s
            );
            setStudents(updated);
            // อัปเดต assessingStudent ให้แสดงคะแนนล่าสุดทันที
            setAssessing(prev => ({ ...prev, assessments: updatedAssessments }));
          }}
          onCancel={() => setAssessing(null)}
        />
      )}
    </div>
  );
}
