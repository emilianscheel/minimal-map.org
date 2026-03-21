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
	const sources = new Map<
		string,
		{
			cluster?: boolean;
			clusterMaxZoom?: number;
			clusterRadius?: number;
			data: unknown;
			getClusterExpansionZoom: (clusterId: number) => Promise<number>;
			setData: (data: unknown) => void;
		}
	>();
	const layerFeatures = new Map<string, Array<{ geometry?: unknown; properties?: Record<string, unknown> }>>();
	let features: Array<{ geometry?: unknown; properties?: Record<string, unknown> }> = [];
	let styleLoaded = true;
	const clusterExpansionZooms = new Map<number, number>();
	const easeToCalls: Array<Record<string, unknown>> = [];

	return {
		easeToCalls,
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
			addSource(id: string, source: {
				cluster?: boolean;
				clusterMaxZoom?: number;
				clusterRadius?: number;
				data: unknown;
			}) {
				const nextSource = {
					cluster: source.cluster,
					clusterMaxZoom: source.clusterMaxZoom,
					clusterRadius: source.clusterRadius,
					data: source.data,
					getClusterExpansionZoom(clusterId: number) {
						return Promise.resolve(clusterExpansionZooms.get(clusterId) ?? 16);
					},
					setData(data: unknown) {
						nextSource.data = data;
					},
				};
				sources.set(id, nextSource);
				return this;
			},
			easeTo(options: Record<string, unknown>) {
				easeToCalls.push(options);
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
				return styleLoaded;
			},
			queryRenderedFeatures(_point?: unknown, options?: { layers?: string[] }) {
				if (options?.layers?.length) {
					return options.layers.flatMap((layerId) => layerFeatures.get(layerId) ?? []);
				}

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
		setClusterExpansionZoom(clusterId: number, zoom: number) {
			clusterExpansionZooms.set(clusterId, zoom);
		},
		setLayerFeatures(
			layerId: string,
			nextFeatures: Array<{ geometry?: unknown; properties?: Record<string, unknown> }>
		) {
			layerFeatures.set(layerId, nextFeatures);
		},
		setStyleLoaded(nextValue: boolean) {
			styleLoaded = nextValue;
		},
		sources,
	};
}

function waitFor(ms: number): Promise<void> {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
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
			clusterBackgroundColor: '#ffffff',
			clusterForegroundColor: '#000000',
			enableMarkerClustering: false,
			interactive: false,
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
			clusterBackgroundColor: '#ffffff',
			clusterForegroundColor: '#000000',
			enableMarkerClustering: false,
			interactive: false,
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
			clusterBackgroundColor: '#ffffff',
			clusterForegroundColor: '#000000',
			enableMarkerClustering: false,
			interactive: false,
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

		const markerLayer = Array.from(mockMap.layers.values())[0] as {
			id: string;
		};
		mockMap.setLayerFeatures(markerLayer.id, [{ properties: { locationId: 7 } }]);
		expect(renderer.handleClick({ point: { x: 10, y: 20 } } as never)).toBe(true);
		expect(selectedLocationId).toBe(7);
	});

	test('reads icon-offset from the feature property tuple for the marker layer layout', async () => {
		const { host } = createHost();
		const mockMap = createMockMap();
		const renderer = createMarkerRenderer({
			host,
			map: mockMap.map as never,
			rasterizeSvgToImage: async (_svgMarkup, size) => ({
				width: size.width,
				height: size.height,
				data: new Uint8ClampedArray(size.width * size.height * 4),
			}),
		});

		await renderer.update({
			clusterBackgroundColor: '#ffffff',
			clusterForegroundColor: '#000000',
			enableMarkerClustering: false,
			interactive: false,
			markerContent: null,
			markerOffsetY: 6,
			markerScale: 1,
			points: [{ id: 8, lat: 52.5, lng: 13.4 }],
		});

		const layer = Array.from(mockMap.layers.values())[0] as {
			layout: Record<string, unknown>;
		};
		expect(layer.layout['icon-offset']).toEqual(['get', 'iconOffset']);

		const source = Array.from(mockMap.sources.values())[0];
		const featureCollection = source.data as GeoJSON.FeatureCollection<GeoJSON.Point>;
		expect(featureCollection.features[0]?.properties).toMatchObject({
			iconOffset: [0, -8],
		});
	});

	test('retries marker sync after a transient style-not-ready window during image registration', async () => {
		const { host } = createHost();
		const mockMap = createMockMap();
		let rasterizeCalls = 0;
		const renderer = createMarkerRenderer({
			host,
			map: mockMap.map as never,
			rasterizeSvgToImage: async (_svgMarkup, size) => {
				rasterizeCalls += 1;
				mockMap.setStyleLoaded(false);

				return {
					width: size.width,
					height: size.height,
					data: new Uint8ClampedArray(size.width * size.height * 4),
				};
			},
		});

		await renderer.update({
			clusterBackgroundColor: '#ffffff',
			clusterForegroundColor: '#000000',
			enableMarkerClustering: false,
			interactive: false,
			markerContent: null,
			markerOffsetY: 0,
			markerScale: 1,
			points: [{ id: 11, lat: 52.5, lng: 13.4 }],
		});

		expect(mockMap.images.size).toBe(0);
		expect(mockMap.sources.size).toBe(0);

		mockMap.setStyleLoaded(true);
		await waitFor(60);

		expect(rasterizeCalls).toBe(1);
		expect(mockMap.images.size).toBe(1);
		expect(mockMap.layers.size).toBe(1);
		expect(mockMap.sources.size).toBe(1);

		const source = Array.from(mockMap.sources.values())[0];
		expect((source.data as GeoJSON.FeatureCollection).features).toHaveLength(1);
	});

	test('creates clustered layers on interactive maps and zooms into a clicked cluster', async () => {
		const { host } = createHost();
		const mockMap = createMockMap();
		const renderer = createMarkerRenderer({
			host,
			map: mockMap.map as never,
			rasterizeSvgToImage: async (_svgMarkup, size) => ({
				width: size.width,
				height: size.height,
				data: new Uint8ClampedArray(size.width * size.height * 4),
			}),
		});

		await renderer.update({
			clusterBackgroundColor: '#ffffff',
			clusterForegroundColor: '#000000',
			enableMarkerClustering: true,
			interactive: true,
			markerContent: null,
			markerOffsetY: 0,
			markerScale: 1,
			points: [
				{ id: 21, lat: 52.5, lng: 13.4 },
				{ id: 22, lat: 52.5004, lng: 13.4004 },
				{ id: 23, lat: 52.5008, lng: 13.4008 },
			],
		});

		const source = Array.from(mockMap.sources.values())[0];
		expect(source.cluster).toBe(true);
		expect(source.clusterRadius).toBe(50);
		expect(source.clusterMaxZoom).toBe(14);
		expect(mockMap.layers.size).toBe(3);

		const clusterCountLayer = Array.from(mockMap.layers.values()).find(
			(layer) => layer.id?.toString().includes('clusters-count-layer')
		) as { id: string } | undefined;
		expect(clusterCountLayer).toBeDefined();

		mockMap.setClusterExpansionZoom(123, 12);
		mockMap.setLayerFeatures(clusterCountLayer?.id ?? '', [
			{
				geometry: {
					type: 'Point',
					coordinates: [13.4, 52.5],
				},
				properties: {
					cluster: true,
					cluster_id: 123,
				},
			},
		]);

		expect(renderer.handleClick({ point: { x: 10, y: 20 } } as never)).toBe(true);
		await Promise.resolve();

		expect(mockMap.easeToCalls).toEqual([
			{
				center: [13.4, 52.5],
				duration: 180,
				essential: true,
				zoom: 12,
			},
		]);
	});

	test('keeps multi-point maps on the existing non-clustered marker layer when clustering is disabled', async () => {
		const { host } = createHost();
		const mockMap = createMockMap();
		const renderer = createMarkerRenderer({
			host,
			map: mockMap.map as never,
			rasterizeSvgToImage: async (_svgMarkup, size) => ({
				width: size.width,
				height: size.height,
				data: new Uint8ClampedArray(size.width * size.height * 4),
			}),
		});

		await renderer.update({
			clusterBackgroundColor: '#ffffff',
			clusterForegroundColor: '#000000',
			enableMarkerClustering: false,
			interactive: true,
			markerContent: null,
			markerOffsetY: 0,
			markerScale: 1,
			points: [
				{ id: 31, lat: 52.5, lng: 13.4 },
				{ id: 32, lat: 52.5004, lng: 13.4004 },
			],
		});

		const source = Array.from(mockMap.sources.values())[0];
		const layer = Array.from(mockMap.layers.values())[0] as Record<string, unknown>;
		expect(source.cluster).toBe(false);
		expect(mockMap.layers.size).toBe(1);
		expect('filter' in layer).toBe(false);
	});

	test('rebuilds the full clustered layer group after a style reset', async () => {
		const { host } = createHost();
		const mockMap = createMockMap();
		const renderer = createMarkerRenderer({
			host,
			map: mockMap.map as never,
			rasterizeSvgToImage: async (_svgMarkup, size) => ({
				width: size.width,
				height: size.height,
				data: new Uint8ClampedArray(size.width * size.height * 4),
			}),
		});

		await renderer.update({
			clusterBackgroundColor: '#ffffff',
			clusterForegroundColor: '#000000',
			enableMarkerClustering: true,
			interactive: true,
			markerContent: null,
			markerOffsetY: 0,
			markerScale: 1,
			points: [
				{ id: 41, lat: 52.5, lng: 13.4 },
				{ id: 42, lat: 52.5004, lng: 13.4004 },
				{ id: 43, lat: 52.5008, lng: 13.4008 },
			],
		});

		mockMap.layers.clear();
		mockMap.sources.clear();
		await renderer.rebuild();

		const source = Array.from(mockMap.sources.values())[0];
		expect(source.cluster).toBe(true);
		expect(mockMap.layers.size).toBe(3);
	});
});
