import { __ } from '@wordpress/i18n';
import type {
	CollectionsAdminConfig,
	LocationFormState,
	LocationsAdminConfig,
} from '../../types';
import { createCollection } from '../collections/createCollection';
import { createLocation } from './createLocation';
import { geocodeAddress } from './geocodeAddress';

export const COMMON_CSV_HEADERS = [
	'title',
	'street',
	'house_number',
	'postal_code',
	'city',
	'state',
	'country',
	'telephone',
	'email',
	'website',
	'latitude',
	'longitude',
] as const;

export const CUSTOM_CSV_MAPPING_FIELDS = [
	{ key: 'title', label: __('Title', 'minimal-map') },
	{ key: 'email', label: __('Email', 'minimal-map') },
	{ key: 'telephone', label: __('Phone', 'minimal-map') },
	{ key: 'website', label: __('Website', 'minimal-map') },
	{ key: 'street', label: __('Street', 'minimal-map') },
	{ key: 'house_number', label: __('House number', 'minimal-map') },
	{ key: 'city', label: __('City', 'minimal-map') },
	{ key: 'postal_code', label: __('Zip code', 'minimal-map') },
	{ key: 'country', label: __('Country', 'minimal-map') },
] as const;

export type CsvDelimiter = ',' | ';';
export type CommonCsvHeader = (typeof COMMON_CSV_HEADERS)[number];
export type CustomCsvMappingField = (typeof CUSTOM_CSV_MAPPING_FIELDS)[number]['key'];
export type CsvImportMapping = Record<CustomCsvMappingField, number | null>;
export interface CsvImportAssignments {
	logoId: number;
	markerId: number;
	tagIds: number[];
}

export interface ParsedCsvData {
	delimiter: CsvDelimiter;
	headers: string[];
	normalizedHeaders: string[];
	rows: string[][];
}

export interface ImportBatchResult {
	importedCount: number;
	importedLocationIds: number[];
	totalGeocodeRequests: number;
	completedGeocodeRequests: number;
}

interface ImportDependencies {
	createCollectionFn?: typeof createCollection;
	createLocationFn?: typeof createLocation;
	geocodeAddressFn?: typeof geocodeAddress;
	now?: () => Date;
	sleep?: (ms: number) => Promise<void>;
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => {
		globalThis.setTimeout(resolve, ms);
	});
}

function normalizeHeader(header: string): string {
	return header.replace(/^\uFEFF/, '').trim().toLowerCase();
}

function sanitizeCellValue(value: string): string {
	return value.trim();
}

function countDelimiterOccurrences(line: string, delimiter: CsvDelimiter): number {
	let count = 0;
	let inQuotes = false;

	for (let index = 0; index < line.length; index++) {
		const character = line[index];

		if (character === '"') {
			if (inQuotes && line[index + 1] === '"') {
				index++;
				continue;
			}

			inQuotes = !inQuotes;
			continue;
		}

		if (!inQuotes && character === delimiter) {
			count++;
		}
	}

	return count;
}

export function detectCsvDelimiter(text: string): CsvDelimiter {
	const firstContentLine = text
		.split(/\r?\n/)
		.map((line) => line.trim())
		.find((line) => line.length > 0);

	if (!firstContentLine) {
		return ',';
	}

	return countDelimiterOccurrences(firstContentLine, ';') >
		countDelimiterOccurrences(firstContentLine, ',')
		? ';'
		: ',';
}

export function parseCsvRows(text: string, delimiter: CsvDelimiter): string[][] {
	const rows: string[][] = [];
	let row: string[] = [];
	let current = '';
	let inQuotes = false;

	for (let index = 0; index < text.length; index++) {
		const character = text[index];

		if (character === '"') {
			if (inQuotes && text[index + 1] === '"') {
				current += '"';
				index++;
			} else {
				inQuotes = !inQuotes;
			}
			continue;
		}

		if (!inQuotes && character === delimiter) {
			row.push(sanitizeCellValue(current));
			current = '';
			continue;
		}

		if (!inQuotes && (character === '\n' || character === '\r')) {
			if (character === '\r' && text[index + 1] === '\n') {
				index++;
			}

			row.push(sanitizeCellValue(current));
			current = '';

			if (row.some((cell) => cell.length > 0)) {
				rows.push(row);
			}

			row = [];
			continue;
		}

		current += character;
	}

	row.push(sanitizeCellValue(current));

	if (row.some((cell) => cell.length > 0)) {
		rows.push(row);
	}

	return rows;
}

export function parseCsvText(text: string): ParsedCsvData {
	const delimiter = detectCsvDelimiter(text);
	const parsedRows = parseCsvRows(text, delimiter);

	if (parsedRows.length < 2) {
		throw new Error(__('CSV file is empty or missing headers.', 'minimal-map'));
	}

	const headers = parsedRows[0].map((header) => header.replace(/^\uFEFF/, '').trim());
	const normalizedHeaders = headers.map(normalizeHeader);
	const rows = parsedRows.slice(1);

	return {
		delimiter,
		headers,
		normalizedHeaders,
		rows,
	};
}

export async function parseCsvFile(file: File): Promise<ParsedCsvData> {
	return parseCsvText(await file.text());
}

export function createEmptyCsvImportMapping(): CsvImportMapping {
	return CUSTOM_CSV_MAPPING_FIELDS.reduce<CsvImportMapping>((mapping, field) => {
		mapping[field.key] = null;
		return mapping;
	}, {} as CsvImportMapping);
}

export function createEmptyCsvImportAssignments(): CsvImportAssignments {
	return {
		logoId: 0,
		markerId: 0,
		tagIds: [],
	};
}

export function isCommonCsvFormat(parsedCsv: ParsedCsvData): boolean {
	if (parsedCsv.normalizedHeaders.length !== COMMON_CSV_HEADERS.length) {
		return false;
	}

	const sortedHeaders = [ ...parsedCsv.normalizedHeaders ].sort();
	const sortedCommonHeaders = [ ...COMMON_CSV_HEADERS ].sort();

	return sortedHeaders.every((header, index) => header === sortedCommonHeaders[index]);
}

function createImportCollectionTitle(now: () => Date): string {
	const date = now();
	const timestamp =
		date.toLocaleDateString() +
		' ' +
		date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

	return `${__('Import on', 'minimal-map')} ${timestamp}`;
}

function getImportedLocationFallbackTitle(): string {
	return __('Imported Location', 'minimal-map');
}

function createBaseImportForm(): LocationFormState {
	return {
		title: '',
		telephone: '',
		email: '',
		website: '',
		street: '',
		house_number: '',
		postal_code: '',
		city: '',
		state: '',
		country: '',
		latitude: '',
		longitude: '',
		logo_id: 0,
		marker_id: 0,
		tag_ids: [],
	};
}

function getMappedValue(row: string[], columnIndex: number | null): string {
	if (columnIndex === null || columnIndex < 0 || columnIndex >= row.length) {
		return '';
	}

	return sanitizeCellValue(row[columnIndex] ?? '');
}

export function buildMappedLocationForm(
	row: string[],
	mapping: CsvImportMapping
): LocationFormState {
	const form = createBaseImportForm();

	CUSTOM_CSV_MAPPING_FIELDS.forEach((field) => {
		form[field.key] = getMappedValue(row, mapping[field.key]);
	});

	form.title = form.title || getImportedLocationFallbackTitle();

	return form;
}

function applyCsvImportAssignments(
	form: LocationFormState,
	assignments: CsvImportAssignments
): LocationFormState {
	return {
		...form,
		logo_id: Number.isFinite(assignments.logoId) ? Math.max(0, assignments.logoId) : 0,
		marker_id: Number.isFinite(assignments.markerId) ? Math.max(0, assignments.markerId) : 0,
		tag_ids: [...new Set(assignments.tagIds.filter((tagId) => Number.isFinite(tagId) && tagId > 0))],
	};
}

function buildCommonLocationForm(
	rowRecord: Record<CommonCsvHeader, string | undefined>
): LocationFormState {
	return {
		...createBaseImportForm(),
		title: rowRecord.title || getImportedLocationFallbackTitle(),
		street: rowRecord.street || '',
		house_number: rowRecord.house_number || '',
		postal_code: rowRecord.postal_code || '',
		city: rowRecord.city || '',
		state: rowRecord.state || '',
		country: rowRecord.country || '',
		telephone: rowRecord.telephone || '',
		email: rowRecord.email || '',
		website: rowRecord.website || '',
		latitude: rowRecord.latitude || '',
		longitude: rowRecord.longitude || '',
	};
}

function createRowRecord(parsedCsv: ParsedCsvData, row: string[]): Record<string, string> {
	const record: Record<string, string> = {};

	parsedCsv.normalizedHeaders.forEach((header, index) => {
		record[header] = sanitizeCellValue(row[index] ?? '');
	});

	return record;
}

function hasRequiredGeocodeFields(form: LocationFormState): boolean {
	return (
		form.street.trim().length > 0 &&
		form.house_number.trim().length > 0 &&
		form.postal_code.trim().length > 0 &&
		form.city.trim().length > 0 &&
		form.country.trim().length > 0
	);
}

export function countMappedCsvGeocodeRequests(
	parsedCsv: ParsedCsvData,
	mapping: CsvImportMapping
): number {
	return parsedCsv.rows.reduce((count, row) => {
		return count + (hasRequiredGeocodeFields(buildMappedLocationForm(row, mapping)) ? 1 : 0);
	}, 0);
}

async function maybeCreateImportCollection(
	config: CollectionsAdminConfig,
	locationIds: number[],
	createCollectionFn: typeof createCollection,
	now: () => Date
): Promise<void> {
	if (locationIds.length === 0) {
		return;
	}

	await createCollectionFn(config, createImportCollectionTitle(now), locationIds);
}

export async function runCommonCsvImport(
	parsedCsv: ParsedCsvData,
	locationsConfig: LocationsAdminConfig,
	collectionsConfig: CollectionsAdminConfig,
	dependencies: ImportDependencies = {}
): Promise<ImportBatchResult> {
	const createCollectionFn = dependencies.createCollectionFn ?? createCollection;
	const createLocationFn = dependencies.createLocationFn ?? createLocation;
	const now = dependencies.now ?? (() => new Date());
	const importedLocationIds: number[] = [];

	if (!isCommonCsvFormat(parsedCsv)) {
		throw new Error(__('CSV file does not match the supported import format.', 'minimal-map'));
	}

	for (const row of parsedCsv.rows) {
		const record = createRowRecord(parsedCsv, row) as Record<CommonCsvHeader, string | undefined>;
		const createdLocation = await createLocationFn(
			locationsConfig,
			buildCommonLocationForm(record)
		);
		importedLocationIds.push(createdLocation.id);
	}

	await maybeCreateImportCollection(
		collectionsConfig,
		importedLocationIds,
		createCollectionFn,
		now
	);

	return {
		importedCount: importedLocationIds.length,
		importedLocationIds,
		totalGeocodeRequests: 0,
		completedGeocodeRequests: 0,
	};
}

export async function runMappedCsvImport(
	parsedCsv: ParsedCsvData,
	mapping: CsvImportMapping,
	assignments: CsvImportAssignments,
	locationsConfig: LocationsAdminConfig,
	collectionsConfig: CollectionsAdminConfig,
	dependencies: ImportDependencies & {
		onGeocodeProgress?: (completed: number, total: number) => void;
	} = {}
): Promise<ImportBatchResult> {
	const createCollectionFn = dependencies.createCollectionFn ?? createCollection;
	const createLocationFn = dependencies.createLocationFn ?? createLocation;
	const geocodeAddressFn = dependencies.geocodeAddressFn ?? geocodeAddress;
	const now = dependencies.now ?? (() => new Date());
	const sleepFn = dependencies.sleep ?? sleep;
	const totalGeocodeRequests = countMappedCsvGeocodeRequests(parsedCsv, mapping);
	const importedLocationIds: number[] = [];
	let completedGeocodeRequests = 0;

	dependencies.onGeocodeProgress?.(completedGeocodeRequests, totalGeocodeRequests);

	for (const row of parsedCsv.rows) {
		const form = applyCsvImportAssignments(
			buildMappedLocationForm(row, mapping),
			assignments
		);

		if (hasRequiredGeocodeFields(form)) {
			try {
				const geocodeResult = await geocodeAddressFn(locationsConfig, form);

				if (geocodeResult.success) {
					form.latitude = `${geocodeResult.lat}`;
					form.longitude = `${geocodeResult.lng}`;
				}
			} catch {
				// Import continues without coordinates when geocoding fails.
			}

			completedGeocodeRequests += 1;
			dependencies.onGeocodeProgress?.(completedGeocodeRequests, totalGeocodeRequests);

			if (completedGeocodeRequests < totalGeocodeRequests) {
				await sleepFn(1000);
			}
		}

		const createdLocation = await createLocationFn(locationsConfig, form);
		importedLocationIds.push(createdLocation.id);
	}

	await maybeCreateImportCollection(
		collectionsConfig,
		importedLocationIds,
		createCollectionFn,
		now
	);

	return {
		importedCount: importedLocationIds.length,
		importedLocationIds,
		totalGeocodeRequests,
		completedGeocodeRequests,
	};
}

export async function importLocations(
	file: File,
	locationsConfig: LocationsAdminConfig,
	collectionsConfig: CollectionsAdminConfig
): Promise<number> {
	const parsedCsv = await parseCsvFile(file);
	const result = await runCommonCsvImport(parsedCsv, locationsConfig, collectionsConfig);

	return result.importedCount;
}
