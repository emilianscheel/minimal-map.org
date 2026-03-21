import maplibregl, { LngLatBounds, type Map as MapLibreMap } from 'maplibre-gl';
import { createAttributionPill } from './attribution-pill';
import { getDefaultFitBoundsPadding } from './default-fit-padding';
import { normalizeMapConfig } from './defaults';
import { syncTouchZoomInteraction } from './interactions';
import { applyStyleTheme } from '../lib/styles/themeEngine';
import { createWordPressZoomControls } from './wp-controls';
import { createWordPressSearchControl } from './SearchControl';
import { getSearchPanelReservedWidth } from './search-panel-layout';
import { getSelectedLocationTopPadding } from './selected-location-focus-padding';
import { createLocationCardPreviewController, waitForInternalMapMovementToFinish, type LocationCardPreviewController } from './location-card-preview';
import { getActiveHeightCssValue, isMobileViewport } from './responsive';
import { createMarkerRenderer, type MarkerRenderer, type MarkerRendererConfig } from './marker-renderer';
import { getMapDomContext, type MapDomContext } from './dom-context';
import { trackMapSearchQuery } from '../lib/analytics/trackMapSearchQuery';
import {
	filterLocationsByCategoryTagIds,
	filterLocationsByOpenedStatus,
	pruneActiveCategoryTagIds,
} from './category-filter';
import type {
	MapLocationSelection,
	MapRuntimeConfig,
	MapLocationPoint,
	MinimalMapInstance,
	NormalizedMapConfig,
	RawMapConfig,
	SelectedLocationPreview,
	WordPressAttributionControl,
	WordPressZoomControls,
	WordPressSearchControl,
} from '../types';

interface MinimalMapState {
	activeCategoryTagIds: number[];
	attribution: WordPressAttributionControl | null;
	config: NormalizedMapConfig | null;
	controls: WordPressZoomControls | null;
	hasLoadedMap: boolean;
	isOpenedFilterActive: boolean;
	isLiveLocationBusy: boolean;
	keydownHandler: ((event: KeyboardEvent) => void) | null;
	locationCardPreview: LocationCardPreviewController | null;
	map: MapLibreMap | null;
	markerRenderer: MarkerRenderer | null;
	observer: ResizeObserver | null;
	openedFilterNow: number;
	openedFilterRefreshTimeout: ReturnType<typeof setTimeout> | null;
	pendingPreviewCleanup: (() => void) | null;
	resizeHandler: (() => void) | null;
	searchControl: WordPressSearchControl | null;
	isSearchPanelOpen: boolean;
	selectedLocation: SelectedLocationPreview | null;
}

function canCreateWebGLContext(context: MapDomContext): boolean {
	const canvas = context.doc.createElement('canvas');

	return Boolean(
		canvas.getContext('webgl2') ||
		canvas.getContext('webgl') ||
		canvas.getContext('experimental-webgl')
	);
}

export function shouldShowFallbackForMapError(
	map: Pick<MapLibreMap, 'loaded' | 'isStyleLoaded'>,
	hasLoadedMap: boolean
): boolean {
	return !hasLoadedMap && !map.loaded() && !map.isStyleLoaded();
}

function createFallback(host: HTMLElement, message: string, context: MapDomContext): void {
	host.innerHTML = '';
	const notice = context.doc.createElement('div');
	const content = context.doc.createElement('div');
	const paragraph = context.doc.createElement('p');

	notice.className = 'components-notice is-warning minimal-map-fallback';
	content.className = 'components-notice__content';
	paragraph.textContent = message;
	content.appendChild(paragraph);
	notice.appendChild(content);
	host.appendChild(notice);
}

function getHostResponsiveWidth(host: HTMLElement, context: MapDomContext): number {
	const hostWidth = Math.ceil(host.getBoundingClientRect().width);

	if (hostWidth > 0) {
		return hostWidth;
	}

	return context.win.innerWidth;
}

function getDelayUntilNextMinute(now: Date): number {
	return Math.max(
		1000,
		(60 - now.getSeconds()) * 1000 - now.getMilliseconds() + 50
	);
}

function applyHostFontFamily(host: HTMLElement, config: NormalizedMapConfig): void {
	if (config.fontFamily) {
		host.style.setProperty('--minimal-map-font-family', config.fontFamily);
		return;
	}

	host.style.removeProperty('--minimal-map-font-family');
}

function createShell(host: HTMLElement, config: NormalizedMapConfig, context: MapDomContext): HTMLElement {
	host.innerHTML = '';
	host.classList.add('minimal-map-runtime');
	host.style.height = getActiveHeightCssValue(
		config,
		getHostResponsiveWidth(host, context)
	);
	applyHostFontFamily(host, config);

	const viewport = context.doc.createElement('div');
	viewport.className = 'minimal-map-runtime__viewport';
	host.appendChild(viewport);

	return viewport;
}

function getMarkerContent(
	config: NormalizedMapConfig,
	point: MapLocationPoint
): string | null {
	if (typeof point.markerContent === 'string' && point.markerContent.trim() !== '') {
		return point.markerContent;
	}

	return config.markerContent;
}

function didZoomControlsStyleChange(
	previousConfig: NormalizedMapConfig | null,
	nextConfig: NormalizedMapConfig
): boolean {
	if (!previousConfig) {
		return true;
	}

	return (
		previousConfig.allowSearch !== nextConfig.allowSearch ||
		previousConfig.enableLiveLocationMap !== nextConfig.enableLiveLocationMap ||
		previousConfig.zoomControlsPosition !== nextConfig.zoomControlsPosition ||
		previousConfig.zoomControlsBackgroundColor !== nextConfig.zoomControlsBackgroundColor ||
		previousConfig.zoomControlsIconColor !== nextConfig.zoomControlsIconColor ||
		previousConfig.zoomControlsBorderRadius !== nextConfig.zoomControlsBorderRadius ||
		previousConfig.zoomControlsBorderColor !== nextConfig.zoomControlsBorderColor ||
		previousConfig.zoomControlsBorderWidth !== nextConfig.zoomControlsBorderWidth ||
		previousConfig.zoomControlsPlusIcon !== nextConfig.zoomControlsPlusIcon ||
		previousConfig.zoomControlsMinusIcon !== nextConfig.zoomControlsMinusIcon ||
		previousConfig.zoomControlsPadding.top !== nextConfig.zoomControlsPadding.top ||
		previousConfig.zoomControlsPadding.right !== nextConfig.zoomControlsPadding.right ||
		previousConfig.zoomControlsPadding.bottom !== nextConfig.zoomControlsPadding.bottom ||
		previousConfig.zoomControlsPadding.left !== nextConfig.zoomControlsPadding.left ||
		previousConfig.zoomControlsOuterMargin.top !== nextConfig.zoomControlsOuterMargin.top ||
		previousConfig.zoomControlsOuterMargin.right !== nextConfig.zoomControlsOuterMargin.right ||
		previousConfig.zoomControlsOuterMargin.bottom !== nextConfig.zoomControlsOuterMargin.bottom ||
		previousConfig.zoomControlsOuterMargin.left !== nextConfig.zoomControlsOuterMargin.left
	);
}

function didCreditsStyleChange(
	previousConfig: NormalizedMapConfig | null,
	nextConfig: NormalizedMapConfig
): boolean {
	if (!previousConfig) {
		return true;
	}

	return (
		previousConfig.creditsBackgroundColor !== nextConfig.creditsBackgroundColor ||
		previousConfig.creditsForegroundColor !== nextConfig.creditsForegroundColor ||
		previousConfig.creditsBorderRadius !== nextConfig.creditsBorderRadius ||
		previousConfig.creditsPadding.top !== nextConfig.creditsPadding.top ||
		previousConfig.creditsPadding.right !== nextConfig.creditsPadding.right ||
		previousConfig.creditsPadding.bottom !== nextConfig.creditsPadding.bottom ||
		previousConfig.creditsPadding.left !== nextConfig.creditsPadding.left ||
		previousConfig.creditsOuterMargin.top !== nextConfig.creditsOuterMargin.top ||
		previousConfig.creditsOuterMargin.right !== nextConfig.creditsOuterMargin.right ||
		previousConfig.creditsOuterMargin.bottom !== nextConfig.creditsOuterMargin.bottom ||
		previousConfig.creditsOuterMargin.left !== nextConfig.creditsOuterMargin.left
	);
}

function syncCenter(
	map: MapLibreMap,
	config: NormalizedMapConfig,
	zoomChanged = false
): void {
	const target = {
		center: [config.centerLng, config.centerLat] as [number, number],
		offset: [0, config.centerOffsetY] as [number, number],
	};

	if (zoomChanged) {
		map.easeTo(
			{
				...target,
				duration: 180,
				essential: true,
				zoom: config.zoom,
			},
			{ isMinimalMapInternal: true }
		);
		return;
	}

	map.jumpTo(target, { isMinimalMapInternal: true });
}

function getRenderedPoints(config: NormalizedMapConfig): MapLocationPoint[] {
	if (config.locations.length > 0) {
		return config.locations;
	}

	if (config.markerLat === null || config.markerLng === null) {
		return [];
	}

	return [
		{
			lat: config.markerLat,
			lng: config.markerLng,
			markerContent: config.markerContent ?? undefined,
		},
	];
}

function getEffectiveActiveCategoryTagIds(
	config: NormalizedMapConfig,
	activeCategoryTagIds: number[]
): number[] {
	if (!config.allowSearch || !config.enableCategoryFilter) {
		return [];
	}

	return pruneActiveCategoryTagIds(activeCategoryTagIds, config.locations);
}

function getEffectiveOpenedFilterState(
	config: NormalizedMapConfig,
	isOpenedFilterActive: boolean
): boolean {
	if (!config.allowSearch || !config.enableOpenedFilter) {
		return false;
	}

	return isOpenedFilterActive;
}

function getVisibleRenderedPoints(
	config: NormalizedMapConfig,
	activeCategoryTagIds: number[] = [],
	isOpenedFilterActive = false,
	currentTimeMs = Date.now()
): MapLocationPoint[] {
	const renderedPoints = getRenderedPoints(config);
	const effectiveActiveCategoryTagIds = getEffectiveActiveCategoryTagIds(
		config,
		activeCategoryTagIds
	);
	const effectiveOpenedFilterState = getEffectiveOpenedFilterState(
		config,
		isOpenedFilterActive
	);

	const categoryFilteredPoints =
		effectiveActiveCategoryTagIds.length === 0
			? renderedPoints
			: filterLocationsByCategoryTagIds(
				renderedPoints,
				effectiveActiveCategoryTagIds
			);

	if (!effectiveOpenedFilterState) {
		return categoryFilteredPoints;
	}

	return filterLocationsByOpenedStatus(
		categoryFilteredPoints,
		config.siteTimezone,
		new Date(currentTimeMs)
	);
}

function didPointsChange(
	previousPoints: MapLocationPoint[],
	nextPoints: MapLocationPoint[]
): boolean {
	if (previousPoints.length !== nextPoints.length) {
		return true;
	}

	return previousPoints.some((point, index) => {
		const nextPoint = nextPoints[index];

		return point.lat !== nextPoint.lat || point.lng !== nextPoint.lng || point.id !== nextPoint.id;
	});
}

function getMarkerRendererConfig(
	config: NormalizedMapConfig,
	activeCategoryTagIds: number[] = [],
	isOpenedFilterActive = false,
	currentTimeMs = Date.now()
): MarkerRendererConfig {
	return {
		clusterBackgroundColor: config.clusterBackgroundColor,
		clusterForegroundColor: config.clusterForegroundColor,
		interactive: config.interactive,
		markerContent: config.markerContent,
		markerOffsetY: config.markerOffsetY,
		markerScale: config.markerScale,
		points: getVisibleRenderedPoints(
			config,
			activeCategoryTagIds,
			isOpenedFilterActive,
			currentTimeMs
		),
	};
}

function didRenderedPointsChange(
	previousConfig: NormalizedMapConfig | null,
	nextConfig: NormalizedMapConfig
): boolean {
	const previousPoints = previousConfig ? getRenderedPoints(previousConfig) : [];
	const nextPoints = getRenderedPoints(nextConfig);

	return didPointsChange(previousPoints, nextPoints);
}

function didVisibleRenderedPointsChange(
	previousConfig: NormalizedMapConfig | null,
	nextConfig: NormalizedMapConfig,
	previousActiveCategoryTagIds: number[] = [],
	nextActiveCategoryTagIds: number[] = [],
	previousIsOpenedFilterActive = false,
	nextIsOpenedFilterActive = false,
	previousCurrentTimeMs = Date.now(),
	nextCurrentTimeMs = Date.now()
): boolean {
	if (!previousConfig) {
		return true;
	}

	return didPointsChange(
		getVisibleRenderedPoints(
			previousConfig,
			previousActiveCategoryTagIds,
			previousIsOpenedFilterActive,
			previousCurrentTimeMs
		),
		getVisibleRenderedPoints(
			nextConfig,
			nextActiveCategoryTagIds,
			nextIsOpenedFilterActive,
			nextCurrentTimeMs
		)
	);
}

function didRenderedMarkerContentChange(
	previousConfig: NormalizedMapConfig | null,
	nextConfig: NormalizedMapConfig
): boolean {
	if (!previousConfig) {
		return true;
	}

	const previousPoints = getRenderedPoints(previousConfig);
	const nextPoints = getRenderedPoints(nextConfig);

	if (previousPoints.length !== nextPoints.length) {
		return true;
	}

	if (previousConfig.markerContent !== nextConfig.markerContent) {
		return true;
	}

	return previousPoints.some((point, index) => {
		const nextPoint = nextPoints[index];

		return getMarkerContent(previousConfig, point) !== getMarkerContent(nextConfig, nextPoint);
	});
}

export function syncViewport(
	map: MapLibreMap,
	config: NormalizedMapConfig,
	viewportWidth?: number | null,
	zoomChanged = false,
	activeCategoryTagIds: number[] = [],
	searchPanelReservedWidth = 0,
	isOpenedFilterActive = false,
	currentTimeMs = Date.now()
): void {
	const points = getVisibleRenderedPoints(
		config,
		activeCategoryTagIds,
		isOpenedFilterActive,
		currentTimeMs
	);

	if (points.length === 0) {
		syncCenter(map, config, zoomChanged);
		return;
	}

	if (points.length === 1) {
		const [point] = points;
		map.easeTo(
			{
				center: [point.lng, point.lat],
				duration: 180,
				essential: true,
				offset: [0, config.centerOffsetY],
				zoom: config.zoom,
			},
			{ isMinimalMapInternal: true }
		);
		return;
	}

	const bounds = points.reduce(
		(currentBounds, point) => currentBounds.extend([point.lng, point.lat]),
		new LngLatBounds([points[0].lng, points[0].lat], [points[0].lng, points[0].lat])
	);

	map.fitBounds(
		bounds,
		{
			duration: 180,
			essential: true,
			padding: getDefaultFitBoundsPadding(
				config,
				viewportWidth,
				searchPanelReservedWidth
			),
		},
		{ isMinimalMapInternal: true }
	);
}

async function fetchOptimizedLocations(
	urlStr: string,
	collectionId?: number
): Promise<{ locations: MapLocationPoint[]; markers: Record<string, string>; logos: Record<string, string> }> {
	const url = new URL(urlStr);
	if (collectionId) {
		url.searchParams.set('collection_id', collectionId.toString());
	}

	const response = await fetch(url.toString());
	if (!response.ok) {
		throw new Error('Failed to fetch map locations.');
	}

	return response.json();
}

function rehydrateLocations(
	locations: MapLocationPoint[],
	markers: Record<string, string>,
	logos: Record<string, string>
): MapLocationPoint[] {
	return locations.map((location) => {
		const rehydrated: MapLocationPoint = {
			...location,
			id: typeof location.id === 'number' ? location.id : (location.id ? Number(location.id) : undefined),
			lat: typeof location.lat === 'number' ? location.lat : Number(location.lat),
			lng: typeof location.lng === 'number' ? location.lng : Number(location.lng),
		};

		if (location.markerId && markers[location.markerId]) {
			rehydrated.markerContent = markers[location.markerId];
		}

		if (location.logo?.logoId && logos[location.logo.logoId]) {
			rehydrated.logo = {
				...location.logo,
				content: logos[location.logo.logoId],
			};
		}

		return rehydrated;
	});
}

export function createMinimalMap(
	host: HTMLElement,
	initialConfig: RawMapConfig = {},
	runtimeConfig: MapRuntimeConfig = {}
): MinimalMapInstance {
	const context = getMapDomContext(host);
	const state: MinimalMapState = {
		activeCategoryTagIds: [],
		attribution: null,
		config: null,
		controls: null,
		hasLoadedMap: false,
		isOpenedFilterActive: false,
		isLiveLocationBusy: false,
		isSearchPanelOpen: false,
		keydownHandler: null,
		locationCardPreview: null,
		map: null,
		markerRenderer: null,
		observer: null,
		openedFilterNow: Date.now(),
		openedFilterRefreshTimeout: null,
		pendingPreviewCleanup: null,
		resizeHandler: null,
		searchControl: null,
		selectedLocation: null,
	};

	let isFetching = false;
	let destroyed = false;
	let styleRebuildTimeout: ReturnType<typeof setTimeout> | null = null;

	async function maybeFetchLocations(config: NormalizedMapConfig): Promise<void> {
		if (
			isFetching ||
			config.locations.length > 0 ||
			!runtimeConfig.locationsUrl ||
			config._isPreview
		) {
			return;
		}

		isFetching = true;

		try {
			const { locations, markers, logos } = await fetchOptimizedLocations(
				runtimeConfig.locationsUrl,
				config.collectionId
			);

			if (destroyed) {
				return;
			}

			const rehydrated = rehydrateLocations(locations, markers, logos);
			
			// Use the current state config if available, otherwise fallback to the one passed in
			const activeConfig = state.config ?? config;
			update({ ...activeConfig, locations: rehydrated });
		} catch (error) {
			console.error('Failed to fetch map locations', error);
		} finally {
			isFetching = false;
		}
	}

	function applyResponsiveHostHeight(config: NormalizedMapConfig): void {
		const nextHeightCssValue = getActiveHeightCssValue(
			config,
			getHostResponsiveWidth(host, context)
		);

		if (host.style.height !== nextHeightCssValue) {
			host.style.height = nextHeightCssValue;
		}
	}

	function clearPendingLocationPreview(): void {
		state.pendingPreviewCleanup?.();
		state.pendingPreviewCleanup = null;
	}

	function clearOpenedFilterRefreshTimeout(): void {
		if (state.openedFilterRefreshTimeout) {
			clearTimeout(state.openedFilterRefreshTimeout);
			state.openedFilterRefreshTimeout = null;
		}
	}

	function getSelectedLocationId(): number | undefined {
		return state.selectedLocation?.locationId;
	}

	function getSearchPanelHost(): HTMLElement | null {
		return host.querySelector<HTMLElement>('.minimal-map-search-host');
	}

	function getActiveSearchPanelReservedWidth(
		config: NormalizedMapConfig
	): number {
		if (!state.isSearchPanelOpen) {
			return 0;
		}

		return getSearchPanelReservedWidth(
			config,
			getSearchPanelHost(),
			getHostResponsiveWidth(host, context)
		);
	}

	function clearSelection(config: NormalizedMapConfig): void {
		clearPendingLocationPreview();
		state.selectedLocation = null;
		state.searchControl?.update(
			config,
			undefined,
			state.activeCategoryTagIds,
			state.isOpenedFilterActive,
			state.openedFilterNow
		);
		state.locationCardPreview?.hide();
	}

	function clearSelectionAndRestoreViewport(config: NormalizedMapConfig): void {
		if (!state.map) {
			return;
		}

		clearSelection(config);
		syncViewport(
			state.map,
			config,
			getHostResponsiveWidth(host, context),
			false,
			state.activeCategoryTagIds,
			getActiveSearchPanelReservedWidth(config),
			state.isOpenedFilterActive,
			state.openedFilterNow
		);
	}

	function syncEscapeKeyHandler(): void {
		if (state.keydownHandler) {
			context.doc.removeEventListener('keydown', state.keydownHandler);
			state.keydownHandler = null;
		}

		state.keydownHandler = (event: KeyboardEvent) => {
			if (
				event.key !== 'Escape' ||
				event.defaultPrevented ||
				!state.config ||
				!state.selectedLocation
			) {
				return;
			}

			clearSelectionAndRestoreViewport(state.config);
		};

		context.doc.addEventListener('keydown', state.keydownHandler);
	}

	function syncLocationCardPreview(
		config: NormalizedMapConfig,
		selection: SelectedLocationPreview | null = state.selectedLocation
	): void {
		if (
			config.inMapLocationCard &&
			config.locations.some((location) => typeof location.id === 'number') &&
			state.map
		) {
			if (!state.locationCardPreview) {
				state.locationCardPreview = createLocationCardPreviewController({
					host,
					map: state.map,
				});
			}
		} else {
			state.locationCardPreview?.destroy();
			state.locationCardPreview = null;
		}

		if (!state.locationCardPreview) {
			return;
		}

		state.locationCardPreview.render(config, selection);
	}

	function focusLocation(
		selection: SelectedLocationPreview,
		config: NormalizedMapConfig
	): void {
		if (!state.map) {
			return;
		}

		const point = getVisibleRenderedPoints(
			config,
			state.activeCategoryTagIds,
			state.isOpenedFilterActive,
			state.openedFilterNow
		).find((candidate) => candidate.id === selection.locationId);

		if (!point) {
			return;
		}

		clearPendingLocationPreview();
		state.selectedLocation = selection;
		state.locationCardPreview?.hide();
		state.searchControl?.update(
			config,
			selection.locationId,
			state.activeCategoryTagIds,
			state.isOpenedFilterActive,
			state.openedFilterNow
		);

		if (config.inMapLocationCard) {
			state.pendingPreviewCleanup = waitForInternalMapMovementToFinish(
				state.map,
				() => {
					if (!state.config || state.selectedLocation?.locationId !== selection.locationId) {
						return;
					}

					state.pendingPreviewCleanup = null;
					syncLocationCardPreview(state.config, selection);
				},
				context.win.requestAnimationFrame.bind(context.win),
				context.win.cancelAnimationFrame.bind(context.win),
			);
		}

		const responsiveWidth = getHostResponsiveWidth(host, context);
		const isMobile = isMobileViewport(responsiveWidth);
		const topPadding = getSelectedLocationTopPadding(config, responsiveWidth);
		const searchPanelReservedWidth = getSearchPanelReservedWidth(
			config,
			getSearchPanelHost(),
			responsiveWidth
		);
		state.map.easeTo(
			{
				center: [point.lng, point.lat],
				zoom: Math.max(state.map.getZoom(), 15),
				padding: {
					left: !isMobile
						? searchPanelReservedWidth
						: 0,
					top: topPadding,
					right: 0,
					bottom: 0,
				},
				essential: true,
			},
			{ isMinimalMapInternal: true }
		);
	}

	function setupUserInteractionListeners(map: MapLibreMap): void {
		const clearSelectionOnUserInteraction = (event: {
			isMinimalMapInternal?: boolean;
		}) => {
			if (event.isMinimalMapInternal) {
				return;
			}

			if (state.selectedLocation && state.config) {
				clearSelection(state.config);
			}
		};

		map.on('movestart', clearSelectionOnUserInteraction);
		map.on('zoomstart', clearSelectionOnUserInteraction);
	}

	function syncControls(config: NormalizedMapConfig): void {
		state.controls?.destroy();
		state.controls = null;

		if (config.showZoomControls && state.map) {
			state.controls = createWordPressZoomControls(
				host,
				state.map,
				config,
				() => {
					state.searchControl?.requestLiveLocation();
				},
				state.isLiveLocationBusy
			);
		}
	}

	function syncOpenedFilterRefresh(): void {
		clearOpenedFilterRefreshTimeout();

		if (!state.isOpenedFilterActive) {
			return;
		}

		state.openedFilterRefreshTimeout = setTimeout(() => {
			state.openedFilterRefreshTimeout = null;

			if (!state.config || !state.map || destroyed) {
				return;
			}

			applySearchFilters(
				state.config,
				state.activeCategoryTagIds,
				state.isOpenedFilterActive,
				Date.now()
			);
		}, getDelayUntilNextMinute(new Date()));
	}

	function applySearchFilters(
		config: NormalizedMapConfig,
		nextActiveCategoryTagIds: number[],
		nextIsOpenedFilterActive: boolean,
		currentTimeMs = Date.now()
	): void {
		if (!state.map) {
			return;
		}

		const previousVisiblePoints = getVisibleRenderedPoints(
			config,
			state.activeCategoryTagIds,
			state.isOpenedFilterActive,
			state.openedFilterNow
		);
		const normalizedActiveCategoryTagIds = getEffectiveActiveCategoryTagIds(
			config,
			nextActiveCategoryTagIds
		);
		const normalizedIsOpenedFilterActive = getEffectiveOpenedFilterState(
			config,
			nextIsOpenedFilterActive
		);
		const nextVisiblePoints = getVisibleRenderedPoints(
			config,
			normalizedActiveCategoryTagIds,
			normalizedIsOpenedFilterActive,
			currentTimeMs
		);
		const didCategoryFiltersChange =
			JSON.stringify(normalizedActiveCategoryTagIds) !==
			JSON.stringify(state.activeCategoryTagIds);
		const didOpenedFilterStateChange =
			normalizedIsOpenedFilterActive !== state.isOpenedFilterActive;
		const didVisiblePointsChange = didPointsChange(
			previousVisiblePoints,
			nextVisiblePoints
		);

		state.activeCategoryTagIds = normalizedActiveCategoryTagIds;
		state.isOpenedFilterActive = normalizedIsOpenedFilterActive;
		state.openedFilterNow = currentTimeMs;

		syncOpenedFilterRefresh();

		if (
			state.selectedLocation &&
			!nextVisiblePoints.some((point) => point.id === state.selectedLocation?.locationId)
		) {
			clearSelection(config);
		} else {
			state.searchControl?.update(
				config,
				getSelectedLocationId(),
				state.activeCategoryTagIds,
				state.isOpenedFilterActive,
				state.openedFilterNow
			);
		}

		if (
			!didCategoryFiltersChange &&
			!didOpenedFilterStateChange &&
			!didVisiblePointsChange
		) {
			return;
		}

		syncMarkers(config);
		syncLocationCardPreview(config, state.selectedLocation);
		syncViewport(
			state.map,
			config,
			getHostResponsiveWidth(host, context),
			false,
			state.activeCategoryTagIds,
			getActiveSearchPanelReservedWidth(config),
			state.isOpenedFilterActive,
			state.openedFilterNow
		);
	}

	function syncSearch(config: NormalizedMapConfig): void {
		state.isOpenedFilterActive = getEffectiveOpenedFilterState(
			config,
			state.isOpenedFilterActive
		);

		if (config.allowSearch && config.locations.length > 0 && state.map) {
			if (!state.searchControl) {
				state.searchControl = createWordPressSearchControl(
					host,
					config,
					runtimeConfig.frontendGeocodePath,
					getSelectedLocationId(),
					(selection: MapLocationSelection) => {
						if (selection.location.id) {
							focusLocation(
								{
									locationId: selection.location.id,
									distanceLabel: selection.distanceLabel,
								},
								state.config ?? config
							);
						}
					},
					undefined,
					state.activeCategoryTagIds,
					state.isOpenedFilterActive,
					(activeCategoryTagIds: number[]) => {
						if (!state.config || !state.map) {
							return;
						}

						applySearchFilters(
							state.config,
							activeCategoryTagIds,
							state.isOpenedFilterActive
						);
					},
					(isOpenedFilterActive: boolean) => {
						if (!state.config || !state.map) {
							return;
						}

						applySearchFilters(
							state.config,
							state.activeCategoryTagIds,
							isOpenedFilterActive
						);
					},
					() => {
						if (state.config && state.selectedLocation) {
							state.isSearchPanelOpen = false;
							clearSelectionAndRestoreViewport(state.config);
						}
					},
					(isOpen: boolean) => {
						if (state.isSearchPanelOpen === isOpen) {
							return;
						}

						state.isSearchPanelOpen = isOpen;

						if (!state.map || !state.config || state.selectedLocation) {
							return;
						}

						syncViewport(
							state.map,
							state.config,
							getHostResponsiveWidth(host, context),
							false,
							state.activeCategoryTagIds,
							getActiveSearchPanelReservedWidth(state.config),
							state.isOpenedFilterActive,
							state.openedFilterNow
						);
					},
					(isBusy: boolean) => {
						state.isLiveLocationBusy = isBusy;
						state.controls?.setLiveLocationBusy(isBusy);
					},
					runtimeConfig.analyticsEnabled && runtimeConfig.analyticsTrackPath
						? (payload) => {
							void trackMapSearchQuery(runtimeConfig.analyticsTrackPath as string, payload);
						}
						: undefined
				);
			} else {
				state.searchControl.update(
					config,
					getSelectedLocationId(),
					state.activeCategoryTagIds,
					state.isOpenedFilterActive,
					state.openedFilterNow
				);
			}
		} else {
			state.searchControl?.destroy();
			state.searchControl = null;
			state.isLiveLocationBusy = false;
			state.isOpenedFilterActive = false;
			clearOpenedFilterRefreshTimeout();
			state.controls?.setLiveLocationBusy(false);
			state.isSearchPanelOpen = false;
		}
	}

	function syncAttribution(config: NormalizedMapConfig): void {
		state.attribution?.destroy();
		state.attribution = null;

		if (config.showAttribution) {
			state.attribution = createAttributionPill(host, config);
		}
	}

	function syncMarkers(config: NormalizedMapConfig): void {
		if (!state.markerRenderer) {
			return;
		}

		void state.markerRenderer.update(
			getMarkerRendererConfig(
				config,
				state.activeCategoryTagIds,
				state.isOpenedFilterActive,
				state.openedFilterNow
			)
		);
	}

	function build(rawConfig: RawMapConfig): void {
		const config = normalizeMapConfig(rawConfig, runtimeConfig);
		state.config = config;
		const viewport = createShell(host, config, context);

		if (!canCreateWebGLContext(context)) {
			createFallback(host, config.fallbackMessage, context);
			return;
		}

		try {
			state.map = new maplibregl.Map({
				attributionControl: false,
				boxZoom: config.interactive,
				center: [config.centerLng, config.centerLat],
				container: viewport,
				doubleClickZoom: config.interactive,
				dragPan: config.interactive,
				dragRotate: config.interactive,
				keyboard: config.interactive,
				scrollZoom: config.scrollZoom,
				style: config.styleUrl,
				touchZoomRotate: config.interactive && config.mobileTwoFingerZoom,
				zoom: config.zoom,
				cooperativeGestures: config.cooperativeGestures,
			});
		} catch {
			createFallback(host, config.fallbackMessage, context);
			return;
		}

		const map = state.map;
		state.markerRenderer = createMarkerRenderer({
			host,
			map,
			onLocationSelect: (locationId) => {
				const activeConfig = state.config ?? config;
				focusLocation({ locationId }, activeConfig);
			},
		});

		if (!config.interactive) {
			map.boxZoom.disable();
			map.doubleClickZoom.disable();
			map.dragPan.disable();
			map.dragRotate.disable();
			map.keyboard.disable();
			map.touchZoomRotate.disable();
		}

		syncTouchZoomInteraction(map, config);

		map.on('load', () => {
			state.hasLoadedMap = true;
			const activeConfig = state.config ?? config;
			syncViewport(
				map,
				activeConfig,
				getHostResponsiveWidth(host, context),
				false,
				state.activeCategoryTagIds,
				getActiveSearchPanelReservedWidth(activeConfig),
				state.isOpenedFilterActive,
				state.openedFilterNow
			);
			map.resize();

			if (activeConfig.styleTheme) {
				try {
					applyStyleTheme(map, activeConfig.styleTheme, activeConfig.stylePreset);
				} catch (error) {
					console.warn('Initial theme application failed', error);
				}
			}

			if (state.markerRenderer) {
				void state.markerRenderer.rebuild();
			}
		});

		const onStyleData = () => {
			if (styleRebuildTimeout) {
				clearTimeout(styleRebuildTimeout);
			}

			styleRebuildTimeout = setTimeout(() => {
				styleRebuildTimeout = null;
				if (!state.map || !state.map.isStyleLoaded()) {
					return;
				}

				const activeConfig = state.config ?? config;

				if (activeConfig.styleTheme) {
					try {
						applyStyleTheme(state.map, activeConfig.styleTheme, activeConfig.stylePreset);
					} catch (error) {
						console.warn('Style theme re-application failed', error);
					}
				}

				if (state.markerRenderer) {
					void state.markerRenderer.rebuild();
				}
			}, 100);
		};

		map.on('style.load', onStyleData);
		map.on('styledata', onStyleData);

		map.on('click', (event) => {
			if (state.markerRenderer?.handleClick(event)) {
				return;
			}

			const activeConfig = state.config ?? config;

			if (!activeConfig.interactive) {
				return;
			}

			runtimeConfig.onMapClick?.({
				lat: event.lngLat.lat,
				lng: event.lngLat.lng,
			});
		});

		map.on('error', (event) => {
			if (!shouldShowFallbackForMapError(map, state.hasLoadedMap)) {
				console.error('Minimal Map encountered a runtime map error.', event.error ?? event);
				return;
			}

			createFallback(host, (state.config ?? config).fallbackMessage, context);
		});

		if (typeof context.win.ResizeObserver === 'function') {
			state.observer = new context.win.ResizeObserver(() => {
				const activeConfig = state.config ?? config;

				applyResponsiveHostHeight(activeConfig);
				state.map?.resize();

				if (!state.map) {
					return;
				}

				if (state.selectedLocation) {
					focusLocation(state.selectedLocation, activeConfig);
					return;
				}

				syncViewport(
					state.map,
					activeConfig,
					getHostResponsiveWidth(host, context),
					false,
					state.activeCategoryTagIds,
					getActiveSearchPanelReservedWidth(activeConfig),
					state.isOpenedFilterActive,
					state.openedFilterNow
				);
			});
			state.observer.observe(host);
		}

		state.resizeHandler = () => {
			const activeConfig = state.config ?? config;
			const previousHeight = host.style.height;

			applyResponsiveHostHeight(activeConfig);

			if (host.style.height !== previousHeight) {
				state.map?.resize();
			}
		};
		context.win.addEventListener('resize', state.resizeHandler);

		syncMarkers(config);
		syncControls(config);
		syncSearch(config);
		syncOpenedFilterRefresh();
		syncEscapeKeyHandler();
		syncLocationCardPreview(config, null);
		syncAttribution(config);
		setupUserInteractionListeners(map);

		void maybeFetchLocations(config);
	}

	function destroy(): void {
		destroyed = true;
		state.activeCategoryTagIds = [];
		state.isOpenedFilterActive = false;
		clearOpenedFilterRefreshTimeout();

		if (styleRebuildTimeout) {
			clearTimeout(styleRebuildTimeout);
			styleRebuildTimeout = null;
		}

		state.attribution?.destroy();
		state.attribution = null;

		state.controls?.destroy();
		state.controls = null;

		if (state.keydownHandler) {
			context.doc.removeEventListener('keydown', state.keydownHandler);
			state.keydownHandler = null;
		}

		state.searchControl?.destroy();
		state.searchControl = null;

		clearPendingLocationPreview();
		state.locationCardPreview?.destroy();
		state.locationCardPreview = null;

		state.markerRenderer?.destroy();
		state.markerRenderer = null;

		state.observer?.disconnect();
		state.observer = null;
		if (state.resizeHandler) {
			context.win.removeEventListener('resize', state.resizeHandler);
			state.resizeHandler = null;
		}

		state.map?.remove();
		state.map = null;
		state.hasLoadedMap = false;

		host.innerHTML = '';
	}

	function update(rawConfig: RawMapConfig = {}): void {
		const nextConfig = normalizeMapConfig(rawConfig, runtimeConfig);
		const previousConfig = state.config;
		const previousActiveCategoryTagIds = state.activeCategoryTagIds;
		const previousIsOpenedFilterActive = state.isOpenedFilterActive;
		const previousOpenedFilterNow = state.openedFilterNow;
		const nextActiveCategoryTagIds = getEffectiveActiveCategoryTagIds(
			nextConfig,
			state.activeCategoryTagIds
		);
		const nextIsOpenedFilterActive = getEffectiveOpenedFilterState(
			nextConfig,
			state.isOpenedFilterActive
		);

		if (!state.map) {
			destroy();
			build(nextConfig);
			return;
		}

		applyHostFontFamily(host, nextConfig);
		applyResponsiveHostHeight(nextConfig);

		if (!previousConfig || previousConfig.styleUrl !== nextConfig.styleUrl) {
			state.map.setStyle(nextConfig.styleUrl);
		}

		if (
			state.selectedLocation &&
			!getVisibleRenderedPoints(
				nextConfig,
				nextActiveCategoryTagIds,
				nextIsOpenedFilterActive,
				state.openedFilterNow
			).some(
				(point) => point.id === state.selectedLocation?.locationId
			)
		) {
			clearPendingLocationPreview();
			state.selectedLocation = null;
		}

		if (JSON.stringify(previousConfig?.styleTheme) !== JSON.stringify(nextConfig.styleTheme)) {
			try {
				applyStyleTheme(state.map, nextConfig.styleTheme, nextConfig.stylePreset);
			} catch (error) {
				console.warn('Live theme update failed', error);
			}
		}

		const centerChanged =
			!previousConfig ||
			previousConfig.centerLat !== nextConfig.centerLat ||
			previousConfig.centerLng !== nextConfig.centerLng ||
			previousConfig.centerOffsetY !== nextConfig.centerOffsetY;
		const zoomChanged = !previousConfig || previousConfig.zoom !== nextConfig.zoom;
		const visiblePointsChanged = didVisibleRenderedPointsChange(
			previousConfig,
			nextConfig,
			previousActiveCategoryTagIds,
			nextActiveCategoryTagIds,
			previousIsOpenedFilterActive,
			nextIsOpenedFilterActive,
			previousOpenedFilterNow,
			state.openedFilterNow
		);

		state.activeCategoryTagIds = nextActiveCategoryTagIds;
		state.isOpenedFilterActive = nextIsOpenedFilterActive;
		syncOpenedFilterRefresh();

		if (centerChanged || zoomChanged || visiblePointsChanged) {
			syncViewport(
				state.map,
				nextConfig,
				getHostResponsiveWidth(host, context),
				zoomChanged,
				state.activeCategoryTagIds,
				getActiveSearchPanelReservedWidth(nextConfig),
				state.isOpenedFilterActive,
				state.openedFilterNow
			);
		}

		if (
			!previousConfig ||
			previousConfig.showZoomControls !== nextConfig.showZoomControls ||
			didZoomControlsStyleChange(previousConfig, nextConfig)
		) {
			syncControls(nextConfig);
		}

		syncSearch(nextConfig);
		syncLocationCardPreview(nextConfig, state.selectedLocation);

		if (
			!previousConfig ||
			previousConfig.showAttribution !== nextConfig.showAttribution ||
			didCreditsStyleChange(previousConfig, nextConfig)
		) {
			syncAttribution(nextConfig);
		}

		if (previousConfig?.scrollZoom !== nextConfig.scrollZoom) {
			if (nextConfig.scrollZoom) {
				state.map.scrollZoom.enable();
			} else {
				state.map.scrollZoom.disable();
			}
		}

		if (
			previousConfig?.interactive !== nextConfig.interactive ||
			previousConfig?.mobileTwoFingerZoom !== nextConfig.mobileTwoFingerZoom
		) {
			syncTouchZoomInteraction(state.map, nextConfig);
		}

		if (
			!previousConfig ||
			previousConfig.clusterBackgroundColor !== nextConfig.clusterBackgroundColor ||
			previousConfig.clusterForegroundColor !== nextConfig.clusterForegroundColor ||
			previousConfig.interactive !== nextConfig.interactive ||
			previousConfig.markerContent !== nextConfig.markerContent ||
			previousConfig.markerOffsetY !== nextConfig.markerOffsetY ||
			previousConfig.markerScale !== nextConfig.markerScale ||
			visiblePointsChanged ||
			didRenderedPointsChange(previousConfig, nextConfig) ||
			didRenderedMarkerContentChange(previousConfig, nextConfig)
		) {
			syncMarkers(nextConfig);
		}

		state.config = nextConfig;
		state.map.resize();

		void maybeFetchLocations(nextConfig);
	}

	build(initialConfig);

	return {
		destroy,
		update,
	};
}

function parseNodeConfig(node: HTMLElement): RawMapConfig {
	try {
		return JSON.parse(node.dataset.minimalMapConfig ?? '{}') as RawMapConfig;
	} catch {
		return {};
	}
}

export function bootstrapFrontendMaps(runtimeConfig: MapRuntimeConfig = window.MinimalMapFrontConfig ?? {}): void {
	document.querySelectorAll<HTMLElement>('[data-minimal-map-config]').forEach((node) => {
		createMinimalMap(node, parseNodeConfig(node), runtimeConfig);
	});
}
