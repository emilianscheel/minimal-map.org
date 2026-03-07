import { getStylePresets } from './style-presets';

const FALLBACK_MESSAGE = 'Map preview unavailable because this browser does not support WebGL.';

export function normalizeMapConfig(rawConfig = {}, runtimeConfig = {}) {
	const defaults = runtimeConfig.defaults || {
		centerLat: 52.517,
		centerLng: 13.388,
		zoom: 9.5,
		height: 420,
		stylePreset: 'liberty',
		showZoomControls: true,
	};
	const stylePresets = getStylePresets(runtimeConfig.stylePresets);
	const requestedPreset = `${rawConfig.stylePreset ?? defaults.stylePreset}`;
	const stylePreset = stylePresets[requestedPreset] ? requestedPreset : defaults.stylePreset;
	const styleUrl = rawConfig.styleUrl || stylePresets[stylePreset]?.style_url || stylePresets.liberty.style_url;
	const centerLat = clampNumber(rawConfig.centerLat ?? defaults.centerLat, -90, 90);
	const centerLng = clampNumber(rawConfig.centerLng ?? defaults.centerLng, -180, 180);
	const zoom = clampNumber(rawConfig.zoom ?? defaults.zoom, 0, 22);
	const height = Math.max(240, Math.round(Number(rawConfig.height ?? defaults.height)));

	return {
		centerLat,
		centerLng,
		zoom,
		height,
		stylePreset,
		styleUrl,
		showZoomControls: Boolean(rawConfig.showZoomControls ?? defaults.showZoomControls),
		fallbackMessage: rawConfig.fallbackMessage || runtimeConfig.messages?.fallback || FALLBACK_MESSAGE,
	};
}

function clampNumber(value, minimum, maximum) {
	const numericValue = Number(value);

	if (Number.isNaN(numericValue)) {
		return minimum;
	}

	return Math.max(minimum, Math.min(maximum, numericValue));
}
