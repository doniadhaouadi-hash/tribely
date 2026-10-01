import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { CategoryKey, MockActivity, SkillLevel } from "@/data/activities";

type ActivityRow = Database["public"]["Tables"]["activities"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

/** DB enum (12) ↔ UI key (12). Two enums use slightly different keys. */
const DB_TO_UI: Record<ActivityRow["category"], CategoryKey> = {
  running: "running",
  football: "football",
  gym: "gym",
  yoga: "yoga",
  cycling: "cycling",
  walking: "walking",
  tennis: "tennis_padel",
  basketball: "basketball",
  swimming: "swimming",
  climbing: "climbing",
  dance: "dance_fitness",
  coffee: "coffee",
  social: "social",
  other: "other",
};

const UI_TO_DB: Record<CategoryKey, ActivityRow["category"]> = {
  running: "running",
  football: "football",
  gym: "gym",
  yoga: "yoga",
  cycling: "cycling",
  walking: "walking",
  tennis_padel: "tennis",
  basketball: "basketball",
  swimming: "swimming",
  climbing: "climbing",
  dance_fitness: "dance",
  coffee: "coffee",
  social: "social",
  other: "other",
};

const LEVEL_TO_SKILL: Record<ActivityRow["level_required"], SkillLevel> = {
  beginner: "casual",
  intermediate: "intermediate",
  advanced: "committed",
  pro: "committed",
};

/** Levels a host can pick; "all" is only a display value. */
export type PickableSkillLevel = Exclude<SkillLevel, "all">;

export const SKILL_TO_LEVEL: Record<PickableSkillLevel, ActivityRow["level_required"]> = {
  casual: "beginner",
  intermediate: "intermediate",
  committed: "advanced",
};

export const toPickableSkill = (s: SkillLevel): PickableSkillLevel => (s === "all" ? "casual" : s);

export const uiToDbCategory = (k: CategoryKey) => UI_TO_DB[k];

export const rowToActivity = (
  row: ActivityRow,
  host?: Pick<ProfileRow, "id" | "display_name" | "avatar_url" | "rating"> | null,
): MockActivity => ({
  id: row.id,
  title: row.title,
  description: row.description ?? "",
  category: DB_TO_UI[row.category],
  lat: row.lat,
  lng: row.lng,
  address: row.address ?? row.location_name,
  city: "Frankfurt",
  startsAt: row.start_at,
  durationMinutes: row.duration_min,
  capacity: row.max_participants,
  joined: row.participant_count,
  skillLevel: LEVEL_TO_SKILL[row.level_required],
  spontaneous: row.spontaneous,
  coverUrl: row.cover_url ?? null,
  host: {
    id: row.host_id,
    displayName: host?.display_name?.trim() || "Host",
    avatarSeed: host?.id ?? row.host_id,
    avatarUrl: host?.avatar_url ?? null,
    rating: host?.rating ? Number(host.rating) : 5,
  },
});

export type CreateActivityInput = {
  host_id: string;
  title: string;
  description?: string;
  category: CategoryKey;
  level_required?: ActivityRow["level_required"];
  location_name: string;
  address?: string;
  lat: number;
  lng: number;
  start_at: string; // ISO
  duration_min: number;
  max_participants: number;
  spontaneous?: boolean;
  cover_url?: string | null;
};

/** Activities that started less than this long ago still show in the feed. */
export const FEED_GRACE_MS = 30 * 60_000;

/** Earliest start time an activity may have to appear in the feed / on the map. */
export const feedStartCutoff = (nowMs = Date.now()) =>
  new Date(nowMs - FEED_GRACE_MS).toISOString();

export const fetchActivitiesWithHosts = async (): Promise<MockActivity[]> => {
  const { data: rows, error } = await supabase
    .from("activities")
    .select("*")
    .not("status", "in", "(cancelled,completed)")
    .gte("start_at", feedStartCutoff())
    .order("start_at", { ascending: true });
  if (error) throw error;
  if (!rows || rows.length === 0) return [];

  const hostIds = Array.from(new Set(rows.map((r) => r.host_id)));
  const { data: hosts } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, rating")
    .in("id", hostIds);

  const hostMap = new Map(hosts?.map((h) => [h.id, h]) ?? []);
  return rows.map((r) => rowToActivity(r, hostMap.get(r.host_id) ?? null));
};

/** Single activity by id (e.g. for shared links to activities not in the feed). */
export const fetchActivityById = async (activityId: string): Promise<MockActivity | null> => {
  const { data: row, error } = await supabase
    .from("activities")
    .select("*")
    .eq("id", activityId)
    .maybeSingle();
  if (error) throw error;
  if (!row) return null;
  const { data: host } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, rating")
    .eq("id", row.host_id)
    .maybeSingle();
  return rowToActivity(row, host ?? null);
};

export const createActivity = async (input: CreateActivityInput) => {
  const { data, error } = await supabase
    .from("activities")
    .insert({
      host_id: input.host_id,
      title: input.title,
      description: input.description ?? null,
      category: UI_TO_DB[input.category],
      level_required: input.level_required ?? "beginner",
      location_name: input.location_name,
      address: input.address ?? null,
      lat: input.lat,
      lng: input.lng,
      start_at: input.start_at,
      duration_min: input.duration_min,
      max_participants: input.max_participants,
      spontaneous: input.spontaneous ?? false,
      cover_url: input.cover_url ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export type UpdateActivityInput = Partial<{
  title: string;
  description: string | null;
  category: CategoryKey;
  level_required: ActivityRow["level_required"];
  location_name: string;
  address: string | null;
  lat: number;
  lng: number;
  start_at: string;
  duration_min: number;
  max_participants: number;
  spontaneous: boolean;
  cover_url: string | null;
}>;

export const updateActivity = async (activityId: string, input: UpdateActivityInput) => {
  const { category, ...rest } = input;
  const payload: Database["public"]["Tables"]["activities"]["Update"] = { ...rest };
  if (category) payload.category = UI_TO_DB[category];
  const { error } = await supabase.from("activities").update(payload).eq("id", activityId);
  if (error) throw error;
};

/** Host cancels an activity: it disappears from feeds, but rows are kept. */
export const cancelActivity = async (activityId: string) => {
  const { error } = await supabase
    .from("activities")
    .update({ status: "cancelled" })
    .eq("id", activityId);
  if (error) throw error;
};

export const joinActivity = async (activityId: string, userId: string) => {
  const { error } = await supabase
    .from("activity_participants")
    .upsert(
      { activity_id: activityId, user_id: userId, status: "going" },
      { onConflict: "activity_id,user_id" },
    );
  if (error) throw error;
};

export const leaveActivity = async (activityId: string, userId: string) => {
  const { error } = await supabase
    .from("activity_participants")
    .delete()
    .eq("activity_id", activityId)
    .eq("user_id", userId);
  if (error) throw error;
};

export type ParticipantWithProfile = {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
};

export const fetchParticipants = async (
  activityId: string,
): Promise<ParticipantWithProfile[]> => {
  const { data: parts } = await supabase
    .from("activity_participants")
    .select("user_id")
    .eq("activity_id", activityId)
    .eq("status", "going");
  if (!parts || parts.length === 0) return [];
  const ids = parts.map((p) => p.user_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .in("id", ids);
  const map = new Map(profiles?.map((p) => [p.id, p]) ?? []);
  return ids.map((id) => {
    const p = map.get(id);
    return {
      user_id: id,
      display_name: p?.display_name?.trim() || "Athlete",
      avatar_url: p?.avatar_url ?? null,
    };
  });
};
