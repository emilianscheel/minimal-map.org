import { Button } from '@wordpress/components';
import { DataViews } from '@wordpress/dataviews/wp';
import type { Action, Field, View, ViewTable } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';
import { Copy, Layers3, LocateFixed, Pencil, Tags, Trash2 } from 'lucide-react';
import LocationMiniMap from '../../components/LocationMiniMap';
import TagBadge from '../../components/TagBadge';
import type { LocationRecord } from '../../types';
import { formatLocationAddressLines } from '../../lib/locations/formatLocationAddressLines';
import DeleteLocationActionModal from './DeleteLocationActionModal';
import type { LocationsController } from './types';

function CollectionBadge({ label }: { label: string }) {
	return (
		<span className="components-badge is-default">
			<span className="components-badge__flex-wrapper">
				<span className="components-badge__content">{label}</span>
			</span>
		</span>
	);
}

function useLocationFields(controller: LocationsController): Field<LocationRecord>[] {
	return useMemo<Field<LocationRecord>[]>(
		() => [
			{
				id: 'map_preview',
				label: __('Map preview', 'minimal-map'),
				header: (
					<span
						className="minimal-map-admin__location-mini-map-header"
						aria-hidden="true"
					/>
				),
				enableHiding: false,
				enableSorting: false,
				filterBy: false,
				render: ({ item }) => <LocationMiniMap location={item} theme={controller.activeTheme} />,
			},
			{
				id: 'title',
				label: __('Title', 'minimal-map'),
				enableHiding: false,
				enableSorting: false,
				filterBy: false,
				enableGlobalSearch: true,
			},
			{
				id: 'contact',
				label: __('Contact', 'minimal-map'),
				enableHiding: true,
				enableSorting: false,
				filterBy: false,
				render: ({ item }) => {
					return (
						<div className="minimal-map-admin__location-contact">
							{item.telephone && (
								<span className="minimal-map-admin__location-contact-item">
									<a href={`tel:${item.telephone}`}>{item.telephone}</a>
								</span>
							)}
							{item.email && (
								<span className="minimal-map-admin__location-contact-item">
									<a href={`mailto:${item.email}`}>{item.email}</a>
								</span>
							)}
							{item.website && (
								<span className="minimal-map-admin__location-contact-item">
									<a href={item.website} rel="noreferrer" target="_blank">
										{item.website.replace(/^https?:\/\/(www\.)?/, '')}
									</a>
								</span>
							)}
						</div>
					);
				},
			},
			{
				id: 'address',
				label: __('Address', 'minimal-map'),
				enableHiding: false,
				enableSorting: false,
				filterBy: false,
				render: ({ item }) => {
					const lines = formatLocationAddressLines(item);

					if (lines.length === 0) {
						return null;
					}

					return (
						<div className="minimal-map-admin__location-address">
							{lines.map((line) => (
								<span key={line} className="minimal-map-admin__location-address-line">
									{line}
								</span>
							))}
						</div>
					);
				},
			},
			{
				id: 'collections',
				label: __('Collections', 'minimal-map'),
				enableHiding: false,
				enableSorting: false,
				filterBy: false,
				render: ({ item }) => {
					const collections = controller.getCollectionsForLocation(item.id);

					if (collections.length === 0) {
						return null;
					}

					return (
						<div className="minimal-map-admin__location-collections">
							{collections.map((collection) => (
								<button
									key={collection.id}
									type="button"
									className="minimal-map-admin__location-collection-trigger"
									onClick={() =>
										controller.onOpenRemoveCollectionAssignmentModal(item, collection)
									}
								>
									<CollectionBadge label={collection.title} />
								</button>
							))}
						</div>
					);
				},
			},
			{
				id: 'tags',
				label: __('Tags', 'minimal-map'),
				enableHiding: false,
				enableSorting: false,
				filterBy: false,
				render: ({ item }) => {
					const tags = controller.getTagsForLocation(item.id);

					if (tags.length === 0) {
						return null;
					}

					return (
						<div className="minimal-map-admin__location-collections">
							{tags.map((tag) => (
								<button
									key={tag.id}
									type="button"
									className="minimal-map-admin__location-collection-trigger"
									onClick={() => controller.onOpenAssignTagsModal(item)}
								>
									<TagBadge tag={tag} />
								</button>
							))}
						</div>
					);
				},
			},
		],
		[controller]
	);
}

function useLocationActions(controller: LocationsController): Action<LocationRecord>[] {
	return useMemo<Action<LocationRecord>[]>(
		() => [
			{
				id: 'duplicate-location',
				label: __('Duplicate', 'minimal-map'),
				icon: <Copy size={16} strokeWidth={2} />,
				context: 'single',
				disabled: controller.isRowActionPending,
				supportsBulk: false,
				callback: (items) => {
					if (!items[0]) {
						return;
					}

					void controller.onDuplicateLocation(items[0]).catch(() => {});
				},
			},
			{
				id: 'edit-location',
				label: __('Edit', 'minimal-map'),
				icon: <Pencil size={16} strokeWidth={2} />,
				context: 'single',
				disabled: controller.isRowActionPending,
				supportsBulk: false,
				callback: (items) => {
					if (!items[0]) {
						return;
					}

					controller.onEditLocation(items[0]);
				},
			},
			{
				id: 'retrieve-location',
				label: __('Retrieve location', 'minimal-map'),
				icon: <LocateFixed size={16} strokeWidth={2} />,
				context: 'single',
				disabled: controller.isRowActionPending,
				supportsBulk: false,
				callback: (items) => {
					if (!items[0]) {
						return;
					}

					void controller.onRetrieveLocation(items[0]).catch(() => {});
				},
			},
			{
				id: 'assign-location-to-collection',
				label: __('Assign to Collection', 'minimal-map'),
				icon: <Layers3 size={16} strokeWidth={2} />,
				context: 'single',
				disabled: controller.isRowActionPending || controller.isAssignmentSaving,
				supportsBulk: false,
				callback: (items) => {
					if (!items[0]) {
						return;
					}

					controller.onOpenAssignToCollectionModal(items[0]);
				},
			},
			{
				id: 'assign-tags',
				label: __('Assign Tags', 'minimal-map'),
				icon: <Tags size={16} strokeWidth={2} />,
				context: 'single',
				disabled: controller.isRowActionPending || controller.isAssignmentSaving,
				supportsBulk: false,
				callback: (items) => {
					if (!items[0]) {
						return;
					}

					controller.onOpenAssignTagsModal(items[0]);
				},
			},
			{
				id: 'delete-location',
				label: __('Delete', 'minimal-map'),
				icon: <Trash2 size={16} strokeWidth={2} />,
				isDestructive: true,
				disabled: controller.isRowActionPending,
				supportsBulk: true,
				modalHeader: (items) =>
					items.length === 1
						? __('Delete location', 'minimal-map')
						: __(`Delete ${items.length} locations`, 'minimal-map'),
				RenderModal: ({ items, closeModal, onActionPerformed }) => {
					return (
						<DeleteLocationActionModal
							items={items}
							onDelete={controller.onDeleteLocation}
							onDeleteBulk={controller.onDeleteLocations}
							closeModal={closeModal}
							onActionPerformed={onActionPerformed}
						/>
					);
				},
			},
		],
		[controller]
	);
}

export default function LocationsTable({ controller }: { controller: LocationsController }) {
	const fields = useLocationFields(controller);
	const actions = useLocationActions(controller);

	return (
		<div className="minimal-map-admin__locations-table-wrap">
			<DataViews
				actions={actions}
				data={controller.paginatedLocations}
				defaultLayouts={{ table: {} }}
				fields={fields}
				getItemId={(item: LocationRecord) => `${item.id}`}
				paginationInfo={{
					totalItems: controller.locations.length,
					totalPages: controller.totalPages,
				}}
				selection={controller.selection}
				view={controller.view}
				onChangeSelection={controller.onChangeSelection}
				onChangeView={(nextView: View) => controller.onChangeView(nextView as ViewTable)}
			>
				<div className="minimal-map-admin__locations-dataviews-header">
					<DataViews.Search />
				</div>
				<DataViews.Layout className="minimal-map-admin__locations-dataviews-layout" />
				<DataViews.Footer />
			</DataViews>
		</div>
	);
}
