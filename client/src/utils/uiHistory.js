// Simple UI history stack to make the back button close UI layers (modals, drawers)
// before navigating between routes.

let stack = [];
let initialized = false;
let idCounter = 0;
let lastHandledId = null;

function ensureInit() {
  if (initialized) return;
  // Single global popstate listener
  window.addEventListener('popstate', () => {
    const token = stack.pop();
    if (!token) return;
    lastHandledId = token.id;
    if (typeof token.onBack === 'function') {
      try { token.onBack(); } catch (e) {}
    }
  });
  initialized = true;
}

// Open a UI layer: pushes a history state and registers a back handler.
export function openLayer(onBack) {
  ensureInit();
  const token = { id: ++idCounter, onBack };
  try {
    // Push a state without changing the URL
  window.history.pushState({ __uiLayer: true, id: token.id }, '');
  } catch (_) {
    // ignore
  }
  stack.push(token);
  return token;
}

// Programmatically trigger the last UI layer to close via history.back().
export function closeTop() {
  if (stack.length > 0) {
    try {
      window.history.back();
    } catch (_) {
      // ignore
    }
  }
}

// Discard a token without navigating (used on unmount); does not modify browser history.
export function discard(token) {
  const idx = stack.findIndex(t => t === token);
  if (idx !== -1) {
    stack.splice(idx, 1);
  }
}

// Expose stack length for debugging or conditional UI.
export function getDepth() {
  return stack.length;
}

// Optional: clear the top entry without navigating (useful if a modal closes itself
// programmatically after calling closeTop, to avoid double back presses if popstate
// wasn’t delivered for some reason).
export function clearTopIfHandled() {
  if (stack.length && stack[stack.length - 1].id === lastHandledId) {
    stack.pop();
  }
}
