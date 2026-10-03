import { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, Send, X } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useAuth } from "@/context/AuthContext";
import { MAX_FEEDBACK_LENGTH, sendFeedback } from "@/lib/feedbackApi";
import { errorMessage } from "@/lib/errors";
import { UploadError, validateImage } from "@/lib/uploadImage";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Tester feedback with optional screenshot (FR-008). Works with and without login. */
export const FeedbackSheet = ({ open, onOpenChange }: Props) => {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!preview) return;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  const reset = () => {
    setMessage("");
    setScreenshot(null);
    setPreview(null);
  };

  const pickScreenshot = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      validateImage(file);
      setScreenshot(file);
      setPreview(URL.createObjectURL(file));
    } catch (err) {
      toast.error(err instanceof UploadError ? err.message : "Couldn't use that image");
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    try {
      await sendFeedback({ message, screenshot, userId: user?.id ?? null });
      toast.success("Thanks, got it!", { description: "Your feedback reached the Tribely team." });
      reset();
      onOpenChange(false);
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't send your feedback"));
    } finally {
      setSending(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        title="Send feedback"
        hideClose
        className="p-0 max-h-[90vh] rounded-t-[2rem] border-0 bg-card overflow-hidden"
      >
        <form onSubmit={handleSend} className="flex flex-col max-h-[90vh]">
          <header className="shrink-0 px-5 pt-5 pb-3 flex items-center gap-3 border-b border-border">
            <div className="absolute top-2 left-1/2 -translate-x-1/2 h-1.5 w-12 rounded-full bg-muted" />
            <div className="flex-1">
              <h2 className="font-display text-lg font-bold">Send feedback</h2>
              <p className="text-xs text-muted-foreground">
                Something broken or confusing? Tell us — page and device are attached.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              aria-label="Close"
              className="grid place-items-center size-9 rounded-full bg-muted hover:bg-muted/70 transition-colors"
            >
              <X className="size-4" aria-hidden />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            <label className="block space-y-1.5">
              <span className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">What happened?</span>
                <span className="text-[11px] text-muted-foreground/80">
                  {message.length}/{MAX_FEEDBACK_LENGTH}
                </span>
              </span>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={MAX_FEEDBACK_LENGTH}
                required
                rows={5}
                placeholder="E.g. I tapped Join and nothing happened…"
                className="w-full rounded-2xl glass px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </label>

            {preview ? (
              <div className="relative w-fit">
                <img src={preview} alt="Screenshot preview" className="h-32 rounded-2xl object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    setScreenshot(null);
                    setPreview(null);
                  }}
                  aria-label="Remove screenshot"
                  className="absolute -top-2 -right-2 grid place-items-center size-7 rounded-full bg-card border border-border shadow-soft"
                >
                  <X className="size-3.5" aria-hidden />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-full glass px-4 py-2.5 text-sm font-medium hover:bg-white/20 transition-colors"
              >
                <ImagePlus className="size-4" aria-hidden /> Add screenshot (optional)
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={pickScreenshot}
            />
          </div>

          <div className="shrink-0 px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] border-t border-border bg-card">
            <button
              type="submit"
              disabled={sending || !message.trim()}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-gradient-primary text-primary-foreground py-3.5 text-sm font-semibold shadow-glow disabled:opacity-60"
            >
              {sending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Send className="size-4" aria-hidden />
              )}
              Send feedback
            </button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};
