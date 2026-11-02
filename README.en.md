# dsh-sidebar-organizer

[简体中文](README.md) · **English**

Adds **custom ordering** and **tucking away** to the "global panels" strip at the
top-left of the DSH (DeepSeek Harness) sidebar — the column of icons for plugins,
marketplace, skills manager, scheduled tasks, and so on.

> Version **0.4.3**: the armed-state feedback on “More” now scales the whole
> button (icon and label together), matching the release animation.

## What it does

- **Long-press to reorder**: hold a panel icon for ~0.26 s; it lifts (a ghost
  follows the pointer, plus a drop indicator) and you drag it up or down.
  The order applies immediately and is persisted.
- **Tuck into "More"**: drop a row on the More button and that panel disappears
  from the strip, moving into the "Tucked away" group of the More menu.
- **Pull back out of "More"**: open the More menu, long-press a tucked panel and
  drag it onto the strip to restore it.
- **Reorder inside the menu**: long-press drag within the tucked group to change
  the order of tucked panels.
- **Keyboard**: focus a row and press `Alt+↑` / `Alt+↓`.
- **Reset**: once the layout is customized, "Reset layout" appears at the bottom
  of the More menu.
- The layout survives page reloads and DSH restarts.
- While dragging, rows under the pointer do not react with `:hover` or tooltips
  (rows get `pointer-events: none`; hit-testing is pure geometry).
- The "Plugins" entry can be reordered and tucked too; the More button always
  stays last.

## Install

### From npm (recommended)

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

1. **The panel slot is read-only.** The plugin never registers or shadows a
   `sidebar.panellist` entry; it only reads `entriesOfSlot` for ids and labels.
2. **Order/visibility is written as inline DOM styles.** The strip is
   `display:flex; flex-direction:column`, so `style.order` on each row changes
   the visual order; tucking uses `style.display:none` plus `data-dso-hidden`.
3. **Exactly one static slot write**: a row registered into
   `sidebar.panellist.actions` (the More menu) named `panel-organizer`. It is
   registered once and never re-registers or subscribes.
4. **Idempotent and rate-limited**: a pass only writes when a value actually
   changes, and passes are coalesced via `requestAnimationFrame`.
5. **Watchdog**: more than 90 passes in 3 s disables observers and listeners.
6. **`childList` only**: the plugin's own style/attribute writes cannot retrigger
   the observer.
7. **Escape hatches** (browser console):

   ```js
   window.__dshSidebarOrganizer.reset();      // forget the saved layout
   window.__dshSidebarOrganizer.disable();    // persist a kill switch and stop
   window.__dshSidebarOrganizer.hide("id");   // tuck away manually
   window.__dshSidebarOrganizer.reveal("id"); // restore manually
   window.__dshSidebarOrganizer.status();     // inspect current state
   ```

   To undo `disable()`, run
   `localStorage.removeItem("dsh.sidebar-organizer.disabled")` and refresh.
8. If this plugin stops working entirely, the sidebar simply keeps DSH's default
   order.

## How it works

- The panel list is the list slot `sidebar.panellist`; registrations look like
  `{ options: { id, order, label }, component }`, and the sidebar projects
  `entriesOfSlot` into `{id, order, label}` sorted by `order`.
- Rendered rows are mapped back to registration ids by exact match between the
  resolved label and the row's `aria-label`, falling back to the projection
  index, then to `label:<text>`.
- Persisted layout:
  `localStorage["dsh.sidebar-organizer.layout.v1"] = { version: 2, order: [id…], hidden: [id…] }`.
- Drag layer: document-capture `pointerdown` → 260 ms long-press timer (cancelled
  by >8 px movement) → ghost clone plus indicator; drop target by vertical
  midpoints; dropping inside the More button rect (6 px tolerance) tucks the
  row; clicks within 500 ms of a drop are swallowed.

## Repository layout

```
src/                 sources (concatenated in dependency order at build time)
scripts/build.mjs    assembles src/ into lib/client.js
lib/client.js        generated client half (what DSH loads)
lib/index.js         host half (placeholder)
cordis.patch.yml     bundle patch applied on install
test/harness.html    offline harness: fake sidebar DOM + slot projection
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
(ordering, persistence, reset, tuck/restore, in-menu drag, DOM churn during drag).

## Compatibility

- DSH `>= 0.2.1-rc.3` (developed against `0.2.1-rc.5`).
- The client only requires `react`; `MenuItemButton` from
  `@deepseek-ai/dsh-client-ui-primitives` is used when present, with a built-in
  fallback otherwise.

## Notices

- Third-party code and trademarks: [NOTICE.en.md](NOTICE.en.md)
- AI assistance and code origin: the "AI usage and code origin" section of
  [NOTICE.en.md](NOTICE.en.md)
- Citation metadata: [CITATION.cff](CITATION.cff)

## License

[MIT](LICENSE)
