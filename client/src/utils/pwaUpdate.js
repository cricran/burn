// Helper to register SW with auto update and refresh when a new version is available
export async function setupPWAUpdate() {
  if (!('serviceWorker' in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    if (reg) {
      // Trigger update check on load
      reg.update().catch(() => {});
      // Listen for waiting SW and skip waiting then reload
      if (reg.waiting) {
        reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
      }
      reg.addEventListener('updatefound', () => {
        const sw = reg.installing;
        if (!sw) return;
        sw.addEventListener('statechange', () => {
          if (sw.state === 'installed' && navigator.serviceWorker.controller) {
            // New content available, activate immediately
            sw.postMessage({ type: 'SKIP_WAITING' });
            window.location.reload();
          }
        });
      });
    }
  } catch (_) {}
}
