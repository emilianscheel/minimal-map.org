import maplibregl, { type Map as MapLibreMap } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { normalizeMapConfig } from './defaults';
import { createWordPressZoomControls } from './wp-controls';
import type {
	MapRuntimeConfig,
	MinimalMapInstance,
	NormalizedMapConfig,
	RawMapConfig,
	WordPressZoomControls,
} from '../types';

interface MinimalMapState {
	config: NormalizedMapConfig | null;
	controls: WordPressZoomControls | null;
	map: MapLibreMap | null;
	marker: maplibregl.Marker | null;
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

function createMarker(config: NormalizedMapConfig): maplibregl.Marker {
	const marker = new maplibregl.Marker({
		offset: [ 0, config.markerOffsetY ],
	}).setLngLat([ config.markerLng as number, config.markerLat as number ]);

	if (config.markerClassName) {
		marker.getElement().classList.add(...config.markerClassName.split(/\s+/).filter(Boolean));
	}

	return marker;
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
		});
		return;
	}

	map.jumpTo(target);
}

export function createMinimalMap(
	host: HTMLElement,
	initialConfig: RawMapConfig = {},
	runtimeConfig: MapRuntimeConfig = {}
): MinimalMapInstance {
	const state: MinimalMapState = {
		config: null,
		controls: null,
		map: null,
		marker: null,
		observer: null,
	};

	function syncMarker(config: NormalizedMapConfig, forceRecreate = false): void {
		if (!state.map) {
			return;
		}

		if (config.markerLat === null || config.markerLng === null) {
			state.marker?.remove();
			state.marker = null;
			return;
		}

		if (forceRecreate) {
			state.marker?.remove();
			state.marker = null;
		}

		if (!state.marker) {
			state.marker = createMarker(config).addTo(state.map);
			return;
		}

		state.marker.setLngLat([config.markerLng, config.markerLat]);
	}

	function syncControls(config: NormalizedMapConfig): void {
		state.controls?.destroy();
		state.controls = null;

		if (config.showZoomControls && state.map) {
			state.controls = createWordPressZoomControls(host, state.map);
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
				attributionControl: config.showAttribution ? {} : false,
				boxZoom: config.interactive,
				center: [ config.centerLng, config.centerLat ],
				container: viewport,
				doubleClickZoom: config.interactive,
				dragPan: config.interactive,
				dragRotate: config.interactive,
				keyboard: config.interactive,
				scrollZoom: false,
				style: config.styleUrl,
				touchZoomRotate: config.interactive,
				zoom: config.zoom,
			});
		} catch {
			createFallback(host, config.fallbackMessage);
			return;
		}

		const map = state.map;

		map.scrollZoom.disable();
		if (!config.interactive) {
			map.boxZoom.disable();
			map.doubleClickZoom.disable();
			map.dragPan.disable();
			map.dragRotate.disable();
			map.keyboard.disable();
			map.touchZoomRotate.disable();
		}
		map.on('load', () => {
			syncCenter(map, config);
			map.resize();
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

		syncMarker(config);
		syncControls(config);
	}

	function destroy(): void {
		state.controls?.destroy();
		state.controls = null;

		state.observer?.disconnect();
		state.observer = null;

		state.map?.remove();
		state.map = null;
		state.marker = null;

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

		const centerChanged =
			!previousConfig ||
			previousConfig.centerLat !== nextConfig.centerLat ||
			previousConfig.centerLng !== nextConfig.centerLng ||
			previousConfig.centerOffsetY !== nextConfig.centerOffsetY;
		const zoomChanged = !previousConfig || previousConfig.zoom !== nextConfig.zoom;

		if (centerChanged || zoomChanged) {
			syncCenter(state.map, nextConfig, zoomChanged);
		}

		if (!previousConfig || previousConfig.showZoomControls !== nextConfig.showZoomControls) {
			syncControls(nextConfig);
		}

		if (
			!previousConfig ||
			previousConfig.markerLat !== nextConfig.markerLat ||
			previousConfig.markerLng !== nextConfig.markerLng ||
			previousConfig.markerClassName !== nextConfig.markerClassName ||
			previousConfig.markerOffsetY !== nextConfig.markerOffsetY
		) {
			syncMarker(
				nextConfig,
				!previousConfig ||
					previousConfig.markerClassName !== nextConfig.markerClassName ||
					previousConfig.markerOffsetY !== nextConfig.markerOffsetY
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
