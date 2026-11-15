# Sitio principal desde EC2 — 2026-11-15

Se instaló la portada original, Historia y Método y datos junto al explorador musical con widgets en la misma EC2 `16.148.46.37`. Tanto el enlace interno de React como la entrada directa `/explorar` llevan a `/laboratorio/aserradores`. Las dos rutas de laboratorio siguen disponibles. El comportamiento se activa al compilar con `VITE_EXPLORADOR_EXPERIMENTAL=true`; por defecto se conserva el explorador anterior.

## Compilación

```powershell
$env:VITE_EXPLORADOR_EXPERIMENTAL='true'
$env:VITE_API_URL='/api'
$env:VITE_RESPALDO_URL='/archivos'
pnpm build
```

Frontend original compilado desde `044033e4c7a9d59275e3871eabf400ced0f7562f`. Se incorporó en `laboratorio/` el visor exacto de `67b7d848b86b7451657c4c81c86642c12028845c` y sus esquemas. Los datos científicos no se duplicaron ni modificaron: se sirven desde el directorio público existente. `/api/` solo permite GET/HEAD de las rutas públicas `/regiones/*`; no expone autenticación ni administración.

## Estado y comprobaciones

- Sitio instalado: `/srv/mangroove/web/releases/2026-11-15-r1`, enlace `/srv/mangroove/web/current`.
- Respaldo y registro: `/srv/mangroove/web/backups/2026-11-15-r1`.
- 65 archivos verificados por SHA-256 mediante HTTP local en EC2; portada, Historia, Método, ambos estuarios, catálogo y regiones responden correctamente.
- 133 pruebas en 20 archivos pasan; ESLint y compilación con TypeScript pasan.
- Navegador por túnel SSH: portada y datos originales cargan; el enlace «Explorar el mapa» abre el visor actualizado y sus teselas reales; Historia y Método cargan sin errores de consola.
- Caddy conserva íntegro el bloque anterior de `api.mangroove.earth` y añade el sitio principal. API, DB, cache y almacenamiento siguen saludables.
- Caddy antes: `3ac7accc670054c933c18ba348240472e24b42321987ebfbd066f5f6baeee435`; después: `a0f0e8c4547358fa000186593dc00b2c973d5ec329a4d4555ee7988a819199df`.
- Paquete transferido SHA-256: `c741a4d2f6906a958416c29e56168be2b216bc008c7917281b824eed927a11fe`.

El usuario cambió el DNS y se confirmó A de `mangroove.earth` a `16.148.46.37`, tanto en Porkbun como en el resolutor 1.1.1.1. Caddy obtuvo el certificado y el dominio respondió HTTP/2 200 por HTTPS a las 16:59 UTC del 15 de noviembre de 2026. `www` continúa apuntando al aparcamiento y no forma parte de este despliegue.

La verificación pública mediante `verify-main.py`, con validación TLS normal desde EC2, confirmó los hashes de los 65 archivos de interfaz y los 143 archivos científicos. Pasaron las rutas de ambas aplicaciones, la redirección de Explorar, Cache-Control, dos cargas Range HTTP 206 de PMTiles, la ausencia de rutas administrativas bajo `/api/`, el manifiesto original sin cambios y la salud de API/DB/cache/almacenamiento. Registro: `/srv/mangroove/web/backups/2026-11-15-r1/public-verification.json`.

El navegador de la máquina local sigue informando `ERR_CERT_AUTHORITY_INVALID`, también para este dominio. No se eludió la advertencia. La comprobación visual se realizó sobre los mismos archivos servidos desde EC2 mediante un túnel SSH, mientras la verificación HTTPS pública desde EC2 pasó con el almacén de confianza del sistema.

## Reversión

```sh
sudo python3 /home/ubuntu/manglar/codex_main_20261115/deploy-main.py --rollback
```

Comprueba que no haya otra versión o configuración posterior, valida y restaura el Caddyfile anterior. Conserva las publicaciones y los datos. El DNS se restaura por separado si se desea volver al alojamiento anterior. No se realizó push a GitHub ni se modificó `main`.
