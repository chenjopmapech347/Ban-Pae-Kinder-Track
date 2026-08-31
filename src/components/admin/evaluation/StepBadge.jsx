import React from 'react';
export default function StepBadge({ n, label, active, done }) {
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
