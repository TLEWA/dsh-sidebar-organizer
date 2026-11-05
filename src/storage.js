/* Persistent per-scope layout state (v3). */

const STATE_VERSION = 3;
const EXPORT_FORMAT = "dsh-sidebar-organizer";
const EXPORT_FILENAME = "dsh-sidebar-organizer.json";
// 0.4.x shares STORAGE_KEY but only understands the flat sidebar layout: loading
// that build rewrites the key as {version:2,order,hidden}, dropping every other
// scope and the tucked rows. Keep a full snapshot beside it so the next 0.5.x
// load can put the configuration back instead of losing it for good.
const LAYOUT_BACKUP_KEY = `${STORAGE_KEY}.v3-backup`;
let layoutCache = null;
let dragCache = null;
let hotkeyCache = null;
let contextMenuCache = null;

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
  layoutCache = restoreFromBackup(parsed) || normalizeLayoutState(parsed);
  return layoutCache;
}

// Returns a restored state when the primary key was degraded to the flat
// sidebar shape by an older build but our own multi-scope snapshot survived.
function restoreFromBackup(parsed) {
  if (!parsed || typeof parsed !== "object" || parsed.scopes) return null;
  if (!Array.isArray(parsed.order) && !Array.isArray(parsed.hidden)) return null;
  let backup = null;
  try {
    const raw = window.localStorage.getItem(LAYOUT_BACKUP_KEY);
    if (raw) backup = JSON.parse(raw);
  } catch (err) {
    return null;
  }
  if (!backup || typeof backup !== "object" || !backup.scopes) return null;
  const state = normalizeLayoutState(backup);
  // Only rescuing the sidebar would rewind a deliberate reset made in the older
  // build; the loss worth undoing is the scopes that build cannot represent.
  if (!Object.keys(state.scopes).some((scope) => scope !== "sidebar")) return null;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    /* keep the restored copy in memory */
  }
  return state;
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
  const serialized = JSON.stringify(layoutCache);
  try {
    window.localStorage.setItem(STORAGE_KEY, serialized);
    window.localStorage.setItem(LAYOUT_BACKUP_KEY, serialized);
  } catch (err) {
    /* storage may be unavailable; keep the in-memory copy */
  }
}

// The portable shape shared with the host copy: the six-scope layout plus the
// per-section drag switches, without the local-only bookkeeping.
function stateSnapshot() {
  const state = cloneState(readState());
  const dragState = readDragState();
  const drag = {};
  for (const scope of SCOPE_KEYS) drag[scope] = dragState[scope] !== false;
  return { version: STATE_VERSION, scopes: state.scopes, drag };
}

function hasLayoutContent(value) {
  const scopes = value && typeof value === "object" ? value.scopes : null;
  if (!scopes || typeof scopes !== "object" || Array.isArray(scopes)) return false;
  for (const key of Object.keys(scopes)) {
    const scope = scopes[key];
    if (scope && Array.isArray(scope.order) && scope.order.length) return true;
    if (scope && Array.isArray(scope.hidden) && scope.hidden.length) return true;
  }
  return false;
}

function readScope(scope) {
  const state = readState();
  const raw = state.scopes[scope];
  return raw ? { order: raw.order.slice(), hidden: raw.hidden.slice() } : emptyScopeLayout();
}

function writeScope(scope, layout, options) {
  const state = cloneState(readState());
  const next = normalizeScopeLayout(layout);
  if (next.order.length || next.hidden.length) state.scopes[scope] = next;
  else delete state.scopes[scope];
  writeState(state);
  noteLocalChange(options);
}

// True once this origin holds a layout the user arranged on purpose. The
// projection pass records the host's default order on every boot too; without
// this flag a freshly opened window cannot tell that from a real drag and would
// publish its defaults over the layout the other window is showing.
function isLayoutCustomized() {
  try {
    return Number(window.localStorage.getItem(CUSTOMIZED_KEY)) > 0;
  } catch (err) {
    return false;
  }
}

function markLayoutCustomized() {
  try {
    window.localStorage.setItem(CUSTOMIZED_KEY, String(Date.now()));
  } catch (err) {
    /* storage may be unavailable */
  }
}

// Cross-window sharing is on unless the user turned it off in the settings page.
function isCrossWindowEnabled() {
  try {
    return window.localStorage.getItem(CROSS_WINDOW_KEY) !== "0";
  } catch (err) {
    return true;
  }
}

function writeCrossWindowEnabled(enabled) {
  try {
    window.localStorage.setItem(CROSS_WINDOW_KEY, enabled ? "1" : "0");
  } catch (err) {
    /* storage may be unavailable */
  }
}

// The drag hotkey is local to this origin: it is a keyboard device preference,
// not part of the shared layout, so it never travels through the host copy.
function normalizeHotkey(value) {
  const raw = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const code = typeof raw.code === "string" ? raw.code.slice(0, 64) : "";
  return {
    code: code,
    key: typeof raw.key === "string" ? raw.key.slice(0, 24) : "",
    ctrl: !!raw.ctrl,
    alt: !!raw.alt,
    shift: !!raw.shift,
    meta: !!raw.meta,
    hold: !!raw.hold,
    toggle: !!raw.toggle,
  };
}

function readHotkey() {
  if (hotkeyCache) return hotkeyCache;
  let parsed = null;
  try {
    const raw = window.localStorage.getItem(HOTKEY_KEY);
    if (raw) parsed = JSON.parse(raw);
  } catch (err) {
    parsed = null;
  }
  hotkeyCache = normalizeHotkey(parsed);
  return hotkeyCache;
}

function writeHotkey(value) {
  hotkeyCache = normalizeHotkey(value);
  try {
    window.localStorage.setItem(HOTKEY_KEY, JSON.stringify(hotkeyCache));
  } catch (err) {
    /* keep the in-memory copy */
  }
  return hotkeyCache;
}

function resetScopeState(scope) {
  const state = cloneState(readState());
  delete state.scopes[scope];
  writeState(state);
  noteLocalChange({ user: true, reset: true });
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
  noteLocalChange({ user: true });
  return true;
}

// The exported file is a self-contained snapshot of everything the user
// configured: the six-scope layout plus the per-section drag switches. The
// repair ledger and the disabled kill switch are local runtime bookkeeping and
// deliberately stay out of it.
function readHostActions() {
  try {
    const raw = window.localStorage.getItem(HOST_ACTION_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const out = {};
    for (const key of Object.keys(parsed)) {
      const info = parsed[key];
      if (!key || !info || typeof info.label !== "string") continue;
      out[key] = { label: info.label, icon: typeof info.icon === "string" ? info.icon : "" };
    }
    return out;
  } catch (err) {
    return {};
  }
}

function writeHostActions(map) {
  try {
    window.localStorage.setItem(HOST_ACTION_KEY, JSON.stringify(map || {}));
  } catch (err) {
    /* storage may be unavailable */
  }
}

function readHostMenuOrder() {
  try {
    const raw = window.localStorage.getItem(HOST_MENU_ORDER_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const out = [];
    for (const label of parsed) {
      if (typeof label === "string" && label && out.indexOf(label) === -1) out.push(label);
    }
    return out;
  } catch (err) {
    return [];
  }
}

function writeHostMenuOrder(labels) {
  try {
    window.localStorage.setItem(HOST_MENU_ORDER_KEY, JSON.stringify(labels || []));
  } catch (err) {
    /* storage may be unavailable */
  }
}

/* ---- 0.2.2 right-click menus ------------------------------------------- */

// The menu rows belong to the host (and to other plugins); what is ours is the
// custom order and the dividers. Both live here, per menu kind, and are painted
// onto the open DOM. `dividers` holds GAP indexes: gap N means "before the Nth
// row of the saved order", so a divider keeps its place when rows move past it.
//
// Deliberately no noteLocalChange(): that marks the layout as customized and
// publishes it to the other windows, which this file must not do for a menu-only
// change (it would push the registered default order over a custom layout).
function emptyContextMenuLayout() {
  return { order: [], dividers: [], customized: false };
}

function normalizeContextMenuLayout(value) {
  const raw = value && typeof value === "object" ? value : {};
  const order = normalizeStringList(raw.order);
  const dividers = [];
  if (Array.isArray(raw.dividers)) {
    for (const gap of raw.dividers) {
      if (typeof gap !== "number" || !isFinite(gap)) continue;
      const next = Math.max(0, Math.floor(gap));
      if (dividers.indexOf(next) === -1) dividers.push(next);
    }
  }
  dividers.sort((a, b) => a - b);
  return { order, dividers, customized: raw.customized === true };
}

function readContextMenuStore() {
  if (contextMenuCache) return contextMenuCache;
  let parsed = null;
  try {
    const raw = window.localStorage.getItem(CONTEXT_MENU_KEY);
    if (raw) parsed = JSON.parse(raw);
  } catch (err) {
    parsed = null;
  }
  const store = { version: CONTEXT_MENU_VERSION, enabled: true, menus: {} };
  if (parsed && typeof parsed === "object") {
    if (parsed.enabled === false) store.enabled = false;
    if (parsed.menus && typeof parsed.menus === "object") {
      for (const kind of CONTEXT_MENU_KINDS) {
        if (!parsed.menus[kind]) continue;
        store.menus[kind] = normalizeContextMenuLayout(parsed.menus[kind]);
      }
    }
  }
  contextMenuCache = store;
  return store;
}

function writeContextMenuStore(store) {
  const next = {
    version: CONTEXT_MENU_VERSION,
    enabled: store.enabled !== false,
    menus: {},
  };
  for (const kind of CONTEXT_MENU_KINDS) {
    if (store.menus[kind]) next.menus[kind] = normalizeContextMenuLayout(store.menus[kind]);
  }
  contextMenuCache = next;
  try {
    window.localStorage.setItem(CONTEXT_MENU_KEY, JSON.stringify(next));
  } catch (err) {
    /* keep the in-memory copy */
  }
  return next;
}

function readContextMenuLayout(kind) {
  if (CONTEXT_MENU_KINDS.indexOf(kind) === -1) return emptyContextMenuLayout();
  const store = readContextMenuStore();
  return store.menus[kind] ? normalizeContextMenuLayout(store.menus[kind]) : emptyContextMenuLayout();
}

function writeContextMenuLayout(kind, layout) {
  if (CONTEXT_MENU_KINDS.indexOf(kind) === -1) return emptyContextMenuLayout();
  const store = readContextMenuStore();
  const menus = Object.assign({}, store.menus);
  menus[kind] = normalizeContextMenuLayout(layout);
  writeContextMenuStore({ version: store.version, enabled: store.enabled, menus });
  return menus[kind];
}

function readContextMenuEnabled() {
  return readContextMenuStore().enabled !== false;
}

function writeContextMenuEnabled(enabled) {
  const store = readContextMenuStore();
  writeContextMenuStore({ version: store.version, enabled: Boolean(enabled), menus: store.menus });
  return Boolean(enabled);
}

function resetContextMenuLayouts() {
  const store = readContextMenuStore();
  writeContextMenuStore({ version: store.version, enabled: store.enabled, menus: {} });
}

function exportConfigSnapshot() {
  const state = cloneState(readState());
  const dragState = readDragState();
  const drag = {};
  for (const scope of SCOPE_KEYS) drag[scope] = dragState[scope] !== false;
  return {
    format: EXPORT_FORMAT,
    version: STATE_VERSION,
    exportedAt: new Date().toISOString(),
    scopes: state.scopes,
    drag,
  };
}

// Import replaces the whole configuration at once. A file from another version
// or with a missing layout block is rejected whole; half-applying a different
// shape would scatter the user's rows across the page.
function importConfigSnapshot(value) {
  let raw = value;
  if (typeof raw === "string") {
    try {
      raw = JSON.parse(raw);
    } catch (err) {
      return { ok: false, reason: "json" };
    }
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, reason: "json" };
  }
  if (raw.version !== STATE_VERSION) {
    return { ok: false, reason: "version" };
  }
  if (!raw.scopes || typeof raw.scopes !== "object" || Array.isArray(raw.scopes)) {
    return { ok: false, reason: "shape" };
  }

  const state = normalizeLayoutState(raw);
  writeState(state);

  const source = raw.drag && typeof raw.drag === "object" && !Array.isArray(raw.drag) ? raw.drag : {};
  const drag = {};
  for (const scope of SCOPE_KEYS) drag[scope] = source[scope] !== false;
  dragCache = drag;
  try {
    window.localStorage.setItem(DRAG_KEY, JSON.stringify(drag));
  } catch (err) {
    /* keep the in-memory copy */
  }

  // An imported order is an explicit snapshot. Mark every scope as repaired so
  // the one-shot 0.5.4 migration cannot reorder it on the next projection pass.
  for (const scope of SCOPE_KEYS) markScopeRepaired(scope);

  noteLocalChange({ user: true });
  return { ok: true, scopes: Object.keys(state.scopes).length };
}

function forgetLayout() {
  layoutCache = null;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(LAYOUT_BACKUP_KEY);
    // A legacy flat layout would otherwise be migrated straight back in on the
    // next read, making "reset" appear to do nothing.
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch (err) {
    /* ignore */
  }
  // Tell the host copy too, otherwise the other window keeps showing the layout
  // this reset just removed.
  noteLocalChange({ reset: true, user: true });
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
