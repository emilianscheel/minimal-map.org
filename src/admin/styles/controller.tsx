import { Button } from '@wordpress/components';
import apiFetch from '@wordpress/api-fetch';
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import type { StylesAdminConfig, StyleThemeRecord, StyleThemeColors } from '../../types';
import type { StylesController } from './types';

export function useStylesController(
	config: StylesAdminConfig,
	active = false
): StylesController {
	const [ themes, setThemes ] = useState<StyleThemeRecord[]>([]);
	const [ isLoading, setIsLoading ] = useState(true);
	const [ isSaving, setIsSaving ] = useState(false);
	const [ draftColors, setDraftColors ] = useState<StyleThemeColors | null>(null);

	const activeTheme = useMemo(() => themes[0] || null, [ themes ]);

	const fetchThemes = useCallback(async () => {
		setIsLoading(true);
		try {
			const data = await apiFetch<StyleThemeRecord[]>({
				path: config.restPath,
			});
			setThemes(data);
			if (data.length > 0) {
				setDraftColors(data[0].colors);
			}
		} catch (error) {
			console.error('Failed to fetch themes', error);
		} finally {
			setIsLoading(false);
		}
	}, [ config.restPath ]);

	useEffect(() => {
		if (active) {
			fetchThemes();
		}
	}, [ active, fetchThemes ]);

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

	const headerAction = useMemo(() => {
		if (!active) return null;

		const hasChanges = activeTheme && JSON.stringify(activeTheme.colors) !== JSON.stringify(draftColors);

		return (
			<Button
				variant="primary"
				onClick={saveTheme}
				isBusy={isSaving}
				disabled={isSaving || !hasChanges}
				__next40pxDefaultSize
			>
				{__('Save Theme', 'minimal-map')}
			</Button>
		);
	}, [ active, activeTheme, draftColors, isSaving, saveTheme ]);

	return {
		themes,
		activeTheme,
		isLoading,
		isSaving,
		draftColors,
		setDraftColor,
		saveTheme,
		headerAction,
	};
}
