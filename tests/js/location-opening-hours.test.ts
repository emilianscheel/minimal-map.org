import { describe, expect, test } from 'bun:test';
import { createDefaultOpeningHours } from '../../src/lib/locations/openingHours';
import {
	formatOpeningHoursDisplayLine,
	getOpeningHoursDisplayLines,
	getOpeningHoursStatus,
} from '../../src/map/location-opening-hours';

describe('frontend opening-hours helpers', () => {
	test('returns null when no opening intervals exist', () => {
		expect(
			getOpeningHoursStatus(
				createDefaultOpeningHours(),
				'en-US',
				'Europe/Berlin',
				new Date('2024-01-01T08:00:00Z')
			)
		).toBeNull();
	});

	test('reports open state with closing time during active opening hours', () => {
		const openingHours = createDefaultOpeningHours();
		openingHours.monday = {
			open: '09:00',
			close: '18:00',
			lunch_start: '',
			lunch_duration_minutes: 0,
		};

		expect(
			getOpeningHoursStatus(
				openingHours,
				'en-US',
				'Europe/Berlin',
				new Date('2024-01-01T10:00:00Z')
			)
		).toEqual({
			label: 'Open - closes 6:00 pm',
			state: 'open',
		});
	});

	test('reports same-day next opening before hours begin', () => {
		const openingHours = createDefaultOpeningHours();
		openingHours.monday = {
			open: '11:30',
			close: '20:00',
			lunch_start: '',
			lunch_duration_minutes: 0,
		};

		expect(
			getOpeningHoursStatus(
				openingHours,
				'en-US',
				'Europe/Berlin',
				new Date('2024-01-01T08:00:00Z')
			)
		).toEqual({
			label: 'Closed - opens 11:30 am',
			state: 'closed',
		});
	});

	test('treats lunch breaks as closed and reports the lunch end time', () => {
		const openingHours = createDefaultOpeningHours();
		openingHours.monday = {
			open: '09:00',
			close: '18:00',
			lunch_start: '12:30',
			lunch_duration_minutes: 30,
		};

		expect(
			getOpeningHoursStatus(
				openingHours,
				'en-US',
				'Europe/Berlin',
				new Date('2024-01-01T11:45:00Z')
			)
		).toEqual({
			label: 'Closed - opens 1:00 pm',
			state: 'closed',
		});
	});

	test('reports the next opening on a later day with weekday label', () => {
		const openingHours = createDefaultOpeningHours();
		openingHours.tuesday = {
			open: '11:30',
			close: '20:00',
			lunch_start: '',
			lunch_duration_minutes: 0,
		};

		expect(
			getOpeningHoursStatus(
				openingHours,
				'en-US',
				'Europe/Berlin',
				new Date('2024-01-01T19:30:00Z')
			)
		).toEqual({
			label: 'Closed - opens Tue 11:30 am',
			state: 'closed',
		});
	});

	test('formats daily display lines including lunch-break windows', () => {
		expect(
			formatOpeningHoursDisplayLine(
				{
					open: '09:00',
					close: '18:00',
					lunch_start: '12:30',
					lunch_duration_minutes: 30,
				},
				'en-US'
			)
		).toBe('9:00 am-6:00 pm, Lunch 12:30 pm-1:00 pm');
	});

	test('builds expanded daily lines for each weekday', () => {
		const lines = getOpeningHoursDisplayLines(createDefaultOpeningHours(), 'en-US');

		expect(lines).toHaveLength(7);
		expect(lines[0]).toEqual({
			dayLabel: 'Monday',
			value: 'Closed',
		});
	});
});
