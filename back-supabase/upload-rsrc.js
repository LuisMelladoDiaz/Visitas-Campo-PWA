#!/usr/bin/env node
/**
 * upload-rsrc.js — Sube las fotos de rsrc/ a Supabase Storage (bucket: lectura-photos)
 *
 * Uso:
 *   node back-supabase/upload-rsrc.js
 *
 * Lee las credenciales de front-pwa/.env.local (NEXT_PUBLIC_SUPABASE_URL y
 * NEXT_PUBLIC_SUPABASE_ANON_KEY). Necesitas un Service Role Key para poder
 * hacer upload sin autenticación previa. Edita el .env.local añadiendo:
 *   SUPABASE_SERVICE_KEY=eyJ...
 * (se encuentra en Supabase Dashboard → Settings → API → service_role key)
 *
 * Estructura de destino en el bucket:
 *   CVU : TA-2026-0012/dia-1.png … TA-2026-0012/dia-6.png   (rsrc/Calabaza/1.png…6.png)
 *   PCC : pcc/PC-2026-0010/foto.png … pcc/PC-2026-0017/foto.png (rsrc/Pimiento/1.png…8.png)
 */

const fs   = require('fs');
const path = require('path');

// ─── Lee .env.local ──────────────────────────────────────────────────────────
const envPath = path.join(__dirname, '..', 'front-pwa', '.env.local');
const env = {};
fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim();
});

const SUPABASE_URL = env['NEXT_PUBLIC_SUPABASE_URL'];
const SERVICE_KEY  = env['SUPABASE_SERVICE_KEY'] || env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];
const BUCKET       = 'lectura-photos';

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_KEY en front-pwa/.env.local');
  process.exit(1);
}

const RSRC = path.join(__dirname, 'rsrc');

// ─── Mapeo: archivo fuente → ruta destino en el bucket ───────────────────────
const uploads = [
  // Calabaza (6 fotos) → CVU tanda TA-2026-0012
  { src: path.join(RSRC, 'Calabaza', '1.png'), dest: 'TA-2026-0012/dia-1.png' },
  { src: path.join(RSRC, 'Calabaza', '2.png'), dest: 'TA-2026-0012/dia-2.png' },
  { src: path.join(RSRC, 'Calabaza', '3.png'), dest: 'TA-2026-0012/dia-3.png' },
  { src: path.join(RSRC, 'Calabaza', '4.png'), dest: 'TA-2026-0012/dia-4.png' },
  { src: path.join(RSRC, 'Calabaza', '5.png'), dest: 'TA-2026-0012/dia-5.png' },
  { src: path.join(RSRC, 'Calabaza', '6.png'), dest: 'TA-2026-0012/dia-6.png' },
  // Pimiento (8 fotos) → PCC partes PC-2026-0010 … PC-2026-0017
  { src: path.join(RSRC, 'Pimiento', '1.png'), dest: 'pcc/PC-2026-0010/foto.png' },
  { src: path.join(RSRC, 'Pimiento', '2.png'), dest: 'pcc/PC-2026-0011/foto.png' },
  { src: path.join(RSRC, 'Pimiento', '3.png'), dest: 'pcc/PC-2026-0012/foto.png' },
  { src: path.join(RSRC, 'Pimiento', '4.png'), dest: 'pcc/PC-2026-0013/foto.png' },
  { src: path.join(RSRC, 'Pimiento', '5.png'), dest: 'pcc/PC-2026-0014/foto.png' },
  { src: path.join(RSRC, 'Pimiento', '6.png'), dest: 'pcc/PC-2026-0015/foto.png' },
  { src: path.join(RSRC, 'Pimiento', '7.png'), dest: 'pcc/PC-2026-0016/foto.png' },
  { src: path.join(RSRC, 'Pimiento', '8.png'), dest: 'pcc/PC-2026-0017/foto.png' },
];

// ─── Función de upload ────────────────────────────────────────────────────────
async function uploadFile({ src, dest }) {
  if (!fs.existsSync(src)) {
    console.warn(`  ⚠️  No encontrado: ${src} — saltando`);
    return;
  }

  const data     = fs.readFileSync(src);
  const mimeType = src.endsWith('.jpg') || src.endsWith('.jpeg') ? 'image/jpeg' : 'image/png';
  const url      = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${dest}`;

  // Intenta PUT (upsert) primero; si falla con 400, usa POST
  let res = await fetch(url, {
    method : 'PUT',
    headers: {
      'Authorization' : `Bearer ${SERVICE_KEY}`,
      'Content-Type'  : mimeType,
      'x-upsert'      : 'true',
    },
    body: data,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`HTTP ${res.status}: ${err}`);
  }

  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${dest}`;
  console.log(`  ✅ ${path.basename(src)} → ${dest}`);
  console.log(`     ${publicUrl}`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n📦 Subiendo ${uploads.length} fotos a Supabase Storage`);
  console.log(`   Bucket : ${BUCKET}`);
  console.log(`   URL    : ${SUPABASE_URL}\n`);

  let ok = 0, fail = 0;
  for (const item of uploads) {
    try {
      await uploadFile(item);
      ok++;
    } catch (e) {
      console.error(`  ❌ ${item.dest}: ${e.message}`);
      fail++;
    }
  }

  console.log(`\n─── Resultado: ${ok} subidas, ${fail} errores ───`);
  if (fail === 0) {
    console.log('✅ Todas las fotos subidas. Ahora ejecuta seed.sql en Supabase.\n');
  } else {
    console.log('⚠️  Revisa los errores antes de ejecutar seed.sql.\n');
    process.exit(1);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
