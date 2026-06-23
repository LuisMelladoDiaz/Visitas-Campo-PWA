import { fmtDate, fmtNum } from '../lib/utils';
import { CVU_CALIDAD, calcBatchSummary, MiniLineChart } from '../lib/cvu';
import { printBatch } from '../lib/cvu';

export default function BatchDetail({ batch, config, onBack, onNuevaLectura, onEditLectura, onDeleteBatch }) {
  return (
    <>
      <header className="top-bar">
        <button className="icon-btn" onClick={onBack}>←</button>
        <div style={{ flex: 1 }}>
          <div className="top-bar-title">{batch.confeccion}</div>
          <div className="top-bar-sub">{batch.id} · {batch.categoriaInicial} · {batch.trazabilidad}</div>
        </div>
        <button className="icon-btn" onClick={() => printBatch(batch, config)} title="Imprimir informe">🖨</button>
        {onDeleteBatch && <button className="icon-btn" style={{ background: 'rgba(192,48,48,.25)' }} onClick={() => onDeleteBatch(batch.id)} title="Eliminar tanda">🗑</button>}
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
            <p>Sin lecturas registradas.</p>
            <button className="cta-btn" onClick={onNuevaLectura}>+ Nueva lectura</button>
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
                      <td style={{display:'flex',alignItems:'center',gap:'.25rem'}}>
                        {r.photo && <img src={r.photo} style={{width:'28px',height:'28px',objectFit:'cover',borderRadius:'4px'}} alt=""/>}
                        <button className="btn-edit-row" onClick={() => onEditLectura(ri)} title="Editar">✎</button>
                      </td>
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
          <button className="fab" onClick={onNuevaLectura}>+</button>
          </>
        )}
      </main>
    </>
  );
}
