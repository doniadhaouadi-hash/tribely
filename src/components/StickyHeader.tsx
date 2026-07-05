import { Bell, ChevronDown, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { useLocation } from "@/context/LocationContext";
import { useAuth } from "@/context/AuthContext";

export const StickyHeader = () => {
  const { city } = useLocation();
  const { user, profile } = useAuth();

  const initial =
    profile?.display_name?.trim()?.[0]?.toUpperCase() ??
    user?.email?.[0]?.toUpperCase() ??
    "T";

  return (
    <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-xl border-b border-border">
      <div className="max-w-md mx-auto flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            aria-label="Change location"
            className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/70 transition-colors"
          >
            <MapPin className="size-3.5 text-primary" aria-hidden />
            <span className="truncate max-w-[8rem]">
              {city.name}, {city.countryCode}
            </span>
            <ChevronDown className="size-3.5 text-muted-foreground" aria-hidden />
          </button>
          <h1 className="font-display text-xl font-bold leading-none">
            Tribely<span className="text-primary">.</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Notifications"
            className="relative grid place-items-center size-9 rounded-full hover:bg-muted transition-colors"
          >
            <Bell className="size-5 text-foreground" aria-hidden />
          </button>

          {user ? (
            <Link
              to="/?tab=you"
              aria-label="Your profile"
              className="grid place-items-center size-9 rounded-full bg-primary text-primary-foreground font-semibold text-sm shadow-glow hover:scale-105 transition-transform ease-bounce overflow-hidden"
            >
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                <span>{initial}</span>
              )}
            </Link>
          ) : (
            <Link
              to="/auth"
              className="rounded-full bg-secondary text-secondary-foreground px-4 py-1.5 text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
