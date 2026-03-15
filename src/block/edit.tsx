import {
  __experimentalColorGradientControl as ColorGradientControl,
  InspectorControls,
  __experimentalBorderRadiusControl as BorderRadiusControl,
  useBlockProps,
} from "@wordpress/block-editor";
import {
  Button,
  BoxControl,
  ColorIndicator,
  Dropdown,
  FlexItem,
  PanelBody,
  RangeControl,
  SelectControl,
  TextareaControl,
  TextControl,
  ToggleControl,
  MenuGroup,
  MenuItem,
  __experimentalDropdownContentWrapper as DropdownContentWrapper,
  __experimentalHStack as HStack,
  __experimentalToggleGroupControl as ToggleGroupControl,
  __experimentalToggleGroupControlOptionIcon as ToggleGroupControlOptionIcon,
  __experimentalUnitControl as UnitControl,
} from "@wordpress/components";
import { useEffect, useMemo, useRef, useState } from "@wordpress/element";
import { __ } from "@wordpress/i18n";
import { CheckIcon, ChevronDownIcon, MapPinnedIcon } from "../components/Icons";
import { buildIframeSnippet } from "./embed";
import { createMinimalMap } from "../map/bootstrap";
import { normalizeHeightUnit, normalizeMapConfig } from "../map/defaults";
import { getActiveHeightCssValue } from "../map/responsive";
import {
  type ZoomControlIconOption,
  ZOOM_CONTROLS_POSITION_OPTIONS,
} from "../map/zoom-control-options";
import { getStyleOptions } from "../map/style-presets";
import type {
  BoxValue,
  MapBlockAttributes,
  MapCollectionOption,
  MapRuntimeConfig,
  MinimalMapInstance,
  RawMapConfig,
  StyleOption,
  StyleThemeRecord,
  ZoomControlsPosition,
} from "../types";

const runtimeConfig: MapRuntimeConfig = window.MinimalMapBlockConfig ?? {};
const HEIGHT_UNITS: StyleOption[] = (
  runtimeConfig.heightUnits ?? ["px", "em", "rem", "%", "vh", "vw"]
).map((value) => ({
  label: value,
  value,
}));
const BORDER_UNITS: StyleOption[] = ["px", "em", "rem"].map((value) => ({
  label: value,
  value,
}));
const BOX_CONTROL_INPUT_PROPS = { min: 0, max: 50 };
const BORDER_RADIUS_RANGE_MAX = 50;

function clampRangeInputs(root: HTMLElement | null, max: number): void {
  if (!root) {
    return;
  }

  const maxValue = `${max}`;

  root
    .querySelectorAll<HTMLInputElement>('input[type="range"]')
    .forEach((input) => {
      input.max = maxValue;
      input.setAttribute("max", maxValue);
      input.setAttribute("aria-valuemax", maxValue);
    });
}

function parseHeightValue(
  rawValue: string | number | undefined,
  fallbackUnit: string,
): Pick<MapBlockAttributes, "height" | "heightUnit"> | null {
  if (typeof rawValue === "number") {
    return {
      height: rawValue,
      heightUnit: normalizeHeightUnit(fallbackUnit),
    };
  }

  if (typeof rawValue !== "string") {
    return null;
  }

  const match = rawValue.trim().match(/^(-?\d*\.?\d+)\s*([a-z%]*)$/i);

  if (!match) {
    return null;
  }

  return {
    height: Number(match[1]),
    heightUnit: normalizeHeightUnit(match[2] || fallbackUnit),
  };
}

function getHeightControlValue(
  height: number | undefined,
  unit: string | undefined,
): string | undefined {
  if (typeof height !== "number" || Number.isNaN(height)) {
    return undefined;
  }

  return `${height}${normalizeHeightUnit(unit)}`;
}

interface EditProps {
  attributes: MapBlockAttributes;
  setAttributes: (attributes: Partial<MapBlockAttributes>) => void;
}

interface BorderRadiusValues {
  topLeft?: string;
  topRight?: string;
  bottomRight?: string;
  bottomLeft?: string;
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
}

function parseLengthValue(
  rawValue: string | number | undefined,
  fallback = "1px",
): string | null {
  if (typeof rawValue === "number") {
    return `${rawValue}px`;
  }

  if (typeof rawValue !== "string") {
    return null;
  }

  const trimmed = rawValue.trim();
  const match = trimmed.match(/^(-?\d*\.?\d+)\s*([a-z%]*)$/i);

  if (!match) {
    return null;
  }

  if (trimmed === "0") {
    return "0px";
  }

  const unit = match[2] || fallback.replace(/^-?\d*\.?\d+/, "") || "px";

  return `${Number(match[1])}${normalizeHeightUnit(unit)}`;
}

function copyTextToClipboard(value: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard
      .writeText(value)
      .then(() => true)
      .catch(() => false);
  }

  const element = document.createElement("textarea");
  element.value = value;
  element.setAttribute("readonly", "readonly");
  element.style.position = "absolute";
  element.style.left = "-9999px";
  document.body.appendChild(element);
  element.select();

  const copied = document.execCommand("copy");
  document.body.removeChild(element);

  return Promise.resolve(copied);
}

function stringifyBorderRadiusValue(
  value: string | BorderRadiusValues | null | undefined,
): string {
  if (!value) {
    return "2px";
  }

  if (typeof value === "string") {
    return value.trim() || "2px";
  }

  const topLeft = value.topLeft ?? value.top ?? "";
  const topRight = value.topRight ?? value.right ?? "";
  const bottomRight = value.bottomRight ?? value.bottom ?? "";
  const bottomLeft = value.bottomLeft ?? value.left ?? "";
  const values = [topLeft, topRight, bottomRight, bottomLeft].filter(
    (part): part is string => typeof part === "string" && part.length > 0,
  );

  if (values.length === 0) {
    return "2px";
  }

  const [first, second = first, third = first, fourth = second] = values;

  if (first === second && second === third && third === fourth) {
    return first;
  }

  if (first === third && second === fourth) {
    return `${first} ${second}`;
  }

  if (second === fourth) {
    return `${first} ${second} ${third}`;
  }

  return `${first} ${second} ${third} ${fourth}`;
}

function parseBorderRadiusValue(
  value: string | BorderRadiusValues | null | undefined,
):
  | {
      topLeft: string;
      topRight: string;
      bottomRight: string;
      bottomLeft: string;
    }
  | string {
  if (!value) {
    return "2px";
  }

  if (typeof value !== "string") {
    const topLeft = value.topLeft ?? value.top ?? "2px";
    const topRight = value.topRight ?? value.right ?? topLeft;
    const bottomRight = value.bottomRight ?? value.bottom ?? topLeft;
    const bottomLeft = value.bottomLeft ?? value.left ?? topRight;

    return {
      topLeft,
      topRight,
      bottomRight,
      bottomLeft,
    };
  }

  const parts = value.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "2px";
  }

  const [topLeft, second = topLeft, third = topLeft, fourth = second] = parts;

  if (parts.length === 1) {
    return topLeft;
  }

  if (parts.length === 2) {
    return {
      topLeft,
      topRight: second,
      bottomRight: topLeft,
      bottomLeft: second,
    };
  }

  if (parts.length === 3) {
    return {
      topLeft,
      topRight: second,
      bottomRight: third,
      bottomLeft: second,
    };
  }

  return {
    topLeft,
    topRight: second,
    bottomRight: third,
    bottomLeft: fourth,
  };
}

function ZoomControlColorSettings({
  backgroundColor,
  iconColor,
  borderColor,
  defaultBackgroundColor,
  defaultIconColor,
  defaultBorderColor,
  onChange,
}: {
  backgroundColor: string;
  iconColor: string;
  borderColor: string;
  defaultBackgroundColor: string;
  defaultIconColor: string;
  defaultBorderColor: string;
  onChange: (
    key:
      | "zoomControlsBackgroundColor"
      | "zoomControlsIconColor"
      | "zoomControlsBorderColor",
    value: string,
  ) => void;
}) {
  return (
    <div style={{ display: "grid", gap: "8px", marginBottom: "16px" }}>
      <CompactColorDropdown
        label={__("Background", "minimal-map")}
        value={backgroundColor}
        defaultValue={defaultBackgroundColor}
        onChange={(value) => onChange("zoomControlsBackgroundColor", value)}
      />
      <CompactColorDropdown
        label={__("Foreground", "minimal-map")}
        value={iconColor}
        defaultValue={defaultIconColor}
        onChange={(value) => onChange("zoomControlsIconColor", value)}
      />
      <CompactColorDropdown
        label={__("Border", "minimal-map")}
        value={borderColor}
        defaultValue={defaultBorderColor}
        onChange={(value) => onChange("zoomControlsBorderColor", value)}
      />
    </div>
  );
}

function CreditsColorSettings({
  backgroundColor,
  foregroundColor,
  defaultBackgroundColor,
  defaultForegroundColor,
  onChange,
}: {
  backgroundColor: string;
  foregroundColor: string;
  defaultBackgroundColor: string;
  defaultForegroundColor: string;
  onChange: (
    key: "creditsBackgroundColor" | "creditsForegroundColor",
    value: string,
  ) => void;
}) {
  return (
    <div style={{ display: "grid", gap: "8px", marginBottom: "16px" }}>
      <CompactColorDropdown
        label={__("Background", "minimal-map")}
        value={backgroundColor}
        defaultValue={defaultBackgroundColor}
        onChange={(value) => onChange("creditsBackgroundColor", value)}
      />
      <CompactColorDropdown
        label={__("Foreground", "minimal-map")}
        value={foregroundColor}
        defaultValue={defaultForegroundColor}
        onChange={(value) => onChange("creditsForegroundColor", value)}
      />
    </div>
  );
}

function SearchPanelColorSettings({
  backgroundPrimary,
  backgroundSecondary,
  backgroundHover,
  foregroundPrimary,
  foregroundSecondary,
  defaults,
  onChange,
}: {
  backgroundPrimary: string;
  backgroundSecondary: string;
  backgroundHover: string;
  foregroundPrimary: string;
  foregroundSecondary: string;
  defaults: {
    backgroundPrimary: string;
    backgroundSecondary: string;
    backgroundHover: string;
    foregroundPrimary: string;
    foregroundSecondary: string;
  };
  onChange: (
    key:
      | "searchPanelBackgroundPrimary"
      | "searchPanelBackgroundSecondary"
      | "searchPanelBackgroundHover"
      | "searchPanelForegroundPrimary"
      | "searchPanelForegroundSecondary",
    value: string,
  ) => void;
}) {
  return (
    <div style={{ display: "grid", gap: "8px", marginBottom: "16px" }}>
      <CompactColorDropdown
        label={__("Background Primary", "minimal-map")}
        value={backgroundPrimary}
        defaultValue={defaults.backgroundPrimary}
        onChange={(value) => onChange("searchPanelBackgroundPrimary", value)}
      />
      <CompactColorDropdown
        label={__("Background Secondary", "minimal-map")}
        value={backgroundSecondary}
        defaultValue={defaults.backgroundSecondary}
        onChange={(value) => onChange("searchPanelBackgroundSecondary", value)}
      />
      <CompactColorDropdown
        label={__("Background Hover", "minimal-map")}
        value={backgroundHover}
        defaultValue={defaults.backgroundHover}
        onChange={(value) => onChange("searchPanelBackgroundHover", value)}
      />
      <CompactColorDropdown
        label={__("Foreground Primary", "minimal-map")}
        value={foregroundPrimary}
        defaultValue={defaults.foregroundPrimary}
        onChange={(value) => onChange("searchPanelForegroundPrimary", value)}
      />
      <CompactColorDropdown
        label={__("Foreground Secondary", "minimal-map")}
        value={foregroundSecondary}
        defaultValue={defaults.foregroundSecondary}
        onChange={(value) => onChange("searchPanelForegroundSecondary", value)}
      />
    </div>
  );
}

function GoogleMapsButtonColorSettings({
  backgroundColor,
  foregroundColor,
  defaultBackgroundColor,
  defaultForegroundColor,
  onChange,
}: {
  backgroundColor: string;
  foregroundColor: string;
  defaultBackgroundColor: string;
  defaultForegroundColor: string;
  onChange: (
    key: "googleMapsButtonBackgroundColor" | "googleMapsButtonForegroundColor",
    value: string,
  ) => void;
}) {
  return (
    <div style={{ display: "grid", gap: "8px", marginBottom: "16px" }}>
      <CompactColorDropdown
        label={__("Background", "minimal-map")}
        value={backgroundColor}
        defaultValue={defaultBackgroundColor}
        onChange={(value) => onChange("googleMapsButtonBackgroundColor", value)}
      />
      <CompactColorDropdown
        label={__("Foreground", "minimal-map")}
        value={foregroundColor}
        defaultValue={defaultForegroundColor}
        onChange={(value) => onChange("googleMapsButtonForegroundColor", value)}
      />
    </div>
  );
}

function CompactColorDropdown({
  label,
  value,
  defaultValue,
  onChange,
}: {
  label: string;
  value: string;
  defaultValue: string;
  onChange: (value: string) => void;
}) {
  return (
    <Dropdown
      className="minimal-map-editor__compact-color-dropdown"
      popoverProps={{
        placement: "left-start",
        offset: 36,
        shift: true,
      }}
      renderToggle={({ isOpen, onToggle }) => (
        <Button
          __next40pxDefaultSize
          variant="tertiary"
          onClick={onToggle}
          aria-expanded={isOpen}
          style={{
            width: "100%",
            justifyContent: "flex-start",
            paddingInline: "12px",
            color: "var(--wp-components-color-foreground, #1e1e1e)",
          }}
        >
          <HStack justify="flex-start" spacing={3}>
            <ColorIndicator colorValue={value} />
            <FlexItem title={label}>{label}</FlexItem>
          </HStack>
        </Button>
      )}
      renderContent={() => (
        <DropdownContentWrapper>
          <div style={{ width: "280px", maxWidth: "min(280px, 100vw - 32px)" }}>
            <ColorGradientControl
              label={label}
              showTitle={false}
              clearable={false}
              enableAlpha={false}
              onColorChange={(nextValue?: string) =>
                onChange(
                  typeof nextValue === "string" && nextValue.length > 0
                    ? nextValue
                    : defaultValue,
                )
              }
              colorValue={value}
            />
          </div>
        </DropdownContentWrapper>
      )}
    />
  );
}

function ThemeDropdown({
  themes,
  selectedSlug,
  onChange,
}: {
  themes: StyleThemeRecord[];
  selectedSlug: string;
  onChange: (value: string) => void;
}) {
  const selectedTheme =
    themes.find((theme) => theme.slug === selectedSlug) ||
    themes.find((theme) => theme.slug === "default");
  const selectedLabel = selectedTheme?.label || __("Default", "minimal-map");

  return (
    <div style={{ display: "grid", gap: "8px", marginBottom: "16px" }}>
      <span>{__("Style Theme", "minimal-map")}</span>
      <Dropdown
        className="minimal-map-editor__theme-dropdown"
        popoverProps={{
          placement: "left-start",
          offset: 36,
          shift: true,
        }}
        renderToggle={({ isOpen, onToggle }) => (
          <Button
            __next40pxDefaultSize
            variant="secondary"
            onClick={onToggle}
            aria-expanded={isOpen}
            style={{
              width: "100%",
              justifyContent: "space-between",
              paddingInline: "12px",
            }}
          >
            <span>{selectedLabel}</span>
            <ChevronDownIcon size={16} style={{ flexShrink: 0 }} />
          </Button>
        )}
        renderContent={({ onClose }) => (
          <MenuGroup label={__("Switch Theme", "minimal-map")}>
            {themes.map((theme) => {
              const isSelected = theme.slug === selectedSlug;
              return (
                <MenuItem
                  key={theme.slug}
                  onClick={() => {
                    onChange(theme.slug);
                    onClose();
                  }}
                >
                  <HStack justify="space-between" style={{ width: "100%" }}>
                    <span>{theme.label}</span>
                    {isSelected && (
                      <CheckIcon
                        size={16}
                        style={{
                          flexShrink: 0,
                          color: "var(--wp-admin-theme-color, #3858e8)",
                        }}
                      />
                    )}
                  </HStack>
                </MenuItem>
              );
            })}
          </MenuGroup>
        )}
      />
    </div>
  );
}

function CollectionDropdown({
  options,
  selectedId,
  onChange,
}: {
  options: MapCollectionOption[];
  selectedId: number;
  onChange: (value: number) => void;
}) {
  const selectedCollection = options.find((option) => option.id === selectedId);
  const selectedLabel =
    selectedId > 0
      ? selectedCollection?.title || __("Collection unavailable", "minimal-map")
      : __("All locations", "minimal-map");

  return (
    <div style={{ display: "grid", gap: "8px", marginBottom: "16px" }}>
      <span>{__("Collection", "minimal-map")}</span>
      <Dropdown
        className="minimal-map-editor__collection-dropdown"
        popoverProps={{
          placement: "left-start",
          offset: 36,
          shift: true,
        }}
        renderToggle={({ isOpen, onToggle }) => (
          <Button
            __next40pxDefaultSize
            variant="secondary"
            onClick={onToggle}
            aria-expanded={isOpen}
            style={{
              width: "100%",
              justifyContent: "space-between",
              paddingInline: "12px",
            }}
          >
            <span>{selectedLabel}</span>
            <ChevronDownIcon size={16} style={{ flexShrink: 0 }} />
          </Button>
        )}
        renderContent={({ onClose }) => (
          <MenuGroup label={__("Switch Collection", "minimal-map")}>
            <MenuItem
              onClick={() => {
                onChange(0);
                onClose();
              }}
            >
              <HStack justify="space-between" style={{ width: "100%" }}>
                <span>{__("All locations", "minimal-map")}</span>
                {selectedId === 0 && (
                  <CheckIcon
                    size={16}
                    style={{
                      flexShrink: 0,
                      color: "var(--wp-admin-theme-color, #3858e8)",
                    }}
                  />
                )}
              </HStack>
            </MenuItem>
            {options.map((option) => {
              const isSelected = selectedId === option.id;
              return (
                <MenuItem
                  key={option.id}
                  onClick={() => {
                    onChange(option.id);
                    onClose();
                  }}
                >
                  <HStack justify="space-between" style={{ width: "100%" }}>
                    <span>{option.title}</span>
                    {isSelected && (
                      <CheckIcon
                        size={16}
                        style={{
                          flexShrink: 0,
                          color: "var(--wp-admin-theme-color, #3858e8)",
                        }}
                      />
                    )}
                  </HStack>
                </MenuItem>
              );
            })}
            {options.length === 0 ? (
              <div
                style={{
                  padding: "8px 12px",
                  color: "#757575",
                  fontSize: "12px",
                }}
              >
                {__("No collections available.", "minimal-map")}
              </div>
            ) : null}
          </MenuGroup>
        )}
      />
    </div>
  );
}

export default function Edit({ attributes, setAttributes }: EditProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<MinimalMapInstance | null>(null);
  const zoomControlsRadiusRef = useRef<HTMLDivElement | null>(null);
  const searchPanelInputRadiusRef = useRef<HTMLDivElement | null>(null);
  const searchPanelCardRadiusRef = useRef<HTMLDivElement | null>(null);
  const googleMapsButtonRadiusRef = useRef<HTMLDivElement | null>(null);
  const creditsRadiusRef = useRef<HTMLDivElement | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">(
    "idle",
  );
  const styleOptions = useMemo(
    () => getStyleOptions(runtimeConfig.stylePresets),
    [],
  );
  const selectedCollection = useMemo(
    () =>
      attributes.collectionId > 0
        ? (runtimeConfig.collections ?? []).find(
            (collection) => collection.id === attributes.collectionId,
          ) ?? null
        : null,
    [attributes.collectionId],
  );
  const config = useMemo(
    () =>
      normalizeMapConfig(
        {
          ...attributes,
          locations:
            attributes.collectionId > 0
              ? selectedCollection?.locations ?? []
              : undefined,
        },
        runtimeConfig,
      ),
    [attributes, selectedCollection],
  );
  const [previewHeightCssValue, setPreviewHeightCssValue] = useState(() =>
    getActiveHeightCssValue(
      config,
      typeof window !== "undefined" ? window.innerWidth : undefined,
    ),
  );
  const iframeSnippet = useMemo(
    () => buildIframeSnippet(attributes, runtimeConfig),
    [attributes],
  );
  const blockProps = useBlockProps({ className: "minimal-map-editor" });

  useEffect(() => {
    if (!mapRef.current) {
      return undefined;
    }

    mapInstanceRef.current = createMinimalMap(
      mapRef.current,
      config,
      runtimeConfig,
    );

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    mapInstanceRef.current?.update(config);
  }, [config]);

  useEffect(() => {
    const nextHeightCssValue = getActiveHeightCssValue(
      config,
      typeof window !== "undefined" ? window.innerWidth : undefined,
    );

    setPreviewHeightCssValue((currentValue) =>
      currentValue === nextHeightCssValue ? currentValue : nextHeightCssValue,
    );
  }, [config]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const syncPreviewHeight = (): void => {
      const nextHeightCssValue = getActiveHeightCssValue(config, window.innerWidth);

      setPreviewHeightCssValue((currentValue) =>
        currentValue === nextHeightCssValue ? currentValue : nextHeightCssValue,
      );
    };

    window.addEventListener("resize", syncPreviewHeight);

    return () => {
      window.removeEventListener("resize", syncPreviewHeight);
    };
  }, [config]);

  useEffect(() => {
    const targets = [
      zoomControlsRadiusRef.current,
      searchPanelInputRadiusRef.current,
      searchPanelCardRadiusRef.current,
      googleMapsButtonRadiusRef.current,
      creditsRadiusRef.current,
    ];
    const observers = targets
      .filter((target): target is HTMLDivElement => target !== null)
      .map((target) => {
        clampRangeInputs(target, BORDER_RADIUS_RANGE_MAX);

        const observer = new MutationObserver(() => {
          clampRangeInputs(target, BORDER_RADIUS_RANGE_MAX);
        });

        observer.observe(target, {
          childList: true,
          subtree: true,
        });

        return observer;
      });

    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, []);

  useEffect(() => {
    if (copyState === "idle") {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setCopyState("idle");
    }, 1800);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [copyState, iframeSnippet]);

  function updateNumberAttribute<
    Key extends keyof Pick<
      MapBlockAttributes,
      "centerLat" | "centerLng" | "zoom"
    >,
  >(key: Key) {
    return (value: string): void => {
      const numericValue = Number(value);

      if (Number.isNaN(numericValue)) {
        return;
      }

      setAttributes({
        [key]: numericValue,
      } as Pick<MapBlockAttributes, Key>);
    };
  }

  const updateHeight = (value?: string | number): void => {
    const parsed = parseHeightValue(value, attributes.heightUnit || "px");

    if (!parsed || Number.isNaN(parsed.height) || parsed.height <= 0) {
      return;
    }

    setAttributes({
      height: parsed.height,
      heightUnit: parsed.heightUnit,
    });
  };

  const updateHeightMobile = (value?: string | number): void => {
    if (
      typeof value === "undefined" ||
      (typeof value === "string" && value.trim() === "")
    ) {
      setAttributes({
        heightMobile: undefined,
        heightMobileUnit: undefined,
      });
      return;
    }

    const parsed = parseHeightValue(
      value,
      attributes.heightMobileUnit || attributes.heightUnit || "px",
    );

    if (!parsed || Number.isNaN(parsed.height) || parsed.height <= 0) {
      return;
    }

    setAttributes({
      heightMobile: parsed.height,
      heightMobileUnit: parsed.heightUnit,
    });
  };

  const updateZoom = (value?: number): void => {
    if (typeof value === "number") {
      setAttributes({ zoom: value });
    }
  };

  const updateBorderWidth = (value?: string | number): void => {
    const parsed = parseLengthValue(
      value,
      attributes.zoomControlsBorderWidth || "1px",
    );

    if (parsed) {
      setAttributes({ zoomControlsBorderWidth: parsed });
    }
  };

  const updateSearchPanelCardGap = (value?: string | number): void => {
    const parsed = parseLengthValue(
      value,
      attributes.searchPanelCardGap || "12px",
    );

    if (parsed) {
      setAttributes({ searchPanelCardGap: parsed });
    }
  };

  const updateSearchPanelWidth = (value?: string | number): void => {
    const parsed = parseLengthValue(
      value,
      attributes.searchPanelWidth || "320px",
    );

    if (parsed) {
      setAttributes({ searchPanelWidth: parsed });
    }
  };

  const copyIframeSnippet = (): void => {
    if (!iframeSnippet) {
      return;
    }

    void copyTextToClipboard(iframeSnippet).then((copied) => {
      setCopyState(copied ? "copied" : "error");
    });
  };

  if (attributes._isPreview) {
    return (
      <div
        {...useBlockProps({
          className: "minimal-map-editor__preview minimal-map-editor--preview",
          style: {
            backgroundImage: runtimeConfig.previewImageUrl
              ? `url(${runtimeConfig.previewImageUrl})`
              : "none",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#f0f0f1",
            color: "#757575",
            fontSize: "13px",
          },
        })}
      >
        {!runtimeConfig.previewImageUrl && (
          <div style={{ textAlign: "center", padding: "20px" }}>
            <MapPinnedIcon
              size={48}
              style={{ marginBottom: "12px", opacity: 0.5 }}
            />
            <p style={{ margin: 0 }}>
              {__("Minimal Map Preview", "minimal-map")}
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <InspectorControls group="settings">
        <PanelBody title={__("Map Settings", "minimal-map")} initialOpen>
          <CollectionDropdown
            options={runtimeConfig.collections ?? []}
            selectedId={attributes.collectionId}
            onChange={(value) => setAttributes({ collectionId: value })}
          />
          <ThemeDropdown
            themes={runtimeConfig.styleThemes ?? []}
            selectedSlug={attributes.styleThemeSlug}
            onChange={(value) => setAttributes({ styleThemeSlug: value })}
          />
          <TextControl
            label={__("Center Latitude", "minimal-map")}
            type="number"
            step="0.000001"
            value={attributes.centerLat}
            onChange={updateNumberAttribute("centerLat")}
          />
          <TextControl
            label={__("Center Longitude", "minimal-map")}
            type="number"
            step="0.000001"
            value={attributes.centerLng}
            onChange={updateNumberAttribute("centerLng")}
          />
          <RangeControl
            label={__("Zoom", "minimal-map")}
            value={attributes.zoom}
            onChange={updateZoom}
            min={0}
            max={22}
            step={0.5}
          />
          <ToggleControl
            label={__("Show Zoom Controls", "minimal-map")}
            checked={attributes.showZoomControls}
            onChange={(value: boolean) =>
              setAttributes({ showZoomControls: value })
            }
          />
          <ToggleControl
            label={__("Allow Zoom via Scroll", "minimal-map")}
            checked={attributes.scrollZoom}
            onChange={(value: boolean) => setAttributes({ scrollZoom: value })}
          />
          <ToggleControl
            label={__("Allow Two-Finger Zoom on Mobile", "minimal-map")}
            checked={attributes.mobileTwoFingerZoom}
            onChange={(value: boolean) =>
              setAttributes({ mobileTwoFingerZoom: value })
            }
          />
          <ToggleControl
            label={__("Allow Search", "minimal-map")}
            checked={attributes.allowSearch}
            onChange={(value: boolean) => setAttributes({ allowSearch: value })}
          />
          <ToggleControl
            label={__("Google Maps Navigation", "minimal-map")}
            checked={attributes.googleMapsNavigation}
            onChange={(value: boolean) =>
              setAttributes({ googleMapsNavigation: value })
            }
          />
        </PanelBody>
        <PanelBody
          title={__("Embed via Iframe", "minimal-map")}
          initialOpen={false}
        >
          <TextareaControl
            label={__("Iframe Snippet", "minimal-map")}
            value={iframeSnippet}
            readOnly
            rows={6}
            help={__(
              "The snippet updates automatically when this block configuration changes.",
              "minimal-map",
            )}
            onChange={() => {}}
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
            }}
          >
            <Button
              __next40pxDefaultSize
              variant="secondary"
              onClick={copyIframeSnippet}
              disabled={!iframeSnippet}
            >
              {__("Copy Snippet", "minimal-map")}
            </Button>
            {copyState === "copied" ? (
              <span>{__("Copied", "minimal-map")}</span>
            ) : null}
            {copyState === "error" ? (
              <span>{__("Copy failed", "minimal-map")}</span>
            ) : null}
          </div>
        </PanelBody>
      </InspectorControls>
      <InspectorControls group="styles">
        <PanelBody title={__("Appearance", "minimal-map")} initialOpen={false}>
          <UnitControl
            className="minimal-map-editor__height-control components-border-radius-control__unit-control"
            label={__("Height", "minimal-map")}
            value={getHeightControlValue(
              attributes.height ?? 420,
              attributes.heightUnit || "px",
            )}
            onChange={updateHeight}
            units={HEIGHT_UNITS}
            size="__unstable-large"
          />
          <UnitControl
            className="minimal-map-editor__height-control components-border-radius-control__unit-control"
            label={__("Height Mobile", "minimal-map")}
            value={getHeightControlValue(
              attributes.heightMobile,
              attributes.heightMobileUnit || attributes.heightUnit || "px",
            )}
            onChange={updateHeightMobile}
            units={HEIGHT_UNITS}
            size="__unstable-large"
          />
          <SelectControl
            label={__("Style Preset", "minimal-map")}
            value={attributes.stylePreset}
            options={styleOptions}
            onChange={(value: string) => setAttributes({ stylePreset: value })}
          />
        </PanelBody>
        <PanelBody
          title={__("Zoom Controls", "minimal-map")}
          initialOpen={false}
        >
          <ZoomControlColorSettings
            backgroundColor={attributes.zoomControlsBackgroundColor}
            iconColor={attributes.zoomControlsIconColor}
            borderColor={attributes.zoomControlsBorderColor}
            defaultBackgroundColor={
              runtimeConfig.defaults?.zoomControlsBackgroundColor ?? "#ffffff"
            }
            defaultIconColor={
              runtimeConfig.defaults?.zoomControlsIconColor ?? "#1e1e1e"
            }
            defaultBorderColor={
              runtimeConfig.defaults?.zoomControlsBorderColor ?? "#dcdcde"
            }
            onChange={(key, value) => setAttributes({ [key]: value })}
          />
          <ToggleGroupControl
            __next40pxDefaultSize
            label={__("Position", "minimal-map")}
            value={attributes.zoomControlsPosition}
            isBlock
            onChange={(nextValue?: string | number) => {
              if (typeof nextValue === "string") {
                setAttributes({
                  zoomControlsPosition: nextValue as ZoomControlsPosition,
                });
              }
            }}
          >
            {ZOOM_CONTROLS_POSITION_OPTIONS.map((option) => (
              <ToggleGroupControlOptionIcon
                key={option.value}
                value={option.value}
                label={option.label}
                icon={option.icon}
              />
            ))}
          </ToggleGroupControl>
          <div className="minimal-map-editor__box-control">
            <BoxControl
              __next40pxDefaultSize
              label={__("Padding", "minimal-map")}
              values={attributes.zoomControlsPadding}
              units={HEIGHT_UNITS}
              inputProps={BOX_CONTROL_INPUT_PROPS}
              onChange={(value?: BoxValue) => {
                setAttributes({
                  zoomControlsPadding: value ?? attributes.zoomControlsPadding,
                });
              }}
            />
          </div>
          <div className="minimal-map-editor__box-control">
            <BoxControl
              __next40pxDefaultSize
              label={__("Outer Margin", "minimal-map")}
              values={attributes.zoomControlsOuterMargin}
              units={HEIGHT_UNITS}
              inputProps={BOX_CONTROL_INPUT_PROPS}
              onChange={(value?: BoxValue) => {
                setAttributes({
                  zoomControlsOuterMargin:
                    value ?? attributes.zoomControlsOuterMargin,
                });
              }}
            />
          </div>
          <div ref={zoomControlsRadiusRef}>
            <BorderRadiusControl
              onChange={(value: string | BorderRadiusValues) => {
                setAttributes({
                  zoomControlsBorderRadius: stringifyBorderRadiusValue(value),
                });
              }}
              values={parseBorderRadiusValue(
                attributes.zoomControlsBorderRadius,
              )}
            />
          </div>
          <UnitControl
            label={__("Border Width", "minimal-map")}
            value={attributes.zoomControlsBorderWidth}
            onChange={updateBorderWidth}
            units={BORDER_UNITS}
            size="__unstable-large"
          />
        </PanelBody>
        <PanelBody
          title={__("Search Panel", "minimal-map")}
          initialOpen={false}
        >
          <SearchPanelColorSettings
            backgroundPrimary={attributes.searchPanelBackgroundPrimary}
            backgroundSecondary={attributes.searchPanelBackgroundSecondary}
            backgroundHover={attributes.searchPanelBackgroundHover}
            foregroundPrimary={attributes.searchPanelForegroundPrimary}
            foregroundSecondary={attributes.searchPanelForegroundSecondary}
            defaults={{
              backgroundPrimary:
                runtimeConfig.defaults?.searchPanelBackgroundPrimary ??
                "#ffffff",
              backgroundSecondary:
                runtimeConfig.defaults?.searchPanelBackgroundSecondary ??
                "#f0f0f1",
              backgroundHover:
                runtimeConfig.defaults?.searchPanelBackgroundHover ?? "#f8f8f8",
              foregroundPrimary:
                runtimeConfig.defaults?.searchPanelForegroundPrimary ??
                "#1e1e1e",
              foregroundSecondary:
                runtimeConfig.defaults?.searchPanelForegroundSecondary ??
                "#1e1e1e",
            }}
            onChange={(key, value) => setAttributes({ [key]: value })}
          />
          <div className="minimal-map-editor__box-control">
            <BoxControl
              __next40pxDefaultSize
              label={__("Outer Margin", "minimal-map")}
              values={attributes.searchPanelOuterMargin}
              units={HEIGHT_UNITS}
              inputProps={BOX_CONTROL_INPUT_PROPS}
              onChange={(value?: BoxValue) => {
                setAttributes({
                  searchPanelOuterMargin:
                    value ?? attributes.searchPanelOuterMargin,
                });
              }}
            />
          </div>
          <div ref={searchPanelInputRadiusRef} style={{ marginBottom: "8px" }}>
            <BorderRadiusControl
              label={__("Border Radius Input", "minimal-map")}
              onChange={(value: string | BorderRadiusValues) => {
                setAttributes({
                  searchPanelBorderRadiusInput:
                    stringifyBorderRadiusValue(value),
                });
              }}
              values={parseBorderRadiusValue(
                attributes.searchPanelBorderRadiusInput || "10px",
              )}
            />
          </div>
          <div ref={searchPanelCardRadiusRef} style={{ marginBottom: "8px" }}>
            <BorderRadiusControl
              label={__("Border Radius Card", "minimal-map")}
              onChange={(value: string | BorderRadiusValues) => {
                setAttributes({
                  searchPanelBorderRadiusCard:
                    stringifyBorderRadiusValue(value),
                });
              }}
              values={parseBorderRadiusValue(
                attributes.searchPanelBorderRadiusCard,
              )}
            />
          </div>
          <UnitControl
            label={__("Card Gap", "minimal-map")}
            value={attributes.searchPanelCardGap}
            onChange={updateSearchPanelCardGap}
            units={HEIGHT_UNITS}
            size="__unstable-large"
          />
          <UnitControl
            label={__("Panel Width", "minimal-map")}
            value={attributes.searchPanelWidth}
            onChange={updateSearchPanelWidth}
            units={HEIGHT_UNITS}
            size="__unstable-large"
          />
        </PanelBody>
        <PanelBody title={__("Credits", "minimal-map")} initialOpen={false}>
          <CreditsColorSettings
            backgroundColor={attributes.creditsBackgroundColor}
            foregroundColor={attributes.creditsForegroundColor}
            defaultBackgroundColor={
              runtimeConfig.defaults?.creditsBackgroundColor ?? "#ffffff"
            }
            defaultForegroundColor={
              runtimeConfig.defaults?.creditsForegroundColor ?? "#1e1e1e"
            }
            onChange={(key, value) => setAttributes({ [key]: value })}
          />
          <div ref={creditsRadiusRef} style={{ marginBottom: "8px" }}>
            <BorderRadiusControl
              label={__("Border Radius", "minimal-map")}
              onChange={(value: string | BorderRadiusValues) => {
                setAttributes({
                  creditsBorderRadius: stringifyBorderRadiusValue(value),
                });
              }}
              values={parseBorderRadiusValue(attributes.creditsBorderRadius)}
            />
          </div>
          <div className="minimal-map-editor__box-control">
            <BoxControl
              __next40pxDefaultSize
              label={__("Padding", "minimal-map")}
              values={attributes.creditsPadding}
              units={HEIGHT_UNITS}
              inputProps={BOX_CONTROL_INPUT_PROPS}
              onChange={(value?: BoxValue) => {
                setAttributes({
                  creditsPadding: value ?? attributes.creditsPadding,
                });
              }}
            />
          </div>
          <div className="minimal-map-editor__box-control">
            <BoxControl
              __next40pxDefaultSize
              label={__("Outer Margin", "minimal-map")}
              values={attributes.creditsOuterMargin}
              units={HEIGHT_UNITS}
              inputProps={BOX_CONTROL_INPUT_PROPS}
              onChange={(value?: BoxValue) => {
                setAttributes({
                  creditsOuterMargin: value ?? attributes.creditsOuterMargin,
                });
              }}
            />
          </div>
        </PanelBody>
        <PanelBody
          title={__("Google Maps Button", "minimal-map")}
          initialOpen={false}
        >
          <GoogleMapsButtonColorSettings
            backgroundColor={attributes.googleMapsButtonBackgroundColor}
            foregroundColor={attributes.googleMapsButtonForegroundColor}
            defaultBackgroundColor={
              runtimeConfig.defaults?.googleMapsButtonBackgroundColor ??
              runtimeConfig.defaults?.searchPanelBackgroundSecondary ??
              "#f0f0f1"
            }
            defaultForegroundColor={
              runtimeConfig.defaults?.googleMapsButtonForegroundColor ??
              runtimeConfig.defaults?.searchPanelForegroundSecondary ??
              "#1e1e1e"
            }
            onChange={(key, value) => setAttributes({ [key]: value })}
          />
          <div
            ref={googleMapsButtonRadiusRef}
            style={{ marginBottom: "8px" }}
          >
            <BorderRadiusControl
              label={__("Border Radius", "minimal-map")}
              onChange={(value: string | BorderRadiusValues) => {
                setAttributes({
                  googleMapsButtonBorderRadius:
                    stringifyBorderRadiusValue(value),
                });
              }}
              values={parseBorderRadiusValue(
                attributes.googleMapsButtonBorderRadius,
              )}
            />
          </div>
          <div className="minimal-map-editor__box-control">
            <BoxControl
              __next40pxDefaultSize
              label={__("Padding", "minimal-map")}
              values={attributes.googleMapsButtonPadding}
              units={HEIGHT_UNITS}
              inputProps={BOX_CONTROL_INPUT_PROPS}
              onChange={(value?: BoxValue) => {
                setAttributes({
                  googleMapsButtonPadding:
                    value ?? attributes.googleMapsButtonPadding,
                });
              }}
            />
          </div>
          <ToggleControl
            label={__("Show icon", "minimal-map")}
            checked={attributes.googleMapsButtonShowIcon}
            onChange={(value: boolean) =>
              setAttributes({ googleMapsButtonShowIcon: value })
            }
          />
        </PanelBody>
      </InspectorControls>
      <div {...blockProps}>
        <div
          ref={mapRef}
          className="minimal-map-editor__canvas"
          style={{ height: previewHeightCssValue }}
        />
      </div>
    </>
  );
}
