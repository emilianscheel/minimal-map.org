import { useEffect, useRef } from '@wordpress/element';
import { createMinimalMap } from '../map/bootstrap';
import type { MinimalMapInstance, MarkerRecord, StyleThemeRecord } from '../types';

export default function MarkerMiniMap({ marker, theme }: { marker: MarkerRecord; theme: StyleThemeRecord | null }) {
	const mapRef = useRef<HTMLDivElement>(null);
	const instanceRef = useRef<MinimalMapInstance | null>(null);

	// Create map once
	useEffect(() => {
		if (!mapRef.current) {
			return;
		}

		// Use a deterministic location based on marker ID
		const lat = 52.5 + (marker.id % 100) / 1000;
		const lng = 13.4 + (marker.id % 100) / 1000;

		instanceRef.current = createMinimalMap(mapRef.current, {
			centerLat: lat,
			centerLng: lng,
			markerLat: lat,
			markerLng: lng,
			markerContent: marker.content,
			zoom: 12,
			interactive: false,
			showZoomControls: false,
			allowSearch: false,
			showAttribution: false,
			height: 100,
			heightUnit: '%',
			markerScale: 1.25,
			styleTheme: theme?.colors,
			stylePreset: theme?.basePreset,
		});

		return () => {
			instanceRef.current?.destroy();
			instanceRef.current = null;
		};
	}, [marker.id]);

	// Update map on changes
	useEffect(() => {
		if (!instanceRef.current) {
			return;
		}

		// Re-calculate deterministic location
		const lat = 52.5 + (marker.id % 100) / 1000;
		const lng = 13.4 + (marker.id % 100) / 1000;

		instanceRef.current.update({
			centerLat: lat,
			centerLng: lng,
			markerLat: lat,
			markerLng: lng,
			markerContent: marker.content,
			zoom: 12,
			interactive: false,
			showZoomControls: false,
			allowSearch: false,
			showAttribution: false,
			height: 100,
			heightUnit: '%',
			markerScale: 1.25,
			styleTheme: theme?.colors,
			stylePreset: theme?.basePreset,
		});
	}, [marker.id, marker.content, theme]);

	return (
		<div className="minimal-map-admin__marker-mini-map-wrap">
			<div ref={mapRef} className="minimal-map-admin__marker-mini-map" />
		</div>
	);
}
