import { Button, FormFileUpload } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { Upload } from 'lucide-react';
import type { ViewGrid } from '@wordpress/dataviews';
import apiFetch from '@wordpress/api-fetch';
import type {
	MarkerRecord,
	MarkersAdminConfig,
} from '../../types';
import { configureApiFetch } from '../../lib/locations/configureApiFetch';
import { UploadMarkerButton } from './UploadMarkerButton';
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
	enabled: boolean
): MarkersController {
	const [actionNotice, setActionNotice] = useState<MarkersController['actionNotice']>(null);
	const [markers, setMarkers] = useState<MarkerRecord[]>([]);
	const [isLoading, setLoading] = useState(enabled);
	const [isRowActionPending, setRowActionPending] = useState(false);
	const [isUploading, setUploading] = useState(false);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [view, setView] = useState<ViewGrid>(DEFAULT_GRID_VIEW);

	const loadMarkers = useCallback(async (): Promise<void> => {
		if (!enabled) {
			return;
		}

		setLoading(true);
		setLoadError(null);

		try {
			const records = await apiFetch<any[]>({
				path: config.restPath + '?context=edit&per_page=100',
			});
			setMarkers(
				records.map((r) => ({
					id: r.id,
					title: typeof r.title === 'object' ? r.title.raw : r.title,
					content: typeof r.content === 'object' ? r.content.raw : r.content,
				}))
			);
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
							: __(`${fileList.length} markers uploaded.`, 'minimal-map'),
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
		dismissActionNotice,
		headerAction: enabled ? (
			<UploadMarkerButton onUpload={onUploadMarkers} isUploading={isUploading} />
		) : null,
		isLoading,
		isRowActionPending,
		isUploading,
		loadError,
		markers,
		onDeleteMarker,
		onDownloadMarker,
		onUploadMarkers,
		onChangeView: (nextView: ViewGrid) => setView(nextView),
		paginatedMarkers,
		totalPages,
		view,
	};
}
