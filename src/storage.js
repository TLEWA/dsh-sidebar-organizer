/* Persistent per-scope layout state (v3). */

const STATE_VERSION = 3;
let layoutCache = null;
let dragCache = null;

function emptyScopeLayout() {
  return { order: [], hidden: [] };
}

function emptyLayoutState() {
  return { version: STATE_VERSION, scopes: {} };
}

function normalizeStringList(value) {
  if (!Array.isArray(value)) return [];
  const out = [];
  for (const item of value) {
    if (typeof item !== "string" || !item) continue;
    if (out.indexOf(item) === -1) out.push(item);
  }
  return out;
}

function normalizeScopeLayout(value) {
  const raw = value && typeof value === "object" ? value : {};
  const order = normalizeStringList(raw.order);
  const hidden = normalizeStringList(raw.hidden).filter((id) => order.indexOf(id) !== -1);
  return { order, hidden };
}

function normalizeLayoutState(value) {
  const state = emptyLayoutState();
  if (!value || typeof value !== "object") return state;

  // v3 shape.
  if (value.scopes && typeof value.scopes === "object") {
    for (const scope of SCOPE_KEYS) {
      const next = normalizeScopeLayout(value.scopes[scope]);
      if (next.order.length || next.hidden.length) state.scopes[scope] = next;
    }
    return state;
  }

  // v2 (and pre-rename legacy) shape: one flat sidebar layout.
  if (Array.isArray(value.order) || Array.isArray(value.hidden)) {
    const migrated = normalizeScopeLayout(value);
    if (migrated.order.length || migrated.hidden.length) state.scopes.sidebar = migrated;
  }
  return state;
}

function readState() {
  if (layoutCache) return layoutCache;
  let parsed = null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      parsed = JSON.parse(raw);
    } else {
      const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacy) {
        parsed = JSON.parse(legacy);
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
        } catch (err) {
          /* ignore quota / privacy errors */
        }
      }
    }
  } catch (err) {
    parsed = null;
  }
  layoutCache = normalizeLayoutState(parsed);
  return layoutCache;
}

function cloneState(state) {
  const next = emptyLayoutState();
  for (const scope of SCOPE_KEYS) {
    const raw = state.scopes[scope];
    if (!raw) continue;
    next.scopes[scope] = { order: raw.order.slice(), hidden: raw.hidden.slice() };
  }
  return next;
}

function writeState(state) {
  layoutCache = cloneState(state);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(layoutCache));
  } catch (err) {
    /* storage may be unavailable; keep the in-memory copy */
  }
}

function readScope(scope) {
  const state = readState();
  const raw = state.scopes[scope];
  return raw ? { order: raw.order.slice(), hidden: raw.hidden.slice() } : emptyScopeLayout();
}

function writeScope(scope, layout) {
  const state = cloneState(readState());
  const next = normalizeScopeLayout(layout);
  if (next.order.length || next.hidden.length) state.scopes[scope] = next;
  else delete state.scopes[scope];
  writeState(state);
}

function resetScopeState(scope) {
  const state = cloneState(readState());
  delete state.scopes[scope];
  writeState(state);
}

// A one-time migration ledger, separate from the layout: a scope that was
// repaired once must not be repaired again, otherwise a deliberate "move to
// the end" would be undone on every page load.
function readRepairState() {
  try {
    const raw = window.localStorage.getItem(REPAIR_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (err) {
    return {};
  }
}

function isScopeRepaired(scope) {
  return readRepairState()[scope] === true;
}

function markScopeRepaired(scope) {
  const state = readRepairState();
  state[scope] = true;
  try {
    window.localStorage.setItem(REPAIR_KEY, JSON.stringify(state));
  } catch (err) {
    /* storage may be unavailable; the in-memory pass still gets a clean order */
  }
}

// Per-section drag toggles live separately from the layout. "Reset layout"
// must not silently re-enable a section the user deliberately locked.
function readDragState() {
  if (dragCache) return dragCache;
  const state = {};
  for (const scope of SCOPE_KEYS) state[scope] = true;
  try {
    const raw = window.localStorage.getItem(DRAG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        for (const scope of SCOPE_KEYS) {
          if (parsed[scope] === false) state[scope] = false;
        }
      }
    }
  } catch (err) {
    /* storage may be unavailable; default to enabled */
  }
  dragCache = state;
  return dragCache;
}

function readDragEnabled(scope) {
  if (SCOPE_KEYS.indexOf(scope) === -1) return false;
  return readDragState()[scope] !== false;
}

function writeDragEnabled(scope, enabled) {
  if (SCOPE_KEYS.indexOf(scope) === -1) return false;
  const next = {};
  const current = readDragState();
  for (const key of SCOPE_KEYS) next[key] = key === scope ? Boolean(enabled) : current[key] !== false;
  dragCache = next;
  try {
    window.localStorage.setItem(DRAG_KEY, JSON.stringify(next));
  } catch (err) {
    /* keep the in-memory copy */
  }
  return true;
}

function forgetLayout() {
  layoutCache = null;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    // A legacy flat layout would otherwise be migrated straight back in on the
    // next read, making "reset" appear to do nothing.
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch (err) {
    /* ignore */
  }
}

function isSameOrder(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function setOrder(element, value) {
  if (!element) return;
  const next = String(value);
  if (element.style.order !== next) element.style.order = next;
}
