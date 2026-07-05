import { CATEGORIES, dicebearAvatar, type MockActivity } from "@/data/activities";
import { Clock, MapPin, Users, X, Zap } from "lucide-react";
import { formatActivityTime } from "@/lib/format";

type Props = {
  activity: MockActivity;
  onOpen: () => void;
  onClose: () => void;
};

export const ActivityPreviewCard = ({ activity, onOpen, onClose }: Props) => {
  const cat = CATEGORIES[activity.category];
  const tint = `hsl(var(${cat.tintVar}))`;

  return (
    <div className="relative rounded-2xl bg-card border border-border shadow-float overflow-hidden">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close preview"
        className="absolute top-2 right-2 z-10 grid place-items-center size-8 rounded-full bg-muted hover:bg-card transition-colors"
      >
        <X className="size-4 text-muted-foreground" aria-hidden />
      </button>

      <button
        type="button"
        onClick={onOpen}
        className="w-full text-left flex gap-3 p-3 pr-10"
      >
        <div
          className="grid place-items-center size-14 shrink-0 rounded-2xl text-2xl"
          style={{ background: `linear-gradient(135deg, ${tint}, hsl(var(--secondary)))` }}
        >
          <span aria-hidden>{cat.emoji}</span>
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-1.5">
            <h3 className="font-display text-sm font-semibold leading-tight truncate">
              {activity.title}
            </h3>
            {activity.spontaneous && (
              <Zap className="size-3.5 text-accent shrink-0" aria-hidden strokeWidth={2.6} />
            )}
          </div>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3" aria-hidden />
              {formatActivityTime(activity.startsAt)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="size-3" aria-hidden />
              {activity.joined}/{activity.capacity}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <MapPin className="size-3" aria-hidden />
            <span className="truncate">{activity.address}</span>
          </div>
        </div>

        <img
          src={dicebearAvatar(activity.host.avatarSeed)}
          alt={`${activity.host.displayName} avatar`}
          className="size-9 rounded-full self-end mb-1"
        />
      </button>

      <div className="px-3 pb-3">
        <button
          type="button"
          onClick={onOpen}
          className="w-full rounded-full bg-primary text-primary-foreground py-2.5 text-sm font-semibold shadow-glow hover:scale-[1.01] active:scale-[0.99] transition-transform ease-bounce"
        >
          See details
        </button>
      </div>
    </div>
  );
};
