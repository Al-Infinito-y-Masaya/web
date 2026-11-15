import { queryOptions, useQuery } from '@tanstack/react-query';

import { unwrapOrThrow } from '@/shared/models/result/result';

import {
	listarDescargas,
	listarEstanques,
	listarHipotesis,
	listarRegiones,
	obtenerCeldaPorPunto,
	obtenerManifiesto,
	obtenerMetodo,
	obtenerResumen,
	type ClaseEstanque,
	type Contexto,
	type OrdenEstanques
} from './api';

/** A published version never changes (RN-14): its responses are cached for the session. */
const INMUTABLE = { staleTime: Infinity, gcTime: Infinity } as const;

const clave = (ctx: Contexto) => ['mangroove', ctx.region, ctx.version, ctx.origen] as const;

export const datos = {
	regiones: () =>
		queryOptions({
			queryKey: ['mangroove', 'regiones'],
			queryFn: () => unwrapOrThrow(listarRegiones()),
			staleTime: 5 * 60_000
		}),
	manifiesto: (region: string, version: string) =>
		queryOptions({
			queryKey: ['mangroove', region, version, 'manifiesto'],
			queryFn: () => unwrapOrThrow(obtenerManifiesto(region, version)),
			...INMUTABLE
		}),
	celda: (ctx: Contexto, lon: number, lat: number) =>
		queryOptions({
			// A cell is ~100 m: five decimals identify the click without splitting the cache.
			queryKey: [...clave(ctx), 'celda', lon.toFixed(5), lat.toFixed(5)],
			queryFn: () => unwrapOrThrow(obtenerCeldaPorPunto(ctx, lon, lat)),
			...INMUTABLE
		}),
	resumen: (ctx: Contexto) =>
		queryOptions({
			queryKey: [...clave(ctx), 'resumen'],
			queryFn: () => unwrapOrThrow(obtenerResumen(ctx)),
			...INMUTABLE
		}),
	estanques: (ctx: Contexto, clase: ClaseEstanque, orden: OrdenEstanques) =>
		queryOptions({
			queryKey: [...clave(ctx), 'estanques', clase, orden],
			queryFn: () => unwrapOrThrow(listarEstanques(ctx, clase, orden)),
			...INMUTABLE
		}),
	hipotesis: (ctx: Contexto) =>
		queryOptions({
			queryKey: [...clave(ctx), 'hipotesis'],
			queryFn: () => unwrapOrThrow(listarHipotesis(ctx)),
			...INMUTABLE
		}),
	metodo: (ctx: Contexto) =>
		queryOptions({
			queryKey: [...clave(ctx), 'metodo'],
			queryFn: () => unwrapOrThrow(obtenerMetodo(ctx)),
			...INMUTABLE
		}),
	descargas: (ctx: Contexto) =>
		queryOptions({
			queryKey: [...clave(ctx), 'descargas'],
			queryFn: () => unwrapOrThrow(listarDescargas(ctx)),
			...INMUTABLE
		})
};

export const useRegiones = () => useQuery(datos.regiones());
