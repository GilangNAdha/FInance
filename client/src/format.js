/** Format mata uang & tanggal (id-ID) */

const currencyFmt = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export const money = (n) => currencyFmt.format(Number(n) || 0);

export const moneyShort = (n) => {
  const v = Number(n) || 0;
  const abs = Math.abs(v);
  if (abs >= 1_000_000_000) return `Rp ${(v / 1_000_000_000).toFixed(1).replace('.', ',')} M`;
  if (abs >= 1_000_000) return `Rp ${(v / 1_000_000).toFixed(1).replace('.', ',')} jt`;
  if (abs >= 1_000) return `Rp ${(v / 1_000).toFixed(0)} rb`;
  return currencyFmt.format(v);
};

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const MONTHS_LONG = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];
const DAYS_SHORT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export function todayISO() {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

export function formatDate(iso) {
  if (!iso) return '-';
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${MONTHS_SHORT[m - 1]} ${y}`;
}

export function formatLongDate(date = new Date()) {
  const days = DAYS_SHORT[date.getDay()];
  return `${days}, ${date.getDate()} ${MONTHS_LONG[date.getMonth()]} ${date.getFullYear()}`;
}

export function monthLabel(date = new Date()) {
  return `${MONTHS_LONG[date.getMonth()]} ${date.getFullYear()}`;
}
