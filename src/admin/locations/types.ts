import type { ViewTable } from '@wordpress/dataviews';
import type { ReactNode } from 'react';
import type {
	FieldErrors,
	LocationFormMode,
	LocationDialogStep,
	LocationFormState,
	LocationRecord,
	MapCoordinates,
} from '../../types';

export interface LocationsNotice {
	status: 'success' | 'error';
	message: string;
}

export interface LocationsController {
	actionNotice: LocationsNotice | null;
	fieldErrors: FieldErrors;
	form: LocationFormState;
	formMode: LocationFormMode;
	geocodeError: string | null;
	geocodeNotice: string | null;
	headerAction: ReactNode;
	isDialogOpen: boolean;
	isGeocoding: boolean;
	isLoading: boolean;
	isRowActionPending: boolean;
	isSubmitting: boolean;
	loadError: string | null;
	locations: LocationRecord[];
	mapCenter: MapCoordinates | null;
	modalTitle: string;
	selectedCoordinates: MapCoordinates | null;
	submitLabel: string;
	submitError: string | null;
	step: LocationDialogStep;
	view: ViewTable;
	dismissActionNotice: () => void;
	onBack: () => void;
	onCancel: () => void;
	onChangeFormValue: (key: keyof LocationFormState, value: string) => void;
	onMapLocationSelect: (coordinates: MapCoordinates) => void;
	onChangeView: (nextView: ViewTable) => void;
	onConfirm: () => Promise<void>;
	onDeleteLocation: (location: LocationRecord) => Promise<void>;
	onDuplicateLocation: (location: LocationRecord) => Promise<void>;
	onEditLocation: (location: LocationRecord) => void;
	onRetrieveLocation: (location: LocationRecord) => Promise<void>;
	paginatedLocations: LocationRecord[];
	totalPages: number;
}
