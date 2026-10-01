import { describe, expect, it } from "vitest";
import { isTabKey } from "@/lib/tabs";

describe("isTabKey", () => {
  it("accepts known tabs only", () => {
    expect(isTabKey("discover")).toBe(true);
    expect(isTabKey("you")).toBe(true);
    expect(isTabKey("admin")).toBe(false);
    expect(isTabKey(null)).toBe(false);
  });
});
