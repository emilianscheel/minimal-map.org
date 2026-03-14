import { afterEach, describe, expect, test } from 'bun:test';
import { JSDOM } from 'jsdom';
import { createWordPressSearchControl } from '../../src/map/SearchControl';
import { createAttributionPill } from '../../src/map/attribution-pill';
import { createWordPressZoomControls } from '../../src/map/wp-controls';
import { getSearchPanelDesktopPadding } from '../../src/map/search-panel-layout';
import { normalizeMapConfig } from '../../src/map/defaults';

const originalGlobals = {
	document: globalThis.document,
	Event: globalThis.Event,
	FocusEvent: globalThis.FocusEvent,
	HTMLElement: globalThis.HTMLElement,
	MouseEvent: globalThis.MouseEvent,
	Node: globalThis.Node,
	navigator: globalThis.navigator,
	window: globalThis.window,
};

function setGlobalDom(dom: JSDOM): void {
	globalThis.window = dom.window as never;
	globalThis.document = dom.window.document as never;
	globalThis.navigator = dom.window.navigator as never;
	globalThis.HTMLElement = dom.window.HTMLElement as never;
	globalThis.Node = dom.window.Node as never;
	globalThis.Event = dom.window.Event as never;
	globalThis.MouseEvent = dom.window.MouseEvent as never;
	globalThis.FocusEvent = dom.window.FocusEvent as never;
}

function createMapHost() {
	const outerDom = new JSDOM('<!doctype html><div id="outer"></div>');
	const iframeDom = new JSDOM('<!doctype html><div id="host"></div>');
	Object.defineProperty(outerDom.window, 'innerWidth', { value: 500, configurable: true });
	Object.defineProperty(iframeDom.window, 'innerWidth', { value: 1024, configurable: true });
	setGlobalDom(outerDom);

	return {
		host: iframeDom.window.document.getElementById('host') as HTMLDivElement,
		iframeDom,
		outerDom,
	};
}

async function flushRender(): Promise<void> {
	await new Promise((resolve) => setTimeout(resolve, 10));
}

afterEach(() => {
	globalThis.window = originalGlobals.window;
	globalThis.document = originalGlobals.document;
	globalThis.navigator = originalGlobals.navigator;
	globalThis.HTMLElement = originalGlobals.HTMLElement;
	globalThis.Node = originalGlobals.Node;
	globalThis.Event = originalGlobals.Event;
	globalThis.MouseEvent = originalGlobals.MouseEvent;
	globalThis.FocusEvent = originalGlobals.FocusEvent;
});

describe('map iframe document context', () => {
	test('creates controls and attribution inside the host document', () => {
		const { host, iframeDom } = createMapHost();
		const config = normalizeMapConfig({
			showZoomControls: true,
		});

		const controls = createWordPressZoomControls(
			host,
			{
				zoomIn() {},
				zoomOut() {},
			} as never,
			config,
		);
		const attribution = createAttributionPill(host, config);

		expect(host.querySelector('.minimal-map-controls')?.ownerDocument).toBe(
			iframeDom.window.document,
		);
		expect(host.querySelector('.minimal-map-attribution')?.ownerDocument).toBe(
			iframeDom.window.document,
		);

		controls.destroy();
		attribution.destroy();
	});

	test('measures desktop padding against the host window instead of the ambient window', () => {
		const { host } = createMapHost();
		const config = normalizeMapConfig({
			searchPanelWidth: '360px',
			searchPanelOuterMargin: {
				top: '10px',
				right: '30px',
				bottom: '18px',
				left: '18px',
			},
		});

		expect(getSearchPanelDesktopPadding(config, host)).toBe(408);
	});

	test('binds outside-click handling to the host document', async () => {
		const { host, iframeDom } = createMapHost();
		let iframeMouseDownBindings = 0;
		let outerMouseDownBindings = 0;
		const originalIframeAddEventListener = iframeDom.window.document.addEventListener.bind(
			iframeDom.window.document,
		);
		const originalOuterAddEventListener = document.addEventListener.bind(document);
		iframeDom.window.document.addEventListener = ((type, listener, options) => {
			if (type === 'mousedown') {
				iframeMouseDownBindings += 1;
			}

			return originalIframeAddEventListener(type, listener, options);
		}) as typeof iframeDom.window.document.addEventListener;
		document.addEventListener = ((type, listener, options) => {
			if (type === 'mousedown') {
				outerMouseDownBindings += 1;
			}

			return originalOuterAddEventListener(type, listener, options);
		}) as typeof document.addEventListener;
		const config = normalizeMapConfig({
			allowSearch: true,
			locations: [{ id: 1, title: 'Berlin', lat: 52.5, lng: 13.4 }],
		});
		const searchControl = createWordPressSearchControl(
			host,
			{
				easeTo() {},
				getZoom() {
					return 10;
				},
			} as never,
			config,
		);

		await flushRender();
		await flushRender();
		expect(iframeMouseDownBindings).toBeGreaterThan(0);
		expect(outerMouseDownBindings).toBe(0);

		searchControl.destroy();
		iframeDom.window.document.addEventListener = originalIframeAddEventListener;
		document.addEventListener = originalOuterAddEventListener;
	});
});
