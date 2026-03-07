import apiFetch from '@wordpress/api-fetch';
import type { LocationFormState, LocationsAdminConfig } from '../../types';
import { buildLocationMeta } from './buildLocationMeta';

export async function updateLocation(
	config: LocationsAdminConfig,
	locationId: number,
	form: LocationFormState
): Promise<void> {
	await apiFetch({
		path: `${config.restPath}/${locationId}`,
		method: 'POST',
		data: {
			title: form.title.trim(),
			meta: buildLocationMeta(form),
		},
	});
}
