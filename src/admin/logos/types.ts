import type { ViewGrid } from '@wordpress/dataviews';
import type { ReactNode } from 'react';
import type { LogoRecord } from '../../types';

export interface LogosNotice {
	status: 'success' | 'error';
	message: string;
}

export interface LogosController {
	actionNotice: LogosNotice | null;
	dismissActionNotice: () => void;
	editFilenameBasename: string;
	editFilenameExtension: string;
	editingLogo: LogoRecord | null;
	headerAction: ReactNode;
	isDeleteModalOpen: boolean;
	isEditDialogOpen: boolean;
	isLoading: boolean;
	isRowActionPending: boolean;
	isSubmitting: boolean;
	isUploading: boolean;
	loadError: string | null;
	logos: LogoRecord[];
	onChangeView: (nextView: ViewGrid) => void;
	onCancelEditLogo: () => void;
	onChangeEditFilename: (value: string) => void;
	onCloseDeleteModal: () => void;
	onConfirmDeleteLogo: () => Promise<void>;
	onConfirmEditLogo: () => Promise<void>;
	onDownloadLogo: (logo: LogoRecord) => void;
	onEditLogo: (logo: LogoRecord) => void;
	onOpenDeleteModal: (logo: LogoRecord) => void;
	onUploadLogos: (files: FileList | File[]) => Promise<void>;
	paginatedLogos: LogoRecord[];
	selectedLogo: LogoRecord | null;
	submitError: string | null;
	totalPages: number;
	view: ViewGrid;
}
