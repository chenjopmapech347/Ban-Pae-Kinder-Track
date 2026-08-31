import React from 'react';
export default function PillGroup({ items, selected, onSelect, color = '#7c3aed', bg = '#f5f3ff', getKey, getLabel, getCount }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem' }}>
      {items.map(item => {
        const k = getKey(item);
        const active = selected === k;
        const cnt = getCount?.(item);
        return (
          <div key={k} onClick={() => onSelect(k)} style={{
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '.35rem',
            background: active ? bg : '#f9fafb',
            border: `2px solid ${active ? color : '#e5e7eb'}`,
            borderRadius: '10px', padding: '.28rem .7rem',
            fontWeight: 700, fontSize: '.82rem',
            color: active ? color : '#6b7280',
            transition: 'all .15s',
          }}>
            {getLabel(item)}
            {cnt !== undefined && (
              <span style={{
                background: active ? color : '#e5e7eb',
                color: active ? 'white' : '#6b7280',
                borderRadius: '999px', padding: '0 .35rem', fontSize: '.68rem',
              }}>{cnt}</span>
            )}
          </div>
        );
      })}
      {items.length === 0 && (
        <span style={{ fontSize: '.78rem', color: '#9ca3af', padding: '.3rem' }}>— ไม่มีข้อมูล —</span>
      )}
    </div>
  );
}

// ── AI Panel (แนะนำกิจกรรมรายนักเรียน) ─────────────────────────────────────────
