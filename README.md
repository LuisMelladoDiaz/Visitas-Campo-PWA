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
