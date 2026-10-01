import { useEffect, useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { CATEGORIES, type MockActivity } from "@/data/activities";
import { Avatar } from "@/components/Avatar";
import {
  CalendarPlus,
  Check,
  Clock,
  Heart,
  Loader2,
  LogIn,
  MapPin,
  Share2,
  Star,
  Users,
  X,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";
import { formatActivityTime } from "@/lib/format";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import {
  fetchParticipants,
  joinActivity,
  leaveActivity,
  type ParticipantWithProfile,
} from "@/lib/activitiesApi";
import { useUserRSVPs } from "@/hooks/useUserRSVPs";
import { useFavorites } from "@/hooks/useFavorites";
import { downloadIcs } from "@/lib/calendar";
import { shareActivity } from "@/lib/share";

type Props = {
  activity: MockActivity | null;
  onOpenChange: (open: boolean) => void;
};

export const ActivityDetailSheet = ({ activity, onOpenChange }: Props) => {
  const { user } = useAuth();
  const { joinedIds, refresh: refreshRSVPs } = useUserRSVPs();
  const { favoriteIds, toggle: toggleFavorite } = useFavorites();
  const [participants, setParticipants] = useState<ParticipantWithProfile[]>([]);
  const [loadingParts, setLoadingParts] = useState(false);
  const [acting, setActing] = useState(false);
  const favorited = !!activity && favoriteIds.has(activity.id);

  const open = !!activity;
  const cat = activity ? CATEGORIES[activity.category] : null;
  const tint = cat ? `hsl(var(${cat.tintVar}))` : "transparent";
  const isJoined = !!activity && joinedIds.has(activity.id);
  const isHost = !!activity && !!user && user.id === activity.host.id;

  useEffect(() => {
    if (!activity) {
      setParticipants([]);
      return;
    }
    setLoadingParts(true);
    fetchParticipants(activity.id)
      .then(setParticipants)
      .finally(() => setLoadingParts(false));
  }, [activity?.id, activity?.joined]);

  const handleJoin = async () => {
    if (!activity || !user) return;
    setActing(true);
    try {
      if (isJoined) {
        await leaveActivity(activity.id, user.id);
        toast("You left the activity", {
          description: "Your spot is back in the pool.",
        });
      } else {
        if (activity.joined >= activity.capacity) {
          toast.error("This activity is full");
          return;
        }
        await joinActivity(activity.id, user.id);
        toast.success("You're in 🎉", { description: activity.title });
      }
      await refreshRSVPs();
      const next = await fetchParticipants(activity.id);
      setParticipants(next);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    } finally {
      setActing(false);
    }
  };

  const handleFavorite = async () => {
    if (!user) {
      toast("Sign in to save favorites");
      return;
    }
    if (!activity) return;
    await toggleFavorite(activity.id);
    toast(favorited ? "Removed from favorites" : "Saved to favorites ❤️");
  };
  const handleShare = async () => {
    if (!activity) return;
    const result = await shareActivity(activity);
    if (result === "shared") return; // native sheet handled it
    if (result === "copied") toast.success("Link copied to clipboard 🔗");
    else if (result === "failed") toast.error("Couldn't share — try again");
  };
  const handleCalendar = () => {
    if (!activity) return;
    downloadIcs(activity);
    toast.success("Added to your calendar 📅");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="p-0 max-h-[90vh] rounded-t-[2rem] border-0 bg-card overflow-hidden"
      >
        {activity && cat && (
          <div className="relative flex flex-col max-h-[90vh]">
            {/* Hero */}
            <div
              className="relative h-44 shrink-0"
              style={
                activity.coverUrl
                  ? undefined
                  : { background: `linear-gradient(135deg, ${tint} 0%, hsl(var(--secondary)) 130%)` }
              }
            >
              {activity.coverUrl ? (
                <>
                  <img src={activity.coverUrl} alt="" className="absolute inset-0 size-full object-cover" />
                  <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/5" />
                </>
              ) : (
                <div
                  aria-hidden
                  className="absolute inset-0"
                  style={{
                    background:
                      "radial-gradient(120% 80% at 0% 0%, hsl(0 0% 100% / 0.25), transparent 60%)",
                  }}
                />
              )}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 h-1.5 w-12 rounded-full bg-card/40" />

              <button
                type="button"
                onClick={() => onOpenChange(false)}
                aria-label="Close"
                className="absolute top-3 right-3 grid place-items-center size-9 rounded-full bg-card/95 hover:bg-card transition-colors"
              >
                <X className="size-4 text-foreground" aria-hidden />
              </button>

              <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-3">
                <div className="space-y-1.5">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full bg-card/95 backdrop-blur px-2.5 py-1 text-[11px] font-semibold"
                    style={{ color: tint }}
                  >
                    <span aria-hidden>{cat.emoji}</span>
                    {cat.label}
                  </span>
                  {activity.spontaneous && (
                    <span className="block w-fit rounded-full bg-accent text-accent-foreground px-2.5 py-1 text-[11px] font-semibold inline-flex items-center gap-1">
                      <Zap className="size-3" aria-hidden strokeWidth={2.6} />
                      Spontaneous
                    </span>
                  )}
                </div>
                <span className="rounded-full bg-card/95 text-foreground px-3 py-1 text-[11px] font-semibold">
                  {activity.skillLevel === "all" ? "All levels" : activity.skillLevel}
                </span>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 pt-5 pb-6 space-y-6">
              <header className="space-y-2">
                <h2 className="font-display text-2xl font-bold leading-tight">
                  {activity.title}
                </h2>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="size-4" aria-hidden />
                    {formatActivityTime(activity.startsAt)} · {activity.durationMinutes}m
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-4" aria-hidden />
                    {activity.address}
                  </span>
                </div>
              </header>

              {/* Host */}
              <section className="rounded-2xl glass p-3 flex items-center gap-3">
                <Avatar url={activity.host.avatarUrl} seed={activity.host.avatarSeed} size={48} />
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Hosted by {isHost && <span className="text-primary">· You</span>}
                  </div>
                  <div className="font-display text-sm font-semibold truncate">
                    {activity.host.displayName}
                  </div>
                </div>
                <div className="inline-flex items-center gap-1 rounded-full bg-card border border-border px-2.5 py-1 text-xs font-semibold">
                  <Star className="size-3.5 text-accent fill-accent" aria-hidden />
                  {activity.host.rating.toFixed(1)}
                </div>
              </section>

              {activity.description && (
                <section className="space-y-2">
                  <h3 className="font-display text-sm font-semibold">About</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {activity.description}
                  </p>
                </section>
              )}

              {/* Participants */}
              <section className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-sm font-semibold">Tribe</h3>
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Users className="size-3.5" aria-hidden />
                    {activity.joined}/{activity.capacity} joined
                  </span>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1 py-1">
                  {loadingParts && participants.length === 0 ? (
                    <div className="text-xs text-muted-foreground py-2">Loading…</div>
                  ) : (
                    <>
                      {participants.map((p) => (
                        <div
                          key={p.user_id}
                          className="flex flex-col items-center gap-1 shrink-0 w-14"
                        >
                          <Avatar url={p.avatar_url} seed={p.user_id} size={48} className="ring-2 ring-card" />
                          <span className="text-[10px] text-muted-foreground truncate w-full text-center">
                            {p.display_name.split(" ")[0]}
                          </span>
                        </div>
                      ))}
                      {Array.from({
                        length: Math.max(0, activity.capacity - participants.length),
                      }).map((_, i) => (
                        <div
                          key={`empty-${i}`}
                          className="flex flex-col items-center gap-1 shrink-0 w-14"
                        >
                          <div className="size-12 rounded-full border-2 border-dashed border-border grid place-items-center text-muted-foreground">
                            +
                          </div>
                          <span className="text-[10px] text-muted-foreground">Open</span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </section>

              <section className="grid grid-cols-3 gap-2">
                <ActionTile
                  Icon={Heart}
                  label="Favorite"
                  onClick={handleFavorite}
                  active={favorited}
                  activeColor="text-accent"
                />
                <ActionTile Icon={CalendarPlus} label="Calendar" onClick={handleCalendar} />
                <ActionTile Icon={Share2} label="Share" onClick={handleShare} />
              </section>
            </div>

            {/* Sticky CTA */}
            <div className="shrink-0 px-5 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))] border-t border-border bg-card">
              {!user ? (
                <Link
                  to="/auth"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-gradient-primary text-primary-foreground py-3.5 text-sm font-semibold shadow-glow"
                >
                  <LogIn className="size-4" aria-hidden /> Sign in to join
                </Link>
              ) : isHost ? (
                <div className="w-full text-center text-xs text-muted-foreground py-2">
                  You're the host — manage from the You tab (Phase 5).
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleJoin}
                  disabled={acting}
                  className={cn(
                    "w-full inline-flex items-center justify-center gap-2 rounded-full py-3.5 text-sm font-semibold transition-transform ease-bounce hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70",
                    isJoined
                      ? "glass text-foreground"
                      : "bg-gradient-primary text-primary-foreground shadow-glow",
                  )}
                >
                  {acting ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  ) : isJoined ? (
                    <>
                      <Check className="size-4" aria-hidden /> You're in — leave?
                    </>
                  ) : (
                    <>Join activity</>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

type ActionTileProps = {
  Icon: typeof Heart;
  label: string;
  onClick: () => void;
  active?: boolean;
  activeColor?: string;
};

const ActionTile = ({
  Icon,
  label,
  onClick,
  active,
  activeColor = "text-primary",
}: ActionTileProps) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={cn(
      "rounded-2xl glass hover:bg-white/20 px-3 py-3 flex flex-col items-center gap-1.5 transition-colors",
      active && "bg-white/20",
    )}
  >
    <Icon
      className={cn("size-5", active ? activeColor : "text-foreground")}
      aria-hidden
      fill={active && activeColor.includes("accent") ? "currentColor" : "none"}
      strokeWidth={2.2}
    />
    <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
  </button>
);
