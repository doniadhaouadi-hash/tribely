import { cn } from "@/lib/utils";
import { CATEGORIES, type CategoryKey } from "@/data/activities";
import { Sparkles } from "lucide-react";

type Props = {
  active: CategoryKey | "all";
  onChange: (key: CategoryKey | "all") => void;
};

const ALL_KEYS = Object.keys(CATEGORIES) as CategoryKey[];

export const CategoryFilterRow = ({ active, onChange }: Props) => {
  return (
    <div className="-mx-4 px-4 overflow-x-auto scrollbar-hide">
      <div className="flex items-center gap-2 w-max">
        <Pill
          isActive={active === "all"}
          onClick={() => onChange("all")}
          icon={<Sparkles className="size-3.5 text-primary" aria-hidden />}
          label="All"
        />
        {ALL_KEYS.map((key) => {
          const cat = CATEGORIES[key];
          const isActive = active === key;
          return (
            <Pill
              key={key}
              isActive={isActive}
              onClick={() => onChange(key)}
              icon={<span aria-hidden>{cat.emoji}</span>}
              label={cat.label}
              activeStyle={{
                backgroundColor: `hsl(var(${cat.tintVar}) / 0.18)`,
                color: `hsl(var(${cat.tintVar}))`,
                borderColor: `hsl(var(${cat.tintVar}) / 0.3)`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

type PillProps = {
  isActive: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  activeStyle?: React.CSSProperties;
};

const Pill = ({ isActive, onClick, icon, label, activeStyle }: PillProps) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={isActive}
    style={isActive ? activeStyle : undefined}
    className={cn(
      "shrink-0 inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium transition-all duration-200 border border-transparent",
      isActive
        ? "bg-gradient-primary text-primary-foreground shadow-soft"
        : "glass text-foreground hover:bg-white/20",
    )}
  >
    {icon}
    {label}
  </button>
);
