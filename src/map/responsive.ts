export const MOBILE_BREAKPOINT = 600;

export interface ResponsiveHeightConfig {
	heightCssValue: string;
	heightMobileCssValue: string;
}

export function formatHeightCssValue(value: number, unit: string): string {
	const rounded = Number(value.toFixed(4));

	return `${rounded}${unit}`;
}

export function isMobileViewport(viewportWidth?: number | null): boolean {
	return typeof viewportWidth === 'number' && viewportWidth <= MOBILE_BREAKPOINT;
}

export function getActiveHeightCssValue(
	config: ResponsiveHeightConfig,
	viewportWidth?: number | null
): string {
	return isMobileViewport(viewportWidth) ? config.heightMobileCssValue : config.heightCssValue;
}
