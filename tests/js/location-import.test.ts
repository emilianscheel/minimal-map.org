import { describe, expect, test } from 'bun:test';
import type {
	CollectionsAdminConfig,
	LocationFormState,
	LocationsAdminConfig,
} from '../../src/types';
import {
	analyzeCsvOpeningHoursColumn,
	buildMappedLocationForm,
	countMappedCsvGeocodeRequests,
	createEmptyCsvImportAssignments,
	createEmptyCsvImportMapping,
	createEmptyCsvOpeningHoursImportMapping,
	detectCsvDelimiter,
	exportLocations,
	getValidCsvOpeningHoursColumnIndexes,
	isCommonCsvFormat,
	parseCsvText,
	parseCsvOpeningHoursValue,
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

	test('builds mapped forms with parsed hidden state', () => {
		const mapping = createEmptyCsvImportMapping();
		mapping.title = 0;
		mapping.is_hidden = 1;

		expect(buildMappedLocationForm(['Berlin Office', 'true'], mapping).is_hidden).toBe(true);
		expect(buildMappedLocationForm(['Berlin Office', 'visible'], mapping).is_hidden).toBe(false);
	});

	test('parses supported opening-hours formats into normalized values', () => {
		expect(parseCsvOpeningHoursValue('8-12')).toEqual({
			open: '08:00',
			close: '12:00',
		});
		expect(parseCsvOpeningHoursValue('08:00-12:00')).toEqual({
			open: '08:00',
			close: '12:00',
		});
		expect(parseCsvOpeningHoursValue('8:00-14:00')).toEqual({
			open: '08:00',
			close: '14:00',
		});
		expect(parseCsvOpeningHoursValue('08:00 - 17:30')).toEqual({
			open: '08:00',
			close: '17:30',
		});
	});

	test('analyzes opening-hours columns using non-empty values only', () => {
		const rows = [
			['Berlin', '8-12', 'Mon notes'],
			['Hamburg', '', 'Tue notes'],
			['Munich', '08:00-14:00', 'Wed notes'],
		];

		expect(analyzeCsvOpeningHoursColumn(rows, 1)).toEqual({
			columnIndex: 1,
			hasValues: true,
			isValid: true,
		});
		expect(analyzeCsvOpeningHoursColumn(rows, 2)).toEqual({
			columnIndex: 2,
			hasValues: true,
			isValid: false,
		});
		expect(analyzeCsvOpeningHoursColumn(rows, 3)).toEqual({
			columnIndex: 3,
			hasValues: false,
			isValid: false,
		});
		expect(getValidCsvOpeningHoursColumnIndexes(rows, 3)).toEqual([1]);
	});

	test('builds mapped forms with imported opening hours and notes', () => {
		const mapping = createEmptyCsvImportMapping();
		mapping.title = 0;
		const openingHoursMapping = createEmptyCsvOpeningHoursImportMapping();
		openingHoursMapping.monday = 1;
		openingHoursMapping.tuesday = 2;
		openingHoursMapping.opening_hours_notes = 3;

		const form = buildMappedLocationForm(
			['Berlin Office', '8-12', '08:00-14:00', 'Summer schedule'],
			mapping,
			openingHoursMapping
		);

		expect(form.title).toBe('Berlin Office');
		expect(form.opening_hours.monday).toEqual({
			open: '08:00',
			close: '12:00',
			lunch_start: '',
			lunch_duration_minutes: 0,
		});
		expect(form.opening_hours.tuesday).toEqual({
			open: '08:00',
			close: '14:00',
			lunch_start: '',
			lunch_duration_minutes: 0,
		});
		expect(form.opening_hours.wednesday).toEqual({
			open: '',
			close: '',
			lunch_start: '',
			lunch_duration_minutes: 0,
		});
		expect(form.opening_hours_notes).toBe('Summer schedule');
	});

	test('runs mapped imports with sequential throttled geocoding and keeps rows without coordinates', async () => {
		const parsed = parseCsvText(
			[
				'name,street_name,house_no,zip_code,town,country_name,phone,monday_hours,hours_notes',
				'Berlin Office,Unter den Linden,1,10117,Berlin,Germany,+49 30 123,8-12,Summer hours',
				'No Coordinates,,,,Paris,France,,08:00-14:00,',
				'Broken Geocode,Main Street,5,10001,New York,USA,,,',
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
		const openingHoursMapping = createEmptyCsvOpeningHoursImportMapping();
		openingHoursMapping.monday = 7;
		openingHoursMapping.opening_hours_notes = 8;

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
			openingHoursMapping,
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
		expect(createdForms[0].is_hidden).toBe(false);
		expect(createdForms[0].tag_ids).toEqual([3, 7]);
		expect(createdForms[0].opening_hours.monday.open).toBe('08:00');
		expect(createdForms[0].opening_hours.monday.close).toBe('12:00');
		expect(createdForms[0].opening_hours_notes).toBe('Summer hours');
		expect(createdForms[1].latitude).toBe('');
		expect(createdForms[1].longitude).toBe('');
		expect(createdForms[1].logo_id).toBe(9);
		expect(createdForms[1].marker_id).toBe(11);
		expect(createdForms[1].tag_ids).toEqual([3, 7]);
		expect(createdForms[1].opening_hours.monday.open).toBe('08:00');
		expect(createdForms[1].opening_hours.monday.close).toBe('14:00');
		expect(createdForms[2].latitude).toBe('');
		expect(createdForms[2].longitude).toBe('');
		expect(createdForms[2].logo_id).toBe(9);
		expect(createdForms[2].marker_id).toBe(11);
		expect(createdForms[2].tag_ids).toEqual([3, 7]);
		expect(createdForms[2].opening_hours.monday.open).toBe('');
		expect(createdForms[2].opening_hours_notes).toBe('');
		expect(collectionAssignments).toEqual([[101, 102, 103]]);
	});

	test('exports hidden state as a stable CSV column', () => {
		const csv = exportLocations(
			[
				{
					title: 'Visible',
					street: '',
					house_number: '',
					postal_code: '',
					city: '',
					state: '',
					country: '',
					telephone: '',
					email: '',
					website: '',
					latitude: '52.5',
					longitude: '13.4',
					is_hidden: false,
					opening_hours: {},
					opening_hours_notes: '',
					logo_id: 0,
					marker_id: 0,
					tag_ids: [],
				},
				{
					title: 'Hidden',
					street: '',
					house_number: '',
					postal_code: '',
					city: '',
					state: '',
					country: '',
					telephone: '',
					email: '',
					website: '',
					latitude: '48.1',
					longitude: '11.5',
					is_hidden: true,
					opening_hours: {},
					opening_hours_notes: '',
					logo_id: 0,
					marker_id: 0,
					tag_ids: [],
				},
			],
			[],
			[],
			[]
		);

		expect(csv).toContain('"hidden"');
		expect(csv).toContain('"false"');
		expect(csv).toContain('"true"');
	});

	test('runs common imports and creates a collection for the imported batch', async () => {
		const parsed = parseCsvText(
			[
				'title,street,house_number,postal_code,city,state,country,telephone,email,website,latitude,longitude,hidden',
				'Brandenburg Gate,Pariser Platz,,10117,Berlin,Berlin,Germany,+49 30 1,info@example.com,https://example.com,52.5162,13.3777,true',
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
		expect(createdForms[0].is_hidden).toBe(true);
		expect(collectionAssignments).toEqual([[77]]);
	});
});
