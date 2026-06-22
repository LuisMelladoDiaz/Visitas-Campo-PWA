import { categorias } from '../lib/cvu';
import { VARIEDADES_PCC } from '../lib/pcc';

export default function NuevaTanda({ tandaForm, error, onCancel, onSave, tSet }) {
  return (
    <>
      <header className="top-bar">
        <button className="icon-btn" onClick={onCancel}>←</button>
        <div className="top-bar-title">Nueva tanda · Uva de Mesa</div>
      </header>
      <main className="content">
        {error && <div className="form-error">{error}</div>}
        <p className="section-h">Datos de identificación</p>
        <div className="form-grid g2">
          <div className="field"><label className="req">Confección / Lote</label><input type="text" value={tandaForm.confeccion||''} onChange={e=>tSet('confeccion',e.target.value)} placeholder="Ej. CONF-2026-001"/></div>
          <div className="field"><label className="req">Categoría inicial</label><select value={tandaForm.categoriaInicial||'Extra'} onChange={e=>tSet('categoriaInicial',e.target.value)}>{categorias.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
          <div className="field"><label className="req">Trazabilidad</label><input type="text" value={tandaForm.trazabilidad||''} onChange={e=>tSet('trazabilidad',e.target.value)} placeholder="Código de trazabilidad"/></div>
          <div className="field"><label className="req">Fecha de entrada</label><input type="date" value={tandaForm.fecha||''} onChange={e=>tSet('fecha',e.target.value)}/></div>
          <div className="field"><label className="req">Peso exacto inicial (kg)</label><input type="number" step="0.01" min="0" value={tandaForm.pesoInicial||''} onChange={e=>tSet('pesoInicial',e.target.value)} placeholder="0.00"/></div>
          <div className="field"><label>Nota</label><input type="text" value={tandaForm.nota||''} onChange={e=>tSet('nota',e.target.value)} placeholder="Opcional"/></div>
        </div>
        <p className="section-h">Variedad</p>
        <div className="toggle-group" style={{ marginBottom: '1.25rem' }}>
          {VARIEDADES_PCC.map(v => (
            <button key={v} className={`toggle-btn${tandaForm.variedad===v?' toggle-btn--on':''}`} onClick={() => tSet('variedad', tandaForm.variedad===v?'':v)}>{v}</button>
          ))}
        </div>
        <div className="action-bar">
          <button className="btn btn-ghost" onClick={onCancel}>Cancelar</button>
          <div className="spacer"/>
          <button className="btn btn-primary btn-lg" onClick={onSave}>Crear tanda →</button>
        </div>
      </main>
    </>
  );
}
