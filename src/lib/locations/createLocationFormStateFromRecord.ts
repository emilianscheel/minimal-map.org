import type { LocationFormState, LocationRecord } from '../../types';
import { normalizeOpeningHours } from './openingHours';

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
		logo_id: location.logo_id,
		marker_id: location.marker_id,
		is_hidden: location.is_hidden,
		opening_hours: normalizeOpeningHours(location.opening_hours),
		opening_hours_notes: location.opening_hours_notes,
		social_media: location.social_media || [],
		tag_ids: location.tag_ids,
	};
}
