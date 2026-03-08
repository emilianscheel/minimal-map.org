export type HeightUnit = 'px' | 'em' | 'rem' | '%' | 'vh' | 'vw';
export type ZoomControlsPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
export type ZoomControlIcon = 'plus' | 'plus-circle' | 'plus-circle-filled' | 'line-solid' | 'separator' | 'close-small';

export interface BoxValue {
	top?: string;
	right?: string;
	bottom?: string;
	left?: string;
}

export interface StylePresetDefinition {
	label: string;
	style_url: string;
}

export type StylePresets = Record<string, StylePresetDefinition>;

export interface StyleOption {
	label: string;
	value: string;
}

export interface MapDefaults {
	centerLat: number;
	centerLng: number;
	zoom: number;
	collectionId: number;
	height: number;
	heightUnit: HeightUnit;
	stylePreset: string;
	styleThemeSlug: string;
	showZoomControls: boolean;
	allowSearch: boolean;
	zoomControlsPosition: ZoomControlsPosition;
	zoomControlsPadding: BoxValue;
	zoomControlsOuterMargin: BoxValue;
	zoomControlsBackgroundColor: string;
	zoomControlsIconColor: string;
	zoomControlsBorderRadius: string;
	zoomControlsBorderColor: string;
	zoomControlsBorderWidth: string;
	zoomControlsPlusIcon: ZoomControlIcon;
	zoomControlsMinusIcon: ZoomControlIcon;
}

export interface MapMessages {
	fallback?: string;
}

export interface MapLocationPoint {
	id?: number;
	title?: string;
	lat: number;
	lng: number;
	telephone?: string;
	email?: string;
	website?: string;
	street?: string;
	house_number?: string;
	postal_code?: string;
	city?: string;
	state?: string;
	country?: string;
}

export interface MapCollectionOption {
	id: number;
	title: string;
	locations: MapLocationPoint[];
}

export interface MapRuntimeConfig {
	defaults?: Partial<MapDefaults>;
	heightUnits?: string[];
	stylePresets?: StylePresets;
	styleThemes?: StyleThemeRecord[];
	locations?: MapLocationPoint[];
	collections?: MapCollectionOption[];
	messages?: MapMessages;
	onMapClick?: (coordinates: MapCoordinates) => void;
}

export interface RawMapConfig {
	centerLat?: number | string;
	centerLng?: number | string;
	zoom?: number | string;
	collectionId?: number | string;
	height?: number | string;
	heightUnit?: string;
	stylePreset?: string;
	styleUrl?: string;
	styleTheme?: Partial<StyleThemeColors>;
	styleThemeSlug?: string;
	showZoomControls?: boolean;
	allowSearch?: boolean;
	zoomControlsPosition?: string;
	zoomControlsPadding?: BoxValue | null;
	zoomControlsOuterMargin?: BoxValue | null;
	zoomControlsBackgroundColor?: string;
	zoomControlsIconColor?: string;
	zoomControlsBorderRadius?: string | BoxValue | null;
	zoomControlsBorderColor?: string;
	zoomControlsBorderWidth?: string;
	zoomControlsPlusIcon?: string;
	zoomControlsMinusIcon?: string;
	fallbackMessage?: string;
	markerLat?: number | string | null;
	markerLng?: number | string | null;
	markerContent?: string | null;
	markerClassName?: string;
	markerOffsetY?: number | string;
	centerOffsetY?: number | string;
	locations?: MapLocationPoint[] | null;
	interactive?: boolean;
	showAttribution?: boolean;
}

export interface NormalizedMapConfig extends MapDefaults {
	heightCssValue: string;
	styleUrl: string;
	styleTheme: Partial<StyleThemeColors>;
	fallbackMessage: string;
	zoomControlsPadding: Required<BoxValue>;
	zoomControlsOuterMargin: Required<BoxValue>;
	markerLat: number | null;
	markerLng: number | null;
	markerContent: string | null;
	markerClassName: string;
	markerOffsetY: number;
	centerOffsetY: number;
	locations: MapLocationPoint[];
	interactive: boolean;
	showAttribution: boolean;
	allowSearch: boolean;
}

export interface MinimalMapInstance {
	destroy: () => void;
	update: (rawConfig?: RawMapConfig) => void;
}

export type AdminSectionView =
	| 'dashboard'
	| 'locations'
	| 'collections'
	| 'tags'
	| 'markers'
	| 'styles';

export interface AdminSection {
	view: AdminSectionView;
	title: string;
	description: string;
	url: string;
}

export interface AdminStats {
	locations: number;
	collections: number;
	markers: number;
	tags: number;
}

export interface LocationsAdminConfig {
	nonce: string;
	restBase: string;
	restPath: string;
	geocodePath: string;
}

export interface CollectionsAdminConfig {
	nonce: string;
	restBase: string;
	restPath: string;
}

export interface MarkersAdminConfig {
	nonce: string;
	restBase: string;
	restPath: string;
}

export interface StylesAdminConfig {
	nonce: string;
	restBase: string;
	restPath: string;
}

export interface LocationRestResponse {
	id: number;
	title?: {
		raw?: string;
		rendered?: string;
	};
	meta?: Partial<LocationMeta>;
}

export interface CollectionMeta {
	location_ids: number[];
}

export interface CollectionRestResponse {
	id: number;
	title?: {
		raw?: string;
		rendered?: string;
	};
	meta?: Partial<CollectionMeta>;
}

export interface AdminAppConfig {
	currentView: AdminSectionView;
	sections: AdminSection[];
	stats: AdminStats;
	mapConfig: MapRuntimeConfig;
	locationsConfig: LocationsAdminConfig;
	collectionsConfig: CollectionsAdminConfig;
	markersConfig: MarkersAdminConfig;
	stylesConfig: StylesAdminConfig;
}

export type DashboardCardView = Extract<
	AdminSectionView,
	'locations' | 'collections' | 'markers' | 'tags'
>;

export interface MapBlockAttributes {
	centerLat: number;
	centerLng: number;
	zoom: number;
	collectionId: number;
	height: number;
	heightUnit: HeightUnit;
	stylePreset: string;
	styleThemeSlug: string;
	showZoomControls: boolean;
	allowSearch: boolean;
	zoomControlsPosition: ZoomControlsPosition;
	zoomControlsPadding: BoxValue;
	zoomControlsOuterMargin: BoxValue;
	zoomControlsBackgroundColor: string;
	zoomControlsIconColor: string;
	zoomControlsBorderRadius: string;
	zoomControlsBorderColor: string;
	zoomControlsBorderWidth: string;
	zoomControlsPlusIcon: ZoomControlIcon;
	zoomControlsMinusIcon: ZoomControlIcon;
}

export interface WordPressZoomControls {
	destroy: () => void;
}

export interface WordPressSearchControl {
	destroy: () => void;
	update: (config: NormalizedMapConfig, selectedId?: number) => void;
}

export interface WordPressAttributionControl {
	destroy: () => void;
}

export interface LocationMeta {
	telephone: string;
	email: string;
	website: string;
	street: string;
	house_number: string;
	postal_code: string;
	city: string;
	state: string;
	country: string;
	latitude: string;
	longitude: string;
}

export interface LocationRecord extends LocationMeta {
	id: number;
	title: string;
}

export interface CollectionRecord extends CollectionMeta {
	id: number;
	title: string;
}

export interface MarkerRecord {
	id: number;
	title: string;
	content: string;
}

export interface CollectionFormState {
	title: string;
}

export type CollectionFormMode = 'create' | 'edit';

export interface LocationFormState extends LocationMeta {
	title: string;
}

export type LocationFormMode = 'create' | 'edit';

export type LocationDialogStep = 'details' | 'address' | 'map';

export interface FieldErrors {
	title?: string;
	email?: string;
	website?: string;
	street?: string;
	house_number?: string;
	postal_code?: string;
	city?: string;
	country?: string;
}

export interface MapCoordinates {
	lat: number;
	lng: number;
}

export interface GeocodeResponseSuccess {
	success: true;
	label: string;
	lat: number;
	lng: number;
}

export interface GeocodeResponseFailure {
	success: false;
	message: string;
}

export type GeocodeResponse = GeocodeResponseSuccess | GeocodeResponseFailure;

export type StyleThemeSlot =
	| 'background'
	| 'park'
	| 'residential'
	| 'forest'
	| 'ice'
	| 'water'
	| 'waterway'
	| 'building'
	| 'buildingOutline'
	| 'path'
	| 'roadMinor'
	| 'roadMajorCasing'
	| 'roadMajorFill'
	| 'motorwayCasing'
	| 'motorwayFill'
	| 'rail'
	| 'railDash'
	| 'boundary'
	| 'aerowayLine'
	| 'aerowayArea'
	| 'waterLabel'
	| 'waterLabelHalo'
	| 'roadLabel'
	| 'roadLabelHalo'
	| 'placeLabel'
	| 'placeLabelHalo';

export type StyleThemeColors = Record<StyleThemeSlot, string>;

export interface StyleThemeRecord {
	slug: string;
	label: string;
	basePreset: string;
	colors: StyleThemeColors;
}
