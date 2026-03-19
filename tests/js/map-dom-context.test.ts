import { afterEach, describe, expect, test } from 'bun:test';
import { JSDOM } from 'jsdom';
import { createElement, createRoot, useState } from '@wordpress/element';
import { MapSearchControl, createWordPressSearchControl } from '../../src/map/SearchControl';
import { createAttributionPill } from '../../src/map/attribution-pill';
import { createWordPressZoomControls } from '../../src/map/wp-controls';
import { getSearchPanelDesktopPadding } from '../../src/map/search-panel-layout';
import { normalizeMapConfig } from '../../src/map/defaults';
import type { GeocodeResponse, MapLocationPoint, MapLocationSelection } from '../../src/types';

const originalGlobals = {
	document: globalThis.document,
	Event: globalThis.Event,
	FocusEvent: globalThis.FocusEvent,
	HTMLElement: globalThis.HTMLElement,
	HTMLIFrameElement: globalThis.HTMLIFrameElement,
	KeyboardEvent: globalThis.KeyboardEvent,
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
	globalThis.HTMLIFrameElement = dom.window.HTMLIFrameElement as never;
	globalThis.Node = dom.window.Node as never;
	globalThis.Event = dom.window.Event as never;
	globalThis.MouseEvent = dom.window.MouseEvent as never;
	globalThis.FocusEvent = dom.window.FocusEvent as never;
	globalThis.KeyboardEvent = dom.window.KeyboardEvent as never;
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

function focusInput(input: HTMLInputElement, iframeDom: JSDOM): void {
	input.focus();
	input.dispatchEvent(new iframeDom.window.FocusEvent('focus', { bubbles: true }));
}

function pressEscape(input: HTMLInputElement, iframeDom: JSDOM): void {
	input.dispatchEvent(
		new iframeDom.window.KeyboardEvent('keydown', {
			bubbles: true,
			cancelable: true,
			key: 'Escape',
		})
	);
}

function setInputValue(input: HTMLInputElement, iframeDom: JSDOM, value: string): void {
	const descriptor = Object.getOwnPropertyDescriptor(
		iframeDom.window.HTMLInputElement.prototype,
		'value',
	);

	descriptor?.set?.call(input, value);
	input.dispatchEvent(new iframeDom.window.Event('input', { bubbles: true }));
	input.dispatchEvent(new iframeDom.window.Event('change', { bubbles: true }));
}

function submitSearchForm(host: HTMLDivElement, iframeDom: JSDOM): void {
	const form = host.querySelector('.minimal-map-search__input-wrapper') as HTMLFormElement;

	form.dispatchEvent(new iframeDom.window.Event('submit', { bubbles: true, cancelable: true }));
}

function createAddressSearchControl(
	geocodeSearchFn: (query: string) => Promise<GeocodeResponse>,
	options: {
		enableCategoryFilter?: boolean;
		googleMapsNavigation?: boolean;
		googleMapsButtonShowIcon?: boolean;
		locations?: MapLocationPoint[];
		activeCategoryTagIds?: number[];
		onSelect?: (selection: MapLocationSelection) => void;
		selectedId?: number;
		viewportWidth?: number;
	} = {},
) {
	const dom = new JSDOM('<!doctype html><div id="host"></div>');
	setGlobalDom(dom);
	Object.defineProperty(dom.window, 'innerWidth', {
		value: options.viewportWidth ?? 1024,
		configurable: true,
	});
	Object.defineProperty(dom.window.HTMLElement.prototype, 'scrollIntoView', {
		value() {},
		configurable: true,
	});
	Object.defineProperty(dom.window.HTMLElement.prototype, 'attachEvent', {
		value() {},
		configurable: true,
	});
	Object.defineProperty(dom.window.HTMLElement.prototype, 'detachEvent', {
		value() {},
		configurable: true,
	});

	const host = dom.window.document.getElementById('host') as HTMLDivElement;
	const root = createRoot(host);
	const {
		googleMapsNavigation = false,
		googleMapsButtonShowIcon = true,
		enableCategoryFilter = false,
		locations = [
			{
				id: 1,
				title: 'Berlin Studio',
				lat: 52.52,
				lng: 13.405,
				city: 'Berlin',
			},
			{
				id: 2,
				title: 'Hamburg Office',
				lat: 53.5511,
				lng: 9.9937,
				city: 'Hamburg',
			},
		],
		onSelect = () => {},
		activeCategoryTagIds = [],
		selectedId,
	} = options;

	const SearchControlHarness = ({ selectedId: harnessSelectedId }: { selectedId?: number }) => {
		const [activeTags, setActiveTags] = useState<number[]>(activeCategoryTagIds);

		return createElement(MapSearchControl, {
			activeCategoryTagIds: activeTags,
			doc: dom.window.document,
			enableCategoryFilter,
			frontendGeocodePath: '/minimal-map/v1/frontend-geocode',
			geocodeSearch: geocodeSearchFn,
			googleMapsNavigation,
			googleMapsButtonShowIcon,
			locations,
			onCategoryFilterChange: setActiveTags,
			onSelect,
			selectedId: harnessSelectedId,
			siteLocale: 'en-US',
			siteTimezone: 'Europe/Berlin',
		});
	};

	root.render(createElement(SearchControlHarness, { selectedId }));

	return {
		host,
		iframeDom: dom,
		searchControl: {
			destroy() {
				root.unmount();
			},
			update(nextSelectedId?: number) {
				root.render(createElement(SearchControlHarness, { selectedId: nextSelectedId }));
			},
		},
	};
}

afterEach(() => {
	globalThis.window = originalGlobals.window;
	globalThis.document = originalGlobals.document;
	globalThis.navigator = originalGlobals.navigator;
	globalThis.HTMLElement = originalGlobals.HTMLElement;
	globalThis.HTMLIFrameElement = originalGlobals.HTMLIFrameElement;
	globalThis.Node = originalGlobals.Node;
	globalThis.Event = originalGlobals.Event;
	globalThis.MouseEvent = originalGlobals.MouseEvent;
	globalThis.FocusEvent = originalGlobals.FocusEvent;
	globalThis.KeyboardEvent = originalGlobals.KeyboardEvent;
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
			config,
			undefined,
		);

		await flushRender();
		await flushRender();
		expect(iframeMouseDownBindings).toBeGreaterThan(0);
		expect(outerMouseDownBindings).toBe(0);

		searchControl.destroy();
		iframeDom.window.document.addEventListener = originalIframeAddEventListener;
		document.addEventListener = originalOuterAddEventListener;
	});

	test('renders postal code in search result addresses', async () => {
		const { host, iframeDom } = createMapHost();
		Object.defineProperty(iframeDom.window.HTMLElement.prototype, 'scrollIntoView', {
			value() {},
			configurable: true,
		});
		const config = normalizeMapConfig({
			allowSearch: true,
			locations: [
				{
					id: 1,
					title: 'Berlin Studio',
					lat: 52.5,
					lng: 13.4,
					street: 'Unter den Linden',
					house_number: '7',
					postal_code: '10117',
					city: 'Berlin',
				},
			],
		});
		const searchControl = createWordPressSearchControl(
			host,
			config,
			undefined,
			1,
		);

		await flushRender();
		await flushRender();

		const address = host.querySelector('.minimal-map-search__result-address-content');
		expect(address?.textContent).toContain('Unter den Linden 7, 10117 Berlin');

		searchControl.destroy();
	});

	test('renders unique category pills from the current map tags in name order', async () => {
		const { host, searchControl } = createAddressSearchControl(async () => ({
			success: true,
			label: 'Berlin',
			lat: 52.52,
			lng: 13.405,
		}), {
			enableCategoryFilter: true,
			locations: [
				{
					id: 1,
					title: 'Berlin Studio',
					lat: 52.52,
					lng: 13.405,
					tags: [
						{ id: 2, name: 'Office', background_color: '#000', foreground_color: '#fff' },
						{ id: 1, name: 'Cafe', background_color: '#000', foreground_color: '#fff' },
					],
				},
				{
					id: 2,
					title: 'Hamburg Office',
					lat: 53.5511,
					lng: 9.9937,
					tags: [
						{ id: 2, name: 'Office', background_color: '#000', foreground_color: '#fff' },
					],
				},
			],
		});

		await flushRender();
		await flushRender();

		const pills = Array.from(
			host.querySelectorAll('.minimal-map-search__category-pill')
		).map((pill) => pill.textContent?.trim());

		expect(pills).toEqual([ 'Cafe', 'Office' ]);

		searchControl.destroy();
	});

	test('filters search results with category pills and allows deselection', async () => {
		const { host, iframeDom, searchControl } = createAddressSearchControl(
			async () => ({
				success: true,
				label: 'Berlin',
				lat: 52.52,
				lng: 13.405,
			}),
			{
				enableCategoryFilter: true,
				locations: [
					{
						id: 1,
						title: 'Berlin Studio',
						lat: 52.52,
						lng: 13.405,
						tags: [
							{ id: 10, name: 'Studio', background_color: '#000', foreground_color: '#fff' },
						],
					},
					{
						id: 2,
						title: 'Hamburg Office',
						lat: 53.5511,
						lng: 9.9937,
						tags: [
							{ id: 20, name: 'Office', background_color: '#000', foreground_color: '#fff' },
						],
					},
					{
						id: 3,
						title: 'Munich Untagged',
						lat: 48.1374,
						lng: 11.5755,
					},
				],
			}
		);

		await flushRender();
		await flushRender();

		const clickPill = (label: string) => {
			const pill = Array.from(
				host.querySelectorAll<HTMLButtonElement>('.minimal-map-search__category-pill')
			).find((candidate) => candidate.textContent?.trim() === label);

			if (!pill) {
				throw new Error(`Missing category pill: ${label}`);
			}

			pill.click();
		};

		clickPill('Office');
		await flushRender();
		await flushRender();

		expect(
			Array.from(
				host.querySelectorAll<HTMLButtonElement>('.minimal-map-search__category-pill')
			).find((pill) => pill.textContent?.trim() === 'Office')?.getAttribute('aria-pressed')
		).toBe('true');

		const input = host.querySelector('.minimal-map-search__input') as HTMLInputElement;
		focusInput(input, iframeDom);
		await flushRender();
		await flushRender();

		expect(host.querySelectorAll('.minimal-map-search__result-item')).toHaveLength(1);
		expect(host.textContent).toContain('Hamburg Office');
		expect(host.textContent).not.toContain('Berlin Studio');
		expect(host.textContent).not.toContain('Munich Untagged');

		(host.querySelector('.minimal-map-search-backdrop') as HTMLDivElement).click();
		await flushRender();
		await flushRender();

		clickPill('Studio');
		await flushRender();
		await flushRender();

		clickPill('Office');
		await flushRender();
		await flushRender();

		const reopenedInput = host.querySelector(
			'.minimal-map-search__input'
		) as HTMLInputElement;
		reopenedInput.blur();
		focusInput(reopenedInput, iframeDom);
		await flushRender();
		await flushRender();

		expect(host.querySelectorAll('.minimal-map-search__result-item')).toHaveLength(1);
		expect(host.textContent).toContain('Berlin Studio');
		expect(host.textContent).not.toContain('Hamburg Office');

		(host.querySelector('.minimal-map-search-backdrop') as HTMLDivElement).click();
		await flushRender();
		await flushRender();

		clickPill('Studio');
		await flushRender();
		await flushRender();

		const restoredInput = host.querySelector(
			'.minimal-map-search__input'
		) as HTMLInputElement;
		restoredInput.blur();
		focusInput(restoredInput, iframeDom);
		await flushRender();
		await flushRender();

		expect(host.querySelectorAll('.minimal-map-search__result-item')).toHaveLength(3);

		searchControl.destroy();
	});

	test('supports OR matching when multiple category pills are selected', async () => {
		const { host, iframeDom, searchControl } = createAddressSearchControl(
			async () => ({
				success: true,
				label: 'Berlin',
				lat: 52.52,
				lng: 13.405,
			}),
			{
				enableCategoryFilter: true,
				activeCategoryTagIds: [10, 20],
				locations: [
					{
						id: 1,
						title: 'Berlin Studio',
						lat: 52.52,
						lng: 13.405,
						tags: [
							{ id: 10, name: 'Studio', background_color: '#000', foreground_color: '#fff' },
						],
					},
					{
						id: 2,
						title: 'Hamburg Office',
						lat: 53.5511,
						lng: 9.9937,
						tags: [
							{ id: 20, name: 'Office', background_color: '#000', foreground_color: '#fff' },
						],
					},
					{
						id: 3,
						title: 'Munich Untagged',
						lat: 48.1374,
						lng: 11.5755,
					},
				],
			}
		);

		await flushRender();
		await flushRender();

		const input = host.querySelector('.minimal-map-search__input') as HTMLInputElement;
		focusInput(input, iframeDom);
		await flushRender();
		await flushRender();

		expect(host.querySelectorAll('.minimal-map-search__result-item')).toHaveLength(2);
		expect(host.textContent).toContain('Berlin Studio');
		expect(host.textContent).toContain('Hamburg Office');
		expect(host.textContent).not.toContain('Munich Untagged');

		searchControl.destroy();
	});

	test('hides the category pill row while the search panel is open', async () => {
		const { host, iframeDom, searchControl } = createAddressSearchControl(
			async () => ({
				success: true,
				label: 'Berlin',
				lat: 52.52,
				lng: 13.405,
			}),
			{
				enableCategoryFilter: true,
				locations: [
					{
						id: 1,
						title: 'Berlin Studio',
						lat: 52.52,
						lng: 13.405,
						tags: [
							{ id: 10, name: 'Studio', background_color: '#000', foreground_color: '#fff' },
						],
					},
				],
			}
		);

		await flushRender();
		await flushRender();

		expect(host.querySelector('.minimal-map-search__category-filters')).not.toBeNull();

		const input = host.querySelector('.minimal-map-search__input') as HTMLInputElement;
		focusInput(input, iframeDom);
		await flushRender();
		await flushRender();

		expect(host.querySelector('.minimal-map-search__category-filters')).toBeNull();

		searchControl.destroy();
	});

	test('shows the address prompt for zero text matches without showing a no-results message', async () => {
		const { host, iframeDom, searchControl } = createAddressSearchControl(async () => ({
			success: true,
			label: 'Berlin',
			lat: 52.52,
			lng: 13.405,
		}));

		await flushRender();
		await flushRender();

		const input = host.querySelector('.minimal-map-search__input') as HTMLInputElement;

		focusInput(input, iframeDom);
		setInputValue(input, iframeDom, '1600 Pennsylvania Avenue');
		await flushRender();
		await flushRender();

		expect(host.querySelector('.minimal-map-search__state-spinner')).not.toBeNull();
		expect(host.textContent).toContain('Press');
		expect(host.textContent).toContain('Enter');
		expect(host.textContent).toContain('to load results');
		expect(host.textContent).not.toContain('No locations found');

		searchControl.destroy();
	});

	test('only geocodes on Enter when the text search has zero matches', async () => {
		const calls: string[] = [];
		const { host, iframeDom, searchControl } = createAddressSearchControl(async (query) => {
			calls.push(query);

			return {
				success: true,
				label: 'Berlin',
				lat: 52.52,
				lng: 13.405,
			};
		});

		await flushRender();
		await flushRender();

		const input = host.querySelector('.minimal-map-search__input') as HTMLInputElement;

		focusInput(input, iframeDom);
		setInputValue(input, iframeDom, 'Berlin');
		await flushRender();
		submitSearchForm(host, iframeDom);
		await flushRender();

		setInputValue(input, iframeDom, '1600 Pennsylvania Avenue');
		await flushRender();
		submitSearchForm(host, iframeDom);
		await flushRender();
		await flushRender();

		expect(calls).toEqual([ '1600 Pennsylvania Avenue' ]);

		searchControl.destroy();
	});

	test('renders distance-sorted address results with formatted distance labels', async () => {
		const selections: Array<{ distanceLabel?: string; title: string }> = [];
		const { host, iframeDom, searchControl } = createAddressSearchControl(
			async () => ({
				success: true,
				label: 'Berlin',
				lat: 52.52,
				lng: 13.405,
			}),
			{
				onSelect: (selection) => {
					selections.push({
						distanceLabel: selection.distanceLabel,
						title: selection.location.title ?? '',
					});
				},
			},
		);

		await flushRender();
		await flushRender();

		const input = host.querySelector('.minimal-map-search__input') as HTMLInputElement;

		focusInput(input, iframeDom);
		setInputValue(input, iframeDom, '1600 Pennsylvania Avenue');
		await flushRender();
		submitSearchForm(host, iframeDom);
		await flushRender();
		await flushRender();
		await flushRender();
		await flushRender();

		const titles = Array.from(host.querySelectorAll('.minimal-map-search__result-title')).map(
			(element) => element.textContent,
		);
		const distances = Array.from(host.querySelectorAll('.minimal-map-search__result-distance')).map(
			(element) => element.textContent,
		);
		const selectedResult = host.querySelector('.minimal-map-search__result-item.is-selected');

		expect(titles).toEqual([ 'Berlin Studio', 'Hamburg Office' ]);
		expect(distances[0]).toBe('0 m away');
		expect(distances[1]).toContain('km away');
		expect(selectedResult?.querySelector('.minimal-map-search__result-title')?.textContent).toBe(
			'Berlin Studio',
		);
		expect(selections).toEqual([
			{
				distanceLabel: '0 m',
				title: 'Berlin Studio',
			},
		]);

		searchControl.destroy();
	});

	test('closes the search panel on mobile after tapping a result card and still selects the location', async () => {
		const selections: Array<{ title: string }> = [];
		const { host, iframeDom, searchControl } = createAddressSearchControl(async () => ({
			success: true,
			label: 'Berlin',
			lat: 52.52,
			lng: 13.405,
		}), {
			onSelect: (selection) => {
				selections.push({
					title: selection.location.title ?? '',
				});
			},
			viewportWidth: 500,
		});

		await flushRender();
		await flushRender();

		const input = host.querySelector('.minimal-map-search__input') as HTMLInputElement;
		focusInput(input, iframeDom);
		await flushRender();

		const resultButton = host.querySelector(
			'.minimal-map-search__result-select'
		) as HTMLButtonElement;
		resultButton.click();
		await flushRender();
		await flushRender();

		expect(selections).toEqual([{ title: 'Berlin Studio' }]);
		expect(host.querySelector('.minimal-map-search-backdrop')).toBeNull();
		expect(host.querySelector('.minimal-map-search__results-container')).toBeNull();

		searchControl.destroy();
	});

	test('keeps the search panel open on desktop after tapping a result card', async () => {
		const { host, iframeDom, searchControl } = createAddressSearchControl(async () => ({
			success: true,
			label: 'Berlin',
			lat: 52.52,
			lng: 13.405,
		}), {
			viewportWidth: 1024,
		});

		await flushRender();
		await flushRender();

		const input = host.querySelector('.minimal-map-search__input') as HTMLInputElement;
		focusInput(input, iframeDom);
		await flushRender();

		const resultButton = host.querySelector(
			'.minimal-map-search__result-select'
		) as HTMLButtonElement;
		resultButton.click();
		await flushRender();
		await flushRender();

		expect(host.querySelector('.minimal-map-search-backdrop')).not.toBeNull();
		expect(host.querySelector('.minimal-map-search__results-container')).not.toBeNull();

		searchControl.destroy();
	});

	test('keeps the mobile panel open after address-search auto-selection', async () => {
		const { host, iframeDom, searchControl } = createAddressSearchControl(
			async () => ({
				success: true,
				label: 'Berlin',
				lat: 52.52,
				lng: 13.405,
			}),
			{
				viewportWidth: 500,
			},
		);

		await flushRender();
		await flushRender();

		const input = host.querySelector('.minimal-map-search__input') as HTMLInputElement;
		focusInput(input, iframeDom);
		setInputValue(input, iframeDom, '1600 Pennsylvania Avenue');
		await flushRender();
		submitSearchForm(host, iframeDom);
		await flushRender();
		await flushRender();
		await flushRender();
		await flushRender();

		expect(host.querySelector('.minimal-map-search-backdrop')).not.toBeNull();
		expect(host.querySelector('.minimal-map-search__results-container')).not.toBeNull();
		expect(host.querySelector('.minimal-map-search__result-item.is-selected')).not.toBeNull();

		searchControl.destroy();
	});

	test('does not reopen a mobile-closed panel on selectedId updates alone', async () => {
		const { host, iframeDom, searchControl } = createAddressSearchControl(async () => ({
			success: true,
			label: 'Berlin',
			lat: 52.52,
			lng: 13.405,
		}), {
			viewportWidth: 500,
		});

		await flushRender();
		await flushRender();

		const input = host.querySelector('.minimal-map-search__input') as HTMLInputElement;
		focusInput(input, iframeDom);
		await flushRender();

		const resultButton = host.querySelector(
			'.minimal-map-search__result-select'
		) as HTMLButtonElement;
		resultButton.click();
		await flushRender();
		await flushRender();

		searchControl.update(1);
		await flushRender();
		await flushRender();

		expect(host.querySelector('.minimal-map-search-backdrop')).toBeNull();
		expect(host.querySelector('.minimal-map-search__results-container')).toBeNull();

		searchControl.destroy();
	});

	test('closes the focused search panel and blurs the input on Escape even with a desktop selection', async () => {
		const { host, iframeDom, searchControl } = createAddressSearchControl(
			async () => ({
				success: true,
				label: 'Berlin',
				lat: 52.52,
				lng: 13.405,
			}),
			{
				selectedId: 1,
				viewportWidth: 1024,
			},
		);

		await flushRender();
		await flushRender();

		const input = host.querySelector('.minimal-map-search__input') as HTMLInputElement;
		focusInput(input, iframeDom);
		await flushRender();
		await flushRender();

		expect(host.querySelector('.minimal-map-search__results-container')).not.toBeNull();
		expect(host.ownerDocument.activeElement).toBe(input);

		pressEscape(input, iframeDom);
		await flushRender();
		await flushRender();

		expect(host.querySelector('.minimal-map-search-backdrop')).toBeNull();
		expect(host.querySelector('.minimal-map-search__results-container')).toBeNull();
		expect(host.ownerDocument.activeElement).not.toBe(input);

		searchControl.destroy();
	});

	test('renders the Google Maps button only when navigation is enabled', async () => {
		const disabledControl = createAddressSearchControl(async () => ({
			success: true,
			label: 'Berlin',
			lat: 52.52,
			lng: 13.405,
		}));

		await flushRender();
		await flushRender();
		let input = disabledControl.host.querySelector(
			'.minimal-map-search__input',
		) as HTMLInputElement;
		focusInput(input, disabledControl.iframeDom);
		setInputValue(input, disabledControl.iframeDom, '1600 Pennsylvania Avenue');
		await flushRender();
		submitSearchForm(disabledControl.host, disabledControl.iframeDom);
		await flushRender();
		await flushRender();
		await flushRender();
		await flushRender();

		expect(disabledControl.host.querySelector('.minimal-map-search__maps-link')).toBeNull();
		disabledControl.searchControl.destroy();

		const enabledControl = createAddressSearchControl(
			async () => ({
				success: true,
				label: 'Berlin',
				lat: 52.52,
				lng: 13.405,
			}),
			{
				googleMapsNavigation: true,
			},
		);

		await flushRender();
		await flushRender();
		input = enabledControl.host.querySelector(
			'.minimal-map-search__input',
		) as HTMLInputElement;
		focusInput(input, enabledControl.iframeDom);
		setInputValue(input, enabledControl.iframeDom, '1600 Pennsylvania Avenue');
		await flushRender();
		submitSearchForm(enabledControl.host, enabledControl.iframeDom);
		await flushRender();
		await flushRender();
		await flushRender();
		await flushRender();

		expect(
			enabledControl.host.querySelector('.minimal-map-search__maps-link'),
		).not.toBeNull();

		enabledControl.searchControl.destroy();
	});

	test('renders the Google Maps button for coordinate results even without tags', async () => {
		const { host, iframeDom, searchControl } = createAddressSearchControl(
			async () => ({
				success: true,
				label: 'Berlin',
				lat: 52.52,
				lng: 13.405,
			}),
			{
				googleMapsNavigation: true,
				locations: [
					{
						id: 1,
						title: 'Berlin Studio',
						lat: 52.52,
						lng: 13.405,
						city: 'Berlin',
					},
				],
			},
		);

		await flushRender();
		await flushRender();

		const input = host.querySelector('.minimal-map-search__input') as HTMLInputElement;
		focusInput(input, iframeDom);
		setInputValue(input, iframeDom, '1600 Pennsylvania Avenue');
		await flushRender();
		submitSearchForm(host, iframeDom);
		await flushRender();
		await flushRender();
		await flushRender();
		await flushRender();

		expect(host.querySelector('.minimal-map-search__result-tags')).toBeNull();
		expect(host.querySelector('.minimal-map-search__maps-link')?.textContent).toContain(
			'Open in Google Maps',
		);

		searchControl.destroy();
	});

	test('uses the Google Maps directions url and safe link attributes', async () => {
		const { host, iframeDom, searchControl } = createAddressSearchControl(
			async () => ({
				success: true,
				label: 'Berlin',
				lat: 52.52,
				lng: 13.405,
			}),
			{
				googleMapsNavigation: true,
			},
		);

		await flushRender();
		await flushRender();

		const input = host.querySelector('.minimal-map-search__input') as HTMLInputElement;
		focusInput(input, iframeDom);
		setInputValue(input, iframeDom, '1600 Pennsylvania Avenue');
		await flushRender();
		submitSearchForm(host, iframeDom);
		await flushRender();
		await flushRender();
		await flushRender();
		await flushRender();

		const link = host.querySelector('.minimal-map-search__maps-link') as HTMLAnchorElement;

		expect(link.href).toBe(
			'https://www.google.com/maps/dir/?api=1&destination=52.52%2C13.405',
		);
		expect(link.target).toBe('_blank');
		expect(link.rel).toBe('noreferrer noopener');

		searchControl.destroy();
	});

	test('toggles the Google Maps icon independently from the button label', async () => {
		const hiddenIconControl = createAddressSearchControl(
			async () => ({
				success: true,
				label: 'Berlin',
				lat: 52.52,
				lng: 13.405,
			}),
			{
				googleMapsNavigation: true,
				googleMapsButtonShowIcon: false,
			},
		);
		await flushRender();
		await flushRender();
		let input = hiddenIconControl.host.querySelector(
			'.minimal-map-search__input',
		) as HTMLInputElement;
		focusInput(input, hiddenIconControl.iframeDom);
		setInputValue(input, hiddenIconControl.iframeDom, '1600 Pennsylvania Avenue');
		await flushRender();
		submitSearchForm(hiddenIconControl.host, hiddenIconControl.iframeDom);
		await flushRender();
		await flushRender();
		await flushRender();
		await flushRender();

		expect(
			hiddenIconControl.host.querySelector('.minimal-map-search__maps-link svg'),
		).toBeNull();
		hiddenIconControl.searchControl.destroy();

		const visibleIconControl = createAddressSearchControl(
			async () => ({
				success: true,
				label: 'Berlin',
				lat: 52.52,
				lng: 13.405,
			}),
			{
				googleMapsNavigation: true,
				googleMapsButtonShowIcon: true,
			},
		);

		await flushRender();
		await flushRender();
		input = visibleIconControl.host.querySelector(
			'.minimal-map-search__input',
		) as HTMLInputElement;
		focusInput(input, visibleIconControl.iframeDom);
		setInputValue(input, visibleIconControl.iframeDom, '1600 Pennsylvania Avenue');
		await flushRender();
		submitSearchForm(visibleIconControl.host, visibleIconControl.iframeDom);
		await flushRender();
		await flushRender();
		await flushRender();
		await flushRender();

		expect(
			visibleIconControl.host.querySelector('.minimal-map-search__maps-link svg'),
		).not.toBeNull();

		visibleIconControl.searchControl.destroy();
	});

	test('keeps the distance label separate from the footer action cluster', async () => {
		const { host, iframeDom, searchControl } = createAddressSearchControl(
			async () => ({
				success: true,
				label: 'Berlin',
				lat: 52.52,
				lng: 13.405,
			}),
			{
				googleMapsNavigation: true,
			},
		);

		await flushRender();
		await flushRender();

		const input = host.querySelector('.minimal-map-search__input') as HTMLInputElement;
		focusInput(input, iframeDom);
		setInputValue(input, iframeDom, '1600 Pennsylvania Avenue');
		await flushRender();
		submitSearchForm(host, iframeDom);
		await flushRender();
		await flushRender();
		await flushRender();
		await flushRender();

		const footer = host.querySelector('.minimal-map-search__result-footer');
		const footerContent = host.querySelector(
			'.minimal-map-search__result-footer-content',
		);
		const distance = host.querySelector('.minimal-map-search__result-distance');

		expect(footerContent?.querySelector('.minimal-map-search__maps-link')).not.toBeNull();
		expect(footerContent?.querySelector('.minimal-map-search__result-distance')).toBeNull();
		expect(footer?.contains(distance as Node)).toBe(true);

		searchControl.destroy();
	});

	test('shows the centered empty state when geocoding returns no coordinates', async () => {
		const { host, iframeDom, searchControl } = createAddressSearchControl(async () => ({
			success: false,
			message: 'No coordinates',
		}));

		await flushRender();
		await flushRender();

		const input = host.querySelector('.minimal-map-search__input') as HTMLInputElement;

		focusInput(input, iframeDom);
		setInputValue(input, iframeDom, '1600 Pennsylvania Avenue');
		await flushRender();
		submitSearchForm(host, iframeDom);
		await flushRender();
		await flushRender();
		await flushRender();
		await flushRender();

		expect(host.querySelector('.minimal-map-search__state-icon')).not.toBeNull();
		expect(host.textContent).toContain('No locations found');

		searchControl.destroy();
	});
});
