import { createRoot, useCallback, useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { LoaderCircle, Search, SearchX, X } from 'lucide-react';
import type { FormEvent, KeyboardEvent } from 'react';
import Kbd from '../components/Kbd';
import type {
	GeocodeResponse,
	MapLocationSelection,
	MapLocationPoint,
	NormalizedMapConfig,
} from '../types';
import { getMapDomContext } from './dom-context';
import { geocodeSearchQuery } from './geocodeSearchQuery';
import {
	buildDistanceSearchResults,
	type DistanceSearchResult,
} from './location-distance';
import { LocationResultCard } from './location-card';
import {
	collectLocationTags,
	filterLocationsByCategoryTagIds,
} from './category-filter';
import {
	buildLocationSearchIndex,
	searchIndexedLocations,
} from './location-search';
import { applySearchPanelCssVariables } from './search-panel-layout';
import { isMobileViewport } from './responsive';

type SearchMode =
	| 'text-results'
	| 'address-prompt'
	| 'address-loading'
	| 'address-results'
	| 'address-empty';

type SearchResultView =
	| {
			location: MapLocationPoint;
			distanceLabel?: undefined;
	  }
	| {
			location: MapLocationPoint;
			distanceLabel: string;
	  };

type GeocodeSearchFn = (query: string) => Promise<GeocodeResponse>;

interface SearchControlProps {
	doc: Document;
	host?: HTMLElement;
	frontendGeocodePath?: string;
	geocodeSearch: GeocodeSearchFn;
	googleMapsNavigation: boolean;
	googleMapsButtonShowIcon: boolean;
	enableCategoryFilter: boolean;
	locations: MapLocationPoint[];
	activeCategoryTagIds: number[];
	onCategoryFilterChange: (tagIds: number[]) => void;
	onEscape?: () => void;
	onOpenStateChange?: (isOpen: boolean) => void;
	onSelect: (selection: MapLocationSelection) => void;
	selectedId?: number;
	siteLocale: string;
	siteTimezone: string;
}

export const MapSearchControl = ({
	doc,
	host,
	frontendGeocodePath,
	geocodeSearch,
	googleMapsNavigation,
	googleMapsButtonShowIcon,
	enableCategoryFilter,
	locations,
	activeCategoryTagIds,
	onCategoryFilterChange,
	onEscape,
	onOpenStateChange,
	onSelect,
	selectedId: selectedIdProp,
	siteLocale,
	siteTimezone,
}: SearchControlProps) => {
	const responsiveHost = host ?? doc.documentElement;
	const [searchTerm, setSearchTerm] = useState('');
	const [isPanelOpen, setPanelOpen] = useState(false);
	const [isPanelDismissed, setPanelDismissed] = useState(false);
	const [addressSearchMode, setAddressSearchMode] = useState<
		'idle' | 'loading' | 'results' | 'empty'
	>('idle');
	const [addressResults, setAddressResults] = useState<DistanceSearchResult[]>([]);
	const [selectedId, setSelectedId] = useState<number | undefined>(selectedIdProp);
	const [viewportWidth, setViewportWidth] = useState<number | null>(
		Math.ceil(responsiveHost.getBoundingClientRect().width) ||
			doc.defaultView?.innerWidth ||
			null
	);
	const containerRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const searchTermRef = useRef(searchTerm);
	const isMobile = isMobileViewport(viewportWidth);
	const isOpen =
		!isPanelDismissed && (isPanelOpen || (!isMobile && typeof selectedId === 'number'));
	const trimmedSearchTerm = searchTerm.trim();
	const availableTags = useMemo(
		() => collectLocationTags(locations),
		[locations]
	);
	const categoryFilteredLocations = useMemo(
		() =>
			enableCategoryFilter
				? filterLocationsByCategoryTagIds(locations, activeCategoryTagIds)
				: locations,
		[activeCategoryTagIds, enableCategoryFilter, locations]
	);
	const indexedLocations = useMemo(
		() => buildLocationSearchIndex(categoryFilteredLocations),
		[categoryFilteredLocations]
	);

	useEffect(() => {
		searchTermRef.current = searchTerm;
	}, [searchTerm]);

	useEffect(() => {
		setSelectedId(selectedIdProp);
		setPanelDismissed(false);
	}, [selectedIdProp]);

	useEffect(() => {
		onOpenStateChange?.(isOpen);
	}, [isOpen, onOpenStateChange]);

	useEffect(() => {
		const view = doc.defaultView;

		if (!view) {
			return;
		}

		const updateViewportWidth = () => {
			const nextWidth = Math.ceil(responsiveHost.getBoundingClientRect().width);
			setViewportWidth(
				nextWidth > 0 ? nextWidth : view.innerWidth || null
			);
		};

		updateViewportWidth();

		const resizeObserver =
			typeof view.ResizeObserver === 'function'
				? new view.ResizeObserver(() => {
						updateViewportWidth();
				  })
				: null;

		resizeObserver?.observe(responsiveHost);
		view.addEventListener('resize', updateViewportWidth);

		return () => {
			resizeObserver?.disconnect();
			view.removeEventListener('resize', updateViewportWidth);
		};
	}, [doc, responsiveHost]);

	const filteredLocations = useMemo(() => {
		if (!isOpen) {
			return [];
		}

		if (!trimmedSearchTerm) {
			return categoryFilteredLocations.slice(0, 50);
		}

		return searchIndexedLocations(indexedLocations, trimmedSearchTerm);
	}, [categoryFilteredLocations, indexedLocations, isOpen, trimmedSearchTerm]);

	useEffect(() => {
		setAddressSearchMode('idle');
		setAddressResults([]);
	}, [categoryFilteredLocations]);

	const searchMode = useMemo<SearchMode>(() => {
		if (!trimmedSearchTerm) {
			return 'text-results';
		}

		if (filteredLocations.length > 0) {
			return 'text-results';
		}

		if (addressSearchMode === 'loading') {
			return 'address-loading';
		}

		if (addressSearchMode === 'results' && addressResults.length > 0) {
			return 'address-results';
		}

		if (addressSearchMode === 'empty') {
			return 'address-empty';
		}

		return 'address-prompt';
	}, [addressResults.length, addressSearchMode, filteredLocations.length, trimmedSearchTerm]);

	const renderedResults = useMemo<SearchResultView[]>(() => {
		if (searchMode === 'address-results') {
			return addressResults.map((result) => ({
				location: result.location,
				distanceLabel: result.distanceLabel,
			}));
		}

		return filteredLocations.map((location) => ({ location }));
	}, [addressResults, filteredLocations, searchMode]);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target as Node)
			) {
				setPanelOpen(false);
			}
		};

		doc.addEventListener('mousedown', handleClickOutside);

		return () => {
			doc.removeEventListener('mousedown', handleClickOutside);
		};
	}, [doc]);

	useEffect(() => {
		if (!selectedId) {
			return;
		}

		const element = doc.getElementById(`minimal-map-result-${selectedId}`);
		element?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
	}, [doc, selectedId]);

	const handleSelect = useCallback((
		location: MapLocationPoint,
		distanceLabel?: string,
		selectionOrigin: 'tap' | 'auto' = 'tap'
	) => {
		setSelectedId(location.id);

		if (isMobileViewport(viewportWidth) && selectionOrigin === 'tap') {
			setPanelOpen(false);
		}

		onSelect({ location, distanceLabel });
	}, [onSelect, viewportWidth]);

	const resetAddressSearch = (nextTerm = '') => {
		setSearchTerm(nextTerm);
		setAddressSearchMode('idle');
		setAddressResults([]);
	};

	const handleAddressSearch = async (): Promise<void> => {
		if (
			trimmedSearchTerm === '' ||
			filteredLocations.length > 0 ||
			addressSearchMode === 'loading' ||
			!frontendGeocodePath
		) {
			return;
		}

		const query = trimmedSearchTerm;
		setAddressSearchMode('loading');
		setAddressResults([]);

		const result = await geocodeSearch(query);

		if (searchTermRef.current.trim() !== query) {
			return;
		}

		if (!result.success) {
			setAddressSearchMode('empty');
			return;
		}

		const nextAddressResults = buildDistanceSearchResults(
			{
				lat: result.lat,
				lng: result.lng,
			},
			categoryFilteredLocations,
		);

		setAddressResults(nextAddressResults);
		setAddressSearchMode('results');

		const bestResult = nextAddressResults[0];

		if (bestResult) {
			handleSelect(bestResult.location, bestResult.distanceLabel, 'auto');
		}
	};

	const toggleCategoryTagId = (tagId: number) => {
		const nextActiveTagIds = activeCategoryTagIds.includes(tagId)
			? activeCategoryTagIds.filter((activeTagId) => activeTagId !== tagId)
			: [ ...activeCategoryTagIds, tagId ];

		onCategoryFilterChange(nextActiveTagIds);
	};

	const renderCategoryFilters = () => {
		if (
			isOpen ||
			!enableCategoryFilter ||
			availableTags.length === 0
		) {
			return null;
		}

		return (
			<div className="minimal-map-search__category-filters">
				{availableTags.map((tag) => (
					<button
						key={tag.id}
						type="button"
						className={`minimal-map-search__category-pill${
							activeCategoryTagIds.includes(tag.id) ? ' is-selected' : ''
						}`}
						aria-pressed={activeCategoryTagIds.includes(tag.id)}
						onClick={() => toggleCategoryTagId(tag.id)}
					>
						{tag.name}
					</button>
				))}
			</div>
		);
	};

	const renderResultCards = () => (
		<div className="minimal-map-search__results">
			{renderedResults.map(({ location, distanceLabel }) => (
				<LocationResultCard
					key={location.id}
					distanceLabel={distanceLabel}
					googleMapsButtonShowIcon={googleMapsButtonShowIcon}
					googleMapsNavigation={googleMapsNavigation}
					id={`minimal-map-result-${location.id}`}
					isSelected={selectedId === location.id}
					location={location}
					mode="search"
					onSelect={handleSelect}
					siteLocale={siteLocale}
					siteTimezone={siteTimezone}
				/>
			))}
		</div>
	);

	const handleSearchInput = (nextValue: string) => {
		resetAddressSearch(nextValue);
	};

	const handleSearchFocus = () => {
		setPanelDismissed(false);
		setPanelOpen(true);
	};

	const dismissSearchPanel = () => {
		setPanelOpen(false);
		setPanelDismissed(true);
		inputRef.current?.blur();
		onEscape?.();
	};

	const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
		if (event.key !== 'Escape') {
			return;
		}

		event.preventDefault();
		event.stopPropagation();
		dismissSearchPanel();
	};

	const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		void handleAddressSearch();
	};

	return (
		<>
			{isOpen ? (
				<div
					className="minimal-map-search-backdrop"
					onClick={() => setPanelOpen(false)}
				/>
			) : null}
			<div
				ref={containerRef}
				className={`minimal-map-search ${isOpen ? 'is-focused' : ''}`}
			>
				<form
					className="minimal-map-search__input-wrapper"
					onSubmit={handleSearchSubmit}
				>
					<div className="minimal-map-search__icon-container">
						<Search size={18} />
					</div>
					<input
						ref={inputRef}
						type="search"
						className="minimal-map-search__input"
						value={searchTerm}
						onChange={(event) => handleSearchInput(event.target.value)}
						onInput={(event) =>
							handleSearchInput(
								(event.target as HTMLInputElement | null)?.value ?? '',
							)
						}
						onFocus={handleSearchFocus}
						onKeyDown={handleSearchKeyDown}
						enterKeyHint="search"
						placeholder={__('Search locations...', 'minimal-map')}
						aria-label={__('Search locations', 'minimal-map')}
					/>
					{searchTerm ? (
						<button
							type="button"
							className="minimal-map-search__clear"
							onClick={() => resetAddressSearch('')}
							aria-label={__('Clear search', 'minimal-map')}
						>
							<X size={16} />
						</button>
					) : null}
				</form>

				{renderCategoryFilters()}

				{isOpen ? (
					<div className="minimal-map-search__results-container">
						{renderedResults.length > 0 ? (
							renderResultCards()
						) : searchMode === 'address-prompt' ? (
							<div className="minimal-map-search__state">
								<LoaderCircle
									size={24}
									className="minimal-map-search__state-spinner"
								/>
								<div className="minimal-map-search__state-message">
									{__('Press', 'minimal-map')} <Kbd variant="search">Enter</Kbd>{' '}
									{__('to load results', 'minimal-map')}
								</div>
							</div>
						) : searchMode === 'address-loading' ? (
							<div className="minimal-map-search__state">
								<LoaderCircle
									size={24}
									className="minimal-map-search__state-spinner"
								/>
								<div className="minimal-map-search__state-message">
									{__('Loading results...', 'minimal-map')}
								</div>
							</div>
						) : searchMode === 'address-empty' ? (
							<div className="minimal-map-search__state">
								<SearchX
									size={24}
									className="minimal-map-search__state-icon"
								/>
								<div className="minimal-map-search__state-message">
									{__('No locations found', 'minimal-map')}
								</div>
							</div>
						) : null}
					</div>
				) : null}
			</div>
		</>
	);
};

export interface WordPressSearchControl {
	destroy: () => void;
	update: (
		config: NormalizedMapConfig,
		selectedId?: number,
		activeCategoryTagIds?: number[]
	) => void;
}

export function createWordPressSearchControl(
	host: HTMLElement,
	initialConfig: NormalizedMapConfig,
	frontendGeocodePath?: string,
	initialSelectedId?: number,
	onLocationSelect?: (selection: MapLocationSelection) => void,
	geocodeSearchFn?: GeocodeSearchFn,
	initialActiveCategoryTagIds: number[] = [],
	onCategoryFilterChange?: (tagIds: number[]) => void,
	onEscape?: () => void,
	onOpenStateChange?: (isOpen: boolean) => void,
): WordPressSearchControl {
	const context = getMapDomContext(host);
	const container = context.doc.createElement('div');
	container.className = 'minimal-map-search-host';

	container.style.position = 'absolute';
	container.style.top = '0';
	container.style.left = '0';
	container.style.right = '0';
	container.style.bottom = '0';
	container.style.zIndex = '10';
	container.style.pointerEvents = 'none';

	host.appendChild(container);

	const root = createRoot(container);
	const geocodeSearch =
		geocodeSearchFn ??
		((query: string) => {
			if (!frontendGeocodePath) {
				return Promise.resolve({
					success: false,
					message: __('No locations found', 'minimal-map'),
				} satisfies GeocodeResponse);
			}

			return geocodeSearchQuery(frontendGeocodePath, query);
		});

	const onSelect = (selection: MapLocationSelection) => {
		onLocationSelect?.(selection);
	};

	const render = (
		config: NormalizedMapConfig,
		selectedId?: number,
		activeCategoryTagIds: number[] = []
	) => {
		applySearchPanelCssVariables(container, config);
		root.render(
			<MapSearchControl
				activeCategoryTagIds={activeCategoryTagIds}
				doc={context.doc}
				enableCategoryFilter={config.enableCategoryFilter}
				frontendGeocodePath={frontendGeocodePath}
				geocodeSearch={geocodeSearch}
				googleMapsNavigation={config.googleMapsNavigation}
				googleMapsButtonShowIcon={config.googleMapsButtonShowIcon}
				host={host}
				locations={config.locations}
				onCategoryFilterChange={onCategoryFilterChange ?? (() => {})}
				onEscape={onEscape}
				onOpenStateChange={onOpenStateChange}
				onSelect={onSelect}
				selectedId={selectedId}
				siteLocale={config.siteLocale}
				siteTimezone={config.siteTimezone}
			/>
		);
	};

	render(initialConfig, initialSelectedId, initialActiveCategoryTagIds);

	return {
		destroy() {
			root.unmount();
			container.remove();
		},
		update(config, selectedId, activeCategoryTagIds = []) {
			render(config, selectedId, activeCategoryTagIds);
		},
	};
}
