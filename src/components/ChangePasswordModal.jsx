/**
 * ChangePasswordModal.jsx — เปลี่ยนรหัสผ่านสำหรับ Admin และ ครู
 * ใช้ Modal กลาง (Modal.jsx)
 */
import { useState } from 'react';
import Modal, { ModalCancelBtn, ModalConfirmBtn } from './Modal';
import { useApp } from '../context/AppContext';

// ── field helper ─────────────────────────────────────────────────────────────
function PinField({ label, value, onChange, placeholder, autoFocus }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '.3rem' }}>
      <label style={{ fontSize: '.82rem', fontWeight: 700, color: '#374151' }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          className="input"
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder ?? ''}
          autoFocus={autoFocus}
          style={{ paddingRight: '2.5rem', letterSpacing: show ? 'normal' : '.12em' }}
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          tabIndex={-1}
          style={{
            position: 'absolute', right: '.65rem', top: '50%',
            transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '1rem', color: '#9ca3af', padding: '0',
          }}
        >
          {show ? '🙈' : '👁️'}
        </button>
      </div>
    </div>
  );
}

// ── strength meter ────────────────────────────────────────────────────────────
function StrengthBar({ pin }) {
  if (!pin) return null;
  let score = 0;
  if (pin.length >= 4) score++;
  if (pin.length >= 8) score++;
  if (/[A-Z]/.test(pin)) score++;
  if (/[0-9]/.test(pin) && /[a-zA-Z]/.test(pin)) score++;

  const levels = [
    { label: 'อ่อนมาก', color: '#ef4444' },
    { label: 'อ่อน',    color: '#f97316' },
    { label: 'ปานกลาง', color: '#eab308' },
    { label: 'แข็งแกร่ง', color: '#22c55e' },
  ];
  const { label, color } = levels[Math.min(score, 3)];

  return (
    <div style={{ marginTop: '.25rem' }}>
      <div style={{ display: 'flex', gap: '.2rem', marginBottom: '.2rem' }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{
            flex: 1, height: '4px', borderRadius: '4px',
            background: i <= score ? color : '#e5e7eb',
            transition: 'background .2s',
          }} />
        ))}
      </div>
      <div style={{ fontSize: '.72rem', color, fontWeight: 700 }}>
        ความแข็งแกร่ง: {label}
      </div>
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────────
export default function ChangePasswordModal({ isOpen, onClose }) {
  const { role, user, changePassword } = useApp();

  const [currentPin, setCurrentPin] = useState('');
  const [newPin,     setNewPin]     = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error,      setError]      = useState('');
  const [success,    setSuccess]    = useState(false);
  const [loading,    setLoading]    = useState(false);

  const reset = () => {
    setCurrentPin(''); setNewPin(''); setConfirmPin('');
    setError(''); setSuccess(false); setLoading(false);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = (e) => {
    e?.preventDefault();
    setError('');

    if (!currentPin) { setError('กรุณากรอกรหัสผ่านเดิม'); return; }
    if (!newPin)     { setError('กรุณากรอกรหัสผ่านใหม่'); return; }
    if (newPin.length < 4) { setError('รหัสผ่านใหม่ต้องมีอย่างน้อย 4 ตัวอักษร'); return; }
    if (newPin !== confirmPin) { setError('รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน'); return; }
    if (newPin === currentPin) { setError('รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านเดิม'); return; }

    setLoading(true);
    const result = changePassword(role, {
      currentPin,
      newPin,
      teacherId: user?.teacherId,
    });
    setLoading(false);

    if (!result.ok) { setError(result.message); return; }
    setSuccess(true);
  };

  const isTeacher = role === 'teacher';
  const isAdmin   = role === 'admin';

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="🔑 เปลี่ยนรหัสผ่าน"
      subtitle={
        isAdmin   ? `ผู้ดูแลระบบ — ${user?.name ?? ''}` :
        isTeacher ? `ครู — ${user?.name ?? ''}` : ''
      }
      size="sm"
      footer={
        success ? (
          <ModalConfirmBtn label="✅ ปิด" color="#059669" onClick={handleClose} />
        ) : (
          <>
            <ModalCancelBtn onClick={handleClose} />
            <ModalConfirmBtn
              label="💾 บันทึกรหัสผ่าน"
              loading={loading}
              onClick={handleSubmit}
            />
          </>
        )
      }
    >
      {success ? (
        /* ── Success state ── */
        <div style={{
          textAlign: 'center', padding: '1.5rem 0',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.75rem',
        }}>
          <div style={{ fontSize: '3rem' }}>✅</div>
          <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#065f46' }}>
            เปลี่ยนรหัสผ่านสำเร็จ
          </div>
          <div style={{ fontSize: '.85rem', color: '#6b7280' }}>
            รหัสผ่านใหม่จะมีผลในการเข้าสู่ระบบครั้งต่อไป
          </div>
        </div>
      ) : (
        /* ── Form ── */
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Info banner */}
          <div style={{
            background: '#f0fdf4', border: '1.5px solid #bbf7d0',
            borderRadius: '10px', padding: '.65rem .9rem',
            fontSize: '.78rem', color: '#166534', lineHeight: 1.6,
          }}>
            💡 {isAdmin
              ? 'เปลี่ยนรหัสผ่านของ Admin — ใช้รหัสนี้เพื่อเข้าสู่ระบบในครั้งถัดไป'
              : 'เปลี่ยนรหัสผ่านของตัวเอง — ครูท่านอื่นจะไม่ได้รับผลกระทบ'
            }
          </div>

          <PinField
            label="🔒 รหัสผ่านเดิม"
            value={currentPin}
            onChange={setCurrentPin}
            placeholder="กรอกรหัสผ่านปัจจุบัน"
            autoFocus
          />

          <div style={{ height: '1px', background: '#f3f4f6' }} />

          <PinField
            label="🆕 รหัสผ่านใหม่"
            value={newPin}
            onChange={v => { setNewPin(v); setError(''); }}
            placeholder="อย่างน้อย 4 ตัวอักษร"
          />
          <StrengthBar pin={newPin} />

          <PinField
            label="✅ ยืนยันรหัสผ่านใหม่"
            value={confirmPin}
            onChange={v => { setConfirmPin(v); setError(''); }}
            placeholder="พิมพ์รหัสผ่านใหม่อีกครั้ง"
          />

          {/* Match indicator */}
          {confirmPin && (
            <div style={{
              fontSize: '.75rem', fontWeight: 700,
              color: confirmPin === newPin ? '#059669' : '#dc2626',
            }}>
              {confirmPin === newPin ? '✅ รหัสผ่านตรงกัน' : '❌ รหัสผ่านไม่ตรงกัน'}
            </div>
          )}

          {error && (
            <div style={{
              background: '#fef2f2', border: '1.5px solid #fca5a5',
              borderRadius: '10px', padding: '.65rem .9rem',
              fontSize: '.82rem', color: '#991b1b', fontWeight: 600,
            }}>
              ❌ {error}
            </div>
          )}
        </form>
      )}
    </Modal>
  );
}
