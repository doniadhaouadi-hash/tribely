import { MapPin } from "lucide-react";
import type { GeoPlace } from "@/lib/geocode";

type Props = {
  searching: boolean;
  places: GeoPlace[];
  onSelect: (place: GeoPlace) => void;
};

/**
 * Dropdown of address suggestions under the "Where" input (Create/Edit).
 *
 * Pressing inside the list must not blur the input: otherwise the input's
 * onBlur hides the list before the click lands, and slow (touch) taps are
 * lost (QA-031). Preventing the default of pointer/mouse down keeps focus.
 */
export const PlaceSuggestions = ({ searching, places, onSelect }: Props) => {
  const keepInputFocus = (e: React.SyntheticEvent) => e.preventDefault();

  return (
    <div
      role="listbox"
      aria-label="Address suggestions"
      onPointerDown={keepInputFocus}
      onMouseDown={keepInputFocus}
      className="absolute left-0 right-0 top-full mt-1.5 z-20 rounded-2xl glass-strong shadow-float overflow-hidden max-h-64 overflow-y-auto"
    >
      {searching ? (
        <div className="px-4 py-3 text-xs text-muted-foreground">Searching…</div>
      ) : places.length === 0 ? (
        <div className="px-4 py-3 text-xs text-muted-foreground">
          No matches — you can still use this as a custom location
        </div>
      ) : (
        places.map((place, i) => (
          <button
            key={`${place.label}-${i}`}
            type="button"
            role="option"
            aria-selected={false}
            onClick={() => onSelect(place)}
            className="w-full flex items-start gap-2 px-4 py-3 text-left text-sm hover:bg-white/20 transition-colors"
          >
            <MapPin className="size-4 text-primary shrink-0 mt-0.5" aria-hidden />
            <span className="truncate">{place.label}</span>
          </button>
        ))
      )}
    </div>
  );
};
