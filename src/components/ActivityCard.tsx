import { CATEGORIES, type CategoryKey, type MockActivity, dicebearAvatar } from "@/data/activities";
import { Clock, MapPin, Users, Zap } from "lucide-react";
import { formatActivityTime } from "@/lib/format";

type Props = {
  activity: MockActivity;
  onClick?: (a: MockActivity) => void;
};

export const ActivityCard = ({ activity, onClick }: Props) => {
  const cat = CATEGORIES[activity.category];
  const tint = `hsl(var(${cat.tintVar}))`;
  const tintSoft = `hsl(var(${cat.tintVar}) / 0.12)`;

  return (
    <button
      type="button"
      onClick={() => onClick?.(activity)}
      className="group w-full text-left rounded-2xl glass shadow-soft overflow-hidden transition-all duration-300 ease-smooth hover:shadow-float hover:-translate-y-0.5 active:scale-[0.99]"
    >
      {/* Banner — category gradient */}
      <div
        className="relative h-24 overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${tint}, hsl(var(--secondary)))`,
        }}
      >
        <div
          aria-hidden
          className="absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(120% 80% at 0% 0%, hsl(0 0% 100% / 0.2), transparent 60%)",
          }}
        />
        <div className="relative flex items-start justify-between p-3">
          <span
            className="rounded-full bg-card/95 backdrop-blur px-2.5 py-1 text-[11px] font-semibold flex items-center gap-1.5"
            style={{ color: tint }}
          >
            <span aria-hidden>{cat.emoji}</span>
            {cat.label}
          </span>
          {activity.spontaneous && (
            <span className="rounded-full bg-accent text-accent-foreground px-2.5 py-1 text-[11px] font-semibold flex items-center gap-1 animate-pulse-ring">
              <Zap className="size-3" aria-hidden strokeWidth={2.6} />
              Spontaneous
            </span>
          )}
        </div>
        <div className="absolute bottom-2 right-3 text-[11px] font-medium text-secondary-foreground/90">
          {activity.skillLevel === "all" ? "All levels" : activity.skillLevel}
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        <div className="space-y-1">
          <h3 className="font-display text-lg font-semibold leading-tight line-clamp-1">
            {activity.title}
          </h3>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3.5" aria-hidden />
            <span className="truncate">{activity.address}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" aria-hidden />
              {formatActivityTime(activity.startsAt)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="size-3.5" aria-hidden />
              {activity.joined}/{activity.capacity}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <img
              src={dicebearAvatar(activity.host.avatarSeed)}
              alt={`${activity.host.displayName} avatar`}
              className="size-7 rounded-full bg-muted ring-2"
              style={{ boxShadow: `inset 0 0 0 2px ${tintSoft}` }}
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </button>
  );
};
