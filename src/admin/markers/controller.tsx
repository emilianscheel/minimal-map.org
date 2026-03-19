import { Button, FormFileUpload } from '@wordpress/components';
import { __, _n, sprintf } from '@wordpress/i18n';
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { BrushCleaning, Upload } from 'lucide-react';
import type { ViewGrid } from '@wordpress/dataviews';
import apiFetch from '@wordpress/api-fetch';
import type {
	MarkerRecord,
	MarkersAdminConfig,
	StyleThemeRecord,
} from '../../types';
import { formatFilename, hasFilenameBasename, parseFilenameParts } from '../../lib/filenames';
import { configureApiFetch } from '../../lib/locations/configureApiFetch';
import { fetchAllMarkers } from '../../lib/markers/fetchAllMarkers';
import { updateMarker } from '../../lib/markers/updateMarker';
import { UploadMarkerButton } from './UploadMarkerButton';
import { ThemeSelector } from '../styles/ThemeSelector';
import type { MarkersController } from './types';

const DEFAULT_GRID_VIEW: ViewGrid = {
	type: 'grid',
	page: 1,
	perPage: 12,
	titleField: 'title',
	mediaField: 'map_preview',
	fields: [],
	showMedia: true,
	showTitle: true,
	showDescription: false,
	layout: {
		previewSize: 200,
		badgeFields: [],
	},
};

export function useMarkersController(
	config: MarkersAdminConfig,
	enabled: boolean,
	themeData: {
		activeTheme: StyleThemeRecord | null;
		themes: StyleThemeRecord[];
		onSwitchTheme: (slug: string) => void;
	}
): MarkersController {
	const [actionNotice, setActionNotice] = useState<MarkersController['actionNotice']>(null);
	const [editFilenameBasename, setEditFilenameBasename] = useState('');
	const [editFilenameExtension, setEditFilenameExtension] = useState('');
	const [editingMarker, setEditingMarker] = useState<MarkerRecord | null>(null);
	const [isDeleteAllMarkersModalOpen, setDeleteAllMarkersModalOpen] = useState(false);
	const [isDeletingAllMarkers, setDeletingAllMarkers] = useState(false);
	const [isEditDialogOpen, setEditDialogOpen] = useState(false);
	const [markers, setMarkers] = useState<MarkerRecord[]>([]);
	const [isLoading, setLoading] = useState(enabled);
	const [isRowActionPending, setRowActionPending] = useState(false);
	const [isSubmitting, setSubmitting] = useState(false);
	const [isUploading, setUploading] = useState(false);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [view, setView] = useState<ViewGrid>(DEFAULT_GRID_VIEW);

	const loadMarkers = useCallback(async (): Promise<void> => {
		if (!enabled) {
			return;
		}

		setLoading(true);
		setLoadError(null);

		try {
			setMarkers(await fetchAllMarkers(config));
		} catch (error) {
			setLoadError(
				error instanceof Error
					? error.message
					: __('Markers could not be loaded.', 'minimal-map')
			);
		} finally {
			setLoading(false);
		}
	}, [config.restPath, enabled]);

	useEffect(() => {
		configureApiFetch(config.nonce);

		if (!enabled) {
			return;
		}

		void loadMarkers();
	}, [config.nonce, enabled, loadMarkers]);

	const dismissActionNotice = useCallback((): void => {
		setActionNotice(null);
	}, []);

	const resetEditDialogState = useCallback((): void => {
		setEditingMarker(null);
		setEditFilenameBasename('');
		setEditFilenameExtension('');
		setSubmitError(null);
	}, []);

	const onEditMarker = useCallback((marker: MarkerRecord): void => {
		const { basename, extension } = parseFilenameParts(marker.title);

		setEditingMarker(marker);
		setEditFilenameBasename(basename);
		setEditFilenameExtension(extension);
		setSubmitError(null);
		setEditDialogOpen(true);
	}, []);

	const onCancelEditMarker = useCallback((): void => {
		if (isSubmitting) {
			return;
		}

		setEditDialogOpen(false);
		resetEditDialogState();
	}, [isSubmitting, resetEditDialogState]);

	const onChangeEditFilename = useCallback((value: string): void => {
		setEditFilenameBasename(value);
		setSubmitError(null);
	}, []);

	const onCloseDeleteAllMarkersModal = useCallback((): void => {
		if (isDeletingAllMarkers || isRowActionPending) {
			return;
		}

		setDeleteAllMarkersModalOpen(false);
	}, [isDeletingAllMarkers, isRowActionPending]);

	const onOpenDeleteAllMarkersModal = useCallback((): void => {
		setDeleteAllMarkersModalOpen(true);
	}, []);

	const onDeleteMarker = useCallback(
		async (marker: MarkerRecord): Promise<void> => {
			setRowActionPending(true);
			setActionNotice(null);

			try {
				await apiFetch({
					path: `${config.restPath}/${marker.id}`,
					method: 'DELETE',
				});
				await loadMarkers();
				setActionNotice({
					status: 'success',
					message: __('Marker deleted.', 'minimal-map'),
				});
			} catch (error) {
				setActionNotice({
					status: 'error',
					message:
						error instanceof Error
							? error.message
							: __('Marker could not be deleted.', 'minimal-map'),
				});
				throw error;
			} finally {
				setRowActionPending(false);
			}
		},
		[config.restPath, loadMarkers]
	);

	const onDeleteAllMarkers = useCallback(async (): Promise<void> => {
		if (markers.length === 0) {
			setDeleteAllMarkersModalOpen(false);
			return;
		}

		setDeletingAllMarkers(true);
		setRowActionPending(true);
		setActionNotice(null);

		try {
			for (const marker of markers) {
				await apiFetch({
					path: `${config.restPath}/${marker.id}`,
					method: 'DELETE',
				});
			}

			await loadMarkers();
			setDeleteAllMarkersModalOpen(false);
			setActionNotice({
				status: 'success',
				message: sprintf(
					_n('%d marker deleted.', '%d markers deleted.', markers.length, 'minimal-map'),
					markers.length
				),
			});
		} catch (error) {
			setActionNotice({
				status: 'error',
				message:
					error instanceof Error
						? error.message
						: __('Markers could not be deleted.', 'minimal-map'),
			});
			throw error;
		} finally {
			setDeletingAllMarkers(false);
			setRowActionPending(false);
		}
	}, [config.restPath, loadMarkers, markers]);

	const onDownloadMarker = useCallback((marker: MarkerRecord): void => {
		const blob = new Blob([marker.content], { type: 'image/svg+xml' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = marker.title.endsWith('.svg') ? marker.title : `${marker.title}.svg`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	}, []);

	const onConfirmEditMarker = useCallback(async (): Promise<void> => {
		if (!editingMarker) {
			return;
		}

		if (!hasFilenameBasename(editFilenameBasename)) {
			setSubmitError(__('Filename is required.', 'minimal-map'));
			return;
		}

		setSubmitting(true);
		setSubmitError(null);
		setActionNotice(null);

		try {
			await updateMarker(
				config,
				editingMarker.id,
				formatFilename(editFilenameBasename, editFilenameExtension)
			);
			await loadMarkers();
			setEditDialogOpen(false);
			resetEditDialogState();
			setActionNotice({
				status: 'success',
				message: __('Marker updated.', 'minimal-map'),
			});
		} catch (error) {
			setSubmitError(
				error instanceof Error ? error.message : __('Marker could not be updated.', 'minimal-map')
			);
		} finally {
			setSubmitting(false);
		}
	}, [
		config,
		editFilenameBasename,
		editFilenameExtension,
		editingMarker,
		loadMarkers,
		resetEditDialogState,
	]);

	const onUploadMarkers = useCallback(
		async (files: FileList | File[]): Promise<void> => {
			const fileList = Array.from(files).filter((file) => file.type === 'image/svg+xml' || file.name.endsWith('.svg'));

			if (fileList.length === 0) {
				return;
			}

			setUploading(true);
			setActionNotice(null);

			try {
				await Promise.all(
					fileList.map(async (file) => {
						const content = await file.text();
						// Basic SVG validation (very simple)
						if (!content.includes('<svg')) {
							throw new Error(__('Invalid SVG file.', 'minimal-map'));
						}

						return apiFetch({
							path: config.restPath,
							method: 'POST',
							data: {
								title: file.name,
								content: content,
								status: 'publish',
							},
						});
					})
				);
				await loadMarkers();
				setActionNotice({
					status: 'success',
					message:
						fileList.length === 1
							? __('Marker uploaded.', 'minimal-map')
							: sprintf(
								_n( '%d marker uploaded.', '%d markers uploaded.', fileList.length, 'minimal-map' ),
								fileList.length
							),
				});
			} catch (error) {
				setActionNotice({
					status: 'error',
					message:
						error instanceof Error
							? error.message
							: __('Markers could not be uploaded.', 'minimal-map'),
				});
			} finally {
				setUploading(false);
			}
		},
		[config.restPath, loadMarkers]
	);

	const { paginatedMarkers, totalPages } = useMemo(() => {
		const search = view.search?.toLowerCase() || '';
		const filtered = search
			? markers.filter((m) => m.title.toLowerCase().includes(search))
			: markers;

		const page = view.page ?? 1;
		const perPage = view.perPage ?? 12;
		const pages = Math.max(1, Math.ceil(filtered.length / perPage));
		const startIndex = (page - 1) * perPage;

		return {
			paginatedMarkers: filtered.slice(startIndex, startIndex + perPage),
			totalPages: pages,
		};
	}, [markers, view]);

	return {
		actionNotice,
		activeTheme: themeData.activeTheme,
		dismissActionNotice,
		editFilenameBasename,
		editFilenameExtension,
		editingMarker,
		headerAction: enabled ? (
			<div className="minimal-map-admin__header-actions-group">
				<Button
					variant="tertiary"
					icon={<BrushCleaning size={18} strokeWidth={2} />}
					label={__('Delete all markers', 'minimal-map')}
					onClick={onOpenDeleteAllMarkersModal}
					disabled={markers.length === 0 || isDeletingAllMarkers || isRowActionPending || isUploading}
					__next40pxDefaultSize
				/>
				<ThemeSelector
					activeTheme={themeData.activeTheme}
					themes={themeData.themes}
					onSwitch={themeData.onSwitchTheme}
				/>
				<UploadMarkerButton onUpload={onUploadMarkers} isUploading={isUploading} />
			</div>
		) : null,
		isDeleteAllMarkersModalOpen,
		isDeletingAllMarkers,
		isEditDialogOpen,
		isLoading,
		isRowActionPending,
		isSubmitting,
		isUploading,
		loadError,
		markers,
		onCancelEditMarker,
		onChangeEditFilename,
		onCloseDeleteAllMarkersModal,
		onDeleteAllMarkers,
		onDeleteMarker,
		onDownloadMarker,
		onConfirmEditMarker,
		onEditMarker,
		onOpenDeleteAllMarkersModal,
		onUploadMarkers,
		onChangeView: (nextView: ViewGrid) => setView(nextView),
		paginatedMarkers,
		submitError,
		totalPages,
		view,
	};
}
