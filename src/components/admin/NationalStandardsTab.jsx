// NationalStandardsTab.jsx
// แสดงผลตามมาตรฐานสถานพัฒนาเด็กปฐมวัยแห่งชาติ (3 มาตรฐาน 18 ตัวบ่งชี้)
// มาตรฐานที่ 3 → aggregate จาก activityLogs
// มาตรฐานที่ 1-2 → checklist บันทึกใน localStorage
import { useState, useMemo } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useApp } from '../../context/AppContext';

// ─── แมปรหัสตัวบ่งชี้ → ด้านพัฒนาการ ──────────────────────────────────────
// ระบบ ดย. (3.x–6.x) และ หลักสูตรปฐมวัย 2560 (1–12)
function getDomainfromCode(code) {
  if (!code) return null;
  const c = String(code).trim();
  // ระบบ ดย. — prefix เลขมาตรฐาน
  if (/^3\./.test(c)) return 'physical';   // ร่างกาย
  if (/^4\./.test(c)) return 'emotional';  // อารมณ์-จิตใจ
  if (/^5\./.test(c)) return 'social';     // สังคม
  if (/^6\./.test(c)) return 'cognitive';  // สติปัญญา
  // ระบบหลักสูตรปฐมวัย 2560 — มาตรฐาน 1–12
  const n = parseInt(c, 10);
  if (n === 1 || n === 2) return 'physical';
  if (n >= 3 && n <= 5)   return 'emotional';
  if (n >= 6 && n <= 8)   return 'social';
  if (n >= 9 && n <= 12)  return 'cognitive';
  return null;
}

const DOMAIN_META = {
  physical:  { label: '🏃 ร่างกาย',      color: '#059669', bg: '#ecfdf5', border: '#6ee7b7', nat: '3.1–3.2' },
  emotional: { label: '❤️ อารมณ์-จิตใจ', color: '#e11d48', bg: '#fff1f2', border: '#fda4af', nat: '3.3' },
  social:    { label: '🤝 สังคม',         color: '#7c3aed', bg: '#f5f3ff', border: '#c4b5fd', nat: '3.4' },
  cognitive: { label: '💡 สติปัญญา',      color: '#b45309', bg: '#fffbeb', border: '#fcd34d', nat: '3.5' },
};

// ─── ตัวบ่งชี้มาตรฐานที่ 1 (การบริหารจัดการ) ────────────────────────────
const STD1_ITEMS = [
  { id: '1.1', label: 'มีวิสัยทัศน์ พันธกิจ และเป้าหมายในการพัฒนาเด็กปฐมวัยอย่างชัดเจน' },
  { id: '1.2', label: 'บุคลากรมีคุณวุฒิ ความรู้ ทักษะ และประสบการณ์ที่เหมาะสม' },
  { id: '1.3', label: 'สภาพแวดล้อมและสิ่งอำนวยความสะดวกปลอดภัยและเอื้อต่อการเรียนรู้' },
  { id: '1.4', label: 'มีแผนส่งเสริมสุขภาพ โภชนาการ และความปลอดภัยของเด็ก' },
  { id: '1.5', label: 'มีการสร้างเครือข่ายกับชุมชนและผู้ปกครองอย่างเป็นระบบ' },
];

// ─── ตัวบ่งชี้มาตรฐานที่ 2 (ครู/ผู้ดูแล) ────────────────────────────────
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

// ─── Rating levels สำหรับ checklist ─────────────────────────────────────────
const RATINGS = [
  { value: 3, label: 'ดีมาก', color: '#16a34a', bg: '#dcfce7' },
  { value: 2, label: 'พอใช้', color: '#d97706', bg: '#fef3c7' },
  { value: 1, label: 'ต้องพัฒนา', color: '#dc2626', bg: '#fee2e2' },
  { value: 0, label: 'ยังไม่ประเมิน', color: '#9ca3af', bg: '#f3f4f6' },
];

function ratingMeta(v) {
  return RATINGS.find(r => r.value === v) ?? RATINGS[3];
}

// ─── Gauge / progress bar ─────────────────────────────────────────────────────
function ScoreBar({ pct, color }) {
  return (
    <div style={{ height: '10px', background: '#e5e7eb', borderRadius: '99px', overflow: 'hidden' }}>
      <div style={{
        height: '100%', width: `${Math.round(pct)}%`,
        background: color, borderRadius: '99px',
        transition: 'width .4s ease',
      }} />
    </div>
  );
}

// ─── คำนวณคะแนนจาก checklist items ──────────────────────────────────────────
function calcChecklistScore(items, ratings) {
  const rated = items.filter(it => (ratings[it.id] ?? 0) > 0);
  if (rated.length === 0) return null;
  const total = rated.reduce((s, it) => s + (ratings[it.id] ?? 0), 0);
  return Math.round((total / (rated.length * 3)) * 100);
}

// ─── Domain card (มาตรฐาน 3) ─────────────────────────────────────────────────
function DomainCard({ domain, stats }) {
  const meta = DOMAIN_META[domain];
  const total = stats.s1 + stats.s2 + stats.s3;
  const pctGood = total > 0 ? Math.round((stats.s3 / total) * 100) : 0;
  const pctMid  = total > 0 ? Math.round((stats.s2 / total) * 100) : 0;
  const pctLow  = total > 0 ? Math.round((stats.s1 / total) * 100) : 0;

  return (
    <div style={{
      background: meta.bg, border: `2px solid ${meta.border}`,
      borderRadius: '16px', padding: '1rem 1.2rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '.6rem' }}>
        <div>
          <div style={{ fontWeight: 800, color: meta.color, fontSize: '.95rem' }}>{meta.label}</div>
          <div style={{ fontSize: '.68rem', color: '#9ca3af', marginTop: '.1rem' }}>ตัวบ่งชี้ {meta.nat}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '1.9rem', fontWeight: 900, color: meta.color, lineHeight: 1 }}>{pctGood}%</div>
          <div style={{ fontSize: '.65rem', color: '#6b7280' }}>ดีมาก</div>
        </div>
      </div>

      {total === 0 ? (
        <div style={{ fontSize: '.75rem', color: '#9ca3af', textAlign: 'center', padding: '.5rem 0' }}>ยังไม่มีข้อมูลการประเมิน</div>
      ) : (
        <>
          <ScoreBar pct={pctGood} color={meta.color} />
          <div style={{ display: 'flex', gap: '.4rem', marginTop: '.5rem', flexWrap: 'wrap' }}>
            {[
              { label: 'ดีมาก', val: stats.s3, pct: pctGood, clr: '#16a34a', bg: '#dcfce7' },
              { label: 'พอใช้', val: stats.s2, pct: pctMid,  clr: '#d97706', bg: '#fef3c7' },
              { label: 'ต้องพัฒนา', val: stats.s1, pct: pctLow, clr: '#dc2626', bg: '#fee2e2' },
            ].map(b => (
              <span key={b.label} style={{
                fontSize: '.7rem', fontWeight: 700,
                background: b.bg, color: b.clr,
                padding: '2px 8px', borderRadius: '6px',
              }}>
                {b.label} {b.val} ({b.pct}%)
              </span>
            ))}
          </div>
          <div style={{ fontSize: '.7rem', color: '#9ca3af', marginTop: '.35rem' }}>
            จาก {total} ครั้งที่ประเมิน ({stats.sessions} เซสชัน)
          </div>
        </>
      )}
    </div>
  );
}

// ─── Checklist section (มาตรฐาน 1 & 2) ───────────────────────────────────────
function ChecklistSection({ title, subtitle, items, ratings, onChange, colorAccent }) {
  const score = calcChecklistScore(items, ratings);

  return (
    <div style={{
      background: 'white', border: '2px solid #e5e7eb',
      borderRadius: '16px', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        background: colorAccent, color: 'white',
        padding: '.85rem 1.2rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '.5rem',
      }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: '.95rem' }}>{title}</div>
          <div style={{ fontSize: '.72rem', opacity: .85, marginTop: '.15rem' }}>{subtitle}</div>
        </div>
        {score !== null ? (
          <div style={{ background: 'rgba(255,255,255,.2)', borderRadius: '12px', padding: '.4rem .9rem', textAlign: 'center', minWidth: '70px' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 900 }}>{score}%</div>
            <div style={{ fontSize: '.62rem', opacity: .85 }}>คะแนนรวม</div>
          </div>
        ) : (
          <div style={{ background: 'rgba(255,255,255,.15)', borderRadius: '12px', padding: '.4rem .9rem', fontSize: '.72rem', opacity: .8 }}>
            ยังไม่ประเมิน
          </div>
        )}
      </div>

      {/* Items */}
      <div style={{ padding: '.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
        {items.map(item => {
          const val = ratings[item.id] ?? 0;
          const rm = ratingMeta(val);
          return (
            <div key={item.id} style={{
              display: 'flex', alignItems: 'center', gap: '.75rem',
              padding: '.6rem .75rem', borderRadius: '10px',
              background: val > 0 ? rm.bg + '80' : '#f9fafb',
              border: `1.5px solid ${val > 0 ? rm.bg : '#e5e7eb'}`,
            }}>
              {/* Code */}
              <div style={{
                minWidth: '36px', fontWeight: 900, fontSize: '.78rem',
                color: colorAccent, flexShrink: 0,
              }}>
                {item.id}
              </div>
              {/* Label */}
              <div style={{ flex: 1, fontSize: '.82rem', color: '#374151', lineHeight: 1.4 }}>
                {item.label}
              </div>
              {/* Rating selector */}
              <div style={{ display: 'flex', gap: '.3rem', flexShrink: 0 }}>
                {RATINGS.slice(0, 3).map(r => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => onChange(item.id, val === r.value ? 0 : r.value)}
                    style={{
                      padding: '3px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                      fontWeight: 700, fontSize: '.7rem', transition: 'all .12s',
                      background: val === r.value ? r.color : '#f3f4f6',
                      color: val === r.value ? 'white' : '#9ca3af',
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
    </div>
  );
}

// ─── Summary badge ────────────────────────────────────────────────────────────
function SummaryBadge({ label, score, color, bg, border }) {
  return (
    <div style={{
      background: bg, border: `2px solid ${border}`,
      borderRadius: '14px', padding: '.85rem 1.25rem',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.2rem',
    }}>
      <div style={{ fontSize: '.72rem', color: '#6b7280', fontWeight: 600, textAlign: 'center' }}>{label}</div>
      {score !== null ? (
        <div style={{ fontSize: '2rem', fontWeight: 900, color, lineHeight: 1 }}>{score}%</div>
      ) : (
        <div style={{ fontSize: '.8rem', color: '#9ca3af' }}>—</div>
      )}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function NationalStandardsTab() {
  const { activityLogs } = useApp();

  // Checklist ratings: { "1.1": 3, "1.2": 2, ... }
  const [std1Ratings, setStd1Ratings] = useLocalStorage('kt_std1_ratings', {});
  const [std2Ratings, setStd2Ratings] = useLocalStorage('kt_std2_ratings', {});

  const [activeSection, setActiveSection] = useState('all');
  const [filterRound, setFilterRound] = useState('');

  // ── Aggregate activityLogs by domain ──────────────────────────────────────
  const domainStats = useMemo(() => {
    const init = () => ({ s1: 0, s2: 0, s3: 0, sessions: 0 });
    const stats = {
      physical: init(), emotional: init(), social: init(), cognitive: init(),
    };

    const filtered = filterRound
      ? activityLogs.filter(l => String(l.round) === filterRound)
      : activityLogs;

    for (const log of filtered) {
      const domain = getDomainfromCode(log.indicatorCode);
      if (!domain) continue;
      stats[domain].s1 += log.scores?.s1 ?? 0;
      stats[domain].s2 += log.scores?.s2 ?? 0;
      stats[domain].s3 += log.scores?.s3 ?? 0;
      stats[domain].sessions += 1;
    }
    return stats;
  }, [activityLogs, filterRound]);

  // ── คะแนนรวมมาตรฐานที่ 3 ────────────────────────────────────────────────
  const std3Score = useMemo(() => {
    const all = Object.values(domainStats);
    const total = all.reduce((s, d) => s + d.s1 + d.s2 + d.s3, 0);
    if (total === 0) return null;
    const good = all.reduce((s, d) => s + d.s3, 0);
    return Math.round((good / total) * 100);
  }, [domainStats]);

  // ── คะแนน checklist ──────────────────────────────────────────────────────
  const std1Score = calcChecklistScore(STD1_ITEMS, std1Ratings);
  const std2Score = calcChecklistScore(STD2_ITEMS, std2Ratings);

  // ── handlers ──────────────────────────────────────────────────────────────
  const updateStd1 = (id, val) => setStd1Ratings(prev => ({ ...prev, [id]: val }));
  const updateStd2 = (id, val) => setStd2Ratings(prev => ({ ...prev, [id]: val }));

  const SECTIONS = [
    { id: 'all',  label: '📊 ภาพรวม' },
    { id: 'std3', label: '👶 มาตรฐานที่ 3 — คุณภาพเด็ก' },
    { id: 'std2', label: '👩‍🏫 มาตรฐานที่ 2 — ครู/ผู้ดูแล' },
    { id: 'std1', label: '🏛 มาตรฐานที่ 1 — การบริหาร' },
  ];

  return (
    <div className="glass p-6 animate-fade">
      {/* Header */}
      <div className="page-header mb-4">
        <h3>🏛 มาตรฐานสถานพัฒนาเด็กปฐมวัยแห่งชาติ</h3>
        <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>
          3 มาตรฐาน · 18 ตัวบ่งชี้ · กรมกิจการเด็กและเยาวชน (ดย.)
        </div>
      </div>

      {/* Sub-nav */}
      <div style={{ display: 'flex', gap: '.4rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {SECTIONS.map(s => (
          <button
            key={s.id} type="button"
            onClick={() => setActiveSection(s.id)}
            style={{
              padding: '.38rem .85rem', borderRadius: '8px', cursor: 'pointer',
              border: activeSection === s.id ? '2px solid #6366f1' : '2px solid transparent',
              background: activeSection === s.id ? '#6366f1' : 'white',
              color: activeSection === s.id ? 'white' : '#4b5563',
              fontWeight: activeSection === s.id ? 700 : 500,
              fontSize: '.8rem', fontFamily: 'inherit',
              boxShadow: activeSection === s.id ? '0 2px 8px #6366f135' : '0 1px 2px rgba(0,0,0,.05)',
              transition: 'all .15s',
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* ══ ภาพรวม ══════════════════════════════════════════════════════════ */}
      {activeSection === 'all' && (
        <div>
          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px,1fr))', gap: '.85rem', marginBottom: '1.5rem' }}>
            <SummaryBadge
              label="มาตรฐานที่ 1 — การบริหารจัดการ"
              score={std1Score}
              color="#0891b2" bg="#f0f9ff" border="#bae6fd"
            />
            <SummaryBadge
              label="มาตรฐานที่ 2 — ครู/ผู้ดูแลเด็ก"
              score={std2Score}
              color="#7c3aed" bg="#f5f3ff" border="#ddd6fe"
            />
            <SummaryBadge
              label="มาตรฐานที่ 3 — คุณภาพเด็ก"
              score={std3Score}
              color="#059669" bg="#ecfdf5" border="#6ee7b7"
            />
          </div>

          {/* Note */}
          <div style={{
            background: '#fffbeb', border: '1px solid #fcd34d',
            borderRadius: '10px', padding: '.7rem 1rem',
            fontSize: '.78rem', color: '#92400e', marginBottom: '1.25rem',
          }}>
            💡 <strong>มาตรฐานที่ 3</strong> คำนวณจากผลการประเมินในระบบ &nbsp;·&nbsp;
            <strong>มาตรฐานที่ 1-2</strong> ใช้การกรอก Checklist ด้วยตนเอง &nbsp;·&nbsp;
            กดที่แท็บเพื่อดูรายละเอียดและแก้ไขข้อมูล
          </div>

          {/* Domain quick view */}
          <div style={{ marginBottom: '.5rem', fontWeight: 700, fontSize: '.85rem', color: '#374151' }}>
            มาตรฐานที่ 3 — ผลรายด้านพัฒนาการ
            <span style={{ marginLeft: '.75rem' }}>
              <select
                className="input"
                style={{ fontSize: '.75rem', padding: '.2rem .5rem', display: 'inline-block', width: 'auto', marginLeft: '.35rem' }}
                value={filterRound}
                onChange={e => setFilterRound(e.target.value)}
              >
                <option value="">ทุกครั้ง</option>
                {[1,2,3,4].map(r => <option key={r} value={r}>ครั้งที่ {r}</option>)}
              </select>
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px,1fr))', gap: '.85rem' }}>
            {Object.keys(DOMAIN_META).map(d => (
              <DomainCard key={d} domain={d} stats={domainStats[d]} />
            ))}
          </div>
        </div>
      )}

      {/* ══ มาตรฐานที่ 3 ════════════════════════════════════════════════════ */}
      {activeSection === 'std3' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            <div style={{ fontWeight: 700, color: '#374151', fontSize: '.88rem' }}>กรองตามครั้งที่ประเมิน</div>
            <select
              className="input"
              style={{ fontSize: '.8rem', width: '130px' }}
              value={filterRound}
              onChange={e => setFilterRound(e.target.value)}
            >
              <option value="">ทุกครั้ง</option>
              {[1,2,3,4].map(r => <option key={r} value={r}>ครั้งที่ {r}</option>)}
            </select>
            {activityLogs.length === 0 && (
              <span style={{ fontSize: '.8rem', color: '#f59e0b', background: '#fffbeb', padding: '4px 10px', borderRadius: '8px', border: '1px solid #fcd34d' }}>
                ⚠️ ยังไม่มีข้อมูลการประเมิน — บันทึกผลจาก TeacherDashboard ก่อน
              </span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px,1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            {Object.keys(DOMAIN_META).map(d => (
              <DomainCard key={d} domain={d} stats={domainStats[d]} />
            ))}
          </div>

          {/* Detail table */}
          {activityLogs.length > 0 && (
            <div>
              <div style={{ fontWeight: 700, fontSize: '.85rem', color: '#374151', marginBottom: '.6rem' }}>
                รายละเอียดการประเมินตามมาตรฐาน
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.78rem' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9' }}>
                      {['ด้านพัฒนาการ', 'มาตรฐานแห่งชาติ', 'ตัวบ่งชี้ ดย./หลักสูตร', 'ดีมาก', 'พอใช้', 'ต้องพัฒนา', '% ดีมาก'].map(h => (
                        <th key={h} style={{ padding: '.5rem .75rem', textAlign: 'left', fontWeight: 700, color: '#4b5563', whiteSpace: 'nowrap', borderBottom: '2px solid #e5e7eb' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { domain: 'physical',  nat: '3.1 น้ำหนัก-ส่วนสูง / 3.2 ร่างกาย', codes: '3.1–3.3 / มาตรฐาน 1-2' },
                      { domain: 'emotional', nat: '3.3 อารมณ์-จิตใจ',                    codes: '4.1–4.3 / มาตรฐาน 3-5' },
                      { domain: 'social',    nat: '3.4 สังคม',                            codes: '5.1–5.4 / มาตรฐาน 6-8' },
                      { domain: 'cognitive', nat: '3.5 สติปัญญา-ภาษา',                   codes: '6.1–6.3 / มาตรฐาน 9-12' },
                    ].map(row => {
                      const st = domainStats[row.domain];
                      const total = st.s1 + st.s2 + st.s3;
                      const pct = total > 0 ? Math.round((st.s3 / total) * 100) : '—';
                      const meta = DOMAIN_META[row.domain];
                      return (
                        <tr key={row.domain} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '.55rem .75rem', fontWeight: 700, color: meta.color }}>{meta.label}</td>
                          <td style={{ padding: '.55rem .75rem', color: '#374151' }}>{row.nat}</td>
                          <td style={{ padding: '.55rem .75rem', color: '#6b7280', fontSize: '.72rem' }}>{row.codes}</td>
                          <td style={{ padding: '.55rem .75rem', textAlign: 'center', fontWeight: 700, color: '#16a34a' }}>{st.s3}</td>
                          <td style={{ padding: '.55rem .75rem', textAlign: 'center', fontWeight: 700, color: '#d97706' }}>{st.s2}</td>
                          <td style={{ padding: '.55rem .75rem', textAlign: 'center', fontWeight: 700, color: '#dc2626' }}>{st.s1}</td>
                          <td style={{ padding: '.55rem .75rem', textAlign: 'center' }}>
                            <span style={{
                              background: typeof pct === 'number' ? (pct >= 70 ? '#dcfce7' : pct >= 50 ? '#fef3c7' : '#fee2e2') : '#f3f4f6',
                              color: typeof pct === 'number' ? (pct >= 70 ? '#16a34a' : pct >= 50 ? '#d97706' : '#dc2626') : '#9ca3af',
                              fontWeight: 800, padding: '2px 8px', borderRadius: '6px', fontSize: '.78rem',
                            }}>
                              {typeof pct === 'number' ? `${pct}%` : '—'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ มาตรฐานที่ 2 ════════════════════════════════════════════════════ */}
      {activeSection === 'std2' && (
        <div>
          <div style={{
            background: '#f5f3ff', border: '1px solid #ddd6fe',
            borderRadius: '10px', padding: '.7rem 1rem',
            fontSize: '.78rem', color: '#5b21b6', marginBottom: '1.25rem',
          }}>
            📝 <strong>วิธีใช้:</strong> ประเมินแต่ละตัวบ่งชี้โดยเลือก ดีมาก / พอใช้ / ต้องพัฒนา ข้อมูลบันทึกอัตโนมัติ
          </div>
          <ChecklistSection
            title="มาตรฐานที่ 2 — ครู/ผู้ดูแลเด็กให้การดูแลและจัดประสบการณ์"
            subtitle="8 ตัวบ่งชี้ · สอดคล้องกับ สมศ. มาตรฐาน 3"
            items={STD2_ITEMS}
            ratings={std2Ratings}
            onChange={updateStd2}
            colorAccent="#7c3aed"
          />
        </div>
      )}

      {/* ══ มาตรฐานที่ 1 ════════════════════════════════════════════════════ */}
      {activeSection === 'std1' && (
        <div>
          <div style={{
            background: '#f0f9ff', border: '1px solid #bae6fd',
            borderRadius: '10px', padding: '.7rem 1rem',
            fontSize: '.78rem', color: '#075985', marginBottom: '1.25rem',
          }}>
            📝 <strong>วิธีใช้:</strong> ประเมินแต่ละตัวบ่งชี้โดยเลือก ดีมาก / พอใช้ / ต้องพัฒนา ข้อมูลบันทึกอัตโนมัติ
          </div>
          <ChecklistSection
            title="มาตรฐานที่ 1 — การบริหารจัดการสถานพัฒนาเด็กปฐมวัย"
            subtitle="5 ตัวบ่งชี้ · สอดคล้องกับ สมศ. มาตรฐาน 2"
            items={STD1_ITEMS}
            ratings={std1Ratings}
            onChange={updateStd1}
            colorAccent="#0891b2"
          />
        </div>
      )}
    </div>
  );
}
