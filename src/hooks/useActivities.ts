import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchActivitiesWithHosts } from "@/lib/activitiesApi";
import { errorMessage } from "@/lib/errors";
import type { MockActivity } from "@/data/activities";

export const useActivities = () => {
  const [activities, setActivities] = useState<MockActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchActivitiesWithHosts();
      setActivities(data);
      setError(null);
    } catch (e) {
      setError(errorMessage(e, "Failed to load activities"));
    } finally {
      setLoading(false);
    }
  }, []);

  /** User-triggered reload after an error: shows the spinner again. */
  const retry = useCallback(() => {
    setLoading(true);
    return refresh();
  }, [refresh]);

  useEffect(() => {
    refresh();

    // Unique channel per hook instance — avoids "callbacks after subscribe()"
    // when multiple components mount useActivities at the same time.
    const channel = supabase
      .channel(`activities-feed-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "activities" },
        () => refresh(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "activity_participants" },
        () => refresh(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refresh]);

  return { activities, loading, error, refresh, retry };
};
