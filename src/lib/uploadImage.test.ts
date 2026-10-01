import { describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));

import { buildUploadPath, uploadImage, UploadError } from "@/lib/uploadImage";

describe("buildUploadPath", () => {
  it("puts the uploader's id first (required by the storage policy)", () => {
    expect(buildUploadPath("user-1", "avatars", "Me.PNG", 42)).toBe("user-1/avatars/42.png");
    expect(buildUploadPath("user-1", "activities", "cover.jpeg", 7)).toBe(
      "user-1/activities/7.jpeg",
    );
  });

  it("sanitizes odd extensions", () => {
    expect(buildUploadPath("u", "avatars", "x.p/n g", 1)).toBe("u/avatars/1.png");
    expect(buildUploadPath("u", "avatars", "noext.", 1)).toBe("u/avatars/1.jpg");
  });
});

describe("uploadImage validation", () => {
  it("rejects non-images and SVG before uploading", async () => {
    const exe = new File(["x"], "huge.exe", { type: "application/octet-stream" });
    const svg = new File(["<svg/>"], "a.svg", { type: "image/svg+xml" });
    await expect(uploadImage(exe, "avatars", "u")).rejects.toBeInstanceOf(UploadError);
    await expect(uploadImage(svg, "avatars", "u")).rejects.toBeInstanceOf(UploadError);
  });

  it("rejects files over 5MB", async () => {
    const big = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "big.png", { type: "image/png" });
    await expect(uploadImage(big, "avatars", "u")).rejects.toThrow("smaller than 5MB");
  });
});
