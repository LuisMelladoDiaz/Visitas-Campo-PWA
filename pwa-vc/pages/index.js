import Head from 'next/head';
import { useEffect, useState } from 'react';

// ─── Storage ───────────────────────────────────────────────────────────────
const STORAGE_KEY = 'cc_tandas_v1';

function loadBatches() {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}

function saveBatches(data) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
  catch { }
}

// ─── Data / constants ───────────────────────────────────────────────────────
const varieties = [
  { id: 'uva', label: 'Uva de Mesa', icon: '🍇' },
  { id: 'calabaza', label: 'Calabaza', icon: '🎃', disabled: true },
  { id: 'pimiento', label: 'Pimiento', icon: '🫑', disabled: true },
  { id: 'remolacha', label: 'Remolacha', icon: '🌸', disabled: true },
  { id: 'boniato', label: 'Boniato', icon: '🍠', disabled: true },
];

const categorias = ['Extra', 'Clase I', 'Clase II', 'Ind.'];

// Tolerance thresholds per category (%)
const TOL = {
  'Extra':   { total: 2,  plagas: 0, cero: 0 },
  'Clase I': { total: 10, plagas: 2, cero: 0 },
  'Clase II':{ total: 15, plagas: 5, cero: 1 },
  'Ind.':    { total: 20, plagas: 9, cero: 1 },
};

// ─── Business logic ─────────────────────────────────────────────────────────
function classifyUva(levesPct, plagasPct, ceroPct) {
  if (levesPct <= 2  && plagasPct === 0 && ceroPct === 0) return 'Extra';
  if (levesPct <= 10 && plagasPct <= 2  && ceroPct === 0) return 'Clase I';
  if (levesPct <= 15 && plagasPct <= 5  && ceroPct <= 1)  return 'Clase II';
  if (levesPct <= 20 && plagasPct <= 9  && ceroPct <= 1)  return 'Ind.';
  return 'No conforme';
}

function calcLectura(f, pesoInicial) {
  const pd = parseFloat(f.pesoDiario) || 0;
  const pi = pesoInicial || 0;

  const difPeso     = pd > 0 ? pd - pi : 0;
  const pctPerdida  = pi > 0 && pd > 0 ? ((pi - pd) / pi) * 100 : 0;

  const desgrane    = parseFloat(f.desgrane) || 0;
  const bayasRotas  = parseFloat(f.bayasRotas) || 0;
  const escobajo    = parseFloat(f.escobajoPardeo) || 0;
  const desidrat    = parseFloat(f.bayasDeshidratadas) || 0;
  const suciedad    = parseFloat(f.suciedad) || 0;
  const levesKg     = desgrane + bayasRotas + escobajo + desidrat + suciedad;
  const levesPct    = pd > 0 ? (levesKg / pd) * 100 : 0;

  const plagasKg    = parseFloat(f.danosPlagasKg) || 0;
  const plagasPct   = pd > 0 ? (plagasKg / pd) * 100 : 0;

  const cuerposKg   = parseFloat(f.cuerposExtranosKg) || 0;
  const podridosKg  = parseFloat(f.podridosKg) || 0;
  const ceroKg      = cuerposKg + podridosKg;
  const ceroPct     = pd > 0 ? (ceroKg / pd) * 100 : 0;

  const clasificacion = pd > 0 ? classifyUva(levesPct, plagasPct, ceroPct) : null;

  return { pd, difPeso, pctPerdida, levesKg, levesPct, plagasKg, plagasPct, ceroKg, ceroPct, clasificacion };
}

function thresholdStatus(value, limit) {
  if (limit === 0) return value > 0 ? 'danger' : 'ok';
  if (value >= limit) return 'danger';
  if (value >= limit * 0.8) return 'warn';
  return 'ok';
}

function classCss(c) {
  if (c === 'Extra')      return 'class-extra';
  if (c === 'Clase I')    return 'class-1';
  if (c === 'Clase II')   return 'class-2';
  if (c === 'Ind.')       return 'class-ind';
  if (c === 'No conforme')return 'class-nc';
  return 'class-none';
}

function batchStatusBadge(batch) {
  if (!batch.readings.length) return { label: 'Sin lecturas', css: 'badge-neutral' };
  const c = batch.readings.at(-1).clasificacion;
  if (c === 'Extra' || c === 'Clase I') return { label: c, css: 'badge-ok' };
  if (c === 'Clase II' || c === 'Ind.') return { label: c, css: 'badge-warn' };
  return { label: c || '—', css: 'badge-danger' };
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function fmtNum(n, dec = 2) {
  return n == null ? '—' : Number(n).toFixed(dec);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

// ─── Component ──────────────────────────────────────────────────────────────
export default function App() {
  const [view,       setView]       = useState('variety');
  const [variety,    setVariety]    = useState(null);
  const [batches,    setBatches]    = useState([]);
  const [batch,      setBatch]      = useState(null);   // active batch detail
  const [tandaForm,  setTandaForm]  = useState({});
  const [lForm,      setLForm]      = useState({});
  const [error,      setError]      = useState('');

  useEffect(() => {
    setBatches(loadBatches());
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => null);
    }
  }, []);

  // ── Navigation helpers ────
  function goVariety() { setView('variety'); setVariety(null); }
  function goMenu(vid) { setVariety(vid); setView('menu'); }
  function goList()    { setView('vida-util-list'); }

  function goNuevaTanda() {
    setTandaForm({ confeccion: '', categoriaInicial: 'Extra', trazabilidad: '', pesoInicial: '', fecha: today(), nota: '' });
    setError('');
    setView('nueva-tanda');
  }

  function openBatch(id) {
    const b = batches.find(x => x.id === id);
    setBatch(b);
    setView('batch');
  }

  function goNuevaLectura() {
    setLForm({
      fecha: today(),
      trazabilidad: batch.trazabilidad,
      pesoDiario: '',
      tempConservacion: '',
      desgrane: '',
      bayasRotas: '',
      escobajoPardeo: '',
      bayasDeshidratadas: '',
      suciedad: '',
      danosPlagasKg: '',
      cuerposExtranosKg: '',
      podridosKg: '',
    });
    setError('');
    setView('nueva-lectura');
  }

  // ── Actions ───────────────
  function saveTanda() {
    const { confeccion, trazabilidad, pesoInicial, fecha } = tandaForm;
    if (!confeccion || !trazabilidad || !pesoInicial || !fecha) {
      setError('Completa los campos obligatorios (*).');
      return;
    }
    const year = new Date().getFullYear();
    const id   = `TA-${year}-${String(batches.length + 1).padStart(4, '0')}`;
    const nb   = {
      id,
      variety,
      confeccion: tandaForm.confeccion,
      categoriaInicial: tandaForm.categoriaInicial,
      trazabilidad: tandaForm.trazabilidad,
      pesoInicial: parseFloat(tandaForm.pesoInicial),
      fecha: tandaForm.fecha,
      nota: tandaForm.nota,
      readings: [],
    };
    const next = [...batches, nb];
    setBatches(next);
    saveBatches(next);
    setBatch(nb);
    setError('');
    setView('batch');
  }

  function saveLectura() {
    if (!lForm.fecha || !lForm.pesoDiario) {
      setError('La fecha y el peso diario son obligatorios.');
      return;
    }
    const calc = calcLectura(lForm, batch.pesoInicial);
    const nr = {
      dia: batch.readings.length + 1,
      fecha: lForm.fecha,
      trazabilidad: lForm.trazabilidad,
      tempConservacion: lForm.tempConservacion !== '' ? parseFloat(lForm.tempConservacion) : null,
      desgrane: parseFloat(lForm.desgrane) || 0,
      bayasRotas: parseFloat(lForm.bayasRotas) || 0,
      escobajoPardeo: parseFloat(lForm.escobajoPardeo) || 0,
      bayasDeshidratadas: parseFloat(lForm.bayasDeshidratadas) || 0,
      suciedad: parseFloat(lForm.suciedad) || 0,
      danosPlagasKg: calc.plagasKg,
      cuerposExtranosKg: parseFloat(lForm.cuerposExtranosKg) || 0,
      podridosKg: parseFloat(lForm.podridosKg) || 0,
      ...calc,
    };
    const updated = { ...batch, readings: [...batch.readings, nr] };
    const next = batches.map(b => b.id === batch.id ? updated : b);
    setBatches(next);
    saveBatches(next);
    setBatch(updated);
    setError('');
    setView('batch');
  }

  function deleteBatch(id) {
    if (!confirm('¿Eliminar esta tanda y todas sus lecturas?')) return;
    const next = batches.filter(b => b.id !== id);
    setBatches(next);
    saveBatches(next);
    setView('vida-util-list');
  }

  // ── Live calc for the form ──
  const lCalc = batch ? calcLectura(lForm, batch.pesoInicial) : null;

  // ── Shortcut for form field change ──
  function lSet(key, val) { setLForm(p => ({ ...p, [key]: val })); }
  function tSet(key, val) { setTandaForm(p => ({ ...p, [key]: val })); }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <Head>
        <title>Control de Calidad</title>
        <meta name="theme-color" content="#2e6b2e" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="manifest" href="/manifest.json" />
      </Head>

      <div className="app">

        {/* ══════════════════════════════════════════════════
            VIEW: VARIETY PICKER
        ══════════════════════════════════════════════════ */}
        {view === 'variety' && (
          <>
            <header className="top-bar">
              <div className="top-bar-title">Control de Calidad · Línea de Producción</div>
            </header>
            <main className="content">
              <p className="picker-intro">Selecciona la variedad a controlar</p>
              <div className="variety-grid">
                {varieties.map(v => (
                  <button
                    key={v.id}
                    className="variety-card"
                    disabled={v.disabled}
                    onClick={() => !v.disabled && goMenu(v.id)}
                  >
                    <span className="variety-icon">{v.icon}</span>
                    <span className="variety-name">{v.label}</span>
                    {v.disabled && <span className="variety-soon">Próximamente</span>}
                  </button>
                ))}
              </div>
            </main>
          </>
        )}

        {/* ══════════════════════════════════════════════════
            VIEW: CONTROL TYPE MENU
        ══════════════════════════════════════════════════ */}
        {view === 'menu' && (
          <>
            <header className="top-bar">
              <button className="icon-btn" onClick={goVariety} aria-label="Volver">←</button>
              <div className="top-bar-title">
                {varieties.find(v => v.id === variety)?.label}
              </div>
            </header>
            <main className="content">
              <div className="menu-grid">
                <button className="menu-card" onClick={goList}>
                  <span className="menu-card-icon">⏱</span>
                  <span className="menu-card-name">Control de Vida Útil</span>
                  <span className="menu-card-desc">Seguimiento diario de pérdida de peso y defectos en almacenamiento</span>
                </button>
                <button className="menu-card" disabled>
                  <span className="menu-card-icon">📊</span>
                  <span className="menu-card-name">Parte de Calidad</span>
                  <span className="menu-card-desc">Próximamente disponible</span>
                </button>
              </div>
            </main>
          </>
        )}

        {/* ══════════════════════════════════════════════════
            VIEW: VIDA ÚTIL — LISTA DE TANDAS
        ══════════════════════════════════════════════════ */}
        {view === 'vida-util-list' && (
          <>
            <header className="top-bar">
              <button className="icon-btn" onClick={() => setView('menu')} aria-label="Volver">←</button>
              <div style={{ flex: 1 }}>
                <div className="top-bar-title">Control de Vida Útil</div>
                <div className="top-bar-sub">Uva de Mesa · {batches.filter(b => b.variety === 'uva').length} tandas</div>
              </div>
              <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,.2)', color: '#fff', fontWeight: 700 }} onClick={goNuevaTanda}>
                + Nueva tanda
              </button>
            </header>
            <main className="content">
              {batches.filter(b => b.variety === 'uva').length === 0 ? (
                <div className="empty">
                  <div className="empty-icon">📦</div>
                  <p>No hay tandas registradas.</p>
                  <p style={{ marginTop: '.5rem', fontSize: '.85rem' }}>Pulsa <strong>+ Nueva tanda</strong> para comenzar.</p>
                </div>
              ) : (
                <div className="batch-list">
                  {batches.filter(b => b.variety === 'uva').slice().reverse().map(b => {
                    const status = batchStatusBadge(b);
                    const last   = b.readings.at(-1);
                    return (
                      <div key={b.id} className="batch-card" onClick={() => openBatch(b.id)}>
                        <div className="batch-card-body">
                          <div className="bc-row">
                            <span className="bc-id">{b.id}</span>
                            <span className="bc-date">{fmtDate(b.fecha)}</span>
                          </div>
                          <div className="bc-conf">{b.confeccion}</div>
                          <div className="bc-meta">
                            {b.categoriaInicial} · Traz. {b.trazabilidad} · Peso inicial {b.pesoInicial} kg
                          </div>
                          <div className="bc-footer">
                            <span className={`badge ${status.css}`}>{status.label}</span>
                            {last && (
                              <span style={{ fontSize: '.82rem', color: 'var(--muted)' }}>
                                Día {last.dia} · {fmtDate(last.fecha)} · Pérdida: {fmtNum(last.pctPerdida, 1)}%
                              </span>
                            )}
                            {!last && (
                              <span style={{ fontSize: '.82rem', color: 'var(--muted)' }}>Sin lecturas</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </main>
          </>
        )}

        {/* ══════════════════════════════════════════════════
            VIEW: NUEVA TANDA
        ══════════════════════════════════════════════════ */}
        {view === 'nueva-tanda' && (
          <>
            <header className="top-bar">
              <button className="icon-btn" onClick={goList} aria-label="Cancelar">←</button>
              <div className="top-bar-title">Nueva tanda · Uva de Mesa</div>
            </header>
            <main className="content">
              {error && <div className="form-error">{error}</div>}
              <p className="section-h">Datos de identificación</p>
              <div className="form-grid g2">
                <div className="field">
                  <label className="req">Confección / Lote</label>
                  <input
                    type="text"
                    value={tandaForm.confeccion || ''}
                    onChange={e => tSet('confeccion', e.target.value)}
                    placeholder="Ej. CONF-2026-001"
                  />
                </div>
                <div className="field">
                  <label className="req">Categoría inicial</label>
                  <select value={tandaForm.categoriaInicial || 'Extra'} onChange={e => tSet('categoriaInicial', e.target.value)}>
                    {categorias.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label className="req">Trazabilidad</label>
                  <input
                    type="text"
                    value={tandaForm.trazabilidad || ''}
                    onChange={e => tSet('trazabilidad', e.target.value)}
                    placeholder="Código de trazabilidad"
                  />
                </div>
                <div className="field">
                  <label className="req">Fecha de entrada</label>
                  <input
                    type="date"
                    value={tandaForm.fecha || ''}
                    onChange={e => tSet('fecha', e.target.value)}
                  />
                </div>
                <div className="field">
                  <label className="req">Peso exacto inicial (kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={tandaForm.pesoInicial || ''}
                    onChange={e => tSet('pesoInicial', e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="field">
                  <label>Nota</label>
                  <input
                    type="text"
                    value={tandaForm.nota || ''}
                    onChange={e => tSet('nota', e.target.value)}
                    placeholder="Opcional"
                  />
                </div>
              </div>

              <div className="action-bar">
                <button className="btn btn-ghost" onClick={goList}>Cancelar</button>
                <div className="spacer" />
                <button className="btn btn-primary btn-lg" onClick={saveTanda}>Crear tanda →</button>
              </div>
            </main>
          </>
        )}

        {/* ══════════════════════════════════════════════════
            VIEW: BATCH DETAIL
        ══════════════════════════════════════════════════ */}
        {view === 'batch' && batch && (
          <>
            <header className="top-bar">
              <button className="icon-btn" onClick={goList} aria-label="Volver">←</button>
              <div style={{ flex: 1 }}>
                <div className="top-bar-title">{batch.confeccion}</div>
                <div className="top-bar-sub">{batch.id} · {batch.categoriaInicial} · {batch.trazabilidad}</div>
              </div>
              <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,.2)', color: '#fff', fontWeight: 700 }} onClick={goNuevaLectura}>
                + Lectura
              </button>
            </header>
            <main className="content">
              {/* Batch header info */}
              <div className="detail-header">
                <div className="detail-header-grid">
                  <div className="dh-item">
                    <span className="dh-label">Fecha entrada</span>
                    <span className="dh-value">{fmtDate(batch.fecha)}</span>
                  </div>
                  <div className="dh-item">
                    <span className="dh-label">Categoría inicial</span>
                    <span className="dh-value">{batch.categoriaInicial}</span>
                  </div>
                  <div className="dh-item">
                    <span className="dh-label">Peso inicial</span>
                    <span className="dh-value">{batch.pesoInicial} kg</span>
                  </div>
                  <div className="dh-item">
                    <span className="dh-label">Trazabilidad</span>
                    <span className="dh-value">{batch.trazabilidad}</span>
                  </div>
                  <div className="dh-item">
                    <span className="dh-label">Días controlados</span>
                    <span className="dh-value">{batch.readings.length}</span>
                  </div>
                  {batch.nota && (
                    <div className="dh-item" style={{ gridColumn: '1 / -1' }}>
                      <span className="dh-label">Nota</span>
                      <span className="dh-value">{batch.nota}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Readings history */}
              <p className="section-h">Historial de lecturas ({batch.readings.length})</p>
              {batch.readings.length === 0 ? (
                <div className="empty" style={{ padding: '2rem 1rem' }}>
                  <div className="empty-icon" style={{ fontSize: '2rem' }}>📋</div>
                  <p>Sin lecturas. Pulsa <strong>+ Lectura</strong> para registrar el primer control.</p>
                </div>
              ) : (
                <div className="table-wrap">
                  <table className="readings-table">
                    <thead>
                      <tr>
                        <th>Día</th>
                        <th>Fecha</th>
                        <th>Peso (kg)</th>
                        <th>Δ Peso</th>
                        <th>% Pérdida</th>
                        <th>Tª (°C)</th>
                        <th>Def. Leves %</th>
                        <th>Plagas %</th>
                        <th>Cero kg</th>
                        <th>Clasificación</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batch.readings.map(r => {
                        const perdidaOk = r.pctPerdida < 1.5;
                        const perdidaWarn = r.pctPerdida >= 1.5 && r.pctPerdida < 2;
                        return (
                          <tr key={r.dia}>
                            <td><strong>{r.dia}</strong></td>
                            <td>{fmtDate(r.fecha)}</td>
                            <td>{fmtNum(r.pd)}</td>
                            <td style={{ color: r.difPeso < 0 ? 'var(--warn)' : 'var(--ok)' }}>
                              {r.difPeso >= 0 ? '+' : ''}{fmtNum(r.difPeso)}
                            </td>
                            <td style={{ color: perdidaOk ? 'var(--ok)' : perdidaWarn ? 'var(--warn)' : 'var(--danger)', fontWeight: 700 }}>
                              {fmtNum(r.pctPerdida, 1)}%
                            </td>
                            <td>{r.tempConservacion != null ? `${r.tempConservacion}°` : '—'}</td>
                            <td style={{ color: r.levesPct > 10 ? 'var(--danger)' : r.levesPct > 8 ? 'var(--warn)' : 'inherit' }}>
                              {fmtNum(r.levesPct, 1)}%
                            </td>
                            <td style={{ color: r.plagasPct > 2 ? 'var(--danger)' : 'inherit' }}>
                              {fmtNum(r.plagasPct, 1)}%
                            </td>
                            <td style={{ color: r.ceroKg > 0 ? 'var(--danger)' : 'inherit', fontWeight: r.ceroKg > 0 ? 700 : 400 }}>
                              {fmtNum(r.ceroKg)} kg
                            </td>
                            <td>
                              <span className={`badge ${r.clasificacion === 'Extra' || r.clasificacion === 'Clase I' ? 'badge-ok' : r.clasificacion === 'No conforme' ? 'badge-danger' : 'badge-warn'}`}>
                                {r.clasificacion || '—'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Danger zone */}
              <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                <button className="btn btn-danger btn-sm" onClick={() => deleteBatch(batch.id)}>
                  Eliminar tanda
                </button>
              </div>
            </main>
          </>
        )}

        {/* ══════════════════════════════════════════════════
            VIEW: NUEVA LECTURA
        ══════════════════════════════════════════════════ */}
        {view === 'nueva-lectura' && batch && lCalc && (
          <>
            <header className="top-bar">
              <button className="icon-btn" onClick={() => setView('batch')} aria-label="Cancelar">←</button>
              <div style={{ flex: 1 }}>
                <div className="top-bar-title">Lectura · Día {batch.readings.length + 1}</div>
                <div className="top-bar-sub">{batch.confeccion} · Peso inicial {batch.pesoInicial} kg</div>
              </div>
            </header>
            <main className="content">
              {error && <div className="form-error">{error}</div>}

              {/* Row 1: Basic identification */}
              <p className="section-h">Identificación de la muestra</p>
              <div className="form-grid g2" style={{ marginBottom: '1.25rem' }}>
                <div className="field">
                  <label className="req">Fecha del control</label>
                  <input type="date" value={lForm.fecha} onChange={e => lSet('fecha', e.target.value)} />
                </div>
                <div className="field">
                  <label>Trazabilidad</label>
                  <input type="text" value={lForm.trazabilidad} onChange={e => lSet('trazabilidad', e.target.value)} placeholder={batch.trazabilidad} />
                </div>
                <div className="field">
                  <label className="req">Peso diario (kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={lForm.pesoDiario}
                    onChange={e => lSet('pesoDiario', e.target.value)}
                    placeholder="0.00"
                    style={{ fontSize: '1.2rem', fontWeight: 700 }}
                  />
                </div>
                <div className="field">
                  <label>Tª conservación (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={lForm.tempConservacion}
                    onChange={e => lSet('tempConservacion', e.target.value)}
                    placeholder="Ej. 6.0"
                  />
                </div>
              </div>

              {/* Defects + Result card */}
              <div className="lectura-layout">

                {/* Left: defect inputs */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                  {/* Defectos leves */}
                  <div className="defect-card">
                    <div className="dc-header">
                      <span className="dc-title">Defectos leves</span>
                      <span className="dc-limit">Umbral: 10%</span>
                    </div>
                    <div className="dc-body">
                      {[
                        { key: 'desgrane',          label: 'Desgrane' },
                        { key: 'bayasRotas',         label: 'Bayas rotas' },
                        { key: 'escobajoPardeo',     label: 'Escobajo pardeo' },
                        { key: 'bayasDeshidratadas', label: 'Bayas deshidratadas' },
                        { key: 'suciedad',           label: 'Presencia suciedad' },
                      ].map(({ key, label }) => (
                        <div key={key} className="defect-row">
                          <span className="defect-label">{label}</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            className="defect-input"
                            value={lForm[key]}
                            onChange={e => lSet(key, e.target.value)}
                            placeholder="0.00"
                          />
                        </div>
                      ))}
                      <div className="dc-total">
                        <span style={{ fontSize: '.83rem', color: 'var(--muted)' }}>TOTAL</span>
                        <div className="dc-total-values">
                          <div className="dc-total-kg">{fmtNum(lCalc.levesKg)} kg</div>
                          <div className="dc-total-pct" style={{ color: lCalc.levesPct > 10 ? 'var(--danger)' : lCalc.levesPct > 8 ? 'var(--warn)' : 'var(--ok)' }}>
                            {lCalc.pd > 0 ? `${fmtNum(lCalc.levesPct, 1)}%` : '—'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Daños graves */}
                  <div className="defect-card">
                    <div className="dc-header">
                      <span className="dc-title">Daños plagas / picados</span>
                      <span className="dc-limit">Umbral grave: 2,5%</span>
                    </div>
                    <div className="dc-body">
                      <div className="defect-row">
                        <span className="defect-label">Plagas / picados (kg)</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="defect-input"
                          value={lForm.danosPlagasKg}
                          onChange={e => lSet('danosPlagasKg', e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="dc-total">
                        <span style={{ fontSize: '.83rem', color: 'var(--muted)' }}>TOTAL</span>
                        <div className="dc-total-values">
                          <div className="dc-total-kg">{fmtNum(lCalc.plagasKg)} kg</div>
                          <div className="dc-total-pct" style={{ color: lCalc.plagasPct > 2.5 ? 'var(--danger)' : lCalc.plagasPct > 2 ? 'var(--warn)' : 'var(--ok)' }}>
                            {lCalc.pd > 0 ? `${fmtNum(lCalc.plagasPct, 1)}%` : '—'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tolerancia cero */}
                  <div className="defect-card">
                    <div className="dc-header">
                      <span className="dc-title">Tolerancia cero</span>
                      <span className="dc-limit" style={{ color: 'var(--danger)', fontWeight: 700 }}>0% Extra / Cl.I</span>
                    </div>
                    <div className="dc-body">
                      {[
                        { key: 'cuerposExtranosKg', label: 'Cuerpos extraños' },
                        { key: 'podridosKg',         label: 'Podridos' },
                      ].map(({ key, label }) => (
                        <div key={key} className="defect-row">
                          <span className="defect-label">{label}</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            className="defect-input"
                            value={lForm[key]}
                            onChange={e => lSet(key, e.target.value)}
                            placeholder="0.00"
                          />
                        </div>
                      ))}
                      <div className="dc-total">
                        <span style={{ fontSize: '.83rem', color: 'var(--muted)' }}>TOTAL</span>
                        <div className="dc-total-values">
                          <div className="dc-total-kg" style={{ color: lCalc.ceroKg > 0 ? 'var(--danger)' : 'inherit' }}>
                            {fmtNum(lCalc.ceroKg)} kg
                          </div>
                          <div className="dc-total-pct" style={{ color: lCalc.ceroKg > 0 ? 'var(--danger)' : 'var(--ok)' }}>
                            {lCalc.pd > 0 ? `${fmtNum(lCalc.ceroPct, 2)}%` : '—'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>{/* end left col */}

                {/* Right: live result card */}
                <div className="result-card">
                  <div className="rc-header">Resultado en tiempo real</div>
                  <div className="rc-body">

                    {/* Classification badge */}
                    <div className={`class-display ${lCalc.clasificacion ? classCss(lCalc.clasificacion) : 'class-none'}`}>
                      <span className="class-label">Clasificación</span>
                      <span className="class-value">{lCalc.clasificacion || '—'}</span>
                    </div>

                    {/* Weight loss */}
                    {(() => {
                      const s = thresholdStatus(lCalc.pctPerdida, 2);
                      const pct = lCalc.pd > 0 ? Math.min((lCalc.pctPerdida / 2) * 100, 100) : 0;
                      return (
                        <div className="thresh-row">
                          <div className="thresh-label-row">
                            <span className="thresh-name">% Pérdida de peso</span>
                            <span className={`thresh-val ${s}`}>{lCalc.pd > 0 ? `${fmtNum(lCalc.pctPerdida, 1)}%` : '—'}</span>
                          </div>
                          <div className="thresh-track">
                            <div className={`thresh-fill ${s}`} style={{ width: `${pct}%` }} />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.72rem', color: 'var(--muted)', marginTop: '.2rem' }}>
                            <span>0%</span><span>máx 2%</span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Defectos leves */}
                    {(() => {
                      const catLimit = TOL[batch.categoriaInicial]?.total ?? 10;
                      const s = thresholdStatus(lCalc.levesPct, catLimit);
                      const pct = lCalc.pd > 0 ? Math.min((lCalc.levesPct / catLimit) * 100, 100) : 0;
                      return (
                        <div className="thresh-row">
                          <div className="thresh-label-row">
                            <span className="thresh-name">Defectos leves</span>
                            <span className={`thresh-val ${s}`}>{lCalc.pd > 0 ? `${fmtNum(lCalc.levesPct, 1)}%` : '—'}</span>
                          </div>
                          <div className="thresh-track">
                            <div className={`thresh-fill ${s}`} style={{ width: `${pct}%` }} />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.72rem', color: 'var(--muted)', marginTop: '.2rem' }}>
                            <span>0%</span><span>máx {catLimit}% ({batch.categoriaInicial})</span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Plagas */}
                    {(() => {
                      const catLimit = TOL[batch.categoriaInicial]?.plagas ?? 2;
                      const barMax = catLimit === 0 ? 1 : catLimit;
                      const s = thresholdStatus(lCalc.plagasPct, catLimit);
                      const pct = lCalc.pd > 0 ? Math.min((lCalc.plagasPct / Math.max(barMax, 2.5)) * 100, 100) : 0;
                      return (
                        <div className="thresh-row">
                          <div className="thresh-label-row">
                            <span className="thresh-name">Daños plagas / picados</span>
                            <span className={`thresh-val ${s}`}>{lCalc.pd > 0 ? `${fmtNum(lCalc.plagasPct, 1)}%` : '—'}</span>
                          </div>
                          <div className="thresh-track">
                            <div className={`thresh-fill ${s}`} style={{ width: `${pct}%` }} />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.72rem', color: 'var(--muted)', marginTop: '.2rem' }}>
                            <span>0%</span><span>máx {catLimit}% ({batch.categoriaInicial})</span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Tolerancia cero */}
                    <div className="thresh-row">
                      <span className="thresh-name">Tolerancia cero</span>
                      {lCalc.ceroKg === 0 ? (
                        <div className="cero-status cero-ok">✓ Sin defectos cero</div>
                      ) : (
                        <div className="cero-status cero-danger">✗ {fmtNum(lCalc.ceroKg)} kg detectados</div>
                      )}
                    </div>

                    {/* Reference table */}
                    <details style={{ marginTop: '.25rem' }}>
                      <summary style={{ fontSize: '.78rem', color: 'var(--muted)', cursor: 'pointer', userSelect: 'none', paddingTop: '.25rem' }}>
                        Ver tabla de clasificación
                      </summary>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.77rem', marginTop: '.65rem' }}>
                        <thead>
                          <tr>
                            {['', 'Extra', 'Cl.I', 'Cl.II', 'Ind.'].map(h => (
                              <th key={h} style={{ padding: '.3rem .4rem', background: 'var(--surface-2)', borderBottom: '1.5px solid var(--border)', textAlign: h ? 'center' : 'left', fontWeight: 700, color: 'var(--muted)' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { label: 'Total defectos', vals: ['2%', '10%', '15%', '20%'] },
                            { label: 'Plagas/picados', vals: ['0%', '2%', '5%', '9%'] },
                            { label: 'Cuerpos/podridos', vals: ['0%', '0%', '1%', '1%'] },
                          ].map(row => (
                            <tr key={row.label}>
                              <td style={{ padding: '.3rem .4rem', color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>{row.label}</td>
                              {row.vals.map((v, i) => (
                                <td key={i} style={{ padding: '.3rem .4rem', textAlign: 'center', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>{v}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </details>

                  </div>
                </div>{/* end result card */}

              </div>{/* end lectura-layout */}

              <div className="action-bar">
                <button className="btn btn-ghost" onClick={() => setView('batch')}>Cancelar</button>
                <div className="spacer" />
                <button className="btn btn-primary btn-lg" onClick={saveLectura}>
                  Guardar lectura ✓
                </button>
              </div>
            </main>
          </>
        )}

      </div>
    </>
  );
}
