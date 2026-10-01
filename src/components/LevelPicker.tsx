import { cn } from "@/lib/utils";
import type { PickableSkillLevel } from "@/lib/activitiesApi";

const OPTIONS: { key: PickableSkillLevel; label: string; hint: string }[] = [
  { key: "casual", label: "Casual", hint: "Everyone welcome" },
  { key: "intermediate", label: "Intermediate", hint: "Some experience" },
  { key: "committed", label: "Committed", hint: "Push the pace" },
];

type Props = {
  value: PickableSkillLevel;
  onChange: (next: PickableSkillLevel) => void;
};

/** Level picker for creating/editing an activity (matches the Discover level filter). */
export const LevelPicker = ({ value, onChange }: Props) => (
  <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Level">
    {OPTIONS.map((o) => {
      const active = o.key === value;
      return (
        <button
          key={o.key}
          type="button"
          role="radio"
          aria-checked={active}
          onClick={() => onChange(o.key)}
          className={cn(
            "rounded-2xl px-2 py-2.5 text-center transition-all",
            active
              ? "bg-foreground text-background shadow-soft"
              : "glass text-foreground hover:bg-white/20",
          )}
        >
          <span className="block text-xs font-semibold">{o.label}</span>
          <span className={cn("block text-[10px]", active ? "opacity-80" : "text-muted-foreground")}>
            {o.hint}
          </span>
        </button>
      );
    })}
  </div>
);
