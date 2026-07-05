import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { addFavorite, fetchFavoriteIds, removeFavorite } from "@/lib/favoritesApi";

export const useFavorites = () => {
  const { user } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setFavoriteIds(new Set());
      return;
    }
    setLoading(true);
    try {
      const ids = await fetchFavoriteIds(user.id);
      setFavoriteIds(new Set(ids));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
    if (!user) return;
    const channel = supabase
      .channel(`favs-${user.id}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "favorites", filter: `user_id=eq.${user.id}` },
        () => refresh(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refresh]);

  const toggle = useCallback(
    async (activityId: string) => {
      if (!user) return;
      const isFav = favoriteIds.has(activityId);
      // optimistic
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (isFav) next.delete(activityId);
        else next.add(activityId);
        return next;
      });
      try {
        if (isFav) await removeFavorite(user.id, activityId);
        else await addFavorite(user.id, activityId);
      } catch {
        // rollback
        refresh();
      }
    },
    [user, favoriteIds, refresh],
  );

  return { favoriteIds, loading, toggle, refresh };
};
