import { describe, expect, test } from 'bun:test';
import { JSDOM } from 'jsdom';
import { createMarkerRenderer, type RasterizedMarkerImage } from '../../src/map/marker-renderer';

function createHost() {
	const dom = new JSDOM('<!doctype html><div id="host"></div>');
	return {
		dom,
		host: dom.window.document.getElementById('host') as HTMLDivElement,
	};
}

function createMockMap() {
	const images = new Map<string, unknown>();
	const layers = new Map<string, Record<string, unknown>>();
	const sources = new Map<string, { data: unknown; setData: (data: unknown) => void }>();
	let features: Array<{ properties?: Record<string, unknown> }> = [];

	return {
		images,
		layers,
		map: {
			addImage(id: string, image: unknown) {
				images.set(id, image);
				return this;
			},
			addLayer(layer: Record<string, unknown>) {
				layers.set(layer.id as string, layer);
				return this;
			},
			addSource(id: string, source: { data: unknown }) {
				const nextSource = {
					data: source.data,
					setData(data: unknown) {
						nextSource.data = data;
					},
				};
				sources.set(id, nextSource);
				return this;
			},
			getLayer(id: string) {
				return layers.get(id);
			},
			getSource(id: string) {
				return sources.get(id);
			},
			hasImage(id: string) {
				return images.has(id);
			},
			isStyleLoaded() {
				return true;
			},
			queryRenderedFeatures() {
				return features;
			},
			removeImage(id: string) {
				images.delete(id);
				return this;
			},
			removeLayer(id: string) {
				layers.delete(id);
				return this;
			},
			removeSource(id: string) {
				sources.delete(id);
				return this;
			},
		},
		setFeatures(nextFeatures: Array<{ properties?: Record<string, unknown> }>) {
			features = nextFeatures;
		},
		sources,
	};
}

describe('marker renderer', () => {
	test('dedupes repeated custom SVGs, keeps the default icon, and removes unused images', async () => {
		const { host } = createHost();
		const mockMap = createMockMap();
		const rasterized = new Map<string, number>();
		const renderer = createMarkerRenderer({
			host,
			map: mockMap.map as never,
			rasterizeSvgToImage: async (
				svgMarkup,
				size,
			): Promise<RasterizedMarkerImage> => {
				rasterized.set(svgMarkup, (rasterized.get(svgMarkup) ?? 0) + 1);
				return {
					width: size.width,
					height: size.height,
					data: new Uint8ClampedArray(size.width * size.height * 4),
				};
			},
		});

		await renderer.update({
			markerContent: null,
			markerOffsetY: 0,
			markerScale: 1,
			points: [
				{ id: 1, lat: 52.5, lng: 13.4, markerContent: '<svg viewBox="0 0 10 10"></svg>' },
				{ id: 2, lat: 52.6, lng: 13.5, markerContent: '<svg viewBox="0 0 10 10"></svg>' },
				{ id: 3, lat: 52.7, lng: 13.6 },
			],
		});

		expect(mockMap.images.size).toBe(2);
		expect(rasterized.size).toBe(2);
		const source = Array.from(mockMap.sources.values())[0];
		expect((source.data as GeoJSON.FeatureCollection).features).toHaveLength(3);

		await renderer.update({
			markerContent: null,
			markerOffsetY: 0,
			markerScale: 1,
			points: [{ id: 3, lat: 52.7, lng: 13.6 }],
		});

		expect(mockMap.images.size).toBe(1);
		renderer.destroy();
		expect(mockMap.images.size).toBe(0);
	});

	test('rebuilds source, layer, and images after a style reset and routes click selection through rendered features', async () => {
		const { host } = createHost();
		const mockMap = createMockMap();
		let selectedLocationId: number | null = null;
		const renderer = createMarkerRenderer({
			host,
			map: mockMap.map as never,
			onLocationSelect: (locationId) => {
				selectedLocationId = locationId;
			},
			rasterizeSvgToImage: async (_svgMarkup, size) => ({
				width: size.width,
				height: size.height,
				data: new Uint8ClampedArray(size.width * size.height * 4),
			}),
		});

		await renderer.update({
			markerContent: null,
			markerOffsetY: 0,
			markerScale: 1,
			points: [{ id: 7, lat: 52.5, lng: 13.4 }],
		});

		mockMap.images.clear();
		mockMap.layers.clear();
		mockMap.sources.clear();
		await renderer.rebuild();

		expect(mockMap.images.size).toBe(1);
		expect(mockMap.layers.size).toBe(1);
		expect(mockMap.sources.size).toBe(1);

		mockMap.setFeatures([{ properties: { locationId: 7 } }]);
		expect(renderer.handleClick({ point: { x: 10, y: 20 } } as never)).toBe(true);
		expect(selectedLocationId).toBe(7);
	});
});
