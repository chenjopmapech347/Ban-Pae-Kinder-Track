import { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { todayISO, formatDateThai, getMondayOf } from '../../utils/helpers';

/**
 * TeacherOverviewTab — แสดงรายการกิจกรรมที่ต้องบันทึก จำแนกตามความถี่
 * ประจำวัน / ประจำสัปดาห์ / ประจำเดือน / ตามโอกาส
 */
export default function TeacherOverviewTab({ onTabChange }) {
  const {
    user, students,
    academicYear,
    dailyRecords,
    pickupRecords,
    healthCheckRecords,
    illnessCheckRecords,
    toothBrushRecords,
    lunchRecords,
    milkRecords,
    dailyRoutineRecords,
    cornerRecords,
    innerCornerRecords,
    nutritionRecords,
    specialEvents,
  } = useApp();

  const myClass = user?.className;
  const today   = todayISO();
  const todayTH = formatDateThai(today);

  const myStudents = useMemo(
    () => students.filter(s => s.className === myClass && !s.name.startsWith('(ว่าง)') && (s.status ?? 'ปกติ') === 'ปกติ'),
    [students, myClass],
  );

  // ── คีย์ที่ใช้สำหรับ record ต่างๆ ────────────────────────────────────────
  const dayKey   = today;                                          // YYYY-MM-DD
  const hxKey    = `${myClass}__${academicYear}__${today}`;       // healthcheck/illnesscheck/etc.
  const monthKey = `${myClass}__${academicYear}__${today.slice(0, 7)}`; // YYYY-MM
  const weekKey  = `${myClass}||${getMondayOf(today)}`;            // corner / innerCorner

  // วันในสัปดาห์ (0=อาทิตย์ ข้ามได้ในระบบโรงเรียน)
  const todayDay = new Date(today).getDay();
  const isWeekend = todayDay === 0 || todayDay === 6;

  // ── ตรวจสอบสถานะแต่ละกิจกรรม ────────────────────────────────────────────
  const status = useMemo(() => {
    // ประจำวัน
    const hasAttendance = myStudents.some(s =>
      dailyRecords[dayKey]?.[String(s.id)]?.attendance != null,
    );
    const hasPickup = Object.keys(pickupRecords[dayKey] ?? {}).length > 0;
    const hasHealthCheck  = !!healthCheckRecords[hxKey];
    const hasIllnessCheck = !!illnessCheckRecords[hxKey];
    const hasToothBrush   = !!toothBrushRecords[hxKey];
    const hasLunch        = !!lunchRecords[hxKey];

    // ประจำสัปดาห์
    const hasCorner      = !!cornerRecords[weekKey];
    const hasInnerCorner = !!innerCornerRecords[weekKey];

    // ประจำเดือน
    const hasMilk        = !!milkRecords[monthKey];
    const hasDailyRoutine = !!dailyRoutineRecords[monthKey];

    // ตามโอกาส / ประจำปี
    const hasNutrition  = Object.keys(nutritionRecords ?? {}).length > 0;
    const hasSpecialEvent = Object.keys(specialEvents ?? {}).length > 0;

    return {
      hasAttendance, hasPickup,
      hasHealthCheck, hasIllnessCheck, hasToothBrush, hasLunch,
      hasCorner, hasInnerCorner,
      hasMilk, hasDailyRoutine,
      hasNutrition, hasSpecialEvent,
    };
  }, [
    myStudents, dailyRecords, pickupRecords,
    healthCheckRecords, illnessCheckRecords, toothBrushRecords, lunchRecords,
    cornerRecords, innerCornerRecords, milkRecords, dailyRoutineRecords,
    nutritionRecords, specialEvents,
    dayKey, hxKey, weekKey, monthKey,
  ]);

  // สรุปสถานะรวม
  const dailyItems = [
    status.hasAttendance, status.hasPickup,
    status.hasHealthCheck, status.hasIllnessCheck,
    status.hasToothBrush, status.hasLunch,
  ];
  const dailyDone  = dailyItems.filter(Boolean).length;
  const dailyTotal = dailyItems.length;
  const allDailyDone = dailyDone === dailyTotal;

  return (
    <div className="animate-fade">

      {/* ── Header ── */}
      <div className="glass-card mb-4" style={{
        background: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)',
        color: 'white', padding: '1.25rem 1.5rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '.5rem' }}>
          <div>
            <div style={{ fontSize: '.78rem', opacity: .85, fontWeight: 600, marginBottom: '.2rem' }}>
              ภาพรวมกิจกรรมวันนี้ · ห้อง {myClass ?? '—'}
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>
              📅 {todayTH}
              {isWeekend && <span style={{ marginLeft: '.6rem', fontSize: '.78rem', background: 'rgba(255,255,255,.2)', borderRadius: '999px', padding: '.1rem .6rem' }}>วันหยุด</span>}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '2rem', fontWeight: 900 }}>{dailyDone}/{dailyTotal}</div>
            <div style={{ fontSize: '.72rem', opacity: .85 }}>กิจกรรมประจำวัน</div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ marginTop: '.85rem', background: 'rgba(255,255,255,.25)', borderRadius: '999px', height: '8px', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: '999px',
            background: allDailyDone ? '#86efac' : 'white',
            width: `${(dailyDone / dailyTotal) * 100}%`,
            transition: 'width .4s ease',
          }} />
        </div>
        {allDailyDone && (
          <div style={{ marginTop: '.5rem', fontSize: '.78rem', fontWeight: 700, color: '#86efac' }}>
            ✅ บันทึกกิจกรรมประจำวันครบแล้ว!
          </div>
        )}
      </div>

      {/* ── ประจำวัน ── */}
      <FreqSection
        label="กิจกรรมประจำวัน"
        emoji="☀️"
        color="#0891b2"
        bg="#f0f9ff"
        subtitle={`ควรบันทึกทุกวันทำการ · วันที่ ${todayTH}`}
        items={[
          { icon: '✅', label: 'การมาเรียน',      tab: 'attendance',   done: status.hasAttendance   },
          { icon: '🚗', label: 'รับกลับบ้าน',     tab: 'pickup',       done: status.hasPickup       },
          { icon: '🏥', label: 'ตรวจสุขภาพ',      tab: 'healthcheck',  done: status.hasHealthCheck  },
          { icon: '🤒', label: 'คัดกรองอาการป่วย', tab: 'illnesscheck', done: status.hasIllnessCheck },
          { icon: '🪥', label: 'แปรงฟัน',         tab: 'toothbrush',   done: status.hasToothBrush   },
          { icon: '🍱', label: 'อาหารกลางวัน',     tab: 'lunch',        done: status.hasLunch        },
          { icon: '🥛', label: 'ดื่มนม',           tab: 'milk',         done: status.hasMilk         },
          { icon: '🗓️', label: 'กิจกรรมประจำวัน',  tab: 'dailyroutine', done: status.hasDailyRoutine },
        ]}
        onTabChange={onTabChange}
      />

      {/* ── ประจำสัปดาห์ ── */}
      <FreqSection
        label="กิจกรรมประจำสัปดาห์"
        emoji="📆"
        color="#059669"
        bg="#f0fdf4"
        subtitle={`สัปดาห์นี้เริ่ม ${formatDateThai(weekKey)}`}
        items={[
          { icon: '🌿', label: 'แหล่งเรียนรู้นอกห้อง', tab: 'corner',      done: status.hasCorner      },
          { icon: '🏡', label: 'มุมประสบการณ์ในห้อง',  tab: 'innercorner', done: status.hasInnerCorner },
        ]}
        onTabChange={onTabChange}
      />

      {/* ── ตามโอกาส / ประจำปี ── */}
      <FreqSection
        label="กิจกรรมตามโอกาส"
        emoji="🎯"
        color="#7c3aed"
        bg="#faf5ff"
        subtitle="บันทึกตามความจำเป็น หรือตามปฏิทินโรงเรียน"
        items={[
          { icon: '⚖️', label: 'ภาวะโภชนาการ',    tab: 'nutrition',   done: status.hasNutrition,   note: 'รายภาคเรียน' },
          { icon: '🎉', label: 'กิจกรรมวันสำคัญ',  tab: 'specialevent', done: status.hasSpecialEvent, note: 'เมื่อมีกิจกรรม' },
        ]}
        onTabChange={onTabChange}
      />

    </div>
  );
}

/* ── ส่วนย่อย FreqSection ── */
function FreqSection({ label, emoji, color, bg, subtitle, items, onTabChange }) {
  const doneCount = items.filter(i => i.done).length;
  const allDone   = doneCount === items.length;

  return (
    <div className="glass-card mb-4" style={{ padding: '1.1rem 1.25rem' }}>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '.85rem', flexWrap: 'wrap' }}>
        <span style={{
          background: color, color: 'white',
          borderRadius: '999px', padding: '.2rem .75rem',
          fontSize: '.78rem', fontWeight: 800,
        }}>
          {emoji} {label}
        </span>
        <span style={{ fontSize: '.72rem', color: '#6b7280' }}>{subtitle}</span>
        <span style={{ marginLeft: 'auto', fontSize: '.72rem', fontWeight: 700, color: allDone ? '#065f46' : '#6b7280' }}>
          {allDone ? '✅ ครบแล้ว' : `${doneCount}/${items.length}`}
        </span>
      </div>

      {/* Activity items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.45rem' }}>
        {items.map(item => (
          <ActivityRow
            key={item.tab}
            item={item}
            accentColor={color}
            bg={bg}
            onTabChange={onTabChange}
          />
        ))}
      </div>
    </div>
  );
}

/* ── แถวกิจกรรมแต่ละรายการ ── */
function ActivityRow({ item, accentColor, bg, onTabChange }) {
  const { icon, label, tab, done, note } = item;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '.75rem',
      padding: '.55rem .85rem', borderRadius: '10px',
      background: done ? '#f0fdf4' : bg,
      border: `1.5px solid ${done ? '#86efac' : '#e5e7eb'}`,
      transition: 'all .15s',
    }}>
      {/* Status dot */}
      <span style={{
        fontSize: '1rem', lineHeight: 1, flexShrink: 0,
        filter: done ? 'none' : 'grayscale(100%) opacity(0.35)',
      }}>
        {icon}
      </span>

      {/* Label */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{
          fontWeight: 700, fontSize: '.88rem',
          color: done ? '#065f46' : '#374151',
        }}>
          {label}
        </span>
        {note && (
          <span style={{ marginLeft: '.4rem', fontSize: '.7rem', color: '#9ca3af' }}>({note})</span>
        )}
      </div>

      {/* Status badge */}
      <span style={{
        fontSize: '.7rem', fontWeight: 800, borderRadius: '999px',
        padding: '.15rem .6rem', flexShrink: 0,
        background: done ? '#dcfce7' : '#fee2e2',
        color: done ? '#166534' : '#991b1b',
      }}>
        {done ? '✓ บันทึกแล้ว' : '○ ยังไม่บันทึก'}
      </span>

      {/* Nav button */}
      <button
        type="button"
        onClick={() => onTabChange?.(tab)}
        style={{
          fontSize: '.75rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          flexShrink: 0, padding: '.22rem .65rem', borderRadius: '7px',
          border: `1.5px solid ${done ? '#86efac' : accentColor}`,
          background: done ? 'white' : accentColor,
          color: done ? '#065f46' : 'white',
          transition: 'all .15s',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={e => { e.currentTarget.style.opacity = '.8'; }}
        onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
      >
        {done ? '📝 แก้ไข' : '→ ไปบันทึก'}
      </button>
    </div>
  );
}
