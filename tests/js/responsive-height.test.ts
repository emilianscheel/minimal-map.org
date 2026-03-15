import { describe, expect, test } from 'bun:test';
import { getActiveHeightCssValue, MOBILE_BREAKPOINT } from '../../src/map/responsive';

describe('responsive map height helpers', () => {
	test('uses the desktop height above the mobile breakpoint', () => {
		expect(
			getActiveHeightCssValue(
				{
					heightCssValue: '420px',
					heightMobileCssValue: '280px',
				},
				MOBILE_BREAKPOINT + 1
			)
		).toBe('420px');
	});

	test('uses the mobile height at or below the mobile breakpoint', () => {
		expect(
			getActiveHeightCssValue(
				{
					heightCssValue: '420px',
					heightMobileCssValue: '280px',
				},
				MOBILE_BREAKPOINT
			)
		).toBe('280px');
	});
});
