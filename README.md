# Control de Calidad — PWA

Aplicación web progresiva (PWA) para el control de calidad en líneas de confección de **uva de mesa**. Diseñada para uso en dispositivos móviles sin conexión a internet, con toda la persistencia en `localStorage`.

---

## Descripción

**Control de Calidad** es una herramienta interna para registrar y hacer seguimiento de dos procesos de calidad distintos:

- **CVU — Control de Vida Útil**: seguimiento diario del estado de una tanda de uva en cámara (merma de peso, faltas por categoría, temperatura, calibre).
- **PCC — Parte de Control de Calidad**: toma de muestras en línea de confección, con análisis de defectos por baya y resultado conforme/no conforme.

### Stack tecnológico

| Capa | Tecnología |
|---|---|
| Framework | Next.js (export estático) |
| Lenguaje | JavaScript (JSX) |
| Estilos | CSS modules / variables CSS |
| Persistencia | `localStorage` del navegador |
| Offline | Service Worker (`/sw.js`) — cache-first |
| Instalación | Web App Manifest (`/manifest.json`) |

---

## Módulos

### CVU — Control de Vida Útil

Registra tandas de uva en cámara frigorífica y acumula lecturas diarias. Por cada lectura calcula automáticamente los porcentajes de faltas (leves, graves, eliminatorias) sobre el peso del día, la pérdida de peso respecto al peso inicial y la clasificación resultante (Extra / Clase 1 / Clase 2 / Industria / No conforme).

Genera un informe imprimible en HTML con tabla de evolución, gráficas SVG de peso/temperatura y faltas, y páginas de fotos opcionales.

### PCC — Parte de Control de Calidad

Registra un parte de control puntual sobre una línea activa. El operario configura el formato de envase, rellena una muestra por unidad (hasta 10) anotando peso, calibre, °Brix, coloración, condición del escobajo y conteo de bayas con defectos. El sistema calcula el resultado global conforme/no conforme aplicando umbrales fijos (≤ 5 % defectos totales, tolerancia cero en manchas de sol y podridas, ≥ 11 °Brix, < 5 % fuera de calibre).

---

## Modelo de datos

### `Tanda` — almacenada en `cc_tandas_v1`

Representa una partida de uva entrada en cámara para seguimiento de vida útil.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `string` | Identificador único. Formato: `TA-{año}-{NNNN}` (ej. `TA-2025-0001`) |
| `variety` | `string` | ID de variedad seleccionada en el menú principal (ej. `"uva"`) |
| `confeccion` | `string` | Referencia de confección / línea (obligatorio) |
| `variedad` | `string` | Variedad de uva (texto libre, opcional) |
| `categoriaInicial` | `string` | Categoría en entrada: `"Extra"`, `"Clase I"`, `"Clase II"`, `"Ind."` |
| `trazabilidad` | `string` | Código de trazabilidad / lote (obligatorio) |
| `pesoInicial` | `number` | Peso de la muestra al entrar en cámara, en kg (obligatorio) |
| `fecha` | `string` | Fecha de entrada (`YYYY-MM-DD`) |
| `nota` | `string` | Observaciones libres (opcional) |
| `readings` | `Lectura[]` | Array de lecturas diarias, ordenadas por día |

---

### `Lectura` — campo `readings[]` dentro de `Tanda`

Lectura diaria de una tanda. Se persisten tanto los campos introducidos por el usuario como los calculados automáticamente.

#### Campos de entrada

| Campo | Tipo | Descripción |
|---|---|---|
| `dia` | `number` | Número de día (1, 2, 3 … secuencial) |
| `fecha` | `string` | Fecha de la lectura (`YYYY-MM-DD`) |
| `trazabilidad` | `string` | Trazabilidad heredada/modificada |
| `pesoDiario` | — | *(campo de formulario; se guarda como `pd` tras parsear)* |
| `tempConservacion` | `number \| null` | Temperatura de conservación en °C |
| `pctFueraCalibre` | — | *(campo de formulario; se guarda como `pctCalibre` tras parsear)* |
| `pesoFaltasLeves` | `number` | Peso de bayas con faltas leves, en kg |
| `pesoFaltasGraves` | `number` | Peso de bayas con faltas graves, en kg |
| `pesoFaltasElim` | `number` | Peso de bayas con faltas eliminatorias, en kg |
| `photo` | `string \| null` | Foto de la muestra como data URL base64 (opcional) |

#### Campos Sí/No (faltas booleanas)

Los siguientes campos almacenan `"Si"` o `"No"`.

**Faltas leves** (`CVU_LEVES`):

| Campo | Etiqueta |
|---|---|
| `desgrane` | Desgrane |
| `bayasRotas` | Bayas rotas |
| `escobajoMarron` | Escobajo marrón |
| `bayasDeshidratadas` | Bayas deshidratadas |
| `suciedad` | Presencia suciedad |

**Faltas graves** (`CVU_GRAVES`):

| Campo | Etiqueta |
|---|---|
| `plagaPicado` | Plaga / picado |

**Faltas eliminatorias** (`CVU_ELIM`):

| Campo | Etiqueta |
|---|---|
| `cuerposExtranos` | Cuerpos extraños |
| `podridos` | Podridos |

#### Campos calculados (guardados junto al resto)

Calculados por `calcLectura(form, pesoInicial)` y spread en el objeto antes de persistir.

| Campo | Tipo | Fórmula |
|---|---|---|
| `pd` | `number` | `parseFloat(pesoDiario)` — peso del día en kg |
| `pctPerdida` | `number` | `((pesoInicial - pd) / pesoInicial) × 100` |
| `pctLeves` | `number` | `(pesoFaltasLeves / pd) × 100` |
| `pctGraves` | `number` | `(pesoFaltasGraves / pd) × 100` |
| `pctElim` | `number` | `(pesoFaltasElim / pd) × 100` |
| `pctTotal` | `number` | `pctLeves + pctGraves + pctElim` |
| `pctCalibre` | `number` | `parseFloat(pctFueraCalibre)` |
| `clasificacion` | `string \| null` | Primera clase que supera los umbrales (`CVU_CALIDAD`), o `"No conforme"` |

**Umbrales de clasificación** (`CVU_CALIDAD`):

| Clase | % Elim | % Graves | % Total | % Fuera calibre |
|---|---|---|---|---|
| Extra | = 0 | = 0 | ≤ 2 | — |
| Clase 1 | = 0 | ≤ 2 | ≤ 10 | ≤ 5 |
| Clase 2 | ≤ 1 | ≤ 5 | ≤ 15 | ≤ 5 |
| Industria | ≤ 1 | ≤ 5 | ≤ 20 | ≤ 10 |

---

### `PCC` — almacenado en `cc_pccs_v1`

Parte de control de calidad puntual en línea.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `string` | Identificador único. Formato: `PC-{año}-{NNNN}` (ej. `PC-2025-0001`) |
| `fecha` | `string` | Fecha del parte (`YYYY-MM-DD`) |
| `hora` | `string` | Hora de inicio (`HH:MM`) |
| `responsable` | `string` | Nombre del responsable (opcional) |
| `variedad` | `string` | Variedad: `Sweet Globe`, `Sweet Celebration`, `Candy Snap` (opcional) |
| `trazabilidad` | `string` | Código de trazabilidad (opcional) |
| `cinaNum` | `string` | Número de cinta de línea (opcional) |
| `mesaNum` | `string` | Número de mesa de línea (opcional) |
| `formato` | `string` | ID del formato de envase (ver tabla de formatos) |
| `paraSO2` | `boolean` | Indica si la uva va a tratamiento SO₂ |
| `nMuestras` | `number` | Número de muestras del parte (determinado por el formato) |
| `muestras` | `Muestra[]` | Array de muestras tomadas |
| `resultado` | `"C" \| "NC" \| null` | Resultado global: Conforme / No Conforme |

**Formatos de envase** (`FORMATOS_PCC`):

| ID | Etiqueta | Peso ref. | Nº muestras |
|---|---|---|---|
| `caja-madera` | Caja madera | 7 500 g | 10 |
| `caja-carton` | Caja cartón | 4 500 g | 10 |
| `tarrina-500` | Tarrina ×500 gr | 500 g | 10 |
| `tarrina-1000` | Tarrina ×1000 gr | 1 000 g | 10 |
| `ifco-9` | Caja IFCO | 9 000 g | 10 |
| `granel` | Granel | — | 5 |

---

### `Muestra` — campo `muestras[]` dentro de `PCC`

Una muestra individual tomada de un envase.

| Campo | Tipo | Descripción |
|---|---|---|
| `num` | `number` | Número de muestra (1 … nMuestras) |
| `hora` | `string` | Hora de toma (`HH:MM`) |
| `peso` | `string` | Peso del envase en gramos |
| `calibre` | `string` | Calibre medio de las bayas |
| `pctFueraCalibre` | `string` | % de bayas fuera de calibre |
| `numRacimos` | `string` | Número de racimos en el envase |
| `homogeneidad` | `string` | Homogeneidad del racimo: `"Si"` / `"No"` |
| `condicionEscobajo` | `string` | Escobajo en buen estado: `"Si"` / `"No"` |
| `coloracion` | `string` | Puntuación de coloración (numérico) |
| `brix` | `string` | Grados Brix |
| `totalBayas` | `string` | Total de bayas contadas |
| `otrosDesc` | `string` | Descripción libre para defecto "otros" |

**Conteos de defectos por baya** (`DEFECTOS_BAYAS`) — todos tipo `string` (entero):

| Campo | Etiqueta | Tolerancia cero |
|---|---|---|
| `materiaExtrana` | Materia extraña | No |
| `suciaPolvo` | Sucia / con polvo | No |
| `deshidratadas` | Deshidratadas | No |
| `picadas` | Picada / mordisqueada | No |
| `rotas` | Rotas / desgrane | No |
| `manchasSol` | Manchas de sol | **Sí** |
| `podridas` | Podridas | **Sí** |
| `otros` | Otros | No |

**Regla de resultado de muestra** (`calcMuestraRes`):

Una muestra es **NC** si cumple al menos una de estas condiciones:
- Algún defecto de tolerancia cero (`manchasSol`, `podridas`) tiene count > 0.
- `% defectos totales / totalBayas > 5 %`.
- `pctFueraCalibre ≥ 5 %`.
- `brix < 11`.

**Regla de resultado global PCC** (`calcPCCResultado`):

`resultado = "NC"` si `totalDefectos / totalBayas > 5 %` sobre el conjunto de todas las muestras rellenas.

---

## Configuración (hardcoded → configurable)

Esta sección documenta todos los valores actualmente codificados en el frontend que pasarán a ser gestionados desde la base de datos cuando se integre el backend.

Los valores marcados con la clave `cc_config_v1` ya son editables en la pantalla de **Administración** de la app y se persisten en localStorage. El resto se configurará cuando se integre el backend.

### Empresa

| Campo | Tipo | Descripción | Valor actual |
|---|---|---|---|
| `nombre` | `string` | Razón social impresa en informes | `"Torremesa"` |

### CVU — Clases de calidad (`cc_config_v1 → cvu.clases`)

| Clase | CSS key | maxElim (%) | maxGraves (%) | maxTotal (%) | maxCalibre (%) |
|---|---|---|---|---|---|
| Extra | `class-extra` | 0 | 0 | 2 | — |
| Clase 1 | `class-1` | 0 | 2 | 10 | 5 |
| Clase 2 | `class-2` | 1 | 5 | 15 | 5 |
| Industria | `class-ind` | 1 | 5 | 20 | 10 |

### CVU — Tipos de defecto (actualmente estáticos, configurables en fase backend)

**CVU_LEVES** (5 items):

| key | label |
|---|---|
| `desgrane` | Desgrane |
| `bayasRotas` | Bayas rotas |
| `escobajoMarron` | Escobajo marrón |
| `bayasDeshidratadas` | Bayas deshidratadas |
| `suciedad` | Presencia suciedad |

**CVU_GRAVES** (1 item):

| key | label |
|---|---|
| `plagaPicado` | Plaga / picado |

**CVU_ELIM** (2 items):

| key | label |
|---|---|
| `cuerposExtranos` | Cuerpos extraños |
| `podridos` | Podridos |

Todos los items tienen `okVal: 'No'` (valor que indica ausencia de falta).

### PCC — Variedades (`cc_config_v1 → pcc.variedades`)

Lista actual: `Sweet Globe`, `Sweet Celebration`, `Candy Snap`.

### PCC — Formatos de envase (`cc_config_v1 → pcc.formatos`)

| ID | Etiqueta | Peso ref. (g) | Nº muestras |
|---|---|---|---|
| `caja-madera` | Caja madera | 7 500 | 10 |
| `caja-carton` | Caja cartón | 4 500 | 10 |
| `tarrina-500` | Tarrina ×500 gr | 500 | 10 |
| `tarrina-1000` | Tarrina ×1000 gr | 1 000 | 10 |
| `ifco-9` | Caja IFCO | 9 000 | 10 |
| `granel` | Granel | — | 5 |

### PCC — Umbrales de aceptación (`cc_config_v1 → pcc.umbrales`)

| Parámetro | Valor actual | Descripción |
|---|---|---|
| `maxDefectosPct` | 5 % | Máx. defectos totales sobre bayas contadas |
| `minBrix` | 11° | Mínimo °Brix aceptable (tolerancia ±1°) |
| `maxCalibrePct` | 5 % | Máx. % bayas fuera de calibre |

### PCC — Defectos por baya (actualmente estáticos, configurables en fase backend)

| key | label | tolerancia_cero |
|---|---|---|
| `materiaExtrana` | Materia extraña | No |
| `suciaPolvo` | Sucia / con polvo | No |
| `deshidratadas` | Deshidratadas | No |
| `picadas` | Picada / mordisqueada | No |
| `rotas` | Rotas / desgrane | No |
| `manchasSol` | Manchas de sol | **Sí** |
| `podridas` | Podridas | **Sí** |
| `otros` | Otros | No |

---

## Almacenamiento

Toda la persistencia es cliente-side mediante `localStorage`. No hay backend ni base de datos.

| Clave localStorage | Contenido | Estructura |
|---|---|---|
| `cc_tandas_v1` | Historial de tandas CVU | `Tanda[]` serializado como JSON |
| `cc_pccs_v1` | Historial de partes PCC | `PCC[]` serializado como JSON |

Los arrays se reescriben completos en cada operación de escritura (`saveBatches`, `savePCCs`). No hay paginación ni límite explícito de registros; el único límite es la cuota de `localStorage` del navegador (habitualmente 5–10 MB).

Las fotos en las lecturas CVU se almacenan como data URL (`base64`) dentro del propio objeto `Lectura`, lo que puede hacer crecer considerablemente el tamaño de `cc_tandas_v1` si se adjuntan imágenes de alta resolución.

---

## PWA

### Service Worker

El archivo `/public/sw.js` se registra en producción desde `pages/index.js`:

```js
navigator.serviceWorker.register('/sw.js')
```

Estrategia: **cache-first**. El SW intercepta las peticiones de activos estáticos y los sirve desde caché; cuando detecta una nueva versión del SW instalado, muestra un banner de "Nueva versión disponible" que llama a `SKIP_WAITING` y recarga la página.

### Instalación

La aplicación incluye un Web App Manifest en `/public/manifest.json` con `theme-color: #2e6b2e`. Para instalarla:

- **Android (Chrome/Edge)**: aparece el banner de instalación automáticamente o usar "Añadir a pantalla de inicio" en el menú del navegador.
- **iOS (Safari)**: botón Compartir → "Añadir a pantalla de inicio".
- **Escritorio**: icono de instalación en la barra de direcciones de Chrome/Edge.

Una vez instalada, la aplicación funciona completamente sin conexión. Los datos permanecen en el `localStorage` del perfil del navegador en el que se instaló.

---

## Migración a backend — Supabase

### Esquema SQL

Schema completo listo para ejecutar en el SQL Editor de Supabase (PostgreSQL).

```sql
-- ─── Configuración ────────────────────────────────────────────────────────────

CREATE TABLE config_empresa (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre     text NOT NULL DEFAULT 'Torremesa',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE config_variedades (
  id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  modulo  text NOT NULL CHECK (modulo IN ('cvu', 'pcc')),
  codigo  text NOT NULL,
  nombre  text NOT NULL,
  icono   text,
  activo  bool NOT NULL DEFAULT true,
  orden   int  NOT NULL DEFAULT 0
);

CREATE TABLE config_formatos_pcc (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo      text NOT NULL UNIQUE,
  nombre      text NOT NULL,
  descripcion text,
  peso_ref_g  int,
  n_muestras  int  NOT NULL DEFAULT 10,
  activo      bool NOT NULL DEFAULT true
);

CREATE TABLE config_clases_cvu (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre          text NOT NULL,
  orden           int  NOT NULL DEFAULT 0,
  max_pct_elim    numeric(5,2),
  max_pct_graves  numeric(5,2),
  max_pct_total   numeric(5,2),
  max_pct_calibre numeric(5,2)
);

CREATE TABLE config_defectos_cvu (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  severidad text NOT NULL CHECK (severidad IN ('leve', 'grave', 'elim')),
  clave     text NOT NULL UNIQUE,
  etiqueta  text NOT NULL,
  valor_ok  text NOT NULL DEFAULT 'No',
  activo    bool NOT NULL DEFAULT true,
  orden     int  NOT NULL DEFAULT 0
);

CREATE TABLE config_defectos_pcc (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clave           text NOT NULL UNIQUE,
  etiqueta        text NOT NULL,
  tolerancia_cero bool NOT NULL DEFAULT false,
  activo          bool NOT NULL DEFAULT true,
  orden           int  NOT NULL DEFAULT 0
);

CREATE TABLE config_umbrales_pcc (
  id                uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  max_defectos_pct  numeric(5,2) NOT NULL DEFAULT 5,
  min_brix          numeric(4,1) NOT NULL DEFAULT 11,
  max_calibre_pct   numeric(5,2) NOT NULL DEFAULT 5
);

-- ─── Datos ───────────────────────────────────────────────────────────────────

CREATE TABLE tandas (
  id                text        PRIMARY KEY,  -- TA-YYYY-NNNN
  variety           text,
  confeccion        text        NOT NULL,
  variedad          text,
  categoria_inicial text,
  trazabilidad      text        NOT NULL,
  peso_inicial      numeric(10,3) NOT NULL,
  fecha             date        NOT NULL,
  nota              text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE lecturas (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tanda_id              text        NOT NULL REFERENCES tandas(id) ON DELETE CASCADE,
  dia                   int         NOT NULL,
  fecha                 date        NOT NULL,
  trazabilidad          text,
  peso_diario           numeric(10,3),
  temp_conservacion     numeric(5,1),
  desgrane              text,
  bayas_rotas           text,
  escobajo_marron       text,
  bayas_deshidratadas   text,
  suciedad              text,
  plaga_picado          text,
  cuerpos_extranos      text,
  podridos              text,
  peso_faltas_leves     numeric(10,3) NOT NULL DEFAULT 0,
  peso_faltas_graves    numeric(10,3) NOT NULL DEFAULT 0,
  peso_faltas_elim      numeric(10,3) NOT NULL DEFAULT 0,
  pct_perdida           numeric(6,3),
  pct_leves             numeric(6,3),
  pct_graves            numeric(6,3),
  pct_elim              numeric(6,3),
  pct_total             numeric(6,3),
  pct_calibre           numeric(6,3),
  clasificacion         text,
  photo_url             text,   -- URL en Supabase Storage (bucket: lectura-photos)
  created_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tanda_id, dia)
);

CREATE TABLE partes_pcc (
  id          text  PRIMARY KEY,  -- PC-YYYY-NNNN
  fecha       date  NOT NULL,
  hora        time,
  responsable text,
  variedad    text,
  trazabilidad text,
  cinta_num   text,
  mesa_num    text,
  formato_id  text REFERENCES config_formatos_pcc(codigo),
  para_so2    bool NOT NULL DEFAULT false,
  n_muestras  int  NOT NULL DEFAULT 10,
  resultado   text CHECK (resultado IN ('C', 'NC')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE muestras_pcc (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parte_id            text NOT NULL REFERENCES partes_pcc(id) ON DELETE CASCADE,
  num                 int  NOT NULL,
  hora                time,
  peso_g              numeric(8,1),
  calibre_mm          numeric(5,1),
  pct_fuera_calibre   numeric(5,2),
  num_racimos         int,
  homogeneidad        text,
  condicion_escobajo  text,
  coloracion          int,
  brix                numeric(4,1),
  total_bayas         int,
  materia_extrana     int NOT NULL DEFAULT 0,
  sucia_polvo         int NOT NULL DEFAULT 0,
  deshidratadas       int NOT NULL DEFAULT 0,
  picadas             int NOT NULL DEFAULT 0,
  rotas               int NOT NULL DEFAULT 0,
  manchas_sol         int NOT NULL DEFAULT 0,
  podridas            int NOT NULL DEFAULT 0,
  otros               int NOT NULL DEFAULT 0,
  otros_desc          text,
  pct_defectos        numeric(6,3),
  resultado           text CHECK (resultado IN ('C', 'NC')),
  UNIQUE (parte_id, num)
);

-- ─── Storage ─────────────────────────────────────────────────────────────────
-- Crear bucket "lectura-photos" en Supabase Dashboard → Storage.
-- Las fotos actualmente almacenadas como base64 en cc_tandas_v1 (campo photo)
-- se migran a este bucket; photo_url en lecturas apunta a la URL pública.

-- ─── RLS ─────────────────────────────────────────────────────────────────────
-- Habilitar RLS en todas las tablas. Para MVP single-tenant, una policy
-- USING (true) con autenticación básica es suficiente.

ALTER TABLE config_empresa        ENABLE ROW LEVEL SECURITY;
ALTER TABLE config_variedades     ENABLE ROW LEVEL SECURITY;
ALTER TABLE config_formatos_pcc   ENABLE ROW LEVEL SECURITY;
ALTER TABLE config_clases_cvu     ENABLE ROW LEVEL SECURITY;
ALTER TABLE config_defectos_cvu   ENABLE ROW LEVEL SECURITY;
ALTER TABLE config_defectos_pcc   ENABLE ROW LEVEL SECURITY;
ALTER TABLE config_umbrales_pcc   ENABLE ROW LEVEL SECURITY;
ALTER TABLE tandas                ENABLE ROW LEVEL SECURITY;
ALTER TABLE lecturas              ENABLE ROW LEVEL SECURITY;
ALTER TABLE partes_pcc            ENABLE ROW LEVEL SECURITY;
ALTER TABLE muestras_pcc          ENABLE ROW LEVEL SECURITY;

-- Policy MVP (ajustar cuando se implemente multi-tenant):
CREATE POLICY "allow_all_authenticated" ON config_empresa        FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_authenticated" ON config_variedades     FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_authenticated" ON config_formatos_pcc   FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_authenticated" ON config_clases_cvu     FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_authenticated" ON config_defectos_cvu   FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_authenticated" ON config_defectos_pcc   FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_authenticated" ON config_umbrales_pcc   FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_authenticated" ON tandas                FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_authenticated" ON lecturas              FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_authenticated" ON partes_pcc            FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_authenticated" ON muestras_pcc          FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

### Prompt para Claude Code

El siguiente bloque puede pegarse directamente en Claude Code para arrancar la integración con Supabase:

````
Contexto: tengo una Next.js PWA llamada "Control de Calidad" (pwa-vc/) para
gestión de calidad de uva de mesa. Actualmente persiste todo en localStorage.
Quiero migrar la persistencia a Supabase manteniendo la interfaz de funciones
existente en lib/storage.js para no romper el resto del código.

Lee el README.md del proyecto para entender el modelo de datos completo antes
de empezar.

Tareas a realizar en orden:

1. **Crear todas las tablas en Supabase**
   Ejecuta el schema SQL completo que aparece en la sección
   "## Migración a backend — Supabase → Esquema SQL" del README.md.
   Usa el cliente de Supabase CLI o el MCP de Supabase si está disponible.

2. **Crear lib/supabase.js**
   Archivo cliente de Supabase para Next.js:
   ```js
   import { createClient } from '@supabase/supabase-js'
   const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL
   const supabaseKey  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
   export const supabase = createClient(supabaseUrl, supabaseKey)
   ```
   Añade también NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY
   al archivo .env.local (sin valores reales, solo las claves vacías a rellenar).

3. **Crear lib/api.js** con las mismas firmas que lib/storage.js pero usando
   Supabase en lugar de localStorage:
   - `loadBatches()` → SELECT * FROM tandas + JOIN lecturas ORDER BY fecha DESC
   - `saveBatch(batch)` → UPSERT en tandas + UPSERT en lecturas (array readings[])
   - `deleteBatch(id)` → DELETE FROM tandas WHERE id = $id (CASCADE borra lecturas)
   - `loadPCCs()` → SELECT * FROM partes_pcc + JOIN muestras_pcc ORDER BY fecha DESC
   - `savePCC(pcc)` → UPSERT en partes_pcc + UPSERT en muestras_pcc (array muestras[])
   - `deletePCC(id)` → DELETE FROM partes_pcc WHERE id = $id (CASCADE borra muestras)
   Todas las funciones deben ser async y manejar errores lanzando excepciones
   descriptivas.

4. **Migrar almacenamiento de fotos a Supabase Storage**
   - El bucket se llama `lectura-photos`.
   - En lib/api.js, cuando saveBatch() encuentre una lectura con campo `photo`
     que sea un data URL base64, súbela al bucket como
     `{tanda_id}/dia-{dia}.jpg`, obtén la URL pública y guárdala en `photo_url`.
     No almacenes el base64 en la tabla lecturas.
   - En loadBatches(), mapea photo_url de vuelta al campo `photo` para que el
     resto del código no note la diferencia.

5. **Crear lib/configApi.js** con un loader que lea la configuración desde las
   tablas de config en lugar de localStorage:
   - `loadConfigFromDB()` → lee config_empresa, config_clases_cvu,
     config_defectos_cvu, config_defectos_pcc, config_formatos_pcc,
     config_variedades (WHERE modulo='pcc') y config_umbrales_pcc, y devuelve
     un objeto con la misma forma que DEFAULT_CONFIG en lib/config.js.
   - `saveConfigToDB(config)` → escribe los cambios de vuelta a las tablas
     correspondientes.
   - Mantén lib/config.js y su DEFAULT_CONFIG sin cambios como fallback offline.

No toques todavía los componentes de pantalla (screens/) ni pages/. El objetivo
es tener lib/api.js y lib/configApi.js listos y testeables de forma aislada.
````
