import { useApp } from '../../context/AppContext';

export default function HolidaysTab() {
  const { holidays, setHolidays } = useApp();

  return (
    <div className="glass p-6 animate-fade">
      <div className="page-header mb-6">
        <h3>🏖️ จัดการวันหยุดและกิจกรรมประจำปี</h3>
        <button type="button" className="btn btn-primary" onClick={() => {
          const label = prompt('ชื่อวันหยุด/กิจกรรม:');
          const date  = prompt('วันที่ (เช่น 01/01/2569):');
          if (label && date) setHolidays([...holidays, { id: Date.now(), date, label, type: 'Holiday' }]);
        }}>+ เพิ่มวันหยุด</button>
      </div>

      <div style={{ display:'flex',flexDirection:'column',gap:'.75rem' }}>
        {holidays.map(h => (
          <div key={h.id} className="glass-card flex justify-between items-center" style={{ flexWrap:'wrap',gap:'.75rem' }}>
            <div className="flex gap-3 items-center">
              <div style={{
                background:'linear-gradient(135deg,#7c3aed,#a855f7)',
                color:'white', borderRadius:'12px', padding:'.5rem .85rem',
                fontWeight:800, fontSize:'.85rem', minWidth:'90px', textAlign:'center',
              }}>{h.date}</div>
              <div>
                <div className="font-bold">{h.label}</div>
                <div className="text-xs text-muted">ประเภท: {h.type}</div>
              </div>
            </div>
            <button type="button" className="btn btn-sm" style={{ color:'var(--danger)' }}
              onClick={() => { if(confirm('ลบวันหยุดนี้?')) setHolidays(holidays.filter(x => x.id !== h.id)); }}>
              🗑️ ลบ
            </button>
          </div>
        ))}
        {!holidays.length && (
          <div className="text-center text-muted" style={{ padding:'2rem' }}>ยังไม่มีวันหยุด</div>
        )}
      </div>
    </div>
  );
}
