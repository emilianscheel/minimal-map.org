import type { GeoJSONSource, Map as MapLibreMap, MapMouseEvent } from 'maplibre-gl';
import type { MapLocationPoint, NormalizedMapConfig } from '../types';
import { getMapDomContext, type MapDomContext } from './dom-context';
import { darkenColor, lightenColor } from '../lib/colors';

const CUSTOM_MARKER_ICON_SIZE = {
	width: 32,
	height: 32,
};

const DEFAULT_MARKER_ICON_SIZE = {
	width: 27,
	height: 41,
};

const DEFAULT_MARKER_OFFSET_Y = -14;
const MARKER_SYNC_RETRY_DELAY_MS = 32;
const CLUSTER_RADIUS = 50;
const CLUSTER_MAX_ZOOM = 14;
const CLUSTER_SMALL_RADIUS = 28;
const CLUSTER_MEDIUM_RADIUS = 34;
const CLUSTER_LARGE_RADIUS = 40;
const CLUSTER_TEXT_SIZE = 12;
const EMPTY_FEATURE_COLLECTION = {
	type: 'FeatureCollection',
	features: [],
} as GeoJSON.FeatureCollection<GeoJSON.Point>;

const DEFAULT_MARKER_SHADOW_ELLIPSES = [
	{ rx: '10.5', ry: '5.25002273' },
	{ rx: '10.5', ry: '5.25002273' },
	{ rx: '9.5', ry: '4.77275007' },
	{ rx: '8.5', ry: '4.29549936' },
	{ rx: '7.5', ry: '3.81822308' },
	{ rx: '6.5', ry: '3.34094679' },
	{ rx: '5.5', ry: '2.86367051' },
	{ rx: '4.5', ry: '2.38636864' },
];

export interface RasterizedMarkerImage {
	width: number;
	height: number;
	data: Uint8ClampedArray;
}

export interface MarkerRendererConfig
	extends Pick<
		NormalizedMapConfig,
		| 'interactive'
		| 'clusterBackgroundColor'
		| 'clusterForegroundColor'
		| 'markerContent'
		| 'markerOffsetY'
		| 'markerScale'
	> {
	points: MapLocationPoint[];
}

export interface MarkerRenderer {
	destroy: () => void;
	handleClick: (event: Pick<MapMouseEvent, 'point'>) => boolean;
	rebuild: () => Promise<void>;
	update: (config: MarkerRendererConfig) => Promise<void>;
}

export interface CreateMarkerRendererOptions {
	host: HTMLElement;
	map: Pick<
		MapLibreMap,
		| 'addImage'
		| 'addLayer'
		| 'addSource'
		| 'easeTo'
		| 'getLayer'
		| 'getSource'
		| 'hasImage'
		| 'isStyleLoaded'
		| 'queryRenderedFeatures'
		| 'removeImage'
		| 'removeLayer'
		| 'removeSource'
	>;
	onLocationSelect?: (locationId: number) => void;
	rasterizeSvgToImage?: (
		svgMarkup: string,
		size: { height: number; width: number },
		context: MapDomContext
	) => Promise<RasterizedMarkerImage>;
}

interface MarkerFeatureProperties {
	iconId: string;
	iconOffset: [number, number];
	iconScale: number;
	locationId: number | null;
}

interface MarkerIconSpec {
	id: string;
	height: number;
	key: string;
	offsetY: number;
	svgMarkup: string;
	width: number;
}

interface MarkerRenderData {
	clusterBackgroundColor: string;
	clusterForegroundColor: string;
	clusterEnabled: boolean;
	featureCollection: GeoJSON.FeatureCollection<GeoJSON.Point>;
	icons: Map<string, MarkerIconSpec>;
}

interface MarkerFeaturePoint extends MapLocationPoint {
	markerContent?: string;
	marker_color?: string;
}

let markerRendererCount = 0;

function createDefaultMarkerSvg(color = '#3FB1CE'): string {
	const borderColor = darkenColor(color, 20);
	const innerColor = lightenColor(color, 80);

	const shadowEllipses = DEFAULT_MARKER_SHADOW_ELLIPSES.map(
		({ rx, ry }) =>
			`<ellipse opacity="0.04" cx="10.5" cy="5.80029008" rx="${rx}" ry="${ry}" />`
	).join('');

	return `
<svg xmlns="http://www.w3.org/2000/svg" display="block" width="27" height="41" viewBox="0 0 27 41" aria-hidden="true" focusable="false">
	<g fill="none" fill-rule="evenodd">
		<g fill-rule="nonzero">
			<g transform="translate(3 29)" fill="#000000">
				${shadowEllipses}
			</g>
			<g fill="${color}">
				<path d="M27,13.5 C27,19.074644 20.250001,27.000002 14.75,34.500002 C14.016665,35.500004 12.983335,35.500004 12.25,34.500002 C6.7499993,27.000002 0,19.222562 0,13.5 C0,6.0441559 6.0441559,0 13.5,0 C20.955844,0 27,6.0441559 27,13.5 Z" />
			</g>
			<g opacity="0.25" fill="${borderColor}">
				<path d="M13.5,0 C6.0441559,0 0,6.0441559 0,13.5 C0,19.222562 6.7499993,27 12.25,34.5 C13,35.522727 14.016664,35.500004 14.75,34.5 C20.250001,27 27,19.074644 27,13.5 C27,6.0441559 20.955844,0 13.5,0 Z M13.5,1 C20.415404,1 26,6.584596 26,13.5 C26,15.898657 24.495584,19.181431 22.220703,22.738281 C19.945823,26.295132 16.705119,30.142167 13.943359,33.908203 C13.743445,34.180814 13.612715,34.322738 13.5,34.441406 C13.387285,34.322738 13.256555,34.180814 13.056641,33.908203 C10.284481,30.127985 7.4148684,26.314159 5.015625,22.773438 C2.6163816,19.232715 1,15.953538 1,13.5 C1,6.584596 6.584596,1 13.5,1 Z" />
			</g>
			<g transform="translate(8 8)">
				<circle fill="#000000" opacity="0.25" cx="5.5" cy="5.5" r="5.4999962" />
				<circle fill="${innerColor}" cx="5.5" cy="5.5" r="5.4999962" />
			</g>
		</g>
	</g>
</svg>`.trim();
}

function hashString(value: string): string {
	let hash = 2166136261;

	for (let index = 0; index < value.length; index += 1) {
		hash ^= value.charCodeAt(index);
		hash = Math.imul(hash, 16777619);
	}

	return (hash >>> 0).toString(36);
}

function getPointMarkerContent(
	defaultMarkerContent: string | null,
	point: MarkerFeaturePoint
): string | null {
	if (typeof point.markerContent === 'string' && point.markerContent.trim() !== '') {
		return point.markerContent;
	}

	return defaultMarkerContent;
}

function getMarkerIconSpec(
	markerContent: string | null,
	markerColor = '#3FB1CE'
): MarkerIconSpec {
	if (typeof markerContent === 'string' && markerContent.trim().startsWith('<svg')) {
		const svgMarkup = markerContent.trim();
		const hash = hashString(svgMarkup);

		return {
			id: `minimal-map-marker-${hash}`,
			height: CUSTOM_MARKER_ICON_SIZE.height,
			key: `custom:${hash}`,
			offsetY: 0,
			svgMarkup,
			width: CUSTOM_MARKER_ICON_SIZE.width,
		};
	}

	const color = markerColor || '#3FB1CE';
	const key = `default:${color}`;

	return {
		id: `minimal-map-marker-default-${color.replace('#', '')}`,
		height: DEFAULT_MARKER_ICON_SIZE.height,
		key,
		offsetY: DEFAULT_MARKER_OFFSET_Y,
		svgMarkup: createDefaultMarkerSvg(color),
		width: DEFAULT_MARKER_ICON_SIZE.width,
	};
}

function buildMarkerRenderData(config: MarkerRendererConfig): MarkerRenderData {
	const icons = new Map<string, MarkerIconSpec>();
	const clusterEnabled =
		config.interactive !== false && config.points.length > 1;

	const features = config.points.map((point) => {
		const iconSpec = getMarkerIconSpec(
			getPointMarkerContent(config.markerContent, point),
			point.marker_color
		);
		const featureProperties: MarkerFeatureProperties = {
			iconId: iconSpec.id,
			iconOffset: [0, iconSpec.offsetY + config.markerOffsetY],
			iconScale: config.markerScale,
			locationId: typeof point.id === 'number' ? point.id : null,
		};

		icons.set(iconSpec.key, iconSpec);

		return {
			type: 'Feature',
			geometry: {
				type: 'Point',
				coordinates: [point.lng, point.lat],
			},
			properties: featureProperties,
		};
	});

	return {
		clusterBackgroundColor:
			config.clusterBackgroundColor || '#ffffff',
		clusterForegroundColor:
			config.clusterForegroundColor || '#000000',
		clusterEnabled,
		featureCollection: {
			type: 'FeatureCollection',
			features,
		} as GeoJSON.FeatureCollection<GeoJSON.Point>,
		icons,
	};
}

async function loadSvgImage(
	svgMarkup: string,
	context: MapDomContext
): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const image = new context.win.Image();
		const blob = new context.win.Blob([svgMarkup], {
			type: 'image/svg+xml;charset=utf-8',
		});
		const objectUrl = context.win.URL.createObjectURL(blob);

		image.onload = () => {
			context.win.URL.revokeObjectURL(objectUrl);
			resolve(image);
		};
		image.onerror = () => {
			context.win.URL.revokeObjectURL(objectUrl);
			reject(new Error('Failed to load SVG marker image.'));
		};
		image.src = objectUrl;
	});
}

export async function rasterizeSvgToImageData(
	svgMarkup: string,
	size: { height: number; width: number },
	context: MapDomContext
): Promise<RasterizedMarkerImage> {
	const canvas = context.doc.createElement('canvas');
	canvas.width = size.width;
	canvas.height = size.height;

	const drawingContext = canvas.getContext('2d', {
		willReadFrequently: true,
	});

	if (!drawingContext) {
		throw new Error('Failed to create canvas rendering context for map marker.');
	}

	const image = await loadSvgImage(svgMarkup, context);
	drawingContext.clearRect(0, 0, size.width, size.height);
	drawingContext.drawImage(image, 0, 0, size.width, size.height);

	return {
		width: size.width,
		height: size.height,
		data: drawingContext.getImageData(0, 0, size.width, size.height).data,
	};
}

export function createMarkerRenderer({
	host,
	map,
	onLocationSelect,
	rasterizeSvgToImage = rasterizeSvgToImageData,
}: CreateMarkerRendererOptions): MarkerRenderer {
	const context = getMapDomContext(host);
	const instanceId = ++markerRendererCount;
	const sourceId = `minimal-map-markers-source-${instanceId}`;
	const clusterFillLayerId = `minimal-map-marker-clusters-fill-layer-${instanceId}`;
	const clusterCountLayerId = `minimal-map-marker-clusters-count-layer-${instanceId}`;
	const markerLayerId = `minimal-map-markers-layer-${instanceId}`;
	const emptyConfig: MarkerRendererConfig = {
		clusterBackgroundColor: '#ffffff',
		clusterForegroundColor: '#000000',
		interactive: true,
		markerContent: null,
		markerOffsetY: 0,
		markerScale: 1,
		points: [],
	};
	let currentConfig = emptyConfig;
	let destroyed = false;
	let revision = 0;
	let activeIcons = new Map<string, MarkerIconSpec>();
	const rasterizedImages = new Map<string, Promise<RasterizedMarkerImage>>();
	let pendingRetryTimeout: number | null = null;
	let currentClusterBackgroundColor = emptyConfig.clusterBackgroundColor;
	let currentClusterForegroundColor = emptyConfig.clusterForegroundColor;
	let currentClusteringEnabled = false;

	function getSource(): GeoJSONSource | null {
		return (map.getSource(sourceId) as GeoJSONSource | undefined) ?? null;
	}

	function getClusterRadiusExpression(): [string, string, number, number, number, number, number] {
		return [
			'step',
			['get', 'point_count'],
			CLUSTER_SMALL_RADIUS,
			10,
			CLUSTER_MEDIUM_RADIUS,
			50,
			CLUSTER_LARGE_RADIUS,
		];
	}

	function clearLayers(): void {
		[
			markerLayerId,
			clusterCountLayerId,
			clusterFillLayerId,
		].forEach((candidateLayerId) => {
			if (map.getLayer(candidateLayerId)) {
				map.removeLayer(candidateLayerId);
			}
		});
	}

	function ensureSource(clusterEnabled: boolean): GeoJSONSource {
		const existingSource = getSource();

		if (existingSource) {
			if (currentClusteringEnabled === clusterEnabled) {
				return existingSource;
			}

			clearLayers();
			map.removeSource(sourceId);
		}

		map.addSource(sourceId, {
			cluster: clusterEnabled,
			clusterMaxZoom: CLUSTER_MAX_ZOOM,
			clusterRadius: CLUSTER_RADIUS,
			type: 'geojson',
			data: EMPTY_FEATURE_COLLECTION,
		});
		currentClusteringEnabled = clusterEnabled;

		return getSource() as GeoJSONSource;
	}

	function ensureClusterLayers(renderData: MarkerRenderData): void {
		if (!renderData.clusterEnabled) {
			return;
		}

		const clusterRadiusExpression = getClusterRadiusExpression();

		if (!map.getLayer(clusterFillLayerId)) {
			map.addLayer({
				id: clusterFillLayerId,
				type: 'circle',
				source: sourceId,
				filter: ['has', 'point_count'] as never,
				paint: {
					'circle-color': renderData.clusterBackgroundColor,
					'circle-radius': clusterRadiusExpression as never,
				},
			});
		}

		if (!map.getLayer(clusterCountLayerId)) {
			map.addLayer({
				id: clusterCountLayerId,
				type: 'symbol',
				source: sourceId,
				filter: ['has', 'point_count'] as never,
				layout: {
					'text-allow-overlap': true,
					'text-field': ['get', 'point_count_abbreviated'] as never,
					'text-ignore-placement': true,
					'text-size': CLUSTER_TEXT_SIZE,
				},
				paint: {
					'text-color': renderData.clusterForegroundColor,
				},
			});
		}
	}

	function ensureMarkerLayer(clusterEnabled: boolean): void {
		if (map.getLayer(markerLayerId)) {
			return;
		}

		map.addLayer({
			id: markerLayerId,
			type: 'symbol',
			source: sourceId,
			filter: clusterEnabled ? ['!', ['has', 'point_count']] as never : undefined,
			layout: {
				'icon-image': ['get', 'iconId'] as never,
				'icon-size': ['get', 'iconScale'] as never,
				'icon-offset': ['get', 'iconOffset'] as never,
				'icon-anchor': 'center',
				'icon-allow-overlap': true,
				'icon-ignore-placement': true,
			},
		});
	}

	function clearSourceAndLayer(): void {
		clearLayers();

		if (getSource()) {
			map.removeSource(sourceId);
		}

		currentClusteringEnabled = false;
	}

	function clearImages(): void {
		activeIcons.forEach((iconSpec) => {
			if (map.hasImage(iconSpec.id)) {
				map.removeImage(iconSpec.id);
			}
		});
		activeIcons.clear();
		rasterizedImages.clear();
	}

	function clearPendingRetry(): void {
		if (pendingRetryTimeout === null) {
			return;
		}

		context.win.clearTimeout(pendingRetryTimeout);
		pendingRetryTimeout = null;
	}

	function scheduleRetry(currentRevision: number): void {
		if (destroyed || currentRevision !== revision || pendingRetryTimeout !== null) {
			return;
		}

		pendingRetryTimeout = context.win.setTimeout(() => {
			pendingRetryTimeout = null;

			if (destroyed || currentRevision !== revision) {
				return;
			}

			void sync(currentConfig, currentRevision);
		}, MARKER_SYNC_RETRY_DELAY_MS);
	}

	function pruneUnusedIcons(nextIcons: Map<string, MarkerIconSpec>): void {
		activeIcons.forEach((iconSpec, key) => {
			if (nextIcons.has(key)) {
				return;
			}

			if (map.hasImage(iconSpec.id)) {
				map.removeImage(iconSpec.id);
			}

			activeIcons.delete(key);
			rasterizedImages.delete(key);
		});
	}

	async function resolveIconImage(iconSpec: MarkerIconSpec): Promise<RasterizedMarkerImage> {
		if (!rasterizedImages.has(iconSpec.key)) {
			rasterizedImages.set(
				iconSpec.key,
				rasterizeSvgToImage(
					iconSpec.svgMarkup,
					{
						width: iconSpec.width,
						height: iconSpec.height,
					},
					context
				).catch(async () => {
					const fallbackSpec = getMarkerIconSpec(null);
					return rasterizeSvgToImage(
						fallbackSpec.svgMarkup,
						{
							width: fallbackSpec.width,
							height: fallbackSpec.height,
						},
						context
					);
				})
			);
		}

		return rasterizedImages.get(iconSpec.key) as Promise<RasterizedMarkerImage>;
	}

	async function ensureImages(
		icons: Map<string, MarkerIconSpec>,
		currentRevision: number
	): Promise<boolean> {
		let allImagesAvailable = true;

		await Promise.all(
			Array.from(icons.values()).map(async (iconSpec) => {
				if (destroyed || currentRevision !== revision) {
					return;
				}

				activeIcons.set(iconSpec.key, iconSpec);

				try {
					if (map.hasImage(iconSpec.id)) {
						return;
					}

					const image = await resolveIconImage(iconSpec);

					if (destroyed || currentRevision !== revision) {
						return;
					}

					if (map.hasImage(iconSpec.id)) {
						return;
					}

					if (!map.isStyleLoaded()) {
						allImagesAvailable = false;
						return;
					}

					map.addImage(iconSpec.id, image);
				} catch (error) {
					allImagesAvailable = false;

					// Silently fail if map is not ready or image already exists
					// The next sync or rebuild will try again
					if (process.env.NODE_ENV === 'development') {
						console.warn('Failed to add map marker image', iconSpec.id, error);
					}
				}
			})
		);

		if (destroyed || currentRevision !== revision) {
			return false;
		}

		return (
			allImagesAvailable &&
			Array.from(icons.values()).every((iconSpec) => map.hasImage(iconSpec.id))
		);
	}

	async function sync(nextConfig: MarkerRendererConfig, currentRevision: number): Promise<void> {
		currentConfig = nextConfig;
		clearPendingRetry();

		if (!map.isStyleLoaded()) {
			scheduleRetry(currentRevision);
			return;
		}

		if (nextConfig.points.length === 0) {
			try {
				clearSourceAndLayer();
				pruneUnusedIcons(new Map());
			} catch {
				// Style might have changed
			}
			return;
		}

		const renderData = buildMarkerRenderData(nextConfig);
		const didClusterPresentationChange =
			currentClusteringEnabled !== renderData.clusterEnabled ||
			currentClusterBackgroundColor !== renderData.clusterBackgroundColor ||
			currentClusterForegroundColor !== renderData.clusterForegroundColor;

		if (didClusterPresentationChange) {
			try {
				clearSourceAndLayer();
			} catch {
				// Style might have changed
			}
		}

		currentClusterBackgroundColor = renderData.clusterBackgroundColor;
		currentClusterForegroundColor = renderData.clusterForegroundColor;

		try {
			pruneUnusedIcons(renderData.icons);
		} catch {
			// Style might have changed
		}

		try {
			const imagesReady = await ensureImages(renderData.icons, currentRevision);

			if (!imagesReady) {
				scheduleRetry(currentRevision);
				return;
			}
		} catch (error) {
			if (process.env.NODE_ENV === 'development') {
				console.error('Failed to ensure map marker images', error);
			}

			scheduleRetry(currentRevision);
			return;
		}

		if (destroyed || currentRevision !== revision || !map.isStyleLoaded()) {
			scheduleRetry(currentRevision);
			return;
		}

		try {
			const source = ensureSource(renderData.clusterEnabled);
			ensureClusterLayers(renderData);
			ensureMarkerLayer(renderData.clusterEnabled);
			source.setData(renderData.featureCollection);
		} catch (error) {
			if (process.env.NODE_ENV === 'development') {
				console.error('Failed to sync map marker source/layer', error);
			}

			scheduleRetry(currentRevision);
		}
	}

	return {
		destroy() {
			destroyed = true;
			revision += 1;
			clearPendingRetry();
			clearSourceAndLayer();
			clearImages();
		},
		handleClick(event) {
			const clusterFeature = map
				.queryRenderedFeatures(event.point, {
					layers: [clusterCountLayerId, clusterFillLayerId],
				})
				.find(
					(candidate) =>
						candidate.properties?.cluster === true ||
						candidate.properties?.cluster === 'true' ||
						typeof candidate.properties?.cluster_id !== 'undefined'
				);

			if (clusterFeature) {
				const coordinates = (clusterFeature.geometry as GeoJSON.Point | undefined)
					?.coordinates;
				const clusterId = Number(clusterFeature.properties?.cluster_id);
				const source = getSource();

				if (
					Array.isArray(coordinates) &&
					coordinates.length >= 2 &&
					Number.isInteger(clusterId) &&
					source &&
					typeof source.getClusterExpansionZoom === 'function'
				) {
					void source.getClusterExpansionZoom(clusterId)
						.then((zoom) => {
							if (destroyed) {
								return;
							}

							map.easeTo({
								center: [Number(coordinates[0]), Number(coordinates[1])],
								duration: 180,
								essential: true,
								zoom,
							});
						})
						.catch((error) => {
							if (process.env.NODE_ENV === 'development') {
								console.warn('Failed to zoom to cluster expansion', error);
							}
						});
				}

				return true;
			}

			if (!map.getLayer(markerLayerId)) {
				return false;
			}

			const feature = map
				.queryRenderedFeatures(event.point, {
					layers: [markerLayerId],
				})
				.find((candidate) => candidate.properties?.locationId !== null);

			if (!feature) {
				return false;
			}

			const locationId = Number(feature.properties?.locationId);

			if (!Number.isInteger(locationId) || locationId <= 0) {
				return false;
			}

			onLocationSelect?.(locationId);
			return true;
		},
		async rebuild() {
			const currentRevision = ++revision;
			await sync(currentConfig, currentRevision);
		},
		async update(nextConfig) {
			const currentRevision = ++revision;
			await sync(nextConfig, currentRevision);
		},
	};
}
