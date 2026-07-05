import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export const useUserRSVPs = () => {
  const { user } = useAuth();
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setJoinedIds(new Set());
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("activity_participants")
      .select("activity_id")
      .eq("user_id", user.id)
      .eq("status", "going");
    setJoinedIds(new Set((data ?? []).map((r) => r.activity_id)));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
    if (!user) return;
    const channel = supabase
      .channel(`rsvps-${user.id}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "activity_participants",
          filter: `user_id=eq.${user.id}`,
        },
        () => refresh(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refresh]);

  return { joinedIds, loading, refresh };
};
