import type { ViewTable } from '@wordpress/dataviews';
import type { ReactNode } from 'react';
import type {
	CsvImportMapping,
	CsvOpeningHoursImportMapping,
} from '../../lib/locations/importLocations';
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
	OpeningHoursDayKey,
	LocationOpeningHoursDay,
	StyleThemeRecord,
	TagRecord,
} from '../../types';
import type { CsvImportColumnOption } from './customCsvImport';

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
	csvImportColumnOptions: CsvImportColumnOption[];
	csvImportLogoId: string;
	csvImportMarkerId: string;
	csvImportOpeningHoursColumnOptions: CsvImportColumnOption[];
	csvImportOpeningHoursMapping: CsvOpeningHoursImportMapping;
	csvImportRows: string[][];
	csvImportTagIds: number[];
	csvImportMapping: CsvImportMapping;
	csvImportProgressCompleted: number;
	csvImportProgressTotal: number;
	csvImportStep: 'mapping' | 'opening_hours' | 'progress';
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
	isAssignOpeningHoursModalOpen: boolean;
	isAssignmentSaving: boolean;
	isDeleteLogoConfirmationModalOpen: boolean;
	isRemoveMarkerConfirmationModalOpen: boolean;
	isRemoveTagsConfirmationModalOpen: boolean;
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
	selectedLogoLocations: LocationRecord[];
	selectedMarkerLocations: LocationRecord[];
	selectedOpeningHoursLocations: LocationRecord[];
	selectedAssignmentLocation: LocationRecord | null;
	selectedTagsLocations: LocationRecord[];
	selectedLogoRemovalLocations: LocationRecord[];
	selectedMarkerRemovalLocations: LocationRecord[];
	selectedTagRemovalLocations: LocationRecord[];
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
	onAssignOpeningHoursToLocations: () => Promise<void>;
	dismissActionNotice: () => void;
	onBack: () => void;
	onCancel: () => void;
	onChangeFormValue: (key: keyof LocationFormState, value: any) => void;
	onChangeOpeningHoursDayValue: (
		dayKey: OpeningHoursDayKey,
		field: keyof LocationOpeningHoursDay,
		value: string | number
	) => void;
	onChangeOpeningHoursNotes: (value: string) => void;
	onChangeCsvImportMapping: (field: keyof CsvImportMapping, columnIndex: string) => void;
	onChangeCsvImportOpeningHoursMapping: (
		field: keyof CsvOpeningHoursImportMapping,
		columnIndex: string
	) => void;
	onAdvanceCustomCsvImportStep: () => void;
	onBackCustomCsvImportStep: () => void;
	onMapLocationSelect: (coordinates: MapCoordinates) => void;
	onCloseCustomCsvImportModal: () => void;
	onCloseRemoveCollectionAssignmentModal: () => void;
	onCloseAssignToCollectionModal: () => void;
	onCloseAssignLogoModal: () => void;
	onCloseAssignMarkerModal: () => void;
	onCloseAssignTagsModal: () => void;
	onCloseAssignOpeningHoursModal: () => void;
	onCloseDeleteLogoConfirmationModal: () => void;
	onCloseRemoveMarkerConfirmationModal: () => void;
	onCloseRemoveTagsConfirmationModal: () => void;
	onChangeView: (nextView: ViewTable) => void;
	onChangeSelection: (selection: string[]) => void;
	onConfirm: () => Promise<void>;
	onDeleteLocation: (location: LocationRecord) => Promise<void>;
	onDeleteLocations: (locations: LocationRecord[]) => Promise<void>;
	onDuplicateLocation: (location: LocationRecord) => Promise<void>;
	onEditLocation: (location: LocationRecord) => void;
	onOpenAssignToCollectionModal: (location: LocationRecord) => void;
	onOpenAssignLogoModal: (locations: LocationRecord | LocationRecord[]) => void;
	onOpenAssignMarkerModal: (locations: LocationRecord | LocationRecord[]) => void;
	onOpenAssignTagsModal: (locations: LocationRecord | LocationRecord[]) => void;
	onOpenAssignOpeningHoursModal: (locations: LocationRecord | LocationRecord[]) => void;
	onQuickAssignLogo: (location: LocationRecord, logoId: number) => Promise<void>;
	onQuickAssignMarker: (location: LocationRecord, markerId: number) => Promise<void>;
	onQuickAssignTag: (location: LocationRecord, tagId: number) => Promise<void>;
	onOpenDeleteLogoConfirmationModal: (locations: LocationRecord | LocationRecord[]) => void;
	onOpenRemoveMarkerConfirmationModal: (locations: LocationRecord[]) => void;
	onOpenRemoveTagsConfirmationModal: (locations: LocationRecord[]) => void;
	onOpenRemoveCollectionAssignmentModal: (
		location: LocationRecord,
		collection: CollectionRecord
	) => void;
	onClearLogosFromLocations: () => Promise<void>;
	onClearMarkersFromLocations: () => Promise<void>;
	onClearTagsFromLocations: () => Promise<void>;
	onRemoveCollectionAssignment: () => Promise<void>;
	onRetrieveLocation: (location: LocationRecord) => Promise<void>;
	onSelectAssignmentCollection: (collectionId: string) => void;
	onSelectAssignmentLogo: (logoId: string) => void;
	onSelectAssignmentMarker: (markerId: string) => void;
	onSelectAssignmentTags: (tagIds: number[]) => void;
	onSelectCsvImportLogo: (logoId: string) => void;
	onSelectCsvImportMarker: (markerId: string) => void;
	onSelectCsvImportTags: (tagIds: number[]) => void;
	onImportLocations: (file: File) => Promise<void>;
	onStartCustomCsvImport: () => Promise<void>;
	onExportLocations: () => void;
	onExportExample: () => void;
	onAddLocation: () => void;
	paginatedLocations: LocationRecord[];
	totalPages: number;
}
