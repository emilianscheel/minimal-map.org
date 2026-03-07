import { TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import type { FieldErrors, LocationDialogStep, LocationFormState } from '../../types';

interface LocationDialogFieldsProps {
	fieldErrors: FieldErrors;
	form: LocationFormState;
	onChange: (key: keyof LocationFormState, value: string) => void;
	step: LocationDialogStep;
}

function OptionalLabel({ label }: { label: string }) {
	return (
		<span className="minimal-map-admin__field-label-with-hint">
			<span>{label}</span>
			<span className="minimal-map-admin__field-optional-hint">
				{__('Optional', 'minimal-map')}
			</span>
		</span>
	);
}

export default function LocationDialogFields({
	fieldErrors,
	form,
	onChange,
	step,
}: LocationDialogFieldsProps) {
	if (step === 'details') {
		return (
			<div className="minimal-map-admin__location-dialog-fields">
				<TextControl
					autoFocus
					label={__('Title', 'minimal-map')}
					value={form.title}
					onChange={(value) => onChange('title', value)}
					help={fieldErrors.title}
				/>
				<TextControl
					label={<OptionalLabel label={__('Telephone', 'minimal-map')} />}
					type="tel"
					value={form.telephone}
					onChange={(value) => onChange('telephone', value)}
				/>
				<TextControl
					label={<OptionalLabel label={__('Email address', 'minimal-map')} />}
					type="email"
					value={form.email}
					onChange={(value) => onChange('email', value)}
					help={fieldErrors.email}
				/>
				<TextControl
					label={<OptionalLabel label={__('Website', 'minimal-map')} />}
					type="url"
					value={form.website}
					onChange={(value) => onChange('website', value)}
					help={fieldErrors.website}
				/>
			</div>
		);
	}

	return (
		<div className="minimal-map-admin__location-dialog-fields minimal-map-admin__location-dialog-fields--address">
			<div className="minimal-map-admin__location-dialog-grid minimal-map-admin__location-dialog-grid--row-one">
				<TextControl
					autoFocus
					label={__('Street', 'minimal-map')}
					value={form.street}
					onChange={(value) => onChange('street', value)}
				/>
				<TextControl
					label={__('House number', 'minimal-map')}
					value={form.house_number}
					onChange={(value) => onChange('house_number', value)}
				/>
			</div>
			<div className="minimal-map-admin__location-dialog-grid minimal-map-admin__location-dialog-grid--row-two">
				<TextControl
					label={__('Postal code', 'minimal-map')}
					value={form.postal_code}
					onChange={(value) => onChange('postal_code', value)}
				/>
				<TextControl
					label={__('City', 'minimal-map')}
					value={form.city}
					onChange={(value) => onChange('city', value)}
				/>
			</div>
			<div className="minimal-map-admin__location-dialog-grid minimal-map-admin__location-dialog-grid--row-three">
				<TextControl
					label={__('State', 'minimal-map')}
					value={form.state}
					onChange={(value) => onChange('state', value)}
				/>
				<TextControl
					label={__('Country', 'minimal-map')}
					value={form.country}
					onChange={(value) => onChange('country', value)}
				/>
			</div>
		</div>
	);
}
