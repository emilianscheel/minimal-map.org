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
	});

	test('uses the updated default search input border radius', () => {
		const config = normalizeMapConfig();

		expect(config.searchPanelBorderRadiusInput).toBe('10px');
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
	});
});
