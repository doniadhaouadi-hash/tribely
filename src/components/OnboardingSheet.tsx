import { useEffect, useRef, useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ArrowRight, Camera, Check, Loader2 } from "lucide-react";
import { CATEGORIES, CATEGORY_KEYS, type CategoryKey } from "@/data/activities";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Avatar } from "@/components/Avatar";
import { uploadImage, UploadError } from "@/lib/uploadImage";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Level = "beginner" | "intermediate" | "advanced" | "pro";

const LEVELS: { key: Level; label: string; description: string }[] = [
  { key: "beginner", label: "Beginner", description: "Just getting into it" },
  { key: "intermediate", label: "Intermediate", description: "Regular vibe" },
  { key: "advanced", label: "Advanced", description: "Strong & consistent" },
  { key: "pro", label: "Pro", description: "Compete or coach" },
];

type Props = {
  open: boolean;
  onClose: () => void;
};

export const OnboardingSheet = ({ open, onClose }: Props) => {
  const { user, profile, refreshProfile } = useAuth();
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [sports, setSports] = useState<Set<CategoryKey>>(new Set());
  const [level, setLevel] = useState<Level>("beginner");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && profile) {
      setDisplayName(profile.display_name ?? "");
      setAvatarUrl(profile.avatar_url ?? null);
      setSports(new Set((profile.sports ?? []) as CategoryKey[]));
      setLevel((profile.level as Level) ?? "beginner");
      setStep(0);
    }
  }, [open, profile]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;
    setUploadingAvatar(true);
    try {
      const url = await uploadImage(file, "avatars", user.id);
      const { error } = await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id);
      if (error) throw error;
      setAvatarUrl(url);
      toast.success("Profile photo added");
    } catch (err) {
      toast.error(err instanceof UploadError ? err.message : "Couldn't upload photo");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const toggleSport = (k: CategoryKey) => {
    setSports((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  };

  const handleNext = () => {
    if (step === 0 && !displayName.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (step === 1 && sports.size === 0) {
      toast.error("Pick at least one sport");
      return;
    }
    if (step < 2) setStep((s) => (s + 1) as 0 | 1 | 2);
    else handleFinish();
  };

  const handleFinish = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName.trim(),
          sports: Array.from(sports),
          level,
          onboarded: true,
        })
        .eq("id", user.id);
      if (error) throw error;
      await refreshProfile();
      toast.success("Welcome to Tribely 🎉");
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="bottom"
        className="p-0 max-h-[92vh] h-[92vh] rounded-t-[2rem] border-0 bg-card overflow-hidden"
      >
        <div className="flex flex-col h-full">
          {/* Progress */}
          <div className="shrink-0 px-5 pt-5">
            <div className="absolute top-2 left-1/2 -translate-x-1/2 h-1.5 w-12 rounded-full bg-muted" />
            <div className="flex gap-1.5 mt-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-colors",
                    i <= step ? "bg-primary" : "bg-muted",
                  )}
                />
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 pt-6 pb-4">
            {step === 0 && (
              <div className="space-y-5 animate-fade-in">
                <header className="space-y-1">
                  <h2 className="font-display text-2xl font-bold">What's your name?</h2>
                  <p className="text-sm text-muted-foreground">
                    This is how the tribe will recognise you.
                  </p>
                </header>

                <div className="flex flex-col items-center gap-2">
                  <div className="relative">
                    <Avatar url={avatarUrl} seed={user?.id ?? "me"} sports={Array.from(sports)} size={88} />
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={uploadingAvatar}
                      aria-label="Add profile photo"
                      className="absolute -bottom-1 -right-1 grid place-items-center size-8 rounded-full bg-primary text-primary-foreground border-2 border-background shadow-soft"
                    >
                      {uploadingAvatar ? (
                        <Loader2 className="size-4 animate-spin" aria-hidden />
                      ) : (
                        <Camera className="size-4" aria-hidden />
                      )}
                    </button>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {avatarUrl ? "Change photo" : "Add a photo (optional)"}
                  </button>
                </div>

                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Lina"
                  maxLength={40}
                  autoFocus
                  className="w-full rounded-2xl bg-muted px-4 py-3.5 text-base font-display focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            )}

            {step === 1 && (
              <div className="space-y-5 animate-fade-in">
                <header className="space-y-1">
                  <h2 className="font-display text-2xl font-bold">What do you move with?</h2>
                  <p className="text-sm text-muted-foreground">
                    Pick your sports — we'll personalise your feed.
                  </p>
                </header>
                <div className="grid grid-cols-3 gap-2.5">
                  {CATEGORY_KEYS.map((k) => {
                    const cat = CATEGORIES[k];
                    const active = sports.has(k);
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => toggleSport(k)}
                        className={cn(
                          "relative flex flex-col items-center gap-1.5 rounded-2xl border p-3 transition-all",
                          active
                            ? "border-primary bg-primary/5 scale-[1.02]"
                            : "border-border bg-card hover:bg-muted/40",
                        )}
                        style={
                          active
                            ? { background: `hsl(var(${cat.tintVar}) / 0.12)`, borderColor: `hsl(var(${cat.tintVar}))` }
                            : undefined
                        }
                      >
                        <span className="text-2xl" aria-hidden>{cat.emoji}</span>
                        <span className="text-[11px] font-semibold leading-tight text-center">
                          {cat.label}
                        </span>
                        {active && (
                          <span
                            className="absolute top-1 right-1 grid place-items-center size-4 rounded-full bg-primary text-primary-foreground"
                          >
                            <Check className="size-2.5" strokeWidth={3} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5 animate-fade-in">
                <header className="space-y-1">
                  <h2 className="font-display text-2xl font-bold">Your level?</h2>
                  <p className="text-sm text-muted-foreground">
                    We'll match you with activities that fit.
                  </p>
                </header>
                <div className="space-y-2">
                  {LEVELS.map((l) => {
                    const active = level === l.key;
                    return (
                      <button
                        key={l.key}
                        type="button"
                        onClick={() => setLevel(l.key)}
                        className={cn(
                          "w-full flex items-center justify-between rounded-2xl border px-4 py-3.5 text-left transition-all",
                          active
                            ? "border-primary bg-primary/5"
                            : "border-border bg-card hover:bg-muted/40",
                        )}
                      >
                        <div>
                          <div className="font-display font-semibold text-sm">{l.label}</div>
                          <div className="text-xs text-muted-foreground">{l.description}</div>
                        </div>
                        {active && (
                          <span className="grid place-items-center size-6 rounded-full bg-primary text-primary-foreground">
                            <Check className="size-3.5" strokeWidth={3} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="shrink-0 px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] border-t border-border bg-card flex items-center gap-3">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep((s) => (s - 1) as 0 | 1 | 2)}
                className="rounded-full border border-border px-5 py-3 text-sm font-medium hover:bg-muted transition-colors"
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={handleNext}
              disabled={saving}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-primary text-primary-foreground py-3.5 text-sm font-semibold shadow-glow disabled:opacity-70 hover:scale-[1.01] active:scale-[0.99] transition-transform ease-bounce"
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : step === 2 ? (
                <>Finish</>
              ) : (
                <>
                  Continue <ArrowRight className="size-4" aria-hidden />
                </>
              )}
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
