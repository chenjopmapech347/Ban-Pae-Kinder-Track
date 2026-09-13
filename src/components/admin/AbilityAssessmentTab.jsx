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
    subtitle: '4 ด้าน 15 ความสามารถ (อ.3)',
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
        style={{ background: def.bg, color: def.color, borderColor: def.border, opacity: 0.55 }}
        className="px-2 py-0.5 rounded text-xs font-semibold border transition-all hover:opacity-100"
        title="ยังไม่ได้ให้คะแนน (default = 3 ดี) — คลิกเพื่อเปลี่ยน"
      >3 {def.label}</button>
    );
  }
  return (
    <button
      onClick={onClick}
      style={{ background: meta.bg, color: meta.color, borderColor: meta.border }}
      className="px-2 py-0.5 rounded text-xs font-semibold border transition-all hover:opacity-80"
      title={`${meta.label} — คลิกเพื่อเปลี่ยน`}
    >{score} {meta.label}</button>
  );
}

function ScorePicker({ onPick, scale }) {
  return (
    <div className="flex gap-1">
      {[3, 2, 1].map(s => (
        <button
          key={s}
          onClick={() => onPick(s)}
          style={{ background: scale[s].bg, color: scale[s].color, borderColor: scale[s].border }}
          className="px-2 py-0.5 rounded text-xs font-semibold border hover:opacity-80"
        >{s} {scale[s].label}</button>
      ))}
      <button
        onClick={() => onPick(0)}
        className="px-2 py-0.5 rounded text-xs border border-gray-300 text-gray-400 hover:bg-gray-100"
      >ล้าง</button>
    </div>
  );
}

function AvgBar({ avg }) {
  if (!avg) return <span className="text-gray-300 text-xs">—</span>;
  const pct = ((avg - 1) / 2) * 100;
  const color = avg >= 2.5 ? '#059669' : avg >= 1.5 ? '#d97706' : '#dc2626';
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div style={{ width: `${pct}%`, background: color }} className="h-full rounded-full transition-all" />
      </div>
      <span className="text-xs font-semibold" style={{ color }}>{avg.toFixed(2)}</span>
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
    <div className="space-y-4">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">ประเมินความสามารถผู้เรียน</h2>
          <p className="text-xs text-gray-400 mt-0.5">{DS.label} · {DS.subtitle}</p>
        </div>
        {/* View mode toggle — pill group */}
        <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-0.5">
          {[
            { key: 'input',   icon: '✏️', label: 'บันทึก' },
            { key: 'summary', icon: '📈', label: 'สรุปผล' },
            { key: 'student', icon: '👤', label: 'รายคน' },
          ].map(m => (
            <button key={m.key}
              onClick={() => setViewMode(m.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === m.key
                  ? 'bg-white text-indigo-700 shadow-sm font-semibold'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span>{m.icon}</span>
              <span>{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

        {/* แถว 1: เลือกชุดตัวบ่งชี้ */}
        <div className="px-5 pt-4 pb-3 border-b border-gray-50">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2.5">ชุดตัวบ่งชี้</p>
          <div className="flex gap-3">
            {/* ── ปุ่ม C60 ── */}
            {(() => {
              const active = datasetKey === 'c60';
              return (
                <button
                  onClick={() => switchDataset('c60')}
                  className={`relative flex items-center gap-3 px-5 py-3 rounded-2xl border-2 transition-all text-left ${
                    active
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200'
                      : 'bg-gray-50 border-gray-100 text-gray-600 hover:border-indigo-300 hover:bg-indigo-50'
                  }`}
                >
                  <span className="text-2xl leading-none">📘</span>
                  <div>
                    <div className={`text-sm font-bold leading-tight ${active ? 'text-white' : 'text-gray-800'}`}>
                      หลักสูตร 2560
                    </div>
                    <div className={`text-[11px] mt-0.5 ${active ? 'text-indigo-200' : 'text-gray-400'}`}>
                      4 ด้าน 23 ตัวบ่งชี้
                    </div>
                  </div>
                  {active && <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-white opacity-80" />}
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
                  className={`relative flex items-center gap-3 px-5 py-3 rounded-2xl border-2 transition-all text-left ${
                    active
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200'
                      : 'bg-gray-50 border-gray-100 text-gray-600 hover:border-indigo-300 hover:bg-indigo-50'
                  }`}
                >
                  <span className="text-2xl leading-none">📗</span>
                  <div>
                    <div className={`text-sm font-bold leading-tight ${active ? 'text-white' : 'text-gray-800'}`}>
                      หลักสูตร 2568
                    </div>
                    <div className={`text-[11px] mt-0.5 ${active ? 'text-indigo-200' : 'text-gray-400'}`}>
                      4 ด้าน 33 ความสามารถ
                    </div>
                  </div>
                  {/* badge แสดงระดับ auto-detected */}
                  <span className={`ml-auto text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    active ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-600'
                  }`}>
                    {level}
                  </span>
                  {active && <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-white opacity-80" />}
                </button>
              );
            })()}
          </div>
        </div>

        {/* แถว 2: ตัวกรอง */}
        <div className="px-5 py-3 flex flex-wrap items-end gap-4">
          {/* ปีการศึกษา */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">ปีการศึกษา</label>
            <input
              type="text"
              value={selYear}
              onChange={e => setSelYear(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 text-sm w-24 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none"
            />
          </div>

          <div className="w-px h-8 bg-gray-100" />

          {/* ภาคเรียน */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">ภาคเรียน</label>
            <select value={selTerm} onChange={e => setSelTerm(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none">
              <option value="1">ภาคเรียนที่ 1</option>
              <option value="2">ภาคเรียนที่ 2</option>
            </select>
          </div>

          <div className="w-px h-8 bg-gray-100" />

          {/* ห้องเรียน */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">ห้องเรียน</label>
            {isTeacher ? (
              <span className="px-3 py-2 rounded-xl bg-indigo-50 text-indigo-700 text-sm font-semibold border border-indigo-100">{myClass}</span>
            ) : (
              <select value={selClass} onChange={e => setSelClass(e.target.value)}
                className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none">
                <option value="">— เลือกห้อง —</option>
                {(allClassNames ?? []).sort().map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            )}
          </div>

          {/* ระดับ (C60) */}
          {selClass && DS.allLevels && (
            <>
              <div className="w-px h-8 bg-gray-100" />
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">ระดับ</label>
                <span className="px-3 py-2 rounded-xl bg-gray-50 text-gray-600 text-sm border border-gray-100">
                  {Object.keys(LEVEL_TO_KEY).find(k => selClass.includes(k)) ?? selClass}
                </span>
              </div>
            </>
          )}

          {/* คำเตือน C68 ถ้าห้องไม่ใช่ อ.3 */}
          {selClass && !DS.allLevels && !selClass.includes('3') && (
            <span className="px-3 py-2 rounded-xl bg-amber-50 text-amber-700 text-xs font-medium border border-amber-200 self-end">
              ⚠️ ชุดนี้ออกแบบสำหรับ อ.3 เท่านั้น
            </span>
          )}
        </div>
      </div>

      {!selClass && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-4xl mb-3">🏫</div>
          <p className="text-gray-500 font-medium">กรุณาเลือกห้องเรียน</p>
          <p className="text-gray-400 text-sm mt-1">เพื่อเริ่มบันทึกการประเมิน</p>
        </div>
      )}

      {selClass && classStudents.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-4xl mb-3">👥</div>
          <p className="text-gray-500 font-medium">ไม่พบนักเรียนในห้อง {selClass}</p>
          <p className="text-gray-400 text-sm mt-1">กรุณาตรวจสอบข้อมูลนักเรียน</p>
        </div>
      )}

      {/* ══════════ VIEW: INPUT ════════════ */}
      {selClass && classStudents.length > 0 && viewMode === 'input' && (
        <div className="space-y-4">

          {/* Domain tabs */}
          <div className="flex flex-wrap gap-2">
            {DS.domains.map(d => {
              const active = activeDomain === d.id;
              const avg = domainAvgs[d.id];
              return (
                <button
                  key={d.id}
                  onClick={() => { setActiveDomain(d.id); setPicker(null); }}
                  style={active
                    ? { background: d.bg, color: d.color, borderColor: d.border, boxShadow: `0 2px 8px ${d.border}55` }
                    : { background: '#fff', color: '#6b7280', borderColor: '#e5e7eb' }}
                  className="flex items-center gap-2 px-4 py-2 rounded-2xl border-2 text-sm transition-all"
                >
                  <span className="text-base leading-none">{d.icon}</span>
                  <span className={`font-medium ${active ? 'font-semibold' : ''}`}>{d.label}</span>
                  {avg > 0 && (
                    <span
                      className="text-[11px] px-1.5 py-0.5 rounded-full font-bold"
                      style={active
                        ? { background: d.border + '33', color: d.color }
                        : { background: '#f3f4f6', color: '#9ca3af' }}
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
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
                <div className="p-3 border-b border-gray-50" style={{ background: domain.bg }}>
                  <span style={{ color: domain.color }} className="font-semibold text-sm">
                    {domain.icon} {domain.label}
                  </span>
                </div>
                <table className="w-full text-sm min-w-[700px]">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-3 py-2 text-gray-500 font-medium w-8">#</th>
                      <th className="text-left px-3 py-2 text-gray-500 font-medium min-w-[140px]">ชื่อ-สกุล</th>
                      {domainIndicators.map(ind => (
                        <th key={ind.code} className="px-2 py-2 text-center text-gray-500 font-medium min-w-[110px]">
                          <div className="text-xs font-bold text-gray-700">{ind.code}</div>
                          <div className="text-[10px] text-gray-400 leading-tight max-w-[100px] mx-auto">
                            {ind.label}
                          </div>
                        </th>
                      ))}
                    </tr>
                    {/* descriptor row */}
                    <tr className="border-b border-gray-100 bg-blue-50/40">
                      <td colSpan={2} className="px-3 py-1 text-[10px] text-blue-600 font-medium">
                        {DS.descriptorLabel(selClass)}
                      </td>
                      {domainIndicators.map(ind => (
                        <td key={ind.code} className="px-2 py-1 text-[10px] text-blue-500 text-center leading-tight">
                          {DS.descriptorRow(ind, levelKey)}
                        </td>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {classStudents.map((s, idx) => (
                      <tr key={s.id}
                        className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-3 py-2 text-gray-400 text-xs">{idx + 1}</td>
                        <td className="px-3 py-2">
                          <div className="font-medium text-gray-800 text-sm">{s.name}</div>
                          <div className="text-xs text-gray-400">{s.studentCode ?? ''}</div>
                        </td>
                        {domainIndicators.map(ind => (
                          <td key={ind.code} className="px-2 py-2 text-center">
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

          <p className="text-xs text-gray-400 text-center">
            คลิกที่ช่องคะแนนเพื่อให้คะแนน · ข้อมูลบันทึกอัตโนมัติทันที
          </p>
        </div>
      )}

      {/* ══════════ VIEW: SUMMARY ════════════ */}
      {selClass && classStudents.length > 0 && viewMode === 'summary' && (
        <div className="space-y-4">

          {/* domain avg cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {DS.domains.map(d => {
              const avg = domainAvgs[d.id];
              const meta = DS.scale[avg >= 2.5 ? 3 : avg >= 1.5 ? 2 : avg > 0 ? 1 : 0];
              return (
                <div key={d.id}
                  style={{ background: d.bg, borderColor: d.border }}
                  className="rounded-2xl border p-4 flex flex-col gap-2">
                  <div className="text-lg">{d.icon}</div>
                  <div style={{ color: d.color }} className="text-sm font-semibold leading-tight">{d.label}</div>
                  <div className="text-2xl font-bold" style={{ color: d.color }}>
                    {avg ? avg.toFixed(2) : '—'}
                  </div>
                  {meta && <div className="text-xs" style={{ color: meta.color }}>{meta.label}</div>}
                </div>
              );
            })}
          </div>

          {/* student summary table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
            <div className="p-3 border-b border-gray-100 bg-gray-50">
              <span className="font-semibold text-sm text-gray-700">
                สรุปผลรายนักเรียน — {selClass} ปีการศึกษา {selYear} ภาคเรียน {selTerm}
                <span className="ml-2 text-xs text-indigo-600 font-normal">({DS.label})</span>
              </span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-3 py-2 text-gray-500 font-medium w-8">#</th>
                  <th className="text-left px-3 py-2 text-gray-500 font-medium">ชื่อ-สกุล</th>
                  {DS.domains.map(d => (
                    <th key={d.id} className="px-3 py-2 text-center text-gray-500 font-medium text-xs">
                      {d.icon} {d.label.replace('ด้าน', '')}
                    </th>
                  ))}
                  <th className="px-3 py-2 text-center text-gray-500 font-medium text-xs">เฉลี่ยรวม</th>
                  <th className="px-3 py-2 text-center text-gray-500 font-medium text-xs">ระดับ</th>
                </tr>
              </thead>
              <tbody>
                {summaryRows.map((s, idx) => {
                  const label = s.avg >= 2.5 ? 'ดี' : s.avg >= 1.5 ? 'พอใช้' : s.avg > 0 ? 'ควรส่งเสริม' : '—';
                  const color = s.avg >= 2.5 ? '#059669' : s.avg >= 1.5 ? '#d97706' : s.avg > 0 ? '#dc2626' : '#9ca3af';
                  return (
                    <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-3 py-2 text-gray-400 text-xs">{idx + 1}</td>
                      <td className="px-3 py-2">
                        <div className="font-medium text-gray-800">{s.name}</div>
                        <div className="text-xs text-gray-400">{s.studentCode ?? ''}</div>
                      </td>
                      {DS.domains.map(d => {
                        const inds = DS.getByDomain(d.id);
                        const vals = inds.map(i => s.scores[i.code]).filter(v => v > 0);
                        const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
                        return (
                          <td key={d.id} className="px-3 py-2 text-center">
                            <AvgBar avg={avg} />
                          </td>
                        );
                      })}
                      <td className="px-3 py-2 text-center">
                        <span className="font-bold" style={{ color }}>
                          {s.avg ? s.avg.toFixed(2) : '—'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className="text-xs font-semibold" style={{ color }}>{label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* indicator-level detail */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
            <div className="p-3 border-b border-gray-100 bg-gray-50">
              <span className="font-semibold text-sm text-gray-700">เฉลี่ยตามตัวบ่งชี้/ความสามารถ — ทั้งห้อง</span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-3 py-2 text-gray-500 font-medium">รหัส</th>
                  <th className="text-left px-3 py-2 text-gray-500 font-medium">ตัวบ่งชี้ / ความสามารถ</th>
                  <th className="px-3 py-2 text-center text-gray-500 font-medium">เฉลี่ย</th>
                  <th className="px-3 py-2 text-center text-gray-500 font-medium">ดี</th>
                  <th className="px-3 py-2 text-center text-gray-500 font-medium">พอใช้</th>
                  <th className="px-3 py-2 text-center text-gray-500 font-medium">ควรส่งเสริม</th>
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
                    <tr key={ind.code} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-3 py-2">
                        <span className="font-mono text-xs font-bold" style={{ color: dom?.color }}>{ind.code}</span>
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-700">{ind.label}</td>
                      <td className="px-3 py-2 text-center"><AvgBar avg={avg} /></td>
                      <td className="px-3 py-2 text-center text-xs font-semibold text-emerald-700">{c3 || '—'}</td>
                      <td className="px-3 py-2 text-center text-xs font-semibold text-amber-600">{c2 || '—'}</td>
                      <td className="px-3 py-2 text-center text-xs font-semibold text-red-600">{c1 || '—'}</td>
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
          <div className="space-y-4">
            {/* student picker */}
            <div className="flex flex-wrap items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <label className="text-xs text-gray-500 font-medium">นักเรียน</label>
              <select
                value={stu.id}
                onChange={e => setSelStudentId(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm flex-1 max-w-xs"
              >
                {classStudents.map(s => (
                  <option key={s.id} value={s.id}>{s.studentCode ? `${s.studentCode} ` : ''}{s.name}</option>
                ))}
              </select>
              {overall > 0 && (
                <span className="text-sm font-bold" style={{ color: overallColor }}>
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
                <div key={d.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  {/* domain header */}
                  <div className="flex items-center justify-between px-4 py-3"
                    style={{ background: d.bg, borderBottomColor: d.border, borderBottomWidth: 1 }}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{d.icon}</span>
                      <span className="font-semibold text-sm" style={{ color: d.color }}>{d.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {dAvg > 0 && <AvgBar avg={dAvg} />}
                      {dVals.length > 0 && (
                        <span className="text-xs" style={{ color: d.color }}>
                          ผ่าน {passed}/{items.length}
                        </span>
                      )}
                    </div>
                  </div>
                  {/* items */}
                  <div className="divide-y divide-gray-50">
                    {items.map(ind => {
                      const sc = stuScores[ind.code];
                      const meta = DS.scale[sc];
                      const passed = sc >= 2;
                      return (
                        <div key={ind.code} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                          {/* pass/fail indicator */}
                          <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                            sc === 0 ? 'bg-gray-100 text-gray-300' :
                            passed ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-500'
                          }`}>
                            {sc === 0 ? '—' : passed ? '✓' : '✗'}
                          </div>
                          {/* code + label */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2">
                              <span className="font-mono text-xs font-bold" style={{ color: d.color }}>{ind.code}</span>
                              <span className="text-sm text-gray-800">{ind.label}</span>
                            </div>
                            {DS.descriptorRow(ind, levelKey) !== '—' && (
                              <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">
                                {DS.descriptorRow(ind, levelKey)}
                              </p>
                            )}
                          </div>
                          {/* score badge + picker */}
                          <div className="shrink-0">
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

            <p className="text-xs text-gray-400 text-center">
              ✓ = ผ่าน (คะแนน ≥ 2) · ✗ = ยังไม่ผ่าน (คะแนน 1) · คลิกที่คะแนนเพื่อเปลี่ยน
            </p>
          </div>
        );
      })()}

    </div>
  );
}
