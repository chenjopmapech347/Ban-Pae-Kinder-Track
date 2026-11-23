/** evaluationConstants.js — LEVEL_META, SCORES, SOURCE_ACTIVITY_MAP */
import { INDICATORS_DATA_68 } from './indicatorsData_68';
// ── constants ────────────────────────────────────────────────────────────────
export const LEVEL_META = [
  { level: 'K1', label: 'อนุบาล 1', emoji: '🟢', color: '#059669', bg: '#ecfdf5' },
  { level: 'K2', label: 'อนุบาล 2', emoji: '🟡', color: '#b45309', bg: '#fffbeb' },
  { level: 'K3', label: 'อนุบาล 3', emoji: '🔵', color: '#2563eb', bg: '#eff6ff' },
];
// CLASS_MAP ดึงจาก classMap ใน AppContext (dynamic)

export const SCORES = [
  { value: 3, label: 'ดีมาก',        short: '3', color: '#059669', bg: '#d1fae5', icon: '🟢' },
  { value: 2, label: 'พอใช้',         short: '2', color: '#b45309', bg: '#fef3c7', icon: '🟡' },
  { value: 1, label: 'ต้องพัฒนา',    short: '1', color: '#dc2626', bg: '#fee2e2', icon: '🔴' },
];

// Mapping: แหล่งข้อมูลรายวัน → รหัสกิจกรรม (no) ของหลักสูตร 2568 (indicatorsData_68.js) ที่เชื่อมโยงกัน
// ฉบับร่างจากการอ่านชื่อกิจกรรม — ปรับได้ที่นี่ที่เดียว (ใช้ทั้งปุ่ม "บันทึกกิจกรรมที่เชื่อมโยง" ในประเมินพัฒนาการ
// และระบบเติมอัตโนมัติจากเช็คชื่อใน utils/autoDevelopment.js)
// หมายเหตุ: ตารางเดิมใช้รหัสชุดเก่า (qa-3, std-1 ฯลฯ) ไม่ตรงกับ 49 กิจกรรมของ 2568 เลย จึงเขียนคะแนนลงรหัสที่ไม่มีอยู่จริง
export const SOURCE_ACTIVITY_NO = {
  // ── ข้อมูลรายวัน ──
  tooth:        [6],        // ฟันสะอาด ปากสดใส
  milk:         [2],        // อาหารดี ชีวีสดใส (โภชนาการเหมาะสมวัย)
  lunch:        [5, 30],    // กินดี อยู่ดี (อาหาร 5 หมู่) · กิจวัตร รับประทานอาหาร/ล้างมือด้วยตนเอง
  nutrition:    [1, 3],     // ชั่งน้ำหนัก · วัดส่วนสูง เทียบเกณฑ์กรมอนามัย
  attend:       [34, 26],   // ทำตามกติกาห้องเรียน · มีส่วนร่วมและมีความสุขในกิจกรรม
  pickup:       [21, 18, 28], // ดูแลตัวเอง/ไม่ไปกับคนแปลกหน้า · รู้เท่าทันอันตราย · รอคอยตามลำดับ
  health_check: [30, 6],    // ตรวจสุขภาพ 6 หมวด (ร่างกาย ผม เสื้อผ้า ใบหู ช่องปาก เล็บ): ดูแลความสะอาดตนเอง (30) · ช่องปาก (6) (น้ำหนัก-ส่วนสูง no.1/3 มาจากข้อมูลภาวะโภชนาการ)
  illness:      [],         // คัดกรองอาการป่วย = ข้อมูลสุขภาพ ไม่ใช่หลักฐานพัฒนาการ จึงไม่ผูกกับกิจกรรมใด (เดิมผูกข้อ 30 ซึ่งไม่ตรงเนื้อหา)
  // ── แหล่งเรียนรู้ ──
  outdoor:      [36, 27],   // แหล่งเรียนรู้นอกห้อง — โลกสีเขียว · เรียนรู้ผ่านการทดลอง
  corner:       [26],       // มุมประสบการณ์ในห้อง — เล่นอิสระตามความสนใจ
  // ── กิจกรรมประจำวัน (ระดับห้อง) ──
  morning:      [49],       // ยืนตรงร้องเพลงชาติ ไหว้ กล่าวขอบคุณ-ขอโทษ
  exercise:     [4],        // ออกกำลังกายและเคลื่อนไหวประจำวัน
  circle:       [39],       // สนทนาโต้ตอบกับครูและเพื่อน
  story:        [38],       // เล่านิทาน
  cleanup:      [31],       // ห้องเรียนสะอาด — รับผิดชอบพื้นที่ส่วนรวม
  dressing:     [30],       // แต่งตัวด้วยตนเอง
  art:          [44, 23],   // ศิลปะสร้างสรรค์อิสระ · แสดงออกทางศิลปะและดนตรี
  dance:        [17, 16],   // เต้นตามจังหวะ · โยคะ/ทรงตัว (เดินบนเส้นตรงหรือทรงตัวบนคาน)
  // ── กิจกรรมวันสำคัญ (specialEvents) ──
  events:       [22, 26, 28, 32, 34, 36, 49], // ฉันทำได้ · เล่นอิสระ · กลุ่ม/เกมทีม · ทำตามกติกา · โลกสีเขียว · คนไทยใจงาม
};

// รหัสเต็ม ${domainId}__${stdId}__${indId}__${itemId}__${actNo} ของกิจกรรมหลักสูตร 2568 ตาม no
function buildActIdByNo() {
  const out = {};
  INDICATORS_DATA_68.forEach(d => d.standards.forEach(st => st.indicators.forEach(ind => ind.items.forEach(it => it.activities.forEach(a => {
    out[Number(a.no)] = `${d.id}__${st.id}__${ind.id}__${it.id}__${a.no}`;
  })))));
  return out;
}
const ACT_ID_BY_NO = buildActIdByNo();
export const SOURCE_ACTIVITY_MAP = Object.fromEntries(
  Object.entries(SOURCE_ACTIVITY_NO).map(([src, nos]) => [src, nos.map(n => ACT_ID_BY_NO[n]).filter(Boolean)]),
);

// ── แยกตามมุม/แหล่งเรียนรู้ (รหัสมุม → เลขกิจกรรมหลักสูตร 2568) ───────────────
// แก้ตารางนี้เพื่อเพิ่มรหัสมุมใหม่/เปลี่ยนข้อที่เชื่อมโยง — คีย์ที่ไม่อยู่ในตารางใช้ค่ากลาง corner[26] / outdoor[36,27]
export const CORNER_KEY_ACTIVITY_NO = {   // มุมประสบการณ์ในห้องเรียน → แหล่งข้อมูล `corner:<key>`
  block: [14, 42, 28], lego: [14, 42, 28],
  story: [38, 40, 39],
  science: [43, 27], sci: [43, 27],
  creative: [44, 12, 13, 23],
  roleplay: [45, 29, 28],
  media: [39],
  eng: [39],
};
export const OUTDOOR_KEY_ACTIVITY_NO = {  // แหล่งเรียนรู้นอกห้องเรียน → แหล่งข้อมูล `outdoor:<key>`
  wasteSort: [36, 46, 42], wst: [36, 46, 42],
  organicWaste: [36, 46, 43],
  garden: [36, 43, 47], gar: [36, 43, 47],
  learningRoom: [27, 43, 40], res: [27, 43, 40],
  ef: [42, 28, 34, 24],
  computerRoom: [42], com: [42],
  trafficSign: [20, 18],
  pe: [4, 8, 9, 10, 16],
};
