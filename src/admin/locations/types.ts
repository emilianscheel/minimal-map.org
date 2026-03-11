import type { ViewTable } from '@wordpress/dataviews';
import type { ReactNode } from 'react';
import type { CsvImportMapping } from '../../lib/locations/importLocations';
import type {
	CollectionRecord,
	FieldErrors,
	LogoRecord,
	MarkerRecord,
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
	assignmentLogoId: string;
	assignmentMarkerId: string;
	assignmentTagIds: number[];
	csvImportHeaders: string[];
	csvImportRows: string[][];
	csvImportMapping: CsvImportMapping;
	csvImportProgressCompleted: number;
	csvImportProgressTotal: number;
	csvImportStep: 'mapping' | 'progress';
	collections: CollectionRecord[];
	logos: LogoRecord[];
	markers: MarkerRecord[];
	tags: TagRecord[];
	fieldErrors: FieldErrors;
	form: LocationFormState;
	formMode: LocationFormMode;
	geocodeError: string | null;
	geocodeNotice: string | null;
	headerAction: ReactNode;
	isAssignToCollectionModalOpen: boolean;
	isAssignLogoModalOpen: boolean;
	isAssignMarkerModalOpen: boolean;
	isAssignTagsModalOpen: boolean;
	isAssignmentSaving: boolean;
	isDeleteLogoConfirmationModalOpen: boolean;
	isDialogOpen: boolean;
	isGeocoding: boolean;
	isLoading: boolean;
	isCustomCsvImportModalOpen: boolean;
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
	getLogoForLocation: (locationId: number) => LogoRecord | null;
	getMarkerForLocation: (locationId: number) => MarkerRecord | null;
	getTagsForLocation: (locationId: number) => TagRecord[];
	selectedLogoLocation: LocationRecord | null;
	selectedMarkerLocation: LocationRecord | null;
	selectedAssignmentLocation: LocationRecord | null;
	selectedTagsLocation: LocationRecord | null;
	selectedLogoRemovalLocation: LocationRecord | null;
	selectedRemovalCollection: CollectionRecord | null;
	selectedRemovalLocation: LocationRecord | null;
	selectedCoordinates: MapCoordinates | null;
	selection: string[];
	submitLabel: string;
	submitError: string | null;
	step: LocationDialogStep;
	view: ViewTable;
	onAssignLocationToCollection: () => Promise<void>;
	onAssignLogoToLocation: () => Promise<void>;
	onAssignMarkerToLocation: () => Promise<void>;
	onAssignTagsToLocation: () => Promise<void>;
	dismissActionNotice: () => void;
	onBack: () => void;
	onCancel: () => void;
	onChangeFormValue: (key: keyof LocationFormState, value: any) => void;
	onChangeCsvImportMapping: (field: keyof CsvImportMapping, columnIndex: string) => void;
	onMapLocationSelect: (coordinates: MapCoordinates) => void;
	onCloseCustomCsvImportModal: () => void;
	onCloseRemoveCollectionAssignmentModal: () => void;
	onCloseAssignToCollectionModal: () => void;
	onCloseAssignLogoModal: () => void;
	onCloseAssignMarkerModal: () => void;
	onCloseAssignTagsModal: () => void;
	onCloseDeleteLogoConfirmationModal: () => void;
	onChangeView: (nextView: ViewTable) => void;
	onChangeSelection: (selection: string[]) => void;
	onConfirm: () => Promise<void>;
	onDeleteLocation: (location: LocationRecord) => Promise<void>;
	onDeleteLocations: (locations: LocationRecord[]) => Promise<void>;
	onDuplicateLocation: (location: LocationRecord) => Promise<void>;
	onEditLocation: (location: LocationRecord) => void;
	onOpenAssignToCollectionModal: (location: LocationRecord) => void;
	onOpenAssignLogoModal: (location: LocationRecord) => void;
	onOpenAssignMarkerModal: (location: LocationRecord) => void;
	onOpenAssignTagsModal: (location: LocationRecord) => void;
	onOpenDeleteLogoConfirmationModal: (location: LocationRecord) => void;
	onOpenRemoveCollectionAssignmentModal: (
		location: LocationRecord,
		collection: CollectionRecord
	) => void;
	onClearLogoFromLocation: () => Promise<void>;
	onRemoveCollectionAssignment: () => Promise<void>;
	onRetrieveLocation: (location: LocationRecord) => Promise<void>;
	onSelectAssignmentCollection: (collectionId: string) => void;
	onSelectAssignmentLogo: (logoId: string) => void;
	onSelectAssignmentMarker: (markerId: string) => void;
	onSelectAssignmentTags: (tagIds: number[]) => void;
	onImportLocations: (file: File) => Promise<void>;
	onStartCustomCsvImport: () => Promise<void>;
	onExportLocations: () => void;
	onExportExample: () => void;
	onAddLocation: () => void;
	paginatedLocations: LocationRecord[];
	totalPages: number;
}
