// ============================================
// Wake Lock Utility
// ============================================
// Keeps iPad screens awake on music stands.
// Request on session join, auto re-acquire on visibility change.
// Per CONTEXT.md: "iPads on music stands should never sleep. Always on, no user toggle."

let wakeLockSentinel: WakeLockSentinel | null = null;

async function handleVisibilityChange() {
  if (document.visibilityState === "visible" && !wakeLockSentinel) {
    try {
      wakeLockSentinel = await navigator.wakeLock.request("screen");
    } catch {
      // Silently fail — browser may deny in some states (low battery, etc.)
    }
  }
}

export async function requestWakeLock(): Promise<boolean> {
  if (!("wakeLock" in navigator)) return false;
  try {
    wakeLockSentinel = await navigator.wakeLock.request("screen");
    // Re-acquire when page becomes visible again
    // (Wake Lock releases on tab switch or screen lock)
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return true;
  } catch {
    return false;
  }
}

export async function releaseWakeLock(): Promise<void> {
  document.removeEventListener("visibilitychange", handleVisibilityChange);
  if (wakeLockSentinel) {
    await wakeLockSentinel.release();
    wakeLockSentinel = null;
  }
}
