// autoDevelopment.js — คะแนนพัฒนาการ/ความสามารถที่ "เติมอัตโนมัติจากการเช็คชื่อ"
//
// เก็บเป็นบันทึกรายวัน (ledger) แยกจากคะแนน r1–r4 ของครู จึงไม่ทับของเดิม:
//   autoDevLedger[className][dateISO] = { p: [studentId,...] (ผู้ที่มาเรียน), s: [sourceKey,...] (แหล่งข้อมูลที่ระบบเติมในวันนั้น),
//                                         e?: { [studentId]: [sourceKey,...] } (ข้อยกเว้นรายคน — สคริปต์ย้อนหลังใช้เมื่อข้อมูลจริงบอกว่าเด็กไม่ได้ทำ เช่น ไม่ดื่มนม) }
// - นักเรียนมา → กิจกรรมพัฒนาการที่เชื่อมกับ s ได้ระดับ 3 (ของวันนั้น)
// - แก้เป็นขาด/ลา/ป่วย → ถูกถอดออกจาก p → ระดับกลับเป็น 0 (ลบเฉพาะที่ระบบเติมเอง คะแนนที่ครูให้ไม่ถูกแตะ)
// - กิจกรรมที่ครูให้คะแนนเองในภาคนั้นแล้ว → ใช้ของครูก่อน (auto เติมเฉพาะที่ยังว่าง)
import { INDICATORS_DATA_68 } from '../data/indicatorsData_68';
import { SOURCE_ACTIVITY_NO, SOURCE_ACTIVITY_MAP } from '../data/evaluationConstants';
import { growthLevelsForTerm } from './reportHelpers';

export const AUTO_LEVEL = 3;

// แหล่งข้อมูลที่ระบบเติมอัตโนมัติตอนบันทึกเช็คชื่อ
export const AUTO_BASE_SOURCES    = ['attend', 'milk', 'lunch', 'tooth', 'illness'];
export const AUTO_ROUTINE_SOURCES = ['morning', 'exercise', 'circle', 'story', 'cleanup', 'dressing', 'dance'];

// ภาคเรียนจากเดือน (ค่าเริ่มต้น: ภาค 1 = พ.ค.–ต.ค., ภาค 2 = พ.ย.–เม.ย. ตรงกับ termDateRange)
export function termOfISO(dateISO) {
  const m = Number(String(dateISO).slice(5, 7));
  return m >= 5 && m <= 10 ? 1 : 2;
}

// แหล่งข้อมูล → รหัสกิจกรรม (no) ของหลักสูตร 2568 ใช้ตารางเดียวกับปุ่ม "บันทึกกิจกรรมที่เชื่อมโยง": SOURCE_ACTIVITY_NO (data/evaluationConstants.js)
const AUTO_SOURCES = [...AUTO_BASE_SOURCES, ...AUTO_ROUTINE_SOURCES, 'health_check', 'outdoor', 'corner'];
export const AUTO_SOURCE_ACTIVITY_NO = Object.fromEntries(AUTO_SOURCES.map(k => [k, SOURCE_ACTIVITY_NO[k] ?? []]));

let _ACT_SOURCES = null; // actId (หลักสูตร 2568) → [sourceKey]
function actSources() {
  if (_ACT_SOURCES) return _ACT_SOURCES;
  const keyByNo = {};
  INDICATORS_DATA_68.forEach(d => d.standards.forEach(st => st.indicators.forEach(ind => ind.items.forEach(it => it.activities.forEach(a => {
    keyByNo[Number(a.no)] = `${d.id}__${st.id}__${ind.id}__${it.id}__${a.no}`;
  })))));
  const idx = {};
  Object.entries(AUTO_SOURCE_ACTIVITY_NO).forEach(([src, nos]) => nos.forEach(n => {
    const k = keyByNo[n];
    if (k) (idx[k] ??= []).push(src);
  }));
  _ACT_SOURCES = idx;
  return idx;
}

/** ภาค → ชุดแหล่งข้อมูลที่นักเรียนคนนี้ "มาเรียนและระบบเติมให้" อย่างน้อย 1 วัน */
export function studentAutoSources(studentId, className, ledger) {
  const out = { 1: new Set(), 2: new Set() };
  const days = ledger?.[className];
  if (!days) return out;
  const sid = String(studentId);
  Object.entries(days).forEach(([date, d]) => {
    if (!d?.p?.some(x => String(x) === sid)) return;
    const t = termOfISO(date);
    const skip = d.e?.[sid];
    (d.s ?? []).forEach(src => { if (!skip?.includes(src)) out[t].add(src); });
  });
  return out;
}

/**
 * คืนสำเนานักเรียนที่เติม auto เข้าไปใน assessments.indicators[ind][actId] เป็นฟิลด์ autoT1/autoT2
 * (ไม่แก้ r1–r4) — reportHelpers.termScoresOf ใช้ฟิลด์นี้เมื่อครูยังไม่มีคะแนนของภาคนั้น
 */
export function withAutoDev(student, ledger) {
  if (!student || !ledger?.[student.className]) return student;
  const srcs = studentAutoSources(student.id, student.className, ledger);
  if (!srcs[1].size && !srcs[2].size) return student;
  const prev = student.assessments?.indicators ?? {};
  const next = { ...prev };
  Object.entries(actSources()).forEach(([actId, sources]) => {
    const t1 = sources.some(s => srcs[1].has(s));
    const t2 = sources.some(s => srcs[2].has(s));
    if (!t1 && !t2) return;
    const indId = actId.split('__').slice(0, 3).join('__');
    const group = { ...(next[indId] ?? {}) };
    group[actId] = { ...(group[actId] ?? {}), ...(t1 ? { autoT1: AUTO_LEVEL } : {}), ...(t2 ? { autoT2: AUTO_LEVEL } : {}) };
    next[indId] = group;
  });
  return { ...student, assessments: { ...(student.assessments ?? {}), indicators: next } };
}

/**
 * เติมคะแนนกิจกรรมชั่งน้ำหนัก (no.1) / วัดส่วนสูง (no.3) จากข้อมูลภาวะโภชนาการ (nutritionRecords) ตามภาคเรียน
 * ระดับ = ผลเทียบเกณฑ์ที่คำนวณจากน้ำหนัก/ส่วนสูงจริง (1–3) ไม่ใช่ค่าคงที่ — ไม่แตะคะแนนที่ครูให้ (r1–r4)
 */
export function withNutritionDev(student, nutritionRecords, academicYear) {
  if (!student || !nutritionRecords) return student;
  const [weightAct, heightAct] = SOURCE_ACTIVITY_MAP.nutrition ?? [];
  if (!weightAct && !heightAct) return student;
  const next = { ...(student.assessments?.indicators ?? {}) };
  let changed = false;
  [1, 2].forEach(t => {
    const lv = growthLevelsForTerm(student, nutritionRecords, academicYear, t);
    [[weightAct, lv.weightLevel], [heightAct, lv.heightLevel]].forEach(([actId, level]) => {
      if (!actId || !(level > 0)) return;
      const indId = actId.split('__').slice(0, 3).join('__');
      const group = { ...(next[indId] ?? {}) };
      group[actId] = { ...(group[actId] ?? {}), [`autoT${t}`]: level };
      next[indId] = group;
      changed = true;
    });
  });
  return changed ? { ...student, assessments: { ...(student.assessments ?? {}), indicators: next } } : student;
}
