import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Loader2, RotateCw, Send, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import {
  fetchAuthor,
  fetchMessages,
  sendMessage,
  type ChatAuthor,
  type ChatMessage,
} from "@/lib/chatApi";
import {
  makePendingMessage,
  mergeServerMessage,
  resolvePending,
  setPendingState,
} from "@/lib/chatMessages";
import { errorMessage } from "@/lib/errors";
import { isTouchDevice, shouldSendOnEnter } from "@/lib/chatKeys";
import type { MockActivity } from "@/data/activities";
import { Avatar } from "@/components/Avatar";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Props = {
  activity: MockActivity | null;
  onOpenChange: (open: boolean) => void;
};

/** 5 lines of text-sm (20px line height) plus the textarea padding. */
const MAX_INPUT_HEIGHT = 5 * 20 + 20;

const formatTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

export const ChatSheet = ({ activity, onOpenChange }: Props) => {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [draft, setDraftState] = useState("");
  const draftRef = useRef("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const setDraft = (value: string) => {
    draftRef.current = value;
    setDraftState(value);
  };
  const scrollRef = useRef<HTMLDivElement>(null);
  // Authors we already know, so realtime messages don't trigger a full reload.
  const authorsRef = useRef(new Map<string, ChatAuthor>());

  const open = !!activity;

  useEffect(() => {
    if (!activity) {
      setMessages([]);
      return;
    }
    const activityId = activity.id;
    let cancelled = false;
    setLoading(true);
    fetchMessages(activityId)
      .then((list) => {
        if (cancelled) return;
        list.forEach((m) => m.author && authorsRef.current.set(m.user_id, m.author));
        // Keep optimistic messages sent while the history was loading.
        setMessages((prev) =>
          prev
            .filter((m) => (m.pending || m.failed) && m.activity_id === activityId)
            .reduce(mergeServerMessage, list),
        );
      })
      .catch(() => toast.error("Couldn't load chat"))
      .finally(() => !cancelled && setLoading(false));

    // New messages: append just the new row instead of reloading the chat (QA-034).
    const channel = supabase
      .channel(`chat-${activityId}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `activity_id=eq.${activityId}`,
        },
        async (payload) => {
          const row = payload.new as ChatMessage;
          let author = authorsRef.current.get(row.user_id);
          if (!author) {
            author = await fetchAuthor(row.user_id);
            authorsRef.current.set(row.user_id, author);
          }
          if (!cancelled) setMessages((prev) => mergeServerMessage(prev, { ...row, author }));
        },
      )
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [activity?.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Grow the textarea with its content, up to 5 lines (QA-036).
  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_INPUT_HEIGHT)}px`;
  }, [draft]);

  const deliver = async (pending: ChatMessage) => {
    const clientId = pending.clientId!;
    try {
      const saved = await sendMessage(pending.activity_id, pending.user_id, pending.body);
      if (saved) {
        setMessages((prev) => resolvePending(prev, clientId, { ...saved, author: pending.author }));
      }
    } catch (e) {
      setMessages((prev) => setPendingState(prev, clientId, { pending: false, failed: true }));
      toast.error(errorMessage(e, "Couldn't send your message"), {
        description: "Tap the message to try again.",
      });
    }
  };

  // Optimistic send: clear the field and show the message right away (QA-034).
  const handleSend = () => {
    if (!activity || !user) return;
    // Read and clear through a ref: a quick double Enter fires twice before
    // React re-renders, and must not send the same text twice (QA-035).
    const text = draftRef.current.trim();
    if (!text) return;
    draftRef.current = "";
    setDraft("");
    const author: ChatAuthor = {
      display_name: profile?.display_name?.trim() || "You",
      avatar_url: profile?.avatar_url ?? null,
    };
    const pending = makePendingMessage(activity.id, user.id, text, author);
    setMessages((prev) => [...prev, pending]);
    inputRef.current?.focus();
    void deliver(pending);
  };

  const retry = (m: ChatMessage) => {
    if (!m.clientId) return;
    setMessages((prev) => setPendingState(prev, m.clientId!, { pending: true, failed: false }));
    void deliver({ ...m, pending: true, failed: false });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        title={activity ? `Chat: ${activity.title}` : "Chat"}
        hideClose
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
                      <Avatar url={m.author?.avatar_url} seed={m.user_id} size={32} />
                      <div
                        className={cn(
                          "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm transition-opacity",
                          mine
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-muted text-foreground rounded-bl-md",
                          m.pending && "opacity-70",
                          m.failed && "ring-2 ring-destructive",
                        )}
                      >
                        {!mine && (
                          <div className="text-[11px] font-semibold text-muted-foreground mb-0.5">
                            {m.author?.display_name}
                          </div>
                        )}
                        <p className="whitespace-pre-wrap break-words leading-snug">{m.body}</p>
                        {m.failed ? (
                          <button
                            type="button"
                            onClick={() => retry(m)}
                            className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold underline underline-offset-2"
                          >
                            <RotateCw className="size-3" aria-hidden /> Not sent · Retry
                          </button>
                        ) : (
                          <div
                            className={cn(
                              "text-[10px] mt-1",
                              mine ? "text-primary-foreground/70" : "text-muted-foreground",
                            )}
                          >
                            {m.pending ? "Sending…" : formatTime(m.created_at)}
                          </div>
                        )}
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
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  const keyEvent = {
                    key: e.key,
                    shiftKey: e.shiftKey,
                    keyCode: e.keyCode,
                    isComposing: e.nativeEvent.isComposing,
                  };
                  if (shouldSendOnEnter(keyEvent, isTouchDevice())) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Message your tribe…"
                rows={1}
                className="flex-1 resize-none rounded-2xl bg-muted px-4 py-2.5 text-sm leading-5 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 overflow-y-auto"
              />
              <button
                type="submit"
                // Keep focus in the textarea so the phone keyboard stays open (QA-036)
                onPointerDown={(e) => e.preventDefault()}
                onMouseDown={(e) => e.preventDefault()}
                disabled={!draft.trim()}
                aria-label="Send"
                className="grid place-items-center size-11 rounded-full bg-gradient-primary text-primary-foreground shadow-glow disabled:opacity-50 transition-transform hover:scale-105 active:scale-95"
              >
                <Send className="size-4" aria-hidden />
              </button>
            </form>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
