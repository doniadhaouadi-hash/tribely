export const TAB_KEYS = ["discover", "map", "create", "chat", "you"] as const;
export type TabKey = (typeof TAB_KEYS)[number];

export const isTabKey = (v: string | null): v is TabKey =>
  !!v && (TAB_KEYS as readonly string[]).includes(v);
