import Head from 'next/head';
import { useEffect, useRef, useState } from 'react';

// ── API (Supabase + localStorage fallback) ───────────────────────────────────
import {
  loadBatches, saveBatch, deleteBatch as apiDeleteBatch,
  loadPCCs,   savePCC,   deletePCC   as apiDeletePCC,
} from '../lib/api';

// ── Auth ─────────────────────────────────────────────────────────────────────
import { getSession, signOut, isAdmin } from '../lib/auth';

// ── Lib ──────────────────────────────────────────────────────────────────────
import { today, nowTime } from '../lib/utils';
import { CVU_SINO_FIELDS, calcLectura } from '../lib/cvu';
import { emptyMuestra, calcMuestraRes, calcPCCResultado } from '../lib/pcc';
import { loadConfigFromDB } from '../lib/configApi';
import { DEFAULT_CONFIG } from '../lib/config';

// ── Screens ──────────────────────────────────────────────────────────────────
import VarietyPicker from '../screens/VarietyPicker';
import Login         from '../screens/Login';
import Menu          from '../screens/Menu';
import VidaUtilList  from '../screens/VidaUtilList';
import NuevaTanda    from '../screens/NuevaTanda';
import BatchDetail   from '../screens/BatchDetail';
import NuevaLectura  from '../screens/NuevaLectura';
import PccList       from '../screens/PccList';
import NuevaPcc      from '../screens/NuevaPcc';
import PccMuestra    from '../screens/PccMuestra';
import PccResumen    from '../screens/PccResumen';
import Admin         from '../screens/Admin';

// ─── User indicator (overlay fijo sobre todas las pantallas) ─────────────────
function UserIndicator({ user, onLogout, onAdmin }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email.split('@')[0];
  const admin = isAdmin(user);

  useEffect(() => {
    if (!open) return;
    function handleClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div className="user-chip" ref={ref}>
      {admin && (
        <button className="icon-btn" onClick={onAdmin} title="Administración">⚙</button>
      )}
      <button className="user-chip-btn" onClick={() => setOpen(o => !o)}>
        <span className="user-chip-avatar">{name[0].toUpperCase()}</span>
        <span className="user-chip-name">{name}</span>
      </button>
      {open && (
        <div className="user-chip-menu">
          <div className="user-chip-email">{user.email}</div>
          <button className="user-chip-logout" onClick={() => { setOpen(false); onLogout(); }}>
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  // ── Vida Útil state ─────────────────────────────────────────────────────
  const [view,       setView]       = useState('variety');
  const [variety,    setVariety]    = useState(null);
  const [batches,    setBatches]    = useState([]);
  const [batch,      setBatch]      = useState(null);
  const [tandaForm,  setTandaForm]  = useState({});
  const [lForm,      setLForm]      = useState({});
  const [editingIdx, setEditingIdx] = useState(null);
  const [error,      setError]      = useState('');

  // ── PCC state ────────────────────────────────────────────────────────────
  const [pccs,         setPccs]         = useState([]);
  const [pccSetupForm, setPccSetupForm] = useState({});
  const [muestraForms, setMuestraForms] = useState([]);
  const [muestraIdx,   setMuestraIdx]   = useState(0);
  const [savedPcc,     setSavedPcc]     = useState(null);
  const [editingPcc,   setEditingPcc]   = useState(null);

  // ── Auth ─────────────────────────────────────────────────────────────────
  const [user, setUser] = useState(null);

  // ── Config ───────────────────────────────────────────────────────────────
  const [cfg, setCfg] = useState(DEFAULT_CONFIG);

  // ── Loading ──────────────────────────────────────────────────────────────
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ── Bootstrap ────────────────────────────────────────────────────────────
  useEffect(() => {
    async function bootstrap() {
      try {
        const [b, p, c, u] = await Promise.all([
          loadBatches(),
          loadPCCs(),
          loadConfigFromDB(),
          getSession(),
        ]);
        setBatches(b);
        setPccs(p);
        setCfg(c);
        setUser(u);
      } catch (e) {
        console.error('Error cargando datos:', e);
      } finally {
        setLoading(false);
      }
    }
    bootstrap();
  }, []);

  const [swUpdate, setSwUpdate] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').then(reg => {
        reg.addEventListener('updatefound', () => {
          const newSW = reg.installing;
          newSW.addEventListener('statechange', () => {
            if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
              setSwUpdate(newSW);
            }
          });
        });
      }).catch(() => null);
    }
  }, []);

  function applyUpdate() {
    if (swUpdate) swUpdate.postMessage({ type: 'SKIP_WAITING' });
    window.location.reload();
  }

  // ── Vida Útil nav ─────────────────────────────────────────────────────────
  async function handleRefresh() {
    setRefreshing(true);
    try {
      const [b, p] = await Promise.all([loadBatches(), loadPCCs()]);
      setBatches(b);
      setPccs(p);
      if (batch)    { const upd = b.find(x => x.id === batch.id);    if (upd) setBatch(upd); }
      if (savedPcc) { const upd = p.find(x => x.id === savedPcc.id); if (upd) setSavedPcc(upd); }
    } catch (e) {
      console.error('Error refrescando datos:', e);
    } finally {
      setRefreshing(false);
    }
  }

  function goVariety() { setView('variety'); setVariety(null); }
  function goMenu(vid) { setVariety(vid); setView('menu'); }
  function goList()    { setView('vida-util-list'); }
  function goAdmin()   { if (isAdmin(user)) setView('admin'); }

  function handleLogin(u) { setUser(u); setView('variety'); }

  async function handleLogout() {
    await signOut();
    setUser(null);
    setView('variety');
  }

  function goNuevaTanda() {
    setTandaForm({ confeccion: '', variedad: '', categoriaInicial: 'Extra', trazabilidad: '', pesoInicial: '', fecha: today(), nota: '' });
    setError('');
    setView('nueva-tanda');
  }

  function openBatch(id) {
    setBatch(batches.find(x => x.id === id));
    setView('batch');
  }

  function goNuevaLectura() {
    const siNoDefaults = Object.fromEntries(CVU_SINO_FIELDS.map(f => [f.key, f.okVal]));
    setLForm({
      fecha: today(), trazabilidad: batch.trazabilidad,
      pesoDiario: '', tempConservacion: '', pctFueraCalibre: '',
      ...siNoDefaults,
      pesoFaltasLeves: '', pesoFaltasGraves: '', pesoFaltasElim: '',
      photo: '',
    });
    setEditingIdx(null);
    setError('');
    setView('nueva-lectura');
  }

  function goEditLectura(idx) {
    const r = batch.readings[idx];
    setLForm({
      fecha: r.fecha, trazabilidad: r.trazabilidad || '',
      pesoDiario: r.pd != null ? String(r.pd) : '',
      tempConservacion: r.tempConservacion != null ? String(r.tempConservacion) : '',
      pctFueraCalibre: r.pctCalibre != null ? String(r.pctCalibre) : '',
      desgrane: r.desgrane || 'No', bayasRotas: r.bayasRotas || 'No',
      escobajoMarron: r.escobajoMarron || 'No', bayasDeshidratadas: r.bayasDeshidratadas || 'No',
      suciedad: r.suciedad || 'No', plagaPicado: r.plagaPicado || 'No',
      cuerposExtranos: r.cuerposExtranos || 'No', podridos: r.podridos || 'No',
      pesoFaltasLeves:  r.pesoFaltasLeves  != null ? String(r.pesoFaltasLeves)  : '',
      pesoFaltasGraves: r.pesoFaltasGraves != null ? String(r.pesoFaltasGraves) : '',
      pesoFaltasElim:   r.pesoFaltasElim   != null ? String(r.pesoFaltasElim)   : '',
      photo: r.photo || '',
    });
    setEditingIdx(idx);
    setError('');
    setView('nueva-lectura');
  }

  // ── PCC nav ───────────────────────────────────────────────────────────────
  function goPCCList() { setView('pcc-list'); }

  function goNuevaPCC() {
    const responsable = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || '';
    setPccSetupForm({ fecha: today(), hora: nowTime(), responsable, variedad: '', trazabilidad: '', cinaNum: '', mesaNum: '', formato: '', paraSO2: false });
    setError('');
    setView('nueva-pcc');
  }

  function iniciarMuestras() {
    if (!pccSetupForm.formato) { setError('Selecciona un formato de envase.'); return; }
    const formatos = cfg?.pcc?.formatos ?? [];
    const fmt = formatos.find(f => f.id === pccSetupForm.formato);
    const t = nowTime();
    setMuestraForms(Array.from({ length: fmt?.nMuestras ?? 10 }, (_, i) => emptyMuestra(i + 1, t)));
    setMuestraIdx(0);
    setError('');
    setView('pcc-muestra');
  }

  function guardarPCC() {
    const umbrales = cfg?.pcc?.umbrales;
    const resultado = calcPCCResultado(muestraForms, umbrales);

    if (editingPcc) {
      // Edición de muestras de un parte existente
      const updated = { ...editingPcc, muestras: muestraForms, resultado };
      const next = pccs.map(p => p.id === updated.id ? updated : p);
      setPccs(next); setSavedPcc(updated); setEditingPcc(null); setView('pcc-resumen');
      savePCC(updated).catch(e => console.error('Error sincronizando PCC:', e));
    } else {
      // Nuevo parte
      const formatos = cfg?.pcc?.formatos ?? [];
      const fmt = formatos.find(f => f.id === pccSetupForm.formato);
      const year = new Date().getFullYear();
      const id = `PC-${year}-${String(pccs.length + 1).padStart(4, '0')}`;
      const np = { id, ...pccSetupForm, nMuestras: fmt?.nMuestras || 10, muestras: muestraForms, resultado };
      const next = [...pccs, np];
      setPccs(next); setSavedPcc(np); setView('pcc-resumen');
      savePCC(np).catch(e => console.error('Error sincronizando PCC:', e));
    }
  }

  function goEditMuestra(pcc, idx) {
    setMuestraForms([...pcc.muestras]);
    setMuestraIdx(idx);
    setEditingPcc(pcc);
    setView('pcc-muestra');
  }

  function deletePCC(id) {
    if (!confirm('¿Eliminar este parte de control?')) return;
    const next = pccs.filter(p => p.id !== id);
    setPccs(next); setView('pcc-list');
    apiDeletePCC(id).catch(e => console.error('Error eliminando PCC:', e));
  }

  function mSet(key, val) {
    setMuestraForms(prev => {
      const next = [...prev];
      next[muestraIdx] = { ...next[muestraIdx], [key]: val };
      return next;
    });
  }

  // ── Vida Útil actions ─────────────────────────────────────────────────────
  function saveTanda() {
    const { confeccion, trazabilidad, pesoInicial, fecha } = tandaForm;
    if (!confeccion || !trazabilidad || !pesoInicial || !fecha) { setError('Completa los campos obligatorios (*).'); return; }
    const year = new Date().getFullYear();
    const id = `TA-${year}-${String(batches.length + 1).padStart(4, '0')}`;
    const nb = { id, variety, confeccion: tandaForm.confeccion, variedad: tandaForm.variedad, categoriaInicial: tandaForm.categoriaInicial, trazabilidad: tandaForm.trazabilidad, pesoInicial: parseFloat(tandaForm.pesoInicial), fecha: tandaForm.fecha, nota: tandaForm.nota, readings: [] };
    const next = [...batches, nb];
    setBatches(next); setBatch(nb); setError(''); setView('batch');
    saveBatch(nb).catch(e => console.error('Error sincronizando tanda:', e));
  }

  function saveLectura() {
    if (!lForm.fecha || !lForm.pesoDiario) { setError('La fecha y el peso diario son obligatorios.'); return; }
    const calc = calcLectura(lForm, batch.pesoInicial);
    const nr = {
      dia: editingIdx !== null ? batch.readings[editingIdx].dia : batch.readings.length + 1,
      fecha: lForm.fecha, trazabilidad: lForm.trazabilidad,
      tempConservacion: lForm.tempConservacion !== '' ? parseFloat(lForm.tempConservacion) : null,
      desgrane: lForm.desgrane, bayasRotas: lForm.bayasRotas,
      escobajoMarron: lForm.escobajoMarron, bayasDeshidratadas: lForm.bayasDeshidratadas,
      suciedad: lForm.suciedad, plagaPicado: lForm.plagaPicado,
      cuerposExtranos: lForm.cuerposExtranos, podridos: lForm.podridos,
      pesoFaltasLeves:  parseFloat(lForm.pesoFaltasLeves)  || 0,
      pesoFaltasGraves: parseFloat(lForm.pesoFaltasGraves) || 0,
      pesoFaltasElim:   parseFloat(lForm.pesoFaltasElim)   || 0,
      photo: lForm.photo || null,
      ...calc,
    };
    const updatedReadings = editingIdx !== null
      ? batch.readings.map((r, i) => i === editingIdx ? nr : r)
      : [...batch.readings, nr];
    const updated = { ...batch, readings: updatedReadings };
    const next = batches.map(b => b.id === batch.id ? updated : b);
    setBatches(next); setBatch(updated); setEditingIdx(null); setError(''); setView('batch');
    saveBatch(updated).then(saved => {
      setBatch(saved);
      setBatches(prev => prev.map(b => b.id === saved.id ? saved : b));
    }).catch(e => console.error('Error sincronizando lectura:', e));
  }

  function deleteBatch(id) {
    if (!confirm('¿Eliminar esta tanda y todas sus lecturas?')) return;
    const next = batches.filter(b => b.id !== id);
    setBatches(next); setView('vida-util-list');
    apiDeleteBatch(id).catch(e => console.error('Error eliminando tanda:', e));
  }

  // ── Live calcs ────────────────────────────────────────────────────────────
  const lCalc = batch ? calcLectura(lForm, batch.pesoInicial, cfg?.cvu?.clases) : null;
  const mCalc = muestraForms[muestraIdx] ? calcMuestraRes(muestraForms[muestraIdx], cfg?.pcc?.umbrales) : null;

  // ── Setters ───────────────────────────────────────────────────────────────
  function lSet(k, v) { setLForm(p => ({ ...p, [k]: v })); }
  function tSet(k, v) { setTandaForm(p => ({ ...p, [k]: v })); }
  function pSet(k, v) { setPccSetupForm(p => ({ ...p, [k]: v })); }

  const fmtActivo = (cfg?.pcc?.formatos ?? []).find(f => f.id === pccSetupForm.formato);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <Head>
        <title>Control de Calidad</title>
        <meta name="theme-color" content="#2e6b2e" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="manifest" href="/manifest.json" />
      </Head>

      <div className={`app${user ? ' user-logged' : ''}`}>
        {user && <UserIndicator user={user} onLogout={handleLogout} onAdmin={goAdmin} />}
        {swUpdate && (
          <div className="update-banner">
            Nueva versión disponible
            <button className="update-banner-btn" onClick={applyUpdate}>Actualizar</button>
          </div>
        )}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: '1rem', color: 'var(--muted)' }}>
            <div style={{ fontSize: '2rem' }}>🍇</div>
            <div style={{ fontSize: '.9rem' }}>Cargando datos…</div>
          </div>
        )}

        {!loading && view === 'login' && (
          <Login onLogin={handleLogin} onBack={goVariety} />
        )}

        {!loading && view === 'variety' && (
          <VarietyPicker
            onSelect={goMenu}
            onAdmin={goAdmin}
            onLoginClick={() => setView('login')}
            user={user}
          />
        )}

        {!loading && view === 'admin' && isAdmin(user) && (
          <Admin onBack={async () => { setCfg(await loadConfigFromDB()); setView('variety'); }} />
        )}

        {!loading && view === 'menu' && (
          <Menu
            variety={variety}
            onBack={goVariety}
            onGoList={goList}
            onGoPCCList={goPCCList}
          />
        )}

        {!loading && view === 'vida-util-list' && (
          <VidaUtilList
            batches={batches}
            variety={variety}
            onBack={() => setView('menu')}
            onNuevaTanda={goNuevaTanda}
            onOpenBatch={openBatch}
            onRefresh={handleRefresh}
            refreshing={refreshing}
          />
        )}

        {!loading && view === 'nueva-tanda' && (
          <NuevaTanda
            tandaForm={tandaForm}
            error={error}
            onCancel={goList}
            onSave={saveTanda}
            tSet={tSet}
          />
        )}

        {!loading && view === 'batch' && batch && (
          <BatchDetail
            batch={batch}
            config={cfg}
            onBack={goList}
            onNuevaLectura={goNuevaLectura}
            onEditLectura={goEditLectura}
            onDeleteBatch={isAdmin(user) ? deleteBatch : null}
            onRefresh={handleRefresh}
            refreshing={refreshing}
          />
        )}

        {!loading && view === 'nueva-lectura' && batch && lCalc && (
          <NuevaLectura
            batch={batch}
            lForm={lForm}
            lCalc={lCalc}
            editingIdx={editingIdx}
            error={error}
            onBack={() => { setEditingIdx(null); setView('batch'); }}
            onSave={saveLectura}
            lSet={lSet}
          />
        )}

        {!loading && view === 'pcc-list' && (
          <PccList
            pccs={pccs}
            variety={variety}
            onBack={() => setView('menu')}
            onNuevoParte={goNuevaPCC}
            onOpenPcc={p => { setSavedPcc(p); setView('pcc-resumen'); }}
            onRefresh={handleRefresh}
            refreshing={refreshing}
          />
        )}

        {!loading && view === 'nueva-pcc' && (
          <NuevaPcc
            pccSetupForm={pccSetupForm}
            error={error}
            variedades={cfg?.pcc?.variedades}
            formatos={cfg?.pcc?.formatos}
            onCancel={goPCCList}
            onIniciarMuestras={iniciarMuestras}
            pSet={pSet}
          />
        )}

        {!loading && view === 'pcc-muestra' && muestraForms.length > 0 && mCalc && (
          <PccMuestra
            muestraForms={muestraForms}
            muestraIdx={muestraIdx}
            mCalc={mCalc}
            pccSetupForm={pccSetupForm}
            fmtActivo={fmtActivo}
            onBack={() => muestraIdx > 0 ? setMuestraIdx(i => i - 1) : setView('nueva-pcc')}
            onNext={() => setMuestraIdx(i => i + 1)}
            onFinalizar={guardarPCC}
            setMuestraIdx={setMuestraIdx}
            mSet={mSet}
          />
        )}

        {!loading && view === 'pcc-resumen' && savedPcc && (
          <PccResumen
            savedPcc={savedPcc}
            onBack={goPCCList}
            onNuevoParte={goNuevaPCC}
            onDeletePcc={isAdmin(user) ? deletePCC : null}
            onEditMuestra={goEditMuestra}
            onRefresh={handleRefresh}
            refreshing={refreshing}
          />
        )}
      </div>
    </>
  );
}
