import { createRoot, useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Globe, Mail, MapPin, Phone, Search, X } from 'lucide-react';
import type { Map as MapLibreMap } from 'maplibre-gl';
import TagBadge from '../components/TagBadge';
import type {
	MapLocationLogo,
	MapLocationPoint,
	NormalizedMapConfig,
} from '../types';
import { getMapDomContext } from './dom-context';
import {
	applySearchPanelCssVariables,
	getSearchPanelDesktopPadding,
} from './search-panel-layout';
import { isMobileViewport } from './responsive';

interface SearchControlProps {
	doc: Document;
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

const MapSearchControl = ({
	doc,
	locations,
	onSelect,
	selectedId: selectedIdProp,
}: SearchControlProps) => {
	const [searchTerm, setSearchTerm] = useState('');
	const [isFocused, setIsFocused] = useState(false);
	const [selectedId, setSelectedId] = useState<number | undefined>(selectedIdProp);
	const containerRef = useRef<HTMLDivElement>(null);
	const isOpen = isFocused || typeof selectedId === 'number';

	useEffect(() => {
		setSelectedId(selectedIdProp);
	}, [selectedIdProp]);

	const filteredLocations = useMemo(() => {
		if (!isOpen) {
			return [];
		}

		const term = searchTerm.toLowerCase().trim();

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
	}, [isOpen, locations, searchTerm]);

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
				<div className="minimal-map-search__input-wrapper">
					<div className="minimal-map-search__icon-container">
						<Search size={18} />
					</div>
					<input
						type="text"
						className="minimal-map-search__input"
						value={searchTerm}
						onChange={(event) => setSearchTerm(event.target.value)}
						onFocus={() => setIsFocused(true)}
						placeholder={__('Search locations...', 'minimal-map')}
						aria-label={__('Search locations', 'minimal-map')}
					/>
					{searchTerm ? (
						<button
							type="button"
							className="minimal-map-search__clear"
							onClick={() => setSearchTerm('')}
							aria-label={__('Clear search', 'minimal-map')}
						>
							<X size={16} />
						</button>
					) : null}
				</div>

				{isOpen ? (
					<div className="minimal-map-search__results-container">
						{filteredLocations.length > 0 ? (
							<div className="minimal-map-search__results">
								{filteredLocations.map((location) => (
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
													<span>
														{[location.street, location.house_number]
															.filter(Boolean)
															.join(' ')}
														{location.city ? `, ${location.city}` : ''}
													</span>
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
													<div className="minimal-map-search__result-tags">
														{location.tags.map((tag) => (
															<TagBadge key={tag.id} tag={tag} />
														))}
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
						) : searchTerm.trim() !== '' ? (
							<div className="minimal-map-search__no-results">
								{__('No locations found', 'minimal-map')}
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
	initialSelectedId?: number,
	onLocationSelect?: (location: MapLocationPoint) => void,
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
