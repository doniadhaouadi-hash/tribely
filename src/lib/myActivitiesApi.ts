import { supabase } from "@/integrations/supabase/client";
import { rowToActivity } from "@/lib/activitiesApi";
import type { MockActivity } from "@/data/activities";
import type { Database } from "@/integrations/supabase/types";

type ActivityRow = Database["public"]["Tables"]["activities"]["Row"];

export type MyActivitiesBuckets = {
  upcoming: MockActivity[];
  hosted: MockActivity[];
  past: MockActivity[];
};

const enrichWithHosts = async (rows: ActivityRow[]): Promise<MockActivity[]> => {
  if (!rows.length) return [];
  const hostIds = Array.from(new Set(rows.map((r) => r.host_id)));
  const { data: hosts } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, rating")
    .in("id", hostIds);
  const map = new Map(hosts?.map((h) => [h.id, h]) ?? []);
  return rows.map((r) => rowToActivity(r, map.get(r.host_id) ?? null));
};

export const fetchMyActivities = async (userId: string): Promise<MyActivitiesBuckets> => {
  const nowIso = new Date().toISOString();

  // 1. Hosted
  const { data: hostedRows, error: hostedError } = await supabase
    .from("activities")
    .select("*")
    .eq("host_id", userId)
    .neq("status", "cancelled")
    .order("start_at", { ascending: true });
  if (hostedError) throw hostedError;

  // 2. Joined (going)
  const { data: parts, error: partsError } = await supabase
    .from("activity_participants")
    .select("activity_id")
    .eq("user_id", userId)
    .eq("status", "going");
  if (partsError) throw partsError;

  const joinedIds = (parts ?? []).map((p) => p.activity_id);
  let joinedRows: ActivityRow[] = [];
  if (joinedIds.length) {
    const { data, error } = await supabase
      .from("activities")
      .select("*")
      .in("id", joinedIds)
      .neq("status", "cancelled");
    if (error) throw error;
    joinedRows = data ?? [];
  }

  // Combine for upcoming/past split, dedupe (host can be in both)
  const all = new Map<string, ActivityRow>();
  [...(hostedRows ?? []), ...joinedRows].forEach((r) => all.set(r.id, r));

  const upcoming: ActivityRow[] = [];
  const past: ActivityRow[] = [];
  Array.from(all.values()).forEach((r) => {
    if (r.start_at >= nowIso) upcoming.push(r);
    else past.push(r);
  });
  upcoming.sort((a, b) => a.start_at.localeCompare(b.start_at));
  past.sort((a, b) => b.start_at.localeCompare(a.start_at));

  return {
    upcoming: await enrichWithHosts(upcoming),
    hosted: await enrichWithHosts(hostedRows ?? []),
    past: await enrichWithHosts(past),
  };
};

export const fetchFavoriteActivities = async (userId: string): Promise<MockActivity[]> => {
  const { data: favs, error: favsError } = await supabase
    .from("favorites")
    .select("activity_id")
    .eq("user_id", userId);
  if (favsError) throw favsError;
  const ids = (favs ?? []).map((f) => f.activity_id);
  if (!ids.length) return [];
  const { data: rows, error: rowsError } = await supabase
    .from("activities")
    .select("*")
    .in("id", ids)
    .neq("status", "cancelled")
    .order("start_at", { ascending: true });
  if (rowsError) throw rowsError;
  return enrichWithHosts(rows ?? []);
};
