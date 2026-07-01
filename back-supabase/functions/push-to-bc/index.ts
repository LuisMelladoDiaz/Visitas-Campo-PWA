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

async function bcPatch(entitySet: string, key: string, body: object, token: string): Promise<void> {
  const res = await fetch(`${entityUrl(entitySet)}('${key}')`, {
    method:  'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PATCH ${entitySet}('${key}') ${res.status}: ${await res.text()}`);
}

async function bcGetLineIds(entitySet: string, filterField: string, filterValue: string, token: string): Promise<string[]> {
  const url = `${entityUrl(entitySet)}?$filter=${filterField} eq '${filterValue}'&$select=id`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });
  if (!res.ok) return [];
  const json = await res.json();
  return (json.value ?? []).map((r: any) => r.id).filter(Boolean);
}

async function bcDeleteLine(entitySet: string, id: string, token: string): Promise<void> {
  const res = await fetch(`${entityUrl(entitySet)}(${id})`, {
    method:  'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok && res.status !== 404) {
    throw new Error(`DELETE ${entitySet}(${id}) ${res.status}: ${await res.text()}`);
  }
}

// ---------------------------------------------------------------------------
// CVU push
// ---------------------------------------------------------------------------

async function pushCvu(supabaseNo: string, supabase: any, token: string) {
  const { data: cab, error: e1 } = await supabase
    .from('lmd_cabecera_cvu').select('*').eq('no', supabaseNo).single();
  if (e1 || !cab) throw new Error(`CVU no encontrado: ${supabaseNo}`);

  const { data: lineas } = await supabase
    .from('lmd_linea_cvu').select('*').eq('cod_cabecera_cvu', supabaseNo).order('dia');

  const isUpdate   = !!cab.bc_no;
  const cabeceraBody = {
    gruConf:          cab.gru_conf,
    variedad:         cab.variedad          ?? null,
    confeccion:       cab.confeccion         ?? null,
    categoriaInicial: cab.categoria_inicial  ?? null,
    trazabilidad:     cab.trazabilidad       ?? null,
    pesoInicial:      cab.peso_inicial  != null ? parseFloat(cab.peso_inicial)  : null,
    fecha:            cab.fecha,
    nota:             cab.nota              ?? null,
  };

  let bcNo: string;
  if (!isUpdate) {
    const bcCab = await bcPost('cabecerasCvu', cabeceraBody, token);
    bcNo = bcCab?.no ?? bcCab?.No ?? supabaseNo;
  } else {
    bcNo = cab.bc_no;
    await bcPatch('cabecerasCvu', bcNo, cabeceraBody, token);
    const ids = await bcGetLineIds('lineasCvu', 'codCabeceraCvu', bcNo, token);
    await Promise.all(ids.map(id => bcDeleteLine('lineasCvu', id, token)));
  }

  const lineResults: any[] = [];
  for (const l of (lineas ?? [])) {
    try {
      await bcPost('lineasCvu', {
        codCabeceraCvu:   bcNo,
        dia:              l.dia,
        fecha:            l.fecha,
        trazabilidad:     l.trazabilidad      ?? null,
        pesoDiario:       l.peso_diario  != null ? parseFloat(l.peso_diario)  : null,
        tempConservacion: l.temp_conservacion != null ? parseFloat(l.temp_conservacion) : null,
        defectos:         JSON.stringify(l.defectos ?? {}),
        pesoFaltasLeves:  parseFloat(l.peso_faltas_leves)  || 0,
        pesoFaltasGraves: parseFloat(l.peso_faltas_graves) || 0,
        pesoFaltasElim:   parseFloat(l.peso_faltas_elim)   || 0,
        pctPerdida:       l.pct_perdida  != null ? parseFloat(l.pct_perdida)  : null,
        pctLeves:         l.pct_leves    != null ? parseFloat(l.pct_leves)    : null,
        pctGraves:        l.pct_graves   != null ? parseFloat(l.pct_graves)   : null,
        pctElim:          l.pct_elim     != null ? parseFloat(l.pct_elim)     : null,
        pctTotal:         l.pct_total    != null ? parseFloat(l.pct_total)    : null,
        pctCalibre:       l.pct_calibre  != null ? parseFloat(l.pct_calibre)  : null,
        clasificacion:    l.clasificacion ?? null,
        photoUrl:         l.photo_url    ?? null,
      }, token);
      lineResults.push({ dia: l.dia, ok: true });
    } catch (err: any) {
      lineResults.push({ dia: l.dia, ok: false, error: err.message });
    }
  }

  await supabase.from('lmd_cabecera_cvu')
    .update({ bc_no: bcNo, bc_sync_at: new Date().toISOString() })
    .eq('no', supabaseNo);

  return { mode: isUpdate ? 'update' : 'create', bcNo, lineas: lineResults };
}

// ---------------------------------------------------------------------------
// PCC push
// ---------------------------------------------------------------------------

async function pushPcc(supabaseNo: string, supabase: any, token: string) {
  const { data: cab, error: e1 } = await supabase
    .from('lmd_cabecera_pcc').select('*').eq('no', supabaseNo).single();
  if (e1 || !cab) throw new Error(`PCC no encontrado: ${supabaseNo}`);

  const { data: lineas } = await supabase
    .from('lmd_linea_pcc').select('*').eq('cod_cabecera_pcc', supabaseNo).order('no_linea');

  const isUpdate = !!cab.bc_no;
  const cabeceraBody = {
    gruConf:      cab.gru_conf,
    tipoConf:     cab.tipo_conf    ?? null,
    fecha:        cab.fecha,
    hora:         cab.hora         ?? null,
    responsable:  cab.responsable  ?? null,
    variedad:     cab.variedad     ?? null,
    trazabilidad: cab.trazabilidad ?? null,
    cintaNum:     cab.cinta_num    != null ? String(cab.cinta_num)  : null,
    mesaNum:      cab.mesa_num     != null ? String(cab.mesa_num)   : null,
    nMuestras:    cab.n_muestras   ?? 10,
    resultado:    String(cab.resultado)    ?? "0",
    datosExtra:   JSON.stringify(cab.datos_extra ?? {}),
  };

  let bcNo: string;
  if (!isUpdate) {
    const bcCab = await bcPost('cabecerasPcc', cabeceraBody, token);
    bcNo = bcCab?.no ?? bcCab?.No ?? supabaseNo;
  } else {
    bcNo = cab.bc_no;
    await bcPatch('cabecerasPcc', bcNo, cabeceraBody, token);
    const ids = await bcGetLineIds('lineasPcc', 'codCabeceraPcc', bcNo, token);
    await Promise.all(ids.map(id => bcDeleteLine('lineasPcc', id, token)));
  }

  const lineResults: any[] = [];
  for (const l of (lineas ?? [])) {
    try {
      const med = (typeof l.mediciones === 'object' && l.mediciones) ? l.mediciones : {};
      await bcPost('lineasPcc', {
        codCabeceraPcc: bcNo,
        noLinea:        l.no_linea,
        hora:           l.hora    ?? null,
        pctDefectos:    med?.total_pct != null ? parseFloat(med.total_pct) : null,
        resultado:      String(l.resultado) ?? "0",
        mediciones:     JSON.stringify(med),
      }, token);
      lineResults.push({ noLinea: l.no_linea, ok: true });
    } catch (err: any) {
      lineResults.push({ noLinea: l.no_linea, ok: false, error: err.message });
    }
  }

  await supabase.from('lmd_cabecera_pcc')
    .update({ bc_no: bcNo, bc_sync_at: new Date().toISOString() })
    .eq('no', supabaseNo);

  return { mode: isUpdate ? 'update' : 'create', bcNo, lineas: lineResults };
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

Deno.serve(async (req) => {
  try {
    const { tipo, no } = await req.json();
    if (!tipo || !no) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Falta tipo o no' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const token = await getBcToken();

    let result: any;
    if (tipo === 'CVU')      result = await pushCvu(no, supabase, token);
    else if (tipo === 'PCC') result = await pushPcc(no, supabase, token);
    else return new Response(
      JSON.stringify({ ok: false, error: `Tipo desconocido: ${tipo}` }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );

    const lineErrors = (result.lineas ?? []).filter((l: any) => !l.ok);
    return new Response(
      JSON.stringify({ ok: lineErrors.length === 0, ...result, lineErrors }),
      {
        status:  lineErrors.length > 0 ? 207 : 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ ok: false, error: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
});
