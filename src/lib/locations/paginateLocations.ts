import type { LocationRecord } from '../../types';

type PaginatedLocationView = {
	page?: number;
	perPage?: number;
};

export function paginateLocations(locations: LocationRecord[], view: PaginatedLocationView): {
	locations: LocationRecord[];
	totalPages: number;
} {
	const page = view.page ?? 1;
	const perPage = view.perPage ?? 10;
	const totalPages = Math.max(1, Math.ceil(locations.length / perPage));
	const startIndex = (page - 1) * perPage;

	return {
		locations: locations.slice(startIndex, startIndex + perPage),
		totalPages,
	};
}
