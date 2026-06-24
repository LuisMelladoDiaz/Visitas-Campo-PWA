-- =============================================================================
-- schema.sql — Torremesa S.A. — Sistema de Control de Calidad Multi-Producto
-- Base de datos: Supabase / PostgreSQL
-- Módulos: Vida Útil (CVU) + Control Calidad Producción (PCC)
-- Productos: uva, remolacha, boniato, calabaza, pimiento
-- =============================================================================
-- IMPORTANTE: Ejecutar en Supabase Dashboard → SQL Editor
-- Borra y recrea todas las tablas. Ejecutar ANTES de seed.sql.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0. EXTENSIONES
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- =============================================================================
-- 1. DROP TABLES (orden inverso de dependencias: hojas primero)
-- =============================================================================

DROP TABLE IF EXISTS muestras_pcc         CASCADE;
DROP TABLE IF EXISTS partes_pcc           CASCADE;
DROP TABLE IF EXISTS lecturas             CASCADE;
DROP TABLE IF EXISTS tandas               CASCADE;

DROP TABLE IF EXISTS config_umbrales_pcc  CASCADE;
DROP TABLE IF EXISTS config_defectos_pcc  CASCADE;
DROP TABLE IF EXISTS config_formatos_pcc  CASCADE;
DROP TABLE IF EXISTS config_defectos_cvu  CASCADE;
DROP TABLE IF EXISTS config_clases_cvu    CASCADE;
DROP TABLE IF EXISTS config_variedades    CASCADE;
DROP TABLE IF EXISTS config_empresa       CASCADE;
DROP TABLE IF EXISTS config_productos     CASCADE;


-- =============================================================================
-- 2. TABLAS DE CONFIGURACIÓN
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 2.1 config_productos — Catálogo maestro de productos hortofrutícolas
-- ---------------------------------------------------------------------------
CREATE TABLE config_productos (
    id         TEXT    PRIMARY KEY,             -- 'uva', 'remolacha', 'boniato', 'calabaza', 'pimiento'
    nombre     TEXT    NOT NULL,
    icono      TEXT,                            -- Emoji representativo del producto
    tiene_cvu  BOOLEAN NOT NULL DEFAULT FALSE,  -- Participa en el módulo Vida Útil (CVU)
    tiene_pcc  BOOLEAN NOT NULL DEFAULT FALSE,  -- Participa en el módulo Control Calidad Producción (PCC)
    activo     BOOLEAN NOT NULL DEFAULT TRUE,
    orden      INT     NOT NULL DEFAULT 99
);

COMMENT ON TABLE  config_productos           IS 'Catálogo maestro de productos. Define qué módulos (CVU/PCC) aplican a cada uno.';
COMMENT ON COLUMN config_productos.id        IS 'Clave corta del producto usada como FK en todo el esquema: uva, remolacha, boniato, calabaza, pimiento.';
COMMENT ON COLUMN config_productos.tiene_cvu IS 'TRUE si el producto aparece en el módulo Vida Útil.';
COMMENT ON COLUMN config_productos.tiene_pcc IS 'TRUE si el producto aparece en el módulo PCC.';


-- ---------------------------------------------------------------------------
-- 2.2 config_empresa — Datos de la empresa (fila única)
-- ---------------------------------------------------------------------------
CREATE TABLE config_empresa (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre     TEXT        NOT NULL DEFAULT 'Torremesa',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE config_empresa IS 'Configuración global de la empresa. Se espera una única fila.';


-- ---------------------------------------------------------------------------
-- 2.3 config_variedades — Variedades comerciales por producto
--     Sustituye el antiguo diseño con modulo='cvu'/'pcc'.
--     Ahora se vincula directamente al producto.
-- ---------------------------------------------------------------------------
CREATE TABLE config_variedades (
    id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    producto_id TEXT    NOT NULL REFERENCES config_productos(id) ON DELETE CASCADE,
    codigo      TEXT    NOT NULL,   -- Slug corto, p.ej. 'sweet-globe'
    nombre      TEXT    NOT NULL,   -- Nombre comercial, p.ej. 'Sweet Globe'
    activo      BOOLEAN NOT NULL DEFAULT TRUE,
    orden       INT     NOT NULL DEFAULT 99,
    UNIQUE (producto_id, codigo)
);

COMMENT ON TABLE  config_variedades             IS 'Variedades comerciales por producto. Reemplaza el antiguo campo modulo (cvu/pcc).';
COMMENT ON COLUMN config_variedades.producto_id IS 'Producto al que pertenece la variedad.';
COMMENT ON COLUMN config_variedades.codigo      IS 'Slug único dentro del producto, usado en selectores de la PWA.';


-- ---------------------------------------------------------------------------
-- 2.4 config_clases_cvu — Clases de calidad para el módulo Vida Útil
--     producto_id NULL = aplica a todos los productos CVU
-- ---------------------------------------------------------------------------
CREATE TABLE config_clases_cvu (
    id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    producto_id      TEXT          REFERENCES config_productos(id) ON DELETE CASCADE,  -- NULL = universal
    nombre           TEXT          NOT NULL,                -- 'Extra', 'Clase 1', 'Clase 2', 'Industria'
    css_key          TEXT          NOT NULL,                -- Clave CSS para colores en la PWA
    orden            INT           NOT NULL DEFAULT 99,
    max_pct_leves    NUMERIC(5,2),                          -- % máx. de defectos leves permitidos
    max_pct_elim     NUMERIC(5,2),                          -- % máx. de defectos eliminatorios
    max_pct_graves   NUMERIC(5,2),                          -- % máx. de defectos graves
    max_pct_total    NUMERIC(5,2),                          -- % máx. total de defectos
    max_pct_calibre  NUMERIC(5,2)                           -- % máx. fuera de calibre (nullable)
);

COMMENT ON TABLE  config_clases_cvu             IS 'Clases de calidad (Extra, Clase 1, Clase 2, Industria) con umbrales de defectos. producto_id NULL = aplica a todos los productos CVU.';
COMMENT ON COLUMN config_clases_cvu.producto_id IS 'NULL = la clase aplica a todos los productos CVU.';
COMMENT ON COLUMN config_clases_cvu.css_key     IS 'Clave usada en la PWA para aplicar estilos de color según la clase.';


-- ---------------------------------------------------------------------------
-- 2.5 config_defectos_cvu — Catálogo de defectos por producto (Vida Útil)
-- ---------------------------------------------------------------------------
CREATE TABLE config_defectos_cvu (
    id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    producto_id TEXT    NOT NULL REFERENCES config_productos(id) ON DELETE CASCADE,
    severidad   TEXT    NOT NULL CHECK (severidad IN ('leve', 'grave', 'elim')),
    clave       TEXT    NOT NULL,   -- Key camelCase en el JSONB lecturas.defectos
    etiqueta    TEXT    NOT NULL,   -- Texto mostrado en la interfaz
    valor_ok    TEXT    NOT NULL DEFAULT 'No',  -- Valor que indica "sin defecto"
    activo      BOOLEAN NOT NULL DEFAULT TRUE,
    orden       INT     NOT NULL DEFAULT 99,
    UNIQUE (producto_id, clave)
);

COMMENT ON TABLE  config_defectos_cvu           IS 'Defectos posibles en el módulo CVU, clasificados por severidad. La clave coincide con la key del JSONB en lecturas.defectos.';
COMMENT ON COLUMN config_defectos_cvu.clave     IS 'Identificador camelCase del defecto. Debe coincidir con la key en lecturas.defectos JSONB.';
COMMENT ON COLUMN config_defectos_cvu.valor_ok  IS 'Valor que representa "sin defecto". Por defecto "No".';


-- ---------------------------------------------------------------------------
-- 2.6 config_formatos_pcc — Formatos de envase para PCC
--     producto_id NULL = formato universal (cualquier producto)
-- ---------------------------------------------------------------------------
CREATE TABLE config_formatos_pcc (
    id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    producto_id  TEXT    REFERENCES config_productos(id) ON DELETE CASCADE,  -- NULL = universal
    codigo       TEXT    NOT NULL UNIQUE,   -- Slug único, p.ej. 'caja-madera'
    nombre       TEXT    NOT NULL,
    descripcion  TEXT,
    peso_ref_g   INT,                       -- Peso de referencia en gramos (NULL = variable)
    n_muestras   INT     NOT NULL DEFAULT 10,
    activo       BOOLEAN NOT NULL DEFAULT TRUE
);

COMMENT ON TABLE  config_formatos_pcc            IS 'Formatos de envase o presentación usados en el PCC. producto_id NULL = aplicable a cualquier producto.';
COMMENT ON COLUMN config_formatos_pcc.peso_ref_g IS 'Peso de referencia del envase en gramos. NULL si el formato es a granel o peso variable.';
COMMENT ON COLUMN config_formatos_pcc.n_muestras IS 'Número de muestras estándar para este formato.';


-- ---------------------------------------------------------------------------
-- 2.7 config_defectos_pcc — Catálogo de defectos por producto (PCC)
-- ---------------------------------------------------------------------------
CREATE TABLE config_defectos_pcc (
    id               UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    producto_id      TEXT    NOT NULL REFERENCES config_productos(id) ON DELETE CASCADE,
    clave            TEXT    NOT NULL,   -- Key en JSONB muestras_pcc.mediciones
    etiqueta         TEXT    NOT NULL,
    tolerancia_cero  BOOLEAN NOT NULL DEFAULT FALSE,  -- TRUE = defecto crítico, cualquier unidad → NC
    activo           BOOLEAN NOT NULL DEFAULT TRUE,
    orden            INT     NOT NULL DEFAULT 99,
    UNIQUE (producto_id, clave)
);

COMMENT ON TABLE  config_defectos_pcc                  IS 'Defectos a revisar en el PCC por producto. La clave coincide con la key en muestras_pcc.mediciones JSONB.';
COMMENT ON COLUMN config_defectos_pcc.tolerancia_cero  IS 'TRUE = tolerancia cero. Cualquier unidad con este defecto implica resultado NC.';


-- ---------------------------------------------------------------------------
-- 2.8 config_umbrales_pcc — Umbrales de aceptación por producto (PCC)
--     producto_id NULL = umbrales universales
-- ---------------------------------------------------------------------------
CREATE TABLE config_umbrales_pcc (
    id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    producto_id       TEXT          REFERENCES config_productos(id) ON DELETE CASCADE,  -- NULL = universal
    max_defectos_pct  NUMERIC(5,2)  NOT NULL DEFAULT 15,  -- % máx. total de defectos para resultado C
    min_brix          NUMERIC(4,1),                        -- Brix mínimo (NULL si no aplica al producto)
    max_calibre_pct   NUMERIC(5,2)                         -- % máx. fuera de calibre (NULL si no aplica)
);

COMMENT ON TABLE  config_umbrales_pcc             IS 'Umbrales de aceptación del PCC por producto. producto_id NULL = aplica a todos.';
COMMENT ON COLUMN config_umbrales_pcc.min_brix    IS 'Grados Brix mínimos requeridos. NULL si el producto no tiene control de Brix.';
COMMENT ON COLUMN config_umbrales_pcc.producto_id IS 'NULL = umbrales universales para cualquier producto sin umbral específico.';


-- =============================================================================
-- 3. TABLAS DE DATOS OPERACIONALES
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 3.1 tandas — Lotes del módulo Vida Útil (CVU)
-- ---------------------------------------------------------------------------
CREATE TABLE tandas (
    id                TEXT        PRIMARY KEY,   -- Formato: 'TA-YYYY-NNNN'
    producto_id       TEXT        NOT NULL REFERENCES config_productos(id),
    variedad          TEXT,                      -- Nombre de variedad (desnormalizado para historial)
    confeccion        TEXT        NOT NULL,      -- Nº de confección / referencia de línea
    categoria_inicial TEXT,                      -- Categoría objetivo inicial (Extra, Clase 1, etc.)
    trazabilidad      TEXT        NOT NULL,      -- Código de trazabilidad del lote
    peso_inicial      NUMERIC(10,3),             -- Peso inicial del lote en kg
    fecha             DATE,                      -- Fecha de inicio de la tanda
    nota              TEXT,                      -- Observaciones libres
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  tandas              IS 'Lotes registrados para seguimiento de Vida Útil. Cada tanda es un batch de un producto concreto.';
COMMENT ON COLUMN tandas.id           IS 'ID con formato TA-YYYY-NNNN generado por la aplicación.';
COMMENT ON COLUMN tandas.variedad     IS 'Nombre de la variedad (texto libre, desnormalizado para preservar historial).';
COMMENT ON COLUMN tandas.peso_inicial IS 'Peso total del lote en kg al inicio del seguimiento.';


-- ---------------------------------------------------------------------------
-- 3.2 lecturas — Lecturas diarias de seguimiento CVU
-- ---------------------------------------------------------------------------
CREATE TABLE lecturas (
    id                 UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    tanda_id           TEXT          NOT NULL REFERENCES tandas(id) ON DELETE CASCADE,
    dia                INT           NOT NULL,    -- Número de día de seguimiento (1, 2, 3…)
    fecha              DATE,
    trazabilidad       TEXT,                      -- Trazabilidad de esta lectura (puede diferir de la tanda)
    peso_diario        NUMERIC(10,3),             -- Peso del lote en este día (kg)
    temp_conservacion  NUMERIC(5,1),              -- Temperatura de conservación (°C)

    -- Defectos en JSONB: flexible según el producto de la tanda.
    -- Uva:       {"desgrane":"Si","bayasRotas":"No","escobajoMarron":"No","bayasDeshidratadas":"No","suciedad":"No","plagaPicado":"No","cuerposExtranos":"No","podridos":"No"}
    -- Remolacha: {"golpesHeridasManchas":"No","puntasRotas":"No","defectosApariencia":"No","hojaVieja":"No","puntaBlancaHumeda":"No","daNosMecanicos":"No","suciedad":"No","plagaPicado":"No","cuerposExtranos":"No","podridos":"No","rotosRajados":"No"}
    -- Boniato:   {"despellejados":"No","puntasRotas":"No","defectosApariencia":"No","rebrotesMayores5mm":"No","puntasDeshidratadas30mm":"No","densidadRaices":"No","daNosMecanicos":"No","plagaPicado":"No","cuerposExtranos":"No","podridos":"No","rotosRajados":"No"}
    -- Calabaza:  {"defectosApariencia":"No","puntasDeshidratadas30mm":"No","densidadRaices":"No","daNosMecanicos":"No","plagaPicado":"No","cuerposExtranos":"No","podridos":"No","rotosRajados":"No"}
    defectos           JSONB         NOT NULL DEFAULT '{}',

    peso_faltas_leves  NUMERIC(10,3) NOT NULL DEFAULT 0,  -- Peso de muestra con defectos leves (kg)
    peso_faltas_graves NUMERIC(10,3) NOT NULL DEFAULT 0,  -- Peso de muestra con defectos graves (kg)
    peso_faltas_elim   NUMERIC(10,3) NOT NULL DEFAULT 0,  -- Peso de muestra con defectos eliminatorios (kg)

    -- Porcentajes calculados (pueden calcularse en app o almacenarse aquí)
    pct_perdida        NUMERIC(6,3),  -- % pérdida de peso vs. peso_inicial de la tanda
    pct_leves          NUMERIC(6,3),
    pct_graves         NUMERIC(6,3),
    pct_elim           NUMERIC(6,3),
    pct_total          NUMERIC(6,3),  -- pct_leves + pct_graves + pct_elim
    pct_calibre        NUMERIC(6,3),  -- % fuera de calibre (si aplica al producto)

    clasificacion      TEXT,          -- Clase resultante: 'Extra', 'Clase 1', 'Clase 2', 'Industria'
    photo_url          TEXT,          -- URL foto en Supabase Storage (bucket: lectura-photos)

    created_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    UNIQUE (tanda_id, dia)            -- Una lectura por día y tanda
);

COMMENT ON TABLE  lecturas              IS 'Lecturas diarias del seguimiento Vida Útil. Una fila por día y tanda.';
COMMENT ON COLUMN lecturas.defectos     IS 'JSONB con los defectos del día. Las claves deben coincidir con config_defectos_cvu.clave para el producto correspondiente.';
COMMENT ON COLUMN lecturas.dia          IS 'Número de día de seguimiento comenzando en 1.';
COMMENT ON COLUMN lecturas.pct_perdida  IS '% de pérdida de peso: ((peso_inicial - peso_diario) / peso_inicial) * 100.';


-- ---------------------------------------------------------------------------
-- 3.3 partes_pcc — Partes de Control de Calidad de Producción
-- ---------------------------------------------------------------------------
CREATE TABLE partes_pcc (
    id           TEXT        PRIMARY KEY,    -- Formato: 'PC-YYYY-NNNN'
    producto_id  TEXT        NOT NULL REFERENCES config_productos(id),
    fecha        DATE,
    hora         TIME,
    responsable  TEXT,                       -- Nombre del técnico responsable
    variedad     TEXT,                       -- Variedad (texto libre, desnormalizado)
    trazabilidad TEXT,
    cinta_num    TEXT,                       -- Nº de cinta / línea de producción
    mesa_num     TEXT,                       -- Nº de mesa de confección
    formato_id   TEXT        REFERENCES config_formatos_pcc(codigo),

    -- Datos extra en JSONB: campos específicos de producto.
    -- Uva:      {"para_so2": false}
    -- Pimiento: {"calibre":"+10CM","coloracion":"ALTA_ROJO","longitud_media":15.2,"longitud_max":18.0,"longitud_min":12.0,"globalgap":true,"pedido":"PED-2026-050"}
    -- Calabaza: {"calibre_range":"601-900","coloracion":"MEDIA","globalgap":false,"pedido":"PED-2026-051"}
    datos_extra  JSONB       NOT NULL DEFAULT '{}',

    n_muestras   INT         NOT NULL DEFAULT 10,
    resultado    TEXT        CHECK (resultado IN ('C', 'NC')),  -- C = Conforme, NC = No Conforme
    foto_url     TEXT,                                         -- URL pública en Supabase Storage (bucket: lectura-photos/pcc/...)

    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  partes_pcc             IS 'Parte de control de calidad de producción. Agrupa todas las muestras de un control puntual.';
COMMENT ON COLUMN partes_pcc.id          IS 'ID con formato PC-YYYY-NNNN generado por la aplicación.';
COMMENT ON COLUMN partes_pcc.datos_extra IS 'JSONB con campos específicos de producto: para_so2 (uva), calibre/coloracion/globalgap (pimiento/calabaza), etc.';
COMMENT ON COLUMN partes_pcc.resultado   IS 'C = Conforme, NC = No Conforme. Se calcula a partir de las muestras individuales.';


-- ---------------------------------------------------------------------------
-- 3.4 muestras_pcc — Muestras individuales de cada parte PCC
-- ---------------------------------------------------------------------------
CREATE TABLE muestras_pcc (
    id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    parte_id     TEXT    NOT NULL REFERENCES partes_pcc(id) ON DELETE CASCADE,
    num          INT     NOT NULL,   -- Número de muestra dentro del parte (1..n_muestras)
    hora         TIME,               -- Hora de toma de la muestra

    -- Mediciones en JSONB: flexible según el producto del parte.
    -- Uva:
    --   {"peso":"4450","calibre":"17.5","pctFueraCalibre":"2.0","numRacimos":"4",
    --    "homogeneidad":"Si","condicionEscobajo":"Si","coloracion":"4","brix":"13.5",
    --    "totalBayas":"120","materiaExtrana":0,"suciaPolvo":1,"deshidratadas":0,
    --    "picadas":0,"rotas":2,"manchasSol":0,"podridas":0,"otros":0}
    -- Pimiento:
    --   {"peso":5000,"temperatura":12.5,
    --    "defectos":{"materiasExtranas":{"unidades":0,"pct":0},"sucio":{"unidades":1,"pct":0.5},...},
    --    "total_pct":3.0,"observaciones":""}
    -- Calabaza: similar a pimiento con sus propios defectos
    mediciones   JSONB   NOT NULL DEFAULT '{}',

    pct_defectos NUMERIC(6,3),  -- % total de defectos calculado para esta muestra
    resultado    TEXT    CHECK (resultado IN ('C', 'NC')),

    UNIQUE (parte_id, num)
);

COMMENT ON TABLE  muestras_pcc             IS 'Mediciones de cada muestra individual dentro de un parte PCC.';
COMMENT ON COLUMN muestras_pcc.num         IS 'Número secuencial de la muestra dentro del parte, comenzando en 1.';
COMMENT ON COLUMN muestras_pcc.mediciones  IS 'JSONB con todas las mediciones: peso, calibre, brix, defectos, etc. La estructura varía según el producto.';


-- =============================================================================
-- 4. ÍNDICES
-- =============================================================================

-- Consultas frecuentes por producto y fecha
CREATE INDEX idx_tandas_producto          ON tandas       (producto_id);
CREATE INDEX idx_tandas_fecha             ON tandas       (fecha DESC);
CREATE INDEX idx_lecturas_tanda           ON lecturas     (tanda_id);
CREATE INDEX idx_lecturas_fecha           ON lecturas     (fecha DESC);
CREATE INDEX idx_partes_pcc_producto      ON partes_pcc   (producto_id);
CREATE INDEX idx_partes_pcc_fecha         ON partes_pcc   (fecha DESC);
CREATE INDEX idx_muestras_pcc_parte       ON muestras_pcc (parte_id);

-- Índices de configuración
CREATE INDEX idx_variedades_producto      ON config_variedades   (producto_id);
CREATE INDEX idx_defectos_cvu_producto    ON config_defectos_cvu (producto_id);
CREATE INDEX idx_defectos_pcc_producto    ON config_defectos_pcc (producto_id);
CREATE INDEX idx_clases_cvu_producto      ON config_clases_cvu   (producto_id);
CREATE INDEX idx_formatos_pcc_producto    ON config_formatos_pcc (producto_id);
CREATE INDEX idx_umbrales_pcc_producto    ON config_umbrales_pcc (producto_id);

-- Índices GIN para búsquedas dentro de JSONB
CREATE INDEX idx_lecturas_defectos_gin    ON lecturas     USING GIN (defectos);
CREATE INDEX idx_muestras_mediciones_gin  ON muestras_pcc USING GIN (mediciones);
CREATE INDEX idx_partes_datos_extra_gin   ON partes_pcc   USING GIN (datos_extra);


-- =============================================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE config_productos     ENABLE ROW LEVEL SECURITY;
ALTER TABLE config_empresa       ENABLE ROW LEVEL SECURITY;
ALTER TABLE config_variedades    ENABLE ROW LEVEL SECURITY;
ALTER TABLE config_clases_cvu    ENABLE ROW LEVEL SECURITY;
ALTER TABLE config_defectos_cvu  ENABLE ROW LEVEL SECURITY;
ALTER TABLE config_formatos_pcc  ENABLE ROW LEVEL SECURITY;
ALTER TABLE config_defectos_pcc  ENABLE ROW LEVEL SECURITY;
ALTER TABLE config_umbrales_pcc  ENABLE ROW LEVEL SECURITY;
ALTER TABLE tandas               ENABLE ROW LEVEL SECURITY;
ALTER TABLE lecturas             ENABLE ROW LEVEL SECURITY;
ALTER TABLE partes_pcc           ENABLE ROW LEVEL SECURITY;
ALTER TABLE muestras_pcc         ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 5.1 Políticas para usuarios autenticados — acceso total (single-tenant MVP)
--     Ajustar con user_id cuando se implemente multi-tenant.
-- ---------------------------------------------------------------------------

CREATE POLICY allow_authenticated ON config_productos
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY allow_authenticated ON config_empresa
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY allow_authenticated ON config_variedades
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY allow_authenticated ON config_clases_cvu
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY allow_authenticated ON config_defectos_cvu
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY allow_authenticated ON config_formatos_pcc
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY allow_authenticated ON config_defectos_pcc
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY allow_authenticated ON config_umbrales_pcc
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY allow_authenticated ON tandas
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY allow_authenticated ON lecturas
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY allow_authenticated ON partes_pcc
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY allow_authenticated ON muestras_pcc
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- 5.2 Políticas de solo lectura para usuarios anónimos
--     Descomentar para dashboards públicos o modo demo sin login.
-- ---------------------------------------------------------------------------

-- CREATE POLICY allow_anon_read ON config_productos
--     FOR SELECT TO anon USING (true);
-- CREATE POLICY allow_anon_read ON config_empresa
--     FOR SELECT TO anon USING (true);
-- CREATE POLICY allow_anon_read ON config_variedades
--     FOR SELECT TO anon USING (true);
-- CREATE POLICY allow_anon_read ON config_clases_cvu
--     FOR SELECT TO anon USING (true);
-- CREATE POLICY allow_anon_read ON config_defectos_cvu
--     FOR SELECT TO anon USING (true);
-- CREATE POLICY allow_anon_read ON config_formatos_pcc
--     FOR SELECT TO anon USING (true);
-- CREATE POLICY allow_anon_read ON config_defectos_pcc
--     FOR SELECT TO anon USING (true);
-- CREATE POLICY allow_anon_read ON config_umbrales_pcc
--     FOR SELECT TO anon USING (true);
-- CREATE POLICY allow_anon_read ON tandas
--     FOR SELECT TO anon USING (true);
-- CREATE POLICY allow_anon_read ON lecturas
--     FOR SELECT TO anon USING (true);
-- CREATE POLICY allow_anon_read ON partes_pcc
--     FOR SELECT TO anon USING (true);
-- CREATE POLICY allow_anon_read ON muestras_pcc
--     FOR SELECT TO anon USING (true);

-- ---------------------------------------------------------------------------
-- STORAGE — Bucket "lectura-photos"
-- Ejecutar DESPUÉS del bloque RLS anterior.
-- El bucket debe existir antes de ejecutar el seed (upload-rsrc.js lo crea).
-- Estructura de paths:
--   CVU lecturas : {tanda_id}/dia-{N}.png     → TA-2026-0012/dia-1.png
--   PCC partes   : pcc/{parte_id}/foto.png    → pcc/PC-2026-0010/foto.png
-- ---------------------------------------------------------------------------

-- Crear bucket público (ignorar si ya existe)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'lectura-photos',
    'lectura-photos',
    true,
    10485760,     -- 10 MB por archivo
    ARRAY['image/jpeg','image/jpg','image/png','image/webp']
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Políticas Storage
DROP POLICY IF EXISTS "lectura_photos_select" ON storage.objects;
DROP POLICY IF EXISTS "lectura_photos_insert" ON storage.objects;
DROP POLICY IF EXISTS "lectura_photos_update" ON storage.objects;
DROP POLICY IF EXISTS "lectura_photos_delete" ON storage.objects;

-- Lectura pública (sin autenticar)
CREATE POLICY "lectura_photos_select"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'lectura-photos');

-- Escritura solo autenticados
CREATE POLICY "lectura_photos_insert"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'lectura-photos');

CREATE POLICY "lectura_photos_update"
    ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'lectura-photos');

CREATE POLICY "lectura_photos_delete"
    ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'lectura-photos');

-- =============================================================================
-- FIN DE schema.sql
-- =============================================================================
