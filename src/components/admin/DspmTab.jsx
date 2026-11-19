import { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { compareStudents, compareClassNames } from '../../utils/helpers';
import {
  DSPM_DOMAINS, DSPM_BANDS, ageInMonths, ageText, bandForMonths, summarizeBand,
} from '../../data/dspmData';

const todayISO = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);

const STATUS = {
  none:    { label: 'ยังไม่ประเมิน',   bg: '#f3f4f6', color: '#6b7280' },
  partial: { label: 'กรอกยังไม่ครบ',   bg: '#fef9c3', color: '#92400e' },
  pass:    { label: 'ผ่านทุกด้าน',     bg: '#d1fae5', color: '#065f46' },
  follow:  { label: 'ต้องส่งเสริม/ติดตาม', bg: '#fee2e2', color: '#991b1b' },
};

const card = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px' };

/**
 * DspmTab — คัดกรองและเฝ้าระวังพัฒนาการเด็กปฐมวัย (DSPM) รายช่วงอายุ
 * เก็บผลใน student.dspm = { [bandKey]: { date, GM:'pass'|'fail', FM, RL, EL, PS } }
 * ครู: เห็น/แก้เฉพาะห้องตนเอง | Admin: เลือกห้องได้
 */
export default function DspmTab({ teacherClassFilter = null }) {
  const { students, setStudents, classes, role, user } = useApp();
  const isTeacher = role === 'teacher';
  const myClass = teacherClassFilter ?? (isTeacher ? user?.className : null);

  const classList = useMemo(
    () => (classes ?? []).map(c => c.name ?? c.id).filter(Boolean).sort(compareClassNames),
    [classes],
  );
  const [selClass, setSelClass] = useState(() => myClass ?? classList[0] ?? '');
  const [selDate, setSelDate] = useState(todayISO());
  const [openId, setOpenId] = useState(null);
  const [filter, setFilter] = useState('all');
  const [bandOverride, setBandOverride] = useState({});   // { [studentId]: bandKey }

  const cls = myClass ?? selClass;

  const rows = useMemo(() => {
    return (students ?? [])
      .filter(s => s.className === cls && !String(s.name ?? '').startsWith('(ว่าง)') && (s.status ?? 'ปกติ') !== 'นอกระบบ')
      .sort(compareStudents)
      .map(s => {
        const { months, estimated } = ageInMonths(s, selDate);
        const autoBand = bandForMonths(months);
        const band = DSPM_BANDS.find(b => b.key === bandOverride[s.id]) ?? autoBand ?? DSPM_BANDS[0];
        const rec = s.dspm?.[band.key] ?? {};
        return { s, months, estimated, autoBand, band, rec, sum: summarizeBand(rec) };
      });
  }, [students, cls, selDate, bandOverride]);

  const stat = useMemo(() => {
    const c = { total: rows.length, none: 0, partial: 0, pass: 0, follow: 0 };
    const byDomain = Object.fromEntries(DSPM_DOMAINS.map(d => [d.key, 0]));
    rows.forEach(r => {
      c[r.sum.status] += 1;
      r.sum.failed.forEach(k => { byDomain[k] += 1; });
    });
    return { ...c, byDomain };
  }, [rows]);

  const shown = rows.filter(r => filter === 'all' || (filter === 'none' ? (r.sum.status === 'none' || r.sum.status === 'partial') : r.sum.status === filter));

  function patchRec(studentId, bandKey, patch) {
    setStudents(prev => prev.map(s => s.id !== studentId ? s : {
      ...s,
      dspm: { ...(s.dspm ?? {}), [bandKey]: { ...(s.dspm?.[bandKey] ?? {}), ...patch, date: selDate } },
    }));
  }
  function setResult(r, domKey, val) {
    patchRec(r.s.id, r.band.key, { [domKey]: r.rec[domKey] === val ? '' : val });
  }
  function allPass(r) {
    patchRec(r.s.id, r.band.key, Object.fromEntries(DSPM_DOMAINS.map(d => [d.key, 'pass'])));
  }
  function clearRec(r) {
    if (!window.confirm(`ล้างผลคัดกรองของ ${r.s.name} (${r.band.label})?`)) return;
    setStudents(prev => prev.map(s => {
      if (s.id !== r.s.id) return s;
      const next = { ...(s.dspm ?? {}) };
      delete next[r.band.key];
      return { ...s, dspm: next };
    }));
  }

  const chip = (active, color = '#4f46e5') => ({
    padding: '.35rem .8rem', borderRadius: '999px', fontSize: '.78rem', fontWeight: 700, cursor: 'pointer',
    border: `1.5px solid ${active ? color : '#e5e7eb'}`, background: active ? color : '#fff', color: active ? '#fff' : '#374151',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* หัวเรื่อง + ตัวเลือก */}
      <div style={{ ...card, padding: '1.1rem 1.25rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#111827' }}>🧩 คัดกรองพัฒนาการ DSPM</h3>
        <p style={{ margin: '.35rem 0 .9rem', fontSize: '.8rem', color: '#6b7280', lineHeight: 1.5 }}>
          เฝ้าระวังพัฒนาการ 5 ด้านตามช่วงอายุ (GM · FM · RL · EL · PS) — ติ๊ก "ผ่าน" เมื่อเด็กทำได้ และ "ไม่ผ่าน" เมื่อทำไม่ได้
          ระบบเลือกช่วงอายุให้อัตโนมัติจากวันเกิด ณ วันที่ประเมิน (เปลี่ยนช่วงอายุเองได้)
        </p>
        <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {myClass ? (
            <span style={{ fontWeight: 700, fontSize: '.85rem', color: '#4f46e5' }}>ห้อง {myClass}</span>
          ) : (
            <select value={selClass} onChange={e => { setSelClass(e.target.value); setOpenId(null); }}
              style={{ padding: '.45rem .7rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '.85rem' }}>
              {classList.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          )}
          <label style={{ fontSize: '.8rem', color: '#374151', display: 'flex', alignItems: 'center', gap: '.4rem' }}>
            วันที่ประเมิน
            <input type="date" value={selDate} onChange={e => setSelDate(e.target.value || todayISO())}
              style={{ padding: '.4rem .6rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '.85rem' }} />
          </label>
        </div>
      </div>

      {/* สรุปห้อง */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: '.6rem' }}>
        {[
          { k: 'total', label: 'นักเรียนทั้งหมด', v: stat.total, bg: '#eef2ff', color: '#3730a3' },
          { k: 'pass', label: 'ผ่านทุกด้าน', v: stat.pass, bg: STATUS.pass.bg, color: STATUS.pass.color },
          { k: 'follow', label: 'ต้องส่งเสริม/ติดตาม', v: stat.follow, bg: STATUS.follow.bg, color: STATUS.follow.color },
          { k: 'none', label: 'ยังไม่ครบ/ไม่ได้ประเมิน', v: stat.none + stat.partial, bg: STATUS.none.bg, color: STATUS.none.color },
        ].map(x => (
          <div key={x.k} style={{ background: x.bg, color: x.color, borderRadius: '12px', padding: '.7rem .9rem' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{x.v}</div>
            <div style={{ fontSize: '.72rem', fontWeight: 700 }}>{x.label}</div>
          </div>
        ))}
      </div>

      {stat.follow > 0 && (
        <div style={{ ...card, padding: '.8rem 1rem', display: 'flex', gap: '.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '.78rem', fontWeight: 700, color: '#991b1b' }}>จำนวนเด็กที่ไม่ผ่านแต่ละด้าน:</span>
          {DSPM_DOMAINS.map(d => (
            <span key={d.key} style={{ padding: '.2rem .6rem', borderRadius: '999px', background: d.bg, color: d.color, fontSize: '.75rem', fontWeight: 700 }}>
              {d.key} {stat.byDomain[d.key]}
            </span>
          ))}
        </div>
      )}

      {/* ตัวกรอง */}
      <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
        <button type="button" style={chip(filter === 'all')} onClick={() => setFilter('all')}>ทั้งหมด ({stat.total})</button>
        <button type="button" style={chip(filter === 'follow', '#dc2626')} onClick={() => setFilter('follow')}>ต้องติดตาม ({stat.follow})</button>
        <button type="button" style={chip(filter === 'none', '#6b7280')} onClick={() => setFilter('none')}>ยังไม่ครบ ({stat.none + stat.partial})</button>
        <button type="button" style={chip(filter === 'pass', '#059669')} onClick={() => setFilter('pass')}>ผ่านทุกด้าน ({stat.pass})</button>
      </div>

      {/* รายชื่อ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.55rem' }}>
        {shown.length === 0 && (
          <div style={{ ...card, padding: '2rem 1rem', textAlign: 'center', color: '#9ca3af', fontSize: '.85rem' }}>
            {rows.length === 0 ? 'ไม่พบนักเรียนในห้องนี้' : 'ไม่มีรายการในตัวกรองนี้'}
          </div>
        )}
        {shown.map(r => {
          const open = openId === r.s.id;
          const st = STATUS[r.sum.status];
          return (
            <div key={r.s.id} style={{ ...card, overflow: 'hidden', borderColor: open ? '#a5b4fc' : '#e5e7eb' }}>
              <button type="button" onClick={() => setOpenId(open ? null : r.s.id)}
                style={{ width: '100%', textAlign: 'left', background: open ? '#eef2ff' : '#fff', border: 'none', cursor: 'pointer',
                  padding: '.75rem 1rem', display: 'flex', alignItems: 'center', gap: '.75rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '150px' }}>
                  <div style={{ fontWeight: 700, fontSize: '.9rem', color: '#111827' }}>{r.s.name}</div>
                  <div style={{ fontSize: '.74rem', color: '#6b7280' }}>
                    {ageText(r.months)}{r.months != null ? ` (${r.months} เดือน)` : ''}{r.estimated ? ' · ประมาณจากอายุปี' : ''} · {r.band.label}{r.band.keyAge ? ' 📍' : ''}
                  </div>
                </div>
                <span style={{ padding: '.25rem .7rem', borderRadius: '999px', background: st.bg, color: st.color, fontSize: '.74rem', fontWeight: 700 }}>
                  {st.label}{r.sum.status === 'follow' ? ` (${r.sum.failed.join(', ')})` : r.sum.status === 'partial' ? ` ${r.sum.done}/5` : ''}
                </span>
                <span style={{ color: '#9ca3af', transform: open ? 'rotate(180deg)' : 'none' }}>▾</span>
              </button>

              {open && (
                <div style={{ padding: '.9rem 1rem 1rem', borderTop: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
                  <div style={{ display: 'flex', gap: '.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <label style={{ fontSize: '.78rem', color: '#374151', display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                      ช่วงอายุที่ประเมิน
                      <select value={r.band.key}
                        onChange={e => setBandOverride(o => ({ ...o, [r.s.id]: e.target.value }))}
                        style={{ padding: '.35rem .5rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '.8rem' }}>
                        {DSPM_BANDS.map(b => (
                          <option key={b.key} value={b.key}>{b.label}{b.key === r.autoBand?.key ? ' (ตามอายุ)' : ''}</option>
                        ))}
                      </select>
                    </label>
                    <span style={{ fontSize: '.74rem', color: '#6b7280' }}>{r.band.ageText}</span>
                    {r.rec.date && <span style={{ fontSize: '.74rem', color: '#6b7280' }}>· บันทึกล่าสุด {r.rec.date}</span>}
                    <span style={{ flex: 1 }} />
                    <button type="button" onClick={() => allPass(r)}
                      style={{ padding: '.35rem .8rem', borderRadius: '8px', border: 'none', background: '#d1fae5', color: '#065f46', fontWeight: 700, fontSize: '.76rem', cursor: 'pointer' }}>
                      ✓ ผ่านทุกด้าน
                    </button>
                    <button type="button" onClick={() => clearRec(r)}
                      style={{ padding: '.35rem .8rem', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#fff', color: '#6b7280', fontWeight: 600, fontSize: '.76rem', cursor: 'pointer' }}>
                      ล้างผล
                    </button>
                  </div>

                  {DSPM_DOMAINS.map(d => {
                    const v = r.rec[d.key] ?? '';
                    return (
                      <div key={d.key} style={{ display: 'flex', alignItems: 'center', gap: '.7rem', flexWrap: 'wrap',
                        background: d.bg, borderRadius: '10px', padding: '.55rem .75rem' }}>
                        <div style={{ minWidth: '34px', fontWeight: 800, color: d.color, fontSize: '.85rem' }}>{d.key}</div>
                        <div style={{ flex: 1, minWidth: '180px' }}>
                          <div style={{ fontSize: '.82rem', color: '#111827', lineHeight: 1.45 }}>{r.band.items[d.key]}</div>
                          <div style={{ fontSize: '.68rem', color: d.color, opacity: .85 }}>{d.th} · {d.en}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '.4rem' }}>
                          <button type="button" onClick={() => setResult(r, d.key, 'pass')}
                            style={{ padding: '.4rem .85rem', borderRadius: '8px', fontWeight: 700, fontSize: '.78rem', cursor: 'pointer',
                              border: `1.5px solid ${v === 'pass' ? '#059669' : '#d1d5db'}`,
                              background: v === 'pass' ? '#059669' : '#fff', color: v === 'pass' ? '#fff' : '#374151' }}>
                            ผ่าน
                          </button>
                          <button type="button" onClick={() => setResult(r, d.key, 'fail')}
                            style={{ padding: '.4rem .85rem', borderRadius: '8px', fontWeight: 700, fontSize: '.78rem', cursor: 'pointer',
                              border: `1.5px solid ${v === 'fail' ? '#dc2626' : '#d1d5db'}`,
                              background: v === 'fail' ? '#dc2626' : '#fff', color: v === 'fail' ? '#fff' : '#374151' }}>
                            ไม่ผ่าน
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {r.sum.status === 'follow' && (
                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: '10px', padding: '.55rem .8rem', fontSize: '.78rem', lineHeight: 1.5 }}>
                      ไม่ผ่านด้าน {r.sum.failed.join(', ')} — ควรส่งเสริมพัฒนาการด้านนี้และติดตามประเมินซ้ำ หากยังไม่ผ่านให้ปรึกษาเจ้าหน้าที่สาธารณสุข
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ fontSize: '.72rem', color: '#9ca3af', lineHeight: 1.5 }}>
        ที่มา: แบบบันทึกการเฝ้าระวังและส่งเสริมพัฒนาการเด็กปฐมวัย ตามคู่มือ DSPM (พิมพ์ สิงหาคม 2568) — 📍 = ช่วงอายุที่ใช้คัดกรองโดยเจ้าหน้าที่สาธารณสุข
        ระบบนี้เป็นเครื่องมือเฝ้าระวังเบื้องต้นของครู ไม่ใช่การวินิจฉัย
      </div>
    </div>
  );
}
