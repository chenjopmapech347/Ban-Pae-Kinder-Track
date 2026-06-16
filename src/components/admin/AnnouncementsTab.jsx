// AnnouncementsTab.jsx
// ระบบประกาศ — Admin สร้าง/ลบประกาศ เลือกเป้าหมาย (ทั้งหมด / เฉพาะห้อง)
import { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';

const TARGET_ALL = 'all';

function TargetBadge({ target }) {
  if (target === TARGET_ALL || !target) {
    return (
      <span style={{
        background: '#dbeafe', color: '#1e40af',
        fontSize: '.7rem', fontWeight: 700,
        padding: '2px 10px', borderRadius: '999px',
      }}>📢 ทุกคน</span>
    );
  }
  return (
    <span style={{
      background: '#ede9fe', color: '#7c3aed',
      fontSize: '.7rem', fontWeight: 700,
      padding: '2px 10px', borderRadius: '999px',
    }}>🏫 ห้อง {target}</span>
  );
}

export default function AnnouncementsTab() {
  const { announcements, setAnnouncements, classes } = useApp();

  const [title,  setTitle]  = useState('');
  const [body,   setBody]   = useState('');
  const [target, setTarget] = useState(TARGET_ALL);
  const [saved,  setSaved]  = useState(false);

  const classList = useMemo(() =>
    (classes ?? []).map(c => c.name ?? c.id).filter(Boolean),
  [classes]);

  // ประกาศล่าสุด 3 รายการ (ทั้งหมด — Admin เห็นทุก target)
  const latest = announcements.slice(0, 3);

  const handleAdd = () => {
    if (!title.trim()) return;
    const now = new Date();
    const date = now.toLocaleDateString('th-TH', {
      day: '2-digit', month: '2-digit',
      year: 'numeric', calendar: 'buddhist',
    });
    const newItem = {
      id: Date.now(),
      date,
      title: title.trim(),
      body:  body.trim(),
      target,
    };
    setAnnouncements([newItem, ...announcements]);
    setTitle('');
    setBody('');
    setTarget(TARGET_ALL);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleDelete = (id) => {
    if (!window.confirm('ลบประกาศนี้?')) return;
    setAnnouncements(announcements.filter(a => a.id !== id));
  };

  return (
    <div className="glass p-6 animate-fade">
      <div className="page-header mb-6">
        <h3>📢 จัดการประกาศ</h3>
      </div>

      {/* ─── Form ─── */}
      <div style={{
        background: '#faf5ff', border: '1.5px solid #ede9fe',
        borderRadius: '14px', padding: '1.25rem 1.5rem',
        marginBottom: '1.5rem',
      }}>
        <div style={{ fontWeight: 700, color: '#7c3aed', marginBottom: '1rem', fontSize: '.9rem' }}>
          ✍️ สร้างประกาศใหม่
        </div>

        {/* Target selector */}
        <div style={{ marginBottom: '.85rem' }}>
          <label style={{ display: 'block', fontWeight: 700, fontSize: '.82rem', color: '#374151', marginBottom: '.4rem' }}>
            เป้าหมาย
          </label>
          <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setTarget(TARGET_ALL)}
              style={{
                padding: '.4rem .9rem', borderRadius: '8px', border: 'none', cursor: 'pointer',
                fontFamily: 'inherit', fontWeight: 700, fontSize: '.8rem',
                background: target === TARGET_ALL ? '#1e40af' : '#dbeafe',
                color: target === TARGET_ALL ? 'white' : '#1e40af',
                transition: 'all .12s',
              }}
            >
              📢 ทุกคน
            </button>
            {classList.map(cn => (
              <button
                key={cn}
                type="button"
                onClick={() => setTarget(cn)}
                style={{
                  padding: '.4rem .9rem', borderRadius: '8px', border: 'none', cursor: 'pointer',
                  fontFamily: 'inherit', fontWeight: 700, fontSize: '.8rem',
                  background: target === cn ? '#7c3aed' : '#ede9fe',
                  color: target === cn ? 'white' : '#7c3aed',
                  transition: 'all .12s',
                }}
              >
                🏫 ห้อง {cn}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div style={{ marginBottom: '.75rem' }}>
          <label style={{ display: 'block', fontWeight: 700, fontSize: '.82rem', color: '#374151', marginBottom: '.4rem' }}>
            หัวข้อประกาศ *
          </label>
          <input
            className="input"
            placeholder="หัวข้อ..."
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        </div>

        {/* Body */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontWeight: 700, fontSize: '.82rem', color: '#374151', marginBottom: '.4rem' }}>
            รายละเอียด (ไม่บังคับ)
          </label>
          <textarea
            className="input"
            rows={3}
            placeholder="รายละเอียดเพิ่มเติม..."
            value={body}
            onChange={e => setBody(e.target.value)}
            style={{ resize: 'vertical', fontFamily: 'inherit' }}
          />
        </div>

        {saved && (
          <div className="alert alert-success mb-3">✅ เพิ่มประกาศเรียบร้อยแล้ว</div>
        )}

        <button
          type="button"
          className="btn btn-primary"
          onClick={handleAdd}
          disabled={!title.trim()}
        >
          📢 ประกาศ
        </button>
      </div>

      {/* ─── Announcement list ─── */}
      <div>
        <div style={{ fontWeight: 700, color: '#374151', marginBottom: '.85rem', fontSize: '.9rem', display: 'flex', alignItems: 'center', gap: '.5rem' }}>
          📋 ประกาศล่าสุด
          <span style={{ background: '#f3f4f6', color: '#6b7280', fontSize: '.72rem', padding: '2px 8px', borderRadius: '999px', fontWeight: 600 }}>
            แสดง 3 รายการล่าสุด
          </span>
        </div>

        {announcements.length === 0 ? (
          <div className="text-center text-muted" style={{ padding: '2.5rem' }}>
            ยังไม่มีประกาศ
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
            {latest.map((a, idx) => (
              <div key={a.id} style={{
                display: 'flex', gap: '1rem', alignItems: 'flex-start',
                padding: '1rem 1.25rem', borderRadius: '12px',
                background: idx === 0 ? '#faf5ff' : 'white',
                border: `1.5px solid ${idx === 0 ? '#ddd6fe' : '#e5e7eb'}`,
              }}>
                <div style={{ fontSize: '1.5rem', marginTop: '.1rem' }}>📢</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '.35rem' }}>
                    {idx === 0 && (
                      <span style={{
                        background: '#7c3aed', color: 'white',
                        fontSize: '.65rem', fontWeight: 800,
                        padding: '1px 8px', borderRadius: '999px',
                      }}>ล่าสุด</span>
                    )}
                    <TargetBadge target={a.target} classes={classes} />
                    <span style={{ fontSize: '.72rem', color: '#9ca3af' }}>📅 {a.date}</span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '.9rem', color: '#111827', marginBottom: a.body ? '.3rem' : 0 }}>
                    {a.title}
                  </div>
                  {a.body && (
                    <div style={{ fontSize: '.83rem', color: '#4b5563', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                      {a.body}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(a.id)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#dc2626', fontSize: '1rem', padding: '.25rem', flexShrink: 0,
                  }}
                  title="ลบประกาศ"
                >
                  🗑️
                </button>
              </div>
            ))}
            {announcements.length > 3 && (
              <div style={{ textAlign: 'center', fontSize: '.78rem', color: '#9ca3af' }}>
                มีประกาศเก่าอีก {announcements.length - 3} รายการ (ไม่แสดง)
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
