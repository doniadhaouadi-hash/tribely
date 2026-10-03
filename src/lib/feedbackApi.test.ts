import { beforeEach, describe, expect, it, vi } from "vitest";

const calls: string[] = [];
const insert = vi.fn();
const upload = vi.fn();
const rpc = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (table: string) => ({
      insert: (row: unknown) => {
        calls.push("insert");
        return insert(table, row);
      },
    }),
    storage: {
      from: (bucket: string) => ({
        upload: (path: string) => {
          calls.push("upload");
          return upload(bucket, path);
        },
      }),
    },
    rpc: (fn: string, args: unknown) => {
      calls.push("rpc");
      return rpc(fn, args);
    },
  },
}));

import { getDeviceId, sendFeedback } from "@/lib/feedbackApi";

const png = () => new File(["x"], "shot.PNG", { type: "image/png" });

describe("sendFeedback (FR-008)", () => {
  beforeEach(() => {
    calls.length = 0;
    localStorage.clear();
    insert.mockReset().mockResolvedValue({ error: null });
    upload.mockReset().mockResolvedValue({ error: null });
    rpc.mockReset().mockResolvedValue({ error: null });
  });

  it("stores the text with page, app version, device and a stable device id", async () => {
    await sendFeedback({ message: "  Join button does nothing  " });
    const [table, row] = insert.mock.calls[0];
    expect(table).toBe("feedback");
    expect(row).toMatchObject({
      user_id: null,
      message: "Join button does nothing",
      app_version: "test",
      device_id: getDeviceId(),
    });
    expect(row.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(row.page).toBe(`${window.location.pathname}${window.location.search}`);
    expect(row.user_agent).toContain(navigator.userAgent);
    expect(upload).not.toHaveBeenCalled();
  });

  it("logged in: uploads to <uid>/feedback/… and then inserts with the path", async () => {
    const result = await sendFeedback({ message: "b", screenshot: png(), userId: "u1" });
    expect(calls).toEqual(["upload", "insert"]);
    expect(upload.mock.calls[0][0]).toBe("feedback-screenshots");
    expect(upload.mock.calls[0][1]).toMatch(/^u1\/feedback\/\d+\.png$/);
    expect(insert.mock.calls[0][1]).toMatchObject({
      user_id: "u1",
      screenshot_path: upload.mock.calls[0][1],
    });
    expect(result.screenshotSaved).toBe(true);
  });

  it("logged out (QA-039): insert first, then upload to anon/<feedback id>/… and attach", async () => {
    const result = await sendFeedback({ message: "a", screenshot: png() });
    expect(calls).toEqual(["insert", "upload", "rpc"]);
    const id = insert.mock.calls[0][1].id;
    const path = upload.mock.calls[0][1];
    expect(path.startsWith(`anon/${id}/`)).toBe(true);
    expect(path).toMatch(/\/\d+\.png$/);
    expect(rpc).toHaveBeenCalledWith("attach_feedback_screenshot", { _feedback_id: id, _path: path });
    expect(result.screenshotSaved).toBe(true);
  });

  it("logged out: keeps the text if the screenshot can't be attached", async () => {
    upload.mockResolvedValue({ error: { message: "new row violates row-level security policy" } });
    const result = await sendFeedback({ message: "a", screenshot: png() });
    expect(insert).toHaveBeenCalledTimes(1);
    expect(result.screenshotSaved).toBe(false);
  });

  it("requires text and rejects non-image screenshots before sending anything", async () => {
    await expect(sendFeedback({ message: "   " })).rejects.toThrow("describe");
    const svg = new File(["<svg/>"], "a.svg", { type: "image/svg+xml" });
    await expect(sendFeedback({ message: "x", screenshot: svg })).rejects.toThrow();
    expect(calls).toEqual([]);
  });

  it("surfaces the server's rate-limit message", async () => {
    insert.mockResolvedValue({ error: { message: "Too much feedback in a short time" } });
    await expect(sendFeedback({ message: "spam" })).rejects.toMatchObject({
      message: "Too much feedback in a short time",
    });
  });
});
