import { useLocation as useRouterLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Compass } from "lucide-react";

const NotFound = () => {
  const location = useRouterLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center gap-6">
      <div className="grid place-items-center size-20 rounded-full bg-muted">
        <Compass className="size-9 text-primary" aria-hidden />
      </div>
      <div className="space-y-2">
        <h1 className="font-display text-5xl font-bold">404</h1>
        <p className="text-muted-foreground">Looks like your tribe isn't here.</p>
      </div>
      <Link
        to="/"
        className="rounded-full bg-primary text-primary-foreground px-6 py-3 text-sm font-semibold shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-transform ease-bounce"
      >
        Back to Discover
      </Link>
    </div>
  );
};

export default NotFound;
