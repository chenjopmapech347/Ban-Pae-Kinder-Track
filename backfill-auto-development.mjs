/**
 * backfill-auto-development.mjs
 * ย้อนหลัง: สร้างบันทึก "พัฒนาการ/ความสามารถที่ระบบเติมจากข้อมูลรายวัน" (autoDevLedger) จากข้อมูลที่มีอยู่แล้ว
 * เพื่อให้ ประเมินผลพัฒนาการ (สมุดรายงาน อ.01) และ ประเมินความสามารถผู้เรียน หลักสูตร 2568 คำนวณจากข้อมูลย้อนหลังด้วย
 * (กติกาเดียวกับที่ระบบใช้ตอนบันทึกเช็คชื่อ — ดู src/utils/autoDevelopment.js)
 *
 * อ้างอิงข้อมูลจริงรายวัน — เด็กที่ "มา" ในวันนั้นจะได้ระดับ 3 ในกิจกรรมที่เชื่อมกับแหล่งข้อมูลต่อไปนี้ "เมื่อมีหลักฐานในวันนั้น":
 *   มาเรียน (attend)           : เช็คชื่อ = มา
 *   นม / อาหารกลางวัน / แปรงฟัน : ช่องวันนั้นเป็น √   (ว่าง/X = ไม่ได้ทำ → ไม่ให้ และบันทึกเป็นข้อยกเว้นรายคน)
 *   คัดกรองป่วย (illness)       : ช่องวันนั้นเป็น √   (C/D = ป่วย → ไม่ให้)
 *   ตรวจสุขภาพ (health_check)   : มีผลตรวจของวันนั้น (ค่าไม่ว่าง)
 *   กิจกรรมประจำวัน (แต่งตัว/เช้า/ออกกำลังกาย/วงกลม/นิทาน/เก็บของ/เต้น) : ติ๊กของห้องวันนั้น = true
 *   แหล่งเรียนรู้นอกห้อง / มุมในห้อง : วันนั้นมีกิจกรรมกำหนดไว้ในตารางห้อง และสัปดาห์นั้นนักเรียนถูกติ๊กอย่างน้อย 1 ช่อง
 * คะแนนที่ครูให้เองใน r1–r4 ไม่ถูกแตะ — ระบบใช้คะแนนของครูก่อน ค่าอัตโนมัติเติมเฉพาะกิจกรรมที่ภาคนั้นยังว่าง
 *
 * วิธีรัน (จาก ~/Desktop/Project/kinder-track/):
 *   node backfill-auto-development.mjs                 # ทดลอง: อ่านอย่างเดียว แสดงสรุปรายห้อง (ไม่เขียน)
 *   node backfill-auto-development.mjs --class=อ.2/2   # ทดลองเฉพาะห้อง
 *   node backfill-auto-development.mjs --apply         # เขียนเข้า Firestore (classAssessments/autoDev__{ห้อง} — แยก 1 เอกสารต่อห้อง) พร้อมสำรองของเดิม
 *
 * หลังรัน: ทุกเครื่องปิดแท็บเก่าแล้วเปิดใหม่ (Ctrl+Shift+R) — แท็บเก่าที่ค้างอยู่อาจเขียนทับข้อมูลชุดนี้
 */

// ── ค่าคงที่ (ต้องตรงกับ src/utils/autoDevelopment.js) ───────────────────────────
export const BASE_SOURCES    = ['attend', 'milk', 'lunch', 'tooth', 'illness'];
export const ROUTINE_SOURCES = ['morning', 'exercise', 'circle', 'story', 'cleanup', 'dressing', 'dance'];
// กิจกรรมประจำวัน (dailyRoutineRecords) ใช้ key เดียวกับชื่อแหล่งข้อมูล
const THAI_DAYS = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];

const pad2 = (n) => String(n).padStart(2, '0');
function parseISO(iso) { const [y, m, d] = iso.split('-').map(Number); return { y, m, d }; }
function dowOf(iso) { const { y, m, d } = parseISO(iso); return new Date(Date.UTC(y, m - 1, d)).getUTCDay(); }
function mondayOf(iso) {
  const { y, m, d } = parseISO(iso);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const dow = dt.getUTCDay();
  dt.setUTCDate(dt.getUTCDate() - (dow === 0 ? 6 : dow - 1));
  return dt.toISOString().slice(0, 10);
}
// key[] ที่กำหนดให้วันนั้น (เหมือน getKeysForDay ใน AppContext) — null = ยังไม่ได้กำหนด
function getKeysForDay(stored, day) {
  if (!stored || stored.length === 0) return null;
  if (typeof stored[0] === 'string') return stored;
  const keys = [];
  stored.forEach(e => {
    if (e.dayTimes && Object.keys(e.dayTimes).length > 0) { if (day in e.dayTimes) keys.push(e.key); }
    else if (e.days?.includes(day)) keys.push(e.key);
  });
  return keys;
}
// ดัชนี record รายเดือน: `${className}|${ปี พ.ศ.}-${เดือน 2 หลัก}` → record (ไม่ผูกกับปีการศึกษา)
function indexMonthly(records) {
  const idx = {};
  Object.values(records ?? {}).forEach(rec => {
    if (!rec?.className || rec.year == null || rec.month == null) return;
    idx[`${rec.className}|${rec.year}-${pad2(rec.month)}`] = rec;
  });
  return idx;
}

/**
 * สร้าง ledger ย้อนหลังจากข้อมูลรายวัน
 * @param data { students, dailyRecords, milkRecords, lunchRecords, toothBrushRecords, illnessCheckRecords,
 *               healthCheckRecords, dailyRoutineRecords, cornerRecords, innerCornerRecords,
 *               classOuterCornerKeys, classInnerCornerKeys }
 * @param onlyClass ถ้าระบุ = เฉพาะห้องนี้
 * @returns { ledger: { [className]: { [date]: {p,s,e?} } }, stats }
 */
export function buildLedger(data, onlyClass = null) {
  const classOf = Object.fromEntries((data.students ?? []).map(s => [String(s.id), s.className]));
  const milk = indexMonthly(data.milkRecords);
  const lunch = indexMonthly(data.lunchRecords);
  const tooth = indexMonthly(data.toothBrushRecords);
  const illness = indexMonthly(data.illnessCheckRecords);
  const routine = indexMonthly(data.dailyRoutineRecords);
  const health = {}; // `${className}|${date}` → record
  Object.values(data.healthCheckRecords ?? {}).forEach(r => { if (r?.className && r?.date) health[`${r.className}|${r.date}`] = r; });
  const outer = {}, inner = {}; // `${className}|${monday}` → weekData {sid:{key:bool}}
  Object.entries(data.cornerRecords ?? {}).forEach(([k, v]) => { if (k.includes('||')) { const [c, m] = k.split('||'); outer[`${c}|${m}`] = v; } });
  Object.entries(data.innerCornerRecords ?? {}).forEach(([k, v]) => { if (k.includes('||')) { const [c, m] = k.split('||'); inner[`${c}|${m}`] = v; } });

  const ledger = {};
  const stats = { classes: {}, totalDays: 0 };

  Object.entries(data.dailyRecords ?? {}).forEach(([date, byStudent]) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
    const { y, m, d } = parseISO(date);
    const ym = `${y + 543}-${pad2(m)}`;
    // แยกผู้ที่ "มา" ตามห้อง
    const presentByClass = {};
    Object.entries(byStudent ?? {}).forEach(([sid, rec]) => {
      if (rec?.attendance !== 'มา') return;
      const cls = classOf[String(sid)];
      if (!cls || (onlyClass && cls !== onlyClass)) return;
      (presentByClass[cls] ??= []).push(String(sid));
    });

    Object.entries(presentByClass).forEach(([cls, ids]) => {
      const sources = new Set(['attend']);
      const exclude = {}; // sid → Set(source)
      const exc = (sid, src) => { (exclude[sid] ??= new Set()).add(src); };

      // รายนักเรียน: นม / อาหารกลางวัน / แปรงฟัน (ค่าในช่อง √ = ทำ)
      [['milk', milk], ['lunch', lunch], ['tooth', tooth]].forEach(([src, index]) => {
        const rec = index[`${cls}|${ym}`];
        let any = false;
        ids.forEach(sid => {
          const v = rec?.students?.[sid]?.days?.[d];
          if (v === '√' || v === 'H') any = true; else exc(sid, src);
        });
        if (any) sources.add(src);
      });
      // คัดกรองป่วย: √ = ไม่ป่วย
      {
        const rec = illness[`${cls}|${ym}`];
        let any = false;
        ids.forEach(sid => {
          const v = rec?.students?.[sid]?.days?.[d]?.v;
          if (v === '√') any = true; else exc(sid, 'illness');
        });
        if (any) sources.add('illness');
      }
      // ตรวจสุขภาพ: มีผลตรวจวันนั้น (อย่างน้อยหนึ่งหมวดไม่ว่าง)
      {
        const rec = health[`${cls}|${date}`];
        let any = false;
        ids.forEach(sid => {
          const e = rec?.students?.[sid];
          const has = e && ['body', 'hair', 'cloth', 'ear', 'mouth', 'nail'].some(k => e[k] != null && e[k] !== '' && e[k] !== 0);
          if (has) any = true; else exc(sid, 'health_check');
        });
        if (any) sources.add('health_check');
      }
      // กิจกรรมประจำวัน (ระดับห้อง)
      {
        const dayData = routine[`${cls}|${ym}`]?.days?.[d];
        ROUTINE_SOURCES.forEach(k => { if (dayData?.[k] === true) sources.add(k); });
      }
      // แหล่งเรียนรู้นอกห้อง / มุมในห้อง: วันนั้นมีกิจกรรมตามตาราง + สัปดาห์นั้นนักเรียนถูกติ๊ก
      const thaiDay = THAI_DAYS[dowOf(date)];
      const mon = mondayOf(date);
      [['outdoor', data.classOuterCornerKeys, outer], ['corner', data.classInnerCornerKeys, inner]].forEach(([src, cfg, weeks]) => {
        const dayKeys = getKeysForDay(cfg?.[cls], thaiDay);
        if (!dayKeys || !dayKeys.length) return;
        const week = weeks[`${cls}|${mon}`];
        let any = false;
        ids.forEach(sid => {
          const w = week?.[sid];
          if (w && dayKeys.some(k => w[k] === true)) any = true; else exc(sid, src);
        });
        if (any) sources.add(src);
      });

      // ตัดข้อยกเว้นของแหล่งข้อมูลที่ไม่ได้อยู่ใน s ออก
      const e = {};
      Object.entries(exclude).forEach(([sid, set]) => {
        const arr = [...set].filter(x => sources.has(x));
        if (arr.length) e[sid] = arr;
      });
      const entry = { p: ids, s: [...sources] };
      if (Object.keys(e).length) entry.e = e;
      ((ledger[cls] ??= {})[date] = entry);

      const st = (stats.classes[cls] ??= { days: 0, presentDays: 0, sources: {} });
      st.days++; st.presentDays += ids.length; stats.totalDays++;
      sources.forEach(src => { st.sources[src] = (st.sources[src] ?? 0) + 1; });
    });
  });
  return { ledger, stats };
}

// ── main (ทำงานเมื่อรันจากบรรทัดคำสั่งเท่านั้น) ─────────────────────────────────────
const isMain = (process.argv[1] ?? '').endsWith('backfill-auto-development.mjs');
if (isMain) {
  const APPLY = process.argv.includes('--apply');
  const onlyClass = (process.argv.find(a => a.startsWith('--class=')) ?? '').slice(8) || null;

  const { initializeApp } = await import('./node_modules/firebase/app/dist/esm/index.esm.js');
  const { getFirestore, doc, getDoc, getDocs, getDocFromServer, setDoc, collection } =
    await import('./node_modules/firebase/firestore/dist/esm/index.esm.js');
  const app = initializeApp({
    apiKey: 'AIzaSyB4zokDQo4AcUuOhw-mmheD_mxDZ1gzVP4',
    authDomain: 'kinder-track-57770.firebaseapp.com',
    projectId: 'kinder-track-57770',
    storageBucket: 'kinder-track-57770.firebasestorage.app',
    messagingSenderId: '648130056832',
    appId: '1:648130056832:web:db70b15f8f646ba9a00c65',
  });
  const db = getFirestore(app);

  console.log('📡 เชื่อมต่อ Firestore (อ่านอย่างเดียวจนกว่าจะใส่ --apply)...');
  const snapDoc = await getDoc(doc(db, 'schools', 'default', 'snapshots', 'latest'));
  const dailyDoc = await getDoc(doc(db, 'schools', 'default', 'dailyData', 'latest'));
  if (!snapDoc.exists() || !dailyDoc.exists()) { console.log('❌ ไม่พบ snapshots/latest หรือ dailyData/latest'); process.exit(1); }
  const snap = snapDoc.data(), daily = dailyDoc.data();

  const { ledger, stats } = buildLedger({
    students: snap.students ?? [],
    classOuterCornerKeys: snap.classOuterCornerKeys ?? {},
    classInnerCornerKeys: snap.classInnerCornerKeys ?? {},
    ...daily,
  }, onlyClass);

  const SRC_LABEL = { attend: 'มาเรียน', milk: 'นม', lunch: 'อาหารกลางวัน', tooth: 'แปรงฟัน', illness: 'คัดกรองป่วย', health_check: 'ตรวจสุขภาพ',
    morning: 'เช้า', exercise: 'ออกกำลังกาย', circle: 'วงกลม', story: 'นิทาน', cleanup: 'เก็บของ', dressing: 'แต่งตัว', dance: 'เต้น', outdoor: 'นอกห้อง', corner: 'มุมในห้อง' };
  console.log(`\n📊 สรุป (${onlyClass ?? 'ทุกห้อง'}) — พบวันเรียนที่มีคนมา ${stats.totalDays} ห้อง-วัน`);
  Object.entries(stats.classes).sort().forEach(([cls, st]) => {
    console.log(`\n  ${cls}: ${st.days} วัน · รวมมาเรียน ${st.presentDays} คน-วัน`);
    console.log('     ' + Object.entries(st.sources).map(([k, n]) => `${SRC_LABEL[k] ?? k} ${n}`).join(' · '));
  });
  // ledger เดิม (เอกสารแยกต่อห้อง)
  const existing = {};
  (await getDocs(collection(db, 'schools', 'default', 'classAssessments'))).forEach(d => {
    if (d.id.startsWith('autoDev__') && d.data().className) existing[d.data().className] = d.data().ledger ?? {};
  });
  const overlap = Object.keys(ledger).filter(c => existing[c]);
  if (overlap.length) console.log(`\nℹ️ ห้องที่มี ledger เดิมอยู่แล้ว (จะถูกแทนที่ด้วยค่าที่คำนวณใหม่): ${overlap.join(', ')}`);

  if (!APPLY) { console.log('\n(โหมดทดลอง — ยังไม่ได้เขียนอะไร) ถ้าสรุปถูกต้องให้รันซ้ำด้วย --apply'); process.exit(0); }

  const fs = await import('node:fs');
  const bkFile = `backup_autoDevLedger_before_backfill_${Date.now()}.json`;
  fs.writeFileSync(bkFile, JSON.stringify(existing, null, 2));
  console.log(`\n💾 สำรอง ledger เดิมไว้ที่ ${bkFile} (อย่า commit เข้า git)`);

  // 1 เอกสารต่อห้อง (แทนที่ ledger ของห้องนั้นทั้งเอกสาร) — ห้องอื่นไม่ถูกแตะ
  const docId = (cls) => 'autoDev__' + cls.replace(/\//g, '_').replace(/\s+/g, '-');
  for (const [cls, days] of Object.entries(ledger)) {
    await setDoc(doc(db, 'schools', 'default', 'classAssessments', docId(cls)), { className: cls, updatedAt: new Date(), ledger: days });
    console.log('✅', docId(cls), `(${Object.keys(days).length} วัน)`);
  }
  let ok = true;
  for (const [cls, days] of Object.entries(ledger)) {
    const back = (await getDocFromServer(doc(db, 'schools', 'default', 'classAssessments', docId(cls)))).data()?.ledger ?? {};
    const same = Object.keys(days).length === Object.keys(back).length;
    if (!same) ok = false;
    console.log(same ? '🔎 ตรงกัน' : '⚠️ จำนวนวันไม่ตรง', cls);
  }
  console.log(ok ? '\n🎉 เสร็จ — ให้ทุกเครื่องรีโหลด (Ctrl+Shift+R)' : '\n⚠️ มีบางห้องไม่ตรง ตรวจสอบอีกครั้ง');
  process.exit(ok ? 0 : 1);
}
