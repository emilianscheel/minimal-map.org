import type { LocationRecord } from '../../types';
import { formatLocationAddressLines } from '../locations/formatLocationAddressLines';

export function filterLocationsForAssignment(
	locations: LocationRecord[],
	searchTerm: string
): LocationRecord[] {
	const query = searchTerm.trim().toLowerCase();

	if (!query) {
		return locations;
	}

	return locations.filter((location) => {
		const address = formatLocationAddressLines(location).join(' ');
		const haystack = `${location.title} ${address}`.trim().toLowerCase();

		return haystack.includes(query);
	});
}
