import Head from 'next/head';
import { useEffect, useState } from 'react';

// ─── Storage ────────────────────────────────────────────────────────────────
const STORAGE_KEY = 'cc_tandas_v1';
const PCC_KEY     = 'cc_pccs_v1';

function loadBatches() {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}
function saveBatches(data) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { }
}
function loadPCCs() {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(PCC_KEY) || '[]'); }
  catch { return []; }
}
function savePCCs(data) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(PCC_KEY, JSON.stringify(data)); } catch { }
}

// ─── Vida Útil constants ────────────────────────────────────────────────────
const varieties = [
  { id: 'uva',       label: 'Uva de Mesa', icon: '🍇' },
  { id: 'calabaza',  label: 'Calabaza',    icon: '🎃', disabled: true },
  { id: 'pimiento',  label: 'Pimiento',    icon: '🫑', disabled: true },
  { id: 'remolacha', label: 'Remolacha',   icon: '🌸', disabled: true },
  { id: 'boniato',   label: 'Boniato',     icon: '🍠', disabled: true },
];

const categorias = ['Extra', 'Clase I', 'Clase II', 'Ind.'];

const TOL = {
  'Extra':    { total: 2,  plagas: 0, cero: 0 },
  'Clase I':  { total: 10, plagas: 2, cero: 0 },
  'Clase II': { total: 15, plagas: 5, cero: 1 },
  'Ind.':     { total: 20, plagas: 9, cero: 1 },
};

// ─── PCC constants ───────────────────────────────────────────────────────────
const VARIEDADES_PCC = ['Sweet Globe', 'Sweet Celebration', 'Candy Snap'];

const FORMATOS_PCC = [
  { id: 'caja-madera',  label: 'Caja madera',     sub: '7,5 kg',       nMuestras: 10, pesoRef: 7500 },
  { id: 'caja-carton',  label: 'Caja cartón',      sub: '4,5 kg',       nMuestras: 10, pesoRef: 4500 },
  { id: 'tarrina-500',  label: 'Tarrina ×500 gr',  sub: '10 uds/caja',  nMuestras: 10, pesoRef: 500  },
  { id: 'tarrina-1000', label: 'Tarrina ×1000 gr', sub: '10 uds/caja',  nMuestras: 10, pesoRef: 1000 },
  { id: 'ifco-9',       label: 'Caja IFCO',        sub: '9 kg',         nMuestras: 10, pesoRef: 9000 },
  { id: 'granel',       label: 'Granel',           sub: '',             nMuestras: 5,  pesoRef: null },
];

const DEFECTOS_BAYAS = [
  { key: 'materiaExtrana', label: 'Materia extraña',       cero: false },
  { key: 'suciaPolvo',     label: 'Sucia / con polvo',     cero: false },
  { key: 'deshidratadas',  label: 'Deshidratadas',         cero: false },
  { key: 'picadas',        label: 'Picada / mordisqueada', cero: false },
  { key: 'rotas',          label: 'Rotas / desgrane',      cero: false },
  { key: 'manchasSol',     label: 'Manchas de sol',        cero: true  },
  { key: 'podridas',       label: 'Podridas',              cero: true  },
  { key: 'otros',          label: 'Otros',                 cero: false },
];

// ─── Vida Útil logic ─────────────────────────────────────────────────────────
const CVU_LEVES = [
  { key: 'desgrane',           label: 'Desgrane',            okVal: 'No' },
  { key: 'bayasRotas',         label: 'Bayas rotas',         okVal: 'No' },
  { key: 'escobajoMarron',     label: 'Escobajo marrón',     okVal: 'No' },
  { key: 'bayasDeshidratadas', label: 'Bayas deshidratadas', okVal: 'No' },
  { key: 'suciedad',           label: 'Presencia suciedad',  okVal: 'No' },
];
const CVU_GRAVES = [
  { key: 'plagaPicado', label: 'Plaga / picado', okVal: 'No' },
];
const CVU_ELIM = [
  { key: 'cuerposExtranos', label: 'Cuerpos extraños', okVal: 'No' },
  { key: 'podridos',        label: 'Podridos',          okVal: 'No' },
];
const CVU_SINO_FIELDS = [...CVU_LEVES, ...CVU_GRAVES, ...CVU_ELIM];

// pL=% leves, pG=% graves, pE=% elim, pT=% total, cal=% fuera calibre
const CVU_CALIDAD = [
  { label: 'Extra',     css: 'class-extra', check: (pL,pG,pE,pT,cal) => pE===0 && pG===0 && pL<=2 },
  { label: 'Clase 1',   css: 'class-1',     check: (pL,pG,pE,pT,cal) => pE===0 && pG<=2  && pT<=10 && cal<=5  },
  { label: 'Clase 2',   css: 'class-2',     check: (pL,pG,pE,pT,cal) => pE<=1  && pG<=5  && pT<=15 && cal<=5  },
  { label: 'Industria', css: 'class-ind',   check: (pL,pG,pE,pT,cal) => pE<=1  && pG<=5  && pT<=20 && cal<=10 },
];

function calcLectura(f, pesoInicial) {
  const pd         = parseFloat(f.pesoDiario) || 0;
  const pi         = pesoInicial || 0;
  const pctPerdida = pi > 0 && pd > 0 ? ((pi - pd) / pi) * 100 : 0;
  const pesoLeves  = parseFloat(f.pesoFaltasLeves)  || 0;
  const pesoGraves = parseFloat(f.pesoFaltasGraves) || 0;
  const pesoElim   = parseFloat(f.pesoFaltasElim)   || 0;
  const pctCalibre = parseFloat(f.pctFueraCalibre)  || 0;
  const pctLeves   = pd > 0 ? (pesoLeves  / pd) * 100 : 0;
  const pctGraves  = pd > 0 ? (pesoGraves / pd) * 100 : 0;
  const pctElim    = pd > 0 ? (pesoElim   / pd) * 100 : 0;
  const pctTotal   = pctLeves + pctGraves + pctElim;
  const found      = pd > 0 ? CVU_CALIDAD.find(c => c.check(pctLeves, pctGraves, pctElim, pctTotal, pctCalibre)) : null;
  const clasificacion = pd > 0 ? (found ? found.label : 'No conforme') : null;
  return { pd, pctPerdida, pesoLeves, pesoGraves, pesoElim, pctLeves, pctGraves, pctElim, pctTotal, pctCalibre, clasificacion };
}

function thresholdStatus(value, limit) {
  if (limit === 0) return value > 0 ? 'danger' : 'ok';
  if (value >= limit) return 'danger';
  if (value >= limit * 0.8) return 'warn';
  return 'ok';
}

function classCss(c) {
  if (c === 'Extra')       return 'class-extra';
  if (c === 'Clase 1')     return 'class-1';
  if (c === 'Clase 2')     return 'class-2';
  if (c === 'Industria')   return 'class-ind';
  if (c === 'No conforme') return 'class-nc';
  return 'class-none';
}

function batchStatusBadge(batch) {
  if (!batch.readings.length) return { label: 'Sin lecturas', css: 'badge-neutral' };
  const c = batch.readings.at(-1).clasificacion;
  if (c === 'Conforme')    return { label: 'Conforme',    css: 'badge-ok' };
  if (c === 'No conforme') return { label: 'No conforme', css: 'badge-danger' };
  return { label: c || '—', css: 'badge-neutral' };
}

// ─── PCC logic ───────────────────────────────────────────────────────────────
function emptyMuestra(num, hora) {
  return {
    num, hora: hora || '', peso: '', calibre: '', pctFueraCalibre: '', numRacimos: '',
    homogeneidad: '', condicionEscobajo: '', coloracion: '', brix: '',
    totalBayas: '', materiaExtrana: '0', suciaPolvo: '0', deshidratadas: '0',
    picadas: '0', rotas: '0', manchasSol: '0', podridas: '0', otros: '0', otrosDesc: '',
  };
}

function calcMuestraRes(m) {
  const total     = parseInt(m.totalBayas) || 0;
  const defs      = DEFECTOS_BAYAS.reduce((s, d) => s + (parseInt(m[d.key]) || 0), 0);
  const pct       = total > 0 ? (defs / total) * 100 : 0;
  const ceroViol  = DEFECTOS_BAYAS.filter(d => d.cero).some(d => (parseInt(m[d.key]) || 0) > 0);
  const calibreViol = m.pctFueraCalibre !== '' && parseFloat(m.pctFueraCalibre) >= 5;
  const brixViol  = m.brix !== '' && parseFloat(m.brix) < 11;
  const resultado = !total ? null : (ceroViol || pct > 5 || calibreViol || brixViol) ? 'NC' : 'C';
  return { total, defs, pct, ceroViol, calibreViol, brixViol, resultado };
}

function calcPCCResultado(muestras) {
  const filled = muestras.filter(m => parseInt(m.totalBayas) > 0 || m.peso !== '');
  if (!filled.length) return null;
  const totalBayas = filled.reduce((s, m) => s + (parseInt(m.totalBayas) || 0), 0);
  if (totalBayas === 0) return null;
  const totalDefs = DEFECTOS_BAYAS.reduce((s, d) =>
    s + filled.reduce((ss, m) => ss + (parseInt(m[d.key]) || 0), 0), 0);
  return (totalDefs / totalBayas) * 100 < 5 ? 'C' : 'NC';
}

function mediaMuestras(muestras, key) {
  const vals = muestras.map(m => parseFloat(m[key])).filter(v => !isNaN(v));
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
}

function calcPCCMedias(muestras) {
  const filled = muestras.filter(m => parseInt(m.totalBayas) > 0 || m.peso !== '');
  const n = filled.length;
  if (!n) return null;
  const totalBayasAll = filled.reduce((s, m) => s + (parseInt(m.totalBayas) || 0), 0);
  const defTotals = {};
  DEFECTOS_BAYAS.forEach(d => {
    defTotals[d.key] = filled.reduce((s, m) => s + (parseInt(m[d.key]) || 0), 0);
  });
  const totalDefsAll = Object.values(defTotals).reduce((a, b) => a + b, 0);
  return {
    n,
    peso: mediaMuestras(filled, 'peso'),
    calibre: mediaMuestras(filled, 'calibre'),
    pctFueraCalibre: mediaMuestras(filled, 'pctFueraCalibre'),
    numRacimos: mediaMuestras(filled, 'numRacimos'),
    coloracion: mediaMuestras(filled, 'coloracion'),
    brix: mediaMuestras(filled, 'brix'),
    homogeneoCount: filled.filter(m => m.homogeneidad === 'Si').length,
    escobajoOkCount: filled.filter(m => m.condicionEscobajo === 'Si').length,
    totalBayasAll,
    defTotals,
    totalDefsAll,
    pctGlobal: totalBayasAll > 0 ? (totalDefsAll / totalBayasAll) * 100 : 0,
    defPcts: Object.fromEntries(
      DEFECTOS_BAYAS.map(d => [d.key, totalBayasAll > 0 ? (defTotals[d.key] / totalBayasAll) * 100 : 0])
    ),
  };
}

function calcBatchSummary(readings) {
  if (!readings.length) return null;
  const n = readings.length;
  const avg = key => {
    const vals = readings.map(r => r[key]).filter(v => v != null && !isNaN(parseFloat(v)));
    return vals.length ? vals.reduce((a, b) => a + parseFloat(b), 0) / vals.length : null;
  };
  const calCounts = Object.fromEntries(
    CVU_CALIDAD.map(c => [c.label, readings.filter(r => r.clasificacion === c.label).length])
  );
  calCounts['No conforme'] = readings.filter(r => r.clasificacion === 'No conforme').length;
  return {
    n,
    peso: avg('pd'),
    pctPerdida: avg('pctPerdida'),
    tempConservacion: avg('tempConservacion'),
    pctLeves:   avg('pctLeves'),
    pctGraves:  avg('pctGraves'),
    pctElim:    avg('pctElim'),
    pctTotal:   avg('pctTotal'),
    pctCalibre: avg('pctCalibre'),
    calCounts,
  };
}

// ─── Shared utils ─────────────────────────────────────────────────────────────
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function fmtNum(n, dec = 2) { return n == null ? '—' : Number(n).toFixed(dec); }
function today() { return new Date().toISOString().slice(0, 10); }
function nowTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

// ─── Print reports ───────────────────────────────────────────────────────────
const PR_CSS = `
  body{font-family:Arial,sans-serif;font-size:10pt;margin:14mm;color:#000}
  .hdr{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #2e6b2e;padding-bottom:10px;margin-bottom:14px}
  .co{font-size:18pt;font-weight:900;color:#2e6b2e}
  .doc{text-align:right}
  .doc-title{font-size:12pt;font-weight:700}
  .doc-sub{font-size:9pt;color:#555}
  h2{font-size:9pt;border-bottom:1.5px solid #000;padding-bottom:3px;margin:14px 0 6px;text-transform:uppercase;letter-spacing:.06em}
  .mg{display:grid;grid-template-columns:1fr 1fr;gap:3px 20px;margin-bottom:12px;font-size:9.5pt}
  .mi{display:flex;gap:5px}
  .ml{font-weight:bold;min-width:110px}
  table{width:100%;border-collapse:collapse;font-size:8pt;margin-top:5px}
  th{background:#eef3ee;padding:4px 5px;text-align:left;font-size:7.5pt;text-transform:uppercase;letter-spacing:.03em;border:1px solid #bbb;white-space:nowrap}
  td{padding:3px 5px;border:1px solid #ddd;white-space:nowrap}
  tr:nth-child(even) td{background:#f9f9f9}
  .res-wrap{text-align:center;margin:10px 0}
  .res-lbl{font-size:8pt;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#555}
  .res-box{font-size:22pt;font-weight:900;padding:7px 22px;border:3px solid currentColor;border-radius:5px;display:inline-block;margin-top:5px}
  .c{color:#1c7a40}.nc{color:#c03030}
  .med-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:5px;margin:5px 0 12px}
  .med-item{border:1px solid #ccc;padding:4px 6px;border-radius:3px;text-align:center}
  .med-lbl{font-size:7pt;color:#555}.med-val{font-size:11pt;font-weight:700}
  .bay-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:3px 14px;font-size:9pt;margin:5px 0}
  .sign-area{display:flex;justify-content:space-between;margin-top:22px}
  .sign-line{border-top:1px solid #000;padding-top:4px;width:200px;text-align:center;font-size:9pt}
  .footer{margin-top:18px;font-size:8.5pt;color:#555;border-top:1px solid #ccc;padding-top:7px;display:flex;justify-content:space-between}
`;

function printBatch(b) {
  const yn = v => v === 'Si' ? '<span style="color:#1c7a40;font-weight:700">Sí</span>'
                : v === 'No' ? '<span style="color:#c03030;font-weight:700">No</span>' : '—';

  const calColor = c => c==='Extra'||c==='Clase 1'?'#1c7a40':c==='Clase 2'||c==='Industria'?'#b45309':'#c03030';
  const pctCol = (v, w, d) => {
    if (v == null) return '—';
    const col = v >= d ? '#c03030' : v >= w ? '#b45309' : '#1c7a40';
    return `<b style="color:${col}">${fmtNum(v,1)}%</b>`;
  };

  const rows = b.readings.map(r => `
    <tr>
      <td><b>${r.dia}</b></td><td>${fmtDate(r.fecha)}</td>
      <td>${r.pd!=null?fmtNum(r.pd):'—'}</td>
      <td><b style="color:${r.pctPerdida>2?'#c03030':r.pctPerdida>1.5?'#b45309':'#1c7a40'}">${r.pctPerdida!=null?fmtNum(r.pctPerdida,1)+'%':'—'}</b></td>
      <td>${r.tempConservacion!=null?r.tempConservacion+'°':'—'}</td>
      <td>${r.pctCalibre!=null?fmtNum(r.pctCalibre,1)+'%':'—'}</td>
      <td>${pctCol(r.pctLeves,2,10)}</td>
      <td>${pctCol(r.pctGraves,2,5)}</td>
      <td style="color:${r.pctElim>0?'#c03030':'#1c7a40'};font-weight:700">${r.pctElim!=null?fmtNum(r.pctElim,2)+'%':'—'}</td>
      <td>${pctCol(r.pctTotal,10,20)}</td>
      <td><b style="color:${calColor(r.clasificacion)}">${r.clasificacion||'—'}</b></td>
    </tr>`).join('');

  // Fila resumen
  const sm = calcBatchSummary(b.readings);
  const smRow = sm ? (() => {
    const okCell = key => {
      const cnt = sm.okCounts[key];
      const allOk = cnt === sm.n, noneOk = cnt === 0;
      return `<span style="font-weight:700;color:${allOk?'#1c7a40':noneOk?'#c03030':'#b45309'}">${cnt}/${sm.n}</span>`;
    };
    const ppColor = sm.pctPerdida > 2 ? '#c03030' : sm.pctPerdida > 1.5 ? '#b45309' : '#1c7a40';
    const calSummary = CVU_CALIDAD.map(c => sm.calCounts[c.label]>0?`${sm.calCounts[c.label]}×${c.label}`:'').filter(Boolean).join(' ') +
      (sm.calCounts['No conforme']>0?` ${sm.calCounts['No conforme']}×NC`:'');
    return `<tr style="background:#f0f4f0;font-weight:700;border-top:2px solid #bbb;font-size:.82rem">
      <td style="color:#888;font-size:.68rem;text-transform:uppercase;letter-spacing:.04em">Media</td>
      <td>—</td>
      <td>${sm.peso!=null?fmtNum(sm.peso,2)+' kg':'—'}</td>
      <td style="color:${ppColor}">${sm.pctPerdida!=null?fmtNum(sm.pctPerdida,1)+'%':'—'}</td>
      <td>${sm.tempConservacion!=null?fmtNum(sm.tempConservacion,1)+'°':'—'}</td>
      <td>${sm.pctCalibre!=null?fmtNum(sm.pctCalibre,1)+'%':'—'}</td>
      <td style="color:${sm.pctLeves>10?'#c03030':sm.pctLeves>2?'#b45309':'#1c7a40'}">${sm.pctLeves!=null?fmtNum(sm.pctLeves,1)+'%':'—'}</td>
      <td style="color:${sm.pctGraves>5?'#c03030':sm.pctGraves>2?'#b45309':'#1c7a40'}">${sm.pctGraves!=null?fmtNum(sm.pctGraves,1)+'%':'—'}</td>
      <td style="color:${sm.pctElim>0?'#c03030':'#1c7a40'}">${sm.pctElim!=null?fmtNum(sm.pctElim,2)+'%':'—'}</td>
      <td style="color:${sm.pctTotal>15?'#c03030':sm.pctTotal>10?'#b45309':'#1c7a40'}">${sm.pctTotal!=null?fmtNum(sm.pctTotal,1)+'%':'—'}</td>
      <td>${calSummary||'—'}</td>
    </tr>`;
  })() : '';

  // Gráficas SVG
  const charts = b.readings.length >= 2 ? (() => {
    const chart1 = svgChartStr(b.readings, [
      { fn: r => r.pd,                 color: '#2e6b2e', label: 'Peso',  unit: ' kg' },
      { fn: r => r.tempConservacion,   color: '#1d6fa4', label: 'Tª',    unit: '°C'  },
    ], 330, 130);
    const chart2 = svgChartStr(b.readings, [
      { fn: r => r.pctLeves!=null?r.pctLeves:null,  color: '#b45309', label: 'Leves',  unit: '%' },
      { fn: r => r.pctGraves!=null?r.pctGraves:null, color: '#c03030', label: 'Graves', unit: '%' },
    ], 300, 130);
    return `
    <h2 style="margin-top:1.5rem;page-break-before:avoid">Evolución temporal</h2>
    <div style="display:flex;gap:2.5rem;flex-wrap:wrap;margin-bottom:1.5rem;align-items:flex-start">
      <div>
        <div style="font-size:7pt;font-weight:700;color:#666;text-transform:uppercase;letter-spacing:.06em;margin-bottom:5px">Peso (kg) y Temperatura (°C)</div>
        ${chart1}
      </div>
      <div>
        <div style="font-size:7pt;font-weight:700;color:#666;text-transform:uppercase;letter-spacing:.06em;margin-bottom:5px">Pérdida de bayas (unidades)</div>
        ${chart2}
      </div>
    </div>`;
  })() : '';

  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
    <title>Vida Útil ${b.id}</title><style>${PR_CSS}</style></head><body>
    <div class="hdr">
      <div class="co">Torremesa</div>
      <div class="doc"><div class="doc-title">Control de Vida Útil</div><div class="doc-sub">Uva de Mesa</div></div>
    </div>
    <div class="mg">
      <div class="mi"><span class="ml">Nº Tanda:</span>${b.id}</div>
      <div class="mi"><span class="ml">Fecha entrada:</span>${fmtDate(b.fecha)}</div>
      <div class="mi"><span class="ml">Confección / Lote:</span>${b.confeccion}</div>
      ${b.variedad?`<div class="mi"><span class="ml">Variedad:</span>${b.variedad}</div>`:''}
      <div class="mi"><span class="ml">Categoría inicial:</span>${b.categoriaInicial}</div>
      <div class="mi"><span class="ml">Trazabilidad:</span>${b.trazabilidad}</div>
      <div class="mi"><span class="ml">Peso inicial:</span>${b.pesoInicial} kg</div>
      ${b.nota?`<div class="mi" style="grid-column:1/-1"><span class="ml">Nota:</span>${b.nota}</div>`:''}
    </div>
    <h2>Historial de lecturas — ${b.readings.length} días</h2>
    ${b.readings.length===0?'<p>Sin lecturas registradas.</p>':`
    <table><thead><tr>
      <th>Día</th><th>Fecha</th><th>Peso (kg)</th><th>% Pérd.</th><th>Tª (°C)</th><th>% Cal.</th>
      <th>% Leves</th><th>% Graves</th><th>% Elim.</th><th>% Total</th><th>Calidad</th>
    </tr></thead><tbody>${rows}${smRow}</tbody></table>`}
    ${charts}
    <div class="sign-area">
      <div class="sign-line">Responsable de calidad</div>
      <div class="sign-line">Responsable de línea</div>
    </div>
    <div class="footer"><span>Impreso: ${new Date().toLocaleDateString('es-ES')}</span><span>${b.id}</span></div>
    <script>window.onload=()=>{window.print();}</script>
    </body></html>`;

  const w = window.open('', '_blank');
  if (w) { w.document.write(html); w.document.close(); }
}

function printPCC(p) {
  const fmt = FORMATOS_PCC.find(f => f.id === p.formato);
  const med = calcPCCMedias(p.muestras);

  const mRows = p.muestras.map(m => {
    const c = calcMuestraRes(m);
    const resColor = c.resultado==='NC'?'#c03030':c.resultado==='C'?'#1c7a40':'#555';
    return `<tr>
      <td><b>${m.num}</b></td>
      <td style="color:#888;font-size:.8rem">${m.hora||'—'}</td>
      <td>${m.peso ? m.peso+' gr' : '—'}</td>
      <td>${m.calibre||'—'}</td>
      <td>${m.pctFueraCalibre!==''?m.pctFueraCalibre+'%':'—'}</td>
      <td>${m.brix?m.brix+'°':'—'}</td>
      <td>${m.coloracion||'—'}</td>
      <td>${m.condicionEscobajo||'—'}</td>
      <td>${m.homogeneidad||'—'}</td>
      <td>${m.numRacimos||'—'}</td>
      <td>${m.totalBayas||'—'}</td>
      <td>${c.total>0?fmtNum(c.pct,1)+'%':'—'}</td>
      <td style="font-weight:700;color:${resColor}">${c.resultado||'—'}</td>
    </tr>`;
  }).join('');

  const mediaRow = med ? `<tr style="background:#f0f0f0;font-weight:700;border-top:2px solid #999">
    <td style="color:#888;font-size:.78rem;text-transform:uppercase">Media</td>
    <td>—</td>
    <td>${med.peso!=null?fmtNum(med.peso,0)+' gr':'—'}</td>
    <td>${med.calibre!=null?fmtNum(med.calibre,1):'—'}</td>
    <td>${med.pctFueraCalibre!=null?fmtNum(med.pctFueraCalibre,1)+'%':'—'}</td>
    <td>${med.brix!=null?fmtNum(med.brix,1)+'°':'—'}</td>
    <td>${med.coloracion!=null?fmtNum(med.coloracion,1):'—'}</td>
    <td>${med.escobajoOkCount}/${med.n} Sí</td>
    <td>${med.homogeneoCount}/${med.n} Sí</td>
    <td>${med.numRacimos!=null?fmtNum(med.numRacimos,1):'—'}</td>
    <td>${med.totalBayasAll}</td>
    <td style="color:${med.pctGlobal>5?'#c03030':med.pctGlobal>4?'#b45309':'#1c7a40'}">${med.totalBayasAll>0?fmtNum(med.pctGlobal,1)+'%':'—'}</td>
    <td>—</td>
  </tr>` : '';

  const baySection = med && med.totalBayasAll > 0 ? `
    <h2>Análisis de bayas — totales globales</h2>
    <table><thead><tr>
      <th>Tipo de defecto</th><th style="text-align:right">Nº bayas</th><th style="text-align:right">% s/total (${med.totalBayasAll} bayas)</th>
    </tr></thead><tbody>
    ${DEFECTOS_BAYAS.map(d => {
      const cnt = med.defTotals[d.key];
      const pct = med.defPcts[d.key];
      const viol = d.cero && cnt > 0;
      return `<tr style="${viol?'background:#fde8e8':''}">
        <td>${d.label}${d.cero?' <span style="background:#c03030;color:#fff;border-radius:3px;padding:1px 4px;font-size:.72rem">TOL 0%</span>':''}</td>
        <td style="text-align:right;font-weight:700;color:${viol?'#c03030':'inherit'}">${cnt}</td>
        <td style="text-align:right;font-weight:700;color:${viol?'#c03030':pct>0?'#b45309':'#888'}">${fmtNum(pct,2)}%</td>
      </tr>`;
    }).join('')}
    <tr style="background:#f0f0f0;font-weight:800;border-top:2px solid #999">
      <td>TOTAL defectos</td>
      <td style="text-align:right">${med.totalDefsAll}</td>
      <td style="text-align:right;color:${med.pctGlobal>5?'#c03030':med.pctGlobal>4?'#b45309':'#1c7a40'}">${fmtNum(med.pctGlobal,2)}% <span style="font-weight:400;font-size:.8rem">(máx 5%)</span></td>
    </tr>
    </tbody></table>` : '';

  const resClass = p.resultado==='C'?'c':p.resultado==='NC'?'nc':'';
  const resText  = p.resultado==='C'?'CONFORME':p.resultado==='NC'?'NO CONFORME':'—';

  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
    <title>Parte Control ${p.id}</title><style>${PR_CSS}</style></head><body>
    <div class="hdr">
      <div class="co">Torremesa</div>
      <div class="doc"><div class="doc-title">Parte de Control de Calidad</div><div class="doc-sub">Uva de Mesa</div></div>
    </div>
    <div class="mg">
      <div class="mi"><span class="ml">Nº Parte:</span>${p.id}</div>
      <div class="mi"><span class="ml">Fecha / Hora:</span>${fmtDate(p.fecha)} &nbsp; ${p.hora}</div>
      ${p.variedad?`<div class="mi"><span class="ml">Variedad:</span>${p.variedad}</div>`:''}
      <div class="mi"><span class="ml">Formato:</span>${fmt?.label||''} ${fmt?.sub||''}</div>
      ${p.responsable?`<div class="mi"><span class="ml">Responsable:</span>${p.responsable}</div>`:''}
      ${p.trazabilidad?`<div class="mi"><span class="ml">Trazabilidad:</span>${p.trazabilidad}</div>`:''}
      ${p.cinaNum?`<div class="mi"><span class="ml">Cinta Nº:</span>${p.cinaNum}</div>`:''}
      ${p.mesaNum?`<div class="mi"><span class="ml">Mesa Nº:</span>${p.mesaNum}</div>`:''}
      <div class="mi"><span class="ml">Tratamiento SO2:</span>${(p.paraSO2||p.paraSoz)?'Sí':'No'}</div>
    </div>
    <div class="res-wrap">
      <div class="res-lbl">Resultado global</div>
      <div class="res-box ${resClass}">${resText}</div>
    </div>
    <h2>Control de muestras (${p.nMuestras})</h2>
    <table><thead><tr>
      <th>M.</th><th>Hora</th><th>Peso (gr)</th><th>Cal.</th><th>% Cal.</th><th>ºBrix</th>
      <th>Color</th><th>Escobajo</th><th>Homog.</th><th>Racimos</th><th>Bayas</th><th>Def.%</th><th>Res.</th>
    </tr></thead><tbody>${mRows}${mediaRow}</tbody></table>
    ${baySection}
    <div class="sign-area">
      <div class="sign-line">Responsable de calidad</div>
      <div class="sign-line">Responsable de línea</div>
    </div>
    <div class="footer"><span>Impreso: ${new Date().toLocaleDateString('es-ES')}</span><span>${p.id}</span></div>
    <script>window.onload=()=>{window.print();}</script>
    </body></html>`;

  const w = window.open('', '_blank');
  if (w) { w.document.write(html); w.document.close(); }
}

// ─── SVG chart helpers ────────────────────────────────────────────────────────
function MiniLineChart({ series, n, title }) {
  const PAD = { t: 8, r: series.length > 1 ? 44 : 10, b: 22, l: 38 };
  const W = 340 - PAD.l - PAD.r;
  const H = 110 - PAD.t - PAD.b;
  const days = n || Math.max(...series.map(s => s.data.length));
  const xOf = i => days > 1 ? (i / (days - 1)) * W + PAD.l : PAD.l + W / 2;
  if (days < 2) return <div style={{width:340,height:110,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--muted)',fontSize:'.78rem'}}>Sin suficientes lecturas</div>;
  return (
    <div>
      {title && <div style={{fontSize:'.75rem',fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:'.2rem'}}>{title}</div>}
      <svg width={340} height={110} style={{overflow:'visible',display:'block'}}>
        <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={PAD.t+H} stroke="var(--border)" strokeWidth="1"/>
        <line x1={PAD.l} y1={PAD.t+H} x2={PAD.l+W} y2={PAD.t+H} stroke="var(--border)" strokeWidth="1"/>
        {Array.from({length:days}).map((_,i)=>(
          <text key={i} x={xOf(i)} y={PAD.t+H+14} textAnchor="middle" fontSize="9" fill="var(--muted)">D{i+1}</text>
        ))}
        {series.map((s, si) => {
          const vals = s.data.filter(v => v != null);
          if (!vals.length) return null;
          const min = Math.min(...vals), max = Math.max(...vals), range = max-min||1;
          const yOf = v => H - ((v-min)/range)*H + PAD.t;
          const pts = s.data.map((v,i) => v!=null?`${xOf(i)},${yOf(v)}`:null).filter(Boolean).join(' ');
          const lx = si===0?PAD.l-3:PAD.l+W+3, la = si===0?'end':'start';
          return (
            <g key={si}>
              <polyline points={pts} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round"/>
              {s.data.map((v,i) => v!=null && <circle key={i} cx={xOf(i)} cy={yOf(v)} r="3" fill={s.color}/>)}
              <text x={lx} y={PAD.t+5} textAnchor={la} fontSize="8" fill={s.color}>{fmtNum(max,1)}{s.unit}</text>
              <text x={lx} y={PAD.t+H} textAnchor={la} fontSize="8" fill={s.color}>{fmtNum(min,1)}{s.unit}</text>
              <text x={lx} y={PAD.t+H+14} textAnchor={la} fontSize="8" fill={s.color} fontWeight="bold">{s.label}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function svgChartStr(readings, series, width, height) {
  const PAD = { t: 14, r: series.length > 1 ? 48 : 12, b: 24, l: 40 };
  const W = width - PAD.l - PAD.r, H = height - PAD.t - PAD.b;
  const n = readings.length;
  if (n < 2) return '<p style="color:#999;font-size:8pt;margin:0">Sin suficientes lecturas para graficar</p>';
  const xOf = i => n>1?(i/(n-1))*W+PAD.l:PAD.l+W/2;
  let body = '';
  body += `<line x1="${PAD.l}" y1="${PAD.t}" x2="${PAD.l}" y2="${PAD.t+H}" stroke="#ddd" stroke-width="1"/>`;
  body += `<line x1="${PAD.l}" y1="${PAD.t+H}" x2="${PAD.l+W}" y2="${PAD.t+H}" stroke="#ddd" stroke-width="1"/>`;
  body += readings.map((_,i)=>`<text x="${xOf(i)}" y="${PAD.t+H+16}" text-anchor="middle" font-size="8" fill="#999">D${i+1}</text>`).join('');
  series.forEach((s, si) => {
    const data = readings.map(s.fn);
    const vals = data.filter(v => v != null);
    if (!vals.length) return;
    const min = Math.min(...vals), max = Math.max(...vals), range = max-min||1;
    const yOf = v => H-((v-min)/range)*H+PAD.t;
    const pts = data.map((v,i)=>v!=null?`${xOf(i)},${yOf(v)}`:null).filter(Boolean).join(' ');
    const dots = data.map((v,i)=>v!=null?`<circle cx="${xOf(i)}" cy="${yOf(v)}" r="2.5" fill="${s.color}"/>`:'').join('');
    const lx = si===0?PAD.l-3:PAD.l+W+3, la = si===0?'end':'start';
    body += `<polyline points="${pts}" fill="none" stroke="${s.color}" stroke-width="1.5" stroke-linejoin="round"/>${dots}`;
    body += `<text x="${lx}" y="${PAD.t+6}" text-anchor="${la}" font-size="7" fill="${s.color}" font-weight="bold">${fmtNum(max,1)}${s.unit}</text>`;
    body += `<text x="${lx}" y="${PAD.t+H}" text-anchor="${la}" font-size="7" fill="${s.color}">${fmtNum(min,1)}${s.unit}</text>`;
    body += `<text x="${lx}" y="${PAD.t+H+14}" text-anchor="${la}" font-size="8" fill="${s.color}" font-weight="bold">${s.label}</text>`;
  });
  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function App() {
  // Vida Útil state
  const [view,      setView]      = useState('variety');
  const [variety,   setVariety]   = useState(null);
  const [batches,   setBatches]   = useState([]);
  const [batch,     setBatch]     = useState(null);
  const [tandaForm, setTandaForm] = useState({});
  const [lForm,     setLForm]     = useState({});
  const [editingIdx, setEditingIdx] = useState(null);
  const [error,     setError]     = useState('');

  // PCC state
  const [pccs,         setPccs]         = useState([]);
  const [pccSetupForm, setPccSetupForm] = useState({});
  const [muestraForms, setMuestraForms] = useState([]);
  const [muestraIdx,   setMuestraIdx]   = useState(0);
  const [savedPcc,     setSavedPcc]     = useState(null);

  useEffect(() => {
    setBatches(loadBatches());
    setPccs(loadPCCs());
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch(() => null);
    }
  }, []);

  // ── Vida Útil nav ─────────────────────────────────────────────────────────
  function goVariety() { setView('variety'); setVariety(null); }
  function goMenu(vid) { setVariety(vid); setView('menu'); }
  function goList()    { setView('vida-util-list'); }

  function goNuevaTanda() {
    setTandaForm({ confeccion: '', variedad: '', categoriaInicial: 'Extra', trazabilidad: '', pesoInicial: '', fecha: today(), nota: '' });
    setError('');
    setView('nueva-tanda');
  }

  function openBatch(id) {
    setBatch(batches.find(x => x.id === id));
    setView('batch');
  }

  function goNuevaLectura() {
    const siNoDefaults = Object.fromEntries(CVU_SINO_FIELDS.map(f => [f.key, f.okVal]));
    setLForm({
      fecha: today(), trazabilidad: batch.trazabilidad,
      pesoDiario: '', tempConservacion: '', pctFueraCalibre: '',
      ...siNoDefaults,
      pesoFaltasLeves: '', pesoFaltasGraves: '', pesoFaltasElim: '',
    });
    setEditingIdx(null);
    setError('');
    setView('nueva-lectura');
  }

  function goEditLectura(idx) {
    const r = batch.readings[idx];
    setLForm({
      fecha: r.fecha, trazabilidad: r.trazabilidad || '',
      pesoDiario: r.pd != null ? String(r.pd) : '',
      tempConservacion: r.tempConservacion != null ? String(r.tempConservacion) : '',
      pctFueraCalibre: r.pctCalibre != null ? String(r.pctCalibre) : '',
      desgrane: r.desgrane || 'No', bayasRotas: r.bayasRotas || 'No',
      escobajoMarron: r.escobajoMarron || 'No', bayasDeshidratadas: r.bayasDeshidratadas || 'No',
      suciedad: r.suciedad || 'No', plagaPicado: r.plagaPicado || 'No',
      cuerposExtranos: r.cuerposExtranos || 'No', podridos: r.podridos || 'No',
      pesoFaltasLeves: r.pesoFaltasLeves != null ? String(r.pesoFaltasLeves) : '',
      pesoFaltasGraves: r.pesoFaltasGraves != null ? String(r.pesoFaltasGraves) : '',
      pesoFaltasElim: r.pesoFaltasElim != null ? String(r.pesoFaltasElim) : '',
    });
    setEditingIdx(idx);
    setError('');
    setView('nueva-lectura');
  }

  // ── PCC nav ───────────────────────────────────────────────────────────────
  function goPCCList() { setView('pcc-list'); }

  function goNuevaPCC() {
    setPccSetupForm({ fecha: today(), hora: nowTime(), responsable: '', variedad: '', trazabilidad: '', cinaNum: '', mesaNum: '', formato: '', paraSO2: false });
    setError('');
    setView('nueva-pcc');
  }

  function iniciarMuestras() {
    if (!pccSetupForm.formato) { setError('Selecciona un formato de envase.'); return; }
    const fmt = FORMATOS_PCC.find(f => f.id === pccSetupForm.formato);
    const t = nowTime();
    setMuestraForms(Array.from({ length: fmt.nMuestras }, (_, i) => emptyMuestra(i + 1, t)));
    setMuestraIdx(0);
    setError('');
    setView('pcc-muestra');
  }

  function guardarPCC() {
    const fmt = FORMATOS_PCC.find(f => f.id === pccSetupForm.formato);
    const resultado = calcPCCResultado(muestraForms);
    const year = new Date().getFullYear();
    const id = `PC-${year}-${String(pccs.length + 1).padStart(4, '0')}`;
    const np = { id, ...pccSetupForm, nMuestras: fmt?.nMuestras || 10, muestras: muestraForms, resultado };
    const next = [...pccs, np];
    setPccs(next);
    savePCCs(next);
    setSavedPcc(np);
    setView('pcc-resumen');
  }

  function mSet(key, val) {
    setMuestraForms(prev => {
      const next = [...prev];
      next[muestraIdx] = { ...next[muestraIdx], [key]: val };
      return next;
    });
  }

  // ── Vida Útil actions ─────────────────────────────────────────────────────
  function saveTanda() {
    const { confeccion, trazabilidad, pesoInicial, fecha } = tandaForm;
    if (!confeccion || !trazabilidad || !pesoInicial || !fecha) { setError('Completa los campos obligatorios (*).'); return; }
    const year = new Date().getFullYear();
    const id = `TA-${year}-${String(batches.length + 1).padStart(4, '0')}`;
    const nb = { id, variety, confeccion: tandaForm.confeccion, variedad: tandaForm.variedad, categoriaInicial: tandaForm.categoriaInicial, trazabilidad: tandaForm.trazabilidad, pesoInicial: parseFloat(tandaForm.pesoInicial), fecha: tandaForm.fecha, nota: tandaForm.nota, readings: [] };
    const next = [...batches, nb];
    setBatches(next); saveBatches(next); setBatch(nb); setError(''); setView('batch');
  }

  function saveLectura() {
    if (!lForm.fecha || !lForm.pesoDiario) { setError('La fecha y el peso diario son obligatorios.'); return; }
    const calc = calcLectura(lForm, batch.pesoInicial);
    const nr = {
      dia: editingIdx !== null ? batch.readings[editingIdx].dia : batch.readings.length + 1,
      fecha: lForm.fecha, trazabilidad: lForm.trazabilidad,
      tempConservacion: lForm.tempConservacion !== '' ? parseFloat(lForm.tempConservacion) : null,
      desgrane: lForm.desgrane, bayasRotas: lForm.bayasRotas,
      escobajoMarron: lForm.escobajoMarron, bayasDeshidratadas: lForm.bayasDeshidratadas,
      suciedad: lForm.suciedad, plagaPicado: lForm.plagaPicado,
      cuerposExtranos: lForm.cuerposExtranos, podridos: lForm.podridos,
      pesoFaltasLeves:  parseFloat(lForm.pesoFaltasLeves)  || 0,
      pesoFaltasGraves: parseFloat(lForm.pesoFaltasGraves) || 0,
      pesoFaltasElim:   parseFloat(lForm.pesoFaltasElim)   || 0,
      ...calc,
    };
    const updatedReadings = editingIdx !== null
      ? batch.readings.map((r, i) => i === editingIdx ? nr : r)
      : [...batch.readings, nr];
    const updated = { ...batch, readings: updatedReadings };
    const next = batches.map(b => b.id === batch.id ? updated : b);
    setBatches(next); saveBatches(next); setBatch(updated); setEditingIdx(null); setError(''); setView('batch');
  }

  function deleteBatch(id) {
    if (!confirm('¿Eliminar esta tanda y todas sus lecturas?')) return;
    const next = batches.filter(b => b.id !== id);
    setBatches(next); saveBatches(next); setView('vida-util-list');
  }

  // ── Live calcs ────────────────────────────────────────────────────────────
  const lCalc = batch ? calcLectura(lForm, batch.pesoInicial) : null;
  const mCalc = muestraForms[muestraIdx] ? calcMuestraRes(muestraForms[muestraIdx]) : null;

  // ── Setters ───────────────────────────────────────────────────────────────
  function lSet(k, v) { setLForm(p => ({ ...p, [k]: v })); }
  function tSet(k, v) { setTandaForm(p => ({ ...p, [k]: v })); }
  function pSet(k, v) { setPccSetupForm(p => ({ ...p, [k]: v })); }

  const fmtActivo = FORMATOS_PCC.find(f => f.id === pccSetupForm.formato);

  // ───────────────────────────────────────────────────────────────────────────
  return (
    <>
      <Head>
        <title>Control de Calidad</title>
        <meta name="theme-color" content="#2e6b2e" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="manifest" href="/manifest.json" />
      </Head>

      <div className="app">

        {/* ════════════════════════════════ VARIETY PICKER ═══════════════════ */}
        {view === 'variety' && (
          <>
            <header className="top-bar">
              <div className="top-bar-title">Control de Calidad · Línea de Producción</div>
            </header>
            <main className="content">
              <p className="picker-intro">Selecciona la variedad a controlar</p>
              <div className="variety-grid">
                {varieties.map(v => (
                  <button key={v.id} className="variety-card" disabled={v.disabled}
                    onClick={() => !v.disabled && goMenu(v.id)}>
                    <span className="variety-icon">{v.icon}</span>
                    <span className="variety-name">{v.label}</span>
                    {v.disabled && <span className="variety-soon">Próximamente</span>}
                  </button>
                ))}
              </div>
            </main>
          </>
        )}

        {/* ════════════════════════════════ MENU ═════════════════════════════ */}
        {view === 'menu' && (
          <>
            <header className="top-bar">
              <button className="icon-btn" onClick={goVariety}>←</button>
              <div className="top-bar-title">{varieties.find(v => v.id === variety)?.label}</div>
            </header>
            <main className="content">
              <div className="menu-grid">
                <button className="menu-card" onClick={goList}>
                  <span className="menu-card-icon">⏱</span>
                  <span className="menu-card-name">Control de Vida Útil</span>
                  <span className="menu-card-desc">Seguimiento diario de pérdida de peso y defectos en almacenamiento</span>
                </button>
                <button className="menu-card" onClick={goPCCList}>
                  <span className="menu-card-icon">📋</span>
                  <span className="menu-card-name">Parte de Control</span>
                  <span className="menu-card-desc">Control de pesos, calibre, color y calidad de baya en línea</span>
                </button>
              </div>
            </main>
          </>
        )}

        {/* ════════════════════════════════ VIDA ÚTIL LIST ═══════════════════ */}
        {view === 'vida-util-list' && (
          <>
            <header className="top-bar">
              <button className="icon-btn" onClick={() => setView('menu')}>←</button>
              <div style={{ flex: 1 }}>
                <div className="top-bar-title">Control de Vida Útil</div>
                <div className="top-bar-sub">Uva de Mesa · {batches.filter(b => b.variety === 'uva').length} tandas</div>
              </div>
              <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,.2)', color: '#fff', fontWeight: 700 }} onClick={goNuevaTanda}>
                + Nueva tanda
              </button>
            </header>
            <main className="content">
              {batches.filter(b => b.variety === 'uva').length === 0 ? (
                <div className="empty">
                  <div className="empty-icon">📦</div>
                  <p>No hay tandas registradas.</p>
                  <p style={{ marginTop: '.5rem', fontSize: '.85rem' }}>Pulsa <strong>+ Nueva tanda</strong> para comenzar.</p>
                </div>
              ) : (
                <div className="batch-list">
                  {batches.filter(b => b.variety === 'uva').slice().reverse().map(b => {
                    const status = batchStatusBadge(b);
                    const last = b.readings.at(-1);
                    return (
                      <div key={b.id} className="batch-card" onClick={() => openBatch(b.id)}>
                        <div className="batch-card-body">
                          <div className="bc-row">
                            <span className="bc-id">{b.id}</span>
                            <span className="bc-date">{fmtDate(b.fecha)}</span>
                          </div>
                          <div className="bc-conf">{b.confeccion}</div>
                          <div className="bc-meta">{b.categoriaInicial} · Traz. {b.trazabilidad} · {b.pesoInicial} kg</div>
                          <div className="bc-footer">
                            <span className={`badge ${status.css}`}>{status.label}</span>
                            {last ? <span style={{ fontSize: '.82rem', color: 'var(--muted)' }}>Día {last.dia} · Pérdida: {fmtNum(last.pctPerdida, 1)}%</span>
                                  : <span style={{ fontSize: '.82rem', color: 'var(--muted)' }}>Sin lecturas</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </main>
          </>
        )}

        {/* ════════════════════════════════ NUEVA TANDA ══════════════════════ */}
        {view === 'nueva-tanda' && (
          <>
            <header className="top-bar">
              <button className="icon-btn" onClick={goList}>←</button>
              <div className="top-bar-title">Nueva tanda · Uva de Mesa</div>
            </header>
            <main className="content">
              {error && <div className="form-error">{error}</div>}
              <p className="section-h">Datos de identificación</p>
              <div className="form-grid g2">
                <div className="field"><label className="req">Confección / Lote</label><input type="text" value={tandaForm.confeccion||''} onChange={e=>tSet('confeccion',e.target.value)} placeholder="Ej. CONF-2026-001"/></div>
                <div className="field"><label className="req">Categoría inicial</label><select value={tandaForm.categoriaInicial||'Extra'} onChange={e=>tSet('categoriaInicial',e.target.value)}>{categorias.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
                <div className="field"><label className="req">Trazabilidad</label><input type="text" value={tandaForm.trazabilidad||''} onChange={e=>tSet('trazabilidad',e.target.value)} placeholder="Código de trazabilidad"/></div>
                <div className="field"><label className="req">Fecha de entrada</label><input type="date" value={tandaForm.fecha||''} onChange={e=>tSet('fecha',e.target.value)}/></div>
                <div className="field"><label className="req">Peso exacto inicial (kg)</label><input type="number" step="0.01" min="0" value={tandaForm.pesoInicial||''} onChange={e=>tSet('pesoInicial',e.target.value)} placeholder="0.00"/></div>
                <div className="field"><label>Nota</label><input type="text" value={tandaForm.nota||''} onChange={e=>tSet('nota',e.target.value)} placeholder="Opcional"/></div>
              </div>
              <p className="section-h">Variedad</p>
              <div className="toggle-group" style={{ marginBottom: '1.25rem' }}>
                {VARIEDADES_PCC.map(v => (
                  <button key={v} className={`toggle-btn${tandaForm.variedad===v?' toggle-btn--on':''}`} onClick={() => tSet('variedad', tandaForm.variedad===v?'':v)}>{v}</button>
                ))}
              </div>
              <div className="action-bar">
                <button className="btn btn-ghost" onClick={goList}>Cancelar</button>
                <div className="spacer"/>
                <button className="btn btn-primary btn-lg" onClick={saveTanda}>Crear tanda →</button>
              </div>
            </main>
          </>
        )}

        {/* ════════════════════════════════ BATCH DETAIL ═════════════════════ */}
        {view === 'batch' && batch && (
          <>
            <header className="top-bar">
              <button className="icon-btn" onClick={goList}>←</button>
              <div style={{ flex: 1 }}>
                <div className="top-bar-title">{batch.confeccion}</div>
                <div className="top-bar-sub">{batch.id} · {batch.categoriaInicial} · {batch.trazabilidad}</div>
              </div>
              <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,.2)', color: '#fff', fontWeight: 700 }} onClick={goNuevaLectura}>+ Lectura</button>
            </header>
            <main className="content">
              <div className="detail-header">
                <div className="detail-header-grid">
                  <div className="dh-item"><span className="dh-label">Fecha entrada</span><span className="dh-value">{fmtDate(batch.fecha)}</span></div>
                  {batch.variedad&&<div className="dh-item"><span className="dh-label">Variedad</span><span className="dh-value">{batch.variedad}</span></div>}
                  <div className="dh-item"><span className="dh-label">Categoría inicial</span><span className="dh-value">{batch.categoriaInicial}</span></div>
                  <div className="dh-item"><span className="dh-label">Peso inicial</span><span className="dh-value">{batch.pesoInicial} kg</span></div>
                  <div className="dh-item"><span className="dh-label">Trazabilidad</span><span className="dh-value">{batch.trazabilidad}</span></div>
                  <div className="dh-item"><span className="dh-label">Días controlados</span><span className="dh-value">{batch.readings.length}</span></div>
                  {batch.nota && <div className="dh-item" style={{gridColumn:'1 / -1'}}><span className="dh-label">Nota</span><span className="dh-value">{batch.nota}</span></div>}
                </div>
              </div>
              <p className="section-h">Historial de lecturas ({batch.readings.length})</p>
              {batch.readings.length === 0 ? (
                <div className="empty" style={{ padding: '2rem 1rem' }}>
                  <div className="empty-icon" style={{ fontSize: '2rem' }}>📋</div>
                  <p>Sin lecturas. Pulsa <strong>+ Lectura</strong> para registrar el primer control.</p>
                </div>
              ) : (
                <>
                <div className="table-wrap">
                  <table className="readings-table">
                    <thead><tr>
                      <th>Día</th><th>Fecha</th><th>Peso (kg)</th><th>% Pérd.</th><th>Tª</th><th>% Cal.</th>
                      <th style={{color:'#b45309'}}>% Leves</th>
                      <th style={{color:'#c05a00'}}>% Graves</th>
                      <th style={{color:'#c03030'}}>% Elim.</th>
                      <th>% Total</th>
                      <th>Calidad</th><th></th>
                    </tr></thead>
                    <tbody>
                      {(() => {
                        const pctColor = (v, warn, danger) => v >= danger ? 'var(--danger)' : v >= warn ? 'var(--warn)' : 'var(--ok)';
                        const calBadge = c => {
                          if (!c) return 'badge-neutral';
                          if (c === 'Extra')      return 'badge-ok';
                          if (c === 'Clase 1')    return 'badge-ok';
                          if (c === 'Clase 2')    return 'badge-warn';
                          if (c === 'Industria')  return 'badge-warn';
                          return 'badge-danger';
                        };
                        return batch.readings.map((r, ri) => (
                          <tr key={r.dia}>
                            <td><strong>{r.dia}</strong></td>
                            <td>{fmtDate(r.fecha)}</td>
                            <td>{r.pd!=null?fmtNum(r.pd):'—'}</td>
                            <td style={{color:r.pctPerdida>2?'var(--danger)':r.pctPerdida>1.5?'var(--warn)':'var(--ok)',fontWeight:700}}>{r.pctPerdida!=null?`${fmtNum(r.pctPerdida,1)}%`:'—'}</td>
                            <td>{r.tempConservacion!=null?`${r.tempConservacion}°`:'—'}</td>
                            <td>{r.pctCalibre!=null?`${fmtNum(r.pctCalibre,1)}%`:'—'}</td>
                            <td style={{color:pctColor(r.pctLeves||0,2,10),fontWeight:700}}>{r.pctLeves!=null?`${fmtNum(r.pctLeves,1)}%`:'—'}</td>
                            <td style={{color:pctColor(r.pctGraves||0,2,5),fontWeight:700}}>{r.pctGraves!=null?`${fmtNum(r.pctGraves,1)}%`:'—'}</td>
                            <td style={{color:r.pctElim>0?'var(--danger)':'var(--ok)',fontWeight:700}}>{r.pctElim!=null?`${fmtNum(r.pctElim,2)}%`:'—'}</td>
                            <td style={{color:pctColor(r.pctTotal||0,10,20),fontWeight:700}}>{r.pctTotal!=null?`${fmtNum(r.pctTotal,1)}%`:'—'}</td>
                            <td><span className={`badge ${calBadge(r.clasificacion)}`}>{r.clasificacion||'—'}</span></td>
                            <td><button className="btn-edit-row" onClick={() => goEditLectura(ri)} title="Editar">✎</button></td>
                          </tr>
                        ));
                      })()}
                      {/* Fila de resumen */}
                      {(() => {
                        const sm = calcBatchSummary(batch.readings);
                        if (!sm) return null;
                        return (
                          <tr style={{background:'var(--surface-2,#f0f4f0)',fontWeight:700,borderTop:'2px solid var(--border)'}}>
                            <td style={{color:'var(--muted)',fontSize:'.72rem',textTransform:'uppercase'}}>Media</td>
                            <td>—</td>
                            <td>{sm.peso!=null?`${fmtNum(sm.peso,2)} kg`:'—'}</td>
                            <td style={{color:sm.pctPerdida>2?'var(--danger)':sm.pctPerdida>1.5?'var(--warn)':'var(--ok)'}}>{sm.pctPerdida!=null?`${fmtNum(sm.pctPerdida,1)}%`:'—'}</td>
                            <td>{sm.tempConservacion!=null?`${fmtNum(sm.tempConservacion,1)}°`:'—'}</td>
                            <td>{sm.pctCalibre!=null?`${fmtNum(sm.pctCalibre,1)}%`:'—'}</td>
                            <td style={{color:sm.pctLeves>10?'var(--danger)':sm.pctLeves>2?'var(--warn)':'var(--ok)'}}>{sm.pctLeves!=null?`${fmtNum(sm.pctLeves,1)}%`:'—'}</td>
                            <td style={{color:sm.pctGraves>5?'var(--danger)':sm.pctGraves>2?'var(--warn)':'var(--ok)'}}>{sm.pctGraves!=null?`${fmtNum(sm.pctGraves,1)}%`:'—'}</td>
                            <td style={{color:sm.pctElim>0?'var(--danger)':'var(--ok)'}}>{sm.pctElim!=null?`${fmtNum(sm.pctElim,2)}%`:'—'}</td>
                            <td style={{color:sm.pctTotal>15?'var(--danger)':sm.pctTotal>10?'var(--warn)':'var(--ok)'}}>{sm.pctTotal!=null?`${fmtNum(sm.pctTotal,1)}%`:'—'}</td>
                            <td>
                              {CVU_CALIDAD.map(c => sm.calCounts[c.label] > 0 ? <span key={c.label} style={{fontSize:'.72rem',fontWeight:700,marginRight:'.3rem'}}>{sm.calCounts[c.label]}×{c.label}</span> : null)}
                              {sm.calCounts['No conforme'] > 0 ? <span style={{color:'var(--danger)',fontSize:'.72rem',fontWeight:700}}>{sm.calCounts['No conforme']}×NC</span> : null}
                            </td>
                            <td></td>
                          </tr>
                        );
                      })()}
                    </tbody>
                  </table>
                </div>

                {/* Dashboard gráficas */}
                {batch.readings.length >= 2 && (() => {
                  const r = batch.readings;
                  return (
                    <div style={{marginTop:'1.5rem'}}>
                      <p className="section-h">Evolución temporal</p>
                      <div style={{display:'flex',gap:'1.5rem',flexWrap:'wrap',marginTop:'.75rem'}}>
                        <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'.75rem',padding:'.75rem 1rem'}}>
                          <MiniLineChart
                            title="Peso (kg) y Temperatura (°C)"
                            n={r.length}
                            series={[
                              { data: r.map(x => x.pd!=null?x.pd:null),                color: '#2e6b2e', label: 'Peso',  unit: 'kg' },
                              { data: r.map(x => x.tempConservacion!=null?x.tempConservacion:null), color: '#1d6fa4', label: 'Tª',    unit: '°C' },
                            ]}
                          />
                        </div>
                        <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'.75rem',padding:'.75rem 1rem'}}>
                          <MiniLineChart
                            title="% Defectos sobre peso"
                            n={r.length}
                            series={[
                              { data: r.map(x => x.pctLeves!=null?x.pctLeves:null),  color: '#b45309', label: 'Leves',  unit: '%' },
                              { data: r.map(x => x.pctGraves!=null?x.pctGraves:null), color: '#c03030', label: 'Graves', unit: '%' },
                            ]}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })()}
                </>
              )}
              <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
                <button className="btn btn-danger btn-sm" onClick={() => deleteBatch(batch.id)}>Eliminar tanda</button>
                <div style={{ flex: 1 }} />
                <button className="btn btn-ghost btn-sm" onClick={() => printBatch(batch)}>🖨 Imprimir informe</button>
              </div>
            </main>
          </>
        )}

        {/* ════════════════════════════════ NUEVA / EDITAR LECTURA ══════════ */}
        {view === 'nueva-lectura' && batch && lCalc && (
          <>
            <header className="top-bar">
              <button className="icon-btn" onClick={() => { setEditingIdx(null); setView('batch'); }}>←</button>
              <div style={{ flex: 1 }}>
                <div className="top-bar-title">
                  {editingIdx !== null ? `Editar lectura · Día ${batch.readings[editingIdx]?.dia}` : `Nueva lectura · Día ${batch.readings.length + 1}`}
                </div>
                <div className="top-bar-sub">{batch.confeccion} · Peso inicial {batch.pesoInicial} kg</div>
              </div>
              <button className="btn btn-primary" style={{marginLeft:'.5rem',whiteSpace:'nowrap'}} onClick={saveLectura}>Guardar ✓</button>
            </header>
            <main className="content lc-main">
              {error && <div className="form-error" style={{margin:'0 0 .5rem'}}>{error}</div>}
              <div className="lectura-compact">

                {/* Columna 1 — Identificación */}
                <div className="lc-col">
                  <div className="lc-section-title">Identificación</div>
                  <div className="lc-field">
                    <label>Fecha *</label>
                    <input type="date" value={lForm.fecha} onChange={e=>lSet('fecha',e.target.value)}/>
                  </div>
                  <div className="lc-field">
                    <label>Trazabilidad</label>
                    <input type="text" value={lForm.trazabilidad} onChange={e=>lSet('trazabilidad',e.target.value)} placeholder={batch.trazabilidad}/>
                  </div>
                  <div className="lc-field">
                    <label>Peso diario (kg) *</label>
                    <input type="number" step="0.01" min="0" value={lForm.pesoDiario} onChange={e=>lSet('pesoDiario',e.target.value)} placeholder="0.00" style={{fontSize:'1.1rem',fontWeight:700}}/>
                  </div>
                  <div className="lc-field">
                    <label>Tª conservación (°C)</label>
                    <input type="number" step="0.1" value={lForm.tempConservacion} onChange={e=>lSet('tempConservacion',e.target.value)} placeholder="Ej. 6.0"/>
                  </div>
                  <div className="lc-field">
                    <label>% Varianza calibre</label>
                    <input type="number" step="0.1" min="0" value={lForm.pctFueraCalibre} onChange={e=>lSet('pctFueraCalibre',e.target.value)} placeholder="0.0"/>
                  </div>
                </div>

                {/* Columna 2 — Controles por severidad */}
                <div className="lc-col">
                  {/* ── Faltas Leves ── */}
                  <div className="lc-severity-hdr lc-leve">Faltas leves</div>
                  {CVU_LEVES.map(({key, label, okVal}) => {
                    const val = lForm[key];
                    return (
                      <div key={key} className="lc-toggle-row">
                        <span className="lc-toggle-label">{label}</span>
                        <div className="lc-toggle-group">
                          <button className={`lc-toggle${val==='Si'?' lc-nok':''}`} onClick={()=>lSet(key,'Si')}>Sí</button>
                          <button className={`lc-toggle${val==='No'?' lc-ok':''}`}  onClick={()=>lSet(key,'No')}>No</button>
                        </div>
                      </div>
                    );
                  })}
                  <div className="lc-weight-row">
                    <label>Peso faltas leves (kg)</label>
                    <input type="number" step="0.01" min="0" value={lForm.pesoFaltasLeves} onChange={e=>lSet('pesoFaltasLeves',e.target.value)} placeholder="0.00"/>
                    <span className={`lc-pct ${thresholdStatus(lCalc.pctLeves, 10)}`}>
                      {lCalc.pd>0 ? `${fmtNum(lCalc.pctLeves,1)}%` : '—'}
                    </span>
                  </div>

                  {/* ── Falta Grave ── */}
                  <div className="lc-severity-hdr lc-grave" style={{marginTop:'.65rem'}}>Falta grave</div>
                  {CVU_GRAVES.map(({key, label, okVal}) => {
                    const val = lForm[key];
                    return (
                      <div key={key} className="lc-toggle-row">
                        <span className="lc-toggle-label">{label}</span>
                        <div className="lc-toggle-group">
                          <button className={`lc-toggle${val==='Si'?' lc-nok':''}`} onClick={()=>lSet(key,'Si')}>Sí</button>
                          <button className={`lc-toggle${val==='No'?' lc-ok':''}`}  onClick={()=>lSet(key,'No')}>No</button>
                        </div>
                      </div>
                    );
                  })}
                  <div className="lc-weight-row">
                    <label>Peso faltas graves (kg)</label>
                    <input type="number" step="0.01" min="0" value={lForm.pesoFaltasGraves} onChange={e=>lSet('pesoFaltasGraves',e.target.value)} placeholder="0.00"/>
                    <span className={`lc-pct ${thresholdStatus(lCalc.pctGraves, 5)}`}>
                      {lCalc.pd>0 ? `${fmtNum(lCalc.pctGraves,1)}%` : '—'}
                    </span>
                  </div>

                  {/* ── Eliminatorias ── */}
                  <div className="lc-severity-hdr lc-elim" style={{marginTop:'.65rem'}}>Eliminatorias · tol. 0%</div>
                  {CVU_ELIM.map(({key, label, okVal}) => {
                    const val = lForm[key];
                    return (
                      <div key={key} className="lc-toggle-row">
                        <span className="lc-toggle-label">{label}</span>
                        <div className="lc-toggle-group">
                          <button className={`lc-toggle${val==='Si'?' lc-nok':''}`} onClick={()=>lSet(key,'Si')}>Sí</button>
                          <button className={`lc-toggle${val==='No'?' lc-ok':''}`}  onClick={()=>lSet(key,'No')}>No</button>
                        </div>
                      </div>
                    );
                  })}
                  <div className="lc-weight-row">
                    <label>Peso faltas elim. (kg)</label>
                    <input type="number" step="0.01" min="0" value={lForm.pesoFaltasElim} onChange={e=>lSet('pesoFaltasElim',e.target.value)} placeholder="0.00"/>
                    <span className={`lc-pct ${thresholdStatus(lCalc.pctElim, 0)}`}>
                      {lCalc.pd>0 ? `${fmtNum(lCalc.pctElim,1)}%` : '—'}
                    </span>
                  </div>
                </div>

                {/* Columna 3 — Resultado */}
                <div className="lc-col lc-col-result">
                  <div className="lc-section-title">Calidad del producto</div>
                  <div className={`lc-class-badge ${lCalc.clasificacion ? classCss(lCalc.clasificacion) : 'class-none'}`}>
                    <div style={{fontSize:'.68rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',opacity:.7,marginBottom:'.3rem'}}>Clasificación</div>
                    <div style={{fontSize:'1.6rem',fontWeight:800}}>{lCalc.clasificacion || '—'}</div>
                  </div>
                  <div className="lc-metric">
                    <div className="lc-metric-row">
                      <span>% Pérdida de peso</span>
                      <span className={`thresh-val ${lCalc.pd>0?thresholdStatus(lCalc.pctPerdida,2):'ok'}`}>
                        {lCalc.pd>0?`${fmtNum(lCalc.pctPerdida,1)}%`:'—'}
                      </span>
                    </div>
                    <div className="thresh-track" style={{marginTop:'.3rem'}}>
                      <div className={`thresh-fill ${thresholdStatus(lCalc.pctPerdida,2)}`} style={{width:lCalc.pd>0?`${Math.min((lCalc.pctPerdida/2)*100,100)}%`:'0%'}}/>
                    </div>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:'.7rem',color:'var(--muted)',marginTop:'.15rem'}}><span>0%</span><span>máx 2%</span></div>
                  </div>
                  <div className="lc-metric">
                    <div className="lc-metric-row">
                      <span style={{color:'#b45309'}}>Faltas leves</span>
                      <strong className={thresholdStatus(lCalc.pctLeves,10)}>{lCalc.pd>0?`${fmtNum(lCalc.pctLeves,1)}%`:'—'}</strong>
                    </div>
                    <div style={{fontSize:'.7rem',color:'var(--muted)'}}>Extra ≤2% · Clase 1 ≤10%</div>
                  </div>
                  <div className="lc-metric">
                    <div className="lc-metric-row">
                      <span style={{color:'#c05a00'}}>Faltas graves</span>
                      <strong className={thresholdStatus(lCalc.pctGraves,5)}>{lCalc.pd>0?`${fmtNum(lCalc.pctGraves,1)}%`:'—'}</strong>
                    </div>
                    <div style={{fontSize:'.7rem',color:'var(--muted)'}}>Clase 1 ≤2% · Clase 2 ≤5%</div>
                  </div>
                  <div className="lc-metric">
                    <div className="lc-metric-row">
                      <span style={{color:'var(--danger)'}}>Eliminatorias (tol. 0)</span>
                      <strong className={thresholdStatus(lCalc.pctElim,0)}>{lCalc.pd>0?`${fmtNum(lCalc.pctElim,2)}%`:'—'}</strong>
                    </div>
                    <div style={{fontSize:'.7rem',color:'var(--muted)'}}>Clase 2+ ≤1% · Extra/C1 = 0%</div>
                  </div>
                  <div className="lc-metric">
                    <div className="lc-metric-row">
                      <span>Total defectos</span>
                      <strong className={thresholdStatus(lCalc.pctTotal,15)}>{lCalc.pd>0?`${fmtNum(lCalc.pctTotal,1)}%`:'—'}</strong>
                    </div>
                  </div>
                </div>

              </div>
            </main>
          </>
        )}

        {/* ════════════════════════════════ PCC LIST ═════════════════════════ */}
        {view === 'pcc-list' && (
          <>
            <header className="top-bar">
              <button className="icon-btn" onClick={() => setView('menu')}>←</button>
              <div style={{ flex: 1 }}>
                <div className="top-bar-title">Parte de Control · Uva de Mesa</div>
                <div className="top-bar-sub">{pccs.length} partes registrados</div>
              </div>
              <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,.2)', color: '#fff', fontWeight: 700 }} onClick={goNuevaPCC}>
                + Nuevo parte
              </button>
            </header>
            <main className="content">
              {pccs.length === 0 ? (
                <div className="empty">
                  <div className="empty-icon">📋</div>
                  <p>No hay partes registrados.</p>
                  <p style={{ marginTop: '.5rem', fontSize: '.85rem' }}>Pulsa <strong>+ Nuevo parte</strong> para comenzar.</p>
                </div>
              ) : (
                <div className="batch-list">
                  {pccs.slice().reverse().map(p => {
                    const fmt = FORMATOS_PCC.find(f => f.id === p.formato);
                    const filled = p.muestras.filter(m => m.peso !== '' || parseInt(m.totalBayas) > 0).length;
                    return (
                      <div key={p.id} className="batch-card" onClick={() => { setSavedPcc(p); setView('pcc-resumen'); }}>
                        <div className="batch-card-body">
                          <div className="bc-row">
                            <span className="bc-id">{p.id}</span>
                            <span className="bc-date">{fmtDate(p.fecha)} {p.hora}</span>
                          </div>
                          <div className="bc-conf">{fmt?.label} {fmt?.sub}{p.trazabilidad ? ` · ${p.trazabilidad}` : ''}</div>
                          <div className="bc-meta">
                            {p.variedad ? p.variedad : ''}
                            {p.cinaNum ? ` · Cinta ${p.cinaNum}` : ''}{p.mesaNum ? ` · Mesa ${p.mesaNum}` : ''}
                            {p.responsable ? ` · ${p.responsable}` : ''}
                            {(p.paraSO2||p.paraSoz) ? ' · SO2' : ''}
                          </div>
                          <div className="bc-footer">
                            <span className={`badge ${p.resultado==='C'?'badge-ok':p.resultado==='NC'?'badge-danger':'badge-neutral'}`}>
                              {p.resultado==='C'?'CONFORME':p.resultado==='NC'?'NO CONFORME':'Pendiente'}
                            </span>
                            <span style={{ fontSize: '.82rem', color: 'var(--muted)' }}>{filled}/{p.nMuestras} muestras</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </main>
          </>
        )}

        {/* ════════════════════════════════ NUEVA PCC SETUP ══════════════════ */}
        {view === 'nueva-pcc' && (
          <>
            <header className="top-bar">
              <button className="icon-btn" onClick={goPCCList}>←</button>
              <div className="top-bar-title">Nuevo parte de control</div>
            </header>
            <main className="content">
              {error && <div className="form-error">{error}</div>}

              <p className="section-h">Formato de envase</p>
              <div className="formato-grid">
                {FORMATOS_PCC.map(f => (
                  <button key={f.id}
                    className={`formato-card${pccSetupForm.formato===f.id?' formato-card--selected':''}`}
                    onClick={() => pSet('formato', f.id)}>
                    <span className="formato-label">{f.label}</span>
                    {f.sub && <span className="formato-sub">{f.sub}</span>}
                    <span className="formato-n">{f.nMuestras} muestras</span>
                  </button>
                ))}
              </div>

              <p className="section-h" style={{ marginTop: '1.5rem' }}>Variedad</p>
              <div className="toggle-group" style={{ marginBottom: '1.25rem' }}>
                {VARIEDADES_PCC.map(v => (
                  <button key={v}
                    className={`toggle-btn${pccSetupForm.variedad===v?' toggle-btn--on':''}`}
                    onClick={() => pSet('variedad', pccSetupForm.variedad===v?'':v)}>
                    {v}
                  </button>
                ))}
              </div>

              <p className="section-h">Identificación</p>
              <div className="form-grid g2">
                <div className="field"><label className="req">Fecha</label><input type="date" value={pccSetupForm.fecha||''} onChange={e=>pSet('fecha',e.target.value)}/></div>
                <div className="field"><label className="req">Hora</label><input type="time" value={pccSetupForm.hora||''} onChange={e=>pSet('hora',e.target.value)}/></div>
                <div className="field"><label>Responsable</label><input type="text" value={pccSetupForm.responsable||''} onChange={e=>pSet('responsable',e.target.value)} placeholder="Nombre del operario"/></div>
                <div className="field"><label>Trazabilidad</label><input type="text" value={pccSetupForm.trazabilidad||''} onChange={e=>pSet('trazabilidad',e.target.value)} placeholder="Código trazabilidad"/></div>
                <div className="field"><label>Cinta Nº</label><input type="text" value={pccSetupForm.cinaNum||''} onChange={e=>pSet('cinaNum',e.target.value)} placeholder="Nº Cinta"/></div>
                <div className="field"><label>Mesa Nº</label><input type="text" value={pccSetupForm.mesaNum||''} onChange={e=>pSet('mesaNum',e.target.value)} placeholder="Nº Mesa"/></div>
              </div>

              <div style={{ marginTop: '1rem' }}>
                <button className={`soz-toggle${pccSetupForm.paraSO2?' soz-toggle--on':''}`}
                  onClick={() => pSet('paraSO2', !pccSetupForm.paraSO2)}>
                  <span className="soz-dot"/>
                  <span>{pccSetupForm.paraSO2 ? '✓ Tratamiento SO2' : 'Marcar si lleva tratamiento SO2'}</span>
                </button>
              </div>

              <div className="action-bar">
                <button className="btn btn-ghost" onClick={goPCCList}>Cancelar</button>
                <div className="spacer"/>
                <button className="btn btn-primary btn-lg" onClick={iniciarMuestras}>
                  Iniciar muestras →
                </button>
              </div>
            </main>
          </>
        )}

        {/* ════════════════════════════════ PCC MUESTRA ══════════════════════ */}
        {view === 'pcc-muestra' && muestraForms.length > 0 && mCalc && (
          <>
            <header className="top-bar">
              <button className="icon-btn" onClick={() => muestraIdx > 0 ? setMuestraIdx(i=>i-1) : setView('nueva-pcc')}>←</button>
              <div style={{ flex: 1 }}>
                <div className="top-bar-title">Muestra {muestraIdx+1} de {muestraForms.length}</div>
                <div className="top-bar-sub">
                  {pccSetupForm.variedad||fmtActivo?.label}
                  {pccSetupForm.cinaNum?` · Cinta ${pccSetupForm.cinaNum}`:''}
                  {pccSetupForm.mesaNum?` · Mesa ${pccSetupForm.mesaNum}`:''}
                </div>
              </div>
              <div className="muestra-dots">
                {muestraForms.map((m, i) => {
                  const c = calcMuestraRes(m);
                  return (
                    <button key={i} onClick={() => setMuestraIdx(i)}
                      className={`mdot${i===muestraIdx?' mdot--active':c.resultado==='C'?' mdot--ok':c.resultado==='NC'?' mdot--nc':''}`}
                      aria-label={`Muestra ${i+1}`}/>
                  );
                })}
              </div>
            </header>

            <main className="content">
              <div className="pcc-muestra-layout">

                {/* Left: medidas físicas */}
                <div className="pcc-left">
                  <p className="section-h">Medidas físicas</p>
                  <div className="form-grid g2" style={{ marginBottom: '1rem' }}>
                    <div className="field">
                      <label>Hora de medición</label>
                      <input type="time" value={muestraForms[muestraIdx].hora} onChange={e=>mSet('hora',e.target.value)}/>
                    </div>
                    <div className="field" style={{gridColumn:'1/-1'}}>
                      <label>Peso (gr){fmtActivo?.pesoRef != null ? ` — ref. ${fmtActivo.pesoRef} gr` : ''}</label>
                      <input type="number" step="1" min="0"
                        value={muestraForms[muestraIdx].peso}
                        onChange={e=>mSet('peso',e.target.value)}
                        placeholder="0"
                        style={{fontSize:'1.15rem',fontWeight:700}}/>
                    </div>
                    <div className="field">
                      <label>Calibre (mm)</label>
                      <input type="number" step="0.1" min="0"
                        value={muestraForms[muestraIdx].calibre}
                        onChange={e=>mSet('calibre',e.target.value)}
                        placeholder="mm"/>
                    </div>
                    <div className="field">
                      <label>% Fuera calibre <span style={{color:'var(--muted)',fontWeight:400,textTransform:'none'}}>(máx 5%)</span></label>
                      <input type="number" step="0.1" min="0" max="100"
                        value={muestraForms[muestraIdx].pctFueraCalibre}
                        onChange={e=>mSet('pctFueraCalibre',e.target.value)}
                        placeholder="0.0"
                        style={{color:parseFloat(muestraForms[muestraIdx].pctFueraCalibre)>=5?'var(--danger)':'inherit'}}/>
                    </div>
                    <div className="field">
                      <label>Nº racimos</label>
                      <input type="number" step="1" min="0"
                        value={muestraForms[muestraIdx].numRacimos}
                        onChange={e=>mSet('numRacimos',e.target.value)}
                        placeholder="0"/>
                    </div>
                  </div>

                  <div className="field" style={{ marginBottom: '1rem' }}>
                    <label>Homogeneidad calibre</label>
                    <div className="toggle-group">
                      {[['Si','toggle-btn--on'],['No','toggle-btn--on toggle-btn--danger']].map(([v,cls])=>(
                        <button key={v}
                          className={`toggle-btn${muestraForms[muestraIdx].homogeneidad===v?` ${cls}`:''}`}
                          onClick={()=>mSet('homogeneidad',muestraForms[muestraIdx].homogeneidad===v?'':v)}>
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="field" style={{ marginBottom: '1rem' }}>
                    <label>Condición escobajo</label>
                    <div className="toggle-group">
                      {[['Si','toggle-btn--on'],['No','toggle-btn--on toggle-btn--danger']].map(([v,cls])=>(
                        <button key={v}
                          className={`toggle-btn${muestraForms[muestraIdx].condicionEscobajo===v?` ${cls}`:''}`}
                          onClick={()=>mSet('condicionEscobajo',muestraForms[muestraIdx].condicionEscobajo===v?'':v)}>
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="field" style={{ marginBottom: '1rem' }}>
                    <label>Coloración racimo (1–5)</label>
                    <div className="toggle-group">
                      {[1,2,3,4,5].map(n=>(
                        <button key={n}
                          className={`toggle-btn toggle-btn--num${muestraForms[muestraIdx].coloracion===String(n)?' toggle-btn--on':''}`}
                          onClick={()=>mSet('coloracion',muestraForms[muestraIdx].coloracion===String(n)?'':String(n))}>
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="field">
                    <label>ºBrix <span style={{color:'var(--muted)',fontWeight:400,textTransform:'none'}}>(mín. 12°, tol. ±1°)</span></label>
                    <input type="number" step="0.1" min="0"
                      value={muestraForms[muestraIdx].brix}
                      onChange={e=>mSet('brix',e.target.value)}
                      placeholder="12.0"
                      style={{
                        fontSize:'1.15rem', fontWeight:700,
                        color: muestraForms[muestraIdx].brix!==''&&parseFloat(muestraForms[muestraIdx].brix)<11?'var(--danger)':'inherit',
                        borderColor: muestraForms[muestraIdx].brix!==''&&parseFloat(muestraForms[muestraIdx].brix)<11?'var(--danger)':undefined,
                      }}/>
                    {muestraForms[muestraIdx].brix!==''&&parseFloat(muestraForms[muestraIdx].brix)<11&&(
                      <span className="field-hint" style={{color:'var(--danger)'}}>Por debajo del mínimo admisible (11°)</span>
                    )}
                  </div>
                </div>

                {/* Right: conteo de bayas */}
                <div className="pcc-right">
                  <p className="section-h">Conteo de bayas</p>

                  <div className="field" style={{ marginBottom: '1rem' }}>
                    <label className="req">Total bayas contadas</label>
                    <input type="number" step="1" min="0"
                      value={muestraForms[muestraIdx].totalBayas}
                      onChange={e=>mSet('totalBayas',e.target.value)}
                      placeholder="0"
                      style={{fontSize:'1.3rem',fontWeight:800,textAlign:'center'}}/>
                  </div>

                  <div className="baya-card">
                    {DEFECTOS_BAYAS.map(d => {
                      const val = parseInt(muestraForms[muestraIdx][d.key]) || 0;
                      const isViol = d.cero && val > 0;
                      return (
                        <div key={d.key} className={`baya-row${isViol?' baya-row--viol':''}`}>
                          <div className="baya-label-wrap">
                            <span className="baya-label">{d.label}</span>
                            {d.cero && <span className="baya-cero-tag">TOL 0%</span>}
                          </div>
                          <input type="number" step="1" min="0"
                            className="baya-input"
                            value={muestraForms[muestraIdx][d.key]}
                            onChange={e=>mSet(d.key,e.target.value)}
                            style={{borderColor:isViol?'var(--danger)':undefined,color:isViol?'var(--danger)':undefined}}/>
                        </div>
                      );
                    })}
                    <div className="baya-total">
                      <span className="baya-total-label">TOTAL defectos</span>
                      <div className="baya-total-values">
                        <span className="baya-total-n">{mCalc.defs} bayas</span>
                        <span className="baya-total-pct"
                          style={{color:mCalc.total>0?(mCalc.pct>5?'var(--danger)':mCalc.pct>4?'var(--warn)':'var(--ok)'):'var(--muted)'}}>
                          {mCalc.total>0?`${fmtNum(mCalc.pct,1)}%`:'—'}
                        </span>
                        <span className={`badge ${!mCalc.resultado?'badge-neutral':mCalc.resultado==='C'?'badge-ok':'badge-danger'}`}>
                          {!mCalc.resultado?'—':mCalc.resultado==='C'?'C':'NC'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="action-bar">
                <button className="btn btn-ghost" onClick={() => muestraIdx>0?setMuestraIdx(i=>i-1):setView('nueva-pcc')}>← Anterior</button>
                <div className="spacer"/>
                {muestraIdx < muestraForms.length-1
                  ? <button className="btn btn-primary btn-lg" onClick={() => setMuestraIdx(i=>i+1)}>Siguiente →</button>
                  : <button className="btn btn-primary btn-lg" onClick={guardarPCC}>Finalizar ✓</button>}
              </div>
            </main>
          </>
        )}

        {/* ════════════════════════════════ PCC RESUMEN ══════════════════════ */}
        {view === 'pcc-resumen' && savedPcc && (
          <>
            <header className="top-bar">
              <button className="icon-btn" onClick={goPCCList}>←</button>
              <div style={{ flex: 1 }}>
                <div className="top-bar-title">{savedPcc.id}</div>
                <div className="top-bar-sub">{fmtDate(savedPcc.fecha)} {savedPcc.hora}{savedPcc.responsable?` · ${savedPcc.responsable}`:''}</div>
              </div>
            </header>
            <main className="content">

              <div className={`pcc-resultado pcc-resultado--${savedPcc.resultado==='C'?'c':savedPcc.resultado==='NC'?'nc':'pending'}`}>
                <div className="pcc-res-label">Resultado global</div>
                <div className="pcc-res-value">
                  {savedPcc.resultado==='C'?'CONFORME':savedPcc.resultado==='NC'?'NO CONFORME':'—'}
                </div>
              </div>

              {(() => {
                const f = FORMATOS_PCC.find(f => f.id === savedPcc.formato);
                const med = calcPCCMedias(savedPcc.muestras);
                return (
                  <>
                    <div className="detail-header" style={{ marginTop: '1rem' }}>
                      <div className="detail-header-grid">
                        {savedPcc.variedad&&<div className="dh-item"><span className="dh-label">Variedad</span><span className="dh-value">{savedPcc.variedad}</span></div>}
                        <div className="dh-item"><span className="dh-label">Formato</span><span className="dh-value">{f?.label} {f?.sub}</span></div>
                        {savedPcc.trazabilidad&&<div className="dh-item"><span className="dh-label">Trazabilidad</span><span className="dh-value">{savedPcc.trazabilidad}</span></div>}
                        {savedPcc.cinaNum&&<div className="dh-item"><span className="dh-label">Cinta Nº</span><span className="dh-value">{savedPcc.cinaNum}</span></div>}
                        {savedPcc.mesaNum&&<div className="dh-item"><span className="dh-label">Mesa Nº</span><span className="dh-value">{savedPcc.mesaNum}</span></div>}
                        <div className="dh-item"><span className="dh-label">SO2</span><span className="dh-value">{(savedPcc.paraSO2||savedPcc.paraSoz)?'Sí':'No'}</span></div>
                      </div>
                    </div>

                    <p className="section-h" style={{ marginTop: '1.25rem' }}>Detalle por muestra</p>
                    <div className="table-wrap">
                      <table className="readings-table">
                        <thead>
                          <tr>
                            <th>M.</th><th>Hora</th><th>Peso (gr)</th><th>Cal.</th><th>%Cal.</th>
                            <th>Brix</th><th>Color</th><th>Escobajo</th><th>Homog.</th>
                            <th>Racimos</th><th>Bayas</th><th>Def.%</th><th>Res.</th>
                          </tr>
                        </thead>
                        <tbody>
                          {savedPcc.muestras.map((m, i) => {
                            const c = calcMuestraRes(m);
                            return (
                              <tr key={i}>
                                <td><strong>{m.num}</strong></td>
                                <td style={{color:'var(--muted)',fontSize:'.82rem'}}>{m.hora||'—'}</td>
                                <td>{m.peso ? `${m.peso} gr` : '—'}</td>
                                <td>{m.calibre||'—'}</td>
                                <td style={{color:parseFloat(m.pctFueraCalibre)>=5?'var(--danger)':'inherit'}}>{m.pctFueraCalibre!==''?`${m.pctFueraCalibre}%`:'—'}</td>
                                <td style={{color:m.brix!==''&&parseFloat(m.brix)<11?'var(--danger)':'inherit',fontWeight:m.brix!==''&&parseFloat(m.brix)<11?700:400}}>{m.brix?`${m.brix}°`:'—'}</td>
                                <td>{m.coloracion||'—'}</td>
                                <td style={{color:m.condicionEscobajo==='No'?'var(--danger)':'inherit'}}>{m.condicionEscobajo||'—'}</td>
                                <td style={{color:m.homogeneidad==='No'?'var(--warn)':'inherit'}}>{m.homogeneidad||'—'}</td>
                                <td>{m.numRacimos||'—'}</td>
                                <td>{m.totalBayas||'—'}</td>
                                <td style={{color:c.pct>5?'var(--danger)':c.pct>4?'var(--warn)':c.total>0?'var(--ok)':'inherit',fontWeight:700}}>{c.total>0?`${fmtNum(c.pct,1)}%`:'—'}</td>
                                <td><span className={`badge ${!c.resultado?'badge-neutral':c.resultado==='C'?'badge-ok':'badge-danger'}`} style={{fontSize:'.72rem',padding:'.2rem .5rem'}}>{c.resultado||'—'}</span></td>
                              </tr>
                            );
                          })}
                          {med && (
                            <tr style={{background:'var(--surface-2,#f8f9fa)',fontWeight:700,borderTop:'2px solid var(--border)'}}>
                              <td style={{color:'var(--muted)',fontSize:'.78rem',textTransform:'uppercase',letterSpacing:'.04em'}}>Media</td>
                              <td>—</td>
                              <td>{med.peso!=null?`${fmtNum(med.peso,0)} gr`:'—'}</td>
                              <td>{med.calibre!=null?fmtNum(med.calibre,1):'—'}</td>
                              <td style={{color:med.pctFueraCalibre!=null&&med.pctFueraCalibre>=5?'var(--danger)':'inherit'}}>{med.pctFueraCalibre!=null?`${fmtNum(med.pctFueraCalibre,1)}%`:'—'}</td>
                              <td style={{color:med.brix!=null&&med.brix<11?'var(--danger)':'inherit'}}>{med.brix!=null?`${fmtNum(med.brix,1)}°`:'—'}</td>
                              <td>{med.coloracion!=null?fmtNum(med.coloracion,1):'—'}</td>
                              <td>{med.escobajoOkCount}/{med.n} Sí</td>
                              <td>{med.homogeneoCount}/{med.n} Sí</td>
                              <td>{med.numRacimos!=null?fmtNum(med.numRacimos,1):'—'}</td>
                              <td style={{fontWeight:800}}>{med.totalBayasAll}</td>
                              <td style={{color:med.pctGlobal>5?'var(--danger)':med.pctGlobal>4?'var(--warn)':'var(--ok)',fontWeight:800}}>{med.totalBayasAll>0?`${fmtNum(med.pctGlobal,1)}%`:'—'}</td>
                              <td>—</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {med && med.totalBayasAll > 0 && (
                      <>
                        <p className="section-h" style={{ marginTop: '1.25rem' }}>Análisis de bayas — totales globales</p>
                        <div className="table-wrap">
                          <table className="readings-table">
                            <thead>
                              <tr>
                                <th>Tipo de defecto</th>
                                <th style={{textAlign:'right'}}>Nº bayas</th>
                                <th style={{textAlign:'right'}}>% s/total ({med.totalBayasAll} bayas)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {DEFECTOS_BAYAS.map(d => {
                                const cnt = med.defTotals[d.key];
                                const pct = med.defPcts[d.key];
                                const isViol = d.cero && cnt > 0;
                                return (
                                  <tr key={d.key} style={{background:isViol?'rgba(220,38,38,.08)':'inherit'}}>
                                    <td>
                                      {d.label}
                                      {d.cero&&<span style={{marginLeft:'.5rem',fontSize:'.72rem',background:'var(--danger)',color:'#fff',borderRadius:'4px',padding:'1px 5px'}}>TOL 0%</span>}
                                    </td>
                                    <td style={{textAlign:'right',fontWeight:700,color:isViol?'var(--danger)':'inherit'}}>{cnt}</td>
                                    <td style={{textAlign:'right',fontWeight:700,color:isViol?'var(--danger)':pct>0?'var(--warn)':'var(--muted)'}}>{fmtNum(pct,2)}%</td>
                                  </tr>
                                );
                              })}
                              <tr style={{background:'var(--surface-2,#f8f9fa)',fontWeight:800,borderTop:'2px solid var(--border)'}}>
                                <td>TOTAL defectos</td>
                                <td style={{textAlign:'right'}}>{med.totalDefsAll}</td>
                                <td style={{textAlign:'right',color:med.pctGlobal>5?'var(--danger)':med.pctGlobal>4?'var(--warn)':'var(--ok)'}}>{fmtNum(med.pctGlobal,2)}% <span style={{fontWeight:400,fontSize:'.8rem'}}>(máx 5%)</span></td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}
                  </>
                );
              })()}

              <div className="action-bar">
                <button className="btn btn-ghost" onClick={goPCCList}>← Lista</button>
                <div className="spacer"/>
                <button className="btn btn-ghost" onClick={() => printPCC(savedPcc)}>🖨 Imprimir informe</button>
                <button className="btn btn-primary" onClick={goNuevaPCC}>+ Nuevo parte</button>
              </div>
            </main>
          </>
        )}

      </div>
    </>
  );
}
