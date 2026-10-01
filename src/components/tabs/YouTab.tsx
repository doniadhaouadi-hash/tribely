import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, Camera, Flame, Heart, Loader2, LogOut, Sparkles, Star, Trophy, User } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { ActivityListCard } from "@/components/ActivityListCard";
import { ActivityDetailSheet } from "@/components/ActivityDetailSheet";
import { OnboardingSheet } from "@/components/OnboardingSheet";
import { Avatar } from "@/components/Avatar";
import { fetchFavoriteActivities, fetchMyActivities, type MyActivitiesBuckets } from "@/lib/myActivitiesApi";
import { supabase } from "@/integrations/supabase/client";
import { uploadImage, UploadError } from "@/lib/uploadImage";
import type { MockActivity } from "@/data/activities";
import { cn } from "@/lib/utils";
import { errorMessage } from "@/lib/errors";
import { LoadError } from "@/components/LoadError";
import { dismissOnboarding, isOnboardingDismissed } from "@/lib/onboardingDismissal";

type Tab = "upcoming" | "hosted" | "past" | "favorites";

const TABS: { key: Tab; label: string }[] = [
  { key: "upcoming", label: "Upcoming" },
  { key: "hosted", label: "Hosted" },
  { key: "past", label: "Past" },
  { key: "favorites", label: "Favorites" },
];

export const YouTab = () => {
  const { user, profile, loading, signOut, refreshProfile } = useAuth();
  const [buckets, setBuckets] = useState<MyActivitiesBuckets>({ upcoming: [], hosted: [], past: [] });
  const [favorites, setFavorites] = useState<MockActivity[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [tab, setTab] = useState<Tab>("upcoming");
  const [active, setActive] = useState<MockActivity | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;
    setUploadingAvatar(true);
    try {
      const url = await uploadImage(file, "avatars", user.id);
      const { error } = await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id);
      if (error) throw error;
      await refreshProfile();
      toast.success("Profile photo updated");
    } catch (err) {
      toast.error(err instanceof UploadError ? err.message : "Couldn't upload photo");
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Auto-prompt onboarding for fresh users, unless they dismissed it this session
  useEffect(() => {
    if (user && profile && !profile.onboarded && !isOnboardingDismissed(user.id)) {
      setShowOnboarding(true);
    }
  }, [user, profile]);

  const closeOnboarding = () => {
    setShowOnboarding(false);
    if (user) dismissOnboarding(user.id);
  };

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const load = async () => {
      setLoadingData(true);
      try {
        const [b, f] = await Promise.all([
          fetchMyActivities(user.id),
          fetchFavoriteActivities(user.id),
        ]);
        if (!cancelled) {
          setBuckets(b);
          setFavorites(f);
          setDataError(null);
        }
      } catch (e) {
        if (!cancelled) setDataError(errorMessage(e, "Failed to load your activities"));
      } finally {
        if (!cancelled) setLoadingData(false);
      }
    };
    load();

    const channel = supabase
      .channel(`my-activities-${user.id}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "activity_participants", filter: `user_id=eq.${user.id}` },
        () => load(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "favorites", filter: `user_id=eq.${user.id}` },
        () => load(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "activities" },
        () => load(),
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user, reloadKey]);

  if (loading) {
    return <div className="pt-12 text-center text-sm text-muted-foreground">Loading…</div>;
  }

  if (!user) {
    return (
      <div className="pt-10 flex flex-col items-center text-center gap-5 px-2">
        <div className="grid place-items-center size-20 rounded-full bg-muted">
          <User className="size-9 text-muted-foreground" aria-hidden />
        </div>
        <div className="space-y-1">
          <h2 className="font-display text-2xl font-bold">Join Tribely</h2>
          <p className="text-sm text-muted-foreground max-w-xs">
            Sign in to host activities, save favorites and track your streak.
          </p>
        </div>
        <Link
          to="/auth"
          className="rounded-full bg-primary text-primary-foreground px-6 py-3 text-sm font-semibold shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-transform ease-bounce"
        >
          Sign in or sign up
        </Link>
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out");
  };

  const list =
    tab === "upcoming" ? buckets.upcoming :
    tab === "hosted" ? buckets.hosted :
    tab === "past" ? buckets.past :
    favorites;

  const emptyCopy: Record<Tab, { icon: typeof Calendar; title: string; sub: string }> = {
    upcoming: { icon: Calendar, title: "Nothing on the schedule", sub: "Discover something to join." },
    hosted: { icon: Trophy, title: "No hosted activities yet", sub: "Tap the + to host your first one." },
    past: { icon: Calendar, title: "No past activities", sub: "Your history will appear here." },
    favorites: { icon: Heart, title: "No favorites yet", sub: "Tap the heart on an activity to save it." },
  };

  return (
    <>
      <div className="space-y-6 pt-2">
        {/* Profile header */}
        <section className="rounded-2xl glass-strong shadow-soft p-5 flex items-center gap-4">
          <div className="relative shrink-0">
            <Avatar
              url={profile?.avatar_url}
              seed={user.id}
              sports={profile?.sports}
              size={64}
            />
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
              aria-label="Change profile photo"
              className="absolute -bottom-1 -right-1 grid place-items-center size-7 rounded-full bg-primary text-primary-foreground border-2 border-background shadow-soft"
            >
              {uploadingAvatar ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
              ) : (
                <Camera className="size-3.5" aria-hidden />
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
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-xl font-bold truncate">
              {profile?.display_name || "Athlete"}
            </h2>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            <span className="inline-flex items-center mt-1.5 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground capitalize">
              {profile?.level ?? "beginner"}
            </span>
          </div>
        </section>

        {/* Onboarding nudge */}
        {profile && !profile.onboarded && (
          <button
            type="button"
            onClick={() => setShowOnboarding(true)}
            className="w-full rounded-2xl bg-gradient-primary text-primary-foreground p-4 flex items-center gap-3 text-left shadow-glow hover:scale-[1.01] active:scale-[0.99] transition-transform ease-bounce"
          >
            <div className="grid place-items-center size-10 rounded-full bg-primary-foreground/15 shrink-0">
              <Sparkles className="size-5" aria-hidden />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-display font-bold text-sm">Complete your profile</div>
              <div className="text-xs opacity-90">Pick your sports — get a feed that fits.</div>
            </div>
          </button>
        )}

        {/* Stats */}
        <section className="grid grid-cols-3 gap-3">
          <Stat icon={Flame} label="Streak" value={profile?.streak_count ?? 0} />
          {/* profiles.hosted_count is never maintained; count the real hosted activities. */}
          <Stat icon={Trophy} label="Hosted" value={buckets.hosted.length} />
          <Stat
            icon={Star}
            label="Rating"
            value={profile?.rating ? Number(profile.rating).toFixed(1) : "—"}
          />
        </section>

        {/* My Activities */}
        <section className="space-y-3">
          <h3 className="font-display text-sm font-bold uppercase tracking-wide text-muted-foreground px-1">
            My activities
          </h3>
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide -mx-1 px-1">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={cn(
                  "shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors",
                  tab === t.key
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground hover:bg-muted/70",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="space-y-2 min-h-[120px]">
            {loadingData ? (
              <div className="grid place-items-center py-8 text-muted-foreground">
                <Loader2 className="size-5 animate-spin" />
              </div>
            ) : dataError ? (
              <LoadError
                title="Couldn't load your activities"
                message={dataError}
                onRetry={() => setReloadKey((k) => k + 1)}
              />
            ) : list.length === 0 ? (
              <EmptyState {...emptyCopy[tab]} />
            ) : (
              list.map((a) => (
                <ActivityListCard
                  key={a.id}
                  activity={a}
                  onClick={() => setActive(a)}
                  badge={tab === "hosted" ? "Host" : undefined}
                />
              ))
            )}
          </div>
        </section>

        <button
          type="button"
          onClick={handleSignOut}
          className="w-full inline-flex items-center justify-center gap-2 rounded-full glass px-4 py-3 text-sm font-medium text-foreground hover:bg-white/20 transition-colors"
        >
          <LogOut className="size-4" aria-hidden />
          Sign out
        </button>
      </div>

      <ActivityDetailSheet
        activity={active}
        onOpenChange={(o) => !o && setActive(null)}
      />
      <OnboardingSheet
        open={showOnboarding}
        onClose={closeOnboarding}
      />
    </>
  );
};

const Stat = ({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Flame;
  label: string;
  value: string | number;
}) => (
  <div className="rounded-2xl glass shadow-soft p-3 flex flex-col items-center gap-1">
    <Icon className="size-4 text-primary" aria-hidden />
    <span className="font-display text-lg font-bold leading-none">{value}</span>
    <span className="text-[11px] text-muted-foreground">{label}</span>
  </div>
);

const EmptyState = ({
  icon: Icon,
  title,
  sub,
}: {
  icon: typeof Calendar;
  title: string;
  sub: string;
}) => (
  <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-8 flex flex-col items-center text-center gap-2">
    <Icon className="size-6 text-muted-foreground" aria-hidden />
    <div className="font-display text-sm font-semibold">{title}</div>
    <div className="text-xs text-muted-foreground max-w-[220px]">{sub}</div>
  </div>
);
