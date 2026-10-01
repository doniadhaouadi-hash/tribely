import { pickAvatarEmoji } from "@/lib/avatarFallback";
import { cn } from "@/lib/utils";

type Props = {
  url?: string | null;
  seed: string;
  sports?: string[] | null;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
};

/** Shows a real photo when available, else a Tribely-themed emoji on a gradient circle. */
export const Avatar = ({ url, seed, sports, size = 40, className, style }: Props) => {
  if (url) {
    return (
      <img
        src={url}
        alt=""
        loading="lazy"
        className={cn("rounded-full object-cover shrink-0", className)}
        style={{ width: size, height: size, ...style }}
      />
    );
  }
  return (
    <div
      aria-hidden="true"
      className={cn("rounded-full grid place-items-center bg-gradient-primary shrink-0", className)}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.48), ...style }}
    >
      {pickAvatarEmoji(seed, sports)}
    </div>
  );
};
