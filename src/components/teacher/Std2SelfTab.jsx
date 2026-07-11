// Std2SelfTab.jsx
// มาตรฐานที่ 2 — แบบประเมินตนเองสำหรับครู (per-teacher, stored in Firestore: std2_ratings/<teacherId>)
import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { isFirebaseConfigured, db } from '../../lib/firebase';
import { useApp } from '../../context/AppContext';

const STD2_ITEMS = [
  { id: '2.1', label: 'วางแผนและจัดทำหลักสูตรสถานศึกษาตามหลักสูตรปฐมวัย พ.ศ. 2560' },
  { id: '2.2', label: 'จัดประสบการณ์ส่งเสริมพัฒนาการด้านร่างกายอย่างสม่ำเสมอ' },
  { id: '2.3', label: 'จัดประสบการณ์ส่งเสริมพัฒนาการด้านอารมณ์-จิตใจและคุณธรรม' },
  { id: '2.4', label: 'จัดประสบการณ์ส่งเสริมพัฒนาการด้านสังคมและทักษะชีวิต' },
  { id: '2.5', label: 'จัดประสบการณ์ส่งเสริมพัฒนาการด้านสติปัญญาและภาษา' },
  { id: '2.6', label: 'ส่งเสริมการเรียนรู้ผ่านการเล่นและกิจกรรมบูรณาการ' },
  { id: '2.7', label: 'ประเมินพัฒนาการเด็กอย่างเป็นระบบ ต่อเนื่อง และรายงานผู้ปกครอง' },
  { id: '2.8', label: 'สร้างความสัมพันธ์ที่ดีกับผู้ปกครองและสื่อสารพัฒนาการเด็กสม่ำเสมอ' },
];

const RATINGS = [
  { value: 3, label: 'ดีมาก',      color: '#16a34a', bg: '#dcfce7' },
  { value: 2, label: 'พอใช้',      color: '#d97706', bg: '#fef3c7' },
  { value: 1, label: 'ต้องพัฒนา', color: '#dc2626', bg: '#fee2e2' },
];

function ratingMeta(v) {
  return RATINGS.find(r => r.value === v) ?? { color: '#9ca3af', bg: '#f3f4f6' };
}

function calcScore(items, ratings) {
  const rated = items.filter(it => (ratings[it.id] ?? 0) > 0);
  if (rated.length === 0) return null;
  const total = rated.reduce((s, it) => s + (ratings[it.id] ?? 0), 0);
  return Math.round((total / (rated.length * 3)) * 100);
}

function ScoreLabel({ score }) {
  if (score === null) return <span style={{ fontSize: '.7rem', color: '#9ca3af' }}>ยังไม่ประเมิน</span>;
  if (score >= 80) return <span style={{ fontSize: '.7rem', color: '#16a34a' }}>ดีมาก</span>;
  if (score >= 60) return <span style={{ fontSize: '.7rem', color: '#d97706' }}>พอใช้</span>;
  return <span style={{ fontSize: '.7rem', color: '#dc2626' }}>ต้องพัฒนา</span>;
}

export default function Std2SelfTab() {
  const { user } = useApp();
  // ใช้ teacherId (key ที่ login เซ็ตไว้) ไม่ใช่ user.id ที่อาจไม่มี
  const teacherId = user?.teacherId ?? user?.id ?? 'unknown';
  const [ratings, setRatings] = useState({});

  // Real-time listener: Firestore std2_ratings/<teacherId>
  useEffect(() => {
    if (!isFirebaseConfigured || !db || teacherId === 'unknown') return;
    const ref = doc(db, 'std2_ratings', teacherId);
    const unsub = onSnapshot(ref, snap => {
      setRatings(snap.exists() ? snap.data() : {});
    });
    return () => unsub();
  }, [teacherId]);

  // Save to Firestore (merge เพื่อไม่ทับ field อื่น)
  const update = async (id, val) => {
    if (!isFirebaseConfigured || !db || teacherId === 'unknown') return;
    const ref = doc(db, 'std2_ratings', teacherId);
    await setDoc(ref, { [id]: val }, { merge: true });
  };

  const score      = calcScore(STD2_ITEMS, ratings);
  const ratedCount = STD2_ITEMS.filter(it => (ratings[it.id] ?? 0) > 0).length;
  const barPct     = score ?? 0;
  const barColor   = score === null ? '#9ca3af' : score >= 80 ? '#16a34a' : score >= 60 ? '#d97706' : '#dc2626';

  return (
    <div className="glass p-6 animate-fade">
      {/* Header */}
      <div className="page-header mb-2">
        <h3>👩‍🏫 มาตรฐานที่ 2 — ประเมินตนเอง</h3>
      </div>
      <p style={{ fontSize: '.8rem', color: '#6b7280', marginBottom: '1.25rem' }}>
        ครู/ผู้ดูแลเด็กให้การดูแลและจัดประสบการณ์เรียนรู้ · 8 ตัวบ่งชี้
      </p>

      {/* Info banner */}
      <div style={{
        background: '#f5f3ff', border: '1px solid #ddd6fe',
        borderRadius: '10px', padding: '.7rem 1rem',
        fontSize: '.78rem', color: '#5b21b6', marginBottom: '1.25rem',
      }}>
        📝 กรอกแบบประเมินตนเองในฐานะครูผู้สอน — ผู้บริหารสามารถดูภาพรวมรายบุคคลได้จากเมนู ระบบจัดการ → มาตรฐานแห่งชาติ
      </div>

      {/* Score card */}
      <div style={{
        background: score !== null ? '#7c3aed' : '#6b7280',
        color: 'white', borderRadius: '14px', padding: '1rem 1.5rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '1rem',
      }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: '.95rem' }}>คะแนนรวม</div>
          <div style={{ fontSize: '.72rem', opacity: .85, marginTop: '.2rem' }}>
            ประเมินแล้ว {ratedCount}/{STD2_ITEMS.length} ตัวบ่งชี้
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          {score !== null ? (
            <>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, lineHeight: 1 }}>{score}%</div>
              <ScoreLabel score={score} />
            </>
          ) : (
            <div style={{ fontSize: '.85rem', opacity: .8 }}>ยังไม่ประเมิน</div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: '8px', background: '#e5e7eb', borderRadius: '99px', overflow: 'hidden', marginBottom: '1.25rem' }}>
        <div style={{
          height: '100%', width: `${barPct}%`,
          background: barColor, borderRadius: '99px', transition: 'width .4s ease',
        }} />
      </div>

      {/* Checklist items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
        {STD2_ITEMS.map((item, idx) => {
          const val = ratings[item.id] ?? 0;
          const rm  = val > 0 ? ratingMeta(val) : null;
          return (
            <div key={item.id} style={{
              display: 'flex', alignItems: 'center', gap: '.75rem',
              padding: '.65rem .85rem', borderRadius: '12px',
              background: rm ? `${rm.bg}99` : '#f9fafb',
              border: `1.5px solid ${rm ? rm.bg : '#e5e7eb'}`,
              transition: 'background .15s',
            }}>
              {/* Number */}
              <div style={{
                minWidth: '28px', height: '28px', borderRadius: '8px',
                background: val > 0 ? (rm?.color + '22') : '#e5e7eb',
                color: val > 0 ? rm?.color : '#9ca3af',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '.72rem', fontWeight: 900, flexShrink: 0,
              }}>
                {idx + 1}
              </div>
              {/* Code */}
              <div style={{ minWidth: '32px', fontWeight: 800, fontSize: '.73rem', color: '#7c3aed', flexShrink: 0 }}>
                {item.id}
              </div>
              {/* Label */}
              <div style={{ flex: 1, fontSize: '.83rem', color: '#374151', lineHeight: 1.45 }}>
                {item.label}
              </div>
              {/* Rating buttons */}
              <div style={{ display: 'flex', gap: '.3rem', flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                {RATINGS.map(r => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => update(item.id, val === r.value ? 0 : r.value)}
                    style={{
                      padding: '4px 11px', borderRadius: '7px', border: 'none', cursor: 'pointer',
                      fontWeight: 700, fontSize: '.7rem', fontFamily: 'inherit',
                      transition: 'all .12s',
                      background: val === r.value ? r.color : '#f3f4f6',
                      color: val === r.value ? 'white' : '#9ca3af',
                      boxShadow: val === r.value ? `0 2px 6px ${r.color}55` : 'none',
                    }}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      {ratedCount > 0 && (
        <div style={{ marginTop: '1.25rem', padding: '1rem', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '.8rem', fontWeight: 700, color: '#374151', marginBottom: '.6rem' }}>
            📊 สรุปผลการประเมิน
          </div>
          <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
            {RATINGS.map(r => {
              const count = STD2_ITEMS.filter(it => ratings[it.id] === r.value).length;
              return count > 0 ? (
                <span key={r.value} style={{
                  fontSize: '.75rem', fontWeight: 700,
                  background: r.bg, color: r.color,
                  padding: '4px 12px', borderRadius: '8px',
                }}>
                  {r.label} {count} ข้อ
                </span>
              ) : null;
            })}
            {ratedCount < STD2_ITEMS.length && (
              <span style={{ fontSize: '.75rem', color: '#9ca3af', background: '#f3f4f6', padding: '4px 12px', borderRadius: '8px' }}>
                ยังไม่ประเมิน {STD2_ITEMS.length - ratedCount} ข้อ
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
