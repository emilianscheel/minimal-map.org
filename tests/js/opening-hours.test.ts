import { describe, expect, test } from 'bun:test';
import { createLocationFormStateFromRecord } from '../../src/lib/locations/createLocationFormStateFromRecord';
import { formatOpeningHoursSummary } from '../../src/lib/locations/formatOpeningHoursSummary';
import {
	createDefaultOpeningHours,
	normalizeOpeningHours,
} from '../../src/lib/locations/openingHours';
import { validateOpeningHoursStep } from '../../src/lib/locations/validateOpeningHoursStep';

describe('opening hours helpers', () => {
	test('normalizeOpeningHours fills missing days and strips invalid values', () => {
		expect(
			normalizeOpeningHours({
				monday: {
					open: '09:00',
					close: '18:00',
					lunch_start: '12:30',
					lunch_duration_minutes: '30',
				},
				tuesday: {
					open: 'invalid',
					close: '19:00',
					lunch_start: '25:00',
					lunch_duration_minutes: '-5',
				},
			})
		).toEqual({
			monday: {
				open: '09:00',
				close: '18:00',
				lunch_start: '12:30',
				lunch_duration_minutes: 30,
			},
			tuesday: {
				open: '',
				close: '19:00',
				lunch_start: '',
				lunch_duration_minutes: 0,
			},
			wednesday: {
				open: '',
				close: '',
				lunch_start: '',
				lunch_duration_minutes: 0,
			},
			thursday: {
				open: '',
				close: '',
				lunch_start: '',
				lunch_duration_minutes: 0,
			},
			friday: {
				open: '',
				close: '',
				lunch_start: '',
				lunch_duration_minutes: 0,
			},
			saturday: {
				open: '',
				close: '',
				lunch_start: '',
				lunch_duration_minutes: 0,
			},
			sunday: {
				open: '',
				close: '',
				lunch_start: '',
				lunch_duration_minutes: 0,
			},
		});
	});

	test('validateOpeningHoursStep reports partial day and lunch-break errors', () => {
		const openingHours = createDefaultOpeningHours();
		openingHours.monday.open = '09:00';
		openingHours.monday.close = '';
		openingHours.tuesday.open = '10:00';
		openingHours.tuesday.close = '18:00';
		openingHours.tuesday.lunch_start = '13:00';
		openingHours.tuesday.lunch_duration_minutes = 0;

		const errors = validateOpeningHoursStep({
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
			latitude: '',
			longitude: '',
			logo_id: 0,
			marker_id: 0,
			opening_hours: openingHours,
			opening_hours_notes: '',
			tag_ids: [],
		});

		expect(errors.opening_hours?.monday).toBeTruthy();
		expect(errors.opening_hours?.tuesday).toBeTruthy();
	});

	test('formatOpeningHoursSummary groups consecutive days and limits visible lines', () => {
		const openingHours = createDefaultOpeningHours();

		for (const dayKey of ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const) {
			openingHours[dayKey] = {
				open: '09:00',
				close: '18:00',
				lunch_start: '',
				lunch_duration_minutes: 0,
			};
		}

		openingHours.saturday = {
			open: '10:00',
			close: '14:00',
			lunch_start: '12:00',
			lunch_duration_minutes: 30,
		};

		openingHours.sunday = {
			open: '11:00',
			close: '13:00',
			lunch_start: '',
			lunch_duration_minutes: 0,
		};

		expect(formatOpeningHoursSummary(openingHours)).toEqual({
			lines: ['Mon-Fri 09:00-18:00', 'Sat 10:00-14:00 Lunch 12:00 / 30m'],
			hiddenLineCount: 1,
		});
	});

	test('createLocationFormStateFromRecord preserves opening hours and notes', () => {
		const openingHours = createDefaultOpeningHours();
		openingHours.saturday = {
			open: '10:00',
			close: '14:00',
			lunch_start: '',
			lunch_duration_minutes: 0,
		};

		expect(
			createLocationFormStateFromRecord({
				id: 22,
				title: 'Weekend Store',
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
				logo_id: 0,
				marker_id: 0,
				opening_hours: openingHours,
				opening_hours_notes: 'Summer season only.',
				tag_ids: [],
			})
		).toMatchObject({
			opening_hours: openingHours,
			opening_hours_notes: 'Summer season only.',
		});
	});
});
