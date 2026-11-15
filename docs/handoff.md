# Handoff del frontend de Mangroove

Todo lo que necesita quien siga con el frontend: dónde está el diseño, qué
reglas sigue, qué pantalla consume qué ruta de la API y qué quedó pendiente.

- **Proyecto:** Mangroove, NASA Space Apps Challenge 2026, reto _Dancing with the SARs_.
- **Equipo:** Al Infinito y Masaya.
- **Qué hace la app:** muestra, con datos del radar NISAR, qué manglares del
  delta del Estero Real siguen recibiendo la marea y cuáles podrían haber
  dejado de recibirla.
- **Fuente de verdad de la funcionalidad:** los docs del repo `api`
  (`docs/dominio/contrato.md`, `docs/requerimientos/`, `docs/casos-uso/`). Si
  este documento y el backend no coinciden, gana el backend.

---

## 1. Dónde está cada cosa

| Qué                               | Dónde                                                                                                                                                           |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Prototipo v2 (el vigente)         | Figma, página **07 · Pantallas y prototipo** del archivo [Mangroove](https://www.figma.com/design/ETsgO8VShYep25RAri2s1o/Untitled?node-id=28-13)                |
| Componentes v2                    | Figma, página **06 · Componentes**, sección [v2 · componentes (crayola + acuarela)](https://www.figma.com/design/ETsgO8VShYep25RAri2s1o/Untitled?node-id=42-65) |
| Ilustraciones (PNG) e isotipo     | Figma, página [05b · Ilustraciones (crayola + acuarela)](https://www.figma.com/design/ETsgO8VShYep25RAri2s1o/Untitled?node-id=41-2)                             |
| Prototipo v1 (archivado, no usar) | Figma, páginas **10 · Archivo v1 (descartada)** y **11 · Archivo v1, componentes**                                                                              |
| Intro animada (ya en código)      | Este repo, `src/features/intro/`, ruta `/`                                                                                                                      |
| Notas grabadas para el sonido     | Drive, carpeta de notas (12 archivos `.m4a`, de Do a Si con sostenidos, más `Riff` y `C chord`)                                                                 |
| Logo original                     | Drive, `Mangroove.svg` y variantes (`MangrooveLight`, `MangrooveHard`, `MangrooveDeepBlue`)                                                                     |

En Figma el prototipo arranca en **v2 · Recorrido principal (escritorio)** y en
**v2 · Recorrido móvil**.

---

## 2. Sistema visual

### Idea general

La app sigue la línea de la intro: dibujos de **crayola con acuarela** sobre
papel. La regla más importante:

> **El dibujo decora el marco; el mapa y los datos quedan limpios.**

Nunca se dibuja con crayola un dato (una capa, una escala, una cifra o una nota
de la partitura). Las ilustraciones van en encabezados, bordes de paneles y
espacios vacíos.

### Colores de marca

| Nombre          | Hex       | Uso                                                |
| --------------- | --------- | -------------------------------------------------- |
| Verde manglar   | `#0D3B16` | Texto principal, botones principales, título       |
| Arena           | `#EAD39D` | Botón activo de la navegación, notas sobre el agua |
| Olivo           | `#737F35` | Acentos, bordes, isotipo, las dos "o" de _groove_  |
| Océano profundo | `#233E45` | Texto secundario, fondo de la partitura            |
| Carmesí         | `#52110F` | Raíces y troncos de las ilustraciones              |
| Papel           | `#F7F1E3` | Fondo de paneles, con textura de papel encima      |

Ya existen como tokens de Tailwind en `src/app/globals.css`
(`bg-manglar-oceano`, `text-manglar-papel`, etc.).

### Colores de datos

Los colores de las capas **los define el backend** (`manifest.leyendas`) porque
él dibuja los PNG. El frontend copia esos colores en las leyendas y no inventa
otros.

| Clase               | Código | Color                                                              |
| ------------------- | ------ | ------------------------------------------------------------------ |
| Vegetación inundada | `IV`   | `#199E70`                                                          |
| Agua abierta        | `OW`   | `#3987E5`                                                          |
| No inundado         | `NI`   | `#5C5B57`                                                          |
| No clasificado      | `NC`   | `#D95926`                                                          |
| Sin dato            | `ND`   | **Pendiente:** el backend no lo define. En el diseño va con trama. |

### Tipografía

- **Títulos:** Architype Bayer-Type. No está en Google Fonts ni en Figma, así
  que el diseño y la intro usan **Josefin Sans** en su lugar.
- **Texto:** Jost.
- El logotipo "mangroove" siempre va en minúscula. Todo lo demás va con
  **mayúscula solo en la primera letra** ("El ritmo", "En sintonía / fuera de
  ritmo").

### Efecto crayola

- **En Figma:** los títulos llevan los efectos _Texture_ + _Noise_, y los
  paneles una imagen de papel en mosaico y esquinas un poco irregulares.
- **En la web:** la intro lo hace con filtros SVG (`feTurbulence` +
  `feDisplacementMap`). Ver `src/features/intro/art.ts` y
  `crayon-filters.tsx`. Se pueden reutilizar en títulos de la app.

### Decoraciones

- **Franja de manglar** al pie de los paneles laterales, solo si hay espacio
  libre debajo del contenido.
- **Notas musicales:** en los espacios donde no tapan nada, con el mismo
  acomodo en todas las pantallas (lo definió Jesy en "El ritmo"). En la web
  van **animadas** (ver abajo).
- **Camarones:** solo en la intro. En la app se quitaron porque cargaban
  demasiado.
- **Raíces del manglar:** salen de la base del tronco y bajan en arcos hasta el
  agua, como en el mangle rojo. Ya está así en `art.ts`.

### Animación de las notas en los paneles

Las notas que están sobre la franja de manglar **suben como si salieran de los
árboles** y se van haciendo transparentes hasta desaparecer **antes de tocar el
contenido de la tarjeta**. En Figma están quietas porque el prototipo no puede
animarlas; la posición de Figma es su punto de partida.

1. **Techo:** el borde inferior del último elemento visible del panel (texto,
   tarjeta o botón) más 16 px. Ninguna nota pasa de ahí.
2. **Recorrido:** cada nota sube desde su posición inicial hasta el techo. Si
   el espacio libre es menor a 24 px, esa nota no se anima y se oculta.
3. **Opacidad:** aparece de 0 a 100 % en el primer 15 % del recorrido, se
   mantiene hasta la mitad y baja a 0 % justo al llegar al techo.
4. **Movimiento:** sube con un leve vaivén (±6 px de lado y ±8° de giro), en
   4 a 7 s por nota, con un retraso al azar de 0 a 3 s para que no salgan
   todas juntas. Al terminar vuelve a empezar desde abajo.
5. **El techo se recalcula** cuando cambia el contenido del panel (por ejemplo,
   al abrir otra celda), con un `ResizeObserver`.
6. **Accesibilidad:** las notas llevan `aria-hidden="true"` y
   `pointer-events: none`, van debajo del contenido y, con
   `prefers-reduced-motion`, se quedan quietas.
7. **Rendimiento:** animar solo `transform` y `opacity`, y pausar la animación
   cuando el panel no está visible.

Ejemplo con CSS; el JavaScript solo calcula `--subida` (start - techo):

```css
.nota-flotante {
	animation: nota-sube var(--duracion, 5s) ease-out var(--retraso, 0s) infinite;
}
@keyframes nota-sube {
	0% {
		transform: translate(0, 0) rotate(var(--giro-inicial, -8deg));
		opacity: 0;
	}
	15% {
		opacity: 1;
	}
	50% {
		opacity: 1;
	}
	100% {
		transform: translate(var(--deriva, 6px), calc(-1 * var(--subida)))
			rotate(var(--giro-final, 8deg));
		opacity: 0;
	}
}
@media (prefers-reduced-motion: reduce) {
	.nota-flotante {
		animation: none;
	}
}
```

---

## 3. Textos: nombres legibles, nunca nombres de columnas

El usuario nunca ve nombres de campos del contrato ni códigos de requerimientos
(`RF-20`, `CU-04`…).

| Campo del contrato         | Texto en la interfaz                       |
| -------------------------- | ------------------------------------------ |
| `if_alta`                  | Inundación en marea alta                   |
| `if`                       | Inundación en todas las pasadas            |
| `n_fechas_alta`            | Pasadas con marea alta                     |
| `n_fechas`                 | Pasadas usadas                             |
| `p_error`                  | Probabilidad de error de la clasificación  |
| `cambio.confianza`         | Confianza del cambio                       |
| `cambio.delta_hv_db`       | Caída de la señal HV (dB)                  |
| `desconectada: true`       | Posible desconexión: verificar en campo    |
| `datos_suficientes: false` | Datos insuficientes                        |
| `en_mascara: false`        | Fuera de la máscara de manglar             |
| `if_esperada`              | Inundación esperada (todavía sin pantalla) |
| `marea_nivel`              | Marea alta / media / baja / sin estimación |
| `manifest`, `corrida`      | Versión de los datos                       |

Los porcentajes se muestran enteros (`0,05` → `5 %`) y la marea siempre dice
"estimada".

---

## 4. Componentes v2

Están en la sección **v2 · componentes**. Son copias rediseñadas de la v1, así
que la v1 quedó intacta como archivo.

| Componente                                               | Para qué                                                                                                                                                                  |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `v2/nav/barra superior`                                  | Logo, Historia / Explorar / Método y datos, **selector de región**, estado de los datos, **Compartir** e **idioma ES / EN**                                               |
| `v2/nav/modos de explorar`                               | El ritmo / En sintonía, fuera de ritmo / Estanques                                                                                                                        |
| `v2/marea/partitura`                                     | La marea como notas sobre un pentagrama en el agua. Variantes: pasada elegida, reproduciendo, comparar, conectividad. Incluye **botón de sonido** y la **gota de lluvia** |
| `v2/marea/partitura · especificación de brecha y lluvia` | Guía de cómo se ve una brecha del satélite (franja rayada, sin nota) y una pasada con lluvia                                                                              |
| `v2/pasada/tarjeta`                                      | Fecha local, órbita y marea estimada de una pasada                                                                                                                        |
| `v2/mapa/leyenda`                                        | Compuesto RGB, clases y conectividad                                                                                                                                      |
| `v2/inspector/panel`                                     | Inspector de una celda: posible desconexión, conectada, datos insuficientes, fuera de la máscara                                                                          |
| `v2/control/botón`, `capa`, `filtro`                     | Controles                                                                                                                                                                 |
| `v2/mapa/controles`, `v2/mapa/aviso`                     | Zoom, ubicar, capas y avisos sobre el mapa                                                                                                                                |
| `v2/marca/isotipo en círculo`                            | Isotipo de la clave de fa con manglar, en su círculo                                                                                                                      |

**La partitura es un dato, no un adorno:** la altura de cada nota es
`marea_m`, la nota llena indica marea subiendo y la hueca bajando.

---

## 5. Pantallas y de dónde sale cada dato

`{r}` es la región y `{v}` la versión del manifiesto cargado. Todas las rutas
son de solo lectura, salvo la exploración.

| Pantalla                         | Qué resuelve                            | Rutas de la API                                                        | Campos clave                                                                                                         |
| -------------------------------- | --------------------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| P01 Inicio (y M01)               | Propósito y dos caminos                 | `GET /regiones`, manifiesto                                            | `version`, `fuente.madurez`                                                                                          |
| P02–P06 Relato                   | Historia en 5 actos                     | manifiesto (capas por acto)                                            | Textos del frontend, pendientes de validar                                                                           |
| P07 El ritmo                     | Ver una pasada con su marea             | `GET /regiones/{r}/versiones/{v}/manifest`, `.../fechas/{f}/capas/rgb` | `fechas[]`: `fecha_hora`, `orbita`, `track`, `marea_m`, `marea_nivel`, `lluvia_3d_mm`, `usada_en_if_alta`; `brechas` |
| P08 Reproducción                 | Animación de clases                     | `.../fechas/{f}/capas/clases`                                          | `leyendas.clases`; las brechas se saltan                                                                             |
| P09 Comparar A y B               | Deslizador entre dos pasadas            | dos capas por fecha                                                    | Avisar si cambian órbita o track                                                                                     |
| N06 Comparar con otros satélites | NISAR frente a óptico o banda C         | `.../fechas/{f}/sensores`                                              | Fecha, días de diferencia, % de nubes                                                                                |
| P10, P10b, P10c Conectividad     | Inundación en marea alta por hectárea   | `.../capas/if_alta`, `.../capas/desconexion`                           | `umbrales.if_alta_desconectada`; datos insuficientes con trama                                                       |
| N02 Resumen por país             | Hectáreas por país                      | `.../resumen` (JSON o CSV)                                             | Manglar, desconectado, insuficiente, pérdida de copa                                                                 |
| N03 Explorar con otros umbrales  | Ver cuánto cambia el mapa               | `POST .../exploraciones`                                               | `exploracion: true`; errores `422` y `429`                                                                           |
| P11–P14 Inspector                | Historia de una celda                   | `.../celdas/{id}` o `.../celdas?lon=&lat=`                             | `metricas`, `cambio`, `serie` unida a `fechas` por `fecha_id`                                                        |
| P15 Estanques                    | Candidatos a restauración               | `.../estanques`                                                        | Área, clase, distancia al canal, inundación vecina, puntaje                                                          |
| P16 Método y datos               | Fuentes, umbrales, hipótesis, descargas | `.../metodo`, `.../hipotesis`, `.../descargas`                         | Pruebas H1–H3 o motivo de no evaluable; tamaño, suma y licencia                                                      |
| N01 Elegir región                | Cambiar de región                       | `GET /regiones`                                                        | Solo regiones con versión publicada                                                                                  |
| N05 Compartir                    | Enlace permanente                       | —                                                                      | Región, versión, capa, fecha y zoom; versión retirada = `410`                                                        |
| N07 Sin conexión                 | La API no responde                      | Respaldo estático en la CDN                                            | Sin inspector ni exploración                                                                                         |
| P17 Capa no disponible           | Falla una capa                          | —                                                                      | Reintentar u otra pasada, sin perder la vista                                                                        |
| M01–M05, T01                     | Móvil (360 px) y tableta (768 px)       | Las mismas                                                             | Hojas inferiores en lugar de paneles                                                                                 |

---

## 6. Reglas de datos que no se pueden romper

Vienen de `docs/requerimientos/reglas-negocio.md` del backend.

1. **`null` tiene significado:**
    - `metricas: null`: fuera de la máscara de manglar.
    - `cambio: null`: sin cambio significativo.
    - `if_alta: null`: datos insuficientes. **Nunca** mostrarlo como 0.
    - `marea_m: null`: sin estimación de marea.
2. **La marea vive en el manifiesto.** La serie de una celda va en el mismo
   orden que `manifest.fechas` y se une por `fecha_id`.
3. **Todo pertenece a una versión.** Cada petición usa la versión del
   manifiesto cargado.
4. **Una posible desconexión es una hipótesis para verificar en campo,** no una
   causa, un responsable ni la muerte del manglar.
5. **La probabilidad de error y la confianza del cambio son medidas
   distintas.** Van en lugares distintos y con nombres distintos.
6. **Las brechas del satélite se declaran y nunca se interpolan.** En la
   partitura van como franja rayada, sin nota.
7. **Una pasada con 60 mm de lluvia o más en los tres días previos no cuenta
   para la marea alta.** En la partitura se ve tenue y con una gota.
8. **Los instantes vienen en UTC y se muestran en la hora local de la región**
   (`region.zona_horaria`).
9. **"No clasificado" y "Sin dato" son estados distintos.**

---

## 7. La intro (ya en código)

- **Dónde:** `src/features/intro/`, ruta `/`.
    - `art.ts`: dibujos SVG con filtros, rasterizados una vez a canvas.
    - `scene.ts`: la cámara (camarón, cardumen y subida al manglar).
    - `intro-screen.tsx`: la línea de tiempo de GSAP, el título letra por
      letra, la frase, el isotipo y el equipo.
- **Accesibilidad:** respeta `prefers-reduced-motion` y tiene botón para
  saltar o repetir.
- **Al terminar:** según el diseño, debería mostrar los botones "Ver la
  historia" y "Explorar el mapa" (P01). En código todavía no están.

---

## 8. Sonido (pendiente de programar)

La idea es tocar la partitura: cada pasada suena con una nota cuya altura sale
de `marea_m`.

- **Archivos:** 12 notas `.m4a` en el Drive (Do a Si con sostenidos). El
  navegador reproduce m4a sin convertir.
    - Copiarlas a `public/sounds/notas/`.
    - Renombrarlas sin `#`: `C4.m4a`, `Cs4.m4a`, `D4.m4a`, `Ds4.m4a`, `E4.m4a`,
      `F4.m4a`, `Fs4.m4a`, `G4.m4a`, `Gs4.m4a`, `A4.m4a`, `As4.m4a`, `B4.m4a`.
- **Librería sugerida:** `Tone.Sampler`, que afina las notas que falten.
- **Correspondencia sugerida:**

    | Dato                                 | Sonido                                                                             |
    | ------------------------------------ | ---------------------------------------------------------------------------------- |
    | Altura de la marea                   | Nota de una escala pentatónica (Do, Re, Mi, Sol, La): marea baja grave, alta aguda |
    | Orden de las pasadas                 | Ritmo de la reproducción                                                           |
    | Brecha o marea "desconocida"         | Silencio                                                                           |
    | Pasada con lluvia fuerte             | Nota apagada                                                                       |
    | Clase de la celda elegida (opcional) | Cambio de instrumento                                                              |

- **Detalle técnico:** el audio solo puede empezar después de un clic (es una
  regla del navegador). El botón de sonido de la partitura cumple ese papel.

---

## 9. Idiomas

La interfaz va en español e inglés, con el selector **ES / EN** de la barra.
La API devuelve códigos, no textos (`RNF-14`), así que todos los textos y
leyendas en los dos idiomas son del frontend.

---

## 10. Datos de demostración en el prototipo

Varias pantallas usan cifras inventadas, marcadas como "demostración": resumen
por país, hipótesis H1–H3, tamaños de descarga, la escena de Sentinel-2 con 87
% de nubes y la lista de estanques. **Se reemplazan por la respuesta real de la
API.** No copiarlas al código.

---

## 11. Pendientes y decisiones abiertas

- [ ] Color de la clase **ND** (sin dato): el backend no lo define.
- [ ] Fuente **Architype Bayer-Type**: conseguir la licencia o confirmar Josefin Sans.
- [ ] **Textos del relato** (5 actos): son de demostración, falta validarlos con el equipo.
- [ ] **Versión en inglés** de todos los textos.
- [ ] **Inundación esperada** (`if_esperada`): está en el contrato pero todavía no tiene lugar en el inspector.
- [ ] **Sin decoración:** "Comparar A y B", "Reproducción" y "Estanques" no llevan manglar porque su contenido llena el panel.
- [ ] **Botones de la intro:** "Ver la historia" y "Explorar el mapa" todavía no están en código.
- [ ] **Sonido:** programarlo (sección 8).
- [ ] **Revisión con usuarios reales:** el prototipo no se probó con personas. Tareas sugeridas:
    - Encontrar una zona con posible desconexión y explicar por qué.
    - Distinguir una celda con datos insuficientes de una fuera del manglar.
    - Comparar dos pasadas y decir cuál tenía marea alta.
    - Encontrar de dónde salen los datos.
