import apiFetch from '@wordpress/api-fetch';
import type { CollectionsAdminConfig } from '../../types';

export async function updateCollection(
	config: CollectionsAdminConfig,
	collectionId: number,
	title: string,
	locationIds: number[]
): Promise<void> {
	await apiFetch({
		path: `${config.restPath}/${collectionId}`,
		method: 'POST',
		data: {
			title: title.trim(),
			meta: {
				location_ids: locationIds,
			},
		},
	});
}
