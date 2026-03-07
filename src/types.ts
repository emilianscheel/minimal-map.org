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
}

export interface NormalizedMapConfig extends MapDefaults {
	heightCssValue: string;
	styleUrl: string;
	fallbackMessage: string;
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
}

export interface LocationRecord extends LocationMeta {
	id: number;
	title: string;
}

export interface LocationFormState extends LocationMeta {
	title: string;
}

export type LocationDialogStep = 'details' | 'address';
