import type { ViewGrid } from '@wordpress/dataviews';
import type { ReactNode } from 'react';
import type { TagRecord, StyleThemeRecord, TagFormState, TagFormMode } from '../../types';

export interface TagsNotice {
	status: 'success' | 'error';
	message: string;
}

export interface TagsController {
	actionNotice: TagsNotice | null;
	activeTheme: StyleThemeRecord | null;
	dismissActionNotice: () => void;
	headerAction: ReactNode;
	isDeleteModalOpen: boolean;
	isLoading: boolean;
	isRowActionPending: boolean;
	isSubmitting: boolean;
	isDialogOpen: boolean;
	loadError: string | null;
	tags: TagRecord[];
	form: TagFormState;
	formMode: TagFormMode;
	modalTitle: string;
	selectedTag: TagRecord | null;
	submitLabel: string;
	submitError: string | null;
	onAddTag: () => void;
	onCloseDeleteModal: () => void;
	onConfirmDeleteTag: () => Promise<void>;
	onDeleteTag: (tag: TagRecord) => Promise<void>;
	onEditTag: (tag: TagRecord) => void;
	onOpenDeleteModal: (tag: TagRecord) => void;
	onConfirm: () => Promise<void>;
	onCancel: () => void;
	onChangeFormValue: (key: keyof TagFormState, value: string) => void;
	onChangeView: (nextView: ViewGrid) => void;
	paginatedTags: TagRecord[];
	totalPages: number;
	view: ViewGrid;
}
