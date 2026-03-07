import { __ } from '@wordpress/i18n';

export default function CollectionsEmptyState() {
	return (
		<div className="minimal-map-admin__collections-empty">
			<h3>{__('No collections yet', 'minimal-map')}</h3>
			<p>{__('Use the “Add collection” button to create your first collection.', 'minimal-map')}</p>
		</div>
	);
}
