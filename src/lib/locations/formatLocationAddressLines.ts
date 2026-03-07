import type { LocationRecord } from '../../types';

export function formatLocationAddressLines(location: Pick<LocationRecord, 'street' | 'house_number' | 'postal_code' | 'city' | 'state' | 'country'>): string[] {
	const lineOne = [ location.street.trim(), location.house_number.trim() ].filter(Boolean).join(' ');
	const lineTwo = [ location.postal_code.trim(), location.city.trim() ].filter(Boolean).join(' ');
	const lineThree = [ location.state.trim(), location.country.trim() ].filter(Boolean).join(' ');

	return [ lineOne, lineTwo, lineThree ].filter(Boolean);
}
