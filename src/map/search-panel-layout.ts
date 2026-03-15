import { getNodeDocument, getNodeWindow } from './dom-context';
import { MOBILE_BREAKPOINT } from './responsive';
import type { NormalizedMapConfig } from '../types';

export const DEFAULT_SEARCH_PANEL_WIDTH = '320px';

type SearchPanelConfig = Pick<
	NormalizedMapConfig,
	| 'allowSearch'
	| 'searchPanelBackgroundPrimary'
	| 'searchPanelBackgroundSecondary'
	| 'searchPanelBackgroundHover'
	| 'searchPanelForegroundPrimary'
	| 'searchPanelForegroundSecondary'
	| 'searchPanelOuterMargin'
	| 'searchPanelBorderRadiusInput'
	| 'searchPanelBorderRadiusCard'
	| 'searchPanelCardGap'
	| 'searchPanelWidth'
	| 'googleMapsButtonPadding'
	| 'googleMapsButtonBackgroundColor'
	| 'googleMapsButtonForegroundColor'
	| 'googleMapsButtonBorderRadius'
>;

function parsePixelValue(value: string): number {
	const match = value.trim().match(/^(-?\d*\.?\d+)px$/i);

	return match ? Number(match[1]) : 0;
}

export function applySearchPanelCssVariables(
	target: HTMLElement,
	config: SearchPanelConfig
): void {
	target.style.setProperty('--minimal-map-search-width', config.searchPanelWidth);
	target.style.setProperty(
		'--minimal-map-search-background-primary',
		config.searchPanelBackgroundPrimary
	);
	target.style.setProperty(
		'--minimal-map-search-background-secondary',
		config.searchPanelBackgroundSecondary
	);
	target.style.setProperty(
		'--minimal-map-search-background-hover',
		config.searchPanelBackgroundHover
	);
	target.style.setProperty(
		'--minimal-map-search-foreground-primary',
		config.searchPanelForegroundPrimary
	);
	target.style.setProperty(
		'--minimal-map-search-foreground-secondary',
		config.searchPanelForegroundSecondary
	);
	target.style.setProperty(
		'--minimal-map-search-margin-top',
		config.searchPanelOuterMargin.top
	);
	target.style.setProperty(
		'--minimal-map-search-margin-right',
		config.searchPanelOuterMargin.right
	);
	target.style.setProperty(
		'--minimal-map-search-margin-bottom',
		config.searchPanelOuterMargin.bottom
	);
	target.style.setProperty(
		'--minimal-map-search-margin-left',
		config.searchPanelOuterMargin.left
	);
	target.style.setProperty(
		'--minimal-map-search-gap',
		config.searchPanelOuterMargin.top
	);
	target.style.setProperty(
		'--minimal-map-search-input-radius',
		config.searchPanelBorderRadiusInput
	);
	target.style.setProperty(
		'--minimal-map-search-card-radius',
		config.searchPanelBorderRadiusCard
	);
	target.style.setProperty(
		'--minimal-map-search-card-gap',
		config.searchPanelCardGap
	);
	target.style.setProperty(
		'--minimal-map-google-maps-button-padding-top',
		config.googleMapsButtonPadding.top ?? ''
	);
	target.style.setProperty(
		'--minimal-map-google-maps-button-padding-right',
		config.googleMapsButtonPadding.right ?? ''
	);
	target.style.setProperty(
		'--minimal-map-google-maps-button-padding-bottom',
		config.googleMapsButtonPadding.bottom ?? ''
	);
	target.style.setProperty(
		'--minimal-map-google-maps-button-padding-left',
		config.googleMapsButtonPadding.left ?? ''
	);
	target.style.setProperty(
		'--minimal-map-google-maps-button-background',
		config.googleMapsButtonBackgroundColor
	);
	target.style.setProperty(
		'--minimal-map-google-maps-button-color',
		config.googleMapsButtonForegroundColor
	);
	target.style.setProperty(
		'--minimal-map-google-maps-button-border-radius',
		config.googleMapsButtonBorderRadius
	);
}

export function getSearchPanelDesktopPadding(
	config: Pick<
		NormalizedMapConfig,
		'allowSearch' | 'searchPanelOuterMargin' | 'searchPanelWidth'
	>,
	searchHost?: HTMLElement | null
): number {
	const hostWindow = getNodeWindow(searchHost) ?? (typeof window !== 'undefined' ? window : null);

	if (
		!config.allowSearch ||
		(hostWindow !== null && hostWindow.innerWidth <= MOBILE_BREAKPOINT)
	) {
		return 0;
	}

	if (searchHost && getNodeDocument(searchHost)) {
		const doc = getNodeDocument(searchHost) as Document;
		const measure = doc.createElement('div');
		measure.style.position = 'absolute';
		measure.style.top = '0';
		measure.style.left = '0';
		measure.style.width =
			'calc(var(--minimal-map-search-width) + var(--minimal-map-search-margin-left) + var(--minimal-map-search-margin-right))';
		measure.style.height = '0';
		measure.style.visibility = 'hidden';
		measure.style.pointerEvents = 'none';
		measure.setAttribute('aria-hidden', 'true');
		searchHost.appendChild(measure);
		const width = Math.ceil(measure.getBoundingClientRect().width);
		measure.remove();

		if (width > 0) {
			return width;
		}
	}

	return (
		parsePixelValue(config.searchPanelWidth || DEFAULT_SEARCH_PANEL_WIDTH) +
		parsePixelValue(config.searchPanelOuterMargin.left) +
		parsePixelValue(config.searchPanelOuterMargin.right)
	);
}
