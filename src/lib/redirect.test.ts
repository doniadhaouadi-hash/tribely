import { describe, expect, it } from "vitest";
import { authLink, safeRedirect } from "@/lib/redirect";

describe("safeRedirect", () => {
  it("keeps same-origin paths (shared activity links survive login)", () => {
    expect(safeRedirect("/?activity=abc")).toBe("/?activity=abc");
  });

  it("falls back for missing or foreign targets", () => {
    expect(safeRedirect(null)).toBe("/?tab=discover");
    expect(safeRedirect("https://evil.example")).toBe("/?tab=discover");
    expect(safeRedirect("//evil.example")).toBe("/?tab=discover");
    expect(safeRedirect("/\\evil.example")).toBe("/?tab=discover");
    expect(safeRedirect("javascript:alert(1)")).toBe("/?tab=discover");
  });
});

describe("authLink", () => {
  it("round-trips through URLSearchParams", () => {
    const link = authLink("/?activity=abc&tab=map");
    const params = new URLSearchParams(link.split("?").slice(1).join("?"));
    expect(params.get("redirect")).toBe("/?activity=abc&tab=map");
  });
});
