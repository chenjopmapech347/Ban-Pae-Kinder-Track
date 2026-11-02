import { useMemo, useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { AttendanceBarChart, ClassRadarChart } from '../DevelopmentChart';
import { exportDailyAttendanceSummaryExcel } from '../../utils/exportExcel';
import { isAssessed, compareClassNames } from '../../utils/helpers';
import { ui } from '../../ui/ui';


export default function OverviewTab() {
  const {
    students, teachers, assessmentTopics, announcements, setAnnouncements, allClassNames,
    dailyRecords, schoolName, academicYear,
  } = useApp();
  const ALL_CLASSES = allClassNames;

  // ── สถิติการมาเรียนรายวัน ────────────────────────────────────────────────────
  const [attDate, setAttDate] = useState(() => new Date().toISOString().slice(0, 10));
  const dailySummary = useMemo(() => {
    const dayData = dailyRecords?.[attDate] ?? {};
    return ALL_CLASSES.map(cls => {
      const clsSt = students.filter(s => s.className === cls && !s.name.startsWith('(ว่าง)'));
      const boys  = clsSt.filter(s =>  s.name.includes('ชาย'));
      const girls = clsSt.filter(s => !s.name.includes('ชาย'));
      const present   = id => dayData[String(id)]?.attendance === 'มา';
      const absent    = id => ['ขาด','ลา','ป่วย'].includes(dayData[String(id)]?.attendance);
      return {
        cls,
        totalBoys:   boys.length,
        totalGirls:  girls.length,
        presentBoys: boys.filter(s  => present(s.id)).length,
        presentGirls:girls.filter(s => present(s.id)).length,
        absentBoys:  boys.filter(s  => absent(s.id)).length,
        absentGirls: girls.filter(s => absent(s.id)).length,
      };
    }).filter(r => r.totalBoys + r.totalGirls > 0);
  }, [ALL_CLASSES, students, dailyRecords, attDate]);

  const dailyTotal = useMemo(() => dailySummary.reduce(
    (a, r) => ({
      tB: a.tB + r.totalBoys,   tG: a.tG + r.totalGirls,
      pB: a.pB + r.presentBoys, pG: a.pG + r.presentGirls,
      aB: a.aB + r.absentBoys,  aG: a.aG + r.absentGirls,
    }),
    { tB:0,tG:0,pB:0,pG:0,aB:0,aG:0 }
  ), [dailySummary]);

  // ── Attendance chart — class selector + auto-cycle ───────────────────────
  const classNames = useMemo(() =>
    [...new Set(students.filter(s => !s.name.startsWith('(ว่าง)')).map(s => s.className))].sort(compareClassNames),
    [students]
  );
  const [selAttClass, setSelAttClass] = useState(null);
  const [autoPlay, setAutoPlay] = useState(true);
  const autoPlayRef = useRef(autoPlay);
  useEffect(() => { autoPlayRef.current = autoPlay; }, [autoPlay]);

  // เมื่อ classNames เปลี่ยน ตั้งค่าเริ่มต้น
  useEffect(() => {
    if (classNames.length) setSelAttClass(c => c ?? classNames[0]);
  }, [classNames]);

  // auto-cycle ทุก 3 วิ
  useEffect(() => {
    if (!classNames.length) return;
    const timer = setInterval(() => {
      if (!autoPlayRef.current) return;
      setSelAttClass(cur => {
        const idx = classNames.indexOf(cur);
        return classNames[(idx + 1) % classNames.length];
      });
    }, 3000);
    return () => clearInterval(timer);
  }, [classNames]);

  const attStudents = useMemo(() =>
    students.filter(s => s.className === selAttClass && !s.name.startsWith('(ว่าง)')),
    [students, selAttClass]
  );

  const stats = {
    total:    students.length,
    boys:     students.filter(s => s.name.includes('ชาย')).length,
    girls:    students.filter(s => s.name.includes('หญิง')).length,
    assessed: students.filter(isAssessed).length,
    pending:  students.filter(s => !isAssessed(s)).length,
    teachers: teachers.length,
    rate: (() => {
      const tot = students.reduce((a,s) => a + (s.attendance?.total || 0), 0);
      const pre = students.reduce((a,s) => a + (s.attendance?.present || 0), 0);
      return tot ? ((pre / tot) * 100).toFixed(1) : '0';
    })(),
  };

  const thHead = {
    background:'#166534', color:'white', padding:'.45rem .5rem',
    textAlign:'center', border:'1px solid #fff', fontWeight:700, whiteSpace:'nowrap',
  };
  const tdStyle = { padding:'.4rem .6rem', border:'1px solid #e5e7eb', whiteSpace:'nowrap' };
  const tdNum   = { ...tdStyle, textAlign:'center' };

  return (
    <div {...ui('animate-fade')}>

      {/* Stat Cards */}
      <div {...ui('grid grid-4 mb-6', { gap: '.75rem' })}>
        <div {...ui('stat-card', { background: 'linear-gradient(135deg,#3b82f6,#60a5fa)' })}>
          <span {...ui('stat-icon')}>👨‍🏫</span>
          <div {...ui('stat-value')}>{stats.teachers}</div>
          <div {...ui('stat-label')}>จำนวนคุณครู</div>
        </div>
        <div {...ui('stat-card', { background: 'linear-gradient(135deg,#10b981,#34d399)' })}>
          <span {...ui('stat-icon')}>👶</span>
          <div {...ui('stat-value')}>{stats.total}</div>
          <div {...ui('stat-label')}>นักเรียนทั้งหมด · ชาย {stats.boys} หญิง {stats.girls}</div>
        </div>
        <div {...ui('stat-card', { background: 'linear-gradient(135deg,#7c3aed,#a855f7)' })}>
          <span {...ui('stat-icon')}>📋</span>
          <div {...ui('stat-value')}>{stats.assessed}</div>
          <div {...ui('stat-label')}>ประเมินแล้ว · รอ {stats.pending} คน</div>
        </div>
        <div {...ui('stat-card', { background: 'linear-gradient(135deg,#f59e0b,#fbbf24)' })}>
          <span {...ui('stat-icon')}>📅</span>
          <div {...ui('stat-value')}>{stats.rate}%</div>
          <div {...ui('stat-label')}>การมาเรียนภาพรวม</div>
        </div>
      </div>

      {/* Charts row */}
      <div {...ui('grid grid-2 mb-6', { gap: '1.25rem' })}>
        <div {...ui('glass-card')}>
          {/* Header + class tabs */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'.6rem', flexWrap:'wrap', gap:'.4rem' }}>
            <h4 style={{ margin:0 }}>📊 การมาเรียน</h4>
            <button
              onClick={() => setAutoPlay(p => !p)}
              title={autoPlay ? 'หยุดวนอัตโนมัติ' : 'เปิดวนอัตโนมัติ'}
              style={{
                fontSize:'.7rem', padding:'.2rem .55rem', borderRadius:'6px',
                border:'1px solid #c4b5fd', background: autoPlay ? '#ede9fe' : '#f3f4f6',
                color: autoPlay ? '#5b21b6' : '#9ca3af', cursor:'pointer', fontFamily:'inherit', fontWeight:700,
              }}>
              {autoPlay ? '⏸ auto' : '▶ auto'}
            </button>
          </div>
          {/* Class selector tabs */}
          {classNames.length > 1 && (
            <div style={{ display:'flex', flexWrap:'wrap', gap:'.3rem', marginBottom:'.65rem' }}>
              {classNames.map(cn => (
                <button key={cn}
                  onClick={() => { setSelAttClass(cn); setAutoPlay(false); }}
                  style={{
                    fontSize:'.72rem', padding:'.2rem .6rem', borderRadius:'7px', cursor:'pointer',
                    fontFamily:'inherit', fontWeight: selAttClass === cn ? 800 : 500,
                    border: selAttClass === cn ? '1.5px solid #7c3aed' : '1px solid #e5e7eb',
                    background: selAttClass === cn ? '#ede9fe' : 'white',
                    color: selAttClass === cn ? '#5b21b6' : '#6b7280',
                    transition:'all .15s',
                  }}>
                  {cn}
                </button>
              ))}
            </div>
          )}
          {attStudents.length ? (
            <AttendanceBarChart students={attStudents} dailyRecords={dailyRecords} />
          ) : (
            <div {...ui('text-center text-muted', { padding: '2rem' })}>ยังไม่มีข้อมูล</div>
          )}
        </div>
        <div {...ui('glass-card')}>
          <h4 {...ui('mb-3')}>🌱 พัฒนาการเฉลี่ยแต่ละชั้น</h4>
          <ClassRadarChart students={students} topics={assessmentTopics} />
        </div>
      </div>

      {/* ── สถิติการมาเรียนรายวัน ── */}
      <div {...ui('glass-card', { marginBottom: '1.25rem' })}>
        <div style={{ display:'flex', alignItems:'center', gap:'.75rem', marginBottom:'1rem', flexWrap:'wrap' }}>
          <h4 style={{ margin:0 }}>📅 สถิติการมาเรียนรายวัน</h4>
          <input
            type="date"
            value={attDate}
            onChange={e => setAttDate(e.target.value)}
            style={{
              border:'1.5px solid #e5e7eb', borderRadius:'8px', padding:'.25rem .6rem',
              fontSize:'.82rem', fontFamily:'inherit', color:'#374151', cursor:'pointer',
            }}
          />
          <button
            onClick={() => exportDailyAttendanceSummaryExcel(dailySummary, attDate, schoolName, academicYear)}
            disabled={!dailySummary.length}
            style={{
              marginLeft:'auto', background:'#16a34a', color:'white', border:'none',
              borderRadius:'8px', padding:'.35rem .85rem', fontWeight:700, fontSize:'.8rem',
              cursor: dailySummary.length ? 'pointer' : 'not-allowed', fontFamily:'inherit',
              opacity: dailySummary.length ? 1 : .5, display:'flex', alignItems:'center', gap:'.35rem',
            }}
          >
            📊 ดาวน์โหลด Excel
          </button>
        </div>

        <div {...ui('table-wrap')}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'.82rem' }}>
            <thead>
              <tr>
                <th rowSpan={2} style={thHead}>ชั้นเรียน</th>
                <th colSpan={3} style={{ ...thHead, background:'#1e6b2e' }}>นักเรียนเต็ม</th>
                <th colSpan={3} style={{ ...thHead, background:'#2563eb' }}>มาเรียน</th>
                <th colSpan={3} style={{ ...thHead, background:'#dc2626' }}>ไม่มาเรียน</th>
              </tr>
              <tr>
                {['ชาย','หญิง','รวม','ชาย','หญิง','รวม','ชาย','หญิง','รวม'].map((h,i) => (
                  <th key={i} style={{
                    ...thHead,
                    background: i<3 ? '#166534' : i<6 ? '#1d4ed8' : '#b91c1c',
                    fontWeight:600, fontSize:'.75rem',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dailySummary.length === 0 ? (
                <tr><td colSpan={10} style={{ textAlign:'center', padding:'1.5rem', color:'#9ca3af' }}>
                  ยังไม่มีข้อมูลการเช็คชื่อวันนี้
                </td></tr>
              ) : dailySummary.map((r, idx) => (
                <tr key={r.cls} style={{ background: idx % 2 === 0 ? '#f0fdf4' : 'white' }}>
                  <td style={tdStyle}><strong>{r.cls}</strong></td>
                  <td style={tdNum}>{r.totalBoys}</td>
                  <td style={tdNum}>{r.totalGirls}</td>
                  <td style={{ ...tdNum, fontWeight:800, color:'#166534' }}>{r.totalBoys+r.totalGirls}</td>
                  <td style={tdNum}>{r.presentBoys}</td>
                  <td style={tdNum}>{r.presentGirls}</td>
                  <td style={{ ...tdNum, fontWeight:800, color:'#1d4ed8' }}>{r.presentBoys+r.presentGirls}</td>
                  <td style={tdNum}>{r.absentBoys}</td>
                  <td style={tdNum}>{r.absentGirls}</td>
                  <td style={{ ...tdNum, fontWeight:800, color:'#b91c1c' }}>{r.absentBoys+r.absentGirls}</td>
                </tr>
              ))}
              {dailySummary.length > 0 && (
                <tr style={{ background:'#166534', color:'white' }}>
                  <td style={{ ...tdStyle, color:'white', fontWeight:800 }}>รวม</td>
                  <td style={{ ...tdNum, color:'white' }}>{dailyTotal.tB}</td>
                  <td style={{ ...tdNum, color:'white' }}>{dailyTotal.tG}</td>
                  <td style={{ ...tdNum, color:'white', fontWeight:900 }}>{dailyTotal.tB+dailyTotal.tG}</td>
                  <td style={{ ...tdNum, color:'white' }}>{dailyTotal.pB}</td>
                  <td style={{ ...tdNum, color:'white' }}>{dailyTotal.pG}</td>
                  <td style={{ ...tdNum, color:'white', fontWeight:900 }}>{dailyTotal.pB+dailyTotal.pG}</td>
                  <td style={{ ...tdNum, color:'white' }}>{dailyTotal.aB}</td>
                  <td style={{ ...tdNum, color:'white' }}>{dailyTotal.aG}</td>
                  <td style={{ ...tdNum, color:'white', fontWeight:900 }}>{dailyTotal.aB+dailyTotal.aG}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Announcements */}
      <div {...ui('glass-card')}>
        <div {...ui('flex justify-between items-center mb-4')}>
          <h4>📢 ข่าวสารและประกาศล่าสุด</h4>
          <button {...ui('btn btn-sm btn-primary')} onClick={() => {
            const title = prompt('หัวข้อประกาศ:');
            if (title) setAnnouncements([
              { id: Date.now(), title, date: new Date().toLocaleDateString('th-TH') },
              ...announcements,
            ]);
          }}>+ เพิ่มข่าว</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
          {announcements.slice(0, 4).map(n => (
            <div key={n.id} style={{
              display: 'flex', alignItems: 'flex-start', gap: '.75rem',
              padding: '.65rem .85rem', borderRadius: '12px', background: '#f5f3ff',
            }}>
              <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>📌</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '.9rem', marginBottom: '.15rem' }}>{n.title}</div>
                <div style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>{n.date}</div>
              </div>
              <span {...ui('badge badge-info', { fontSize: '.6rem', flexShrink: 0 })}>NEWS</span>
            </div>
          ))}
          {!announcements.length && (
            <div {...ui('text-center text-muted', { padding: '1.5rem' })}>ยังไม่มีประกาศ</div>
          )}
        </div>
      </div>
    </div>
  );
}
