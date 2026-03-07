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

	function syncMarker(config: NormalizedMapConfig): void {
		if (!state.map) {
			return;
		}

		if (config.markerLat === null || config.markerLng === null) {
			state.marker?.remove();
			state.marker = null;
			return;
		}

		if (!state.marker) {
			state.marker = new maplibregl.Marker().setLngLat([config.markerLng, config.markerLat]).addTo(state.map);
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
				attributionControl: {},
				center: [ config.centerLng, config.centerLat ],
				container: viewport,
				scrollZoom: false,
				style: config.styleUrl,
				zoom: config.zoom,
			});
		} catch {
			createFallback(host, config.fallbackMessage);
			return;
		}

		const map = state.map;

		map.scrollZoom.disable();
		map.on('load', () => map.resize());
		map.on('click', (event) => {
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
			previousConfig.centerLng !== nextConfig.centerLng;
		const zoomChanged = !previousConfig || previousConfig.zoom !== nextConfig.zoom;

		if (centerChanged || zoomChanged) {
			if (zoomChanged) {
				state.map.easeTo({
					center: [ nextConfig.centerLng, nextConfig.centerLat ],
					duration: 180,
					essential: true,
					zoom: nextConfig.zoom,
				});
			} else {
				state.map.jumpTo({
					center: [ nextConfig.centerLng, nextConfig.centerLat ],
				});
			}
		}

		if (!previousConfig || previousConfig.showZoomControls !== nextConfig.showZoomControls) {
			syncControls(nextConfig);
		}

		if (
			!previousConfig ||
			previousConfig.markerLat !== nextConfig.markerLat ||
			previousConfig.markerLng !== nextConfig.markerLng
		) {
			syncMarker(nextConfig);
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
