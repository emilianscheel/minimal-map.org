export type HeightUnit = 'px' | 'em' | 'rem' | '%' | 'vh' | 'vw';

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
	height: number;
	heightUnit: HeightUnit;
	stylePreset: string;
	showZoomControls: boolean;
}

export interface MapMessages {
	fallback?: string;
}

export interface MapRuntimeConfig {
	defaults?: Partial<MapDefaults>;
	heightUnits?: string[];
	stylePresets?: StylePresets;
	messages?: MapMessages;
	onMapClick?: (coordinates: MapCoordinates) => void;
}

export interface RawMapConfig {
	centerLat?: number | string;
	centerLng?: number | string;
	zoom?: number | string;
	height?: number | string;
	heightUnit?: string;
	stylePreset?: string;
	styleUrl?: string;
	showZoomControls?: boolean;
	fallbackMessage?: string;
	markerLat?: number | string | null;
	markerLng?: number | string | null;
	markerClassName?: string;
	markerOffsetY?: number | string;
	centerOffsetY?: number | string;
	interactive?: boolean;
	showAttribution?: boolean;
}

export interface NormalizedMapConfig extends MapDefaults {
	heightCssValue: string;
	styleUrl: string;
	fallbackMessage: string;
	markerLat: number | null;
	markerLng: number | null;
	markerClassName: string;
	markerOffsetY: number;
	centerOffsetY: number;
	interactive: boolean;
	showAttribution: boolean;
}

export interface MinimalMapInstance {
	destroy: () => void;
	update: (rawConfig?: RawMapConfig) => void;
}

export type AdminSectionView =
	| 'dashboard'
	| 'locations'
	| 'categories'
	| 'tags'
	| 'markers'
	| 'styles'
	| 'import'
	| 'export'
	| 'settings';

export interface AdminSection {
	view: AdminSectionView;
	title: string;
	description: string;
	url: string;
}

export interface AdminStats {
	locations: number;
	categories: number;
	markers: number;
	tags: number;
}

export interface LocationsAdminConfig {
	nonce: string;
	restBase: string;
	restPath: string;
	geocodePath: string;
}

export interface LocationRestResponse {
	id: number;
	title?: {
		raw?: string;
		rendered?: string;
	};
	meta?: Partial<LocationMeta>;
}

export interface AdminAppConfig {
	currentView: AdminSectionView;
	sections: AdminSection[];
	stats: AdminStats;
	mapConfig: MapRuntimeConfig;
	locationsConfig: LocationsAdminConfig;
}

export type DashboardCardView = Extract<
	AdminSectionView,
	'locations' | 'categories' | 'markers' | 'tags'
>;

export interface MapBlockAttributes {
	centerLat: number;
	centerLng: number;
	zoom: number;
	height: number;
	heightUnit: HeightUnit;
	stylePreset: string;
	showZoomControls: boolean;
}

export interface WordPressZoomControlLabels {
	zoomIn?: string;
	zoomOut?: string;
}

export interface WordPressZoomControls {
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

export interface LocationFormState extends LocationMeta {
	title: string;
}

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
