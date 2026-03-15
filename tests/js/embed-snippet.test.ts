import { describe, expect, test } from 'bun:test';
import {
	buildEmbedUrl,
	buildIframeSnippet,
	createEmbedPayload,
} from '../../src/block/embed';
import type { MapBlockAttributes, MapRuntimeConfig } from '../../src/types';

function createAttributes(overrides: Partial<MapBlockAttributes> = {}): MapBlockAttributes {
	return {
		centerLat: 52.517,
		centerLng: 13.388,
		zoom: 9.5,
		collectionId: 0,
		height: 420,
		heightUnit: 'px',
		heightMobile: undefined,
		heightMobileUnit: undefined,
		stylePreset: 'liberty',
		styleThemeSlug: 'default',
		showZoomControls: true,
		allowSearch: true,
		googleMapsNavigation: false,
		scrollZoom: false,
		mobileTwoFingerZoom: false,
		zoomControlsPosition: 'top-right',
		zoomControlsPadding: {
			top: '8px',
			right: '8px',
			bottom: '8px',
			left: '8px',
		},
		zoomControlsOuterMargin: {
			top: '16px',
			right: '16px',
			bottom: '16px',
			left: '16px',
		},
		zoomControlsBackgroundColor: '#ffffff',
		zoomControlsIconColor: '#1e1e1e',
		zoomControlsBorderRadius: '2px',
		zoomControlsBorderColor: '#dcdcde',
		zoomControlsBorderWidth: '1px',
		zoomControlsPlusIcon: 'plus',
		zoomControlsMinusIcon: 'line-solid',
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
		googleMapsButtonPadding: {
			top: '5px',
			right: '8px',
			bottom: '5px',
			left: '8px',
		},
		googleMapsButtonBackgroundColor: '#f0f0f1',
		googleMapsButtonForegroundColor: '#1e1e1e',
		googleMapsButtonBorderRadius: '18px',
		googleMapsButtonShowIcon: true,
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
		...overrides,
	};
}

const runtimeConfig: MapRuntimeConfig = {
	embedBaseUrl: 'https://example.com/?minimal-map-iframe=1',
};

describe('iframe embed snippet', () => {
	test('creates a versioned canonical embed payload in stable key order', () => {
		const payload = createEmbedPayload(
			createAttributes({
				zoom: 12,
				height: 480,
				heightMobile: 320,
				heightMobileUnit: 'px',
			})
		);

		expect(JSON.stringify(payload)).toBe(
			'{"v":1,"attributes":{"centerLat":52.517,"centerLng":13.388,"zoom":12,"collectionId":0,"height":480,"heightUnit":"px","heightMobile":320,"heightMobileUnit":"px","stylePreset":"liberty","styleThemeSlug":"default","showZoomControls":true,"allowSearch":true,"googleMapsNavigation":false,"scrollZoom":false,"mobileTwoFingerZoom":false,"zoomControlsPosition":"top-right","zoomControlsPadding":{"top":"8px","right":"8px","bottom":"8px","left":"8px"},"zoomControlsOuterMargin":{"top":"16px","right":"16px","bottom":"16px","left":"16px"},"zoomControlsBackgroundColor":"#ffffff","zoomControlsIconColor":"#1e1e1e","zoomControlsBorderRadius":"2px","zoomControlsBorderColor":"#dcdcde","zoomControlsBorderWidth":"1px","zoomControlsPlusIcon":"plus","zoomControlsMinusIcon":"line-solid","searchPanelBackgroundPrimary":"#ffffff","searchPanelBackgroundSecondary":"#f0f0f1","searchPanelBackgroundHover":"#f8f8f8","searchPanelForegroundPrimary":"#1e1e1e","searchPanelForegroundSecondary":"#1e1e1e","searchPanelOuterMargin":{"top":"24px","right":"24px","bottom":"24px","left":"24px"},"searchPanelBorderRadiusInput":"10px","searchPanelBorderRadiusCard":"2px","searchPanelCardGap":"12px","searchPanelWidth":"320px","googleMapsButtonPadding":{"top":"5px","right":"8px","bottom":"5px","left":"8px"},"googleMapsButtonBackgroundColor":"#f0f0f1","googleMapsButtonForegroundColor":"#1e1e1e","googleMapsButtonBorderRadius":"18px","googleMapsButtonShowIcon":true,"creditsPadding":{"top":"4px","right":"8px","bottom":"4px","left":"8px"},"creditsOuterMargin":{"top":"16px","right":"16px","bottom":"16px","left":"16px"},"creditsBackgroundColor":"#ffffff","creditsForegroundColor":"#1e1e1e","creditsBorderRadius":"999px"}}'
		);
	});

	test('builds the public embed url from the configured base url', () => {
		const url = buildEmbedUrl(createAttributes({ height: 500 }), runtimeConfig);
		const parsedUrl = new URL(url);

		expect(parsedUrl.searchParams.get('minimal-map-iframe')).toBe('1');
		expect(parsedUrl.searchParams.get('minimal-map-config')).toBeTruthy();
	});

	test('builds the iframe snippet using responsive desktop and mobile heights', () => {
		const snippet = buildIframeSnippet(
			createAttributes({
				height: 55,
				heightUnit: 'vh',
				heightMobile: 320,
				heightMobileUnit: 'px',
			}),
			runtimeConfig
		);

		expect(snippet).toContain('--minimal-map-embed-height:55vh;');
		expect(snippet).toContain('--minimal-map-embed-height-mobile:320px;');
		expect(snippet).toContain('@media (max-width:600px)');
		expect(snippet).toContain('title="Minimal Map"');
	});

	test('updates the embed url when style configuration changes', () => {
		const baseAttributes = createAttributes();
		const modifiedAttributes = createAttributes({
			zoomControlsBackgroundColor: '#112233',
		});

		expect(buildEmbedUrl(baseAttributes, runtimeConfig)).not.toBe(
			buildEmbedUrl(modifiedAttributes, runtimeConfig)
		);
	});
});
