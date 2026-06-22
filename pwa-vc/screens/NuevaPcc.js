import { VARIEDADES_PCC, FORMATOS_PCC } from '../lib/pcc';

export default function NuevaPcc({ pccSetupForm, error, onCancel, onIniciarMuestras, pSet }) {
  return (
    <>
      <header className="top-bar">
        <button className="icon-btn" onClick={onCancel}>←</button>
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
          <button className="btn btn-ghost" onClick={onCancel}>Cancelar</button>
          <div className="spacer"/>
          <button className="btn btn-primary btn-lg" onClick={onIniciarMuestras}>
            Iniciar muestras →
          </button>
        </div>
      </main>
    </>
  );
}
