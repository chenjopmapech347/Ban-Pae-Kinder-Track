import { useState } from 'react';
import { useApp } from '../../context/AppContext';

const EMPTY = { label: '', date: '' };

// แปลง YYYY-MM-DD → วัน/เดือน/ปีพ.ศ.
function toThaiDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  const thaiMonths = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
  return `${parseInt(d, 10)} ${thaiMonths[parseInt(m, 10) - 1]} ${parseInt(y, 10) + 543}`;
}

// inline mini-calendar component
function MiniCalendar({ value, onChange }) {
  const today     = new Date();
  const initDate  = value ? new Date(value) : today;
  const [view, setView] = useState({ year: initDate.getFullYear(), month: initDate.getMonth() });

  const DAYS    = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
  const MONTHS  = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
                   'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];

  const firstDay  = new Date(view.year, view.month, 1).getDay();
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const isoPrefix = `${view.year}-${String(view.month + 1).padStart(2, '0')}-`;

  const prevMonth = () => setView(v => v.month === 0 ? { year: v.year - 1, month: 11 } : { ...v, month: v.month - 1 });
  const nextMonth = () => setView(v => v.month === 11 ? { year: v.year + 1, month: 0 } : { ...v, month: v.month + 1 });

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div style={{ userSelect: 'none' }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.5rem' }}>
        <button type="button" onClick={prevMonth}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: '#7c3aed', padding: '2px 8px', borderRadius: '6px' }}>‹</button>
        <span style={{ fontWeight: 800, fontSize: '.92rem', color: '#374151' }}>
          {MONTHS[view.month]} {view.year + 543}
        </span>
        <button type="button" onClick={nextMonth}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: '#7c3aed', padding: '2px 8px', borderRadius: '6px' }}>›</button>
      </div>

      {/* day names */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', textAlign: 'center', marginBottom: '.25rem' }}>
        {DAYS.map(d => (
          <div key={d} style={{ fontSize: '.72rem', fontWeight: 700, color: '#9ca3af', padding: '2px 0' }}>{d}</div>
        ))}
      </div>

      {/* date cells */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '2px' }}>
        {cells.map((d, i) => {
          if (!d) return <div key={'e' + i} />;
          const iso = isoPrefix + String(d).padStart(2, '0');
          const selected = iso === value;
          const isToday  = iso === today.toISOString().slice(0, 10);
          const dow = (firstDay + d - 1) % 7;
          const isWeekend = dow === 0 || dow === 6;
          return (
            <button key={d} type="button" onClick={() => onChange(iso)}
              style={{
                border: 'none', borderRadius: '8px', padding: '5px 0',
                fontSize: '.82rem', fontWeight: selected ? 800 : 500, cursor: 'pointer',
                background: selected ? '#7c3aed' : isToday ? '#ede9fe' : 'transparent',
                color: selected ? 'white' : isWeekend ? '#ef4444' : '#374151',
                outline: isToday && !selected ? '2px solid #a78bfa' : 'none',
              }}>
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function HolidaysTab() {
  const { holidays, setHolidays } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm]     = useState(EMPTY);

  const openModal = () => { setForm(EMPTY); setIsOpen(true); };

  const handleSave = () => {
    if (!form.label.trim() || !form.date) return;
    setHolidays([...holidays, { id: Date.now(), date: form.date, label: form.label.trim(), type: 'Holiday' }]);
    setIsOpen(false);
  };

  return (
    <div className="glass p-6 animate-fade">
      <div className="page-header mb-6">
        <h3>🏖️ จัดการวันหยุดและกิจกรรมประจำปี</h3>
        <button type="button" className="btn btn-primary" onClick={openModal}>
          + เพิ่มวันหยุด
        </button>
      </div>

      {/* ── holiday list ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
        {holidays
          .slice()
          .sort((a, b) => (a.date > b.date ? 1 : -1))
          .map(h => (
            <div key={h.id} className="glass-card flex justify-between items-center" style={{ flexWrap: 'wrap', gap: '.75rem' }}>
              <div className="flex gap-3 items-center">
                <div style={{
                  background: 'linear-gradient(135deg,#7c3aed,#a855f7)',
                  color: 'white', borderRadius: '12px', padding: '.5rem .85rem',
                  fontWeight: 800, fontSize: '.82rem', minWidth: '110px', textAlign: 'center',
                }}>
                  {toThaiDate(h.date) || h.date}
                </div>
                <div>
                  <div className="font-bold">{h.label}</div>
                  <div className="text-xs text-muted">ประเภท: {h.type}</div>
                </div>
              </div>
              <button type="button" className="btn btn-sm" style={{ color: 'var(--danger)' }}
                onClick={() => { if (confirm('ลบวันหยุดนี้?')) setHolidays(holidays.filter(x => x.id !== h.id)); }}>
                🗑️ ลบ
              </button>
            </div>
          ))}
        {!holidays.length && (
          <div className="text-center text-muted" style={{ padding: '2rem' }}>ยังไม่มีวันหยุด</div>
        )}
      </div>

      {/* ── Modal ── */}
      {isOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}
          onClick={e => { if (e.target === e.currentTarget) setIsOpen(false); }}
        >
          <div className="glass animate-pop" style={{ width: '100%', maxWidth: '360px', padding: '1.5rem', borderRadius: '16px' }}>
            <h4 style={{ margin: '0 0 1.25rem', fontWeight: 800, fontSize: '1.05rem' }}>📅 เพิ่มวันหยุด / กิจกรรม</h4>

            {/* ชื่อวันหยุด */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontWeight: 700, fontSize: '.83rem', marginBottom: '.35rem', color: '#4b5563' }}>
                ชื่อวันหยุด / กิจกรรม
              </label>
              <input
                className="input"
                placeholder="เช่น วันสงกรานต์, วันหยุดพิเศษ..."
                value={form.label}
                onChange={e => setForm({ ...form, label: e.target.value })}
                autoFocus
              />
            </div>

            {/* Calendar */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontWeight: 700, fontSize: '.83rem', marginBottom: '.5rem', color: '#4b5563' }}>
                เลือกวันที่
              </label>
              <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '.85rem' }}>
                <MiniCalendar value={form.date} onChange={d => setForm({ ...form, date: d })} />
              </div>
              {form.date && (
                <div style={{ marginTop: '.5rem', textAlign: 'center', fontSize: '.82rem', color: '#7c3aed', fontWeight: 700 }}>
                  ✅ {toThaiDate(form.date)}
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '.6rem' }}>
              <button type="button" className="btn flex-1" onClick={() => setIsOpen(false)}>ยกเลิก</button>
              <button
                type="button" className="btn btn-primary flex-1"
                onClick={handleSave}
                disabled={!form.label.trim() || !form.date}
                style={{ opacity: (!form.label.trim() || !form.date) ? .5 : 1 }}
              >
                + บันทึก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
