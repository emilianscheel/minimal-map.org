import type { ViewGrid, ViewPickerTable } from '@wordpress/dataviews';
import type { CollectionFormState } from '../../types';

export const DEFAULT_FORM_STATE: CollectionFormState = {
	title: '',
};

export const DEFAULT_GRID_VIEW: ViewGrid = {
	type: 'grid',
	page: 1,
	perPage: 9,
	titleField: 'title',
	mediaField: 'map_preview',
	fields: [ 'add_locations' ],
	showMedia: true,
	showTitle: true,
	showDescription: false,
	layout: {
		previewSize: 280,
		badgeFields: [],
	},
};

export const DEFAULT_ASSIGNMENT_VIEW: ViewPickerTable = {
	type: 'pickerTable',
	page: 1,
	perPage: 5,
	fields: [ 'title', 'address' ],
	layout: {
		enableMoving: false,
	},
};
