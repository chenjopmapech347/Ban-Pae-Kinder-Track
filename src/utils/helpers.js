export function getLevelColor(level) {
  switch (level) {
    case 'K1':
      return 'badge-k1';
    case 'K2':
      return 'badge-k2';
    case 'K3':
      return 'badge-k3';
    default:
      return '';
  }
}

export function getQualityText(score) {
  if (score === 3) return 'ดี';
  if (score === 2) return 'พอใช้';
  return 'ควรส่งเสริม';
}

export function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function formatDateThai(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}-${m}-${y}`;
}
