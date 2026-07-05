import type { MockActivity } from "@/data/activities";
import { CATEGORIES } from "@/data/activities";
import { formatActivityTime } from "@/lib/format";

export type ShareResult = "shared" | "copied" | "failed";

export const buildShareData = (activity: MockActivity) => {
  const cat = CATEGORIES[activity.category];
  const url = `${window.location.origin}/?activity=${activity.id}`;
  const title = `${cat.emoji} ${activity.title} · Tribely`;
  const text = `${activity.title}\n${formatActivityTime(activity.startsAt)} · ${activity.address}\n\nJoin the tribe on Tribely:`;
  return { title, text, url };
};

export const shareActivity = async (activity: MockActivity): Promise<ShareResult> => {
  const data = buildShareData(activity);
  // Native share (mobile)
  const navAny = navigator as unknown as { share?: (d: ShareData) => Promise<void> };
  if (typeof navAny.share === "function") {
    try {
      await navAny.share(data);
      return "shared";
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return "failed";
      // fall through to clipboard
    }
  }
  // Clipboard fallback
  try {
    await navigator.clipboard.writeText(`${data.text} ${data.url}`);
    return "copied";
  } catch {
    return "failed";
  }
};
