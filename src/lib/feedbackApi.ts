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

export type FeedbackResult = {
  /** false when the text was saved but the screenshot couldn't be attached */
  screenshotSaved: boolean;
};

const uploadScreenshot = async (path: string, file: File) => {
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new UploadError(error.message);
};

/**
 * Sends a feedback report.
 * - Logged in: upload the screenshot to <uid>/feedback/… first, then insert.
 * - Logged out (QA-039): insert first with our own id, then upload to
 *   anon/<feedback id>/… (the storage policy allows one file for a fresh
 *   entry) and link it via attach_feedback_screenshot().
 */
export const sendFeedback = async ({
  message,
  screenshot,
  userId,
}: FeedbackInput): Promise<FeedbackResult> => {
  const text = message.trim();
  if (!text) throw new Error("Please describe what happened");
  if (text.length > MAX_FEEDBACK_LENGTH) {
    throw new Error(`Please keep it under ${MAX_FEEDBACK_LENGTH} characters`);
  }
  if (screenshot) validateImage(screenshot);

  const id = crypto.randomUUID();
  const base = { id, device_id: getDeviceId(), message: text, ...collectContext() };

  if (userId) {
    let screenshotPath: string | null = null;
    if (screenshot) {
      screenshotPath = buildUploadPath(userId, "feedback", screenshot.name);
      await uploadScreenshot(screenshotPath, screenshot);
    }
    const { error } = await supabase
      .from("feedback")
      .insert({ ...base, user_id: userId, screenshot_path: screenshotPath });
    if (error) throw error;
    return { screenshotSaved: true };
  }

  const { error } = await supabase.from("feedback").insert({ ...base, user_id: null });
  if (error) throw error;
  if (!screenshot) return { screenshotSaved: true };

  try {
    const path = buildUploadPath("anon", id, screenshot.name);
    await uploadScreenshot(path, screenshot);
    const { error: attachError } = await supabase.rpc("attach_feedback_screenshot", {
      _feedback_id: id,
      _path: path,
    });
    if (attachError) throw attachError;
    return { screenshotSaved: true };
  } catch {
    // The text arrived; only the image is missing.
    return { screenshotSaved: false };
  }
};
