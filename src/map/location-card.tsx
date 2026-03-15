import { __, sprintf } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { ChevronDown, Clock3, Globe, Mail, MapPin, Navigation, Phone } from 'lucide-react';
import TagBadge from '../components/TagBadge';
import { isOpeningHoursConfigured } from '../lib/locations/openingHours';
import {
	getOpeningHoursDisplayLines,
	getOpeningHoursStatus,
} from './location-opening-hours';
import type { MapLocationLogo, MapLocationPoint } from '../types';

export interface LocationResultCardProps {
	distanceLabel?: string;
	googleMapsButtonShowIcon: boolean;
	googleMapsNavigation: boolean;
	id?: string;
	isSelected?: boolean;
	location: MapLocationPoint;
	mode: 'search' | 'in-map';
	onSelect?: () => void;
	siteLocale: string;
	siteTimezone: string;
}

export const formatDisplayUrl = (url: string): string => {
	if (!url) {
		return '';
	}

	return url
		.replace(/^(https?:\/\/)/, '')
		.replace(/^www\./, '')
		.replace(/\/$/, '');
};

export const formatLocationAddress = (location: MapLocationPoint): string => {
	const streetLine = [location.street, location.house_number].filter(Boolean).join(' ');
	const localityLine = [location.postal_code, location.city].filter(Boolean).join(' ');

	return [streetLine, localityLine].filter(Boolean).join(', ');
};

export const getGoogleMapsDirectionsUrl = (location: MapLocationPoint): string => {
	const params = new URLSearchParams({
		api: '1',
		destination: `${location.lat},${location.lng}`,
	});

	return `https://www.google.com/maps/dir/?${params.toString()}`;
};

export const hasLocationCoordinates = (location: MapLocationPoint): boolean =>
	Number.isFinite(location.lat) && Number.isFinite(location.lng);

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

export function LocationResultCard({
	distanceLabel,
	googleMapsButtonShowIcon,
	googleMapsNavigation,
	id,
	isSelected = false,
	location,
	mode,
	onSelect,
	siteLocale,
	siteTimezone,
}: LocationResultCardProps) {
	const [isOpeningHoursExpanded, setOpeningHoursExpanded] = useState(false);
	const hasTags = Array.isArray(location.tags) && location.tags.length > 0;
	const showGoogleMapsButton = googleMapsNavigation && hasLocationCoordinates(location);
	const showFooter = hasTags || showGoogleMapsButton || Boolean(distanceLabel);
	const showOpeningHours =
		location.opening_hours && isOpeningHoursConfigured(location.opening_hours);
	const openingHoursStatus =
		showOpeningHours && location.opening_hours
			? getOpeningHoursStatus(location.opening_hours, siteLocale, siteTimezone)
			: null;
	const openingHoursLines =
		showOpeningHours && location.opening_hours
			? getOpeningHoursDisplayLines(location.opening_hours, siteLocale)
			: [];
	const layout = (
		<div className="minimal-map-search__result-layout">
			<div className="minimal-map-search__result-content">
				<div className="minimal-map-search__result-title">{location.title}</div>
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
			</div>
			{location.logo ? (
				<div className="minimal-map-search__result-logo-column">
					<SearchResultLogo logo={location.logo} />
				</div>
			) : null}
		</div>
	);
	const openingHoursSection =
		showOpeningHours && openingHoursStatus ? (
			<div className="minimal-map-search__result-opening-hours">
				<button
					type="button"
					className={`minimal-map-search__result-opening-hours-trigger is-${openingHoursStatus.state}`}
					aria-expanded={isOpeningHoursExpanded}
					onClick={() => setOpeningHoursExpanded((current) => !current)}
				>
					<Clock3 size={12} />
					<span>{openingHoursStatus.label}</span>
					<ChevronDown
						size={12}
						className={`minimal-map-search__result-opening-hours-chevron ${
							isOpeningHoursExpanded ? 'is-open' : ''
						}`}
					/>
				</button>
				<div
					className={`minimal-map-search__result-opening-hours-panel ${
						isOpeningHoursExpanded ? 'is-open' : ''
					}`}
				>
					<div className="minimal-map-search__result-opening-hours-panel-inner">
						<div className="minimal-map-search__result-opening-hours-list">
							{openingHoursLines.map((line) => (
								<div
									key={line.dayLabel}
									className="minimal-map-search__result-opening-hours-row"
								>
									<span className="minimal-map-search__result-opening-hours-day">
										{line.dayLabel}
									</span>
									<span className="minimal-map-search__result-opening-hours-value">
										{line.value}
									</span>
								</div>
							))}
						</div>
						{location.opening_hours_notes?.trim() ? (
							<div className="minimal-map-search__result-opening-hours-notes">
								{location.opening_hours_notes.trim()}
							</div>
						) : null}
					</div>
				</div>
			</div>
		) : null;

	return (
		<div
			id={id}
			className={`minimal-map-search__result-item minimal-map-location-card minimal-map-location-card--${mode} ${
				isSelected ? 'is-selected' : ''
			}`}
		>
			{mode === 'search' && onSelect ? (
				<button
					type="button"
					className="minimal-map-search__result-select"
					onClick={onSelect}
				>
					{layout}
				</button>
			) : (
				<div className="minimal-map-location-card__body">{layout}</div>
			)}
			{openingHoursSection}
			{showFooter ? (
				<div className="minimal-map-search__result-footer">
					<div className="minimal-map-search__result-footer-content">
						{hasTags ? (
							<div className="minimal-map-search__result-tags">
								{location.tags?.map((tag) => (
									<TagBadge key={tag.id} tag={tag} />
								))}
							</div>
						) : null}
						{showGoogleMapsButton ? (
							<a
								className="minimal-map-search__maps-link"
								href={getGoogleMapsDirectionsUrl(location)}
								target="_blank"
								rel="noreferrer noopener"
							>
								{googleMapsButtonShowIcon ? <Navigation size={10} /> : null}
								<span>{__('Open in Google Maps', 'minimal-map')}</span>
							</a>
						) : null}
					</div>
					{distanceLabel ? (
						<div className="minimal-map-search__result-distance">
							{sprintf(__('%s away', 'minimal-map'), distanceLabel)}
						</div>
					) : null}
				</div>
			) : null}
		</div>
	);
}
