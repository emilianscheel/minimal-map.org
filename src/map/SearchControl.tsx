import { createRoot } from "@wordpress/element";
import { useState, useMemo, useEffect, useRef } from "@wordpress/element";
import { Phone, Mail, Globe, MapPin, Search, X } from "lucide-react";
import type { Map as MapLibreMap } from "maplibre-gl";
import TagBadge from "../components/TagBadge";
import type {
  MapLocationLogo,
  MapLocationPoint,
  NormalizedMapConfig,
} from "../types";

interface SearchControlProps {
  locations: MapLocationPoint[];
  onSelect: (location: MapLocationPoint) => void;
  config: NormalizedMapConfig;
  selectedId?: number;
}

const formatDisplayUrl = (url: string): string => {
  if (!url) return "";
  return url
    .replace(/^(https?:\/\/)/, "")
    .replace(/^www\./, "")
    .replace(/\/$/, "");
};

const SearchResultLogo = ({ logo }: { logo: MapLocationLogo }) => {
  const isSvgMarkup = logo.content.trim().startsWith("<svg");

  return (
    <div
      className="minimal-map-search__result-logo"
      aria-hidden="true"
    >
      {isSvgMarkup ? (
        <div
          className="minimal-map-search__result-logo-svg"
          dangerouslySetInnerHTML={{ __html: logo.content }}
        />
      ) : (
        <img
          className="minimal-map-search__result-logo-image"
          src={logo.content}
          alt=""
        />
      )}
    </div>
  );
};

const MapSearchControl = ({
  locations,
  onSelect,
  config,
  selectedId: selectedIdProp,
}: SearchControlProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [selectedId, setSelectedId] = useState(selectedIdProp);
  const containerRef = useRef<HTMLDivElement>(null);

  const isOpen = isFocused || !!selectedId;

  // Sync local state with prop updates (e.g. from marker clicks)
  useEffect(() => {
    setSelectedId(selectedIdProp);
  }, [selectedIdProp]);

  const filteredLocations = useMemo(() => {
    if (!isOpen) return [];

    const term = searchTerm.toLowerCase().trim();
    if (!term) return locations;

    return locations.filter((loc) => {
      const searchableValues = [
        loc.title,
        loc.city,
        loc.street,
        loc.house_number,
        loc.postal_code,
        loc.state,
        loc.country,
        loc.telephone,
        loc.email,
        loc.website,
        ...(Array.isArray(loc.tags) ? loc.tags.map((tag) => tag.name) : []),
      ];

      return searchableValues.some((value) =>
        value?.toLowerCase().includes(term),
      );
    });
  }, [locations, searchTerm, isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsFocused(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Scroll selected item into view when it changes
  useEffect(() => {
    if (selectedId) {
      const element = document.getElementById(
        `minimal-map-result-${selectedId}`,
      );
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }, [selectedId]);

  const handleSelect = (loc: MapLocationPoint) => {
    setSelectedId(loc.id);
    onSelect(loc);
  };

  const handleClear = () => {
    setSearchTerm("");
  };

  return (
    <>
      {isOpen && (
        <div
          className="minimal-map-search-backdrop"
          onClick={() => setIsFocused(false)}
        />
      )}
      <div
        ref={containerRef}
        className={`minimal-map-search ${isOpen ? "is-focused" : ""}`}
        style={
          {
            "--minimal-map-search-background":
              config.zoomControlsBackgroundColor,
            "--minimal-map-search-color": config.zoomControlsIconColor,
            "--minimal-map-search-border-color": config.zoomControlsBorderColor,
            "--minimal-map-search-border-radius":
              config.zoomControlsBorderRadius,
            "--minimal-map-search-border-width": config.zoomControlsBorderWidth,
          } as React.CSSProperties
        }
      >
        <div className="minimal-map-search__input-wrapper">
          <div className="minimal-map-search__icon-container">
            <Search size={18} />
          </div>
          <input
            type="text"
            className="minimal-map-search__input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setIsFocused(true)}
            placeholder="Search locations..."
            aria-label="Search locations"
          />
          {searchTerm && (
            <button
              type="button"
              className="minimal-map-search__clear"
              onClick={handleClear}
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {isOpen && (
          <div className="minimal-map-search__results-container">
            {filteredLocations.length > 0 ? (
              <div className="minimal-map-search__results">
                {filteredLocations.map((loc) => (
                  <button
                    key={loc.id}
                    id={`minimal-map-result-${loc.id}`}
                    type="button"
                    className={`minimal-map-search__result-item ${
                      selectedId === loc.id ? "is-selected" : ""
                    }`}
                    onClick={() => handleSelect(loc)}
                  >
                    <div className="minimal-map-search__result-layout">
                      <div className="minimal-map-search__result-content">
                        <div className="minimal-map-search__result-title">
                          {loc.title}
                        </div>
                        <div className="minimal-map-search__result-address">
                          <MapPin size={12} />
                          <span>
                            {[loc.street, loc.house_number]
                              .filter(Boolean)
                              .join(" ")}
                            {loc.city ? `, ${loc.city}` : ""}
                          </span>
                        </div>
                        {(loc.telephone || loc.email || loc.website) && (
                          <div className="minimal-map-search__result-meta">
                            {loc.telephone && (
                              <div className="minimal-map-search__meta-item">
                                <Phone size={10} />
                                <span>{loc.telephone}</span>
                              </div>
                            )}
                            {loc.email && (
                              <div className="minimal-map-search__meta-item">
                                <Mail size={10} />
                                <span>{loc.email}</span>
                              </div>
                            )}
                            {loc.website && (
                              <div className="minimal-map-search__meta-item">
                                <Globe size={10} />
                                <span>{formatDisplayUrl(loc.website)}</span>
                              </div>
                            )}
                          </div>
                        )}
                        {Array.isArray(loc.tags) && loc.tags.length > 0 && (
                          <div className="minimal-map-search__result-tags">
                            {loc.tags.map((tag) => (
                              <TagBadge key={tag.id} tag={tag} />
                            ))}
                          </div>
                        )}
                      </div>
                      {loc.logo ? (
                        <div className="minimal-map-search__result-logo-column">
                          <SearchResultLogo logo={loc.logo} />
                        </div>
                      ) : null}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              searchTerm.trim() !== "" && (
                <div className="minimal-map-search__no-results">
                  No locations found
                </div>
              )
            )}
          </div>
        )}
      </div>
    </>
  );
};

export interface WordPressSearchControl {
  destroy: () => void;
  update: (config: NormalizedMapConfig, selectedId?: number) => void;
}

export function createWordPressSearchControl(
  host: HTMLElement,
  map: MapLibreMap,
  initialConfig: NormalizedMapConfig,
  initialSelectedId?: number,
  onLocationSelect?: (location: MapLocationPoint) => void,
): WordPressSearchControl {
  const container = document.createElement("div");
  container.className = "minimal-map-search-host";

  container.style.position = "absolute";
  container.style.top = "0";
  container.style.left = "0";
  container.style.right = "0";
  container.style.bottom = "0";
  container.style.zIndex = "10";
  container.style.pointerEvents = "none";

  host.appendChild(container);

  const root = createRoot(container);

  const onSelect = (location: MapLocationPoint) => {
  	onLocationSelect?.(location);
    const isMobile = window.innerWidth <= 600;
  	map.easeTo(
  		{
  			center: [location.lng, location.lat],
  			zoom: Math.max(map.getZoom(), 15),
  			padding: { 
          left: !isMobile && initialConfig.allowSearch ? 368 : 0, 
          top: isMobile ? 80 : 0, 
          right: 0, 
          bottom: 0 
        },
  			essential: true,
  		},
  		{ isMinimalMapInternal: true },
  	);
  };
  const render = (cfg: NormalizedMapConfig, selId?: number) => {
    root.render(
      <MapSearchControl
        locations={cfg.locations}
        onSelect={onSelect}
        config={cfg}
        selectedId={selId}
      />,
    );
  };

  render(initialConfig, initialSelectedId);

  return {
    destroy() {
      root.unmount();
      container.remove();
    },
    update(cfg, selId) {
      render(cfg, selId);
    },
  };
}
