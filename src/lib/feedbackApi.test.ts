import { beforeEach, describe, expect, it, vi } from "vitest";

const insert = vi.fn();
const upload = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (table: string) => ({ insert: (row: unknown) => insert(table, row) }),
    storage: { from: (bucket: string) => ({ upload: (path: string) => upload(bucket, path) }) },
  },
}));

import { getDeviceId, sendFeedback } from "@/lib/feedbackApi";

const png = () => new File(["x"], "shot.PNG", { type: "image/png" });

describe("sendFeedback (FR-008)", () => {
  beforeEach(() => {
    localStorage.clear();
    insert.mockReset().mockResolvedValue({ error: null });
    upload.mockReset().mockResolvedValue({ error: null });
  });

  it("stores the text with page, app version, device and a stable device id", async () => {
    await sendFeedback({ message: "  Join button does nothing  " });
    const [table, row] = insert.mock.calls[0];
    expect(table).toBe("feedback");
    expect(row).toMatchObject({
      user_id: null,
      message: "Join button does nothing",
      screenshot_path: null,
      app_version: "test",
      device_id: getDeviceId(),
    });
    expect(row.page).toBe(`${window.location.pathname}${window.location.search}`);
    expect(row.user_agent).toContain(navigator.userAgent);
    expect(upload).not.toHaveBeenCalled();
  });

  it("uploads a logged-out screenshot to anon/… and a logged-in one to <uid>/…", async () => {
    await sendFeedback({ message: "a", screenshot: png() });
    expect(upload.mock.calls[0][0]).toBe("feedback-screenshots");
    expect(upload.mock.calls[0][1]).toMatch(/^anon\/feedback\/\d+\.png$/);

    await sendFeedback({ message: "b", screenshot: png(), userId: "u1" });
    expect(upload.mock.calls[1][1]).toMatch(/^u1\/feedback\/\d+\.png$/);
    expect(insert.mock.calls[1][1]).toMatchObject({ user_id: "u1" });
    expect(insert.mock.calls[1][1].screenshot_path).toBe(upload.mock.calls[1][1]);
  });

  it("requires text and rejects non-image screenshots before sending anything", async () => {
    await expect(sendFeedback({ message: "   " })).rejects.toThrow("describe");
    const svg = new File(["<svg/>"], "a.svg", { type: "image/svg+xml" });
    await expect(sendFeedback({ message: "x", screenshot: svg })).rejects.toThrow();
    expect(insert).not.toHaveBeenCalled();
    expect(upload).not.toHaveBeenCalled();
  });

  it("surfaces the server's rate-limit message", async () => {
    insert.mockResolvedValue({ error: { message: "Too much feedback in a short time" } });
    await expect(sendFeedback({ message: "spam" })).rejects.toMatchObject({
      message: "Too much feedback in a short time",
    });
  });
});
