import { ChevronDown, MapPin, Moon, Sun } from "lucide-react";
import { Link } from "react-router-dom";
import { useLocation } from "@/context/LocationContext";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { Avatar } from "@/components/Avatar";

export const StickyHeader = () => {
  const { city, openPicker } = useLocation();
  const { user, profile } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 glass rounded-none">
      <div className="max-w-md mx-auto flex items-center justify-between gap-2 px-4 py-3">
        {/* Left side shrinks (the city name truncates) so nothing overlaps on narrow phones (QA-038) */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={openPicker}
            aria-label="Change location"
            className="flex min-w-0 items-center gap-1.5 rounded-full glass px-3 py-1.5 text-xs font-medium text-foreground hover:bg-white/20 transition-colors"
          >
            <MapPin className="size-3.5 shrink-0 text-primary" aria-hidden />
            <span className="min-w-0 truncate max-w-[8rem]">
              {city.name}
              {city.countryCode ? `, ${city.countryCode}` : ""}
            </span>
            <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
          </button>
          <h1 className="shrink-0 font-display text-xl font-bold leading-none text-gradient-primary">
            Tribely.
          </h1>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="grid place-items-center size-10 rounded-full glass hover:bg-white/20 transition-colors"
          >
            {theme === "dark" ? (
              <Sun className="size-5 text-foreground" aria-hidden />
            ) : (
              <Moon className="size-5 text-foreground" aria-hidden />
            )}
          </button>

          {user ? (
            <Link
              to="/?tab=you"
              aria-label="Your profile"
              className="block rounded-full shadow-glow hover:scale-105 transition-transform ease-bounce"
            >
              <Avatar url={profile?.avatar_url} seed={user.id} sports={profile?.sports} size={36} />
            </Link>
          ) : (
            <Link
              to="/auth"
              className="whitespace-nowrap rounded-full bg-gradient-primary text-primary-foreground px-4 py-1.5 text-sm font-semibold shadow-glow hover:scale-105 transition-transform ease-bounce"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
