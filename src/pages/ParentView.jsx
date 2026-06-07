import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { getQualityText } from '../utils/helpers';
import { callClaude, buildParentSummaryPrompt } from '../utils/aiHelper';

const LEVEL_EMOJI = { 3: '⭐⭐⭐', 2: '⭐⭐', 1: '⭐', 0: '—' };
const LEVEL_COLOR = {
  3: { bg: '#d1fae5', color: '#065f46' },
  2: { bg: '#fef3c7', color: '#92400e' },
  1: { bg: '#fee2e2', color: '#991b1b' },
  0: { bg: '#f5f3ff', color: '#6b7280' },
};

export default function ParentView() {
  const { user, students, setSelectedStudent, assessmentTopics,
    indicators: allIndicators, activities: allActivities,
    aiApiKey, teachers, announcements } = useApp();

  const [aiText, setAiText]       = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError]     = useState('');

  // คำนวณคะแนนเฉลี่ยรายด้านจากโครงสร้างใหม่ (assessments.indicators)
  // ถ้ายังไม่มีข้อมูลใหม่ ให้ fallback ไปที่ assessments.summary (โครงสร้างเก่า)
  const topicAvg = (student, topic) => {
    const inds = (allIndicators ?? []).filter(i => i.domainId === topic.id);
    const scores = inds.flatMap(ind =>
      (allActivities ?? []).filter(a => a.indicatorId === ind.id)
        .map(act => student.assessments?.indicators?.[ind.id]?.[act.id]?.score ?? null)
    ).filter(v => v !== null);
    if (scores.length) {
      return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    }
    // fallback: old summary structure
    const legacy = student.assessments?.summary?.[topic.id];
    return legacy != null ? legacy : null;
  };
  const student = students.find(s => s.id === user?.studentId);
  const classTeacher = teachers?.find(t => t.className === student?.className);

  // ประกาศที่ผู้ปกครองเห็น: ทุกคน + ห้องบุตรหลาน
  const parentAnnouncements = (announcements ?? [])
    .filter(a => !a.target || a.target === 'all' || a.target === student?.className)
    .slice(0, 3);

  if (!student) {
    return (
      <div className="glass p-8 text-center">
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>😅</div>
        <p>ไม่พบข้อมูลนักเรียนที่เชื่อมกับบัญชีผู้ปกครอง</p>
      </div>
    );
  }

  const isBoy   = student.name.includes('ชาย');
  const total   = student.attendance?.total ?? 0;
  const present = student.attendance?.present ?? 0;
  const absent  = student.attendance?.absent ?? 0;
  const pct     = total ? Math.round((present / total) * 100) : 0;

  return (
    <div className="animate-fade">
      {/* Welcome Header */}
      <div
        className="glass mb-6"
        style={{
          background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #ec4899 100%)',
          color: 'white',
          padding: '2rem',
        }}
      >
        <div className="flex items-center gap-4">
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'rgba(255,255,255,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem', flexShrink: 0,
            border: '3px solid rgba(255,255,255,0.5)',
          }}>
            {isBoy ? '👦' : '👧'}
          </div>
          <div>
            <h2 style={{ color: 'white', fontSize: '1.4rem', marginBottom: '0.25rem' }}>
              สวัสดีคุณผู้ปกครอง 😊
            </h2>
            <div style={{ opacity: 0.9, fontSize: '1rem', fontWeight: 600 }}>{student.name}</div>
            <div style={{ opacity: 0.75, fontSize: '0.82rem', marginTop: '0.2rem' }}>
              ชั้นอนุบาล {student.level?.replace('K', '')} · อายุ {student.age} ปี
            </div>
          </div>
        </div>
      </div>

      {/* Announcements */}
      {parentAnnouncements.length > 0 && (
        <div style={{ display:'flex', flexDirection:'column', gap:'.5rem', marginBottom:'1.25rem' }}>
          {parentAnnouncements.map((a, idx) => (
            <div key={a.id} className="announce-banner">
              <span className="announce-icon">📢</span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', gap:'.35rem', alignItems:'center', flexWrap:'wrap', marginBottom:'.12rem' }}>
                  {idx === 0 && <span style={{ background:'#7c3aed', color:'white', fontSize:'.63rem', fontWeight:800, padding:'1px 6px', borderRadius:'999px' }}>ล่าสุด</span>}
                  {(!a.target || a.target === 'all') ? (
                    <span style={{ background:'#dbeafe', color:'#1e40af', fontSize:'.65rem', fontWeight:700, padding:'1px 7px', borderRadius:'999px' }}>ทุกคน</span>
                  ) : (
                    <span style={{ background:'#ede9fe', color:'#7c3aed', fontSize:'.65rem', fontWeight:700, padding:'1px 7px', borderRadius:'999px' }}>ห้อง {a.target}</span>
                  )}
                </div>
                <div className="announce-title">{a.title}</div>
                {a.body && <div style={{ fontSize:'.78rem', color:'#4b5563', marginTop:'.1rem' }}>{a.body}</div>}
                <div className="announce-date">📅 {a.date}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Teacher Info */}
      {classTeacher && (
        <div className="glass-card mb-6">
          <h3 className="mb-3">👩‍🏫 ครูประจำชั้น</h3>
          <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
            <div style={{
              width:52, height:52, borderRadius:'50%',
              background:'linear-gradient(135deg,#7c3aed,#a855f7)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:'1.6rem', flexShrink:0,
            }}>👩‍🏫</div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:800, fontSize:'1rem' }}>
                {classTeacher.firstName && classTeacher.lastName
                  ? `${classTeacher.firstName} ${classTeacher.lastName}`
                  : classTeacher.name}
              </div>
              <div style={{ fontSize:'.82rem', color:'#6b7280', marginTop:'.2rem' }}>
                ห้อง {classTeacher.className}
              </div>
            </div>
            {classTeacher.phone && (
              <a href={`tel:${classTeacher.phone}`} style={{
                display:'flex', flexDirection:'column', alignItems:'center', gap:'.2rem',
                background:'#d1fae5', color:'#065f46', borderRadius:'12px',
                padding:'.6rem .9rem', textDecoration:'none', fontWeight:700, fontSize:'.82rem',
              }}>
                📞 <span>{classTeacher.phone}</span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* Attendance */}
      <div className="glass-card mb-6">
        <h3 className="mb-4">📅 สถิติการมาเรียน</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{ textAlign: 'center', background: '#d1fae5', borderRadius: '14px', padding: '1rem' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#065f46' }}>{present}</div>
            <div style={{ fontSize: '0.78rem', color: '#065f46', fontWeight: 600 }}>✅ มาเรียน</div>
          </div>
          <div style={{ textAlign: 'center', background: '#fee2e2', borderRadius: '14px', padding: '1rem' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#991b1b' }}>{absent}</div>
            <div style={{ fontSize: '0.78rem', color: '#991b1b', fontWeight: 600 }}>❌ ขาด/ลา</div>
          </div>
          <div style={{ textAlign: 'center', background: '#ede9fe', borderRadius: '14px', padding: '1rem' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#7c3aed' }}>{pct}%</div>
            <div style={{ fontSize: '0.78rem', color: '#7c3aed', fontWeight: 600 }}>📊 อัตรามา</div>
          </div>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{
              width: pct + '%',
              background: pct >= 80
                ? 'linear-gradient(90deg,#10b981,#34d399)'
                : pct >= 60
                  ? 'linear-gradient(90deg,#f59e0b,#fbbf24)'
                  : 'linear-gradient(90deg,#ef4444,#fb7185)',
            }}
          />
        </div>
        <div className="text-xs text-muted mt-2 text-right">{present} จาก {total} วัน</div>
      </div>

      {/* Assessment — แสดงครบทุกด้านเสมอ */}
      <div className="glass-card mb-6">
        <h3 className="mb-4">🌱 ผลการประเมินพัฒนาการ</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {assessmentTopics.map(topic => {
            const raw = topicAvg(student, topic);
            const hasScore = raw !== null;
            const val = hasScore ? raw : 0;
            const lvl = hasScore ? (LEVEL_COLOR[val] ?? LEVEL_COLOR[0]) : LEVEL_COLOR[0];
            return (
              <div key={topic.id} style={{
                display: 'flex', alignItems: 'center', gap: '1rem',
                background: lvl.bg, borderRadius: '12px', padding: '0.75rem 1rem',
              }}>
                <span style={{ fontSize: '1.5rem' }}>{topic.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: lvl.color }}>
                    ด้าน{topic.label}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: lvl.color, opacity: 0.8 }}>
                    {hasScore ? getQualityText(val) : 'รอผลประเมินจากครู'}
                  </div>
                </div>
                <div style={{ fontSize: '1.1rem' }}>
                  {hasScore ? (LEVEL_EMOJI[val] ?? '—') : '⏳'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Summary */}
      <div className="glass-card mb-6">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.75rem' }}>
          <h3 style={{ margin: 0 }}>🤖 สรุปพัฒนาการโดย AI</h3>
          {aiApiKey && !aiLoading && (
            <button type="button"
              onClick={async () => {
                setAiLoading(true); setAiError(''); setAiText('');
                try {
                  const topicScores = assessmentTopics.map(t => ({ label: t.label, score: topicAvg(student, t) }));
                  const result = await callClaude(aiApiKey, buildParentSummaryPrompt(student, topicScores));
                  setAiText(result);
                } catch (e) { setAiError(e.message); }
                finally { setAiLoading(false); }
              }}
              style={{
                background: 'linear-gradient(135deg,#7c3aed,#a855f7)',
                color: 'white', border: 'none', borderRadius: '10px',
                padding: '.4rem .9rem', fontFamily: 'inherit', fontWeight: 700,
                fontSize: '.8rem', cursor: 'pointer',
              }}>
              ✨ สร้างสรุป
            </button>
          )}
        </div>

        {!aiApiKey && (
          <div style={{ fontSize: '.83rem', color: '#6b7280', fontStyle: 'italic' }}>
            ยังไม่ได้เปิดใช้งาน AI — ติดต่อครูเพื่อตั้งค่า API Key
          </div>
        )}
        {aiLoading && (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: '#7c3aed', fontSize: '.9rem' }}>
            ⏳ AI กำลังวิเคราะห์พัฒนาการ...
          </div>
        )}
        {aiError && (
          <div style={{ background: '#fee2e2', borderRadius: '10px', padding: '.75rem', fontSize: '.83rem', color: '#991b1b' }}>
            ❌ {aiError}
          </div>
        )}
        {aiText && (
          <div style={{
            background: 'linear-gradient(135deg,#f5f3ff,#faf5ff)',
            border: '1.5px solid #c4b5fd', borderRadius: '12px',
            padding: '1rem 1.1rem', lineHeight: 1.8, fontSize: '.88rem', color: '#374151',
          }}>
            <div style={{ fontSize: '.7rem', fontWeight: 800, color: '#7c3aed', marginBottom: '.4rem' }}>
              🤖 CLAUDE AI
            </div>
            {aiText}
          </div>
        )}
        {!aiText && !aiLoading && !aiError && aiApiKey && (
          <div style={{ fontSize: '.82rem', color: '#9ca3af', fontStyle: 'italic' }}>
            กดปุ่ม "สร้างสรุป" เพื่อให้ AI สรุปพัฒนาการและข้อแนะนำสำหรับผู้ปกครอง
          </div>
        )}
      </div>

      {/* Physical Info */}
      <div className="glass-card mb-6">
        <h3 className="mb-3">📏 ข้อมูลร่างกาย</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div style={{ background: '#dbeafe', borderRadius: '12px', padding: '0.75rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#1e40af' }}>{student.weight ?? '—'}</div>
            <div style={{ fontSize: '0.78rem', color: '#1e40af', fontWeight: 600 }}>⚖️ น้ำหนัก (กก.)</div>
          </div>
          <div style={{ background: '#fce7f3', borderRadius: '12px', padding: '0.75rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#9d174d' }}>{student.height ?? '—'}</div>
            <div style={{ fontSize: '0.78rem', color: '#9d174d', fontWeight: 600 }}>📐 ส่วนสูง (ซม.)</div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <button
        type="button"
        className="btn btn-primary w-full"
        style={{ padding: '1rem', fontSize: '1rem', borderRadius: '16px' }}
        onClick={() => setSelectedStudent(student)}
      >
        📖 ดูสมุดรายงานประจำตัวฉบับเต็ม
      </button>
    </div>
  );
}
