import { useState } from 'react';
import { INDICATORS_DATA } from '../data/indicatorsData';

const SCORE_OPTIONS = [
  { value: 3, label: 'ผ่าน',          emoji: '✅', color: '#059669', bg: '#ecfdf5' },
  { value: 2, label: 'กำลังพัฒนา',   emoji: '🔄', color: '#b45309', bg: '#fffbeb' },
  { value: 1, label: 'ต้องส่งเสริม', emoji: '🌱', color: '#dc2626', bg: '#fef2f2' },
];

// ── Step 1: เลือกด้านพัฒนาการ ──────────────────────────────────────────────
function StepDomain({ onSelect }) {
  return (
    <div className="animate-fade">
      <h3 style={{ marginBottom: '1.25rem', color: 'var(--primary)' }}>
        🎯 เลือกด้านที่ต้องการประเมิน
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
        {INDICATORS_DATA.map(d => (
          <button key={d.id} type="button" onClick={() => onSelect(d)}
            style={{
              background: d.bg, border: `2px solid ${d.color}40`,
              borderRadius: '16px', padding: '1.25rem 1rem',
              cursor: 'pointer', fontFamily: 'inherit',
              transition: 'all .2s', textAlign: 'center',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.border = `2px solid ${d.color}`;
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = `0 8px 24px ${d.color}30`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.border = `2px solid ${d.color}40`;
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '.5rem' }}>{d.emoji}</div>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: d.color }}>
              ด้าน{d.label}
            </div>
            <div style={{ fontSize: '.75rem', color: '#6b7280', marginTop: '.25rem' }}>
              {d.standards.reduce((s, std) =>
                s + std.indicators.reduce((s2, ind) =>
                  s2 + ind.items.reduce((s3, item) => s3 + item.activities.length, 0), 0), 0)} กิจกรรม
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Step 2: เลือกมาตรฐาน + ตัวบ่งชี้ ──────────────────────────────────────
function StepIndicator({ domain, onSelect, onBack }) {
  const [openStd, setOpenStd] = useState(domain.standards[0]?.id ?? null);

  return (
    <div className="animate-fade">
      <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '1.25rem' }}>
        <button type="button" onClick={onBack}
          style={{ background: '#f3f4f6', border: 'none', borderRadius: '8px',
            padding: '.4rem .75rem', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700 }}>
          ← ย้อนกลับ
        </button>
        <h3 style={{ color: domain.color }}>
          {domain.emoji} ด้าน{domain.label} — เลือกตัวบ่งชี้
        </h3>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem', maxHeight: '55vh', overflowY: 'auto', paddingRight: '.25rem' }}>
        {domain.standards.map(std => (
          <div key={std.id} style={{ border: `1.5px solid ${domain.color}25`, borderRadius: '12px', overflow: 'hidden' }}>
            <button type="button"
              onClick={() => setOpenStd(openStd === std.id ? null : std.id)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '.7rem 1rem', background: openStd === std.id ? domain.bg : '#f9fafb',
                border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              <span style={{ fontWeight: 700, fontSize: '.85rem', color: domain.color, textAlign: 'left' }}>
                {std.title}
              </span>
              <span style={{ color: domain.color }}>{openStd === std.id ? '▲' : '▼'}</span>
            </button>

            {openStd === std.id && (
              <div style={{ padding: '.5rem .75rem .75rem' }}>
                {std.indicators.map(ind => {
                  const actCount = ind.items.reduce((s, item) => s + item.activities.length, 0);
                  if (actCount === 0) return null;
                  return (
                    <button key={ind.id} type="button"
                      onClick={() => onSelect({ domain, std, ind })}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '.6rem .85rem', marginBottom: '.35rem',
                        background: 'white', border: `1.5px solid ${domain.color}20`,
                        borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit',
                        transition: 'all .15s', textAlign: 'left',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = domain.bg;
                        e.currentTarget.style.border = `1.5px solid ${domain.color}60`;
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'white';
                        e.currentTarget.style.border = `1.5px solid ${domain.color}20`;
                      }}
                    >
                      <div>
                        <span style={{
                          background: `${domain.color}20`, color: domain.color,
                          borderRadius: '5px', padding: '0 .4rem', fontSize: '.7rem',
                          fontWeight: 800, marginRight: '.5rem',
                        }}>{ind.id}</span>
                        <span style={{ fontWeight: 600, fontSize: '.84rem' }}>{ind.label}</span>
                      </div>
                      <span style={{
                        background: domain.color, color: 'white',
                        borderRadius: '999px', padding: '0 .5rem',
                        fontSize: '.7rem', fontWeight: 700, flexShrink: 0,
                      }}>
                        {actCount} กิจกรรม →
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Step 3: ให้คะแนนกิจกรรม ────────────────────────────────────────────────
function StepActivities({ domain, std, ind, student, onSave, onBack }) {
  // โหลดคะแนนเดิมถ้ามี
  const prevScores = student.assessments?.indicators?.[`${domain.id}_${ind.id}`] ?? {};
  const [scores, setScores] = useState(prevScores);
  const allActivities = ind.items.flatMap(item => item.activities.map(a => ({ ...a, itemLabel: item.label })));

  const scored = Object.keys(scores).length;
  const total  = allActivities.length;
  const pct    = total ? Math.round((scored / total) * 100) : 0;

  return (
    <div className="animate-fade">
      <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '1rem' }}>
        <button type="button" onClick={onBack}
          style={{ background: '#f3f4f6', border: 'none', borderRadius: '8px',
            padding: '.4rem .75rem', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700 }}>
          ← ย้อนกลับ
        </button>
        <div>
          <div style={{ fontWeight: 800, color: domain.color, fontSize: '.95rem' }}>
            {domain.emoji} {ind.label}
          </div>
          <div style={{ fontSize: '.75rem', color: '#6b7280' }}>{std.title}</div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.75rem', color: '#6b7280', marginBottom: '.3rem' }}>
          <span>ความคืบหน้า</span>
          <span>{scored}/{total} ({pct}%)</span>
        </div>
        <div style={{ background: '#e5e7eb', borderRadius: '999px', height: '8px', overflow: 'hidden' }}>
          <div style={{
            width: `${pct}%`, height: '100%', borderRadius: '999px',
            background: `linear-gradient(90deg, ${domain.color}, ${domain.color}cc)`,
            transition: 'width .3s ease',
          }} />
        </div>
      </div>

      {/* Activities */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem', maxHeight: '50vh', overflowY: 'auto', paddingRight: '.25rem' }}>
        {ind.items.map(item => (
          <div key={item.id}>
            {item.label && (
              <div style={{
                fontSize: '.75rem', fontWeight: 700, color: '#6b7280',
                margin: '.25rem 0', display: 'flex', alignItems: 'center', gap: '.3rem',
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: domain.color, display: 'inline-block' }} />
                {item.label}
              </div>
            )}
            {item.activities.map(act => {
              const current = scores[act.no];
              return (
                <div key={act.no} style={{
                  background: current ? `${domain.bg}` : '#f9fafb',
                  border: `1.5px solid ${current ? domain.color + '40' : '#e5e7eb'}`,
                  borderRadius: '12px', padding: '.65rem .85rem',
                  transition: 'all .2s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '.5rem', marginBottom: '.5rem' }}>
                    <span style={{
                      background: domain.color, color: 'white',
                      borderRadius: '5px', padding: '0 .35rem',
                      fontSize: '.68rem', fontWeight: 800, flexShrink: 0, lineHeight: '1.5',
                    }}>{act.no}</span>
                    <span style={{ fontSize: '.83rem', fontWeight: 600, color: '#374151' }}>{act.label}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
                    {SCORE_OPTIONS.map(opt => (
                      <button key={opt.value} type="button"
                        onClick={() => setScores(prev => ({ ...prev, [act.no]: opt.value }))}
                        style={{
                          flex: 1, padding: '.35rem .5rem', border: 'none',
                          borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit',
                          fontWeight: 700, fontSize: '.75rem', transition: 'all .15s',
                          background: current === opt.value ? opt.color : '#f3f4f6',
                          color: current === opt.value ? 'white' : '#6b7280',
                          boxShadow: current === opt.value ? `0 3px 10px ${opt.color}50` : 'none',
                          transform: current === opt.value ? 'scale(1.03)' : 'scale(1)',
                        }}
                      >
                        {opt.emoji} {opt.label}
                      </button>
                    ))}
                    {current && (
                      <button type="button"
                        onClick={() => setScores(prev => { const n = { ...prev }; delete n[act.no]; return n; })}
                        style={{
                          padding: '.35rem .5rem', border: 'none', borderRadius: '8px',
                          cursor: 'pointer', fontFamily: 'inherit', background: '#fee2e2',
                          color: '#dc2626', fontSize: '.7rem', fontWeight: 700,
                        }}>✕</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Save */}
      <button type="button"
        onClick={() => onSave({ domainId: domain.id, indId: ind.id, scores })}
        style={{
          width: '100%', marginTop: '1rem', padding: '.85rem',
          background: `linear-gradient(135deg, ${domain.color}, ${domain.color}cc)`,
          color: 'white', border: 'none', borderRadius: '12px',
          fontFamily: 'inherit', fontWeight: 800, fontSize: '1rem',
          cursor: 'pointer', boxShadow: `0 4px 16px ${domain.color}40`,
          transition: 'all .2s',
        }}
      >
        ✅ บันทึกผลการประเมิน ({scored}/{total} กิจกรรม)
      </button>
    </div>
  );
}

// ── Main Wizard Modal ────────────────────────────────────────────────────────
export default function AssessmentWizard({ student, onSave, onCancel }) {
  const [step, setStep]       = useState('domain');
  const [domain, setDomain]   = useState(null);
  const [std, setStd]         = useState(null);
  const [ind, setInd]         = useState(null);

  // นับกิจกรรมที่ประเมินแล้วทั้งหมด
  const totalScored = Object.values(student.assessments?.indicators ?? {})
    .reduce((sum, scoreMap) => sum + Object.keys(scoreMap).length, 0);

  const handleSaveActivities = ({ domainId, indId, scores }) => {
    const key = `${domainId}_${indId}`;
    const updatedAssessments = {
      ...(student.assessments ?? {}),
      indicators: {
        ...(student.assessments?.indicators ?? {}),
        [key]: scores,
      },
      summary: {
        ...(student.assessments?.summary ?? {}),
        [domainId]: true,
      },
      updatedAt: new Date().toISOString(),
    };
    onSave(updatedAssessments);
    setStep('domain');
    setDomain(null); setStd(null); setInd(null);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '1rem',
    }}>
      <div style={{
        background: 'white', borderRadius: '20px', width: '100%', maxWidth: '600px',
        maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
        boxShadow: '0 25px 60px rgba(0,0,0,.25)',
      }} className="animate-pop">
        {/* Modal Header */}
        <div style={{
          padding: '1.25rem 1.5rem', borderBottom: '1px solid #f3f4f6',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #7c3aed08, #ec489908)',
        }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#1f2937' }}>
              ✏️ ประเมินพัฒนาการ
            </div>
            <div style={{ fontSize: '.83rem', color: '#6b7280', marginTop: '.1rem' }}>
              {student.name} · ประเมินแล้ว {totalScored} กิจกรรม
            </div>
          </div>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', fontSize: '.75rem' }}>
            <span style={{
              padding: '.2rem .5rem', borderRadius: '6px', fontWeight: 700,
              background: step === 'domain' ? '#7c3aed' : '#e5e7eb',
              color: step === 'domain' ? 'white' : '#9ca3af',
            }}>1. ด้าน</span>
            <span style={{ color: '#d1d5db' }}>›</span>
            <span style={{
              padding: '.2rem .5rem', borderRadius: '6px', fontWeight: 700,
              background: step === 'indicator' ? '#7c3aed' : '#e5e7eb',
              color: step === 'indicator' ? 'white' : '#9ca3af',
            }}>2. ตัวบ่งชี้</span>
            <span style={{ color: '#d1d5db' }}>›</span>
            <span style={{
              padding: '.2rem .5rem', borderRadius: '6px', fontWeight: 700,
              background: step === 'activities' ? '#7c3aed' : '#e5e7eb',
              color: step === 'activities' ? 'white' : '#9ca3af',
            }}>3. กิจกรรม</span>
            <button type="button" onClick={onCancel}
              style={{
                marginLeft: '.5rem', background: '#fee2e2', color: '#dc2626',
                border: 'none', borderRadius: '8px', padding: '.3rem .6rem',
                cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: '.8rem',
              }}>✕ ปิด</button>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
          {step === 'domain' && (
            <StepDomain
              onSelect={d => { setDomain(d); setStep('indicator'); }}
            />
          )}
          {step === 'indicator' && domain && (
            <StepIndicator
              domain={domain}
              onSelect={({ domain: d, std: s, ind: i }) => {
                setDomain(d); setStd(s); setInd(i);
                setStep('activities');
              }}
              onBack={() => setStep('domain')}
            />
          )}
          {step === 'activities' && domain && std && ind && (
            <StepActivities
              domain={domain}
              std={std}
              ind={ind}
              student={student}
              onSave={handleSaveActivities}
              onBack={() => setStep('indicator')}
            />
          )}
        </div>
      </div>
    </div>
  );
}
