import { useQuery } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { env } from '@/config/env';
import { AppException } from '@/shared/models/app-error/app-error';

import type { Contexto, Origen } from './api';
import type { Manifiesto, Region } from './esquemas';
import { datos } from './servicio';

/**
 * The data session: which region and which version the whole app is showing.
 *
 * Everything belongs to one version of one region (contract rule 4). The
 * session resolves it once — from a shared link, or from the region's current
 * version — loads its manifest, and every screen reads from here, so the map,
 * the score and the inspector can never mix versions.
 */

export type MotivoError = 'sin-conexion' | 'retirada' | 'no-encontrada' | 'formato' | 'otro';

type Sesion = {
	estado: 'cargando' | 'lista' | 'error';
	motivo?: MotivoError;
	regiones: Region[];
	manifiesto?: Manifiesto;
	ctx?: Contexto;
	origen?: Origen;
	/** Opens a region; with `version`, that exact version (a shared link). */
	abrir: (region: string | undefined, version?: string) => void;
	/** After a retired version: forget the link's version and open the current one. */
	abrirVigente: () => void;
	reintentar: () => void;
};

const SesionContexto = createContext<Sesion | null>(null);

function motivoDe(error: unknown): MotivoError {
	const e = error instanceof AppException ? error.error : undefined;
	if (!e) return 'otro';
	if (e.kind === 'network') return 'sin-conexion';
	if (e.kind === 'http' && e.status === 410) return 'retirada';
	if (e.kind === 'http' && e.status >= 500) return 'sin-conexion';
	if (e.kind === 'notFound') return 'no-encontrada';
	if (e.kind === 'parse' || e.kind === 'validation') return 'formato';
	return 'otro';
}

export function SesionProvider({ children }: { children: ReactNode }) {
	const [pedido, setPedido] = useState<{ region?: string; version?: string }>({});
	const regiones = useQuery(datos.regiones());

	const lista = regiones.data?.regiones;
	const region =
		lista?.find(r => r.codigo === pedido.region) ?? (pedido.region ? undefined : lista?.[0]);
	// A link that names region and version can load even if the list failed.
	const codigo =
		pedido.region ?? region?.codigo ?? (regiones.isError ? env.defaultRegion : undefined);
	const version = pedido.version ?? region?.version;

	const manifiesto = useQuery({
		...datos.manifiesto(codigo ?? '', version ?? ''),
		enabled: Boolean(codigo && version)
	});

	const abrir = useCallback((nuevaRegion: string | undefined, nuevaVersion?: string) => {
		setPedido(previo =>
			previo.region === nuevaRegion && previo.version === nuevaVersion
				? previo
				: { region: nuevaRegion, version: nuevaVersion }
		);
	}, []);
	const abrirVigente = useCallback(() => setPedido(p => ({ region: p.region })), []);
	const refetchRegiones = regiones.refetch;
	const refetchManifiesto = manifiesto.refetch;
	const reintentar = useCallback(() => {
		void refetchRegiones();
		void refetchManifiesto();
	}, [refetchRegiones, refetchManifiesto]);

	const valor = useMemo<Sesion>(() => {
		const base = { regiones: lista ?? [], abrir, abrirVigente, reintentar };
		if (manifiesto.data && codigo && version) {
			const { manifiesto: m, origen } = manifiesto.data;
			return {
				...base,
				estado: 'lista',
				manifiesto: m,
				origen,
				ctx: { region: codigo, version: m.version, origen }
			};
		}
		if (manifiesto.isError)
			return { ...base, estado: 'error', motivo: motivoDe(manifiesto.error) };
		if (regiones.isError && !version) {
			return { ...base, estado: 'error', motivo: motivoDe(regiones.error) };
		}
		if (lista && !region && !pedido.version) {
			// The API answered, but there is no such region or no region is published yet.
			return { ...base, estado: 'error', motivo: 'no-encontrada' };
		}
		return { ...base, estado: 'cargando' };
	}, [
		lista,
		abrir,
		abrirVigente,
		reintentar,
		manifiesto.data,
		manifiesto.isError,
		manifiesto.error,
		regiones.isError,
		regiones.error,
		codigo,
		version,
		region,
		pedido.version
	]);

	return <SesionContexto.Provider value={valor}>{children}</SesionContexto.Provider>;
}

export function useSesion() {
	const sesion = useContext(SesionContexto);
	if (!sesion) throw new Error('useSesion debe usarse dentro de <SesionProvider>.');
	return sesion;
}
