import apiFetch from '@wordpress/api-fetch';
import type { CollectionsAdminConfig } from '../../types';

export async function deleteCollection(
	config: CollectionsAdminConfig,
	collectionId: number
): Promise<void> {
	await apiFetch({
		path: `${config.restPath}/${collectionId}?force=true`,
		method: 'DELETE',
	});
}
