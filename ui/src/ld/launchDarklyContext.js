const STORAGE_KEY = "ld-anonymous-context-key";

/**
 * Stable anonymous LaunchDarkly context so targeting stays consistent across visits.
 * @see https://docs.launchdarkly.com/sdk/features/contexts
 */
export function getLaunchDarklyContext() {
  let key = null;
  try {
    key = localStorage.getItem(STORAGE_KEY);
  } catch {
    /* private mode or storage unavailable */
  }
  if (!key) {
    key =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `anon-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    try {
      localStorage.setItem(STORAGE_KEY, key);
    } catch {
      /* ignore */
    }
  }
  return { kind: "user", key, anonymous: true };
}
