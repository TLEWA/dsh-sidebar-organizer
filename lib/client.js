/**
 * dsh-sidebar-organizer — client half (v0.7.2).
 *
 * GENERATED FILE — do not edit by hand.
 * Sources live in src/; run `npm run build` to regenerate.
 *
 * Why one file: the DSH client loads plugin code as a classic script through
 * window.__ModuleLoader__.load({ id, factory }), not as an ES module, so there
 * is no import resolution at runtime.
 */

window.__ModuleLoader__.load({
  id: "dsh-sidebar-organizer",
  factory: (require) => {
/* Constants, locale strings and the module-level shared handles. */

// Replaced at build time from package.json by scripts/build.mjs.
const VERSION = "0.7.2";

const PLUGIN_ID = "dsh-sidebar-organizer";
const PANEL_SLOT = "sidebar.panellist";
const ACTIONS_SLOT = "sidebar.panellist.actions";
const FOOTER_SLOT = "sidebar.footer.action";
const TABS_SLOT = "conversation.view";
const COMPOSER_SLOT = "conversation.composer.dock";
const SETTINGS_SLOT = "settings.section";
const SETTINGS_ID = "layout-organizer";
// The three host "More" menus this plugin can add rows to. Each one owns a
// region: sidebar, conversation header, right sidebar.
const MORE_SLOTS = {
  sidebar: "sidebar.panellist.actions",
  conversation: "conversation.session.header.views.actions",
  rightbar: "sidebar.right.tab.guide.actions",
};
// The header utilities strip tucks rows into the SHIPPED "More actions" menu
// (an official plugin's hardcoded Menu, not a slot), so it has a region of its
// own for `hiddenForRegion` and its own DOM injection in runtime.js. It must
// not join REGION_SCOPES.conversation: those rows belong to the views menu.
const REGION_SCOPES = {
  sidebar: ["sidebar", "footer"],
  conversation: ["tabs", "composer"],
  rightbar: ["right"],
  header: ["header"],
};
const SCOPE_KEYS = ["sidebar", "footer", "tabs", "composer", "header", "right", "settings"];
const STORAGE_KEY = "dsh.sidebar-organizer.layout.v1";
// One-shot repair ledger: 0.5.4 appended newly discovered rows to the end of
// the persisted order instead of inserting them at the host position.
const REPAIR_KEY = "dsh.sidebar-organizer.repair.v1";
const DRAG_KEY = "dsh.sidebar-organizer.drag.v1";
// Host menu actions the user pulled out of the "More" popup. The map keeps the
// label and icon so the strip button can be rebuilt before the popup ever opens.
const HOST_ACTION_KEY = "dsh.sidebar-organizer.host-actions.v1";
const HOST_ACTION_PREFIX = "dso-host-";
const DISABLED_KEY = "dsh.sidebar-organizer.disabled";
// Set the first time the user actually rearranges something in this origin. The
// projection pass writes a layout on every boot too; without this flag a freshly
// opened window could not tell "the user dragged these rows here" from "I just
// registered the default order", and it would happily publish a default layout
// over the one the desktop window is showing.
const CUSTOMIZED_KEY = "dsh.sidebar-organizer.customized.v1";
// One layout for every window by default: the desktop window and a browser tab
// on another port read the host copy so a drag in one shows up in the other.
// Turning the setting off keeps each origin on its own local copy and stops all
// uploads, i.e. the pre-0.7.2 behaviour.
const CROSS_WINDOW_KEY = "dsh.sidebar-organizer.cross-window.v1";
// The plugin was called dsh-modmenu up to 0.3.6; keep reading the old keys so a
// rename does not drop the user's saved layout.
const LEGACY_STORAGE_KEY = "dsh.modmenu.layout.v1";
const LEGACY_DISABLED_KEY = "dsh.modmenu.disabled";
const REGISTRANT = "dsh-sidebar-organizer";
const LONG_PRESS_MS = 260;
const MOVE_TOLERANCE = 8;
const CLICK_GUARD_MS = 500;
const PASS_LIMIT = 90;
const PASS_WINDOW_MS = 3000;
const GHOST_Z = 2147483000;

/** Shared modules resolved by the client module loader. */
let sharedRequire = null;
let sharedReact = null;
let sharedMenuButton = null;
let runtimeInstance = null;

const STRINGS = {
  zh: {
    hidden: "已收纳",
    reset: "恢复默认排序",
    settingsTitle: "布局整理",
    exportConfig: "导出配置",
    importConfig: "导入配置",
    exportHint: "导出排序、收纳与拖动开关为 JSON 文件",
    importHint: "从 JSON 文件导入排序、收纳与拖动开关",
    exportOk: "配置已导出",
    importOk: "配置已导入",
    importVersion: "配置文件版本不兼容，未导入",
    importInvalid: "配置文件无法读取，未导入",
    resetScope: "恢复本组",
    restore: "恢复显示",
    tuck: "收进更多",
    up: "上移",
    down: "下移",
    empty: "此位置暂无可整理项",
    pinned: "固定",
    more: "更多",
    moreMenu: "已收纳的设置项",
    drag: "拖动",
    dragOn: "此区域可拖动",
    dragOff: "此区域拖动已关闭",
    crossWindow: "跨窗口共用布局",
    crossWindowOn: "桌面端与网页端共用同一份布局",
    crossWindowOff: "各窗口只使用自己的本地布局",
    scopeNames: {
      sidebar: "左侧边栏",
      footer: "侧栏底部",
      tabs: "对话标签",
      composer: "输入框工具条",
      header: "会话头部工具条",
      right: "右侧栏",
      settings: "设置导航",
    },
  },
  en: {
    hidden: "Hidden",
    reset: "Reset layout",
    settingsTitle: "Layout organizer",
    exportConfig: "Export",
    importConfig: "Import",
    exportHint: "Export order, tucked rows and drag switches as a JSON file",
    importHint: "Import order, tucked rows and drag switches from a JSON file",
    exportOk: "Configuration exported",
    importOk: "Configuration imported",
    importVersion: "Unsupported configuration version — nothing imported",
    importInvalid: "Could not read the configuration file — nothing imported",
    resetScope: "Reset section",
    restore: "Restore",
    tuck: "Move into More",
    up: "Move up",
    down: "Move down",
    empty: "Nothing to organize here yet",
    pinned: "Pinned",
    more: "More",
    moreMenu: "Hidden settings items",
    drag: "Drag",
    dragOn: "Dragging enabled in this section",
    dragOff: "Dragging disabled in this section",
    crossWindow: "Shared layout",
    crossWindowOn: "Desktop and web windows share one layout",
    crossWindowOff: "Each window keeps its own local layout",
    scopeNames: {
      sidebar: "Sidebar",
      footer: "Sidebar footer",
      tabs: "Conversation tabs",
      composer: "Composer dock",
      header: "Session header",
      right: "Right sidebar",
      settings: "Settings navigation",
    },
  },
};

function strings() {
  const lang = String(
    (document.documentElement && document.documentElement.lang) ||
      (typeof navigator !== "undefined" && navigator.language) ||
      "en"
  ).toLowerCase();
  return lang.startsWith("zh") ? STRINGS.zh : STRINGS.en;
}

/* Injected stylesheet. Kept as a string: the client bundle must load offline
   without extra network requests. */

const CSS = `
/* Host compatibility: the shipped right-guide ends with a spacer pseudo-element
   (.guide::after, flex: 0 10%) that must stay last to bias the list upward.
   Our rows carry explicit order values, so the spacer (order 0) would sort
   between the compass and the first card — opening a blank band that grows
   with the pane height. Pin it past every row we order. */
[data-sidebar-right-guide][data-sidebar-right-guide]::after {
  order: 2147483647;
}

.dso-ghost {
  position: fixed !important;
  margin: 0 !important;
  box-sizing: border-box;
  pointer-events: none;
  z-index: ${GHOST_Z};
  opacity: 0.96;
  border-radius: var(--dsw-radius-md, 6px);
  background: var(--dsw-specific-sidebar-fill, rgba(24, 24, 27, 0.92));
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.28), 0 2px 6px rgba(0, 0, 0, 0.16);
  transform: scale(1.03);
}
.dso-indicator {
  position: fixed;
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  border-radius: 2px;
  background: var(--dsw-alias-state-business-primary, #4d6bfe);
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.06);
  pointer-events: none;
  z-index: ${GHOST_Z};
  opacity: 0;
  transition: opacity 120ms ease;
}
.dso-indicator[data-visible="1"] { opacity: 1; }
/* The drag source always stays in the layout as a dimmed placeholder: the row
   in the sidebar and the row inside the "More" popup must both read as "the
   thing I am moving is still here". */
[data-dso-key].dso-dragging,
.dso-menu-item.dso-dragging { opacity: 0.35; }
[data-dso-key] { -webkit-user-select: none; user-select: none; }
/* The "More" anchor, armed: it breathes a ring and shrinks as a whole (icon and
   label together) to read as "release here and this row drops into me". */
.dso-drop-more {
  outline: 2px dashed var(--dsw-alias-state-business-primary, #4d6bfe);
  outline-offset: -2px;
  background: var(--dsw-alias-interactive-bg-hover, rgba(255, 255, 255, 0.08));
  transform: scale(0.94);
  transition: transform 160ms ease;
  animation: dso-more-breathe 1100ms ease-in-out infinite;
}
@keyframes dso-more-breathe {
  0%, 100% { box-shadow: 0 0 0 0 rgba(77, 107, 254, 0.38); }
  55% { box-shadow: 0 0 0 8px rgba(77, 107, 254, 0); }
  100% { box-shadow: 0 0 0 0 rgba(77, 107, 254, 0); }
}
@keyframes dso-more-receive {
  0% { transform: scale(1); }
  35% { transform: scale(0.86); }
  70% { transform: scale(1.06); }
  100% { transform: scale(1); }
}
.dso-drop-receive { animation: dso-more-receive 260ms cubic-bezier(0.2, 0.7, 0.3, 1); }
@keyframes dso-drop-reject {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-4px); }
  40% { transform: translateX(4px); }
  60% { transform: translateX(-3px); }
  80% { transform: translateX(2px); }
}
.dso-drop-reject { animation: dso-drop-reject 240ms ease; }
/* Carrying a row towards the anchor: the ghost dims and shrinks a little, so
   its eventual absorption does not feel like a jump. */
.dso-ghost.dso-ghost-armed {
  opacity: 0.82;
  transform: scale(0.94);
  transition: transform 140ms ease, opacity 140ms ease;
}
@media (prefers-reduced-motion: reduce) {
  .dso-drop-more,
  .dso-drop-receive,
  .dso-drop-reject { animation: none !important; }
  .dso-drop-more { transform: none !important; transition: none !important; }
  .dso-ghost,
  .dso-ghost.dso-ghost-armed { transition: none !important; }
}
body.dso-dragging,
body.dso-dragging * { cursor: grabbing !important; }
/* While a drag is in flight the rows under the pointer must not react at all:
   no :hover highlight, no tooltip. Hit-testing is done from rects, not events. */
body.dso-dragging [data-dso-key],
body.dso-dragging [data-dso-more-key] { pointer-events: none !important; }
body.dso-dragging [data-dso-key]:hover { background: transparent !important; }

/* rows appended to the shipped "More" menu */
.dso-menu-caption {
  padding: 6px 10px 2px;
  font-size: 12px;
  line-height: 18px;
  color: var(--dsw-alias-label-secondary, rgba(235, 235, 245, 0.6));
  -webkit-user-select: none;
  user-select: none;
}
.dso-menu-item { display: block; }
/* Rows injected into the shipped "More actions" menu of the session header.
   Kept on the same 32px row metrics as the native items so the menu does not
   grow a seam; the caption uses the same quiet styling as every other shelf. */
.dso-header-tucked { display: block; padding: 2px 0 2px; }
.dso-header-tucked .dso-menu-caption { padding-top: 2px; }
/* Shortcut buttons for shipped-menu actions pulled onto the header strip. They
   must look like the host's 28px icon buttons, not like our menu rows. */
.dso-host-action {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
}
.dso-host-action:hover { background: var(--dsw-alias-bg-layer-hover, rgba(255, 255, 255, 0.08)); }
.dso-host-action svg { width: 16px; height: 16px; }
.dso-host-action-text {
  max-width: 56px;
  overflow: hidden;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
/* Kept in the layout (so the menu does not jump) and dimmed like a sidebar
   row; the placeholder rule above owns the opacity. */
/* icon wrapper handed to MenuItemButton: same 16px footprint as the shipped rows */
.dso-menu-icon {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  overflow: hidden;
  color: inherit;
}
.dso-menu-icon svg,
.dso-menu-row svg {
  width: 16px;
  height: 16px;
  flex: none;
  display: block;
}
/* the styled fallback row, used only when the primitives package is missing */
.dso-menu-row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-height: 32px;
  margin: 0;
  padding: 6px 10px;
  border: none;
  border-radius: var(--dsw-radius-md, 6px);
  background: transparent;
  color: var(--dsw-alias-label-primary, #ebebf5);
  font: inherit;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
}
.dso-menu-row:hover,
.dso-menu-row:focus-visible {
  background: var(--dsw-alias-interactive-bg-hover, rgba(255, 255, 255, 0.08));
}
.dso-menu-row:focus-visible {
  outline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary, #4d6bfe));
}
.dso-menu-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Settings navigation: the organizer injects a "More" row at the end and a
   popup that lists tucked settings entries. Geometry mirrors the host nav cells
   (40px tall, 12px radius) without relying on hashed host class names. */
.dso-settings-more {
  display: flex;
  align-items: center;
  gap: 8px;
  box-sizing: border-box;
  width: 100%;
  height: 40px;
  margin: 0;
  padding: 9px 12px;
  border: none;
  border-radius: 12px;
  background: transparent;
  color: var(--dsw-alias-label-secondary, rgba(235, 235, 245, 0.62));
  font: inherit;
  font-size: 14px;
  text-align: left;
  cursor: pointer;
}
.dso-settings-more:hover,
.dso-settings-more:focus-visible {
  background: var(--dsw-alias-interactive-bg-hover, rgba(255, 255, 255, 0.08));
  color: var(--dsw-alias-label-primary, #ebebf5);
}
.dso-settings-more:focus-visible {
  outline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary, #4d6bfe));
}
.dso-settings-more-menu {
  position: fixed;
  z-index: 2147482600;
  box-sizing: border-box;
  max-height: 320px;
  overflow: auto;
  padding: 4px;
  border: 1px solid var(--dsw-alias-border-secondary, rgba(255, 255, 255, 0.1));
  border-radius: 10px;
  background: var(--dsw-specific-sidebar-fill, rgba(24, 24, 27, 0.98));
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.24), 0 2px 8px rgba(0, 0, 0, 0.16);
}
.dso-settings-more-item {
  display: flex;
  align-items: center;
  box-sizing: border-box;
  width: 100%;
  min-height: 34px;
  margin: 0;
  padding: 6px 10px;
  border: none;
  border-radius: 7px;
  background: transparent;
  color: var(--dsw-alias-label-primary, #ebebf5);
  font: inherit;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
}
.dso-settings-more-item:hover,
.dso-settings-more-item:focus-visible {
  background: var(--dsw-alias-interactive-bg-hover, rgba(255, 255, 255, 0.08));
}
.dso-settings-more-item:focus-visible {
  outline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary, #4d6bfe));
}

/* Settings page / plugin-detail page */
.dso-config {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
  max-width: 760px;
  padding: 4px 0 28px;
  color: var(--dsw-alias-label-primary, #ebebf5);
  font-size: 13px;
  box-sizing: border-box;
}
.dso-config * { box-sizing: border-box; }
.dso-config-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 30px;
}
.dso-config-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 2px;
  margin-left: auto;
}
.dso-config-notice {
  margin: -8px 0 -6px;
  font-size: 12px;
  line-height: 18px;
  color: var(--dsw-alias-label-secondary, rgba(235, 235, 245, 0.62));
}
.dso-config-notice[data-tone="ok"] {
  color: var(--dsw-alias-state-success-primary, #3fb950);
}
.dso-config-notice[data-tone="error"] {
  color: var(--dsw-alias-state-error-primary, #f85149);
}
.dso-config-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  line-height: 22px;
}
.dso-config-card {
  border: 1px solid var(--dsw-alias-border-secondary, rgba(255, 255, 255, 0.1));
  border-radius: 10px;
  background: var(--dsw-alias-bg-secondary, rgba(255, 255, 255, 0.025));
  overflow: hidden;
}
.dso-config-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 12px;
  background: var(--dsw-alias-bg-tertiary, rgba(255, 255, 255, 0.035));
  border-bottom: 1px solid var(--dsw-alias-border-secondary, rgba(255, 255, 255, 0.08));
}
/* The shared-layout switch is a single row, so it needs no divider. */
.dso-config-card-sync .dso-config-card-head { border-bottom: none; }
.dso-config-card-heading {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.dso-config-card-title {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  line-height: 18px;
  color: var(--dsw-alias-label-primary, #ebebf5);
}
.dso-config-switch {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 6px;
  margin: 0;
  padding: 1px 0;
  border: none;
  background: transparent;
  color: var(--dsw-alias-label-secondary, rgba(235, 235, 245, 0.62));
  font: inherit;
  font-size: 11px;
  line-height: 16px;
  cursor: pointer;
  border-radius: 4px;
}
.dso-config-switch:hover,
.dso-config-switch:focus-visible { color: var(--dsw-alias-label-primary, #ebebf5); }
.dso-config-switch:focus-visible {
  outline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary, #4d6bfe));
  outline-offset: 2px;
}
.dso-config-switch-track {
  position: relative;
  display: inline-block;
  width: 22px;
  height: 13px;
  flex: none;
  border-radius: 999px;
  background: var(--dsw-alias-border-secondary, rgba(255, 255, 255, 0.16));
  transition: background 120ms ease;
}
.dso-config-switch-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--dsw-alias-label-secondary, rgba(235, 235, 245, 0.72));
  transition: transform 120ms ease, background 120ms ease;
}
.dso-config-switch.is-on .dso-config-switch-track {
  background: var(--dsw-alias-state-business-primary, #4d6bfe);
}
.dso-config-switch.is-on .dso-config-switch-thumb {
  transform: translateX(9px);
  background: #fff;
}
.dso-config-reset,
.dso-config-action {
  flex: none;
  border: none;
  background: transparent;
  padding: 2px 4px;
  color: var(--dsw-alias-label-secondary, rgba(235, 235, 245, 0.62));
  font: inherit;
  font-size: 12px;
  line-height: 18px;
  cursor: pointer;
  border-radius: 4px;
}
.dso-config-reset:hover,
.dso-config-reset:focus-visible,
.dso-config-action:hover,
.dso-config-action:focus-visible {
  color: var(--dsw-alias-label-primary, #ebebf5);
  background: var(--dsw-alias-interactive-bg-hover, rgba(255, 255, 255, 0.08));
}
.dso-config-reset:focus-visible,
.dso-config-action:focus-visible {
  outline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary, #4d6bfe));
  outline-offset: 1px;
}
.dso-config-list { display: flex; flex-direction: column; }
.dso-config-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 34px;
  padding: 4px 8px 4px 10px;
  background: transparent;
  transition: background 120ms ease;
}
.dso-config-row + .dso-config-row {
  border-top: 1px solid var(--dsw-alias-border-secondary, rgba(255, 255, 255, 0.06));
}
.dso-config-row:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(255, 255, 255, 0.05)); }
.dso-config-row.is-hidden { opacity: 0.62; }
.dso-config-row.is-drop {
  box-shadow: inset 0 2px 0 var(--dsw-alias-state-business-primary, #4d6bfe);
}
.dso-config-grip {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 20px;
  color: var(--dsw-alias-label-tertiary, rgba(235, 235, 245, 0.38));
  cursor: grab;
}
.dso-config-grip.is-pinned,
.dso-config-grip.is-fixed { cursor: default; opacity: 0.4; }
.dso-config-row:active .dso-config-grip { cursor: grabbing; }
.dso-config-label {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 20px;
}
.dso-config-chip {
  flex: none;
  padding: 0 6px;
  border-radius: 999px;
  background: var(--dsw-alias-bg-tertiary, rgba(255, 255, 255, 0.06));
  color: var(--dsw-alias-label-secondary, rgba(235, 235, 245, 0.62));
  font-size: 11px;
  line-height: 18px;
}
.dso-config-btn {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--dsw-alias-label-secondary, rgba(235, 235, 245, 0.62));
  cursor: pointer;
}
.dso-config-btn:hover,
.dso-config-btn:focus-visible {
  color: var(--dsw-alias-label-primary, #ebebf5);
  background: var(--dsw-alias-interactive-bg-hover, rgba(255, 255, 255, 0.08));
}
.dso-config-btn:focus-visible {
  outline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary, #4d6bfe));
  outline-offset: 1px;
}
.dso-config-btn:disabled { opacity: 0.3; cursor: default; background: transparent; }
.dso-config-empty {
  padding: 12px;
  color: var(--dsw-alias-label-secondary, rgba(235, 235, 245, 0.5));
  font-size: 12px;
  line-height: 18px;
}
`;

/* Persistent per-scope layout state (v3). */

const STATE_VERSION = 3;
const EXPORT_FORMAT = "dsh-sidebar-organizer";
const EXPORT_FILENAME = "dsh-sidebar-organizer.json";
// 0.4.x shares STORAGE_KEY but only understands the flat sidebar layout: loading
// that build rewrites the key as {version:2,order,hidden}, dropping every other
// scope and the tucked rows. Keep a full snapshot beside it so the next 0.5.x
// load can put the configuration back instead of losing it for good.
const LAYOUT_BACKUP_KEY = `${STORAGE_KEY}.v3-backup`;
let layoutCache = null;
let dragCache = null;

function emptyScopeLayout() {
  return { order: [], hidden: [] };
}

function emptyLayoutState() {
  return { version: STATE_VERSION, scopes: {} };
}

function normalizeStringList(value) {
  if (!Array.isArray(value)) return [];
  const out = [];
  for (const item of value) {
    if (typeof item !== "string" || !item) continue;
    if (out.indexOf(item) === -1) out.push(item);
  }
  return out;
}

function normalizeScopeLayout(value) {
  const raw = value && typeof value === "object" ? value : {};
  const order = normalizeStringList(raw.order);
  const hidden = normalizeStringList(raw.hidden).filter((id) => order.indexOf(id) !== -1);
  return { order, hidden };
}

function normalizeLayoutState(value) {
  const state = emptyLayoutState();
  if (!value || typeof value !== "object") return state;

  // v3 shape.
  if (value.scopes && typeof value.scopes === "object") {
    for (const scope of SCOPE_KEYS) {
      const next = normalizeScopeLayout(value.scopes[scope]);
      if (next.order.length || next.hidden.length) state.scopes[scope] = next;
    }
    return state;
  }

  // v2 (and pre-rename legacy) shape: one flat sidebar layout.
  if (Array.isArray(value.order) || Array.isArray(value.hidden)) {
    const migrated = normalizeScopeLayout(value);
    if (migrated.order.length || migrated.hidden.length) state.scopes.sidebar = migrated;
  }
  return state;
}

function readState() {
  if (layoutCache) return layoutCache;
  let parsed = null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      parsed = JSON.parse(raw);
    } else {
      const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacy) {
        parsed = JSON.parse(legacy);
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
        } catch (err) {
          /* ignore quota / privacy errors */
        }
      }
    }
  } catch (err) {
    parsed = null;
  }
  layoutCache = restoreFromBackup(parsed) || normalizeLayoutState(parsed);
  return layoutCache;
}

// Returns a restored state when the primary key was degraded to the flat
// sidebar shape by an older build but our own multi-scope snapshot survived.
function restoreFromBackup(parsed) {
  if (!parsed || typeof parsed !== "object" || parsed.scopes) return null;
  if (!Array.isArray(parsed.order) && !Array.isArray(parsed.hidden)) return null;
  let backup = null;
  try {
    const raw = window.localStorage.getItem(LAYOUT_BACKUP_KEY);
    if (raw) backup = JSON.parse(raw);
  } catch (err) {
    return null;
  }
  if (!backup || typeof backup !== "object" || !backup.scopes) return null;
  const state = normalizeLayoutState(backup);
  // Only rescuing the sidebar would rewind a deliberate reset made in the older
  // build; the loss worth undoing is the scopes that build cannot represent.
  if (!Object.keys(state.scopes).some((scope) => scope !== "sidebar")) return null;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    /* keep the restored copy in memory */
  }
  return state;
}

function cloneState(state) {
  const next = emptyLayoutState();
  for (const scope of SCOPE_KEYS) {
    const raw = state.scopes[scope];
    if (!raw) continue;
    next.scopes[scope] = { order: raw.order.slice(), hidden: raw.hidden.slice() };
  }
  return next;
}

function writeState(state) {
  layoutCache = cloneState(state);
  const serialized = JSON.stringify(layoutCache);
  try {
    window.localStorage.setItem(STORAGE_KEY, serialized);
    window.localStorage.setItem(LAYOUT_BACKUP_KEY, serialized);
  } catch (err) {
    /* storage may be unavailable; keep the in-memory copy */
  }
}

// The portable shape shared with the host copy: the six-scope layout plus the
// per-section drag switches, without the local-only bookkeeping.
function stateSnapshot() {
  const state = cloneState(readState());
  const dragState = readDragState();
  const drag = {};
  for (const scope of SCOPE_KEYS) drag[scope] = dragState[scope] !== false;
  return { version: STATE_VERSION, scopes: state.scopes, drag };
}

function hasLayoutContent(value) {
  const scopes = value && typeof value === "object" ? value.scopes : null;
  if (!scopes || typeof scopes !== "object" || Array.isArray(scopes)) return false;
  for (const key of Object.keys(scopes)) {
    const scope = scopes[key];
    if (scope && Array.isArray(scope.order) && scope.order.length) return true;
    if (scope && Array.isArray(scope.hidden) && scope.hidden.length) return true;
  }
  return false;
}

function readScope(scope) {
  const state = readState();
  const raw = state.scopes[scope];
  return raw ? { order: raw.order.slice(), hidden: raw.hidden.slice() } : emptyScopeLayout();
}

function writeScope(scope, layout, options) {
  const state = cloneState(readState());
  const next = normalizeScopeLayout(layout);
  if (next.order.length || next.hidden.length) state.scopes[scope] = next;
  else delete state.scopes[scope];
  writeState(state);
  noteLocalChange(options);
}

// True once this origin holds a layout the user arranged on purpose. The
// projection pass records the host's default order on every boot too; without
// this flag a freshly opened window cannot tell that from a real drag and would
// publish its defaults over the layout the other window is showing.
function isLayoutCustomized() {
  try {
    return Number(window.localStorage.getItem(CUSTOMIZED_KEY)) > 0;
  } catch (err) {
    return false;
  }
}

function markLayoutCustomized() {
  try {
    window.localStorage.setItem(CUSTOMIZED_KEY, String(Date.now()));
  } catch (err) {
    /* storage may be unavailable */
  }
}

// Cross-window sharing is on unless the user turned it off in the settings page.
function isCrossWindowEnabled() {
  try {
    return window.localStorage.getItem(CROSS_WINDOW_KEY) !== "0";
  } catch (err) {
    return true;
  }
}

function writeCrossWindowEnabled(enabled) {
  try {
    window.localStorage.setItem(CROSS_WINDOW_KEY, enabled ? "1" : "0");
  } catch (err) {
    /* storage may be unavailable */
  }
}

function resetScopeState(scope) {
  const state = cloneState(readState());
  delete state.scopes[scope];
  writeState(state);
  noteLocalChange({ user: true, reset: true });
}

// A one-time migration ledger, separate from the layout: a scope that was
// repaired once must not be repaired again, otherwise a deliberate "move to
// the end" would be undone on every page load.
function readRepairState() {
  try {
    const raw = window.localStorage.getItem(REPAIR_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (err) {
    return {};
  }
}

function isScopeRepaired(scope) {
  return readRepairState()[scope] === true;
}

function markScopeRepaired(scope) {
  const state = readRepairState();
  state[scope] = true;
  try {
    window.localStorage.setItem(REPAIR_KEY, JSON.stringify(state));
  } catch (err) {
    /* storage may be unavailable; the in-memory pass still gets a clean order */
  }
}

// Per-section drag toggles live separately from the layout. "Reset layout"
// must not silently re-enable a section the user deliberately locked.
function readDragState() {
  if (dragCache) return dragCache;
  const state = {};
  for (const scope of SCOPE_KEYS) state[scope] = true;
  try {
    const raw = window.localStorage.getItem(DRAG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        for (const scope of SCOPE_KEYS) {
          if (parsed[scope] === false) state[scope] = false;
        }
      }
    }
  } catch (err) {
    /* storage may be unavailable; default to enabled */
  }
  dragCache = state;
  return dragCache;
}

function readDragEnabled(scope) {
  if (SCOPE_KEYS.indexOf(scope) === -1) return false;
  return readDragState()[scope] !== false;
}

function writeDragEnabled(scope, enabled) {
  if (SCOPE_KEYS.indexOf(scope) === -1) return false;
  const next = {};
  const current = readDragState();
  for (const key of SCOPE_KEYS) next[key] = key === scope ? Boolean(enabled) : current[key] !== false;
  dragCache = next;
  try {
    window.localStorage.setItem(DRAG_KEY, JSON.stringify(next));
  } catch (err) {
    /* keep the in-memory copy */
  }
  noteLocalChange({ user: true });
  return true;
}

// The exported file is a self-contained snapshot of everything the user
// configured: the six-scope layout plus the per-section drag switches. The
// repair ledger and the disabled kill switch are local runtime bookkeeping and
// deliberately stay out of it.
function readHostActions() {
  try {
    const raw = window.localStorage.getItem(HOST_ACTION_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const out = {};
    for (const key of Object.keys(parsed)) {
      const info = parsed[key];
      if (!key || !info || typeof info.label !== "string") continue;
      out[key] = { label: info.label, icon: typeof info.icon === "string" ? info.icon : "" };
    }
    return out;
  } catch (err) {
    return {};
  }
}

function writeHostActions(map) {
  try {
    window.localStorage.setItem(HOST_ACTION_KEY, JSON.stringify(map || {}));
  } catch (err) {
    /* storage may be unavailable */
  }
}

function exportConfigSnapshot() {
  const state = cloneState(readState());
  const dragState = readDragState();
  const drag = {};
  for (const scope of SCOPE_KEYS) drag[scope] = dragState[scope] !== false;
  return {
    format: EXPORT_FORMAT,
    version: STATE_VERSION,
    exportedAt: new Date().toISOString(),
    scopes: state.scopes,
    drag,
  };
}

// Import replaces the whole configuration at once. A file from another version
// or with a missing layout block is rejected whole; half-applying a different
// shape would scatter the user's rows across the page.
function importConfigSnapshot(value) {
  let raw = value;
  if (typeof raw === "string") {
    try {
      raw = JSON.parse(raw);
    } catch (err) {
      return { ok: false, reason: "json" };
    }
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, reason: "json" };
  }
  if (raw.version !== STATE_VERSION) {
    return { ok: false, reason: "version" };
  }
  if (!raw.scopes || typeof raw.scopes !== "object" || Array.isArray(raw.scopes)) {
    return { ok: false, reason: "shape" };
  }

  const state = normalizeLayoutState(raw);
  writeState(state);

  const source = raw.drag && typeof raw.drag === "object" && !Array.isArray(raw.drag) ? raw.drag : {};
  const drag = {};
  for (const scope of SCOPE_KEYS) drag[scope] = source[scope] !== false;
  dragCache = drag;
  try {
    window.localStorage.setItem(DRAG_KEY, JSON.stringify(drag));
  } catch (err) {
    /* keep the in-memory copy */
  }

  // An imported order is an explicit snapshot. Mark every scope as repaired so
  // the one-shot 0.5.4 migration cannot reorder it on the next projection pass.
  for (const scope of SCOPE_KEYS) markScopeRepaired(scope);

  noteLocalChange({ user: true });
  return { ok: true, scopes: Object.keys(state.scopes).length };
}

function forgetLayout() {
  layoutCache = null;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(LAYOUT_BACKUP_KEY);
    // A legacy flat layout would otherwise be migrated straight back in on the
    // next read, making "reset" appear to do nothing.
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch (err) {
    /* ignore */
  }
  // Tell the host copy too, otherwise the other window keeps showing the layout
  // this reset just removed.
  noteLocalChange({ reset: true, user: true });
}

function isSameOrder(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function setOrder(element, value) {
  if (!element) return;
  const next = String(value);
  if (element.style.order !== next) element.style.order = next;
}

/* Cross-origin layout sharing.
 *
 * The layout used to live only in window.localStorage, which is per-origin. The
 * desktop window runs on dsh-app://app while a browser tab on
 * http://127.0.0.1:<port> is a different origin whose port changes on every
 * restart, so the two kept separate copies and a drag done in one window never
 * showed up in the other.
 *
 * The host half of this plugin keeps one copy under
 * $DSH_HOME/storages/dsh-sidebar-organizer/layout.json and serves it on
 * /api/dsh-sidebar-organizer/layout. Every window starts from that copy and
 * publishes its own edits; localStorage stays the fast, synchronous read the
 * projection pass uses, the host copy is what makes the windows agree.
 *
 * Who wins is decided by one question: has this origin ever been rearranged by
 * the user (`isLayoutCustomized`)? The projection pass writes a layout on every
 * boot, so a fresh window cannot key off "local copy exists" — a default order
 * recorded there must never overwrite the layout another window is showing:
 *
 *   host empty + local customized      -> publish local
 *   host empty + local untouched       -> stay local, publish nothing
 *   host has copy + local untouched    -> adopt host (whatever timestamps say)
 *   host has copy + local customized   -> newer timestamp wins
 *
 * Publishing only happens on real edits, so a window that merely opened and
 * registered the defaults stays invisible to the other window.
 */

const SYNC_KEY = "dsh.sidebar-organizer.sync.v1";
const SYNC_ROUTE = "api/dsh-sidebar-organizer/layout";
const SYNC_PUSH_DELAY_MS = 350;
const SYNC_RETRY_MS = 5000;
const SYNC_WAKE_THROTTLE_MS = 800;
const SYNC_PULL_RETRY_LIMIT = 5;

let syncClientId = "";
let syncStarted = false;
let syncClaiming = false;
// Set while the settings switch turns sharing back on: the host copy wins even
// though edits made while sharing was off are newer locally, otherwise flipping
// the switch would immediately publish those private edits over the other window.
let syncForceAdopt = false;
let syncPushTimer = 0;
let syncPushRunning = false;
let syncPushQueued = false;
let syncResetQueued = false;
let syncPullAttempts = 0;
let syncLastWakeAt = 0;
const syncDiag = {
  state: "idle",
  pushes: 0,
  pulls: 0,
  adopted: 0,
  route: SYNC_ROUTE,
  lastError: null,
};

function syncClient() {
  if (syncClientId) return syncClientId;
  syncClientId = Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  return syncClientId;
}

function readSyncMeta() {
  try {
    const raw = window.localStorage.getItem(SYNC_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch (err) {
    return {};
  }
}

function writeSyncMeta(meta) {
  try {
    window.localStorage.setItem(SYNC_KEY, JSON.stringify(meta));
  } catch (err) {
    /* storage may be unavailable */
  }
}

function syncMeta(overrides) {
  const current = readSyncMeta();
  return {
    updatedAt: Number(current.updatedAt) || 0,
    client: current.client || syncClient(),
    syncedAt: Number(current.syncedAt) || 0,
    ...(overrides || {}),
  };
}

function syncFailure(error) {
  syncDiag.state = "offline";
  syncDiag.lastError = String((error && error.message) || error || "sync failed");
}

// Called by every local mutation (storage.js). `options.user` marks a change the
// user made; only those are worth publishing, and only they flip the
// "customized" flag this whole merge rule hangs on.
function noteLocalChange(options) {
  const user = Boolean(options && options.user);
  if (user) markLayoutCustomized();
  syncDiag.state = syncDiag.state === "idle" ? "pending" : syncDiag.state;
  writeSyncMeta(syncMeta({ updatedAt: Date.now() }));
  if (options && options.reset === true) syncResetQueued = true;
  if ((user || syncResetQueued) && isCrossWindowEnabled()) scheduleHostPush(SYNC_PUSH_DELAY_MS);
}

function scheduleHostPush(delay, force) {
  if (syncPushTimer) return;
  syncPushTimer = window.setTimeout(() => {
    syncPushTimer = 0;
    pushHostLayout(force);
  }, typeof delay === "number" ? delay : SYNC_PUSH_DELAY_MS);
}

async function pushHostLayout(force) {
  if (!isCrossWindowEnabled()) {
    syncResetQueued = false;
    syncDiag.state = "disabled";
    return;
  }
  if (syncPushRunning) {
    syncPushQueued = true;
    return;
  }
  const reset = syncResetQueued;
  if (!force && !reset && !isLayoutCustomized()) {
    // Nothing the user made here yet: do not publish the registered defaults.
    return;
  }
  syncPushRunning = true;
  syncResetQueued = false;
  const meta = readSyncMeta();
  const updatedAt = Number(meta.updatedAt) || Date.now();
  try {
    const response = await fetch(SYNC_ROUTE, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ layout: stateSnapshot(), updatedAt, reset }),
      cache: "no-store",
    });
    if (!response.ok) throw new Error("HTTP " + response.status);
    const body = await response.json();
    syncDiag.pushes += 1;
    syncDiag.state = "ready";
    syncDiag.lastError = null;
    const remoteAt = Number(body && body.updatedAt) || 0;
    if (body && body.layout && remoteAt > updatedAt) {
      // Another window wrote while this request was in flight; its copy wins.
      adoptHostLayout(body.layout, remoteAt);
      return;
    }
    writeSyncMeta(syncMeta({ updatedAt: remoteAt || updatedAt, syncedAt: Date.now() }));
  } catch (error) {
    syncFailure(error);
    syncResetQueued = syncResetQueued || reset;
    scheduleHostPush(SYNC_RETRY_MS);
  } finally {
    syncPushRunning = false;
    if (syncPushQueued) {
      syncPushQueued = false;
      scheduleHostPush(SYNC_PUSH_DELAY_MS);
    }
  }
}

async function pullHostLayout() {
  if (!isCrossWindowEnabled()) {
    syncDiag.state = "disabled";
    return false;
  }
  const meta = readSyncMeta();
  try {
    const response = await fetch(SYNC_ROUTE, {
      method: "GET",
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) throw new Error("HTTP " + response.status);
    const body = await response.json();
    syncDiag.pulls += 1;
    syncDiag.state = "ready";
    syncDiag.lastError = null;
    syncPullAttempts = 0;
    const remoteAt = Number(body && body.updatedAt) || 0;
    const localAt = Number(meta.updatedAt) || 0;

    if (!body || !body.layout || !hasLayoutContent(body.layout)) {
      // A host without a copy never overrides what this window already shows.
      syncDiag.state = isLayoutCustomized() ? "push-pending" : "empty-host";
      return false;
    }
    const customized = isLayoutCustomized();
    if (syncClaiming) {
      // This window holds a hand-made layout from before host sync existed;
      // publish it instead of letting a later copy from another window win.
      syncDiag.state = "local-newer";
      return false;
    }
    if (customized && remoteAt <= localAt && !syncForceAdopt) {
      syncDiag.state = "local-newer";
      return false;
    }
    return adoptHostLayout(body.layout, remoteAt);
  } catch (error) {
    syncFailure(error);
    if (syncPullAttempts < SYNC_PULL_RETRY_LIMIT) {
      // The host route may not be mounted yet while the app is still booting.
      const delay = 1000 * Math.pow(2, syncPullAttempts);
      syncPullAttempts += 1;
      window.setTimeout(() => {
        pullHostLayout();
      }, delay);
    }
    return false;
  }
}

function adoptHostLayout(snapshot, updatedAt) {
  if (!snapshot || typeof snapshot !== "object") return false;
  const state = normalizeLayoutState(snapshot);
  layoutCache = state;
  const serialized = JSON.stringify(state);
  try {
    window.localStorage.setItem(STORAGE_KEY, serialized);
    window.localStorage.setItem(LAYOUT_BACKUP_KEY, serialized);
  } catch (err) {
    /* keep the in-memory copy */
  }

  const source = snapshot.drag && typeof snapshot.drag === "object" && !Array.isArray(snapshot.drag) ? snapshot.drag : null;
  if (source) {
    const drag = {};
    for (const scope of SCOPE_KEYS) drag[scope] = source[scope] !== false;
    dragCache = drag;
    try {
      window.localStorage.setItem(DRAG_KEY, JSON.stringify(drag));
    } catch (err) {
      /* keep the in-memory copy */
    }
  }

  // The adopted order is a deliberate snapshot; the one-shot 0.5.4 migration
  // must not reorder it on the next projection pass.
  for (const scope of SCOPE_KEYS) markScopeRepaired(scope);
  // From now on this window holds a layout the user cares about, so a later
  // edit here is worth publishing.
  markLayoutCustomized();

  writeSyncMeta(syncMeta({ updatedAt: Number(updatedAt) || 0, syncedAt: Date.now() }));
  syncDiag.adopted += 1;
  syncDiag.state = "ready";
  if (runtimeInstance) {
    try {
      runtimeInstance.refresh();
    } catch (err) {
      /* the next pass still applies the new layout */
    }
  }
  return true;
}

function onSyncWake() {
  if (document.visibilityState === "hidden") return;
  const now = Date.now();
  if (now - syncLastWakeAt < SYNC_WAKE_THROTTLE_MS) return;
  syncLastWakeAt = now;
  pullHostLayout();
}

// Settings-page switch. Turning sharing off leaves the local layout untouched
// and simply stops talking to the host (the pre-0.7.2 behaviour); turning it
// back on adopts the host copy, or publishes this window's layout when the host
// has nothing yet.
function setCrossWindowEnabled(enabled) {
  const next = enabled !== false;
  writeCrossWindowEnabled(next);
  if (next) {
    syncDiag.state = "idle";
    syncForceAdopt = true;
    pullHostLayout().then((adopted) => {
      syncForceAdopt = false;
      if (!adopted && isLayoutCustomized()) scheduleHostPush(SYNC_PUSH_DELAY_MS);
    });
  } else {
    if (syncPushTimer) {
      window.clearTimeout(syncPushTimer);
      syncPushTimer = 0;
    }
    syncPushQueued = false;
    syncResetQueued = false;
    syncDiag.state = "disabled";
  }
  return next;
}

function startHostSync() {
  if (syncStarted) return;
  syncStarted = true;
  document.addEventListener("visibilitychange", onSyncWake);
  window.addEventListener("focus", onSyncWake);
  if (!isCrossWindowEnabled()) {
    syncDiag.state = "disabled";
    return;
  }
  // The first projection pass is queued on a frame; wait for it so the row
  // order the host registered is known before deciding whether this window
  // holds a hand-made layout (see layoutArrangedByUser).
  const begin = () => {
    const meta = readSyncMeta();
    // A window that never synced may still hold a hand-made layout: 0.7.1 and
    // older had nowhere else to put one, so its copy is the only surviving
    // record of that work. Such a layout differs from the host's own
    // registration order (a boot-time registration always matches it) and is
    // claimed, i.e. published instead of being overwritten by a copy another
    // window pushed while the host route was missing.
    const preSyncWork = !Number(meta.syncedAt) && typeof layoutArrangedByUser === "function" && layoutArrangedByUser();
    if (preSyncWork) {
      markLayoutCustomized();
      syncClaiming = true;
    }
    writeSyncMeta(syncMeta());
    pullHostLayout().then((adopted) => {
      syncClaiming = false;
      if (adopted) return;
      if (preSyncWork) {
        scheduleHostPush(SYNC_PUSH_DELAY_MS, true);
        return;
      }
      if (isLayoutCustomized()) scheduleHostPush(SYNC_PUSH_DELAY_MS);
    });
  };
  if (typeof requestAnimationFrame === "function") requestAnimationFrame(() => begin());
  else begin();
}


function syncStatus() {
  const meta = readSyncMeta();
  return {
    state: syncDiag.state,
    route: SYNC_ROUTE,
    enabled: isCrossWindowEnabled(),
    customized: isLayoutCustomized(),
    updatedAt: Number(meta.updatedAt) || 0,
    syncedAt: Number(meta.syncedAt) || 0,
    client: meta.client || "",
    pushes: syncDiag.pushes,
    pulls: syncDiag.pulls,
    adopted: syncDiag.adopted,
    lastError: syncDiag.lastError,
  };
}

/* Icon markup helpers: serialize a rendered glyph and scope its element ids so
   that references like url(#mask) keep pointing at the copy inside the menu. */

let iconSeq = 0;

/**
 * Give every id inside a serialised <svg> a fresh prefix (including url(#…)
 * and href="#…" references). Icons such as dsh-context's draw themselves with
 * a per-instance <mask id>; reusing the original id made the copy resolve
 * `url(#…)` to the mask that lives inside the *hidden* original row, so the
 * menu icon came out blank.
 */
function scopeMarkupIds(markup, prefix) {
  const ids = [];
  const re = /\bid="([^"]+)"/g;
  let match;
  while ((match = re.exec(markup)) !== null) ids.push(match[1]);
  let out = markup;
  for (const id of ids) {
    const next = `${prefix}-${id}`;
    out = out.split(`id="${id}"`).join(`id="${next}"`);
    out = out.split(`url(#${id})`).join(`url(#${next})`);
    out = out.split(`href="#${id}"`).join(`href="#${next}"`);
  }
  return out;
}

/* Slot helpers: read registrations without ever writing to the host registry. */

function describeEntry(entry) {
  const options = entry && entry.options ? entry.options : entry || {};
  const id = typeof options.id === "string" ? options.id : null;
  let label = options.label;
  if (typeof label === "function") {
    try {
      label = label();
    } catch (err) {
      label = undefined;
    }
  }
  return { id, label: typeof label === "string" ? label : null };
}

function readEntries(ctx, slot) {
  try {
    const slots = ctx && ctx.slots;
    if (!slots || typeof slots.entriesOfSlot !== "function") return [];
    const entries = slots.entriesOfSlot(slot);
    return Array.isArray(entries) ? entries : [];
  } catch (err) {
    return [];
  }
}

function readPanelEntries(ctx) {
  return readEntries(ctx, PANEL_SLOT);
}

/* Discover the six host regions and pair their DOM rows with stable ids. */

const SCOPE_DEFS = [
  { key: "sidebar", axis: "y", more: true, slot: PANEL_SLOT, selector: '[data-slot="sidebar.panellist"]' },
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

function deriveId(target, label) {
  const attrs = ["data-panel", "data-view", "data-action", "data-testid", "data-id", "id", "aria-label", "name", "title"];
  if (target && target.getAttribute) {
    for (const attr of attrs) {
      const value = cleanLabel(target.getAttribute(attr));
      if (value) return value;
    }
  }
  const fromLabel = slug(label);
  return fromLabel ? `text:${fromLabel}` : "item";
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

function assignIds(rows, entries) {
  const used = new Set();
  const available = [];
  for (const entry of entries || []) {
    const info = describeEntry(entry);
    if (info.id) available.push({ id: info.id, label: info.label, taken: false });
  }
  rows.forEach((row) => {
    let picked = null;
    for (const entry of available) {
      if (!entry.taken && entry.label && row.label && entry.label === row.label) {
        picked = entry;
        break;
      }
    }
    if (!picked) {
      for (const entry of available) {
        if (!entry.taken) {
          picked = entry;
          break;
        }
      }
    }
    const base = picked ? picked.id : deriveId(row.target, row.label);
    if (picked) picked.taken = true;
    row.id = uniqueId(base, used);
  });
  return rows;
}

function collectSidebar(ctx) {
  // `sidebar.panellist` is the slot for each panel's icon, so the outlet lives
  // INSIDE the row button. Walking out from it is the only reliable way to find
  // the panel list itself; a generic "nav with buttons" scan can otherwise pick
  // the workspace/session nav and reorder user sessions along with panels.
  const outlet = document.querySelector('[data-slot="sidebar.panellist"]');
  let container = null;
  if (outlet) {
    const rowButton = outlet.closest("button");
    container = (rowButton && rowButton.parentElement) || outlet.closest("nav") || outlet.parentElement;
  }
  if (!container) {
    container = document.querySelector('nav[class*="panelList"], [class*="panelList"]');
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
    if (best) container = best;
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
    rows,
    more: more ? (more.parentElement !== container ? more.parentElement : more) : null,
    // Outline the real trigger button, never its Tooltip/flex wrapper: the
    // wrapper has square corners and makes the dashed ring look offset.
    moreTarget: more ? menuTriggerButton(more) : null,
  };
}

function collectUnits(container, options) {
  const opts = options || {};
  const rows = [];
  let more = null;
  for (const child of elementChildren(container)) {
    if (child.classList.contains("dso-ghost") || child.classList.contains("dso-indicator")) continue;
    if (child.closest && child.closest(".dso-config")) continue;
    if (isMoreTrigger(child)) {
      more = child;
      continue;
    }
    const target = clickableIn(child);
    if (!target) continue;
    if (opts.tabsOnly && !target.matches('[role="tab"]') && !child.matches('[role="tab"]')) continue;
    rows.push({ unit: child, target, label: labelOf(target) });
  }
  return { rows, more };
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
  if (units.length === 1) {
    const sole = units[0];
    const nested = elementChildren(sole).filter((child) => clickableIn(child));
    if (nested.length > 1) units = nested;
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
  return {
    scope,
    axis: options && options.axis ? options.axis : "x",
    container,
    rows: collected.rows,
    tails: tails.filter((child) => child !== more),
    more,
    // The session header's "More actions" button is host chrome, not an
    // overflow caret at the end of a strip: it must keep the slot the host
    // gave it (right after the split control) and never be sorted or tucked.
    moreIsChrome: !!(options && options.fixedMore && collected.more),
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
  if (!units.length) {
    units = Array.from(list.querySelectorAll('button, [role="tab"]'));
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
  const collected = collectUnits(container, { axis: "y" });
  return {
    scope: "settings",
    axis: "y",
    container,
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
    assignIds(found.rows, entries);
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
    tagHostMenuItems(menu);
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

  function tagHostMenuItems(menu) {
    if (!menu || !menu.isConnected) return;
    const store = readHostActions();
    let changed = false;
    let index = 0;
    for (const node of menu.querySelectorAll('[role="menuitem"]')) {
      if (node.closest(".dso-header-tucked") || node.closest(".dso-settings-more-menu")) continue;
      const label = (node.textContent || "").trim();
      if (!label) continue;
      const id = HOST_ACTION_PREFIX + index;
      index += 1;
      node.dataset.dsoHostId = id;
      if (node.dataset.dsoMoreKey !== "header:" + id) node.dataset.dsoMoreKey = "header:" + id;
      const svg = node.querySelector("svg");
      const icon = svg ? svg.outerHTML : "";
      const prev = store[id];
      if (!prev || prev.label !== label || prev.icon !== icon) {
        store[id] = { label, icon };
        changed = true;
      }
    }
    if (changed) writeHostActions(store);
  }

  function createHostActionButton(slot, id, meta) {
    const button = document.createElement("button");
    button.type = "button";
    button.id = id;
    button.className = "dso-host-action";
    button.setAttribute("aria-label", meta.label);
    button.title = meta.label;
    if (meta.icon) {
      button.innerHTML = meta.icon;
    } else {
      const label = document.createElement("span");
      label.className = "dso-host-action-text";
      label.textContent = meta.label;
      button.appendChild(label);
    }
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      openHostAction(id);
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
      const meta = store[id] || { label: id.slice(HOST_ACTION_PREFIX.length), icon: "" };
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
      if (!found || !found.rows.length) {
        warnOnce(`missing:${def.key}`, `no rows found for scope "${def.key}"`);
        continue;
      }
      state.found[def.key] = found;
      repairAppendedOrder(found);
      applyFound(found);
      seen += 1;
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
          fixed: !!row.fixed,
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
    showIndicator(gesture, snapshot.axis, hit.boundary, snapshot.container, snapshot.crossRect);
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
    if (dragged && gesture.scope === "header" && gesture.source === "menu") dismissHeaderMenu();
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
      reorderHidden(gesture.scope, gesture.id, target.index);
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
    // Step over the rows that are actually on screen, so an order entry for a
    // row the host has not mounted cannot swallow a keypress.
    const visible = presentIds(scope, visibleIds(scope));
    const index = visible.indexOf(id);
    if (index === -1) return;
    reorder(scope, id, index + delta);
    const next = findRowElement(scope, id);
    if (next && next.focus) next.focus();
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
    addListener(document, "keydown", onKeyDown, true);
    addListener(window, "scroll", onScroll, true);
    addListener(window, "resize", onResize);
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
    activate,
    hiddenForRegion,
    hiddenIds,
    labelFor,
    iconFor,
    status,
  };
}

/* Region-aware "More" menu rows: one component per host menu region. */

const HOST_MENU_ITEM = '[role="menuitem"]';

// The host's own menu rows are React components keyed by the view id they
// stand for (e.g. "context"). Reading the key off the fiber chain is the only
// way to tell a folded tucked view apart from an ordinary overflow row.
function fiberKeys(node) {
  const keys = [];
  const field = Object.keys(node).find(
    (name) => name.indexOf("__reactFiber$") === 0 || name.indexOf("__reactInternalInstance$") === 0
  );
  let fiber = field ? node[field] : null;
  for (let depth = 0; depth < 8 && fiber; depth += 1, fiber = fiber.return) {
    if (fiber.key !== null && fiber.key !== undefined) keys.push(String(fiber.key));
  }
  return keys;
}

function isOwnRow(node) {
  return !!(node.closest && node.closest(".dso-menu-item"));
}

// Hide the row wrapper rather than the button so its padding and separator
// spacing disappear with it. Restore the exact previous style attribute.
function hideRow(node) {
  const parent = node.parentElement;
  const wrapper =
    parent && parent !== document.body && parent.querySelectorAll(HOST_MENU_ITEM).length === 1
      ? parent
      : node;
  const previous = wrapper.getAttribute("style");
  wrapper.style.display = "none";
  return () => {
    if (!wrapper.isConnected) return;
    if (previous === null) wrapper.removeAttribute("style");
    else wrapper.setAttribute("style", previous);
  };
}

function hideFoldedTuckedRows(menu, hidden, entries) {
  const restores = [];
  const rows = Array.from(menu.querySelectorAll(HOST_MENU_ITEM)).filter((node) => !isOwnRow(node));
  const matched = new Set();
  for (const node of rows) {
    const hit = fiberKeys(node).find((key) => hidden.has(key));
    if (!hit) continue;
    matched.add(hit);
    restores.push(hideRow(node));
  }
  // Fallback for a host build whose folded rows do not carry the view id on
  // the fiber chain: folded entries render first, in registration order.
  if (Array.isArray(entries) && entries.length && rows.length) {
    for (let index = 0; index < entries.length && index < rows.length; index += 1) {
      const entry = entries[index];
      if (!entry || !hidden.has(entry.id) || matched.has(entry.id)) continue;
      const node = rows[index];
      const label = (node.textContent || "").trim();
      if (entry.label && label !== entry.label) continue;
      matched.add(entry.id);
      restores.push(hideRow(node));
    }
  }
  return () => {
    for (const restore of restores) restore();
  };
}

function createMenuEntry(region) {
  const React = sharedReact;
  if (!React) return null;

  function Row(props) {
    const runtime = runtimeInstance;
    const markup = props.icon === false || !runtime ? null : runtime.iconFor(props.scope, props.id);
    const icon = markup
      ? React.createElement("span", {
          className: "dso-menu-icon",
          dangerouslySetInnerHTML: { __html: markup },
        })
      : undefined;

    if (sharedMenuButton) {
      return React.createElement(
        sharedMenuButton,
        { key: props.scope + ":" + props.id, icon, onSelect: props.onSelect },
        props.label
      );
    }

    return React.createElement(
      "button",
      { type: "button", className: "dso-menu-row", onClick: props.onSelect },
      icon || null,
      React.createElement("span", { key: "label" }, props.label)
    );
  }

  function openHidden(runtime, scope, id, props) {
    const activated = runtime.activate(scope, id);
    if (props && props.onDismiss) props.onDismiss();
    if (!activated && props && props.onOpen) props.onOpen(id);
  }

  function PlainRows(props) {
    const { runtime, text, onOpen, onDismiss } = props;
    const hidden = runtime.hiddenForRegion(region);
    const children = [];
    if (hidden.length > 0) {
      children.push(
        React.createElement("div", { key: "caption", className: "dso-menu-caption" }, text.hidden)
      );
      for (const item of hidden) {
        children.push(
          React.createElement(
            "div",
            {
              key: item.scope + ":" + item.id,
              className: "dso-menu-item",
              "data-dso-more-key": item.scope + ":" + item.id,
            },
            React.createElement(
              "button",
              {
                type: "button",
                className: "dso-menu-row",
                onClick: () => {
                  if (runtime.activate(item.scope, item.id)) {
                    if (onDismiss) onDismiss();
                  } else {
                    if (onDismiss) onDismiss();
                    if (onOpen) onOpen(item.id);
                  }
                },
              },
              item.label
            )
          )
        );
      }
    }
    if (runtime.isCustomizedRegion(region)) {
      children.push(
        React.createElement(
          "button",
          {
            key: "reset",
            type: "button",
            className: "dso-menu-row",
            onClick: () => {
              runtime.resetRegion(region);
              if (onDismiss) onDismiss();
            },
          },
          text.reset
        )
      );
    }
    return React.createElement(React.Fragment, null, children);
  }

  class MenuBoundary extends React.Component {
    constructor(props) {
      super(props);
      this.state = { failed: false };
    }

    static getDerivedStateFromError() {
      return { failed: true };
    }

    componentDidCatch(error) {
      // eslint-disable-next-line no-console
      console.warn("[dsh-sidebar-organizer] More menu render failed; falling back to plain rows", error);
    }

    render() {
      return this.state.failed ? this.props.fallback : this.props.children;
    }
  }

  function RegionMenuContent(props) {
    const [, force] = React.useState(0);
    const captionRef = React.useRef(null);
    React.useEffect(() => {
      const runtime = runtimeInstance;
      if (!runtime) return undefined;
      return runtime.subscribe(() => force((value) => value + 1));
    }, []);
    React.useEffect(() => {
      const runtime = runtimeInstance;
      if (runtime) runtime.setDismiss(props && props.onDismiss);
      return () => {
        if (runtime) runtime.setDismiss(null);
      };
    }, [props && props.onDismiss]);

    // When the conversation pane is too narrow, the host stops rendering
    // overflow tabs in the strip and puts them into this very menu. A tucked
    // view then shows up as an ordinary host row above our "已收纳" block —
    // the bug where tucked views leaked back into view. Drop those host rows;
    // our own block lists the same views and opens them through onOpen.
    const useLayoutEffect = React.useLayoutEffect || React.useEffect;
    useLayoutEffect(() => {
      const runtime = runtimeInstance;
      if (region !== "conversation" || !runtime) return undefined;
      const caption = captionRef.current;
      const menu = caption && caption.closest ? caption.closest('[role="menu"]') : null;
      if (!menu) return undefined;
      const hidden = runtime.hiddenIds("tabs");
      if (!hidden.length) return undefined;
      return hideFoldedTuckedRows(menu, new Set(hidden), props && props.entries);
    });

    const runtime = runtimeInstance;
    if (!runtime) return null;
    const text = strings();
    const hidden = runtime.hiddenForRegion(region);
    const children = [];

    if (hidden.length > 0) {
      children.push(
        React.createElement(
          "div",
          { key: "caption", className: "dso-menu-caption", ref: captionRef },
          text.hidden
        )
      );
      for (const item of hidden) {
        children.push(
          React.createElement(
            "div",
            {
              key: item.scope + ":" + item.id,
              className: "dso-menu-item",
              "data-dso-more-key": item.scope + ":" + item.id,
            },
            React.createElement(Row, {
              scope: item.scope,
              id: item.id,
              label: item.label,
              onSelect: () => openHidden(runtime, item.scope, item.id, props),
            })
          )
        );
      }
    }

    if (runtime.isCustomizedRegion(region)) {
      children.push(
        React.createElement(Row, {
          key: "reset",
          scope: region,
          id: "__reset",
          label: text.reset,
          icon: false,
          onSelect: () => {
            runtime.resetRegion(region);
            if (props && props.onDismiss) props.onDismiss();
          },
        })
      );
    }

    if (children.length === 0) return null;
    return React.createElement(
      MenuBoundary,
      {
        fallback: React.createElement(PlainRows, {
          runtime,
          text,
          onOpen: props && props.onOpen,
          onDismiss: props && props.onDismiss,
        }),
      },
      React.createElement(React.Fragment, null, children)
    );
  }

  return RegionMenuContent;
}

/* Settings page and plugin-detail page body. */

function createSettingsPage() {
  const React = sharedReact;
  if (!React) return null;
  const h = React.createElement;

  function downloadConfig(runtime) {
    const text = JSON.stringify(runtime.exportConfig(), null, 2);
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = EXPORT_FILENAME;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function pickConfigFile(runtime, done) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    // A cancelled picker fires no `change`, so the temporary input would stay
    // on <body> forever. Remove it on `change` or when the window regains focus.
    let cleaned = false;
    function cleanup() {
      if (cleaned) return;
      cleaned = true;
      window.removeEventListener("focus", cleanup);
      if (input.parentNode) input.parentNode.removeChild(input);
    }
    input.addEventListener("change", () => {
      const file = input.files && input.files[0];
      cleanup();
      if (!file) return;
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        done(runtime.importConfig(String(reader.result || "")));
      });
      reader.addEventListener("error", () => done({ ok: false, reason: "read" }));
      reader.readAsText(file);
    });
    window.addEventListener("focus", cleanup);
    document.body.appendChild(input);
    input.click();
  }

  const ICON_PATHS = {
    up: "M6 14l6-6 6 6",
    down: "M6 10l6 6 6-6",
    hide: "M5 12h14",
    restore: "M12 5v14M5 12h14",
    reset: "M4 4v6h6M20 20v-6h-6M20 9a8 8 0 00-14-3L4 8M4 15a8 8 0 0014 3l2-2",
  };

  function Icon(props) {
    if (props.name === "grip") {
      return h(
        "svg",
        { viewBox: "0 0 24 24", width: props.size || 14, height: props.size || 14, fill: "currentColor", "aria-hidden": "true" },
        [
          [9, 6], [15, 6], [9, 12], [15, 12], [9, 18], [15, 18],
        ].map((point, index) =>
          h("circle", { key: index, cx: point[0], cy: point[1], r: 1.4 })
        )
      );
    }
    return h(
      "svg",
      {
        viewBox: "0 0 24 24",
        width: props.size || 14,
        height: props.size || 14,
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "1.8",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        "aria-hidden": "true",
      },
      h("path", { d: ICON_PATHS[props.name] || "" })
    );
  }

  function ActionButton(props) {
    return h(
      "button",
      {
        type: "button",
        className: "dso-config-btn",
        title: props.title,
        "aria-label": props.title,
        disabled: props.disabled,
        onClick: props.onClick,
      },
      h(Icon, { name: props.icon })
    );
  }

  function DragSwitch(props) {
    const text = props.text;
    const label = props.label === undefined ? text.drag : props.label;
    return h(
      "button",
      {
        type: "button",
        role: "switch",
        "aria-checked": props.enabled ? "true" : "false",
        className: "dso-config-switch" + (props.enabled ? " is-on" : ""),
        title: props.enabled
          ? props.titleOn || text.dragOn
          : props.titleOff || text.dragOff,
        onClick: props.onToggle,
      },
      h(
        "span",
        { className: "dso-config-switch-track", "aria-hidden": "true" },
        h("span", { className: "dso-config-switch-thumb" })
      ),
      label ? h("span", { className: "dso-config-switch-label" }, label) : null
    );
  }

  // The escape hatch for the cross-window copy: off means every window keeps
  // the layout it has locally and nothing is uploaded (pre-0.7.2 behaviour).
  function SyncCard(props) {
    const text = props.text;
    const [enabled, setEnabled] = React.useState(isCrossWindowEnabled());
    return h(
      "section",
      { className: "dso-config-card dso-config-card-sync" },
      h(
        "header",
        { className: "dso-config-card-head" },
        h("h4", { className: "dso-config-card-title" }, text.crossWindow),
        h(DragSwitch, {
          text,
          label: "",
          enabled,
          titleOn: text.crossWindowOn,
          titleOff: text.crossWindowOff,
          onToggle: () => setEnabled(setCrossWindowEnabled(!enabled)),
        })
      )
    );
  }

  function ScopeCard(props) {
    const runtime = runtimeInstance;
    const text = props.text;
    const scope = props.scope;
    const rows = scope.rows;
    const visible = rows.filter((row) => !row.hidden);
    const [over, setOver] = React.useState(null);
    const dragRef = React.useRef(null);

    if (!rows.length) {
      return h(
        "section",
        { className: "dso-config-card" },
        h(
          "header",
          { className: "dso-config-card-head" },
          h("h4", { className: "dso-config-card-title" }, text.scopeNames[scope.scope] || scope.scope)
        ),
        h("div", { className: "dso-config-empty" }, text.empty)
      );
    }

    function move(row, delta) {
      const index = visible.indexOf(row);
      if (index === -1) return;
      runtime.reorder(scope.scope, row.id, index + delta);
    }

    function dropOn(targetId) {
      const source = dragRef.current;
      if (!source || source === targetId) return;
      const targetIndex = visible.findIndex((row) => row.id === targetId);
      const sourceIndex = visible.findIndex((row) => row.id === source);
      if (targetIndex === -1 || sourceIndex === -1) return;
      let at = targetIndex;
      if (sourceIndex < targetIndex) at -= 1;
      runtime.reorder(scope.scope, source, at);
    }

    return h(
      "section",
      { className: "dso-config-card" },
      h(
        "header",
        { className: "dso-config-card-head" },
        h(
          "div",
          { className: "dso-config-card-heading" },
          h("h4", { className: "dso-config-card-title" }, text.scopeNames[scope.scope] || scope.scope),
          h(DragSwitch, {
            text,
            enabled: scope.dragEnabled !== false,
            onToggle: () => runtime.setDragEnabled(scope.scope, scope.dragEnabled === false),
          })
        ),
        h(
          "button",
          {
            type: "button",
            className: "dso-config-reset",
            onClick: () => runtime.resetScope(scope.scope),
          },
          text.resetScope
        )
      ),
      h(
        "div",
        { className: "dso-config-list" },
        rows.map((row) => {
          const index = visible.indexOf(row);
          const isHidden = row.hidden;
          return h(
            "div",
            {
              key: row.id,
              className:
                "dso-config-row" +
                (isHidden ? " is-hidden" : "") +
                (over === row.id ? " is-drop" : ""),
              draggable: !row.fixed && !isHidden,
              onDragStart: (event) => {
                dragRef.current = row.id;
                if (event.dataTransfer) {
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", row.id);
                }
              },
              onDragEnd: () => {
                dragRef.current = null;
                setOver(null);
              },
              onDragOver: (event) => {
                if (dragRef.current && !isHidden) {
                  event.preventDefault();
                  setOver(row.id);
                }
              },
              onDragLeave: () => {
                setOver((value) => (value === row.id ? null : value));
              },
              onDrop: (event) => {
                event.preventDefault();
                setOver(null);
                dropOn(row.id);
              },
            },
            row.fixed
              ? h("span", { className: "dso-config-grip is-fixed", title: text.pinned }, h(Icon, { name: "grip" }))
              : h("span", { className: "dso-config-grip" }, h(Icon, { name: "grip" })),
            h("span", { className: "dso-config-label", title: row.label }, row.label),
            isHidden
              ? h("span", { className: "dso-config-chip" }, text.hidden)
              : null,
            isHidden
              ? h(ActionButton, {
                  icon: "restore",
                  title: text.restore,
                  onClick: () => runtime.reveal(scope.scope, row.id),
                })
              : h(ActionButton, {
                  icon: "up",
                  title: text.up,
                  disabled: row.fixed || index <= 0,
                  onClick: () => move(row, -1),
                }),
            isHidden
              ? null
              : h(ActionButton, {
                  icon: "down",
                  title: text.down,
                  disabled: row.fixed || index === -1 || index >= visible.length - 1,
                  onClick: () => move(row, 1),
                }),
            !isHidden && !row.pinned && visible.length > 1
              ? h(ActionButton, {
                  icon: "hide",
                  title: text.tuck,
                  onClick: () => runtime.hide(scope.scope, row.id),
                })
              : null
          );
        })
      )
    );
  }

  function SettingsPage() {
    const [, force] = React.useState(0);
    const [notice, setNotice] = React.useState(null);
    const noticeTimer = React.useRef(null);
    React.useEffect(() => () => {
      if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
    }, []);
    React.useEffect(() => {
      const runtime = runtimeInstance;
      if (!runtime) return undefined;
      runtime.refresh();
      force((value) => value + 1);
      return runtime.subscribe(() => force((value) => value + 1));
    }, []);

    const runtime = runtimeInstance;
    if (!runtime) return null;
    const text = strings();
    const scopes = runtime.snapshot();

    function flash(message, tone) {
      setNotice({ text: message, tone });
      if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
      noticeTimer.current = window.setTimeout(() => setNotice(null), 3200);
    }

    return h(
      "div",
      { className: "dso-config" },
      h(
        "header",
        { className: "dso-config-head" },
        h("h3", { className: "dso-config-title" }, text.settingsTitle),
        h(
          "div",
          { className: "dso-config-actions" },
          h(
            "button",
            {
              type: "button",
              className: "dso-config-action",
              title: text.exportHint,
              onClick: () => {
                downloadConfig(runtime);
                flash(text.exportOk, "ok");
              },
            },
            text.exportConfig
          ),
          h(
            "button",
            {
              type: "button",
              className: "dso-config-action",
              title: text.importHint,
              onClick: () => {
                pickConfigFile(runtime, (result) => {
                  if (result.ok) {
                    flash(text.importOk, "ok");
                  } else {
                    flash(result.reason === "version" ? text.importVersion : text.importInvalid, "error");
                  }
                });
              },
            },
            text.importConfig
          ),
          runtime.isCustomized()
            ? h(
                "button",
                {
                  type: "button",
                  className: "dso-config-reset",
                  onClick: () => runtime.reset(),
                },
                text.reset
              )
            : null
        )
      ),
      notice
        ? h(
            "p",
            {
              className: "dso-config-notice",
              "data-tone": notice.tone,
              role: "status",
            },
            notice.text
          )
        : null,
      h(SyncCard, { text }),
      scopes.map((scope) => h(ScopeCard, { key: scope.scope, scope, text }))
    );
  }

  return SettingsPage;
}

/* Plugin entry: styles, module lookup, slot registration, apply(). */

function ensureStyles() {
  const id = "dsh-sidebar-organizer/panel-order.css";
  if (document.querySelector(`style[data-plugin-css="${id}"]`)) return;
  const style = document.createElement("style");
  style.dataset.pluginCss = id;
  style.textContent = CSS;
  document.head.appendChild(style);
}

function safeRequire(name) {
  if (!sharedRequire) return null;
  try {
    return sharedRequire(name);
  } catch (error) {
    return null;
  }
}

function pluginNameOf(props) {
  const subject = props && props.subject;
  if (!subject) return null;
  if (subject.pkg && subject.pkg.name) return subject.pkg.name;
  if (subject.name) return subject.name;
  if (subject.id) return subject.id;
  return null;
}

function apply(ctx) {
  // eslint-disable-next-line no-console
  console.info("[dsh-sidebar-organizer] client loaded v" + VERSION);
  // hot-reload safety: dispose a previous instance before installing
  try {
    const previous = window.__dshSidebarOrganizer;
    if (previous && typeof previous.dispose === "function") previous.dispose();
  } catch (error) {
    /* ignore */
  }

  sharedReact = sharedReact || safeRequire("react");
  if (!sharedMenuButton) {
    const primitives = safeRequire("@deepseek-ai/dsh-client-ui-primitives");
    sharedMenuButton = primitives && primitives.MenuItemButton ? primitives.MenuItemButton : null;
  }

  let runtime = null;
  ctx.effect(() => {
    ensureStyles();
    runtime = createRuntime(ctx);
    runtimeInstance = runtime;
    runtime.start();
    return () => {
      if (runtime) runtime.stop();
      if (runtimeInstance === runtime) runtimeInstance = null;
      runtime = null;
    };
  });

  const canSlots = !!(ctx.slots && typeof ctx.slots.inject === "function" && typeof ctx.slots.register === "function");

  // One menu component per host region. Rows never re-register, so they cannot
  // feed back into the slot subscriptions they live in.
  for (const region of Object.keys(MORE_SLOTS)) {
    const slot = MORE_SLOTS[region];
    const entry = createMenuEntry(region);
    if (!entry || !canSlots) continue;
    try {
      ctx.slots.inject(slot, () =>
        ctx.slots.register(
          {
            name: slot,
            id: "panel-organizer",
            order: 100,
            registrant: REGISTRANT,
          },
          entry
        )
      );
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn("[dsh-sidebar-organizer] cannot add the More-menu row for " + region, error);
    }
  }

  const SettingsPage = createSettingsPage();
  if (SettingsPage && canSlots) {
    try {
      ctx.slots.inject(SETTINGS_SLOT, () =>
        ctx.slots.register(
          {
            name: SETTINGS_SLOT,
            id: SETTINGS_ID,
            order: 35,
            label: () => strings().settingsTitle,
            registrant: REGISTRANT,
          },
          SettingsPage
        )
      );
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn("[dsh-sidebar-organizer] cannot add the settings section", error);
    }

    try {
      ctx.slots.inject("plugins.detail.section", () =>
        ctx.slots.register(
          {
            name: "plugins.detail.section",
            id: SETTINGS_ID,
            order: 10,
            registrant: REGISTRANT,
          },
          function PluginSettingsPage(props) {
            if (pluginNameOf(props) !== PLUGIN_ID) return null;
            return sharedReact ? sharedReact.createElement(SettingsPage) : null;
          }
        )
      );
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn("[dsh-sidebar-organizer] cannot add the plugin-detail section", error);
    }
  }

  // The settings row only exists after this plugin registers it. Ask for one
  // more projection pass so the settings scope sees its own row immediately.
  if (runtime) runtime.pass();

  // One layout, every window: the Host half keeps the copy the desktop window
  // and a browser tab on another origin (or another port) both read.
  startHostSync();

  window.__dshSidebarOrganizer = {
    version: VERSION,
    pass: () => runtime && runtime.pass(),
    refresh: () => runtime && runtime.refresh(),
    snapshot: () => (runtime ? runtime.snapshot() : []),
    reset: () => runtime && runtime.reset(),
    exportConfig: () => (runtime ? runtime.exportConfig() : null),
    importConfig: (value) => (runtime ? runtime.importConfig(value) : { ok: false, reason: "inactive" }),
    resetScope: (scope) => runtime && runtime.resetScope(scope),
    resetRegion: (region) => runtime && runtime.resetRegion(region),
    hide: (scope, id) => {
      if (!runtime) return false;
      if (id === undefined) return runtime.hide("sidebar", scope);
      return runtime.hide(scope, id);
    },
    reveal: (scope, id, index) => {
      if (!runtime) return false;
      if (id === undefined) return runtime.reveal("sidebar", scope);
      return runtime.reveal(scope, id, index);
    },
    reorder: (scope, id, index) => runtime && runtime.reorder(scope, id, index),
    activate: (scope, id) => runtime && runtime.activate(scope, id),
    hiddenForRegion: (region) => (runtime ? runtime.hiddenForRegion(region) : []),
    hiddenIds: (scope) => (runtime ? runtime.hiddenIds(scope) : []),
    isCustomized: (scope) => !!(runtime && runtime.isCustomized(scope)),
    isCustomizedRegion: (region) => !!(runtime && runtime.isCustomizedRegion(region)),
    isDragEnabled: (scope) => !!(runtime && runtime.isDragEnabled(scope)),
    setDragEnabled: (scope, enabled) => !!(runtime && runtime.setDragEnabled(scope, enabled)),
    disable: () => {
      try {
        window.localStorage.setItem(DISABLED_KEY, "1");
      } catch (error) {
        /* ignore */
      }
      if (runtime) runtime.stop();
    },
    dispose: () => {
      if (runtime) runtime.stop();
      runtime = null;
      runtimeInstance = null;
    },
    status: () => {
      if (!runtime) return { version: VERSION, scopes: {} };
      const status = runtime.status();
      status.entries = readPanelEntries(ctx).length;
      return status;
    },
    syncStatus: () => syncStatus(),
    syncNow: () => pullHostLayout(),
    isCrossWindow: () => isCrossWindowEnabled(),
    setCrossWindow: (enabled) => setCrossWindowEnabled(enabled),
  };
  // backward-compatible handle for consoles/docs written before the rename
  window.__dshModmenu = window.__dshSidebarOrganizer;
}
    sharedRequire = require;
    return {
      apply,
      inject: ["slots"],
    };
  },
});
