import { describe, expect, test } from 'bun:test';
import type { StyleThemeColors } from '../../src/types';
import { parseThemeImport } from '../../src/lib/styles/importStyleTheme';
import { DEFAULT_POSITRON_THEME_COLORS } from '../../src/lib/styles/defaultThemeColors';

const DEFAULTS: StyleThemeColors = DEFAULT_POSITRON_THEME_COLORS;

describe('style import parsing', () => {
	test('imports existing internal theme files unchanged in shape', () => {
		const parsed = parseThemeImport(
			{
				label: 'Studio',
				colors: {
					...DEFAULTS,
					background: '#112233',
				},
			},
			{
				defaultColors: DEFAULTS,
				fileName: 'studio-theme.json',
			}
		);

		expect(parsed.format).toBe('internal');
		expect(parsed.label).toBe('Studio (Imported)');
		expect(parsed.colors.background).toBe('#112233');
		expect(parsed.warningSlots).toEqual([]);
	});

	test('imports a Positron-style MapLibre document into theme slots', () => {
		const parsed = parseThemeImport(
			{
				version: 8,
				name: 'Positron Official',
				layers: [
					{ id: 'background', type: 'background', paint: { 'background-color': 'rgb(242,243,240)' } },
					{ id: 'park', type: 'fill', 'source-layer': 'park', paint: { 'fill-color': 'rgb(230, 233, 229)' } },
					{ id: 'water', type: 'fill', 'source-layer': 'water', paint: { 'fill-color': 'rgb(194, 200, 202)' } },
					{ id: 'building', type: 'fill', 'source-layer': 'building', paint: { 'fill-color': 'rgb(234, 234, 229)', 'fill-outline-color': 'rgb(219, 219, 218)' } },
					{ id: 'highway_minor', type: 'line', 'source-layer': 'transportation', paint: { 'line-color': '#dddddd' } },
					{ id: 'label_city', type: 'symbol', 'source-layer': 'place', paint: { 'text-color': '#000000', 'text-halo-color': '#ffffff' } },
				],
			},
			{
				defaultColors: DEFAULTS,
				fileName: 'positron.json',
			}
		);

		expect(parsed.format).toBe('maplibre');
		expect(parsed.label).toBe('Positron Official (Imported)');
		expect(parsed.colors.background).toBe('#f2f3f0');
		expect(parsed.colors.park).toBe('#e6e9e5');
		expect(parsed.colors.water).toBe('#c2c8ca');
		expect(parsed.colors.building).toBe('#eaeae5');
		expect(parsed.colors.buildingOutline).toBe('#dbdbda');
		expect(parsed.colors.roadMinor).toBe('#dddddd');
		expect(parsed.colors.placeLabel).toBe('#000000');
		expect(parsed.colors.placeLabelHalo).toBe('#ffffff');
	});

	test('normalizes rgba and hsl colors to opaque hex', () => {
		const parsed = parseThemeImport(
			{
				version: 8,
				name: 'Color Functions',
				layers: [
					{ id: 'background', type: 'background', paint: { 'background-color': 'rgba(0, 0, 0, 0.5)' } },
					{ id: 'water', type: 'fill', 'source-layer': 'water', paint: { 'fill-color': 'hsl(200, 50%, 50%)' } },
					{ id: 'building', type: 'fill', 'source-layer': 'building', paint: { 'fill-color': '#123456', 'fill-outline-color': '#654321' } },
					{ id: 'highway_minor', type: 'line', 'source-layer': 'transportation', paint: { 'line-color': '#abcdef' } },
					{ id: 'label_city', type: 'symbol', 'source-layer': 'place', paint: { 'text-color': 'hsla(0, 0%, 0%, 0.25)', 'text-halo-color': '#ffffff' } },
				],
			},
			{
				defaultColors: DEFAULTS,
				fileName: 'functions.json',
			}
		);

		expect(parsed.colors.background).toBe('#808080');
		expect(parsed.colors.water).toBe('#4095bf');
		expect(parsed.colors.placeLabel).toBe('#bfbfbf');
	});

	test('resolves zoom expressions using the stop at or below zoom 12', () => {
		const parsed = parseThemeImport(
			{
				version: 8,
				name: 'Zoom Stops',
				layers: [
					{
						id: 'background',
						type: 'background',
						paint: { 'background-color': [ 'interpolate', [ 'linear' ], [ 'zoom' ], 5, '#111111', 12, '#222222', 14, '#333333' ] },
					},
					{
						id: 'water',
						type: 'fill',
						'source-layer': 'water',
						paint: { 'fill-color': { stops: [ [ 3, '#aaaaaa' ], [ 12, '#bbbbbb' ], [ 14, '#cccccc' ] ] } },
					},
					{ id: 'building', type: 'fill', 'source-layer': 'building', paint: { 'fill-color': '#123456', 'fill-outline-color': '#654321' } },
					{ id: 'highway_minor', type: 'line', 'source-layer': 'transportation', paint: { 'line-color': [ 'step', [ 'zoom' ], '#000000', 8, '#111111', 12, '#222222', 14, '#333333' ] } },
					{ id: 'label_city', type: 'symbol', 'source-layer': 'place', paint: { 'text-color': '#111111', 'text-halo-color': '#ffffff' } },
				],
			},
			{
				defaultColors: DEFAULTS,
				fileName: 'zoom.json',
			}
		);

		expect(parsed.colors.background).toBe('#222222');
		expect(parsed.colors.water).toBe('#bbbbbb');
		expect(parsed.colors.roadMinor).toBe('#222222');
	});

	test('warns when non-core slots fall back to defaults', () => {
		const parsed = parseThemeImport(
			{
				version: 8,
				name: 'Partial Style',
				layers: [
					{ id: 'background', type: 'background', paint: { 'background-color': '#010203' } },
					{ id: 'water', type: 'fill', 'source-layer': 'water', paint: { 'fill-color': '#040506' } },
					{ id: 'building', type: 'fill', 'source-layer': 'building', paint: { 'fill-color': '#070809', 'fill-outline-color': '#0a0b0c' } },
					{ id: 'highway_minor', type: 'line', 'source-layer': 'transportation', paint: { 'line-color': '#0d0e0f' } },
					{ id: 'label_city', type: 'symbol', 'source-layer': 'place', paint: { 'text-color': '#101112', 'text-halo-color': '#ffffff' } },
				],
			},
			{
				defaultColors: DEFAULTS,
				fileName: 'partial.json',
			}
		);

		expect(parsed.warningSlots).toContain('park');
		expect(parsed.warningSlots).toContain('roadMajorFill');
		expect(parsed.warningSlots).not.toContain('background');
		expect(parsed.warningSlots).not.toContain('placeLabel');
		expect(parsed.colors.park).toBe(DEFAULTS.park);
	});

	test('rejects incompatible MapLibre style files that miss required core slots', () => {
		expect(() =>
			parseThemeImport(
				{
					version: 8,
					name: 'Incompatible',
					layers: [
						{ id: 'background', type: 'background', paint: { 'background-color': '#010203' } },
						{ id: 'water', type: 'fill', 'source-layer': 'water', paint: { 'fill-color': '#040506' } },
					],
				},
				{
					defaultColors: DEFAULTS,
					fileName: 'incompatible.json',
				}
			)
		).toThrow('This MapLibre style file is not compatible with Minimal Map.');
	});

	test('rejects unsupported JSON shapes', () => {
		expect(() =>
			parseThemeImport(
				{ foo: 'bar' },
				{
					defaultColors: DEFAULTS,
					fileName: 'unknown.json',
				}
			)
		).toThrow('Unsupported theme file. Upload a Minimal Map theme JSON or a MapLibre style JSON v8 file.');
	});
});
