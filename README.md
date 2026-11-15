# Mangroove · web

Aplicación web pública de **Mangroove** (NASA Space Apps Challenge 2026, reto _Dancing with the SARs_, equipo Al Infinito y Masaya). Muestra, con datos del radar NISAR, qué manglares del delta del Estero Real siguen recibiendo la marea y cuáles podrían haber dejado de recibirla.

Es solo lectura y no tiene cuentas: todo lo que muestra sale de la API pública de Mangroove.

## Puesta en marcha

```bash
pnpm install           # también genera los tipos desde openapi/schema.json
cp .env.example .env   # apuntá VITE_API_URL a la API
pnpm dev               # http://localhost:3000
```

Requiere Node 22+ y pnpm 11. **La app no trae datos de demostración**: sin una API que responda, cada pantalla dice por qué no hay datos y ofrece reintentar.

| Variable            | Para qué                                                                                             |
| ------------------- | ---------------------------------------------------------------------------------------------------- |
| `VITE_API_URL`      | Base de la API de Mangroove. Su origen debe estar en `CORS_ALLOWED_ORIGINS` del backend.             |
| `VITE_RESPALDO_URL` | Base del respaldo estático que el motor deja en la CDN. Se usa solo si la API no responde. Opcional. |
| `VITE_REGION`       | Región que se abre si la API no puede listar las regiones.                                           |
| `VITE_TESELAS_URL`  | Plantilla XYZ de la imagen de referencia bajo las capas. Vacía, el mapa va sin fondo.                |

## Pantallas

| Ruta        | Qué resuelve                                                                                          |
| ----------- | ----------------------------------------------------------------------------------------------------- |
| `/`         | Intro animada, qué es Mangroove, los dos caminos y el estado real de los datos                        |
| `/historia` | Relato en cinco actos: cada acto mueve el mapa y activa su capa                                       |
| `/explorar` | **El ritmo** (pasada, reproducción, comparar A y B), **En sintonía / fuera de ritmo** y **Estanques** |
| `/metodo`   | Método, umbrales de la versión, hipótesis, procedencia, descargas y créditos                          |

El inspector de celda se abre al tocar el mapa en cualquier modo de `/explorar`. Todo el estado de esa vista (región, versión, modo, pasada, capa, celda y zoom) vive en la URL, así que **Compartir** copia un enlace permanente.

## Cómo está armado

Sigue la arquitectura de la plantilla ([docs/architecture.md](docs/architecture.md)): `routes → features → shared`.

```
src/features/
  datos/       Contrato (Zod), acceso a la API con respaldo, sesión de región y versión, reglas de dominio
  mapa/        Visor Web Mercator: capas PNG, vista dividida, selección de celda, polígonos
  partitura/   La marea como partitura y su sonido
  explorar/    Modos, leyendas, inspector y gráfica de la serie
  relato/      Historia guiada
  metodo/      Método y datos
  inicio/      Portada
  idioma/      Textos en español e inglés y formato de números y fechas
  marca/       Filtro crayola, isotipo, franja de manglar y notas
```

Decisiones que conviene conocer antes de tocar el código:

- **El contrato se valida en tiempo de ejecución.** El esquema OpenAPI declara las respuestas públicas como objetos libres, así que su forma está en `features/datos/esquemas.ts`, siguiendo `docs/dominio/contrato.md` de la API. Una respuesta con otra forma se muestra como error, no como un mapa equivocado.
- **`null` es una respuesta, no un cero.** `metricas: null` es fuera de la máscara; `if_alta: null`, datos insuficientes; `cambio: null`, sin cambio significativo; `marea_m: null`, sin estimación. Las reglas están en `features/datos/dominio.ts`.
- **Los colores de las capas son del backend.** Las leyendas copian `manifest.leyendas`. Los tokens `--manglar-*` son de marca y los `--dato-*` de datos; no se mezclan (`src/app/globals.css`).
- **El mapa no usa una librería.** Las capas son PNG en Web Mercator con esquinas comunes (`manifest.limites`), así que cada una es un rectángulo. La proyección está en `features/mapa/proyeccion.ts`.
- **La partitura es un dato.** La altura de cada nota es `marea_m`; la cabeza indica el nivel (llena alta, gris media, hueca baja); una brecha del satélite es una franja rayada sin nota. El sonido usa las notas de `public/sounds` en escala pentatónica: sin estimación de marea hay silencio y una pasada excluida por lluvia suena apagada.
- **Los textos nunca muestran nombres de campos** y presentan una posible desconexión como hipótesis para verificar en campo (`features/idioma/es.ts`).

## Verificación

```bash
pnpm check   # tipos, lint, formato y pruebas
pnpm build
```

## Pendiente

- Comparador de sensores: el esquema OpenAPI no trae la ruta `/sensores/`.
- «Inundación esperada» (`if_esperada`) todavía no tiene lugar en el inspector.
- Textos del relato y versión en inglés, sin validar con el equipo.
- Color de la clase «Sin dato»: el backend no lo pinta y aquí va sin color.

Las guías de `docs/` describen la infraestructura heredada de la plantilla (cliente tipado, errores, rutas, pruebas).
