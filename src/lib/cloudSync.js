import { supabase } from './supabase';

const SNAPSHOT_ROW_ID = 'default';

export async function pullSnapshotFromCloud() {
  if (!supabase) {
    return { ok: false, message: 'ไม่พบการตั้งค่า VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY' };
  }

  const { data, error } = await supabase
    .from('kindergarten_snapshots')
    .select('payload, updated_at')
    .eq('id', SNAPSHOT_ROW_ID)
    .maybeSingle();

  if (error) {
    return { ok: false, message: error.message };
  }
  if (!data?.payload) {
    return { ok: false, message: 'ยังไม่มีข้อมูลบนคลาวด์ — ลองอัปโหลดจากเครื่องนี้ก่อน' };
  }

  return { ok: true, payload: data.payload, updatedAt: data.updated_at };
}

export async function pushSnapshotToCloud(payload) {
  if (!supabase) {
    return { ok: false, message: 'ไม่พบการตั้งค่า Supabase' };
  }

  const { error } = await supabase.from('kindergarten_snapshots').upsert({
    id: SNAPSHOT_ROW_ID,
    payload,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    return { ok: false, message: error.message };
  }
  return { ok: true };
}
