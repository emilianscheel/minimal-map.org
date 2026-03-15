import apiFetch from '@wordpress/api-fetch';
import type { ViewGrid } from '@wordpress/dataviews';
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { configureApiFetch } from '../../lib/locations/configureApiFetch';
import { createLocationFormStateFromRecord } from '../../lib/locations/createLocationFormStateFromRecord';
import { formatFilename, hasFilenameBasename, parseFilenameParts } from '../../lib/filenames';
import { fetchAllLocations } from '../../lib/locations/fetchAllLocations';
import { updateLocation } from '../../lib/locations/updateLocation';
import { fetchAllLogos } from '../../lib/logos/fetchAllLogos';
import { updateLogo } from '../../lib/logos/updateLogo';
import type { LocationRecord, LogoRecord, LocationsAdminConfig, LogosAdminConfig } from '../../types';
import { UploadLogoButton } from './UploadLogoButton';
import type { LogosController } from './types';

async function readLogoFile(file: File): Promise<string> {
	if (file.type === 'image/png' || file.name.toLowerCase().endsWith('.png')) {
		return await new Promise<string>((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => {
				if (typeof reader.result === 'string') {
					resolve(reader.result);
					return;
				}

				reject(new Error(__('Invalid PNG file.', 'minimal-map')));
			};
			reader.onerror = () => {
				reject(new Error(__('PNG file could not be read.', 'minimal-map')));
			};
			reader.readAsDataURL(file);
		});
	}

	const content = await file.text();

	if (!content.includes('<svg')) {
		throw new Error(__('Invalid SVG file.', 'minimal-map'));
	}

	return content;
}

const DEFAULT_GRID_VIEW: ViewGrid = {
	type: 'grid',
	page: 1,
	perPage: 12,
	titleField: 'title',
	mediaField: 'logo_preview',
	fields: [],
	showMedia: true,
	showTitle: true,
	showDescription: false,
	layout: {
		previewSize: 240,
		badgeFields: [],
	},
};

export function useLogosController(
	config: LogosAdminConfig,
	locationsConfig: LocationsAdminConfig,
	enabled: boolean
): LogosController {
	const [actionNotice, setActionNotice] = useState<LogosController['actionNotice']>(null);
	const [editFilenameBasename, setEditFilenameBasename] = useState('');
	const [editFilenameExtension, setEditFilenameExtension] = useState('');
	const [editingLogo, setEditingLogo] = useState<LogoRecord | null>(null);
	const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
	const [isEditDialogOpen, setEditDialogOpen] = useState(false);
	const [isLoading, setLoading] = useState(enabled);
	const [isRowActionPending, setRowActionPending] = useState(false);
	const [isSubmitting, setSubmitting] = useState(false);
	const [isUploading, setUploading] = useState(false);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [logos, setLogos] = useState<LogoRecord[]>([]);
	const [selectedLogo, setSelectedLogo] = useState<LogoRecord | null>(null);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [view, setView] = useState<ViewGrid>(DEFAULT_GRID_VIEW);

	const loadLogos = useCallback(async (): Promise<void> => {
		if (!enabled) {
			return;
		}

		setLoading(true);
		setLoadError(null);

		try {
			const records = await fetchAllLogos(config);
			setLogos(records);
		} catch (error) {
			setLoadError(
				error instanceof Error ? error.message : __('Logos could not be loaded.', 'minimal-map')
			);
		} finally {
			setLoading(false);
		}
	}, [config, enabled]);

	useEffect(() => {
		configureApiFetch(config.nonce || locationsConfig.nonce);

		if (!enabled) {
			return;
		}

		void loadLogos();
	}, [config.nonce, enabled, loadLogos, locationsConfig.nonce]);

	const dismissActionNotice = useCallback((): void => {
		setActionNotice(null);
	}, []);

	const resetEditDialogState = useCallback((): void => {
		setEditingLogo(null);
		setEditFilenameBasename('');
		setEditFilenameExtension('');
		setSubmitError(null);
	}, []);

	const onEditLogo = useCallback(
		(logo: LogoRecord): void => {
			const { basename, extension } = parseFilenameParts(logo.title);

			setEditingLogo(logo);
			setEditFilenameBasename(basename);
			setEditFilenameExtension(extension);
			setSubmitError(null);
			setEditDialogOpen(true);
		},
		[]
	);

	const onCancelEditLogo = useCallback((): void => {
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

	const onCloseDeleteModal = useCallback((): void => {
		if (isRowActionPending) {
			return;
		}

		setDeleteModalOpen(false);
		setSelectedLogo(null);
	}, [isRowActionPending]);

	const onOpenDeleteModal = useCallback((logo: LogoRecord): void => {
		setSelectedLogo(logo);
		setDeleteModalOpen(true);
	}, []);

	const onConfirmDeleteLogo = useCallback(async (): Promise<void> => {
		if (!selectedLogo) {
			return;
		}

		setRowActionPending(true);
		setActionNotice(null);

		try {
			const locations = await fetchAllLocations(locationsConfig);
			const assignedLocations = locations.filter((location) => location.logo_id === selectedLogo.id);

			await Promise.all(
				assignedLocations.map((location: LocationRecord) =>
					updateLocation(locationsConfig, location.id, {
						...createLocationFormStateFromRecord(location),
						logo_id: 0,
					})
				)
			);

			await apiFetch({
				path: `${config.restPath}/${selectedLogo.id}`,
				method: 'DELETE',
			});

			await loadLogos();
			setActionNotice({
				status: 'success',
				message: __('Logo deleted.', 'minimal-map'),
			});
			setDeleteModalOpen(false);
			setSelectedLogo(null);
		} catch (error) {
			setActionNotice({
				status: 'error',
				message:
					error instanceof Error ? error.message : __('Logo could not be deleted.', 'minimal-map'),
			});
		} finally {
			setRowActionPending(false);
		}
	}, [config.restPath, loadLogos, locationsConfig, selectedLogo]);

	const onConfirmEditLogo = useCallback(async (): Promise<void> => {
		if (!editingLogo) {
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
			await updateLogo(
				config,
				editingLogo.id,
				formatFilename(editFilenameBasename, editFilenameExtension)
			);
			await loadLogos();
			setEditDialogOpen(false);
			resetEditDialogState();
			setActionNotice({
				status: 'success',
				message: __('Logo updated.', 'minimal-map'),
			});
		} catch (error) {
			setSubmitError(
				error instanceof Error ? error.message : __('Logo could not be updated.', 'minimal-map')
			);
		} finally {
			setSubmitting(false);
		}
	}, [
		config,
		editFilenameBasename,
		editFilenameExtension,
		editingLogo,
		loadLogos,
		resetEditDialogState,
	]);

	const onDownloadLogo = useCallback((logo: LogoRecord): void => {
		const isDataUrl = logo.content.startsWith('data:');
		const href = isDataUrl
			? logo.content
			: URL.createObjectURL(new Blob([logo.content], { type: 'image/svg+xml' }));
		const link = document.createElement('a');
		const hasKnownExtension = /\.(png|svg)$/i.test(logo.title);
		const inferredExtension = isDataUrl ? '.png' : '.svg';

		link.href = href;
		link.download = hasKnownExtension ? logo.title : `${logo.title}${inferredExtension}`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);

		if (!isDataUrl) {
			URL.revokeObjectURL(href);
		}
	}, []);

	const onUploadLogos = useCallback(
		async (files: FileList | File[]): Promise<void> => {
			const fileList = Array.from(files).filter(
				(file) =>
					file.type === 'image/svg+xml' ||
					file.type === 'image/png' ||
					file.name.toLowerCase().endsWith('.svg') ||
					file.name.toLowerCase().endsWith('.png')
			);

			if (fileList.length === 0) {
				return;
			}

			setUploading(true);
			setActionNotice(null);

			try {
				await Promise.all(
					fileList.map(async (file) => {
						const content = await readLogoFile(file);

						return apiFetch({
							path: config.restPath,
							method: 'POST',
							data: {
								title: file.name,
								content,
								status: 'publish',
							},
						});
					})
				);
				await loadLogos();
				setActionNotice({
					status: 'success',
					message:
						fileList.length === 1
							? __('Logo uploaded.', 'minimal-map')
							: sprintf(
								_n( '%d logo uploaded.', '%d logos uploaded.', fileList.length, 'minimal-map' ),
								fileList.length
							),
				});
			} catch (error) {
				setActionNotice({
					status: 'error',
					message:
						error instanceof Error ? error.message : __('Logos could not be uploaded.', 'minimal-map'),
				});
			} finally {
				setUploading(false);
			}
		},
		[config.restPath, loadLogos]
	);

	const { paginatedLogos, totalPages } = useMemo(() => {
		const search = view.search?.toLowerCase() || '';
		const filtered = search
			? logos.filter((logo) => logo.title.toLowerCase().includes(search))
			: logos;

		const page = view.page ?? 1;
		const perPage = view.perPage ?? 12;
		const pages = Math.max(1, Math.ceil(filtered.length / perPage));
		const startIndex = (page - 1) * perPage;

		return {
			paginatedLogos: filtered.slice(startIndex, startIndex + perPage),
			totalPages: pages,
		};
	}, [logos, view]);

	return {
		actionNotice,
		dismissActionNotice,
		editFilenameBasename,
		editFilenameExtension,
		editingLogo,
		headerAction: enabled ? (
			<div className="minimal-map-admin__header-actions-group">
				<UploadLogoButton onUpload={(files) => void onUploadLogos(files)} isUploading={isUploading} />
			</div>
		) : null,
		isDeleteModalOpen,
		isEditDialogOpen,
		isLoading,
		isRowActionPending,
		isSubmitting,
		isUploading,
		loadError,
		logos,
		onChangeView: (nextView: ViewGrid) => setView(nextView),
		onCancelEditLogo,
		onChangeEditFilename,
		onCloseDeleteModal,
		onConfirmDeleteLogo,
		onConfirmEditLogo,
		onDownloadLogo,
		onEditLogo,
		onOpenDeleteModal,
		onUploadLogos,
		paginatedLogos,
		selectedLogo,
		submitError,
		totalPages,
		view,
	};
}
