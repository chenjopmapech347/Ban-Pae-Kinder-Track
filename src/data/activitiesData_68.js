/**
 * activitiesData_68.js
 * ความเชื่อมโยงระหว่างกิจกรรมหลักปฐมวัยและความสามารถผู้เรียน
 * หลักสูตรการศึกษาปฐมวัย พ.ศ. 2568
 *
 * ใช้ได้กับทุกระดับ (อ.1 / อ.2 / อ.3) เนื่องจากรหัสความสามารถเหมือนกัน
 */

// ─── 6 กิจกรรมหลักตามหลักสูตร ───────────────────────────────────────────────
export const ACTIVITY_TYPES = [
  {
    id: 'A1',
    label: 'กิจกรรมเคลื่อนไหวและจังหวะ',
    icon: '🏃',
    color: '#059669',
    bg: '#ecfdf5',
    border: '#6ee7b7',
    description: 'การเคลื่อนไหวร่างกายประกอบจังหวะดนตรี ท่าทาง และการออกกำลังกาย',
    competencyCodes: ['1.3', '1.4', '2.6', '4.15'],
  },
  {
    id: 'A2',
    label: 'กิจกรรมเสริมประสบการณ์',
    icon: '📚',
    color: '#7c3aed',
    bg: '#f5f3ff',
    border: '#c4b5fd',
    description: 'การเรียนรู้จากสถานการณ์จริง การทดลอง สนทนา และสืบเสาะหาความรู้',
    competencyCodes: ['4.1', '4.2', '4.6', '4.10', '4.11', '4.12', '4.13'],
  },
  {
    id: 'A3',
    label: 'กิจกรรมสร้างสรรค์',
    icon: '🎨',
    color: '#b45309',
    bg: '#fffbeb',
    border: '#fcd34d',
    description: 'งานศิลปะ ปั้น ตัด ระบาย วาด และการแสดงออกเชิงสร้างสรรค์',
    competencyCodes: ['1.4', '2.6', '4.14', '4.15'],
  },
  {
    id: 'A4',
    label: 'กิจกรรมเสรี',
    icon: '🧸',
    color: '#0369a1',
    bg: '#eff6ff',
    border: '#93c5fd',
    description: 'เล่นอิสระ เลือกกิจกรรมเอง ฝึกการตัดสินใจและความสัมพันธ์กับผู้อื่น',
    competencyCodes: ['2.2', '2.3', '2.4', '2.5', '3.1', '3.4', '4.9'],
  },
  {
    id: 'A5',
    label: 'กิจกรรมกลางแจ้ง',
    icon: '🌳',
    color: '#15803d',
    bg: '#f0fdf4',
    border: '#86efac',
    description: 'เล่นนอกอาคาร พัฒนากล้ามเนื้อใหญ่ เรียนรู้ธรรมชาติ',
    competencyCodes: ['1.1', '1.2', '1.3', '3.5', '4.12'],
  },
  {
    id: 'A6',
    label: 'กิจกรรมเกมการศึกษา',
    icon: '🎲',
    color: '#be185d',
    bg: '#fdf2f8',
    border: '#f9a8d4',
    description: 'เกมที่พัฒนาทักษะการคิด การจำแนก จัดกลุ่ม นับ และเรียงลำดับ',
    competencyCodes: ['4.6', '4.7', '4.8', '4.9', '2.5', '3.6', '3.2'],
  },
];

// ─── สร้าง reverse map: competencyCode → activity ids ─────────────────────────
export function buildCompToActivityMap() {
  const map = {};
  ACTIVITY_TYPES.forEach((act) => {
    act.competencyCodes.forEach((code) => {
      if (!map[code]) map[code] = [];
      map[code].push(act.id);
    });
  });
  return map;
}

/** คืน activity objects ที่ส่งเสริมความสามารถรหัสนั้น */
export function getActivitiesForCompetency(code) {
  return ACTIVITY_TYPES.filter((a) => a.competencyCodes.includes(code));
}

/** คืน competency codes ทั้งหมดที่ activity นั้นส่งเสริม */
export function getCompetenciesForActivity(activityId) {
  const act = ACTIVITY_TYPES.find((a) => a.id === activityId);
  return act ? act.competencyCodes : [];
}
