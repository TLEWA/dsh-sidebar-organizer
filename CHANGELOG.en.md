# Changelog

## [Unreleased]

### English

- Fixed divider toggling after a reorder: the seam under the pointer used the row's child index, but a drag
  only changes the painted order and leaves the children where they were - a row dragged to the top could never
  get a divider and other rows toggled the wrong seam. Rows are now read back in paint order (their flex order)
  before the gap is derived.
- The conversation-body context menu is organizable too (DSH 0.2.2-rc.3 opens it through the
  host `contextMenus` service as `kind: "conversation"`, with dsh-sidebar-row-menu doing the
  opening): long-press to reorder, right-click a row to toggle the divider under it, drag to the
  bottom to tuck it into `··· More ›`, hover to expand and long-press an entry back onto the
  first level. Order, dividers and tucked rows are stored per menu, so the session and workspace
  menus never reshuffle each other.
- Recognition no longer guesses from labels: the plugin reads the `kind` of the host
  `contextMenus` target and falls back to the label path when that is unavailable. No
  dsh.sidebar-row-menu.* key is written and the menu row-menu draws itself keeps the old path.
- The blue insertion line no longer disappears entirely while dragging: when this frame has no
  measurable row boxes (the host mounts the surface before it paints the rows, or another plugin
  makes a row `display:contents`), the line falls back to the menu edge and the release still
  lands on the row under the pointer.
- Before the first tuck, the `··· More` target floats outside the menu box instead of growing it:
  a taller menu made the host re-place the whole surface through CSS anchor positioning, roughly
  300px away from the pointer. Once a row is tucked it becomes a real last row again. The floating
  strip copies the host surface material (background alpha raised to 0.94 so text underneath stays
  unreadable) and follows both themes.
- Fixes the top-right "···" popup: right-clicking no longer closes it (it used to be parked as an ordinary
  context menu whose intent never resolved), so right-clicking between two rows toggles the divider there;
  after a drag the host's own two dividers no longer stack on one another (rows take 2N, lines 2N-1, the host
  lines are hidden and ours paint the seams, stored as gap indexes); and the saved row order finally applies
  when the popup opens - the host tags its row id on the inner button, never on the row container, so the
  ordering pass silently found no rows.
- Adds `test/o13-context-target-kind.test.mjs` (target kind detection, other kinds and empty
  snapshots falling back to labels, a throwing accessor degrading safely) and
  `test/o14-context-more-anchor.test.mjs` (float switch, above/below decision, defaults for junk
  measurements).

## [0.11.2] - 2026-11-14

### English

- The session header's "More actions" button is draggable again: 0.2.2-rc.2 moved it
  out of the utilities slot and next to it, and the plugin treats it as one of the
  strip's columns again, so its position survives reloads. It is never tucked (the
  only way back to the shelf has to stay on the strip), and dragging More onto itself
  now reorders it instead of hiding it.
- Fix the wrong nesting when a row was dragged into "More actions": since 0.2.2 the
  right-click menu and the header sheet share one contextual-menu primitive, and
  submenus ("open with ...") are menus of their own, so the tucked rows could be
  injected into one. The shelf now only accepts the sheet its still-expanded trigger
  opened, skips submenu panes explicitly, and the right-click layout no longer
  rewrites the sheet's rows.
- Safer upgrades: on the first pass that discovers the header, "More actions" no
  longer takes over the saved layout record of a button that has not mounted yet
  (that button would otherwise lose its tucked slot and position once it appears).
- Adds `test/o12-header-more-row.test.mjs` covering More as a strip row (sibling,
  span-wrapped and rendered inside the slot), outlets without `fixedMore` still
  keeping More out of the rows, and the migration above never mispairing.

## [0.11.1] - 2026-11-12

### English

- Adapt to the DSH 0.2.2-rc.2 sidebar structure: each panel is now
  `nav > div.panelEntry > button` instead of a button directly under `nav`. The sidebar scope
  recognises both the `sidebar.panellist` and `sidebar.panel.icon` icon slot names and resolves
  the enclosing `nav` panel list as its ordering container first, restoring ordering, tucking
  and "More" on rc.2. rc.1 behaviour is unchanged, and saved slots for unpinned panels are
  retained. Ordering, drag, persistence, reset and re-pinning were verified on a temporary web
  host built from rc.2 source; the official rc.2 package is not released yet, so a regression
  with the installed package is still pending.

## [0.11.0] - 2026-11-11

- **A stopped sync no longer posts a leftover layout**: when the boot pull's "the host has no copy" result
  arrives after teardown, its continuation no longer arms a push timer (it used to POST the layout 350 ms
  after the plugin was disabled).
- **A stale host copy no longer overwrites a drag made while the pull was in flight**: if the local
  layout changed before the response arrived, that response is treated as local-newer and dropped,
  and the edit is published by this window's own push.
- **Teardown cancels in-flight sync**: after `disable()`, turning the switch off, or a hot reload, a late response no longer
  writes the layout or its backup, and the failure branch no longer re-arms the retry timer, so a
  disabled plugin cannot keep syncing in the background.
- The plugin index copy for `dsh-utf8-output` now says `GBK/CP936/GB18030`, matching the encodings
  it actually implements.

## 0.10.1 — 2026-11-11

- Adopt shared Codex PR review rules and repository-specific review guidance; preserve existing CI, human approval, and release behavior.

### English

- **System repairs no longer masquerade as user edits**: id migration, projection write-back and
  appended-order registration touch local storage only — they neither raise the sync timestamp nor
  push a stale layout over a newer edit from another window; only user actions and "reset" upload.
- **Cross-window sync keeps the v4 alias table**: the host no longer drops `aliases` when it reads or
  writes a layout, so a row renamed by the host still maps to its saved id after the layout is adopted.
- **The escape hatch really stops syncing**: `disable()` now stops cross-window pull/push immediately,
  and a reload while disabled no longer syncs either.
- **A corrupt host `layout.json` is no longer treated as "no layout yet"**: reads and writes first keep
  the file as `layout.json.corrupt-<timestamp>` and answer 5xx (`layout-corrupt`), so the next push
  cannot silently overwrite the only copy.
- **A corrupt local layout key is restored from its backup first**: when the primary key no longer
  parses, the `v3-backup` snapshot is loaded before falling back to a reset; unusable raw values are
  kept under `*.corrupt-<timestamp>` with a warning, and an empty write no longer replaces a backup
  that still holds a layout.
- **Concurrent host pushes are serialized by `updatedAt`**: simultaneous POSTs no longer all read
  the same old copy, so a later write with a smaller `updatedAt` is answered as `stale` and cannot
  overwrite a newer layout.
- **A row-menu divider no longer follows its row**: the separators on screen are frozen into gap
  indexes before the first arrangement (native ones hidden, plugin-drawn lines injected at their
  positions, the pane switched to a flex column; native separators nested inside a row's own wrapper
  are included too, since the whole pane is scanned instead of its direct children only), so a
  divider is a position rather than a property of a row; a gap past the last row is no longer painted
  either (the stored value is kept, so the divider returns with its rows). The injected line is our
  own `div.dsrm-sep`, not a clone of the host separator: the host's
  `separator + separator { display: none }` sibling rule hid the second of two adjacent clones, so
  the screen showed one line while the store held three.
- **The blue drop line is back in both menus**: the menu's glass layer (`_material`, spanning the
  whole surface) was counted as one more row in the seam test, so every seam looked occupied and the
  line never appeared; nodes covering the whole surface are now skipped by geometry, which restores
  the line in the host context menu and in row-menu's menus alike.
- **The blue drop line paints under the drag preview and shows through it**: line and preview have to
  share the highest z-index on the page (the row-menu surface itself is 2147483647, so lowering either
  one hides it behind the open menu), so the line is mounted first and the preview is appended last.
  The preview is a half-transparent pane (`backdrop-filter: blur(0.5px) saturate(1.15) brightness(0.78)`,
  50% fill), so a line under it reads as a dimmed, slightly softened blue bar instead of being cut off,
  while the dragged row still never has the line running across it. Glyph-only previews
  (`dso-ghost-flat`) stay fully transparent and unfiltered.
- **A divider the menu already had can be removed by right-clicking it — and the one you hit is the
  one that goes**: the hairline is 0.5px tall with 3px margins, so a right-click almost always lands
  on the pane padding, where the old code found no row and swallowed the event. Resolving the seam
  instead was still wrong: the host sometimes nests a separator **inside the following row's own
  wrapper**, so "on the line" read as "on that row", resolved the seam below it (gap + 1) and added a
  new line while the old one stayed. A line now always wins over a row: the nearest visible line
  within ±4px of the pointer is the target (an injected line reports its own gap index, a shipped one
  is resolved from the row middles measured at click time), and only a click away from every line
  falls back to the row/seam rules; the set of shipped separators is also recomputed from live
  geometry instead of the snapshot frozen when the menu opened, and a zero-height (hidden) line never
  takes the hit (same for the host context menu and row-menu's menus).

## 0.10.0 — 2026-11-08

### English

- **Row ids no longer come from label text**: an id prefers the element's own stable attributes
  (`data-panel` / `data-view` / `data-action` / `data-testid` …) and otherwise falls back to a
  canonical label fingerprint — the status segment after a colon is dropped and digits collapse to
  `n`. So when "IP guard: 0 black holes" becomes "IP guard: probing" or a session count moves from
  3 to 42, the saved order and tucked rows keep working.
- **Upgrades adopt the old layout**: ids that older builds derived from the raw label are handed to
  the new fingerprint ids once, at load time; every row keeps the slot it had, nothing is reshuffled,
  and you never have to drag anything again. If a row is later renamed, the alias table still hands
  it its old id back.
- **Storage format is v4**: each scope gains an alias table (`aliases`) and exports carry
  `stateVersion`; a v3 file exported by an older build still imports, with aliases re-derived from
  the imported order.
- **The drop line only trusts boxes the host paints**: it no longer cuts through controls the host
  renders but this plugin cannot move (the session header's segmented control, for example); over
  such a hole the line waits in the gap beside it, and releasing still lands where the line points.
- **The far end follows the hand**: dragging a row past the end of the strip keeps the indicator
  under the pointer all the way to the right, instead of pinning it to the inner edge of the last
  visible row.
- **Menu line**: one line serves the whole menu — always in the gap between two first-level rows,
  spanning the full width of the list — and pulling an entry out of "More actions" no longer draws
  it through a first-level row.
- **`display:contents` wrappers work**: the session header's slot outlet is exactly this shape; a
  wrapper with no box of its own now stands on its children for measuring, which keeps both the drop
  line and the audit accurate.
- **Diagnostics**: `audit()` reports per scope whether "the rows the plugin believes in" match "the
  controls the host actually paints" — listing boxes no row owns, rows the host no longer paints, and
  how the container was found — while `identity()` exposes the pure id rules, so both can be checked
  from the console. The same box model now drives drop targeting.
- **Build fix**: packaging used to substitute only `__BUILD__`, leaving the version constant as a
  literal in the bundle; `window.__DSO_BUILD__` now reports the real version plus build hash.
- **Quality**: assertions grew from 280 to 324, all passing (new cases cover the far-end sweep, holes
  the host paints, `display:contents` wrappers, the structure audit, and legacy-layout adoption and
  rename aliases).

## 0.9.7 — 2026-11-07

### English

- **Takes over row-menu's session context menu**: after you add or remove a divider, reorder a row, or
  pull an entry out of "More actions" onto the first level, this plugin saves the menu order; later
  changes to the header toolbar no longer reshuffle it behind your back. A menu you never touched
  still follows the header order as before.
- **Right-click to toggle a divider**: right-click any first-level row of row-menu's body menu to add
  or remove the divider underneath it (same gap rule as the host menu; the last row has no gap). Native
  separators are hidden while custom ones are painted, so the two sets never stack, and a right-click
  on empty space or on a divider is swallowed instead of falling through to the host menu.
- **Drag an entry out of "More actions"**: dragging a submenu entry onto the first level creates a row
  of the same name that runs the same host action; dragging it back into "More actions" undoes it.
- **One-click restore**: the settings page gains "Restore session menu only", which puts just the
  session context menu back on the header toolbar order (workspace menus are untouched); the adjacent
  "Reset all context menus" also clears order, dividers and tucked rows in the workspace menus.
- **Header strip drop targeting**: the indicator now follows visual order (the strip reorders with CSS
  `order`, so a DOM-order scan used to leave the line pinned in an earlier gap); dragging past either
  end of the strip still means "this end"; container geometry accepts an already-measured DOMRect
  (reading it as an element used to throw inside pointermove and swallow the whole update); the line no
  longer cuts through an icon; and the release inserts in front of the row the line pointed at, fixing
  "the preview moves but releasing does nothing" (hidden 0×0 slot rows shifted the index by one).
  A rejected drop now shakes instead of failing silently.
- **Diagnostics**: the page exposes `window.__DSO_BUILD__` (version plus build hash) so you can tell
  which build the host actually loaded.
- **Quality**: assertions grew from 264 to 280, all passing, and real pointer events verify a drag from
  the far left of the strip to the far right, including the final order.

## 0.9.6 — 2026-11-06

### English

- **A layout update can no longer be dropped for good**: when a scope found zero rows this round, the
  container and rows remembered from the previous round were kept, so after opening the settings page
  once every DOM mutation triggered a full pass; both "not found" and "found zero rows" now clear the
  record. The pass watchdog also retries after 400ms instead of giving up permanently.
- **Cancelled gestures no longer write the layout**: a system-cancelled touch (pointercancel) no longer
  takes the "release to commit" path, so it cannot tuck or reorder; a cancelled ghost animation
  (Esc, blur, plugin stop) no longer runs the commit callback either.
- **Disable and hot-reload cleanup**: a disabled plugin no longer keeps reacting to refresh / passes;
  `stop()` clears the tuck timer, resets the pass schedule and removes the buttons injected into the
  host menu; the cross-window visibilitychange / focus listeners now have a matching `stopHostSync()`.
- **Dragging a row to the end is no longer treated as corrupt data**: the one-shot 0.5.4 repair only
  runs for non-user writes, so it can no longer roll back the user's own ordering.
- **Settings page and context menus**: the "More" chip and the "customized" check ignore ids that no
  longer exist; a pending context-menu kind is consumed once and cannot leak across menus; rows measured
  at 0×0 no longer inflate the drop area to the whole viewport or get sorted to the front; the "More"
  rows injected into row-menu copy `aria-disabled`, so disabled entries are no longer clickable.
- **Interaction details**: pressing Esc while recording a drag hotkey cancels it (the inline settings
  page no longer swallows the keyboard); `Alt+↑/↓` moves one step per keypress; the settings list can
  drop at the very end, drag-over no longer flickers, and its index lookup is O(n) instead of O(n²);
  two open windows now share toggle state immediately.
- **Performance**: the DOM observer only syncs menus when the layout changed or a menu is open, instead
  of running three document-wide queries per mutation; scrolling while dragging is coalesced with rAF;
  row-menu panes are measured first and styled in one go; the host action list is cached instead of
  re-parsed on every pass.
- **Cleanup**: removed the always-true `reorderable` checks (and seven filters), the never-added
  `dso-pressing` class, unread fields, dead constants and an always-false branch; merged duplicated
  helpers (`collectUnits`, `headerHiddenRows`). The host half rejects oversized bodies by
  Content-Length and logs a warning for a corrupt layout file instead of silently overwriting it.

## 0.9.5 — 2026-11-06

### English

- **dsh-sidebar-row-menu integration**: rows in the plugin-drawn conversation-body context menu, plus
  rows in its "Open with" and "More actions" submenus, can now be reordered with a long-press drag.
  The "Open with" submenu that row-menu adds to the session / workspace context menus shares the same
  app order as the body menu. No dsh.sidebar-row-menu.* storage key is ever written.
- **The default order is untouched**: with no custom order, the first level still follows this plugin's
  session-header order (row-menu reads it one-way). Only an actual drag on a first-level row saves an
  order here; after that the menu keeps what the user arranged, and Reset restores the linkage.
- **"More actions" writes this plugin's header-menu order**: reordering inside row-menu's "More actions"
  submenu writes dsh.sidebar-organizer.host-menu-order.v1 (the same key row-menu's orderMoreItems reads),
  so the native session-header More popover follows too. The "Open with" order is stored separately in
  this plugin's row-menu-layout.v1. Row-menu's DOM and keyboard order are never moved; only the visual
  order changes.
- **The tucked "More" panel can be reordered from the inside**: the panel sits outside the menu, and the
  old hit test only knew the menu and anchor rectangles, so dragging inside it was a no-op. The panel now
  takes part in hit testing; its rows are reordered by the stored hidden order and written back. Page
  and streaming scrolls no longer close the panel (only scrolling the menu itself does).
- **z-index fix**: row-menu's menu layer is 2147483647 while the drag ghost was 2147483000, so the menu
  covered the ghost. The ghost now uses 2147483647; being appended to body later, it wins the tie and
  stays above the menu.
- 264 offline assertions (all green).

## 0.9.4 — 2026-11-06

### English

- **Long-pressing a submenu no longer drags its parent row**: the host renders a
  submenu (e.g. Open with) *inside* its row button — the panel is a sibling of the
  button — so a press there looked like a press on the row. The press is now matched by
  `role=menuitem` against the row's own button and handed back to the host; the row
  button itself (chevron included) still drags.
- **Tucked entries have their icons back**: only the first `<svg>` used to be cloned, so
  rows whose icon is an `<img>` (e.g. "Open with Visual Studio Code") were blank in the
  panel and some rows copied the chevron too. The whole
  `[data-slot="contextMenu.icon"]` block is copied now, keeping `img` and `svg` in a
  14×14 slot; rows without an icon get an equal-width placeholder so labels stay aligned.
- **Rows dragged back out of "More" are visible again**: `applyContextLayout` used the
  return value of `rememberContextElement` as the "original display", but that returns
  null for an already-remembered element, so the current `none` was written back as the
  original — the order returned, the box did not, and tucking the last item emptied
  "More". The remembered value is read from `state.contextStyled` now.
- **The submenu looks like dsh-sidebar-row-menu**: the panel uses the host menu
  material (`--dsw-menu-surface-fill` + `backdrop-filter`, radius 16, padding 4, no
  shadow); rows follow the host menu-item metrics (34px, 6px 8px, gap 6, 13px/20px),
  icon slot 14px, and the "More" anchor matches that row height.
- **A divider lands below the row the right-click hit**: gaps are interpreted in painted
  order, but `toggleContextDivider` computed the index from DOM order — once a menu had
  been dragged the two diverged and the divider slipped one row down. Gaps are resolved
  from `layout.order` (minus `hidden`) now; `commitContextReorder` anchors on the
  painted order too, so one drag can no longer wipe a custom sort; a trailing gap is
  pruned against the visible row count.
- 264 offline assertions (all green).

## 0.9.3 — 2026-11-06

### English

- **The opening slowdown is gone**: mirroring the open/close fade used to read
  `getComputedStyle` for every child of the menu, which forces a page-wide style recalc
  while the menu is still mounting — 1.7ms → 12.3ms per sync, felt as a slow right-click.
  The plugin now reads only `--dsh-menu-enter` / `--dsh-menu-dismiss` as published by the
  host: the mirror segment drops 10.7ms → 0.2ms and opening costs the same as with the
  plugin disabled. The mirror is driven by `data-menu-phase` (MutationObserver +
  `attributeFilter`, same frame as the host) instead of chasing `animationstart`.
- **The opening fade is back, without the flicker**: mirrors only touch nodes the host no
  longer animates (menu direct children are skipped), so the host's in-animation is never
  overridden and the "remove class → host restarts → class requested again" 260ms loop
  cannot form; ease-in 80ms out, ease-out 40ms in, matching the host's curves.
- **The "More" shrink feedback is restored**: 0.9.2 removed the anchor's `scale(0.94)` and
  breathing animation to stop the shaking — that deleted the effect instead of fixing it.
  Hit-testing now measures the unscaled wrapper and `markDropMore` is idempotent, so the
  scale flips once per gesture and hovering no longer pumps.
- 257 offline assertions (all green).

## 0.9.2 — 2026-11-06

### English

- **The whole menu fades out again**: 0.9.1 flattens the host's `_viewport_` / `_footer_`
  to `display: contents` for cross-block ordering — and those are exactly the blocks the
  host animates on close (`_dsh-context-menu-out`, opacity 1 → 0). A box-less element
  paints no opacity, so the rows vanished and only the backdrop faded. The plugin now
  listens for the host animation, copies its duration and easing, and replays the same
  fade on every row (plus dividers and `··· More`); the opening fade is mirrored too.
- **No more shaking when hovering "More"**: the shared highlight class carried
  `scale(0.94)`, so a pointer resting on the anchor's edge looped through
  hit → shrink → out of bounds → restore → hit. The anchor no longer scales and keeps a
  6px sticky margin once entered.
- 253 offline assertions (all green), two new ones for the replayed fade out / fade in.

## 0.9.1 — 2026-11-06

### English

- **"More" now sits at the very end of the menu**: 0.9.0 appended the anchor inside
  `_viewport_`, but the host keeps `Archive` in `_footer_` and plugin buttons on the
  portal root, so the anchor stayed wedged in the middle. It now lives on the menu
  root with `order = 9999`, so `··· More ›` is the last row no matter what follows.
- **The whole menu drags**: bottom actions such as `Archive` and buttons plugins add
  to the portal root (e.g. memory participation) can now be long-pressed and dragged
  like any other item — reordered, tucked into "More", and dragged back out. On first
  customization the plugin sets the host's `_viewport_` and `_footer_` inline
  `display` to `contents`, so every row becomes a direct child of the menu's flex
  container; without customization (or after a reset) the host's own values return.
- Injected dividers move to the menu root too; gap indices still count visible rows,
  with the same `order = 2g - 1` / `2i` interleaving.
- 251 offline assertions (all green), new ones covering dragging the footer action and
  the portal-level button, persisting a cross-block order, flattening the two host
  blocks, and restoring the layout on reset.

## 0.9.0 — 2026-11-06

### English

- **"More" tucking for context menus**: while a menu is open, drag an item toward the
  bottom of the list and a `··· More ›` row appears (only during a drag); release on it
  and the item leaves the menu and moves into its own submenu.
- **Submenu**: hovering (or clicking) `··· More ›` lists the tucked items, placed to the
  right of the menu when there is room, flipped to the left when that side is wider, and
  clamped vertically to the viewport. Clicking one of them clicks the original host menu
  item, with the icon and label laid out the way the host does it.
- **Drag back**: long-press a tucked item and drag it into the menu to insert it above a
  row, or onto the bottom to append it. Tucking is refused when only one visible item is
  left, so a menu can never collapse into nothing but "More".
- The tucked list is stored per menu (session / workspace) inside the existing record as
  a new `hidden` array; older saves get an empty one, and order and dividers stay
  untouched.
- Hit-testing uses the menu's **live geometry**, so a row appended by the host or another
  plugin after the menu opened no longer shifts the drop targets by a row.
- Offline assertions grew to 246 (all green) with 12 new ones: the anchor appears only
  while dragging, it never carries a row tag, dropping tucks, submenu contents and
  direction, click forwarding, and dragging back out.

## 0.8.4 — 2026-11-06

### English

- The bottom actions of a context menu can toggle dividers too: the footer row
  (`Archive`) and buttons plugins append straight to the portal root (e.g.
  `Memory participation`) now take part in the "gap below this action" numbering;
  only the very last action of the whole menu is a no-op. They still cannot be
  dragged and their slots are never persisted.
- A divider that belongs to the footer block renders in the footer's own vertical
  order, so it still lands between `Delete permanently` and `Archive`, or between
  `Archive` and the button below it.
- Offline assertions grew to 225 (all green), adding "the footer action owns the
  gap below it" and "the last action has nothing to divide"; the session-menu
  fixture gained a button appended to the portal root.

## 0.8.3 — 2026-11-06

### English

- Fixed "reset, delete one divider, refresh — the order is scrambled": the first
  customization saved the order from measured positions, but plugin rows (e.g. "Open with
  Visual Studio Code") mount a beat after the menu and measure `top: 0`, so they were
  written first and stuck there after a reload. The first customization now saves the
  **document order**; a bogus measurement can no longer be persisted. Rows without a
  layout (height 0) are also ignored when attributing the host's own separators.
- A menu that is still mounting no longer writes pruned dividers back (for the first
  500ms pruning affects only the current paint), so a late plugin row cannot delete a
  saved divider.
- `contextMenu.set()` repaints the open menu immediately, and the settings card's reset
  now also applies to a menu that is already open.
- Offline assertions grew to 224 (all green), including "a row measured at zero keeps its
  document slot in the saved order".

## 0.8.2 — 2026-11-06

### English

- Fixed divider add/remove and placement: when a menu was customized while open, the
  host's own separators were never hidden (`rememberContextElement` returns early for
  already-tracked nodes), so they stayed in the flex flow with `order: auto` and drifted
  to the top of the list — the reported "wrong position / cannot remove". The first
  customization now takes them over and hides them immediately.
- Fixed row-label drift: entries of a submenu panel (e.g. "Open with") stole the label of
  the row owning them, changing the content hash and destabilizing row ids. Each flex item
  now keeps only its outermost menuitem, and labels also match `.submenu-label`.
- Fixed "right-click immediately after the menu opens": rows were not all mounted yet, so
  materializing the baseline lost a row and the shipped grouping. That right-click is now
  parked and replayed on the next frame, after the menu is complete; right-clicks inside
  the menu no longer close it either.
- Dividers are still positional (they do not follow items) and one that lands below the
  last item is dropped and written back.
- Offline assertions grew to 223 (all green), including regressions for "customizing hides
  the host's own separators" and "a hidden submenu adds no rows and steals no label".

## 0.8.1 — 2026-11-06

### English

- New: session-row and workspace-row right-click menus can be organized (DSH 0.2.2+
  only; on 0.2.1 the feature turns itself off and its settings card is hidden).
  Open the menu and long-press an item to drag it into a new order; the menu stays
  open after the drop.
- While the menu is open, right-click a non-bottom item to toggle a divider below
  it (right-click again to remove). Dividers are stored by position, so they stay
  put when items move, and one that ends up below the last item is dropped. The
  right-click that toggles a divider neither closes the menu nor runs the item.
- The settings page gains a "Context menus" card below "Shared layout across
  windows": one switch plus a per-group reset. Session and workspace keep separate
  orders and dividers in `localStorage`
  (`dsh.sidebar-organizer.context-menu.v1`), outside cross-window layout sync and
  independent of the seven-scope layout.
- Works with third-party items such as dsh-session-menu: a wrapper carrying
  `role="separator"` around an icon row is no longer mistaken for a real divider,
  and `display:contents` component contributions are ordered through their actual
  flex child.
- New console handle `window.__dshSidebarOrganizer.contextMenu`
  (`supported / enabled / setEnabled / reset / read / set`), plus 22 offline
  assertions (221 PASS).

## 0.8.0 — 2026-11-06

### English

- New drag hotkey: unbound by default; bindings may include Ctrl/Alt/Shift/Win. While
  unbound, long-press dragging behaves exactly as before.
- Two independent gates: Hold requires the key to be held before a drag can start and
  aborts an in-flight drag when released; Toggle flips dragging on with one press and
  off with the next. Both can be enabled at once.
- The settings page gains a hotkey card below "Shared layout across windows": click,
  press the combination, click elsewhere to cancel, or Clear to unbind. Keys pressed
  while recording belong to the binding only — host shortcuts and drags stay inert.
  Both mode switches are disabled until a key is bound.
- The gate ignores bare keys typed into inputs/textareas (Ctrl/Alt/Meta chords still
  work) so ordinary typing cannot arm dragging.
- The hotkey and its modes live in this window's `localStorage` and are not part of
  cross-window layout sync or the exported config.

## 0.7.5 — 2026-11-05

### English

- Custom settings nav icon: on DSH 0.2.2+ the "布局整理" section registers a
  drag-panel glyph through the `settings.section.icon` slot (panel plus a
  three-dot handle, inheriting the text color in both themes). DSH 0.2.1 skips
  the registration and keeps the host's default icon.
- The version gate ignores prerelease tags (`0.2.2-rc.1` counts as 0.2.2); a
  failed slot registration only warns and leaves the settings page intact.

## 0.7.4 — 2026-11-05

### English

- DSH 0.2.2-rc.1 support: its shipped header More menu now starts with "Copy as
  Markdown", which shifted every positional `dso-host-N` id and could turn an
  adopted download/feedback shortcut into a different action. Shortcuts now use a
  content-stable id (`dso-host-h<8hex>`); opening the menu reconciles legacy ids by
  label + icon, then label, then a unique icon. Unmatched ids are left untouched
  instead of being redirected.
- 0.2.2 lays the settings nav out horizontally in short browser windows. The
  settings scope now reads the rendered `flex`/`grid` direction for its drag axis,
  so the insertion line, Alt+arrow keys, and snapshots agree.
- A fresh session whose header exposes only the shipped More button used to lose
  the header scope entirely (no sortable rows), so its menu items could not be
  adopted. The empty header now keeps the More anchor.
- Reset / reset-region now removes adopted header shortcuts and rediscovers the
  header rows, so stale buttons cannot be written back as local rows.
- `package.json` gains a top-level `engines.dsh`; the host's compatibility gate did
  not read the previous nested `dsh.engines.dsh`.
- The harness fixture models 0.2.2 and adds regressions for legacy id migration,
  later insertions, horizontal settings nav, and unified context menus; all
  assertions pass.

## 0.7.3 — 2026-11-04

### English

- Docs only: the README version blurb no longer hard-codes a version, the install
  example points at `v0.7.3`, and both roadmaps gain the 0.7.2 row while dropping the
  accessibility goal. No code changes.

## 0.7.2 — 2026-11-04

### English

- Fix: the order dragged in the desktop window was not visible in the Web UI opened in a
  browser (`http://127.0.0.1:<port>`) — each showed its own layout. The layout lived only
  in `window.localStorage`, and the desktop window (`dsh-app://app`) and the Web UI are
  different origins (the port changes on every restart), so the two stores never met.
- The layout is now also stored host-side at
  `$DSH_HOME/storages/dsh-sidebar-organizer/layout.json`: the desktop window and a Web UI
  on any port read and write the same copy; `localStorage` stays as a local cache for
  older hosts, static pages and offline use.
- Merging is last-write-wins by timestamp: a change is pushed 350 ms after the last edit and
  pulled when a window becomes visible or focused; an adopted layout is re-applied locally
  without echoing back an upload.
- A fresh window keeps its local order when the host has no copy yet (so an empty layout
  cannot wipe an existing one); only "reset to default" clears the host copy.
- Only windows that really rearranged something publish: the boot-time registration and the
  projection pass writeback stay local, so a default order can never overwrite an arranged
  one in another window; a pre-upgrade local layout that differs from the host registration
  order is treated as hand-made and takes over the host copy on first boot.
- New: a "Shared layout" switch at the top of the settings page. Turned off, every window
  keeps only its own local layout and stops reading or writing the host copy (the 0.7.1
  behaviour), so the desktop window and the Web UI can be arranged independently; turning
  it back on pulls the host copy immediately.

## 0.7.1 — 2026-11-04

### English

- Fix: reordering the shipped menu items ("Download session log" / "Feedback")
  inside "More actions" did not stick on release. Those rows are not part of the
  tucked list, so the commit went through the tucked-order path and always
  failed; they now have their own label-keyed order (the host reassigns internal
  ids every time the menu opens), persisted across menu reopen and reload and
  kept separate from tucked rows.
- Fix: finishing a reorder inside "More actions" closed the menu immediately.
  It now stays open for in-menu reordering and only closes when a row is dragged
  out of the menu or onto "More actions" to be tucked away.
- Fix: glyph-only rows (session-header icons and the like) dragged with a black
  rounded tile behind them. The flat ghost was selected only when the source
  background was fully transparent, but hovering an icon makes the host paint a
  translucent tint, so the check failed and the dark card surface came back. The
  decision now keys on whether the row has text, and icon-only rows always get a
  transparent, shadowless ghost.

## 0.7.0 — 2026-11-04

### English

- New "session header" scope: the icon strip at the top right of a conversation
  (reminder, bottom panel, context diagnostics, unstick, find, …) now supports
  long-press reordering, tucking into "More actions", and dragging back out.
- Host chrome inside the strip stays untouched: the "More actions" button itself
  is neither sortable nor tuckable and keeps its own place, and split controls
  such as "Open in file explorer / More ways to open" stay whole instead of
  being split into draggable rows.
- Tucked rows land in the shipped "More actions" menu (the one with "Download
  session log" and "Feedback"): they are injected as menu rows above the native
  items without adding a heading, stay in sync while the menu is open, activate
  the component when clicked, and return to their place when dragged out. That
  menu is hardcoded by an official plugin and exposes no slot, so the rows are
  injected as DOM and torn down with the menu.
- The shipped "Download session log" and "Feedback" items can be dragged onto
  the strip as icon buttons that perform the same action as the menu item; drop
  one back on "More actions" to take it away again.
- The scope has its own drag switch, region reset, and configuration
  import/export like every other scope; the v3 storage format is unchanged (old
  layouts simply gain the new scope), and the "Layout organizer" settings page
  lists it from 0.7.0 on.
- Fix: dragging a row out of the "More actions" menu left the host menu open;
  closing it now bypasses the post-drag click guard. Drag preview and drop
  position no longer disagree either: a saved order can list a row the host does
  not paint right now, and its slot used to shift every drop index.
- Fix the ghost's light frame: the session-header icon buttons get "no border,
  no padding, centered" from a wrapper selector that no longer matches once the
  clone sits on `<body>`, so the browser supplied its default `2px outset` button
  border. The clone now freezes the source row's resolved border, padding,
  display and alignment.

## Unreleased

### English

- Release automation: pushing a `v*` tag now makes GitHub Actions build the client
  bundle, verify that the committed `lib/` matches `src/`, pack the `.tgz`, attach it
  to the Release, and generate `SHA256SUMS` plus install instructions for DSH. A new
  CI workflow runs the same build and consistency checks on pushes and pull requests.

## 0.6.1 — 2026-11-04

### English

- Fix the square drag ghost when dragging a collected row out of the "More" menu:
  collected rows are a plain `.dso-menu-item` wrapper around the host's rounded
  menu button. The organizer used to freeze only the wrapper's own radius (0) as
  `border-radius: 0 !important` on the ghost. It now resolves the radius from the
  rounded row button inside the wrapper and falls back to the default only when
  no rounded element exists.

## 0.6.0 — 2026-11-02

### English

First stable release: promotes the six-scope organizer, settings page, and
configuration import/export validated in the 0.5.x previews, and includes the
cleanup fixes below. npm's `latest` tag moves from 0.4.3 straight to 0.6.0; the
0.5.x previews were published on GitHub only.

- Fix tucked conversation views leaking back into view when the pane gets narrow
  (for example after opening the right sidebar): the host folds views that no
  longer fit into the header "More" menu, so a tucked view reappeared there as an
  ordinary host row above "已收纳", while the tucked block itself disappeared
  (its tab was no longer in the DOM) and only "Reset layout" remained. Folded
  tucked views now stay listed under the tucked caption, the duplicate host rows
  are hidden, and clicking one still opens that view.
- Fix a custom sidebar order being lost after a reload while the same layout's
  tucked state survived: at startup the plugin discovers host rows in several
  passes. On the first pass it saw only some rows and pruned the rest from the
  saved order, writing that partial order back. The missing rows then mounted,
  looked brand new, and were inserted at their host positions, wiping out the
  custom order. Undiscovered rows now stay in the saved order, just like tucked
  rows.
- Add configuration import/export: the settings header exports the order, tucked
  rows, and drag switches of all six sections as a JSON file, and imports the
  same format as a full replacement. A version mismatch, a missing layout block,
  or broken JSON is rejected whole instead of half-applied, and the legacy
  trailing-row repair cannot rewrite the imported order.
- Fix a stray page scrollbar while dragging the conversation tabs: the host tab
  class sets `position: relative`, so the cloned ghost fell into normal flow at
  the bottom of the page and grew the document. The ghost is now pinned with
  `position: fixed !important` and no longer affects layout.
- Fix the tab insertion line sitting too low: the host tab reserves 9px at the
  bottom for the active underline, so centering on the padding box put the line
  below the labels. It now centers on the row's content box, aligned with the
  tab text.
- Fix a component in the right sidebar being activated when it is dropped onto
  "More": the drop runs a 180 ms absorb animation and the 500 ms click guard
  was only armed when that animation ended, while the browser dispatches the
  click immediately on pointerup, so the row that had just been dragged away
  received it. The guard is now armed synchronously in pointerup before the
  drop commits, so dropping onto "More" only tucks the row.
- Fix the "Layout organizer" entry in settings navigation being undraggable: it
  was pinned together with better-sidebar's settings entry. Our own entry can now
  be reordered, though it still cannot be tucked; better-sidebar's entry stays
  fully fixed so its own recovery path cannot be dragged away.
- When settings navigation has tucked rows, a "More" button now appears at the
  bottom of the list: it lists the tucked settings and opens the matching section
  on click, and accepts further drops. Tucking the first row still happens from
  the settings page.

## 0.5.7-preview.1 — 2026-11-02

### English

- Fix dragging a tucked item out of the "More" popup: the source row used to be
  set to `opacity: 0`, so the popup showed no placeholder at the original spot
  and only the ghost remained. It now stays in place at 35% opacity, matching
  sidebar rows; the popup keeps its layout and drop targets are unchanged.

## 0.5.6-preview.1 — 2026-11-02

### English

- Fix the right sidebar's start page being pushed down after installing the
  organizer: the host's `.guide::after` spacer (`flex: 0 10%`) is meant to sit
  last, but the `order` values written on our rows made it land between the
  compass and the first card, so the blank band grew with the pane height. A
  style rule now pins the spacer past every ordered row, restoring the original
  layout.

## 0.5.5-preview.1 — 2026-11-02

### English

First 0.5.x preview, published only as a GitHub pre-release (not on npm). It
includes every change from 0.5.0 through 0.5.5: the organizer covers six
locations, adds the "Layout organizer" settings page with per-section drag
switches, and fixes right-guide entry placement, horizontal tab insertion
lines, and the short-press scale. Details stay in the per-version entries below.

## 0.5.5 — 2026-11-02

### English

- Repair layouts already persisted by 0.5.4: a newly discovered right-guide entry
  that had been appended to the end is moved back to its host position once,
  while later deliberate moves are preserved.
- Horizontal tab drop lines now use the full visual list and land in the middle
  of the real gap, instead of clinging to the last remaining row's edge.
- Removed the pointerdown press scale, so a normal short click no longer shrinks
  the row; only an actual long-press drag enters the dragging state.

## 0.5.4 — 2026-11-02

### English

- While dragging a row in the "Hidden" menu, the source row is now invisible so
  the preview no longer overlaps and doubles its own label.
- Each section has its own "Drag" switch in Settings → Layout organizer (and the
  plugin detail page). Turning it off disables long-press and menu-row dragging
  in that section without changing its saved layout.
- A newly installed plugin's right-guide entry now keeps the host's insertion
  position instead of being appended below the whole list; dynamic right-guide
  chrome that this plugin does not own stays after the entry cards.
- Drag switches are stored separately from layout, so "Reset layout" never
  silently re-enables a section the user turned off.

## 0.5.3 — 2026-11-02

### English

- Restored the 0.4.x absorb animation: three-keyframe flight plus a one-shot
  receive pulse, and hide the source row only after the flight finishes.
- Hovering More arms only the dashed ring and breathing outline; the receive
  pulse no longer plays before release.
- The dashed ring is always applied to the real trigger button instead of a
  square-cornered Tooltip/flex wrapper.
- Horizontal insertion lines now sit in the middle of the gap between rows
  instead of hugging the next row's edge, so wide tab gaps no longer look
  offset.
- Cancel a drag when the window loses focus, preventing a stuck indicator.

## 0.5.2 — 2026-11-02

### English

- Region-scoped reset: each More menu now resets only its own region
  (sidebar / conversation / right sidebar) instead of all six scopes, and
  refreshes synchronously so tucked rows reappear immediately.
- Reset now also removes the legacy layout key, so an old flat layout cannot
  be migrated back on the next read.
- Footer/composer rows: only the actual overflow button counts as the More
  anchor. Menu-opening rows such as the settings gear or model picker are no
  longer mistaken for More, restoring dragging in those scopes.
- The composer scope collects only the slot outlet's own children; host chrome
  such as `ContextMeter` is pinned to the end without marks or drag handling,
  fixing the misalignment above the composer.
- The right scope accepts only guide cards carrying
  `[data-sidebar-right-guide-entry]`; dynamic chrome is ignored, and
  better-sidebar's settings entry is pinned so its recovery path stays intact.
- Harness now has 45 assertions covering region reset, composer tails, right
  chrome, better-sidebar pinning, and menu-trigger rows.

## 0.5.1 — 2026-11-02

### English

- Fixed drop indexing in all six scopes: the drag snapshot is sorted by on-screen
  visual order, not host DOM order, so drops land between the rows the user sees
  even after a custom order has been applied.
- Sanitized the drag ghost (host `style`, `aria-current`, `data-dso-*` marks) and
  positioned it from the dragged row's own rect, fixing misaligned/duplicated
  ghosts in the real DSH UI.
- The sidebar scope now anchors on the button containing
  `[data-slot="sidebar.panellist"]` and only collects direct child rows, so
  workspace/session navigation can never be tagged as draggable panels.
- The More tuck highlight is applied to the actual button, so its dashed outline
  follows the button's rounded corners; the drop hot zone still has zero padding.
- Harness coverage for visual-order drops, sidebar isolation, ghost sanitizing,
  and the visual-order regression.

## 0.5.0 — 2026-11-02

### English

- The organizer now covers six locations: left sidebar, sidebar footer,
  conversation tabs, composer dock, right sidebar "Start" page, and settings
  navigation. Each scope keeps its own order and tucked set; horizontal scopes
  show a vertical drop line and vertical scopes a horizontal one, sharing the
  same long-press and keyboard runtime.
- Each of the three More menus lists only its own tucked items: sidebar footer
  shares the left sidebar menu, tabs and composer share the conversation menu,
  and the right sidebar uses its own "More tools". Menu items are activated by
  the runtime locating the original button, not by host `onOpen` id semantics.
- New settings UI: DSH Settings → "Layout organizer", plus this plugin's detail
  page. Six location cards support native HTML5 drag, up/down, tuck/restore, and
  reset-section. The plugin's own settings entry is pinned.
- Storage is now v3 `{version:3, scopes:{…}}`; the old v2 flat layout and
  `dsh.modmenu.layout.v1` migrate into `sidebar`. Console `hide(id)` /
  `reveal(id)` keep their old `sidebar` semantics.
- Safety updated: organized slots remain read-only; the three More menus,
  settings page, and plugin-detail page each get one fixed registration; DOM
  `order`/`display`, rAF coalescing, the 90-per-3s watchdog, and `childList`-only
  observation remain.
- The offline harness now uses six-scope fixtures and covers v2→v3 migration,
  `resetScope()`, per-region menu lists, the pinned settings row, in-menu drag,
  and `dispose()` restoration.

## 0.4.3 — 2026-11-02

### English

- Fixed the armed-state feedback on the “More” anchor: previously only the glyph
  shrank while the label stayed put, which read as a broken dip. The whole button
  (icon and label) now scales together, matching the release animation; scaling is
  disabled under `prefers-reduced-motion`.

## 0.4.2 — 2026-11-02

### English

- Added the tuck-away animation on the “More” anchor: the button breathes, its
  glyph dips, and the carried ghost shrinks slightly while armed; on release the
  ghost flies into the anchor and fades, the row is tucked away, and the button
  plays a short “swallow” bounce. When only one row is visible the anchor shakes
  instead of silently refusing to hide it.
- Only `transform` / `opacity` animate (the flight uses WAAPI, the rest is CSS),
  the drag hot path gains no layout reads, and a single flight runs at a time so
  rapid drops cannot pile ghosts up.
- Honors `prefers-reduced-motion: reduce`: no breathing, bounce or shake, and the
  row is tucked away immediately.

## 0.4.1 — 2026-11-02

### English

- Fixed jittery ordering after repeated drags: the drop index is now computed
  from the visual order (`layout.order` plus inline `style.order`) and anchored
  to a row key instead of the DOM index, and a layout pass is forced when the
  long-press succeeds so the frozen geometry is current.
- Tightened the “More” drop zone: a row is tucked away only when the pointer is
  inside the anchor's own rectangle and below the last row, so dropping at the
  end of the list no longer hides it by mistake.

## 0.4.0 — 2026-11-02

### English

- Split sources into modules under `src/` and added `scripts/build.mjs`, which
  concatenates them into `lib/client.js` at build time (the DSH client loads
  plugins as classic scripts, so there is no runtime `import`).
- The version is injected from `package.json` during the build.
- Added `README.en.md`, `NOTICE.md`, `NOTICE.en.md`, and `CITATION.cff` with
  language switching, AI-usage/code-origin disclosure, trademark notes, and
  citation metadata.
- `package.json`: added repository/homepage/bugs/keywords, set `private: false`,
  added build/check scripts, preparing for npm publication.
- No behavioural changes; feature set is the same as 0.3.6.

## 0.3.6 — 2026-11-02

Historical release. See the Chinese changelog entry for details.

## 0.3.5 — 2026-11-02

Historical release. See the Chinese changelog entry for details.

## 0.3.4 — 2026-11-02

Historical release. See the Chinese changelog entry for details.

## 0.3.3 — 2026-11-02

Historical release. See the Chinese changelog entry for details.

## 0.3.2 — 2026-11-02

Historical release. See the Chinese changelog entry for details.

## 0.3.1 — 2026-11-02

Historical release. See the Chinese changelog entry for details.

## 0.3.0 — 2026-11-02

Historical release. See the Chinese changelog entry for details.

## 0.2.1 — 2026-11-02

Historical release. See the Chinese changelog entry for details.

## 0.2.0 — 2026-11-02

Historical release. See the Chinese changelog entry for details.

## 0.1.0 — 2026-11-02

Historical release. See the Chinese changelog entry for details.
