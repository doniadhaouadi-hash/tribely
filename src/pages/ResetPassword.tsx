import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { GlassBackground } from "@/components/GlassBackground";

const passwordSchema = z.string().min(8, "At least 8 characters").max(72);

const ResetPassword = () => {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Supabase exchanges the recovery link's token for a session automatically
    // (detectSessionInUrl) and then emits this event once it's ready.
    const { data: subscription } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const passV = passwordSchema.parse(password);
      if (passV !== confirmPassword) {
        toast.error("Passwords don't match");
        return;
      }
      setSubmitting(true);
      const { error } = await supabase.auth.updateUser({ password: passV });
      if (error) throw error;
      toast.success("Password updated", {
        description: "You can now sign in with your new password.",
      });
      navigate("/auth");
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

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      <GlassBackground />
      <main className="relative z-10 flex-1 max-w-md w-full mx-auto px-4 py-12 flex flex-col justify-center gap-8">
        <div className="text-center space-y-2">
          <h1 className="font-display text-4xl font-bold leading-tight text-gradient-primary">
            Tribely.
          </h1>
          <p className="text-muted-foreground text-sm">Set a new password</p>
        </div>

        <div className="rounded-3xl glass-strong shadow-float p-6 space-y-5">
          {ready ? (
            <form onSubmit={handleSubmit} className="space-y-3">
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">New password</span>
                <div className="relative">
                  <input
                    type={visible ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    required
                    className="w-full rounded-full glass px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                  />
                  <button
                    type="button"
                    onClick={() => setVisible((v) => !v)}
                    aria-label={visible ? "Hide password" : "Show password"}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 grid place-items-center size-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-white/20 transition-colors"
                  >
                    {visible ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
                  </button>
                </div>
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">Confirm password</span>
                <input
                  type={visible ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                  className="w-full rounded-full glass px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                />
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-full bg-gradient-primary text-primary-foreground px-4 py-3 text-sm font-semibold shadow-glow hover:scale-[1.01] active:scale-[0.99] transition-transform ease-bounce disabled:opacity-60 disabled:hover:scale-100 inline-flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 className="size-4 animate-spin" aria-hidden />}
                Update password
              </button>
            </form>
          ) : (
            <div className="text-center space-y-3 py-4">
              <Loader2 className="size-5 animate-spin mx-auto text-muted-foreground" aria-hidden />
              <p className="text-sm text-muted-foreground">
                Verifying your reset link…
              </p>
              <p className="text-xs text-muted-foreground">
                If this takes too long, the link may have expired.{" "}
                <Link to="/auth" className="text-foreground underline underline-offset-2">
                  Request a new one
                </Link>
                .
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ResetPassword;
