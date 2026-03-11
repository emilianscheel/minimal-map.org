import { Button, Modal, SelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import type { KeyboardEvent } from 'react';
import Kbd from '../../components/Kbd';
import {
	CUSTOM_CSV_MAPPING_FIELDS,
} from '../../lib/locations/importLocations';
import { shouldHandleDialogEnter } from '../../lib/locations/shouldHandleDialogEnter';
import type { LocationsController } from './types';

export default function CustomCsvImportModal({ controller }: { controller: LocationsController }) {
	if (!controller.isCustomCsvImportModalOpen) {
		return null;
	}

	const modalTitle = __('Import custom CSV', 'minimal-map');
	const columnOptions = [
		{ label: __('None', 'minimal-map'), value: '' },
		...controller.csvImportHeaders.map((header, index) => ({
			label: (() => {
				const baseLabel = header || `${__('Column', 'minimal-map')} ${index + 1}`;
				const exampleValue = controller.csvImportRows
					.map((row) => row[index]?.trim() ?? '')
					.find((value) => value.length > 0);

				return exampleValue ? `${baseLabel} (${exampleValue})` : baseLabel;
			})(),
			value: `${index}`,
		})),
	];

	return (
		<Modal
			className="minimal-map-admin__custom-csv-import-modal"
			contentLabel={modalTitle}
			focusOnMount="firstInputElement"
			onRequestClose={controller.onCloseCustomCsvImportModal}
			shouldCloseOnClickOutside={!controller.isImporting}
			shouldCloseOnEsc={!controller.isImporting}
			title={modalTitle}
		>
			<div
				className="minimal-map-admin__location-dialog minimal-map-admin__custom-csv-import-dialog"
				onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
					if (controller.csvImportStep !== 'mapping' || controller.isImporting) {
						return;
					}

					const target = event.target;
					const isHTMLElement = target instanceof HTMLElement;

					if (
						(isHTMLElement &&
							target.closest('[data-minimal-map-dialog-ignore-enter="true"]')) ||
						!shouldHandleDialogEnter(event)
					) {
						return;
					}

					event.preventDefault();
					void controller.onStartCustomCsvImport();
				}}
			>
				{controller.csvImportStep === 'mapping' ? (
					<>
						<div className="minimal-map-admin__custom-csv-import-grid">
							{CUSTOM_CSV_MAPPING_FIELDS.map((field) => (
								<div
									key={field.key}
									className="minimal-map-admin__custom-csv-import-row"
								>
									<SelectControl
										__next40pxDefaultSize
										__nextHasNoMarginBottom
										hideLabelFromVision
										label={field.label}
										value={field.key}
										options={[{ label: field.label, value: field.key }]}
										disabled
									/>
									<SelectControl
										__next40pxDefaultSize
										__nextHasNoMarginBottom
										hideLabelFromVision
										label={field.label}
										value={
											controller.csvImportMapping[field.key] === null
												? ''
												: `${controller.csvImportMapping[field.key]}`
										}
										options={columnOptions}
										onChange={(value) =>
											controller.onChangeCsvImportMapping(field.key, value)
										}
									/>
								</div>
							))}
						</div>
						<div className="minimal-map-admin__location-dialog-footer">
							<div className="minimal-map-admin__location-dialog-footer-start" />
							<div className="minimal-map-admin__location-dialog-actions">
								<Button
									__next40pxDefaultSize
									variant="tertiary"
									onClick={controller.onCloseCustomCsvImportModal}
									disabled={controller.isImporting}
									data-minimal-map-dialog-ignore-enter="true"
								>
									{__('Cancel', 'minimal-map')}
								</Button>
								<Button
									__next40pxDefaultSize
									variant="primary"
									onClick={() => {
										void controller.onStartCustomCsvImport();
									}}
									isBusy={controller.isImporting}
									disabled={controller.isImporting}
								>
									<span className="minimal-map-admin__location-dialog-button-content">
										<span>{__('Next', 'minimal-map')}</span>
										<Kbd variant="blue">Enter</Kbd>
									</span>
								</Button>
							</div>
						</div>
					</>
				) : (
					<div className="minimal-map-admin__custom-csv-import-progress">
						<progress
							className="minimal-map-admin__custom-csv-import-progress-bar"
							max={Math.max(controller.csvImportProgressTotal, 1)}
							value={
								controller.csvImportProgressTotal === 0
									? 1
									: controller.csvImportProgressCompleted
							}
						/>
					</div>
				)}
			</div>
		</Modal>
	);
}
