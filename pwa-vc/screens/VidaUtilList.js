import { fmtDate, fmtNum } from '../lib/utils';
import { batchStatusBadge } from '../lib/cvu';

export default function VidaUtilList({ batches, onBack, onNuevaTanda, onOpenBatch }) {
  const uvaBatches = batches.filter(b => b.variety === 'uva');

  return (
    <>
      <header className="top-bar">
        <button className="icon-btn" onClick={onBack}>←</button>
        <div style={{ flex: 1 }}>
          <div className="top-bar-title">Control de Vida Útil</div>
          <div className="top-bar-sub">Uva de Mesa · {uvaBatches.length} tandas</div>
        </div>
      </header>
      <main className="content">
        {uvaBatches.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">📦</div>
            <p>No hay tandas registradas.</p>
            <button className="cta-btn" onClick={onNuevaTanda}>+ Nueva tanda</button>
          </div>
        ) : (
          <>
          <div className="batch-list">
            {uvaBatches.slice().reverse().map(b => {
              const status = batchStatusBadge(b);
              const last = b.readings.at(-1);
              return (
                <div key={b.id} className="batch-card" onClick={() => onOpenBatch(b.id)}>
                  <div className="batch-card-body">
                    <div className="bc-row">
                      <span className="bc-id">{b.id}</span>
                      <span className="bc-date">{fmtDate(b.fecha)}</span>
                    </div>
                    <div className="bc-conf">{b.confeccion}</div>
                    <div className="bc-meta">{b.categoriaInicial} · Traz. {b.trazabilidad} · {b.pesoInicial} kg</div>
                    <div className="bc-footer">
                      <span className={`badge ${status.css}`}>{status.label}</span>
                      {last ? <span style={{ fontSize: '.82rem', color: 'var(--muted)' }}>Día {last.dia} · Pérdida: {fmtNum(last.pctPerdida, 1)}%</span>
                            : <span style={{ fontSize: '.82rem', color: 'var(--muted)' }}>Sin lecturas</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <button className="fab" onClick={onNuevaTanda}>+</button>
          </>
        )}
      </main>
    </>
  );
}
