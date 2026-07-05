import { CATEGORIES, dicebearAvatar, type MockActivity } from "@/data/activities";
import { Zap, Clock, MapPin } from "lucide-react";
import { formatActivityTime } from "@/lib/format";

type Props = {
  activity: MockActivity;
  onClick?: (a: MockActivity) => void;
};

/** Hero card highlighting a spontaneous activity (Coral pulse). */
export const SpontaneousHeroCard = ({ activity, onClick }: Props) => {
  const cat = CATEGORIES[activity.category];
  return (
    <button
      type="button"
      onClick={() => onClick?.(activity)}
      className="relative w-full text-left rounded-2xl overflow-hidden p-5 shadow-float transition-transform duration-300 ease-smooth hover:-translate-y-0.5"
      style={{
        background:
          "linear-gradient(135deg, hsl(var(--accent)) 0%, hsl(14 90% 50%) 70%, hsl(var(--secondary)) 130%)",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5 text-accent-foreground">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-card/95 backdrop-blur px-2.5 py-1 text-[11px] font-semibold text-accent">
            <Zap className="size-3" strokeWidth={2.8} aria-hidden />
            Happening soon
          </span>
          <h3 className="font-display text-xl font-bold leading-tight pr-2">
            {activity.title}
          </h3>
          <div className="flex items-center gap-3 text-xs text-accent-foreground/90">
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" aria-hidden />
              {formatActivityTime(activity.startsAt)}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" aria-hidden />
              <span className="truncate max-w-[10rem]">{activity.address}</span>
            </span>
          </div>
        </div>

        <div className="relative shrink-0">
          <span
            className="absolute inset-0 rounded-full animate-pulse-ring"
            aria-hidden
          />
          <div className="grid place-items-center size-14 rounded-full bg-card text-2xl">
            <span aria-hidden>{cat.emoji}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex -space-x-2">
          <img
            src={dicebearAvatar(activity.host.avatarSeed)}
            alt={`${activity.host.displayName} avatar`}
            className="size-8 rounded-full ring-2 ring-card bg-muted"
          />
          <div className="size-8 rounded-full ring-2 ring-card bg-card/40 backdrop-blur grid place-items-center text-[11px] font-semibold text-accent-foreground">
            +{Math.max(0, activity.joined - 1)}
          </div>
        </div>
        <span className="rounded-full bg-card text-foreground px-3 py-1.5 text-xs font-semibold">
          {activity.capacity - activity.joined} spots left →
        </span>
      </div>
    </button>
  );
};
