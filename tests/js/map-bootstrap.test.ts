import { describe, expect, test } from 'bun:test';
import { normalizeMapConfig } from '../../src/map/defaults';
import { syncTouchZoomInteraction } from '../../src/map/bootstrap';
import { getSearchPanelDesktopPadding } from '../../src/map/search-panel-layout';

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
			searchPanelOuterMargin: {
				top: '10px',
				right: '30px',
				bottom: '18px',
				left: '18px',
			},
		});

		expect(getSearchPanelDesktopPadding(config)).toBe(368);
	});

	test('returns zero desktop selection padding when search is disabled', () => {
		const config = normalizeMapConfig({
			allowSearch: false,
			searchPanelOuterMargin: {
				top: '10px',
				right: '30px',
				bottom: '18px',
				left: '18px',
			},
		});

		expect(getSearchPanelDesktopPadding(config)).toBe(0);
	});
});
