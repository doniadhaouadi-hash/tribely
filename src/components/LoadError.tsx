import { RotateCw, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  title?: string;
  message?: string | null;
  onRetry?: () => void;
  className?: string;
};

/** Error state with a retry button, shown when data couldn't be loaded. */
export const LoadError = ({
  title = "Couldn't load activities",
  message,
  onRetry,
  className,
}: Props) => (
  <div
    role="alert"
    className={cn(
      "rounded-2xl glass-strong shadow-soft p-6 text-center flex flex-col items-center gap-3",
      className,
    )}
  >
    <div className="grid place-items-center size-12 rounded-full bg-destructive/15">
      <WifiOff className="size-5 text-destructive" aria-hidden />
    </div>
    <div className="space-y-1">
      <h3 className="font-display text-base font-semibold">{title}</h3>
      <p className="text-xs text-muted-foreground max-w-xs">
        Check your connection and try again.
        {message ? <span className="block mt-1 opacity-80">{message}</span> : null}
      </p>
    </div>
    {onRetry && (
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-5 py-2 text-sm font-semibold shadow-glow hover:scale-[1.02] transition-transform ease-bounce"
      >
        <RotateCw className="size-3.5" aria-hidden /> Try again
      </button>
    )}
  </div>
);
