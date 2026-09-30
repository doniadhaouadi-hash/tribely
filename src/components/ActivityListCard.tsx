import { CATEGORIES, type MockActivity } from "@/data/activities";
import { formatActivityTime } from "@/lib/format";
import { MapPin, Users } from "lucide-react";

type Props = {
  activity: MockActivity;
  onClick: () => void;
  badge?: string;
};

export const ActivityListCard = ({ activity, onClick, badge }: Props) => {
  const cat = CATEGORIES[activity.category];
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 rounded-2xl glass shadow-soft p-3 hover:bg-white/20 transition-colors text-left"
    >
      <div
        className="grid place-items-center size-12 rounded-2xl shrink-0 text-xl"
        style={{ background: `hsl(var(${cat.tintVar}) / 0.18)` }}
      >
        <span aria-hidden>{cat.emoji}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-display text-sm font-semibold truncate flex-1">
            {activity.title}
          </span>
          {badge && (
            <span className="rounded-full bg-primary/15 text-primary px-2 py-0.5 text-[10px] font-semibold shrink-0">
              {badge}
            </span>
          )}
        </div>
        <div className="text-xs text-muted-foreground flex items-center gap-3 mt-0.5">
          <span>{formatActivityTime(activity.startsAt)}</span>
          <span className="inline-flex items-center gap-1">
            <Users className="size-3" aria-hidden /> {activity.joined}/{activity.capacity}
          </span>
        </div>
        <div className="text-[11px] text-muted-foreground/80 truncate inline-flex items-center gap-1 mt-0.5">
          <MapPin className="size-3" aria-hidden /> {activity.address}
        </div>
      </div>
    </button>
  );
};
