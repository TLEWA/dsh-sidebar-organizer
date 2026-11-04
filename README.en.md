# dsh-sidebar-organizer

[简体中文](README.md) · **English**

Adds **custom ordering** and **tucking away** to seven strips of buttons/cards in
DSH (DeepSeek Harness): the left sidebar, sidebar footer, conversation tabs,
composer dock, session header, right sidebar, and settings navigation.

> Latest: the desktop window and the Web UI share one layout (the settings page can
> opt out); seven-scope ordering, tucking, and configuration import/export are all in.
> For the full version history and downloads see
> [Releases](https://github.com/TLEWA/dsh-sidebar-organizer/releases).

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
- **No** right-click menu, floating launcher, shortcuts, search, or grouping —
  those are out of scope for this version.

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
git+https://github.com/TLEWA/dsh-sidebar-organizer.git#v0.7.5
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
- Persisted layout (v3):

  ```json
  {
    "version": 3,
    "scopes": {
      "sidebar": { "order": ["plugins", "…"], "hidden": ["tasks"] },
      "footer": { "order": ["feedback"], "hidden": [] }
    }
  }
  ```

  The v2 `{version:2, order, hidden}` shape and the older
  `dsh.modmenu.layout.v1` key migrate into the `sidebar` scope; other scopes
  register their DOM order on first use. A row inserted later by the host or a
  newly installed plugin keeps its current DOM neighbours instead of being
  appended below the whole list.
- Per-section drag switches live in a separate
  `dsh.sidebar-organizer.drag.v1` key (`{"sidebar": true, "footer": false, …}`),
  so layout resets do not change them.
- The exported file is a `{ format, version, exportedAt, scopes, drag }` snapshot.
  Import only accepts `version === 3` with a `scopes` object, normalizes it through
  the same path as local storage, and marks all seven scopes as already repaired so
  the legacy trailing-row fix cannot rewrite the imported order.
- Drag layer: document-capture `pointerdown` → 260 ms long-press timer (cancelled
  by >8 px movement) → ghost clone plus indicator; drop index from row midpoints
  along the scope axis; dropping inside that scope's More rect tucks the row;
  clicks within 500 ms of a drop are swallowed.
- The settings page uses native HTML5 drag and drop (`draggable` plus
  `dragstart/dragover/drop`) and adds no interaction library. Buttons only move
  up/down, tuck, or restore, so they cannot conflict with the long-press gesture.

## Repository layout

```
src/                 sources (concatenated in dependency order at build time)
  constants.js       constants, strings, shared handles
  styles.js          injected styles (drag + settings page)
  storage.js         localStorage persistence and v2/v3 migration
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
npm run check   # syntax check
```

Open `test/harness.html` in a browser for the self-checking regression run
(seven-scope discovery, ordering, persistence, v2→v3 migration, `resetScope()`,
tuck/restore, per-region menu lists, pinned settings row, in-menu drag, DOM
churn during drag, config export/import with version rejection, and `dispose()`
restoration).

## Compatibility

- DSH `>= 0.2.1-rc.3` (developed against `0.2.1-rc.5` and checked against the
  `0.2.2-rc.1` component sources and a 0.2.2-shaped harness).
- 0.2.2 inserted "Copy as Markdown" above download in the session header's shipped
  More menu. Pulled-out download/feedback shortcuts now identify actions by label
  and icon instead of menu position, so the shortcut follows its action when the
  host inserts a row and legacy positional ids migrate automatically.
- 0.2.2 lays the settings nav out horizontally in short browser windows; the
  drag axis follows the rendered direction.
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

## Notices

- Third-party code and trademarks: [NOTICE.en.md](NOTICE.en.md)
- AI assistance and code origin: the "AI usage and code origin" section of
  [NOTICE.en.md](NOTICE.en.md)
- Citation metadata: [CITATION.cff](CITATION.cff)

## License

[MIT](LICENSE)
