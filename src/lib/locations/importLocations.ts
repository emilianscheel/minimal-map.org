import { __ } from '@wordpress/i18n';
import { createLocation } from './createLocation';
import { createCollection } from '../collections/createCollection';
import type { LocationsAdminConfig, CollectionsAdminConfig, LocationFormState } from '../../types';

/**
 * Robust CSV line parser that handles quotes and commas.
 */
export function parseCsvLine(line: string): string[] {
	const result = [];
	let current = '';
	let inQuotes = false;
	for (let i = 0; i < line.length; i++) {
		const char = line[i];
		if (char === '"') {
			if (inQuotes && line[i + 1] === '"') {
				// Handle escaped quotes ""
				current += '"';
				i++;
			} else {
				inQuotes = !inQuotes;
			}
		} else if (char === ',' && !inQuotes) {
			result.push(current.trim());
			current = '';
		} else {
			current += char;
		}
	}
	result.push(current.trim());
	return result;
}

/**
 * Imports locations from a CSV file and assigns them to a new collection.
 */
export async function importLocations(
	file: File,
	locationsConfig: LocationsAdminConfig,
	collectionsConfig: CollectionsAdminConfig
): Promise<number> {
	const text = await file.text();
	const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
	if (lines.length < 2) {
		throw new Error(__('CSV file is empty or missing headers.', 'minimal-map'));
	}

	const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
	const data = lines.slice(1).map((line) => {
		const values = parseCsvLine(line);
		const obj: Record<string, string> = {};
		headers.forEach((header, index) => {
			obj[header] = values[index];
		});
		return obj;
	});

	const importedLocationIds: number[] = [];
	for (const row of data) {
		const form: LocationFormState = {
			title: row.title || __('Imported Location', 'minimal-map'),
			street: row.street || '',
			house_number: row.house_number || '',
			postal_code: row.postal_code || '',
			city: row.city || '',
			state: row.state || '',
			country: row.country || '',
			telephone: row.telephone || '',
			email: row.email || '',
			website: row.website || '',
			latitude: row.latitude || '',
			longitude: row.longitude || '',
			tag_ids: [],
		};
		const newLocation = await createLocation(locationsConfig, form);
		importedLocationIds.push(newLocation.id);
	}

	if (importedLocationIds.length > 0) {
		const date = new Date();
		const timestamp =
			date.toLocaleDateString() +
			' ' +
			date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
		const collectionTitle = `${__('Import on', 'minimal-map')} ${timestamp}`;
		await createCollection(collectionsConfig, collectionTitle, importedLocationIds);
	}

	return importedLocationIds.length;
}
