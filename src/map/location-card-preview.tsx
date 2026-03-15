import { createRoot } from '@wordpress/element';
import maplibregl, { type Map as MapLibreMap, type PopupOptions } from 'maplibre-gl';
import { LocationResultCard } from './location-card';
import { getDocumentFontFamily } from './dom-context';
import { applySearchPanelCssVariables } from './search-panel-layout';
import type {
	MapLocationPoint,
	NormalizedMapConfig,
	SelectedLocationPreview,
} from '../types';

type PopupLike = {
	addTo(map: MapLibreMap): PopupLike;
	isOpen(): boolean;
	remove(): PopupLike;
	setDOMContent(node: Node): PopupLike;
	setLngLat(lngLat: [number, number]): PopupLike;
	setOffset(offset?: PopupOptions['offset']): PopupLike;
};

interface CreateLocationCardPreviewOptions {
	host: HTMLElement;
	map: MapLibreMap;
	popupFactory?: (options: PopupOptions) => PopupLike;
}

export interface LocationCardPreviewController {
	destroy: () => void;
	hide: () => void;
	render: (
		config: NormalizedMapConfig,
		selection: SelectedLocationPreview | null
	) => void;
}

function getLocationBySelection(
	config: NormalizedMapConfig,
	selection: SelectedLocationPreview | null
): MapLocationPoint | null {
	if (!selection) {
		return null;
	}

	return (
		config.locations.find((location) => location.id === selection.locationId) ?? null
	);
}

function hasCustomMarkerContent(
	location: MapLocationPoint,
	config: Pick<NormalizedMapConfig, 'markerContent'>
): boolean {
	const markerContent = location.markerContent ?? config.markerContent;

	return typeof markerContent === 'string' && markerContent.trim().startsWith('<svg');
}

function getPopupOffset(
	location: MapLocationPoint,
	config: Pick<NormalizedMapConfig, 'markerContent' | 'markerOffsetY' | 'markerScale'>
): number {
	const markerHeight = hasCustomMarkerContent(location, config) ? 32 : 41;

	return Math.round(markerHeight * config.markerScale + Math.abs(config.markerOffsetY) + 8);
}

export function waitForInternalMapMovementToFinish(
	map: Pick<MapLibreMap, 'isMoving' | 'off' | 'on'>,
	onReady: () => void,
	scheduleFrame: (callback: FrameRequestCallback) => number = requestAnimationFrame,
	cancelFrame: (handle: number) => void = cancelAnimationFrame,
): () => void {
	let active = true;
	let frameHandle: number | null = null;

	const cleanup = () => {
		if (!active) {
			return;
		}

		active = false;
		map.off('moveend', handleMoveEnd);

		if (frameHandle !== null) {
			cancelFrame(frameHandle);
			frameHandle = null;
		}
	};

	const reveal = () => {
		if (!active) {
			return;
		}

		cleanup();
		onReady();
	};

	const handleMoveEnd = (event: { isMinimalMapInternal?: boolean }) => {
		if (!event.isMinimalMapInternal) {
			return;
		}

		reveal();
	};

	map.on('moveend', handleMoveEnd);
	frameHandle = scheduleFrame(() => {
		if (!map.isMoving()) {
			reveal();
		}
	});

	return cleanup;
}

export function createLocationCardPreviewController({
	host,
	map,
	popupFactory = (options) => new maplibregl.Popup(options),
}: CreateLocationCardPreviewOptions): LocationCardPreviewController {
	const container = host.ownerDocument.createElement('div');
	container.className = 'minimal-map-location-popup__mount';
	const root: ReturnType<typeof createRoot> = createRoot(container);
	const popup = popupFactory({
		className: 'minimal-map-location-popup',
		closeButton: false,
		closeOnClick: false,
		closeOnMove: false,
		focusAfterOpen: false,
		maxWidth: 'none',
	});

	popup.setDOMContent(container);

	const hide = () => {
		if (popup.isOpen()) {
			popup.remove();
		}
	};

	return {
		destroy() {
			hide();
			root.unmount();
			container.remove();
		},
		hide,
		render(config, selection) {
			if (!config.inMapLocationCard) {
				hide();
				return;
			}

			const location = getLocationBySelection(config, selection);

			if (!location) {
				hide();
				return;
			}

			applySearchPanelCssVariables(container, config);
			const documentFontFamily = getDocumentFontFamily(host);
			container.style.setProperty(
				'--minimal-map-location-card-font-family',
				documentFontFamily || 'inherit'
			);
			root.render(
				<LocationResultCard
					distanceLabel={selection?.distanceLabel}
					googleMapsButtonShowIcon={config.googleMapsButtonShowIcon}
					googleMapsNavigation={config.googleMapsNavigation}
					location={location}
					mode="in-map"
					siteLocale={config.siteLocale}
					siteTimezone={config.siteTimezone}
				/>
			);

			popup
				.setOffset(getPopupOffset(location, config))
				.setLngLat([location.lng, location.lat]);

			if (!popup.isOpen()) {
				popup.addTo(map);
			}
		},
	};
}
