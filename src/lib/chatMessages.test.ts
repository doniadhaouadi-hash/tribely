import { describe, expect, it } from "vitest";
import type { ChatMessage } from "@/lib/chatApi";
import {
  makePendingMessage,
  mergeServerMessage,
  resolvePending,
  setPendingState,
} from "@/lib/chatMessages";

const author = { display_name: "Ana", avatar_url: null };
const server = (id: string, body: string, at: string, user_id = "me"): ChatMessage => ({
  id,
  activity_id: "a1",
  user_id,
  body,
  created_at: at,
});

describe("chat message merging (QA-034)", () => {
  it("shows our message immediately and swaps in the saved row", () => {
    const pending = makePendingMessage("a1", "me", "Hi!", author, new Date("2026-10-03T10:00:00Z"));
    let list: ChatMessage[] = [pending];
    expect(list[0].pending).toBe(true);

    list = resolvePending(list, pending.clientId!, server("s1", "Hi!", "2026-10-03T10:00:01Z"));
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ id: "s1", body: "Hi!" });
    expect(list[0].pending).toBeUndefined();
  });

  it("never duplicates when realtime and the insert response both arrive (either order)", () => {
    const pending = makePendingMessage("a1", "me", "Hi!", author);
    const saved = server("s1", "Hi!", "2026-10-03T10:00:01Z");

    // realtime first, then response
    let a: ChatMessage[] = [pending];
    a = mergeServerMessage(a, saved);
    a = resolvePending(a, pending.clientId!, saved);
    expect(a.map((m) => m.id)).toEqual(["s1"]);
    expect(a[0].author).toEqual(author);

    // response first, then realtime
    let b: ChatMessage[] = [pending];
    b = resolvePending(b, pending.clientId!, saved);
    b = mergeServerMessage(b, saved);
    expect(b.map((m) => m.id)).toEqual(["s1"]);
  });

  it("appends other people's messages in time order without reloading", () => {
    const list = [server("s1", "a", "2026-10-03T10:00:00Z"), server("s3", "c", "2026-10-03T10:02:00Z")];
    const out = mergeServerMessage(list, server("s2", "b", "2026-10-03T10:01:00Z", "other"));
    expect(out.map((m) => m.id)).toEqual(["s1", "s2", "s3"]);
  });

  it("marks a failed message and lets it go back to pending for a retry", () => {
    const pending = makePendingMessage("a1", "me", "Hi!", author);
    const failed = setPendingState([pending], pending.clientId!, { pending: false, failed: true });
    expect(failed[0]).toMatchObject({ pending: false, failed: true, body: "Hi!" });
    const retrying = setPendingState(failed, pending.clientId!, { pending: true, failed: false });
    expect(retrying[0]).toMatchObject({ pending: true, failed: false });
  });
});
