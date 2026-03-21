import type { AnalyticsSummary } from '../../types';
import type { ViewTable } from '@wordpress/dataviews';

export const ANALYTICS_TABLE_PER_PAGE = 9;
export const ANALYTICS_SERIES_DAYS = 30;

export const EMPTY_ANALYTICS_SUMMARY: AnalyticsSummary = {
	totalSearches: 0,
	searchesToday: 0,
	zeroResultSearches: 0,
	averageNearestDistanceMeters: null,
	series: {
		totalSearches: [],
		searchesToday: [],
		zeroResultSearches: [],
		averageNearestDistanceMeters: [],
	},
};

export const DEFAULT_ANALYTICS_VIEW: ViewTable = {
	type: 'table',
	page: 1,
	perPage: ANALYTICS_TABLE_PER_PAGE,
	titleField: 'query_text',
	fields: [
		'query_type',
		'result_count',
		'nearest_distance_meters',
		'occurred_at_gmt',
	],
	layout: {
		enableMoving: false,
	},
};
