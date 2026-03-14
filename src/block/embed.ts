import { normalizeHeightUnit } from '../map/defaults';
import type { MapBlockAttributes, MapRuntimeConfig } from '../types';

export const EMBED_PAYLOAD_VERSION = 1;
export const EMBED_QUERY_PARAM = 'minimal-map-config';

type EmbedAttributes = Omit<MapBlockAttributes, '_isPreview'>;

const EMBED_ATTRIBUTE_KEYS: Array<keyof EmbedAttributes> = [
	'centerLat',
	'centerLng',
	'zoom',
	'collectionId',
	'height',
	'heightUnit',
	'stylePreset',
	'styleThemeSlug',
	'showZoomControls',
	'allowSearch',
	'scrollZoom',
	'mobileTwoFingerZoom',
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

export function createCanonicalEmbedAttributes(attributes: MapBlockAttributes): EmbedAttributes {
	const canonical = {} as EmbedAttributes;

	EMBED_ATTRIBUTE_KEYS.forEach((key) => {
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
	const heightCssValue = `${attributes.height}${normalizeHeightUnit(attributes.heightUnit)}`;

	return `<iframe src="${escapeHtmlAttribute(src)}" title="Minimal Map" loading="lazy" style="width:100%;height:${escapeHtmlAttribute(heightCssValue)};border:0;"></iframe>`;
}
