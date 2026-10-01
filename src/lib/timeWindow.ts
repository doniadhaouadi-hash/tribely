export type TimeWindow = "any" | "6h" | "today" | "3d";

/**
 * Latest start time (ms) that matches the "When" filter. "today" means until
 * the end of the current local day, not the next 24 hours.
 */
export const timeWindowEnd = (window: TimeWindow, now: Date = new Date()): number => {
  switch (window) {
    case "any":
      return Infinity;
    case "6h":
      return now.getTime() + 6 * 3600_000;
    case "today": {
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      return end.getTime();
    }
    case "3d":
      return now.getTime() + 72 * 3600_000;
  }
};
