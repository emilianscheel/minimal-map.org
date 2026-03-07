import type { ViewGrid, ViewTable } from '@wordpress/dataviews';
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
	assignmentSearch: string;
	availableLocations: LocationRecord[];
	availableLocationsView: ViewTable;
	collections: CollectionRecord[];
	filteredAvailableLocationsCount: number;
	filteredAssignedLocationsCount: number;
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
	selectedLocations: LocationRecord[];
	selectedLocationsView: ViewTable;
	submitError: string | null;
	submitLabel: string;
	view: ViewGrid;
	dismissActionNotice: () => void;
	onAddLocationToAssignment: (location: LocationRecord) => void;
	onCancel: () => void;
	onChangeAssignmentSearch: (value: string) => void;
	onChangeAvailableLocationsView: (nextView: ViewTable) => void;
	onChangeFormValue: (key: keyof CollectionFormState, value: string) => void;
	onChangeSelectedLocationsView: (nextView: ViewTable) => void;
	onChangeView: (nextView: ViewGrid) => void;
	onCloseAssignmentModal: () => void;
	onConfirm: () => Promise<void>;
	onDeleteCollection: (collection: CollectionRecord) => Promise<void>;
	onEditCollection: (collection: CollectionRecord) => void;
	onOpenAssignmentModal: (collection: CollectionRecord) => void;
	onRemoveLocationFromAssignment: (location: LocationRecord) => void;
	onSaveAssignments: () => Promise<void>;
	paginatedCollections: CollectionRecord[];
	totalPages: number;
}
