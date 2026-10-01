import { describe, expect, it } from "vitest";
import { errorMessage } from "@/lib/errors";

describe("errorMessage", () => {
  it("reads Error instances", () => {
    expect(errorMessage(new Error("boom"))).toBe("boom");
  });

  it("reads plain PostgREST error objects (e.g. the capacity trigger)", () => {
    expect(errorMessage({ message: "This activity is full", code: "P0001" })).toBe(
      "This activity is full",
    );
  });

  it("falls back for unknown values", () => {
    expect(errorMessage(undefined, "Action failed")).toBe("Action failed");
    expect(errorMessage({ message: "" }, "Action failed")).toBe("Action failed");
  });
});
