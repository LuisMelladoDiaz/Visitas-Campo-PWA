// ─── Shared utils ─────────────────────────────────────────────────────────────
export function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
export function fmtNum(n, dec = 2) { return n == null ? '—' : Number(n).toFixed(dec); }
export function today() { return new Date().toISOString().slice(0, 10); }
export function nowTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

export function thresholdStatus(value, limit) {
  if (limit === 0) return value > 0 ? 'danger' : 'ok';
  if (value >= limit) return 'danger';
  if (value >= limit * 0.8) return 'warn';
  return 'ok';
}

export function classCss(c) {
  if (c === 'Extra')       return 'class-extra';
  if (c === 'Clase 1')     return 'class-1';
  if (c === 'Clase 2')     return 'class-2';
  if (c === 'Industria')   return 'class-ind';
  if (c === 'No conforme') return 'class-nc';
  return 'class-none';
}
