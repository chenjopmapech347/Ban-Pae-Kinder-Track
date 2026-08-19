import { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { exportClassSummaryExcel, exportActivityDetailExcel, exportActivityLogExcel } from '../../utils/exportExcel';
import FormReportsTab from './FormReportsTab';
import { callClaude, buildWeeklySummaryPrompt } from '../../utils/aiHelper';

// ── constants ─────────────────────────────────────────────────────────────────
// CLASS_MAP ดึงจาก AppContext (classMap) ใน each component แบบ dynamic
const LEVEL_META  = [
  { level:'K1', label:'อนุบาล 1', color:'#059669', bg:'#ecfdf5' },
  { level:'K2', label:'อนุบาล 2', color:'#b45309', bg:'#fffbeb' },
  { level:'K3', label:'อนุบาล 3', color:'#2563eb', bg:'#eff6ff' },
];
const SCORES = [
  { v:3, label:'ดีมาก',     short:'3', color:'#059669', bg:'#d1fae5' },
  { v:2, label:'พอใช้',      short:'2', color:'#b45309', bg:'#fef3c7' },
  { v:1, label:'ต้องพัฒนา', short:'1', color:'#dc2626', bg:'#fee2e2' },
];

const SUB_TABS = [
  { id:'forms',    label:'📄 แบบฟอร์มพิมพ์' },
  { id:'topic',    label:'📂 หัวข้อประเมิน' },
  { id:'indicator',label:'📋 ตัวบ่งชี้' },
  { id:'activity', label:'🎯 กิจกรรม' },
  { id:'level',    label:'🏫 ระดับชั้น' },
  { id:'class',    label:'🚪 ห้องเรียน' },
  { id:'student',  label:'👤 รายนักเรียน' },
  { id:'progress', label:'📈 พัฒนาการ' },
  { id:'ai',       label:'🤖 AI สรุป' },
];

// ── helpers ───────────────────────────────────────────────────────────────────
function getActivityScore(student, indicatorId, activityId) {
  return student.assessments?.indicators?.[indicatorId]?.[activityId]?.score ?? null;
}

// คะแนนของนักเรียนในครั้งที่ระบุ
function getRoundScore(student, indicatorId, activityId, round) {
  return student.assessments?.indicators?.[indicatorId]?.[activityId]?.[`r${round}`] ?? null;
}

// เฉลี่ยคะแนนของนักเรียนทุกกิจกรรมในหัวข้อ สำหรับครั้งที่ระบุ
function getTopicRoundAvg(student, topic, indicators, activities, round) {
  const inds = indicators.filter(i => i.domainId === topic.id);
  const scores = inds.flatMap(ind =>
    activities.filter(a => a.indicatorId === ind.id)
              .map(act => getRoundScore(student, ind.id, act.id, round))
  ).filter(v => v !== null);
  return scores.length ? scores.reduce((a,b)=>a+b,0)/scores.length : null;
}

function trendIcon(prev, curr) {
  if (prev === null || curr === null) return null;
  const diff = curr - prev;
  if (diff > 0.1)  return { icon:'↑', color:'#059669' };
  if (diff < -0.1) return { icon:'↓', color:'#dc2626' };
  return { icon:'→', color:'#6b7280' };
}

function groupStats(students, scoreFn) {
  let assessed = 0, sum = 0, s1 = 0, s2 = 0, s3 = 0;
  students.forEach(s => {
    const scores = scoreFn(s).filter(v => v !== null);
    if (!scores.length) return;
    assessed++;
    const avg = scores.reduce((a,b)=>a+b,0)/scores.length;
    sum += avg;
    if (avg >= 2.5) s3++; else if (avg >= 1.5) s2++; else s1++;
  });
  return { total: students.length, assessed, avg: assessed ? (sum/assessed).toFixed(2) : '—', s1, s2, s3 };
}

function ScoreBar({ s1, s2, s3, assessed }) {
  if (!assessed) return <span style={{ fontSize:'.72rem', color:'#cbd5e1' }}>ยังไม่มีข้อมูล</span>;
  const t = s1 + s2 + s3 || 1;
  return (
    <div style={{ display:'flex', height:'14px', borderRadius:'7px', overflow:'hidden', minWidth:'100px', flex:1 }}>
      <div title={`ดีมาก ${s3}`}    style={{ flex:s3/t, background:'#059669', minWidth: s3?'4px':0 }} />
      <div title={`พอใช้ ${s2}`}    style={{ flex:s2/t, background:'#b45309', minWidth: s2?'4px':0 }} />
      <div title={`ต้องพัฒนา ${s1}`}style={{ flex:s1/t, background:'#dc2626', minWidth: s1?'4px':0 }} />
    </div>
  );
}

function StatRow({ label, stats, color }) {
  return (
    <tr className="hover-row">
      <td style={{ fontWeight:700, color: color ?? '#374151' }}>{label}</td>
      <td style={{ textAlign:'center' }}>{stats.total}</td>
      <td style={{ textAlign:'center' }}>{stats.assessed}</td>
      <td style={{ textAlign:'center' }}>
        <span style={{ color:'#059669', fontWeight:700 }}>{stats.s3}</span>
      </td>
      <td style={{ textAlign:'center' }}>
        <span style={{ color:'#b45309', fontWeight:700 }}>{stats.s2}</span>
      </td>
      <td style={{ textAlign:'center' }}>
        <span style={{ color:'#dc2626', fontWeight:700 }}>{stats.s1}</span>
      </td>
      <td style={{ textAlign:'center', fontWeight:800, color: stats.avg==='—'?'#9ca3af':'#374151' }}>
        {stats.avg}
      </td>
      <td style={{ width:'140px' }}>
        <ScoreBar s1={stats.s1} s2={stats.s2} s3={stats.s3} assessed={stats.assessed} />
      </td>
    </tr>
  );
}

function SummaryTableHead() {
  return (
    <thead>
      <tr>
        <th>รายการ</th>
        <th style={{ width:'70px', textAlign:'center' }}>นักเรียน</th>
        <th style={{ width:'70px', textAlign:'center' }}>ประเมิน</th>
        <th style={{ width:'55px', textAlign:'center', color:'#059669' }}>ดีมาก</th>
        <th style={{ width:'55px', textAlign:'center', color:'#b45309' }}>พอใช้</th>
        <th style={{ width:'70px', textAlign:'center', color:'#dc2626' }}>ต้องพัฒนา</th>
        <th style={{ width:'60px', textAlign:'center' }}>เฉลี่ย</th>
        <th style={{ width:'140px' }}>สัดส่วน</th>
      </tr>
    </thead>
  );
}

function PillSel({ items, sel, onSel, getKey, getLabel, color='#7c3aed', bg='#f5f3ff' }) {
  return (
    <div style={{ display:'flex', flexWrap:'wrap', gap:'.35rem' }}>
      {items.map(item => {
        const k = getKey(item); const active = sel === k;
        return (
          <div key={k} onClick={() => onSel(k)} style={{
            cursor:'pointer', padding:'.28rem .7rem', borderRadius:'9px',
            border:`2px solid ${active?color:'#e5e7eb'}`,
            background: active?bg:'#f9fafb',
            fontWeight:700, fontSize:'.8rem',
            color: active?color:'#6b7280', transition:'all .14s',
          }}>
            {getLabel(item)}
          </div>
        );
      })}
    </div>
  );
}

// ── print helpers ─────────────────────────────────────────────────────────────
function printStudentReport(student, indicators, activities, assessmentTopics, schoolName, schoolLogo) {
  const topicRows = assessmentTopics.map(topic => {
    const topicInds = indicators.filter(i => i.domainId === topic.id);
    const rows = topicInds.flatMap(ind => {
      const acts = activities.filter(a => a.indicatorId === ind.id);
      return acts.map(act => {
        const sc = getActivityScore(student, ind.id, act.id);
        const scoreObj = SCORES.find(s => s.v === sc);
        return `<tr>
          <td>${topic.emoji} ${topic.label}</td>
          <td>[${ind.indicatorCode}] ${ind.label.slice(0,60)}</td>
          <td>${act.no}. ${act.label}</td>
          <td style="text-align:center;font-weight:700;color:${scoreObj?.color??'#9ca3af'}">${scoreObj?.label??'—'}</td>
        </tr>`;
      });
    });
    return rows.join('');
  }).join('');

  const logoHtml = schoolLogo
    ? `<img src="${schoolLogo}" alt="โลโก้" style="height:64px;width:64px;object-fit:contain;margin-right:14px;flex-shrink:0"/>`
    : '';

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
  <title>รายงานผล ${student.name}</title>
  <style>
    body{font-family:'Sarabun',sans-serif;font-size:13px;margin:24px}
    .report-header{display:flex;align-items:center;border-bottom:2px solid #e5e7eb;padding-bottom:12px;margin-bottom:8px}
    .report-header-text h2{margin:0 0 2px;font-size:16px}
    .report-header-text h4{margin:2px 0 4px;color:#555;font-size:12px}
    .report-header-text h3{margin:4px 0 0;font-size:14px}
    table{width:100%;border-collapse:collapse;margin-top:12px}
    th,td{border:1px solid #ddd;padding:5px 8px;font-size:11.5px}
    th{background:#f5f5f5;font-weight:700}
    @media print{@page{size:A4 portrait;margin:1in}body{margin:0}}
  </style></head><body>
  <div class="report-header">
    ${logoHtml}
    <div class="report-header-text">
      <h2>รายงานผลการประเมินพัฒนาการ</h2>
      <h4>${schoolName ?? 'โรงเรียน'} · ชั้น ${student.className} · รหัส ${student.id}</h4>
      <h3>${student.name}</h3>
    </div>
  </div>
  <table>
    <thead><tr>
      <th>หัวข้อประเมิน</th><th>ตัวบ่งชี้</th><th>กิจกรรม</th><th>ผลการประเมิน</th>
    </tr></thead>
    <tbody>${topicRows}</tbody>
  </table>
  <script>window.print();window.close();</` + `script>
  </body></html>`;
  const w = window.open('','_blank','width=900,height=700');
  w.document.write(html); w.document.close();
}

function printClassReport(classStudents, className, indicators, activities, assessmentTopics, schoolName, schoolLogo) {
  const rows = classStudents.map((student, idx) => {
    const topicCols = assessmentTopics.map(topic => {
      const topicInds = indicators.filter(i => i.domainId === topic.id);
      const scores = topicInds.flatMap(ind => activities.filter(a => a.indicatorId === ind.id).map(act => getActivityScore(student, ind.id, act.id))).filter(v => v !== null);
      const avg = scores.length ? (scores.reduce((a,b)=>a+b,0)/scores.length).toFixed(1) : '—';
      const color = scores.length ? (Number(avg)>=2.5?'#059669':Number(avg)>=1.5?'#b45309':'#dc2626') : '#9ca3af';
      return `<td style="text-align:center;font-weight:700;color:${color}">${avg}</td>`;
    }).join('');
    return `<tr><td>${idx+1}</td><td>${student.id}</td><td>${student.name}</td>${topicCols}</tr>`;
  }).join('');
  const topicHeaders = assessmentTopics.map(t => `<th>${t.emoji}${t.label}</th>`).join('');
  const logoHtml = schoolLogo
    ? `<img src="${schoolLogo}" alt="โลโก้" style="height:56px;width:56px;object-fit:contain;margin-right:12px;flex-shrink:0"/>`
    : '';
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
  <title>สรุปผลห้อง ${className}</title>
  <style>
    body{font-family:'Sarabun',sans-serif;font-size:12px;margin:20px}
    .report-header{display:flex;align-items:center;border-bottom:2px solid #e5e7eb;padding-bottom:10px;margin-bottom:10px}
    .report-header h2{font-size:15px;margin:0 0 3px} .report-header p{margin:0;font-size:11px;color:#555}
    table{width:100%;border-collapse:collapse} th,td{border:1px solid #ccc;padding:4px 7px;font-size:11px}
    th{background:#f0f0f0;font-weight:700}
    @media print{@page{size:A4 portrait;margin:1in}body{margin:0}}
  </style></head><body>
  <div class="report-header">
    ${logoHtml}
    <div>
      <h2>สรุปผลการประเมินพัฒนาการ — ห้อง ${className}</h2>
      <p>${schoolName ?? 'โรงเรียน'} (คะแนนเฉลี่ยต่อด้าน, ระดับ 1–3)</p>
    </div>
  </div>
  <table><thead><tr><th>#</th><th>รหัส</th><th>ชื่อ-นามสกุล</th>${topicHeaders}</tr></thead>
  <tbody>${rows}</tbody></table>
  <script>window.print();window.close();</` + `script></body></html>`;
  const w = window.open('','_blank','width=1000,height=700');
  w.document.write(html); w.document.close();
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-VIEWS
// ═══════════════════════════════════════════════════════════════════════════════

function ViewTopic({ students, assessmentTopics, indicators, activities, allClassNames }) {
  const ALL_CLASSES = allClassNames ?? [];
  const [selTopic, setTopic] = useState(assessmentTopics[0]?.id ?? null);
  const topObj = assessmentTopics.find(t => t.id === selTopic);
  const topicInds = useMemo(() => indicators.filter(i => i.domainId === selTopic), [indicators, selTopic]);
  const topicActs = useMemo(() => activities.filter(a => topicInds.find(i => i.id === a.indicatorId)), [activities, topicInds]);

  const scoreFn = s => topicActs.map(act => {
    const ind = topicInds.find(i => i.id === act.indicatorId);
    return getActivityScore(s, ind?.id, act.id);
  });

  const realStudents = s => students.filter(st => st.className === s && !st.name.startsWith('(ว่าง)'));

  return (
    <div>
      <div style={{ marginBottom:'.85rem' }}>
        <PillSel items={assessmentTopics} sel={selTopic} onSel={setTopic}
          getKey={t=>t.id} getLabel={t=>`${t.emoji} ${t.label}`} />
      </div>
      {topObj && (
        <>
          <div style={{ fontWeight:800, fontSize:'.9rem', color:'#374151', marginBottom:'.6rem' }}>
            {topObj.emoji} สรุปหัวข้อ: {topObj.label} — แยกตามห้องเรียน
          </div>
          <div className="table-wrap">
            <table className="table">
              <SummaryTableHead />
              <tbody>
                {ALL_CLASSES.map(cls => {
                  const sts = realStudents(cls);
                  if (!sts.length) return null;
                  return <StatRow key={cls} label={`ห้อง ${cls}`} stats={groupStats(sts, scoreFn)} />;
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function ViewIndicator({ students, assessmentTopics, indicators, activities, allClassNames }) {
  const ALL_CLASSES = allClassNames ?? [];
  const [selTopic, setTopic] = useState(assessmentTopics[0]?.id ?? null);
  const topicInds = useMemo(() => indicators.filter(i => i.domainId === selTopic), [indicators, selTopic]);
  const realStudents = cls => students.filter(s => s.className === cls && !s.name.startsWith('(ว่าง)'));

  return (
    <div>
      <div style={{ marginBottom:'.85rem' }}>
        <PillSel items={assessmentTopics} sel={selTopic} onSel={setTopic}
          getKey={t=>t.id} getLabel={t=>`${t.emoji} ${t.label}`} />
      </div>
      {topicInds.map(ind => {
        const indActs = activities.filter(a => a.indicatorId === ind.id);
        const scoreFn = s => indActs.map(act => getActivityScore(s, ind.id, act.id));
        return (
          <div key={ind.id} style={{ marginBottom:'1.25rem' }}>
            <div style={{
              fontWeight:800, fontSize:'.82rem', color:'#2563eb',
              background:'#eff6ff', border:'1.5px solid #bfdbfe',
              borderRadius:'8px', padding:'.4rem .85rem', marginBottom:'.5rem',
            }}>
              [{ind.indicatorCode}] {ind.label}
            </div>
            <div className="table-wrap">
              <table className="table">
                <SummaryTableHead />
                <tbody>
                  {ALL_CLASSES.map(cls => {
                    const sts = realStudents(cls);
                    if (!sts.length) return null;
                    return <StatRow key={cls} label={`ห้อง ${cls}`} stats={groupStats(sts, scoreFn)} />;
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ViewActivity({ students, assessmentTopics, indicators, activities, allClassNames }) {
  const ALL_CLASSES = allClassNames ?? [];
  const [selTopic, setTopic] = useState(assessmentTopics[0]?.id ?? null);
  const [selInd, setInd]     = useState(null);
  const topicInds = useMemo(() => indicators.filter(i => i.domainId === selTopic), [indicators, selTopic]);
  const indActs   = useMemo(() => activities.filter(a => a.indicatorId === selInd), [activities, selInd]);
  const realStudents = cls => students.filter(s => s.className === cls && !s.name.startsWith('(ว่าง)'));

  const handleTopicChange = id => { setTopic(id); setInd(null); };

  return (
    <div>
      <div style={{ display:'flex', flexDirection:'column', gap:'.5rem', marginBottom:'.85rem' }}>
        <div>
          <span style={{ fontSize:'.73rem', fontWeight:800, color:'var(--text-muted)', textTransform:'uppercase' }}>หัวข้อ</span>
          <div style={{ marginTop:'.3rem' }}>
            <PillSel items={assessmentTopics} sel={selTopic} onSel={handleTopicChange}
              getKey={t=>t.id} getLabel={t=>`${t.emoji} ${t.label}`} />
          </div>
        </div>
        {selTopic && (
          <div>
            <span style={{ fontSize:'.73rem', fontWeight:800, color:'var(--text-muted)', textTransform:'uppercase' }}>ตัวบ่งชี้</span>
            <div style={{ marginTop:'.3rem' }}>
              <PillSel items={topicInds} sel={selInd} onSel={setInd} color='#0891b2' bg='#ecfeff'
                getKey={i=>i.id} getLabel={i=>`[${i.indicatorCode}]`} />
            </div>
          </div>
        )}
      </div>

      {selInd && indActs.map(act => {
        const ind = indicators.find(i => i.id === selInd);
        return (
          <div key={act.id} style={{ marginBottom:'1.25rem' }}>
            <div style={{
              fontWeight:800, fontSize:'.82rem', color:'#92400e',
              background:'#fef3c7', border:'1.5px solid #fbbf24',
              borderRadius:'8px', padding:'.4rem .85rem', marginBottom:'.5rem',
              display:'flex', gap:'.5rem', alignItems:'center',
            }}>
              <span style={{ background:'#b45309',color:'white',borderRadius:'5px',padding:'0 .4rem',fontSize:'.7rem' }}>{act.no}</span>
              {act.label}
            </div>
            <div className="table-wrap">
              <table className="table">
                <SummaryTableHead />
                <tbody>
                  {ALL_CLASSES.map(cls => {
                    const sts = realStudents(cls);
                    if (!sts.length) return null;
                    return <StatRow key={cls} label={`ห้อง ${cls}`}
                      stats={groupStats(sts, s => [getActivityScore(s, ind?.id, act.id)])} />;
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
      {selInd && !indActs.length && (
        <div style={{ textAlign:'center', color:'var(--text-muted)', padding:'2rem' }}>ไม่มีกิจกรรมในตัวบ่งชี้นี้</div>
      )}
    </div>
  );
}

function ViewLevel({ students, assessmentTopics, indicators, activities }) {
  const topicScoreFn = (topic, s) => {
    const inds = indicators.filter(i => i.domainId === topic.id);
    const acts = activities.filter(a => inds.find(i => i.id === a.indicatorId));
    return acts.map(act => {
      const ind = inds.find(i => i.id === act.indicatorId);
      return getActivityScore(s, ind?.id, act.id);
    });
  };
  const realStudents = lvl => students.filter(s => s.level === lvl && !s.name.startsWith('(ว่าง)'));

  return (
    <div>
      {LEVEL_META.map(lv => {
        const sts = realStudents(lv.level);
        return (
          <div key={lv.level} style={{ marginBottom:'1.5rem' }}>
            <div style={{
              fontWeight:800, fontSize:'.9rem', color: lv.color,
              background: lv.bg, border:`1.5px solid ${lv.color}40`,
              borderRadius:'10px', padding:'.5rem 1rem', marginBottom:'.6rem',
            }}>
              {lv.label} ({lv.level}) — {sts.length} คน
            </div>
            <div className="table-wrap">
              <table className="table">
                <SummaryTableHead />
                <tbody>
                  {assessmentTopics.map(topic => (
                    <StatRow key={topic.id}
                      label={`${topic.emoji} ${topic.label}`}
                      stats={groupStats(sts, s => topicScoreFn(topic, s))} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ViewClass({ students, assessmentTopics, indicators, activities, allClassNames }) {
  const ALL_CLASSES = allClassNames ?? [];
  const topicScoreFn = (topic, s) => {
    const inds = indicators.filter(i => i.domainId === topic.id);
    const acts = activities.filter(a => inds.find(i => i.id === a.indicatorId));
    return acts.map(act => {
      const ind = inds.find(i => i.id === act.indicatorId);
      return getActivityScore(s, ind?.id, act.id);
    });
  };
  const realStudents = cls => students.filter(s => s.className === cls && !s.name.startsWith('(ว่าง)'));

  return (
    <div>
      {ALL_CLASSES.map(cls => {
        const sts = realStudents(cls);
        if (!sts.length) return null;
        const lv = LEVEL_META.find(m => sts[0]?.level === m.level);
        return (
          <div key={cls} style={{ marginBottom:'1.5rem' }}>
            <div style={{
              fontWeight:800, fontSize:'.9rem', color: lv?.color ?? '#374151',
              background: lv?.bg ?? '#f9fafb', border:`1.5px solid ${lv?.color ?? '#e5e7eb'}40`,
              borderRadius:'10px', padding:'.5rem 1rem', marginBottom:'.6rem',
            }}>
              ห้อง {cls} — {sts.length} คน
            </div>
            <div className="table-wrap">
              <table className="table">
                <SummaryTableHead />
                <tbody>
                  {assessmentTopics.map(topic => (
                    <StatRow key={topic.id}
                      label={`${topic.emoji} ${topic.label}`}
                      stats={groupStats(sts, s => topicScoreFn(topic, s))} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ViewStudent({ students, assessmentTopics, indicators, activities, schoolName, schoolLogo }) {
  const { classMap: CLASS_MAP } = useApp();
  const [selLevel, setLevel] = useState('K1');
  const [selClass, setClass] = useState(() => CLASS_MAP?.K1?.[0] ?? '');
  const lv = LEVEL_META.find(m => m.level === selLevel);

  const classStudents = useMemo(() =>
    students.filter(s => s.className === selClass && !s.name.startsWith('(ว่าง)'))
            .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '', 'th')),
    [students, selClass]
  );

  const topicAvg = (student, topic) => {
    const inds = indicators.filter(i => i.domainId === topic.id);
    const scores = inds.flatMap(ind =>
      activities.filter(a => a.indicatorId === ind.id).map(act => getActivityScore(student, ind.id, act.id))
    ).filter(v => v !== null);
    return scores.length ? (scores.reduce((a,b)=>a+b,0)/scores.length).toFixed(1) : null;
  };

  const handleLevelChange = lv => { setLevel(lv); setClass(CLASS_MAP[lv]?.[0] ?? ''); };

  return (
    <div>
      {/* เลือกห้อง */}
      <div style={{
        background:'white', border:'1.5px solid #e2e8f0', borderRadius:'12px',
        padding:'.85rem 1.1rem', marginBottom:'1rem',
        display:'flex', flexDirection:'column', gap:'.5rem',
      }}>
        <div>
          <label style={{ fontSize:'.73rem', fontWeight:800, color:'var(--text-muted)', textTransform:'uppercase', display:'block', marginBottom:'.3rem' }}>ระดับชั้น</label>
          <div style={{ display:'flex', gap:'.4rem', flexWrap:'wrap' }}>
            {LEVEL_META.map(m => {
              const active = selLevel === m.level;
              return (
                <div key={m.level} onClick={() => handleLevelChange(m.level)} style={{
                  cursor:'pointer', padding:'.28rem .75rem', borderRadius:'9px',
                  border:`2px solid ${active?m.color:'#e5e7eb'}`,
                  background: active?m.bg:'#f9fafb', fontWeight:700, fontSize:'.82rem',
                  color: active?m.color:'#6b7280', transition:'all .14s',
                }}>{m.label}</div>
              );
            })}
          </div>
        </div>
        <div>
          <label style={{ fontSize:'.73rem', fontWeight:800, color:'var(--text-muted)', textTransform:'uppercase', display:'block', marginBottom:'.3rem' }}>ห้องเรียน</label>
          <div style={{ display:'flex', gap:'.4rem', flexWrap:'wrap' }}>
            {(CLASS_MAP[selLevel] ?? []).map(cls => {
              const active = selClass === cls;
              const cnt = students.filter(s => s.className === cls && !s.name.startsWith('(ว่าง)')).length;
              return (
                <div key={cls} onClick={() => setClass(cls)} style={{
                  cursor:'pointer', padding:'.25rem .65rem', borderRadius:'8px',
                  border:`2px solid ${active?lv?.color??'#7c3aed':'#e5e7eb'}`,
                  background: active?lv?.bg??'#f5f3ff':'#f9fafb',
                  fontWeight:700, fontSize:'.82rem',
                  color: active?lv?.color??'#7c3aed':'#6b7280', transition:'all .14s',
                  display:'flex', gap:'.3rem', alignItems:'center',
                }}>
                  {cls}
                  <span style={{ background:active?lv?.color:'#e5e7eb', color:active?'white':'#9ca3af', borderRadius:'999px', padding:'0 .38rem', fontSize:'.68rem' }}>{cnt}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ปุ่มพิมพ์ทั้งห้อง */}
      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:'.75rem' }}>
        <button className="btn btn-primary" onClick={() =>
          printClassReport(classStudents, selClass, indicators, activities, assessmentTopics, schoolName, schoolLogo)
        }>
          🖨️ พิมพ์สรุปทั้งห้อง {selClass}
        </button>
      </div>

      {/* ตาราง */}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width:'40px' }}>#</th>
              <th style={{ width:'80px' }}>รหัส</th>
              <th>ชื่อ-นามสกุล</th>
              {assessmentTopics.map(t => (
                <th key={t.id} style={{ width:'70px', textAlign:'center', fontSize:'.75rem' }}>
                  {t.emoji}<br/>{t.label}
                </th>
              ))}
              <th style={{ width:'80px', textAlign:'center' }}>พิมพ์</th>
            </tr>
          </thead>
          <tbody>
            {classStudents.map((s, idx) => (
              <tr key={s.id} className="hover-row">
                <td style={{ color:'var(--text-muted)', fontSize:'.8rem' }}>{idx+1}</td>
                <td>
                  <code style={{ fontSize:'.72rem', background:'#f1f5f9', padding:'.1rem .4rem', borderRadius:'4px', fontWeight:700, color:'#475569' }}>
                    {s.id}
                  </code>
                </td>
                <td style={{ fontWeight:600 }}>{s.name}</td>
                {assessmentTopics.map(t => {
                  const avg = topicAvg(s, t);
                  const num = avg ? Number(avg) : null;
                  const color = num ? (num>=2.5?'#059669':num>=1.5?'#b45309':'#dc2626') : '#9ca3af';
                  return (
                    <td key={t.id} style={{ textAlign:'center', fontWeight:800, color, fontSize:'.85rem' }}>
                      {avg ?? '—'}
                    </td>
                  );
                })}
                <td style={{ textAlign:'center' }}>
                  <button className="btn btn-sm" onClick={() =>
                    printStudentReport(s, indicators, activities, assessmentTopics, schoolName, schoolLogo)
                  }>🖨️</button>
                </td>
              </tr>
            ))}
            {!classStudents.length && (
              <tr><td colSpan={4+assessmentTopics.length} style={{ textAlign:'center', padding:'2rem', color:'var(--text-muted)' }}>ไม่พบข้อมูล</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// VIEW: พัฒนาการ (เปรียบเทียบครั้งที่ประเมิน)
// ═══════════════════════════════════════════════════════════════════════════════
const ROUNDS = [1,2,3,4];

function ScoreCell({ score }) {
  if (score === null) return <span style={{ color:'#cbd5e1', fontSize:'.78rem' }}>—</span>;
  const color = score >= 2.5 ? '#059669' : score >= 1.5 ? '#b45309' : '#dc2626';
  return (
    <span style={{ fontWeight:800, fontSize:'.85rem', color }}>
      {score.toFixed(1)}
    </span>
  );
}

function TrendCell({ prev, curr }) {
  const t = trendIcon(prev, curr);
  if (!t) return <span style={{ color:'#cbd5e1', fontSize:'.8rem' }}>—</span>;
  return <span style={{ fontWeight:900, fontSize:'1rem', color: t.color }}>{t.icon}</span>;
}

function ViewProgress({ students, assessmentTopics, indicators, activities, allClassNames }) {
  const { classMap: CLASS_MAP } = useApp();
  const ALL_CLASSES = allClassNames ?? [];
  const [selLevel, setLevel]   = useState('K1');
  const [selClass, setClass]   = useState(() => CLASS_MAP?.K1?.[0] ?? '');
  const [selTopic, setTopic]   = useState(assessmentTopics[0]?.id ?? null);
  const [viewMode, setViewMode]= useState('student'); // 'student' | 'class'
  const lv = LEVEL_META.find(m => m.level === selLevel);

  const handleLevelChange = lv => { setLevel(lv); setClass(CLASS_MAP[lv]?.[0] ?? ''); };

  const classStudents = useMemo(() =>
    students.filter(s => s.className === selClass && !s.name.startsWith('(ว่าง)'))
            .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '', 'th')),
    [students, selClass]
  );

  // คะแนนแต่ละครั้งของนักเรียน 1 คน ใน topic ที่เลือก
  const studentRounds = (s) =>
    ROUNDS.map(r => getTopicRoundAvg(s, assessmentTopics.find(t=>t.id===selTopic), indicators, activities, r));

  // เฉลี่ยทั้งห้องในแต่ละครั้ง
  const classRoundAvg = (round) => {
    const scores = classStudents.map(s => {
      const topic = assessmentTopics.find(t=>t.id===selTopic);
      return getTopicRoundAvg(s, topic, indicators, activities, round);
    }).filter(v => v !== null);
    return scores.length ? scores.reduce((a,b)=>a+b,0)/scores.length : null;
  };

  // สรุปห้องเรียนทั้งหมด (viewMode === 'class')
  const allClassSummary = useMemo(() => {
    const topic = assessmentTopics.find(t=>t.id===selTopic);
    if (!topic) return [];
    return ALL_CLASSES.map(cls => {
      const sts = students.filter(s => s.className === cls && !s.name.startsWith('(ว่าง)'));
      if (!sts.length) return null;
      const rounds = ROUNDS.map(r => {
        const scores = sts.map(s => getTopicRoundAvg(s, topic, indicators, activities, r)).filter(v=>v!==null);
        return scores.length ? scores.reduce((a,b)=>a+b,0)/scores.length : null;
      });
      return { cls, sts: sts.length, rounds };
    }).filter(Boolean);
  }, [students, selTopic, assessmentTopics, indicators, activities]);

  const topObj = assessmentTopics.find(t => t.id === selTopic);

  return (
    <div>
      {/* Mode toggle */}
      <div style={{ display:'flex', gap:'.5rem', marginBottom:'1rem', flexWrap:'wrap', alignItems:'center' }}>
        <span style={{ fontSize:'.73rem', fontWeight:800, color:'var(--text-muted)', textTransform:'uppercase' }}>มุมมอง:</span>
        {[{id:'student',label:'👤 รายนักเรียน'},{id:'class',label:'🚪 เปรียบเทียบทุกห้อง'}].map(m => (
          <button key={m.id} onClick={() => setViewMode(m.id)} style={{
            padding:'.3rem .8rem', borderRadius:'9px', cursor:'pointer', fontFamily:'inherit',
            border:`2px solid ${viewMode===m.id?'#7c3aed':'#e5e7eb'}`,
            background: viewMode===m.id?'#f5f3ff':'#f9fafb',
            fontWeight:700, fontSize:'.8rem', color: viewMode===m.id?'#7c3aed':'#6b7280',
          }}>{m.label}</button>
        ))}
      </div>

      {/* หัวข้อ selector */}
      <div style={{ marginBottom:'.85rem' }}>
        <span style={{ fontSize:'.73rem', fontWeight:800, color:'var(--text-muted)', textTransform:'uppercase', display:'block', marginBottom:'.35rem' }}>หัวข้อประเมิน</span>
        <PillSel items={assessmentTopics} sel={selTopic} onSel={setTopic}
          getKey={t=>t.id} getLabel={t=>`${t.emoji} ${t.label}`} />
      </div>

      {/* ── รายนักเรียน ── */}
      {viewMode === 'student' && (
        <>
          {/* Level → Class */}
          <div style={{ display:'flex', flexDirection:'column', gap:'.45rem', marginBottom:'1rem',
            background:'#f8fafc', border:'1.5px solid #e2e8f0', borderRadius:'10px', padding:'.7rem 1rem' }}>
            <div style={{ display:'flex', gap:'.4rem', flexWrap:'wrap', alignItems:'center' }}>
              <span style={{ fontSize:'.73rem', fontWeight:800, color:'var(--text-muted)', minWidth:'48px' }}>ระดับ</span>
              {LEVEL_META.map(m => {
                const active = selLevel === m.level;
                return (
                  <div key={m.level} onClick={() => handleLevelChange(m.level)} style={{
                    cursor:'pointer', padding:'.25rem .65rem', borderRadius:'8px',
                    border:`2px solid ${active?m.color:'#e5e7eb'}`,
                    background: active?m.bg:'#f9fafb', fontWeight:700, fontSize:'.8rem',
                    color: active?m.color:'#6b7280', transition:'all .14s',
                  }}>{m.label}</div>
                );
              })}
            </div>
            <div style={{ display:'flex', gap:'.4rem', flexWrap:'wrap', alignItems:'center' }}>
              <span style={{ fontSize:'.73rem', fontWeight:800, color:'var(--text-muted)', minWidth:'48px' }}>ห้อง</span>
              {(CLASS_MAP[selLevel] ?? []).map(cls => {
                const active = selClass === cls;
                return (
                  <div key={cls} onClick={() => setClass(cls)} style={{
                    cursor:'pointer', padding:'.22rem .6rem', borderRadius:'7px',
                    border:`2px solid ${active?lv?.color:'#e5e7eb'}`,
                    background: active?lv?.bg:'#f9fafb', fontWeight:700, fontSize:'.8rem',
                    color: active?lv?.color:'#6b7280', transition:'all .14s',
                  }}>{cls}</div>
                );
              })}
            </div>
          </div>

          {/* ค่าเฉลี่ยห้อง */}
          {topObj && (
            <div style={{
              background: lv?.bg, border:`1.5px solid ${lv?.color}30`, borderRadius:'10px',
              padding:'.6rem 1rem', marginBottom:'1rem', display:'flex', gap:'1.5rem', flexWrap:'wrap', alignItems:'center',
            }}>
              <span style={{ fontWeight:800, fontSize:'.85rem', color: lv?.color }}>
                ค่าเฉลี่ยห้อง {selClass} — {topObj.emoji}{topObj.label}
              </span>
              {ROUNDS.map((r,i) => {
                const avg = classRoundAvg(r);
                const prev = i > 0 ? classRoundAvg(ROUNDS[i-1]) : null;
                const t = trendIcon(prev, avg);
                return (
                  <div key={r} style={{ textAlign:'center' }}>
                    <div style={{ fontSize:'.68rem', fontWeight:700, color:'var(--text-muted)' }}>ครั้งที่ {r}</div>
                    <div style={{ fontWeight:900, fontSize:'1.1rem', color: avg===null?'#9ca3af': avg>=2.5?'#059669':avg>=1.5?'#b45309':'#dc2626' }}>
                      {avg !== null ? avg.toFixed(2) : '—'}
                    </div>
                    {t && <div style={{ fontWeight:900, fontSize:'.9rem', color:t.color }}>{t.icon}</div>}
                  </div>
                );
              })}
            </div>
          )}

          {/* ตารางนักเรียน */}
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th style={{width:'40px'}}>#</th>
                  <th style={{width:'80px'}}>รหัส</th>
                  <th>ชื่อ-นามสกุล</th>
                  {ROUNDS.map(r => (
                    <th key={r} style={{width:'65px', textAlign:'center'}}>ครั้งที่ {r}</th>
                  ))}
                  <th style={{width:'50px', textAlign:'center'}}>เทรนด์</th>
                </tr>
              </thead>
              <tbody>
                {classStudents.map((s, idx) => {
                  const rounds = studentRounds(s);
                  const latestR = [...rounds].reverse().findIndex(v => v !== null);
                  const lastVal = latestR >= 0 ? rounds[rounds.length-1-latestR] : null;
                  const prevIdx = rounds.length-1-latestR-1;
                  const prevVal = prevIdx >= 0 ? rounds[prevIdx] : null;
                  return (
                    <tr key={s.id} className="hover-row">
                      <td style={{ color:'var(--text-muted)', fontSize:'.8rem' }}>{idx+1}</td>
                      <td><code style={{ fontSize:'.72rem', background:'#f1f5f9', padding:'.1rem .4rem', borderRadius:'4px', fontWeight:700, color:'#475569' }}>{s.id}</code></td>
                      <td style={{ fontWeight:600 }}>{s.name}</td>
                      {rounds.map((avg, i) => (
                        <td key={i} style={{ textAlign:'center' }}>
                          <ScoreCell score={avg} />
                        </td>
                      ))}
                      <td style={{ textAlign:'center' }}>
                        <TrendCell prev={prevVal} curr={lastVal} />
                      </td>
                    </tr>
                  );
                })}
                {!classStudents.length && (
                  <tr><td colSpan={7} style={{ textAlign:'center', padding:'2rem', color:'var(--text-muted)' }}>ไม่พบข้อมูล</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── เปรียบเทียบทุกห้อง ── */}
      {viewMode === 'class' && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>ห้องเรียน</th>
                <th style={{width:'60px', textAlign:'center'}}>นักเรียน</th>
                {ROUNDS.map(r => (
                  <th key={r} style={{width:'70px', textAlign:'center'}}>ครั้งที่ {r}</th>
                ))}
                <th style={{width:'80px', textAlign:'center'}}>เทรนด์</th>
              </tr>
            </thead>
            <tbody>
              {allClassSummary.map(({ cls, sts, rounds }) => {
                const lvm = LEVEL_META.find(m => (CLASS_MAP[m.level] ?? []).includes(cls));
                const filled = rounds.filter(v => v !== null);
                const lastVal = filled.length ? filled[filled.length-1] : null;
                const prevVal = filled.length > 1 ? filled[filled.length-2] : null;
                return (
                  <tr key={cls} className="hover-row">
                    <td style={{ fontWeight:700, color: lvm?.color }}>ห้อง {cls}</td>
                    <td style={{ textAlign:'center', color:'var(--text-muted)' }}>{sts}</td>
                    {rounds.map((avg, i) => (
                      <td key={i} style={{ textAlign:'center' }}>
                        <ScoreCell score={avg} />
                      </td>
                    ))}
                    <td style={{ textAlign:'center' }}>
                      <TrendCell prev={prevVal} curr={lastVal} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// VIEW: AI สรุปห้องเรียน
// ═══════════════════════════════════════════════════════════════════════════════
function ViewAISummary({ students, assessmentTopics, indicators, activities, aiApiKey, allClassNames }) {
  const { classMap: CLASS_MAP } = useApp();
  const ALL_CLASSES = allClassNames ?? [];
  const [selClass, setClass] = useState(ALL_CLASSES[0] ?? '');
  const [aiText,   setAiText]  = useState('');
  const [loading,  setLoading] = useState(false);
  const [error,    setError]   = useState('');

  const classStudents = useMemo(() =>
    students.filter(s => s.className === selClass && !s.name.startsWith('(ว่าง)')),
    [students, selClass]
  );

  function getActivityScore(student, indicatorId, activityId) {
    return student.assessments?.indicators?.[indicatorId]?.[activityId]?.score ?? null;
  }

  const topicStats = useMemo(() => {
    return assessmentTopics.map(t => {
      const inds = indicators.filter(i => i.domainId === t.id);
      let sum = 0, count = 0, s1 = 0, s2 = 0, s3 = 0;
      classStudents.forEach(stu => {
        const scores = inds.flatMap(ind =>
          activities.filter(a => a.indicatorId === ind.id)
            .map(act => getActivityScore(stu, ind.id, act.id))
        ).filter(v => v !== null);
        if (!scores.length) return;
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        sum += avg; count++;
        if (avg >= 2.5) s3++; else if (avg >= 1.5) s2++; else s1++;
      });
      return { label: t.label, avg: count ? sum / count : null, s1, s2, s3 };
    });
  }, [classStudents, assessmentTopics, indicators, activities]);

  async function handleGenerate() {
    if (!aiApiKey) return;
    setLoading(true); setError(''); setAiText('');
    try {
      const result = await callClaude(
        aiApiKey,
        buildWeeklySummaryPrompt(selClass, classStudents.length, topicStats)
      );
      setAiText(result);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  const lv = LEVEL_META.find(m => CLASS_MAP[m.level]?.includes(selClass));

  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ fontSize: '.77rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '.4rem' }}>
          เลือกห้องเรียน
        </label>
        <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
          {ALL_CLASSES.map(cls => {
            const active = selClass === cls;
            const lvm = LEVEL_META.find(m => CLASS_MAP[m.level]?.includes(cls));
            return (
              <button key={cls} type="button"
                onClick={() => { setClass(cls); setAiText(''); setError(''); }}
                style={{
                  padding: '.3rem .75rem', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit',
                  border: `2px solid ${active ? (lvm?.color ?? '#7c3aed') : '#e5e7eb'}`,
                  background: active ? (lvm?.bg ?? '#f5f3ff') : '#f9fafb',
                  color: active ? (lvm?.color ?? '#7c3aed') : '#6b7280',
                  fontWeight: 700, fontSize: '.82rem', transition: 'all .14s',
                }}>
                {cls} <span style={{ fontSize: '.72rem', color: active ? lvm?.color : '#9ca3af' }}>
                  ({students.filter(s => s.className === cls && !s.name.startsWith('(ว่าง)')).length} คน)
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Stats preview */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem', marginBottom: '1rem' }}>
        {topicStats.map(t => {
          const num = t.avg;
          const color = num === null ? '#9ca3af' : num >= 2.5 ? '#059669' : num >= 1.5 ? '#b45309' : '#dc2626';
          return (
            <div key={t.label} style={{
              background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px',
              padding: '.4rem .75rem', fontSize: '.78rem',
            }}>
              <span style={{ fontWeight: 700, color: '#475569' }}>ด้าน{t.label}</span>
              <span style={{ marginLeft: '.5rem', fontWeight: 800, color }}>
                {num !== null ? num.toFixed(2) : '—'}
              </span>
            </div>
          );
        })}
      </div>

      {!aiApiKey ? (
        <div style={{ background: '#fef9c3', border: '1px solid #fbbf24', borderRadius: '10px', padding: '.75rem 1rem', fontSize: '.85rem', color: '#713f12' }}>
          ⚠️ ตั้งค่า Claude API Key ในหน้า <strong>ตั้งค่า</strong> เพื่อใช้งานฟีเจอร์ AI
        </div>
      ) : (
        <>
          <button type="button" onClick={handleGenerate} disabled={loading || !classStudents.length}
            style={{
              padding: '.5rem 1.4rem', borderRadius: '10px', border: 'none',
              background: lv?.color ?? '#7c3aed', color: 'white', fontFamily: 'inherit',
              fontWeight: 700, fontSize: '.88rem', cursor: loading ? 'wait' : 'pointer',
              marginBottom: '1rem',
            }}>
            {loading ? '⏳ กำลังสร้างสรุป…' : `✨ สร้างสรุปพัฒนาการห้อง ${selClass}`}
          </button>
          {error && (
            <div style={{ color: '#dc2626', fontSize: '.83rem', marginBottom: '.75rem' }}>❌ {error}</div>
          )}
          {aiText && (
            <div style={{
              background: '#f0f9ff', border: '1.5px solid #bae6fd', borderRadius: '12px',
              padding: '1rem 1.2rem', fontSize: '.88rem', lineHeight: 1.8, color: '#0c4a6e',
              whiteSpace: 'pre-wrap',
            }}>
              <div style={{ fontWeight: 800, fontSize: '.8rem', color: '#0369a1', marginBottom: '.5rem', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                🤖 สรุปพัฒนาการห้อง {selClass} — {classStudents.length} คน
              </div>
              {aiText}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════
export default function ReportsTab({ teacherClassFilter = null }) {
  const { students: allStudents, assessmentTopics, indicators, activities, schools, activityLogs, aiApiKey, allClassNames, schoolLogo } = useApp();
  const ALL_CLASSES = allClassNames;
  const [subTab, setSubTab] = useState('forms');
  const schoolName = schools?.[0]?.name ?? 'โรงเรียน';

  // ถ้าเป็นครูที่ล็อกอิน ให้กรองเฉพาะห้องของตัวเอง
  const students = useMemo(
    () => teacherClassFilter
      ? allStudents.filter(s => s.className === teacherClassFilter && !s.name.startsWith('(ว่าง)'))
      : allStudents,
    [allStudents, teacherClassFilter],
  );

  const props = { students, assessmentTopics, indicators, activities, schoolName, schoolLogo, aiApiKey, allClassNames };

  return (
    <div className="glass p-6 animate-fade">
      <div className="page-header mb-4">
        <div style={{ display:'flex', alignItems:'center', gap:'.75rem' }}>
          {schoolLogo && (
            <img src={schoolLogo} alt="โลโก้โรงเรียน"
              style={{ height:48, width:48, objectFit:'contain', borderRadius:'8px', border:'1.5px solid #e5e7eb', background:'#fafafa', flexShrink:0 }} />
          )}
          <h3>📋 รายงานสรุปผลการประเมินพัฒนาการ</h3>
        </div>
      </div>

      {/* ── Export panel ── */}
      <div style={{
        display: 'flex', gap: '.6rem', flexWrap: 'wrap', alignItems: 'center',
        background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: '12px',
        padding: '.7rem 1rem', marginBottom: '1.25rem',
      }}>
        <span style={{ fontSize: '.74rem', fontWeight: 800, color: '#166534', flexShrink: 0 }}>
          📥 Export Excel:
        </span>
        <button
          className="btn btn-sm"
          style={{ background: '#16a34a', color: 'white', border: 'none' }}
          onClick={() => exportClassSummaryExcel(students, assessmentTopics, indicators, activities, schoolName)}
        >
          📊 สรุปรายนักเรียน
        </button>
        <button
          className="btn btn-sm"
          style={{ background: '#2563eb', color: 'white', border: 'none' }}
          onClick={() => exportActivityDetailExcel(students, assessmentTopics, indicators, activities, schoolName)}
        >
          📋 รายละเอียดกิจกรรม
        </button>
        <button
          className="btn btn-sm"
          style={{ background: '#7c3aed', color: 'white', border: 'none' }}
          onClick={() => exportActivityLogExcel(activityLogs ?? [])}
        >
          📜 ประวัติการประเมิน
        </button>
        <span style={{ fontSize: '.72rem', color: '#166534', marginLeft: '.25rem' }}>
          (.xlsx — เปิดด้วย Excel ได้เลย)
        </span>
      </div>

      {/* Sub-tab bar */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:'.4rem', marginBottom:'1.5rem' }}>
        {SUB_TABS.map(tab => (
          <button key={tab.id} onClick={() => setSubTab(tab.id)} style={{
            padding:'.38rem .85rem', borderRadius:'10px',
            border:`2px solid ${subTab===tab.id?'#7c3aed':'#e5e7eb'}`,
            background: subTab===tab.id?'#f5f3ff':'#f9fafb',
            fontWeight:700, fontSize:'.82rem',
            color: subTab===tab.id?'#7c3aed':'#6b7280',
            cursor:'pointer', fontFamily:'inherit', transition:'all .14s',
          }}>{tab.label}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ background:'white', border:'1.5px solid #e2e8f0', borderRadius:'14px', padding:'1.1rem 1.2rem' }}>
        {subTab === 'forms'     && <FormReportsTab teacherClassFilter={teacherClassFilter} />}
        {subTab === 'topic'     && <ViewTopic     {...props} />}
        {subTab === 'indicator' && <ViewIndicator {...props} />}
        {subTab === 'activity'  && <ViewActivity  {...props} />}
        {subTab === 'level'     && <ViewLevel     {...props} />}
        {subTab === 'class'     && <ViewClass     {...props} />}
        {subTab === 'student'   && <ViewStudent   {...props} />}
        {subTab === 'progress'  && <ViewProgress  {...props} />}
        {subTab === 'ai'        && <ViewAISummary {...props} />}
      </div>
    </div>
  );
}
