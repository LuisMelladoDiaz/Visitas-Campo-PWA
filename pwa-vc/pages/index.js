import Head from 'next/head';
import { useEffect, useState } from 'react';

// ── Storage ──────────────────────────────────────────────────────────────────
import { loadBatches, saveBatches, loadPCCs, savePCCs } from '../lib/storage';

// ── Lib ──────────────────────────────────────────────────────────────────────
import { today, nowTime } from '../lib/utils';
import { CVU_SINO_FIELDS, calcLectura } from '../lib/cvu';
import { emptyMuestra, calcMuestraRes, calcPCCResultado, FORMATOS_PCC } from '../lib/pcc';

// ── Screens ──────────────────────────────────────────────────────────────────
import VarietyPicker from '../screens/VarietyPicker';
import Menu          from '../screens/Menu';
import VidaUtilList  from '../screens/VidaUtilList';
import NuevaTanda    from '../screens/NuevaTanda';
import BatchDetail   from '../screens/BatchDetail';
import NuevaLectura  from '../screens/NuevaLectura';
import PccList       from '../screens/PccList';
import NuevaPcc      from '../screens/NuevaPcc';
import PccMuestra    from '../screens/PccMuestra';
import PccResumen    from '../screens/PccResumen';

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

  // ── Bootstrap ────────────────────────────────────────────────────────────
  useEffect(() => {
    setBatches(loadBatches());
    setPccs(loadPCCs());
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
  function goVariety() { setView('variety'); setVariety(null); }
  function goMenu(vid) { setVariety(vid); setView('menu'); }
  function goList()    { setView('vida-util-list'); }

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
    setPccSetupForm({ fecha: today(), hora: nowTime(), responsable: '', variedad: '', trazabilidad: '', cinaNum: '', mesaNum: '', formato: '', paraSO2: false });
    setError('');
    setView('nueva-pcc');
  }

  function iniciarMuestras() {
    if (!pccSetupForm.formato) { setError('Selecciona un formato de envase.'); return; }
    const fmt = FORMATOS_PCC.find(f => f.id === pccSetupForm.formato);
    const t = nowTime();
    setMuestraForms(Array.from({ length: fmt.nMuestras }, (_, i) => emptyMuestra(i + 1, t)));
    setMuestraIdx(0);
    setError('');
    setView('pcc-muestra');
  }

  function guardarPCC() {
    const fmt = FORMATOS_PCC.find(f => f.id === pccSetupForm.formato);
    const resultado = calcPCCResultado(muestraForms);
    const year = new Date().getFullYear();
    const id = `PC-${year}-${String(pccs.length + 1).padStart(4, '0')}`;
    const np = { id, ...pccSetupForm, nMuestras: fmt?.nMuestras || 10, muestras: muestraForms, resultado };
    const next = [...pccs, np];
    setPccs(next);
    savePCCs(next);
    setSavedPcc(np);
    setView('pcc-resumen');
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
    setBatches(next); saveBatches(next); setBatch(nb); setError(''); setView('batch');
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
    setBatches(next); saveBatches(next); setBatch(updated); setEditingIdx(null); setError(''); setView('batch');
  }

  function deleteBatch(id) {
    if (!confirm('¿Eliminar esta tanda y todas sus lecturas?')) return;
    const next = batches.filter(b => b.id !== id);
    setBatches(next); saveBatches(next); setView('vida-util-list');
  }

  // ── Live calcs ────────────────────────────────────────────────────────────
  const lCalc = batch ? calcLectura(lForm, batch.pesoInicial) : null;
  const mCalc = muestraForms[muestraIdx] ? calcMuestraRes(muestraForms[muestraIdx]) : null;

  // ── Setters ───────────────────────────────────────────────────────────────
  function lSet(k, v) { setLForm(p => ({ ...p, [k]: v })); }
  function tSet(k, v) { setTandaForm(p => ({ ...p, [k]: v })); }
  function pSet(k, v) { setPccSetupForm(p => ({ ...p, [k]: v })); }

  const fmtActivo = FORMATOS_PCC.find(f => f.id === pccSetupForm.formato);

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
        {swUpdate && (
          <div className="update-banner">
            Nueva versión disponible
            <button className="update-banner-btn" onClick={applyUpdate}>Actualizar</button>
          </div>
        )}

        {view === 'variety' && (
          <VarietyPicker onSelect={goMenu} />
        )}

        {view === 'menu' && (
          <Menu
            variety={variety}
            onBack={goVariety}
            onGoList={goList}
            onGoPCCList={goPCCList}
          />
        )}

        {view === 'vida-util-list' && (
          <VidaUtilList
            batches={batches}
            onBack={() => setView('menu')}
            onNuevaTanda={goNuevaTanda}
            onOpenBatch={openBatch}
          />
        )}

        {view === 'nueva-tanda' && (
          <NuevaTanda
            tandaForm={tandaForm}
            error={error}
            onCancel={goList}
            onSave={saveTanda}
            tSet={tSet}
          />
        )}

        {view === 'batch' && batch && (
          <BatchDetail
            batch={batch}
            onBack={goList}
            onNuevaLectura={goNuevaLectura}
            onEditLectura={goEditLectura}
            onDeleteBatch={deleteBatch}
          />
        )}

        {view === 'nueva-lectura' && batch && lCalc && (
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

        {view === 'pcc-list' && (
          <PccList
            pccs={pccs}
            onBack={() => setView('menu')}
            onNuevoParte={goNuevaPCC}
            onOpenPcc={p => { setSavedPcc(p); setView('pcc-resumen'); }}
          />
        )}

        {view === 'nueva-pcc' && (
          <NuevaPcc
            pccSetupForm={pccSetupForm}
            error={error}
            onCancel={goPCCList}
            onIniciarMuestras={iniciarMuestras}
            pSet={pSet}
          />
        )}

        {view === 'pcc-muestra' && muestraForms.length > 0 && mCalc && (
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

        {view === 'pcc-resumen' && savedPcc && (
          <PccResumen
            savedPcc={savedPcc}
            onBack={goPCCList}
            onNuevoParte={goNuevaPCC}
          />
        )}
      </div>
    </>
  );
}
