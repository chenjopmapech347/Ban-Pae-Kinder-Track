import { useApp } from '../context/AppContext';
import { getQualityText } from '../utils/helpers';
import { exportStudentReportExcel } from '../utils/exportExcel';
import { RadarDevChart, AssessmentProgressBars } from '../components/DevelopmentChart';

function exportStudentCsv(student, topics, schoolName, academicYear) {
  const rows = [
    ['สมุดรายงานประจำตัวเด็กปฐมวัย'],
    ['โรงเรียน', schoolName],
    ['ปีการศึกษา', academicYear],
    ['ชื่อ', student.name],
    ['ชั้น', student.level],
    [],
    ['ด้านพัฒนาการ', 'ระดับคุณภาพ'],
    ...topics.map((t, i) => [
      (i + 1) + '. ด้าน' + t.label,
      getQualityText(student?.assessments?.summary?.[t.id]),
    ]),
    [],
    ['มาเรียน', student.attendance?.present ?? 0],
    ['ลา/ขาด', student.attendance?.absent ?? 0],
  ];
  const csv = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'report-' + student.id + '.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportPage() {
  const {
    selectedStudent: student, setSelectedStudent,
    assessmentTopics, schoolName, schoolLogo, academicYear,
  } = useApp();

  if (!student) return null;

  const isBoy   = student.name.includes('ชาย');
  const total   = student.attendance?.total ?? 0;
  const present = student.attendance?.present ?? 0;
  const absent  = student.attendance?.absent ?? 0;
  const pct     = total ? Math.round((present / total) * 100) : 0;
  const summary = student.assessments?.summary ?? {};

  return (
    <div className="animate-fade">
      {/* Toolbar */}
      <div className="page-header mb-6 no-print">
        <button type="button" className="btn" onClick={() => setSelectedStudent(null)}>
          ← ย้อนกลับ
        </button>
        <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
          <button type="button" className="btn"
            style={{ background: '#dcfce7', color: '#166534' }}
            onClick={() => exportStudentReportExcel(student, assessmentTopics, schoolName, academicYear)}>
            📗 Excel
          </button>
          <button type="button" className="btn"
            style={{ background: '#ecfdf5', color: '#047857' }}
            onClick={() => exportStudentCsv(student, assessmentTopics, schoolName, academicYear)}>
            CSV
          </button>
          <button type="button" className="btn btn-primary" onClick={() => window.print()}>
            🖨️ พิมพ์
          </button>
        </div>
      </div>

      <div className="report-book mb-8">
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg,#7c3aed 0%,#a855f7 60%,#ec4899 100%)',
          borderRadius: '24px 24px 0 0', padding: '2rem', color: 'white', textAlign: 'center',
        }}>
          {schoolLogo && (
            <img
              src={schoolLogo}
              alt="โลโก้โรงเรียน"
              style={{ height: '72px', objectFit: 'contain', marginBottom: '.5rem',
                       filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.25))' }}
            />
          )}
          <div style={{ fontSize: '.8rem', opacity: .8, marginBottom: '.25rem', letterSpacing: '.05em' }}>
            สมุดรายงานประจำตัวเด็กปฐมวัย
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800 }}>{schoolName}</div>
          <div style={{ fontSize: '.85rem', opacity: .8 }}>ปีการศึกษา {academicYear}</div>
        </div>

        <div className="glass" style={{ borderRadius: '0 0 24px 24px', padding: '2rem', borderTop: 'none' }}>

          {/* Student Info */}
          <div className="flex gap-4 mb-6 items-center" style={{ flexWrap: 'wrap' }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%', flexShrink: 0,
              background: isBoy ? '#dbeafe' : '#fce7f3',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem',
              border: '3px solid ' + (isBoy ? '#93c5fd' : '#f9a8d4'),
            }}>
              {student.photo
                ? <img src={student.photo} alt={student.name} style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%' }} />
                : (isBoy ? '👦' : '👧')}
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: '1.2rem', marginBottom: '.5rem' }}>{student.name}</h2>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '.88rem', color: 'var(--text-muted)' }}>
                <span>📚 ชั้นอนุบาล {student.level?.replace('K', '')}</span>
                <span>🎂 อายุ {student.age} ปี</span>
                <span>⚖️ {student.weight} กก.</span>
                <span>📐 {student.height} ซม.</span>
              </div>
            </div>
          </div>

          {/* Assessment — two-column: bars + radar */}
          <h4 className="mb-4 border-b pb-2">🌱 สรุปผลการประเมินพัฒนาการ</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            {/* Left: progress bars */}
            <div>
              <AssessmentProgressBars topics={assessmentTopics} summary={summary} />
            </div>
            {/* Right: radar chart */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <RadarDevChart topics={assessmentTopics} summary={summary} />
            </div>
          </div>

          {/* Attendance */}
          <h4 className="mb-3 border-b pb-2">📅 สถิติการมาเรียน</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '.75rem', marginBottom: '1rem' }}>
            <div style={{ background: '#d1fae5', borderRadius: '12px', padding: '.85rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#065f46' }}>{present}</div>
              <div style={{ fontSize: '.75rem', color: '#065f46' }}>✅ มาเรียน</div>
            </div>
            <div style={{ background: '#fee2e2', borderRadius: '12px', padding: '.85rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#991b1b' }}>{absent}</div>
              <div style={{ fontSize: '.75rem', color: '#991b1b' }}>❌ ขาด/ลา</div>
            </div>
            <div style={{ background: '#ede9fe', borderRadius: '12px', padding: '.85rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#7c3aed' }}>{pct}%</div>
              <div style={{ fontSize: '.75rem', color: '#7c3aed' }}>📊 อัตรามา</div>
            </div>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: pct + '%' }} />
          </div>
          <div className="text-xs text-muted mt-1 text-right">{present} จาก {total} วัน</div>
        </div>
      </div>
    </div>
  );
}
