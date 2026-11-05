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
    contextDividerNodes: [],
    contextTemplate: null,
    contextFrame: 0,
    contextPendingKind: "",
    contextPendingAt: 0,
    contextOpenedAt: 0,
    contextPendingToggle: null,
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

  // The scroll viewport is a flex column. The node that actually takes a slot is
  // the outermost ancestor of the menuitem that is not `display: contents`:
  // plugin contributions wrap their row in display:contents slots, and setting
  // `order` on those does nothing. Footer rows and buttons appended straight to
  // the portal root never reach the viewport and are therefore left alone.
  function contextFlexItem(menuitem, viewport) {
    if (!menuitem || !viewport) return null;
    const chain = [];
    let node = menuitem;
    while (node && node !== viewport && chain.length < 12) {
      chain.push(node);
      node = node.parentElement;
    }
    if (node !== viewport) return null;
    let item = null;
    for (const element of chain) {
      let display = "";
      try {
        display = window.getComputedStyle(element).display;
      } catch (err) {
        display = "";
      }
      if (display !== "contents") item = element;
    }
    return item;
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
    const viewport = contextMenuViewport(menu);
    if (!viewport) return null;
    // One row per flex item, using the OUTERMOST menuitem. A submenu row can own
    // a hidden panel whose entries are also menuitems; taking the first one in
    // DOM order made the row's label (and therefore its content hash) flip as
    // the user picked a different submenu entry.
    const byItem = new Map();
    for (const menuitem of viewport.querySelectorAll('[role="menuitem"]')) {
      const item = contextFlexItem(menuitem, viewport);
      if (!item) continue;
      let depth = 0;
      for (let node = menuitem; node && node !== item; node = node.parentElement) depth += 1;
      const existing = byItem.get(item);
      if (!existing || depth < existing.depth) byItem.set(item, { menuitem, depth });
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
      rows.push({ item, menuitem: entry.menuitem, label, dom: dom, rect: item.getBoundingClientRect() });
      dom += 1;
    }
    if (!rows.length) return null;
    rows.sort((a, b) => a.rect.top - b.rect.top);
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
    for (const node of viewport.querySelectorAll('[role="separator"]')) {
      if (node.hasAttribute("data-dso-ctx-divider")) continue;
      if (!isContextSeparator(node)) continue;
      const rect = node.getBoundingClientRect();
      const middle = rect.top + rect.height / 2;
      let gap = 0;
      for (const row of rows) {
        // A row that has not been laid out yet (a plugin registers its entries a
        // moment after the menu opens, so its rect is 0) must not count as a row
        // above the separator: that shifted the whole divider set by one.
        if (row.rect.height <= 0) continue;
        if (row.rect.top + row.rect.height / 2 < middle) gap += 1;
      }
      if (nativeDividers.indexOf(gap) === -1) nativeDividers.push(gap);
    }
    const ids = new Map();
    for (const row of rows) ids.set(row.id, row);
    return { menu, viewport, rows, ids, nativeDividers };
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
    for (const node of model.viewport.children) {
      if (node.matches && node.matches('[role="separator"]')) {
        source = node;
        break;
      }
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
    const viewport = model.viewport;
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
      // Row N sits at order 2N, so the gap before it lands at 2N-1.
      const order = String(gap * 2 - 1);
      if (node.style.order !== order) node.style.order = order;
      if (node.style.display !== "block") node.style.display = "block";
      if (node.dataset.dsoCtxGap !== String(gap)) node.dataset.dsoCtxGap = String(gap);
      if (node.parentNode !== viewport) viewport.appendChild(node);
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

  function applyContextLayout(model, kind, layout, force) {
    const customized = Boolean(layout && layout.customized);
    // Until the user customizes this menu the host layout stays exactly as it
    // shipped: the host separators keep their own groups and no row is moved.
    // Rows are still tagged, because that tag is what starts a drag.
    for (const node of model.viewport.querySelectorAll('[role="separator"]')) {
      if (!isContextSeparator(node)) continue;
      if (node.hasAttribute("data-dso-ctx-divider")) continue;
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
    if (!customized) {
      for (const row of model.rows) {
        const entry = rememberContextElement(row.item);
        if (entry && row.item.style.order !== entry.order) row.item.style.order = entry.order;
        if (row.item.dataset.dsoCtxId !== row.id) row.item.dataset.dsoCtxId = row.id;
      }
      removeContextDividers();
      return model.rows.map((row) => row.id);
    }
    const merged = mergeContextOrder(layout.order, model.rows);
    merged.forEach((id, index) => {
      const row = model.ids.get(id);
      if (!row) return;
      rememberContextElement(row.item);
      const order = String(index * 2);
      if (row.item.style.order !== order) row.item.style.order = order;
      if (row.item.dataset.dsoCtxId !== id) row.item.dataset.dsoCtxId = id;
    });
    // A divider below the last row (or past it) has nothing to divide and is
    // dropped, which is the rule the user asked for; write the pruned list back
    // so it does not reappear when a row is added later.
    const gaps = [];
    for (const gap of layout.dividers || []) {
      if (gap >= 0 && gap < merged.length && gaps.indexOf(gap) === -1) gaps.push(gap);
    }
    // A divider past the end is dropped (the user's rule). The write-back waits
    // briefly: plugins register their entries a moment after the menu opens, and
    // pruning a still-growing row list would delete a divider the user saved.
    const settled = force || !state.contextOpenedAt || Date.now() - state.contextOpenedAt > 500;
    if (gaps.length !== (layout.dividers || []).length && settled) {
      writeContextMenuLayout(kind, { order: merged, dividers: gaps, customized: true });
    }
    renderContextDividers(model, gaps);
    return merged;
  }

  function clearContextMenu() {
    removeContextDividers();
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
    if (state.contextMenu !== menu) state.contextOpenedAt = Date.now();
    state.contextMenu = menu;
    state.contextKind = kind;
    state.contextRows = model;
    applyContextLayout(model, kind, readContextMenuLayout(kind));
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
    };
    if (typeof window.requestAnimationFrame === "function") {
      state.contextFrame = window.requestAnimationFrame(run);
    } else {
      state.contextFrame = window.setTimeout(run, 16);
    }
  }

  // A snapshot in the shape the generic drag pipeline expects. `found` is null
  // on purpose: every `found` consumer is null-guarded, and the menu's own rect
  // replaces the container/cross rects.
  function buildContextSnapshot() {
    const model = state.contextRows;
    if (!model || !model.menu || !model.menu.isConnected) return null;
    const items = [];
    let left = Infinity;
    let top = Infinity;
    let right = -Infinity;
    let bottom = -Infinity;
    for (const row of model.rows) {
      if (!row.item.isConnected) continue;
      const rect = row.item.getBoundingClientRect();
      if (!rect.width && !rect.height) continue;
      items.push({ id: row.id, unit: row.item, target: row.item, rect });
      left = Math.min(left, rect.left);
      top = Math.min(top, rect.top);
      right = Math.max(right, rect.right);
      bottom = Math.max(bottom, rect.bottom);
    }
    if (!items.length || !isFinite(left)) return null;
    items.sort((a, b) => a.rect.top - b.rect.top);
    const menuRect = { left, top, right, bottom, width: right - left, height: bottom - top };
    return {
      found: null,
      axis: "y",
      container: menuRect,
      crossRect: menuRect,
      items,
      menuItems: items,
      menuTargets: items,
      menuRect,
      moreRect: null,
    };
  }

  function contextRowAt(model, target) {
    if (!model || !target) return null;
    const item = target.closest("[data-dso-ctx-id]");
    if (!item) return null;
    for (const row of model.rows) {
      if (row.item === item) return row;
    }
    return null;
  }

  function sortedContextRows(model) {
    return model.rows.slice().sort((a, b) => a.item.getBoundingClientRect().top - b.item.getBoundingClientRect().top);
  }

  // Right-clicking a row toggles the divider directly BELOW it. The last row has
  // nothing below it, so it is a no-op (a divider there would be trailing and
  // the host hides it anyway).
  function toggleContextDivider(row) {
    const model = state.contextRows;
    const kind = state.contextKind;
    if (!model || !kind || !contextMenuEnabled()) return false;
    const sorted = sortedContextRows(model);
    const index = sorted.indexOf(row);
    if (index === -1) return false;
    const gap = index + 1;
    if (gap >= sorted.length) return false;
    const current = readContextMenuLayout(kind);
    const layout = {
      // First toggle: take the host's document order, not the measured order.
      // A menu that just re-rendered can measure a row at 0px and sorting by
      // rect would persist that glitch as the user's order.
      order: current.customized
        ? current.order.slice()
        : model.rows.slice().sort((a, b) => a.dom - b.dom).map((item) => item.id),
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
    const ids = sortedContextRows(model).map((row) => row.id);
    const from = ids.indexOf(id);
    if (from === -1) return false;
    ids.splice(from, 1);
    let at = ids.length;
    if (beforeId) {
      const target = ids.indexOf(beforeId);
      if (target !== -1) at = target;
    }
    ids.splice(at, 0, id);
    const current = readContextMenuLayout(kind);
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
    notify();
    return Boolean(enabled);
  }

  function resetContextMenus() {
    resetContextMenuLayouts();
    clearContextMenu();
    scheduleContextSync();
    notify();
  }

  // The drop scope of the open menu. It is not part of SCOPE_KEYS: there are no
  // persistent rows to discover, only the menu that happens to be open.
  function dragAllowed(scope) {
    if (scope === CONTEXT_SCOPE) return contextMenuEnabled();
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
    if (gesture && gesture.scope === CONTEXT_SCOPE) return buildContextSnapshot();
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
    gesture.target = null;
    hideIndicator(gesture);
    markDropMore(gesture, false);

    if (gesture.scope === CONTEXT_SCOPE) {
      if (!snapshot.menuRect || !pointIn(snapshot.menuRect, x, y, 8)) return;
      const targets = snapshot.menuTargets;
      const others = targets.filter((item) => item.id !== gesture.id);
      const hit = indexAt(others, x, y, "y", targets);
      gesture.target = { kind: "ctx", index: hit.index, beforeId: others[hit.index] ? others[hit.index].id : null };
      showIndicator(gesture, "y", hit.boundary, snapshot.menuRect, snapshot.menuRect);
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
      markDropMore(gesture, true);
      return;
    }

    if (!pointIn(snapshot.container, x, y, 10)) return;
    const others = snapshot.items.filter((item) => item.id !== gesture.id);
    const hit = indexAt(others, x, y, snapshot.axis, snapshot.items);
    gesture.target = { kind: "place", index: hit.index, beforeId: others[hit.index] ? others[hit.index].id : null };
    showIndicator(gesture, snapshot.axis, hit.boundary, snapshot.container, snapshot.crossRect);
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
    if (gesture.scope === CONTEXT_SCOPE) {
      if (target.kind === "ctx") {
        commitContextReorder(gesture.id, target.beforeId);
        // Reordering inside a popup is not leaving it: keep the menu open so the
        // new order (and the dividers that stayed put) can be checked at once.
        gesture.keepMenu = true;
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

    const contextItem = target.closest("[data-dso-ctx-id]");
    if (contextItem) {
      const contextModel = state.contextRows;
      if (!contextModel || !contextMenuEnabled()) return;
      const contextRow = contextRowAt(contextModel, contextItem);
      if (!contextRow) return;
      startGesture(contextRow.item, CONTEXT_SCOPE, contextRow.id, "ctx", event);
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
