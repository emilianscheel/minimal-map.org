import type { ViewGrid, ViewPickerTable } from '@wordpress/dataviews';
import type { ReactNode } from 'react';
import type {
	CollectionFormMode,
	CollectionFormState,
	CollectionRecord,
	LocationRecord,
} from '../../types';

export interface CollectionsNotice {
	status: 'success' | 'error';
	message: string;
}

export interface CollectionsController {
	actionNotice: CollectionsNotice | null;
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
	isDialogOpen: boolean;
	isLoading: boolean;
	isRowActionPending: boolean;
	isSubmitting: boolean;
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
	onConfirm: () => Promise<void>;
	onDeleteCollection: (collection: CollectionRecord) => Promise<void>;
	onEditCollection: (collection: CollectionRecord) => void;
	onOpenAssignmentModal: (collection: CollectionRecord) => void;
	onSaveAssignments: () => Promise<void>;
	paginatedCollections: CollectionRecord[];
	totalPages: number;
}
