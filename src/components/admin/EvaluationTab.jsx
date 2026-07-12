import { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { callClaude, buildActivitySuggestionPrompt } from '../../utils/aiHelper';

// ── constants ────────────────────────────────────────────────────────────────
const LEVEL_META = [
  { level: 'K1', label: 'อนุบาล 1', emoji: '🟢', color: '#059669', bg: '#ecfdf5' },
  { level: 'K2', label: 'อนุบาล 2', emoji: '🟡', color: '#b45309', bg: '#fffbeb' },
  { level: 'K3', label: 'อนุบาล 3', emoji: '🔵', color: '#2563eb', bg: '#eff6ff' },
];
// CLASS_MAP ดึงจาก classMap ใน AppContext (dynamic)

const SCORES = [
  { value: 3, label: 'ดีมาก',        short: '3', color: '#059669', bg: '#d1fae5', icon: '🟢' },
  { value: 2, label: 'พอใช้',         short: '2', color: '#b45309', bg: '#fef3c7', icon: '🟡' },
  { value: 1, label: 'ต้องพัฒนา',    short: '1', color: '#dc2626', bg: '#fee2e2', icon: '🔴' },
];

// Mapping: ข้อมูลกิจกรรมรายวัน → activityId ที่เชื่อมโยงในหลักสูตร
// actId format: ${domainId}__${stdId}__${indId}__${itemId}__${actNo}
const SOURCE_ACTIVITY_MAP = {
  tooth: [
    'physical__qa-3__3.2__3.2.1__7',   // "ฟ ฟันสะอาดจัง" — แปรงฟันอย่างถูกวิธีหลังอาหาร (ดย.3.2)
    'physical__std-1__1.2__1.2.1__5',  // แปรงฟันอย่างถูกวิธีได้ด้วยตนเอง (หลักสูตร 1.2)
  ],
  milk: [
    'physical__qa-3__3.1__3.1.1__3',   // กิจกรรมนมโรงเรียน — ส่งเสริมการดื่มนม (ดย.3.1)
  ],
  lunch: [
    'physical__qa-3__3.2__3.2.1__8',   // "อาหารดีมีประโยชน์" — เลือกรับประทานอาหาร 5 หมู่ (ดย.3.2)
    'physical__std-1__1.2__1.2.1__3',  // รับประทานอาหารที่มีประโยชน์และดื่มน้ำสะอาด (หลักสูตร 1.2)
    'physical__std-1__1.2__1.2.1__4',  // ล้างมือก่อนรับประทานอาหารและหลังใช้ห้องน้ำ (หลักสูตร 1.2)
    'social__qa-5__5.1__5.1.1__2',     // รับประทานอาหารด้วยตนเองและมีมารยาทที่ดี (ดย.5.1)
    'social__std-6__6.1__6.1.1__2',    // รับประทานอาหารด้วยตนเองและมีมารยาท (หลักสูตร 6.1)
    'social__std-6__6.3__6.3.1__6',    // ประหยัดและพอเพียงในการรับประทานอาหาร (หลักสูตร 6.3)
    'social__std-6__6.3__6.3.1__7',    // ไม่ทิ้งอาหารโดยเปล่าประโยชน์ (หลักสูตร 6.3)
  ],
  nutrition: [
    'physical__qa-3__3.1__3.1.1__1',   // ชั่งน้ำหนักและบันทึกผลเปรียบเทียบกับเกณฑ์กรมอนามัย (ดย.3.1)
    'physical__qa-3__3.1__3.1.2__4',   // วัดส่วนสูงและบันทึกผลเปรียบเทียบกับเกณฑ์กรมอนามัย (ดย.3.1)
    'physical__std-1__1.1__1.1.1__1',  // ชั่งน้ำหนัก วัดส่วนสูง บันทึกและติดตามพัฒนาการ (หลักสูตร 1.1)
  ],

  // ── ข้อมูลการมาเรียน ─────────────────────────────────────────────────────────
  attend: [
    'social__qa-5__5.2__5.2.1__4',      // ปฏิบัติตามกฎกติกาของห้องเรียนได้ (ดย.5.2)
    'social__std-6__6.2__6.2.1__5',     // ปฏิบัติตามกฎกติกาของห้องเรียนและโรงเรียน (หลักสูตร 6.2)
    'mental__std-12__12.1__12.1.1__20', // กระตือรือร้นและมีความสุขในการเข้าร่วมกิจกรรม (หลักสูตร 12.1)
  ],

  // ── ข้อมูลรับกลับบ้าน ────────────────────────────────────────────────────────
  pickup: [
    'physical__qa-3__3.2__3.2.2__11',   // เล่นและทำกิจกรรมต่างๆ อย่างปลอดภัย (ดย.3.2)
    'physical__qa-3__3.2__3.2.2__12',   // ระมัดระวังอันตรายขณะเล่นเครื่องเล่นสนาม (ดย.3.2)
    'physical__std-1__1.3__1.3.1__7',   // เล่นและทำกิจกรรมต่างๆ อย่างปลอดภัย (หลักสูตร 1.3)
    'physical__std-1__1.3__1.3.1__9',   // บอกได้ว่าสิ่งใดปลอดภัยหรืออันตราย (หลักสูตร 1.3)
    'social__qa-5__5.2__5.2.1__5',      // เข้าแถวรอคิวตามลำดับก่อนหลัง (ดย.5.2)
    'social__std-6__6.2__6.2.1__4',     // เข้าแถวตามลำดับก่อนหลังได้ด้วยตนเอง (หลักสูตร 6.2)
    'social__qa-5__5.4__5.4.1__12',     // รู้จักรอคอยตามลำดับอย่างอดทน (ดย.5.4)
  ],

  // ── ข้อมูลตรวจสุขภาพ ─────────────────────────────────────────────────────────
  health_check: [
    'physical__qa-3__3.1__3.1.1__1',   // ชั่งน้ำหนักและบันทึกผลเปรียบเทียบกับเกณฑ์กรมอนามัย (ดย.3.1)
    'physical__qa-3__3.1__3.1.2__4',   // วัดส่วนสูงและบันทึกผลเปรียบเทียบกับเกณฑ์กรมอนามัย (ดย.3.1)
    'physical__std-1__1.1__1.1.1__1',  // ชั่งน้ำหนัก วัดส่วนสูง บันทึกและติดตามพัฒนาการ (หลักสูตร 1.1)
    'physical__qa-3__3.2__3.2.1__6',   // มือสะอาดปราศจากโรค — ล้างมือ 7 ขั้นตอน (ดย.3.2)
    'physical__std-1__1.2__1.2.1__4',  // ล้างมือก่อนรับประทานอาหารและหลังใช้ห้องน้ำ (หลักสูตร 1.2)
  ],

  // ── ข้อมูลคัดกรองอาการป่วย ───────────────────────────────────────────────────
  illness: [
    'physical__qa-3__3.2__3.2.1__6',   // มือสะอาดปราศจากโรค (ดย.3.2)
    'physical__qa-3__3.2__3.2.1__9',   // นอนหลับพักผ่อนเป็นเวลา (ดย.3.2)
    'physical__std-1__1.2__1.2.1__4',  // ล้างมือก่อนรับประทานอาหารและหลังใช้ห้องน้ำ (หลักสูตร 1.2)
    'physical__std-1__1.2__1.2.1__6',  // นอนพักผ่อนเป็นเวลาและเก็บที่นอนด้วยตนเอง (หลักสูตร 1.2)
    'physical__qa-3__3.2__3.2.2__11',  // รู้จักอันตรายและหลีกเลี่ยงสิ่งที่เป็นอันตราย (ดย.3.2)
  ],

  // ── แหล่งเรียนรู้นอกห้อง (cornerRecords) ──────────────────────────────────────
  outdoor: [
    'mental__qa-6__6.2__6.2.2__16',       // ทักษะกระบวนการวิทยาศาสตร์ — สังเกต ทดลอง สรุปผล (ดย.6.2)
    'mental__std-12__12.1__12.1.1__20',   // กระตือรือร้นและมีความสุขในการเข้าร่วมกิจกรรม (หลักสูตร 12.1)
    'mental__std-12__12.2__12.2.1__21',   // ค้นหาคำตอบของข้อสงสัยต่างๆ ตามวิธีของตนเอง (หลักสูตร 12.2)
    'mental__std-12__12.2__12.2.1__22',   // ใช้คำถาม "ทำไม" "อย่างไร" "เมื่อไหร่" (หลักสูตร 12.2)
    'social__std-7__7.1__7.1.1__8',       // ทิ้งขยะได้ถูกที่และแยกขยะเบื้องต้น (หลักสูตร 7.1)
    'social__std-7__7.1__7.1.1__9',       // ดูแลรดน้ำต้นไม้และรักษาสภาพแวดล้อม (หลักสูตร 7.1)
    'social__std-7__7.1__7.1.1__10',      // ไม่ทำลายทรัพยากรธรรมชาติและสิ่งแวดล้อม (หลักสูตร 7.1)
    'physical__qa-3__3.2__3.2.1__10',     // กิจกรรมออกกำลังกายเป็นเวลา (ดย.3.2)
    'physical__qa-3__3.2__3.2.2__12',     // ระมัดระวังอันตรายขณะเล่นเครื่องเล่นสนาม (ดย.3.2)
    'physical__std-1__1.3__1.3.1__7',     // เล่นและทำกิจกรรมต่างๆ อย่างปลอดภัย (หลักสูตร 1.3)
    // GM ดย. 3.3.1 — กล้ามเนื้อมัดใหญ่จากกิจกรรมกลางแจ้ง
    'physical__qa-3__3.3__3.3.1__13',     // ยืนขาเดียวนาน 3 วินาที
    'physical__qa-3__3.3__3.3.1__14',     // กระโดดสองขาขึ้นลงอยู่กับที่
    'physical__qa-3__3.3__3.3.1__15',     // วิ่งแล้วหยุดได้เมื่อสั่ง
    'physical__qa-3__3.3__3.3.1__16',     // รับลูกบอลโดยใช้มือทั้งสองข้าง
    'physical__qa-3__3.3__3.3.1__17',     // โยนลูกบอลไปข้างหน้าโดยยกมือเหนือศีรษะ
    'physical__qa-3__3.3__3.3.1__18',     // เดินขึ้นบันไดสลับเท้า
    'physical__qa-3__3.3__3.3.1__19',     // กระโดดขาเดียวอยู่กับที่
    'physical__qa-3__3.3__3.3.1__20',     // เดินต่อเท้าไปข้างหน้าเป็นเส้นตรง
    'physical__qa-3__3.3__3.3.1__21',     // วิ่งสลับเท้าขึ้นบันได
    'physical__qa-3__3.3__3.3.1__22',     // รับลูกบอลที่กระดอนขึ้นจากพื้น
    'physical__qa-3__3.3__3.3.1__23',     // เดินต่อเท้าถอยหลังเป็นเส้นตรง
    'physical__qa-3__3.3__3.3.1__24',     // กระโดดขาเดียวไปข้างหน้าต่อเนื่อง
    // GM หลักสูตร 2.1.1
    'physical__std-2__2.1__2.1.1__10',    // เดินต่อเท้าไปข้างหน้าเป็นเส้นตรง
    'physical__std-2__2.1__2.1.1__11',    // กระโดดสองขาขึ้นลงอยู่กับที่
    'physical__std-2__2.1__2.1.1__12',    // วิ่งแล้วหยุดได้เมื่อสั่ง
    'physical__std-2__2.1__2.1.1__13',    // รับและโยนลูกบอล
    'physical__std-2__2.1__2.1.1__14',    // ยืนขาเดียวนาน 3 วินาที
    'physical__std-2__2.1__2.1.1__15',    // กระโดดขาเดียวอยู่กับที่
    // การคิดเชิงสังเกต/วิทยาศาสตร์ที่เกิดจากกิจกรรมนอกห้อง
    'mental__qa-6__6.2__6.2.1__8',        // สังเกตสิ่งต่างๆ รอบตัว (ดย.6.2)
    'mental__qa-6__6.2__6.2.1__9',        // จำแนกสิ่งของตามลักษณะ (ดย.6.2)
    'mental__qa-6__6.2__6.2.1__10',       // เปรียบเทียบลักษณะของสิ่งของ (ดย.6.2)
    'mental__qa-6__6.2__6.2.1__11',       // จัดหมวดหมู่สิ่งของ (ดย.6.2)
    'mental__qa-6__6.2__6.2.1__12',       // เรียงลำดับสิ่งของ (ดย.6.2)
    'mental__qa-6__6.2__6.2.1__13',       // จับคู่สิ่งของ (ดย.6.2)
    'mental__std-10__10.3__10.3.1__13',   // คิดแก้ปัญหาในสถานการณ์ต่างๆ (หลักสูตร 10.3)
    'mental__std-10__10.3__10.3.1__14',   // ตัดสินใจเลือกทำสิ่งต่างๆ (หลักสูตร 10.3)
    'mental__std-12__12.1__12.1.1__19',   // สนใจซักถามสัญลักษณ์และตัวเลข (หลักสูตร 12.1)
  ],

  // ── มุมประสบการณ์ในห้อง (innerCornerRecords) ──────────────────────────────────
  corner: [
    'mental__qa-6__6.3__6.3.1__17',       // สร้างผลงานตามความคิดและจินตนาการของตนเอง (ดย.6.3)
    'mental__qa-6__6.3__6.3.1__18',       // นำสื่อและวัสดุต่างๆ มาสร้างสรรค์เป็นชิ้นงานใหม่ (ดย.6.3)
    'mental__std-11__11.1__11.1.1__15',   // สร้างผลงานศิลปะเพื่อสื่อสารความคิดและความรู้สึก (หลักสูตร 11.1)
    'mental__std-11__11.1__11.1.1__16',   // ต่อก้อนไม้หรือบล็อกสร้างสิ่งต่างๆ ตามจินตนาการ (หลักสูตร 11.1)
    'mental__std-11__11.2__11.2.1__17',   // เคลื่อนไหวท่าทางเพื่อสื่อความคิดและความรู้สึก (หลักสูตร 11.2)
    'mental__std-11__11.2__11.2.1__18',   // แสดงบทบาทสมมติตามจินตนาการและประสบการณ์ (หลักสูตร 11.2)
    'emotional__qa-4__4.3__4.3.1__13',    // วาดภาพระบายสีตามจินตนาการอย่างอิสระ (ดย.4.3)
    'emotional__qa-4__4.3__4.3.1__16',    // งานประดิษฐ์สร้างสรรค์จากวัสดุธรรมชาติ (ดย.4.3)
    'emotional__std-4__4.1__4.1.1__7',    // ร้องเพลงและเคลื่อนไหวประกอบเพลงได้ตามจังหวะ (หลักสูตร 4.1)
    'mental__qa-6__6.1__6.1.1__1',        // ส่งเสริมให้เด็กฟัง พูด และสื่อสารได้เหมาะสม (ดย.6.1)
    'social__qa-5__5.4__5.4.1__11',       // เล่นร่วมกับเพื่อนเป็นกลุ่มและรู้จักผลัดกัน (ดย.5.4)
    'social__std-8__8.2__8.2.1__16',      // เล่นและทำงานร่วมกับเพื่อนได้อย่างมีความสุข (หลักสูตร 8.2)
  ],

  // ── กิจกรรมประจำวัน (dailyRoutineRecords — ระดับชั้น) ────────────────────────
  morning: [
    'social__std-7__7.2__7.2.1__12',      // ยืนตรงเพลงชาติ/สวดมนต์ (หลักสูตร 7.2)
    'social__std-7__7.2__7.2.1__11',      // ไหว้ทักทาย (หลักสูตร 7.2)
    'social__qa-5__5.2__5.2.2__7',        // มารยาทไทย (ดย.5.2)
    'social__std-7__7.2__7.2.1__13',      // เข้าร่วมกิจกรรมวัฒนธรรม (หลักสูตร 7.2)
    'emotional__qa-4__4.3__4.3.1__14',    // ดนตรี/เคลื่อนไหวกิจกรรมเช้า (ดย.4.3)
    'emotional__qa-4__4.3__4.3.1__15',    // เคลื่อนไหวร่างกายตามจังหวะ (ดย.4.3)
    'emotional__qa-4__4.1__4.1.1__1',     // อารมณ์ร่าเริงแจ่มใสในการมาโรงเรียน (ดย.4.1)
    'emotional__qa-4__4.1__4.1.1__2',     // แสดงออกทางอารมณ์ได้เหมาะสมกับสถานการณ์ (ดย.4.1)
    'emotional__qa-4__4.1__4.1.1__3',     // ผ่อนคลายจากความเครียดด้วยตนเอง (ดย.4.1)
    'emotional__std-3__3.2__3.2.1__3',    // พูดถึงตนเองและผู้อื่นในทางที่ดี (หลักสูตร 3.2)
    'emotional__std-3__3.2__3.2.1__4',    // ชื่นชมยินดีกับตนเองและผู้อื่น (หลักสูตร 3.2)
    'emotional__std-3__3.2__3.2.1__5',    // รู้สึกดีต่อตนเองและผู้อื่น (หลักสูตร 3.2)
  ],
  exercise: [
    'physical__qa-3__3.1__3.1.2__5',      // กิจกรรมส่งเสริมออกกำลังกาย (ดย.3.1)
  ],
  circle: [
    'mental__std-9__9.1__9.1.1__1',       // สนทนาโต้ตอบในวงกลม (หลักสูตร 9.1)
    'mental__std-9__9.2__9.2.1__6',       // เล่าเรื่องราวในวงกลม (หลักสูตร 9.2)
    'mental__qa-6__6.1__6.1.1__3',        // เล่าเรื่องราวด้วยประโยคสั้นๆ (ดย.6.1)
    'mental__qa-6__6.1__6.1.1__4',        // สนทนาโต้ตอบตามสถานการณ์ (ดย.6.1)
    'mental__std-9__9.1__9.1.1__3',       // ปฏิบัติตามคำสั่ง 2-3 ขั้นตอนได้ (หลักสูตร 9.1)
    'mental__qa-6__6.2__6.2.2__15',       // คณิตศาสตร์เบื้องต้น (ดย.6.2)
    'mental__std-10__10.1__10.1.1__7',    // คิดรวบยอด (หลักสูตร 10.1)
    'mental__std-10__10.1__10.1.1__8',    // จับคู่ (หลักสูตร 10.1)
    'mental__std-10__10.1__10.1.1__9',    // จำแนก (หลักสูตร 10.1)
    'mental__std-10__10.1__10.1.1__10',   // เรียงลำดับ (หลักสูตร 10.1)
    'mental__std-10__10.2__10.2.1__11',   // คิดเหตุผล (หลักสูตร 10.2)
    'mental__std-10__10.2__10.2.1__12',   // คาดเดา (หลักสูตร 10.2)
    'social__std-8__8.2__8.2.1__17',      // รอคิวผลัดกันพูด (หลักสูตร 8.2)
  ],
  story: [
    'mental__qa-6__6.1__6.1.1__2',        // ตอบคำถามจากนิทาน (ดย.6.1)
    'mental__qa-6__6.1__6.1.2__5',        // รักการอ่าน (ดย.6.1)
    'mental__std-9__9.1__9.1.1__2',       // ฟังนิทานตอบคำถาม (หลักสูตร 9.1)
    'mental__qa-6__6.1__6.1.2__7',        // อ่านภาพและสัญลักษณ์ในนิทาน (ดย.6.1)
    'mental__std-9__9.2__9.2.1__4',       // อ่านภาพและสัญลักษณ์ (หลักสูตร 9.2)
  ],
  cleanup: [
    'social__qa-5__5.1__5.1.1__3',        // เก็บของเล่นหลังเลิกเล่น (ดย.5.1)
    'social__std-6__6.2__6.2.1__3',       // เก็บของเล่นตนเอง (หลักสูตร 6.2)
    'social__qa-5__5.2__5.2.1__6',        // ดูแลสิ่งแวดล้อมห้องเรียน (ดย.5.2)
    'emotional__std-5__5.3__5.3.1__14',   // ทำงานที่ได้รับมอบหมายจนสำเร็จ (หลักสูตร 5.3)
    'emotional__std-5__5.3__5.3.1__15',   // ดูแลรักษาสิ่งของและทรัพย์สิน (หลักสูตร 5.3)
  ],
  dressing: [
    'social__qa-5__5.1__5.1.1__1',        // แต่งตัวด้วยตนเอง (ดย.5.1)
    'social__std-6__6.1__6.1.1__1',       // แต่งตัวด้วยตนเอง (หลักสูตร 6.1)
  ],

  // ── กิจกรรมศิลปะ/งานมือ (artRecords) ─────────────────────────────────────────
  // ครอบคลุม FM ที่เกิดจากกิจกรรมวาดภาพ ปั้น ตัด ร้อย พับ ต่อจิ๊กซอว์
  // หมายเหตุ: milestone assessment (วาดรูปคน, เขียนตัวอักษร) ต้องวัดรายบุคคล ไม่อยู่ในกลุ่มนี้
  art: [
    'physical__qa-3__3.3__3.3.2__25',     // จับดินสอได้ถูกต้อง (FM)
    'physical__qa-3__3.3__3.3.2__26',     // ขีดเส้นตรงแนวดิ่งตามแบบ (FM)
    'physical__qa-3__3.3__3.3.2__27',     // ขีดเส้นตรงแนวนอนตามแบบ (FM)
    'physical__qa-3__3.3__3.3.2__28',     // เลียนแบบวาดรูปวงกลม (FM)
    'physical__qa-3__3.3__3.3.2__32',     // กรรไกรตัดกระดาษเป็นเส้นตรง (FM)
    'physical__qa-3__3.3__3.3.2__33',     // ปั้นดินน้ำมันเป็นเส้นยาวแล้วทำเป็นวงแหวน (FM)
    'physical__qa-3__3.3__3.3.2__34',     // พับกระดาษเป็นรูปต่างๆ โดยมีมุม 2 มุม (FM)
    'physical__qa-3__3.3__3.3.2__35',     // พับกระดาษเป็นรูปสามเหลี่ยม (FM)
    'physical__qa-3__3.3__3.3.2__36',     // ร้อยวัสดุที่มีรูขนาดเล็ก (FM)
    'physical__qa-3__3.3__3.3.2__37',     // ประกอบชิ้นส่วนรูปภาพ 5 ชิ้น (FM)
    'physical__qa-3__3.3__3.3.2__38',     // ประกอบชิ้นส่วนรูปภาพ 8 ชิ้น (FM)
    'physical__std-2__2.2__2.2.1__16',    // จับดินสอได้ถูกต้องและขีดเส้นตามแบบ (FM หลักสูตร)
    'physical__std-2__2.2__2.2.1__17',    // ตัดกระดาษเป็นเส้นตรงด้วยกรรไกร (FM หลักสูตร)
    'physical__std-2__2.2__2.2.1__19',    // ปั้นดินน้ำมันเป็นรูปร่างต่างๆ (FM หลักสูตร)
    'physical__std-2__2.2__2.2.1__20',    // ร้อยวัสดุที่มีรูขนาดเล็ก (FM หลักสูตร)
    'physical__std-2__2.2__2.2.1__21',    // ประกอบชิ้นส่วนรูปภาพ (FM หลักสูตร)
    'emotional__qa-4__4.3__4.3.1__13',    // วาดภาพระบายสีตามจินตนาการ (ดย.4.3)
    'emotional__std-4__4.1__4.1.1__6',    // วาดภาพระบายสีอย่างมีความสุข (หลักสูตร 4.1)
    'emotional__std-4__4.1__4.1.1__8',    // งานประดิษฐ์สร้างสรรค์ (หลักสูตร 4.1)
    'mental__qa-6__6.3__6.3.1__19',       // ต่อก้อนไม้หรือบล็อกสร้างสิ่งต่างๆ (ดย.6.3)
    'mental__qa-6__6.3__6.3.1__20',       // เรียงก้อนไม้หรือบล็อก (ดย.6.3)
    'mental__qa-6__6.3__6.3.1__21',       // วาดรูปคนที่มีส่วนประกอบสมบูรณ์ (ดย.6.3)
    'mental__qa-6__6.3__6.3.1__22',       // ปั้นดินน้ำมันหรือแป้งโดว์ตามจินตนาการ (ดย.6.3)
    'mental__qa-6__6.1__6.1.2__6',        // เขียนชื่อตนเองตามแบบ (ดย.6.1)
    'mental__std-9__9.2__9.2.1__5',       // เขียนชื่อตนเองได้ (หลักสูตร 9.2)
  ],

  // ── กิจกรรมเต้น/เคลื่อนไหวในร่ม (dance/yoga) ──────────────────────────────────
  // ครอบคลุม GM ที่เน้นการทรงตัว ประสานร่างกาย จังหวะ
  dance: [
    'physical__qa-3__3.3__3.3.1__13',     // ยืนขาเดียวนาน 3 วินาที (ทรงตัว)
    'physical__qa-3__3.3__3.3.1__14',     // กระโดดสองขาขึ้นลงอยู่กับที่
    'physical__qa-3__3.3__3.3.1__19',     // กระโดดขาเดียวอยู่กับที่
    'physical__qa-3__3.3__3.3.1__20',     // เดินต่อเท้าไปข้างหน้าเป็นเส้นตรง
    'physical__qa-3__3.3__3.3.1__23',     // เดินต่อเท้าถอยหลังเป็นเส้นตรง
    'physical__qa-3__3.3__3.3.1__24',     // กระโดดขาเดียวไปข้างหน้าต่อเนื่อง
    'physical__std-2__2.1__2.1.1__10',    // เดินต่อเท้าไปข้างหน้าเป็นเส้นตรง
    'physical__std-2__2.1__2.1.1__11',    // กระโดดสองขาขึ้นลงอยู่กับที่
    'physical__std-2__2.1__2.1.1__14',    // ยืนขาเดียวนาน 3 วินาที
    'physical__std-2__2.1__2.1.1__15',    // กระโดดขาเดียวอยู่กับที่
    'physical__qa-3__3.1__3.1.2__5',      // กิจกรรมส่งเสริมออกกำลังกายและการเคลื่อนไหวประจำวัน
    'emotional__qa-4__4.3__4.3.1__14',    // เคลื่อนไหวร่างกายตามจังหวะดนตรี (ดย.4.3)
    'emotional__qa-4__4.3__4.3.1__15',    // เคลื่อนไหวร่างกายตามจังหวะ (ดย.4.3)
    'emotional__std-4__4.1__4.1.1__7',    // ร้องเพลงและเคลื่อนไหวประกอบเพลงตามจังหวะ (หลักสูตร 4.1)
    'emotional__std-4__4.1__4.1.1__9',    // เล่นเครื่องดนตรีประกอบจังหวะ (หลักสูตร 4.1)
    'emotional__qa-4__4.1__4.1.1__1',     // อารมณ์ร่าเริงแจ่มใสในกิจกรรมเต้น (ดย.4.1)
    'emotional__qa-4__4.1__4.1.1__2',     // แสดงออกทางอารมณ์ได้เหมาะสมกับสถานการณ์ (ดย.4.1)
    'emotional__qa-4__4.1__4.1.1__3',     // ผ่อนคลายจากความเครียดด้วยการเคลื่อนไหว (ดย.4.1)
    'emotional__std-3__3.2__3.2.1__3',    // พูดถึงตนเองและผู้อื่นในทางที่ดี (หลักสูตร 3.2)
    'emotional__std-3__3.2__3.2.1__4',    // ชื่นชมยินดีกับตนเองและผู้อื่น (หลักสูตร 3.2)
    'emotional__std-3__3.2__3.2.1__5',    // รู้สึกดีต่อตนเองและผู้อื่น (หลักสูตร 3.2)
  ],

  // ── กิจกรรมวันสำคัญ (specialEvents) ──────────────────────────────────────────
  // รวม activityId จากทุก event type (school + national + project) + เพิ่มเติมใหม่
  events: [
    // school events
    'social__qa-5__5.4__5.4.1__10',       // มีความสุขในการเข้าร่วมกิจกรรมของโรงเรียน (ดย.5.4)
    'social__qa-5__5.4__5.4.1__11',       // เล่นร่วมกับเพื่อนและรู้จักผลัดกัน (ดย.5.4)
    'social__qa-5__5.4__5.4.1__13',       // ยืนตรงเมื่อได้ยินเพลงชาติ (ดย.5.4)
    'social__std-7__7.2__7.2.1__13',      // เข้าร่วมกิจกรรมวัฒนธรรมและประเพณี (หลักสูตร 7.2)
    'social__std-8__8.3__8.3.1__19',      // เข้าร่วมกิจกรรมของห้องเรียนและโรงเรียน (หลักสูตร 8.3)
    'emotional__qa-4__4.1__4.1.2__5',     // แสดงออกทางอารมณ์ในกิจกรรมโรงเรียน (ดย.4.1)
    'emotional__qa-4__4.2__4.2.3__11',    // ภาคภูมิใจในกิจกรรมของโรงเรียน (ดย.4.2)
    'emotional__qa-4__4.3__4.3.1__14',    // เคลื่อนไหวตามจังหวะดนตรีในงานเฉลิมฉลอง (ดย.4.3)
    'emotional__qa-4__4.3__4.3.1__15',    // เคลื่อนไหวร่างกายตามจังหวะ (ดย.4.3)
    'social__qa-5__5.3__5.3.1__8',        // ให้ความช่วยเหลือผู้อื่นในโอกาสพิเศษ (ดย.5.3)
    'social__qa-5__5.3__5.3.1__9',        // แสดงน้ำใจในกิจกรรมพิเศษ (ดย.5.3)
    'social__std-8__8.1__8.1.1__14',      // เห็นอกเห็นใจและแบ่งปันในงานพิเศษ (หลักสูตร 8.1)
    'social__std-8__8.1__8.1.1__15',      // ช่วยเหลือเพื่อนในกิจกรรมโรงเรียน (หลักสูตร 8.1)
    'social__std-8__8.3__8.3.1__18',      // ภูมิใจในการเข้าร่วมกิจกรรมของโรงเรียน (หลักสูตร 8.3)
    // national events
    'social__std-7__7.2__7.2.1__11',      // ไหว้ทักทายตามมารยาทไทย (หลักสูตร 7.2)
    'social__std-7__7.2__7.2.1__12',      // ยืนตรงเพลงชาติและเพลงสรรเสริญ (หลักสูตร 7.2)
    'social__qa-5__5.2__5.2.2__7',        // มารยาทไทยในงานพิธี (ดย.5.2)
    'emotional__qa-4__4.2__4.2.1__6',     // ภาคภูมิใจในความเป็นไทย (ดย.4.2)
    'emotional__qa-4__4.2__4.2.2__8',     // รักชาติและสถาบัน (ดย.4.2)
    'emotional__std-5__5.1__5.1.1__10',   // รู้สึกภาคภูมิใจในความเป็นไทย (หลักสูตร 5.1)
    'emotional__std-5__5.1__5.1.1__11',   // รักและหวงแหนความเป็นไทย (หลักสูตร 5.1)
    'emotional__std-5__5.2__5.2.1__12',   // ภาคภูมิใจในวันสำคัญของชาติ (หลักสูตร 5.2)
    'emotional__std-5__5.2__5.2.1__13',   // แสดงออกถึงความรักชาติในกิจกรรม (หลักสูตร 5.2)
    // project events
    'mental__qa-6__6.2__6.2.2__14',       // คิดแก้ปัญหาในโครงการ (ดย.6.2)
    'mental__qa-6__6.2__6.2.2__16',       // ทักษะกระบวนการวิทยาศาสตร์ (ดย.6.2)
    'mental__qa-6__6.3__6.3.1__17',       // สร้างผลงานตามความคิด (ดย.6.3)
    'mental__qa-6__6.3__6.3.1__18',       // สร้างสรรค์ชิ้นงานใหม่ (ดย.6.3)
    'mental__std-12__12.1__12.1.1__20',   // กระตือรือร้นในการเข้าร่วมโครงการ (หลักสูตร 12.1)
    'mental__std-12__12.2__12.2.1__21',   // ค้นหาคำตอบของข้อสงสัย (หลักสูตร 12.2)
    'social__std-7__7.1__7.1.1__9',       // ดูแลรักษาสิ่งแวดล้อมในโครงการ (หลักสูตร 7.1)
    'emotional__qa-4__4.3__4.3.1__13',    // วาดภาพระบายสีในโครงการ (ดย.4.3)
    'emotional__std-5__5.3__5.3.1__14',   // ทำงานโครงการจนสำเร็จ (หลักสูตร 5.3)
    'emotional__std-5__5.3__5.3.1__15',   // รับผิดชอบงานในโครงการ (หลักสูตร 5.3)
  ],
};

function todayISO() { return new Date().toISOString().split('T')[0]; }
function thaiDate(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${Number(y) + 543}`;
}

// ── Daily stats helpers ───────────────────────────────────────────────────────
// คำนวณจำนวนวันและอัตรา % จาก records ที่มี structure:
// { [key]: { className, students: { [sid]: { days: { [day]: value } } } } }
// value: 'H' = ทำ, '' = ไม่ทำ (แต่มา), 'X' = ขาด/ลา/ป่วย (auto-fill)
// → นับเฉพาะวันที่มา ('H' และ '') ใน total; 'X' ข้ามทั้ง total และ done
function computeMonthlyStats(records, studentId, className) {
  let done = 0, total = 0;
  Object.values(records ?? {}).forEach(rec => {
    if (rec.className !== className) return;
    const sData = rec.students?.[String(studentId)];
    if (!sData?.days) return;
    Object.values(sData.days).forEach(v => {
      if (v === 'X') return;   // วันขาด/ลา/ป่วย — ไม่นับในตัวหาร ไม่ลดคะแนน
      total++;
      if (v === 'H') done++;   // นับเฉพาะ 'H' = ทำจริง
    });
  });
  return total > 0 ? { done, total, pct: Math.round(done / total * 100) } : null;
}
// คำนวณจำนวนเดือนที่มีข้อมูลน้ำหนัก/ส่วนสูงของนักเรียนใน nutritionRecords
// done = จำนวนครั้งที่บันทึกของนักเรียนคนนี้, total = จำนวนครั้งที่บันทึกทั้งหมดของห้อง
function computeNutritionStats(records, studentId, className) {
  let done = 0, total = 0;
  Object.values(records ?? {}).forEach(rec => {
    if (rec.className !== className) return;
    total++;
    const sData = rec.students?.[String(studentId)];
    if (sData?.weight != null && sData.weight !== '') done++;
  });
  return total > 0 ? { done, total, pct: Math.round(done / total * 100) } : null;
}

// ── pickupRecords: { [YYYY-MM-DD]: { [studentId]: { note: '✓'|'C'|'X' } } }
// done = วันที่มีการบันทึกรับกลับ (note '✓' หรือ 'C'), total = วันที่บันทึกทั้งหมดของห้อง
function computePickupStats(records, studentId, classStudentIds) {
  let done = 0, total = 0;
  const sidSet = new Set(classStudentIds.map(id => String(id)));
  Object.values(records ?? {}).forEach(dayRec => {
    const hasClassData = Object.keys(dayRec).some(id => sidSet.has(id));
    if (!hasClassData) return;
    total++;
    const rec = dayRec[String(studentId)];
    if (rec?.note && rec.note !== 'X') done++;
  });
  return total > 0 ? { done, total, pct: Math.round(done / total * 100) } : null;
}

// ── healthCheckRecords: { [key]: { className, students: { [sid]: { body, hair, cloth, ear, mouth, nail } } } }
// done = จำนวนครั้งที่ตรวจสุขภาพนักเรียน (มีค่าอย่างน้อย 1 รายการ), total = จำนวนครั้งของห้องนี้
const HEALTH_ITEMS = ['body', 'hair', 'cloth', 'ear', 'mouth', 'nail'];
function computeHealthCheckStats(records, studentId, className) {
  let done = 0, total = 0;
  Object.values(records ?? {}).forEach(rec => {
    if (rec.className !== className) return;
    total++;
    const sData = rec.students?.[String(studentId)];
    if (sData && HEALTH_ITEMS.some(k => sData[k] != null)) done++;
  });
  return total > 0 ? { done, total, pct: Math.round(done / total * 100) } : null;
}

// ── illnessCheckRecords: { [key]: { className, students: { [sid]: { [day]: { v } } } } }
// √=มาปกติ, C/H/D=มาแต่ป่วย, X=ขาด (ไม่นับ), ''=ว่าง (ไม่นับ)
// done = จำนวนวันที่มาและ "ไม่ป่วย" (v==='√'), total = จำนวนวันที่มา (√+C+H+D)
function computeIllnessStats(records, studentId, className) {
  let done = 0, total = 0;
  Object.values(records ?? {}).forEach(rec => {
    if (rec.className !== className) return;
    const sData = rec.students?.[String(studentId)];
    if (!sData) return;
    Object.values(sData).forEach(dayEntry => {
      const v = typeof dayEntry === 'object' ? (dayEntry?.v ?? '') : (dayEntry ?? '');
      if (!v || v === 'X') return; // ว่าง / ขาด — ไม่นับ
      total++;                      // มาเรียน (√, C, H, D)
      if (v === '√') done++;        // ไม่ป่วย
    });
  });
  return total > 0 ? { done, total, pct: Math.round(done / total * 100) } : null;
}

// ── cornerRecords / innerCornerRecords: { [`${className}||${monday}`]: { [sid]: { [cornerKey]: bool } } }
// done = จำนวนสัปดาห์ที่นักเรียนใช้มุมอย่างน้อย 1 มุม, total = จำนวนสัปดาห์ทั้งหมดของห้อง
function computeCornerStats(records, studentId, className) {
  let done = 0, total = 0;
  Object.entries(records ?? {}).forEach(([key, weekData]) => {
    const [cls] = key.split('||');
    if (cls !== className) return;
    total++;
    const sData = weekData[String(studentId)];
    if (sData && Object.values(sData).some(v => v === true)) done++;
  });
  return total > 0 ? { done, total, pct: Math.round(done / total * 100) } : null;
}

// ── specialEvents: { [id]: { scope, participants: { [sid]: bool }, ... } }
// done = จำนวนกิจกรรมที่นักเรียนเข้าร่วม, total = จำนวนกิจกรรมทั้งหมดที่เกี่ยวกับห้องนี้
function computeEventStats(events, studentId, className) {
  let done = 0, total = 0;
  Object.values(events ?? {}).forEach(ev => {
    if (ev.scope !== 'all' && ev.scope !== className) return;
    total++;
    if (ev.participants?.[String(studentId)] === true) done++;
  });
  return total > 0 ? { done, total, pct: Math.round(done / total * 100) } : null;
}

// ── dailyRoutineRecords: { [key]: { className, days: { [dayNum]: { morning, exercise, ... } } } }
// class-level (ไม่แยกรายนักเรียน) — done = จำนวนวันที่ทำกิจกรรมนั้น, total = จำนวนวันทั้งหมดที่บันทึก
function computeRoutineStats(records, className, activityKey) {
  let done = 0, total = 0;
  Object.values(records ?? {}).forEach(rec => {
    if (rec.className !== className) return;
    Object.values(rec.days ?? {}).forEach(dayData => {
      total++;
      if (dayData?.[activityKey] === true) done++;
    });
  });
  return total > 0 ? { done, total, pct: Math.round(done / total * 100) } : null;
}

function pctColor(pct) {
  return pct == null ? '#9ca3af' : pct >= 80 ? '#059669' : pct >= 60 ? '#b45309' : '#dc2626';
}
function pctBg(pct) {
  return pct == null ? '#f3f4f6' : pct >= 80 ? '#d1fae5' : pct >= 60 ? '#fef3c7' : '#fee2e2';
}
function pctToScore(pct) {
  return pct == null ? 3 : pct >= 80 ? 3 : pct >= 60 ? 2 : 1;
}

// ── Step indicator ────────────────────────────────────────────────────────────
function StepBadge({ n, label, active, done }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
      <div style={{
        width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '.72rem', fontWeight: 800,
        background: done ? '#059669' : active ? '#7c3aed' : '#e5e7eb',
        color: done || active ? 'white' : '#9ca3af',
      }}>{done ? '✓' : n}</div>
      <span style={{ fontSize: '.78rem', fontWeight: 700, color: active ? '#7c3aed' : done ? '#059669' : '#9ca3af' }}>
        {label}
      </span>
    </div>
  );
}

// ── Pill selector ─────────────────────────────────────────────────────────────
function PillGroup({ items, selected, onSelect, color = '#7c3aed', bg = '#f5f3ff', getKey, getLabel, getCount }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem' }}>
      {items.map(item => {
        const k = getKey(item);
        const active = selected === k;
        const cnt = getCount?.(item);
        return (
          <div key={k} onClick={() => onSelect(k)} style={{
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '.35rem',
            background: active ? bg : '#f9fafb',
            border: `2px solid ${active ? color : '#e5e7eb'}`,
            borderRadius: '10px', padding: '.28rem .7rem',
            fontWeight: 700, fontSize: '.82rem',
            color: active ? color : '#6b7280',
            transition: 'all .15s',
          }}>
            {getLabel(item)}
            {cnt !== undefined && (
              <span style={{
                background: active ? color : '#e5e7eb',
                color: active ? 'white' : '#6b7280',
                borderRadius: '999px', padding: '0 .35rem', fontSize: '.68rem',
              }}>{cnt}</span>
            )}
          </div>
        );
      })}
      {items.length === 0 && (
        <span style={{ fontSize: '.78rem', color: '#9ca3af', padding: '.3rem' }}>— ไม่มีข้อมูล —</span>
      )}
    </div>
  );
}

// ── AI Panel (แนะนำกิจกรรมรายนักเรียน) ─────────────────────────────────────────
function AISuggestionPanel({ students, assessmentTopics, indicators, activities, aiApiKey }) {
  const [selId,   setSelId]   = useState(null);
  const [aiText,  setAiText]  = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const student = students.find(s => String(s.id) === String(selId));

  const topicScores = useMemo(() => {
    if (!student) return [];
    return assessmentTopics.map(t => {
      const inds = indicators.filter(i => i.domainId === t.id);
      const scores = inds.flatMap(ind =>
        activities.filter(a => a.indicatorId === ind.id)
          .map(act => student.assessments?.indicators?.[ind.id]?.[act.id]?.score ?? null)
      ).filter(v => v !== null);
      return { label: t.label, score: scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null };
    });
  }, [student, assessmentTopics, indicators, activities]);

  async function handleAsk() {
    if (!student || !aiApiKey) return;
    setLoading(true); setError(''); setAiText('');
    try {
      const result = await callClaude(aiApiKey, buildActivitySuggestionPrompt(student, topicScores));
      setAiText(result);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ marginTop: '1.25rem', background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: '14px', padding: '1rem 1.2rem' }}>
      <div style={{ fontSize: '.78rem', fontWeight: 800, color: '#065f46', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '.75rem' }}>
        🤖 AI แนะนำกิจกรรมส่งเสริมพัฒนาการรายนักเรียน
      </div>
      {!aiApiKey ? (
        <div style={{ fontSize: '.82rem', color: '#6b7280', fontStyle: 'italic' }}>ตั้งค่า Claude API Key ในหน้า ตั้งค่า เพื่อใช้งานฟีเจอร์นี้</div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginBottom: '.75rem' }}>
            {students.map(s => (
              <button key={s.id} type="button" onClick={() => { setSelId(String(s.id)); setAiText(''); setError(''); }}
                style={{
                  padding: '.25rem .6rem', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit',
                  border: `1.5px solid ${String(selId) === String(s.id) ? '#059669' : '#d1fae5'}`,
                  background: String(selId) === String(s.id) ? '#d1fae5' : 'white',
                  color: String(selId) === String(s.id) ? '#065f46' : '#374151',
                  fontWeight: String(selId) === String(s.id) ? 700 : 500, fontSize: '.8rem',
                }}>
                {s.name}
              </button>
            ))}
          </div>
          {student && (
            <button type="button" onClick={handleAsk} disabled={loading}
              style={{
                padding: '.4rem 1.1rem', borderRadius: '8px', border: 'none',
                background: '#059669', color: 'white', fontFamily: 'inherit',
                fontWeight: 700, fontSize: '.85rem', cursor: loading ? 'wait' : 'pointer',
                marginBottom: '.75rem',
              }}>
              {loading ? '⏳ กำลังวิเคราะห์…' : `✨ แนะนำกิจกรรมสำหรับ ${student.name}`}
            </button>
          )}
          {error && <div style={{ color: '#dc2626', fontSize: '.82rem', marginBottom: '.5rem' }}>❌ {error}</div>}
          {aiText && (
            <div style={{ background: 'white', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '.8rem 1rem', fontSize: '.85rem', lineHeight: 1.7, color: '#1e293b', whiteSpace: 'pre-wrap' }}>
              {aiText}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Daily context panel (Options 1+2: แสดงสถิติ + เสนอคะแนนอัตโนมัติ) ────────
function DailyContextPanel({
  classStudents,
  toothBrushRecords, lunchRecords, milkRecords, nutritionRecords,
  pickupRecords, healthCheckRecords, illnessCheckRecords,
  cornerRecords, innerCornerRecords, dailyRoutineRecords, specialEvents,
  selClass, onSuggest, onSuggestAll,
}) {
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState('tooth');

  const stats = useMemo(() => {
    const classStudentIds = classStudents.map(s => s.id);
    // กิจกรรมประจำวัน — class-level (เหมือนกันทุกนักเรียนในห้อง)
    const routineStats = {
      morning:  computeRoutineStats(dailyRoutineRecords, selClass, 'morning'),
      exercise: computeRoutineStats(dailyRoutineRecords, selClass, 'exercise'),
      circle:   computeRoutineStats(dailyRoutineRecords, selClass, 'circle'),
      story:    computeRoutineStats(dailyRoutineRecords, selClass, 'story'),
      cleanup:  computeRoutineStats(dailyRoutineRecords, selClass, 'cleanup'),
      dressing: computeRoutineStats(dailyRoutineRecords, selClass, 'dressing'),
      dance:    computeRoutineStats(dailyRoutineRecords, selClass, 'dance'),
    };
    const result = {};
    classStudents.forEach(s => {
      result[s.id] = {
        attend: s.attendance?.total > 0
          ? { done: s.attendance.present, total: s.attendance.total,
              pct: Math.round(s.attendance.present / s.attendance.total * 100) }
          : null,
        tooth:        computeMonthlyStats(toothBrushRecords,  s.id, selClass),
        lunch:        computeMonthlyStats(lunchRecords,        s.id, selClass),
        milk:         computeMonthlyStats(milkRecords,         s.id, selClass),
        nutrition:    computeNutritionStats(nutritionRecords,  s.id, selClass),
        pickup:       computePickupStats(pickupRecords,        s.id, classStudentIds),
        health_check: computeHealthCheckStats(healthCheckRecords, s.id, selClass),
        illness:      computeIllnessStats(illnessCheckRecords, s.id, selClass),
        outdoor:      computeCornerStats(cornerRecords,        s.id, selClass),
        corner:       computeCornerStats(innerCornerRecords,   s.id, selClass),
        art:          computeCornerStats(innerCornerRecords,   s.id, selClass),
        events:       computeEventStats(specialEvents,         s.id, selClass),
        // กิจกรรมประจำวัน — ทุกนักเรียนในห้องได้ค่าเดียวกัน
        ...routineStats,
      };
    });
    return result;
  }, [classStudents, toothBrushRecords, lunchRecords, milkRecords, nutritionRecords,
      pickupRecords, healthCheckRecords, illnessCheckRecords, cornerRecords, innerCornerRecords,
      dailyRoutineRecords, specialEvents, selClass]);

  const SOURCES = [
    { key: 'attend',       label: '✅ มาเรียน' },
    { key: 'tooth',        label: '🪥 แปรงฟัน' },
    { key: 'lunch',        label: '🍱 อาหาร' },
    { key: 'milk',         label: '🥛 นม' },
    { key: 'nutrition',    label: '🥗 โภชนาการ' },
    { key: 'pickup',       label: '🚌 รับกลับบ้าน' },
    { key: 'health_check', label: '🩺 ตรวจสุขภาพ' },
    { key: 'illness',      label: '🤒 ไม่ป่วย' },
    { key: 'outdoor',      label: '🌳 นอกห้อง (GM)' },
    { key: 'corner',       label: '🧩 มุมในห้อง' },
    { key: 'art',          label: '🎨 ศิลปะ (FM)' },
    { key: 'events',       label: '🎉 วันสำคัญ' },
    { key: 'morning',      label: '🌅 กิจกรรมเช้า' },
    { key: 'exercise',     label: '🏃 ออกกำลังกาย' },
    { key: 'dance',        label: '💃 เต้น/โยคะ (GM)' },
    { key: 'circle',       label: '💬 วงกลม' },
    { key: 'story',        label: '📖 เล่านิทาน' },
    { key: 'cleanup',      label: '🧹 เก็บของ' },
    { key: 'dressing',     label: '👗 แต่งตัว' },
  ];

  function handleSuggest() {
    const suggested = {};
    classStudents.forEach(s => {
      const st = stats[s.id]?.[from];
      suggested[s.id] = pctToScore(st?.pct ?? null);
    });
    onSuggest(suggested);
  }

  return (
    <div style={{ marginTop: '1rem', border: '1.5px solid #ddd6fe', borderRadius: '14px', overflow: 'hidden' }}>
      {/* ── Toggle header ── */}
      <button type="button" onClick={() => setOpen(o => !o)} style={{
        width: '100%', textAlign: 'left',
        background: open ? '#f5f3ff' : '#faf5ff',
        border: 'none', padding: '.6rem 1.1rem', cursor: 'pointer', fontFamily: 'inherit',
        display: 'flex', alignItems: 'center', gap: '.6rem',
      }}>
        <span style={{ fontSize: '.78rem', fontWeight: 800, color: '#7c3aed',
          textTransform: 'uppercase', letterSpacing: '.05em' }}>
          📊 ข้อมูลกิจกรรมประจำวัน (เชื่อมโยงตัวบ่งชี้)
        </span>
        <span style={{ marginLeft: 'auto', fontSize: '.82rem', color: '#7c3aed' }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{ padding: '1rem 1.2rem', background: 'white' }}>
          {/* ── Auto-suggest bar ── */}
          <div style={{
            display: 'flex', gap: '.75rem', flexWrap: 'wrap', alignItems: 'center',
            background: '#faf5ff', border: '1.5px solid #ddd6fe', borderRadius: '10px',
            padding: '.6rem 1rem', marginBottom: '1rem',
          }}>
            <span style={{ fontSize: '.78rem', fontWeight: 700, color: '#7c3aed', flexShrink: 0 }}>💡 เสนอคะแนนจาก:</span>
            <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
              {SOURCES.map(src => (
                <button key={src.key} type="button" onClick={() => setFrom(src.key)} style={{
                  padding: '.22rem .65rem', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit',
                  border: `1.5px solid ${from === src.key ? '#7c3aed' : '#e5e7eb'}`,
                  background: from === src.key ? '#ede9fe' : 'white',
                  color: from === src.key ? '#7c3aed' : '#6b7280',
                  fontWeight: 700, fontSize: '.78rem',
                }}>{src.label}</button>
              ))}
            </div>
            <button type="button" onClick={handleSuggest} style={{
              padding: '.28rem .9rem', borderRadius: '8px', border: 'none',
              background: '#7c3aed', color: 'white', fontFamily: 'inherit',
              fontWeight: 700, fontSize: '.8rem', cursor: 'pointer',
            }}>✨ เสนอคะแนนทั้งห้อง</button>
            {SOURCE_ACTIVITY_MAP[from] && (
              <button type="button" onClick={() => {
                const suggested = {};
                classStudents.forEach(s => {
                  const st = stats[s.id]?.[from];
                  suggested[s.id] = pctToScore(st?.pct ?? null);
                });
                onSuggestAll(from, suggested);
              }} style={{
                padding: '.28rem .9rem', borderRadius: '8px', border: 'none',
                background: '#059669', color: 'white', fontFamily: 'inherit',
                fontWeight: 700, fontSize: '.8rem', cursor: 'pointer',
              }}>
                💾 บันทึก {SOURCE_ACTIVITY_MAP[from].length} กิจกรรมที่เชื่อมโยง
              </button>
            )}
            <span style={{ fontSize: '.72rem', color: '#9ca3af' }}>≥80%→3 · 60-79%→2 · &lt;60%→1</span>
          </div>

          {/* ── Stats table ── */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.8rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: '7px 12px', border: '1px solid #e5e7eb', textAlign: 'center', fontWeight: 700 }}>ชื่อ-นามสกุล</th>
                  {SOURCES.map(src => (
                    <th key={src.key} style={{ padding: '7px 10px', border: '1px solid #e5e7eb',
                      textAlign: 'center', fontWeight: 700, minWidth: '100px' }}>
                      {src.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {classStudents.map((s, idx) => (
                  <tr key={s.id} style={{ background: idx % 2 ? '#fafafa' : 'white' }}>
                    <td style={{ padding: '6px 12px', border: '1px solid #e5e7eb', fontWeight: 600 }}>{s.name}</td>
                    {SOURCES.map(src => {
                      const st  = stats[s.id]?.[src.key];
                      const pct = st?.pct ?? null;
                      return (
                        <td key={src.key} style={{ padding: '6px 10px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                          {pct !== null ? (
                            <span style={{
                              background: pctBg(pct), color: pctColor(pct),
                              borderRadius: '6px', padding: '2px 7px',
                              fontWeight: 700, fontSize: '.78rem', display: 'inline-block',
                            }}>{st.done}/{st.total} ({pct}%)</span>
                          ) : (
                            <span style={{ color: '#d1d5db', fontSize: '.75rem' }}>—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ fontSize: '.71rem', color: '#9ca3af', marginTop: '.45rem' }}>
            * รวมทุกเดือนที่บันทึกในปีการศึกษานี้ · 🥗 โภชนาการ = จำนวนครั้งที่วัดน้ำหนัก/ส่วนสูง ÷ ครั้งที่บันทึกทั้งหมดในห้อง · คลิก "เสนอคะแนนทั้งห้อง" เพื่อเติมคะแนนอัตโนมัติ (ครูยังแก้ไขได้)
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function EvaluationTab() {
  const {
    students, setStudents, assessmentTopics, indicators, activities,
    role, user, addActivityLog, aiApiKey, classMap: CLASS_MAP, allClassNames,
    toothBrushRecords, lunchRecords, milkRecords,
    dailyRecords,
    nutritionRecords,
    pickupRecords,
    healthCheckRecords,
    illnessCheckRecords,
    cornerRecords,
    innerCornerRecords,
    dailyRoutineRecords,
    specialEvents,
  } = useApp();

  // teacher lock — auto-set class from user profile
  const isTeacher    = role === 'teacher';
  const teacherLevel = isTeacher ? user?.level : null;
  const teacherClass = isTeacher ? user?.className : null;

  // Step 1 — กิจกรรม
  const [selTopic,     setTopic]     = useState(null);
  const [selIndicator, setIndicator] = useState(null);
  const [selActivity,  setActivity]  = useState(null);

  // Step 2 — ห้อง
  const [selLevel, setLevel] = useState(() => teacherLevel ?? null);
  const [selClass, setClass] = useState(() => teacherClass ?? null);

  // Step 3 — ประเมิน
  const [round,      setRound]      = useState(1);
  const [assessDate, setAssessDate] = useState(todayISO);
  const [results,    setResults]    = useState({});   // { studentId: score (1|2|3|0) }
  const [saved,      setSaved]      = useState(false);

  // filtered indicators + activities
  const topicIndicators = useMemo(
    () => indicators
      .filter(i => i.domainId === selTopic)
      .sort((a, b) => {
        const parse = code => {
          const [maj, min] = String(code ?? '').split('.').map(Number);
          return (maj || 0) * 1000 + (min || 0);
        };
        return parse(a.indicatorCode) - parse(b.indicatorCode);
      }),
    [indicators, selTopic]
  );
  const indActivities = useMemo(
    () => activities.filter(a => a.indicatorId === selIndicator),
    [activities, selIndicator]
  );

  // selected objects
  const actObj = activities.find(a => a.id === selActivity);
  const indObj = indicators.find(i => i.id === selIndicator);
  const topObj = assessmentTopics.find(t => t.id === selTopic);
  const lvMeta = LEVEL_META.find(m => m.level === selLevel);

  // class students
  const classStudents = useMemo(() =>
    students
      .filter(s => s.className === selClass && !s.name.startsWith('(ว่าง)'))
      .sort((a, b) => Number(a.id) - Number(b.id)),
    [students, selClass]
  );

  // นักเรียนที่ขาด/ลา/ป่วย ณ วันที่ประเมิน
  const absentStudentIds = useMemo(() => {
    const dayData = dailyRecords[assessDate] ?? {};
    return new Set(
      Object.entries(dayData)
        .filter(([, v]) => ['ขาด', 'ลา', 'ป่วย'].includes(v?.attendance))
        .map(([id]) => id)
    );
  }, [dailyRecords, assessDate]);

  // load existing scores — แยกตามครั้งที่ประเมิน
  useEffect(() => {
    const init = {};
    if (selActivity && selIndicator && selClass) {
      const dayData = dailyRecords[assessDate] ?? {};
      classStudents.forEach(s => {
        const attendance = dayData[String(s.id)]?.attendance;
        const isAbsent   = ['ขาด', 'ลา', 'ป่วย'].includes(attendance);
        const actData    = s.assessments?.indicators?.[selIndicator]?.[selActivity];
        // ขาด/ลา/ป่วย → default 0 (ไม่ประเมิน), มา → default 3 (ดีมาก)
        init[s.id] = actData?.[`r${round}`] ?? (isAbsent ? 0 : 3);
      });
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSaved(false);
    }
    setResults(init);
  }, [selActivity, selIndicator, selClass, round, classStudents, assessDate, dailyRecords]); // eslint-disable-line react-hooks/exhaustive-deps

  // reset chain when parent changes
  const handleTopicChange = id => { setTopic(id); setIndicator(null); setActivity(null); };
  const handleIndicatorChange = id => { setIndicator(id); setActivity(null); };
  const handleLevelChange = lv => { setLevel(lv); setClass(CLASS_MAP[lv]?.[0] ?? ''); };

  // set score for one student
  const setScore = (studentId, score) => {
    setResults(prev => ({ ...prev, [studentId]: score === prev[studentId] ? 0 : score }));
    setSaved(false);
  };

  // save all — บันทึกคะแนนแยกตามครั้งที่ (r1/r2/r3/r4)
  const handleSaveAll = () => {
    if (!selActivity || !selIndicator) return;
    const now = new Date().toISOString();
    const updated = students.map(s => {
      const score = results[s.id] ?? 0;
      if (!classStudents.find(cs => cs.id === s.id)) return s;
      const prevIndicators = s.assessments?.indicators ?? {};
      const prevIndGroup   = prevIndicators[selIndicator] ?? {};
      const prevActData    = prevIndGroup[selActivity] ?? {};

      // เก็บ r1/r2/r3/r4 แยกกัน + อัปเดต score เป็นค่าล่าสุดที่มีคะแนน
      const newActData = {
        ...prevActData,
        [`r${round}`]: score || null,          // null = ลบครั้งนี้ออก
        [`r${round}_date`]: score ? assessDate : null,
      };
      // หา score ล่าสุดที่ไม่ null (จากครั้งสูงสุด)
      const latestScore = [4,3,2,1].map(r => newActData[`r${r}`]).find(v => v) ?? null;
      if (latestScore) {
        newActData.score   = latestScore;
        newActData.round   = round;
        newActData.date    = assessDate;
        newActData.savedAt = now;
      }

      return {
        ...s,
        assessments: {
          ...(s.assessments ?? {}),
          indicators: {
            ...prevIndicators,
            [selIndicator]: {
              ...prevIndGroup,
              [selActivity]: latestScore ? newActData : undefined,
            },
          },
        },
      };
    });
    setStudents(updated);
    setSaved(true);

    // ── บันทึก Activity Log ──────────────────────────────────
    const scored = classStudents.filter(s => (results[s.id] ?? 0) > 0);
    const s1 = scored.filter(s => results[s.id] === 1).length;
    const s2 = scored.filter(s => results[s.id] === 2).length;
    const s3 = scored.filter(s => results[s.id] === 3).length;
    addActivityLog({
      id:            Date.now(),
      timestamp:     now,
      date:          assessDate,
      round,
      className:     selClass,
      level:         selLevel,
      topicId:       selTopic,
      topicLabel:    topObj?.label ?? '',
      indicatorId:   selIndicator,
      indicatorCode: indObj?.indicatorCode ?? '',
      activityId:    selActivity,
      activityLabel: actObj?.label ?? '',
      recordedBy:    user?.name ?? 'Unknown',
      teacherId:     user?.teacherId ?? null,
      totalStudents: classStudents.length,
      assessed:      scored.length,
      scores:        { s1, s2, s3 },
    });
  };

  // บันทึกคะแนนไปยัง activityId ทั้งหมดที่เชื่อมโยงกับ source (tooth/milk/lunch/nutrition)
  const handleSuggestAll = (source, suggestedScores) => {
    const targetActIds = SOURCE_ACTIVITY_MAP[source];
    if (!targetActIds?.length) return;

    const now = new Date().toISOString();
    const updated = students.map(s => {
      if (!classStudents.find(cs => cs.id === s.id)) return s;
      const score = suggestedScores[s.id] ?? 0;

      // ใช้ immutable pattern — สำเนา indicators แล้ว apply ทุก actId
      let prevIndicators = { ...(s.assessments?.indicators ?? {}) };

      targetActIds.forEach(actId => {
        // indicatorId = 3 segments แรกของ actId (domainId__stdId__indId)
        const indId = actId.split('__').slice(0, 3).join('__');
        const prevIndGroup = prevIndicators[indId] ?? {};
        const prevActData  = prevIndGroup[actId]   ?? {};

        const newActData = {
          ...prevActData,
          [`r${round}`]:       score || null,
          [`r${round}_date`]:  score ? assessDate : null,
        };
        // หาคะแนนล่าสุดที่ไม่ null (r4 → r3 → r2 → r1)
        const latestScore = [4,3,2,1].map(r => newActData[`r${r}`]).find(v => v) ?? null;
        if (latestScore) {
          newActData.score   = latestScore;
          newActData.round   = round;
          newActData.date    = assessDate;
          newActData.savedAt = now;
        }

        prevIndicators = {
          ...prevIndicators,
          [indId]: {
            ...prevIndGroup,
            [actId]: latestScore ? newActData : undefined,
          },
        };
      });

      return {
        ...s,
        assessments: { ...(s.assessments ?? {}), indicators: prevIndicators },
      };
    });
    setStudents(updated);
  };

  // summary
  const doneCount    = classStudents.filter(s => (results[s.id] ?? 0) > 0).length;
  const total        = classStudents.length;
  const progress     = total ? Math.round(doneCount / total * 100) : 0;

  const stepActivity = !!selActivity;
  const stepClass    = !!(selLevel && selClass);

  return (
    <div className="glass p-6 animate-fade">
      <div className="page-header mb-5">
        <h3>📊 ประเมินผลพัฒนาการ</h3>
      </div>

      {/* ── Step bar ── */}
      <div style={{
        display: 'flex', gap: '1.25rem', flexWrap: 'wrap', alignItems: 'center',
        background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '12px',
        padding: '.65rem 1.1rem', marginBottom: '1.5rem',
      }}>
        <StepBadge n="1" label="เลือกกิจกรรม" active={!stepActivity} done={stepActivity} />
        <span style={{ color: '#cbd5e1' }}>›</span>
        <StepBadge n="2" label="เลือกห้องเรียน" active={stepActivity && !stepClass} done={stepActivity && stepClass} />
        <span style={{ color: '#cbd5e1' }}>›</span>
        <StepBadge n="3" label="ประเมินทั้งห้อง" active={stepActivity && stepClass} done={false} />
      </div>

      {/* ═══ STEP 1: เลือกกิจกรรม ═══ */}
      <div style={{
        background: 'white', border: '1.5px solid #e2e8f0',
        borderRadius: '14px', padding: '1rem 1.2rem', marginBottom: '1rem',
        opacity: 1,
      }}>
        <div style={{ fontSize: '.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '.7rem', letterSpacing: '.05em' }}>
          ขั้นที่ 1 — เลือกกิจกรรมที่จะประเมิน
        </div>

        {/* หัวข้อ */}
        <div style={{ marginBottom: '.75rem' }}>
          <label style={{ fontSize: '.77rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '.35rem' }}>
            📂 หัวข้อประเมิน
          </label>
          <PillGroup
            items={assessmentTopics}
            selected={selTopic}
            onSelect={handleTopicChange}
            color="#7c3aed" bg="#f5f3ff"
            getKey={t => t.id}
            getLabel={t => `${t.emoji} ${t.label}`}
            getCount={t => indicators.filter(i => i.domainId === t.id).length}
          />
        </div>

        {/* ตัวบ่งชี้ */}
        {selTopic && (
          <div style={{ marginBottom: '.75rem' }}>
            <label style={{ fontSize: '.77rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '.35rem' }}>
              📋 ตัวบ่งชี้
            </label>
            <PillGroup
              items={topicIndicators}
              selected={selIndicator}
              onSelect={handleIndicatorChange}
              color="#0891b2" bg="#ecfeff"
              getKey={i => i.id}
              getLabel={i => { const txt = i.label.replace(/^ตัวบ่งชี้ที่\s*[\d.]+\s*/u, ''); return `[${i.indicatorCode}] ${txt.length > 45 ? txt.slice(0, 45) + '…' : txt}`; }}
              getCount={i => activities.filter(a => a.indicatorId === i.id).length}
            />
          </div>
        )}

        {/* กิจกรรม */}
        {selIndicator && (
          <div>
            <label style={{ fontSize: '.77rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '.35rem' }}>
              🎯 กิจกรรม
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.45rem' }}>
              {indActivities.map(act => {
                const active = selActivity === act.id;
                return (
                  <div key={act.id} onClick={() => setActivity(act.id)} style={{
                    cursor: 'pointer',
                    background: active ? '#fef3c7' : '#fafafa',
                    border: `2px solid ${active ? '#b45309' : '#e5e7eb'}`,
                    borderRadius: '10px', padding: '.35rem .85rem',
                    display: 'flex', alignItems: 'center', gap: '.4rem',
                    fontWeight: 700, fontSize: '.81rem',
                    color: active ? '#92400e' : '#6b7280',
                    transition: 'all .15s',
                  }}>
                    <span style={{
                      background: active ? '#b45309' : '#e5e7eb',
                      color: active ? 'white' : '#6b7280',
                      borderRadius: '5px', padding: '0 .4rem',
                      fontSize: '.7rem', fontWeight: 800,
                    }}>{act.no}</span>
                    {act.label}
                  </div>
                );
              })}
              {indActivities.length === 0 && (
                <span style={{ fontSize: '.78rem', color: '#9ca3af' }}>— ไม่มีกิจกรรมในตัวบ่งชี้นี้ —</span>
              )}
            </div>
          </div>
        )}

        {/* Banner กิจกรรมที่เลือก */}
        {selActivity && actObj && (
          <div style={{
            marginTop: '.85rem', background: '#fef3c7',
            border: '1.5px solid #fbbf24', borderRadius: '10px',
            padding: '.55rem 1rem', display: 'flex', alignItems: 'center', gap: '.6rem',
          }}>
            <span style={{ fontSize: '1.1rem' }}>✅</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: '.85rem', color: '#92400e' }}>
                กิจกรรมที่เลือก: [{actObj.no}] {actObj.label}
              </div>
              <div style={{ fontSize: '.75rem', color: '#b45309' }}>
                {topObj?.emoji} {topObj?.label} › [{indObj?.indicatorCode}] {indObj?.label}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══ STEP 2: เลือกห้องเรียน ═══ */}
      <div style={{
        background: 'white', border: '1.5px solid #e2e8f0',
        borderRadius: '14px', padding: '1rem 1.2rem', marginBottom: '1rem',
        opacity: stepActivity ? 1 : .45, pointerEvents: stepActivity ? 'auto' : 'none',
      }}>
        <div style={{ fontSize: '.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '.7rem', letterSpacing: '.05em' }}>
          ขั้นที่ 2 — เลือกระดับชั้น & ห้องเรียน
        </div>

        {/* ─ Teacher: เลือกจากห้องทั้งหมด (ไม่ล็อค) ─ */}
        {isTeacher ? (
          <div>
            <label style={{ fontSize: '.77rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '.35rem' }}>
              ห้องเรียน <span style={{ fontWeight: 400, color: '#9ca3af' }}>(เลือกห้องที่ต้องการประเมิน)</span>
            </label>
            <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
              {(allClassNames ?? []).map(cls => {
                const active = selClass === cls;
                const cnt = students.filter(s => s.className === cls && !s.name.startsWith('(ว่าง)')).length;
                return (
                  <div key={cls} onClick={() => setClass(cls)} style={{
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '.3rem',
                    background: active ? '#f5f3ff' : '#f9fafb',
                    border: `2px solid ${active ? '#7c3aed' : '#e5e7eb'}`,
                    borderRadius: '8px', padding: '.25rem .65rem',
                    fontWeight: 700, fontSize: '.82rem',
                    color: active ? '#7c3aed' : '#6b7280',
                    transition: 'all .15s',
                  }}>
                    {cls}
                    <span style={{
                      background: active ? '#7c3aed' : '#e5e7eb',
                      color: active ? 'white' : '#6b7280',
                      borderRadius: '999px', padding: '0 .4rem', fontSize: '.7rem',
                    }}>{cnt}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <>
            {/* ระดับ */}
            <div style={{ marginBottom: '.6rem' }}>
              <label style={{ fontSize: '.77rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '.35rem' }}>ระดับชั้น</label>
              <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
                {LEVEL_META.map(({ level, label, emoji, color, bg }) => {
                  const active = selLevel === level;
                  return (
                    <div key={level} onClick={() => handleLevelChange(level)} style={{
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '.35rem',
                      background: active ? bg : '#f9fafb',
                      border: `2px solid ${active ? color : '#e5e7eb'}`,
                      borderRadius: '10px', padding: '.3rem .75rem',
                      fontWeight: 700, fontSize: '.83rem',
                      color: active ? color : '#6b7280', transition: 'all .15s',
                    }}>
                      {emoji} {label}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ห้อง */}
            {selLevel && (
              <div>
                <label style={{ fontSize: '.77rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '.35rem' }}>ห้องเรียน</label>
                <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
                  {(CLASS_MAP[selLevel] ?? []).map(cls => {
                    const active = selClass === cls;
                    const cnt    = students.filter(s => s.className === cls && !s.name.startsWith('(ว่าง)')).length;
                    return (
                      <div key={cls} onClick={() => setClass(cls)} style={{
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '.3rem',
                        background: active ? lvMeta?.bg ?? '#f5f3ff' : '#f9fafb',
                        border: `2px solid ${active ? lvMeta?.color ?? '#7c3aed' : '#e5e7eb'}`,
                        borderRadius: '8px', padding: '.25rem .65rem',
                        fontWeight: 700, fontSize: '.82rem',
                        color: active ? lvMeta?.color ?? '#7c3aed' : '#6b7280',
                        transition: 'all .15s',
                      }}>
                        {cls}
                        <span style={{
                          background: active ? lvMeta?.color : '#e5e7eb',
                          color: active ? 'white' : '#6b7280',
                          borderRadius: '999px', padding: '0 .4rem', fontSize: '.7rem',
                        }}>{cnt}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ═══ STEP 3: ประเมิน ═══ */}
      {stepActivity && stepClass && (
        <div style={{
          background: 'white', border: `2px solid ${lvMeta?.color ?? '#7c3aed'}30`,
          borderRadius: '14px', padding: '1rem 1.2rem',
        }}>
          <div style={{ fontSize: '.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '.8rem', letterSpacing: '.05em' }}>
            ขั้นที่ 3 — ประเมินผลทั้งห้อง {selClass}
          </div>

          {/* ครั้งที่ + วันที่ */}
          <div style={{
            display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end',
            background: '#f8fafc', border: '1.5px solid #e2e8f0',
            borderRadius: '10px', padding: '.7rem 1rem', marginBottom: '1rem',
          }}>
            <div>
              <label style={{ display: 'block', fontSize: '.73rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '.25rem' }}>ครั้งที่ประเมิน</label>
              <select className="input" style={{ width: '160px' }} value={round} onChange={e => { setRound(Number(e.target.value)); setSaved(false); }}>
                <option value={1}>ภาคเรียน 1 ครั้งที่ 1</option>
                <option value={2}>ภาคเรียน 1 ครั้งที่ 2</option>
                <option value={3}>ภาคเรียน 2 ครั้งที่ 1</option>
                <option value={4}>ภาคเรียน 2 ครั้งที่ 2</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '.73rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '.25rem' }}>วันที่ประเมิน</label>
              <input type="date" className="input" style={{ width: '155px' }}
                value={assessDate} onChange={e => { setAssessDate(e.target.value); setSaved(false); }} />
            </div>
            <div style={{ fontSize: '.8rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
              {thaiDate(assessDate)}
            </div>

            {/* progress */}
            <div style={{ flex: 1, minWidth: '180px', alignSelf: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.73rem', color: lvMeta?.color, marginBottom: '.2rem' }}>
                <span>บันทึกแล้ว {doneCount}/{total} คน</span>
                <span>{progress}%</span>
              </div>
              <div style={{ background: '#e5e7eb', borderRadius: '999px', height: '7px' }}>
                <div style={{ width: `${progress}%`, background: lvMeta?.color, borderRadius: '999px', height: '7px', transition: 'width .3s' }} />
              </div>
            </div>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: '.75rem', marginBottom: '.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>เกณฑ์ระดับ:</span>
            {SCORES.map(s => (
              <span key={s.value} style={{ fontSize: '.75rem', display: 'flex', alignItems: 'center', gap: '.25rem' }}>
                <span style={{ background: s.bg, color: s.color, borderRadius: '6px', padding: '0 .45rem', fontWeight: 800 }}>{s.short}</span>
                {s.label}
              </span>
            ))}
            <span style={{ fontSize: '.75rem', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '.25rem' }}>
              <span style={{ background: '#f3f4f6', color: '#9ca3af', borderRadius: '6px', padding: '0 .45rem', fontWeight: 800 }}>—</span>
              ยังไม่ประเมิน
            </span>
          </div>

          {/* Table */}
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>#</th>
                  <th style={{ width: '80px' }}>รหัส</th>
                  <th>ชื่อ-นามสกุล</th>
                  <th style={{ width: '200px', textAlign: 'center' }}>ผลการประเมิน</th>
                  <th style={{ width: '100px', textAlign: 'center' }}>ผลที่บันทึก</th>
                </tr>
              </thead>
              <tbody>
                {classStudents.map((s, idx) => {
                  const score     = results[s.id] ?? 0;
                  const isAbsent  = absentStudentIds.has(String(s.id));
                  const showAbsent = isAbsent && score === 0;
                  return (
                    <tr key={s.id} className="hover-row" style={{ background: showAbsent ? '#fff5f5' : score > 0 ? SCORES.find(sc => sc.value === score)?.bg + '55' : undefined }}>
                      <td style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '.8rem' }}>{idx + 1}</td>
                      <td>
                        <code style={{ fontSize: '.72rem', background: '#f1f5f9', padding: '.1rem .4rem', borderRadius: '4px', color: '#475569', fontWeight: 700 }}>
                          {s.id}
                        </code>
                      </td>
                      <td style={{ fontWeight: 600 }}>{s.name}{showAbsent && <span style={{ marginLeft:'.4rem', fontSize:'.72rem', background:'#fee2e2', color:'#dc2626', borderRadius:'4px', padding:'0 .35rem', fontWeight:700 }}>{(dailyRecords[assessDate]?.[String(s.id)]?.attendance === 'ป่วย') ? 'ป่วย' : 'ขาด/ลา'}</span>}</td>
                      <td>
                        {showAbsent ? (
                          <div style={{ textAlign:'center' }}>
                            <span style={{ background:'#fee2e2', color:'#dc2626', borderRadius:'8px', padding:'.28rem .9rem', fontWeight:800, fontSize:'.85rem', display:'inline-block', border:'2px solid #fca5a5' }}>
                              ✗ ไม่ได้รับการประเมิน
                            </span>
                          </div>
                        ) : (
                        <div style={{ display: 'flex', gap: '.4rem', justifyContent: 'center' }}>
                          {SCORES.map(sc => {
                            const active = score === sc.value;
                            return (
                              <button key={sc.value} onClick={() => setScore(s.id, sc.value)} style={{
                                border: `2px solid ${active ? sc.color : '#e5e7eb'}`,
                                borderRadius: '8px', padding: '.28rem .7rem',
                                background: active ? sc.bg : 'white',
                                color: active ? sc.color : '#9ca3af',
                                fontWeight: 800, fontSize: '.8rem',
                                cursor: 'pointer', fontFamily: 'inherit',
                                transition: 'all .12s',
                              }}>
                                {sc.icon} {sc.short}
                              </button>
                            );
                          })}
                        </div>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display:'flex', gap:'.2rem', justifyContent:'center', flexWrap:'wrap' }}>
                          {[1,2,3,4].map(r => {
                            const actData = s.assessments?.indicators?.[selIndicator]?.[selActivity];
                            const rs = actData?.[`r${r}`];
                            if (!rs) return null;
                            const sc = SCORES.find(x => x.value === rs);
                            return (
                              <span key={r} title={`ครั้งที่ ${r}: ${sc?.label}`} style={{
                                background: sc?.bg ?? '#f3f4f6', color: sc?.color ?? '#9ca3af',
                                borderRadius: '5px', padding: '0 .38rem',
                                fontSize: '.7rem', fontWeight: 800, whiteSpace: 'nowrap',
                              }}>
                                {r}:{sc?.short ?? '—'}
                              </span>
                            );
                          })}
                          {![1,2,3,4].some(r => s.assessments?.indicators?.[selIndicator]?.[selActivity]?.[`r${r}`]) && (
                            <span style={{ fontSize:'.75rem', color:'#cbd5e1' }}>—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {classStudents.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>ไม่พบข้อมูลนักเรียนในห้องนี้</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ── Daily context panel ── */}
          <DailyContextPanel
            classStudents={classStudents}
            toothBrushRecords={toothBrushRecords}
            lunchRecords={lunchRecords}
            milkRecords={milkRecords}
            nutritionRecords={nutritionRecords}
            pickupRecords={pickupRecords}
            healthCheckRecords={healthCheckRecords}
            illnessCheckRecords={illnessCheckRecords}
            cornerRecords={cornerRecords}
            innerCornerRecords={innerCornerRecords}
            dailyRoutineRecords={dailyRoutineRecords}
            specialEvents={specialEvents}
            selClass={selClass}
            onSuggest={suggested => { setResults(prev => ({ ...prev, ...suggested })); setSaved(false); }}
            onSuggestAll={handleSuggestAll}
          />

          {/* Save bar */}
          <div style={{
            marginTop: '1rem', display: 'flex', alignItems: 'center',
            gap: '1rem', justifyContent: 'flex-end', flexWrap: 'wrap',
          }}>
            {saved && (
              <span style={{ fontSize: '.82rem', color: '#059669', fontWeight: 700 }}>
                ✅ บันทึกเรียบร้อย {thaiDate(assessDate)}
              </span>
            )}
            <button className="btn" onClick={() => {
              const reset = {};
              classStudents.forEach(s => { reset[s.id] = 0; });
              setResults(reset); setSaved(false);
            }} style={{ color: 'var(--danger)' }}>
              🔄 รีเซ็ต
            </button>
            <button className="btn btn-primary" onClick={handleSaveAll}
              style={{ minWidth: '160px', fontSize: '.9rem', padding: '.55rem 1.2rem' }}>
              💾 บันทึกผลทั้งห้อง ({doneCount}/{total})
            </button>
          </div>
        </div>
      )}

      {/* ── AI Suggestion Panel ── */}
      {stepClass && classStudents.length > 0 && (
        <AISuggestionPanel
          students={classStudents}
          assessmentTopics={assessmentTopics}
          indicators={indicators}
          activities={activities}
          aiApiKey={aiApiKey}
        />
      )}

      {/* Placeholder ถ้ายังไม่ครบ step */}
      {(!stepActivity || !stepClass) && (
        <div style={{ textAlign: 'center', padding: '2.5rem', color: '#cbd5e1', fontSize: '.9rem' }}>
          {!stepActivity ? '👆 เริ่มจากการเลือกหัวข้อ ตัวบ่งชี้ และกิจกรรมด้านบน' : '👆 เลือกระดับชั้นและห้องเรียน'}
        </div>
      )}
    </div>
  );
}
