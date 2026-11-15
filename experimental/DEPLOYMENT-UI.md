# Interfaz original con widgets — 2026-11-15

Actualización publicada en las dos rutas experimentales: [Aserradores](https://api.mangroove.earth/laboratorio/aserradores) y [Padre Ramos](https://api.mangroove.earth/laboratorio/padre_ramos).

El usuario pidió conservar la identidad original y la línea temporal musical. Se reutilizan los componentes originales de partitura, reproducción y sonido, tipografía, marca y texturas. La barra lateral contiene seis widgets desplegables: pasada, capas, celda, calidad, marea y procedencia. El mapa y la partitura permanecen a la vista en escritorio; en móvil se apilan con los widgets.

## Publicación y evidencia

- Visor activo: `2026-11-15-r2`; frontend `67b7d848b86b7451657c4c81c86642c12028845c`.
- Datos inmutables y catálogo siguen en `2026-11-15-r1`; contrato científico `0.2.0`, sin cambios.
- Motor de procedencia: `2bd175d`; 20.402 celdas verificadas durante el empaquetado.
- 133 pruebas en 20 archivos pasan. TypeScript, ESLint y compilaciones original y experimental pasan.
- Navegador: selección musical, flechas del teclado, reproducción y pausa, activación de grabaciones originales, cambio de estuario e inspección de celda. Móvil de 390 px sin desbordamiento horizontal. Sin errores de consola en la revisión final.
- Capturas tomadas de la compilación exacta publicada, servida localmente. El navegador local sigue rechazando el certificado público con `ERR_CERT_AUTHORITY_INVALID`; no se omitió la validación TLS.
- Desde EC2, los 30 archivos de interfaz y esquemas coinciden por HTTPS con sus SHA-256. Ambas rutas entregan la aplicación. API, base de datos, cache y almacenamiento saludables.
- El instalador verificó también todos los hashes científicos existentes antes del cambio. No cambió datos, catálogo, Caddy ni el manifiesto anterior de Estero Real.
- Caddy SHA-256: `3ac7accc670054c933c18ba348240472e24b42321987ebfbd066f5f6baeee435`.
- Catálogo SHA-256: `06aea72987ca0ad204dec49fa08239766e7409bb9e5752c9c22b9d3766a77a6d`.
- Archivo de transferencia SHA-256: `695ced7b9fdd18a681753dbe12ec3e7f892e2dffc7f851836e5d218b037a22d6`.

Registro del servidor: `/srv/mangroove/laboratorio/backups/2026-11-15-r2/ui-deployment.json`.

## Reversión

```sh
sudo python3 /home/ubuntu/manglar/codex_experimental_20261115/ui-r2/deploy-ui.py --rollback 2026-11-15-r2
```

Restaura únicamente el enlace al visor r1. No se ejecutó: los controles del despliegue pasaron. La publicación r2 se conserva. El código está en la rama local `feat/laboratorio-estuarios`; no se hizo push a GitHub ni se cambió `main`.

Continúa pendiente la validación científica independiente y el diagnóstico de confianza TLS de esta máquina. Los controles por pista y los límites de la evidencia siguen visibles en los widgets.
