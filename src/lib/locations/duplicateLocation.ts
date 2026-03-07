import type { LocationRecord, LocationsAdminConfig } from '../../types';
import { createLocation } from './createLocation';

export async function duplicateLocation(
	config: LocationsAdminConfig,
	location: LocationRecord,
	existingTitles: string[]
): Promise<void> {
	const normalizedTitles = new Set(existingTitles.map((title) => title.trim().toLowerCase()));
	const baseTitle = location.title.trim();
	let duplicateTitle = `${baseTitle} (Copy)`;
	let index = 2;

	while (normalizedTitles.has(duplicateTitle.toLowerCase())) {
		duplicateTitle = `${baseTitle} (Copy ${index})`;
		index += 1;
	}

	const { id: _id, ...form } = location;

	await createLocation(config, {
		...form,
		title: duplicateTitle,
	});
}
