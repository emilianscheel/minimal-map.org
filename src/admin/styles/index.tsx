import { Card, CardBody, Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useEffect, useMemo, useRef } from '@wordpress/element';
import type { StylesController } from './types';
import { ColorControl } from './ColorControl';
import { createMinimalMap } from '../../map/bootstrap';
import type { MinimalMapInstance, RawMapConfig, StyleThemeSlot, MapRuntimeConfig } from '../../types';

interface StylesViewProps {
	controller: StylesController;
	runtimeConfig: MapRuntimeConfig;
}

const SLOT_LABELS: Record<StyleThemeSlot, string> = {
	background: __('Background', 'minimal-map'),
	park: __('Parks', 'minimal-map'),
	residential: __('Residential Areas', 'minimal-map'),
	forest: __('Forests', 'minimal-map'),
	ice: __('Ice & Glaciers', 'minimal-map'),
	water: __('Water Surfaces', 'minimal-map'),
	waterway: __('Rivers & Canals', 'minimal-map'),
	building: __('Buildings', 'minimal-map'),
	buildingOutline: __('Building Outlines', 'minimal-map'),
	path: __('Pedestrian Paths', 'minimal-map'),
	roadMinor: __('Minor Roads', 'minimal-map'),
	roadMajorCasing: __('Major Road Casing', 'minimal-map'),
	roadMajorFill: __('Major Road Fill', 'minimal-map'),
	motorwayCasing: __('Motorway Casing', 'minimal-map'),
	motorwayFill: __('Motorway Fill', 'minimal-map'),
	rail: __('Railway Lines', 'minimal-map'),
	railDash: __('Railway Patterns', 'minimal-map'),
	boundary: __('Administrative Boundaries', 'minimal-map'),
	aerowayLine: __('Runway Lines', 'minimal-map'),
	aerowayArea: __('Airport Grounds', 'minimal-map'),
	waterLabel: __('Water Labels', 'minimal-map'),
	waterLabelHalo: __('Water Label Halo', 'minimal-map'),
	roadLabel: __('Road Labels', 'minimal-map'),
	roadLabelHalo: __('Road Label Halo', 'minimal-map'),
	placeLabel: __('Place Labels', 'minimal-map'),
	placeLabelHalo: __('Place Label Halo', 'minimal-map'),
};

const COLOR_GROUPS: { label: string; slots: StyleThemeSlot[] }[] = [
	{
		label: __('Base Surfaces', 'minimal-map'),
		slots: [ 'background', 'park', 'residential', 'forest', 'ice', 'water', 'waterway' ],
	},
	{
		label: __('Structures', 'minimal-map'),
		slots: [ 'building', 'buildingOutline' ],
	},
	{
		label: __('Roads & Transport', 'minimal-map'),
		slots: [ 'path', 'roadMinor', 'roadMajorCasing', 'roadMajorFill', 'motorwayCasing', 'motorwayFill', 'rail', 'railDash' ],
	},
	{
		label: __('Other Features', 'minimal-map'),
		slots: [ 'boundary', 'aerowayLine', 'aerowayArea' ],
	},
	{
		label: __('Typography', 'minimal-map'),
		slots: [ 'waterLabel', 'waterLabelHalo', 'roadLabel', 'roadLabelHalo', 'placeLabel', 'placeLabelHalo' ],
	},
];

export default function StylesView({ controller, runtimeConfig }: StylesViewProps) {
	const { isLoading, draftColors, setDraftColor, activeTheme } = controller;
	const mapHostRef = useRef<HTMLDivElement | null>(null);
	const mapInstanceRef = useRef<MinimalMapInstance | null>(null);

	const mapConfig = useMemo<RawMapConfig>(() => ({
		centerLat: 52.517,
		centerLng: 13.388,
		zoom: 12,
		height: 100,
		heightUnit: '%',
		stylePreset: activeTheme?.basePreset || 'positron',
		styleTheme: draftColors || {},
		interactive: true,
		showAttribution: true,
	}), [ activeTheme?.basePreset, draftColors ]);

	useEffect(() => {
		if (!mapHostRef.current || !activeTheme) {
			return undefined;
		}

		if (!mapInstanceRef.current) {
			mapInstanceRef.current = createMinimalMap(
				mapHostRef.current,
				mapConfig,
				runtimeConfig
			);
		} else {
			mapInstanceRef.current.update(mapConfig);
		}

		return () => {
			// We don't destroy on every re-render to keep it live
		};
	}, [ activeTheme, mapConfig, runtimeConfig ]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (mapInstanceRef.current) {
				mapInstanceRef.current.destroy();
				mapInstanceRef.current = null;
			}
		};
	}, []);

	if (isLoading) {
		return (
			<div className="minimal-map-styles__loading">
				<Spinner />
			</div>
		);
	}

	return (
		<div className="minimal-map-styles">
			<div className="minimal-map-styles__layout">
				<div className="minimal-map-styles__controls">
					{COLOR_GROUPS.map((group) => (
						<Card key={group.label} className="minimal-map-styles__group-card">
							<CardBody>
								<h3 className="minimal-map-styles__group-title">{group.label}</h3>
								<div className="minimal-map-styles__group-grid">
									{group.slots.map((slot) => (
										<ColorControl
											key={slot}
											label={SLOT_LABELS[ slot ]}
											color={draftColors?.[ slot ] || '#000000'}
											onChange={(color) => setDraftColor(slot, color)}
										/>
									))}
								</div>
							</CardBody>
						</Card>
					))}
				</div>
				<div className="minimal-map-styles__preview">
					<div className="minimal-map-styles__preview-sticky">
						<Card className="minimal-map-styles__preview-card">
							<CardBody>
								<div
									ref={mapHostRef}
									className="minimal-map-styles__preview-surface"
								/>
							</CardBody>
						</Card>
					</div>
				</div>
			</div>
		</div>
	);
}
