/**
 * fill-daily-routine.mjs
 * ตรวจ/เติม "กิจกรรมประจำวัน" (เช้า ออกกำลังกาย วงกลม เล่านิทาน เก็บของ แต่งตัว เต้น) ย้อนหลัง
 * ให้ทุกวันที่มีนักเรียนในห้องนั้น "มาเรียน" (เช็คชื่อ = มา) — กติกาเดียวกับที่ระบบเติมตอนบันทึกเช็คชื่อ
 *
 *  - เติมเฉพาะวันที่ "ยังไม่มีข้อมูลกิจกรรมประจำวัน" ของห้องนั้น (ไม่ทับวันที่ครูบันทึกไว้แล้ว ไม่ว่าจะติ๊กหรือไม่ติ๊ก)
 *  - ข้อมูลเป็นระดับห้อง (ไม่ใช่รายคน) → ใช้กับนักเรียนที่มาเรียนในวันนั้นทุกคน
 *
 * วิธีรัน (จาก ~/Desktop/Project/kinder-track/):
 *   node fill-daily-routine.mjs                  # ตรวจอย่างเดียว (ไม่เขียน) แสดงจำนวนวันที่ขาดรายห้อง
 *   node fill-daily-routine.mjs --class=อ.2/2    # ตรวจเฉพาะห้อง
 *   node fill-daily-routine.mjs --apply          # เติมจริง (สำรองของเดิมเป็นไฟล์ JSON ก่อน)
 *
 * หลัง --apply: ทุกเครื่องปิดแท็บเก่า เปิดใหม่ (Ctrl+Shift+R) แล้วรัน node backfill-auto-development.mjs (ทดลอง → --apply)
 */
export const ROUTINE_KEYS = ['morning', 'exercise', 'circle', 'story', 'cleanup', 'dressing', 'dance'];
const pad2 = (n) => String(n).padStart(2, '0');

/** คืน { fills: { [recordKey]: record ใหม่ทั้งก้อน }, stats: { [className]: {presentDays, filled, already} } } */
export function planFill(data, onlyClass = null) {
  const classOf = Object.fromEntries((data.students ?? []).map(s => [String(s.id), s.className]));
  const records = data.dailyRoutineRecords ?? {};
  const byClassMonth = {};   // `${cls}|${thaiYear}-${MM}` → recordKey
  Object.entries(records).forEach(([k, r]) => {
    if (r?.className && r.year != null && r.month != null) byClassMonth[`${r.className}|${r.year}-${pad2(r.month)}`] = k;
  });
  const allTrue = Object.fromEntries(ROUTINE_KEYS.map(k => [k, true]));
  const presentDays = {};    // `${cls}|${date}` → true
  Object.entries(data.dailyRecords ?? {}).forEach(([date, byStudent]) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
    Object.entries(byStudent ?? {}).forEach(([sid, rec]) => {
      if (rec?.attendance !== 'มา') return;
      const cls = classOf[String(sid)];
      if (!cls || (onlyClass && cls !== onlyClass)) return;
      presentDays[`${cls}|${date}`] = true;
    });
  });
  const fills = {}, stats = {};
  Object.keys(presentDays).sort().forEach(cd => {
    const [cls, date] = cd.split('|');
    const [y, m, d] = date.split('-').map(Number);
    const thaiYear = y + 543, mm = pad2(m);
    const st = (stats[cls] ??= { presentDays: 0, filled: 0, already: 0 });
    st.presentDays++;
    const existingKey = byClassMonth[`${cls}|${thaiYear}-${mm}`];
    const academicYear = records[existingKey]?.academicYear ?? (m >= 5 ? thaiYear : thaiYear - 1);
    const key = existingKey ?? `${cls}__${academicYear}__${thaiYear}-${mm}`;
    const base = fills[key] ?? (records[key]
      ? { ...records[key], days: { ...(records[key].days ?? {}) } }
      : { id: key, className: cls, academicYear: String(academicYear), year: thaiYear, month: m, days: {} });
    if (d in base.days) { st.already++; return; }
    base.days[d] = { ...allTrue };
    fills[key] = base;
    st.filled++;
  });
  return { fills, stats };
}

const isMain = (process.argv[1] ?? '').endsWith('fill-daily-routine.mjs');
if (isMain) {
  const APPLY = process.argv.includes('--apply');
  const onlyClass = (process.argv.find(a => a.startsWith('--class=')) ?? '').slice(8) || null;
  const { initializeApp } = await import('./node_modules/firebase/app/dist/esm/index.esm.js');
  const { getFirestore, doc, getDoc, getDocs, getDocFromServer, setDoc, collection } =
    await import('./node_modules/firebase/firestore/dist/esm/index.esm.js');
  const db = getFirestore(initializeApp({
    apiKey: 'AIzaSyB4zokDQo4AcUuOhw-mmheD_mxDZ1gzVP4',
    authDomain: 'kinder-track-57770.firebaseapp.com',
    projectId: 'kinder-track-57770',
  }));
  setTimeout(() => { console.log('⏱ หมดเวลา (ต่อ Firebase ไม่ได้)'); process.exit(2); }, 120000);

  console.log('📡 อ่าน Firestore (อ่านอย่างเดียวจนกว่าจะใส่ --apply)...');
  const snap = (await getDoc(doc(db, 'schools', 'default', 'snapshots', 'latest'))).data() ?? {};
  const legacy = { ...((await getDoc(doc(db, 'schools', 'default', 'dailyData', 'latest'))).data() ?? {}) };
  delete legacy.updatedAt;
  const daily = { ...legacy };
  (await getDocs(collection(db, 'schools', 'default', 'dailyData'))).forEach(d => {
    const x = d.data();
    if (x?.field && x.data) daily[x.field] = { ...(daily[x.field] ?? {}), ...x.data };   // shard ทับค่าเดิมระดับ key (เหมือนที่แอปทำ)
  });

  const { fills, stats } = planFill({ students: snap.students ?? [], ...daily }, onlyClass);
  console.log(`\n📊 วันที่มีนักเรียนมาเรียน เทียบกับกิจกรรมประจำวันที่บันทึกไว้ (${onlyClass ?? 'ทุกห้อง'})`);
  let missing = 0;
  Object.entries(stats).sort().forEach(([cls, s]) => {
    missing += s.filled;
    console.log(`  ${cls}: มาเรียน ${s.presentDays} วัน · มีกิจกรรมประจำวันแล้ว ${s.already} วัน · ยังไม่มี ${s.filled} วัน`);
  });
  if (!missing) { console.log('\n✅ ครบแล้ว ทุกวันที่มาเรียนมีกิจกรรมประจำวัน ไม่ต้องเติม'); process.exit(0); }
  if (!APPLY) { console.log(`\n(โหมดตรวจ — ยังไม่ได้เขียน) ขาดรวม ${missing} ห้อง-วัน ถ้าต้องการเติมให้รันซ้ำด้วย --apply`); process.exit(0); }

  const fs = await import('node:fs');
  const old = Object.fromEntries(Object.keys(fills).map(k => [k, daily.dailyRoutineRecords?.[k] ?? null]));
  const bk = `backup_dailyRoutine_before_fill_${Date.now()}.json`;
  fs.writeFileSync(bk, JSON.stringify(old, null, 2));
  console.log(`\n💾 สำรองของเดิมไว้ที่ ${bk} (อย่า commit เข้า git)`);

  // เขียนลง shard เดียวกับที่แอปใช้ (field__bucket) — key ที่ไม่ใช่วันที่ใช้ hash 8 กลุ่ม (ต้องตรงกับ src/lib/firebaseSync.js)
  const bucketOf = (key) => { let h = 0; const s = String(key); for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return `k${h % 8}`; };
  const byShard = {};
  Object.entries(fills).forEach(([k, rec]) => { (byShard[`dailyRoutineRecords__${bucketOf(k)}`] ??= {})[k] = rec; });
  for (const [id, data] of Object.entries(byShard)) {
    await setDoc(doc(db, 'schools', 'default', 'dailyData', id), { field: 'dailyRoutineRecords', updatedAt: new Date(), data }, { merge: true });
    console.log('✅', id, `(${Object.keys(data).length} เดือน-ห้อง)`);
  }
  let ok = true;
  for (const [id, data] of Object.entries(byShard)) {
    const back = (await getDocFromServer(doc(db, 'schools', 'default', 'dailyData', id))).data()?.data ?? {};
    for (const [k, rec] of Object.entries(data)) {
      if (Object.keys(back[k]?.days ?? {}).length !== Object.keys(rec.days).length) { ok = false; console.log('⚠️ ไม่ตรง', k); }
    }
  }
  console.log(ok ? '\n🎉 เสร็จ — ทุกเครื่องรีโหลด (Ctrl+Shift+R) แล้วรัน backfill-auto-development.mjs' : '\n⚠️ บางรายการไม่ตรง ตรวจสอบอีกครั้ง');
  process.exit(ok ? 0 : 1);
}
