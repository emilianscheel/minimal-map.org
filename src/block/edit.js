import {
	InspectorControls,
	useBlockProps,
} from '@wordpress/block-editor';
import {
	PanelBody,
	RangeControl,
	SelectControl,
	TextControl,
	ToggleControl,
} from '@wordpress/components';
import { useEffect, useMemo, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { createMinimalMap } from '../map/bootstrap';
import { normalizeMapConfig } from '../map/defaults';
import { getStyleOptions } from '../map/style-presets';

const runtimeConfig = window.MinimalMapBlockConfig || {};

export default function Edit({ attributes, setAttributes }) {
	const mapRef = useRef(null);
	const mapInstanceRef = useRef(null);
	const styleOptions = useMemo(
		() => getStyleOptions(runtimeConfig.stylePresets),
		[]
	);
	const config = useMemo(
		() => normalizeMapConfig(attributes, runtimeConfig),
		[attributes]
	);
	const blockProps = useBlockProps({ className: 'minimal-map-editor' });

	useEffect(() => {
		if (!mapRef.current) {
			return undefined;
		}

		mapInstanceRef.current = createMinimalMap(mapRef.current, config, runtimeConfig);

		return () => {
			if (mapInstanceRef.current) {
				mapInstanceRef.current.destroy();
				mapInstanceRef.current = null;
			}
		};
	}, []);

	useEffect(() => {
		if (mapInstanceRef.current) {
			mapInstanceRef.current.update(config);
		}
	}, [config]);

	const updateNumberAttribute = (key) => (value) => {
		const numericValue = Number(value);

		setAttributes({
			[key]: Number.isNaN(numericValue) ? attributes[key] : numericValue,
		});
	};

	return (
		<>
			<InspectorControls>
				<PanelBody title={__('Map Settings', 'minimal-map')} initialOpen>
					<TextControl
						label={__('Center Latitude', 'minimal-map')}
						type="number"
						step="0.000001"
						value={attributes.centerLat}
						onChange={updateNumberAttribute('centerLat')}
					/>
					<TextControl
						label={__('Center Longitude', 'minimal-map')}
						type="number"
						step="0.000001"
						value={attributes.centerLng}
						onChange={updateNumberAttribute('centerLng')}
					/>
					<RangeControl
						label={__('Zoom', 'minimal-map')}
						value={attributes.zoom}
						onChange={(value) => setAttributes({ zoom: value })}
						min={0}
						max={22}
						step={0.5}
					/>
					<TextControl
						label={__('Map Height (px)', 'minimal-map')}
						type="number"
						min="240"
						step="10"
						value={attributes.height}
						onChange={updateNumberAttribute('height')}
					/>
					<SelectControl
						label={__('Style', 'minimal-map')}
						value={attributes.stylePreset}
						options={styleOptions}
						onChange={(value) => setAttributes({ stylePreset: value })}
					/>
					<ToggleControl
						label={__('Show Zoom Controls', 'minimal-map')}
						checked={attributes.showZoomControls}
						onChange={(value) => setAttributes({ showZoomControls: value })}
					/>
				</PanelBody>
			</InspectorControls>
			<div {...blockProps}>
				<div ref={mapRef} className="minimal-map-editor__canvas" />
			</div>
		</>
	);
}
