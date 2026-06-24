-- =============================================================================
-- seed.sql — Torremesa S.A. — Datos iniciales multi-producto con fotos
-- Ejecutar DESPUÉS de schema.sql en: Supabase Dashboard → SQL Editor
-- Las URLs de foto requieren ejecutar upload-rsrc.js ANTES de este seed.
-- =============================================================================


-- =============================================================================
-- 1. config_productos — Catálogo de productos
-- =============================================================================

INSERT INTO config_productos (id, nombre, icono, tiene_cvu, tiene_pcc, activo, orden) VALUES
    ('uva',       'Uva de Mesa', '🍇', TRUE,  TRUE,  TRUE, 1),
    ('remolacha', 'Remolacha',   '🫜', TRUE,  FALSE, TRUE, 2),
    ('boniato',   'Boniato',     '🍠', TRUE,  FALSE, TRUE, 3),
    ('calabaza',  'Calabaza',    '🎃', TRUE,  TRUE,  TRUE, 4),
    ('pimiento',  'Pimiento',    '🫑', FALSE, TRUE,  TRUE, 5);


-- =============================================================================
-- 2. config_empresa
-- =============================================================================

INSERT INTO config_empresa (nombre) VALUES ('Torremesa');


-- =============================================================================
-- 3. config_variedades — Variedades por producto
-- =============================================================================

INSERT INTO config_variedades (producto_id, codigo, nombre, activo, orden) VALUES
    ('uva', 'sweet-globe',       'Sweet Globe',       TRUE, 1),
    ('uva', 'sweet-celebration', 'Sweet Celebration', TRUE, 2),
    ('uva', 'candy-snap',        'Candy Snap',        TRUE, 3),
    ('uva', 'prime',             'Prime',             TRUE, 4),
    ('uva', 'magenta',           'Magenta',           TRUE, 5);

INSERT INTO config_variedades (producto_id, codigo, nombre, activo, orden) VALUES
    ('remolacha', 'monaco',      'Mónaco',      TRUE, 1),
    ('remolacha', 'boto',        'Boto',        TRUE, 2),
    ('remolacha', 'roja-redonda','Roja Redonda', TRUE, 3);

INSERT INTO config_variedades (producto_id, codigo, nombre, activo, orden) VALUES
    ('boniato', 'beauregard', 'Beauregard', TRUE, 1),
    ('boniato', 'covington',  'Covington',  TRUE, 2),
    ('boniato', 'jewel',      'Jewel',      TRUE, 3);

INSERT INTO config_variedades (producto_id, codigo, nombre, activo, orden) VALUES
    ('calabaza', 'butternut', 'Butternut',              TRUE, 1),
    ('calabaza', 'cacahuete', 'Cacahuete (C. moschata)', TRUE, 2),
    ('calabaza', 'moscata',   'Moscata',                TRUE, 3);

INSERT INTO config_variedades (producto_id, codigo, nombre, activo, orden) VALUES
    ('pimiento', 'california-rojo',  'California Rojo',  TRUE, 1),
    ('pimiento', 'california-verde', 'California Verde', TRUE, 2),
    ('pimiento', 'lamuyo',           'Lamuyo',           TRUE, 3),
    ('pimiento', 'italiano',         'Italiano',         TRUE, 4);


-- =============================================================================
-- 4. config_clases_cvu — Clases de calidad (NULL = universales)
-- =============================================================================

INSERT INTO config_clases_cvu (producto_id, nombre, css_key, orden,
    max_pct_leves, max_pct_elim, max_pct_graves, max_pct_total, max_pct_calibre) VALUES
    (NULL, 'Extra',     'class-extra', 1,  2.00,  0.00,  0.00,  2.00,  NULL),
    (NULL, 'Clase 1',   'class-1',     2,  NULL,  0.00,  5.00, 10.00,  5.00),
    (NULL, 'Clase 2',   'class-2',     3,  NULL,  1.00,  5.00, 15.00,  5.00),
    (NULL, 'Industria', 'class-ind',   4,  NULL,  1.00,  5.00, 20.00, 10.00);


-- =============================================================================
-- 5. config_defectos_cvu — Defectos por producto (Vida Útil)
-- =============================================================================

-- Uva
INSERT INTO config_defectos_cvu (producto_id, severidad, clave, etiqueta, valor_ok, activo, orden) VALUES
    ('uva', 'leve',  'desgrane',           'Desgrane',            'No', TRUE, 1),
    ('uva', 'leve',  'bayasRotas',         'Bayas rotas',         'No', TRUE, 2),
    ('uva', 'leve',  'escobajoMarron',     'Escobajo marrón',     'No', TRUE, 3),
    ('uva', 'leve',  'bayasDeshidratadas', 'Bayas deshidratadas', 'No', TRUE, 4),
    ('uva', 'leve',  'suciedad',           'Presencia suciedad',  'No', TRUE, 5),
    ('uva', 'grave', 'plagaPicado',        'Plaga / picado',      'No', TRUE, 1),
    ('uva', 'elim',  'cuerposExtranos',    'Cuerpos extraños',    'No', TRUE, 1),
    ('uva', 'elim',  'podridos',           'Podridos',            'No', TRUE, 2);

-- Remolacha
INSERT INTO config_defectos_cvu (producto_id, severidad, clave, etiqueta, valor_ok, activo, orden) VALUES
    ('remolacha', 'leve',  'golpesHeridasManchas',  'Golpes, heridas y manchas',                        'No', TRUE, 1),
    ('remolacha', 'leve',  'puntasRotas',           'Puntas rotas',                                     'No', TRUE, 2),
    ('remolacha', 'leve',  'defectosApariencia',    'Defectos globales de apariencia (color, morfología...)','No', TRUE, 3),
    ('remolacha', 'leve',  'hojaVieja',             'Hoja vieja',                                       'No', TRUE, 4),
    ('remolacha', 'leve',  'puntaBlancaHumeda',     'Punta blanca húmeda',                              'No', TRUE, 5),
    ('remolacha', 'leve',  'daNosMecanicos',        'Daños mecánicos (cicatrizadas > 10mm²)',            'No', TRUE, 6),
    ('remolacha', 'leve',  'suciedad',              'Presencia suciedad',                               'No', TRUE, 7),
    ('remolacha', 'grave', 'plagaPicado',           'Plagas / picados',                                 'No', TRUE, 1),
    ('remolacha', 'elim',  'cuerposExtranos',       'Cuerpos extraños',                                 'No', TRUE, 1),
    ('remolacha', 'elim',  'podridos',              'Podridos',                                         'No', TRUE, 2),
    ('remolacha', 'elim',  'rotosRajados',          'Rotos o rajados',                                  'No', TRUE, 3);

-- Boniato
INSERT INTO config_defectos_cvu (producto_id, severidad, clave, etiqueta, valor_ok, activo, orden) VALUES
    ('boniato', 'leve',  'despellejados',          'Despellejados',                               'No', TRUE, 1),
    ('boniato', 'leve',  'puntasRotas',            'Puntas rotas',                                'No', TRUE, 2),
    ('boniato', 'leve',  'defectosApariencia',     'Defectos globales de apariencia',             'No', TRUE, 3),
    ('boniato', 'leve',  'rebrotesMayores5mm',     'Rebrotes mayores de 5mm',                     'No', TRUE, 4),
    ('boniato', 'leve',  'puntasDeshidratadas30mm','Puntas deshidratadas > 30mm',                 'No', TRUE, 5),
    ('boniato', 'leve',  'densidadRaices',         'Densidad de raíces',                          'No', TRUE, 6),
    ('boniato', 'leve',  'daNosMecanicos',         'Daños mecánicos (cicatrizadas > 10mm²)',      'No', TRUE, 7),
    ('boniato', 'grave', 'plagaPicado',            'Plagas / picados',                            'No', TRUE, 1),
    ('boniato', 'elim',  'cuerposExtranos',        'Cuerpos extraños',                            'No', TRUE, 1),
    ('boniato', 'elim',  'podridos',               'Podridos',                                    'No', TRUE, 2),
    ('boniato', 'elim',  'rotosRajados',           'Rotos o rajados',                             'No', TRUE, 3);

-- Calabaza
INSERT INTO config_defectos_cvu (producto_id, severidad, clave, etiqueta, valor_ok, activo, orden) VALUES
    ('calabaza', 'leve',  'defectosApariencia',     'Defectos globales de apariencia',        'No', TRUE, 1),
    ('calabaza', 'leve',  'puntasDeshidratadas30mm','Puntas deshidratadas > 30mm',            'No', TRUE, 2),
    ('calabaza', 'leve',  'densidadRaices',         'Densidad de raíces',                     'No', TRUE, 3),
    ('calabaza', 'leve',  'daNosMecanicos',         'Daños mecánicos (cicatrizadas > 10mm²)', 'No', TRUE, 4),
    ('calabaza', 'grave', 'plagaPicado',            'Plagas / picados',                       'No', TRUE, 1),
    ('calabaza', 'elim',  'cuerposExtranos',        'Cuerpos extraños',                       'No', TRUE, 1),
    ('calabaza', 'elim',  'podridos',               'Podridos',                               'No', TRUE, 2),
    ('calabaza', 'elim',  'rotosRajados',           'Rotos o rajados',                        'No', TRUE, 3);


-- =============================================================================
-- 6. config_defectos_pcc — Defectos por producto (PCC)
-- =============================================================================

-- Uva
INSERT INTO config_defectos_pcc (producto_id, clave, etiqueta, tolerancia_cero, activo, orden) VALUES
    ('uva', 'materiaExtrana',  'Materia extraña',       FALSE, TRUE, 1),
    ('uva', 'suciaPolvo',      'Sucia con polvo',       FALSE, TRUE, 2),
    ('uva', 'deshidratadas',   'Deshidratadas',         FALSE, TRUE, 3),
    ('uva', 'picadas',         'Picada o mordisqueada', FALSE, TRUE, 4),
    ('uva', 'rotas',           'Rotas desgrane',        FALSE, TRUE, 5),
    ('uva', 'manchasSol',      'Manchas de sol',        TRUE,  TRUE, 6),
    ('uva', 'podridas',        'Podridas',              TRUE,  TRUE, 7),
    ('uva', 'otros',           'Otros',                 FALSE, TRUE, 8);

-- Pimiento
INSERT INTO config_defectos_pcc (producto_id, clave, etiqueta, tolerancia_cero, activo, orden) VALUES
    ('pimiento', 'materiasExtranas',    'Materias extrañas',        TRUE,  TRUE,  1),
    ('pimiento', 'sucio',              'Sucio',                     FALSE, TRUE,  2),
    ('pimiento', 'picadoMordisqueado', 'Picado o mordisqueado',     FALSE, TRUE,  3),
    ('pimiento', 'rajado',             'Rajado',                    FALSE, TRUE,  4),
    ('pimiento', 'herida',             'Herida grieta',             FALSE, TRUE,  5),
    ('pimiento', 'deformado',          'Deformado',                 FALSE, TRUE,  6),
    ('pimiento', 'danoMecanico',       'Daño mecánico',             FALSE, TRUE,  7),
    ('pimiento', 'manchado',           'Manchado',                  FALSE, TRUE,  8),
    ('pimiento', 'cortado',            'Cortado',                   FALSE, TRUE,  9),
    ('pimiento', 'sinPedunculo',       'Sin pedúnculo',             FALSE, TRUE, 10),
    ('pimiento', 'sinMadurez',         'Sin madurez',               FALSE, TRUE, 11),
    ('pimiento', 'pesoFueraCalibre',   'Peso fuera de calibre',     FALSE, TRUE, 12),
    ('pimiento', 'pudriciones',        'Pudriciones',               TRUE,  TRUE, 13),
    ('pimiento', 'manchasSolPeseta',   'Manchas del sol o peseta',  FALSE, TRUE, 14);

-- Calabaza
INSERT INTO config_defectos_pcc (producto_id, clave, etiqueta, tolerancia_cero, activo, orden) VALUES
    ('calabaza', 'materiasExtranas',    'Materias extrañas',        TRUE,  TRUE,  1),
    ('calabaza', 'sucio',              'Sucio',                     FALSE, TRUE,  2),
    ('calabaza', 'picadoMordisqueado', 'Picado o mordisqueado',     FALSE, TRUE,  3),
    ('calabaza', 'rajado',             'Rajado',                    FALSE, TRUE,  4),
    ('calabaza', 'herida',             'Herida grieta',             FALSE, TRUE,  5),
    ('calabaza', 'deformado',          'Deformado',                 FALSE, TRUE,  6),
    ('calabaza', 'danoMecanico',       'Daño mecánico',             FALSE, TRUE,  7),
    ('calabaza', 'manchado',           'Manchado',                  FALSE, TRUE,  8),
    ('calabaza', 'cortado',            'Cortado',                   FALSE, TRUE,  9),
    ('calabaza', 'sinPedunculo',       'Sin pedúnculo',             FALSE, TRUE, 10),
    ('calabaza', 'verdesSinMadurez',   'Verdes o sin madurez',      FALSE, TRUE, 11),
    ('calabaza', 'pesoFueraCalibre',   'Peso fuera de calibre',     FALSE, TRUE, 12);


-- =============================================================================
-- 7. config_formatos_pcc — Formatos de envase por producto
-- =============================================================================

INSERT INTO config_formatos_pcc (producto_id, codigo, nombre, descripcion, peso_ref_g, n_muestras, activo) VALUES
    ('uva', 'caja-madera',  'Caja madera',       '7,5 kg',      7500, 10, TRUE),
    ('uva', 'caja-carton',  'Caja cartón',        '4,5 kg',      4500, 10, TRUE),
    ('uva', 'tarrina-500',  'Tarrina ×500 gr',   '10 uds caja',  500, 10, TRUE),
    ('uva', 'tarrina-1000', 'Tarrina ×1000 gr',  '10 uds caja', 1000, 10, TRUE),
    ('uva', 'ifco-9',       'Caja IFCO',          '9 kg',        9000, 10, TRUE),
    ('uva', 'granel',       'Granel',             NULL,          NULL,  5, TRUE);

INSERT INTO config_formatos_pcc (producto_id, codigo, nombre, descripcion, peso_ref_g, n_muestras, activo) VALUES
    ('pimiento', 'pim-carton-5kg',   'Cartón 5 Kg',  '5 kg', 5000, 1, TRUE),
    ('pimiento', 'pim-box-plastico', 'Box Plástico',  NULL,   NULL, 1, TRUE);

INSERT INTO config_formatos_pcc (producto_id, codigo, nombre, descripcion, peso_ref_g, n_muestras, activo) VALUES
    ('calabaza', 'cal-caja-carton',  'Caja Cartón',  NULL, NULL, 1, TRUE),
    ('calabaza', 'cal-box-plastico', 'Box Plástico', NULL, NULL, 1, TRUE),
    ('calabaza', 'cal-granel',       'Granel',       NULL, NULL, 1, TRUE);


-- =============================================================================
-- 8. config_umbrales_pcc — Umbrales de aceptación por producto
-- =============================================================================

INSERT INTO config_umbrales_pcc (producto_id, max_defectos_pct, min_brix, max_calibre_pct) VALUES
    ('uva',      5.00, 11.0, 5.00),
    ('pimiento', 15.00, NULL, NULL),
    ('calabaza', 15.00, NULL, NULL);


-- =============================================================================
-- 9. tandas — Lotes de ejemplo (todos los productos)
-- =============================================================================

INSERT INTO tandas (id, producto_id, variedad, confeccion, categoria_inicial, trazabilidad, peso_inicial, fecha, nota) VALUES
    ('TA-2026-0001', 'uva',       'Sweet Globe',  'CONF-2026-001', 'Extra',   'TRZ-SG-001-26',   52.500, '2026-06-01', 'Primer lote de temporada'),
    ('TA-2026-0002', 'uva',       'Sweet Celebration','CONF-2026-002', 'Clase 1','TRZ-SC-002-26', 48.000, '2026-06-10', NULL),
    ('TA-2026-0003', 'uva',       'Candy Snap',   'CONF-2026-003', 'Extra',   'TRZ-CS-003-26',   44.000, '2026-06-16', 'Lote para exportación'),
    ('TA-2026-0010', 'remolacha', 'Mónaco',       'CONF-2026-010', 'Extra',   'TRZ-REM-010-26', 120.000, '2026-06-01', NULL),
    ('TA-2026-0011', 'boniato',   'Beauregard',   'CONF-2026-011', 'Extra',   'TRZ-BON-011-26',  95.000, '2026-06-05', NULL),
    ('TA-2026-0012', 'calabaza',  'Butternut',    'CONF-2026-012', 'Extra',   'TRZ-CAL-012-26', 200.000, '2026-06-10', 'Seguimiento fotográfico completo');


-- =============================================================================
-- 10. lecturas — Lecturas de seguimiento CVU
-- =============================================================================

-- ── TA-2026-0001 (Uva Sweet Globe — 7 días, Extra → Clase 1 → Clase 2) ────────
INSERT INTO lecturas (tanda_id, dia, fecha, trazabilidad, peso_diario, temp_conservacion,
    defectos, peso_faltas_leves, peso_faltas_graves, peso_faltas_elim,
    pct_perdida, pct_leves, pct_graves, pct_elim, pct_total, pct_calibre, clasificacion)
VALUES
    ('TA-2026-0001', 1, '2026-06-02', 'TRZ-SG-001-26', 52.100, 1.5,
     '{"desgrane":"No","bayasRotas":"No","escobajoMarron":"No","bayasDeshidratadas":"No","suciedad":"No","plagaPicado":"No","cuerposExtranos":"No","podridos":"No"}',
     0.000, 0.000, 0.000,  0.762, 0.000, 0.000, 0.000, 0.000, 1.5, 'Extra'),

    ('TA-2026-0001', 2, '2026-06-03', 'TRZ-SG-001-26', 51.800, 1.5,
     '{"desgrane":"No","bayasRotas":"No","escobajoMarron":"No","bayasDeshidratadas":"No","suciedad":"No","plagaPicado":"No","cuerposExtranos":"No","podridos":"No"}',
     0.300, 0.000, 0.000,  1.333, 0.579, 0.000, 0.000, 0.579, 1.8, 'Extra'),

    ('TA-2026-0001', 3, '2026-06-04', 'TRZ-SG-001-26', 51.200, 2.0,
     '{"desgrane":"Si","bayasRotas":"No","escobajoMarron":"No","bayasDeshidratadas":"Si","suciedad":"No","plagaPicado":"No","cuerposExtranos":"No","podridos":"No"}',
     0.800, 0.000, 0.000,  2.476, 1.563, 0.000, 0.000, 1.563, 2.0, 'Extra'),

    ('TA-2026-0001', 4, '2026-06-05', 'TRZ-SG-001-26', 50.500, 2.0,
     '{"desgrane":"Si","bayasRotas":"No","escobajoMarron":"No","bayasDeshidratadas":"Si","suciedad":"No","plagaPicado":"No","cuerposExtranos":"No","podridos":"No"}',
     1.200, 0.200, 0.000,  3.810, 2.376, 0.396, 0.000, 2.772, 2.5, 'Clase 1'),

    ('TA-2026-0001', 5, '2026-06-06', 'TRZ-SG-001-26', 49.800, 2.5,
     '{"desgrane":"Si","bayasRotas":"Si","escobajoMarron":"No","bayasDeshidratadas":"Si","suciedad":"No","plagaPicado":"No","cuerposExtranos":"No","podridos":"No"}',
     1.800, 0.300, 0.000,  5.143, 3.614, 0.602, 0.000, 4.217, 3.0, 'Clase 1'),

    ('TA-2026-0001', 6, '2026-06-07', 'TRZ-SG-001-26', 49.200, 3.0,
     '{"desgrane":"Si","bayasRotas":"Si","escobajoMarron":"Si","bayasDeshidratadas":"Si","suciedad":"No","plagaPicado":"No","cuerposExtranos":"No","podridos":"No"}',
     2.500, 0.500, 0.000,  6.286, 5.081, 1.016, 0.000, 6.098, 3.5, 'Clase 2'),

    ('TA-2026-0001', 7, '2026-06-08', 'TRZ-SG-001-26', 48.500, 3.0,
     '{"desgrane":"Si","bayasRotas":"Si","escobajoMarron":"Si","bayasDeshidratadas":"Si","suciedad":"Si","plagaPicado":"No","cuerposExtranos":"No","podridos":"No"}',
     3.200, 0.700, 0.000,  7.619, 6.598, 1.443, 0.000, 8.041, 4.0, 'Clase 2');


-- ── TA-2026-0010 (Remolacha Mónaco — 5 días, Extra → Clase 1 → Clase 2) ────────
INSERT INTO lecturas (tanda_id, dia, fecha, trazabilidad, peso_diario, temp_conservacion,
    defectos, peso_faltas_leves, peso_faltas_graves, peso_faltas_elim,
    pct_perdida, pct_leves, pct_graves, pct_elim, pct_total, pct_calibre, clasificacion)
VALUES
    ('TA-2026-0010', 1, '2026-06-02', 'TRZ-REM-010-26', 119.400, 3.0,
     '{"golpesHeridasManchas":"No","puntasRotas":"No","defectosApariencia":"No","hojaVieja":"No","puntaBlancaHumeda":"No","daNosMecanicos":"No","suciedad":"No","plagaPicado":"No","cuerposExtranos":"No","podridos":"No","rotosRajados":"No"}',
     0.000, 0.000, 0.000,  0.500, 0.000, 0.000, 0.000, 0.000, 1.0, 'Extra'),

    ('TA-2026-0010', 2, '2026-06-03', 'TRZ-REM-010-26', 118.500, 3.0,
     '{"golpesHeridasManchas":"No","puntasRotas":"No","defectosApariencia":"No","hojaVieja":"Si","puntaBlancaHumeda":"No","daNosMecanicos":"No","suciedad":"No","plagaPicado":"No","cuerposExtranos":"No","podridos":"No","rotosRajados":"No"}',
     0.600, 0.000, 0.000,  1.250, 0.505, 0.000, 0.000, 0.505, 1.2, 'Extra'),

    ('TA-2026-0010', 3, '2026-06-05', 'TRZ-REM-010-26', 117.200, 4.0,
     '{"golpesHeridasManchas":"Si","puntasRotas":"No","defectosApariencia":"No","hojaVieja":"Si","puntaBlancaHumeda":"Si","daNosMecanicos":"No","suciedad":"No","plagaPicado":"No","cuerposExtranos":"No","podridos":"No","rotosRajados":"No"}',
     1.800, 0.000, 0.000,  2.333, 1.536, 0.000, 0.000, 1.536, 1.5, 'Extra'),

    ('TA-2026-0010', 4, '2026-06-07', 'TRZ-REM-010-26', 115.800, 4.5,
     '{"golpesHeridasManchas":"Si","puntasRotas":"Si","defectosApariencia":"No","hojaVieja":"Si","puntaBlancaHumeda":"Si","daNosMecanicos":"No","suciedad":"No","plagaPicado":"No","cuerposExtranos":"No","podridos":"No","rotosRajados":"No"}',
     3.200, 0.400, 0.000,  3.500, 2.764, 0.345, 0.000, 3.110, 2.0, 'Clase 1'),

    ('TA-2026-0010', 5, '2026-06-10', 'TRZ-REM-010-26', 113.900, 5.0,
     '{"golpesHeridasManchas":"Si","puntasRotas":"Si","defectosApariencia":"Si","hojaVieja":"Si","puntaBlancaHumeda":"Si","daNosMecanicos":"Si","suciedad":"No","plagaPicado":"No","cuerposExtranos":"No","podridos":"No","rotosRajados":"No"}',
     5.400, 0.800, 0.000,  5.083, 4.740, 0.702, 0.000, 5.442, 2.5, 'Clase 2');


-- ── TA-2026-0011 (Boniato Beauregard — 4 días, Extra → Clase 1) ───────────────
INSERT INTO lecturas (tanda_id, dia, fecha, trazabilidad, peso_diario, temp_conservacion,
    defectos, peso_faltas_leves, peso_faltas_graves, peso_faltas_elim,
    pct_perdida, pct_leves, pct_graves, pct_elim, pct_total, pct_calibre, clasificacion)
VALUES
    ('TA-2026-0011', 1, '2026-06-06', 'TRZ-BON-011-26', 94.600, 14.0,
     '{"despellejados":"No","puntasRotas":"No","defectosApariencia":"No","rebrotesMayores5mm":"No","puntasDeshidratadas30mm":"No","densidadRaices":"No","daNosMecanicos":"No","plagaPicado":"No","cuerposExtranos":"No","podridos":"No","rotosRajados":"No"}',
     0.000, 0.000, 0.000,  0.421, 0.000, 0.000, 0.000, 0.000, 1.0, 'Extra'),

    ('TA-2026-0011', 2, '2026-06-08', 'TRZ-BON-011-26', 93.800, 14.5,
     '{"despellejados":"No","puntasRotas":"Si","defectosApariencia":"No","rebrotesMayores5mm":"No","puntasDeshidratadas30mm":"No","densidadRaices":"No","daNosMecanicos":"No","plagaPicado":"No","cuerposExtranos":"No","podridos":"No","rotosRajados":"No"}',
     0.500, 0.000, 0.000,  1.053, 0.533, 0.000, 0.000, 0.533, 1.2, 'Extra'),

    ('TA-2026-0011', 3, '2026-06-11', 'TRZ-BON-011-26', 92.400, 15.0,
     '{"despellejados":"Si","puntasRotas":"Si","defectosApariencia":"No","rebrotesMayores5mm":"Si","puntasDeshidratadas30mm":"No","densidadRaices":"No","daNosMecanicos":"No","plagaPicado":"No","cuerposExtranos":"No","podridos":"No","rotosRajados":"No"}',
     1.400, 0.000, 0.000,  2.737, 1.515, 0.000, 0.000, 1.515, 1.5, 'Extra'),

    ('TA-2026-0011', 4, '2026-06-14', 'TRZ-BON-011-26', 90.800, 15.0,
     '{"despellejados":"Si","puntasRotas":"Si","defectosApariencia":"Si","rebrotesMayores5mm":"Si","puntasDeshidratadas30mm":"Si","densidadRaices":"No","daNosMecanicos":"No","plagaPicado":"No","cuerposExtranos":"No","podridos":"No","rotosRajados":"No"}',
     2.800, 0.300, 0.000,  4.421, 3.084, 0.330, 0.000, 3.415, 2.0, 'Clase 1');


-- ── TA-2026-0012 (Calabaza Butternut — 6 días CON FOTOS) ──────────────────────
-- Fotos 1-6 de rsrc/Calabaza/ subidas por upload-rsrc.js.
-- 1=Extra prístino  2=Extra (manchas apariencia leves)  3=Clase 1 (manchas negras)
-- 4=Clase 2 (daños mecánicos)  5=Industria (hongos)  6=No conforme (podredumbre)
INSERT INTO lecturas (tanda_id, dia, fecha, trazabilidad, peso_diario, temp_conservacion,
    defectos, peso_faltas_leves, peso_faltas_graves, peso_faltas_elim,
    pct_perdida, pct_leves, pct_graves, pct_elim, pct_total, pct_calibre, clasificacion, photo_url)
VALUES
    ('TA-2026-0012', 1, '2026-06-11', 'TRZ-CAL-012-26', 199.500, 8.0,
     '{"defectosApariencia":"No","puntasDeshidratadas30mm":"No","densidadRaices":"No","daNosMecanicos":"No","plagaPicado":"No","cuerposExtranos":"No","podridos":"No","rotosRajados":"No"}',
     0.500, 0.000, 0.000,  0.250, 0.251, 0.000, 0.000, 0.251, 0, 'Extra',
     'https://icxnndtanwtdnumapskx.supabase.co/storage/v1/object/public/lectura-photos/TA-2026-0012/dia-1.png'),

    ('TA-2026-0012', 2, '2026-06-12', 'TRZ-CAL-012-26', 198.800, 8.0,
     '{"defectosApariencia":"Si","puntasDeshidratadas30mm":"No","densidadRaices":"No","daNosMecanicos":"No","plagaPicado":"No","cuerposExtranos":"No","podridos":"No","rotosRajados":"No"}',
     1.500, 0.000, 0.000,  0.600, 0.755, 0.000, 0.000, 0.755, 0, 'Extra',
     'https://icxnndtanwtdnumapskx.supabase.co/storage/v1/object/public/lectura-photos/TA-2026-0012/dia-2.png'),

    ('TA-2026-0012', 3, '2026-06-13', 'TRZ-CAL-012-26', 196.500, 8.5,
     '{"defectosApariencia":"Si","puntasDeshidratadas30mm":"Si","densidadRaices":"No","daNosMecanicos":"No","plagaPicado":"No","cuerposExtranos":"No","podridos":"No","rotosRajados":"No"}',
     4.500, 1.000, 0.000,  1.750, 2.290, 0.509, 0.000, 2.799, 0, 'Clase 1',
     'https://icxnndtanwtdnumapskx.supabase.co/storage/v1/object/public/lectura-photos/TA-2026-0012/dia-3.png'),

    ('TA-2026-0012', 4, '2026-06-14', 'TRZ-CAL-012-26', 190.000, 9.0,
     '{"defectosApariencia":"Si","puntasDeshidratadas30mm":"Si","densidadRaices":"Si","daNosMecanicos":"Si","plagaPicado":"No","cuerposExtranos":"No","podridos":"No","rotosRajados":"No"}',
     15.000, 7.000, 0.500,  5.000, 7.895, 3.684, 0.263, 11.842, 0, 'Clase 2',
     'https://icxnndtanwtdnumapskx.supabase.co/storage/v1/object/public/lectura-photos/TA-2026-0012/dia-4.png'),

    ('TA-2026-0012', 5, '2026-06-15', 'TRZ-CAL-012-26', 186.000, 9.5,
     '{"defectosApariencia":"Si","puntasDeshidratadas30mm":"Si","densidadRaices":"Si","daNosMecanicos":"Si","plagaPicado":"Si","cuerposExtranos":"No","podridos":"No","rotosRajados":"No"}',
     22.000, 9.000, 1.800,  7.000, 11.828, 4.839, 0.968, 17.634, 0, 'Industria',
     'https://icxnndtanwtdnumapskx.supabase.co/storage/v1/object/public/lectura-photos/TA-2026-0012/dia-5.png'),

    ('TA-2026-0012', 6, '2026-06-16', 'TRZ-CAL-012-26', 178.000, 10.0,
     '{"defectosApariencia":"Si","puntasDeshidratadas30mm":"Si","densidadRaices":"Si","daNosMecanicos":"Si","plagaPicado":"Si","cuerposExtranos":"No","podridos":"Si","rotosRajados":"Si"}',
     28.000, 11.000, 6.000,  11.000, 15.730, 6.180, 3.371, 25.281, 0, 'No conforme',
     'https://icxnndtanwtdnumapskx.supabase.co/storage/v1/object/public/lectura-photos/TA-2026-0012/dia-6.png');


-- =============================================================================
-- 11. partes_pcc — Partes de Control de Calidad de Producción
-- =============================================================================

-- ── Uva ────────────────────────────────────────────────────────────────────────
INSERT INTO partes_pcc (id, producto_id, fecha, hora, responsable, variedad, trazabilidad,
    cinta_num, mesa_num, formato_id, datos_extra, n_muestras, resultado)
VALUES
    ('PC-2026-0001', 'uva', '2026-06-15', '09:30', 'María García',
     'Sweet Globe', 'TRZ-SG-001-26', '3', '2', 'caja-carton',
     '{"para_so2": false}', 10, 'C');

-- ── Pimiento (8 partes con foto — rsrc/Pimiento/1.png … 8.png) ────────────────
-- Foto N = calidad N: 1=1%, 2=4%, 3=7%, 4=11%, 5=13% (todos C)
--                     6=17.5%, 7=25%, 8=40% (NC)
INSERT INTO partes_pcc (id, producto_id, fecha, hora, responsable, variedad, trazabilidad,
    cinta_num, mesa_num, formato_id, datos_extra, n_muestras, resultado, foto_url)
VALUES
    ('PC-2026-0010', 'pimiento', '2026-06-02', '08:00', 'María García',
     'California Rojo', 'TRZ-PIM-010-26', '1', '1', 'pim-carton-5kg',
     '{"calibre":"+10CM","coloracion":"ALTA_ROJO","longitud_media":15.2,"longitud_max":18.0,"longitud_min":13.0,"globalgap":true,"pedido":"PED-2026-050"}',
     1, 'C',
     'https://icxnndtanwtdnumapskx.supabase.co/storage/v1/object/public/lectura-photos/pcc/PC-2026-0010/foto.png'),

    ('PC-2026-0011', 'pimiento', '2026-06-04', '09:30', 'Carlos López',
     'California Rojo', 'TRZ-PIM-011-26', '2', '1', 'pim-box-plastico',
     '{"calibre":"+10CM","coloracion":"ALTA_ROJO","longitud_media":14.8,"longitud_max":17.5,"longitud_min":12.5,"globalgap":true,"pedido":"PED-2026-051"}',
     1, 'C',
     'https://icxnndtanwtdnumapskx.supabase.co/storage/v1/object/public/lectura-photos/pcc/PC-2026-0011/foto.png'),

    ('PC-2026-0012', 'pimiento', '2026-06-06', '08:15', 'María García',
     'California Verde', 'TRZ-PIM-012-26', '1', '2', 'pim-carton-5kg',
     '{"calibre":"+10CM","coloracion":"ALTA_VERDE","longitud_media":14.5,"longitud_max":17.0,"longitud_min":12.0,"globalgap":true,"pedido":"PED-2026-052"}',
     1, 'C',
     'https://icxnndtanwtdnumapskx.supabase.co/storage/v1/object/public/lectura-photos/pcc/PC-2026-0012/foto.png'),

    ('PC-2026-0013', 'pimiento', '2026-06-09', '10:00', 'Carlos López',
     'California Rojo', 'TRZ-PIM-013-26', '3', '1', 'pim-carton-5kg',
     '{"calibre":"+10CM","coloracion":"MEDIA_ROJO","longitud_media":14.2,"longitud_max":17.0,"longitud_min":11.5,"globalgap":false,"pedido":"PED-2026-053"}',
     1, 'C',
     'https://icxnndtanwtdnumapskx.supabase.co/storage/v1/object/public/lectura-photos/pcc/PC-2026-0013/foto.png'),

    ('PC-2026-0014', 'pimiento', '2026-06-11', '09:00', 'María García',
     'Lamuyo', 'TRZ-PIM-014-26', '2', '2', 'pim-box-plastico',
     '{"calibre":"+10CM","coloracion":"MEDIA_ROJO","longitud_media":13.8,"longitud_max":16.5,"longitud_min":11.0,"globalgap":false,"pedido":"PED-2026-054"}',
     1, 'C',
     'https://icxnndtanwtdnumapskx.supabase.co/storage/v1/object/public/lectura-photos/pcc/PC-2026-0014/foto.png'),

    ('PC-2026-0015', 'pimiento', '2026-06-13', '08:30', 'Carlos López',
     'California Rojo', 'TRZ-PIM-015-26', '1', '1', 'pim-carton-5kg',
     '{"calibre":"+10CM","coloracion":"BAJA_MEZCLA","longitud_media":13.5,"longitud_max":16.0,"longitud_min":10.5,"globalgap":false,"pedido":"PED-2026-055"}',
     1, 'NC',
     'https://icxnndtanwtdnumapskx.supabase.co/storage/v1/object/public/lectura-photos/pcc/PC-2026-0015/foto.png'),

    ('PC-2026-0016', 'pimiento', '2026-06-16', '10:15', 'María García',
     'Lamuyo', 'TRZ-PIM-016-26', '3', '2', 'pim-box-plastico',
     '{"calibre":"+10CM","coloracion":"BAJA_MEZCLA","longitud_media":13.0,"longitud_max":15.5,"longitud_min":10.0,"globalgap":false,"pedido":"PED-2026-056"}',
     1, 'NC',
     'https://icxnndtanwtdnumapskx.supabase.co/storage/v1/object/public/lectura-photos/pcc/PC-2026-0016/foto.png'),

    ('PC-2026-0017', 'pimiento', '2026-06-18', '08:00', 'Carlos López',
     'California Rojo', 'TRZ-PIM-017-26', '1', '1', 'pim-carton-5kg',
     '{"calibre":"+10CM","coloracion":"BAJA_AMARILLO","longitud_media":12.5,"longitud_max":15.0,"longitud_min":9.5,"globalgap":false,"pedido":"PED-2026-057"}',
     1, 'NC',
     'https://icxnndtanwtdnumapskx.supabase.co/storage/v1/object/public/lectura-photos/pcc/PC-2026-0017/foto.png');

-- ── Calabaza ───────────────────────────────────────────────────────────────────
INSERT INTO partes_pcc (id, producto_id, fecha, hora, responsable, variedad, trazabilidad,
    cinta_num, mesa_num, formato_id, datos_extra, n_muestras, resultado)
VALUES
    ('PC-2026-0020', 'calabaza', '2026-06-14', '08:30', 'María García',
     'Butternut', 'TRZ-CAL-012-26', '1', '1', 'cal-caja-carton',
     '{"calibre_range":"901-1200","coloracion":"ALTA","globalgap":true,"pedido":"PED-2026-060"}',
     1, 'C');


-- =============================================================================
-- 12. muestras_pcc — Muestras individuales de cada parte
-- =============================================================================

-- ── PC-2026-0001 (Uva — 10 muestras) ─────────────────────────────────────────
INSERT INTO muestras_pcc (parte_id, num, hora, mediciones, pct_defectos, resultado) VALUES
    ('PC-2026-0001',  1, '09:32',
     '{"peso":"4450","calibre":"17.5","pctFueraCalibre":"2.0","numRacimos":"4","homogeneidad":"Si","condicionEscobajo":"Si","coloracion":"4","brix":"13.5","totalBayas":"120","materiaExtrana":0,"suciaPolvo":1,"deshidratadas":0,"picadas":0,"rotas":2,"manchasSol":0,"podridas":0,"otros":0}',
     2.500, 'C'),
    ('PC-2026-0001',  2, '09:38',
     '{"peso":"4520","calibre":"18.0","pctFueraCalibre":"1.5","numRacimos":"5","homogeneidad":"Si","condicionEscobajo":"Si","coloracion":"5","brix":"14.0","totalBayas":"135","materiaExtrana":0,"suciaPolvo":0,"deshidratadas":0,"picadas":0,"rotas":1,"manchasSol":0,"podridas":0,"otros":0}',
     0.741, 'C'),
    ('PC-2026-0001',  3, '09:45',
     '{"peso":"4490","calibre":"17.0","pctFueraCalibre":"3.0","numRacimos":"4","homogeneidad":"Si","condicionEscobajo":"Si","coloracion":"4","brix":"13.0","totalBayas":"128","materiaExtrana":0,"suciaPolvo":2,"deshidratadas":1,"picadas":0,"rotas":1,"manchasSol":0,"podridas":0,"otros":0}',
     3.125, 'C'),
    ('PC-2026-0001',  4, '09:52',
     '{"peso":"4480","calibre":"17.5","pctFueraCalibre":"2.5","numRacimos":"5","homogeneidad":"Si","condicionEscobajo":"Si","coloracion":"4","brix":"13.8","totalBayas":"132","materiaExtrana":0,"suciaPolvo":0,"deshidratadas":0,"picadas":0,"rotas":3,"manchasSol":0,"podridas":0,"otros":0}',
     2.273, 'C'),
    ('PC-2026-0001',  5, '10:00',
     '{"peso":"4510","calibre":"18.0","pctFueraCalibre":"1.0","numRacimos":"4","homogeneidad":"Si","condicionEscobajo":"Si","coloracion":"5","brix":"14.2","totalBayas":"126","materiaExtrana":0,"suciaPolvo":1,"deshidratadas":0,"picadas":0,"rotas":2,"manchasSol":0,"podridas":0,"otros":0}',
     2.381, 'C'),
    ('PC-2026-0001',  6, '10:08',
     '{"peso":"4470","calibre":"17.5","pctFueraCalibre":"2.0","numRacimos":"4","homogeneidad":"Si","condicionEscobajo":"Si","coloracion":"4","brix":"13.5","totalBayas":"118","materiaExtrana":0,"suciaPolvo":0,"deshidratadas":0,"picadas":0,"rotas":1,"manchasSol":0,"podridas":0,"otros":0}',
     0.847, 'C'),
    ('PC-2026-0001',  7, '10:15',
     '{"peso":"4500","calibre":"18.0","pctFueraCalibre":"1.5","numRacimos":"5","homogeneidad":"Si","condicionEscobajo":"Si","coloracion":"5","brix":"14.5","totalBayas":"130","materiaExtrana":0,"suciaPolvo":1,"deshidratadas":0,"picadas":0,"rotas":0,"manchasSol":0,"podridas":0,"otros":0}',
     0.769, 'C'),
    ('PC-2026-0001',  8, '10:22',
     '{"peso":"4485","calibre":"17.5","pctFueraCalibre":"2.5","numRacimos":"4","homogeneidad":"Si","condicionEscobajo":"Si","coloracion":"4","brix":"13.0","totalBayas":"122","materiaExtrana":0,"suciaPolvo":2,"deshidratadas":0,"picadas":0,"rotas":2,"manchasSol":0,"podridas":0,"otros":0}',
     3.279, 'C'),
    ('PC-2026-0001',  9, '10:30',
     '{"peso":"4460","calibre":"17.0","pctFueraCalibre":"3.0","numRacimos":"4","homogeneidad":"Si","condicionEscobajo":"Si","coloracion":"4","brix":"13.2","totalBayas":"119","materiaExtrana":0,"suciaPolvo":1,"deshidratadas":1,"picadas":0,"rotas":1,"manchasSol":0,"podridas":0,"otros":0}',
     2.521, 'C'),
    ('PC-2026-0001', 10, '10:38',
     '{"peso":"4495","calibre":"18.0","pctFueraCalibre":"1.0","numRacimos":"5","homogeneidad":"Si","condicionEscobajo":"Si","coloracion":"5","brix":"14.0","totalBayas":"128","materiaExtrana":0,"suciaPolvo":0,"deshidratadas":0,"picadas":0,"rotas":2,"manchasSol":0,"podridas":0,"otros":0}',
     1.563, 'C');


-- ── Pimiento (1 muestra por parte, n_unidades=200) ────────────────────────────

-- PC-2026-0010: 1.0% defectos — piel perfecta
INSERT INTO muestras_pcc (parte_id, num, hora, mediciones, pct_defectos, resultado) VALUES
    ('PC-2026-0010', 1, '08:05',
     '{"n_unidades":200,"peso":5010,"temperatura":12.0,"defectos":{"materiasExtranas":{"unidades":0,"pct":0.0},"sucio":{"unidades":2,"pct":1.0},"picadoMordisqueado":{"unidades":0,"pct":0.0},"rajado":{"unidades":0,"pct":0.0},"herida":{"unidades":0,"pct":0.0},"deformado":{"unidades":0,"pct":0.0},"danoMecanico":{"unidades":0,"pct":0.0},"manchado":{"unidades":0,"pct":0.0},"cortado":{"unidades":0,"pct":0.0},"sinPedunculo":{"unidades":0,"pct":0.0},"sinMadurez":{"unidades":0,"pct":0.0},"pesoFueraCalibre":{"unidades":0,"pct":0.0},"pudriciones":{"unidades":0,"pct":0.0},"manchasSolPeseta":{"unidades":0,"pct":0.0}},"total_pct":1.0,"observaciones":""}',
     1.0, 'C');

-- PC-2026-0011: 4.0% — sucio + deformado + sin pedúnculo
INSERT INTO muestras_pcc (parte_id, num, hora, mediciones, pct_defectos, resultado) VALUES
    ('PC-2026-0011', 1, '09:35',
     '{"n_unidades":200,"peso":4980,"temperatura":12.5,"defectos":{"materiasExtranas":{"unidades":0,"pct":0.0},"sucio":{"unidades":3,"pct":1.5},"picadoMordisqueado":{"unidades":0,"pct":0.0},"rajado":{"unidades":0,"pct":0.0},"herida":{"unidades":0,"pct":0.0},"deformado":{"unidades":3,"pct":1.5},"danoMecanico":{"unidades":0,"pct":0.0},"manchado":{"unidades":0,"pct":0.0},"cortado":{"unidades":0,"pct":0.0},"sinPedunculo":{"unidades":2,"pct":1.0},"sinMadurez":{"unidades":0,"pct":0.0},"pesoFueraCalibre":{"unidades":0,"pct":0.0},"pudriciones":{"unidades":0,"pct":0.0},"manchasSolPeseta":{"unidades":0,"pct":0.0}},"total_pct":4.0,"observaciones":""}',
     4.0, 'C');

-- PC-2026-0012: 7.0% — sucio + deformado + manchado + sin pedúnculo
INSERT INTO muestras_pcc (parte_id, num, hora, mediciones, pct_defectos, resultado) VALUES
    ('PC-2026-0012', 1, '08:20',
     '{"n_unidades":200,"peso":5020,"temperatura":11.5,"defectos":{"materiasExtranas":{"unidades":0,"pct":0.0},"sucio":{"unidades":5,"pct":2.5},"picadoMordisqueado":{"unidades":0,"pct":0.0},"rajado":{"unidades":0,"pct":0.0},"herida":{"unidades":0,"pct":0.0},"deformado":{"unidades":4,"pct":2.0},"danoMecanico":{"unidades":0,"pct":0.0},"manchado":{"unidades":3,"pct":1.5},"cortado":{"unidades":0,"pct":0.0},"sinPedunculo":{"unidades":2,"pct":1.0},"sinMadurez":{"unidades":0,"pct":0.0},"pesoFueraCalibre":{"unidades":0,"pct":0.0},"pudriciones":{"unidades":0,"pct":0.0},"manchasSolPeseta":{"unidades":0,"pct":0.0}},"total_pct":7.0,"observaciones":""}',
     7.0, 'C');

-- PC-2026-0013: 11.0% — sucio + herida + deformado + manchado
INSERT INTO muestras_pcc (parte_id, num, hora, mediciones, pct_defectos, resultado) VALUES
    ('PC-2026-0013', 1, '10:05',
     '{"n_unidades":200,"peso":4950,"temperatura":13.0,"defectos":{"materiasExtranas":{"unidades":0,"pct":0.0},"sucio":{"unidades":6,"pct":3.0},"picadoMordisqueado":{"unidades":0,"pct":0.0},"rajado":{"unidades":0,"pct":0.0},"herida":{"unidades":3,"pct":1.5},"deformado":{"unidades":8,"pct":4.0},"danoMecanico":{"unidades":0,"pct":0.0},"manchado":{"unidades":5,"pct":2.5},"cortado":{"unidades":0,"pct":0.0},"sinPedunculo":{"unidades":0,"pct":0.0},"sinMadurez":{"unidades":0,"pct":0.0},"pesoFueraCalibre":{"unidades":0,"pct":0.0},"pudriciones":{"unidades":0,"pct":0.0},"manchasSolPeseta":{"unidades":0,"pct":0.0}},"total_pct":11.0,"observaciones":"Lote con irregularidades de calibre"}',
     11.0, 'C');

-- PC-2026-0014: 13.0% — límite aceptable (sucio + herida + deformado + manchado)
INSERT INTO muestras_pcc (parte_id, num, hora, mediciones, pct_defectos, resultado) VALUES
    ('PC-2026-0014', 1, '09:05',
     '{"n_unidades":200,"peso":4890,"temperatura":13.5,"defectos":{"materiasExtranas":{"unidades":0,"pct":0.0},"sucio":{"unidades":8,"pct":4.0},"picadoMordisqueado":{"unidades":0,"pct":0.0},"rajado":{"unidades":0,"pct":0.0},"herida":{"unidades":3,"pct":1.5},"deformado":{"unidades":8,"pct":4.0},"danoMecanico":{"unidades":0,"pct":0.0},"manchado":{"unidades":7,"pct":3.5},"cortado":{"unidades":0,"pct":0.0},"sinPedunculo":{"unidades":0,"pct":0.0},"sinMadurez":{"unidades":0,"pct":0.0},"pesoFueraCalibre":{"unidades":0,"pct":0.0},"pudriciones":{"unidades":0,"pct":0.0},"manchasSolPeseta":{"unidades":0,"pct":0.0}},"total_pct":13.0,"observaciones":"Límite aceptable, revisar proveedor"}',
     13.0, 'C');

-- PC-2026-0015: 17.5% → NC (sucio + herida + deformado + manchado + manchasSolPeseta)
INSERT INTO muestras_pcc (parte_id, num, hora, mediciones, pct_defectos, resultado) VALUES
    ('PC-2026-0015', 1, '08:35',
     '{"n_unidades":200,"peso":4870,"temperatura":14.0,"defectos":{"materiasExtranas":{"unidades":0,"pct":0.0},"sucio":{"unidades":8,"pct":4.0},"picadoMordisqueado":{"unidades":0,"pct":0.0},"rajado":{"unidades":0,"pct":0.0},"herida":{"unidades":5,"pct":2.5},"deformado":{"unidades":7,"pct":3.5},"danoMecanico":{"unidades":0,"pct":0.0},"manchado":{"unidades":9,"pct":4.5},"cortado":{"unidades":0,"pct":0.0},"sinPedunculo":{"unidades":0,"pct":0.0},"sinMadurez":{"unidades":0,"pct":0.0},"pesoFueraCalibre":{"unidades":0,"pct":0.0},"pudriciones":{"unidades":0,"pct":0.0},"manchasSolPeseta":{"unidades":6,"pct":3.0}},"total_pct":17.5,"observaciones":"RECHAZADO — supera umbral 15%"}',
     17.5, 'NC');

-- PC-2026-0016: 25.0% → NC grave
INSERT INTO muestras_pcc (parte_id, num, hora, mediciones, pct_defectos, resultado) VALUES
    ('PC-2026-0016', 1, '10:20',
     '{"n_unidades":200,"peso":4820,"temperatura":14.5,"defectos":{"materiasExtranas":{"unidades":0,"pct":0.0},"sucio":{"unidades":10,"pct":5.0},"picadoMordisqueado":{"unidades":0,"pct":0.0},"rajado":{"unidades":0,"pct":0.0},"herida":{"unidades":8,"pct":4.0},"deformado":{"unidades":12,"pct":6.0},"danoMecanico":{"unidades":0,"pct":0.0},"manchado":{"unidades":15,"pct":7.5},"cortado":{"unidades":0,"pct":0.0},"sinPedunculo":{"unidades":0,"pct":0.0},"sinMadurez":{"unidades":0,"pct":0.0},"pesoFueraCalibre":{"unidades":0,"pct":0.0},"pudriciones":{"unidades":0,"pct":0.0},"manchasSolPeseta":{"unidades":5,"pct":2.5}},"total_pct":25.0,"observaciones":"RECHAZADO — deterioro significativo"}',
     25.0, 'NC');

-- PC-2026-0017: 40.0% → NC muy grave (pudriciones = tolerancia cero)
INSERT INTO muestras_pcc (parte_id, num, hora, mediciones, pct_defectos, resultado) VALUES
    ('PC-2026-0017', 1, '08:05',
     '{"n_unidades":200,"peso":4750,"temperatura":15.5,"defectos":{"materiasExtranas":{"unidades":0,"pct":0.0},"sucio":{"unidades":15,"pct":7.5},"picadoMordisqueado":{"unidades":0,"pct":0.0},"rajado":{"unidades":0,"pct":0.0},"herida":{"unidades":15,"pct":7.5},"deformado":{"unidades":10,"pct":5.0},"danoMecanico":{"unidades":0,"pct":0.0},"manchado":{"unidades":20,"pct":10.0},"cortado":{"unidades":0,"pct":0.0},"sinPedunculo":{"unidades":0,"pct":0.0},"sinMadurez":{"unidades":0,"pct":0.0},"pesoFueraCalibre":{"unidades":0,"pct":0.0},"pudriciones":{"unidades":20,"pct":10.0},"manchasSolPeseta":{"unidades":0,"pct":0.0}},"total_pct":40.0,"observaciones":"RECHAZADO — podredumbre grave, lote destruido"}',
     40.0, 'NC');

-- ── Calabaza PC-2026-0020 (1 muestra, 50 unidades) ───────────────────────────
INSERT INTO muestras_pcc (parte_id, num, hora, mediciones, pct_defectos, resultado) VALUES
    ('PC-2026-0020', 1, '08:35',
     '{"n_unidades":50,"peso":52000,"temperatura":9.0,"defectos":{"materiasExtranas":{"unidades":0,"pct":0.0},"sucio":{"unidades":1,"pct":2.0},"picadoMordisqueado":{"unidades":0,"pct":0.0},"rajado":{"unidades":0,"pct":0.0},"herida":{"unidades":1,"pct":2.0},"deformado":{"unidades":0,"pct":0.0},"danoMecanico":{"unidades":1,"pct":2.0},"manchado":{"unidades":0,"pct":0.0},"cortado":{"unidades":0,"pct":0.0},"sinPedunculo":{"unidades":0,"pct":0.0},"verdesSinMadurez":{"unidades":0,"pct":0.0},"pesoFueraCalibre":{"unidades":1,"pct":2.0}},"total_pct":8.0,"observaciones":""}',
     8.0, 'C');


-- =============================================================================
-- FIN DE seed.sql
-- =============================================================================
