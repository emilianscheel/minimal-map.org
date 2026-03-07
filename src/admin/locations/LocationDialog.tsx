import {
	Button,
	Modal,
	Notice,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { ArrowLeft } from 'lucide-react';
import type { KeyboardEvent } from 'react';
import { shouldHandleDialogEnter } from '../../lib/locations/shouldHandleDialogEnter';
import Kbd from '../../components/Kbd';
import MapStep from './MapStep';
import type { LocationsController } from './types';
import LocationDialogFields from './LocationDialogFields';

export default function LocationDialog({ controller }: { controller: LocationsController }) {
	if (!controller.isDialogOpen) {
		return null;
	}

	return (
		<Modal
			className="minimal-map-admin__location-modal"
			contentLabel={controller.modalTitle}
			focusOnMount="firstInputElement"
			onRequestClose={controller.onCancel}
			shouldCloseOnClickOutside={!controller.isSubmitting}
			shouldCloseOnEsc={!controller.isSubmitting}
			title={controller.modalTitle}
		>
			<div
				className="minimal-map-admin__location-dialog"
				onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
					if (
						(controller.step === 'map' && !controller.selectedCoordinates) ||
						controller.isSubmitting ||
						controller.isGeocoding
					) {
						return;
					}

					if (!shouldHandleDialogEnter(event)) {
						return;
					}

					event.preventDefault();
					void controller.onConfirm();
				}}
			>
				{controller.submitError && (
					<Notice status="error" isDismissible={false}>
						{controller.submitError}
					</Notice>
				)}
				{controller.step === 'map' ? (
					<MapStep controller={controller} />
				) : (
					<LocationDialogFields
						fieldErrors={controller.fieldErrors}
						form={controller.form}
						onChange={controller.onChangeFormValue}
						step={controller.step}
					/>
				)}
				<div className="minimal-map-admin__location-dialog-footer">
					<div className="minimal-map-admin__location-dialog-footer-start">
						{controller.step !== 'details' ? (
							<Button
								__next40pxDefaultSize
								variant="tertiary"
								onClick={controller.onBack}
								disabled={controller.isSubmitting}
								icon={<ArrowLeft size={18} strokeWidth={2} />}
								iconPosition="left"
							>
								{__('Back', 'minimal-map')}
							</Button>
						) : null}
					</div>
					<div className="minimal-map-admin__location-dialog-actions">
						<Button
							__next40pxDefaultSize
							variant="tertiary"
							onClick={controller.onCancel}
							disabled={controller.isSubmitting || controller.isGeocoding}
						>
							{__('Cancel', 'minimal-map')}
						</Button>
						<Button
							__next40pxDefaultSize
							variant="primary"
							onClick={() => {
								void controller.onConfirm();
							}}
							disabled={
								controller.isSubmitting ||
								controller.isGeocoding ||
								(controller.step === 'map' && !controller.selectedCoordinates)
							}
							isBusy={controller.isSubmitting || controller.isGeocoding}
						>
							<span className="minimal-map-admin__location-dialog-button-content">
								<span>
									{controller.step === 'map'
										? controller.submitLabel
										: __('Next', 'minimal-map')}
								</span>
								<Kbd variant="blue">Enter</Kbd>
							</span>
						</Button>
					</div>
				</div>
			</div>
		</Modal>
	);
}
