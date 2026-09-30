import type { LucideIcon } from "lucide-react";

type Stat = {
  Icon: LucideIcon;
  label: string;
  value: string | number;
  tone?: "primary" | "accent" | "muted";
};

type Props = {
  stats: [Stat, Stat, Stat];
};

export const StatChipsRow = ({ stats }: Props) => {
  return (
    <div className="grid grid-cols-3 gap-2">
      {stats.map(({ Icon, label, value, tone = "primary" }, i) => {
        const toneCls =
          tone === "accent" ? "text-accent" : tone === "muted" ? "text-muted-foreground" : "text-primary";
        return (
          <div
            key={i}
            className="rounded-xl glass px-3 py-2.5 flex flex-col items-start gap-1"
          >
            <Icon className={`size-4 ${toneCls}`} aria-hidden strokeWidth={2.4} />
            <div className="leading-tight">
              <div className="text-sm font-display font-semibold">{value}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
