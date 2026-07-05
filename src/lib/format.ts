/** Format an ISO date as a short, friendly relative time. */
export const formatActivityTime = (iso: string): string => {
  const date = new Date(iso);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const isTomorrow = date.toDateString() === tomorrow.toDateString();

  const time = date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (sameDay) {
    const diffMs = date.getTime() - now.getTime();
    const diffMin = Math.round(diffMs / 60000);
    if (diffMin > 0 && diffMin < 90) {
      return `In ${diffMin}m · ${time}`;
    }
    return `Today · ${time}`;
  }
  if (isTomorrow) return `Tomorrow · ${time}`;

  const weekday = date.toLocaleDateString(undefined, { weekday: "short" });
  const day = date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return `${weekday} ${day} · ${time}`;
};
