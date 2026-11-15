import { z } from 'zod';

/**
 * Typed, validated access to environment variables.
 *
 * Every `import.meta.env.VITE_*` read goes through here so a missing or
 * malformed value fails fast at startup with a clear message instead of
 * surfacing later as `undefined`.
 */
const schema = z.object({
	VITE_API_URL: z.string().default('http://localhost:8000'),
	/** Base of the static backup the engine publishes on the CDN (RNF-08). Empty = no backup. */
	VITE_RESPALDO_URL: z.string().default(''),
	/** Region opened when the link does not name one and the API cannot list them. */
	VITE_REGION: z.string().default('estero_real'),
	/** XYZ template of the reference imagery under the layers. Empty = no basemap. */
	VITE_TESELAS_URL: z
		.string()
		.default(
			'https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless_3857/default/GoogleMapsCompatible/{z}/{y}/{x}.jpg'
		),
	VITE_DEBUG: z
		.string()
		.optional()
		.transform(v => v?.toLowerCase() === 'true')
});

const parsed = schema.safeParse(import.meta.env);

if (!parsed.success) {
	throw new Error(
		`Invalid environment variables:\n${z.prettifyError(parsed.error)}\nCheck your .env file against .env.example.`
	);
}

export const env = {
	apiUrl: parsed.data.VITE_API_URL.replace(/\/$/, ''),
	backupUrl: parsed.data.VITE_RESPALDO_URL.replace(/\/$/, ''),
	defaultRegion: parsed.data.VITE_REGION,
	tilesUrl: parsed.data.VITE_TESELAS_URL,
	debug: parsed.data.VITE_DEBUG,
	isDev: import.meta.env.DEV,
	isProd: import.meta.env.PROD
} as const;
