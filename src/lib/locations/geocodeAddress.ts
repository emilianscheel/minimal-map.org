import apiFetch from '@wordpress/api-fetch';
import type { GeocodeResponse, LocationFormState, LocationsAdminConfig } from '../../types';

export async function geocodeAddress(
	config: LocationsAdminConfig,
	form: LocationFormState
): Promise<GeocodeResponse> {
	return (await apiFetch({
		path: config.geocodePath,
		method: 'POST',
		data: {
			street: form.street.trim(),
			house_number: form.house_number.trim(),
			postal_code: form.postal_code.trim(),
			city: form.city.trim(),
			state: form.state.trim(),
			country: form.country.trim(),
		},
	})) as GeocodeResponse;
}
