/**
 * Spanish copy (main language).
 *
 * Rules of the copy, from the handoff:
 *  - The visitor never sees contract field names or requirement codes.
 *  - A possible disconnection is a hypothesis to verify in the field, never a
 *    cause, a culprit or the death of the mangrove.
 *  - The tide is always "estimada".
 *  - Sentence case everywhere; the wordmark "mangroove" stays lowercase.
 */

const plural = (n: number, uno: string, varios: string) => (n === 1 ? uno : varios);

export const es = {
	comun: {
		sinDato: 'sin dato'
	},

	nav: {
		historia: 'Historia',
		explorar: 'Explorar',
		metodo: 'Método y datos'
	},

	barra: {
		inicio: 'Mangroove, ir al inicio',
		navegacion: 'Secciones',
		saltar: 'Saltar al contenido',
		region: 'Región',
		elegirRegion: 'Elegir región',
		soloPublicadas: 'Solo aparecen las regiones con datos publicados.',
		compartir: 'Compartir',
		copiado: 'Enlace copiado',
		idioma: 'Idioma',
		cambiarIdioma: 'English',
		menu: 'Abrir el menú',
		cargando: 'Cargando los datos…',
		sinDatos: 'Datos no disponibles',
		respaldo: 'Sin conexión',
		version: (version: string, mision: string, madurez: string) =>
			`Versión ${version} · ${mision} ${madurez}`
	},

	madurez: (codigo: string) =>
		(({ provisional: 'provisional', validado: 'validado' }) as Record<string, string>)[
			codigo
		] ?? codigo,

	orbita: (codigo: string) =>
		(({ asc: 'ascendente', desc: 'descendente' }) as Record<string, string>)[codigo] ?? codigo,

	orbitaLarga: (codigo: string) =>
		(
			({
				asc: 'ascendente (de sur a norte)',
				desc: 'descendente (de norte a sur)'
			}) as Record<string, string>
		)[codigo] ?? codigo,

	nivelMarea: {
		alta: 'alta',
		media: 'media',
		baja: 'baja',
		desconocida: 'sin estimación'
	},

	clases: {
		IV: {
			nombre: 'Vegetación inundada',
			ayuda: 'Agua bajo los árboles: la señal rebota entre el agua y los troncos.'
		},
		OW: {
			nombre: 'Agua abierta',
			ayuda: 'Canales, estanques y golfo: el agua lisa desvía la señal.'
		},
		NI: { nombre: 'No inundado', ayuda: 'Manglar o suelo sin agua en esa pasada.' },
		NC: { nombre: 'No clasificado', ayuda: 'La señal no encajó en ninguna regla.' },
		ND: {
			nombre: 'Sin dato',
			ayuda: 'El satélite no midió esa celda en la pasada. Va sin color: se ve la imagen de referencia.'
		}
	},

	campos: {
		ifAlta: 'Inundación en marea alta',
		ifTotal: 'Inundación en todas las pasadas',
		pError: 'Probabilidad de error de la clasificación',
		confianza: 'Confianza del cambio'
	},

	estado: {
		cargando: 'Cargando los datos del manglar…',
		reintentar: 'Reintentar',
		abrirVigente: 'Abrir la versión vigente',
		paginaNoExiste: 'Esta página no existe',
		paginaNoExisteDetalle:
			'Puede que el enlace esté incompleto o que la página haya cambiado de lugar.',
		irAlInicio: 'Ir al inicio',
		error: {
			'sin-conexion': {
				titulo: 'Sin conexión con el servidor',
				detalle:
					'No pudimos traer los datos de Mangroove. Revisá tu conexión y volvé a intentar; lo que estabas viendo no se pierde.'
			},
			retirada: {
				titulo: 'Esta versión de los datos fue retirada',
				detalle:
					'El enlace apunta a una versión que ya no se publica. Podés abrir la versión vigente de la misma región.'
			},
			'no-encontrada': {
				titulo: 'Todavía no hay datos publicados',
				detalle:
					'La región que buscás no existe o aún no tiene una versión publicada. Cuando el equipo publique la primera, aparecerá aquí.'
			},
			formato: {
				titulo: 'No pudimos leer los datos',
				detalle:
					'El servidor respondió con un formato que esta versión de la app no entiende. Preferimos no mostrar nada antes que mostrar un mapa equivocado.'
			},
			otro: {
				titulo: 'Algo salió mal',
				detalle: 'Ocurrió un problema inesperado. Volvé a intentar en unos segundos.'
			}
		}
	},

	inicio: {
		evento: 'NASA Space Apps 2026 · Dancing with the SARs',
		frase: '¿Sigue llegando la marea al manglar del Estero Real? Mangroove lo escucha con el radar del satélite NISAR, que atraviesa nubes y hojas, y compara cada pasada con la altura de la marea.',
		historia: 'Ver la historia',
		explorar: 'Explorar el mapa',
		equipo: 'Al Infinito y Masaya',
		creditos: 'Ilustración: equipo Mangroove. Radar: NASA-ISRO NISAR.',
		datos: (pasadas: number, version: string, madurez: string, generado: string) =>
			`${pasadas} ${plural(pasadas, 'pasada', 'pasadas')} del satélite. Versión ${version} de los datos, ${madurez}, generada el ${generado}.`,
		sinDatos:
			'Podés leer la historia y el método mientras tanto. El mapa se llena cuando haya una versión publicada.'
	},

	modos: {
		etiqueta: 'Modos de exploración',
		ritmo: 'El ritmo',
		sintonia: 'En sintonía / fuera de ritmo',
		estanques: 'Estanques'
	},

	mapa: {
		visor: {
			mapa: 'Mapa',
			instrucciones:
				'Arrastrá para mover el mapa. Con el teclado: flechas para mover, más y menos para acercar o alejar, cero para ver toda la región y Enter para inspeccionar la celda del centro.',
			divisor: 'Divisor entre la pasada A y la pasada B',
			moverIzquierda: 'Mover el divisor a la izquierda',
			moverDerecha: 'Mover el divisor a la derecha'
		},
		acercar: 'Acercar',
		alejar: 'Alejar',
		encajar: 'Ver toda la región',
		cargandoCapa: 'Cargando la capa…',
		capaFallo: 'No se pudo cargar esta capa',
		capaFalloDetalle:
			'El mapa queda donde estaba. Podés reintentar o pasar a otra pasada sin perder la vista.',
		otraPasada: 'Probar otra pasada',
		capaSinPublicar: 'Esta capa no está publicada',
		capaSinPublicarDetalle:
			'La versión cargada no incluye esta capa. Se muestra solo la imagen de referencia.',
		fueraDeGrilla: 'Ese punto está fuera del área analizada',
		fueraDeGrillaDetalle: 'Tocá dentro de la región para ver la historia de una hectárea.',
		sinConexion: 'Sin conexión con el servidor',
		sinConexionDetalle:
			'Estás viendo el respaldo de la última versión publicada. El inspector de celdas no está disponible sin conexión.',
		verMas: 'Ver más',
		verMenos: 'Ver menos',
		atribucion:
			'Imagen de referencia 2016: Sentinel-2 cloudless, EOX (CC BY 4.0). Radar: NASA-ISRO NISAR.',
		atribucionSinBase: 'Radar: NASA-ISRO NISAR.',
		descripcionPasada: (capa: string, pasada: string) =>
			`El mapa muestra ${capa} de la pasada del ${pasada}.`,
		descripcionComparar: (capa: string, a: string, b: string) =>
			`El mapa está dividido. A la izquierda, ${capa} de la pasada A: ${a}. A la derecha, la pasada B: ${b}.`,
		descripcionCapa: (capa: string, region: string) => `El mapa muestra ${capa} en ${region}.`
	},

	partitura: {
		seccion: 'Partitura de la marea',
		etiqueta:
			'Pasadas del satélite. La altura de cada nota es la marea estimada en ese momento. Usá las flechas para cambiar de pasada.',
		anterior: 'Pasada anterior',
		siguiente: 'Pasada siguiente',
		reproducir: 'Reproducir las pasadas',
		pausar: 'Pausar',
		activarSonido: 'Activar el sonido: cada pasada suena según su marea',
		silenciar: 'Silenciar',
		sinEstimacion: 'sin estimación de marea',
		sinEstimacionCorto: 'sin marea',
		brechaCorto: 'sin datos',
		vacia: 'Esta versión todavía no tiene pasadas.',
		brecha: (desde: string, hasta: string) =>
			`Brecha del satélite del ${desde} al ${hasta}: no hubo observaciones y no se rellenan.`,
		resumen: (n: number, desde: string, hasta: string) =>
			`${n} ${plural(n, 'pasada', 'pasadas')}, del ${desde} al ${hasta}`,
		nota: (p: {
			fecha: string;
			hora: string;
			orbita: string;
			marea: string | null;
			lluvia: boolean;
			cuenta: boolean;
		}) =>
			`${p.fecha}, ${p.hora}. Órbita ${p.orbita}. ${
				p.marea ? `Marea estimada ${p.marea}.` : 'Sin estimación de marea.'
			}${p.lluvia ? ' Lluvia fuerte en los tres días previos: no cuenta para la marea alta.' : ''}${
				p.cuenta ? ' Cuenta para la inundación en marea alta.' : ''
			}`
	},

	pasada: {
		orbita: 'Órbita',
		marea: 'Marea estimada',
		hora: (hora: string, region: string) => `${hora}, hora local de ${region}`,
		mareaValor: (metros: string, nivel: string) => `${metros} sobre el nivel medio, ${nivel}`,
		mareaNivel: (nivel: string) => `marea ${nivel}`,
		lluvia: (mm: string) =>
			`Llovieron ${mm} mm en los tres días previos. Esta pasada no cuenta para la inundación en marea alta.`
	},

	ritmo: {
		titulo: 'El ritmo',
		intro: 'Elegí una pasada en la partitura para ver el radar de ese día y la marea estimada en ese momento.',
		introReproduccion:
			'La animación recorre las pasadas en orden y muestra cómo se clasificó cada hectárea.',
		sinPasadas: 'Esta versión todavía no tiene pasadas del satélite para mostrar.',
		capa: 'Qué muestra el mapa',
		rgb: 'Radar RGB',
		clases: 'Clases',
		comparar: 'Comparar dos pasadas'
	},

	comparar: {
		titulo: 'Comparar dos pasadas',
		intro: 'Mové el divisor con el mouse, con las flechas del teclado o con los botones junto al divisor.',
		salir: 'Salir de la comparación',
		orbitasDistintas: 'Órbitas distintas',
		orbitasDistintasDetalle:
			'El satélite miró desde ángulos distintos en A y en B. Parte de la diferencia puede deberse a eso y no a un cambio en el terreno.',
		eligiendo: (letra: string) => `Tocá una nota para elegir ${letra}`,
		cambiar: (letra: string) => `Cambiar ${letra}`,
		partitura: (letra: string) => `Elegí la pasada ${letra} tocando una nota`
	},

	sintonia: {
		titulo: 'En sintonía / fuera de ritmo',
		intro: 'Cada hectárea se colorea según en cuántas pasadas de marea alta apareció con agua. Tocá una celda para ver su historia.',
		solo: 'Solo posible desconexión',
		soloAyuda:
			'El filtro oculta las celdas conectadas. Las celdas con datos insuficientes siguen visibles con trama para no confundirlas con conectadas.',
		soloSinFiltro:
			'Esta versión usa colores que no permiten ocultar las celdas conectadas, así que se muestran todas con su estado.',
		sinMarea: 'Esta versión no tiene marea',
		sinMareaDetalle:
			'Sin estimación de marea no se puede separar la marea alta. Se muestra la inundación en todas las pasadas, que no distingue un manglar seco por marea baja de uno sin agua.',
		partitura: (alta: number, total: number) =>
			`Solo cuentan las pasadas con marea alta: ${alta} de ${total}`
	},

	leyenda: {
		sinColores: 'Esta versión no declara los colores de la capa.',
		rgb: {
			titulo: 'Compuesto de radar de la pasada',
			rojo: 'Rojo: HH, rebote doble',
			rojoAyuda: 'Brillante en HH: agua bajo los árboles.',
			verde: 'Verde: HV, copa',
			verdeAyuda: 'Hojas y ramas que dispersan la señal.',
			azul: 'Azul: cociente HH/HV',
			azulAyuda: 'Cuánto domina el rebote doble sobre la copa.'
		},
		clases: { titulo: 'Clase de cada hectárea en la pasada' },
		frecuencia: {
			titulo: 'Inundación en marea alta',
			tituloTodas: 'Inundación en todas las pasadas',
			rampa: 'Escala de color de 0 a 100 por ciento de las pasadas con agua',
			insuficiente: 'Datos insuficientes',
			insuficienteAyuda: (minimo: number) =>
				`Menos de ${minimo} ${plural(minimo, 'pasada', 'pasadas')} en marea alta: sin conclusión.`,
			fuera: 'Fuera de la máscara de manglar',
			fueraAyuda: 'Sin color.',
			umbral: (porcentaje: string) =>
				`Debajo de ${porcentaje}: posible desconexión, verificar en campo. El umbral es el de esta versión de los datos.`
		},
		desconexion: {
			titulo: 'Conexión con la marea',
			estados: {
				conectada: { nombre: 'Conectada', ayuda: 'Se inunda en marea alta.' },
				desconectada: {
					nombre: 'Posible desconexión',
					ayuda: 'Casi nunca apareció con agua en marea alta. Verificar en campo.'
				},
				insuficiente: { nombre: 'Datos insuficientes', ayuda: 'Sin conclusión.' }
			}
		}
	},

	umbrales: {
		titulo: 'Explorar con otros umbrales',
		intro: 'Mové un umbral para ver cuánto cambia el mapa. Es una exploración: no se guarda ni cambia la versión publicada.',
		desconexion: 'Posible desconexión',
		minimo: 'Mínimo de pasadas en marea alta',
		mareaAlta: 'Marea alta',
		menosDe: (valor: string) => `menos de ${valor}`,
		desde: (valor: string) => `desde ${valor}`,
		publicado: (valor: string) => `En la versión publicada: ${valor}`,
		aplicar: 'Recalcular',
		volver: 'Volver a la versión publicada',
		esExploracion: 'Estás viendo una exploración',
		resultado: (desconectada: string, manglar: string, insuficiente: string) =>
			`Con estos umbrales, ${desconectada} de ${manglar} de manglar quedarían como posible desconexión y ${insuficiente} con datos insuficientes.`,
		sinConexion: 'La exploración necesita conexión con el servidor.',
		error: {
			limite: 'Se alcanzó el límite de exploraciones por ahora. Esperá un momento y volvé a intentar; la versión publicada sigue disponible.',
			rango: 'Uno de los umbrales está fuera del rango permitido.',
			otro: 'No se pudo calcular la exploración. El mapa sigue mostrando la versión publicada.'
		}
	},
	resumen: {
		titulo: 'Resumen por país',
		pais: 'País',
		region: 'Toda la región',
		cargando: 'Cargando el resumen…',
		error: 'No se pudo cargar el resumen por país.',
		vacio: 'Esta versión no tiene resumen por país.',
		manglar: 'Manglar analizado',
		desconectada: 'Posible desconexión',
		insuficiente: 'Datos insuficientes',
		perdidaCopa: 'Posible pérdida de copa',
		delManglar: (porcentaje: string) => `${porcentaje} del manglar`,
		csv: 'Descargar el resumen (CSV)'
	},

	inspector: {
		etiqueta: 'Inspector de celda',
		tituloVacio: 'Celda',
		cerrar: 'Cerrar el inspector',
		cargando: 'Buscando la historia de esta hectárea…',
		error: 'No se pudo cargar la celda. El mapa y la pasada elegida siguen como estaban.',
		sinConexion:
			'El inspector necesita conexión con el servidor. Con el respaldo se ven los mapas, la partitura y el resumen, pero no la historia de cada celda.',
		sinConclusion: 'Sin conclusión',
		serie: 'Serie por pasada',
		sinSerie: 'Esta celda no tiene serie en esta versión.',
		hipotesis:
			'Los resultados son hipótesis para orientar la verificación en campo. No señalan causas ni responsables.',
		conPasadasAlta: (n: number | null, minimo: number | null) =>
			n === null
				? 'Sin conteo de pasadas'
				: `Con ${n} ${plural(n, 'pasada', 'pasadas')} en marea alta${minimo === null ? '' : `; mínimo ${minimo}`}`,
		conPasadas: (n: number | null) =>
			n === null ? 'Sin conteo de pasadas' : `Con ${n} ${plural(n, 'pasada', 'pasadas')}`,
		estados: {
			desconectada: {
				sello: 'Posible desconexión: verificar en campo',
				frase: (porcentaje: string) =>
					`Con marea alta, esta hectárea apareció con agua en el ${porcentaje} de las pasadas usadas. Puede indicar que la marea ya no llega: es una señal para revisar en el terreno, no una causa.`
			},
			conectada: {
				sello: 'Conectada con la marea',
				frase: (porcentaje: string) =>
					`Con marea alta, esta hectárea apareció con agua en el ${porcentaje} de las pasadas usadas. Sigue el ritmo de la marea.`
			},
			insuficiente: {
				sello: 'Datos insuficientes',
				frase: (n: number | null, minimo: number | null) =>
					`Todavía no hay suficientes pasadas en marea alta para decir si esta hectárea recibe la marea${
						n === null || minimo === null ? '' : ` (hay ${n} y hacen falta ${minimo})`
					}. No está conectada ni desconectada: falta información.`
			},
			fuera: {
				sello: 'Fuera de la máscara de manglar',
				frase: 'Esta hectárea no está dentro del área de manglar analizada, así que no tiene indicadores de conexión. Abajo queda su señal de radar por pasada.'
			}
		},
		cambio: {
			titulo: 'Posible pérdida de copa',
			sinCambio: 'Sin cambio significativo en la copa',
			sinCambioAyuda:
				'No se detectó una caída sostenida de la señal de la copa en esta serie. Eso no descarta cambios pequeños.',
			frase: (caida: string | null, fecha: string) =>
				`La señal HV ${caida ? `bajó ${caida}` : 'bajó'} a partir de la pasada del ${fecha}.`,
			distintas:
				'La confianza del cambio y la probabilidad de error de la clasificación son medidas distintas.'
		}
	},

	grafica: {
		leyenda: 'Series de la gráfica',
		hh: 'HH: agua bajo los árboles',
		hv: 'HV: copa',
		marea: 'Marea estimada',
		mareaCorto: 'Marea',
		clase: 'Clase',
		pasada: 'Pasada',
		cambio: 'Inicio del cambio',
		ayuda: 'Pasá el cursor o usá las flechas sobre la gráfica para ver los valores de cada pasada. Arriba, la señal del radar en decibeles; en medio, la marea en metros; abajo, la clase.',
		verTabla: 'Ver los valores como tabla',
		descripcion: (n: number) =>
			`Señal de radar HH y HV, marea estimada y clase de la celda en ${n} ${plural(n, 'pasada', 'pasadas')}.`
	},

	estanques: {
		titulo: 'Estanques',
		intro: 'Estanques camaroneros según cuánto cambia su señal: los activos se llenan y se vacían, los abandonados casi no cambian. Los abandonados son candidatos a evaluar para restauración.',
		filtro: 'Filtrar estanques',
		todos: 'Todos',
		abandonados: 'Abandonados',
		activos: 'Activos',
		activo: 'Activo',
		abandonado: 'Abandonado',
		ordenar: 'Ordenar por',
		ordenes: {
			puntaje: 'Puntaje de restauración',
			area: 'Área',
			distancia: 'Distancia al canal',
			inundacion: 'Inundación del manglar vecino'
		},
		cargando: 'Cargando los estanques…',
		error: 'No se pudieron cargar los estanques.',
		vacio: 'No hay estanques con ese filtro.',
		lista: (n: number) => `${n} ${plural(n, 'estanque', 'estanques')}`,
		area: 'Área',
		canal: 'Al canal',
		vecino: 'Manglar vecino',
		puntaje: 'Puntaje',
		sinPuntaje: 'no aplica',
		nota: 'Activo o abandonado es una estimación a partir del radar. Mangroove no asocia los estanques con propietarios.'
	},

	relato: {
		acto: (n: number, total: number) => `Acto ${n} de ${total}`,
		comoLeer: 'Cómo leer el mapa',
		progreso: 'Avance de la historia',
		seguir: 'Seguir',
		irAlMapa: 'Ir al mapa',
		explorarConectividad: 'Explorar la conectividad',
		referencia: 'Imagen de referencia',
		pendiente: 'Texto de demostración, pendiente de validar con el equipo.',
		capaFallo: 'El texto sigue; podés continuar la historia y volver a esta escena después.',
		actos: {
			contexto: {
				titulo: 'El golfo y su manglar',
				cuerpo: 'El Golfo de Fonseca lo comparten Nicaragua, Honduras y El Salvador. Sus manglares sostienen la pesca artesanal y la recolección de curiles, frenan las inundaciones y guardan carbono en sus suelos. Mangroove empieza por el delta del Estero Real, en Chinandega.',
				lectura:
					'La imagen de fondo es una referencia óptica de 2016. Sirve para ubicarse; no es un resultado de Mangroove.'
			},
			marea: {
				titulo: 'La marea marca el compás',
				cuerpo: 'Dos veces al día la marea entra desde el golfo y vuelve a salir. Ese ir y venir del agua mantiene vivo al manglar. Un manglar seco con marea baja es normal; seco con marea alta es una señal para mirar con cuidado.',
				lectura:
					'Cada nota de la partitura es una pasada del satélite, ubicada a la altura de la marea estimada en ese momento.'
			},
			rgb: {
				titulo: 'El radar escucha bajo los árboles',
				cuerpo: 'NISAR no toma fotos: emite una señal de radio y escucha el eco. Sus ondas atraviesan las nubes y el follaje, de día y de noche. Cuando hay agua bajo los árboles, la señal rebota entre el agua y los troncos y vuelve con fuerza.',
				lectura:
					'En el compuesto de radar, el rojo brillante es agua bajo los árboles, el verde es copa viva y lo oscuro es agua abierta.'
			},
			clases: {
				titulo: 'Inundado, agua abierta o seco',
				cuerpo: 'En cada pasada, cada hectárea recibe una clase: vegetación inundada, agua abierta, no inundado o no clasificado. Así una imagen de radar se vuelve un mapa que cualquiera puede leer.',
				lectura:
					'Cada color es una clase. Donde el satélite no midió, la celda queda sin color en lugar de rellenarse.'
			},
			conectividad: {
				titulo: 'En sintonía o fuera de ritmo',
				cuerpo: 'Al contar solo las pasadas de marea alta se ve qué manglar sigue recibiendo el agua y cuál casi nunca aparece inundado. Eso último es una posible desconexión: una hipótesis para verificar en campo, no una causa ni un responsable.',
				lectura:
					'El color indica en qué proporción de las pasadas de marea alta la hectárea apareció con agua. La trama marca dónde aún faltan datos.'
			}
		}
	},

	metodo: {
		titulo: 'Método y datos',
		enEstaPagina: 'En esta página',
		secciones: {
			mide: 'Qué mide Mangroove',
			fuentes: 'De dónde salen los datos',
			clasifica: 'Cómo se clasifica cada pasada',
			umbrales: 'Umbrales de esta versión',
			supuestos: 'Supuestos',
			limitaciones: 'Limitaciones',
			hipotesis: 'Pruebas de hipótesis',
			procedencia: 'Procedencia y versión',
			descargas: 'Descargas',
			creditos: 'Código, licencias y créditos'
		},
		mide: 'En cada pasada del satélite, cada celda de una hectárea se clasifica como vegetación inundada, agua abierta, no inundada, no clasificada o sin dato. Luego se cuenta en qué fracción de las pasadas apareció con agua (inundación en todas las pasadas) y en qué fracción de las pasadas de marea alta (inundación en marea alta). Una celda con inundación en marea alta bajo el umbral se marca como posible desconexión.',
		fuentes:
			'El dato principal es el radar de banda L de NISAR (NASA e ISRO), producto L2 GCOV con polarizaciones HH y HV, distribuido por el Alaska Satellite Facility. La imagen de fondo del mapa es una referencia óptica de Sentinel-2 (EOX, 2016) y no es un dato de Mangroove.',
		clasifica:
			'La clasificación usa reglas con umbrales sobre HH y sobre el cociente HH/HV, a partir del método de inundación de humedales del manual científico de NISAR (sección 6.4). El inicio de una posible pérdida de copa se busca con el análisis de puntos de cambio en HV (sección 6.3). Los umbrales viven en un perfil configurable y se ajustan con muestras del sitio.',
		umbrales: {
			perfil: (codigo: string, version: number) =>
				`Perfil de umbrales «${codigo}», versión ${version}.`,
			aguaAbierta: 'Agua abierta',
			aguaAbiertaValor: (hh: string, hv: string) =>
				`HH por debajo de ${hh} y HV por debajo de ${hv}`,
			inundada: 'Vegetación inundada',
			inundadaValor: (hh: string, cociente: string) =>
				`HH por encima de ${hh} y cociente HH/HV de al menos ${cociente}`,
			mareaAlta: 'Marea alta',
			mareaBaja: 'Marea baja',
			desde: (valor: string) => `desde ${valor}`,
			hasta: (valor: string) => `hasta ${valor}`,
			lluvia: 'Lluvia que excluye una pasada',
			lluviaValor: (mm: string) => `${mm} mm o más en los tres días previos`,
			desconexion: 'Posible desconexión',
			desconexionValor: (porcentaje: string) =>
				`inundación en marea alta menor a ${porcentaje}`,
			minimo: 'Mínimo de pasadas en marea alta',
			cambio: 'Cambio en la copa',
			cambioValor: (confianza: string, caida: string) =>
				`confianza de al menos ${confianza} y caída de HV de al menos ${caida}`
		},
		supuestos: [
			'NISAR adquiere HH y HV sobre el golfo en órbitas ascendentes y descendentes.',
			'Los umbrales del manual de NISAR son un buen punto de partida y se ajustan con muestras del sitio.',
			'El modelo global de mareas alcanza para etiquetar cada pasada como marea alta, media o baja.'
		],
		limitaciones: [
			'La serie de NISAR empieza en junio de 2026: es demasiado corta para conclusiones de largo plazo.',
			'Los productos de NISAR son provisionales y pueden cambiar al reprocesarse.',
			'La marea es una estimación de un modelo, no una medición en el sitio.',
			'El satélite pasa siempre cerca de las 6 de la mañana y las 6 de la tarde, así que no observa todas las condiciones de marea.',
			'Con pocas pasadas por órbita, la detección de pérdida de copa tiene poca potencia estadística.',
			'Una posible desconexión es una hipótesis para verificar en campo: no indica causa, responsable ni muerte del manglar.'
		],
		productos: (n: number) =>
			`Esta versión usa ${n} ${plural(n, 'pasada', 'pasadas')} de NISAR.`,
		modeloMarea: (modelo: string) => `Marea: ${modelo}.`,
		fuenteLluvia: (fuente: string) => `Lluvia: ${fuente}.`,
		licencia: 'licencia',
		insumos: {
			manglar: 'Máscara de manglar',
			elevacion: 'Elevación del terreno',
			exclusion: 'Zonas excluidas',
			barreras: 'Bordas y caminos',
			estanques: 'Estanques',
			paises: 'Límites de países',
			areas_protegidas: 'Áreas protegidas',
			optico: 'Imagen óptica',
			banda_c: 'Radar de banda C'
		},
		hipotesisIntro:
			'Cada versión prueba tres hipótesis con sus celdas. Si una no se pudo evaluar, se dice por qué.',
		preguntas: {
			H1: '¿El manglar junto a bordas se inunda menos en marea alta que el manglar junto a canales?',
			H2: '¿El manglar junto a bordas pierde más copa?',
			H3: '¿Los estanques abandonados están más cerca de manglar con posible desconexión?'
		},
		grupo: (nombre: string, n: number | null, valor: string | null) =>
			`${nombre}: ${n === null ? 'sin tamaño de muestra' : `${n} ${plural(n, 'elemento', 'elementos')}`}${
				valor === null ? '' : `, valor central ${valor}`
			}.`,
		valorP: 'Valor p',
		efecto: 'Tamaño del efecto',
		noEvaluable: 'No evaluable en esta versión.',
		sinHipotesis: 'Esta versión no publica pruebas de hipótesis.',
		procedencia: {
			version: 'Versión de los datos',
			generado: 'Generado',
			horaDe: (fecha: string, region: string) => `${fecha}, hora local de ${region}`,
			producto: 'Producto',
			pasadas: 'Pasadas procesadas',
			crids: 'Identificadores de procesamiento',
			codigo: 'Versión del código',
			semilla: 'Semilla del remuestreo',
			grilla: 'Grilla',
			grillaValor: (metros: string, epsg: number) => `celdas de ${metros} m, EPSG:${epsg}`,
			horas: 'Los instantes se guardan en UTC y se muestran en la hora local de la región.'
		},
		descargasIntro:
			'Los datos de esta versión, con licencia CC BY 4.0. Cada archivo trae su suma de verificación para comprobar que llegó completo.',
		archivos: {
			geotiff_if_alta: 'Inundación en marea alta',
			geotiff_if: 'Inundación en todas las pasadas',
			geotiff_desconexion: 'Conexión con la marea',
			geotiff_p_error: 'Probabilidad de error de la clasificación',
			geotiff_cambio: 'Cambio en la copa',
			geotiff_clase_tipica: 'Clase típica',
			resumen_csv: 'Resumen por país y por pasada',
			resumen: 'Resumen por país y por pasada',
			estanques: 'Estanques',
			metadatos: 'Metadatos de la versión',
			manifiesto: 'Índice de la versión'
		},
		descargar: 'Descargar',
		sinDescargas: 'Esta versión no publica archivos para descargar.',
		sinVersion: 'Aparece cuando haya una versión de los datos cargada.',
		sinConexion: 'No disponible sin conexión con el servidor.',
		errorSeccion: 'No se pudo cargar esta parte. El resto de la página sigue disponible.',
		creditos:
			'Código abierto y datos derivados con licencia CC BY 4.0. Créditos: NASA/JPL-Caltech e ISRO por la misión NISAR; Alaska Satellite Facility DAAC por la distribución de los productos; Global Mangrove Watch; ESA Copernicus; EOX IT Services por la imagen de referencia.',
		repositorio: 'Repositorio del proyecto',
		volver: 'Volver al mapa'
	}
};

export type Textos = typeof es;
