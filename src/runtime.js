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

    // Dropping a sidebar row on the "More" anchor tucks it away.
    if (gesture.source === "nav" && snapshot.moreRect && insideRect(snapshot.moreRect, x, y, 6)) {
      if (gesture.moreButton !== snapshot.moreButton) {
        if (gesture.moreButton) gesture.moreButton.classList.remove("dso-drop-more");
        gesture.moreButton = snapshot.moreButton;
        if (gesture.moreButton) gesture.moreButton.classList.add("dso-drop-more");
      }
      if (indicator.dataset.visible !== "0") indicator.dataset.visible = "0";
      gesture.target = { kind: "hide" };
      return;
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
