import { useEffect, useMemo, useRef } from '@wordpress/element';
import { createMinimalMap } from '../map/bootstrap';
import type { LocationRecord, MinimalMapInstance, RawMapConfig } from '../types';

export default function LocationMiniMap({ location }: { location: LocationRecord }) {
	const hostRef = useRef<HTMLDivElement | null>(null);
	const mapRef = useRef<MinimalMapInstance | null>(null);
	const latitude = Number(location.latitude);
	const longitude = Number(location.longitude);
	const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude);
	const mapConfig = useMemo<RawMapConfig>(() => ({
		centerLat: hasCoordinates ? latitude : 52.517,
		centerLng: hasCoordinates ? longitude : 13.388,
		zoom: hasCoordinates ? 13 : 8.5,
		height: 60,
		heightUnit: 'px',
		stylePreset: 'positron',
		showZoomControls: false,
		markerLat: hasCoordinates ? latitude : null,
		markerLng: hasCoordinates ? longitude : null,
		markerClassName: 'minimal-map-admin__location-mini-map-marker',
		markerOffsetY: 0,
		centerOffsetY: 13,
		interactive: false,
		showAttribution: false,
	}), [hasCoordinates, latitude, longitude]);

	useEffect(() => {
		if (!hostRef.current) {
			return undefined;
		}

		mapRef.current = createMinimalMap(
			hostRef.current,
			mapConfig,
			window.MinimalMapAdminConfig?.mapConfig ?? {}
		);

		return () => {
			mapRef.current?.destroy();
			mapRef.current = null;
		};
	}, []);

	useEffect(() => {
		mapRef.current?.update(mapConfig);
	}, [mapConfig]);

	return <div ref={hostRef} className="minimal-map-admin__location-mini-map" aria-hidden="true" />;
}
