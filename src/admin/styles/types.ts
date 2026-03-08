import type { ReactNode } from 'react';
import type { StyleThemeRecord, StyleThemeColors } from '../../types';

export interface StylesController {
	themes: StyleThemeRecord[];
	activeTheme: StyleThemeRecord | null;
	isLoading: boolean;
	isSaving: boolean;
	draftColors: StyleThemeColors | null;
	setDraftColor: (slot: string, color: string) => void;
	saveTheme: () => Promise<void>;
	headerAction: ReactNode;
}
