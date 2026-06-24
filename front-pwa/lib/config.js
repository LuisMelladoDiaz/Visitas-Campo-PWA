const CONFIG_KEY = 'cc_config_v1';

export const DEFAULT_CONFIG = {
  empresa: {
    nombre: 'Torremesa',
  },
  productos: [
    { id: 'uva',       nombre: 'Uva de Mesa', icono: '🍇', tiene_cvu: true,  tiene_pcc: true,  activo: true },
    { id: 'remolacha', nombre: 'Remolacha',   icono: '🔴', tiene_cvu: true,  tiene_pcc: false, activo: true },
    { id: 'boniato',   nombre: 'Boniato',     icono: '🍠', tiene_cvu: true,  tiene_pcc: false, activo: true },
    { id: 'calabaza',  nombre: 'Calabaza',    icono: '🎃', tiene_cvu: true,  tiene_pcc: true,  activo: true },
    { id: 'pimiento',  nombre: 'Pimiento',    icono: '🫑', tiene_cvu: false, tiene_pcc: true,  activo: true },
  ],
  variedades: {
    uva:       ['Sweet Globe', 'Sweet Celebration', 'Candy Snap'],
    remolacha: ['Mónaco', 'Boto', 'Roja Redonda'],
    boniato:   ['Beauregard', 'Covington', 'Jewel'],
    calabaza:  ['Butternut', 'Cacahuete', 'Moscata'],
    pimiento:  ['California Rojo', 'California Verde', 'Lamuyo', 'Italiano'],
  },
  defectosCvu: {
    uva: {
      leves: [
        { key: 'desgrane',           label: 'Desgrane',            okVal: 'No' },
        { key: 'bayasRotas',         label: 'Bayas rotas',         okVal: 'No' },
        { key: 'escobajoMarron',     label: 'Escobajo marrón',     okVal: 'No' },
        { key: 'bayasDeshidratadas', label: 'Bayas deshidratadas', okVal: 'No' },
        { key: 'suciedad',           label: 'Presencia suciedad',  okVal: 'No' },
      ],
      graves: [{ key: 'plagaPicado', label: 'Plaga / picado', okVal: 'No' }],
      elim: [
        { key: 'cuerposExtranos', label: 'Cuerpos extraños', okVal: 'No' },
        { key: 'podridos',        label: 'Podridos',          okVal: 'No' },
      ],
    },
    remolacha: {
      leves: [
        { key: 'golpesHeridasManchas', label: 'Golpes, heridas y manchas',               okVal: 'No' },
        { key: 'puntasRotas',          label: 'Puntas rotas',                              okVal: 'No' },
        { key: 'defectosApariencia',   label: 'Defectos globales de apariencia',           okVal: 'No' },
        { key: 'hojaVieja',            label: 'Hoja vieja',                                okVal: 'No' },
        { key: 'puntaBlancaHumeda',    label: 'Punta blanca húmeda',                      okVal: 'No' },
        { key: 'daNosMecanicos',       label: 'Daños mecánicos (cicatrizadas > 10mm²)',    okVal: 'No' },
        { key: 'suciedad',             label: 'Presencia suciedad',                        okVal: 'No' },
      ],
      graves: [{ key: 'plagaPicado', label: 'Plagas / picados', okVal: 'No' }],
      elim: [
        { key: 'cuerposExtranos', label: 'Cuerpos extraños',  okVal: 'No' },
        { key: 'podridos',        label: 'Podridos',           okVal: 'No' },
        { key: 'rotosRajados',    label: 'Rotos o rajados',    okVal: 'No' },
      ],
    },
    boniato: {
      leves: [
        { key: 'despellejados',         label: 'Despellejados',                          okVal: 'No' },
        { key: 'puntasRotas',           label: 'Puntas rotas',                            okVal: 'No' },
        { key: 'defectosApariencia',    label: 'Defectos globales de apariencia',         okVal: 'No' },
        { key: 'rebrotesMayores5mm',    label: 'Rebrotes mayores de 5mm',                okVal: 'No' },
        { key: 'puntasDeshidratadas30', label: 'Puntas deshidratadas > 30mm',            okVal: 'No' },
        { key: 'densidadRaices',        label: 'Densidad de raíces',                     okVal: 'No' },
        { key: 'daNosMecanicos',        label: 'Daños mecánicos (cicatrizadas > 10mm²)', okVal: 'No' },
      ],
      graves: [{ key: 'plagaPicado', label: 'Plagas / picados', okVal: 'No' }],
      elim: [
        { key: 'cuerposExtranos', label: 'Cuerpos extraños', okVal: 'No' },
        { key: 'podridos',        label: 'Podridos',          okVal: 'No' },
        { key: 'rotosRajados',    label: 'Rotos o rajados',   okVal: 'No' },
      ],
    },
    calabaza: {
      leves: [
        { key: 'defectosApariencia',    label: 'Defectos globales de apariencia',         okVal: 'No' },
        { key: 'puntasDeshidratadas30', label: 'Puntas deshidratadas > 30mm',            okVal: 'No' },
        { key: 'densidadRaices',        label: 'Densidad de raíces',                     okVal: 'No' },
        { key: 'daNosMecanicos',        label: 'Daños mecánicos (cicatrizadas > 10mm²)', okVal: 'No' },
      ],
      graves: [{ key: 'plagaPicado', label: 'Plagas / picados', okVal: 'No' }],
      elim: [
        { key: 'cuerposExtranos', label: 'Cuerpos extraños', okVal: 'No' },
        { key: 'podridos',        label: 'Podridos',          okVal: 'No' },
        { key: 'rotosRajados',    label: 'Rotos o rajados',   okVal: 'No' },
      ],
    },
  },
  defectosPcc: {
    uva: [
      { key: 'materiaExtrana',   label: 'Materia extraña',         toleranciaCero: false },
      { key: 'suciaPolvo',       label: 'Sucia / con polvo',        toleranciaCero: false },
      { key: 'deshidratadas',    label: 'Deshidratadas',            toleranciaCero: false },
      { key: 'picadas',          label: 'Picada / mordisqueada',    toleranciaCero: false },
      { key: 'rotas',            label: 'Rotas / desgrane',         toleranciaCero: false },
      { key: 'manchasSol',       label: 'Manchas de sol',           toleranciaCero: true  },
      { key: 'podridas',         label: 'Podridas',                 toleranciaCero: true  },
      { key: 'otros',            label: 'Otros',                    toleranciaCero: false },
    ],
    pimiento: [
      { key: 'materiasExtranas',    label: 'Materias extrañas',          toleranciaCero: true  },
      { key: 'sucio',               label: 'Sucio',                       toleranciaCero: false },
      { key: 'picadoMordisqueado',  label: 'Picado / mordisqueado',       toleranciaCero: false },
      { key: 'rajado',              label: 'Rajado',                      toleranciaCero: false },
      { key: 'herida',              label: 'Herida (grieta)',              toleranciaCero: false },
      { key: 'deformado',           label: 'Deformado',                   toleranciaCero: false },
      { key: 'danoMecanico',        label: 'Daño mecánico',               toleranciaCero: false },
      { key: 'manchado',            label: 'Manchado',                    toleranciaCero: false },
      { key: 'cortado',             label: 'Cortado',                     toleranciaCero: false },
      { key: 'sinPedunculo',        label: 'Sin pedúnculo',               toleranciaCero: false },
      { key: 'sinMadurez',          label: 'Sin madurez',                 toleranciaCero: false },
      { key: 'pesoFueraCalibre',    label: 'Peso fuera de calibre',       toleranciaCero: false },
      { key: 'pudriciones',         label: 'Pudriciones',                 toleranciaCero: true  },
      { key: 'manchasSolPeseta',    label: 'Manchas del sol o peseta',    toleranciaCero: false },
    ],
    calabaza: [
      { key: 'materiasExtranas',    label: 'Materias extrañas',           toleranciaCero: true  },
      { key: 'sucio',               label: 'Sucio',                       toleranciaCero: false },
      { key: 'picadoMordisqueado',  label: 'Picado / mordisqueado',       toleranciaCero: false },
      { key: 'rajado',              label: 'Rajado',                      toleranciaCero: false },
      { key: 'herida',              label: 'Herida (grieta)',              toleranciaCero: false },
      { key: 'deformado',           label: 'Deformado',                   toleranciaCero: false },
      { key: 'danoMecanico',        label: 'Daño mecánico',               toleranciaCero: false },
      { key: 'manchado',            label: 'Manchado',                    toleranciaCero: false },
      { key: 'cortado',             label: 'Cortado',                     toleranciaCero: false },
      { key: 'sinPedunculo',        label: 'Sin pedúnculo',               toleranciaCero: false },
      { key: 'verdesSinMadurez',    label: 'Verdes / sin madurez',        toleranciaCero: false },
      { key: 'pesoFueraCalibre',    label: 'Peso fuera de calibre',       toleranciaCero: false },
    ],
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
      empresa:     { ...DEFAULT_CONFIG.empresa, ...stored.empresa },
      productos:   stored.productos   ?? DEFAULT_CONFIG.productos,
      variedades:  stored.variedades  ?? DEFAULT_CONFIG.variedades,
      defectosCvu: stored.defectosCvu ?? DEFAULT_CONFIG.defectosCvu,
      defectosPcc: stored.defectosPcc ?? DEFAULT_CONFIG.defectosPcc,
      formatos:    stored.formatos    ?? DEFAULT_CONFIG.formatos,
      umbrales:    stored.umbrales    ?? DEFAULT_CONFIG.umbrales,
      clases:      stored.clases      ?? DEFAULT_CONFIG.cvu.clases,
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
