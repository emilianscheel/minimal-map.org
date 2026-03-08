import type { Map } from 'maplibre-gl';
import type { StyleThemeColors, StyleThemeSlot } from '../../types';

export interface StyleThemeManifestEntry {
	layerId: string;
	property: 'background-color' | 'fill-color' | 'fill-outline-color' | 'line-color' | 'text-color' | 'text-halo-color';
}

export const POSITRON_THEME_MANIFEST: Record<StyleThemeSlot, StyleThemeManifestEntry[]> = {
	background: [
		{ layerId: 'background', property: 'background-color' },
		{ layerId: 'road_area_pier', property: 'fill-color' },
		{ layerId: 'road_pier', property: 'line-color' },
	],
	park: [
		{ layerId: 'park', property: 'fill-color' },
	],
	residential: [
		{ layerId: 'landuse_residential', property: 'fill-color' },
	],
	forest: [
		{ layerId: 'landcover_wood', property: 'fill-color' },
	],
	ice: [
		{ layerId: 'landcover_ice_shelf', property: 'fill-color' },
		{ layerId: 'landcover_glacier', property: 'fill-color' },
	],
	water: [
		{ layerId: 'water', property: 'fill-color' },
	],
	waterway: [
		{ layerId: 'waterway', property: 'line-color' },
	],
	building: [
		{ layerId: 'building', property: 'fill-color' },
	],
	buildingOutline: [
		{ layerId: 'building', property: 'fill-outline-color' },
	],
	path: [
		{ layerId: 'highway_path', property: 'line-color' },
	],
	roadMinor: [
		{ layerId: 'highway_minor', property: 'line-color' },
	],
	roadMajorCasing: [
		{ layerId: 'highway_major_casing', property: 'line-color' },
		{ layerId: 'tunnel_motorway_casing', property: 'line-color' },
	],
	roadMajorFill: [
		{ layerId: 'highway_major_inner', property: 'line-color' },
		{ layerId: 'tunnel_motorway_inner', property: 'line-color' },
	],
	motorwayCasing: [
		{ layerId: 'highway_motorway_casing', property: 'line-color' },
		{ layerId: 'highway_motorway_bridge_casing', property: 'line-color' },
	],
	motorwayFill: [
		{ layerId: 'highway_motorway_inner', property: 'line-color' },
		{ layerId: 'highway_motorway_bridge_inner', property: 'line-color' },
	],
	rail: [
		{ layerId: 'railway', property: 'line-color' },
		{ layerId: 'railway_transit', property: 'line-color' },
		{ layerId: 'railway_service', property: 'line-color' },
	],
	railDash: [
		{ layerId: 'railway_dashline', property: 'line-color' },
		{ layerId: 'railway_transit_dashline', property: 'line-color' },
		{ layerId: 'railway_service_dashline', property: 'line-color' },
	],
	boundary: [
		{ layerId: 'boundary_2', property: 'line-color' },
		{ layerId: 'boundary_3', property: 'line-color' },
		{ layerId: 'boundary_disputed', property: 'line-color' },
	],
	aerowayLine: [
		{ layerId: 'aeroway-runway', property: 'line-color' },
		{ layerId: 'aeroway-runway-casing', property: 'line-color' },
		{ layerId: 'aeroway-taxiway', property: 'line-color' },
	],
	aerowayArea: [
		{ layerId: 'aeroway-area', property: 'fill-color' },
	],
	waterLabel: [
		{ layerId: 'water_name_line_label', property: 'text-color' },
		{ layerId: 'water_name_point_label', property: 'text-color' },
		{ layerId: 'waterway_line_label', property: 'text-color' },
	],
	waterLabelHalo: [
		{ layerId: 'water_name_line_label', property: 'text-halo-color' },
		{ layerId: 'water_name_point_label', property: 'text-halo-color' },
		{ layerId: 'waterway_line_label', property: 'text-halo-color' },
	],
	roadLabel: [
		{ layerId: 'highway-name-path', property: 'text-color' },
		{ layerId: 'highway-name-minor', property: 'text-color' },
		{ layerId: 'highway-name-major', property: 'text-color' },
		{ layerId: 'airport', property: 'text-color' },
	],
	roadLabelHalo: [
		{ layerId: 'highway-name-path', property: 'text-halo-color' },
		{ layerId: 'highway-name-minor', property: 'text-halo-color' },
		{ layerId: 'highway-name-major', property: 'text-halo-color' },
		{ layerId: 'airport', property: 'text-halo-color' },
	],
	placeLabel: [
		{ layerId: 'label_city', property: 'text-color' },
		{ layerId: 'label_city_capital', property: 'text-color' },
		{ layerId: 'label_town', property: 'text-color' },
		{ layerId: 'label_village', property: 'text-color' },
		{ layerId: 'label_state', property: 'text-color' },
		{ layerId: 'label_country_1', property: 'text-color' },
		{ layerId: 'label_country_2', property: 'text-color' },
		{ layerId: 'label_country_3', property: 'text-color' },
		{ layerId: 'label_other', property: 'text-color' },
	],
	placeLabelHalo: [
		{ layerId: 'label_city', property: 'text-halo-color' },
		{ layerId: 'label_city_capital', property: 'text-halo-color' },
		{ layerId: 'label_town', property: 'text-halo-color' },
		{ layerId: 'label_village', property: 'text-halo-color' },
		{ layerId: 'label_state', property: 'text-halo-color' },
		{ layerId: 'label_country_1', property: 'text-halo-color' },
		{ layerId: 'label_country_2', property: 'text-halo-color' },
		{ layerId: 'label_country_3', property: 'text-halo-color' },
		{ layerId: 'label_other', property: 'text-halo-color' },
	],
};

export function applyStyleTheme(
	map: Map,
	themeColors: Partial<StyleThemeColors>,
	basePreset = 'positron'
) {
	if (basePreset !== 'positron' || !map.isStyleLoaded()) {
		return;
	}

	Object.entries(themeColors).forEach(([ slot, color ]) => {
		const manifestEntries = POSITRON_THEME_MANIFEST[ slot as StyleThemeSlot ];
		if (!manifestEntries) {
			return;
		}

		manifestEntries.forEach(({ layerId, property }) => {
			try {
				if (map.getLayer(layerId)) {
					map.setPaintProperty(layerId, property, color);
				}
			} catch (e) {
				// Silently fail if property is not applicable to the current layer type
				// or if style is still in a transitional state.
			}
		});
	});
}
