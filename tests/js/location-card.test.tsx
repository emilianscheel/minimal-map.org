import { afterEach, describe, expect, test } from 'bun:test';
import { JSDOM } from 'jsdom';
import { createElement, createRoot } from '@wordpress/element';
import { LiveLocationResultCard, LocationResultCard } from '../../src/map/location-card';

const originalGlobals = {
	document: globalThis.document,
	HTMLElement: globalThis.HTMLElement,
	navigator: globalThis.navigator,
	window: globalThis.window,
};

function setGlobalDom(dom: JSDOM): void {
	globalThis.window = dom.window as never;
	globalThis.document = dom.window.document as never;
	globalThis.navigator = dom.window.navigator as never;
	globalThis.HTMLElement = dom.window.HTMLElement as never;
}

async function flushRender(): Promise<void> {
	await new Promise((resolve) => globalThis.window.setTimeout(resolve, 0));
}

afterEach(() => {
	globalThis.window = originalGlobals.window;
	globalThis.document = originalGlobals.document;
	globalThis.navigator = originalGlobals.navigator;
	globalThis.HTMLElement = originalGlobals.HTMLElement;
});

describe('location result card', () => {
	test('renders the search-card variant with selection button and shared footer content', async () => {
		const dom = new JSDOM('<!doctype html><div id="host"></div>');
		setGlobalDom(dom);
		const host = dom.window.document.getElementById('host') as HTMLDivElement;
		const root = createRoot(host);

	root.render(
		createElement(LocationResultCard, {
			distanceLabel: '500 m',
			googleMapsButtonShowIcon: true,
			googleMapsNavigation: true,
			isSelected: true,
			location: {
				id: 1,
				title: 'Berlin Studio',
				lat: 52.52,
				lng: 13.405,
				city: 'Berlin',
				street: 'Unter den Linden',
				house_number: '7',
				postal_code: '10117',
				telephone: '+49 30 123456',
				email: 'info@example.com',
				website: 'https://example.com',
				opening_hours: {
					monday: {
						open: '00:00',
						close: '23:59',
						lunch_start: '',
						lunch_duration_minutes: 0,
					},
					tuesday: {
						open: '00:00',
						close: '23:59',
						lunch_start: '',
						lunch_duration_minutes: 0,
					},
					wednesday: {
						open: '00:00',
						close: '23:59',
						lunch_start: '',
						lunch_duration_minutes: 0,
					},
					thursday: {
						open: '00:00',
						close: '23:59',
						lunch_start: '',
						lunch_duration_minutes: 0,
					},
					friday: {
						open: '00:00',
						close: '23:59',
						lunch_start: '',
						lunch_duration_minutes: 0,
					},
					saturday: {
						open: '00:00',
						close: '23:59',
						lunch_start: '',
						lunch_duration_minutes: 0,
					},
					sunday: {
						open: '00:00',
						close: '23:59',
						lunch_start: '',
						lunch_duration_minutes: 0,
					},
				},
				opening_hours_notes: 'Seasonal hours apply.',
				tags: [
					{
						id: 1,
							name: 'Cafe',
							background_color: '#000000',
							foreground_color: '#ffffff',
						},
					],
			},
			mode: 'search',
			onSelect() {},
			siteLocale: 'en-US',
			siteTimezone: 'Europe/Berlin',
		}),
	);

		await flushRender();

		expect(host.querySelector('.minimal-map-search__result-select')).not.toBeNull();
		expect(host.querySelector('.minimal-map-search__maps-link')?.textContent).toContain(
			'Open in Google Maps',
		);
		expect(
			host.querySelector('.minimal-map-search__meta-item--link[href="tel:+49 30 123456"]')
		).not.toBeNull();
		expect(
			host.querySelector('.minimal-map-search__meta-item--link[href="mailto:info@example.com"]')
		).not.toBeNull();
		expect(
			host.querySelector('.minimal-map-search__meta-item--link[href="https://example.com"]')
		).not.toBeNull();
		expect(host.querySelector('.minimal-map-search__result-distance')?.textContent).toBe(
			'500 m away',
		);
		expect(host.querySelector('.minimal-map-tag-badge')?.textContent).toBe('Cafe');
		expect(
			host.querySelector('.minimal-map-search__result-opening-hours-trigger')?.textContent
		).toContain('Open - closes 11:59 pm');
		expect(
			host.querySelector('.minimal-map-search__result-opening-hours-trigger')?.tagName
		).toBe('BUTTON');
		expect(
			host
				.querySelector('.minimal-map-search__result-opening-hours-trigger')
				?.classList.contains(
					'minimal-map-search__result-opening-hours-trigger--expandable'
				)
		).toBe(true);

		(
			host.querySelector(
				'.minimal-map-search__result-opening-hours-trigger'
			) as HTMLButtonElement
		).click();
		await flushRender();

		expect(
			host.querySelector('.minimal-map-search__result-opening-hours-panel')?.className
		).toContain('is-open');
		expect(host.textContent).toContain('Monday');
		expect(host.textContent).toContain('Seasonal hours apply.');

		root.unmount();
	});

	test('refreshes the opening-hours status while the card stays mounted', async () => {
		const dom = new JSDOM('<!doctype html><div id="host"></div>');
		setGlobalDom(dom);
		const host = dom.window.document.getElementById('host') as HTMLDivElement;
		const root = createRoot(host);
		const originalDateNow = Date.now;
		const originalSetTimeout = globalThis.setTimeout;
		const originalClearTimeout = globalThis.clearTimeout;
		const scheduledCallbacks: Array<() => void> = [];
		let nextTimerId = 1;
		let nowMs = new Date('2024-03-23T10:00:00Z').getTime();

		Date.now = () => nowMs;
		globalThis.setTimeout = ((callback: TimerHandler) => {
			scheduledCallbacks.push(callback as () => void);
			return nextTimerId++;
		}) as typeof globalThis.setTimeout;
		globalThis.clearTimeout = (() => undefined) as typeof globalThis.clearTimeout;

		try {
			root.render(
				createElement(LocationResultCard, {
					googleMapsButtonShowIcon: true,
					googleMapsNavigation: false,
					location: {
						id: 3,
						title: 'Saturday Cafe',
						lat: 52.52,
						lng: 13.405,
						city: 'Berlin',
						street: 'Market Street',
						house_number: '1',
						postal_code: '10117',
						opening_hours: {
							monday: {
								open: '08:00',
								close: '20:00',
								lunch_start: '',
								lunch_duration_minutes: 0,
							},
							tuesday: {
								open: '08:00',
								close: '20:00',
								lunch_start: '',
								lunch_duration_minutes: 0,
							},
							wednesday: {
								open: '08:00',
								close: '20:00',
								lunch_start: '',
								lunch_duration_minutes: 0,
							},
							thursday: {
								open: '08:00',
								close: '20:00',
								lunch_start: '',
								lunch_duration_minutes: 0,
							},
							friday: {
								open: '08:00',
								close: '20:00',
								lunch_start: '',
								lunch_duration_minutes: 0,
							},
							saturday: {
								open: '08:00',
								close: '11:20',
								lunch_start: '',
								lunch_duration_minutes: 0,
							},
							sunday: {
								open: '',
								close: '',
								lunch_start: '',
								lunch_duration_minutes: 0,
							},
						},
						opening_hours_notes: '',
					},
					mode: 'search',
					siteLocale: 'en-US',
					siteTimezone: 'Europe/Berlin',
				})
			);

			await flushRender();

			expect(host.textContent).toContain('Open - closes 11:20 am');

			nowMs = new Date('2024-03-23T10:01:00Z').getTime();
			scheduledCallbacks[0]?.();
			await flushRender();

			expect(host.textContent).toContain('Open - closes soon 11:20 am');
		} finally {
			Date.now = originalDateNow;
			globalThis.setTimeout = originalSetTimeout;
			globalThis.clearTimeout = originalClearTimeout;
			root.unmount();
		}
	});

	test('renders the in-map variant without the selection button and keeps optional controls configurable', async () => {
		const dom = new JSDOM('<!doctype html><div id="host"></div>');
		setGlobalDom(dom);
		const host = dom.window.document.getElementById('host') as HTMLDivElement;
		const root = createRoot(host);

		root.render(
			createElement(LocationResultCard, {
				googleMapsButtonShowIcon: false,
				googleMapsNavigation: true,
			location: {
				id: 2,
				title: 'Hamburg Office',
				lat: 53.5511,
				lng: 9.9937,
				city: 'Hamburg',
				telephone: '+49 40 987654',
				email: 'hamburg@example.com',
				website: 'https://hamburg.example.com',
			},
			mode: 'in-map',
			siteLocale: 'en-US',
			siteTimezone: 'Europe/Berlin',
		}),
	);

		await flushRender();

		expect(host.querySelector('.minimal-map-search__result-select')).toBeNull();
		expect(host.querySelector('.minimal-map-location-card--in-map')).not.toBeNull();
		expect(host.querySelector('.minimal-map-search__maps-link svg')).toBeNull();
		expect(host.querySelector('.minimal-map-search__result-opening-hours-trigger')).toBeNull();
		expect(
			host.querySelector('.minimal-map-search__meta-item--link[href="tel:+49 40 987654"]')
		).not.toBeNull();
		expect(
			host.querySelector(
				'.minimal-map-search__meta-item--link[href="mailto:hamburg@example.com"]'
			)
		).not.toBeNull();
		expect(
			host.querySelector(
				'.minimal-map-search__meta-item--link[href="https://hamburg.example.com"]'
			)
		).not.toBeNull();

		root.unmount();
	});

	test('renders opening_hours_notes as a fallback when structured opening hours are missing', async () => {
		const dom = new JSDOM('<!doctype html><div id="host"></div>');
		setGlobalDom(dom);
		const host = dom.window.document.getElementById('host') as HTMLDivElement;
		const root = createRoot(host);

		// Test search mode
		root.render(
			createElement(LocationResultCard, {
				googleMapsButtonShowIcon: true,
				googleMapsNavigation: true,
				location: {
					id: 3,
					title: 'Only Notes',
					lat: 52.52,
					lng: 13.405,
					opening_hours_notes: 'Open by appointment only.',
				},
				mode: 'search',
				onSelect() {},
				siteLocale: 'en-US',
				siteTimezone: 'Europe/Berlin',
			})
		);

		await flushRender();

		const triggerSearch = host.querySelector('.minimal-map-search__result-opening-hours-trigger');
		expect(triggerSearch).not.toBeNull();
		expect(triggerSearch?.textContent).toContain('Open by appointment only.');
		expect(triggerSearch?.tagName).toBe('DIV');
		expect(
			triggerSearch?.classList.contains(
				'minimal-map-search__result-opening-hours-trigger--static'
			)
		).toBe(true);
		expect(host.querySelector('.minimal-map-search__result-opening-hours-chevron')).toBeNull();

		// Test in-map mode
		root.render(
			createElement(LocationResultCard, {
				googleMapsButtonShowIcon: true,
				googleMapsNavigation: true,
				location: {
					id: 4,
					title: 'Only Notes In Map',
					lat: 52.52,
					lng: 13.405,
					opening_hours_notes: 'Check website for hours.',
				},
				mode: 'in-map',
				siteLocale: 'en-US',
				siteTimezone: 'Europe/Berlin',
			})
		);

		await flushRender();

		const triggerInMap = host.querySelector('.minimal-map-search__result-opening-hours-trigger');
		expect(triggerInMap).not.toBeNull();
		expect(triggerInMap?.textContent).toContain('Check website for hours.');
		expect(triggerInMap?.tagName).toBe('DIV');
		expect(
			triggerInMap?.classList.contains(
				'minimal-map-search__result-opening-hours-trigger--static'
			)
		).toBe(true);

		root.unmount();
	});

	test('renders structured opening hours as static text in the in-map preview', async () => {
		const dom = new JSDOM('<!doctype html><div id="host"></div>');
		setGlobalDom(dom);
		const host = dom.window.document.getElementById('host') as HTMLDivElement;
		const root = createRoot(host);

		root.render(
			createElement(LocationResultCard, {
				googleMapsButtonShowIcon: true,
				googleMapsNavigation: true,
				location: {
					id: 5,
					title: 'Preview Hours',
					lat: 52.52,
					lng: 13.405,
					opening_hours: {
						monday: {
							open: '00:00',
							close: '23:59',
							lunch_start: '',
							lunch_duration_minutes: 0,
						},
						tuesday: {
							open: '00:00',
							close: '23:59',
							lunch_start: '',
							lunch_duration_minutes: 0,
						},
						wednesday: {
							open: '00:00',
							close: '23:59',
							lunch_start: '',
							lunch_duration_minutes: 0,
						},
						thursday: {
							open: '00:00',
							close: '23:59',
							lunch_start: '',
							lunch_duration_minutes: 0,
						},
						friday: {
							open: '00:00',
							close: '23:59',
							lunch_start: '',
							lunch_duration_minutes: 0,
						},
						saturday: {
							open: '00:00',
							close: '23:59',
							lunch_start: '',
							lunch_duration_minutes: 0,
						},
						sunday: {
							open: '00:00',
							close: '23:59',
							lunch_start: '',
							lunch_duration_minutes: 0,
						},
					},
				},
				mode: 'in-map',
				siteLocale: 'en-US',
				siteTimezone: 'Europe/Berlin',
			})
		);

		await flushRender();

		const trigger = host.querySelector('.minimal-map-search__result-opening-hours-trigger');
		expect(trigger).not.toBeNull();
		expect(trigger?.tagName).toBe('DIV');
		expect(
			trigger?.classList.contains(
				'minimal-map-search__result-opening-hours-trigger--static'
			)
		).toBe(true);
		expect(host.querySelector('.minimal-map-search__result-opening-hours-panel')).toBeNull();
		expect(host.querySelector('.minimal-map-search__result-opening-hours-chevron')).toBeNull();

		root.unmount();
	});

	test('renders the live-location card with disabled state and inline error text', async () => {
		const dom = new JSDOM('<!doctype html><div id="host"></div>');
		setGlobalDom(dom);
		const host = dom.window.document.getElementById('host') as HTMLDivElement;
		const root = createRoot(host);

		root.render(
			createElement(LiveLocationResultCard, {
				errorMessage: 'Location access was denied.',
				isPending: true,
				label: 'My location',
				onSelect() {},
			})
		);

		await flushRender();

		const button = host.querySelector(
			'.minimal-map-search__result-select'
		) as HTMLButtonElement | null;

		expect(button).not.toBeNull();
		expect(button?.disabled).toBe(true);
		expect(button?.getAttribute('aria-busy')).toBe('true');
		expect(
			host.querySelector('.minimal-map-search__result-title--live-location')?.textContent
		).toContain('My location');
		expect(
			host.querySelector('.minimal-map-search__result-live-location-error')?.textContent
		).toContain('Location access was denied.');

		root.unmount();
	});
});
