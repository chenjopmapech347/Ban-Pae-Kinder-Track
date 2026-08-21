import { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { INDICATORS_DATA_68 } from '../../data/indicatorsData_68';
import Modal, { ModalCancelBtn, ModalConfirmBtn } from '../Modal';

// ── Modal เพิ่ม/แก้ไขกิจกรรม ───────────────────────────────────────────────
function ActivityModal({ isOpen, onClose, onSave, editing, indicators, presetIndicatorId }) {
  const blank = {
    indicatorId: presetIndicatorId ?? indicators[0]?.id ?? '',
    itemLabel: '',
    no: '',
    label: '',
  };
  const [form, setForm] = useState(() => editing ?? blank);

  // จัดกลุ่มตัวบ่งชี้ตาม domain
  const byDomain = useMemo(() => {
    const map = {};
    indicators.forEach(ind => {
      if (!map[ind.domainId]) map[ind.domainId] = { label: ind.domainLabel, emoji: ind.domainEmoji, items: [] };
      map[ind.domainId].items.push(ind);
    });
    return map;
  }, [indicators]);

  const handleSave = () => {
    if (!form.no.trim() || !form.label.trim()) return alert('กรุณากรอกหมายเลขและชื่อกิจกรรม');
    if (!form.indicatorId) return alert('กรุณาเลือกตัวบ่งชี้');
    const ind = indicators.find(i => i.id === form.indicatorId);
    const id = editing?.id ?? `${form.indicatorId}__custom__${Date.now()}`;
    onSave({
      ...form,
      id,
      domainId: ind?.domainId ?? '',
      itemId: form.itemLabel ? `item_${Date.now()}` : 'default',
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editing ? '✏️ แก้ไขกิจกรรม' : '➕ เพิ่มกิจกรรมใหม่'}
      size="md"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        <div>
          <label style={{ display: 'block', marginBottom: '.35rem', fontWeight: 600 }}>
            ตัวบ่งชี้ที่เชื่อมโยง <span style={{ color: 'var(--danger)' }}>*</span>
          </label>
          <select className="input" value={form.indicatorId}
            onChange={e => setForm({ ...form, indicatorId: e.target.value })}>
            <option value="">— เลือกตัวบ่งชี้ —</option>
            {Object.entries(byDomain).map(([domainId, dom]) => (
              <optgroup key={domainId} label={`${dom.emoji} ด้าน${dom.label}`}>
                {dom.items.map(ind => (
                  <option key={ind.id} value={ind.id}>
                    [{ind.indicatorCode}] {ind.label.length > 50 ? ind.label.slice(0, 50) + '…' : ind.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '.35rem', fontWeight: 600 }}>
            รายการพิจารณา (ไม่บังคับ)
          </label>
          <input className="input" placeholder="เช่น รายการพิจารณาที่ 3.1.1"
            value={form.itemLabel}
            onChange={e => setForm({ ...form, itemLabel: e.target.value })} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '.75rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '.35rem', fontWeight: 600 }}>
              หมายเลข <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input className="input" placeholder="เช่น 8" value={form.no}
              onChange={e => setForm({ ...form, no: e.target.value })} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '.35rem', fontWeight: 600 }}>
              ชื่อกิจกรรม <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input className="input" placeholder="เช่น ยืนขาเดียว 3 วินาที (GM)"
              value={form.label}
              onChange={e => setForm({ ...form, label: e.target.value })} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '.75rem', marginTop: '.5rem' }}>
          <ModalCancelBtn onClick={onClose} />
          <ModalConfirmBtn onClick={handleSave} label="💾 บันทึก" />
        </div>
      </div>
    </Modal>
  );
}

// ── Main ActivitiesTab ────────────────────────────────────────────────────────
export default function ActivitiesTab() {
  const { indicators, activities, setActivities } = useApp();

  const domains = INDICATORS_DATA_68.map(d => ({ id: d.id, label: d.label, emoji: d.emoji, color: d.color, bg: d.bg }));

  const [activeDomain,    setActiveDomain]    = useState(domains[0]?.id ?? 'physical');
  const [activeIndicator, setActiveIndicator] = useState('all');
  const [isModal,         setIsModal]         = useState(false);
  const [editing,         setEditing]         = useState(null);
  const [search,          setSearch]          = useState('');

  const openModal = (act = null, indId = null) => {
    setEditing(act);
    if (indId) setActiveIndicator(indId);
    setIsModal(true);
  };

  const domain = domains.find(d => d.id === activeDomain);

  // ตัวบ่งชี้ในด้านที่เลือก
  const domainIndicators = indicators.filter(i => i.domainId === activeDomain);

  // กิจกรรมที่กรอง
  const filtered = activities.filter(a => {
    const matchDomain = a.domainId === activeDomain;
    const matchInd    = activeIndicator === 'all' || a.indicatorId === activeIndicator;
    const matchSearch = search === '' ||
      a.label.toLowerCase().includes(search.toLowerCase()) ||
      a.no.includes(search);
    return matchDomain && matchInd && matchSearch;
  });

  // จัดกลุ่มตาม indicatorId
  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach(act => {
      if (!map[act.indicatorId]) map[act.indicatorId] = [];
      map[act.indicatorId].push(act);
    });
    return map;
  }, [filtered]);

  const handleSave = (data) => {
    if (editing) {
      setActivities(activities.map(a => a.id === editing.id ? { ...a, ...data } : a));
    } else {
      setActivities([...activities, data]);
    }
    setEditing(null);
  };

  const handleDelete = (id) => {
    if (!confirm('ลบกิจกรรมนี้?')) return;
    setActivities(activities.filter(a => a.id !== id));
  };

  return (
    <div className="glass p-6 animate-fade">
      {/* Header */}
      <div className="page-header mb-6">
        <h3>🎯 กิจกรรม</h3>
        <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <input className="input" style={{ maxWidth: '180px' }} placeholder="🔍 ค้นหา..."
            value={search} onChange={e => setSearch(e.target.value)} />
          <button className="btn btn-primary" onClick={() => openModal()}>
            + เพิ่มกิจกรรม
          </button>
        </div>
      </div>

      {/* Domain Tabs */}
      <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {domains.map(d => {
          const cnt = activities.filter(a => a.domainId === d.id).length;
          return (
            <button key={d.id} type="button"
              onClick={() => { setActiveDomain(d.id); setActiveIndicator('all'); setSearch(''); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '.4rem',
                padding: '.5rem .9rem', borderRadius: '12px', border: 'none',
                fontFamily: 'inherit', fontWeight: 700, fontSize: '.83rem',
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
                borderRadius: '999px', padding: '0 .4rem', fontSize: '.7rem',
              }}>{cnt}</span>
            </button>
          );
        })}
      </div>

      {/* Indicator Filter */}
      <div style={{ display: 'flex', gap: '.4rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>กรองตามตัวบ่งชี้:</span>
        <button type="button"
          onClick={() => setActiveIndicator('all')}
          style={{
            padding: '.35rem .75rem', borderRadius: '8px', border: 'none',
            fontFamily: 'inherit', fontSize: '.78rem', fontWeight: 700, cursor: 'pointer',
            background: activeIndicator === 'all' ? (domain?.color ?? '#7c3aed') : '#f3f4f6',
            color: activeIndicator === 'all' ? 'white' : '#6b7280',
          }}>
          ทั้งหมด ({activities.filter(a => a.domainId === activeDomain).length})
        </button>
        {domainIndicators.map(ind => {
          const cnt = activities.filter(a => a.indicatorId === ind.id).length;
          if (cnt === 0 && activeIndicator !== ind.id) return null;
          return (
            <button key={ind.id} type="button"
              onClick={() => setActiveIndicator(ind.id)}
              style={{
                padding: '.35rem .75rem', borderRadius: '8px', border: 'none',
                fontFamily: 'inherit', fontSize: '.75rem', fontWeight: 700, cursor: 'pointer',
                background: activeIndicator === ind.id ? (domain?.color ?? '#7c3aed') : '#f3f4f6',
                color: activeIndicator === ind.id ? 'white' : '#6b7280',
                transition: 'all .15s',
              }}>
              [{ind.indicatorCode}] {cnt}
            </button>
          );
        })}
      </div>

      {/* Activities Grouped by Indicator */}
      {Object.keys(grouped).length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
          ไม่พบกิจกรรม
        </div>
      ) : (
        Object.entries(grouped).map(([indId, acts]) => {
          const ind = indicators.find(i => i.id === indId);
          return (
            <div key={indId} style={{ marginBottom: '1.25rem' }}>
              {/* Indicator header */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '.5rem',
                padding: '.5rem .85rem', marginBottom: '.6rem',
                background: domain ? `${domain.color}12` : '#f5f3ff',
                borderLeft: `3px solid ${domain?.color ?? '#7c3aed'}`,
                borderRadius: '0 8px 8px 0',
              }}>
                <span style={{
                  background: domain?.color ?? '#7c3aed', color: 'white',
                  borderRadius: '5px', padding: '0 .4rem',
                  fontSize: '.7rem', fontWeight: 800,
                }}>{ind?.indicatorCode ?? '?'}</span>
                <span style={{ fontSize: '.82rem', fontWeight: 700, color: domain?.color ?? '#7c3aed' }}>
                  {ind?.label ?? indId}
                </span>
                <button type="button"
                  onClick={() => openModal(null, indId)}
                  style={{
                    marginLeft: 'auto', padding: '.2rem .6rem', border: 'none',
                    borderRadius: '6px', background: domain?.color ?? '#7c3aed',
                    color: 'white', fontSize: '.7rem', fontWeight: 700,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}>
                  + เพิ่มกิจกรรม
                </button>
              </div>

              {/* Activity rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem', paddingLeft: '.5rem' }}>
                {acts.map(act => (
                  <div key={act.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: 'white', border: `1.5px solid ${(domain?.color ?? '#7c3aed')}18`,
                    borderRadius: '10px', padding: '.55rem .85rem', gap: '.5rem',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '.45rem', flex: 1, minWidth: 0 }}>
                      <span style={{
                        background: domain?.color ?? '#7c3aed', color: 'white',
                        borderRadius: '5px', padding: '0 .35rem',
                        fontSize: '.68rem', fontWeight: 800, flexShrink: 0, lineHeight: '1.5',
                      }}>{act.no}</span>
                      <div>
                        {act.itemLabel && (
                          <div style={{ fontSize: '.7rem', color: '#9ca3af', marginBottom: '.1rem' }}>
                            {act.itemLabel}
                          </div>
                        )}
                        <span style={{ fontSize: '.83rem', color: '#374151' }}>{act.label}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '.4rem', flexShrink: 0 }}>
                      <button className="btn btn-sm" onClick={() => openModal(act)}>แก้ไข</button>
                      <button className="btn btn-sm" style={{ color: 'var(--danger)' }}
                        onClick={() => handleDelete(act.id)}>ลบ</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}

      {/* Summary */}
      <div style={{ marginTop: '1rem', fontSize: '.8rem', color: 'var(--text-muted)', textAlign: 'right' }}>
        แสดง {filtered.length} กิจกรรม
      </div>

      <ActivityModal
        isOpen={isModal}
        onClose={() => { setIsModal(false); setEditing(null); }}
        onSave={handleSave}
        editing={editing}
        indicators={indicators}
        presetIndicatorId={activeIndicator !== 'all' ? activeIndicator : null}
      />
    </div>
  );
}
