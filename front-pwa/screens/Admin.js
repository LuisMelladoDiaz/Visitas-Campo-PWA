import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const SEV_LABEL = { 0: 'Leve', 1: 'Grave', 2: 'Elim.' };
const SEV_CSS   = { 0: 'badge-neutral', 1: 'badge-warn', 2: 'badge-danger' };

const TABS = [
  { id: 'grupos',     label: 'Grupos conf.' },
  { id: 'variedades', label: 'Variedades'   },
  { id: 'tipos',      label: 'Tipos conf.'  },
  { id: 'clases',     label: 'Clases CVU'   },
  { id: 'def-cvu',    label: 'Defectos CVU' },
  { id: 'umbrales',   label: 'Umbrales PCC' },
  { id: 'def-pcc',    label: 'Defectos PCC' },
  { id: 'general',    label: 'General'      },
];

// ─── Reusable table ──────────────────────────────────────────────────────────

function BcTable({ columns, rows }) {
  if (!rows?.length) return <p className="admin-empty">Sin datos — pulsa "Descargar datos BC" para sincronizar.</p>;
  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>{columns.map(c => <th key={c.key}>{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {columns.map(c => (
                <td key={c.key}>
                  {c.render ? c.render(r[c.key], r) : (r[c.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BoolBadge({ v, trueClass = 'badge-ok' }) {
  return v
    ? <span className={`badge ${trueClass}`}>Sí</span>
    : <span className="badge badge-neutral">No</span>;
}

function PctCell({ v }) {
  return v != null ? <>{v} %</> : '—';
}

// ─── Tab views ───────────────────────────────────────────────────────────────

function TabGrupos({ rows }) {
  return (
    <BcTable rows={rows} columns={[
      { key: 'cod_gru_conf', label: 'Código' },
      { key: 'des_gru_conf', label: 'Descripción' },
      { key: 'tiene_cvu',    label: 'CVU', render: v => <BoolBadge v={v} /> },
      { key: 'tiene_pcc',    label: 'PCC', render: v => <BoolBadge v={v} /> },
    ]} />
  );
}

function TabVariedades({ rows }) {
  return (
    <BcTable rows={rows} columns={[
      { key: 'c_varied',     label: 'Código'      },
      { key: 'd_varied',     label: 'Descripción' },
      { key: 'cod_gru_conf', label: 'Grupo'       },
    ]} />
  );
}

function TabTipos({ rows }) {
  return (
    <BcTable rows={rows} columns={[
      { key: 'c_t_conf',     label: 'Código' },
      { key: 'd_t_conf',     label: 'Descripción' },
      { key: 'cod_gru_conf', label: 'Grupo' },
      { key: 'peso_ref_g',   label: 'Peso ref. (g)', render: v => v != null ? v.toLocaleString('es-ES') : '—' },
      { key: 'n_muestras',   label: 'Nº muestras' },
    ]} />
  );
}

function TabClases({ rows }) {
  return (
    <BcTable rows={rows} columns={[
      { key: 'cod_gru_conf',   label: 'Grupo' },
      { key: 'nombre',         label: 'Clase' },
      { key: 'max_pct_elim',   label: 'Elim. %',   render: v => <PctCell v={v} /> },
      { key: 'max_pct_graves', label: 'Graves %',   render: v => <PctCell v={v} /> },
      { key: 'max_pct_total',  label: 'Total %',    render: v => <PctCell v={v} /> },
      { key: 'max_pct_calibre',label: 'Calibre %',  render: v => <PctCell v={v} /> },
    ]} />
  );
}

function TabDefCvu({ rows }) {
  return (
    <BcTable rows={rows} columns={[
      { key: 'cod_gru_conf', label: 'Grupo' },
      { key: 'severidad',    label: 'Severidad', render: v => <span className={`badge ${SEV_CSS[v] ?? 'badge-neutral'}`}>{SEV_LABEL[v] ?? v}</span> },
      { key: 'clave',        label: 'Clave'      },
      { key: 'etiqueta',     label: 'Etiqueta'   },
      { key: 'valor_ok',     label: 'Valor OK'   },
      { key: 'activo',       label: 'Activo', render: v => <BoolBadge v={v} /> },
    ]} />
  );
}

function TabUmbrales({ rows }) {
  return (
    <BcTable rows={rows} columns={[
      { key: 'cod_gru_conf',    label: 'Grupo' },
      { key: 'max_defectos_pct',label: 'Máx. defectos %', render: v => <PctCell v={v} /> },
      { key: 'min_brix',        label: 'Mín. Brix',       render: v => v != null ? v : '—' },
      { key: 'max_calibre_pct', label: 'Máx. calibre %',  render: v => <PctCell v={v} /> },
    ]} />
  );
}

function TabDefPcc({ rows }) {
  return (
    <BcTable rows={rows} columns={[
      { key: 'cod_gru_conf',    label: 'Grupo' },
      { key: 'clave',           label: 'Clave'     },
      { key: 'etiqueta',        label: 'Etiqueta'  },
      { key: 'tolerancia_cero', label: 'Tol. cero', render: v => <BoolBadge v={v} trueClass="badge-danger" /> },
      { key: 'activo',          label: 'Activo',    render: v => <BoolBadge v={v} /> },
    ]} />
  );
}

function TabGeneral({ nombre, onChange, onSave, saving }) {
  return (
    <div className="admin-general">
      <p className="section-h">Empresa</p>
      <div className="form-group">
        <label className="form-label">Nombre / Razón social</label>
        <input
          className="form-input"
          type="text"
          value={nombre}
          onChange={e => onChange(e.target.value)}
        />
      </div>
      <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-primary" onClick={onSave} disabled={saving}>
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Admin({ onBack }) {
  const [tab, setTab]     = useState('grupos');
  const [rows, setRows]   = useState({});
  const [loading, setLoading] = useState(true);
  const [nombre, setNombre]   = useState('');
  const [saving, setSaving]   = useState(false);
  const [syncing, setSyncing]     = useState(false);
  const [syncState, setSyncState] = useState(null);
  const [syncError, setSyncError] = useState(null);

  async function loadData() {
    setLoading(true);
    const [grupos, variedades, tipos, defCvu, defPcc, clases, umbrales, empresa] = await Promise.all([
      supabase.from('gsi_vgr_conf').select('*').order('cod_gru_conf'),
      supabase.from('gsi_g_varied').select('*').order('cod_gru_conf').order('d_varied'),
      supabase.from('gsi_vti_conf').select('*').order('c_t_conf'),
      supabase.from('lmd_defectos_cvu').select('*').order('cod_gru_conf').order('severidad').order('orden'),
      supabase.from('lmd_defectos_pcc').select('*').order('cod_gru_conf').order('orden'),
      supabase.from('lmd_clases_calidad_cvu').select('*').order('cod_gru_conf').order('orden'),
      supabase.from('lmd_umbrales_pcc').select('*').order('cod_gru_conf'),
      supabase.from('config_empresa').select('nombre').limit(1).single(),
    ]);
    setRows({
      grupos:     grupos.data     ?? [],
      variedades: variedades.data ?? [],
      tipos:      tipos.data      ?? [],
      defCvu:     defCvu.data     ?? [],
      defPcc:     defPcc.data     ?? [],
      clases:     clases.data     ?? [],
      umbrales:   umbrales.data   ?? [],
    });
    setNombre(empresa.data?.nombre ?? '');
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  async function handleSync() {
    setSyncing(true);
    setSyncState(null);
    setSyncError(null);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/sync-bc`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        const firstErr = Object.entries(data?.results ?? {}).find(([, v]) => v.error);
        throw new Error(firstErr ? `${firstErr[0]}: ${firstErr[1].error}` : (data?.error ?? `HTTP ${res.status}`));
      }
      setSyncState('ok');
      loadData();
    } catch (e) {
      setSyncState('error');
      setSyncError(e.message);
    } finally {
      setSyncing(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    await supabase
      .from('config_empresa')
      .update({ nombre })
      .neq('id', '00000000-0000-0000-0000-000000000000');
    setSaving(false);
  }

  const isBC = tab !== 'general';
  const count = isBC && rows[tabKey(tab)] ? rows[tabKey(tab)].length : null;

  return (
    <>
      <header className="top-bar">
        <button className="icon-btn" onClick={onBack} title="Volver">←</button>
        <div className="top-bar-title" style={{ flex: 1 }}>Configuración</div>
        <button
          className="btn btn-sm btn-secondary"
          onClick={handleSync}
          disabled={syncing}
          title="Descargar configuración desde Business Central"
          style={syncState === 'ok' ? { color: 'var(--ok)', borderColor: 'var(--ok)' } : syncState === 'error' ? { color: 'var(--danger)', borderColor: 'var(--danger)' } : {}}
        >
          {syncing ? '⟳' : syncState === 'ok' ? '✓' : syncState === 'error' ? '✕' : '⬇'} BC
        </button>
      </header>

      {syncError && (
        <div className="admin-sync-err">
          <span>{syncError}</span>
          <button onClick={() => { setSyncState(null); setSyncError(null); }}>✕</button>
        </div>
      )}

      <nav className="admin-tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`admin-tab${tab === t.id ? ' admin-tab--active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main className="content admin-content">
        {loading && isBC ? (
          <div className="admin-loading">Cargando…</div>
        ) : (
          <>
            {isBC && (
              <div className="admin-table-meta">
                <span className="admin-table-name">{currentTableName(tab)}</span>
                {count != null && <span className="admin-row-count">{count} filas</span>}
              </div>
            )}
            {tab === 'grupos'     && <TabGrupos     rows={rows.grupos}     />}
            {tab === 'variedades' && <TabVariedades rows={rows.variedades} />}
            {tab === 'tipos'      && <TabTipos      rows={rows.tipos}      />}
            {tab === 'clases'     && <TabClases     rows={rows.clases}     />}
            {tab === 'def-cvu'    && <TabDefCvu     rows={rows.defCvu}     />}
            {tab === 'umbrales'   && <TabUmbrales   rows={rows.umbrales}   />}
            {tab === 'def-pcc'    && <TabDefPcc     rows={rows.defPcc}     />}
            {tab === 'general'    && (
              <TabGeneral nombre={nombre} onChange={setNombre} onSave={handleSave} saving={saving} />
            )}
          </>
        )}
      </main>
    </>
  );
}

function tabKey(tab) {
  return { grupos: 'grupos', variedades: 'variedades', tipos: 'tipos', 'def-cvu': 'defCvu', 'def-pcc': 'defPcc', clases: 'clases', umbrales: 'umbrales' }[tab];
}

function currentTableName(tab) {
  return {
    grupos:     'gsi_vgr_conf',
    variedades: 'gsi_g_varied',
    tipos:      'gsi_vti_conf',
    clases:     'lmd_clases_calidad_cvu',
    'def-cvu':  'lmd_defectos_cvu',
    umbrales:   'lmd_umbrales_pcc',
    'def-pcc':  'lmd_defectos_pcc',
  }[tab] ?? '';
}
