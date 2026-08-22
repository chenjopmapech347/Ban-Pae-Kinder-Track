/* ─────────────────────────────────────────────────────────────
   ActivityScheduleTab.jsx  (Firestore-backed + dynamic corner defs)
   แสดงเฉพาะกิจกรรมที่กำหนดไว้ต่อห้องเรียน ผ่าน classInnerCornerKeys / classOuterCornerKeys
   ───────────────────────────────────────────────────────────── */
import { useState, useEffect, useMemo } from 'react';
import { db } from '../../lib/firebase';
import { collection, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { useApp } from '../../context/AppContext';

/* ── Static constants ─────────────────────────────────────────── */
const DAYS = ['จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์'];
const DAY_CLR = {
  จันทร์:'#1565C0', อังคาร:'#6A1B9A',
  พุธ:'#2E7D32', พฤหัสบดี:'#B71C1C', ศุกร์:'#E65100',
};
const LEVEL_META = {
  '1': { label:'อนุบาล ๑', hd:'linear-gradient(90deg,#1565C0,#1976D2)' },
  '2': { label:'อนุบาล ๒', hd:'linear-gradient(90deg,#2E7D32,#388E3C)' },
  '3': { label:'อนุบาล ๓', hd:'linear-gradient(90deg,#6A1B9A,#7B1FA2)' },
};

/* ── Legacy colors / labels — backward-compat for old Firestore records ── */
const LEGACY_PS = {
  eng: { bg:'#FFFDE7', color:'#E65100', border:'#FFE082' },
  ef:  { bg:'#E3F2FD', color:'#0D47A1', border:'#90CAF9' },
  com: { bg:'#E0F7FA', color:'#006064', border:'#80DEEA' },
  res: { bg:'#F3E5F5', color:'#6A1B9A', border:'#CE93D8' },
  gar: { bg:'#E8F5E9', color:'#1B5E20', border:'#A5D6A7' },
  wst: { bg:'#FFF3E0', color:'#BF360C', border:'#FFAB91' },
  pe:  { bg:'#FCE4EC', color:'#880E4F', border:'#F48FB1' },
};
const LEGACY_LABEL = {
  eng:'Eng (ภาษาอังกฤษ)', ef:'ห้องสื่อ EF', com:'คอมพิวเตอร์',
  res:'ห้องแหล่งเรียนรู้', gar:'แปลงผัก', wst:'คัดแยกขยะ', pe:'พลศึกษา',
};
// legacy inner keys (for backward-compat in/out counting)
const LEGACY_IN_KEYS = new Set(['eng','ef','com','res']);

/* ── Color palettes for dynamic defs ─────────────────────────── */
const INNER_PALETTE = [
  { bg:'#FFFDE7', color:'#E65100', border:'#FFE082' },
  { bg:'#E3F2FD', color:'#0D47A1', border:'#90CAF9' },
  { bg:'#E0F7FA', color:'#006064', border:'#80DEEA' },
  { bg:'#F3E5F5', color:'#6A1B9A', border:'#CE93D8' },
  { bg:'#E8EAF6', color:'#283593', border:'#9FA8DA' },
  { bg:'#FBE9E7', color:'#BF360C', border:'#FFAB91' },
  { bg:'#FFF8E1', color:'#F57F17', border:'#FFE57F' },
  { bg:'#F9FBE7', color:'#558B2F', border:'#DCEDC8' },
];
const OUTER_PALETTE = [
  { bg:'#E8F5E9', color:'#1B5E20', border:'#A5D6A7' },
  { bg:'#F1F8E9', color:'#33691E', border:'#C5E1A5' },
  { bg:'#FCE4EC', color:'#880E4F', border:'#F48FB1' },
  { bg:'#FFF3E0', color:'#BF360C', border:'#FFAB91' },
  { bg:'#E0F2F1', color:'#004D40', border:'#80CBC4' },
  { bg:'#EFEBE9', color:'#3E2723', border:'#D7CCC8' },
];
const DEFAULT_CLR = { bg:'#F5F5F5', color:'#616161', border:'#E0E0E0' };

/* ── Seed data — empty activities, rooms only ─────────────────── */
const SEED_ROOMS = [
  { id:'1_1', levelKey:'1', name:'ห้อง อ.1/1', days:{ จันทร์:[], อังคาร:[], พุธ:[], พฤหัสบดี:[], ศุกร์:[] } },
  { id:'1_2', levelKey:'1', name:'ห้อง อ.1/2', days:{ จันทร์:[], อังคาร:[], พุธ:[], พฤหัสบดี:[], ศุกร์:[] } },
  { id:'2_1', levelKey:'2', name:'ห้อง อ.2/1', days:{ จันทร์:[], อังคาร:[], พุธ:[], พฤหัสบดี:[], ศุกร์:[] } },
  { id:'2_2', levelKey:'2', name:'ห้อง อ.2/2', days:{ จันทร์:[], อังคาร:[], พุธ:[], พฤหัสบดี:[], ศุกร์:[] } },
  { id:'3_1', levelKey:'3', name:'ห้อง อ.3/1', days:{ จันทร์:[], อังคาร:[], พุธ:[], พฤหัสบดี:[], ศุกร์:[] } },
  { id:'3_2', levelKey:'3', name:'ห้อง อ.3/2', days:{ จันทร์:[], อังคาร:[], พุธ:[], พฤหัสบดี:[], ศุกร์:[] } },
  { id:'3_3', levelKey:'3', name:'ห้อง อ.3/3', days:{ จันทร์:[], อังคาร:[], พุธ:[], พฤหัสบดี:[], ศุกร์:[] } },
];

/* ── Legacy sample schedule — for restoring initial data ─────── */
/* NOTE: Firestore does NOT support nested arrays — must use objects */
const LEGACY_SAMPLE_DAYS = {
  จันทร์:    [{type:'gar', time:'09.00', label:'แปลงผัก'}],
  อังคาร:   [{type:'eng', time:'09.00', label:'Eng (ภาษาอังกฤษ)'}],
  พุธ:      [{type:'pe',  time:'09.30', label:'พลศึกษา'}, {type:'com', time:'10.30', label:'คอมพิวเตอร์'}],
  พฤหัสบดี: [{type:'wst', time:'09.00', label:'คัดแยกขยะ'}, {type:'ef', time:'10.00', label:'ห้องสื่อ EF'}],
  ศุกร์:    [{type:'res', time:'09.00', label:'ห้องแหล่งเรียนรู้'}],
};

/* ── Helpers ──────────────────────────────────────────────────── */
function computeCounts(days, innerKeySet) {
  let inC = 0, outC = 0;
  DAYS.forEach(day => {
    (days[day] ?? []).forEach(({type}) => {
      if (innerKeySet.has(type)) inC++; else outC++;
    });
  });
  return { inC, outC };
}

function computeDailySummary(rooms) {
  const res = {};
  DAYS.forEach(d => { res[d] = {}; });
  rooms.forEach(room => {
    DAYS.forEach(day => {
      (room.days[day] ?? []).forEach(({type}) => {
        res[day][type] = (res[day][type] ?? 0) + 1;
      });
    });
  });
  return res;
}

/* ── Pill ─────────────────────────────────────────────────────── */
function Pill({ clr, time, label }) {
  const s = clr ?? DEFAULT_CLR;
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:'4px',
      padding:'3px 9px 3px 7px', borderRadius:'20px',
      fontSize:'.79em', fontWeight:600, whiteSpace:'nowrap',
      background:s.bg, color:s.color, border:`1.5px solid ${s.border}`,
    }}>
      {time && <span style={{ fontSize:'.74em', opacity:.65 }}>{time}</span>}
      {label}
    </span>
  );
}

/* ── RoomCard ─────────────────────────────────────────────────── */
function RoomCard({ room, onEdit, getColor, getLabel, innerKeySet }) {
  const { inC, outC } = computeCounts(room.days, innerKeySet);
  const total = inC + outC;
  const pct   = total > 0 ? Math.round((inC / total) * 100) : 0;

  return (
    <div style={{ background:'white', padding:'12px 14px', flex:'1 1 320px', minWidth:'290px', position:'relative' }}>
      {/* header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                    marginBottom:'8px', paddingBottom:'7px', borderBottom:'2px solid #eceff1' }}>
        <span style={{ fontWeight:700, fontSize:'.9em', color:'#37474f' }}>{room.name}</span>
        <div style={{ display:'flex', gap:'4px', alignItems:'center' }}>
          <span style={{ fontSize:'.7em', fontWeight:700, padding:'2px 8px', borderRadius:'20px',
                         background:'#E3F2FD', color:'#0D47A1' }}>🏫 ใน {inC}</span>
          <span style={{ fontSize:'.7em', fontWeight:700, padding:'2px 8px', borderRadius:'20px',
                         background:'#E8F5E9', color:'#1B5E20' }}>🌿 นอก {outC}</span>
          <button
            onClick={onEdit}
            style={{
              marginLeft:'4px', padding:'3px 8px', borderRadius:'8px', border:'1px solid #d1d5db',
              background:'white', cursor:'pointer', fontSize:'.75em', color:'#6b7280',
              fontWeight:600, lineHeight:1.4, transition:'all .15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background='#f3f4f6'; e.currentTarget.style.color='#1565C0'; }}
            onMouseLeave={e => { e.currentTarget.style.background='white'; e.currentTarget.style.color='#6b7280'; }}
          >
            ✏️ แก้ไข
          </button>
        </div>
      </div>

      {/* day rows */}
      {DAYS.map(day => {
        const acts = room.days[day] ?? [];
        return (
          <div key={day} style={{ display:'flex', alignItems:'flex-start', gap:'7px',
                                  padding:'4px 0', borderBottom:'1px dashed #f0f4f0' }}>
            <span style={{ width:'70px', flexShrink:0, fontSize:'.82em',
                           fontWeight:700, color:'#546e7a', paddingTop:'5px' }}>{day}</span>
            <div style={{ flex:1, display:'flex', flexWrap:'wrap', gap:'4px', padding:'2px 0' }}>
              {acts.length > 0
                ? acts.map(({type:t,time:tm,label:lb},i) => (
                    <Pill key={i} clr={getColor(t)} time={tm} label={lb || getLabel(t)} />
                  ))
                : <span style={{ fontSize:'.73em', color:'#ccc', paddingTop:'6px', fontStyle:'italic' }}>
                    ไม่มีกิจกรรมพิเศษ
                  </span>
              }
            </div>
          </div>
        );
      })}

      {/* ratio bar */}
      <div style={{ marginTop:'9px', display:'flex', alignItems:'center', gap:'7px' }}>
        <span style={{ fontSize:'.72em', color:'#90a4ae', whiteSpace:'nowrap' }}>สัดส่วน ใน:นอก</span>
        <div style={{ flex:1, height:'7px', borderRadius:'7px', background:'#E8F5E9', overflow:'hidden' }}>
          <div style={{ width:`${pct}%`, height:'100%', borderRadius:'7px',
                        background:'linear-gradient(90deg,#1565C0,#42A5F5)' }} />
        </div>
        <span style={{ fontSize:'.72em', color:'#90a4ae', whiteSpace:'nowrap' }}>{pct}% : {100-pct}%</span>
      </div>
    </div>
  );
}

/* ── RoomEditModal ────────────────────────────────────────────── */
function RoomEditModal({ room, onClose, onSave, assignedInner, assignedOuter, getColor, getLabel, innerSchedule = [], outerSchedule = [] }) {
  const [activeDay, setActiveDay] = useState(DAYS[0]);
  const [editDays, setEditDays]   = useState(
    Object.fromEntries(DAYS.map(d => [d, [...(room.days[d] ?? [])]]))
  );
  const [saving, setSaving] = useState(false);

  // Combined available activity options for this room
  const availableOptions = useMemo(() => [
    ...assignedInner.map(def => ({ ...def, isInner: true })),
    ...assignedOuter.map(def => ({ ...def, isInner: false })),
  ], [assignedInner, assignedOuter]);

  const [newType, setNewType] = useState(() => availableOptions[0]?.key ?? '');
  const [newTime, setNewTime] = useState('');

  // Auto-fill from assignment schedule
  const allSchedule = useMemo(
    () => [...innerSchedule, ...outerSchedule].filter(e => e.days?.length > 0 && e.time),
    [innerSchedule, outerSchedule],
  );

  function autoFill() {
    setEditDays(prev => {
      const next = Object.fromEntries(Object.entries(prev).map(([d, acts]) => [d, [...acts]]));
      allSchedule.forEach(({ key, days, time }) => {
        days.forEach(day => {
          if (!DAYS.includes(day)) return;
          const existing = next[day] ?? [];
          const alreadyHas = existing.some(e => e.type === key);
          if (!alreadyHas) {
            const def = availableOptions.find(o => o.key === key);
            const label = def?.label ?? getLabel(key);
            next[day] = [...existing, {type:key, time, label}].sort((a, b) => a.time.localeCompare(b.time));
          }
        });
      });
      return next;
    });
  }

  const dayActs = editDays[activeDay] ?? [];

  const removeAct = (idx) =>
    setEditDays(prev => ({ ...prev, [activeDay]: prev[activeDay].filter((_,i) => i !== idx) }));

  const addAct = () => {
    if (!newType || !newTime.trim()) return;
    const t = newTime.trim().replace(':','.');
    const def = availableOptions.find(o => o.key === newType);
    const label = def?.label ?? getLabel(newType);
    setEditDays(prev => ({
      ...prev,
      [activeDay]: [...(prev[activeDay] ?? []), {type:newType, time:t, label}]
        .sort((a, b) => a.time.localeCompare(b.time)),
    }));
    setNewTime('');
  };

  const doSave = async () => {
    setSaving(true);
    await onSave(room.id, editDays);
  };

  const INP = { padding:'7px 10px', borderRadius:'8px', border:'1px solid #d1d5db',
                fontFamily:'inherit', fontSize:'.85rem', outline:'none' };

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position:'fixed', inset:0, background:'rgba(15,23,42,0.55)',
        display:'flex', alignItems:'center', justifyContent:'center',
        zIndex:9999, padding:'16px',
      }}
    >
      <div style={{
        background:'white', borderRadius:'16px', width:'100%',
        maxWidth:'560px', maxHeight:'90vh', display:'flex', flexDirection:'column',
        boxShadow:'0 24px 60px rgba(0,0,0,0.28)',
      }}>

        {/* ── Modal header ── */}
        <div style={{ padding:'16px 20px', borderBottom:'1px solid #e5e7eb',
                      display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
          <div>
            <div style={{ fontWeight:700, fontSize:'1em', color:'#1a237e' }}>✏️ แก้ไขตาราง {room.name}</div>
            <div style={{ fontSize:'.76em', color:'#9ca3af', marginTop:'2px' }}>
              {availableOptions.length > 0
                ? `กิจกรรมที่กำหนด: 🏡 ในห้อง ${assignedInner.length} · 🌿 นอกห้อง ${assignedOuter.length}`
                : '⚠️ ยังไม่มีกิจกรรมที่กำหนด — ตั้งค่าใน "กำหนดกิจกรรม" ก่อน'
              }
            </div>
            {allSchedule.length > 0 && (
              <button
                onClick={autoFill}
                style={{
                  marginTop:'6px', padding:'4px 12px', borderRadius:'8px',
                  border:'1.5px solid #1565C0', background:'#E3F2FD',
                  color:'#1565C0', fontWeight:700, fontSize:'.76em',
                  cursor:'pointer', fontFamily:'inherit',
                }}
              >
                📅 เติมตารางจากการกำหนด ({allSchedule.length} กิจกรรม)
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            style={{ background:'none', border:'none', cursor:'pointer', fontSize:'1.2em',
                     color:'#9ca3af', lineHeight:1, padding:'4px 8px', borderRadius:'6px' }}
            onMouseEnter={e => e.currentTarget.style.color='#ef4444'}
            onMouseLeave={e => e.currentTarget.style.color='#9ca3af'}
          >✕</button>
        </div>

        {/* ── Day tabs ── */}
        <div style={{ display:'flex', borderBottom:'2px solid #e5e7eb', flexShrink:0 }}>
          {DAYS.map(d => {
            const cnt = (editDays[d] ?? []).length;
            const active = activeDay === d;
            return (
              <button key={d} onClick={() => setActiveDay(d)} style={{
                flex:1, padding:'10px 4px 9px', border:'none', cursor:'pointer',
                borderBottom: active ? `3px solid ${DAY_CLR[d]}` : '3px solid transparent',
                background: active ? `${DAY_CLR[d]}10` : 'white',
                color: active ? DAY_CLR[d] : '#546e7a',
                fontWeight: active ? 700 : 500,
                fontSize:'.8em', transition:'all .15s',
                display:'flex', flexDirection:'column', alignItems:'center', gap:'2px',
              }}>
                <span>{d}</span>
                <span style={{
                  fontSize:'.72em', fontWeight:700,
                  color: cnt > 0 ? (active ? DAY_CLR[d] : '#9ca3af') : '#d1d5db',
                }}>{cnt} กิจกรรม</span>
              </button>
            );
          })}
        </div>

        {/* ── Activity list ── */}
        <div style={{ flex:1, overflowY:'auto', padding:'16px 20px' }}>
          {dayActs.length === 0 ? (
            <div style={{ textAlign:'center', color:'#d1d5db', padding:'24px 0',
                          fontStyle:'italic', fontSize:'.88em' }}>
              ไม่มีกิจกรรมในวัน{activeDay}
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:'7px', marginBottom:'16px' }}>
              {dayActs.map(({type, time, label}, idx) => {
                const s = getColor(type);
                return (
                  <div key={idx} style={{
                    display:'flex', alignItems:'center', gap:'10px',
                    padding:'9px 12px', borderRadius:'10px',
                    background:s.bg, border:`1.5px solid ${s.border}`,
                  }}>
                    <span style={{ fontSize:'.74em', color:s.color, opacity:.7, width:'38px', flexShrink:0 }}>{time}</span>
                    <span style={{ color:s.color, fontWeight:600, fontSize:'.88em', flex:1 }}>
                      {label || getLabel(type)}
                    </span>
                    <button
                      onClick={() => removeAct(idx)}
                      style={{ background:'none', border:'none', cursor:'pointer',
                               color:'#d1d5db', fontSize:'1em', lineHeight:1,
                               padding:'2px 6px', borderRadius:'6px', transition:'color .15s' }}
                      onMouseEnter={e => e.currentTarget.style.color='#ef4444'}
                      onMouseLeave={e => e.currentTarget.style.color='#d1d5db'}
                    >✕</button>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Add activity ── */}
          <div style={{ padding:'12px 14px', background:'#f8fafc',
                        borderRadius:'10px', border:'1.5px dashed #d1d5db' }}>
            <div style={{ fontSize:'.78em', fontWeight:700, color:'#6b7280', marginBottom:'10px' }}>
              ➕ เพิ่มกิจกรรมในวัน{activeDay}
            </div>

            {availableOptions.length === 0 ? (
              <div style={{ fontSize:'.83em', color:'#9ca3af', fontStyle:'italic', lineHeight:1.6 }}>
                ยังไม่มีกิจกรรมที่กำหนดสำหรับห้องนี้<br />
                กรุณาเพิ่มกิจกรรมและกำหนดให้ห้องเรียน<br />
                ใน <strong>กำหนดกิจกรรมภายใน/นอกห้องเรียน</strong> ก่อน
              </div>
            ) : (
              <div style={{ display:'flex', gap:'8px', alignItems:'center', flexWrap:'wrap' }}>
                <select
                  value={newType}
                  onChange={e => setNewType(e.target.value)}
                  style={{ ...INP, flex:'1 1 180px', cursor:'pointer' }}
                >
                  {assignedInner.length > 0 && (
                    <optgroup label="🏡 กิจกรรมภายในห้องเรียน">
                      {assignedInner.map(def => (
                        <option key={def.key} value={def.key}>{def.label}</option>
                      ))}
                    </optgroup>
                  )}
                  {assignedOuter.length > 0 && (
                    <optgroup label="🌿 กิจกรรมภายนอกห้องเรียน">
                      {assignedOuter.map(def => (
                        <option key={def.key} value={def.key}>{def.label}</option>
                      ))}
                    </optgroup>
                  )}
                </select>
                <input
                  type="text"
                  value={newTime}
                  onChange={e => setNewTime(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addAct()}
                  placeholder="เวลา เช่น 08.30"
                  style={{ ...INP, width:'130px', flexShrink:0 }}
                />
                <button
                  onClick={addAct}
                  disabled={!newType || !newTime.trim()}
                  style={{
                    padding:'7px 16px', borderRadius:'8px', border:'none', cursor:'pointer',
                    background: (newType && newTime.trim()) ? '#1565C0' : '#e5e7eb',
                    color: (newType && newTime.trim()) ? 'white' : '#9ca3af',
                    fontWeight:600, fontSize:'.85em', transition:'all .15s',
                  }}
                >เพิ่ม</button>
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{ padding:'12px 20px', borderTop:'1px solid #e5e7eb',
                      display:'flex', justifyContent:'flex-end', gap:'10px', flexShrink:0 }}>
          <button
            onClick={onClose}
            style={{ padding:'8px 18px', borderRadius:'8px', border:'1px solid #d1d5db',
                     background:'white', cursor:'pointer', fontWeight:600, fontSize:'.88em', color:'#374151' }}
          >ยกเลิก</button>
          <button
            onClick={doSave}
            disabled={saving}
            style={{
              padding:'8px 22px', borderRadius:'8px', border:'none', cursor:'pointer',
              background: saving ? '#93c5fd' : '#1565C0',
              color:'white', fontWeight:700, fontSize:'.88em',
            }}
          >{saving ? 'กำลังบันทึก…' : '💾 บันทึก'}</button>
        </div>
      </div>
    </div>
  );
}

/* ── Main component ───────────────────────────────────────────── */
export default function ActivityScheduleTab() {
  /* context */
  const {
    innerCornerDefs      = [],
    cornerDefs           = [],
    classInnerCornerKeys = {},
    classOuterCornerKeys = {},
    allClassNames        = [],
  } = useApp();

  const [rooms,        setRooms]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [editRoom,     setEditRoom]     = useState(null);
  const [reseeding,    setReseeding]    = useState(false);
  const [confirmReseed,setConfirmReseed]= useState(false);
  const [reseedMsg,    setReseedMsg]    = useState(null); // {ok:bool, text:string}

  /* ── Build dynamic def maps ── */
  const innerDefMap = useMemo(() => {
    const map = {};
    innerCornerDefs.forEach((def, idx) => {
      map[def.key] = { ...def, color: INNER_PALETTE[idx % INNER_PALETTE.length] };
    });
    return map;
  }, [innerCornerDefs]);

  const outerDefMap = useMemo(() => {
    const map = {};
    cornerDefs.forEach((def, idx) => {
      map[def.key] = { ...def, color: OUTER_PALETTE[idx % OUTER_PALETTE.length] };
    });
    return map;
  }, [cornerDefs]);

  const allDefMap = useMemo(() => ({ ...innerDefMap, ...outerDefMap }), [innerDefMap, outerDefMap]);

  /* ── Inner key set: dynamic + legacy keys for backward compat ── */
  const innerKeySet = useMemo(
    () => new Set([...LEGACY_IN_KEYS, ...innerCornerDefs.map(d => d.key)]),
    [innerCornerDefs],
  );

  /* ── Color / label helpers (dynamic → legacy → default) ── */
  const getColor = (key) => allDefMap[key]?.color ?? LEGACY_PS[key] ?? DEFAULT_CLR;
  const getLabel = (key) => allDefMap[key]?.label  ?? LEGACY_LABEL[key] ?? key;

  /* ── Map room name → className ── */
  function getRoomClassName(roomName) {
    if (!roomName) return null;
    const stripped = roomName.replace(/^ห้อง\s+/, '').trim();
    return allClassNames.find(cn => cn === roomName || cn === stripped) ?? null;
  }

  /* ── Get assigned defs for a given room (handles old string[] + new {key,days,time}[]) ── */
  function getAssignedDefs(roomName) {
    const className = getRoomClassName(roomName);

    function extractInfo(stored) {
      // not stored → use all, no schedule
      if (!stored || stored.length === 0) return { keys: null, schedule: [] };
      if (typeof stored[0] === 'string') {
        // old format: keys only, no day/time
        return { keys: stored, schedule: [] };
      }
      // new format: {key, days, time}[]
      return {
        keys:     stored.map(e => e.key),
        schedule: stored.filter(e => e.days?.length > 0 && e.time),
      };
    }

    const innerStored = className ? classInnerCornerKeys[className] : null;
    const { keys: innerKeysRaw, schedule: innerSchedule } = extractInfo(innerStored);

    const outerStored = className ? classOuterCornerKeys[className] : null;
    const { keys: outerKeysRaw, schedule: outerSchedule } = extractInfo(outerStored);

    return {
      assignedInner: innerKeysRaw
        ? innerCornerDefs.filter(d => innerKeysRaw.includes(d.key))
        : innerCornerDefs,
      assignedOuter: outerKeysRaw
        ? cornerDefs.filter(d => outerKeysRaw.includes(d.key))
        : cornerDefs,
      innerSchedule, // [{key, days, time}] for auto-fill
      outerSchedule,
    };
  }

  /* ── Firestore: seed once + live-listen ── */
  useEffect(() => {
    const colRef = collection(db, 'activitySchedule');
    const unsub  = onSnapshot(colRef, async (snap) => {
      if (snap.empty) {
        await Promise.all(SEED_ROOMS.map(r => setDoc(doc(colRef, r.id), r)));
        return; // will re-fire after seed
      }
      const loaded = snap.docs.map(d => ({ ...d.data(), id: d.id }));
      loaded.sort((a, b) => a.id.localeCompare(b.id));
      setRooms(loaded);
      setLoading(false);
    }, (err) => {
      console.error('activitySchedule onSnapshot error:', err);
      setRooms(SEED_ROOMS);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  /* ── Group rooms by level ── */
  const grouped = useMemo(() => {
    const map = {};
    rooms.forEach(r => {
      const lk = r.levelKey ?? '1';
      if (!map[lk]) map[lk] = [];
      map[lk].push(r);
    });
    return Object.entries(map).sort(([a],[b]) => a.localeCompare(b));
  }, [rooms]);

  /* ── Daily summary ── */
  const dailySummary = useMemo(() => computeDailySummary(rooms), [rooms]);

  /* ── Save handler ── */
  const handleSave = async (roomId, newDays) => {
    await setDoc(doc(db, 'activitySchedule', roomId), { days: newDays }, { merge: true });
    setEditRoom(null);
  };

  /* ── Reseed with legacy sample data ── */
  const totalActivities = useMemo(
    () => rooms.reduce((sum, r) =>
      sum + DAYS.reduce((s2, d) => s2 + (r.days[d]?.length ?? 0), 0), 0),
    [rooms],
  );

  const handleReseedSample = async () => {
    setReseeding(true);
    setConfirmReseed(false);
    setReseedMsg(null);
    try {
      const colRef = collection(db, 'activitySchedule');
      // ใช้ merge:true เหมือน handleSave เขียนแค่ field days
      await Promise.all(
        rooms.map(r =>
          setDoc(doc(colRef, r.id), { days: LEGACY_SAMPLE_DAYS }, { merge: true })
        )
      );
      setReseedMsg({ ok: true, text: `✅ เติมข้อมูลตัวอย่างสำเร็จ ${rooms.length} ห้อง` });
    } catch(e) {
      setReseedMsg({ ok: false, text: `❌ เกิดข้อผิดพลาด: ${e?.message ?? e}` });
    } finally {
      setReseeding(false);
    }
  };

  const TH = { padding:'9px 12px', border:'1px solid #cfd8dc', background:'#eceff1',
                color:'#546e7a', fontWeight:700, textAlign:'center' };
  const TD = { padding:'9px 12px', border:'1px solid #e4e8ec', verticalAlign:'middle' };

  if (loading) return (
    <div style={{ textAlign:'center', padding:'4rem', color:'#9ca3af', fontSize:'.9rem' }}>
      กำลังโหลดข้อมูลตาราง…
    </div>
  );

  const allDefs = [
    ...innerCornerDefs.map(d => ({ ...d, isInner: true })),
    ...cornerDefs.map(d => ({ ...d, isInner: false })),
  ];

  return (
    <div className="animate-fade" style={{ fontSize:'15px' }}>

      {/* ── Page header ── */}
      <div className="glass-card mb-4" style={{
        background:'linear-gradient(135deg,#EDE7F6,#E3F2FD)',
        border:'1.5px solid #B39DDB', textAlign:'center', padding:'18px',
      }}>
        <div style={{ fontSize:'1.6em', fontWeight:800, color:'#1a237e' }}>
          ตารางกิจกรรมภายใน-นอกห้องเรียนประจำวัน
        </div>
        <div style={{ color:'#546e7a', marginTop:'4px', fontSize:'.9em' }}>
          แสดงเฉพาะกิจกรรมที่กำหนดไว้ในแต่ละห้องเรียน · ระดับอนุบาล ๑–๓
        </div>
        {totalActivities === 0 && rooms.length > 0 && (
          <div style={{ marginTop:'12px' }}>
            {!confirmReseed ? (
              <>
                <button
                  onClick={() => setConfirmReseed(true)}
                  disabled={reseeding}
                  style={{
                    padding:'7px 18px', borderRadius:'10px', border:'1.5px solid #7c3aed',
                    background:'#ede9fe', color:'#5b21b6', fontWeight:700, fontSize:'.85em',
                    cursor:'pointer', fontFamily:'inherit',
                  }}
                >
                  ↺ เติมข้อมูลตัวอย่างกิจกรรม (เดิม)
                </button>
                <div style={{ marginTop:'6px', fontSize:'.78em', color:'#7c3aed', opacity:.8 }}>
                  ข้อมูลทุกห้องว่างเปล่า — กดเพื่อเติมตัวอย่างกิจกรรมเดิม (ภาษาอังกฤษ, EF, คอมพิวเตอร์ ฯลฯ)
                </div>
              </>
            ) : (
              <div style={{
                display:'inline-flex', alignItems:'center', gap:'10px',
                padding:'8px 14px', borderRadius:'12px',
                background:'#faf5ff', border:'1.5px solid #a855f7',
              }}>
                <span style={{ fontSize:'.85em', color:'#6b21a8', fontWeight:600 }}>
                  ยืนยันเติมข้อมูลตัวอย่างทุกห้อง?
                </span>
                <button
                  onClick={handleReseedSample}
                  disabled={reseeding}
                  style={{
                    padding:'5px 14px', borderRadius:'8px', border:'none',
                    background:'#7c3aed', color:'white', fontWeight:700,
                    fontSize:'.82em', cursor:'pointer', fontFamily:'inherit',
                  }}
                >
                  {reseeding ? 'กำลังบันทึก…' : '✓ ยืนยัน'}
                </button>
                <button
                  onClick={() => setConfirmReseed(false)}
                  style={{
                    padding:'5px 14px', borderRadius:'8px',
                    border:'1px solid #d1d5db', background:'white',
                    color:'#6b7280', fontWeight:600,
                    fontSize:'.82em', cursor:'pointer', fontFamily:'inherit',
                  }}
                >
                  ยกเลิก
                </button>
              </div>
            )}
            {reseedMsg && (
              <div style={{
                marginTop:'8px', padding:'7px 14px', borderRadius:'10px',
                fontSize:'.82em', fontWeight:600,
                background: reseedMsg.ok ? '#f0fdf4' : '#fef2f2',
                color:      reseedMsg.ok ? '#15803d' : '#991b1b',
                border: `1.5px solid ${reseedMsg.ok ? '#86efac' : '#fca5a5'}`,
              }}>
                {reseedMsg.text}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Notice when no defs configured ── */}
      {innerCornerDefs.length === 0 && cornerDefs.length === 0 && (
        <div className="glass-card mb-4" style={{
          background:'#FFF3E0', border:'1.5px solid #FFB74D',
          padding:'14px 18px', display:'flex', alignItems:'flex-start', gap:'10px',
        }}>
          <span style={{ fontSize:'1.3em', flexShrink:0 }}>⚠️</span>
          <div style={{ fontSize:'.88em', color:'#BF360C', lineHeight:1.6 }}>
            <strong>ยังไม่มีกิจกรรมที่กำหนด</strong><br />
            กรุณาเพิ่มกิจกรรมใน <strong>จัดการกิจกรรมภายในห้องเรียน</strong> และ <strong>จัดการกิจกรรมภายนอกห้องเรียน</strong>
            จากนั้นกำหนดให้แต่ละห้องเรียนใน <strong>กำหนดกิจกรรมภายในห้องเรียน</strong> และ <strong>กำหนดกิจกรรมภายนอกห้องเรียน</strong>
          </div>
        </div>
      )}

      {/* ── Dynamic legend ── */}
      {allDefs.length > 0 && (
        <div className="glass-card mb-4">
          <div style={{ display:'flex', flexWrap:'wrap', gap:'6px 0', alignItems:'center' }}>
            {innerCornerDefs.length > 0 && (
              <div style={{ display:'flex', alignItems:'center', gap:'6px 12px', flexWrap:'wrap',
                            padding:'4px 14px', borderRight:'1px solid #e0e0e0' }}>
                <span style={{ fontSize:'.76em', fontWeight:700, color:'#90a4ae', textTransform:'uppercase', letterSpacing:'.05em' }}>
                  🏡 ในห้องเรียน
                </span>
                {innerCornerDefs.map(def => {
                  const clr = getColor(def.key);
                  return (
                    <span key={def.key} style={{ display:'inline-flex', alignItems:'center', gap:'5px', fontSize:'.84em' }}>
                      <span style={{ width:'12px', height:'12px', borderRadius:'50%', background:clr.bg, border:`1.5px solid ${clr.border}` }} />
                      {def.label}
                    </span>
                  );
                })}
              </div>
            )}
            {cornerDefs.length > 0 && (
              <div style={{ display:'flex', alignItems:'center', gap:'6px 12px', flexWrap:'wrap', padding:'4px 14px' }}>
                <span style={{ fontSize:'.76em', fontWeight:700, color:'#90a4ae', textTransform:'uppercase', letterSpacing:'.05em' }}>
                  🌿 นอกห้องเรียน
                </span>
                {cornerDefs.map(def => {
                  const clr = getColor(def.key);
                  return (
                    <span key={def.key} style={{ display:'inline-flex', alignItems:'center', gap:'5px', fontSize:'.84em' }}>
                      <span style={{ width:'12px', height:'12px', borderRadius:'50%', background:clr.bg, border:`1.5px solid ${clr.border}` }} />
                      {def.label}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Schedule by level ── */}
      {grouped.map(([lk, lvRooms]) => {
        const meta = LEVEL_META[lk] ?? { label:`อนุบาล ${lk}`, hd:'linear-gradient(90deg,#546e7a,#78909c)' };
        return (
          <div key={lk} className="mb-4" style={{ borderRadius:'14px', overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,0.09)' }}>
            <div style={{ padding:'10px 18px', fontWeight:700, color:'white', fontSize:'1em', background:meta.hd }}>
              {meta.label}
            </div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'1px', background:'#dde3ea' }}>
              {lvRooms.map(r => (
                <RoomCard
                  key={r.id}
                  room={r}
                  onEdit={() => setEditRoom(r)}
                  getColor={getColor}
                  getLabel={getLabel}
                  innerKeySet={innerKeySet}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* ── Daily summary ── */}
      <div className="glass-card mb-4">
        <div style={{ fontWeight:700, fontSize:'1em', marginBottom:'14px',
                      paddingBottom:'9px', borderBottom:'2px solid #eceff1' }}>
          📅 สรุปการใช้แหล่งเรียนรู้รายวัน (ทุก {rooms.length} ห้องรวมกัน)
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
          {DAYS.map(day => {
            const acts   = dailySummary[day];
            const types  = Object.keys(acts);
            const inCnt  = types.filter(t => innerKeySet.has(t)).reduce((s,t) => s + acts[t], 0);
            const outCnt = types.filter(t => !innerKeySet.has(t)).reduce((s,t) => s + acts[t], 0);
            const total  = inCnt + outCnt;
            const pct    = total > 0 ? Math.round((inCnt / total) * 100) : 0;
            return (
              <div key={day} style={{ border:'1px solid #e4e8ec', borderRadius:'12px', overflow:'hidden' }}>
                <div style={{
                  padding:'7px 14px', fontWeight:700, fontSize:'.88em',
                  color:'white', background: DAY_CLR[day] ?? '#546e7a',
                  display:'flex', alignItems:'center', justifyContent:'space-between',
                }}>
                  <span>วัน{day}</span>
                  <span style={{ fontSize:'.8em', fontWeight:500, opacity:.9 }}>
                    🏫 ในอาคาร {inCnt} ครั้ง · 🌿 นอกอาคาร {outCnt} ครั้ง
                  </span>
                </div>
                <div style={{ padding:'10px 14px', background:'white',
                              display:'flex', flexWrap:'wrap', alignItems:'center', gap:'8px' }}>
                  {types.length === 0 ? (
                    <span style={{ fontSize:'.8em', color:'#ccc', fontStyle:'italic' }}>ไม่มีกิจกรรมพิเศษในวันนี้</span>
                  ) : (
                    <>
                      {types.map(type => {
                        const s    = getColor(type);
                        const lbl  = getLabel(type);
                        const isIn = innerKeySet.has(type);
                        return (
                          <span key={type} style={{
                            display:'inline-flex', alignItems:'center', gap:'5px',
                            padding:'4px 10px 4px 8px', borderRadius:'20px',
                            fontSize:'.82em', fontWeight:600,
                            background:s.bg, color:s.color, border:`1.5px solid ${s.border}`,
                          }}>
                            {lbl}
                            <span style={{
                              minWidth:'20px', textAlign:'center',
                              background: isIn ? '#B3C4E8' : '#A5D6A7',
                              color: isIn ? '#0D47A1' : '#1B5E20',
                              borderRadius:'12px', fontSize:'.82em', fontWeight:700, padding:'1px 6px',
                            }}>
                              {acts[type]} ห้อง
                            </span>
                          </span>
                        );
                      })}
                      <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:'6px' }}>
                        <div style={{ width:'80px', height:'7px', borderRadius:'7px', background:'#E8F5E9', overflow:'hidden' }}>
                          <div style={{ width:`${pct}%`, height:'100%', borderRadius:'7px', background: DAY_CLR[day] ?? '#1565C0' }} />
                        </div>
                        <span style={{ fontSize:'.76em', color:'#90a4ae', whiteSpace:'nowrap' }}>{pct}% ใน</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Dynamic activity list for this school ── */}
      {allDefs.length > 0 && (
        <div className="glass-card mb-4">
          <div style={{ fontWeight:700, fontSize:'1em', marginBottom:'12px',
                        paddingBottom:'9px', borderBottom:'2px solid #eceff1' }}>
            📋 กิจกรรมทั้งหมดในโรงเรียนนี้
            <span style={{ fontSize:'.73em', marginLeft:'8px', padding:'2px 10px', borderRadius:'20px',
                           fontWeight:600, background:'#E8F5E9', color:'#1B5E20' }}>
              🏡 ใน {innerCornerDefs.length} · 🌿 นอก {cornerDefs.length}
            </span>
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
            {allDefs.map(def => {
              const clr = getColor(def.key);
              return (
                <span key={def.key} style={{
                  display:'inline-flex', alignItems:'center', gap:'5px',
                  padding:'5px 12px', borderRadius:'20px', fontWeight:600, fontSize:'.85em',
                  background:clr.bg, color:clr.color, border:`1.5px solid ${clr.border}`,
                }}>
                  {def.isInner ? '🏡' : '🌿'} {def.label}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Ratio table ── */}
      <div className="glass-card mb-4">
        <div style={{ fontWeight:700, fontSize:'1em', marginBottom:'12px',
                      paddingBottom:'9px', borderBottom:'2px solid #eceff1' }}>
          📊 เปรียบเทียบสัดส่วนแหล่งเรียนรู้รายห้อง
        </div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'.86em' }}>
            <thead>
              <tr>
                <th style={TH}>ห้อง</th>
                <th style={TH}>ในอาคาร</th>
                <th style={TH}>นอกอาคาร</th>
                <th style={TH}>รวม/สัปดาห์</th>
                <th style={{ ...TH, minWidth:'180px' }}>สัดส่วน ใน (🔵) : นอก (🟢)</th>
                <th style={TH}>ความสมดุล</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((r,i) => {
                const { inC, outC } = computeCounts(r.days, innerKeySet);
                const total = inC + outC;
                const pct   = total > 0 ? Math.round((inC / total) * 100) : 0;
                const balanced = total > 0 && pct >= 30 && pct <= 70;
                return (
                  <tr key={r.id} style={{ background: i%2===1 ? '#fafbfc' : 'white' }}>
                    <td style={{ ...TD, fontWeight:700 }}>{r.name?.replace('ห้อง ','') ?? r.id}</td>
                    <td style={{ ...TD, textAlign:'center' }}>{inC} ครั้ง</td>
                    <td style={{ ...TD, textAlign:'center' }}>{outC} ครั้ง</td>
                    <td style={{ ...TD, textAlign:'center' }}>{total} ครั้ง</td>
                    <td style={TD}>
                      <div style={{ display:'inline-flex', alignItems:'center', gap:'6px', width:'100%' }}>
                        <div style={{ width:'100px', height:'9px', borderRadius:'9px',
                                      background:'#E8F5E9', overflow:'hidden', flexShrink:0 }}>
                          <div style={{ width:`${pct}%`, height:'100%', borderRadius:'9px', background:'#1565C0' }} />
                        </div>
                        <span style={{ fontSize:'.8em', color:'#546e7a', whiteSpace:'nowrap' }}>
                          {pct}% : {100-pct}%
                        </span>
                      </div>
                    </td>
                    <td style={{
                      ...TD, textAlign:'center', fontWeight:600,
                      color: total === 0 ? '#9ca3af' : balanced ? '#1B5E20' : '#E65100',
                    }}>
                      {total === 0 ? '—' : balanced ? '✔ เหมาะสม' : '⚠ ควรปรับ'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Edit modal ── */}
      {editRoom && (() => {
        const { assignedInner, assignedOuter, innerSchedule, outerSchedule } = getAssignedDefs(editRoom.name);
        return (
          <RoomEditModal
            room={editRoom}
            onClose={() => setEditRoom(null)}
            onSave={handleSave}
            assignedInner={assignedInner}
            assignedOuter={assignedOuter}
            innerSchedule={innerSchedule}
            outerSchedule={outerSchedule}
            getColor={getColor}
            getLabel={getLabel}
          />
        );
      })()}

    </div>
  );
}
