import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, LogIn, MessageCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { fetchMyActivities } from "@/lib/myActivitiesApi";
import { CATEGORIES, type MockActivity } from "@/data/activities";
import { ChatSheet } from "@/components/ChatSheet";
import { formatActivityTime } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";

export const ChatTab = () => {
  const { user } = useAuth();
  const [chats, setChats] = useState<MockActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<MockActivity | null>(null);

  useEffect(() => {
    if (!user) {
      setChats([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const { upcoming, hosted } = await fetchMyActivities(user.id);
        const map = new Map<string, MockActivity>();
        [...hosted, ...upcoming].forEach((a) => map.set(a.id, a));
        if (!cancelled) setChats(Array.from(map.values()));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();

    const channel = supabase
      .channel(`chat-list-${user.id}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "activity_participants", filter: `user_id=eq.${user.id}` },
        () => load(),
      )
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (!user) {
    return (
      <div className="pt-10 flex flex-col items-center text-center gap-5 px-2">
        <div className="grid place-items-center size-20 rounded-full bg-muted">
          <MessageCircle className="size-9 text-muted-foreground" aria-hidden />
        </div>
        <div className="space-y-1">
          <h2 className="font-display text-2xl font-bold">Chat with your tribe</h2>
          <p className="text-sm text-muted-foreground max-w-xs">
            Sign in to message hosts and other athletes joining your activities.
          </p>
        </div>
        <Link
          to="/auth"
          className="inline-flex items-center gap-2 rounded-full bg-gradient-primary text-primary-foreground px-6 py-3 text-sm font-semibold shadow-glow"
        >
          <LogIn className="size-4" aria-hidden /> Sign in
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="pt-16 grid place-items-center text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="pt-10 flex flex-col items-center text-center gap-4 px-2">
        <div className="grid place-items-center size-20 rounded-full bg-muted">
          <MessageCircle className="size-9 text-muted-foreground" aria-hidden />
        </div>
        <div className="space-y-1">
          <h2 className="font-display text-xl font-bold">No chats yet</h2>
          <p className="text-sm text-muted-foreground max-w-xs">
            Join an activity to start chatting with the tribe.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2 pt-1">
        <h1 className="font-display text-xl font-bold mb-3">Chats</h1>
        {chats.map((a) => {
          const cat = CATEGORIES[a.category];
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => setActive(a)}
              className="w-full flex items-center gap-3 rounded-2xl glass shadow-soft p-3 hover:bg-white/20 transition-colors text-left"
            >
              <div
                className="grid place-items-center size-12 rounded-2xl shrink-0 text-xl"
                style={{ background: `hsl(var(${cat.tintVar}) / 0.18)` }}
              >
                <span aria-hidden>{cat.emoji}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-display text-sm font-semibold truncate">{a.title}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {formatActivityTime(a.startsAt)} · {a.joined} joined
                </div>
              </div>
              <MessageCircle className="size-4 text-muted-foreground shrink-0" aria-hidden />
            </button>
          );
        })}
      </div>
      <ChatSheet activity={active} onOpenChange={(o) => !o && setActive(null)} />
    </>
  );
};
