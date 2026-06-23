import { useState } from 'react';
import { loadConfig, saveConfig } from '../lib/config';
import Stepper from '../components/Stepper';

export default function Admin({ onBack }) {
  const [cfg, setCfg] = useState(() => loadConfig());

  // ── Empresa ────────────────────────────────────────────────────────────────
  function setEmpresaNombre(val) {
    setCfg(c => ({ ...c, empresa: { ...c.empresa, nombre: val } }));
  }

  // ── Variedades ─────────────────────────────────────────────────────────────
  const [newVariety, setNewVariety] = useState('');

  function removeVariety(idx) {
    setCfg(c => ({
      ...c,
      pcc: { ...c.pcc, variedades: c.pcc.variedades.filter((_, i) => i !== idx) },
    }));
  }

  function addVariety() {
    const v = newVariety.trim();
    if (!v) return;
    setCfg(c => ({
      ...c,
      pcc: { ...c.pcc, variedades: [...c.pcc.variedades, v] },
    }));
    setNewVariety('');
  }

  // ── Formatos ───────────────────────────────────────────────────────────────
  const emptyFmt = { label: '', sub: '', pesoRef: '', nMuestras: '' };
  const [newFmt, setNewFmt] = useState(emptyFmt);

  function removeFormato(idx) {
    setCfg(c => ({
      ...c,
      pcc: { ...c.pcc, formatos: c.pcc.formatos.filter((_, i) => i !== idx) },
    }));
  }

  function addFormato() {
    const { label, sub, pesoRef, nMuestras } = newFmt;
    if (!label.trim()) return;
    const id = label.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    setCfg(c => ({
      ...c,
      pcc: {
        ...c.pcc,
        formatos: [
          ...c.pcc.formatos,
          {
            id,
            label: label.trim(),
            sub: sub.trim(),
            pesoRef: pesoRef === '' ? null : Number(pesoRef),
            nMuestras: nMuestras === '' ? 10 : Number(nMuestras),
          },
        ],
      },
    }));
    setNewFmt(emptyFmt);
  }

  // ── Umbrales PCC ───────────────────────────────────────────────────────────
  function setUmbral(key, val) {
    setCfg(c => ({
      ...c,
      pcc: {
        ...c.pcc,
        umbrales: { ...c.pcc.umbrales, [key]: parseFloat(val) || 0 },
      },
    }));
  }

  // ── Umbrales CVU ───────────────────────────────────────────────────────────
  function setClaseField(idx, key, val) {
    setCfg(c => {
      const clases = c.cvu.clases.map((cls, i) =>
        i === idx ? { ...cls, [key]: val === '' ? null : Number(val) } : cls
      );
      return { ...c, cvu: { ...c.cvu, clases } };
    });
  }

  // ── Save ───────────────────────────────────────────────────────────────────
  function handleSave() {
    saveConfig(cfg);
    onBack();
  }

  return (
    <>
      <header className="top-bar">
        <div className="top-bar-title">Administración</div>
      </header>

      <main className="content" style={{ paddingBottom: '5rem' }}>

        {/* ── Empresa ── */}
        <p className="section-h">Empresa</p>
        <div className="form-group">
          <label className="form-label">Nombre empresa / Razón social</label>
          <input
            className="form-input"
            type="text"
            value={cfg.empresa.nombre}
            onChange={e => setEmpresaNombre(e.target.value)}
          />
        </div>

        {/* ── Variedades ── */}
        <p className="section-h">Variedades de uva (PCC)</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', marginBottom: '1rem' }}>
          {cfg.pcc.variedades.map((v, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '.75rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '.75rem', padding: '.5rem 1rem' }}>
              <span style={{ flex: 1 }}>{v}</span>
              <button
                className="icon-btn"
                style={{ color: 'var(--danger)', fontSize: '1rem', lineHeight: 1 }}
                onClick={() => removeVariety(i)}
                title="Eliminar"
              >✕</button>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '.5rem' }}>
          <input
            className="form-input"
            type="text"
            placeholder="Nueva variedad…"
            value={newVariety}
            onChange={e => setNewVariety(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addVariety()}
            style={{ flex: 1 }}
          />
          <button className="btn btn-primary" onClick={addVariety}>Añadir variedad</button>
        </div>

        {/* ── Formatos ── */}
        <p className="section-h">Formatos de envase (PCC)</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem', marginBottom: '1rem' }}>
          {cfg.pcc.formatos.map((f, i) => (
            <div key={f.id ?? i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '.75rem', padding: '.75rem 1rem', display: 'flex', alignItems: 'flex-start', gap: '.75rem' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{f.label}</div>
                {f.sub && <div style={{ fontSize: '.85rem', color: 'var(--muted)' }}>{f.sub}</div>}
                <div style={{ fontSize: '.8rem', color: 'var(--muted)', marginTop: '.25rem' }}>
                  {f.pesoRef != null ? `Peso ref: ${f.pesoRef} g` : 'Sin peso ref'} · {f.nMuestras} muestras
                </div>
              </div>
              <button
                className="icon-btn"
                style={{ color: 'var(--danger)', fontSize: '1rem', lineHeight: 1 }}
                onClick={() => removeFormato(i)}
                title="Eliminar"
              >✕</button>
            </div>
          ))}
        </div>
        {/* Add formato form */}
        <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '.75rem', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
          <div style={{ fontWeight: 600, fontSize: '.9rem', color: 'var(--muted)', marginBottom: '.25rem' }}>Añadir formato</div>
          <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
            <input
              className="form-input"
              type="text"
              placeholder="Etiqueta *"
              value={newFmt.label}
              onChange={e => setNewFmt(f => ({ ...f, label: e.target.value }))}
              style={{ flex: '2 1 140px' }}
            />
            <input
              className="form-input"
              type="text"
              placeholder="Sub-etiqueta"
              value={newFmt.sub}
              onChange={e => setNewFmt(f => ({ ...f, sub: e.target.value }))}
              style={{ flex: '2 1 120px' }}
            />
            <input
              className="form-input"
              type="number"
              placeholder="Peso ref (g)"
              value={newFmt.pesoRef}
              onChange={e => setNewFmt(f => ({ ...f, pesoRef: e.target.value }))}
              style={{ flex: '1 1 100px' }}
            />
            <input
              className="form-input"
              type="number"
              placeholder="Nº muestras"
              value={newFmt.nMuestras}
              onChange={e => setNewFmt(f => ({ ...f, nMuestras: e.target.value }))}
              style={{ flex: '1 1 100px' }}
            />
          </div>
          <button className="btn btn-primary" onClick={addFormato} style={{ alignSelf: 'flex-end' }}>Añadir formato</button>
        </div>

        {/* ── Umbrales PCC ── */}
        <p className="section-h">Umbrales PCC</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
            <label style={{ flex: 1 }}>Máx. defectos (%)</label>
            <Stepper
              value={String(cfg.pcc.umbrales.maxDefectosPct)}
              onChange={val => setUmbral('maxDefectosPct', val)}
              step={0.5} min={0} max={100} decimals={1}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
            <label style={{ flex: 1 }}>Mínimo °Brix</label>
            <Stepper
              value={String(cfg.pcc.umbrales.minBrix)}
              onChange={val => setUmbral('minBrix', val)}
              step={0.1} min={0} max={30} decimals={1}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
            <label style={{ flex: 1 }}>Máx. fuera calibre (%)</label>
            <Stepper
              value={String(cfg.pcc.umbrales.maxCalibrePct)}
              onChange={val => setUmbral('maxCalibrePct', val)}
              step={0.5} min={0} max={100} decimals={1}
            />
          </div>
        </div>

        {/* ── Umbrales CVU ── */}
        <p className="section-h">Umbrales CVU — Clasificación de calidad</p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.9rem' }}>
            <thead>
              <tr style={{ background: 'var(--surface-2)' }}>
                <th style={{ textAlign: 'left', padding: '.5rem .75rem', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>Clase</th>
                <th style={{ textAlign: 'center', padding: '.5rem .5rem', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>Elim</th>
                <th style={{ textAlign: 'center', padding: '.5rem .5rem', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>Graves</th>
                <th style={{ textAlign: 'center', padding: '.5rem .5rem', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>Total</th>
                <th style={{ textAlign: 'center', padding: '.5rem .5rem', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>Calibre</th>
              </tr>
            </thead>
            <tbody>
              {cfg.cvu.clases.map((cls, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '.5rem .75rem', fontWeight: 600 }}>{cls.label}</td>
                  {['maxElim', 'maxGraves', 'maxTotal', 'maxCalibre'].map(key => (
                    <td key={key} style={{ padding: '.35rem .25rem', textAlign: 'center' }}>
                      <Stepper
                        value={cls[key] == null ? '' : String(cls[key])}
                        onChange={val => setClaseField(i, key, val)}
                        step={1} min={0} max={100} decimals={0}
                        compact
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </main>

      {/* ── Action bar ── */}
      <div className="action-bar">
        <button className="btn btn-ghost" onClick={onBack}>← Volver</button>
        <button className="btn btn-primary btn-lg" onClick={handleSave}>Guardar cambios ✓</button>
      </div>
    </>
  );
}
