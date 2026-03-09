import { Button } from "@wordpress/components";
import { __ } from "@wordpress/i18n";
import { useCallback, useEffect, useMemo, useState } from "@wordpress/element";
import { Merge, Plus } from "lucide-react";
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
import { fetchAllCollections } from "../../lib/collections/fetchAllCollections";
import { filterLocationsForAssignment } from "../../lib/collections/filterLocationsForAssignment";
import { paginateCollections } from "../../lib/collections/paginateCollections";
import { updateCollection } from "../../lib/collections/updateCollection";
import { ThemeSelector } from "../styles/ThemeSelector";
import type { CollectionsController, MergeCollectionsStep } from "./types";

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

  const onCancel = (): void => {
    if (isSubmitting) {
      return;
    }

    setDialogOpen(false);
  };

  const onChangeFormValue = (
    key: keyof CollectionFormState,
    value: string,
  ): void => {
    setForm((currentForm) => ({
      ...currentForm,
      [key]: value,
    }));
    setSubmitError(null);
  };

  const onConfirm = async (): Promise<void> => {
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
  };

  const onDeleteCollection = useCallback(
    async (collection: CollectionRecord): Promise<void> => {
      setRowActionPending(true);
      setActionNotice(null);

      try {
        await deleteCollection(collectionsConfig, collection.id);
        await loadCollections();
        setActionNotice({
          status: "success",
          message: __("Collection deleted.", "minimal-map"),
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
    [collectionsConfig, loadCollections],
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

  const onCloseAssignmentModal = (): void => {
    if (isAssignmentSaving) {
      return;
    }

    setAssignmentModalOpen(false);
    setSelectedAssignmentCollection(null);
    setSelectedLocationIds([]);
    setAssignmentSearch("");
  };

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

  const onSaveAssignments = async (): Promise<void> => {
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
  };

  const onOpenMergeModal = useCallback((): void => {
    setMergeStep("selection");
    setSelectedMergeCollectionIds([]);
    setMergeTitle("");
    setShouldDeleteAfterMerge(false);
    setSubmitError(null);
    setMergeModalOpen(true);
  }, []);

  const onCloseMergeModal = useCallback((): void => {
    if (isMerging) {
      return;
    }

    setMergeModalOpen(false);
  }, [isMerging]);

  const onMergeConfirm = async (): Promise<void> => {
    if (mergeStep === "selection") {
      if (selectedMergeCollectionIds.length < 2) {
        setSubmitError(
          __("Select at least two collections to merge.", "minimal-map"),
        );
        return;
      }
      setSubmitError(null);
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
      collections.forEach((collection) => {
        if (selectedMergeCollectionIds.includes(collection.id)) {
          collection.location_ids.forEach((id) => allLocationIds.add(id));
        }
      });

      // 2. Create new collection
      await createCollection(
        collectionsConfig,
        mergeTitle,
        Array.from(allLocationIds),
      );

      // 3. Delete old collections if requested
      if (shouldDeleteAfterMerge) {
        await Promise.all(
          selectedMergeCollectionIds.map((id) =>
            deleteCollection(collectionsConfig, id),
          ),
        );
      }

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
  };

  const onMergeBack = useCallback((): void => {
    if (isMerging) {
      return;
    }
    setMergeStep("selection");
  }, [isMerging]);

  const onChangeMergeSelection = useCallback(
    (nextSelection: string[]): void => {
      const nextIds = nextSelection
        .map((id) => Number.parseInt(id, 10))
        .filter((id) => !Number.isNaN(id));
      setSelectedMergeCollectionIds(nextIds);
      setSubmitError(null);
    },
    [],
  );

  const onChangeMergeTitle = useCallback((value: string): void => {
    setMergeTitle(value);
    setSubmitError(null);
  }, []);

  const onToggleDeleteAfterMerge = useCallback((): void => {
    setShouldDeleteAfterMerge((current) => !current);
  }, []);

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
        >
          {__("Merge collections", "minimal-map")}
        </Button>
        <Button
          __next40pxDefaultSize
          variant="primary"
          onClick={openDialog}
          icon={<Plus size={18} strokeWidth={2} />}
          iconPosition="left"
        >
          {__("Add collection", "minimal-map")}
        </Button>
      </div>
    ) : null,
    isAssignmentModalOpen,
    isAssignmentSaving,
    isDialogOpen,
    isLoading,
    isRowActionPending,
    isSubmitting,
    isMergeModalOpen,
    isMerging,
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
    onConfirm,
    onDeleteCollection,
    onEditCollection,
    onOpenAssignmentModal,
    onSaveAssignments,
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
