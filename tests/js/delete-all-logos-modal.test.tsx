import { afterEach, describe, expect, test } from 'bun:test';
import { JSDOM } from 'jsdom';
import { createElement, createRoot } from '@wordpress/element';
import DeleteAllLogosModal from '../../src/admin/logos/DeleteAllLogosModal';
import type { LogosController } from '../../src/admin/logos/types';

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
	overrides: Partial<LogosController> = {}
): LogosController {
	return {
		actionNotice: null,
		dismissActionNotice() {},
		editFilenameBasename: '',
		editFilenameExtension: 'svg',
		editingLogo: null,
		headerAction: null,
		isDeleteAllLogosModalOpen: true,
		isDeletingAllLogos: false,
		isDeleteModalOpen: false,
		isEditDialogOpen: false,
		isLoading: false,
		isRowActionPending: false,
		isSubmitting: false,
		isUploading: false,
		loadError: null,
		logos: [
			{ id: 1, title: 'logo-one.svg', content: '<svg />' } as never,
			{ id: 2, title: 'logo-two.svg', content: '<svg />' } as never,
		],
		onChangeView() {},
		onCancelEditLogo() {},
		onChangeEditFilename() {},
		onCloseDeleteAllLogosModal() {},
		onCloseDeleteModal() {},
		onDeleteAllLogos: async () => {},
		onConfirmDeleteLogo: async () => {},
		onConfirmEditLogo: async () => {},
		onDownloadLogo() {},
		onEditLogo() {},
		onOpenDeleteAllLogosModal() {},
		onOpenDeleteModal() {},
		onUploadLogos: async () => {},
		paginatedLogos: [],
		selectedLogo: null,
		submitError: null,
		totalPages: 1,
		view: {},
		...overrides,
	} as LogosController;
}

afterEach(() => {
	globalThis.window = originalGlobals.window;
	globalThis.document = originalGlobals.document;
	globalThis.navigator = originalGlobals.navigator;
	globalThis.HTMLElement = originalGlobals.HTMLElement;
	delete (globalThis as { requestAnimationFrame?: FrameRequestCallback }).requestAnimationFrame;
	delete (globalThis as { cancelAnimationFrame?: (handle: number) => void }).cancelAnimationFrame;
});

describe('DeleteAllLogosModal', () => {
	test('renders destructive copy with logo count and submits on click', async () => {
		const dom = new JSDOM('<!doctype html><div id="host"></div>');
		setGlobalDom(dom);
		const host = dom.window.document.getElementById('host') as HTMLDivElement;
		const root = createRoot(host);
		let submitCalls = 0;

		root.render(
			createElement(DeleteAllLogosModal, {
				controller: createControllerStub({
					onDeleteAllLogos: async () => {
						submitCalls += 1;
					},
				}),
			})
		);

		await flushRender();

		expect(dom.window.document.body.textContent).toContain(
			'Are you sure you want to delete 2 logos? This action cannot be undone.'
		);

		const deleteButton = Array.from(dom.window.document.body.querySelectorAll('button')).find(
			(button) => button.textContent?.includes('Delete all logos')
		);
		deleteButton?.click();
		await flushRender();

		expect(submitCalls).toBe(1);

		root.unmount();
	});

	test('confirms on Enter and ignores Enter from cancel targets', async () => {
		const dom = new JSDOM('<!doctype html><div id="host"></div>');
		setGlobalDom(dom);
		const host = dom.window.document.getElementById('host') as HTMLDivElement;
		const root = createRoot(host);
		let submitCalls = 0;
		let closeCalls = 0;

		root.render(
			createElement(DeleteAllLogosModal, {
				controller: createControllerStub({
					onCloseDeleteAllLogosModal() {
						closeCalls += 1;
					},
					onDeleteAllLogos: async () => {
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
		const cancelButton = Array.from(body.querySelectorAll('button')).find((button) =>
			button.textContent?.includes('Cancel')
		) as HTMLButtonElement;

		dialog.dispatchEvent(
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

		expect(submitCalls).toBe(1);
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
			createElement(DeleteAllLogosModal, {
				controller: createControllerStub({
					isDeletingAllLogos: true,
					onDeleteAllLogos: async () => {
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
			button.textContent?.includes('Delete all logos')
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

		expect(deleteButton.disabled).toBe(true);
		expect(submitCalls).toBe(0);

		root.unmount();
	});
});
