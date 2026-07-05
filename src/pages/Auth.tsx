import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

const emailSchema = z.string().trim().email("Enter a valid email").max(255);
const passwordSchema = z.string().min(8, "At least 8 characters").max(72);
const nameSchema = z.string().trim().min(1, "Required").max(60);

type Mode = "signin" | "signup";

const Auth = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [submitting, setSubmitting] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  if (!loading && user) return <Navigate to="/?tab=discover" replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const emailV = emailSchema.parse(email);
      const passV = passwordSchema.parse(password);

      if (mode === "signup") {
        const nameV = nameSchema.parse(name);
        const { error } = await supabase.auth.signUp({
          email: emailV,
          password: passV,
          options: {
            emailRedirectTo: `${window.location.origin}/?tab=discover`,
            data: { display_name: nameV },
          },
        });
        if (error) throw error;
        toast.success("Welcome to Tribely!", {
          description: "Check your inbox to confirm your email.",
        });
        navigate("/?tab=discover");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: emailV,
          password: passV,
        });
        if (error) throw error;
        toast.success("Welcome back");
        navigate("/?tab=discover");
      }
    } catch (err) {
      const msg =
        err instanceof z.ZodError
          ? err.errors[0]?.message ?? "Invalid input"
          : err instanceof Error
            ? err.message
            : "Something went wrong";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setOauthLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/?tab=discover`,
        },
      });
      if (error) {
        toast.error("Google sign-in failed");
        setOauthLoading(false);
      }
      // On success Supabase redirects the browser to Google; nothing more to do here.
    } catch {
      toast.error("Google sign-in failed");
      setOauthLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="max-w-md w-full mx-auto px-4 py-4">
        <Link
          to="/"
          aria-label="Back"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back
        </Link>
      </header>

      <main className="flex-1 max-w-md w-full mx-auto px-4 pb-12 flex flex-col justify-center gap-8">
        <div className="text-center space-y-2">
          <h1 className="font-display text-4xl font-bold leading-tight">
            Tribely<span className="text-primary">.</span>
          </h1>
          <p className="text-muted-foreground text-sm">Find your tribe. Move together.</p>
        </div>

        <div className="rounded-2xl bg-card shadow-soft p-6 space-y-5">
          <div className="grid grid-cols-2 rounded-full bg-muted p-1 text-sm font-medium">
            {(["signin", "signup"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`rounded-full px-4 py-2 transition-colors ${
                  mode === m
                    ? "bg-card text-foreground shadow-soft"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m === "signin" ? "Sign in" : "Sign up"}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={oauthLoading || submitting}
            className="w-full inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card px-4 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-60"
          >
            {oauthLoading ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <GoogleIcon />
            )}
            Continue with Google
          </button>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex-1 h-px bg-border" />
            or
            <span className="flex-1 h-px bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === "signup" && (
              <Field
                label="Name"
                value={name}
                onChange={setName}
                placeholder="Alex"
                autoComplete="name"
              />
            )}
            <Field
              label="Email"
              value={email}
              onChange={setEmail}
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
            />
            <Field
              label="Password"
              value={password}
              onChange={setPassword}
              type="password"
              placeholder="••••••••"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
            />

            <button
              type="submit"
              disabled={submitting || oauthLoading}
              className="w-full rounded-full bg-primary text-primary-foreground px-4 py-3 text-sm font-semibold shadow-glow hover:scale-[1.01] active:scale-[0.99] transition-transform ease-bounce disabled:opacity-60 disabled:hover:scale-100 inline-flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="size-4 animate-spin" aria-hidden />}
              {mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          By continuing you agree to Tribely's terms & privacy.
        </p>
      </main>
    </div>
  );
};

const Field = ({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
}) => (
  <label className="block space-y-1.5">
    <span className="text-xs font-medium text-muted-foreground">{label}</span>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoComplete={autoComplete}
      required
      className="w-full rounded-full border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
    />
  </label>
);

const GoogleIcon = () => (
  <svg className="size-4" viewBox="0 0 24 24" aria-hidden>
    <path
      fill="#EA4335"
      d="M12 10.2v3.9h5.5c-.24 1.43-1.7 4.2-5.5 4.2-3.31 0-6-2.74-6-6.12S8.69 6.06 12 6.06c1.88 0 3.14.8 3.86 1.49l2.63-2.54C16.85 3.5 14.65 2.5 12 2.5 6.76 2.5 2.5 6.76 2.5 12s4.26 9.5 9.5 9.5c5.49 0 9.13-3.86 9.13-9.29 0-.63-.07-1.11-.16-1.59H12z"
    />
  </svg>
);

export default Auth;
