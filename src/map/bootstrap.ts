import maplibregl, { LngLatBounds, type Map as MapLibreMap } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { createAttributionPill } from './attribution-pill';
import { normalizeMapConfig } from './defaults';
import { applyStyleTheme } from '../lib/styles/themeEngine';
import { createWordPressZoomControls } from './wp-controls';
import { createWordPressSearchControl } from './SearchControl';
import type {
	MapRuntimeConfig,
	MapLocationPoint,
	MinimalMapInstance,
	NormalizedMapConfig,
	RawMapConfig,
	WordPressAttributionControl,
	WordPressZoomControls,
	WordPressSearchControl,
} from '../types';

interface MinimalMapState {
	attribution: WordPressAttributionControl | null;
	config: NormalizedMapConfig | null;
	controls: WordPressZoomControls | null;
	searchControl: WordPressSearchControl | null;
	selectedLocationId: number | null;
	map: MapLibreMap | null;
	markers: maplibregl.Marker[];
	observer: ResizeObserver | null;
}

function canCreateWebGLContext(): boolean {
	if (typeof window === 'undefined' || typeof document === 'undefined') {
		return false;
	}

	const canvas = document.createElement('canvas');

	return Boolean(
		canvas.getContext('webgl2') ||
		canvas.getContext('webgl') ||
		canvas.getContext('experimental-webgl')
	);
}

function createFallback(host: HTMLElement, message: string): void {
	host.innerHTML = '';
	const notice = document.createElement('div');
	const content = document.createElement('div');
	const paragraph = document.createElement('p');

	notice.className = 'components-notice is-warning minimal-map-fallback';
	content.className = 'components-notice__content';
	paragraph.textContent = message;
	content.appendChild(paragraph);
	notice.appendChild(content);
	host.appendChild(notice);
}

function createShell(host: HTMLElement, config: NormalizedMapConfig): HTMLElement {
	host.innerHTML = '';
	host.classList.add('minimal-map-runtime');
	host.style.height = config.heightCssValue;

	const viewport = document.createElement('div');
	viewport.className = 'minimal-map-runtime__viewport';
	host.appendChild(viewport);

	return viewport;
}

function createMarker(
	config: NormalizedMapConfig, 
	point: MapLocationPoint,
	onClick?: (id: number) => void
): maplibregl.Marker {
	const options: maplibregl.MarkerOptions = {
		offset: [ 0, config.markerOffsetY ],
		anchor: 'center',
	};

	if (config.markerContent) {
		const el = document.createElement('div');
		el.className = 'minimal-map-custom-marker';
		
		// Create inner wrapper for transform-based centering
		const inner = document.createElement('div');
		inner.innerHTML = config.markerContent;
		el.appendChild(inner);

		// Ensure MapLibre sees zero size for absolute coordinate alignment
		el.style.width = '0';
		el.style.height = '0';
		options.element = el;
	}

	const marker = new maplibregl.Marker(options).setLngLat([ point.lng, point.lat ]);

	if (config.markerClassName) {
		marker.getElement().classList.add(...config.markerClassName.split(/\s+/).filter(Boolean));
	}

	if (point.id && onClick) {
		marker.getElement().style.cursor = 'pointer';
		marker.getElement().addEventListener('click', () => onClick(point.id as number));
	}

	return marker;
}

function didZoomControlsStyleChange(
	previousConfig: NormalizedMapConfig | null,
	nextConfig: NormalizedMapConfig
): boolean {
	if (!previousConfig) {
		return true;
	}

	return (
		previousConfig.zoomControlsPosition !== nextConfig.zoomControlsPosition ||
		previousConfig.zoomControlsBackgroundColor !== nextConfig.zoomControlsBackgroundColor ||
		previousConfig.zoomControlsIconColor !== nextConfig.zoomControlsIconColor ||
		previousConfig.zoomControlsBorderRadius !== nextConfig.zoomControlsBorderRadius ||
		previousConfig.zoomControlsBorderColor !== nextConfig.zoomControlsBorderColor ||
		previousConfig.zoomControlsBorderWidth !== nextConfig.zoomControlsBorderWidth ||
		previousConfig.zoomControlsPlusIcon !== nextConfig.zoomControlsPlusIcon ||
		previousConfig.zoomControlsMinusIcon !== nextConfig.zoomControlsMinusIcon ||
		previousConfig.zoomControlsPadding.top !== nextConfig.zoomControlsPadding.top ||
		previousConfig.zoomControlsPadding.right !== nextConfig.zoomControlsPadding.right ||
		previousConfig.zoomControlsPadding.bottom !== nextConfig.zoomControlsPadding.bottom ||
		previousConfig.zoomControlsPadding.left !== nextConfig.zoomControlsPadding.left ||
		previousConfig.zoomControlsOuterMargin.top !== nextConfig.zoomControlsOuterMargin.top ||
		previousConfig.zoomControlsOuterMargin.right !== nextConfig.zoomControlsOuterMargin.right ||
		previousConfig.zoomControlsOuterMargin.bottom !== nextConfig.zoomControlsOuterMargin.bottom ||
		previousConfig.zoomControlsOuterMargin.left !== nextConfig.zoomControlsOuterMargin.left
	);
}

function syncCenter(
	map: MapLibreMap,
	config: NormalizedMapConfig,
	zoomChanged = false
): void {
	const target = {
		center: [ config.centerLng, config.centerLat ] as [ number, number ],
		offset: [ 0, config.centerOffsetY ] as [ number, number ],
	};

	if (zoomChanged) {
		map.easeTo({
			...target,
			duration: 180,
			essential: true,
			zoom: config.zoom,
		}, { isMinimalMapInternal: true });
		return;
	}

	map.jumpTo(target, { isMinimalMapInternal: true });
}

function getRenderedPoints(config: NormalizedMapConfig): MapLocationPoint[] {
	if (config.locations.length > 0) {
		return config.locations;
	}

	if (config.markerLat === null || config.markerLng === null) {
		return [];
	}

	return [
		{
			lat: config.markerLat,
			lng: config.markerLng,
		},
	];
}

function didRenderedPointsChange(
	previousConfig: NormalizedMapConfig | null,
	nextConfig: NormalizedMapConfig
): boolean {
	const previousPoints = previousConfig ? getRenderedPoints(previousConfig) : [];
	const nextPoints = getRenderedPoints(nextConfig);

	if (previousPoints.length !== nextPoints.length) {
		return true;
	}

	return previousPoints.some((point, index) => {
		const nextPoint = nextPoints[index];

		return point.lat !== nextPoint.lat || point.lng !== nextPoint.lng;
	});
}

function syncViewport(
	map: MapLibreMap,
	config: NormalizedMapConfig,
	zoomChanged = false
): void {
	const points = getRenderedPoints(config);

	if (points.length === 0) {
		syncCenter(map, config, zoomChanged);
		return;
	}

	if (points.length === 1) {
		const [point] = points;
		map.easeTo({
			center: [point.lng, point.lat],
			duration: 180,
			essential: true,
			offset: [0, config.centerOffsetY],
			zoom: config.zoom,
		}, { isMinimalMapInternal: true });
		return;
	}

	const bounds = points.reduce(
		(currentBounds, point) => currentBounds.extend([point.lng, point.lat]),
		new LngLatBounds([points[0].lng, points[0].lat], [points[0].lng, points[0].lat])
	);

	map.fitBounds(bounds, {
		duration: 180,
		essential: true,
		padding: 48,
	}, { isMinimalMapInternal: true });
}

export function createMinimalMap(
	host: HTMLElement,
	initialConfig: RawMapConfig = {},
	runtimeConfig: MapRuntimeConfig = {}
): MinimalMapInstance {
	const state: MinimalMapState = {
		attribution: null,
		config: null,
		controls: null,
		searchControl: null,
		selectedLocationId: null,
		map: null,
		markers: [],
		observer: null,
	};

	function syncMarkers(config: NormalizedMapConfig, forceRecreate = false): void {
		if (!state.map) {
			return;
		}

		const points = getRenderedPoints(config);

		if (forceRecreate || points.length === 0) {
			state.markers.forEach((marker) => marker.remove());
			state.markers = [];
		}

		if (points.length === 0) {
			return;
		}

		const onMarkerClick = (id: number) => {
			const point = points.find(p => p.id === id);
			if (point && state.map) {
				state.selectedLocationId = id;
				state.map.easeTo({
					center: [point.lng, point.lat],
					zoom: Math.max(state.map.getZoom(), 15),
					padding: { left: config.allowSearch ? 368 : 0, top: 0, right: 0, bottom: 0 },
					essential: true
				}, { isMinimalMapInternal: true });
				if (state.searchControl) {
					state.searchControl.update(config, id);
				}
			}
		};

		state.markers = points.map((point) => 
			createMarker(config, point, onMarkerClick).addTo(state.map as MapLibreMap)
		);
	}

	function setupUserInteractionListeners(map: MapLibreMap): void {
		const clearSelection = (event: any) => {
			if (event.isMinimalMapInternal) {
				return;
			}

			if (state.selectedLocationId) {
				state.selectedLocationId = null;
				if (state.config) {
					state.searchControl?.update(state.config, undefined);
				}
			}
		};

		map.on('movestart', clearSelection);
		map.on('zoomstart', clearSelection);
	}

	function syncControls(config: NormalizedMapConfig): void {
		state.controls?.destroy();
		state.controls = null;

		if (config.showZoomControls && state.map) {
			state.controls = createWordPressZoomControls(host, state.map, config);
		}
	}

	function syncSearch(config: NormalizedMapConfig): void {
		if (config.allowSearch && config.locations.length > 0 && state.map) {
			if (!state.searchControl) {
				state.searchControl = createWordPressSearchControl(
					host, 
					state.map, 
					config, 
					state.selectedLocationId ?? undefined,
					(location) => {
						if (location.id) {
							state.selectedLocationId = location.id;
						}
					}
				);
			} else {
				state.searchControl.update(config, state.selectedLocationId ?? undefined);
			}
		} else {
			state.searchControl?.destroy();
			state.searchControl = null;
		}
	}

	function syncAttribution(config: NormalizedMapConfig): void {
		state.attribution?.destroy();
		state.attribution = null;

		if (config.showAttribution) {
			state.attribution = createAttributionPill(host);
		}
	}

	function build(rawConfig: RawMapConfig): void {
		const config = normalizeMapConfig(rawConfig, runtimeConfig);
		state.config = config;
		const viewport = createShell(host, config);

		if (!canCreateWebGLContext()) {
			createFallback(host, config.fallbackMessage);
			return;
		}

		try {
			state.map = new maplibregl.Map({
				attributionControl: false,
				boxZoom: config.interactive,
				center: [ config.centerLng, config.centerLat ],
				container: viewport,
				doubleClickZoom: config.interactive,
				dragPan: config.interactive,
				dragRotate: config.interactive,
				keyboard: config.interactive,
				scrollZoom: config.scrollZoom,
				style: config.styleUrl,
				touchZoomRotate: config.interactive,
				zoom: config.zoom,
			});
		} catch {
			createFallback(host, config.fallbackMessage);
			return;
		}

		const map = state.map;

		if (!config.interactive) {
			map.boxZoom.disable();
			map.doubleClickZoom.disable();
			map.dragPan.disable();
			map.dragRotate.disable();
			map.keyboard.disable();
			map.touchZoomRotate.disable();
		}
		map.on('load', () => {
			syncViewport(map, config);
			map.resize();

			if (config.styleTheme) {
				try {
					applyStyleTheme(map, config.styleTheme, config.stylePreset);
				} catch (e) {
					console.warn('Initial theme application failed', e);
				}
			}
		});

		map.on('style.load', () => {
			if (config.styleTheme) {
				try {
					applyStyleTheme(map, config.styleTheme, config.stylePreset);
				} catch (e) {
					console.warn('Style theme re-application failed', e);
				}
			}
		});
		map.on('click', (event) => {
			if (!config.interactive) {
				return;
			}

			const coordinates = {
				lat: event.lngLat.lat,
				lng: event.lngLat.lng,
			};

			runtimeConfig.onMapClick?.(coordinates);
		});
		map.on('error', () => {
			if (map.loaded()) {
				return;
			}

			createFallback(host, config.fallbackMessage);
		});

		if (typeof window.ResizeObserver === 'function') {
			state.observer = new window.ResizeObserver(() => {
				state.map?.resize();
			});
			state.observer.observe(host);
		}

		syncMarkers(config, true);
		syncControls(config);
		syncSearch(config);
		syncAttribution(config);
		setupUserInteractionListeners(map);
	}

	function destroy(): void {
		state.attribution?.destroy();
		state.attribution = null;

		state.controls?.destroy();
		state.controls = null;

		state.searchControl?.destroy();
		state.searchControl = null;

		state.observer?.disconnect();
		state.observer = null;

		state.map?.remove();
		state.map = null;
		state.markers = [];

		host.innerHTML = '';
	}

	function update(rawConfig: RawMapConfig = {}): void {
		const nextConfig = normalizeMapConfig(rawConfig, runtimeConfig);
		const previousConfig = state.config;

		if (!state.map) {
			destroy();
			build(nextConfig);
			return;
		}

		host.style.height = nextConfig.heightCssValue;

		if (!previousConfig || previousConfig.styleUrl !== nextConfig.styleUrl) {
			state.map.setStyle(nextConfig.styleUrl);
		}

		if (JSON.stringify(previousConfig?.styleTheme) !== JSON.stringify(nextConfig.styleTheme)) {
			try {
				applyStyleTheme(state.map, nextConfig.styleTheme, nextConfig.stylePreset);
			} catch (e) {
				console.warn('Live theme update failed', e);
			}
		}

		const centerChanged =
			!previousConfig ||
			previousConfig.centerLat !== nextConfig.centerLat ||
			previousConfig.centerLng !== nextConfig.centerLng ||
			previousConfig.centerOffsetY !== nextConfig.centerOffsetY;
		const zoomChanged = !previousConfig || previousConfig.zoom !== nextConfig.zoom;

		if (centerChanged || zoomChanged || didRenderedPointsChange(previousConfig, nextConfig)) {
			syncViewport(state.map, nextConfig, zoomChanged);
		}

		if (
			!previousConfig ||
			previousConfig.showZoomControls !== nextConfig.showZoomControls ||
			didZoomControlsStyleChange(previousConfig, nextConfig)
		) {
			syncControls(nextConfig);
		}

		if (
			didRenderedPointsChange(previousConfig, nextConfig) ||
			previousConfig?.allowSearch !== nextConfig.allowSearch
		) {
			syncSearch(nextConfig);
		}

		if (!previousConfig || previousConfig.showAttribution !== nextConfig.showAttribution) {
			syncAttribution(nextConfig);
		}

		if (previousConfig?.scrollZoom !== nextConfig.scrollZoom) {
			if (nextConfig.scrollZoom) {
				state.map.scrollZoom.enable();
			} else {
				state.map.scrollZoom.disable();
			}
		}

		if (
			!previousConfig ||
			previousConfig.markerClassName !== nextConfig.markerClassName ||
			previousConfig.markerOffsetY !== nextConfig.markerOffsetY ||
			didRenderedPointsChange(previousConfig, nextConfig)
		) {
			syncMarkers(
				nextConfig,
				!previousConfig ||
					previousConfig.markerClassName !== nextConfig.markerClassName ||
					previousConfig.markerOffsetY !== nextConfig.markerOffsetY ||
					didRenderedPointsChange(previousConfig, nextConfig)
			);
		}

		state.config = nextConfig;
		state.map.resize();
	}

	build(initialConfig);

	return {
		destroy,
		update,
	};
}

function parseNodeConfig(node: HTMLElement): RawMapConfig {
	try {
		return JSON.parse(node.dataset.minimalMapConfig ?? '{}') as RawMapConfig;
	} catch {
		return {};
	}
}

export function bootstrapFrontendMaps(runtimeConfig: MapRuntimeConfig = window.MinimalMapFrontConfig ?? {}): void {
	document.querySelectorAll<HTMLElement>('[data-minimal-map-config]').forEach((node) => {
		createMinimalMap(node, parseNodeConfig(node), runtimeConfig);
	});
}
