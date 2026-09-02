// AbilityAssessmentTab.jsx
// ประเมินความสามารถผู้เรียน — หลักสูตรการศึกษาปฐมวัย พุทธศักราช 2560
// 4 ด้าน · 23 ตัวบ่งชี้ · 3 ระดับคุณภาพ (ดี / พอใช้ / ควรส่งเสริม)

import { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  SCALE_C60, DOMAINS_C60, INDICATORS_C60,
  getIndicatorsByDomain, LEVEL_TO_KEY, calcAvgScore,
} from '../../data/indicatorsData_curriculum60';

const TODAY = new Date().toISOString().slice(0, 10);

// ──────────────────────────────────────────────────────────────────────────────
// helpers
// ──────────────────────────────────────────────────────────────────────────────
function recKey(sid, year, term) { return `${sid}||${year}||${term}`; }

function ScoreBadge({ score, onClick }) {
  const meta = SCALE_C60[score];
  if (!meta) {
    return (
      <button
        onClick={onClick}
        className="px-2 py-0.5 rounded text-xs border border-dashed border-gray-300 text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-all"
        title="คลิกเพื่อให้คะแนน"
      >—</button>
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

function ScorePicker({ onPick }) {
  return (
    <div className="flex gap-1">
      {[3, 2, 1].map(s => (
        <button
          key={s}
          onClick={() => onPick(s)}
          style={{ background: SCALE_C60[s].bg, color: SCALE_C60[s].color, borderColor: SCALE_C60[s].border }}
          className="px-2 py-0.5 rounded text-xs font-semibold border hover:opacity-80"
        >{s} {SCALE_C60[s].label}</button>
      ))}
      <button
        onClick={() => onPick(0)}
        className="px-2 py-0.5 rounded text-xs border border-gray-300 text-gray-400 hover:bg-gray-100"
      >ล้าง</button>
    </div>
  );
}

// AvgBar — bar แสดง avg score 0–3
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

  const isTeacher   = role === 'teacher';
  const myClass     = teacherClassFilter ?? (isTeacher ? user?.className : null);

  // ─── filters ────────────────────────────────────────────────────────────────
  const [selYear,  setSelYear]  = useState(academicYear);
  const [selTerm,  setSelTerm]  = useState(currentTerm ?? '1');
  const [selClass, setSelClass] = useState(myClass ?? '');
  const [activeDomain, setActiveDomain] = useState('d1');

  // active picker { studentId, code }
  const [picker, setPicker] = useState(null);

  // ─── derived ─────────────────────────────────────────────────────────────────
  const classStudents = useMemo(
    () => students.filter(s => s.className === selClass && s.status !== 'inactive')
                  .sort((a, b) => (a.studentCode ?? a.name).localeCompare(b.studentCode ?? b.name, 'th')),
    [students, selClass]
  );

  // หา level key จากชื่อห้อง (อนุบาล 1/2/3)
  const levelKey = useMemo(() => {
    if (!selClass) return 'k2';
    const lv = Object.keys(LEVEL_TO_KEY).find(k => selClass.includes(k));
    return lv ? LEVEL_TO_KEY[lv] : 'k2';
  }, [selClass]);

  const domainIndicators = useMemo(
    () => getIndicatorsByDomain(activeDomain),
    [activeDomain]
  );

  // ─── getter / setter ──────────────────────────────────────────────────────
  function getScore(sid, code) {
    const k = recKey(sid, selYear, selTerm);
    return abilityAssessments?.[k]?.[code] ?? 0;
  }

  function setScore(sid, code, score) {
    const k = recKey(sid, selYear, selTerm);
    setAbilityAssessments(prev => ({
      ...prev,
      [k]: {
        ...(prev[k] ?? {}),
        [code]: score || undefined,   // 0 = ล้าง → undefined
        _assessDate: TODAY,
        _assessBy: user?.name ?? '',
      },
    }));
    setPicker(null);
    addActivityLog?.(`ให้คะแนน ${code} นักเรียน ${students.find(s=>s.id===sid)?.name ?? sid} = ${score || 'ล้าง'}`);
  }

  // ─── summary ─────────────────────────────────────────────────────────────
  const summaryRows = useMemo(() => classStudents.map(s => {
    const k = recKey(s.id, selYear, selTerm);
    const rec = abilityAssessments?.[k] ?? {};
    const scores = Object.fromEntries(
      INDICATORS_C60.map(i => [i.code, rec[i.code] ?? 0])
    );
    return { ...s, scores, avg: calcAvgScore(scores) };
  }), [classStudents, abilityAssessments, selYear, selTerm]);

  const domainAvgs = useMemo(() => {
    const result = {};
    DOMAINS_C60.forEach(d => {
      const inds = getIndicatorsByDomain(d.id);
      const vals = summaryRows.flatMap(r => inds.map(i => r.scores[i.code])).filter(v => v > 0);
      result[d.id] = vals.length ? vals.reduce((a,b)=>a+b,0)/vals.length : 0;
    });
    return result;
  }, [summaryRows]);

  // ─── view mode: 'input' | 'summary' ────────────────────────────────────────
  const [viewMode, setViewMode] = useState('input');

  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-800">📊 ประเมินความสามารถผู้เรียน</h2>
          <p className="text-xs text-gray-500 mt-0.5">หลักสูตรการศึกษาปฐมวัย พ.ศ. 2560 · 4 ด้าน 23 ตัวบ่งชี้</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('input')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${viewMode==='input' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >✏️ บันทึก</button>
          <button
            onClick={() => setViewMode('summary')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${viewMode==='summary' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >📈 สรุปผล</button>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
        {/* ปีการศึกษา */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 font-medium">ปีการศึกษา</label>
          <input
            type="text"
            value={selYear}
            onChange={e => setSelYear(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm w-24"
          />
        </div>
        {/* ภาคเรียน */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 font-medium">ภาคเรียน</label>
          <select value={selTerm} onChange={e => setSelTerm(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm">
            <option value="1">ภาคเรียนที่ 1</option>
            <option value="2">ภาคเรียนที่ 2</option>
          </select>
        </div>
        {/* ห้องเรียน */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 font-medium">ห้องเรียน</label>
          {isTeacher ? (
            <span className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 text-sm font-medium">{myClass}</span>
          ) : (
            <select value={selClass} onChange={e => setSelClass(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm">
              <option value="">— เลือกห้อง —</option>
              {(allClassNames ?? []).sort().map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}
        </div>

        {/* ระดับ (auto) */}
        {selClass && (
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 font-medium">ระดับ</label>
            <span className="px-3 py-1.5 rounded-lg bg-gray-50 text-gray-600 text-sm">
              {Object.keys(LEVEL_TO_KEY).find(k => selClass.includes(k)) ?? selClass}
            </span>
          </div>
        )}
      </div>

      {!selClass && (
        <div className="text-center py-10 text-gray-400 text-sm">
          กรุณาเลือกห้องเรียนเพื่อเริ่มประเมิน
        </div>
      )}

      {selClass && classStudents.length === 0 && (
        <div className="text-center py-10 text-gray-400 text-sm">
          ไม่พบนักเรียนในห้อง {selClass}
        </div>
      )}

      {/* ══════════ VIEW: INPUT ════════════ */}
      {selClass && classStudents.length > 0 && viewMode === 'input' && (
        <div className="space-y-4">

          {/* Domain tabs */}
          <div className="flex flex-wrap gap-2">
            {DOMAINS_C60.map(d => (
              <button
                key={d.id}
                onClick={() => { setActiveDomain(d.id); setPicker(null); }}
                style={activeDomain === d.id
                  ? { background: d.bg, color: d.color, borderColor: d.border }
                  : { background: '#f9fafb', color: '#6b7280', borderColor: '#e5e7eb' }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm font-medium transition-all"
              >
                <span>{d.icon}</span>
                <span className={`${activeDomain === d.id ? 'font-semibold' : ''}`}>{d.label}</span>
                {domainAvgs[d.id] > 0 && (
                  <span className="ml-1 text-xs opacity-70">{domainAvgs[d.id].toFixed(1)}</span>
                )}
              </button>
            ))}
          </div>

          {/* Assessment table */}
          {(() => {
            const domain = DOMAINS_C60.find(d => d.id === activeDomain);
            return (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
                <div className="p-3 border-b border-gray-50"
                  style={{ background: domain.bg }}>
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
                    {/* level descriptor row */}
                    <tr className="border-b border-gray-100 bg-blue-50/40">
                      <td colSpan={2} className="px-3 py-1 text-[10px] text-blue-600 font-medium">
                        เกณฑ์ระดับ: {Object.keys(LEVEL_TO_KEY).find(k => selClass.includes(k)) ?? '—'}
                      </td>
                      {domainIndicators.map(ind => (
                        <td key={ind.code} className="px-2 py-1 text-[10px] text-blue-500 text-center leading-tight">
                          {ind.levelDescriptors?.[levelKey] ?? '—'}
                        </td>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {classStudents.map((s, idx) => (
                      <>
                        <tr key={s.id}
                          className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                          <td className="px-3 py-2 text-gray-400 text-xs">{idx+1}</td>
                          <td className="px-3 py-2">
                            <div className="font-medium text-gray-800 text-sm">{s.name}</div>
                            <div className="text-xs text-gray-400">{s.studentCode ?? ''}</div>
                          </td>
                          {domainIndicators.map(ind => (
                            <td key={ind.code} className="px-2 py-2 text-center">
                              {picker?.sid === s.id && picker?.code === ind.code ? (
                                <ScorePicker onPick={v => setScore(s.id, ind.code, v)} />
                              ) : (
                                <ScoreBadge
                                  score={getScore(s.id, ind.code)}
                                  onClick={() => setPicker({ sid: s.id, code: ind.code })}
                                />
                              )}
                            </td>
                          ))}
                        </tr>
                      </>
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
            {DOMAINS_C60.map(d => {
              const avg = domainAvgs[d.id];
              const meta = SCALE_C60[avg >= 2.5 ? 3 : avg >= 1.5 ? 2 : avg > 0 ? 1 : 0];
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
              <span className="font-semibold text-sm text-gray-700">สรุปผลรายนักเรียน — {selClass} ปีการศึกษา {selYear} ภาคเรียน {selTerm}</span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-3 py-2 text-gray-500 font-medium w-8">#</th>
                  <th className="text-left px-3 py-2 text-gray-500 font-medium">ชื่อ-สกุล</th>
                  {DOMAINS_C60.map(d => (
                    <th key={d.id} className="px-3 py-2 text-center text-gray-500 font-medium text-xs">
                      {d.icon} {d.label.replace('ด้าน','')}
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
                      <td className="px-3 py-2 text-gray-400 text-xs">{idx+1}</td>
                      <td className="px-3 py-2">
                        <div className="font-medium text-gray-800">{s.name}</div>
                        <div className="text-xs text-gray-400">{s.studentCode ?? ''}</div>
                      </td>
                      {DOMAINS_C60.map(d => {
                        const inds = getIndicatorsByDomain(d.id);
                        const vals = inds.map(i => s.scores[i.code]).filter(v => v > 0);
                        const avg = vals.length ? vals.reduce((a,b)=>a+b,0)/vals.length : 0;
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
              <span className="font-semibold text-sm text-gray-700">เฉลี่ยตามตัวบ่งชี้ — ทั้งห้อง</span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-3 py-2 text-gray-500 font-medium">รหัส</th>
                  <th className="text-left px-3 py-2 text-gray-500 font-medium">ตัวบ่งชี้</th>
                  <th className="px-3 py-2 text-center text-gray-500 font-medium">เฉลี่ย</th>
                  <th className="px-3 py-2 text-center text-gray-500 font-medium">ดี</th>
                  <th className="px-3 py-2 text-center text-gray-500 font-medium">พอใช้</th>
                  <th className="px-3 py-2 text-center text-gray-500 font-medium">ควรส่งเสริม</th>
                </tr>
              </thead>
              <tbody>
                {INDICATORS_C60.map(ind => {
                  const vals = summaryRows.map(r => r.scores[ind.code]).filter(v => v > 0);
                  const avg = vals.length ? vals.reduce((a,b)=>a+b,0)/vals.length : 0;
                  const c3 = summaryRows.filter(r => r.scores[ind.code] === 3).length;
                  const c2 = summaryRows.filter(r => r.scores[ind.code] === 2).length;
                  const c1 = summaryRows.filter(r => r.scores[ind.code] === 1).length;
                  const dom = DOMAINS_C60.find(d => d.id === ind.domainId);
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

    </div>
  );
}
