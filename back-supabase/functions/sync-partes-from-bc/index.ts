import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ---------------------------------------------------------------------------
// BC helpers (same pattern as sync-from-bc)
// ---------------------------------------------------------------------------

async function getBcToken(): Promise<string> {
  const res = await fetch(
    `https://login.microsoftonline.com/${Deno.env.get('BC_TENANT_ID')!}/oauth2/v2.0/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type:    'client_credentials',
        client_id:     Deno.env.get('BC_CLIENT_ID')!,
        client_secret: Deno.env.get('BC_CLIENT_SECRET')!,
        scope:         'https://api.businesscentral.dynamics.com/.default',
      }),
    },
  );
  if (!res.ok) throw new Error(`BC token ${res.status}: ${await res.text()}`);
  return (await res.json()).access_token;
}

function bcBaseUrl(): string {
  const base      = Deno.env.get('BC_BASE_URL')!;
  const companyId = Deno.env.get('BC_COMPANY_ID')!;
  return `${base}/api/lmd/calidad/v1.0/companies(${companyId})`;
}

async function bcFetchAll(entitySet: string, token: string): Promise<any[]> {
  const rows: any[] = [];
  let url: string | null = `${bcBaseUrl()}/${entitySet}`;
  while (url) {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`BC fetch ${entitySet} ${res.status}: ${await res.text()}`);
    const json = await res.json();
    rows.push(...(json.value ?? []));
    url = json['@odata.nextLink'] ?? null;
  }
  return rows;
}

async function bcFetchFiltered(entitySet: string, filter: string, token: string): Promise<any[]> {
  const rows: any[] = [];
  let url: string | null = `${bcBaseUrl()}/${entitySet}?$filter=${encodeURIComponent(filter)}`;
  while (url) {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`BC fetch ${entitySet} (filter) ${res.status}: ${await res.text()}`);
    const json = await res.json();
    rows.push(...(json.value ?? []));
    url = json['@odata.nextLink'] ?? null;
  }
  return rows;
}

function parseJson(s: any): object {
  if (!s) return {};
  if (typeof s === 'object') return s;
  try { return JSON.parse(s); } catch { return {}; }
}

// ---------------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------------

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const token = await getBcToken();
    const results: Record<string, any> = {};

    // ── PCC ─────────────────────────────────────────────────────────────────
    try {
      const bcPartes = await bcFetchAll('cabecerasPcc', token);
      let created = 0, updated = 0, linesSynced = 0;

      for (const bc of bcPartes) {
        const bcNo: string = bc.no;

        const cabRow = {
          gru_conf:    bc.gruConf     ?? null,
          tipo_conf:   bc.tipoConf    ?? null,
          fecha:       bc.fecha       ?? null,
          hora:        bc.hora        ?? null,
          responsable: bc.responsable ?? null,
          variedad:    bc.variedad    ?? null,
          trazabilidad:bc.trazabilidad ?? null,
          cinta_num:   bc.cintaNum    ?? null,
          mesa_num:    bc.mesaNum     ?? null,
          n_muestras:  bc.nMuestras   ?? 10,
          resultado:   parseInt(bc.resultado ?? '0'),
          datos_extra: parseJson(bc.datosExtra),
          bc_no:       bcNo,
          bc_sync_at:  new Date().toISOString(),
        };

        const { data: existing } = await supabase
          .from('lmd_cabecera_pcc').select('seq').eq('bc_no', bcNo).maybeSingle();

        let cabSeq: number;
        if (existing) {
          const { error } = await supabase.from('lmd_cabecera_pcc')
            .update(cabRow).eq('seq', existing.seq);
          if (error) throw new Error(`Update PCC ${bcNo}: ${error.message}`);
          cabSeq = existing.seq;
          updated++;
        } else {
          const { data, error } = await supabase.from('lmd_cabecera_pcc')
            .insert(cabRow).select('seq').single();
          if (error) throw new Error(`Insert PCC ${bcNo}: ${error.message}`);
          cabSeq = data.seq;
          created++;
        }

        // Sync lines: full replace
        const bcLineas = await bcFetchFiltered('lineasPcc', `codCabeceraPcc eq '${bcNo}'`, token);
        await supabase.from('lmd_linea_pcc').delete().eq('cabecera_seq', cabSeq);

        if (bcLineas.length > 0) {
          const lineRows = bcLineas.map((l: any) => ({
            cabecera_seq: cabSeq,
            no_linea:     l.noLinea,
            hora:         l.hora      ?? null,
            mediciones:   parseJson(l.mediciones),
            resultado:    parseInt(l.resultado ?? '0'),
          }));
          const { error } = await supabase.from('lmd_linea_pcc').insert(lineRows);
          if (error) throw new Error(`Insert lineas PCC ${bcNo}: ${error.message}`);
          linesSynced += bcLineas.length;
        }
      }

      results['lmd_cabecera_pcc'] = { partes: bcPartes.length, created, updated, linesSynced };
    } catch (err: any) {
      results['lmd_cabecera_pcc'] = { error: err.message };
    }

    // ── CVU ─────────────────────────────────────────────────────────────────
    try {
      const bcTandas = await bcFetchAll('cabecerasCvu', token);
      let created = 0, updated = 0, linesSynced = 0;

      for (const bc of bcTandas) {
        const bcNo: string = bc.no;

        const cabRow = {
          gru_conf:          bc.gruConf          ?? null,
          variedad:          bc.variedad          ?? null,
          confeccion:        bc.confeccion        ?? null,
          categoria_inicial: bc.categoriaInicial  ?? null,
          trazabilidad:      bc.trazabilidad      ?? null,
          peso_inicial:      bc.pesoInicial       ?? null,
          fecha:             bc.fecha             ?? null,
          nota:              bc.nota              ?? null,
          bc_no:             bcNo,
          bc_sync_at:        new Date().toISOString(),
        };

        const { data: existing } = await supabase
          .from('lmd_cabecera_cvu').select('seq').eq('bc_no', bcNo).maybeSingle();

        let cabSeq: number;
        if (existing) {
          const { error } = await supabase.from('lmd_cabecera_cvu')
            .update(cabRow).eq('seq', existing.seq);
          if (error) throw new Error(`Update CVU ${bcNo}: ${error.message}`);
          cabSeq = existing.seq;
          updated++;
        } else {
          const { data, error } = await supabase.from('lmd_cabecera_cvu')
            .insert(cabRow).select('seq').single();
          if (error) throw new Error(`Insert CVU ${bcNo}: ${error.message}`);
          cabSeq = data.seq;
          created++;
        }

        // Sync lines: full replace
        const bcLineas = await bcFetchFiltered('lineasCvu', `codCabeceraCvu eq '${bcNo}'`, token);
        await supabase.from('lmd_linea_cvu').delete().eq('cabecera_seq', cabSeq);

        if (bcLineas.length > 0) {
          const lineRows = bcLineas.map((l: any) => ({
            cabecera_seq:       cabSeq,
            dia:                l.dia,
            fecha:              l.fecha              ?? null,
            trazabilidad:       l.trazabilidad       ?? null,
            peso_diario:        l.pesoDiario         ?? null,
            temp_conservacion:  l.tempConservacion   ?? null,
            defectos:           parseJson(l.defectos),
            peso_faltas_leves:  l.pesoFaltasLeves    ?? 0,
            peso_faltas_graves: l.pesoFaltasGraves   ?? 0,
            peso_faltas_elim:   l.pesoFaltasElim     ?? 0,
            pct_perdida:        l.pctPerdida         ?? null,
            pct_leves:          l.pctLeves           ?? null,
            pct_graves:         l.pctGraves          ?? null,
            pct_elim:           l.pctElim            ?? null,
            pct_total:          l.pctTotal           ?? null,
            pct_calibre:        l.pctCalibre         ?? null,
            clasificacion:      l.clasificacion      ?? null,
            photo_url:          l.photoUrl           ?? null,
          }));
          const { error } = await supabase.from('lmd_linea_cvu').insert(lineRows);
          if (error) throw new Error(`Insert lineas CVU ${bcNo}: ${error.message}`);
          linesSynced += bcLineas.length;
        }
      }

      results['lmd_cabecera_cvu'] = { partes: bcTandas.length, created, updated, linesSynced };
    } catch (err: any) {
      results['lmd_cabecera_cvu'] = { error: err.message };
    }

    const hasErrors = Object.values(results).some((r: any) => r.error);
    return new Response(
      JSON.stringify({ ok: !hasErrors, results }),
      {
        status:  hasErrors ? 207 : 200,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      },
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ ok: false, error: err.message }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  }
});
