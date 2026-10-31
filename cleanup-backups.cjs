/**
 * cleanup-backups.cjs — จัดระเบียบ backup เก่าใน Firestore (schools/default/snapshots)
 *
 * ค่าเริ่มต้น = DRY-RUN (แค่แสดงผล ไม่แก้ไขอะไรเลย)
 *
 *   node cleanup-backups.cjs                 ดูก่อนว่าจะทำอะไร
 *   node cleanup-backups.cjs --keep-days 60 เก็บย้อนหลัง 60 วัน (ค่าเริ่มต้น 30)
 *   node cleanup-backups.cjs --apply         ทำจริง (ต้องพิมพ์ DELETE ยืนยัน)
 *
 * กฎ:
 *   - ไม่แตะ 'latest' เด็ดขาด
 *   - เอกสารที่ id เป็น YYYY-MM-DD (รูปแบบใหม่) เก็บไว้ทั้งหมด
 *   - เอกสาร id สุ่มแบบเก่า: เก็บ "ฉบับล่าสุดของแต่ละวัน" ภายใน --keep-days วัน
 *     โดยคัดลอกเป็นเอกสาร id = วันที่ แล้วลงทะเบียนใน dailyData/backupIndex
 *   - ที่เหลือ (ซ้ำรายวัน / เก่าเกินกำหนด) ลบ
 * ต้องมี serviceAccount.json (หรือระบุ --key path) ในโฟลเดอร์โปรเจกต์
 */
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const admin = require('firebase-admin');

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const argVal = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const KEEP_DAYS = parseInt(argVal('--keep-days', '30'), 10);
const KEY = path.resolve(argVal('--key', 'serviceAccount.json'));
const SCHOOL = 'default';
const DATE_ID = /^\d{4}-\d{2}-\d{2}$/;

if (!fs.existsSync(KEY)) { console.error('ไม่พบไฟล์คีย์: ' + KEY); process.exit(1); }
admin.initializeApp({ credential: admin.credential.cert(require(KEY)) });
const db = admin.firestore();
const col = db.collection('schools').doc(SCHOOL).collection('snapshots');
const indexRef = db.collection('schools').doc(SCHOOL).collection('dailyData').doc('backupIndex');

const ask = (q) => new Promise((res) => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question(q, (a) => { rl.close(); res(a); });
});

(async () => {
  console.log(APPLY ? '*** โหมดทำจริง (--apply) ***' : '--- DRY-RUN: ยังไม่มีการแก้ไขข้อมูล ---');
  const snap = await col.select('exportedAt', 'backupDate').get();
  console.log('เอกสารทั้งหมดใน snapshots: ' + snap.size);

  const cutoff = new Date(Date.now() - KEEP_DAYS * 86400000).toISOString().slice(0, 10);
  const keepNew = [];        // id แบบวันที่
  const perDay = new Map();  // day -> {id, ts}
  const oldDocs = [];
  snap.forEach((d) => {
    if (d.id === 'latest') return;
    if (DATE_ID.test(d.id)) { keepNew.push(d.id); return; }
    const x = d.data();
    const ts = x.exportedAt || d.updateTime.toDate().toISOString();
    const day = (x.backupDate && DATE_ID.test(x.backupDate)) ? x.backupDate : ts.slice(0, 10);
    oldDocs.push({ id: d.id, day, ts });
    const cur = perDay.get(day);
    if (!cur || ts > cur.ts) perDay.set(day, { id: d.id, ts });
  });

  const migrate = []; // เก็บ: คัดลอกเป็น id วันที่
  const toDelete = [];
  for (const o of oldDocs) {
    const best = perDay.get(o.day);
    if (o.day >= cutoff && best.id === o.id && !keepNew.includes(o.day)) migrate.push(o);
    else toDelete.push(o);
  }
  migrate.sort((a, b) => b.day.localeCompare(a.day));

  console.log('\nสรุป');
  console.log('  เก็บไว้ (id วันที่อยู่แล้ว)        : ' + keepNew.length);
  console.log('  เก็บ+ย้ายเป็น id วันที่ (ฉบับล่าสุด/วัน ภายใน ' + KEEP_DAYS + ' วัน): ' + migrate.length);
  console.log('  จะลบ                               : ' + toDelete.length);
  console.log('  latest                             : เก็บ (ไม่แตะ)');
  console.log('\nตัวอย่างที่จะเก็บ (ล่าสุด 10 วัน):');
  migrate.slice(0, 10).forEach((m) => console.log('  ' + m.day + '  <- ' + m.id));
  console.log('\nตัวอย่างที่จะลบ (5 รายการ):');
  toDelete.slice(0, 5).forEach((m) => console.log('  ' + m.id + '  (' + m.day + ')'));

  if (!APPLY) {
    console.log('\nนี่คือ dry-run เท่านั้น ถ้าตรวจแล้วถูกต้อง รันซ้ำด้วย --apply');
    process.exit(0);
  }

  const ans = await ask('\nพิมพ์ DELETE เพื่อยืนยันการลบ ' + toDelete.length + ' เอกสาร: ');
  if (ans.trim() !== 'DELETE') { console.log('ยกเลิก'); process.exit(0); }

  // 1) คัดลอกฉบับที่เก็บ -> id วันที่ + ทำ index (ทำก่อนลบเสมอ)
  const index = {};
  for (const m of migrate) {
    const full = await col.doc(m.id).get();
    const data = full.data();
    await col.doc(m.day).set({ ...data, backupDate: m.day });
    index[m.day] = {
      exportedAt: data.exportedAt || m.ts, backupDate: m.day,
      studentCount: Array.isArray(data.students) ? data.students.length : 0,
      attendanceCount: data.dailyRecords ? Object.keys(data.dailyRecords).length : 0,
    };
    console.log('  คัดลอก ' + m.day);
  }
  for (const id of keepNew) {
    if (index[id]) continue;
    const data = (await col.doc(id).get()).data();
    index[id] = {
      exportedAt: data.exportedAt || null, backupDate: id,
      studentCount: Array.isArray(data.students) ? data.students.length : 0,
      attendanceCount: data.dailyRecords ? Object.keys(data.dailyRecords).length : 0,
    };
  }
  if (Object.keys(index).length) await indexRef.set(index, { merge: true });

  // 2) ลบ
  const writer = db.bulkWriter();
  let n = 0;
  writer.onWriteError((e) => { console.error('ลบไม่สำเร็จ', e.documentRef.id, e.message); return false; });
  for (const o of toDelete) { writer.delete(col.doc(o.id)); n++; }
  await writer.close();
  console.log('\nเสร็จสิ้น: ลบ ' + n + ' เอกสาร, index ' + Object.keys(index).length + ' วัน');
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
