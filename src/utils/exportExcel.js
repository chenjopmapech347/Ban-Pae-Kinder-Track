import * as XLSX from 'xlsx';
import { getQualityText } from './helpers';

function downloadWorkbook(wb, filename) {
  XLSX.writeFile(wb, filename);
}

/** สมุดรายงานรายคน */
export function exportStudentReportExcel(student, topics, schoolName, academicYear) {
  const rows = [
    ['สมุดรายงานประจำตัวเด็กปฐมวัย'],
    ['โรงเรียน', schoolName],
    ['ปีการศึกษา', academicYear],
    ['ชื่อ-สกุล', student.name],
    ['ชั้น', student.level],
    ['อายุ', student.age],
    ['น้ำหนัก (กก.)', student.weight],
    ['ส่วนสูง (ซม.)', student.height],
    [],
    ['ด้านพัฒนาการ', 'ระดับคุณภาพ'],
    ...topics.map((t, i) => [
      `${i + 1}. ด้าน${t.label}`,
      getQualityText(student?.assessments?.summary?.[t.id]),
    ]),
    [],
    ['สถิติการมาเรียน', ''],
    ['มาเรียน (วัน)', student.attendance?.present ?? 0],
    ['ลา/ขาด (วัน)', student.attendance?.absent ?? 0],
    ['รวม (วัน)', student.attendance?.total ?? 0],
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 28 }, { wch: 20 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'รายงาน');
  const safeName = student.name.replace(/[/\\?*[\]]/g, '_').slice(0, 40);
  downloadWorkbook(wb, `KinderTrack-${safeName}.xlsx`);
}

/** รายชื่อนักเรียนทั้งหมด */
export function exportStudentsListExcel(students, topics, schoolName, academicYear) {
  const headers = [
    'ชื่อ-สกุล',
    'ชั้น',
    'อายุ',
    'น้ำหนัก',
    'ส่วนสูง',
    'มาเรียน',
    'ลา/ขาด',
    'รหัสผู้ปกครอง',
    ...topics.map((t) => `ด้าน${t.label}`),
  ];

  const rows = students.map((s) => [
    s.name,
    s.level,
    s.age,
    s.weight,
    s.height,
    s.attendance?.present ?? 0,
    s.attendance?.absent ?? 0,
    s.parentPin ?? '',
    ...topics.map((t) => getQualityText(s.assessments?.summary?.[t.id])),
  ]);

  const ws = XLSX.utils.aoa_to_sheet([
    ['โรงเรียน', schoolName],
    ['ปีการศึกษา', academicYear],
    [],
    headers,
    ...rows,
  ]);
  ws['!cols'] = headers.map(() => ({ wch: 14 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'นักเรียน');
  downloadWorkbook(wb, `KinderTrack-นักเรียน-${academicYear}.xlsx`);
}

// ── helpers ────────────────────────────────────────────────────────────────────
const SCORE_LABEL = { 3: 'ดีมาก', 2: 'พอใช้', 1: 'ต้องพัฒนา' };

function thaiDate() {
  return new Date().toLocaleDateString('th-TH').replace(/\//g, '-');
}

function autoWidth(ws, rows) {
  const maxLen = [];
  rows.forEach(row => row.forEach((cell, ci) => {
    const len = String(cell ?? '').length;
    maxLen[ci] = Math.min(Math.max(maxLen[ci] ?? 8, len + 2), 40);
  }));
  ws['!cols'] = maxLen.map(w => ({ wch: w }));
}

// ── 4. สรุปคะแนนรายนักเรียน ───────────────────────────────────────────────────
// หนึ่งแถวต่อนักเรียน, คอลัมน์ = คะแนนเฉลี่ยแต่ละด้าน (คะแนนล่าสุด)
export function exportClassSummaryExcel(students, assessmentTopics, indicators, activities, schoolName) {
  const real = students
    .filter(s => !s.name.startsWith('(ว่าง)'))
    .sort((a, b) => a.className < b.className ? -1 : a.className > b.className ? 1 : Number(a.id) - Number(b.id));

  const topicAvg = (student, topic) => {
    const inds   = indicators.filter(i => i.domainId === topic.id);
    const scores = inds.flatMap(ind =>
      activities.filter(a => a.indicatorId === ind.id)
                .map(act => student.assessments?.indicators?.[ind.id]?.[act.id]?.score ?? null)
    ).filter(v => v !== null);
    return scores.length ? parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)) : null;
  };

  const headers = ['#', 'รหัสนักเรียน', 'ชื่อ-นามสกุล', 'ห้องเรียน', 'ระดับชั้น',
    ...assessmentTopics.map(t => t.label)];
  const rows = real.map((s, idx) => [
    idx + 1, s.id, s.name, s.className, s.level ?? '',
    ...assessmentTopics.map(t => topicAvg(s, t) ?? ''),
  ]);

  const data = [
    ['โรงเรียน', schoolName ?? ''], ['วันที่ออกรายงาน', thaiDate()], [],
    headers, ...rows,
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);
  autoWidth(ws, data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'สรุปคะแนนนักเรียน');
  downloadWorkbook(wb, `สรุปคะแนนนักเรียน_${schoolName ?? 'โรงเรียน'}_${thaiDate()}.xlsx`);
}

// ── 5. รายละเอียดรายกิจกรรม ──────────────────────────────────────────────────
// หนึ่งแถวต่อนักเรียน-กิจกรรม พร้อมคะแนนครั้งที่ 1–4
export function exportActivityDetailExcel(students, assessmentTopics, indicators, activities, schoolName) {
  const real = students
    .filter(s => !s.name.startsWith('(ว่าง)'))
    .sort((a, b) => a.className < b.className ? -1 : a.className > b.className ? 1 : Number(a.id) - Number(b.id));

  const headers = [
    'รหัสนักเรียน', 'ชื่อ-นามสกุล', 'ห้องเรียน', 'ระดับชั้น',
    'หัวข้อประเมิน', 'รหัสตัวบ่งชี้', 'ตัวบ่งชี้', 'กิจกรรม',
    'ครั้งที่ 1', 'ครั้งที่ 2', 'ครั้งที่ 3', 'ครั้งที่ 4',
  ];

  const rows = [];
  assessmentTopics.forEach(topic => {
    indicators.filter(ind => ind.domainId === topic.id).forEach(ind => {
      activities.filter(act => act.indicatorId === ind.id).forEach(act => {
        real.forEach(s => {
          const sc = s.assessments?.indicators?.[ind.id]?.[act.id];
          const r1 = sc?.r1 != null ? (SCORE_LABEL[sc.r1] ?? sc.r1) : '';
          const r2 = sc?.r2 != null ? (SCORE_LABEL[sc.r2] ?? sc.r2) : '';
          const r3 = sc?.r3 != null ? (SCORE_LABEL[sc.r3] ?? sc.r3) : '';
          const r4 = sc?.r4 != null ? (SCORE_LABEL[sc.r4] ?? sc.r4) : '';
          if (!r1 && !r2 && !r3 && !r4) return;
          rows.push([s.id, s.name, s.className, s.level ?? '',
            topic.label, ind.indicatorCode, ind.label, act.label, r1, r2, r3, r4]);
        });
      });
    });
  });

  const data = [['โรงเรียน', schoolName ?? ''], ['วันที่ออกรายงาน', thaiDate()], [], headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(data);
  autoWidth(ws, data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'รายละเอียดกิจกรรม');
  downloadWorkbook(wb, `รายละเอียดกิจกรรม_${schoolName ?? 'โรงเรียน'}_${thaiDate()}.xlsx`);
}

// ── 6. ประวัติการประเมิน (Audit Log) ─────────────────────────────────────────
export function exportActivityLogExcel(activityLogs) {
  const headers = [
    'วันที่บันทึก', 'เวลา', 'ครั้งที่', 'ห้องเรียน', 'ผู้ประเมิน',
    'หัวข้อ', 'รหัสตัวบ่งชี้', 'กิจกรรม',
    'รวมนักเรียน', 'ที่ประเมิน', 'ดีมาก', 'พอใช้', 'ต้องพัฒนา',
  ];
  const rows = activityLogs.map(log => {
    const d = new Date(log.timestamp);
    return [
      d.toLocaleDateString('th-TH'),
      d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      `ครั้งที่ ${log.round}`,
      log.className,
      log.recordedBy,
      log.topicLabel,
      log.indicatorCode,
      log.activityLabel,
      log.totalStudents,
      log.assessed,
      log.scores?.s3 ?? 0,
      log.scores?.s2 ?? 0,
      log.scores?.s1 ?? 0,
    ];
  });

  const data = [['วันที่ออกรายงาน', thaiDate()], [], headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(data);
  autoWidth(ws, data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'ประวัติการประเมิน');
  downloadWorkbook(wb, `ประวัติการประเมิน_${thaiDate()}.xlsx`);
}

/** บันทึกการมาเรียนรายวัน (ทุกวันที่มีข้อมูล) */
export function exportAttendanceLogExcel(students, dailyRecords, schoolName) {
  const dates = Object.keys(dailyRecords).sort();
  const headers = ['วันที่', 'ชื่อนักเรียน', 'สถานะ', 'นม', 'แปรงฟัน', 'อาหาร'];
  const rows = [];

  dates.forEach((date) => {
    students.forEach((s) => {
      const rec = dailyRecords[date]?.[String(s.id)];
      if (!rec) return;
      rows.push([
        date,
        s.name,
        rec.attendance ?? '',
        rec.milk ? 'ใช่' : '',
        rec.brush ? 'ใช่' : '',
        rec.lunch ?? '',
      ]);
    });
  });

  const ws = XLSX.utils.aoa_to_sheet([
    ['โรงเรียน', schoolName],
    ['รายงานบันทึกรายวัน'],
    [],
    headers,
    ...rows,
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'บันทึกรายวัน');
  downloadWorkbook(wb, 'KinderTrack-บันทึกรายวัน.xlsx');
}
