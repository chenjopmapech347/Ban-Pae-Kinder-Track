import { useState, useMemo } from 'react';
import { SOURCE_ACTIVITY_MAP } from '../../../data/evaluationConstants';
import {
  computeMonthlyStats, computeNutritionStats, computePickupStats,
  computeHealthCheckStats, computeIllnessStats, computeCornerStats,
  computeEventStats, computeRoutineStats,
  pctColor, pctBg, pctToScore,
} from '../../../utils/evaluationHelpers';

export default function DailyContextPanel({
  classStudents,
  toothBrushRecords, lunchRecords, milkRecords, nutritionRecords,
  pickupRecords, healthCheckRecords, illnessCheckRecords,
  cornerRecords, innerCornerRecords, dailyRoutineRecords, specialEvents,
  selClass, onSuggest, onSuggestAll,
}) {
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState('tooth');

  const stats = useMemo(() => {
    const classStudentIds = classStudents.map(s => s.id);
    // กิจกรรมประจำวัน — class-level (เหมือนกันทุกนักเรียนในห้อง)
    const routineStats = {
      morning:  computeRoutineStats(dailyRoutineRecords, selClass, 'morning'),
      exercise: computeRoutineStats(dailyRoutineRecords, selClass, 'exercise'),
      circle:   computeRoutineStats(dailyRoutineRecords, selClass, 'circle'),
      story:    computeRoutineStats(dailyRoutineRecords, selClass, 'story'),
      cleanup:  computeRoutineStats(dailyRoutineRecords, selClass, 'cleanup'),
      dressing: computeRoutineStats(dailyRoutineRecords, selClass, 'dressing'),
      dance:    computeRoutineStats(dailyRoutineRecords, selClass, 'dance'),
    };
    const result = {};
    classStudents.forEach(s => {
      result[s.id] = {
        attend: s.attendance?.total > 0
          ? { done: s.attendance.present, total: s.attendance.total,
              pct: Math.round(s.attendance.present / s.attendance.total * 100) }
          : null,
        tooth:        computeMonthlyStats(toothBrushRecords,  s.id, selClass),
        lunch:        computeMonthlyStats(lunchRecords,        s.id, selClass),
        milk:         computeMonthlyStats(milkRecords,         s.id, selClass),
        nutrition:    computeNutritionStats(nutritionRecords,  s.id, selClass),
        pickup:       computePickupStats(pickupRecords,        s.id, classStudentIds),
        health_check: computeHealthCheckStats(healthCheckRecords, s.id, selClass),
        illness:      computeIllnessStats(illnessCheckRecords, s.id, selClass),
        outdoor:      computeCornerStats(cornerRecords,        s.id, selClass),
        corner:       computeCornerStats(innerCornerRecords,   s.id, selClass),
        art:          computeCornerStats(innerCornerRecords,   s.id, selClass),
        events:       computeEventStats(specialEvents,         s.id, selClass),
        // กิจกรรมประจำวัน — ทุกนักเรียนในห้องได้ค่าเดียวกัน
        ...routineStats,
      };
    });
    return result;
  }, [classStudents, toothBrushRecords, lunchRecords, milkRecords, nutritionRecords,
      pickupRecords, healthCheckRecords, illnessCheckRecords, cornerRecords, innerCornerRecords,
      dailyRoutineRecords, specialEvents, selClass]);

  const SOURCES = [
    { key: 'attend',       label: '✅ มาเรียน' },
    { key: 'tooth',        label: '🪥 แปรงฟัน' },
    { key: 'lunch',        label: '🍱 อาหาร' },
    { key: 'milk',         label: '🥛 นม' },
    { key: 'nutrition',    label: '🥗 โภชนาการ' },
    { key: 'pickup',       label: '🚌 รับกลับบ้าน' },
    { key: 'health_check', label: '🩺 ตรวจสุขภาพ' },
    { key: 'illness',      label: '🤒 ไม่ป่วย' },
    { key: 'outdoor',      label: '🌳 นอกห้อง (GM)' },
    { key: 'corner',       label: '🧩 มุมในห้อง' },
    { key: 'art',          label: '🎨 ศิลปะ (FM)' },
    { key: 'events',       label: '🎉 วันสำคัญ' },
    { key: 'morning',      label: '🌅 กิจกรรมเช้า' },
    { key: 'exercise',     label: '🏃 ออกกำลังกาย' },
    { key: 'dance',        label: '💃 เต้น/โยคะ (GM)' },
    { key: 'circle',       label: '💬 วงกลม' },
    { key: 'story',        label: '📖 เล่านิทาน' },
    { key: 'cleanup',      label: '🧹 เก็บของ' },
    { key: 'dressing',     label: '👗 แต่งตัว' },
  ];

  function handleSuggest() {
    const suggested = {};
    classStudents.forEach(s => {
      const st = stats[s.id]?.[from];
      suggested[s.id] = pctToScore(st?.pct ?? null);
    });
    onSuggest(suggested);
  }

  return (
    <div style={{ marginTop: '1rem', border: '1.5px solid #ddd6fe', borderRadius: '14px', overflow: 'hidden' }}>
      {/* ── Toggle header ── */}
      <button type="button" onClick={() => setOpen(o => !o)} style={{
        width: '100%', textAlign: 'left',
        background: open ? '#f5f3ff' : '#faf5ff',
        border: 'none', padding: '.6rem 1.1rem', cursor: 'pointer', fontFamily: 'inherit',
        display: 'flex', alignItems: 'center', gap: '.6rem',
      }}>
        <span style={{ fontSize: '.78rem', fontWeight: 800, color: '#7c3aed',
          textTransform: 'uppercase', letterSpacing: '.05em' }}>
          📊 ข้อมูลกิจกรรมประจำวัน (เชื่อมโยงตัวบ่งชี้)
        </span>
        <span style={{ marginLeft: 'auto', fontSize: '.82rem', color: '#7c3aed' }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{ padding: '1rem 1.2rem', background: 'white' }}>
          {/* ── Auto-suggest bar ── */}
          <div style={{
            display: 'flex', gap: '.75rem', flexWrap: 'wrap', alignItems: 'center',
            background: '#faf5ff', border: '1.5px solid #ddd6fe', borderRadius: '10px',
            padding: '.6rem 1rem', marginBottom: '1rem',
          }}>
            <span style={{ fontSize: '.78rem', fontWeight: 700, color: '#7c3aed', flexShrink: 0 }}>💡 เสนอคะแนนจาก:</span>
            <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
              {SOURCES.map(src => (
                <button key={src.key} type="button" onClick={() => setFrom(src.key)} style={{
                  padding: '.22rem .65rem', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit',
                  border: `1.5px solid ${from === src.key ? '#7c3aed' : '#e5e7eb'}`,
                  background: from === src.key ? '#ede9fe' : 'white',
                  color: from === src.key ? '#7c3aed' : '#6b7280',
                  fontWeight: 700, fontSize: '.78rem',
                }}>{src.label}</button>
              ))}
            </div>
            <button type="button" onClick={handleSuggest} style={{
              padding: '.28rem .9rem', borderRadius: '8px', border: 'none',
              background: '#7c3aed', color: 'white', fontFamily: 'inherit',
              fontWeight: 700, fontSize: '.8rem', cursor: 'pointer',
            }}>✨ เสนอคะแนนทั้งห้อง</button>
            {SOURCE_ACTIVITY_MAP[from] && (
              <button type="button" onClick={() => {
                const suggested = {};
                classStudents.forEach(s => {
                  const st = stats[s.id]?.[from];
                  suggested[s.id] = pctToScore(st?.pct ?? null);
                });
                onSuggestAll(from, suggested);
              }} style={{
                padding: '.28rem .9rem', borderRadius: '8px', border: 'none',
                background: '#059669', color: 'white', fontFamily: 'inherit',
                fontWeight: 700, fontSize: '.8rem', cursor: 'pointer',
              }}>
                💾 บันทึก {SOURCE_ACTIVITY_MAP[from].length} กิจกรรมที่เชื่อมโยง
              </button>
            )}
            <span style={{ fontSize: '.72rem', color: '#9ca3af' }}>≥80%→3 · 60-79%→2 · &lt;60%→1</span>
          </div>

          {/* ── Stats table ── */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.8rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: '7px 12px', border: '1px solid #e5e7eb', textAlign: 'center', fontWeight: 700 }}>ชื่อ-นามสกุล</th>
                  {SOURCES.map(src => (
                    <th key={src.key} style={{ padding: '7px 10px', border: '1px solid #e5e7eb',
                      textAlign: 'center', fontWeight: 700, minWidth: '100px' }}>
                      {src.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {classStudents.map((s, idx) => (
                  <tr key={s.id} style={{ background: idx % 2 ? '#fafafa' : 'white' }}>
                    <td style={{ padding: '6px 12px', border: '1px solid #e5e7eb', fontWeight: 600 }}>{s.name}</td>
                    {SOURCES.map(src => {
                      const st  = stats[s.id]?.[src.key];
                      const pct = st?.pct ?? null;
                      return (
                        <td key={src.key} style={{ padding: '6px 10px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                          {pct !== null ? (
                            <span style={{
                              background: pctBg(pct), color: pctColor(pct),
                              borderRadius: '6px', padding: '2px 7px',
                              fontWeight: 700, fontSize: '.78rem', display: 'inline-block',
                            }}>{st.done}/{st.total} ({pct}%)</span>
                          ) : (
                            <span style={{ color: '#d1d5db', fontSize: '.75rem' }}>—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ fontSize: '.71rem', color: '#9ca3af', marginTop: '.45rem' }}>
            * รวมทุกเดือนที่บันทึกในปีการศึกษานี้ · 🥗 โภชนาการ = จำนวนครั้งที่วัดน้ำหนัก/ส่วนสูง ÷ ครั้งที่บันทึกทั้งหมดในห้อง · คลิก "เสนอคะแนนทั้งห้อง" เพื่อเติมคะแนนอัตโนมัติ (ครูยังแก้ไขได้)
          </div>
        </div>
      )}
    </div>
  );
}

