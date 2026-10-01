import { beforeEach, describe, expect, it } from "vitest";
import { dismissOnboarding, isOnboardingDismissed } from "@/lib/onboardingDismissal";

describe("onboarding dismissal", () => {
  beforeEach(() => sessionStorage.clear());

  it("is remembered per user for the session (QA-015)", () => {
    expect(isOnboardingDismissed("u1")).toBe(false);
    dismissOnboarding("u1");
    expect(isOnboardingDismissed("u1")).toBe(true);
    expect(isOnboardingDismissed("u2")).toBe(false);
  });
});
