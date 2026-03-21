import { Button } from "@wordpress/components";
import { __, _n, sprintf } from "@wordpress/i18n";
import { useCallback, useEffect, useMemo, useState, useRef } from "@wordpress/element";
import { BrushCleaning, Merge, Plus } from "lucide-react";
import type { ViewGrid, ViewPickerTable } from "@wordpress/dataviews";
import type {
  CollectionFormState,
  CollectionRecord,
  CollectionsAdminConfig,
  LocationRecord,
  LocationsAdminConfig,
  StyleThemeRecord,
} from "../../types";
import {
  DEFAULT_ASSIGNMENT_VIEW,
  DEFAULT_FORM_STATE,
  DEFAULT_GRID_VIEW,
} from "./constants";
import { configureApiFetch } from "../../lib/locations/configureApiFetch";
import { fetchAllLocations } from "../../lib/locations/fetchAllLocations";
import { paginateLocations } from "../../lib/locations/paginateLocations";
import { createCollection } from "../../lib/collections/createCollection";
import { deleteCollection } from "../../lib/collections/deleteCollection";
import {
  getDeleteAllCollectionsLocationPlan,
  getCollectionsWithoutDeletedLocationIds,
  getDeleteCollectionLocationPlan,
} from "../../lib/collections/deleteCollectionLocations";
import { fetchAllCollections } from '../../lib/collections/fetchAllCollections';
import { importLocations } from '../../lib/locations/importLocations';
import { filterLocationsForAssignment } from '../../lib/collections/filterLocationsForAssignment';
import { paginateCollections } from "../../lib/collections/paginateCollections";
import { updateCollection } from "../../lib/collections/updateCollection";
import { deleteLocation } from "../../lib/locations/deleteLocation";
import { ImportLocationsButton } from "../locations/ImportLocationsButton";
import { ThemeSelector } from "../styles/ThemeSelector";
import { KeyboardShortcut, getShortcutAriaKeys } from "../../components/Kbd";
import { useSingleKeyShortcut } from "../../lib/keyboard/useSingleKeyShortcut";
import type {
  CollectionsController,
  DeleteCollectionOptions,
  MergeCollectionsStep,
} from "./types";

export function useCollectionsController(
  collectionsConfig: CollectionsAdminConfig,
  locationsConfig: LocationsAdminConfig,
  enabled: boolean,
  themeData: {
    activeTheme: StyleThemeRecord | null;
    themes: StyleThemeRecord[];
    onSwitchTheme: (slug: string) => void;
  },
): CollectionsController {
  const buildDeleteCollectionNotice = useCallback(
    (
      options: DeleteCollectionOptions,
      deletedLocationCount: number,
      sharedLocationCount: number,
    ): string => {
      if (!options.deleteLocations) {
        return __("Collection deleted.", "minimal-map");
      }

      const deletedLocationsMessage = sprintf(
        _n(
          "%d assigned location deleted",
          "%d assigned locations deleted",
          deletedLocationCount,
          "minimal-map",
        ),
        deletedLocationCount,
      );

      if (!options.skipSharedLocations) {
        return sprintf(
          __("Collection deleted. %s.", "minimal-map"),
          deletedLocationsMessage,
        );
      }

      return sprintf(
        __("Collection deleted. %1$s. Shared locations kept: %2$d.", "minimal-map"),
        deletedLocationsMessage,
        sharedLocationCount,
      );
    },
    [],
  );

  const buildDeleteCollectionsNotice = useCallback(
    (
      collectionCount: number,
      options: DeleteCollectionOptions,
      deletedLocationCount: number,
      sharedLocationCount: number,
    ): string => {
      if (!options.deleteLocations) {
        return sprintf(
          _n(
            "%d collection deleted.",
            "%d collections deleted.",
            collectionCount,
            "minimal-map",
          ),
          collectionCount,
        );
      }

      const deletedLocationsMessage = sprintf(
        _n(
          "%d assigned location deleted",
          "%d assigned locations deleted",
          deletedLocationCount,
          "minimal-map",
        ),
        deletedLocationCount,
      );

      return sprintf(
        options.skipSharedLocations
          ? _n(
              "%1$d collection deleted. %2$s. Shared locations kept: %3$d.",
              "%1$d collections deleted. %2$s. Shared locations kept: %3$d.",
              collectionCount,
              "minimal-map",
            )
          : _n(
              "%1$d collection deleted. %2$s.",
              "%1$d collections deleted. %2$s.",
              collectionCount,
              "minimal-map",
            ),
        collectionCount,
        deletedLocationsMessage,
        sharedLocationCount,
      );
    },
    [],
  );

  const [actionNotice, setActionNotice] =
    useState<CollectionsController["actionNotice"]>(null);
  const [assignmentSearch, setAssignmentSearch] = useState("");
  const [assignmentLocationsView, setAssignmentLocationsView] =
    useState<ViewPickerTable>(DEFAULT_ASSIGNMENT_VIEW);
  const [collections, setCollections] = useState<CollectionRecord[]>([]);
  const [editingCollection, setEditingCollection] =
    useState<CollectionRecord | null>(null);
  const [form, setForm] = useState<CollectionFormState>(DEFAULT_FORM_STATE);
  const [formMode, setFormMode] =
    useState<CollectionsController["formMode"]>("create");
  const [isAssignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [isAssignmentSaving, setAssignmentSaving] = useState(false);
  const [isDeleteAllCollectionsModalOpen, setDeleteAllCollectionsModalOpen] =
    useState(false);
  const [isDeletingAllCollections, setDeletingAllCollections] = useState(false);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [isLoading, setLoading] = useState(enabled);
  const [isRowActionPending, setRowActionPending] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);
  const [isMergeModalOpen, setMergeModalOpen] = useState(false);
  const [isMerging, setMerging] = useState(false);
  const [mergeStep, setMergeStep] = useState<MergeCollectionsStep>("selection");
  const [selectedMergeCollectionIds, setSelectedMergeCollectionIds] = useState<
    number[]
  >([]);
  const [mergeTitle, setMergeTitle] = useState("");
  const [shouldDeleteAfterMerge, setShouldDeleteAfterMerge] = useState(false);
  const [mergeSelectionView, setMergeSelectionView] = useState<ViewPickerTable>(
    {
      type: "pickerTable",
      page: 1,
      perPage: 100,
      fields: ["title", "location_count"],
      layout: { enableMoving: false },
    },
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [locations, setLocations] = useState<LocationRecord[]>([]);
  const [selectedAssignmentCollection, setSelectedAssignmentCollection] =
    useState<CollectionRecord | null>(null);
  const [selectedLocationIds, setSelectedLocationIds] = useState<number[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [view, setView] = useState<ViewGrid>(DEFAULT_GRID_VIEW);
  const [isImporting, setIsImporting] = useState(false);
  
  // The lock prevents DataViewsPicker from clearing selection during unmount transition
  const isMergeSelectionLocked = useRef(false);

  const loadCollections = useCallback(async (): Promise<void> => {
    const records = await fetchAllCollections(collectionsConfig);
    setCollections(records);
  }, [collectionsConfig]);

  const loadLocations = useCallback(async (): Promise<void> => {
    const records = await fetchAllLocations(locationsConfig);
    setLocations(records);
  }, [locationsConfig]);

  const loadData = useCallback(async (): Promise<void> => {
    if (!enabled) {
      return;
    }

    setLoading(true);
    setLoadError(null);

    try {
      await Promise.all([loadCollections(), loadLocations()]);
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : __("Collections could not be loaded.", "minimal-map"),
      );
    } finally {
      setLoading(false);
    }
  }, [enabled, loadCollections, loadLocations]);

  useEffect(() => {
    configureApiFetch(collectionsConfig.nonce || locationsConfig.nonce);

    if (!enabled) {
      return;
    }

    void loadData();
  }, [collectionsConfig.nonce, enabled, loadData, locationsConfig.nonce]);

  useEffect(() => {
    setView((currentView) => ({
      ...currentView,
      page: 1,
    }));
  }, [collections.length, view.search]);

  const locationsById = useMemo(
    () => new Map(locations.map((location) => [location.id, location])),
    [locations],
  );

  const assignmentLocationsFiltered = useMemo(
    () => filterLocationsForAssignment(locations, assignmentSearch),
    [assignmentSearch, locations],
  );

  useEffect(() => {
    setAssignmentLocationsView((currentView) => ({
      ...currentView,
      page: 1,
    }));
  }, [assignmentSearch]);

  const { collections: paginatedCollections, totalPages } = useMemo(
    () => paginateCollections(collections, view),
    [collections, view],
  );

  const { locations: paginatedAssignmentLocations } = useMemo(
    () =>
      paginateLocations(assignmentLocationsFiltered, assignmentLocationsView),
    [assignmentLocationsFiltered, assignmentLocationsView],
  );

  const resetDialogState = useCallback((): void => {
    setEditingCollection(null);
    setForm(DEFAULT_FORM_STATE);
    setFormMode("create");
    setSubmitError(null);
  }, []);

  const dismissActionNotice = useCallback((): void => {
    setActionNotice(null);
  }, []);

  const openDialog = useCallback((): void => {
    resetDialogState();
    setDialogOpen(true);
  }, [resetDialogState]);

  const isAddCollectionShortcutBlocked =
    isDialogOpen ||
    isAssignmentModalOpen ||
    isDeleteAllCollectionsModalOpen ||
    isMergeModalOpen ||
    isAssignmentSaving ||
    isDeletingAllCollections ||
    isSubmitting ||
    isLoading ||
    isRowActionPending ||
    isMerging ||
    isImporting;

  useSingleKeyShortcut({
    active: enabled,
    blocked: isAddCollectionShortcutBlocked,
    key: "n",
    onTrigger: openDialog,
  });

  const onEditCollection = useCallback(
    (collection: CollectionRecord): void => {
      resetDialogState();
      setEditingCollection(collection);
      setFormMode("edit");
      setForm({
        title: collection.title,
      });
      setDialogOpen(true);
    },
    [resetDialogState],
  );

  const onCancel = useCallback((): void => {
    if (isSubmitting) {
      return;
    }

    setDialogOpen(false);
  }, [isSubmitting]);

  const onChangeFormValue = useCallback((
    key: keyof CollectionFormState,
    value: string,
  ): void => {
    setForm((currentForm) => ({
      ...currentForm,
      [key]: value,
    }));
    setSubmitError(null);
  }, []);

  const onConfirm = useCallback(async (): Promise<void> => {
    if (!form.title.trim()) {
      setSubmitError(__("Collection title is required.", "minimal-map"));
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    setActionNotice(null);

    try {
      if (formMode === "edit" && editingCollection) {
        await updateCollection(
          collectionsConfig,
          editingCollection.id,
          form.title,
          editingCollection.location_ids,
        );
      } else {
        await createCollection(collectionsConfig, form.title);
      }

      await loadCollections();
      setDialogOpen(false);
      resetDialogState();
      setActionNotice({
        status: "success",
        message:
          formMode === "edit"
            ? __("Collection updated.", "minimal-map")
            : __("Collection created.", "minimal-map"),
      });
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : formMode === "edit"
          ? __("Collection could not be updated.", "minimal-map")
          : __("Collection could not be created.", "minimal-map"),
      );
    } finally {
      setSubmitting(false);
    }
  }, [form, formMode, editingCollection, collectionsConfig, loadCollections, resetDialogState]);

  const onDeleteCollection = useCallback(
    async (
      collection: CollectionRecord,
      options: DeleteCollectionOptions,
    ): Promise<void> => {
      setRowActionPending(true);
      setActionNotice(null);

      try {
        let deletedLocationCount = 0;
        let sharedLocationCount = 0;

        if (options.deleteLocations) {
          const { deletedLocationIds, sharedLocationIds } =
            getDeleteCollectionLocationPlan(
              collection,
              collections,
              options.skipSharedLocations,
            );

          sharedLocationCount = options.skipSharedLocations
            ? sharedLocationIds.length
            : 0;

          for (const locationId of deletedLocationIds) {
            await deleteLocation(locationsConfig, locationId);
          }

          deletedLocationCount = deletedLocationIds.length;

          const collectionUpdates = getCollectionsWithoutDeletedLocationIds(
            collections,
            deletedLocationIds,
            collection.id,
          );

          for (const collectionUpdate of collectionUpdates) {
            await updateCollection(
              collectionsConfig,
              collectionUpdate.id,
              collectionUpdate.title,
              collectionUpdate.location_ids,
            );
          }
        }

        await deleteCollection(collectionsConfig, collection.id);
        await Promise.all([loadCollections(), loadLocations()]);
        setActionNotice({
          status: "success",
          message: buildDeleteCollectionNotice(
            options,
            deletedLocationCount,
            sharedLocationCount,
          ),
        });
      } catch (error) {
        setActionNotice({
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : __("Collection could not be deleted.", "minimal-map"),
        });
        throw error;
      } finally {
        setRowActionPending(false);
      }
    },
    [
      buildDeleteCollectionNotice,
      collections,
      collectionsConfig,
      loadCollections,
      loadLocations,
      locationsConfig,
    ],
  );

  const onDeleteAllCollections = useCallback(
    async (options: DeleteCollectionOptions): Promise<void> => {
      const collectionCount = collections.length;
      const normalizedOptions: DeleteCollectionOptions = {
        ...options,
        skipSharedLocations: false,
      };

      if (collectionCount === 0) {
        setDeleteAllCollectionsModalOpen(false);
        return;
      }

      setDeletingAllCollections(true);
      setRowActionPending(true);
      setActionNotice(null);

      try {
        let deletedLocationCount = 0;
        let sharedLocationCount = 0;

        if (normalizedOptions.deleteLocations) {
          const { deletedLocationIds, sharedLocationIds } =
            getDeleteAllCollectionsLocationPlan(
              collections,
              normalizedOptions.skipSharedLocations,
            );

          sharedLocationCount = normalizedOptions.skipSharedLocations
            ? sharedLocationIds.length
            : 0;

          for (const locationId of deletedLocationIds) {
            await deleteLocation(locationsConfig, locationId);
          }

          deletedLocationCount = deletedLocationIds.length;
        }

        for (const collection of collections) {
          await deleteCollection(collectionsConfig, collection.id);
        }

        await Promise.all([loadCollections(), loadLocations()]);
        setDeleteAllCollectionsModalOpen(false);
        setActionNotice({
          status: "success",
          message: buildDeleteCollectionsNotice(
            collectionCount,
            normalizedOptions,
            deletedLocationCount,
            sharedLocationCount,
          ),
        });
      } catch (error) {
        setActionNotice({
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : __("Collections could not be deleted.", "minimal-map"),
        });
        throw error;
      } finally {
        setDeletingAllCollections(false);
        setRowActionPending(false);
      }
    },
    [
      buildDeleteCollectionsNotice,
      collections,
      collectionsConfig,
      loadCollections,
      loadLocations,
      locationsConfig,
    ],
  );

  const onOpenAssignmentModal = useCallback(
    (collection: CollectionRecord): void => {
      setSelectedAssignmentCollection(collection);
      setSelectedLocationIds(collection.location_ids);
      setAssignmentSearch("");
      setAssignmentLocationsView(DEFAULT_ASSIGNMENT_VIEW);
      setAssignmentModalOpen(true);
    },
    [],
  );

  const onOpenDeleteAllCollectionsModal = useCallback((): void => {
    if (
      collections.length === 0 ||
      isRowActionPending ||
      isImporting ||
      isDeletingAllCollections
    ) {
      return;
    }

    setDeleteAllCollectionsModalOpen(true);
  }, [collections.length, isDeletingAllCollections, isImporting, isRowActionPending]);

  const onCloseAssignmentModal = useCallback((): void => {
    if (isAssignmentSaving) {
      return;
    }

    setAssignmentModalOpen(false);
    setSelectedAssignmentCollection(null);
    setSelectedLocationIds([]);
    setAssignmentSearch("");
  }, [isAssignmentSaving]);

  const onChangeAssignmentLocationsSelection = useCallback(
    (nextSelection: string[]): void => {
      const nextLocationIds = nextSelection
        .map((locationId) => Number.parseInt(locationId, 10))
        .filter(
          (locationId) =>
            Number.isInteger(locationId) && locationsById.has(locationId),
        );

      setSelectedLocationIds(nextLocationIds);
    },
    [locationsById],
  );

  const onSaveAssignments = useCallback(async (): Promise<void> => {
    if (!selectedAssignmentCollection) {
      return;
    }

    setAssignmentSaving(true);
    setActionNotice(null);

    try {
      await updateCollection(
        collectionsConfig,
        selectedAssignmentCollection.id,
        selectedAssignmentCollection.title,
        selectedLocationIds,
      );
      await loadCollections();
      setAssignmentModalOpen(false);
      setSelectedAssignmentCollection(null);
      setSelectedLocationIds([]);
      setActionNotice({
        status: "success",
        message: __("Collection locations saved.", "minimal-map"),
      });
    } catch (error) {
      setActionNotice({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : __("Collection locations could not be saved.", "minimal-map"),
      });
    } finally {
      setAssignmentSaving(false);
    }
  }, [selectedAssignmentCollection, selectedLocationIds, collectionsConfig, loadCollections]);

  const onOpenMergeModal = useCallback((): void => {
    isMergeSelectionLocked.current = false;
    setMergeStep("selection");
    setSelectedMergeCollectionIds([]);
    setMergeTitle("");
    setShouldDeleteAfterMerge(false);
    setSubmitError(null);
    setMergeModalOpen(true);
  }, []);

  useSingleKeyShortcut({
    active: enabled,
    blocked: isAddCollectionShortcutBlocked,
    key: "m",
    onTrigger: onOpenMergeModal,
  });

  const onCloseMergeModal = useCallback((): void => {
    if (isMerging) {
      return;
    }

    setMergeModalOpen(false);
  }, [isMerging]);

  const onCloseDeleteAllCollectionsModal = useCallback((): void => {
    if (isDeletingAllCollections) {
      return;
    }

    setDeleteAllCollectionsModalOpen(false);
  }, [isDeletingAllCollections]);

  const onMergeConfirm = useCallback(async (): Promise<void> => {
    if (mergeStep === "selection") {
      if (selectedMergeCollectionIds.length < 2) {
        setSubmitError(
          __("Select at least two collections to merge.", "minimal-map"),
        );
        return;
      }
      setSubmitError(null);
      // Lock selection immediately to prevent unmount-triggered changes
      isMergeSelectionLocked.current = true;
      setMergeStep("details");
      return;
    }

    if (!mergeTitle.trim()) {
      setSubmitError(__("Collection title is required.", "minimal-map"));
      return;
    }

    setMerging(true);
    setSubmitError(null);
    setActionNotice(null);

    try {
      // 1. Gather all unique location IDs
      const allLocationIds = new Set<number>();
      console.log('Final merge started. IDs:', selectedMergeCollectionIds);
      
      collections.forEach((collection) => {
        if (selectedMergeCollectionIds.includes(collection.id)) {
          console.log(`Adding locations from collection ${collection.id}:`, collection.location_ids);
          collection.location_ids.forEach((id) => allLocationIds.add(id));
        }
      });

      // 2. Create new collection
      console.log('Creating new merged collection with locations:', Array.from(allLocationIds));
      await createCollection(
        collectionsConfig,
        mergeTitle,
        Array.from(allLocationIds),
      );

      // 3. Delete old collections if requested
      if (shouldDeleteAfterMerge) {
        const idsToDelete = [...selectedMergeCollectionIds];
        console.log('Deleting original collections:', idsToDelete);
        for (const id of idsToDelete) {
          console.log(`Deleting collection ${id}...`);
          await deleteCollection(collectionsConfig, id);
          console.log(`Deleted collection ${id}.`);
        }
      }

      console.log('Merge complete. Reloading...');
      await loadCollections();
      setMergeModalOpen(false);
      setActionNotice({
        status: "success",
        message: __("Collections merged successfully.", "minimal-map"),
      });
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : __("Collections could not be merged.", "minimal-map"),
      );
    } finally {
      setMerging(false);
    }
  }, [
    mergeStep,
    selectedMergeCollectionIds,
    mergeTitle,
    collections,
    collectionsConfig,
    shouldDeleteAfterMerge,
    loadCollections,
  ]);

  const onMergeBack = useCallback((): void => {
    if (isMerging) {
      return;
    }
    isMergeSelectionLocked.current = false;
    setMergeStep("selection");
  }, [isMerging]);

  const onChangeMergeSelection = useCallback(
    (nextSelection: string[]): void => {
      // Ignore updates if locked (transitioning) or not in selection step
      if (isMergeSelectionLocked.current || mergeStep !== "selection") {
        console.log('onChangeMergeSelection ignored (locked or wrong step)');
        return;
      }

      console.log('onChangeMergeSelection updated:', nextSelection);
      const nextIds = nextSelection
        .map((id) => Number.parseInt(id, 10))
        .filter((id) => !Number.isNaN(id));
      setSelectedMergeCollectionIds(nextIds);
      setSubmitError(null);
    },
    [mergeStep],
  );

  const onChangeMergeTitle = useCallback((value: string): void => {
    setMergeTitle(value);
    setSubmitError(null);
  }, []);

  const onToggleDeleteAfterMerge = useCallback((): void => {
    setShouldDeleteAfterMerge((current) => !current);
  }, []);

  const onImportLocations = useCallback(
    async (file: File) => {
      setIsImporting(true);
      setActionNotice(null);

      try {
        const count = await importLocations(
          file,
          locationsConfig,
          collectionsConfig,
        );

        await loadCollections();
        setActionNotice({
          status: "success",
          message: sprintf(
            _n(
              "%d location imported and assigned to a new collection.",
              "%d locations imported and assigned to a new collection.",
              count,
              "minimal-map",
            ),
            count,
          ),
        });
      } catch (error) {
        setActionNotice({
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : __("Failed to import locations.", "minimal-map"),
        });
      } finally {
        setIsImporting(false);
      }
    },
    [locationsConfig, collectionsConfig, loadCollections],
  );

  return {
    actionNotice,
    activeTheme: themeData.activeTheme,
    assignmentLocations: paginatedAssignmentLocations,
    assignmentSearch,
    assignmentLocationsView,
    collections,
    filteredAssignmentLocationsCount: assignmentLocationsFiltered.length,
    form,
    formMode,
    headerAction: enabled ? (
      <div className="minimal-map-admin__header-actions-group">
        <div className="minimal-map-admin__header-actions-group">
          <Button
            __next40pxDefaultSize
            variant="tertiary"
            icon={<BrushCleaning size={18} strokeWidth={2} />}
            label={__("Delete all collections", "minimal-map")}
            onClick={onOpenDeleteAllCollectionsModal}
            disabled={
              collections.length === 0 ||
              isDeletingAllCollections ||
              isRowActionPending ||
              isImporting
            }
          />
          <ImportLocationsButton
            onImport={onImportLocations}
            isImporting={isImporting}
          />
        </div>
        <ThemeSelector
          activeTheme={themeData.activeTheme}
          themes={themeData.themes}
          onSwitch={themeData.onSwitchTheme}
        />
        <Button
          __next40pxDefaultSize
          variant="secondary"
          onClick={onOpenMergeModal}
          disabled={isRowActionPending}
          icon={<Merge size={14} strokeWidth={2} />}
          iconPosition="left"
          aria-keyshortcuts={getShortcutAriaKeys(["m"])}
        >
          <span className="minimal-map-admin__button-shortcut-content">
            <span>{__("Merge collections", "minimal-map")}</span>
            <KeyboardShortcut keys={["m"]} variant="neutral" />
          </span>
        </Button>
        <Button
          __next40pxDefaultSize
          variant="primary"
          onClick={openDialog}
          icon={<Plus size={18} strokeWidth={2} />}
          iconPosition="left"
          aria-keyshortcuts={getShortcutAriaKeys(["n"])}
        >
          <span className="minimal-map-admin__button-shortcut-content">
            <span>{__("Add collection", "minimal-map")}</span>
            <KeyboardShortcut keys={["n"]} variant="blue" />
          </span>
        </Button>
      </div>
    ) : null,
    isAssignmentModalOpen,
    isAssignmentSaving,
    isDeleteAllCollectionsModalOpen,
    isDeletingAllCollections,
    isDialogOpen,
    isLoading,
    isRowActionPending,
    isSubmitting,
    isMergeModalOpen,
    isMerging,
    isImporting,
    mergeStep,
    mergeSelectionView,
    selectedMergeCollectionIds,
    mergeTitle,
    shouldDeleteAfterMerge,
    loadError,
    locations,
    modalTitle:
      formMode === "edit"
        ? __("Edit collection", "minimal-map")
        : __("Add collection", "minimal-map"),
    selectedAssignmentCollection,
    selectedLocationIds,
    submitError,
    submitLabel:
      formMode === "edit"
        ? __("Save changes", "minimal-map")
        : __("Add collection", "minimal-map"),
    view,
    dismissActionNotice,
    onCancel,
    onChangeAssignmentSearch: setAssignmentSearch,
    onChangeAssignmentLocationsSelection,
    onChangeAssignmentLocationsView: (nextView: ViewPickerTable) =>
      setAssignmentLocationsView(nextView),
    onChangeFormValue,
    onChangeView: (nextView: ViewGrid) => setView(nextView),
    onCloseAssignmentModal,
    onCloseDeleteAllCollectionsModal,
    onConfirm,
    onDeleteAllCollections,
    onDeleteCollection,
    onEditCollection,
    onOpenDeleteAllCollectionsModal,
    onOpenAssignmentModal,
    onSaveAssignments,
    onImportLocations,
    onOpenMergeModal,
    onCloseMergeModal,
    onMergeConfirm,
    onMergeBack,
    onChangeMergeSelection,
    onChangeMergeView: (nextView: ViewPickerTable) =>
      setMergeSelectionView(nextView),
    onChangeMergeTitle,
    onToggleDeleteAfterMerge,
    onAddCollection: openDialog,
    paginatedCollections,
    totalPages: totalPages,
  };
}
