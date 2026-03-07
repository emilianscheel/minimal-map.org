import apiFetch from '@wordpress/api-fetch';
import type { LocationsAdminConfig } from '../../types';

export async function deleteLocation(
	config: LocationsAdminConfig,
	locationId: number
): Promise<void> {
	await apiFetch({
		path: `${config.restPath}/${locationId}?force=true`,
		method: 'DELETE',
	});
}
