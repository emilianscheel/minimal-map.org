/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/block/edit.tsx"
/*!****************************!*\
  !*** ./src/block/edit.tsx ***!
  \****************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ Edit)
/* harmony export */ });
/* harmony import */ var _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/block-editor */ "@wordpress/block-editor");
/* harmony import */ var _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/components */ "@wordpress/components");
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _components_Icons__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../components/Icons */ "./src/components/Icons.tsx");
/* harmony import */ var _embed__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./embed */ "./src/block/embed.ts");
/* harmony import */ var _map_bootstrap__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../map/bootstrap */ "./src/map/bootstrap.ts");
/* harmony import */ var _map_defaults__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../map/defaults */ "./src/map/defaults.ts");
/* harmony import */ var _map_zoom_control_options__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../map/zoom-control-options */ "./src/map/zoom-control-options.ts");
/* harmony import */ var _map_style_presets__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ../map/style-presets */ "./src/map/style-presets.ts");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__);











const runtimeConfig = window.MinimalMapBlockConfig ?? {};
const HEIGHT_UNITS = (runtimeConfig.heightUnits ?? ["px", "em", "rem", "%", "vh", "vw"]).map(value => ({
  label: value,
  value
}));
const BORDER_UNITS = ["px", "em", "rem"].map(value => ({
  label: value,
  value
}));
const BOX_CONTROL_INPUT_PROPS = {
  min: 0,
  max: 50
};
const BORDER_RADIUS_RANGE_MAX = 50;
function clampRangeInputs(root, max) {
  if (!root) {
    return;
  }
  const maxValue = `${max}`;
  root.querySelectorAll('input[type="range"]').forEach(input => {
    input.max = maxValue;
    input.setAttribute("max", maxValue);
    input.setAttribute("aria-valuemax", maxValue);
  });
}
function parseHeightValue(rawValue, fallbackUnit) {
  if (typeof rawValue === "number") {
    return {
      height: rawValue,
      heightUnit: (0,_map_defaults__WEBPACK_IMPORTED_MODULE_7__.normalizeHeightUnit)(fallbackUnit)
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
    heightUnit: (0,_map_defaults__WEBPACK_IMPORTED_MODULE_7__.normalizeHeightUnit)(match[2] || fallbackUnit)
  };
}
function parseLengthValue(rawValue, fallback = "1px") {
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
  return `${Number(match[1])}${(0,_map_defaults__WEBPACK_IMPORTED_MODULE_7__.normalizeHeightUnit)(unit)}`;
}
function copyTextToClipboard(value) {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(value).then(() => true).catch(() => false);
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
function stringifyBorderRadiusValue(value) {
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
  const values = [topLeft, topRight, bottomRight, bottomLeft].filter(part => typeof part === "string" && part.length > 0);
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
function parseBorderRadiusValue(value) {
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
      bottomLeft
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
      bottomLeft: second
    };
  }
  if (parts.length === 3) {
    return {
      topLeft,
      topRight: second,
      bottomRight: third,
      bottomLeft: second
    };
  }
  return {
    topLeft,
    topRight: second,
    bottomRight: third,
    bottomLeft: fourth
  };
}
function ZoomControlColorSettings({
  backgroundColor,
  iconColor,
  borderColor,
  defaultBackgroundColor,
  defaultIconColor,
  defaultBorderColor,
  onChange
}) {
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)("div", {
    style: {
      display: "grid",
      gap: "8px",
      marginBottom: "16px"
    },
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(CompactColorDropdown, {
      label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)("Background", "minimal-map"),
      value: backgroundColor,
      defaultValue: defaultBackgroundColor,
      onChange: value => onChange("zoomControlsBackgroundColor", value)
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(CompactColorDropdown, {
      label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)("Foreground", "minimal-map"),
      value: iconColor,
      defaultValue: defaultIconColor,
      onChange: value => onChange("zoomControlsIconColor", value)
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(CompactColorDropdown, {
      label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)("Border", "minimal-map"),
      value: borderColor,
      defaultValue: defaultBorderColor,
      onChange: value => onChange("zoomControlsBorderColor", value)
    })]
  });
}
function CreditsColorSettings({
  backgroundColor,
  foregroundColor,
  defaultBackgroundColor,
  defaultForegroundColor,
  onChange
}) {
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)("div", {
    style: {
      display: "grid",
      gap: "8px",
      marginBottom: "16px"
    },
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(CompactColorDropdown, {
      label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)("Background", "minimal-map"),
      value: backgroundColor,
      defaultValue: defaultBackgroundColor,
      onChange: value => onChange("creditsBackgroundColor", value)
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(CompactColorDropdown, {
      label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)("Foreground", "minimal-map"),
      value: foregroundColor,
      defaultValue: defaultForegroundColor,
      onChange: value => onChange("creditsForegroundColor", value)
    })]
  });
}
function SearchPanelColorSettings({
  backgroundPrimary,
  backgroundSecondary,
  backgroundHover,
  foregroundPrimary,
  foregroundSecondary,
  defaults,
  onChange
}) {
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)("div", {
    style: {
      display: "grid",
      gap: "8px",
      marginBottom: "16px"
    },
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(CompactColorDropdown, {
      label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)("Background Primary", "minimal-map"),
      value: backgroundPrimary,
      defaultValue: defaults.backgroundPrimary,
      onChange: value => onChange("searchPanelBackgroundPrimary", value)
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(CompactColorDropdown, {
      label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)("Background Secondary", "minimal-map"),
      value: backgroundSecondary,
      defaultValue: defaults.backgroundSecondary,
      onChange: value => onChange("searchPanelBackgroundSecondary", value)
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(CompactColorDropdown, {
      label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)("Background Hover", "minimal-map"),
      value: backgroundHover,
      defaultValue: defaults.backgroundHover,
      onChange: value => onChange("searchPanelBackgroundHover", value)
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(CompactColorDropdown, {
      label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)("Foreground Primary", "minimal-map"),
      value: foregroundPrimary,
      defaultValue: defaults.foregroundPrimary,
      onChange: value => onChange("searchPanelForegroundPrimary", value)
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(CompactColorDropdown, {
      label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)("Foreground Secondary", "minimal-map"),
      value: foregroundSecondary,
      defaultValue: defaults.foregroundSecondary,
      onChange: value => onChange("searchPanelForegroundSecondary", value)
    })]
  });
}
function CompactColorDropdown({
  label,
  value,
  defaultValue,
  onChange
}) {
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Dropdown, {
    className: "minimal-map-editor__compact-color-dropdown",
    popoverProps: {
      placement: "left-start",
      offset: 36,
      shift: true
    },
    renderToggle: ({
      isOpen,
      onToggle
    }) => /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Button, {
      __next40pxDefaultSize: true,
      variant: "tertiary",
      onClick: onToggle,
      "aria-expanded": isOpen,
      style: {
        width: "100%",
        justifyContent: "flex-start",
        paddingInline: "12px",
        color: "var(--wp-components-color-foreground, #1e1e1e)"
      },
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.__experimentalHStack, {
        justify: "flex-start",
        spacing: 3,
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.ColorIndicator, {
          colorValue: value
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.FlexItem, {
          title: label,
          children: label
        })]
      })
    }),
    renderContent: () => /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.__experimentalDropdownContentWrapper, {
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("div", {
        style: {
          width: "280px",
          maxWidth: "min(280px, 100vw - 32px)"
        },
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__.__experimentalColorGradientControl, {
          label: label,
          showTitle: false,
          clearable: false,
          enableAlpha: false,
          onColorChange: nextValue => onChange(typeof nextValue === "string" && nextValue.length > 0 ? nextValue : defaultValue),
          colorValue: value
        })
      })
    })
  });
}
function ThemeDropdown({
  themes,
  selectedSlug,
  onChange
}) {
  const selectedTheme = themes.find(theme => theme.slug === selectedSlug) || themes.find(theme => theme.slug === "default");
  const selectedLabel = selectedTheme?.label || (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)("Default", "minimal-map");
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)("div", {
    style: {
      display: "grid",
      gap: "8px",
      marginBottom: "16px"
    },
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("span", {
      children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)("Style Theme", "minimal-map")
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Dropdown, {
      className: "minimal-map-editor__theme-dropdown",
      popoverProps: {
        placement: "left-start",
        offset: 36,
        shift: true
      },
      renderToggle: ({
        isOpen,
        onToggle
      }) => /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Button, {
        __next40pxDefaultSize: true,
        variant: "secondary",
        onClick: onToggle,
        "aria-expanded": isOpen,
        style: {
          width: "100%",
          justifyContent: "space-between",
          paddingInline: "12px"
        },
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("span", {
          children: selectedLabel
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_components_Icons__WEBPACK_IMPORTED_MODULE_4__.ChevronDownIcon, {
          size: 16,
          style: {
            flexShrink: 0
          }
        })]
      }),
      renderContent: ({
        onClose
      }) => /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.MenuGroup, {
        label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)("Switch Theme", "minimal-map"),
        children: themes.map(theme => {
          const isSelected = theme.slug === selectedSlug;
          return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.MenuItem, {
            onClick: () => {
              onChange(theme.slug);
              onClose();
            },
            children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.__experimentalHStack, {
              justify: "space-between",
              style: {
                width: "100%"
              },
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("span", {
                children: theme.label
              }), isSelected && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_components_Icons__WEBPACK_IMPORTED_MODULE_4__.CheckIcon, {
                size: 16,
                style: {
                  flexShrink: 0,
                  color: "var(--wp-admin-theme-color, #3858e8)"
                }
              })]
            })
          }, theme.slug);
        })
      })
    })]
  });
}
function CollectionDropdown({
  options,
  selectedId,
  onChange
}) {
  const selectedCollection = options.find(option => option.id === selectedId);
  const selectedLabel = selectedId > 0 ? selectedCollection?.title || (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)("Collection unavailable", "minimal-map") : (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)("All locations", "minimal-map");
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)("div", {
    style: {
      display: "grid",
      gap: "8px",
      marginBottom: "16px"
    },
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("span", {
      children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)("Collection", "minimal-map")
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Dropdown, {
      className: "minimal-map-editor__collection-dropdown",
      popoverProps: {
        placement: "left-start",
        offset: 36,
        shift: true
      },
      renderToggle: ({
        isOpen,
        onToggle
      }) => /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Button, {
        __next40pxDefaultSize: true,
        variant: "secondary",
        onClick: onToggle,
        "aria-expanded": isOpen,
        style: {
          width: "100%",
          justifyContent: "space-between",
          paddingInline: "12px"
        },
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("span", {
          children: selectedLabel
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_components_Icons__WEBPACK_IMPORTED_MODULE_4__.ChevronDownIcon, {
          size: 16,
          style: {
            flexShrink: 0
          }
        })]
      }),
      renderContent: ({
        onClose
      }) => /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.MenuGroup, {
        label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)("Switch Collection", "minimal-map"),
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.MenuItem, {
          onClick: () => {
            onChange(0);
            onClose();
          },
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.__experimentalHStack, {
            justify: "space-between",
            style: {
              width: "100%"
            },
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("span", {
              children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)("All locations", "minimal-map")
            }), selectedId === 0 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_components_Icons__WEBPACK_IMPORTED_MODULE_4__.CheckIcon, {
              size: 16,
              style: {
                flexShrink: 0,
                color: "var(--wp-admin-theme-color, #3858e8)"
              }
            })]
          })
        }), options.map(option => {
          const isSelected = selectedId === option.id;
          return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.MenuItem, {
            onClick: () => {
              onChange(option.id);
              onClose();
            },
            children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.__experimentalHStack, {
              justify: "space-between",
              style: {
                width: "100%"
              },
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("span", {
                children: option.title
              }), isSelected && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_components_Icons__WEBPACK_IMPORTED_MODULE_4__.CheckIcon, {
                size: 16,
                style: {
                  flexShrink: 0,
                  color: "var(--wp-admin-theme-color, #3858e8)"
                }
              })]
            })
          }, option.id);
        }), options.length === 0 ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("div", {
          style: {
            padding: "8px 12px",
            color: "#757575",
            fontSize: "12px"
          },
          children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)("No collections available.", "minimal-map")
        }) : null]
      })
    })]
  });
}
function Edit({
  attributes,
  setAttributes
}) {
  const mapRef = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_2__.useRef)(null);
  const mapInstanceRef = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_2__.useRef)(null);
  const zoomControlsRadiusRef = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_2__.useRef)(null);
  const searchPanelInputRadiusRef = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_2__.useRef)(null);
  const searchPanelCardRadiusRef = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_2__.useRef)(null);
  const creditsRadiusRef = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_2__.useRef)(null);
  const [copyState, setCopyState] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_2__.useState)("idle");
  const styleOptions = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_2__.useMemo)(() => (0,_map_style_presets__WEBPACK_IMPORTED_MODULE_9__.getStyleOptions)(runtimeConfig.stylePresets), []);
  const selectedCollection = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_2__.useMemo)(() => attributes.collectionId > 0 ? (runtimeConfig.collections ?? []).find(collection => collection.id === attributes.collectionId) ?? null : null, [attributes.collectionId]);
  const config = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_2__.useMemo)(() => (0,_map_defaults__WEBPACK_IMPORTED_MODULE_7__.normalizeMapConfig)({
    ...attributes,
    locations: attributes.collectionId > 0 ? selectedCollection?.locations ?? [] : undefined
  }, runtimeConfig), [attributes, selectedCollection]);
  const iframeSnippet = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_2__.useMemo)(() => (0,_embed__WEBPACK_IMPORTED_MODULE_5__.buildIframeSnippet)(attributes, runtimeConfig), [attributes]);
  const blockProps = (0,_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__.useBlockProps)({
    className: "minimal-map-editor"
  });
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_2__.useEffect)(() => {
    if (!mapRef.current) {
      return undefined;
    }
    mapInstanceRef.current = (0,_map_bootstrap__WEBPACK_IMPORTED_MODULE_6__.createMinimalMap)(mapRef.current, config, runtimeConfig);
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
      }
    };
  }, []);
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_2__.useEffect)(() => {
    mapInstanceRef.current?.update(config);
  }, [config]);
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_2__.useEffect)(() => {
    const targets = [zoomControlsRadiusRef.current, searchPanelInputRadiusRef.current, searchPanelCardRadiusRef.current, creditsRadiusRef.current];
    const observers = targets.filter(target => target !== null).map(target => {
      clampRangeInputs(target, BORDER_RADIUS_RANGE_MAX);
      const observer = new MutationObserver(() => {
        clampRangeInputs(target, BORDER_RADIUS_RANGE_MAX);
      });
      observer.observe(target, {
        childList: true,
        subtree: true
      });
      return observer;
    });
    return () => {
      observers.forEach(observer => observer.disconnect());
    };
  }, []);
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_2__.useEffect)(() => {
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
  function updateNumberAttribute(key) {
    return value => {
      const numericValue = Number(value);
      if (Number.isNaN(numericValue)) {
        return;
      }
      setAttributes({
        [key]: numericValue
      });
    };
  }
  const updateHeight = value => {
    const parsed = parseHeightValue(value, attributes.heightUnit || "px");
    if (!parsed || Number.isNaN(parsed.height) || parsed.height <= 0) {
      return;
    }
    setAttributes({
      height: parsed.height,
      heightUnit: parsed.heightUnit
    });
  };
  const updateZoom = value => {
    if (typeof value === "number") {
      setAttributes({
        zoom: value
      });
    }
  };
  const updateBorderWidth = value => {
    const parsed = parseLengthValue(value, attributes.zoomControlsBorderWidth || "1px");
    if (parsed) {
      setAttributes({
        zoomControlsBorderWidth: parsed
      });
    }
  };
  const updateSearchPanelCardGap = value => {
    const parsed = parseLengthValue(value, attributes.searchPanelCardGap || "12px");
    if (parsed) {
      setAttributes({
        searchPanelCardGap: parsed
      });
    }
  };
  const updateSearchPanelWidth = value => {
    const parsed = parseLengthValue(value, attributes.searchPanelWidth || "320px");
    if (parsed) {
      setAttributes({
        searchPanelWidth: parsed
      });
    }
  };
  const copyIframeSnippet = () => {
    if (!iframeSnippet) {
      return;
    }
    void copyTextToClipboard(iframeSnippet).then(copied => {
      setCopyState(copied ? "copied" : "error");
    });
  };
  if (attributes._isPreview) {
    return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("div", {
      ...(0,_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__.useBlockProps)({
        className: "minimal-map-editor__preview minimal-map-editor--preview",
        style: {
          backgroundImage: runtimeConfig.previewImageUrl ? `url(${runtimeConfig.previewImageUrl})` : "none",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f0f0f1",
          color: "#757575",
          fontSize: "13px"
        }
      }),
      children: !runtimeConfig.previewImageUrl && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)("div", {
        style: {
          textAlign: "center",
          padding: "20px"
        },
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_components_Icons__WEBPACK_IMPORTED_MODULE_4__.MapPinnedIcon, {
          size: 48,
          style: {
            marginBottom: "12px",
            opacity: 0.5
          }
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("p", {
          style: {
            margin: 0
          },
          children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)("Minimal Map Preview", "minimal-map")
        })]
      })
    });
  }
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.Fragment, {
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__.InspectorControls, {
      group: "settings",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.PanelBody, {
        title: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)("Map Settings", "minimal-map"),
        initialOpen: true,
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(CollectionDropdown, {
          options: runtimeConfig.collections ?? [],
          selectedId: attributes.collectionId,
          onChange: value => setAttributes({
            collectionId: value
          })
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(ThemeDropdown, {
          themes: runtimeConfig.styleThemes ?? [],
          selectedSlug: attributes.styleThemeSlug,
          onChange: value => setAttributes({
            styleThemeSlug: value
          })
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.TextControl, {
          label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)("Center Latitude", "minimal-map"),
          type: "number",
          step: "0.000001",
          value: attributes.centerLat,
          onChange: updateNumberAttribute("centerLat")
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.TextControl, {
          label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)("Center Longitude", "minimal-map"),
          type: "number",
          step: "0.000001",
          value: attributes.centerLng,
          onChange: updateNumberAttribute("centerLng")
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.RangeControl, {
          label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)("Zoom", "minimal-map"),
          value: attributes.zoom,
          onChange: updateZoom,
          min: 0,
          max: 22,
          step: 0.5
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.ToggleControl, {
          label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)("Show Zoom Controls", "minimal-map"),
          checked: attributes.showZoomControls,
          onChange: value => setAttributes({
            showZoomControls: value
          })
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.ToggleControl, {
          label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)("Allow Zoom via Scroll", "minimal-map"),
          checked: attributes.scrollZoom,
          onChange: value => setAttributes({
            scrollZoom: value
          })
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.ToggleControl, {
          label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)("Allow Two-Finger Zoom on Mobile", "minimal-map"),
          checked: attributes.mobileTwoFingerZoom,
          onChange: value => setAttributes({
            mobileTwoFingerZoom: value
          })
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.ToggleControl, {
          label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)("Allow Search", "minimal-map"),
          checked: attributes.allowSearch,
          onChange: value => setAttributes({
            allowSearch: value
          })
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.PanelBody, {
        title: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)("Embed via Iframe", "minimal-map"),
        initialOpen: false,
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.TextareaControl, {
          label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)("Iframe Snippet", "minimal-map"),
          value: iframeSnippet,
          readOnly: true,
          rows: 6,
          help: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)("The snippet updates automatically when this block configuration changes.", "minimal-map"),
          onChange: () => {}
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)("div", {
          style: {
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px"
          },
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Button, {
            __next40pxDefaultSize: true,
            variant: "secondary",
            onClick: copyIframeSnippet,
            disabled: !iframeSnippet,
            children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)("Copy Snippet", "minimal-map")
          }), copyState === "copied" ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("span", {
            children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)("Copied", "minimal-map")
          }) : null, copyState === "error" ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("span", {
            children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)("Copy failed", "minimal-map")
          }) : null]
        })]
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__.InspectorControls, {
      group: "styles",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.PanelBody, {
        title: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)("Appearance", "minimal-map"),
        initialOpen: false,
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.__experimentalUnitControl, {
          className: "minimal-map-editor__height-control components-border-radius-control__unit-control",
          label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)("Height", "minimal-map"),
          value: `${attributes.height ?? 420}${attributes.heightUnit || "px"}`,
          onChange: updateHeight,
          units: HEIGHT_UNITS,
          size: "__unstable-large"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.SelectControl, {
          label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)("Style Preset", "minimal-map"),
          value: attributes.stylePreset,
          options: styleOptions,
          onChange: value => setAttributes({
            stylePreset: value
          })
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.PanelBody, {
        title: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)("Zoom Controls", "minimal-map"),
        initialOpen: false,
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(ZoomControlColorSettings, {
          backgroundColor: attributes.zoomControlsBackgroundColor,
          iconColor: attributes.zoomControlsIconColor,
          borderColor: attributes.zoomControlsBorderColor,
          defaultBackgroundColor: runtimeConfig.defaults?.zoomControlsBackgroundColor ?? "#ffffff",
          defaultIconColor: runtimeConfig.defaults?.zoomControlsIconColor ?? "#1e1e1e",
          defaultBorderColor: runtimeConfig.defaults?.zoomControlsBorderColor ?? "#dcdcde",
          onChange: (key, value) => setAttributes({
            [key]: value
          })
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.__experimentalToggleGroupControl, {
          __next40pxDefaultSize: true,
          label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)("Position", "minimal-map"),
          value: attributes.zoomControlsPosition,
          isBlock: true,
          onChange: nextValue => {
            if (typeof nextValue === "string") {
              setAttributes({
                zoomControlsPosition: nextValue
              });
            }
          },
          children: _map_zoom_control_options__WEBPACK_IMPORTED_MODULE_8__.ZOOM_CONTROLS_POSITION_OPTIONS.map(option => /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.__experimentalToggleGroupControlOptionIcon, {
            value: option.value,
            label: option.label,
            icon: option.icon
          }, option.value))
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("div", {
          className: "minimal-map-editor__box-control",
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.BoxControl, {
            __next40pxDefaultSize: true,
            label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)("Padding", "minimal-map"),
            values: attributes.zoomControlsPadding,
            units: HEIGHT_UNITS,
            inputProps: BOX_CONTROL_INPUT_PROPS,
            onChange: value => {
              setAttributes({
                zoomControlsPadding: value ?? attributes.zoomControlsPadding
              });
            }
          })
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("div", {
          className: "minimal-map-editor__box-control",
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.BoxControl, {
            __next40pxDefaultSize: true,
            label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)("Outer Margin", "minimal-map"),
            values: attributes.zoomControlsOuterMargin,
            units: HEIGHT_UNITS,
            inputProps: BOX_CONTROL_INPUT_PROPS,
            onChange: value => {
              setAttributes({
                zoomControlsOuterMargin: value ?? attributes.zoomControlsOuterMargin
              });
            }
          })
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("div", {
          ref: zoomControlsRadiusRef,
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__.__experimentalBorderRadiusControl, {
            onChange: value => {
              setAttributes({
                zoomControlsBorderRadius: stringifyBorderRadiusValue(value)
              });
            },
            values: parseBorderRadiusValue(attributes.zoomControlsBorderRadius)
          })
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.__experimentalUnitControl, {
          label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)("Border Width", "minimal-map"),
          value: attributes.zoomControlsBorderWidth,
          onChange: updateBorderWidth,
          units: BORDER_UNITS,
          size: "__unstable-large"
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.PanelBody, {
        title: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)("Search Panel", "minimal-map"),
        initialOpen: false,
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(SearchPanelColorSettings, {
          backgroundPrimary: attributes.searchPanelBackgroundPrimary,
          backgroundSecondary: attributes.searchPanelBackgroundSecondary,
          backgroundHover: attributes.searchPanelBackgroundHover,
          foregroundPrimary: attributes.searchPanelForegroundPrimary,
          foregroundSecondary: attributes.searchPanelForegroundSecondary,
          defaults: {
            backgroundPrimary: runtimeConfig.defaults?.searchPanelBackgroundPrimary ?? "#ffffff",
            backgroundSecondary: runtimeConfig.defaults?.searchPanelBackgroundSecondary ?? "#f0f0f1",
            backgroundHover: runtimeConfig.defaults?.searchPanelBackgroundHover ?? "#f8f8f8",
            foregroundPrimary: runtimeConfig.defaults?.searchPanelForegroundPrimary ?? "#1e1e1e",
            foregroundSecondary: runtimeConfig.defaults?.searchPanelForegroundSecondary ?? "#1e1e1e"
          },
          onChange: (key, value) => setAttributes({
            [key]: value
          })
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("div", {
          className: "minimal-map-editor__box-control",
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.BoxControl, {
            __next40pxDefaultSize: true,
            label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)("Outer Margin", "minimal-map"),
            values: attributes.searchPanelOuterMargin,
            units: HEIGHT_UNITS,
            inputProps: BOX_CONTROL_INPUT_PROPS,
            onChange: value => {
              setAttributes({
                searchPanelOuterMargin: value ?? attributes.searchPanelOuterMargin
              });
            }
          })
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("div", {
          ref: searchPanelInputRadiusRef,
          style: {
            marginBottom: "8px"
          },
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__.__experimentalBorderRadiusControl, {
            label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)("Border Radius Input", "minimal-map"),
            onChange: value => {
              setAttributes({
                searchPanelBorderRadiusInput: stringifyBorderRadiusValue(value)
              });
            },
            values: parseBorderRadiusValue(attributes.searchPanelBorderRadiusInput || "10px")
          })
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("div", {
          ref: searchPanelCardRadiusRef,
          style: {
            marginBottom: "8px"
          },
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__.__experimentalBorderRadiusControl, {
            label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)("Border Radius Card", "minimal-map"),
            onChange: value => {
              setAttributes({
                searchPanelBorderRadiusCard: stringifyBorderRadiusValue(value)
              });
            },
            values: parseBorderRadiusValue(attributes.searchPanelBorderRadiusCard)
          })
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.__experimentalUnitControl, {
          label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)("Card Gap", "minimal-map"),
          value: attributes.searchPanelCardGap,
          onChange: updateSearchPanelCardGap,
          units: HEIGHT_UNITS,
          size: "__unstable-large"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.__experimentalUnitControl, {
          label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)("Panel Width", "minimal-map"),
          value: attributes.searchPanelWidth,
          onChange: updateSearchPanelWidth,
          units: HEIGHT_UNITS,
          size: "__unstable-large"
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.PanelBody, {
        title: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)("Credits", "minimal-map"),
        initialOpen: false,
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(CreditsColorSettings, {
          backgroundColor: attributes.creditsBackgroundColor,
          foregroundColor: attributes.creditsForegroundColor,
          defaultBackgroundColor: runtimeConfig.defaults?.creditsBackgroundColor ?? "#ffffff",
          defaultForegroundColor: runtimeConfig.defaults?.creditsForegroundColor ?? "#1e1e1e",
          onChange: (key, value) => setAttributes({
            [key]: value
          })
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("div", {
          ref: creditsRadiusRef,
          style: {
            marginBottom: "8px"
          },
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__.__experimentalBorderRadiusControl, {
            label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)("Border Radius", "minimal-map"),
            onChange: value => {
              setAttributes({
                creditsBorderRadius: stringifyBorderRadiusValue(value)
              });
            },
            values: parseBorderRadiusValue(attributes.creditsBorderRadius)
          })
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("div", {
          className: "minimal-map-editor__box-control",
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.BoxControl, {
            __next40pxDefaultSize: true,
            label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)("Padding", "minimal-map"),
            values: attributes.creditsPadding,
            units: HEIGHT_UNITS,
            inputProps: BOX_CONTROL_INPUT_PROPS,
            onChange: value => {
              setAttributes({
                creditsPadding: value ?? attributes.creditsPadding
              });
            }
          })
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("div", {
          className: "minimal-map-editor__box-control",
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.BoxControl, {
            __next40pxDefaultSize: true,
            label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)("Outer Margin", "minimal-map"),
            values: attributes.creditsOuterMargin,
            units: HEIGHT_UNITS,
            inputProps: BOX_CONTROL_INPUT_PROPS,
            onChange: value => {
              setAttributes({
                creditsOuterMargin: value ?? attributes.creditsOuterMargin
              });
            }
          })
        })]
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("div", {
      ...blockProps,
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("div", {
        ref: mapRef,
        className: "minimal-map-editor__canvas",
        style: {
          height: config.heightCssValue
        }
      })
    })]
  });
}

/***/ },

/***/ "./src/block/embed.ts"
/*!****************************!*\
  !*** ./src/block/embed.ts ***!
  \****************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   EMBED_PAYLOAD_VERSION: () => (/* binding */ EMBED_PAYLOAD_VERSION),
/* harmony export */   EMBED_QUERY_PARAM: () => (/* binding */ EMBED_QUERY_PARAM),
/* harmony export */   buildEmbedUrl: () => (/* binding */ buildEmbedUrl),
/* harmony export */   buildIframeSnippet: () => (/* binding */ buildIframeSnippet),
/* harmony export */   createCanonicalEmbedAttributes: () => (/* binding */ createCanonicalEmbedAttributes),
/* harmony export */   createEmbedPayload: () => (/* binding */ createEmbedPayload)
/* harmony export */ });
/* harmony import */ var _map_defaults__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../map/defaults */ "./src/map/defaults.ts");

const EMBED_PAYLOAD_VERSION = 1;
const EMBED_QUERY_PARAM = 'minimal-map-config';
const EMBED_ATTRIBUTE_KEYS = ['centerLat', 'centerLng', 'zoom', 'collectionId', 'height', 'heightUnit', 'stylePreset', 'styleThemeSlug', 'showZoomControls', 'allowSearch', 'scrollZoom', 'mobileTwoFingerZoom', 'zoomControlsPosition', 'zoomControlsPadding', 'zoomControlsOuterMargin', 'zoomControlsBackgroundColor', 'zoomControlsIconColor', 'zoomControlsBorderRadius', 'zoomControlsBorderColor', 'zoomControlsBorderWidth', 'zoomControlsPlusIcon', 'zoomControlsMinusIcon', 'searchPanelBackgroundPrimary', 'searchPanelBackgroundSecondary', 'searchPanelBackgroundHover', 'searchPanelForegroundPrimary', 'searchPanelForegroundSecondary', 'searchPanelOuterMargin', 'searchPanelBorderRadiusInput', 'searchPanelBorderRadiusCard', 'searchPanelCardGap', 'searchPanelWidth', 'creditsPadding', 'creditsOuterMargin', 'creditsBackgroundColor', 'creditsForegroundColor', 'creditsBorderRadius'];
function encodeBase64Url(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  bytes.forEach(byte => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/u, '');
}
function escapeHtmlAttribute(value) {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function createCanonicalEmbedAttributes(attributes) {
  const canonical = {};
  EMBED_ATTRIBUTE_KEYS.forEach(key => {
    canonical[key] = attributes[key];
  });
  return canonical;
}
function createEmbedPayload(attributes) {
  return {
    v: EMBED_PAYLOAD_VERSION,
    attributes: createCanonicalEmbedAttributes(attributes)
  };
}
function buildEmbedUrl(attributes, runtimeConfig) {
  if (!runtimeConfig.embedBaseUrl) {
    return '';
  }
  const url = new URL(runtimeConfig.embedBaseUrl);
  url.searchParams.set(EMBED_QUERY_PARAM, encodeBase64Url(JSON.stringify(createEmbedPayload(attributes))));
  return url.toString();
}
function buildIframeSnippet(attributes, runtimeConfig) {
  const src = buildEmbedUrl(attributes, runtimeConfig);
  const heightCssValue = `${attributes.height}${(0,_map_defaults__WEBPACK_IMPORTED_MODULE_0__.normalizeHeightUnit)(attributes.heightUnit)}`;
  return `<iframe src="${escapeHtmlAttribute(src)}" title="Minimal Map" loading="lazy" style="width:100%;height:${escapeHtmlAttribute(heightCssValue)};border:0;"></iframe>`;
}

/***/ },

/***/ "./src/components/Icons.tsx"
/*!**********************************!*\
  !*** ./src/components/Icons.tsx ***!
  \**********************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   AdminSectionIcon: () => (/* binding */ AdminSectionIcon),
/* harmony export */   CheckIcon: () => (/* binding */ CheckIcon),
/* harmony export */   ChevronDownIcon: () => (/* binding */ ChevronDownIcon),
/* harmony export */   DashboardIcon: () => (/* binding */ DashboardIcon),
/* harmony export */   ImageIcon: () => (/* binding */ ImageIcon),
/* harmony export */   LayersIcon: () => (/* binding */ LayersIcon),
/* harmony export */   MapPinIcon: () => (/* binding */ MapPinIcon),
/* harmony export */   MapPinnedIcon: () => (/* binding */ MapPinnedIcon),
/* harmony export */   PaletteIcon: () => (/* binding */ PaletteIcon),
/* harmony export */   TagsIcon: () => (/* binding */ TagsIcon)
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__);

function IconBase({
  children,
  size = 24,
  strokeWidth = 1.75,
  style,
  className = "",
  ...props
}) {
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style: {
      fill: "none !important",
      ...style
    },
    className: `lucide ${className}`,
    ...props,
    children: children
  });
}
function CheckIcon(props) {
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(IconBase, {
    ...props,
    children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
      d: "m5 12 4 4L19 6"
    })
  });
}
function ChevronDownIcon(props) {
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(IconBase, {
    ...props,
    children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
      d: "m6 9 6 6 6-6"
    })
  });
}
function DashboardIcon(props) {
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(IconBase, {
    ...props,
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("rect", {
      x: "3",
      y: "3",
      width: "7",
      height: "7",
      rx: "1.5"
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("rect", {
      x: "14",
      y: "3",
      width: "7",
      height: "5",
      rx: "1.5"
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("rect", {
      x: "14",
      y: "11",
      width: "7",
      height: "10",
      rx: "1.5"
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("rect", {
      x: "3",
      y: "12",
      width: "7",
      height: "9",
      rx: "1.5"
    })]
  });
}
function ImageIcon(props) {
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(IconBase, {
    ...props,
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("rect", {
      x: "3",
      y: "4",
      width: "18",
      height: "16",
      rx: "2"
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("circle", {
      cx: "8.5",
      cy: "9",
      r: "1.5"
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
      d: "m21 16-5.5-5.5L9 17"
    })]
  });
}
function LayersIcon(props) {
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(IconBase, {
    ...props,
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
      d: "m12 3 8 4.5-8 4.5-8-4.5Z"
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
      d: "m4 12.5 8 4.5 8-4.5"
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
      d: "m4 17 8 4 8-4"
    })]
  });
}
function MapPinIcon(props) {
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(IconBase, {
    ...props,
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
      d: "M12 21c3.8-3.5 6.5-6.8 6.5-10.6A6.5 6.5 0 1 0 5.5 10.4C5.5 14.2 8.2 17.5 12 21Z"
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("circle", {
      cx: "12",
      cy: "10",
      r: "2.5"
    })]
  });
}
function MapPinnedIcon(props) {
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(IconBase, {
    ...props,
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
      d: "M3 6.5 9 4l6 2.5 6-2.5v13L15 20l-6-2.5L3 20Z"
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
      d: "M9 4v13.5"
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
      d: "M15 6.5V20"
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
      d: "M12 14.7c1.7-1.5 2.8-2.9 2.8-4.5a2.8 2.8 0 1 0-5.6 0c0 1.6 1.1 3 2.8 4.5Z"
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("circle", {
      cx: "12",
      cy: "10.2",
      r: "0.9"
    })]
  });
}
function PaletteIcon(props) {
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(IconBase, {
    ...props,
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
      d: "M4 21v-7"
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
      d: "M4 10V3"
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
      d: "M12 21v-9"
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
      d: "M12 8V3"
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
      d: "M20 21v-5"
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
      d: "M20 12V3"
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
      d: "M1 10h6"
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
      d: "M9 8h6"
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
      d: "M17 12h6"
    })]
  });
}
function TagsIcon(props) {
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(IconBase, {
    ...props,
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
      d: "M20 10 12 18l-7-7V4h7Z"
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
      d: "m12 6 6 6"
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("circle", {
      cx: "8.5",
      cy: "8.5",
      r: "1"
    })]
  });
}
const SECTION_ICONS = {
  dashboard: DashboardIcon,
  locations: MapPinnedIcon,
  collections: LayersIcon,
  logos: ImageIcon,
  tags: TagsIcon,
  markers: MapPinIcon,
  styles: PaletteIcon
};
function AdminSectionIcon({
  view,
  ...props
}) {
  const IconComponent = SECTION_ICONS[view] ?? DashboardIcon;
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(IconComponent, {
    "aria-hidden": "true",
    ...props
  });
}

/***/ },

/***/ "./src/map/bootstrap.ts"
/*!******************************!*\
  !*** ./src/map/bootstrap.ts ***!
  \******************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   bootstrapFrontendMaps: () => (/* binding */ bootstrapFrontendMaps),
/* harmony export */   createMinimalMap: () => (/* binding */ createMinimalMap),
/* harmony export */   loadMapRuntime: () => (/* binding */ loadMapRuntime)
/* harmony export */ });
let mapRuntimePromise = null;
function loadMapRuntime() {
  if (!mapRuntimePromise) {
    mapRuntimePromise = Promise.all(/*! import() | map-runtime */[__webpack_require__.e("map-runtime-vendor"), __webpack_require__.e("map-runtime")]).then(__webpack_require__.bind(__webpack_require__, /*! ./runtime */ "./src/map/runtime.ts"));
  }
  return mapRuntimePromise;
}
function createMinimalMap(host, initialConfig = {}, runtimeConfig = {}) {
  let latestConfig = initialConfig;
  let runtimeInstance = null;
  let isDestroyed = false;
  const runtimeReady = loadMapRuntime().then(runtime => {
    if (isDestroyed) {
      return null;
    }
    runtimeInstance = runtime.createMinimalMap(host, latestConfig, runtimeConfig);
    return runtimeInstance;
  }).catch(error => {
    console.error('Failed to load the Minimal Map runtime.', error);
    return null;
  });
  return {
    destroy: () => {
      isDestroyed = true;
      if (runtimeInstance) {
        runtimeInstance.destroy();
        runtimeInstance = null;
        return;
      }
      void runtimeReady.then(instance => {
        instance?.destroy();
      });
    },
    update: (nextConfig = {}) => {
      if (isDestroyed) {
        return;
      }
      latestConfig = nextConfig;
      runtimeInstance?.update(nextConfig);
    }
  };
}
function bootstrapFrontendMaps(runtimeConfig = window.MinimalMapFrontConfig ?? {}) {
  const nodes = document.querySelectorAll('[data-minimal-map-config]');
  if (nodes.length === 0) {
    return;
  }
  void loadMapRuntime().then(runtime => {
    runtime.bootstrapFrontendMaps(runtimeConfig);
  }).catch(error => {
    console.error('Failed to bootstrap Minimal Map frontend maps.', error);
  });
}

/***/ },

/***/ "./src/map/defaults.ts"
/*!*****************************!*\
  !*** ./src/map/defaults.ts ***!
  \*****************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   HEIGHT_UNITS: () => (/* binding */ HEIGHT_UNITS),
/* harmony export */   normalizeHeightUnit: () => (/* binding */ normalizeHeightUnit),
/* harmony export */   normalizeMapConfig: () => (/* binding */ normalizeMapConfig)
/* harmony export */ });
/* harmony import */ var _style_presets__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./style-presets */ "./src/map/style-presets.ts");
/* harmony import */ var _zoom_control_options__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./zoom-control-options */ "./src/map/zoom-control-options.ts");


const FALLBACK_MESSAGE = 'Map preview unavailable because this browser does not support WebGL.';
const HEIGHT_UNITS = ['px', 'em', 'rem', '%', 'vh', 'vw'];
const DEFAULT_MAP_DEFAULTS = {
  centerLat: 52.517,
  centerLng: 13.388,
  zoom: 9.5,
  collectionId: 0,
  height: 420,
  heightUnit: 'px',
  stylePreset: 'liberty',
  styleThemeSlug: 'default',
  showZoomControls: true,
  allowSearch: true,
  scrollZoom: false,
  mobileTwoFingerZoom: true,
  zoomControlsPosition: _zoom_control_options__WEBPACK_IMPORTED_MODULE_1__.DEFAULT_ZOOM_CONTROLS_POSITION,
  zoomControlsPadding: _zoom_control_options__WEBPACK_IMPORTED_MODULE_1__.DEFAULT_ZOOM_CONTROLS_PADDING,
  zoomControlsOuterMargin: _zoom_control_options__WEBPACK_IMPORTED_MODULE_1__.DEFAULT_ZOOM_CONTROLS_OUTER_MARGIN,
  zoomControlsBackgroundColor: _zoom_control_options__WEBPACK_IMPORTED_MODULE_1__.DEFAULT_ZOOM_CONTROLS_BACKGROUND_COLOR,
  zoomControlsIconColor: _zoom_control_options__WEBPACK_IMPORTED_MODULE_1__.DEFAULT_ZOOM_CONTROLS_ICON_COLOR,
  zoomControlsBorderRadius: _zoom_control_options__WEBPACK_IMPORTED_MODULE_1__.DEFAULT_ZOOM_CONTROLS_BORDER_RADIUS,
  zoomControlsBorderColor: _zoom_control_options__WEBPACK_IMPORTED_MODULE_1__.DEFAULT_ZOOM_CONTROLS_BORDER_COLOR,
  zoomControlsBorderWidth: _zoom_control_options__WEBPACK_IMPORTED_MODULE_1__.DEFAULT_ZOOM_CONTROLS_BORDER_WIDTH,
  zoomControlsPlusIcon: _zoom_control_options__WEBPACK_IMPORTED_MODULE_1__.DEFAULT_ZOOM_CONTROLS_PLUS_ICON,
  zoomControlsMinusIcon: _zoom_control_options__WEBPACK_IMPORTED_MODULE_1__.DEFAULT_ZOOM_CONTROLS_MINUS_ICON,
  searchPanelBackgroundPrimary: '#ffffff',
  searchPanelBackgroundSecondary: '#f0f0f1',
  searchPanelBackgroundHover: '#f8f8f8',
  searchPanelForegroundPrimary: '#1e1e1e',
  searchPanelForegroundSecondary: '#1e1e1e',
  searchPanelOuterMargin: {
    top: '24px',
    right: '24px',
    bottom: '24px',
    left: '24px'
  },
  searchPanelBorderRadiusInput: '10px',
  searchPanelBorderRadiusCard: '2px',
  searchPanelCardGap: '12px',
  searchPanelWidth: '320px',
  creditsPadding: {
    top: '4px',
    right: '8px',
    bottom: '4px',
    left: '8px'
  },
  creditsOuterMargin: {
    top: '16px',
    right: '16px',
    bottom: '16px',
    left: '16px'
  },
  creditsBackgroundColor: '#ffffff',
  creditsForegroundColor: '#1e1e1e',
  creditsBorderRadius: '999px',
  _isPreview: false
};
function normalizeHeightUnit(unit) {
  return HEIGHT_UNITS.includes(unit) ? unit : 'px';
}
function normalizeBoxValue(value, fallback) {
  return {
    top: normalizeCssLength(value?.top, fallback.top),
    right: normalizeCssLength(value?.right, fallback.right),
    bottom: normalizeCssLength(value?.bottom, fallback.bottom),
    left: normalizeCssLength(value?.left, fallback.left)
  };
}
function normalizeCssLength(value, fallback) {
  if (typeof value !== 'string') {
    return fallback;
  }
  const trimmed = value.trim();
  if (!trimmed || !/^((\d*\.?\d+)(px|em|rem|%|vh|vw)?|0)$/i.test(trimmed)) {
    return fallback;
  }
  return trimmed === '0' ? '0px' : trimmed;
}
function normalizeColor(value, fallback) {
  if (typeof value !== 'string') {
    return fallback;
  }
  const trimmed = value.trim();
  if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) {
    return fallback;
  }
  return trimmed;
}
function normalizeZoomControlsPosition(value, fallback) {
  return ['top-right', 'top-left', 'bottom-right', 'bottom-left'].includes(`${value}`) ? value : fallback;
}
function normalizeZoomControlIcon(value, fallback) {
  return ['plus', 'plus-circle', 'plus-circle-filled', 'line-solid', 'separator', 'close-small'].includes(`${value}`) ? value : fallback;
}
function normalizeBorderRadiusValue(value, fallback) {
  if (!value) {
    return fallback;
  }
  if (typeof value === 'string') {
    const parts = value.trim().split(/\s+/).filter(Boolean);
    if (parts.length < 1 || parts.length > 4) {
      return fallback;
    }
    const normalizedParts = parts.map(part => normalizeCssLength(part, ''));
    if (normalizedParts.some(part => !part)) {
      return fallback;
    }
    return normalizedParts.join(' ');
  }
  const topLeft = normalizeCssLength(value.top, fallback);
  const topRight = normalizeCssLength(value.right, fallback);
  const bottomRight = normalizeCssLength(value.bottom, fallback);
  const bottomLeft = normalizeCssLength(value.left, fallback);
  return `${topLeft} ${topRight} ${bottomRight} ${bottomLeft}`;
}
function getDefaults(runtimeConfig) {
  return {
    ...DEFAULT_MAP_DEFAULTS,
    ...runtimeConfig.defaults,
    heightUnit: normalizeHeightUnit(runtimeConfig.defaults?.heightUnit),
    stylePreset: `${runtimeConfig.defaults?.stylePreset ?? DEFAULT_MAP_DEFAULTS.stylePreset}`,
    showZoomControls: runtimeConfig.defaults?.showZoomControls ?? DEFAULT_MAP_DEFAULTS.showZoomControls,
    allowSearch: runtimeConfig.defaults?.allowSearch ?? DEFAULT_MAP_DEFAULTS.allowSearch,
    scrollZoom: runtimeConfig.defaults?.scrollZoom ?? DEFAULT_MAP_DEFAULTS.scrollZoom,
    mobileTwoFingerZoom: runtimeConfig.defaults?.mobileTwoFingerZoom ?? DEFAULT_MAP_DEFAULTS.mobileTwoFingerZoom,
    zoomControlsPosition: normalizeZoomControlsPosition(runtimeConfig.defaults?.zoomControlsPosition, DEFAULT_MAP_DEFAULTS.zoomControlsPosition),
    zoomControlsPadding: normalizeBoxValue(runtimeConfig.defaults?.zoomControlsPadding, DEFAULT_MAP_DEFAULTS.zoomControlsPadding),
    zoomControlsOuterMargin: normalizeBoxValue(runtimeConfig.defaults?.zoomControlsOuterMargin, DEFAULT_MAP_DEFAULTS.zoomControlsOuterMargin),
    zoomControlsBackgroundColor: normalizeColor(runtimeConfig.defaults?.zoomControlsBackgroundColor, DEFAULT_MAP_DEFAULTS.zoomControlsBackgroundColor),
    zoomControlsIconColor: normalizeColor(runtimeConfig.defaults?.zoomControlsIconColor, DEFAULT_MAP_DEFAULTS.zoomControlsIconColor),
    zoomControlsBorderRadius: normalizeBorderRadiusValue(runtimeConfig.defaults?.zoomControlsBorderRadius, DEFAULT_MAP_DEFAULTS.zoomControlsBorderRadius),
    zoomControlsBorderColor: normalizeColor(runtimeConfig.defaults?.zoomControlsBorderColor, DEFAULT_MAP_DEFAULTS.zoomControlsBorderColor),
    zoomControlsBorderWidth: normalizeCssLength(runtimeConfig.defaults?.zoomControlsBorderWidth, DEFAULT_MAP_DEFAULTS.zoomControlsBorderWidth),
    zoomControlsPlusIcon: normalizeZoomControlIcon(runtimeConfig.defaults?.zoomControlsPlusIcon, DEFAULT_MAP_DEFAULTS.zoomControlsPlusIcon),
    zoomControlsMinusIcon: normalizeZoomControlIcon(runtimeConfig.defaults?.zoomControlsMinusIcon, DEFAULT_MAP_DEFAULTS.zoomControlsMinusIcon),
    searchPanelBackgroundPrimary: normalizeColor(runtimeConfig.defaults?.searchPanelBackgroundPrimary, DEFAULT_MAP_DEFAULTS.searchPanelBackgroundPrimary),
    searchPanelBackgroundSecondary: normalizeColor(runtimeConfig.defaults?.searchPanelBackgroundSecondary, DEFAULT_MAP_DEFAULTS.searchPanelBackgroundSecondary),
    searchPanelBackgroundHover: normalizeColor(runtimeConfig.defaults?.searchPanelBackgroundHover, DEFAULT_MAP_DEFAULTS.searchPanelBackgroundHover),
    searchPanelForegroundPrimary: normalizeColor(runtimeConfig.defaults?.searchPanelForegroundPrimary, DEFAULT_MAP_DEFAULTS.searchPanelForegroundPrimary),
    searchPanelForegroundSecondary: normalizeColor(runtimeConfig.defaults?.searchPanelForegroundSecondary, DEFAULT_MAP_DEFAULTS.searchPanelForegroundSecondary),
    searchPanelOuterMargin: normalizeBoxValue(runtimeConfig.defaults?.searchPanelOuterMargin, DEFAULT_MAP_DEFAULTS.searchPanelOuterMargin),
    searchPanelBorderRadiusInput: normalizeBorderRadiusValue(runtimeConfig.defaults?.searchPanelBorderRadiusInput, DEFAULT_MAP_DEFAULTS.searchPanelBorderRadiusInput),
    searchPanelBorderRadiusCard: normalizeBorderRadiusValue(runtimeConfig.defaults?.searchPanelBorderRadiusCard, DEFAULT_MAP_DEFAULTS.searchPanelBorderRadiusCard),
    searchPanelCardGap: normalizeCssLength(runtimeConfig.defaults?.searchPanelCardGap, DEFAULT_MAP_DEFAULTS.searchPanelCardGap),
    searchPanelWidth: normalizeCssLength(runtimeConfig.defaults?.searchPanelWidth, DEFAULT_MAP_DEFAULTS.searchPanelWidth),
    creditsPadding: normalizeBoxValue(runtimeConfig.defaults?.creditsPadding, DEFAULT_MAP_DEFAULTS.creditsPadding),
    creditsOuterMargin: normalizeBoxValue(runtimeConfig.defaults?.creditsOuterMargin, DEFAULT_MAP_DEFAULTS.creditsOuterMargin),
    creditsBackgroundColor: normalizeColor(runtimeConfig.defaults?.creditsBackgroundColor, DEFAULT_MAP_DEFAULTS.creditsBackgroundColor),
    creditsForegroundColor: normalizeColor(runtimeConfig.defaults?.creditsForegroundColor, DEFAULT_MAP_DEFAULTS.creditsForegroundColor),
    creditsBorderRadius: normalizeBorderRadiusValue(runtimeConfig.defaults?.creditsBorderRadius, DEFAULT_MAP_DEFAULTS.creditsBorderRadius)
  };
}
function getFallbackPreset(stylePresets) {
  if (stylePresets.liberty) {
    return 'liberty';
  }
  return Object.keys(stylePresets)[0] ?? DEFAULT_MAP_DEFAULTS.stylePreset;
}
function normalizeMapConfig(rawConfig = {}, runtimeConfig = {}) {
  const defaults = getDefaults(runtimeConfig);
  const stylePresets = (0,_style_presets__WEBPACK_IMPORTED_MODULE_0__.getStylePresets)(runtimeConfig.stylePresets);
  const fallbackPreset = getFallbackPreset(stylePresets);
  const defaultStylePreset = stylePresets[defaults.stylePreset] ? defaults.stylePreset : fallbackPreset;
  const requestedPreset = `${rawConfig.stylePreset ?? defaultStylePreset}`;
  const stylePreset = stylePresets[requestedPreset] ? requestedPreset : defaultStylePreset;
  const styleUrl = rawConfig.styleUrl || stylePresets[stylePreset]?.style_url || stylePresets[fallbackPreset]?.style_url || stylePresets[defaults.stylePreset]?.style_url || 'https://tiles.openfreemap.org/styles/liberty';
  const styleThemeSlug = `${rawConfig.styleThemeSlug ?? defaults.styleThemeSlug}`;
  const centerLat = clampNumber(rawConfig.centerLat ?? defaults.centerLat, -90, 90);
  const centerLng = clampNumber(rawConfig.centerLng ?? defaults.centerLng, -180, 180);
  const zoom = clampNumber(rawConfig.zoom ?? defaults.zoom, 0, 22);
  const collectionId = Math.max(0, Number(rawConfig.collectionId ?? defaults.collectionId) || 0);
  const height = Math.max(1, Number(rawConfig.height ?? defaults.height));
  const heightUnit = normalizeHeightUnit(rawConfig.heightUnit ?? defaults.heightUnit);
  const zoomControlsPosition = normalizeZoomControlsPosition(rawConfig.zoomControlsPosition ?? defaults.zoomControlsPosition, defaults.zoomControlsPosition);
  const zoomControlsPadding = normalizeBoxValue(rawConfig.zoomControlsPadding ?? defaults.zoomControlsPadding, defaults.zoomControlsPadding);
  const zoomControlsOuterMargin = normalizeBoxValue(rawConfig.zoomControlsOuterMargin ?? defaults.zoomControlsOuterMargin, defaults.zoomControlsOuterMargin);
  const zoomControlsBackgroundColor = normalizeColor(rawConfig.zoomControlsBackgroundColor ?? defaults.zoomControlsBackgroundColor, defaults.zoomControlsBackgroundColor);
  const zoomControlsIconColor = normalizeColor(rawConfig.zoomControlsIconColor ?? defaults.zoomControlsIconColor, defaults.zoomControlsIconColor);
  const zoomControlsBorderRadius = normalizeBorderRadiusValue(rawConfig.zoomControlsBorderRadius ?? defaults.zoomControlsBorderRadius, defaults.zoomControlsBorderRadius);
  const zoomControlsBorderColor = normalizeColor(rawConfig.zoomControlsBorderColor ?? defaults.zoomControlsBorderColor, defaults.zoomControlsBorderColor);
  const zoomControlsBorderWidth = normalizeCssLength(rawConfig.zoomControlsBorderWidth ?? defaults.zoomControlsBorderWidth, defaults.zoomControlsBorderWidth);
  const zoomControlsPlusIcon = normalizeZoomControlIcon(rawConfig.zoomControlsPlusIcon ?? defaults.zoomControlsPlusIcon, defaults.zoomControlsPlusIcon);
  const zoomControlsMinusIcon = normalizeZoomControlIcon(rawConfig.zoomControlsMinusIcon ?? defaults.zoomControlsMinusIcon, defaults.zoomControlsMinusIcon);
  const searchPanelBackgroundPrimary = normalizeColor(rawConfig.searchPanelBackgroundPrimary ?? defaults.searchPanelBackgroundPrimary, defaults.searchPanelBackgroundPrimary);
  const searchPanelBackgroundSecondary = normalizeColor(rawConfig.searchPanelBackgroundSecondary ?? defaults.searchPanelBackgroundSecondary, defaults.searchPanelBackgroundSecondary);
  const searchPanelBackgroundHover = normalizeColor(rawConfig.searchPanelBackgroundHover ?? defaults.searchPanelBackgroundHover, defaults.searchPanelBackgroundHover);
  const searchPanelForegroundPrimary = normalizeColor(rawConfig.searchPanelForegroundPrimary ?? defaults.searchPanelForegroundPrimary, defaults.searchPanelForegroundPrimary);
  const searchPanelForegroundSecondary = normalizeColor(rawConfig.searchPanelForegroundSecondary ?? defaults.searchPanelForegroundSecondary, defaults.searchPanelForegroundSecondary);
  const searchPanelOuterMargin = normalizeBoxValue(rawConfig.searchPanelOuterMargin ?? defaults.searchPanelOuterMargin, defaults.searchPanelOuterMargin);
  const searchPanelBorderRadiusInput = normalizeBorderRadiusValue(rawConfig.searchPanelBorderRadiusInput ?? defaults.searchPanelBorderRadiusInput, defaults.searchPanelBorderRadiusInput);
  const searchPanelBorderRadiusCard = normalizeBorderRadiusValue(rawConfig.searchPanelBorderRadiusCard ?? defaults.searchPanelBorderRadiusCard, defaults.searchPanelBorderRadiusCard);
  const searchPanelCardGap = normalizeCssLength(rawConfig.searchPanelCardGap ?? defaults.searchPanelCardGap, defaults.searchPanelCardGap);
  const searchPanelWidth = normalizeCssLength(rawConfig.searchPanelWidth ?? defaults.searchPanelWidth, defaults.searchPanelWidth);
  const creditsPadding = normalizeBoxValue(rawConfig.creditsPadding ?? defaults.creditsPadding, defaults.creditsPadding);
  const creditsOuterMargin = normalizeBoxValue(rawConfig.creditsOuterMargin ?? defaults.creditsOuterMargin, defaults.creditsOuterMargin);
  const creditsBackgroundColor = normalizeColor(rawConfig.creditsBackgroundColor ?? defaults.creditsBackgroundColor, defaults.creditsBackgroundColor);
  const creditsForegroundColor = normalizeColor(rawConfig.creditsForegroundColor ?? defaults.creditsForegroundColor, defaults.creditsForegroundColor);
  const creditsBorderRadius = normalizeBorderRadiusValue(rawConfig.creditsBorderRadius ?? defaults.creditsBorderRadius, defaults.creditsBorderRadius);
  const markerLat = normalizeOptionalCoordinate(rawConfig.markerLat, -90, 90);
  const markerLng = normalizeOptionalCoordinate(rawConfig.markerLng, -180, 180);
  const markerContent = typeof rawConfig.markerContent === 'string' ? rawConfig.markerContent : null;
  const markerClassName = typeof rawConfig.markerClassName === 'string' ? rawConfig.markerClassName.trim() : '';
  const markerOffsetY = Number.isFinite(Number(rawConfig.markerOffsetY)) ? Number(rawConfig.markerOffsetY) : 0;
  const centerOffsetY = Number.isFinite(Number(rawConfig.centerOffsetY)) ? Number(rawConfig.centerOffsetY) : 0;
  const locations = normalizeLocations(rawConfig.locations ?? runtimeConfig.locations);
  let styleTheme = rawConfig.styleTheme || {};

  // If no explicit theme colors but we have a slug, try to resolve from runtime config (editor context)
  if (Object.keys(styleTheme).length === 0 && stylePreset === 'positron' && runtimeConfig.styleThemes) {
    const theme = runtimeConfig.styleThemes.find(t => t.slug === styleThemeSlug) || runtimeConfig.styleThemes.find(t => t.slug === 'default');
    if (theme) {
      styleTheme = theme.colors;
    }
  }
  return {
    centerLat,
    centerLng,
    zoom,
    collectionId,
    height,
    heightUnit,
    heightCssValue: `${trimNumber(height)}${heightUnit}`,
    stylePreset,
    styleUrl,
    styleTheme,
    styleThemeSlug,
    showZoomControls: Boolean(rawConfig.showZoomControls ?? defaults.showZoomControls),
    allowSearch: Boolean(rawConfig.allowSearch ?? defaults.allowSearch),
    scrollZoom: Boolean(rawConfig.scrollZoom ?? defaults.scrollZoom),
    mobileTwoFingerZoom: Boolean(rawConfig.mobileTwoFingerZoom ?? defaults.mobileTwoFingerZoom),
    zoomControlsPosition,
    zoomControlsPadding,
    zoomControlsOuterMargin,
    zoomControlsBackgroundColor,
    zoomControlsIconColor,
    zoomControlsBorderRadius,
    zoomControlsBorderColor,
    zoomControlsBorderWidth,
    zoomControlsPlusIcon,
    zoomControlsMinusIcon,
    searchPanelBackgroundPrimary,
    searchPanelBackgroundSecondary,
    searchPanelBackgroundHover,
    searchPanelForegroundPrimary,
    searchPanelForegroundSecondary,
    searchPanelOuterMargin,
    searchPanelBorderRadiusInput,
    searchPanelBorderRadiusCard,
    searchPanelCardGap,
    searchPanelWidth,
    creditsPadding,
    creditsOuterMargin,
    creditsBackgroundColor,
    creditsForegroundColor,
    creditsBorderRadius,
    _isPreview: Boolean(rawConfig._isPreview ?? defaults._isPreview),
    fallbackMessage: rawConfig.fallbackMessage || runtimeConfig.messages?.fallback || FALLBACK_MESSAGE,
    markerLat,
    markerLng,
    markerContent,
    markerClassName,
    markerOffsetY,
    centerOffsetY,
    locations,
    interactive: rawConfig.interactive ?? true,
    showAttribution: rawConfig.showAttribution ?? true
  };
}
function trimNumber(value) {
  const rounded = Number(value.toFixed(4));
  return `${rounded}`;
}
function clampNumber(value, minimum, maximum) {
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) {
    return minimum;
  }
  return Math.max(minimum, Math.min(maximum, numericValue));
}
function normalizeOptionalCoordinate(value, minimum, maximum) {
  if (value === null || typeof value === 'undefined' || value === '') {
    return null;
  }
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) {
    return null;
  }
  return Math.max(minimum, Math.min(maximum, numericValue));
}
function normalizeLocationPoint(value) {
  if (!value) {
    return null;
  }
  const lat = normalizeOptionalCoordinate(value.lat, -90, 90);
  const lng = normalizeOptionalCoordinate(value.lng, -180, 180);
  if (lat === null || lng === null) {
    return null;
  }
  return {
    ...value,
    lat,
    lng
  };
}
function normalizeLocations(locations) {
  if (!Array.isArray(locations)) {
    return [];
  }
  return locations.map(location => normalizeLocationPoint(location)).filter(point => point !== null);
}

/***/ },

/***/ "./src/map/style-presets.ts"
/*!**********************************!*\
  !*** ./src/map/style-presets.ts ***!
  \**********************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DEFAULT_STYLE_PRESETS: () => (/* binding */ DEFAULT_STYLE_PRESETS),
/* harmony export */   getStyleOptions: () => (/* binding */ getStyleOptions),
/* harmony export */   getStylePresets: () => (/* binding */ getStylePresets)
/* harmony export */ });
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__);

const DEFAULT_STYLE_PRESETS = {
  liberty: {
    label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('Liberty', 'minimal-map'),
    style_url: 'https://tiles.openfreemap.org/styles/liberty'
  },
  bright: {
    label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('Bright', 'minimal-map'),
    style_url: 'https://tiles.openfreemap.org/styles/bright'
  },
  positron: {
    label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('Positron', 'minimal-map'),
    style_url: 'https://tiles.openfreemap.org/styles/positron'
  }
};
function getStylePresets(runtimePresets = {}) {
  if (Object.keys(runtimePresets).length > 0) {
    return runtimePresets;
  }
  return DEFAULT_STYLE_PRESETS;
}
function getStyleOptions(runtimePresets = {}) {
  const presets = getStylePresets(runtimePresets);
  return Object.entries(presets).map(([value, preset]) => ({
    label: preset.label,
    value
  }));
}

/***/ },

/***/ "./src/map/zoom-control-options.ts"
/*!*****************************************!*\
  !*** ./src/map/zoom-control-options.ts ***!
  \*****************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DEFAULT_ZOOM_CONTROLS_BACKGROUND_COLOR: () => (/* binding */ DEFAULT_ZOOM_CONTROLS_BACKGROUND_COLOR),
/* harmony export */   DEFAULT_ZOOM_CONTROLS_BORDER_COLOR: () => (/* binding */ DEFAULT_ZOOM_CONTROLS_BORDER_COLOR),
/* harmony export */   DEFAULT_ZOOM_CONTROLS_BORDER_RADIUS: () => (/* binding */ DEFAULT_ZOOM_CONTROLS_BORDER_RADIUS),
/* harmony export */   DEFAULT_ZOOM_CONTROLS_BORDER_WIDTH: () => (/* binding */ DEFAULT_ZOOM_CONTROLS_BORDER_WIDTH),
/* harmony export */   DEFAULT_ZOOM_CONTROLS_ICON_COLOR: () => (/* binding */ DEFAULT_ZOOM_CONTROLS_ICON_COLOR),
/* harmony export */   DEFAULT_ZOOM_CONTROLS_MINUS_ICON: () => (/* binding */ DEFAULT_ZOOM_CONTROLS_MINUS_ICON),
/* harmony export */   DEFAULT_ZOOM_CONTROLS_OUTER_MARGIN: () => (/* binding */ DEFAULT_ZOOM_CONTROLS_OUTER_MARGIN),
/* harmony export */   DEFAULT_ZOOM_CONTROLS_PADDING: () => (/* binding */ DEFAULT_ZOOM_CONTROLS_PADDING),
/* harmony export */   DEFAULT_ZOOM_CONTROLS_PLUS_ICON: () => (/* binding */ DEFAULT_ZOOM_CONTROLS_PLUS_ICON),
/* harmony export */   DEFAULT_ZOOM_CONTROLS_POSITION: () => (/* binding */ DEFAULT_ZOOM_CONTROLS_POSITION),
/* harmony export */   ZOOM_CONTROLS_MINUS_ICON_OPTIONS: () => (/* binding */ ZOOM_CONTROLS_MINUS_ICON_OPTIONS),
/* harmony export */   ZOOM_CONTROLS_PLUS_ICON_OPTIONS: () => (/* binding */ ZOOM_CONTROLS_PLUS_ICON_OPTIONS),
/* harmony export */   ZOOM_CONTROLS_POSITION_OPTIONS: () => (/* binding */ ZOOM_CONTROLS_POSITION_OPTIONS),
/* harmony export */   getZoomControlRuntimeIconSvg: () => (/* binding */ getZoomControlRuntimeIconSvg)
/* harmony export */ });
/* harmony import */ var _wordpress_icons__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/icons */ "./node_modules/@wordpress/icons/build-module/library/arrow-down-left.mjs");
/* harmony import */ var _wordpress_icons__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/icons */ "./node_modules/@wordpress/icons/build-module/library/arrow-down-right.mjs");
/* harmony import */ var _wordpress_icons__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/icons */ "./node_modules/@wordpress/icons/build-module/library/arrow-up-left.mjs");
/* harmony import */ var _wordpress_icons__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @wordpress/icons */ "./node_modules/@wordpress/icons/build-module/library/arrow-up-right.mjs");
/* harmony import */ var _wordpress_icons__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @wordpress/icons */ "./node_modules/@wordpress/icons/build-module/library/close-small.mjs");
/* harmony import */ var _wordpress_icons__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @wordpress/icons */ "./node_modules/@wordpress/icons/build-module/library/line-solid.mjs");
/* harmony import */ var _wordpress_icons__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @wordpress/icons */ "./node_modules/@wordpress/icons/build-module/library/plus-circle-filled.mjs");
/* harmony import */ var _wordpress_icons__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @wordpress/icons */ "./node_modules/@wordpress/icons/build-module/library/plus-circle.mjs");
/* harmony import */ var _wordpress_icons__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! @wordpress/icons */ "./node_modules/@wordpress/icons/build-module/library/plus.mjs");
/* harmony import */ var _wordpress_icons__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! @wordpress/icons */ "./node_modules/@wordpress/icons/build-module/library/separator.mjs");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_10___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_10__);


const DEFAULT_ZOOM_CONTROLS_PADDING = {
  top: '8px',
  right: '8px',
  bottom: '8px',
  left: '8px'
};
const DEFAULT_ZOOM_CONTROLS_OUTER_MARGIN = {
  top: '16px',
  right: '16px',
  bottom: '16px',
  left: '16px'
};
const DEFAULT_ZOOM_CONTROLS_BORDER_RADIUS = '2px';
const DEFAULT_ZOOM_CONTROLS_BORDER_WIDTH = '1px';
const DEFAULT_ZOOM_CONTROLS_BACKGROUND_COLOR = '#ffffff';
const DEFAULT_ZOOM_CONTROLS_ICON_COLOR = '#1e1e1e';
const DEFAULT_ZOOM_CONTROLS_BORDER_COLOR = '#dcdcde';
const DEFAULT_ZOOM_CONTROLS_POSITION = 'top-right';
const DEFAULT_ZOOM_CONTROLS_PLUS_ICON = 'plus';
const DEFAULT_ZOOM_CONTROLS_MINUS_ICON = 'line-solid';
const ZOOM_CONTROLS_POSITION_OPTIONS = [{
  label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_10__.__)('Top left', 'minimal-map'),
  value: 'top-left',
  icon: _wordpress_icons__WEBPACK_IMPORTED_MODULE_2__["default"]
}, {
  label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_10__.__)('Top right', 'minimal-map'),
  value: 'top-right',
  icon: _wordpress_icons__WEBPACK_IMPORTED_MODULE_3__["default"]
}, {
  label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_10__.__)('Bottom left', 'minimal-map'),
  value: 'bottom-left',
  icon: _wordpress_icons__WEBPACK_IMPORTED_MODULE_0__["default"]
}, {
  label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_10__.__)('Bottom right', 'minimal-map'),
  value: 'bottom-right',
  icon: _wordpress_icons__WEBPACK_IMPORTED_MODULE_1__["default"]
}];
const ZOOM_CONTROLS_PLUS_ICON_OPTIONS = [{
  label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_10__.__)('Plus', 'minimal-map'),
  value: 'plus',
  icon: _wordpress_icons__WEBPACK_IMPORTED_MODULE_8__["default"],
  svg: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>'
}, {
  label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_10__.__)('Plus circle', 'minimal-map'),
  value: 'plus-circle',
  icon: _wordpress_icons__WEBPACK_IMPORTED_MODULE_7__["default"],
  svg: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 8v8M8 12h8"/></svg>'
}, {
  label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_10__.__)('Filled plus circle', 'minimal-map'),
  value: 'plus-circle-filled',
  icon: _wordpress_icons__WEBPACK_IMPORTED_MODULE_6__["default"],
  svg: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" fill="currentColor" stroke="none"/><path d="M12 8v8M8 12h8" stroke="var(--minimal-map-controls-button-background, #fff)"/></svg>'
}];
const ZOOM_CONTROLS_MINUS_ICON_OPTIONS = [{
  label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_10__.__)('Line', 'minimal-map'),
  value: 'line-solid',
  icon: _wordpress_icons__WEBPACK_IMPORTED_MODULE_5__["default"],
  svg: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12h12"/></svg>'
}, {
  label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_10__.__)('Separator', 'minimal-map'),
  value: 'separator',
  icon: _wordpress_icons__WEBPACK_IMPORTED_MODULE_9__["default"],
  svg: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12h12"/><path d="M12 7v10" opacity="0.2"/></svg>'
}, {
  label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_10__.__)('Close small', 'minimal-map'),
  value: 'close-small',
  icon: _wordpress_icons__WEBPACK_IMPORTED_MODULE_4__["default"],
  svg: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 12h8"/></svg>'
}];
const ZOOM_CONTROLS_ICON_OPTIONS = [...ZOOM_CONTROLS_PLUS_ICON_OPTIONS, ...ZOOM_CONTROLS_MINUS_ICON_OPTIONS];
function getZoomControlRuntimeIconSvg(icon) {
  return ZOOM_CONTROLS_ICON_OPTIONS.find(option => option.value === icon)?.svg ?? ZOOM_CONTROLS_PLUS_ICON_OPTIONS[0].svg;
}

/***/ },

/***/ "./src/block/editor.scss"
/*!*******************************!*\
  !*** ./src/block/editor.scss ***!
  \*******************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
// extracted by mini-css-extract-plugin


/***/ },

/***/ "react"
/*!************************!*\
  !*** external "React" ***!
  \************************/
(module) {

module.exports = window["React"];

/***/ },

/***/ "react/jsx-runtime"
/*!**********************************!*\
  !*** external "ReactJSXRuntime" ***!
  \**********************************/
(module) {

module.exports = window["ReactJSXRuntime"];

/***/ },

/***/ "@wordpress/block-editor"
/*!*************************************!*\
  !*** external ["wp","blockEditor"] ***!
  \*************************************/
(module) {

module.exports = window["wp"]["blockEditor"];

/***/ },

/***/ "@wordpress/blocks"
/*!********************************!*\
  !*** external ["wp","blocks"] ***!
  \********************************/
(module) {

module.exports = window["wp"]["blocks"];

/***/ },

/***/ "@wordpress/components"
/*!************************************!*\
  !*** external ["wp","components"] ***!
  \************************************/
(module) {

module.exports = window["wp"]["components"];

/***/ },

/***/ "@wordpress/element"
/*!*********************************!*\
  !*** external ["wp","element"] ***!
  \*********************************/
(module) {

module.exports = window["wp"]["element"];

/***/ },

/***/ "@wordpress/i18n"
/*!******************************!*\
  !*** external ["wp","i18n"] ***!
  \******************************/
(module) {

module.exports = window["wp"]["i18n"];

/***/ },

/***/ "@wordpress/primitives"
/*!************************************!*\
  !*** external ["wp","primitives"] ***!
  \************************************/
(module) {

module.exports = window["wp"]["primitives"];

/***/ },

/***/ "./node_modules/@wordpress/icons/build-module/library/arrow-down-left.mjs"
/*!********************************************************************************!*\
  !*** ./node_modules/@wordpress/icons/build-module/library/arrow-down-left.mjs ***!
  \********************************************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ arrow_down_left_default)
/* harmony export */ });
/* harmony import */ var _wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/primitives */ "@wordpress/primitives");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
// packages/icons/src/library/arrow-down-left.tsx


var arrow_down_left_default = /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.SVG, { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", children: /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.Path, { d: "M14 18H6V10H7.5V15.5L17 6L18 7L8.5 16.5H14V18Z" }) });

//# sourceMappingURL=arrow-down-left.mjs.map


/***/ },

/***/ "./node_modules/@wordpress/icons/build-module/library/arrow-down-right.mjs"
/*!*********************************************************************************!*\
  !*** ./node_modules/@wordpress/icons/build-module/library/arrow-down-right.mjs ***!
  \*********************************************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ arrow_down_right_default)
/* harmony export */ });
/* harmony import */ var _wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/primitives */ "@wordpress/primitives");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
// packages/icons/src/library/arrow-down-right.tsx


var arrow_down_right_default = /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.SVG, { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", children: /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.Path, { d: "M10 18h8v-8h-1.5v5.5L7 6 6 7l9.5 9.5H10V18Z" }) });

//# sourceMappingURL=arrow-down-right.mjs.map


/***/ },

/***/ "./node_modules/@wordpress/icons/build-module/library/arrow-up-left.mjs"
/*!******************************************************************************!*\
  !*** ./node_modules/@wordpress/icons/build-module/library/arrow-up-left.mjs ***!
  \******************************************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ arrow_up_left_default)
/* harmony export */ });
/* harmony import */ var _wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/primitives */ "@wordpress/primitives");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
// packages/icons/src/library/arrow-up-left.tsx


var arrow_up_left_default = /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.SVG, { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", children: /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.Path, { d: "M14 6H6v8h1.5V8.5L17 18l1-1-9.5-9.5H14V6Z" }) });

//# sourceMappingURL=arrow-up-left.mjs.map


/***/ },

/***/ "./node_modules/@wordpress/icons/build-module/library/arrow-up-right.mjs"
/*!*******************************************************************************!*\
  !*** ./node_modules/@wordpress/icons/build-module/library/arrow-up-right.mjs ***!
  \*******************************************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ arrow_up_right_default)
/* harmony export */ });
/* harmony import */ var _wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/primitives */ "@wordpress/primitives");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
// packages/icons/src/library/arrow-up-right.tsx


var arrow_up_right_default = /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.SVG, { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", children: /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.Path, { d: "M10 6H18V14H16.5V8.5L7 18L6 17L15.5 7.5H10V6Z" }) });

//# sourceMappingURL=arrow-up-right.mjs.map


/***/ },

/***/ "./node_modules/@wordpress/icons/build-module/library/close-small.mjs"
/*!****************************************************************************!*\
  !*** ./node_modules/@wordpress/icons/build-module/library/close-small.mjs ***!
  \****************************************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ close_small_default)
/* harmony export */ });
/* harmony import */ var _wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/primitives */ "@wordpress/primitives");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
// packages/icons/src/library/close-small.tsx


var close_small_default = /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.SVG, { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", children: /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.Path, { d: "M12 13.06l3.712 3.713 1.061-1.06L13.061 12l3.712-3.712-1.06-1.06L12 10.938 8.288 7.227l-1.061 1.06L10.939 12l-3.712 3.712 1.06 1.061L12 13.061z" }) });

//# sourceMappingURL=close-small.mjs.map


/***/ },

/***/ "./node_modules/@wordpress/icons/build-module/library/line-solid.mjs"
/*!***************************************************************************!*\
  !*** ./node_modules/@wordpress/icons/build-module/library/line-solid.mjs ***!
  \***************************************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ line_solid_default)
/* harmony export */ });
/* harmony import */ var _wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/primitives */ "@wordpress/primitives");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
// packages/icons/src/library/line-solid.tsx


var line_solid_default = /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.SVG, { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", children: /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.Path, { d: "M5 11.25h14v1.5H5z" }) });

//# sourceMappingURL=line-solid.mjs.map


/***/ },

/***/ "./node_modules/@wordpress/icons/build-module/library/plus-circle-filled.mjs"
/*!***********************************************************************************!*\
  !*** ./node_modules/@wordpress/icons/build-module/library/plus-circle-filled.mjs ***!
  \***********************************************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ plus_circle_filled_default)
/* harmony export */ });
/* harmony import */ var _wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/primitives */ "@wordpress/primitives");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
// packages/icons/src/library/plus-circle-filled.tsx


var plus_circle_filled_default = /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.SVG, { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", children: /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.Path, { d: "M12 4c-4.4 0-8 3.6-8 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8Zm3.8 8.8h-3v3h-1.5v-3h-3v-1.5h3v-3h1.5v3h3v1.5Z" }) });

//# sourceMappingURL=plus-circle-filled.mjs.map


/***/ },

/***/ "./node_modules/@wordpress/icons/build-module/library/plus-circle.mjs"
/*!****************************************************************************!*\
  !*** ./node_modules/@wordpress/icons/build-module/library/plus-circle.mjs ***!
  \****************************************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ plus_circle_default)
/* harmony export */ });
/* harmony import */ var _wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/primitives */ "@wordpress/primitives");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
// packages/icons/src/library/plus-circle.tsx


var plus_circle_default = /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.SVG, { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", children: /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.Path, { fillRule: "evenodd", clipRule: "evenodd", d: "M7.404 16.596a6.5 6.5 0 1 0 9.192-9.192 6.5 6.5 0 0 0-9.192 9.192ZM6.344 6.343a8 8 0 1 0 11.313 11.314A8 8 0 0 0 6.343 6.343Zm4.906 9.407v-3h-3v-1.5h3v-3h1.5v3h3v1.5h-3v3h-1.5Z" }) });

//# sourceMappingURL=plus-circle.mjs.map


/***/ },

/***/ "./node_modules/@wordpress/icons/build-module/library/plus.mjs"
/*!*********************************************************************!*\
  !*** ./node_modules/@wordpress/icons/build-module/library/plus.mjs ***!
  \*********************************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ plus_default)
/* harmony export */ });
/* harmony import */ var _wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/primitives */ "@wordpress/primitives");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
// packages/icons/src/library/plus.tsx


var plus_default = /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.SVG, { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", children: /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.Path, { d: "M11 12.5V17.5H12.5V12.5H17.5V11H12.5V6H11V11H6V12.5H11Z" }) });

//# sourceMappingURL=plus.mjs.map


/***/ },

/***/ "./node_modules/@wordpress/icons/build-module/library/separator.mjs"
/*!**************************************************************************!*\
  !*** ./node_modules/@wordpress/icons/build-module/library/separator.mjs ***!
  \**************************************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ separator_default)
/* harmony export */ });
/* harmony import */ var _wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/primitives */ "@wordpress/primitives");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
// packages/icons/src/library/separator.tsx


var separator_default = /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.SVG, { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", children: /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.Path, { d: "M4.5 12.5v4H3V7h1.5v3.987h15V7H21v9.5h-1.5v-4h-15Z" }) });

//# sourceMappingURL=separator.mjs.map


/***/ },

/***/ "./block.json"
/*!********************!*\
  !*** ./block.json ***!
  \********************/
(module) {

module.exports = /*#__PURE__*/JSON.parse('{"$schema":"https://schemas.wp.org/trunk/block.json","apiVersion":3,"name":"minimal-map/map","version":"0.2.0","title":"Minimal Map","category":"widgets","icon":"location-alt","description":"Render a minimalist MapLibre-powered map.","textdomain":"minimal-map","attributes":{"centerLat":{"type":"number","default":52.517},"centerLng":{"type":"number","default":13.388},"zoom":{"type":"number","default":9.5},"collectionId":{"type":"number","default":0},"height":{"type":"number","default":420},"heightUnit":{"type":"string","default":"px"},"stylePreset":{"type":"string","default":"liberty"},"styleThemeSlug":{"type":"string","default":"default"},"showZoomControls":{"type":"boolean","default":true},"allowSearch":{"type":"boolean","default":true},"scrollZoom":{"type":"boolean","default":false},"mobileTwoFingerZoom":{"type":"boolean","default":false},"zoomControlsPosition":{"type":"string","default":"top-right"},"zoomControlsPadding":{"type":"object","default":{"top":"8px","right":"8px","bottom":"8px","left":"8px"}},"zoomControlsOuterMargin":{"type":"object","default":{"top":"16px","right":"16px","bottom":"16px","left":"16px"}},"zoomControlsBackgroundColor":{"type":"string","default":"#ffffff"},"zoomControlsIconColor":{"type":"string","default":"#1e1e1e"},"zoomControlsBorderRadius":{"type":"string","default":"2px"},"zoomControlsBorderColor":{"type":"string","default":"#dcdcde"},"zoomControlsBorderWidth":{"type":"string","default":"1px"},"zoomControlsPlusIcon":{"type":"string","default":"plus"},"zoomControlsMinusIcon":{"type":"string","default":"line-solid"},"searchPanelBackgroundPrimary":{"type":"string","default":"#ffffff"},"searchPanelBackgroundSecondary":{"type":"string","default":"#f0f0f1"},"searchPanelBackgroundHover":{"type":"string","default":"#f8f8f8"},"searchPanelForegroundPrimary":{"type":"string","default":"#1e1e1e"},"searchPanelForegroundSecondary":{"type":"string","default":"#1e1e1e"},"searchPanelOuterMargin":{"type":"object","default":{"top":"24px","right":"24px","bottom":"24px","left":"24px"}},"searchPanelBorderRadiusInput":{"type":"string","default":"10px"},"searchPanelBorderRadiusCard":{"type":"string","default":"2px"},"searchPanelCardGap":{"type":"string","default":"12px"},"searchPanelWidth":{"type":"string","default":"320px"},"creditsPadding":{"type":"object","default":{"top":"4px","right":"8px","bottom":"4px","left":"8px"}},"creditsOuterMargin":{"type":"object","default":{"top":"16px","right":"16px","bottom":"16px","left":"16px"}},"creditsBackgroundColor":{"type":"string","default":"#ffffff"},"creditsForegroundColor":{"type":"string","default":"#1e1e1e"},"creditsBorderRadius":{"type":"string","default":"999px"},"_isPreview":{"type":"boolean","default":false}},"supports":{"html":false,"align":["wide","full"],"spacing":{"margin":true,"padding":true,"__experimentalDefaultControls":{"margin":true,"padding":true}},"__experimentalBorder":{"radius":true,"__experimentalDefaultControls":{"radius":true}}},"editorScript":"minimal-map-block-editor","editorStyle":"minimal-map-editor-style","style":"minimal-map-style","viewScript":"minimal-map-frontend","example":{"viewportWidth":400,"attributes":{"centerLat":52.75,"centerLng":13.4,"zoom":9.5,"height":240,"stylePreset":"liberty","_isPreview":true}}}');

/***/ }

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		if (!(moduleId in __webpack_modules__)) {
/******/ 			delete __webpack_module_cache__[moduleId];
/******/ 			var e = new Error("Cannot find module '" + moduleId + "'");
/******/ 			e.code = 'MODULE_NOT_FOUND';
/******/ 			throw e;
/******/ 		}
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = __webpack_modules__;
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/ensure chunk */
/******/ 	(() => {
/******/ 		__webpack_require__.f = {};
/******/ 		// This file contains only the entry chunk.
/******/ 		// The chunk loading function for additional chunks
/******/ 		__webpack_require__.e = (chunkId) => {
/******/ 			return Promise.all(Object.keys(__webpack_require__.f).reduce((promises, key) => {
/******/ 				__webpack_require__.f[key](chunkId, promises);
/******/ 				return promises;
/******/ 			}, []));
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/get javascript chunk filename */
/******/ 	(() => {
/******/ 		// This function allow to reference async chunks
/******/ 		__webpack_require__.u = (chunkId) => {
/******/ 			// return url for filenames based on template
/******/ 			return "" + chunkId + ".js";
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/get mini-css chunk filename */
/******/ 	(() => {
/******/ 		// This function allow to reference async chunks
/******/ 		__webpack_require__.miniCssF = (chunkId) => {
/******/ 			// return url for filenames based on template
/******/ 			return "" + chunkId + ".css";
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/load script */
/******/ 	(() => {
/******/ 		var inProgress = {};
/******/ 		var dataWebpackPrefix = "minimal-map:";
/******/ 		// loadScript function to load a script via script tag
/******/ 		__webpack_require__.l = (url, done, key, chunkId) => {
/******/ 			if(inProgress[url]) { inProgress[url].push(done); return; }
/******/ 			var script, needAttach;
/******/ 			if(key !== undefined) {
/******/ 				var scripts = document.getElementsByTagName("script");
/******/ 				for(var i = 0; i < scripts.length; i++) {
/******/ 					var s = scripts[i];
/******/ 					if(s.getAttribute("src") == url || s.getAttribute("data-webpack") == dataWebpackPrefix + key) { script = s; break; }
/******/ 				}
/******/ 			}
/******/ 			if(!script) {
/******/ 				needAttach = true;
/******/ 				script = document.createElement('script');
/******/ 		
/******/ 				script.charset = 'utf-8';
/******/ 				if (__webpack_require__.nc) {
/******/ 					script.setAttribute("nonce", __webpack_require__.nc);
/******/ 				}
/******/ 				script.setAttribute("data-webpack", dataWebpackPrefix + key);
/******/ 		
/******/ 				script.src = url;
/******/ 			}
/******/ 			inProgress[url] = [done];
/******/ 			var onScriptComplete = (prev, event) => {
/******/ 				// avoid mem leaks in IE.
/******/ 				script.onerror = script.onload = null;
/******/ 				clearTimeout(timeout);
/******/ 				var doneFns = inProgress[url];
/******/ 				delete inProgress[url];
/******/ 				script.parentNode && script.parentNode.removeChild(script);
/******/ 				doneFns && doneFns.forEach((fn) => (fn(event)));
/******/ 				if(prev) return prev(event);
/******/ 			}
/******/ 			var timeout = setTimeout(onScriptComplete.bind(null, undefined, { type: 'timeout', target: script }), 120000);
/******/ 			script.onerror = onScriptComplete.bind(null, script.onerror);
/******/ 			script.onload = onScriptComplete.bind(null, script.onload);
/******/ 			needAttach && document.head.appendChild(script);
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/publicPath */
/******/ 	(() => {
/******/ 		var scriptUrl;
/******/ 		if (globalThis.importScripts) scriptUrl = globalThis.location + "";
/******/ 		var document = globalThis.document;
/******/ 		if (!scriptUrl && document) {
/******/ 			if (document.currentScript && document.currentScript.tagName.toUpperCase() === 'SCRIPT')
/******/ 				scriptUrl = document.currentScript.src;
/******/ 			if (!scriptUrl) {
/******/ 				var scripts = document.getElementsByTagName("script");
/******/ 				if(scripts.length) {
/******/ 					var i = scripts.length - 1;
/******/ 					while (i > -1 && (!scriptUrl || !/^http(s?):/.test(scriptUrl))) scriptUrl = scripts[i--].src;
/******/ 				}
/******/ 			}
/******/ 		}
/******/ 		// When supporting browsers where an automatic publicPath is not supported you must specify an output.publicPath manually via configuration
/******/ 		// or pass an empty string ("") and set the __webpack_public_path__ variable from your code to use your own logic.
/******/ 		if (!scriptUrl) throw new Error("Automatic publicPath is not supported in this browser");
/******/ 		scriptUrl = scriptUrl.replace(/^blob:/, "").replace(/#.*$/, "").replace(/\?.*$/, "").replace(/\/[^\/]+$/, "/");
/******/ 		__webpack_require__.p = scriptUrl;
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/css loading */
/******/ 	(() => {
/******/ 		if (typeof document === "undefined") return;
/******/ 		var createStylesheet = (chunkId, fullhref, oldTag, resolve, reject) => {
/******/ 			var linkTag = document.createElement("link");
/******/ 		
/******/ 			linkTag.rel = "stylesheet";
/******/ 			linkTag.type = "text/css";
/******/ 			if (__webpack_require__.nc) {
/******/ 				linkTag.nonce = __webpack_require__.nc;
/******/ 			}
/******/ 			var onLinkComplete = (event) => {
/******/ 				// avoid mem leaks.
/******/ 				linkTag.onerror = linkTag.onload = null;
/******/ 				if (event.type === 'load') {
/******/ 					resolve();
/******/ 				} else {
/******/ 					var errorType = event && event.type;
/******/ 					var realHref = event && event.target && event.target.href || fullhref;
/******/ 					var err = new Error("Loading CSS chunk " + chunkId + " failed.\n(" + errorType + ": " + realHref + ")");
/******/ 					err.name = "ChunkLoadError";
/******/ 					err.code = "CSS_CHUNK_LOAD_FAILED";
/******/ 					err.type = errorType;
/******/ 					err.request = realHref;
/******/ 					if (linkTag.parentNode) linkTag.parentNode.removeChild(linkTag)
/******/ 					reject(err);
/******/ 				}
/******/ 			}
/******/ 			linkTag.onerror = linkTag.onload = onLinkComplete;
/******/ 			linkTag.href = fullhref;
/******/ 		
/******/ 		
/******/ 			if (oldTag) {
/******/ 				oldTag.parentNode.insertBefore(linkTag, oldTag.nextSibling);
/******/ 			} else {
/******/ 				document.head.appendChild(linkTag);
/******/ 			}
/******/ 			return linkTag;
/******/ 		};
/******/ 		var findStylesheet = (href, fullhref) => {
/******/ 			var existingLinkTags = document.getElementsByTagName("link");
/******/ 			for(var i = 0; i < existingLinkTags.length; i++) {
/******/ 				var tag = existingLinkTags[i];
/******/ 				var dataHref = tag.getAttribute("data-href") || tag.getAttribute("href");
/******/ 				if(tag.rel === "stylesheet" && (dataHref === href || dataHref === fullhref)) return tag;
/******/ 			}
/******/ 			var existingStyleTags = document.getElementsByTagName("style");
/******/ 			for(var i = 0; i < existingStyleTags.length; i++) {
/******/ 				var tag = existingStyleTags[i];
/******/ 				var dataHref = tag.getAttribute("data-href");
/******/ 				if(dataHref === href || dataHref === fullhref) return tag;
/******/ 			}
/******/ 		};
/******/ 		var loadStylesheet = (chunkId) => {
/******/ 			return new Promise((resolve, reject) => {
/******/ 				var href = __webpack_require__.miniCssF(chunkId);
/******/ 				var fullhref = __webpack_require__.p + href;
/******/ 				if(findStylesheet(href, fullhref)) return resolve();
/******/ 				createStylesheet(chunkId, fullhref, null, resolve, reject);
/******/ 			});
/******/ 		}
/******/ 		// object to store loaded CSS chunks
/******/ 		var installedCssChunks = {
/******/ 			"index": 0
/******/ 		};
/******/ 		
/******/ 		__webpack_require__.f.miniCss = (chunkId, promises) => {
/******/ 			var cssChunks = {"map-runtime-vendor":1,"map-runtime":1};
/******/ 			if(installedCssChunks[chunkId]) promises.push(installedCssChunks[chunkId]);
/******/ 			else if(installedCssChunks[chunkId] !== 0 && cssChunks[chunkId]) {
/******/ 				promises.push(installedCssChunks[chunkId] = loadStylesheet(chunkId).then(() => {
/******/ 					installedCssChunks[chunkId] = 0;
/******/ 				}, (e) => {
/******/ 					delete installedCssChunks[chunkId];
/******/ 					throw e;
/******/ 				}));
/******/ 			}
/******/ 		};
/******/ 		
/******/ 		// no hmr
/******/ 		
/******/ 		// no prefetching
/******/ 		
/******/ 		// no preloaded
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/jsonp chunk loading */
/******/ 	(() => {
/******/ 		// no baseURI
/******/ 		
/******/ 		// object to store loaded and loading chunks
/******/ 		// undefined = chunk not loaded, null = chunk preloaded/prefetched
/******/ 		// [resolve, reject, Promise] = chunk loading, 0 = chunk loaded
/******/ 		var installedChunks = {
/******/ 			"index": 0
/******/ 		};
/******/ 		
/******/ 		__webpack_require__.f.j = (chunkId, promises) => {
/******/ 				// JSONP chunk loading for javascript
/******/ 				var installedChunkData = __webpack_require__.o(installedChunks, chunkId) ? installedChunks[chunkId] : undefined;
/******/ 				if(installedChunkData !== 0) { // 0 means "already installed".
/******/ 		
/******/ 					// a Promise means "currently loading".
/******/ 					if(installedChunkData) {
/******/ 						promises.push(installedChunkData[2]);
/******/ 					} else {
/******/ 						if(true) { // all chunks have JS
/******/ 							// setup Promise in chunk cache
/******/ 							var promise = new Promise((resolve, reject) => (installedChunkData = installedChunks[chunkId] = [resolve, reject]));
/******/ 							promises.push(installedChunkData[2] = promise);
/******/ 		
/******/ 							// start chunk loading
/******/ 							var url = __webpack_require__.p + __webpack_require__.u(chunkId);
/******/ 							// create error before stack unwound to get useful stacktrace later
/******/ 							var error = new Error();
/******/ 							var loadingEnded = (event) => {
/******/ 								if(__webpack_require__.o(installedChunks, chunkId)) {
/******/ 									installedChunkData = installedChunks[chunkId];
/******/ 									if(installedChunkData !== 0) installedChunks[chunkId] = undefined;
/******/ 									if(installedChunkData) {
/******/ 										var errorType = event && (event.type === 'load' ? 'missing' : event.type);
/******/ 										var realSrc = event && event.target && event.target.src;
/******/ 										error.message = 'Loading chunk ' + chunkId + ' failed.\n(' + errorType + ': ' + realSrc + ')';
/******/ 										error.name = 'ChunkLoadError';
/******/ 										error.type = errorType;
/******/ 										error.request = realSrc;
/******/ 										installedChunkData[1](error);
/******/ 									}
/******/ 								}
/******/ 							};
/******/ 							__webpack_require__.l(url, loadingEnded, "chunk-" + chunkId, chunkId);
/******/ 						}
/******/ 					}
/******/ 				}
/******/ 		};
/******/ 		
/******/ 		// no prefetching
/******/ 		
/******/ 		// no preloaded
/******/ 		
/******/ 		// no HMR
/******/ 		
/******/ 		// no HMR manifest
/******/ 		
/******/ 		// no on chunks loaded
/******/ 		
/******/ 		// install a JSONP callback for chunk loading
/******/ 		var webpackJsonpCallback = (parentChunkLoadingFunction, data) => {
/******/ 			var [chunkIds, moreModules, runtime] = data;
/******/ 			// add "moreModules" to the modules object,
/******/ 			// then flag all "chunkIds" as loaded and fire callback
/******/ 			var moduleId, chunkId, i = 0;
/******/ 			if(chunkIds.some((id) => (installedChunks[id] !== 0))) {
/******/ 				for(moduleId in moreModules) {
/******/ 					if(__webpack_require__.o(moreModules, moduleId)) {
/******/ 						__webpack_require__.m[moduleId] = moreModules[moduleId];
/******/ 					}
/******/ 				}
/******/ 				if(runtime) var result = runtime(__webpack_require__);
/******/ 			}
/******/ 			if(parentChunkLoadingFunction) parentChunkLoadingFunction(data);
/******/ 			for(;i < chunkIds.length; i++) {
/******/ 				chunkId = chunkIds[i];
/******/ 				if(__webpack_require__.o(installedChunks, chunkId) && installedChunks[chunkId]) {
/******/ 					installedChunks[chunkId][0]();
/******/ 				}
/******/ 				installedChunks[chunkId] = 0;
/******/ 			}
/******/ 		
/******/ 		}
/******/ 		
/******/ 		var chunkLoadingGlobal = globalThis["webpackChunkminimal_map"] = globalThis["webpackChunkminimal_map"] || [];
/******/ 		chunkLoadingGlobal.forEach(webpackJsonpCallback.bind(null, 0));
/******/ 		chunkLoadingGlobal.push = webpackJsonpCallback.bind(null, chunkLoadingGlobal.push.bind(chunkLoadingGlobal));
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
/*!*****************************!*\
  !*** ./src/block/index.tsx ***!
  \*****************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _wordpress_blocks__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/blocks */ "@wordpress/blocks");
/* harmony import */ var _wordpress_blocks__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_blocks__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _block_json__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../block.json */ "./block.json");
/* harmony import */ var _edit__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./edit */ "./src/block/edit.tsx");
/* harmony import */ var _editor_scss__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./editor.scss */ "./src/block/editor.scss");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__);





const blockMetadata = _block_json__WEBPACK_IMPORTED_MODULE_1__;
const CustomIcon = /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)("svg", {
  xmlns: "http://www.w3.org/2000/svg",
  width: "24",
  height: "24",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  className: "lucide",
  children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("path", {
    d: "M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"
  }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("circle", {
    cx: "12",
    cy: "10",
    r: "3"
  })]
});
(0,_wordpress_blocks__WEBPACK_IMPORTED_MODULE_0__.registerBlockType)(blockMetadata.name, {
  ...blockMetadata,
  icon: CustomIcon,
  edit: _edit__WEBPACK_IMPORTED_MODULE_2__["default"],
  save: () => null
});
})();

/******/ })()
;
//# sourceMappingURL=index.js.map