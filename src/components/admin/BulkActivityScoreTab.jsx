import { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { todayISO, compareStudents } from '../../utils/helpers';
import { pushClassAssessments } from '../../lib/firebaseSync';
import { INDICATORS_DATA_68 } from '../../data/indicatorsData_68';
import { SOURCE_ACTIVITY_NO } from '../../data/evaluationConstants';
import { COMPETENCY_ACTIVITY_MAP } from '../../data/competencyActivityMap';

// กรอกคะแนนกิจกรรมแบบตาราง: แถว = เด็ก, คอลัมน์ = กิจกรรม (หลักสูตร 2568)
// บันทึกลง student.assessments.indicators[indKey][actId].r1/r3 รูปแบบเดียวกับแท็บ "ประเมินพัฒนาการ"

const COLORS = {
  3: { bg: '#d1fae5', color: '#065f46', border: '#6ee7b7' },
  2: { bg: '#fef9c3', color: '#713f12', border: '#fde68a' },
  1: { bg: '#fee2e2', color: '#7f1d1d', border: '#fca5a5' },
};

// กิจกรรมทั้งหมดในหลักสูตร: no → { id, indKey, label }
const ALL_ACTS = (() => {
  const out = {};
  INDICATORS_DATA_68.forEach(d => d.standards.forEach(st => st.indicators.forEach(ind => ind.items.forEach(it => it.activities.forEach(a => {
    const id = `${d.id}__${st.id}__${ind.id}__${it.id}__${a.no}`;
    out[Number(a.no)] = { no: Number(a.no), id, indKey: `${d.id}__${st.id}__${ind.id}`, label: a.label ?? a.name ?? `กิจกรรม ${a.no}` };
  })))));
  return out;
})();

// กิจกรรมที่ระบบเติมเองได้ (ไม่ต้องกรอก)
const AUTO_NOS = new Set([...Object.entries(SOURCE_ACTIVITY_NO)
  .filter(([k]) => !['pickup', 'art', 'events'].includes(k))
  .flatMap(([, v]) => v), 1, 3].map(Number));

// กิจกรรมของความสามารถที่ "ไม่มีกิจกรรมอัตโนมัติรองรับเลย"
const MISSING_NOS = (() => {
  const s = new Set();
  Object.values(COMPETENCY_ACTIVITY_MAP ?? {}).forEach(nos => {
    if (!nos.some(n => AUTO_NOS.has(Number(n)))) nos.forEach(n => s.add(Number(n)));
  });
  return s;
})();

const PRESETS = [
  { id: 'missing', label: 'กิจกรรมของความสามารถที่ยังว่าง (13 ข้อ)', nos: () => [...MISSING_NOS] },
  { id: 'manual',  label: 'กิจกรรมที่ไม่มีระบบอัตโนมัติทั้งหมด', nos: () => Object.keys(ALL_ACTS).map(Number).filter(n => !AUTO_NOS.has(n)) },
  { id: 'all',     label: 'ทุกกิจกรรม', nos: () => Object.keys(ALL_ACTS).map(Number) },
];

export default function BulkActivityScoreTab({ teacherClassFilter }) {
  const { students, setStudents, role, user, allClassNames, addActivityLog } = useApp();
  const isTeacher = role === 'teacher';
  const lockedClass = teacherClassFilter ?? (isTeacher ? user?.className : null);

  const [selClass, setSelClass] = useState(lockedClass ?? '');
  const [term, setTerm] = useState(1);
  const [assessDate, setAssessDate] = useState(todayISO());
  const [preset, setPreset] = useState('missing');
  const [draft, setDraft] = useState({});   // { `${sid}|${no}`: 0-3 }
  const [msg, setMsg] = useState('');

  const round = term === 1 ? 1 : 3;
  const nos = useMemo(() => PRESETS.find(p => p.id === preset).nos().filter(n => ALL_ACTS[n]).sort((a, b) => a - b), [preset]);
  const rows = useMemo(
    () => students.filter(s => s.className === selClass && !String(s.name).startsWith('(ว่าง)')).sort(compareStudents),
    [students, selClass]
  );

  const stored = (s, no) => s.assessments?.indicators?.[ALL_ACTS[no].indKey]?.[ALL_ACTS[no].id]?.[`r${round}`] ?? 0;
  const val = (s, no) => {
    const k = `${s.id}|${no}`;
    return k in draft ? draft[k] : stored(s, no);
  };
  const setVal = (s, no, v) => { setDraft(p => ({ ...p, [`${s.id}|${no}`]: v })); setMsg(''); };
  const cycle = (s, no) => { const c = val(s, no); setVal(s, no, c === 0 ? 3 : c === 3 ? 2 : c === 2 ? 1 : 0); };
  const fillCol = (no, v) => {
    setDraft(p => { const n = { ...p }; rows.forEach(s => { if (!stored(s, no) || v === 0) n[`${s.id}|${no}`] = v; }); return n; });
    setMsg('');
  };
  const dirty = Object.keys(draft).filter(k => {
    const [sid, no] = k.split('|');
    const s = rows.find(r => String(r.id) === sid);
    return s && draft[k] !== stored(s, Number(no));
  });

  const save = () => {
    if (!dirty.length) return;
    const now = new Date().toISOString();
    const changes = {};
    dirty.forEach(k => { changes[k] = draft[k]; });
    const updated = students.map(s => {
      if (s.className !== selClass) return s;
      const mine = Object.entries(changes).filter(([k]) => k.split('|')[0] === String(s.id));
      if (!mine.length) return s;
      const inds = { ...(s.assessments?.indicators ?? {}) };
      mine.forEach(([k, score]) => {
        const a = ALL_ACTS[Number(k.split('|')[1])];
        const grp = { ...(inds[a.indKey] ?? {}) };
        const cur = { ...(grp[a.id] ?? {}) };
        cur[`r${round}`] = score || null;
        cur[`r${round}_date`] = score ? assessDate : null;
        const latest = [4, 3, 2, 1].map(r => cur[`r${r}`]).find(v => v) ?? null;
        if (latest) { cur.score = latest; cur.round = round; cur.date = assessDate; cur.savedAt = now; grp[a.id] = cur; }
        else delete grp[a.id];
        inds[a.indKey] = grp;
      });
      return { ...s, assessments: { ...(s.assessments ?? {}), indicators: inds } };
    });
    setStudents(updated);
    const data = {};
    updated.filter(s => s.className === selClass && s.assessments?.indicators)
      .forEach(s => { data[String(s.id)] = { indicators: s.assessments.indicators }; });
    pushClassAssessments(selClass, data).catch(() => {});
    addActivityLog?.({
      id: Date.now(), timestamp: now, date: assessDate, round, className: selClass,
      activityLabel: `กรอกตาราง ${dirty.length} ช่อง`, assessorName: user?.name ?? '',
    });
    setDraft({});
    setMsg(`✅ บันทึก ${dirty.length} ช่อง (ภาคเรียน ${term}) แล้ว`);
  };

  const pill = (active) => ({
    padding: '.35rem .8rem', borderRadius: '999px', fontSize: '.78rem', cursor: 'pointer', fontFamily: 'inherit',
    border: `1px solid ${active ? '#4f46e5' : '#e5e7eb'}`, background: active ? '#4f46e5' : '#fff',
    color: active ? '#fff' : '#374151', fontWeight: active ? 700 : 400,
  });
  const field = { padding: '.35rem .5rem', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '.82rem', fontFamily: 'inherit' };

  return (
    <div style={{ padding: '1rem' }}>
      <h2 style={{ margin: '0 0 .25rem', fontSize: '1.1rem', color: '#111827' }}>📝 กรอกคะแนนกิจกรรมแบบตาราง</h2>
      <p style={{ margin: '0 0 .8rem', fontSize: '.78rem', color: '#6b7280' }}>
        แตะช่องเพื่อเปลี่ยนคะแนน (ว่าง → 3 → 2 → 1 → ว่าง) · ปุ่ม "ทั้งห้อง=3" เติมเฉพาะช่องที่ยังว่าง · ช่องว่างจะไม่ถูกบันทึก
      </p>

      <div style={{ display: 'flex', gap: '.6rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '.7rem' }}>
        {lockedClass
          ? <span style={{ ...field, background: '#ede9fe', color: '#6366f1', fontWeight: 700 }}>{lockedClass}</span>
          : (
            <select value={selClass} onChange={e => { setSelClass(e.target.value); setDraft({}); }} style={field}>
              <option value="">— เลือกห้อง —</option>
              {(allClassNames ?? []).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
        <select value={term} onChange={e => { setTerm(Number(e.target.value)); setDraft({}); }} style={field}>
          <option value={1}>ภาคเรียนที่ 1</option>
          <option value={2}>ภาคเรียนที่ 2</option>
        </select>
        <label style={{ fontSize: '.78rem', color: '#374151' }}>วันที่ประเมิน{' '}
          <input type="date" value={assessDate} onChange={e => setAssessDate(e.target.value)} style={field} />
        </label>
      </div>

      <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap', marginBottom: '.8rem' }}>
        {PRESETS.map(p => (
          <button key={p.id} type="button" onClick={() => setPreset(p.id)} style={pill(preset === p.id)}>{p.label}</button>
        ))}
      </div>

      {!selClass ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>เลือกห้องเพื่อเริ่มกรอกคะแนน</div>
      ) : (
        <>
          <div style={{ overflow: 'auto', maxHeight: '65vh', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
            <table style={{ borderCollapse: 'separate', borderSpacing: 0, fontSize: '.78rem', minWidth: '100%' }}>
              <thead>
                <tr>
                  <th style={{ position: 'sticky', left: 0, top: 0, zIndex: 3, background: '#f9fafb', padding: '.4rem .6rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb', minWidth: '170px' }}>
                    นักเรียน ({rows.length})
                  </th>
                  {nos.map(n => (
                    <th key={n} title={ALL_ACTS[n].label}
                      style={{ position: 'sticky', top: 0, zIndex: 2, background: '#f9fafb', padding: '.3rem .35rem', borderBottom: '1px solid #e5e7eb', minWidth: '84px', maxWidth: '110px', verticalAlign: 'top' }}>
                      <div style={{ fontWeight: 700, color: '#4f46e5' }}>#{n}</div>
                      <div style={{ fontWeight: 400, color: '#6b7280', fontSize: '.68rem', lineHeight: 1.2, maxHeight: '3.6em', overflow: 'hidden' }}>{ALL_ACTS[n].label}</div>
                      <button type="button" onClick={() => fillCol(n, 3)}
                        style={{ marginTop: '.2rem', fontSize: '.66rem', padding: '.1rem .35rem', border: '1px solid #6ee7b7', background: '#ecfdf5', color: '#065f46', borderRadius: '4px', cursor: 'pointer', fontFamily: 'inherit' }}>
                        ทั้งห้อง=3
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(s => (
                  <tr key={s.id}>
                    <td style={{ position: 'sticky', left: 0, zIndex: 1, background: '#fff', padding: '.3rem .6rem', borderBottom: '1px solid #f3f4f6', whiteSpace: 'nowrap' }}>{s.name}</td>
                    {nos.map(n => {
                      const v = val(s, n);
                      const c = COLORS[v];
                      const changed = `${s.id}|${n}` in draft && draft[`${s.id}|${n}`] !== stored(s, n);
                      return (
                        <td key={n} style={{ padding: '.15rem', borderBottom: '1px solid #f3f4f6', textAlign: 'center' }}>
                          <button type="button" onClick={() => cycle(s, n)}
                            style={{
                              width: '100%', minHeight: '28px', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700,
                              border: `1px ${changed ? 'dashed' : 'solid'} ${c ? c.border : '#e5e7eb'}`,
                              background: c ? c.bg : '#fff', color: c ? c.color : '#d1d5db',
                            }}>
                            {v || '·'}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', gap: '.7rem', alignItems: 'center', marginTop: '.8rem', flexWrap: 'wrap' }}>
            <button type="button" onClick={save} disabled={!dirty.length}
              style={{ padding: '.5rem 1.2rem', borderRadius: '8px', border: 'none', fontWeight: 700, fontFamily: 'inherit',
                cursor: dirty.length ? 'pointer' : 'default', background: dirty.length ? '#4f46e5' : '#e5e7eb', color: dirty.length ? '#fff' : '#9ca3af' }}>
              💾 บันทึก ({dirty.length} ช่อง)
            </button>
            {dirty.length > 0 && (
              <button type="button" onClick={() => setDraft({})}
                style={{ padding: '.5rem 1rem', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>
                ยกเลิกการแก้ไข
              </button>
            )}
            {msg && <span style={{ fontSize: '.82rem', color: '#059669' }}>{msg}</span>}
          </div>
        </>
      )}
    </div>
  );
}
