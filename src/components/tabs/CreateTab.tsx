import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ImagePlus, Loader2, Lock, MapPin, Plus, Sparkles, X } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "@/context/LocationContext";
import { CATEGORIES, type CategoryKey } from "@/data/activities";
import { createActivity, SKILL_TO_LEVEL, type PickableSkillLevel } from "@/lib/activitiesApi";
import { LevelPicker } from "@/components/LevelPicker";
import { uploadImage, UploadError } from "@/lib/uploadImage";
import { searchPlaces, type GeoPlace } from "@/lib/geocode";

const titleSchema = z.string().trim().min(3, "Min 3 characters").max(80);
const descSchema = z.string().trim().max(500).optional();
const locationSchema = z.string().trim().min(2, "Required").max(120);

const CATEGORY_KEYS = Object.keys(CATEGORIES) as CategoryKey[];

const localISONow = (offsetMinutes = 60) => {
  const d = new Date(Date.now() + offsetMinutes * 60 * 1000);
  d.setSeconds(0, 0);
  // datetime-local needs YYYY-MM-DDTHH:MM in local time
  const tz = d.getTimezoneOffset() * 60 * 1000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 16);
};

export const CreateTab = () => {
  const { user, profile, loading } = useAuth();
  const { city } = useLocation();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<CategoryKey>("running");
  const [locationName, setLocationName] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<{ lat: number; lng: number } | null>(null);
  const [placeSuggestions, setPlaceSuggestions] = useState<GeoPlace[]>([]);
  const [searchingPlace, setSearchingPlace] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [startAt, setStartAt] = useState(() => localISONow(60));
  const [duration, setDuration] = useState(60);
  const [maxParticipants, setMaxParticipants] = useState(8);
  const [level, setLevel] = useState<PickableSkillLevel>("casual");
  const [spontaneous, setSpontaneous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;
    setCoverPreview(URL.createObjectURL(file));
    setUploadingCover(true);
    try {
      const url = await uploadImage(file, "activities", user.id);
      setCoverUrl(url);
    } catch (err) {
      toast.error(err instanceof UploadError ? err.message : "Couldn't upload photo");
      setCoverPreview(null);
    } finally {
      setUploadingCover(false);
    }
  };

  const removeCover = () => {
    setCoverPreview(null);
    setCoverUrl(null);
  };

  useEffect(() => {
    if (selectedPlace) return;
    const q = locationName.trim();
    if (q.length < 3) {
      setPlaceSuggestions([]);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearchingPlace(true);
      try {
        const places = await searchPlaces(q, controller.signal, { lat: city.lat, lng: city.lng });
        setPlaceSuggestions(places);
      } catch {
        // aborted or network hiccup — ignore, user is likely still typing
      } finally {
        setSearchingPlace(false);
      }
    }, 400);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [locationName, selectedPlace, city.lat, city.lng]);

  const selectPlace = (place: GeoPlace) => {
    setLocationName(place.label);
    setSelectedPlace({ lat: place.lat, lng: place.lng });
    setPlaceSuggestions([]);
    setShowSuggestions(false);
  };

  const cat = CATEGORIES[category];
  const tint = useMemo(() => `hsl(var(${cat.tintVar}))`, [cat]);

  if (loading) {
    return (
      <div className="pt-12 grid place-items-center text-muted-foreground">
        <Loader2 className="size-6 animate-spin" aria-hidden />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="pt-10 flex flex-col items-center text-center gap-5 px-2">
        <div className="grid place-items-center size-20 rounded-full bg-muted">
          <Lock className="size-9 text-muted-foreground" aria-hidden />
        </div>
        <div className="space-y-1">
          <h2 className="font-display text-2xl font-bold">Sign in to host</h2>
          <p className="text-sm text-muted-foreground max-w-xs">
            Create an account to spin up runs, matches and sessions.
          </p>
        </div>
        <Link
          to="/auth"
          className="rounded-full bg-primary text-primary-foreground px-6 py-3 text-sm font-semibold shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-transform ease-bounce"
        >
          Sign in
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const titleV = titleSchema.parse(title);
      const descV = descSchema.parse(description || undefined);
      const locV = locationSchema.parse(locationName);

      const startISO = new Date(startAt).toISOString();
      if (new Date(startISO).getTime() < Date.now() - 60_000) {
        throw new Error("Start time must be in the future");
      }
      if (duration < 15 || duration > 600) {
        throw new Error("Duration must be 15–600 minutes");
      }
      if (maxParticipants < 2 || maxParticipants > 100) {
        throw new Error("Spots must be between 2 and 100");
      }

      let lat = city.lat;
      let lng = city.lng;
      if (selectedPlace) {
        lat = selectedPlace.lat;
        lng = selectedPlace.lng;
      } else {
        try {
          const [found] = await searchPlaces(locV, undefined, { lat: city.lat, lng: city.lng });
          if (found) {
            lat = found.lat;
            lng = found.lng;
          } else {
            toast("Couldn't pinpoint that address", {
              description: `Placed near ${city.name} center instead.`,
            });
          }
        } catch {
          // network hiccup — fall back to the city center silently
        }
      }

      await createActivity({
        host_id: user.id,
        title: titleV,
        description: descV,
        category,
        location_name: locV,
        address: locV,
        lat,
        lng,
        start_at: startISO,
        duration_min: duration,
        max_participants: maxParticipants,
        level_required: SKILL_TO_LEVEL[level],
        spontaneous,
        cover_url: coverUrl,
      });

      toast.success("Activity created 🎉", { description: titleV });
      navigate("/?tab=discover");
    } catch (err) {
      const msg =
        err instanceof z.ZodError
          ? err.errors[0]?.message ?? "Invalid input"
          : err instanceof Error
            ? err.message
            : "Something went wrong";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pt-1 pb-4">
      <header className="space-y-1">
        <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-[11px] font-medium text-muted-foreground">
          <Plus className="size-3.5 text-primary" aria-hidden /> Host an activity
        </div>
        <h2 className="font-display text-2xl font-bold leading-tight">
          What are you up to,{" "}
          <span style={{ color: tint }}>{profile?.display_name?.split(" ")[0] || "you"}</span>?
        </h2>
        <p className="text-sm text-muted-foreground">
          Drop the basics — your tribe will join in seconds.
        </p>
      </header>

      {/* Cover photo */}
      <section className="space-y-2">
        <Label>Cover photo (optional)</Label>
        {coverPreview ? (
          <div className="relative rounded-2xl overflow-hidden h-36">
            <img src={coverPreview} alt="" className="size-full object-cover" />
            {uploadingCover && (
              <div className="absolute inset-0 bg-black/40 grid place-items-center">
                <Loader2 className="size-6 text-white animate-spin" aria-hidden />
              </div>
            )}
            <button
              type="button"
              onClick={removeCover}
              aria-label="Remove photo"
              className="absolute top-2 right-2 grid place-items-center size-8 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            className="w-full h-28 rounded-2xl glass hover:bg-white/20 transition-colors flex flex-col items-center justify-center gap-1.5 text-muted-foreground"
          >
            <ImagePlus className="size-5" aria-hidden />
            <span className="text-xs font-medium">Add a photo for your activity</span>
          </button>
        )}
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleCoverChange}
        />
      </section>

      {/* Category picker */}
      <section className="space-y-2">
        <Label>Category</Label>
        <div className="-mx-4 px-4 overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-2 w-max">
            {CATEGORY_KEYS.map((key) => {
              const c = CATEGORIES[key];
              const isActive = key === category;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setCategory(key)}
                  aria-pressed={isActive}
                  className="shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-medium transition-all duration-200 glass text-foreground hover:bg-white/20 aria-pressed:border-transparent aria-pressed:shadow-soft"
                  style={
                    isActive
                      ? {
                          backgroundColor: `hsl(var(${c.tintVar}) / 0.18)`,
                          color: `hsl(var(${c.tintVar}))`,
                          borderColor: `hsl(var(${c.tintVar}) / 0.3)`,
                        }
                      : undefined
                  }
                >
                  <span aria-hidden>{c.emoji}</span>
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <Field label="Title" hint="Be punchy: “Sunset 5K along the Main”">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Morning run am Main"
          required
          maxLength={80}
          className="w-full rounded-2xl glass px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </Field>

      <div className="relative">
        <Field label="Where" hint={selectedPlace ? "Pinned ✓" : `Near ${city.name}`}>
          <input
            value={locationName}
            onChange={(e) => {
              setLocationName(e.target.value);
              setSelectedPlace(null);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder="Eiserner Steg, Frankfurt"
            required
            maxLength={120}
            autoComplete="off"
            className="w-full rounded-2xl glass px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </Field>
        {showSuggestions && locationName.trim().length >= 3 && !selectedPlace && (
          <div className="absolute left-0 right-0 top-full mt-1.5 z-20 rounded-2xl glass-strong shadow-float overflow-hidden max-h-64 overflow-y-auto">
            {searchingPlace ? (
              <div className="px-4 py-3 text-xs text-muted-foreground">Searching…</div>
            ) : placeSuggestions.length === 0 ? (
              <div className="px-4 py-3 text-xs text-muted-foreground">
                No matches — you can still use this as a custom location
              </div>
            ) : (
              placeSuggestions.map((place, i) => (
                <button
                  key={`${place.label}-${i}`}
                  type="button"
                  onClick={() => selectPlace(place)}
                  className="w-full flex items-start gap-2 px-4 py-3 text-left text-sm hover:bg-white/20 transition-colors"
                >
                  <MapPin className="size-4 text-primary shrink-0 mt-0.5" aria-hidden />
                  <span className="truncate">{place.label}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Starts">
          <input
            type="datetime-local"
            value={startAt}
            onChange={(e) => setStartAt(e.target.value)}
            required
            className="w-full rounded-2xl glass px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </Field>
        <Field label="Duration (min)">
          <input
            type="number"
            min={15}
            max={600}
            step={15}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            required
            className="w-full rounded-2xl glass px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </Field>
      </div>

      <Field label="Max participants">
        <input
          type="number"
          min={2}
          max={100}
          value={maxParticipants}
          onChange={(e) => setMaxParticipants(Number(e.target.value))}
          required
          className="w-full rounded-2xl glass px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </Field>

      <section className="space-y-1.5">
        <Label>Level</Label>
        <LevelPicker value={level} onChange={setLevel} />
      </section>

      <Field label="Description (optional)">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What to bring, vibe, pace, etc."
          maxLength={500}
          rows={3}
          className="w-full rounded-2xl glass px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
      </Field>

      <button
        type="button"
        onClick={() => setSpontaneous((s) => !s)}
        aria-pressed={spontaneous}
        className={`w-full inline-flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm transition-colors ${
          spontaneous
            ? "border-accent bg-accent/10"
            : "border-transparent glass hover:bg-white/20"
        }`}
      >
        <span className="inline-flex items-center gap-2">
          <Sparkles className={`size-4 ${spontaneous ? "text-accent" : "text-muted-foreground"}`} aria-hidden />
          <span className="font-medium">Spontaneous</span>
        </span>
        <span className="text-xs text-muted-foreground">
          {spontaneous ? "Boosted in feed" : "Tap to mark as spontaneous"}
        </span>
      </button>

      <button
        type="submit"
        disabled={submitting || uploadingCover}
        className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-gradient-primary text-primary-foreground py-3.5 text-sm font-semibold shadow-glow hover:scale-[1.01] active:scale-[0.99] transition-transform ease-bounce disabled:opacity-60 disabled:hover:scale-100"
      >
        {submitting && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {uploadingCover ? "Uploading photo…" : "Create activity"}
      </button>
    </form>
  );
};

const Label = ({ children }: { children: React.ReactNode }) => (
  <span className="text-xs font-medium text-muted-foreground">{children}</span>
);

const Field = ({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) => (
  <label className="block space-y-1.5">
    <span className="flex items-center justify-between">
      <Label>{label}</Label>
      {hint && <span className="text-[11px] text-muted-foreground/80">{hint}</span>}
    </span>
    {children}
  </label>
);
