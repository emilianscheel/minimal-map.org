import apiFetch from '@wordpress/api-fetch';
import type {
	CollectionRecord,
	CollectionRestResponse,
	CollectionsAdminConfig,
} from '../../types';
import { normalizeCollectionRecord } from './normalizeCollectionRecord';

export async function fetchAllCollections(config: CollectionsAdminConfig): Promise<CollectionRecord[]> {
	const perPage = 100;
	let page = 1;
	let totalPages = 1;
	const collections: CollectionRecord[] = [];

	while (page <= totalPages) {
		const response = (await apiFetch({
			method: 'GET',
			parse: false,
			path: `${config.restPath}?context=edit&page=${page}&per_page=${perPage}&_fields=id,title,meta`,
		})) as Response;
		const records = (await response.json()) as CollectionRestResponse[];

		collections.push(...records.map(normalizeCollectionRecord));
		totalPages = Number(response.headers.get('X-WP-TotalPages') || '1');
		page += 1;
	}

	return collections;
}
