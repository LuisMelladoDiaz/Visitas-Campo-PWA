const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function pushToBc(tipo, no) {
  const url = `${SUPABASE_URL}/functions/v1/push-to-bc`;

  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({ tipo, seq: no }),
    });
  } catch (netErr) {
    throw new Error(`Red: ${netErr.message} | URL: ${url} | KEY: ${SUPABASE_ANON_KEY ? 'ok' : 'MISSING'}`);
  }

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error(`HTTP ${res.status} — respuesta no es JSON`);
  }

  if (!res.ok || !data?.ok) {
    const lineErr = data?.lineErrors?.[0];
    const msg = lineErr
      ? `Línea ${lineErr.noLinea ?? lineErr.dia}: ${lineErr.error}`
      : (data?.error ?? `HTTP ${res.status}`);
    throw new Error(msg);
  }
  return data;
}
