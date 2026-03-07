import type { LocationFormState, LocationMeta } from '../../types';
import { normalizeWebsiteValue } from './normalizeWebsiteValue';

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
	};
}
