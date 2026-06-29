import { varieties } from '../lib/cvu';

export default function VarietyPicker({ onSelect, onAdmin, onLoginClick, user }) {
  return (
    <>
      <header className="top-bar">
        <div className="top-bar-title" style={{ flex: 1 }}>Control de Calidad · Línea de Producción</div>
        {!user && (
          <button className="icon-btn" onClick={onLoginClick} title="Iniciar sesión">🔐</button>
        )}
      </header>
      <main className="content">
        <p className="picker-intro">Selecciona la variedad a controlar</p>
        <div className="variety-grid">
          {varieties.map(v => (
            <button key={v.id} className="variety-card variety-card--photo"
              style={{ '--vbg': `url(/${v.id}-bg.jpg)` }}
              disabled={v.disabled}
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
