import { DataViews } from '@wordpress/dataviews/wp';
import type { Action, Field, View, ViewGrid } from '@wordpress/dataviews';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Download, Trash2 } from 'lucide-react';
import type { MarkerRecord } from '../../types';
import MarkerMiniMap from '../../components/MarkerMiniMap';
import type { MarkersController } from './types';

export default function MarkersGrid({ controller }: { controller: MarkersController }) {
	const fields = useMemo<Field<MarkerRecord>[]>(
		() => [
			{
				id: 'title',
				label: __('Title', 'minimal-map'),
				enableHiding: false,
				enableSorting: false,
				filterBy: false,
				enableGlobalSearch: true,
			},
			{
				id: 'map_preview',
				label: __('Preview', 'minimal-map'),
				enableHiding: false,
				enableSorting: false,
				filterBy: false,
				render: ({ item }) => <MarkerMiniMap marker={item} />,
			},
		],
		[]
	);

	const actions = useMemo<Action<MarkerRecord>[]>(
		() => [
			{
				id: 'download',
				label: __('Download', 'minimal-map'),
				isPrimary: true,
				icon: <Download size={18} />,
				callback: (items) => {
					if (items.length === 1) {
						controller.onDownloadMarker(items[0]);
					}
				},
			},
			{
				id: 'delete',
				label: __('Delete', 'minimal-map'),
				isPrimary: false,
				icon: <Trash2 size={18} />,
				callback: (items) => {
					if (items.length === 1) {
						void controller.onDeleteMarker(items[0]);
					}
				},
				isEligible: () => !controller.isRowActionPending,
			},
		],
		[controller]
	);

	return (
		<div className="minimal-map-admin__collections-grid-wrap minimal-map-admin__markers-grid-wrap">
			<DataViews
				actions={actions}
				data={controller.paginatedMarkers}
				fields={fields}
				getItemId={(item: MarkerRecord) => `${item.id}`}
				paginationInfo={{
					totalItems: controller.markers.length,
					totalPages: controller.totalPages,
				}}
				defaultLayouts={{
					grid: {},
				}}
				view={controller.view}
				onChangeView={(nextView: View) => controller.onChangeView(nextView as ViewGrid)}
			>
				<div className="minimal-map-admin__collections-dataviews-header">
					<DataViews.Search />
				</div>
				<DataViews.Layout className="minimal-map-admin__collections-grid-layout" />
				<DataViews.Footer />
			</DataViews>
		</div>
	);
}
