import { describe, expect, test } from 'bun:test';
import { filterLocationsForAssignment } from '../../src/lib/collections/filterLocationsForAssignment';
import { getCollectionPreviewLocations } from '../../src/lib/collections/getCollectionPreviewLocations';
import { normalizeCollectionRecord } from '../../src/lib/collections/normalizeCollectionRecord';
import { paginateCollections } from '../../src/lib/collections/paginateCollections';
import type { CollectionRecord, LocationRecord } from '../../src/types';

const LOCATIONS: LocationRecord[] = [
	{
		id: 1,
		title: 'Berlin Mitte',
		telephone: '',
		email: '',
		website: '',
		street: 'Unter den Linden',
		house_number: '1',
		postal_code: '10117',
		city: 'Berlin',
		state: '',
		country: 'Germany',
		latitude: '52.517',
		longitude: '13.388',
	},
	{
		id: 2,
		title: 'Munich Center',
		telephone: '',
		email: '',
		website: '',
		street: 'Marienplatz',
		house_number: '8',
		postal_code: '80331',
		city: 'Munich',
		state: '',
		country: 'Germany',
		latitude: '48.137154',
		longitude: '11.576124',
	},
	{
		id: 3,
		title: 'Hamburg Harbor',
		telephone: '',
		email: '',
		website: '',
		street: 'Kehrwieder',
		house_number: '5',
		postal_code: '20457',
		city: 'Hamburg',
		state: '',
		country: 'Germany',
		latitude: '53.543764',
		longitude: '9.966819',
	},
	{
		id: 4,
		title: 'No Coordinates',
		telephone: '',
		email: '',
		website: '',
		street: 'Unknown',
		house_number: '',
		postal_code: '',
		city: 'Berlin',
		state: '',
		country: 'Germany',
		latitude: '',
		longitude: '',
	},
];

describe('collection helpers', () => {
	test('normalizeCollectionRecord normalizes ids and title', () => {
		expect(
			normalizeCollectionRecord({
				id: 12,
				title: { rendered: 'Featured Cities' },
				meta: {
					location_ids: [ '3', 3, 0, -1, '2' ] as unknown as number[],
				},
			})
		).toEqual({
			id: 12,
			title: 'Featured Cities',
			location_ids: [ 3, 2 ],
		});
	});

	test('paginateCollections slices the requested page', () => {
		const collections: CollectionRecord[] = Array.from({ length: 7 }, (_, index) => ({
			id: index + 1,
			title: `Collection ${index + 1}`,
			location_ids: [],
		}));

		expect(
			paginateCollections(collections, {
				type: 'grid',
				page: 2,
				perPage: 3,
			})
		).toEqual({
			collections: collections.slice(3, 6),
			totalPages: 3,
		});
	});

	test('filterLocationsForAssignment searches title and address', () => {
		expect(filterLocationsForAssignment(LOCATIONS, 'marienplatz')).toEqual([ LOCATIONS[1] ]);
		expect(filterLocationsForAssignment(LOCATIONS, 'hamburg')).toEqual([ LOCATIONS[2] ]);
	});

	test('getCollectionPreviewLocations returns assigned points when available', () => {
		expect(
			getCollectionPreviewLocations(
				{
					id: 22,
					title: 'Assigned',
					location_ids: [ 2, 1 ],
				},
				LOCATIONS
			)
		).toEqual([
			{ lat: 48.137154, lng: 11.576124 },
			{ lat: 52.517, lng: 13.388 },
		]);
	});

	test('getCollectionPreviewLocations produces deterministic fallback points', () => {
		const collection: CollectionRecord = {
			id: 7,
			title: 'Fallback',
			location_ids: [],
		};

		const first = getCollectionPreviewLocations(collection, LOCATIONS, 2);
		const second = getCollectionPreviewLocations(collection, LOCATIONS, 2);

		expect(first).toEqual(second);
		expect(first).toHaveLength(2);
		expect(first.every((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng))).toBe(true);
	});
});
