/**
 * Only allow same-origin, path-relative redirect targets (e.g. "/?activity=…").
 * Anything else ("//evil.com", "https://…", "javascript:") falls back.
 */
export const safeRedirect = (raw: string | null | undefined, fallback = "/?tab=discover") => {
  if (!raw) return fallback;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return fallback;
  return raw;
};

/** Link to the auth page that brings the user back to `returnTo` afterwards. */
export const authLink = (returnTo: string) => `/auth?redirect=${encodeURIComponent(returnTo)}`;
