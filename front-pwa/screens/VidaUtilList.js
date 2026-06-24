import { fmtDate, fmtNum } from '../lib/utils';
import { batchStatusBadge, varieties } from '../lib/cvu';

export default function VidaUtilList({ batches, variety, onBack, onNuevaTanda, onOpenBatch, onRefresh, refreshing }) {
  const vInfo = varieties.find(v => v.id === variety) || { label: variety, icon: '📦' };
  const filtered = batches.filter(b => b.variety === variety);

  return (
    <>
      <header className="top-bar">
        <button className="icon-btn" onClick={onBack}>←</button>
        <div style={{ flex: 1 }}>
          <div className="top-bar-title">Control de Vida Útil</div>
          <div className="top-bar-sub">{vInfo.icon} {vInfo.label} · {filtered.length} tandas</div>
        </div>
        <button className="icon-btn" onClick={onRefresh} disabled={refreshing}
          title="Actualizar desde base de datos" style={{ opacity: refreshing ? .4 : 1 }}>
          {refreshing ? '…' : '↻'}
        </button>
      </header>
      <main className="content">
        {filtered.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">📦</div>
            <p>No hay tandas registradas.</p>
            <button className="cta-btn" onClick={onNuevaTanda}>+ Nueva tanda</button>
          </div>
        ) : (
          <>
          <div className="batch-list">
            {filtered.slice().reverse().map(b => {
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
