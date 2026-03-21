import { isOpeningHoursConfigured } from '../lib/locations/openingHours';
import type { MapLocationPoint, MapLocationTag } from '../types';
import { isLocationOpenNow } from './location-opening-hours';

export function collectLocationTags(locations: MapLocationPoint[]): MapLocationTag[] {
	const tagsById = new Map<number, MapLocationTag>();

	locations.forEach((location) => {
		location.tags?.forEach((tag) => {
			if (!tagsById.has(tag.id)) {
				tagsById.set(tag.id, tag);
			}
		});
	});

	return Array.from(tagsById.values()).sort((left, right) =>
		left.name.localeCompare(right.name)
	);
}

export function pruneActiveCategoryTagIds(
	activeCategoryTagIds: number[],
	locations: MapLocationPoint[]
): number[] {
	const availableTagIds = new Set(collectLocationTags(locations).map((tag) => tag.id));

	return Array.from(
		new Set(activeCategoryTagIds.filter((tagId) => availableTagIds.has(tagId)))
	);
}

export function filterLocationsByCategoryTagIds(
	locations: MapLocationPoint[],
	activeCategoryTagIds: number[]
): MapLocationPoint[] {
	if (activeCategoryTagIds.length === 0) {
		return locations;
	}

	const selectedTagIds = new Set(activeCategoryTagIds);

	return locations.filter((location) =>
		location.tags?.some((tag) => selectedTagIds.has(tag.id)) ?? false
	);
}

export function filterLocationsByOpenedStatus(
	locations: MapLocationPoint[],
	siteTimezone: string,
	now = new Date()
): MapLocationPoint[] {
	return locations.filter(
		(location) =>
			location.opening_hours &&
			isOpeningHoursConfigured(location.opening_hours) &&
			isLocationOpenNow(location.opening_hours, siteTimezone, now)
	);
}
