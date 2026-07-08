/**
 * DevelopmentChart — recharts-based charts for KinderTrack
 *
 * Exports:
 *   <RadarDevChart topics={[]} summary={{}} />        — per-student spider chart
 *   <AttendanceBarChart students={[]} />               — class attendance bars
 *   <ClassOverviewChart students={[]} topics={[]} />   — avg by level bars
 *   <ClassRadarChart students={[]} topics={[]}         — per-class radar with selector
 *                    indicators={[]} activities={[]} />
 */
import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';

/* ── colour palette ─────────────────────────────────── */
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
      {topics.map((t) => {
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

/* ── ClassRadarChart — per-class radar with selector + auto-rotate ── */
const CLASS_COLORS = {
  'อ.1/1': '#3b82f6', 'อ.1/2': '#6366f1',
  'อ.2/1': '#10b981', 'อ.2/2': '#059669',
  'อ.3/1': '#f97316', 'อ.3/2': '#ef4444', 'อ.3/3': '#d97706',
};

export function ClassRadarChart({ students = [], topics = [] }) {
  const { allClassNames } = useApp();
  const ALL_CLASSES = allClassNames;
  const [selectedClass, setSelectedClass] = useState(null); // null = auto-rotate
  const [currentIdx, setCurrentIdx] = useState(0);

  // auto-rotate when no class pinned
  useEffect(() => {
    if (selectedClass !== null) return;
    const id = setInterval(() => {
      setCurrentIdx(i => (i + 1) % ALL_CLASSES.length);
    }, 3000);
    return () => clearInterval(id);
  }, [selectedClass]);

  const displayClass = selectedClass ?? ALL_CLASSES[currentIdx];
  const color = CLASS_COLORS[displayClass] ?? '#7c3aed';

  // compute averages for displayClass
  const classStudents = students.filter(
    s => s.className === displayClass && !s.name.startsWith('(ว่าง)')
  );

  const data = topics.map(t => {
    const scored = classStudents.filter(s => s.assessments?.summary?.[t.id] != null);
    const avg = scored.length
      ? parseFloat((scored.reduce((a, s) => a + (s.assessments.summary[t.id] ?? 0), 0) / scored.length).toFixed(2))
      : 0;
    return {
      subject: (t.emoji ?? '') + ' ' + t.label,
      value: avg,
      fullMark: 3,
    };
  });

  const hasData = data.some(d => d.value > 0) && classStudents.length > 0;

  return (
    <div>
      {/* ── class selector buttons ── */}
      <div style={{ display: 'flex', gap: '.3rem', flexWrap: 'wrap', marginBottom: '.65rem', alignItems: 'center' }}>
        <button
          onClick={() => setSelectedClass(null)}
          style={{
            padding: '.22rem .6rem', borderRadius: '7px', fontSize: '.7rem', fontWeight: 700,
            border: selectedClass === null ? '1.5px solid #7c3aed' : '1.5px solid #e5e7eb',
            background: selectedClass === null ? '#7c3aed' : 'white',
            color: selectedClass === null ? 'white' : '#6b7280',
            cursor: 'pointer', transition: 'all .15s',
          }}
        >
          🔄 Auto
        </button>
        {ALL_CLASSES.map(cls => {
          const isActive = selectedClass === cls;
          const c = CLASS_COLORS[cls];
          return (
            <button
              key={cls}
              onClick={() => setSelectedClass(cls === selectedClass ? null : cls)}
              style={{
                padding: '.22rem .6rem', borderRadius: '7px', fontSize: '.7rem', fontWeight: 700,
                border: isActive ? `1.5px solid ${c}` : '1.5px solid #e5e7eb',
                background: isActive ? c : 'white',
                color: isActive ? 'white' : '#6b7280',
                cursor: 'pointer', transition: 'all .15s',
              }}
            >
              {cls}
            </button>
          );
        })}
      </div>

      {/* ── current class badge ── */}
      <div style={{ textAlign: 'center', marginBottom: '.4rem' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '.4rem',
          background: color + '18', border: `1.5px solid ${color}40`,
          borderRadius: '20px', padding: '.22rem .9rem',
          fontSize: '.82rem', fontWeight: 800, color,
        }}>
          🏫 {displayClass}
          {classStudents.length > 0 && (
            <span style={{ fontWeight: 500, color: color + 'cc', fontSize: '.7rem' }}>
              ({classStudents.length} คน)
            </span>
          )}
          {selectedClass === null && (
            <span style={{ fontSize: '.62rem', fontWeight: 600, color: '#9ca3af', marginLeft: '.15rem' }}>
              ▶ auto
            </span>
          )}
        </span>
      </div>

      {!hasData ? (
        <div style={{ textAlign: 'center', padding: '1.5rem', color: '#9ca3af', fontSize: '.85rem' }}>
          ⏳ ยังไม่มีข้อมูลการประเมินสำหรับห้อง {displayClass}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={248}>
          <RadarChart data={data} margin={{ top: 10, right: 32, bottom: 10, left: 32 }}>
            <PolarGrid stroke="#e8e3f4" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fontSize: 11, fill: '#1e1b4b', fontWeight: 600 }}
            />
            <PolarRadiusAxis
              domain={[0, 3]} tick={false} axisLine={false} tickCount={4}
            />
            <Radar
              name="พัฒนาการเฉลี่ย"
              dataKey="value"
              stroke={color}
              fill={color}
              fillOpacity={0.22}
              strokeWidth={2.5}
              dot={{ r: 5, fill: color, strokeWidth: 0 }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0];
                return (
                  <div style={{
                    background: 'white', border: `1.5px solid ${color}40`,
                    borderRadius: '10px', padding: '.5rem .8rem', fontSize: '.78rem',
                    boxShadow: '0 4px 16px rgba(0,0,0,.1)',
                  }}>
                    <div style={{ fontWeight: 700, marginBottom: '.12rem' }}>{d.name}</div>
                    <div style={{ color }}>
                      เฉลี่ย: <strong>{d.value}</strong>
                      <span style={{ color: '#9ca3af', marginLeft: '.3rem' }}>/ 3.00</span>
                    </div>
                    <div style={{ color: '#9ca3af', fontSize: '.7rem', marginTop: '.1rem' }}>
                      {d.value >= 2.5 ? 'ดีมาก 🌟' : d.value >= 2 ? 'ดี ✅' : d.value >= 1 ? 'พอใช้ ⚠️' : 'ต้องพัฒนา ❗'}
                    </div>
                  </div>
                );
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      )}

      {/* ── score scale legend ── */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '.9rem', marginTop: '.3rem', flexWrap: 'wrap' }}>
        {[
          { v: '3', label: 'ดี', c: '#7c3aed' },
          { v: '2', label: 'พอใช้', c: '#f59e0b' },
          { v: '1', label: 'ปรับปรุง', c: '#f43f5e' },
          { v: '0', label: 'ยังไม่ได้', c: '#d1d5db' },
        ].map(({ v, label, c }) => (
          <div key={v} style={{ display: 'flex', alignItems: 'center', gap: '.28rem', fontSize: '.68rem', color: '#6b7280' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
            {v} = {label}
          </div>
        ))}
      </div>
    </div>
  );
}
