import type { CollectionRecord, LocationRecord, StyleThemeRecord } from '../../types';

export interface CollectionMiniMapComparableProps {
	collection: Pick<CollectionRecord, 'id' | 'location_ids'>;
	locations: LocationRecord[];
	theme: StyleThemeRecord | null;
}

export function haveSameCollectionLocationIds(
	previousLocationIds: readonly number[],
	nextLocationIds: readonly number[]
): boolean {
	if (previousLocationIds.length !== nextLocationIds.length) {
		return false;
	}

	for (let index = 0; index < previousLocationIds.length; index += 1) {
		if (previousLocationIds[index] !== nextLocationIds[index]) {
			return false;
		}
	}

	return true;
}

export function areCollectionMiniMapPropsEqual(
	previousProps: CollectionMiniMapComparableProps,
	nextProps: CollectionMiniMapComparableProps
): boolean {
	if (previousProps.collection.id !== nextProps.collection.id) {
		return false;
	}

	if (!haveSameCollectionLocationIds(previousProps.collection.location_ids, nextProps.collection.location_ids)) {
		return false;
	}

	if (previousProps.theme !== nextProps.theme) {
		return false;
	}

	return previousProps.locations === nextProps.locations;
}
