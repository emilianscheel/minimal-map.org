import { memo, useEffect, useMemo, useRef } from '@wordpress/element';
import { createMinimalMap } from '../map/bootstrap';
import { getCollectionPreviewLocations } from '../lib/collections/getCollectionPreviewLocations';
import { areCollectionMiniMapPropsEqual } from '../lib/collections/collectionMiniMap';
import type {
	CollectionRecord,
	LocationRecord,
	MinimalMapInstance,
	RawMapConfig,
	StyleThemeRecord,
} from '../types';

function CollectionMiniMap({
	collection,
	locations,
	theme,
}: {
	collection: CollectionRecord;
	locations: LocationRecord[];
	theme: StyleThemeRecord | null;
}) {
	const hostRef = useRef<HTMLDivElement | null>(null);
	const mapRef = useRef<MinimalMapInstance | null>(null);
	const assignedLocationIdsKey = useMemo(
		() => collection.location_ids.join(','),
		[collection.location_ids]
	);
	const previewLocations = useMemo(
		() => getCollectionPreviewLocations(collection, locations),
		[collection.id, assignedLocationIdsKey, locations]
	);
	const mapConfig = useMemo<RawMapConfig>(() => ({
		centerLat: 52.517,
		centerLng: 13.388,
		zoom: previewLocations.length > 1 ? 7.5 : 11,
		height: 100,
		heightUnit: '%',
		stylePreset: theme?.basePreset || 'positron',
		styleTheme: theme?.colors,
		showZoomControls: false,
		allowSearch: false,
		markerClassName: 'minimal-map-admin__collection-mini-map-marker',
		markerOffsetY: 0,
		centerOffsetY: 0,
		locations: previewLocations,
		interactive: false,
		showAttribution: false,
	}), [previewLocations, theme]);

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

export default memo(CollectionMiniMap, areCollectionMiniMapPropsEqual);
