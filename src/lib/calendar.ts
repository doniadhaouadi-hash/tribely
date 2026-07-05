import type { MockActivity } from "@/data/activities";

const escapeIcs = (s: string) =>
  s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");

const formatIcsDate = (iso: string) => {
  // YYYYMMDDTHHMMSSZ
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
};

export const buildIcs = (activity: MockActivity): string => {
  const start = new Date(activity.startsAt);
  const end = new Date(start.getTime() + activity.durationMinutes * 60_000);
  const uid = `${activity.id}@tribely.app`;
  const url = `${window.location.origin}/?activity=${activity.id}`;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Tribely//Activity//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${formatIcsDate(new Date().toISOString())}`,
    `DTSTART:${formatIcsDate(start.toISOString())}`,
    `DTEND:${formatIcsDate(end.toISOString())}`,
    `SUMMARY:${escapeIcs(activity.title)}`,
    `DESCRIPTION:${escapeIcs(
      `${activity.description}\n\nHosted by ${activity.host.displayName} via Tribely\n${url}`,
    )}`,
    `LOCATION:${escapeIcs(activity.address)}`,
    `GEO:${activity.lat};${activity.lng}`,
    `URL:${url}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n");
};

export const downloadIcs = (activity: MockActivity) => {
  const ics = buildIcs(activity);
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const safeTitle = activity.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  a.href = url;
  a.download = `tribely-${safeTitle}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
