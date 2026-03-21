import apiFetch from '@wordpress/api-fetch';
import type { AnalyticsAdminConfig, AnalyticsSettings } from '../../types';

export async function updateAnalyticsSettings(
	config: AnalyticsAdminConfig,
	settings: Partial<AnalyticsSettings>
): Promise<AnalyticsSettings> {
	return apiFetch({
		method: 'POST',
		path: config.settingsPath,
		data: settings,
	});
}
