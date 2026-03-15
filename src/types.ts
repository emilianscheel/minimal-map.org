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
	heightMobile?: number;
	heightMobileUnit?: HeightUnit;
	stylePreset: string;
	styleThemeSlug: string;
	showZoomControls: boolean;
	allowSearch: boolean;
	googleMapsNavigation: boolean;
	inMapLocationCard: boolean;
	scrollZoom: boolean;
	mobileTwoFingerZoom: boolean;
	cooperativeGestures: boolean;
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
	searchPanelBackgroundPrimary: string;
	searchPanelBackgroundSecondary: string;
	searchPanelBackgroundHover: string;
	searchPanelForegroundPrimary: string;
	searchPanelForegroundSecondary: string;
	searchPanelOuterMargin: BoxValue;
	searchPanelBorderRadiusInput: string;
	searchPanelBorderRadiusCard: string;
	searchPanelCardGap: string;
	searchPanelWidth: string;
	googleMapsButtonPadding: BoxValue;
	googleMapsButtonBackgroundColor: string;
	googleMapsButtonForegroundColor: string;
	googleMapsButtonBorderRadius: string;
	googleMapsButtonShowIcon: boolean;
	openingHoursOpenColor: string;
	openingHoursClosedColor: string;
	creditsPadding: BoxValue;
	creditsOuterMargin: BoxValue;
	creditsBackgroundColor: string;
	creditsForegroundColor: string;
	creditsBorderRadius: string;
	_isPreview: boolean;
}

export interface MapMessages {
	fallback?: string;
}

export interface MapLocationTag {
	id: number;
	name: string;
	background_color: string;
	foreground_color: string;
}

export interface MapLocationLogo {
	id: number;
	title: string;
	content: string;
}

export interface MapLocationPoint {
	id?: number;
	title?: string;
	lat: number;
	lng: number;
	markerContent?: string;
	tags?: MapLocationTag[];
	logo?: MapLocationLogo | null;
	telephone?: string;
	email?: string;
	website?: string;
	street?: string;
	house_number?: string;
	postal_code?: string;
	city?: string;
	state?: string;
	country?: string;
	opening_hours?: LocationOpeningHours;
	opening_hours_notes?: string;
}

export interface MapLocationSelection {
	location: MapLocationPoint;
	distanceLabel?: string;
}

export interface SelectedLocationPreview {
	locationId: number;
	distanceLabel?: string;
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
	frontendGeocodePath?: string;
	messages?: MapMessages;
	embedBaseUrl?: string;
	previewImageUrl?: string;
	siteTimezone?: string;
	siteLocale?: string;
	onMapClick?: (coordinates: MapCoordinates) => void;
}

export interface RawMapConfig {
	centerLat?: number | string;
	centerLng?: number | string;
	zoom?: number | string;
	collectionId?: number | string;
	height?: number | string;
	heightUnit?: string;
	heightMobile?: number | string | null;
	heightMobileUnit?: string | null;
	stylePreset?: string;
	styleUrl?: string;
	styleTheme?: Partial<StyleThemeColors>;
	styleThemeSlug?: string;
	showZoomControls?: boolean;
	allowSearch?: boolean;
	googleMapsNavigation?: boolean;
	inMapLocationCard?: boolean;
	scrollZoom?: boolean;
	mobileTwoFingerZoom?: boolean;
	cooperativeGestures?: boolean;
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
	searchPanelBackgroundPrimary?: string;
	searchPanelBackgroundSecondary?: string;
	searchPanelBackgroundHover?: string;
	searchPanelForegroundPrimary?: string;
	searchPanelForegroundSecondary?: string;
	searchPanelOuterMargin?: BoxValue | null;
	searchPanelBorderRadiusInput?: string | BoxValue | null;
	searchPanelBorderRadiusCard?: string | BoxValue | null;
	searchPanelCardGap?: string;
	searchPanelWidth?: string;
	googleMapsButtonPadding?: BoxValue | null;
	googleMapsButtonBackgroundColor?: string;
	googleMapsButtonForegroundColor?: string;
	googleMapsButtonBorderRadius?: string | BoxValue | null;
	googleMapsButtonShowIcon?: boolean;
	openingHoursOpenColor?: string;
	openingHoursClosedColor?: string;
	creditsPadding?: BoxValue | null;
	creditsOuterMargin?: BoxValue | null;
	creditsBackgroundColor?: string;
	creditsForegroundColor?: string;
	creditsBorderRadius?: string | BoxValue | null;
	_isPreview?: boolean;
	fallbackMessage?: string;
	markerLat?: number | string | null;
	markerLng?: number | string | null;
	markerContent?: string | null;
	markerClassName?: string;
	markerOffsetY?: number | string;
	markerScale?: number | string;
	centerOffsetY?: number | string;
	locations?: MapLocationPoint[] | null;
	interactive?: boolean;
	showAttribution?: boolean;
	siteTimezone?: string;
	siteLocale?: string;
}

export interface NormalizedMapConfig extends MapDefaults {
	heightCssValue: string;
	heightMobileCssValue: string;
	styleUrl: string;
	styleTheme: Partial<StyleThemeColors>;
	fallbackMessage: string;
	zoomControlsPadding: Required<BoxValue>;
	zoomControlsOuterMargin: Required<BoxValue>;
	searchPanelOuterMargin: Required<BoxValue>;
	creditsPadding: Required<BoxValue>;
	creditsOuterMargin: Required<BoxValue>;
	markerLat: number | null;
	markerLng: number | null;
	markerContent: string | null;
	markerClassName: string;
	markerOffsetY: number;
	markerScale: number;
	centerOffsetY: number;
	locations: MapLocationPoint[];
	interactive: boolean;
	scrollZoom: boolean;
	mobileTwoFingerZoom: boolean;
	cooperativeGestures: boolean;
	showAttribution: boolean;
	allowSearch: boolean;
	googleMapsNavigation: boolean;
	inMapLocationCard: boolean;
	siteTimezone: string;
	siteLocale: string;
}

export interface MinimalMapInstance {
	destroy: () => void;
	update: (rawConfig?: RawMapConfig) => void;
}

export type AdminSectionView =
	| 'dashboard'
	| 'locations'
	| 'collections'
	| 'logos'
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
	logos: number;
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

export interface LogosAdminConfig {
	nonce: string;
	restBase: string;
	restPath: string;
}

export interface TagsAdminConfig {
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
	minimal_map_tag?: number[];
}

export interface LogoRestResponse {
	id: number;
	title?: {
		raw?: string;
		rendered?: string;
	};
	content?: {
		raw?: string;
		rendered?: string;
	};
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

export interface TagRestResponse {
	id: number;
	name?: string;
	count?: number;
	meta?: Partial<TagMeta>;
}

export interface AdminAppConfig {
	currentView: AdminSectionView;
	sections: AdminSection[];
	stats: AdminStats;
	mapConfig: MapRuntimeConfig;
	locationsConfig: LocationsAdminConfig;
	collectionsConfig: CollectionsAdminConfig;
	markersConfig: MarkersAdminConfig;
	logosConfig: LogosAdminConfig;
	tagsConfig: TagsAdminConfig;
	stylesConfig: StylesAdminConfig;
}

export type DashboardCardView = Extract<
	AdminSectionView,
	'locations' | 'collections' | 'logos' | 'markers' | 'tags'
>;

export interface MapBlockAttributes {
	centerLat: number;
	centerLng: number;
	zoom: number;
	collectionId: number;
	height: number;
	heightUnit: HeightUnit;
	heightMobile?: number;
	heightMobileUnit?: HeightUnit;
	stylePreset: string;
	styleThemeSlug: string;
	showZoomControls: boolean;
	allowSearch: boolean;
	googleMapsNavigation: boolean;
	inMapLocationCard: boolean;
	scrollZoom: boolean;
	mobileTwoFingerZoom: boolean;
	cooperativeGestures: boolean;
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
	searchPanelBackgroundPrimary: string;
	searchPanelBackgroundSecondary: string;
	searchPanelBackgroundHover: string;
	searchPanelForegroundPrimary: string;
	searchPanelForegroundSecondary: string;
	searchPanelOuterMargin: BoxValue;
	searchPanelBorderRadiusInput: string;
	searchPanelBorderRadiusCard: string;
	searchPanelCardGap: string;
	searchPanelWidth: string;
	googleMapsButtonPadding: BoxValue;
	googleMapsButtonBackgroundColor: string;
	googleMapsButtonForegroundColor: string;
	googleMapsButtonBorderRadius: string;
	googleMapsButtonShowIcon: boolean;
	openingHoursOpenColor: string;
	openingHoursClosedColor: string;
	creditsPadding: BoxValue;
	creditsOuterMargin: BoxValue;
	creditsBackgroundColor: string;
	creditsForegroundColor: string;
	creditsBorderRadius: string;
	_isPreview: boolean;
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

export type OpeningHoursDayKey =
	| 'monday'
	| 'tuesday'
	| 'wednesday'
	| 'thursday'
	| 'friday'
	| 'saturday'
	| 'sunday';

export interface LocationOpeningHoursDay {
	open: string;
	close: string;
	lunch_start: string;
	lunch_duration_minutes: number;
}

export type LocationOpeningHours = Record<OpeningHoursDayKey, LocationOpeningHoursDay>;

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
	logo_id: number;
	marker_id: number;
	opening_hours: LocationOpeningHours;
	opening_hours_notes: string;
}

export interface LocationRecord extends LocationMeta {
	id: number;
	title: string;
	tag_ids: number[];
	markerContent?: string;
}

export interface CollectionRecord extends CollectionMeta {
	id: number;
	title: string;
}

export interface TagMeta {
	background_color: string;
	foreground_color: string;
}

export interface TagRecord extends TagMeta {
	id: number;
	name: string;
	count: number;
}

export interface MarkerRecord {
	id: number;
	title: string;
	content: string;
}

export interface LogoRecord {
	id: number;
	title: string;
	content: string;
}

export interface CollectionFormState {
	title: string;
}

export type CollectionFormMode = 'create' | 'edit';

export interface TagFormState extends TagMeta {
	name: string;
}

export type TagFormMode = 'create' | 'edit';

export interface LocationFormState extends LocationMeta {
	title: string;
	tag_ids: number[];
}

export type LocationFormMode = 'create' | 'edit';

export type LocationDialogStep = 'details' | 'opening_hours' | 'address' | 'map';

export interface FieldErrors {
	title?: string;
	email?: string;
	website?: string;
	street?: string;
	house_number?: string;
	postal_code?: string;
	city?: string;
	country?: string;
	opening_hours?: Partial<Record<OpeningHoursDayKey, string>>;
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
