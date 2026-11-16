import * as maplibregl from 'maplibre-gl';
import { type ExpressionSpecification } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import { Protocol } from 'pmtiles';
import { useEffect, useRef, useState } from 'react';

import 'maplibre-gl/dist/maplibre-gl.css';

import { env } from '@/config/env';

import { assetUrl, type Cell, type Dataset } from './data';
import { type Layer, type MapStatus } from './layers';
import { RasterCache, type RasterStatus } from './raster-cache';
import { useLab } from './textos';

const protocol = new Protocol();
const NOTICE_DELAY_MS = 300;
const CROSSFADE_MS = 200;
/** One neighbour on data-saving or slow connections, two otherwise. */
function prefetchLimit() {
	const connection = (
		navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }
	).connection;
	return connection?.saveData || /(^|-)(2g|3g)$/.test(connection?.effectiveType ?? '') ? 1 : 2;
}
maplibregl.setWorkerUrl(workerUrl);
maplibregl.addProtocol('pmtiles', protocol.tile);
const stateColors: ExpressionSpecification = [
	'match',
	['get', 'estado'],
	'conectada',
	'#2f5f50',
	'seca',
	'#bc9435',
	'estancada',
	'#3987e5',
	'#9a9893'
];
export function ExperimentalMap({
	dataset,
	date,
	layer,
	neighbors = [],
	selected,
	onPoint,
	onStatus,
	embedded = false
}: {
	dataset: Dataset;
	date: string;
	layer: Layer;
	/** Dates to fetch in the background once the current one is on screen. */
	neighbors?: string[];
	selected: Cell | null;
	onPoint: (lon: number, lat: number) => void;
	onStatus: (status: MapStatus) => void;
	embedded?: boolean;
}) {
	const host = useRef<HTMLDivElement>(null);
	const map = useRef<maplibregl.Map | null>(null);
	const callback = useRef(onPoint);
	const statusCallback = useRef(onStatus);
	const rasterCache = useRef<RasterCache | null>(null);
	const currentKey = useRef(`${layer}:${date}`);
	const [rasterStatus, setRasterStatus] = useState<RasterStatus | null>(null);
	const [ready, setReady] = useState(false);
	const { t } = useLab();
	const [error, setError] = useState<'' | 'pasada' | 'capa'>('');
	const [loading, setLoading] = useState(true);
	const [retry, setRetry] = useState(0);
	const [slow, setSlow] = useState(false);
	const [notice, setNotice] = useState(false);
	const padding = () =>
		embedded && window.innerWidth > 900
			? { top: 80, bottom: 210, left: 30, right: 70 }
			: { top: 80, bottom: 30, left: 30, right: 50 };
	useEffect(() => {
		callback.current = onPoint;
	}, [onPoint]);
	useEffect(() => {
		statusCallback.current = onStatus;
	}, [onStatus]);
	useEffect(() => {
		// A cached or fast date swaps without flashing a message.
		if (!loading) return;
		const timer = window.setTimeout(() => setNotice(true), NOTICE_DELAY_MS);
		return () => {
			window.clearTimeout(timer);
			setNotice(false);
		};
	}, [loading]);
	useEffect(() => {
		if (!loading) return;
		const timer = window.setTimeout(() => setSlow(true), 3500);
		return () => {
			window.clearTimeout(timer);
			setSlow(false);
		};
	}, [loading]);
	useEffect(() => {
		if (!host.current) return;
		const m = new maplibregl.Map({
			container: host.current,
			style: {
				version: 8,
				sources: {},
				layers: [
					{
						id: 'background',
						type: 'background',
						paint: { 'background-color': '#233e45' }
					}
				]
			},
			center: dataset.manifest.region.centro,
			zoom: 11,
			attributionControl: false,
			maxZoom: 17
		});
		map.current = m;
		rasterCache.current = new RasterCache(
			{
				add: (id, url) => {
					m.addSource(id, { type: 'raster', url: `pmtiles://${url}`, tileSize: 256 });
					m.addLayer(
						{
							id,
							type: 'raster',
							source: id,
							paint: {
								'raster-resampling': 'nearest',
								'raster-fade-duration': 0,
								'raster-opacity': 0,
								'raster-opacity-transition': { duration: CROSSFADE_MS, delay: 0 }
							}
						},
						'connectivity'
					);
				},
				show: (id, visible, opacity) => {
					m.setLayoutProperty(id, 'visibility', visible ? 'visible' : 'none');
					m.setPaintProperty(id, 'raster-opacity', opacity);
				},
				remove: id => {
					if (m.getLayer(id)) m.removeLayer(id);
					if (m.getSource(id)) m.removeSource(id);
				},
				loaded: id => !!m.getSource(id) && m.isSourceLoaded(id)
			},
			status => {
				setRasterStatus(status);
				setLoading(status.loading);
				setError(status.error ? 'pasada' : '');
				statusCallback.current(status);
			}
		);
		m.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
		m.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');
		m.addControl(
			new maplibregl.AttributionControl({
				compact: false,
				customAttribution: 'NISAR · NASA/JPL-Caltech · ISRO · GMW 2020'
			})
		);
		m.fitBounds(dataset.manifest.region.bbox, {
			padding:
				embedded && window.innerWidth > 900
					? { top: 80, bottom: 210, left: 30, right: 70 }
					: { top: 80, bottom: 30, left: 30, right: 50 },
			duration: 0
		});
		m.on('load', () => {
			if (env.tilesUrl) {
				m.addSource('reference', {
					type: 'raster',
					tiles: [env.tilesUrl],
					tileSize: 256,
					maxzoom: 14,
					attribution: 'Sentinel-2 cloudless 2016 · EOX (CC BY 4.0)'
				});
				m.addLayer({
					id: 'reference',
					type: 'raster',
					source: 'reference',
					paint: { 'raster-opacity': 0.6 }
				});
			}
			m.addSource('connectivity', {
				type: 'vector',
				url: `pmtiles://${assetUrl(dataset.manifest.capas.conectividad, dataset.manifestUrl)}`
			});
			m.addLayer({
				id: 'connectivity',
				type: 'fill',
				source: 'connectivity',
				'source-layer': 'conectividad',
				layout: { visibility: 'none' },
				paint: { 'fill-color': stateColors, 'fill-opacity': 0.85 }
			});
			m.addSource('selection', {
				type: 'geojson',
				data: { type: 'FeatureCollection', features: [] }
			});
			m.addLayer({
				id: 'selection',
				type: 'circle',
				source: 'selection',
				paint: {
					'circle-radius': 8,
					'circle-color': '#f7f1e3',
					'circle-stroke-color': '#14262b',
					'circle-stroke-width': 3
				}
			});
			setReady(true);
		});
		m.on('error', e => {
			const sourceId = (e as { sourceId?: string }).sourceId;
			if (sourceId === 'reference') return;
			if (sourceId?.startsWith('acquisition-')) {
				rasterCache.current?.fail(sourceId);
				return;
			}
			setError('capa');
			setLoading(false);
			statusCallback.current({ key: currentKey.current, loading: false, error: true });
		});
		m.on('sourcedata', e => {
			if (e.sourceId.startsWith('acquisition-')) rasterCache.current?.check(e.sourceId);
			if (
				e.sourceId === 'connectivity' &&
				e.isSourceLoaded &&
				!currentKey.current.match(/^(rgb|clases):/)
			) {
				setLoading(false);
				statusCallback.current({ key: currentKey.current, loading: false, error: false });
			}
		});
		m.on('click', e => callback.current(e.lngLat.lng, e.lngLat.lat));
		const keyboard = (e: KeyboardEvent) => {
			if (e.key === 'Enter') {
				e.preventDefault();
				const center = m.getCenter();
				callback.current(center.lng, center.lat);
			}
		};
		m.getCanvas().addEventListener('keydown', keyboard);
		let wide = window.innerWidth > 900;
		const resize = new ResizeObserver(() => {
			m.resize();
			const nextWide = window.innerWidth > 900;
			if (nextWide !== wide) {
				wide = nextWide;
				m.fitBounds(dataset.manifest.region.bbox, {
					padding:
						embedded && wide
							? { top: 80, bottom: 210, left: 30, right: 70 }
							: { top: 80, bottom: 30, left: 30, right: 50 },
					duration: 0
				});
			}
		});
		resize.observe(host.current);
		return () => {
			resize.disconnect();
			m.getCanvas().removeEventListener('keydown', keyboard);
			m.remove();
			map.current = null;
			rasterCache.current = null;
		};
	}, [dataset, embedded]);
	useEffect(() => {
		const m = map.current;
		if (!m || !ready) return;
		const raster = layer === 'clases' || layer === 'rgb';
		currentKey.current = `${layer}:${date}`;
		m.setLayoutProperty('connectivity', 'visibility', raster ? 'none' : 'visible');
		if (raster) {
			const relative = dataset.manifest.capas[layer][date];
			if (relative) {
				rasterCache.current?.select(
					currentKey.current,
					assetUrl(relative, dataset.manifestUrl)
				);
			}
		} else {
			rasterCache.current?.deactivate();
			const report = () => {
				const pending = !m.isSourceLoaded('connectivity');
				setError('');
				setLoading(pending);
				statusCallback.current({ key: currentKey.current, loading: pending, error: false });
			};
			m.once('render', report);
			const color: ExpressionSpecification =
				layer === 'estado'
					? stateColors
					: layer === 'sens_db_m'
						? [
								'interpolate',
								['linear'],
								['coalesce', ['get', 'sens_db_m'], 0],
								-0.5,
								'#bb734f',
								0,
								'#f7f1e3',
								0.5,
								'#0d3b16'
							]
						: [
								'interpolate',
								['linear'],
								['coalesce', ['get', layer], 0],
								0,
								'#f7f1e3',
								0.5,
								'#9bc3c2',
								1,
								'#236a83'
							];
			m.setPaintProperty(
				'connectivity',
				'fill-color',
				layer === 'estado'
					? color
					: ['case', ['==', ['typeof', ['get', layer]], 'number'], color, '#9a9893']
			);
			return () => {
				m.off('render', report);
			};
		}
	}, [dataset, date, layer, ready, retry]);
	const neighborKey = neighbors.join('|');
	const currentShown = rasterStatus?.displayed === `${layer}:${date}` && !rasterStatus.loading;
	useEffect(() => {
		// Warm up the neighbouring dates only after the chosen one is on screen, so they
		// never compete with it for bandwidth.
		if (!ready || !currentShown || (layer !== 'rgb' && layer !== 'clases')) return;
		const items = neighborKey
			.split('|')
			.filter(Boolean)
			.slice(0, prefetchLimit())
			.flatMap(id => {
				const relative = dataset.manifest.capas[layer][id];
				return relative
					? [[`${layer}:${id}`, assetUrl(relative, dataset.manifestUrl)] as const]
					: [];
			});
		rasterCache.current?.prefetch(items);
	}, [dataset, layer, neighborKey, ready, currentShown]);
	useEffect(() => {
		const m = map.current;
		if (!m || !ready) return;
		(m.getSource('selection') as maplibregl.GeoJSONSource).setData({
			type: 'FeatureCollection',
			features: selected
				? [
						{
							type: 'Feature',
							properties: {},
							geometry: { type: 'Point', coordinates: selected.centroide }
						}
					]
				: []
		});
	}, [selected, ready]);
	return (
		<div className="exp-map-wrap" aria-busy={loading}>
			<div ref={host} className="exp-map" aria-label={t.mapa.aria} />
			<button
				className="exp-fit"
				onClick={() =>
					map.current?.fitBounds(dataset.manifest.region.bbox, {
						padding: padding(),
						duration: 0
					})
				}
			>
				{t.mapa.verArea}
			</button>
			{error ? (
				<div className="exp-map-message" role="alert">
					{error === 'pasada' ? t.mapa.errorPasada : t.mapa.errorCapa}
					<button
						className="boton boton-contorno"
						onClick={() => {
							if (layer === 'rgb' || layer === 'clases')
								rasterCache.current?.retry(
									`${layer}:${date}`,
									assetUrl(
										dataset.manifest.capas[layer][date]!,
										dataset.manifestUrl
									)
								);
							else {
								(
									map.current?.getSource('connectivity') as
										maplibregl.VectorTileSource | undefined
								)?.setUrl(
									`pmtiles://${assetUrl(dataset.manifest.capas.conectividad, dataset.manifestUrl)}`
								);
								setRetry(v => v + 1);
							}
						}}
					>
						{t.mapa.reintentar}
					</button>
				</div>
			) : (
				loading &&
				notice && (
					<p className="exp-map-message" role="status">
						{(layer === 'rgb' || layer === 'clases') &&
						rasterStatus?.displayed &&
						rasterStatus.displayed !== `${layer}:${date}`
							? t.mapa.cargandoElegida
							: t.mapa.preparandoPasada}
						{slow && <span className="exp-load-hint">{t.mapa.lento}</span>}
					</p>
				)
			)}
		</div>
	);
}
