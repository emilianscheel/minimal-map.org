import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { Plus } from 'lucide-react';
import type { ViewTable } from '@wordpress/dataviews';
import type {
	LocationDialogStep,
	LocationFormMode,
	LocationFormState,
	LocationRecord,
	LocationsAdminConfig,
	MapCoordinates,
} from '../../types';
import { configureApiFetch } from '../../lib/locations/configureApiFetch';
import { createEmptyFieldErrors } from '../../lib/locations/createEmptyFieldErrors';
import { createLocationFormStateFromRecord } from '../../lib/locations/createLocationFormStateFromRecord';
import { createLocation } from '../../lib/locations/createLocation';
import { deleteLocation } from '../../lib/locations/deleteLocation';
import { duplicateLocation } from '../../lib/locations/duplicateLocation';
import { fetchAllLocations } from '../../lib/locations/fetchAllLocations';
import { geocodeAddress } from '../../lib/locations/geocodeAddress';
import { hasFieldErrors } from '../../lib/locations/hasFieldErrors';
import { hasLocationAddressChanged } from '../../lib/locations/hasLocationAddressChanged';
import { paginateLocations } from '../../lib/locations/paginateLocations';
import { updateLocationCoordinates } from '../../lib/locations/updateLocationCoordinates';
import { updateLocation } from '../../lib/locations/updateLocation';
import { validateAddressStep } from '../../lib/locations/validateAddressStep';
import { validateDetailsStep } from '../../lib/locations/validateDetailsStep';
import { DEFAULT_FORM_STATE, DEFAULT_VIEW } from './constants';
import type { LocationsController } from './types';

const DEFAULT_MAP_CENTER: MapCoordinates = {
	lat: 52.517,
	lng: 13.388,
};

export function useLocationsController(
	config: LocationsAdminConfig,
	enabled: boolean
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
	const [step, setStep] = useState<LocationDialogStep>('details');
	const [view, setView] = useState<ViewTable>(DEFAULT_VIEW);
	const [mapCenter, setMapCenter] = useState<MapCoordinates | null>(null);
	const [selectedCoordinates, setSelectedCoordinates] = useState<MapCoordinates | null>(null);

	const loadLocations = useCallback(async () => {
		if (!enabled) {
			return;
		}

		setLoading(true);
		setLoadError(null);

		try {
			const records = await fetchAllLocations(config);
			setLocations(records);
		} catch (error) {
			setLoadError(
				error instanceof Error
					? error.message
					: __('Locations could not be loaded.', 'minimal-map')
			);
		} finally {
			setLoading(false);
		}
	}, [config, enabled]);

	useEffect(() => {
		configureApiFetch(config.nonce);

		if (!enabled) {
			return;
		}

		void loadLocations();
	}, [config.nonce, enabled, loadLocations]);

	useEffect(() => {
		setView((currentView) => ({
			...currentView,
			page: 1,
		}));
	}, [locations.length]);

	const { locations: paginatedLocations, totalPages } = useMemo(
		() => paginateLocations(locations, view),
		[locations, view]
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

	const onConfirm = async (): Promise<void> => {
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

			if (
				formMode === 'edit' &&
				!hasLocationAddressChanged(form, originalForm)
			) {
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
						: __('The address could not be geocoded right now. Select the location manually on the map.', 'minimal-map')
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
	};

	return {
		actionNotice,
		dismissActionNotice,
		fieldErrors,
		form,
		formMode,
		geocodeError,
		geocodeNotice,
		headerAction: enabled ? (
			<Button
				variant="primary"
				onClick={openDialog}
				icon={<Plus size={18} strokeWidth={2} />}
				iconPosition="left"
			>
				{__('Add location', 'minimal-map')}
			</Button>
		) : null,
		isDialogOpen,
		isGeocoding,
		isLoading,
		isRowActionPending,
		isSubmitting,
		loadError,
		locations,
		mapCenter,
		modalTitle:
			formMode === 'edit'
				? __('Edit location', 'minimal-map')
				: __('Add location', 'minimal-map'),
		onBack,
		onCancel,
		onChangeFormValue,
		onChangeView: (nextView) => setView(nextView),
		onConfirm,
		onDeleteLocation,
		onDuplicateLocation,
		onEditLocation,
		onMapLocationSelect,
		onRetrieveLocation,
		paginatedLocations,
		selectedCoordinates,
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
