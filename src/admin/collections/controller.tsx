import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { Plus } from 'lucide-react';
import type { ViewGrid, ViewTable } from '@wordpress/dataviews';
import type {
	CollectionFormState,
	CollectionRecord,
	CollectionsAdminConfig,
	LocationRecord,
	LocationsAdminConfig,
} from '../../types';
import { DEFAULT_ASSIGNMENT_VIEW, DEFAULT_FORM_STATE, DEFAULT_GRID_VIEW } from './constants';
import { configureApiFetch } from '../../lib/locations/configureApiFetch';
import { fetchAllLocations } from '../../lib/locations/fetchAllLocations';
import { paginateLocations } from '../../lib/locations/paginateLocations';
import { createCollection } from '../../lib/collections/createCollection';
import { deleteCollection } from '../../lib/collections/deleteCollection';
import { fetchAllCollections } from '../../lib/collections/fetchAllCollections';
import { filterLocationsForAssignment } from '../../lib/collections/filterLocationsForAssignment';
import { paginateCollections } from '../../lib/collections/paginateCollections';
import { updateCollection } from '../../lib/collections/updateCollection';
import type { CollectionsController } from './types';

export function useCollectionsController(
	collectionsConfig: CollectionsAdminConfig,
	locationsConfig: LocationsAdminConfig,
	enabled: boolean
): CollectionsController {
	const [actionNotice, setActionNotice] = useState<CollectionsController['actionNotice']>(null);
	const [assignmentSearch, setAssignmentSearch] = useState('');
	const [availableLocationsView, setAvailableLocationsView] = useState<ViewTable>(DEFAULT_ASSIGNMENT_VIEW);
	const [collections, setCollections] = useState<CollectionRecord[]>([]);
	const [editingCollection, setEditingCollection] = useState<CollectionRecord | null>(null);
	const [form, setForm] = useState<CollectionFormState>(DEFAULT_FORM_STATE);
	const [formMode, setFormMode] = useState<CollectionsController['formMode']>('create');
	const [isAssignmentModalOpen, setAssignmentModalOpen] = useState(false);
	const [isAssignmentSaving, setAssignmentSaving] = useState(false);
	const [isDialogOpen, setDialogOpen] = useState(false);
	const [isLoading, setLoading] = useState(enabled);
	const [isRowActionPending, setRowActionPending] = useState(false);
	const [isSubmitting, setSubmitting] = useState(false);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [locations, setLocations] = useState<LocationRecord[]>([]);
	const [selectedAssignmentCollection, setSelectedAssignmentCollection] = useState<CollectionRecord | null>(null);
	const [selectedLocationIds, setSelectedLocationIds] = useState<number[]>([]);
	const [selectedLocationsView, setSelectedLocationsView] = useState<ViewTable>(DEFAULT_ASSIGNMENT_VIEW);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [view, setView] = useState<ViewGrid>(DEFAULT_GRID_VIEW);

	const loadCollections = useCallback(async (): Promise<void> => {
		const records = await fetchAllCollections(collectionsConfig);
		setCollections(records);
	}, [collectionsConfig]);

	const loadLocations = useCallback(async (): Promise<void> => {
		const records = await fetchAllLocations(locationsConfig);
		setLocations(records);
	}, [locationsConfig]);

	const loadData = useCallback(async (): Promise<void> => {
		if (!enabled) {
			return;
		}

		setLoading(true);
		setLoadError(null);

		try {
			await Promise.all([ loadCollections(), loadLocations() ]);
		} catch (error) {
			setLoadError(
				error instanceof Error
					? error.message
					: __('Collections could not be loaded.', 'minimal-map')
			);
		} finally {
			setLoading(false);
		}
	}, [enabled, loadCollections, loadLocations]);

	useEffect(() => {
		configureApiFetch(collectionsConfig.nonce || locationsConfig.nonce);

		if (!enabled) {
			return;
		}

		void loadData();
	}, [collectionsConfig.nonce, enabled, loadData, locationsConfig.nonce]);

	useEffect(() => {
		setView((currentView) => ({
			...currentView,
			page: 1,
		}));
	}, [collections.length]);

	const locationsById = useMemo(
		() => new Map(locations.map((location) => [location.id, location])),
		[locations]
	);

	const selectedLocationsPool = useMemo(
		() =>
			selectedLocationIds
				.map((locationId) => locationsById.get(locationId))
				.filter((location): location is LocationRecord => Boolean(location)),
		[locationsById, selectedLocationIds]
	);

	const selectedLocationsFiltered = useMemo(
		() => filterLocationsForAssignment(selectedLocationsPool, assignmentSearch),
		[assignmentSearch, selectedLocationsPool]
	);

	const availableLocationsPool = useMemo(
		() => locations.filter((location) => !selectedLocationIds.includes(location.id)),
		[locations, selectedLocationIds]
	);

	const availableLocationsFiltered = useMemo(
		() => filterLocationsForAssignment(availableLocationsPool, assignmentSearch),
		[assignmentSearch, availableLocationsPool]
	);

	useEffect(() => {
		setAvailableLocationsView((currentView) => ({
			...currentView,
			page: 1,
		}));
		setSelectedLocationsView((currentView) => ({
			...currentView,
			page: 1,
		}));
	}, [assignmentSearch, selectedLocationIds.length]);

	const { collections: paginatedCollections, totalPages } = useMemo(
		() => paginateCollections(collections, view),
		[collections, view]
	);

	const {
		locations: paginatedAvailableLocations,
		totalPages: availableLocationsTotalPages,
	} = useMemo(
		() => paginateLocations(availableLocationsFiltered, availableLocationsView),
		[availableLocationsFiltered, availableLocationsView]
	);

	const {
		locations: paginatedSelectedLocations,
		totalPages: selectedLocationsTotalPages,
	} = useMemo(
		() => paginateLocations(selectedLocationsFiltered, selectedLocationsView),
		[selectedLocationsFiltered, selectedLocationsView]
	);

	const resetDialogState = useCallback((): void => {
		setEditingCollection(null);
		setForm(DEFAULT_FORM_STATE);
		setFormMode('create');
		setSubmitError(null);
	}, []);

	const dismissActionNotice = useCallback((): void => {
		setActionNotice(null);
	}, []);

	const openDialog = useCallback((): void => {
		resetDialogState();
		setDialogOpen(true);
	}, [resetDialogState]);

	const onEditCollection = useCallback((collection: CollectionRecord): void => {
		resetDialogState();
		setEditingCollection(collection);
		setFormMode('edit');
		setForm({
			title: collection.title,
		});
		setDialogOpen(true);
	}, [resetDialogState]);

	const onCancel = (): void => {
		if (isSubmitting) {
			return;
		}

		setDialogOpen(false);
	};

	const onChangeFormValue = (key: keyof CollectionFormState, value: string): void => {
		setForm((currentForm) => ({
			...currentForm,
			[key]: value,
		}));
		setSubmitError(null);
	};

	const onConfirm = async (): Promise<void> => {
		if (!form.title.trim()) {
			setSubmitError(__('Collection title is required.', 'minimal-map'));
			return;
		}

		setSubmitting(true);
		setSubmitError(null);
		setActionNotice(null);

		try {
			if (formMode === 'edit' && editingCollection) {
				await updateCollection(
					collectionsConfig,
					editingCollection.id,
					form.title,
					editingCollection.location_ids
				);
			} else {
				await createCollection(collectionsConfig, form);
			}

			await loadCollections();
			setDialogOpen(false);
			resetDialogState();
			setActionNotice({
				status: 'success',
				message:
					formMode === 'edit'
						? __('Collection updated.', 'minimal-map')
						: __('Collection created.', 'minimal-map'),
			});
		} catch (error) {
			setSubmitError(
				error instanceof Error
					? error.message
					: formMode === 'edit'
						? __('Collection could not be updated.', 'minimal-map')
						: __('Collection could not be created.', 'minimal-map')
			);
		} finally {
			setSubmitting(false);
		}
	};

	const onDeleteCollection = useCallback(
		async (collection: CollectionRecord): Promise<void> => {
			setRowActionPending(true);
			setActionNotice(null);

			try {
				await deleteCollection(collectionsConfig, collection.id);
				await loadCollections();
				setActionNotice({
					status: 'success',
					message: __('Collection deleted.', 'minimal-map'),
				});
			} catch (error) {
				setActionNotice({
					status: 'error',
					message:
						error instanceof Error
							? error.message
							: __('Collection could not be deleted.', 'minimal-map'),
				});
				throw error;
			} finally {
				setRowActionPending(false);
			}
		},
		[collectionsConfig, loadCollections]
	);

	const onOpenAssignmentModal = useCallback((collection: CollectionRecord): void => {
		setSelectedAssignmentCollection(collection);
		setSelectedLocationIds(collection.location_ids);
		setAssignmentSearch('');
		setAvailableLocationsView(DEFAULT_ASSIGNMENT_VIEW);
		setSelectedLocationsView(DEFAULT_ASSIGNMENT_VIEW);
		setAssignmentModalOpen(true);
	}, []);

	const onCloseAssignmentModal = (): void => {
		if (isAssignmentSaving) {
			return;
		}

		setAssignmentModalOpen(false);
		setSelectedAssignmentCollection(null);
		setSelectedLocationIds([]);
		setAssignmentSearch('');
	};

	const onAddLocationToAssignment = (location: LocationRecord): void => {
		setSelectedLocationIds((currentIds) => (
			currentIds.includes(location.id) ? currentIds : [ ...currentIds, location.id ]
		));
	};

	const onRemoveLocationFromAssignment = (location: LocationRecord): void => {
		setSelectedLocationIds((currentIds) => currentIds.filter((locationId) => locationId !== location.id));
	};

	const onSaveAssignments = async (): Promise<void> => {
		if (!selectedAssignmentCollection) {
			return;
		}

		setAssignmentSaving(true);
		setActionNotice(null);

		try {
			await updateCollection(
				collectionsConfig,
				selectedAssignmentCollection.id,
				selectedAssignmentCollection.title,
				selectedLocationIds
			);
			await loadCollections();
			setAssignmentModalOpen(false);
			setSelectedAssignmentCollection(null);
			setSelectedLocationIds([]);
			setActionNotice({
				status: 'success',
				message: __('Collection locations saved.', 'minimal-map'),
			});
		} catch (error) {
			setActionNotice({
				status: 'error',
				message:
					error instanceof Error
						? error.message
						: __('Collection locations could not be saved.', 'minimal-map'),
			});
		} finally {
			setAssignmentSaving(false);
		}
	};

	return {
		actionNotice,
		assignmentSearch,
		availableLocations: paginatedAvailableLocations,
		availableLocationsView,
		collections,
		filteredAvailableLocationsCount: availableLocationsFiltered.length,
		filteredAssignedLocationsCount: selectedLocationsFiltered.length,
		form,
		formMode,
		headerAction: enabled ? (
			<Button
				variant="primary"
				onClick={openDialog}
				icon={<Plus size={18} strokeWidth={2} />}
				iconPosition="left"
			>
				{__('Add collection', 'minimal-map')}
			</Button>
		) : null,
		isAssignmentModalOpen,
		isAssignmentSaving,
		isDialogOpen,
		isLoading,
		isRowActionPending,
		isSubmitting,
		loadError,
		locations,
		modalTitle:
			formMode === 'edit'
				? __('Edit collection', 'minimal-map')
				: __('Add collection', 'minimal-map'),
		selectedAssignmentCollection,
		selectedLocationIds,
		selectedLocations: paginatedSelectedLocations,
		selectedLocationsView,
		submitError,
		submitLabel:
			formMode === 'edit'
				? __('Save changes', 'minimal-map')
				: __('Add collection', 'minimal-map'),
		view,
		dismissActionNotice,
		onAddLocationToAssignment,
		onCancel,
		onChangeAssignmentSearch: setAssignmentSearch,
		onChangeAvailableLocationsView: (nextView: ViewTable) => setAvailableLocationsView(nextView),
		onChangeFormValue,
		onChangeSelectedLocationsView: (nextView: ViewTable) => setSelectedLocationsView(nextView),
		onChangeView: (nextView: ViewGrid) => setView(nextView),
		onCloseAssignmentModal,
		onConfirm,
		onDeleteCollection,
		onEditCollection,
		onOpenAssignmentModal,
		onRemoveLocationFromAssignment,
		onSaveAssignments,
		paginatedCollections,
		totalPages,
	};
}
