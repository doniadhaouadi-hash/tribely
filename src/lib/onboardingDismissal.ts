// Remembers "not now" on the onboarding sheet for the rest of the browser
// session, so it doesn't pop up again on every visit to the You tab.
const key = (userId: string) => `tribely:onboarding-dismissed:${userId}`;

export const isOnboardingDismissed = (userId: string) => {
  try {
    return sessionStorage.getItem(key(userId)) === "1";
  } catch {
    return false;
  }
};

export const dismissOnboarding = (userId: string) => {
  try {
    sessionStorage.setItem(key(userId), "1");
  } catch {
    // storage unavailable (private mode etc.) — dismissal lasts until reload
  }
};
