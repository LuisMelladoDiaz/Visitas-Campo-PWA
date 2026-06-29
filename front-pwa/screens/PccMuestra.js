import { fmtNum } from '../lib/utils';
import { DEFECTOS_BAYAS, calcMuestraRes, calcMuestraResUnidades } from '../lib/pcc';
import { varieties } from '../lib/cvu';
import Stepper from '../components/Stepper';

export default function PccMuestra({
  muestraForms, muestraIdx, mCalc, pccSetupForm, fmtActivo,
  variety, cfg,
  onBack, onBackToMenu, onNext, onFinalizar, setMuestraIdx, mSet, mSetDefecto,
}) {
  const isUva = variety === 'uva';
  const vInfo = varieties.find(v => v.id === variety) || { icon: '📦' };
  const defectosConfig = cfg?.defectosPcc?.[variety] ?? [];
  const m = muestraForms[muestraIdx];
  const n_unidades = parseInt(m?.n_unidades) || 0;

  return (
    <>
      <header className="top-bar">
        <button className="icon-btn" onClick={onBackToMenu}>←</button>
        <div style={{ flex: 1 }}>
          <div className="top-bar-title">Muestra {muestraIdx+1} de {muestraForms.length}</div>
          <div className="top-bar-sub">
            {vInfo.icon} {pccSetupForm.variedad||fmtActivo?.label}
            {pccSetupForm.cinaNum?` · Cinta ${pccSetupForm.cinaNum}`:''}
            {pccSetupForm.mesaNum?` · Mesa ${pccSetupForm.mesaNum}`:''}
          </div>
        </div>
        <div className="muestra-dots">
          {muestraForms.map((mx, i) => {
            const c = isUva ? calcMuestraRes(mx) : calcMuestraResUnidades(mx);
            return (
              <button key={i} onClick={() => setMuestraIdx(i)}
                className={`mdot${i===muestraIdx?' mdot--active':c.resultado==='C'?' mdot--ok':c.resultado==='NC'?' mdot--nc':''}`}
                aria-label={`Muestra ${i+1}`}/>
            );
          })}
        </div>
      </header>

      <main className="content">
        {isUva ? (
          /* ── UVA: baya-counting layout ──────────────────────────────────── */
          <div className="pcc-muestra-layout">
            <div className="pcc-left">
              <p className="section-h">Medidas físicas</p>
              <div className="form-grid g2" style={{ marginBottom: '1rem' }}>
                <div className="field">
                  <label>Hora de medición</label>
                  <input type="time" value={m.hora} onChange={e=>mSet('hora',e.target.value)}/>
                </div>
                <div className="field" style={{gridColumn:'1/-1'}}>
                  <label>Peso (gr){fmtActivo?.pesoRef != null ? ` — ref. ${fmtActivo.pesoRef} gr` : ''}</label>
                  <Stepper value={m.peso} onChange={v=>mSet('peso',v)} step={5} min={0} max={5000} decimals={0} inputStyle={{fontSize:'1.15rem',fontWeight:700}}/>
                </div>
                <div className="field">
                  <label>Calibre (mm)</label>
                  <Stepper value={m.calibre} onChange={v=>mSet('calibre',v)} step={0.5} min={0} max={50} decimals={1}/>
                </div>
                <div className="field">
                  <label>% Fuera calibre <span style={{color:'var(--muted)',fontWeight:400,textTransform:'none'}}>(máx 5%)</span></label>
                  <Stepper value={m.pctFueraCalibre} onChange={v=>mSet('pctFueraCalibre',v)} step={0.5} min={0} max={100} decimals={1} inputStyle={{color:parseFloat(m.pctFueraCalibre)>=5?'var(--danger)':'inherit'}}/>
                </div>
                <div className="field">
                  <label>Nº racimos</label>
                  <Stepper value={m.numRacimos} onChange={v=>mSet('numRacimos',v)} step={1} min={0} max={200} decimals={0}/>
                </div>
              </div>

              <div className="field" style={{ marginBottom: '1rem' }}>
                <label>Homogeneidad calibre</label>
                <div className="toggle-group">
                  {[['Si','toggle-btn--on'],['No','toggle-btn--on toggle-btn--danger']].map(([v,cls])=>(
                    <button key={v}
                      className={`toggle-btn${m.homogeneidad===v?` ${cls}`:''}`}
                      onClick={()=>mSet('homogeneidad',m.homogeneidad===v?'':v)}>
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
                      className={`toggle-btn${m.condicionEscobajo===v?` ${cls}`:''}`}
                      onClick={()=>mSet('condicionEscobajo',m.condicionEscobajo===v?'':v)}>
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
                      className={`toggle-btn toggle-btn--num${m.coloracion===String(n)?' toggle-btn--on':''}`}
                      onClick={()=>mSet('coloracion',m.coloracion===String(n)?'':String(n))}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div className="field">
                <label>ºBrix <span style={{color:'var(--muted)',fontWeight:400,textTransform:'none'}}>(mín. 12°, tol. ±1°)</span></label>
                <Stepper value={m.brix} onChange={v=>mSet('brix',v)} step={0.1} min={0} max={30} decimals={1} inputStyle={{fontSize:'1.15rem',fontWeight:700,color:m.brix!==''&&parseFloat(m.brix)<11?'var(--danger)':'inherit'}}/>
                {m.brix!==''&&parseFloat(m.brix)<11&&(
                  <span className="field-hint" style={{color:'var(--danger)'}}>Por debajo del mínimo admisible (11°)</span>
                )}
              </div>
            </div>

            <div className="pcc-right">
              <p className="section-h">Conteo de bayas</p>
              <div className="field" style={{ marginBottom: '1rem' }}>
                <label className="req">Total bayas contadas</label>
                <Stepper value={m.totalBayas} onChange={v=>mSet('totalBayas',v)} step={1} min={0} max={1000} decimals={0} inputStyle={{fontSize:'1.3rem',fontWeight:800}}/>
              </div>
              <div className="baya-card">
                {DEFECTOS_BAYAS.map(d => {
                  const val = parseInt(m[d.key]) || 0;
                  const isViol = d.cero && val > 0;
                  return (
                    <div key={d.key} className={`baya-row${isViol?' baya-row--viol':''}`}>
                      <div className="baya-label-wrap">
                        <span className="baya-label">{d.label}</span>
                        {d.cero && <span className="baya-cero-tag">TOL 0%</span>}
                      </div>
                      <Stepper value={m[d.key]} onChange={v=>mSet(d.key,v)} step={1} min={0} max={999} decimals={0} compact style={{width:'120px'}} inputStyle={{color:isViol?'var(--danger)':undefined}}/>
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
                      {!mCalc.resultado?'—':mCalc.resultado}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ── PIMIENTO / CALABAZA: unit-counting layout ───────────────────── */
          <div className="pcc-muestra-layout">
            <div className="pcc-left">
              <p className="section-h">Datos generales</p>
              <div className="form-grid g2" style={{ marginBottom: '1rem' }}>
                <div className="field">
                  <label>Hora de medición</label>
                  <input type="time" value={m.hora||''} onChange={e=>mSet('hora',e.target.value)}/>
                </div>
                <div className="field" style={{gridColumn:'1/-1'}}>
                  <label className="req">Nº unidades examinadas</label>
                  <Stepper value={m.n_unidades||''} onChange={v=>mSet('n_unidades',v)} step={1} min={0} max={9999} decimals={0} inputStyle={{fontSize:'1.3rem',fontWeight:800}}/>
                </div>
                <div className="field">
                  <label>Peso total (gr)</label>
                  <Stepper value={m.peso||''} onChange={v=>mSet('peso',v)} step={50} min={0} max={99999} decimals={0}/>
                </div>
                <div className="field">
                  <label>Temperatura (°C)</label>
                  <Stepper value={m.temperatura||''} onChange={v=>mSet('temperatura',v)} step={0.5} min={-10} max={50} decimals={1}/>
                </div>
              </div>
              <div className="field">
                <label>Observaciones</label>
                <textarea value={m.observaciones||''} onChange={e=>mSet('observaciones',e.target.value)}
                  rows={3} style={{width:'100%',padding:'.5rem',borderRadius:'6px',border:'1px solid var(--border)',fontSize:'.9rem'}}/>
              </div>
            </div>

            <div className="pcc-right">
              <p className="section-h">Defectos por unidad</p>
              <div className="baya-card">
                {defectosConfig.map(d => {
                  const u = parseInt(m?.defectos?.[d.key]?.unidades) || 0;
                  const pct = n_unidades > 0 ? (u / n_unidades) * 100 : null;
                  const isViol = d.toleranciaCero && u > 0;
                  return (
                    <div key={d.key} className={`baya-row${isViol?' baya-row--viol':''}`}>
                      <div className="baya-label-wrap">
                        <span className="baya-label">{d.label}</span>
                        {d.toleranciaCero && <span className="baya-cero-tag">TOL 0%</span>}
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:'.5rem'}}>
                        <Stepper
                          value={m?.defectos?.[d.key]?.unidades ?? '0'}
                          onChange={v => mSetDefecto(d.key, v)}
                          step={1} min={0} max={9999} decimals={0} compact
                          style={{width:'110px'}}
                          inputStyle={{color:isViol?'var(--danger)':undefined}}/>
                        <span style={{fontSize:'.82rem',minWidth:'3.8rem',textAlign:'right',
                          color:pct!=null?(isViol?'var(--danger)':pct>0?'var(--warn)':'var(--muted)'):'var(--muted)'}}>
                          {pct != null ? `${fmtNum(pct,1)}%` : '—'}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div className="baya-total">
                  <span className="baya-total-label">TOTAL defectos</span>
                  <div className="baya-total-values">
                    <span className="baya-total-n">{mCalc.totalDefs ?? 0} uds</span>
                    <span className="baya-total-pct"
                      style={{color:n_unidades>0?(mCalc.totalPct>10?'var(--danger)':mCalc.totalPct>7?'var(--warn)':'var(--ok)'):'var(--muted)'}}>
                      {n_unidades>0?`${fmtNum(mCalc.totalPct,1)}%`:'—'}
                    </span>
                    <span className={`badge ${!mCalc.resultado?'badge-neutral':mCalc.resultado==='C'?'badge-ok':'badge-danger'}`}>
                      {!mCalc.resultado?'—':mCalc.resultado}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="action-bar">
          <button className="btn btn-ghost" onClick={onBack}>← Anterior</button>
          <div className="spacer"/>
          {muestraIdx < muestraForms.length-1
            ? <button className="btn btn-primary btn-lg" onClick={onNext}>Siguiente →</button>
            : <button className="btn btn-primary btn-lg" onClick={onFinalizar}>Finalizar ✓</button>}
        </div>
      </main>
    </>
  );
}
