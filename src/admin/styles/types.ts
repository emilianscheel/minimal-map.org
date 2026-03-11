import { ReactNode } from 'react';
import { StyleThemeRecord, StyleThemeColors } from '../../types';

export interface StylesController {
	themes: StyleThemeRecord[];
	activeTheme: StyleThemeRecord | null;
	isLoading: boolean;
	isSaving: boolean;
	draftColors: StyleThemeColors | null;
	setDraftColor: (slot: string, color: string) => void;
	saveTheme: () => Promise<void>;
	createTheme: (label: string) => Promise<void>;
	deleteTheme: (slug: string) => Promise<void>;
	switchTheme: (slug: string) => void;
	importTheme: (config: StyleThemeRecord) => Promise<void>;
	onImportFiles: (files: FileList) => Promise<void>;
	exportTheme: () => void;
	headerAction: ReactNode;

	// Modal states
	isCreateModalOpen: boolean;
	isDeleteModalOpen: boolean;
	openCreateModal: () => void;
	closeCreateModal: () => void;
	openDeleteModal: () => void;
	closeDeleteModal: () => void;
}
