/* Persistent per-scope layout state (v3). */

// v4 adds per-scope id aliases: a row whose label carries a live count or
// status ("IP 防护：0 个黑洞") keeps the id it was first saved under instead of
// becoming an orphan every time the number changes.
const STATE_VERSION = 4;
const PREVIOUS_STATE_VERSION = 3;
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
let rowMenuCache = null;
// The raw string the cache was parsed from, so another window writing the key
// invalidates the copy instead of being silently ignored.
let rowMenuCacheRaw = null;

function emptyScopeLayout() {
  return { order: [], hidden: [] };
}

function emptyLayoutState() {
  return { version: STATE_VERSION, scopes: {}, aliases: {} };
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

// Aliases bind a label fingerprint to the id a row was saved under, so the
// saved order survives a host rename/count change. Corrupt values are dropped
// rather than trusted: a non-string id here would silently disable hiding.
function normalizeAliases(value) {
  const out = {};
  if (!value || typeof value !== "object" || Array.isArray(value)) return out;
  for (const key of Object.keys(value)) {
    const id = value[key];
    if (!key || typeof id !== "string" || !id) continue;
    out[key] = id;
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
    const aliases = value.aliases && typeof value.aliases === "object" && !Array.isArray(value.aliases) ? value.aliases : {};
    for (const scope of Object.keys(aliases)) {
      const next = normalizeAliases(aliases[scope]);
      if (Object.keys(next).length) state.aliases[scope] = next;
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

function parseStoredState(raw) {
  if (!raw) return { status: "missing" };
  try {
    const parsed = JSON.parse(raw);
    return { status: "ok", parsed, state: normalizeLayoutState(parsed) };
  } catch (err) {
    return { status: "corrupt", raw, error: err };
  }
}

// Keep the raw value under a key writeState never touches, so a reset cannot
// destroy the only evidence of what went wrong.
function keepCorruptValue(baseKey, raw) {
  const stamp = Date.now();
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const key = `${baseKey}.corrupt-${stamp + attempt}`;
    try {
      window.localStorage.setItem(key, raw);
      return key;
    } catch (err) {
      // Quota or privacy errors will not get better under another name.
      return null;
    }
  }
  return null;
}

function warnCorruptLayout(message) {
  try {
    console.warn("[dsh-sidebar-organizer] " + message);
  } catch (err) {
    /* console may be unavailable */
  }
}

function recoverFromCorruptPrimary(raw) {
  let backup = { status: "missing" };
  try {
    backup = parseStoredState(window.localStorage.getItem(LAYOUT_BACKUP_KEY));
  } catch (err) {
    /* storage may be unavailable */
  }
  // The backup is a full snapshot written beside every save; prefer it over
  // wiping every scope and alias because the primary key lost a byte.
  if (backup.status === "ok") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(backup.state));
    } catch (err) {
      /* keep the restored copy in memory */
    }
    warnCorruptLayout("layout store was corrupt; restored the backup copy");
    layoutCache = backup.state;
    return layoutCache;
  }
  const primaryKey = keepCorruptValue(STORAGE_KEY, raw);
  let backupKey = null;
  if (backup.status === "corrupt") backupKey = keepCorruptValue(LAYOUT_BACKUP_KEY, backup.raw);
  warnCorruptLayout(
    "layout store is corrupt and the backup is unusable; resetting" +
      (primaryKey ? " (kept as " + primaryKey + ")" : "") +
      (backupKey ? " (backup kept as " + backupKey + ")" : "")
  );
  layoutCache = emptyLayoutState();
  return layoutCache;
}

function readState() {
  if (layoutCache) return layoutCache;
  let primary = { status: "missing" };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      primary = parseStoredState(raw);
    } else {
      const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacy) {
        primary = parseStoredState(legacy);
        if (primary.status === "ok") {
          try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(primary.parsed));
          } catch (err) {
            /* ignore quota / privacy errors */
          }
        }
      }
    }
  } catch (err) {
    /* localStorage unavailable; behave like an empty store */
  }
  if (primary.status === "corrupt") return recoverFromCorruptPrimary(primary.raw);
  if (primary.status !== "ok") {
    layoutCache = emptyLayoutState();
    return layoutCache;
  }
  layoutCache = restoreFromBackup(primary.parsed) || primary.state;
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
  const aliases = state.aliases && typeof state.aliases === "object" ? state.aliases : {};
  for (const scope of Object.keys(aliases)) {
    next.aliases[scope] = normalizeAliases(aliases[scope]);
  }
  return next;
}

function backupStillHasLayout() {
  try {
    const raw = window.localStorage.getItem(LAYOUT_BACKUP_KEY);
    if (!raw) return false;
    return hasLayoutContent(JSON.parse(raw));
  } catch (err) {
    return false;
  }
}

function writeState(state) {
  layoutCache = cloneState(state);
  const serialized = JSON.stringify(layoutCache);
  try {
    window.localStorage.setItem(STORAGE_KEY, serialized);
    // A failed read can hand us an empty state; trading the safety copy for it
    // would erase the last recoverable layout. A real layout (or no backup at
    // all) refreshes the backup.
    if (hasLayoutContent(layoutCache) || !backupStillHasLayout()) {
      window.localStorage.setItem(LAYOUT_BACKUP_KEY, serialized);
    }
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
  return { version: STATE_VERSION, scopes: state.scopes, aliases: state.aliases, drag };
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

function readAliases(scope) {
  const state = readState();
  const raw = state.aliases && state.aliases[scope];
  return raw ? { ...raw } : {};
}

function writeAliases(scope, aliases) {
  const state = cloneState(readState());
  const next = normalizeAliases(aliases);
  if (Object.keys(next).length) state.aliases[scope] = next;
  else delete state.aliases[scope];
  writeState(state);
}

function writeScope(scope, layout, options) {
  const state = cloneState(readState());
  const next = normalizeScopeLayout(layout);
  if (next.order.length || next.hidden.length) state.scopes[scope] = next;
  else delete state.scopes[scope];
  // Callers that reorder/hide rows pass only order+hidden; the alias table is
  // bookkeeping they know nothing about, so it survives unless explicitly set.
  if (layout && layout.aliases) {
    const aliases = normalizeAliases(layout.aliases);
    if (Object.keys(aliases).length) state.aliases[scope] = aliases;
    else delete state.aliases[scope];
  }
  writeState(state);
  // A layout the user arranged by hand is never "repaired" again: the one-shot
  // 0.5.4 fix recognises an appended row by its shape, and a deliberate move to
  // the end looks exactly like it. Marking the scope here means the fix can
  // only ever touch layouts that predate this build.
  if (options && options.user) markScopeRepaired(scope);
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
// readHostActions() runs inside every layout pass, and the store only changes
// when this plugin writes it, so the last parse is memoised against its raw
// string. Callers merge entries into the map before writing it back, so the
// memo is never handed out directly.
let hostActionsCacheRaw = null;
let hostActionsCache = null;

function readHostActions() {
  let raw = "";
  try {
    raw = window.localStorage.getItem(HOST_ACTION_KEY) || "";
  } catch (err) {
    return {};
  }
  if (hostActionsCache && hostActionsCacheRaw === raw) return Object.assign({}, hostActionsCache);
  const out = {};
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        for (const key of Object.keys(parsed)) {
          const info = parsed[key];
          if (!key || !info || typeof info.label !== "string") continue;
          out[key] = { label: info.label, icon: typeof info.icon === "string" ? info.icon : "" };
        }
      }
    } catch (err) {
      // A corrupted store reads as empty and is rebuilt on the next menu open.
    }
  }
  hostActionsCacheRaw = raw;
  hostActionsCache = out;
  return Object.assign({}, out);
}

function writeHostActions(map) {
  const value = map || {};
  // Keep the memo in step even if storage rejects the write: the in-memory copy
  // is what the caller just acted on.
  hostActionsCache = value;
  hostActionsCacheRaw = null;
  try {
    window.localStorage.setItem(HOST_ACTION_KEY, JSON.stringify(value));
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
  return { order: [], dividers: [], hidden: [], customized: false };
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
  // 'hidden' is the tuck list behind the menu's More anchor. Older layouts
  // have no such key, so a missing or invalid value is simply an empty list.
  const hidden = normalizeStringList(raw.hidden);
  return { order, dividers, hidden, customized: raw.customized === true };
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
  const before = store.menus[kind] ? normalizeContextMenuLayout(store.menus[kind]) : emptyContextMenuLayout();
  // Merge onto the stored layout: the reorder/toggle call sites predate the
  // tuck list, and a write that only carries order+dividers must not wipe the
  // rows currently filed under More.
  menus[kind] = normalizeContextMenuLayout({
    order: layout && layout.order !== undefined ? layout.order : before.order,
    dividers: layout && layout.dividers !== undefined ? layout.dividers : before.dividers,
    customized: layout && layout.customized !== undefined ? layout.customized : before.customized,
    hidden: layout && layout.hidden !== undefined ? layout.hidden : before.hidden,
  });
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
  clearRowMenuLayout();
}

/* ---- dsh-sidebar-row-menu panes ---------------------------------------- */

// row-menu rebuilds its blank-conversation menu from scratch on every open and
// on every header reorder. Its rows have no host ids, so the stable handle is
// the visible label (occasionally with a suffix when two rows share a label).
// The store only remembers the panes the user actually rearranged; an absent
// pane keeps following row-menu's own order.
function emptyRowMenuPane() {
  return { order: [] };
}

function normalizeRowMenuPane(value) {
  const raw = value && typeof value === "object" ? value : {};
  return { order: normalizeStringList(raw.order) };
}

// One promoted 更多操作 entry. The host action id is what runs; the label is
// the handle in the first-level order and what the submenu row is hidden by.
function normalizeRowMenuPromoted(value) {
  const list = [];
  if (!Array.isArray(value)) return list;
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    if (typeof item.id !== "string" || !item.id) continue;
    if (typeof item.label !== "string" || !item.label) continue;
    if (list.some((entry) => entry.label === item.label)) continue;
    list.push({
      id: item.id,
      label: item.label,
      icon: typeof item.icon === "string" ? item.icon : "",
    });
  }
  return list;
}

function normalizeRowMenuDividers(value) {
  const gaps = [];
  if (!Array.isArray(value)) return gaps;
  for (const raw of value) {
    const gap = Number(raw);
    if (!Number.isInteger(gap) || gap < 1) continue;
    if (gaps.indexOf(gap) === -1) gaps.push(gap);
  }
  gaps.sort((a, b) => a - b);
  return gaps;
}

// Presence matters: an absent pane still follows row-menu's own separators,
// while an empty array is a deliberate "no dividers at all".
function normalizeRowMenuDividerMap(value) {
  const map = {};
  if (!value || typeof value !== "object") return map;
  for (const name of ROW_MENU_PANES) {
    if (Object.prototype.hasOwnProperty.call(value, name)) {
      map[name] = normalizeRowMenuDividers(value[name]);
    }
  }
  return map;
}

function readRowMenuStore() {
  let raw = null;
  try {
    raw = window.localStorage.getItem(ROW_MENU_LAYOUT_KEY);
  } catch (err) {
    raw = null;
  }
  if (rowMenuCache && raw === rowMenuCacheRaw) return rowMenuCache;
  let parsed = null;
  try {
    if (raw) parsed = JSON.parse(raw);
  } catch (err) {
    parsed = null;
  }
  const store = {
    version: ROW_MENU_LAYOUT_VERSION,
    panes: {},
    takeover: false,
    promoted: [],
    dividers: {},
  };
  if (parsed && typeof parsed === "object" && parsed.version === ROW_MENU_LAYOUT_VERSION) {
    if (parsed.panes && typeof parsed.panes === "object") {
      for (const name of ROW_MENU_PANES) {
        if (parsed.panes[name]) store.panes[name] = normalizeRowMenuPane(parsed.panes[name]);
      }
    }
    store.takeover = parsed.takeover === true;
    store.promoted = normalizeRowMenuPromoted(parsed.promoted);
    store.dividers = normalizeRowMenuDividerMap(parsed.dividers);
    // Builds before the takeover flag already froze individual panes. Reading
    // them as a takeover keeps the old frozen order instead of letting the
    // header (and the More submenu) start overwriting one of the two halves.
    if (!store.takeover && Object.keys(store.panes).length > 0) store.takeover = true;
    // 更多操作 is row-menu's view of the header More menu, so it is arranged by
    // writing the host order key. Keeping the value we replaced lets a reset put
    // the header menu back instead of stranding that reorder forever.
    if (parsed.host && typeof parsed.host === "object" && Array.isArray(parsed.host.backup)) {
      store.host = {
        backup: normalizeStringList(parsed.host.backup),
        written: Array.isArray(parsed.host.written) ? normalizeStringList(parsed.host.written) : null,
      };
    }
  }
  rowMenuCache = store;
  rowMenuCacheRaw = raw;
  return store;
}

function writeRowMenuStore(store) {
  const next = {
    version: ROW_MENU_LAYOUT_VERSION,
    panes: {},
    takeover: store.takeover === true,
    promoted: normalizeRowMenuPromoted(store.promoted),
    dividers: normalizeRowMenuDividerMap(store.dividers),
  };
  for (const name of ROW_MENU_PANES) {
    if (store.panes[name]) next.panes[name] = normalizeRowMenuPane(store.panes[name]);
  }
  if (store.host && Array.isArray(store.host.backup)) {
    next.host = {
      backup: normalizeStringList(store.host.backup),
      written: Array.isArray(store.host.written) ? normalizeStringList(store.host.written) : null,
    };
  }
  rowMenuCache = next;
  const serialized = JSON.stringify(next);
  rowMenuCacheRaw = serialized;
  try {
    window.localStorage.setItem(ROW_MENU_LAYOUT_KEY, serialized);
  } catch (err) {
    /* keep the in-memory copy */
  }
  return next;
}

function readRowMenuPane(name) {
  if (ROW_MENU_PANES.indexOf(name) === -1) return emptyRowMenuPane();
  const store = readRowMenuStore();
  return store.panes[name] ? normalizeRowMenuPane(store.panes[name]) : emptyRowMenuPane();
}

function writeRowMenuPane(name, order) {
  if (ROW_MENU_PANES.indexOf(name) === -1) return emptyRowMenuPane();
  const store = readRowMenuStore();
  const panes = Object.assign({}, store.panes);
  panes[name] = normalizeRowMenuPane({ order });
  writeRowMenuStore({
    version: store.version,
    panes,
    host: store.host,
    takeover: store.takeover,
    promoted: store.promoted,
    dividers: store.dividers,
  });
  return panes[name];
}

function readRowMenuTakeover() {
  return readRowMenuStore().takeover === true;
}

function setRowMenuTakeover(value) {
  const store = readRowMenuStore();
  writeRowMenuStore({
    version: store.version,
    panes: store.panes,
    host: store.host,
    takeover: Boolean(value),
    promoted: store.promoted,
    dividers: store.dividers,
  });
  return Boolean(value);
}

function readRowMenuPromoted() {
  return readRowMenuStore().promoted.map((entry) => Object.assign({}, entry));
}

function writeRowMenuPromoted(list) {
  const store = readRowMenuStore();
  const promoted = normalizeRowMenuPromoted(list);
  writeRowMenuStore({
    version: store.version,
    panes: store.panes,
    host: store.host,
    takeover: store.takeover,
    promoted,
    dividers: store.dividers,
  });
  return promoted;
}

// null means "this pane still follows row-menu's own separators"; an array
// (possibly empty) is the user's own divider set.
function readRowMenuDividers(name) {
  if (ROW_MENU_PANES.indexOf(name) === -1) return null;
  const store = readRowMenuStore();
  if (!Object.prototype.hasOwnProperty.call(store.dividers, name)) return null;
  return normalizeRowMenuDividers(store.dividers[name]);
}

function writeRowMenuDividers(name, gaps) {
  if (ROW_MENU_PANES.indexOf(name) === -1) return null;
  const store = readRowMenuStore();
  const dividers = Object.assign({}, store.dividers);
  dividers[name] = normalizeRowMenuDividers(gaps);
  writeRowMenuStore({
    version: store.version,
    panes: store.panes,
    host: store.host,
    takeover: store.takeover,
    promoted: store.promoted,
    dividers,
  });
  return dividers[name];
}

function beginRowMenuHostEdit() {
  const store = readRowMenuStore();
  if (store.host) return store.host;
  const host = { backup: readHostMenuOrder(), written: null };
  writeRowMenuStore({
    version: store.version,
    panes: store.panes,
    host,
    takeover: store.takeover,
    promoted: store.promoted,
    dividers: store.dividers,
  });
  return host;
}

function recordRowMenuHostWrite(labels) {
  const store = readRowMenuStore();
  if (!store.host) return;
  writeRowMenuStore({
    version: store.version,
    panes: store.panes,
    host: { backup: store.host.backup, written: normalizeStringList(labels) },
    takeover: store.takeover,
    promoted: store.promoted,
    dividers: store.dividers,
  });
}

function endRowMenuHostEdit() {
  const store = readRowMenuStore();
  if (!store.host || !store.host.written) return;
  const current = readHostMenuOrder();
  const written = store.host.written;
  const same =
    current.length === written.length && current.every((label, index) => label === written[index]);
  // Only unwind the exact order this feature wrote. A header reorder made after
  // the drag is the user's newer decision and must survive a context-menu reset.
  if (same) writeHostMenuOrder(store.host.backup);
}

function clearRowMenuLayout() {
  endRowMenuHostEdit();
  rowMenuCache = {
    version: ROW_MENU_LAYOUT_VERSION,
    panes: {},
    takeover: false,
    promoted: [],
    dividers: {},
  };
  rowMenuCacheRaw = null;
  try {
    window.localStorage.removeItem(ROW_MENU_LAYOUT_KEY);
  } catch (err) {
    /* ignore */
  }
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
    aliases: state.aliases,
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
  // v3 files carry no alias table; the runtime derives and backfills it.
  if (raw.version !== STATE_VERSION && raw.version !== PREVIOUS_STATE_VERSION) {
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
