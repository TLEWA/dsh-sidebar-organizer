# NOTICE — dsh-sidebar-organizer

[简体中文](NOTICE.md) · **English**

This file records code origin, third-party components, AI involvement, and how to
cite the project. Last updated: 2026-11-02 (v0.4.0).

## 1. What this project is

`dsh-sidebar-organizer` is a community third-party plugin. It is **not** an
official DeepSeek product and is not endorsed or certified by DeepSeek. It uses
the plugin interfaces the DSH client exposes at runtime (`window.__ModuleLoader__.load`,
`ctx.slots`, `ctx.locale`, `ctx.effect`) and does not modify any file in the host
installation.

## 2. Third-party code and assets

- **No host source code is included.** This project does not copy, adapt, or
  redistribute any DSH (DeepSeek Harness) source code or assets. DSH is
  proprietary; this project is written against its public plugin mechanism
  (bundle package format, client module loader, slot API).
- **Runtime dependencies come from the host.** `react` is provided by the DSH
  client module loader; `MenuItemButton` from
  `@deepseek-ai/dsh-client-ui-primitives` is an optional enhancement used only
  when present. Neither package is redistributed here.
- **Icons are read from the host at runtime.** The icon at the left of each menu
  row is cloned from the SVG the sidebar panel itself renders (element ids such
  as `mask` / `gradient` references are rewritten with a prefix). No icon assets
  are bundled.
- **No third-party runtime code.** Nothing in `src/`, `lib/`, or
  `test/harness.html` inlines a third-party library; the harness uses native DOM
  APIs and a hand-written fake module loader.
- **Development tools** (not shipped): Node.js (MIT), npm (Artistic License 2.0).
- If you believe a part of this implementation closely resembles your project
  without attribution, please open an issue; we will verify and either add
  credit or change the implementation.

## 3. AI usage and code origin

- **How it was built.** The project was built in DeepSeek Harness by an AI coding
  agent (DeepSeek model) working with the maintainer: the maintainer set
  requirements, reviewed the interaction, reported defects, and made acceptance
  and release decisions; the AI implemented, debugged, and drafted docs.
- **Scope of AI involvement.** All client code under `src/` and `lib/`, the host
  placeholder, the offline harness, and the first drafts of README / NOTICE /
  CHANGELOG are AI-generated or substantially AI-edited, then verified by the
  maintainer release by release on a real DSH desktop install (dragging, tucking,
  menu behaviour, performance, freeze regression).
- **Human responsibility.** The maintainer is ultimately responsible for the
  repository content, build artifacts, and published versions.
- **Privacy.** The plugin makes no network requests and collects no telemetry.
  All state (order, tucked list, kill switch) lives in browser `localStorage`
  under the keys documented in the README.
- **Stability caveat.** The plugin depends on the host's rendered DOM structure
  and slot projection (undocumented details). A DSH upgrade may break it; when it
  breaks, the sidebar keeps the host's default order, and the escape hatches in
  the README disable it.

## 4. Citing this project

Use [CITATION.cff](CITATION.cff):

```bibtex
@software{dsh_sidebar_organizer,
  author  = {TLEWA},
  title   = {dsh-sidebar-organizer: Drag-to-reorder and tuck-away for the DSH sidebar panel strip},
  version = {0.4.0},
  year    = {2026},
  license = {MIT},
  url     = {https://github.com/TLEWA/dsh-sidebar-organizer}
}
```

When citing code, include the version or commit SHA, e.g.
`dsh-sidebar-organizer v0.4.0 (https://github.com/TLEWA/dsh-sidebar-organizer)`.

## 5. Trademarks

"DeepSeek", "DeepSeek Harness", and "DSH" are marks of their respective owners.
The name `dsh-sidebar-organizer` is descriptive (naming the host and purpose) and
implies no affiliation or endorsement. Third-party product names in the README
are used only to describe compatibility.

## 6. License

Released under the [MIT](LICENSE) license. When redistributing sources or build
artifacts, keep `LICENSE` and this `NOTICE` file. The MIT license provides no
warranty.
