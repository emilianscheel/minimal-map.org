import type { MapLocationTag, TagRecord } from "../../types";
import "./style.scss";

interface TagBadgeProps {
  tag: Pick<TagRecord, "name" | "background_color" | "foreground_color"> | MapLocationTag;
  className?: string;
}

export default function TagBadge({ tag, className = "" }: TagBadgeProps) {
  return (
    <span
      className={`minimal-map-tag-badge ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "var(--minimal-map-tag-badge-padding, 5px 8px)",
        borderRadius: "var(--minimal-map-tag-badge-border-radius, 18px)",
        fontSize: "var(--minimal-map-tag-badge-font-size, 11px)",
        fontWeight: "var(--minimal-map-tag-badge-font-weight, 600)",
        whiteSpace: "nowrap",
        backgroundColor: tag.background_color || "#000000",
        color: tag.foreground_color || "#ffffff",
      }}
    >
      {tag.name}
    </span>
  );
}
