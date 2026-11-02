/* Multi-scope drag, ordering and "More" tucking runtime. */

function createRuntime(ctx) {
  const state = {
    stopped: false,
    passScheduled: false,
    passTimes: [],
    gesture: null,
    guardUntil: 0,
    pollTimer: 0,
    passFrame: 0,
    listenerCleanup: [],
    decorated: new Map(),
    warned: new Set(),
    readyLogged: false,
    passDeferred: false,
    menuListeners: new Set(),
    dismissMenu: null,
    found: {},
  };

  let observer = null;

  function warnOnce(key, message) {
    if (state.warned.has(key)) return;
    state.warned.add(key);
    try {
      ctx.logger?.debug?.(`[dsh-sidebar-organizer] ${message}`);
    } catch (err) {
      /* ignore */
    }
  }

  function notify() {
    for (const listener of Array.from(state.menuListeners)) {
      try {
        listener();
      } catch (err) {
        /* a broken menu must not break the runtime */
      }
    }
  }

  function remember(element) {
    if (!element || state.decorated.has(element)) return;
    state.decorated.set(element, {
      order: element.style.order,
      display: element.style.display,
    });
  }

  function applyOrder(element, value) {
    if (!element) return;
    remember(element);
    const next = String(value);
    if (element.style.order !== next) element.style.order = next;
  }

  function applyDisplay(element, hidden) {
    if (!element) return;
    remember(element);
    const original = state.decorated.get(element);
    if (hidden) {
      if (element.style.display !== "none") element.style.display = "none";
    } else if (original && element.style.display !== original.display) {
      element.style.display = original.display;
    }
  }

  function markRow(row, scope, hidden) {
    if (!row || !row.target) return;
    row.target.dataset.dsoScope = scope;
    row.target.dataset.dsoKey = row.id;
    if (hidden) row.target.dataset.dsoHidden = "1";
    else delete row.target.dataset.dsoHidden;
  }

  function normalizedLayout(scope) {
    const found = state.found[scope];
    const rows = found ? found.rows : [];
    const ids = rows.map((row) => row.id);
    const current = readScope(scope);
    const order = [];
    for (const id of current.order) {
      if (ids.indexOf(id) !== -1 && order.indexOf(id) === -1) order.push(id);
    }
    // A plugin can add an entry after we persisted a layout. Appending every
    // unseen id pushes that new entry below unrelated rows (the right guide's
    // "new terminal" ended up after the whole list). Insert it next to the
    // host's own DOM neighbours instead, so an untouched section keeps the
    // host order and a customised one only gains the new row at its source.
    for (let index = 0; index < ids.length; index += 1) {
      const id = ids[index];
      if (order.indexOf(id) !== -1) continue;
      let anchor = null;
      for (let next = index + 1; next < ids.length; next += 1) {
        if (order.indexOf(ids[next]) !== -1) {
          anchor = ids[next];
          break;
        }
      }
      if (anchor) {
        order.splice(order.indexOf(anchor), 0, id);
        continue;
      }
      let previous = null;
      for (let prev = index - 1; prev >= 0; prev -= 1) {
        if (order.indexOf(ids[prev]) !== -1) {
          previous = ids[prev];
          break;
        }
      }
      if (previous) order.splice(order.indexOf(previous) + 1, 0, id);
      else order.push(id);
    }
    const hidden = current.hidden.filter((id) => order.indexOf(id) !== -1);
    return { order, hidden };
  }

  // 0.5.4 appended a newly discovered row to the end of the persisted order
  // instead of inserting it at the host position. Existing layouts keep that
  // bad order forever, because the id is no longer "new" to normalizedLayout.
  // Repair the one safe shape once: every row except the trailing one is in
  // host order, so the trailing row was almost certainly appended by that bug.
  function repairAppendedOrder(found) {
    const scope = found.scope;
    if (isScopeRepaired(scope)) return;
    const layout = readScope(scope);
    const hostIds = found.rows.map((row) => row.id);
    if (!layout.order.length || layout.order.length !== hostIds.length) {
      // No persisted order yet, or a new row was just added. applyFound will
      // write the host order; examine the repaired order on the next pass.
      return;
    }
    if (hostIds.some((id) => layout.order.indexOf(id) === -1)) {
      return;
    }
    const hidden = new Set(layout.hidden);
    const visible = layout.order.filter((id) => !hidden.has(id));
    const hostVisible = hostIds.filter((id) => !hidden.has(id));
    if (visible.length !== hostVisible.length || isSameOrder(visible, hostVisible)) {
      markScopeRepaired(scope);
      return;
    }
    const last = visible[visible.length - 1];
    const rest = visible.slice(0, -1);
    const hostRest = hostVisible.filter((id) => id !== last);
    if (!isSameOrder(rest, hostRest)) {
      markScopeRepaired(scope);
      return;
    }
    writeScope(scope, { order: hostIds, hidden: layout.hidden });
    markScopeRepaired(scope);
  }

  function applyFound(found) {
    if (!found || !found.rows.length) return;
    const scope = found.scope;
    const layout = normalizedLayout(scope);
    const byId = new Map();
    for (const row of found.rows) byId.set(row.id, row);

    const hiddenSet = new Set(layout.hidden);
    const visible = layout.order.filter((id) => !hiddenSet.has(id));

    for (let index = 0; index < visible.length; index += 1) {
      const row = byId.get(visible[index]);
      if (!row) continue;
      markRow(row, scope, false);
      applyOrder(row.unit, index * 2 + 1);
      applyDisplay(row.unit, false);
      if (row.unit !== row.target) applyDisplay(row.target, false);
    }

    for (const id of layout.hidden) {
      const row = byId.get(id);
      if (!row) continue;
      markRow(row, scope, true);
      applyDisplay(row.unit, true);
      if (row.unit !== row.target) applyDisplay(row.target, true);
    }

    // Non-row host chrome beside the outlet (composer ContextMeter, etc.)
    // stays at the end instead of being tagged as a row.
    const tailBase = visible.length * 2 + 1000;
    const tails = found.tails || [];
    for (let index = 0; index < tails.length; index += 1) {
      applyOrder(tails[index], tailBase + index);
      applyDisplay(tails[index], false);
    }
    if (found.more) {
      applyOrder(found.more, tailBase + tails.length + 1);
      applyDisplay(found.more, false);
    }

    const nextOrder = visible.concat(layout.hidden);
    const current = readScope(scope);
    if (!isSameOrder(current.order, nextOrder) || !isSameOrder(current.hidden, layout.hidden)) {
      writeScope(scope, { order: nextOrder, hidden: layout.hidden });
    }
  }

  function pass(force) {
    if (state.stopped) return;
    if (state.gesture && !force) {
      state.passDeferred = true;
      return;
    }
    const now = Date.now();
    state.passTimes = state.passTimes.filter((time) => now - time < PASS_WINDOW_MS);
    if (state.passTimes.length > PASS_LIMIT) {
      warnOnce("watchdog", "layout pass loop detected; backing off");
      return;
    }
    state.passTimes.push(now);

    let seen = 0;
    for (const def of SCOPE_DEFS) {
      let found = null;
      try {
        found = discoverScope(ctx, def.key);
      } catch (err) {
        found = null;
      }
      if (!found || !found.rows.length) {
        warnOnce(`missing:${def.key}`, `no rows found for scope "${def.key}"`);
        continue;
      }
      state.found[def.key] = found;
      repairAppendedOrder(found);
      applyFound(found);
      seen += 1;
    }
    if (seen && !state.readyLogged) {
      state.readyLogged = true;
      try {
        ctx.logger?.debug?.(`[dsh-sidebar-organizer] tracking ${seen} layout regions`);
      } catch (err) {
        /* ignore */
      }
    }
  }

  function schedulePass() {
    if (state.stopped || state.passScheduled) return;
    state.passScheduled = true;
    state.passFrame = window.requestAnimationFrame(() => {
      state.passScheduled = false;
      pass(false);
    });
  }

  function refreshScope(scope) {
    const found = state.found[scope];
    if (found) applyFound(found);
    else schedulePass();
  }

  function visibleIds(scope) {
    const layout = normalizedLayout(scope);
    const hiddenSet = new Set(layout.hidden);
    return layout.order.filter((id) => !hiddenSet.has(id));
  }

  function rowFor(found, id) {
    if (!found) return null;
    for (const row of found.rows) if (row.id === id) return row;
    return null;
  }

  function canHide(scope, id) {
    const found = state.found[scope];
    const row = rowFor(found, id);
    if (!row || row.pinned) return false;
    const visible = visibleIds(scope);
    return visible.indexOf(id) !== -1 && visible.length > 1;
  }

  function hide(scope, id) {
    if (!canHide(scope, id)) return false;
    const layout = readScope(scope);
    const order = normalizedLayout(scope).order;
    const hidden = order.filter((key) => layout.hidden.indexOf(key) !== -1);
    if (hidden.indexOf(id) === -1) hidden.push(id);
    const nextOrder = order.filter((key) => hidden.indexOf(key) === -1).concat(hidden);
    writeScope(scope, { order: nextOrder, hidden });
    refreshScope(scope);
    notify();
    return true;
  }

  function reveal(scope, id, index) {
    const found = state.found[scope];
    const row = rowFor(found, id);
    if (!row) return false;
    const layout = normalizedLayout(scope);
    if (layout.hidden.indexOf(id) === -1) return false;
    const hidden = layout.hidden.filter((key) => key !== id);
    const visible = layout.order.filter((key) => hidden.indexOf(key) === -1);
    const at = typeof index === "number" ? Math.max(0, Math.min(visible.length, index)) : visible.length;
    visible.splice(at, 0, id);
    writeScope(scope, { order: visible.concat(hidden), hidden });
    refreshScope(scope);
    notify();
    return true;
  }

  function reorder(scope, id, index) {
    const found = state.found[scope];
    const row = rowFor(found, id);
    if (!row || row.pinned) return false;
    const layout = normalizedLayout(scope);
    const visible = layout.order.filter((key) => layout.hidden.indexOf(key) === -1);
    const from = visible.indexOf(id);
    if (from === -1) return false;
    const others = visible.filter((key) => key !== id);
    const at = Math.max(0, Math.min(others.length, typeof index === "number" ? index : others.length));
    others.splice(at, 0, id);
    writeScope(scope, { order: others.concat(layout.hidden), hidden: layout.hidden });
    refreshScope(scope);
    notify();
    return true;
  }

  function reorderHidden(scope, id, index) {
    const layout = normalizedLayout(scope);
    const from = layout.hidden.indexOf(id);
    if (from === -1) return false;
    const others = layout.hidden.filter((key) => key !== id);
    const at = Math.max(0, Math.min(others.length, typeof index === "number" ? index : others.length));
    others.splice(at, 0, id);
    writeScope(scope, { order: layout.order, hidden: others });
    notify();
    return true;
  }

  function resetScope(scope) {
    resetScopeState(scope);
    refreshScope(scope);
    notify();
  }

  function resetRegion(region) {
    const scopes = REGION_SCOPES[region] || [];
    for (const scope of scopes) {
      resetScopeState(scope);
      refreshScope(scope);
    }
    notify();
  }

  function reset() {
    forgetLayout();
    for (const scope of SCOPE_KEYS) refreshScope(scope);
    notify();
  }

  function isCustomized(scope) {
    const scopes = scope ? [scope] : SCOPE_KEYS;
    for (const key of scopes) {
      const layout = readScope(key);
      if (layout.hidden.length) return true;
      const found = state.found[key];
      if (!found) continue;
      const visible = layout.order.filter((id) => layout.hidden.indexOf(id) === -1);
      const defaultOrder = found.rows.map((row) => row.id);
      if (!isSameOrder(visible, defaultOrder)) return true;
    }
    return false;
  }

  function isCustomizedRegion(region) {
    for (const scope of REGION_SCOPES[region] || []) {
      if (isCustomized(scope)) return true;
    }
    return false;
  }

  function isDragEnabled(scope) {
    return readDragEnabled(scope);
  }

  function setDragEnabled(scope, enabled) {
    if (!writeDragEnabled(scope, enabled)) return false;
    if (!enabled && state.gesture && state.gesture.scope === scope) cancelGesture();
    notify();
    return true;
  }

  function snapshot() {
    const out = [];
    for (const def of SCOPE_DEFS) {
      const found = state.found[def.key];
      if (!found || !found.rows.length) {
        out.push({
          scope: def.key,
          axis: def.axis,
          rows: [],
          hasMore: false,
          dragEnabled: isDragEnabled(def.key),
        });
        continue;
      }
      const layout = normalizedLayout(def.key);
      const hiddenSet = new Set(layout.hidden);
      const byId = new Map();
      for (const row of found.rows) byId.set(row.id, row);
      const rows = [];
      for (const id of layout.order) {
        const row = byId.get(id);
        if (!row) continue;
        rows.push({
          scope: def.key,
          id: row.id,
          label: row.label || id,
          hidden: hiddenSet.has(id),
          pinned: !!row.pinned,
        });
      }
      out.push({
        scope: def.key,
        axis: def.axis,
        rows,
        hasMore: !!found.more,
        dragEnabled: isDragEnabled(def.key),
      });
    }
    return out;
  }

  function labelFor(scope, id) {
    const found = state.found[scope];
    const row = rowFor(found, id);
    if (row && row.label) return row.label;
    const def = scopeDef(scope);
    if (def && def.slot) {
      for (const entry of readEntries(ctx, def.slot)) {
        const info = describeEntry(entry);
        if (info.id === id && info.label) return info.label;
      }
    }
    return id;
  }

  function iconFor(scope, id) {
    const found = state.found[scope];
    const row = rowFor(found, id);
    if (!row || !row.target) return null;
    const glyph = row.target.querySelector('[aria-hidden="true"]') || row.target.querySelector("svg");
    const svg = glyph && (glyph.tagName === "svg" ? glyph : glyph.querySelector("svg"));
    if (!svg) return null;
    try {
      const markup = new XMLSerializer().serializeToString(svg);
      return scopeMarkupIds(markup, "dso-icon-" + (++iconSeq));
    } catch (err) {
      return null;
    }
  }

  function hiddenForRegion(region) {
    const scopes = REGION_SCOPES[region] || [];
    const out = [];
    for (const scope of scopes) {
      const found = state.found[scope];
      if (!found) continue;
      const layout = normalizedLayout(scope);
      const byId = new Map();
      for (const row of found.rows) byId.set(row.id, row);
      for (const id of layout.hidden) {
        const row = byId.get(id);
        if (!row) continue;
        out.push({
          scope,
          id,
          label: row.label || labelFor(scope, id),
          icon: iconFor(scope, id),
        });
      }
    }
    return out;
  }

  function activate(scope, id) {
    const found = state.found[scope] || (() => {
      try {
        return discoverScope(ctx, scope);
      } catch (err) {
        return null;
      }
    })();
    const row = rowFor(found, id);
    if (!row || !row.target) return false;
    try {
      row.target.click();
      return true;
    } catch (err) {
      return false;
    }
  }

  function status() {
    const scopes = {};
    for (const def of SCOPE_DEFS) {
      const found = state.found[def.key];
      const layout = readScope(def.key);
      scopes[def.key] = {
        found: !!found,
        rows: found ? found.rows.map((row) => ({ id: row.id, label: row.label, hidden: layout.hidden.indexOf(row.id) !== -1, pinned: !!row.pinned })) : [],
        hidden: layout.hidden.slice(),
        dragEnabled: isDragEnabled(def.key),
      };
    }
    return {
      version: VERSION,
      scopes,
      gesture: state.gesture ? { scope: state.gesture.scope, id: state.gesture.id, started: state.gesture.started } : null,
    };
  }

  // ---------------------------------------------------------------- gestures

  function findRowElement(scope, id) {
    const nodes = document.querySelectorAll("[data-dso-key]");
    for (const node of nodes) {
      if (node.dataset.dsoScope === scope && node.dataset.dsoKey === id) return node;
    }
    return null;
  }

  function menuKey(element) {
    const raw = element && element.dataset ? element.dataset.dsoMoreKey : "";
    if (!raw) return null;
    const at = raw.indexOf(":");
    if (at <= 0) return null;
    return { scope: raw.slice(0, at), id: raw.slice(at + 1) };
  }

  function parseMenuRow(element) {
    return menuKey(element);
  }

  // Rows are stored in host DOM order, but `style.order` can make the visible
  // order different. Drop indexes are expressed in VISUAL order (the same
  // order `reorder` uses), so the snapshot must be sorted by geometry, not by
  // DOM order. Sorting by the primary axis is enough for a single strip; the
  // secondary coordinate breaks ties/wrapped lines deterministically.
  function visualOrder(a, b, axis) {
    const ar = a.rect;
    const br = b.rect;
    if (axis === "x") {
      const lineA = Math.round(ar.top / 8);
      const lineB = Math.round(br.top / 8);
      if (lineA !== lineB) return ar.top - br.top;
      return ar.left - br.left;
    }
    const columnA = Math.round(ar.left / 8);
    const columnB = Math.round(br.left / 8);
    if (columnA !== columnB) return ar.left - br.left;
    return ar.top - br.top;
  }

  function buildSnapshot(gesture) {
    let found = null;
    try {
      found = discoverScope(ctx, gesture.scope);
    } catch (err) {
      found = null;
    }
    if (!found) found = state.found[gesture.scope] || null;
    if (!found) return null;
    const layout = readScope(gesture.scope);
    const hiddenSet = new Set(layout.hidden);
    const items = [];
    for (const row of found.rows) {
      if (hiddenSet.has(row.id)) continue;
      const rect = row.unit.getBoundingClientRect();
      if (!rect.width && !rect.height) continue;
      items.push({ id: row.id, unit: row.unit, target: row.target, rect });
    }
    items.sort((a, b) => visualOrder(a, b, found.axis));
    if (gesture.source === "row" && items.every((item) => item.id !== gesture.id)) items.length = 0;

    const menuItems = [];
    if (gesture.source === "menu") {
      for (const node of document.querySelectorAll("[data-dso-more-key]")) {
        const parsed = parseMenuRow(node);
        if (!parsed || parsed.scope !== gesture.scope) continue;
        menuItems.push({ id: parsed.id, element: node, rect: node.getBoundingClientRect() });
      }
      menuItems.sort((a, b) => a.rect.top - b.rect.top);
    }
    let menuRect = null;
    if (menuItems.length) {
      let left = Infinity;
      let top = Infinity;
      let right = -Infinity;
      let bottom = -Infinity;
      for (const item of menuItems) {
        left = Math.min(left, item.rect.left);
        top = Math.min(top, item.rect.top);
        right = Math.max(right, item.rect.right);
        bottom = Math.max(bottom, item.rect.bottom);
      }
      menuRect = { left, top, right, bottom, width: right - left, height: bottom - top };
    }

    const container = found.container.getBoundingClientRect();
    const moreTarget = found.moreTarget || found.more;
    const more = moreTarget ? moreTarget.getBoundingClientRect() : null;
    return {
      found,
      axis: found.axis,
      container,
      items,
      menuItems,
      menuRect,
      moreRect: more,
    };
  }

  function createGhost(element, rect) {
    if (!element) return null;
    const clone = element.cloneNode(true);
    clone.removeAttribute("id");
    clone.querySelectorAll("[id]").forEach((node) => node.removeAttribute("id"));
    // The live row carries inline styles and state attributes from the host
    // (position, transform, aria-current, our own order/display marks). Keeping
    // any of them on the fixed-position clone pins it to the host layout or
    // drags it back into the sidebar. The old implementation stripped all of
    // these before positioning the ghost; the generalized version must too.
    clone.removeAttribute("style");
    clone.removeAttribute("aria-current");
    clone.removeAttribute("data-dso-key");
    clone.removeAttribute("data-dso-scope");
    clone.removeAttribute("data-dso-hidden");
    clone.removeAttribute("data-dso-more-key");
    clone.classList.remove("dso-dragging", "dso-pressing", "dso-ghost-armed");
    clone.classList.add("dso-ghost");
    clone.style.width = rect.width + "px";
    clone.style.height = rect.height + "px";
    clone.style.left = rect.left + "px";
    clone.style.top = rect.top + "px";
    document.body.appendChild(clone);
    return clone;
  }

  function createIndicator() {
    const indicator = document.createElement("div");
    indicator.className = "dso-indicator";
    indicator.dataset.visible = "0";
    document.body.appendChild(indicator);
    return indicator;
  }

  function removeGhost(gesture) {
    if (!gesture) return;
    if (gesture.ghost) gesture.ghost.remove();
    if (gesture.indicator) gesture.indicator.remove();
    if (gesture.element && gesture.element.classList) {
      gesture.element.classList.remove("dso-dragging", "dso-pressing");
    }
    if (gesture.element && gesture.pointerId !== undefined) {
      try {
        if (gesture.element.hasPointerCapture(gesture.pointerId)) {
          gesture.element.releasePointerCapture(gesture.pointerId);
        }
      } catch (error) {
        /* the element may already be detached */
      }
    }
    if (gesture.snapshot && gesture.snapshot.found) {
      const more = gesture.snapshot.found.moreTarget || gesture.snapshot.found.more;
      // Leave `dso-drop-receive` on the anchor: it is a one-shot 260 ms pulse
      // owned by pulseClass(), not by the drag session.
      if (more) more.classList.remove("dso-drop-more");
    }
    gesture.ghost = null;
    gesture.indicator = null;
    gesture.moreElement = null;
  }

  function markDropMore(gesture, active) {
    if (gesture && gesture.ghost) {
      gesture.ghost.classList.toggle("dso-ghost-armed", Boolean(active));
    }
    if (!gesture || !gesture.snapshot || !gesture.snapshot.found) return;
    // `found.more` may be the flex wrapper (needed for style.order), while the
    // rounded surface belongs to the actual button. Put the drop ring there so
    // its outline follows the button's border-radius.
    const element = gesture.snapshot.found.moreTarget || gesture.snapshot.found.more;
    if (!element) return;
    if (active) {
      // Hover only arms the anchor. The receive bounce is a one-shot pulse on
      // release; playing it on hover made the 0.4.x hover feel completely
      // different (and made the anchor look like it was bouncing constantly).
      element.classList.add("dso-drop-more");
    } else {
      element.classList.remove("dso-drop-more");
    }
  }

  function pointIn(rect, x, y, pad) {
    if (!rect) return false;
    const margin = pad || 0;
    return x >= rect.left - margin && x <= rect.right + margin && y >= rect.top - margin && y <= rect.bottom + margin;
  }

  function gapBoundary(axis, before, after) {
    if (before && after) {
      return axis === "x"
        ? (before.right + after.left) / 2
        : (before.bottom + after.top) / 2;
    }
    if (before) return axis === "x" ? before.right : before.bottom;
    return axis === "x" ? after.left : after.top;
  }

  function indexAt(items, x, y, axis, allItems) {
    if (!items.length) return { index: 0, boundary: axis === "x" ? x : y };
    const coordinate = axis === "x" ? x : y;
    for (let index = 0; index < items.length; index += 1) {
      const rect = items[index].rect;
      const middle = axis === "x" ? rect.left + rect.width / 2 : rect.top + rect.height / 2;
      if (coordinate < middle) {
        // The source row is removed from `items`, but it still occupies its
        // layout slot. Use the full visual list to find the REAL gap, including
        // the source and any hidden row. Otherwise dropping at the end anchors
        // the line to the last remaining row's edge (visually inside the tab).
        const all = allItems && allItems.length ? allItems : items;
        const at = all.findIndex((item) => item.id === items[index].id);
        const previous = at > 0 ? all[at - 1].rect : null;
        return { index, boundary: gapBoundary(axis, previous, rect) };
      }
    }
    const last = items[items.length - 1].rect;
    const all = allItems && allItems.length ? allItems : items;
    const at = all.findIndex((item) => item.id === items[items.length - 1].id);
    const next = at >= 0 && at + 1 < all.length ? all[at + 1].rect : null;
    return { index: items.length, boundary: gapBoundary(axis, last, next) };
  }

  function showIndicator(gesture, axis, boundary, rect) {
    const indicator = gesture.indicator;
    if (!indicator) return;
    indicator.dataset.visible = "1";
    indicator.className = "dso-indicator " + (axis === "x" ? "dso-indicator-v" : "dso-indicator-h");
    if (axis === "x") {
      indicator.style.left = boundary - 1 + "px";
      indicator.style.top = rect.top + 4 + "px";
      indicator.style.width = "2px";
      indicator.style.height = Math.max(0, rect.height - 8) + "px";
    } else {
      indicator.style.left = rect.left + 4 + "px";
      indicator.style.top = boundary - 1 + "px";
      indicator.style.width = Math.max(0, rect.width - 8) + "px";
      indicator.style.height = "2px";
    }
  }

  function hideIndicator(gesture) {
    if (gesture && gesture.indicator) gesture.indicator.dataset.visible = "0";
  }

  function updateDragTarget(gesture, x, y) {
    const snapshot = gesture.snapshot;
    if (!snapshot) return;
    gesture.target = null;
    hideIndicator(gesture);
    markDropMore(gesture, false);

    if (gesture.source === "menu" && snapshot.menuRect && pointIn(snapshot.menuRect, x, y)) {
      const others = snapshot.menuItems.filter((item) => item.id !== gesture.id);
      const hit = indexAt(others, x, y, "y", snapshot.menuItems);
      gesture.target = { kind: "menu", index: hit.index, beforeId: others[hit.index] ? others[hit.index].id : null };
      showIndicator(gesture, "y", hit.boundary, snapshot.menuRect);
      return;
    }

    if (snapshot.moreRect && pointIn(snapshot.moreRect, x, y, 2)) {
      gesture.target = { kind: "hide" };
      markDropMore(gesture, true);
      return;
    }

    if (!pointIn(snapshot.container, x, y, 10)) return;
    const others = snapshot.items.filter((item) => item.id !== gesture.id);
    const hit = indexAt(others, x, y, snapshot.axis, snapshot.items);
    gesture.target = { kind: "place", index: hit.index, beforeId: others[hit.index] ? others[hit.index].id : null };
    showIndicator(gesture, snapshot.axis, hit.boundary, snapshot.container);
  }

  function positionGhost(gesture) {
    if (!gesture || !gesture.ghost) return;
    gesture.ghost.style.left = gesture.x - gesture.offsetX + "px";
    gesture.ghost.style.top = gesture.y - gesture.offsetY + "px";
  }

  function beginDrag(gesture) {
    if (!gesture || state.gesture !== gesture || gesture.started) return;
    if (!isDragEnabled(gesture.scope)) {
      cancelGesture();
      return;
    }
    // Commit any queued layout pass before measuring the frozen rects. Without
    // this, a drag started in the same frame as a previous drop can snapshot
    // the pre-order positions and make the ghost and indicator jump.
    if (gesture.source === "row") pass(true);
    let element = gesture.source === "row" ? findRowElement(gesture.scope, gesture.id) : gesture.element;
    if (!element && gesture.source === "row") element = gesture.element;
    const snapshot = buildSnapshot(gesture);
    if (!snapshot || !snapshot.items.length || !element) {
      cancelGesture();
      return;
    }
    gesture.started = true;
    gesture.snapshot = snapshot;
    gesture.element = element;
    const rect = element.getBoundingClientRect();
    try {
      if (gesture.pointerId !== undefined && element.setPointerCapture) {
        element.setPointerCapture(gesture.pointerId);
      }
    } catch (error) {
      /* pointer capture is an enhancement, not a requirement */
    }
    element.classList.add("dso-dragging");
    gesture.ghost = createGhost(element, rect);
    gesture.indicator = createIndicator();
    if (gesture.ghost) {
      gesture.offsetX = gesture.startX - rect.left;
      gesture.offsetY = gesture.startY - rect.top;
      gesture.x = gesture.startX;
      gesture.y = gesture.startY;
      positionGhost(gesture);
    }
    document.body.classList.add("dso-dragging");
    updateDragTarget(gesture, gesture.x, gesture.y);
  }

  function cancelGesture() {
    endGesture(false);
  }

  function onWindowBlur() {
    // A window can lose focus mid-drag (Alt+Tab, devtools, native menu); the
    // pointerup then goes elsewhere and the indicator would stay on screen.
    if (state.gesture) endGesture(false);
  }

  function endGesture(guard) {
    const gesture = state.gesture;
    if (!gesture) return;
    if (gesture.timer) window.clearTimeout(gesture.timer);
    state.gesture = null;
    removeGhost(gesture);
    document.body.classList.remove("dso-dragging");
    if (guard) state.guardUntil = Date.now() + CLICK_GUARD_MS;
    if (state.passDeferred) {
      state.passDeferred = false;
      schedulePass();
    }
  }

  function shakeGhost(gesture) {
    if (!gesture || !gesture.ghost) return;
    gesture.ghost.classList.add("dso-drop-reject");
    window.setTimeout(() => {
      if (state.gesture === gesture) endGesture(true);
    }, 180);
  }

  function pulseClass(element, className, duration) {
    if (!element) return;
    element.classList.remove(className);
    // Force a style flush so a repeated pulse restarts instead of being ignored.
    void element.offsetWidth;
    element.classList.add(className);
    window.setTimeout(() => element.classList.remove(className), duration);
  }

  function reduceMotion() {
    try {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch (error) {
      return false;
    }
  }

  // 0.4.x absorb feel: a three-keyframe flight into the More anchor plus a
  // one-shot receive pulse. The generalized CSS-transition version snapped the
  // transform in one step and dropped the receive bounce, which read as ugly.
  function absorbGhost(gesture, after) {
    const found = gesture && gesture.snapshot && gesture.snapshot.found;
    const more = found ? found.moreTarget || found.more : null;
    const ghost = gesture && gesture.ghost;
    if (!ghost || !ghost.isConnected || !more || reduceMotion()) {
      if (more) pulseClass(more, "dso-drop-receive", 260);
      endGesture(true);
      if (after) after();
      return;
    }
    const ghostRect = ghost.getBoundingClientRect();
    const moreRect = more.getBoundingClientRect();
    const dx = moreRect.left + moreRect.width / 2 - (ghostRect.left + ghostRect.width / 2);
    const dy = moreRect.top + moreRect.height / 2 - (ghostRect.top + ghostRect.height / 2);
    const armed = ghost.classList.contains("dso-ghost-armed");
    markDropMore(gesture, false);
    let animation = null;
    try {
      animation = ghost.animate(
        [
          { transform: `translate(0px, 0px) scale(${armed ? 0.94 : 1})`, opacity: 0.96, offset: 0 },
          {
            transform: `translate(${dx * 0.55}px, ${dy * 0.55}px) scale(0.7)`,
            opacity: 0.9,
            offset: 0.55,
          },
          {
            transform: `translate(${dx}px, ${dy}px) scale(0.12)`,
            opacity: 0,
            offset: 1,
          },
        ],
        { duration: 180, easing: "cubic-bezier(.2,.7,.3,1)", fill: "forwards" }
      );
    } catch (error) {
      animation = null;
    }
    pulseClass(more, "dso-drop-receive", 260);
    if (!animation) {
      endGesture(true);
      if (after) after();
      return;
    }
    if (typeof animation.finished?.then === "function") {
      animation.finished.then(
        () => {
          if (state.gesture === gesture) endGesture(true);
          if (after) after();
        },
        () => {
          if (state.gesture === gesture) endGesture(true);
          if (after) after();
        }
      );
    } else {
      window.setTimeout(() => {
        if (state.gesture === gesture) endGesture(true);
        if (after) after();
      }, 200);
    }
  }

  function commitDrag() {
    const gesture = state.gesture;
    if (!gesture) return;
    if (!gesture.started || !gesture.target) {
      endGesture(true);
      return;
    }
    const target = gesture.target;
    if (target.kind === "hide") {
      if (!canHide(gesture.scope, gesture.id)) {
        shakeGhost(gesture);
        return;
      }
      // 0.4.x hid the row only after the flight ended. Hiding first makes the
      // list jump under the ghost while it is still animating.
      absorbGhost(gesture, () => hide(gesture.scope, gesture.id));
      return;
    }
    if (target.kind === "menu") {
      reorderHidden(gesture.scope, gesture.id, target.index);
      endGesture(true);
      return;
    }
    if (target.kind === "place") {
      if (gesture.source === "menu") reveal(gesture.scope, gesture.id, target.index);
      else reorder(gesture.scope, gesture.id, target.index);
      endGesture(true);
    }
  }

  function onPointerDown(event) {
    if (state.stopped || state.gesture) return;
    if (typeof event.button === "number" && event.button !== 0) return;
    const target = event.target;
    if (!target || target.nodeType !== 1) return;
    if (target.closest(".dso-config")) return;

    const menuRow = target.closest("[data-dso-more-key]");
    if (menuRow) {
      const parsed = parseMenuRow(menuRow);
      if (!parsed) return;
      if (!isDragEnabled(parsed.scope)) return;
      startGesture(menuRow, parsed.scope, parsed.id, "menu", event);
      return;
    }

    const row = target.closest("[data-dso-key]");
    if (!row) return;
    const scope = row.dataset.dsoScope;
    const id = row.dataset.dsoKey;
    if (!scope || !id) return;
    if (!isDragEnabled(scope)) return;
    const found = state.found[scope];
    const info = rowFor(found, id);
    if (info && info.pinned) return;
    startGesture(row, scope, id, "row", event);
  }

  function startGesture(element, scope, id, source, event) {
    const gesture = {
      element,
      scope,
      id,
      source,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      x: event.clientX,
      y: event.clientY,
      started: false,
      target: null,
      snapshot: null,
      ghost: null,
      indicator: null,
      offsetX: 0,
      offsetY: 0,
      timer: 0,
      moreElement: null,
    };
    if (source === "row") {
      gesture.element = element;
    }
    state.gesture = gesture;
    gesture.timer = window.setTimeout(() => {
      if (source === "row") element.classList.remove("dso-pressing");
      beginDrag(gesture);
    }, LONG_PRESS_MS);
  }

  function onPointerMove(event) {
    const gesture = state.gesture;
    if (!gesture) return;
    gesture.x = event.clientX;
    gesture.y = event.clientY;
    if (!gesture.started) {
      if (Math.abs(event.clientX - gesture.startX) > MOVE_TOLERANCE || Math.abs(event.clientY - gesture.startY) > MOVE_TOLERANCE) {
        if (gesture.element) gesture.element.classList.remove("dso-pressing");
        if (gesture.timer) window.clearTimeout(gesture.timer);
        cancelGesture();
      }
      return;
    }
    event.preventDefault();
    positionGhost(gesture);
    updateDragTarget(gesture, event.clientX, event.clientY);
  }

  function onPointerUp() {
    const gesture = state.gesture;
    if (!gesture) return;
    if (gesture.started) commitDrag();
    else cancelGesture();
  }

  function onClickCapture(event) {
    if (Date.now() < state.guardUntil) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  function onKeyDown(event) {
    if (event.key === "Escape" && state.gesture) {
      event.preventDefault();
      cancelGesture();
      return;
    }
    if (!event.altKey || (event.key !== "ArrowUp" && event.key !== "ArrowDown" && event.key !== "ArrowLeft" && event.key !== "ArrowRight")) {
      return;
    }
    const target = event.target;
    if (!target || target.nodeType !== 1) return;
    const element = target.closest("[data-dso-key]");
    if (!element) return;
    const scope = element.dataset.dsoScope;
    const id = element.dataset.dsoKey;
    if (!scope || !id) return;
    const def = scopeDef(scope);
    const delta = event.key === "ArrowUp" || event.key === "ArrowLeft" ? -1 : 1;
    if (def && def.axis === "x" && (event.key === "ArrowUp" || event.key === "ArrowDown")) return;
    if (def && def.axis === "y" && (event.key === "ArrowLeft" || event.key === "ArrowRight")) return;
    event.preventDefault();
    const visible = visibleIds(scope);
    const index = visible.indexOf(id);
    if (index === -1) return;
    reorder(scope, id, index + delta);
    const next = findRowElement(scope, id);
    if (next && next.focus) next.focus();
  }

  function onScroll() {
    const gesture = state.gesture;
    if (!gesture || !gesture.started) return;
    const snapshot = buildSnapshot(gesture);
    if (snapshot) gesture.snapshot = snapshot;
    positionGhost(gesture);
    updateDragTarget(gesture, gesture.x, gesture.y);
  }

  function relevantMutation(mutation) {
    if (mutation.type !== "childList") return false;
    const target = mutation.target;
    if (target && target.nodeType === 1) {
      for (const def of SCOPE_DEFS) {
        const found = state.found[def.key];
        if (found && found.container && found.container.contains(target)) return true;
      }
      if (target.closest && target.closest('[data-slot], [data-shortcut-modal], [data-conversation-tabs], [data-sidebar-right-guide]')) return true;
    }
    for (const def of SCOPE_DEFS) {
      const found = state.found[def.key];
      if (found && found.container && !found.container.isConnected) return true;
    }
    const nodes = Array.from(mutation.addedNodes).concat(Array.from(mutation.removedNodes));
    for (const node of nodes) {
      if (!node || node.nodeType !== 1) continue;
      if (node.matches && node.matches('[data-slot], [data-shortcut-modal], [data-conversation-tabs], [data-sidebar-right-guide], [data-dso-key]')) return true;
      if (node.querySelector && node.querySelector('[data-slot], [data-shortcut-modal], [data-conversation-tabs], [data-sidebar-right-guide], [data-dso-key]')) return true;
    }
    return false;
  }

  function addListener(target, type, handler, options) {
    target.addEventListener(type, handler, options);
    state.listenerCleanup.push(() => target.removeEventListener(type, handler, options));
  }

  function start() {
    if (state.stopped) return;
    try {
      if (window.localStorage.getItem(DISABLED_KEY) === "1" || window.localStorage.getItem(LEGACY_DISABLED_KEY) === "1") {
        ctx.logger?.debug?.("[dsh-sidebar-organizer] disabled by " + DISABLED_KEY);
        return;
      }
    } catch (err) {
      /* ignore */
    }

    addListener(document, "pointerdown", onPointerDown, true);
    addListener(document, "pointermove", onPointerMove, { capture: true, passive: false });
    addListener(document, "pointerup", onPointerUp, true);
    addListener(document, "pointercancel", onPointerUp, true);
    addListener(document, "click", onClickCapture, true);
    addListener(document, "keydown", onKeyDown, true);
    addListener(window, "scroll", onScroll, true);
    addListener(window, "blur", onWindowBlur);

    if (typeof MutationObserver !== "undefined") {
      observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (relevantMutation(mutation)) {
            schedulePass();
            return;
          }
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }

    let ticks = 0;
    state.pollTimer = window.setInterval(() => {
      ticks += 1;
      if (state.stopped || ticks > 20) {
        window.clearInterval(state.pollTimer);
        state.pollTimer = 0;
        return;
      }
      for (const def of SCOPE_DEFS) {
        if (!state.found[def.key]) {
          schedulePass();
          return;
        }
      }
    }, 500);

    pass(true);
  }

  function stop() {
    if (state.stopped) return;
    state.stopped = true;
    if (state.passFrame) window.cancelAnimationFrame(state.passFrame);
    if (state.pollTimer) window.clearInterval(state.pollTimer);
    if (observer) observer.disconnect();
    observer = null;
    cancelGesture();
    for (const cleanup of state.listenerCleanup.splice(0)) {
      try {
        cleanup();
      } catch (err) {
        /* ignore */
      }
    }
    for (const [element, original] of state.decorated) {
      try {
        element.style.order = original.order;
        element.style.display = original.display;
        delete element.dataset.dsoKey;
        delete element.dataset.dsoScope;
        delete element.dataset.dsoHidden;
      } catch (err) {
        /* element may already be gone */
      }
    }
    state.decorated.clear();
    document.body.classList.remove("dso-dragging");
    state.found = {};
  }

  function subscribe(listener) {
    if (typeof listener !== "function") return () => {};
    state.menuListeners.add(listener);
    return () => state.menuListeners.delete(listener);
  }

  return {
    start,
    stop,
    pass: schedulePass,
    refresh: pass,
    state,
    subscribe,
    subscribeMenu: subscribe,
    setDismiss(fn) {
      state.dismissMenu = typeof fn === "function" ? fn : null;
    },
    dismiss() {
      try {
        state.dismissMenu?.();
      } catch (err) {
        /* ignore */
      }
    },
    snapshot,
    hide,
    reveal,
    reorder,
    reorderHidden,
    resetScope,
    resetRegion,
    reset,
    canHide,
    isCustomized,
    isCustomizedRegion,
    isDragEnabled,
    setDragEnabled,
    activate,
    hiddenForRegion,
    labelFor,
    iconFor,
    status,
  };
}
