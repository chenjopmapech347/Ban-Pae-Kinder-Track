// MediaTab.jsx — ทะเบียนผลิตสื่อ / นวัตกรรมการเรียนการสอน
import { useState, useMemo } from 'react';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../../lib/firebase';
import { useApp } from '../../context/AppContext';

// ── ประเภทการนำไปใช้ประกอบการสอน ──────────────────────────────────────────
const CTX_OPTS = [
  { key: 'ctxExperience', label: 'เสริมประสบการณ์' },
  { key: 'ctxGame',       label: 'เกมการศึกษา' },
  { key: 'ctxCorner',     label: 'เล่นตามมุม' },
];

const EMPTY_FORM = {
  item:          '',      // ชื่อรายการสื่อ / นวัตกรรม
  // ── ประกอบการสอน (checkboxes) ──
  ctxExperience: false,   // ☑ เสริมประสบการณ์
  ctxGame:       false,   // ☑ เกมการศึกษา
  ctxCorner:     false,   // ☑ เล่นตามมุม
  unitName:      '',      // หน่วยการเรียนรู้ (ข้อความ)
  // ── ประเภทสื่อ ──
  handmade:      false,   // สื่อทำมือ
  ai:            false,   // สื่อ AI
  category:      'ใหม่', // ประเภทสื่อ: เก่า / ใหม่
  note:          '',      // หมายเหตุ
  imageUrl:      '',      // URL จาก Firebase Storage
  imagePath:     '',      // Storage path (สำหรับลบไฟล์)
};

// ── สร้างข้อความ "ประกอบการสอนหน่วย" จาก record ──────────────────────────
function buildCtxText(r) {
  const checks = CTX_OPTS.filter(o => r[o.key]).map(o => `☑ ${o.label}`);
  const unit   = r.unitName ? `หน่วย ${r.unitName}` : '';
  return [...checks, unit].filter(Boolean).join('\n');
}

// ── พิมพ์ทะเบียนสื่อ ────────────────────────────────────────────────────────
function printMediaList(records, cn, schoolName, teacher, academicYear) {
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap');
    *{box-sizing:border-box}
    body{font-family:'Sarabun',sans-serif;font-size:11pt;margin:0;padding:0}
    h2{text-align:center;font-size:14pt;font-weight:800;margin:.2rem 0}
    .sub{text-align:center;font-size:10pt;margin:.15rem 0}
    .info{text-align:center;font-size:10pt;margin:.15rem 0}
    table{width:100%;border-collapse:collapse;margin-top:.6rem;font-size:9.5pt}
    th,td{border:1px solid #555;padding:3px 5px;vertical-align:middle}
    th{background:#ddd;text-align:center;font-weight:700}
    .tc{text-align:center}
    .tl{text-align:left}
    .ctx{font-size:8.5pt;line-height:1.6;vertical-align:top}
    .img-cell{text-align:center;padding:3px}
    .img-cell img{width:60px;height:45px;object-fit:cover;border-radius:4px;border:1px solid #ccc}
    .no-img{color:#aaa;font-size:8pt}
    @media print{@page{margin:1.5cm;size:A4 portrait}body{margin:0}}
  `;
  const rows = records.map((r, i) => `
    <tr>
      <td class="tc">${i + 1}</td>
      <td class="img-cell">${r.imageUrl
        ? `<img src="${r.imageUrl}" alt="${r.item ?? ''}" />`
        : '<span class="no-img">—</span>'}</td>
      <td class="tl">${r.item ?? ''}</td>
      <td class="tl ctx">${buildCtxText(r).replace(/\n/g, '<br/>')}</td>
      <td class="tc">${r.handmade ? '✓' : ''}</td>
      <td class="tc">${r.ai ? '✓' : ''}</td>
      <td class="tc">${r.category === 'เก่า' ? '✓' : ''}</td>
      <td class="tc">${r.category === 'ใหม่' ? '✓' : ''}</td>
      <td class="tl">${r.note ?? ''}</td>
    </tr>`).join('');
  const teacherLine = teacher ? `ชื่อ – สกุล ${teacher.name ?? ''}  ตำแหน่ง ${teacher.position ?? ''}` : '';
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
    <title>ทะเบียนผลิตสื่อ</title><style>${css}</style></head>
    <body>
      <h2>ทะเบียนผลิตสื่อ / นวัตกรรมการเรียนการสอน</h2>
      ${academicYear ? `<div class="sub">ปีการศึกษา ${academicYear}</div>` : ''}
      ${teacherLine   ? `<div class="info">${teacherLine}</div>` : ''}
      ${schoolName    ? `<div class="info">${schoolName}</div>` : ''}
      <table>
        <thead>
          <tr>
            <th rowspan="2" style="width:26px">ที่</th>
            <th rowspan="2" style="width:70px">รูปภาพ</th>
            <th rowspan="2" style="min-width:150px" class="tl">รายการสื่อ/นวัตกรรม</th>
            <th rowspan="2" style="min-width:120px" class="tl">ประกอบการสอนหน่วย</th>
            <th rowspan="2" style="width:52px">สื่อ<br/>ทำมือ</th>
            <th rowspan="2" style="width:46px">สื่อ<br/>AI</th>
            <th colspan="2" style="width:90px">ประเภทสื่อ</th>
            <th rowspan="2" style="min-width:70px" class="tl">หมายเหตุ</th>
          </tr>
          <tr>
            <th style="width:45px">สื่อเก่า</th>
            <th style="width:45px">สื่อใหม่</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <script>setTimeout(()=>window.print(),500)</` + `script>
    </body></html>`;
  const w = window.open('', '_blank', 'width=1000,height=750');
  if (!w) { alert('กรุณาอนุญาต popup'); return; }
  w.document.write(html);
  w.document.close();
}

export default function MediaTab({ teacherClassFilter = null, viewMode = 'entry' }) {
  const { mediaRecords, setMediaRecords, classes, schoolName, academicYear, teachers, user, role } = useApp();
  const isAdmin = role === 'admin';

  const [form, setForm]         = useState(EMPTY_FORM);
  const [editId, setEditId]     = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [imgPreview, setImgPreview] = useState('');
  const [imgFile, setImgFile]   = useState(null);   // File object รอ upload
  const [uploading, setUploading] = useState(false);

  // อัปโหลดรูปไป Firebase Storage → คืน { url, path }
  async function uploadToStorage(file, recordId) {
    const ext  = file.name.split('.').pop();
    const path = `media-images/${recordId}.${ext}`;
    const sRef = ref(storage, path);
    await uploadBytes(sRef, file);
    const url  = await getDownloadURL(sRef);
    return { url, path };
  }

  // ลบรูปจาก Storage (ถ้ามี imagePath)
  async function deleteFromStorage(imagePath) {
    if (!imagePath || !storage) return;
    try { await deleteObject(ref(storage, imagePath)); } catch (_) {}
  }

  function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { alert('รูปภาพต้องมีขนาดไม่เกิน 10MB'); return; }
    setImgFile(file);
    setImgPreview(URL.createObjectURL(file));
  }

  function removeImage() {
    setImgFile(null);
    setImgPreview('');
    setForm(f => ({ ...f, imageUrl: '', imagePath: '' }));
  }
  // '' = แสดงทุกห้อง; ถ้าเป็นครูประจำห้องให้ lock ที่ห้องตัวเอง
  const [selClass, setSelClass] = useState(teacherClassFilter ?? '');

  // สิทธิ์ต่อรายการ: แก้ไขได้ถ้าเป็น admin หรือเป็นเจ้าของ record
  const canEdit   = (r) => isAdmin || r.createdByTeacherId === user?.teacherId;
  const canDelete = ()  => isAdmin;

  const classList = useMemo(() => {
    if (teacherClassFilter) return [teacherClassFilter];
    return (classes ?? []).map(c => c.name ?? c.id).filter(Boolean).sort();
  }, [classes, teacherClassFilter]);

  const cn = selClass || classList[0] || '';

  // ครูประจำห้อง (สำหรับหัวพิมพ์)
  const classTeacher = useMemo(
    () => teachers?.find(t => t.className === cn) ?? null,
    [teachers, cn]
  );

  // helper: ชื่อครูผู้ผลิตจาก id
  const teacherName = (tid) => {
    if (!tid) return '—';
    const t = (teachers ?? []).find(t => String(t.id) === String(tid));
    return t?.name ?? `ครู #${tid}`;
  };

  // แสดงทุกสื่อ (ไม่กรองตามห้อง) เพื่อให้เห็นภาพรวม
  // ถ้ามีการเลือกห้องจาก dropdown → กรองตามห้องนั้น
  const records = useMemo(() =>
    (mediaRecords ?? [])
      .filter(r => !selClass || r.className === selClass)
      .sort((a, b) => a.id - b.id),
    [mediaRecords, selClass]
  );

  async function save() {
    if (!form.item.trim()) return;
    setUploading(true);
    try {
      let imageUrl  = form.imageUrl;
      let imagePath = form.imagePath;

      if (imgFile && storage) {
        // ถ้าแก้ไขและมีรูปเก่า → ลบทิ้งก่อน
        if (editId && form.imagePath) await deleteFromStorage(form.imagePath);
        const id = editId ?? Date.now();
        const result = await uploadToStorage(imgFile, id);
        imageUrl  = result.url;
        imagePath = result.path;
      } else if (!imgFile && !form.imageUrl) {
        // ลบรูปออก — ถ้าเป็น edit และมี path เก่า ลบออกจาก Storage
        if (editId && form.imagePath) await deleteFromStorage(form.imagePath);
        imagePath = '';
      }

      const finalForm = { ...form, imageUrl, imagePath };

      if (editId) {
        setMediaRecords(prev => prev.map(r =>
          r.id === editId ? { ...r, ...finalForm, className: cn } : r
        ));
        setEditId(null);
      } else {
        setMediaRecords(prev => [...(prev ?? []), {
          ...finalForm,
          id: Date.now(),
          className: cn,
          createdByTeacherId: user?.teacherId ?? null,
          createdAt: new Date().toISOString(),
        }]);
      }
      setForm(EMPTY_FORM);
      setImgPreview('');
      setImgFile(null);
      setShowForm(false);
    } catch (err) {
      alert('อัปโหลดรูปภาพไม่สำเร็จ: ' + err.message);
    } finally {
      setUploading(false);
    }
  }

  function startEdit(r) {
    setForm({
      item:          r.item          ?? '',
      ctxExperience: r.ctxExperience ?? false,
      ctxGame:       r.ctxGame       ?? false,
      ctxCorner:     r.ctxCorner     ?? false,
      unitName:      r.unitName      ?? (r.topic ?? ''),
      handmade:      r.handmade      ?? false,
      ai:            r.ai            ?? false,
      category:      r.category      ?? 'ใหม่',
      note:          r.note          ?? '',
      imageUrl:      r.imageUrl      ?? '',
      imagePath:     r.imagePath     ?? '',
    });
    setImgPreview(r.imageUrl ?? '');
    setImgFile(null);
    setEditId(r.id);
    setShowForm(true);
  }

  function cancelForm() {
    setForm(EMPTY_FORM);
    setImgPreview('');
    setImgFile(null);
    setEditId(null);
    setShowForm(false);
  }

  async function del(id) {
    if (!window.confirm('ลบรายการนี้?')) return;
    const r = (mediaRecords ?? []).find(rec => rec.id === id);
    if (r?.imagePath) await deleteFromStorage(r.imagePath);
    setMediaRecords(prev => prev.filter(rec => rec.id !== id));
  }

  const inp = { width: '100%', padding: '.4rem .6rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '.85rem', fontFamily: 'inherit', boxSizing: 'border-box' };
  const lbl = { fontSize: '.78rem', fontWeight: 700, color: '#374151', marginBottom: '.25rem', display: 'block' };
  const cell = { border: '1px solid #e0f2fe', padding: '.4rem .6rem' };

  // ครูที่ใช้แสดงใน print (อาจเป็น teacher user หรือ classTeacher)
  const printTeacher = classTeacher ?? (user?.teacherId ? teachers?.find(t => t.id === user.teacherId) : null);

  return (
    <div className="animate-fade">
      {/* ── Header ── */}
      <div style={{
        background: 'linear-gradient(135deg,#0891b2,#06b6d4)',
        borderRadius: '16px', padding: '1.1rem 1.5rem',
        color: 'white', marginBottom: '1.25rem',
        display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: '.2rem' }}>
            📚 ทะเบียนผลิตสื่อ / นวัตกรรมการเรียนการสอน
          </div>
          <div style={{ opacity: .85, fontSize: '.82rem' }}>
            {viewMode === 'entry' ? 'บันทึกและจัดการรายการสื่อการสอน' : 'รายการสื่อการสอนทั้งหมด'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {!teacherClassFilter && (
            <select value={selClass} onChange={e => setSelClass(e.target.value)}
              style={{ padding: '.35rem .6rem', borderRadius: '8px', border: 'none', fontSize: '.82rem', fontFamily: 'inherit', background: 'rgba(255,255,255,.2)', color: 'white' }}>
              <option value="" style={{ color: '#000' }}>📋 ทุกห้อง</option>
              {classList.map(c => <option key={c} value={c} style={{ color: '#000' }}>{c}</option>)}
            </select>
          )}
          <button type="button" onClick={() => printMediaList(records, cn, schoolName, printTeacher, academicYear)}
            style={{ padding: '.4rem .9rem', borderRadius: '8px', border: '1.5px solid rgba(255,255,255,.5)', background: 'rgba(255,255,255,.15)', color: 'white', fontFamily: 'inherit', fontWeight: 600, fontSize: '.82rem', cursor: 'pointer' }}>
            🖨️ พิมพ์
          </button>
          {/* ครูและ admin เพิ่มรายการได้ */}
          <button type="button" onClick={() => { cancelForm(); setShowForm(true); }}
            style={{ padding: '.4rem .9rem', borderRadius: '8px', border: 'none', background: 'white', color: '#0891b2', fontFamily: 'inherit', fontWeight: 700, fontSize: '.82rem', cursor: 'pointer' }}>
            + เพิ่มรายการ
          </button>
        </div>
      </div>

      {/* ── Add / Edit Form ── */}
      {showForm && viewMode === 'entry' && (
        <div style={{
          background: 'white', borderRadius: '12px', border: '1.5px solid #bae6fd',
          padding: '1.25rem', marginBottom: '1.25rem',
          boxShadow: '0 4px 16px rgba(8,145,178,.1)',
        }}>
          <div style={{ fontWeight: 800, fontSize: '.95rem', color: '#0891b2', marginBottom: '1rem' }}>
            {editId ? '✏️ แก้ไขรายการ' : '➕ เพิ่มรายการสื่อใหม่'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>

            {/* ชื่อสื่อ */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lbl}>รายการสื่อ / นวัตกรรม *</label>
              <input style={inp} placeholder="ชื่อสื่อการสอน..." value={form.item}
                onChange={e => setForm(f => ({ ...f, item: e.target.value }))} />
            </div>

            {/* ประกอบการสอน checkboxes */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lbl}>ประกอบการสอน</label>
              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', padding: '.5rem .75rem', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                {CTX_OPTS.map(o => (
                  <label key={o.key} style={{ display: 'flex', alignItems: 'center', gap: '.4rem', fontSize: '.85rem', fontWeight: 600, cursor: 'pointer' }}>
                    <input type="checkbox" checked={form[o.key]}
                      onChange={e => setForm(f => ({ ...f, [o.key]: e.target.checked }))} />
                    {o.label}
                  </label>
                ))}
              </div>
            </div>

            {/* หน่วยการสอน */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lbl}>หน่วยการเรียนรู้</label>
              <input style={inp} placeholder="เช่น ของเล่นของใช้, รักการอ่าน..." value={form.unitName}
                onChange={e => setForm(f => ({ ...f, unitName: e.target.value }))} />
            </div>

            {/* สื่อทำมือ + AI */}
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', paddingTop: '.3rem', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '.4rem', fontSize: '.85rem', fontWeight: 600, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.handmade}
                  onChange={e => setForm(f => ({ ...f, handmade: e.target.checked }))} />
                🖐️ สื่อทำมือ
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '.4rem', fontSize: '.85rem', fontWeight: 600, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.ai}
                  onChange={e => setForm(f => ({ ...f, ai: e.target.checked }))} />
                🤖 สื่อ AI
              </label>
            </div>

            {/* ประเภทสื่อ */}
            <div>
              <label style={lbl}>ประเภทสื่อ</label>
              <select style={inp} value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                <option value="ใหม่">สื่อใหม่</option>
                <option value="เก่า">สื่อเก่า</option>
              </select>
            </div>

            {/* หมายเหตุ */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lbl}>หมายเหตุ</label>
              <input style={inp} placeholder="หมายเหตุ..." value={form.note}
                onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
            </div>

            {/* รูปภาพ */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lbl}>รูปภาพสื่อ (ไม่เกิน 2MB)</label>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                {imgPreview ? (
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <img src={imgPreview} alt="preview"
                      style={{ width: '120px', height: '90px', objectFit: 'cover', borderRadius: '8px', border: '1.5px solid #bae6fd' }} />
                    <button type="button" onClick={removeImage}
                      style={{ position: 'absolute', top: '-6px', right: '-6px', width: '20px', height: '20px', borderRadius: '50%', border: 'none', background: '#ef4444', color: 'white', cursor: 'pointer', fontSize: '.7rem', lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                      ✕
                    </button>
                  </div>
                ) : (
                  <div style={{ width: '120px', height: '90px', border: '2px dashed #bae6fd', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '.75rem', flexDirection: 'column', gap: '.25rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>🖼️</span>
                    <span>ยังไม่มีรูป</span>
                  </div>
                )}
                <label style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
                  <span style={{ fontSize: '.78rem', color: '#6b7280' }}>เลือกไฟล์รูป</span>
                  <input type="file" accept="image/*"
                    style={{ fontSize: '.8rem', fontFamily: 'inherit' }}
                    onChange={handleImageChange} />
                </label>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button type="button" onClick={cancelForm}
              style={{ padding: '.4rem 1rem', borderRadius: '8px', border: '1.5px solid #d1d5db', background: 'white', fontFamily: 'inherit', fontSize: '.85rem', cursor: 'pointer' }}>
              ยกเลิก
            </button>
            <button type="button" onClick={save} disabled={!form.item.trim() || uploading}
              style={{ padding: '.4rem 1.2rem', borderRadius: '8px', border: 'none', background: (form.item.trim() && !uploading) ? '#0891b2' : '#cbd5e1', color: 'white', fontFamily: 'inherit', fontWeight: 700, fontSize: '.85rem', cursor: (form.item.trim() && !uploading) ? 'pointer' : 'default' }}>
              {uploading ? '⏳ กำลังอัปโหลด...' : editId ? '💾 บันทึกการแก้ไข' : '✅ บันทึก'}
            </button>
          </div>
        </div>
      )}

      {/* ── Table ── */}
      {records.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#9ca3af', fontSize: '.9rem' }}>
          {viewMode === 'entry' ? 'ยังไม่มีรายการสื่อ กด "+ เพิ่มรายการ" เพื่อเริ่มต้น' : 'ยังไม่มีข้อมูลทะเบียนสื่อ'}
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.85rem' }}>
            <thead>
              <tr style={{ background: '#f0f9ff' }}>
                <th style={{ ...cell, width: '36px' }}>ที่</th>
                <th style={{ ...cell, width: '70px' }}>รูปภาพ</th>
                <th style={{ ...cell, textAlign: 'center', minWidth: '180px' }}>รายการสื่อ / นวัตกรรม</th>
                <th style={{ ...cell, textAlign: 'center', minWidth: '120px' }}>ห้อง / ผู้ผลิต</th>
                <th style={{ ...cell, textAlign: 'center', minWidth: '180px' }}>ประกอบการสอนหน่วย</th>
                <th style={{ ...cell, width: '60px' }}>ทำมือ</th>
                <th style={{ ...cell, width: '50px' }}>AI</th>
                <th style={{ ...cell, width: '55px' }}>สื่อเก่า</th>
                <th style={{ ...cell, width: '55px' }}>สื่อใหม่</th>
                <th style={{ ...cell, textAlign: 'center', minWidth: '80px' }}>หมายเหตุ</th>
                {viewMode === 'entry' && (
                  <th style={{ ...cell, width: '80px' }}>จัดการ</th>
                )}
              </tr>
            </thead>
            <tbody>
              {records.map((r, i) => {
                const ctxLines = CTX_OPTS.filter(o => r[o.key]).map(o => `☑ ${o.label}`);
                // backward compat: ถ้ามี topic เก่าให้แสดงด้วย
                const unitDisplay = r.unitName || r.topic || '';
                return (
                  <tr key={r.id} style={{ background: i % 2 === 0 ? 'white' : '#f0f9ff', verticalAlign: 'top' }}>
                    <td style={{ ...cell, textAlign: 'center', color: '#6b7280' }}>{i + 1}</td>
                    <td style={{ ...cell, textAlign: 'center', padding: '.3rem' }}>
                      {r.imageUrl ? (
                        <img src={r.imageUrl} alt={r.item}
                          style={{ width: '56px', height: '42px', objectFit: 'cover', borderRadius: '5px', border: '1px solid #bae6fd', cursor: 'pointer' }}
                          onClick={() => window.open(r.imageUrl, '_blank')} />
                      ) : (
                        <span style={{ color: '#d1d5db', fontSize: '.75rem' }}>—</span>
                      )}
                    </td>
                    <td style={{ ...cell, fontWeight: 600 }}>{r.item}</td>
                    <td style={{ ...cell, fontSize: '.8rem', lineHeight: 1.6 }}>
                      {r.className && (
                        <div style={{ fontWeight: 700, color: '#0891b2', background: '#e0f2fe', borderRadius: '5px', padding: '.1rem .45rem', display: 'inline-block', marginBottom: '.2rem', fontSize: '.75rem' }}>
                          {r.className}
                        </div>
                      )}
                      <div style={{ color: '#374151' }}>{teacherName(r.createdByTeacherId)}</div>
                    </td>
                    <td style={{ ...cell, fontSize: '.8rem', lineHeight: 1.7 }}>
                      {ctxLines.map(l => <div key={l} style={{ color: '#374151' }}>{l}</div>)}
                      {unitDisplay && (
                        <div style={{ color: '#0891b2', fontWeight: 600, marginTop: ctxLines.length ? '.2rem' : 0 }}>
                          หน่วย {unitDisplay}
                        </div>
                      )}
                    </td>
                    <td style={{ ...cell, textAlign: 'center' }}>
                      {r.handmade ? <span style={{ color: '#059669', fontWeight: 700 }}>✓</span> : ''}
                    </td>
                    <td style={{ ...cell, textAlign: 'center' }}>
                      {r.ai ? <span style={{ color: '#7c3aed', fontWeight: 700 }}>✓</span> : ''}
                    </td>
                    <td style={{ ...cell, textAlign: 'center' }}>
                      {r.category === 'เก่า' ? <span style={{ color: '#b45309', fontWeight: 700 }}>✓</span> : ''}
                    </td>
                    <td style={{ ...cell, textAlign: 'center' }}>
                      {(r.category === 'ใหม่' || !r.category) ? <span style={{ color: '#15803d', fontWeight: 700 }}>✓</span> : ''}
                    </td>
                    <td style={{ ...cell, color: '#6b7280', fontSize: '.8rem' }}>{r.note ?? ''}</td>
                    {viewMode === 'entry' && (
                      <td style={{ ...cell, textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '.3rem', justifyContent: 'center' }}>
                          {canEdit(r) && (
                            <button type="button" onClick={() => startEdit(r)}
                              style={{ padding: '.2rem .5rem', borderRadius: '5px', border: 'none', background: '#e0f2fe', color: '#0891b2', cursor: 'pointer', fontSize: '.75rem', fontWeight: 600 }}>
                              แก้ไข
                            </button>
                          )}
                          {canDelete() && (
                            <button type="button" onClick={() => del(r.id)}
                              style={{ padding: '.2rem .5rem', borderRadius: '5px', border: 'none', background: '#fee2e2', color: '#dc2626', cursor: 'pointer', fontSize: '.75rem', fontWeight: 600 }}>
                              ลบ
                            </button>
                          )}
                          {!canEdit(r) && !canDelete() && (
                            <span style={{ color: '#d1d5db', fontSize: '.75rem' }}>—</span>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ marginTop: '.5rem', fontSize: '.78rem', color: '#6b7280', textAlign: 'right' }}>
            รวม {records.length} รายการ
          </div>
        </div>
      )}
    </div>
  );
}
