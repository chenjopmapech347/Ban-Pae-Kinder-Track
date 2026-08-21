/**
 * backup-browser-console.js  (v2 — REST API)
 * วางใน DevTools Console ขณะ Login อยู่ในแอป KinderTrack
 *
 * วิธีใช้:
 *   1. เปิดแอป KinderTrack และ Login ให้เรียบร้อย
 *   2. F12 → Console → วาง code ทั้งหมด → Enter
 */
(async () => {
  const PROJECT  = 'kinder-track-57770';
  const COLS     = ['settings', 'std2_ratings', 'activityLogs', 'students', 'users', 'classrooms'];

  // ── 1. ดึง Access Token จาก Firebase IndexedDB ────────
  async function getFirebaseToken() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('firebaseLocalStorageDb');
      req.onerror = () => reject(new Error('ไม่สามารถเปิด IndexedDB'));
      req.onsuccess = e => {
        const db  = e.target.result;
        const tx  = db.transaction('firebaseLocalStorage', 'readonly');
        const all = tx.objectStore('firebaseLocalStorage').getAll();
        all.onsuccess = () => {
          const authItem = all.result.find(r =>
            r.fbase_key && r.fbase_key.includes('authUser')
          );
          const token = authItem?.value?.stsTokenManager?.accessToken;
          token ? resolve(token) : reject(new Error('ไม่พบ auth token — กรุณา Login ก่อน'));
        };
        all.onerror = () => reject(new Error('ไม่สามารถอ่าน IndexedDB'));
      };
    });
  }

  // ── 2. ดึง docs ทั้ง collection ผ่าน REST ─────────────
  async function fetchCollection(colName, token) {
    const base = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/${colName}`;
    const docs = {};
    let   pageToken = null;

    do {
      const url  = pageToken ? `${base}?pageToken=${pageToken}` : base;
      const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${await resp.text()}`);
      const json = await resp.json();

      (json.documents || []).forEach(doc => {
        const id = doc.name.split('/').pop();
        docs[id]  = parseFields(doc.fields || {});
      });
      pageToken = json.nextPageToken || null;
    } while (pageToken);

    return docs;
  }

  // ── 3. แปลง Firestore field types → plain JS ──────────
  function parseFields(fields) {
    const out = {};
    for (const [k, v] of Object.entries(fields)) {
      out[k] = parseValue(v);
    }
    return out;
  }
  function parseValue(v) {
    if ('stringValue'    in v) return v.stringValue;
    if ('integerValue'   in v) return Number(v.integerValue);
    if ('doubleValue'    in v) return v.doubleValue;
    if ('booleanValue'   in v) return v.booleanValue;
    if ('nullValue'      in v) return null;
    if ('timestampValue' in v) return v.timestampValue;
    if ('mapValue'       in v) return parseFields(v.mapValue.fields || {});
    if ('arrayValue'     in v) return (v.arrayValue.values || []).map(parseValue);
    if ('referenceValue' in v) return v.referenceValue;
    return v;
  }

  // ── 4. Download helper ─────────────────────────────────
  function download(filename, data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  // ── 5. Main ───────────────────────────────────────────
  let token;
  try {
    token = await getFirebaseToken();
    console.log('✅ พบ auth token');
  } catch (err) {
    console.error('❌', err.message);
    return;
  }

  const meta = { timestamp: new Date().toISOString(), project: PROJECT, collections: {} };
  let total = 0;

  for (const col of COLS) {
    try {
      const docs  = await fetchCollection(col, token);
      const count = Object.keys(docs).length;
      meta.collections[col] = count;
      total += count;
      download(`backup_${col}.json`, docs);
      console.log(`✅ ${col.padEnd(16)} — ${count} docs`);
      await new Promise(r => setTimeout(r, 500));
    } catch (err) {
      console.warn(`⚠️  ${col}: ${err.message}`);
      meta.collections[col] = 'ERROR';
    }
  }

  download('backup__info.json', meta);
  console.log(`\n📦 เสร็จ — ${total} docs ทั้งหมด  |  ดูไฟล์ใน Downloads`);
})();
