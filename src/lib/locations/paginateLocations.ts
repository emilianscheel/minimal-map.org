import type { LocationRecord } from '../../types';

const DEFAULT_LOCATIONS_PER_PAGE = 5;

type PaginatedLocationView = {
	page?: number;
	perPage?: number;
	search?: string;
};

export function paginateLocations(locations: LocationRecord[], view: PaginatedLocationView): {
	locations: LocationRecord[];
	totalPages: number;
} {
	const search = view.search?.toLowerCase() || '';
	const filteredLocations = search
		? locations.filter((location) => {
				return (
					location.title.toLowerCase().includes(search) ||
					location.street.toLowerCase().includes(search) ||
					location.city.toLowerCase().includes(search) ||
					location.email.toLowerCase().includes(search)
				);
		  })
		: locations;

	const page = view.page ?? 1;
	const perPage = view.perPage ?? DEFAULT_LOCATIONS_PER_PAGE;
	const totalPages = Math.max(1, Math.ceil(filteredLocations.length / perPage));
	const startIndex = (page - 1) * perPage;

	return {
		locations: filteredLocations.slice(startIndex, startIndex + perPage),
		totalPages,
	};
}
