import maplibregl, { LngLatBounds, type Map as MapLibreMap } from 'maplibre-gl';
import { createAttributionPill } from './attribution-pill';
import { normalizeMapConfig } from './defaults';
import { syncTouchZoomInteraction } from './interactions';
import { applyStyleTheme } from '../lib/styles/themeEngine';
import { createWordPressZoomControls } from './wp-controls';
import { createWordPressSearchControl } from './SearchControl';
import { getSearchPanelDesktopPadding } from './search-panel-layout';
import { getActiveHeightCssValue } from './responsive';
import { createMarkerRenderer, type MarkerRenderer, type MarkerRendererConfig } from './marker-renderer';
import { getMapDomContext, type MapDomContext } from './dom-context';
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
	map: MapLibreMap | null;
	markerRenderer: MarkerRenderer | null;
	observer: ResizeObserver | null;
	resizeHandler: (() => void) | null;
	searchControl: WordPressSearchControl | null;
	selectedLocationId: number | null;
}

function canCreateWebGLContext(context: MapDomContext): boolean {
	const canvas = context.doc.createElement('canvas');

	return Boolean(
		canvas.getContext('webgl2') ||
		canvas.getContext('webgl') ||
		canvas.getContext('experimental-webgl')
	);
}

function createFallback(host: HTMLElement, message: string, context: MapDomContext): void {
	host.innerHTML = '';
	const notice = context.doc.createElement('div');
	const content = context.doc.createElement('div');
	const paragraph = context.doc.createElement('p');

	notice.className = 'components-notice is-warning minimal-map-fallback';
	content.className = 'components-notice__content';
	paragraph.textContent = message;
	content.appendChild(paragraph);
	notice.appendChild(content);
	host.appendChild(notice);
}

function createShell(host: HTMLElement, config: NormalizedMapConfig, context: MapDomContext): HTMLElement {
	host.innerHTML = '';
	host.classList.add('minimal-map-runtime');
	host.style.height = getActiveHeightCssValue(config, context.win.innerWidth);

	const viewport = context.doc.createElement('div');
	viewport.className = 'minimal-map-runtime__viewport';
	host.appendChild(viewport);

	return viewport;
}

function getMarkerContent(
	config: NormalizedMapConfig,
	point: MapLocationPoint
): string | null {
	if (typeof point.markerContent === 'string' && point.markerContent.trim() !== '') {
		return point.markerContent;
	}

	return config.markerContent;
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

function didCreditsStyleChange(
	previousConfig: NormalizedMapConfig | null,
	nextConfig: NormalizedMapConfig
): boolean {
	if (!previousConfig) {
		return true;
	}

	return (
		previousConfig.creditsBackgroundColor !== nextConfig.creditsBackgroundColor ||
		previousConfig.creditsForegroundColor !== nextConfig.creditsForegroundColor ||
		previousConfig.creditsBorderRadius !== nextConfig.creditsBorderRadius ||
		previousConfig.creditsPadding.top !== nextConfig.creditsPadding.top ||
		previousConfig.creditsPadding.right !== nextConfig.creditsPadding.right ||
		previousConfig.creditsPadding.bottom !== nextConfig.creditsPadding.bottom ||
		previousConfig.creditsPadding.left !== nextConfig.creditsPadding.left ||
		previousConfig.creditsOuterMargin.top !== nextConfig.creditsOuterMargin.top ||
		previousConfig.creditsOuterMargin.right !== nextConfig.creditsOuterMargin.right ||
		previousConfig.creditsOuterMargin.bottom !== nextConfig.creditsOuterMargin.bottom ||
		previousConfig.creditsOuterMargin.left !== nextConfig.creditsOuterMargin.left
	);
}

function syncCenter(
	map: MapLibreMap,
	config: NormalizedMapConfig,
	zoomChanged = false
): void {
	const target = {
		center: [config.centerLng, config.centerLat] as [number, number],
		offset: [0, config.centerOffsetY] as [number, number],
	};

	if (zoomChanged) {
		map.easeTo(
			{
				...target,
				duration: 180,
				essential: true,
				zoom: config.zoom,
			},
			{ isMinimalMapInternal: true }
		);
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
			markerContent: config.markerContent ?? undefined,
		},
	];
}

function getMarkerRendererConfig(config: NormalizedMapConfig): MarkerRendererConfig {
	return {
		markerContent: config.markerContent,
		markerOffsetY: config.markerOffsetY,
		markerScale: config.markerScale,
		points: getRenderedPoints(config),
	};
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

		return point.lat !== nextPoint.lat || point.lng !== nextPoint.lng || point.id !== nextPoint.id;
	});
}

function didRenderedMarkerContentChange(
	previousConfig: NormalizedMapConfig | null,
	nextConfig: NormalizedMapConfig
): boolean {
	if (!previousConfig) {
		return true;
	}

	const previousPoints = getRenderedPoints(previousConfig);
	const nextPoints = getRenderedPoints(nextConfig);

	if (previousPoints.length !== nextPoints.length) {
		return true;
	}

	if (previousConfig.markerContent !== nextConfig.markerContent) {
		return true;
	}

	return previousPoints.some((point, index) => {
		const nextPoint = nextPoints[index];

		return getMarkerContent(previousConfig, point) !== getMarkerContent(nextConfig, nextPoint);
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
		map.easeTo(
			{
				center: [point.lng, point.lat],
				duration: 180,
				essential: true,
				offset: [0, config.centerOffsetY],
				zoom: config.zoom,
			},
			{ isMinimalMapInternal: true }
		);
		return;
	}

	const bounds = points.reduce(
		(currentBounds, point) => currentBounds.extend([point.lng, point.lat]),
		new LngLatBounds([points[0].lng, points[0].lat], [points[0].lng, points[0].lat])
	);

	map.fitBounds(
		bounds,
		{
			duration: 180,
			essential: true,
			padding: 48,
		},
		{ isMinimalMapInternal: true }
	);
}

export function createMinimalMap(
	host: HTMLElement,
	initialConfig: RawMapConfig = {},
	runtimeConfig: MapRuntimeConfig = {}
): MinimalMapInstance {
	const context = getMapDomContext(host);
	const state: MinimalMapState = {
		attribution: null,
		config: null,
		controls: null,
		map: null,
		markerRenderer: null,
		observer: null,
		resizeHandler: null,
		searchControl: null,
		selectedLocationId: null,
	};

	function applyResponsiveHostHeight(config: NormalizedMapConfig): void {
		const nextHeightCssValue = getActiveHeightCssValue(config, context.win.innerWidth);

		if (host.style.height !== nextHeightCssValue) {
			host.style.height = nextHeightCssValue;
		}
	}

	function focusLocation(locationId: number, config: NormalizedMapConfig): void {
		if (!state.map) {
			return;
		}

		const point = getRenderedPoints(config).find((candidate) => candidate.id === locationId);

		if (!point) {
			return;
		}

		state.selectedLocationId = locationId;
		state.map.easeTo(
			{
				center: [point.lng, point.lat],
				zoom: Math.max(state.map.getZoom(), 15),
				padding: {
					left: getSearchPanelDesktopPadding(
						config,
						state.searchControl
							? host.querySelector<HTMLElement>('.minimal-map-search-host')
							: null
					),
					top: 0,
					right: 0,
					bottom: 0,
				},
				essential: true,
			},
			{ isMinimalMapInternal: true }
		);
		state.searchControl?.update(config, locationId);
	}

	function setupUserInteractionListeners(map: MapLibreMap): void {
		const clearSelection = (event: { isMinimalMapInternal?: boolean }) => {
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
			state.attribution = createAttributionPill(host, config);
		}
	}

	function syncMarkers(config: NormalizedMapConfig): void {
		if (!state.markerRenderer) {
			return;
		}

		void state.markerRenderer.update(getMarkerRendererConfig(config));
	}

	function build(rawConfig: RawMapConfig): void {
		const config = normalizeMapConfig(rawConfig, runtimeConfig);
		state.config = config;
		const viewport = createShell(host, config, context);

		if (!canCreateWebGLContext(context)) {
			createFallback(host, config.fallbackMessage, context);
			return;
		}

		try {
			state.map = new maplibregl.Map({
				attributionControl: false,
				boxZoom: config.interactive,
				center: [config.centerLng, config.centerLat],
				container: viewport,
				doubleClickZoom: config.interactive,
				dragPan: config.interactive,
				dragRotate: config.interactive,
				keyboard: config.interactive,
				scrollZoom: config.scrollZoom,
				style: config.styleUrl,
				touchZoomRotate: config.interactive && config.mobileTwoFingerZoom,
				zoom: config.zoom,
			});
		} catch {
			createFallback(host, config.fallbackMessage, context);
			return;
		}

		const map = state.map;
		state.markerRenderer = createMarkerRenderer({
			host,
			map,
			onLocationSelect: (locationId) => {
				const activeConfig = state.config ?? config;
				focusLocation(locationId, activeConfig);
			},
		});

		if (!config.interactive) {
			map.boxZoom.disable();
			map.doubleClickZoom.disable();
			map.dragPan.disable();
			map.dragRotate.disable();
			map.keyboard.disable();
			map.touchZoomRotate.disable();
		}

		syncTouchZoomInteraction(map, config);

		map.on('load', () => {
			const activeConfig = state.config ?? config;
			syncViewport(map, activeConfig);
			map.resize();

			if (activeConfig.styleTheme) {
				try {
					applyStyleTheme(map, activeConfig.styleTheme, activeConfig.stylePreset);
				} catch (error) {
					console.warn('Initial theme application failed', error);
				}
			}

			void state.markerRenderer?.rebuild();
		});

		map.on('style.load', () => {
			const activeConfig = state.config ?? config;

			if (activeConfig.styleTheme) {
				try {
					applyStyleTheme(map, activeConfig.styleTheme, activeConfig.stylePreset);
				} catch (error) {
					console.warn('Style theme re-application failed', error);
				}
			}

			void state.markerRenderer?.rebuild();
		});

		map.on('click', (event) => {
			if (state.markerRenderer?.handleClick(event)) {
				return;
			}

			const activeConfig = state.config ?? config;

			if (!activeConfig.interactive) {
				return;
			}

			runtimeConfig.onMapClick?.({
				lat: event.lngLat.lat,
				lng: event.lngLat.lng,
			});
		});

		map.on('error', () => {
			if (map.loaded()) {
				return;
			}

			createFallback(host, (state.config ?? config).fallbackMessage, context);
		});

		if (typeof context.win.ResizeObserver === 'function') {
			state.observer = new context.win.ResizeObserver(() => {
				state.map?.resize();
			});
			state.observer.observe(host);
		}

		state.resizeHandler = () => {
			const activeConfig = state.config ?? config;
			const previousHeight = host.style.height;

			applyResponsiveHostHeight(activeConfig);

			if (host.style.height !== previousHeight) {
				state.map?.resize();
			}
		};
		context.win.addEventListener('resize', state.resizeHandler);

		syncMarkers(config);
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

		state.markerRenderer?.destroy();
		state.markerRenderer = null;

		state.observer?.disconnect();
		state.observer = null;
		if (state.resizeHandler) {
			context.win.removeEventListener('resize', state.resizeHandler);
			state.resizeHandler = null;
		}

		state.map?.remove();
		state.map = null;

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

		applyResponsiveHostHeight(nextConfig);

		if (!previousConfig || previousConfig.styleUrl !== nextConfig.styleUrl) {
			state.map.setStyle(nextConfig.styleUrl);
		}

		if (JSON.stringify(previousConfig?.styleTheme) !== JSON.stringify(nextConfig.styleTheme)) {
			try {
				applyStyleTheme(state.map, nextConfig.styleTheme, nextConfig.stylePreset);
			} catch (error) {
				console.warn('Live theme update failed', error);
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

		syncSearch(nextConfig);

		if (
			!previousConfig ||
			previousConfig.showAttribution !== nextConfig.showAttribution ||
			didCreditsStyleChange(previousConfig, nextConfig)
		) {
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
			previousConfig?.interactive !== nextConfig.interactive ||
			previousConfig?.mobileTwoFingerZoom !== nextConfig.mobileTwoFingerZoom
		) {
			syncTouchZoomInteraction(state.map, nextConfig);
		}

		if (
			!previousConfig ||
			previousConfig.markerContent !== nextConfig.markerContent ||
			previousConfig.markerOffsetY !== nextConfig.markerOffsetY ||
			previousConfig.markerScale !== nextConfig.markerScale ||
			didRenderedPointsChange(previousConfig, nextConfig) ||
			didRenderedMarkerContentChange(previousConfig, nextConfig)
		) {
			syncMarkers(nextConfig);
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
