import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import { Globe, Loader2, LocateFixed } from "lucide-react";
import { toast } from "sonner";
import { useActivities } from "@/hooks/useActivities";
import type { CategoryKey, MockActivity } from "@/data/activities";
import { useLocation } from "@/context/LocationContext";
import { reverseGeocodeCity } from "@/lib/geocode";
import { CategoryFilterRow } from "@/components/CategoryFilterRow";
import { createCategoryMarker } from "@/lib/mapMarker";
import { ActivityPreviewCard } from "@/components/ActivityPreviewCard";
import { LoadError } from "@/components/LoadError";
import { FEED_GRACE_MS } from "@/lib/activitiesApi";

type Props = {
  onOpenActivity?: (a: MockActivity) => void;
};

const RecenterOnCity = ({ lat, lng }: { lat: number; lng: number }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 13, { duration: 0.8 });
  }, [lat, lng, map]);
  return null;
};

export const MapTab = ({ onOpenActivity }: Props) => {
  const { city, setCity, openPicker } = useLocation();
  const { activities, error, retry } = useActivities();
  const [category, setCategory] = useState<CategoryKey | "all">("all");
  const [selected, setSelected] = useState<MockActivity | null>(null);
  const [locating, setLocating] = useState(false);

  const filtered = useMemo(() => {
    // The feed query already drops past activities; this also hides ones that
    // ran past the grace window while the page stayed open.
    const minStart = Date.now() - FEED_GRACE_MS;
    return activities
      .filter((a) => new Date(a.startsAt).getTime() >= minStart)
      .filter((a) => (category === "all" ? true : a.category === category));
  }, [activities, category]);

  useEffect(() => {
    if (selected && !filtered.some((a) => a.id === selected.id)) {
      setSelected(null);
    }
  }, [filtered, selected]);

  const handleMyLocation = () => {
    if (!("geolocation" in navigator)) {
      toast.error("Geolocation isn't available on this device");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const found = await reverseGeocodeCity(pos.coords.latitude, pos.coords.longitude);
          setCity(
            found
              ? { name: found.label, country: found.country, countryCode: found.countryCode, lat: found.lat, lng: found.lng }
              : {
                  name: "My location",
                  country: "",
                  countryCode: "",
                  lat: pos.coords.latitude,
                  lng: pos.coords.longitude,
                },
          );
        } finally {
          setLocating(false);
        }
      },
      () => {
        toast.error("Couldn't get your location — check location permissions");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  return (
    <div className="relative -mx-4 h-[calc(100vh-7.5rem)] overflow-hidden rounded-t-3xl">
      <MapContainer
        center={[city.lat, city.lng]}
        zoom={13}
        scrollWheelZoom
        zoomControl={false}
        className="absolute inset-0 z-0"
      >
        <TileLayer
          attribution="Tiles &copy; Esri — Esri, HERE, Garmin, FAO, NOAA, USGS, &copy; OpenStreetMap contributors"
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
          maxZoom={19}
        />
        <RecenterOnCity lat={city.lat} lng={city.lng} />
        {filtered.map((a) => (
          <Marker
            key={a.id}
            position={[a.lat, a.lng]}
            icon={createCategoryMarker(a.category, {
              spontaneous: a.spontaneous,
              selected: selected?.id === a.id,
            })}
            eventHandlers={{
              click: () => setSelected(a),
            }}
          />
        ))}
      </MapContainer>

      <div className="absolute top-3 left-0 right-0 z-10 pointer-events-none">
        <div className="px-3 pointer-events-auto">
          <div className="rounded-full glass-strong shadow-soft px-2 py-1.5">
            <CategoryFilterRow active={category} onChange={setCategory} />
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={openPicker}
        aria-label="Change location"
        className="absolute top-20 right-3 z-10 grid place-items-center size-11 rounded-full glass-strong text-foreground shadow-float hover:scale-105 active:scale-95 transition-transform ease-bounce"
      >
        <Globe className="size-5" aria-hidden />
      </button>

      <button
        type="button"
        onClick={handleMyLocation}
        disabled={locating}
        aria-label="Use my location"
        className="absolute bottom-28 right-3 z-10 grid place-items-center size-11 rounded-full glass-strong text-foreground shadow-float hover:scale-105 active:scale-95 transition-transform ease-bounce disabled:opacity-60"
      >
        {locating ? (
          <Loader2 className="size-5 text-primary animate-spin" aria-hidden />
        ) : (
          <LocateFixed className="size-5 text-primary" aria-hidden />
        )}
      </button>

      {error && activities.length === 0 && (
        <div className="absolute top-36 left-3 right-3 z-10">
          <LoadError message={error} onRetry={retry} />
        </div>
      )}

      {selected && (
        <div className="absolute bottom-3 left-3 right-3 z-10 animate-slide-up">
          <ActivityPreviewCard
            activity={selected}
            onClose={() => setSelected(null)}
            onOpen={() => onOpenActivity?.(selected)}
          />
        </div>
      )}
    </div>
  );
};
