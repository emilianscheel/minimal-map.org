import { describe, expect, test } from 'bun:test';
import type {
	CollectionsAdminConfig,
	LocationFormState,
	LocationsAdminConfig,
} from '../../src/types';
import {
	buildMappedLocationForm,
	countMappedCsvGeocodeRequests,
	createEmptyCsvImportAssignments,
	createEmptyCsvImportMapping,
	detectCsvDelimiter,
	isCommonCsvFormat,
	parseCsvText,
	runCommonCsvImport,
	runMappedCsvImport,
} from '../../src/lib/locations/importLocations';

const LOCATIONS_CONFIG: LocationsAdminConfig = {
	nonce: '',
	restBase: '',
	restPath: '/locations',
	geocodePath: '/geocode',
};

const COLLECTIONS_CONFIG: CollectionsAdminConfig = {
	nonce: '',
	restBase: '',
	restPath: '/collections',
};

describe('location import helpers', () => {
	test('detects and parses comma-delimited CSV with quoted separators', () => {
		const parsed = parseCsvText('title,city\n"ACME, Inc.",Berlin\n');

		expect(detectCsvDelimiter('title,city\nACME,Berlin\n')).toBe(',');
		expect(parsed.delimiter).toBe(',');
		expect(parsed.headers).toEqual(['title', 'city']);
		expect(parsed.rows).toEqual([['ACME, Inc.', 'Berlin']]);
	});

	test('detects and parses semicolon-delimited CSV', () => {
		const parsed = parseCsvText('title;city\nBrandenburg Gate;Berlin\n');

		expect(detectCsvDelimiter('title;city\nBrandenburg Gate;Berlin\n')).toBe(';');
		expect(parsed.delimiter).toBe(';');
		expect(parsed.headers).toEqual(['title', 'city']);
		expect(parsed.rows).toEqual([['Brandenburg Gate', 'Berlin']]);
	});

	test('recognizes only the exact built-in common CSV header set', () => {
		expect(
			isCommonCsvFormat(
				parseCsvText(
					[
						'title;street;house_number;postal_code;city;state;country;telephone;email;website;latitude;longitude',
						'Brandenburg Gate;Pariser Platz;;10117;Berlin;Berlin;Germany;;;https://example.com;52.5162;13.3777',
					].join('\n')
				)
			)
		).toBe(true);

		expect(
			isCommonCsvFormat(parseCsvText('title,city,country\nBrandenburg Gate,Berlin,Germany\n'))
		).toBe(false);
	});

	test('builds mapped forms with optional columns and fallback title', () => {
		const mapping = createEmptyCsvImportMapping();
		mapping.city = 0;
		mapping.country = 1;

		const form = buildMappedLocationForm(['Berlin', 'Germany'], mapping);

		expect(form.title).toBe('Imported Location');
		expect(form.telephone).toBe('');
		expect(form.city).toBe('Berlin');
		expect(form.country).toBe('Germany');
	});

	test('runs mapped imports with sequential throttled geocoding and keeps rows without coordinates', async () => {
		const parsed = parseCsvText(
			[
				'name,street_name,house_no,zip_code,town,country_name,phone',
				'Berlin Office,Unter den Linden,1,10117,Berlin,Germany,+49 30 123',
				'No Coordinates,,,,Paris,France,',
				'Broken Geocode,Main Street,5,10001,New York,USA,',
			].join('\n')
		);
		const mapping = createEmptyCsvImportMapping();
		mapping.title = 0;
		mapping.street = 1;
		mapping.house_number = 2;
		mapping.postal_code = 3;
		mapping.city = 4;
		mapping.country = 5;
		mapping.telephone = 6;

		const createdForms: LocationFormState[] = [];
		const geocodeTitles: string[] = [];
		const sleepCalls: number[] = [];
		const collectionAssignments: number[][] = [];
		const progressUpdates: Array<[number, number]> = [];
		const assignments = createEmptyCsvImportAssignments();
		assignments.logoId = 9;
		assignments.markerId = 11;
		assignments.tagIds = [3, 7, 3];

		expect(countMappedCsvGeocodeRequests(parsed, mapping)).toBe(2);

		const result = await runMappedCsvImport(
			parsed,
			mapping,
			assignments,
			LOCATIONS_CONFIG,
			COLLECTIONS_CONFIG,
			{
				createLocationFn: async (_config, form) => {
					createdForms.push({ ...form });
					return { id: 100 + createdForms.length };
				},
				createCollectionFn: async (_config, _title, locationIds) => {
					collectionAssignments.push(locationIds);
				},
				geocodeAddressFn: async (_config, form) => {
					geocodeTitles.push(form.title);

					if (form.title === 'Berlin Office') {
						return {
							success: true,
							label: 'Berlin Office',
							lat: 52.517,
							lng: 13.388,
						};
					}

					throw new Error('rate limited');
				},
				sleep: async (ms) => {
					sleepCalls.push(ms);
				},
				onGeocodeProgress: (completed, total) => {
					progressUpdates.push([completed, total]);
				},
			}
		);

		expect(result).toEqual({
			importedCount: 3,
			importedLocationIds: [101, 102, 103],
			totalGeocodeRequests: 2,
			completedGeocodeRequests: 2,
		});
		expect(geocodeTitles).toEqual(['Berlin Office', 'Broken Geocode']);
		expect(sleepCalls).toEqual([1000]);
		expect(progressUpdates).toEqual([
			[0, 2],
			[1, 2],
			[2, 2],
		]);
		expect(createdForms[0].latitude).toBe('52.517');
		expect(createdForms[0].longitude).toBe('13.388');
		expect(createdForms[0].telephone).toBe('+49 30 123');
		expect(createdForms[0].logo_id).toBe(9);
		expect(createdForms[0].marker_id).toBe(11);
		expect(createdForms[0].tag_ids).toEqual([3, 7]);
		expect(createdForms[1].latitude).toBe('');
		expect(createdForms[1].longitude).toBe('');
		expect(createdForms[1].logo_id).toBe(9);
		expect(createdForms[1].marker_id).toBe(11);
		expect(createdForms[1].tag_ids).toEqual([3, 7]);
		expect(createdForms[2].latitude).toBe('');
		expect(createdForms[2].longitude).toBe('');
		expect(createdForms[2].logo_id).toBe(9);
		expect(createdForms[2].marker_id).toBe(11);
		expect(createdForms[2].tag_ids).toEqual([3, 7]);
		expect(collectionAssignments).toEqual([[101, 102, 103]]);
	});

	test('runs common imports and creates a collection for the imported batch', async () => {
		const parsed = parseCsvText(
			[
				'title,street,house_number,postal_code,city,state,country,telephone,email,website,latitude,longitude',
				'Brandenburg Gate,Pariser Platz,,10117,Berlin,Berlin,Germany,+49 30 1,info@example.com,https://example.com,52.5162,13.3777',
			].join('\n')
		);
		const createdForms: LocationFormState[] = [];
		const collectionAssignments: number[][] = [];

		const result = await runCommonCsvImport(parsed, LOCATIONS_CONFIG, COLLECTIONS_CONFIG, {
			createLocationFn: async (_config, form) => {
				createdForms.push({ ...form });
				return { id: 77 };
			},
			createCollectionFn: async (_config, _title, locationIds) => {
				collectionAssignments.push(locationIds);
			},
		});

		expect(result.importedCount).toBe(1);
		expect(createdForms[0].title).toBe('Brandenburg Gate');
		expect(createdForms[0].latitude).toBe('52.5162');
		expect(createdForms[0].longitude).toBe('13.3777');
		expect(collectionAssignments).toEqual([[77]]);
	});
});
