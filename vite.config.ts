/// <reference types="vitest/config" />
import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), '');

	return {
		resolve: {
			alias: {
				'@': path.resolve(import.meta.dirname, './src'),
				'@assets': path.resolve(import.meta.dirname, './public')
			}
		},
		plugins: [
			// Must come before the React plugin.
			tanstackRouter({
				target: 'react',
				autoCodeSplitting: true,
				routesDirectory: './src/app/routes',
				generatedRouteTree: './src/app/routeTree.gen.ts'
			}),
			react(),
			tailwindcss()
		],
		server: {
			port: Number(env.PORT ?? 3000),
			// Optional dev proxy: set VITE_API_URL=/api and DEV_API_PROXY=http://localhost:8000
			// to avoid CORS while developing.
			proxy: env.DEV_API_PROXY
				? {
						'/api': {
							target: env.DEV_API_PROXY,
							changeOrigin: true,
							rewrite: p => p.replace(/^\/api/, '')
						}
					}
				: undefined
		},
		test: {
			environment: 'jsdom',
			globals: false,
			setupFiles: ['./src/test/setup.ts'],
			include: ['src/**/*.test.{ts,tsx}'],
			css: false,
			coverage: {
				provider: 'v8',
				include: ['src/**/*.{ts,tsx}'],
				exclude: ['src/**/*.test.{ts,tsx}', 'src/app/routeTree.gen.ts', 'src/**/*.d.ts']
			}
		}
	};
});
