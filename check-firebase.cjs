// check-firebase.cjs — ตรวจ Firebase แบบอ่านอย่างเดียว (ไม่เขียน/ไม่ลบ) พิมพ์เฉพาะโครงสร้างและจำนวน ไม่พิมพ์ข้อมูลนักเรียน
// รัน: node check-firebase.cjs   (ใช้ serviceAccount.json ในโฟลเดอร์นี้)
const path=require('path'); const root=process.cwd();
const admin=require(path.join(root,'node_modules/firebase-admin'));
const sa=require(path.join(root,'serviceAccount.json'));
admin.initializeApp({credential:admin.credential.cert(sa)});
const db=admin.firestore();
const shape=v=>Array.isArray(v)?`array[${v.length}]`:v&&typeof v==='object'?(v.toDate?'timestamp':`object{${Object.keys(v).length}}`):typeof v;
(async()=>{
  const out={};
  const latest=await db.doc('schools/default/snapshots/latest').get();
  out.latest={exists:latest.exists};
  if(latest.exists){const d=latest.data(); out.latest.bytes=JSON.stringify(d).length; out.latest.version=d.version; out.latest.exportedAt=d.exportedAt; out.latest.keys=Object.fromEntries(Object.keys(d).sort().map(k=>[k,shape(d[k])]));}
  const snaps=await db.collection('schools/default/snapshots').select('exportedAt','backupDate').get();
  out.snapshotDocs=snaps.size; const dates=snaps.docs.map(d=>d.get('backupDate')||d.id).filter(Boolean).sort(); out.backupDateRange=[dates[0],dates[dates.length-1]];
  const byDay={}; snaps.docs.forEach(d=>{const k=d.get('backupDate')||'?';byDay[k]=(byDay[k]||0)+1}); out.maxDocsPerDay=Math.max(...Object.values(byDay)); out.days=Object.keys(byDay).length;
  const daily=await db.doc('schools/default/dailyData/latest').get(); out.dailyData={exists:daily.exists, keys:daily.exists?Object.fromEntries(Object.keys(daily.data()).sort().map(k=>[k,shape(daily.data()[k])])):null};
  for(const c of ['schools/default/classAssessments','activitySchedule','cornerAssignments','std2_ratings','settings','sessions','users','students']){
    try{const s=await db.collection(c).select().get(); out[c]=s.size;}catch(e){out[c]='err '+e.code}
  }
  try{const rs=await admin.securityRules().getFirestoreRuleset(); out.deployedRules={created:rs.createTime, hasWriteTrue:/allow (read, )?write: if true/.test(rs.source.files[0].content), hasDeleteFalse:/allow delete: if false/.test(rs.source.files[0].content), pathsMatched:[...rs.source.files[0].content.matchAll(/match (\/[^\s{]*(?:\{[^}]*\}[^\s{]*)*)/g)].map(m=>m[1])};}catch(e){out.deployedRules='err '+e.message.slice(0,80)}
  console.log(JSON.stringify(out,null,1)); process.exit(0);
})().catch(e=>{console.error('ERR',e.code||'',e.message.slice(0,200));process.exit(1)});
