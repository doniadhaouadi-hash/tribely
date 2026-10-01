import { supabase } from "@/integrations/supabase/client";

const BUCKET = "tribely-media";
const MAX_BYTES = 5 * 1024 * 1024; // 5MB

export class UploadError extends Error {}

/** Uploads an image to the public `tribely-media` bucket and returns its public URL. */
export const uploadImage = async (file: File, folder: "avatars" | "activities", ownerId: string) => {
  if (!file.type.startsWith("image/")) {
    throw new UploadError("Please choose an image file");
  }
  if (file.size > MAX_BYTES) {
    throw new UploadError("Image must be smaller than 5MB");
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${folder}/${ownerId}-${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw new UploadError(error.message);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
};
