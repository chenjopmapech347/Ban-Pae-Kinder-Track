import { useApp } from '../context/AppContext';

export default function QaStandardView() {
  const { qaData } = useApp();

  if (!qaData) {
    return (
      <div className="glass p-8 text-center text-muted">
        <p>ยังไม่มีข้อมูลมาตรฐาน — นำเข้าไฟล์ <strong>สรุปผลมาตรฐานปฐมวัย_2568.xlsx</strong> จากแท็บภาพรวม</p>
      </div>
    );
  }

  const s = qaData.schoolSummary;

  return (
    <div className="flex flex-col gap-6">
      {s && (
        <div className="glass-card" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white' }}>
          <div className="text-sm opacity-90 mb-2">สรุปรายโรงเรียน · ปี 2568</div>
          <div className="text-2xl font-bold mb-4">{s['โรงเรียน'] || s.โรงเรียน}</div>
          <div className="grid grid-3 gap-4">
            <div>
              <div className="text-xs opacity-80">เฉลี่ยรวม</div>
              <div className="text-3xl font-bold">{s['เฉลี่ยรวม%'] ?? s['เฉลี่ยรวม']}%</div>
            </div>
            <div>
              <div className="text-xs opacity-80">ระดับ</div>
              <div className="text-3xl font-bold">{s['ระดับ(A-D)'] ?? s['ระดับ']}</div>
            </div>
            <div>
              <div className="text-xs opacity-80">ระดับคุณภาพ</div>
              <div className="text-xl font-bold">{s['ระดับคุณภาพ']}</div>
            </div>
          </div>
          <div className="grid grid-2 gap-2 mt-4 text-sm">
            <span>มาตรฐาน 1: {s['%มาตรฐาน1']}%</span>
            <span>มาตรฐาน 2: {s['%มาตรฐาน2']}%</span>
            <span>มาตรฐาน 3ข: {s['%มาตรฐาน3ข']}%</span>
            <span>มาตรฐาน 3ก: {s['%มาตรฐาน3ก']}%</span>
          </div>
        </div>
      )}

      {qaData.dashboard?.length > 0 && (
        <div className="glass-card">
          <h4 className="mb-4">Dashboard มาตรฐาน</h4>
          <div className="flex flex-col gap-2">
            {qaData.dashboard.map((d) => (
              <div key={d.label} className="flex justify-between text-sm border-b pb-2">
                <span>{d.label}</span>
                <span className="font-bold">{d.avg}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="p-4 bg-gray-50 font-bold border-b">มาตรฐานที่ 1–2 (ตัวบ่งชี้)</div>
        <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', position: 'sticky', top: 0 }}>
                <th style={{ padding: '0.75rem', textAlign: 'center' }}>มาตรฐาน</th>
                <th style={{ padding: '0.75rem', textAlign: 'center' }}>ตัวบ่งชี้</th>
                <th style={{ padding: '0.75rem' }}>%</th>
              </tr>
            </thead>
            <tbody>
              {qaData.indicators12.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '0.75rem' }}>ม.{row.standard}</td>
                  <td style={{ padding: '0.75rem' }}>{row.indicator.replace(/^ตัวบ่งชี้\s*/, '')}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 'bold' }}>{row.percent}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="p-4 bg-gray-50 font-bold border-b">มาตรฐานที่ 3 ข (ผ่าน/ทั้งหมด)</div>
        <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', position: 'sticky', top: 0 }}>
                <th style={{ padding: '0.75rem', textAlign: 'center' }}>ตัวบ่งชี้</th>
                <th style={{ padding: '0.75rem' }}>ผ่าน</th>
                <th style={{ padding: '0.75rem' }}>%</th>
              </tr>
            </thead>
            <tbody>
              {qaData.indicators3.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '0.75rem' }}>{row.indicator}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>{row.pass}/{row.total}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 'bold' }}>{row.percent}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-muted text-center">
        นำเข้าเมื่อ {new Date(qaData.importedAt).toLocaleString('th-TH')}
      </p>
    </div>
  );
}
