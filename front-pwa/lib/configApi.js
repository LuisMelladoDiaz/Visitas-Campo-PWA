// ─── Config loader — Supabase → mismo formato que DEFAULT_CONFIG ──────────────
import { supabase } from './supabase';
import { DEFAULT_CONFIG } from './config';

export async function loadConfigFromDB() {
  try {
    const [empresa, clases, productos, variedades, defectosCvuRows, defectosPccRows, formatos, umbrales] = await Promise.all([
      supabase.from('config_empresa').select('*').limit(1).single(),
      supabase.from('config_clases_cvu').select('*').order('orden'),
      supabase.from('config_productos').select('*').eq('activo', true).order('orden'),
      supabase.from('config_variedades').select('*').eq('activo', true).order('orden'),
      supabase.from('config_defectos_cvu').select('*').eq('activo', true).order('orden'),
      supabase.from('config_defectos_pcc').select('*').eq('activo', true).order('orden'),
      supabase.from('config_formatos_pcc').select('*').eq('activo', true),
      supabase.from('config_umbrales_pcc').select('*'),
    ]);

    // Group variedades by producto_id
    const variadesMap = {};
    for (const v of (variedades.data || [])) {
      const pid = v.producto_id || 'uva';
      (variadesMap[pid] = variadesMap[pid] || []).push(v.nombre);
    }

    // Group defectos CVU by producto_id, then by severidad (leves/graves/elim)
    const SEV = { leve: 'leves', grave: 'graves', elim: 'elim' };
    const defectosCvuMap = {};
    for (const d of (defectosCvuRows.data || [])) {
      const pid = d.producto_id || 'uva';
      if (!defectosCvuMap[pid]) defectosCvuMap[pid] = { leves: [], graves: [], elim: [] };
      const sevKey = SEV[d.severidad] || d.severidad || 'leves';
      (defectosCvuMap[pid][sevKey] = defectosCvuMap[pid][sevKey] || []).push({
        key:   d.clave,
        label: d.etiqueta,
        okVal: d.valor_ok || 'No',
      });
    }

    // Group defectos PCC by producto_id
    const defectosPccMap = {};
    for (const d of (defectosPccRows.data || [])) {
      const pid = d.producto_id || 'uva';
      (defectosPccMap[pid] = defectosPccMap[pid] || []).push({
        key:             d.clave,
        label:           d.etiqueta,
        toleranciaCero:  d.tolerancia_cero ?? false,
      });
    }

    // Group formatos by producto_id (null = universal)
    const formatosMap = {};
    for (const f of (formatos.data || [])) {
      const pid = f.producto_id || 'uva';
      (formatosMap[pid] = formatosMap[pid] || []).push({
        id:        f.codigo,
        label:     f.nombre,
        sub:       f.descripcion || '',
        nMuestras: f.n_muestras,
        pesoRef:   f.peso_ref_g,
      });
    }

    // Build umbrales keyed by producto_id
    const umbralesMap = {};
    for (const u of (umbrales.data || [])) {
      const pid = u.producto_id || 'uva';
      umbralesMap[pid] = {
        maxDefectosPct: u.max_defectos_pct != null ? parseFloat(u.max_defectos_pct) : null,
        minBrix:        u.min_brix         != null ? parseFloat(u.min_brix)         : null,
        maxCalibrePct:  u.max_calibre_pct  != null ? parseFloat(u.max_calibre_pct)  : null,
      };
    }

    const clasesMapped = clases.data?.map(c => ({
      label:      c.nombre,
      css:        c.css_key || DEFAULT_CSS_KEY[c.nombre] || 'class-ind',
      maxElim:    c.max_pct_elim    != null ? parseFloat(c.max_pct_elim)    : null,
      maxGraves:  c.max_pct_graves  != null ? parseFloat(c.max_pct_graves)  : null,
      maxTotal:   c.max_pct_total   != null ? parseFloat(c.max_pct_total)   : null,
      maxCalibre: c.max_pct_calibre != null ? parseFloat(c.max_pct_calibre) : null,
    })) ?? DEFAULT_CONFIG.cvu.clases;

    const uvaUmbrales = umbralesMap['uva'] ?? DEFAULT_CONFIG.pcc.umbrales;

    return {
      empresa: {
        nombre: empresa.data?.nombre ?? DEFAULT_CONFIG.empresa.nombre,
      },
      productos: productos.data?.map(p => ({
        id:         p.id,
        nombre:     p.nombre,
        icono:      p.icono,
        tiene_cvu:  p.tiene_cvu  ?? false,
        tiene_pcc:  p.tiene_pcc  ?? false,
        activo:     p.activo     ?? true,
      })) ?? DEFAULT_CONFIG.productos,
      variedades:   Object.keys(variadesMap).length   ? variadesMap   : DEFAULT_CONFIG.variedades,
      defectosCvu:  Object.keys(defectosCvuMap).length ? defectosCvuMap : DEFAULT_CONFIG.defectosCvu,
      defectosPcc:  Object.keys(defectosPccMap).length ? defectosPccMap : DEFAULT_CONFIG.defectosPcc,
      formatos:     Object.keys(formatosMap).length   ? formatosMap   : (DEFAULT_CONFIG.formatos ?? { uva: DEFAULT_CONFIG.pcc.formatos }),
      umbrales:     Object.keys(umbralesMap).length   ? umbralesMap   : (DEFAULT_CONFIG.umbrales ?? { uva: DEFAULT_CONFIG.pcc.umbrales }),
      clases:       clasesMapped,
      // backwards compat for existing screens
      pcc: {
        variedades: variadesMap['uva']        ?? DEFAULT_CONFIG.pcc.variedades,
        formatos:   formatosMap['uva']        ?? DEFAULT_CONFIG.pcc.formatos,
        umbrales:   uvaUmbrales,
      },
      cvu: {
        clases: clasesMapped,
      },
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export async function saveConfigToDB(config) {
  const ops = [];

  // Empresa
  if (config.empresa?.nombre) {
    ops.push(
      supabase.from('config_empresa')
        .update({ nombre: config.empresa.nombre })
        .neq('id', '00000000-0000-0000-0000-000000000000') // update all rows
    );
  }

  // Umbrales PCC
  if (config.pcc?.umbrales) {
    const u = config.pcc.umbrales;
    ops.push(
      supabase.from('config_umbrales_pcc')
        .update({
          max_defectos_pct: u.maxDefectosPct,
          min_brix:         u.minBrix,
          max_calibre_pct:  u.maxCalibrePct,
        })
        .neq('id', '00000000-0000-0000-0000-000000000000')
    );
  }

  // Variedades uva (reemplazar lista completa para producto_id='uva')
  if (config.pcc?.variedades) {
    const { data: existing } = await supabase
      .from('config_variedades')
      .select('id, nombre')
      .eq('producto_id', 'uva');

    const existingIds = (existing || []).map(v => v.id);
    await supabase.from('config_variedades').delete().in('id', existingIds);

    const rows = config.pcc.variedades.map((nombre, i) => ({
      producto_id: 'uva',
      codigo: nombre.toLowerCase().replace(/\s+/g, '-'),
      nombre,
      activo: true,
      orden:  i + 1,
    }));
    ops.push(supabase.from('config_variedades').insert(rows));
  }

  // Clases CVU (actualizar por nombre)
  if (config.cvu?.clases) {
    for (const [i, c] of config.cvu.clases.entries()) {
      ops.push(
        supabase.from('config_clases_cvu')
          .update({
            max_pct_elim:    c.maxElim,
            max_pct_graves:  c.maxGraves,
            max_pct_total:   c.maxTotal,
            max_pct_calibre: c.maxCalibre,
            orden:           i + 1,
          })
          .eq('nombre', c.label)
      );
    }
  }

  await Promise.all(ops);
}

const DEFAULT_CSS_KEY = {
  'Extra':     'class-extra',
  'Clase 1':   'class-1',
  'Clase 2':   'class-2',
  'Industria': 'class-ind',
};
