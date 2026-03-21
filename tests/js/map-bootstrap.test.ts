import { describe, expect, test } from 'bun:test';
import { getDefaultFitBoundsPadding } from '../../src/map/default-fit-padding';
import { normalizeMapConfig } from '../../src/map/defaults';
import { syncTouchZoomInteraction } from '../../src/map/interactions';
import { shouldShowFallbackForMapError, syncViewport } from '../../src/map/runtime';
import { getSearchPanelReservedWidth } from '../../src/map/search-panel-layout';
import { getSelectedLocationTopPadding } from '../../src/map/selected-location-focus-padding';

function createTouchZoomRotateSpy() {
	const calls: string[] = [];

	return {
		calls,
		map: {
			touchZoomRotate: {
				enable: () => {
					calls.push('enable');
				},
				disable: () => {
					calls.push('disable');
				},
				disableRotation: () => {
					calls.push('disableRotation');
				},
			},
		},
	};
}

describe('map touch zoom interaction', () => {
	test('does not replace an already rendering map with the WebGL fallback after a runtime error', () => {
		expect(
			shouldShowFallbackForMapError(
				{
					loaded: () => false,
					isStyleLoaded: () => false,
				},
				true
			)
		).toBe(false);
	});

	test('only shows the WebGL fallback for a startup error before the map has loaded any style', () => {
		expect(
			shouldShowFallbackForMapError(
				{
					loaded: () => false,
					isStyleLoaded: () => false,
				},
				false
			)
		).toBe(true);
	});

	test('enables touch zoom and disables rotation when mobile two-finger zoom is on', () => {
		const spy = createTouchZoomRotateSpy();
		const config = normalizeMapConfig({
			mobileTwoFingerZoom: true,
		});

		syncTouchZoomInteraction(spy.map as never, config);

		expect(spy.calls).toEqual([ 'enable', 'disableRotation' ]);
	});

	test('disables touch zoom when mobile two-finger zoom is off', () => {
		const spy = createTouchZoomRotateSpy();
		const config = normalizeMapConfig({
			mobileTwoFingerZoom: false,
		});

		syncTouchZoomInteraction(spy.map as never, config);

		expect(spy.calls).toEqual([ 'disable' ]);
	});

	test('disables touch zoom when the map is non-interactive even if mobile zoom is requested', () => {
		const spy = createTouchZoomRotateSpy();
		const config = normalizeMapConfig({
			interactive: false,
			mobileTwoFingerZoom: true,
		});

		syncTouchZoomInteraction(spy.map as never, config);

		expect(spy.calls).toEqual([ 'disable' ]);
	});

	test('switches from enabled to disabled when the config changes', () => {
		const spy = createTouchZoomRotateSpy();

		syncTouchZoomInteraction(
			spy.map as never,
			normalizeMapConfig({
				mobileTwoFingerZoom: true,
			})
		);
		syncTouchZoomInteraction(
			spy.map as never,
			normalizeMapConfig({
				mobileTwoFingerZoom: false,
			})
		);

		expect(spy.calls).toEqual([ 'enable', 'disableRotation', 'disable' ]);
	});

	test('derives desktop selection padding from the search panel width and outer margins', () => {
		const config = normalizeMapConfig({
			searchPanelWidth: '360px',
			searchPanelOuterMargin: {
				top: '10px',
				right: '30px',
				bottom: '18px',
				left: '18px',
			},
		});

		expect(getSearchPanelReservedWidth(config)).toBe(408);
	});

	test('returns zero desktop selection padding when search is disabled', () => {
		const config = normalizeMapConfig({
			allowSearch: false,
			searchPanelWidth: '360px',
			searchPanelOuterMargin: {
				top: '10px',
				right: '30px',
				bottom: '18px',
				left: '18px',
			},
		});

		expect(getSearchPanelReservedWidth(config)).toBe(0);
	});

	test('uses half of the container width for the tablet search panel split range', () => {
		const config = normalizeMapConfig({
			searchPanelWidth: '360px',
			searchPanelOuterMargin: {
				top: '10px',
				right: '30px',
				bottom: '18px',
				left: '18px',
			},
		});

		expect(getSearchPanelReservedWidth(config, undefined, 800)).toBe(400);
	});

	test('returns the existing 48px fit padding on desktop', () => {
		const config = normalizeMapConfig({
			searchPanelOuterMargin: {
				top: '12px',
				right: '18px',
				bottom: '24px',
				left: '30px',
			},
			creditsOuterMargin: {
				top: '10px',
				right: '14px',
				bottom: '16px',
				left: '20px',
			},
		});

		expect(getDefaultFitBoundsPadding(config, 1024)).toEqual({
			top: 48,
			right: 48,
			bottom: 48,
			left: 48,
		});
	});

	test('adds the reserved tablet search split width to the left fit padding', () => {
		const config = normalizeMapConfig({
			allowSearch: true,
			searchPanelOuterMargin: {
				top: '12px',
				right: '18px',
				bottom: '24px',
				left: '30px',
			},
			creditsOuterMargin: {
				top: '10px',
				right: '14px',
				bottom: '16px',
				left: '20px',
			},
		});

		expect(getDefaultFitBoundsPadding(config, 800, 400)).toEqual({
			top: 48,
			right: 48,
			bottom: 48,
			left: 448,
		});
	});

	test('uses configured mobile top and bottom fit padding when attribution is shown', () => {
		const config = normalizeMapConfig({
			searchPanelOuterMargin: {
				top: '12px',
				right: '18px',
				bottom: '24px',
				left: '30px',
			},
			creditsOuterMargin: {
				top: '10px',
				right: '14px',
				bottom: '14px',
				left: '20px',
			},
			showAttribution: true,
		});

		expect(getDefaultFitBoundsPadding(config, 500)).toEqual({
			top: 60,
			right: 48,
			bottom: 56,
			left: 48,
		});
	});

	test('falls back to 48px mobile bottom fit padding when attribution is hidden', () => {
		const config = normalizeMapConfig({
			searchPanelOuterMargin: {
				top: '12px',
				right: '18px',
				bottom: '24px',
				left: '30px',
			},
			creditsOuterMargin: {
				top: '10px',
				right: '14px',
				bottom: '14px',
				left: '20px',
			},
			showAttribution: false,
		});

		expect(getDefaultFitBoundsPadding(config, 500)).toEqual({
			top: 60,
			right: 48,
			bottom: 48,
			left: 48,
		});
	});

	test('treats non-px mobile fit padding inputs as zero before bottom fallback', () => {
		const config = normalizeMapConfig({
			searchPanelOuterMargin: {
				top: '1rem',
				right: '18px',
				bottom: '24px',
				left: '30px',
			},
			creditsOuterMargin: {
				top: '10px',
				right: '14px',
				bottom: '2rem',
				left: '20px',
			},
			showAttribution: true,
		});

		expect(getDefaultFitBoundsPadding(config, 500)).toEqual({
			top: 0,
			right: 48,
			bottom: 0,
			left: 48,
		});
	});

	test('syncViewport passes the computed mobile fit padding to fitBounds for multi-point maps', () => {
		const fitBoundsCalls: Array<{ padding: unknown }> = [];
		const config = normalizeMapConfig({
			showAttribution: true,
			searchPanelOuterMargin: {
				top: '12px',
				right: '18px',
				bottom: '24px',
				left: '30px',
			},
			creditsOuterMargin: {
				top: '10px',
				right: '14px',
				bottom: '14px',
				left: '20px',
			},
			locations: [
				{ id: 1, title: 'Berlin', lat: 52.52, lng: 13.405 },
				{ id: 2, title: 'Hamburg', lat: 53.5511, lng: 9.9937 },
			],
		});

		syncViewport(
			{
				easeTo() {},
				fitBounds(_bounds, options) {
					fitBoundsCalls.push({ padding: options.padding });
				},
				jumpTo() {},
			} as never,
			config,
			500
		);

		expect(fitBoundsCalls).toEqual([
			{
				padding: {
					top: 60,
					right: 48,
					bottom: 56,
					left: 48,
				},
			},
		]);
	});

	test('syncViewport reserves the tablet search split width in fitBounds padding', () => {
		const fitBoundsCalls: Array<{ padding: unknown }> = [];
		const config = normalizeMapConfig({
			allowSearch: true,
			locations: [
				{ id: 1, title: 'Berlin', lat: 52.52, lng: 13.405 },
				{ id: 2, title: 'Hamburg', lat: 53.5511, lng: 9.9937 },
			],
		});

		syncViewport(
			{
				easeTo() {},
				fitBounds(_bounds, options) {
					fitBoundsCalls.push({ padding: options.padding });
				},
				jumpTo() {},
			} as never,
			config,
			800,
			false,
			[],
			400
		);

		expect(fitBoundsCalls).toEqual([
			{
				padding: {
					top: 48,
					right: 48,
					bottom: 48,
					left: 448,
				},
			},
		]);
	});

	test('syncViewport only includes locations from selected category tags', () => {
		const easeToCalls: Array<{ center: [number, number]; zoom: number }> = [];
		const fitBoundsCalls: Array<{ padding: unknown }> = [];
		const config = normalizeMapConfig({
			enableCategoryFilter: true,
			locations: [
				{
					id: 1,
					title: 'Berlin',
					lat: 52.52,
					lng: 13.405,
					tags: [
						{
							id: 10,
							name: 'Studio',
							background_color: '#000000',
							foreground_color: '#ffffff',
						},
					],
				},
				{
					id: 2,
					title: 'Hamburg',
					lat: 53.5511,
					lng: 9.9937,
					tags: [
						{
							id: 20,
							name: 'Office',
							background_color: '#000000',
							foreground_color: '#ffffff',
						},
					],
				},
			],
		});

		syncViewport(
			{
				easeTo(options) {
					easeToCalls.push({
						center: options.center,
						zoom: options.zoom,
					});
				},
				fitBounds(_bounds, options) {
					fitBoundsCalls.push({ padding: options.padding });
				},
				jumpTo() {},
			} as never,
			config,
			1024,
			false,
			[20]
		);

		expect(fitBoundsCalls).toHaveLength(0);
		expect(easeToCalls).toEqual([
			{
				center: [9.9937, 53.5511],
				zoom: 9.5,
			},
		]);
	});

	test('uses a much larger top padding for mobile selected locations with preview cards', () => {
		const config = normalizeMapConfig({
			inMapLocationCard: true,
		});

		expect(getSelectedLocationTopPadding(config, 500)).toBe(240);
	});

	test('preserves desktop selected-location top padding with preview cards', () => {
		const config = normalizeMapConfig({
			inMapLocationCard: true,
		});

		expect(getSelectedLocationTopPadding(config, 1024)).toBe(160);
	});

	test('keeps the existing smaller mobile top padding when no preview card is shown', () => {
		const config = normalizeMapConfig({
			inMapLocationCard: false,
		});

		expect(getSelectedLocationTopPadding(config, 500)).toBe(80);
	});
});
