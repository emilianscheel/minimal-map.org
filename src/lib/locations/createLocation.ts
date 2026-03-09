import apiFetch from '@wordpress/api-fetch';
import type { LocationFormState, LocationsAdminConfig, LocationRestResponse } from '../../types';
import { buildLocationMeta } from './buildLocationMeta';

export async function createLocation(
	config: LocationsAdminConfig,
	form: LocationFormState
): Promise<LocationRestResponse> {
	return await apiFetch<LocationRestResponse>({
		path: config.restPath,
		method: 'POST',
		data: {
			title: form.title.trim(),
			status: 'publish',
			meta: buildLocationMeta(form),
			minimal_map_tag: form.tag_ids,
		},
	});
}
