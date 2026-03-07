import apiFetch from '@wordpress/api-fetch';
import type { LocationsAdminConfig, MapCoordinates } from '../../types';

export async function updateLocationCoordinates(
	config: LocationsAdminConfig,
	locationId: number,
	coordinates: MapCoordinates
): Promise<void> {
	await apiFetch({
		path: `${config.restPath}/${locationId}`,
		method: 'POST',
		data: {
			meta: {
				latitude: `${coordinates.lat}`,
				longitude: `${coordinates.lng}`,
			},
		},
	});
}
