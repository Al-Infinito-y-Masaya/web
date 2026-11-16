import fs from 'node:fs';
import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

/**
 * La precarga del catálogo usa la misma URL que el cliente: en GitHub Pages los datos viven en
 * api.mangroove.earth (VITE_LABORATORIO_CATALOGO_URL); sin la variable se queda en el mismo origen.
 */
function catalogoPrecargado(): Plugin {
	let catalogo = '';
	return {
		name: 'catalogo-precargado',
		configResolved(config) {
			catalogo = String(config.env.VITE_LABORATORIO_CATALOGO_URL ?? '');
		},
		transformIndexHtml(html) {
			return catalogo
				? html.replace('href="/archivos/laboratorio/vigente.json"', `href="${catalogo}"`)
				: html;
		}
	};
}

// Separate entry: the production web app and its API contract are unchanged.
export default defineConfig({
	root: '.',
	base: '/laboratorio/',
	publicDir: 'public',
	plugins: [
		react(),
		tailwindcss(),
		catalogoPrecargado(),
		{
			name: 'experimental-entry',
			configureServer(server) {
				server.middlewares.use((req, res, next) => {
					if (
						req.url?.startsWith('/archivos/laboratorio/') &&
						process.env.MANGROOVE_DATA_ROOT
					) {
						const root = path.resolve(process.env.MANGROOVE_DATA_ROOT);
						const file = path.resolve(
							root,
							decodeURIComponent(
								req.url.split('?')[0]!.slice('/archivos/laboratorio/'.length)
							)
						);
						if (
							!file.startsWith(root + path.sep) ||
							!fs.existsSync(file) ||
							!fs.statSync(file).isFile()
						) {
							res.statusCode = 404;
							res.end();
							return;
						}
						const size = fs.statSync(file).size;
						const range = req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
						const start = range ? Number(range[1]) : 0;
						const end = range?.[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
						if (start >= size || start > end) {
							res.statusCode = 416;
							res.end();
							return;
						}
						res.setHeader(
							'Content-Type',
							file.endsWith('.json') ? 'application/json' : 'application/octet-stream'
						);
						res.setHeader('Accept-Ranges', 'bytes');
						res.setHeader('Content-Length', end - start + 1);
						if (range) {
							res.statusCode = 206;
							res.setHeader('Content-Range', `bytes ${start}-${end}/${size}`);
						}
						fs.createReadStream(file, { start, end }).pipe(res);
						return;
					}
					if (
						req.url?.match(
							/^\/laboratorio\/(?:aserradores|padre_ramos|chismuyo)?(?:\?.*)?$/
						)
					)
						req.url = '/laboratorio/experimental/index.html';
					next();
				});
			},
			closeBundle() {
				const output = path.resolve('dist-experimental');
				const html = path.join(output, 'experimental/index.html');
				if (fs.existsSync(html)) fs.renameSync(html, path.join(output, 'index.html'));
			}
		}
	],
	build: {
		outDir: 'dist-experimental',
		emptyOutDir: true,
		rollupOptions: { input: 'experimental/index.html' }
	},
	server: { host: '127.0.0.1', port: 3011 },
	resolve: { alias: { '@': path.resolve(import.meta.dirname, './src') } }
});
