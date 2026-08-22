import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import Modal, { ModalCancelBtn, ModalConfirmBtn } from '../Modal';

// แปลง YYYY-MM-DD (ค.ศ.) → วัน เดือน ปีพ.ศ.
function toThaiDate(iso) {
  if (!iso) return '—';
  const thaiMonths = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
  const [y, m, d] = iso.split('-');
  const dow = new Date(iso).getDay();
  const dowTh = ['อา','จ','อ','พ','พฤ','ศ','ส'][dow];
  return `${dowTh}. ${parseInt(d, 10)} ${thaiMonths[parseInt(m, 10) - 1] ?? ''} ${parseInt(y, 10) + 543}`;
}

// ปฏิทิน — mode: 'any' = เลือกได้ทุกวัน | 'weekend' = เลือกได้เฉพาะ เสาร์-อาทิตย์
function MiniCalendar({ value, onChange, mode = 'any', disabledDates = [] }) {
  const today    = new Date();
  const initDate = value ? new Date(value) : today;
  const [view, setView] = useState({ year: initDate.getFullYear(), month: initDate.getMonth() });

  const DAYS   = ['อา','จ','อ','พ','พฤ','ศ','ส'];
  const MONTHS = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
                  'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];

  const firstDay    = new Date(view.year, view.month, 1).getDay();
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const isoPrefix   = `${view.year}-${String(view.month + 1).padStart(2, '0')}-`;

  const prevMonth = () => setView(v => v.month === 0 ? { year: v.year - 1, month: 11 } : { ...v, month: v.month - 1 });
  const nextMonth = () => setView(v => v.month === 11 ? { year: v.year + 1, month: 0 } : { ...v, month: v.month + 1 });

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div style={{ userSelect: 'none' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'.5rem' }}>
        <button type="button" onClick={prevMonth}
          style={{ background:'none', border:'none', cursor:'pointer', fontSize:'1.1rem', color:'#7c3aed', padding:'2px 8px', borderRadius:'6px' }}>‹</button>
        <span style={{ fontWeight:800, fontSize:'.92rem', color:'#374151' }}>
          {MONTHS[view.month]} {view.year + 543}
        </span>
        <button type="button" onClick={nextMonth}
          style={{ background:'none', border:'none', cursor:'pointer', fontSize:'1.1rem', color:'#7c3aed', padding:'2px 8px', borderRadius:'6px' }}>›</button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', textAlign:'center', marginBottom:'.25rem' }}>
        {DAYS.map((d, i) => (
          <div key={d} style={{ fontSize:'.72rem', fontWeight:700,
            color: (i === 0 || i === 6) ? '#ef4444' : '#9ca3af', padding:'2px 0' }}>{d}</div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'2px' }}>
        {cells.map((d, i) => {
          if (!d) return <div key={'e'+i} />;
          const iso     = isoPrefix + String(d).padStart(2, '0');
          const dow     = (firstDay + d - 1) % 7;
          const isWknd  = dow === 0 || dow === 6;
          const isToday = iso === today.toISOString().slice(0, 10);
          const sel     = iso === value;
          const disabled = (mode === 'weekend' && !isWknd) || disabledDates.includes(iso);

          return (
            <button key={d} type="button"
              onClick={() => { if (!disabled) onChange(iso); }}
              style={{
                border: 'none', borderRadius: '8px', padding: '5px 0',
                fontSize: '.82rem', fontWeight: sel ? 800 : 500,
                cursor: disabled ? 'not-allowed' : 'pointer',
                background: sel ? '#7c3aed'
                           : isToday && !sel ? '#ede9fe'
                           : mode === 'weekend' && isWknd && !disabled ? '#fef9c3'
                           : 'transparent',
                color: sel ? 'white'
                       : disabled ? '#d1d5db'
                       : isWknd ? '#ef4444'
                       : '#374151',
                outline: isToday && !sel ? '2px solid #a78bfa' : 'none',
                opacity: disabled ? 0.4 : 1,
              }}>
              {d}
            </button>
          );
        })}
      </div>

      {mode === 'weekend' && (
        <div style={{ marginTop:'.5rem', fontSize:'.68rem', color:'#92400e', background:'#fef9c3',
          borderRadius:'6px', padding:'.25rem .5rem', textAlign:'center' }}>
          เลือกได้เฉพาะ เสาร์ (ส) หรือ อาทิตย์ (อา) เท่านั้น
        </div>
      )}
    </div>
  );
}

const EMPTY = { offDate: '', offLabel: '', makeupDate: '' };

export default function SpecialHolidaysTab() {
  const { specialHolidays, setSpecialHolidays } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm]     = useState(EMPTY);
  const [step, setStep]     = useState(1); // 1 = เลือกวันหยุด, 2 = เลือกวันเรียนทดแทน

  const openAdd = () => { setForm(EMPTY); setStep(1); setIsOpen(true); };

  const handleSave = () => {
    if (!form.offLabel.trim() || !form.offDate || !form.makeupDate) return;
    setSpecialHolidays([
      ...specialHolidays,
      { id: Date.now(), offDate: form.offDate, offLabel: form.offLabel.trim(), makeupDate: form.makeupDate },
    ]);
    setIsOpen(false);
  };

  const handleDelete = (id) => {
    if (!confirm('ลบรายการนี้?')) return;
    setSpecialHolidays(specialHolidays.filter(h => h.id !== id));
  };

  const sorted = [...specialHolidays].sort((a, b) => (a.offDate > b.offDate ? 1 : -1));

  const canNext  = form.offLabel.trim() && form.offDate;
  const canSave  = canNext && form.makeupDate;

  return (
    <div className="glass p-6 animate-fade">
      {/* Header */}
      <div className="page-header mb-6">
        <div>
          <h3>📵 วันหยุดพิเศษ</h3>
          <p className="text-xs text-muted" style={{ marginTop: '.25rem' }}>
            กำหนดวันหยุดพิเศษ (วันจันทร์–ศุกร์) พร้อมวันเปิดเรียนทดแทน (เสาร์–อาทิตย์)
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openAdd}>
          + เพิ่มวันหยุดพิเศษ
        </button>
      </div>

      {/* Table */}
      {sorted.length === 0 ? (
        <div className="text-center text-muted" style={{ padding:'2.5rem' }}>
          ยังไม่มีวันหยุดพิเศษ
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'.75rem' }}>
          {sorted.map(h => (
            <div key={h.id} className="glass-card"
              style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'.75rem' }}>
              <div style={{ display:'flex', gap:'1rem', alignItems:'center', flexWrap:'wrap' }}>
                {/* วันหยุด */}
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center',
                  background:'linear-gradient(135deg,#dc2626,#f87171)', color:'white',
                  borderRadius:'12px', padding:'.5rem .85rem', minWidth:'130px', textAlign:'center' }}>
                  <span style={{ fontSize:'.68rem', fontWeight:700, opacity:.85 }}>🚫 หยุดพิเศษ</span>
                  <span style={{ fontSize:'.82rem', fontWeight:800 }}>{toThaiDate(h.offDate)}</span>
                </div>
                {/* ลูกศร */}
                <span style={{ fontSize:'1.2rem', color:'#9ca3af' }}>➜</span>
                {/* วันทดแทน */}
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center',
                  background:'linear-gradient(135deg,#16a34a,#4ade80)', color:'white',
                  borderRadius:'12px', padding:'.5rem .85rem', minWidth:'130px', textAlign:'center' }}>
                  <span style={{ fontSize:'.68rem', fontWeight:700, opacity:.85 }}>📚 เรียนทดแทน</span>
                  <span style={{ fontSize:'.82rem', fontWeight:800 }}>{toThaiDate(h.makeupDate)}</span>
                </div>
                <div>
                  <div className="font-bold">{h.offLabel}</div>
                </div>
              </div>
              <button type="button" className="btn btn-sm" style={{ color:'var(--danger)' }}
                onClick={() => handleDelete(h.id)}>🗑️ ลบ</button>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={step === 1 ? '📵 วันหยุดพิเศษ' : '📚 วันเปิดเรียนทดแทน'}
        size="sm"
      >
        {step === 1 ? (
          /* ─── Step 1: วันหยุดพิเศษ ─── */
          <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            <div>
              <label style={{ display:'block', fontWeight:700, fontSize:'.83rem', marginBottom:'.35rem', color:'#4b5563' }}>
                ชื่อวันหยุดพิเศษ <span style={{ color:'var(--danger)' }}>*</span>
              </label>
              <input
                className="input"
                placeholder="เช่น หยุดชดเชยวันพ่อ, หยุดโรคระบาด..."
                value={form.offLabel}
                onChange={e => setForm({ ...form, offLabel: e.target.value })}
                autoFocus
              />
            </div>

            <div>
              <label style={{ display:'block', fontWeight:700, fontSize:'.83rem', marginBottom:'.5rem', color:'#4b5563' }}>
                เลือกวันที่หยุด <span style={{ color:'var(--danger)' }}>*</span>
              </label>
              <div style={{ background:'#f8fafc', border:'1.5px solid #e2e8f0', borderRadius:'12px', padding:'.85rem' }}>
                <MiniCalendar value={form.offDate} onChange={d => setForm({ ...form, offDate: d })} mode="any" />
              </div>
              {form.offDate && (
                <div style={{ marginTop:'.5rem', textAlign:'center', fontSize:'.82rem', color:'#dc2626', fontWeight:700 }}>
                  🚫 {toThaiDate(form.offDate)}
                </div>
              )}
            </div>

            <div style={{ display:'flex', gap:'.6rem' }}>
              <ModalCancelBtn onClick={() => setIsOpen(false)} />
              <ModalConfirmBtn
                onClick={() => canNext && setStep(2)}
                label="ถัดไป →"
                color={canNext ? '#7c3aed' : '#c4b5fd'}
              />
            </div>
          </div>
        ) : (
          /* ─── Step 2: วันเรียนทดแทน ─── */
          <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            <div style={{ background:'#fef2f2', borderRadius:'10px', padding:'.6rem .85rem',
              fontSize:'.8rem', color:'#dc2626', fontWeight:700 }}>
              🚫 วันหยุดพิเศษ: {toThaiDate(form.offDate)} — {form.offLabel}
            </div>

            <div>
              <label style={{ display:'block', fontWeight:700, fontSize:'.83rem', marginBottom:'.5rem', color:'#4b5563' }}>
                เลือกวันเปิดเรียนทดแทน <span style={{ color:'var(--danger)' }}>*</span>
              </label>
              <div style={{ background:'#f8fafc', border:'1.5px solid #e2e8f0', borderRadius:'12px', padding:'.85rem' }}>
                <MiniCalendar
                  value={form.makeupDate}
                  onChange={d => setForm({ ...form, makeupDate: d })}
                  mode="weekend"
                />
              </div>
              {form.makeupDate && (
                <div style={{ marginTop:'.5rem', textAlign:'center', fontSize:'.82rem', color:'#16a34a', fontWeight:700 }}>
                  📚 {toThaiDate(form.makeupDate)}
                </div>
              )}
            </div>

            <div style={{ display:'flex', gap:'.6rem' }}>
              <button type="button" className="btn" onClick={() => setStep(1)}>← ย้อนกลับ</button>
              <ModalConfirmBtn
                onClick={handleSave}
                label="💾 บันทึก"
                color={canSave ? '#16a34a' : '#bbf7d0'}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
