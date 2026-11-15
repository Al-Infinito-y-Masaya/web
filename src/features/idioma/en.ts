import type { Textos } from './es';

/** English copy. Same structure as `es.ts`; the type keeps both in step. */

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

export const en: Textos = {
	comun: {
		sinDato: 'no data'
	},

	nav: {
		historia: 'Story',
		explorar: 'Explore',
		metodo: 'Method and data'
	},

	barra: {
		inicio: 'Mangroove, go to the home page',
		navegacion: 'Sections',
		saltar: 'Skip to content',
		region: 'Region',
		elegirRegion: 'Choose a region',
		soloPublicadas: 'Only regions with published data are listed.',
		compartir: 'Share',
		copiado: 'Link copied',
		idioma: 'Language',
		cambiarIdioma: 'Español',
		menu: 'Open the menu',
		cargando: 'Loading the data…',
		sinDatos: 'Data not available',
		respaldo: 'Offline',
		version: (version, mision, madurez) => `Version ${version} · ${mision} ${madurez}`
	},

	madurez: codigo =>
		(({ provisional: 'provisional', validado: 'validated' }) as Record<string, string>)[
			codigo
		] ?? codigo,

	orbita: codigo =>
		(({ asc: 'ascending', desc: 'descending' }) as Record<string, string>)[codigo] ?? codigo,

	orbitaLarga: codigo =>
		(
			({
				asc: 'ascending (south to north)',
				desc: 'descending (north to south)'
			}) as Record<string, string>
		)[codigo] ?? codigo,

	nivelMarea: {
		alta: 'high',
		media: 'mid',
		baja: 'low',
		desconocida: 'no estimate'
	},

	clases: {
		IV: {
			nombre: 'Flooded vegetation',
			ayuda: 'Water under the trees: the signal bounces between the water and the trunks.'
		},
		OW: {
			nombre: 'Open water',
			ayuda: 'Channels, ponds and the gulf: smooth water deflects the signal.'
		},
		NI: { nombre: 'Not flooded', ayuda: 'Mangrove or ground without water on that pass.' },
		NC: { nombre: 'Not classified', ayuda: 'The signal matched none of the rules.' },
		ND: {
			nombre: 'No data',
			ayuda: 'The satellite did not measure that cell on the pass. It has no color: the reference image shows through.'
		}
	},

	campos: {
		ifAlta: 'Flooding at high tide',
		ifTotal: 'Flooding across all passes',
		pError: 'Classification error probability',
		confianza: 'Confidence of the change'
	},

	estado: {
		cargando: 'Loading the mangrove data…',
		reintentar: 'Try again',
		abrirVigente: 'Open the current version',
		paginaNoExiste: 'This page does not exist',
		paginaNoExisteDetalle: 'The link may be incomplete, or the page may have moved.',
		irAlInicio: 'Go to the home page',
		error: {
			'sin-conexion': {
				titulo: 'No connection to the server',
				detalle:
					'We could not fetch the Mangroove data. Check your connection and try again; what you were viewing is not lost.'
			},
			retirada: {
				titulo: 'This version of the data was retired',
				detalle:
					'The link points to a version that is no longer published. You can open the current version of the same region.'
			},
			'no-encontrada': {
				titulo: 'No data published yet',
				detalle:
					'The region you are looking for does not exist or has no published version yet. It will appear here once the team publishes the first one.'
			},
			formato: {
				titulo: 'We could not read the data',
				detalle:
					'The server answered in a format this version of the app does not understand. We would rather show nothing than show a wrong map.'
			},
			otro: {
				titulo: 'Something went wrong',
				detalle: 'An unexpected problem occurred. Try again in a few seconds.'
			}
		}
	},

	inicio: {
		saltar: 'Skip the intro',
		repetir: 'Replay the intro',
		evento: 'NASA Space Apps 2026 · Dancing with the SARs',
		frase: 'Is the tide still reaching the mangroves of Estero Real? Mangroove listens with the radar of the NISAR satellite, which sees through clouds and leaves, and compares every pass with the height of the tide.',
		historia: 'See the story',
		explorar: 'Explore the map',
		equipo: 'Al Infinito y Masaya',
		creditos: 'Illustration: Mangroove team. Radar: NASA-ISRO NISAR.',
		datos: (pasadas, version, madurez, generado) =>
			`${pasadas} satellite ${plural(pasadas, 'pass', 'passes')}. Data version ${version}, ${madurez}, generated on ${generado}.`,
		sinDatos:
			'You can read the story and the method in the meantime. The map fills in once a version is published.'
	},

	codigo: {
		titulo: 'Open source',
		abreEnGithub: 'opens on GitHub',
		web: 'The app you are looking at: the map, the story and the sound.',
		api: 'The engine and the API: processes the NISAR passes and publishes each version.'
	},

	modos: {
		etiqueta: 'Explore modes',
		ritmo: 'The rhythm',
		sintonia: 'In tune / out of step',
		estanques: 'Ponds'
	},

	mapa: {
		visor: {
			mapa: 'Map',
			instrucciones:
				'Drag to move the map. With the keyboard: arrows to move, plus and minus to zoom, zero to see the whole region and Enter to inspect the cell at the centre.',
			divisor: 'Divider between pass A and pass B',
			moverIzquierda: 'Move the divider left',
			moverDerecha: 'Move the divider right'
		},
		acercar: 'Zoom in',
		alejar: 'Zoom out',
		encajar: 'See the whole region',
		cargandoCapa: 'Loading the layer…',
		capaFallo: 'This layer could not be loaded',
		capaFalloDetalle:
			'The map stays where it was. You can try again or move to another pass without losing the view.',
		otraPasada: 'Try another pass',
		capaSinPublicar: 'This layer is not published',
		capaSinPublicarDetalle:
			'The loaded version does not include this layer. Only the reference image is shown.',
		fueraDeGrilla: 'That point is outside the analysed area',
		fueraDeGrillaDetalle: 'Tap inside the region to see the history of one hectare.',
		sinConexion: 'No connection to the server',
		sinConexionDetalle:
			'You are viewing the backup of the last published version. The cell inspector is not available offline.',
		verMas: 'Show more',
		verMenos: 'Show less',
		atribucion:
			'Reference image 2016: Sentinel-2 cloudless, EOX (CC BY 4.0). Radar: NASA-ISRO NISAR.',
		atribucionSinBase: 'Radar: NASA-ISRO NISAR.',
		descripcionPasada: (capa, pasada) => `The map shows ${capa} for the pass of ${pasada}.`,
		descripcionComparar: (capa, a, b) =>
			`The map is split. On the left, ${capa} for pass A: ${a}. On the right, pass B: ${b}.`,
		descripcionCapa: (capa, region) => `The map shows ${capa} in ${region}.`
	},

	partitura: {
		seccion: 'Tide score',
		etiqueta:
			'Satellite passes. The height of each note is the estimated tide at that moment. Use the arrow keys to change pass.',
		anterior: 'Previous pass',
		siguiente: 'Next pass',
		reproducir: 'Play the passes',
		pausar: 'Pause',
		activarSonido: 'Turn sound on: each pass sounds according to its tide',
		silenciar: 'Mute',
		sinEstimacion: 'no tide estimate',
		sinEstimacionCorto: 'no tide',
		brechaCorto: 'no data',
		vacia: 'This version has no passes yet.',
		brecha: (desde, hasta) =>
			`Satellite gap from ${desde} to ${hasta}: there were no observations and they are not filled in.`,
		resumen: (n, desde, hasta) =>
			`${n} ${plural(n, 'pass', 'passes')}, from ${desde} to ${hasta}`,
		nota: p =>
			`${p.fecha}, ${p.hora}. ${p.orbita} orbit. ${
				p.marea ? `Estimated tide ${p.marea}.` : 'No tide estimate.'
			}${p.lluvia ? ' Heavy rain in the three previous days: it does not count for high tide.' : ''}${
				p.cuenta ? ' Counts for flooding at high tide.' : ''
			}`
	},

	pasada: {
		orbita: 'Orbit',
		marea: 'Estimated tide',
		hora: (hora, region) => `${hora}, local time of ${region}`,
		mareaValor: (metros, nivel) => `${metros} relative to mean level, ${nivel}`,
		mareaNivel: nivel => `${nivel} tide`,
		lluvia: mm =>
			`It rained ${mm} mm in the three previous days. This pass does not count for flooding at high tide.`
	},

	ritmo: {
		titulo: 'The rhythm',
		intro: 'Choose a pass on the score to see the radar of that day and the estimated tide at that moment.',
		introReproduccion:
			'The animation goes through the passes in order and shows how each hectare was classified.',
		sinPasadas: 'This version has no satellite passes to show yet.',
		capa: 'What the map shows',
		rgb: 'Radar RGB',
		clases: 'Classes',
		comparar: 'Compare two passes'
	},

	comparar: {
		titulo: 'Compare two passes',
		intro: 'Move the divider with the mouse, with the arrow keys or with the buttons next to it.',
		salir: 'Leave the comparison',
		orbitasDistintas: 'Different orbits',
		orbitasDistintasDetalle:
			'The satellite looked from different angles in A and in B. Part of the difference may come from that and not from a change on the ground.',
		eligiendo: letra => `Tap a note to choose ${letra}`,
		cambiar: letra => `Change ${letra}`,
		partitura: letra => `Choose pass ${letra} by tapping a note`
	},

	sintonia: {
		titulo: 'In tune / out of step',
		intro: 'Each hectare is colored by the share of high-tide passes in which it appeared with water. Tap a cell to see its history.',
		solo: 'Only possible disconnection',
		soloAyuda:
			'The filter hides the connected cells. Cells with insufficient data stay visible with a hatch so they are not mistaken for connected ones.',
		soloSinFiltro:
			'This version uses colors that do not allow hiding the connected cells, so all of them are shown with their state.',
		sinMarea: 'This version has no tide',
		sinMareaDetalle:
			'Without a tide estimate, high tide cannot be separated. Flooding across all passes is shown instead, which cannot tell a mangrove that is dry at low tide from one that gets no water.',
		partitura: (alta, total) => `Only high-tide passes count: ${alta} of ${total}`
	},

	leyenda: {
		sinColores: 'This version does not declare the colors of the layer.',
		rgb: {
			titulo: 'Radar composite of the pass',
			rojo: 'Red: HH, double bounce',
			rojoAyuda: 'Bright in HH: water under the trees.',
			verde: 'Green: HV, canopy',
			verdeAyuda: 'Leaves and branches that scatter the signal.',
			azul: 'Blue: HH/HV ratio',
			azulAyuda: 'How much the double bounce dominates over the canopy.'
		},
		clases: { titulo: 'Class of each hectare on the pass' },
		frecuencia: {
			titulo: 'Flooding at high tide',
			tituloTodas: 'Flooding across all passes',
			rampa: 'Color scale from 0 to 100 percent of the passes with water',
			insuficiente: 'Insufficient data',
			insuficienteAyuda: minimo =>
				`Fewer than ${minimo} high-tide ${plural(minimo, 'pass', 'passes')}: no conclusion.`,
			fuera: 'Outside the mangrove mask',
			fueraAyuda: 'No color.',
			umbral: porcentaje =>
				`Below ${porcentaje}: possible disconnection, verify in the field. The threshold is the one of this version of the data.`
		},
		desconexion: {
			titulo: 'Connection with the tide',
			estados: {
				conectada: { nombre: 'Connected', ayuda: 'It floods at high tide.' },
				desconectada: {
					nombre: 'Possible disconnection',
					ayuda: 'It almost never appeared with water at high tide. Verify in the field.'
				},
				insuficiente: { nombre: 'Insufficient data', ayuda: 'No conclusion.' }
			}
		}
	},

	umbrales: {
		titulo: 'Explore with other thresholds',
		intro: 'Move a threshold to see how much the map changes. It is an exploration: it is not saved and does not change the published version.',
		desconexion: 'Possible disconnection',
		minimo: 'Minimum high-tide passes',
		mareaAlta: 'High tide',
		menosDe: valor => `below ${valor}`,
		desde: valor => `from ${valor}`,
		publicado: valor => `In the published version: ${valor}`,
		aplicar: 'Recompute',
		volver: 'Back to the published version',
		esExploracion: 'You are viewing an exploration',
		resultado: (desconectada, manglar, insuficiente) =>
			`With these thresholds, ${desconectada} of ${manglar} of mangrove would be a possible disconnection and ${insuficiente} would have insufficient data.`,
		sinConexion: 'The exploration needs a connection to the server.',
		error: {
			limite: 'The exploration limit was reached for now. Wait a moment and try again; the published version is still available.',
			rango: 'One of the thresholds is outside the allowed range.',
			otro: 'The exploration could not be computed. The map still shows the published version.'
		}
	},
	resumen: {
		titulo: 'Summary by country',
		pais: 'Country',
		region: 'Whole region',
		cargando: 'Loading the summary…',
		error: 'The summary by country could not be loaded.',
		vacio: 'This version has no summary by country.',
		manglar: 'Mangrove analysed',
		desconectada: 'Possible disconnection',
		insuficiente: 'Insufficient data',
		perdidaCopa: 'Possible canopy loss',
		delManglar: porcentaje => `${porcentaje} of the mangrove`,
		csv: 'Download the summary (CSV)'
	},

	inspector: {
		etiqueta: 'Cell inspector',
		tituloVacio: 'Cell',
		cerrar: 'Close the inspector',
		cargando: 'Looking up the history of this hectare…',
		error: 'The cell could not be loaded. The map and the chosen pass stay as they were.',
		sinConexion:
			'The inspector needs a connection to the server. The backup shows the maps, the score and the summary, but not the history of each cell.',
		sinConclusion: 'No conclusion',
		serie: 'Series by pass',
		sinSerie: 'This cell has no series in this version.',
		hipotesis:
			'The results are hypotheses to guide verification in the field. They do not point to causes or to anyone responsible.',
		conPasadasAlta: (n, minimo) =>
			n === null
				? 'No pass count'
				: `With ${n} high-tide ${plural(n, 'pass', 'passes')}${minimo === null ? '' : `; minimum ${minimo}`}`,
		conPasadas: n =>
			n === null ? 'No pass count' : `With ${n} ${plural(n, 'pass', 'passes')}`,
		estados: {
			desconectada: {
				sello: 'Possible disconnection: verify in the field',
				frase: porcentaje =>
					`At high tide, this hectare appeared with water in ${porcentaje} of the passes used. It may mean the tide no longer arrives: it is a sign to check on the ground, not a cause.`
			},
			conectada: {
				sello: 'Connected with the tide',
				frase: porcentaje =>
					`At high tide, this hectare appeared with water in ${porcentaje} of the passes used. It follows the rhythm of the tide.`
			},
			insuficiente: {
				sello: 'Insufficient data',
				frase: (n, minimo) =>
					`There are not yet enough high-tide passes to say whether this hectare receives the tide${
						n === null || minimo === null
							? ''
							: ` (there are ${n} and ${minimo} are needed)`
					}. It is neither connected nor disconnected: information is missing.`
			},
			fuera: {
				sello: 'Outside the mangrove mask',
				frase: 'This hectare is not inside the analysed mangrove area, so it has no connection indicators. Its radar signal by pass is shown below.'
			}
		},
		cambio: {
			titulo: 'Possible canopy loss',
			sinCambio: 'No significant change in the canopy',
			sinCambioAyuda:
				'No sustained drop of the canopy signal was detected in this series. That does not rule out small changes.',
			frase: (caida, fecha) =>
				`The HV signal dropped${caida ? ` ${caida}` : ''} starting with the pass of ${fecha}.`,
			distintas:
				'The confidence of the change and the classification error probability are different measures.'
		}
	},

	grafica: {
		leyenda: 'Series of the chart',
		hh: 'HH: water under the trees',
		hv: 'HV: canopy',
		marea: 'Estimated tide',
		mareaCorto: 'Tide',
		clase: 'Class',
		pasada: 'Pass',
		cambio: 'Start of the change',
		ayuda: 'Hover or use the arrow keys on the chart to see the values of each pass. Top, the radar signal in decibels; middle, the tide in metres; bottom, the class.',
		verTabla: 'See the values as a table',
		descripcion: n =>
			`HH and HV radar signal, estimated tide and class of the cell over ${n} ${plural(n, 'pass', 'passes')}.`
	},

	estanques: {
		titulo: 'Ponds',
		intro: 'Shrimp ponds by how much their signal changes: active ones fill and empty, abandoned ones barely change. Abandoned ponds are candidates to assess for restoration.',
		filtro: 'Filter ponds',
		todos: 'All',
		abandonados: 'Abandoned',
		activos: 'Active',
		activo: 'Active',
		abandonado: 'Abandoned',
		ordenar: 'Sort by',
		ordenes: {
			puntaje: 'Restoration score',
			area: 'Area',
			distancia: 'Distance to the channel',
			inundacion: 'Flooding of the neighbouring mangrove'
		},
		cargando: 'Loading the ponds…',
		error: 'The ponds could not be loaded.',
		vacio: 'No ponds match that filter.',
		lista: n => `${n} ${plural(n, 'pond', 'ponds')}`,
		area: 'Area',
		canal: 'To channel',
		vecino: 'Nearby mangrove',
		puntaje: 'Score',
		sinPuntaje: 'not applicable',
		nota: 'Active or abandoned is an estimate from the radar. Mangroove does not link ponds to owners.'
	},

	relato: {
		acto: (n, total) => `Act ${n} of ${total}`,
		comoLeer: 'How to read the map',
		progreso: 'Progress of the story',
		seguir: 'Continue',
		irAlMapa: 'Go to the map',
		explorarConectividad: 'Explore connectivity',
		referencia: 'Reference image',
		pendiente: 'Demonstration text, pending validation with the team.',
		capaFallo:
			'The text continues; you can go on with the story and come back to this scene later.',
		actos: {
			contexto: {
				titulo: 'The gulf and its mangroves',
				cuerpo: 'The Gulf of Fonseca is shared by Nicaragua, Honduras and El Salvador. Its mangroves sustain artisanal fishing and cockle gathering, reduce flooding and store carbon in their soils. Mangroove starts with the Estero Real delta, in Chinandega.',
				lectura:
					'The background image is an optical reference from 2016. It helps you find your way; it is not a Mangroove result.'
			},
			marea: {
				titulo: 'The tide sets the beat',
				cuerpo: 'Twice a day the tide comes in from the gulf and goes out again. That back and forth of the water keeps the mangrove alive. A dry mangrove at low tide is normal; dry at high tide is a sign to look at carefully.',
				lectura:
					'Each note on the score is a satellite pass, placed at the height of the estimated tide at that moment.'
			},
			rgb: {
				titulo: 'The radar listens under the trees',
				cuerpo: 'NISAR does not take photos: it sends a radio signal and listens to the echo. Its waves go through clouds and foliage, day and night. When there is water under the trees, the signal bounces between the water and the trunks and comes back strong.',
				lectura:
					'In the radar composite, bright red is water under the trees, green is living canopy and dark is open water.'
			},
			clases: {
				titulo: 'Flooded, open water or dry',
				cuerpo: 'On each pass, each hectare gets a class: flooded vegetation, open water, not flooded or not classified. That turns a radar image into a map anyone can read.',
				lectura:
					'Each color is a class. Where the satellite did not measure, the cell is left without color instead of being filled in.'
			},
			conectividad: {
				titulo: 'In tune or out of step',
				cuerpo: 'Counting only the high-tide passes shows which mangrove still receives the water and which almost never appears flooded. The latter is a possible disconnection: a hypothesis to verify in the field, not a cause and not a culprit.',
				lectura:
					'The color tells in what share of the high-tide passes the hectare appeared with water. The hatch marks where data is still missing.'
			}
		}
	},

	metodo: {
		titulo: 'Method and data',
		enEstaPagina: 'On this page',
		secciones: {
			mide: 'What Mangroove measures',
			fuentes: 'Where the data comes from',
			clasifica: 'How each pass is classified',
			umbrales: 'Thresholds of this version',
			supuestos: 'Assumptions',
			limitaciones: 'Limitations',
			hipotesis: 'Hypothesis tests',
			procedencia: 'Provenance and version',
			descargas: 'Downloads',
			creditos: 'Code, licences and credits'
		},
		mide: 'On each satellite pass, each one-hectare cell is classified as flooded vegetation, open water, not flooded, not classified or no data. Then the app counts in what fraction of the passes it appeared with water (flooding across all passes) and in what fraction of the high-tide passes (flooding at high tide). A cell whose flooding at high tide is below the threshold is marked as a possible disconnection.',
		fuentes:
			'The main data is the L-band radar of NISAR (NASA and ISRO), L2 GCOV product with HH and HV polarizations, distributed by the Alaska Satellite Facility. The background image of the map is an optical reference from Sentinel-2 (EOX, 2016) and is not Mangroove data.',
		clasifica:
			'The classification uses threshold rules on HH and on the HH/HV ratio, based on the wetland inundation method of the NISAR science handbook (section 6.4). The start of a possible canopy loss is searched with change point analysis on HV (section 6.3). The thresholds live in a configurable profile and are tuned with samples from the site.',
		umbrales: {
			perfil: (codigo, version) => `Threshold profile “${codigo}”, version ${version}.`,
			aguaAbierta: 'Open water',
			aguaAbiertaValor: (hh, hv) => `HH below ${hh} and HV below ${hv}`,
			inundada: 'Flooded vegetation',
			inundadaValor: (hh, cociente) =>
				`HH above ${hh} and HH/HV ratio of at least ${cociente}`,
			mareaAlta: 'High tide',
			mareaBaja: 'Low tide',
			desde: valor => `from ${valor}`,
			hasta: valor => `up to ${valor}`,
			lluvia: 'Rain that excludes a pass',
			lluviaValor: mm => `${mm} mm or more in the three previous days`,
			desconexion: 'Possible disconnection',
			desconexionValor: porcentaje => `flooding at high tide below ${porcentaje}`,
			minimo: 'Minimum high-tide passes',
			cambio: 'Change in the canopy',
			cambioValor: (confianza, caida) =>
				`confidence of at least ${confianza} and an HV drop of at least ${caida}`
		},
		supuestos: [
			'NISAR acquires HH and HV over the gulf on ascending and descending orbits.',
			'The thresholds of the NISAR handbook are a good starting point and are tuned with samples from the site.',
			'The global tide model is good enough to label each pass as high, mid or low tide.'
		],
		limitaciones: [
			'The NISAR series starts in June 2026: it is too short for long-term conclusions.',
			'NISAR products are provisional and may change when reprocessed.',
			'The tide is an estimate from a model, not a measurement at the site.',
			'The satellite always passes near 6 in the morning and 6 in the evening, so it does not observe every tide condition.',
			'With few passes per orbit, the detection of canopy loss has little statistical power.',
			'A possible disconnection is a hypothesis to verify in the field: it does not indicate a cause, anyone responsible or the death of the mangrove.'
		],
		productos: n => `This version uses ${n} NISAR ${plural(n, 'pass', 'passes')}.`,
		modeloMarea: modelo => `Tide: ${modelo}.`,
		fuenteLluvia: fuente => `Rain: ${fuente}.`,
		licencia: 'licence',
		insumos: {
			manglar: 'Mangrove mask',
			elevacion: 'Terrain elevation',
			exclusion: 'Excluded areas',
			barreras: 'Dikes and roads',
			estanques: 'Ponds',
			paises: 'Country boundaries',
			areas_protegidas: 'Protected areas',
			optico: 'Optical image',
			banda_c: 'C-band radar'
		},
		hipotesisIntro:
			'Each version tests three hypotheses with its cells. If one could not be evaluated, the reason is stated.',
		preguntas: {
			H1: 'Does mangrove next to dikes flood less at high tide than mangrove next to channels?',
			H2: 'Does mangrove next to dikes lose more canopy?',
			H3: 'Are abandoned ponds closer to mangrove with possible disconnection?'
		},
		grupo: (nombre, n, valor) =>
			`${nombre}: ${n === null ? 'no sample size' : `${n} ${plural(n, 'item', 'items')}`}${
				valor === null ? '' : `, central value ${valor}`
			}.`,
		valorP: 'p-value',
		efecto: 'Effect size',
		noEvaluable: 'Not evaluable in this version.',
		sinHipotesis: 'This version does not publish hypothesis tests.',
		procedencia: {
			version: 'Data version',
			generado: 'Generated',
			horaDe: (fecha, region) => `${fecha}, local time of ${region}`,
			producto: 'Product',
			pasadas: 'Passes processed',
			crids: 'Processing identifiers',
			codigo: 'Code version',
			semilla: 'Resampling seed',
			grilla: 'Grid',
			grillaValor: (metros, epsg) => `${metros} m cells, EPSG:${epsg}`,
			horas: 'Instants are stored in UTC and shown in the local time of the region.'
		},
		descargasIntro:
			'The data of this version, under the CC BY 4.0 licence. Each file comes with its checksum so you can verify it arrived complete.',
		archivos: {
			geotiff_if_alta: 'Flooding at high tide',
			geotiff_if: 'Flooding across all passes',
			geotiff_desconexion: 'Connection with the tide',
			geotiff_p_error: 'Classification error probability',
			geotiff_cambio: 'Change in the canopy',
			geotiff_clase_tipica: 'Typical class',
			resumen_csv: 'Summary by country and by pass',
			resumen: 'Summary by country and by pass',
			estanques: 'Ponds',
			metadatos: 'Version metadata',
			manifiesto: 'Version index'
		},
		descargar: 'Download',
		sinDescargas: 'This version publishes no files to download.',
		sinVersion: 'It appears once a version of the data is loaded.',
		sinConexion: 'Not available without a connection to the server.',
		errorSeccion: 'This part could not be loaded. The rest of the page is still available.',
		creditos:
			'Open source code and derived data under the CC BY 4.0 licence. Credits: NASA/JPL-Caltech and ISRO for the NISAR mission; Alaska Satellite Facility DAAC for distributing the products; Global Mangrove Watch; ESA Copernicus; EOX IT Services for the reference image.',
		volver: 'Back to the map'
	}
};
