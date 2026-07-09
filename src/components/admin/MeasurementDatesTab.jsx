import { useState } from 'react';
import { useApp } from '../../context/AppContext';

/* ── ข้อมูลการวัด 4 ครั้ง ─────────────────────────────────────────────────── */
const SLOTS = [
  { key: 't1m1', label: 'ภาคเรียน 1 ครั้งที่ 1', hint: 'อ้างอิงเดือน มิ.ย.' },
  { key: 't1m2', label: 'ภาคเรียน 1 ครั้งที่ 2', hint: 'อ้างอิงเดือน ก.ย.' },
  { key: 't2m1', label: 'ภาคเรียน 2 ครั้งที่ 1', hint: 'อ้างอิงเดือน ธ.ค.' },
  { key: 't2m2', label: 'ภาคเรียน 2 ครั้งที่ 2', hint: 'อ้างอิงเดือน ก.พ.' },
];

function thaiDate(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  const MONTHS = ['','ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
  return `${parseInt(d, 10)} ${MONTHS[parseInt(m, 10)]} ${parseInt(y, 10) + 543}`;
}

export default function MeasurementDatesTab() {
  const { measurementDates, setMeasurementDates, academicYear } = useApp();

  const [form,  setForm]  = useState({ ...measurementDates });
  const [saved, setSaved] = useState(false);

  const handleChange = (key, val) => {
    setSaved(false);
    setForm(f => ({ ...f, [key]: val }));
  };

  const handleSave = () => {
    setMeasurementDates({ ...form });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleClearAll = () => {
    if (!confirm('ล้างวันที่ทั้งหมด?')) return;
    const cleared = { t1m1: '', t1m2: '', t2m1: '', t2m2: '' };
    setForm(cleared);
    setMeasurementDates(cleared);
    setSaved(false);
  };

  const allConfigured = SLOTS.every(s => form[s.key]);

  return (
    <div className="animate-fade">
      {/* ── Header ── */}
      <div className="glass-card mb-4" style={{ background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', border: '1.5px solid #bbf7d0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ fontSize: '2rem' }}>📏</div>
          <div style={{ flex: 1, minWidth: '220px' }}>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#14532d', marginBottom: '.3rem' }}>
              กำหนดวันวัดน้ำหนัก/ส่วนสูง ปีการศึกษา {academicYear}
            </div>
            <div style={{ fontSize: '.82rem', color: '#166534', lineHeight: 1.6 }}>
              ตั้งค่าวันที่วัดน้ำหนักและส่วนสูงสำหรับ 4 ครั้งในปีการศึกษา
              เมื่อกำหนดแล้ว วันที่จะถูกนำไปใช้เป็นค่าเริ่มต้นในสมุดรายงานประจำตัวเด็ก (อ.01)
              ส่วน <strong>บันทึกพัฒนาการด้านร่างกาย (น้ำหนัก/ส่วนสูง)</strong> โดยอัตโนมัติ
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '.4rem',
              padding: '.3rem .75rem', borderRadius: '999px', fontSize: '.75rem', fontWeight: 700,
              background: allConfigured ? '#d1fae5' : '#fef3c7',
              color: allConfigured ? '#065f46' : '#92400e',
            }}>
              {allConfigured ? '✅ ครบทั้ง 4 ครั้ง' : `⚠️ กำหนดแล้ว ${SLOTS.filter(s => form[s.key]).length}/4 ครั้ง`}
            </div>
          </div>
        </div>
      </div>

      {/* ── Form ── */}
      <div className="glass-card mb-4">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.88rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ padding: '10px 14px', border: '1px solid #e5e7eb', textAlign: 'left', minWidth: '200px', fontWeight: 700 }}>ครั้งที่</th>
                <th style={{ padding: '10px 14px', border: '1px solid #e5e7eb', textAlign: 'left', minWidth: '200px', fontWeight: 700 }}>
                  วันที่วัด
                  <div style={{ fontSize: '.72rem', fontWeight: 400, color: '#9ca3af' }}>(เดือนอ้างอิง)</div>
                </th>
                <th style={{ padding: '10px 14px', border: '1px solid #e5e7eb', textAlign: 'left', fontWeight: 700 }}>แสดงผล (พ.ศ.)</th>
                <th style={{ padding: '10px 14px', border: '1px solid #e5e7eb', textAlign: 'center', width: '80px', fontWeight: 700 }}>ล้าง</th>
              </tr>
            </thead>
            <tbody>
              {SLOTS.map((slot, i) => {
                const isSet  = Boolean(form[slot.key]);
                const isT2   = i >= 2;
                return (
                  <tr key={slot.key} style={{ background: isT2 ? '#f0fdf4' : 'white' }}>
                    <td style={{ padding: '10px 14px', border: '1px solid #e5e7eb' }}>
                      <div style={{ fontWeight: 700 }}>{slot.label}</div>
                      <div style={{ fontSize: '.73rem', color: '#9ca3af', marginTop: '.15rem' }}>{slot.hint}</div>
                    </td>
                    <td style={{ padding: '8px 14px', border: '1px solid #e5e7eb' }}>
                      <input
                        type="date"
                        value={form[slot.key] ?? ''}
                        onChange={e => handleChange(slot.key, e.target.value)}
                        style={{
                          padding: '6px 10px', borderRadius: '8px', fontFamily: 'inherit',
                          fontSize: '.85rem', width: '170px',
                          border: isSet ? '1.5px solid #10b981' : '1.5px solid #d1d5db',
                          background: isSet ? '#f0fdf4' : 'white',
                        }}
                      />
                    </td>
                    <td style={{ padding: '10px 14px', border: '1px solid #e5e7eb' }}>
                      {isSet
                        ? <span style={{ fontWeight: 600, color: '#065f46', fontSize: '.85rem' }}>{thaiDate(form[slot.key])}</span>
                        : <span style={{ color: '#d1d5db', fontSize: '.8rem' }}>ยังไม่กำหนด</span>
                      }
                    </td>
                    <td style={{ padding: '8px 14px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                      {isSet && (
                        <button
                          type="button"
                          onClick={() => handleChange(slot.key, '')}
                          title="ล้างวันที่"
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            fontSize: '1.1rem', padding: '.2rem', color: '#d1d5db',
                            lineHeight: 1,
                          }}
                          onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; }}
                          onMouseLeave={e => { e.currentTarget.style.color = '#d1d5db'; }}
                        >
                          ✕
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── หมายเหตุ ── */}
        <div style={{ marginTop: '1rem', padding: '.7rem 1rem', background: '#fefce8', border: '1px solid #fde047', borderRadius: '8px', fontSize: '.78rem', color: '#713f12' }}>
          <strong>หมายเหตุ:</strong> วันที่ที่กำหนดจะถูกนำไปเติมอัตโนมัติในช่อง "วันที่วัด" ของสมุดรายงาน อ.01
          สำหรับนักเรียนที่ยังไม่ได้บันทึกข้อมูล ครูสามารถแก้ไขวันที่รายบุคคลได้ภายหลัง
        </div>
      </div>

      {/* ── Action buttons ── */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        {saved && (
          <div style={{
            padding: '.55rem 1.25rem', background: '#d1fae5', color: '#065f46',
            borderRadius: '10px', fontWeight: 700, fontSize: '.85rem',
          }}>
            ✅ บันทึกเรียบร้อยแล้ว
          </div>
        )}
        <div style={{ flex: 1 }} />
        <button
          type="button"
          className="btn"
          style={{ color: '#ef4444', fontSize: '.85rem' }}
          onClick={handleClearAll}
        >
          🗑️ ล้างทั้งหมด
        </button>
        <button
          type="button"
          className="btn btn-primary"
          style={{ fontSize: '.9rem', padding: '.6rem 1.5rem' }}
          onClick={handleSave}
        >
          💾 บันทึกวันที่
        </button>
      </div>

      {/* ── Preview card ── */}
      <div className="glass-card mt-4" style={{ background: '#fafafa', border: '1.5px dashed #d1d5db' }}>
        <div style={{ fontWeight: 700, fontSize: '.82rem', color: '#6b7280', marginBottom: '.85rem' }}>
          📋 ตัวอย่าง — วันที่ที่จะแสดงในสมุดรายงาน อ.01 (บันทึกพัฒนาการด้านร่างกาย)
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.8rem' }}>
            <thead>
              <tr style={{ background: '#f3f4f6' }}>
                <th style={{ padding: '7px 10px', border: '1px solid #e5e7eb', textAlign: 'left' }}>การวัด</th>
                <th style={{ padding: '7px 10px', border: '1px solid #e5e7eb', textAlign: 'left' }}>วันที่วัด (ค่าเริ่มต้น)</th>
              </tr>
            </thead>
            <tbody>
              {SLOTS.map((slot, i) => (
                <tr key={slot.key} style={{ background: i >= 2 ? '#f0fdf4' : 'white' }}>
                  <td style={{ padding: '7px 10px', border: '1px solid #e5e7eb', fontWeight: 700 }}>
                    {slot.label}
                    <div style={{ fontSize: '.7rem', color: '#9ca3af', fontWeight: 400 }}>{slot.hint}</div>
                  </td>
                  <td style={{ padding: '7px 10px', border: '1px solid #e5e7eb' }}>
                    {form[slot.key]
                      ? <span style={{ fontWeight: 600, color: '#059669' }}>{thaiDate(form[slot.key])}</span>
                      : <span style={{ color: '#d1d5db', fontStyle: 'italic' }}>ยังไม่กำหนด (ช่องว่าง)</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
