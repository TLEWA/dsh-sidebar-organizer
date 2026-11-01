/**
 * dsh-modmenu — client half.
 *
 * MVP: long-press a row in the sidebar's panel list ("全局面板") and drag it to
 * a new position. The order is persisted in localStorage and re-applied on load.
 *
 * HARD RULES (learned the hard way — v0.1.0 wedged the page):
 *   1. Never call ctx.slots.register / unregister / inject. The shipped sidebar
 *      re-syncs its panel store from `entriesOfSlot("sidebar.panellist")`; doing
 *      slot mutations from inside that notification feedback loop froze the UI.
 *      This plugin is strictly READ-ONLY towards the slot system.
 *   2. Never touch React state or the DOM owned by React except inline
 *      `style.order` / `data-*` attributes, which React does not manage on
 *      these nodes and re-applies on every pass anyway.
 *   3. Every DOM pass is idempotent (write-only-if-changed) and rate limited.
 *      A watchdog stops the MutationObserver if it fires abnormally often.
 *
 * Escape hatches:
 *   window.__dshModmenu.reset()       — forget the saved order
 *   window.__dshModmenu.disable()     — set localStorage kill switch, then reload
 *   localStorage.removeItem("dsh.modmenu.disabled")
 */

const PANEL_SLOT = "sidebar.panellist";
const STORAGE_KEY = "dsh.modmenu.layout.v1";
const DISABLED_KEY = "dsh.modmenu.disabled";
const LONG_PRESS_MS = 320;
const MOVE_TOLERANCE = 8;
const CLICK_GUARD_MS = 500;
const PASS_LIMIT = 90;
const PASS_WINDOW_MS = 3000;
const GHOST_Z = 2147483000;

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
body.dshmodmenu-dragging,
body.dshmodmenu-dragging * { cursor: grabbing !important; }
`;

function readLayout() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { order: [] };
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.order)) return { order: [] };
    return { order: parsed.order.filter((key) => typeof key === "string") };
  } catch (error) {
    return { order: [] };
  }
}

function writeLayout(layout) {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, order: layout.order })
    );
  } catch (error) {
    /* storage may be unavailable; ordering then only lasts for this page */
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
  };

  function log(...args) {
    // eslint-disable-next-line no-console
    console.debug("[dsh-modmenu]", ...args);
  }

  function alive() {
    return !state.stopped;
  }

  /* ------------------------------------------------------------------ */
  /* DOM projection                                                      */
  /* ------------------------------------------------------------------ */

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
   * Map the rendered rows to stable keys.
   * Preferred key: the slot entry id that owns the cell. The sidebar renders
   * rows in `entriesOfSlot` order, so index is a reliable fallback; the
   * resolved label bridges the two when a shipped plugin registers a panel
   * that another plugin shadows.
   */
  function collectRows(nav) {
    const buttons = Array.from(nav.querySelectorAll("button[aria-label]")).filter(
      (button) => !button.hasAttribute("aria-haspopup") && !button.classList.contains("dshmodmenu-ghost")
    );
    if (buttons.length === 0) return { rows: [], moreHost: null, moreButton: null };

    const entries = readPanelEntries(ctx);
    // Without the slot projection we cannot map rows to stable ids; touching the
    // DOM anyway would persist label-based keys and lose a saved id-based order.
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
      return { key: unique, button, host };
    });

    const moreButton = nav.querySelector('button[aria-haspopup="menu"]');
    const moreHost = moreButton ? moreButton.parentElement || moreButton : null;
    return { rows, moreHost, moreButton };
  }

  function applyOrder(nav, rows, moreHost, moreButton) {
    const layout = readLayout();
    const visible = rows.map((row) => row.key);
    const desired = [];
    for (const key of layout.order) {
      if (visible.includes(key) && !desired.includes(key)) desired.push(key);
    }
    for (const key of visible) {
      if (!desired.includes(key)) desired.push(key);
    }
    if (!isSameOrder(desired, layout.order)) writeLayout({ order: desired });

    // rank starts at 1 so that unranked siblings (the "More" anchor, separators)
    // never tie with the first panel row and win the tie-break by DOM order
    const rank = new Map(desired.map((key, index) => [key, index * 2 + 1]));
    for (const row of rows) {
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
    const tail = String(desired.length * 2 + 1000);
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

  /* ------------------------------------------------------------------ */
  /* Drag gesture                                                        */
  /* ------------------------------------------------------------------ */

  function visibleRows() {
    const nav = findNav() || state.nav;
    if (!nav) return { nav: null, rows: [] };
    const { rows } = collectRows(nav);
    return { nav, rows };
  }

  function clearGesture() {
    const gesture = state.gesture;
    if (!gesture) return;
    state.gesture = null;
    if (gesture.timer) window.clearTimeout(gesture.timer);
    if (gesture.pressTimer) window.clearTimeout(gesture.pressTimer);
    if (gesture.ghost && gesture.ghost.parentNode) gesture.ghost.remove();
    if (gesture.indicator && gesture.indicator.parentNode) gesture.indicator.remove();
    if (gesture.button) {
      gesture.button.classList.remove("dshmodmenu-dragging");
      gesture.button.classList.remove("dshmodmenu-pressing");
    }
    document.body.classList.remove("dshmodmenu-dragging");
  }

  function onPointerDown(event) {
    if (!alive() || state.gesture) return;
    if (event.button !== 0 || event.isPrimary === false) return;
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    if (target.closest("input, textarea, select, [contenteditable='true']")) return;
    const button = target.closest("button[data-modmenu-key]");
    if (!button || button.hasAttribute("aria-haspopup")) return;
    const key = button.dataset.modmenuKey;
    if (!key) return;

    const gesture = {
      key,
      button,
      host: button.parentElement || button,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
      phase: "pending",
      timer: 0,
      ghost: null,
      indicator: null,
      index: null,
    };
    gesture.timer = window.setTimeout(() => beginDrag(gesture), LONG_PRESS_MS);
    // Early feedback: a slight "press" shrink tells the user to keep holding.
    gesture.pressTimer = window.setTimeout(() => {
      if (state.gesture === gesture && gesture.phase === "pending") {
        button.classList.add("dshmodmenu-pressing");
      }
    }, 140);
    state.gesture = gesture;
  }

  function beginDrag(gesture) {
    if (state.gesture !== gesture || gesture.phase !== "pending") return;
    const button = gesture.button;
    if (!button.isConnected) {
      clearGesture();
      return;
    }
    const rect = button.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      clearGesture();
      return;
    }

    gesture.phase = "dragging";
    gesture.grabX = gesture.lastX - rect.left;
    gesture.grabY = gesture.lastY - rect.top;

    const ghost = button.cloneNode(true);
    ghost.removeAttribute("data-modmenu-key");
    ghost.removeAttribute("aria-current");
    ghost.removeAttribute("style");
    ghost.classList.remove("dshmodmenu-dragging");
    ghost.classList.add("dshmodmenu-ghost");
    ghost.style.width = `${rect.width}px`;
    ghost.style.height = `${rect.height}px`;
    document.body.appendChild(ghost);
    gesture.ghost = ghost;

    const indicator = document.createElement("div");
    indicator.className = "dshmodmenu-indicator";
    document.body.appendChild(indicator);
    gesture.indicator = indicator;

    button.classList.add("dshmodmenu-dragging");
    button.classList.remove("dshmodmenu-pressing");
    document.body.classList.add("dshmodmenu-dragging");
    moveGhost(gesture);
    updateTarget(gesture);
  }

  function moveGhost(gesture) {
    const ghost = gesture.ghost;
    if (!ghost) return;
    ghost.style.left = `${gesture.lastX - gesture.grabX}px`;
    ghost.style.top = `${gesture.lastY - gesture.grabY}px`;
  }

  function updateTarget(gesture) {
    const { nav, rows } = visibleRows();
    const indicator = gesture.indicator;
    if (!indicator) return;
    if (!nav) {
      indicator.dataset.visible = "0";
      gesture.index = null;
      return;
    }

    const navRect = nav.getBoundingClientRect();
    const inside =
      gesture.lastX >= navRect.left - 24 &&
      gesture.lastX <= navRect.right + 24 &&
      gesture.lastY >= navRect.top - 24 &&
      gesture.lastY <= navRect.bottom + 24;

    const others = rows
      .filter((row) => row.key !== gesture.key)
      .map((row) => ({ key: row.key, rect: row.button.getBoundingClientRect() }))
      .filter((row) => row.rect.height > 0)
      .sort((a, b) => a.rect.top - b.rect.top);

    if (!inside || others.length === 0) {
      indicator.dataset.visible = "0";
      gesture.index = null;
      return;
    }

    let index = others.length;
    for (let i = 0; i < others.length; i += 1) {
      const middle = others[i].rect.top + others[i].rect.height / 2;
      if (gesture.lastY < middle) {
        index = i;
        break;
      }
    }
    gesture.index = index;

    let top;
    if (index >= others.length) {
      const last = others[others.length - 1].rect;
      top = last.top + last.height + 1;
    } else if (index === 0) {
      top = others[0].rect.top - 2;
    } else {
      top = others[index].rect.top - 2;
    }
    indicator.style.left = `${navRect.left + 4}px`;
    indicator.style.width = `${Math.max(0, navRect.width - 8)}px`;
    indicator.style.top = `${top}px`;
    indicator.dataset.visible = "1";
  }

  function commitDrag(key, index) {
    if (index !== null) {
      const { rows } = visibleRows();
      const keys = rows.map((row) => row.key);
      // The visual order is the saved order (applyOrder keeps it normalised),
      // NOT the DOM order — React renders in registration order.
      const current = readLayout().order.filter(
        (item) => keys.includes(item) && item !== key
      );
      for (const item of keys) {
        if (item !== key && !current.includes(item)) current.push(item);
      }
      const next = current.slice();
      next.splice(Math.max(0, Math.min(index, next.length)), 0, key);
      log("moved", key, "to", index, next);
      writeLayout({ order: next });
      schedulePass();
    }
    state.guardUntil = Date.now() + CLICK_GUARD_MS;
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
    moveGhost(gesture);
    updateTarget(gesture);
  }

  function onPointerUp() {
    const gesture = state.gesture;
    if (!gesture) return;
    if (gesture.phase === "dragging") {
      const index = gesture.index;
      const key = gesture.key;
      clearGesture();
      commitDrag(key, index);
      return;
    }
    clearGesture();
  }

  function onClickCapture(event) {
    if (Date.now() >= state.guardUntil) return;
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    if (!target.closest("button[data-modmenu-key]")) return;
    event.preventDefault();
    event.stopPropagation();
  }

  function onKeyDown(event) {
    if (event.key === "Escape" && state.gesture) clearGesture();
  }

  function onScroll() {
    if (state.gesture && state.gesture.phase === "dragging") clearGesture();
  }

  /* ------------------------------------------------------------------ */
  /* Lifecycle                                                           */
  /* ------------------------------------------------------------------ */

  function installObservers() {
    const target = document.body || document.documentElement;
    const observer = new MutationObserver((mutations) => {
      // Cheap relevance filter: ignore the app's own DOM churn (chat streaming,
      // etc.) unless it touches the panel list. If our cached nav is gone we
      // cannot tell, so let the pass re-locate it.
      const nav = state.nav;
      if (
        nav &&
        nav.isConnected &&
        !mutations.some((mutation) => {
          const node = mutation.target;
          return node === nav || nav.contains(node);
        })
      ) {
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
      if (element && element.isConnected) element.style.order = "";
    }
    state.decorated.clear();
    for (const button of document.querySelectorAll("[data-modmenu-key]")) {
      delete button.dataset.modmenuKey;
    }
  }

  return {
    start,
    stop,
    reset() {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch (error) {
        /* ignore */
      }
      schedulePass();
    },
    pass: schedulePass,
    state,
  };
}

function ensureStyles() {
  const id = "dsh-modmenu/panel-order.css";
  if (document.querySelector(`style[data-plugin-css="${id}"]`)) return;
  const style = document.createElement("style");
  style.dataset.pluginCss = id;
  style.textContent = CSS;
  document.head.appendChild(style);
}

function apply(ctx) {
  // eslint-disable-next-line no-console
  console.info("[dsh-modmenu] client loaded v0.2.1");
  // hot-reload safety: dispose a previous instance before installing
  try {
    const previous = window.__dshModmenu;
    if (previous && typeof previous.dispose === "function") previous.dispose();
  } catch (error) {
    /* ignore */
  }

  let runtime = null;
  ctx.effect(() => {
    ensureStyles();
    runtime = createRuntime(ctx);
    runtime.start();
    return () => {
      if (runtime) runtime.stop();
      runtime = null;
    };
  });

  window.__dshModmenu = {
    version: "0.2.1",
    pass: () => runtime && runtime.pass(),
    reset: () => runtime && runtime.reset(),
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
    },
    status: () => ({
      version: "0.2.1",
      order: readLayout().order,
      entries: readPanelEntries(ctx).length,
      nav: Boolean(runtime && runtime.state.nav),
      navLabel: runtime && runtime.state.nav ? runtime.state.nav.getAttribute("aria-label") : null,
      rows: Array.from(document.querySelectorAll("[data-modmenu-key]")).map(
        (element) => element.getAttribute("data-modmenu-key")
      ),
      hidden: readLayout().hidden || [],
      dragging: Boolean(runtime && runtime.state.gesture),
    }),
  };
}

window.__ModuleLoader__.load({
  id: "dsh-modmenu",
  factory: () => {
    const pluginExports = {
      apply,
      inject: ["slots"],
    };
    return pluginExports;
  },
});
