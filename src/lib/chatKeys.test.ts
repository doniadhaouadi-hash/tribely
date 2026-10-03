import { describe, expect, it } from "vitest";
import { shouldSendOnEnter } from "@/lib/chatKeys";

describe("shouldSendOnEnter (QA-035)", () => {
  const enter = { key: "Enter", shiftKey: false, keyCode: 13, isComposing: false };

  it("sends on plain Enter with a physical keyboard", () => {
    expect(shouldSendOnEnter(enter, false)).toBe(true);
  });

  it("ignores Enter while a word is being composed (Gboard/Samsung/IME)", () => {
    expect(shouldSendOnEnter({ ...enter, isComposing: true }, false)).toBe(false);
    expect(shouldSendOnEnter({ ...enter, keyCode: 229 }, false)).toBe(false);
  });

  it("Shift+Enter and touch keyboards insert a line break instead", () => {
    expect(shouldSendOnEnter({ ...enter, shiftKey: true }, false)).toBe(false);
    expect(shouldSendOnEnter(enter, true)).toBe(false);
  });

  it("ignores other keys", () => {
    expect(shouldSendOnEnter({ ...enter, key: "a" }, false)).toBe(false);
  });
});
