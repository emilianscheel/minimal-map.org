import { __ } from '@wordpress/i18n';
import type { FieldErrors, LocationFormState, OpeningHoursDayKey } from '../../types';
import OpeningHoursInput from './OpeningHoursInput';

interface OpeningHoursStepProps {
	fieldErrors: FieldErrors;
	form: LocationFormState;
	onChangeDayValue: (
		dayKey: OpeningHoursDayKey,
		field: 'open' | 'close' | 'lunch_start' | 'lunch_duration_minutes',
		value: string
	) => void;
	onChangeNotes: (value: string) => void;
}

export default function OpeningHoursStep({
	fieldErrors,
	form,
	onChangeDayValue,
	onChangeNotes,
}: OpeningHoursStepProps) {
	return (
		<OpeningHoursInput
			fieldErrors={fieldErrors}
			form={form}
			onChangeDayValue={onChangeDayValue}
			onChangeNotes={onChangeNotes}
		/>
	);
}
