// ─── Storage ─────────────────────────────────────────────────────────────────
export const STORAGE_KEY = 'cc_tandas_v1';
export const PCC_KEY     = 'cc_pccs_v1';

export function loadBatches() {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}
export function saveBatches(data) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { }
}
export function loadPCCs() {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(PCC_KEY) || '[]'); }
  catch { return []; }
}
export function savePCCs(data) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(PCC_KEY, JSON.stringify(data)); } catch { }
}
