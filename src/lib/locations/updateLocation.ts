import apiFetch from '@wordpress/api-fetch';
import type { LocationFormState, LocationsAdminConfig } from '../../types';
import { buildLocationMeta } from './buildLocationMeta';

export async function updateLocation(
	config: LocationsAdminConfig,
	locationId: number,
	form: LocationFormState
): Promise<void> {
	const data = {
		title: form.title.trim(),
		meta: buildLocationMeta(form),
		minimal_map_tag: form.tag_ids,
	};
	console.log('Updating location via REST API:', data);
	await apiFetch({
		path: `${config.restPath}/${locationId}`,
		method: 'POST',
		data,
	});
}
