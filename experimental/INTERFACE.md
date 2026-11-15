# Interfaz experimental integrada

Dirección aprobada por el usuario el 2026-11-15: conservar la interfaz original, especialmente la línea temporal con notas musicales, y añadir información mediante widgets laterales desplegables.

Se reutilizan `Reproductor`, `Partitura`, el módulo de sonido, `FranjaManglar`, las imágenes originales de marca y el CSS global. La partitura acepta un subconjunto explícito de datos en lugar de exigir todo el contrato del API anterior. El adaptador conserva los 20 instantes UTC, mareas, pistas e identificadores; no inventa lluvia ni brechas instrumentales. La interfaz y las notas muestran hora local de Nicaragua.

El mapa ocupa el espacio principal. La barra de papel conserva la marca y navegación; a la izquierda se despliegan los widgets La pasada, Capas del mapa, Esta celda, Pruebas de calidad, Marea y límites, y Datos y procedencia. El reproductor original permanece abajo, con reproducción, pausa, pasos, selección por nota, flechas del teclado y activación explícita del audio. Fecha y capa quedan en la URL al compartir.

En escritorio se mantiene la composición original: cabecera de 64 px, panel de 328 px y partitura superpuesta al mapa. En móvil el mapa, la partitura y los widgets se apilan sin desbordar la página; el pentagrama conserva su desplazamiento horizontal accesible. El mapa admite Enter para consultar su centro.

El estado experimental y la ausencia de validación independiente siguen visibles. Padre Ramos conserva su resultado negativo en el control descendente. El cambio es de interfaz: exportaciones científicas, esquema 0.2.0 y catálogo de datos no se modifican.
