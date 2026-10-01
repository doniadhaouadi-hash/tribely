// After a deploy, tabs that still run the old version request chunk files
// that no longer exist (QA-025). Reload once to pick up the new version; the
// sessionStorage guard prevents a reload loop if the chunk is really broken.
const KEY = "tribely:chunk-reload-at";
const MIN_INTERVAL_MS = 10_000;

export const shouldReloadForStaleChunk = (now = Date.now()) => {
  try {
    const last = Number(sessionStorage.getItem(KEY) ?? 0);
    if (now - last < MIN_INTERVAL_MS) return false;
    sessionStorage.setItem(KEY, String(now));
    return true;
  } catch {
    return false;
  }
};

export const installStaleChunkReload = () => {
  window.addEventListener("vite:preloadError", (event) => {
    if (shouldReloadForStaleChunk()) {
      event.preventDefault();
      window.location.reload();
    }
  });
};
