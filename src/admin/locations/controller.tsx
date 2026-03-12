import { Button } from '@wordpress/components';
import type { ViewTable } from '@wordpress/dataviews';
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Plus } from 'lucide-react';
import { ExportLocationsDropdown } from './ExportLocationsDropdown';
import { ImportLocationsButton } from './ImportLocationsButton';
import type {
	CsvImportMapping,
	ParsedCsvData,
} from '../../lib/locations/importLocations';
import type {
	CollectionRecord,
	CollectionsAdminConfig,
	LocationDialogStep,
	LocationFormMode,
	LocationFormState,
	LocationRecord,
	LogoRecord,
	MarkerRecord,
	LogosAdminConfig,
	MarkersAdminConfig,
	LocationsAdminConfig,
	MapCoordinates,
	StyleThemeRecord,
	TagRecord,
	TagsAdminConfig,
} from '../../types';
import { fetchAllCollections } from '../../lib/collections/fetchAllCollections';
import { fetchAllLogos } from '../../lib/logos/fetchAllLogos';
import { fetchAllMarkers } from '../../lib/markers/fetchAllMarkers';
import { fetchAllTags } from '../../lib/tags/fetchAllTags';
import { updateCollection } from '../../lib/collections/updateCollection';
import { configureApiFetch } from '../../lib/locations/configureApiFetch';
import { createEmptyFieldErrors } from '../../lib/locations/createEmptyFieldErrors';
import { createLocationFormStateFromRecord } from '../../lib/locations/createLocationFormStateFromRecord';
import { createLocation } from '../../lib/locations/createLocation';
import { deleteLocation } from '../../lib/locations/deleteLocation';
import { duplicateLocation } from '../../lib/locations/duplicateLocation';
import { fetchAllLocations } from '../../lib/locations/fetchAllLocations';
import {
	countMappedCsvGeocodeRequests,
	createEmptyCsvImportMapping,
	isCommonCsvFormat,
	parseCsvFile,
	runCommonCsvImport,
	runMappedCsvImport,
} from '../../lib/locations/importLocations';
import { geocodeAddress } from '../../lib/locations/geocodeAddress';
import { hasFieldErrors } from '../../lib/locations/hasFieldErrors';
import { hasLocationAddressChanged } from '../../lib/locations/hasLocationAddressChanged';
import { paginateLocations } from '../../lib/locations/paginateLocations';
import { updateLocationCoordinates } from '../../lib/locations/updateLocationCoordinates';
import { updateLocation } from '../../lib/locations/updateLocation';
import { validateAddressStep } from '../../lib/locations/validateAddressStep';
import { validateDetailsStep } from '../../lib/locations/validateDetailsStep';
import { DEFAULT_FORM_STATE, DEFAULT_VIEW, LOCATIONS_TABLE_PER_PAGE } from './constants';
import type { LocationsController } from './types';

const DEFAULT_MAP_CENTER: MapCoordinates = {
	lat: 52.517,
	lng: 13.388,
};

export function useLocationsController(
	config: LocationsAdminConfig,
	collectionsConfig: CollectionsAdminConfig,
	logosConfig: LogosAdminConfig,
	markersConfig: MarkersAdminConfig,
	tagsConfig: TagsAdminConfig,
	enabled: boolean,
	themeData: {
		activeTheme: StyleThemeRecord | null;
		themes: StyleThemeRecord[];
		onSwitchTheme: (slug: string) => void;
	}
): LocationsController {
	const [form, setForm] = useState<LocationFormState>(DEFAULT_FORM_STATE);
	const [formMode, setFormMode] = useState<LocationFormMode>('create');
	const [editingLocation, setEditingLocation] = useState<LocationRecord | null>(null);
	const [originalForm, setOriginalForm] = useState<LocationFormState | null>(null);
	const [fieldErrors, setFieldErrors] = useState(createEmptyFieldErrors());
	const [isDialogOpen, setDialogOpen] = useState(false);
	const [isSubmitting, setSubmitting] = useState(false);
	const [isGeocoding, setGeocoding] = useState(false);
	const [isLoading, setLoading] = useState(enabled);
	const [isRowActionPending, setRowActionPending] = useState(false);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [actionNotice, setActionNotice] = useState<LocationsController['actionNotice']>(null);
	const [geocodeError, setGeocodeError] = useState<string | null>(null);
	const [geocodeNotice, setGeocodeNotice] = useState<string | null>(null);
	const [locations, setLocations] = useState<LocationRecord[]>([]);
	const [collections, setCollections] = useState<CollectionRecord[]>([]);
	const [logos, setLogos] = useState<LogoRecord[]>([]);
	const [markers, setMarkers] = useState<MarkerRecord[]>([]);
	const [tags, setTags] = useState<TagRecord[]>([]);
	const [step, setStep] = useState<LocationDialogStep>('details');
	const [view, setView] = useState<ViewTable>(DEFAULT_VIEW);
	const [mapCenter, setMapCenter] = useState<MapCoordinates | null>(null);
	const [selectedCoordinates, setSelectedCoordinates] = useState<MapCoordinates | null>(null);
	const [isAssignToCollectionModalOpen, setAssignToCollectionModalOpen] = useState(false);
	const [selectedAssignmentLocation, setSelectedAssignmentLocation] = useState<LocationRecord | null>(null);
	const [assignmentCollectionId, setAssignmentCollectionId] = useState('');
	const [isAssignLogoModalOpen, setAssignLogoModalOpen] = useState(false);
	const [selectedLogoLocation, setSelectedLogoLocation] = useState<LocationRecord | null>(null);
	const [assignmentLogoId, setAssignmentLogoId] = useState('');
	const [isAssignMarkerModalOpen, setAssignMarkerModalOpen] = useState(false);
	const [selectedMarkerLocation, setSelectedMarkerLocation] = useState<LocationRecord | null>(null);
	const [assignmentMarkerId, setAssignmentMarkerId] = useState('');
	const [isAssignTagsModalOpen, setAssignTagsModalOpen] = useState(false);
	const [selectedTagsLocation, setSelectedTagsLocation] = useState<LocationRecord | null>(null);
	const [assignmentTagIds, setAssignmentTagIds] = useState<number[]>([]);
	const [isAssignmentSaving, setAssignmentSaving] = useState(false);
	const [isDeleteLogoConfirmationModalOpen, setDeleteLogoConfirmationModalOpen] = useState(false);
	const [selectedLogoRemovalLocation, setSelectedLogoRemovalLocation] =
		useState<LocationRecord | null>(null);
	const [isRemoveCollectionAssignmentModalOpen, setRemoveCollectionAssignmentModalOpen] =
		useState(false);
	const [selectedRemovalLocation, setSelectedRemovalLocation] = useState<LocationRecord | null>(
		null
	);
	const [selectedRemovalCollection, setSelectedRemovalCollection] =
		useState<CollectionRecord | null>(null);
	const [isRemovingCollectionAssignment, setRemovingCollectionAssignment] = useState(false);
	const [isImporting, setIsImporting] = useState(false);
	const [isExporting, setIsExporting] = useState(false);
	const [isCustomCsvImportModalOpen, setCustomCsvImportModalOpen] = useState(false);
	const [customCsvImportStep, setCustomCsvImportStep] = useState<'mapping' | 'progress'>(
		'mapping'
	);
	const [pendingCsvImport, setPendingCsvImport] = useState<ParsedCsvData | null>(null);
	const [csvImportMapping, setCsvImportMapping] = useState<CsvImportMapping>(
		createEmptyCsvImportMapping()
	);
	const [csvImportProgressCompleted, setCsvImportProgressCompleted] = useState(0);
	const [csvImportProgressTotal, setCsvImportProgressTotal] = useState(0);
	const [selection, setSelection] = useState<string[]>([]);

	const loadLocations = useCallback(async () => {
		if (!enabled) {
			return;
		}

		setLoading(true);
		setLoadError(null);

		try {
			const [locationRecords, collectionRecords, logoRecords, markerRecords, tagRecords] = await Promise.all([
				fetchAllLocations(config),
				fetchAllCollections(collectionsConfig),
				fetchAllLogos(logosConfig),
				fetchAllMarkers(markersConfig),
				fetchAllTags(tagsConfig),
			]);
			setLocations(locationRecords);
			setCollections(collectionRecords);
			setLogos(logoRecords);
			setMarkers(markerRecords);
			setTags(tagRecords);
		} catch (error) {
			setLoadError(
				error instanceof Error
					? error.message
					: __('Locations and collections could not be loaded.', 'minimal-map')
			);
		} finally {
			setLoading(false);
		}
	}, [collectionsConfig, config, enabled, logosConfig, markersConfig, tagsConfig]);

	useEffect(() => {
		configureApiFetch(collectionsConfig.nonce || config.nonce);

		if (!enabled) {
			return;
		}

		void loadLocations();
	}, [collectionsConfig.nonce, config.nonce, enabled, loadLocations]);

	useEffect(() => {
		setView((currentView) => ({
			...currentView,
			page: 1,
		}));
	}, [locations.length, view.search]);

	const { locations: paginatedLocations, totalPages } = useMemo(
		() => paginateLocations(locations, view),
		[locations, view]
	);

	const collectionsByLocationId = useMemo(() => {
		const lookup = new Map<number, CollectionRecord[]>();

		collections.forEach((collection) => {
			collection.location_ids.forEach((locationId) => {
				const assignedCollections = lookup.get(locationId) ?? [];
				assignedCollections.push(collection);
				lookup.set(locationId, assignedCollections);
			});
		});

		lookup.forEach((assignedCollections, locationId) => {
			lookup.set(
				locationId,
				[...assignedCollections].sort((left, right) => left.title.localeCompare(right.title))
			);
		});

		return lookup;
	}, [collections]);

	const tagsById = useMemo(() => new Map(tags.map((tag) => [tag.id, tag])), [tags]);
	const logosById = useMemo(() => new Map(logos.map((logo) => [logo.id, logo])), [logos]);
	const markersById = useMemo(() => new Map(markers.map((marker) => [marker.id, marker])), [markers]);

	const getTagsForLocation = useCallback(
		(locationId: number): TagRecord[] => {
			const location = locations.find((loc) => loc.id === locationId);
			if (!location) {
				return [];
			}
			return location.tag_ids
				.map((tagId) => tagsById.get(tagId))
				.filter((tag): tag is TagRecord => !!tag);
		},
		[locations, tagsById]
	);

	const getLogoForLocation = useCallback(
		(locationId: number): LogoRecord | null => {
			const location = locations.find((loc) => loc.id === locationId);
			if (!location || location.logo_id <= 0) {
				return null;
			}

			return logosById.get(location.logo_id) ?? null;
		},
		[locations, logosById]
	);

	const getMarkerForLocation = useCallback(
		(locationId: number): MarkerRecord | null => {
			const location = locations.find((loc) => loc.id === locationId);
			if (!location || location.marker_id <= 0) {
				return null;
			}

			return markersById.get(location.marker_id) ?? null;
		},
		[locations, markersById]
	);

	const resetDialogState = (): void => {
		setFormMode('create');
		setEditingLocation(null);
		setOriginalForm(null);
		setForm(DEFAULT_FORM_STATE);
		setFieldErrors(createEmptyFieldErrors());
		setSubmitError(null);
		setGeocodeError(null);
		setGeocodeNotice(null);
		setMapCenter(null);
		setSelectedCoordinates(null);
		setStep('details');
	};

	const resetCustomCsvImportState = useCallback((): void => {
		setCustomCsvImportModalOpen(false);
		setCustomCsvImportStep('mapping');
		setPendingCsvImport(null);
		setCsvImportMapping(createEmptyCsvImportMapping());
		setCsvImportProgressCompleted(0);
		setCsvImportProgressTotal(0);
	}, []);

	const resetAssignToCollectionState = useCallback((): void => {
		setAssignToCollectionModalOpen(false);
		setSelectedAssignmentLocation(null);
		setAssignmentCollectionId('');
	}, []);

	const resetAssignLogoState = useCallback((): void => {
		setAssignLogoModalOpen(false);
		setSelectedLogoLocation(null);
		setAssignmentLogoId('');
	}, []);

	const resetAssignMarkerState = useCallback((): void => {
		setAssignMarkerModalOpen(false);
		setSelectedMarkerLocation(null);
		setAssignmentMarkerId('');
	}, []);

	const resetAssignTagsState = useCallback((): void => {
		setAssignTagsModalOpen(false);
		setSelectedTagsLocation(null);
		setAssignmentTagIds([]);
	}, []);

	const closeAssignToCollectionModal = useCallback((): void => {
		if (isAssignmentSaving) {
			return;
		}

		resetAssignToCollectionState();
	}, [isAssignmentSaving, resetAssignToCollectionState]);

	const closeAssignLogoModal = useCallback((): void => {
		if (isAssignmentSaving) {
			return;
		}

		resetAssignLogoState();
	}, [isAssignmentSaving, resetAssignLogoState]);

	const closeAssignMarkerModal = useCallback((): void => {
		if (isAssignmentSaving) {
			return;
		}

		resetAssignMarkerState();
	}, [isAssignmentSaving, resetAssignMarkerState]);

	const closeAssignTagsModal = useCallback((): void => {
		if (isAssignmentSaving) {
			return;
		}

		resetAssignTagsState();
	}, [isAssignmentSaving, resetAssignTagsState]);

	const resetDeleteLogoConfirmationState = useCallback((): void => {
		setDeleteLogoConfirmationModalOpen(false);
		setSelectedLogoRemovalLocation(null);
	}, []);

	const closeDeleteLogoConfirmationModal = useCallback((): void => {
		if (isAssignmentSaving) {
			return;
		}

		resetDeleteLogoConfirmationState();
	}, [isAssignmentSaving, resetDeleteLogoConfirmationState]);

	const resetRemoveCollectionAssignmentState = useCallback((): void => {
		setRemoveCollectionAssignmentModalOpen(false);
		setSelectedRemovalLocation(null);
		setSelectedRemovalCollection(null);
	}, []);

	const closeCustomCsvImportModal = useCallback((): void => {
		if (isImporting) {
			return;
		}

		resetCustomCsvImportState();
	}, [isImporting, resetCustomCsvImportState]);

	const closeRemoveCollectionAssignmentModal = useCallback((): void => {
		if (isRemovingCollectionAssignment) {
			return;
		}

		resetRemoveCollectionAssignmentState();
	}, [isRemovingCollectionAssignment, resetRemoveCollectionAssignmentState]);

	const openDialog = (): void => {
		resetDialogState();
		setDialogOpen(true);
	};

	const onEditLocation = (location: LocationRecord): void => {
		const nextForm = createLocationFormStateFromRecord(location);
		const latitude = Number(location.latitude);
		const longitude = Number(location.longitude);
		const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude);
		const coordinates = hasCoordinates ? { lat: latitude, lng: longitude } : null;

		resetDialogState();
		setFormMode('edit');
		setEditingLocation(location);
		setOriginalForm(nextForm);
		setForm(nextForm);
		setMapCenter(coordinates);
		setSelectedCoordinates(coordinates);
		setDialogOpen(true);
	};

	const onCancel = (): void => {
		if (isSubmitting || isGeocoding) {
			return;
		}

		setDialogOpen(false);
	};

	const onBack = (): void => {
		if (isSubmitting || isGeocoding) {
			return;
		}

		if (step === 'map') {
			setStep('address');
			return;
		}

		setStep('details');
	};

	const onChangeFormValue = (key: keyof LocationFormState, value: string): void => {
		setForm((currentForm) => ({
			...currentForm,
			[key]: value,
		}));

		setFieldErrors((currentErrors) => ({
			...currentErrors,
			[key]: undefined,
		}));

		if (
			key === 'street' ||
			key === 'house_number' ||
			key === 'postal_code' ||
			key === 'city' ||
			key === 'state' ||
			key === 'country'
		) {
			setGeocodeError(null);
			setGeocodeNotice(null);
		}
	};

	const dismissActionNotice = useCallback((): void => {
		setActionNotice(null);
	}, []);

	const onOpenAssignToCollectionModal = useCallback((location: LocationRecord): void => {
		setSelectedAssignmentLocation(location);
		setAssignmentCollectionId('');
		setAssignToCollectionModalOpen(true);
	}, []);

	const onOpenAssignLogoModal = useCallback((location: LocationRecord): void => {
		setSelectedLogoLocation(location);
		setAssignmentLogoId(location.logo_id > 0 ? `${location.logo_id}` : '');
		setAssignLogoModalOpen(true);
	}, []);

	const onOpenAssignMarkerModal = useCallback((location: LocationRecord): void => {
		setSelectedMarkerLocation(location);
		setAssignmentMarkerId(location.marker_id > 0 ? `${location.marker_id}` : '');
		setAssignMarkerModalOpen(true);
	}, []);

	const onOpenAssignTagsModal = useCallback((location: LocationRecord): void => {
		setSelectedTagsLocation(location);
		setAssignmentTagIds(location.tag_ids);
		setAssignTagsModalOpen(true);
	}, []);

	const onOpenDeleteLogoConfirmationModal = useCallback((location: LocationRecord): void => {
		if (location.logo_id <= 0) {
			return;
		}

		setSelectedLogoRemovalLocation(location);
		setDeleteLogoConfirmationModalOpen(true);
	}, []);

	const onAssignLogoToLocation = useCallback(async (): Promise<void> => {
		if (!selectedLogoLocation || !assignmentLogoId) {
			return;
		}

		setAssignmentSaving(true);
		setActionNotice(null);

		try {
			await updateLocation(config, selectedLogoLocation.id, {
				...createLocationFormStateFromRecord(selectedLogoLocation),
				logo_id: Number(assignmentLogoId),
			});
			await loadLocations();
			setActionNotice({
				status: 'success',
				message: __('Location logo updated.', 'minimal-map'),
			});
			resetAssignLogoState();
		} catch (error) {
			setActionNotice({
				status: 'error',
				message:
					error instanceof Error
						? error.message
						: __('Location logo could not be updated.', 'minimal-map'),
			});
		} finally {
			setAssignmentSaving(false);
		}
	}, [assignmentLogoId, config, loadLocations, resetAssignLogoState, selectedLogoLocation]);

	const onAssignMarkerToLocation = useCallback(async (): Promise<void> => {
		if (!selectedMarkerLocation) {
			return;
		}

		setAssignmentSaving(true);
		setActionNotice(null);

		try {
			await updateLocation(config, selectedMarkerLocation.id, {
				...createLocationFormStateFromRecord(selectedMarkerLocation),
				marker_id: Number(assignmentMarkerId) || 0,
			});
			await loadLocations();
			setActionNotice({
				status: 'success',
				message: __('Location marker updated.', 'minimal-map'),
			});
			resetAssignMarkerState();
		} catch (error) {
			setActionNotice({
				status: 'error',
				message:
					error instanceof Error
						? error.message
						: __('Location marker could not be updated.', 'minimal-map'),
			});
		} finally {
			setAssignmentSaving(false);
		}
	}, [assignmentMarkerId, config, loadLocations, resetAssignMarkerState, selectedMarkerLocation]);

	const onAssignTagsToLocation = useCallback(async (): Promise<void> => {
		if (!selectedTagsLocation) {
			return;
		}

		setAssignmentSaving(true);
		setActionNotice(null);

		try {
			await updateLocation(config, selectedTagsLocation.id, {
				...createLocationFormStateFromRecord(selectedTagsLocation),
				tag_ids: assignmentTagIds,
			});
			await loadLocations();
			setActionNotice({
				status: 'success',
				message: __('Location tags updated.', 'minimal-map'),
			});
			resetAssignTagsState();
		} catch (error) {
			console.error('Failed to update tags:', error);
			setActionNotice({
				status: 'error',
				message:
					error instanceof Error
						? error.message
						: __('Location tags could not be updated.', 'minimal-map'),
			});
		} finally {
			setAssignmentSaving(false);
		}
	}, [
		assignmentTagIds,
		config,
		loadLocations,
		resetAssignTagsState,
		selectedTagsLocation,
	]);

	const onClearLogoFromLocation = useCallback(async (): Promise<void> => {
		if (!selectedLogoRemovalLocation) {
			return;
		}

		setAssignmentSaving(true);
		setActionNotice(null);

		try {
			await updateLocation(config, selectedLogoRemovalLocation.id, {
				...createLocationFormStateFromRecord(selectedLogoRemovalLocation),
				logo_id: 0,
			});
			await loadLocations();
			setActionNotice({
				status: 'success',
				message: __('Logo removed from location.', 'minimal-map'),
			});
			resetDeleteLogoConfirmationState();
		} catch (error) {
			setActionNotice({
				status: 'error',
				message:
					error instanceof Error
						? error.message
						: __('Logo could not be removed from the location.', 'minimal-map'),
			});
		} finally {
			setAssignmentSaving(false);
		}
	}, [config, loadLocations, resetDeleteLogoConfirmationState, selectedLogoRemovalLocation]);

	const onOpenRemoveCollectionAssignmentModal = useCallback(
		(location: LocationRecord, collection: CollectionRecord): void => {
			setSelectedRemovalLocation(location);
			setSelectedRemovalCollection(collection);
			setRemoveCollectionAssignmentModalOpen(true);
		},
		[]
	);

	const getCollectionsForLocation = useCallback(
		(locationId: number): CollectionRecord[] => collectionsByLocationId.get(locationId) ?? [],
		[collectionsByLocationId]
	);

	const onDuplicateLocation = useCallback(
		async (location: LocationRecord): Promise<void> => {
			setRowActionPending(true);
			setActionNotice(null);

			try {
				await duplicateLocation(
					config,
					location,
					locations.map((item) => item.title)
				);
				await loadLocations();
				setActionNotice({
					status: 'success',
					message: __('Location duplicated.', 'minimal-map'),
				});
			} catch (error) {
				setActionNotice({
					status: 'error',
					message:
						error instanceof Error
							? error.message
							: __('Location could not be duplicated.', 'minimal-map'),
				});
				throw error;
			} finally {
				setRowActionPending(false);
			}
		},
		[config, loadLocations, locations]
	);

	const onRetrieveLocation = useCallback(
		async (location: LocationRecord): Promise<void> => {
			const errors = validateAddressStep(location);
			const validationMessage = Object.values(errors).find(Boolean);

			if (validationMessage) {
				const error = new Error(validationMessage);
				setActionNotice({
					status: 'error',
					message: validationMessage,
				});
				throw error;
			}

			setRowActionPending(true);
			setActionNotice(null);

			try {
				const result = await geocodeAddress(config, location);

				if (!result.success) {
					const error = new Error(result.message);
					setActionNotice({
						status: 'error',
						message: result.message,
					});
					throw error;
				}

				await updateLocationCoordinates(config, location.id, {
					lat: result.lat,
					lng: result.lng,
				});
				await loadLocations();
				setActionNotice({
					status: 'success',
					message: __('Location coordinates updated.', 'minimal-map'),
				});
			} catch (error) {
				if (!(error instanceof Error && error.message === validationMessage)) {
					setActionNotice({
						status: 'error',
						message:
							error instanceof Error
								? error.message
								: __('Location could not be retrieved.', 'minimal-map'),
					});
				}
				throw error;
			} finally {
				setRowActionPending(false);
			}
		},
		[config, loadLocations]
	);

	const onDeleteLocation = useCallback(
		async (location: LocationRecord): Promise<void> => {
			setRowActionPending(true);
			setActionNotice(null);

			try {
				await deleteLocation(config, location.id);
				await loadLocations();
				setActionNotice({
					status: 'success',
					message: __('Location deleted.', 'minimal-map'),
				});
			} catch (error) {
				setActionNotice({
					status: 'error',
					message:
						error instanceof Error
							? error.message
							: __('Location could not be deleted.', 'minimal-map'),
				});
				throw error;
			} finally {
				setRowActionPending(false);
			}
		},
		[config, loadLocations]
	);

	const onDeleteLocations = useCallback(
		async (items: LocationRecord[]): Promise<void> => {
			setRowActionPending(true);
			setActionNotice(null);

			try {
				for (const item of items) {
					await deleteLocation(config, item.id);
				}
				await loadLocations();
				setActionNotice({
					status: 'success',
					message:
						items.length === 1
							? __('Location deleted.', 'minimal-map')
							: sprintf(
								_n( '%d location deleted.', '%d locations deleted.', items.length, 'minimal-map' ),
								items.length
							),
				});
			} catch (error) {
				setActionNotice({
					status: 'error',
					message:
						error instanceof Error
							? error.message
							: __('Locations could not be deleted.', 'minimal-map'),
				});
				throw error;
			} finally {
				setRowActionPending(false);
			}
		},
		[config, loadLocations]
	);

	const onAssignLocationToCollection = useCallback(async (): Promise<void> => {
		if (!selectedAssignmentLocation || !assignmentCollectionId) {
			return;
		}

		const collectionId = Number(assignmentCollectionId);
		const selectedCollection = collections.find((collection) => collection.id === collectionId);

		if (!selectedCollection) {
			setActionNotice({
				status: 'error',
				message: __('Selected collection could not be found.', 'minimal-map'),
			});
			return;
		}

		if (selectedCollection.location_ids.includes(selectedAssignmentLocation.id)) {
			setActionNotice({
				status: 'success',
				message: __('Location is already assigned to that collection.', 'minimal-map'),
			});
			resetAssignToCollectionState();
			return;
		}

		setAssignmentSaving(true);
		setActionNotice(null);

		try {
			await updateCollection(
				collectionsConfig,
				selectedCollection.id,
				selectedCollection.title,
				Array.from(new Set([...selectedCollection.location_ids, selectedAssignmentLocation.id]))
			);
			await loadLocations();
			setActionNotice({
				status: 'success',
				message: __('Location assigned to collection.', 'minimal-map'),
			});
			resetAssignToCollectionState();
		} catch (error) {
			setActionNotice({
				status: 'error',
				message:
					error instanceof Error
						? error.message
						: __('Location could not be assigned to the collection.', 'minimal-map'),
			});
		} finally {
			setAssignmentSaving(false);
		}
	}, [
		assignmentCollectionId,
		collections,
		collectionsConfig,
		loadLocations,
		resetAssignToCollectionState,
		selectedAssignmentLocation,
	]);

	const onRemoveCollectionAssignment = useCallback(async (): Promise<void> => {
		if (!selectedRemovalLocation || !selectedRemovalCollection) {
			return;
		}

		setRemovingCollectionAssignment(true);
		setActionNotice(null);

		try {
			await updateCollection(
				collectionsConfig,
				selectedRemovalCollection.id,
				selectedRemovalCollection.title,
				selectedRemovalCollection.location_ids.filter(
					(locationId) => locationId !== selectedRemovalLocation.id
				)
			);
			await loadLocations();
			setActionNotice({
				status: 'success',
				message: __('Collection removed from location.', 'minimal-map'),
			});
			resetRemoveCollectionAssignmentState();
		} catch (error) {
			setActionNotice({
				status: 'error',
				message:
					error instanceof Error
						? error.message
						: __('Collection could not be removed from the location.', 'minimal-map'),
			});
		} finally {
			setRemovingCollectionAssignment(false);
		}
	}, [
		collectionsConfig,
		loadLocations,
		resetRemoveCollectionAssignmentState,
		selectedRemovalCollection,
		selectedRemovalLocation,
	]);

	const onMapLocationSelect = useCallback((coordinates: MapCoordinates): void => {
		setSelectedCoordinates(coordinates);
		setMapCenter(coordinates);
		setForm((currentForm) => ({
			...currentForm,
			latitude: `${coordinates.lat}`,
			longitude: `${coordinates.lng}`,
		}));
		setSubmitError(null);
		setGeocodeError(null);
	}, []);

	const onConfirm = useCallback(async (): Promise<void> => {
		if (step === 'details') {
			const errors = validateDetailsStep(form);
			setFieldErrors(errors);

			if (hasFieldErrors(errors)) {
				return;
			}

			setSubmitError(null);
			setStep('address');
			return;
		}

		if (step === 'address') {
			const errors = {
				...validateDetailsStep(form),
				...validateAddressStep(form),
			};
			setFieldErrors(errors);

			if (hasFieldErrors(errors)) {
				return;
			}

			if (formMode === 'edit' && !hasLocationAddressChanged(form, originalForm)) {
				const latitude = Number(originalForm?.latitude ?? '');
				const longitude = Number(originalForm?.longitude ?? '');
				const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude);
				const coordinates = hasCoordinates ? { lat: latitude, lng: longitude } : null;

				setSubmitError(null);
				setGeocodeError(null);
				setGeocodeNotice(null);
				setMapCenter(coordinates ?? DEFAULT_MAP_CENTER);
				setSelectedCoordinates(coordinates);
				setForm((currentForm) => ({
					...currentForm,
					latitude: coordinates ? `${coordinates.lat}` : '',
					longitude: coordinates ? `${coordinates.lng}` : '',
				}));
				setStep('map');
				return;
			}

			setGeocoding(true);
			setSubmitError(null);
			setGeocodeError(null);
			setGeocodeNotice(null);

			try {
				const result = await geocodeAddress(config, form);

				if (result.success) {
					const coordinates = { lat: result.lat, lng: result.lng };
					setMapCenter(coordinates);
					setSelectedCoordinates(coordinates);
					setForm((currentForm) => ({
						...currentForm,
						latitude: `${result.lat}`,
						longitude: `${result.lng}`,
					}));
					if (result.label) {
						setGeocodeNotice(result.label);
					}
				} else {
					setMapCenter(DEFAULT_MAP_CENTER);
					setSelectedCoordinates(null);
					setForm((currentForm) => ({
						...currentForm,
						latitude: '',
						longitude: '',
					}));
					setGeocodeError(result.message);
				}
			} catch (error) {
				setMapCenter(DEFAULT_MAP_CENTER);
				setSelectedCoordinates(null);
				setForm((currentForm) => ({
					...currentForm,
					latitude: '',
					longitude: '',
				}));
				setGeocodeError(
					error instanceof Error
						? error.message
						: __(
								'The address could not be geocoded right now. Select the location manually on the map.',
								'minimal-map'
						  )
				);
			} finally {
				setGeocoding(false);
				setStep('map');
			}

			return;
		}

		if (!selectedCoordinates) {
			setSubmitError(__('Select a location on the map before finishing.', 'minimal-map'));
			return;
		}

		setSubmitting(true);
		setSubmitError(null);

		try {
			const nextForm = {
				...form,
				latitude: `${selectedCoordinates.lat}`,
				longitude: `${selectedCoordinates.lng}`,
			};

			if (formMode === 'edit' && editingLocation) {
				await updateLocation(config, editingLocation.id, nextForm);
			} else {
				await createLocation(config, nextForm);
			}
			await loadLocations();
			setDialogOpen(false);
			resetDialogState();
		} catch (error) {
			setSubmitError(
				error instanceof Error
					? error.message
					: formMode === 'edit'
						? __('Location could not be updated.', 'minimal-map')
						: __('Location could not be created.', 'minimal-map')
			);
		} finally {
			setSubmitting(false);
		}
	}, [
		step,
		form,
		formMode,
		originalForm,
		config,
		loadLocations,
		editingLocation,
		selectedCoordinates,
	]);

	const onChangeCsvImportMapping = useCallback(
		(field: keyof CsvImportMapping, columnIndex: string): void => {
			setCsvImportMapping((currentMapping) => ({
				...currentMapping,
				[field]: columnIndex === '' ? null : Number(columnIndex),
			}));
		},
		[]
	);

	const onImportLocations = useCallback(async (file: File) => {
		setActionNotice(null);

		try {
			const parsedCsv = await parseCsvFile(file);

			if (isCommonCsvFormat(parsedCsv)) {
				setIsImporting(true);

				try {
					const result = await runCommonCsvImport(parsedCsv, config, collectionsConfig);

					await loadLocations();
					setActionNotice({
						status: 'success',
						message: sprintf(
							_n(
								'%d location imported and assigned to a new collection.',
								'%d locations imported and assigned to a new collection.',
								result.importedCount,
								'minimal-map'
							),
							result.importedCount
						),
					});
				} finally {
					setIsImporting(false);
				}

				return;
			}

			resetCustomCsvImportState();
			setPendingCsvImport(parsedCsv);
			setCustomCsvImportStep('mapping');
			setCustomCsvImportModalOpen(true);
		} catch (error) {
			setActionNotice({
				status: 'error',
				message: error instanceof Error ? error.message : __('Failed to import locations.', 'minimal-map'),
			});
		}
	}, [collectionsConfig, config, loadLocations, resetCustomCsvImportState]);

	const onStartCustomCsvImport = useCallback(async (): Promise<void> => {
		if (!pendingCsvImport) {
			return;
		}

		const totalGeocodeRequests = countMappedCsvGeocodeRequests(pendingCsvImport, csvImportMapping);

		setActionNotice(null);
		setCustomCsvImportStep('progress');
		setCsvImportProgressCompleted(0);
		setCsvImportProgressTotal(totalGeocodeRequests);
		setIsImporting(true);

		try {
			const result = await runMappedCsvImport(
				pendingCsvImport,
				csvImportMapping,
				config,
				collectionsConfig,
				{
					onGeocodeProgress: (completed, total) => {
						setCsvImportProgressCompleted(completed);
						setCsvImportProgressTotal(total);
					},
				}
			);

			await loadLocations();
			setActionNotice({
				status: 'success',
				message: sprintf(
					_n(
						'%d location imported and assigned to a new collection.',
						'%d locations imported and assigned to a new collection.',
						result.importedCount,
						'minimal-map'
					),
					result.importedCount
				),
			});
			resetCustomCsvImportState();
		} catch (error) {
			resetCustomCsvImportState();
			setActionNotice({
				status: 'error',
				message:
					error instanceof Error
						? error.message
						: __('Failed to import locations.', 'minimal-map'),
			});
		} finally {
			setIsImporting(false);
		}
	}, [
		collectionsConfig,
		config,
		csvImportMapping,
		loadLocations,
		pendingCsvImport,
		resetCustomCsvImportState,
	]);

	const onExportLocations = useCallback(() => {
		if (locations.length === 0) return;

		const headers = ['title', 'street', 'house_number', 'postal_code', 'city', 'state', 'country', 'telephone', 'email', 'website', 'latitude', 'longitude'];
		const csvRows = [headers.join(',')];

		for (const loc of locations) {
			const values = headers.map(header => {
				const val = (loc as any)[header] || '';
				return `"${val.toString().replace(/"/g, '""')}"`;
			});
			csvRows.push(values.join(','));
		}

		const csvContent = csvRows.join('\n');
		const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.setAttribute('href', url);
		link.setAttribute('download', 'minimal-map-locations.csv');
		link.style.visibility = 'hidden';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}, [locations]);

	const onExportExample = useCallback(() => {
		const headers = ['title', 'street', 'house_number', 'postal_code', 'city', 'state', 'country', 'telephone', 'email', 'website', 'latitude', 'longitude'];
		const exampleData = [
			'Brandenburg Gate,Pariser Platz,,10117,Berlin,Berlin,Germany,,,52.5162,13.3777',
			'Eiffel Tower,Champ de Mars,5 Avenue Anatole France,75007,Paris,,France,,,48.8584,2.2945'
		];
		const csvContent = [headers.join(','), ...exampleData].join('\n');
		const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.setAttribute('href', url);
		link.setAttribute('download', 'minimal-map-example.csv');
		link.style.visibility = 'hidden';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}, []);

	return {
		actionNotice,
		activeTheme: themeData.activeTheme,
		assignmentCollectionId,
		assignmentLogoId,
		assignmentMarkerId,
		assignmentTagIds,
		csvImportHeaders: pendingCsvImport?.headers ?? [],
		csvImportRows: pendingCsvImport?.rows ?? [],
		csvImportMapping,
		csvImportProgressCompleted,
		csvImportProgressTotal,
		csvImportStep: customCsvImportStep,
		collections,
		logos,
		markers,
		tags,
		dismissActionNotice,
		fieldErrors,
		form,
		formMode,
		getCollectionsForLocation,
		getLogoForLocation,
		getMarkerForLocation,
		getTagsForLocation,
		geocodeError,
		geocodeNotice,
		headerAction: enabled ? (
			<div className="minimal-map-styles__header-actions">
				<div className="minimal-map-styles__theme-controls">
					<ImportLocationsButton onImport={onImportLocations} isImporting={isImporting} />
					<ExportLocationsDropdown onExport={onExportLocations} onExportExample={onExportExample} />
				</div>
				<Button
					variant="primary"
					onClick={openDialog}
					icon={<Plus size={18} strokeWidth={2} />}
					iconPosition="left"
				>
					{__('Add location', 'minimal-map')}
				</Button>
			</div>
		) : null,
		isAssignToCollectionModalOpen,
		isAssignLogoModalOpen,
		isAssignMarkerModalOpen,
		isAssignTagsModalOpen,
		isAssignmentSaving,
		isDeleteLogoConfirmationModalOpen,
		isDialogOpen,
		isCustomCsvImportModalOpen,
		isGeocoding,
		isLoading,
		isRemoveCollectionAssignmentModalOpen,
		isRemovingCollectionAssignment,
		isRowActionPending,
		isSubmitting,
		isImporting,
		isExporting,
		loadError,
		locations,
		mapCenter,
		modalTitle:
			formMode === 'edit'
				? __('Edit location', 'minimal-map')
				: __('Add location', 'minimal-map'),
		onBack,
		onAssignLocationToCollection,
		onAssignLogoToLocation,
		onAssignMarkerToLocation,
		onAssignTagsToLocation,
		onCancel,
		onChangeCsvImportMapping,
		onChangeFormValue,
		onCloseAssignToCollectionModal: closeAssignToCollectionModal,
		onCloseCustomCsvImportModal: closeCustomCsvImportModal,
		onCloseAssignLogoModal: closeAssignLogoModal,
		onCloseAssignMarkerModal: closeAssignMarkerModal,
		onCloseAssignTagsModal: closeAssignTagsModal,
		onCloseDeleteLogoConfirmationModal: closeDeleteLogoConfirmationModal,
		onCloseRemoveCollectionAssignmentModal: closeRemoveCollectionAssignmentModal,
		onOpenAssignToCollectionModal,
		onOpenAssignLogoModal,
		onOpenAssignMarkerModal,
		onOpenAssignTagsModal,
		onOpenDeleteLogoConfirmationModal,
		onOpenRemoveCollectionAssignmentModal,
		onChangeView: (nextView) => {
			setView({
				...nextView,
				perPage: LOCATIONS_TABLE_PER_PAGE,
			});
			setSelection([]);
		},
		onChangeSelection: (nextSelection) => setSelection(nextSelection),
		onConfirm,
		onDeleteLocation,
		onDeleteLocations,
		onDuplicateLocation,
		onEditLocation,
		onImportLocations,
		onStartCustomCsvImport,
		onExportLocations,
		onExportExample,
		onMapLocationSelect,
		onClearLogoFromLocation,
		onRemoveCollectionAssignment,
		onRetrieveLocation,
		onSelectAssignmentCollection: setAssignmentCollectionId,
		onSelectAssignmentLogo: setAssignmentLogoId,
		onSelectAssignmentMarker: setAssignmentMarkerId,
		onSelectAssignmentTags: setAssignmentTagIds,
		onAddLocation: openDialog,
		paginatedLocations,
		selection,
		selectedAssignmentLocation,
		selectedMarkerLocation,
		selectedLogoLocation,
		selectedLogoRemovalLocation,
		selectedTagsLocation,
		selectedCoordinates,
		selectedRemovalCollection,
		selectedRemovalLocation,
		submitLabel:
			formMode === 'edit'
				? __('Save changes', 'minimal-map')
				: __('Finish', 'minimal-map'),
		submitError,
		step,
		totalPages,
		view,
	};
}
