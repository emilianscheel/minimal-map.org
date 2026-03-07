import { Button } from '@wordpress/components';
import { DataViews } from '@wordpress/dataviews/wp';
import type { Action, Field, View, ViewGrid } from '@wordpress/dataviews';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Pencil, Trash2 } from 'lucide-react';
import type { MouseEvent } from 'react';
import CollectionMiniMap from '../../components/CollectionMiniMap';
import type { CollectionRecord } from '../../types';
import DeleteCollectionActionModal from './DeleteCollectionActionModal';
import type { CollectionsController } from './types';

function useCollectionFields(controller: CollectionsController): Field<CollectionRecord>[] {
	return useMemo<Field<CollectionRecord>[]>(
		() => [
			{
				id: 'map_preview',
				label: __('Map preview', 'minimal-map'),
				type: 'media',
				enableHiding: false,
				enableSorting: false,
				filterBy: false,
				render: ({ item }) => (
					<CollectionMiniMap collection={item} locations={controller.locations} />
				),
			},
			{
				id: 'title',
				label: __('Title', 'minimal-map'),
				enableHiding: false,
				enableSorting: false,
				filterBy: false,
			},
			{
				id: 'add_locations',
				label: __('Locations', 'minimal-map'),
				enableHiding: false,
				enableSorting: false,
				filterBy: false,
				render: ({ item }) => (
					<Button
						variant="secondary"
						className="minimal-map-admin__collection-grid-button"
						onClick={(event: MouseEvent<HTMLButtonElement>) => {
							event.preventDefault();
							event.stopPropagation();
							controller.onOpenAssignmentModal(item);
						}}
					>
						{__('Add locations', 'minimal-map')}
					</Button>
				),
			},
		],
		[controller]
	);
}

function useCollectionActions(controller: CollectionsController): Action<CollectionRecord>[] {
	return useMemo<Action<CollectionRecord>[]>(
		() => [
			{
				id: 'edit-collection',
				label: __('Edit', 'minimal-map'),
				icon: <Pencil size={16} strokeWidth={2} />,
				context: 'single',
				disabled: controller.isRowActionPending,
				supportsBulk: false,
				callback: (items) => {
					if (!items[0]) {
						return;
					}

					controller.onEditCollection(items[0]);
				},
			},
			{
				id: 'delete-collection',
				label: __('Delete', 'minimal-map'),
				icon: <Trash2 size={16} strokeWidth={2} />,
				context: 'single',
				disabled: controller.isRowActionPending,
				supportsBulk: false,
				modalHeader: __('Delete collection', 'minimal-map'),
				RenderModal: ({ items, closeModal, onActionPerformed }) => {
					if (!items[0]) {
						return <></>;
					}

					return (
						<DeleteCollectionActionModal
							collection={items[0]}
							onDelete={controller.onDeleteCollection}
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

export default function CollectionsGrid({ controller }: { controller: CollectionsController }) {
	const actions = useCollectionActions(controller);
	const fields = useCollectionFields(controller);

	return (
		<div className="minimal-map-admin__collections-grid-wrap">
			<DataViews
				actions={actions}
				data={controller.paginatedCollections}
				defaultLayouts={{ grid: {} }}
				fields={fields}
				getItemId={(item: CollectionRecord) => `${item.id}`}
				paginationInfo={{
					totalItems: controller.collections.length,
					totalPages: controller.totalPages,
				}}
				view={controller.view}
				onChangeView={(nextView: View) => controller.onChangeView(nextView as ViewGrid)}
			>
				<DataViews.Layout className="minimal-map-admin__collections-grid-layout" />
				<DataViews.Footer />
			</DataViews>
		</div>
	);
}
