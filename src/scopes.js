/* Discover the six host regions and pair their DOM rows with stable ids. */

const SCOPE_DEFS = [
  { key: "sidebar", axis: "y", more: true, slot: PANEL_SLOT, selector: '[data-slot="sidebar.panellist"], [data-slot="sidebar.panel.icon"]' },
  { key: "footer", axis: "x", more: true, slot: FOOTER_SLOT, selector: '[data-slot="sidebar.footer.action"]' },
  { key: "tabs", axis: "x", more: true, slot: TABS_SLOT, selector: "[data-conversation-tabs]" },
  { key: "composer", axis: "x", more: true, slot: COMPOSER_SLOT, selector: '[data-slot="conversation.composer.dock"]' },
  // The header strip's slot entries have no stable registration ids to pair
  // with (only the shipped "more actions" plugin registers one, and it is not
  // the row's visual position), so `slot: null` keeps assignIds from shifting
  // that id onto whichever row comes first. Rows get aria-label derived ids.
  { key: "header", axis: "x", more: true, slot: null, selector: '[data-slot="conversation.session.header.utilities"]' },
  { key: "right", axis: "y", more: true, slot: null, selector: "[data-sidebar-right-guide]" },
  { key: "settings", axis: "y", more: false, slot: SETTINGS_SLOT, selector: '[data-shortcut-modal="settings"]' },
];

function scopeDef(scope) {
  for (const def of SCOPE_DEFS) if (def.key === scope) return def;
  return null;
}

function elementChildren(element) {
  if (!element) return [];
  return Array.from(element.children).filter((child) => child && child.nodeType === 1);
}

function isMenuTrigger(element) {
  if (!element || element.nodeType !== 1) return false;
  if (element.matches('[aria-haspopup="menu"]')) return true;
  return !!element.querySelector('[aria-haspopup="menu"]');
}

// A menu trigger is not automatically the "More" anchor. Footer/composer rows
// (settings gear, model picker, ...) often open menus too; excluding every menu
// trigger made those whole regions report zero rows. Only the actual overflow
// control should be treated as More.
function isMoreTrigger(element) {
  if (!isMenuTrigger(element)) return false;
  const target = element.matches('[aria-haspopup="menu"]')
    ? element
    : element.querySelector('[aria-haspopup="menu"]');
  const label = cleanLabel(
    (target && (target.getAttribute("aria-label") || target.getAttribute("title"))) || element.textContent
  ).toLowerCase();
  if (/^(more|more tools|more actions|更多|更多工具|更多标签|更多操作)$/.test(label)) return true;
  const cls = String((element.getAttribute && element.getAttribute("class")) || "");
  return /(^|[\s_-])more([\s_-]|$)|moreanchor|moretrigger/i.test(cls);
}

function menuTriggerButton(element) {
  if (!element) return null;
  if (element.matches('[aria-haspopup="menu"]')) return element;
  return element.querySelector('[aria-haspopup="menu"]') || element;
}

function clickableIn(element) {
  if (!element) return null;
  if (element.matches('button, a, [role="tab"], [role="menuitem"]')) return element;
  return element.querySelector('button, a, [role="tab"], [role="menuitem"]');
}

function cleanLabel(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function slug(value) {
  return cleanLabel(value).toLowerCase().replace(/[^\w\u4e00-\u9fa5-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);
}

function labelOf(target, fallback) {
  if (!target) return fallback || "";
  const aria = cleanLabel(target.getAttribute && target.getAttribute("aria-label"));
  if (aria) return aria;
  const title = cleanLabel(target.getAttribute && target.getAttribute("title"));
  if (title) return title;
  const titleNode = target.querySelector && target.querySelector('[class*="entryTitle"]');
  if (titleNode) {
    const text = cleanLabel(titleNode.textContent);
    if (text) return text;
  }
  const text = cleanLabel(target.textContent);
  if (text) return text.slice(0, 60);
  return fallback || "";
}

// A label that carries live state ("IP 防护：0 个黑洞", "3 个会话") is not an
// identifier: the id changed with the count and the saved order/hidden list lost
// its owner without any warning. Bind ids to the stable part of the label and
// keep the raw text out of the id entirely.
function canonicalLabel(value) {
  let text = cleanLabel(value);
  if (!text) return "";
  const colon = Math.max(text.lastIndexOf("："), text.lastIndexOf(":"));
  if (colon > 0 && text.slice(colon + 1).trim()) text = text.slice(0, colon);
  // Numbers are counts/statuses just as often as they are names. Replacing them
  // with a letter keeps the surrounding words (and their separators) intact, so
  // "第 3 个" and "第 4 个" still fingerprint alike.
  return text.replace(/\d+/g, "n");
}

function fingerprintOf(label) {
  return slug(canonicalLabel(label));
}

// Fingerprints of ids written by older builds: aria-label text was stored
// verbatim, and the label fallback stored "text:<slug>". Both have to be
// recognised so a one-shot migration can hand the saved order to the new id.
function idFingerprint(id) {
  let raw = String(id || "");
  if (raw.indexOf("text:") === 0) raw = raw.slice(5);
  else if (raw.indexOf("host:") === 0) raw = raw.slice(5);
  return fingerprintOf(raw);
}

// Token-prefix affinity, used only by the migration: the old id may still carry
// the status tail the new fingerprint dropped ("ip-防护-n-个黑洞" vs "ip-防护").
// Comparing whole tokens avoids pairing "更多" with "更多操作".
function fingerprintAffinity(a, b) {
  if (!a || !b) return false;
  if (a === b) return true;
  const left = a.split("-");
  const right = b.split("-");
  if (left.length === right.length) return false;
  const short = left.length < right.length ? left : right;
  const long = left.length < right.length ? right : left;
  for (let i = 0; i < short.length; i += 1) {
    if (short[i] !== long[i]) return false;
  }
  return true;
}

function deriveId(target, label) {
  // aria-label and title are deliberately absent: both are text the host
  // rewrites for state, translation and counts. What is left is either an
  // attribute the host uses as a handle, or the canonical label fingerprint.
  const attrs = ["data-panel", "data-view", "data-action", "data-testid", "data-id", "id", "name"];
  if (target && target.getAttribute) {
    for (const attr of attrs) {
      const value = cleanLabel(target.getAttribute(attr));
      if (value) return value;
    }
  }
  const fromLabel = fingerprintOf(label);
  return fromLabel ? `host:${fromLabel}` : "host:item";
}

function uniqueId(id, used) {
  let next = id || "item";
  let n = 2;
  while (used.has(next)) {
    next = `${id}~${n}`;
    n += 1;
  }
  used.add(next);
  return next;
}

function rememberAliases(scope, rows, previous) {
  const next = {};
  for (const row of rows) {
    if (!row.fingerprint) continue;
    // First row with a fingerprint wins, matching the DOM order used to assign
    // ids; two identical labels then keep the same `~2` suffix every pass.
    if (!next[row.fingerprint]) next[row.fingerprint] = row.id;
  }
  // Keep bindings for rows this pass did not see (a panel that mounts late):
  // dropping them would make the row look new and lose its saved slot.
  for (const key of Object.keys(previous || {})) {
    if (!next[key]) next[key] = previous[key];
  }
  if (JSON.stringify(next) !== JSON.stringify(previous || {})) writeAliases(scope, next);
}

// One-shot hand-over of a layout written by an older build. The saved ids are
// orphans only because this build derives them differently; pair them with the
// rows that now hold no saved record, then rewrite order/hidden in place so the
// arrangement is untouched. Runs on discovery, so a scope that never mounts is
// never rewritten on a guess.
function migrateScopeIds(found) {
  const scope = found.scope;
  const layout = readScope(scope);
  if (!layout.order.length) return 0;
  const rows = found.rows;
  const ids = new Set(rows.map((row) => row.id));
  const orphans = layout.order.filter((id) => !ids.has(id));
  if (!orphans.length) return 0;
  // Adopted host-menu shortcuts own their id lifecycle (reconcileHostActions
  // renames them when the host reorders its menu). Pairing them here could only
  // hand a freshly renamed id back to its legacy slot.
  const isHostAction = (id) => String(id || "").indexOf(HOST_ACTION_PREFIX) === 0;
  if (orphans.every(isHostAction)) return 0;
  const known = new Set(layout.order);
  // A row this build just started mounting is not a candidate: on the first
  // pass after an upgrade it can be the only unseen row, and the positional
  // fallback below would hand it a saved id whose button has not mounted yet.
  const candidates = rows.filter((row) => !row.noMigrate && !known.has(row.id) && !isHostAction(row.id));
  const paired = new Map();
  const takenRows = new Set();
  const fingerprintOfRow = (row) => row.fingerprint || fingerprintOf(row.label);

  const pair = (orphan, row) => {
    paired.set(orphan, row.id);
    takenRows.add(row);
  };
  for (const orphan of orphans) {
    const fingerprint = idFingerprint(orphan);
    if (!fingerprint) continue;
    const hit = candidates.find((row) => !takenRows.has(row) && fingerprintOfRow(row) === fingerprint);
    if (hit) pair(orphan, hit);
  }
  for (const orphan of orphans) {
    if (paired.has(orphan)) continue;
    const fingerprint = idFingerprint(orphan);
    if (!fingerprint) continue;
    const hit = candidates.find((row) => !takenRows.has(row) && fingerprintAffinity(fingerprint, fingerprintOfRow(row)));
    if (hit) pair(orphan, hit);
  }
  // Equal counts mean the same rows are mounted, only the ids moved (a renamed
  // action, or a new host build): pair what is left by position.
  const leftOrphans = orphans.filter((id) => !paired.has(id));
  const leftRows = candidates.filter((row) => !takenRows.has(row));
  if (leftOrphans.length && leftOrphans.length === leftRows.length && !leftOrphans.some(isHostAction)) {
    for (let i = 0; i < leftOrphans.length; i += 1) pair(leftOrphans[i], leftRows[i]);
  }
  if (!paired.size) return 0;

  const swap = (id) => paired.get(id) || id;
  writeScope(scope, {
    order: layout.order.map(swap),
    hidden: layout.hidden.map(swap),
  });
  const aliases = readAliases(scope);
  for (const [oldId, newId] of paired) {
    const fingerprint = idFingerprint(oldId);
    if (fingerprint && !aliases[fingerprint]) aliases[fingerprint] = newId;
  }
  writeAliases(scope, aliases);
  return paired.size;
}

function assignIds(rows, entries, scope) {
  const used = new Set();
  const available = [];
  for (const entry of entries || []) {
    const info = describeEntry(entry);
    if (info.id) available.push({ id: info.id, label: info.label, taken: false });
  }
  const aliases = scope ? readAliases(scope) : {};
  rows.forEach((row) => {
    let picked = null;
    for (const entry of available) {
      if (!entry.taken && entry.label && row.label && entry.label === row.label) {
        picked = entry;
        break;
      }
    }
    if (!picked) {
      // Positional fallback exists only for an entry that has no label of its
      // own (icon-only buttons). Taking a *labelled* entry here would hand this
      // row another row's id as soon as one row's label stops matching (a
      // renamed action, or a row inserted before it), and the saved order for
      // that id would silently follow the wrong row.
      for (const entry of available) {
        if (!entry.taken && !entry.label) {
          picked = entry;
          break;
        }
      }
    }
    const fingerprint = fingerprintOf(row.label);
    let base = picked ? picked.id : "";
    if (!base && row.target && row.target.getAttribute) {
      // An adopted host-menu shortcut is mounted under its own id, and
      // reconcileHostActions keeps that id current. The id attribute is
      // therefore newer than any saved alias; letting the alias win would put
      // the button back on the legacy id the rename just retired.
      const mounted = cleanLabel(row.target.getAttribute("id"));
      if (mounted && mounted.indexOf(HOST_ACTION_PREFIX) === 0) base = mounted;
    }
    if (!base && scope && fingerprint) {
      // A binding written earlier outranks a fresh derivation: that is what
      // keeps the id when the host adds or drops an attribute we key on.
      const aliased = aliases[fingerprint];
      if (aliased && !used.has(aliased)) base = aliased;
    }
    if (!base) base = deriveId(row.target, row.label);
    if (picked) picked.taken = true;
    row.id = uniqueId(base, used);
    row.fingerprint = fingerprint;
  });
  if (scope) rememberAliases(scope, rows, aliases);
  return rows;
}

function collectSidebar(ctx) {
  // The panel icon slot lives INSIDE the row button in every host so far, so
  // walking out from it is the only reliable way to find the panel list itself;
  // a generic "nav with buttons" scan can otherwise pick the workspace/session
  // nav and reorder user sessions along with panels. 0.2.2-rc.2 renamed the
  // rendered slot to `sidebar.panel.icon` and wrapped each button in a
  // `div.panelEntry`, while plugins still register into `sidebar.panellist`;
  // accept both outlet names and take the enclosing nav first.
  const outlet = document.querySelector('[data-slot="sidebar.panellist"], [data-slot="sidebar.panel.icon"]');
  let container = null;
  // How the container was found is part of the structure audit: the fallbacks
  // below widen the guess, and a guess that starts being used silently is the
  // first sign that the host moved the list.
  let via = "slot";
  if (outlet) {
    const nav = outlet.closest("nav");
    if (nav) {
      container = nav;
      via = "slot-nav";
    } else {
      const rowButton = outlet.closest("button");
      via = rowButton ? "slot-button-parent" : "slot-parent";
      container = (rowButton && rowButton.parentElement) || outlet.parentElement;
    }
  }
  if (!container) {
    container = document.querySelector('nav[class*="panelList"], [class*="panelList"]');
    via = "panellist-class";
  }
  if (!container) {
    // Last resort: score only DIRECT row-like children. Scoring descendants
    // would let a session list inside another nav outrank the panel list.
    const labels = new Set();
    for (const entry of readPanelEntries(ctx)) {
      const info = describeEntry(entry);
      if (info.label) labels.add(info.label);
    }
    const navs = Array.from(document.querySelectorAll("nav"));
    let best = null;
    let bestScore = 0;
    for (const nav of navs) {
      let score = 0;
      for (const child of elementChildren(nav)) {
        const button = child.matches("button") ? child : child.querySelector(':scope > button[aria-label]');
        if (!button || isMoreTrigger(button)) continue;
        const label = cleanLabel(button.getAttribute("aria-label"));
        if (!label) continue;
        if (labels.size === 0 || labels.has(label)) score += 1;
      }
      if (score > bestScore) {
        best = nav;
        bestScore = score;
      }
    }
    if (best) {
      container = best;
      via = "scored-nav";
    }
  }
  if (!container) return null;

  const rows = [];
  const seen = new Set();
  function collect(button, unit) {
    if (!button || !unit || seen.has(unit)) return;
    if (isMoreTrigger(button)) return;
    if (button.closest(".dso-ghost, .dso-config, [data-dso-more-key]")) return;
    const label = cleanLabel(button.getAttribute("aria-label"));
    if (!label) return;
    seen.add(unit);
    rows.push({ unit, target: button, label });
  }
  // Only one wrapper level is allowed (the host's Tooltip may or may not render
  // a wrapper). Never descend into the workspace/session tree.
  for (const child of elementChildren(container)) {
    if (child.matches("button")) collect(child, child);
    else {
      const button = child.querySelector(':scope > button[aria-label]');
      if (button) collect(button, child);
    }
  }

  let more = null;
  for (const child of elementChildren(container)) {
    if (isMoreTrigger(child)) {
      more = child;
      break;
    }
    const nested = child.querySelector(':scope > button[aria-haspopup="menu"]');
    if (nested && isMoreTrigger(nested)) {
      more = nested;
      break;
    }
  }
  return {
    scope: "sidebar",
    axis: "y",
    container,
    via,
    rows,
    more: more ? (more.parentElement !== container ? more.parentElement : more) : null,
    // Outline the real trigger button, never its Tooltip/flex wrapper: the
    // wrapper has square corners and makes the dashed ring look offset.
    moreTarget: more ? menuTriggerButton(more) : null,
  };
}

// One row-collection rule for both call shapes: a container (used by the
// settings nav) and an explicit unit list (used by the slot outlets). Keeping
// two copies let one of them drift whenever the rules changed.
function collectUnits(container, options) {
  return collectUnitsFromUnits(elementChildren(container), options);
}

function directContainer(outlet) {
  let container = outlet;
  try {
    if (window.getComputedStyle(outlet).display === "contents" && outlet.parentElement) {
      container = outlet.parentElement;
    }
  } catch (err) {
    /* ignore */
  }
  return container;
}

function collectOutlet(scope, selector, options) {
  const outlet = document.querySelector(selector);
  if (!outlet) return null;
  const container = directContainer(outlet);
  const outletUnits = elementChildren(outlet);
  let units = outletUnits.slice();
  // Some host slots wrap every registered entry in one inner box.  Flattening
  // that box is safe only when it really contains several clickable rows; a
  // lone button must stay a single row.
  let flattened = false;
  if (units.length === 1) {
    const sole = units[0];
    const nested = elementChildren(sole).filter((child) => clickableIn(child));
    if (nested.length > 1) {
      units = nested;
      flattened = true;
    }
  }
  const collected = collectUnitsFromUnits(units, options);
  // Anything that lives beside the slot outlet (the composer's ContextMeter,
  // for example) is host chrome, not a sortable row.  Keep those elements at
  // the end with style.order instead of tagging them as rows: tagging a host
  // control is what made the composer / right-sidebar geometry drift.
  const tails = container === outlet ? [] : elementChildren(container).filter((child) => child !== outlet);
  let more = collected.more;
  if (!more) {
    for (const child of tails) {
      if (isMoreTrigger(child)) {
        more = child;
        break;
      }
    }
  }
  // 0.7.0-pre shipped the header's "More" control as an ordinary row; 0.8 made
  // it host chrome so the split control the host mounts right before it could
  // not be torn apart. It is sortable again: the user asked for the "…" button
  // itself to be a column of the strip. The element keeps its second job as the
  // tuck target and menu anchor, which is what `moreTarget` still reports.
  let moreIsRow = false;
  if (options && options.fixedMore && more) {
    const target = clickableIn(more) || menuTriggerButton(more);
    if (target) {
      // `noMigrate` keeps this brand-new row out of the upgrade pairing in
      // migrateScopeIds(): otherwise a button that is simply not mounted yet
      // (a panel that initialised later) would lose its id to "More", and
      // applyFound() then clears that id's hidden flag, silently un-tucking it.
      collected.rows.push({ unit: more, target, label: labelOf(target) || labelOf(more), noMigrate: true });
      moreIsRow = true;
    }
  }
  return {
    scope,
    axis: options && options.axis ? options.axis : "x",
    container,
    via: (container === outlet ? "outlet" : "outlet-parent") + (flattened ? "+flatten" : ""),
    rows: collected.rows,
    tails: tails.filter((child) => child !== more),
    more,
    moreIsRow,
    moreTarget: more ? menuTriggerButton(more) : null,
  };
}

function collectUnitsFromUnits(units, options) {
  const opts = options || {};
  const rows = [];
  let more = null;
  for (const child of units) {
    if (!child || child.nodeType !== 1) continue;
    if (child.classList.contains("dso-ghost") || child.classList.contains("dso-indicator")) continue;
    if (child.closest && child.closest(".dso-config")) continue;
    if (isMoreTrigger(child)) {
      more = child;
      continue;
    }
    // A segmented control — one wrapper holding two or more buttons, such as
    // the header's "open in explorer / more open methods" split button — is a
    // single host widget, not a sortable item. Sorting one half away from the
    // other would tear the control apart, so the whole group stays untouched.
    if (opts.skipSplitControls && child.querySelectorAll('button, a, [role="tab"], [role="menuitem"]').length > 1) {
      continue;
    }
    const target = clickableIn(child);
    if (!target) continue;
    if (opts.tabsOnly && !target.matches('[role="tab"]') && !child.matches('[role="tab"]')) continue;
    rows.push({ unit: child, target, label: labelOf(target) });
  }
  return { rows, more };
}

function collectTabs() {
  const list = document.querySelector("[data-conversation-tabs]");
  if (!list) return null;
  let units = elementChildren(list).filter((child) => {
    const target = clickableIn(child);
    return !!target;
  });
  let via = "tabs-slot";
  if (!units.length) {
    units = Array.from(list.querySelectorAll('button, [role="tab"]'));
    via = "tabs-fallback-buttons";
  }
  const collected = collectUnitsFromUnits(units, { tabsOnly: true, axis: "x" });
  let more = null;
  const parent = list.parentElement;
  if (parent) {
    for (const child of elementChildren(parent)) {
      if (child === list) continue;
      if (isMoreTrigger(child)) {
        more = child;
        break;
      }
    }
  }
  if (!more) {
    const sibling = list.nextElementSibling;
    if (sibling && isMenuTrigger(sibling)) more = sibling;
  }
  return {
    scope: "tabs",
    axis: "x",
    container: list,
    via,
    rows: collected.rows,
    more,
    moreTarget: more ? menuTriggerButton(more) : null,
  };
}

function collectRight() {
  const container = document.querySelector("[data-sidebar-right-guide]");
  if (!container) return null;
  const rows = [];
  const tails = [];
  let more = null;
  const kindCounts = new Map();
  for (const child of elementChildren(container)) {
    if (child.classList.contains("dso-ghost")) continue;
    if (isMoreTrigger(child)) {
      more = child;
      continue;
    }
    const target = clickableIn(child);
    if (!target) continue;
    const kindNode = child.matches("[data-sidebar-right-guide-entry]")
      ? child
      : child.querySelector("[data-sidebar-right-guide-entry]");
    // Only the guide's own entry cells are rows.  Dynamic host/plugin chrome
    // may share the container; treating it as a row moves controls we do not
    // own and can desynchronise better-sidebar's right-hand layout. Keep it as
    // a tail instead: an unmarked sibling with the default order 0 would jump
    // above every ordered row.
    if (!kindNode) {
      tails.push(child);
      continue;
    }
    const kind = cleanLabel(kindNode.getAttribute("data-sidebar-right-guide-entry")) || "";
    const label = labelOf(target, kind);
    let id;
    if (kind) {
      const nth = (kindCounts.get(kind) || 0) + 1;
      kindCounts.set(kind, nth);
      id = nth === 1 ? kind : `${kind}-${nth}`;
    } else {
      id = deriveId(target, label);
    }
    rows.push({ unit: child, target, label, id: null, baseId: id });
  }
  const used = new Set();
  for (const row of rows) row.id = uniqueId(row.baseId || deriveId(row.target, row.label), used);
  return {
    scope: "right",
    axis: "y",
    container,
    via: "right-guide",
    rows,
    tails,
    more,
    moreTarget: more ? menuTriggerButton(more) : null,
  };
}

// The settings nav has no host-provided overflow control: a tucked row would
// otherwise be unreachable. Inject our own anchor at the end of the list and
// let the shared More machinery treat it like the host buttons. Reuse the same
// node on every discovery pass so the drag snapshot stays stable.
function settingsMoreAnchor(container) {
  let anchor = null;
  for (const child of elementChildren(container)) {
    if (child.classList.contains("dso-settings-more")) {
      anchor = child;
      break;
    }
  }
  const label = strings().more;
  if (anchor) {
    if (anchor.textContent !== label) anchor.textContent = label;
    if (anchor.getAttribute("aria-label") !== label) anchor.setAttribute("aria-label", label);
    return anchor;
  }
  anchor = document.createElement("button");
  anchor.type = "button";
  anchor.className = "dso-settings-more";
  anchor.setAttribute("aria-haspopup", "menu");
  anchor.setAttribute("aria-label", label);
  anchor.textContent = label;
  container.appendChild(anchor);
  return anchor;
}

function collectSettings() {
  const modal = document.querySelector('[data-shortcut-modal="settings"]');
  if (!modal) return null;
  const nav = modal.querySelector("nav");
  if (!nav) return null;
  let container = nav;
  let bestCount = 0;
  for (const child of elementChildren(nav)) {
    if (!child.matches("div")) continue;
    const count = child.querySelectorAll("button, a").length;
    if (count > bestCount) {
      bestCount = count;
      container = child;
    }
  }
  // Create the anchor before collecting: collectUnits then recognizes it as
  // `more` (aria-haspopup + the 更多 label) instead of treating it as a row.
  settingsMoreAnchor(container);
  // 0.2.2 turns the settings nav into a horizontal scroller on narrow browser
  // windows, while desktop keeps the vertical list. Read the rendered direction
  // instead of assuming the host's layout.
  let axis = "y";
  try {
    const style = window.getComputedStyle(container);
    const flexDirection = String(style.flexDirection || "");
    const gridFlow = String(style.gridAutoFlow || "");
    if (String(style.display || "").indexOf("flex") !== -1 && flexDirection.indexOf("row") === 0) {
      axis = "x";
    } else if (String(style.display || "").indexOf("grid") !== -1 && gridFlow.indexOf("column") !== -1) {
      axis = "x";
    }
  } catch (err) {
    /* keep the vertical default when styles are unavailable */
  }
  const collected = collectUnits(container, { axis });
  return {
    scope: "settings",
    axis,
    container,
    via: container === nav ? "settings-nav" : "settings-nav-child",
    rows: collected.rows,
    more: collected.more,
    moreTarget: collected.more ? menuTriggerButton(collected.more) : null,
  };
}

function discoverScope(ctx, scope) {
  let found = null;
  if (scope === "sidebar") found = collectSidebar(ctx);
  else if (scope === "footer") found = collectOutlet("footer", '[data-slot="sidebar.footer.action"]', { axis: "x" });
  else if (scope === "tabs") found = collectTabs();
  else if (scope === "composer") found = collectOutlet("composer", '[data-slot="conversation.composer.dock"]', { axis: "x" });
  else if (scope === "header")
    // This strip mixes three kinds of controls the user must not rearrange:
    // the shipped session-log "More actions" button is host chrome that keeps
    // the slot the host gave it (`fixedMore`), and segmented controls such as
    // "open in explorer / more open methods" are single host widgets
    // (`skipSplitControls`). Only the plain icon buttons become rows.
    found = collectOutlet("header", '[data-slot="conversation.session.header.utilities"]', {
      axis: "x",
      fixedMore: true,
      skipSplitControls: true,
    });
  else if (scope === "right") found = collectRight();
  else if (scope === "settings") found = collectSettings();
  if (!found) return null;

  if (scope !== "right") {
    const def = scopeDef(scope);
    const entries = def && def.slot ? readEntries(ctx, def.slot) : [];
    assignIds(found.rows, entries, scope);
  }
  for (const row of found.rows) {
    row.synthetic = false;
    // Our own settings entry must stay reachable, and so must better-sidebar's
    // section marker: hiding either one removes the only way back.  The marker
    // is additionally fixed in place (it is not ours to move); our own row is
    // freely draggable so the user can put it anywhere in the list.
    const foreignPinned = scope === "settings" && !!row.target.closest("[data-dsh-better-sidebar-settings-nav]");
    row.pinned = !!row.pinned || !!(scope === "settings" && (row.id === SETTINGS_ID || foreignPinned));
    row.fixed = !!(scope === "settings" && foreignPinned);
  }
  return found;
}
