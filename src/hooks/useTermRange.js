/**
 * useTermRange()
 *
 * ตรวจว่าวันที่ (CE ISO 'YYYY-MM-DD') อยู่ในช่วงเปิด–ปิดเรียนของภาคเรียนใดภาคเรียนหนึ่ง
 * ของปีการศึกษาปัจจุบันหรือไม่ (schoolTerms[academicYear] = [{label, open, close}])
 *
 * - ถ้าปีการศึกษานั้น "ยังไม่ได้กำหนดวันเปิด–ปิดเรียนเลย" → ไม่จำกัด (hasTerms = false)
 * - ถ้ากำหนดแล้ว → วันที่ที่อยู่นอกทุกภาคเรียนถือว่า "บันทึกไม่ได้"
 */
import { useCallback, useMemo } from 'react';
import { useApp } from '../context/AppContext';

export const OUT_OF_TERM_MSG =
  'วันที่นี้อยู่นอกช่วงเปิด–ปิดเรียนที่กำหนดไว้ จึงไม่สามารถบันทึกข้อมูลได้ (ตั้งค่าที่เมนู "วันเปิด-ปิดเรียน")';

export function useTermRange() {
  const { schoolTerms, academicYear } = useApp();

  const ranges = useMemo(
    () => (schoolTerms?.[academicYear] ?? []).filter(t => t?.open && t?.close),
    [schoolTerms, academicYear],
  );
  const hasTerms = ranges.length > 0;

  /** true = บันทึกได้ (อยู่ในภาคเรียน หรือยังไม่ได้ตั้งค่า) */
  const isInTerm = useCallback(
    (iso) => {
      if (!hasTerms) return true;
      if (!iso) return false;
      const d = String(iso).slice(0, 10);
      return ranges.some(t => d >= t.open && d <= t.close);
    },
    [hasTerms, ranges],
  );

  return { hasTerms, isInTerm, ranges };
}
