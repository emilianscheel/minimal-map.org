import { FormToggle } from '@wordpress/components';
import type { ViewTable } from '@wordpress/dataviews';
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { configureApiFetch } from '../../lib/locations/configureApiFetch';
import { fetchAnalyticsQueries } from '../../lib/analytics/fetchAnalyticsQueries';
import { fetchAnalyticsSummary } from '../../lib/analytics/fetchAnalyticsSummary';
import { updateAnalyticsSettings } from '../../lib/analytics/updateAnalyticsSettings';
import type { AnalyticsAdminConfig, AnalyticsSummary } from '../../types';
import { DEFAULT_ANALYTICS_VIEW, EMPTY_ANALYTICS_SUMMARY } from './constants';
import type { AnalyticsController } from './types';

export function useAnalyticsController(
	config: AnalyticsAdminConfig
): AnalyticsController {
	const [enabled, setEnabled] = useState(config.enabled);
	const [complianzEnabled, setComplianzEnabled] = useState(config.complianzEnabled);
	const [isConfirmEnableModalOpen, setConfirmEnableModalOpen] = useState(false);
	const [isLoading, setLoading] = useState(true);
	const [isSavingSettings, setSavingSettings] = useState(false);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [notice, setNotice] = useState<AnalyticsController['notice']>(null);
	const [queries, setQueries] = useState<AnalyticsController['queries']>([]);
	const [summary, setSummary] = useState<AnalyticsSummary>(EMPTY_ANALYTICS_SUMMARY);
	const [totalItems, setTotalItems] = useState(0);
	const [totalPages, setTotalPages] = useState(1);
	const [view, setView] = useState<ViewTable>(DEFAULT_ANALYTICS_VIEW);

	const loadSummary = useCallback(async () => {
		const nextSummary = await fetchAnalyticsSummary(config);
		setSummary(nextSummary);
	}, [config]);

	const loadQueries = useCallback(async (nextView: ViewTable) => {
		const response = await fetchAnalyticsQueries(config, {
			page: nextView.page,
			perPage: nextView.perPage,
			search: nextView.search,
		});

		setQueries(response.items);
		setTotalItems(response.totalItems);
		setTotalPages(response.totalPages);
	}, [config]);

	useEffect(() => {
		configureApiFetch(config.nonce);
	}, [config.nonce]);

	useEffect(() => {
		let isMounted = true;

		setLoading(true);
		setLoadError(null);

		void Promise.all([loadSummary(), loadQueries(view)])
			.catch((error) => {
				if (!isMounted) {
					return;
				}

				setLoadError(
					error instanceof Error
						? error.message
						: __('Analytics data could not be loaded.', 'minimal-map')
				);
			})
			.finally(() => {
				if (isMounted) {
					setLoading(false);
				}
			});

		return () => {
			isMounted = false;
		};
	}, [loadQueries, loadSummary, view]);

	const onChangeView = useCallback((nextView: ViewTable) => {
		setView((currentView) => ({
			...currentView,
			...nextView,
			page: nextView.search !== currentView.search ? 1 : (nextView.page ?? currentView.page),
		}));
	}, []);

	const persistSettings = useCallback(async (nextSettings: Partial<AnalyticsSettings>) => {
		setSavingSettings(true);
		setNotice(null);

		try {
			const response = await updateAnalyticsSettings(config, nextSettings);
			if (response.enabled !== undefined) {
				setEnabled(response.enabled);
			}
			if (response.complianzEnabled !== undefined) {
				setComplianzEnabled(response.complianzEnabled);
			}
			setConfirmEnableModalOpen(false);
		} catch (error) {
			setNotice({
				status: 'error',
				message:
					error instanceof Error
						? error.message
						: __('Analytics settings could not be updated.', 'minimal-map'),
			});
		} finally {
			setSavingSettings(false);
		}
	}, [config]);

	const headerAction = useMemo(() => (
		<div className="minimal-map-admin__analytics-header-actions">
			<label className="minimal-map-admin__analytics-toggle" htmlFor="minimal-map-analytics-complianz-toggle">
				<span className="minimal-map-admin__analytics-toggle-label">
					{__('Only track if Complianz confirmed', 'minimal-map')}
				</span>
				<FormToggle
					id="minimal-map-analytics-complianz-toggle"
					checked={complianzEnabled}
					disabled={isSavingSettings}
					onChange={() => {
						void persistSettings({ complianzEnabled: !complianzEnabled });
					}}
				/>
			</label>
			<label className="minimal-map-admin__analytics-toggle" htmlFor="minimal-map-analytics-toggle">
				<span className="minimal-map-admin__analytics-toggle-label">
					{__('Analytics tracking', 'minimal-map')}
				</span>
				<FormToggle
					id="minimal-map-analytics-toggle"
					checked={enabled}
					disabled={isSavingSettings}
					onChange={() => {
						if (enabled) {
							void persistSettings({ enabled: false });
							return;
						}

						setConfirmEnableModalOpen(true);
					}}
				/>
			</label>
		</div>
	), [complianzEnabled, enabled, isSavingSettings, persistSettings]);

	return {
		enabled,
		complianzEnabled,
		headerAction,
		isConfirmEnableModalOpen,
		isLoading,
		isSavingSettings,
		loadError,
		notice,
		queries,
		summary,
		totalItems,
		totalPages,
		view,
		dismissNotice: () => setNotice(null),
		onChangeView,
		onCloseConfirmEnableModal: () => setConfirmEnableModalOpen(false),
		onConfirmEnableAnalytics: async () => {
			await persistSettings({ enabled: true });
		},
		onToggleAnalytics: () => {
			if (enabled) {
				void persistSettings({ enabled: false });
				return;
			}

			setConfirmEnableModalOpen(true);
		},
		onToggleComplianz: () => {
			void persistSettings({ complianzEnabled: !complianzEnabled });
		},
	};
}
