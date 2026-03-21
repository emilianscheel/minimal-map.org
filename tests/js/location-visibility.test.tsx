import { afterEach, describe, expect, mock, test } from 'bun:test';
import { JSDOM } from 'jsdom';
import { createElement, createRoot } from '@wordpress/element';
import type { LocationRecord } from '../../src/types';
import { createLocationActions } from '../../src/admin/locations/LocationsTable';
import LocationTitleCell from '../../src/admin/locations/LocationTitleCell';
import type { LocationsController } from '../../src/admin/locations/types';
import { createDefaultOpeningHours } from '../../src/lib/locations/openingHours';

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

function createLocationRecord(overrides: Partial<LocationRecord> = {}): LocationRecord {
	return {
		id: 1,
		title: 'Berlin Studio',
		telephone: '',
		email: '',
		website: '',
		street: '',
		house_number: '',
		postal_code: '',
		city: '',
		state: '',
		country: '',
		latitude: '52.5',
		longitude: '13.4',
		logo_id: 0,
		marker_id: 0,
		is_hidden: false,
		opening_hours: createDefaultOpeningHours(),
		opening_hours_notes: '',
		tag_ids: [],
		...overrides,
	};
}

function createController(overrides: Partial<LocationsController> = {}): LocationsController {
	return {
		actionNotice: null,
		activeTheme: null,
		assignmentCollectionId: '',
		assignmentLogoId: '',
		assignmentMarkerId: '',
		assignmentTagIds: [],
		csvImportHeaders: [],
		csvImportColumnOptions: [],
		csvImportLogoId: '',
		csvImportMarkerId: '',
		csvImportOpeningHoursColumnOptions: [],
		csvImportOpeningHoursMapping: {
			monday: null,
			tuesday: null,
			wednesday: null,
			thursday: null,
			friday: null,
			saturday: null,
			sunday: null,
			opening_hours_notes: null,
		},
		csvImportRows: [],
		csvImportTagIds: [],
		csvImportMapping: {
			title: null,
			email: null,
			telephone: null,
			website: null,
			street: null,
			house_number: null,
			city: null,
			postal_code: null,
			country: null,
			is_hidden: null,
		},
		csvImportProgressCompleted: 0,
		csvImportProgressTotal: 0,
		csvImportStep: 'mapping',
		collections: [],
		logos: [],
		markers: [],
		tags: [],
		fieldErrors: {},
		form: {
			title: '',
			telephone: '',
			email: '',
			website: '',
			street: '',
			house_number: '',
			postal_code: '',
			city: '',
			state: '',
			country: '',
			latitude: '',
			longitude: '',
			logo_id: 0,
			marker_id: 0,
			is_hidden: false,
			opening_hours: createDefaultOpeningHours(),
			opening_hours_notes: '',
			tag_ids: [],
		},
		formMode: 'create',
		geocodeError: null,
		geocodeNotice: null,
		headerAction: null,
		isAssignToCollectionModalOpen: false,
		isAssignLogoModalOpen: false,
		isAssignMarkerModalOpen: false,
		isAssignTagsModalOpen: false,
		isAssignOpeningHoursModalOpen: false,
		isAssignmentSaving: false,
		isDeleteLogoConfirmationModalOpen: false,
		isRemoveMarkerConfirmationModalOpen: false,
		isRemoveTagsConfirmationModalOpen: false,
		isDialogOpen: false,
		isGeocoding: false,
		isLoading: false,
		isCustomCsvImportModalOpen: false,
		isDeleteAllLocationsModalOpen: false,
		isRemoveCollectionAssignmentModalOpen: false,
		isDeletingAllLocations: false,
		isRemovingCollectionAssignment: false,
		isRowActionPending: false,
		isSubmitting: false,
		isImporting: false,
		isExporting: false,
		loadError: null,
		locations: [],
		mapCenter: null,
		modalTitle: '',
		getCollectionsForLocation: () => [],
		getLogoForLocation: () => null,
		getMarkerForLocation: () => null,
		getTagsForLocation: () => [],
		selectedLogoLocations: [],
		selectedMarkerLocations: [],
		selectedOpeningHoursLocations: [],
		selectedAssignmentLocation: null,
		selectedTagsLocations: [],
		selectedLogoRemovalLocations: [],
		selectedMarkerRemovalLocations: [],
		selectedTagRemovalLocations: [],
		selectedRemovalCollection: null,
		selectedRemovalLocation: null,
		selectedCoordinates: null,
		selection: [],
		submitLabel: '',
		submitError: null,
		step: 'details',
		view: { type: 'table', page: 1, perPage: 9 },
		onAssignLocationToCollection: async () => {},
		onAssignLogoToLocation: async () => {},
		onAssignMarkerToLocation: async () => {},
		onAssignTagsToLocation: async () => {},
		onAssignOpeningHoursToLocations: async () => {},
		dismissActionNotice: () => {},
		onBack: () => {},
		onCancel: () => {},
		onChangeFormValue: () => {},
		onChangeOpeningHoursDayValue: () => {},
		onChangeOpeningHoursNotes: () => {},
		onChangeCsvImportMapping: () => {},
		onChangeCsvImportOpeningHoursMapping: () => {},
		onAdvanceCustomCsvImportStep: () => {},
		onBackCustomCsvImportStep: () => {},
		onMapLocationSelect: () => {},
		onCloseCustomCsvImportModal: () => {},
		onCloseDeleteAllLocationsModal: () => {},
		onCloseRemoveCollectionAssignmentModal: () => {},
		onCloseAssignToCollectionModal: () => {},
		onCloseAssignLogoModal: () => {},
		onCloseAssignMarkerModal: () => {},
		onCloseAssignTagsModal: () => {},
		onCloseAssignOpeningHoursModal: () => {},
		onCloseDeleteLogoConfirmationModal: () => {},
		onCloseRemoveMarkerConfirmationModal: () => {},
		onCloseRemoveTagsConfirmationModal: () => {},
		onChangeView: () => {},
		onChangeSelection: () => {},
		onConfirm: async () => {},
		onDeleteLocation: async () => {},
		onDeleteLocations: async () => {},
		onDeleteAllLocations: async () => {},
		onDuplicateLocation: async () => {},
		onEditLocation: () => {},
		onSetLocationVisibility: async () => {},
		onOpenAssignToCollectionModal: () => {},
		onOpenAssignLogoModal: () => {},
		onOpenAssignMarkerModal: () => {},
		onOpenAssignTagsModal: () => {},
		onOpenAssignOpeningHoursModal: () => {},
		onOpenDeleteAllLocationsModal: () => {},
		onQuickAssignLogo: async () => {},
		onQuickAssignMarker: async () => {},
		onQuickAssignTag: async () => {},
		onOpenDeleteLogoConfirmationModal: () => {},
		onOpenRemoveMarkerConfirmationModal: () => {},
		onOpenRemoveTagsConfirmationModal: () => {},
		onOpenRemoveCollectionAssignmentModal: () => {},
		onClearLogosFromLocations: async () => {},
		onClearMarkersFromLocations: async () => {},
		onClearTagsFromLocations: async () => {},
		onRemoveCollectionAssignment: async () => {},
		onRetrieveLocation: async () => {},
		onSelectAssignmentCollection: () => {},
		onSelectAssignmentLogo: () => {},
		onSelectAssignmentMarker: () => {},
		onSelectAssignmentTags: () => {},
		onSelectCsvImportLogo: () => {},
		onSelectCsvImportMarker: () => {},
		onSelectCsvImportTags: () => {},
		onImportLocations: async () => {},
		onStartCustomCsvImport: async () => {},
		onExportLocations: () => {},
		onExportExample: () => {},
		onAddLocation: () => {},
		paginatedLocations: [],
		totalPages: 1,
		...overrides,
	};
}

afterEach(() => {
	globalThis.window = originalGlobals.window;
	globalThis.document = originalGlobals.document;
	globalThis.navigator = originalGlobals.navigator;
	globalThis.HTMLElement = originalGlobals.HTMLElement;
});

describe('location visibility UI helpers', () => {
	test('renders a muted title with eye-off icon for hidden locations', async () => {
		const dom = new JSDOM('<!doctype html><div id="host"></div>');
		setGlobalDom(dom);
		const host = dom.window.document.getElementById('host') as HTMLDivElement;
		const root = createRoot(host);

		root.render(
			createElement(LocationTitleCell, {
				location: createLocationRecord({ is_hidden: true, title: 'Hidden Studio' }),
			})
		);

		await flushRender();

		expect(host.textContent).toContain('Hidden Studio');
		expect(host.querySelector('.minimal-map-admin__location-title--hidden')).not.toBeNull();
		expect(host.querySelector('.minimal-map-admin__location-title-icon')).not.toBeNull();

		root.unmount();
	});

	test('uses show-hide labels correctly and keeps bulk actions multi-select only', async () => {
		const onSetLocationVisibility = mock(async () => {});
		const controller = createController({
			selection: ['1', '2'],
			onSetLocationVisibility,
		});
		const actions = createLocationActions(controller);
		const visibleLocation = createLocationRecord({ is_hidden: false });
		const hiddenLocation = createLocationRecord({ id: 2, is_hidden: true });

		const toggleAction = actions.find((action) => action.id === 'toggle-location-visibility');
		const hideAllAction = actions.find((action) => action.id === 'hide-all-locations');
		const showAllAction = actions.find((action) => action.id === 'show-all-locations');

		expect(toggleAction).toBeDefined();
		expect(hideAllAction?.context).toBe('list');
		expect(showAllAction?.context).toBe('list');
		expect(toggleAction?.context).toBe('single');
		expect(typeof toggleAction?.label === 'function' ? toggleAction.label([visibleLocation]) : toggleAction?.label).toBe('Hide');
		expect(typeof toggleAction?.label === 'function' ? toggleAction.label([hiddenLocation]) : toggleAction?.label).toBe('Show');
		expect(hideAllAction?.isEligible?.(visibleLocation)).toBe(true);
		expect(showAllAction?.isEligible?.(visibleLocation)).toBe(true);

		toggleAction?.callback?.([visibleLocation]);
		await Promise.resolve();

		expect(onSetLocationVisibility).toHaveBeenCalledWith([visibleLocation], true);
	});
});
