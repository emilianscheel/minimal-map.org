import { Notice, Spinner } from '@wordpress/components';
import CollectionAssignmentModal from './CollectionAssignmentModal';
import MergeCollectionsModal from './MergeCollectionsModal';
import CollectionDialog from './CollectionDialog';
import CollectionsEmptyState from './CollectionsEmptyState';
import CollectionsGrid from './CollectionsGrid';
import type { CollectionsController } from './types';

export { useCollectionsController } from './controller';
export type { CollectionsController } from './types';

export default function CollectionsView({ controller }: { controller: CollectionsController }) {
	return (
		<>
			{controller.actionNotice ? (
				<Notice
					className="minimal-map-admin__collections-notice"
					status={controller.actionNotice.status}
					onRemove={controller.dismissActionNotice}
				>
					{controller.actionNotice.message}
				</Notice>
			) : null}
			{controller.loadError ? (
				<Notice className="minimal-map-admin__collections-notice" status="error" isDismissible={false}>
					{controller.loadError}
				</Notice>
			) : null}
			{controller.isLoading ? (
				<div className="minimal-map-admin__collections-state minimal-map-admin__collections-state--loading">
					<Spinner />
				</div>
			) : controller.collections.length === 0 ? (
				<CollectionsEmptyState />
			) : (
				<CollectionsGrid controller={controller} />
			)}
			<CollectionDialog controller={controller} />
			<CollectionAssignmentModal controller={controller} />
			<MergeCollectionsModal controller={controller} />
		</>
	);
}
