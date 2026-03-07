import type { LocationFormState } from '../../types';

export function hasLocationAddressChanged(
	currentForm: Pick<LocationFormState, 'street' | 'house_number' | 'postal_code' | 'city' | 'state' | 'country'>,
	originalForm: Pick<LocationFormState, 'street' | 'house_number' | 'postal_code' | 'city' | 'state' | 'country'> | null
): boolean {
	if (!originalForm) {
		return true;
	}

	return (
		currentForm.street.trim() !== originalForm.street.trim() ||
		currentForm.house_number.trim() !== originalForm.house_number.trim() ||
		currentForm.postal_code.trim() !== originalForm.postal_code.trim() ||
		currentForm.city.trim() !== originalForm.city.trim() ||
		currentForm.state.trim() !== originalForm.state.trim() ||
		currentForm.country.trim() !== originalForm.country.trim()
	);
}
