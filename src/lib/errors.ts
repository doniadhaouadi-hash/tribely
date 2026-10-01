/** Human-readable message from an Error, a Supabase/PostgREST error object, or anything else. */
export const errorMessage = (e: unknown, fallback = "Something went wrong") => {
  if (e instanceof Error && e.message) return e.message;
  if (e && typeof e === "object" && "message" in e) {
    const msg = (e as { message?: unknown }).message;
    if (typeof msg === "string" && msg) return msg;
  }
  return fallback;
};
