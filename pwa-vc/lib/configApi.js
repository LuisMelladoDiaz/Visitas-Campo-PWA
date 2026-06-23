// ─── Config loader — Supabase → mismo formato que DEFAULT_CONFIG ──────────────
import { supabase } from './supabase';
import { DEFAULT_CONFIG } from './config';

export async function loadConfigFromDB() {
  try {
    const [empresa, clases, formatos, variedades, umbrales] = await Promise.all([
      supabase.from('config_empresa').select('*').limit(1).single(),
      supabase.from('config_clases_cvu').select('*').order('orden'),
      supabase.from('config_formatos_pcc').select('*').eq('activo', true),
      supabase.from('config_variedades').select('*').eq('modulo', 'pcc').eq('activo', true).order('orden'),
      supabase.from('config_umbrales_pcc').select('*').limit(1).single(),
    ]);

    return {
      empresa: {
        nombre: empresa.data?.nombre ?? DEFAULT_CONFIG.empresa.nombre,
      },
      pcc: {
        variedades: variedades.data?.map(v => v.nombre) ?? DEFAULT_CONFIG.pcc.variedades,
        formatos: formatos.data?.map(f => ({
          id:        f.codigo,
          label:     f.nombre,
          sub:       f.descripcion || '',
          nMuestras: f.n_muestras,
          pesoRef:   f.peso_ref_g,
        })) ?? DEFAULT_CONFIG.pcc.formatos,
        umbrales: {
          maxDefectosPct: umbrales.data?.max_defectos_pct != null
            ? parseFloat(umbrales.data.max_defectos_pct)
            : DEFAULT_CONFIG.pcc.umbrales.maxDefectosPct,
          minBrix: umbrales.data?.min_brix != null
            ? parseFloat(umbrales.data.min_brix)
            : DEFAULT_CONFIG.pcc.umbrales.minBrix,
          maxCalibrePct: umbrales.data?.max_calibre_pct != null
            ? parseFloat(umbrales.data.max_calibre_pct)
            : DEFAULT_CONFIG.pcc.umbrales.maxCalibrePct,
        },
      },
      cvu: {
        clases: clases.data?.map(c => ({
          label:      c.nombre,
          css:        c.css_key || DEFAULT_CSS_KEY[c.nombre] || 'class-ind',
          maxElim:    c.max_pct_elim    != null ? parseFloat(c.max_pct_elim)    : null,
          maxGraves:  c.max_pct_graves  != null ? parseFloat(c.max_pct_graves)  : null,
          maxTotal:   c.max_pct_total   != null ? parseFloat(c.max_pct_total)   : null,
          maxCalibre: c.max_pct_calibre != null ? parseFloat(c.max_pct_calibre) : null,
        })) ?? DEFAULT_CONFIG.cvu.clases,
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

  // Variedades PCC (reemplazar lista completa)
  if (config.pcc?.variedades) {
    const { data: existing } = await supabase
      .from('config_variedades')
      .select('id, nombre')
      .eq('modulo', 'pcc');

    const existingIds = (existing || []).map(v => v.id);
    await supabase.from('config_variedades').delete().in('id', existingIds);

    const rows = config.pcc.variedades.map((nombre, i) => ({
      modulo: 'pcc',
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
