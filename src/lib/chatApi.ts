import { supabase } from "@/integrations/supabase/client";

export type ChatMessage = {
  id: string;
  activity_id: string;
  user_id: string;
  body: string;
  created_at: string;
  author?: {
    display_name: string;
    avatar_url: string | null;
  };
};

export const fetchMessages = async (activityId: string): Promise<ChatMessage[]> => {
  const { data: rows, error } = await supabase
    .from("chat_messages")
    .select("id, activity_id, user_id, body, created_at")
    .eq("activity_id", activityId)
    .order("created_at", { ascending: true })
    .limit(200);
  if (error) throw error;
  if (!rows || rows.length === 0) return [];

  const ids = Array.from(new Set(rows.map((r) => r.user_id)));
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .in("id", ids);
  const map = new Map(profiles?.map((p) => [p.id, p]) ?? []);
  return rows.map((r) => ({
    ...r,
    author: {
      display_name: map.get(r.user_id)?.display_name?.trim() || "Athlete",
      avatar_url: map.get(r.user_id)?.avatar_url ?? null,
    },
  }));
};

export const sendMessage = async (activityId: string, userId: string, body: string) => {
  const trimmed = body.trim();
  if (!trimmed) return;
  const { error } = await supabase
    .from("chat_messages")
    .insert({ activity_id: activityId, user_id: userId, body: trimmed });
  if (error) throw error;
};
