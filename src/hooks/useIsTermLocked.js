/**
 * useIsTermLocked(isoDate)
 *
 * Returns true if the given CE ISO date ('YYYY-MM-DD') falls inside a term
 * that has been locked by admin.
 *
 * Lock key format:  "${academicYear}-${termIndex}"
 *   e.g. "2567-0" = ภาคเรียนที่ 1 ปีการศึกษา 2567
 *        "2567-1" = ภาคเรียนที่ 2 ปีการศึกษา 2567
 *
 * Terms are stored in schoolTerms[academicYear] as an array of
 *   { label, open, close } where open/close are CE ISO strings.
 */
import { useApp } from '../context/AppContext';

export function useIsTermLocked(isoDate) {
  const { lockedTerms, schoolTerms, academicYear } = useApp();
  if (!isoDate) return false;
  const terms = schoolTerms?.[academicYear] ?? [];
  const idx = terms.findIndex(
    t => t.open && t.close && isoDate >= t.open && isoDate <= t.close,
  );
  if (idx === -1) return false;
  return !!lockedTerms?.[`${academicYear}-${idx}`];
}
