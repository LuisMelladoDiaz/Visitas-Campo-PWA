-- =============================================================================
-- schema.sql — App Calidad Tablet
-- Supabase / PostgreSQL schema aligned with BC (Business Central) AL tables.
-- Naming: BC API JSON key → snake_case column in Supabase.
--
-- BC table              → Supabase table
-- ─────────────────────────────────────────────────────
-- GsiVGrConf            → gsi_vgr_conf
-- GsiGVaried            → gsi_g_varied
-- GsiVTiConf            → gsi_vti_conf
-- lmdClasesCalidadCvu   → lmd_clases_calidad_cvu
-- lmdDefectosCvu        → lmd_defectos_cvu
-- lmdDefectosPcc        → lmd_defectos_pcc
-- lmdUmbralesPcc        → lmd_umbrales_pcc
-- lmdCabeceraCvu        → lmd_cabecera_cvu
-- lmdLineaCvu           → lmd_linea_cvu
-- lmdCabeceraPcc        → lmd_cabecera_pcc
-- lmdLineaPcc           → lmd_linea_pcc
-- (no BC equivalent)    → config_empresa
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- Drop tables (in FK-safe order, newest first)
-- ---------------------------------------------------------------------------
DROP TABLE IF EXISTS lmd_linea_pcc         CASCADE;
DROP TABLE IF EXISTS lmd_cabecera_pcc      CASCADE;
DROP TABLE IF EXISTS lmd_linea_cvu         CASCADE;
DROP TABLE IF EXISTS lmd_cabecera_cvu      CASCADE;
DROP TABLE IF EXISTS lmd_defectos_pcc      CASCADE;
DROP TABLE IF EXISTS lmd_umbrales_pcc      CASCADE;
DROP TABLE IF EXISTS lmd_defectos_cvu      CASCADE;
DROP TABLE IF EXISTS lmd_clases_calidad_cvu CASCADE;
DROP TABLE IF EXISTS gsi_vti_conf          CASCADE;
DROP TABLE IF EXISTS gsi_g_varied          CASCADE;
DROP TABLE IF EXISTS gsi_vgr_conf          CASCADE;
DROP TABLE IF EXISTS config_empresa        CASCADE;

-- ---------------------------------------------------------------------------
-- BC Reference tables (overwritten on sync with BC)
-- ---------------------------------------------------------------------------

-- Grupos de Confección (BC: GsiVGrConf)
-- cod_gru_conf: BC field GsiCodGruConf (API key: codGruConf)
CREATE TABLE gsi_vgr_conf (
    cod_gru_conf  TEXT        PRIMARY KEY,          -- e.g. 'UV','RE','CA','PI','BO'
    des_gru_conf  TEXT        NOT NULL DEFAULT '',  -- BC: GsiDesGruConf
    icono         TEXT,
    tiene_cvu     BOOLEAN     NOT NULL DEFAULT false,
    tiene_pcc     BOOLEAN     NOT NULL DEFAULT false,
    activo        BOOLEAN     NOT NULL DEFAULT true,
    orden         SMALLINT    NOT NULL DEFAULT 0
);

-- Variedades (BC: GsiGVaried)
-- c_varied: BC field GsiCVaried (API key: cVaried), natural key
CREATE TABLE gsi_g_varied (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    cod_gru_conf  TEXT        NOT NULL REFERENCES gsi_vgr_conf(cod_gru_conf) ON DELETE CASCADE,
    c_varied      TEXT        NOT NULL UNIQUE,      -- BC variety code e.g. 'UMSG', 'BO00'
    d_varied      TEXT        NOT NULL DEFAULT '',  -- BC: GsiDVaried
    activo        BOOLEAN     NOT NULL DEFAULT true,
    orden         SMALLINT    NOT NULL DEFAULT 0
);

-- Tipos / Formatos de Confección (BC: GsiVTiConf)
-- c_t_conf: BC field GsiCTConf (API key: cTConf), natural key
CREATE TABLE gsi_vti_conf (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    cod_gru_conf  TEXT        REFERENCES gsi_vgr_conf(cod_gru_conf) ON DELETE SET NULL,  -- nullable → universal
    c_t_conf      TEXT        NOT NULL UNIQUE,      -- BC format code e.g. 'B045', 'T050'
    d_t_conf      TEXT        NOT NULL DEFAULT '',  -- BC: GsiDTConf
    descripcion   TEXT,
    peso_ref_g    NUMERIC(10,0) NOT NULL DEFAULT 0,
    n_muestras    SMALLINT    NOT NULL DEFAULT 0,
    activo        BOOLEAN     NOT NULL DEFAULT true
);

-- ---------------------------------------------------------------------------
-- Config tables (synced from BC)
-- ---------------------------------------------------------------------------

-- Clases de Calidad CVU (BC: lmdClasesCalidadCvu)
CREATE TABLE lmd_clases_calidad_cvu (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    cod_gru_conf    TEXT        REFERENCES gsi_vgr_conf(cod_gru_conf) ON DELETE CASCADE,  -- nullable → universal
    nombre          TEXT        NOT NULL DEFAULT '',
    css_key         TEXT        NOT NULL DEFAULT '',
    orden           SMALLINT    NOT NULL DEFAULT 0,
    max_pct_leves   NUMERIC(5,2),
    max_pct_graves  NUMERIC(5,2),
    max_pct_elim    NUMERIC(5,2),
    max_pct_total   NUMERIC(5,2),
    max_pct_calibre NUMERIC(5,2)
);

-- Defectos CVU (BC: lmdDefectosCvu)
-- severidad: SMALLINT matching BC Enum lmdSeveridadDefecto (0=Leve, 1=Grave, 2=Eliminatorio)
CREATE TABLE lmd_defectos_cvu (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    cod_gru_conf  TEXT        NOT NULL REFERENCES gsi_vgr_conf(cod_gru_conf) ON DELETE CASCADE,
    severidad     SMALLINT    NOT NULL CHECK (severidad IN (0, 1, 2)),  -- 0=Leve,1=Grave,2=Eliminatorio
    clave         TEXT        NOT NULL DEFAULT '',
    etiqueta      TEXT        NOT NULL DEFAULT '',
    valor_ok      TEXT        NOT NULL DEFAULT 'No',
    activo        BOOLEAN     NOT NULL DEFAULT true,
    orden         SMALLINT    NOT NULL DEFAULT 0
);

-- Defectos PCC (BC: lmdDefectosPcc)
CREATE TABLE lmd_defectos_pcc (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    cod_gru_conf    TEXT        NOT NULL REFERENCES gsi_vgr_conf(cod_gru_conf) ON DELETE CASCADE,
    clave           TEXT        NOT NULL DEFAULT '',
    etiqueta        TEXT        NOT NULL DEFAULT '',
    tolerancia_cero BOOLEAN     NOT NULL DEFAULT false,
    activo          BOOLEAN     NOT NULL DEFAULT true,
    orden           SMALLINT    NOT NULL DEFAULT 0
);

-- Umbrales PCC (BC: lmdUmbralesPcc)
-- One row per cod_gru_conf (matches BC PK on lmdGruConf)
CREATE TABLE lmd_umbrales_pcc (
    id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    cod_gru_conf      TEXT        REFERENCES gsi_vgr_conf(cod_gru_conf) ON DELETE CASCADE,  -- nullable → universal
    max_defectos_pct  NUMERIC(5,2) NOT NULL DEFAULT 0,
    min_brix          NUMERIC(4,1),
    max_calibre_pct   NUMERIC(5,2)
);

-- ---------------------------------------------------------------------------
-- Operational tables (written from tablet app)
-- ---------------------------------------------------------------------------

-- Cabecera CVU / Tandas (BC: lmdCabeceraCvu)
-- no: TEXT PK matching BC lmdNo format 'CVU-YYYY-NNNN'
CREATE TABLE lmd_cabecera_cvu (
    no                TEXT        PRIMARY KEY,       -- e.g. 'CVU-2025-0001'
    gru_conf          TEXT        NOT NULL REFERENCES gsi_vgr_conf(cod_gru_conf),
    variedad          TEXT,
    confeccion        TEXT,
    categoria_inicial TEXT,
    trazabilidad      TEXT,
    peso_inicial      NUMERIC(10,3),
    fecha             DATE,
    nota              TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Línea CVU / Lecturas (BC: lmdLineaCvu)
-- cod_cabecera_cvu: FK → lmd_cabecera_cvu.no
CREATE TABLE lmd_linea_cvu (
    id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    cod_cabecera_cvu      TEXT        NOT NULL REFERENCES lmd_cabecera_cvu(no) ON DELETE CASCADE,
    dia                   SMALLINT    NOT NULL,
    fecha                 DATE,
    trazabilidad          TEXT,
    peso_diario           NUMERIC(10,3),
    temp_conservacion     NUMERIC(4,1),
    defectos              JSONB,
    peso_faltas_leves     NUMERIC(10,3),
    peso_faltas_graves    NUMERIC(10,3),
    peso_faltas_elim      NUMERIC(10,3),
    pct_perdida           NUMERIC(5,2),
    pct_leves             NUMERIC(5,2),
    pct_graves            NUMERIC(5,2),
    pct_elim              NUMERIC(5,2),
    pct_total             NUMERIC(5,2),
    pct_calibre           NUMERIC(5,2),
    clasificacion         TEXT,
    photo_url             TEXT,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (cod_cabecera_cvu, dia)
);

-- Cabecera PCC / Partes (BC: lmdCabeceraPcc)
-- no: TEXT PK matching BC lmdNo format 'PCC-YYYY-NNNN'
-- resultado: SMALLINT matching BC Option (0=Pendiente, 1=Conforme, 2=NoConforme)
CREATE TABLE lmd_cabecera_pcc (
    no            TEXT        PRIMARY KEY,       -- e.g. 'PCC-2025-0001'
    gru_conf      TEXT        NOT NULL REFERENCES gsi_vgr_conf(cod_gru_conf),
    tipo_conf     TEXT        REFERENCES gsi_vti_conf(c_t_conf) ON DELETE SET NULL,
    fecha         DATE,
    hora          TIME,
    responsable   TEXT,
    variedad      TEXT,
    trazabilidad  TEXT,
    cinta_num     TEXT,
    mesa_num      TEXT,
    datos_extra   JSONB,
    n_muestras    SMALLINT,
    resultado     SMALLINT    NOT NULL DEFAULT 0 CHECK (resultado IN (0, 1, 2)),  -- 0=Pendiente,1=Conforme,2=NoConforme
    foto_url      TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Línea PCC / Muestras (BC: lmdLineaPcc)
-- cod_cabecera_pcc: FK → lmd_cabecera_pcc.no
-- no_linea: matches BC lmdNoLinea (muestra number)
-- resultado: SMALLINT matching BC Option (0=Pendiente, 1=Conforme, 2=NoConforme)
CREATE TABLE lmd_linea_pcc (
    id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    cod_cabecera_pcc  TEXT        NOT NULL REFERENCES lmd_cabecera_pcc(no) ON DELETE CASCADE,
    no_linea          INT         NOT NULL,
    hora              TIME,
    mediciones        JSONB,
    pct_defectos      NUMERIC(5,2),
    resultado         SMALLINT    NOT NULL DEFAULT 0 CHECK (resultado IN (0, 1, 2)),  -- 0=Pendiente,1=Conforme,2=NoConforme
    UNIQUE (cod_cabecera_pcc, no_linea)
);

-- ---------------------------------------------------------------------------
-- Config empresa (no BC equivalent — local only)
-- ---------------------------------------------------------------------------
CREATE TABLE config_empresa (
    id      UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre  TEXT    NOT NULL DEFAULT ''
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
CREATE INDEX idx_gsi_g_varied_cod_gru_conf       ON gsi_g_varied       (cod_gru_conf);
CREATE INDEX idx_gsi_vti_conf_cod_gru_conf        ON gsi_vti_conf        (cod_gru_conf);
CREATE INDEX idx_lmd_clases_calidad_cvu_gru_conf  ON lmd_clases_calidad_cvu (cod_gru_conf);
CREATE INDEX idx_lmd_defectos_cvu_gru_conf        ON lmd_defectos_cvu    (cod_gru_conf);
CREATE INDEX idx_lmd_defectos_pcc_gru_conf        ON lmd_defectos_pcc    (cod_gru_conf);
CREATE INDEX idx_lmd_umbrales_pcc_gru_conf        ON lmd_umbrales_pcc    (cod_gru_conf);
CREATE INDEX idx_lmd_cabecera_cvu_gru_conf        ON lmd_cabecera_cvu    (gru_conf);
CREATE INDEX idx_lmd_cabecera_cvu_fecha           ON lmd_cabecera_cvu    (fecha);
CREATE INDEX idx_lmd_linea_cvu_cod_cabecera       ON lmd_linea_cvu       (cod_cabecera_cvu);
CREATE INDEX idx_lmd_cabecera_pcc_gru_conf        ON lmd_cabecera_pcc    (gru_conf);
CREATE INDEX idx_lmd_cabecera_pcc_fecha           ON lmd_cabecera_pcc    (fecha);
CREATE INDEX idx_lmd_linea_pcc_cod_cabecera       ON lmd_linea_pcc       (cod_cabecera_pcc);

-- ---------------------------------------------------------------------------
-- Row-Level Security (RLS)
-- ---------------------------------------------------------------------------
ALTER TABLE gsi_vgr_conf           ENABLE ROW LEVEL SECURITY;
ALTER TABLE gsi_g_varied           ENABLE ROW LEVEL SECURITY;
ALTER TABLE gsi_vti_conf           ENABLE ROW LEVEL SECURITY;
ALTER TABLE lmd_clases_calidad_cvu ENABLE ROW LEVEL SECURITY;
ALTER TABLE lmd_defectos_cvu       ENABLE ROW LEVEL SECURITY;
ALTER TABLE lmd_defectos_pcc       ENABLE ROW LEVEL SECURITY;
ALTER TABLE lmd_umbrales_pcc       ENABLE ROW LEVEL SECURITY;
ALTER TABLE lmd_cabecera_cvu       ENABLE ROW LEVEL SECURITY;
ALTER TABLE lmd_linea_cvu          ENABLE ROW LEVEL SECURITY;
ALTER TABLE lmd_cabecera_pcc       ENABLE ROW LEVEL SECURITY;
ALTER TABLE lmd_linea_pcc          ENABLE ROW LEVEL SECURITY;
ALTER TABLE config_empresa         ENABLE ROW LEVEL SECURITY;

-- Reference / config tables: authenticated users can read, service_role can write
CREATE POLICY "anon_read_gsi_vgr_conf"
    ON gsi_vgr_conf FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "service_write_gsi_vgr_conf"
    ON gsi_vgr_conf FOR ALL TO service_role USING (true);

CREATE POLICY "anon_read_gsi_g_varied"
    ON gsi_g_varied FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "service_write_gsi_g_varied"
    ON gsi_g_varied FOR ALL TO service_role USING (true);

CREATE POLICY "anon_read_gsi_vti_conf"
    ON gsi_vti_conf FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "service_write_gsi_vti_conf"
    ON gsi_vti_conf FOR ALL TO service_role USING (true);

CREATE POLICY "anon_read_lmd_clases_calidad_cvu"
    ON lmd_clases_calidad_cvu FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "service_write_lmd_clases_calidad_cvu"
    ON lmd_clases_calidad_cvu FOR ALL TO service_role USING (true);

CREATE POLICY "anon_read_lmd_defectos_cvu"
    ON lmd_defectos_cvu FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "service_write_lmd_defectos_cvu"
    ON lmd_defectos_cvu FOR ALL TO service_role USING (true);

CREATE POLICY "anon_read_lmd_defectos_pcc"
    ON lmd_defectos_pcc FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "service_write_lmd_defectos_pcc"
    ON lmd_defectos_pcc FOR ALL TO service_role USING (true);

CREATE POLICY "anon_read_lmd_umbrales_pcc"
    ON lmd_umbrales_pcc FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "service_write_lmd_umbrales_pcc"
    ON lmd_umbrales_pcc FOR ALL TO service_role USING (true);

-- Operational tables: authenticated users can read and write
CREATE POLICY "auth_read_lmd_cabecera_cvu"
    ON lmd_cabecera_cvu FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_lmd_cabecera_cvu"
    ON lmd_cabecera_cvu FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_lmd_cabecera_cvu"
    ON lmd_cabecera_cvu FOR UPDATE TO authenticated USING (true);
CREATE POLICY "service_all_lmd_cabecera_cvu"
    ON lmd_cabecera_cvu FOR ALL TO service_role USING (true);

CREATE POLICY "auth_read_lmd_linea_cvu"
    ON lmd_linea_cvu FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_lmd_linea_cvu"
    ON lmd_linea_cvu FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_lmd_linea_cvu"
    ON lmd_linea_cvu FOR UPDATE TO authenticated USING (true);
CREATE POLICY "service_all_lmd_linea_cvu"
    ON lmd_linea_cvu FOR ALL TO service_role USING (true);

CREATE POLICY "auth_read_lmd_cabecera_pcc"
    ON lmd_cabecera_pcc FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_lmd_cabecera_pcc"
    ON lmd_cabecera_pcc FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_lmd_cabecera_pcc"
    ON lmd_cabecera_pcc FOR UPDATE TO authenticated USING (true);
CREATE POLICY "service_all_lmd_cabecera_pcc"
    ON lmd_cabecera_pcc FOR ALL TO service_role USING (true);

CREATE POLICY "auth_read_lmd_linea_pcc"
    ON lmd_linea_pcc FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_lmd_linea_pcc"
    ON lmd_linea_pcc FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_lmd_linea_pcc"
    ON lmd_linea_pcc FOR UPDATE TO authenticated USING (true);
CREATE POLICY "service_all_lmd_linea_pcc"
    ON lmd_linea_pcc FOR ALL TO service_role USING (true);

CREATE POLICY "auth_read_config_empresa"
    ON config_empresa FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "service_write_config_empresa"
    ON config_empresa FOR ALL TO service_role USING (true);

-- ---------------------------------------------------------------------------
-- Storage bucket for quality photos
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('calidad-fotos', 'calidad-fotos', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "auth_upload_calidad_fotos"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'calidad-fotos');

CREATE POLICY "auth_read_calidad_fotos"
    ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'calidad-fotos');
