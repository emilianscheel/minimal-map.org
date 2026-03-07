import { getStylePresets } from './style-presets';
import type {
	HeightUnit,
	MapDefaults,
	MapRuntimeConfig,
	NormalizedMapConfig,
	RawMapConfig,
	StylePresets,
} from '../types';

const FALLBACK_MESSAGE = 'Map preview unavailable because this browser does not support WebGL.';
export const HEIGHT_UNITS: HeightUnit[] = [ 'px', 'em', 'rem', '%', 'vh', 'vw' ];

const DEFAULT_MAP_DEFAULTS: MapDefaults = {
	centerLat: 52.517,
	centerLng: 13.388,
	zoom: 9.5,
	height: 420,
	heightUnit: 'px',
	stylePreset: 'liberty',
	showZoomControls: true,
};

export function normalizeHeightUnit(unit?: string | null): HeightUnit {
	return HEIGHT_UNITS.includes(unit as HeightUnit) ? (unit as HeightUnit) : 'px';
}

function getDefaults(runtimeConfig: MapRuntimeConfig): MapDefaults {
	return {
		...DEFAULT_MAP_DEFAULTS,
		...runtimeConfig.defaults,
		heightUnit: normalizeHeightUnit(runtimeConfig.defaults?.heightUnit),
		stylePreset: `${runtimeConfig.defaults?.stylePreset ?? DEFAULT_MAP_DEFAULTS.stylePreset}`,
		showZoomControls: runtimeConfig.defaults?.showZoomControls ?? DEFAULT_MAP_DEFAULTS.showZoomControls,
	};
}

function getFallbackPreset(stylePresets: StylePresets): string {
	if (stylePresets.liberty) {
		return 'liberty';
	}

	return Object.keys(stylePresets)[0] ?? DEFAULT_MAP_DEFAULTS.stylePreset;
}

export function normalizeMapConfig(
	rawConfig: RawMapConfig = {},
	runtimeConfig: MapRuntimeConfig = {}
): NormalizedMapConfig {
	const defaults = getDefaults(runtimeConfig);
	const stylePresets = getStylePresets(runtimeConfig.stylePresets);
	const fallbackPreset = getFallbackPreset(stylePresets);
	const defaultStylePreset = stylePresets[ defaults.stylePreset ] ? defaults.stylePreset : fallbackPreset;
	const requestedPreset = `${rawConfig.stylePreset ?? defaultStylePreset}`;
	const stylePreset = stylePresets[ requestedPreset ] ? requestedPreset : defaultStylePreset;
	const styleUrl =
		rawConfig.styleUrl ||
		stylePresets[ stylePreset ]?.style_url ||
		stylePresets[ fallbackPreset ]?.style_url ||
		DEFAULT_MAP_DEFAULTS.stylePreset;
	const centerLat = clampNumber(rawConfig.centerLat ?? defaults.centerLat, -90, 90);
	const centerLng = clampNumber(rawConfig.centerLng ?? defaults.centerLng, -180, 180);
	const zoom = clampNumber(rawConfig.zoom ?? defaults.zoom, 0, 22);
	const height = Math.max(1, Number(rawConfig.height ?? defaults.height));
	const heightUnit = normalizeHeightUnit(rawConfig.heightUnit ?? defaults.heightUnit);
	const markerLat = normalizeOptionalCoordinate(rawConfig.markerLat, -90, 90);
	const markerLng = normalizeOptionalCoordinate(rawConfig.markerLng, -180, 180);
	const markerClassName =
		typeof rawConfig.markerClassName === 'string' ? rawConfig.markerClassName.trim() : '';
	const markerOffsetY = Number.isFinite(Number(rawConfig.markerOffsetY)) ? Number(rawConfig.markerOffsetY) : 0;
	const centerOffsetY = Number.isFinite(Number(rawConfig.centerOffsetY)) ? Number(rawConfig.centerOffsetY) : 0;

	return {
		centerLat,
		centerLng,
		zoom,
		height,
		heightUnit,
		heightCssValue: `${trimNumber(height)}${heightUnit}`,
		stylePreset,
		styleUrl,
		showZoomControls: Boolean(rawConfig.showZoomControls ?? defaults.showZoomControls),
		fallbackMessage: rawConfig.fallbackMessage || runtimeConfig.messages?.fallback || FALLBACK_MESSAGE,
		markerLat,
		markerLng,
		markerClassName,
		markerOffsetY,
		centerOffsetY,
		interactive: rawConfig.interactive ?? true,
		showAttribution: rawConfig.showAttribution ?? true,
	};
}

function trimNumber(value: number): string {
	const rounded = Number(value.toFixed(4));

	return `${rounded}`;
}

function clampNumber(value: number | string, minimum: number, maximum: number): number {
	const numericValue = Number(value);

	if (Number.isNaN(numericValue)) {
		return minimum;
	}

	return Math.max(minimum, Math.min(maximum, numericValue));
}

function normalizeOptionalCoordinate(
	value: number | string | null | undefined,
	minimum: number,
	maximum: number
): number | null {
	if (value === null || typeof value === 'undefined' || value === '') {
		return null;
	}

	const numericValue = Number(value);

	if (Number.isNaN(numericValue)) {
		return null;
	}

	return Math.max(minimum, Math.min(maximum, numericValue));
}
