import L from "leaflet";
import { CATEGORIES, type CategoryKey } from "@/data/activities";

/**
 * Build a Leaflet DivIcon for a category marker.
 * Uses HSL category tints from the design system. The Lime ring marks the brand.
 */
export const createCategoryMarker = (
  category: CategoryKey,
  opts: { spontaneous?: boolean; selected?: boolean } = {},
): L.DivIcon => {
  const cat = CATEGORIES[category];
  const tint = `hsl(var(${cat.tintVar}))`;
  const ring = opts.selected ? "hsl(var(--primary))" : "hsl(0 0% 100%)";
  const size = opts.selected ? 44 : 36;

  const pulse = opts.spontaneous
    ? `<span class="tribely-marker-pulse" aria-hidden></span>`
    : "";

  const html = `
    <div class="tribely-marker-wrap" style="width:${size}px;height:${size}px;">
      ${pulse}
      <div class="tribely-marker" style="
        background:${tint};
        box-shadow: 0 4px 12px hsl(155 35% 15% / .35), 0 0 0 3px ${ring};
      ">
        <span aria-hidden>${cat.emoji}</span>
      </div>
    </div>
  `;

  return L.divIcon({
    className: "tribely-marker-icon", // resets default leaflet icon styles
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};
