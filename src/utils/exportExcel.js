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
