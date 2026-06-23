import { varieties } from '../lib/cvu';

export default function Menu({ variety, onBack, onGoList, onGoPCCList }) {
  return (
    <>
      <header className="top-bar">
        <button className="icon-btn" onClick={onBack}>←</button>
        <div className="top-bar-title">{varieties.find(v => v.id === variety)?.label}</div>
      </header>
      <main className="content content--centered">
        <div className="menu-grid">
          <button className="menu-card" onClick={onGoList}>
            <span className="menu-card-icon">⏱</span>
            <span className="menu-card-name">Control de Vida Útil</span>
            <span className="menu-card-desc">Seguimiento diario de pérdida de peso y defectos en almacenamiento</span>
          </button>
          <button className="menu-card" onClick={onGoPCCList}>
            <span className="menu-card-icon">📋</span>
            <span className="menu-card-name">Parte de Control</span>
            <span className="menu-card-desc">Control de pesos, calibre, color y calidad de baya en línea</span>
          </button>
        </div>
      </main>
    </>
  );
}
