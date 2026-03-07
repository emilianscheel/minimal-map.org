import { Button } from "@wordpress/components";
import { __ } from "@wordpress/i18n";
import { useState } from "@wordpress/element";
import type { LocationRecord } from "../../types";

interface DeleteLocationActionModalProps {
  location: LocationRecord;
  onDelete: (location: LocationRecord) => Promise<void>;
  closeModal?: () => void;
  onActionPerformed?: (items: LocationRecord[]) => void;
}

export default function DeleteLocationActionModal({
  location,
  onDelete,
  closeModal,
  onActionPerformed,
}: DeleteLocationActionModalProps) {
  const [isDeleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async (): Promise<void> => {
    setDeleting(true);
    setError(null);

    try {
      await onDelete(location);
      onActionPerformed?.([location]);
      closeModal?.();
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : __("Location could not be deleted.", "minimal-map"),
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="minimal-map-admin__location-delete-dialog">
      {error && (
        <p className="minimal-map-admin__location-delete-dialog-error">
          {error}
        </p>
      )}
      <div className="minimal-map-admin__location-delete-dialog-actions">
        <Button variant="tertiary" onClick={closeModal} disabled={isDeleting}>
          {__("Cancel", "minimal-map")}
        </Button>
        <Button
          variant="primary"
          isDestructive
          onClick={() => void handleDelete()}
          disabled={isDeleting}
        >
          {__("Delete", "minimal-map")}
        </Button>
      </div>
    </div>
  );
}
