import { afterEach, describe, expect, test } from 'bun:test';
import { JSDOM } from 'jsdom';
import {
	createLocationCardPreviewController,
	waitForInternalMapMovementToFinish,
} from '../../src/map/location-card-preview';
import { normalizeMapConfig } from '../../src/map/defaults';

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

describe('location card preview controller', () => {
	test('renders the popup-backed in-map card only when the feature is enabled', async () => {
		const dom = new JSDOM(
			'<!doctype html><body style="font-family: Georgia, serif;"><div id="host"></div></body>'
		);
		setGlobalDom(dom);
		const host = dom.window.document.getElementById('host') as HTMLDivElement;
		const popupState = {
			addToCalls: 0,
			contentNode: null as Node | null,
			isOpen: false,
			lngLat: null as [number, number] | null,
			offset: null as unknown,
			removeCalls: 0,
		};

		const controller = createLocationCardPreviewController({
			host,
			map: {} as never,
			popupFactory() {
				return {
					addTo() {
						popupState.addToCalls += 1;
						popupState.isOpen = true;
						return this;
					},
					isOpen() {
						return popupState.isOpen;
					},
					remove() {
						popupState.removeCalls += 1;
						popupState.isOpen = false;
						return this;
					},
					setDOMContent(node: Node) {
						popupState.contentNode = node;
						return this;
					},
					setLngLat(lngLat: [number, number]) {
						popupState.lngLat = lngLat;
						return this;
					},
					setOffset(offset: unknown) {
						popupState.offset = offset;
						return this;
					},
				};
			},
		});
		const disabledConfig = normalizeMapConfig({
			inMapLocationCard: false,
			locations: [
				{
					id: 1,
					title: 'Berlin Studio',
					lat: 52.52,
					lng: 13.405,
					city: 'Berlin',
				},
			],
		});
		const enabledConfig = normalizeMapConfig({
			inMapLocationCard: true,
			googleMapsNavigation: true,
			siteLocale: 'en-US',
			siteTimezone: 'Europe/Berlin',
			locations: [
				{
					id: 1,
					title: 'Berlin Studio',
					lat: 52.52,
					lng: 13.405,
					city: 'Berlin',
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
				},
			],
		});

		controller.render(disabledConfig, {
			locationId: 1,
		});
		await flushRender();

		expect(popupState.addToCalls).toBe(0);

		controller.render(enabledConfig, {
			distanceLabel: '500 m',
			locationId: 1,
		});
		await flushRender();

		expect(popupState.addToCalls).toBe(1);
		expect(popupState.lngLat).toEqual([ 13.405, 52.52 ]);
		expect(typeof popupState.offset).toBe('number');
		expect((popupState.contentNode as HTMLElement)?.textContent).toContain('Berlin Studio');
		expect((popupState.contentNode as HTMLElement)?.textContent).toContain('500 m away');
		expect((popupState.contentNode as HTMLElement)?.textContent).toContain(
			'Open in Google Maps',
		);
		expect((popupState.contentNode as HTMLElement)?.textContent).toContain(
			'Open - closes 11:59 pm',
		);
		expect(
			(popupState.contentNode as HTMLElement)?.style.getPropertyValue(
				'--minimal-map-location-card-font-family'
			)
		).toBe(dom.window.getComputedStyle(dom.window.document.body).fontFamily);

		controller.hide();
		expect(popupState.removeCalls).toBe(1);

		controller.destroy();
	});

	test('waits for internal movement completion and falls back to the next frame when already settled', () => {
		let moving = true;
		let revealCount = 0;
		let moveendHandler: ((event: { isMinimalMapInternal?: boolean }) => void) | null = null;
		let scheduledFrame: FrameRequestCallback | null = null;
		const map = {
			isMoving() {
				return moving;
			},
			off(_eventName: string, handler: (event: { isMinimalMapInternal?: boolean }) => void) {
				if (moveendHandler === handler) {
					moveendHandler = null;
				}
			},
			on(_eventName: string, handler: (event: { isMinimalMapInternal?: boolean }) => void) {
				moveendHandler = handler;
			},
		};

		waitForInternalMapMovementToFinish(
			map as never,
			() => {
				revealCount += 1;
			},
			(callback) => {
				scheduledFrame = callback;
				return 1;
			},
			() => {},
		);

		scheduledFrame?.(0);
		expect(revealCount).toBe(0);

		moveendHandler?.({ isMinimalMapInternal: false });
		expect(revealCount).toBe(0);

		moveendHandler?.({ isMinimalMapInternal: true });
		expect(revealCount).toBe(1);

		moving = false;
		revealCount = 0;
		moveendHandler = null;
		scheduledFrame = null;

		waitForInternalMapMovementToFinish(
			map as never,
			() => {
				revealCount += 1;
			},
			(callback) => {
				scheduledFrame = callback;
				return 2;
			},
			() => {},
		);

		scheduledFrame?.(0);
		expect(revealCount).toBe(1);
	});
});
