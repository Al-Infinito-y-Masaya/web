import * as maplibregl from 'maplibre-gl';
import { type ExpressionSpecification } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import { Protocol } from 'pmtiles';
import { useEffect, useRef, useState } from 'react';

import 'maplibre-gl/dist/maplibre-gl.css';

import { assetUrl, type Cell, type Dataset } from './data';

const protocol = new Protocol();
maplibregl.setWorkerUrl(workerUrl);
maplibregl.addProtocol('pmtiles', protocol.tile);
export type Layer = 'clases' | 'rgb' | 'estado' | 'if_alta' | 'if_baja' | 'sens_db_m';
export const layerLabels: Record<Layer, string> = {
	clases: 'Inundación por fecha',
	rgb: 'Radar HH / HV',
	estado: 'Patrón de inundación',
	if_alta: 'Frecuencia en marea alta',
	if_baja: 'Frecuencia en marea baja',
	sens_db_m: 'Respuesta HH a la marea'
};
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
	selected,
	onPoint
}: {
	dataset: Dataset;
	date: string;
	layer: Layer;
	selected: Cell | null;
	onPoint: (lon: number, lat: number) => void;
}) {
	const host = useRef<HTMLDivElement>(null);
	const map = useRef<maplibregl.Map | null>(null);
	const callback = useRef(onPoint);
	const [ready, setReady] = useState(false);
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(true);
	useEffect(() => {
		callback.current = onPoint;
	}, [onPoint]);
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
						paint: { 'background-color': '#dfe6e0' }
					}
				]
			},
			center: dataset.manifest.region.centro,
			zoom: 11,
			attributionControl: false,
			maxZoom: 17
		});
		map.current = m;
		m.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
		m.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');
		m.addControl(
			new maplibregl.AttributionControl({
				compact: false,
				customAttribution: 'NISAR · NASA/JPL-Caltech e ISRO · GMW 2020'
			})
		);
		m.fitBounds(dataset.manifest.region.bbox, { padding: 28, duration: 0 });
		m.on('load', () => {
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
		m.on('error', () => {
			setError(
				'No se pudo cargar una capa del mapa. Comprueba la conexión y vuelve a cargar la página.'
			);
			setLoading(false);
		});
		m.on('sourcedata', e => {
			if (e.sourceId === 'acquisition' && e.isSourceLoaded) setLoading(false);
		});
		m.on('dataloading', () => setLoading(true));
		m.on('idle', () => setLoading(false));
		m.on('click', e => callback.current(e.lngLat.lng, e.lngLat.lat));
		return () => {
			m.remove();
			map.current = null;
		};
	}, [dataset]);
	useEffect(() => {
		const m = map.current;
		if (!m || !ready) return;
		const raster = layer === 'clases' || layer === 'rgb';
		m.setLayoutProperty('connectivity', 'visibility', raster ? 'none' : 'visible');
		if (m.getLayer('acquisition')) m.removeLayer('acquisition');
		if (m.getSource('acquisition')) m.removeSource('acquisition');
		if (raster) {
			const relative = dataset.manifest.capas[layer][date];
			if (relative) {
				m.addSource('acquisition', {
					type: 'raster',
					url: `pmtiles://${assetUrl(relative, dataset.manifestUrl)}`,
					tileSize: 256
				});
				m.addLayer(
					{
						id: 'acquisition',
						type: 'raster',
						source: 'acquisition',
						paint: { 'raster-resampling': 'nearest', 'raster-fade-duration': 0 }
					},
					'connectivity'
				);
			}
		} else {
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
		}
	}, [dataset, date, layer, ready]);
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
		<div className="exp-map-wrap">
			<div
				ref={host}
				className="exp-map"
				aria-label="Mapa de resultados. Usa las flechas para desplazarte y pulsa una celda para inspeccionarla."
			/>
			<button
				className="exp-fit"
				onClick={() =>
					map.current?.fitBounds(dataset.manifest.region.bbox, {
						padding: 28,
						duration: 0
					})
				}
			>
				Ver área completa
			</button>
			{error ? (
				<p className="exp-map-message" role="alert">
					{error}
				</p>
			) : (
				loading && (
					<p className="exp-map-message" role="status">
						Cargando teselas…
					</p>
				)
			)}
		</div>
	);
}
