import { Button, Modal, SearchControl } from '@wordpress/components';
import { DataViews } from '@wordpress/dataviews/wp';
import type { Action, Field, View, ViewTable } from '@wordpress/dataviews';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Plus, Trash2 } from 'lucide-react';
import type { LocationRecord } from '../../types';
import { formatLocationAddressLines } from '../../lib/locations/formatLocationAddressLines';
import type { CollectionsController } from './types';

function useLocationFields(): Field<LocationRecord>[] {
	return useMemo<Field<LocationRecord>[]>(
		() => [
			{
				id: 'title',
				label: __('Title', 'minimal-map'),
				enableHiding: false,
				enableSorting: false,
				filterBy: false,
			},
			{
				id: 'address',
				label: __('Address', 'minimal-map'),
				enableHiding: false,
				enableSorting: false,
				filterBy: false,
				render: ({ item }) => formatLocationAddressLines(item).join(', '),
			},
		],
		[]
	);
}

function AvailableLocationsTable({ controller }: { controller: CollectionsController }) {
	const fields = useLocationFields();
	const actions = useMemo<Action<LocationRecord>[]>(
		() => [
			{
				id: 'add-location',
				label: __('Add', 'minimal-map'),
				icon: <Plus size={16} strokeWidth={2} />,
				context: 'single',
				supportsBulk: false,
				callback: (items) => {
					if (!items[0]) {
						return;
					}

					controller.onAddLocationToAssignment(items[0]);
				},
			},
		],
		[controller]
	);

	return (
		<DataViews
			actions={actions}
			data={controller.availableLocations}
			defaultLayouts={{ table: {} }}
			fields={fields}
			getItemId={(item: LocationRecord) => `${item.id}`}
			paginationInfo={{
				totalItems: controller.filteredAvailableLocationsCount,
				totalPages: Math.max(1, Math.ceil(controller.filteredAvailableLocationsCount / (controller.availableLocationsView.perPage ?? 5))),
			}}
			view={controller.availableLocationsView}
			onChangeView={(nextView: View) => controller.onChangeAvailableLocationsView(nextView as ViewTable)}
		>
			<DataViews.Layout className="minimal-map-admin__collections-assignment-table" />
			<DataViews.Footer />
		</DataViews>
	);
}

function SelectedLocationsTable({ controller }: { controller: CollectionsController }) {
	const fields = useLocationFields();
	const actions = useMemo<Action<LocationRecord>[]>(
		() => [
			{
				id: 'remove-location',
				label: __('Remove', 'minimal-map'),
				icon: <Trash2 size={16} strokeWidth={2} />,
				context: 'single',
				supportsBulk: false,
				callback: (items) => {
					if (!items[0]) {
						return;
					}

					controller.onRemoveLocationFromAssignment(items[0]);
				},
			},
		],
		[controller]
	);

	return (
		<DataViews
			actions={actions}
			data={controller.selectedLocations}
			defaultLayouts={{ table: {} }}
			fields={fields}
			getItemId={(item: LocationRecord) => `${item.id}`}
			paginationInfo={{
				totalItems: controller.filteredAssignedLocationsCount,
				totalPages: Math.max(1, Math.ceil(controller.filteredAssignedLocationsCount / (controller.selectedLocationsView.perPage ?? 5))),
			}}
			view={controller.selectedLocationsView}
			onChangeView={(nextView: View) => controller.onChangeSelectedLocationsView(nextView as ViewTable)}
		>
			<DataViews.Layout className="minimal-map-admin__collections-assignment-table" />
			<DataViews.Footer />
		</DataViews>
	);
}

export default function CollectionAssignmentModal({ controller }: { controller: CollectionsController }) {
	if (!controller.isAssignmentModalOpen || !controller.selectedAssignmentCollection) {
		return null;
	}

	return (
		<Modal
			className="minimal-map-admin__collection-assignment-modal"
			contentLabel={__('Assign locations', 'minimal-map')}
			onRequestClose={controller.onCloseAssignmentModal}
			shouldCloseOnClickOutside={!controller.isAssignmentSaving}
			shouldCloseOnEsc={!controller.isAssignmentSaving}
			title={controller.selectedAssignmentCollection.title}
		>
			<div className="minimal-map-admin__collection-assignment-dialog">
				<SearchControl
					__nextHasNoMarginBottom
					label={__('Search locations', 'minimal-map')}
					value={controller.assignmentSearch}
					onChange={controller.onChangeAssignmentSearch}
				/>
				<div className="minimal-map-admin__collection-assignment-sections">
					<section className="minimal-map-admin__collection-assignment-section">
						<div className="minimal-map-admin__collection-assignment-header">
							<h3>{__('Available locations', 'minimal-map')}</h3>
							<span>{controller.filteredAvailableLocationsCount}</span>
						</div>
						<AvailableLocationsTable controller={controller} />
					</section>
					<section className="minimal-map-admin__collection-assignment-section">
						<div className="minimal-map-admin__collection-assignment-header">
							<h3>{__('Selected locations', 'minimal-map')}</h3>
							<span>{controller.filteredAssignedLocationsCount}</span>
						</div>
						<SelectedLocationsTable controller={controller} />
					</section>
				</div>
				<div className="minimal-map-admin__collection-assignment-actions">
					<Button
						__next40pxDefaultSize
						variant="tertiary"
						onClick={controller.onCloseAssignmentModal}
						disabled={controller.isAssignmentSaving}
					>
						{__('Cancel', 'minimal-map')}
					</Button>
					<Button
						__next40pxDefaultSize
						variant="primary"
						onClick={() => void controller.onSaveAssignments()}
						isBusy={controller.isAssignmentSaving}
						disabled={controller.isAssignmentSaving}
					>
						{__('Save locations', 'minimal-map')}
					</Button>
				</div>
			</div>
		</Modal>
	);
}
