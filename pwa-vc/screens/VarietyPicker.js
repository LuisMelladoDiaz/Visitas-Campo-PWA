import { varieties } from '../lib/cvu';

export default function VarietyPicker({ onSelect, onAdmin }) {
  return (
    <>
      <header className="top-bar">
        <div className="top-bar-title">Control de Calidad · Línea de Producción</div>
      </header>
      <div style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 10 }}>
        <button
          className="icon-btn"
          style={{ background: 'var(--surface)', color: 'var(--primary)', border: '1.5px solid var(--border)' }}
          onClick={onAdmin}
          title="Administración"
        >⚙</button>
      </div>
      <main className="content">
        <p className="picker-intro">Selecciona la variedad a controlar</p>
        <div className="variety-grid">
          {varieties.map(v => (
            <button key={v.id} className="variety-card" disabled={v.disabled}
              onClick={() => !v.disabled && onSelect(v.id)}>
              <span className="variety-icon">{v.icon}</span>
              <span className="variety-name">{v.label}</span>
              {v.disabled && <span className="variety-soon">Próximamente</span>}
            </button>
          ))}
        </div>
      </main>
    </>
  );
}
