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

/**
 * Compute the raw (decimal) average score for one indicator from student.assessments.indicators.
 * Returns null if no activity scores are present.
 */
export function rawScoreFromIndicator(student, domainId, standardId, indicatorId, term) {
  if (!indicatorId) return null;
  const indKey  = `${domainId}__${standardId}__${indicatorId}`;
  const indData = student?.assessments?.indicators?.[indKey];
  if (!indData || !Object.keys(indData).length) return null;
  const rounds = term === 1 ? ['r1', 'r2'] : ['r3', 'r4'];
  const scores = Object.values(indData)
    .flatMap(actData => rounds.map(r => actData?.[r]).filter(v => v != null && v > 0));
  if (!scores.length) return null;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}
