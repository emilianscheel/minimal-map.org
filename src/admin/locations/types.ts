import type { ViewTable } from '@wordpress/dataviews';
import type { ReactNode } from 'react';
import type {
	CollectionRecord,
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
	assignmentCollectionId: string;
	collections: CollectionRecord[];
	fieldErrors: FieldErrors;
	form: LocationFormState;
	formMode: LocationFormMode;
	geocodeError: string | null;
	geocodeNotice: string | null;
	headerAction: ReactNode;
	isAssignToCollectionModalOpen: boolean;
	isAssignmentSaving: boolean;
	isDialogOpen: boolean;
	isGeocoding: boolean;
	isLoading: boolean;
	isRemoveCollectionAssignmentModalOpen: boolean;
	isRemovingCollectionAssignment: boolean;
	isRowActionPending: boolean;
	isSubmitting: boolean;
	isImporting: boolean;
	isExporting: boolean;
	loadError: string | null;
	locations: LocationRecord[];
	mapCenter: MapCoordinates | null;
	modalTitle: string;
	getCollectionsForLocation: (locationId: number) => CollectionRecord[];
	selectedAssignmentLocation: LocationRecord | null;
	selectedRemovalCollection: CollectionRecord | null;
	selectedRemovalLocation: LocationRecord | null;
	selectedCoordinates: MapCoordinates | null;
	submitLabel: string;
	submitError: string | null;
	step: LocationDialogStep;
	view: ViewTable;
	onAssignLocationToCollection: () => Promise<void>;
	dismissActionNotice: () => void;
	onBack: () => void;
	onCancel: () => void;
	onChangeFormValue: (key: keyof LocationFormState, value: string) => void;
	onMapLocationSelect: (coordinates: MapCoordinates) => void;
	onCloseRemoveCollectionAssignmentModal: () => void;
	onCloseAssignToCollectionModal: () => void;
	onChangeView: (nextView: ViewTable) => void;
	onConfirm: () => Promise<void>;
	onDeleteLocation: (location: LocationRecord) => Promise<void>;
	onDuplicateLocation: (location: LocationRecord) => Promise<void>;
	onEditLocation: (location: LocationRecord) => void;
	onOpenAssignToCollectionModal: (location: LocationRecord) => void;
	onOpenRemoveCollectionAssignmentModal: (
		location: LocationRecord,
		collection: CollectionRecord
	) => void;
	onRemoveCollectionAssignment: () => Promise<void>;
	onRetrieveLocation: (location: LocationRecord) => Promise<void>;
	onSelectAssignmentCollection: (collectionId: string) => void;
	onImportLocations: (file: File) => Promise<void>;
	onExportLocations: () => void;
	onExportExample: () => void;
	paginatedLocations: LocationRecord[];
	totalPages: number;
}
