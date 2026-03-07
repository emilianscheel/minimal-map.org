import { useEffect, useMemo, useRef } from '@wordpress/element';
import { createMinimalMap } from '../map/bootstrap';
import { getCollectionPreviewLocations } from '../lib/collections/getCollectionPreviewLocations';
import type {
	CollectionRecord,
	LocationRecord,
	MinimalMapInstance,
	RawMapConfig,
} from '../types';

export default function CollectionMiniMap({
	collection,
	locations,
}: {
	collection: CollectionRecord;
	locations: LocationRecord[];
}) {
	const hostRef = useRef<HTMLDivElement | null>(null);
	const mapRef = useRef<MinimalMapInstance | null>(null);
	const previewLocations = useMemo(
		() => getCollectionPreviewLocations(collection, locations),
		[collection, locations]
	);
	const mapConfig = useMemo<RawMapConfig>(() => ({
		centerLat: 52.517,
		centerLng: 13.388,
		zoom: previewLocations.length > 1 ? 7.5 : 11,
		height: 100,
		heightUnit: '%',
		stylePreset: 'positron',
		showZoomControls: false,
		markerClassName: 'minimal-map-admin__collection-mini-map-marker',
		markerOffsetY: 0,
		centerOffsetY: 0,
		locations: previewLocations,
		interactive: false,
		showAttribution: false,
	}), [previewLocations]);

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

	return <div ref={hostRef} className="minimal-map-admin__collection-mini-map" aria-hidden="true" />;
}
