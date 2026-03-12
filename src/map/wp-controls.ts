import type { Map as MapLibreMap } from 'maplibre-gl';
import { __ } from '@wordpress/i18n';
import { getZoomControlRuntimeIconSvg } from './zoom-control-options';
import type { NormalizedMapConfig, WordPressZoomControls } from '../types';

function applyControlStyles(controls: HTMLDivElement, config: NormalizedMapConfig): void {
	controls.dataset.position = config.zoomControlsPosition;
	controls.style.setProperty('--minimal-map-controls-margin-top', config.zoomControlsOuterMargin.top);
	controls.style.setProperty('--minimal-map-controls-margin-right', config.zoomControlsOuterMargin.right);
	controls.style.setProperty('--minimal-map-controls-margin-bottom', config.zoomControlsOuterMargin.bottom);
	controls.style.setProperty('--minimal-map-controls-margin-left', config.zoomControlsOuterMargin.left);
	controls.style.setProperty('--minimal-map-controls-button-padding-top', config.zoomControlsPadding.top);
	controls.style.setProperty('--minimal-map-controls-button-padding-right', config.zoomControlsPadding.right);
	controls.style.setProperty('--minimal-map-controls-button-padding-bottom', config.zoomControlsPadding.bottom);
	controls.style.setProperty('--minimal-map-controls-button-padding-left', config.zoomControlsPadding.left);
	controls.style.setProperty('--minimal-map-controls-button-background', config.zoomControlsBackgroundColor);
	controls.style.setProperty('--minimal-map-controls-button-color', config.zoomControlsIconColor);
	controls.style.setProperty('--minimal-map-controls-button-border-radius', config.zoomControlsBorderRadius);
	controls.style.setProperty('--minimal-map-controls-button-border-color', config.zoomControlsBorderColor);
	controls.style.setProperty('--minimal-map-controls-button-border-width', config.zoomControlsBorderWidth);
}

function createControlButton(label: string, icon: string, onClick: () => void): HTMLButtonElement {
	const button = document.createElement('button');
	const iconWrap = document.createElement('span');

	button.type = 'button';
	button.className = 'minimal-map-controls__button';
	button.setAttribute('aria-label', label);
	button.addEventListener('click', onClick);

	iconWrap.className = 'minimal-map-controls__icon';
	iconWrap.innerHTML = icon;
	button.appendChild(iconWrap);

	return button;
}

export function createWordPressZoomControls(
	host: HTMLElement,
	map: MapLibreMap,
	config: NormalizedMapConfig
): WordPressZoomControls {
	const controls = document.createElement('div');

	controls.className = 'minimal-map-controls';
	applyControlStyles(controls, config);

	const zoomInButton = createControlButton(
		__( 'Zoom in', 'minimal-map' ),
		getZoomControlRuntimeIconSvg(config.zoomControlsPlusIcon),
		() => map.zoomIn()
	);
	const zoomOutButton = createControlButton(
		__( 'Zoom out', 'minimal-map' ),
		getZoomControlRuntimeIconSvg(config.zoomControlsMinusIcon),
		() => map.zoomOut()
	);

	controls.append(zoomInButton, zoomOutButton);
	host.appendChild(controls);

	return {
		destroy() {
			controls.remove();
		},
	};
}
