import { fmtNum, thresholdStatus, classCss } from '../lib/utils';
import { CVU_LEVES, CVU_GRAVES, CVU_ELIM } from '../lib/cvu';
import Stepper from '../components/Stepper';

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
              <Stepper value={lForm.pesoDiario} onChange={v=>lSet('pesoDiario',v)} step={0.5} min={0} max={9999} decimals={1} inputStyle={{fontSize:'1.1rem',fontWeight:700}}/>
            </div>
            <div className="lc-field">
              <label>Tª conservación (°C)</label>
              <Stepper value={lForm.tempConservacion} onChange={v=>lSet('tempConservacion',v)} step={0.5} min={-20} max={30} decimals={1}/>
            </div>
            <div className="lc-field">
              <label>% Varianza calibre</label>
              <Stepper value={lForm.pctFueraCalibre} onChange={v=>lSet('pctFueraCalibre',v)} step={0.5} min={0} max={100} decimals={1}/>
            </div>
            <div className="lc-field">
              <label>Foto del día</label>
              <input
                id="photo-input"
                type="file"
                accept="image/*"
                capture="environment"
                style={{display:'none'}}
                onChange={async e => {
                  const file = e.target.files[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = ev => {
                    const img = new Image();
                    img.onload = () => {
                      const MAX = 800;
                      let w = img.width, h = img.height;
                      if (w > MAX || h > MAX) {
                        if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
                        else { w = Math.round(w * MAX / h); h = MAX; }
                      }
                      const canvas = document.createElement('canvas');
                      canvas.width = w; canvas.height = h;
                      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                      lSet('photo', canvas.toDataURL('image/jpeg', 0.65));
                    };
                    img.src = ev.target.result;
                  };
                  reader.readAsDataURL(file);
                }}
              />
              <button
                type="button"
                className="btn btn-secondary"
                style={{width:'100%'}}
                onClick={() => document.getElementById('photo-input').click()}
              >
                {lForm.photo ? 'Cambiar foto' : 'Añadir foto'}
              </button>
              {lForm.photo && (
                <>
                  <img src={lForm.photo} style={{maxWidth:'100%',borderRadius:'.5rem',marginTop:'.5rem'}}/>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{marginTop:'.35rem',fontSize:'.8rem'}}
                    onClick={() => lSet('photo', '')}
                  >
                    ✕ Quitar
                  </button>
                </>
              )}
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
              <Stepper value={lForm.pesoFaltasLeves} onChange={v=>lSet('pesoFaltasLeves',v)} step={0.1} min={0} max={9999} decimals={1} style={{flex:1}}/>
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
              <Stepper value={lForm.pesoFaltasGraves} onChange={v=>lSet('pesoFaltasGraves',v)} step={0.1} min={0} max={9999} decimals={1} style={{flex:1}}/>
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
              <Stepper value={lForm.pesoFaltasElim} onChange={v=>lSet('pesoFaltasElim',v)} step={0.1} min={0} max={9999} decimals={1} style={{flex:1}}/>
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
