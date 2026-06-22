import { fmtNum, thresholdStatus, classCss } from '../lib/utils';
import { CVU_LEVES, CVU_GRAVES, CVU_ELIM } from '../lib/cvu';

export default function NuevaLectura({ batch, lForm, lCalc, editingIdx, error, onBack, onSave, lSet }) {
  return (
    <>
      <header className="top-bar">
        <button className="icon-btn" onClick={onBack}>←</button>
        <div style={{ flex: 1 }}>
          <div className="top-bar-title">
            {editingIdx !== null ? `Editar lectura · Día ${batch.readings[editingIdx]?.dia}` : `Nueva lectura · Día ${batch.readings.length + 1}`}
          </div>
          <div className="top-bar-sub">{batch.confeccion} · Peso inicial {batch.pesoInicial} kg</div>
        </div>
        <button className="btn btn-primary" style={{marginLeft:'.5rem',whiteSpace:'nowrap'}} onClick={onSave}>Guardar ✓</button>
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
            {CVU_LEVES.map(({key, label}) => {
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
            {CVU_GRAVES.map(({key, label}) => {
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
            {CVU_ELIM.map(({key, label}) => {
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
  );
}
