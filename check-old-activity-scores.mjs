/**
 * check-old-activity-scores.mjs
 * ตรวจว่าในคะแนนประเมินรายกิจกรรมของนักเรียน (Firestore: classAssessments/{ห้อง}) มี "คะแนนที่ค้างอยู่กับรหัสกิจกรรมชุดเก่า"
 * (qa-3, std-1 ฯลฯ ซึ่งไม่มีในหลักสูตร 2568) หรือไม่ — เกิดจากปุ่ม "บันทึกกิจกรรมที่เชื่อมโยง" เวอร์ชันก่อน 3.0.15
 * ที่เขียนคะแนนลงรหัสที่สมุดรายงาน/ประเมินความสามารถมองไม่เห็น
 *
 * วิธีรัน (จาก ~/Desktop/Project/kinder-track/):
 *   node check-old-activity-scores.mjs            # ตรวจอย่างเดียว (ไม่เขียน) แสดงจำนวนรายห้อง/รายกลุ่มรหัส
 *   node check-old-activity-scores.mjs --clean    # ลบเฉพาะคะแนนของรหัสที่ไม่มีในหลักสูตร 2568 (สำรองของเดิมเป็นไฟล์ JSON ก่อน)
 *
 * ไม่แตะคะแนนของกิจกรรมหลักสูตร 2568 ที่ถูกต้อง
 * หลังใช้ --clean: ทุกเครื่องปิดแท็บเก่าแล้วเปิดใหม่ (Ctrl+Shift+R) — เครื่องที่ยังมีคะแนนเก่าในเครื่องอาจส่งกลับขึ้นระบบอีก
 */
import { INDICATORS_DATA_68 } from './src/data/indicatorsData_68.js';

const CLEAN = process.argv.includes('--clean');

// รหัสที่ถูกต้องของหลักสูตร 2568
const VALID_ACT = new Set();
const VALID_IND = new Set();
INDICATORS_DATA_68.forEach(d => d.standards.forEach(st => st.indicators.forEach(ind => {
  VALID_IND.add(`${d.id}__${st.id}__${ind.id}`);
  ind.items.forEach(it => it.activities.forEach(a => VALID_ACT.add(`${d.id}__${st.id}__${ind.id}__${it.id}__${a.no}`)));
})));

/** แยกคะแนนของนักเรียนหนึ่งคนเป็น { clean, removed } (นับเป็นจำนวนกิจกรรมที่มีคะแนนจริง) */
export function splitStudentIndicators(indicators) {
  const clean = {};
  let kept = 0, removed = 0;
  const removedByGroup = {};
  Object.entries(indicators ?? {}).forEach(([indKey, acts]) => {
    Object.entries(acts ?? {}).forEach(([actId, data]) => {
      if (data == null) return;
      if (VALID_ACT.has(actId)) { (clean[indKey] ??= {})[actId] = data; kept++; }
      else { removed++; const g = actId.split('__').slice(0, 2).join('__'); removedByGroup[g] = (removedByGroup[g] ?? 0) + 1; }
    });
  });
  return { clean, kept, removed, removedByGroup };
}

const isMain = (process.argv[1] ?? '').endsWith('check-old-activity-scores.mjs');
if (isMain) {
  const { initializeApp } = await import('./node_modules/firebase/app/dist/esm/index.esm.js');
  const { getFirestore, doc, getDocs, setDoc, collection } = await import('./node_modules/firebase/firestore/dist/esm/index.esm.js');
  const app = initializeApp({
    apiKey: 'AIzaSyB4zokDQo4AcUuOhw-mmheD_mxDZ1gzVP4',
    authDomain: 'kinder-track-57770.firebaseapp.com',
    projectId: 'kinder-track-57770',
    storageBucket: 'kinder-track-57770.firebasestorage.app',
    messagingSenderId: '648130056832',
    appId: '1:648130056832:web:db70b15f8f646ba9a00c65',
  });
  const db = getFirestore(app);

  console.log(`📡 อ่าน classAssessments (${CLEAN ? 'โหมดลบ --clean' : 'ตรวจอย่างเดียว'})...`);
  const snap = await getDocs(collection(db, 'schools', 'default', 'classAssessments'));
  const plans = [];
  let totalKept = 0, totalRemoved = 0;
  snap.forEach(d => {
    if (d.id.startsWith('autoDev__')) return; // เอกสาร ledger พัฒนาการอัตโนมัติ ไม่เกี่ยว
    const data = d.data();
    const students = data.students ?? {};
    const cleanStudents = {};
    let kept = 0, removed = 0, affected = 0;
    const groups = {};
    Object.entries(students).forEach(([sid, sa]) => {
      const r = splitStudentIndicators(sa?.indicators);
      kept += r.kept; removed += r.removed;
      if (r.removed) { affected++; Object.entries(r.removedByGroup).forEach(([g, n]) => { groups[g] = (groups[g] ?? 0) + n; }); }
      cleanStudents[sid] = { ...sa, indicators: r.clean };
    });
    totalKept += kept; totalRemoved += removed;
    console.log(`\n  ${data.className ?? d.id}: นักเรียน ${Object.keys(students).length} คน · คะแนนที่ใช้ได้ ${kept} · คะแนนรหัสเก่า ${removed} (กระทบ ${affected} คน)`);
    if (removed) console.log('     รหัสเก่าที่พบ: ' + Object.entries(groups).map(([g, n]) => `${g} ×${n}`).join(' · '));
    if (removed) plans.push({ id: d.id, className: data.className, original: data, cleaned: { ...data, students: cleanStudents } });
  });

  console.log(`\n📊 รวม: คะแนนที่ใช้ได้ ${totalKept} · คะแนนรหัสเก่า ${totalRemoved} (${plans.length} ห้องที่ต้องล้าง)`);
  if (!totalRemoved) { console.log('✅ ไม่พบคะแนนรหัสเก่า ไม่ต้องทำอะไร'); process.exit(0); }
  if (!CLEAN) { console.log('\n(โหมดตรวจ — ยังไม่ได้เขียนอะไร) ถ้าต้องการลบคะแนนรหัสเก่าให้รันซ้ำด้วย --clean'); process.exit(0); }

  const fs = await import('node:fs');
  const bkFile = `backup_classAssessments_before_clean_${Date.now()}.json`;
  fs.writeFileSync(bkFile, JSON.stringify(Object.fromEntries(plans.map(p => [p.id, p.original])), null, 2));
  console.log(`\n💾 สำรองของเดิมไว้ที่ ${bkFile} (อย่า commit เข้า git)`);
  for (const p of plans) {
    await setDoc(doc(db, 'schools', 'default', 'classAssessments', p.id), { ...p.cleaned, updatedAt: new Date() });
    console.log('✅ ล้างแล้ว', p.className ?? p.id);
  }
  console.log('\n🎉 เสร็จ — ให้ทุกเครื่องรีโหลด (Ctrl+Shift+R)');
}
