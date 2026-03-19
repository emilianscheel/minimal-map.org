import { afterEach, describe, expect, test } from 'bun:test';
import { JSDOM } from 'jsdom';
import { createElement, createRoot } from '@wordpress/element';
import DeleteAllCollectionsModal from '../../src/admin/collections/DeleteAllCollectionsModal';
import type {
	CollectionsController,
	DeleteCollectionOptions,
} from '../../src/admin/collections/types';

const originalGlobals = {
	document: globalThis.document,
	HTMLElement: globalThis.HTMLElement,
	HTMLInputElement: globalThis.HTMLInputElement,
	navigator: globalThis.navigator,
	window: globalThis.window,
};

function setGlobalDom(dom: JSDOM): void {
	globalThis.window = dom.window as never;
	globalThis.document = dom.window.document as never;
	globalThis.navigator = dom.window.navigator as never;
	globalThis.HTMLElement = dom.window.HTMLElement as never;
	globalThis.HTMLInputElement = dom.window.HTMLInputElement as never;
	globalThis.window.matchMedia =
		globalThis.window.matchMedia ??
		(() =>
			({
				addEventListener() {},
				addListener() {},
				dispatchEvent() {
					return false;
				},
				matches: false,
				media: '',
				onchange: null,
				removeEventListener() {},
				removeListener() {},
			}) as MediaQueryList);
	globalThis.window.requestAnimationFrame =
		globalThis.window.requestAnimationFrame ??
		((callback: FrameRequestCallback) => globalThis.window.setTimeout(callback, 0));
	globalThis.window.cancelAnimationFrame =
		globalThis.window.cancelAnimationFrame ??
		((handle: number) => globalThis.window.clearTimeout(handle));
	globalThis.requestAnimationFrame =
		globalThis.requestAnimationFrame ??
		globalThis.window.requestAnimationFrame.bind(globalThis.window);
	globalThis.cancelAnimationFrame =
		globalThis.cancelAnimationFrame ??
		globalThis.window.cancelAnimationFrame.bind(globalThis.window);
}

async function flushRender(): Promise<void> {
	await new Promise((resolve) => setTimeout(resolve, 0));
}

function createControllerStub(
	overrides: Partial<CollectionsController> = {}
): CollectionsController {
	return {
		collections: [
			{ id: 1, title: 'Featured Cities', location_ids: [1, 2] } as never,
			{ id: 2, title: 'Berlin', location_ids: [2, 3] } as never,
		],
		isDeleteAllCollectionsModalOpen: true,
		isDeletingAllCollections: false,
		onCloseDeleteAllCollectionsModal() {},
		onDeleteAllCollections: async (_options: DeleteCollectionOptions) => {},
		...overrides,
	} as CollectionsController;
}

afterEach(() => {
	globalThis.window = originalGlobals.window;
	globalThis.document = originalGlobals.document;
	globalThis.navigator = originalGlobals.navigator;
	globalThis.HTMLElement = originalGlobals.HTMLElement;
	globalThis.HTMLInputElement = originalGlobals.HTMLInputElement;
	delete (globalThis as { requestAnimationFrame?: FrameRequestCallback }).requestAnimationFrame;
	delete (globalThis as { cancelAnimationFrame?: (handle: number) => void }).cancelAnimationFrame;
});

describe('DeleteAllCollectionsModal', () => {
	test('renders destructive copy with collection count and submits default options', async () => {
		const dom = new JSDOM('<!doctype html><div id="host"></div>');
		setGlobalDom(dom);
		const host = dom.window.document.getElementById('host') as HTMLDivElement;
		const root = createRoot(host);
		const submittedOptions: DeleteCollectionOptions[] = [];

		root.render(
			createElement(DeleteAllCollectionsModal, {
				controller: createControllerStub({
					onDeleteAllCollections: async (options) => {
						submittedOptions.push(options);
					},
				}),
			})
		);

		await flushRender();

		expect(dom.window.document.body.textContent).toContain(
			'Are you sure you want to delete 2 collections? This action cannot be undone.'
		);
		expect(dom.window.document.body.textContent).not.toContain(
			'Skip shared locations'
		);

		const deleteButton = Array.from(dom.window.document.body.querySelectorAll('button')).find(
			(button) => button.textContent?.includes('Delete all collections')
		);
		deleteButton?.click();
		await flushRender();

		expect(submittedOptions).toEqual([
			{ deleteLocations: false, skipSharedLocations: false },
		]);

		root.unmount();
	});

	test('confirms on Enter and ignores Enter from checkbox and cancel targets', async () => {
		const dom = new JSDOM('<!doctype html><div id="host"></div>');
		setGlobalDom(dom);
		const host = dom.window.document.getElementById('host') as HTMLDivElement;
		const root = createRoot(host);
		const submittedOptions: DeleteCollectionOptions[] = [];
		let closeCalls = 0;

		root.render(
			createElement(DeleteAllCollectionsModal, {
				controller: createControllerStub({
					onCloseDeleteAllCollectionsModal() {
						closeCalls += 1;
					},
					onDeleteAllCollections: async (options) => {
						submittedOptions.push(options);
					},
				}),
			})
		);

		await flushRender();

		const body = dom.window.document.body;
		const dialog = body.querySelector(
			'.minimal-map-admin__collection-delete-dialog'
		) as HTMLDivElement;
		const cancelButton = Array.from(body.querySelectorAll('button')).find((button) =>
			button.textContent?.includes('Cancel')
		) as HTMLButtonElement;
		const deleteLocationsCheckbox = body.querySelector<HTMLInputElement>('input[type="checkbox"]');

		dialog.dispatchEvent(
			new dom.window.KeyboardEvent('keydown', {
				bubbles: true,
				cancelable: true,
				key: 'Enter',
			})
		);
		await flushRender();

		deleteLocationsCheckbox?.dispatchEvent(
			new dom.window.KeyboardEvent('keydown', {
				bubbles: true,
				cancelable: true,
				key: 'Enter',
			})
		);
		await flushRender();

		cancelButton.dispatchEvent(
			new dom.window.KeyboardEvent('keydown', {
				bubbles: true,
				cancelable: true,
				key: 'Enter',
			})
		);
		await flushRender();

		cancelButton.click();
		await flushRender();

		expect(submittedOptions).toEqual([
			{ deleteLocations: false, skipSharedLocations: false },
		]);
		expect(closeCalls).toBe(1);

		root.unmount();
	});

	test('disables actions while deleting', async () => {
		const dom = new JSDOM('<!doctype html><div id="host"></div>');
		setGlobalDom(dom);
		const host = dom.window.document.getElementById('host') as HTMLDivElement;
		const root = createRoot(host);
		let submitCalls = 0;

		root.render(
			createElement(DeleteAllCollectionsModal, {
				controller: createControllerStub({
					isDeletingAllCollections: true,
					onDeleteAllCollections: async () => {
						submitCalls += 1;
					},
				}),
			})
		);

		await flushRender();

		const body = dom.window.document.body;
		const dialog = body.querySelector(
			'.minimal-map-admin__collection-delete-dialog'
		) as HTMLDivElement;
		const deleteButton = Array.from(body.querySelectorAll('button')).find((button) =>
			button.textContent?.includes('Delete all collections')
		) as HTMLButtonElement;

		deleteButton.click();
		dialog.dispatchEvent(
			new dom.window.KeyboardEvent('keydown', {
				bubbles: true,
				cancelable: true,
				key: 'Enter',
			})
		);
		await flushRender();

		expect(submitCalls).toBe(0);
		expect(deleteButton.disabled).toBe(true);

		root.unmount();
	});
});
