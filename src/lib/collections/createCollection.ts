import apiFetch from '@wordpress/api-fetch';
import type { CollectionFormState, CollectionsAdminConfig } from '../../types';

export async function createCollection(
	config: CollectionsAdminConfig,
	title: string,
	locationIds: number[] = []
): Promise<void> {
	await apiFetch({
		path: config.restPath,
		method: 'POST',
		data: {
			title: title.trim(),
			status: 'publish',
			meta: {
				location_ids: locationIds,
			},
		},
	});
}
