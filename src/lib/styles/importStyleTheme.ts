import type { StyleThemeColors, StyleThemeSlot } from '../../types';
import { POSITRON_THEME_MANIFEST, type StyleThemeManifestEntry } from './themeEngine';

export interface ParsedThemeImport {
	label: string;
	colors: StyleThemeColors;
	format: 'internal' | 'maplibre';
	warningSlots: StyleThemeSlot[];
}

interface ParseThemeImportOptions {
	defaultColors: StyleThemeColors;
	fileName: string;
}

interface MapLibreStyleLayer {
	id?: unknown;
	type?: unknown;
	source?: unknown;
	'source-layer'?: unknown;
	paint?: Record<string, unknown> | null;
	filter?: unknown;
	metadata?: unknown;
}

interface LayerContext {
	layer: MapLibreStyleLayer;
	id: string;
	type: string;
	source: string;
	sourceLayer: string;
	haystack: string;
}

interface SemanticCandidate {
	property: StyleThemeManifestEntry['property'];
	matches: (context: LayerContext) => boolean;
}

const CORE_REQUIRED_SLOTS: StyleThemeSlot[] = [
	'background',
	'water',
	'building',
	'roadMinor',
	'placeLabel',
];

function isRecord(value: unknown): value is Record<string, unknown> {
	return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function createLayerContext(layer: MapLibreStyleLayer): LayerContext {
	const id = typeof layer.id === 'string' ? layer.id.toLowerCase() : '';
	const type = typeof layer.type === 'string' ? layer.type.toLowerCase() : '';
	const source = typeof layer.source === 'string' ? layer.source.toLowerCase() : '';
	const sourceLayer = typeof layer['source-layer'] === 'string' ? layer['source-layer'].toLowerCase() : '';
	const filter = layer.filter ? JSON.stringify(layer.filter).toLowerCase() : '';
	const metadata = layer.metadata ? JSON.stringify(layer.metadata).toLowerCase() : '';
	const haystack = [ id, type, source, sourceLayer, filter, metadata ].filter(Boolean).join(' ');

	return {
		layer,
		id,
		type,
		source,
		sourceLayer,
		haystack,
	};
}

function getFileBaseName(fileName: string): string {
	const trimmed = fileName.trim();
	const withoutExtension = trimmed.replace(/\.[^.]+$/, '');

	return withoutExtension || 'Imported';
}

function getImportedLabel(label: string): string {
	return `${label} (Imported)`;
}

function hasAny(context: LayerContext, patterns: string[]): boolean {
	return patterns.some((pattern) => context.haystack.includes(pattern));
}

function isFill(context: LayerContext): boolean {
	return context.type === 'fill';
}

function isLine(context: LayerContext): boolean {
	return context.type === 'line';
}

function isSymbol(context: LayerContext): boolean {
	return context.type === 'symbol';
}

function isBackground(context: LayerContext): boolean {
	return context.type === 'background';
}

const SLOT_FALLBACKS: Record<StyleThemeSlot, SemanticCandidate[]> = {
	background: [
		{
			property: 'background-color',
			matches: (context) => isBackground(context) || context.id === 'background',
		},
	],
	park: [
		{
			property: 'fill-color',
			matches: (context) =>
				isFill(context) &&
				(hasAny(context, [ 'park', 'recreation', 'grass', 'garden' ]) || context.sourceLayer === 'park'),
		},
	],
	residential: [
		{
			property: 'fill-color',
			matches: (context) =>
				isFill(context) &&
				(hasAny(context, [ 'landuse_residential', 'residential', 'neighbourhood', 'neighborhood', 'suburb' ]) ||
					context.sourceLayer === 'landuse'),
		},
	],
	forest: [
		{
			property: 'fill-color',
			matches: (context) =>
				isFill(context) &&
				hasAny(context, [ 'forest', 'wood', 'wooded', 'tree', 'landcover_wood' ]),
		},
	],
	ice: [
		{
			property: 'fill-color',
			matches: (context) => isFill(context) && hasAny(context, [ 'ice', 'glacier' ]),
		},
	],
	water: [
		{
			property: 'fill-color',
			matches: (context) =>
				isFill(context) &&
				(context.sourceLayer === 'water' || hasAny(context, [ 'water', 'ocean', 'lake', 'riverbank' ])),
		},
	],
	waterway: [
		{
			property: 'line-color',
			matches: (context) =>
				isLine(context) &&
				(context.sourceLayer === 'waterway' || hasAny(context, [ 'waterway', 'river', 'stream', 'canal' ])),
		},
	],
	building: [
		{
			property: 'fill-color',
			matches: (context) =>
				isFill(context) &&
				(context.sourceLayer === 'building' || hasAny(context, [ 'building' ])),
		},
	],
	buildingOutline: [
		{
			property: 'fill-outline-color',
			matches: (context) =>
				isFill(context) &&
				(context.sourceLayer === 'building' || hasAny(context, [ 'building' ])),
		},
		{
			property: 'line-color',
			matches: (context) =>
				isLine(context) && hasAny(context, [ 'building_outline', 'building-outline', 'building outline' ]),
		},
	],
	path: [
		{
			property: 'line-color',
			matches: (context) =>
				isLine(context) && hasAny(context, [ 'path', 'footway', 'pedestrian', 'trail', 'cycleway', 'steps' ]),
		},
	],
	roadMinor: [
		{
			property: 'line-color',
			matches: (context) =>
				isLine(context) &&
				hasAny(context, [ 'highway_minor', 'minor', 'street', 'service', 'residential', 'tertiary', 'living_street' ]),
		},
	],
	roadMajorCasing: [
		{
			property: 'line-color',
			matches: (context) =>
				isLine(context) &&
				hasAny(context, [ 'major' ]) &&
				hasAny(context, [ 'casing', 'case', 'outline' ]),
		},
		{
			property: 'line-color',
			matches: (context) =>
				isLine(context) &&
				hasAny(context, [ 'primary', 'secondary', 'trunk' ]) &&
				hasAny(context, [ 'casing', 'case', 'outline' ]),
		},
	],
	roadMajorFill: [
		{
			property: 'line-color',
			matches: (context) =>
				isLine(context) &&
				hasAny(context, [ 'highway_major', 'major_inner', 'major' ]) &&
				!hasAny(context, [ 'casing', 'case', 'outline' ]),
		},
		{
			property: 'line-color',
			matches: (context) =>
				isLine(context) &&
				hasAny(context, [ 'primary', 'secondary', 'trunk' ]) &&
				!hasAny(context, [ 'casing', 'case', 'outline', 'motorway' ]),
		},
	],
	motorwayCasing: [
		{
			property: 'line-color',
			matches: (context) =>
				isLine(context) &&
				hasAny(context, [ 'motorway', 'freeway' ]) &&
				hasAny(context, [ 'casing', 'case', 'outline' ]),
		},
	],
	motorwayFill: [
		{
			property: 'line-color',
			matches: (context) =>
				isLine(context) &&
				hasAny(context, [ 'motorway', 'freeway' ]) &&
				!hasAny(context, [ 'casing', 'case', 'outline' ]),
		},
	],
	rail: [
		{
			property: 'line-color',
			matches: (context) =>
				isLine(context) &&
				hasAny(context, [ 'railway', 'transit', 'train', 'tram', 'subway' ]) &&
				!hasAny(context, [ 'dash', 'pattern' ]),
		},
	],
	railDash: [
		{
			property: 'line-color',
			matches: (context) =>
				isLine(context) &&
				hasAny(context, [ 'railway', 'transit' ]) &&
				hasAny(context, [ 'dash', 'pattern' ]),
		},
	],
	boundary: [
		{
			property: 'line-color',
			matches: (context) =>
				isLine(context) &&
				(context.sourceLayer === 'boundary' || hasAny(context, [ 'boundary', 'admin', 'disputed' ])),
		},
	],
	aerowayLine: [
		{
			property: 'line-color',
			matches: (context) =>
				isLine(context) &&
				(context.sourceLayer === 'aeroway' || hasAny(context, [ 'aeroway', 'runway', 'taxiway' ])),
		},
	],
	aerowayArea: [
		{
			property: 'fill-color',
			matches: (context) =>
				isFill(context) &&
				(context.sourceLayer === 'aeroway' || hasAny(context, [ 'aeroway', 'airport', 'runway', 'apron', 'taxiway' ])),
		},
	],
	waterLabel: [
		{
			property: 'text-color',
			matches: (context) =>
				isSymbol(context) &&
				(context.sourceLayer === 'water_name' || hasAny(context, [ 'water_name', 'waterway', 'marine', 'ocean', 'lake', 'river' ])),
		},
	],
	waterLabelHalo: [
		{
			property: 'text-halo-color',
			matches: (context) =>
				isSymbol(context) &&
				(context.sourceLayer === 'water_name' || hasAny(context, [ 'water_name', 'waterway', 'marine', 'ocean', 'lake', 'river' ])),
		},
	],
	roadLabel: [
		{
			property: 'text-color',
			matches: (context) =>
				isSymbol(context) &&
				(context.sourceLayer === 'transportation_name' || hasAny(context, [ 'road', 'street', 'highway', 'airport', 'transportation_name' ])),
		},
	],
	roadLabelHalo: [
		{
			property: 'text-halo-color',
			matches: (context) =>
				isSymbol(context) &&
				(context.sourceLayer === 'transportation_name' || hasAny(context, [ 'road', 'street', 'highway', 'airport', 'transportation_name' ])),
		},
	],
	placeLabel: [
		{
			property: 'text-color',
			matches: (context) =>
				isSymbol(context) &&
				(context.sourceLayer === 'place' || hasAny(context, [ 'place', 'city', 'town', 'village', 'country', 'state', 'settlement' ])),
		},
	],
	placeLabelHalo: [
		{
			property: 'text-halo-color',
			matches: (context) =>
				isSymbol(context) &&
				(context.sourceLayer === 'place' || hasAny(context, [ 'place', 'city', 'town', 'village', 'country', 'state', 'settlement' ])),
		},
	],
};

function findExactLayerColor(
	layers: LayerContext[],
	manifestEntries: StyleThemeManifestEntry[]
): string | null {
	for (const entry of manifestEntries) {
		const layer = layers.find((candidate) => candidate.id === entry.layerId.toLowerCase());
		if (!layer) {
			continue;
		}

		const color = readPaintColor(layer.layer, entry.property);
		if (color) {
			return color;
		}
	}

	return null;
}

function findSemanticLayerColor(
	layers: LayerContext[],
	candidates: SemanticCandidate[]
): string | null {
	for (const candidate of candidates) {
		for (const layer of layers) {
			if (!candidate.matches(layer)) {
				continue;
			}

			const color = readPaintColor(layer.layer, candidate.property);
			if (color) {
				return color;
			}
		}
	}

	return null;
}

function readPaintColor(layer: MapLibreStyleLayer, property: StyleThemeManifestEntry['property']): string | null {
	if (!isRecord(layer.paint)) {
		return null;
	}

	return normalizeColorValue(layer.paint[ property ]);
}

function normalizeColorValue(value: unknown): string | null {
	if (typeof value === 'string') {
		return parseColorString(value);
	}

	if (Array.isArray(value)) {
		return parseExpressionColor(value);
	}

	if (isRecord(value) && Array.isArray(value.stops)) {
		return parseStopsColor(value.stops);
	}

	return null;
}

function parseExpressionColor(expression: unknown[]): string | null {
	if (expression.length === 0 || typeof expression[0] !== 'string') {
		return findFirstNestedColor(expression);
	}

	if (expression[0] === 'interpolate') {
		const stops: [ number, string ][] = [];

		for (let index = 3; index < expression.length; index += 2) {
			const stop = expression[ index ];
			const output = expression[ index + 1 ];

			if (typeof stop !== 'number') {
				continue;
			}

			const color = normalizeColorValue(output);
			if (color) {
				stops.push([ stop, color ]);
			}
		}

		return chooseZoomStopColor(stops);
	}

	if (expression[0] === 'step') {
		const stops: [ number, string ][] = [];

		for (let index = 3; index < expression.length; index += 2) {
			const stop = expression[ index ];
			const output = expression[ index + 1 ];

			if (typeof stop !== 'number') {
				continue;
			}

			const color = normalizeColorValue(output);
			if (color) {
				stops.push([ stop, color ]);
			}
		}

		return chooseZoomStopColor(stops) || normalizeColorValue(expression[2]);
	}

	return findFirstNestedColor(expression.slice(1));
}

function parseStopsColor(stops: unknown[]): string | null {
	const normalizedStops: [ number, string ][] = [];

	for (const stopEntry of stops) {
		if (!Array.isArray(stopEntry) || stopEntry.length < 2 || typeof stopEntry[0] !== 'number') {
			continue;
		}

		const color = normalizeColorValue(stopEntry[1]);
		if (color) {
			normalizedStops.push([ stopEntry[0], color ]);
		}
	}

	return chooseZoomStopColor(normalizedStops);
}

function chooseZoomStopColor(stops: [ number, string ][]): string | null {
	if (stops.length === 0) {
		return null;
	}

	const matchingStops = stops.filter(([ stop ]) => stop <= 12);

	if (matchingStops.length > 0) {
		return matchingStops[ matchingStops.length - 1 ][1];
	}

	return stops[0][1];
}

function findFirstNestedColor(values: unknown[]): string | null {
	for (const value of values) {
		const color = normalizeColorValue(value);
		if (color) {
			return color;
		}
	}

	return null;
}

function parseColorString(input: string): string | null {
	const value = input.trim();

	if (!value) {
		return null;
	}

	const hexMatch = value.match(/^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i);
	if (hexMatch) {
		return normalizeHexColor(hexMatch[1]);
	}

	const functionalMatch = value.match(/^([a-z]+)\((.*)\)$/i);
	if (!functionalMatch) {
		return null;
	}

	const fnName = functionalMatch[1].toLowerCase();
	const rawArgs = functionalMatch[2].trim();

	if (fnName === 'rgb' || fnName === 'rgba') {
		return normalizeRgbColor(rawArgs);
	}

	if (fnName === 'hsl' || fnName === 'hsla') {
		return normalizeHslColor(rawArgs);
	}

	return null;
}

function normalizeHexColor(hexValue: string): string | null {
	const hex = hexValue.toLowerCase();

	if (hex.length === 3) {
		return `#${hex.split('').map((char) => `${char}${char}`).join('')}`;
	}

	if (hex.length === 4) {
		const [ r, g, b, a ] = hex.split('').map((char) => parseInt(`${char}${char}`, 16));

		return rgbToHex(compositeOnWhite(r, g, b, a / 255));
	}

	if (hex.length === 6) {
		return `#${hex}`;
	}

	if (hex.length === 8) {
		const r = parseInt(hex.slice(0, 2), 16);
		const g = parseInt(hex.slice(2, 4), 16);
		const b = parseInt(hex.slice(4, 6), 16);
		const a = parseInt(hex.slice(6, 8), 16) / 255;

		return rgbToHex(compositeOnWhite(r, g, b, a));
	}

	return null;
}

function normalizeRgbColor(rawArgs: string): string | null {
	const alphaSplit = rawArgs.replace(/\s*\/\s*/g, ',').split(',').map((part) => part.trim()).filter(Boolean);
	const spaceSplit = rawArgs.trim().split(/\s+/).filter(Boolean);
	const parts = alphaSplit.length >= 3 ? alphaSplit : spaceSplit;

	if (parts.length < 3) {
		return null;
	}

	const red = parseRgbChannel(parts[0]);
	const green = parseRgbChannel(parts[1]);
	const blue = parseRgbChannel(parts[2]);
	const alpha = parts[3] !== undefined ? parseAlphaChannel(parts[3]) : 1;

	if ([ red, green, blue, alpha ].some((part) => part === null)) {
		return null;
	}

	return rgbToHex(compositeOnWhite(red as number, green as number, blue as number, alpha as number));
}

function normalizeHslColor(rawArgs: string): string | null {
	const alphaSplit = rawArgs.replace(/\s*\/\s*/g, ',').split(',').map((part) => part.trim()).filter(Boolean);
	const spaceSplit = rawArgs.trim().split(/\s+/).filter(Boolean);
	const parts = alphaSplit.length >= 3 ? alphaSplit : spaceSplit;

	if (parts.length < 3) {
		return null;
	}

	const hue = parseFloat(parts[0]);
	const saturation = parsePercentage(parts[1]);
	const lightness = parsePercentage(parts[2]);
	const alpha = parts[3] !== undefined ? parseAlphaChannel(parts[3]) : 1;

	if ([ hue, saturation, lightness ].some((part) => Number.isNaN(part)) || alpha === null) {
		return null;
	}

	const rgb = hslToRgb(hue, saturation as number, lightness as number);

	return rgbToHex(compositeOnWhite(rgb[0], rgb[1], rgb[2], alpha as number));
}

function parseRgbChannel(value: string): number | null {
	if (value.endsWith('%')) {
		const percentage = parseFloat(value.slice(0, -1));
		if (Number.isNaN(percentage)) {
			return null;
		}

		return clamp(Math.round((percentage / 100) * 255), 0, 255);
	}

	const channel = parseFloat(value);

	if (Number.isNaN(channel)) {
		return null;
	}

	return clamp(Math.round(channel), 0, 255);
}

function parsePercentage(value: string): number {
	return clamp(parseFloat(value.replace('%', '')), 0, 100) / 100;
}

function parseAlphaChannel(value: string): number | null {
	if (value.endsWith('%')) {
		const percentage = parseFloat(value.slice(0, -1));

		if (Number.isNaN(percentage)) {
			return null;
		}

		return clamp(percentage / 100, 0, 1);
	}

	const alpha = parseFloat(value);

	if (Number.isNaN(alpha)) {
		return null;
	}

	return clamp(alpha, 0, 1);
}

function hslToRgb(hue: number, saturation: number, lightness: number): [ number, number, number ] {
	const normalizedHue = ((hue % 360) + 360) % 360;
	const chroma = (1 - Math.abs((2 * lightness) - 1)) * saturation;
	const huePrime = normalizedHue / 60;
	const x = chroma * (1 - Math.abs((huePrime % 2) - 1));
	let red = 0;
	let green = 0;
	let blue = 0;

	if (huePrime >= 0 && huePrime < 1) {
		red = chroma;
		green = x;
	} else if (huePrime < 2) {
		red = x;
		green = chroma;
	} else if (huePrime < 3) {
		green = chroma;
		blue = x;
	} else if (huePrime < 4) {
		green = x;
		blue = chroma;
	} else if (huePrime < 5) {
		red = x;
		blue = chroma;
	} else {
		red = chroma;
		blue = x;
	}

	const match = lightness - chroma / 2;

	return [
		Math.round((red + match) * 255),
		Math.round((green + match) * 255),
		Math.round((blue + match) * 255),
	];
}

function compositeOnWhite(red: number, green: number, blue: number, alpha: number): [ number, number, number ] {
	return [
		Math.round((alpha * red) + ((1 - alpha) * 255)),
		Math.round((alpha * green) + ((1 - alpha) * 255)),
		Math.round((alpha * blue) + ((1 - alpha) * 255)),
	];
}

function rgbToHex([ red, green, blue ]: [ number, number, number ]): string {
	return `#${[ red, green, blue ].map((value) => clamp(value, 0, 255).toString(16).padStart(2, '0')).join('')}`;
}

function clamp(value: number, minimum: number, maximum: number): number {
	return Math.min(Math.max(value, minimum), maximum);
}

function normalizeImportedColors(
	rawColors: Record<string, unknown>,
	defaultColors: StyleThemeColors
): StyleThemeColors {
	const entries = Object.keys(defaultColors).map((slot) => {
		const normalized = normalizeColorValue(rawColors[ slot ]);

		return [ slot, normalized || defaultColors[ slot as StyleThemeSlot ] ] as const;
	});

	return Object.fromEntries(entries) as StyleThemeColors;
}

function isInternalThemeImport(value: unknown): value is { label?: unknown; colors: Record<string, unknown> } {
	return isRecord(value) && isRecord(value.colors);
}

function isMapLibreStyleImport(value: unknown): value is { version: number; name?: unknown; layers: MapLibreStyleLayer[] } {
	return isRecord(value) && value.version === 8 && Array.isArray(value.layers);
}

function resolveMapLibreColors(
	layers: MapLibreStyleLayer[],
	defaultColors: StyleThemeColors
): { colors: StyleThemeColors; warningSlots: StyleThemeSlot[] } {
	const contexts = layers.map(createLayerContext);
	const entries = Object.keys(defaultColors).map((slot) => {
		const manifestColor = findExactLayerColor(contexts, POSITRON_THEME_MANIFEST[ slot as StyleThemeSlot ] || []);
		const semanticColor = manifestColor ? null : findSemanticLayerColor(contexts, SLOT_FALLBACKS[ slot as StyleThemeSlot ] || []);
		const resolvedColor = manifestColor || semanticColor || defaultColors[ slot as StyleThemeSlot ];
		const fromDefault = !manifestColor && !semanticColor;

		return {
			slot: slot as StyleThemeSlot,
			color: resolvedColor,
			fromDefault,
		};
	});

	const missingCoreSlot = entries.find((entry) => entry.fromDefault && CORE_REQUIRED_SLOTS.includes(entry.slot));
	if (missingCoreSlot) {
		throw new Error('This MapLibre style file is not compatible with Minimal Map.');
	}

	return {
		colors: Object.fromEntries(entries.map((entry) => [ entry.slot, entry.color ])) as StyleThemeColors,
		warningSlots: entries.filter((entry) => entry.fromDefault).map((entry) => entry.slot),
	};
}

export function parseThemeImport(
	input: unknown,
	options: ParseThemeImportOptions
): ParsedThemeImport {
	const baseLabel = getFileBaseName(options.fileName);

	if (isInternalThemeImport(input)) {
		return {
			label: getImportedLabel(typeof input.label === 'string' && input.label.trim() ? input.label.trim() : baseLabel),
			colors: normalizeImportedColors(input.colors, options.defaultColors),
			format: 'internal',
			warningSlots: [],
		};
	}

	if (isMapLibreStyleImport(input)) {
		const styleLabel = typeof input.name === 'string' && input.name.trim() ? input.name.trim() : baseLabel;
		const { colors, warningSlots } = resolveMapLibreColors(input.layers, options.defaultColors);

		return {
			label: getImportedLabel(styleLabel),
			colors,
			format: 'maplibre',
			warningSlots,
		};
	}

	throw new Error('Unsupported theme file. Upload a Minimal Map theme JSON or a MapLibre style JSON v8 file.');
}
