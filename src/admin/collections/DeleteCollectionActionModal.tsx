import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import type { CollectionRecord } from '../../types';

interface DeleteCollectionActionModalProps {
	closeModal?: () => void;
	collection: CollectionRecord;
	onActionPerformed?: (items: CollectionRecord[]) => void;
	onDelete: (collection: CollectionRecord) => Promise<void>;
}

export default function DeleteCollectionActionModal({
	closeModal,
	collection,
	onActionPerformed,
	onDelete,
}: DeleteCollectionActionModalProps) {
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [isDeleting, setDeleting] = useState(false);

	const handleDelete = async (): Promise<void> => {
		setDeleting(true);
		setErrorMessage(null);

		try {
			await onDelete(collection);
			onActionPerformed?.([collection]);
			closeModal?.();
		} catch (error) {
			setErrorMessage(
				error instanceof Error
					? error.message
					: __('Collection could not be deleted.', 'minimal-map')
			);
		} finally {
			setDeleting(false);
		}
	};

	return (
		<div className="minimal-map-admin__collection-delete-dialog">
			<p className="minimal-map-admin__collection-delete-dialog-copy">
				{__('Delete this collection and remove its saved location assignments?', 'minimal-map')}
			</p>
			<p className="minimal-map-admin__collection-delete-dialog-title">{collection.title}</p>
			{errorMessage ? (
				<p className="minimal-map-admin__collection-delete-dialog-error">{errorMessage}</p>
			) : null}
			<div className="minimal-map-admin__collection-delete-dialog-actions">
				<Button variant="tertiary" onClick={closeModal} disabled={isDeleting}>
					{__('Cancel', 'minimal-map')}
				</Button>
				<Button variant="primary" isDestructive onClick={() => void handleDelete()} isBusy={isDeleting}>
					{__('Delete collection', 'minimal-map')}
				</Button>
			</div>
		</div>
	);
}
