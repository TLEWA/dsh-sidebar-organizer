/**
 * dsh-modmenu — client half (0.3.6).
 *
 * Two features, both DOM-first:
 *   1. long-press a row in the sidebar panel list ("全局面板") and drag it to a
 *      new position;
 *   2. drop a row on the "More" (更多) anchor to tuck it away, then drag it back
 *      out of the More menu to restore it.
 *
 * HARD RULES (learned the hard way — v0.1.0 wedged the page):
 *   1. The panel list is read-only: we never register or shadow its entries.
 *      Shadowing from inside the slot notification produced a
 *      register → notify → re-register loop with the shipped sidebar and froze
 *      the UI.
 *   2. Exactly one static row is registered into `sidebar.panellist.actions`
 *      (the More menu) so tucked-away panels stay reachable. It is registered
 *      once, never re-registered, and never reacts to slot notifications.
 *   3. Order and visibility are applied through inline `style.order` /
 *      `style.display` plus `data-*` attributes on nodes React does not manage.
 *   4. Every DOM pass is idempotent and rate limited; a watchdog stops the
 *      observer if passes get abnormally frequent.
 *
 * Escape hatches (browser console):
 *   window.__dshModmenu.reset()      — forget order + hidden panels
 *   window.__dshModmenu.disable()    — set the localStorage kill switch
 *   window.__dshModmenu.status()     — inspect what the plugin sees
 */

const PANEL_SLOT = "sidebar.panellist";
const ACTIONS_SLOT = "sidebar.panellist.actions";
const STORAGE_KEY = "dsh.modmenu.layout.v1";
const DISABLED_KEY = "dsh.modmenu.disabled";
const REGISTRANT = "dsh-modmenu";
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

const CSS = `
.dshmodmenu-ghost {
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
.dshmodmenu-indicator {
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
.dshmodmenu-indicator[data-visible="1"] { opacity: 1; }
button[data-modmenu-key].dshmodmenu-dragging { opacity: 0.35; }
button[data-modmenu-key].dshmodmenu-pressing { transform: scale(0.94); transition: transform 120ms ease; }
button[data-modmenu-key] { -webkit-user-select: none; user-select: none; }
button[data-modmenu-key].dshmodmenu-drop-more {
  outline: 2px dashed var(--dsw-alias-state-business-primary, #4d6bfe);
  outline-offset: -2px;
  background: var(--dsw-alias-interactive-bg-hover, rgba(255, 255, 255, 0.08));
}
body.dshmodmenu-dragging,
body.dshmodmenu-dragging * { cursor: grabbing !important; }
/* While a drag is in flight the rows under the pointer must not react at all:
   no :hover highlight, no tooltip. Hit-testing is done from rects, not events. */
body.dshmodmenu-dragging button[data-modmenu-key],
body.dshmodmenu-dragging [data-modmenu-more-key] { pointer-events: none !important; }
body.dshmodmenu-dragging button[data-modmenu-key]:hover { background: transparent !important; }

/* rows appended to the shipped "More" menu */
.dshmodmenu-menu-caption {
  padding: 6px 10px 2px;
  font-size: 12px;
  line-height: 18px;
  color: var(--dsw-alias-label-secondary, rgba(235, 235, 245, 0.6));
  -webkit-user-select: none;
  user-select: none;
}
.dshmodmenu-menu-item { display: block; }
.dshmodmenu-menu-item.dshmodmenu-dragging { opacity: 0.4; }
/* icon wrapper handed to MenuItemButton: same 16px footprint as the shipped rows */
.dshmodmenu-menu-icon {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  overflow: hidden;
  color: inherit;
}
.dshmodmenu-menu-icon svg,
.dshmodmenu-menu-row svg {
  width: 16px;
  height: 16px;
  flex: none;
  display: block;
}
/* the styled fallback row, used only when the primitives package is missing */
.dshmodmenu-menu-row {
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
.dshmodmenu-menu-row:hover,
.dshmodmenu-menu-row:focus-visible {
  background: var(--dsw-alias-interactive-bg-hover, rgba(255, 255, 255, 0.08));
}
.dshmodmenu-menu-row:focus-visible {
  outline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary, #4d6bfe));
}
.dshmodmenu-menu-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
`;

/* ------------------------------------------------------------------ */
/* Persistence                                                         */
/* ------------------------------------------------------------------ */

// Parsing localStorage on every drag frame is the single cheapest win: the
// layout only changes through us, so it is cached in memory and written through.
let layoutCache = null;

function readLayout() {
  if (layoutCache) return layoutCache;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
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

/* ------------------------------------------------------------------ */
/* Slot projection helpers                                             */
/* ------------------------------------------------------------------ */

/** Normalise a slot entry into { id, label }. */
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

/* ------------------------------------------------------------------ */
/* Runtime                                                             */
/* ------------------------------------------------------------------ */

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
    console.debug("[dsh-modmenu]", ...args);
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
        !button.hasAttribute("aria-haspopup") && !button.classList.contains("dshmodmenu-ghost")
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

  function visibleKeys(rows) {
    return rows.filter((row) => !row.hidden).map((row) => row.key);
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
        if (row.button.dataset.modmenuHidden !== "1") row.button.dataset.modmenuHidden = "1";
        // Keep the key on hidden rows too: the More menu uses it to locate the
        // row when it needs the localized label and the glyph.
        if (row.button.dataset.modmenuKey !== row.key) {
          row.button.dataset.modmenuKey = row.key;
        }
        state.decorated.add(row.host);
        continue;
      }
      if (row.host.style.display === "none") row.host.style.display = "";
      if (row.button !== row.host && row.button.style.display === "none") {
        row.button.style.display = "";
      }
      if (row.button.dataset.modmenuHidden) delete row.button.dataset.modmenuHidden;
      const value = String(rank.get(row.key) ?? 0);
      setOrder(row.host, value);
      state.decorated.add(row.host);
      if (row.button !== row.host) {
        setOrder(row.button, value);
        state.decorated.add(row.button);
      }
      if (row.button.dataset.modmenuKey !== row.key) {
        row.button.dataset.modmenuKey = row.key;
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

  function pass() {
    if (!alive()) return;
    // A pass would fight the drag ghost for layout: rows must not move while a
    // row is being carried. Re-run once the gesture is over.
    if (state.gesture) {
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
      gesture.element.classList.remove("dshmodmenu-dragging");
      gesture.element.classList.remove("dshmodmenu-pressing");
    }
    if (gesture.moreButton) gesture.moreButton.classList.remove("dshmodmenu-drop-more");
    document.body.classList.remove("dshmodmenu-dragging");
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

    const navButton = target.closest("button[data-modmenu-key]");
    const menuRow = target.closest("[data-modmenu-more-key]");
    let source = null;
    let element = null;
    let key = null;
    if (navButton && !navButton.hasAttribute("aria-haspopup")) {
      source = "nav";
      element = navButton;
      key = navButton.dataset.modmenuKey;
    } else if (menuRow) {
      source = "menu";
      element = menuRow;
      key = menuRow.getAttribute("data-modmenu-more-key");
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
        element.classList.add("dshmodmenu-pressing");
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
    ghost.removeAttribute("data-modmenu-key");
    ghost.removeAttribute("data-modmenu-more-key");
    ghost.removeAttribute("aria-current");
    ghost.removeAttribute("style");
    ghost.classList.remove("dshmodmenu-dragging");
    ghost.classList.remove("dshmodmenu-pressing");
    ghost.classList.add("dshmodmenu-ghost");
    ghost.style.width = `${rect.width}px`;
    ghost.style.height = `${rect.height}px`;
    document.body.appendChild(ghost);
    gesture.ghost = ghost;

    const indicator = document.createElement("div");
    indicator.className = "dshmodmenu-indicator";
    document.body.appendChild(indicator);
    gesture.indicator = indicator;

    element.classList.add("dshmodmenu-dragging");
    element.classList.remove("dshmodmenu-pressing");
    document.body.classList.add("dshmodmenu-dragging");
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
    for (const button of document.querySelectorAll("button[data-modmenu-key]")) {
      if (button.dataset.modmenuKey === key) return button;
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
      for (const node of document.querySelectorAll("[data-modmenu-more-key]")) {
        const key = node.getAttribute("data-modmenu-more-key");
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
        gesture.element.classList.remove("dshmodmenu-dragging");
        gesture.element.classList.remove("dshmodmenu-pressing");
      }
      gesture.element = current;
      current.classList.add("dshmodmenu-dragging");
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

    // Dropping a sidebar row on the "More" anchor tucks it away.
    if (gesture.source === "nav" && snapshot.moreRect && insideRect(snapshot.moreRect, x, y, 6)) {
      if (gesture.moreButton !== snapshot.moreButton) {
        if (gesture.moreButton) gesture.moreButton.classList.remove("dshmodmenu-drop-more");
        gesture.moreButton = snapshot.moreButton;
        if (gesture.moreButton) gesture.moreButton.classList.add("dshmodmenu-drop-more");
      }
      if (indicator.dataset.visible !== "0") indicator.dataset.visible = "0";
      gesture.target = { kind: "hide" };
      return;
    }
    if (gesture.moreButton) {
      gesture.moreButton.classList.remove("dshmodmenu-drop-more");
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
    gesture.target = { kind: "place", index };

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
      if (source === "menu") {
        revealKey(key, target.index);
        if (state.dismissMenu) {
          try {
            state.dismissMenu();
          } catch (error) {
            /* ignore */
          }
        }
      } else {
        reorderKey(key, target.index);
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
    if (!target.closest("button[data-modmenu-key]") && !target.closest("[data-modmenu-more-key]")) {
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
    const button = target.closest("button[data-modmenu-key]");
    if (!button) return;
    const key = button.dataset.modmenuKey;
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
      disabled = window.localStorage.getItem(DISABLED_KEY) === "1";
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
    for (const button of document.querySelectorAll("[data-modmenu-key]")) {
      delete button.dataset.modmenuKey;
    }
    for (const button of document.querySelectorAll("[data-modmenu-hidden]")) {
      delete button.dataset.modmenuHidden;
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
      return scopeMarkupIds(markup, `dshmodmenu-icon-${iconSeq}`);
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

/* ------------------------------------------------------------------ */
/* More menu entry (React)                                             */
/* ------------------------------------------------------------------ */

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
          className: "dshmodmenu-menu-icon",
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
      { type: "button", className: "dshmodmenu-menu-row", onClick: props.onSelect },
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
          { key: "caption", className: "dshmodmenu-menu-caption" },
          text.hidden
        )
      );
      for (const id of hidden) {
        children.push(
          React.createElement(
            "div",
            { key: id, className: "dshmodmenu-menu-item", "data-modmenu-more-key": id },
            React.createElement(
              "button",
              {
                type: "button",
                className: "dshmodmenu-menu-row",
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
            className: "dshmodmenu-menu-row",
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
      console.warn("[dsh-modmenu] More menu render failed; falling back to plain rows", error);
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
          { key: "caption", className: "dshmodmenu-menu-caption" },
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
            { key: id, className: "dshmodmenu-menu-item", "data-modmenu-more-key": id },
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

/* ------------------------------------------------------------------ */
/* Plugin entry                                                        */
/* ------------------------------------------------------------------ */

function ensureStyles() {
  const id = "dsh-modmenu/panel-order.css";
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
  console.info("[dsh-modmenu] client loaded v0.3.6");
  // hot-reload safety: dispose a previous instance before installing
  try {
    const previous = window.__dshModmenu;
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
            id: "modmenu-organizer",
            order: 100,
            registrant: REGISTRANT,
          },
          menuEntry
        )
      );
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn("[dsh-modmenu] cannot add the More-menu row", error);
    }
  }

  window.__dshModmenu = {
    version: "0.3.6",
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
      version: "0.3.6",
      order: readLayout().order,
      hidden: readLayout().hidden,
      entries: readPanelEntries(ctx).length,
      nav: Boolean(runtime && runtime.state.nav),
      navLabel: runtime && runtime.state.nav ? runtime.state.nav.getAttribute("aria-label") : null,
      rows: Array.from(document.querySelectorAll("[data-modmenu-key]")).map((element) => ({
        key: element.getAttribute("data-modmenu-key"),
        hidden: element.getAttribute("data-modmenu-hidden") === "1",
      })),
      dragging: Boolean(runtime && runtime.state.gesture),
    }),
  };
}

window.__ModuleLoader__.load({
  id: "dsh-modmenu",
  factory: (require) => {
    sharedRequire = require;
    return {
      apply,
      inject: ["slots"],
    };
  },
});
