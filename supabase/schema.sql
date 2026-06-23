-- ─── Control de Calidad — Supabase Schema ────────────────────────────────────
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- Orden: tablas de configuración primero, luego datos

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
  css_key         text NOT NULL DEFAULT '',
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
  id                text          PRIMARY KEY,  -- TA-YYYY-NNNN
  variety           text,
  confeccion        text          NOT NULL,
  variedad          text,
  categoria_inicial text,
  trazabilidad      text          NOT NULL,
  peso_inicial      numeric(10,3) NOT NULL,
  fecha             date          NOT NULL,
  nota              text,
  created_at        timestamptz   NOT NULL DEFAULT now()
);

CREATE TABLE lecturas (
  id                    uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  tanda_id              text          NOT NULL REFERENCES tandas(id) ON DELETE CASCADE,
  dia                   int           NOT NULL,
  fecha                 date          NOT NULL,
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
  photo_url             text,          -- URL en Supabase Storage (bucket: lectura-photos)
  created_at            timestamptz   NOT NULL DEFAULT now(),
  UNIQUE (tanda_id, dia)
);

CREATE TABLE partes_pcc (
  id           text  PRIMARY KEY,  -- PC-YYYY-NNNN
  fecha        date  NOT NULL,
  hora         time,
  responsable  text,
  variedad     text,
  trazabilidad text,
  cinta_num    text,
  mesa_num     text,
  formato_id   text REFERENCES config_formatos_pcc(codigo),
  para_so2     bool NOT NULL DEFAULT false,
  n_muestras   int  NOT NULL DEFAULT 10,
  resultado    text CHECK (resultado IN ('C', 'NC')),
  created_at   timestamptz NOT NULL DEFAULT now()
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
-- Crear bucket "lectura-photos" en Supabase Dashboard → Storage → New Bucket
-- Marcar como Public para permitir URLs públicas de fotos.

-- ─── RLS ─────────────────────────────────────────────────────────────────────

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

-- Policy MVP single-tenant: todos los autenticados tienen acceso total.
-- Ajustar cuando se implemente multi-tenant con user_id.
CREATE POLICY "allow_authenticated" ON config_empresa        FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_authenticated" ON config_variedades     FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_authenticated" ON config_formatos_pcc   FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_authenticated" ON config_clases_cvu     FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_authenticated" ON config_defectos_cvu   FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_authenticated" ON config_defectos_pcc   FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_authenticated" ON config_umbrales_pcc   FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_authenticated" ON tandas                FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_authenticated" ON lecturas              FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_authenticated" ON partes_pcc            FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_authenticated" ON muestras_pcc          FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ─── Anon read (opcional para lecturas públicas) ──────────────────────────────
-- Descomentar si se quiere acceso sin autenticar (útil para demo):
-- CREATE POLICY "anon_read" ON tandas     FOR SELECT TO anon USING (true);
-- CREATE POLICY "anon_read" ON lecturas   FOR SELECT TO anon USING (true);
-- CREATE POLICY "anon_read" ON partes_pcc FOR SELECT TO anon USING (true);
-- CREATE POLICY "anon_read" ON muestras_pcc FOR SELECT TO anon USING (true);
-- CREATE POLICY "anon_read" ON config_empresa FOR SELECT TO anon USING (true);
-- CREATE POLICY "anon_read" ON config_variedades FOR SELECT TO anon USING (true);
-- CREATE POLICY "anon_read" ON config_formatos_pcc FOR SELECT TO anon USING (true);
-- CREATE POLICY "anon_read" ON config_clases_cvu FOR SELECT TO anon USING (true);
-- CREATE POLICY "anon_read" ON config_defectos_pcc FOR SELECT TO anon USING (true);
-- CREATE POLICY "anon_read" ON config_umbrales_pcc FOR SELECT TO anon USING (true);
