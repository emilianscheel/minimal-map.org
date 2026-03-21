import { __ } from '@wordpress/i18n';
import { EyeOff } from 'lucide-react';
import type { LocationRecord } from '../../types';

export default function LocationTitleCell({ location }: { location: LocationRecord }) {
	if (!location.is_hidden) {
		return <span className="minimal-map-admin__location-title">{location.title}</span>;
	}

	const hiddenLabel = __('Hidden location', 'minimal-map');

	return (
		<span className="minimal-map-admin__location-title minimal-map-admin__location-title--hidden">
			<span className="minimal-map-admin__location-title-text">{location.title}</span>
			<EyeOff
				className="minimal-map-admin__location-title-icon"
				size={14}
				strokeWidth={2}
				aria-label={hiddenLabel}
				title={hiddenLabel}
			/>
		</span>
	);
}
