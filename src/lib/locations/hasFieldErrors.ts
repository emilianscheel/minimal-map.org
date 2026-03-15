import type { FieldErrors } from '../../types';

export function hasFieldErrors(errors: FieldErrors): boolean {
	return Object.values(errors).some((value) => {
		if (typeof value === 'string') {
			return value.trim().length > 0;
		}

		if (value && typeof value === 'object') {
			return Object.values(value).some((nestedValue) =>
				typeof nestedValue === 'string' ? nestedValue.trim().length > 0 : Boolean(nestedValue)
			);
		}

		return Boolean(value);
	});
}
