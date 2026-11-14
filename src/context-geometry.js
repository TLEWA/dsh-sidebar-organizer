/* Geometry rules for the contextual menus.

   These live outside runtime.js so they can be unit-tested without a browser:
   they read only the nodes and rects they are given. The bundle concatenates
   modules in build order, so runtime.js still sees them as plain functions. */

// Pick the line a pointer aimed at from measured candidates ({gap, y}), the
// nearest one inside `tolerance` pixels, or 0 when the pointer is not on any
// line. Pass Infinity when the event target already is a separator: a hairline
// nested inside its row's wrapper is still a line, and it must win over the row
// around it. Pure so both menus share the rule and it can be unit-tested.
function nearestLineGap(candidates, y, tolerance) {
  if (!Array.isArray(candidates) || !Number.isFinite(y)) return 0;
  const limit = Number.isFinite(tolerance) ? tolerance : 4;
  let best = 0;
  let bestDistance = Infinity;
  for (const candidate of candidates) {
    if (!candidate) continue;
    const gap = Number(candidate.gap);
    const lineY = Number(candidate.y);
    if (!Number.isFinite(gap) || gap <= 0 || !Number.isFinite(lineY)) continue;
    const distance = Math.abs(lineY - y);
    if (distance > limit || distance >= bestDistance) continue;
    best = gap;
    bestDistance = distance;
  }
  return best;
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

// The gap a line drawn at `middle` divides: every row whose middle sits above
// the line is above it. Same rule the model uses to freeze the host's own
// separators, so a line's gap and the stored divider number always agree.
function dividerGapOfMiddle(rects, middle) {
  if (!Number.isFinite(middle)) return 0;
  let gap = 0;
  for (const rect of rects) {
    if (rect && rect.height > 0 && rect.top + rect.height / 2 < middle) gap += 1;
  }
  return gap;
}

// Pointing AT a line is the least ambiguous gesture a menu offers, so it must
// toggle exactly that line and never the seam next to it. The row rects are
// passed in measured at click time: the model's snapshot is taken when the menu
// opens (often mid-animation) and goes stale as soon as a divider is painted,
// because painting one moves every row below it. Resolving the seam from that
// snapshot is what made a right-click ADD a line next to the old one.
//
// `tolerance` is how far from the line's middle still counts as "on the line";
// pass Infinity when the event target already is a separator. The nearest line
// within tolerance wins, so overlapping candidates cannot flip the answer.
// A menu opened through the host's contextMenus service names its target kind in
// the service (`{ kind: "session" }`, `{ kind: "conversation" }`, ...); the DOM
// carries no marker. The service exposes that target as a snapshot store, and
// the accessor has changed once already, so read whichever of getSnapshot/get/
// snapshot exists before falling back to a plain `value`. Pure over the given
// service object, which keeps this rule unit-testable without a host.
function contextMenuTargetKind(service) {
  if (!service) return "";
  try {
    const active = service.active;
    if (!active) return "";
    let target = null;
    let read = false;
    for (const name of ["getSnapshot", "get", "snapshot"]) {
      if (typeof active[name] !== "function") continue;
      target = active[name]();
      read = true;
      break;
    }
    if (!read) target = active.value === undefined ? null : active.value;
    return target && target.kind === "conversation" ? "conversation" : "";
  } catch (error) {
    console.warn("[dsh-sidebar-organizer] context target read failed:", error);
    return "";
  }
}

function contextDividerLineGap(menu, rects, y, tolerance) {
  if (!menu || !menu.isConnected || !Number.isFinite(y) || !rects || !rects.length) return 0;
  let best = 0;
  let bestDistance = Number.isFinite(tolerance) ? tolerance : 4;
  for (const node of menu.querySelectorAll('[role="separator"]')) {
    if (!isContextSeparator(node)) continue;
    if (getComputedStyle(node).display === "none") continue;
    const rect = node.getBoundingClientRect();
    if (!rect.width && !rect.height) continue;
    const middle = rect.top + rect.height / 2;
    const distance = Math.abs(middle - y);
    if (distance > bestDistance) continue;
    const gap = node.hasAttribute("data-dso-ctx-divider")
      ? Number(node.dataset.dsoCtxGap)
      : dividerGapOfMiddle(rects, middle);
    if (!Number.isFinite(gap) || gap <= 0 || gap >= rects.length) continue;
    best = gap;
    bestDistance = distance;
  }
  return best;
}
// A right-click menu has no host-owned More row. Before the menu has tucked
// anything, the anchor a drag needs is laid out OUTSIDE the menu box: growing
// the surface mid-drag made the host re-place the whole menu (CSS anchor
// positioning flipped it ~300px up, away from the pointer). Once a row is
// tucked the anchor becomes a real row inside the frame again, so the strip
// never lingers in menus nobody customized.
function contextMoreAnchorFloats(tuckedCount) {
  return !(Number(tuckedCount) > 0);
}

// Which side of the menu the out-of-flow anchor takes. Below reads as "the rest
// of the list", so it wins whenever a full anchor plus its gap fits under the
// menu; it only flips above when the menu is close enough to the bottom edge to
// leave no room, and the space above can actually hold it. An unmeasurable menu
// keeps the default instead of guessing.
function contextMoreAnchorSide(options) {
  const menuTop = options ? Number(options.menuTop) : NaN;
  const menuBottom = options ? Number(options.menuBottom) : NaN;
  const viewportHeight = options ? Number(options.viewportHeight) : NaN;
  const rawHeight = options ? Number(options.height) : NaN;
  const rawMargin = options ? Number(options.margin) : NaN;
  const height = Number.isFinite(rawHeight) && rawHeight > 0 ? rawHeight : 34;
  const margin = Number.isFinite(rawMargin) && rawMargin >= 0 ? rawMargin : 8;
  if (!Number.isFinite(menuTop) || !Number.isFinite(menuBottom) || !Number.isFinite(viewportHeight)) return "below";
  const needed = height + margin;
  if (viewportHeight - menuBottom >= needed) return "below";
  if (menuTop > needed) return "above";
  return "below";
}
