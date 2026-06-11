import Head from 'next/head';
import { useEffect, useRef, useState } from 'react';
import { loadVisitsFromStorage, saveVisitsToStorage } from '../lib/storage';

const technicians = ['Carlos Romero Vega', 'Ana Belén Fuentes', 'Miguel Ángel Díaz'];
const farms = [
  { name: 'Las Marismas Norte', surface: 12.5, crop: 'Fresa', location: 'Rota' },
  { name: 'Pago del Pino', surface: 8.3, crop: 'Frambuesa', location: 'Sanlúcar' },
  { name: 'Cortijo El Álamo', surface: 22.1, crop: 'Tomate Cherry', location: 'Jerez' },
  { name: 'La Dehesilla', surface: 6.8, crop: 'Arándano', location: 'Chipiona' },
  { name: 'Viña Los Remedios', surface: 18.4, crop: 'Vid Palomino', location: 'El Puerto' }
];
const visitTypes = [
  'Evaluación del estado del cultivo',
  'Diagnóstico de plagas o enfermedades',
  'Valoración de daños meteorológicos',
  'Seguimiento de labores agrícolas',
  'Asesoramiento sobre riego, fertilización o manejo',
  'Verificación para ayudas, certificaciones o seguros',
  'Otro'
];
const visitTypeShort = {
  'Evaluación del estado del cultivo': 'Evaluación',
  'Diagnóstico de plagas o enfermedades': 'Diagnóstico',
  'Valoración de daños meteorológicos': 'Daños meteor.',
  'Seguimiento de labores agrícolas': 'Seguimiento',
  'Asesoramiento sobre riego, fertilización o manejo': 'Asesoramiento',
  'Verificación para ayudas, certificaciones o seguros': 'Verificación',
  'Otro': 'Otro'
};
const irrigationSystems = ['Goteo subsuperficial', 'Goteo superficial', 'Aspersión', 'Gravedad', 'Secano'];
const soilTypes = ['Franco arenoso', 'Franco arcilloso', 'Arenoso', 'Arcilloso', 'Limoso', 'Franco'];
const phenologyStates = ['Brotación', 'Floración', 'Cuajado', 'Desarrollo de fruto', 'Maduración', 'Post-cosecha', 'Reposo vegetativo'];
const previousCrops = ['Trigo', 'Girasol', 'Remolacha', 'Barbecho', 'Mismo cultivo', 'Maíz', 'Algodón'];
const damageOptions = ['Helada', 'Granizo', 'Viento', 'Lluvia intensa', 'Encharcamiento', 'Sequía', 'Golpe de calor', 'Ninguno'];

const sampleVisits = [
  {
    code: 'VT-2026-00001',
    date: '2026-05-24',
    technician: 'Carlos Romero Vega',
    farm: 'Las Marismas Norte',
    surface: 12.5,
    visitType: 'Evaluación del estado del cultivo',
    visitDescription: 'Revisión completa de la plantación de fresa. Buena brotación general.',
    previousCrop: 'Mismo cultivo',
    previousTreatments: 'Fungicida preventivo aplicado hace 10 días.',
    crop: 'Fresa',
    sowingDate: '2025-10-15',
    irrigation: 'Goteo superficial',
    soilType: 'Franco arenoso',
    phenology: 'Desarrollo de fruto',
    generalState: 'Cultivo vigoroso con uniformidad en la parcela.',
    growthState: 'Buena emergencia y formación de fruto.',
    weedToggle: false,
    weedDescription: '',
    pestsDiseases: 'Sin síntomas relevantes; se observa leve picado de insectos.',
    damageSelection: ['Ninguno'],
    damageDescription: 'No se han detectado daños relevantes.',
    fruitSize: 18,
    kgPerHa: 9000,
    totalHarvest: 112500,
    waterStatus: 'Buena humedad de suelo, riego estable.',
    recommendFito: 'Mantener monitorización de trips y ácaros.',
    recommendNutrition: 'Aporte de potasio localizado en la zona de fruto.',
    recommendIrrigation: 'Riego diario controlado por tensión de sustrato.',
    finalNotes: 'Recomendable limpiar accesos antes de la próxima cosecha.',
    photos: []
  },
  {
    code: 'VT-2026-00002',
    date: '2026-05-28',
    technician: 'Ana Belén Fuentes',
    farm: 'Viña Los Remedios',
    surface: 18.4,
    visitType: 'Verificación para ayudas, certificaciones o seguros',
    visitDescription: 'Visita para inspección de viña de palomino previo a auditoría.',
    previousCrop: 'Trigo',
    previousTreatments: 'Cubierta vegetal con herbicida localizado.',
    crop: 'Vid Palomino',
    sowingDate: '2024-04-05',
    irrigation: 'Gravedad',
    soilType: 'Franco',
    phenology: 'Floración',
    generalState: 'Cierre de surcos adecuado, sanidad correcta.',
    growthState: 'Floración homogénea con pocos racimos abortados.',
    weedToggle: true,
    weedDescription: 'Hierbas espontáneas en laterales, se recomienda escarda mecánica.',
    pestsDiseases: 'Presencia leve de araña roja en algunas hojas.',
    damageSelection: ['Sequía'],
    damageDescription: 'Estrés hídrico moderado en parcelas expuestas.',
    fruitSize: 6,
    kgPerHa: 5600,
    totalHarvest: 103040,
    waterStatus: 'Control de humedad necesario en sectores altos.',
    recommendFito: 'Aplicar acaricida selectivo en áreas afectadas.',
    recommendNutrition: 'Aporte de calcio para mejorar firmeza de fruto.',
    recommendIrrigation: 'Revisar compuertas y renovar mangueras filtrantes.',
    finalNotes: 'Documentar incidencia para certificación de seguro.',
    photos: []
  },
  {
    code: 'VT-2026-00003',
    date: '2026-06-01',
    technician: 'Miguel Ángel Díaz',
    farm: 'Pago del Pino',
    surface: 8.3,
    visitType: 'Diagnóstico de plagas o enfermedades',
    visitDescription: 'Inspección de frambuesa con incidencias de manchas foliares.',
    previousCrop: 'Barbecho',
    previousTreatments: 'Ninguno reciente.',
    crop: 'Frambuesa',
    sowingDate: '2025-09-20',
    irrigation: 'Goteo subsuperficial',
    soilType: 'Franco arcilloso',
    phenology: 'Cuajado',
    generalState: 'Áreas con manchas foliares y pérdida de vigor.',
    growthState: 'Plantas con desarrollo irregular.',
    weedToggle: false,
    weedDescription: '',
    pestsDiseases: 'Se observan manchas necróticas y posible oidio incipiente.',
    damageSelection: ['Viento', 'Lluvia intensa'],
    damageDescription: 'Daños mecánicos en brotes tras tormenta.',
    fruitSize: 14,
    kgPerHa: 8600,
    totalHarvest: 71380,
    waterStatus: 'Humedad adecuada en banco de riego.',
    recommendFito: 'Tratamiento con fungicida preventivo y fungicida de contacto.',
    recommendNutrition: 'Nutrientes de calcio y magnesio en pulverización.',
    recommendIrrigation: 'Mantener riego regular evitando encharcamiento.',
    finalNotes: 'Revisar evolución en 7 días y ajustar dosis.',
    photos: []
  }
];

const steps = ['Identificación', 'Objeto y antecedentes', 'Descripción explotación', 'Observaciones de campo', 'Recomendaciones'];

const requiredFieldsByStep = {
  0: ['date', 'technician', 'farm', 'surface'],
  1: ['visitType', 'visitDescription', 'previousCrop'],
  2: ['crop', 'sowingDate', 'irrigation', 'soilType', 'phenology'],
  3: ['generalState', 'growthState'],
  4: []
};

const emptyForm = {
  code: '',
  date: '',
  technician: technicians[0],
  farm: farms[0].name,
  surface: farms[0].surface,
  visitType: visitTypes[0],
  visitDescription: '',
  previousCrop: previousCrops[0],
  previousTreatments: '',
  crop: farms[0].crop,
  sowingDate: '',
  irrigation: irrigationSystems[0],
  soilType: soilTypes[0],
  phenology: phenologyStates[0],
  generalState: '',
  growthState: '',
  weedToggle: false,
  weedDescription: '',
  pestsDiseases: '',
  damageDescription: '',
  fruitSize: '',
  kgPerHa: '',
  totalHarvest: '0',
  waterStatus: '',
  recommendFito: '',
  recommendNutrition: '',
  recommendIrrigation: '',
  finalNotes: '',
  photos: []
};

function formatDate(date) {
  return new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function generateCode(list) {
  const year = new Date().getFullYear();
  const next = (list.length + 1).toString().padStart(5, '0');
  return `VT-${year}-${next}`;
}

export default function Home() {
  const [visits, setVisits] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [view, setView] = useState('home');
  const [form, setForm] = useState(emptyForm);
  const [damageSelection, setDamageSelection] = useState(['Ninguno']);
  const [summaryVisit, setSummaryVisit] = useState(null);
  const [stepError, setStepError] = useState('');
  const photoInputRef = useRef(null);

  useEffect(() => {
    const stored = loadVisitsFromStorage();
    if (stored?.length) {
      setVisits(stored);
    } else {
      setVisits(sampleVisits);
      saveVisitsToStorage(sampleVisits);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => null);
    }
  }, []);

  useEffect(() => {
    const surface = parseFloat(form.surface) || 0;
    const kgPerHa = parseFloat(form.kgPerHa) || 0;
    setForm(prev => ({ ...prev, totalHarvest: (surface * kgPerHa).toFixed(1) }));
  }, [form.surface, form.kgPerHa]);

  function openForm() {
    setForm({
      ...emptyForm,
      code: generateCode(visits),
      date: new Date().toISOString().slice(0, 10),
    });
    setCurrentStep(0);
    setDamageSelection(['Ninguno']);
    setStepError('');
    setView('form');
  }

  function handleFieldChange(key, value) {
    if (key === 'farm') {
      const farm = farms.find(f => f.name === value);
      setForm(prev => ({
        ...prev,
        farm: value,
        ...(farm ? { surface: farm.surface, crop: farm.crop } : {})
      }));
    } else {
      setForm(prev => ({ ...prev, [key]: value }));
    }
  }

  function toggleDamage(option) {
    setDamageSelection(prev => {
      const next = prev.includes(option)
        ? prev.filter(item => item !== option)
        : [...prev.filter(item => item !== 'Ninguno'), option];
      return next.length ? next : ['Ninguno'];
    });
  }

  function handlePhoto(file) {
    if (!file) return;
    if (form.photos.length >= 10) {
      alert('Máximo 10 fotos por visita.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const photo = { dataUrl: reader.result, description: '', coords: null };
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          pos => {
            photo.coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
            setForm(prev => ({ ...prev, photos: [...prev.photos, photo] }));
          },
          () => setForm(prev => ({ ...prev, photos: [...prev.photos, photo] })),
          { timeout: 8000 }
        );
      } else {
        setForm(prev => ({ ...prev, photos: [...prev.photos, photo] }));
      }
    };
    reader.readAsDataURL(file);
  }

  function removePhoto(index) {
    setForm(prev => {
      const photos = [...prev.photos];
      photos.splice(index, 1);
      return { ...prev, photos };
    });
  }

  function validateStep(index) {
    const required = requiredFieldsByStep[index] || [];
    const missing = required.some(f => !form[f] || String(form[f]).trim() === '');
    if (missing) {
      setStepError('Completa los campos obligatorios (*) antes de continuar.');
      return false;
    }
    setStepError('');
    return true;
  }

  function handleNext() {
    if (validateStep(currentStep)) setCurrentStep(s => s + 1);
  }

  function handleBack() {
    setStepError('');
    setCurrentStep(s => s - 1);
  }

  function submitVisit() {
    if (!validateStep(currentStep)) return;
    const visit = {
      ...form,
      damageSelection,
      surface: parseFloat(form.surface) || 0,
      fruitSize: parseFloat(form.fruitSize) || 0,
      kgPerHa: parseFloat(form.kgPerHa) || 0,
      totalHarvest: parseFloat(form.totalHarvest) || 0
    };
    const next = [...visits, visit];
    setVisits(next);
    saveVisitsToStorage(next);
    setView('home');
  }

  function openSummary(code) {
    setSummaryVisit(visits.find(v => v.code === code));
    setView('summary');
  }

  function deleteVisit(code) {
    if (!confirm(`¿Eliminar la visita ${code}? Esta acción no se puede deshacer.`)) return;
    const next = visits.filter(v => v.code !== code);
    setVisits(next);
    saveVisitsToStorage(next);
  }

  return (
    <>
      <Head>
        <title>Visitas Técnicas Agrícolas</title>
        <meta name="description" content="PWA para registro de visitas técnicas agrícolas." />
        <meta name="theme-color" content="#2e6b2e" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="manifest" href="/manifest.json" />
      </Head>

      <div className="app">

        {/* ── App Bar ── */}
        <header className="app-bar">
          {view === 'home' && (
            <>
              <div className="app-bar-main">
                <div className="app-bar-title">Visitas de Campo</div>
              </div>
              <span className="count-pill">{visits.length}</span>
            </>
          )}
          {view === 'form' && (
            <>
              <button className="icon-btn" onClick={() => setView('home')} aria-label="Cancelar">←</button>
              <div className="app-bar-main">
                <div className="app-bar-title">Nueva visita</div>
                <div className="app-bar-sub">Paso {currentStep + 1}/{steps.length} · {steps[currentStep]}</div>
              </div>
            </>
          )}
          {view === 'summary' && summaryVisit && (
            <>
              <button className="icon-btn" onClick={() => setView('home')} aria-label="Volver">←</button>
              <div className="app-bar-main">
                <div className="app-bar-title">{summaryVisit.code}</div>
                <div className="app-bar-sub">{summaryVisit.farm} · {formatDate(summaryVisit.date)}</div>
              </div>
              <button className="icon-btn" onClick={() => window.print()} aria-label="Exportar PDF" title="Exportar PDF">⎙</button>
            </>
          )}
        </header>

        {/* ── Home View ── */}
        {view === 'home' && (
          <main className="content no-bot">
            {visits.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🌱</div>
                <p>No hay visitas registradas.</p>
                <small>Pulsa el botón + para comenzar.</small>
              </div>
            ) : (
              <div className="visit-list">
                {visits.slice().reverse().map(visit => (
                  <article key={visit.code} className="visit-card">
                    <div className="visit-card-tap" onClick={() => openSummary(visit.code)}>
                      <div className="vc-row">
                        <span className="vc-code">{visit.code}</span>
                        <span className="vc-date">{formatDate(visit.date)}</span>
                      </div>
                      <div className="vc-farm">{visit.farm} · {visit.surface} ha</div>
                      <div className="vc-tech">{visit.technician}</div>
                      <div className="vc-badges">
                        <span className="badge">{visitTypeShort[visit.visitType] || visit.visitType}</span>
                        {!visit.damageSelection.includes('Ninguno') && (
                          <span className="badge alert">⚠ Daños</span>
                        )}
                        {visit.photos?.length > 0 && (
                          <span className="badge">📷 {visit.photos.length}</span>
                        )}
                      </div>
                    </div>
                    <div className="visit-card-actions">
                      <button className="btn btn-danger btn-sm" onClick={() => deleteVisit(visit.code)}>Eliminar</button>
                      <button className="btn btn-primary btn-sm" onClick={() => openSummary(visit.code)}>Ver resumen →</button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </main>
        )}

        {/* ── Form View ── */}
        {view === 'form' && (
          <main className="content">

            {/* Step progress */}
            <div className="step-header">
              <div className="step-track">
                {steps.map((_, i) => (
                  <div key={i} className={`step-seg${i < currentStep ? ' done' : i === currentStep ? ' active' : ''}`} />
                ))}
              </div>
              <div className="step-meta">Paso {currentStep + 1} de {steps.length}</div>
              <div className="step-name">{steps[currentStep]}</div>
            </div>

            {/* Step 0: Identificación */}
            {currentStep === 0 && (
              <div className="form-grid">
                <div className="field">
                  <label>Código</label>
                  <input type="text" value={form.code} readOnly />
                </div>
                <div className="field">
                  <label className="req">Fecha de visita</label>
                  <input type="date" value={form.date} onChange={e => handleFieldChange('date', e.target.value)} />
                </div>
                <div className="field">
                  <label className="req">Técnico responsable</label>
                  <select value={form.technician} onChange={e => handleFieldChange('technician', e.target.value)}>
                    {technicians.map(name => <option key={name} value={name}>{name}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label className="req">Finca</label>
                  <select value={form.farm} onChange={e => handleFieldChange('farm', e.target.value)}>
                    {farms.map(f => (
                      <option key={f.name} value={f.name}>{f.name} — {f.location}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label className="req">Superficie (ha)</label>
                  <input type="number" step="0.1" min="0" value={form.surface} onChange={e => handleFieldChange('surface', e.target.value)} />
                </div>
              </div>
            )}

            {/* Step 1: Objeto y antecedentes */}
            {currentStep === 1 && (
              <div className="form-grid">
                <div className="field">
                  <label className="req">Tipo de visita</label>
                  <select value={form.visitType} onChange={e => handleFieldChange('visitType', e.target.value)}>
                    {visitTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label className="req">Descripción del objeto</label>
                  <textarea
                    value={form.visitDescription}
                    onChange={e => handleFieldChange('visitDescription', e.target.value)}
                    placeholder="Describe el motivo y alcance de la visita..."
                  />
                </div>
                <div className="field">
                  <label className="req">Cultivo anterior</label>
                  <select value={form.previousCrop} onChange={e => handleFieldChange('previousCrop', e.target.value)}>
                    {previousCrops.map(name => <option key={name} value={name}>{name}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Tratamientos previos</label>
                  <textarea
                    value={form.previousTreatments}
                    onChange={e => handleFieldChange('previousTreatments', e.target.value)}
                    placeholder="Fitosanitarios o fertilizantes anteriores..."
                  />
                </div>
              </div>
            )}

            {/* Step 2: Descripción explotación */}
            {currentStep === 2 && (
              <div className="form-grid">
                <div className="field">
                  <label className="req">Cultivo actual</label>
                  <input type="text" value={form.crop} onChange={e => handleFieldChange('crop', e.target.value)} />
                </div>
                <div className="field">
                  <label className="req">Fecha de siembra / plantación</label>
                  <input type="date" value={form.sowingDate} onChange={e => handleFieldChange('sowingDate', e.target.value)} />
                </div>
                <div className="field">
                  <label className="req">Sistema de riego</label>
                  <select value={form.irrigation} onChange={e => handleFieldChange('irrigation', e.target.value)}>
                    {irrigationSystems.map(item => <option key={item} value={item}>{item}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label className="req">Tipo de suelo</label>
                  <select value={form.soilType} onChange={e => handleFieldChange('soilType', e.target.value)}>
                    {soilTypes.map(item => <option key={item} value={item}>{item}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label className="req">Estado fenológico</label>
                  <select value={form.phenology} onChange={e => handleFieldChange('phenology', e.target.value)}>
                    {phenologyStates.map(item => <option key={item} value={item}>{item}</option>)}
                  </select>
                </div>
              </div>
            )}

            {/* Step 3: Observaciones de campo */}
            {currentStep === 3 && (
              <div className="form-grid">
                <div className="field">
                  <label className="req">Estado general del cultivo</label>
                  <textarea
                    value={form.generalState}
                    onChange={e => handleFieldChange('generalState', e.target.value)}
                    placeholder="Describe el estado general observado..."
                  />
                </div>
                <div className="field">
                  <label className="req">Desarrollo vegetativo</label>
                  <textarea
                    value={form.growthState}
                    onChange={e => handleFieldChange('growthState', e.target.value)}
                    placeholder="Estado de la vegetación, brotes, hojas..."
                  />
                </div>
                <div className="field">
                  <label>Malas hierbas</label>
                  <label className="toggle-field" htmlFor="weedToggle">
                    <span>Presencia de malas hierbas</span>
                    <input
                      id="weedToggle"
                      type="checkbox"
                      checked={form.weedToggle}
                      onChange={e => handleFieldChange('weedToggle', e.target.checked)}
                    />
                  </label>
                  {form.weedToggle && (
                    <textarea
                      value={form.weedDescription}
                      onChange={e => handleFieldChange('weedDescription', e.target.value)}
                      placeholder="Especies, densidad, distribución..."
                      style={{ marginTop: '.4rem' }}
                    />
                  )}
                </div>
                <div className="field">
                  <label>Plagas y enfermedades</label>
                  <textarea
                    value={form.pestsDiseases}
                    onChange={e => handleFieldChange('pestsDiseases', e.target.value)}
                    placeholder="Organismos identificados, síntomas, incidencia..."
                  />
                </div>
                <div className="field">
                  <label>Tipo de daño meteorológico</label>
                  <div className="chips">
                    {damageOptions.map(option => (
                      <button
                        key={option}
                        type="button"
                        className={`chip${damageSelection.includes(option) ? ' selected' : ''}`}
                        onClick={() => toggleDamage(option)}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
                {!damageSelection.includes('Ninguno') && (
                  <div className="field">
                    <label>Descripción de daños</label>
                    <textarea
                      value={form.damageDescription}
                      onChange={e => handleFieldChange('damageDescription', e.target.value)}
                      placeholder="Extensión y gravedad de los daños..."
                    />
                  </div>
                )}
                <div className="inline-2">
                  <div className="field">
                    <label>Calibre (mm)</label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={form.fruitSize}
                      onChange={e => handleFieldChange('fruitSize', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div className="field">
                    <label>Kg est. / ha</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={form.kgPerHa}
                      onChange={e => handleFieldChange('kgPerHa', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="field">
                  <label>Cosecha total estimada (kg)</label>
                  <input type="text" value={form.totalHarvest} readOnly />
                  <span className="field-hint">{form.surface} ha × {form.kgPerHa || 0} kg/ha</span>
                </div>
                <div className="field">
                  <label>Estado hídrico</label>
                  <textarea
                    value={form.waterStatus}
                    onChange={e => handleFieldChange('waterStatus', e.target.value)}
                    placeholder="Humedad del suelo, estado del riego..."
                  />
                </div>
              </div>
            )}

            {/* Step 4: Recomendaciones y fotos */}
            {currentStep === 4 && (
              <div className="form-grid">
                <div className="field">
                  <label>Recomendaciones fitosanitarias</label>
                  <textarea
                    value={form.recommendFito}
                    onChange={e => handleFieldChange('recommendFito', e.target.value)}
                    placeholder="Tratamientos, productos, dosis..."
                  />
                </div>
                <div className="field">
                  <label>Recomendaciones nutricionales</label>
                  <textarea
                    value={form.recommendNutrition}
                    onChange={e => handleFieldChange('recommendNutrition', e.target.value)}
                    placeholder="Abonado, correcciones, micronutrientes..."
                  />
                </div>
                <div className="field">
                  <label>Recomendaciones de riego</label>
                  <textarea
                    value={form.recommendIrrigation}
                    onChange={e => handleFieldChange('recommendIrrigation', e.target.value)}
                    placeholder="Dosis, frecuencia, ajustes..."
                  />
                </div>
                <div className="field">
                  <label>Observaciones finales</label>
                  <textarea
                    value={form.finalNotes}
                    onChange={e => handleFieldChange('finalNotes', e.target.value)}
                    placeholder="Cualquier nota adicional relevante..."
                  />
                </div>
                <div className="field">
                  <label>Fotos ({form.photos.length}/10)</label>
                  {form.photos.length < 10 && (
                    <>
                      <button
                        type="button"
                        className="photo-add-btn"
                        onClick={() => photoInputRef.current?.click()}
                      >
                        📷 Añadir foto
                      </button>
                      <input
                        ref={photoInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        style={{ display: 'none' }}
                        onChange={e => { handlePhoto(e.target.files?.[0]); e.target.value = ''; }}
                      />
                    </>
                  )}
                  {form.photos.length > 0 && (
                    <div className="photo-grid">
                      {form.photos.map((photo, i) => (
                        <div key={i} className="photo-thumb">
                          <img src={photo.dataUrl} alt={`Foto ${i + 1}`} />
                          <button
                            type="button"
                            className="photo-del"
                            onClick={() => removePhoto(i)}
                            aria-label="Eliminar foto"
                          >×</button>
                        </div>
                      ))}
                    </div>
                  )}
                  {form.photos.length > 0 && (
                    <span className="field-hint">Se capturan coordenadas GPS si están disponibles.</span>
                  )}
                </div>
              </div>
            )}

            {stepError && <div className="form-error">{stepError}</div>}
          </main>
        )}

        {/* ── Summary View ── */}
        {view === 'summary' && summaryVisit && (
          <main className="content no-bot">

            <div className="summary-section">
              <div className="ss-header"><span className="ss-icon">🪪</span> Identificación</div>
              <div className="ss-body">
                <div className="ss-grid-2">
                  <div className="ss-row">
                    <div className="ss-label">Código</div>
                    <div className="ss-value">{summaryVisit.code}</div>
                  </div>
                  <div className="ss-row">
                    <div className="ss-label">Fecha</div>
                    <div className="ss-value">{formatDate(summaryVisit.date)}</div>
                  </div>
                </div>
                <div className="ss-row">
                  <div className="ss-label">Técnico</div>
                  <div className="ss-value">{summaryVisit.technician}</div>
                </div>
                <div className="ss-grid-2">
                  <div className="ss-row">
                    <div className="ss-label">Finca</div>
                    <div className="ss-value">{summaryVisit.farm}</div>
                  </div>
                  <div className="ss-row">
                    <div className="ss-label">Superficie</div>
                    <div className="ss-value">{summaryVisit.surface} ha</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="summary-section">
              <div className="ss-header"><span className="ss-icon">📋</span> Objeto y antecedentes</div>
              <div className="ss-body">
                <div className="ss-row">
                  <div className="ss-label">Tipo de visita</div>
                  <div className="ss-value">{summaryVisit.visitType}</div>
                </div>
                <div className="ss-row">
                  <div className="ss-label">Descripción</div>
                  <div className="ss-value">{summaryVisit.visitDescription}</div>
                </div>
                <div className="ss-row">
                  <div className="ss-label">Cultivo anterior</div>
                  <div className="ss-value">{summaryVisit.previousCrop}</div>
                </div>
                {summaryVisit.previousTreatments && (
                  <div className="ss-row">
                    <div className="ss-label">Tratamientos previos</div>
                    <div className="ss-value">{summaryVisit.previousTreatments}</div>
                  </div>
                )}
              </div>
            </div>

            <div className="summary-section">
              <div className="ss-header"><span className="ss-icon">🌾</span> Descripción explotación</div>
              <div className="ss-body">
                <div className="ss-grid-2">
                  <div className="ss-row">
                    <div className="ss-label">Cultivo</div>
                    <div className="ss-value">{summaryVisit.crop}</div>
                  </div>
                  <div className="ss-row">
                    <div className="ss-label">Fecha siembra</div>
                    <div className="ss-value">{formatDate(summaryVisit.sowingDate)}</div>
                  </div>
                  <div className="ss-row">
                    <div className="ss-label">Riego</div>
                    <div className="ss-value">{summaryVisit.irrigation}</div>
                  </div>
                  <div className="ss-row">
                    <div className="ss-label">Suelo</div>
                    <div className="ss-value">{summaryVisit.soilType}</div>
                  </div>
                </div>
                <div className="ss-row">
                  <div className="ss-label">Estado fenológico</div>
                  <div className="ss-value">{summaryVisit.phenology}</div>
                </div>
              </div>
            </div>

            <div className="summary-section">
              <div className="ss-header"><span className="ss-icon">🔍</span> Observaciones de campo</div>
              <div className="ss-body">
                <div className="ss-row">
                  <div className="ss-label">Estado general</div>
                  <div className="ss-value">{summaryVisit.generalState}</div>
                </div>
                <div className="ss-row">
                  <div className="ss-label">Desarrollo vegetativo</div>
                  <div className="ss-value">{summaryVisit.growthState}</div>
                </div>
                <div className="ss-row">
                  <div className="ss-label">Malas hierbas</div>
                  <div className="ss-value">
                    {summaryVisit.weedToggle
                      ? (summaryVisit.weedDescription || 'Sí — sin descripción')
                      : 'No'}
                  </div>
                </div>
                {summaryVisit.pestsDiseases && (
                  <div className="ss-row">
                    <div className="ss-label">Plagas / enfermedades</div>
                    <div className="ss-value">{summaryVisit.pestsDiseases}</div>
                  </div>
                )}
                <div className="ss-row">
                  <div className="ss-label">Daños meteorológicos</div>
                  <div className="ss-value">{summaryVisit.damageSelection.join(', ')}</div>
                </div>
                {summaryVisit.damageDescription && !summaryVisit.damageSelection.includes('Ninguno') && (
                  <div className="ss-row">
                    <div className="ss-label">Descripción daños</div>
                    <div className="ss-value">{summaryVisit.damageDescription}</div>
                  </div>
                )}
                {summaryVisit.kgPerHa > 0 && (
                  <div className="ss-grid-2">
                    {summaryVisit.fruitSize > 0 && (
                      <div className="ss-row">
                        <div className="ss-label">Calibre</div>
                        <div className="ss-value">{summaryVisit.fruitSize} mm</div>
                      </div>
                    )}
                    <div className="ss-row">
                      <div className="ss-label">Kg / ha</div>
                      <div className="ss-value">{summaryVisit.kgPerHa.toLocaleString()}</div>
                    </div>
                    <div className="ss-row">
                      <div className="ss-label">Cosecha total</div>
                      <div className="ss-value">{Number(summaryVisit.totalHarvest).toLocaleString()} kg</div>
                    </div>
                  </div>
                )}
                {summaryVisit.waterStatus && (
                  <div className="ss-row">
                    <div className="ss-label">Estado hídrico</div>
                    <div className="ss-value">{summaryVisit.waterStatus}</div>
                  </div>
                )}
              </div>
            </div>

            <div className="summary-section">
              <div className="ss-header"><span className="ss-icon">💡</span> Recomendaciones</div>
              <div className="ss-body">
                {summaryVisit.recommendFito ? (
                  <div className="ss-row">
                    <div className="ss-label">Fitosanitarios</div>
                    <div className="ss-value">{summaryVisit.recommendFito}</div>
                  </div>
                ) : null}
                {summaryVisit.recommendNutrition ? (
                  <div className="ss-row">
                    <div className="ss-label">Nutricionales</div>
                    <div className="ss-value">{summaryVisit.recommendNutrition}</div>
                  </div>
                ) : null}
                {summaryVisit.recommendIrrigation ? (
                  <div className="ss-row">
                    <div className="ss-label">Riego</div>
                    <div className="ss-value">{summaryVisit.recommendIrrigation}</div>
                  </div>
                ) : null}
                {summaryVisit.finalNotes ? (
                  <div className="ss-row">
                    <div className="ss-label">Observaciones finales</div>
                    <div className="ss-value">{summaryVisit.finalNotes}</div>
                  </div>
                ) : null}
                {!summaryVisit.recommendFito && !summaryVisit.recommendNutrition && !summaryVisit.recommendIrrigation && !summaryVisit.finalNotes && (
                  <div className="ss-row">
                    <div className="ss-value" style={{ color: 'var(--muted)' }}>Sin recomendaciones registradas.</div>
                  </div>
                )}
              </div>
            </div>

            {summaryVisit.photos?.length > 0 && (
              <div className="summary-section">
                <div className="ss-header"><span className="ss-icon">📷</span> Fotos ({summaryVisit.photos.length})</div>
                <div className="ss-body">
                  <div className="photo-grid">
                    {summaryVisit.photos.map((photo, i) => (
                      <div key={i} className="photo-thumb">
                        <img src={photo.dataUrl} alt={`Foto ${i + 1}`} />
                      </div>
                    ))}
                  </div>
                  {summaryVisit.photos.map((photo, i) =>
                    photo.description || photo.coords ? (
                      <div key={i} className="ss-row" style={{ marginTop: '.25rem' }}>
                        <div className="ss-label">Foto {i + 1}</div>
                        <div className="ss-value">
                          {photo.description && <span>{photo.description}</span>}
                          {photo.coords && (
                            <span style={{ display: 'block', fontSize: '.8rem', color: 'var(--muted)', marginTop: '.1rem' }}>
                              {photo.coords.latitude.toFixed(5)}, {photo.coords.longitude.toFixed(5)}
                            </span>
                          )}
                        </div>
                      </div>
                    ) : null
                  )}
                </div>
              </div>
            )}
          </main>
        )}

        {/* ── FAB (home only) ── */}
        {view === 'home' && (
          <button className="fab" onClick={openForm} aria-label="Nueva visita">+</button>
        )}

        {/* ── Bottom Bar (form only) ── */}
        {view === 'form' && (
          <div className="bottom-bar">
            <button className="btn btn-ghost" onClick={() => setView('home')}>Cancelar</button>
            <div className="spacer" />
            {currentStep > 0 && (
              <button className="btn btn-ghost" onClick={handleBack}>← Anterior</button>
            )}
            {currentStep < steps.length - 1 ? (
              <button className="btn btn-primary" onClick={handleNext}>Siguiente →</button>
            ) : (
              <button className="btn btn-primary" onClick={submitVisit}>Guardar ✓</button>
            )}
          </div>
        )}

      </div>
    </>
  );
}
