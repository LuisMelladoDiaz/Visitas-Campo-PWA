import { fmtDate } from '../lib/utils';
import { FORMATOS_PCC } from '../lib/pcc';

export default function PccList({ pccs, onBack, onNuevoParte, onOpenPcc }) {
  return (
    <>
      <header className="top-bar">
        <button className="icon-btn" onClick={onBack}>←</button>
        <div style={{ flex: 1 }}>
          <div className="top-bar-title">Parte de Control · Uva de Mesa</div>
          <div className="top-bar-sub">{pccs.length} partes registrados</div>
        </div>
        <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,.2)', color: '#fff', fontWeight: 700 }} onClick={onNuevoParte}>
          + Nuevo parte
        </button>
      </header>
      <main className="content">
        {pccs.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">📋</div>
            <p>No hay partes registrados.</p>
            <p style={{ marginTop: '.5rem', fontSize: '.85rem' }}>Pulsa <strong>+ Nuevo parte</strong> para comenzar.</p>
          </div>
        ) : (
          <div className="batch-list">
            {pccs.slice().reverse().map(p => {
              const fmt = FORMATOS_PCC.find(f => f.id === p.formato);
              const filled = p.muestras.filter(m => m.peso !== '' || parseInt(m.totalBayas) > 0).length;
              return (
                <div key={p.id} className="batch-card" onClick={() => onOpenPcc(p)}>
                  <div className="batch-card-body">
                    <div className="bc-row">
                      <span className="bc-id">{p.id}</span>
                      <span className="bc-date">{fmtDate(p.fecha)} {p.hora}</span>
                    </div>
                    <div className="bc-conf">{fmt?.label} {fmt?.sub}{p.trazabilidad ? ` · ${p.trazabilidad}` : ''}</div>
                    <div className="bc-meta">
                      {p.variedad ? p.variedad : ''}
                      {p.cinaNum ? ` · Cinta ${p.cinaNum}` : ''}{p.mesaNum ? ` · Mesa ${p.mesaNum}` : ''}
                      {p.responsable ? ` · ${p.responsable}` : ''}
                      {(p.paraSO2||p.paraSoz) ? ' · SO2' : ''}
                    </div>
                    <div className="bc-footer">
                      <span className={`badge ${p.resultado==='C'?'badge-ok':p.resultado==='NC'?'badge-danger':'badge-neutral'}`}>
                        {p.resultado==='C'?'CONFORME':p.resultado==='NC'?'NO CONFORME':'Pendiente'}
                      </span>
                      <span style={{ fontSize: '.82rem', color: 'var(--muted)' }}>{filled}/{p.nMuestras} muestras</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
