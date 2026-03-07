import type { CollectionRecord, CollectionRestResponse } from '../../types';

function normalizeLocationIds(locationIds: unknown): number[] {
	if (!Array.isArray(locationIds)) {
		return [];
	}

	const normalizedIds = locationIds
		.map((value) => Number(value))
		.filter((value) => Number.isInteger(value) && value > 0);

	return Array.from(new Set(normalizedIds));
}

export function normalizeCollectionRecord(record: CollectionRestResponse): CollectionRecord {
	const meta = record.meta ?? {};

	return {
		id: record.id,
		title: record.title?.raw || record.title?.rendered || '',
		location_ids: normalizeLocationIds(meta.location_ids),
	};
}
