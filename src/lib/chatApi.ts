import { supabase } from "@/integrations/supabase/client";

export type ChatAuthor = {
  display_name: string;
  avatar_url: string | null;
};

export type ChatMessage = {
  id: string;
  activity_id: string;
  user_id: string;
  body: string;
  created_at: string;
  author?: ChatAuthor;
  /** Optimistic message not yet confirmed by the server (QA-034). */
  pending?: boolean;
  /** Optimistic message whose insert failed; can be retried. */
  failed?: boolean;
  /** Local id of an optimistic message. */
  clientId?: string;
};

const MESSAGE_COLUMNS = "id, activity_id, user_id, body, created_at";

const toAuthor = (p?: { display_name: string | null; avatar_url: string | null } | null): ChatAuthor => ({
  display_name: p?.display_name?.trim() || "Athlete",
  avatar_url: p?.avatar_url ?? null,
});

export const fetchMessages = async (activityId: string): Promise<ChatMessage[]> => {
  const { data: rows, error } = await supabase
    .from("chat_messages")
    .select(MESSAGE_COLUMNS)
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
  return rows.map((r) => ({ ...r, author: toAuthor(map.get(r.user_id)) }));
};

/** Display name and avatar for one user (for messages arriving via realtime). */
export const fetchAuthor = async (userId: string): Promise<ChatAuthor> => {
  const { data } = await supabase
    .from("profiles")
    .select("display_name, avatar_url")
    .eq("id", userId)
    .maybeSingle();
  return toAuthor(data);
};

/** Inserts a message and returns the saved row. */
export const sendMessage = async (
  activityId: string,
  userId: string,
  body: string,
): Promise<ChatMessage | null> => {
  const trimmed = body.trim();
  if (!trimmed) return null;
  const { data, error } = await supabase
    .from("chat_messages")
    .insert({ activity_id: activityId, user_id: userId, body: trimmed })
    .select(MESSAGE_COLUMNS)
    .single();
  if (error) throw error;
  return data;
};
