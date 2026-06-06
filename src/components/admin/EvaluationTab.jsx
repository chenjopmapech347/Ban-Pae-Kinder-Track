import { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';

// ── constants ────────────────────────────────────────────────────────────────
const LEVEL_META = [
  { level: 'K1', label: 'อนุบาล 1', emoji: '🟢', color: '#059669', bg: '#ecfdf5' },
  { level: 'K2', label: 'อนุบาล 2', emoji: '🟡', color: '#b45309', bg: '#fffbeb' },
  { level: 'K3', label: 'อนุบาล 3', emoji: '🔵', color: '#2563eb', bg: '#eff6ff' },
];
const CLASS_MAP = {
  K1: ['อ.1/1', 'อ.1/2'],
  K2: ['อ.2/1', 'อ.2/2'],
  K3: ['อ.3/1', 'อ.3/2', 'อ.3/3'],
};

const SCORES = [
  { value: 3, label: 'ดีมาก',        short: '3', color: '#059669', bg: '#d1fae5', icon: '🟢' },
  { value: 2, label: 'พอใช้',         short: '2', color: '#b45309', bg: '#fef3c7', icon: '🟡' },
  { value: 1, label: 'ต้องพัฒนา',    short: '1', color: '#dc2626', bg: '#fee2e2', icon: '🔴' },
];

function todayISO() { return new Date().toISOString().split('T')[0]; }
function thaiDate(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${Number(y) + 543}`;
}

// ── Step indicator ────────────────────────────────────────────────────────────
function StepBadge({ n, label, active, done }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
      <div style={{
        width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '.72rem', fontWeight: 800,
        background: done ? '#059669' : active ? '#7c3aed' : '#e5e7eb',
        color: done || active ? 'white' : '#9ca3af',
      }}>{done ? '✓' : n}</div>
      <span style={{ fontSize: '.78rem', fontWeight: 700, color: active ? '#7c3aed' : done ? '#059669' : '#9ca3af' }}>
        {label}
      </span>
    </div>
  );
}

// ── Pill selector ─────────────────────────────────────────────────────────────
function PillGroup({ items, selected, onSelect, color = '#7c3aed', bg = '#f5f3ff', getKey, getLabel, getCount }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem' }}>
      {items.map(item => {
        const k = getKey(item);
        const active = selected === k;
        const cnt = getCount?.(item);
        return (
          <div key={k} onClick={() => onSelect(k)} style={{
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '.35rem',
            background: active ? bg : '#f9fafb',
            border: `2px solid ${active ? color : '#e5e7eb'}`,
            borderRadius: '10px', padding: '.28rem .7rem',
            fontWeight: 700, fontSize: '.82rem',
            color: active ? color : '#6b7280',
            transition: 'all .15s',
          }}>
            {getLabel(item)}
            {cnt !== undefined && (
              <span style={{
                background: active ? color : '#e5e7eb',
                color: active ? 'white' : '#6b7280',
                borderRadius: '999px', padding: '0 .35rem', fontSize: '.68rem',
              }}>{cnt}</span>
            )}
          </div>
        );
      })}
      {items.length === 0 && (
        <span style={{ fontSize: '.78rem', color: '#9ca3af', padding: '.3rem' }}>— ไม่มีข้อมูล —</span>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function EvaluationTab() {
  const { students, setStudents, assessmentTopics, indicators, activities, role, user, addActivityLog } = useApp();

  // teacher lock — auto-set class from user profile
  const isTeacher    = role === 'teacher';
  const teacherLevel = isTeacher ? user?.level : null;
  const teacherClass = isTeacher ? user?.className : null;

  // Step 1 — กิจกรรม
  const [selTopic,     setTopic]     = useState(null);
  const [selIndicator, setIndicator] = useState(null);
  const [selActivity,  setActivity]  = useState(null);

  // Step 2 — ห้อง
  const [selLevel, setLevel] = useState(() => teacherLevel ?? null);
  const [selClass, setClass] = useState(() => teacherClass ?? null);

  // Step 3 — ประเมิน
  const [round,      setRound]      = useState(1);
  const [assessDate, setAssessDate] = useState(todayISO);
  const [results,    setResults]    = useState({});   // { studentId: score (1|2|3|0) }
  const [saved,      setSaved]      = useState(false);

  // filtered indicators + activities
  const topicIndicators = useMemo(
    () => indicators.filter(i => i.domainId === selTopic),
    [indicators, selTopic]
  );
  const indActivities = useMemo(
    () => activities.filter(a => a.indicatorId === selIndicator),
    [activities, selIndicator]
  );

  // selected objects
  const actObj = activities.find(a => a.id === selActivity);
  const indObj = indicators.find(i => i.id === selIndicator);
  const topObj = assessmentTopics.find(t => t.id === selTopic);
  const lvMeta = LEVEL_META.find(m => m.level === selLevel);

  // class students
  const classStudents = useMemo(() =>
    students
      .filter(s => s.className === selClass && !s.name.startsWith('(ว่าง)'))
      .sort((a, b) => Number(a.id) - Number(b.id)),
    [students, selClass]
  );

  // load existing scores — แยกตามครั้งที่ประเมิน
  useEffect(() => {
    if (!selActivity || !selIndicator || !selClass) { setResults({}); return; }
    const init = {};
    classStudents.forEach(s => {
      const actData = s.assessments?.indicators?.[selIndicator]?.[selActivity];
      init[s.id] = actData?.[`r${round}`] ?? 0;   // โหลดคะแนนครั้งที่เลือก
    });
    setResults(init);
    setSaved(false);
  }, [selActivity, selIndicator, selClass, round, classStudents.length]);

  // reset chain when parent changes
  const handleTopicChange = id => { setTopic(id); setIndicator(null); setActivity(null); };
  const handleIndicatorChange = id => { setIndicator(id); setActivity(null); };
  const handleLevelChange = lv => { setLevel(lv); setClass(CLASS_MAP[lv][0]); };

  // set score for one student
  const setScore = (studentId, score) => {
    setResults(prev => ({ ...prev, [studentId]: score === prev[studentId] ? 0 : score }));
    setSaved(false);
  };

  // save all — บันทึกคะแนนแยกตามครั้งที่ (r1/r2/r3/r4)
  const handleSaveAll = () => {
    if (!selActivity || !selIndicator) return;
    const now = new Date().toISOString();
    const updated = students.map(s => {
      const score = results[s.id] ?? 0;
      if (!classStudents.find(cs => cs.id === s.id)) return s;
      const prevIndicators = s.assessments?.indicators ?? {};
      const prevIndGroup   = prevIndicators[selIndicator] ?? {};
      const prevActData    = prevIndGroup[selActivity] ?? {};

      // เก็บ r1/r2/r3/r4 แยกกัน + อัปเดต score เป็นค่าล่าสุดที่มีคะแนน
      const newActData = {
        ...prevActData,
        [`r${round}`]: score || null,          // null = ลบครั้งนี้ออก
        [`r${round}_date`]: score ? assessDate : null,
      };
      // หา score ล่าสุดที่ไม่ null (จากครั้งสูงสุด)
      const latestScore = [4,3,2,1].map(r => newActData[`r${r}`]).find(v => v) ?? null;
      if (latestScore) {
        newActData.score   = latestScore;
        newActData.round   = round;
        newActData.date    = assessDate;
        newActData.savedAt = now;
      }

      return {
        ...s,
        assessments: {
          ...(s.assessments ?? {}),
          indicators: {
            ...prevIndicators,
            [selIndicator]: {
              ...prevIndGroup,
              [selActivity]: latestScore ? newActData : undefined,
            },
          },
        },
      };
    });
    setStudents(updated);
    setSaved(true);

    // ── บันทึก Activity Log ──────────────────────────────────
    const scored = classStudents.filter(s => (results[s.id] ?? 0) > 0);
    const s1 = scored.filter(s => results[s.id] === 1).length;
    const s2 = scored.filter(s => results[s.id] === 2).length;
    const s3 = scored.filter(s => results[s.id] === 3).length;
    addActivityLog({
      id:            Date.now(),
      timestamp:     now,
      date:          assessDate,
      round,
      className:     selClass,
      level:         selLevel,
      topicId:       selTopic,
      topicLabel:    topObj?.label ?? '',
      indicatorId:   selIndicator,
      indicatorCode: indObj?.indicatorCode ?? '',
      activityId:    selActivity,
      activityLabel: actObj?.label ?? '',
      recordedBy:    user?.name ?? 'Unknown',
      teacherId:     user?.teacherId ?? null,
      totalStudents: classStudents.length,
      assessed:      scored.length,
      scores:        { s1, s2, s3 },
    });
  };

  // summary
  const doneCount    = classStudents.filter(s => (results[s.id] ?? 0) > 0).length;
  const total        = classStudents.length;
  const progress     = total ? Math.round(doneCount / total * 100) : 0;

  const stepActivity = !!selActivity;
  const stepClass    = !!(selLevel && selClass);

  return (
    <div className="glass p-6 animate-fade">
      <div className="page-header mb-5">
        <h3>📊 ประเมินผลพัฒนาการ</h3>
      </div>

      {/* ── Step bar ── */}
      <div style={{
        display: 'flex', gap: '1.25rem', flexWrap: 'wrap', alignItems: 'center',
        background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '12px',
        padding: '.65rem 1.1rem', marginBottom: '1.5rem',
      }}>
        <StepBadge n="1" label="เลือกกิจกรรม" active={!stepActivity} done={stepActivity} />
        <span style={{ color: '#cbd5e1' }}>›</span>
        <StepBadge n="2" label="เลือกห้องเรียน" active={stepActivity && !stepClass} done={stepActivity && stepClass} />
        <span style={{ color: '#cbd5e1' }}>›</span>
        <StepBadge n="3" label="ประเมินทั้งห้อง" active={stepActivity && stepClass} done={false} />
      </div>

      {/* ═══ STEP 1: เลือกกิจกรรม ═══ */}
      <div style={{
        background: 'white', border: '1.5px solid #e2e8f0',
        borderRadius: '14px', padding: '1rem 1.2rem', marginBottom: '1rem',
        opacity: 1,
      }}>
        <div style={{ fontSize: '.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '.7rem', letterSpacing: '.05em' }}>
          ขั้นที่ 1 — เลือกกิจกรรมที่จะประเมิน
        </div>

        {/* หัวข้อ */}
        <div style={{ marginBottom: '.75rem' }}>
          <label style={{ fontSize: '.77rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '.35rem' }}>
            📂 หัวข้อประเมิน
          </label>
          <PillGroup
            items={assessmentTopics}
            selected={selTopic}
            onSelect={handleTopicChange}
            color="#7c3aed" bg="#f5f3ff"
            getKey={t => t.id}
            getLabel={t => `${t.emoji} ${t.label}`}
            getCount={t => indicators.filter(i => i.domainId === t.id).length}
          />
        </div>

        {/* ตัวบ่งชี้ */}
        {selTopic && (
          <div style={{ marginBottom: '.75rem' }}>
            <label style={{ fontSize: '.77rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '.35rem' }}>
              📋 ตัวบ่งชี้
            </label>
            <PillGroup
              items={topicIndicators}
              selected={selIndicator}
              onSelect={handleIndicatorChange}
              color="#0891b2" bg="#ecfeff"
              getKey={i => i.id}
              getLabel={i => `[${i.indicatorCode}] ${i.label.length > 45 ? i.label.slice(0, 45) + '…' : i.label}`}
              getCount={i => activities.filter(a => a.indicatorId === i.id).length}
            />
          </div>
        )}

        {/* กิจกรรม */}
        {selIndicator && (
          <div>
            <label style={{ fontSize: '.77rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '.35rem' }}>
              🎯 กิจกรรม
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.45rem' }}>
              {indActivities.map(act => {
                const active = selActivity === act.id;
                return (
                  <div key={act.id} onClick={() => setActivity(act.id)} style={{
                    cursor: 'pointer',
                    background: active ? '#fef3c7' : '#fafafa',
                    border: `2px solid ${active ? '#b45309' : '#e5e7eb'}`,
                    borderRadius: '10px', padding: '.35rem .85rem',
                    display: 'flex', alignItems: 'center', gap: '.4rem',
                    fontWeight: 700, fontSize: '.81rem',
                    color: active ? '#92400e' : '#6b7280',
                    transition: 'all .15s',
                  }}>
                    <span style={{
                      background: active ? '#b45309' : '#e5e7eb',
                      color: active ? 'white' : '#6b7280',
                      borderRadius: '5px', padding: '0 .4rem',
                      fontSize: '.7rem', fontWeight: 800,
                    }}>{act.no}</span>
                    {act.label}
                  </div>
                );
              })}
              {indActivities.length === 0 && (
                <span style={{ fontSize: '.78rem', color: '#9ca3af' }}>— ไม่มีกิจกรรมในตัวบ่งชี้นี้ —</span>
              )}
            </div>
          </div>
        )}

        {/* Banner กิจกรรมที่เลือก */}
        {selActivity && actObj && (
          <div style={{
            marginTop: '.85rem', background: '#fef3c7',
            border: '1.5px solid #fbbf24', borderRadius: '10px',
            padding: '.55rem 1rem', display: 'flex', alignItems: 'center', gap: '.6rem',
          }}>
            <span style={{ fontSize: '1.1rem' }}>✅</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: '.85rem', color: '#92400e' }}>
                กิจกรรมที่เลือก: [{actObj.no}] {actObj.label}
              </div>
              <div style={{ fontSize: '.75rem', color: '#b45309' }}>
                {topObj?.emoji} {topObj?.label} › [{indObj?.indicatorCode}] {indObj?.label}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══ STEP 2: เลือกห้องเรียน ═══ */}
      <div style={{
        background: 'white', border: '1.5px solid #e2e8f0',
        borderRadius: '14px', padding: '1rem 1.2rem', marginBottom: '1rem',
        opacity: stepActivity ? 1 : .45, pointerEvents: stepActivity ? 'auto' : 'none',
      }}>
        <div style={{ fontSize: '.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '.7rem', letterSpacing: '.05em' }}>
          ขั้นที่ 2 — เลือกระดับชั้น & ห้องเรียน
        </div>

        {/* ─ Teacher: แสดงห้องที่ถูกกำหนด (ล็อค) ─ */}
        {isTeacher ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '.4rem',
              background: lvMeta?.bg ?? '#f5f3ff', border: `2px solid ${lvMeta?.color ?? '#7c3aed'}`,
              borderRadius: '10px', padding: '.3rem .85rem',
              fontWeight: 700, fontSize: '.85rem', color: lvMeta?.color ?? '#7c3aed',
            }}>
              {lvMeta?.emoji} {lvMeta?.label} — {selClass}
              <span style={{ background: lvMeta?.color ?? '#7c3aed', color: 'white', borderRadius: '999px', padding: '0 .4rem', fontSize: '.72rem' }}>
                {classStudents.length} คน
              </span>
            </div>
            <span style={{ fontSize: '.74rem', color: '#9ca3af' }}>🔒 ห้องของคุณ</span>
          </div>
        ) : (
          <>
            {/* ระดับ */}
            <div style={{ marginBottom: '.6rem' }}>
              <label style={{ fontSize: '.77rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '.35rem' }}>ระดับชั้น</label>
              <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
                {LEVEL_META.map(({ level, label, emoji, color, bg }) => {
                  const active = selLevel === level;
                  return (
                    <div key={level} onClick={() => handleLevelChange(level)} style={{
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '.35rem',
                      background: active ? bg : '#f9fafb',
                      border: `2px solid ${active ? color : '#e5e7eb'}`,
                      borderRadius: '10px', padding: '.3rem .75rem',
                      fontWeight: 700, fontSize: '.83rem',
                      color: active ? color : '#6b7280', transition: 'all .15s',
                    }}>
                      {emoji} {label}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ห้อง */}
            {selLevel && (
              <div>
                <label style={{ fontSize: '.77rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '.35rem' }}>ห้องเรียน</label>
                <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
                  {CLASS_MAP[selLevel].map(cls => {
                    const active = selClass === cls;
                    const cnt    = students.filter(s => s.className === cls && !s.name.startsWith('(ว่าง)')).length;
                    return (
                      <div key={cls} onClick={() => setClass(cls)} style={{
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '.3rem',
                        background: active ? lvMeta?.bg ?? '#f5f3ff' : '#f9fafb',
                        border: `2px solid ${active ? lvMeta?.color ?? '#7c3aed' : '#e5e7eb'}`,
                        borderRadius: '8px', padding: '.25rem .65rem',
                        fontWeight: 700, fontSize: '.82rem',
                        color: active ? lvMeta?.color ?? '#7c3aed' : '#6b7280',
                        transition: 'all .15s',
                      }}>
                        {cls}
                        <span style={{
                          background: active ? lvMeta?.color : '#e5e7eb',
                          color: active ? 'white' : '#6b7280',
                          borderRadius: '999px', padding: '0 .4rem', fontSize: '.7rem',
                        }}>{cnt}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ═══ STEP 3: ประเมิน ═══ */}
      {stepActivity && stepClass && (
        <div style={{
          background: 'white', border: `2px solid ${lvMeta?.color ?? '#7c3aed'}30`,
          borderRadius: '14px', padding: '1rem 1.2rem',
        }}>
          <div style={{ fontSize: '.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '.8rem', letterSpacing: '.05em' }}>
            ขั้นที่ 3 — ประเมินผลทั้งห้อง {selClass}
          </div>

          {/* ครั้งที่ + วันที่ */}
          <div style={{
            display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end',
            background: '#f8fafc', border: '1.5px solid #e2e8f0',
            borderRadius: '10px', padding: '.7rem 1rem', marginBottom: '1rem',
          }}>
            <div>
              <label style={{ display: 'block', fontSize: '.73rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '.25rem' }}>ครั้งที่ประเมิน</label>
              <select className="input" style={{ width: '120px' }} value={round} onChange={e => { setRound(Number(e.target.value)); setSaved(false); }}>
                {[1,2,3,4].map(r => <option key={r} value={r}>ครั้งที่ {r}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '.73rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '.25rem' }}>วันที่ประเมิน</label>
              <input type="date" className="input" style={{ width: '155px' }}
                value={assessDate} onChange={e => { setAssessDate(e.target.value); setSaved(false); }} />
            </div>
            <div style={{ fontSize: '.8rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
              {thaiDate(assessDate)}
            </div>

            {/* progress */}
            <div style={{ flex: 1, minWidth: '180px', alignSelf: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.73rem', color: lvMeta?.color, marginBottom: '.2rem' }}>
                <span>บันทึกแล้ว {doneCount}/{total} คน</span>
                <span>{progress}%</span>
              </div>
              <div style={{ background: '#e5e7eb', borderRadius: '999px', height: '7px' }}>
                <div style={{ width: `${progress}%`, background: lvMeta?.color, borderRadius: '999px', height: '7px', transition: 'width .3s' }} />
              </div>
            </div>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: '.75rem', marginBottom: '.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>เกณฑ์ระดับ:</span>
            {SCORES.map(s => (
              <span key={s.value} style={{ fontSize: '.75rem', display: 'flex', alignItems: 'center', gap: '.25rem' }}>
                <span style={{ background: s.bg, color: s.color, borderRadius: '6px', padding: '0 .45rem', fontWeight: 800 }}>{s.short}</span>
                {s.label}
              </span>
            ))}
            <span style={{ fontSize: '.75rem', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '.25rem' }}>
              <span style={{ background: '#f3f4f6', color: '#9ca3af', borderRadius: '6px', padding: '0 .45rem', fontWeight: 800 }}>—</span>
              ยังไม่ประเมิน
            </span>
          </div>

          {/* Table */}
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>#</th>
                  <th style={{ width: '80px' }}>รหัส</th>
                  <th>ชื่อ-นามสกุล</th>
                  <th style={{ width: '200px', textAlign: 'center' }}>ผลการประเมิน</th>
                  <th style={{ width: '100px', textAlign: 'center' }}>ผลที่บันทึก</th>
                </tr>
              </thead>
              <tbody>
                {classStudents.map((s, idx) => {
                  const score    = results[s.id] ?? 0;
                  const existing = s.assessments?.indicators?.[selIndicator]?.[selActivity];
                  return (
                    <tr key={s.id} className="hover-row" style={{ background: score > 0 ? SCORES.find(sc => sc.value === score)?.bg + '55' : undefined }}>
                      <td style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '.8rem' }}>{idx + 1}</td>
                      <td>
                        <code style={{ fontSize: '.72rem', background: '#f1f5f9', padding: '.1rem .4rem', borderRadius: '4px', color: '#475569', fontWeight: 700 }}>
                          {s.id}
                        </code>
                      </td>
                      <td style={{ fontWeight: 600 }}>{s.name}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '.4rem', justifyContent: 'center' }}>
                          {SCORES.map(sc => {
                            const active = score === sc.value;
                            return (
                              <button key={sc.value} onClick={() => setScore(s.id, sc.value)} style={{
                                border: `2px solid ${active ? sc.color : '#e5e7eb'}`,
                                borderRadius: '8px', padding: '.28rem .7rem',
                                background: active ? sc.bg : 'white',
                                color: active ? sc.color : '#9ca3af',
                                fontWeight: 800, fontSize: '.8rem',
                                cursor: 'pointer', fontFamily: 'inherit',
                                transition: 'all .12s',
                              }}>
                                {sc.icon} {sc.short}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display:'flex', gap:'.2rem', justifyContent:'center', flexWrap:'wrap' }}>
                          {[1,2,3,4].map(r => {
                            const actData = s.assessments?.indicators?.[selIndicator]?.[selActivity];
                            const rs = actData?.[`r${r}`];
                            if (!rs) return null;
                            const sc = SCORES.find(x => x.value === rs);
                            return (
                              <span key={r} title={`ครั้งที่ ${r}: ${sc?.label}`} style={{
                                background: sc?.bg ?? '#f3f4f6', color: sc?.color ?? '#9ca3af',
                                borderRadius: '5px', padding: '0 .38rem',
                                fontSize: '.7rem', fontWeight: 800, whiteSpace: 'nowrap',
                              }}>
                                {r}:{sc?.short ?? '—'}
                              </span>
                            );
                          })}
                          {![1,2,3,4].some(r => s.assessments?.indicators?.[selIndicator]?.[selActivity]?.[`r${r}`]) && (
                            <span style={{ fontSize:'.75rem', color:'#cbd5e1' }}>—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {classStudents.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>ไม่พบข้อมูลนักเรียนในห้องนี้</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Save bar */}
          <div style={{
            marginTop: '1rem', display: 'flex', alignItems: 'center',
            gap: '1rem', justifyContent: 'flex-end', flexWrap: 'wrap',
          }}>
            {saved && (
              <span style={{ fontSize: '.82rem', color: '#059669', fontWeight: 700 }}>
                ✅ บันทึกเรียบร้อย {thaiDate(assessDate)}
              </span>
            )}
            <button className="btn" onClick={() => {
              const reset = {};
              classStudents.forEach(s => { reset[s.id] = 0; });
              setResults(reset); setSaved(false);
            }} style={{ color: 'var(--danger)' }}>
              🔄 รีเซ็ต
            </button>
            <button className="btn btn-primary" onClick={handleSaveAll}
              style={{ minWidth: '160px', fontSize: '.9rem', padding: '.55rem 1.2rem' }}>
              💾 บันทึกผลทั้งห้อง ({doneCount}/{total})
            </button>
          </div>
        </div>
      )}

      {/* Placeholder ถ้ายังไม่ครบ step */}
      {(!stepActivity || !stepClass) && (
        <div style={{ textAlign: 'center', padding: '2.5rem', color: '#cbd5e1', fontSize: '.9rem' }}>
          {!stepActivity ? '👆 เริ่มจากการเลือกหัวข้อ ตัวบ่งชี้ และกิจกรรมด้านบน' : '👆 เลือกระดับชั้นและห้องเรียน'}
        </div>
      )}
    </div>
  );
}
