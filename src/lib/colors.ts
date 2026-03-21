/**
 * Simple color manipulation utilities.
 */

/**
 * Darkens a hex color by a given percentage.
 *
 * @param hex     The hex color string (e.g., "#3FB1CE").
 * @param percent Percentage to darken (0-100).
 * @returns Darkened hex color string.
 */
export function darkenColor(hex: string, percent: number): string {
	const { r, g, b } = hexToRgb(hex);
	const factor = 1 - percent / 100;
	
	return rgbToHex(
		Math.round(r * factor),
		Math.round(g * factor),
		Math.round(b * factor)
	);
}

/**
 * Lightens a hex color by a given percentage.
 *
 * @param hex     The hex color string (e.g., "#3FB1CE").
 * @param percent Percentage to lighten (0-100).
 * @returns Lightened hex color string.
 */
export function lightenColor(hex: string, percent: number): string {
	const { r, g, b } = hexToRgb(hex);
	const factor = percent / 100;
	
	return rgbToHex(
		Math.round(r + (255 - r) * factor),
		Math.round(g + (255 - g) * factor),
		Math.round(b + (255 - b) * factor)
	);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
	const cleanHex = hex.replace('#', '');
	const bigint = parseInt(cleanHex, 16);
	
	if (cleanHex.length === 3) {
		const r = (bigint >> 8) & 0xf;
		const g = (bigint >> 4) & 0xf;
		const b = bigint & 0xf;
		return {
			r: (r << 4) | r,
			g: (g << 4) | g,
			b: (b << 4) | b,
		};
	}
	
	return {
		r: (bigint >> 16) & 255,
		g: (bigint >> 8) & 255,
		b: bigint & 255,
	};
}

function rgbToHex(r: number, g: number, b: number): string {
	const clamp = (val: number) => Math.max(0, Math.min(255, val));
	const toHex = (val: number) => clamp(val).toString(16).padStart(2, '0');
	return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
