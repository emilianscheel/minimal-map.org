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

const SOCIAL_PLATFORMS: Record<
	SocialMediaPlatform,
	{ label: string; icon: any }
> = {
	instagram: { label: __('Instagram', 'minimal-map'), icon: Instagram },
	x: { label: __('X', 'minimal-map'), icon: Twitter },
	facebook: { label: __('Facebook', 'minimal-map'), icon: Facebook },
	threads: { label: __('Threads', 'minimal-map'), icon: AtSign },
	youtube: { label: __('YouTube', 'minimal-map'), icon: Youtube },
	telegram: { label: __('Telegram', 'minimal-map'), icon: Send },
};

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

function LocationContactMeta({ location }: { location: MapLocationPoint }) {
	const socialMedia = (location.social_media || []).filter((link) => link.url.trim());

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
				const platform = SOCIAL_PLATFORMS[link.platform];
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
	isSelected = false,
	location,
	mode,
	onSelect,
	siteLocale,
	siteTimezone,
}: LocationResultCardProps) => {
	const [isOpeningHoursExpanded, setOpeningHoursExpanded] = useState(false);
	const [statusNow, setStatusNow] = useState(() => Date.now());
	const isSearchCard = mode === 'search';
	const hasTags = Array.isArray(location.tags) && location.tags.length > 0;
	const showGoogleMapsButton = googleMapsNavigation && hasLocationCoordinates(location);
	const showFooter = hasTags || showGoogleMapsButton || Boolean(distanceLabel);
	const hasStructuredOpeningHours = Boolean(
		location.opening_hours && isOpeningHoursConfigured(location.opening_hours)
	);
	const hasOpeningHoursNotes = Boolean(location.opening_hours_notes?.trim());

	useEffect(() => {
		if (!hasStructuredOpeningHours) {
			return;
		}

		let timeoutId: number | null = null;

		const scheduleNextTick = () => {
			timeoutId = globalThis.setTimeout(() => {
				setStatusNow(Date.now());
				scheduleNextTick();
			}, getDelayUntilNextMinute(new Date()));
		};

		scheduleNextTick();

		return () => {
			if (timeoutId !== null) {
				globalThis.clearTimeout(timeoutId);
			}
		};
	}, [hasStructuredOpeningHours]);

	const openingHoursStatus = useMemo(
		() =>
			hasStructuredOpeningHours && location.opening_hours
				? getOpeningHoursStatus(
					location.opening_hours,
					siteLocale,
					siteTimezone,
					new Date(statusNow)
				)
				: null,
		[hasStructuredOpeningHours, location.opening_hours, siteLocale, siteTimezone, statusNow]
	);
	const openingHoursLines = useMemo(
		() =>
			hasStructuredOpeningHours && location.opening_hours
			? getOpeningHoursDisplayLines(location.opening_hours, siteLocale)
			: [],
		[hasStructuredOpeningHours, location.opening_hours, siteLocale]
	);
	const showOpeningHours = hasStructuredOpeningHours || hasOpeningHoursNotes;
	const isOpeningHoursExpandable = hasStructuredOpeningHours && isSearchCard;

	const layout = (
		<div className="minimal-map-search__result-layout">
			<div className="minimal-map-search__result-content">
				<div className="minimal-map-search__result-title">{location.title}</div>
				<div className="minimal-map-search__result-address">
					<MapPin size={12} />
					<div className="minimal-map-search__result-address-content">
						<span>{formatLocationStreet(location)},</span>{' '}
						<span>{formatLocationLocality(location)}</span>
					</div>
				</div>
			</div>
			{location.logo ? (
				<div className="minimal-map-search__result-logo-column">
					<SearchResultLogo logo={location.logo} />
				</div>
			) : null}
		</div>
	);
	const openingHoursSection =
		showOpeningHours ? (
			<div className="minimal-map-search__result-opening-hours">
				{hasStructuredOpeningHours && openingHoursStatus ? (
					isOpeningHoursExpandable ? (
						<>
							<button
								type="button"
								className={`minimal-map-search__result-opening-hours-trigger minimal-map-search__result-opening-hours-trigger--expandable is-${openingHoursStatus.state}`}
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
						</>
					) : (
						<div
							className={`minimal-map-search__result-opening-hours-trigger minimal-map-search__result-opening-hours-trigger--static is-${openingHoursStatus.state}`}
						>
							<Clock3 size={12} />
							<span>{openingHoursStatus.label}</span>
						</div>
					)
				) : location.opening_hours_notes?.trim() ? (
					<div className="minimal-map-search__result-opening-hours-trigger minimal-map-search__result-opening-hours-trigger--static">
						<Clock3 size={12} />
						<span>{location.opening_hours_notes.trim()}</span>
					</div>
				) : null}
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
					onClick={() => onSelect(location, distanceLabel)}
				>
					{layout}
				</button>
			) : (
				<div className="minimal-map-location-card__body">{layout}</div>
			)}
			<LocationContactMeta location={location} />
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
