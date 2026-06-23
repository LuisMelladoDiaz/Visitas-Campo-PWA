-- ─── Control de Calidad — Seed inicial ───────────────────────────────────────
-- Ejecutar DESPUÉS de schema.sql en: Supabase Dashboard → SQL Editor

-- ─── Configuración ────────────────────────────────────────────────────────────

INSERT INTO config_empresa (nombre) VALUES ('Torremesa');

INSERT INTO config_variedades (modulo, codigo, nombre, activo, orden) VALUES
  ('pcc', 'sweet-globe',        'Sweet Globe',        true, 1),
  ('pcc', 'sweet-celebration',  'Sweet Celebration',  true, 2),
  ('pcc', 'candy-snap',         'Candy Snap',         true, 3);

INSERT INTO config_formatos_pcc (codigo, nombre, descripcion, peso_ref_g, n_muestras, activo) VALUES
  ('caja-madera',  'Caja madera',      '7,5 kg',      7500, 10, true),
  ('caja-carton',  'Caja cartón',      '4,5 kg',      4500, 10, true),
  ('tarrina-500',  'Tarrina ×500 gr',  '10 uds/caja',  500, 10, true),
  ('tarrina-1000', 'Tarrina ×1000 gr', '10 uds/caja', 1000, 10, true),
  ('ifco-9',       'Caja IFCO',        '9 kg',        9000, 10, true),
  ('granel',       'Granel',           '',            null,  5, true);

INSERT INTO config_clases_cvu (nombre, css_key, orden, max_pct_elim, max_pct_graves, max_pct_total, max_pct_calibre) VALUES
  ('Extra',     'class-extra', 1,    0,    0,  2,   null),
  ('Clase 1',   'class-1',     2,    0,    2, 10,   5),
  ('Clase 2',   'class-2',     3,    1,    5, 15,   5),
  ('Industria', 'class-ind',   4,    1,    5, 20,  10);

INSERT INTO config_defectos_cvu (severidad, clave, etiqueta, valor_ok, activo, orden) VALUES
  ('leve',  'desgrane',           'Desgrane',            'No', true, 1),
  ('leve',  'bayasRotas',         'Bayas rotas',         'No', true, 2),
  ('leve',  'escobajoMarron',     'Escobajo marrón',     'No', true, 3),
  ('leve',  'bayasDeshidratadas', 'Bayas deshidratadas', 'No', true, 4),
  ('leve',  'suciedad',           'Presencia suciedad',  'No', true, 5),
  ('grave', 'plagaPicado',        'Plaga / picado',      'No', true, 1),
  ('elim',  'cuerposExtranos',    'Cuerpos extraños',    'No', true, 1),
  ('elim',  'podridos',           'Podridos',            'No', true, 2);

INSERT INTO config_defectos_pcc (clave, etiqueta, tolerancia_cero, activo, orden) VALUES
  ('materiaExtrana', 'Materia extraña',         false, true, 1),
  ('suciaPolvo',     'Sucia / con polvo',        false, true, 2),
  ('deshidratadas',  'Deshidratadas',            false, true, 3),
  ('picadas',        'Picada / mordisqueada',    false, true, 4),
  ('rotas',          'Rotas / desgrane',         false, true, 5),
  ('manchasSol',     'Manchas de sol',           true,  true, 6),
  ('podridas',       'Podridas',                 true,  true, 7),
  ('otros',          'Otros',                    false, true, 8);

INSERT INTO config_umbrales_pcc (max_defectos_pct, min_brix, max_calibre_pct)
  VALUES (5.0, 11.0, 5.0);

-- ─── Tandas de ejemplo ───────────────────────────────────────────────────────

INSERT INTO tandas (id, variety, confeccion, variedad, categoria_inicial, trazabilidad, peso_inicial, fecha, nota) VALUES
  ('TA-2026-0001', 'uva', 'CONF-2026-001', 'Sweet Globe',        'Extra',    'TRZ-SG-001-26', 52.500, '2026-06-01', 'Primer lote de temporada'),
  ('TA-2026-0002', 'uva', 'CONF-2026-002', 'Sweet Celebration',  'Clase I',  'TRZ-SC-002-26', 48.000, '2026-06-10', null),
  ('TA-2026-0003', 'uva', 'CONF-2026-003', 'Candy Snap',         'Extra',    'TRZ-CS-003-26', 44.000, '2026-06-16', 'Lote para exportación');

-- ─── Lecturas TA-2026-0001 (7 días, evolución realista Extra→Clase 1) ─────────

INSERT INTO lecturas (tanda_id, dia, fecha, trazabilidad, peso_diario, temp_conservacion,
  desgrane, bayas_rotas, escobajo_marron, bayas_deshidratadas, suciedad,
  plaga_picado, cuerpos_extranos, podridos,
  peso_faltas_leves, peso_faltas_graves, peso_faltas_elim,
  pct_perdida, pct_leves, pct_graves, pct_elim, pct_total, pct_calibre, clasificacion)
VALUES
  ('TA-2026-0001', 1, '2026-06-02', 'TRZ-SG-001-26', 52.100, 1.5,
   'No','No','No','No','No', 'No','No','No',
   0.000, 0.000, 0.000,  0.762, 0.000, 0.000, 0.000, 0.000, 1.5, 'Extra'),

  ('TA-2026-0001', 2, '2026-06-03', 'TRZ-SG-001-26', 51.800, 1.5,
   'No','No','No','No','No', 'No','No','No',
   0.300, 0.000, 0.000,  1.333, 0.579, 0.000, 0.000, 0.579, 1.8, 'Extra'),

  ('TA-2026-0001', 3, '2026-06-04', 'TRZ-SG-001-26', 51.200, 2.0,
   'Si','No','No','Si','No', 'No','No','No',
   0.800, 0.000, 0.000,  2.476, 1.563, 0.000, 0.000, 1.563, 2.0, 'Extra'),

  ('TA-2026-0001', 4, '2026-06-05', 'TRZ-SG-001-26', 50.500, 2.0,
   'Si','No','No','Si','No', 'No','No','No',
   1.200, 0.200, 0.000,  3.810, 2.376, 0.396, 0.000, 2.772, 2.5, 'Clase 1'),

  ('TA-2026-0001', 5, '2026-06-06', 'TRZ-SG-001-26', 49.800, 2.5,
   'Si','Si','No','Si','No', 'No','No','No',
   1.800, 0.300, 0.000,  5.143, 3.614, 0.602, 0.000, 4.217, 3.0, 'Clase 1'),

  ('TA-2026-0001', 6, '2026-06-07', 'TRZ-SG-001-26', 49.200, 3.0,
   'Si','Si','Si','Si','No', 'No','No','No',
   2.500, 0.500, 0.000,  6.286, 5.081, 1.016, 0.000, 6.098, 3.5, 'Clase 2'),

  ('TA-2026-0001', 7, '2026-06-08', 'TRZ-SG-001-26', 48.500, 3.0,
   'Si','Si','Si','Si','Si', 'No','No','No',
   3.200, 0.700, 0.000,  7.619, 6.598, 1.443, 0.000, 8.041, 4.0, 'Clase 2');

-- ─── Lecturas TA-2026-0002 (4 días, calidad Extra estable) ────────────────────

INSERT INTO lecturas (tanda_id, dia, fecha, trazabilidad, peso_diario, temp_conservacion,
  desgrane, bayas_rotas, escobajo_marron, bayas_deshidratadas, suciedad,
  plaga_picado, cuerpos_extranos, podridos,
  peso_faltas_leves, peso_faltas_graves, peso_faltas_elim,
  pct_perdida, pct_leves, pct_graves, pct_elim, pct_total, pct_calibre, clasificacion)
VALUES
  ('TA-2026-0002', 1, '2026-06-11', 'TRZ-SC-002-26', 47.800, 1.0,
   'No','No','No','No','No', 'No','No','No',
   0.000, 0.000, 0.000,  0.417, 0.000, 0.000, 0.000, 0.000, 2.0, 'Extra'),

  ('TA-2026-0002', 2, '2026-06-12', 'TRZ-SC-002-26', 47.400, 1.5,
   'No','No','No','No','No', 'No','No','No',
   0.500, 0.000, 0.000,  1.250, 1.055, 0.000, 0.000, 1.055, 2.5, 'Extra'),

  ('TA-2026-0002', 3, '2026-06-13', 'TRZ-SC-002-26', 46.900, 1.5,
   'Si','No','No','No','No', 'No','No','No',
   0.900, 0.000, 0.000,  2.292, 1.919, 0.000, 0.000, 1.919, 3.0, 'Extra'),

  ('TA-2026-0002', 4, '2026-06-14', 'TRZ-SC-002-26', 46.300, 2.0,
   'Si','No','No','Si','No', 'No','No','No',
   1.300, 0.000, 0.000,  3.542, 2.809, 0.000, 0.000, 2.809, 3.0, 'Extra');

-- ─── Lecturas TA-2026-0003 (2 días, inicio de seguimiento) ───────────────────

INSERT INTO lecturas (tanda_id, dia, fecha, trazabilidad, peso_diario, temp_conservacion,
  desgrane, bayas_rotas, escobajo_marron, bayas_deshidratadas, suciedad,
  plaga_picado, cuerpos_extranos, podridos,
  peso_faltas_leves, peso_faltas_graves, peso_faltas_elim,
  pct_perdida, pct_leves, pct_graves, pct_elim, pct_total, pct_calibre, clasificacion)
VALUES
  ('TA-2026-0003', 1, '2026-06-17', 'TRZ-CS-003-26', 43.800, 0.5,
   'No','No','No','No','No', 'No','No','No',
   0.000, 0.000, 0.000,  0.455, 0.000, 0.000, 0.000, 0.000, 1.0, 'Extra'),

  ('TA-2026-0003', 2, '2026-06-18', 'TRZ-CS-003-26', 43.600, 0.5,
   'No','No','No','No','No', 'No','No','No',
   0.200, 0.000, 0.000,  0.909, 0.459, 0.000, 0.000, 0.459, 1.0, 'Extra');

-- ─── Partes PCC ──────────────────────────────────────────────────────────────

INSERT INTO partes_pcc (id, fecha, hora, responsable, variedad, trazabilidad, cinta_num, mesa_num, formato_id, para_so2, n_muestras, resultado) VALUES
  ('PC-2026-0001', '2026-06-15', '09:30', 'María García', 'Sweet Globe',       'TRZ-SG-001-26', '3', '2', 'caja-carton',  false, 10, 'C'),
  ('PC-2026-0002', '2026-06-20', '11:00', 'Carlos López', 'Sweet Celebration', 'TRZ-SC-002-26', '1', '4', 'tarrina-500',  true,  10, 'NC'),
  ('PC-2026-0003', '2026-06-22', '08:15', 'María García', 'Candy Snap',        'TRZ-CS-003-26', '2', '1', 'caja-madera',  false, 10, 'C');

-- ─── Muestras PC-2026-0001 (10 muestras, resultado C) ─────────────────────────

INSERT INTO muestras_pcc (parte_id, num, hora, peso_g, calibre_mm, pct_fuera_calibre, num_racimos,
  homogeneidad, condicion_escobajo, coloracion, brix, total_bayas,
  materia_extrana, sucia_polvo, deshidratadas, picadas, rotas, manchas_sol, podridas, otros,
  pct_defectos, resultado)
VALUES
  ('PC-2026-0001',  1, '09:32', 4450, 17.5, 2.0, 4, 'Si','Si', 4, 13.5, 120,  0,1,0,0,2,0,0,0, 2.500, 'C'),
  ('PC-2026-0001',  2, '09:38', 4520, 18.0, 1.5, 5, 'Si','Si', 5, 14.0, 135,  0,0,0,0,1,0,0,0, 0.741, 'C'),
  ('PC-2026-0001',  3, '09:45', 4490, 17.0, 3.0, 4, 'Si','Si', 4, 13.0, 128,  0,2,1,0,1,0,0,0, 3.125, 'C'),
  ('PC-2026-0001',  4, '09:52', 4480, 17.5, 2.5, 5, 'Si','Si', 4, 13.8, 132,  0,0,0,0,3,0,0,0, 2.273, 'C'),
  ('PC-2026-0001',  5, '10:00', 4510, 18.0, 1.0, 4, 'Si','Si', 5, 14.2, 126,  0,1,0,0,2,0,0,0, 2.381, 'C'),
  ('PC-2026-0001',  6, '10:08', 4470, 17.5, 2.0, 4, 'Si','Si', 4, 13.5, 118,  0,0,0,0,1,0,0,0, 0.847, 'C'),
  ('PC-2026-0001',  7, '10:15', 4500, 18.0, 1.5, 5, 'Si','Si', 5, 14.5, 130,  0,1,0,0,0,0,0,0, 0.769, 'C'),
  ('PC-2026-0001',  8, '10:22', 4485, 17.5, 2.5, 4, 'Si','Si', 4, 13.0, 122,  0,2,0,0,2,0,0,0, 3.279, 'C'),
  ('PC-2026-0001',  9, '10:30', 4460, 17.0, 3.0, 4, 'Si','Si', 4, 13.2, 119,  0,1,1,0,1,0,0,0, 2.521, 'C'),
  ('PC-2026-0001', 10, '10:38', 4495, 18.0, 1.0, 5, 'Si','Si', 5, 14.0, 128,  0,0,0,0,2,0,0,0, 1.563, 'C');

-- ─── Muestras PC-2026-0002 (10 muestras, NC por manchas sol y fuera calibre) ──

INSERT INTO muestras_pcc (parte_id, num, hora, peso_g, calibre_mm, pct_fuera_calibre, num_racimos,
  homogeneidad, condicion_escobajo, coloracion, brix, total_bayas,
  materia_extrana, sucia_polvo, deshidratadas, picadas, rotas, manchas_sol, podridas, otros,
  pct_defectos, resultado)
VALUES
  ('PC-2026-0002',  1, '11:05',  490, 16.5, 4.0, 2, 'Si', 'Si', 3, 12.0,  85,  0,2,0,0,1,0,0,0, 3.529, 'C'),
  ('PC-2026-0002',  2, '11:12',  505, 16.0, 5.5, 2, 'No', 'Si', 3, 11.5,  90,  0,1,0,0,2,1,0,0, 4.444, 'NC'),
  ('PC-2026-0002',  3, '11:20',  495, 16.5, 3.0, 3, 'Si', 'Si', 4, 12.5,  88,  0,0,1,0,1,0,0,0, 2.273, 'C'),
  ('PC-2026-0002',  4, '11:28',  510, 15.5, 6.0, 2, 'No', 'No', 3, 10.5,  92,  0,3,2,0,3,0,0,1, 9.783, 'NC'),
  ('PC-2026-0002',  5, '11:36',  498, 16.0, 4.5, 2, 'Si', 'Si', 3, 12.0,  86,  0,1,0,0,2,0,0,0, 3.488, 'C'),
  ('PC-2026-0002',  6, '11:44',  502, 16.5, 3.0, 3, 'Si', 'Si', 4, 11.8,  89,  0,2,1,0,1,0,0,0, 4.494, 'C'),
  ('PC-2026-0002',  7, '11:52',  488, 16.0, 5.0, 2, 'No', 'Si', 3, 11.0,  84,  0,1,0,0,2,0,0,0, 3.571, 'C'),
  ('PC-2026-0002',  8, '12:00',  515, 16.5, 2.5, 3, 'Si', 'Si', 4, 12.5,  93,  0,0,0,0,1,0,0,0, 1.075, 'C'),
  ('PC-2026-0002',  9, '12:08',  492, 15.0, 7.0, 2, 'No', 'No', 2, 10.0,  87,  0,2,3,0,4,0,0,0, 10.345,'NC'),
  ('PC-2026-0002', 10, '12:16',  508, 16.5, 3.5, 3, 'Si', 'Si', 3, 11.5,  91,  0,1,1,0,2,0,0,0, 4.396, 'C');

-- ─── Muestras PC-2026-0003 (10 muestras, resultado C) ─────────────────────────

INSERT INTO muestras_pcc (parte_id, num, hora, peso_g, calibre_mm, pct_fuera_calibre, num_racimos,
  homogeneidad, condicion_escobajo, coloracion, brix, total_bayas,
  materia_extrana, sucia_polvo, deshidratadas, picadas, rotas, manchas_sol, podridas, otros,
  pct_defectos, resultado)
VALUES
  ('PC-2026-0003',  1, '08:18', 7520, 19.0, 1.0, 6, 'Si','Si', 5, 15.0, 155,  0,0,0,0,2,0,0,0, 1.290, 'C'),
  ('PC-2026-0003',  2, '08:26', 7480, 18.5, 2.0, 5, 'Si','Si', 5, 14.5, 148,  0,1,0,0,1,0,0,0, 1.351, 'C'),
  ('PC-2026-0003',  3, '08:34', 7510, 19.0, 1.5, 6, 'Si','Si', 5, 15.0, 152,  0,0,0,0,3,0,0,0, 1.974, 'C'),
  ('PC-2026-0003',  4, '08:42', 7495, 18.5, 2.5, 5, 'Si','Si', 4, 14.0, 150,  0,2,0,0,1,0,0,0, 2.000, 'C'),
  ('PC-2026-0003',  5, '08:50', 7525, 19.0, 1.0, 6, 'Si','Si', 5, 15.5, 156,  0,0,0,0,2,0,0,0, 1.282, 'C'),
  ('PC-2026-0003',  6, '08:58', 7485, 18.5, 2.0, 5, 'Si','Si', 5, 14.5, 147,  0,1,0,0,1,0,0,0, 1.361, 'C'),
  ('PC-2026-0003',  7, '09:06', 7505, 19.0, 1.5, 6, 'Si','Si', 5, 15.0, 151,  0,0,0,0,2,0,0,0, 1.325, 'C'),
  ('PC-2026-0003',  8, '09:14', 7490, 19.0, 1.0, 5, 'Si','Si', 5, 15.2, 149,  0,1,0,0,1,0,0,0, 1.342, 'C'),
  ('PC-2026-0003',  9, '09:22', 7515, 18.5, 2.0, 6, 'Si','Si', 4, 14.5, 153,  0,0,0,0,3,0,0,0, 1.961, 'C'),
  ('PC-2026-0003', 10, '09:30', 7500, 19.0, 1.5, 5, 'Si','Si', 5, 15.0, 150,  0,1,0,0,2,0,0,0, 2.000, 'C');
