import { fmtDate } from '../lib/utils';
import { FORMATOS_PCC } from '../lib/pcc';
import { varieties } from '../lib/cvu';

export default function PccList({ pccs, variety, onBack, onNuevoParte, onOpenPcc, onRefresh, refreshing }) {
  const vInfo = varieties.find(v => v.id === variety) || { label: variety, icon: '📋' };
  const filtered = pccs.filter(p => p.variety === variety);

  return (
    <>
      <header className="top-bar">
        <button className="icon-btn" onClick={onBack}>←</button>
        <div style={{ flex: 1 }}>
          <div className="top-bar-title">Parte de Control · {vInfo.icon} {vInfo.label}</div>
          <div className="top-bar-sub">{filtered.length} partes registrados</div>
        </div>
        <button className="icon-btn" onClick={onRefresh} disabled={refreshing}
          title="Actualizar desde base de datos" style={{ opacity: refreshing ? .4 : 1 }}>
          {refreshing ? '…' : '↻'}
        </button>
      </header>
      <main className="content">
        {filtered.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">📋</div>
            <p>No hay partes registrados.</p>
            <button className="cta-btn" onClick={onNuevoParte}>+ Nuevo parte</button>
          </div>
        ) : (
          <>
          <div className="batch-list">
            {filtered.slice().reverse().map(p => {
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
          <button className="fab" onClick={onNuevoParte}>+</button>
          </>
        )}
      </main>
    </>
  );
}
