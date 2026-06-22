import { varieties } from '../lib/cvu';

export default function VarietyPicker({ onSelect }) {
  return (
    <>
      <header className="top-bar">
        <div className="top-bar-title">Control de Calidad · Línea de Producción</div>
      </header>
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
