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
    settingsMenu: null,
    settingsMenuAnchor: null,
    headerMenu: null,
    headerMenuBlock: null,
    headerMenuSignature: "",
    clickBypass: null,
    hotkeyDown: false,
    hotkeyToggleOn: false,
    hotkeyCapturing: false,
    hotkeyCaptureHandler: null,
    found: {},
    // 0.2.2 contextual (right-click) menus. The host owns and unmounts these
    // portals, so everything here is per-open-menu and rebuilt on each sync.
    contextMenu: null,
    contextKind: "",
    contextRows: null,
    contextStyled: new Map(),
    // The menu's own stacked blocks (scroll viewport, footer) are flattened to
    // display:contents while a custom layout is applied, so every action in the
    // menu - including 归档会话 and root-level plugin buttons - shares one flex
    // sequence and can be ordered against each other.
    contextShell: new Map(),
    contextDividerNodes: [],
    contextTemplate: null,
    contextFrame: 0,
    contextPendingKind: "",
    contextPendingAt: 0,
    contextOpenedAt: 0,
    contextPendingToggle: null,
    // The injected More anchor and its popup. Both live inside the open menu
    // (never on <body>), so the host's own outside-click closer keeps the menu
    // open while the popup is being used and tears them down with the portal.
    ctxMoreAnchor: null,
    ctxMorePanel: null,
    ctxMoreOpen: false,
    ctxMoreDragActive: false,
    ctxMoreTimer: 0,
    // Which host phase the flattened rows were last mirrored for ("enter" /
    // "replace" / "dismiss" / ""). The phase attribute is watched, and the rows
    // take the host's own animation so their fade matches it exactly.
    contextMirrorPhase: "",
    contextPhaseObserver: null,
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

  // The settings nav has no host overflow menu.  The injected anchor is an
  // ordinary More target for dragging, but it needs its own popup: a small
  // body-level list of tucked rows, whose items reuse data-dso-more-key so the
  // existing drag source/reorder logic works unchanged.
  function settingsHiddenRows() {
    const found = state.found.settings;
    if (!found) return [];
    const layout = normalizedLayout("settings");
    const out = [];
    for (const id of layout.hidden) {
      const row = rowFor(found, id);
      if (row) out.push({ id, label: row.label || id });
    }
    return out;
  }

  function closeSettingsMoreMenu() {
    const menu = state.settingsMenu;
    state.settingsMenu = null;
    state.settingsMenuAnchor = null;
    if (menu && menu.parentNode) menu.parentNode.removeChild(menu);
  }

  function positionSettingsMoreMenu(menu, anchor) {
    const rect = anchor.getBoundingClientRect();
    if (rect.bottom < 8 || rect.top > window.innerHeight - 8) {
      closeSettingsMoreMenu();
      return;
    }
    const width = Math.max(160, Math.round(rect.width));
    menu.style.width = width + "px";
    let left = Math.round(rect.left);
    if (left + width > window.innerWidth - 8) {
      left = Math.max(8, window.innerWidth - width - 8);
    }
    menu.style.left = left + "px";
    const height = menu.offsetHeight;
    let top = Math.round(rect.bottom + 6);
    if (top + height > window.innerHeight - 8) {
      top = Math.max(8, Math.round(rect.top - height - 6));
    }
    menu.style.top = top + "px";
  }

  function openSettingsMoreMenu(anchor) {
    const rows = settingsHiddenRows();
    if (!rows.length) return;
    closeSettingsMoreMenu();
    const text = strings();
    const menu = document.createElement("div");
    menu.className = "dso-settings-more-menu";
    menu.setAttribute("role", "menu");
    menu.setAttribute("aria-label", text.moreMenu);
    for (const item of rows) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "dso-settings-more-item";
      button.setAttribute("role", "menuitem");
      button.setAttribute("data-dso-more-key", "settings:" + item.id);
      button.textContent = item.label;
      menu.appendChild(button);
    }
    document.body.appendChild(menu);
    state.settingsMenu = menu;
    state.settingsMenuAnchor = anchor;
    positionSettingsMoreMenu(menu, anchor);
  }

  function toggleSettingsMoreMenu(anchor) {
    if (state.settingsMenu) {
      closeSettingsMoreMenu();
      return;
    }
    openSettingsMoreMenu(anchor);
  }

  // The session header's "More actions" menu belongs to the shipped
  // session-log-export plugin: its items are hardcoded, it exposes no slot, and
  // it cannot be extended from React.  So the tucked rows of our header scope
  // are injected into that open menu as plain DOM, above the native rows, and
  // are torn down when the host closes it.  Everything else (drag out, reorder,
  // hide) reuses the ordinary menu-row source via data-dso-more-key.
  function headerAnchor() {
    const found = state.found.header;
    if (!found) return null;
    return found.moreTarget || found.more || null;
  }

  function headerHiddenRows() {
    const found = state.found.header;
    if (!found) return [];
    const layout = normalizedLayout("header");
    const out = [];
    for (const id of layout.hidden) {
      const row = rowFor(found, id);
      if (row) out.push({ id, label: row.label || id });
    }
    return out;
  }

  function menuDistance(anchorRect, rect) {
    const dx = Math.max(0, anchorRect.left - rect.right, rect.left - anchorRect.right);
    const dy = Math.max(0, anchorRect.top - rect.bottom, rect.top - anchorRect.bottom);
    return dx * dx + dy * dy;
  }

  // Every visible popup that could be the host's "More actions" menu. Menus
  // without rows (anchors' empty shells, our own settings popup) are not
  // candidates: the shipped menu always has at least one menuitem.
  function headerMenus() {
    const out = [];
    for (const menu of document.querySelectorAll('[role="menu"]')) {
      if (menu.classList.contains("dso-settings-more-menu")) continue;
      if (menu.closest(".dso-settings-more-menu")) continue;
      // 0.2.2 routes the same primitives.Menu through a contextual surface for
      // right-click / keyboard menus. It is never the header's More menu.
      if (menu.closest("[data-context-menu]")) continue;
      if (!menu.querySelector('[role="menuitem"]')) continue;
      const rect = menu.getBoundingClientRect();
      if (!rect.width && !rect.height) continue;
      out.push({ menu, rect });
    }
    return out;
  }

  function hostHeaderMenu() {
    const anchor = headerAnchor();
    if (!anchor || !anchor.isConnected) return null;
    if (anchor.getAttribute("aria-expanded") !== "true") return null;
    const candidates = headerMenus();
    if (!candidates.length) return null;
    // Several popovers can be open (e.g. the split control's "open with"
    // menu); the one we already tagged is definitely the host's menu.
    for (const entry of candidates) {
      if (entry.menu.querySelector("[data-dso-host-id]")) return entry.menu;
    }
    const anchorRect = anchor.getBoundingClientRect();
    let best = null;
    let bestDistance = Infinity;
    for (const entry of candidates) {
      const distance = menuDistance(anchorRect, entry.rect);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = entry.menu;
      }
    }
    return best;
  }

  function headerMenuViewport(menu) {
    // The shipped menu wraps its rows in a scroll viewport; insert above the
    // native items so "download / feedback" keep their familiar place.
    return menu.querySelector('[class*="_viewport_"]') || menu;
  }

  function headerTuckedBlock(rows) {
    // No "已收纳" caption here (unlike our own menus): this popup belongs to the
    // host and already groups download/feedback; an extra heading inside it read
    // as chrome the host never asked for. The tucked rows simply sit on top.
    const block = document.createElement("div");
    block.className = "dso-header-tucked";
    for (const item of rows) {
      const wrapper = document.createElement("div");
      wrapper.className = "dso-menu-item dso-header-tucked-item";
      wrapper.setAttribute("data-dso-more-key", "header:" + item.id);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "dso-menu-row";
      button.setAttribute("role", "menuitem");
      const markup = iconFor("header", item.id);
      if (markup) {
        const icon = document.createElement("span");
        icon.className = "dso-menu-icon";
        icon.setAttribute("aria-hidden", "true");
        icon.innerHTML = markup;
        button.appendChild(icon);
      }
      const label = document.createElement("span");
      label.className = "dso-menu-label";
      label.textContent = item.label;
      button.appendChild(label);
      wrapper.appendChild(button);
      block.appendChild(wrapper);
    }
    return block;
  }

  function removeHeaderMenuBlock() {
    const block = state.headerMenuBlock;
    state.headerMenuBlock = null;
    state.headerMenuSignature = "";
    if (block && block.parentNode) block.parentNode.removeChild(block);
  }

  function syncHeaderMenu() {
    const menu = hostHeaderMenu();
    if (!menu) {
      state.headerMenu = null;
      removeHeaderMenuBlock();
      return;
    }
    // The shipped menu's own rows ("download session log", "feedback") are not
    // slot items, so they can never be rows of our scope. Tagging them here is
    // what lets the generic menu-row drag treat them as pull-out sources.
    reconcileHostActions(menu);
    tagHostMenuItems(menu);
    // Applied on every open, before the tucked shelf is positioned: a saved
    // order must survive reloads, and the shelf must keep sorting above the
    // shipped rows.
    applyHostMenuOrder(menu);
    const rows = headerHiddenRows();
    if (!rows.length) {
      state.headerMenu = menu;
      removeHeaderMenuBlock();
      return;
    }
    const signature = rows.map((row) => row.id + ":" + row.label).join("|");
    if (state.headerMenu === menu && state.headerMenuBlock && state.headerMenuBlock.isConnected) {
      if (state.headerMenuSignature === signature) return;
      const fresh = headerTuckedBlock(rows);
      state.headerMenuBlock.parentNode.replaceChild(fresh, state.headerMenuBlock);
      state.headerMenuBlock = fresh;
      state.headerMenuSignature = signature;
      return;
    }
    state.headerMenu = menu;
    state.headerMenuSignature = signature;
    const block = headerTuckedBlock(rows);
    const host = headerMenuViewport(menu);
    host.insertBefore(block, host.firstChild);
    state.headerMenuBlock = block;
  }

  // ---- shipped-menu actions pulled onto the strip -----------------------
  // "Download session log" and "Feedback" are hardcoded rows of the host menu.
  // Pulling one out does not move the host row; it creates a strip button that
  // proxies the same action (open the host menu, click the matching row). The
  // menu keeps owning the behaviour, we only own the shortcut.
  function hostActionSlot() {
    return document.querySelector('[data-slot="conversation.session.header.utilities"]');
  }

  // The shipped menu owns its labels, not ids. 0.2.2 inserted "Copy as
  // Markdown" above download, so the old positional `dso-host-N` ids silently
  // pointed at the wrong action. Identity must come from the row content, and
  // the old ids must be migrated before the new rows are tagged.
  function normalizeHostLabel(value) {
    const text = String(value == null ? "" : value);
    const normalized = typeof text.normalize === "function" ? text.normalize("NFC") : text;
    return normalized.replace(/\s+/g, " ").trim();
  }

  function hostLabelHash(value) {
    let hash = 0x811c9dc5;
    const text = normalizeHostLabel(value);
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 0x01000193);
    }
    return (hash >>> 0).toString(16).padStart(8, "0");
  }

  function hostActionId(label, store, taken) {
    const normalized = normalizeHostLabel(label);
    const base = HOST_ACTION_PREFIX + "h" + hostLabelHash(normalized);
    let id = base;
    let suffix = 2;
    while (
      (taken && taken.has(id)) ||
      (store[id] && normalizeHostLabel(store[id].label) !== normalized)
    ) {
      id = base + "-" + suffix;
      suffix += 1;
    }
    return id;
  }

  function hostMenuRows(menu) {
    const rows = [];
    for (const node of menu.querySelectorAll('[role="menuitem"]')) {
      if (node.closest(".dso-header-tucked") || node.closest(".dso-settings-more-menu")) continue;
      const label = (node.textContent || "").trim();
      if (!label) continue;
      const svg = node.querySelector("svg");
      const tagged = node.dataset.dsoHostId || "";
      rows.push({
        node,
        label,
        key: normalizeHostLabel(label),
        icon: svg ? svg.outerHTML : "",
        // Only content-stable ids are reusable. A legacy positional id left on
        // a live DOM row by an older runtime must not block its migration.
        existingId: tagged.indexOf(HOST_ACTION_PREFIX + "h") === 0 ? tagged : "",
      });
    }
    return rows;
  }

  function paintHostActionButton(button, meta) {
    button.setAttribute("aria-label", meta.label);
    button.title = meta.label;
    button.textContent = "";
    if (meta.icon) {
      button.innerHTML = meta.icon;
    } else {
      const label = document.createElement("span");
      label.className = "dso-host-action-text";
      label.textContent = meta.label;
      button.appendChild(label);
    }
  }

  function renameHostActionButton(oldId, newId, meta) {
    const button = document.getElementById(oldId);
    if (!button) return;
    if (oldId === newId) {
      paintHostActionButton(button, meta);
      return;
    }
    const existing = document.getElementById(newId);
    if (existing && existing !== button) {
      paintHostActionButton(existing, meta);
      if (button.parentNode) button.parentNode.removeChild(button);
      return;
    }
    button.id = newId;
    paintHostActionButton(button, meta);
  }

  // Resolve adopted shortcuts against the rows the host actually renders now.
  // Only label/icon are stable across versions (and localisation changes), so
  // matching degrades from exact content to label to a unique icon. Unmatched
  // ids are left alone rather than being redirected to a different action.
  function reconcileHostActions(menu) {
    if (!menu || !menu.isConnected) return;
    const layout = readScope("header");
    if (!layout || (!layout.order.length && !layout.hidden.length)) return;
    const adopted = [];
    for (const id of layout.order.concat(layout.hidden)) {
      if (id.indexOf(HOST_ACTION_PREFIX) !== 0 || adopted.indexOf(id) !== -1) continue;
      adopted.push(id);
    }
    if (!adopted.length) return;
    const store = readHostActions();
    const rows = hostMenuRows(menu);
    if (!rows.length) return;

    const usedRows = new Set();
    const taken = new Set();
    const mapping = new Map();
    for (const row of rows) {
      if (row.existingId) taken.add(row.existingId);
    }

    function claim(index, oldId) {
      const row = rows[index];
      // A row that already carries an id keeps it: ids are only re-derived for
      // rows without one (legacy positional rows, or a newly shipped action).
      const newId = row.existingId || hostActionId(row.key, store, taken);
      taken.add(newId);
      usedRows.add(index);
      if (newId !== oldId) mapping.set(oldId, { newId, row });
      return newId;
    }

    for (const oldId of adopted) {
      const meta = store[oldId];
      if (!meta) continue;
      const key = normalizeHostLabel(meta.label);
      const icon = meta.icon || "";
      let index = -1;
      if (icon) {
        index = rows.findIndex((row, at) => !usedRows.has(at) && row.key === key && row.icon === icon);
      }
      if (index === -1) {
        index = rows.findIndex((row, at) => !usedRows.has(at) && row.key === key);
      }
      if (index === -1 && icon) {
        const candidates = [];
        rows.forEach((row, at) => {
          if (!usedRows.has(at) && row.icon === icon) candidates.push(at);
        });
        if (candidates.length === 1) index = candidates[0];
      }
      if (index === -1) continue;
      claim(index, oldId);
    }
    if (!mapping.size) return;

    const seen = new Set();
    const order = [];
    let orderChanged = false;
    for (const id of layout.order) {
      const entry = mapping.get(id);
      const next = entry ? entry.newId : id;
      if (seen.has(next)) {
        orderChanged = true;
        continue;
      }
      seen.add(next);
      order.push(next);
      if (next !== id) orderChanged = true;
    }
    const hidden = [];
    let hiddenChanged = false;
    for (const id of layout.hidden) {
      const entry = mapping.get(id);
      const next = entry ? entry.newId : id;
      if (hidden.indexOf(next) !== -1) {
        hiddenChanged = true;
        continue;
      }
      hidden.push(next);
      if (next !== id) hiddenChanged = true;
    }

    for (const [oldId, entry] of mapping) {
      if (oldId !== entry.newId) delete store[oldId];
      store[entry.newId] = { label: entry.row.label, icon: entry.row.icon };
      renameHostActionButton(oldId, entry.newId, store[entry.newId]);
    }
    writeHostActions(store);
    if (orderChanged || hiddenChanged) {
      // This layout already contains a shortcut the user adopted, so recording
      // the id rename must not flip the section back to "untouched".
      writeScope("header", { order, hidden }, { user: true });
    }
    schedulePass();
  }

  function tagHostMenuItems(menu) {
    if (!menu || !menu.isConnected) return;
    const store = readHostActions();
    let changed = false;
    const taken = new Set();
    for (const row of hostMenuRows(menu)) {
      const id = hostActionId(row.key, store, taken);
      taken.add(id);
      row.node.dataset.dsoHostId = id;
      if (row.node.dataset.dsoMoreKey !== "header:" + id) row.node.dataset.dsoMoreKey = "header:" + id;
      const prev = store[id];
      if (!prev || prev.label !== row.label || prev.icon !== row.icon) {
        store[id] = { label: row.label, icon: row.icon };
        changed = true;
      }
    }
    if (changed) writeHostActions(store);
  }

  // The shipped menu paints its rows in a flex column. Reordering the rows the
  // user dragged therefore means writing `style.order` on each row's viewport
  // child — moving the nodes themselves would fight React and break keyboard
  // navigation state. Labels are the stable identity: `dso-host-h<hash>` is
  // derived from the label, so a new host row cannot shift an adopted action.
  function hostMenuOrderTarget(element, viewport) {
    let node = element;
    while (node && node.parentElement && node.parentElement !== viewport) node = node.parentElement;
    return node && node.parentElement === viewport ? node : null;
  }

  function applyHostMenuOrder(menu) {
    if (!menu || !menu.isConnected) return;
    const saved = readHostMenuOrder();
    if (!saved.length) return;
    const viewport = headerMenuViewport(menu);
    if (!viewport) return;
    const entries = [];
    for (const node of menu.querySelectorAll("[data-dso-host-id]")) {
      const target = hostMenuOrderTarget(node, viewport);
      if (!target) continue;
      const label = (node.textContent || "").trim();
      entries.push({ target, label, at: entries.length });
    }
    const rank = (entry) => {
      const index = saved.indexOf(entry.label);
      return index === -1 ? saved.length : index;
    };
    entries.sort((a, b) => rank(a) - rank(b) || a.at - b.at);
    entries.forEach((entry, index) => {
      if (entry.target.style.order !== String(index)) entry.target.style.order = String(index);
    });
  }

  function reorderHostMenu(id, beforeId) {
    const menu = state.headerMenu;
    if (!menu || !menu.isConnected) return false;
    const nodes = Array.from(menu.querySelectorAll("[data-dso-host-id]")).sort(
      (a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top
    );
    const labels = nodes.map((node) => (node.textContent || "").trim());
    const source = nodes.find((node) => node.dataset.dsoHostId === id);
    const sourceLabel = source ? (source.textContent || "").trim() : "";
    const from = labels.indexOf(sourceLabel);
    if (!sourceLabel || from === -1) return false;
    labels.splice(from, 1);
    let at = labels.length;
    if (beforeId) {
      const before = nodes.find((node) => node.dataset.dsoHostId === beforeId);
      const beforeLabel = before ? (before.textContent || "").trim() : "";
      const index = beforeLabel ? labels.indexOf(beforeLabel) : -1;
      if (index !== -1) at = index;
    }
    labels.splice(at, 0, sourceLabel);
    writeHostMenuOrder(labels);
    applyHostMenuOrder(menu);
    return true;
  }

  function createHostActionButton(slot, id, meta) {
    const button = document.createElement("button");
    button.type = "button";
    button.id = id;
    button.className = "dso-host-action";
    paintHostActionButton(button, meta);
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      // Read the live id: reconcileHostActions renames adopted buttons when the
      // host inserts a row, and this closure must follow the rename.
      openHostAction(button.id);
    });
    slot.appendChild(button);
    return button;
  }

  // Rebuild the buttons the user already adopted, before this session's menu
  // has ever been opened (the metadata lives in localStorage).
  function ensureHostActionMirrors() {
    const layout = readScope("header");
    if (!layout || !layout.order || !layout.order.length) return;
    const store = readHostActions();
    for (const id of layout.order) {
      if (id.indexOf(HOST_ACTION_PREFIX) !== 0) continue;
      if (document.getElementById(id)) continue;
      const slot = hostActionSlot();
      if (!slot) continue;
      const meta = store[id];
      // A shortcut without metadata has no label to click in the host menu.
      // Leave it absent until the menu opens and reconcile/tag can rebuild it;
      // showing the raw id as a label is worse than a missing button.
      if (!meta) continue;
      createHostActionButton(slot, id, meta);
    }
  }

  function adoptHostAction(id, index) {
    const store = readHostActions();
    const meta = store[id];
    const slot = hostActionSlot();
    if (!meta || !slot) return false;
    if (!document.getElementById(id)) createHostActionButton(slot, id, meta);
    pass(true);
    reorder("header", id, typeof index === "number" ? index : undefined);
    return true;
  }

  function unadoptHostAction(id) {
    const button = document.getElementById(id);
    if (button && button.parentNode) button.parentNode.removeChild(button);
    // Drop the row from the current discovery snapshot as well: normalizedLayout
    // re-inserts "rows the host exposes but the saved order forgot", so a stale
    // row would put the id straight back and the shortcut would reappear on the
    // next pass.
    const found = state.found.header;
    if (found) found.rows = found.rows.filter((row) => row.id !== id);
    const layout = normalizedLayout("header");
    writeScope("header", {
      order: layout.order.filter((key) => key !== id),
      hidden: layout.hidden.filter((key) => key !== id),
    });
    refreshScope("header");
    notify();
    return true;
  }

  function clickHostMenuItem(label) {
    // Search every open host popup, not just the nearest one: the anchor can
    // share the screen with other menus of the strip's split controls.
    for (const entry of headerMenus()) {
      for (const node of entry.menu.querySelectorAll('[role="menuitem"]')) {
        if (node.closest(".dso-header-tucked")) continue;
        if ((node.textContent || "").trim() !== label) continue;
        node.click();
        return true;
      }
    }
    return false;
  }

  function openHostAction(id) {
    const store = readHostActions();
    const meta = store[id];
    const anchor = headerAnchor();
    if (!meta || !anchor || !anchor.isConnected) return false;
    if (anchor.getAttribute("aria-expanded") === "true") return clickHostMenuItem(meta.label);
    state.clickBypass = anchor;
    try {
      anchor.click();
    } finally {
      state.clickBypass = null;
    }
    // React renders the popup after the toggle; resolve it on the next task.
    window.setTimeout(() => {
      if (!clickHostMenuItem(meta.label)) return;
      const current = headerAnchor();
      if (current && current.getAttribute("aria-expanded") === "true") dismissHeaderMenu();
    }, 0);
    return true;
  }

  // Ask the host to close its own menu (our rows are not React children, so the
  // host does not know a selection happened). Clicking the expanded anchor once
  // runs its toggle; doing it only while expanded avoids opening the menu.
  function dismissHeaderMenu() {
    const anchor = headerAnchor();
    state.headerMenu = null;
    removeHeaderMenuBlock();
    if (anchor && anchor.isConnected && anchor.getAttribute("aria-expanded") === "true") {
      // The post-drag click guard is already armed here, so the anchor's own
      // click must bypass it: the guard only exists to swallow the click the
      // browser synthesizes from the drop itself.
      state.clickBypass = anchor;
      try {
        anchor.click();
      } catch (err) {
        /* ignore */
      } finally {
        state.clickBypass = null;
      }
    }
  }

  // Clicking an injected row must be handled in the capture phase: the shipped
  // menu is a portal whose own click handler stops propagation before the event
  // ever bubbles to document, so a document-level bubble listener never sees it.
  function onHeaderMenuClick(event) {
    const target = event.target;
    if (!target || target.nodeType !== 1) return;
    // The host's menu portal stops propagation, so the capture phase is the only
    // place to notice that the user moved on to another action: any click in the
    // menu that is neither a popup row nor the anchor closes the popup.
    if (state.ctxMorePanel && !state.ctxMorePanel.contains(target) && !target.closest("[data-dso-ctx-more]")) {
      closeContextMorePanel();
    }
    const item = target.closest(".dso-header-tucked-item");
    if (!item) return;
    event.preventDefault();
    event.stopPropagation();
    // A click synthesized by the browser right after a drag belongs to the
    // drop, not to the row (the anchor has the same rule).
    if (Date.now() < state.guardUntil) return;
    const parsed = parseMenuRow(item);
    dismissHeaderMenu();
    if (parsed) activate(parsed.scope, parsed.id);
  }

  function onDocumentClick(event) {
    const target = event.target;
    if (!target || target.nodeType !== 1) return;
    const moreButton = target.closest(".dso-settings-more");
    if (moreButton) {
      event.preventDefault();
      toggleSettingsMoreMenu(moreButton);
      return;
    }
    const item = target.closest(".dso-settings-more-item");
    if (item) {
      if (!state.settingsMenu || !state.settingsMenu.contains(item)) return;
      const parsed = parseMenuRow(item);
      closeSettingsMoreMenu();
      if (parsed) activate(parsed.scope, parsed.id);
      return;
    }
    if (state.settingsMenu && !state.settingsMenu.contains(target)) {
      closeSettingsMoreMenu();
    }
    if (state.ctxMorePanel && !state.ctxMorePanel.contains(target)) {
      closeContextMorePanel();
    }
    const anchor = headerAnchor();
    if (anchor && (target === anchor || anchor.contains(target))) {
      // The host commits its React state (and mounts the menu) during this very
      // click; one macrotask later the portal is in the DOM.
      window.setTimeout(() => {
        if (!state.stopped) syncHeaderMenu();
      }, 0);
    }
  }

  // -------------------------------------------------------- context menus --
  // 0.2.2 renders every right-click menu through one shared Menu inside a
  // [data-context-menu] portal. Plugins contribute rows via
  // ctx.contextMenus.register(), but no public API can reorder another plugin's
  // rows or insert a divider between them, so the open DOM is the only place to
  // do it. Rows are reordered with `style.order` on their flex item (moving
  // React-owned nodes would break keyboard navigation), and the dividers are
  // ours: they are positional (a gap index into the visual list), which is
  // exactly why they stay put when a row is dragged past them instead of
  // following it. Everything is repainted on each mutation because React owns
  // the menu contents and may drop our nodes at any re-render.
  const CONTEXT_SCOPE = "context";
  // Fallback classification for the case where the right-click that opened the
  // menu happened outside our capture (keyboard Shift+F10, a menu re-opened by
  // the host itself). Labels are the only content two unrelated menus share.
  const CONTEXT_KIND_HINTS = {
    session: ["置顶会话", "分叉会话", "复制 Session ID", "Pin session", "Fork session", "Copy session ID"],
    workspace: ["新会话", "重命名工作区", "显示已归档会话", "删除工作区", "New session", "Delete workspace"],
  };

  function contextMenuEnabled() {
    return contextMenusSupported() && readContextMenuEnabled();
  }

  function contextMenuKindFromRowKey(key) {
    const value = String(key == null ? "" : key);
    if (value.indexOf("session:") === 0) return "session";
    if (value.indexOf("workspace:") === 0) return "workspace";
    return "";
  }

  function contextKindFromLabels(labels) {
    for (const kind of CONTEXT_MENU_KINDS) {
      const hints = CONTEXT_KIND_HINTS[kind] || [];
      for (const label of labels) {
        const text = normalizeHostLabel(label);
        for (const hint of hints) {
          if (text === normalizeHostLabel(hint)) return kind;
        }
      }
    }
    return "";
  }

  // Only one contextual menu is ever open; pick the last one mounted so a menu
  // that just replaced another is the one we manage.
  function liveContextMenu() {
    let picked = null;
    for (const menu of document.querySelectorAll("[data-context-menu]")) {
      if (!menu.isConnected || menu.hidden) continue;
      if (!menu.querySelector('[role="menuitem"]')) continue;
      const rect = menu.getBoundingClientRect();
      if (!rect.width && !rect.height) continue;
      picked = menu;
    }
    return picked;
  }

  function contextMenuViewport(menu) {
    return menu.querySelector('[class*="_viewport_"]') || menu.querySelector('[role="presentation"]') || menu;
  }

  // The menu lays its actions out in up to three stacked flex containers: the
  // scroll viewport, the footer (归档会话 and friends) and the portal root,
  // where some plugins append a button of their own. A custom layout flattens
  // the viewport and footer to display:contents, which makes all three of them
  // one flex sequence - every action is drag-reorderable and tuckable. The two
  // wrappers are still returned so their inline display can be restored.
  function contextMenuContainers(menu) {
    const viewport = contextMenuViewport(menu);
    const footer = menu.querySelector('[class*="_footer_"]');
    return { viewport, footer: footer && footer !== viewport ? footer : null };
  }

  // Finds the flex slot this menuitem occupies and the container that owns it.
  // Plugin contributions wrap their row in display:contents slots, and setting
  // `order` on those does nothing, so the slot is the outermost ancestor that
  // is not `display: contents`.
  function contextRowPart(menuitem, menu) {
    if (!menuitem || !menu) return null;
    const { viewport, footer } = contextMenuContainers(menu);
    if (!viewport) return null;
    const chain = [];
    let node = menuitem;
    while (node && node !== menu && chain.length < 14) {
      chain.push(node);
      node = node.parentElement;
    }
    if (node !== menu) return null;
    let container = menu;
    let stop = chain.length;
    for (let index = 0; index < chain.length; index += 1) {
      if (chain[index] === viewport) {
        container = viewport;
        stop = index;
        break;
      }
    }
    if (container === menu && footer) {
      const at = chain.indexOf(footer);
      if (at !== -1) {
        container = footer;
        stop = at;
      }
    }
    let item = menuitem;
    for (let index = stop - 1; index >= 0; index -= 1) {
      let display = "";
      try {
        display = window.getComputedStyle(chain[index]).display;
      } catch (err) {
        display = "";
      }
      if (display !== "contents") {
        item = chain[index];
        break;
      }
    }
    return { container, item, reorderable: true };
  }

  // The row label is the row's identity (the host assigns no ids). Shortcut
  // hints live in a sibling <kbd>, so textContent would bake "Ctrl+Alt+G" into
  // the hash and the same action would get a new id on every shortcut change.
  function contextRowLabel(menuitem) {
    const label = menuitem.querySelector('[class*="itemLabel"], [class*="submenu-label"]');
    if (label && (label.textContent || "").trim()) return (label.textContent || "").trim();
    let text = "";
    for (const child of menuitem.childNodes) {
      if (child.nodeType === 3) {
        text += " " + child.nodeValue;
        continue;
      }
      if (child.nodeType !== 1) continue;
      if (child.tagName === "KBD") continue;
      if (typeof child.className === "string" && /(key|shortcut)/i.test(child.className)) continue;
      if (child.querySelector("svg")) continue;
      text += " " + (child.textContent || "");
    }
    text = normalizeHostLabel(text);
    if (text) return text;
    return (menuitem.getAttribute("aria-label") || "").trim();
  }

  // A separator is a bare separator. Some host rows (dsh-session-menu's icon
  // rows) put role="separator" on the wrapper that also owns their menuitem;
  // hiding that as a divider would delete the action from the menu, so a node
  // containing a menuitem is always a row.
  function isContextSeparator(node) {
    if (!node || node.nodeType !== 1) return false;
    if (!node.matches('[role="separator"]')) return false;
    if (node.querySelector('[role="menuitem"]')) return false;
    return true;
  }

  function contextMenuModel(menu) {
    if (!menu || !menu.isConnected) return null;
    const { viewport, footer } = contextMenuContainers(menu);
    if (!viewport) return null;
    // One row per flex item, using the OUTERMOST menuitem. A submenu row can own
    // a hidden panel whose entries are also menuitems; taking the first one in
    // DOM order made the row's label (and therefore its content hash) flip as
    // the user picked a different submenu entry.
    const byItem = new Map();
    for (const menuitem of menu.querySelectorAll('[role="menuitem"]')) {
      // Our own More anchor and its popup also expose role=menuitem; they are
      // injected nodes, not host rows, and must never get a drag id.
      if (menuitem.closest("[data-dso-ctx-more],[data-dso-ctx-panel]")) continue;
      const part = contextRowPart(menuitem, menu);
      if (!part || !part.item) continue;
      let depth = 0;
      for (let node = menuitem; node && node !== part.item; node = node.parentElement) depth += 1;
      const existing = byItem.get(part.item);
      if (!existing || depth < existing.depth) byItem.set(part.item, { menuitem, depth, part });
    }
    const taken = new Set();
    const rows = [];
    let dom = 0;
    for (const [item, entry] of byItem) {
      const label = contextRowLabel(entry.menuitem);
      if (!label) continue;
      // `dom` is the host's own document order for this menu, captured before
      // the visual sort. The first customization materializes the order from
      // it, never from the measured rects: a menu that re-renders (hover opens
      // a submenu, a plugin panel mounts late) can briefly measure a row at
      // the wrong place, and that glitch would then be persisted as the order.
      rows.push({
        item,
        menuitem: entry.menuitem,
        label,
        dom: dom,
        container: entry.part.container,
        reorderable: entry.part.reorderable,
        rect: item.getBoundingClientRect(),
      });
      dom += 1;
    }
    if (!rows.length) return null;
    // Visual order drives the gap numbers. A row that has not been laid out yet
    // (a plugin registers its entries a moment after the menu opens) measures
    // 0px; it is placed right after its document predecessor so the gap set
    // does not jump while the menu settles.
    let previousTop = -Infinity;
    for (const row of rows) {
      if (row.rect.height > 0) previousTop = row.rect.top;
      row.top = row.rect.height > 0 ? row.rect.top : previousTop + 0.5;
    }
    rows.sort((a, b) => a.top - b.top);
    for (const row of rows) {
      const base = "ctx-" + hostLabelHash(row.label);
      let id = base;
      let suffix = 2;
      while (taken.has(id)) {
        id = base + "-" + suffix;
        suffix += 1;
      }
      taken.add(id);
      row.id = id;
    }
    // The host's own separators mark the shipped grouping. They are the initial
    // divider set, so turning the feature on does not silently regroup a menu
    // the user never touched.
    const nativeDividers = [];
    const containers = [viewport, footer].filter(Boolean);
    for (const container of containers) {
      for (const node of container.querySelectorAll('[role="separator"]')) {
        if (node.hasAttribute("data-dso-ctx-divider")) continue;
        if (!isContextSeparator(node)) continue;
        const rect = node.getBoundingClientRect();
        // A separator inside a submenu panel that has not been opened yet
        // measures 0x0; counting it would invent a divider above the first row.
        if (!rect.width && !rect.height) continue;
        const middle = rect.top + rect.height / 2;
        let gap = 0;
        for (const row of rows) {
          // A row that has not been laid out yet must not count as a row above
          // the separator: that shifted the whole divider set by one.
          if (row.rect.height <= 0) continue;
          if (row.rect.top + row.rect.height / 2 < middle) gap += 1;
        }
        if (nativeDividers.indexOf(gap) === -1) nativeDividers.push(gap);
      }
    }
    nativeDividers.sort((a, b) => a - b);
    const ids = new Map();
    for (const row of rows) ids.set(row.id, row);
    return { menu, viewport, footer, rows, ids, nativeDividers };
  }

  function rememberContextElement(element) {
    if (!element || state.contextStyled.has(element)) return null;
    const entry = { order: element.style.order, display: element.style.display };
    state.contextStyled.set(element, entry);
    return entry;
  }

  function removeContextDividers() {
    for (const node of state.contextDividerNodes) {
      if (node && node.parentNode) node.parentNode.removeChild(node);
    }
    state.contextDividerNodes = [];
  }

  // The injected divider copies one of the host's own separators, so it inherits
  // the exact colour and margins of this DSH build. `display: block` inline is
  // required: the host CSS hides a separator that is first, consecutive with
  // another separator, or trailing.
  function contextDividerNode(model) {
    if (state.contextTemplate) return state.contextTemplate.cloneNode(false);
    let source = null;
    for (const container of [model.viewport, model.footer]) {
      if (!container) continue;
      for (const node of container.children) {
        if (node.matches && node.matches('[role="separator"]') && isContextSeparator(node)) {
          source = node;
          break;
        }
      }
      if (source) break;
    }
    if (source) {
      state.contextTemplate = source.cloneNode(false);
    } else {
      const fallback = document.createElement("div");
      fallback.className = "dso-ctx-divider";
      fallback.setAttribute("role", "separator");
      state.contextTemplate = fallback;
    }
    return state.contextTemplate.cloneNode(false);
  }

  function renderContextDividers(model, gaps) {
    // The menu is flattened (display:contents on the viewport/footer blocks), so
    // dividers are ordered against every row in one sequence: row N owns 2N and
    // the gap before it owns 2N-1.
    const container = model.menu;
    const nodes = state.contextDividerNodes;
    while (nodes.length > gaps.length) {
      const extra = nodes.pop();
      if (extra && extra.parentNode) extra.parentNode.removeChild(extra);
    }
    while (nodes.length < gaps.length) {
      const node = contextDividerNode(model);
      node.setAttribute("data-dso-ctx-divider", "1");
      node.setAttribute("role", "separator");
      node.setAttribute("aria-hidden", "true");
      nodes.push(node);
    }
    nodes.forEach((node, index) => {
      const gap = gaps[index];
      const nextOrder = String(gap * 2 - 1);
      if (node.style.order !== nextOrder) node.style.order = nextOrder;
      if (node.style.display !== "block") node.style.display = "block";
      if (node.dataset.dsoCtxGap !== String(gap)) node.dataset.dsoCtxGap = String(gap);
      if (node.parentNode !== container) container.appendChild(node);
    });
  }

  // Same merge rule as normalizedLayout(): keep the saved order, insert rows the
  // saved list has never seen next to their current host neighbours. A new host
  // action therefore appears where the host put it, not at the end.
  function mergeContextOrder(saved, rows) {
    const merged = [];
    const present = new Set(rows.map((row) => row.id));
    for (const id of saved || []) {
      if (!present.has(id) || merged.indexOf(id) !== -1) continue;
      merged.push(id);
    }
    rows.forEach((row, at) => {
      if (merged.indexOf(row.id) !== -1) return;
      let position = 0;
      for (let index = at - 1; index >= 0; index -= 1) {
        const previous = merged.indexOf(rows[index].id);
        if (previous !== -1) {
          position = previous + 1;
          break;
        }
      }
      merged.splice(position, 0, row.id);
    });
    return merged;
  }

  // The host stacks the menu's actions in a scroll viewport plus a footer block.
  // A custom layout flattens both to display:contents so the menu itself becomes
  // one flex sequence that can order every action, including the footer block and
  // root-level plugin buttons. Each wrapper's shipped inline display is remembered
  // and restored as soon as the menu is no longer customized.
  function rememberContextShell(node) {
    if (!node) return null;
    let entry = state.contextShell.get(node);
    if (!entry) {
      entry = { display: node.style.display };
      state.contextShell.set(node, entry);
    }
    return entry;
  }

  function setContextShell(model, contents) {
    for (const node of [model.viewport, model.footer]) {
      if (!node || node === model.menu) continue;
      const entry = rememberContextShell(node);
      if (!entry) continue;
      const display = contents ? "contents" : entry.display;
      if (node.style.display !== display) node.style.display = display;
    }
  }

  function applyContextLayout(model, kind, layout, force) {
    const customized = Boolean(layout && layout.customized);
    // Until the user customizes this menu the host layout stays exactly as it
    // shipped: the host separators keep their own groups and no row is moved.
    // Rows are still tagged, because that tag is what starts a drag.
    const separators = [];
    for (const container of [model.viewport, model.footer]) {
      if (!container) continue;
      for (const node of container.querySelectorAll('[role="separator"]')) {
        if (node.hasAttribute("data-dso-ctx-divider")) continue;
        if (!isContextSeparator(node)) continue;
        separators.push(node);
      }
    }
    for (const node of separators) {
      // `rememberContextElement` returns null once the node is already tracked;
      // the entry itself must still be read, or a menu that was open before the
      // first customization never hid its own separators (they then stayed in
      // the flex flow with order 0 and drifted to the top of the list).
      rememberContextElement(node);
      const entry = state.contextStyled.get(node);
      if (!entry) continue;
      // Hide the host separators we replace; restore their inline display when
      // the menu is back to its shipped layout (after a reset).
      const display = customized ? "none" : entry.display;
      if (node.style.display !== display) node.style.display = display;
    }
    setContextShell(model, customized);
    if (!customized) {
      for (const row of model.rows) {
        const entry = rememberContextElement(row.item);
        if (entry && row.item.style.order !== entry.order) row.item.style.order = entry.order;
        if (row.item.dataset.dsoCtxId !== row.id) row.item.dataset.dsoCtxId = row.id;
      }
      removeContextDividers();
      ensureContextMoreAnchor(model, kind, []);
      return model.rows.map((row) => row.id);
    }
    const merged = mergeContextOrder(layout.order, model.rows);
    // Rows filed under the More anchor. Only ids still present in this menu are
    // kept, so a host action that disappears for good leaves no ghost entry in
    // the tucked list; the pruned list is written back below.
    const tucked = [];
    for (const id of layout.hidden || []) {
      if (merged.indexOf(id) === -1) continue;
      if (tucked.indexOf(id) === -1) tucked.push(id);
    }
    const hiddenSet = new Set(tucked);
    // Order slots are handed out to the VISIBLE rows only: a tucked row leaves
    // the flex flow with display:none, and numbering it anyway would leave a
    // blank slot (the menu grew a gap) between two live rows.
    const visible = merged.filter((id) => !hiddenSet.has(id));
    merged.forEach((id) => {
      const row = model.ids.get(id);
      if (!row) return;
      // Read the remembered entry, never the live inline display: a row that is
      // currently tucked reads "none", and using that as the "original" value is
      // exactly what left a row invisible (order restored, box gone) after it was
      // dragged back out of More.
      rememberContextElement(row.item);
      const entry = state.contextStyled.get(row.item);
      if (hiddenSet.has(id)) {
        if (row.item.style.display !== "none") row.item.style.display = "none";
        if (row.item.dataset.dsoCtxId) delete row.item.dataset.dsoCtxId;
        return;
      }
      // Restore whatever inline display the host row shipped with (a slot can
      // be display:contents) instead of forcing it back to an empty string.
      const display = entry ? entry.display : row.item.style.display;
      if (row.item.style.display !== display) row.item.style.display = display;
      const order = String(visible.indexOf(id) * 2);
      if (row.item.style.order !== order) row.item.style.order = order;
      if (row.item.dataset.dsoCtxId !== id) row.item.dataset.dsoCtxId = id;
    });
    // A divider below the last action (or past it) has nothing to divide and is
    // dropped, which is the rule the user asked for; write the pruned list back
    // so it does not reappear when a row is added later.
    // Gap N sits above the Nth VISIBLE action, so a gap at or past the visible
    // count has nothing below it. Counting tucked rows here kept a trailing
    // divider alive (the rule is: a divider past the last action is dropped).
    const gaps = [];
    for (const gap of layout.dividers || []) {
      if (gap >= 0 && gap < visible.length && gaps.indexOf(gap) === -1) gaps.push(gap);
    }
    // A divider past the end is dropped (the user's rule). The write-back waits
    // briefly: plugins register their entries a moment after the menu opens, and
    // pruning a still-growing row list would delete a divider the user saved.
    const settled = force || !state.contextOpenedAt || Date.now() - state.contextOpenedAt > 500;
    const hiddenChanged = tucked.length !== (layout.hidden || []).length;
    if ((gaps.length !== (layout.dividers || []).length || hiddenChanged) && settled) {
      writeContextMenuLayout(kind, { order: merged, dividers: gaps, customized: true, hidden: tucked });
    }
    // Gaps are indexes into the VISIBLE sequence, but the model still holds the
    // display:none rows; hand the divider painter a visible-only row list so a
    // gap before the fifth visible action lands under the fifth, not the ninth.
    const visibleModel = {
      menu: model.menu,
      viewport: model.viewport,
      footer: model.footer,
      rows: model.rows.filter((row) => !hiddenSet.has(row.id)),
      ids: model.ids,
      nativeDividers: model.nativeDividers,
    };
    renderContextDividers(visibleModel, gaps);
    ensureContextMoreAnchor(model, kind, tucked);
    return merged;
  }

  // A customized menu hands its ordering job to the rows (viewport/footer are
  // display:contents), which also strips their box — and with it the opacity
  // animation the host runs on them when the menu opens or closes. Mirror that
  // fade on the elements the host can no longer animate.
  //
  // The host only animates its own direct children (._surface[data-menu-phase] > *),
  // so only descendants of the flattened containers have lost their fade. Direct
  // children still animate natively and must be left alone: a mirror class on them
  // overrides the host's animation-name, and removing it later makes the host
  // animation start over, which fires animationstart and asks for the mirror again
  // — the 260 ms feedback loop that made the whole menu flicker. Filtering by
  // "is it a direct child of the menu" removes the loop by construction instead of
  // disabling one of the two directions.
  function contextMirrorTargets(menu) {
    const nodes = menu.querySelectorAll(
      "[data-dso-ctx-id],[data-dso-ctx-divider],[data-dso-ctx-more],[data-dso-ctx-panel]"
    );
    const out = [];
    for (const node of nodes) {
      // Direct children still carry the host's own animation (see below).
      if (node.parentElement === menu) continue;
      out.push(node);
    }
    return out;
  }

  // The host drives its open/close fade with a CSS animation it puts on the
  // menu's direct children, selected by the data-menu-phase attribute
  // (._surface[data-menu-phase] > *): 40 ms ease-out in, 80 ms ease-in
  // both out, keyframes that only touch opacity. Flattening the stacked
  // blocks to display:contents removes their box, so the rows inside them never
  // receive that animation.
  //
  // The rows therefore run the same fade: same phase attribute, same frame, the
  // host's own durations (it publishes them as --dsh-menu-enter /
  // --dsh-menu-dismiss, read straight off the element) and the host's own easing
  // and fill. Reading a computed animation name here instead cost a full style
  // recalc on the frame the menu mounts (measured ~10 ms), which made opening
  // the menu feel slow; the keyframes below are byte-for-byte the opacity ramp
  // the host uses, so nothing about the fade changes.
  function contextPhaseTiming(menu, phase) {
    const closing = phase === "dismiss";
    let duration = closing ? "80ms" : "40ms";
    const raw = String(
      menu.style.getPropertyValue(closing ? "--dsh-menu-dismiss" : "--dsh-menu-enter") || ""
    ).trim();
    if (/^[0-9.]+m?s$/.test(raw)) duration = raw;
    let reduced = false;
    try {
      reduced = Boolean(
        window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches
      );
    } catch (err) {
      reduced = false;
    }
    if (reduced) duration = "0ms";
    return { closing, duration };
  }

  function syncContextMirror(menu, force) {
    if (!menu || !menu.isConnected) return;
    // Only a flattened menu has lost the host's fade; leave a pristine menu be.
    if (!state.contextShell.size) return;
    const phase = String(menu.getAttribute("data-menu-phase") || "");
    if (!force && phase === state.contextMirrorPhase) return;
    state.contextMirrorPhase = phase;
    const closing = phase === "dismiss";
    const animated = phase !== "";
    const targets = contextMirrorTargets(menu);
    if (animated) {
      const timing = contextPhaseTiming(menu, phase);
      const name = timing.closing ? "--dso-ctx-out-duration" : "--dso-ctx-in-duration";
      if (menu.style.getPropertyValue(name) !== timing.duration) {
        menu.style.setProperty(name, timing.duration);
      }
    }
    for (const node of targets) {
      node.classList.toggle("dso-ctx-mirror-out", closing);
      node.classList.toggle("dso-ctx-mirror-in", animated && !closing);
    }
  }

  // The phase flip lands as an attribute mutation, and a MutationObserver
  // callback runs before the frame paints - the mirror therefore starts on the
  // same frame as the host animation instead of one frame later.
  function watchContextPhase(menu) {
    if (state.contextPhaseObserver) state.contextPhaseObserver.disconnect();
    state.contextPhaseObserver = null;
    if (!menu || typeof window.MutationObserver !== "function") return;
    const observer = new window.MutationObserver((records) => {
      for (const record of records) {
        if (record.target !== state.contextMenu) continue;
        if (record.attributeName !== "data-menu-phase") continue;
        syncContextMirror(state.contextMenu);
      }
    });
    observer.observe(menu, { attributes: true, attributeFilter: ["data-menu-phase"] });
    state.contextPhaseObserver = observer;
  }

  function clearContextMenu() {
    removeContextDividers();
    // The anchor and popup are injected nodes; the host portal may already be
    // unmounted, in which case removing them is a no-op.
    closeContextMorePanel();
    if (state.ctxMoreAnchor && state.ctxMoreAnchor.parentNode) {
      state.ctxMoreAnchor.parentNode.removeChild(state.ctxMoreAnchor);
    }
    state.ctxMoreAnchor = null;
    state.ctxMoreDragActive = false;
    for (const [element, entry] of state.contextStyled) {
      try {
        element.style.order = entry.order;
        element.style.display = entry.display;
        delete element.dataset.dsoCtxId;
      } catch (err) {
        /* the menu may already be gone */
      }
    }
    state.contextStyled.clear();
    for (const [element, entry] of state.contextShell) {
      try {
        element.style.display = entry.display;
      } catch (err) {
        /* the menu may already be gone */
      }
    }
    state.contextShell.clear();
    if (state.contextPhaseObserver) {
      state.contextPhaseObserver.disconnect();
      state.contextPhaseObserver = null;
    }
    state.contextMirrorPhase = "";
    if (state.contextMenu) {
      const menu = state.contextMenu;
      try {
        for (const node of menu.querySelectorAll(".dso-ctx-mirror-out,.dso-ctx-mirror-in")) {
          node.classList.remove("dso-ctx-mirror-out", "dso-ctx-mirror-in");
        }
        for (const name of ["--dso-ctx-out-duration", "--dso-ctx-in-duration"]) {
          menu.style.removeProperty(name);
        }
      } catch (err) {
        /* the menu may already be gone */
      }
    }
    state.contextTemplate = null;
    state.contextMenu = null;
    state.contextKind = "";
    state.contextRows = null;
  }

  function syncContextMenu() {
    if (state.stopped) return;
    if (!contextMenusSupported()) {
      clearContextMenu();
      return;
    }
    const menu = liveContextMenu();
    if (!menu) {
      clearContextMenu();
      return;
    }
    if (state.contextMenu && state.contextMenu !== menu) clearContextMenu();
    const model = contextMenuModel(menu);
    if (!model) {
      clearContextMenu();
      return;
    }
    let kind = state.contextMenu === menu ? state.contextKind : "";
    if (!kind) kind = resolveContextKind(model);
    if (!kind) {
      clearContextMenu();
      return;
    }
    if (!contextMenuEnabled()) {
      clearContextMenu();
      return;
    }
    const menuChanged = state.contextMenu !== menu;
    if (menuChanged) state.contextOpenedAt = Date.now();
    state.contextMenu = menu;
    state.contextKind = kind;
    state.contextRows = model;
    if (menuChanged || !state.contextPhaseObserver) watchContextPhase(menu);
    applyContextLayout(model, kind, readContextMenuLayout(kind));
    // A freshly opened menu is already in its "enter" phase: mirror it now,
    // before this frame paints, so the rows fade in with the host's own fade.
    syncContextMirror(menu);
    consumePendingToggle(menu);
  }

  // A right-click that lands while the menu is still mounting cannot be judged
  // safely: the row list would be partial and the first customization would
  // freeze a half-built baseline. The click is parked here and replayed once
  // the next sync has the full menu.
  function consumePendingToggle(menu) {
    const pending = state.contextPendingToggle;
    if (!pending) return;
    state.contextPendingToggle = null;
    if (pending.menu !== menu || Date.now() - pending.at > 1500) return;
    const row = state.contextRows
      ? state.contextRows.rows.find((item) => item.label === pending.label)
      : null;
    if (row) toggleContextDivider(row);
  }

  // The pending kind comes from the right-click that opened the menu. It is only
  // trusted for a moment: a menu the user keeps open re-renders later (hover),
  // and by then the stale pending value must not classify a different menu.
  function resolveContextKind(model) {
    const pending = state.contextPendingKind;
    if (pending && Date.now() - state.contextPendingAt < 2000) return pending;
    return contextKindFromLabels(model.rows.map((row) => row.label));
  }

  function scheduleContextSync() {
    if (state.stopped || state.contextFrame) return;
    if (!contextMenusSupported()) return;
    const run = () => {
      state.contextFrame = 0;
      syncContextMenu();
      syncRowMenus();
    };
    if (typeof window.requestAnimationFrame === "function") {
      state.contextFrame = window.requestAnimationFrame(run);
    } else {
      state.contextFrame = window.setTimeout(run, 16);
    }
  }


  /* ---- dsh-sidebar-row-menu panes -------------------------------------- */
  //
  // dsh-sidebar-row-menu paints its own blank-conversation menu instead of
  // registering host context-menu rows. It mounts one pane per menu surface
  // (the first level and, while open, the 打开方式 / 更多操作 submenus), and it
  // rebuilds them from the session header toolbar on every open. The rows have
  // no stable host ids, so the visible label is the handle; the label survives
  // a React re-render and is what a later open can match again.
  //
  // The default order is row-menu's own: first level follows the header order,
  // 更多操作 follows HOST_MENU_ORDER_KEY, 打开方式 follows its app settings.
  // Nothing is overridden until the user drags a row in that pane, which is
  // what keeps the one-way linkage intact for users who never touch it.

  function rowMenuPaneElement(node) {
    if (!node || node.nodeType !== 1) return null;
    const pane = node.closest(".dsrm-menu-surface, .dsrm-submenu");
    if (!pane) return null;
    const host = pane.closest("[" + ROW_MENU_ATTR + "]");
    if (host && host.contains(pane)) return pane;
    // row-menu also injects its 打开方式 submenu into the host's own session /
    // workspace context menu (as .dsrm-submenu-host > .dsrm-submenu). It is the
    // same app pane as the blank menu's, so it shares that arrangement.
    if (pane.classList.contains("dsrm-submenu") && pane.closest(".dsrm-submenu-host")) return pane;
    return null;
  }

  function rowMenuPaneName(pane) {
    if (!pane) return "";
    if (pane.classList.contains("dsrm-menu-surface")) return "first";
    const wrap = pane.closest(".dsrm-openwith");
    if (wrap && wrap.classList.contains("dsrm-more")) return "more";
    return "openwith";
  }

  function rowMenuRowLabel(item, menuitem) {
    // The wrapper rows (打开方式 / 更多操作) put their visible text in a host
    // label span; plain app/action rows use the shared itemLabel class.
    const host = item.querySelector(".dsrm-host-label-text");
    if (host && host.textContent.trim()) return host.textContent.replace(/\s+/g, " ").trim();
    const label = menuitem.querySelector('[class*="itemLabel"]') || item.querySelector('[class*="itemLabel"]');
    if (label && label.textContent.trim()) return label.textContent.replace(/\s+/g, " ").trim();
    const aria = menuitem.getAttribute("aria-label") || item.getAttribute("aria-label");
    if (aria && aria.trim()) return aria.trim();
    return (menuitem.textContent || "").replace(/\s+/g, " ").trim();
  }

  // One row per direct child of the pane. The material layer is aria-hidden;
  // native separators are direct children too and belong to the row below them,
  // exactly as row-menu renders them. The nested submenu lives inside its
  // trigger's wrapper, so querySelector() finds the trigger first and never
  // mistakes a submenu entry for a first-level row.
  function rowMenuPaneInfo(pane) {
    if (!pane || !pane.isConnected) return null;
    const name = rowMenuPaneName(pane);
    const rows = [];
    const pending = [];
    const seen = new Map();
    for (const child of Array.from(pane.children)) {
      if (child.getAttribute("aria-hidden") === "true") continue;
      if (child.getAttribute("role") === "separator" || child.classList.contains("dsrm-sep")) {
        pending.push(child);
        continue;
      }
      const menuitem = child.querySelector('[role="menuitem"]');
      if (!menuitem) continue;
      const label = rowMenuRowLabel(child, menuitem);
      if (!label) continue;
      const count = (seen.get(label) || 0) + 1;
      seen.set(label, count);
      rows.push({
        item: child,
        menuitem,
        label,
        id: count === 1 ? label : label + "#" + count,
        rect: child.getBoundingClientRect(),
        seps: pending.splice(0),
      });
    }
    return { pane, name, rows, trailingSeps: pending, rect: pane.getBoundingClientRect() };
  }

  // A pane is tagged on every sync (that tag is what starts a drag), but its
  // display only becomes flex and its rows only get an explicit order once an
  // arrangement exists. Rows are moved with style.order — React keeps owning
  // the nodes, focus and keyboard navigation.
  function applyRowMenuPane(info, saved, force) {
    if (!info || !info.pane.isConnected) return;
    for (const row of info.rows) {
      if (row.item.getAttribute(ROW_MENU_ID_ATTR) !== row.id) row.item.setAttribute(ROW_MENU_ID_ATTR, row.id);
    }
    const remembered = (saved || []).filter((id) => typeof id === "string" && id);
    if (!remembered.length && !force) return;
    const merged = mergeContextOrder(remembered, info.rows.map((row) => ({ id: row.id })));
    info.pane.classList.add(ROW_MENU_PANE_CLASS);
    const byId = new Map();
    for (const row of info.rows) {
      if (!byId.has(row.id)) byId.set(row.id, row);
    }
    const painted = new Set();
    let index = 0;
    for (const id of merged) {
      const row = byId.get(id);
      if (!row || painted.has(id)) continue;
      painted.add(id);
      setOrder(row.item, index * 2);
      for (const sep of row.seps) {
        if (sep.getAttribute(ROW_MENU_SEP_ATTR) !== "") sep.setAttribute(ROW_MENU_SEP_ATTR, "");
        setOrder(sep, index * 2 - 1);
        const display = index === 0 ? "none" : "";
        if (sep.style.display !== display) sep.style.display = display;
      }
      index += 1;
    }
    // mergeContextOrder() dedupes ids; an accidental duplicate label must not
    // fall back to flex order 0 (which would lift it above everything).
    for (const row of info.rows) {
      if (painted.has(row.id)) continue;
      painted.add(row.id);
      setOrder(row.item, index * 2);
      index += 1;
    }
    let tail = 999999;
    for (const sep of info.trailingSeps) {
      if (sep.getAttribute(ROW_MENU_SEP_ATTR) !== "") sep.setAttribute(ROW_MENU_SEP_ATTR, "");
      setOrder(sep, tail);
      tail += 1;
      if (sep.style.display === "none") sep.style.display = "";
    }
  }

  function rowMenuPanes() {
    const panes = [];
    const nodes = document.querySelectorAll(
      "[" + ROW_MENU_ATTR + "] .dsrm-menu-surface, [" + ROW_MENU_ATTR + "] .dsrm-submenu, " +
        ".dsrm-submenu-host .dsrm-submenu"
    );
    for (const pane of nodes) {
      if (pane.isConnected) panes.push(pane);
    }
    return panes;
  }

  function syncRowMenus(force) {
    if (state.stopped) return;
    if (!contextMenuEnabled()) {
      clearRowMenuStyles();
      return;
    }
    for (const pane of rowMenuPanes()) {
      const rect = pane.getBoundingClientRect();
      if (!rect.width && !rect.height) continue;
      const info = rowMenuPaneInfo(pane);
      if (!info || !info.rows.length) continue;
      // 更多操作 is row-menu's view of the host More popup: its order is owned
      // by the host key the plugin already reads, so persist and paint there.
      const saved = info.name === "more" ? readHostMenuOrder() : readRowMenuPane(info.name).order;
      applyRowMenuPane(info, saved, force);
    }
  }

  function clearRowMenuStyles() {
    const nodes = document.querySelectorAll(
      "[" + ROW_MENU_ID_ATTR + "], [" + ROW_MENU_SEP_ATTR + "], ." + ROW_MENU_PANE_CLASS
    );
    for (const node of nodes) {
      if (node.hasAttribute(ROW_MENU_ID_ATTR)) {
        node.removeAttribute(ROW_MENU_ID_ATTR);
        node.style.removeProperty("order");
      }
      if (node.hasAttribute(ROW_MENU_SEP_ATTR)) {
        node.removeAttribute(ROW_MENU_SEP_ATTR);
        node.style.removeProperty("order");
        node.style.removeProperty("display");
      }
      if (node.classList.contains(ROW_MENU_PANE_CLASS)) node.classList.remove(ROW_MENU_PANE_CLASS);
    }
  }

  function buildRowMenuSnapshot(gesture) {
    const pane = gesture && gesture.rowMenuPane;
    if (!pane || !pane.isConnected) return null;
    const info = rowMenuPaneInfo(pane);
    if (!info || !info.rows.length) return null;
    const items = [];
    for (const row of info.rows) {
      if (!row.rect.width && !row.rect.height) continue;
      items.push({ id: row.id, unit: row.item, target: row.item, rect: row.rect });
    }
    if (!items.length) return null;
    items.sort((a, b) => a.rect.top - b.rect.top);
    if (items.every((item) => item.id !== gesture.id)) return null;
    return {
      found: null,
      axis: "y",
      container: info.rect,
      crossRect: info.rect,
      items,
      menuItems: [],
      menuTargets: [],
      menuRect: null,
      moreRect: null,
      moreElement: null,
    };
  }

  function commitRowMenuReorder(gesture, beforeId) {
    const pane = gesture && gesture.rowMenuPane;
    if (!pane || !pane.isConnected) return false;
    const info = rowMenuPaneInfo(pane);
    if (!info || !info.rows.length) return false;
    const visual = info.rows.slice().sort((a, b) => a.rect.top - b.rect.top);
    const from = visual.findIndex((row) => row.id === gesture.id);
    if (from === -1) return false;
    const dragged = visual[from];
    const rest = visual.filter((row, at) => at !== from);
    let at = beforeId ? rest.findIndex((row) => row.id === beforeId) : rest.length;
    if (at === -1) at = rest.length;
    rest.splice(at, 0, dragged);
    if (info.name === "more") {
      // Keep the labels row-menu does not list right now at the end so the host
      // key stays a complete ranking instead of losing entries on every drag.
      beginRowMenuHostEdit();
      const labels = rest.map((row) => row.label);
      for (const label of readHostMenuOrder()) {
        if (labels.indexOf(label) === -1) labels.push(label);
      }
      writeHostMenuOrder(labels);
      recordRowMenuHostWrite(labels);
    } else {
      writeRowMenuPane(info.name, rest.map((row) => row.id));
    }
    const fresh = rowMenuPaneInfo(pane);
    if (fresh) {
      const saved = info.name === "more" ? readHostMenuOrder() : rest.map((row) => row.id);
      applyRowMenuPane(fresh, saved, true);
    }
    return true;
  }

  // A snapshot in the shape the generic drag pipeline expects. `found` is null
  // on purpose: every `found` consumer is null-guarded, and the menu's own rect
  // replaces the container/cross rects.
  function contextVisibleItems(model) {
    const hidden = new Set(readContextMenuLayout(state.contextKind).hidden);
    const items = [];
    for (const row of model.rows) {
      if (!row.reorderable) continue;
      if (hidden.has(row.id)) continue;
      if (!row.item.isConnected) continue;
      const rect = row.item.getBoundingClientRect();
      if (!rect.width && !rect.height) continue;
      items.push({ id: row.id, unit: row.item, target: row.item, rect });
    }
    items.sort((a, b) => a.rect.top - b.rect.top);
    return items;
  }

  function contextMoreElement() {
    const anchor = contextMoreAnchor();
    return anchor ? anchor.querySelector(".dso-ctx-more-trigger") : null;
  }

  function contextMoreRect() {
    // Measure the anchor box, not the button inside it: the button shrinks to
    // .94 while it is armed, and hit-testing a shrinking rect made the target
    // flick off under a pointer that sat near its edge (the shake the 0.9.2
    // release started with).
    const anchor = contextMoreAnchor();
    const element = anchor || contextMoreElement();
    if (!element) return null;
    const rect = element.getBoundingClientRect();
    return rect.width || rect.height ? rect : null;
  }

  function buildContextSnapshot(gesture) {
    const model = state.contextRows;
    if (!model || !model.menu || !model.menu.isConnected) return null;
    // The whole menu is the drop area: dragging into the footer block must not
    // end the gesture, and the last insertion point is the end of the list.
    const menuRect = model.menu.getBoundingClientRect();
    if (gesture && gesture.source === "more") {
      // Dragging a row OUT of the More popup: the rows to reorder are the popup
      // entries, the insertion points are the visible menu rows, and the menu
      // rect is the drop container that turns the gesture into a reveal.
      const panel = state.ctxMorePanel;
      if (!panel || !panel.isConnected) return null;
      const panelItems = [];
      for (const node of panel.querySelectorAll("[data-dso-ctx-more-key]")) {
        if (!node.isConnected) continue;
        const rect = node.getBoundingClientRect();
        if (!rect.width && !rect.height) continue;
        panelItems.push({ id: node.getAttribute("data-dso-ctx-more-key"), unit: node, target: node, rect });
      }
      if (!panelItems.length) return null;
      panelItems.sort((a, b) => a.rect.top - b.rect.top);
      const visibleItems = contextVisibleItems(model);
      if (!visibleItems.length) return null;
      return {
        found: null,
        axis: "y",
        container: menuRect,
        crossRect: menuRect,
        items: panelItems,
        menuItems: visibleItems,
        menuTargets: visibleItems,
        menuRect,
        moreRect: contextMoreRect(),
        moreElement: contextMoreElement(),
      };
    }
    const items = contextVisibleItems(model);
    if (!items.length) return null;
    return {
      found: null,
      axis: "y",
      container: menuRect,
      crossRect: menuRect,
      items,
      menuItems: items,
      menuTargets: items,
      menuRect,
      moreRect: contextMoreRect(),
      moreElement: contextMoreElement(),
    };
  }

  // A right-click can land on a viewport row, a footer row (归档会话) or a
  // button a plugin appended to the portal root (记忆参与). All of them own a
  // gap; only the last action of the menu has nothing below it.
  function contextRowAt(model, target) {
    if (!model || !target) return null;
    for (const row of model.rows) {
      if (row.item === target || row.item.contains(target)) return row;
    }
    return null;
  }

  // Every gap number the divider feature stores is an index into the sequence
  // the menu PAINTS, not into its DOM: a custom layout writes style.order and
  // leaves the document order untouched. Reading the index off the DOM order
  // therefore lands the divider under a different action for every row the user
  // moved (the "divider under the action below the one I right-clicked" report),
  // and it can differ from one sync to the next because the model is rebuilt
  // from measured rects. Resolve the painted sequence from the stored layout
  // instead, exactly the way applyContextLayout hands out the order slots.
  function contextPaintedRows(model, layout) {
    if (!model) return [];
    const rows = model.rows.slice();
    const current = layout || readContextMenuLayout(state.contextKind);
    const customized = Boolean(current && current.customized);
    const ids = customized
      ? mergeContextOrder(current.order, rows)
      : rows.slice().sort((a, b) => a.dom - b.dom).map((row) => row.id);
    const hidden = new Set(customized ? current.hidden || [] : []);
    return ids
      .filter((id) => !hidden.has(id))
      .map((id) => model.ids.get(id))
      .filter(Boolean);
  }

  // Right-clicking an action toggles the divider directly BELOW it. The last
  // action has nothing below it, so it is a no-op (a divider there would be
  // trailing and the host hides it anyway).
  function toggleContextDivider(row) {
    const model = state.contextRows;
    const kind = state.contextKind;
    if (!model || !kind || !contextMenuEnabled()) return false;
    const painted = contextPaintedRows(model);
    const index = painted.indexOf(row);
    if (index === -1) return false;
    const gap = index + 1;
    if (gap >= painted.length) return false;
    const current = readContextMenuLayout(kind);
    const rows = model.rows.filter((item) => item.reorderable);
    const layout = {
      // First toggle: take the host's document order, not the measured order.
      // A menu that just re-rendered can measure a row at 0px and sorting by
      // rect would persist that glitch as the user's order.
      order: current.customized
        ? current.order.slice()
        : rows.slice().sort((a, b) => a.dom - b.dom).map((item) => item.id),
      dividers: current.customized ? current.dividers.slice() : model.nativeDividers.slice(),
      customized: true,
    };
    const at = layout.dividers.indexOf(gap);
    if (at === -1) layout.dividers.push(gap);
    else layout.dividers.splice(at, 1);
    layout.dividers.sort((a, b) => a - b);
    writeContextMenuLayout(kind, layout);
    const next = contextMenuModel(model.menu) || model;
    state.contextRows = next;
    applyContextLayout(next, kind, readContextMenuLayout(kind));
    return true;
  }

  function commitContextReorder(id, beforeId) {
    const model = state.contextRows;
    const kind = state.contextKind;
    if (!model || !kind || !model.menu || !model.menu.isConnected) return false;
    // Start from the sequence the menu paints, not from its DOM order: rebuilding
    // the list from model.rows threw away the layout the user had already built
    // as soon as one row was dragged on a customized menu.
    const current = readContextMenuLayout(kind);
    const ids = current.customized
      ? mergeContextOrder(current.order, model.rows)
      : model.rows.slice().sort((a, b) => a.dom - b.dom).map((row) => row.id);
    const from = ids.indexOf(id);
    if (from === -1) return false;
    ids.splice(from, 1);
    let at = ids.length;
    if (beforeId) {
      const target = ids.indexOf(beforeId);
      if (target !== -1) at = target;
    }
    ids.splice(at, 0, id);
    // Dividers are positional, so a drag never moves them: only the order of
    // the rows changes. The first drag materializes the host grouping, exactly
    // like the first divider toggle.
    writeContextMenuLayout(kind, {
      order: ids,
      dividers: current.customized ? current.dividers : model.nativeDividers,
      customized: true,
    });
    const next = contextMenuModel(model.menu) || model;
    state.contextRows = next;
    applyContextLayout(next, kind, readContextMenuLayout(kind));
    return true;
  }

  // Reordering the tucked list only permutes `hidden`. The visible order is
  // untouched, so the popup can be rearranged without disturbing the menu.
  function commitContextPanelReorder(id, beforeId) {
    const model = state.contextRows;
    const kind = state.contextKind;
    if (!model || !kind || !model.menu || !model.menu.isConnected) return false;
    const current = readContextMenuLayout(kind);
    const hidden = (current.hidden || []).slice();
    const from = hidden.indexOf(id);
    if (from === -1) return false;
    hidden.splice(from, 1);
    let at = hidden.length;
    if (beforeId) {
      const target = hidden.indexOf(beforeId);
      if (target !== -1) at = target;
    }
    hidden.splice(at, 0, id);
    writeContextMenuLayout(kind, {
      order: current.order,
      dividers: current.dividers,
      customized: true,
      hidden,
    });
    const next = contextMenuModel(model.menu) || model;
    state.contextRows = next;
    applyContextLayout(next, kind, readContextMenuLayout(kind), true);
    return true;
  }

  // ---------------------------------------------------------- context More --
  // A right-click menu ships no "More" row, so one is injected: a flex item
  // appended to the menu viewport with a late order (always last), plus a popup
  // listing the tucked actions. Both are children of the OPEN MENU, not of
  // <body>: the host closes its portal on any outside mousedown, so a popup
  // living outside the menu would close the menu on the first click. The host
  // also removes its portal wholesale, which takes the injected nodes with it,
  // so every path below tolerates an anchor that was pulled out from under us.

  const CONTEXT_MORE_OPEN_DELAY = 120;
  const CONTEXT_MORE_CLOSE_DELAY = 200;
  // Host rows never set `order`, so any large value seats "More" after the footer
  // block and the root-level buttons the host appends to the same menu.
  const CONTEXT_MORE_ORDER = "9999";

  function contextTuckedRows(model, hiddenIds) {
    if (!model) return [];
    const hidden = new Set(hiddenIds || []);
    if (!hidden.size) return [];
    const out = [];
    const seen = new Set();
    // The popup lists the rows in the order the user arranged them (the order
    // of `hidden`), not in the menu's DOM order: a drag inside the popup is
    // stored as a permutation of this list, and reading it back in DOM order
    // made the drop look like it did nothing.
    for (const id of hiddenIds) {
      const row = model.ids.get(id);
      if (!row || !row.reorderable || seen.has(id)) continue;
      seen.add(id);
      out.push(row);
    }
    // A row hidden by an older layout (or by another window) may not be listed
    // first; append it in document order so it never disappears from the popup.
    for (const row of model.rows) {
      if (!row.reorderable || !hidden.has(row.id) || seen.has(row.id)) continue;
      seen.add(row.id);
      out.push(row);
    }
    return out;
  }

  function contextMoreAnchor() {
    const anchor = state.ctxMoreAnchor;
    return anchor && anchor.isConnected ? anchor : null;
  }

  function buildContextMoreAnchor() {
    const text = strings();
    const wrap = document.createElement("div");
    wrap.className = "dso-ctx-more";
    wrap.setAttribute("data-dso-ctx-more", "1");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "dso-ctx-more-trigger";
    button.setAttribute("role", "menuitem");
    button.setAttribute("aria-haspopup", "menu");
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-label", text.contextMenuMore);
    const dots = document.createElement("span");
    dots.className = "dso-ctx-more-dots";
    dots.textContent = "···";
    const label = document.createElement("span");
    label.className = "dso-ctx-more-label";
    label.textContent = text.more;
    const chevron = document.createElement("span");
    chevron.className = "dso-ctx-more-chevron";
    chevron.setAttribute("aria-hidden", "true");
    chevron.textContent = "›";
    button.appendChild(dots);
    button.appendChild(label);
    button.appendChild(chevron);
    wrap.appendChild(button);
    wrap.addEventListener("pointerenter", () => openContextMoreSoon());
    wrap.addEventListener("pointerleave", () => closeContextMoreSoon());
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (state.ctxMoreOpen) closeContextMorePanel();
      else openContextMorePanel();
    });
    return wrap;
  }

  function setContextMoreExpanded(open) {
    const anchor = state.ctxMoreAnchor;
    const button = anchor ? anchor.querySelector(".dso-ctx-more-trigger") : null;
    if (!button) return;
    const value = open ? "true" : "false";
    if (button.getAttribute("aria-expanded") !== value) button.setAttribute("aria-expanded", value);
  }

  function ensureContextMoreAnchor(model, kind, hiddenIds) {
    if (!model || !model.viewport) return;
    const tucked = contextTuckedRows(model, hiddenIds || (kind ? readContextMenuLayout(kind).hidden : []));
    // The anchor only exists once something is tucked away, or while a menu row
    // is actually being dragged: that drag is the affordance for the first one,
    // and leaving an empty "More" row in a menu nobody customized would just
    // add a dead action.
    const wanted = tucked.length > 0 || state.ctxMoreDragActive;
    if (!wanted) {
      if (state.ctxMoreAnchor && state.ctxMoreAnchor.parentNode) {
        state.ctxMoreAnchor.parentNode.removeChild(state.ctxMoreAnchor);
      }
      state.ctxMoreAnchor = null;
      closeContextMorePanel();
      return;
    }
    if (!state.ctxMoreAnchor) state.ctxMoreAnchor = buildContextMoreAnchor();
    const anchor = state.ctxMoreAnchor;
    // The host paints the menu as viewport + footer block + root-level buttons, so
    // appending into the viewport would park "More" above the footer actions. Hanging
    // it off the menu root with a huge order value puts it under every one of them.
    if (anchor.parentNode !== model.menu) model.menu.appendChild(anchor);
    if (anchor.style.order !== CONTEXT_MORE_ORDER) anchor.style.order = CONTEXT_MORE_ORDER;
    if (!state.ctxMoreOpen) return;
    if (!tucked.length) {
      closeContextMorePanel();
      return;
    }
    renderContextMorePanel(model, tucked);
  }

  // The host paints a row's glyph in an icon slot that may hold an <svg>
  // (a symbol sprite) or an <img> (an app icon), and the svg is not always the
  // last thing in the row. Cloning the slot itself keeps whatever shape the host
  // (or another plugin) put there, and keeps the host's own icon box so every
  // entry lines up instead of inheriting whatever size the glyph happens to be.
  function contextRowIcon(row) {
    if (!row) return null;
    const host = row.menuitem || row.item;
    if (!host) return null;
    return (
      host.querySelector('[class*="itemIcon"]') ||
      host.querySelector('[data-slot="contextMenu.icon"]') ||
      host.querySelector("img") ||
      host.querySelector("svg")
    );
  }

  function buildContextMoreRow(row) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "dso-ctx-panel-row";
    button.setAttribute("role", "menuitem");
    button.setAttribute("data-dso-ctx-more-key", row.id);
    const icon = contextRowIcon(row);
    if (icon) {
      const wrapper = document.createElement("span");
      wrapper.className = "dso-ctx-panel-icon";
      wrapper.appendChild(icon.cloneNode(true));
      button.appendChild(wrapper);
    } else {
      // No glyph of its own: keep the label on the same x as the rows above.
      const spacer = document.createElement("span");
      spacer.className = "dso-ctx-panel-icon dso-ctx-panel-icon-empty";
      button.appendChild(spacer);
    }
    const label = document.createElement("span");
    label.className = "dso-ctx-panel-label";
    label.textContent = row.label;
    button.appendChild(label);
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      invokeContextMoreRow(row.id);
    });
    return button;
  }

  function renderContextMorePanel(model, tucked) {
    const signature = tucked.map((row) => row.id).join("|");
    let panel = state.ctxMorePanel;
    if (!panel || !panel.isConnected) {
      panel = document.createElement("div");
      panel.className = "dso-ctx-panel";
      panel.setAttribute("data-dso-ctx-panel", "1");
      panel.setAttribute("role", "group");
      panel.setAttribute("aria-label", strings().contextMenuMore);
      panel.addEventListener("pointerenter", () => cancelContextMoreTimer());
      panel.addEventListener("pointerleave", () => closeContextMoreSoon());
      state.ctxMorePanel = panel;
    }
    if (panel.parentNode !== model.menu) model.menu.appendChild(panel);
    // The menu is re-synced on every DOM mutation, including the mutations this
    // very function causes. Rebuilding the list unconditionally would therefore
    // feed the observer forever; the signature short-circuits unchanged lists.
    if (panel.dataset.dsoCtxSig !== signature) {
      while (panel.firstChild) panel.removeChild(panel.firstChild);
      for (const row of tucked) panel.appendChild(buildContextMoreRow(row));
      panel.dataset.dsoCtxSig = signature;
    }
    positionContextMorePanel(panel);
  }

  // Same placement rule as the submenu in dsh-sidebar-row-menu: open to the
  // right of the anchor, flip left when the right edge is short and the left
  // side has more room, clamp both axes to the viewport, and never let the list
  // grow past the viewport (it scrolls instead).
  function positionContextMorePanel(panel) {
    const anchor = contextMoreAnchor();
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    if (!rect.width && !rect.height) {
      closeContextMorePanel();
      return;
    }
    const margin = 12;
    const gap = 6;
    const vw = window.innerWidth || 1024;
    const vh = window.innerHeight || 768;
    panel.style.visibility = "hidden";
    const width = Math.max(160, panel.offsetWidth || 180);
    const height = panel.offsetHeight || 0;
    const rightRoom = vw - margin - (rect.right + gap);
    const leftRoom = rect.left - gap - margin;
    let left = rect.right + gap;
    if (rightRoom < width && leftRoom > rightRoom) left = rect.left - gap - width;
    left = Math.max(margin, Math.min(left, vw - width - margin));
    const top = Math.max(margin, Math.min(rect.top, vh - height - margin));
    const nextLeft = Math.round(left) + "px";
    const nextTop = Math.round(top) + "px";
    if (panel.style.left !== nextLeft) panel.style.left = nextLeft;
    if (panel.style.top !== nextTop) panel.style.top = nextTop;
    panel.style.visibility = "";
  }

  function cancelContextMoreTimer() {
    if (state.ctxMoreTimer) {
      window.clearTimeout(state.ctxMoreTimer);
      state.ctxMoreTimer = 0;
    }
  }

  function openContextMoreSoon() {
    cancelContextMoreTimer();
    state.ctxMoreTimer = window.setTimeout(() => {
      state.ctxMoreTimer = 0;
      openContextMorePanel();
    }, CONTEXT_MORE_OPEN_DELAY);
  }

  function closeContextMoreSoon() {
    cancelContextMoreTimer();
    state.ctxMoreTimer = window.setTimeout(() => {
      state.ctxMoreTimer = 0;
      // A row being dragged out of the popup keeps it mounted: the gesture is
      // still reading its rows as drop targets (and its own ghost needs a home).
      if (state.gesture && state.gesture.started && state.gesture.source === "more") return;
      closeContextMorePanel();
    }, CONTEXT_MORE_CLOSE_DELAY);
  }

  function openContextMorePanel() {
    cancelContextMoreTimer();
    const model = state.contextRows;
    const kind = state.contextKind;
    if (!model || !kind || !model.menu || !model.menu.isConnected) return false;
    if (!contextMoreAnchor()) return false;
    const tucked = contextTuckedRows(model, readContextMenuLayout(kind).hidden);
    if (!tucked.length) return false;
    state.ctxMoreOpen = true;
    renderContextMorePanel(model, tucked);
    setContextMoreExpanded(true);
    return true;
  }

  function closeContextMorePanel() {
    cancelContextMoreTimer();
    state.ctxMoreOpen = false;
    const panel = state.ctxMorePanel;
    if (panel && panel.parentNode) panel.parentNode.removeChild(panel);
    state.ctxMorePanel = null;
    setContextMoreExpanded(false);
  }

  function invokeContextMoreRow(id) {
    const model = state.contextRows;
    const row = model ? model.ids.get(id) : null;
    closeContextMorePanel();
    if (!row || !row.menuitem || !row.menuitem.isConnected) return false;
    // The host action stays in the DOM with display:none, so a synthetic click
    // still runs its own handler and the host closes the menu exactly as if the
    // row had been clicked in the menu body.
    try {
      row.menuitem.click();
      return true;
    } catch (error) {
      return false;
    }
  }

  function hideContextRow(id) {
    const model = state.contextRows;
    const kind = state.contextKind;
    if (!model || !kind || !model.menu || !model.menu.isConnected) return false;
    const current = readContextMenuLayout(kind);
    if (current.hidden.indexOf(id) !== -1) return false;
    const rows = model.rows.filter((row) => row.reorderable);
    const visible = rows.filter((row) => current.hidden.indexOf(row.id) === -1);
    // Never tuck the last remaining action: the menu would be left with a bare
    // More row and the tucked action could not be reached again from a menu
    // whose only entry is the popup trigger.
    if (visible.length <= 1) return false;
    const order = current.customized
      ? mergeContextOrder(current.order, rows)
      : rows.slice().sort((a, b) => a.dom - b.dom).map((row) => row.id);
    writeContextMenuLayout(kind, {
      order,
      dividers: current.customized ? current.dividers : model.nativeDividers,
      customized: true,
      hidden: current.hidden.concat([id]),
    });
    const next = contextMenuModel(model.menu) || model;
    state.contextRows = next;
    applyContextLayout(next, kind, readContextMenuLayout(kind));
    return true;
  }

  function revealContextRow(id, beforeId) {
    const model = state.contextRows;
    const kind = state.contextKind;
    if (!model || !kind || !model.menu || !model.menu.isConnected) return false;
    const current = readContextMenuLayout(kind);
    if (current.hidden.indexOf(id) === -1) return false;
    const rows = model.rows.filter((row) => row.reorderable);
    const ids = mergeContextOrder(
      current.customized ? current.order : rows.slice().sort((a, b) => a.dom - b.dom).map((row) => row.id),
      rows
    );
    const from = ids.indexOf(id);
    if (from === -1) return false;
    ids.splice(from, 1);
    let at = ids.length;
    if (beforeId) {
      const target = ids.indexOf(beforeId);
      if (target !== -1) at = target;
    }
    ids.splice(at, 0, id);
    writeContextMenuLayout(kind, {
      order: ids,
      dividers: current.customized ? current.dividers : model.nativeDividers,
      customized: true,
      hidden: current.hidden.filter((item) => item !== id),
    });
    const next = contextMenuModel(model.menu) || model;
    state.contextRows = next;
    applyContextLayout(next, kind, readContextMenuLayout(kind));
    return true;
  }
  // A right-click inside an already open menu belongs to us (toggle a divider)
  // and must not also open the browser's own menu. Everywhere else the event is
  // only observed: the host still opens its menu, and the next frame syncs it.
  function onContextMenuCapture(event) {
    if (state.stopped) return;
    if (!contextMenusSupported()) return;
    const target = event.target && event.target.nodeType === 1 ? event.target : null;
    if (!target) return;
    const menu = target.closest("[data-context-menu]");
    if (menu) {
      if (menu !== state.contextMenu || !state.contextRows) {
        // Not measured yet: park the intent, keep this menu open, and let the
        // next frame's sync act on the complete row list.
        const button = target.closest('[role="menuitem"]');
        const label = button ? contextRowLabel(button) : "";
        if (label) state.contextPendingToggle = { menu, label, at: Date.now() };
        event.preventDefault();
        event.stopPropagation();
        scheduleContextSync();
        return;
      }
      const row = contextRowAt(state.contextRows, target);
      if (row) toggleContextDivider(row);
      // Right-clicks inside our menu never reach the catalog/native menus, even
      // on the footer row (where there is no divider to toggle).
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    const rowKey = target.closest("[data-row-key]");
    const kind = contextMenuKindFromRowKey(rowKey && rowKey.dataset ? rowKey.dataset.rowKey : "");
    if (kind) {
      state.contextPendingKind = kind;
      state.contextPendingAt = Date.now();
    }
    scheduleContextSync();
  }

  function setContextMenuEnabled(enabled) {
    writeContextMenuEnabled(Boolean(enabled));
    if (!enabled) clearContextMenu();
    else scheduleContextSync();
    if (!enabled) clearRowMenuStyles();
    notify();
    return Boolean(enabled);
  }

  function resetContextMenus() {
    resetContextMenuLayouts();
    clearContextMenu();
    clearRowMenuStyles();
    scheduleContextSync();
    notify();
  }

  // The drop scope of the open menu. It is not part of SCOPE_KEYS: there are no
  // persistent rows to discover, only the menu that happens to be open.
  function dragAllowed(scope) {
    if (scope === CONTEXT_SCOPE || scope === ROW_MENU_SCOPE) return contextMenuEnabled();
    return isDragEnabled(scope);
  }

  function normalizedLayout(scope) {
    const found = state.found[scope];
    const rows = found ? found.rows : [];
    const ids = rows.map((row) => row.id);
    const current = readScope(scope);
    // Keep every remembered id, including rows this pass has not discovered
    // yet. Component discovery is incremental at startup (each panel/plugin
    // registers on its own schedule): the first pass often sees only a few
    // rows. Pruning the absent ones rewrote the saved order without them, so
    // when the rest mounted they looked brand new and were inserted at their
    // host positions — a custom order did not survive a reload, while tucked
    // rows did (their ids were already kept below). Genuinely removed rows
    // just linger harmlessly in storage, exactly like absent hidden ids.
    const order = [];
    for (const id of current.order) {
      if (order.indexOf(id) === -1) order.push(id);
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
    // A host may unmount rows without telling us: the conversation tab bar drops
    // every tab past its overflow limit whenever the pane narrows (and remounts
    // them when it widens). Forgetting those ids here made a hidden tab pop back
    // into the header on widen. Keep hidden ids for absent rows too; applyFound
    // skips rows it cannot find, so their saved slots survive until they remount.
    const hidden = [];
    for (const id of current.hidden) {
      if (hidden.indexOf(id) === -1) hidden.push(id);
    }
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

  // The projection pass persists a layout on every boot, so a stored order on
  // its own proves nothing. An order that differs from the order the host
  // registered its rows in does prove a human moved something; the same goes
  // for a row the human sent to the "more" menu.
  function layoutArrangedByUser() {
    for (const scope of SCOPE_KEYS) {
      const found = state.found[scope];
      if (!found || !found.rows.length) continue;
      const layout = readScope(scope);
      if (!layout.order.length && !layout.hidden.length) continue;
      const hostIds = found.rows.map((row) => row.id);
      const hiddenSet = new Set(layout.hidden);
      const visible = layout.order.filter((id) => !hiddenSet.has(id) && hostIds.indexOf(id) !== -1);
      const hostVisible = hostIds.filter((id) => visible.indexOf(id) !== -1);
      if (visible.length !== hostVisible.length) continue;
      for (let index = 0; index < visible.length; index += 1) {
        if (visible[index] !== hostVisible[index]) return true;
      }
      if (layout.hidden.some((id) => hostIds.indexOf(id) !== -1)) return true;
    }
    return false;
  }

  function applyFound(found) {
    if (!found || !found.rows.length) return;
    const scope = found.scope;
    // 0.7.0-pre persisted the shipped "More actions" button as a row; now that
    // it is host chrome again, a stale "more" entry in the saved order would
    // shift every drop index by one. Drop it before anything reads the layout.
    if (found.moreIsChrome) {
      const stale = readScope(scope);
      if (stale.order.indexOf("more") !== -1 || stale.hidden.indexOf("more") !== -1) {
        writeScope(scope, {
          order: stale.order.filter((id) => id !== "more"),
          hidden: stale.hidden.filter((id) => id !== "more"),
        });
      }
    }
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
    if (found.more && found.moreIsChrome) {
      // Host chrome (the header's shipped "More actions" button) keeps the slot
      // the host gave it. The split control before it also resolves to order 0,
      // and equal orders fall back to DOM order, so the button stays where the
      // host mounted it instead of jumping to the far right.
      applyOrder(found.more, 0);
      applyDisplay(found.more, false);
    } else if (found.more) {
      // Settings only grows its "More" row while something is tucked: with an
      // empty shelf the extra control would just be another dead row.
      const showMore = scope === "settings" ? layout.hidden.length > 0 : true;
      applyOrder(found.more, tailBase + tails.length + 1);
      applyDisplay(found.more, !showMore);
      if (!showMore) closeSettingsMoreMenu();
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
    // Buttons for adopted host-menu actions are ours, not the host's; rebuild
    // them before discovery so they take part in the same pass.
    ensureHostActionMirrors();
    for (const def of SCOPE_DEFS) {
      let found = null;
      try {
        found = discoverScope(ctx, def.key);
      } catch (err) {
        found = null;
      }
      if (!found) {
        if (def.key === "header") state.found.header = null;
        warnOnce(`missing:${def.key}`, `no rows found for scope "${def.key}"`);
        continue;
      }
      if (!found.rows.length && def.key !== "header") {
        warnOnce(`missing:${def.key}`, `no rows found for scope "${def.key}"`);
        continue;
      }
      // A fresh 0.2.2 session header can contain only the shipped "More
      // actions" button. Keep that (empty) scope so headerAnchor() still exists
      // and the host menu rows can be tagged and pulled out.
      state.found[def.key] = found;
      if (found.rows.length) {
        repairAppendedOrder(found);
        applyFound(found);
        seen += 1;
      }
    }
    // The settings modal can unmount while its tucked-row popup is open; the
    // popup lives on <body>, so nothing else would remove it.
    if (
      state.settingsMenu &&
      (!state.found.settings ||
        !state.found.settings.container.isConnected ||
        !state.settingsMenuAnchor ||
        !state.settingsMenuAnchor.isConnected)
    ) {
      closeSettingsMoreMenu();
    }
    // The header strip's tuck target is the shipped session-log menu; keep our
    // injected block in sync with whether it is open and what is tucked away.
    syncHeaderMenu();
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
    // Only rows the host currently exposes count toward "never hide the last
    // row": the saved order may still list rows that are temporarily unmounted.
    const present = visible.filter((key) => rowFor(found, key));
    return visible.indexOf(id) !== -1 && present.length > 1;
  }

  function hide(scope, id) {
    if (!canHide(scope, id)) return false;
    const layout = readScope(scope);
    const order = normalizedLayout(scope).order;
    const hidden = order.filter((key) => layout.hidden.indexOf(key) !== -1);
    if (hidden.indexOf(id) === -1) hidden.push(id);
    const nextOrder = order.filter((key) => hidden.indexOf(key) === -1).concat(hidden);
    writeScope(scope, { order: nextOrder, hidden }, { user: true });
    refreshScope(scope);
    notify();
    return true;
  }

  // Drop indexes are counted over the rows the user can actually see: the drag
  // snapshot skips tucked rows and rows the host does not paint. The saved
  // order, however, keeps entries for rows that are not mounted right now (a
  // plugin registers late, or an older version stored a row that is now host
  // chrome). Splicing the visible index straight into that order lands the row
  // one slot early for every absent entry before it - and when that slot is the
  // row's own position, the drop looks accepted (the line was drawn there) but
  // nothing moves. Resolve the index against the rows that are really here and
  // insert next to that neighbour instead.
  function presentIds(scope, list) {
    const found = state.found[scope];
    if (!found) return [];
    const here = new Set(found.rows.map((row) => row.id));
    return list.filter((key) => here.has(key));
  }

  function placeIndex(scope, list, id, index) {
    const others = list.filter((key) => key !== id);
    const here = presentIds(scope, others);
    const at = Math.max(0, Math.min(here.length, typeof index === "number" ? index : here.length));
    if (at < here.length) return others.indexOf(here[at]);
    if (!here.length) return others.length;
    // Last visible slot: stay in front of any absent entries tailing the order.
    return others.indexOf(here[here.length - 1]) + 1;
  }

  function reveal(scope, id, index) {
    const found = state.found[scope];
    const row = rowFor(found, id);
    if (!row) return false;
    const layout = normalizedLayout(scope);
    if (layout.hidden.indexOf(id) === -1) return false;
    const hidden = layout.hidden.filter((key) => key !== id);
    const visible = layout.order.filter((key) => hidden.indexOf(key) === -1);
    visible.splice(placeIndex(scope, visible, id, index), 0, id);
    writeScope(scope, { order: visible.concat(hidden), hidden }, { user: true });
    refreshScope(scope);
    notify();
    return true;
  }

  function reorder(scope, id, index) {
    const found = state.found[scope];
    const row = rowFor(found, id);
    // `fixed` rows belong to another plugin and must not move at all; `pinned`
    // only protects our own row from being tucked away.
    if (!row || row.fixed) return false;
    const layout = normalizedLayout(scope);
    const visible = layout.order.filter((key) => layout.hidden.indexOf(key) === -1);
    const from = visible.indexOf(id);
    if (from === -1) return false;
    const others = visible.filter((key) => key !== id);
    others.splice(placeIndex(scope, visible, id, index), 0, id);
    writeScope(scope, { order: others.concat(layout.hidden), hidden: layout.hidden }, { user: true });
    refreshScope(scope);
    notify();
    return true;
  }

  function reorderHidden(scope, id, index) {
    const layout = normalizedLayout(scope);
    const from = layout.hidden.indexOf(id);
    if (from === -1) return false;
    const others = layout.hidden.filter((key) => key !== id);
    others.splice(placeIndex(scope, layout.hidden, id, index), 0, id);
    writeScope(scope, { order: layout.order, hidden: others }, { user: true });
    notify();
    return true;
  }

  function clearHostActionButtons() {
    for (const button of document.querySelectorAll(".dso-host-action")) {
      if (button.parentNode) button.parentNode.removeChild(button);
    }
  }

  function resetScope(scope) {
    resetScopeState(scope);
    if (scope === "header") {
      clearHostActionButtons();
      // The cached rows still contain shortcut buttons that no longer exist;
      // rediscover instead of writing that stale order straight back.
      state.found.header = null;
    }
    refreshScope(scope);
    notify();
  }

  function resetRegion(region) {
    const scopes = REGION_SCOPES[region] || [];
    if (scopes.indexOf("header") !== -1) {
      clearHostActionButtons();
      state.found.header = null;
    }
    for (const scope of scopes) {
      resetScopeState(scope);
      refreshScope(scope);
    }
    notify();
  }

  function reset() {
    forgetLayout();
    clearHostActionButtons();
    state.found.header = null;
    for (const scope of SCOPE_KEYS) refreshScope(scope);
    notify();
  }

  function exportConfig() {
    return exportConfigSnapshot();
  }

  function importConfig(value) {
    const result = importConfigSnapshot(value);
    if (!result.ok) return result;
    for (const scope of SCOPE_KEYS) refreshScope(scope);
    schedulePass();
    notify();
    return result;
  }

  function isCustomized(scope) {
    const scopes = scope ? [scope] : SCOPE_KEYS;
    for (const key of scopes) {
      const layout = readScope(key);
      if (layout.hidden.length) return true;
      const found = state.found[key];
      if (!found) continue;
      // Compare only rows the host currently exposes: remembered ids for
      // temporarily absent rows are not a customization.
      const present = new Set(found.rows.map((row) => row.id));
      const visible = layout.order.filter((id) => present.has(id) && layout.hidden.indexOf(id) === -1);
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

  function hotkey() {
    return readHotkey();
  }

  function setHotkey(patch) {
    const next = { ...readHotkey(), ...(patch || {}) };
    // An unbound gate has no modes to remember; a later binding starts a
    // clean slate instead of resurrecting stale hold/toggle flags.
    if (!next.code) {
      next.hold = false;
      next.toggle = false;
    }
    writeHotkey(next);
    // A changed binding invalidates the held key; a disabled mode must not keep
    // a toggle it can no longer show or clear.
    if (state.hotkeyDown && !next.hold) state.hotkeyDown = false;
    if (!next.toggle) state.hotkeyToggleOn = false;
    if (!next.code) state.hotkeyDown = false;
    if (state.gesture && !isHotkeyGateOpen()) cancelGesture();
    notify();
    return next;
  }

  function setHotkeyCapture(active) {
    state.hotkeyCapturing = !!active;
    if (active) {
      state.hotkeyDown = false;
      state.hotkeyToggleOn = false;
    } else {
      state.hotkeyCaptureHandler = null;
    }
  }

  // The settings card owns the key that becomes the binding. This listener
  // sits on the window and is registered at start-up, so it runs before any
  // host dialog shortcut: Escape may cancel the recording instead of closing
  // the whole settings dialog.
  function setHotkeyCaptureHandler(handler) {
    state.hotkeyCaptureHandler = typeof handler === "function" ? handler : null;
  }

  function onHotkeyCaptureKey(event) {
    if (!state.hotkeyCapturing) return;
    // Escape belongs to the host dialog (it closes it, ending the recording);
    // swallowing it here would only strand the recorder in a dead dialog.
    if (event.key === "Escape") return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (event.type !== "keydown") return;
    const handler = state.hotkeyCaptureHandler;
    if (handler) handler(event);
  }

  // Open unless a binding exists and at least one mode is armed. With both
  // modes on, either one opens it.
  function isHotkeyGateOpen() {
    const config = readHotkey();
    if (!config.code || (!config.hold && !config.toggle)) return true;
    if (config.hold && state.hotkeyDown) return true;
    if (config.toggle && state.hotkeyToggleOn) return true;
    return false;
  }

  function handleHotkeyDown(event) {
    const config = readHotkey();
    if (!config.code || (!config.hold && !config.toggle)) return false;
    if (event.repeat || !matchesHotkey(event, config)) return false;
    if (config.hold) state.hotkeyDown = true;
    if (config.toggle) {
      state.hotkeyToggleOn = !state.hotkeyToggleOn;
      notify();
    }
    // Toggling the gate shut mid-drag must end that drag immediately.
    if (state.gesture && !isHotkeyGateOpen()) cancelGesture();
    return true;
  }

  function isEditableTarget(target) {
    if (!target || target.nodeType !== 1) return false;
    if (target.isContentEditable) return true;
    const tag = target.tagName;
    return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
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
      const axis = (found && found.axis) || def.axis;
      if (!found || !found.rows.length) {
        out.push({
          scope: def.key,
          axis,
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
          fixed: !!row.fixed,
        });
      }
      out.push({
        scope: def.key,
        axis,
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

  // Rows still registered with the host even when they are not mounted right
  // now. The conversation header unmounts / folds views past its overflow
  // limit, but the slot registry keeps them, so a tucked view stays tucked
  // while the pane is narrow and must still be listed in "已收纳".
  function registeredFor(scope) {
    const def = scopeDef(scope);
    if (!def || !def.slot) return null;
    const ids = new Set();
    for (const entry of readEntries(ctx, def.slot)) {
      const info = describeEntry(entry);
      if (info.id) ids.add(info.id);
    }
    return ids;
  }

  function hiddenForRegion(region) {
    const scopes = REGION_SCOPES[region] || [];
    const out = [];
    for (const scope of scopes) {
      const found = state.found[scope];
      if (!found) continue;
      const layout = normalizedLayout(scope);
      const registered = registeredFor(scope);
      const byId = new Map();
      for (const row of found.rows) byId.set(row.id, row);
      for (const id of layout.hidden) {
        const row = byId.get(id);
        if (!row && !(registered && registered.has(id))) continue;
        out.push({
          scope,
          id,
          label: (row && row.label) || labelFor(scope, id),
          icon: row ? iconFor(scope, id) : null,
        });
      }
    }
    return out;
  }

  function hiddenIds(scope) {
    try {
      return normalizedLayout(scope).hidden.slice();
    } catch (err) {
      return [];
    }
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
        rows: found ? found.rows.map((row) => ({ id: row.id, label: row.label, hidden: layout.hidden.indexOf(row.id) !== -1, pinned: !!row.pinned, fixed: !!row.fixed })) : [],
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
    if (gesture && gesture.scope === ROW_MENU_SCOPE) return buildRowMenuSnapshot(gesture);
    if (gesture && gesture.scope === CONTEXT_SCOPE) return buildContextSnapshot(gesture);
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
    // A shipped-menu row only ever reorders against its sibling shipped rows.
    // The tucked shelf above them is a separate list (its own hidden order), so
    // mixing both in the drop-index space made a drop between shipped rows land
    // at the wrong slot — or nowhere at all, because reorderHidden() only knows
    // tucked ids.
    const hostSource = gesture.scope === "header" && gesture.id.indexOf(HOST_ACTION_PREFIX) === 0;
    const menuTargets = hostSource
      ? menuItems.filter((item) => item.id.indexOf(HOST_ACTION_PREFIX) === 0)
      : menuItems;
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
    const moreRaw = moreTarget ? moreTarget.getBoundingClientRect() : null;
    // A hidden settings More anchor still has a 0×0 rect; treat it as absent so
    // (0,0) cannot become a phantom tuck target.
    const more = moreRaw && (moreRaw.width > 0 || moreRaw.height > 0) ? moreRaw : null;
    return {
      found,
      axis: found.axis,
      container,
      crossRect: crossRectFor(items, found.axis),
      items,
      menuItems,
      menuTargets,
      menuRect,
      moreRect: more,
    };
  }

  // Horizontal bars (the conversation tabs) reserve space under their labels
  // for the active underline (padding-bottom: 9px on the host tab). Centering
  // the drop line on the padding box therefore puts it a few pixels lower than
  // the labels. When the row's vertical padding is asymmetric, span the content
  // box instead; rows with symmetric padding are already centered.
  function contentCrossRect(unit, axis) {
    if (!unit || axis !== "x") return null;
    let style = null;
    try {
      style = getComputedStyle(unit);
    } catch (err) {
      return null;
    }
    const pt = parseFloat(style.paddingTop) || 0;
    const pb = parseFloat(style.paddingBottom) || 0;
    if (Math.abs(pt - pb) < 1) return null;
    const rect = unit.getBoundingClientRect();
    const height = Math.max(2, rect.height - pt - pb);
    return { top: rect.top + pt, height };
  }

  // The drop line must span the rows, not the scroll container. That
  // distinction is invisible in the sidebar (container width == row width) but
  // the right guide hangs 380px cards inside a full-width, centered flex
  // column: using the container rect drew the line across the whole app.
  function crossRectFor(items, axis) {
    if (!items.length) return null;
    if (axis === "x") return contentCrossRect(items[0].unit, axis);
    let left = Infinity;
    let right = -Infinity;
    for (const item of items) {
      left = Math.min(left, item.rect.left);
      right = Math.max(right, item.rect.right);
    }
    const width = right - left;
    return width > 0 ? { left, width } : null;
  }

  // A drag source is not always the painted surface. A collected row in the
  // "More" popup is a plain `div.dso-menu-item` wrapper around the host's
  // rounded MenuItemButton, so the wrapper's own computed radius is "0px".
  // Freezing that value pinned `border-radius: 0 !important` onto the ghost and
  // produced a square tile while dragging tucked rows. Look at the source and
  // its row-like descendants, and only freeze a radius when one is rounded;
  // otherwise the stylesheet's ghost radius stays in charge.
  function roundedRadius(element) {
    const nodes = [element];
    try {
      element.querySelectorAll("button, [role='menuitem'], [role='button'], .dso-menu-row").forEach((node) => nodes.push(node));
    } catch (error) {
      /* detached source: the element itself is enough */
    }
    for (const node of nodes) {
      let radius = "";
      try {
        radius = getComputedStyle(node).borderRadius || "";
      } catch (error) {
        continue;
      }
      const parts = radius.trim().split(/\s+/);
      if (parts.some((part) => parseFloat(part) > 0)) return radius.trim();
    }
    return "";
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
    // Radius is often declared with a custom property defined on an ancestor
    // (the right guide sets --dsl-guide-entry-radius on `.p2k40q_guide`). The
    // clone lives on <body>, where that property no longer resolves, so the
    // host declaration becomes invalid-at-computed-value-time and collapses to
    // square corners. Freeze the resolved radius on the clone instead. Rows
    // whose radius lives on an inner button (collected rows) resolve through
    // roundedRadius().
    const radius = roundedRadius(element);
    if (radius) clone.style.setProperty("border-radius", radius, "important");
    // The clone is reparented to <body>, so any look that the row inherits from
    // an ancestor is lost. The session header's icon buttons only carry
    // `aria-label`; their wrapper supplies `border: 0`, `padding: 0` and the
    // centering flex box. On <body> the clone fell back to the UA button frame
    // (`2px outset`, a light ring around a row that has none) and to the UA
    // `1px 6px` padding, which nudged the glyph. Freeze the resolved box metrics
    // instead of chasing host selectors.
    try {
      const sourceStyle = getComputedStyle(element);
      // Icon-only controls (the session-header glyph buttons) paint no surface
      // of their own: the glyph sits directly on the toolbar. The stylesheet's
      // lifted-card fill therefore turned a 28px icon into a black rounded tile
      // while dragging. A hovered host button can report a tinted background
      // (rgba(255, 255, 255, 0.12)), so alpha is not a reliable signal: text is.
      // Glyph rows never own a card surface; only rows with a label keep it.
      const hasText = (element.textContent || "").trim().length > 0;
      if (!hasText) clone.classList.add("dso-ghost-flat");
      for (const prop of ["display", "align-items", "justify-content", "gap", "padding"]) {
        clone.style.setProperty(prop, sourceStyle[prop], "important");
      }
      for (const side of ["Top", "Right", "Bottom", "Left"]) {
        clone.style.setProperty(
          `border-${side.toLowerCase()}`,
          `${sourceStyle[`border${side}Width`]} ${sourceStyle[`border${side}Style`]} ${sourceStyle[`border${side}Color`]}`,
          "important"
        );
      }
    } catch (error) {
      /* detached source: keep the stylesheet default */
    }
    // The clone inherits the host row's classes, and some host components set
    // `position: relative` on the same selector (the conversation tab bar does:
    // `.an3WzG_tab { position: relative }`). The host sheet is installed after
    // ours, so at equal specificity it wins and the "fixed" ghost turns into a
    // relative one that sits at the end of <body> in normal flow — it drops to
    // the bottom of the viewport and grows the document, adding a stray page
    // scrollbar. An inline important declaration cannot be beaten by the host.
    clone.style.setProperty("position", "fixed", "important");
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
    // The context menus carry their anchor on the snapshot itself (they have no
    // `found` record), so both shapes are unwound here.
    const snapshot = gesture.snapshot;
    const more = snapshot
      ? (snapshot.found ? snapshot.found.moreTarget || snapshot.found.more : null) || snapshot.moreElement
      : null;
    // Leave `dso-drop-receive` on the anchor: it is a one-shot 260 ms pulse owned
    // by pulseClass(), not by the drag session.
    if (more && more.classList) more.classList.remove("dso-drop-more");
    gesture.ghost = null;
    gesture.indicator = null;
    gesture.moreElement = null;
  }

  function markDropMore(gesture, active) {
    if (!gesture) return;
    const wanted = Boolean(active);
    // Idempotent on purpose: the caller runs once per pointer move, and touching
    // the class when nothing changed would restart the anchor's transition (and
    // the armed ring's animation), i.e. the anchor would pump while the pointer
    // merely moves over it.
    if (gesture.dropMoreArmed === wanted) return;
    gesture.dropMoreArmed = wanted;
    if (gesture.ghost) gesture.ghost.classList.toggle("dso-ghost-armed", wanted);
    if (!gesture.snapshot) return;
    const snapshot = gesture.snapshot;
    // `found.more` may be the flex wrapper (needed for style.order), while the
    // rounded surface belongs to the actual button. Put the drop ring there so
    // its outline follows the button's border-radius. The context menu has no
    // `found` record; its anchor travels on the snapshot instead.
    const element = snapshot.found
      ? snapshot.found.moreTarget || snapshot.found.more
      : snapshot.moreElement;
    if (!element) return;
    if (wanted) {
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
    if (!items.length) {
      // Only the dragged row itself is in this list ("已收纳" with a single
      // entry). Following the pointer drew a full-width line straight through
      // that row's text, so anchor to the source's own leading edge instead.
      const all = allItems && allItems.length ? allItems : items;
      const anchor = all.length ? all[0].rect : null;
      if (!anchor) return { index: 0, boundary: axis === "x" ? x : y };
      return { index: 0, boundary: axis === "x" ? anchor.left : anchor.top };
    }
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

  function showIndicator(gesture, axis, boundary, rect, crossRect) {
    const indicator = gesture.indicator;
    if (!indicator) return;
    indicator.dataset.visible = "1";
    indicator.className = "dso-indicator " + (axis === "x" ? "dso-indicator-v" : "dso-indicator-h");
    if (axis === "x") {
      const cross = crossRect && crossRect.height > 0 ? crossRect : null;
      indicator.style.left = boundary - 1 + "px";
      indicator.style.top = (cross ? cross.top : rect.top + 4) + "px";
      indicator.style.width = "2px";
      indicator.style.height = (cross ? cross.height : Math.max(0, rect.height - 8)) + "px";
    } else {
      const cross = crossRect && crossRect.width > 0 ? crossRect : null;
      const left = cross ? cross.left : rect.left;
      const width = cross ? cross.width : rect.width;
      indicator.style.left = left + 4 + "px";
      indicator.style.top = boundary - 1 + "px";
      indicator.style.width = Math.max(0, width - 8) + "px";
      indicator.style.height = "2px";
    }
  }

  function hideIndicator(gesture) {
    if (gesture && gesture.indicator) gesture.indicator.dataset.visible = "0";
  }

  function updateDragTarget(gesture, x, y) {
    const snapshot = gesture.snapshot;
    if (!snapshot) return;
    // Sticky view of "the pointer is already on the More anchor". The anchor's
    // own box is the hit area, so re-entering it from a hair outside on every
    // move is fine — but leaving it the instant the pointer sits 1px outside
    // makes the state flicker while the hand jitters. Keep the target while the
    // pointer stays within a small margin.
    const stickyMore = gesture.scope === CONTEXT_SCOPE && Boolean(gesture.target)
      && (gesture.target.kind === "ctx-hide"
        || (gesture.target.kind === "ctx-reveal" && gesture.target.beforeId == null));
    gesture.target = null;
    hideIndicator(gesture);
    // Decide the anchor state once per pointer move and apply it on the way out.
    // Arming and disarming inside one call restarts the anchor's transition (the
    // hit test in between forces a layout flush), which reads as the anchor
    // growing and shrinking on every mouse move.
    let dropMore = false;
    try {

    if (gesture.scope === ROW_MENU_SCOPE) {
      // Re-measure the pane on every move: opening a submenu, a hover
      // re-render or row-menu's own order can move the rows under the ghost.
      const pane = gesture.rowMenuPane;
      if (!pane || !pane.isConnected) return;
      const info = rowMenuPaneInfo(pane);
      if (!info || !info.rows.length) return;
      const live = info.rows
        .filter((row) => row.rect.width || row.rect.height)
        .map((row) => ({ id: row.id, unit: row.item, target: row.item, rect: row.rect }))
        .sort((a, b) => a.rect.top - b.rect.top);
      if (!live.length) return;
      if (!pointIn(info.rect, x, y, 8)) return;
      const others = live.filter((item) => item.id !== gesture.id);
      if (!others.length) return;
      const hit = indexAt(others, x, y, "y", live);
      gesture.target = {
        kind: "rowmenu",
        index: hit.index,
        beforeId: others[hit.index] ? others[hit.index].id : null,
      };
      showIndicator(gesture, "y", hit.boundary, info.rect, info.rect);
      return;
    }

    if (gesture.scope === CONTEXT_SCOPE) {
      // Live geometry: the host (and other plugins) append menu entries a beat
      // after the menu opens, and our own More anchor moves when that happens.
      // The frozen snapshot would then aim the drop at a stale row or a stale
      // anchor slot, so every hit test here re-measures instead.
      const model = state.contextRows;
      const liveMenu = model && model.menu && model.menu.isConnected ? model.menu.getBoundingClientRect() : null;
      const menuRect = liveMenu || snapshot.menuRect;
      const moreRect = contextMoreRect() || snapshot.moreRect;
      // The More anchor sits under the last row, so it is hit-tested first: the
      // row scan would otherwise read a drop on it as "insert at the end".
      // No padding here on purpose: the anchor sits directly under the last
      // row, and a padded hit rect would swallow drops that mean "insert at the
      // end" (the row above it). Only the anchor's own box tucks.
      if (moreRect && pointIn(moreRect, x, y, stickyMore ? 6 : 0)) {
        gesture.target = gesture.source === "more"
          ? { kind: "ctx-reveal", beforeId: null }
          : { kind: "ctx-hide" };
        // A row from the popup dropped on the anchor only goes to the end of the
        // menu; there is nothing to absorb, so no armed ring.
        dropMore = gesture.source !== "more";
        return;
      }
      // The popup hangs outside the menu rect, so its own reorder needs its own
      // hit test: dropping between two tucked rows reorders the tucked list.
      if (gesture.source === "more" && state.ctxMorePanel && state.ctxMorePanel.isConnected) {
        const panelRect = state.ctxMorePanel.getBoundingClientRect();
        if (pointIn(panelRect, x, y, 4)) {
          const rows = Array.from(state.ctxMorePanel.querySelectorAll("[data-dso-ctx-more-key]"))
            .map((element) => ({
              id: element.getAttribute("data-dso-ctx-more-key"),
              rect: element.getBoundingClientRect(),
            }))
            .filter((item) => item.id)
            .sort((a, b) => a.rect.top - b.rect.top);
          const others = rows.filter((item) => item.id !== gesture.id);
          if (rows.length) {
            const hit = indexAt(others, x, y, "y", rows);
            gesture.target = {
              kind: "ctx-panel",
              index: hit.index,
              beforeId: others[hit.index] ? others[hit.index].id : null,
            };
            showIndicator(gesture, "y", hit.boundary, panelRect, panelRect);
            return;
          }
        }
      }
      if (!menuRect || !pointIn(menuRect, x, y, 8)) return;
      const targets = model ? contextVisibleItems(model) : null;
      const list = targets && targets.length ? targets : snapshot.menuTargets;
      const others = list.filter((item) => item.id !== gesture.id);
      const hit = indexAt(others, x, y, "y", list);
      gesture.target = {
        kind: gesture.source === "more" ? "ctx-reveal" : "ctx",
        index: hit.index,
        beforeId: others[hit.index] ? others[hit.index].id : null,
      };
      showIndicator(gesture, "y", hit.boundary, menuRect, menuRect);
      return;
    }

    if (gesture.source === "menu" && snapshot.menuRect && pointIn(snapshot.menuRect, x, y)) {
      const targets = snapshot.menuTargets || snapshot.menuItems;
      const others = targets.filter((item) => item.id !== gesture.id);
      const hit = indexAt(others, x, y, "y", targets);
      gesture.target = { kind: "menu", index: hit.index, beforeId: others[hit.index] ? others[hit.index].id : null };
      showIndicator(gesture, "y", hit.boundary, snapshot.menuRect);
      return;
    }

    if (snapshot.moreRect && pointIn(snapshot.moreRect, x, y, 2)) {
      gesture.target = { kind: "hide" };
      dropMore = true;
      return;
    }

    if (!pointIn(snapshot.container, x, y, 10)) return;
    const others = snapshot.items.filter((item) => item.id !== gesture.id);
    const hit = indexAt(others, x, y, snapshot.axis, snapshot.items);
    gesture.target = { kind: "place", index: hit.index, beforeId: others[hit.index] ? others[hit.index].id : null };
    showIndicator(gesture, snapshot.axis, hit.boundary, snapshot.container, snapshot.crossRect);
    } finally {
      markDropMore(gesture, dropMore);
    }
  }

  function positionGhost(gesture) {
    if (!gesture || !gesture.ghost) return;
    gesture.ghost.style.left = gesture.x - gesture.offsetX + "px";
    gesture.ghost.style.top = gesture.y - gesture.offsetY + "px";
  }

  function beginDrag(gesture) {
    if (!gesture || state.gesture !== gesture || gesture.started) return;
    if (!dragAllowed(gesture.scope)) {
      cancelGesture();
      return;
    }
    // Commit any queued layout pass before measuring the frozen rects. Without
    // this, a drag started in the same frame as a previous drop can snapshot
    // the pre-order positions and make the ghost and indicator jump.
    if (gesture.source === "row") pass(true);
    // A context menu ships no host More row, so one is injected for the duration
    // of the drag: without it the first tuck would have nothing to aim at.
    if (gesture.scope === CONTEXT_SCOPE && gesture.source !== "more" && state.contextRows) {
      state.ctxMoreDragActive = true;
      ensureContextMoreAnchor(state.contextRows, state.contextKind);
    }
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
    // The keyup for a held hotkey never arrives once focus moved away.
    state.hotkeyDown = false;
  }

  function endGesture(guard) {
    const gesture = state.gesture;
    if (!gesture) return;
    const dragged = gesture.started;
    if (gesture.timer) window.clearTimeout(gesture.timer);
    state.gesture = null;
    removeGhost(gesture);
    // A finished settings drag invalidates the popup contents; a short click on
    // a menu item must stay alive until its click event activates the row.
    if (dragged && gesture.scope === "settings") closeSettingsMoreMenu();
    // The header menu is host-owned; a drag out of it must not leave it open.
    // Do this before arming the click guard, because the close is a synthetic
    // click on the anchor and the guard would otherwise swallow it.
    if (dragged && gesture.scope === "header" && gesture.source === "menu" && !gesture.keepMenu) dismissHeaderMenu();
    // The anchor injected for this drag is only permanent once a row is tucked;
    // re-sync so an empty one is removed again.
    if (dragged && gesture.scope === CONTEXT_SCOPE && state.ctxMoreDragActive) {
      state.ctxMoreDragActive = false;
      scheduleContextSync();
    }
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
    const snapshot = gesture && gesture.snapshot;
    const found = snapshot && snapshot.found;
    // Context menus carry their anchor on the snapshot (they have no `found`).
    const more = (found ? found.moreTarget || found.more : null) || (snapshot ? snapshot.moreElement : null);
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
    if (gesture.scope === ROW_MENU_SCOPE) {
      if (target.kind === "rowmenu") {
        if (!commitRowMenuReorder(gesture, target.beforeId)) {
          shakeGhost(gesture);
          return;
        }
        // The menu must stay open: the user is arranging it, not choosing an
        // action, and the new order should be visible right away.
        gesture.keepMenu = true;
        endGesture(true);
        return;
      }
      endGesture(true);
      return;
    }
    if (gesture.scope === CONTEXT_SCOPE) {
      if (target.kind === "ctx") {
        commitContextReorder(gesture.id, target.beforeId);
        // Reordering inside a popup is not leaving it: keep the menu open so the
        // new order (and the dividers that stayed put) can be checked at once.
        gesture.keepMenu = true;
        endGesture(true);
        return;
      }
      if (target.kind === "ctx-hide") {
        const model = state.contextRows;
        const hidden = model ? readContextMenuLayout(state.contextKind).hidden : [];
        const visible = model
          ? model.rows.filter((row) => row.reorderable && hidden.indexOf(row.id) === -1).length
          : 0;
        if (visible <= 1) {
          // Tucking the last visible action would leave a menu whose only entry
          // is the popup trigger: refuse it and say so with the reject shake.
          shakeGhost(gesture);
          return;
        }
        // Same flight as every other More drop: the ghost flies into the anchor
        // and the row is hidden once it lands.
        absorbGhost(gesture, () => hideContextRow(gesture.id));
        return;
      }
      if (target.kind === "ctx-panel") {
        // Reordering inside the popup only permutes the tucked list; nothing
        // leaves the menu, so the popup stays open for the next move.
        if (!commitContextPanelReorder(gesture.id, target.beforeId)) {
          shakeGhost(gesture);
          return;
        }
        gesture.keepMenu = true;
        endGesture(true);
        return;
      }
      if (target.kind === "ctx-reveal") {
        // A popup row dropped back into the menu body comes out of the tuck
        // list and takes the slot the indicator showed.
        revealContextRow(gesture.id, target.beforeId);
        closeContextMorePanel();
        gesture.keepMenu = true;
        endGesture(true);
        return;
      }
      endGesture(true);
      return;
    }
    const hostAction = gesture.scope === "header" && gesture.id.indexOf(HOST_ACTION_PREFIX) === 0;
    if (target.kind === "hide") {
      // Pulling a mirrored host action back into the menu removes the shortcut;
      // it never becomes a tucked row, because the host row never left the menu.
      if (hostAction) {
        unadoptHostAction(gesture.id);
        endGesture(true);
        return;
      }
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
      // Shipped-menu rows are host DOM, not entries of our hidden list, so
      // reorderHidden() silently no-ops on them. Persist their visual order
      // instead; tucked rows keep using the hidden order.
      if (hostAction) reorderHostMenu(gesture.id, target.beforeId);
      else reorderHidden(gesture.scope, gesture.id, target.index);
      // Reordering inside a popup is not leaving it: keep the menu open so the
      // user can see the new order and tune it without reopening every time.
      gesture.keepMenu = true;
      endGesture(true);
      return;
    }
    if (target.kind === "place") {
      if (gesture.source === "menu" && hostAction) {
        adoptHostAction(gesture.id, target.index);
        endGesture(true);
        return;
      }
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
    // A recording field owns the keyboard; no drag may start from a stray
    // pointer press elsewhere on the page while it waits for a key.
    if (state.hotkeyCapturing) return;
    if (!isHotkeyGateOpen()) return;

    // dsh-sidebar-row-menu draws its own panes (the blank-conversation menu and
    // its 打开方式 / 更多操作 submenus). Its rows are not host context-menu items,
    // so they need this entry point; the pane the press landed in is the pane
    // that drags, which is what makes a submenu drag rearrange the submenu
    // instead of the menu that owns it.
    const rowMenuPane = rowMenuPaneElement(target);
    if (rowMenuPane) {
      if (!contextMenuEnabled()) return;
      const rowEl = target.closest("[" + ROW_MENU_ID_ATTR + "]");
      if (!rowEl || !rowMenuPane.contains(rowEl)) return;
      if (rowMenuPaneElement(rowEl) !== rowMenuPane) return;
      const rowId = rowEl.getAttribute(ROW_MENU_ID_ATTR);
      if (!rowId) return;
      startGesture(rowEl, ROW_MENU_SCOPE, rowId, "rowmenu", event, { pane: rowMenuPane });
      return;
    }

    const contextItem = target.closest("[data-dso-ctx-id]");
    if (contextItem) {
      // The host opens a row's submenu INSIDE that row: the panel is a sibling
      // of the row's own button, so a press on one of its entries still resolves
      // to the row through closest(). Dragging there moved the parent action
      // under the pointer, which reads as "the submenu drags the main menu".
      // A press inside a popup nested in the row belongs to the host; the
      // row's own button (and its chevron) still drags as before.
      const pressedItem = target.closest('[role="menuitem"]');
      const ownItem = contextItem.matches('[role="menuitem"]')
        ? contextItem
        : contextItem.querySelector('[role="menuitem"]');
      if (pressedItem && ownItem && pressedItem !== ownItem && !ownItem.contains(pressedItem)) return;
      const contextModel = state.contextRows;
      if (!contextModel || !contextMenuEnabled()) return;
      const contextRow = contextRowAt(contextModel, contextItem);
      if (!contextRow) return;
      startGesture(contextRow.item, CONTEXT_SCOPE, contextRow.id, "ctx", event);
      return;
    }

    const moreRow = target.closest("[data-dso-ctx-more-key]");
    if (moreRow) {
      // A row listed under More drags back out into the menu (source "more").
      // A plain click never gets here as a commit: the click is handled by the
      // row's own listener once the pointer is released without a drag.
      if (!contextMenuEnabled()) return;
      startGesture(moreRow, CONTEXT_SCOPE, moreRow.getAttribute("data-dso-ctx-more-key"), "more", event);
      return;
    }

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
    if (info && info.fixed) return;
    startGesture(row, scope, id, "row", event);
  }

  function startGesture(element, scope, id, source, event, meta) {
    const gesture = {
      element,
      scope,
      id,
      source,
      rowMenuPane: meta && meta.pane ? meta.pane : null,
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
      dropMoreArmed: false,
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
    if (gesture.started) {
      // Arm the click guard BEFORE committing. Dropping onto the "More" anchor
      // commits through a 180 ms absorb animation, and endGesture() (which
      // normally arms the guard) only runs when that flight ends. The browser
      // dispatches the click from this pointerup immediately, so the guard was
      // still 0: the click reached the dragged row (pointer capture retargets
      // it) and activated the component instead of only tucking it away.
      state.guardUntil = Date.now() + CLICK_GUARD_MS;
      commitDrag();
    } else {
      cancelGesture();
    }
  }

  function onClickCapture(event) {
    if (Date.now() < state.guardUntil) {
      const bypass = state.clickBypass;
      if (bypass && (event.target === bypass || bypass.contains(event.target))) return;
      event.preventDefault();
      event.stopPropagation();
    }
  }

  function onKeyDown(event) {
    // The settings capture field owns every key while it is recording, so a
    // key meant for the binding cannot also toggle/arm the gate.
    if (state.hotkeyCapturing) return;
    const config = readHotkey();
    // A bare key stays inert inside a text field so typing never arms the
    // gate; a chord with Ctrl/Alt/Meta is deliberate enough to work anywhere.
    const chord = !!(config && (config.ctrl || config.alt || config.meta));
    const hotkeyHandled =
      (!isEditableTarget(event.target) || chord) && handleHotkeyDown(event);
    if (event.key === "Escape") {
      if (state.gesture) {
        event.preventDefault();
        cancelGesture();
        return;
      }
      // The popup is one layer above the menu: Escape closes it first and
      // leaves the menu itself open.
      if (state.ctxMoreOpen) {
        event.preventDefault();
        closeContextMorePanel();
        return;
      }
      if (state.settingsMenu) {
        event.preventDefault();
        closeSettingsMoreMenu();
        return;
      }
    }
    if (!event.altKey || (event.key !== "ArrowUp" && event.key !== "ArrowDown" && event.key !== "ArrowLeft" && event.key !== "ArrowRight")) {
      return;
    }
    // Alt+Arrow is also the reorder shortcut; a binding that uses it wins.
    if (hotkeyHandled) return;
    const target = event.target;
    if (!target || target.nodeType !== 1) return;
    const element = target.closest("[data-dso-key]");
    if (!element) return;
    const scope = element.dataset.dsoScope;
    const id = element.dataset.dsoKey;
    if (!scope || !id) return;
    const def = scopeDef(scope);
    const found = state.found[scope];
    const axis = (found && found.axis) || (def && def.axis);
    const delta = event.key === "ArrowUp" || event.key === "ArrowLeft" ? -1 : 1;
    if (axis === "x" && (event.key === "ArrowUp" || event.key === "ArrowDown")) return;
    if (axis === "y" && (event.key === "ArrowLeft" || event.key === "ArrowRight")) return;
    event.preventDefault();
    // Step over the rows that are actually on screen, so an order entry for a
    // row the host has not mounted cannot swallow a keypress.
    const visible = presentIds(scope, visibleIds(scope));
    const index = visible.indexOf(id);
    if (index === -1) return;
    reorder(scope, id, index + delta);
    const next = findRowElement(scope, id);
    if (next && next.focus) next.focus();
  }

  function onKeyUp(event) {
    if (!state.hotkeyDown) return;
    const config = readHotkey();
    // Compare only the main key: modifiers may be released in any order, and a
    // strict match would leave the gate armed after an Alt-first release.
    if (config.code && event.code === config.code) state.hotkeyDown = false;
    // Releasing the held key closes the gate; an in-flight drag (or a pending
    // long-press timer) must not outlive it.
    if (state.gesture && !isHotkeyGateOpen()) cancelGesture();
  }

  function onScroll(event) {
    // A scrolling ancestor moves the anchor under a fixed-position popup; close
    // it unless the scroll happened inside the popup itself (its own list).
    if (state.ctxMoreOpen && !state.gesture) {
      const scrolled = event && event.target;
      const insidePanel =
        scrolled && scrolled.nodeType === 1 && state.ctxMorePanel && state.ctxMorePanel.contains(scrolled);
      // Only a scroll INSIDE the menu detaches the anchor from its row. Page or
      // conversation scrolling closes the host menu itself; closing the popup
      // for it made the popup vanish whenever the chat stream scrolled.
      const menu = state.contextRows && state.contextRows.menu;
      const insideMenu = scrolled && menu && menu.contains(scrolled);
      if (insideMenu && !insidePanel) closeContextMorePanel();
    }
    if (state.settingsMenu && !state.gesture) {
      const target = event && event.target;
      const inside =
        target &&
        target.nodeType === 1 &&
        (target === state.settingsMenu || state.settingsMenu.contains(target));
      if (!inside) {
        // The host settings dialog can emit scrolls on its own (focus moves,
        // re-renders). Reposition instead of closing, or the popup would
        // vanish the instant it opens.
        if (state.settingsMenuAnchor && state.settingsMenuAnchor.isConnected) {
          positionSettingsMoreMenu(state.settingsMenu, state.settingsMenuAnchor);
        } else {
          closeSettingsMoreMenu();
        }
      }
    }
    const gesture = state.gesture;
    if (!gesture || !gesture.started) return;
    const snapshot = buildSnapshot(gesture);
    if (snapshot) gesture.snapshot = snapshot;
    positionGhost(gesture);
    updateDragTarget(gesture, gesture.x, gesture.y);
  }

  function onResize() {
    // The popup is placed from viewport coordinates, so a resize invalidates it;
    // re-place it rather than leaving it floating away from its anchor.
    if (state.ctxMoreOpen && !state.gesture) {
      const model = state.contextRows;
      const kind = state.contextKind;
      if (model && kind) renderContextMorePanel(model, contextTuckedRows(model, readContextMenuLayout(kind).hidden));
      else closeContextMorePanel();
    }
    if (state.settingsMenu && !state.gesture) {
      if (state.settingsMenuAnchor && state.settingsMenuAnchor.isConnected) {
        positionSettingsMoreMenu(state.settingsMenu, state.settingsMenuAnchor);
      } else {
        closeSettingsMoreMenu();
      }
    }
  }

  function relevantMutation(mutation) {
    if (mutation.type !== "childList") return false;
    const target = mutation.target;
    if (target && target.nodeType === 1) {
      for (const def of SCOPE_DEFS) {
        const found = state.found[def.key];
        if (found && found.container && found.container.contains(target)) return true;
      }
      if (target.closest && target.closest('[data-slot], [data-shortcut-modal], [data-conversation-tabs], [data-sidebar-right-guide], [role="menu"]')) return true;
    }
    for (const def of SCOPE_DEFS) {
      const found = state.found[def.key];
      if (found && found.container && !found.container.isConnected) return true;
    }
    const nodes = Array.from(mutation.addedNodes).concat(Array.from(mutation.removedNodes));
    for (const node of nodes) {
      if (!node || node.nodeType !== 1) continue;
      if (node.matches && node.matches('[data-slot], [data-shortcut-modal], [data-conversation-tabs], [data-sidebar-right-guide], [data-dso-key], [role="menu"]')) return true;
      if (node.querySelector && node.querySelector('[data-slot], [data-shortcut-modal], [data-conversation-tabs], [data-sidebar-right-guide], [data-dso-key], [role="menu"]')) return true;
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
    addListener(document, "click", onHeaderMenuClick, true);
    addListener(document, "click", onDocumentClick);
    addListener(document, "contextmenu", onContextMenuCapture, true);
    addListener(document, "keydown", onKeyDown, true);
    addListener(document, "keyup", onKeyUp, true);
    addListener(window, "keydown", onHotkeyCaptureKey, true);
    addListener(window, "keyup", onHotkeyCaptureKey, true);
    addListener(window, "scroll", onScroll, true);
    addListener(window, "resize", onResize);
    addListener(window, "blur", onWindowBlur);

    if (typeof MutationObserver !== "undefined") {
      observer = new MutationObserver((mutations) => {
        let layoutChanged = false;
        for (const mutation of mutations) {
          if (relevantMutation(mutation)) {
            layoutChanged = true;
            break;
          }
        }
        if (layoutChanged) schedulePass();
        // Hover re-renders and menu mounts are not layout passes, but they do
        // rebuild the open menu, so its order and dividers must be repainted.
        scheduleContextSync();
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
    scheduleContextSync();
  }

  function stop() {
    if (state.stopped) return;
    state.stopped = true;
    if (state.passFrame) window.cancelAnimationFrame(state.passFrame);
    if (state.contextFrame) {
      window.cancelAnimationFrame(state.contextFrame);
      window.clearTimeout(state.contextFrame);
      state.contextFrame = 0;
    }
    if (state.pollTimer) window.clearInterval(state.pollTimer);
    if (observer) observer.disconnect();
    observer = null;
    clearContextMenu();
    clearRowMenuStyles();
    closeSettingsMoreMenu();
    state.headerMenu = null;
    removeHeaderMenuBlock();
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
    exportConfig,
    importConfig,
    canHide,
    isCustomized,
    isCustomizedRegion,
    isDragEnabled,
    setDragEnabled,
    hotkey,
    setHotkey,
    setHotkeyCapture,
    setHotkeyCaptureHandler,
    activate,
    hiddenForRegion,
    hiddenIds,
    labelFor,
    iconFor,
    status,
    contextMenu: {
      supported: contextMenusSupported(),
      enabled: readContextMenuEnabled,
      setEnabled: setContextMenuEnabled,
      reset: resetContextMenus,
      read: readContextMenuLayout,
      // Diagnostics/support hook: write a layout and repaint the open menu.
      set: (kind, layout) => {
        writeContextMenuLayout(kind, layout);
        const model = state.contextRows;
        if (model && state.contextKind === kind) {
          const next = contextMenuModel(model.menu) || model;
          state.contextRows = next;
          applyContextLayout(next, kind, readContextMenuLayout(kind), true);
        } else {
          scheduleContextSync();
        }
      },
      refresh: scheduleContextSync,
    },
  };
}
