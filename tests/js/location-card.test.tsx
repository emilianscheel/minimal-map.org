import { afterEach, describe, expect, test } from 'bun:test';
import { JSDOM } from 'jsdom';
import { createElement, createRoot } from '@wordpress/element';
import { LocationResultCard } from '../../src/map/location-card';

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
	await new Promise((resolve) => setTimeout(resolve, 0));
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
		expect(host.querySelector('.minimal-map-search__result-distance')?.textContent).toBe(
			'500 m away',
		);
		expect(host.querySelector('.minimal-map-tag-badge')?.textContent).toBe('Cafe');
		expect(
			host.querySelector('.minimal-map-search__result-opening-hours-trigger')?.textContent
		).toContain('Open - closes 11:59 pm');

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

		root.unmount();
	});
});
