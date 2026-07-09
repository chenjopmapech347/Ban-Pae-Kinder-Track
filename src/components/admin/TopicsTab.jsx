import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import Modal, { ModalCancelBtn, ModalConfirmBtn } from '../Modal';

const FRAME_STYLE = {
  dcy:      { bg: '#dbeafe', color: '#1e40af', border: '#93c5fd' },
  curriculum: { bg: '#dcfce7', color: '#15803d', border: '#86efac' },
  onesqa:   { bg: '#ffedd5', color: '#c2410c', border: '#fdba74' },
};
const FRAME_LABEL = { dcy: 'ดย.', curriculum: 'ปวัย.', onesqa: 'สมศ.' };

function CrossRefBadges({ crossRef }) {
  if (!crossRef) return null;
  return (
    <div style={{ display: 'flex', gap: '.3rem', flexWrap: 'wrap', marginTop: '.4rem' }}>
      {Object.entries(crossRef).map(([key, val]) => {
        const s = FRAME_STYLE[key];
        if (!s) return null;
        return (
          <span key={key} style={{
            fontSize: '.64rem', fontWeight: 700, padding: '2px 6px',
            borderRadius: '999px', background: s.bg, color: s.color,
            border: `1px solid ${s.border}`, whiteSpace: 'nowrap',
          }}>
            {FRAME_LABEL[key]} {val}
          </span>
        );
      })}
    </div>
  );
}

export default function TopicsTab() {
  const { assessmentTopics, setAssessmentTopics } = useApp();
  const [isModal, setIsModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm]       = useState({});

  const openNew  = () => { setEditing(null); setForm({ label:'', emoji:'✨' }); setIsModal(true); };
  const openEdit = t => { setEditing(t); setForm(t); setIsModal(true); };

  const handleSave = e => {
    e.preventDefault();
    if (editing) setAssessmentTopics(assessmentTopics.map(t => t.id === editing.id ? { ...t, ...form } : t));
    else setAssessmentTopics([...assessmentTopics, { ...form, id: 'topic_' + Date.now() }]);
    setIsModal(false);
  };

  return (
    <div className="glass p-6 animate-fade">
      <div className="page-header mb-4">
        <h3>จัดการหัวข้อการประเมิน</h3>
        <button className="btn btn-primary" onClick={openNew}>+ เพิ่มหัวข้อ</button>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginBottom: '1rem', padding: '.6rem .85rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
        <span style={{ fontSize: '.72rem', fontWeight: 700, color: '#6b7280', marginRight: '.25rem' }}>กรอบมาตรฐาน:</span>
        {Object.entries(FRAME_LABEL).map(([k, label]) => {
          const s = FRAME_STYLE[k];
          return (
            <span key={k} style={{ fontSize: '.7rem', fontWeight: 600, padding: '2px 8px', borderRadius: '999px', background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
              {label} = {k === 'dcy' ? 'กรมกิจการเด็กและเยาวชน' : k === 'curriculum' ? 'หลักสูตรปฐมวัย 2560' : 'สมศ.'}
            </span>
          );
        })}
      </div>

      <div className="grid grid-2" style={{ gap:'1rem' }}>
        {assessmentTopics.map(t => (
          <div key={t.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div className="flex items-center gap-3">
                <div style={{ fontSize: '2rem' }}>{t.emoji}</div>
                <div>
                  <div className="font-bold">ด้าน{t.label}</div>
                  <div className="text-xs text-muted">รหัส: {t.id}</div>
                </div>
              </div>
              <div className="flex gap-2" style={{ flexShrink: 0 }}>
                <button className="btn btn-sm" onClick={() => openEdit(t)}>แก้ไข</button>
                <button className="btn btn-sm" style={{ color:'var(--danger)' }}
                  onClick={() => { if(confirm('ลบหัวข้อนี้?')) setAssessmentTopics(assessmentTopics.filter(x => x.id !== t.id)); }}>ลบ</button>
              </div>
            </div>
            <CrossRefBadges crossRef={t.crossRef} />
          </div>
        ))}
      </div>

      <Modal
        isOpen={isModal}
        onClose={() => setIsModal(false)}
        title={editing ? 'แก้ไขหัวข้อการประเมิน' : 'เพิ่มหัวข้อใหม่'}
        size="sm"
      >
        <form onSubmit={handleSave} style={{ display:'flex',flexDirection:'column',gap:'1rem' }}>
          <div><label style={{ display:'block',marginBottom:'.35rem' }}>ชื่อด้านพัฒนาการ</label>
            <input className="input" value={form.label||''} onChange={e=>setForm({...form,label:e.target.value})} required /></div>
          <div><label style={{ display:'block',marginBottom:'.35rem' }}>อิโมจิ</label>
            <input className="input" value={form.emoji||''} onChange={e=>setForm({...form,emoji:e.target.value})} placeholder="เช่น 🏃, ❤️, 💡" /></div>
          <div className="flex gap-2 mt-2">
            <ModalCancelBtn onClick={() => setIsModal(false)} />
            <ModalConfirmBtn type="submit" label="💾 บันทึก" />
          </div>
        </form>
      </Modal>
    </div>
  );
}
