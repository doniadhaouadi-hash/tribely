import { useEffect, useRef, useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Loader2, Send, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { fetchMessages, sendMessage, type ChatMessage } from "@/lib/chatApi";
import { dicebearAvatar, type MockActivity } from "@/data/activities";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Props = {
  activity: MockActivity | null;
  onOpenChange: (open: boolean) => void;
};

const formatTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

export const ChatSheet = ({ activity, onOpenChange }: Props) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const open = !!activity;

  useEffect(() => {
    if (!activity) {
      setMessages([]);
      return;
    }
    setLoading(true);
    fetchMessages(activity.id)
      .then(setMessages)
      .catch(() => toast.error("Couldn't load chat"))
      .finally(() => setLoading(false));

    const channel = supabase
      .channel(`chat-${activity.id}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `activity_id=eq.${activity.id}`,
        },
        () => {
          fetchMessages(activity.id).then(setMessages);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [activity?.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!activity || !user || !draft.trim()) return;
    setSending(true);
    try {
      await sendMessage(activity.id, user.id, draft);
      setDraft("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to send");
    } finally {
      setSending(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="p-0 max-h-[92vh] h-[92vh] rounded-t-[2rem] border-0 bg-card overflow-hidden"
      >
        {activity && (
          <div className="flex flex-col h-full">
            {/* Header */}
            <header className="shrink-0 px-5 pt-5 pb-3 border-b border-border flex items-center gap-3">
              <div className="absolute top-2 left-1/2 -translate-x-1/2 h-1.5 w-12 rounded-full bg-muted" />
              <div className="flex-1 min-w-0">
                <h2 className="font-display text-base font-bold truncate">{activity.title}</h2>
                <p className="text-xs text-muted-foreground">
                  {activity.joined} {activity.joined === 1 ? "person" : "people"} joined
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

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {loading ? (
                <div className="grid place-items-center h-full text-muted-foreground">
                  <Loader2 className="size-5 animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="grid place-items-center h-full text-center px-6">
                  <div>
                    <p className="font-display text-sm font-semibold mb-1">Be the first 👋</p>
                    <p className="text-xs text-muted-foreground">
                      Say hi to the tribe — share meeting point, gear or vibes.
                    </p>
                  </div>
                </div>
              ) : (
                messages.map((m) => {
                  const mine = user?.id === m.user_id;
                  return (
                    <div
                      key={m.id}
                      className={cn("flex items-end gap-2", mine && "flex-row-reverse")}
                    >
                      <img
                        src={m.author?.avatar_url ?? dicebearAvatar(m.user_id)}
                        alt=""
                        className="size-8 rounded-full bg-muted shrink-0 object-cover"
                      />
                      <div
                        className={cn(
                          "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm",
                          mine
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-muted text-foreground rounded-bl-md",
                        )}
                      >
                        {!mine && (
                          <div className="text-[11px] font-semibold text-muted-foreground mb-0.5">
                            {m.author?.display_name}
                          </div>
                        )}
                        <p className="whitespace-pre-wrap break-words leading-snug">{m.body}</p>
                        <div
                          className={cn(
                            "text-[10px] mt-1",
                            mine ? "text-primary-foreground/70" : "text-muted-foreground",
                          )}
                        >
                          {formatTime(m.created_at)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Composer */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="shrink-0 border-t border-border px-3 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] flex items-end gap-2 bg-card"
            >
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Message your tribe…"
                rows={1}
                className="flex-1 resize-none rounded-2xl bg-muted px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 max-h-32"
              />
              <button
                type="submit"
                disabled={sending || !draft.trim()}
                aria-label="Send"
                className="grid place-items-center size-11 rounded-full bg-primary text-primary-foreground shadow-glow disabled:opacity-50 transition-transform hover:scale-105 active:scale-95"
              >
                {sending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" aria-hidden />
                )}
              </button>
            </form>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
