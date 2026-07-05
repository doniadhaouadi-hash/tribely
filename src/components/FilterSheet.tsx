import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Check, RotateCcw, X, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SkillLevel } from "@/data/activities";

export type SortKey = "soonest" | "nearest" | "popular";

export type DiscoverFilters = {
  level: SkillLevel | "any";
  spontaneousOnly: boolean;
  withinHours: 0 | 6 | 24 | 72; // 0 = any time
  sort: SortKey;
};

export const DEFAULT_FILTERS: DiscoverFilters = {
  level: "any",
  spontaneousOnly: false,
  withinHours: 0,
  sort: "soonest",
};

const LEVELS: { key: DiscoverFilters["level"]; label: string }[] = [
  { key: "any", label: "Any" },
  { key: "casual", label: "Casual" },
  { key: "intermediate", label: "Intermediate" },
  { key: "committed", label: "Committed" },
];

const TIMES: { key: DiscoverFilters["withinHours"]; label: string }[] = [
  { key: 0, label: "Anytime" },
  { key: 6, label: "Next 6h" },
  { key: 24, label: "Today" },
  { key: 72, label: "3 days" },
];

const SORTS: { key: SortKey; label: string }[] = [
  { key: "soonest", label: "Soonest" },
  { key: "nearest", label: "Nearest" },
  { key: "popular", label: "Most joined" },
];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: DiscoverFilters;
  onChange: (next: DiscoverFilters) => void;
};

export const FilterSheet = ({ open, onOpenChange, value, onChange }: Props) => {
  const update = <K extends keyof DiscoverFilters>(k: K, v: DiscoverFilters[K]) =>
    onChange({ ...value, [k]: v });

  const reset = () => onChange(DEFAULT_FILTERS);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="p-0 max-h-[85vh] rounded-t-[2rem] border-0 bg-card overflow-hidden"
      >
        <div className="flex flex-col max-h-[85vh]">
          <header className="shrink-0 px-5 pt-5 pb-3 flex items-center justify-between border-b border-border relative">
            <div className="absolute top-2 left-1/2 -translate-x-1/2 h-1.5 w-12 rounded-full bg-muted" />
            <h2 className="font-display text-lg font-bold">Filters</h2>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              aria-label="Close"
              className="grid place-items-center size-9 rounded-full bg-muted hover:bg-muted/70 transition-colors"
            >
              <X className="size-4" aria-hidden />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
            <Group title="Level">
              <ChipRow
                items={LEVELS}
                isActive={(k) => value.level === k}
                onSelect={(k) => update("level", k)}
              />
            </Group>

            <Group title="When">
              <ChipRow
                items={TIMES}
                isActive={(k) => value.withinHours === k}
                onSelect={(k) => update("withinHours", k)}
              />
            </Group>

            <Group title="Sort by">
              <ChipRow
                items={SORTS}
                isActive={(k) => value.sort === k}
                onSelect={(k) => update("sort", k)}
              />
            </Group>

            <Group title="Vibe">
              <button
                type="button"
                onClick={() => update("spontaneousOnly", !value.spontaneousOnly)}
                className={cn(
                  "w-full flex items-center justify-between rounded-2xl border px-4 py-3 transition-all text-left",
                  value.spontaneousOnly
                    ? "border-accent bg-accent/10"
                    : "border-border bg-card hover:bg-muted/40",
                )}
              >
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "grid place-items-center size-9 rounded-full",
                    value.spontaneousOnly ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground",
                  )}>
                    <Zap className="size-4" aria-hidden strokeWidth={2.6} />
                  </span>
                  <div>
                    <div className="font-display text-sm font-semibold">Spontaneous only</div>
                    <div className="text-xs text-muted-foreground">Happening within hours</div>
                  </div>
                </div>
                {value.spontaneousOnly && (
                  <span className="grid place-items-center size-6 rounded-full bg-accent text-accent-foreground">
                    <Check className="size-3.5" strokeWidth={3} />
                  </span>
                )}
              </button>
            </Group>
          </div>

          <footer className="shrink-0 px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] border-t border-border bg-card flex items-center gap-3">
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-3 text-sm font-medium hover:bg-muted transition-colors"
            >
              <RotateCcw className="size-3.5" aria-hidden /> Reset
            </button>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex-1 rounded-full bg-primary text-primary-foreground py-3 text-sm font-semibold shadow-glow hover:scale-[1.01] active:scale-[0.99] transition-transform ease-bounce"
            >
              Show results
            </button>
          </footer>
        </div>
      </SheetContent>
    </Sheet>
  );
};

const Group = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="space-y-2.5">
    <h3 className="font-display text-xs font-bold uppercase tracking-wide text-muted-foreground">
      {title}
    </h3>
    {children}
  </section>
);

type ChipItem<T> = { key: T; label: string };

const ChipRow = <T extends string | number>({
  items,
  isActive,
  onSelect,
}: {
  items: ChipItem<T>[];
  isActive: (k: T) => boolean;
  onSelect: (k: T) => void;
}) => (
  <div className="flex flex-wrap gap-2">
    {items.map((it) => {
      const active = isActive(it.key);
      return (
        <button
          key={String(it.key)}
          type="button"
          onClick={() => onSelect(it.key)}
          className={cn(
            "rounded-full px-4 py-2 text-xs font-semibold transition-all",
            active
              ? "bg-foreground text-background scale-[1.03]"
              : "bg-muted text-muted-foreground hover:bg-muted/70",
          )}
        >
          {it.label}
        </button>
      );
    })}
  </div>
);

export const countActiveFilters = (f: DiscoverFilters) => {
  let n = 0;
  if (f.level !== "any") n++;
  if (f.spontaneousOnly) n++;
  if (f.withinHours !== 0) n++;
  if (f.sort !== "soonest") n++;
  return n;
};
