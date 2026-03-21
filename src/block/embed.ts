import { normalizeHeightUnit } from '../map/defaults';
import { formatHeightCssValue, MOBILE_BREAKPOINT } from '../map/responsive';
import type { MapBlockAttributes, MapRuntimeConfig } from '../types';

export const EMBED_PAYLOAD_VERSION = 1;
export const EMBED_QUERY_PARAM = 'minimal-map-config';

type EmbedAttributes = Omit<MapBlockAttributes, '_isPreview' | 'style'> & {
	borderRadius: string;
};

const EMBED_ATTRIBUTE_KEYS: Array<keyof EmbedAttributes> = [
	'centerLat',
	'centerLng',
	'zoom',
	'collectionId',
	'height',
	'heightUnit',
	'heightMobile',
	'heightMobileUnit',
	'stylePreset',
	'styleThemeSlug',
	'fontFamily',
	'borderRadius',
	'showZoomControls',
	'allowSearch',
	'enableLiveLocationSearch',
	'enableLiveLocationMap',
	'enableCategoryFilter',
	'enableOpenedFilter',
	'googleMapsNavigation',
	'inMapLocationCard',
	'scrollZoom',
	'mobileTwoFingerZoom',
	'cooperativeGestures',
	'zoomControlsPosition',
	'zoomControlsPadding',
	'zoomControlsOuterMargin',
	'zoomControlsBackgroundColor',
	'zoomControlsIconColor',
	'zoomControlsBorderRadius',
	'zoomControlsBorderColor',
	'zoomControlsBorderWidth',
	'zoomControlsPlusIcon',
	'zoomControlsMinusIcon',
	'searchPanelBackgroundPrimary',
	'searchPanelBackgroundSecondary',
	'searchPanelBackgroundHover',
	'searchPanelForegroundPrimary',
	'searchPanelForegroundSecondary',
	'searchPanelOuterMargin',
	'searchPanelBorderRadiusInput',
	'searchPanelBorderRadiusCard',
	'searchPanelCardGap',
	'searchPanelWidth',
	'googleMapsButtonPadding',
	'googleMapsButtonBackgroundColor',
	'googleMapsButtonForegroundColor',
	'googleMapsButtonBorderRadius',
	'googleMapsButtonShowIcon',
	'openingHoursOpenColor',
	'openingHoursClosedColor',
	'openingHoursSoonColor',
	'creditsPadding',
	'creditsOuterMargin',
	'creditsBackgroundColor',
	'creditsForegroundColor',
	'creditsBorderRadius',
];

function encodeBase64Url(value: string): string {
	const bytes = new TextEncoder().encode(value);
	let binary = '';

	bytes.forEach((byte) => {
		binary += String.fromCharCode(byte);
	});

	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/u, '');
}

function escapeHtmlAttribute(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/"/g, '&quot;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
}

function normalizeEmbedBorderRadius(
	value: MapBlockAttributes['style'] extends { border?: { radius?: infer TValue } }
		? TValue
		: unknown
): string {
	if (!value) {
		return '';
	}

	if (typeof value === 'string') {
		return value.trim();
	}

	if (typeof value !== 'object') {
		return '';
	}

	const radius = value as {
		top?: string;
		right?: string;
		bottom?: string;
		left?: string;
		topLeft?: string;
		topRight?: string;
		bottomRight?: string;
		bottomLeft?: string;
	};
	const topLeft = radius.topLeft ?? radius.top ?? '';
	const topRight = radius.topRight ?? radius.right ?? '';
	const bottomRight = radius.bottomRight ?? radius.bottom ?? '';
	const bottomLeft = radius.bottomLeft ?? radius.left ?? '';
	const parts = [topLeft, topRight, bottomRight, bottomLeft]
		.map((part) => part.trim())
		.filter(Boolean);

	return parts.length > 0 ? parts.join(' ') : '';
}

export function createCanonicalEmbedAttributes(attributes: MapBlockAttributes): EmbedAttributes {
	const canonical = {} as EmbedAttributes;

	EMBED_ATTRIBUTE_KEYS.forEach((key) => {
		if (key === 'borderRadius') {
			(canonical as Record<string, unknown>)[key] = normalizeEmbedBorderRadius(
				attributes.style?.border?.radius
			);
			return;
		}

		(canonical as Record<string, unknown>)[key] = attributes[key];
	});

	return canonical;
}

export function createEmbedPayload(attributes: MapBlockAttributes): {
	v: number;
	attributes: EmbedAttributes;
} {
	return {
		v: EMBED_PAYLOAD_VERSION,
		attributes: createCanonicalEmbedAttributes(attributes),
	};
}

export function buildEmbedUrl(
	attributes: MapBlockAttributes,
	runtimeConfig: MapRuntimeConfig
): string {
	if (!runtimeConfig.embedBaseUrl) {
		return '';
	}

	const url = new URL(runtimeConfig.embedBaseUrl);
	url.searchParams.set(
		EMBED_QUERY_PARAM,
		encodeBase64Url(JSON.stringify(createEmbedPayload(attributes)))
	);

	return url.toString();
}

export function buildIframeSnippet(
	attributes: MapBlockAttributes,
	runtimeConfig: MapRuntimeConfig
): string {
	const src = buildEmbedUrl(attributes, runtimeConfig);
	const heightCssValue = formatHeightCssValue(
		attributes.height,
		normalizeHeightUnit(attributes.heightUnit)
	);
	const heightMobileCssValue =
		typeof attributes.heightMobile === 'number' && attributes.heightMobile > 0
			? formatHeightCssValue(
					attributes.heightMobile,
					normalizeHeightUnit(attributes.heightMobileUnit ?? attributes.heightUnit)
				)
			: heightCssValue;

	return `<div class="minimal-map-embed" style="--minimal-map-embed-height:${escapeHtmlAttribute(heightCssValue)};--minimal-map-embed-height-mobile:${escapeHtmlAttribute(heightMobileCssValue)};"><style>.minimal-map-embed{width:100%;}.minimal-map-embed>iframe{display:block;width:100%;height:var(--minimal-map-embed-height);border:0;}@media (max-width:${MOBILE_BREAKPOINT}px){.minimal-map-embed>iframe{height:var(--minimal-map-embed-height-mobile)!important;}}</style><iframe src="${escapeHtmlAttribute(src)}" title="Minimal Map" loading="lazy"></iframe></div>`;
}
