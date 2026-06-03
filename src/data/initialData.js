// ─────────────────────────────────────────────────────────
//  KinderTrack — Seed Data
//  75 นักเรียน (K1×25, K2×25, K3×25) | 10 ครู | 1 Admin | ผู้ปกครอง 75 คน (PIN)
// ─────────────────────────────────────────────────────────

// ── ข้อมูลนักเรียน 75 คน ──────────────────────────────────
export const INITIAL_STUDENTS = [
  // ── K1 (อนุบาล 1) — 25 คน ──
  { id: 1,  name: 'เด็กชายธนกร ใจดี',           level:'K1', age:4, weight:15.2, height:100, parentPin:'1001' },
  { id: 2,  name: 'เด็กหญิงสุพิชญา รักเรียน',   level:'K1', age:3, weight:14.8, height: 98, parentPin:'1002' },
  { id: 3,  name: 'เด็กชายภูมิพัฒน์ มีสุข',     level:'K1', age:4, weight:15.5, height:101, parentPin:'1003' },
  { id: 4,  name: 'เด็กหญิงณัฐธิดา ดีมาก',      level:'K1', age:4, weight:14.5, height: 99, parentPin:'1004' },
  { id: 5,  name: 'เด็กชายวรินทร ขยันดี',        level:'K1', age:3, weight:14.2, height: 97, parentPin:'1005' },
  { id: 6,  name: 'เด็กหญิงปภาวี เจริญสุข',      level:'K1', age:4, weight:14.9, height:100, parentPin:'1006' },
  { id: 7,  name: 'เด็กชายศิรวิชญ์ สมหวัง',     level:'K1', age:4, weight:15.8, height:102, parentPin:'1007' },
  { id: 8,  name: 'เด็กหญิงวริศรา สุขสันต์',    level:'K1', age:3, weight:14.0, height: 96, parentPin:'1008' },
  { id: 9,  name: 'เด็กชายกิตติพัฒน์ มานะดี',   level:'K1', age:4, weight:16.0, height:103, parentPin:'1009' },
  { id: 10, name: 'เด็กหญิงภัทรานิษฐ์ เรืองสุข', level:'K1', age:4, weight:14.6, height: 99, parentPin:'1010' },
  { id: 11, name: 'เด็กชายปิยวัฒน์ พัฒนา',      level:'K1', age:3, weight:14.3, height: 97, parentPin:'1011' },
  { id: 12, name: 'เด็กหญิงอรวรรณ สว่างใจ',     level:'K1', age:4, weight:15.1, height:100, parentPin:'1012' },
  { id: 13, name: 'เด็กชายณัฐพล สุขใจ',         level:'K1', age:4, weight:15.4, height:101, parentPin:'1013' },
  { id: 14, name: 'เด็กหญิงชนิสรา มงคลดี',      level:'K1', age:3, weight:13.9, height: 96, parentPin:'1014' },
  { id: 15, name: 'เด็กชายอธิชา พรดี',           level:'K1', age:4, weight:15.7, height:102, parentPin:'1015' },
  { id: 16, name: 'เด็กหญิงสิริมา วงศ์ดี',      level:'K1', age:4, weight:14.7, height: 99, parentPin:'1016' },
  { id: 17, name: 'เด็กชายชนินทร์ ศรีดี',       level:'K1', age:3, weight:14.1, height: 97, parentPin:'1017' },
  { id: 18, name: 'เด็กหญิงพิมพ์ชนก แสงทอง',   level:'K1', age:4, weight:14.8, height: 98, parentPin:'1018' },
  { id: 19, name: 'เด็กชายพัชรพล เกษมสุข',      level:'K1', age:4, weight:15.6, height:101, parentPin:'1019' },
  { id: 20, name: 'เด็กหญิงอาภาพร นิลดี',       level:'K1', age:3, weight:14.0, height: 96, parentPin:'1020' },
  { id: 21, name: 'เด็กชายธัญพิสิษฐ์ ขันธ์ดี',  level:'K1', age:4, weight:15.3, height:100, parentPin:'1021' },
  { id: 22, name: 'เด็กหญิงณัชชา สุริยา',       level:'K1', age:4, weight:14.5, height: 99, parentPin:'1022' },
  { id: 23, name: 'เด็กชายรัชชานนท์ เมืองดี',   level:'K1', age:3, weight:14.4, height: 97, parentPin:'1023' },
  { id: 24, name: 'เด็กหญิงกัญญาณัฐ ทองดี',     level:'K1', age:4, weight:15.0, height:100, parentPin:'1024' },
  { id: 25, name: 'เด็กชายนิธิพัฒน์ ศรีสุข',    level:'K1', age:4, weight:15.9, height:102, parentPin:'1025' },

  // ── K2 (อนุบาล 2) — 25 คน ──
  { id: 26, name: 'เด็กหญิงพิชามญชุ์ สุทธิดา',  level:'K2', age:5, weight:16.8, height:107, parentPin:'2001' },
  { id: 27, name: 'เด็กชายภควัต เกษมสุข',       level:'K2', age:5, weight:17.2, height:108, parentPin:'2002' },
  { id: 28, name: 'เด็กหญิงนภัสวรรณ นิลดี',     level:'K2', age:5, weight:16.5, height:106, parentPin:'2003' },
  { id: 29, name: 'เด็กชายปภังกร ใจดี',         level:'K2', age:5, weight:17.5, height:109, parentPin:'2004' },
  { id: 30, name: 'เด็กหญิงอนัญญา รักเรียน',    level:'K2', age:4, weight:16.2, height:105, parentPin:'2005' },
  { id: 31, name: 'เด็กชายวชิรวิทย์ มีสุข',     level:'K2', age:5, weight:17.8, height:110, parentPin:'2006' },
  { id: 32, name: 'เด็กหญิงกัลยาณี ดีมาก',      level:'K2', age:5, weight:16.4, height:106, parentPin:'2007' },
  { id: 33, name: 'เด็กชายธีรภัทร ขยันดี',      level:'K2', age:5, weight:18.0, height:111, parentPin:'2008' },
  { id: 34, name: 'เด็กหญิงปณิดา เจริญสุข',     level:'K2', age:5, weight:16.7, height:107, parentPin:'2009' },
  { id: 35, name: 'เด็กชายอัครพล สมหวัง',       level:'K2', age:5, weight:17.3, height:108, parentPin:'2010' },
  { id: 36, name: 'เด็กหญิงชุติมา สุขสันต์',    level:'K2', age:4, weight:16.0, height:105, parentPin:'2011' },
  { id: 37, name: 'เด็กชายพีรพัฒน์ มานะดี',     level:'K2', age:5, weight:17.6, height:109, parentPin:'2012' },
  { id: 38, name: 'เด็กหญิงวรัญญา เรืองสุข',    level:'K2', age:5, weight:16.3, height:106, parentPin:'2013' },
  { id: 39, name: 'เด็กชายสิรวิชญ์ พัฒนา',      level:'K2', age:5, weight:17.9, height:110, parentPin:'2014' },
  { id: 40, name: 'เด็กหญิงนันทนา สว่างใจ',     level:'K2', age:5, weight:16.6, height:107, parentPin:'2015' },
  { id: 41, name: 'เด็กชายณัฐนนท์ สุขใจ',       level:'K2', age:5, weight:17.1, height:108, parentPin:'2016' },
  { id: 42, name: 'เด็กหญิงสุภัทรา มงคลดี',     level:'K2', age:4, weight:16.1, height:105, parentPin:'2017' },
  { id: 43, name: 'เด็กชายกวินท์ ศรีทอง',       level:'K2', age:5, weight:17.4, height:109, parentPin:'2018' },
  { id: 44, name: 'เด็กหญิงณิชากร พรพิบูล',     level:'K2', age:5, weight:16.9, height:107, parentPin:'2019' },
  { id: 45, name: 'เด็กชายพุทธิพงศ์ สุขสม',     level:'K2', age:5, weight:17.7, height:110, parentPin:'2020' },
  { id: 46, name: 'เด็กหญิงชนาพร เจริญดี',      level:'K2', age:4, weight:16.2, height:105, parentPin:'2021' },
  { id: 47, name: 'เด็กชายกรณิศ มีศรี',         level:'K2', age:5, weight:18.1, height:111, parentPin:'2022' },
  { id: 48, name: 'เด็กหญิงปาลิดา วิไลกุล',     level:'K2', age:5, weight:16.5, height:106, parentPin:'2023' },
  { id: 49, name: 'เด็กชายรุ่งโรจน์ แก้วดี',    level:'K2', age:5, weight:17.0, height:108, parentPin:'2024' },
  { id: 50, name: 'เด็กหญิงอรอนงค์ ทองศรี',     level:'K2', age:5, weight:16.8, height:107, parentPin:'2025' },

  // ── K3 (อนุบาล 3) — 19 คน ──
  { id: 51, name: 'เด็กชายยุรนันท์ นวลจันทร์',    level:'K3', age:6, weight:18.5, height:113, parentPin:'3001' },
  { id: 52, name: 'เด็กชายนาวิน -',               level:'K3', age:6, weight:18.0, height:112, parentPin:'3002' },
  { id: 53, name: 'เด็กชายจิตติพัฒน์ ศรีธาราม',   level:'K3', age:6, weight:19.0, height:115, parentPin:'3003' },
  { id: 54, name: 'เด็กชายภูริภัทร คำนึงคิด',     level:'K3', age:6, weight:17.8, height:111, parentPin:'3004' },
  { id: 55, name: 'เด็กหญิงชุติมา สุตถนอม',       level:'K3', age:6, weight:19.2, height:116, parentPin:'3005' },
  { id: 56, name: 'เด็กหญิงเกวลิน สมหวัง',        level:'K3', age:5, weight:17.5, height:110, parentPin:'3006' },
  { id: 57, name: 'เด็กหญิงวรรณวิสา สายศรี',      level:'K3', age:6, weight:18.8, height:114, parentPin:'3007' },
  { id: 58, name: 'เด็กหญิงอริสรา บุญโส',         level:'K3', age:6, weight:18.2, height:112, parentPin:'3008' },
  { id: 59, name: 'เด็กหญิงปภาภรณ์ ไกรมาศ',      level:'K3', age:6, weight:19.5, height:117, parentPin:'3009' },
  { id: 60, name: 'เด็กหญิงชาลิสา วงษ์อยู่',      level:'K3', age:6, weight:17.9, height:111, parentPin:'3010' },
  { id: 61, name: 'เด็กหญิงปริญธิดา เปลื้องกลาง', level:'K3', age:6, weight:18.7, height:114, parentPin:'3011' },
  { id: 62, name: 'เด็กชายลีเฮง ยอม',             level:'K3', age:5, weight:17.6, height:110, parentPin:'3012' },
  { id: 63, name: 'เด็กชายนาวิน ห้อง',             level:'K3', age:6, weight:19.3, height:116, parentPin:'3013' },
  { id: 64, name: 'เด็กชายกฤติพงศ์ ศิริวงค์',     level:'K3', age:6, weight:18.1, height:112, parentPin:'3014' },
  { id: 65, name: 'เด็กชายพชธร ธรรมหลวง',         level:'K3', age:6, weight:18.4, height:113, parentPin:'3015' },
  { id: 66, name: 'เด็กชายนารา เรือง',             level:'K3', age:6, weight:17.7, height:111, parentPin:'3016' },
  { id: 67, name: 'เด็กหญิงปูริดา รู้รอด',         level:'K3', age:6, weight:19.1, height:115, parentPin:'3017' },
  { id: 68, name: 'เด็กชายภูตะวัน พุ่มทรัพย์',    level:'K3', age:6, weight:17.8, height:111, parentPin:'3018' },
  { id: 69, name: 'เด็กหญิงปรารถนา คม',           level:'K3', age:6, weight:18.6, height:114, parentPin:'3019' },
].map(s => ({
  ...s,
  studentId:   s.id,
  assessments: {},
  attendance:  {
    present: Math.floor(160 + Math.random() * 35),
    absent:  Math.floor(2  + Math.random() * 12),
    total:   199,
  },
}));

// ── ข้อมูลครู 10 คน + PIN แต่ละคน ──────────────────────────
export const INITIAL_TEACHERS = [
  { id: 1,  name: 'คุณครูชลดา เมืองใจ',      level:'K1', status:'Active', email:'chalada@school.ac.th',    pin:'kru01', username:'chalada'  },
  { id: 2,  name: 'คุณครูวิภาพร สุขสม',       level:'K1', status:'Active', email:'vipaporn@school.ac.th',   pin:'kru02', username:'vipaporn' },
  { id: 3,  name: 'คุณครูนภาพร ดีเลิศ',       level:'K2', status:'Active', email:'napaporn@school.ac.th',   pin:'kru03', username:'napaporn' },
  { id: 4,  name: 'คุณครูสมชาย รักษ์ดี',      level:'K2', status:'Active', email:'somchai@school.ac.th',    pin:'kru04', username:'somchai'  },
  { id: 5,  name: 'คุณครูอรุณี แสงทอง',       level:'K3', status:'Active', email:'arunee@school.ac.th',     pin:'kru05', username:'arunee'   },
  { id: 6,  name: 'คุณครูพรทิพย์ มงคลชัย',    level:'K3', status:'Active', email:'porntip@school.ac.th',    pin:'kru06', username:'porntip'  },
  { id: 7,  name: 'คุณครูสุมาลี ปัญญาดี',     level:'K1', status:'Active', email:'sumalee@school.ac.th',    pin:'kru07', username:'sumalee'  },
  { id: 8,  name: 'คุณครูธีรยุทธ ใจงาม',      level:'K2', status:'Active', email:'teerayut@school.ac.th',   pin:'kru08', username:'teerayut' },
  { id: 9,  name: 'คุณครูปิยะนุช สุวรรณดี',   level:'K3', status:'Active', email:'piyanuch@school.ac.th',   pin:'kru09', username:'piyanuch' },
  { id: 10, name: 'คุณครูเกียรติศักดิ์ ดีงาม', level:'K2', status:'Active', email:'kiat@school.ac.th',       pin:'kru10', username:'kiat'     },
];

// ── โรงเรียน ──────────────────────────────────────────────
export const INITIAL_SCHOOLS = [
  {
    id: 1,
    name: 'โรงเรียนเทศบาลบ้านเพ ๑',
    address: 'ต.บ้านเพ อ.เมือง จ.ระยอง 21160',
    phone: '038-651234',
    principal: 'ผอ.สมชาย ใจดี',
  },
];

// ── ห้องเรียน ─────────────────────────────────────────────
export const INITIAL_CLASSES = [
  { id: 1, name: 'อนุบาล 1 (K1)', count: 25 },
  { id: 2, name: 'อนุบาล 2 (K2)', count: 25 },
  { id: 3, name: 'อนุบาล 3 (K3)', count: 19 },
];

// ── วันหยุด ───────────────────────────────────────────────
export const INITIAL_HOLIDAYS = [
  { id: 1,  date: '01/01/2568', label: 'วันขึ้นปีใหม่',           type: 'Holiday' },
  { id: 2,  date: '13/04/2568', label: 'วันสงกรานต์ (วันที่ 1)', type: 'Holiday' },
  { id: 3,  date: '14/04/2568', label: 'วันสงกรานต์ (วันที่ 2)', type: 'Holiday' },
  { id: 4,  date: '15/04/2568', label: 'วันสงกรานต์ (วันที่ 3)', type: 'Holiday' },
  { id: 5,  date: '01/05/2568', label: 'วันแรงงานแห่งชาติ',      type: 'Holiday' },
  { id: 6,  date: '05/05/2568', label: 'วันฉัตรมงคล',            type: 'Holiday' },
  { id: 7,  date: '12/08/2568', label: 'วันแม่แห่งชาติ',         type: 'Holiday' },
  { id: 8,  date: '23/10/2568', label: 'วันปิยมหาราช',           type: 'Holiday' },
  { id: 9,  date: '05/12/2568', label: 'วันพ่อแห่งชาติ',         type: 'Holiday' },
  { id: 10, date: '10/12/2568', label: 'วันรัฐธรรมนูญ',          type: 'Holiday' },
  { id: 11, date: '31/12/2568', label: 'วันสิ้นปี',              type: 'Holiday' },
];

// ── หัวข้อประเมิน 4 ด้าน ──────────────────────────────────
export const DEFAULT_ASSESSMENT_TOPICS = [
  { id: 'physical',  label: 'ร่างกาย',      emoji: '🏃' },
  { id: 'emotional', label: 'อารมณ์-จิตใจ', emoji: '❤️' },
  { id: 'social',    label: 'สังคม',         emoji: '🤝' },
  { id: 'mental',    label: 'สติปัญญา',      emoji: '💡' },
];

// ── ประกาศ ────────────────────────────────────────────────
export const DEFAULT_ANNOUNCEMENTS = [
  { id: 1, date: '01/06/2568', title: 'ยินดีต้อนรับนักเรียนทั้ง 75 คน เข้าสู่ปีการศึกษา 2568 🎉' },
  { id: 2, date: '01/06/2568', title: 'ระบบ KinderTrack พร้อมใช้งานแล้ว — ครูสามารถเช็คชื่อและบันทึกพัฒนาการได้ทันที' },
  { id: 3, date: '31/05/2568', title: 'แจ้งผู้ปกครอง: รหัส PIN สำหรับดูรายงานบุตรหลาน อยู่ที่เมนูนักเรียน (Admin)' },
];

// ── ปีการศึกษา ────────────────────────────────────────────
export const DEFAULT_ACADEMIC_YEARS = ['2567', '2568', '2569'];

// ── Auth Config (PIN fallback) ────────────────────────────
export const DEFAULT_AUTH_CONFIG_OVERRIDE = {
  admin:   { pin: 'admin2568', name: 'ผู้ดูแลระบบ' },
  teacher: { pin: 'kru01',    name: 'คุณครูชลดา เมืองใจ', teacherId: 1 },
};
