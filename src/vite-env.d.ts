/// <reference types="vite/client" />

interface ViteTypeOptions {
	// Disallow unknown keys on import.meta.env.
	strictImportMetaEnv: unknown;
}

/** Declare every VITE_* variable here (and document it in .env.example). */
interface ImportMetaEnv {
	readonly VITE_API_URL?: string;
	readonly VITE_DEBUG?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
