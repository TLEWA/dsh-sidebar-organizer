/**
 * dsh-sidebar-organizer — client half (v0.4.1).
 *
 * GENERATED FILE — do not edit by hand.
 * Sources live in src/; run `npm run build` to regenerate.
 *
 * Why one file: the DSH client loads plugin code as a classic script through
 * window.__ModuleLoader__.load({ id, factory }), not as an ES module, so there
 * is no import resolution at runtime.
 */

window.__ModuleLoader__.load({
  id: "dsh-sidebar-organizer",
  factory: (require) => {
/* Constants, locale strings and the module-level shared handles. */

// Replaced at build time from package.json by scripts/build.mjs.
const VERSION = "0.4.1";

const PANEL_SLOT = "sidebar.panellist";
const ACTIONS_SLOT = "sidebar.panellist.actions";
const STORAGE_KEY = "dsh.sidebar-organizer.layout.v1";
const DISABLED_KEY = "dsh.sidebar-organizer.disabled";
// The plugin was called dsh-modmenu up to 0.3.6; keep reading the old keys so a
// rename does not drop the user's saved layout.
const LEGACY_STORAGE_KEY = "dsh.modmenu.layout.v1";
const LEGACY_DISABLED_KEY = "dsh.modmenu.disabled";
const REGISTRANT = "dsh-sidebar-organizer";
const LONG_PRESS_MS = 260;
const MOVE_TOLERANCE = 8;
const CLICK_GUARD_MS = 500;
const PASS_LIMIT = 90;
const PASS_WINDOW_MS = 3000;
const GHOST_Z = 2147483000;

/** Shared modules resolved by the client module loader. */
let sharedRequire = null;
let sharedReact = null;
let sharedMenuButton = null;
let runtimeInstance = null;

const STRINGS = {
  zh: {
    hidden: "已收纳",
    reset: "恢复默认排序",
  },
  en: {
    hidden: "Hidden panels",
    reset: "Reset layout",
  },
};

function strings() {
  const lang = String(
    (document.documentElement && document.documentElement.lang) ||
      (typeof navigator !== "undefined" && navigator.language) ||
      "en"
  ).toLowerCase();
  return lang.startsWith("zh") ? STRINGS.zh : STRINGS.en;
}

/* Injected stylesheet. Kept as a string: the client bundle must load offline
   without extra network requests. */

const CSS = `
.dso-ghost {
  position: fixed;
  box-sizing: border-box;
  pointer-events: none;
  z-index: ${GHOST_Z};
  opacity: 0.96;
  border-radius: var(--dsw-radius-md, 6px);
  background: var(--dsw-specific-sidebar-fill, rgba(24, 24, 27, 0.92));
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.28), 0 2px 6px rgba(0, 0, 0, 0.16);
  transform: scale(1.03);
}
.dso-indicator {
  position: fixed;
  box-sizing: border-box;
  height: 2px;
  margin: 0;
  padding: 0;
  border-radius: 2px;
  background: var(--dsw-alias-state-business-primary, #4d6bfe);
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.06);
  pointer-events: none;
  z-index: ${GHOST_Z};
  opacity: 0;
  transition: opacity 120ms ease;
}
.dso-indicator[data-visible="1"] { opacity: 1; }
button[data-dso-key].dso-dragging { opacity: 0.35; }
button[data-dso-key].dso-pressing { transform: scale(0.94); transition: transform 120ms ease; }
button[data-dso-key] { -webkit-user-select: none; user-select: none; }
button[data-dso-key].dso-drop-more {
  outline: 2px dashed var(--dsw-alias-state-business-primary, #4d6bfe);
  outline-offset: -2px;
  background: var(--dsw-alias-interactive-bg-hover, rgba(255, 255, 255, 0.08));
}
body.dso-dragging,
body.dso-dragging * { cursor: grabbing !important; }
/* While a drag is in flight the rows under the pointer must not react at all:
   no :hover highlight, no tooltip. Hit-testing is done from rects, not events. */
body.dso-dragging button[data-dso-key],
body.dso-dragging [data-dso-more-key] { pointer-events: none !important; }
body.dso-dragging button[data-dso-key]:hover { background: transparent !important; }

/* rows appended to the shipped "More" menu */
.dso-menu-caption {
  padding: 6px 10px 2px;
  font-size: 12px;
  line-height: 18px;
  color: var(--dsw-alias-label-secondary, rgba(235, 235, 245, 0.6));
  -webkit-user-select: none;
  user-select: none;
}
.dso-menu-item { display: block; }
.dso-menu-item.dso-dragging { opacity: 0.4; }
/* icon wrapper handed to MenuItemButton: same 16px footprint as the shipped rows */
.dso-menu-icon {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  overflow: hidden;
  color: inherit;
}
.dso-menu-icon svg,
.dso-menu-row svg {
  width: 16px;
  height: 16px;
  flex: none;
  display: block;
}
/* the styled fallback row, used only when the primitives package is missing */
.dso-menu-row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-height: 32px;
  margin: 0;
  padding: 6px 10px;
  border: none;
  border-radius: var(--dsw-radius-md, 6px);
  background: transparent;
  color: var(--dsw-alias-label-primary, #ebebf5);
  font: inherit;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
}
.dso-menu-row:hover,
.dso-menu-row:focus-visible {
  background: var(--dsw-alias-interactive-bg-hover, rgba(255, 255, 255, 0.08));
}
.dso-menu-row:focus-visible {
  outline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary, #4d6bfe));
}
.dso-menu-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
`;

/* Layout persistence (localStorage) with an in-memory cache. */

let layoutCache = null;

function readLayout() {
  if (layoutCache) return layoutCache;
  try {
    let raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // one-time migration from the plugin's pre-rename key
      const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacy) {
        raw = legacy;
        try {
          window.localStorage.setItem(STORAGE_KEY, legacy);
        } catch (error) {
          /* keep using the legacy value in memory if the write is refused */
        }
      }
    }
    if (!raw) {
      layoutCache = { order: [], hidden: [] };
      return layoutCache;
    }
    const parsed = JSON.parse(raw);
    const order = Array.isArray(parsed && parsed.order)
      ? parsed.order.filter((key) => typeof key === "string")
      : [];
    const hidden = Array.isArray(parsed && parsed.hidden)
      ? parsed.hidden.filter((key) => typeof key === "string")
      : [];
    layoutCache = { order, hidden };
    return layoutCache;
  } catch (error) {
    layoutCache = { order: [], hidden: [] };
    return layoutCache;
  }
}

function forgetLayout() {
  layoutCache = null;
}

function writeLayout(layout) {
  layoutCache = { order: layout.order.slice(), hidden: layout.hidden.slice() };
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 2,
        order: layout.order,
        hidden: layout.hidden,
      })
    );
  } catch (error) {
    /* storage may be unavailable; the layout then only lasts for this page */
  }
}

function isSameOrder(a, b) {
  if (a.length !== b.length) return false;
  for (let index = 0; index < a.length; index += 1) {
    if (a[index] !== b[index]) return false;
  }
  return true;
}

function setOrder(element, value) {
  if (!element) return;
  if (element.style.order !== value) element.style.order = value;
}

/* Icon markup helpers: serialize a rendered glyph and scope its element ids so
   that references like url(#mask) keep pointing at the copy inside the menu. */

let iconSeq = 0;

/**
 * Give every id inside a serialised <svg> a fresh prefix (including url(#…)
 * and href="#…" references). Icons such as dsh-context's draw themselves with
 * a per-instance <mask id>; reusing the original id made the copy resolve
 * `url(#…)` to the mask that lives inside the *hidden* original row, so the
 * menu icon came out blank.
 */
function scopeMarkupIds(markup, prefix) {
  const ids = [];
  const re = /\bid="([^"]+)"/g;
  let match;
  while ((match = re.exec(markup)) !== null) ids.push(match[1]);
  let out = markup;
  for (const id of ids) {
    const next = `${prefix}-${id}`;
    out = out.split(`id="${id}"`).join(`id="${next}"`);
    out = out.split(`url(#${id})`).join(`url(#${next})`);
    out = out.split(`href="#${id}"`).join(`href="#${next}"`);
  }
  return out;
}

/* Read-only access to the sidebar panel slot projection. */

function describeEntry(entry) {
  const options = entry && entry.options ? entry.options : entry || {};
  const id = typeof options.id === "string" ? options.id : null;
  let label = options.label;
  if (typeof label === "function") {
    try {
      label = label();
    } catch (error) {
      label = undefined;
    }
  }
  return { id, label: typeof label === "string" ? label : null };
}

/** Read the slot projection once per pass; failure is non-fatal. */
function readPanelEntries(ctx) {
  try {
    const slots = ctx && ctx.slots;
    if (!slots || typeof slots.entriesOfSlot !== "function") return [];
    const entries = slots.entriesOfSlot(PANEL_SLOT);
    return Array.isArray(entries) ? entries : [];
  } catch (error) {
    return [];
  }
}

/* The DOM runtime: locate the panel list, apply order/visibility, drag gesture. */

function createRuntime(ctx) {
  const state = {
    stopped: true,
    nav: null,
    passScheduled: false,
    passTimes: [],
    gesture: null,
    guardUntil: 0,
    pollTimer: 0,
    listenerCleanup: [],
    decorated: new Set(),
    warnedMissingNav: false,
    warnedMissingRows: false,
    readyLogged: false,
    passDeferred: false,
    menuListeners: new Set(),
    dismissMenu: null,
  };

  function log(...args) {
    // eslint-disable-next-line no-console
    console.debug("[dsh-sidebar-organizer]", ...args);
  }

  function alive() {
    return !state.stopped;
  }

  /* --- DOM projection ---------------------------------------------- */

  /**
   * Locate the panel list. The sidebar styles its rows through CSS modules
   * (`wtg9ga_panelRow` and friends), so class selectors are useless here: the
   * hash changes between releases. Attributes are the stable contract —
   * `aria-haspopup="menu"` marks the "More" anchor, `aria-label` every row.
   */
  function findNav() {
    const navs = Array.from(document.querySelectorAll("nav"));
    if (navs.length === 0) return null;

    const labels = new Set();
    for (const entry of readPanelEntries(ctx)) {
      const { label } = describeEntry(entry);
      if (label) labels.add(label);
    }

    // Score every nav by how many of its rows match a known panel label. This
    // keeps us away from other navs (workspace list and friends) that may also
    // contain menu buttons. The More anchor is only a tie-breaker.
    let best = null;
    let bestScore = 0;
    for (const nav of navs) {
      let score = 0;
      for (const button of nav.querySelectorAll("button[aria-label]")) {
        if (labels.size > 0 ? labels.has(button.getAttribute("aria-label")) : true) score += 1;
      }
      if (nav.querySelector('button[aria-haspopup="menu"]')) score += 0.5;
      if (score > bestScore) {
        best = nav;
        bestScore = score;
      }
    }
    return best;
  }

  /**
   * Map rendered rows to stable keys.
   * Preferred key: the slot entry id owning the cell. The sidebar renders rows
   * in `entriesOfSlot` order, so index is a reliable fallback; the resolved
   * label bridges the two when a shipped plugin registers a panel that another
   * plugin shadows.
   */
  function collectRows(nav) {
    const buttons = Array.from(nav.querySelectorAll("button[aria-label]")).filter(
      (button) =>
        !button.hasAttribute("aria-haspopup") && !button.classList.contains("dso-ghost")
    );
    if (buttons.length === 0) return { rows: [], moreHost: null, moreButton: null };

    const entries = readPanelEntries(ctx);
    // Without the slot projection we cannot map rows to stable ids; touching the
    // DOM anyway would persist label-based keys and lose an id-based order.
    if (entries.length === 0) return { rows: [], moreHost: null, moreButton: null };
    const labelToId = new Map();
    const ids = [];
    for (const entry of entries) {
      const { id, label } = describeEntry(entry);
      if (!id) continue;
      if (label) {
        // duplicate labels cannot disambiguate — drop them from the index
        labelToId.set(label, labelToId.has(label) ? null : id);
      }
      ids.push(id);
    }

    const layout = readLayout();
    const hiddenSet = new Set(layout.hidden);
    const used = new Set();
    const rows = buttons.map((button, index) => {
      const label = button.getAttribute("aria-label") || "";
      let key = label ? labelToId.get(label) : null;
      if (!key && ids[index]) key = ids[index];
      if (!key) key = `label:${label || `#${index}`}`;
      let unique = key;
      let suffix = 1;
      while (used.has(unique)) {
        unique = `${key}~${suffix}`;
        suffix += 1;
      }
      used.add(unique);
      // The flex item is the button when the Tooltip renders no wrapper, and the
      // closest non-nav ancestor otherwise; `order` only matters on flex items.
      const parent = button.parentElement;
      const host = parent && parent !== nav ? parent : button;
      return { key: unique, button, host, hidden: hiddenSet.has(unique) };
    });

    const moreButton = nav.querySelector('button[aria-haspopup="menu"]');
    const moreHost = moreButton ? moreButton.parentElement || moreButton : null;
    return { rows, moreHost, moreButton };
  }

  function visibleRows() {
    const nav = findNav() || state.nav;
    if (!nav) return { nav: null, rows: [] };
    const { rows, moreHost, moreButton } = collectRows(nav);
    return { nav, rows, moreHost, moreButton };
  }

  /**
   * Keys of the rows currently visible in the strip, in the order the user sees
   * them — i.e. the persisted layout order, NOT the DOM order. The sidebar keeps
   * rendering rows in registration order and we only move them with CSS
   * `order`, so a DOM-order list would shift every time a drag committed and
   * make drops land somewhere other than where the user released the pointer.
   */
  function visibleKeys(rows) {
    const layout = readLayout();
    const visible = rows.filter((row) => !row.hidden).map((row) => row.key);
    const ordered = [];
    for (const key of layout.order) {
      if (visible.includes(key) && !ordered.includes(key)) ordered.push(key);
    }
    for (const key of visible) {
      if (!ordered.includes(key)) ordered.push(key);
    }
    return ordered;
  }

  function applyOrder(nav, rows, moreHost, moreButton) {
    const layout = readLayout();
    const keys = rows.map((row) => row.key);
    const hiddenSet = new Set(layout.hidden.filter((key) => keys.includes(key)));
    const visible = keys.filter((key) => !hiddenSet.has(key));

    const desiredVisible = [];
    for (const key of layout.order) {
      if (visible.includes(key) && !desiredVisible.includes(key)) desiredVisible.push(key);
    }
    for (const key of visible) {
      if (!desiredVisible.includes(key)) desiredVisible.push(key);
    }
    const desiredHidden = [];
    for (const key of layout.order) {
      if (hiddenSet.has(key) && !desiredHidden.includes(key)) desiredHidden.push(key);
    }
    for (const key of keys) {
      if (hiddenSet.has(key) && !desiredHidden.includes(key)) desiredHidden.push(key);
    }

    const nextOrder = [...desiredVisible, ...desiredHidden];
    if (!isSameOrder(nextOrder, layout.order) || !isSameOrder(desiredHidden, layout.hidden)) {
      writeLayout({ order: nextOrder, hidden: desiredHidden });
    }

    // rank starts at 1 so that unranked siblings (the "More" anchor, separators)
    // never tie with the first panel row and win the tie-break by DOM order
    const rank = new Map(desiredVisible.map((key, index) => [key, index * 2 + 1]));
    for (const row of rows) {
      if (hiddenSet.has(row.key)) {
        if (row.host.style.display !== "none") row.host.style.display = "none";
        if (row.button !== row.host && row.button.style.display !== "none") {
          row.button.style.display = "none";
        }
        if (row.button.dataset.dsoHidden !== "1") row.button.dataset.dsoHidden = "1";
        // Keep the key on hidden rows too: the More menu uses it to locate the
        // row when it needs the localized label and the glyph.
        if (row.button.dataset.dsoKey !== row.key) {
          row.button.dataset.dsoKey = row.key;
        }
        state.decorated.add(row.host);
        continue;
      }
      if (row.host.style.display === "none") row.host.style.display = "";
      if (row.button !== row.host && row.button.style.display === "none") {
        row.button.style.display = "";
      }
      if (row.button.dataset.dsoHidden) delete row.button.dataset.dsoHidden;
      const value = String(rank.get(row.key) ?? 0);
      setOrder(row.host, value);
      state.decorated.add(row.host);
      if (row.button !== row.host) {
        setOrder(row.button, value);
        state.decorated.add(row.button);
      }
      if (row.button.dataset.dsoKey !== row.key) {
        row.button.dataset.dsoKey = row.key;
      }
    }

    const tail = String(desiredVisible.length * 2 + 1000);
    if (moreHost) {
      setOrder(moreHost, tail);
      state.decorated.add(moreHost);
    }
    if (moreButton && moreButton !== moreHost) {
      setOrder(moreButton, tail);
      state.decorated.add(moreButton);
    }
  }

  function pass(force) {
    if (!alive()) return;
    // A pass would fight the drag ghost for layout: rows must not move while a
    // row is being carried. Re-run once the gesture is over. `force` is used
    // right before a drag starts to make sure the DOM already reflects the
    // persisted order, so frozen rects and the committed order agree.
    if (state.gesture && !force) {
      state.passDeferred = true;
      return;
    }

    const now = Date.now();
    state.passTimes.push(now);
    if (state.passTimes.length > PASS_LIMIT) {
      state.passTimes = state.passTimes.filter((time) => now - time < PASS_WINDOW_MS);
      if (state.passTimes.length > PASS_LIMIT) {
        log("watchdog tripped: too many layout passes, disabling observer");
        stop();
        return;
      }
    }

    const nav = findNav();
    state.nav = nav;
    if (!nav) {
      if (!state.warnedMissingNav) {
        state.warnedMissingNav = true;
        log("panel list not found yet; retrying on DOM changes");
      }
      return;
    }
    const { rows, moreHost, moreButton } = collectRows(nav);
    if (rows.length === 0) {
      if (!state.warnedMissingRows) {
        state.warnedMissingRows = true;
        log("panel list found but its rows did not match any slot entry");
      }
      return;
    }
    if (!state.readyLogged) {
      state.readyLogged = true;
      log("ready:", rows.length, "panel rows");
    }
    applyOrder(nav, rows, moreHost, moreButton);
  }

  function schedulePass() {
    if (state.passScheduled || !alive()) return;
    state.passScheduled = true;
    window.requestAnimationFrame(() => {
      state.passScheduled = false;
      if (!alive()) return;
      try {
        pass();
      } catch (error) {
        log("layout pass failed", error);
      }
    });
  }

  /* --- layout mutations -------------------------------------------- */

  function notifyMenu() {
    for (const listener of Array.from(state.menuListeners)) {
      try {
        listener();
      } catch (error) {
        /* ignore a broken menu subscriber */
      }
    }
  }

  function hideKey(key) {
    const rows = collectRows(findNav() || state.nav).rows;
    if (rows.length === 0) return;
    const visible = visibleKeys(rows);
    if (!visible.includes(key)) return;
    // Never hide the last visible panel: an empty bar is a trap for the user.
    if (visible.length <= 1) {
      log("cannot hide the last visible panel");
      return;
    }
    const layout = readLayout();
    const hidden = layout.hidden.includes(key) ? layout.hidden : layout.hidden.concat(key);
    const order = layout.order.includes(key) ? layout.order : layout.order.concat(key);
    writeLayout({ order, hidden });
    log("hidden", key, hidden);
    notifyMenu();
    schedulePass();
  }

  function revealKey(key, index) {
    const layout = readLayout();
    const hidden = layout.hidden.filter((item) => item !== key);
    const hiddenSet = new Set(hidden);
    const visible = layout.order.filter((item) => item !== key && !hiddenSet.has(item));
    const next = visible.slice();
    const position =
      index === null || index === undefined
        ? next.length
        : Math.max(0, Math.min(index, next.length));
    next.splice(position, 0, key);
    const tailKeys = [];
    for (const item of layout.order) {
      if (item !== key && hiddenSet.has(item) && !tailKeys.includes(item)) tailKeys.push(item);
    }
    writeLayout({ order: [...next, ...tailKeys], hidden });
    log("revealed", key, "at", position);
    notifyMenu();
    schedulePass();
  }

  function reorderKey(key, index) {
    const { rows } = visibleRows();
    const visible = visibleKeys(rows);
    if (!visible.includes(key)) return;
    const others = visible.filter((item) => item !== key);
    const position = Math.max(0, Math.min(index, others.length));
    const next = others.slice();
    next.splice(position, 0, key);
    const layout = readLayout();
    const hiddenSet = new Set(layout.hidden);
    const tailKeys = [];
    for (const item of layout.order) {
      if (hiddenSet.has(item) && !visible.includes(item) && !tailKeys.includes(item)) {
        tailKeys.push(item);
      }
    }
    writeLayout({ order: [...next, ...tailKeys], hidden: layout.hidden });
    log("moved", key, "to", position, next);
    notifyMenu();
    schedulePass();
  }

  /** Reorder entries inside the "More" menu (the tucked-away set). */
  function reorderHidden(key, index) {
    const layout = readLayout();
    const hidden = layout.hidden.slice();
    const from = hidden.indexOf(key);
    if (from < 0) return;
    hidden.splice(from, 1);
    const position = Math.max(0, Math.min(index, hidden.length));
    hidden.splice(position, 0, key);
    const hiddenSet = new Set(hidden);
    const visible = [];
    for (const item of layout.order) {
      if (item !== key && !hiddenSet.has(item) && !visible.includes(item)) visible.push(item);
    }
    writeLayout({ order: [...visible, ...hidden], hidden });
    log("reordered hidden", key, "to", position, hidden);
    notifyMenu();
    schedulePass();
  }

  function hiddenKeys() {
    const layout = readLayout();
    const known = new Set();
    for (const entry of readPanelEntries(ctx)) {
      const { id } = describeEntry(entry);
      if (id) known.add(id);
    }
    return layout.hidden.filter((key) => known.size === 0 || known.has(key));
  }

  function defaultOrder() {
    return readPanelEntries(ctx).map((entry) => describeEntry(entry).id).filter(Boolean);
  }

  function isCustomized() {
    const layout = readLayout();
    if (layout.hidden.length > 0) return true;
    const known = layout.order.filter((key) => !key.startsWith("label:"));
    const fallback = defaultOrder().filter((key) => known.includes(key));
    return known.some((key, index) => fallback[index] !== key);
  }

  /* --- drag gesture ------------------------------------------------ */

  function clearGesture() {
    const gesture = state.gesture;
    if (!gesture) return;
    state.gesture = null;
    if (gesture.timer) window.clearTimeout(gesture.timer);
    if (gesture.pressTimer) window.clearTimeout(gesture.pressTimer);
    if (gesture.frame) {
      window.cancelAnimationFrame(gesture.frame);
      gesture.frame = 0;
    }
    if (gesture.anchorFrame) {
      window.cancelAnimationFrame(gesture.anchorFrame);
      gesture.anchorFrame = 0;
    }
    if (gesture.pointerId !== undefined && gesture.element) {
      try {
        if (gesture.element.hasPointerCapture(gesture.pointerId)) {
          gesture.element.releasePointerCapture(gesture.pointerId);
        }
      } catch (error) {
        /* the element may already be detached */
      }
    }
    if (gesture.ghost && gesture.ghost.parentNode) gesture.ghost.remove();
    if (gesture.indicator && gesture.indicator.parentNode) gesture.indicator.remove();
    if (gesture.element) {
      gesture.element.classList.remove("dso-dragging");
      gesture.element.classList.remove("dso-pressing");
    }
    if (gesture.moreButton) gesture.moreButton.classList.remove("dso-drop-more");
    document.body.classList.remove("dso-dragging");
    if (state.passDeferred) {
      state.passDeferred = false;
      schedulePass();
    }
  }

  function onPointerDown(event) {
    if (!alive() || state.gesture) return;
    if (event.button !== 0 || event.isPrimary === false) return;
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    if (target.closest("input, textarea, select, [contenteditable='true']")) return;

    const navButton = target.closest("button[data-dso-key]");
    const menuRow = target.closest("[data-dso-more-key]");
    let source = null;
    let element = null;
    let key = null;
    if (navButton && !navButton.hasAttribute("aria-haspopup")) {
      source = "nav";
      element = navButton;
      key = navButton.dataset.dsoKey;
    } else if (menuRow) {
      source = "menu";
      element = menuRow;
      key = menuRow.getAttribute("data-dso-more-key");
    }
    if (!source || !element || !key) return;

    const gesture = {
      source,
      key,
      element,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
      phase: "pending",
      timer: 0,
      ghost: null,
      indicator: null,
      target: null,
      moreButton: null,
    };
    gesture.timer = window.setTimeout(() => beginDrag(gesture), LONG_PRESS_MS);
    // Early feedback: a slight "press" shrink tells the user to keep holding.
    gesture.pressTimer = window.setTimeout(() => {
      if (state.gesture === gesture && gesture.phase === "pending") {
        element.classList.add("dso-pressing");
      }
    }, 140);
    state.gesture = gesture;
    // Deliberately NO pointer capture here: capturing on pointerdown retargets
    // pointerup to this element, and the browser then dispatches `click` on the
    // capturing element instead of the button inside — which broke plain taps
    // ("cannot open a tucked-away entry"). Capture is taken only once the
    // long-press actually turns into a drag.
    gesture.pointerId = event.pointerId;
  }

  function beginDrag(gesture) {
    if (state.gesture !== gesture || gesture.phase !== "pending") return;
    // React may replace the row between pointerdown and the long-press deadline;
    // locate it again by stable key instead of giving up.
    let element = gesture.element;
    if (!element.isConnected) element = locateRowButton(gesture.key) || element;
    gesture.element = element;
    if (!element.isConnected) {
      clearGesture();
      return;
    }
    // Flush any pending layout before freezing rects: after a previous drop the
    // rAF pass may not have run yet, and stale visuals would make the next drop
    // land somewhere else than where the pointer is.
    try {
      pass(true);
    } catch (error) {
      /* a failed flush must not block the drag */
    }
    if (!element.isConnected) element = locateRowButton(gesture.key) || element;
    gesture.element = element;
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      clearGesture();
      return;
    }

    gesture.phase = "dragging";
    gesture.grabX = gesture.lastX - rect.left;
    gesture.grabY = gesture.lastY - rect.top;
    gesture.snapshot = buildDragSnapshot(gesture);

    const ghost = element.cloneNode(true);
    ghost.removeAttribute("data-dso-key");
    ghost.removeAttribute("data-dso-more-key");
    ghost.removeAttribute("aria-current");
    ghost.removeAttribute("style");
    ghost.classList.remove("dso-dragging");
    ghost.classList.remove("dso-pressing");
    ghost.classList.add("dso-ghost");
    ghost.style.width = `${rect.width}px`;
    ghost.style.height = `${rect.height}px`;
    document.body.appendChild(ghost);
    gesture.ghost = ghost;

    const indicator = document.createElement("div");
    indicator.className = "dso-indicator";
    document.body.appendChild(indicator);
    gesture.indicator = indicator;

    element.classList.add("dso-dragging");
    element.classList.remove("dso-pressing");
    document.body.classList.add("dso-dragging");
    // Now that this is a real drag, capture the pointer so a fast flick cannot
    // lose the gesture to the page underneath.
    if (gesture.pointerId !== undefined) {
      try {
        element.setPointerCapture(gesture.pointerId);
      } catch (error) {
        /* capture is a nicety; document listeners carry the gesture anyway */
      }
    }
    moveGhost(gesture);
    updateTarget(gesture);
  }

  function locateRowButton(key) {
    for (const button of document.querySelectorAll("button[data-dso-key]")) {
      if (button.dataset.dsoKey === key) return button;
    }
    return null;
  }

  /**
   * Freeze every rect the drag needs. The list does not move while a row is
   * carried, so measuring once keeps the pointer loop free of layout reads;
   * when the DOM does change underneath, `reanchorDrag` rebuilds the snapshot.
   */
  function buildDragSnapshot(gesture) {
    const { nav, rows, moreButton } = visibleRows();
    if (!nav) return null;
    const others = [];
    for (const row of rows) {
      if (row.hidden || row.key === gesture.key) continue;
      const rect = row.button.getBoundingClientRect();
      if (rect.height === 0) continue;
      others.push({ key: row.key, rect });
    }
    others.sort((a, b) => a.rect.top - b.rect.top);

    // Dragging inside the "More" menu reorders the tucked-away entries.
    let menu = null;
    if (gesture.source === "menu") {
      const items = [];
      for (const node of document.querySelectorAll("[data-dso-more-key]")) {
        const key = node.getAttribute("data-dso-more-key");
        if (!key || key === gesture.key) continue;
        const rect = node.getBoundingClientRect();
        if (rect.height === 0) continue;
        items.push({ key, rect });
      }
      items.sort((a, b) => a.rect.top - b.rect.top);
      if (items.length > 0) {
        const left = Math.min(...items.map((item) => item.rect.left));
        const right = Math.max(...items.map((item) => item.rect.right));
        const top = Math.min(...items.map((item) => item.rect.top));
        const bottom = Math.max(...items.map((item) => item.rect.bottom));
        menu = { items, rect: { left, right, top, bottom }, lastIndex: -1 };
      }
    }

    return {
      navRect: nav.getBoundingClientRect(),
      moreRect: moreButton ? moreButton.getBoundingClientRect() : null,
      moreButton,
      others,
      menu,
      lastIndex: -1,
    };
  }

  function reanchorDrag(gesture) {
    if (state.gesture !== gesture || gesture.phase !== "dragging") return;
    const snapshot = buildDragSnapshot(gesture);
    if (snapshot) gesture.snapshot = snapshot;
    const current = locateRowButton(gesture.key);
    if (current && current !== gesture.element) {
      if (gesture.element) {
        gesture.element.classList.remove("dso-dragging");
        gesture.element.classList.remove("dso-pressing");
      }
      gesture.element = current;
      current.classList.add("dso-dragging");
    }
  }

  function moveGhost(gesture) {
    const ghost = gesture.ghost;
    if (!ghost) return;
    ghost.style.left = `${gesture.lastX - gesture.grabX}px`;
    ghost.style.top = `${gesture.lastY - gesture.grabY}px`;
  }

  function insideRect(rect, x, y, padding) {
    return (
      x >= rect.left - padding &&
      x <= rect.right + padding &&
      y >= rect.top - padding &&
      y <= rect.bottom + padding
    );
  }

  function updateTarget(gesture) {
    const indicator = gesture.indicator;
    if (!indicator) return;
    let snapshot = gesture.snapshot;
    if (!snapshot) {
      snapshot = buildDragSnapshot(gesture);
      if (!snapshot) return;
      gesture.snapshot = snapshot;
    }
    const x = gesture.lastX;
    const y = gesture.lastY;
    const others = snapshot.others;

    // Dragging a tucked-away row: reorder inside the menu while the pointer
    // stays over it; carry it onto the sidebar to reveal it there.
    if (gesture.source === "menu" && snapshot.menu) {
      const menu = snapshot.menu;
      if (insideRect(menu.rect, x, y, 8)) {
        let index = menu.items.length;
        for (let i = 0; i < menu.items.length; i += 1) {
          const rect = menu.items[i].rect;
          if (y < rect.top + rect.height / 2) {
            index = i;
            break;
          }
        }
        gesture.target = { kind: "place-menu", index };
        if (index === menu.lastIndex && indicator.dataset.visible === "1") return;
        menu.lastIndex = index;
        let top;
        if (index >= menu.items.length) {
          const last = menu.items[menu.items.length - 1].rect;
          top = last.top + last.height + 1;
        } else {
          top = menu.items[index].rect.top - 2;
        }
        indicator.style.left = `${menu.rect.left + 4}px`;
        indicator.style.width = `${Math.max(0, menu.rect.right - menu.rect.left - 8)}px`;
        indicator.style.top = `${top}px`;
        indicator.dataset.visible = "1";
        return;
      }
      if (indicator.dataset.visible !== "0") indicator.dataset.visible = "0";
      gesture.target = null;
    }

    // Dropping a sidebar row on the "More" anchor tucks it away. The anchor is
    // a small target: require the pointer to be inside its own rectangle
    // (no padding) and strictly below the last row, otherwise a drop meant for
    // "end of the strip" would quietly hide the row instead of reordering it.
    if (gesture.source === "nav" && snapshot.moreRect) {
      const lastBottom = others.length
        ? others[others.length - 1].rect.top + others[others.length - 1].rect.height
        : -Infinity;
      const overMore = insideRect(snapshot.moreRect, x, y, 0) && y > lastBottom + 1;
      if (overMore) {
        if (gesture.moreButton !== snapshot.moreButton) {
          if (gesture.moreButton) gesture.moreButton.classList.remove("dso-drop-more");
          gesture.moreButton = snapshot.moreButton;
          if (gesture.moreButton) gesture.moreButton.classList.add("dso-drop-more");
        }
        if (indicator.dataset.visible !== "0") indicator.dataset.visible = "0";
        gesture.target = { kind: "hide" };
        return;
      }
    }
    if (gesture.moreButton) {
      gesture.moreButton.classList.remove("dso-drop-more");
      gesture.moreButton = null;
    }

    if (!insideRect(snapshot.navRect, x, y, 24) || others.length === 0) {
      if (indicator.dataset.visible !== "0") indicator.dataset.visible = "0";
      gesture.target = null;
      return;
    }

    let index = others.length;
    for (let i = 0; i < others.length; i += 1) {
      const rect = others[i].rect;
      if (y < rect.top + rect.height / 2) {
        index = i;
        break;
      }
    }
    // Remember which row the drop line sits in front of. Indices are computed
    // from frozen rects (the visual order at drag start) while commits apply to
    // the persisted order, so carrying the neighbour key keeps the two aligned
    // even when another drop has just rewritten the layout.
    gesture.target = {
      kind: "place",
      index,
      beforeKey: index < others.length ? others[index].key : null,
    };

    if (index === snapshot.lastIndex) {
      if (indicator.dataset.visible !== "1") indicator.dataset.visible = "1";
      return;
    }
    snapshot.lastIndex = index;

    let top;
    if (index >= others.length) {
      const last = others[others.length - 1].rect;
      top = last.top + last.height + 1;
    } else {
      top = others[index].rect.top - 2;
    }
    indicator.style.left = `${snapshot.navRect.left + 4}px`;
    indicator.style.width = `${Math.max(0, snapshot.navRect.width - 8)}px`;
    indicator.style.top = `${top}px`;
    indicator.dataset.visible = "1";
  }

  function commitDrag(gesture) {
    const { key, target, source } = gesture;
    if (!target) return;
    if (target.kind === "hide") {
      hideKey(key);
      return;
    }
    if (target.kind === "place-menu") {
      reorderHidden(key, target.index);
      return;
    }
    if (target.kind === "place") {
      // Map the drop position onto the persisted order (see visibleKeys): the
      // anchor row is the key we resolved from the frozen rects.
      const { rows } = visibleRows();
      const others = visibleKeys(rows).filter((item) => item !== key);
      let index = Math.max(0, Math.min(target.index, others.length));
      if (target.beforeKey && others.includes(target.beforeKey)) {
        index = others.indexOf(target.beforeKey);
      }
      if (source === "menu") {
        revealKey(key, index);
        if (state.dismissMenu) {
          try {
            state.dismissMenu();
          } catch (error) {
            /* ignore */
          }
        }
      } else {
        reorderKey(key, index);
      }
    }
  }

  function onPointerMove(event) {
    const gesture = state.gesture;
    if (!gesture) return;
    gesture.lastX = event.clientX;
    gesture.lastY = event.clientY;
    if (gesture.phase === "pending") {
      const dx = event.clientX - gesture.startX;
      const dy = event.clientY - gesture.startY;
      if (Math.hypot(dx, dy) > MOVE_TOLERANCE) clearGesture();
      return;
    }
    if (gesture.phase !== "dragging") return;
    event.preventDefault();
    // Coalesce into one paint per frame: pointermove can fire twice per frame on
    // high-polling mice, and each pass writes ghost + indicator styles.
    if (gesture.frame) return;
    gesture.frame = window.requestAnimationFrame(() => {
      gesture.frame = 0;
      if (state.gesture !== gesture || gesture.phase !== "dragging") return;
      moveGhost(gesture);
      updateTarget(gesture);
    });
  }

  function onPointerUp() {
    const gesture = state.gesture;
    if (!gesture) return;
    if (gesture.phase === "dragging") {
      const pending = gesture;
      clearGesture();
      commitDrag(pending);
      state.guardUntil = Date.now() + CLICK_GUARD_MS;
      return;
    }
    clearGesture();
  }

  function onClickCapture(event) {
    if (Date.now() >= state.guardUntil) return;
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    if (!target.closest("button[data-dso-key]") && !target.closest("[data-dso-more-key]")) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
  }

  function onKeyDown(event) {
    if (event.key === "Escape" && state.gesture) {
      clearGesture();
      return;
    }
    if (!event.altKey) return;
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    const button = target.closest("button[data-dso-key]");
    if (!button) return;
    const key = button.dataset.dsoKey;
    if (!key) return;
    const { rows } = visibleRows();
    const visible = visibleKeys(rows);
    const index = visible.indexOf(key);
    if (index < 0) return;
    const delta = event.key === "ArrowUp" ? -1 : 1;
    const next = Math.max(0, Math.min(visible.length - 1, index + delta));
    if (next === index) return;
    event.preventDefault();
    event.stopPropagation();
    reorderKey(key, next);
  }

  function onScroll() {
    const gesture = state.gesture;
    if (!gesture || gesture.phase !== "dragging") return;
    // Extra DOM churn (chat streaming) can also scroll things around us. Scrolling
    // is not a reason to abort a drag the user is still holding: re-measure and
    // keep the gesture alive.
    if (gesture.anchorFrame) return;
    gesture.anchorFrame = window.requestAnimationFrame(() => {
      gesture.anchorFrame = 0;
      if (state.gesture === gesture) reanchorDrag(gesture);
    });
  }

  /* --- lifecycle ---------------------------------------------------- */

  function installObservers() {
    const target = document.body || document.documentElement;
    const observer = new MutationObserver((mutations) => {
      // Cheap relevance filter: ignore the app's own DOM churn (chat streaming,
      // etc.) unless it touches the panel list. If our cached nav is gone we
      // cannot tell, so let the pass re-locate it.
      const nav = state.nav;
      const relevant =
        !nav ||
        !nav.isConnected ||
        mutations.some((mutation) => {
          const node = mutation.target;
          return node === nav || nav.contains(node);
        });
      if (!relevant) return;
      if (state.gesture && state.gesture.phase === "dragging") {
        // Re-anchor instead of cancelling: React re-renders must not abort a drag.
        state.gesture.anchorFrame = state.gesture.anchorFrame || 0;
        if (!state.gesture.anchorFrame) {
          const gesture = state.gesture;
          gesture.anchorFrame = window.requestAnimationFrame(() => {
            gesture.anchorFrame = 0;
            if (state.gesture === gesture) reanchorDrag(gesture);
          });
        }
        return;
      }
      schedulePass();
    });
    observer.observe(target, { childList: true, subtree: true });

    const bind = (node, type, handler, options) => {
      node.addEventListener(type, handler, options);
      state.listenerCleanup.push(() => node.removeEventListener(type, handler, options));
    };
    bind(document, "pointerdown", onPointerDown, true);
    bind(document, "click", onClickCapture, true);
    bind(document, "keydown", onKeyDown, true);
    bind(document, "pointermove", onPointerMove, true);
    bind(document, "pointerup", onPointerUp, true);
    bind(document, "pointercancel", () => clearGesture(), true);
    bind(document, "scroll", onScroll, true);
    bind(window, "blur", () => clearGesture());

    state.listenerCleanup.push(() => observer.disconnect());
  }

  function start() {
    if (!state.stopped) return;
    let disabled = false;
    try {
      disabled =
        window.localStorage.getItem(DISABLED_KEY) === "1" ||
        window.localStorage.getItem(LEGACY_DISABLED_KEY) === "1";
    } catch (error) {
      disabled = false;
    }
    if (disabled) {
      log("disabled by localStorage switch");
      return;
    }
    state.stopped = false;
    installObservers();
    schedulePass();

    let attempts = 0;
    state.pollTimer = window.setInterval(() => {
      attempts += 1;
      if (attempts > 20 || !alive()) {
        window.clearInterval(state.pollTimer);
        state.pollTimer = 0;
        return;
      }
      if (!state.nav || !state.nav.isConnected) schedulePass();
    }, 500);
  }

  function stop() {
    state.stopped = true;
    clearGesture();
    if (state.pollTimer) {
      window.clearInterval(state.pollTimer);
      state.pollTimer = 0;
    }
    for (const cleanup of state.listenerCleanup.splice(0)) {
      try {
        cleanup();
      } catch (error) {
        /* ignore */
      }
    }
    // restore the rows we decorated
    for (const element of state.decorated) {
      if (!element || !element.isConnected) continue;
      element.style.order = "";
      if (element.style.display === "none") element.style.display = "";
    }
    state.decorated.clear();
    for (const button of document.querySelectorAll("[data-dso-key]")) {
      delete button.dataset.dsoKey;
    }
    for (const button of document.querySelectorAll("[data-dso-hidden]")) {
      delete button.dataset.dsoHidden;
    }
    state.menuListeners.clear();
  }

  return {
    start,
    stop,
    pass: schedulePass,
    state,
    subscribeMenu(listener) {
      state.menuListeners.add(listener);
      return () => state.menuListeners.delete(listener);
    },
    setDismiss(dismiss) {
      state.dismissMenu = dismiss || null;
    },
    dismiss() {
      if (!state.dismissMenu) return;
      try {
        state.dismissMenu();
      } catch (error) {
        /* ignore */
      }
    },
    hiddenKeys,
    isCustomized,
    /** The row's own rendered label: already locale-resolved by the sidebar. */
    labelFor(key) {
      const button = locateRowButton(key);
      if (button) {
        const label = button.getAttribute("aria-label");
        if (label) return label;
      }
      for (const entry of readPanelEntries(ctx)) {
        const described = describeEntry(entry);
        if (described.id === key && described.label) return described.label;
      }
      return key;
    },
    /** Serialise the panel's own glyph so it can travel through the React icon prop. */
    iconFor(key) {
      const button = locateRowButton(key);
      if (!button) return null;
      const glyph = button.querySelector('[aria-hidden="true"]');
      if (!glyph) return null;
      // The row wraps its glyph in a sizing span; the menu wants the bare icon.
      const shape = glyph.querySelector("svg") || glyph.firstElementChild || glyph;
      if (!shape || !shape.isConnected) return null;
      let markup;
      try {
        markup = new XMLSerializer().serializeToString(shape);
      } catch (error) {
        return null;
      }
      if (!markup) return null;
      iconSeq += 1;
      return scopeMarkupIds(markup, `dso-icon-${iconSeq}`);
    },
    hide(key) {
      hideKey(key);
    },
    reveal(key) {
      revealKey(key, null);
    },
    reset() {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch (error) {
        /* ignore */
      }
      forgetLayout();
      notifyMenu();
      schedulePass();
    },
  };
}

/* The single row this plugin registers into the sidebar's "More" menu. */

function createMenuEntry() {
  const React = sharedReact;
  if (!React) return null;

  function Row(props) {
    // Mirror the shipped rows ("Browse plugins" / "Create your plugin"): they
    // hand their glyph to MenuItemButton through the `icon` prop, and the
    // component owns the icon column, spacing and alignment.
    //
    // The glyph must reach React as markup, never as a live DOM node: React 18
    // throws "Objects are not valid as a React child" for host nodes, the slot
    // error boundary then abdicates this entry, and the whole "已收纳" group
    // silently disappears from the menu (0.3.2 regression).
    const runtime = runtimeInstance;
    const markup = props.icon === false || !runtime ? null : runtime.iconFor(props.id);
    const icon = markup
      ? React.createElement("span", {
          className: "dso-menu-icon",
          dangerouslySetInnerHTML: { __html: markup },
        })
      : undefined;

    if (sharedMenuButton) {
      return React.createElement(
        sharedMenuButton,
        { key: props.id, icon, onSelect: props.onSelect },
        props.label
      );
    }

    return React.createElement(
      "button",
      { type: "button", className: "dso-menu-row", onClick: props.onSelect },
      icon || null,
      React.createElement("span", { key: "label" }, props.label)
    );
  }

  /**
   * Degraded list used if anything in the styled rows ever throws at render
   * time. A thrown error would otherwise let the slot error boundary abdicate
   * this entry and the whole "已收纳" group would vanish without a trace.
   */
  function PlainRows(props) {
    const { runtime, text, onOpen, onDismiss } = props;
    const hidden = runtime.hiddenKeys();
    const children = [];
    if (hidden.length > 0) {
      children.push(
        React.createElement(
          "div",
          { key: "caption", className: "dso-menu-caption" },
          text.hidden
        )
      );
      for (const id of hidden) {
        children.push(
          React.createElement(
            "div",
            { key: id, className: "dso-menu-item", "data-dso-more-key": id },
            React.createElement(
              "button",
              {
                type: "button",
                className: "dso-menu-row",
                onClick: () => {
                  if (onDismiss) onDismiss();
                  if (onOpen) onOpen(id);
                },
              },
              runtime.labelFor(id)
            )
          )
        );
      }
    }
    if (runtime.isCustomized()) {
      children.push(
        React.createElement(
          "button",
          {
            key: "reset",
            type: "button",
            className: "dso-menu-row",
            onClick: () => {
              runtime.reset();
              if (onDismiss) onDismiss();
            },
          },
          text.reset
        )
      );
    }
    return React.createElement(React.Fragment, null, children);
  }

  class MenuBoundary extends React.Component {
    constructor(props) {
      super(props);
      this.state = { failed: false };
    }

    static getDerivedStateFromError() {
      return { failed: true };
    }

    componentDidCatch(error) {
      // eslint-disable-next-line no-console
      console.warn("[dsh-sidebar-organizer] More menu render failed; falling back to plain rows", error);
    }

    render() {
      return this.state.failed ? this.props.fallback : this.props.children;
    }
  }

  function ModmenuMenuContent(props) {
    const [, force] = React.useState(0);
    React.useEffect(() => {
      const runtime = runtimeInstance;
      if (!runtime) return undefined;
      return runtime.subscribeMenu(() => force((value) => value + 1));
    }, []);
    React.useEffect(() => {
      const runtime = runtimeInstance;
      if (runtime) runtime.setDismiss(props && props.onDismiss);
      return () => {
        if (runtime) runtime.setDismiss(null);
      };
    }, [props && props.onDismiss]);

    const runtime = runtimeInstance;
    if (!runtime) return null;
    const text = strings();
    const hidden = runtime.hiddenKeys();
    const children = [];

    if (hidden.length > 0) {
      children.push(
        React.createElement(
          "div",
          { key: "caption", className: "dso-menu-caption" },
          text.hidden
        )
      );
      for (const id of hidden) {
        // Use the row's own rendered label ("插件"), never the raw slot id
        // ("plugins"): the sidebar's More-menu projection deliberately drops the
        // plugins entry, so ids alone leave that row untranslated.
        const label = runtime.labelFor(id);
        children.push(
          React.createElement(
            "div",
            { key: id, className: "dso-menu-item", "data-dso-more-key": id },
            React.createElement(Row, {
              id,
              label,
              // Open the panel and keep it tucked away: the More menu is a
              // launcher, not a "restore" action. Restoring is done by dragging
              // the row back onto the sidebar.
              onSelect: () => {
                if (props && props.onDismiss) props.onDismiss();
                if (props && props.onOpen) props.onOpen(id);
              },
            })
          )
        );
      }
    }

    if (runtime.isCustomized()) {
      children.push(
        React.createElement(Row, {
          key: "reset",
          id: "__reset",
          label: text.reset,
          icon: false,
          onSelect: () => {
            runtime.reset();
            if (props && props.onDismiss) props.onDismiss();
          },
        })
      );
    }

    if (children.length === 0) return null;
    return React.createElement(
      MenuBoundary,
      { fallback: React.createElement(PlainRows, { runtime, text, onOpen: props && props.onOpen, onDismiss: props && props.onDismiss }) },
      React.createElement(React.Fragment, null, children)
    );
  }

  return ModmenuMenuContent;
}

/* Plugin entry: styles, module lookup, apply(). */

function ensureStyles() {
  const id = "dsh-sidebar-organizer/panel-order.css";
  if (document.querySelector(`style[data-plugin-css="${id}"]`)) return;
  const style = document.createElement("style");
  style.dataset.pluginCss = id;
  style.textContent = CSS;
  document.head.appendChild(style);
}

function safeRequire(name) {
  if (!sharedRequire) return null;
  try {
    return sharedRequire(name);
  } catch (error) {
    return null;
  }
}

function apply(ctx) {
  // eslint-disable-next-line no-console
  console.info("[dsh-sidebar-organizer] client loaded v" + VERSION);
  // hot-reload safety: dispose a previous instance before installing
  try {
    const previous = window.__dshSidebarOrganizer;
    if (previous && typeof previous.dispose === "function") previous.dispose();
  } catch (error) {
    /* ignore */
  }

  sharedReact = sharedReact || safeRequire("react");
  if (!sharedMenuButton) {
    const primitives = safeRequire("@deepseek-ai/dsh-client-ui-primitives");
    sharedMenuButton = primitives && primitives.MenuItemButton ? primitives.MenuItemButton : null;
  }

  let runtime = null;
  ctx.effect(() => {
    ensureStyles();
    runtime = createRuntime(ctx);
    runtimeInstance = runtime;
    runtime.start();
    return () => {
      if (runtime) runtime.stop();
      if (runtimeInstance === runtime) runtimeInstance = null;
      runtime = null;
    };
  });

  // Register the More-menu row exactly once. It never re-registers, so it cannot
  // feed back into the sidebar's slot subscriptions.
  const menuEntry = createMenuEntry();
  if (menuEntry && ctx.slots && typeof ctx.slots.inject === "function") {
    try {
      ctx.slots.inject(ACTIONS_SLOT, () =>
        ctx.slots.register(
          {
            name: ACTIONS_SLOT,
            id: "panel-organizer",
            order: 100,
            registrant: REGISTRANT,
          },
          menuEntry
        )
      );
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn("[dsh-sidebar-organizer] cannot add the More-menu row", error);
    }
  }

  window.__dshSidebarOrganizer = {
    version: VERSION,
    pass: () => runtime && runtime.pass(),
    reset: () => runtime && runtime.reset(),
    hide: (key) => runtime && runtime.hide(key),
    reveal: (key) => runtime && runtime.reveal(key),
    disable: () => {
      try {
        window.localStorage.setItem(DISABLED_KEY, "1");
      } catch (error) {
        /* ignore */
      }
      if (runtime) runtime.stop();
    },
    dispose: () => {
      if (runtime) runtime.stop();
      runtime = null;
      runtimeInstance = null;
    },
    status: () => ({
      version: VERSION,
      order: readLayout().order,
      hidden: readLayout().hidden,
      entries: readPanelEntries(ctx).length,
      nav: Boolean(runtime && runtime.state.nav),
      navLabel: runtime && runtime.state.nav ? runtime.state.nav.getAttribute("aria-label") : null,
      rows: Array.from(document.querySelectorAll("[data-dso-key]")).map((element) => ({
        key: element.getAttribute("data-dso-key"),
        hidden: element.getAttribute("data-dso-hidden") === "1",
      })),
      dragging: Boolean(runtime && runtime.state.gesture),
    }),
  };
  // backward-compatible handle for consoles/docs written before the rename
  window.__dshModmenu = window.__dshSidebarOrganizer;
}
    sharedRequire = require;
    return {
      apply,
      inject: ["slots"],
    };
  },
});
