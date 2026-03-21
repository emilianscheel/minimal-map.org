import { describe, expect, test } from 'bun:test';
import { createDefaultOpeningHours } from '../../src/lib/locations/openingHours';
import {
	formatOpeningHoursDisplayLine,
	getOpeningHoursDisplayLines,
	getOpeningHoursStatus,
	isLocationOpenNow,
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

	test('reports closes soon when the current open interval ends within 30 minutes', () => {
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
				new Date('2024-01-01T16:30:00Z')
			)
		).toEqual({
			label: 'Open - closes soon 6:00 pm',
			state: 'soon',
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

	test('reports opens soon when the next same-day opening is within 30 minutes', () => {
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
				new Date('2024-01-01T10:00:00Z')
			)
		).toEqual({
			label: 'Opens soon - 11:30 am',
			state: 'soon',
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

	test('reports closes soon when lunch starts within 30 minutes', () => {
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
				new Date('2024-01-01T10:35:00Z')
			)
		).toEqual({
			label: 'Open - closes soon 12:30 pm',
			state: 'soon',
		});
	});

	test('reports opens soon when lunch ends within 30 minutes', () => {
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
				new Date('2024-01-01T11:35:00Z')
			)
		).toEqual({
			label: 'Opens soon - 1:00 pm',
			state: 'soon',
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

	test('falls back to the browser timezone when the configured site timezone is UTC', () => {
		const openingHours = createDefaultOpeningHours();
		const OriginalDateTimeFormat = Intl.DateTimeFormat;

		openingHours.saturday = {
			open: '08:00',
			close: '11:20',
			lunch_start: '',
			lunch_duration_minutes: 0,
		};

		(Intl as unknown as { DateTimeFormat: typeof Intl.DateTimeFormat }).DateTimeFormat =
			function DateTimeFormat(
				locales?: string | string[],
				options?: Intl.DateTimeFormatOptions
			) {
				if (typeof locales === 'undefined' && typeof options === 'undefined') {
					return {
						resolvedOptions: () => ({
							timeZone: 'Europe/Berlin',
						}),
					} as Intl.DateTimeFormat;
				}

				return new OriginalDateTimeFormat(locales, options);
			} as typeof Intl.DateTimeFormat;

		try {
			expect(
				getOpeningHoursStatus(
					openingHours,
					'en-US',
					'UTC',
					new Date('2024-03-23T10:01:00Z')
				)
			).toEqual({
				label: 'Open - closes soon 11:20 am',
				state: 'soon',
			});
		} finally {
			(Intl as unknown as { DateTimeFormat: typeof Intl.DateTimeFormat }).DateTimeFormat =
				OriginalDateTimeFormat;
		}
	});

	test('reports whether a location is currently open for quick-filter usage', () => {
		const openingHours = createDefaultOpeningHours();

		openingHours.monday = {
			open: '09:00',
			close: '18:00',
			lunch_start: '12:30',
			lunch_duration_minutes: 30,
		};

		expect(
			isLocationOpenNow(
				openingHours,
				'Europe/Berlin',
				new Date('2024-01-01T10:00:00Z')
			)
		).toBe(true);
		expect(
			isLocationOpenNow(
				openingHours,
				'Europe/Berlin',
				new Date('2024-01-01T11:45:00Z')
			)
		).toBe(false);
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
