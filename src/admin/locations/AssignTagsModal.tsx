import { Button, FormTokenField, Modal } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import type { KeyboardEvent } from 'react';
import Kbd from '../../components/Kbd';
import TagBadge from '../../components/TagBadge';
import type { LocationsController } from './types';

export default function AssignTagsModal({ controller }: { controller: LocationsController }) {
	if (!controller.isAssignTagsModalOpen || !controller.selectedTagsLocation) {
		return null;
	}

	const assignedTags = controller.getTagsForLocation(controller.selectedTagsLocation.id);
	const tagSuggestions = controller.tags.map((tag) => tag.name);
	const currentTagNames = controller.assignmentTagIds
		.map((id) => controller.tags.find((t) => t.id === id)?.name)
		.filter((name): name is string => !!name);

	const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
		const target = event.target;
		const isHTMLElement = target instanceof HTMLElement;

		if (
			controller.isAssignmentSaving ||
			event.key !== 'Enter' ||
			event.shiftKey ||
			(isHTMLElement && target.closest('[data-minimal-map-dialog-ignore-enter="true"]'))
		) {
			return;
		}

		// Don't submit if we're just adding a token
		if (isHTMLElement && target.classList.contains('components-form-token-field__input')) {
			return;
		}

		event.preventDefault();
		void controller.onAssignTagsToLocation();
	};

	return (
		<Modal
			className="minimal-map-admin__collection-modal"
			title={__('Assign Tags', 'minimal-map')}
			onRequestClose={controller.onCloseAssignTagsModal}
			shouldCloseOnClickOutside={!controller.isAssignmentSaving}
			shouldCloseOnEsc={!controller.isAssignmentSaving}
			onKeyDown={handleKeyDown}
		>
			<div className="minimal-map-admin__assign-to-collection-dialog">
				<div className="minimal-map-admin__assign-to-collection-copy">
					{assignedTags.length > 0 ? (
						<div className="minimal-map-admin__location-collections">
							{assignedTags.map((tag) => (
								<TagBadge key={tag.id} tag={tag} />
							))}
						</div>
					) : (
						<p className="minimal-map-admin__assign-to-collection-empty">
							{__('No tags assigned yet.', 'minimal-map')}
						</p>
					)}
				</div>

				<FormTokenField
					label={__('Tags', 'minimal-map')}
					value={currentTagNames}
					suggestions={tagSuggestions}
					onChange={(tokenNames) => {
						const nextTagIds = tokenNames
							.map((name) => controller.tags.find((t) => t.name === name)?.id)
							.filter((id): id is number => id !== undefined);
						controller.onSelectAssignmentTags(nextTagIds);
					}}
					__next40pxDefaultSize
					__nextHasNoMarginBottom
				/>

				<div className="minimal-map-admin__assign-to-collection-actions">
					<Button
						__next40pxDefaultSize
						variant="tertiary"
						onClick={controller.onCloseAssignTagsModal}
						disabled={controller.isAssignmentSaving}
						data-minimal-map-dialog-ignore-enter="true"
					>
						{__('Cancel', 'minimal-map')}
					</Button>
					<Button
						__next40pxDefaultSize
						variant="primary"
						onClick={() => void controller.onAssignTagsToLocation()}
						isBusy={controller.isAssignmentSaving}
						disabled={controller.isAssignmentSaving}
					>
						<span className="minimal-map-admin__location-dialog-button-content">
							<span>{__('Save Tags', 'minimal-map')}</span>
							<Kbd variant="blue">Enter</Kbd>
						</span>
					</Button>
				</div>
			</div>
		</Modal>
	);
}
