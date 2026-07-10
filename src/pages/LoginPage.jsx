import { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { version as APP_VERSION } from '../../package.json';

// ─── Live Feed Ticker ─────────────────────────────────────────────────────────
function LiveTicker({ items }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let x = 0;
    const speed = 0.6;
    const step = () => {
      x -= speed;
      if (el.scrollWidth > 0 && Math.abs(x) >= el.scrollWidth / 2) x = 0;
      el.style.transform = `translateX(${x}px)`;
      raf = requestAnimationFrame(step);
    };
    let raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [items]);

  const doubled = [...items, ...items]; // loop
  return (
    <div style={{
      overflow: 'hidden', whiteSpace: 'nowrap',
      flex: 1, position: 'relative',
    }}>
      <div ref={ref} style={{ display: 'inline-flex', gap: '2.5rem', willChange: 'transform' }}>
        {doubled.map((item, i) => (
          <span key={i} style={{ fontSize: '.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>
            <span style={{ color: '#86efac', marginRight: '.4rem' }}>●</span>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon, value, label, color = '#7c3aed' }) {
  return (
    <div style={{
      flex: '1 1 0', minWidth: '110px',
      background: 'rgba(255,255,255,0.07)',
      border: '1.5px solid rgba(255,255,255,0.18)',
      borderRadius: '16px', padding: '1.1rem 1rem',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.3rem',
      backdropFilter: 'blur(6px)',
    }}>
      <div style={{ fontSize: '1.5rem', lineHeight: 1 }}>{icon}</div>
      <div style={{ fontSize: '1.9rem', fontWeight: 900, color: 'white', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '.68rem', fontWeight: 700, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '.08em', textAlign: 'center' }}>
        {label}
      </div>
    </div>
  );
}

// ─── Class Card ──────────────────────────────────────────────────────────────
function ClassCard({ cls, studentCount, topics }) {
  const colors = ['#7c3aed','#0891b2','#059669','#f59e0b','#f43f5e'];
  const c = colors[cls.id % colors.length] ?? '#7c3aed';
  return (
    <div style={{
      background: 'white', borderRadius: '16px', padding: '1.25rem',
      border: `2px solid ${c}22`,
      boxShadow: `0 4px 20px ${c}15`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '.85rem' }}>
        <div style={{
          width: '44px', height: '44px', borderRadius: '12px',
          background: `${c}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.5rem', flexShrink: 0,
        }}>🏫</div>
        <div>
          <div style={{ fontWeight: 800, fontSize: '.95rem', color: '#1e1b4b' }}>{cls.name}</div>
          <div style={{ fontSize: '.75rem', color: '#6b7280', marginTop: '.1rem' }}>
            👶 {studentCount} คน
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.35rem' }}>
        {topics.slice(0, 5).map((t, i) => (
          <span key={i} style={{
            background: `${c}12`, color: c, borderRadius: '999px',
            padding: '.2rem .6rem', fontSize: '.7rem', fontWeight: 700,
          }}>
            {t.emoji ?? '📋'} {t.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Login Modal ──────────────────────────────────────────────────────────────
// Role badge config
const ROLE_BADGE = {
  admin:   { icon: '🛡️', label: 'แอดมิน',    bg: '#fee2e2', color: '#dc2626', btnBg: 'linear-gradient(135deg,#f43f5e,#fb7185)', shadow: '#f43f5e40' },
  teacher: { icon: '👨‍🏫', label: 'ครู',        bg: '#ede9fe', color: '#7c3aed', btnBg: 'linear-gradient(135deg,#7c3aed,#8b5cf6)', shadow: '#7c3aed40' },
  parent:  { icon: '👨‍👩‍👧', label: 'ผู้ปกครอง', bg: '#d1fae5', color: '#059669', btnBg: 'linear-gradient(135deg,#f59e0b,#fbbf24)', shadow: '#f59e0b40' },
};

function LoginModal({ onClose }) {
  const { login, students, teachers, authConfig, isFirebaseConfigured } = useApp();

  const [username, setUsername] = useState('');
  const [pin, setPin]           = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  // ── Live role detection ──────────────────────────────────────────────────────
  const detectedRole = useMemo(() => {
    const u = username.trim().toLowerCase();
    if (!u) return null;
    // Admin: username must be 'admin'
    if (u === 'admin') return 'admin';
    // Teacher: check username / email / name fields
    const isTeacher = teachers.some(t =>
      t.username?.trim().toLowerCase() === u ||
      t.email?.trim().toLowerCase() === u ||
      t.name?.trim() === username.trim()
    );
    if (isTeacher) return 'teacher';
    // Parent: student code / id / parentPin
    const q = username.trim();
    const isParent = students.some(s =>
      (s.code && s.code === q) || String(s.id) === q || (s.parentPin && s.parentPin === q)
    );
    if (isParent) return 'parent';
    return null;
  }, [username, teachers, students]);

  // Teacher name hint
  const detectedTeacher = detectedRole === 'teacher'
    ? teachers.find(t => {
        const u = username.trim().toLowerCase();
        return t.username?.trim().toLowerCase() === u ||
          t.email?.trim().toLowerCase() === u ||
          t.name?.trim() === username.trim();
      })
    : null;

  // Student card for parent
  const foundStudent = detectedRole === 'parent'
    ? (students.find(s => {
        const q = username.trim();
        return (s.code && s.code === q) || String(s.id) === q || (s.parentPin && s.parentPin === q);
      }) ?? null)
    : null;

  const badge = detectedRole ? ROLE_BADGE[detectedRole] : null;

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const u = username.trim();

    // Try admin
    if (u.toLowerCase() === 'admin') {
      const result = login('admin', { username: 'admin', pin });
      setLoading(false);
      if (!result.ok) setError(result.message);
      return;
    }

    // Try teacher
    const teacherResult = login('teacher', { username: u, pin });
    if (teacherResult.ok) { setLoading(false); return; }

    // Try parent (username = student code / id)
    const student = students.find(s =>
      (s.code && s.code === u) || String(s.id) === u || (s.parentPin && s.parentPin === u)
    );
    if (student) {
      const parentResult = login('parent', { studentId: student.id, pin });
      setLoading(false);
      if (!parentResult.ok) setError('รหัส PIN ไม่ถูกต้อง');
      return;
    }

    // Nothing matched
    setLoading(false);
    setError('ไม่พบบัญชีผู้ใช้นี้ กรุณาตรวจสอบ username หรือรหัสนักเรียน');
  };

  return (
    /* backdrop */
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(15,10,40,0.65)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem', animation: 'fadeIn .2s ease',
      }}
    >
      <div className="login-card animate-pop" style={{ position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Close */}
        <button type="button" onClick={onClose} style={{
          position: 'absolute', top: '1rem', right: '1rem',
          background: '#f3f4f6', border: 'none', borderRadius: '50%',
          width: '32px', height: '32px', cursor: 'pointer',
          fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>✕</button>

        {/* Logo */}
        <div className="text-center mb-6">
          <div style={{ marginBottom: '.75rem' }}>
            <img src="/logo.png" alt="โลโก้" style={{
              width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover',
              boxShadow: '0 4px 16px rgba(124,58,237,.25)',
            }} onError={e => { e.target.style.display = 'none'; }} />
          </div>
          <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1e1b4b', marginBottom: '.2rem' }}>
            เข้าสู่ระบบ
          </h1>
          <p style={{ fontSize: '.78rem', color: '#7c3aed', fontWeight: 700 }}>
            ระบบบันทึกพัฒนาการเด็กปฐมวัย
          </p>
          {isFirebaseConfigured && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '.35rem',
              background: '#d1fae5', color: '#065f46', borderRadius: '999px',
              padding: '.2rem .75rem', fontSize: '.7rem', fontWeight: 700, marginTop: '.5rem',
            }}>☁️ Cloud Sync พร้อม</div>
          )}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Username */}
          <div>
            <label style={{ display: 'block', marginBottom: '.35rem', fontWeight: 700 }}>
              👤 ชื่อผู้ใช้ / รหัสประจำตัว
            </label>
            <input className="input" type="text" value={username}
              onChange={e => { setUsername(e.target.value); setError(''); }}
              placeholder="admin · ชื่อครู · หรือรหัสนักเรียน"
              required autoComplete="username" autoFocus />
          </div>

          {/* Role detection badge — แสดงทันทีที่พิมพ์ username ถูก */}
          {badge && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '.75rem',
              background: badge.bg, border: `1.5px solid ${badge.color}30`,
              borderRadius: '14px', padding: '.7rem 1rem',
              animation: 'fadeIn .2s ease',
            }}>
              <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>{badge.icon}</span>
              <div>
                <div style={{ fontWeight: 800, fontSize: '.82rem', color: badge.color }}>
                  พบบัญชี: {badge.label}
                </div>
                {detectedTeacher && (
                  <div style={{ fontSize: '.72rem', color: badge.color, opacity: .75, marginTop: '.1rem' }}>
                    {detectedTeacher.name}
                  </div>
                )}
                {detectedRole === 'parent' && foundStudent && (
                  <div style={{ fontSize: '.72rem', color: badge.color, opacity: .75, marginTop: '.1rem' }}>
                    {foundStudent.name} · ชั้น {foundStudent.className}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Parent: student card */}
          {detectedRole === 'parent' && foundStudent && (
            <div style={{
              borderRadius: '14px', padding: '.85rem 1rem',
              background: '#d1fae5', border: '1.5px solid #6ee7b7',
              display: 'flex', alignItems: 'center', gap: '.75rem',
            }}>
              <span style={{ fontSize: '1.6rem', flexShrink: 0 }}>
                {foundStudent.gender === 'ชาย' ? '👦' : '👧'}
              </span>
              <div>
                <div style={{ fontWeight: 800, fontSize: '.95rem', color: '#065f46' }}>{foundStudent.name}</div>
                <div style={{ fontSize: '.75rem', color: '#059669', marginTop: '.1rem' }}>
                  ชั้น {foundStudent.className} · รหัส {foundStudent.code}
                </div>
              </div>
            </div>
          )}

          {/* PIN */}
          <div>
            <label style={{ display: 'block', marginBottom: '.35rem', fontWeight: 700 }}>
              🔑 รหัสผ่าน (PIN)
            </label>
            <input className="input" type="password" value={pin}
              onChange={e => setPin(e.target.value)}
              placeholder={
                detectedRole === 'admin'   ? 'รหัสแอดมิน' :
                detectedRole === 'parent'  ? 'PIN ผู้ปกครอง' :
                detectedRole === 'teacher' ? 'เช่น kru01, kru02' :
                'รหัสผ่าน / PIN'
              }
              required style={{ fontSize: '1.1rem', letterSpacing: '.15em' }} />
            {detectedRole === 'parent' && (
              <div className="text-xs text-muted mt-2">
                💡 PIN คือรหัสประจำตัวนักเรียน ถ้าไม่ทราบให้ติดต่อครูประจำชั้น
              </div>
            )}
          </div>

          {error && <div className="alert alert-error animate-slide">❌ {error}</div>}

          <button type="submit" className="btn btn-lg w-full" disabled={loading}
            style={{
              background: badge?.btnBg ?? 'linear-gradient(135deg,#7c3aed,#8b5cf6)',
              color: 'white',
              boxShadow: `0 6px 20px ${badge?.shadow ?? '#7c3aed40'}`,
              marginTop: '.25rem',
            }}>
            {loading ? '⏳ กำลังเข้าสู่ระบบ...' : '🚀 เข้าสู่ระบบ'}
          </button>
        </form>

        {/* PIN hint */}
        <details className="mt-5" style={{ fontSize: '.78rem', color: 'var(--text-muted)' }}>
          <summary style={{ cursor: 'pointer', userSelect: 'none', fontWeight: 600 }}>
            🔑 ข้อมูลสำหรับทดสอบระบบ
          </summary>
          <div style={{ marginTop: '.75rem', display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
            <div style={{
              background: '#fffbeb', border: '1.5px solid #fcd34d', borderRadius: '12px',
              padding: '.75rem', display: 'flex', flexDirection: 'column', gap: '.3rem',
            }}>
              <div style={{ fontWeight: 800, color: '#92400e', marginBottom: '.2rem' }}>⚡ บัญชีทดสอบระบบ</div>
              <div>🛡️ <strong>แอดมิน</strong> — <code style={{ background: '#fef3c7', padding: '.1rem .4rem', borderRadius: '6px' }}>admin</code> / <code style={{ background: '#fef3c7', padding: '.1rem .4rem', borderRadius: '6px' }}>test1234</code></div>
              <div>👨‍🏫 <strong>ครู</strong> — <code style={{ background: '#fef3c7', padding: '.1rem .4rem', borderRadius: '6px' }}>test_teacher</code> / <code style={{ background: '#fef3c7', padding: '.1rem .4rem', borderRadius: '6px' }}>test1234</code></div>
              <div>👨‍👩‍👧 <strong>ผู้ปกครอง</strong> — รหัส: <code style={{ background: '#fef3c7', padding: '.1rem .4rem', borderRadius: '6px' }}>test001</code> PIN: <code style={{ background: '#fef3c7', padding: '.1rem .4rem', borderRadius: '6px' }}>test1234</code></div>
            </div>
            <div style={{ background: '#f5f3ff', borderRadius: '12px', padding: '.75rem', display: 'flex', flexDirection: 'column', gap: '.3rem' }}>
              <div style={{ fontWeight: 700, color: '#6d28d9', marginBottom: '.2rem' }}>🔐 บัญชีจริงในระบบ</div>
              <div>🛡️ <strong>แอดมิน</strong> — <code style={{ background: '#ede9fe', padding: '.1rem .4rem', borderRadius: '6px' }}>admin</code> / <code style={{ background: '#ede9fe', padding: '.1rem .4rem', borderRadius: '6px' }}>{authConfig.admin.pin}</code></div>
              <div style={{ fontWeight: 700, color: '#7c3aed', marginTop: '.3rem' }}>👨‍🏫 ครู:</div>
              {teachers.filter(t => t.id !== 9999).map(t => (
                <div key={t.id} style={{ paddingLeft: '1rem' }}>
                  {t.name} — <code style={{ background: '#ede9fe', padding: '.1rem .4rem', borderRadius: '6px' }}>{t.username}</code> / <code style={{ background: '#ede9fe', padding: '.1rem .4rem', borderRadius: '6px' }}>{t.pin}</code>
                </div>
              ))}
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}

// ─── Guide Tab ────────────────────────────────────────────────────────────────
const GUIDE_ROLES = [
  {
    id: 'admin',
    label: '🛡️ ผู้ดูแลระบบ (Admin)',
    color: '#7c3aed',
    bg: '#f5f3ff',
    border: '#c4b5fd',
    intro: 'Admin มีสิทธิ์เข้าถึงทุกส่วนของระบบ สามารถจัดการข้อมูลทั้งหมด ตั้งค่าระบบ และดูรายงานภาพรวม',
    sections: [
      {
        icon: '🏠', title: 'ภาพรวมและประกาศ',
        items: [
          'ดูสถิติรวม — นักเรียน / ครู / ห้องเรียน / บันทึก',
          'จัดการประกาศของโรงเรียน (เพิ่ม / แก้ไข / ลบ)',
          'ใช้ 🤖 AI ผู้ช่วย เพื่อถามคำถามหรือขอคำแนะนำ',
        ],
      },
      {
        icon: '📅', title: 'กิจกรรมประจำวัน',
        items: [
          'บันทึกการมาเรียน — มา / ลา / ขาด แยกรายคน',
          'รับกลับบ้าน — บันทึกผู้รับและเวลา',
          'ตรวจสุขภาพ / คัดกรองอาการป่วย',
          'แปรงฟัน / อาหารกลางวัน / ดื่มนม',
          'ภาวะโภชนาการ — น้ำหนัก / ส่วนสูง',
        ],
      },
      {
        icon: '📊', title: 'รายงานและประเมินผล',
        items: [
          'สมุดรายงานประจำตัวเด็ก (อ.01) — ออกเอกสารรายบุคคล',
          'ประเมินผลพัฒนาการ — บันทึกรายด้าน / ตัวบ่งชี้',
          'รายงานสรุป — ภาพรวมห้อง / แนวโน้ม / AI สรุป',
          'ประวัติการประเมิน — ดูย้อนหลังทุกบันทึก',
          'มาตรฐานแห่งชาติ — แผนที่มาตรฐานการศึกษาปฐมวัย',
        ],
      },
      {
        icon: '👥', title: 'บุคลากรและสื่อ',
        items: [
          'จัดการนักเรียน — เพิ่ม / แก้ไข / ลบ / จัดชั้น',
          'จัดการครู — กำหนด username, PIN และห้องเรียน',
          'จัดการห้องเรียน — ชื่อ, ระดับ, ครูประจำชั้น',
          'ทะเบียนผลิตสื่อการเรียนการสอน',
          'แหล่งเรียนรู้นอกห้องเรียน / มุมประสบการณ์ในห้อง',
          'รายงานพัฒนาการรายบุคคล',
        ],
      },
      {
        icon: '⚙️', title: 'ตั้งค่าระบบ',
        items: [
          'ข้อมูลโรงเรียน / ปีการศึกษา / ภาคเรียน',
          'หัวข้อประเมิน และตัวบ่งชี้แต่ละด้าน',
          'กิจกรรมและกำหนดการ',
          'วันหยุดราชการ / วันหยุดพิเศษ',
          'แผนที่มาตรฐานการศึกษาปฐมวัย',
          'ตั้งค่า Firebase Cloud Sync และ AI API Key',
          'เปลี่ยนรหัสผ่าน Admin',
        ],
      },
    ],
  },
  {
    id: 'teacher',
    label: '👩‍🏫 ครู (Teacher)',
    color: '#0891b2',
    bg: '#f0f9ff',
    border: '#7dd3fc',
    intro: 'ครูสามารถบันทึกกิจกรรมประจำวัน ประเมินพัฒนาการนักเรียน และดูรายงานสรุปของห้องเรียนตัวเอง',
    sections: [
      {
        icon: '🔑', title: 'การเข้าสู่ระบบ',
        items: [
          'Username: ชื่อย่อที่ Admin กำหนด (เช่น chalada, somchai)',
          'รหัสผ่าน (PIN): Admin กำหนดให้ เช่น kru01, kru02',
          'เปลี่ยนรหัสผ่านได้เองจากปุ่ม 🔑 ที่มุมบนขวา',
        ],
      },
      {
        icon: '📅', title: 'กิจกรรมประจำวัน',
        items: [
          'เช็คชื่อนักเรียน — มา / ลาป่วย / ลากิจ / ขาด',
          'บันทึกการรับกลับบ้าน — ชื่อผู้รับและเวลา',
          'ตรวจสุขภาพรายวัน และคัดกรองอาการป่วย',
          'บันทึกการแปรงฟัน / รับประทานอาหาร / ดื่มนม',
          'วัดน้ำหนัก-ส่วนสูง ติดตามภาวะโภชนาการ',
        ],
      },
      {
        icon: '📊', title: 'ประเมินพัฒนาการ',
        items: [
          'ประเมินนักเรียนรายคน แยกตามด้านพัฒนาการ',
          'ปุ่ม 🤖 AI แนะนำกิจกรรม ตามผลประเมิน',
          'สมุดรายงานประจำตัวเด็ก (อ.01) — พิมพ์ได้ทันที',
          'AI ช่วยเขียนความคิดเห็นของครู',
          'ดูรายงานสรุปภาพรวมห้องเรียน / แนวโน้ม',
        ],
      },
      {
        icon: '🤖', title: 'AI ผู้ช่วย',
        items: [
          'แชทกับ AI ได้โดยตรง — ถามเรื่องพัฒนาการเด็ก',
          'ขอแผนการสอน / กิจกรรม / สื่อการเรียน',
          'AI สรุปภาพรวมห้องเรียนจากข้อมูลจริง',
          'ต้องตั้งค่า Anthropic API Key ในหน้าตั้งค่าก่อน',
        ],
      },
      {
        icon: '📋', title: 'สื่อและแหล่งเรียนรู้',
        items: [
          'บันทึกสื่อการสอนที่ผลิต',
          'จัดการแหล่งเรียนรู้นอกห้อง / มุมประสบการณ์ในห้อง',
          'รายงานพัฒนาการรายบุคคล',
        ],
      },
    ],
  },
  {
    id: 'parent',
    label: '👨‍👩‍👧 ผู้ปกครอง (Parent)',
    color: '#059669',
    bg: '#f0fdf4',
    border: '#6ee7b7',
    intro: 'ผู้ปกครองสามารถเข้าดูข้อมูลพัฒนาการและบันทึกประจำวันของบุตรหลานได้อย่างปลอดภัย',
    sections: [
      {
        icon: '🔑', title: 'การเข้าสู่ระบบ',
        items: [
          'ใส่รหัสประจำตัวนักเรียนในช่อง "ชื่อผู้ใช้" (เช่น 68001)',
          'ระบบจะแสดงชื่อบุตรหลานให้ยืนยันโดยอัตโนมัติ',
          'รหัสผ่าน (PIN): รหัสประจำตัวนักเรียน (ตัวเดียวกัน)',
          'กรณีจำรหัสไม่ได้ — ติดต่อครูประจำชั้น',
        ],
      },
      {
        icon: '📈', title: 'ข้อมูลที่ดูได้',
        items: [
          'ผลการประเมินพัฒนาการ 4 ด้านหลัก',
          'บันทึกการมาเรียน / การขาด / การลา',
          'ข้อมูลสุขภาพ — น้ำหนัก / ส่วนสูง / ภาวะโภชนาการ',
          'สมุดรายงานประจำตัวเด็ก (อ.01)',
          'ประกาศของโรงเรียน',
        ],
      },
      {
        icon: '🔒', title: 'ความปลอดภัยของข้อมูล',
        items: [
          'ดูได้เฉพาะข้อมูลของบุตรหลานตัวเอง',
          'ไม่สามารถแก้ไขหรือลบข้อมูลได้',
          'ข้อมูลส่วนตัวไม่แสดงบนหน้าสาธารณะ',
        ],
      },
    ],
  },
];

function GuideSection({ section, color }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{
        fontSize: '.78rem', fontWeight: 800, color, textTransform: 'uppercase',
        letterSpacing: '.06em', marginBottom: '.5rem',
        display: 'flex', alignItems: 'center', gap: '.4rem',
      }}>
        <span>{section.icon}</span> {section.title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.35rem' }}>
        {section.items.map((item, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: '.5rem',
            fontSize: '.82rem', color: '#374151', lineHeight: 1.5,
          }}>
            <span style={{
              color, fontWeight: 800, flexShrink: 0, marginTop: '.05rem',
              fontSize: '.7rem',
            }}>▸</span>
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function GuideTab() {
  const [activeRole, setActiveRole] = useState('admin');
  const role = GUIDE_ROLES.find(r => r.id === activeRole);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h3 style={{
        fontSize: '.85rem', fontWeight: 800, color: '#374151', margin: 0,
        textTransform: 'uppercase', letterSpacing: '.07em',
      }}>
        📖 คู่มือการใช้งานระบบ KinderTrack
      </h3>

      {/* Role selector */}
      <div style={{
        display: 'flex', gap: '.5rem', flexWrap: 'wrap',
        background: '#f9fafb', borderRadius: '12px',
        padding: '.5rem', border: '1px solid #e5e7eb',
      }}>
        {GUIDE_ROLES.map(r => {
          const isActive = activeRole === r.id;
          return (
            <button key={r.id} type="button"
              onClick={() => setActiveRole(r.id)}
              style={{
                flex: 1, minWidth: '140px',
                padding: '.55rem 1rem', borderRadius: '9px',
                border: isActive ? `2px solid ${r.color}` : '2px solid transparent',
                background: isActive ? r.color : 'white',
                color: isActive ? 'white' : '#4b5563',
                fontFamily: 'inherit', fontWeight: 700,
                fontSize: '.83rem', cursor: 'pointer',
                transition: 'all .15s',
                boxShadow: isActive ? `0 3px 10px ${r.color}35` : '0 1px 3px rgba(0,0,0,.06)',
              }}
            >
              {r.label}
            </button>
          );
        })}
      </div>

      {/* Content card */}
      {role && (
        <div style={{
          background: role.bg, border: `1.5px solid ${role.border}`,
          borderRadius: '14px', padding: '1.25rem 1.5rem',
          animation: 'fadeIn .2s ease',
        }}>
          {/* Intro */}
          <div style={{
            fontSize: '.85rem', color: '#1f2937', lineHeight: 1.7,
            fontWeight: 600, marginBottom: '1.25rem',
            paddingBottom: '.9rem', borderBottom: `1.5px solid ${role.border}`,
          }}>
            {role.intro}
          </div>

          {/* Sections grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '1rem 2rem',
          }}>
            {role.sections.map((sec, i) => (
              <GuideSection key={i} section={sec} color={role.color} />
            ))}
          </div>
        </div>
      )}

      {/* Quick tips */}
      <div style={{
        background: '#fffbeb', border: '1.5px solid #fde68a',
        borderRadius: '12px', padding: '1rem 1.25rem',
      }}>
        <div style={{ fontWeight: 800, fontSize: '.8rem', color: '#92400e', marginBottom: '.6rem' }}>
          💡 เคล็ดลับการใช้งาน
        </div>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '.4rem',
        }}>
          {[
            '☁️ ข้อมูลบันทึกอัตโนมัติทุก 4 วินาที',
            '🔄 Sync Firebase — แสดงสถานะมุมบนขวา',
            '🖨️ พิมพ์รายงานได้จากทุกหน้า (Ctrl+P)',
            '📱 รองรับมือถือและแท็บเล็ต',
            '🔑 เปลี่ยน PIN ได้เองโดยไม่ต้องแจ้ง Admin',
            '🤖 AI ต้องใช้ Anthropic API Key — ตั้งค่าในหน้า Settings',
          ].map((tip, i) => (
            <div key={i} style={{
              fontSize: '.78rem', color: '#78350f', lineHeight: 1.5,
              display: 'flex', alignItems: 'flex-start', gap: '.4rem',
            }}>
              <span style={{ flexShrink: 0 }}>•</span> {tip}
            </div>
          ))}
        </div>
      </div>

      {/* Contact */}
      <div style={{
        background: 'white', border: '1.5px solid #e5e7eb',
        borderRadius: '12px', padding: '.9rem 1.25rem',
        display: 'flex', alignItems: 'center', gap: '1rem',
        flexWrap: 'wrap',
      }}>
        <div style={{ fontWeight: 800, fontSize: '.8rem', color: '#374151' }}>
          📞 ต้องการความช่วยเหลือ?
        </div>
        <div style={{ fontSize: '.78rem', color: '#6b7280', lineHeight: 1.6 }}>
          ติดต่อ Admin ของโรงเรียน หรือผู้ดูแลระบบ KinderTrack
        </div>
      </div>
    </div>
  );
}

// ─── Main Landing Page ────────────────────────────────────────────────────────
export default function LoginPage() {
  const {
    students, teachers, classes, schools, assessmentTopics,
    academicYear, isFirebaseConfigured, dailyRecords,
  } = useApp();

  const [showLogin, setShowLogin] = useState(false);
  const [publicTab, setPublicTab] = useState('overview');

  // ── สถิติสาธารณะ (ไม่มีข้อมูลส่วนตัว) ──────────────────
  const realStudents = students.filter(s => !s.name?.startsWith('(ว่าง)') && s.id !== 9999);
  const realTeachers = teachers.filter(t => t.id !== 9999);
  const realClasses  = classes.filter(c => c.id !== 9999);
  const schoolName   = schools?.[0]?.name ?? 'โรงเรียนเทศบาลบ้านเพ ๑';

  // นับบันทึกรวมทั้งปี
  const totalRecords = Object.keys(dailyRecords ?? {}).length;

  // Ticker items — ชื่อห้องเรียน + จำนวนนักเรียน
  const tickerItems = [
    `ปีการศึกษา ${academicYear}`,
    ...realClasses.map(c => {
      const count = realStudents.filter(s => s.classId === c.id).length;
      return `${c.name}: ${count} คน`;
    }),
    `ครูทั้งหมด ${realTeachers.length} ท่าน`,
    `หัวข้อประเมิน ${assessmentTopics.length} ด้าน`,
    isFirebaseConfigured ? '☁️ ระบบ Cloud Sync พร้อม' : '💾 ระบบออฟไลน์พร้อม',
  ];

  // Tabs
  const PUBLIC_TABS = [
    { id: 'overview', label: '🏫 ภาพรวม' },
    { id: 'classes',  label: `📚 ห้องเรียน (${realClasses.length})` },
    { id: 'guide',    label: '📖 คู่มือ' },
  ];

  return (
    <>
      {/* ════════════════════════════════════════════════════
          LANDING PAGE
      ════════════════════════════════════════════════════ */}
      <div style={{ minHeight: '100vh', background: '#f8f7ff' }}>

        {/* ── Header ──────────────────────────────────────── */}
        <div style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #4c1d95 50%, #6d28d9 100%)',
          padding: '0',
        }}>
          {/* Top bar */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '1rem 1.5rem',
            flexWrap: 'wrap', gap: '.75rem',
          }}>
            {/* Left: Logo + Title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '.85rem' }}>
              <img src="/logo.png" alt="โลโก้"
                style={{ width: '52px', height: '52px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.35)', flexShrink: 0 }}
                onError={e => { e.target.style.display = 'none'; }} />
              <div>
                <div style={{ fontWeight: 900, fontSize: '1rem', color: 'white', lineHeight: 1.3 }}>
                  {schoolName}
                </div>
                <div style={{ fontSize: '.72rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                  ระบบบันทึกพัฒนาการเด็กปฐมวัย · KinderTrack
                </div>
              </div>
            </div>

            {/* Right: status badge + Login button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '.45rem',
                background: 'rgba(255,255,255,0.1)', borderRadius: '999px',
                padding: '.35rem 1rem', border: '1.5px solid rgba(255,255,255,0.25)',
              }}>
                <span style={{
                  width: '8px', height: '8px', borderRadius: '50%', background: '#4ade80',
                  boxShadow: '0 0 6px #4ade80', animation: 'pulse 2s infinite', flexShrink: 0,
                }} />
                <span style={{ fontSize: '.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.9)', letterSpacing: '.02em' }}>
                  ระบบพร้อมใช้งาน {isFirebaseConfigured ? '· ☁️ Cloud Sync' : ''}
                </span>
              </div>
              <button type="button"
                onClick={() => setShowLogin(true)}
                style={{
                  background: 'white', color: '#7c3aed',
                  border: 'none', borderRadius: '999px',
                  padding: '.5rem 1.3rem', fontFamily: 'inherit',
                  fontWeight: 800, fontSize: '.88rem', cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
                  transition: 'all .15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}>
                🚀 เข้าสู่ระบบ
              </button>
            </div>
          </div>

          {/* Stats bar */}
          <div className="stat-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '.6rem',
            padding: '0 1.5rem .85rem',
          }}>
            <StatCard icon="🏫" value={realClasses.length}   label="ห้องเรียน" />
            <StatCard icon="👶" value={realStudents.length}  label="นักเรียน"  />
            <StatCard icon="👩‍🏫" value={realTeachers.length} label="ครู"       />
            <StatCard icon="📋" value={totalRecords || assessmentTopics.length} label={totalRecords ? 'บันทึกทั้งหมด' : 'ด้านพัฒนาการ'} />
          </div>

          {/* Live feed ticker */}
          <div style={{
            background: 'rgba(0,0,0,0.25)',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            padding: '.4rem 1.5rem',
            display: 'flex', alignItems: 'center', gap: '1rem',
          }}>
            <div style={{
              background: '#4ade80', color: '#14532d', borderRadius: '4px',
              padding: '.15rem .55rem', fontSize: '.65rem', fontWeight: 900,
              letterSpacing: '.06em', flexShrink: 0,
            }}>LIVE FEED</div>
            {tickerItems.length > 0 && <LiveTicker items={tickerItems} />}
          </div>
        </div>

        {/* ── Tabs ─────────────────────────────────────────── */}
        <div style={{
          background: 'white', borderBottom: '2px solid #f3f4f6',
          padding: '0 1rem',
          display: 'flex', gap: '0', overflowX: 'auto',
          position: 'sticky', top: 0, zIndex: 10,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          scrollbarWidth: 'none',
        }}>
          {PUBLIC_TABS.map(tab => {
            const active = publicTab === tab.id;
            return (
              <button key={tab.id} type="button"
                onClick={() => setPublicTab(tab.id)}
                style={{
                  padding: '.8rem 1.1rem', border: 'none', background: 'transparent',
                  fontFamily: 'inherit', fontWeight: active ? 800 : 600,
                  fontSize: '.83rem', cursor: 'pointer',
                  color: active ? '#7c3aed' : '#6b7280',
                  borderBottom: active ? '3px solid #7c3aed' : '3px solid transparent',
                  transition: 'all .15s', whiteSpace: 'nowrap', flexShrink: 0,
                }}>
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ── Content ──────────────────────────────────────── */}
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '1.5rem 1rem 3rem' }}>

          {/* ── Tab: ภาพรวม ── */}
          {publicTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

              {/* CTA Banner */}
              <div style={{
                background: 'linear-gradient(135deg,#7c3aed,#6d28d9)',
                borderRadius: '18px', padding: '1.25rem 1.5rem',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                flexWrap: 'wrap', gap: '1rem',
              }}>
                <div>
                  <div style={{ fontWeight: 900, fontSize: '1rem', color: 'white', marginBottom: '.25rem' }}>
                    ระบบบันทึกพัฒนาการเด็กปฐมวัย
                  </div>
                  <div style={{ fontSize: '.8rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.6 }}>
                    ปีการศึกษา {academicYear} · {realClasses.length} ห้องเรียน · {realStudents.length} คน · {realTeachers.length} ครู
                  </div>
                </div>
                <button type="button" onClick={() => setShowLogin(true)}
                  style={{
                    background: 'white', color: '#7c3aed',
                    border: 'none', borderRadius: '12px',
                    padding: '.6rem 1.4rem', fontFamily: 'inherit',
                    fontWeight: 800, fontSize: '.88rem', cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)', flexShrink: 0,
                    transition: 'all .15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}>
                  🚀 เข้าสู่ระบบ
                </button>
              </div>

              {/* Feature cards */}
              <div>
                <h3 style={{ fontSize: '.85rem', fontWeight: 800, color: '#374151', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '.07em' }}>
                  ⚡ ฟีเจอร์หลักของระบบ
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: '1rem' }}>
                  {[
                    { icon: '📊', title: 'ประเมินผลพัฒนาการ', desc: 'บันทึกและติดตามพัฒนาการเด็กรายด้าน ตามมาตรฐานปฐมวัย', color: '#7c3aed' },
                    { icon: '📅', title: 'บันทึกกิจกรรมประจำวัน', desc: 'การมาเรียน อาหาร นม แปรงฟัน สุขภาพ ครบทุกด้าน', color: '#0891b2' },
                    { icon: '📒', title: 'สมุดรายงาน อ.01', desc: 'สร้างสมุดรายงานประจำตัวเด็กปฐมวัยอัตโนมัติ', color: '#059669' },
                    { icon: '🤖', title: 'AI ผู้ช่วยครู', desc: 'ช่วยเขียนสรุปพัฒนาการ ข้อเสนอแนะ และตอบคำถามด้านปฐมวัย', color: '#f59e0b' },
                    { icon: '👨‍👩‍👧', title: 'พอร์ทัลผู้ปกครอง', desc: 'ผู้ปกครองดูพัฒนาการบุตรหลานได้ตลอดเวลา', color: '#f43f5e' },
                    { icon: '☁️', title: 'Cloud Sync', desc: `บันทึกข้อมูลขึ้น Firebase อัตโนมัติ ${isFirebaseConfigured ? '✅ พร้อมใช้' : '(ตั้งค่าในระบบ)'}`, color: isFirebaseConfigured ? '#059669' : '#6b7280' },
                  ].map((f, i) => (
                    <div key={i} style={{
                      background: 'white', borderRadius: '16px', padding: '1.25rem',
                      border: `2px solid ${f.color}15`,
                      boxShadow: `0 2px 12px ${f.color}10`,
                    }}>
                      <div style={{ fontSize: '1.75rem', marginBottom: '.6rem' }}>{f.icon}</div>
                      <div style={{ fontWeight: 800, fontSize: '.9rem', color: '#1e1b4b', marginBottom: '.35rem' }}>{f.title}</div>
                      <div style={{ fontSize: '.78rem', color: '#6b7280', lineHeight: 1.6 }}>{f.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Tab: ห้องเรียน ── */}
          {publicTab === 'classes' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ fontSize: '.85rem', fontWeight: 800, color: '#374151', margin: 0, textTransform: 'uppercase', letterSpacing: '.07em' }}>
                🏫 ห้องเรียนทั้งหมด — ปีการศึกษา {academicYear}
              </h3>
              {realClasses.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
                  ยังไม่มีข้อมูลห้องเรียน
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1rem' }}>
                  {realClasses.map(cls => {
                    const count = realStudents.filter(s => s.classId === cls.id).length;
                    return (
                      <ClassCard key={cls.id} cls={cls} studentCount={count} topics={assessmentTopics} />
                    );
                  })}
                </div>
              )}

              {/* Stats table */}
              {realClasses.length > 0 && (
                <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', border: '1.5px solid #e5e7eb', marginTop: '.5rem' }}>
                  <div style={{ padding: '1rem 1.25rem', borderBottom: '1.5px solid #f3f4f6', fontWeight: 800, fontSize: '.88rem', color: '#1e1b4b' }}>
                    📊 สรุปจำนวนนักเรียนรายห้อง
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f9fafb' }}>
                        <th style={{ padding: '.65rem 1.25rem', textAlign: 'center', fontSize: '.78rem', fontWeight: 700, color: '#6b7280' }}>ห้องเรียน</th>
                        <th style={{ padding: '.65rem 1.25rem', textAlign: 'center', fontSize: '.78rem', fontWeight: 700, color: '#6b7280' }}>นักเรียน</th>
                        <th style={{ padding: '.65rem 1.25rem', textAlign: 'center', fontSize: '.78rem', fontWeight: 700, color: '#6b7280' }}>ระดับชั้น</th>
                      </tr>
                    </thead>
                    <tbody>
                      {realClasses.map((cls, i) => {
                        const count = realStudents.filter(s => s.classId === cls.id).length;
                        return (
                          <tr key={cls.id} style={{ borderTop: i > 0 ? '1px solid #f3f4f6' : 'none' }}>
                            <td style={{ padding: '.65rem 1.25rem', fontWeight: 700, fontSize: '.88rem' }}>{cls.name}</td>
                            <td style={{ padding: '.65rem 1.25rem', textAlign: 'center' }}>
                              <span style={{
                                background: '#f5f3ff', color: '#7c3aed', borderRadius: '999px',
                                padding: '.2rem .65rem', fontSize: '.8rem', fontWeight: 800,
                              }}>{count} คน</span>
                            </td>
                            <td style={{ padding: '.65rem 1.25rem', textAlign: 'center', fontSize: '.82rem', color: '#6b7280' }}>
                              {cls.level ?? 'อนุบาล'}
                            </td>
                          </tr>
                        );
                      })}
                      <tr style={{ borderTop: '2px solid #e5e7eb', background: '#f9fafb' }}>
                        <td style={{ padding: '.65rem 1.25rem', fontWeight: 800, fontSize: '.88rem' }}>รวมทั้งหมด</td>
                        <td style={{ padding: '.65rem 1.25rem', textAlign: 'center' }}>
                          <span style={{ background: '#7c3aed', color: 'white', borderRadius: '999px', padding: '.2rem .65rem', fontSize: '.8rem', fontWeight: 900 }}>
                            {realStudents.length} คน
                          </span>
                        </td>
                        <td style={{ padding: '.65rem 1.25rem', textAlign: 'center', fontSize: '.82rem', color: '#6b7280' }}>
                          {realClasses.length} ห้อง
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── Tab: คู่มือการใช้งาน ── */}
          {publicTab === 'guide' && <GuideTab />}

        </div>

        {/* Footer */}
        <div style={{
          background: 'linear-gradient(135deg,#1e1b4b,#4c1d95)',
          padding: '1.25rem 1.5rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: '.75rem',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.2rem' }}>
            <div style={{ fontWeight: 800, fontSize: '.82rem', color: 'white' }}>
              🏫 {schoolName}
            </div>
            <div style={{ fontSize: '.7rem', color: 'rgba(255,255,255,0.6)' }}>
              ระบบบันทึกพัฒนาการเด็กปฐมวัย · KinderTrack v{APP_VERSION} · ปีการศึกษา {academicYear}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            {isFirebaseConfigured && (
              <span style={{ fontSize: '.7rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                ☁️ Cloud Sync พร้อมใช้งาน
              </span>
            )}
            <button type="button" onClick={() => setShowLogin(true)}
              style={{
                background: 'rgba(255,255,255,0.15)', color: 'white',
                border: '1.5px solid rgba(255,255,255,0.3)', borderRadius: '999px',
                padding: '.4rem 1rem', fontFamily: 'inherit',
                fontWeight: 700, fontSize: '.78rem', cursor: 'pointer',
                transition: 'all .15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.25)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}>
              🔑 เข้าสู่ระบบ
            </button>
          </div>
        </div>
      </div>

      {/* ── Login Modal ── */}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}

      <style>{`
        @keyframes pulse {
          0%,100% { opacity:1; box-shadow:0 0 4px #4ade80; }
          50%      { opacity:.6; box-shadow:0 0 10px #4ade80; }
        }
        @keyframes fadeIn {
          from { opacity:0; transform:translateY(6px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @media (max-width: 480px) {
          .stat-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </>
  );
}
