import type { ViewGrid } from '@wordpress/dataviews';
import type { ReactNode } from 'react';
import type { MarkerRecord } from '../../types';

export interface MarkersNotice {
	status: 'success' | 'error';
	message: string;
}

export interface MarkersController {
	actionNotice: MarkersNotice | null;
	dismissActionNotice: () => void;
	headerAction: ReactNode;
	isLoading: boolean;
	isRowActionPending: boolean;
	isUploading: boolean;
	loadError: string | null;
	markers: MarkerRecord[];
	onDeleteMarker: (marker: MarkerRecord) => Promise<void>;
	onDownloadMarker: (marker: MarkerRecord) => void;
	onUploadMarkers: (files: FileList) => Promise<void>;
	onChangeView: (nextView: ViewGrid) => void;
	paginatedMarkers: MarkerRecord[];
	totalPages: number;
	view: ViewGrid;
}
