import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ---------------------------------------------------------------------------
// BC helpers
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

function entityUrl(entitySet: string): string {
  const base      = Deno.env.get('BC_BASE_URL')!;
  const companyId = Deno.env.get('BC_COMPANY_ID')!;
  return `${base}/api/lmd/calidad/v1.0/companies(${companyId})/${entitySet}`;
}

async function bcPost(entitySet: string, body: object, token: string): Promise<any> {
  const res = await fetch(entityUrl(entitySet), {
    method:  'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${entitySet} ${res.status}: ${await res.text()}`);
  return res.status === 204 ? {} : res.json();
}

/**
 * Upsert a BC cabecera with proper OData concurrency handling.
 *
 * Flow:
 *   - If currentBcNo is set  → GET to verify the record still exists in BC
 *       200  → PATCH using the returned ETag  (record exists, update it)
 *       404  → fall through to POST           (record was deleted in BC, recreate)
 *       other → throw
 *   - POST (first send or recreation after deletion)
 *       Sends `no: supabaseNo` so BC uses our ID if the number series allows it.
 *       Stores whatever `no` BC returns (may equal supabaseNo or be auto-generated).
 *
 * Returns { bcNo, mode }.
 */
async function bcUpsertCabecera(
  entitySet: string,
  currentBcNo: string | null,
  body: object,
  token: string,
): Promise<{ bcNo: string; mode: 'create' | 'update' }> {

  if (currentBcNo) {
    const url = `${entityUrl(entitySet)}('${currentBcNo}')`;
    const getRes = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    });

    if (getRes.ok) {
      // Record exists — PATCH with ETag for proper OData concurrency control.
      // BC may return the ETag as an HTTP response header OR as @odata.etag in the JSON body.
      const data = await getRes.json();
      const etag = getRes.headers.get('ETag')
                ?? getRes.headers.get('etag')
                ?? data?.['@odata.etag'];
      if (!etag) throw new Error(`GET ${entitySet}('${currentBcNo}') did not return an ETag`);

      const patchRes = await fetch(url, {
        method:  'PATCH',
        headers: {
          Authorization:  `Bearer ${token}`,
          'Content-Type': 'application/json',
          'If-Match':     etag,
        },
        body: JSON.stringify(body),
      });
      if (!patchRes.ok) throw new Error(`PATCH ${entitySet}('${currentBcNo}') ${patchRes.status}: ${await patchRes.text()}`);
      return { bcNo: currentBcNo, mode: 'update' };
    }

    if (getRes.status !== 404) {
      // Unexpected error — don't silently fall through
      throw new Error(`GET ${entitySet}('${currentBcNo}') ${getRes.status}: ${await getRes.text()}`);
    }
    // 404: record was deleted in BC — fall through to POST to recreate
  }

  // POST — let BC auto-generate the no; we store whatever it returns in bc_no
  const created = await bcPost(entitySet, body, token);
  const bcNo = created?.no ?? created?.No;
  if (!bcNo) throw new Error(`POST ${entitySet} did not return a no`);
  return { bcNo, mode: 'create' };
}

/**
 * Upsert a BC line using its composite key.
 * compositeKey example: "codCabeceraPcc='PCC-2026-0004',noLinea=1"
 * Same GET→PATCH / 404→POST flow as bcUpsertCabecera.
 */
async function bcUpsertLine(
  entitySet: string,
  compositeKey: string,
  body: object,
  token: string,
): Promise<void> {
  const url = `${entityUrl(entitySet)}(${compositeKey})`;
  const getRes = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });

  if (getRes.ok) {
    const data = await getRes.json();
    const etag = getRes.headers.get('ETag')
              ?? getRes.headers.get('etag')
              ?? data?.['@odata.etag'];
    if (!etag) throw new Error(`GET ${entitySet}(${compositeKey}) did not return an ETag`);
    const patchRes = await fetch(url, {
      method:  'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'If-Match': etag },
      body:    JSON.stringify(body),
    });
    if (!patchRes.ok) throw new Error(`PATCH ${entitySet}(${compositeKey}) ${patchRes.status}: ${await patchRes.text()}`);
    return;
  }

  if (getRes.status !== 404) {
    throw new Error(`GET ${entitySet}(${compositeKey}) ${getRes.status}: ${await getRes.text()}`);
  }

  await bcPost(entitySet, body, token);
}

// ---------------------------------------------------------------------------
// CVU push
// ---------------------------------------------------------------------------

async function pushCvu(supabaseSeq: number, supabase: any, token: string) {
  const { data: cab, error: e1 } = await supabase
    .from('lmd_cabecera_cvu').select('*').eq('seq', supabaseSeq).single();
  if (e1 || !cab) throw new Error(`CVU no encontrado: seq=${supabaseSeq}`);

  const { data: lineas } = await supabase
    .from('lmd_linea_cvu').select('*').eq('cabecera_seq', supabaseSeq).order('dia');

  const cabeceraBody = {
    gruConf:          cab.gru_conf,
    variedad:         cab.variedad         ?? null,
    confeccion:       cab.confeccion        ?? null,
    categoriaInicial: cab.categoria_inicial ?? null,
    trazabilidad:     cab.trazabilidad      ?? null,
    pesoInicial:      cab.peso_inicial  != null ? parseFloat(cab.peso_inicial)  : null,
    fecha:            cab.fecha,
    nota:             cab.nota             ?? null,
  };

  const { bcNo, mode } = await bcUpsertCabecera('cabecerasCvu', cab.bc_no ?? null, cabeceraBody, token);

  const lineResults: any[] = [];
  for (const l of (lineas ?? [])) {
    try {
      const lineBody = {
        codCabeceraCvu:   bcNo,
        dia:              l.dia,
        fecha:            l.fecha,
        trazabilidad:     l.trazabilidad      ?? null,
        pesoDiario:       l.peso_diario       != null ? parseFloat(l.peso_diario)       : null,
        tempConservacion: l.temp_conservacion != null ? parseFloat(l.temp_conservacion) : null,
        defectos:         JSON.stringify(l.defectos ?? {}),
        pesoFaltasLeves:  parseFloat(l.peso_faltas_leves)  || 0,
        pesoFaltasGraves: parseFloat(l.peso_faltas_graves) || 0,
        pesoFaltasElim:   parseFloat(l.peso_faltas_elim)   || 0,
        pctPerdida:       l.pct_perdida != null ? parseFloat(l.pct_perdida) : null,
        pctLeves:         l.pct_leves   != null ? parseFloat(l.pct_leves)   : null,
        pctGraves:        l.pct_graves  != null ? parseFloat(l.pct_graves)  : null,
        pctElim:          l.pct_elim    != null ? parseFloat(l.pct_elim)    : null,
        pctTotal:         l.pct_total   != null ? parseFloat(l.pct_total)   : null,
        pctCalibre:       l.pct_calibre != null ? parseFloat(l.pct_calibre) : null,
        clasificacion:    l.clasificacion ?? null,
        photoUrl:         l.photo_url    ?? null,
      };
      await bcUpsertLine('lineasCvu', `codCabeceraCvu='${bcNo}',dia=${l.dia}`, lineBody, token);
      lineResults.push({ dia: l.dia, ok: true });
    } catch (err: any) {
      lineResults.push({ dia: l.dia, ok: false, error: err.message });
    }
  }

  await supabase.from('lmd_cabecera_cvu')
    .update({ bc_no: bcNo, bc_sync_at: new Date().toISOString() })
    .eq('seq', supabaseSeq);

  return { mode, bcNo, lineas: lineResults };
}

// ---------------------------------------------------------------------------
// PCC push
// ---------------------------------------------------------------------------

async function pushPcc(supabaseSeq: number, supabase: any, token: string) {
  const { data: cab, error: e1 } = await supabase
    .from('lmd_cabecera_pcc').select('*').eq('seq', supabaseSeq).single();
  if (e1 || !cab) throw new Error(`PCC no encontrado: seq=${supabaseSeq}`);

  const { data: lineas } = await supabase
    .from('lmd_linea_pcc').select('*').eq('cabecera_seq', supabaseSeq).order('no_linea');

  const cabeceraBody = {
    gruConf:      cab.gru_conf,
    tipoConf:     cab.tipo_conf    ?? null,
    fecha:        cab.fecha,
    hora:         cab.hora         ?? null,
    responsable:  cab.responsable  ?? null,
    variedad:     cab.variedad     ?? null,
    trazabilidad: cab.trazabilidad ?? null,
    cintaNum:     cab.cinta_num    != null ? String(cab.cinta_num) : null,
    mesaNum:      cab.mesa_num     != null ? String(cab.mesa_num)  : null,
    nMuestras:    cab.n_muestras   ?? 10,
    resultado:    String(cab.resultado ?? 0),
    datosExtra:   JSON.stringify(cab.datos_extra ?? {}),
  };

  const { bcNo, mode } = await bcUpsertCabecera('cabecerasPcc', cab.bc_no ?? null, cabeceraBody, token);

  const lineResults: any[] = [];
  for (const l of (lineas ?? [])) {
    try {
      const med = (typeof l.mediciones === 'object' && l.mediciones) ? l.mediciones : {};
      const lineBody = {
        codCabeceraPcc: bcNo,
        noLinea:        l.no_linea,
        hora:           l.hora ?? null,
        pctDefectos:    med?.total_pct != null ? parseFloat(med.total_pct) : null,
        resultado:      String(l.resultado ?? 0),
        mediciones:     JSON.stringify(med),
      };
      await bcUpsertLine('lineasPcc', `codCabeceraPcc='${bcNo}',noLinea=${l.no_linea}`, lineBody, token);
      lineResults.push({ noLinea: l.no_linea, ok: true });
    } catch (err: any) {
      lineResults.push({ noLinea: l.no_linea, ok: false, error: err.message });
    }
  }

  await supabase.from('lmd_cabecera_pcc')
    .update({ bc_no: bcNo, bc_sync_at: new Date().toISOString() })
    .eq('seq', supabaseSeq);

  return { mode, bcNo, lineas: lineResults };
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  // Preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  try {
    const { tipo, seq } = await req.json();
    if (!tipo || !seq) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Falta tipo o seq' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const token = await getBcToken();

    let result: any;
    if (tipo === 'CVU')      result = await pushCvu(Number(seq), supabase, token);
    else if (tipo === 'PCC') result = await pushPcc(Number(seq), supabase, token);
    else return new Response(
      JSON.stringify({ ok: false, error: `Tipo desconocido: ${tipo}` }),
      { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );

    const lineErrors = (result.lineas ?? []).filter((l: any) => !l.ok);
    return new Response(
      JSON.stringify({ ok: lineErrors.length === 0, ...result, lineErrors }),
      {
        status:  lineErrors.length > 0 ? 207 : 200,
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
