import { useEffect } from 'react';

// Keeps the screen on while `active` is true. The browser releases the lock when the tab
// is hidden, so the hook asks again when the tab becomes visible.
export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return;
    let sentinel: WakeLockSentinel | null = null;
    let cancelled = false;

    const request = async (): Promise<void> => {
      try {
        const lock = await navigator.wakeLock.request('screen');
        if (cancelled) { void lock.release(); return; }
        sentinel = lock;
      } catch {
        // Denied (for example, low battery mode). The brew still works without it.
      }
    };
    const onVisible = (): void => {
      if (document.visibilityState === 'visible') void request();
    };

    void request();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      void sentinel?.release();
    };
  }, [active]);
}
