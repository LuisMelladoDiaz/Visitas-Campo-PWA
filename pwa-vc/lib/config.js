const CONFIG_KEY = 'cc_config_v1';

export const DEFAULT_CONFIG = {
  empresa: {
    nombre: 'Torremesa',
  },
  pcc: {
    variedades: ['Sweet Globe', 'Sweet Celebration', 'Candy Snap'],
    formatos: [
      { id: 'caja-madera',  label: 'Caja madera',     sub: '7,5 kg',       nMuestras: 10, pesoRef: 7500 },
      { id: 'caja-carton',  label: 'Caja cartón',      sub: '4,5 kg',       nMuestras: 10, pesoRef: 4500 },
      { id: 'tarrina-500',  label: 'Tarrina ×500 gr',  sub: '10 uds/caja',  nMuestras: 10, pesoRef: 500  },
      { id: 'tarrina-1000', label: 'Tarrina ×1000 gr', sub: '10 uds/caja',  nMuestras: 10, pesoRef: 1000 },
      { id: 'ifco-9',       label: 'Caja IFCO',        sub: '9 kg',         nMuestras: 10, pesoRef: 9000 },
      { id: 'granel',       label: 'Granel',           sub: '',             nMuestras: 5,  pesoRef: null },
    ],
    umbrales: {
      maxDefectosPct: 5,
      minBrix: 11,
      maxCalibrePct: 5,
    },
  },
  cvu: {
    clases: [
      { label: 'Extra',     css: 'class-extra', maxElim: 0,   maxGraves: 0, maxTotal: 2,  maxCalibre: null },
      { label: 'Clase 1',   css: 'class-1',     maxElim: 0,   maxGraves: 2, maxTotal: 10, maxCalibre: 5    },
      { label: 'Clase 2',   css: 'class-2',     maxElim: 1,   maxGraves: 5, maxTotal: 15, maxCalibre: 5    },
      { label: 'Industria', css: 'class-ind',   maxElim: 1,   maxGraves: 5, maxTotal: 20, maxCalibre: 10   },
    ],
  },
};

export function loadConfig() {
  if (typeof window === 'undefined') return DEFAULT_CONFIG;
  try {
    const stored = JSON.parse(localStorage.getItem(CONFIG_KEY) || 'null');
    if (!stored) return DEFAULT_CONFIG;
    return {
      empresa: { ...DEFAULT_CONFIG.empresa, ...stored.empresa },
      pcc: {
        variedades: stored.pcc?.variedades ?? DEFAULT_CONFIG.pcc.variedades,
        formatos:   stored.pcc?.formatos   ?? DEFAULT_CONFIG.pcc.formatos,
        umbrales:   { ...DEFAULT_CONFIG.pcc.umbrales, ...stored.pcc?.umbrales },
      },
      cvu: {
        clases: stored.cvu?.clases ?? DEFAULT_CONFIG.cvu.clases,
      },
    };
  } catch { return DEFAULT_CONFIG; }
}

export function saveConfig(config) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(CONFIG_KEY, JSON.stringify(config)); } catch {}
}
