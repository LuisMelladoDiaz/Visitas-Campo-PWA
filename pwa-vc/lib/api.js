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

// ─── Mappers Tanda ────────────────────────────────────────────────────────────

function tandaToRow(t) {
  return {
    id:                t.id,
    variety:           t.variety,
    confeccion:        t.confeccion,
    variedad:          t.variedad   || null,
    categoria_inicial: t.categoriaInicial,
    trazabilidad:      t.trazabilidad,
    peso_inicial:      t.pesoInicial,
    fecha:             t.fecha,
    nota:              t.nota       || null,
  };
}

function lecturaToRow(tanda_id, r) {
  return {
    tanda_id,
    dia:                  r.dia,
    fecha:                r.fecha,
    trazabilidad:         r.trazabilidad         || null,
    peso_diario:          r.pd                   ?? null,
    temp_conservacion:    r.tempConservacion      ?? null,
    desgrane:             r.desgrane             || null,
    bayas_rotas:          r.bayasRotas           || null,
    escobajo_marron:      r.escobajoMarron       || null,
    bayas_deshidratadas:  r.bayasDeshidratadas   || null,
    suciedad:             r.suciedad             || null,
    plaga_picado:         r.plagaPicado          || null,
    cuerpos_extranos:     r.cuerposExtranos      || null,
    podridos:             r.podridos             || null,
    peso_faltas_leves:    r.pesoFaltasLeves      ?? 0,
    peso_faltas_graves:   r.pesoFaltasGraves     ?? 0,
    peso_faltas_elim:     r.pesoFaltasElim       ?? 0,
    pct_perdida:          r.pctPerdida           ?? null,
    pct_leves:            r.pctLeves             ?? null,
    pct_graves:           r.pctGraves            ?? null,
    pct_elim:             r.pctElim              ?? null,
    pct_total:            r.pctTotal             ?? null,
    pct_calibre:          r.pctCalibre           ?? null,
    clasificacion:        r.clasificacion        ?? null,
    photo_url:            null, // gestionado por uploadPhoto()
  };
}

function lecturaFromRow(row) {
  return {
    dia:               row.dia,
    fecha:             row.fecha,
    trazabilidad:      row.trazabilidad,
    pd:                row.peso_diario         != null ? parseFloat(row.peso_diario)         : 0,
    tempConservacion:  row.temp_conservacion   != null ? parseFloat(row.temp_conservacion)   : null,
    desgrane:          row.desgrane,
    bayasRotas:        row.bayas_rotas,
    escobajoMarron:    row.escobajo_marron,
    bayasDeshidratadas:row.bayas_deshidratadas,
    suciedad:          row.suciedad,
    plagaPicado:       row.plaga_picado,
    cuerposExtranos:   row.cuerpos_extranos,
    podridos:          row.podridos,
    pesoFaltasLeves:   parseFloat(row.peso_faltas_leves)  || 0,
    pesoFaltasGraves:  parseFloat(row.peso_faltas_graves) || 0,
    pesoFaltasElim:    parseFloat(row.peso_faltas_elim)   || 0,
    pctPerdida:        row.pct_perdida   != null ? parseFloat(row.pct_perdida)   : 0,
    pctLeves:          row.pct_leves     != null ? parseFloat(row.pct_leves)     : 0,
    pctGraves:         row.pct_graves    != null ? parseFloat(row.pct_graves)    : 0,
    pctElim:           row.pct_elim      != null ? parseFloat(row.pct_elim)      : 0,
    pctTotal:          row.pct_total     != null ? parseFloat(row.pct_total)     : 0,
    pctCalibre:        row.pct_calibre   != null ? parseFloat(row.pct_calibre)   : 0,
    clasificacion:     row.clasificacion,
    photo:             row.photo_url     || null,
  };
}

function tandaFromRows(row, lecturasRows) {
  return {
    id:               row.id,
    variety:          row.variety,
    confeccion:       row.confeccion,
    variedad:         row.variedad,
    categoriaInicial: row.categoria_inicial,
    trazabilidad:     row.trazabilidad,
    pesoInicial:      parseFloat(row.peso_inicial),
    fecha:            row.fecha,
    nota:             row.nota,
    readings:         (lecturasRows || []).map(lecturaFromRow).sort((a, b) => a.dia - b.dia),
  };
}

// ─── Mappers PCC ──────────────────────────────────────────────────────────────

function pccToRow(p) {
  return {
    id:          p.id,
    fecha:       p.fecha,
    hora:        p.hora        || null,
    responsable: p.responsable || null,
    variedad:    p.variedad    || null,
    trazabilidad:p.trazabilidad|| null,
    cinta_num:   p.cinaNum     || null,
    mesa_num:    p.mesaNum     || null,
    formato_id:  p.formato     || null,
    para_so2:    p.paraSO2     ?? false,
    n_muestras:  p.nMuestras   ?? 10,
    resultado:   p.resultado   || null,
  };
}

function muestraToRow(parte_id, m) {
  return {
    parte_id,
    num:               m.num,
    hora:              m.hora                          || null,
    peso_g:            m.peso         ? parseFloat(m.peso)         : null,
    calibre_mm:        m.calibre      ? parseFloat(m.calibre)      : null,
    pct_fuera_calibre: m.pctFueraCalibre ? parseFloat(m.pctFueraCalibre) : null,
    num_racimos:       m.numRacimos   ? parseInt(m.numRacimos)   : null,
    homogeneidad:      m.homogeneidad || null,
    condicion_escobajo:m.condicionEscobajo || null,
    coloracion:        m.coloracion   ? parseInt(m.coloracion)   : null,
    brix:              m.brix         ? parseFloat(m.brix)         : null,
    total_bayas:       m.totalBayas   ? parseInt(m.totalBayas)   : null,
    materia_extrana:   parseInt(m.materiaExtrana) || 0,
    sucia_polvo:       parseInt(m.suciaPolvo)     || 0,
    deshidratadas:     parseInt(m.deshidratadas)  || 0,
    picadas:           parseInt(m.picadas)         || 0,
    rotas:             parseInt(m.rotas)            || 0,
    manchas_sol:       parseInt(m.manchasSol)      || 0,
    podridas:          parseInt(m.podridas)         || 0,
    otros:             parseInt(m.otros)            || 0,
    otros_desc:        m.otrosDesc                 || null,
    pct_defectos:      null,
    resultado:         m.resultado                 || null,
  };
}

function muestraFromRow(row) {
  return {
    num:               row.num,
    hora:              row.hora,
    peso:              row.peso_g          != null ? String(row.peso_g)          : '',
    calibre:           row.calibre_mm      != null ? String(row.calibre_mm)      : '',
    pctFueraCalibre:   row.pct_fuera_calibre != null ? String(row.pct_fuera_calibre) : '',
    numRacimos:        row.num_racimos     != null ? String(row.num_racimos)     : '',
    homogeneidad:      row.homogeneidad    || '',
    condicionEscobajo: row.condicion_escobajo || '',
    coloracion:        row.coloracion      != null ? String(row.coloracion)      : '',
    brix:              row.brix            != null ? String(row.brix)            : '',
    totalBayas:        row.total_bayas     != null ? String(row.total_bayas)     : '',
    materiaExtrana:    String(row.materia_extrana || 0),
    suciaPolvo:        String(row.sucia_polvo     || 0),
    deshidratadas:     String(row.deshidratadas   || 0),
    picadas:           String(row.picadas          || 0),
    rotas:             String(row.rotas             || 0),
    manchasSol:        String(row.manchas_sol      || 0),
    podridas:          String(row.podridas          || 0),
    otros:             String(row.otros             || 0),
    otrosDesc:         row.otros_desc              || '',
    resultado:         row.resultado,
  };
}

function pccFromRows(row, muestrasRows) {
  return {
    id:           row.id,
    fecha:        row.fecha,
    hora:         row.hora,
    responsable:  row.responsable,
    variedad:     row.variedad,
    trazabilidad: row.trazabilidad,
    cinaNum:      row.cinta_num,
    mesaNum:      row.mesa_num,
    formato:      row.formato_id,
    paraSO2:      row.para_so2,
    nMuestras:    row.n_muestras,
    resultado:    row.resultado,
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
      .from('lectura-photos')
      .upload(path, bytes.buffer, { contentType: 'image/jpeg', upsert: true });
    if (error) return null;
    const { data } = supabase.storage.from('lectura-photos').getPublicUrl(path);
    return data.publicUrl;
  } catch {
    return null;
  }
}

// ─── Tandas ───────────────────────────────────────────────────────────────────

export async function loadBatches() {
  const { data: tandas, error: e1 } = await supabase
    .from('tandas')
    .select('*')
    .order('fecha', { ascending: false });

  if (e1) {
    return cacheRead(STORAGE_KEY) || [];
  }

  const { data: lecturas } = await supabase
    .from('lecturas')
    .select('*')
    .order('dia');

  const lecMap = {};
  (lecturas || []).forEach(l => {
    (lecMap[l.tanda_id] = lecMap[l.tanda_id] || []).push(l);
  });

  const result = tandas.map(t => tandaFromRows(t, lecMap[t.id]));
  cacheWrite(STORAGE_KEY, result);
  return result;
}

export async function saveBatch(tanda) {
  // Upsert tanda
  const { error: e1 } = await supabase.from('tandas').upsert(tandaToRow(tanda));
  if (e1) throw new Error(`Error guardando tanda: ${e1.message}`);

  // Reemplazar lecturas (delete + insert, más simple que upsert con UNIQUE constraint)
  await supabase.from('lecturas').delete().eq('tanda_id', tanda.id);

  const rows = await Promise.all(tanda.readings.map(async r => {
    const photo_url = r.photo?.startsWith('data:')
      ? await uploadPhoto(tanda.id, r.dia, r.photo)
      : (r.photo || null);
    return { ...lecturaToRow(tanda.id, r), photo_url };
  }));

  if (rows.length > 0) {
    const { error: e2 } = await supabase.from('lecturas').insert(rows);
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
  const { error } = await supabase.from('tandas').delete().eq('id', id);
  if (error) throw new Error(`Error eliminando tanda: ${error.message}`);
  cacheRemoveItem(STORAGE_KEY, id);
}

// ─── PCCs ─────────────────────────────────────────────────────────────────────

export async function loadPCCs() {
  const { data: partes, error: e1 } = await supabase
    .from('partes_pcc')
    .select('*')
    .order('fecha', { ascending: false });

  if (e1) {
    return cacheRead(PCC_KEY) || [];
  }

  const { data: muestras } = await supabase
    .from('muestras_pcc')
    .select('*')
    .order('num');

  const muestrasMap = {};
  (muestras || []).forEach(m => {
    (muestrasMap[m.parte_id] = muestrasMap[m.parte_id] || []).push(m);
  });

  const result = partes.map(p => pccFromRows(p, muestrasMap[p.id]));
  cacheWrite(PCC_KEY, result);
  return result;
}

export async function savePCC(pcc) {
  const { error: e1 } = await supabase.from('partes_pcc').upsert(pccToRow(pcc));
  if (e1) throw new Error(`Error guardando PCC: ${e1.message}`);

  await supabase.from('muestras_pcc').delete().eq('parte_id', pcc.id);

  const rows = pcc.muestras.map(m => muestraToRow(pcc.id, m));
  if (rows.length > 0) {
    const { error: e2 } = await supabase.from('muestras_pcc').insert(rows);
    if (e2) throw new Error(`Error guardando muestras: ${e2.message}`);
  }

  cacheUpsertItem(PCC_KEY, pcc);
  return pcc;
}

export async function deletePCC(id) {
  const { error } = await supabase.from('partes_pcc').delete().eq('id', id);
  if (error) throw new Error(`Error eliminando PCC: ${error.message}`);
  cacheRemoveItem(PCC_KEY, id);
}
