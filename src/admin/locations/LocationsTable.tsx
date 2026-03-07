import { DataViews } from '@wordpress/dataviews/wp';
import type { Field, View, ViewTable } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';
import LocationMiniMap from '../../components/LocationMiniMap';
import type { LocationRecord } from '../../types';
import type { LocationsController } from './types';

function useLocationFields(): Field<LocationRecord>[] {
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
				render: ({ item }) => <LocationMiniMap location={item} />,
			},
			{
				id: 'title',
				label: __('Title', 'minimal-map'),
				enableHiding: false,
				enableSorting: false,
				filterBy: false,
			},
			{
				id: 'telephone',
				label: __('Telephone', 'minimal-map'),
				enableHiding: false,
				enableSorting: false,
				filterBy: false,
			},
			{
				id: 'email',
				label: __('Email address', 'minimal-map'),
				enableHiding: false,
				enableSorting: false,
				filterBy: false,
				render: ({ item }) => {
					if (!item.email) {
						return null;
					}

					return <a href={`mailto:${item.email}`}>{item.email}</a>;
				},
			},
			{
				id: 'website',
				label: __('Website', 'minimal-map'),
				enableHiding: false,
				enableSorting: false,
				filterBy: false,
				render: ({ item }) => {
					if (!item.website) {
						return null;
					}

					return (
						<a href={item.website} rel="noreferrer" target="_blank">
							{item.website}
						</a>
					);
				},
			},
			{
				id: 'street',
				label: __('Street', 'minimal-map'),
				enableHiding: false,
				enableSorting: false,
				filterBy: false,
			},
			{
				id: 'house_number',
				label: __('House number', 'minimal-map'),
				enableHiding: false,
				enableSorting: false,
				filterBy: false,
			},
			{
				id: 'postal_code',
				label: __('Postal code', 'minimal-map'),
				enableHiding: false,
				enableSorting: false,
				filterBy: false,
			},
			{
				id: 'city',
				label: __('City', 'minimal-map'),
				enableHiding: false,
				enableSorting: false,
				filterBy: false,
			},
			{
				id: 'state',
				label: __('State', 'minimal-map'),
				enableHiding: false,
				enableSorting: false,
				filterBy: false,
			},
			{
				id: 'country',
				label: __('Country', 'minimal-map'),
				enableHiding: false,
				enableSorting: false,
				filterBy: false,
			},
		],
		[]
	);
}

export default function LocationsTable({ controller }: { controller: LocationsController }) {
	const fields = useLocationFields();

	return (
		<div className="minimal-map-admin__locations-table-wrap">
			<DataViews
				data={controller.paginatedLocations}
				defaultLayouts={{ table: {} }}
				fields={fields}
				getItemId={(item: LocationRecord) => `${item.id}`}
				paginationInfo={{
					totalItems: controller.locations.length,
					totalPages: controller.totalPages,
				}}
				view={controller.view}
				onChangeView={(nextView: View) => controller.onChangeView(nextView as ViewTable)}
			>
				<DataViews.Layout className="minimal-map-admin__locations-dataviews-layout" />
				<DataViews.Footer />
			</DataViews>
		</div>
	);
}
