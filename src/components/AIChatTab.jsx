import { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { callClaudeChat, buildChatSystemPrompt } from '../utils/aiHelper';

// ── ตัวอย่างคำถามด่วน ─────────────────────────────────────────────────────────
const QUICK_PROMPTS = [
  'แนะนำกิจกรรมส่งเสริมทักษะภาษาสำหรับเด็กอนุบาล 2',
  'วิธีจัดการเด็กที่ไม่ยอมทำกิจกรรมในชั้นเรียน',
  'กิจกรรมสร้างสรรค์สำหรับช่วงเช้า 15 นาที',
  'วิธีการสื่อสารกับผู้ปกครองที่เป็นประโยชน์',
  'แนวทางการจัดมุมเล่นในห้องเรียนอนุบาล',
  'กิจกรรมพัฒนาทักษะการเคลื่อนไหวกล้ามเนื้อมัดเล็ก',
];

// ── Bubble ────────────────────────────────────────────────────────────────────
function Bubble({ role, content }) {
  const isUser = role === 'user';
  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: '.75rem',
    }}>
      {!isUser && (
        <div style={{
          width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
          background: '#7c3aed', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: '1rem', marginRight: '.5rem', marginTop: '.15rem',
        }}>🤖</div>
      )}
      <div style={{
        maxWidth: '75%',
        background: isUser ? '#7c3aed' : '#f1f5f9',
        color: isUser ? 'white' : '#1e293b',
        borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
        padding: '.65rem 1rem',
        fontSize: '.85rem',
        lineHeight: 1.7,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}>
        {content}
      </div>
      {isUser && (
        <div style={{
          width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
          background: '#e0e7ff', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: '1rem', marginLeft: '.5rem', marginTop: '.15rem',
        }}>👩‍🏫</div>
      )}
    </div>
  );
}

// ── TypingIndicator ───────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.75rem' }}>
      <div style={{
        width: '32px', height: '32px', borderRadius: '50%',
        background: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem',
      }}>🤖</div>
      <div style={{ background: '#f1f5f9', borderRadius: '18px 18px 18px 4px', padding: '.6rem .9rem', display: 'flex', gap: '.3rem' }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: '7px', height: '7px', borderRadius: '50%', background: '#94a3b8',
            animation: 'bounce 1.2s infinite',
            animationDelay: `${i * 0.2}s`,
          }} />
        ))}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AIChatTab() {
  const { aiApiKey, students, classes, schools, academicYear } = useApp();
  const schoolName = schools?.[0]?.name ?? 'โรงเรียน';

  const [messages,  setMessages]  = useState([]);   // [{ role, content }]
  const [input,     setInput]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');

  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  // auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const systemPrompt = buildChatSystemPrompt(schoolName, academicYear, students, classes);

  async function send(text) {
    const q = (text ?? input).trim();
    if (!q || loading || !aiApiKey) return;

    const newMessages = [...messages, { role: 'user', content: q }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    setError('');

    try {
      const reply = await callClaudeChat(aiApiKey, newMessages, systemPrompt);
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  function clearChat() {
    setMessages([]);
    setInput('');
    setError('');
  }

  return (
    <div className="glass p-6 animate-fade">
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.8); opacity: .5; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      <div className="page-header mb-4" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3>🤖 AI ผู้ช่วยครู</h3>
        {messages.length > 0 && (
          <button type="button" className="btn btn-sm" onClick={clearChat}
            style={{ color: '#dc2626', fontSize: '.78rem' }}>
            🗑️ ล้างการสนทนา
          </button>
        )}
      </div>

      {/* ── No API key ── */}
      {!aiApiKey && (
        <div style={{
          background: '#fef9c3', border: '1.5px solid #fbbf24',
          borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.25rem',
          fontSize: '.88rem', color: '#713f12',
        }}>
          ⚠️ ยังไม่ได้ตั้งค่า Claude API Key — ไปที่ <strong>ตั้งค่า → AI API Key</strong> แล้วกลับมาใช้งาน
        </div>
      )}

      {/* ── Chat area ── */}
      <div style={{
        border: '1.5px solid #e2e8f0', borderRadius: '14px', background: 'white',
        display: 'flex', flexDirection: 'column', height: '480px',
      }}>

        {/* messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1rem .5rem' }}>
          {messages.length === 0 && !loading && (
            <div style={{ textAlign: 'center', paddingTop: '2rem', color: '#9ca3af', fontSize: '.88rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '.5rem' }}>🤖</div>
              <div style={{ fontWeight: 700, color: '#475569', marginBottom: '.4rem' }}>AI ผู้ช่วยครูปฐมวัย</div>
              <div>ถามคำถามเกี่ยวกับการจัดการชั้นเรียน พัฒนาการเด็ก หรือกิจกรรมต่างๆ ได้เลย</div>
            </div>
          )}
          {messages.map((m, i) => (
            <Bubble key={i} role={m.role} content={m.content} />
          ))}
          {loading && <TypingIndicator />}
          {error && (
            <div style={{ background: '#fee2e2', color: '#991b1b', borderRadius: '10px', padding: '.65rem 1rem', fontSize: '.82rem', marginBottom: '.5rem' }}>
              ❌ {error}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* input bar */}
        <div style={{
          borderTop: '1.5px solid #f1f5f9', padding: '.75rem 1rem',
          display: 'flex', gap: '.5rem', alignItems: 'flex-end',
        }}>
          <textarea
            ref={inputRef}
            rows={2}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder={aiApiKey ? 'พิมพ์คำถาม… (Enter ส่ง, Shift+Enter ขึ้นบรรทัดใหม่)' : 'ต้องตั้งค่า API Key ก่อน'}
            disabled={!aiApiKey || loading}
            style={{
              flex: 1, padding: '.55rem .8rem', borderRadius: '10px',
              border: '1.5px solid #e2e8f0', fontFamily: 'inherit', fontSize: '.85rem',
              resize: 'none', outline: 'none', lineHeight: 1.5,
              background: aiApiKey ? 'white' : '#f9fafb',
            }}
          />
          <button type="button" onClick={() => send()} disabled={!aiApiKey || !input.trim() || loading}
            style={{
              padding: '.55rem 1.1rem', borderRadius: '10px', border: 'none',
              background: aiApiKey && input.trim() ? '#7c3aed' : '#e5e7eb',
              color: aiApiKey && input.trim() ? 'white' : '#9ca3af',
              fontFamily: 'inherit', fontWeight: 700, fontSize: '.85rem',
              cursor: aiApiKey && input.trim() ? 'pointer' : 'not-allowed',
              flexShrink: 0, alignSelf: 'flex-end',
            }}>
            ส่ง ↩
          </button>
        </div>
      </div>

      {/* ── Quick prompts ── */}
      {messages.length === 0 && aiApiKey && (
        <div style={{ marginTop: '1.25rem' }}>
          <div style={{ fontSize: '.77rem', fontWeight: 700, color: '#64748b', marginBottom: '.5rem', textTransform: 'uppercase', letterSpacing: '.05em' }}>
            💡 คำถามตัวอย่าง
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem' }}>
            {QUICK_PROMPTS.map(q => (
              <button key={q} type="button" onClick={() => send(q)}
                style={{
                  padding: '.3rem .75rem', borderRadius: '999px', cursor: 'pointer',
                  border: '1.5px solid #e0e7ff', background: '#f5f3ff',
                  color: '#4f46e5', fontFamily: 'inherit', fontWeight: 600, fontSize: '.79rem',
                  transition: 'all .14s',
                }}>
                {q}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
