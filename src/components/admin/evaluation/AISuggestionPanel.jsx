import { useState } from 'react';
import { callClaude, buildActivitySuggestionPrompt } from '../../../utils/aiHelper';

export default function AISuggestionPanel({ students, assessmentTopics, indicators, activities, aiApiKey }) {
  const [selId,   setSelId]   = useState(null);
  const [aiText,  setAiText]  = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const student = students.find(s => String(s.id) === String(selId));

  const topicScores = useMemo(() => {
    if (!student) return [];
    return assessmentTopics.map(t => {
      const inds = indicators.filter(i => i.domainId === t.id);
      const scores = inds.flatMap(ind =>
        activities.filter(a => a.indicatorId === ind.id)
          .map(act => student.assessments?.indicators?.[ind.id]?.[act.id]?.score ?? null)
      ).filter(v => v !== null);
      return { label: t.label, score: scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null };
    });
  }, [student, assessmentTopics, indicators, activities]);

  async function handleAsk() {
    if (!student || !aiApiKey) return;
    setLoading(true); setError(''); setAiText('');
    try {
      const result = await callClaude(aiApiKey, buildActivitySuggestionPrompt(student, topicScores));
      setAiText(result);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ marginTop: '1.25rem', background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: '14px', padding: '1rem 1.2rem' }}>
      <div style={{ fontSize: '.78rem', fontWeight: 800, color: '#065f46', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '.75rem' }}>
        🤖 AI แนะนำกิจกรรมส่งเสริมพัฒนาการรายนักเรียน
      </div>
      {!aiApiKey ? (
        <div style={{ fontSize: '.82rem', color: '#6b7280', fontStyle: 'italic' }}>ตั้งค่า Claude API Key ในหน้า ตั้งค่า เพื่อใช้งานฟีเจอร์นี้</div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginBottom: '.75rem' }}>
            {students.map(s => (
              <button key={s.id} type="button" onClick={() => { setSelId(String(s.id)); setAiText(''); setError(''); }}
                style={{
                  padding: '.25rem .6rem', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit',
                  border: `1.5px solid ${String(selId) === String(s.id) ? '#059669' : '#d1fae5'}`,
                  background: String(selId) === String(s.id) ? '#d1fae5' : 'white',
                  color: String(selId) === String(s.id) ? '#065f46' : '#374151',
                  fontWeight: String(selId) === String(s.id) ? 700 : 500, fontSize: '.8rem',
                }}>
                {s.name}
              </button>
            ))}
          </div>
          {student && (
            <button type="button" onClick={handleAsk} disabled={loading}
              style={{
                padding: '.4rem 1.1rem', borderRadius: '8px', border: 'none',
                background: '#059669', color: 'white', fontFamily: 'inherit',
                fontWeight: 700, fontSize: '.85rem', cursor: loading ? 'wait' : 'pointer',
                marginBottom: '.75rem',
              }}>
              {loading ? '⏳ กำลังวิเคราะห์…' : `✨ แนะนำกิจกรรมสำหรับ ${student.name}`}
            </button>
          )}
          {error && <div style={{ color: '#dc2626', fontSize: '.82rem', marginBottom: '.5rem' }}>❌ {error}</div>}
          {aiText && (
            <div style={{ background: 'white', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '.8rem 1rem', fontSize: '.85rem', lineHeight: 1.7, color: '#1e293b', whiteSpace: 'pre-wrap' }}>
              {aiText}
            </div>
          )}
        </>
      )}
    </div>
  );
}

