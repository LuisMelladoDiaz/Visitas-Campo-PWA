-- =============================================================================
-- schema.sql — App Calidad Tablet v2
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
--
-- Identificadores operacionales (v2):
--   seq  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY  (generado por la DB)
--   bc_no TEXT UNIQUE   — número asignado por BC tras push/sync
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- Drop tables (FK-safe order: líneas antes que cabeceras)
-- ---------------------------------------------------------------------------
DROP TABLE IF EXISTS lmd_linea_pcc          CASCADE;
DROP TABLE IF EXISTS lmd_cabecera_pcc       CASCADE;
DROP TABLE IF EXISTS lmd_linea_cvu          CASCADE;
DROP TABLE IF EXISTS lmd_cabecera_cvu       CASCADE;
DROP TABLE IF EXISTS lmd_defectos_pcc       CASCADE;
DROP TABLE IF EXISTS lmd_umbrales_pcc       CASCADE;
DROP TABLE IF EXISTS lmd_defectos_cvu       CASCADE;
DROP TABLE IF EXISTS lmd_clases_calidad_cvu CASCADE;
DROP TABLE IF EXISTS gsi_vti_conf           CASCADE;
DROP TABLE IF EXISTS gsi_g_varied           CASCADE;
DROP TABLE IF EXISTS gsi_vgr_conf           CASCADE;
DROP TABLE IF EXISTS config_empresa         CASCADE;

-- ---------------------------------------------------------------------------
-- BC Reference tables (overwritten on sync from BC — service_role only)
-- ---------------------------------------------------------------------------

-- Grupos de Confección (BC: GsiVGrConf)
CREATE TABLE gsi_vgr_conf (
    cod_gru_conf  TEXT        PRIMARY KEY,
    des_gru_conf  TEXT        NOT NULL DEFAULT '',
    icono         TEXT,
    tiene_cvu     BOOLEAN     NOT NULL DEFAULT false,
    tiene_pcc     BOOLEAN     NOT NULL DEFAULT false,
    activo        BOOLEAN     NOT NULL DEFAULT true,
    orden         SMALLINT    NOT NULL DEFAULT 0
);

-- Variedades (BC: GsiGVaried)
CREATE TABLE gsi_g_varied (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    cod_gru_conf  TEXT        NOT NULL REFERENCES gsi_vgr_conf(cod_gru_conf) ON DELETE CASCADE,
    c_varied      TEXT        NOT NULL UNIQUE,
    d_varied      TEXT        NOT NULL DEFAULT '',
    activo        BOOLEAN     NOT NULL DEFAULT true,
    orden         SMALLINT    NOT NULL DEFAULT 0
);

-- Tipos / Formatos de Confección (BC: GsiVTiConf)
CREATE TABLE gsi_vti_conf (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    cod_gru_conf  TEXT        REFERENCES gsi_vgr_conf(cod_gru_conf) ON DELETE SET NULL,
    c_t_conf      TEXT        NOT NULL UNIQUE,
    d_t_conf      TEXT        NOT NULL DEFAULT '',
    descripcion   TEXT,
    peso_ref_g    NUMERIC(10,0) NOT NULL DEFAULT 0,
    n_muestras    SMALLINT    NOT NULL DEFAULT 0,
    activo        BOOLEAN     NOT NULL DEFAULT true
);

-- ---------------------------------------------------------------------------
-- BC Config tables (synced from BC — service_role only)
-- ---------------------------------------------------------------------------

-- Clases de Calidad CVU
CREATE TABLE lmd_clases_calidad_cvu (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    cod_gru_conf    TEXT        REFERENCES gsi_vgr_conf(cod_gru_conf) ON DELETE CASCADE,
    nombre          TEXT        NOT NULL DEFAULT '',
    css_key         TEXT        NOT NULL DEFAULT '',
    orden           SMALLINT    NOT NULL DEFAULT 0,
    max_pct_leves   NUMERIC(5,2),
    max_pct_graves  NUMERIC(5,2),
    max_pct_elim    NUMERIC(5,2),
    max_pct_total   NUMERIC(5,2),
    max_pct_calibre NUMERIC(5,2)
);

-- Defectos CVU
-- severidad: 0=Leve, 1=Grave, 2=Eliminatorio  (BC Enum lmdSeveridadDefecto)
CREATE TABLE lmd_defectos_cvu (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    cod_gru_conf  TEXT        NOT NULL REFERENCES gsi_vgr_conf(cod_gru_conf) ON DELETE CASCADE,
    severidad     SMALLINT    NOT NULL CHECK (severidad IN (0, 1, 2)),
    clave         TEXT        NOT NULL DEFAULT '',
    etiqueta      TEXT        NOT NULL DEFAULT '',
    valor_ok      TEXT        NOT NULL DEFAULT 'No',
    activo        BOOLEAN     NOT NULL DEFAULT true,
    orden         SMALLINT    NOT NULL DEFAULT 0
);

-- Defectos PCC
CREATE TABLE lmd_defectos_pcc (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    cod_gru_conf    TEXT        NOT NULL REFERENCES gsi_vgr_conf(cod_gru_conf) ON DELETE CASCADE,
    clave           TEXT        NOT NULL DEFAULT '',
    etiqueta        TEXT        NOT NULL DEFAULT '',
    tolerancia_cero BOOLEAN     NOT NULL DEFAULT false,
    activo          BOOLEAN     NOT NULL DEFAULT true,
    orden           SMALLINT    NOT NULL DEFAULT 0
);

-- Umbrales PCC
CREATE TABLE lmd_umbrales_pcc (
    id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    cod_gru_conf      TEXT        REFERENCES gsi_vgr_conf(cod_gru_conf) ON DELETE CASCADE,
    max_defectos_pct  NUMERIC(5,2) NOT NULL DEFAULT 0,
    min_brix          NUMERIC(4,1),
    max_calibre_pct   NUMERIC(5,2)
);

-- ---------------------------------------------------------------------------
-- Operational tables — written from tablet, pushed/synced with BC
--
-- PK: seq BIGINT GENERATED ALWAYS AS IDENTITY — integer incremental, DB-generated
-- bc_no: número asignado por BC (null hasta push/sync)
-- ---------------------------------------------------------------------------

-- Cabecera CVU / Tandas (BC: lmdCabeceraCvu)
CREATE TABLE lmd_cabecera_cvu (
    seq               BIGINT      PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    gru_conf          TEXT        NOT NULL REFERENCES gsi_vgr_conf(cod_gru_conf),
    variedad          TEXT,
    confeccion        TEXT,
    categoria_inicial TEXT,
    trazabilidad      TEXT,
    peso_inicial      NUMERIC(10,3),
    fecha             DATE,
    nota              TEXT,
    bc_no             TEXT        UNIQUE,       -- número BC (e.g. 'CVU-2026-0001'), null hasta push
    bc_sync_at        TIMESTAMPTZ,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Línea CVU / Lecturas (BC: lmdLineaCvu)
CREATE TABLE lmd_linea_cvu (
    seq                   BIGINT      PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    cabecera_seq          BIGINT      NOT NULL REFERENCES lmd_cabecera_cvu(seq) ON DELETE CASCADE,
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
    UNIQUE (cabecera_seq, dia)
);

-- Cabecera PCC / Partes (BC: lmdCabeceraPcc)
-- resultado: 0=Pendiente, 1=Conforme, 2=NoConforme  (BC Option)
CREATE TABLE lmd_cabecera_pcc (
    seq           BIGINT      PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
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
    resultado     SMALLINT    NOT NULL DEFAULT 0 CHECK (resultado IN (0, 1, 2)),
    bc_no         TEXT        UNIQUE,       -- número BC (e.g. 'PCC-2026-0004'), null hasta push
    bc_sync_at    TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Línea PCC / Muestras (BC: lmdLineaPcc)
-- resultado: 0=Pendiente, 1=Conforme, 2=NoConforme
CREATE TABLE lmd_linea_pcc (
    seq               BIGINT      PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    cabecera_seq      BIGINT      NOT NULL REFERENCES lmd_cabecera_pcc(seq) ON DELETE CASCADE,
    no_linea          INT         NOT NULL,
    hora              TIME,
    mediciones        JSONB,
    pct_defectos      NUMERIC(5,2),
    resultado         SMALLINT    NOT NULL DEFAULT 0 CHECK (resultado IN (0, 1, 2)),
    UNIQUE (cabecera_seq, no_linea)
);

-- ---------------------------------------------------------------------------
-- Config empresa (local only — no BC equivalent)
-- ---------------------------------------------------------------------------
CREATE TABLE config_empresa (
    id      UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre  TEXT    NOT NULL DEFAULT ''
);

INSERT INTO config_empresa (nombre) VALUES ('Torremesa');

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
CREATE INDEX idx_gsi_g_varied_gru_conf           ON gsi_g_varied           (cod_gru_conf);
CREATE INDEX idx_gsi_vti_conf_gru_conf            ON gsi_vti_conf            (cod_gru_conf);
CREATE INDEX idx_lmd_clases_calidad_cvu_gru_conf  ON lmd_clases_calidad_cvu  (cod_gru_conf);
CREATE INDEX idx_lmd_defectos_cvu_gru_conf        ON lmd_defectos_cvu        (cod_gru_conf);
CREATE INDEX idx_lmd_defectos_pcc_gru_conf        ON lmd_defectos_pcc        (cod_gru_conf);
CREATE INDEX idx_lmd_umbrales_pcc_gru_conf        ON lmd_umbrales_pcc        (cod_gru_conf);

CREATE INDEX idx_lmd_cabecera_cvu_gru_conf        ON lmd_cabecera_cvu        (gru_conf);
CREATE INDEX idx_lmd_cabecera_cvu_fecha           ON lmd_cabecera_cvu        (fecha);
CREATE INDEX idx_lmd_cabecera_cvu_bc_no           ON lmd_cabecera_cvu        (bc_no);
CREATE INDEX idx_lmd_linea_cvu_cabecera_seq       ON lmd_linea_cvu           (cabecera_seq);

CREATE INDEX idx_lmd_cabecera_pcc_gru_conf        ON lmd_cabecera_pcc        (gru_conf);
CREATE INDEX idx_lmd_cabecera_pcc_fecha           ON lmd_cabecera_pcc        (fecha);
CREATE INDEX idx_lmd_cabecera_pcc_bc_no           ON lmd_cabecera_pcc        (bc_no);
CREATE INDEX idx_lmd_linea_pcc_cabecera_seq       ON lmd_linea_pcc           (cabecera_seq);

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

-- Reference / config: lectura pública, escritura solo service_role
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

-- Operational tables: authenticated puede leer, insertar, actualizar y borrar
CREATE POLICY "auth_select_lmd_cabecera_cvu"
    ON lmd_cabecera_cvu FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_lmd_cabecera_cvu"
    ON lmd_cabecera_cvu FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_lmd_cabecera_cvu"
    ON lmd_cabecera_cvu FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_delete_lmd_cabecera_cvu"
    ON lmd_cabecera_cvu FOR DELETE TO authenticated USING (true);
CREATE POLICY "service_all_lmd_cabecera_cvu"
    ON lmd_cabecera_cvu FOR ALL TO service_role USING (true);

CREATE POLICY "auth_select_lmd_linea_cvu"
    ON lmd_linea_cvu FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_lmd_linea_cvu"
    ON lmd_linea_cvu FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_lmd_linea_cvu"
    ON lmd_linea_cvu FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_delete_lmd_linea_cvu"
    ON lmd_linea_cvu FOR DELETE TO authenticated USING (true);
CREATE POLICY "service_all_lmd_linea_cvu"
    ON lmd_linea_cvu FOR ALL TO service_role USING (true);

CREATE POLICY "auth_select_lmd_cabecera_pcc"
    ON lmd_cabecera_pcc FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_lmd_cabecera_pcc"
    ON lmd_cabecera_pcc FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_lmd_cabecera_pcc"
    ON lmd_cabecera_pcc FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_delete_lmd_cabecera_pcc"
    ON lmd_cabecera_pcc FOR DELETE TO authenticated USING (true);
CREATE POLICY "service_all_lmd_cabecera_pcc"
    ON lmd_cabecera_pcc FOR ALL TO service_role USING (true);

CREATE POLICY "auth_select_lmd_linea_pcc"
    ON lmd_linea_pcc FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_lmd_linea_pcc"
    ON lmd_linea_pcc FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_lmd_linea_pcc"
    ON lmd_linea_pcc FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_delete_lmd_linea_pcc"
    ON lmd_linea_pcc FOR DELETE TO authenticated USING (true);
CREATE POLICY "service_all_lmd_linea_pcc"
    ON lmd_linea_pcc FOR ALL TO service_role USING (true);

CREATE POLICY "anon_read_config_empresa"
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

CREATE POLICY "auth_delete_calidad_fotos"
    ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'calidad-fotos');
