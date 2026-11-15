# Publicación experimental — 2026-11-15

- Aserradores: <https://api.mangroove.earth/laboratorio/aserradores>
- Padre Ramos: <https://api.mangroove.earth/laboratorio/padre_ramos>
- Catálogo: <https://api.mangroove.earth/archivos/laboratorio/vigente.json>
- Publicación de datos y visor: `2026-11-15-r1`.
- Contrato científico: `0.2.0`; catálogo: `1`.
- Frontend compilado: `0e1874ef3382cc679e290e3ce40f015d19400b1f`.
- Motor de procedencia: `2bd175d`.

## Verificaciones realizadas

- TypeScript y ESLint sin errores. 131 pruebas en 19 archivos aprobadas, incluidas siete nuevas pruebas del contrato experimental.
- Compilan tanto la entrada original como la experimental. Vite avisa del tamaño del paquete de mapas; no es un error de compilación.
- Prettier pasa en todos los archivos con `--end-of-line auto`. El comando estándar marca los archivos originales con CRLF del checkout de Windows; se conservaron esos archivos. Los archivos añadidos y modificados pasan el comprobador estándar.
- Empaquetado: 20.402 celdas validadas, con su bloque, coordenadas y serie de 20 observaciones.
- HTTPS desde EC2: 151 archivos verificados contra SHA-256, incluido el catálogo, las dos exportaciones, el frontend y sus esquemas.
- Range e If-Match: HTTP 206 y primeros 127 bytes del PMTiles idénticos al archivo fuente. ETag y Content-Range expuestos a los orígenes ya autorizados.
- Preflight: HTTP 204. No se concede CORS a un origen ajeno. No se amplió la lista de orígenes.
- HTML sin cache; catálogo con 300 segundos; datos inmutables; archivos ausentes devuelven 404 y no-store.
- Manifiesto anterior de Estero Real sin cambios: SHA-256 `3a68aca6f149007e6708657cd06d6d1fe2b2215743657219cf891d4364ee089b`.
- API, PostgreSQL, Redis y almacenamiento continúan saludables.
- Navegador: mapas raster y vectoriales, selección de celda, fecha, sitio, métricas, control por teclado, error de sitio inexistente y móvil de 390 px. Sin desbordamiento horizontal ni errores de consola en la revisión final. Capturas de la compilación exacta publicada servida localmente.

## Límite de la comprobación externa

Esta máquina rechaza el certificado de `api.mangroove.earth`: navegador `ERR_CERT_AUTHORITY_INVALID`, curl/Schannel `SEC_E_UNTRUSTED_ROOT`. No se desactivó la validación TLS. Las comprobaciones HTTPS desde EC2 sí validan la cadena y pasan. Queda diagnosticar la confianza de certificados o intermediarios de red de esta máquina; no se atribuye la causa sin más evidencia. El usuario detuvo el control del navegador después de las comprobaciones funcionales.

## Operación y reversión

La configuración y los datos anteriores del API no se desplegaron ni reemplazaron. Solo se añadió la ruta estática, las cabeceras necesarias y sus archivos. El repositorio remoto del API conserva sus modificaciones previas.

- Aplicación: `/srv/mangroove/laboratorio/releases/2026-11-15-r1`.
- Enlace activo: `/srv/mangroove/laboratorio/current`.
- Datos: `/srv/mangroove/datos/archivos/public/laboratorio`.
- Respaldo: `/srv/mangroove/laboratorio/backups/2026-11-15-r1`.
- Caddy antes: `abe75e6c9dc043d7fffefa9489fafab571b968e60225d2608815ede95d42e50b`.
- Caddy después: `3ac7accc670054c933c18ba348240472e24b42321987ebfbd066f5f6baeee435`.

Reversión disponible, no ejecutada porque el despliegue pasó sus controles:

```sh
sudo python3 /home/ubuntu/manglar/codex_experimental_20261115/deploy.py --rollback /srv/mangroove/laboratorio/backups/2026-11-15-r1
```

El rollback manual se niega a sobrescribir una edición posterior de Caddy o un enlace a otra publicación. Los paquetes inmutables se conservan. Código del frontend en la rama local `feat/laboratorio-estuarios`; no se realizó push a GitHub ni cambio en `main`.
