import type { ViewTable } from '@wordpress/dataviews';
import type { ReactNode } from 'react';
import type {
	FieldErrors,
	LocationDialogStep,
	LocationFormState,
	LocationRecord,
	MapCoordinates,
} from '../../types';

export interface LocationsController {
	fieldErrors: FieldErrors;
	form: LocationFormState;
	geocodeError: string | null;
	geocodeNotice: string | null;
	headerAction: ReactNode;
	isDialogOpen: boolean;
	isGeocoding: boolean;
	isLoading: boolean;
	isSubmitting: boolean;
	loadError: string | null;
	locations: LocationRecord[];
	mapCenter: MapCoordinates | null;
	selectedCoordinates: MapCoordinates | null;
	submitError: string | null;
	step: LocationDialogStep;
	view: ViewTable;
	onBack: () => void;
	onCancel: () => void;
	onChangeFormValue: (key: keyof LocationFormState, value: string) => void;
	onMapLocationSelect: (coordinates: MapCoordinates) => void;
	onChangeView: (nextView: ViewTable) => void;
	onConfirm: () => Promise<void>;
	paginatedLocations: LocationRecord[];
	totalPages: number;
}
