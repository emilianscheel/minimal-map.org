import type { ViewTable } from '@wordpress/dataviews';
import type { ReactNode } from 'react';
import type { AnalyticsQueryRecord, AnalyticsSummary } from '../../types';

export interface AnalyticsNotice {
	status: 'success' | 'error';
	message: string;
}

export interface AnalyticsController {
	enabled: boolean;
	complianzEnabled: boolean;
	headerAction: JSX.Element;
	isConfirmEnableModalOpen: boolean;
	isLoading: boolean;
	isSavingSettings: boolean;
	loadError: string | null;
	notice: AnalyticsNotice | null;
	queries: AnalyticsQueryRecord[];
	summary: AnalyticsSummary;
	totalItems: number;
	totalPages: number;
	view: ViewTable;
	dismissNotice: () => void;
	onChangeView: (view: ViewTable) => void;
	onCloseConfirmEnableModal: () => void;
	onConfirmEnableAnalytics: () => Promise<void>;
	onToggleAnalytics: () => void;
	onToggleComplianz: () => void;
}
