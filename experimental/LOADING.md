# Carga y tráfico del visor — 2026-11-15

Publicado en `https://mangroove.earth/laboratorio/chismuyo` y en la ruta equivalente de `api.mangroove.earth`. `/explorar` y `/laboratorio` abren Chismuyo, Honduras.

## Cambios

- Se mantiene la imagen anterior mientras termina la siguiente; el aviso indica que aún se muestra la anterior, evitando atribuirla a la fecha elegida.
- Se conservan tres fuentes recientes, con eliminación de las más antiguas. Una solicitud reemplazada se cancela y una respuesta tardía no cambia la selección vigente.
- La reproducción espera a la carga y mantiene cada pasada visible 1,3 segundos antes de avanzar. Un error la detiene y permite reintentar la capa sin recargar toda la página.
- La interfaz y la partitura se cargan separadas de MapLibre; se solicita el módulo de mapa en paralelo con los metadatos. El JavaScript de entrada pasó de 471,54 kB gzip a 172,22 kB gzip. El total descargado no disminuye sustancialmente: se prioriza la interfaz.
- Se precarga el catálogo; hay un aviso adicional cuando la carga tarda, estado accesible de ocupación y recuperación si falla el módulo del mapa.
- Se conservan resolución de radar, datos científicos, sonido, marca, tipografía y partitura originales.

## Mediciones

Escenario controlado en navegador a 1280 × 720, encuadre inicial de Chismuyo. Servidor de pruebas con gzip, respuestas Range y cache inmutable; imágenes EOX idénticas servidas mediante un proxy local para contabilizarlas. Bytes de respuesta, no cabeceras ni tráfico TLS. No incluye Google Fonts externo. MB decimal = 1.000.000 bytes. Estos resultados no son una medición de latencia pública, FPS ni Core Web Vitals.

| Acción                                    |     Antes |  Después |
| ----------------------------------------- | --------: | -------: |
| Abrir el visor                            |  1,017 MB | 1,018 MB |
| Una fecha nueva, mismo encuadre           |  0,260 MB | 0,260 MB |
| Volver inmediatamente a la fecha anterior |  0,241 MB |     0 MB |
| Activar el sonido por primera vez         | Sin medir | 0,915 MB |
| Consultar una celda, primer bloque        | Sin medir | 0,081 MB |

El recorrido de veinte selecciones en una sesión ya iniciada añadió 4,851 MB (parte de la información ya estaba en cache). Un recorrido completo al mismo zoom ronda 5–6 MB; es una estimación, no un tamaño fijo. Acercarse o desplazarse requiere nuevas teselas. El conjunto completo de Chismuyo ocupa 47.557.682 bytes, pero no se descarga entero al abrir el visor. La caché de tres fechas se aplica a la sesión y al encuadre; no se promete cero tráfico al recargar, cambiar de zoom o volver a una fecha ya expulsada.

## Validación y publicación

- 136 pruebas en 21 archivos; TypeScript y ESLint pasan. Compilan la portada original y el visor experimental.
- Pruebas nuevas de conservación de la imagen, reutilización de fuentes, descarte de respuestas tardías, reintento y límite de caché.
- Navegador: fechas, modos raster/vector, selección de celda, audio, recuperación de un HTTP 503 controlado y carga demorada 2,4 segundos por petición PMTiles. En móvil de 390 px, documento de 380 px sin desbordamiento horizontal. Sin errores de consola en la revisión final de la compilación.
- Commit de rendimiento: `2e466bfbd2d432e2933dd8f55d51e2849b1c9e47`. Hitos anteriores: `ebdcf24` y `48b98ec` para Chismuyo.
- Publicación activa de ambos sitios: `2026-11-15-loading-r1`; anterior: `2026-11-15-chismuyo-r1`. Se retuvieron archivos y versiones previas.
- HTTPS desde EC2 verificó 281 archivos. API, DB, cache y almacenamiento saludables. Datos, catálogo y Caddy conservan sus hashes de la publicación de Chismuyo.
- Registro: `/srv/mangroove/web/backups/2026-11-15-loading-r1/deployment.json`.
- Paquete transferido SHA-256: `a9a876bbfc6a853293860f791a16484c59265dfad1a6a3f5f9d99e30d8d96fe9`.

La revisión visual y las mediciones se hicieron sobre la compilación servida localmente, con el mismo contenido de datos. La comprobación pública se hizo con validación HTTPS normal desde EC2; permanece el problema de confianza de certificados del navegador local documentado previamente. No se realizó push a GitHub.

## Transiciones entre pasadas (rama `perf/transiciones-pasadas`)

- Al terminar de mostrar una pasada se precargan en segundo plano la siguiente y la anterior (solo la siguiente con ahorro de datos o conexión 2G/3G). La precarga empieza después de la pasada elegida, para no competir con ella. Caché de cinco fuentes; las vecinas no se expulsan.
- El aviso de carga aparece solo si la pasada tarda más de 300 ms.
- Fundido de 200 ms entre la pasada anterior y la nueva, en lugar de un corte.
- Selector «Recorrido de la partitura»: «Nota por nota» (por defecto) sigue la partitura en orden cronológico; «Misma órbita» hace que las flechas y la reproducción salten a la siguiente pasada ascendente o descendente, porque las órbitas miran el manglar con otro ángulo y su brillo cambia aunque no cambie el agua. `?orbita=misma` abre con esta opción. La precarga sigue el recorrido elegido.
- Navegador local con datos de Chismuyo: al avanzar, cero peticiones PMTiles nuevas y la pasada lista en 50–80 ms, sin aviso. Las mediciones de tiempo con la ventana en segundo plano no son válidas (la página baja a unos 5 cuadros por segundo).
