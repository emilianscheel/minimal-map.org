import type { CollectionRecord } from '../../types';
import type { ViewGrid, ViewTable } from '@wordpress/dataviews';

export function paginateCollections(
	collections: CollectionRecord[],
	view: ViewGrid | ViewTable
): {
	collections: CollectionRecord[];
	totalPages: number;
} {
	const page = view.page ?? 1;
	const perPage = view.perPage ?? 10;
	const totalPages = Math.max(1, Math.ceil(collections.length / perPage));
	const startIndex = (page - 1) * perPage;

	return {
		collections: collections.slice(startIndex, startIndex + perPage),
		totalPages,
	};
}
