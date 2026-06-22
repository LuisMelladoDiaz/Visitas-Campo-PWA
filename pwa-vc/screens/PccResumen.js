import { fmtDate, fmtNum } from '../lib/utils';
import { DEFECTOS_BAYAS, calcMuestraRes, calcPCCMedias, printPCC, FORMATOS_PCC } from '../lib/pcc';

export default function PccResumen({ savedPcc, onBack, onNuevoParte }) {
  const f = FORMATOS_PCC.find(fmt => fmt.id === savedPcc.formato);
  const med = calcPCCMedias(savedPcc.muestras);

  return (
    <>
      <header className="top-bar">
        <button className="icon-btn" onClick={onBack}>←</button>
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

        <div className="action-bar">
          <button className="btn btn-ghost" onClick={onBack}>← Lista</button>
          <div className="spacer"/>
          <button className="btn btn-ghost" onClick={() => printPCC(savedPcc)}>🖨 Imprimir informe</button>
          <button className="btn btn-primary" onClick={onNuevoParte}>+ Nuevo parte</button>
        </div>
      </main>
    </>
  );
}
