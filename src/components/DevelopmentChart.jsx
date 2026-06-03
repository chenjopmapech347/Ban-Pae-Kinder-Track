/**
 * DevelopmentChart — recharts-based charts for KinderTrack
 *
 * Exports:
 *   <RadarDevChart topics={[]} summary={{}} />   — per-student spider chart
 *   <AttendanceBarChart students={[]} />          — class attendance bars
 *   <ClassOverviewChart students={[]} topics={[]} /> — avg by level bars
 */
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell,
} from 'recharts';

/* ── colour palette ─────────────────────────────────── */
const DOMAIN_COLORS = ['#7c3aed','#f43f5e','#f59e0b','#10b981','#3b82f6','#ec4899'];
const LEVEL_COLORS  = { K1:'#3b82f6', K2:'#10b981', K3:'#f97316' };

/* ── helpers ─────────────────────────────────────────── */
function qualLabel(v) {
  if (v === 3) return 'ดี';
  if (v === 2) return 'พอใช้';
  if (v === 1) return 'ปรับปรุง';
  return 'ยังไม่ได้';
}

/* ── custom tooltip ──────────────────────────────────── */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'white', border: '1.5px solid #e8e3f4', borderRadius: '12px',
      padding: '.6rem .9rem', fontSize: '.82rem', boxShadow: '0 4px 16px rgba(0,0,0,.1)',
    }}>
      <div style={{ fontWeight: 700, marginBottom: '.25rem' }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color ?? p.fill }}>
          {p.name}: <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  );
}

/* ── RadarDevChart ───────────────────────────────────── */
export function RadarDevChart({ topics = [], summary = {} }) {
  if (!topics.length) return null;

  const data = topics.map(t => ({
    subject: t.emoji ? t.emoji + ' ' + t.label : t.label,
    value:   summary?.[t.id] ?? 0,
    fullMark: 3,
  }));

  const hasData = data.some(d => d.value > 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '.75rem', flexWrap: 'wrap' }}>
        {[3,2,1].map(v => (
          <div key={v} style={{ display: 'flex', alignItems: 'center', gap: '.35rem', fontSize: '.75rem' }}>
            <div style={{
              width: 10, height: 10, borderRadius: '50%',
              background: v === 3 ? '#7c3aed' : v === 2 ? '#f59e0b' : '#f43f5e',
            }} />
            {qualLabel(v)}
          </div>
        ))}
      </div>
      {!hasData ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af', fontSize: '.88rem' }}>
          ⏳ ยังไม่มีข้อมูลการประเมิน
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <RadarChart data={data} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
            <PolarGrid stroke="#e8e3f4" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fontSize: 12, fill: '#1e1b4b', fontWeight: 600 }}
            />
            <PolarRadiusAxis
              domain={[0, 3]} tick={false} axisLine={false}
              tickCount={4}
            />
            <Radar
              name="พัฒนาการ"
              dataKey="value"
              stroke="#7c3aed"
              fill="#7c3aed"
              fillOpacity={0.25}
              strokeWidth={2}
              dot={{ r: 4, fill: '#7c3aed', strokeWidth: 0 }}
            />
          </RadarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

/* ── AttendanceBarChart ──────────────────────────────── */
export function AttendanceBarChart({ students = [] }) {
  if (!students.length) return null;

  const data = students.map(s => ({
    name: s.name.replace(/^เด็กชาย|^เด็กหญิง/, '').trim().split(' ')[0],
    มา:   s.attendance?.present ?? 0,
    ขาด:  s.attendance?.absent  ?? 0,
    level: s.level,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 5, right: 10, bottom: 30, left: 0 }} barSize={14}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f0fb" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 10, fill: '#6b7280' }}
          angle={-35} textAnchor="end" interval={0}
        />
        <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: '.8rem', paddingTop: '8px' }}
          iconType="circle" iconSize={8}
        />
        <Bar dataKey="มา"  fill="#7c3aed" radius={[4,4,0,0]} name="มาเรียน" />
        <Bar dataKey="ขาด" fill="#fca5a5" radius={[4,4,0,0]} name="ขาด/ลา" />
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ── ClassOverviewChart — avg assessment score by level ─ */
export function ClassOverviewChart({ students = [], topics = [] }) {
  if (!students.length || !topics.length) return null;

  const levels = ['K1','K2','K3'];
  const data = topics.map(t => {
    const row = { topic: (t.emoji ?? '') + ' ' + t.label };
    levels.forEach(lv => {
      const group = students.filter(s => s.level === lv && s.assessments?.summary?.[t.id] != null);
      row[lv] = group.length
        ? parseFloat((group.reduce((a,s) => a + (s.assessments.summary[t.id] ?? 0), 0) / group.length).toFixed(2))
        : 0;
    });
    return row;
  });

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 5, right: 10, bottom: 40, left: 0 }} barSize={14}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f0fb" vertical={false} />
        <XAxis
          dataKey="topic"
          tick={{ fontSize: 10, fill: '#6b7280' }}
          angle={-25} textAnchor="end" interval={0}
        />
        <YAxis domain={[0,3]} ticks={[0,1,2,3]} tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: '.8rem', paddingTop: '8px' }} iconType="circle" iconSize={8} />
        {levels.map(lv => (
          <Bar key={lv} dataKey={lv} fill={LEVEL_COLORS[lv]} radius={[4,4,0,0]} name={'อนุบาล ' + lv} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ── AssessmentProgressBars — simple in-card bars ───────
   Used as a lighter alternative when recharts feels heavy */
export function AssessmentProgressBars({ topics = [], summary = {} }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
      {topics.map((t, i) => {
        const val = summary?.[t.id] ?? 0;
        const pct = Math.round((val / 3) * 100);
        const color = val === 3 ? '#7c3aed' : val === 2 ? '#f59e0b' : val === 1 ? '#f43f5e' : '#d1d5db';
        return (
          <div key={t.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.3rem', fontSize: '.82rem' }}>
              <span style={{ fontWeight: 600 }}>{t.emoji} ด้าน{t.label}</span>
              <span style={{ color, fontWeight: 700 }}>{qualLabel(val)}</span>
            </div>
            <div style={{ height: 8, background: '#ede9fe', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: pct + '%', borderRadius: 999,
                background: 'linear-gradient(90deg,' + color + ',' + color + '99)',
                transition: 'width .8s cubic-bezier(.4,0,.2,1)',
              }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
