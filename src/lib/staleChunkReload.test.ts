import { beforeEach, describe, expect, it } from "vitest";
import { shouldReloadForStaleChunk } from "@/lib/staleChunkReload";

describe("shouldReloadForStaleChunk (QA-025)", () => {
  beforeEach(() => sessionStorage.clear());

  it("reloads once, then not again within 10 s (no reload loop)", () => {
    expect(shouldReloadForStaleChunk(1_000_000)).toBe(true);
    expect(shouldReloadForStaleChunk(1_005_000)).toBe(false);
    expect(shouldReloadForStaleChunk(1_011_000)).toBe(true);
  });
});
