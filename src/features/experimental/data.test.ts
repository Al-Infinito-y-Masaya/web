import { afterEach, describe, expect, it, vi } from 'vitest';

import {
	assetUrl,
	blockSchema,
	cellAt,
	formatP,
	loadCell,
	loadDataset,
	manifestSchema,
	percent,
	qualitySchema,
	type Dataset,
	type Site
} from './data';
import rawBlock from './fixtures/block.json';
import rawManifest from './fixtures/manifest.json';
import rawQuality from './fixtures/quality.json';

const manifest = manifestSchema.parse(rawManifest);
const quality = qualitySchema.parse(rawQuality);
const site: Site = {
	id: 'aserradores',
	nombre: 'Aserradores',
	publicacion: 'r1',
	contrato: '0.2.0',
	manifest: 'aserradores/r1/manifest.json'
};
const catalog = 'https://example.org/archivos/laboratorio/vigente.json';
const dataset: Dataset = {
	manifest,
	quality,
	site,
	manifestUrl: new URL(site.manifest, catalog).href
};
afterEach(() => vi.unstubAllGlobals());
describe('contrato experimental con una exportación real', () => {
	it('conserva las 20 fechas y las diferencias de calidad por pista', () => {
		expect(manifest.fechas).toHaveLength(20);
		expect(quality.prueba_marea.clases_por_pila['098_desc']?.p).toBe(0.0348);
		expect(blockSchema.parse(rawBlock).celdas[0]?.en_mascara).toBe(true);
	});
	it('localiza una celda real por coordenadas y excluye puntos externos', () => {
		const c = rawBlock.celdas[0]!;
		expect(cellAt(manifest, c.centroide[0]!, c.centroide[1]!)).toEqual({
			id: c.id,
			bloque: rawBlock.bloque
		});
		expect(cellAt(manifest, -80, 0)).toBeNull();
	});
	it('rechaza el contrato anterior y las rutas que escapan de la publicación', () => {
		expect(manifestSchema.safeParse({ ...rawManifest, version: '1.1.0' }).success).toBe(false);
		for (const url of ['../otra/cells.json', 'https://otro.org/archivo.json', '/cells.json'])
			expect(() => assetUrl(url, dataset.manifestUrl)).toThrow();
		expect(assetUrl('cells/b_02_02.json', dataset.manifestUrl)).toContain(
			'/aserradores/r1/cells/'
		);
	});
	it('no transforma null ni p redondeado en certeza', () => {
		expect(percent(null)).toBe('Sin dato');
		expect(formatP(null)).toBe('Sin estimación');
		expect(formatP(0)).toBe('< 0,0001');
	});
	it('rechaza calidad de otra configuración', async () => {
		vi.stubGlobal(
			'fetch',
			vi
				.fn()
				.mockResolvedValueOnce(new Response(JSON.stringify(rawManifest)))
				.mockResolvedValueOnce(
					new Response(JSON.stringify({ ...rawQuality, config_sha256: 'otra' }))
				)
		);
		await expect(loadDataset(site, catalog)).rejects.toThrow('no corresponde');
	});
	it('mantiene caches separados por publicación y reintenta fallos de red', async () => {
		const c = rawBlock.celdas[0]!;
		const point = c.centroide as [number, number];
		const fetch = vi
			.fn()
			.mockResolvedValueOnce(new Response('', { status: 503 }))
			.mockImplementation(async () => new Response(JSON.stringify(rawBlock)));
		vi.stubGlobal('fetch', fetch);
		await expect(loadCell(dataset, ...point)).rejects.toThrow('503');
		expect((await loadCell(dataset, ...point))?.id).toBe(c.id);
		await loadCell(dataset, ...point);
		expect(fetch).toHaveBeenCalledTimes(2);
		await loadCell(
			{ ...dataset, manifestUrl: dataset.manifestUrl.replace('/r1/', '/r2/') },
			...point
		);
		expect(fetch).toHaveBeenCalledTimes(3);
	});
	it('rechaza series de otra adquisición', async () => {
		const wrong = structuredClone(rawBlock);
		wrong.celdas[0]!.serie[0]!.fecha_id = '2026-01-01_asc';
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(wrong))));
		await expect(
			loadCell(
				{ ...dataset, manifestUrl: dataset.manifestUrl.replace('/r1/', '/wrong/') },
				...(rawBlock.celdas[0]!.centroide as [number, number])
			)
		).rejects.toThrow('no corresponde');
	});
});
