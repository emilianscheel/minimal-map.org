import { Notice, Spinner } from '@wordpress/components';
import LocationDialog from './LocationDialog';
import LocationsEmptyState from './LocationsEmptyState';
import LocationsTable from './LocationsTable';
import type { LocationsController } from './types';

export { useLocationsController } from './controller';
export type { LocationsController } from './types';

export default function LocationsView({ controller }: { controller: LocationsController }) {
	return (
		<>
			{controller.actionNotice && (
				<Notice
					className="minimal-map-admin__locations-notice"
					status={controller.actionNotice.status}
					onRemove={controller.dismissActionNotice}
				>
					{controller.actionNotice.message}
				</Notice>
			)}
			{controller.loadError && (
				<Notice className="minimal-map-admin__locations-notice" status="error" isDismissible={false}>
					{controller.loadError}
				</Notice>
			)}
			{controller.isLoading ? (
				<div className="minimal-map-admin__locations-state minimal-map-admin__locations-state--loading">
					<Spinner />
				</div>
			) : controller.locations.length === 0 ? (
				<LocationsEmptyState />
			) : (
				<LocationsTable controller={controller} />
			)}
			<LocationDialog controller={controller} />
		</>
	);
}
