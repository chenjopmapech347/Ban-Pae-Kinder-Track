/**
 * fix-index-entries.cjs — แก้ error "too many index entries for entity .../snapshots/latest"
 *
 * Firestore จำกัด 40,000 index entries ต่อเอกสาร ทุกฟิลด์ย่อยในแมปถูกทำดัชนี (ขึ้น+ลง = 2 entries ต่อค่า)
 * เอกสาร snapshots/latest มีแมปใหญ่หลายตัว (เช่น abilityAssessments, indicators, qaData) จึงเต็ม
 * ทางแก้: ปิดการทำดัชนีของฟิลด์ใหญ่ (single-field exemption) — ข้อมูลไม่หาย แอปไม่ได้ query ด้วยฟิลด์เหล่านี้
 *
 *   node fix-index-entries.cjs                  วัดว่าฟิลด์ไหนกินกี่ entries (ไม่แก้อะไร)
 *   node fix-index-entries.cjs --write-indexes  เขียน firestore.indexes.json ปิดดัชนีฟิลด์ที่เกิน 300 entries
 *   node fix-index-entries.cjs --migrate-missing [--apply]   คัดลอกข้อมูลที่มีแต่ใน latest ไป dailyData/latest (ไม่ทับของเดิม)
 *   node fix-index-entries.cjs --delete-stale [--apply]       ลบฟิลด์รายวันเก่าที่ตกค้างใน latest (ตรวจ+สำรองให้ก่อน)
 * แล้ว: npx firebase-tools deploy --only firestore:indexes   (รอสถานะใน Console จนเสร็จ)
 */
const fs = require('fs'), path = require('path');
const admin = require('firebase-admin');
const a = process.argv.slice(2);
const KEY = path.resolve(a.includes('--key') ? a[a.indexOf('--key') + 1] : 'serviceAccount.json');
if (!fs.existsSync(KEY)) { console.error('ไม่พบไฟล์คีย์: ' + KEY); process.exit(1); }
admin.initializeApp({ credential: admin.credential.cert(require(KEY)) });
const ref = admin.firestore().doc('schools/default/snapshots/latest');
const STALE = ['dailyRecords','nutritionRecords','milkRecords','lunchRecords','toothBrushRecords','healthCheckRecords',
  'illnessCheckRecords','dailyRoutineRecords','cornerRecords','innerCornerRecords','studentReportRecords','specialEvents','pickupRecords'];

// ประมาณจำนวน index entries: ค่า scalar/แมปย่อย = 2 (asc+desc) ต่อ path, array = 1 entry ต่อสมาชิก (+ asc/desc ของ array เอง)
function count(v) {
  if (v === null || typeof v !== 'object') return 2;
  if (v && typeof v.toDate === 'function') return 2;
  if (Array.isArray(v)) return Math.min(v.length, 20000) + 2;
  return 2 + Object.values(v).reduce((n, x) => n + count(x), 0);
}

(async () => {
  const d = (await ref.get()).data() || {};
  const rows = Object.entries(d).map(([k, v]) => [k, count(v), JSON.stringify(v ?? null).length]).sort((x, y) => y[1] - x[1]);
  const total = rows.reduce((n, r) => n + r[1], 0);
  console.log(`ประมาณ index entries ทั้งเอกสาร: ${total} (ขีดจำกัด 40,000)\n`);
  console.log('entries  ขนาด(KB)  ฟิลด์');
  rows.slice(0, 20).forEach(([k, n, sz]) => console.log(String(n).padStart(7), String(Math.round(sz / 1024)).padStart(8), ' ', k + (STALE.includes(k) ? '   <- ตกค้างจากระบบเก่า' : '')));

  if (a.includes('--write-indexes')) {
    // ปิดดัชนีของฟิลด์รายวัน (ใหญ่ ไม่เคยใช้ query) ทั้งใน snapshots และ dailyData
    const overrides = [];
    ['snapshots', 'dailyData'].forEach((cg) => STALE.forEach((f) => overrides.push({ collectionGroup: cg, fieldPath: f, indexes: [] })));
    fs.writeFileSync('firestore.indexes.json', JSON.stringify({ indexes: [], fieldOverrides: overrides }, null, 2) + '\n');
    console.log('\nเขียน firestore.indexes.json (ปิดดัชนีฟิลด์รายวัน', STALE.length, 'ฟิลด์ ใน snapshots และ dailyData)');
    console.log('ต้องมี  "indexes": "firestore.indexes.json"  ใน firebase.json (ส่วน firestore) แล้ว deploy --only firestore:indexes');
  }
  if (a.includes('--migrate-missing')) {
    // คัดลอกเฉพาะส่วนที่ dailyData/latest ยังไม่มี (ไม่ทับค่าที่มีอยู่) ด้วย setDoc merge — ปลอดภัยกับ key ที่มี . และ /
    const dref = admin.firestore().doc('schools/default/dailyData/latest');
    const daily = (await dref.get()).data() || {};
    const tree = (x, y) => {
      if (x === null || typeof x !== 'object' || Array.isArray(x)) return y === undefined ? x : undefined;
      if (y === undefined || y === null || typeof y !== 'object') return x;
      const out = {};
      Object.keys(x).forEach((k) => { const t = tree(x[k], y[k]); if (t !== undefined) out[k] = t; });
      return Object.keys(out).length ? out : undefined;
    };
    const add = {};
    STALE.filter((k) => k in d).forEach((k) => { const t = tree(d[k], daily[k]); if (t !== undefined) add[k] = t; });
    console.log('\nส่วนที่จะคัดลอกไป dailyData/latest:', Object.keys(add).join(', ') || '(ไม่มี)');
    if (!a.includes('--apply')) { console.log('DRY-RUN — เพิ่ม --apply เพื่อคัดลอก'); return; }
    if (Object.keys(add).length) await dref.set(add, { merge: true });
    console.log('คัดลอกแล้ว — รัน --delete-stale อีกครั้งเพื่อตรวจว่าขาด 0 จุด');
    return;
  }
  if (a.includes('--delete-stale')) {
    const present = STALE.filter((k) => k in d);
    console.log(`\nฟิลด์ตกค้างที่พบ: ${present.join(', ') || '(ไม่มี)'}`);
    if (!present.length) return;
    // ตรวจว่าทุกค่าในฟิลด์ตกค้างมีสำเนาอยู่ใน dailyData/latest แล้ว (ลึกถึงใบ)
    const daily = (await admin.firestore().doc('schools/default/dailyData/latest').get()).data() || {};
    const missing = (x, y) => {
      if (x === null || typeof x !== 'object' || Array.isArray(x)) return y === undefined ? 1 : 0;
      if (y === undefined || y === null || typeof y !== 'object') return Object.keys(x).length ? 1 : 0;
      return Object.keys(x).reduce((n, k) => n + missing(x[k], y[k]), 0);
    };
    let unsafe = 0;
    present.forEach((k) => {
      const m = missing(d[k], daily[k]);
      console.log(`  ${k}: ใน dailyData ขาดอยู่ ${m} จุด`);
      unsafe += m;
    });
    if (unsafe > 0) { console.log('\nหยุด: มีข้อมูลที่ยังไม่มีสำเนาใน dailyData — ไม่ลบ (ส่งผลนี้ให้ผู้ช่วยดู)'); return; }
    if (!a.includes('--apply')) { console.log('\nปลอดภัยที่จะลบ (DRY-RUN) — เพิ่ม --apply เพื่อสำรองและลบ'); return; }
    const bak = `backup-latest-stale-${new Date().toISOString().slice(0, 10)}.json`;
    fs.writeFileSync(bak, JSON.stringify(Object.fromEntries(present.map((k) => [k, d[k]]))), { mode: 0o600 });
    console.log('สำรองฟิลด์ที่จะลบไว้ที่', bak);
    const del = {}; present.forEach((k) => { del[k] = admin.firestore.FieldValue.delete(); });
    await ref.update(del);
    console.log('ลบแล้ว — ให้ครูกด "บันทึก" อีกครั้ง');
  }
})().then(() => process.exit(0)).catch((e) => { console.error(e.message); process.exit(1); });
