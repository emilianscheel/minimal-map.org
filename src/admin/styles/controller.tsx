import { Button } from '@wordpress/components';
import apiFetch from '@wordpress/api-fetch';
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import type { StylesAdminConfig, StyleThemeRecord, StyleThemeColors } from '../../types';
import type { StylesController } from './types';
import { ThemeSelector } from './ThemeSelector';
import { CreateThemeButton } from './CreateThemeButton';
import { DeleteThemeButton } from './DeleteThemeButton';
import { ExportThemeButton } from './ExportThemeButton';
import { ImportThemeButton } from './ImportThemeButton';

export function useStylesController(
	config: StylesAdminConfig,
	active = false
): StylesController {
	const [ themes, setThemes ] = useState<StyleThemeRecord[]>([]);
	const [ activeThemeSlug, setActiveThemeSlug ] = useState<string>('default');
	const [ isLoading, setIsLoading ] = useState(true);
	const [ isSaving, setIsSaving ] = useState(false);
	const [ draftColors, setDraftColors ] = useState<StyleThemeColors | null>(null);

	// Modal states
	const [ isCreateModalOpen, setIsCreateModalOpen ] = useState(false);
	const [ isDeleteModalOpen, setIsDeleteModalOpen ] = useState(false);

	const activeTheme = useMemo(() => {
		return themes.find((t) => t.slug === activeThemeSlug) || themes[0] || null;
	}, [ themes, activeThemeSlug ]);

	const fetchThemes = useCallback(async () => {
		setIsLoading(true);
		try {
			const data = await apiFetch<StyleThemeRecord[]>({
				path: config.restPath,
			});
			setThemes(data);
			if (data.length > 0) {
				const nextTheme = data.find((t) => t.slug === activeThemeSlug) || data[0];
				setActiveThemeSlug(nextTheme.slug);
				setDraftColors(nextTheme.colors);
			}
		} catch (error) {
			console.error('Failed to fetch themes', error);
		} finally {
			setIsLoading(false);
		}
	}, [ config.restPath, activeThemeSlug ]);

	useEffect(() => {
		if (active) {
			fetchThemes();
		}
	}, [ active ]);

	const switchTheme = useCallback((slug: string) => {
		const theme = themes.find((t) => t.slug === slug);
		if (theme) {
			setActiveThemeSlug(slug);
			setDraftColors(theme.colors);
		}
	}, [ themes ]);

	const setDraftColor = useCallback((slot: string, color: string) => {
		setDraftColors((prev) => {
			if (!prev) return null;
			return { ...prev, [ slot ]: color };
		});
	}, []);

	const saveTheme = useCallback(async () => {
		if (!activeTheme || !draftColors) return;

		setIsSaving(true);
		try {
			const updatedTheme = await apiFetch<StyleThemeRecord>({
				path: `${ config.restPath }/${ activeTheme.slug }`,
				method: 'PUT',
				data: { colors: draftColors },
			});
			setThemes((prev) =>
				prev.map((theme) =>
					theme.slug === updatedTheme.slug ? updatedTheme : theme
				)
			);
		} catch (error) {
			console.error('Failed to save theme', error);
		} finally {
			setIsSaving(false);
		}
	}, [ activeTheme, config.restPath, draftColors ]);

	const createTheme = useCallback(async (label: string) => {
		setIsLoading(true);
		try {
			const newTheme = await apiFetch<StyleThemeRecord>({
				path: config.restPath,
				method: 'POST',
				data: { label },
			});
			setThemes((prev) => [ ...prev, newTheme ]);
			setActiveThemeSlug(newTheme.slug);
			setDraftColors(newTheme.colors);
			setIsCreateModalOpen(false);
		} catch (error) {
			console.error('Failed to create theme', error);
		} finally {
			setIsLoading(false);
		}
	}, [ config.restPath ]);

	const deleteTheme = useCallback(async (slug: string) => {
		if (slug === 'default') return;

		setIsLoading(true);
		try {
			await apiFetch({
				path: `${ config.restPath }/${ slug }`,
				method: 'DELETE',
			});
			setThemes((prev) => prev.filter((t) => t.slug !== slug));
			setActiveThemeSlug('default');
			const defaultTheme = themes.find((t) => t.slug === 'default');
			if (defaultTheme) {
				setDraftColors(defaultTheme.colors);
			}
			setIsDeleteModalOpen(false);
		} catch (error) {
			console.error('Failed to delete theme', error);
		} finally {
			setIsLoading(false);
		}
	}, [ config.restPath, themes ]);

	const exportTheme = useCallback(() => {
		if (!activeTheme || !draftColors) return;

		const configToExport = {
			...activeTheme,
			colors: draftColors,
		};

		const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(configToExport, null, 2));
		const downloadAnchorNode = document.createElement('a');
		downloadAnchorNode.setAttribute('href', dataStr);
		downloadAnchorNode.setAttribute('download', `minimal-map-theme-${ activeTheme.slug }.json`);
		document.body.appendChild(downloadAnchorNode);
		downloadAnchorNode.click();
		downloadAnchorNode.remove();
	}, [ activeTheme, draftColors ]);

	const importTheme = useCallback(async (configData: StyleThemeRecord) => {
		setIsLoading(true);
		try {
			const newTheme = await apiFetch<StyleThemeRecord>({
				path: config.restPath,
				method: 'POST',
				data: { label: (configData.label || 'Imported') + ' (Imported)' },
			});

			const updatedTheme = await apiFetch<StyleThemeRecord>({
				path: `${ config.restPath }/${ newTheme.slug }`,
				method: 'PUT',
				data: { colors: configData.colors },
			});

			setThemes((prev) => [ ...prev, updatedTheme ]);
			setActiveThemeSlug(updatedTheme.slug);
			setDraftColors(updatedTheme.colors);
		} catch (error) {
			console.error('Failed to import theme', error);
		} finally {
			setIsLoading(false);
		}
	}, [ config.restPath ]);

	const onImportFiles = useCallback(async (files: FileList) => {
		const file = files[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = async (readerEvent) => {
			try {
				const content = JSON.parse(readerEvent.target?.result as string);
				await importTheme(content);
			} catch (err) {
				alert(__('Invalid JSON file.', 'minimal-map'));
			}
		};
		reader.readAsText(file);
	}, [ importTheme ]);

	const openCreateModal = () => setIsCreateModalOpen(true);
	const closeCreateModal = () => setIsCreateModalOpen(false);
	const openDeleteModal = () => setIsDeleteModalOpen(true);
	const closeDeleteModal = () => setIsDeleteModalOpen(false);

	const headerAction = useMemo(() => {
		if (!active) return null;

		const hasChanges = activeTheme && JSON.stringify(activeTheme.colors) !== JSON.stringify(draftColors);

		return (
			<div className="minimal-map-styles__header-actions">
				<div className="minimal-map-styles__theme-controls">
					<CreateThemeButton onClick={openCreateModal} />
					<DeleteThemeButton slug={activeThemeSlug} onClick={openDeleteModal} />
					<ExportThemeButton onExport={exportTheme} />
					<ImportThemeButton onImport={onImportFiles} />
				</div>

				<ThemeSelector
					activeTheme={activeTheme}
					themes={themes}
					onSwitch={switchTheme}
				/>

				<Button
					variant="primary"
					onClick={saveTheme}
					isBusy={isSaving}
					disabled={isSaving || !hasChanges}
					__next40pxDefaultSize
				>
					{__('Save Theme', 'minimal-map')}
				</Button>
			</div>
		);
	}, [ active, activeTheme, activeThemeSlug, themes, draftColors, isSaving, saveTheme, exportTheme, onImportFiles, switchTheme ]);

	return {
		themes,
		activeTheme,
		isLoading,
		isSaving,
		draftColors,
		setDraftColor,
		saveTheme,
		createTheme,
		deleteTheme,
		switchTheme,
		importTheme,
		onImportFiles,
		exportTheme,
		headerAction,
		isCreateModalOpen,
		isDeleteModalOpen,
		openCreateModal,
		closeCreateModal,
		openDeleteModal,
		closeDeleteModal,
	};
}
