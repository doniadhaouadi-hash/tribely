import { useMemo, useState } from "react";
import { Flame, Loader2, MapPin, SlidersHorizontal, Sparkles } from "lucide-react";
import { useLocation } from "@/context/LocationContext";
import { useActivities } from "@/hooks/useActivities";
import { useAuth } from "@/context/AuthContext";
import type { CategoryKey, MockActivity } from "@/data/activities";
import { SearchBar } from "@/components/SearchBar";
import { CategoryFilterRow } from "@/components/CategoryFilterRow";
import { StatChipsRow } from "@/components/StatChipsRow";
import { ActivityCard } from "@/components/ActivityCard";
import { SpontaneousHeroCard } from "@/components/SpontaneousHeroCard";
import {
  DEFAULT_FILTERS,
  FilterSheet,
  countActiveFilters,
  type DiscoverFilters,
} from "@/components/FilterSheet";
import { distanceKm } from "@/lib/distance";

type Props = {
  onOpenActivity?: (a: MockActivity) => void;
  onSwitchToMap?: () => void;
  onHostClick?: () => void;
};

export const DiscoverTab = ({ onOpenActivity, onSwitchToMap, onHostClick }: Props) => {
  const { city } = useLocation();
  const { profile } = useAuth();
  const { activities, loading } = useActivities();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryKey | "all">("all");
  const [filters, setFilters] = useState<DiscoverFilters>(DEFAULT_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const nowMs = Date.now();
    const cutoffMs =
      filters.withinHours === 0 ? Infinity : nowMs + filters.withinHours * 3600_000;

    let list = activities
      .filter((a) => (category === "all" ? true : a.category === category))
      .filter((a) =>
        q.length === 0
          ? true
          : a.title.toLowerCase().includes(q) ||
            a.description.toLowerCase().includes(q) ||
            a.address.toLowerCase().includes(q),
      )
      .filter((a) => (filters.level === "any" ? true : a.skillLevel === filters.level))
      .filter((a) => (filters.spontaneousOnly ? a.spontaneous : true))
      .filter((a) => {
        const t = new Date(a.startsAt).getTime();
        return t >= nowMs - 30 * 60_000 && t <= cutoffMs;
      });

    // sort
    if (filters.sort === "nearest") {
      list = list
        .map((a) => ({ a, d: distanceKm(city.lat, city.lng, a.lat, a.lng) }))
        .sort((x, y) => x.d - y.d)
        .map((x) => x.a);
    } else if (filters.sort === "popular") {
      list = [...list].sort((a, b) => b.joined - a.joined);
    } else {
      list = [...list].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    }
    return list;
  }, [activities, category, query, filters, city.lat, city.lng]);

  const spontaneous = useMemo(
    () => filtered.find((a) => a.spontaneous),
    [filtered],
  );

  const upcoming = useMemo(
    () => (spontaneous ? filtered.filter((a) => a.id !== spontaneous.id) : filtered),
    [filtered, spontaneous],
  );

  const activeFilterCount = countActiveFilters(filters);

  return (
    <div className="space-y-5 pt-2">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <SearchBar value={query} onChange={setQuery} />
        </div>
        <button
          type="button"
          onClick={() => setFilterOpen(true)}
          aria-label="Filters"
          className="relative grid place-items-center size-12 rounded-full bg-muted hover:bg-muted/70 transition-colors shrink-0"
        >
          <SlidersHorizontal className="size-4 text-foreground" aria-hidden />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 grid place-items-center min-w-5 h-5 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold ring-2 ring-background">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      <CategoryFilterRow active={category} onChange={setCategory} />

      <StatChipsRow
        stats={[
          { Icon: MapPin,   label: "Nearby",  value: activities.length,                 tone: "primary" },
          { Icon: Flame,    label: "Streak",  value: `${profile?.streak_count ?? 0}d`,  tone: "accent" },
          { Icon: Sparkles, label: "Rating",  value: profile?.rating ? `${Number(profile.rating).toFixed(1)}★` : "—", tone: "primary" },
        ]}
      />

      {spontaneous && (
        <SpontaneousHeroCard activity={spontaneous} onClick={onOpenActivity} />
      )}

      <section className="space-y-3">
        <header className="flex items-center justify-between pt-1">
          <h2 className="font-display text-lg font-semibold">
            {filters.sort === "nearest"
              ? "Closest to you"
              : filters.sort === "popular"
              ? "Most joined"
              : "Happening soon"}
          </h2>
          {onSwitchToMap && (
            <button
              type="button"
              onClick={onSwitchToMap}
              className="text-xs font-medium text-primary hover:underline"
            >
              View map →
            </button>
          )}
        </header>

        {loading ? (
          <div className="py-12 grid place-items-center text-muted-foreground">
            <Loader2 className="size-6 animate-spin" aria-hidden />
          </div>
        ) : upcoming.length === 0 ? (
          <EmptyState category={category} onHostClick={onHostClick} />
        ) : (
          <div className="flex flex-col gap-3">
            {upcoming.map((a) => (
              <ActivityCard key={a.id} activity={a} onClick={onOpenActivity} />
            ))}
          </div>
        )}
      </section>

      <FilterSheet
        open={filterOpen}
        onOpenChange={setFilterOpen}
        value={filters}
        onChange={setFilters}
      />
    </div>
  );
};

const EmptyState = ({
  category,
  onHostClick,
}: {
  category: CategoryKey | "all";
  onHostClick?: () => void;
}) => (
  <div className="rounded-2xl bg-card border border-border shadow-soft p-8 text-center space-y-3">
    <div className="text-3xl" aria-hidden>🌱</div>
    <div className="space-y-1">
      <h3 className="font-display text-base font-semibold">
        {category === "all"
          ? "Be the first to host here!"
          : "No matches for this filter"}
      </h3>
      <p className="text-xs text-muted-foreground">
        {category === "all"
          ? "Your tribe is waiting to be assembled."
          : "Try a different category or clear your search."}
      </p>
    </div>
    <button
      type="button"
      onClick={onHostClick}
      className="rounded-full bg-primary text-primary-foreground px-5 py-2 text-sm font-semibold shadow-glow hover:scale-[1.02] transition-transform ease-bounce"
    >
      Host an activity
    </button>
  </div>
);
