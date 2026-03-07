import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { normalizeMapConfig } from './defaults';
import { createWordPressZoomControls } from './wp-controls';

function canCreateWebGLContext() {
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

function createFallback(host, message) {
	host.innerHTML = '';
	const notice = document.createElement('div');
	notice.className = 'components-notice is-warning minimal-map-fallback';
	notice.innerHTML = `<div class="components-notice__content"><p>${message}</p></div>`;
	host.appendChild(notice);
}

function createShell(host, config) {
	host.innerHTML = '';
	host.classList.add('minimal-map-runtime');
	host.style.height = `${config.height}px`;

	const viewport = document.createElement('div');
	viewport.className = 'minimal-map-runtime__viewport';
	host.appendChild(viewport);

	return viewport;
}

export function createMinimalMap(host, initialConfig = {}, runtimeConfig = {}) {
	const state = {
		config: null,
		controls: null,
		map: null,
		observer: null,
	};

	function syncControls(config) {
		if (state.controls) {
			state.controls.destroy();
			state.controls = null;
		}

		if (config.showZoomControls && state.map) {
			state.controls = createWordPressZoomControls(host, state.map);
		}
	}

	function build(rawConfig) {
		const config = normalizeMapConfig(rawConfig, runtimeConfig);
		state.config = config;
		const viewport = createShell(host, config);

		if (!canCreateWebGLContext()) {
			createFallback(host, config.fallbackMessage);
			return;
		}

		try {
			state.map = new maplibregl.Map({
				attributionControl: true,
				center: [config.centerLng, config.centerLat],
				container: viewport,
				style: config.styleUrl,
				zoom: config.zoom,
			});
		} catch (error) {
			createFallback(host, config.fallbackMessage);
			return;
		}

		state.map.on('load', () => state.map.resize());
		state.map.on('error', () => {
			if (!state.map || state.map.loaded()) {
				return;
			}

			createFallback(host, config.fallbackMessage);
		});

		if (typeof window.ResizeObserver === 'function') {
			state.observer = new window.ResizeObserver(() => {
				if (state.map) {
					state.map.resize();
				}
			});
			state.observer.observe(host);
		}

		syncControls(config);
	}

	function destroy() {
		if (state.controls) {
			state.controls.destroy();
			state.controls = null;
		}

		if (state.observer) {
			state.observer.disconnect();
			state.observer = null;
		}

		if (state.map) {
			state.map.remove();
			state.map = null;
		}

		host.innerHTML = '';
	}

	function update(rawConfig) {
		const nextConfig = normalizeMapConfig(rawConfig, runtimeConfig);
		const previousConfig = state.config;

		if (!state.map) {
			destroy();
			build(nextConfig);
			return;
		}

		host.style.height = `${nextConfig.height}px`;

		if (!previousConfig || previousConfig.styleUrl !== nextConfig.styleUrl) {
			state.map.setStyle(nextConfig.styleUrl);
		}

		if (
			!previousConfig ||
			previousConfig.centerLat !== nextConfig.centerLat ||
			previousConfig.centerLng !== nextConfig.centerLng ||
			previousConfig.zoom !== nextConfig.zoom
		) {
			state.map.jumpTo({
				center: [nextConfig.centerLng, nextConfig.centerLat],
				zoom: nextConfig.zoom,
			});
		}

		if (!previousConfig || previousConfig.showZoomControls !== nextConfig.showZoomControls) {
			syncControls(nextConfig);
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

export function bootstrapFrontendMaps(runtimeConfig = window.MinimalMapFrontConfig || {}) {
	const mapNodes = document.querySelectorAll('[data-minimal-map-config]');

	mapNodes.forEach((node) => {
		if (!(node instanceof HTMLElement)) {
			return;
		}

		let config = {};

		try {
			config = JSON.parse(node.dataset.minimalMapConfig || '{}');
		} catch (error) {
			config = {};
		}

		createMinimalMap(node, config, runtimeConfig);
	});
}
