import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "../..");
const manifest = JSON.parse(readFileSync(resolve(root, "public/manifest.webmanifest"), "utf8"));
const indexHtml = readFileSync(resolve(root, "index.html"), "utf8");
const vercel = JSON.parse(readFileSync(resolve(root, "vercel.json"), "utf8"));

describe("PWA setup (FR-007)", () => {
  it("has the fields Chrome needs to offer installation", () => {
    expect(manifest.name).toBe("Tribely");
    expect(manifest.short_name).toBeTruthy();
    expect(manifest.start_url).toBe("/?tab=discover");
    expect(manifest.display).toBe("standalone");
    expect(manifest.theme_color).toMatch(/^#/);
    expect(manifest.background_color).toMatch(/^#/);
  });

  it("lists 192 and 512 icons, normal and maskable, that exist in /public", () => {
    const sizes = (purpose: string) =>
      manifest.icons.filter((i: { purpose: string }) => i.purpose === purpose).map((i: { sizes: string }) => i.sizes);
    expect(sizes("any")).toEqual(expect.arrayContaining(["192x192", "512x512"]));
    expect(sizes("maskable")).toEqual(expect.arrayContaining(["192x192", "512x512"]));
    for (const icon of manifest.icons) {
      expect(existsSync(resolve(root, "public", icon.src.replace(/^\//, "")))).toBe(true);
    }
  });

  it("is linked from index.html with the iOS home-screen tags", () => {
    expect(indexHtml).toContain('<link rel="manifest" href="/manifest.webmanifest" />');
    expect(indexHtml).toContain('name="apple-mobile-web-app-capable" content="yes"');
    expect(indexHtml).toContain('name="apple-mobile-web-app-title" content="Tribely"');
  });

  it("is served as application/manifest+json on Vercel", () => {
    const rule = vercel.headers.find((h: { source: string }) => h.source === "/manifest.webmanifest");
    expect(rule.headers).toContainEqual({ key: "Content-Type", value: "application/manifest+json" });
  });
});
