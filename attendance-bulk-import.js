// =====================================================================
// KinderTrack — ลงเวลามาเรียน "มา" ทุกคน ทุกวันทำการ
// 18 พ.ค. 2569 (2026-05-18) ถึง 30 มิ.ย. 2569 (2026-06-30)
//
// วิธีใช้:
//   1. เปิดแอป KinderTrack ในเบราว์เซอร์แล้ว login
//   2. กด F12 → แท็บ Console
//   3. Copy โค้ดทั้งหมดนี้ วาง แล้วกด Enter
// =====================================================================

(function () {
  const START_DATE = '2026-05-18';
  const END_DATE   = '2026-06-30';

  // ---------- 1. โหลดข้อมูล -----------------------------------------
  const students     = JSON.parse(localStorage.getItem('kt_students')     || '[]');
  const holidays     = JSON.parse(localStorage.getItem('kt_holidays')     || '[]');
  const dailyRecords = JSON.parse(localStorage.getItem('kt_dailyRecords') || '{}');

  if (students.length === 0) {
    alert('❌ ไม่พบข้อมูลนักเรียน กรุณา login ก่อนรัน script นี้');
    return;
  }

  // ---------- 2. สร้างรายการวันทำการ (จันทร์–ศุกร์ ยกเว้นวันหยุด) ----
  const holidaySet = new Set(holidays.map(h => h.date ?? h));
  const workDays = [];
  const d = new Date(START_DATE);
  const end = new Date(END_DATE);

  while (d <= end) {
    const iso = d.toISOString().slice(0, 10); // YYYY-MM-DD
    const dow = d.getDay(); // 0=อาทิตย์, 6=เสาร์
    if (dow !== 0 && dow !== 6 && !holidaySet.has(iso)) {
      workDays.push(iso);
    }
    d.setDate(d.getDate() + 1);
  }

  // ---------- 3. เพิ่ม attendance สำหรับทุกวัน/ทุกคน ----------------
  const studentIds = students.map(s => String(s.id));
  let added = 0;
  let skipped = 0;

  workDays.forEach(date => {
    if (!dailyRecords[date]) dailyRecords[date] = {};
    studentIds.forEach(sid => {
      const existing = dailyRecords[date][sid];
      if (!existing || !existing.attendance) {
        // เพิ่มใหม่หรืออัปเดตถ้ายังไม่มี attendance
        dailyRecords[date][sid] = {
          ...(existing ?? {}),
          attendance: 'มา',
        };
        added++;
      } else {
        // ข้ามถ้ามีข้อมูล attendance อยู่แล้ว (ไม่ทับข้อมูลเดิม)
        skipped++;
      }
    });
  });

  // ---------- 4. บันทึกกลับ localStorage ----------------------------
  localStorage.setItem('kt_dailyRecords', JSON.stringify(dailyRecords));

  alert(
    `✅ เสร็จแล้ว!\n` +
    `📅 วันทำการ: ${workDays.length} วัน (${workDays[0]} ถึง ${workDays[workDays.length-1]})\n` +
    `👧 นักเรียน: ${students.length} คน\n` +
    `✏️  เพิ่มใหม่: ${added} รายการ\n` +
    `⏭️  ข้าม (มีอยู่แล้ว): ${skipped} รายการ\n\n` +
    `กรุณา refresh หน้าเว็บ เพื่อให้ข้อมูลใหม่โหลดเข้าระบบ`
  );

  console.log('✅ ลงเวลามาเรียนเสร็จแล้ว | วันทำการ:', workDays.length, '| นักเรียน:', students.length, '| เพิ่มใหม่:', added);
  console.log('📅 วันแรก:', workDays[0], '| วันสุดท้าย:', workDays[workDays.length-1]);
})();
