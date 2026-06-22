import { fmtNum } from '../lib/utils';
import { DEFECTOS_BAYAS, calcMuestraRes } from '../lib/pcc';

export default function PccMuestra({
  muestraForms, muestraIdx, mCalc, pccSetupForm, fmtActivo,
  onBack, onNext, onFinalizar, setMuestraIdx, mSet,
}) {
  return (
    <>
      <header className="top-bar">
        <button className="icon-btn" onClick={onBack}>←</button>
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
