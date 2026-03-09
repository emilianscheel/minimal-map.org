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
	StyleThemeRecord,
	TagRecord,
} from '../../types';

export interface LocationsNotice {
	status: 'success' | 'error';
	message: string;
}

export interface LocationsController {
	actionNotice: LocationsNotice | null;
	activeTheme: StyleThemeRecord | null;
	assignmentCollectionId: string;
	assignmentTagIds: number[];
	collections: CollectionRecord[];
	tags: TagRecord[];
	fieldErrors: FieldErrors;
	form: LocationFormState;
	formMode: LocationFormMode;
	geocodeError: string | null;
	geocodeNotice: string | null;
	headerAction: ReactNode;
	isAssignToCollectionModalOpen: boolean;
	isAssignTagsModalOpen: boolean;
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
	getTagsForLocation: (locationId: number) => TagRecord[];
	selectedAssignmentLocation: LocationRecord | null;
	selectedTagsLocation: LocationRecord | null;
	selectedRemovalCollection: CollectionRecord | null;
	selectedRemovalLocation: LocationRecord | null;
	selectedCoordinates: MapCoordinates | null;
	selection: string[];
	submitLabel: string;
	submitError: string | null;
	step: LocationDialogStep;
	view: ViewTable;
	onAssignLocationToCollection: () => Promise<void>;
	onAssignTagsToLocation: () => Promise<void>;
	dismissActionNotice: () => void;
	onBack: () => void;
	onCancel: () => void;
	onChangeFormValue: (key: keyof LocationFormState, value: any) => void;
	onMapLocationSelect: (coordinates: MapCoordinates) => void;
	onCloseRemoveCollectionAssignmentModal: () => void;
	onCloseAssignToCollectionModal: () => void;
	onCloseAssignTagsModal: () => void;
	onChangeView: (nextView: ViewTable) => void;
	onChangeSelection: (selection: string[]) => void;
	onConfirm: () => Promise<void>;
	onDeleteLocation: (location: LocationRecord) => Promise<void>;
	onDeleteLocations: (locations: LocationRecord[]) => Promise<void>;
	onDuplicateLocation: (location: LocationRecord) => Promise<void>;
	onEditLocation: (location: LocationRecord) => void;
	onOpenAssignToCollectionModal: (location: LocationRecord) => void;
	onOpenAssignTagsModal: (location: LocationRecord) => void;
	onOpenRemoveCollectionAssignmentModal: (
		location: LocationRecord,
		collection: CollectionRecord
	) => void;
	onRemoveCollectionAssignment: () => Promise<void>;
	onRetrieveLocation: (location: LocationRecord) => Promise<void>;
	onSelectAssignmentCollection: (collectionId: string) => void;
	onSelectAssignmentTags: (tagIds: number[]) => void;
	onImportLocations: (file: File) => Promise<void>;
	onExportLocations: () => void;
	onExportExample: () => void;
	onAddLocation: () => void;
	paginatedLocations: LocationRecord[];
	totalPages: number;
}
