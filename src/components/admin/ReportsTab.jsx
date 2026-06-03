import { useApp } from '../../context/AppContext';
import { ClassOverviewChart } from '../DevelopmentChart';
import { AssessmentProgressBars } from '../DevelopmentChart';

export default function ReportsTab() {
  const { students, assessmentTopics, announcements } = useApp();

  // Compute class-level averages
  const avgSummary = {};
  assessmentTopics.forEach(t => {
    const valid = students.filter(s => s.assessments?.summary?.[t.id] != null);
    avgSummary[t.id] = valid.length
      ? parseFloat((valid.reduce((a,s)=>a+(s.assessments.summary[t.id]??0),0)/valid.length).toFixed(1))
      : 0;
  });

  return (
    <div className="glass p-6 animate-fade">
      <div className="page-header mb-6">
        <h3>📊 สรุปรายงานผลการประเมินรายโรงเรียน</h3>
        <button className="btn btn-primary" onClick={() => window.print()}>🖨️ พิมพ์รายงาน</button>
      </div>

      <div className="grid grid-2 mb-6" style={{ gap:'1.25rem' }}>
        {/* Average progress bars */}
        <div className="glass-card">
          <h4 className="mb-4">📈 พัฒนาการเฉลี่ยภาพรวม</h4>
          <AssessmentProgressBars topics={assessmentTopics} summary={avgSummary} />
        </div>

        {/* Class breakdown */}
        <div className="glass-card">
          <h4 className="mb-4">🌱 เปรียบเทียบแต่ละชั้น</h4>
          <ClassOverviewChart students={students} topics={assessmentTopics} />
        </div>
      </div>

      {/* Announcements archive */}
      <div className="glass-card">
        <h4 className="mb-4">📢 ประกาศทั้งหมด ({announcements.length} รายการ)</h4>
        <div style={{ display:'flex',flexDirection:'column',gap:'.5rem', maxHeight:'320px', overflowY:'auto' }}>
          {announcements.map((a,i) => (
            <div key={i} style={{ padding:'.6rem .85rem', borderRadius:'10px', background:'#f5f3ff', fontSize:'.88rem' }}>
              <div style={{ fontWeight:600 }}>{a.title}</div>
              <div style={{ fontSize:'.72rem',color:'var(--text-muted)',marginTop:'.15rem' }}>{a.date}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
