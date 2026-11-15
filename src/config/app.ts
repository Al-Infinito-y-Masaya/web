/**
 * App-wide constants. Rename the app, change the locale or the storage keys
 * here instead of hunting for literals across the codebase.
 */
export const appConfig = {
	name: 'Mangroove',
	description:
		'Qué manglares del delta del Estero Real siguen recibiendo la marea, vistos con el radar NISAR.',
	team: 'Al Infinito y Masaya',
	repository: 'https://github.com/Al-Infinito-y-Masaya',
	repositories: {
		web: 'https://github.com/Al-Infinito-y-Masaya/web',
		api: 'https://github.com/Al-Infinito-y-Masaya/api'
	},
	/** BCP 47 locale of the generic formatters in `shared/` (`undefined` = browser locale). */
	locale: undefined as string | undefined,
	storageKeys: {
		theme: 'mangroove-tema',
		language: 'mangroove-idioma',
		sound: 'mangroove-sonido',
		/** Session flag: the intro already played in this tab. */
		intro: 'mangroove-intro-vista',
		tableColumns: 'app-table-columns:'
	}
} as const;
