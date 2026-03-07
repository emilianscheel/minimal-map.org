import type { LocationFormState } from '../../types';
import type { ViewTable } from '@wordpress/dataviews';

export const DEFAULT_FORM_STATE: LocationFormState = {
	title: '',
	telephone: '',
	email: '',
	website: '',
	street: '',
	house_number: '',
	postal_code: '',
	city: '',
	state: '',
	country: '',
	latitude: '',
	longitude: '',
};

export const DEFAULT_VIEW: ViewTable = {
	type: 'table',
	page: 1,
	perPage: 10,
	fields: [
		'map_preview',
		'title',
		'telephone',
		'email',
		'website',
		'address',
	],
	layout: {
		enableMoving: false,
	},
};
