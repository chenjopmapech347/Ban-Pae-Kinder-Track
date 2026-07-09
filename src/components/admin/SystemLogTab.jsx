import { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';

// ─── helpers ──────────────────────────────────────────────────────────────────
const ACTION_LABELS = {
  login:          { label: 'เข้าสู่ระบบ',     badge: '#059669', bg: '#d1fae5' },
  logout:         { label: 'ออกจากระบบ',       badge: '#6b7280', bg: '#f3f4f6' },
  add_student:    { label: 'เพิ่มนักเรียน',    badge: '#0891b2', bg: '#e0f2fe' },
  edit_student:   { label: 'แก้ไขนักเรียน',    badge: '#0891b2', bg: '#e0f2fe' },
  delete_student: { label: 'ลบนักเรียน',       badge: '#dc2626', bg: '#fee2e2' },
  add_teacher:    { label: 'เพิ่มครู',          badge: '#7c3aed', bg: '#ede9fe' },
  edit_teacher:   { label: 'แก้ไขครู',          badge: '#7c3aed', bg: '#ede9fe' },
  delete_teacher: { label: 'ลบครู',             badge: '#dc2626', bg: '#fee2e2' },
  report:         { label: 'พิมพ์รายงาน',       badge: '#f59e0b', bg: '#fef3c7' },
  export:         { label: 'ส่งออกข้อมูล',      badge: '#f59e0b', bg: '#fef3c7' },
  import:         { label: 'นำเข้าข้อมูล',      badge: '#06b6d4', bg: '#cffafe' },
  save:           { label: 'บันทึกข้อมูล',       badge: '#0891b2', bg: '#e0f2fe' },
};

function getActionMeta(action) {
  return ACTION_LABELS[action] ?? { label: action, badge: '#6b7280', bg: '#f3f4f6' };
}

function thaiDateTime(isoStr) {
  if (!isoStr) return '—';
  try {
    const d = new Date(isoStr);
    return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })
      + ' ' + d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch { return isoStr; }
}

function thaiDate(isoStr) {
  if (!isoStr) return '';
  try {
    return new Date(isoStr).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch { return isoStr; }
}

const ACTION_GROUPS = [
  { value: '',               label: 'ทุกประเภท' },
  { value: 'login',          label: 'เข้าสู่ระบบ' },
  { value: 'logout',         label: 'ออกจากระบบ' },
  { value: 'student',        label: 'จัดการนักเรียน' },
  { value: 'teacher',        label: 'จัดการครู' },
  { value: 'report',         label: 'รายงาน / ส่งออก' },
  { value: 'save',           label: 'บันทึกข้อมูล' },
  { value: 'import',         label: 'นำเข้าข้อมูล' },
];

// ─── Export CSV ───────────────────────────────────────────────────────────────
function exportCsv(logs) {
  const BOM = '﻿';
  const header = 'วันที่,เวลา,การกระทำ,ผู้ใช้,รายละเอียด';
  const rows = logs.map(l => {
    const d = new Date(l.ts);
    const date = d.toLocaleDateString('th-TH');
    const time = d.toLocaleTimeString('th-TH');
    const action = getActionMeta(l.action).label;
    const user = (l.userName ?? '').replace(/,/g, ' ');
    const detail = (l.detail ?? '').replace(/,/g, ' ');
    return `${date},${time},${action},${user},${detail}`;
  });
  const csv = BOM + [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `system_log_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Summary cards ────────────────────────────────────────────────────────────
function SummaryCard({ icon, label, value, color }) {
  return (
    <div style={{
      flex: '1 1 130px', background: 'white',
      border: `1.5px solid ${color}25`,
      borderRadius: '14px', padding: '1rem 1.1rem',
      display: 'flex', flexDirection: 'column', gap: '.3rem',
      boxShadow: `0 2px 10px ${color}10`,
    }}>
      <div style={{ fontSize: '1.35rem', lineHeight: 1 }}>{icon}</div>
      <div style={{ fontSize: '1.6rem', fontWeight: 900, color, lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: '.72rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.05em' }}>
        {label}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SystemLogTab() {
  const { systemLogs, setSystemLogs } = useApp();

  const [search,      setSearch]      = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [dateFilter,  setDateFilter]  = useState('');
  const [page,        setPage]        = useState(1);
  const PAGE_SIZE = 50;

  // ── Summary stats ──────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const today = new Date().toLocaleDateString('th-TH');
    return {
      total:    systemLogs.length,
      logins:   systemLogs.filter(l => l.action === 'login').length,
      today:    systemLogs.filter(l => thaiDate(l.ts) === today).length,
      admins:   systemLogs.filter(l => l.userName?.includes('ผู้ดูแลระบบ')).length,
    };
  }, [systemLogs]);

  // ── Filter ─────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return systemLogs.filter(l => {
      if (actionFilter) {
        // group match
        const a = l.action ?? '';
        if (actionFilter === 'student' && !a.includes('student')) return false;
        if (actionFilter === 'teacher' && !a.includes('teacher')) return false;
        if (actionFilter === 'report'  && !(a === 'report' || a === 'export')) return false;
        if (actionFilter === 'login'   && a !== 'login') return false;
        if (actionFilter === 'logout'  && a !== 'logout') return false;
        if (actionFilter === 'save'    && a !== 'save') return false;
        if (actionFilter === 'import'  && a !== 'import') return false;
      }
      if (dateFilter) {
        if (!thaiDate(l.ts).includes(dateFilter) && !l.ts?.includes(dateFilter)) return false;
      }
      if (q) {
        const hay = `${l.action} ${l.userName ?? ''} ${l.detail ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [systemLogs, search, actionFilter, dateFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSearch = v => { setSearch(v); setPage(1); };
  const handleActionFilter = v => { setActionFilter(v); setPage(1); };
  const handleDateFilter   = v => { setDateFilter(v); setPage(1); };

  const clearAll = () => {
    if (!confirm('⚠️ ต้องการลบบันทึกการใช้งานระบบทั้งหมดหรือไม่?\n(ไม่สามารถกู้คืนได้)')) return;
    setSystemLogs([]);
  };

  return (
    <div className="glass p-6 animate-fade">
      {/* Header */}
      <div className="page-header mb-5">
        <div>
          <h3>📋 บันทึกการใช้งานระบบ</h3>
          <p style={{ fontSize: '.8rem', color: 'var(--text-muted)', marginTop: '.2rem' }}>
            ติดตามกิจกรรมการใช้งาน — เข้าสู่ระบบ, จัดการข้อมูล, พิมพ์รายงาน
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn" style={{ background: '#f0f9ff', color: '#0369a1' }}
            onClick={() => exportCsv(filtered)}>
            📥 Export CSV
          </button>
          <button className="btn" style={{ background: '#fff1f2', color: '#be123c' }}
            onClick={clearAll}>
            🗑️ ล้างบันทึก
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'flex', gap: '.85rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <SummaryCard icon="📊" label="บันทึกทั้งหมด"  value={stats.total}   color="#7c3aed" />
        <SummaryCard icon="🚪" label="เข้าสู่ระบบ"    value={stats.logins}  color="#059669" />
        <SummaryCard icon="📅" label="วันนี้"          value={stats.today}   color="#0891b2" />
        <SummaryCard icon="🛡️" label="โดย Admin"       value={stats.admins}  color="#dc2626" />
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '.65rem', flexWrap: 'wrap', marginBottom: '1.1rem', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 200px' }}>
          <span style={{ position: 'absolute', left: '.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '.9rem' }}>🔍</span>
          <input
            className="input"
            style={{ paddingLeft: '2.2rem', fontSize: '.85rem' }}
            placeholder="ค้นหาผู้ใช้ หรือรายละเอียด..."
            value={search}
            onChange={e => handleSearch(e.target.value)}
          />
        </div>

        {/* Action type filter */}
        <select className="input" style={{ flex: '0 1 180px', fontSize: '.85rem' }}
          value={actionFilter} onChange={e => handleActionFilter(e.target.value)}>
          {ACTION_GROUPS.map(g => (
            <option key={g.value} value={g.value}>{g.label}</option>
          ))}
        </select>

        {/* Date filter (YYYY-MM-DD) */}
        <input type="date" className="input" style={{ flex: '0 1 160px', fontSize: '.85rem' }}
          value={dateFilter} onChange={e => handleDateFilter(e.target.value)}
          title="กรองตามวันที่" />

        {(search || actionFilter || dateFilter) && (
          <button className="btn btn-sm" style={{ color: '#dc2626' }}
            onClick={() => { setSearch(''); setActionFilter(''); setDateFilter(''); setPage(1); }}>
            ✕ ล้างตัวกรอง
          </button>
        )}

        <span style={{ marginLeft: 'auto', fontSize: '.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          {filtered.length.toLocaleString()} รายการ
        </span>
      </div>

      {/* Table */}
      {paginated.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#9ca3af' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '.75rem' }}>📋</div>
          {systemLogs.length === 0
            ? 'ยังไม่มีบันทึกการใช้งานระบบ\nเมื่อมีการเข้าสู่ระบบหรือแก้ไขข้อมูล จะปรากฏที่นี่'
            : 'ไม่พบรายการที่ตรงกับเงื่อนไขการค้นหา'}
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: '170px' }}>วันที่ / เวลา</th>
                <th style={{ width: '130px' }}>ประเภท</th>
                <th>ผู้ใช้</th>
                <th>รายละเอียด</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(log => {
                const meta = getActionMeta(log.action);
                return (
                  <tr key={log.id} className="hover-row">
                    <td style={{ fontSize: '.78rem', color: '#6b7280', whiteSpace: 'nowrap' }}>
                      {thaiDateTime(log.ts)}
                    </td>
                    <td>
                      <span style={{
                        display: 'inline-block',
                        background: meta.bg,
                        color: meta.badge,
                        borderRadius: '999px',
                        padding: '.2rem .65rem',
                        fontSize: '.75rem',
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                      }}>
                        {meta.label}
                      </span>
                    </td>
                    <td style={{ fontSize: '.85rem', fontWeight: 600 }}>
                      {log.userName || '—'}
                    </td>
                    <td style={{ fontSize: '.82rem', color: '#374151' }}>
                      {log.detail || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem', marginTop: '1rem' }}>
          <button className="btn btn-sm" disabled={page === 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}>← ก่อนหน้า</button>
          <span style={{ fontSize: '.82rem', color: '#6b7280' }}>
            หน้า {page} / {totalPages}
          </span>
          <button className="btn btn-sm" disabled={page === totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}>ถัดไป →</button>
        </div>
      )}
    </div>
  );
}
