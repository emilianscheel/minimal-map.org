import { getStylePresets } from './style-presets';
import {
	DEFAULT_ZOOM_CONTROLS_BACKGROUND_COLOR,
	DEFAULT_ZOOM_CONTROLS_BORDER_COLOR,
	DEFAULT_ZOOM_CONTROLS_BORDER_RADIUS,
	DEFAULT_ZOOM_CONTROLS_BORDER_WIDTH,
	DEFAULT_ZOOM_CONTROLS_ICON_COLOR,
	DEFAULT_ZOOM_CONTROLS_MINUS_ICON,
	DEFAULT_ZOOM_CONTROLS_OUTER_MARGIN,
	DEFAULT_ZOOM_CONTROLS_PADDING,
	DEFAULT_ZOOM_CONTROLS_PLUS_ICON,
	DEFAULT_ZOOM_CONTROLS_POSITION,
} from './zoom-control-options';
import type {
	BoxValue,
	HeightUnit,
	MapDefaults,
	MapLocationPoint,
	MapRuntimeConfig,
	NormalizedMapConfig,
	RawMapConfig,
	StylePresets,
	ZoomControlIcon,
	ZoomControlsPosition,
} from '../types';

const FALLBACK_MESSAGE = 'Map preview unavailable because this browser does not support WebGL.';
export const HEIGHT_UNITS: HeightUnit[] = [ 'px', 'em', 'rem', '%', 'vh', 'vw' ];

const DEFAULT_MAP_DEFAULTS: MapDefaults = {
	centerLat: 52.517,
	centerLng: 13.388,
	zoom: 9.5,
	collectionId: 0,
	height: 420,
	heightUnit: 'px',
	stylePreset: 'liberty',
	styleThemeSlug: 'default',
	showZoomControls: true,
	allowSearch: true,
	scrollZoom: false,
	mobileTwoFingerZoom: true,
	zoomControlsPosition: DEFAULT_ZOOM_CONTROLS_POSITION,
	zoomControlsPadding: DEFAULT_ZOOM_CONTROLS_PADDING,
	zoomControlsOuterMargin: DEFAULT_ZOOM_CONTROLS_OUTER_MARGIN,
	zoomControlsBackgroundColor: DEFAULT_ZOOM_CONTROLS_BACKGROUND_COLOR,
	zoomControlsIconColor: DEFAULT_ZOOM_CONTROLS_ICON_COLOR,
	zoomControlsBorderRadius: DEFAULT_ZOOM_CONTROLS_BORDER_RADIUS,
	zoomControlsBorderColor: DEFAULT_ZOOM_CONTROLS_BORDER_COLOR,
	zoomControlsBorderWidth: DEFAULT_ZOOM_CONTROLS_BORDER_WIDTH,
	zoomControlsPlusIcon: DEFAULT_ZOOM_CONTROLS_PLUS_ICON,
	zoomControlsMinusIcon: DEFAULT_ZOOM_CONTROLS_MINUS_ICON,
	searchPanelBackgroundPrimary: '#ffffff',
	searchPanelBackgroundSecondary: '#f0f0f1',
	searchPanelBackgroundHover: '#f8f8f8',
	searchPanelForegroundPrimary: '#1e1e1e',
	searchPanelForegroundSecondary: '#1e1e1e',
	searchPanelOuterMargin: {
		top: '24px',
		right: '24px',
		bottom: '24px',
		left: '24px',
	},
	searchPanelBorderRadiusInput: '10px',
	searchPanelBorderRadiusCard: '2px',
	searchPanelCardGap: '12px',
	searchPanelWidth: '320px',
	creditsPadding: {
		top: '4px',
		right: '8px',
		bottom: '4px',
		left: '8px',
	},
	creditsOuterMargin: {
		top: '16px',
		right: '16px',
		bottom: '16px',
		left: '16px',
	},
	creditsBackgroundColor: '#ffffff',
	creditsForegroundColor: '#1e1e1e',
	creditsBorderRadius: '999px',
	_isPreview: false,
};

export function normalizeHeightUnit(unit?: string | null): HeightUnit {
	return HEIGHT_UNITS.includes(unit as HeightUnit) ? (unit as HeightUnit) : 'px';
}

function normalizeBoxValue(value: BoxValue | null | undefined, fallback: Required<BoxValue>): Required<BoxValue> {
	return {
		top: normalizeCssLength(value?.top, fallback.top),
		right: normalizeCssLength(value?.right, fallback.right),
		bottom: normalizeCssLength(value?.bottom, fallback.bottom),
		left: normalizeCssLength(value?.left, fallback.left),
	};
}

function normalizeCssLength(value: string | undefined, fallback: string): string {
	if (typeof value !== 'string') {
		return fallback;
	}

	const trimmed = value.trim();

	if (!trimmed || !/^((\d*\.?\d+)(px|em|rem|%|vh|vw)?|0)$/i.test(trimmed)) {
		return fallback;
	}

	return trimmed === '0' ? '0px' : trimmed;
}

function normalizeColor(value: string | undefined, fallback: string): string {
	if (typeof value !== 'string') {
		return fallback;
	}

	const trimmed = value.trim();

	if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) {
		return fallback;
	}

	return trimmed;
}

function normalizeZoomControlsPosition(value: string | undefined, fallback: ZoomControlsPosition): ZoomControlsPosition {
	return [ 'top-right', 'top-left', 'bottom-right', 'bottom-left' ].includes(`${value}`)
		? (value as ZoomControlsPosition)
		: fallback;
}

function normalizeZoomControlIcon(value: string | undefined, fallback: ZoomControlIcon): ZoomControlIcon {
	return [ 'plus', 'plus-circle', 'plus-circle-filled', 'line-solid', 'separator', 'close-small' ].includes(`${value}`)
		? (value as ZoomControlIcon)
		: fallback;
}

function normalizeBorderRadiusValue(value: string | BoxValue | null | undefined, fallback: string): string {
	if (!value) {
		return fallback;
	}

	if (typeof value === 'string') {
		const parts = value.trim().split(/\s+/).filter(Boolean);

		if (parts.length < 1 || parts.length > 4) {
			return fallback;
		}

		const normalizedParts = parts.map((part) => normalizeCssLength(part, ''));

		if (normalizedParts.some((part) => !part)) {
			return fallback;
		}

		return normalizedParts.join(' ');
	}

	const topLeft = normalizeCssLength(value.top, fallback);
	const topRight = normalizeCssLength(value.right, fallback);
	const bottomRight = normalizeCssLength(value.bottom, fallback);
	const bottomLeft = normalizeCssLength(value.left, fallback);

	return `${topLeft} ${topRight} ${bottomRight} ${bottomLeft}`;
}

function getDefaults(runtimeConfig: MapRuntimeConfig): MapDefaults {
	return {
		...DEFAULT_MAP_DEFAULTS,
		...runtimeConfig.defaults,
		heightUnit: normalizeHeightUnit(runtimeConfig.defaults?.heightUnit),
		stylePreset: `${runtimeConfig.defaults?.stylePreset ?? DEFAULT_MAP_DEFAULTS.stylePreset}`,
		showZoomControls: runtimeConfig.defaults?.showZoomControls ?? DEFAULT_MAP_DEFAULTS.showZoomControls,
		allowSearch: runtimeConfig.defaults?.allowSearch ?? DEFAULT_MAP_DEFAULTS.allowSearch,
		scrollZoom: runtimeConfig.defaults?.scrollZoom ?? DEFAULT_MAP_DEFAULTS.scrollZoom,
		mobileTwoFingerZoom:
			runtimeConfig.defaults?.mobileTwoFingerZoom ?? DEFAULT_MAP_DEFAULTS.mobileTwoFingerZoom,
		zoomControlsPosition: normalizeZoomControlsPosition(
			runtimeConfig.defaults?.zoomControlsPosition,
			DEFAULT_MAP_DEFAULTS.zoomControlsPosition
		),
		zoomControlsPadding: normalizeBoxValue(
			runtimeConfig.defaults?.zoomControlsPadding,
			DEFAULT_MAP_DEFAULTS.zoomControlsPadding as Required<BoxValue>
		),
		zoomControlsOuterMargin: normalizeBoxValue(
			runtimeConfig.defaults?.zoomControlsOuterMargin,
			DEFAULT_MAP_DEFAULTS.zoomControlsOuterMargin as Required<BoxValue>
		),
		zoomControlsBackgroundColor: normalizeColor(
			runtimeConfig.defaults?.zoomControlsBackgroundColor,
			DEFAULT_MAP_DEFAULTS.zoomControlsBackgroundColor
		),
		zoomControlsIconColor: normalizeColor(
			runtimeConfig.defaults?.zoomControlsIconColor,
			DEFAULT_MAP_DEFAULTS.zoomControlsIconColor
		),
		zoomControlsBorderRadius: normalizeBorderRadiusValue(
			runtimeConfig.defaults?.zoomControlsBorderRadius,
			DEFAULT_MAP_DEFAULTS.zoomControlsBorderRadius
		),
		zoomControlsBorderColor: normalizeColor(
			runtimeConfig.defaults?.zoomControlsBorderColor,
			DEFAULT_MAP_DEFAULTS.zoomControlsBorderColor
		),
		zoomControlsBorderWidth: normalizeCssLength(
			runtimeConfig.defaults?.zoomControlsBorderWidth,
			DEFAULT_MAP_DEFAULTS.zoomControlsBorderWidth
		),
		zoomControlsPlusIcon: normalizeZoomControlIcon(
			runtimeConfig.defaults?.zoomControlsPlusIcon,
			DEFAULT_MAP_DEFAULTS.zoomControlsPlusIcon
		),
		zoomControlsMinusIcon: normalizeZoomControlIcon(
			runtimeConfig.defaults?.zoomControlsMinusIcon,
			DEFAULT_MAP_DEFAULTS.zoomControlsMinusIcon
		),
		searchPanelBackgroundPrimary: normalizeColor(
			runtimeConfig.defaults?.searchPanelBackgroundPrimary,
			DEFAULT_MAP_DEFAULTS.searchPanelBackgroundPrimary
		),
		searchPanelBackgroundSecondary: normalizeColor(
			runtimeConfig.defaults?.searchPanelBackgroundSecondary,
			DEFAULT_MAP_DEFAULTS.searchPanelBackgroundSecondary
		),
		searchPanelBackgroundHover: normalizeColor(
			runtimeConfig.defaults?.searchPanelBackgroundHover,
			DEFAULT_MAP_DEFAULTS.searchPanelBackgroundHover
		),
		searchPanelForegroundPrimary: normalizeColor(
			runtimeConfig.defaults?.searchPanelForegroundPrimary,
			DEFAULT_MAP_DEFAULTS.searchPanelForegroundPrimary
		),
		searchPanelForegroundSecondary: normalizeColor(
			runtimeConfig.defaults?.searchPanelForegroundSecondary,
			DEFAULT_MAP_DEFAULTS.searchPanelForegroundSecondary
		),
		searchPanelOuterMargin: normalizeBoxValue(
			runtimeConfig.defaults?.searchPanelOuterMargin,
			DEFAULT_MAP_DEFAULTS.searchPanelOuterMargin as Required<BoxValue>
		),
		searchPanelBorderRadiusInput: normalizeBorderRadiusValue(
			runtimeConfig.defaults?.searchPanelBorderRadiusInput,
			DEFAULT_MAP_DEFAULTS.searchPanelBorderRadiusInput
		),
		searchPanelBorderRadiusCard: normalizeBorderRadiusValue(
			runtimeConfig.defaults?.searchPanelBorderRadiusCard,
			DEFAULT_MAP_DEFAULTS.searchPanelBorderRadiusCard
		),
		searchPanelCardGap: normalizeCssLength(
			runtimeConfig.defaults?.searchPanelCardGap,
			DEFAULT_MAP_DEFAULTS.searchPanelCardGap
		),
		searchPanelWidth: normalizeCssLength(
			runtimeConfig.defaults?.searchPanelWidth,
			DEFAULT_MAP_DEFAULTS.searchPanelWidth
		),
		creditsPadding: normalizeBoxValue(
			runtimeConfig.defaults?.creditsPadding,
			DEFAULT_MAP_DEFAULTS.creditsPadding as Required<BoxValue>
		),
		creditsOuterMargin: normalizeBoxValue(
			runtimeConfig.defaults?.creditsOuterMargin,
			DEFAULT_MAP_DEFAULTS.creditsOuterMargin as Required<BoxValue>
		),
		creditsBackgroundColor: normalizeColor(
			runtimeConfig.defaults?.creditsBackgroundColor,
			DEFAULT_MAP_DEFAULTS.creditsBackgroundColor
		),
		creditsForegroundColor: normalizeColor(
			runtimeConfig.defaults?.creditsForegroundColor,
			DEFAULT_MAP_DEFAULTS.creditsForegroundColor
		),
		creditsBorderRadius: normalizeBorderRadiusValue(
			runtimeConfig.defaults?.creditsBorderRadius,
			DEFAULT_MAP_DEFAULTS.creditsBorderRadius
		),
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
		stylePresets[ defaults.stylePreset ]?.style_url ||
		'https://tiles.openfreemap.org/styles/liberty';
	const styleThemeSlug = `${rawConfig.styleThemeSlug ?? defaults.styleThemeSlug}`;
	const centerLat = clampNumber(rawConfig.centerLat ?? defaults.centerLat, -90, 90);
	const centerLng = clampNumber(rawConfig.centerLng ?? defaults.centerLng, -180, 180);
	const zoom = clampNumber(rawConfig.zoom ?? defaults.zoom, 0, 22);
	const collectionId = Math.max(0, Number(rawConfig.collectionId ?? defaults.collectionId) || 0);
	const height = Math.max(1, Number(rawConfig.height ?? defaults.height));
	const heightUnit = normalizeHeightUnit(rawConfig.heightUnit ?? defaults.heightUnit);
	const zoomControlsPosition = normalizeZoomControlsPosition(
		rawConfig.zoomControlsPosition ?? defaults.zoomControlsPosition,
		defaults.zoomControlsPosition
	);
	const zoomControlsPadding = normalizeBoxValue(
		rawConfig.zoomControlsPadding ?? defaults.zoomControlsPadding,
		defaults.zoomControlsPadding as Required<BoxValue>
	);
	const zoomControlsOuterMargin = normalizeBoxValue(
		rawConfig.zoomControlsOuterMargin ?? defaults.zoomControlsOuterMargin,
		defaults.zoomControlsOuterMargin as Required<BoxValue>
	);
	const zoomControlsBackgroundColor = normalizeColor(
		rawConfig.zoomControlsBackgroundColor ?? defaults.zoomControlsBackgroundColor,
		defaults.zoomControlsBackgroundColor
	);
	const zoomControlsIconColor = normalizeColor(
		rawConfig.zoomControlsIconColor ?? defaults.zoomControlsIconColor,
		defaults.zoomControlsIconColor
	);
	const zoomControlsBorderRadius = normalizeBorderRadiusValue(
		rawConfig.zoomControlsBorderRadius ?? defaults.zoomControlsBorderRadius,
		defaults.zoomControlsBorderRadius
	);
	const zoomControlsBorderColor = normalizeColor(
		rawConfig.zoomControlsBorderColor ?? defaults.zoomControlsBorderColor,
		defaults.zoomControlsBorderColor
	);
	const zoomControlsBorderWidth = normalizeCssLength(
		rawConfig.zoomControlsBorderWidth ?? defaults.zoomControlsBorderWidth,
		defaults.zoomControlsBorderWidth
	);
	const zoomControlsPlusIcon = normalizeZoomControlIcon(
		rawConfig.zoomControlsPlusIcon ?? defaults.zoomControlsPlusIcon,
		defaults.zoomControlsPlusIcon
	);
	const zoomControlsMinusIcon = normalizeZoomControlIcon(
		rawConfig.zoomControlsMinusIcon ?? defaults.zoomControlsMinusIcon,
		defaults.zoomControlsMinusIcon
	);
	const searchPanelBackgroundPrimary = normalizeColor(
		rawConfig.searchPanelBackgroundPrimary ?? defaults.searchPanelBackgroundPrimary,
		defaults.searchPanelBackgroundPrimary
	);
	const searchPanelBackgroundSecondary = normalizeColor(
		rawConfig.searchPanelBackgroundSecondary ?? defaults.searchPanelBackgroundSecondary,
		defaults.searchPanelBackgroundSecondary
	);
	const searchPanelBackgroundHover = normalizeColor(
		rawConfig.searchPanelBackgroundHover ?? defaults.searchPanelBackgroundHover,
		defaults.searchPanelBackgroundHover
	);
	const searchPanelForegroundPrimary = normalizeColor(
		rawConfig.searchPanelForegroundPrimary ?? defaults.searchPanelForegroundPrimary,
		defaults.searchPanelForegroundPrimary
	);
	const searchPanelForegroundSecondary = normalizeColor(
		rawConfig.searchPanelForegroundSecondary ?? defaults.searchPanelForegroundSecondary,
		defaults.searchPanelForegroundSecondary
	);
	const searchPanelOuterMargin = normalizeBoxValue(
		rawConfig.searchPanelOuterMargin ?? defaults.searchPanelOuterMargin,
		defaults.searchPanelOuterMargin as Required<BoxValue>
	);
	const searchPanelBorderRadiusInput = normalizeBorderRadiusValue(
		rawConfig.searchPanelBorderRadiusInput ?? defaults.searchPanelBorderRadiusInput,
		defaults.searchPanelBorderRadiusInput
	);
	const searchPanelBorderRadiusCard = normalizeBorderRadiusValue(
		rawConfig.searchPanelBorderRadiusCard ?? defaults.searchPanelBorderRadiusCard,
		defaults.searchPanelBorderRadiusCard
	);
	const searchPanelCardGap = normalizeCssLength(
		rawConfig.searchPanelCardGap ?? defaults.searchPanelCardGap,
		defaults.searchPanelCardGap
	);
	const searchPanelWidth = normalizeCssLength(
		rawConfig.searchPanelWidth ?? defaults.searchPanelWidth,
		defaults.searchPanelWidth
	);
	const creditsPadding = normalizeBoxValue(
		rawConfig.creditsPadding ?? defaults.creditsPadding,
		defaults.creditsPadding as Required<BoxValue>
	);
	const creditsOuterMargin = normalizeBoxValue(
		rawConfig.creditsOuterMargin ?? defaults.creditsOuterMargin,
		defaults.creditsOuterMargin as Required<BoxValue>
	);
	const creditsBackgroundColor = normalizeColor(
		rawConfig.creditsBackgroundColor ?? defaults.creditsBackgroundColor,
		defaults.creditsBackgroundColor
	);
	const creditsForegroundColor = normalizeColor(
		rawConfig.creditsForegroundColor ?? defaults.creditsForegroundColor,
		defaults.creditsForegroundColor
	);
	const creditsBorderRadius = normalizeBorderRadiusValue(
		rawConfig.creditsBorderRadius ?? defaults.creditsBorderRadius,
		defaults.creditsBorderRadius
	);
	const markerLat = normalizeOptionalCoordinate(rawConfig.markerLat, -90, 90);
	const markerLng = normalizeOptionalCoordinate(rawConfig.markerLng, -180, 180);
	const markerContent = typeof rawConfig.markerContent === 'string' ? rawConfig.markerContent : null;
	const markerClassName =
		typeof rawConfig.markerClassName === 'string' ? rawConfig.markerClassName.trim() : '';
	const markerOffsetY = Number.isFinite(Number(rawConfig.markerOffsetY)) ? Number(rawConfig.markerOffsetY) : 0;
	const markerScale =
		Number.isFinite(Number(rawConfig.markerScale)) && Number(rawConfig.markerScale) > 0
			? Number(rawConfig.markerScale)
			: 1;
	const centerOffsetY = Number.isFinite(Number(rawConfig.centerOffsetY)) ? Number(rawConfig.centerOffsetY) : 0;
	const locations = normalizeLocations(rawConfig.locations ?? runtimeConfig.locations);

	let styleTheme = rawConfig.styleTheme || {};

	// If no explicit theme colors but we have a slug, try to resolve from runtime config (editor context)
	if (Object.keys(styleTheme).length === 0 && stylePreset === 'positron' && runtimeConfig.styleThemes) {
		const theme = runtimeConfig.styleThemes.find(t => t.slug === styleThemeSlug) ||
					 runtimeConfig.styleThemes.find(t => t.slug === 'default');
		if (theme) {
			styleTheme = theme.colors;
		}
	}

	return {
		centerLat,
		centerLng,
		zoom,
		collectionId,
		height,
		heightUnit,
		heightCssValue: `${trimNumber(height)}${heightUnit}`,
		stylePreset,
		styleUrl,
		styleTheme,
		styleThemeSlug,
		showZoomControls: Boolean(rawConfig.showZoomControls ?? defaults.showZoomControls),
		allowSearch: Boolean(rawConfig.allowSearch ?? defaults.allowSearch),
		scrollZoom: Boolean(rawConfig.scrollZoom ?? defaults.scrollZoom),
		mobileTwoFingerZoom: Boolean(
			rawConfig.mobileTwoFingerZoom ?? defaults.mobileTwoFingerZoom
		),
		zoomControlsPosition,
		zoomControlsPadding,
		zoomControlsOuterMargin,
		zoomControlsBackgroundColor,
		zoomControlsIconColor,
		zoomControlsBorderRadius,
		zoomControlsBorderColor,
		zoomControlsBorderWidth,
		zoomControlsPlusIcon,
		zoomControlsMinusIcon,
		searchPanelBackgroundPrimary,
		searchPanelBackgroundSecondary,
		searchPanelBackgroundHover,
		searchPanelForegroundPrimary,
		searchPanelForegroundSecondary,
		searchPanelOuterMargin,
		searchPanelBorderRadiusInput,
		searchPanelBorderRadiusCard,
		searchPanelCardGap,
		searchPanelWidth,
		creditsPadding,
		creditsOuterMargin,
		creditsBackgroundColor,
		creditsForegroundColor,
		creditsBorderRadius,
		_isPreview: Boolean(rawConfig._isPreview ?? defaults._isPreview),
		fallbackMessage: rawConfig.fallbackMessage || runtimeConfig.messages?.fallback || FALLBACK_MESSAGE,
		markerLat,
		markerLng,
		markerContent,
		markerClassName,
		markerOffsetY,
		markerScale,
		centerOffsetY,
		locations,
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

function normalizeLocationPoint(value: MapLocationPoint | null | undefined): MapLocationPoint | null {
	if (!value) {
		return null;
	}

	const lat = normalizeOptionalCoordinate(value.lat, -90, 90);
	const lng = normalizeOptionalCoordinate(value.lng, -180, 180);

	if (lat === null || lng === null) {
		return null;
	}

	return { 
		...value,
		lat, 
		lng 
	};
}

function normalizeLocations(
	locations: MapLocationPoint[] | null | undefined
): MapLocationPoint[] {
	if (!Array.isArray(locations)) {
		return [];
	}

	return locations.map(location => normalizeLocationPoint(location)).filter((point): point is MapLocationPoint => point !== null);
}
