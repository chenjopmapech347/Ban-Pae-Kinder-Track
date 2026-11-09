import { useState, useRef } from 'react';
import { compareClassNames } from '../../utils/helpers';
import { useApp } from '../../context/AppContext';
import Modal, { ModalCancelBtn, ModalConfirmBtn } from '../Modal';
import { ui } from '../../ui/ui';
import { parseCsvRows, downloadCsv } from '../../utils/csv';

function PinCell({ pin }) {
  const [show, setShow] = useState(false);
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:'.3rem' }}>
      <code style={{ background:'#f5f3ff', padding:'.1rem .4rem', borderRadius:'5px', fontSize:'.8rem', letterSpacing: show ? '0' : '.15em' }}>
        {show ? pin : '••••••'}
      </code>
      <button type="button" onClick={() => setShow(s => !s)}
        style={{ background:'none', border:'none', cursor:'pointer', fontSize:'.85rem', color:'#7c3aed', padding:0 }}>
        {show ? '🙈' : '👁️'}
      </button>
    </span>
  );
}

// ── CSV ครู ──────────────────────────────────────────────────────────────
// หัวตารางที่ส่งออก (ไม่รวมรหัสผ่าน เพื่อความปลอดภัย — ตอนนำเข้ามีคอลัมน์ "รหัสผ่าน (PIN)" ได้ถ้าต้องการตั้งให้)
const CSV_HEADERS = ['ชื่อ', 'นามสกุล', 'ตำแหน่ง', 'ระดับชั้น', 'ห้องเรียน', 'E-mail', 'เบอร์โทร', 'Username', 'LINE', 'Facebook', 'Instagram', 'TikTok', 'YouTube'];

// ชื่อคอลัมน์ที่รองรับ (ตัวพิมพ์เล็ก) → key ในข้อมูลครู
const CSV_ALIASES = {
  firstName: ['ชื่อ', 'firstname', 'first name'],
  lastName:  ['นามสกุล', 'lastname', 'last name'],
  name:      ['ชื่อ-นามสกุล', 'ชื่อ-สกุล', 'name', 'fullname'],
  position:  ['ตำแหน่ง', 'position'],
  level:     ['ระดับชั้น', 'ระดับ', 'level'],
  className: ['ห้องเรียน', 'ห้อง', 'classname', 'class'],
  email:     ['e-mail', 'email', 'อีเมล'],
  phone:     ['เบอร์โทร', 'เบอร์โทรศัพท์', 'โทรศัพท์', 'phone'],
  username:  ['username', 'ชื่อผู้ใช้'],
  pin:       ['รหัสผ่าน (pin)', 'รหัสผ่าน', 'pin', 'password'],
  line:      ['line'],
  facebook:  ['facebook'],
  instagram: ['instagram'],
  tiktok:    ['tiktok'],
  youtube:   ['youtube'],
};

function splitThaiName(full) {
  const parts = String(full ?? '').trim().split(/\s+/);
  return { firstName: parts[0] ?? '', lastName: parts.slice(1).join(' ') };
}

function normalizeLevel(raw, className) {
  const v = String(raw ?? '').trim().toUpperCase();
  if (['K1', 'K2', 'K3'].includes(v)) return v;
  const m = v.match(/([123])/) ?? String(className ?? '').match(/อ\.?\s*([123])/);
  return m ? `K${m[1]}` : 'K1';
}

// CLASS_OPTIONS ดึงจาก classMap ใน AppContext (dynamic)

const POSITION_OPTIONS = [
  'ครูผู้ช่วย',
  'ผู้ช่วยครูผู้ช่วย',
  'ครู',
  'ครูชำนาญการ',
  'ครูชำนาญการพิเศษ',
  'ครูเชี่ยวชาญ',
  'ครูเชี่ยวชาญพิเศษ',
  'ครูอัตราจ้าง',
  'ครูพี่เลี้ยง',
  'ผู้ดูแลเด็ก',
  'พนักงานจ้าง',
  'อื่นๆ',
];

// รายการ tab ทั้งหมดใน TeacherDashboard แยกตามกลุ่ม
const TEACHER_TAB_GROUPS = [
  {
    label: 'ทั่วไป',
    tabs: [
      { id: 'main',            label: '🏠 หน้าหลัก' },
      { id: 'students',        label: '👨‍🎓 นักเรียน' },
      { id: 'pins',            label: '🔑 PIN ผู้ปกครอง' },
      { id: 'teacherannounce', label: '📢 ประกาศ' },
      { id: 'aichat',          label: '🤖 AI ผู้ช่วย' },
    ],
  },
  {
    label: 'บันทึกประจำวัน',
    tabs: [
      { id: 'overview',     label: '📊 ภาพรวมวันนี้' },
      { id: 'attendance',   label: '✅ การมาเรียน' },
      { id: 'healthcheck',  label: '🏥 ตรวจสุขภาพ' },
      { id: 'illnesscheck', label: '🤒 คัดกรองอาการป่วย' },
      { id: 'milk',         label: '🥛 ดื่มนม' },
      { id: 'dailyroutine', label: '🗓️ กิจกรรมประจำวัน' },
      { id: 'lunch',        label: '🍱 อาหารกลางวัน' },
      { id: 'toothbrush',   label: '🪥 แปรงฟัน' },
    ],
  },
  {
    label: 'บันทึกประจำสัปดาห์',
    tabs: [
      { id: 'innercorner', label: '🏡 มุมประสบการณ์ในห้อง' },
      { id: 'corner',      label: '🌿 แหล่งเรียนรู้นอกห้อง' },
    ],
  },
  {
    label: 'สุขภาพ & กิจกรรม',
    tabs: [
      { id: 'nutrition',    label: '⚖️ ภาวะโภชนาการ' },
      { id: 'specialevent', label: '🎉 กิจกรรมวันสำคัญ' },
    ],
  },
  {
    label: 'ประเมิน',
    tabs: [
      { id: 'evaluation',    label: '✏️ ประเมินพัฒนาการ' },
      { id: 'abilityassess', label: '🎯 ประเมินความสามารถผู้เรียนหลักสูตร 2568' },
      { id: 'activitylog',   label: '📜 ประวัติการประเมิน' },
      { id: 'devreport',     label: '📑 ผลการประเมินพัฒนาการ' },
      { id: 'formreports',   label: '📄 รายงานสรุป' },
      { id: 'studentreport', label: '📒 สมุดรายงาน อ.01' },
    ],
  },
  {
    label: 'บุคลากรและสื่อ',
    tabs: [
      { id: 'media',       label: '📚 ทะเบียนผลิตสื่อ' },
      { id: 'mediaborrow', label: '🔄 รายการยืม-คืนสื่อ' },
      { id: 'profile',     label: '👤 โปรไฟล์ของฉัน' },
    ],
  },
  {
    label: 'มาตรฐาน',
    tabs: [
      { id: 'std2self',    label: '👩‍🏫 มาตรฐานที่ 2' },
      { id: 'standards',   label: '🗺️ มาตรฐานปฐมวัย' },
      { id: 'nationalstd', label: '🏛 มาตรฐานแห่งชาติ' },
    ],
  },
  {
    label: 'อื่นๆ',
    tabs: [
      { id: 'help', label: '📖 คู่มือการใช้งาน' },
    ],
  },
];

// Modal จัดการเมนูของครูแต่ละคน
function MenuPermModal({ teacher, permissions, onSave, onClose }) {
  // permissions = { [tabId]: false } — เฉพาะที่ซ่อน (ไม่มี key = แสดง)
  const [draft, setDraft] = useState(permissions ?? {});

  const isEnabled = (id) => draft[id] !== false;
  const toggle = (id) => {
    setDraft(prev => {
      const next = { ...prev };
      if (next[id] === false) {
        delete next[id]; // ลบ key = กลับมาแสดง
      } else {
        next[id] = false; // ซ่อน
      }
      return next;
    });
  };

  const enabledCount = TEACHER_TAB_GROUPS.reduce((n, g) => n + g.tabs.filter(t => draft[t.id] !== false).length, 0);
  const totalCount   = TEACHER_TAB_GROUPS.reduce((n, g) => n + g.tabs.length, 0);

  return (
    <Modal isOpen onClose={onClose} title={`จัดการเมนู — ${teacher.name}`} subtitle={`แสดง ${enabledCount}/${totalCount} เมนู`} size="lg">
      <div style={{ padding: '1rem 1.25rem', overflowY: 'auto', maxHeight: '60vh', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {TEACHER_TAB_GROUPS.map(group => (
          <div key={group.label}>
            <div style={{ fontSize: '.72rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.4rem' }}>
              {group.label}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '.35rem' }}>
              {group.tabs.map(tab => {
                const on = isEnabled(tab.id);
                return (
                  <label key={tab.id} style={{
                    display: 'flex', alignItems: 'center', gap: '.55rem',
                    padding: '.4rem .7rem', borderRadius: '8px', cursor: 'pointer',
                    background: on ? '#f0fdf4' : '#f9fafb',
                    border: `1.5px solid ${on ? '#86efac' : '#e5e7eb'}`,
                    transition: 'all .15s',
                  }}>
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => toggle(tab.id)}
                      style={{ accentColor: '#059669', width: '15px', height: '15px', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '.83rem', fontWeight: on ? 600 : 400, color: on ? '#065f46' : '#9ca3af' }}>
                      {tab.label}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div style={{ padding: '.75rem 1.25rem', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          type="button"
          onClick={() => setDraft({})}
          style={{ fontSize: '.82rem', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
        >
          เปิดทั้งหมด
        </button>
        <div style={{ display: 'flex', gap: '.5rem' }}>
          <ModalCancelBtn onClick={onClose} />
          <ModalConfirmBtn label="💾 บันทึก" onClick={() => onSave(draft)} />
        </div>
      </div>
    </Modal>
  );
}

export default function TeachersTab() {
  const { teachers, setTeachers, deleteTeacherAndSync, classMap, allClassNames, addSystemLog, user,
          menuPermissions, setMenuPermissions } = useApp();
  const fileRef = useRef(null);
  const CLASS_OPTIONS = classMap; // dynamic จาก AppContext (ใช้สำหรับ auto-default เมื่อเปลี่ยน level)
  const [isModal, setIsModal]       = useState(false);
  const [editing, setEditing]       = useState(null);
  const [form, setForm]             = useState({});
  const [menuTarget, setMenuTarget] = useState(null); // teacher ที่กำลังแก้ไข menuPerm

  const openNew  = () => {
    setEditing(null);
    setForm({ firstName:'', lastName:'', position:'', level:'K1', className: allClassNames?.[0] ?? CLASS_OPTIONS?.K1?.[0] ?? '', email:'', phone:'', line:'', facebook:'', instagram:'', tiktok:'', youtube:'' });
    setIsModal(true);
  };
  const openEdit = t => { setEditing(t); setForm(t); setIsModal(true); };

  const handleLevelChange = lv => {
    setForm(f => ({ ...f, level: lv }));
  };

  const handleSave = e => {
    e.preventDefault();
    const displayName = [form.firstName, form.lastName].filter(Boolean).join(' ');
    const saved = { ...form, name: displayName || form.name || '' };
    if (editing) {
      setTeachers(teachers.map(t => t.id === editing.id ? { ...t, ...saved } : t));
      addSystemLog?.('edit_teacher', `แก้ไขข้อมูลครู: ${saved.name}`, user?.name ?? 'admin');
    } else {
      setTeachers([...teachers, { ...saved, id: Date.now(), status: 'Active' }]);
      addSystemLog?.('add_teacher', `เพิ่มครูใหม่: ${saved.name} — ${saved.className ?? ''}`, user?.name ?? 'admin');
    }
    setIsModal(false);
  };

  // ── ส่งออก CSV ──
  const handleExportCsv = () => {
    const rows = [CSV_HEADERS, ...teachers.map(t => {
      const nm = (t.firstName || t.lastName) ? { firstName: t.firstName ?? '', lastName: t.lastName ?? '' } : splitThaiName(t.name);
      return [nm.firstName, nm.lastName, t.position ?? '', t.level ?? '', t.className ?? '', t.email ?? '', t.phone ?? '',
              t.username ?? '', t.line ?? '', t.facebook ?? '', t.instagram ?? '', t.tiktok ?? '', t.youtube ?? ''];
    })];
    downloadCsv(`teachers_${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  // ── นำเข้า CSV ── (ถ้า Username/E-mail ตรงกับครูเดิม = อัปเดต, ไม่ตรง = เพิ่มใหม่)
  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const rows = parseCsvRows(ev.target.result);
      if (rows.length < 2) { alert('ไฟล์ไม่มีข้อมูล (ต้องมีหัวตาราง และอย่างน้อย 1 แถว)'); return; }
      const header = rows[0].map(h => h.toLowerCase().trim());
      const hasLast = header.some(h => CSV_ALIASES.lastName.includes(h));
      const col = {};
      Object.entries(CSV_ALIASES).forEach(([key, names]) => {
        col[key] = header.findIndex(h => names.includes(h));
      });
      // ถ้ามีคอลัมน์ "นามสกุล" ให้ "ชื่อ" เป็นชื่อจริง ไม่ใช่ชื่อเต็ม
      if (!hasLast && col.name < 0) { col.name = col.firstName; col.firstName = -1; }
      if (col.name < 0 && col.firstName < 0) {
        alert('ไม่พบคอลัมน์ "ชื่อ" — กรุณาใช้ไฟล์ที่ส่งออกจากระบบเป็นแม่แบบ');
        return;
      }
      const get = (r, k) => (col[k] >= 0 ? (r[col[k]] ?? '').trim() : '');

      let list = [...teachers];
      let added = 0, updated = 0;
      const problems = [];
      const stamp = Date.now();
      rows.slice(1).forEach((r, i) => {
        const line = i + 2;
        let firstName = get(r, 'firstName'), lastName = get(r, 'lastName');
        let name = get(r, 'name');
        if (!name) name = [firstName, lastName].filter(Boolean).join(' ');
        if (!name) { problems.push(`แถว ${line}: ไม่มีชื่อ`); return; }
        if (!firstName && !lastName) ({ firstName, lastName } = splitThaiName(name));

        const username = get(r, 'username').toLowerCase().replace(/\s/g, '');
        const email = get(r, 'email');
        const className = get(r, 'className');
        const incoming = {
          name, firstName, lastName,
          position: get(r, 'position'),
          className,
          level: normalizeLevel(get(r, 'level'), className),
          email, phone: get(r, 'phone'),
          line: get(r, 'line'), facebook: get(r, 'facebook'), instagram: get(r, 'instagram'),
          tiktok: get(r, 'tiktok'), youtube: get(r, 'youtube'),
        };
        const pin = get(r, 'pin');

        const idx = list.findIndex(t =>
          (username && t.username?.toLowerCase() === username) ||
          (email && t.email?.toLowerCase() === email.toLowerCase()));
        if (idx >= 0) {
          // อัปเดต: เฉพาะช่องที่ใน CSV มีค่า (ช่องว่าง = คงค่าเดิม) และไม่เปลี่ยน PIN ถ้าไม่ได้ใส่มา
          const merged = { ...list[idx] };
          Object.entries(incoming).forEach(([k, v]) => { if (v) merged[k] = v; });
          if (username) merged.username = username;
          if (pin) merged.pin = pin;
          list[idx] = merged;
          updated++;
        } else {
          list.push({
            ...incoming,
            id: stamp + i,
            status: 'Active',
            username: username || (email ? email.split('@')[0].toLowerCase().replace(/\s/g, '') : ''),
            pin: pin || String(Math.floor(100000 + Math.random() * 900000)),
          });
          added++;
        }
      });

      if (!added && !updated) { alert('ไม่มีรายการที่นำเข้าได้\n' + problems.slice(0, 8).join('\n')); return; }
      const msg = `พบ ${added + updated} รายการ — เพิ่มใหม่ ${added}, อัปเดตครูเดิม ${updated}` +
        (problems.length ? `\nข้าม ${problems.length} แถว:\n${problems.slice(0, 5).join('\n')}` : '') +
        (added ? '\n\n(ครูที่เพิ่มใหม่โดยไม่ระบุรหัสผ่านจะได้รหัส 6 หลักสุ่ม ดูได้ในคอลัมน์ "รหัสผ่าน")' : '') +
        '\n\nยืนยันนำเข้า?';
      if (!window.confirm(msg)) return;
      setTeachers(list);
      addSystemLog?.('import_teachers', `นำเข้าครูจาก CSV: เพิ่ม ${added}, อัปเดต ${updated}`, user?.name ?? 'admin');
    };
    reader.readAsText(file, 'UTF-8');
  };

  // ── ลบครู (ยืนยัน + บันทึกขึ้นระบบทันที) ──
  const handleDelete = async (t) => {
    if (!window.confirm(`ลบ "${t.name}" ออกจากระบบ?`)) return;
    const result = await deleteTeacherAndSync(t.id);
    addSystemLog?.('delete_teacher', `ลบครู: ${t.name}`, user?.name ?? 'admin');
    if (!result.ok) {
      alert(`ลบในเครื่องนี้แล้ว แต่ยังบันทึกขึ้นระบบไม่สำเร็จ\n(${result.message ?? 'ไม่ทราบสาเหตุ'})\n\nกรุณากดปุ่ม "บันทึก" ด้านบนซ้ำ ไม่เช่นนั้นรายชื่อจะกลับมาเมื่อโหลดหน้าใหม่`);
    }
  };

  const handleSaveMenuPerm = (draft) => {
    const uid = String(menuTarget.id);
    setMenuPermissions(prev => ({ ...prev, [uid]: draft }));
    addSystemLog?.('menu_perm', `แก้ไขเมนู: ${menuTarget.name}`, user?.name ?? 'admin');
    setMenuTarget(null);
  };

  // นับเมนูที่ซ่อนต่อ user
  const hiddenCount = (t) => {
    const perm = menuPermissions?.[String(t.id)] ?? {};
    return Object.values(perm).filter(v => v === false).length;
  };

  return (
    <div {...ui('glass p-6 animate-fade')}>
      <div {...ui('page-header mb-6')}>
        <h3>จัดการรายชื่อคุณครู</h3>
        <div {...ui('flex gap-2')}>
          <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={handleImportFile} style={{ display: 'none' }} />
          <button {...ui('btn', { background: '#f0f9ff' })} onClick={() => fileRef.current?.click()}
            title="นำเข้ารายชื่อครูจากไฟล์ CSV (ใช้ไฟล์ที่ส่งออกจากระบบเป็นแม่แบบ)">📥 นำเข้า CSV</button>
          <button {...ui('btn', { background: '#f0fdf4' })} onClick={handleExportCsv}
            title="ส่งออกรายชื่อครูเป็นไฟล์ CSV (ไม่รวมรหัสผ่าน)">📤 ส่งออก CSV</button>
          <button {...ui('btn btn-primary')} onClick={openNew}>+ เพิ่มคุณครู</button>
        </div>
      </div>

      <div {...ui('table-wrap', { overflowX: 'auto' })}>
        <table {...ui('table', { minWidth: '900px' })}>
          <thead>
            <tr>
              <th>ชื่อ-นามสกุล</th>
              <th>ระดับชั้น</th>
              <th>ห้องเรียน</th>
              <th>Username</th>
              <th>รหัสผ่าน</th>
              <th>เบอร์โทร</th>
              <th>สถานะ</th>
              <th style={{ position:'sticky', right:0, background:'#f5f3ff', zIndex:2, boxShadow:'-2px 0 6px rgba(0,0,0,0.06)' }}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {[...teachers].sort((a, b) => compareClassNames(a.className, b.className) || (a.name || '').localeCompare(b.name || '', 'th')).map(t => (
              <tr key={t.id} {...ui('hover-row')}>
                <td>
                  <div {...ui('font-bold')}>{t.name}</div>
                  {t.position && <div style={{ fontSize:'.78rem', color:'#7c3aed', fontWeight:600 }}>{t.position}</div>}
                  {t.email && <div style={{ fontSize:'.78rem', color:'#6b7280' }}>{t.email}</div>}
                </td>
                <td><span {...ui('badge badge-' + t.level.toLowerCase())}>{t.level}</span></td>
                <td>
                  {t.className
                    ? <span style={{ fontWeight: 700, color: 'var(--primary)', background: '#ede9fe', borderRadius: '6px', padding: '.15rem .55rem', fontSize: '.82rem' }}>{t.className}</span>
                    : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                </td>
                <td>
                  <code style={{ background:'#f0f9ff', padding:'.1rem .4rem', borderRadius:'5px', fontSize:'.8rem', color:'#0369a1' }}>
                    {t.username ?? '—'}
                  </code>
                </td>
                <td>{t.pin ? <PinCell pin={t.pin} /> : <span style={{ color:'var(--text-muted)' }}>—</span>}</td>
                <td style={{ fontSize:'.85rem' }}>{t.phone ?? '—'}</td>
                <td><span {...ui('text-success')}>● {t.status}</span></td>
                <td style={{ position:'sticky', right:0, background:'white', zIndex:1, boxShadow:'-2px 0 6px rgba(0,0,0,0.06)' }}>
                  <div {...ui('row-actions')}>
                    <button {...ui('btn btn-sm')} onClick={() => openEdit(t)}>แก้ไข</button>
                    <button
                      {...ui('btn btn-sm', { background: '#f0fdf4', color: '#065f46', border: '1px solid #86efac', position: 'relative' })}
                      onClick={() => setMenuTarget(t)}
                      title="จัดการเมนูที่มองเห็น"
                    >
                      🗂️ เมนู
                      {hiddenCount(t) > 0 && (
                        <span style={{
                          position: 'absolute', top: '-6px', right: '-6px',
                          background: '#ef4444', color: 'white', borderRadius: '999px',
                          fontSize: '.65rem', fontWeight: 700, minWidth: '16px', height: '16px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px',
                        }}>
                          {hiddenCount(t)}
                        </span>
                      )}
                    </button>
                    <button {...ui('btn btn-sm', { color:'var(--danger)' })}
                      onClick={() => handleDelete(t)}>ลบ</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal แก้ไขข้อมูลครู */}
      <Modal
        isOpen={isModal}
        onClose={() => setIsModal(false)}
        title={editing ? 'แก้ไขข้อมูลครู' : 'เพิ่มคุณครูใหม่'}
        size="lg"
      >
            <form onSubmit={handleSave} style={{ display:'flex',flexDirection:'column',gap:'.85rem' }}>

              {/* ชื่อ + นามสกุล */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.75rem' }}>
                <div>
                  <label style={{ display:'block',marginBottom:'.3rem',fontWeight:600,fontSize:'.85rem' }}>ชื่อ *</label>
                  <input {...ui('input')} required
                    value={form.firstName ?? (editing ? '' : '')}
                    onChange={e => setForm({ ...form, firstName: e.target.value })} />
                </div>
                <div>
                  <label style={{ display:'block',marginBottom:'.3rem',fontWeight:600,fontSize:'.85rem' }}>นามสกุล *</label>
                  <input {...ui('input')} required
                    value={form.lastName ?? ''}
                    onChange={e => setForm({ ...form, lastName: e.target.value })} />
                </div>
              </div>

              {/* ตำแหน่ง */}
              <div>
                <label style={{ display:'block',marginBottom:'.3rem',fontWeight:600,fontSize:'.85rem' }}>ตำแหน่ง</label>
                <select {...ui('input')} value={form.position ?? ''} onChange={e => setForm({ ...form, position: e.target.value })}>
                  <option value="">— เลือกตำแหน่ง —</option>
                  {POSITION_OPTIONS.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              {/* ระดับชั้น + ห้องเรียน */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.75rem' }}>
                <div>
                  <label style={{ display:'block',marginBottom:'.3rem',fontWeight:600,fontSize:'.85rem' }}>ระดับชั้น</label>
                  <select {...ui('input')} value={form.level||'K1'} onChange={e => handleLevelChange(e.target.value)}>
                    <option value="K1">อนุบาล 1 (K1)</option>
                    <option value="K2">อนุบาล 2 (K2)</option>
                    <option value="K3">อนุบาล 3 (K3)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display:'block',marginBottom:'.3rem',fontWeight:600,fontSize:'.85rem' }}>ห้องเรียน</label>
                  <select {...ui('input')} value={form.className||''} onChange={e=>setForm({...form,className:e.target.value})}>
                    {(allClassNames ?? []).map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Email */}
              <div>
                <label style={{ display:'block',marginBottom:'.3rem',fontWeight:600,fontSize:'.85rem' }}>E-mail *</label>
                <input {...ui('input')} type="email" required
                  value={form.email ?? ''}
                  onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>

              {/* เบอร์โทร */}
              <div>
                <label style={{ display:'block',marginBottom:'.3rem',fontWeight:600,fontSize:'.85rem' }}>เบอร์โทรศัพท์ *</label>
                <input {...ui('input')} required placeholder="0xx-xxx-xxxx"
                  value={form.phone ?? ''}
                  onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>

              {/* Username + PIN */}
              <div style={{ borderTop:'1.5px solid #e5e7eb', paddingTop:'.75rem' }}>
                <div style={{ fontWeight:700, fontSize:'.8rem', color:'#6b7280', marginBottom:'.6rem' }}>
                  🔐 ข้อมูล Login
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.75rem' }}>
                  <div>
                    <label style={{ display:'block',marginBottom:'.3rem',fontWeight:600,fontSize:'.85rem' }}>Username *</label>
                    <input {...ui('input')} required placeholder="เช่น teacher01"
                      value={form.username ?? ''}
                      onChange={e => setForm({ ...form, username: e.target.value.toLowerCase().replace(/\s/g,'') })} />
                  </div>
                  <div>
                    <label style={{ display:'block',marginBottom:'.3rem',fontWeight:600,fontSize:'.85rem' }}>รหัสผ่าน (PIN) *</label>
                    <input {...ui('input')} required placeholder="เช่น kru01"
                      value={form.pin ?? ''}
                      onChange={e => setForm({ ...form, pin: e.target.value })} />
                  </div>
                </div>
              </div>

              {/* Social — optional */}
              <div style={{ borderTop:'1.5px solid #e5e7eb', paddingTop:'.6rem' }}>
                <div style={{ fontWeight:700,fontSize:'.8rem',color:'#6b7280',marginBottom:'.6rem' }}>
                  📱 ช่องทาง Social (ไม่บังคับ)
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.6rem' }}>
                  {[
                    { key:'line',      label:'LINE',      ph:'@lineId' },
                    { key:'facebook',  label:'Facebook',  ph:'ชื่อเพจ' },
                    { key:'instagram', label:'Instagram', ph:'@username' },
                    { key:'tiktok',    label:'TikTok',    ph:'@username' },
                    { key:'youtube',   label:'YouTube',   ph:'ชื่อช่อง' },
                  ].map(s => (
                    <div key={s.key}>
                      <label style={{ display:'block',marginBottom:'.25rem',fontWeight:600,fontSize:'.8rem' }}>{s.label}</label>
                      <input {...ui('input', { fontSize:'.85rem' })} placeholder={s.ph}
                        value={form[s.key] ?? ''}
                        onChange={e => setForm({ ...form, [s.key]: e.target.value })} />
                    </div>
                  ))}
                </div>
              </div>

              <div {...ui('flex gap-2 mt-2')}>
                <ModalCancelBtn onClick={() => setIsModal(false)} />
                <ModalConfirmBtn type="submit" label="💾 บันทึก" />
              </div>
            </form>
      </Modal>

      {/* Modal จัดการเมนู */}
      {menuTarget && (
        <MenuPermModal
          teacher={menuTarget}
          permissions={menuPermissions?.[String(menuTarget.id)] ?? {}}
          onSave={handleSaveMenuPerm}
          onClose={() => setMenuTarget(null)}
        />
      )}
    </div>
  );
}
