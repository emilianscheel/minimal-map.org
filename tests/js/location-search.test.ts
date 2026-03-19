import { describe, expect, test } from 'bun:test';
import {
	buildLocationSearchIndex,
	normalizeSearchValue,
	searchIndexedLocations,
} from '../../src/map/location-search';
import type { MapLocationPoint } from '../../src/types';

const locations: MapLocationPoint[] = [
	{
		id: 1,
		title: 'Berlin Studio',
		lat: 52.52,
		lng: 13.405,
		street: 'Moosdorfstraße',
		house_number: '10',
		postal_code: '12345',
		city: 'Berlin',
		country: 'Germany',
	},
	{
		id: 2,
		title: 'Berlin Studio Annex',
		lat: 52.521,
		lng: 13.406,
		street: 'Moosdorffstraße',
		house_number: '10',
		postal_code: '12345',
		city: 'Berlin',
		country: 'Germany',
	},
	{
		id: 3,
		title: 'Hamburg Office',
		lat: 53.5511,
		lng: 9.9937,
		street: 'Fleetinsel',
		house_number: '4',
		postal_code: '20457',
		city: 'Hamburg',
		country: 'Germany',
	},
];

describe('location search helper', () => {
	test('normalizes German variants and punctuation for matching', () => {
		expect(normalizeSearchValue('Moosdorfstraße, 10')).toBe('moosdorfstrasse 10');
		expect(normalizeSearchValue('Möösdorfstraße')).toBe('moeoesdorfstrasse');
	});

	test('matches street and house number across split address fields', () => {
		const results = searchIndexedLocations(
			buildLocationSearchIndex(locations),
			'Moosdorfstraße 10',
		);

		expect(results.map((location) => location.id)).toEqual([1, 2]);
	});

	test('matches address tokens independent of input order', () => {
		const results = searchIndexedLocations(
			buildLocationSearchIndex(locations),
			'10 Moosdorfstraße',
		);

		expect(results.map((location) => location.id)).toEqual([1, 2]);
	});

	test('matches street, house number, zip code, and city in one query', () => {
		const results = searchIndexedLocations(
			buildLocationSearchIndex(locations),
			'Moosdorfstraße 10 12345 Berlin',
		);

		expect(results.map((location) => location.id)).toEqual([1, 2]);
	});

	test('matches strasse and straße as equivalent values', () => {
		const results = searchIndexedLocations(
			buildLocationSearchIndex(locations),
			'Moosdorfstrasse 10',
		);

		expect(results.map((location) => location.id)).toEqual([1, 2]);
	});

	test('recovers from a small street-name typo with conservative fuzzy matching', () => {
		const results = searchIndexedLocations(
			buildLocationSearchIndex(locations),
			'Moosdorfstasse 10',
		);

		expect(results.map((location) => location.id)).toEqual([1, 2]);
	});

	test('matches unfinished street tokens while typing', () => {
		const results = searchIndexedLocations(
			buildLocationSearchIndex(locations),
			'Moosdorf',
		);

		expect(results.map((location) => location.id)).toEqual([1, 2]);
	});

	test('matches unfinished street tokens with fuzzy prefix matching while typing', () => {
		const results = searchIndexedLocations(
			buildLocationSearchIndex(locations),
			'Moosdorff',
		);

		expect(results.map((location) => location.id)).toEqual([2, 1]);
	});

	test('does not fuzzy match numeric house numbers', () => {
		const results = searchIndexedLocations(
			buildLocationSearchIndex(locations),
			'Moosdorfstraße 11',
		);

		expect(results).toHaveLength(0);
	});

	test('ranks stronger exact address matches ahead of fuzzy matches', () => {
		const results = searchIndexedLocations(
			buildLocationSearchIndex(locations),
			'Moosdorfstraße 10',
		);

		expect(results.map((location) => location.id)).toEqual([1, 2]);
	});
});
