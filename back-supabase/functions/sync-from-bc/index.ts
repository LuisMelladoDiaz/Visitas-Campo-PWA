/**
 * sync-from-bc/index.ts — Supabase Edge Function
 *
 * Syncs reference/config data from Business Central to Supabase.
 * Runs on demand (POST /functions/v1/sync-from-bc) or via a cron trigger.
 *
 * Required environment variables:
 *   BC_BASE_URL    — e.g. https://api.businesscentral.dynamics.com/v2.0
 *   BC_TENANT_ID   — Azure AD tenant ID for the BC environment
 *   BC_COMPANY_ID  — BC company GUID (visible in BC URL or via /companies endpoint)
 *   BC_CLIENT_ID   — App registration client ID (OAuth2 client-credentials flow)
 *   BC_CLIENT_SECRET — App registration client secret
 *   SUPABASE_URL   — injected automatically by Supabase runtime
 *   SUPABASE_SERVICE_ROLE_KEY — injected automatically by Supabase runtime
 *
 * BC API publisher/group/version: lmd / calidad / v1.0
 * Entity sets:  gruposConf · variedades · tiposConf · defectosPcc · umbralesPcc
 *               clasesCalidadCvu · defectosCvu
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ---------------------------------------------------------------------------
// BC OAuth2 token helper
// ---------------------------------------------------------------------------
async function getBcToken(): Promise<string> {
  const tenantId = Deno.env.get('BC_TENANT_ID')!;
  const clientId = Deno.env.get('BC_CLIENT_ID')!;
  const clientSecret = Deno.env.get('BC_CLIENT_SECRET')!;

  const res = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'https://api.businesscentral.dynamics.com/.default',
      }),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`BC token error ${res.status}: ${text}`);
  }

  const json = await res.json();
  return json.access_token as string;
}

// ---------------------------------------------------------------------------
// BC OData fetch helper — follows @odata.nextLink for paged results
// ---------------------------------------------------------------------------
async function bcFetchAll(entitySet: string, token: string): Promise<unknown[]> {
  const base = Deno.env.get('BC_BASE_URL')!;
  const companyId = Deno.env.get('BC_COMPANY_ID')!;
  const apiPath = `${base}/api/lmd/calidad/v1.0/companies(${companyId})/${entitySet}`;

  const rows: unknown[] = [];
  let url: string | null = apiPath;

  while (url) {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`BC fetch ${entitySet} error ${res.status}: ${text}`);
    }

    const json = await res.json();
    const values = json.value ?? [];
    rows.push(...values);
    url = json['@odata.nextLink'] ?? null;
  }

  return rows;
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------
Deno.serve(async (_req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const token = await getBcToken();
    const results: Record<string, { upserted?: number; deleted?: number; inserted?: number; error?: string }> = {};

    // -----------------------------------------------------------------------
    // 1. gsi_vgr_conf — Grupos de Confección
    //    BC API key: codGruConf, desGruConf, tieneCvu, tienePcc
    // -----------------------------------------------------------------------
    try {
      const rows = await bcFetchAll('gruposConf', token);
      const payload = rows.map((d: any) => ({
        cod_gru_conf: d.codGruConf as string,
        des_gru_conf: d.desGruConf as string,
        tiene_cvu:    (d.tieneCvu  ?? false) as boolean,
        tiene_pcc:    (d.tienePcc  ?? false) as boolean,
      }));

      const { error } = await supabase
        .from('gsi_vgr_conf')
        .upsert(payload, { onConflict: 'cod_gru_conf' });

      if (error) throw error;
      results['gsi_vgr_conf'] = { upserted: payload.length };
    } catch (err: any) {
      results['gsi_vgr_conf'] = { error: err.message };
    }

    // -----------------------------------------------------------------------
    // 2. gsi_g_varied — Variedades
    //    BC API key: codGruConf, cVaried, dVaried
    // -----------------------------------------------------------------------
    try {
      const rows = await bcFetchAll('variedades', token);
      // Fetch valid grupo codes to avoid FK violations
      const { data: grupos } = await supabase.from('gsi_vgr_conf').select('cod_gru_conf');
      const validGrupos = new Set((grupos ?? []).map((g: any) => g.cod_gru_conf));

      const allRows = rows.map((d: any) => ({
        cod_gru_conf: (d.codGruConf || null) as string | null,
        c_varied:     d.cVaried as string,
        d_varied:     d.dVaried as string,
      }));
      const payload = allRows.filter(r => r.cod_gru_conf && validGrupos.has(r.cod_gru_conf));
      const skipped = allRows.length - payload.length;

      const { error } = await supabase
        .from('gsi_g_varied')
        .upsert(payload, { onConflict: 'c_varied' });

      if (error) throw error;
      results['gsi_g_varied'] = { upserted: payload.length, ...(skipped > 0 && { skipped }) };
    } catch (err: any) {
      results['gsi_g_varied'] = { error: err.message };
    }

    // -----------------------------------------------------------------------
    // 3. gsi_vti_conf — Tipos / Formatos de Confección
    //    BC API key: codGruConf, cTConf, dTConf, pesoRefG, nMuestras
    // -----------------------------------------------------------------------
    try {
      const rows = await bcFetchAll('tiposConf', token);
      const payload = rows.map((d: any) => ({
        cod_gru_conf: (d.codGruConf || null) as string | null,
        c_t_conf:     d.cTConf    as string,
        d_t_conf:     d.dTConf    as string,
        peso_ref_g:   (d.pesoRefG  ?? 0) as number,
        n_muestras:   (d.nMuestras ?? 0) as number,
      }));

      const { error } = await supabase
        .from('gsi_vti_conf')
        .upsert(payload, { onConflict: 'c_t_conf' });

      if (error) throw error;
      results['gsi_vti_conf'] = { upserted: payload.length };
    } catch (err: any) {
      results['gsi_vti_conf'] = { error: err.message };
    }

    // -----------------------------------------------------------------------
    // 4. lmd_defectos_pcc — Defectos PCC
    //    BC API key: gruConf, clave, etiqueta, toleranciaCero, activo, orden
    //    Strategy: DELETE all + INSERT (full replace per sync)
    // -----------------------------------------------------------------------
    try {
      const rows = await bcFetchAll('defectosPcc', token);

      const { error: delErr } = await supabase
        .from('lmd_defectos_pcc')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (delErr) throw delErr;

      const payload = rows.map((d: any) => ({
        cod_gru_conf:    d.gruConf        as string,
        clave:           d.clave          as string,
        etiqueta:        d.etiqueta       as string,
        tolerancia_cero: (d.toleranciaCero ?? false) as boolean,
        activo:          (d.activo         ?? true)  as boolean,
        orden:           (d.orden          ?? 0)     as number,
      }));

      const { error: insErr } = await supabase
        .from('lmd_defectos_pcc')
        .insert(payload);

      if (insErr) throw insErr;
      results['lmd_defectos_pcc'] = { deleted: rows.length, inserted: payload.length };
    } catch (err: any) {
      results['lmd_defectos_pcc'] = { error: err.message };
    }

    // -----------------------------------------------------------------------
    // 5. lmd_umbrales_pcc — Umbrales PCC
    //    BC API key: gruConf, maxDefectosPct, minBrix, maxCalibrePct
    //    Strategy: DELETE all + INSERT (full replace per sync)
    // -----------------------------------------------------------------------
    try {
      const rows = await bcFetchAll('umbralesPcc', token);

      const { error: delErr } = await supabase
        .from('lmd_umbrales_pcc')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (delErr) throw delErr;

      const payload = rows.map((d: any) => ({
        cod_gru_conf:     (d.gruConf          || null)  as string | null,
        max_defectos_pct: (d.maxDefectosPct   ?? 0)     as number,
        min_brix:         (d.minBrix          ?? null)  as number | null,
        max_calibre_pct:  (d.maxCalibrePct    ?? null)  as number | null,
      }));

      const { error: insErr } = await supabase
        .from('lmd_umbrales_pcc')
        .insert(payload);

      if (insErr) throw insErr;
      results['lmd_umbrales_pcc'] = { deleted: rows.length, inserted: payload.length };
    } catch (err: any) {
      results['lmd_umbrales_pcc'] = { error: err.message };
    }

    // -----------------------------------------------------------------------
    // 6. lmd_clases_calidad_cvu — Clases de Calidad CVU
    //    BC API key: gruConf, nombre, cssKey, orden,
    //                maxPctLeves, maxPctGraves, maxPctElim, maxPctTotal, maxPctCalibre
    //    Strategy: DELETE all + INSERT (full replace per sync)
    // -----------------------------------------------------------------------
    try {
      const rows = await bcFetchAll('clasesCalidadCvu', token);

      const { error: delErr } = await supabase
        .from('lmd_clases_calidad_cvu')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (delErr) throw delErr;

      const payload = rows.map((d: any) => ({
        cod_gru_conf:    (d.gruConf        || null)  as string | null,
        nombre:          d.nombre          as string,
        css_key:         d.cssKey          as string,
        orden:           (d.orden          ?? 0)     as number,
        max_pct_leves:   (d.maxPctLeves    ?? null)  as number | null,
        max_pct_graves:  (d.maxPctGraves   ?? null)  as number | null,
        max_pct_elim:    (d.maxPctElim     ?? null)  as number | null,
        max_pct_total:   (d.maxPctTotal    ?? null)  as number | null,
        max_pct_calibre: (d.maxPctCalibre  ?? null)  as number | null,
      }));

      const { error: insErr } = await supabase
        .from('lmd_clases_calidad_cvu')
        .insert(payload);

      if (insErr) throw insErr;
      results['lmd_clases_calidad_cvu'] = { deleted: rows.length, inserted: payload.length };
    } catch (err: any) {
      results['lmd_clases_calidad_cvu'] = { error: err.message };
    }

    // -----------------------------------------------------------------------
    // 7. lmd_defectos_cvu — Defectos CVU
    //    BC API key: gruConf, severidad, clave, etiqueta, valorOk, activo, orden
    //    severidad: BC Enum lmdSeveridadDefecto integer (0=Leve,1=Grave,2=Eliminatorio)
    //               — already integer in both BC and Supabase, no mapping needed
    //    Strategy: DELETE all + INSERT (full replace per sync)
    // -----------------------------------------------------------------------
    try {
      const rows = await bcFetchAll('defectosCvu', token);

      const { error: delErr } = await supabase
        .from('lmd_defectos_cvu')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (delErr) throw delErr;

      const SEV: Record<string, number> = { Leve: 0, Grave: 1, Eliminatorio: 2 };
      const payload = rows.map((d: any) => ({
        cod_gru_conf: d.gruConf           as string,
        severidad:    (typeof d.severidad === 'string' ? (SEV[d.severidad] ?? 0) : (d.severidad ?? 0)) as number,
        clave:        d.clave             as string,
        etiqueta:     d.etiqueta          as string,
        valor_ok:     (d.valorOk          ?? 'No')  as string,
        activo:       (d.activo           ?? true)  as boolean,
        orden:        (d.orden            ?? 0)     as number,
      }));

      const { error: insErr } = await supabase
        .from('lmd_defectos_cvu')
        .insert(payload);

      if (insErr) throw insErr;
      results['lmd_defectos_cvu'] = { deleted: rows.length, inserted: payload.length };
    } catch (err: any) {
      results['lmd_defectos_cvu'] = { error: err.message };
    }

    // -----------------------------------------------------------------------
    // Response
    // -----------------------------------------------------------------------
    const hasErrors = Object.values(results).some((r) => r.error);

    return new Response(
      JSON.stringify({ ok: !hasErrors, results }),
      {
        status: hasErrors ? 207 : 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ ok: false, error: err.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
});
