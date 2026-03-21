import { describe, expect, test } from 'bun:test';
import type {
	LocationRecord,
	LogoRecord,
	MarkerRecord,
	TagRecord,
} from '../../src/types';
import {
	getAssignableLogoIds,
	getAssignableMarkerIds,
	getAssignableTagIds,
	getAssignedTagIdsForSelection,
	getCommonTagIds,
	getDisplayedAssignedTags,
	getLocationTitleTokens,
	getLocationsWithAssignedLogos,
	getLocationsWithAssignedMarkers,
	getLocationsWithAssignedTags,
	getQuickAssignableLogo,
	getQuickAssignableMarker,
	getQuickAssignableTag,
	mergeLocationTagIds,
} from '../../src/admin/locations/assignmentHelpers';
import { createDefaultOpeningHours } from '../../src/lib/locations/openingHours';

function createLocationRecord(overrides: Partial<LocationRecord>): LocationRecord {
	return {
		id: 1,
		title: 'Location',
		telephone: '',
		email: '',
		website: '',
		street: '',
		house_number: '',
		postal_code: '',
		city: '',
		state: '',
		country: '',
		latitude: '',
		longitude: '',
		logo_id: 0,
		marker_id: 0,
		is_hidden: false,
		opening_hours: createDefaultOpeningHours(),
		opening_hours_notes: '',
		tag_ids: [],
		...overrides,
	};
}

const TAGS: TagRecord[] = [
	{ id: 10, name: 'Cafe', count: 0, background_color: '#111111', foreground_color: '#ffffff' },
	{ id: 11, name: 'Bakery', count: 0, background_color: '#222222', foreground_color: '#ffffff' },
	{ id: 12, name: 'Wifi', count: 0, background_color: '#333333', foreground_color: '#ffffff' },
];

function createLogoRecord(overrides: Partial<LogoRecord>): LogoRecord {
	return {
		id: 1,
		title: 'logo.svg',
		content: '',
		...overrides,
	};
}

function createMarkerRecord(overrides: Partial<MarkerRecord>): MarkerRecord {
	return {
		id: 1,
		title: 'marker.svg',
		content: '',
		...overrides,
	};
}

describe('location assignment helpers', () => {
	test('merges added tags without removing existing ones', () => {
		expect(mergeLocationTagIds([12, 10], [10, 11])).toEqual([10, 11, 12]);
	});

	test('tokenizes location titles into lowercased unique search words', () => {
		expect(getLocationTitleTokens('Kaufland Hohen-Neuendorf, kaufland')).toEqual([
			'kaufland',
			'hohen',
			'neuendorf',
		]);
	});

	test('computes assigned, common, and assignable tags for mixed selections', () => {
		const locations = [
			createLocationRecord({ id: 1, tag_ids: [10, 11] }),
			createLocationRecord({ id: 2, tag_ids: [10, 12] }),
		];

		expect(getAssignedTagIdsForSelection(locations)).toEqual([10, 11, 12]);
		expect(getCommonTagIds(locations)).toEqual([10]);
		expect(getAssignableTagIds(locations, TAGS.map((tag) => tag.id))).toEqual([11, 12]);
		expect(getDisplayedAssignedTags(locations, TAGS).map((tag) => tag.id)).toEqual([10, 11, 12]);
	});

	test('filters assignable logo and marker options for single and bulk selections', () => {
		const singleLocation = [createLocationRecord({ id: 1, logo_id: 7, marker_id: 3 })];
		const bulkSameLocation = [
			createLocationRecord({ id: 1, logo_id: 7, marker_id: 3 }),
			createLocationRecord({ id: 2, logo_id: 7, marker_id: 3 }),
		];
		const bulkMixedLocation = [
			createLocationRecord({ id: 1, logo_id: 7, marker_id: 3 }),
			createLocationRecord({ id: 2, logo_id: 8, marker_id: 4 }),
		];

		expect(getAssignableLogoIds(singleLocation, [7, 8, 9])).toEqual([8, 9]);
		expect(getAssignableMarkerIds(singleLocation, [3, 4, 5])).toEqual([4, 5]);
		expect(getAssignableLogoIds(bulkSameLocation, [7, 8, 9])).toEqual([8, 9]);
		expect(getAssignableMarkerIds(bulkSameLocation, [3, 4, 5])).toEqual([4, 5]);
		expect(getAssignableLogoIds(bulkMixedLocation, [7, 8, 9])).toEqual([7, 8, 9]);
		expect(getAssignableMarkerIds(bulkMixedLocation, [3, 4, 5])).toEqual([3, 4, 5]);
	});

	test('finds quick matches for logos, markers, and tags from the location title', () => {
		const location = createLocationRecord({ title: 'Kaufland Hohen Neuendorf' });
		const logos = [
			createLogoRecord({ id: 1, title: 'other.png' }),
			createLogoRecord({ id: 2, title: 'kaufland.png' }),
		];
		const markers = [
			createMarkerRecord({ id: 3, title: 'other.svg' }),
			createMarkerRecord({ id: 4, title: 'kaufland.svg' }),
		];
		const tags = [
			{ id: 13, name: 'Bakery', count: 0, background_color: '#000000', foreground_color: '#ffffff' },
			{ id: 14, name: 'Kaufland', count: 0, background_color: '#000000', foreground_color: '#ffffff' },
		];

		expect(getQuickAssignableLogo(location, logos)?.id).toBe(2);
		expect(getQuickAssignableMarker(location, markers)?.id).toBe(4);
		expect(getQuickAssignableTag(location, tags)?.id).toBe(14);
	});

	test('falls back to the first assignable candidate when no quick match exists', () => {
		const location = createLocationRecord({ title: 'No Known Match' });
		const logos = [
			createLogoRecord({ id: 1, title: 'fallback.png' }),
			createLogoRecord({ id: 2, title: 'second.png' }),
		];
		const markers = [
			createMarkerRecord({ id: 3, title: 'fallback.svg' }),
			createMarkerRecord({ id: 4, title: 'second.svg' }),
		];
		const tags = [
			{ id: 15, name: 'Fallback', count: 0, background_color: '#000000', foreground_color: '#ffffff' },
			{ id: 16, name: 'Second', count: 0, background_color: '#000000', foreground_color: '#ffffff' },
		];

		expect(getQuickAssignableLogo(location, logos)?.id).toBe(1);
		expect(getQuickAssignableMarker(location, markers)?.id).toBe(3);
		expect(getQuickAssignableTag(location, tags)?.id).toBe(15);
	});

	test('skips already assigned items and hides quick actions when no assignable candidate exists', () => {
		const location = createLocationRecord({
			title: 'Kaufland Flagship',
			logo_id: 2,
			marker_id: 4,
			tag_ids: [14, 15],
		});
		const logos = [
			createLogoRecord({ id: 2, title: 'kaufland.png' }),
			createLogoRecord({ id: 3, title: 'flagship.png' }),
		];
		const markers = [
			createMarkerRecord({ id: 4, title: 'kaufland.svg' }),
		];
		const tags = [
			{ id: 14, name: 'Kaufland', count: 0, background_color: '#000000', foreground_color: '#ffffff' },
			{ id: 15, name: 'Flagship', count: 0, background_color: '#000000', foreground_color: '#ffffff' },
		];

		expect(getQuickAssignableLogo(location, logos)?.id).toBe(3);
		expect(getQuickAssignableMarker(location, markers)).toBeNull();
		expect(getQuickAssignableTag(location, tags)).toBeNull();
	});

	test('finds only locations affected by remove actions', () => {
		const locations = [
			createLocationRecord({ id: 1, logo_id: 9, marker_id: 3, tag_ids: [10] }),
			createLocationRecord({ id: 2, logo_id: 0, marker_id: 4, tag_ids: [] }),
			createLocationRecord({ id: 3, logo_id: 8, marker_id: 0, tag_ids: [11, 12] }),
		];

		expect(getLocationsWithAssignedLogos(locations).map((location) => location.id)).toEqual([1, 3]);
		expect(getLocationsWithAssignedMarkers(locations).map((location) => location.id)).toEqual([1, 2]);
		expect(getLocationsWithAssignedTags(locations).map((location) => location.id)).toEqual([1, 3]);
	});
});
