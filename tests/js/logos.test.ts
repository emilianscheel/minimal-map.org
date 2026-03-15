import { describe, expect, test } from 'bun:test';
import { buildLocationMeta } from '../../src/lib/locations/buildLocationMeta';
import { normalizeLocationRecord } from '../../src/lib/locations/normalizeLocationRecord';
import { normalizeLogoRecord } from '../../src/lib/logos/normalizeLogoRecord';
import { createDefaultOpeningHours } from '../../src/lib/locations/openingHours';

describe('logo and location helpers', () => {
	test('normalizeLogoRecord keeps filename and svg content', () => {
		expect(
			normalizeLogoRecord({
				id: 14,
				title: { raw: 'brand.svg' },
				content: { raw: '<svg viewBox="0 0 24 24"></svg>' },
			})
		).toEqual({
			id: 14,
			title: 'brand.svg',
			content: '<svg viewBox="0 0 24 24"></svg>',
		});
	});

	test('normalizeLocationRecord reads integer logo assignment', () => {
		expect(
			normalizeLocationRecord({
				id: 9,
				title: { raw: 'Berlin HQ' },
				meta: {
					telephone: '',
					email: '',
					website: '',
					street: '',
					house_number: '',
					postal_code: '',
					city: '',
					state: '',
					country: '',
					latitude: '52.5',
					longitude: '13.4',
					logo_id: 22,
					marker_id: 0,
				},
				minimal_map_tag: [3],
			})
		).toMatchObject({
			id: 9,
			title: 'Berlin HQ',
			logo_id: 22,
			tag_ids: [3],
		});
	});

	test('buildLocationMeta preserves the numeric logo id', () => {
		expect(
			buildLocationMeta({
				title: 'Berlin HQ',
				telephone: '',
				email: '',
				website: '',
				street: '',
				house_number: '',
				postal_code: '',
				city: '',
				state: '',
				country: '',
				latitude: '52.5',
				longitude: '13.4',
				logo_id: 11,
				marker_id: 0,
				opening_hours: createDefaultOpeningHours(),
				opening_hours_notes: '',
				tag_ids: [],
			})
		).toMatchObject({
			logo_id: 11,
		});
	});
});
