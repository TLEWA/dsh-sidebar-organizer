# dsh-sidebar-organizer

[简体中文](README.md) · **English**

Adds **custom ordering** and **tucking away** to seven strips of buttons/cards in
DSH (DeepSeek Harness): the left sidebar, sidebar footer, conversation tabs,
composer dock, session header, right sidebar, and settings navigation.

> Latest: the desktop window and the Web UI share one layout (the settings page can
> opt out); seven-scope ordering, tucking, and configuration import/export are all in,
> and since 0.8.1 you can also reorder the session / workspace right-click menus and
> add or remove their dividers (DSH 0.2.2+); 0.8.2 fixes divider toggling and drift
> while the menu stays open, and customizations surviving a reload; 0.8.3 keeps an order
> saved on first customization stable even when a plugin row mounts a beat late; 0.8.4 lets the menu footer and plugin-root buttons toggle dividers too; 0.9.0 tucks items
> into a `··· More ›` submenu at the bottom of the menu; 0.9.1 pins that row to the very
> end of the menu and lets the bottom action and plugin buttons drag and tuck too; 0.9.4 fixes a
> long-press on a submenu dragging its parent row, missing icons in tucked entries, rows turning
> invisible after being dragged back out of "More", and dividers landing one row low once the menu
> had been reordered; 0.9.5 adds drag ordering for dsh-sidebar-row-menu's conversation-body context
> menu and its "Open with" / "More actions" submenus, and fixes reordering inside the tucked "More"
> panel plus the drag ghost being covered by row-menu's menu; 0.9.6 is a stability and performance
> release that stops layout updates from being dropped for good, cancelled gestures from writing
> the layout, and timers/listeners from surviving a disable or reload, fixes several settings-page
> and context-menu mix-ups, and removes dead code; 0.9.7 takes over row-menu's session context
> menu (right-click to toggle a divider, pull "More actions" entries onto the first level) and fixes
> header-strip drop targeting; 0.10.0 decouples a row's identity from its label — live counts, status
> suffixes and renames no longer invalidate a saved order, older layouts are adopted automatically,
> the drop line only trusts boxes the host actually paints (it never cuts through a control the
> plugin cannot move and keeps following the hand at the far end), and `audit()` / `identity()`
> can be checked from the console. For the full
> version history and downloads see [Releases](https://github.com/TLEWA/dsh-sidebar-organizer/releases).

## What it does

| Location | Contents | Drag axis |
| --- | --- | --- |
| Left sidebar | plugins, marketplace, skills, scheduled tasks, … | vertical |
| Sidebar footer | feedback, settings, … | horizontal |
| Conversation tabs | chat, trajectory, … | horizontal |
| Composer dock | stats, context, activity, usage, … | horizontal |
| Session header | reminder, bottom panel, context diagnostics, find, … | horizontal |
| Right sidebar "Start" | files, browser, terminal, "More tools" | vertical |
| Settings navigation | account, general, models, plugins, … | vertical |

- **Long-press to reorder**: hold for ~0.26 s; the row/card lifts (a ghost
  follows the pointer plus a drop indicator) and you drag it into place.
  Horizontal scopes show a vertical line; vertical scopes show a horizontal one.
  The order applies immediately and is persisted.
- **Tuck into the matching "More" menu**: drop a row on that scope's More anchor
  and it leaves the strip, moving into the "Tucked away" group of that menu.
  The sidebar footer shares the left sidebar's More menu; tabs and the composer
  share the conversation More menu; the right sidebar uses its own "More tools".
  The session header tucks into the shipped "More actions" menu (the one with
  "Download session log" and "Feedback"), with tucked icons listed directly
  above its own items. That "..." button is host chrome: it is neither sortable
  nor tuckable, and the split control next to it ("file explorer / more ways to
  open") also stays whole.
  Settings navigation can only tuck its first row from the settings page; once a row
  is tucked, the plugin adds a "More" anchor at the bottom of the navigation that
  lists tucked entries (click one to open that section) and accepts more drops.
- **Pull back out of "More"**: open the menu, long-press a tucked item and drag
  it onto the strip. The source row is hidden while dragging, so the floating
  preview never overlaps a duplicate of its own label.
- **Reorder inside the menu**: long-press drag within the tucked group.
- **Turn shipped menu items into buttons**: in the session header, drag
  "Download session log" or "Feedback" out of the "More actions" menu onto the
  strip to get an icon button that performs the same action as the item. Drop
  it back on "More actions" to take it away.
- **Keyboard**: focus a row and press `Alt+↑` / `Alt+↓` (the same order
  movement applies in horizontal scopes).
- **Drag hotkey**: unbound by default. The "Drag hotkey" card records a key
  combination (Ctrl/Alt/Shift/Win supported), then you can enable Hold, Toggle,
  or both. Hold allows dragging only while the key is down and aborts an
  in-flight drag when released; Toggle turns dragging on and off with successive
  presses. The gate ignores bare keys typed into inputs/textareas, so ordinary
  typing never arms it; while unbound, or with both modes off, dragging behaves
  exactly as before.
- **Right-click menus** (DSH 0.2.2+): long-press an item in the session or
  workspace context menu to reorder it; while the menu is open, right-click a
  non-bottom item to add or remove a divider below it (right-click again to
  undo). Dividers are stored by position, so they stay put when items move, and
  one that ends up below the last item is dropped. Drag an item toward the bottom
  of the list and a `··· More ›` row appears; release there and it moves into that
  row's submenu (hover to open; clicking an entry clicks the original menu item).
  Long-press a tucked entry to drag it back anywhere in the menu. That row always
  comes last — below `Archive` and any button a plugin appends to the menu — and
  those bottom rows drag, reorder, and tuck like everything else. Tucking is
  refused once only one visible item is left. A dedicated "Context menus"
  switch lives on the settings page; on 0.2.1 the feature turns itself off and
  the card is not shown.
- **dsh-sidebar-row-menu integration** (optional, when that plugin is installed): rows in the
  plugin-drawn conversation-body context menu and in its "Open with" / "More actions" submenus can be
  reordered with a long-press drag. The "Open with" submenu that row-menu adds to the session /
  workspace context menus shares the body menu's app order. The first level keeps following this
  plugin's session-header order until you actually drag one of its rows; after that it keeps your
  arrangement. "More actions" writes this plugin's header-menu order (the native session-header More
  popover follows); "Open with" is stored separately. Reset restores the default linkage. Since
  0.9.7, once you edit this menu (toggle a divider, reorder a row, pull an entry out of "More
  actions"), this plugin owns its order outright and later header-toolbar changes no longer reshuffle
  it; right-clicking any first-level row toggles the divider underneath it, dragging a "More actions"
  entry onto the first level creates a clickable row of the same name (drag it back to undo), and
  "Restore session menu only" in the settings page returns it to the header order. No
  dsh.sidebar-row-menu.* storage key is ever written, and the "Context menus" switch still gates it.
  Dividers in that menu are stored by position too: opening it first freezes row-menu's own separators
  into gap indexes, so after that a dragged row no longer carries its divider along (the same rule the
  context menu applies when it is first edited).
- **Settings page**: DSH Settings → "Layout organizer", or this plugin's detail
  page. Seven location cards let you drag rows, move up/down, tuck/restore, and
  reset one section. Each card has its own "Drag" switch: turn it off and that
  section stops responding to long-press drags without changing its layout or
  tucked rows. The plugin's own settings entry can be reordered but not tucked;
  better-sidebar's settings entry is fully fixed and cannot be moved or tucked.
- **Import / export configuration**: "Export" in the settings header writes the
  order, tucked rows, and drag switches of all seven sections to a JSON file;
  "Import" reads the same format and replaces the whole configuration. A
  version mismatch or a broken file is rejected whole, never half-applied.
- **One layout across windows**: the desktop window and the Web UI opened in a
  browser (`http://127.0.0.1:<port>`) share the same order across restarts and
  port changes. The "Shared layout" switch at the top of the settings page turns
  it off, after which every window keeps only its own local layout.
- **Region-scoped reset**: "Reset default order" in each More menu resets only
  that region (left sidebar, conversation, or right sidebar) and immediately
  reveals its tucked rows. Resetting never changes the per-section drag
  switches.
- The layout survives page reloads and DSH restarts.
- While dragging, rows under the pointer do not react with `:hover` or tooltips
  (rows get `pointer-events: none`; hit-testing is pure geometry).
- **No** right-click menu of its own, floating launcher, search, or grouping: this
  version only reorders and divides the host's existing session / workspace
  context menus instead of adding a menu entry. The drag hotkey only gates
  dragging and is not a command shortcut.

## Install

### From a GitHub Release (recommended)

Open [Releases](https://github.com/TLEWA/dsh-sidebar-organizer/releases/latest) and copy
the `dsh-sidebar-organizer-<version>.tgz` link from the latest release, then paste it
into DSH's Plugins page → "Add plugin". You can also download the file and pick it
locally. Each release also ships `SHA256SUMS` for verification.

Every `v*` tag is built and attached to its Release by GitHub Actions.

Alternatively, paste the Git URL (it uses the already-built `lib/` in the repository,
so no local build is needed):

```
git+https://github.com/TLEWA/dsh-sidebar-organizer.git#v0.10.0
```

### From npm

```bash
dsh plugin install dsh-sidebar-organizer
```

Or search for `dsh-sidebar-organizer` in the DSH plugin manager.

### From source

This repository is itself a DSH plugin bundle. Clone it, then point the plugin
manager at the checkout:

```
plugin_manager  action: install_bundle  target: <absolute path to the checkout>
```

Refresh the Web UI (`Ctrl+R`) afterwards. When the profile links the checkout,
edit `src/` and run `npm run build`, then refresh — no reinstall needed.

> Versions up to 0.3.6 were called `dsh-modmenu`. The old layout key
> `dsh.modmenu.layout.v1` migrates automatically to
> `dsh.sidebar-organizer.layout.v1`, and `window.__dshModmenu` remains an alias
> of `window.__dshSidebarOrganizer`.

## Safety design

0.1.0 re-registered the whole panel column from inside the slot's own change
notification, creating a `register → notify → register` feedback loop that froze
the page. Since 0.2.0 the mechanism is different:

1. **Organized slots are read-only.** The plugin never registers or shadows an
   entry in `sidebar.panellist`, `sidebar.footer.action`, `conversation.view`,
   `conversation.composer.dock`, or `settings.section`; it only reads
   `entriesOfSlot` for ids and labels. The settings page is the one exception:
   the plugin registers its own "Layout organizer" section, and that row can be
   reordered but not tucked.
2. **Order/visibility is written as inline DOM styles.** Each row gets
   `style.order` (works for row and column containers); tucking uses
   `style.display:none` plus `data-dso-hidden`.
3. **Fixed, idempotent slot registrations.** One static row named
   `panel-organizer` in each of the three More menus, plus one settings page in
   `settings.section` and `plugins.detail.section`. All are registered once and
   never re-register or subscribe.
4. **Idempotent and rate-limited**: a pass only writes when a value actually
   changes, and passes are coalesced via `requestAnimationFrame`.
5. **Watchdog**: more than 90 passes in 3 s disables observers and listeners.
6. **`childList` only**: the plugin's own style/attribute writes cannot retrigger
   the observer.
7. **Escape hatches** (browser console):

   ```js
   window.__dshSidebarOrganizer.reset();                    // forget all layouts
   window.__dshSidebarOrganizer.resetScope("footer");       // reset one scope
   window.__dshSidebarOrganizer.hide("footer", "feedback"); // tuck manually
   window.__dshSidebarOrganizer.reveal("footer", "feedback");// restore manually
   window.__dshSidebarOrganizer.setDragEnabled("footer", false); // lock a section
   window.__dshSidebarOrganizer.disable();                  // persist a kill switch and stop
   window.__dshSidebarOrganizer.status();                   // inspect all seven scopes
   ```

   With a single argument, `hide(id)` / `reveal(id)` keep the old `sidebar`
   semantics. To undo `disable()`, run
   `localStorage.removeItem("dsh.sidebar-organizer.disabled")` and refresh.
8. If this plugin stops working entirely, all seven locations simply keep DSH's
   default order.

## How it works

- Scope definitions, row/card discovery, and id mapping live in
  `src/scopes.js`:
  - the left sidebar maps rendered `button[aria-label]` rows to
    `sidebar.panellist` projection labels;
  - sidebar footer and composer read the direct children of their `[data-slot]`
    outlet;
  - conversation tabs read direct tab children of `[data-conversation-tabs]` and
    detect the sibling More trigger;
  - the right sidebar reads direct cards inside `[data-sidebar-right-guide]`,
    using `data-sidebar-right-guide-entry` as the card kind;
  - settings navigation uses the button-dense container inside
    `[data-shortcut-modal="settings"] nav`.
- A missing container or empty row list only skips that scope; other scopes keep
  working.
- Persisted layout (v4):

  ```json
  {
    "version": 4,
    "scopes": {
      "sidebar": { "order": ["plugins", "…"], "hidden": ["tasks"] },
      "footer": { "order": ["feedback"], "hidden": [] }
    },
    "aliases": { "sidebar": { "ip-guard-n-black-holes": "ip-guard-0-black-holes" } }
  }
  ```

  A v4 id prefers the element's own stable attributes and otherwise falls back to a
  canonical label fingerprint (the status segment after a colon is dropped, digits
  collapse to `n`); `aliases` remembers "label fingerprint → the id this row was
  saved under", so a layout written by an older build is adopted in place at load
  and a row that changes its count, status or wording is still the same row.

  The v2 `{version:2, order, hidden}` shape and the older
  `dsh.modmenu.layout.v1` key migrate into the `sidebar` scope; other scopes
  register their DOM order on first use. A row inserted later by the host or a
  newly installed plugin keeps its current DOM neighbours instead of being
  appended below the whole list.
- Per-section drag switches live in a separate
  `dsh.sidebar-organizer.drag.v1` key (`{"sidebar": true, "footer": false, …}`),
  so layout resets do not change them.
- The exported file is a `{ format, version, exportedAt, scopes, aliases, drag }` snapshot.
  Import accepts `version` 4 (current) or 3 (older) with a `scopes` object, re-derives
  aliases for a v3 file, and normalizes it through the same path as local storage, and marks all seven scopes as already repaired so
  the legacy trailing-row fix cannot rewrite the imported order.
- Drag layer: document-capture `pointerdown` → 260 ms long-press timer (cancelled
  by >8 px movement) → ghost clone plus indicator; drop index from row midpoints
  along the scope axis; dropping inside that scope's More rect tucks the row;
  clicks within 500 ms of a drop are swallowed.
- Right-click menus (0.8.1, DSH 0.2.2+ only): the host renders the session and
  workspace menus as a shared `[role="menu"][data-context-menu]` whose main items
  live in `_viewport_`, with `Archive` in `_footer_` and plugin buttons added
  straight to the portal root. A document-capture listener remembers which row
  opened the menu; once it exists every item gets `style.order` (drag
  reordering) and positional dividers are injected between chosen gaps.
  Injected dividers carry inline `display:block` to beat the host's
  first-of-type / adjacent-separator rules, items are `order = 2i` and dividers
  `order = 2g - 1` so the two interleave without colliding, and a
  `MutationObserver` re-syncs after re-renders or a close. The layout lives in
  `dsh.sidebar-organizer.context-menu.v1` (`{ version, enabled, menus: { session,
  workspace } }`, each menu with its own `order` / `dividers` / `hidden` /
  `customized`) and is independent of the seven-scope layout, drag switches, and
  cross-window sync. Dividers store gap indices only, so they stay in place while
  items move and a trailing gap (`gap >= row count`) is pruned before it is
  written back.
- Cross-block ordering (0.9.1): the host keeps `Archive` in `_footer_` and plugin
  buttons on the portal root, so `style.order` alone cannot sort them against the
  main list. On first customization the plugin sets the inline `display` of
  `_viewport_` and `_footer_` to `contents` (remembered in `state.contextShell`), so
  every row becomes a direct child of the menu's flex container and shares one
  numbering; reset hands the host's own values back.
- Context-menu tucking (0.9.0): during a drag an anchor row is added to the
  **menu root** (`div[data-dso-ctx-more]` holding one `role=menuitem` button; it is
  kept out of `model.rows`, never gets `data-dso-ctx-id`, and takes `order = 9999`),
  so it always comes after `_viewport_`, `_footer_`, and plugin buttons — the very
  last row of the menu. Tucked ids live in `hidden`; their rows get
  `display:none`, visible rows are numbered by their visible index, so divider
  gaps still point at rows you can see. Dropping on the anchor tucks (refused
  when only one visible item is left); hovering it expands a body-level
  `div[data-dso-ctx-panel]` placed to the right of the menu (+6px), flipped left
  when the right side lacks room and the left is wider, clamped vertically; a
  click calls the original menu item's `click()`. Panel rows carry
  `data-dso-ctx-more-key` and long-press drags them back with the drag layer's
  `more` source, writing the order and removing the id from `hidden`. Hit-testing
  uses the menu's live rect, never a frozen snapshot.
- dsh-sidebar-row-menu integration (0.9.5): row-menu draws its own menus without the host's
  `[data-context-menu]`, so it gets a separate pane adapter: the first level is
  `.dsrm-menu-surface`, submenus are `.dsrm-submenu` (including the "Open with" panes under
  `.dsrm-submenu-host` in the session / workspace menus). The pane is `display: block`, so
  `style.order` only works after adding a flex column (`.dso-rm-pane`); rows are numbered `2i` and
  their adjacent native separators `2i-1`, while the material layer is absolutely positioned and
  stays out of the flex flow. The first level is stored in this plugin's `row-menu-layout.v1` and is
  left completely alone until customized; "More actions" writes this plugin's `host-menu-order.v1`
  (the key row-menu's `orderMoreItems` reads); "Open with" lives in the `openwith` pane of
  `row-menu-layout.v1`. Only visual order changes — row-menu's React nodes are never moved.
- Dividers and the drop line inside those menus (fixed in 0.10.1): row-menu renders a separator as a
  sibling in front of the row it groups, and only rows are ordered, so a dragged row used to carry its
  divider along. The fix mirrors the host context menu: before the first arrangement, the separators
  that are on screen right then are frozen into gap indexes (native separators hidden, clones injected
  at `2g-1`, and the pane gains the `.dso-rm-pane` flex column), so afterwards a divider is a position
  and not a property of a row. A gap past the last row is no longer painted (the stored value is kept,
  so the divider returns with its rows). The drop line only trusts boxes the host really paints: the
  menu's glass layer (`_material`, spanning the whole menu) used to be counted as one more row in the
  seam test, so every seam looked occupied and the blue line never appeared — nodes covering the whole
  surface are now excluded by geometry (a node as large as a multi-row menu cannot be one of its rows).
- Context-menu details (0.9.4): the host renders a submenu inside its row button (the panel is a
  sibling of the button), so a press is first matched with `role=menuitem` against the row's own
  button and anything inside the submenu is handed back to the host; the popup clones the whole
  `[data-slot="contextMenu.icon"]` block (`img` and `svg` alike, 14×14, an equal-width
  placeholder when a row has none); popup and rows reuse the host menu material
  (`--dsw-menu-surface-fill` + `backdrop-filter`, radius 16, padding 4, rows at 34px /
  6px 8px / gap 6 / 13px 20px), matching dsh-sidebar-row-menu. Dragging a row back out reads its
  original `display` from `state.contextStyled`, never from the return value of
  `rememberContextElement` (null for an already-remembered element, which used to write the
  current `none` back). Divider gaps and the reorder baseline are both resolved from
  `layout.order` (minus `hidden`) — i.e. visible indices in painted order; DOM order diverges
  after any drag and put the divider one row low.
- The price of flattening, and its fix (0.9.2 / 0.9.3): a `display: contents`
  element generates no box, so the open/close animations the host hangs on
  `_viewport_` / `_footer_` (pure opacity) paint nothing. The host publishes
  `--dsh-menu-enter: 40ms` / `--dsh-menu-dismiss: 80ms` on the menu surface,
  flips `data-menu-phase` (enter / dismiss / replace), and animates only the
  surface's **direct children**. The plugin watches that same attribute with a
  MutationObserver (`attributeFilter`), and in the frame the phase flips copies
  the published duration to `--dso-ctx-out-duration` / `--dso-ctx-in-duration`,
  tagging the flattened rows / dividers / anchor / panel with
  `dso-ctx-mirror-out` / `dso-ctx-mirror-in` to run equivalent opacity keyframes
  (host-matching curves: ease-in out, ease-out in). Children the host still
  animates are skipped, so its in-animation is never overridden and the
  "class removed → host animation restarts → class re-requested" 260ms flicker
  loop cannot form. Nothing reads `getComputedStyle`: reading computed styles
  for every child of a just-mounted menu forces a page-wide recalc, measured at
  1.7ms → 12.3ms per sync (0.9.3 reads the CSS variables instead: 1.7ms total,
  mirror segment 10.7ms → 0.2ms).
- The settings page uses native HTML5 drag and drop (`draggable` plus
  `dragstart/dragover/drop`) and adds no interaction library. Buttons only move
  up/down, tuck, or restore, so they cannot conflict with the long-press gesture.

## Repository layout

```
src/                 sources (concatenated in dependency order at build time)
  constants.js       constants, strings, shared handles
  styles.js          injected styles (drag + settings page)
  storage.js         localStorage persistence and v2/v3→v4 migration
  icons.js           SVG serialization and id prefixing
  slot.js            read-only slot projection access
  scopes.js          seven-scope discovery, id mapping, axes
  runtime.js         DOM runtime: ordering, tucking, gestures, menu data
  menu.js            tucked rows for the three More menus
  settings.js        settings page / plugin-detail body
  plugin.js          plugin entry apply()
scripts/build.mjs    assembles src/ into lib/client.js
lib/client.js        generated client half (what DSH loads)
lib/index.js         host half (placeholder)
cordis.patch.yml     bundle patch applied on install
test/harness.html    offline harness: fake seven-scope DOM + slot projection
```

DSH loads client plugins as classic scripts via
`window.__ModuleLoader__.load({ id, factory })`, not as ES modules, so there is
no runtime `import` — hence module sources plus build-time concatenation.

## Development

```bash
npm run build   # src/ → lib/client.js
npm run check
```

Open `test/harness.html` in a browser for the self-checking regression run
(seven-scope discovery, ordering, persistence, v2→v3→v4 migration and legacy-id
adoption, `resetScope()`, tuck/restore, per-region menu lists, pinned settings row,
in-menu drag, DOM churn during drag, structure audit, config export/import with
version rejection, and `dispose()` restoration).

## Compatibility

- DSH `>= 0.2.1-rc.3` (developed against `0.2.1-rc.5` and checked against the
  `0.2.2-rc.1` component sources and a 0.2.2-shaped harness).
- 0.2.2 inserted "Copy as Markdown" above download in the session header's shipped
  More menu. Pulled-out download/feedback shortcuts now identify actions by label
  and icon instead of menu position, so the shortcut follows its action when the
  host inserts a row and legacy positional ids migrate automatically.
- 0.2.2 lays the settings nav out horizontally in short browser windows; the
  drag axis follows the rendered direction.
- Session / workspace context-menu ordering and dividers exist only on 0.2.2+
  (0.2.2 is where the host routes those menus through the shared contextual
  menu); on 0.2.1 the feature turns itself off and its settings card is hidden.
- The client only requires `react`; `MenuItemButton` from
  `@deepseek-ai/dsh-client-ui-primitives` is used when present, with a built-in
  fallback otherwise.
- If a slot or attribute selector is missing, that scope degrades to empty and
  DSH startup is unaffected.

## Roadmap

- [x] 0.2.0 — read-only + inline DOM `order` MVP
- [x] 0.3.0 — More-menu tucking, keyboard ordering, hover suppression while dragging
- [x] 0.4.0 — modular sources and build script, bilingual docs, AI/code-origin notices
- [x] 0.4.3 — armed-state feedback scales the whole button
- [x] 0.5.0 — six draggable/tuckable scopes; settings page and plugin-detail page; v3 storage and migration
- [x] 0.5.1 — visual-order drop indexing, sanitized drag ghost, rounded More highlight
- [x] 0.5.2 — region-scoped reset with tucked-row reveal, footer/composer row detection, host-chrome isolation, better-sidebar pinning
- [x] 0.5.3 — 0.4.x absorb animation, rounded More ring, centered horizontal insertion line
- [x] 0.5.4 — hidden menu source while dragging, per-section drag switches, right-guide insertion order
- [x] 0.5.5 — repair already-persisted trailing right-guide entries, center the horizontal drop line, remove the short-press scale
- [x] 0.5.6 — no blank band between the guide compass and the first card (the host's `::after` spacer was sorted ahead of the ordered rows)
- [x] 0.5.7 — folded tucked views no longer leak into More, draggable settings entry with a More menu, no phantom click after dropping onto More
- [x] 0.6.0 — first stable release: six-scope organizer, settings page, config import/export, custom order survives reload
- [x] 0.6.1 — collected rows keep their rounded drag ghost
- [x] 0.7.0 — session header strip: icon ordering, tucking into the shipped "More actions" menu, and dragging back out
- [x] 0.7.1 — fix in-menu reordering inside "More actions", keep the menu open after a reorder, and drop the black tile behind glyph-only ghosts
- [x] 0.7.2 — layout stored host-side: the desktop window and the Web UI on any port share one order; the settings page can turn the sharing off
- [x] 0.7.3 — docs only: install example and roadmap refresh
- [x] 0.7.4 — DSH 0.2.2-rc.1 support: content-stable ids for shipped header actions with automatic migration; settings drag axis follows a horizontal nav
- [x] 0.7.5 — custom drag-panel icon for the settings nav (DSH 0.2.2+, falls back to the host default on older releases)
- [x] 0.8.0 — drag hotkey: unbound by default, with independent Hold and Toggle gates
- [x] 0.8.1 — session / workspace context menus: drag to reorder, right-click to toggle dividers (DSH 0.2.2+, auto-off on 0.2.1)
- [x] 0.8.2 — fixed divider add/remove and drift while the menu stays open, row labels stolen by submenus, and customizations not persisting after a reload
- [x] 0.8.3 — first customization saves document order (a plugin row measured at 0px can no longer corrupt it), and pruning waits for the menu to finish mounting
- [x] 0.8.4 — the menu footer and plugin-root buttons take part in divider gap numbering (only the last action is a no-op)
- [x] 0.9.0 — right-click menu tucking: drop at the bottom to move an item into a `··· More ›` submenu, long-press to drag it back
- [x] 0.9.1 — "More" is pinned to the very end of the menu, and the footer action / plugin-root buttons drag and tuck like any other row
- [x] 0.9.2 — the closing fade is back (replayed on the rows after flattening), and hovering "More" while dragging no longer shakes
- [x] 0.9.3 — opening a menu no longer forces a style recalc (the mirror reads the host's CSS variables and follows `data-menu-phase`), the opening fade returns without flicker, and the "More" shrink feedback is back
- [x] 0.9.4 — a long-press on a submenu no longer drags its parent row, tucked entries keep their icons, rows stay visible after being dragged back out of "More", the popup matches dsh-sidebar-row-menu, and dividers land in painted order
- [x] 0.9.5 — dsh-sidebar-row-menu integration (conversation-body menu first level and its Open with / More actions submenus); fixes reordering inside the tucked "More" panel and the drag ghost's z-index
- [x] 0.9.6 — stability and performance: layout updates are no longer dropped for good, cancelled gestures no longer write the layout, disabling cleans up timers and listeners; settings-page drag-drop and cross-window toggles fixed, dead code removed
- [x] 0.9.7 — takes over row-menu's session context menu (right-click a row to toggle its divider, pull "More actions" entries onto the first level, the first edit makes this plugin own the order) with a "Restore session menu only" button; fixes header-strip drop targeting
- [x] 0.10.0 — row ids decoupled from label text (stable attributes first, canonical label fingerprints otherwise; counts, status changes and renames no longer invalidate a layout, older layouts are adopted at load, storage moves to v4 with an alias table); the drop line only trusts boxes the host actually paints (it goes around controls the plugin cannot move and follows the hand at the far end); `audit()` / `identity()` diagnostics; build fix for the unsubstituted version constant

## Other DSH projects I work on

Reordering panels is only one corner of DSH. These are the other plugins I maintain — take what fits.

- **[dsh-sidebar-row-menu](https://github.com/TLEWA/dsh-sidebar-row-menu)** — right-click menus for sidebar rows: workspace rows, session rows and the conversation body each get their own, including "Open with" and "More actions" submenus; this plugin can reorder those menus and their dividers.
- **[dsh-better-choice](https://github.com/TLEWA/dsh-better-choice)** — an `ask_user_question` enhancement: right-click an option to add a note, or ask the model a side question with the same context before choosing.
- **[dsh-if](https://github.com/TLEWA/dsh-if)** — the `/if` command: let the model judge a condition from prior context, then send the instruction below it as a user message only when it holds.
- **[dsh-utf8-output](https://github.com/TLEWA/dsh-utf8-output)** — fixes GBK/CP936/CP932 mojibake from DSH subprocess output on Windows.
- **[dsh-opencode-go-router](https://github.com/TLEWA/dsh-opencode-go-router)** — rotates OpenCode Go routing after a context fold or a system-prompt rewrite, so less of the prompt cache is lost.
- **[dsh-fastload](https://github.com/TLEWA/dsh-fastload)** — trims the first history page of long sessions while preserving the tail the user actually sees.
- **[dsh-ptc-noargs](https://github.com/TLEWA/dsh-ptc-noargs)** — fixes rejected argument-less tool calls in PTC `run_code` by normalizing an omitted or `undefined` first argument to `{}`.

## Notices

- Third-party code and trademarks: [NOTICE.en.md](NOTICE.en.md)
- AI assistance and code origin: the "AI usage and code origin" section of
  [NOTICE.en.md](NOTICE.en.md)
- Citation metadata: [CITATION.cff](CITATION.cff)

## License

[MIT](LICENSE)

## Codex PR review

This repository adopts the v1 shared review block in AGENTS.md from [central CI](https://github.com/TLEWA/dsh-plugin-ci). Cloud Codex reviews PRs and new commits; maintainers retain final approval and merging. Review results must cover the latest commit. Review consumes subscription usage; use `@codex review` for missing results.
