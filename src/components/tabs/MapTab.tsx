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
  const { activities } = useActivities();
  const [category, setCategory] = useState<CategoryKey | "all">("all");
  const [selected, setSelected] = useState<MockActivity | null>(null);
  const [locating, setLocating] = useState(false);

  const filtered = useMemo(
    () =>
      activities.filter((a) => (category === "all" ? true : a.category === category)),
    [activities, category],
  );

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
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          maxZoom={20}
          detectRetina
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
