import { supabase } from "@/integrations/supabase/client";

const BUCKET = "tribely-media";
const MAX_BYTES = 5 * 1024 * 1024; // 5MB — must match the bucket's file_size_limit
/** Must match the bucket's allowed_mime_types (no SVG: it can carry scripts). */
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
];

export class UploadError extends Error {}

/**
 * Storage path for an upload. The first folder must be the uploader's user id —
 * the bucket's INSERT policy rejects anything else.
 */
export const buildUploadPath = (
  ownerId: string,
  folder: "avatars" | "activities" | "feedback",
  fileName: string,
  now = Date.now(),
) => {
  const ext = fileName.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  return `${ownerId}/${folder}/${now}.${ext}`;
};

/** Throws an UploadError unless the file is an allowed image of at most 5MB. */
export const validateImage = (file: File) => {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new UploadError("Please choose a JPG, PNG, WebP, GIF or HEIC image");
  }
  if (file.size > MAX_BYTES) {
    throw new UploadError("Image must be smaller than 5MB");
  }
};

/** Uploads an image to the public `tribely-media` bucket and returns its public URL. */
export const uploadImage = async (file: File, folder: "avatars" | "activities", ownerId: string) => {
  validateImage(file);

  const path = buildUploadPath(ownerId, folder, file.name);

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new UploadError(error.message);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
};
