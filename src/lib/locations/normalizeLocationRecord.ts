import type { LocationRecord, LocationRestResponse } from '../../types';
import { normalizeOpeningHours } from './openingHours';
import { normalizeLocationVisibilityValue } from './visibility';

export function normalizeLocationRecord(record: LocationRestResponse): LocationRecord {
	const meta = record.meta ?? {};

	const result: LocationRecord = {
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
		logo_id: Number(meta.logo_id ?? 0) || 0,
		marker_id: Number(meta.marker_id ?? 0) || 0,
		is_hidden: normalizeLocationVisibilityValue(meta.is_hidden),
		opening_hours: normalizeOpeningHours(meta.opening_hours),
		opening_hours_notes: meta.opening_hours_notes ?? '',
		social_media: Array.isArray(meta.social_media) ? meta.social_media : [],
		tag_ids: record.minimal_map_tag ?? [],
	};

	return result;
}
