// AbilityAssessmentTab.jsx
// ประเมินความสามารถผู้เรียน — รองรับ 4 ชุดข้อมูล
//   • C60      : หลักสูตรการศึกษาปฐมวัย พ.ศ. 2560 · 4 ด้าน 23 ตัวบ่งชี้
//   • C68 อ.3  : ความสามารถผู้เรียนสิ้นปี อ.3 หลักสูตร พ.ศ. 2568 · 4 ด้าน 15 ความสามารถ
//   • C68 อ.2  : ความสามารถผู้เรียนสิ้นปี อ.2 หลักสูตร พ.ศ. 2568 · 4 ด้าน 33 ความสามารถ
//   • C68 อ.1  : ความสามารถผู้เรียนสิ้นปี อ.1 หลักสูตร พ.ศ. 2568 · 4 ด้าน 33 ความสามารถ

import { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  SCALE_C60, DOMAINS_C60, INDICATORS_C60,
  getIndicatorsByDomain, LEVEL_TO_KEY, calcAvgScore,
} from '../../data/indicatorsData_curriculum60';
import {
  SCALE_C68, DOMAINS_C68, COMPETENCIES_C68,
  getCompetenciesByDomain, calcAvgScoreC68,
} from '../../data/competenciesData_อ3_68';
import {
  COMPETENCIES_C68_อ2,
  getCompetenciesByDomainอ2, calcAvgScoreC68_อ2,
} from '../../data/competenciesData_อ2_68';
import {
  COMPETENCIES_C68_อ1,
  getCompetenciesByDomainอ1, calcAvgScoreC68_อ1,
} from '../../data/competenciesData_อ1_68';
import {
  ACTIVITY_TYPES, getActivitiesForCompetency,
} from '../../data/activitiesData_68';

const TODAY = new Date().toISOString().slice(0, 10);

// ──────────────────────────────────────────────────────────────────────────────
// Dataset config
// ──────────────────────────────────────────────────────────────────────────────
const DATASETS = {
  c60: {
    key: 'c60',
    label: 'หลักสูตร พ.ศ. 2560',
    subtitle: '4 ด้าน 23 ตัวบ่งชี้',
    scale: SCALE_C60,
    domains: DOMAINS_C60,
    indicators: INDICATORS_C60,
    getByDomain: getIndicatorsByDomain,
    calcAvg: (scores) => calcAvgScore(scores),
    calcDomainAvg: (scores, domainId) => {
      const inds = getIndicatorsByDomain(domainId);
      const vals = inds.map(i => scores[i.code]).filter(v => v > 0);
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    },
    descriptorRow: (ind, levelKey) => ind.levelDescriptors?.[levelKey] ?? '—',
    descriptorLabel: (selClass) =>
      `เกณฑ์ระดับ: ${Object.keys(LEVEL_TO_KEY).find(k => selClass.includes(k)) ?? '—'}`,
    allLevels: true,      // แสดง levelKey selector
  },
  c68: {
    key: 'c68',
    label: 'หลักสูตร พ.ศ. 2568',
    subtitle: '4 ด้าน 33 ความสามารถ (อ.3)',
    scale: SCALE_C68,
    domains: DOMAINS_C68,
    indicators: COMPETENCIES_C68,
    getByDomain: getCompetenciesByDomain,
    calcAvg: (scores) => calcAvgScoreC68(scores),
    calcDomainAvg: (scores, domainId) => calcAvgScoreC68(scores, domainId),
    descriptorRow: (ind) => ind.descriptor ?? '—',
    descriptorLabel: () => 'ความสามารถที่คาดหวัง (อนุบาล 3)',
    allLevels: false,
  },
  c68_อ2: {
    key: 'c68_อ2',
    label: 'หลักสูตร พ.ศ. 2568',
    subtitle: '4 ด้าน 33 ความสามารถ (อ.2)',
    scale: SCALE_C68,
    domains: DOMAINS_C68,
    indicators: COMPETENCIES_C68_อ2,
    getByDomain: getCompetenciesByDomainอ2,
    calcAvg: (scores) => calcAvgScoreC68_อ2(scores),
    calcDomainAvg: (scores, domainId) => calcAvgScoreC68_อ2(scores, domainId),
    descriptorRow: (ind) => ind.descriptor ?? '—',
    descriptorLabel: () => 'ความสามารถที่คาดหวัง (อนุบาล 2)',
    allLevels: false,
  },
  c68_อ1: {
    key: 'c68_อ1',
    label: 'หลักสูตร พ.ศ. 2568',
    subtitle: '4 ด้าน 33 ความสามารถ (อ.1)',
    scale: SCALE_C68,
    domains: DOMAINS_C68,
    indicators: COMPETENCIES_C68_อ1,
    getByDomain: getCompetenciesByDomainอ1,
    calcAvg: (scores) => calcAvgScoreC68_อ1(scores),
    calcDomainAvg: (scores, domainId) => calcAvgScoreC68_อ1(scores, domainId),
    descriptorRow: (ind) => ind.descriptor ?? '—',
    descriptorLabel: () => 'ความสามารถที่คาดหวัง (อนุบาล 1)',
    allLevels: false,
  },
};

// ──────────────────────────────────────────────────────────────────────────────
// Auto-select C68 dataset ตามชื่อห้อง
// ──────────────────────────────────────────────────────────────────────────────
function autoC68KeyFromClass(className = '') {
  if (className.includes('อ.1') || className.includes('อนุบาล 1') ||
      className.includes('อนุบาล๑') || /อ\.?1/.test(className)) return 'c68_อ1';
  if (className.includes('อ.2') || className.includes('อนุบาล 2') ||
      className.includes('อนุบาล๒') || /อ\.?2/.test(className)) return 'c68_อ2';
  if (className.includes('อ.3') || className.includes('อนุบาล 3') ||
      className.includes('อนุบาล๓') || /อ\.?3/.test(className)) return 'c68';
  return 'c68';   // default → อ.3
}

/** label สั้นสำหรับแสดงใน badge */
function c68LevelLabel(key) {
  if (key === 'c68_อ1') return 'อ.1';
  if (key === 'c68_อ2') return 'อ.2';
  return 'อ.3';
}

// ──────────────────────────────────────────────────────────────────────────────
// helpers — รับ scale เป็น prop เพื่อรองรับทั้งสองชุด
// ──────────────────────────────────────────────────────────────────────────────
function recKey(sid, year, term) { return `${sid}||${year}||${term}`; }

function ScoreBadge({ score, onClick, scale }) {
  const meta = scale[score];
  if (!meta) {
    // ยังไม่มีคะแนน → แสดง 3 (ดี) เป็น default พร้อม opacity จางลงเล็กน้อย
    const def = scale[3];
    return (
      <button
        onClick={onClick}
        style={{ background: def.bg, color: def.color, borderColor: def.border, border: `1px solid ${def.border}`, opacity: 0.55, padding: '2px 8px', borderRadius: '4px', fontSize: '.75rem', fontWeight: 700, cursor: 'pointer' }}
        title="ยังไม่ได้ให้คะแนน (default = 3 ดี) — คลิกเพื่อเปลี่ยน"
      >3 {def.label}</button>
    );
  }
  return (
    <button
      onClick={onClick}
      style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}`, padding: '2px 8px', borderRadius: '4px', fontSize: '.75rem', fontWeight: 700, cursor: 'pointer' }}
      title={`${meta.label} — คลิกเพื่อเปลี่ยน`}
    >{score} {meta.label}</button>
  );
}

function ScorePicker({ onPick, scale }) {
  return (
    <div style={{ display: 'flex', gap: '4px' }}>
      {[3, 2, 1].map(s => (
        <button
          key={s}
          onClick={() => onPick(s)}
          style={{ background: scale[s].bg, color: scale[s].color, border: `1px solid ${scale[s].border}`, padding: '2px 8px', borderRadius: '4px', fontSize: '.75rem', fontWeight: 700, cursor: 'pointer' }}
        >{s} {scale[s].label}</button>
      ))}
      <button
        onClick={() => onPick(0)}
        style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '.75rem', border: '1px solid #d1d5db', color: '#9ca3af', background: 'white', cursor: 'pointer' }}
      >ล้าง</button>
    </div>
  );
}

function AvgBar({ avg }) {
  if (!avg) return <span style={{ color: '#d1d5db', fontSize: '.75rem' }}>—</span>;
  const pct = ((avg - 1) / 2) * 100;
  const color = avg >= 2.5 ? '#059669' : avg >= 1.5 ? '#d97706' : '#dc2626';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <div style={{ width: '64px', height: '8px', background: '#f3f4f6', borderRadius: '999px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '999px' }} />
      </div>
      <span style={{ fontSize: '.75rem', fontWeight: 700, color }}>{avg.toFixed(2)}</span>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Main component
// ──────────────────────────────────────────────────────────────────────────────
export default function AbilityAssessmentTab({ teacherClassFilter }) {
  const {
    students, allClassNames, role, user,
    academicYear, currentTerm,
    abilityAssessments, setAbilityAssessments,
    addActivityLog,
  } = useApp();

  const isTeacher = role === 'teacher';
  const myClass   = teacherClassFilter ?? (isTeacher ? user?.className : null);

  // ─── filters ────────────────────────────────────────────────────────────────
  const [selYear,   setSelYear]   = useState(academicYear);
  const [selTerm,   setSelTerm]   = useState(currentTerm ?? '1');
  const [selClass,  setSelClass]  = useState(myClass ?? '');
  // auto-select c68_อ1/อ2/อ3 จากชื่อห้อง; ถ้าไม่มีห้อง default = 'c60'
  const [datasetKey, setDatasetKey] = useState(
    myClass ? autoC68KeyFromClass(myClass) : 'c60'
  );
  const [activeDomain, setActiveDomain] = useState('d1');
  const [picker, setPicker] = useState(null);
  const [viewMode, setViewMode] = useState('input');
  const [selStudentId, setSelStudentId] = useState(null);  // สำหรับ view='student'
  // สำหรับ view='activity'
  const [actDir, setActDir] = useState('act2comp');   // 'act2comp' | 'comp2act'
  const [selActId, setSelActId] = useState('A1');
  const [selCompCode, setSelCompCode] = useState('1.1');

  // ─── active dataset ─────────────────────────────────────────────────────────
  const DS = DATASETS[datasetKey];

  // เมื่อเปลี่ยน dataset ให้ reset domain tab
  function switchDataset(key) {
    setDatasetKey(key);
    setActiveDomain(DATASETS[key].domains[0]?.id ?? 'd1');
    setPicker(null);
  }

  // เมื่อเปลี่ยนห้อง → auto-switch c68 sub-dataset ให้ตรงระดับ
  useEffect(() => {
    if (datasetKey !== 'c60') {
      const autoKey = autoC68KeyFromClass(selClass);
      if (autoKey !== datasetKey) switchDataset(autoKey);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selClass]);

  // ─── derived ─────────────────────────────────────────────────────────────────
  const classStudents = useMemo(
    () => students.filter(s => s.className === selClass && s.status !== 'inactive')
                  .sort((a, b) => (a.studentCode ?? a.name).localeCompare(b.studentCode ?? b.name, 'th')),
    [students, selClass]
  );

  // หา level key จากชื่อห้อง (ใช้เฉพาะชุด C60)
  const levelKey = useMemo(() => {
    if (!selClass) return 'k2';
    const lv = Object.keys(LEVEL_TO_KEY).find(k => selClass.includes(k));
    return lv ? LEVEL_TO_KEY[lv] : 'k2';
  }, [selClass]);

  const domainIndicators = useMemo(
    () => DS.getByDomain(activeDomain),
    [DS, activeDomain]
  );

  // ─── getter / setter ──────────────────────────────────────────────────────
  // C60 ใช้ key เดิม (ไม่มี suffix) เพื่อ backward-compat
  // C68 เพิ่ม suffix ||c68 แยกออกมา
  function dsKey(sid) {
    const base = recKey(sid, selYear, selTerm);
    return datasetKey === 'c60' ? base : `${base}||${datasetKey}`;
  }

  function getScore(sid, code) {
    return abilityAssessments?.[dsKey(sid)]?.[code] ?? 0;
  }

  function setScore(sid, code, score) {
    const k = dsKey(sid);
    setAbilityAssessments(prev => ({
      ...prev,
      [k]: {
        ...(prev[k] ?? {}),
        [code]: score || undefined,
        _assessDate: TODAY,
        _assessBy: user?.name ?? '',
      },
    }));
    setPicker(null);
    addActivityLog?.(`[${DS.label}] ให้คะแนน ${code} นักเรียน ${students.find(s => s.id === sid)?.name ?? sid} = ${score || 'ล้าง'}`);
  }

  // ─── summary ─────────────────────────────────────────────────────────────
  const summaryRows = useMemo(() => classStudents.map(s => {
    const base = recKey(s.id, selYear, selTerm);
    const k = datasetKey === 'c60' ? base : `${base}||${datasetKey}`;
    const rec = abilityAssessments?.[k] ?? {};
    const scores = Object.fromEntries(
      DS.indicators.map(i => [i.code, rec[i.code] ?? 0])
    );
    return { ...s, scores, avg: DS.calcAvg(scores) };
  }), [classStudents, abilityAssessments, selYear, selTerm, DS, datasetKey]);

  const domainAvgs = useMemo(() => {
    const result = {};
    DS.domains.forEach(d => {
      const vals = summaryRows.flatMap(r => {
        const inds = DS.getByDomain(d.id);
        return inds.map(i => r.scores[i.code]);
      }).filter(v => v > 0);
      result[d.id] = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    });
    return result;
  }, [summaryRows, DS]);

  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#1e293b' }}>ประเมินความสามารถผู้เรียน</h2>
          <p style={{ margin: '2px 0 0', fontSize: '.78rem', color: '#94a3b8' }}>{DS.label} · {DS.subtitle}</p>
        </div>
        {/* View mode toggle — pill group */}
        <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '8px', padding: '2px', gap: '2px', flexShrink: 0 }}>
          {[
            { key: 'input',    icon: '✏️', label: 'บันทึก' },
            { key: 'summary',  icon: '📈', label: 'สรุปผล' },
            { key: 'student',  icon: '👤', label: 'รายคน' },
            { key: 'activity', icon: '🎯', label: 'กิจกรรม' },
          ].map(m => (
            <button key={m.key}
              onClick={() => setViewMode(m.key)}
              style={viewMode === m.key
                ? { display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 12px', borderRadius: '6px', fontSize: '.8rem', fontWeight: 700, border: 'none', cursor: 'pointer', background: 'white', color: '#4f46e5', boxShadow: '0 1px 3px rgba(0,0,0,.1)' }
                : { display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 12px', borderRadius: '6px', fontSize: '.8rem', fontWeight: 500, border: 'none', cursor: 'pointer', background: 'transparent', color: '#64748b' }
              }
            >
              <span>{m.icon}</span>
              <span>{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Filters ── */}
      <div style={{ background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}>

        {/* แถว 1: เลือกชุดตัวบ่งชี้ */}
        <div style={{ padding: '.75rem 1rem', borderBottom: '1px solid #e2e8f0' }}>
          <p style={{ margin: '0 0 .5rem', fontSize: '.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.05em' }}>ชุดตัวบ่งชี้</p>
          <div style={{ display: 'flex', gap: '.625rem', flexWrap: 'wrap' }}>
            {/* ── ปุ่ม C60 ── */}
            {(() => {
              const active = datasetKey === 'c60';
              return (
                <button
                  onClick={() => switchDataset('c60')}
                  style={{
                    position: 'relative', display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '.5rem .875rem', borderRadius: '8px', border: `2px solid ${active ? '#6366f1' : '#e2e8f0'}`,
                    background: active ? '#6366f1' : 'white', cursor: 'pointer', textAlign: 'left',
                    boxShadow: active ? '0 2px 8px rgba(99,102,241,.25)' : 'none',
                    transition: 'all .15s',
                  }}
                >
                  <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>📘</span>
                  <div>
                    <div style={{ fontSize: '.82rem', fontWeight: 700, color: active ? 'white' : '#1e293b', lineHeight: 1.2 }}>
                      หลักสูตร 2560
                    </div>
                    <div style={{ fontSize: '.72rem', marginTop: '2px', color: active ? 'rgba(255,255,255,.7)' : '#94a3b8' }}>
                      4 ด้าน 23 ตัวบ่งชี้
                    </div>
                  </div>
                  {active && <span style={{ position: 'absolute', top: '6px', right: '6px', width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(255,255,255,.8)' }} />}
                </button>
              );
            })()}

            {/* ── ปุ่ม C68 รวม (auto-select ระดับจากห้อง) ── */}
            {(() => {
              const active = datasetKey !== 'c60';
              const level  = active ? c68LevelLabel(datasetKey) : (selClass ? c68LevelLabel(autoC68KeyFromClass(selClass)) : 'อ.3');
              return (
                <button
                  onClick={() => switchDataset(autoC68KeyFromClass(selClass))}
                  style={{
                    position: 'relative', display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '.5rem .875rem', borderRadius: '8px', border: `2px solid ${active ? '#6366f1' : '#e2e8f0'}`,
                    background: active ? '#6366f1' : 'white', cursor: 'pointer', textAlign: 'left',
                    boxShadow: active ? '0 2px 8px rgba(99,102,241,.25)' : 'none',
                    transition: 'all .15s',
                  }}
                >
                  <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>📗</span>
                  <div>
                    <div style={{ fontSize: '.82rem', fontWeight: 700, color: active ? 'white' : '#1e293b', lineHeight: 1.2 }}>
                      หลักสูตร 2568
                    </div>
                    <div style={{ fontSize: '.72rem', marginTop: '2px', color: active ? 'rgba(255,255,255,.7)' : '#94a3b8' }}>
                      4 ด้าน 33 ความสามารถ
                    </div>
                  </div>
                  {/* badge ระดับ */}
                  <span style={{
                    marginLeft: 'auto', fontSize: '.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '999px',
                    background: active ? 'rgba(255,255,255,.2)' : '#ede9fe', color: active ? 'white' : '#6366f1',
                  }}>
                    {level}
                  </span>
                  {active && <span style={{ position: 'absolute', top: '6px', right: '6px', width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(255,255,255,.8)' }} />}
                </button>
              );
            })()}
          </div>
        </div>

        {/* แถว 2: ตัวกรอง */}
        <div style={{ padding: '.625rem 1rem', display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: '.75rem', background: 'white' }}>
          {/* ปีการศึกษา */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <label style={{ fontSize: '.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.05em' }}>ปีการศึกษา</label>
            <input
              type="text"
              value={selYear}
              onChange={e => setSelYear(e.target.value)}
              style={{ padding: '.3rem .6rem', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '.82rem', width: '5.5rem', outline: 'none', color: '#1e293b' }}
            />
          </div>

          <div style={{ width: '1px', height: '28px', background: '#e2e8f0', alignSelf: 'flex-end', marginBottom: '1px' }} />

          {/* ภาคเรียน */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <label style={{ fontSize: '.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.05em' }}>ภาคเรียน</label>
            <select value={selTerm} onChange={e => setSelTerm(e.target.value)}
              style={{ padding: '.3rem .6rem', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '.82rem', outline: 'none', color: '#1e293b', background: 'white' }}>
              <option value="1">ภาคเรียนที่ 1</option>
              <option value="2">ภาคเรียนที่ 2</option>
            </select>
          </div>

          <div style={{ width: '1px', height: '28px', background: '#e2e8f0', alignSelf: 'flex-end', marginBottom: '1px' }} />

          {/* ห้องเรียน */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <label style={{ fontSize: '.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.05em' }}>ห้องเรียน</label>
            {isTeacher ? (
              <span style={{ padding: '.3rem .75rem', borderRadius: '6px', background: '#ede9fe', color: '#6366f1', fontSize: '.82rem', fontWeight: 700, border: '1px solid #c4b5fd' }}>{myClass}</span>
            ) : (
              <select value={selClass} onChange={e => setSelClass(e.target.value)}
                style={{ padding: '.3rem .6rem', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '.82rem', outline: 'none', color: '#1e293b', background: 'white' }}>
                <option value="">— เลือกห้อง —</option>
                {(allClassNames ?? []).sort().map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            )}
          </div>

          {/* ระดับ (C60 allLevels) */}
          {selClass && DS.allLevels && (
            <>
              <div style={{ width: '1px', height: '28px', background: '#e2e8f0', alignSelf: 'flex-end', marginBottom: '1px' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <label style={{ fontSize: '.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.05em' }}>ระดับ</label>
                <span style={{ padding: '.3rem .75rem', borderRadius: '6px', background: '#f8fafc', color: '#475569', fontSize: '.82rem', border: '1px solid #e2e8f0' }}>
                  {Object.keys(LEVEL_TO_KEY).find(k => selClass.includes(k)) ?? selClass}
                </span>
              </div>
            </>
          )}

          {/* คำเตือน C68 ถ้าห้องไม่ใช่ อ.3 */}
          {selClass && !DS.allLevels && !selClass.includes('3') && (
            <span style={{ padding: '.3rem .75rem', borderRadius: '6px', background: '#fffbeb', color: '#92400e', fontSize: '.78rem', fontWeight: 600, border: '1px solid #fde68a', alignSelf: 'flex-end' }}>
              ⚠️ ชุดนี้ออกแบบสำหรับ อ.3 เท่านั้น
            </span>
          )}
        </div>
      </div>

      {!selClass && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3.5rem 1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '.75rem' }}>🏫</div>
          <p style={{ margin: 0, fontSize: '.9rem', fontWeight: 600, color: '#64748b' }}>กรุณาเลือกห้องเรียน</p>
          <p style={{ margin: '4px 0 0', fontSize: '.82rem', color: '#94a3b8' }}>เพื่อเริ่มบันทึกการประเมิน</p>
        </div>
      )}

      {selClass && classStudents.length === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3.5rem 1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '.75rem' }}>👥</div>
          <p style={{ margin: 0, fontSize: '.9rem', fontWeight: 600, color: '#64748b' }}>ไม่พบนักเรียนในห้อง {selClass}</p>
          <p style={{ margin: '4px 0 0', fontSize: '.82rem', color: '#94a3b8' }}>กรุณาตรวจสอบข้อมูลนักเรียน</p>
        </div>
      )}

      {/* ══════════ VIEW: INPUT ════════════ */}
      {selClass && classStudents.length > 0 && viewMode === 'input' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Domain tabs */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem' }}>
            {DS.domains.map(d => {
              const active = activeDomain === d.id;
              const avg = domainAvgs[d.id];
              return (
                <button
                  key={d.id}
                  onClick={() => { setActiveDomain(d.id); setPicker(null); }}
                  style={active
                    ? { display: 'flex', alignItems: 'center', gap: '6px', padding: '.4rem .9rem', borderRadius: '20px', border: `2px solid ${d.border}`, background: d.bg, color: d.color, boxShadow: `0 2px 8px ${d.border}55`, cursor: 'pointer', fontSize: '.82rem' }
                    : { display: 'flex', alignItems: 'center', gap: '6px', padding: '.4rem .9rem', borderRadius: '20px', border: '2px solid #e5e7eb', background: 'white', color: '#6b7280', cursor: 'pointer', fontSize: '.82rem' }}
                >
                  <span style={{ fontSize: '1rem', lineHeight: 1 }}>{d.icon}</span>
                  <span style={{ fontWeight: active ? 700 : 500 }}>{d.label}</span>
                  {avg > 0 && (
                    <span
                      style={active
                        ? { fontSize: '.72rem', padding: '1px 6px', borderRadius: '999px', fontWeight: 700, background: d.border + '33', color: d.color }
                        : { fontSize: '.72rem', padding: '1px 6px', borderRadius: '999px', fontWeight: 700, background: '#f3f4f6', color: '#9ca3af' }}
                    >{avg.toFixed(1)}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Assessment table */}
          {(() => {
            const domain = DS.domains.find(d => d.id === activeDomain);
            return (
              <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,.04)', overflowX: 'auto' }}>
                <div style={{ padding: '.625rem .875rem', borderBottom: '1px solid #e2e8f0', background: domain.bg }}>
                  <span style={{ color: domain.color, fontWeight: 700, fontSize: '.85rem' }}>
                    {domain.icon} {domain.label}
                  </span>
                </div>
                <table style={{ width: '100%', fontSize: '.82rem', minWidth: '700px', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                      <th style={{ textAlign: 'left', padding: '.5rem .75rem', color: '#64748b', fontWeight: 600, width: '2rem' }}>#</th>
                      <th style={{ textAlign: 'left', padding: '.5rem .75rem', color: '#64748b', fontWeight: 600, minWidth: '140px' }}>ชื่อ-สกุล</th>
                      {domainIndicators.map(ind => (
                        <th key={ind.code} style={{ padding: '.5rem .5rem', textAlign: 'center', color: '#64748b', fontWeight: 600, minWidth: '110px' }}>
                          <div style={{ fontSize: '.78rem', fontWeight: 700, color: '#374151' }}>{ind.code}</div>
                          <div style={{ fontSize: '.7rem', color: '#94a3b8', lineHeight: 1.3, maxWidth: '100px', margin: '0 auto' }}>
                            {ind.label}
                          </div>
                        </th>
                      ))}
                    </tr>
                    {/* descriptor row */}
                    <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#eff6ff' }}>
                      <td colSpan={2} style={{ padding: '.25rem .75rem', fontSize: '.72rem', color: '#2563eb', fontWeight: 600 }}>
                        {DS.descriptorLabel(selClass)}
                      </td>
                      {domainIndicators.map(ind => (
                        <td key={ind.code} style={{ padding: '.25rem .5rem', fontSize: '.7rem', color: '#3b82f6', textAlign: 'center', lineHeight: 1.3 }}>
                          {DS.descriptorRow(ind, levelKey)}
                        </td>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {classStudents.map((s, idx) => (
                      <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '.5rem .75rem', color: '#94a3b8', fontSize: '.78rem' }}>{idx + 1}</td>
                        <td style={{ padding: '.5rem .75rem' }}>
                          <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '.82rem' }}>{s.name}</div>
                          <div style={{ fontSize: '.72rem', color: '#94a3b8' }}>{s.studentCode ?? ''}</div>
                        </td>
                        {domainIndicators.map(ind => (
                          <td key={ind.code} style={{ padding: '.5rem .5rem', textAlign: 'center' }}>
                            {picker?.sid === s.id && picker?.code === ind.code ? (
                              <ScorePicker
                                scale={DS.scale}
                                onPick={v => setScore(s.id, ind.code, v)}
                              />
                            ) : (
                              <ScoreBadge
                                scale={DS.scale}
                                score={getScore(s.id, ind.code)}
                                onClick={() => setPicker({ sid: s.id, code: ind.code })}
                              />
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()}

          <p style={{ fontSize: '.78rem', color: '#94a3b8', textAlign: 'center', margin: 0 }}>
            คลิกที่ช่องคะแนนเพื่อให้คะแนน · ข้อมูลบันทึกอัตโนมัติทันที
          </p>
        </div>
      )}

      {/* ══════════ VIEW: SUMMARY ════════════ */}
      {selClass && classStudents.length > 0 && viewMode === 'summary' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* domain avg cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '.75rem' }}>
            {DS.domains.map(d => {
              const avg = domainAvgs[d.id];
              const meta = DS.scale[avg >= 2.5 ? 3 : avg >= 1.5 ? 2 : avg > 0 ? 1 : 0];
              return (
                <div key={d.id}
                  style={{ background: d.bg, border: `1px solid ${d.border}`, borderRadius: '10px', padding: '.875rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ fontSize: '1.2rem' }}>{d.icon}</div>
                  <div style={{ color: d.color, fontSize: '.82rem', fontWeight: 700, lineHeight: 1.3 }}>{d.label}</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: d.color }}>
                    {avg ? avg.toFixed(2) : '—'}
                  </div>
                  {meta && <div style={{ fontSize: '.75rem', color: meta.color }}>{meta.label}</div>}
                </div>
              );
            })}
          </div>

          {/* student summary table */}
          <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,.04)', overflowX: 'auto' }}>
            <div style={{ padding: '.625rem .875rem', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <span style={{ fontWeight: 700, fontSize: '.85rem', color: '#374151' }}>
                สรุปผลรายนักเรียน — {selClass} ปีการศึกษา {selYear} ภาคเรียน {selTerm}
                <span style={{ marginLeft: '8px', fontSize: '.78rem', color: '#6366f1', fontWeight: 500 }}>({DS.label})</span>
              </span>
            </div>
            <table style={{ width: '100%', fontSize: '.82rem', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                  <th style={{ textAlign: 'left', padding: '.5rem .75rem', color: '#64748b', fontWeight: 600, width: '2rem' }}>#</th>
                  <th style={{ textAlign: 'left', padding: '.5rem .75rem', color: '#64748b', fontWeight: 600 }}>ชื่อ-สกุล</th>
                  {DS.domains.map(d => (
                    <th key={d.id} style={{ padding: '.5rem .75rem', textAlign: 'center', color: '#64748b', fontWeight: 600, fontSize: '.75rem' }}>
                      {d.icon} {d.label.replace('ด้าน', '')}
                    </th>
                  ))}
                  <th style={{ padding: '.5rem .75rem', textAlign: 'center', color: '#64748b', fontWeight: 600, fontSize: '.75rem' }}>เฉลี่ยรวม</th>
                  <th style={{ padding: '.5rem .75rem', textAlign: 'center', color: '#64748b', fontWeight: 600, fontSize: '.75rem' }}>ระดับ</th>
                </tr>
              </thead>
              <tbody>
                {summaryRows.map((s, idx) => {
                  const label = s.avg >= 2.5 ? 'ดี' : s.avg >= 1.5 ? 'พอใช้' : s.avg > 0 ? 'ควรส่งเสริม' : '—';
                  const color = s.avg >= 2.5 ? '#059669' : s.avg >= 1.5 ? '#d97706' : s.avg > 0 ? '#dc2626' : '#9ca3af';
                  return (
                    <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '.5rem .75rem', color: '#94a3b8', fontSize: '.78rem' }}>{idx + 1}</td>
                      <td style={{ padding: '.5rem .75rem' }}>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>{s.name}</div>
                        <div style={{ fontSize: '.72rem', color: '#94a3b8' }}>{s.studentCode ?? ''}</div>
                      </td>
                      {DS.domains.map(d => {
                        const inds = DS.getByDomain(d.id);
                        const vals = inds.map(i => s.scores[i.code]).filter(v => v > 0);
                        const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
                        return (
                          <td key={d.id} style={{ padding: '.5rem .75rem', textAlign: 'center' }}>
                            <AvgBar avg={avg} />
                          </td>
                        );
                      })}
                      <td style={{ padding: '.5rem .75rem', textAlign: 'center' }}>
                        <span style={{ fontWeight: 700, color }}>
                          {s.avg ? s.avg.toFixed(2) : '—'}
                        </span>
                      </td>
                      <td style={{ padding: '.5rem .75rem', textAlign: 'center' }}>
                        <span style={{ fontSize: '.75rem', fontWeight: 700, color }}>{label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* indicator-level detail */}
          <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,.04)', overflowX: 'auto' }}>
            <div style={{ padding: '.625rem .875rem', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <span style={{ fontWeight: 700, fontSize: '.85rem', color: '#374151' }}>เฉลี่ยตามตัวบ่งชี้/ความสามารถ — ทั้งห้อง</span>
            </div>
            <table style={{ width: '100%', fontSize: '.82rem', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                  <th style={{ textAlign: 'left', padding: '.5rem .75rem', color: '#64748b', fontWeight: 600 }}>รหัส</th>
                  <th style={{ textAlign: 'left', padding: '.5rem .75rem', color: '#64748b', fontWeight: 600 }}>ตัวบ่งชี้ / ความสามารถ</th>
                  <th style={{ padding: '.5rem .75rem', textAlign: 'center', color: '#64748b', fontWeight: 600 }}>เฉลี่ย</th>
                  <th style={{ padding: '.5rem .75rem', textAlign: 'center', color: '#64748b', fontWeight: 600 }}>ดี</th>
                  <th style={{ padding: '.5rem .75rem', textAlign: 'center', color: '#64748b', fontWeight: 600 }}>พอใช้</th>
                  <th style={{ padding: '.5rem .75rem', textAlign: 'center', color: '#64748b', fontWeight: 600 }}>ควรส่งเสริม</th>
                </tr>
              </thead>
              <tbody>
                {DS.indicators.map(ind => {
                  const vals = summaryRows.map(r => r.scores[ind.code]).filter(v => v > 0);
                  const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
                  const c3 = summaryRows.filter(r => r.scores[ind.code] === 3).length;
                  const c2 = summaryRows.filter(r => r.scores[ind.code] === 2).length;
                  const c1 = summaryRows.filter(r => r.scores[ind.code] === 1).length;
                  const dom = DS.domains.find(d => d.id === ind.domainId);
                  return (
                    <tr key={ind.code} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '.5rem .75rem' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '.75rem', fontWeight: 700, color: dom?.color }}>{ind.code}</span>
                      </td>
                      <td style={{ padding: '.5rem .75rem', fontSize: '.78rem', color: '#374151' }}>{ind.label}</td>
                      <td style={{ padding: '.5rem .75rem', textAlign: 'center' }}><AvgBar avg={avg} /></td>
                      <td style={{ padding: '.5rem .75rem', textAlign: 'center', fontSize: '.78rem', fontWeight: 700, color: '#059669' }}>{c3 || '—'}</td>
                      <td style={{ padding: '.5rem .75rem', textAlign: 'center', fontSize: '.78rem', fontWeight: 700, color: '#d97706' }}>{c2 || '—'}</td>
                      <td style={{ padding: '.5rem .75rem', textAlign: 'center', fontSize: '.78rem', fontWeight: 700, color: '#dc2626' }}>{c1 || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* ══════════ VIEW: STUDENT (รายคน) ════════════ */}
      {selClass && classStudents.length > 0 && viewMode === 'student' && (() => {
        const stu = classStudents.find(s => s.id === selStudentId) ?? classStudents[0];
        const stuScores = Object.fromEntries(DS.indicators.map(i => [i.code, getScore(stu.id, i.code)]));
        const overall = DS.calcAvg(stuScores);
        const overallLabel = overall >= 2.5 ? 'ดี' : overall >= 1.5 ? 'พอใช้' : overall > 0 ? 'ควรส่งเสริม' : '—';
        const overallColor = overall >= 2.5 ? '#059669' : overall >= 1.5 ? '#d97706' : overall > 0 ? '#dc2626' : '#9ca3af';
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* student picker */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '.75rem', padding: '.75rem 1rem', background: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}>
              <label style={{ fontSize: '.78rem', color: '#64748b', fontWeight: 600 }}>นักเรียน</label>
              <select
                value={stu.id}
                onChange={e => setSelStudentId(e.target.value)}
                style={{ padding: '.3rem .6rem', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '.82rem', flex: '1 1 auto', maxWidth: '280px', outline: 'none', color: '#1e293b', background: 'white' }}
              >
                {classStudents.map(s => (
                  <option key={s.id} value={s.id}>{s.studentCode ? `${s.studentCode} ` : ''}{s.name}</option>
                ))}
              </select>
              {overall > 0 && (
                <span style={{ fontSize: '.82rem', fontWeight: 700, color: overallColor }}>
                  เฉลี่ยรวม {overall.toFixed(2)} — {overallLabel}
                </span>
              )}
            </div>

            {/* checklist per domain */}
            {DS.domains.map(d => {
              const items = DS.getByDomain(d.id);
              const dVals = items.map(i => stuScores[i.code]).filter(v => v > 0);
              const dAvg = dVals.length ? dVals.reduce((a, b) => a + b, 0) / dVals.length : 0;
              const passed = dVals.filter(v => v >= 2).length;
              return (
                <div key={d.id} style={{ background: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,.04)', overflow: 'hidden' }}>
                  {/* domain header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '.625rem .875rem', background: d.bg, borderBottom: `1px solid ${d.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.1rem' }}>{d.icon}</span>
                      <span style={{ fontWeight: 700, fontSize: '.85rem', color: d.color }}>{d.label}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {dAvg > 0 && <AvgBar avg={dAvg} />}
                      {dVals.length > 0 && (
                        <span style={{ fontSize: '.78rem', color: d.color, fontWeight: 600 }}>
                          ผ่าน {passed}/{items.length}
                        </span>
                      )}
                    </div>
                  </div>
                  {/* items */}
                  <div>
                    {items.map((ind, itemIdx) => {
                      const sc = stuScores[ind.code];
                      const meta = DS.scale[sc];
                      const passed = sc >= 2;
                      return (
                        <div key={ind.code} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '.625rem .875rem', borderBottom: itemIdx < items.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                          {/* pass/fail indicator */}
                          <div style={{
                            marginTop: '2px', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.72rem', fontWeight: 700, flexShrink: 0,
                            background: sc === 0 ? '#f1f5f9' : passed ? '#d1fae5' : '#fee2e2',
                            color: sc === 0 ? '#cbd5e1' : passed ? '#059669' : '#ef4444',
                          }}>
                            {sc === 0 ? '—' : passed ? '✓' : '✗'}
                          </div>
                          {/* code + label */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                              <span style={{ fontFamily: 'monospace', fontSize: '.75rem', fontWeight: 700, color: d.color }}>{ind.code}</span>
                              <span style={{ fontSize: '.82rem', color: '#1e293b' }}>{ind.label}</span>
                            </div>
                            {DS.descriptorRow(ind, levelKey) !== '—' && (
                              <p style={{ margin: '3px 0 0', fontSize: '.72rem', color: '#94a3b8', lineHeight: 1.5 }}>
                                {DS.descriptorRow(ind, levelKey)}
                              </p>
                            )}
                          </div>
                          {/* score badge + picker */}
                          <div style={{ flexShrink: 0 }}>
                            {picker?.sid === stu.id && picker?.code === ind.code ? (
                              <ScorePicker scale={DS.scale} onPick={v => setScore(stu.id, ind.code, v)} />
                            ) : (
                              <ScoreBadge scale={DS.scale} score={sc}
                                onClick={() => setPicker({ sid: stu.id, code: ind.code })} />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            <p style={{ fontSize: '.78rem', color: '#94a3b8', textAlign: 'center', margin: 0 }}>
              ✓ = ผ่าน (คะแนน ≥ 2) · ✗ = ยังไม่ผ่าน (คะแนน 1) · คลิกที่คะแนนเพื่อเปลี่ยน
            </p>
          </div>
        );
      })()}

      {/* ══════════ VIEW: ACTIVITY (กิจกรรม↔ความสามารถ) ════════════ */}
      {viewMode === 'activity' && (() => {
        const selAct = ACTIVITY_TYPES.find(a => a.id === selActId) ?? ACTIVITY_TYPES[0];
        const compCodesForAct = selAct.competencyCodes;
        const compsForAct = DS.indicators.filter(i => compCodesForAct.includes(i.code));
        const actsForComp = getActivitiesForCompetency(selCompCode);

        // ── แนะนำอัตโนมัติ: คำนวณความสามารถที่คะแนนต่ำจาก summaryRows ──
        const compAvgMap = {};
        DS.indicators.forEach(ind => {
          const vals = summaryRows.map(r => r.scores[ind.code]).filter(v => v > 0);
          if (vals.length) compAvgMap[ind.code] = vals.reduce((a, b) => a + b, 0) / vals.length;
        });
        const weakComps = DS.indicators
          .filter(ind => compAvgMap[ind.code] != null)
          .sort((a, b) => compAvgMap[a.code] - compAvgMap[b.code])
          .slice(0, 8); // bottom 8

        // จัดอันดับกิจกรรมตามจำนวน weak comps ที่ครอบคลุม
        const actScores = ACTIVITY_TYPES.map(act => {
          const covered = weakComps.filter(ind => act.competencyCodes.includes(ind.code));
          return { act, covered, score: covered.length };
        }).filter(x => x.score > 0).sort((a, b) => b.score - a.score);

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* direction toggle */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', background: '#f1f5f9', borderRadius: '8px', padding: '2px', gap: '2px' }}>
                {[
                  { key: 'act2comp',  label: '🎯 กิจกรรม → ความสามารถ' },
                  { key: 'comp2act',  label: '📋 ความสามารถ → กิจกรรม' },
                  { key: 'matrix',    label: '🗂️ ตาราง Matrix' },
                  { key: 'recommend', label: `✨ แนะนำอัตโนมัติ${selClass && weakComps.length ? ` (${weakComps.length})` : ''}` },
                ].map(m => (
                  <button key={m.key}
                    onClick={() => setActDir(m.key)}
                    style={actDir === m.key
                      ? { padding: '5px 12px', borderRadius: '6px', fontSize: '.8rem', fontWeight: 700, border: 'none', cursor: 'pointer', background: 'white', color: '#4f46e5', boxShadow: '0 1px 3px rgba(0,0,0,.1)' }
                      : { padding: '5px 12px', borderRadius: '6px', fontSize: '.8rem', fontWeight: 500, border: 'none', cursor: 'pointer', background: 'transparent', color: '#64748b' }
                    }
                  >{m.label}</button>
                ))}
              </div>
            </div>

            {/* ─── กิจกรรม → ความสามารถ ─── */}
            {actDir === 'act2comp' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px,280px) 1fr', gap: '1rem' }}>

                {/* left: activity list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <p style={{ margin: 0, fontSize: '.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.05em' }}>เลือกกิจกรรม</p>
                  {ACTIVITY_TYPES.map(act => {
                    const active = act.id === selActId;
                    return (
                      <button
                        key={act.id}
                        onClick={() => setSelActId(act.id)}
                        style={active
                          ? { display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '.625rem .875rem', borderRadius: '10px', border: `2px solid ${act.border}`, background: act.bg, color: act.color, cursor: 'pointer', textAlign: 'left', width: '100%' }
                          : { display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '.625rem .875rem', borderRadius: '10px', border: '2px solid #e2e8f0', background: 'white', color: '#374151', cursor: 'pointer', textAlign: 'left', width: '100%' }}
                      >
                        <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>{act.icon}</span>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '.82rem', lineHeight: 1.3 }}>{act.label}</div>
                          <div style={{ fontSize: '.72rem', marginTop: '2px', opacity: .7, lineHeight: 1.4 }}>{act.description}</div>
                          <div style={{ marginTop: '4px', fontSize: '.72rem', fontWeight: 700, color: active ? act.color : '#9ca3af' }}>
                            {act.competencyCodes.length} ความสามารถ
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* right: competencies covered */}
                <div>
                  <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,.04)', overflow: 'hidden' }}>
                    <div style={{ padding: '.625rem .875rem', borderBottom: '1px solid #e2e8f0', background: selAct.bg, display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '1.4rem' }}>{selAct.icon}</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '.85rem', color: selAct.color }}>{selAct.label}</div>
                        <div style={{ fontSize: '.72rem', marginTop: '2px', color: selAct.color + 'aa' }}>
                          ส่งเสริมความสามารถ {compsForAct.length} รายการ
                          {compsForAct.length < compCodesForAct.length && (
                            <span style={{ marginLeft: '6px', color: '#d97706' }}>
                              (ชุดนี้มี {compCodesForAct.length - compsForAct.length} รหัสที่ไม่อยู่ในหลักสูตรที่เลือก)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {compsForAct.length === 0 ? (
                      <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#94a3b8', fontSize: '.85rem' }}>
                        ไม่พบความสามารถในชุดหลักสูตรที่เลือก
                      </div>
                    ) : (
                      <div>
                        {compsForAct.map((ind, idx) => {
                          const dom = DS.domains.find(d => d.id === ind.domainId);
                          return (
                            <div key={ind.code} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '.625rem .875rem', borderBottom: idx < compsForAct.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                              <span style={{ marginTop: '2px', fontSize: '.72rem', fontWeight: 700, fontFamily: 'monospace', padding: '2px 6px', borderRadius: '6px', flexShrink: 0, background: dom?.bg ?? '#f3f4f6', color: dom?.color ?? '#6b7280' }}>
                                {ind.code}
                              </span>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '.82rem', fontWeight: 600, color: '#1e293b' }}>{ind.label}</div>
                                {dom && (
                                  <div style={{ fontSize: '.72rem', marginTop: '2px', color: dom.color }}>
                                    {dom.icon} {dom.label}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ─── ความสามารถ → กิจกรรม ─── */}
            {actDir === 'comp2act' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px,300px) 1fr', gap: '1rem' }}>

                {/* left: competency list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxHeight: '600px', overflowY: 'auto', paddingRight: '4px' }}>
                  <p style={{ margin: '0 0 4px', fontSize: '.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.05em', position: 'sticky', top: 0, background: 'white', paddingBottom: '4px' }}>เลือกความสามารถ</p>
                  {DS.domains.map(dom => (
                    <div key={dom.id}>
                      <div style={{ padding: '4px 8px', fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', marginTop: '8px', color: dom.color }}>
                        {dom.icon} {dom.label}
                      </div>
                      {DS.getByDomain(dom.id).map(ind => {
                        const active = ind.code === selCompCode;
                        const actCount = getActivitiesForCompetency(ind.code).length;
                        return (
                          <button
                            key={ind.code}
                            onClick={() => setSelCompCode(ind.code)}
                            style={active
                              ? { display: 'flex', alignItems: 'center', gap: '6px', padding: '.35rem .625rem', borderRadius: '6px', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%', background: dom.bg, color: dom.color, fontWeight: 700 }
                              : { display: 'flex', alignItems: 'center', gap: '6px', padding: '.35rem .625rem', borderRadius: '6px', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%', background: 'transparent', color: '#374151', fontWeight: 400 }}
                          >
                            <span style={{ fontFamily: 'monospace', fontSize: '.72rem', fontWeight: 700, flexShrink: 0, color: active ? dom.color : '#9ca3af' }}>{ind.code}</span>
                            <span style={{ flex: 1, lineHeight: 1.3, fontSize: '.75rem' }}>{ind.label}</span>
                            {actCount > 0 && (
                              <span style={{ fontSize: '.68rem', padding: '1px 5px', borderRadius: '999px', flexShrink: 0,
                                background: active ? dom.border + '44' : '#f1f5f9', color: active ? dom.color : '#94a3b8' }}>
                                {actCount}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>

                {/* right: activities for selected competency */}
                <div>
                  {(() => {
                    const ind = DS.indicators.find(i => i.code === selCompCode);
                    const dom = ind ? DS.domains.find(d => d.id === ind.domainId) : null;
                    return (
                      <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,.04)', overflow: 'hidden' }}>
                        <div style={{ padding: '.625rem .875rem', borderBottom: '1px solid #e2e8f0', background: dom?.bg ?? '#f8fafc' }}>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                            <span style={{ fontFamily: 'monospace', fontSize: '.85rem', fontWeight: 700, color: dom?.color ?? '#374151' }}>{selCompCode}</span>
                            <span style={{ fontWeight: 600, fontSize: '.85rem', color: '#1e293b' }}>{ind?.label ?? ''}</span>
                          </div>
                          {dom && (
                            <div style={{ fontSize: '.72rem', marginTop: '2px', color: dom.color }}>
                              {dom.icon} {dom.label} · ส่งเสริมโดย {actsForComp.length} กิจกรรม
                            </div>
                          )}
                        </div>
                        {actsForComp.length === 0 ? (
                          <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#94a3b8', fontSize: '.85rem' }}>
                            ความสามารถนี้ยังไม่มีกิจกรรมที่เชื่อมโยง
                          </div>
                        ) : (
                          <div>
                            {actsForComp.map((act, actIdx) => (
                              <div key={act.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '.75rem .875rem', borderBottom: actIdx < actsForComp.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                                <div style={{ width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0, background: act.bg }}>
                                  {act.icon}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontWeight: 700, fontSize: '.85rem', color: act.color }}>{act.label}</div>
                                  <div style={{ fontSize: '.72rem', color: '#64748b', marginTop: '2px', lineHeight: 1.4 }}>{act.description}</div>
                                  <div style={{ marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                    {act.competencyCodes.map(code => (
                                      <span key={code}
                                        style={{ fontSize: '.68rem', padding: '1px 5px', borderRadius: '4px', fontFamily: 'monospace', fontWeight: 700,
                                          background: code === selCompCode ? act.color : '#f1f5f9',
                                          color: code === selCompCode ? 'white' : '#64748b' }}
                                      >{code}</span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* ─── MATRIX ─── */}
            {actDir === 'matrix' && (
              <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,.04)', overflowX: 'auto' }}>
                <div style={{ padding: '.625rem .875rem', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                  <span style={{ fontWeight: 700, fontSize: '.85rem', color: '#374151' }}>
                    ตาราง Matrix — กิจกรรม × ความสามารถ
                  </span>
                  <span style={{ marginLeft: '8px', fontSize: '.75rem', color: '#94a3b8' }}>({DS.label})</span>
                </div>
                <table style={{ width: '100%', fontSize: '.75rem', minWidth: '720px', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                      <th style={{ textAlign: 'left', padding: '.5rem .75rem', color: '#64748b', fontWeight: 600, width: '3rem' }}>รหัส</th>
                      <th style={{ textAlign: 'left', padding: '.5rem .75rem', color: '#64748b', fontWeight: 600, minWidth: '160px' }}>ความสามารถ</th>
                      {ACTIVITY_TYPES.map(act => (
                        <th key={act.id} style={{ padding: '.5rem .5rem', textAlign: 'center', minWidth: '80px' }}>
                          <div style={{ fontSize: '1.1rem', lineHeight: 1 }}>{act.icon}</div>
                          <div style={{ fontSize: '.65rem', color: '#94a3b8', marginTop: '2px', lineHeight: 1.3, maxWidth: '72px', margin: '2px auto 0' }}>
                            {act.label.replace('กิจกรรม', '').trim()}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {DS.domains.map(dom => (
                      <>
                        {/* domain header row */}
                        <tr key={`dom-${dom.id}`} style={{ background: dom.bg }}>
                          <td colSpan={2 + ACTIVITY_TYPES.length}
                            style={{ padding: '.375rem .75rem', fontWeight: 700, fontSize: '.75rem', color: dom.color }}>
                            {dom.icon} {dom.label}
                          </td>
                        </tr>
                        {DS.getByDomain(dom.id).map(ind => (
                          <tr key={ind.code} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '.5rem .75rem' }}>
                              <span style={{ fontFamily: 'monospace', fontWeight: 700, color: dom.color }}>{ind.code}</span>
                            </td>
                            <td style={{ padding: '.5rem .75rem', color: '#374151', lineHeight: 1.4 }}>{ind.label}</td>
                            {ACTIVITY_TYPES.map(act => {
                              const linked = act.competencyCodes.includes(ind.code);
                              return (
                                <td key={act.id} style={{ padding: '.5rem .5rem', textAlign: 'center' }}>
                                  {linked ? (
                                    <span
                                      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', borderRadius: '50%', color: 'white', fontSize: '.72rem', fontWeight: 700, background: act.color }}
                                      title={act.label}
                                    >✓</span>
                                  ) : (
                                    <span style={{ display: 'inline-block', width: '22px', height: '22px', borderRadius: '50%', background: '#f1f5f9' }} />
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </>
                    ))}
                  </tbody>
                </table>
                {/* legend */}
                <div style={{ padding: '.625rem .875rem', borderTop: '1px solid #f1f5f9', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  {ACTIVITY_TYPES.map(act => (
                    <div key={act.id} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '.75rem', color: '#475569' }}>
                      <span style={{ width: '16px', height: '16px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '.65rem', background: act.color }}>✓</span>
                      {act.icon} {act.label.replace('กิจกรรม', '').trim()}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ─── RECOMMEND ─── */}
            {actDir === 'recommend' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {!selClass ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '.75rem' }}>🏫</div>
                    <p style={{ margin: 0, fontSize: '.9rem', fontWeight: 600, color: '#64748b' }}>กรุณาเลือกห้องเรียนก่อน</p>
                    <p style={{ margin: '4px 0 0', fontSize: '.82rem', color: '#94a3b8' }}>ระบบจะดึงคะแนนของห้องมาวิเคราะห์</p>
                  </div>
                ) : weakComps.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '.75rem' }}>📊</div>
                    <p style={{ margin: 0, fontSize: '.9rem', fontWeight: 600, color: '#64748b' }}>ยังไม่มีข้อมูลคะแนนในห้อง {selClass}</p>
                    <p style={{ margin: '4px 0 0', fontSize: '.82rem', color: '#94a3b8' }}>บันทึกคะแนนในแท็บ "บันทึก" ก่อน แล้วกลับมาดูคำแนะนำ</p>
                  </div>
                ) : (
                  <>
                    {/* weak competencies list */}
                    <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,.04)', overflow: 'hidden' }}>
                      <div style={{ padding: '.625rem .875rem', borderBottom: '1px solid #e2e8f0', background: '#fffbeb' }}>
                        <span style={{ fontWeight: 700, fontSize: '.85rem', color: '#92400e' }}>
                          ⚠️ ความสามารถที่คะแนนเฉลี่ยต่ำสุด — {selClass}
                        </span>
                        <span style={{ marginLeft: '8px', fontSize: '.75rem', color: '#b45309' }}>
                          ({selYear} ภาค {selTerm})
                        </span>
                      </div>
                      <div>
                        {weakComps.map((ind, rank) => {
                          const avg = compAvgMap[ind.code];
                          const dom = DS.domains.find(d => d.id === ind.domainId);
                          const pct = ((avg / 3) * 100).toFixed(0);
                          const color = avg >= 2.5 ? '#059669' : avg >= 1.5 ? '#d97706' : '#dc2626';
                          return (
                            <div key={ind.code} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '.625rem .875rem', borderBottom: rank < weakComps.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                              <span style={{ fontSize: '1rem', fontWeight: 900, color: '#cbd5e1', width: '20px', textAlign: 'center', flexShrink: 0 }}>
                                {rank + 1}
                              </span>
                              <span style={{ fontFamily: 'monospace', fontSize: '.72rem', fontWeight: 700, flexShrink: 0, padding: '2px 6px', borderRadius: '6px', background: dom?.bg, color: dom?.color }}>
                                {ind.code}
                              </span>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '.82rem', color: '#1e293b', lineHeight: 1.3 }}>{ind.label}</div>
                                <div style={{ marginTop: '5px', height: '5px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden', maxWidth: '180px' }}>
                                  <div style={{ height: '100%', borderRadius: '999px', width: `${pct}%`, background: color }} />
                                </div>
                              </div>
                              <span style={{ fontSize: '.85rem', fontWeight: 700, flexShrink: 0, color }}>
                                {avg.toFixed(2)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* recommended activities */}
                    <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,.04)', overflow: 'hidden' }}>
                      <div style={{ padding: '.625rem .875rem', borderBottom: '1px solid #e2e8f0', background: '#ede9fe' }}>
                        <span style={{ fontWeight: 700, fontSize: '.85rem', color: '#4c1d95' }}>
                          ✨ กิจกรรมที่แนะนำ — เรียงตามความครอบคลุม
                        </span>
                      </div>
                      {actScores.length === 0 ? (
                        <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#94a3b8', fontSize: '.85rem' }}>ไม่พบการเชื่อมโยง</div>
                      ) : (
                        <div>
                          {actScores.map(({ act, covered }, rank) => (
                            <div key={act.id} style={{ padding: '.75rem .875rem', borderBottom: rank < actScores.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '1rem', fontWeight: 900, color: '#cbd5e1', width: '20px', textAlign: 'center', flexShrink: 0 }}>
                                  {rank + 1}
                                </span>
                                <div style={{ width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0, background: act.bg }}>
                                  {act.icon}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontWeight: 700, fontSize: '.85rem', color: act.color }}>
                                    {act.label}
                                  </div>
                                  <div style={{ fontSize: '.72rem', color: '#64748b', marginTop: '2px' }}>{act.description}</div>
                                </div>
                                <div style={{ flexShrink: 0, textAlign: 'right' }}>
                                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: act.color }}>
                                    {covered.length}
                                  </div>
                                  <div style={{ fontSize: '.68rem', color: '#94a3b8' }}>ความสามารถ</div>
                                </div>
                              </div>
                              {/* covered weak comps */}
                              <div style={{ marginTop: '8px', marginLeft: '66px', display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                {covered.map(ind => {
                                  const dom = DS.domains.find(d => d.id === ind.domainId);
                                  const avg = compAvgMap[ind.code];
                                  return (
                                    <div key={ind.code}
                                      style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '8px', fontSize: '.72rem', background: dom?.bg, color: dom?.color }}>
                                      <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{ind.code}</span>
                                      <span style={{ opacity: .7 }}>({avg?.toFixed(1)})</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            <p style={{ fontSize: '.78rem', color: '#94a3b8', textAlign: 'center', margin: 0 }}>
              ข้อมูลอ้างอิงจากหลักสูตรการศึกษาปฐมวัย พ.ศ. 2568 · รหัสความสามารถใช้ร่วมกันทั้ง อ.1–อ.3
            </p>
          </div>
        );
      })()}

    </div>
  );
}
