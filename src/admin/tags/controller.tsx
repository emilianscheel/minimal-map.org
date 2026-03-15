import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { Plus } from 'lucide-react';
import type { ViewGrid } from '@wordpress/dataviews';
import type {
	TagFormState,
	TagRecord,
	TagsAdminConfig,
	StyleThemeRecord,
} from '../../types';
import { DEFAULT_FORM_STATE, DEFAULT_GRID_VIEW } from './constants';
import { fetchAllTags } from '../../lib/tags/fetchAllTags';
import { createTag } from '../../lib/tags/createTag';
import { updateTag } from '../../lib/tags/updateTag';
import { deleteTag } from '../../lib/tags/deleteTag';
import { ThemeSelector } from '../styles/ThemeSelector';
import type { TagsController } from './types';

export function useTagsController(
	config: TagsAdminConfig,
	enabled: boolean,
	themeData: {
		activeTheme: StyleThemeRecord | null;
		themes: StyleThemeRecord[];
		onSwitchTheme: (slug: string) => void;
	}
): TagsController {
	const [actionNotice, setActionNotice] = useState<TagsController['actionNotice']>(null);
	const [tags, setTags] = useState<TagRecord[]>([]);
	const [editingTag, setEditingTag] = useState<TagRecord | null>(null);
	const [form, setForm] = useState<TagFormState>(DEFAULT_FORM_STATE);
	const [formMode, setFormMode] = useState<TagsController['formMode']>('create');
	const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
	const [isDialogOpen, setDialogOpen] = useState(false);
	const [isLoading, setLoading] = useState(enabled);
	const [isRowActionPending, setRowActionPending] = useState(false);
	const [selectedTag, setSelectedTag] = useState<TagRecord | null>(null);
	const [isSubmitting, setSubmitting] = useState(false);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [view, setView] = useState<ViewGrid>(DEFAULT_GRID_VIEW);

	const loadTags = useCallback(async (): Promise<void> => {
		if (!enabled) {
			return;
		}

		setLoading(true);
		setLoadError(null);

		try {
			const records = await fetchAllTags(config);
			setTags(records);
		} catch (error) {
			setLoadError(
				error instanceof Error
					? error.message
					: __('Tags could not be loaded.', 'minimal-map')
			);
		} finally {
			setLoading(false);
		}
	}, [config, enabled]);

	useEffect(() => {
		void loadTags();
	}, [loadTags]);

	const resetDialogState = useCallback((): void => {
		setEditingTag(null);
		setForm(DEFAULT_FORM_STATE);
		setFormMode('create');
		setSubmitError(null);
	}, []);

	const onAddTag = useCallback((): void => {
		resetDialogState();
		setDialogOpen(true);
	}, [resetDialogState]);

	const onEditTag = useCallback(
		(tag: TagRecord): void => {
			resetDialogState();
			setEditingTag(tag);
			setFormMode('edit');
			setForm({
				name: tag.name,
				background_color: tag.background_color,
				foreground_color: tag.foreground_color,
			});
			setDialogOpen(true);
		},
		[resetDialogState]
	);

	const onCancel = useCallback((): void => {
		if (isSubmitting) {
			return;
		}

		setDialogOpen(false);
	}, [isSubmitting]);

	const onCloseDeleteModal = useCallback((): void => {
		if (isRowActionPending) {
			return;
		}

		setDeleteModalOpen(false);
		setSelectedTag(null);
	}, [isRowActionPending]);

	const onOpenDeleteModal = useCallback((tag: TagRecord): void => {
		setSelectedTag(tag);
		setDeleteModalOpen(true);
	}, []);

	const onChangeFormValue = useCallback(
		(key: keyof TagFormState, value: string): void => {
			setForm((currentForm) => ({
				...currentForm,
				[key]: value,
			}));
			setSubmitError(null);
		},
		[]
	);

	const onConfirm = useCallback(async (): Promise<void> => {
		if (!form.name.trim()) {
			setSubmitError(__('Tag name is required.', 'minimal-map'));
			return;
		}

		setSubmitting(true);
		setSubmitError(null);
		setActionNotice(null);

		try {
			if (formMode === 'edit' && editingTag) {
				await updateTag(config, editingTag.id, form);
			} else {
				await createTag(config, form);
			}

			await loadTags();
			setDialogOpen(false);
			resetDialogState();
			setActionNotice({
				status: 'success',
				message:
					formMode === 'edit'
						? __('Tag updated.', 'minimal-map')
						: __('Tag created.', 'minimal-map'),
			});
		} catch (error) {
			setSubmitError(
				error instanceof Error
					? error.message
					: formMode === 'edit'
					? __('Tag could not be updated.', 'minimal-map')
					: __('Tag could not be created.', 'minimal-map')
			);
		} finally {
			setSubmitting(false);
		}
	}, [config, editingTag, form, formMode, loadTags, resetDialogState]);

	const onDeleteTag = useCallback(
		async (tag: TagRecord): Promise<void> => {
			setRowActionPending(true);
			setActionNotice(null);

			try {
				await deleteTag(config, tag.id);
				await loadTags();
				setActionNotice({
					status: 'success',
					message: __('Tag deleted.', 'minimal-map'),
				});
			} catch (error) {
				setActionNotice({
					status: 'error',
					message:
						error instanceof Error
							? error.message
							: __('Tag could not be deleted.', 'minimal-map'),
				});
				throw error;
			} finally {
				setRowActionPending(false);
			}
		},
		[config, loadTags]
	);

	const onConfirmDeleteTag = useCallback(async (): Promise<void> => {
		if (!selectedTag) {
			return;
		}

		try {
			await onDeleteTag(selectedTag);
			setDeleteModalOpen(false);
			setSelectedTag(null);
		} catch (error) {
			return;
		}
	}, [onDeleteTag, selectedTag]);

	const paginatedTags = useMemo(() => {
		const filtered = tags.filter((tag) => {
			if (!view.search) {
				return true;
			}
			return tag.name.toLowerCase().includes(view.search.toLowerCase());
		});

		const page = view.page ?? 1;
		const perPage = view.perPage ?? 20;
		const start = (page - 1) * perPage;
		return filtered.slice(start, start + perPage);
	}, [tags, view]);

	const totalPages = Math.max(1, Math.ceil(tags.length / (view.perPage ?? 20)));

	return {
		actionNotice,
		activeTheme: themeData.activeTheme,
		dismissActionNotice: () => setActionNotice(null),
		headerAction: enabled ? (
			<div className="minimal-map-admin__header-actions-group">
				<Button
					__next40pxDefaultSize
					variant="primary"
					onClick={onAddTag}
					icon={<Plus size={18} strokeWidth={2} />}
					iconPosition="left"
				>
					{__('Add tag', 'minimal-map')}
				</Button>
			</div>
		) : null,
		isDeleteModalOpen,
		isLoading,
		isRowActionPending,
		isSubmitting,
		isDialogOpen,
		loadError,
		tags,
		form,
		formMode,
		modalTitle: formMode === 'edit' ? __('Edit tag', 'minimal-map') : __('Add tag', 'minimal-map'),
		selectedTag,
		submitLabel: formMode === 'edit' ? __('Save changes', 'minimal-map') : __('Add tag', 'minimal-map'),
		submitError,
		onAddTag,
		onCloseDeleteModal,
		onConfirmDeleteTag,
		onDeleteTag,
		onEditTag,
		onOpenDeleteModal,
		onConfirm,
		onCancel,
		onChangeFormValue,
		onChangeView: (nextView: ViewGrid) => setView(nextView),
		paginatedTags,
		totalPages,
		view,
	};
}
