import { categorias, varieties } from '../lib/cvu';
import Stepper from '../components/Stepper';

export default function NuevaTanda({ tandaForm, error, variety, cfg, onCancel, onSave, tSet }) {
  const vInfo = varieties.find(v => v.id === variety) || { label: variety || 'Producto', icon: '📦' };
  const VARS = (cfg?.variedades?.[variety] ?? []).map(v => typeof v === 'string' ? { code: v, label: v } : v);

  return (
    <>
      <header className="top-bar">
        <button className="icon-btn" onClick={onCancel}>←</button>
        <div style={{ flex: 1 }}>
          <div className="top-bar-title">Nueva tanda</div>
          <div className="top-bar-sub">{vInfo.icon} {vInfo.label}</div>
        </div>
      </header>
      <main className="content">
        {error && <div className="form-error">{error}</div>}
        <p className="section-h">Datos de identificación</p>
        <div className="form-grid g2">
          <div className="field"><label className="req">Confección / Lote</label><input type="text" value={tandaForm.confeccion||''} onChange={e=>tSet('confeccion',e.target.value)} placeholder="Ej. CONF-2026-001"/></div>
          <div className="field"><label className="req">Categoría inicial</label><select value={tandaForm.categoriaInicial||'Extra'} onChange={e=>tSet('categoriaInicial',e.target.value)}>{categorias.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
          <div className="field"><label className="req">Trazabilidad</label><input type="text" value={tandaForm.trazabilidad||''} onChange={e=>tSet('trazabilidad',e.target.value)} placeholder="Código de trazabilidad"/></div>
          <div className="field"><label className="req">Fecha de entrada</label><input type="date" value={tandaForm.fecha||''} onChange={e=>tSet('fecha',e.target.value)}/></div>
          <div className="field"><label className="req">Peso exacto inicial (kg)</label><Stepper value={tandaForm.pesoInicial||''} onChange={v=>tSet('pesoInicial',v)} step={0.5} min={0} max={9999} decimals={1}/></div>
          <div className="field"><label>Nota</label><input type="text" value={tandaForm.nota||''} onChange={e=>tSet('nota',e.target.value)} placeholder="Opcional"/></div>
        </div>

        <p className="section-h">Variedad</p>
        {VARS.length > 0 ? (
          <div className="toggle-group" style={{ marginBottom: '1.25rem' }}>
            {VARS.map(v => (
              <button key={v.code} className={`toggle-btn${tandaForm.variedad===v.code?' toggle-btn--on':''}`}
                onClick={() => tSet('variedad', tandaForm.variedad===v.code ? '' : v.code)}>
                {v.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="field" style={{ marginBottom: '1.25rem' }}>
            <input type="text" value={tandaForm.variedad||''} onChange={e=>tSet('variedad',e.target.value)} placeholder="Variedad / tipo (opcional)"/>
          </div>
        )}

        <div className="action-bar">
          <button className="btn btn-ghost" onClick={onCancel}>Cancelar</button>
          <div className="spacer"/>
          <button className="btn btn-primary btn-lg" onClick={onSave}>Crear tanda →</button>
        </div>
      </main>
    </>
  );
}
