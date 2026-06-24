import { fmtNum, fmtDate } from './utils';
import { PR_CSS } from './print';

// ─── Vida Útil constants ──────────────────────────────────────────────────────
export const varieties = [
  { id: 'uva',       label: 'Uva de Mesa', icon: '🍇' },
  { id: 'remolacha', label: 'Remolacha',   icon: '🫜' },
  { id: 'boniato',   label: 'Boniato',     icon: '🍠' },
  { id: 'calabaza',  label: 'Calabaza',    icon: '🎃' },
  { id: 'pimiento',  label: 'Pimiento',    icon: '🫑' },
];

export const categorias = ['Extra', 'Clase I', 'Clase II', 'Ind.'];

export const TOL = {
  'Extra':    { total: 2,  plagas: 0, cero: 0 },
  'Clase I':  { total: 10, plagas: 2, cero: 0 },
  'Clase II': { total: 15, plagas: 5, cero: 1 },
  'Ind.':     { total: 20, plagas: 9, cero: 1 },
};

export const CVU_LEVES = [
  { key: 'desgrane',           label: 'Desgrane',            okVal: 'No' },
  { key: 'bayasRotas',         label: 'Bayas rotas',         okVal: 'No' },
  { key: 'escobajoMarron',     label: 'Escobajo marrón',     okVal: 'No' },
  { key: 'bayasDeshidratadas', label: 'Bayas deshidratadas', okVal: 'No' },
  { key: 'suciedad',           label: 'Presencia suciedad',  okVal: 'No' },
];
export const CVU_GRAVES = [
  { key: 'plagaPicado', label: 'Plaga / picado', okVal: 'No' },
];
export const CVU_ELIM = [
  { key: 'cuerposExtranos', label: 'Cuerpos extraños', okVal: 'No' },
  { key: 'podridos',        label: 'Podridos',          okVal: 'No' },
];
export const CVU_SINO_FIELDS = [...CVU_LEVES, ...CVU_GRAVES, ...CVU_ELIM];

export function getDefectosCvu(productoId, config) {
  if (config?.defectosCvu?.[productoId]) {
    const d = config.defectosCvu[productoId];
    return {
      leves:  d.leves  || [],
      graves: d.graves || [],
      elim:   d.elim   || [],
      all:    [...(d.leves || []), ...(d.graves || []), ...(d.elim || [])],
    };
  }
  return { leves: CVU_LEVES, graves: CVU_GRAVES, elim: CVU_ELIM, all: CVU_SINO_FIELDS };
}

// pL=% leves, pG=% graves, pE=% elim, pT=% total, cal=% fuera calibre
export const CVU_CALIDAD = [
  { label: 'Extra',     css: 'class-extra', check: (pL,pG,pE,pT,cal) => pE===0 && pG===0 && pL<=2 },
  { label: 'Clase 1',   css: 'class-1',     check: (pL,pG,pE,pT,cal) => pE===0 && pG<=2  && pT<=10 && cal<=5  },
  { label: 'Clase 2',   css: 'class-2',     check: (pL,pG,pE,pT,cal) => pE<=1  && pG<=5  && pT<=15 && cal<=5  },
  { label: 'Industria', css: 'class-ind',   check: (pL,pG,pE,pT,cal) => pE<=1  && pG<=5  && pT<=20 && cal<=10 },
];

// ─── Vida Útil logic ──────────────────────────────────────────────────────────
export function calcLectura(f, pesoInicial, clases = CVU_CALIDAD) {
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
  const found = pd > 0 ? clases.find(c => {
    if (typeof c.check === 'function') return c.check(pctLeves, pctGraves, pctElim, pctTotal, pctCalibre);
    const eOk = c.maxElim == null || pctElim <= c.maxElim;
    const gOk = c.maxGraves == null || pctGraves <= c.maxGraves;
    const tOk = c.maxTotal == null || pctTotal <= c.maxTotal;
    const calOk = c.maxCalibre == null || pctCalibre <= c.maxCalibre;
    return eOk && gOk && tOk && calOk;
  }) : null;
  const clasificacion = pd > 0 ? (found ? found.label : 'No conforme') : null;
  return { pd, pctPerdida, pesoLeves, pesoGraves, pesoElim, pctLeves, pctGraves, pctElim, pctTotal, pctCalibre, clasificacion };
}

export function batchStatusBadge(batch) {
  if (!batch.readings.length) return { label: 'Sin lecturas', css: 'badge-neutral' };
  const c = batch.readings.at(-1).clasificacion;
  if (c === 'Conforme')    return { label: 'Conforme',    css: 'badge-ok' };
  if (c === 'No conforme') return { label: 'No conforme', css: 'badge-danger' };
  return { label: c || '—', css: 'badge-neutral' };
}

export function calcBatchSummary(readings) {
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

// ─── SVG chart helpers ────────────────────────────────────────────────────────
export function MiniLineChart({ series, n, title }) {
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

export function svgChartStr(readings, series, width, height) {
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

// ─── Print batch ─────────────────────────────────────────────────────────────
export function printBatch(b, config = {}) {
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

  const photoPage = b.readings.some(r => r.photo) ? (() => {
    const withPhoto = b.readings.filter(r => r.photo);
    const cells = withPhoto.map(r => `
      <div style="break-inside:avoid;margin-bottom:8px">
        <div style="font-size:7pt;font-weight:700;color:#2e6b2e;margin-bottom:3px;text-transform:uppercase;letter-spacing:.04em">Día ${r.dia} — ${fmtDate(r.fecha)}</div>
        <img src="${r.photo}" style="width:100%;height:140px;object-fit:cover;border-radius:4px;display:block;border:1px solid #ddd"/>
      </div>`).join('');
    return `
      <div style="page-break-before:always">
        <h2 style="margin-bottom:10px">Evolución Fotográfica</h2>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px 12px">${cells}</div>
      </div>`;
  })() : '';

  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
    <title>Vida Útil ${b.id}</title><style>${PR_CSS}</style></head><body>
    <div class="hdr">
      <div class="co">${config?.empresa?.nombre ?? 'Torremesa'}</div>
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
    ${photoPage}
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

