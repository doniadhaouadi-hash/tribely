import { useEffect, useRef, useState, type FormEvent } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Ban, ImagePlus, Loader2, Sparkles, X } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { useLocation } from "@/context/LocationContext";
import { CATEGORIES, type CategoryKey, type MockActivity } from "@/data/activities";
import {
  cancelActivity,
  SKILL_TO_LEVEL,
  toPickableSkill,
  updateActivity,
  type PickableSkillLevel,
} from "@/lib/activitiesApi";
import { errorMessage } from "@/lib/errors";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { LevelPicker } from "@/components/LevelPicker";
import { PlaceSuggestions } from "@/components/PlaceSuggestions";
import { uploadImage, UploadError } from "@/lib/uploadImage";
import { clampLocation, MAX_LOCATION_LENGTH, searchPlaces, type GeoPlace } from "@/lib/geocode";

const titleSchema = z.string().trim().min(3, "Min 3 characters").max(80);
const descSchema = z.string().trim().max(500).optional();
const locationSchema = z
  .string()
  .trim()
  .min(2, "Please enter a location")
  .max(MAX_LOCATION_LENGTH, `Location is too long — keep it under ${MAX_LOCATION_LENGTH} characters`);

const CATEGORY_KEYS = Object.keys(CATEGORIES) as CategoryKey[];

const toLocalInputValue = (iso: string) => {
  const d = new Date(iso);
  const tz = d.getTimezoneOffset() * 60 * 1000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 16);
};

type Props = {
  activity: MockActivity | null;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
  /** Called after the host cancelled the activity (e.g. to close the detail sheet). */
  onCancelled?: () => void;
};

export const EditActivitySheet = ({ activity, onOpenChange, onSaved, onCancelled }: Props) => {
  const { city } = useLocation();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<CategoryKey>("running");
  const [locationName, setLocationName] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<{ lat: number; lng: number } | null>(null);
  const [placeSuggestions, setPlaceSuggestions] = useState<GeoPlace[]>([]);
  const [searchingPlace, setSearchingPlace] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [startAt, setStartAt] = useState("");
  const [duration, setDuration] = useState(60);
  const [maxParticipants, setMaxParticipants] = useState(8);
  const [level, setLevel] = useState<PickableSkillLevel>("casual");
  const [spontaneous, setSpontaneous] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const open = !!activity;

  useEffect(() => {
    if (!activity) return;
    setTitle(activity.title);
    setDescription(activity.description ?? "");
    setCategory(activity.category);
    setLocationName(clampLocation(activity.address));
    setSelectedPlace(null);
    setPlaceSuggestions([]);
    setStartAt(toLocalInputValue(activity.startsAt));
    setDuration(activity.durationMinutes);
    setMaxParticipants(activity.capacity);
    setLevel(toPickableSkill(activity.skillLevel));
    setSpontaneous(activity.spontaneous);
    setCoverPreview(activity.coverUrl);
    setCoverUrl(activity.coverUrl);
  }, [activity]);

  useEffect(() => {
    if (!activity || selectedPlace) return;
    const q = locationName.trim();
    if (q.length < 3 || q === clampLocation(activity.address)) {
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
  }, [locationName, selectedPlace, activity, city.lat, city.lng]);

  const selectPlace = (place: GeoPlace) => {
    // A picked suggestion must always pass validation (QA-028).
    setLocationName(clampLocation(place.label));
    setSelectedPlace({ lat: place.lat, lng: place.lng });
    setPlaceSuggestions([]);
    setShowSuggestions(false);
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setCoverPreview(URL.createObjectURL(file));
    setUploadingCover(true);
    try {
      const url = await uploadImage(file, "activities", activity!.host.id);
      setCoverUrl(url);
    } catch (err) {
      toast.error(err instanceof UploadError ? err.message : "Couldn't upload photo");
      setCoverPreview(activity?.coverUrl ?? null);
    } finally {
      setUploadingCover(false);
    }
  };

  const removeCover = () => {
    setCoverPreview(null);
    setCoverUrl(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!activity) return;
    setSaving(true);
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
      if (maxParticipants < activity.joined) {
        throw new Error(`Can't go below ${activity.joined} — that many already joined`);
      }

      let lat = activity.lat;
      let lng = activity.lng;
      if (selectedPlace) {
        lat = selectedPlace.lat;
        lng = selectedPlace.lng;
      } else if (locV !== clampLocation(activity.address)) {
        try {
          // Bias toward the selected city, not the stored coordinates (which
          // may be wrong, e.g. old activities placed at the Frankfurt default).
          const [found] = await searchPlaces(locV, undefined, { lat: city.lat, lng: city.lng });
          if (found) {
            lat = found.lat;
            lng = found.lng;
          } else {
            toast("Couldn't pinpoint that address", {
              description: "Kept the previous location instead.",
            });
          }
        } catch {
          // network hiccup — keep the previous coordinates silently
        }
      }

      await updateActivity(activity.id, {
        title: titleV,
        description: descV ?? null,
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

      toast.success("Activity updated");
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      const msg =
        err instanceof z.ZodError
          ? err.errors[0]?.message ?? "Invalid input"
          : err instanceof Error
            ? err.message
            : "Something went wrong";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelActivity = async () => {
    if (!activity) return;
    setCancelling(true);
    try {
      await cancelActivity(activity.id);
      toast.success("Activity cancelled");
      onOpenChange(false);
      onCancelled?.();
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't cancel the activity"));
    } finally {
      setCancelling(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        title="Edit activity"
        hideClose
        side="bottom"
        className="p-0 max-h-[92vh] h-[92vh] rounded-t-[2rem] border-0 bg-card overflow-hidden"
      >
        {activity && (
          <form onSubmit={handleSubmit} className="flex flex-col h-full">
            <header className="shrink-0 px-5 pt-5 pb-3 flex items-center gap-3 border-b border-border">
              <div className="absolute top-2 left-1/2 -translate-x-1/2 h-1.5 w-12 rounded-full bg-muted" />
              <h2 className="font-display text-lg font-bold flex-1">Edit activity</h2>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                aria-label="Close"
                className="grid place-items-center size-9 rounded-full bg-muted hover:bg-muted/70 transition-colors"
              >
                <X className="size-4" aria-hidden />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-5 pt-5 pb-4 space-y-5">
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
                <div className="-mx-5 px-5 overflow-x-auto scrollbar-hide">
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

              <Field label="Title">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  maxLength={80}
                  className="w-full rounded-2xl glass px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </Field>

              <div className="relative">
                <Field label="Where" hint={selectedPlace ? "Pinned ✓" : undefined}>
                  <input
                    value={locationName}
                    onChange={(e) => {
                      setLocationName(e.target.value);
                      setSelectedPlace(null);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setShowSuggestions(false)}
                    required
                    maxLength={MAX_LOCATION_LENGTH}
                    autoComplete="off"
                    className="w-full rounded-2xl glass px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </Field>
                {showSuggestions && locationName.trim().length >= 3 && !selectedPlace && (
                  <PlaceSuggestions
                    searching={searchingPlace}
                    places={placeSuggestions}
                    onSelect={selectPlace}
                  />
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

              <Field label="Max participants" hint={`${activity.joined} already joined`}>
                <input
                  type="number"
                  min={Math.max(2, activity.joined)}
                  max={100}
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(Number(e.target.value))}
                  required
                  className="w-full rounded-2xl glass px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </Field>

              <section className="space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">Level</span>
                <LevelPicker value={level} onChange={setLevel} />
              </section>

              <Field label="Description (optional)">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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
            </div>

            <div className="shrink-0 px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] border-t border-border bg-card">
              <button
                type="submit"
                disabled={saving || uploadingCover}
                className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-gradient-primary text-primary-foreground py-3.5 text-sm font-semibold shadow-glow hover:scale-[1.01] active:scale-[0.99] transition-transform ease-bounce disabled:opacity-60 disabled:hover:scale-100"
              >
                {saving && <Loader2 className="size-4 animate-spin" aria-hidden />}
                {uploadingCover ? "Uploading photo…" : "Save changes"}
              </button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    type="button"
                    disabled={saving || cancelling}
                    className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-60"
                  >
                    {cancelling ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                    ) : (
                      <Ban className="size-4" aria-hidden />
                    )}
                    Cancel activity
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel this activity?</AlertDialogTitle>
                    <AlertDialogDescription>
                      It will disappear from Discover and the map, and{" "}
                      {activity.joined === 1 ? "the 1 person" : `the ${activity.joined} people`} who
                      joined won't see it in their upcoming list anymore. This can't be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep it</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleCancelActivity}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Cancel activity
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </form>
        )}
      </SheetContent>
    </Sheet>
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
