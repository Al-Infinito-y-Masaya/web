import { useIdioma, type Idioma } from '@/features/idioma/idioma';

import type { Layer } from './layers';

type Nivel = 'alta' | 'media' | 'baja';
type Estado = 'conectada' | 'seca' | 'estancada' | 'datos_insuficientes';
type Clase = 'IV' | 'OW' | 'NI' | 'NC';

/** Textos del laboratorio de estuarios. Siguen el idioma que se eligió en el resto del sitio. */
export type TextosLab = {
	locale: string;
	tituloPagina: string;
	sinDato: string;
	sinEstimacion: string;
	pMinima: string;
	app: {
		cargando: string;
		cargandoTexto: string;
		error: string;
		errorDatos: string;
		sitioFaltante: string;
		reintentar: string;
		abrirChismuyo: string;
	};
	header: {
		inicio: string;
		secciones: string;
		historia: string;
		explorar: string;
		metodo: string;
		estuario: string;
		idioma: string;
		compartir: string;
		copiado: string;
		compartirError: string;
		cerrarAviso: string;
	};
	mapa: {
		preparando: string;
		aria: string;
		verArea: string;
		reintentar: string;
		errorPasada: string;
		errorCapa: string;
		cargandoElegida: string;
		preparandoPasada: string;
		lento: string;
		noInicia: string;
		recargar: string;
	};
	modos: { grupo: string; ritmo: string; sintonia: string };
	sidebar: {
		aria: string;
		tituloRespuesta: string;
		introRitmo: string;
		introRespuesta: string;
	};
	pasada: {
		titulo: string;
		horaLocal: (hora: string, sitio: string) => string;
		orbita: string;
		asc: string;
		desc: string;
		pista: (pista: string | number) => string;
		mareaEstimada: string;
		recorrido: string;
		notaPorNota: string;
		mismaOrbita: string;
		ayudaMismaOrbita: (ascendente: boolean) => string;
		ayudaNotaPorNota: string;
		queMuestra: string;
		radarRgb: string;
		clases: string;
		resumenCapa: string;
	};
	nivel: Record<Nivel, string>;
	capas: { titulo: string; disponibles: string; nombres: Record<Layer, string> };
	celda: {
		titulo: string;
		resumenSeleccion: string;
		resumenVacia: string;
		elegir: string;
		cargando: string;
		fuera: string;
		error: string;
		otra: string;
		limpiar: string;
		inspeccionarCentro: string;
	};
	calidad: {
		titulo: string;
		resumen: (pasan: number) => string;
		nota: string;
		mareaClases: string;
		mareaHh: string;
		agua: string;
		tierra: string;
		pasa: string;
		noPasa: string;
		noEvaluable: string;
		porPista: string;
		notaP: string;
	};
	marea: {
		titulo: string;
		resumen: (pleamar: string) => string;
		texto: (pleamar: string) => string;
		modelo: (modelo: string) => string;
		advertencia: (texto: string) => string;
	};
	datos: {
		titulo: string;
		resumen: (pasadas: number) => string;
		procedencia: string;
		informe: string;
		resumenCsv: string;
		manifest: string;
		version: (publicacion: string, contrato: string, motor: string) => string;
	};
	experimental: string;
	partitura: { detenida: string; esperando: string };
	leyenda: {
		aria: string;
		clases: Record<Clase, string>;
		rgb: string;
		conexion: string;
		baja: string;
		persistente: string;
		insuficiente: string;
		sensibilidad: string;
		frecuencia: string;
	};
	estados: Record<Estado, string>;
	inspector: {
		norte: string;
		oeste: string;
		fueraMascara: string;
		sinMetricas: string;
		inundacionTodas: string;
		enAlta: string;
		enBaja: string;
		respuestaHh: string;
		pRespuesta: string;
		fechasAltaBaja: string;
		nota: (cercaUmbral: string) => string;
		fechaSeleccionada: string;
		verObservaciones: (n: number) => string;
		fecha: string;
		clase: string;
		cambio: (fecha: string, delta: string) => string;
		sinSenal: string;
		serie: string;
		serieAria: string;
		marea: string;
	};
};

const es: TextosLab = {
	locale: 'es-NI',
	tituloPagina: 'Laboratorio de estuarios · Mangroove',
	sinDato: 'Sin dato',
	sinEstimacion: 'Sin estimación',
	pMinima: '< 0,0001',
	app: {
		cargando: 'Abriendo el estuario',
		cargandoTexto: 'Cargando las pasadas del radar y la partitura de la marea…',
		error: 'No pudimos abrir el estuario',
		errorDatos: 'No hay conexión con los datos.',
		sitioFaltante: 'Este sitio no está incluido en el laboratorio.',
		reintentar: 'Reintentar',
		abrirChismuyo: 'Abrir Chismuyo'
	},
	header: {
		inicio: 'Mangroove, ir al inicio',
		secciones: 'Secciones',
		historia: 'Historia',
		explorar: 'Explorar',
		metodo: 'Método y datos',
		estuario: 'Estuario',
		idioma: 'Idioma',
		compartir: 'Compartir',
		copiado: 'Copiado',
		compartirError: 'No se pudo copiar el enlace. Podés copiar la dirección del navegador.',
		cerrarAviso: 'Cerrar aviso'
	},
	mapa: {
		preparando: 'Preparando el mapa…',
		aria: 'Mapa de resultados. Usá las flechas para desplazarte y Enter para inspeccionar el centro.',
		verArea: 'Ver área completa',
		reintentar: 'Reintentar carga',
		errorPasada: 'No se pudo cargar esta pasada.',
		errorCapa:
			'No se pudo cargar una capa del mapa. Comprueba la conexión y vuelve a cargar la página.',
		cargandoElegida: 'Cargando la pasada elegida. El mapa aún muestra la anterior.',
		preparandoPasada: 'Preparando el mapa de esta pasada…',
		lento: 'La conexión está tardando. Podés seguir eligiendo fechas.',
		noInicia: 'No se pudo iniciar el mapa. Comprobá la conexión y volvé a intentarlo.',
		recargar: 'Volver a cargar'
	},
	modos: {
		grupo: 'Modos de exploración',
		ritmo: 'El ritmo',
		sintonia: 'En sintonía / fuera de ritmo'
	},
	sidebar: {
		aria: 'Widgets del estuario',
		tituloRespuesta: 'La respuesta a la marea',
		introRitmo: 'Elegí una pasada en la partitura para ver el radar y escuchar la marea.',
		introRespuesta: 'Explorá cómo cambia la inundación del manglar entre las mareas.'
	},
	pasada: {
		titulo: 'La pasada',
		horaLocal: (hora, sitio) => `${hora}, hora local de ${sitio}`,
		orbita: 'Órbita',
		asc: 'Ascendente',
		desc: 'Descendente',
		pista: pista => `pista ${pista}`,
		mareaEstimada: 'Marea estimada',
		recorrido: 'Recorrido de la partitura',
		notaPorNota: 'Nota por nota',
		mismaOrbita: 'Misma órbita',
		ayudaMismaOrbita: ascendente =>
			`Salta a la siguiente pasada ${ascendente ? 'ascendente' : 'descendente'}: compara el manglar siempre desde el mismo ángulo.`,
		ayudaNotaPorNota:
			'Sigue la partitura en orden. Ascendentes y descendentes se alternan y miran el manglar desde ángulos distintos: el brillo puede cambiar aunque no cambie el agua.',
		queMuestra: 'Qué muestra el mapa',
		radarRgb: 'Radar RGB',
		clases: 'Clases',
		resumenCapa:
			'La capa resume todas las pasadas. La partitura mantiene la marea de cada adquisición.'
	},
	nivel: { alta: 'alta', media: 'media', baja: 'baja' },
	capas: {
		titulo: 'Capas del mapa',
		disponibles: 'Capas disponibles',
		nombres: {
			clases: 'Inundación por fecha',
			rgb: 'Radar HH / HV',
			estado: 'Patrón de inundación',
			if_alta: 'Frecuencia en marea alta',
			if_baja: 'Frecuencia en marea baja',
			sens_db_m: 'Respuesta HH a la marea'
		}
	},
	celda: {
		titulo: 'Esta celda',
		resumenSeleccion: 'Serie y métricas de la selección',
		resumenVacia: 'Seleccioná un punto del mapa',
		elegir: 'Elegí un punto del mapa para conocer su respuesta a la marea.',
		cargando: 'Cargando la celda…',
		fuera: 'Este punto está fuera de la grilla del análisis.',
		error: 'No se pudo cargar la celda.',
		otra: 'Elegí otro punto del mapa.',
		limpiar: 'Limpiar selección',
		inspeccionarCentro: 'Inspeccionar el centro'
	},
	calidad: {
		titulo: 'Pruebas de calidad',
		resumen: pasan => `${pasan} de 4 controles globales pasan`,
		nota: 'Controles internos; la exactitud con muestras independientes aún no se ha medido.',
		mareaClases: 'Marea · clases',
		mareaHh: 'Marea · señal HH',
		agua: 'Agua permanente',
		tierra: 'Tierra firme',
		pasa: 'Pasa',
		noPasa: 'No pasa',
		noEvaluable: 'No evaluable',
		porPista: 'Clases, por pista',
		notaP: 'Valores p unilaterales, sin ajuste por comparar varios sitios.'
	},
	marea: {
		titulo: 'Marea y límites',
		resumen: pleamar => `Pleamar observada: ${pleamar}`,
		texto: pleamar =>
			`Las pasadas alcanzan el ${pleamar} de la pleamar máxima predicha. Una baja frecuencia observada no confirma desconexión.`,
		modelo: modelo =>
			`Modelo ${modelo}, sin desfase local estimado. Cada nota representa una adquisición; su altura y sonido corresponden a la marea.`,
		advertencia: texto => texto
	},
	datos: {
		titulo: 'Datos y procedencia',
		resumen: pasadas => `${pasadas} pasadas · 10 m · celdas de 1 ha`,
		procedencia: 'NISAR: NASA/JPL-Caltech e ISRO. Distribución: ASF DAAC. Máscara: GMW 2020.',
		informe: 'Informe de calidad JSON',
		resumenCsv: 'Resumen CSV',
		manifest: 'Manifest de la publicación',
		version: (publicacion, contrato, motor) =>
			`Datos ${publicacion} · contrato ${contrato} · motor ${motor}.`
	},
	experimental: 'Resultados experimentales. La validación independiente sigue pendiente.',
	partitura: {
		detenida: 'La carga se detuvo. Reintentá desde el mapa.',
		esperando: 'Esperando esta pasada. La música continúa cuando el mapa esté listo.'
	},
	leyenda: {
		aria: 'Leyenda',
		clases: {
			IV: 'Vegetación inundada',
			OW: 'Agua abierta',
			NI: 'No inundado',
			NC: 'No clasificado'
		},
		rgb: 'Rojo: HH · verde: HV · azul: HH − HV. El color representa intensidad del radar, no una fotografía.',
		conexion: 'Conexión compatible',
		baja: 'Baja frecuencia',
		persistente: 'Persistente',
		insuficiente: 'Insuficiente',
		sensibilidad:
			'Respuesta HH en dB/m: marrón ≤ −0,5 · papel 0 · verde ≥ 0,5. Gris: sin estimación. La intensidad del color no indica significancia estadística.',
		frecuencia:
			'Frecuencia de inundación: papel 0 % · azul 100 %. Gris: sin estimación. Solo se muestran celdas de manglar.'
	},
	estados: {
		conectada: 'Respuesta compatible con conexión',
		seca: 'Baja frecuencia de inundación observada',
		estancada: 'Inundación persistente observada',
		datos_insuficientes: 'Datos insuficientes'
	},
	inspector: {
		norte: 'N',
		oeste: 'O',
		fueraMascara: 'Fuera de la máscara de manglar',
		sinMetricas: 'Sin métricas disponibles',
		inundacionTodas: 'Inundación · todas',
		enAlta: 'En marea alta',
		enBaja: 'En marea baja',
		respuestaHh: 'Respuesta HH',
		pRespuesta: 'p de respuesta HH',
		fechasAltaBaja: 'Fechas alta / baja',
		nota: cercaUmbral =>
			`${cercaUmbral} de fechas cerca de un umbral. No es exactitud validada. Los valores p por celda están redondeados.`,
		fechaSeleccionada: 'Fecha seleccionada:',
		verObservaciones: n => `Ver las ${n} observaciones`,
		fecha: 'Fecha / pista',
		clase: 'Clase',
		cambio: (fecha, delta) =>
			`Cambio de copa candidato: ${fecha}, ΔHV ${delta} dB. Requiere verificación independiente.`,
		sinSenal: 'No hay señal HH válida para graficar.',
		serie: 'Señal HH de la celda · dB',
		serieAria:
			'Evolución de HH en las veinte adquisiciones. Los valores exactos están en la tabla.',
		marea: 'marea'
	}
};

/** Las advertencias del motor llegan en español; estas son las que publica hoy. */
const ADVERTENCIAS_EN: [RegExp, (m: RegExpMatchArray) => string][] = [
	[
		/^Sin polígonos de zonas estables/,
		() =>
			'No stable-area polygons: calibration uses dense, stable vegetation chosen automatically.'
	],
	[/^Sin DEM \((D-\d+)\)/, m => `No DEM (${m[1]}): the analysis mask does not exclude slopes.`],
	[
		/^Sin altura de dosel \((D-\d+)\)/,
		m => `No canopy height (${m[1]}): all the mangrove goes into a single (low) stratum.`
	],
	[
		/^NISAR observó como máximo el (\d+(?:[.,]\d+)?) ?%/,
		m =>
			`NISAR observed at most ${m[1]}% of the predicted high water: a 'dry' state may come from high tides that were not observed.`
	],
	[
		/^La marea es la del golfo abierto/,
		() => 'The tide is that of the open gulf, with no lag inside the estuary (desfase_min = 0).'
	],
	[
		/^Sin muestras ópticas etiquetadas/,
		() =>
			'No labelled optical samples: overall accuracy was not measured and thresholds were not tuned with them.'
	]
];

const en: TextosLab = {
	locale: 'en-US',
	tituloPagina: 'Estuary laboratory · Mangroove',
	sinDato: 'No data',
	sinEstimacion: 'No estimate',
	pMinima: '< 0.0001',
	app: {
		cargando: 'Opening the estuary',
		cargandoTexto: 'Loading the radar passes and the tide score…',
		error: 'We could not open the estuary',
		errorDatos: 'No connection to the data.',
		sitioFaltante: 'This site is not part of the laboratory.',
		reintentar: 'Try again',
		abrirChismuyo: 'Open Chismuyo'
	},
	header: {
		inicio: 'Mangroove, go to the home page',
		secciones: 'Sections',
		historia: 'Story',
		explorar: 'Explore',
		metodo: 'Method and data',
		estuario: 'Estuary',
		idioma: 'Language',
		compartir: 'Share',
		copiado: 'Copied',
		compartirError: 'The link could not be copied. You can copy the address from the browser.',
		cerrarAviso: 'Close notice'
	},
	mapa: {
		preparando: 'Preparing the map…',
		aria: 'Results map. Use the arrow keys to move and Enter to inspect the center.',
		verArea: 'Show the whole area',
		reintentar: 'Retry loading',
		errorPasada: 'This pass could not be loaded.',
		errorCapa: 'A map layer could not be loaded. Check your connection and reload the page.',
		cargandoElegida: 'Loading the chosen pass. The map still shows the previous one.',
		preparandoPasada: 'Preparing the map for this pass…',
		lento: 'The connection is slow. You can keep choosing dates.',
		noInicia: 'The map could not start. Check your connection and try again.',
		recargar: 'Reload'
	},
	modos: {
		grupo: 'Exploration modes',
		ritmo: 'The rhythm',
		sintonia: 'In tune / out of step'
	},
	sidebar: {
		aria: 'Estuary widgets',
		tituloRespuesta: 'The response to the tide',
		introRitmo: 'Choose a pass on the score to see the radar and hear the tide.',
		introRespuesta: 'Explore how mangrove flooding changes between tides.'
	},
	pasada: {
		titulo: 'The pass',
		horaLocal: (hora, sitio) => `${hora}, local time in ${sitio}`,
		orbita: 'Orbit',
		asc: 'Ascending',
		desc: 'Descending',
		pista: pista => `track ${pista}`,
		mareaEstimada: 'Estimated tide',
		recorrido: 'Path through the score',
		notaPorNota: 'Note by note',
		mismaOrbita: 'Same orbit',
		ayudaMismaOrbita: ascendente =>
			`Jumps to the next ${ascendente ? 'ascending' : 'descending'} pass: always compares the mangrove from the same angle.`,
		ayudaNotaPorNota:
			'Follows the score in order. Ascending and descending passes alternate and look at the mangrove from different angles: brightness can change even if the water does not.',
		queMuestra: 'What the map shows',
		radarRgb: 'RGB radar',
		clases: 'Classes',
		resumenCapa:
			'The layer summarizes every pass. The score keeps the tide of each acquisition.'
	},
	nivel: { alta: 'high', media: 'mid', baja: 'low' },
	capas: {
		titulo: 'Map layers',
		disponibles: 'Available layers',
		nombres: {
			clases: 'Flooding by date',
			rgb: 'HH / HV radar',
			estado: 'Flooding pattern',
			if_alta: 'Frequency at high tide',
			if_baja: 'Frequency at low tide',
			sens_db_m: 'HH response to the tide'
		}
	},
	celda: {
		titulo: 'This cell',
		resumenSeleccion: 'Series and metrics of the selection',
		resumenVacia: 'Select a point on the map',
		elegir: 'Choose a point on the map to see its response to the tide.',
		cargando: 'Loading the cell…',
		fuera: 'This point is outside the analysis grid.',
		error: 'The cell could not be loaded.',
		otra: 'Choose another point on the map.',
		limpiar: 'Clear selection',
		inspeccionarCentro: 'Inspect the center'
	},
	calidad: {
		titulo: 'Quality checks',
		resumen: pasan => `${pasan} of 4 global checks pass`,
		nota: 'Internal checks; accuracy against independent samples has not been measured yet.',
		mareaClases: 'Tide · classes',
		mareaHh: 'Tide · HH signal',
		agua: 'Permanent water',
		tierra: 'Dry land',
		pasa: 'Pass',
		noPasa: 'Fail',
		noEvaluable: 'Not testable',
		porPista: 'Classes, by track',
		notaP: 'One-tailed p-values, not adjusted for comparing several sites.'
	},
	marea: {
		titulo: 'Tide and limits',
		resumen: pleamar => `Observed high water: ${pleamar}`,
		texto: pleamar =>
			`The passes reach ${pleamar} of the maximum predicted high water. A low observed frequency does not confirm a disconnection.`,
		modelo: modelo =>
			`Model ${modelo}, with no estimated local lag. Each note is one acquisition; its height and sound follow the tide.`,
		advertencia: texto => {
			for (const [patron, traducir] of ADVERTENCIAS_EN) {
				const m = texto.match(patron);
				if (m) return traducir(m);
			}
			return texto;
		}
	},
	datos: {
		titulo: 'Data and provenance',
		resumen: pasadas => `${pasadas} passes · 10 m · 1 ha cells`,
		procedencia: 'NISAR: NASA/JPL-Caltech and ISRO. Distribution: ASF DAAC. Mask: GMW 2020.',
		informe: 'Quality report JSON',
		resumenCsv: 'Summary CSV',
		manifest: 'Release manifest',
		version: (publicacion, contrato, motor) =>
			`Data ${publicacion} · contract ${contrato} · engine ${motor}.`
	},
	experimental: 'Experimental results. Independent validation is still pending.',
	partitura: {
		detenida: 'Loading stopped. Retry from the map.',
		esperando: 'Waiting for this pass. The music continues once the map is ready.'
	},
	leyenda: {
		aria: 'Legend',
		clases: {
			IV: 'Inundated vegetation',
			OW: 'Open water',
			NI: 'Not inundated',
			NC: 'Unclassified'
		},
		rgb: 'Red: HH · green: HV · blue: HH − HV. The color shows radar intensity, not a photograph.',
		conexion: 'Compatible with connection',
		baja: 'Low frequency',
		persistente: 'Persistent',
		insuficiente: 'Insufficient',
		sensibilidad:
			'HH response in dB/m: brown ≤ −0.5 · paper 0 · green ≥ 0.5. Grey: no estimate. Color intensity does not indicate statistical significance.',
		frecuencia:
			'Flooding frequency: paper 0% · blue 100%. Grey: no estimate. Only mangrove cells are shown.'
	},
	estados: {
		conectada: 'Response compatible with connection',
		seca: 'Low observed flooding frequency',
		estancada: 'Persistent flooding observed',
		datos_insuficientes: 'Insufficient data'
	},
	inspector: {
		norte: 'N',
		oeste: 'W',
		fueraMascara: 'Outside the mangrove mask',
		sinMetricas: 'No metrics available',
		inundacionTodas: 'Flooding · all',
		enAlta: 'At high tide',
		enBaja: 'At low tide',
		respuestaHh: 'HH response',
		pRespuesta: 'p of HH response',
		fechasAltaBaja: 'High / low dates',
		nota: cercaUmbral =>
			`${cercaUmbral} of dates near a threshold. This is not validated accuracy. Per-cell p-values are rounded.`,
		fechaSeleccionada: 'Selected date:',
		verObservaciones: n => `See the ${n} observations`,
		fecha: 'Date / track',
		clase: 'Class',
		cambio: (fecha, delta) =>
			`Candidate canopy change: ${fecha}, ΔHV ${delta} dB. Needs independent verification.`,
		sinSenal: 'There is no valid HH signal to plot.',
		serie: 'HH signal of the cell · dB',
		serieAria: 'HH over the twenty acquisitions. The exact values are in the table.',
		marea: 'tide'
	}
};

export const TEXTOS_LAB: Record<Idioma, TextosLab> = { es, en };

/** Textos del laboratorio en el idioma activo, más su formato de números. */
export function useLab() {
	const { idioma, setIdioma, fmt } = useIdioma();
	const t = TEXTOS_LAB[idioma];
	const numero = (v: number | null, digitos = 3) =>
		v === null ? t.sinDato : v.toLocaleString(t.locale, { maximumFractionDigits: digitos });
	return { t, idioma, setIdioma, fmt, numero };
}
