import type { LocationFormState, LocationRecord } from '../../types';

export function createLocationFormStateFromRecord(location: LocationRecord): LocationFormState {
	return {
		title: location.title,
		telephone: location.telephone,
		email: location.email,
		website: location.website,
		street: location.street,
		house_number: location.house_number,
		postal_code: location.postal_code,
		city: location.city,
		state: location.state,
		country: location.country,
		latitude: location.latitude,
		longitude: location.longitude,
		tag_ids: location.tag_ids,
	};
}
