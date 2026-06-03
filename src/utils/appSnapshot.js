export const SNAPSHOT_VERSION = 1;

export function buildAppSnapshot(data) {
  return {
    version: SNAPSHOT_VERSION,
    exportedAt: new Date().toISOString(),
    ...data,
  };
}

export function validateSnapshot(raw) {
  if (!raw || typeof raw !== 'object') {
    return { ok: false, message: 'ไฟล์ไม่ถูกต้อง' };
  }
  if (!Array.isArray(raw.students)) {
    return { ok: false, message: 'ไม่พบรายการนักเรียนในไฟล์' };
  }
  return { ok: true, snapshot: raw };
}
