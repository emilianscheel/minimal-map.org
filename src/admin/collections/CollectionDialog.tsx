import { Button, Modal, Notice, TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import type { KeyboardEvent } from 'react';
import { shouldHandleDialogEnter } from '../../lib/locations/shouldHandleDialogEnter';
import type { CollectionsController } from './types';

export default function CollectionDialog({ controller }: { controller: CollectionsController }) {
	if (!controller.isDialogOpen) {
		return null;
	}

	return (
		<Modal
			className="minimal-map-admin__collection-modal"
			contentLabel={controller.modalTitle}
			focusOnMount="firstInputElement"
			onRequestClose={controller.onCancel}
			shouldCloseOnClickOutside={!controller.isSubmitting}
			shouldCloseOnEsc={!controller.isSubmitting}
			title={controller.modalTitle}
		>
			<div
				className="minimal-map-admin__collection-dialog"
				onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
					if (controller.isSubmitting || !shouldHandleDialogEnter(event)) {
						return;
					}

					event.preventDefault();
					void controller.onConfirm();
				}}
			>
				{controller.submitError ? (
					<Notice status="error" isDismissible={false}>
						{controller.submitError}
					</Notice>
				) : null}
				<TextControl
					__next40pxDefaultSize
					label={__('Title', 'minimal-map')}
					value={controller.form.title}
					onChange={(value) => controller.onChangeFormValue('title', value)}
				/>
				<div className="minimal-map-admin__collection-dialog-actions">
					<Button
						__next40pxDefaultSize
						variant="tertiary"
						onClick={controller.onCancel}
						disabled={controller.isSubmitting}
					>
						{__('Cancel', 'minimal-map')}
					</Button>
					<Button
						__next40pxDefaultSize
						variant="primary"
						onClick={() => void controller.onConfirm()}
						disabled={controller.isSubmitting}
						isBusy={controller.isSubmitting}
					>
						{controller.submitLabel}
					</Button>
				</div>
			</div>
		</Modal>
	);
}
