/**
 * Modal.jsx — Central Modal Component สำหรับ KinderTrack
 *
 * Props:
 *   isOpen   {boolean}   — แสดง/ซ่อน modal
 *   onClose  {function}  — callback เมื่อปิด
 *   title    {string}    — หัวข้อ modal
 *   subtitle {string}    — หัวข้อย่อย (optional)
 *   size     {string}    — 'sm' | 'md' | 'lg' | 'xl'  (default 'md')
 *   footer   {ReactNode} — ส่วน footer (ปุ่มยืนยัน/ยกเลิก) optional
 *   hideClose {boolean}  — ซ่อนปุ่ม X (default false)
 *   children {ReactNode} — เนื้อหาใน body
 *
 * Usage:
 *   <Modal isOpen={open} onClose={() => setOpen(false)} title="หัวข้อ">
 *     <p>เนื้อหา</p>
 *   </Modal>
 */
import { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

const SIZES = {
  sm: '400px',
  md: '520px',
  lg: '680px',
  xl: '860px',
};

export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  size = 'md',
  footer,
  hideClose = false,
  children,
}) {
  // ── ESC key to close ──────────────────────────────────────
  const handleKey = useCallback((e) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener('keydown', handleKey);
    // ป้องกัน scroll body ขณะ modal เปิด
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, handleKey]);

  if (!isOpen) return null;

  const maxW = SIZES[size] ?? SIZES.md;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9000,
        background: 'rgba(15,10,40,0.60)',
        backdropFilter: 'blur(3px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeIn .18s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: '20px',
          width: '100%',
          maxWidth: maxW,
          maxHeight: 'calc(100vh - 2rem)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 64px rgba(15,10,40,0.22), 0 4px 16px rgba(0,0,0,0.12)',
          animation: 'popIn .22s cubic-bezier(.34,1.56,.64,1)',
          overflow: 'hidden',
        }}
      >
        {/* ── Header ── */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          padding: '1.25rem 1.5rem 1rem',
          borderBottom: '1.5px solid #f3f4f6',
          flexShrink: 0,
        }}>
          <div>
            <h2 style={{
              margin: 0, fontSize: '1.05rem', fontWeight: 800,
              color: '#1e1b4b', lineHeight: 1.3,
            }}>
              {title}
            </h2>
            {subtitle && (
              <p style={{
                margin: '.2rem 0 0', fontSize: '.8rem',
                color: '#6b7280', fontWeight: 500,
              }}>
                {subtitle}
              </p>
            )}
          </div>
          {!hideClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="ปิด"
              style={{
                flexShrink: 0, marginLeft: '1rem',
                width: '32px', height: '32px',
                background: '#f9fafb', border: '1.5px solid #e5e7eb',
                borderRadius: '8px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1rem', color: '#6b7280',
                transition: 'all .14s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.borderColor = '#fca5a5'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.color = '#6b7280'; e.currentTarget.style.borderColor = '#e5e7eb'; }}
            >
              ✕
            </button>
          )}
        </div>

        {/* ── Body ── */}
        <div style={{
          padding: '1.25rem 1.5rem',
          overflowY: 'auto',
          flex: 1,
        }}>
          {children}
        </div>

        {/* ── Footer ── */}
        {footer && (
          <div style={{
            padding: '1rem 1.5rem',
            borderTop: '1.5px solid #f3f4f6',
            display: 'flex', justifyContent: 'flex-end',
            gap: '.65rem', flexShrink: 0,
            background: '#fafafa',
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

// ── ปุ่มสำเร็จรูปสำหรับ Footer ────────────────────────────
export function ModalCancelBtn({ onClick, label = 'ยกเลิก' }) {
  return (
    <button type="button" onClick={onClick}
      style={{
        padding: '.55rem 1.25rem', borderRadius: '10px',
        border: '1.5px solid #e5e7eb', background: 'white',
        fontFamily: 'inherit', fontWeight: 700, fontSize: '.88rem',
        color: '#374151', cursor: 'pointer', transition: 'all .14s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = '#f9fafb'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'white'; }}>
      {label}
    </button>
  );
}

export function ModalConfirmBtn({ onClick, label = 'ยืนยัน', loading = false, color = '#7c3aed', type = 'button' }) {
  return (
    <button type={type} onClick={onClick} disabled={loading}
      style={{
        padding: '.55rem 1.4rem', borderRadius: '10px', border: 'none',
        background: loading ? '#c4b5fd' : color,
        fontFamily: 'inherit', fontWeight: 800, fontSize: '.88rem',
        color: 'white', cursor: loading ? 'not-allowed' : 'pointer',
        transition: 'all .14s',
        boxShadow: loading ? 'none' : `0 4px 12px ${color}40`,
      }}
      onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = '.88'; }}
      onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}>
      {loading ? '⏳ กำลังบันทึก…' : label}
    </button>
  );
}
