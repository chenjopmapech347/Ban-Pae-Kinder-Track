/* ─────────────────────────────────────────────────────────────
   ActivityScheduleTab.jsx
   จัดการกิจกรรมภายใน-นอกห้องเรียนประจำวัน
   ───────────────────────────────────────────────────────────── */

const DAYS = ['จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์'];

const PS = {
  eng: { bg:'#FFFDE7', color:'#E65100', border:'#FFE082' },
  ef:  { bg:'#E3F2FD', color:'#0D47A1', border:'#90CAF9' },
  com: { bg:'#E0F7FA', color:'#006064', border:'#80DEEA' },
  res: { bg:'#F3E5F5', color:'#6A1B9A', border:'#CE93D8' },
  gar: { bg:'#E8F5E9', color:'#1B5E20', border:'#A5D6A7' },
  wst: { bg:'#FFF3E0', color:'#BF360C', border:'#FFAB91' },
  pe:  { bg:'#FCE4EC', color:'#880E4F', border:'#F48FB1' },
};

// [type, time, label]
const SCHEDULE = [
  {
    level:'อนุบาล ๑', hd:'linear-gradient(90deg,#1565C0,#1976D2)',
    rooms:[
      { name:'ห้อง อ.1/1', inC:8, outC:3, days:{
        จันทร์:    [['ef','08.30','ห้องสื่อ EF'],['com','09.30','คอมพิวเตอร์'],['eng','13.30','Eng']],
        อังคาร:   [['res','08.30','ห้องแหล่งเรียนรู้'],['eng','13.30','Eng']],
        พุธ:       [['gar','09.30','แปลงผัก'],['eng','13.30','Eng']],
        พฤหัสบดี:[['pe','08.30','พลศึกษา'],['wst','09.30','คัดแยกขยะ'],['eng','13.30','Eng']],
        ศุกร์:     [['eng','13.30','Eng']],
      }},
      { name:'ห้อง อ.1/2', inC:8, outC:3, days:{
        จันทร์:    [['com','08.30','คอมพิวเตอร์'],['ef','09.30','ห้องสื่อ EF'],['eng','14.30','Eng']],
        อังคาร:   [['res','09.30','ห้องแหล่งเรียนรู้'],['gar','13.30','แปลงผัก'],['eng','14.30','Eng']],
        พุธ:       [['eng','14.30','Eng']],
        พฤหัสบดี:[['pe','08.30','พลศึกษา'],['wst','09.30','คัดแยกขยะ'],['eng','14.30','Eng']],
        ศุกร์:     [['eng','14.30','Eng']],
      }},
    ],
  },
  {
    level:'อนุบาล ๒', hd:'linear-gradient(90deg,#2E7D32,#388E3C)',
    rooms:[
      { name:'ห้อง อ.2/1', inC:6, outC:3, days:{
        จันทร์:    [['eng','08.30','Eng'],['ef','13.30','ห้องสื่อ EF'],['com','14.30','คอมพิวเตอร์']],
        อังคาร:   [['gar','09.30','แปลงผัก'],['res','13.30','ห้องแหล่งเรียนรู้']],
        พุธ:       [['eng','08.30','Eng']],
        พฤหัสบดี:[['wst','08.30','คัดแยกขยะ'],['pe','09.30','พลศึกษา']],
        ศุกร์:     [['eng','08.30','Eng']],
      }},
      { name:'ห้อง อ.2/2', inC:6, outC:3, days:{
        จันทร์:    [['eng','09.30','Eng'],['com','13.30','คอมพิวเตอร์'],['ef','14.30','ห้องสื่อ EF']],
        อังคาร:   [['gar','08.30','แปลงผัก'],['res','14.30','ห้องแหล่งเรียนรู้']],
        พุธ:       [['eng','09.30','Eng']],
        พฤหัสบดี:[['wst','08.30','คัดแยกขยะ'],['pe','09.30','พลศึกษา']],
        ศุกร์:     [['eng','09.30','Eng']],
      }},
    ],
  },
  {
    level:'อนุบาล ๓', hd:'linear-gradient(90deg,#6A1B9A,#7B1FA2)',
    rooms:[
      { name:'ห้อง อ.3/1', inC:5, outC:3, days:{
        จันทร์:    [['gar','08.30','แปลงผัก']],
        อังคาร:   [['eng','08.30','Eng'],['ef','09.30','ห้องสื่อ EF'],['com','13.00','คอมพิวเตอร์']],
        พุธ:       [['res','08.30','ห้องแหล่งเรียนรู้']],
        พฤหัสบดี:[['eng','08.30','Eng'],['wst','09.30','คัดแยกขยะ'],['pe','10.30','พลศึกษา']],
        ศุกร์:     [],
      }},
      { name:'ห้อง อ.3/2', inC:5, outC:3, days:{
        จันทร์:    [['gar','09.30','แปลงผัก']],
        อังคาร:   [['eng','09.30','Eng'],['ef','10.30','ห้องสื่อ EF'],['res','12.00','ห้องแหล่งเรียนรู้']],
        พุธ:       [['com','10.30','คอมพิวเตอร์']],
        พฤหัสบดี:[['wst','08.30','คัดแยกขยะ'],['eng','09.30','Eng'],['pe','10.30','พลศึกษา']],
        ศุกร์:     [],
      }},
      { name:'ห้อง อ.3/3', inC:4, outC:3, days:{
        จันทร์:    [['gar','10.30','แปลงผัก']],
        อังคาร:   [['ef','08.30','ห้องสื่อ EF']],
        พุธ:       [['res','09.30','ห้องแหล่งเรียนรู้'],['com','10.30','คอมพิวเตอร์']],
        พฤหัสบดี:[['wst','08.30','คัดแยกขยะ'],['eng','10.30','Eng'],['pe','12.00','พลศึกษา']],
        ศุกร์:     [],
      }},
    ],
  },
];

const MATCH_ROWS = [
  { act:'Eng (ภาษาอังกฤษ)', type:'eng', defined:'ห้องเรียนประจำ', actual:'สอนในห้องเรียนประจำ', src:'ในห้องเรียน', srcStyle:{bg:'#FFFDE7',color:'#E65100'} },
  { act:'ห้องสื่อ EF',       type:'ef',  defined:'ห้องสื่อ EF (ห้องพิเศษ)', actual:'ใช้ห้องสื่อ EF ในอาคาร', src:'ในอาคาร', srcStyle:{bg:'#E3F2FD',color:'#0D47A1'} },
  { act:'คอมพิวเตอร์',       type:'com', defined:'ห้องคอมพิวเตอร์', actual:'ใช้ห้องคอมพิวเตอร์ในอาคาร', src:'ในอาคาร', srcStyle:{bg:'#E3F2FD',color:'#0D47A1'} },
  { act:'ห้องแหล่งเรียนรู้', type:'res', defined:'ห้องแหล่งเรียนรู้', actual:'ใช้ห้องแหล่งเรียนรู้ในอาคาร', src:'ในอาคาร', srcStyle:{bg:'#E3F2FD',color:'#0D47A1'} },
  { act:'แปลงผัก',           type:'gar', defined:'แปลงเกษตร (นอกอาคาร)', actual:'ออกไปทำกิจกรรมที่แปลงผัก', src:'นอกอาคาร', srcStyle:{bg:'#E8F5E9',color:'#1B5E20'} },
  { act:'คัดแยกขยะ',         type:'wst', defined:'จุดคัดแยกขยะ (นอกอาคาร)', actual:'ออกไปทำกิจกรรมนอกอาคาร', src:'นอกอาคาร', srcStyle:{bg:'#E8F5E9',color:'#1B5E20'} },
  { act:'พลศึกษา (พละ)',     type:'pe',  defined:'สนาม/ลานอเนกประสงค์', actual:'ออกไปทำกิจกรรมที่สนามกีฬา', src:'นอกอาคาร', srcStyle:{bg:'#E8F5E9',color:'#1B5E20'} },
];

const RATIO_ROWS = [
  { room:'อ.1/1', inC:8, outC:3 },
  { room:'อ.1/2', inC:8, outC:3 },
  { room:'อ.2/1', inC:6, outC:3 },
  { room:'อ.2/2', inC:6, outC:3 },
  { room:'อ.3/1', inC:5, outC:3 },
  { room:'อ.3/2', inC:5, outC:3 },
  { room:'อ.3/3', inC:4, outC:3 },
];

/* ── Sub-components ──────────────────────────────────────── */

function Pill({ type, time, label }) {
  const s = PS[type] ?? PS.eng;
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:'4px',
      padding:'3px 9px 3px 7px', borderRadius:'20px',
      fontSize:'.79em', fontWeight:600, whiteSpace:'nowrap',
      background:s.bg, color:s.color, border:`1.5px solid ${s.border}`,
    }}>
      <span style={{ fontSize:'.74em', opacity:.65 }}>{time}</span>
      {label}
    </span>
  );
}

function RoomCard({ room }) {
  const total = room.inC + room.outC;
  const pct   = Math.round((room.inC / total) * 100);
  return (
    <div style={{ background:'white', padding:'12px 14px', flex:'1 1 320px', minWidth:'290px' }}>
      {/* header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                    marginBottom:'8px', paddingBottom:'7px', borderBottom:'2px solid #eceff1' }}>
        <span style={{ fontWeight:700, fontSize:'.9em', color:'#37474f' }}>{room.name}</span>
        <div style={{ display:'flex', gap:'4px' }}>
          <span style={{ fontSize:'.7em', fontWeight:700, padding:'2px 8px', borderRadius:'20px',
                         background:'#E3F2FD', color:'#0D47A1' }}>🏫 ใน {room.inC}</span>
          <span style={{ fontSize:'.7em', fontWeight:700, padding:'2px 8px', borderRadius:'20px',
                         background:'#E8F5E9', color:'#1B5E20' }}>🌿 นอก {room.outC}</span>
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
                ? acts.map(([t,tm,lb]) => <Pill key={`${t}${tm}`} type={t} time={tm} label={lb} />)
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

/* ── Main ────────────────────────────────────────────────── */

export default function ActivityScheduleTab() {
  /* ── common table th style ── */
  const TH = {
    padding:'9px 12px', border:'1px solid #cfd8dc',
    background:'#eceff1', color:'#546e7a', fontWeight:700,
    textAlign:'center',
  };
  const TD = { padding:'9px 12px', border:'1px solid #e4e8ec', verticalAlign:'middle' };

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
          เปรียบเทียบกิจกรรมกับแหล่งเรียนรู้ในและนอกห้องเรียน · ระดับอนุบาล ๑–๓
        </div>
      </div>

      {/* ── Legend ── */}
      <div className="glass-card mb-4">
        <div style={{ display:'flex', flexWrap:'wrap', gap:'6px 0', alignItems:'center' }}>

          <div style={{ display:'flex', alignItems:'center', gap:'6px 12px', flexWrap:'wrap',
                        padding:'4px 14px', borderRight:'1px solid #e0e0e0' }}>
            <span style={{ fontSize:'.76em', fontWeight:700, color:'#90a4ae',
                           textTransform:'uppercase', letterSpacing:'.05em' }}>📖 ในห้องเรียน</span>
            {[['eng','Eng (ภาษาอังกฤษ)']].map(([t,lb]) => (
              <span key={t} style={{ display:'inline-flex', alignItems:'center', gap:'5px', fontSize:'.84em' }}>
                <span style={{ width:'12px', height:'12px', borderRadius:'50%',
                               background:PS[t].bg, border:`1.5px solid ${PS[t].border}` }} />
                {lb}
              </span>
            ))}
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:'6px 12px', flexWrap:'wrap',
                        padding:'4px 14px', borderRight:'1px solid #e0e0e0' }}>
            <span style={{ fontSize:'.76em', fontWeight:700, color:'#90a4ae',
                           textTransform:'uppercase', letterSpacing:'.05em' }}>🏫 แหล่งเรียนรู้ในอาคาร</span>
            {[['ef','ห้องสื่อ EF'],['com','คอมพิวเตอร์'],['res','ห้องแหล่งเรียนรู้']].map(([t,lb]) => (
              <span key={t} style={{ display:'inline-flex', alignItems:'center', gap:'5px', fontSize:'.84em' }}>
                <span style={{ width:'12px', height:'12px', borderRadius:'50%',
                               background:PS[t].bg, border:`1.5px solid ${PS[t].border}` }} />
                {lb}
              </span>
            ))}
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:'6px 12px', flexWrap:'wrap', padding:'4px 14px' }}>
            <span style={{ fontSize:'.76em', fontWeight:700, color:'#90a4ae',
                           textTransform:'uppercase', letterSpacing:'.05em' }}>🌿 แหล่งเรียนรู้นอกอาคาร</span>
            {[['gar','แปลงผัก'],['wst','คัดแยกขยะ'],['pe','พลศึกษา']].map(([t,lb]) => (
              <span key={t} style={{ display:'inline-flex', alignItems:'center', gap:'5px', fontSize:'.84em' }}>
                <span style={{ width:'12px', height:'12px', borderRadius:'50%',
                               background:PS[t].bg, border:`1.5px solid ${PS[t].border}` }} />
                {lb}
              </span>
            ))}
          </div>

        </div>
      </div>

      {/* ── Schedule by level ── */}
      {SCHEDULE.map(lv => (
        <div key={lv.level} className="mb-4" style={{
          borderRadius:'14px', overflow:'hidden',
          boxShadow:'0 2px 12px rgba(0,0,0,0.09)',
        }}>
          <div style={{ padding:'10px 18px', fontWeight:700, color:'white',
                        fontSize:'1em', background:lv.hd }}>
            {lv.level}
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:'1px', background:'#dde3ea' }}>
            {lv.rooms.map(r => <RoomCard key={r.name} room={r} />)}
          </div>
        </div>
      ))}

      {/* ── Match table ── */}
      <div className="glass-card mb-4">
        <div style={{ fontWeight:700, fontSize:'1em', marginBottom:'12px',
                      paddingBottom:'9px', borderBottom:'2px solid #eceff1',
                      display:'flex', alignItems:'center', gap:'8px' }}>
          ✅ ตรวจสอบความสอดคล้องของกิจกรรมกับแหล่งเรียนรู้
          <span style={{ fontSize:'.73em', padding:'2px 10px', borderRadius:'20px',
                         fontWeight:600, background:'#E8F5E9', color:'#1B5E20' }}>
            ตรงทุกรายการ
          </span>
        </div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'.86em' }}>
            <thead>
              <tr>
                <th style={TH}>กิจกรรม</th>
                <th style={TH}>แหล่งเรียนรู้ที่กำหนด</th>
                <th style={TH}>ตำแหน่งที่ใช้จริงในตาราง</th>
                <th style={TH}>ประเภท</th>
                <th style={{ ...TH, width:'70px' }}>สอดคล้อง</th>
              </tr>
            </thead>
            <tbody>
              {MATCH_ROWS.map((r,i) => (
                <tr key={r.type} style={{ background: i%2===1 ? '#fafbfc' : 'white' }}>
                  <td style={TD}>
                    <Pill type={r.type} time="" label={r.act} />
                  </td>
                  <td style={TD}>{r.defined}</td>
                  <td style={TD}>{r.actual}</td>
                  <td style={TD}>
                    <span style={{ display:'inline-block', padding:'2px 10px', borderRadius:'12px',
                                   fontSize:'.83em', fontWeight:600,
                                   background:r.srcStyle.bg, color:r.srcStyle.color }}>
                      {r.src}
                    </span>
                  </td>
                  <td style={{ ...TD, textAlign:'center', color:'#1B5E20', fontWeight:700, fontSize:'1.1em' }}>✔</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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
              {RATIO_ROWS.map((r,i) => {
                const total = r.inC + r.outC;
                const pct   = Math.round((r.inC / total) * 100);
                return (
                  <tr key={r.room} style={{ background: i%2===1 ? '#fafbfc' : 'white' }}>
                    <td style={{ ...TD, fontWeight:700 }}>{r.room}</td>
                    <td style={{ ...TD, textAlign:'center' }}>{r.inC} ครั้ง</td>
                    <td style={{ ...TD, textAlign:'center' }}>{r.outC} ครั้ง</td>
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
                    <td style={{ ...TD, textAlign:'center', color:'#1B5E20', fontWeight:600 }}>✔ เหมาะสม</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Observations ── */}
      <div className="glass-card">
        <div style={{ fontWeight:700, fontSize:'1em', marginBottom:'12px',
                      paddingBottom:'9px', borderBottom:'2px solid #eceff1' }}>
          💡 สรุปข้อสังเกต
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
          {[
            { style:'good', title:'✔ กิจกรรมสอดคล้องกับแหล่งเรียนรู้ทุกรายการ',
              body:'กิจกรรมทั้ง 7 ประเภทถูกจัดในแหล่งเรียนรู้ที่ถูกต้อง เช่น แปลงผัก/พละ/คัดแยกขยะ = นอกอาคาร · ห้อง EF/คอม/แหล่งเรียนรู้ = ในอาคาร · Eng = ในห้องเรียน' },
            { style:'good', title:'✔ ทุกห้องได้ใช้แหล่งเรียนรู้เหมือนกันครบถ้วน',
              body:'แต่ละห้องได้ใช้แหล่งเรียนรู้ครบทั้ง 6 ประเภท (EF · คอม · แหล่งเรียนรู้ · แปลงผัก · คัดแยกขยะ · พละ) โดยหมุนเวียนวันที่ใช้ต่างกัน' },
            { style:'note', title:'📈 กิจกรรมนอกอาคารสม่ำเสมอทุกระดับชั้น',
              body:'ทุกห้องมีกิจกรรมนอกอาคาร 3 ครั้ง/สัปดาห์ เท่ากันทุกระดับ แสดงถึงการให้ความสำคัญกับการเรียนรู้ภาคสนามสม่ำเสมอ' },
            { style:'note', title:'📉 สัดส่วน Eng ลดลงตามระดับชั้น',
              body:'อ.1 = 5 ครั้ง/สัปดาห์ → อ.2 = 3 ครั้ง → อ.3 = 1–2 ครั้ง ทำให้สัดส่วนกิจกรรมนอกห้องเรียนเพิ่มขึ้นตามวัย (73% → 67% → 57–63%)' },
          ].map((c,i) => (
            <div key={i} style={{
              borderRadius:'10px', padding:'12px 14px', fontSize:'.87em', lineHeight:1.65,
              background: c.style === 'good' ? '#E8F5E9' : '#E3F2FD',
              borderLeft: `4px solid ${c.style === 'good' ? '#2E7D32' : '#1565C0'}`,
            }}>
              <div style={{ fontWeight:700, marginBottom:'4px' }}>{c.title}</div>
              {c.body}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
