import { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { INDICATORS_DATA } from '../../data/indicatorsData';
import { getStandardsByDomain } from '../../data/flatIndicators';
import Modal, { ModalCancelBtn, ModalConfirmBtn } from '../Modal';

// ── CSV helpers ───────────────────────────────────────────────────────────────

const DOMAIN_MAP = {
  // id → Thai label (for export)
  physical:  'ร่างกาย',
  emotional: 'อารมณ์-จิตใจ',
  social:    'สังคม',
  mental:    'สติปัญญา',
};
const DOMAIN_ID_MAP = Object.fromEntries(
  Object.entries(DOMAIN_MAP).map(([k, v]) => [v, k])
); // reverse map

function downloadTemplate() {
  const rows = [
    ['ด้าน (physical/emotional/social/mental)', 'รหัสมาตรฐาน', 'ชื่อมาตรฐาน', 'รหัสตัวบ่งชี้', 'ชื่อตัวบ่งชี้'],
    ['physical', 'qa-3', 'มาตรฐานที่ 3 ร่างกาย', '3.1', 'ตัวบ่งชี้ที่ 3.1 น้ำหนัก/ส่วนสูงตามเกณฑ์'],
    ['mental',   'std-10', 'มาตรฐานที่ 10 ภาษา', '10.1', 'ตัวบ่งชี้ที่ 10.1 ฟัง-พูดสื่อสารได้'],
  ];
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = 'indicators_template.csv'; a.click();
  URL.revokeObjectURL(url);
}

function exportIndicators(indicators) {
  const rows = [
    ['ด้าน (physical/emotional/social/mental)', 'รหัสมาตรฐาน', 'ชื่อมาตรฐาน', 'รหัสตัวบ่งชี้', 'ชื่อตัวบ่งชี้'],
    ...indicators.map(i => [i.domainId, i.standardId, i.standardTitle, i.indicatorCode, i.label]),
  ];
  const csv = rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = 'indicators_export.csv'; a.click();
  URL.revokeObjectURL(url);
}

function parseCSV(text) {
  // แยก rows (รองรับ \r\n และ \n)
  const lines = text.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  if (lines.length < 2) return { ok: false, error: 'ไฟล์ไม่มีข้อมูล (ต้องมีอย่างน้อย 1 แถวข้อมูล นอกจาก header)' };

  // parse แต่ละ cell (รองรับ quoted fields)
  function parseLine(line) {
    const result = [];
    let cur = '', inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQ && line[i+1] === '"') { cur += '"'; i++; }
        else inQ = !inQ;
      } else if (ch === ',' && !inQ) {
        result.push(cur.trim()); cur = '';
      } else cur += ch;
    }
    result.push(cur.trim());
    return result;
  }

  const header = parseLine(lines[0]).map(h => h.toLowerCase());
  // หา column index
  const col = {
    domainId:      header.findIndex(h => h.includes('ด้าน') || h === 'domainid'),
    standardId:    header.findIndex(h => h.includes('รหัสมาตรฐาน') || h === 'standardid'),
    standardTitle: header.findIndex(h => h.includes('ชื่อมาตรฐาน') || h === 'standardtitle'),
    indicatorCode: header.findIndex(h => h.includes('รหัสตัวบ่งชี้') || h === 'indicatorcode'),
    label:         header.findIndex(h => h.includes('ชื่อตัวบ่งชี้') || h === 'label'),
  };

  if (col.domainId < 0 || col.indicatorCode < 0 || col.label < 0)
    return { ok: false, error: 'ไม่พบ column: "ด้าน", "รหัสตัวบ่งชี้", "ชื่อตัวบ่งชี้" — กรุณาใช้แม่แบบที่ดาวน์โหลด' };

  const indicators = [];
  const errors = [];

  lines.slice(1).forEach((line, idx) => {
    if (!line.trim()) return;
    const cells = parseLine(line);
    const rawDomain = cells[col.domainId] ?? '';
    // รองรับทั้ง en id และ Thai label
    const domainId = DOMAIN_ID_MAP[rawDomain] ?? rawDomain;
    const validDomains = Object.keys(DOMAIN_MAP);
    if (!validDomains.includes(domainId)) {
      errors.push(`แถว ${idx + 2}: ด้าน "${rawDomain}" ไม่ถูกต้อง (ต้องเป็น ${validDomains.join(', ')})`);
      return;
    }
    const indicatorCode = cells[col.indicatorCode] ?? '';
    const label         = cells[col.label] ?? '';
    if (!indicatorCode || !label) {
      errors.push(`แถว ${idx + 2}: รหัสตัวบ่งชี้หรือชื่อว่าง`);
      return;
    }
    const standardId    = col.standardId >= 0 ? (cells[col.standardId] ?? '') : '';
    const standardTitle = col.standardTitle >= 0 ? (cells[col.standardTitle] ?? '') : '';
    const domInfo = INDICATORS_DATA.find(d => d.id === domainId);

    indicators.push({
      id:            `${domainId}__${standardId}__${indicatorCode}__csv_${Date.now()}_${idx}`,
      domainId,
      domainLabel:   domInfo?.label ?? domainId,
      domainEmoji:   domInfo?.emoji ?? '📋',
      domainColor:   domInfo?.color ?? '#7c3aed',
      standardId,
      standardTitle,
      indicatorCode,
      label,
    });
  });

  return { ok: true, indicators, errors };
}

// ── CSV Import Modal ──────────────────────────────────────────────────────────
function CsvImportModal({ isOpen, onClose, onImport, existingIndicators }) {
  const fileRef  = useRef();
  const [parsed, setParsed]   = useState(null);   // { indicators, errors }
  const [mode, setMode]       = useState('append'); // 'append' | 'replace'
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = parseCSV(ev.target.result);
      setParsed(result);
      setLoading(false);
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleImport = () => {
    if (!parsed?.ok || !parsed.indicators.length) return;
    onImport(parsed.indicators, mode);
    onClose();
    setParsed(null);
  };

  const handleClose = () => { onClose(); setParsed(null); };

  return (
    <Modal isOpen={true} onClose={handleClose} title="📥 นำเข้าตัวบ่งชี้จาก CSV" size="lg">
      <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Step 1: เลือกไฟล์ */}
        <div style={{
          border: '2px dashed #c4b5fd', borderRadius: '14px',
          padding: '1.5rem', textAlign: 'center',
          background: '#faf5ff', cursor: 'pointer',
        }} onClick={() => fileRef.current?.click()}>
          <div style={{ fontSize: '2rem', marginBottom: '.5rem' }}>📂</div>
          <div style={{ fontWeight: 700, color: '#7c3aed' }}>คลิกเพื่อเลือกไฟล์ CSV</div>
          <div style={{ fontSize: '.78rem', color: '#9ca3af', marginTop: '.25rem' }}>
            รองรับ .csv (UTF-8) — ต้องใช้แม่แบบที่ดาวน์โหลด
          </div>
          <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleFile} />
        </div>

        {loading && <div style={{ textAlign: 'center', color: '#7c3aed', padding: '1rem' }}>⏳ กำลังอ่านไฟล์...</div>}

        {/* ผลลัพธ์ parse */}
        {parsed && (
          <div>
            {/* Errors */}
            {parsed.errors?.length > 0 && (
              <div style={{
                background: '#fef2f2', border: '1.5px solid #fca5a5',
                borderRadius: '10px', padding: '.75rem 1rem', marginBottom: '1rem',
              }}>
                <div style={{ fontWeight: 700, color: '#dc2626', marginBottom: '.35rem' }}>
                  ⚠️ พบข้อผิดพลาด {parsed.errors.length} รายการ (แถวเหล่านี้จะถูกข้ามไป)
                </div>
                {parsed.errors.map((e, i) => (
                  <div key={i} style={{ fontSize: '.78rem', color: '#dc2626' }}>• {e}</div>
                ))}
              </div>
            )}

            {!parsed.ok && (
              <div style={{ background: '#fef2f2', border: '1.5px solid #fca5a5',
                borderRadius: '10px', padding: '1rem', color: '#dc2626', fontWeight: 600 }}>
                ❌ {parsed.error}
              </div>
            )}

            {parsed.ok && parsed.indicators.length > 0 && (
              <>
                {/* Preview */}
                <div style={{
                  background: '#f0fdf4', border: '1.5px solid #86efac',
                  borderRadius: '10px', padding: '.75rem 1rem', marginBottom: '1rem',
                }}>
                  <div style={{ fontWeight: 700, color: '#16a34a', marginBottom: '.5rem' }}>
                    ✅ พบตัวบ่งชี้ {parsed.indicators.length} รายการ พร้อม import
                  </div>
                  <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '.35rem' }}>
                    {parsed.indicators.map((ind, i) => (
                      <div key={i} style={{
                        display: 'flex', gap: '.5rem', alignItems: 'flex-start',
                        fontSize: '.78rem', color: '#374151',
                      }}>
                        <span style={{
                          background: ind.domainColor, color: 'white',
                          borderRadius: '5px', padding: '0 .35rem',
                          fontWeight: 800, flexShrink: 0, lineHeight: '1.5',
                        }}>{ind.indicatorCode}</span>
                        <span>{ind.domainEmoji} {ind.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mode เลือก append หรือ replace */}
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontWeight: 600, marginBottom: '.5rem', fontSize: '.85rem' }}>วิธีนำเข้า:</div>
                  <div style={{ display: 'flex', gap: '.75rem' }}>
                    {[
                      { id: 'append',  label: '➕ เพิ่มต่อท้าย', desc: `รวมกับ ${existingIndicators.length} รายการเดิม` },
                      { id: 'replace', label: '🔄 แทนที่ทั้งหมด', desc: 'ลบข้อมูลเดิมทั้งหมดก่อน' },
                    ].map(m => (
                      <button key={m.id} type="button" onClick={() => setMode(m.id)}
                        style={{
                          flex: 1, padding: '.65rem', border: 'none', borderRadius: '10px',
                          fontFamily: 'inherit', cursor: 'pointer', transition: 'all .15s', textAlign: 'left',
                          background: mode === m.id ? '#7c3aed' : '#f3f4f6',
                          color: mode === m.id ? 'white' : '#374151',
                          boxShadow: mode === m.id ? '0 4px 12px #7c3aed40' : 'none',
                        }}>
                        <div style={{ fontWeight: 700, fontSize: '.85rem' }}>{m.label}</div>
                        <div style={{ fontSize: '.72rem', opacity: .85, marginTop: '.1rem' }}>{m.desc}</div>
                      </button>
                    ))}
                  </div>
                  {mode === 'replace' && (
                    <div style={{ marginTop: '.5rem', fontSize: '.78rem', color: '#dc2626', fontWeight: 600 }}>
                      ⚠️ ข้อมูลตัวบ่งชี้เดิมทั้งหมดจะถูกลบ ไม่สามารถย้อนกลับได้
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '.75rem' }}>
                  <ModalCancelBtn onClick={handleClose} />
                  <ModalConfirmBtn onClick={handleImport} label={`💾 นำเข้า ${parsed.indicators.length} รายการ`} />
                </div>
              </>
            )}

            {parsed.ok && parsed.indicators.length === 0 && (
              <div style={{ textAlign: 'center', color: '#6b7280', padding: '1rem' }}>
                ไม่พบข้อมูลที่ถูกต้องในไฟล์
              </div>
            )}
          </div>
        )}

        {!parsed && !loading && (
          <ModalCancelBtn onClick={handleClose} />
        )}
      </div>
    </Modal>
  );
}

// ── Modal เพิ่ม/แก้ไขตัวบ่งชี้ ─────────────────────────────────────────────
function IndicatorModal({ isOpen, onClose, onSave, editing, domains }) {
  const blank = { domainId: domains[0]?.id ?? '', standardId: '', indicatorCode: '', label: '' };
  const [form, setForm] = useState(editing ?? blank);

  const standards = getStandardsByDomain(form.domainId);

  const handleSave = () => {
    if (!form.indicatorCode.trim() || !form.label.trim()) return alert('กรุณากรอกรหัสและชื่อตัวบ่งชี้');
    const id = editing?.id ?? `${form.domainId}__${form.standardId}__${form.indicatorCode}__${Date.now()}`;
    onSave({ ...form, id,
      domainLabel: domains.find(d => d.id === form.domainId)?.label ?? '',
      domainEmoji: domains.find(d => d.id === form.domainId)?.emoji ?? '',
      domainColor: domains.find(d => d.id === form.domainId)?.color ?? '#7c3aed',
      standardTitle: standards.find(s => s.id === form.standardId)?.title ?? form.standardId,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editing ? '✏️ แก้ไขตัวบ่งชี้' : '➕ เพิ่มตัวบ่งชี้ใหม่'} size="md">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '.35rem', fontWeight: 600 }}>ด้านพัฒนาการ</label>
          <select className="input" value={form.domainId}
            onChange={e => setForm({ ...form, domainId: e.target.value, standardId: '' })}>
            {domains.map(d => <option key={d.id} value={d.id}>{d.emoji} ด้าน{d.label}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '.35rem', fontWeight: 600 }}>มาตรฐาน</label>
          <select className="input" value={form.standardId}
            onChange={e => setForm({ ...form, standardId: e.target.value })}>
            <option value="">— เลือกมาตรฐาน —</option>
            {getStandardsByDomain(form.domainId).map(s => (
              <option key={s.id} value={s.id}>{s.title}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '.35rem', fontWeight: 600 }}>
            รหัสตัวบ่งชี้ <span style={{ color: 'var(--danger)' }}>*</span>
          </label>
          <input className="input" placeholder="เช่น 3.1, 5.2" value={form.indicatorCode}
            onChange={e => setForm({ ...form, indicatorCode: e.target.value })} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '.35rem', fontWeight: 600 }}>
            ชื่อ/คำอธิบายตัวบ่งชี้ <span style={{ color: 'var(--danger)' }}>*</span>
          </label>
          <input className="input" placeholder="เช่น ตัวบ่งชี้ที่ 3.1 ..." value={form.label}
            onChange={e => setForm({ ...form, label: e.target.value })} />
        </div>
        <div style={{ display: 'flex', gap: '.75rem', marginTop: '.5rem' }}>
          <ModalCancelBtn onClick={onClose} />
          <ModalConfirmBtn onClick={handleSave} label="💾 บันทึก" />
        </div>
      </div>
    </Modal>
  );
}

// ── Main IndicatorsTab ────────────────────────────────────────────────────────
export default function IndicatorsTab() {
  const { indicators, setIndicators, activities } = useApp();
  const [activeDomain, setActiveDomain] = useState(INDICATORS_DATA[0]?.id ?? 'physical');
  const [isModal,      setIsModal]      = useState(false);
  const [isCsvModal,   setIsCsvModal]   = useState(false);
  const [editing,      setEditing]      = useState(null);
  const [search,       setSearch]       = useState('');
  const [toast,        setToast]        = useState(null);

  const domains = INDICATORS_DATA.map(d => ({ id: d.id, label: d.label, emoji: d.emoji, color: d.color, bg: d.bg }));
  const domain  = INDICATORS_DATA.find(d => d.id === activeDomain);

  const domainIndicators = indicators.filter(ind =>
    ind.domainId === activeDomain &&
    (search === '' || ind.label.toLowerCase().includes(search.toLowerCase()) || ind.indicatorCode.includes(search))
  );

  const actCountFor = (indId) => activities.filter(a => a.indicatorId === indId).length;

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = (data) => {
    if (editing) {
      setIndicators(indicators.map(i => i.id === editing.id ? { ...i, ...data } : i));
      showToast('แก้ไขตัวบ่งชี้แล้ว');
    } else {
      setIndicators([...indicators, data]);
      showToast('เพิ่มตัวบ่งชี้แล้ว');
    }
    setEditing(null);
  };

  const handleDelete = (id) => {
    if (!confirm('ลบตัวบ่งชี้นี้? กิจกรรมที่เชื่อมจะถูกลบด้วย')) return;
    setIndicators(indicators.filter(i => i.id !== id));
    showToast('ลบแล้ว', 'error');
  };

  const handleCsvImport = (imported, mode) => {
    if (mode === 'replace') {
      setIndicators(imported);
    } else {
      // append — กรองซ้ำด้วย indicatorCode+domainId
      const existing = new Set(indicators.map(i => `${i.domainId}_${i.indicatorCode}`));
      const newOnes  = imported.filter(i => !existing.has(`${i.domainId}_${i.indicatorCode}`));
      const dupes    = imported.length - newOnes.length;
      setIndicators([...indicators, ...newOnes]);
      showToast(`นำเข้า ${newOnes.length} รายการ${dupes > 0 ? ` (ซ้ำ ${dupes} รายการ)` : ''}`);
      return;
    }
    showToast(`นำเข้า ${imported.length} รายการ (แทนที่ทั้งหมด)`);
  };

  return (
    <div className="glass p-6 animate-fade">

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 500,
          background: toast.type === 'error' ? '#dc2626' : '#059669',
          color: 'white', padding: '.75rem 1.25rem', borderRadius: '12px',
          fontWeight: 700, fontSize: '.88rem',
          boxShadow: '0 8px 24px rgba(0,0,0,.2)',
          animation: 'fadeIn .2s ease',
        }}>
          {toast.type === 'error' ? '🗑️' : '✅'} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="page-header mb-6">
        <h3>📋 ตัวบ่งชี้</h3>
        <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <input className="input" style={{ maxWidth: '160px' }} placeholder="🔍 ค้นหา..."
            value={search} onChange={e => setSearch(e.target.value)} />

          {/* Download Template */}
          <button className="btn" style={{ background: '#f0fdf4', color: '#16a34a', border: '1.5px solid #86efac' }}
            onClick={() => downloadTemplate()}
            title="ดาวน์โหลดแม่แบบ CSV">
            📄 แม่แบบ CSV
          </button>

          {/* Export */}
          <button className="btn" style={{ background: '#eff6ff', color: '#2563eb', border: '1.5px solid #bfdbfe' }}
            onClick={() => exportIndicators(indicators)}
            title="ส่งออกข้อมูลทั้งหมดเป็น CSV">
            ⬆️ ส่งออก
          </button>

          {/* Import CSV */}
          <button className="btn" style={{ background: '#faf5ff', color: '#7c3aed', border: '1.5px solid #c4b5fd' }}
            onClick={() => setIsCsvModal(true)}>
            📥 นำเข้า CSV
          </button>

          {/* Add */}
          <button className="btn btn-primary" onClick={() => { setEditing(null); setIsModal(true); }}>
            + เพิ่มตัวบ่งชี้
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{
        display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap',
      }}>
        {domains.map(d => {
          const cnt = indicators.filter(i => i.domainId === d.id).length;
          return (
            <button key={d.id} type="button"
              onClick={() => { setActiveDomain(d.id); setSearch(''); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '.45rem',
                padding: '.5rem 1rem', borderRadius: '12px', border: 'none',
                fontFamily: 'inherit', fontWeight: 700, fontSize: '.85rem',
                cursor: 'pointer', transition: 'all .2s',
                background: activeDomain === d.id ? d.color : '#f3f4f6',
                color: activeDomain === d.id ? 'white' : '#6b7280',
                boxShadow: activeDomain === d.id ? `0 4px 14px ${d.color}50` : 'none',
              }}>
              {d.emoji} ด้าน{d.label}
              <span style={{
                background: activeDomain === d.id ? 'rgba(255,255,255,.25)' : '#e5e7eb',
                color: activeDomain === d.id ? 'white' : '#6b7280',
                borderRadius: '999px', padding: '0 .45rem', fontSize: '.72rem',
              }}>{cnt}</span>
            </button>
          );
        })}
        <div style={{ marginLeft: 'auto', fontSize: '.8rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
          รวมทั้งหมด {indicators.length} ตัวบ่งชี้
        </div>
      </div>

      {/* Standard Sections */}
      {domain?.standards.map(std => {
        const stdInds = domainIndicators.filter(i => i.standardId === std.id);
        if (stdInds.length === 0 && search) return null;
        return (
          <div key={std.id} style={{ marginBottom: '1.25rem' }}>
            <div style={{
              padding: '.5rem .85rem', marginBottom: '.6rem',
              background: domain ? `${domain.color}12` : '#f5f3ff',
              borderLeft: `3px solid ${domain?.color ?? '#7c3aed'}`,
              borderRadius: '0 8px 8px 0', fontSize: '.8rem',
              fontWeight: 700, color: domain?.color ?? '#7c3aed',
            }}>
              {std.title}
            </div>

            {stdInds.length === 0 ? (
              <div style={{ fontSize: '.82rem', color: 'var(--text-muted)', padding: '.5rem 1rem' }}>
                ยังไม่มีตัวบ่งชี้ในมาตรฐานนี้
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                {stdInds.map(ind => {
                  const aCnt = actCountFor(ind.id);
                  return (
                    <div key={ind.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: 'white', border: `1.5px solid ${(domain?.color ?? '#7c3aed')}20`,
                      borderRadius: '10px', padding: '.6rem .85rem', transition: 'all .15s',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flex: 1, minWidth: 0 }}>
                        <span style={{
                          background: `${domain?.color ?? '#7c3aed'}20`, color: domain?.color ?? '#7c3aed',
                          borderRadius: '6px', padding: '.1rem .45rem',
                          fontSize: '.7rem', fontWeight: 800, flexShrink: 0,
                        }}>{ind.indicatorCode}</span>
                        <span style={{ fontWeight: 600, fontSize: '.85rem', color: '#374151' }}>{ind.label}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexShrink: 0 }}>
                        <span style={{
                          background: aCnt > 0 ? `${domain?.color ?? '#7c3aed'}15` : '#f3f4f6',
                          color: aCnt > 0 ? domain?.color ?? '#7c3aed' : '#9ca3af',
                          borderRadius: '999px', padding: '0 .55rem', fontSize: '.72rem', fontWeight: 700,
                        }}>{aCnt} กิจกรรม</span>
                        <button className="btn btn-sm" onClick={() => { setEditing(ind); setIsModal(true); }}>แก้ไข</button>
                        <button className="btn btn-sm" style={{ color: 'var(--danger)' }}
                          onClick={() => handleDelete(ind.id)}>ลบ</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* ตัวบ่งชี้ที่ไม่มี standardId (นำเข้าจาก CSV ที่ไม่ระบุมาตรฐาน) */}
      {(() => {
        const stdIds = domain?.standards.map(s => s.id) ?? [];
        const orphans = domainIndicators.filter(i => !stdIds.includes(i.standardId));
        if (!orphans.length) return null;
        return (
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{
              padding: '.5rem .85rem', marginBottom: '.6rem',
              background: '#f9fafb', borderLeft: '3px solid #9ca3af',
              borderRadius: '0 8px 8px 0', fontSize: '.8rem',
              fontWeight: 700, color: '#6b7280',
            }}>
              📌 ตัวบ่งชี้อื่น ๆ (ไม่ระบุมาตรฐาน)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
              {orphans.map(ind => {
                const aCnt = actCountFor(ind.id);
                return (
                  <div key={ind.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: 'white', border: '1.5px solid #e5e7eb',
                    borderRadius: '10px', padding: '.6rem .85rem',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flex: 1, minWidth: 0 }}>
                      <span style={{
                        background: '#f3f4f6', color: '#6b7280',
                        borderRadius: '6px', padding: '.1rem .45rem',
                        fontSize: '.7rem', fontWeight: 800, flexShrink: 0,
                      }}>{ind.indicatorCode}</span>
                      <span style={{ fontWeight: 600, fontSize: '.85rem', color: '#374151' }}>{ind.label}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexShrink: 0 }}>
                      <span style={{
                        background: aCnt > 0 ? '#f5f3ff' : '#f3f4f6',
                        color: aCnt > 0 ? '#7c3aed' : '#9ca3af',
                        borderRadius: '999px', padding: '0 .55rem', fontSize: '.72rem', fontWeight: 700,
                      }}>{aCnt} กิจกรรม</span>
                      <button className="btn btn-sm" onClick={() => { setEditing(ind); setIsModal(true); }}>แก้ไข</button>
                      <button className="btn btn-sm" style={{ color: 'var(--danger)' }}
                        onClick={() => handleDelete(ind.id)}>ลบ</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {domainIndicators.length === 0 && !search && (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
          ไม่มีตัวบ่งชี้ในด้านนี้ — กด <strong>+ เพิ่มตัวบ่งชี้</strong> หรือ <strong>📥 นำเข้า CSV</strong>
        </div>
      )}

      <IndicatorModal
        isOpen={isModal}
        onClose={() => { setIsModal(false); setEditing(null); }}
        onSave={handleSave}
        editing={editing}
        domains={domains}
      />
      <CsvImportModal
        isOpen={isCsvModal}
        onClose={() => setIsCsvModal(false)}
        onImport={handleCsvImport}
        existingIndicators={indicators}
      />
    </div>
  );
}
