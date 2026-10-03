import { supabase } from "@/integrations/supabase/client";
import { buildUploadPath, UploadError, validateImage } from "@/lib/uploadImage";

const BUCKET = "feedback-screenshots";
const DEVICE_KEY = "tribely:device-id";
export const MAX_FEEDBACK_LENGTH = 2000;

/**
 * Random per-browser id. Groups reports from one device and lets the
 * server rate-limit logged-out testers (FR-008).
 */
export const getDeviceId = (): string => {
  try {
    const existing = localStorage.getItem(DEVICE_KEY);
    if (existing && existing.length >= 8) return existing;
    const id = crypto.randomUUID();
    localStorage.setItem(DEVICE_KEY, id);
    return id;
  } catch {
    // storage unavailable: a fresh id per page load still satisfies the schema
    return `nostore-${Math.random().toString(36).slice(2, 12)}`;
  }
};

/** Page, version and device info attached to every report. */
export const collectContext = () => {
  const standalone =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(display-mode: standalone)").matches;
  const device = [
    navigator.userAgent,
    `${window.innerWidth}x${window.innerHeight}@${window.devicePixelRatio || 1}x`,
    standalone ? "installed" : "browser",
  ].join(" | ");
  return {
    page: `${window.location.pathname}${window.location.search}`.slice(0, 500),
    app_version: __APP_VERSION__,
    user_agent: device.slice(0, 500),
  };
};

export type FeedbackInput = {
  message: string;
  screenshot?: File | null;
  userId?: string | null;
};

/** Sends a feedback report; uploads the optional screenshot first. */
export const sendFeedback = async ({ message, screenshot, userId }: FeedbackInput) => {
  const text = message.trim();
  if (!text) throw new Error("Please describe what happened");
  if (text.length > MAX_FEEDBACK_LENGTH) {
    throw new Error(`Please keep it under ${MAX_FEEDBACK_LENGTH} characters`);
  }

  const deviceId = getDeviceId();
  let screenshotPath: string | null = null;
  if (screenshot) {
    validateImage(screenshot);
    // Same folder rule as the storage policy: <uid>/… or anon/…
    const owner = userId ?? "anon";
    screenshotPath = buildUploadPath(owner, "feedback", screenshot.name);
    const { error } = await supabase.storage.from(BUCKET).upload(screenshotPath, screenshot, {
      contentType: screenshot.type,
      upsert: false,
    });
    if (error) throw new UploadError(error.message);
  }

  const { error } = await supabase.from("feedback").insert({
    user_id: userId ?? null,
    device_id: deviceId,
    message: text,
    screenshot_path: screenshotPath,
    ...collectContext(),
  });
  if (error) throw error;
};
