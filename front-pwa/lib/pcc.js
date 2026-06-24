import { fmtNum, fmtDate } from './utils';
import { PR_CSS } from './print';

// ─── PCC constants ────────────────────────────────────────────────────────────
export const VARIEDADES_PCC = ['Sweet Globe', 'Sweet Celebration', 'Candy Snap'];

export const FORMATOS_PCC = [
  { id: 'caja-madera',  label: 'Caja madera',     sub: '7,5 kg',       nMuestras: 10, pesoRef: 7500 },
  { id: 'caja-carton',  label: 'Caja cartón',      sub: '4,5 kg',       nMuestras: 10, pesoRef: 4500 },
  { id: 'tarrina-500',  label: 'Tarrina ×500 gr',  sub: '10 uds/caja',  nMuestras: 10, pesoRef: 500  },
  { id: 'tarrina-1000', label: 'Tarrina ×1000 gr', sub: '10 uds/caja',  nMuestras: 10, pesoRef: 1000 },
  { id: 'ifco-9',       label: 'Caja IFCO',        sub: '9 kg',         nMuestras: 10, pesoRef: 9000 },
  { id: 'granel',       label: 'Granel',           sub: '',             nMuestras: 5,  pesoRef: null },
];

export const DEFECTOS_BAYAS = [
  { key: 'materiaExtrana', label: 'Materia extraña',       cero: false },
  { key: 'suciaPolvo',     label: 'Sucia / con polvo',     cero: false },
  { key: 'deshidratadas',  label: 'Deshidratadas',         cero: false },
  { key: 'picadas',        label: 'Picada / mordisqueada', cero: false },
  { key: 'rotas',          label: 'Rotas / desgrane',      cero: false },
  { key: 'manchasSol',     label: 'Manchas de sol',        cero: true  },
  { key: 'podridas',       label: 'Podridas',              cero: true  },
  { key: 'otros',          label: 'Otros',                 cero: false },
];

// ─── PCC logic ────────────────────────────────────────────────────────────────
export function emptyMuestra(num, hora) {
  return {
    num, hora: hora || '', peso: '', calibre: '', pctFueraCalibre: '', numRacimos: '',
    homogeneidad: '', condicionEscobajo: '', coloracion: '', brix: '',
    totalBayas: '', materiaExtrana: '0', suciaPolvo: '0', deshidratadas: '0',
    picadas: '0', rotas: '0', manchasSol: '0', podridas: '0', otros: '0', otrosDesc: '',
  };
}

export function calcMuestraRes(m, umbrales = { maxDefectosPct: 5, minBrix: 11, maxCalibrePct: 5 }) {
  const total     = parseInt(m.totalBayas) || 0;
  const defs      = DEFECTOS_BAYAS.reduce((s, d) => s + (parseInt(m[d.key]) || 0), 0);
  const pct       = total > 0 ? (defs / total) * 100 : 0;
  const ceroViol  = DEFECTOS_BAYAS.filter(d => d.cero).some(d => (parseInt(m[d.key]) || 0) > 0);
  const calibreViol = m.pctFueraCalibre !== '' && parseFloat(m.pctFueraCalibre) >= umbrales.maxCalibrePct;
  const brixViol  = m.brix !== '' && parseFloat(m.brix) < umbrales.minBrix;
  const resultado = !total ? null : (ceroViol || pct > umbrales.maxDefectosPct || calibreViol || brixViol) ? 'NC' : 'C';
  return { total, defs, pct, ceroViol, calibreViol, brixViol, resultado };
}

export function calcPCCResultado(muestras, umbrales = { maxDefectosPct: 5 }) {
  const filled = muestras.filter(m => parseInt(m.totalBayas) > 0 || m.peso !== '');
  if (!filled.length) return null;
  const totalBayas = filled.reduce((s, m) => s + (parseInt(m.totalBayas) || 0), 0);
  if (totalBayas === 0) return null;
  const totalDefs = DEFECTOS_BAYAS.reduce((s, d) =>
    s + filled.reduce((ss, m) => ss + (parseInt(m[d.key]) || 0), 0), 0);
  return (totalDefs / totalBayas) * 100 < umbrales.maxDefectosPct ? 'C' : 'NC';
}

function mediaMuestras(muestras, key) {
  const vals = muestras.map(m => parseFloat(m[key])).filter(v => !isNaN(v));
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
}

export function calcPCCMedias(muestras) {
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

// ─── Print PCC ────────────────────────────────────────────────────────────────
export function printPCC(p) {
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

