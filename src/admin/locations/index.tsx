import { DropZone, Notice, Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import AssignToCollectionModal from './AssignToCollectionModal';
import AssignTagsModal from './AssignTagsModal';
import LocationDialog from './LocationDialog';
import LocationsEmptyState from './LocationsEmptyState';
import LocationsTable from './LocationsTable';
import RemoveCollectionAssignmentModal from './RemoveCollectionAssignmentModal';
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
			<div className="minimal-map-admin__locations-content">
				<DropZone
					onFilesDrop={(files) => {
						const file = files[0];
						if (file) {
							void controller.onImportLocations(file);
						}
					}}
					label={__('Drop CSV file here to import locations', 'minimal-map')}
				/>
				{controller.isLoading ? (
					<div className="minimal-map-admin__locations-state minimal-map-admin__locations-state--loading">
						<Spinner />
					</div>
				) : controller.locations.length === 0 ? (
					<LocationsEmptyState controller={controller} />
				) : (
					<LocationsTable controller={controller} />
				)}
			</div>
			<LocationDialog controller={controller} />
			<AssignToCollectionModal controller={controller} />
			<AssignTagsModal controller={controller} />
			<RemoveCollectionAssignmentModal controller={controller} />
		</>
	);
}
