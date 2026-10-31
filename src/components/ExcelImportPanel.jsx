import { useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { ui } from '../ui/ui';

export default function ExcelImportPanel() {
  const { importStudentAssessmentExcel, importQaStandardExcel } = useApp();
  const studentInputRef = useRef(null);
  const qaInputRef = useRef(null);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('success');

  const handleStudentFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMsgType('success');
    setMsg('กำลังนำเข้า...');
    const result = await importStudentAssessmentExcel(file, {
      replace: confirm('แทนที่รายชื่อนักเรียนเดิมทั้งหมด?\nกด OK = แทนที่ | ยกเลิก = ผสานกับรายเดิม'),
    });
    setMsgType(result.ok ? 'success' : 'error');
    setMsg(result.ok ? `✅ ${result.message}` : `❌ ${result.message}`);
    e.target.value = '';
  };

  const handleQaFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMsgType('success');
    setMsg('กำลังนำเข้ามาตรฐาน...');
    const result = await importQaStandardExcel(file);
    setMsgType(result.ok ? 'success' : 'error');
    setMsg(result.ok ? `✅ ${result.message}` : `❌ ${result.message}`);
    e.target.value = '';
  };

  return (
    <div {...ui('glass-card mb-8')}>
      <div {...ui('flex justify-between items-center flex-stack mb-4')}>
        <div>
          <h4 {...ui('mb-2')}>📥 นำเข้า Excel ปี 2568</h4>
          <p {...ui('text-sm text-muted')}>
        รองรับไฟล์ <strong>สรุปผลการประเมินปฐมวัย_2568</strong> และ <strong>สรุปผลมาตรฐานปฐมวัย_2568</strong>
      </p>
        </div>
      </div>
      <div {...ui('flex gap-2 flex-wrap')}>
        <label {...ui('btn', { background: '#eff6ff', cursor: 'pointer' })}>
          นำเข้าประเมินนักเรียน (.xlsx)
          <input
            ref={studentInputRef}
            type="file"
            accept=".xlsx,.xls"
            style={{ display: 'none' }}
            onChange={handleStudentFile}
          />
        </label>
        <label {...ui('btn', { background: '#fef3c7', cursor: 'pointer' })}>
          นำเข้ามาตรฐาน QA (.xlsx)
          <input
            ref={qaInputRef}
            type="file"
            accept=".xlsx,.xls"
            style={{ display: 'none' }}
            onChange={handleQaFile}
          />
        </label>
      </div>
      {msg && (
        <div {...ui(`mt-4 alert ${msgType === 'error' ? 'alert-error' : 'alert-success'} text-sm`)}>
          {msg}
        </div>
      )}
    </div>
  );
}
