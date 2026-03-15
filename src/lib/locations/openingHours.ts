import type {
	LocationOpeningHours,
	LocationOpeningHoursDay,
	OpeningHoursDayKey,
} from '../../types';

export const OPENING_HOURS_DAY_ORDER: OpeningHoursDayKey[] = [
	'monday',
	'tuesday',
	'wednesday',
	'thursday',
	'friday',
	'saturday',
	'sunday',
];

export function createDefaultOpeningHoursDay(): LocationOpeningHoursDay {
	return {
		open: '',
		close: '',
		lunch_start: '',
		lunch_duration_minutes: 0,
	};
}

export function createDefaultOpeningHours(): LocationOpeningHours {
	return OPENING_HOURS_DAY_ORDER.reduce<LocationOpeningHours>((hours, dayKey) => {
		hours[dayKey] = createDefaultOpeningHoursDay();
		return hours;
	}, {} as LocationOpeningHours);
}

export const DEFAULT_OPENING_HOURS = createDefaultOpeningHours();

export function isValidOpeningHoursTime(value: string): boolean {
	return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function normalizeOpeningHoursDay(rawValue: unknown): LocationOpeningHoursDay {
	const source = rawValue && typeof rawValue === 'object' ? rawValue as Record<string, unknown> : {};
	const open = typeof source.open === 'string' && isValidOpeningHoursTime(source.open)
		? source.open
		: '';
	const close = typeof source.close === 'string' && isValidOpeningHoursTime(source.close)
		? source.close
		: '';
	const lunchStart =
		typeof source.lunch_start === 'string' && isValidOpeningHoursTime(source.lunch_start)
			? source.lunch_start
			: '';
	const lunchDuration = Number.isFinite(source.lunch_duration_minutes)
		? Math.max(0, Math.floor(Number(source.lunch_duration_minutes)))
		: typeof source.lunch_duration_minutes === 'string' && source.lunch_duration_minutes.trim()
			? Math.max(0, Math.floor(Number(source.lunch_duration_minutes)))
			: 0;

	return {
		open,
		close,
		lunch_start: lunchStart,
		lunch_duration_minutes: Number.isFinite(lunchDuration) ? lunchDuration : 0,
	};
}

export function normalizeOpeningHours(rawValue: unknown): LocationOpeningHours {
	const source = rawValue && typeof rawValue === 'object' ? rawValue as Record<string, unknown> : {};

	return OPENING_HOURS_DAY_ORDER.reduce<LocationOpeningHours>((hours, dayKey) => {
		hours[dayKey] = normalizeOpeningHoursDay(source[dayKey]);
		return hours;
	}, createDefaultOpeningHours());
}

export function hasOpeningHoursForDay(day: LocationOpeningHoursDay): boolean {
	return day.open.trim() !== '' || day.close.trim() !== '';
}

export function hasLunchBreakForDay(day: LocationOpeningHoursDay): boolean {
	return day.lunch_start.trim() !== '' || day.lunch_duration_minutes > 0;
}

export function isOpeningHoursConfigured(hours: LocationOpeningHours): boolean {
	return OPENING_HOURS_DAY_ORDER.some((dayKey) => {
		const day = hours[dayKey];
		return hasOpeningHoursForDay(day) || hasLunchBreakForDay(day);
	});
}

export function getOpeningHoursDaySignature(day: LocationOpeningHoursDay): string {
	return JSON.stringify(day);
}

export interface OpeningHoursGroup {
	dayKeys: OpeningHoursDayKey[];
	day: LocationOpeningHoursDay;
}

export function groupOpeningHoursDays(hours: LocationOpeningHours): OpeningHoursGroup[] {
	const groups: OpeningHoursGroup[] = [];

	for (const dayKey of OPENING_HOURS_DAY_ORDER) {
		const day = hours[dayKey];
		const previousGroup = groups[groups.length - 1];

		if (
			previousGroup &&
			getOpeningHoursDaySignature(previousGroup.day) === getOpeningHoursDaySignature(day)
		) {
			previousGroup.dayKeys.push(dayKey);
			continue;
		}

		groups.push({
			dayKeys: [dayKey],
			day: { ...day },
		});
	}

	return groups;
}
