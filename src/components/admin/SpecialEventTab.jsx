import { useState, useMemo, useCallback } from 'react';
import { useApp } from '../../context/AppContext';

// ── Event type definitions ────────────────────────────────────────────────────
const EVENT_TYPES = {
  school:   { label: '🏫 กิจกรรมโรงเรียน',         color: '#1d4ed8', bg: '#dbeafe' },
  national: { label: '🇹🇭 วันสำคัญของชาติ/ศาสนา',   color: '#b45309', bg: '#fef3c7' },
  project:  { label: '🌟 โครงการ/กิจกรรมพิเศษ',    color: '#059669', bg: '#d1fae5' },
};

// ── Default activity IDs per event type (auto-fill ประเมินพัฒนาการ) ─────────────
const EVENT_TYPE_DEFAULT_ACTIVITIES = {
  // กิจกรรมโรงเรียน: กีฬาสี, open house, ทัศนศึกษา → การมีส่วนร่วมกลุ่ม + กล้าแสดงออก
  school: [
    'social__qa-5__5.4__5.4.1__10',     // มีปฏิสัมพันธ์ที่ดีกับผู้อื่น
    'social__qa-5__5.4__5.4.1__11',     // เล่นร่วมกับเพื่อนเป็นกลุ่ม
    'social__qa-5__5.4__5.4.1__13',     // ทำงานเป็นทีมจนสำเร็จ
    'social__std-7__7.2__7.2.1__13',    // เข้าร่วมกิจกรรมวัฒนธรรมอย่างภาคภูมิใจ
    'social__std-8__8.3__8.3.1__19',    // ช่วยเหลืองานส่วนรวมของโรงเรียน
    'emotional__qa-4__4.1__4.1.2__5',   // กล้าแสดงออกอย่างเหมาะสมในกลุ่ม
    'emotional__qa-4__4.2__4.2.3__11',  // มีความรับผิดชอบต่อตนเองและส่วนรวม
    'emotional__qa-4__4.3__4.3.1__14',  // ดนตรี
    'emotional__qa-4__4.3__4.3.1__15',  // เคลื่อนไหวและจังหวะ
    'social__qa-5__5.3__5.3.1__8',      // ให้ความช่วยเหลือผู้อื่นในโอกาสพิเศษ
    'social__qa-5__5.3__5.3.1__9',      // แสดงน้ำใจในกิจกรรมพิเศษ
    'social__std-8__8.1__8.1.1__14',    // เห็นอกเห็นใจและแบ่งปันในงานพิเศษ
    'social__std-8__8.1__8.1.1__15',    // ช่วยเหลือเพื่อนในกิจกรรมโรงเรียน
    'social__std-8__8.3__8.3.1__18',    // ภูมิใจในการเข้าร่วมกิจกรรมของโรงเรียน
  ],
  // วันสำคัญของชาติ/ศาสนา: วันพ่อ, วันแม่, สงกรานต์, ลอยกระทง → มารยาทไทย + คุณธรรม
  national: [
    'social__std-7__7.2__7.2.1__11',    // ไหว้ทักทาย กล่าวขอบคุณ-ขอโทษ
    'social__std-7__7.2__7.2.1__12',    // ยืนตรงเพลงชาติ/สรรเสริญพระบารมี
    'social__std-7__7.2__7.2.1__13',    // เข้าร่วมกิจกรรมวัฒนธรรมและประเพณีไทย
    'social__qa-5__5.2__5.2.2__7',      // มารยาทไทย — ไหว้ทักทาย
    'emotional__qa-4__4.2__4.2.1__6',   // นิทานคุณธรรม
    'emotional__qa-4__4.2__4.2.2__8',   // มีเมตตากรุณาและช่วยเหลือผู้อื่น
    'emotional__qa-4__4.3__4.3.1__14',  // ดนตรี (เพลงสำคัญ/สวดมนต์)
    'emotional__qa-4__4.3__4.3.1__15',  // เคลื่อนไหว (รำไทย/การแสดง)
    'emotional__std-5__5.1__5.1.1__10', // รู้สึกภาคภูมิใจในความเป็นไทย
    'emotional__std-5__5.1__5.1.1__11', // รักและหวงแหนความเป็นไทย
    'emotional__std-5__5.2__5.2.1__12', // ภาคภูมิใจในวันสำคัญของชาติ
    'emotional__std-5__5.2__5.2.1__13', // แสดงออกถึงความรักชาติในกิจกรรม
  ],
  // โครงการ/กิจกรรมพิเศษ: วิทยาศาสตร์, ทำอาหาร, ปลูกต้นไม้, ศิลปะ → สติปัญญา + ความคิดสร้างสรรค์
  project: [
    'mental__qa-6__6.2__6.2.2__14',     // ตั้งคำถามและค้นหาคำตอบด้วยตนเอง
    'mental__qa-6__6.2__6.2.2__16',     // ทักษะกระบวนการวิทยาศาสตร์
    'mental__qa-6__6.3__6.3.1__17',     // สร้างผลงานตามจินตนาการ
    'mental__qa-6__6.3__6.3.1__18',     // นำสื่อ/วัสดุมาสร้างสรรค์เป็นชิ้นงานใหม่
    'mental__std-12__12.1__12.1.1__20', // กระตือรือร้นและมีความสุขในการเรียนรู้
    'mental__std-12__12.2__12.2.1__21', // ค้นหาคำตอบของข้อสงสัยตามวิธีการของตนเอง
    'social__std-7__7.1__7.1.1__9',     // ดูแลรดน้ำต้นไม้/รักษาสิ่งแวดล้อม
    'emotional__qa-4__4.3__4.3.1__13',  // วาดภาพระบายสี (โครงการศิลปะ)
    'emotional__std-5__5.3__5.3.1__14', // ทำงานโครงการจนสำเร็จ
    'emotional__std-5__5.3__5.3.1__15', // รับผิดชอบงานในโครงการ
  ],
};

// ── Preset events สำหรับปีการศึกษา 2568 ──────────────────────────────────────
const PRESET_EVENTS = [
  // ── กิจกรรมโรงเรียน ──────────────────────────────────────────────────────
  {
    id: 'preset_waikhru_2568', name: 'วันไหว้ครู 2568', date: '2025-07-03',
    type: 'school', scope: 'all',
    description: 'กิจกรรมไหว้ครูประจำปี นักเรียนนำพานดอกไม้มาไหว้ครู',
    activityIds: EVENT_TYPE_DEFAULT_ACTIVITIES.school, participants: {},
  },
  {
    id: 'preset_sports_2568', name: 'วันกีฬาสี 2568', date: '2025-11-28',
    type: 'school', scope: 'all',
    description: 'กิจกรรมกีฬาสีประจำปี ส่งเสริมความสามัคคีและสุขภาพที่ดี',
    activityIds: EVENT_TYPE_DEFAULT_ACTIVITIES.school, participants: {},
  },
  {
    id: 'preset_openhouse_2568', name: 'วันเปิดบ้าน (Open House) 2568', date: '2026-02-27',
    type: 'school', scope: 'all',
    description: 'เปิดโอกาสให้ผู้ปกครองเข้าเยี่ยมชมการเรียนการสอนและผลงานนักเรียน',
    activityIds: EVENT_TYPE_DEFAULT_ACTIVITIES.school, participants: {},
  },

  // ── วันสำคัญของชาติ/ศาสนา ────────────────────────────────────────────────
  {
    id: 'preset_makha_2568', name: 'วันมาฆบูชา 2568', date: '2025-02-12',
    type: 'national', scope: 'all',
    description: 'กิจกรรมเวียนเทียน เรียนรู้หลักธรรมและคุณธรรมพื้นฐาน',
    activityIds: EVENT_TYPE_DEFAULT_ACTIVITIES.national, participants: {},
  },
  {
    id: 'preset_songkran_2568', name: 'วันสงกรานต์ 2568', date: '2025-04-11',
    type: 'national', scope: 'all',
    description: 'กิจกรรมสืบสานวัฒนธรรมไทย รดน้ำดำหัว และแต่งกายชุดไทย',
    activityIds: EVENT_TYPE_DEFAULT_ACTIVITIES.national, participants: {},
  },
  {
    id: 'preset_visakha_2568', name: 'วันวิสาขบูชา 2568', date: '2025-05-12',
    type: 'national', scope: 'all',
    description: 'กิจกรรมเรียนรู้ประวัติวันวิสาขบูชา และปฏิบัติตนเป็นพุทธศาสนิกชนที่ดี',
    activityIds: EVENT_TYPE_DEFAULT_ACTIVITIES.national, participants: {},
  },
  {
    id: 'preset_khao_phansa_2568', name: 'วันเข้าพรรษา 2568', date: '2025-07-10',
    type: 'national', scope: 'all',
    description: 'กิจกรรมถวายเทียนพรรษาและปลูกฝังค่านิยมทางพุทธศาสนา',
    activityIds: EVENT_TYPE_DEFAULT_ACTIVITIES.national, participants: {},
  },
  {
    id: 'preset_mothersday_2568', name: 'วันแม่แห่งชาติ 2568', date: '2025-08-12',
    type: 'national', scope: 'all',
    description: 'กิจกรรมวันแม่ ทำการ์ดอวยพร แสดงความกตัญญูต่อแม่',
    activityIds: EVENT_TYPE_DEFAULT_ACTIVITIES.national, participants: {},
  },
  {
    id: 'preset_loykrathong_2568', name: 'วันลอยกระทง 2568', date: '2025-11-05',
    type: 'national', scope: 'all',
    description: 'กิจกรรมลอยกระทง ประดิษฐ์กระทงจากวัสดุธรรมชาติ เรียนรู้ประเพณีไทย',
    activityIds: EVENT_TYPE_DEFAULT_ACTIVITIES.national, participants: {},
  },
  {
    id: 'preset_fathersday_2568', name: 'วันพ่อแห่งชาติ 2568', date: '2025-12-05',
    type: 'national', scope: 'all',
    description: 'กิจกรรมวันพ่อ ทำของขวัญและแสดงความกตัญญูต่อพ่อ',
    activityIds: EVENT_TYPE_DEFAULT_ACTIVITIES.national, participants: {},
  },

  // ── โครงการ/กิจกรรมพิเศษ ─────────────────────────────────────────────────
  {
    id: 'preset_garden_2568', name: 'โครงการปลูกผักสวนครัว', date: '2025-08-15',
    type: 'project', scope: 'all',
    description: 'โครงการเกษตรพอเพียง เรียนรู้การปลูกและดูแลต้นไม้ ฝึกความรับผิดชอบ',
    activityIds: EVENT_TYPE_DEFAULT_ACTIVITIES.project, participants: {},
  },
  {
    id: 'preset_science_2568', name: 'กิจกรรมวิทยาศาสตร์สนุก', date: '2025-09-05',
    type: 'project', scope: 'all',
    description: 'การทดลองวิทยาศาสตร์ง่ายๆ ส่งเสริมความคิดสร้างสรรค์และการตั้งคำถาม',
    activityIds: EVENT_TYPE_DEFAULT_ACTIVITIES.project, participants: {},
  },
  {
    id: 'preset_reading_2568', name: 'โครงการรักการอ่าน', date: '2025-08-02',
    type: 'project', scope: 'all',
    description: 'กิจกรรมนิทานและห้องสมุด ส่งเสริมนิสัยรักการอ่านตั้งแต่ปฐมวัย',
    activityIds: EVENT_TYPE_DEFAULT_ACTIVITIES.project, participants: {},
  },
];

function todayISO() { return new Date().toISOString().split('T')[0]; }
function thaiDate(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${Number(y) + 543}`;
}

const blankForm = (type = 'school') => ({
  name: '', date: todayISO(), type, scope: 'all',
  description: '', activityIds: EVENT_TYPE_DEFAULT_ACTIVITIES[type] ?? [],
});

// ── Indicator selector sub-component ─────────────────────────────────────────
function IndicatorSelector({ assessmentTopics, indicators, activities, linked, onChange }) {
  const [topic,     setTopic]     = useState('');
  const [indicator, setIndicator] = useState('');

  const topicInds  = useMemo(() => indicators.filter(i => i.domainId === topic), [indicators, topic]);
  const indActs    = useMemo(() => activities.filter(a => a.indicatorId === indicator), [activities, indicator]);

  function addActivity(actId) {
    if (!linked.includes(actId)) onChange([...linked, actId]);
  }
  function removeActivity(actId) {
    onChange(linked.filter(id => id !== actId));
  }

  // Build label from actId for display
  function actLabel(actId) {
    const act = activities.find(a => a.id === actId);
    if (!act) return actId;
    const ind = indicators.find(i => i.id === act.indicatorId);
    const dom = assessmentTopics.find(t => t.id === ind?.domainId);
    return `[${dom?.label ?? '?'}] ${ind?.indicatorCode ?? '?'} — ${act.label}`;
  }

  return (
    <div style={{ marginTop: '.5rem' }}>
      {/* Linked tags */}
      {linked.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.3rem', marginBottom: '.6rem' }}>
          {linked.map(id => (
            <span key={id} style={{
              display: 'inline-flex', alignItems: 'center', gap: '.3rem',
              background: '#ede9fe', color: '#6d28d9', border: '1px solid #c4b5fd',
              borderRadius: '8px', padding: '.2rem .55rem', fontSize: '.75rem', fontWeight: 600,
            }}>
              {actLabel(id)}
              <button type="button" onClick={() => removeActivity(id)} style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                color: '#7c3aed', fontSize: '.8rem', lineHeight: 1,
              }}>×</button>
            </span>
          ))}
        </div>
      )}

      {/* Picker chain */}
      <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={topic} onChange={e => { setTopic(e.target.value); setIndicator(''); }}
          style={{ padding: '.3rem .5rem', borderRadius: '7px', border: '1.5px solid #d1d5db', fontSize: '.8rem', fontFamily: 'inherit' }}>
          <option value="">— เลือกด้าน —</option>
          {assessmentTopics.map(t => (
            <option key={t.id} value={t.id}>{t.label}</option>
          ))}
        </select>

        {topic && (
          <select value={indicator} onChange={e => setIndicator(e.target.value)}
            style={{ padding: '.3rem .5rem', borderRadius: '7px', border: '1.5px solid #d1d5db', fontSize: '.8rem', fontFamily: 'inherit', maxWidth: '200px' }}>
            <option value="">— เลือกตัวบ่งชี้ —</option>
            {topicInds.map(i => (
              <option key={i.id} value={i.id}>{i.indicatorCode} {i.label}</option>
            ))}
          </select>
        )}

        {indicator && (
          <select value="" onChange={e => { if (e.target.value) addActivity(e.target.value); }}
            style={{ padding: '.3rem .5rem', borderRadius: '7px', border: '1.5px solid #d1d5db', fontSize: '.8rem', fontFamily: 'inherit', maxWidth: '240px' }}>
            <option value="">+ เลือกกิจกรรม</option>
            {indActs.filter(a => !linked.includes(a.id)).map(a => (
              <option key={a.id} value={a.id}>{a.label}</option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}

// ── Participation grid sub-component ─────────────────────────────────────────
function ParticipationGrid({ scopeStudents, participants, onToggle, onToggleAll }) {
  const allIn = scopeStudents.length > 0 && scopeStudents.every(s => participants[String(s.id)] === true);
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.5rem' }}>
        <span style={{ fontSize: '.78rem', fontWeight: 700, color: '#374151' }}>นักเรียนที่เข้าร่วม</span>
        <button type="button" onClick={() => onToggleAll(!allIn)} style={{
          padding: '.18rem .6rem', borderRadius: '7px', fontSize: '.72rem', fontWeight: 700,
          background: allIn ? '#fee2e2' : '#d1fae5', color: allIn ? '#991b1b' : '#065f46',
          border: 'none', cursor: 'pointer', fontFamily: 'inherit',
        }}>
          {allIn ? '✗ ยกเลิกทั้งหมด' : '✓ เลือกทั้งหมด'}
        </button>
        <span style={{ fontSize: '.72rem', color: '#9ca3af' }}>
          {scopeStudents.filter(s => participants[String(s.id)] === true).length}/{scopeStudents.length} คน
        </span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.35rem' }}>
        {scopeStudents.map(s => {
          const joined = participants[String(s.id)] === true;
          return (
            <button key={s.id} type="button" onClick={() => onToggle(String(s.id))} style={{
              padding: '.25rem .6rem', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit',
              border: `1.5px solid ${joined ? '#059669' : '#d1d5db'}`,
              background: joined ? '#d1fae5' : '#f9fafb',
              color: joined ? '#065f46' : '#9ca3af',
              fontWeight: joined ? 700 : 500, fontSize: '.8rem',
              transition: 'all .12s',
            }}>
              {joined ? '✓ ' : ''}{s.name}
            </button>
          );
        })}
        {scopeStudents.length === 0 && (
          <span style={{ fontSize: '.8rem', color: '#9ca3af' }}>— ไม่มีนักเรียนในขอบเขตนี้ —</span>
        )}
      </div>
    </div>
  );
}

// ── Event form modal ──────────────────────────────────────────────────────────
function EventModal({ event, allClassNames, students, assessmentTopics, indicators, activities, onSave, onClose }) {
  const [form, setForm] = useState(() => event
    ? { name: event.name, date: event.date, type: event.type, scope: event.scope,
        description: event.description ?? '', activityIds: event.activityIds ?? [] }
    : blankForm('school')
  );
  const [participants, setParticipants] = useState(() => event?.participants ?? {});

  const scopeStudents = useMemo(() => {
    const base = students.filter(s => !s.name.startsWith('(ว่าง)'));
    if (form.scope === 'all') return base.sort((a, b) => String(a.className).localeCompare(String(b.className)) || Number(a.id) - Number(b.id));
    return base.filter(s => s.className === form.scope).sort((a, b) => Number(a.id) - Number(b.id));
  }, [students, form.scope]);

  function handleSave() {
    if (!form.name.trim()) { alert('กรุณากรอกชื่อกิจกรรม'); return; }
    if (!form.date)         { alert('กรุณาเลือกวันที่');       return; }
    onSave({ ...form, participants });
  }

  function toggleParticipant(sid) {
    setParticipants(prev => ({ ...prev, [sid]: !prev[sid] }));
  }
  function toggleAll(val) {
    const next = {};
    scopeStudents.forEach(s => { next[String(s.id)] = val; });
    setParticipants(next);
  }

  const typeMeta = EVENT_TYPES[form.type];

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)', backdropFilter: 'blur(3px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 300,
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: 'white', borderRadius: '18px', boxShadow: '0 20px 60px rgba(0,0,0,.2)',
        width: '100%', maxWidth: '680px', maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '1rem 1.4rem', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#1e293b' }}>
            {event ? '✏️ แก้ไขกิจกรรม' : '➕ เพิ่มกิจกรรมวันสำคัญ'}
          </h3>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: '#9ca3af' }}>×</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.2rem 1.4rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Row 1: name + date */}
          <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
            <div style={{ flex: '2 1 220px' }}>
              <label style={{ fontSize: '.78rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '.3rem' }}>ชื่อกิจกรรม *</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="เช่น วันไหว้ครู 2568"
                style={{ width: '100%', padding: '.42rem .65rem', borderRadius: '8px', border: '1.5px solid #d1d5db', fontFamily: 'inherit', fontSize: '.88rem', boxSizing: 'border-box' }} />
            </div>
            <div style={{ flex: '1 1 150px' }}>
              <label style={{ fontSize: '.78rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '.3rem' }}>วันที่จัดกิจกรรม *</label>
              <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                style={{ width: '100%', padding: '.42rem .65rem', borderRadius: '8px', border: '1.5px solid #d1d5db', fontFamily: 'inherit', fontSize: '.88rem', boxSizing: 'border-box' }} />
            </div>
          </div>

          {/* Row 2: type + scope */}
          <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 200px' }}>
              <label style={{ fontSize: '.78rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '.3rem' }}>ประเภทกิจกรรม</label>
              <div style={{ display: 'flex', gap: '.35rem', flexWrap: 'wrap' }}>
                {Object.entries(EVENT_TYPES).map(([k, meta]) => (
                  <button key={k} type="button" onClick={() => setForm(p => ({
                    ...p,
                    type: k,
                    // Auto-swap defaults when creating new event (not editing)
                    activityIds: event ? p.activityIds : (EVENT_TYPE_DEFAULT_ACTIVITIES[k] ?? []),
                  }))} style={{
                    padding: '.25rem .7rem', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit',
                    border: `2px solid ${form.type === k ? meta.color : '#e5e7eb'}`,
                    background: form.type === k ? meta.bg : 'white',
                    color: form.type === k ? meta.color : '#6b7280',
                    fontWeight: 700, fontSize: '.78rem',
                  }}>{meta.label}</button>
                ))}
              </div>
            </div>
            <div style={{ flex: '1 1 180px' }}>
              <label style={{ fontSize: '.78rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '.3rem' }}>ห้องที่เข้าร่วม</label>
              <select value={form.scope} onChange={e => setForm(p => ({ ...p, scope: e.target.value }))}
                style={{ padding: '.4rem .6rem', borderRadius: '8px', border: '1.5px solid #d1d5db', fontFamily: 'inherit', fontSize: '.85rem', width: '100%' }}>
                <option value="all">ทุกห้องเรียน</option>
                {allClassNames.map(cn => <option key={cn} value={cn}>{cn}</option>)}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={{ fontSize: '.78rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '.3rem' }}>รายละเอียด (ไม่บังคับ)</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              rows={2} placeholder="อธิบายกิจกรรม วัตถุประสงค์ ฯลฯ"
              style={{ width: '100%', padding: '.4rem .65rem', borderRadius: '8px', border: '1.5px solid #d1d5db', fontFamily: 'inherit', fontSize: '.85rem', resize: 'vertical', boxSizing: 'border-box' }} />
          </div>

          {/* Indicator linking */}
          <div style={{ background: '#faf5ff', border: '1.5px solid #e9d5ff', borderRadius: '12px', padding: '.8rem 1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.5rem' }}>
              <span style={{ fontSize: '.78rem', fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                🔗 เชื่อมโยงตัวบ่งชี้พัฒนาการ
              </span>
              {!event && (
                <span style={{
                  fontSize: '.68rem', fontWeight: 700, color: '#6d28d9',
                  background: '#ede9fe', border: '1px solid #c4b5fd',
                  borderRadius: '6px', padding: '.1rem .45rem',
                }}>✨ เติมอัตโนมัติตามประเภท</span>
              )}
            </div>
            <IndicatorSelector
              assessmentTopics={assessmentTopics}
              indicators={indicators}
              activities={activities}
              linked={form.activityIds}
              onChange={ids => setForm(p => ({ ...p, activityIds: ids }))}
            />
            {form.activityIds.length === 0 && (
              <p style={{ fontSize: '.75rem', color: '#9ca3af', margin: '.4rem 0 0' }}>เลือกตัวบ่งชี้เพื่อให้ระบบเสนอคะแนนอัตโนมัติในหน้าประเมิน</p>
            )}
          </div>

          {/* Participation */}
          <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: '12px', padding: '.8rem 1rem' }}>
            <div style={{ fontSize: '.78rem', fontWeight: 800, color: '#065f46', marginBottom: '.6rem', textTransform: 'uppercase', letterSpacing: '.04em' }}>
              👤 รายชื่อผู้เข้าร่วมกิจกรรม
            </div>
            <ParticipationGrid
              scopeStudents={scopeStudents}
              participants={participants}
              onToggle={toggleParticipant}
              onToggleAll={toggleAll}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '.85rem 1.4rem', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '.6rem', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={{
            padding: '.42rem 1.1rem', borderRadius: '9px', border: '1.5px solid #d1d5db',
            background: 'white', color: '#374151', fontFamily: 'inherit', fontWeight: 700, fontSize: '.88rem', cursor: 'pointer',
          }}>ยกเลิก</button>
          <button type="button" onClick={handleSave} style={{
            padding: '.42rem 1.4rem', borderRadius: '9px', border: 'none',
            background: '#7c3aed', color: 'white', fontFamily: 'inherit', fontWeight: 800, fontSize: '.88rem', cursor: 'pointer',
          }}>💾 บันทึก</button>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function SpecialEventTab({ teacherClassFilter }) {
  const {
    specialEvents, setSpecialEvents,
    students, allClassNames,
    assessmentTopics, indicators, activities,
    role,
  } = useApp();

  const isTeacher = role === 'teacher';

  // Filters
  const [search,     setSearch]     = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterClass, setFilterClass] = useState(teacherClassFilter ?? '');

  // Modals
  const [addModal,  setAddModal]  = useState(false);
  const [editId,    setEditId]    = useState(null);
  const [deleteId,  setDeleteId]  = useState(null);

  // Sorted + filtered events
  const eventList = useMemo(() => {
    return Object.values(specialEvents)
      .filter(ev => {
        if (search && !ev.name.toLowerCase().includes(search.toLowerCase())) return false;
        if (filterType && ev.type !== filterType) return false;
        if (filterClass && ev.scope !== 'all' && ev.scope !== filterClass) return false;
        // teacher sees only events that include their class
        if (isTeacher && teacherClassFilter) {
          if (ev.scope !== 'all' && ev.scope !== teacherClassFilter) return false;
        }
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [specialEvents, search, filterType, filterClass, isTeacher, teacherClassFilter]);

  const handleSave = useCallback((formData, existingId) => {
    const id   = existingId ?? `ev_${Date.now()}`;
    setSpecialEvents(prev => ({
      ...prev,
      [id]: { ...formData, id },
    }));
    setAddModal(false);
    setEditId(null);
  }, [setSpecialEvents]);

  const handleDelete = useCallback((id) => {
    setSpecialEvents(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setDeleteId(null);
  }, [setSpecialEvents]);

  const editEvent = editId ? specialEvents[editId] : null;

  // Import preset events (skip any that already exist by id)
  const handleImportPresets = useCallback(() => {
    const existing = Object.keys(specialEvents);
    const toAdd = PRESET_EVENTS.filter(ev => !existing.includes(ev.id));
    if (toAdd.length === 0) {
      alert('นำเข้าแล้วทั้งหมด ไม่มีกิจกรรมตัวอย่างใหม่ที่ต้องเพิ่ม');
      return;
    }
    const batch = {};
    toAdd.forEach(ev => { batch[ev.id] = ev; });
    setSpecialEvents(prev => ({ ...prev, ...batch }));
  }, [specialEvents, setSpecialEvents]);

  // Stat helpers
  function participantCount(ev) {
    return Object.values(ev.participants ?? {}).filter(v => v === true).length;
  }
  function scopeStudentCount(ev) {
    if (ev.scope === 'all') return students.filter(s => !s.name.startsWith('(ว่าง)')).length;
    return students.filter(s => s.className === ev.scope && !s.name.startsWith('(ว่าง)')).length;
  }

  const availableClasses = isTeacher && teacherClassFilter ? [teacherClassFilter] : allClassNames;

  return (
    <div className="animate-fade">
      {/* Page header */}
      <div className="page-header">
        <h2>🎉 กิจกรรมวันสำคัญ</h2>
        <div style={{ display: 'flex', gap: '.5rem' }}>
          {!isTeacher && (
            <button type="button" className="btn btn-secondary" onClick={handleImportPresets}
              title="นำเข้ากิจกรรมตัวอย่างปีการศึกษา 2568 (13 กิจกรรม)">
              📋 นำเข้าตัวอย่าง 2568
            </button>
          )}
          <button type="button" className="btn btn-primary" onClick={() => setAddModal(true)}>
            ➕ เพิ่มกิจกรรม
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="glass-card" style={{ padding: '.75rem 1rem', marginBottom: '1rem', display: 'flex', gap: '.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          placeholder="🔍 ค้นหาชื่อกิจกรรม"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: '.38rem .75rem', borderRadius: '9px', border: '1.5px solid #e5e7eb', fontFamily: 'inherit', fontSize: '.85rem', minWidth: '180px' }}
        />

        {/* Type filter */}
        <div style={{ display: 'flex', gap: '.3rem' }}>
          <button type="button" onClick={() => setFilterType('')} style={{
            padding: '.28rem .7rem', borderRadius: '8px', border: `1.5px solid ${filterType === '' ? '#7c3aed' : '#e5e7eb'}`,
            background: filterType === '' ? '#ede9fe' : 'white', color: filterType === '' ? '#7c3aed' : '#6b7280',
            fontWeight: 700, fontSize: '.78rem', cursor: 'pointer', fontFamily: 'inherit',
          }}>ทั้งหมด</button>
          {Object.entries(EVENT_TYPES).map(([k, meta]) => (
            <button key={k} type="button" onClick={() => setFilterType(filterType === k ? '' : k)} style={{
              padding: '.28rem .7rem', borderRadius: '8px', border: `1.5px solid ${filterType === k ? meta.color : '#e5e7eb'}`,
              background: filterType === k ? meta.bg : 'white', color: filterType === k ? meta.color : '#6b7280',
              fontWeight: 700, fontSize: '.78rem', cursor: 'pointer', fontFamily: 'inherit',
            }}>{meta.label}</button>
          ))}
        </div>

        {/* Class filter (admin only) */}
        {!isTeacher && (
          <select value={filterClass} onChange={e => setFilterClass(e.target.value)}
            style={{ padding: '.35rem .6rem', borderRadius: '8px', border: '1.5px solid #e5e7eb', fontFamily: 'inherit', fontSize: '.82rem' }}>
            <option value="">ทุกห้อง</option>
            {allClassNames.map(cn => <option key={cn} value={cn}>{cn}</option>)}
          </select>
        )}

        <span style={{ marginLeft: 'auto', fontSize: '.78rem', color: '#9ca3af' }}>
          {eventList.length} กิจกรรม
        </span>
      </div>

      {/* Event cards / table */}
      {eventList.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '.75rem' }}>🎉</div>
          <div style={{ fontWeight: 700, marginBottom: '.4rem', color: '#374151' }}>ยังไม่มีกิจกรรมวันสำคัญ</div>
          <div style={{ fontSize: '.85rem', marginBottom: '1.2rem' }}>กด "เพิ่มกิจกรรม" เพื่อเริ่มต้นบันทึก</div>
          {!isTeacher && (
            <button type="button" onClick={handleImportPresets} style={{
              padding: '.45rem 1.2rem', borderRadius: '10px', border: '1.5px solid #7c3aed',
              background: '#ede9fe', color: '#6d28d9', fontFamily: 'inherit',
              fontWeight: 700, fontSize: '.85rem', cursor: 'pointer',
            }}>
              📋 นำเข้ากิจกรรมตัวอย่างปีการศึกษา 2568 (13 กิจกรรม)
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
          {eventList.map(ev => {
            const meta  = EVENT_TYPES[ev.type] ?? EVENT_TYPES.school;
            const pct   = scopeStudentCount(ev) > 0
              ? Math.round(participantCount(ev) / scopeStudentCount(ev) * 100)
              : 0;

            return (
              <div key={ev.id} className="glass-card" style={{ padding: '1rem 1.2rem', display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                {/* Date column */}
                <div style={{ minWidth: '72px', textAlign: 'center' }}>
                  <div style={{ fontSize: '.72rem', color: '#9ca3af', fontWeight: 600 }}>
                    {ev.date?.split('-')[0] ? `ปี ${Number(ev.date.split('-')[0]) + 543}` : ''}
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b' }}>
                    {ev.date?.split('-')[2] ?? ''}
                  </div>
                  <div style={{ fontSize: '.72rem', color: '#6b7280', fontWeight: 600 }}>
                    {ev.date ? ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'][Number(ev.date.split('-')[1]) - 1] : ''}
                  </div>
                </div>

                {/* Main info */}
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexWrap: 'wrap', marginBottom: '.3rem' }}>
                    <span style={{ fontWeight: 800, fontSize: '.95rem', color: '#1e293b' }}>{ev.name}</span>
                    <span style={{ fontSize: '.72rem', fontWeight: 700, padding: '.15rem .55rem', borderRadius: '999px', background: meta.bg, color: meta.color }}>
                      {meta.label}
                    </span>
                    <span style={{ fontSize: '.72rem', color: '#9ca3af', background: '#f3f4f6', padding: '.15rem .55rem', borderRadius: '999px' }}>
                      {ev.scope === 'all' ? 'ทุกห้อง' : ev.scope}
                    </span>
                  </div>
                  {ev.description && (
                    <div style={{ fontSize: '.8rem', color: '#6b7280', marginBottom: '.4rem' }}>{ev.description}</div>
                  )}

                  {/* Stats row */}
                  <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    {/* Participation bar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                      <span style={{ fontSize: '.75rem', color: '#6b7280' }}>เข้าร่วม</span>
                      <div style={{ width: '80px', height: '6px', background: '#f3f4f6', borderRadius: '999px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: pct >= 80 ? '#059669' : pct >= 60 ? '#d97706' : '#dc2626', borderRadius: '999px' }} />
                      </div>
                      <span style={{ fontSize: '.75rem', fontWeight: 700, color: pct >= 80 ? '#059669' : pct >= 60 ? '#d97706' : '#dc2626' }}>
                        {participantCount(ev)}/{scopeStudentCount(ev)} ({pct}%)
                      </span>
                    </div>
                    {/* Indicator count */}
                    {(ev.activityIds?.length ?? 0) > 0 && (
                      <span style={{ fontSize: '.75rem', background: '#ede9fe', color: '#7c3aed', padding: '.15rem .55rem', borderRadius: '999px', fontWeight: 700 }}>
                        🔗 {ev.activityIds.length} ตัวบ่งชี้
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '.4rem', flexShrink: 0 }}>
                  <button type="button" onClick={() => setEditId(ev.id)} style={{
                    padding: '.3rem .75rem', borderRadius: '8px', border: '1.5px solid #d1d5db',
                    background: 'white', color: '#374151', fontFamily: 'inherit', fontWeight: 700, fontSize: '.78rem', cursor: 'pointer',
                  }}>✏️ แก้ไข</button>
                  {!isTeacher && (
                    <button type="button" onClick={() => setDeleteId(ev.id)} style={{
                      padding: '.3rem .75rem', borderRadius: '8px', border: '1.5px solid #fecaca',
                      background: '#fff5f5', color: '#dc2626', fontFamily: 'inherit', fontWeight: 700, fontSize: '.78rem', cursor: 'pointer',
                    }}>🗑️</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary stats */}
      {eventList.length > 0 && (
        <div className="glass-card" style={{ marginTop: '1rem', padding: '.85rem 1.2rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          {Object.entries(EVENT_TYPES).map(([k, meta]) => {
            const count = eventList.filter(ev => ev.type === k).length;
            if (count === 0) return null;
            return (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                <span style={{ fontSize: '.75rem', fontWeight: 700, color: meta.color, background: meta.bg, padding: '.15rem .55rem', borderRadius: '999px' }}>{meta.label}</span>
                <span style={{ fontSize: '.82rem', fontWeight: 800, color: '#374151' }}>{count}</span>
              </div>
            );
          })}
          <span style={{ fontSize: '.75rem', color: '#9ca3af', marginLeft: 'auto' }}>รวม {eventList.length} กิจกรรม</span>
        </div>
      )}

      {/* Add/Edit Modal */}
      {(addModal || editId) && (
        <EventModal
          event={editId ? editEvent : null}
          allClassNames={availableClasses}
          students={students}
          assessmentTopics={assessmentTopics}
          indicators={indicators}
          activities={activities}
          onSave={(formData) => handleSave(formData, editId ?? null)}
          onClose={() => { setAddModal(false); setEditId(null); }}
        />
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,.4)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 400,
        }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', maxWidth: '360px', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,.18)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '.5rem' }}>🗑️</div>
            <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '.4rem', color: '#1e293b' }}>ลบกิจกรรม?</div>
            <div style={{ fontSize: '.85rem', color: '#6b7280', marginBottom: '1.25rem' }}>
              "{specialEvents[deleteId]?.name}"<br />ข้อมูลนี้จะถูกลบถาวร ไม่สามารถกู้คืนได้
            </div>
            <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'center' }}>
              <button type="button" onClick={() => setDeleteId(null)} style={{
                padding: '.42rem 1.1rem', borderRadius: '9px', border: '1.5px solid #d1d5db',
                background: 'white', fontFamily: 'inherit', fontWeight: 700, fontSize: '.88rem', cursor: 'pointer',
              }}>ยกเลิก</button>
              <button type="button" onClick={() => handleDelete(deleteId)} style={{
                padding: '.42rem 1.1rem', borderRadius: '9px', border: 'none',
                background: '#dc2626', color: 'white', fontFamily: 'inherit', fontWeight: 800, fontSize: '.88rem', cursor: 'pointer',
              }}>ลบ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
