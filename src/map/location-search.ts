import type { MapLocationPoint } from '../types';

const NON_ALPHANUMERIC_PATTERN = /[^\p{L}\p{N}]+/gu;
const COMBINING_MARK_PATTERN = /\p{M}+/gu;
const WHITESPACE_PATTERN = /\s+/g;
const DIGIT_PATTERN = /\d/;

type TokenMatchKind = 'exact' | 'prefix' | 'fuzzy-prefix' | 'fuzzy';

interface TokenMatch {
	distance: number;
	kind: TokenMatchKind;
}

export interface IndexedLocationSearchRecord {
	location: MapLocationPoint;
	normalizedAddress: string;
	normalizedSearchText: string;
	normalizedTitle: string;
	originalIndex: number;
	tokens: string[];
}

interface SearchMatch {
	location: MapLocationPoint;
	originalIndex: number;
	score: number;
}

function joinParts(parts: Array<string | undefined>, separator = ' '): string {
	return parts
		.map((part) => part?.trim() ?? '')
		.filter(Boolean)
		.join(separator);
}

function buildLocationAddress(location: MapLocationPoint): string {
	const streetLine = joinParts([location.street, location.house_number]);
	const localityLine = joinParts([location.postal_code, location.city]);
	const regionLine = joinParts([location.state, location.country]);

	return joinParts([streetLine, localityLine, regionLine]);
}

function removeDiacritics(value: string): string {
	return value.normalize('NFKD').replace(COMBINING_MARK_PATTERN, '');
}

export function normalizeSearchValue(value: string): string {
	if (!value) {
		return '';
	}

	const germanNormalized = value
		.toLocaleLowerCase()
		.replace(/ß/g, 'ss')
		.replace(/ä/g, 'ae')
		.replace(/ö/g, 'oe')
		.replace(/ü/g, 'ue');

	return removeDiacritics(germanNormalized)
		.replace(NON_ALPHANUMERIC_PATTERN, ' ')
		.replace(WHITESPACE_PATTERN, ' ')
		.trim();
}

function tokenizeSearchValue(value: string): string[] {
	const normalized = normalizeSearchValue(value);

	return normalized ? normalized.split(' ') : [];
}

function getUniqueTokens(values: string[]): string[] {
	return Array.from(new Set(values.filter(Boolean)));
}

function getAllowedEditDistance(token: string): number {
	if (DIGIT_PATTERN.test(token)) {
		return 0;
	}

	if (token.length <= 3) {
		return 0;
	}

	if (token.length <= 6) {
		return 1;
	}

	return 2;
}

function getTokenMatch(queryToken: string, indexedTokens: string[]): TokenMatch | null {
	if (indexedTokens.includes(queryToken)) {
		return {
			distance: 0,
			kind: 'exact',
		};
	}

	if (indexedTokens.some((token) => token.startsWith(queryToken))) {
		return {
			distance: 0,
			kind: 'prefix',
		};
	}

	const maxDistance = getAllowedEditDistance(queryToken);

	if (maxDistance === 0) {
		return null;
	}

	let bestPrefixDistance = Number.POSITIVE_INFINITY;

	for (const indexedToken of indexedTokens) {
		if (indexedToken.length < queryToken.length) {
			continue;
		}

		const indexedPrefix = indexedToken.slice(0, queryToken.length);
		const distance = getBoundedLevenshteinDistance(queryToken, indexedPrefix, maxDistance);

		if (distance <= maxDistance && distance < bestPrefixDistance) {
			bestPrefixDistance = distance;
		}
	}

	if (Number.isFinite(bestPrefixDistance)) {
		return {
			distance: bestPrefixDistance,
			kind: 'fuzzy-prefix',
		};
	}

	let bestDistance = Number.POSITIVE_INFINITY;

	for (const indexedToken of indexedTokens) {
		if (Math.abs(indexedToken.length - queryToken.length) > maxDistance) {
			continue;
		}

		const distance = getBoundedLevenshteinDistance(queryToken, indexedToken, maxDistance);

		if (distance <= maxDistance && distance < bestDistance) {
			bestDistance = distance;
		}
	}

	if (!Number.isFinite(bestDistance)) {
		return null;
	}

	return {
		distance: bestDistance,
		kind: 'fuzzy',
	};
}

function getBoundedLevenshteinDistance(left: string, right: string, maxDistance: number): number {
	if (left === right) {
		return 0;
	}

	const leftLength = left.length;
	const rightLength = right.length;

	if (Math.abs(leftLength - rightLength) > maxDistance) {
		return maxDistance + 1;
	}

	const previous = Array.from({ length: rightLength + 1 }, (_, index) => index);
	const current = new Array<number>(rightLength + 1);

	for (let leftIndex = 1; leftIndex <= leftLength; leftIndex += 1) {
		current[0] = leftIndex;
		let rowMinimum = current[0];

		for (let rightIndex = 1; rightIndex <= rightLength; rightIndex += 1) {
			const substitutionCost = left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;
			const insertion = current[rightIndex - 1] + 1;
			const deletion = previous[rightIndex] + 1;
			const substitution = previous[rightIndex - 1] + substitutionCost;
			const value = Math.min(insertion, deletion, substitution);

			current[rightIndex] = value;
			rowMinimum = Math.min(rowMinimum, value);
		}

		if (rowMinimum > maxDistance) {
			return maxDistance + 1;
		}

		for (let rightIndex = 0; rightIndex <= rightLength; rightIndex += 1) {
			previous[rightIndex] = current[rightIndex];
		}
	}

	return previous[rightLength];
}

function getMatchScore(
	record: IndexedLocationSearchRecord,
	query: string,
	queryTokens: string[],
	indexedTokens: string[],
): number | null {
	const tokenMatches = queryTokens.map((queryToken) => getTokenMatch(queryToken, indexedTokens));

	if (tokenMatches.some((match) => match === null)) {
		return null;
	}

	let score = 0;

	if (record.normalizedTitle === query) {
		score += 1200;
	} else if (record.normalizedTitle.startsWith(query)) {
		score += 1000;
	} else if (record.normalizedTitle.includes(query)) {
		score += 820;
	}

	if (record.normalizedAddress === query) {
		score += 1100;
	} else if (record.normalizedAddress.startsWith(query)) {
		score += 920;
	} else if (record.normalizedAddress.includes(query)) {
		score += 760;
	}

	if (record.normalizedSearchText.includes(query)) {
		score += 600;
	}

	for (const match of tokenMatches) {
		if (!match) {
			continue;
		}

		if (match.kind === 'exact') {
			score += 60;
			continue;
		}

		if (match.kind === 'prefix') {
			score += 35;
			continue;
		}

		if (match.kind === 'fuzzy-prefix') {
			score += 22 - match.distance * 3;
			continue;
		}

		score += 12 - match.distance * 3;
	}

	if (tokenMatches.every((match) => match?.kind !== 'fuzzy')) {
		score += 80;
	}

	return score;
}

export function buildLocationSearchIndex(
	locations: MapLocationPoint[],
): IndexedLocationSearchRecord[] {
	return locations.map((location, originalIndex) => {
		const address = buildLocationAddress(location);
		const tagNames = Array.isArray(location.tags)
			? location.tags.map((tag) => tag.name)
			: [];
		const searchParts = [
			location.title?.trim() ?? '',
			address,
			location.telephone?.trim() ?? '',
			location.email?.trim() ?? '',
			location.website?.trim() ?? '',
			...tagNames,
		].filter(Boolean);
		const normalizedSearchText = normalizeSearchValue(searchParts.join(' '));

		return {
			location,
			normalizedAddress: normalizeSearchValue(address),
			normalizedSearchText,
			normalizedTitle: normalizeSearchValue(location.title?.trim() ?? ''),
			originalIndex,
			tokens: getUniqueTokens(tokenizeSearchValue(normalizedSearchText)),
		};
	});
}

export function searchIndexedLocations(
	indexedLocations: IndexedLocationSearchRecord[],
	query: string,
): MapLocationPoint[] {
	const normalizedQuery = normalizeSearchValue(query);

	if (!normalizedQuery) {
		return indexedLocations.map((record) => record.location);
	}

	const queryTokens = tokenizeSearchValue(normalizedQuery);
	const matches: SearchMatch[] = [];

	for (const record of indexedLocations) {
		const score = getMatchScore(
			record,
			normalizedQuery,
			queryTokens,
			record.tokens,
		);

		if (score === null) {
			continue;
		}

		matches.push({
			location: record.location,
			originalIndex: record.originalIndex,
			score,
		});
	}

	return matches
		.sort((left, right) => {
			if (right.score !== left.score) {
				return right.score - left.score;
			}

			return left.originalIndex - right.originalIndex;
		})
		.map((match) => match.location);
}
