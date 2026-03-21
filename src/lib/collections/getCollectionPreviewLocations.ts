import type { CollectionRecord, LocationRecord, MapLocationPoint } from '../../types';

const DEFAULT_PREVIEW_SAMPLE_SIZE = 3;

function normalizePoint(location: LocationRecord): MapLocationPoint | null {
	if (location.is_hidden) {
		return null;
	}

	const lat = Number(location.latitude);
	const lng = Number(location.longitude);

	if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
		return null;
	}

	return {
		lat,
		lng,
		markerContent: location.markerContent,
	};
}

function createSeed(input: string): number {
	let hash = 0;

	for (let index = 0; index < input.length; index += 1) {
		hash = ((hash << 5) - hash + input.charCodeAt(index)) >>> 0;
	}

	return hash || 1;
}

function nextSeed(seed: number): number {
	return (seed * 1664525 + 1013904223) >>> 0;
}

export function getCollectionPreviewLocations(
	collection: CollectionRecord,
	locations: LocationRecord[],
	sampleSize = DEFAULT_PREVIEW_SAMPLE_SIZE
): MapLocationPoint[] {
	const locationsById = new Map(locations.map((location) => [location.id, location]));
	const assignedPoints = collection.location_ids
		.map((locationId) => locationsById.get(locationId))
		.filter((location): location is LocationRecord => Boolean(location))
		.map(normalizePoint)
		.filter((point): point is MapLocationPoint => point !== null);

	if (assignedPoints.length > 0) {
		return assignedPoints;
	}

	const availableLocations = locations.filter((location) => normalizePoint(location) !== null);

	if (availableLocations.length <= sampleSize) {
		return availableLocations
			.map(normalizePoint)
			.filter((point): point is MapLocationPoint => point !== null);
	}

	const sampledPoints: MapLocationPoint[] = [];
	const chosenIndices = new Set<number>();
	let seed = createSeed(`${collection.id}:${collection.title}`);

	while (sampledPoints.length < sampleSize && chosenIndices.size < availableLocations.length) {
		seed = nextSeed(seed);
		const index = seed % availableLocations.length;

		if (chosenIndices.has(index)) {
			continue;
		}

		chosenIndices.add(index);
		const point = normalizePoint(availableLocations[index]);

		if (point) {
			sampledPoints.push(point);
		}
	}

	return sampledPoints;
}
