// ─── API layer — Supabase + localStorage fallback ─────────────────────────────
// Todas las funciones son async. Patrón:
//   1. Actualiza localStorage inmediatamente (offline-first)
//   2. Sincroniza con Supabase en background
//   3. En loadXxx, si Supabase responde OK → actualiza cache local

import { supabase } from './supabase';
import { STORAGE_KEY, PCC_KEY } from './storage';

// ─── Cache helpers ────────────────────────────────────────────────────────────

function cacheRead(key) {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; }
}

function cacheWrite(key, data) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
}

function cacheRemoveItem(key, id) {
  const cached = cacheRead(key) || [];
  cacheWrite(key, cached.filter(x => x.id !== id));
}

function cacheUpsertItem(key, item) {
  const cached = cacheRead(key) || [];
  const idx = cached.findIndex(x => x.id === item.id);
  if (idx >= 0) cached[idx] = item; else cached.unshift(item);
  cacheWrite(key, cached);
}

// ─── Resultado helpers (string ↔ SMALLINT) ────────────────────────────────────
// DB: 0=Pendiente, 1=Conforme, 2=NoConforme
// JS: null / 'C' / 'NC'

function resultadoToInt(r)  { return r === 'C' ? 1 : r === 'NC' ? 2 : 0; }
function resultadoFromInt(n) { return n === 1 ? 'C' : n === 2 ? 'NC' : null; }

// ─── Mappers Tanda ────────────────────────────────────────────────────────────

function tandaToRow(t) {
  return {
    no:                t.id,
    gru_conf:          t.variety || 'UV',
    confeccion:        t.confeccion,
    variedad:          t.variedad          || null,
    categoria_inicial: t.categoriaInicial,
    trazabilidad:      t.trazabilidad,
    peso_inicial:      t.pesoInicial,
    fecha:             t.fecha,
    nota:              t.nota              || null,
  };
}

const LECTURA_NON_DEFECT_KEYS = new Set([
  'dia', 'fecha', 'trazabilidad', 'pd', 'tempConservacion',
  'pesoFaltasLeves', 'pesoFaltasGraves', 'pesoFaltasElim',
  'pctFueraCalibre', 'pctPerdida', 'pctLeves', 'pctGraves', 'pctElim',
  'pctTotal', 'pctCalibre', 'clasificacion', 'photo',
]);

function lecturaToRow(tanda_id, r) {
  const defectos = {};
  for (const key of Object.keys(r)) {
    if (!LECTURA_NON_DEFECT_KEYS.has(key)) defectos[key] = r[key];
  }
  return {
    cod_cabecera_cvu:   tanda_id,
    dia:               r.dia,
    fecha:             r.fecha,
    trazabilidad:      r.trazabilidad      || null,
    peso_diario:       r.pd               ?? null,
    temp_conservacion: r.tempConservacion  ?? null,
    defectos,
    peso_faltas_leves:  r.pesoFaltasLeves  ?? 0,
    peso_faltas_graves: r.pesoFaltasGraves ?? 0,
    peso_faltas_elim:   r.pesoFaltasElim   ?? 0,
    pct_perdida:       r.pctPerdida        ?? null,
    pct_leves:         r.pctLeves          ?? null,
    pct_graves:        r.pctGraves         ?? null,
    pct_elim:          r.pctElim           ?? null,
    pct_total:         r.pctTotal          ?? null,
    pct_calibre:       r.pctCalibre        ?? null,
    clasificacion:     r.clasificacion     ?? null,
    photo_url:         null,
  };
}

function lecturaFromRow(row) {
  return {
    dia:               row.dia,
    fecha:             row.fecha,
    trazabilidad:      row.trazabilidad,
    pd:                row.peso_diario       != null ? parseFloat(row.peso_diario)       : 0,
    tempConservacion:  row.temp_conservacion != null ? parseFloat(row.temp_conservacion) : null,
    ...(row.defectos || {}),
    pesoFaltasLeves:   parseFloat(row.peso_faltas_leves)  || 0,
    pesoFaltasGraves:  parseFloat(row.peso_faltas_graves) || 0,
    pesoFaltasElim:    parseFloat(row.peso_faltas_elim)   || 0,
    pctPerdida:        row.pct_perdida  != null ? parseFloat(row.pct_perdida)  : 0,
    pctLeves:          row.pct_leves    != null ? parseFloat(row.pct_leves)    : 0,
    pctGraves:         row.pct_graves   != null ? parseFloat(row.pct_graves)   : 0,
    pctElim:           row.pct_elim     != null ? parseFloat(row.pct_elim)     : 0,
    pctTotal:          row.pct_total    != null ? parseFloat(row.pct_total)    : 0,
    pctCalibre:        row.pct_calibre  != null ? parseFloat(row.pct_calibre)  : 0,
    clasificacion:     row.clasificacion,
    photo:             row.photo_url    || null,
  };
}

function tandaFromRows(row, lecturasRows) {
  return {
    id:               row.no,
    variety:          row.gru_conf,
    confeccion:       row.confeccion,
    variedad:         row.variedad,
    categoriaInicial: row.categoria_inicial,
    trazabilidad:     row.trazabilidad,
    pesoInicial:      parseFloat(row.peso_inicial),
    fecha:            row.fecha,
    nota:             row.nota,
    bcNo:             row.bc_no      || null,
    bcSyncAt:         row.bc_sync_at || null,
    readings:         (lecturasRows || []).map(lecturaFromRow).sort((a, b) => a.dia - b.dia),
  };
}

// ─── Mappers PCC ──────────────────────────────────────────────────────────────

function pccToRow(p) {
  return {
    no:          p.id,
    gru_conf:    p.variety     || 'UV',
    tipo_conf:   p.formato     || null,
    fecha:       p.fecha,
    hora:        p.hora        || null,
    responsable: p.responsable || null,
    variedad:    p.variedad    || null,
    trazabilidad:p.trazabilidad|| null,
    cinta_num:   p.cinaNum     || null,
    mesa_num:    p.mesaNum     || null,
    datos_extra: p.datosExtra  || { para_so2: p.paraSO2 ?? false },
    n_muestras:  p.nMuestras   ?? 10,
    resultado:   resultadoToInt(p.resultado),
  };
}

const MUESTRA_META_KEYS = new Set(['num', 'hora', 'resultado']);

function muestraToRow(cod_cabecera_pcc, m) {
  const mediciones = {};
  for (const key of Object.keys(m)) {
    if (!MUESTRA_META_KEYS.has(key)) mediciones[key] = m[key];
  }
  return {
    cod_cabecera_pcc,
    no_linea:  m.num,
    hora:      m.hora      || null,
    mediciones,
    resultado: resultadoToInt(m.resultado),
  };
}

function muestraFromRow(row) {
  return {
    num:       row.no_linea,
    hora:      row.hora,
    ...(row.mediciones || {}),
    resultado: resultadoFromInt(row.resultado),
  };
}

function pccFromRows(row, muestrasRows) {
  return {
    id:           row.no,
    fecha:        row.fecha,
    hora:         row.hora,
    responsable:  row.responsable,
    variety:      row.gru_conf,
    variedad:     row.variedad,
    trazabilidad: row.trazabilidad,
    cinaNum:      row.cinta_num,
    mesaNum:      row.mesa_num,
    formato:      row.tipo_conf,
    datosExtra:   row.datos_extra || {},
    paraSO2:      row.datos_extra?.para_so2 ?? false,
    nMuestras:    row.n_muestras,
    resultado:    resultadoFromInt(row.resultado),
    bcNo:         row.bc_no      || null,
    bcSyncAt:     row.bc_sync_at || null,
    muestras:     (muestrasRows || []).map(muestraFromRow).sort((a, b) => a.num - b.num),
  };
}

// ─── Fotos: base64 → Supabase Storage ─────────────────────────────────────────

async function uploadPhoto(tanda_id, dia, dataUrl) {
  if (!dataUrl || !dataUrl.startsWith('data:')) return dataUrl || null;
  try {
    const base64 = dataUrl.split(',')[1];
    const bytes  = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    const path   = `${tanda_id}/dia-${dia}.jpg`;
    const { error } = await supabase.storage
      .from('calidad-fotos')
      .upload(path, bytes.buffer, { contentType: 'image/jpeg', upsert: true });
    if (error) { console.error('uploadPhoto error:', error.message); return null; }
    const { data } = supabase.storage.from('calidad-fotos').getPublicUrl(path);
    return data.publicUrl;
  } catch (e) {
    console.error('uploadPhoto exception:', e);
    return null;
  }
}

// ─── Tandas ───────────────────────────────────────────────────────────────────

export async function loadBatches() {
  const { data: tandas, error: e1 } = await supabase
    .from('lmd_cabecera_cvu')
    .select('*')
    .order('fecha', { ascending: false });

  if (e1) {
    return cacheRead(STORAGE_KEY) || [];
  }

  const { data: lecturas } = await supabase
    .from('lmd_linea_cvu')
    .select('*')
    .order('dia');

  const lecMap = {};
  (lecturas || []).forEach(l => {
    (lecMap[l.cod_cabecera_cvu] = lecMap[l.cod_cabecera_cvu] || []).push(l);
  });

  const result = tandas.map(t => tandaFromRows(t, lecMap[t.no]));
  cacheWrite(STORAGE_KEY, result);
  return result;
}

export async function saveBatch(tanda) {
  const { error: e1 } = await supabase.from('lmd_cabecera_cvu').upsert(tandaToRow(tanda));
  if (e1) throw new Error(`Error guardando tanda: ${e1.message}`);

  await supabase.from('lmd_linea_cvu').delete().eq('cod_cabecera_cvu', tanda.id);

  const rows = await Promise.all(tanda.readings.map(async r => {
    const photo_url = r.photo?.startsWith('data:')
      ? await uploadPhoto(tanda.id, r.dia, r.photo)
      : (r.photo || null);
    return { ...lecturaToRow(tanda.id, r), photo_url };
  }));

  if (rows.length > 0) {
    const { error: e2 } = await supabase.from('lmd_linea_cvu').insert(rows);
    if (e2) throw new Error(`Error guardando lecturas: ${e2.message}`);
  }

  const saved = {
    ...tanda,
    readings: tanda.readings.map((r, i) => ({ ...r, photo: rows[i]?.photo_url ?? r.photo })),
  };
  cacheUpsertItem(STORAGE_KEY, saved);
  return saved;
}

export async function deleteBatch(id) {
  const { error } = await supabase.from('lmd_cabecera_cvu').delete().eq('no', id);
  if (error) throw new Error(`Error eliminando tanda: ${error.message}`);
  cacheRemoveItem(STORAGE_KEY, id);
}

// ─── PCCs ─────────────────────────────────────────────────────────────────────

export async function loadPCCs() {
  const { data: partes, error: e1 } = await supabase
    .from('lmd_cabecera_pcc')
    .select('*')
    .order('fecha', { ascending: false });

  if (e1) {
    return cacheRead(PCC_KEY) || [];
  }

  const { data: muestras } = await supabase
    .from('lmd_linea_pcc')
    .select('*')
    .order('no_linea');

  const muestrasMap = {};
  (muestras || []).forEach(m => {
    (muestrasMap[m.cod_cabecera_pcc] = muestrasMap[m.cod_cabecera_pcc] || []).push(m);
  });

  const result = partes.map(p => pccFromRows(p, muestrasMap[p.no]));
  cacheWrite(PCC_KEY, result);
  return result;
}

export async function savePCC(pcc) {
  const { error: e1 } = await supabase.from('lmd_cabecera_pcc').upsert(pccToRow(pcc));
  if (e1) throw new Error(`Error guardando PCC: ${e1.message}`);

  await supabase.from('lmd_linea_pcc').delete().eq('cod_cabecera_pcc', pcc.id);

  const rows = pcc.muestras.map(m => muestraToRow(pcc.id, m));
  if (rows.length > 0) {
    const { error: e2 } = await supabase.from('lmd_linea_pcc').insert(rows);
    if (e2) throw new Error(`Error guardando muestras: ${e2.message}`);
  }

  cacheUpsertItem(PCC_KEY, pcc);
  return pcc;
}

export async function deletePCC(id) {
  const { error } = await supabase.from('lmd_cabecera_pcc').delete().eq('no', id);
  if (error) throw new Error(`Error eliminando PCC: ${error.message}`);
  cacheRemoveItem(PCC_KEY, id);
}
