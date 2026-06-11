import Head from 'next/head';
import { useEffect, useMemo, useState } from 'react';
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

export default function Home() {
  const [visits, setVisits] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [view, setView] = useState('home');
  const [form, setForm] = useState({
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
  });
  const [damageSelection, setDamageSelection] = useState(['Ninguno']);
  const [summaryVisit, setSummaryVisit] = useState(null);

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
    if (view === 'form') {
      setForm(prev => ({
        ...prev,
        code: generateCode(visits),
        date: new Date().toISOString().slice(0, 10),
        technician: technicians[0],
        farm: farms[0].name,
        surface: farms[0].surface,
        crop: farms[0].crop,
        visitType: visitTypes[0],
        previousCrop: previousCrops[0],
        irrigation: irrigationSystems[0],
        soilType: soilTypes[0],
        phenology: phenologyStates[0],
        totalHarvest: '0',
        photos: []
      }));
      setCurrentStep(0);
      setDamageSelection(['Ninguno']);
    }
  }, [view, visits]);

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

  const countLabel = useMemo(() => `${visits.length} visita${visits.length === 1 ? '' : 's'} registradas`, [visits.length]);

  const renderList = () => visits.slice().reverse().map(visit => (
    <article key={visit.code} className="visit-card">
      <header>
        <div>
          <h2>{visit.code} · {formatDate(visit.date)}</h2>
          <p>{visit.farm} · {visit.technician}</p>
        </div>
        <span className="badge">{visit.visitType}</span>
      </header>
      <div className="detail-grid">
        <div><strong>Finca</strong><p>{visit.farm}</p></div>
        <div><strong>Técnico</strong><p>{visit.technician}</p></div>
        <div><strong>Tipo</strong><p>{visit.visitType}</p></div>
        <div><strong>Estado</strong><p>{visit.damageSelection.includes('Ninguno') ? 'Sin daños relevantes' : 'Requiere seguimiento'}</p></div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '.75rem' }}>
        <button type="button" className="button secondary" onClick={() => openSummary(visit.code)}>Ver resumen</button>
      </div>
    </article>
  ));

  function generateCode(list) {
    const year = new Date().getFullYear();
    const next = (list.length + 1).toString().padStart(5, '0');
    return `VT-${year}-${next}`;
  }

  function formatDate(date) {
    return new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  function handleFieldChange(key, value) {
    setForm(prev => ({ ...prev, [key]: value }));
    if (key === 'farm') {
      const farm = farms.find(item => item.name === value);
      if (farm) {
        setForm(prev => ({ ...prev, surface: farm.surface, crop: farm.crop }));
      }
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
        navigator.geolocation.getCurrentPosition(position => {
          photo.coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          setForm(prev => ({ ...prev, photos: [...prev.photos, photo] }));
        }, () => setForm(prev => ({ ...prev, photos: [...prev.photos, photo] })), { timeout: 8000 });
      } else {
        setForm(prev => ({ ...prev, photos: [...prev.photos, photo] }));
      }
    };
    reader.readAsDataURL(file);
  }

  function updatePhotoDescription(index, description) {
    setForm(prev => {
      const photos = [...prev.photos];
      photos[index] = { ...photos[index], description };
      return { ...prev, photos };
    });
  }

  function removePhoto(index) {
    setForm(prev => {
      const photos = [...prev.photos];
      photos.splice(index, 1);
      return { ...prev, photos };
    });
  }

  function canNavigateStep(index) {
    return index <= currentStep;
  }

  function validateStep(index) {
    const required = requiredFieldsByStep[index] || [];
    let valid = true;
    required.forEach(field => {
      if (!form[field] || String(form[field]).trim() === '') {
        valid = false;
      }
    });
    if (!valid) {
      alert('Completa todos los campos obligatorios del paso actual antes de avanzar.');
    }
    return valid;
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
    const nextVisits = [...visits, visit];
    setVisits(nextVisits);
    saveVisitsToStorage(nextVisits);
    setView('home');
  }

  function openSummary(code) {
    const visit = visits.find(item => item.code === code);
    setSummaryVisit(visit);
    setView('summary');
  }

  return (
    <>
      <Head>
        <title>Visitas Técnicas Agrícolas</title>
        <meta name="description" content="Prototipo PWA para registro de visitas técnicas agrícolas." />
        <meta name="theme-color" content="#2e6b2e" />
        <link rel="manifest" href="/manifest.json" />
      </Head>
      <div className="app">
        <header>
          <div>
            <h1>Visitas Técnicas Agrícolas</h1>
            <p className="meta">Registro offline para visitas de campo con persistencia local.</p>
          </div>
          <button className="button" type="button" onClick={() => setView('form')}>Nueva Visita</button>
        </header>

        {view === 'home' && (
          <section id="homeView" className="card">
            <div className="hero">
              <h2>Resumen de visitas guardadas</h2>
              <p>Registra y revisa visitas técnicas agrarias con detalles, fotos y recomendaciones. El contenido se guarda localmente en el navegador.</p>
            </div>
            <div className="list-toolbar">
              <span>{countLabel}</span>
              <button type="button" className="button secondary" onClick={() => setVisits(loadVisitsFromStorage() || sampleVisits)}>Refrescar lista</button>
            </div>
            <div className="visit-list">{renderList()}</div>
            {!visits.length && <p style={{ color: 'var(--muted)' }}>No hay visitas guardadas. Comienza con "Nueva Visita".</p>}
          </section>
        )}

        {view === 'form' && (
          <section id="formView" className="card">
            <div className="progress-bar" aria-hidden="true"><span className="progress-fill" style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }} /></div>
            <div className="wizard-body">
              <aside className="navigation-panel hidden-print">
                <div className="steps">
                  {steps.map((title, index) => (
                    <button key={title} type="button" className={`step-pill ${currentStep === index ? 'active' : ''}`} onClick={() => canNavigateStep(index) && setCurrentStep(index)}>
                      {index + 1}. {title}
                    </button>
                  ))}
                </div>
              </aside>
              <div>
                {currentStep === 0 && (
                  <div className="detail-grid">
                    <div className="field"><label className="req">Código</label><input type="text" value={form.code} readOnly /></div>
                    <div className="field"><label className="req">Fecha</label><input type="date" value={form.date} onChange={e => handleFieldChange('date', e.target.value)} required /></div>
                    <div className="field"><label className="req">Técnico</label><select value={form.technician} onChange={e => handleFieldChange('technician', e.target.value)} required>{technicians.map(name => <option key={name} value={name}>{name}</option>)}</select></div>
                    <div className="field"><label className="req">Finca</label><select value={form.farm} onChange={e => handleFieldChange('farm', e.target.value)} required>{farms.map(farm => <option key={farm.name} value={farm.name}>{farm.name} ({farm.crop})</option>)}</select></div>
                    <div className="field"><label className="req">Superficie (ha)</label><input type="number" step="0.1" value={form.surface} onChange={e => handleFieldChange('surface', e.target.value)} required /></div>
                  </div>
                )}
                {currentStep === 1 && (
                  <div className="detail-grid">
                    <div className="field"><label className="req">Tipo de visita</label><select value={form.visitType} onChange={e => handleFieldChange('visitType', e.target.value)} required>{visitTypes.map(type => <option key={type} value={type}>{type}</option>)}</select></div>
                    <div className="field"><label className="req">Descripción libre</label><textarea value={form.visitDescription} onChange={e => handleFieldChange('visitDescription', e.target.value)} required /></div>
                    <div className="field"><label className="req">Cultivo anterior</label><select value={form.previousCrop} onChange={e => handleFieldChange('previousCrop', e.target.value)} required>{previousCrops.map(name => <option key={name} value={name}>{name}</option>)}</select></div>
                    <div className="field"><label>Tratamientos previos</label><textarea value={form.previousTreatments} onChange={e => handleFieldChange('previousTreatments', e.target.value)} /></div>
                  </div>
                )}
                {currentStep === 2 && (
                  <div className="detail-grid">
                    <div className="field"><label className="req">Cultivo</label><input type="text" value={form.crop} onChange={e => handleFieldChange('crop', e.target.value)} required /></div>
                    <div className="field"><label className="req">Fecha de siembra</label><input type="date" value={form.sowingDate} onChange={e => handleFieldChange('sowingDate', e.target.value)} required /></div>
                    <div className="field"><label className="req">Sistema de riego</label><select value={form.irrigation} onChange={e => handleFieldChange('irrigation', e.target.value)} required>{irrigationSystems.map(item => <option key={item} value={item}>{item}</option>)}</select></div>
                    <div className="field"><label className="req">Tipo de suelo</label><select value={form.soilType} onChange={e => handleFieldChange('soilType', e.target.value)} required>{soilTypes.map(item => <option key={item} value={item}>{item}</option>)}</select></div>
                    <div className="field"><label className="req">Estado fenológico</label><select value={form.phenology} onChange={e => handleFieldChange('phenology', e.target.value)} required>{phenologyStates.map(item => <option key={item} value={item}>{item}</option>)}</select></div>
                  </div>
                )}
                {currentStep === 3 && (
                  <div className="detail-grid">
                    <div className="field"><label className="req">Estado general</label><textarea value={form.generalState} onChange={e => handleFieldChange('generalState', e.target.value)} required /></div>
                    <div className="field"><label className="req">Desarrollo vegetativo</label><textarea value={form.growthState} onChange={e => handleFieldChange('growthState', e.target.value)} required /></div>
                    <div className="field"><label>Presencia de malas hierbas</label><div><label style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem' }}><input type="checkbox" checked={form.weedToggle} onChange={e => handleFieldChange('weedToggle', e.target.checked)} /> Sí</label></div></div>
                    {form.weedToggle && <div className="field"><label>Descripción de malas hierbas</label><textarea value={form.weedDescription} onChange={e => handleFieldChange('weedDescription', e.target.value)} /></div>}
                    <div className="field"><label>Plagas / enfermedades</label><textarea value={form.pestsDiseases} onChange={e => handleFieldChange('pestsDiseases', e.target.value)} /></div>
                    <div className="field"><label>Tipo de daño</label><div className="chips">{damageOptions.map(option => <button key={option} type="button" className={`chip ${damageSelection.includes(option) ? 'selected' : ''}`} onClick={() => toggleDamage(option)}>{option}</button>)}</div></div>
                    <div className="field"><label>Descripción daños</label><textarea value={form.damageDescription} onChange={e => handleFieldChange('damageDescription', e.target.value)} /></div>
                    <div className="field"><label>Calibre frutos (mm)</label><input type="number" step="1" value={form.fruitSize} onChange={e => handleFieldChange('fruitSize', e.target.value)} /></div>
                    <div className="field"><label>Kg estimados/ha</label><input type="number" step="0.1" value={form.kgPerHa} onChange={e => handleFieldChange('kgPerHa', e.target.value)} /></div>
                    <div className="field"><label>Cosecha total estimada (kg)</label><input type="text" value={form.totalHarvest} readOnly /></div>
                    <div className="field"><label>Estado hídrico</label><textarea value={form.waterStatus} onChange={e => handleFieldChange('waterStatus', e.target.value)} /></div>
                  </div>
                )}
                {currentStep === 4 && (
                  <div>
                    <div className="detail-grid">
                      <div className="field"><label>Recomendaciones fitosanitarias</label><textarea value={form.recommendFito} onChange={e => handleFieldChange('recommendFito', e.target.value)} /></div>
                      <div className="field"><label>Recomendaciones nutricionales</label><textarea value={form.recommendNutrition} onChange={e => handleFieldChange('recommendNutrition', e.target.value)} /></div>
                      <div className="field"><label>Recomendaciones de riego</label><textarea value={form.recommendIrrigation} onChange={e => handleFieldChange('recommendIrrigation', e.target.value)} /></div>
                      <div className="field"><label>Observaciones finales</label><textarea value={form.finalNotes} onChange={e => handleFieldChange('finalNotes', e.target.value)} /></div>
                    </div>
                    <div className="field">
                      <label>Añadir foto</label>
                      <input type="file" accept="image/*" capture="environment" onChange={e => handlePhoto(e.target.files?.[0])} />
                      <small>Máximo 10 fotos. Cada foto captura coordenadas si están disponibles.</small>
                    </div>
                    <div className="photo-list">{form.photos.map((photo, index) => (
                      <div key={index} className="photo-card">
                        <img src={photo.dataUrl} alt={`Foto ${index + 1}`} />
                        <div className="field"><label>Descripción de foto</label><textarea value={photo.description} onChange={e => updatePhotoDescription(index, e.target.value)} /></div>
                        <div><strong>Coordenadas</strong><p>{photo.coords ? `${photo.coords.latitude.toFixed(5)}, ${photo.coords.longitude.toFixed(5)}` : 'No disponible'}</p></div>
                        <button type="button" className="button secondary" onClick={() => removePhoto(index)}>Eliminar foto</button>
                      </div>
                    ))}</div>
                  </div>
                )}
                <div className="step-nav hidden-print">
                  <button type="button" className="button secondary" onClick={() => setView('home')}>Cancelar</button>
                  <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
                    <button type="button" className="button secondary" onClick={() => setCurrentStep(Math.max(currentStep - 1, 0))} disabled={currentStep === 0}>Anterior</button>
                    {currentStep < steps.length - 1 ? (
                      <button type="button" className="button" onClick={() => validateStep(currentStep) && setCurrentStep(currentStep + 1)}>Siguiente</button>
                    ) : (
                      <button type="button" className="button" onClick={submitVisit}>Guardar visita</button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {view === 'summary' && summaryVisit && (
          <section id="summaryView" className="card">
            <div className="list-toolbar hidden-print">
              <button type="button" className="button secondary" onClick={() => setView('home')}>Cerrar</button>
              <button type="button" className="button" onClick={() => window.print()}>Exportar PDF</button>
            </div>
            <div id="summaryContent">
              <section className="summary-section"><h3>Identificación</h3><div className="summary-grid">
                <div><strong>Código</strong><p>{summaryVisit.code}</p></div>
                <div><strong>Fecha</strong><p>{formatDate(summaryVisit.date)}</p></div>
                <div><strong>Técnico</strong><p>{summaryVisit.technician}</p></div>
                <div><strong>Finca</strong><p>{summaryVisit.farm}</p></div>
                <div><strong>Superficie</strong><p>{summaryVisit.surface} ha</p></div>
              </div></section>
              <section className="summary-section"><h3>Objeto y antecedentes</h3><div className="summary-grid">
                <div><strong>Tipo de visita</strong><p>{summaryVisit.visitType}</p></div>
                <div style={{ gridColumn: '1 / -1' }}><strong>Descripción</strong><p>{summaryVisit.visitDescription}</p></div>
                <div><strong>Cultivo anterior</strong><p>{summaryVisit.previousCrop}</p></div>
                <div style={{ gridColumn: '1 / -1' }}><strong>Tratamientos previos</strong><p>{summaryVisit.previousTreatments || 'Ninguno'}</p></div>
              </div></section>
              <section className="summary-section"><h3>Descripción explotación</h3><div className="summary-grid">
                <div><strong>Cultivo</strong><p>{summaryVisit.crop}</p></div>
                <div><strong>Fecha siembra</strong><p>{formatDate(summaryVisit.sowingDate)}</p></div>
                <div><strong>Riego</strong><p>{summaryVisit.irrigation}</p></div>
                <div><strong>Suelo</strong><p>{summaryVisit.soilType}</p></div>
                <div><strong>Fenológico</strong><p>{summaryVisit.phenology}</p></div>
              </div></section>
              <section className="summary-section"><h3>Observaciones de campo</h3><div className="summary-grid">
                <div style={{ gridColumn: '1 / -1' }}><strong>Estado general</strong><p>{summaryVisit.generalState}</p></div>
                <div style={{ gridColumn: '1 / -1' }}><strong>Desarrollo vegetativo</strong><p>{summaryVisit.growthState}</p></div>
                <div style={{ gridColumn: '1 / -1' }}><strong>Presencia de malas hierbas</strong><p>{summaryVisit.weedToggle ? 'Sí' : 'No'}</p></div>
                {summaryVisit.weedToggle && <div style={{ gridColumn: '1 / -1' }}><strong>Detalle malas hierbas</strong><p>{summaryVisit.weedDescription}</p></div>}
                <div style={{ gridColumn: '1 / -1' }}><strong>Plagas / enfermedades</strong><p>{summaryVisit.pestsDiseases}</p></div>
                <div><strong>Daños</strong><p>{summaryVisit.damageSelection.join(', ')}</p></div>
                <div style={{ gridColumn: '1 / -1' }}><strong>Descripción daños</strong><p>{summaryVisit.damageDescription}</p></div>
                <div><strong>Calibre frutos</strong><p>{summaryVisit.fruitSize} mm</p></div>
                <div><strong>Kg estimados/ha</strong><p>{summaryVisit.kgPerHa}</p></div>
                <div><strong>Cosecha total</strong><p>{summaryVisit.totalHarvest} kg</p></div>
                <div style={{ gridColumn: '1 / -1' }}><strong>Estado hídrico</strong><p>{summaryVisit.waterStatus}</p></div>
              </div></section>
              <section className="summary-section"><h3>Recomendaciones</h3><div className="summary-grid">
                <div style={{ gridColumn: '1 / -1' }}><strong>Fitosanitarios</strong><p>{summaryVisit.recommendFito}</p></div>
                <div style={{ gridColumn: '1 / -1' }}><strong>Nutricionales</strong><p>{summaryVisit.recommendNutrition}</p></div>
                <div style={{ gridColumn: '1 / -1' }}><strong>Riego</strong><p>{summaryVisit.recommendIrrigation}</p></div>
                <div style={{ gridColumn: '1 / -1' }}><strong>Observaciones finales</strong><p>{summaryVisit.finalNotes}</p></div>
              </div></section>
              {summaryVisit.photos?.length > 0 && (
                <section className="summary-section"><h3>Fotos y geoposición</h3>{summaryVisit.photos.map((photo, index) => (
                  <div key={index} className="photo-card">
                    <img src={photo.dataUrl} alt={`Foto ${index + 1}`} />
                    <div><strong>Descripción</strong><p>{photo.description || 'Sin descripción'}</p></div>
                    <div><strong>Coordenadas</strong><p>{photo.coords ? `${photo.coords.latitude.toFixed(5)}, ${photo.coords.longitude.toFixed(5)}` : 'No disponible'}</p></div>
                  </div>
                ))}</section>
              )}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
