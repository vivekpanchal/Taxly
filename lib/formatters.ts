export function fmtINR(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return '—';
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(Math.round(n));
  const s = abs.toString();
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3);
  const grouped = rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3 : last3;
  return sign + '₹' + grouped;
}

export function fmtINRShort(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return '—';
  const abs = Math.abs(n);
  if (abs >= 10000000) return '₹' + (n / 10000000).toFixed(2).replace(/\.?0+$/, '') + ' Cr';
  if (abs >= 100000)   return '₹' + (n / 100000).toFixed(2).replace(/\.?0+$/, '') + ' L';
  if (abs >= 1000)     return '₹' + (n / 1000).toFixed(1).replace(/\.?0+$/, '') + 'K';
  return fmtINR(n);
}
