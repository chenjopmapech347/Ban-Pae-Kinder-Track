import { useState } from 'react';
import { useApp } from '../context/AppContext';

const STAFF_TABS = [
  { id: 'teacher', label: 'ครู',     icon: '👨‍🏫', color: '#7c3aed' },
  { id: 'admin',   label: 'แอดมิน', icon: '🛡️', color: '#f43f5e' },
];

export default function LoginPage() {
  const { login, students, teachers, authConfig, isFirebaseConfigured } = useApp();

  const [roleTab, setRoleTab]       = useState('teacher');
  const [username, setUsername]     = useState('');
  const [pin, setPin]               = useState('');
  const [studentId, setStudentId]   = useState(String(students[0]?.id ?? ''));
  const [studentCode, setStudentCode] = useState(''); // รหัสที่ผู้ปกครองพิมพ์
  const [mode, setMode]             = useState('staff'); // 'staff' | 'parent'
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);

  // ค้นหานักเรียนจากรหัสประจำตัว: code → parentPin → id (fallback)
  const foundStudent = students.find(s => {
    const q = studentCode.trim();
    return (
      (s.code && s.code === q) ||
      (s.parentPin && s.parentPin === q) ||
      String(s.id) === q
    );
  }) ?? null;

  const activeTab = STAFF_TABS.find(t => t.id === roleTab) ?? STAFF_TABS[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    let result;

    if (mode === 'parent') {
      if (!foundStudent) {
        setError('ไม่พบนักเรียนที่มีรหัสนี้');
        setLoading(false);
        return;
      }
      result = login('parent', { pin, studentId: foundStudent.id });
    } else {
      // Admin และ Teacher ใช้ username + PIN
      result = login(roleTab, { username, pin });
    }

    setLoading(false);
    if (!result.ok) setError(result.message);
  };

  return (
    <div className="flex-center animate-fade" style={{ minHeight: '90vh', padding: '1rem' }}>
      <div className="login-card animate-pop">

        {/* Logo */}
        <div className="text-center mb-6">
          <div style={{ marginBottom: '.75rem' }}>
            <img src="/logo.png" alt="โลโก้" style={{ width: '72px', height: '72px', borderRadius: '50%', objectFit: 'cover', boxShadow: '0 4px 16px rgba(124,58,237,.25)' }}
              onError={e => { e.target.style.display='none'; }} />
          </div>
          <h1 style={{
            fontSize: '1.35rem', fontWeight: 800, lineHeight: 1.35,
            color: '#1e1b4b', marginBottom: '.3rem',
          }}>
            ระบบบันทึกพัฒนาการเด็กปฐมวัย
          </h1>
          <p style={{ fontSize: '.9rem', fontWeight: 700, color: '#7c3aed', marginBottom: '.15rem' }}>
            โรงเรียนเทศบาลบ้านเพ ๑
          </p>
          <p style={{ fontSize: '.78rem', color: '#9ca3af', marginBottom: '.1rem', letterSpacing: '.03em' }}>
            Ban Phe 1 · KinderTrack
          </p>
          {isFirebaseConfigured && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '.35rem',
              background: '#d1fae5', color: '#065f46', borderRadius: '999px',
              padding: '.2rem .75rem', fontSize: '.72rem', fontWeight: 700, marginTop: '.5rem',
            }}>
              ☁️ Cloud Sync พร้อม
            </div>
          )}
        </div>

        {/* Mode switch: staff / parent */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem',
          marginBottom: '1.25rem', background: '#f5f3ff', padding: '.4rem', borderRadius: '16px',
        }}>
          {[
            { id: 'staff',  label: '🏫 ครู / แอดมิน' },
            { id: 'parent', label: '👨‍👩‍👧 ผู้ปกครอง' },
          ].map(m => (
            <button key={m.id} type="button"
              onClick={() => { setMode(m.id); setError(''); setPin(''); setUsername(''); }}
              style={{
                padding: '.6rem', borderRadius: '12px', border: 'none',
                fontFamily: 'inherit', fontWeight: 700, fontSize: '.82rem', cursor: 'pointer',
                transition: 'all .2s',
                background: mode === m.id ? 'white' : 'transparent',
                color: mode === m.id ? '#7c3aed' : 'var(--text-muted)',
                boxShadow: mode === m.id ? '0 2px 8px rgba(0,0,0,.1)' : 'none',
              }}>
              {m.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* ─── Staff mode ─── */}
          {mode === 'staff' && (
            <>
              {/* Role tabs (teacher / admin) */}
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '.5rem',
                background: '#faf9ff', padding: '.35rem', borderRadius: '12px',
              }}>
                {STAFF_TABS.map(tab => (
                  <button key={tab.id} type="button"
                    onClick={() => { setRoleTab(tab.id); setError(''); }}
                    style={{
                      padding: '.5rem', borderRadius: '10px', border: 'none',
                      fontFamily: 'inherit', fontWeight: 700, fontSize: '.82rem', cursor: 'pointer',
                      transition: 'all .2s',
                      background: roleTab === tab.id ? 'white' : 'transparent',
                      color: roleTab === tab.id ? tab.color : 'var(--text-muted)',
                      boxShadow: roleTab === tab.id ? '0 2px 6px rgba(0,0,0,.1)' : 'none',
                    }}>
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>

              {/* Username + PIN */}
              <div>
                <label style={{ display: 'block', marginBottom: '.35rem' }}>
                  👤 ชื่อผู้ใช้ (Username)
                </label>
                <input
                  className="input"
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder={roleTab === 'admin' ? 'admin' : 'เช่น chalada, somchai'}
                  required
                  autoComplete="username"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '.35rem' }}>🔑 รหัสผ่าน (PIN)</label>
                <input className="input" type="password" value={pin}
                  onChange={e => setPin(e.target.value)}
                  placeholder={roleTab === 'admin' ? 'รหัสแอดมิน' : 'เช่น kru01, kru02'}
                  required
                  style={{ fontSize: '1.1rem', letterSpacing: '.15em' }} />
                {isFirebaseConfigured && (
                  <div className="text-xs text-muted mt-2">
                    ☁️ Cloud Sync พร้อม — ข้อมูลจะถูกบันทึกขึ้น Cloud
                  </div>
                )}
              </div>
            </>
          )}

          {/* ─── Parent mode ─── */}
          {mode === 'parent' && (
            <>
              {/* Step 1: พิมพ์รหัสประจำตัว */}
              <div>
                <label style={{ display: 'block', marginBottom: '.35rem', fontWeight: 700 }}>
                  🔢 รหัสประจำตัวบุตรหลาน
                </label>
                <input
                  className="input"
                  type="text"
                  inputMode="numeric"
                  value={studentCode}
                  onChange={e => { setStudentCode(e.target.value); setError(''); }}
                  placeholder="เช่น 1420"
                  autoComplete="off"
                  style={{ fontSize: '1.15rem', letterSpacing: '.1em', fontWeight: 700 }}
                />
              </div>

              {/* แสดงชื่อบุตรหลานเมื่อพบ */}
              {studentCode.trim() !== '' && (
                <div style={{
                  borderRadius: '14px', padding: '.85rem 1rem',
                  background: foundStudent ? '#d1fae5' : '#fee2e2',
                  border: `1.5px solid ${foundStudent ? '#6ee7b7' : '#fca5a5'}`,
                  display: 'flex', alignItems: 'center', gap: '.75rem',
                  transition: 'all .2s',
                }}>
                  <span style={{ fontSize: '1.6rem', flexShrink: 0 }}>
                    {foundStudent
                      ? (foundStudent.gender === 'ชาย' ? '👦' : '👧')
                      : '❓'}
                  </span>
                  <div>
                    {foundStudent ? (
                      <>
                        <div style={{ fontWeight: 800, fontSize: '.95rem', color: '#065f46' }}>
                          {foundStudent.name}
                        </div>
                        <div style={{ fontSize: '.75rem', color: '#059669', marginTop: '.1rem' }}>
                          ชั้น {foundStudent.className} · รหัส {foundStudent.code}
                        </div>
                      </>
                    ) : (
                      <div style={{ fontWeight: 700, color: '#991b1b', fontSize: '.88rem' }}>
                        ไม่พบนักเรียนที่มีรหัสนี้
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: PIN — แสดงเมื่อพบนักเรียนแล้ว */}
              {foundStudent && (
                <div>
                  <label style={{ display: 'block', marginBottom: '.35rem', fontWeight: 700 }}>
                    🔑 รหัส PIN ผู้ปกครอง
                  </label>
                  <input
                    className="input"
                    type="password"
                    value={pin}
                    onChange={e => setPin(e.target.value)}
                    placeholder="กรอก PIN"
                    required
                    autoFocus
                    style={{ fontSize: '1.25rem', letterSpacing: '.25em' }}
                  />
                  <div className="text-xs text-muted mt-2">
                    💡 PIN คือรหัสประจำตัวนักเรียน ถ้าไม่ทราบให้ติดต่อครูประจำชั้น
                  </div>
                </div>
              )}
            </>
          )}

          {error && (
            <div className="alert alert-error animate-slide">❌ {error}</div>
          )}

          {(mode !== 'parent' || foundStudent) && (
            <button type="submit" className="btn btn-lg w-full" disabled={loading}
              style={{
                background: mode === 'parent'
                  ? 'linear-gradient(135deg,#f59e0b,#fbbf24)'
                  : 'linear-gradient(135deg,' + activeTab.color + ',' + activeTab.color + 'cc)',
                color: 'white',
                boxShadow: '0 6px 20px ' + (mode === 'parent' ? '#f59e0b' : activeTab.color) + '40',
                marginTop: '.25rem',
              }}>
              {loading ? '⏳ กำลังเข้าสู่ระบบ...' : '🚀 เข้าสู่ระบบ'}
            </button>
          )}
        </form>

        {/* PIN hint (ถ้า Firebase ยังไม่ได้ตั้งค่า) */}
        {!isFirebaseConfigured && (
          <details className="mt-5" style={{ fontSize: '.78rem', color: 'var(--text-muted)' }}>
            <summary style={{ cursor: 'pointer', userSelect: 'none', fontWeight: 600 }}>
              🔑 รหัสปัจจุบัน (ตั้งค่า Firebase เพื่อใช้อีเมลแทน)
            </summary>
            <div style={{
              marginTop: '.75rem', background: '#f5f3ff', borderRadius: '12px',
              padding: '.75rem', display: 'flex', flexDirection: 'column', gap: '.35rem',
            }}>
              <div>🛡️ แอดมิน: <code style={{ background: '#ffe4e6', padding: '.1rem .4rem', borderRadius: '6px' }}>{authConfig.admin.pin}</code></div>
              <div style={{ fontWeight: 700, marginTop: '.5rem', color: '#7c3aed' }}>👨‍🏫 ครู (PIN รายคน):</div>
              {teachers.map(t => (
                <div key={t.id} style={{ paddingLeft: '1rem' }}>
                  {t.name} ({t.level}):{' '}
                  <code style={{ background: '#ede9fe', padding: '.1rem .4rem', borderRadius: '6px' }}>{t.pin}</code>
                </div>
              ))}
              <div style={{ fontWeight: 700, marginTop: '.5rem', color: '#b45309' }}>👨‍👩‍👧 ผู้ปกครอง (PIN รายนักเรียน):</div>
              {students.slice(0, 5).map(s => (
                <div key={s.id} style={{ paddingLeft: '1rem' }}>
                  {s.name}:{' '}
                  <code style={{ background: '#fef3c7', padding: '.1rem .4rem', borderRadius: '6px' }}>{s.parentPin}</code>
                </div>
              ))}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
