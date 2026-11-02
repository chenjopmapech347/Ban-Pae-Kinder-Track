// รวมรายการแบบมี id ระหว่าง "ฉบับของเครื่องนี้" กับ "ฉบับล่าสุดบน Firebase"
// โดยอ้างอิง base = ฉบับที่เครื่องนี้ดึงมา/ส่งสำเร็จครั้งล่าสุด (three-way merge)
//   - เครื่องนี้เพิ่ม/แก้/ลบรายการไหน → ใช้ของเครื่องนี้เฉพาะรายการนั้น
//   - รายการที่เครื่องนี้ไม่ได้แตะ → ใช้ฉบับบน Firebase (ได้การแก้ของคนอื่นมาด้วย)
// ป้องกันกรณีเครื่องที่ข้อมูลเก่าส่งรายการทั้งก้อนไปทับงานของคนอื่น

export const MERGE_FIELDS = ['students', 'teachers', 'classes', 'announcements', 'mediaRecords', 'mediaBorrowRecords', 'specialHolidays'];

const keyOf = (item) => (item && item.id != null ? String(item.id) : null);
/** JSON ที่เรียงคีย์คงที่ (Firestore คืนคีย์เรียงต่างจากในเครื่อง) ทิ้งค่า undefined — ใช้เทียบค่าสองฉบับ */
export function stableStringify(v) {
  return JSON.stringify(v, (_k, val) => {
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      return Object.keys(val).sort().reduce((o, key) => {
        if (val[key] !== undefined) o[key] = val[key];
        return o;
      }, {});
    }
    return val;
  });
}
const same = (a, b) => stableStringify(a) === stableStringify(b);

export function indexById(list) {
  const m = new Map();
  (list ?? []).forEach((it) => { const k = keyOf(it); if (k != null) m.set(k, it); });
  return m;
}

/** คืน { merged, changedFromLocal } — merged คือรายการที่ควรส่งขึ้น Firebase */
export function mergeById(base, local, remote) {
  const b = indexById(base);
  const l = indexById(local);
  const r = indexById(remote);
  const out = new Map();

  // เริ่มจากฉบับบน Firebase
  for (const [k, it] of r) out.set(k, it);

  // ใช้ผลงานของเครื่องนี้ทับเฉพาะรายการที่เครื่องนี้แตะ
  for (const [k, it] of l) {
    if (!b.has(k)) out.set(k, it);                 // เพิ่มใหม่
    else if (!same(it, b.get(k))) out.set(k, it);  // แก้ไข
  }
  for (const k of b.keys()) {
    if (!l.has(k)) out.delete(k);                  // ลบ
  }

  // เรียงตามฉบับ Firebase ก่อน แล้วตามด้วยรายการที่เพิ่มใหม่
  const ordered = [];
  for (const k of r.keys()) if (out.has(k)) ordered.push(out.get(k));
  for (const [k, it] of out) if (!r.has(k)) ordered.push(it);

  const merged = ordered;
  const changedFromLocal = !same(merged, local ?? []);
  return { merged, changedFromLocal };
}
