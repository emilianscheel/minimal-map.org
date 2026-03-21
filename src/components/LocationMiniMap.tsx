import { __ } from '@wordpress/i18n';
import type { CSSProperties } from 'react';
import { DEFAULT_POSITRON_THEME_COLORS } from '../lib/styles/defaultThemeColors';
import type { LocationRecord, StyleThemeRecord } from '../types';
import { darkenColor, lightenColor } from '../lib/colors';

function createDefaultStaticMarker(color = '#3fb1ce'): string {
	const borderColor = darkenColor(color, 20);
	const innerColor = lightenColor(color, 80);

	return `
<svg viewBox="0 0 27 41" aria-hidden="true" focusable="false">
	<defs>
		<filter id="minimal-map-mini-marker-shadow" x="-40%" y="-20%" width="180%" height="180%">
			<feOffset dy="1" in="SourceAlpha" result="offset" />
			<feGaussianBlur in="offset" stdDeviation="1.25" result="blur" />
			<feColorMatrix
				in="blur"
				type="matrix"
				values="0 0 0 0 0
								0 0 0 0 0
								0 0 0 0 0
								0 0 0 0.28 0"
				result="shadow"
			/>
			<feMerge>
				<feMergeNode in="shadow" />
				<feMergeNode in="SourceGraphic" />
			</feMerge>
		</filter>
	</defs>
	<path
		fill="${color}"
		stroke="${borderColor}"
		stroke-width="1.5"
		filter="url(#minimal-map-mini-marker-shadow)"
		d="M13.5 1.5C6.873 1.5 1.5 6.873 1.5 13.5c0 9.137 10.308 19.954 11.487 21.17a.75.75 0 0 0 1.026 0C15.192 33.454 25.5 22.637 25.5 13.5 25.5 6.873 20.127 1.5 13.5 1.5Z"
	/>
	<circle cx="13.5" cy="13" r="5.5" fill="${innerColor}" />
</svg>
`;
}

export default function LocationMiniMap({
	location,
	theme,
	markerContent,
	onClick,
}: {
	location: LocationRecord;
	theme: StyleThemeRecord | null;
	markerContent?: string | null;
	onClick?: () => void;
}) {
	const colors = theme?.colors ?? DEFAULT_POSITRON_THEME_COLORS;
	const previewStyle = {
		'--minimal-map-mini-map-background': colors.background,
		'--minimal-map-mini-map-water': colors.water,
		'--minimal-map-mini-map-park': colors.park,
		'--minimal-map-mini-map-road-casing': colors.roadMajorCasing,
		'--minimal-map-mini-map-road-fill': colors.roadMajorFill,
		cursor: onClick ? 'pointer' : 'default',
	} as CSSProperties;

	const previewMarkerContent =
		markerContent ??
		location.markerContent ??
		createDefaultStaticMarker(location.marker_color);

	const Container = onClick ? 'button' : 'div';

	return (
		<Container
			className="minimal-map-admin__location-mini-map minimal-map-admin__location-mini-map--static"
			style={previewStyle}
			onClick={(e) => {
				e.stopPropagation();
				onClick?.();
			}}
			type={onClick ? 'button' : undefined}
			aria-label={onClick ? __('Change marker color', 'minimal-map') : undefined}
			aria-hidden={onClick ? undefined : 'true'}
		>
			<div className="minimal-map-admin__location-mini-map-surface">
				<span className="minimal-map-admin__location-mini-map-water" />
				<span className="minimal-map-admin__location-mini-map-park" />
				<span className="minimal-map-admin__location-mini-map-road minimal-map-admin__location-mini-map-road--primary" />
				<span className="minimal-map-admin__location-mini-map-road minimal-map-admin__location-mini-map-road--secondary" />
			</div>
			<div
				className="minimal-map-admin__location-mini-map-preview-marker"
				dangerouslySetInnerHTML={{ __html: previewMarkerContent }}
			/>
			{onClick && <div className="minimal-map-admin__location-mini-map-click-overlay" />}
		</Container>
	);
}
