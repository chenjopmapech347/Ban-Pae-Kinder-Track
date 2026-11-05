// reportHelpers.js — shared pure helpers for report sub-components
// Mirrors functions defined at module level in StudentReportTab.jsx.
// Keep in sync if StudentReportTab's originals change.

/** Returns { bg, color } style object for a 1–3 level value. */
export function levelColor(n) {
  if (n === 3) return { bg: '#d1fae5', color: '#065f46' };
  if (n === 2) return { bg: '#fef3c7', color: '#92400e' };
  if (n === 1) return { bg: '#fee2e2', color: '#991b1b' };
  return { bg: '#f3f4f6', color: '#9ca3af' };
}

// ใช้ฟังก์ชันเดียวกับ utils/reportHelpers (ภาค 1 = ผลเดือน ก.ย., ภาค 2 = ผลเดือน ก.พ.)
export { rawScoreFromIndicator } from '../../../utils/reportHelpers';
