import { createRoot, useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Globe, LoaderCircle, Mail, MapPin, Phone, Search, SearchX, X } from 'lucide-react';
import type { Map as MapLibreMap } from 'maplibre-gl';
import type { FormEvent } from 'react';
import Kbd from '../components/Kbd';
import TagBadge from '../components/TagBadge';
import type {
	GeocodeResponse,
	MapLocationLogo,
	MapLocationPoint,
	NormalizedMapConfig,
} from '../types';
import { getMapDomContext } from './dom-context';
import { geocodeSearchQuery } from './geocodeSearchQuery';
import {
	buildDistanceSearchResults,
	type DistanceSearchResult,
} from './location-distance';
import {
	applySearchPanelCssVariables,
	getSearchPanelDesktopPadding,
} from './search-panel-layout';
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
	frontendGeocodePath?: string;
	geocodeSearch: GeocodeSearchFn;
	locations: MapLocationPoint[];
	onSelect: (location: MapLocationPoint) => void;
	selectedId?: number;
}

const formatDisplayUrl = (url: string): string => {
	if (!url) {
		return '';
	}

	return url
		.replace(/^(https?:\/\/)/, '')
		.replace(/^www\./, '')
		.replace(/\/$/, '');
};

const formatLocationAddress = (location: MapLocationPoint): string => {
	const streetLine = [location.street, location.house_number].filter(Boolean).join(' ');
	const localityLine = [location.postal_code, location.city].filter(Boolean).join(' ');

	return [streetLine, localityLine].filter(Boolean).join(', ');
};

const SearchResultLogo = ({ logo }: { logo: MapLocationLogo }) => {
	const isSvgMarkup = logo.content.trim().startsWith('<svg');

	return (
		<div className="minimal-map-search__result-logo" aria-hidden="true">
			{isSvgMarkup ? (
				<div
					className="minimal-map-search__result-logo-svg"
					dangerouslySetInnerHTML={{ __html: logo.content }}
				/>
			) : (
				<img
					className="minimal-map-search__result-logo-image"
					src={logo.content}
					alt=""
				/>
			)}
		</div>
	);
};

export const MapSearchControl = ({
	doc,
	frontendGeocodePath,
	geocodeSearch,
	locations,
	onSelect,
	selectedId: selectedIdProp,
}: SearchControlProps) => {
	const [searchTerm, setSearchTerm] = useState('');
	const [isFocused, setIsFocused] = useState(false);
	const [addressSearchMode, setAddressSearchMode] = useState<
		'idle' | 'loading' | 'results' | 'empty'
	>('idle');
	const [addressResults, setAddressResults] = useState<DistanceSearchResult[]>([]);
	const [selectedId, setSelectedId] = useState<number | undefined>(selectedIdProp);
	const containerRef = useRef<HTMLDivElement>(null);
	const searchTermRef = useRef(searchTerm);
	const isOpen = isFocused || typeof selectedId === 'number';
	const trimmedSearchTerm = searchTerm.trim();

	useEffect(() => {
		searchTermRef.current = searchTerm;
	}, [searchTerm]);

	useEffect(() => {
		setSelectedId(selectedIdProp);
	}, [selectedIdProp]);

	const filteredLocations = useMemo(() => {
		if (!isOpen) {
			return [];
		}

		const term = trimmedSearchTerm.toLowerCase();

		if (!term) {
			return locations;
		}

		return locations.filter((location) => {
			const searchableValues = [
				location.title,
				location.city,
				location.street,
				location.house_number,
				location.postal_code,
				location.state,
				location.country,
				location.telephone,
				location.email,
				location.website,
				...(Array.isArray(location.tags) ? location.tags.map((tag) => tag.name) : []),
			];

			return searchableValues.some((value) => value?.toLowerCase().includes(term));
		});
	}, [isOpen, locations, trimmedSearchTerm]);

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
				setIsFocused(false);
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

	const handleSelect = (location: MapLocationPoint) => {
		setSelectedId(location.id);
		onSelect(location);
	};

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

		setAddressResults(
			buildDistanceSearchResults(
				{
					lat: result.lat,
					lng: result.lng,
				},
				locations,
			),
		);
		setAddressSearchMode('results');
	};

	const renderResultCards = () => (
		<div className="minimal-map-search__results">
			{renderedResults.map(({ location, distanceLabel }) => (
				<button
					key={location.id}
					id={`minimal-map-result-${location.id}`}
					type="button"
					className={`minimal-map-search__result-item ${
						selectedId === location.id ? 'is-selected' : ''
					}`}
					onClick={() => handleSelect(location)}
				>
					<div className="minimal-map-search__result-layout">
						<div className="minimal-map-search__result-content">
							<div className="minimal-map-search__result-title">
								{location.title}
							</div>
							<div className="minimal-map-search__result-address">
								<MapPin size={12} />
								<span>{formatLocationAddress(location)}</span>
							</div>
							{location.telephone || location.email || location.website ? (
								<div className="minimal-map-search__result-meta">
									{location.telephone ? (
										<div className="minimal-map-search__meta-item">
											<Phone size={10} />
											<span>{location.telephone}</span>
										</div>
									) : null}
									{location.email ? (
										<div className="minimal-map-search__meta-item">
											<Mail size={10} />
											<span>{location.email}</span>
										</div>
									) : null}
									{location.website ? (
										<div className="minimal-map-search__meta-item">
											<Globe size={10} />
											<span>{formatDisplayUrl(location.website)}</span>
										</div>
									) : null}
								</div>
							) : null}
							{Array.isArray(location.tags) && location.tags.length > 0 ? (
								<div className="minimal-map-search__result-footer">
									<div className="minimal-map-search__result-tags">
										{location.tags.map((tag) => (
											<TagBadge key={tag.id} tag={tag} />
										))}
									</div>
									{distanceLabel ? (
										<div className="minimal-map-search__result-distance">
											{sprintf(__('%s away', 'minimal-map'), distanceLabel)}
										</div>
									) : null}
								</div>
							) : distanceLabel ? (
								<div className="minimal-map-search__result-footer minimal-map-search__result-footer--distance-only">
									<div className="minimal-map-search__result-distance">
										{sprintf(__('%s away', 'minimal-map'), distanceLabel)}
									</div>
								</div>
							) : null}
						</div>
						{location.logo ? (
							<div className="minimal-map-search__result-logo-column">
								<SearchResultLogo logo={location.logo} />
							</div>
						) : null}
					</div>
				</button>
			))}
		</div>
	);

	const handleSearchInput = (nextValue: string) => {
		resetAddressSearch(nextValue);
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
					onClick={() => setIsFocused(false)}
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
						type="search"
						className="minimal-map-search__input"
						value={searchTerm}
						onChange={(event) => handleSearchInput(event.target.value)}
						onInput={(event) =>
							handleSearchInput(
								(event.target as HTMLInputElement | null)?.value ?? '',
							)
						}
						onFocus={() => setIsFocused(true)}
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
									{__('Press', 'minimal-map')} <Kbd>Enter</Kbd>{' '}
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
	update: (config: NormalizedMapConfig, selectedId?: number) => void;
}

export function createWordPressSearchControl(
	host: HTMLElement,
	map: MapLibreMap,
	initialConfig: NormalizedMapConfig,
	frontendGeocodePath?: string,
	initialSelectedId?: number,
	onLocationSelect?: (location: MapLocationPoint) => void,
	geocodeSearchFn?: GeocodeSearchFn,
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
	let currentConfig = initialConfig;
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

	const onSelect = (location: MapLocationPoint) => {
		onLocationSelect?.(location);
		const isMobile = isMobileViewport(context.win.innerWidth);

		map.easeTo(
			{
				center: [location.lng, location.lat],
				zoom: Math.max(map.getZoom(), 15),
				padding: {
					left: !isMobile
						? getSearchPanelDesktopPadding(currentConfig, container)
						: 0,
					top: isMobile ? 80 : 0,
					right: 0,
					bottom: 0,
				},
				essential: true,
			},
			{ isMinimalMapInternal: true },
		);
	};

	const render = (config: NormalizedMapConfig, selectedId?: number) => {
		currentConfig = config;
		applySearchPanelCssVariables(container, config);
		root.render(
			<MapSearchControl
				doc={context.doc}
				frontendGeocodePath={frontendGeocodePath}
				geocodeSearch={geocodeSearch}
				locations={config.locations}
				onSelect={onSelect}
				selectedId={selectedId}
			/>
		);
	};

	render(initialConfig, initialSelectedId);

	return {
		destroy() {
			root.unmount();
			container.remove();
		},
		update(config, selectedId) {
			render(config, selectedId);
		},
	};
}
