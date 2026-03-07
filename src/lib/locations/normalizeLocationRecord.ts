import type { LocationRecord, LocationRestResponse } from '../../types';

export function normalizeLocationRecord(record: LocationRestResponse): LocationRecord {
	const meta = record.meta ?? {};

	return {
		id: record.id,
		title: record.title?.raw || record.title?.rendered || '',
		telephone: meta.telephone ?? '',
		email: meta.email ?? '',
		website: meta.website ?? '',
		street: meta.street ?? '',
		house_number: meta.house_number ?? '',
		postal_code: meta.postal_code ?? '',
		city: meta.city ?? '',
		state: meta.state ?? '',
		country: meta.country ?? '',
		latitude: meta.latitude ?? '',
		longitude: meta.longitude ?? '',
	};
}
