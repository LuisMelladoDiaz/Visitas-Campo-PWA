const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function pushToBc(tipo, no) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/push-to-bc`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({ tipo, no }),
  });
  const data = await res.json();
  if (!res.ok || !data?.ok) {
    const lineErr = data?.lineErrors?.[0];
    const msg = lineErr
      ? `Línea ${lineErr.noLinea ?? lineErr.dia}: ${lineErr.error}`
      : (data?.error ?? `HTTP ${res.status}`);
    throw new Error(msg);
  }
  return data;
}
