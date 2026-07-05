import type { LucideIcon } from "lucide-react";

type Props = {
  Icon: LucideIcon;
  title: string;
  phase: string;
  description?: string;
};

export const ComingSoon = ({ Icon, title, phase, description }: Props) => {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-20 gap-4">
      <div className="grid place-items-center size-20 rounded-full bg-muted">
        <Icon className="size-9 text-primary" aria-hidden strokeWidth={1.8} />
      </div>
      <div className="space-y-1.5">
        <h2 className="font-display text-2xl font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          {description ?? "We're warming up — this tab is on the way."}
        </p>
      </div>
      <span className="rounded-full bg-primary/15 text-foreground px-3 py-1 text-xs font-medium">
        Coming soon — {phase}
      </span>
    </div>
  );
};
