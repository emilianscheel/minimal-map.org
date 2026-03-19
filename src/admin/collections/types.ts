import type { ViewGrid, ViewPickerTable } from '@wordpress/dataviews';
import type { ReactNode } from 'react';
import type {
	CollectionFormMode,
	CollectionFormState,
	CollectionRecord,
	LocationRecord,
	StyleThemeRecord,
} from '../../types';

export interface CollectionsNotice {
	status: 'success' | 'error';
	message: string;
}

export interface DeleteCollectionOptions {
	deleteLocations: boolean;
	skipSharedLocations: boolean;
}

export type MergeCollectionsStep = 'selection' | 'details';

export interface CollectionsController {
	actionNotice: CollectionsNotice | null;
	activeTheme: StyleThemeRecord | null;
	assignmentLocations: LocationRecord[];
	assignmentSearch: string;
	assignmentLocationsView: ViewPickerTable;
	collections: CollectionRecord[];
	filteredAssignmentLocationsCount: number;
	form: CollectionFormState;
	formMode: CollectionFormMode;
	headerAction: ReactNode;
	isAssignmentModalOpen: boolean;
	isAssignmentSaving: boolean;
	isDeleteAllCollectionsModalOpen: boolean;
	isDeletingAllCollections: boolean;
	isDialogOpen: boolean;
	isLoading: boolean;
	isRowActionPending: boolean;
	isSubmitting: boolean;
	isMergeModalOpen: boolean;
	isMerging: boolean;
	isImporting: boolean;
	mergeStep: MergeCollectionsStep;
	mergeSelectionView: ViewPickerTable;
	selectedMergeCollectionIds: number[];
	mergeTitle: string;
	shouldDeleteAfterMerge: boolean;
	loadError: string | null;
	locations: LocationRecord[];
	modalTitle: string;
	selectedAssignmentCollection: CollectionRecord | null;
	selectedLocationIds: number[];
	submitError: string | null;
	submitLabel: string;
	view: ViewGrid;
	dismissActionNotice: () => void;
	onCancel: () => void;
	onChangeAssignmentSearch: (value: string) => void;
	onChangeAssignmentLocationsSelection: (nextSelection: string[]) => void;
	onChangeAssignmentLocationsView: (nextView: ViewPickerTable) => void;
	onChangeFormValue: (key: keyof CollectionFormState, value: string) => void;
	onChangeView: (nextView: ViewGrid) => void;
	onCloseAssignmentModal: () => void;
	onCloseDeleteAllCollectionsModal: () => void;
	onConfirm: () => Promise<void>;
	onDeleteAllCollections: (options: DeleteCollectionOptions) => Promise<void>;
	onDeleteCollection: (
		collection: CollectionRecord,
		options: DeleteCollectionOptions
	) => Promise<void>;
	onEditCollection: (collection: CollectionRecord) => void;
	onOpenDeleteAllCollectionsModal: () => void;
	onOpenAssignmentModal: (collection: CollectionRecord) => void;
	onSaveAssignments: () => Promise<void>;
	onImportLocations: (file: File) => Promise<void>;
	onOpenMergeModal: () => void;
	onCloseMergeModal: () => void;
	onMergeConfirm: () => Promise<void>;
	onMergeBack: () => void;
	onChangeMergeSelection: (nextSelection: string[]) => void;
	onChangeMergeView: (nextView: ViewPickerTable) => void;
	onChangeMergeTitle: (value: string) => void;
	onToggleDeleteAfterMerge: () => void;
	onAddCollection: () => void;
	paginatedCollections: CollectionRecord[];
	totalPages: number;
}
