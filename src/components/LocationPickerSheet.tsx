import { useEffect, useRef, useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Loader2, LocateFixed, MapPin, Search, X } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "@/context/LocationContext";
import { searchCities, reverseGeocodeCity, type GeoCity } from "@/lib/geocode";

export const LocationPickerSheet = () => {
  const { setCity, pickerOpen, closePicker } = useLocation();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeoCity[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!pickerOpen) {
      setQuery("");
      setResults([]);
    }
  }, [pickerOpen]);

  useEffect(() => {
    abortRef.current?.abort();
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const controller = new AbortController();
    abortRef.current = controller;
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const places = await searchCities(query, controller.signal);
        setResults(places);
      } catch {
        // aborted or network hiccup — ignore, user is likely still typing
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  const pick = (city: GeoCity) => {
    setCity({ name: city.label, country: city.country, countryCode: city.countryCode, lat: city.lat, lng: city.lng });
    closePicker();
  };

  const handleUseMyLocation = () => {
    if (!("geolocation" in navigator)) {
      toast.error("Geolocation isn't available on this device");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const city = await reverseGeocodeCity(pos.coords.latitude, pos.coords.longitude);
          if (city) {
            pick(city);
          } else {
            setCity({
              name: "My location",
              country: "",
              countryCode: "",
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            });
            closePicker();
          }
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
    <Sheet open={pickerOpen} onOpenChange={(o) => !o && closePicker()}>
      <SheetContent
        title="Change location"
        hideClose
        side="bottom"
        className="p-0 max-h-[80vh] rounded-t-[2rem] border-0 bg-card overflow-hidden"
      >
        <div className="flex flex-col max-h-[80vh]">
          <header className="shrink-0 px-5 pt-5 pb-3 flex items-center gap-3">
            <div className="absolute top-2 left-1/2 -translate-x-1/2 h-1.5 w-12 rounded-full bg-muted" />
            <h2 className="font-display text-lg font-bold flex-1">Change location</h2>
            <button
              type="button"
              onClick={closePicker}
              aria-label="Close"
              className="grid place-items-center size-9 rounded-full bg-muted hover:bg-muted/70 transition-colors"
            >
              <X className="size-4" aria-hidden />
            </button>
          </header>

          <div className="shrink-0 px-5 pb-3 space-y-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" aria-hidden />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for a city…"
                autoFocus
                className="w-full rounded-full glass pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
              />
            </div>

            <button
              type="button"
              onClick={handleUseMyLocation}
              disabled={locating}
              className="w-full inline-flex items-center gap-2.5 rounded-2xl glass px-4 py-3 text-sm font-medium text-foreground hover:bg-white/20 transition-colors disabled:opacity-60"
            >
              {locating ? (
                <Loader2 className="size-4 animate-spin text-primary" aria-hidden />
              ) : (
                <LocateFixed className="size-4 text-primary" aria-hidden />
              )}
              Use my current location
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
            {searching && (
              <div className="py-4 text-center text-sm text-muted-foreground">Searching…</div>
            )}
            {!searching && query.trim().length >= 2 && results.length === 0 && (
              <div className="py-4 text-center text-sm text-muted-foreground">No cities found</div>
            )}
            <div className="space-y-1.5">
              {results.map((c, i) => (
                <button
                  key={`${c.label}-${c.lat}-${i}`}
                  type="button"
                  onClick={() => pick(c)}
                  className="w-full flex items-center gap-3 rounded-2xl px-3.5 py-3 text-left hover:bg-muted/60 transition-colors"
                >
                  <MapPin className="size-4 text-primary shrink-0" aria-hidden />
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{c.label}</div>
                    {c.country && (
                      <div className="text-xs text-muted-foreground truncate">{c.country}</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
