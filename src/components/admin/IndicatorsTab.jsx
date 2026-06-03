import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { INDICATORS_DATA } from '../../data/indicatorsData';
import { getStandardsByDomain } from '../../data/flatIndicators';

// ── Modal เพิ่ม/แก้ไขตัวบ่งชี้ ─────────────────────────────────────────────
function IndicatorModal({ isOpen, onClose, onSave, editing, domains }) {
  const blank = { domainId: domains[0]?.id ?? '', standardId: '', indicatorCode: '', label: '' };
  const [form, setForm] = useState(editing ?? blank);

  if (!isOpen) return null;

  const standards = getStandardsByDomain(form.domainId);

  const handleSave = () => {
    if (!form.indicatorCode.trim() || !form.label.trim()) return alert('กรุณากรอกรหัสและชื่อตัวบ่งชี้');
    const id = editing?.id ?? `${form.domainId}__${form.standardId}__${form.indicatorCode}__${Date.now()}`;
    onSave({ ...form, id,
      domainLabel: domains.find(d => d.id === form.domainId)?.label ?? '',
      domainEmoji: domains.find(d => d.id === form.domainId)?.emoji ?? '',
      domainColor: domains.find(d => d.id === form.domainId)?.color ?? '#7c3aed',
      standardTitle: standards.find(s => s.id === form.standardId)?.title ?? form.standardId,
    });
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
      <div className="glass p-8 animate-pop" style={{ width: '100%', maxWidth: '480px' }}>
        <h3 className="mb-5">{editing ? '✏️ แก้ไขตัวบ่งชี้' : '➕ เพิ่มตัวบ่งชี้ใหม่'}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '.35rem', fontWeight: 600 }}>ด้านพัฒนาการ</label>
            <select className="input" value={form.domainId}
              onChange={e => setForm({ ...form, domainId: e.target.value, standardId: '' })}>
              {domains.map(d => <option key={d.id} value={d.id}>{d.emoji} ด้าน{d.label}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '.35rem', fontWeight: 600 }}>มาตรฐาน</label>
            <select className="input" value={form.standardId}
              onChange={e => setForm({ ...form, standardId: e.target.value })}>
              <option value="">— เลือกมาตรฐาน —</option>
              {getStandardsByDomain(form.domainId).map(s => (
                <option key={s.id} value={s.id}>{s.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '.35rem', fontWeight: 600 }}>รหัสตัวบ่งชี้ <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input className="input" placeholder="เช่น 3.1, 5.2" value={form.indicatorCode}
              onChange={e => setForm({ ...form, indicatorCode: e.target.value })} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '.35rem', fontWeight: 600 }}>ชื่อ/คำอธิบายตัวบ่งชี้ <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input className="input" placeholder="เช่น ตัวบ่งชี้ที่ 3.1 ..." value={form.label}
              onChange={e => setForm({ ...form, label: e.target.value })} />
          </div>
          <div style={{ display: 'flex', gap: '.75rem', marginTop: '.5rem' }}>
            <button type="button" className="btn flex-1" onClick={onClose}>ยกเลิก</button>
            <button type="button" className="btn btn-primary flex-1" onClick={handleSave}>💾 บันทึก</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main IndicatorsTab ────────────────────────────────────────────────────────
export default function IndicatorsTab() {
  const { indicators, setIndicators, activities } = useApp();
  const [activeDomain, setActiveDomain] = useState(INDICATORS_DATA[0]?.id ?? 'physical');
  const [isModal, setIsModal]           = useState(false);
  const [editing, setEditing]           = useState(null);
  const [search, setSearch]             = useState('');

  const domains = INDICATORS_DATA.map(d => ({ id: d.id, label: d.label, emoji: d.emoji, color: d.color, bg: d.bg }));
  const domain  = INDICATORS_DATA.find(d => d.id === activeDomain);

  const domainIndicators = indicators.filter(ind =>
    ind.domainId === activeDomain &&
    (search === '' || ind.label.toLowerCase().includes(search.toLowerCase()) || ind.indicatorCode.includes(search))
  );

  const actCountFor = (indId) => activities.filter(a => a.indicatorId === indId).length;

  const handleSave = (data) => {
    if (editing) {
      setIndicators(indicators.map(i => i.id === editing.id ? { ...i, ...data } : i));
    } else {
      setIndicators([...indicators, data]);
    }
    setEditing(null);
  };

  const handleDelete = (id) => {
    if (!confirm('ลบตัวบ่งชี้นี้? กิจกรรมที่เชื่อมจะถูกลบด้วย')) return;
    setIndicators(indicators.filter(i => i.id !== id));
  };

  return (
    <div className="glass p-6 animate-fade">
      {/* Header */}
      <div className="page-header mb-6">
        <h3>📋 ตัวบ่งชี้</h3>
        <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <input className="input" style={{ maxWidth: '180px' }} placeholder="🔍 ค้นหา..."
            value={search} onChange={e => setSearch(e.target.value)} />
          <button className="btn btn-primary" onClick={() => { setEditing(null); setIsModal(true); }}>
            + เพิ่มตัวบ่งชี้
          </button>
        </div>
      </div>

      {/* Domain Tabs */}
      <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {domains.map(d => {
          const cnt = indicators.filter(i => i.domainId === d.id).length;
          return (
            <button key={d.id} type="button"
              onClick={() => { setActiveDomain(d.id); setSearch(''); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '.45rem',
                padding: '.5rem 1rem', borderRadius: '12px', border: 'none',
                fontFamily: 'inherit', fontWeight: 700, fontSize: '.85rem',
                cursor: 'pointer', transition: 'all .2s',
                background: activeDomain === d.id ? d.color : '#f3f4f6',
                color: activeDomain === d.id ? 'white' : '#6b7280',
                boxShadow: activeDomain === d.id ? `0 4px 14px ${d.color}50` : 'none',
              }}
            >
              {d.emoji} ด้าน{d.label}
              <span style={{
                background: activeDomain === d.id ? 'rgba(255,255,255,.25)' : '#e5e7eb',
                color: activeDomain === d.id ? 'white' : '#6b7280',
                borderRadius: '999px', padding: '0 .45rem', fontSize: '.72rem',
              }}>{cnt}</span>
            </button>
          );
        })}
      </div>

      {/* Standard Sections */}
      {domain?.standards.map(std => {
        const stdInds = domainIndicators.filter(i => i.standardId === std.id);
        if (stdInds.length === 0 && search) return null;
        return (
          <div key={std.id} style={{ marginBottom: '1.25rem' }}>
            <div style={{
              padding: '.5rem .85rem', marginBottom: '.6rem',
              background: domain ? `${domain.color}12` : '#f5f3ff',
              borderLeft: `3px solid ${domain?.color ?? '#7c3aed'}`,
              borderRadius: '0 8px 8px 0', fontSize: '.8rem',
              fontWeight: 700, color: domain?.color ?? '#7c3aed',
            }}>
              {std.title}
            </div>

            {stdInds.length === 0 ? (
              <div style={{ fontSize: '.82rem', color: 'var(--text-muted)', padding: '.5rem 1rem' }}>
                ยังไม่มีตัวบ่งชี้ในมาตรฐานนี้
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                {stdInds.map(ind => {
                  const aCnt = actCountFor(ind.id);
                  return (
                    <div key={ind.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: 'white', border: `1.5px solid ${(domain?.color ?? '#7c3aed')}20`,
                      borderRadius: '10px', padding: '.6rem .85rem',
                      transition: 'all .15s',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flex: 1, minWidth: 0 }}>
                        <span style={{
                          background: `${domain?.color ?? '#7c3aed'}20`,
                          color: domain?.color ?? '#7c3aed',
                          borderRadius: '6px', padding: '.1rem .45rem',
                          fontSize: '.7rem', fontWeight: 800, flexShrink: 0,
                        }}>{ind.indicatorCode}</span>
                        <span style={{ fontWeight: 600, fontSize: '.85rem', color: '#374151' }}>
                          {ind.label}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexShrink: 0 }}>
                        <span style={{
                          background: aCnt > 0 ? `${domain?.color ?? '#7c3aed'}15` : '#f3f4f6',
                          color: aCnt > 0 ? domain?.color ?? '#7c3aed' : '#9ca3af',
                          borderRadius: '999px', padding: '0 .55rem',
                          fontSize: '.72rem', fontWeight: 700,
                        }}>
                          {aCnt} กิจกรรม
                        </span>
                        <button className="btn btn-sm" onClick={() => { setEditing(ind); setIsModal(true); }}>แก้ไข</button>
                        <button className="btn btn-sm" style={{ color: 'var(--danger)' }}
                          onClick={() => handleDelete(ind.id)}>ลบ</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {domainIndicators.length === 0 && !search && (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
          ไม่มีตัวบ่งชี้ในด้านนี้
        </div>
      )}

      <IndicatorModal
        isOpen={isModal}
        onClose={() => { setIsModal(false); setEditing(null); }}
        onSave={handleSave}
        editing={editing}
        domains={domains}
      />
    </div>
  );
}
