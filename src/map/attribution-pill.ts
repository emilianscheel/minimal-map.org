import { __ } from "@wordpress/i18n";
import type { NormalizedMapConfig, WordPressAttributionControl } from "../types";

function createAttributionLink(href: string, label: string): HTMLAnchorElement {
  const link = document.createElement("a");

  link.href = href;
  link.target = "_blank";
  link.rel = "noreferrer noopener";
  link.textContent = label;

  return link;
}

export function createAttributionPill(
  host: HTMLElement,
  config: NormalizedMapConfig,
): WordPressAttributionControl {
  const root = document.createElement("div");
  const content = document.createElement("span");
  const tilesLink = createAttributionLink(
    "https://openfreemap.org/",
    "OpenFreeMap",
  );
  const separator = document.createElement("span");
  const dataPrefix = document.createElement("span");
  const dataLink = createAttributionLink(
    "https://www.openstreetmap.org/copyright",
    "OpenStreetMap",
  );

  root.className = "minimal-map-attribution";
  root.setAttribute("role", "note");
  root.setAttribute("aria-label", __("Map credits", "minimal-map"));
  root.style.setProperty(
    "--minimal-map-attribution-padding-top",
    config.creditsPadding.top,
  );
  root.style.setProperty(
    "--minimal-map-attribution-padding-right",
    config.creditsPadding.right,
  );
  root.style.setProperty(
    "--minimal-map-attribution-padding-bottom",
    config.creditsPadding.bottom,
  );
  root.style.setProperty(
    "--minimal-map-attribution-padding-left",
    config.creditsPadding.left,
  );
  root.style.setProperty(
    "--minimal-map-attribution-margin-top",
    config.creditsOuterMargin.top,
  );
  root.style.setProperty(
    "--minimal-map-attribution-margin-right",
    config.creditsOuterMargin.right,
  );
  root.style.setProperty(
    "--minimal-map-attribution-margin-bottom",
    config.creditsOuterMargin.bottom,
  );
  root.style.setProperty(
    "--minimal-map-attribution-margin-left",
    config.creditsOuterMargin.left,
  );
  root.style.setProperty(
    "--minimal-map-attribution-background",
    config.creditsBackgroundColor,
  );
  root.style.setProperty(
    "--minimal-map-attribution-color",
    config.creditsForegroundColor,
  );
  root.style.setProperty(
    "--minimal-map-attribution-border-radius",
    config.creditsBorderRadius,
  );

  content.className = "minimal-map-attribution__content";
  separator.className = "minimal-map-attribution__separator";
  separator.textContent = " | ";
  dataPrefix.textContent = "";

  content.append(tilesLink, separator, dataPrefix, dataLink);
  root.appendChild(content);
  host.appendChild(root);

  return {
    destroy() {
      root.remove();
    },
  };
}
