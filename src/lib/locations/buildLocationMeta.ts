import type { LocationFormState, LocationMeta } from '../../types';
import { normalizeWebsiteValue } from './normalizeWebsiteValue';
import { normalizeOpeningHours } from './openingHours';

export function buildLocationMeta(form: LocationFormState): LocationMeta {
	return {
		telephone: form.telephone.trim(),
		email: form.email.trim(),
		website: normalizeWebsiteValue(form.website),
		street: form.street.trim(),
		house_number: form.house_number.trim(),
		postal_code: form.postal_code.trim(),
		city: form.city.trim(),
		state: form.state.trim(),
		country: form.country.trim(),
		latitude: form.latitude.trim(),
		longitude: form.longitude.trim(),
		logo_id: Number.isFinite(form.logo_id) ? Math.max(0, form.logo_id) : 0,
		marker_id: Number.isFinite(form.marker_id) ? Math.max(0, form.marker_id) : 0,
		is_hidden: !!form.is_hidden,
		opening_hours: normalizeOpeningHours(form.opening_hours),
		opening_hours_notes: form.opening_hours_notes.trim(),
	};
}
