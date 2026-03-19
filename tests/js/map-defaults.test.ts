import { describe, expect, test } from 'bun:test';
import { normalizeMapConfig } from '../../src/map/defaults';

describe('map defaults normalization', () => {
	test('uses the runtime mobile two-finger zoom default when provided', () => {
		const config = normalizeMapConfig(
			{},
			{
				defaults: {
					mobileTwoFingerZoom: false,
				},
			}
		);

		expect(config.mobileTwoFingerZoom).toBe(false);
	});

	test('falls back to enabled mobile two-finger zoom for shared maps without overrides', () => {
		const config = normalizeMapConfig();

		expect(config.mobileTwoFingerZoom).toBe(true);
	});

	test('falls back to enabled cooperative gestures for shared maps without overrides', () => {
		const config = normalizeMapConfig();

		expect(config.cooperativeGestures).toBe(true);
	});

	test('allows raw config to override the runtime cooperative gestures default', () => {
		const config = normalizeMapConfig(
			{
				cooperativeGestures: false,
			},
			{
				defaults: {
					cooperativeGestures: true,
				},
			}
		);

		expect(config.cooperativeGestures).toBe(false);
	});

	test('uses the runtime font family default when raw config leaves it blank', () => {
		const config = normalizeMapConfig(
			{
				fontFamily: '   ',
			},
			{
				defaults: {
					fontFamily: '"Fraunces", serif',
				},
			}
		);

		expect(config.fontFamily).toBe('"Fraunces", serif');
	});

	test('preserves an explicit font family override', () => {
		const config = normalizeMapConfig(
			{
				fontFamily: 'var(--font-body), "Helvetica Neue", sans-serif',
			},
			{
				defaults: {
					fontFamily: '"Fraunces", serif',
				},
			}
		);

		expect(config.fontFamily).toBe(
			'var(--font-body), "Helvetica Neue", sans-serif'
		);
	});

	test('preserves an explicit border radius override', () => {
		const config = normalizeMapConfig({
			borderRadius: '16px 24px 32px 40px',
		});

		expect(config.borderRadius).toBe('16px 24px 32px 40px');
	});

	test('falls back to the desktop height when no mobile height override is set', () => {
		const config = normalizeMapConfig({
			height: 480,
			heightUnit: 'px',
		});

		expect(config.heightMobile).toBeUndefined();
		expect(config.heightMobileCssValue).toBe('480px');
	});

	test('preserves an explicit mobile height override', () => {
		const config = normalizeMapConfig({
			height: 480,
			heightUnit: 'px',
			heightMobile: 60,
			heightMobileUnit: 'vh',
		});

		expect(config.heightMobile).toBe(60);
		expect(config.heightMobileUnit).toBe('vh');
		expect(config.heightMobileCssValue).toBe('60vh');
	});

	test('falls back cleanly when the mobile height unit is invalid', () => {
		const config = normalizeMapConfig({
			height: 480,
			heightUnit: 'px',
			heightMobile: 50,
			heightMobileUnit: 'bad-unit',
		});

		expect(config.heightMobileUnit).toBe('px');
		expect(config.heightMobileCssValue).toBe('50px');
	});

	test('preserves valid opening-hours status colors and falls back for invalid values', () => {
		const explicitConfig = normalizeMapConfig({
			openingHoursOpenColor: '#22863a',
			openingHoursClosedColor: '#cf222e',
		});
		const fallbackConfig = normalizeMapConfig({
			openingHoursOpenColor: 'green',
			openingHoursClosedColor: 'red',
		});

		expect(explicitConfig.openingHoursOpenColor).toBe('#22863a');
		expect(explicitConfig.openingHoursClosedColor).toBe('#cf222e');
		expect(fallbackConfig.openingHoursOpenColor).toBe('#1a7f37');
		expect(fallbackConfig.openingHoursClosedColor).toBe('#b32d2e');
	});

	test('allows raw config to override the runtime mobile two-finger zoom default', () => {
		const config = normalizeMapConfig(
			{
				mobileTwoFingerZoom: true,
			},
			{
				defaults: {
					mobileTwoFingerZoom: false,
				},
			}
		);

		expect(config.mobileTwoFingerZoom).toBe(true);
	});

	test('preserves valid credits styling values', () => {
		const config = normalizeMapConfig({
			creditsBackgroundColor: '#112233',
			creditsForegroundColor: '#fefefe',
			creditsBorderRadius: '12px 16px',
			creditsPadding: {
				top: '6px',
				right: '10px',
				bottom: '8px',
				left: '12px',
			},
			creditsOuterMargin: {
				top: '14px',
				right: '18px',
				bottom: '22px',
				left: '26px',
			},
		});

		expect(config.creditsBackgroundColor).toBe('#112233');
		expect(config.creditsForegroundColor).toBe('#fefefe');
		expect(config.creditsBorderRadius).toBe('12px 16px');
		expect(config.creditsPadding).toEqual({
			top: '6px',
			right: '10px',
			bottom: '8px',
			left: '12px',
		});
		expect(config.creditsOuterMargin).toEqual({
			top: '14px',
			right: '18px',
			bottom: '22px',
			left: '26px',
		});
	});

	test('falls back when credits styling values are invalid', () => {
		const config = normalizeMapConfig({
			creditsBackgroundColor: 'red',
			creditsForegroundColor: 'rgba(0,0,0,1)',
			creditsBorderRadius: 'oops nope',
			creditsPadding: {
				top: 'wide',
				right: '',
				bottom: '4pt',
				left: '2px',
			},
			creditsOuterMargin: {
				top: '1rem',
				right: 'auto',
				bottom: '-5px',
				left: '0',
			},
		});

		expect(config.creditsBackgroundColor).toBe('#ffffff');
		expect(config.creditsForegroundColor).toBe('#1e1e1e');
		expect(config.creditsBorderRadius).toBe('999px');
		expect(config.creditsPadding).toEqual({
			top: '4px',
			right: '8px',
			bottom: '4px',
			left: '2px',
		});
		expect(config.creditsOuterMargin).toEqual({
			top: '1rem',
			right: '16px',
			bottom: '16px',
			left: '0px',
		});
	});

	test('preserves valid search panel styling values', () => {
		const config = normalizeMapConfig({
			searchPanelBackgroundPrimary: '#112233',
			searchPanelBackgroundSecondary: '#223344',
			searchPanelBackgroundHover: '#334455',
			searchPanelForegroundPrimary: '#fefefe',
			searchPanelForegroundSecondary: '#ededed',
			searchPanelOuterMargin: {
				top: '10px',
				right: '14px',
				bottom: '18px',
				left: '22px',
			},
			searchPanelBorderRadiusInput: '12px 16px',
			searchPanelBorderRadiusCard: '8px',
			searchPanelCardGap: '20px',
			searchPanelWidth: '440px',
		});

		expect(config.searchPanelBackgroundPrimary).toBe('#112233');
		expect(config.searchPanelBackgroundSecondary).toBe('#223344');
		expect(config.searchPanelBackgroundHover).toBe('#334455');
		expect(config.searchPanelForegroundPrimary).toBe('#fefefe');
		expect(config.searchPanelForegroundSecondary).toBe('#ededed');
		expect(config.searchPanelOuterMargin).toEqual({
			top: '10px',
			right: '14px',
			bottom: '18px',
			left: '22px',
		});
		expect(config.searchPanelBorderRadiusInput).toBe('12px 16px');
		expect(config.searchPanelBorderRadiusCard).toBe('8px');
		expect(config.searchPanelCardGap).toBe('20px');
		expect(config.searchPanelWidth).toBe('440px');
	});

	test('uses the updated default search input border radius', () => {
		const config = normalizeMapConfig();

		expect(config.searchPanelBorderRadiusInput).toBe('10px');
		expect(config.searchPanelWidth).toBe('320px');
		expect(config.googleMapsNavigation).toBe(false);
		expect(config.inMapLocationCard).toBe(false);
		expect(config.googleMapsButtonShowIcon).toBe(true);
		expect(config.googleMapsButtonBorderRadius).toBe('18px');
		expect(config.googleMapsButtonPadding).toEqual({
			top: '5px',
			right: '8px',
			bottom: '5px',
			left: '8px',
		});
	});

	test('falls back when search panel styling values are invalid', () => {
		const config = normalizeMapConfig({
			searchPanelBackgroundPrimary: 'red',
			searchPanelBackgroundSecondary: 'rgba(0,0,0,1)',
			searchPanelBackgroundHover: 'rgb(1,2,3)',
			searchPanelForegroundPrimary: 'blue',
			searchPanelForegroundSecondary: 'hsl(1, 1%, 1%)',
			searchPanelOuterMargin: {
				top: 'wide',
				right: '',
				bottom: '4pt',
				left: '0',
			},
			searchPanelBorderRadiusInput: 'oops nope',
			searchPanelBorderRadiusCard: 'no thanks',
			searchPanelCardGap: 'auto',
			searchPanelWidth: 'fit-content',
		});

		expect(config.searchPanelBackgroundPrimary).toBe('#ffffff');
		expect(config.searchPanelBackgroundSecondary).toBe('#f0f0f1');
		expect(config.searchPanelBackgroundHover).toBe('#f8f8f8');
		expect(config.searchPanelForegroundPrimary).toBe('#1e1e1e');
		expect(config.searchPanelForegroundSecondary).toBe('#1e1e1e');
		expect(config.searchPanelOuterMargin).toEqual({
			top: '24px',
			right: '24px',
			bottom: '24px',
			left: '0px',
		});
		expect(config.searchPanelBorderRadiusInput).toBe('10px');
		expect(config.searchPanelBorderRadiusCard).toBe('2px');
		expect(config.searchPanelCardGap).toBe('12px');
		expect(config.searchPanelWidth).toBe('320px');
	});

	test('preserves valid Google Maps button styling values', () => {
		const config = normalizeMapConfig({
			googleMapsNavigation: true,
			inMapLocationCard: true,
			googleMapsButtonPadding: {
				top: '6px',
				right: '12px',
				bottom: '8px',
				left: '10px',
			},
			googleMapsButtonBackgroundColor: '#112233',
			googleMapsButtonForegroundColor: '#fefefe',
			googleMapsButtonBorderRadius: '12px 16px',
			googleMapsButtonShowIcon: false,
		});

		expect(config.googleMapsNavigation).toBe(true);
		expect(config.inMapLocationCard).toBe(true);
		expect(config.googleMapsButtonPadding).toEqual({
			top: '6px',
			right: '12px',
			bottom: '8px',
			left: '10px',
		});
		expect(config.googleMapsButtonBackgroundColor).toBe('#112233');
		expect(config.googleMapsButtonForegroundColor).toBe('#fefefe');
		expect(config.googleMapsButtonBorderRadius).toBe('12px 16px');
		expect(config.googleMapsButtonShowIcon).toBe(false);
	});

	test('falls back when Google Maps button styling values are invalid', () => {
		const config = normalizeMapConfig({
			googleMapsButtonPadding: {
				top: 'wide',
				right: '',
				bottom: '4pt',
				left: '2px',
			},
			googleMapsButtonBackgroundColor: 'red',
			googleMapsButtonForegroundColor: 'hsl(1, 1%, 1%)',
			googleMapsButtonBorderRadius: 'oops nope',
		});

		expect(config.googleMapsButtonPadding).toEqual({
			top: '5px',
			right: '8px',
			bottom: '5px',
			left: '2px',
		});
		expect(config.googleMapsButtonBackgroundColor).toBe('#f0f0f1');
		expect(config.googleMapsButtonForegroundColor).toBe('#1e1e1e');
		expect(config.googleMapsButtonBorderRadius).toBe('18px');
	});
});
