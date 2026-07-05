import { supabase } from "@/integrations/supabase/client";

export const fetchFavoriteIds = async (userId: string): Promise<string[]> => {
  const { data, error } = await supabase
    .from("favorites")
    .select("activity_id")
    .eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).map((r) => r.activity_id);
};

export const addFavorite = async (userId: string, activityId: string) => {
  const { error } = await supabase
    .from("favorites")
    .insert({ user_id: userId, activity_id: activityId });
  if (error && !`${error.message}`.includes("duplicate")) throw error;
};

export const removeFavorite = async (userId: string, activityId: string) => {
  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("user_id", userId)
    .eq("activity_id", activityId);
  if (error) throw error;
};
