# Laboratorio de estuarios

Entrada independiente para explorar las exportaciones estáticas del motor 0.2.0. Rutas:

- `/laboratorio/aserradores`
- `/laboratorio/padre_ramos`

La aplicación publicada sigue usando su entrada, API y contrato `mangroove/1`. Este laboratorio no requiere migraciones de base de datos ni reemplazar el motor del API. El despliegue se aloja en `api.mangroove.earth`; el dominio principal conserva su frontend actual.

## Desarrollo y comprobaciones

```powershell
pnpm install --frozen-lockfile
# Genera también el árbol de rutas del frontend existente en un checkout nuevo.
pnpm exec vite build
$env:MANGROOVE_DATA_ROOT = 'C:\ruta\data'
pnpm dev:experimental
pnpm typecheck
pnpm lint
pnpm test
pnpm build:experimental
```

Estructura de datos: `data/vigente.json`, `data/aserradores/2026-11-15-r1/manifest.json` y `data/padre_ramos/2026-11-15-r1/manifest.json`, con los archivos de cada exportación completos junto al manifiesto. `vigente.json` tiene `version: "1"` y `sitios: [{id, nombre, publicacion, contrato, manifest}]`; `manifest` es relativo al catálogo. `publicacion` identifica un conjunto inmutable, mientras `contrato: "0.2.0"` identifica su estructura.

El cliente valida manifiesto, calidad y bloques con Zod, comprueba la configuración y las fechas, transforma coordenadas WGS84 a UTM 16N y carga únicamente el bloque solicitado. El cache incluye sitio y publicación. Una respuesta fallida no queda almacenada. Los controles ascendente y descendente se muestran separadamente. `null` permanece como ausencia de datos, `p_error` se explica como cercanía al umbral y los estados no se presentan como un diagnóstico confirmado de desconexión.

## Empaquetado y despliegue

Con los cambios del frontend ya confirmados en Git:

```text
node scripts/experimental-package.mjs DATA_ROOT NEW_PACKAGE_DIR 2026-11-15-r1 ENGINE_COMMIT
```

Valida todas las celdas, su correspondencia espacial y sus veinte observaciones; copia los datos y la compilación; exporta los esquemas de entrada usados por el cliente; registra SHA-256 de cada archivo y commits de procedencia. Los esquemas del cliente admiten propiedades adicionales del motor que esta interfaz no consume. No modifica la exportación científica.

Subir el paquete y `deploy.py` a un directorio de staging fuera del directorio público. En EC2:

```text
sudo python3 deploy.py /absolute/path/to/package EXPECTED_CADDY_SHA256
```

El instalador verifica todos los hashes, rechaza versiones existentes y una configuración Caddy modificada, valida la nueva configuración, guarda respaldo y publica mediante un enlace `current`. Comprueba que el manifiesto anterior conserva su hash y que `/health/` sigue sano. Ante un error de comprobación restaura la configuración y los punteros. Los paquetes inmutables se retienen.

El instalador inicial está acotado deliberadamente a estos dos sitios y a `2026-11-15-r1`. Para futuras publicaciones se debe revisar el catálogo y su política de actualización; no reutilizar esa identidad con datos diferentes.

```text
sudo python3 deploy.py --rollback /srv/mangroove/laboratorio/backups/2026-11-15-r1
```

Caddy sirve HTML sin cache, archivos con hash y datos por publicación con cache inmutable, catálogo con cinco minutos de cache, y soporta Range/ETag y preflight para los orígenes que ya estaban permitidos. No cambia la lista de orígenes autorizados.

## Alcance científico

Estos sitios pasan los cuatro controles internos globales; Padre Ramos no pasa el control de clases en la pista descendente. No hay muestras independientes ópticas o bajo dosel para estimar exactitud. La marea procede de un modelo regional sin desfase local; las adquisiciones llegan aproximadamente al 81 % de la pleamar predicha. No se incorporan DEM ni WorldCover. La selección de sitios es exploratoria y los valores p no se ajustaron por comparaciones entre sitios.
