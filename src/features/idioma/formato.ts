/**
 * Locale-aware formatting. Instants arrive in UTC and are always shown in the
 * local time of the region (`region.zona_horaria`, RN-18), never in the
 * visitor's time zone.
 */

// Plain `es` (decimal comma), as in the design; dates read the same as in es-NI.
const LOCALES = { es: 'es', en: 'en-US' } as const;

/** Non-breaking space between a number and its unit, so they never split across lines. */
const NBSP = '\u00a0';

const MENOS = '−';

export function crearFormato(idioma: 'es' | 'en') {
	const locale = LOCALES[idioma];
	const numero = (valor: number, decimales = 0) =>
		new Intl.NumberFormat(locale, {
			minimumFractionDigits: decimales,
			maximumFractionDigits: decimales
		})
			.format(valor)
			.replace('-', MENOS);

	const fecha = (opciones: Intl.DateTimeFormatOptions) => (iso: string, zona: string) => {
		try {
			return new Intl.DateTimeFormat(locale, { ...opciones, timeZone: zona }).format(
				new Date(iso)
			);
		} catch {
			// Unknown time zone id: fall back to UTC rather than to the visitor's zone.
			return new Intl.DateTimeFormat(locale, { ...opciones, timeZone: 'UTC' }).format(
				new Date(iso)
			);
		}
	};

	return {
		locale,
		numero,
		/** `0.05` → `5 %`. Callers handle `null` before formatting. */
		porcentaje: (fraccion: number) => `${numero(Math.round(fraccion * 100))}${NBSP}%`,
		/** `0.81` → `+0,81 m` */
		metros: (valor: number) => `${valor > 0 ? '+' : ''}${numero(valor, 2)}${NBSP}m`,
		decibeles: (valor: number) => `${numero(valor, 1)}${NBSP}dB`,
		hectareas: (valor: number) => `${numero(Math.round(valor))}${NBSP}ha`,
		fechaLarga: fecha({ day: 'numeric', month: 'short', year: 'numeric' }),
		fechaCorta: fecha({ day: 'numeric', month: 'short' }),
		mes: fecha({ month: 'short' }),
		hora: fecha({ hour: 'numeric', minute: '2-digit' }),
		fechaHora: fecha({
			day: 'numeric',
			month: 'short',
			year: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		}),
		bytes: (cantidad: number) => {
			if (cantidad >= 1024 * 1024) return `${numero(cantidad / (1024 * 1024), 1)} MB`;
			if (cantidad >= 1024) return `${numero(Math.round(cantidad / 1024))} KB`;
			return `${numero(cantidad)} B`;
		},
		coordenadas: (lon: number, lat: number) =>
			`${numero(Math.abs(lat), 4)}° ${lat >= 0 ? 'N' : 'S'}, ${numero(Math.abs(lon), 4)}° ${
				lon >= 0 ? 'E' : idioma === 'es' ? 'O' : 'W'
			}`
	};
}

export type Formato = ReturnType<typeof crearFormato>;
