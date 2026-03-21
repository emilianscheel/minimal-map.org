import { __, sprintf } from '@wordpress/i18n';
import { memo, useEffect, useMemo, useState } from '@wordpress/element';
import {
	AtSign,
	ChevronDown,
	Clock3,
	Facebook,
	Globe,
	Instagram,
	LocateFixed,
	Mail,
	MapPin,
	Navigation,
	Phone,
	Send,
	Twitter,
	Youtube,
} from 'lucide-react';
import TagBadge from '../components/TagBadge';
import { isOpeningHoursConfigured } from '../lib/locations/openingHours';
import {
	getOpeningHoursDisplayLines,
	getOpeningHoursStatus,
} from './location-opening-hours';
import type { MapLocationLogo, MapLocationPoint, SocialMediaPlatform } from '../types';

export interface LocationResultCardProps {
	distanceLabel?: string;
	googleMapsButtonShowIcon: boolean;
	googleMapsNavigation: boolean;
	id?: string;
	isSelected?: boolean;
	location: MapLocationPoint;
	mode: 'search' | 'in-map';
	onSelect?: (location: MapLocationPoint, distanceLabel?: string) => void;
	siteLocale: string;
	siteTimezone: string;
}

export interface LiveLocationResultCardProps {
	errorMessage?: string | null;
	isPending?: boolean;
	label: string;
	onSelect: () => void;
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

export const formatLocationStreet = (location: MapLocationPoint): string => {
	return [location.street, location.house_number].filter(Boolean).join(' ');
};

export const formatLocationLocality = (location: MapLocationPoint): string => {
	return [location.postal_code, location.city].filter(Boolean).join(' ');
};

export const formatLocationAddress = (location: MapLocationPoint): string => {
	const streetLine = formatLocationStreet(location);
	const localityLine = formatLocationLocality(location);

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

function getDelayUntilNextMinute(now: Date): number {
	return Math.max(
		1000,
		(60 - now.getSeconds()) * 1000 - now.getMilliseconds() + 50
	);
}

const SearchResultLogo = ({ logo }: { logo: MapLocationLogo }) => {
	const content = typeof logo.content === 'string' ? logo.content : '';
	const isSvgMarkup = content.trim().startsWith('<svg');

	return (
		<div className="minimal-map-search__result-logo" aria-hidden="true">
			{isSvgMarkup ? (
				<div
					className="minimal-map-search__result-logo-svg"
					dangerouslySetInnerHTML={{ __html: content }}
				/>
			) : (
				<img
					className="minimal-map-search__result-logo-image"
					src={content}
					alt=""
				/>
			)}
		</div>
	);
};

function LocationContactMeta({ location }: { location: MapLocationPoint }) {
	const socialPlatforms: Record<
		SocialMediaPlatform,
		{ label: string; icon: any }
	> = useMemo(
		() => ({
			instagram: { label: __('Instagram', 'minimal-map'), icon: Instagram },
			x: { label: __('X', 'minimal-map'), icon: Twitter },
			facebook: { label: __('Facebook', 'minimal-map'), icon: Facebook },
			threads: { label: __('Threads', 'minimal-map'), icon: AtSign },
			youtube: { label: __('YouTube', 'minimal-map'), icon: Youtube },
			telegram: { label: __('Telegram', 'minimal-map'), icon: Send },
		}),
		[]
	);

	const socialMedia = (location.social_media || []).filter(
		(link) => typeof link.url === 'string' && link.url.trim()
	);

	if (
		!location.telephone &&
		!location.email &&
		!location.website &&
		socialMedia.length === 0
	) {
		return null;
	}

	return (
		<div className="minimal-map-search__result-meta">
			{location.telephone ? (
				<a
					className="minimal-map-search__meta-item minimal-map-search__meta-item--link"
					href={`tel:${location.telephone}`}
				>
					<Phone size={10} />
					<span>{location.telephone}</span>
				</a>
			) : null}
			{location.email ? (
				<a
					className="minimal-map-search__meta-item minimal-map-search__meta-item--link"
					href={`mailto:${location.email}`}
				>
					<Mail size={10} />
					<span>{location.email}</span>
				</a>
			) : null}
			{location.website ? (
				<a
					className="minimal-map-search__meta-item minimal-map-search__meta-item--link"
					href={location.website}
					rel="noreferrer noopener"
					target="_blank"
				>
					<Globe size={10} />
					<span>{formatDisplayUrl(location.website)}</span>
				</a>
			) : null}
			{socialMedia.map((link, index) => {
				const platform = socialPlatforms[link.platform];
				const Icon = platform.icon;

				return (
					<a
						key={index}
						className="minimal-map-search__meta-item minimal-map-search__meta-item--link"
						href={link.url}
						rel="noreferrer noopener"
						target="_blank"
					>
						<Icon size={10} />
						<span>{platform.label}</span>
					</a>
				);
			})}
		</div>
	);
}

export const LocationResultCard = memo(({
	distanceLabel,
	googleMapsButtonShowIcon,
	googleMapsNavigation,
	id,
	isSelected,
	location,
	mode,
	onSelect,
	siteLocale,
	siteTimezone,
}: LocationResultCardProps) => {
	const [openedStatus, setOpenedStatus] = useState(() =>
		getOpeningHoursStatus(location.opening_hours || {}, siteLocale, siteTimezone, new Date())
	);

	useEffect(() => {
		if (!location.opening_hours) {
			return;
		}

		const updateStatus = () => {
			setOpenedStatus(
				getOpeningHoursStatus(location.opening_hours || {}, siteLocale, siteTimezone, new Date())
			);
		};

		const timeout = setTimeout(updateStatus, getDelayUntilNextMinute(new Date()));
		return () => clearTimeout(timeout);
	}, [location.opening_hours, siteLocale, siteTimezone]);

	const address = useMemo(() => formatLocationAddress(location), [location]);
	const showOpeningHours = isOpeningHoursConfigured(location.opening_hours || {});
	const openingHoursLines = useMemo(
		() => getOpeningHoursDisplayLines(location.opening_hours || {}, siteLocale),
		[location.opening_hours, siteLocale]
	);

	const hasTags = (location.tags?.length || 0) > 0;
	const showGoogleMapsButton = googleMapsNavigation && hasLocationCoordinates(location);
	const showFooter = hasTags || showGoogleMapsButton || !!distanceLabel;

	const [isOpeningHoursExpanded, setIsOpeningHoursExpanded] = useState(false);

	const openingHoursSection = showOpeningHours ? (
		<div className="minimal-map-search__result-opening-hours">
			<button
				type="button"
				className="minimal-map-search__result-opening-hours-toggle"
				onClick={(e) => {
					e.stopPropagation();
					setIsOpeningHoursExpanded(!isOpeningHoursExpanded);
				}}
				aria-expanded={isOpeningHoursExpanded}
			>
				<Clock3 size={10} />
				<span
					className={`minimal-map-search__result-opening-hours-status minimal-map-search__result-opening-hours-status--${openedStatus?.state || 'closed'}`}
				>
					{openedStatus?.label || __('Closed', 'minimal-map')}
				</span>
				<ChevronDown
					size={12}
					className={`minimal-map-search__result-opening-hours-chevron ${
						isOpeningHoursExpanded ? 'is-active' : ''
					}`}
				/>
			</button>
			{isOpeningHoursExpanded && (
				<div className="minimal-map-search__result-opening-hours-details">
					{openingHoursLines.map((line, index) => (
						<div
							key={index}
							className="minimal-map-search__result-opening-hours-line"
						>
							<span className="minimal-map-search__result-opening-hours-day">{line.dayLabel}</span>
							<span className="minimal-map-search__result-opening-hours-value">{line.value}</span>
						</div>
					))}
					{location.opening_hours_notes && (
						<div className="minimal-map-search__result-opening-hours-notes">
							{location.opening_hours_notes}
						</div>
					)}
				</div>
			)}
		</div>
	) : null;

	return (
		<div
			id={id}
			className={`minimal-map-search__result-item minimal-map-location-card ${
				isSelected ? 'is-selected' : ''
			} minimal-map-search__result-item--${mode}`}
		>
			<button
				type="button"
				className="minimal-map-search__result-select"
				onClick={() => onSelect?.(location, distanceLabel)}
			>
				<div className="minimal-map-search__result-layout">
					{location.logo && <SearchResultLogo logo={location.logo} />}
					<div className="minimal-map-search__result-content">
						<div className="minimal-map-search__result-title">{location.title}</div>
						{address && (
							<div className="minimal-map-search__result-address">
								<MapPin size={10} />
								<span>{address}</span>
							</div>
						)}
						<LocationContactMeta location={location} />
					</div>
				</div>
			</button>
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
});

export const LiveLocationResultCard = memo(({
	errorMessage,
	isPending = false,
	label,
	onSelect,
}: LiveLocationResultCardProps) => (
	<div className="minimal-map-search__result-item minimal-map-location-card minimal-map-search__result-item--live-location">
		<button
			type="button"
			className="minimal-map-search__result-select"
			onClick={onSelect}
			disabled={isPending}
			aria-busy={isPending}
		>
			<div className="minimal-map-search__result-layout">
				<div className="minimal-map-search__result-content">
					<div className="minimal-map-search__result-title minimal-map-search__result-title--live-location">
						<span className="minimal-map-search__result-live-location-icon" aria-hidden="true">
							<LocateFixed size={14} />
						</span>
						<span>{label}</span>
					</div>
					{errorMessage ? (
						<div className="minimal-map-search__result-live-location-error">
							{errorMessage}
						</div>
					) : null}
				</div>
			</div>
		</button>
	</div>
));
