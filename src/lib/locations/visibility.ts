export function normalizeLocationVisibilityValue(value: unknown): boolean {
	if (typeof value === 'boolean') {
		return value;
	}

	if (typeof value === 'number') {
		return value !== 0;
	}

	if (typeof value !== 'string') {
		return false;
	}

	switch (value.trim().toLowerCase()) {
		case '1':
		case 'true':
		case 'yes':
		case 'hidden':
			return true;
		default:
			return false;
	}
}

export function formatLocationVisibilityCsvValue(isHidden: boolean): string {
	return isHidden ? 'true' : 'false';
}
