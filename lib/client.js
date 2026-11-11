/**
 * dsh-sidebar-organizer — client half (v0.10.1).
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
const VERSION = "0.10.1";

const PLUGIN_ID = "dsh-sidebar-organizer";
const PANEL_SLOT = "sidebar.panellist";
const FOOTER_SLOT = "sidebar.footer.action";
const TABS_SLOT = "conversation.view";
const COMPOSER_SLOT = "conversation.composer.dock";
const SETTINGS_SLOT = "settings.section";
// DSH 0.2.2 renders one icon per settings section through this slot, keyed by
// the section id, so the id above has to match the registration below.
const SETTINGS_ICON_SLOT = "settings.section.icon";
const SETTINGS_ID = "layout-organizer";
// Which of the candidate glyphs in settings.js the nav row shows.
const SETTINGS_NAV_ICON = "drag";
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
// The shipped "More actions" menu keeps its own item order on the host side.
// Dragging one of those rows over another now persists the visual order here
// (labels, not generated ids: the host assigns ids by DOM position, so a host
// reorder would silently rebind them). Applied through `style.order` on the
// menu's flex viewport, never by moving React-owned nodes.
const HOST_MENU_ORDER_KEY = "dsh.sidebar-organizer.host-menu-order.v1";
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
// Optional keyboard gate for dragging. `code` empty means "not bound" and the
// gate stays open, i.e. the plain long-press behaviour. `hold` requires the key
// to be held while the long press starts; `toggle` flips a sticky state on each
// press. Both may be on at once.
const HOTKEY_KEY = "dsh.sidebar-organizer.hotkey.v1";
// 0.2.2's unified right-click menus are the only surface these rows live on: the
// session row menu and the workspace row menu. Both are host-rendered (rows come
// from ctx.contextMenus registrations), so the custom order and the user's
// dividers are applied to the open DOM and remembered here. Dividers are stored
// as GAP indexes, never attached to a row: the user asked for a separator that
// stays where it was placed when rows move across it.
const CONTEXT_MENU_KEY = "dsh.sidebar-organizer.context-menu.v1";
const CONTEXT_MENU_KINDS = ["session", "workspace"];
const CONTEXT_MENU_VERSION = 1;
// dsh-sidebar-row-menu draws its own blank-conversation menu from the session
// header toolbar. Its first level normally follows the header order (and its
// More submenu follows HOST_MENU_ORDER_KEY), so that one-way linkage stays
// untouched until the user actually drags a row in that menu. From then on the
// menu keeps its own order here, independent of the toolbar. Its submenus are
// managed the same way; the More submenu is persisted through the host key
// above because row-menu sorts it from there on every open.
const ROW_MENU_LAYOUT_KEY = "dsh.sidebar-organizer.row-menu-layout.v1";
const ROW_MENU_LAYOUT_VERSION = 1;
const ROW_MENU_PANES = ["first", "openwith", "more"];
const ROW_MENU_SCOPE = "rowmenu";
const ROW_MENU_ATTR = "data-dsh-sidebar-row-menu";
const ROW_MENU_ID_ATTR = "data-dso-rm-id";
const ROW_MENU_SEP_ATTR = "data-dso-rm-sep";
const ROW_MENU_PANE_CLASS = "dso-rm-pane";
// Dividers are positional (a gap under the Nth visible row), exactly like the
// host menu's. The marker keeps our injected separators out of the pane scan.
const ROW_MENU_DIVIDER_ATTR = "data-dso-rm-divider";
// A 更多操作 entry the user pulled into the first level becomes our own row:
// row-menu has no idea it exists, so we render it and remember which host
// action it runs.
const ROW_MENU_PROMOTED_ATTR = "data-dso-rm-promoted";
const ROW_MENU_HIDDEN_ATTR = "data-dso-rm-hidden";
// Keys that only exist as modifiers cannot be a binding on their own; the
// capture UI waits for the non-modifier key of the chord.
const HOTKEY_MODIFIER_KEYS = {
  Control: true,
  Shift: true,
  Alt: true,
  Meta: true,
  OS: true,
  CapsLock: true,
  AltGraph: true,
  Fn: true,
  FnLock: true,
  NumLock: true,
  ScrollLock: true,
  Dead: true,
};
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
// How long a pass skipped by the loop watchdog waits before retrying.
const PASS_RETRY_MS = 400;
// How long a right-click's menu-kind hint may be used by the first sync.
const CONTEXT_PENDING_TTL = 2000;
// dsh-sidebar-row-menu's blank menu is fixed at 2147483647; the ghost is
// appended to <body> after it, so an equal z-index wins on DOM order while a
// lower one would hide the dragged row behind that menu.
const GHOST_Z = 2147483647;

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
    resetScope: "重置全部右键菜单",
    resetScopeHint: "清空会话与工作区右键菜单的排序、分隔线和收纳（含会话菜单还原）",
    resetRowMenu: "仅还原会话菜单",
    resetRowMenuHint: "只把会话右键菜单恢复成跟随右上栏工具顺序，工作区菜单不受影响",
    restore: "恢复显示",
    tuck: "收进更多",
    up: "上移",
    down: "下移",
    empty: "此位置暂无可整理项",
    pinned: "固定",
    fixed: "宿主固定，位置不可调",
    more: "更多",
    moreMenu: "已收纳的设置项",
    drag: "拖动",
    dragOn: "此区域可拖动",
    dragOff: "此区域拖动已关闭",
    crossWindow: "跨窗口共用布局",
    crossWindowOn: "桌面端与网页端共用同一份布局",
    crossWindowOff: "各窗口只使用自己的本地布局",
    hotkey: "拖动热键",
    hotkeyUnbound: "未绑定",
    hotkeyRecording: "按下按键…",
    hotkeyClear: "清除",
    hotkeyBindHint: "点击后按下要绑定的组合键，点击空白处取消",
    hotkeyHold: "长按",
    hotkeyToggle: "开关",
    hotkeyHoldOn: "只有按住热键时才能拖动",
    hotkeyHoldOff: "长按模式已关闭",
    hotkeyToggleOn: "按一下热键开启拖动，再按一下关闭",
    hotkeyToggleOff: "开关模式已关闭",
    hotkeyNeedKey: "先绑定一个热键",
    contextMenu: "右键菜单",
    contextMenuOn: "会话与工作区右键菜单可拖动、可加分隔线，拖到底部收进「更多」",
    contextMenuOff: "右键菜单整理已关闭",
    contextMenuMore: "已收纳的菜单项",
    contextMenuMoreEmpty: "把菜单项拖到「更多」即可收纳",
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
    resetScope: "Reset all context menus",
    resetScopeHint: "Clears order, dividers and tucked rows in session and workspace menus (includes restoring the session menu)",
    resetRowMenu: "Restore session menu only",
    resetRowMenuHint: "Restores only the session menu to the header toolbar order; workspace menus stay as they are",
    restore: "Restore",
    tuck: "Move into More",
    up: "Move up",
    down: "Move down",
    empty: "Nothing to organize here yet",
    pinned: "Pinned",
    fixed: "Fixed by the host, cannot be moved",
    more: "More",
    moreMenu: "Hidden settings items",
    drag: "Drag",
    dragOn: "Dragging enabled in this section",
    dragOff: "Dragging disabled in this section",
    crossWindow: "Shared layout",
    crossWindowOn: "Desktop and web windows share one layout",
    crossWindowOff: "Each window keeps its own local layout",
    hotkey: "Drag hotkey",
    hotkeyUnbound: "Not bound",
    hotkeyRecording: "Press keys…",
    hotkeyClear: "Clear",
    hotkeyBindHint: "Click, then press the key combination; click elsewhere to cancel",
    hotkeyHold: "Hold",
    hotkeyToggle: "Toggle",
    hotkeyHoldOn: "Dragging only while the hotkey is held",
    hotkeyHoldOff: "Hold mode is off",
    hotkeyToggleOn: "Press once to enable dragging, again to disable",
    hotkeyToggleOff: "Toggle mode is off",
    hotkeyNeedKey: "Bind a hotkey first",
    contextMenu: "Context menus",
    contextMenuOn: "Session and workspace menus can be reordered, divided, and tucked into More",
    contextMenuOff: "Context menu organizing is off",
    contextMenuMore: "Hidden menu items",
    contextMenuMoreEmpty: "Drag a menu item onto More to tuck it away",
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

/* ---- hotkey labels ------------------------------------------------------ */

const HOTKEY_KEY_LABELS = {
  " ": "Space",
  ArrowUp: "↑",
  ArrowDown: "↓",
  ArrowLeft: "←",
  ArrowRight: "→",
  Escape: "Esc",
  Enter: "Enter",
  Backspace: "Backspace",
  Delete: "Delete",
  Tab: "Tab",
  PageUp: "PgUp",
  PageDown: "PgDn",
  Home: "Home",
  End: "End",
  Insert: "Ins",
  ContextMenu: "Menu",
};

function isHotkeyModifier(eventKey) {
  return !!HOTKEY_MODIFIER_KEYS[eventKey];
}

function hotkeyKeyLabel(config) {
  const key = String((config && config.key) || "");
  if (key) {
    if (HOTKEY_KEY_LABELS[key]) return HOTKEY_KEY_LABELS[key];
    if (key.length === 1) return key.toUpperCase();
    return key;
  }
  const code = String((config && config.code) || "");
  if (!code) return "";
  if (/^Key[A-Z]$/.test(code)) return code.slice(3);
  if (/^Digit[0-9]$/.test(code)) return code.slice(5);
  if (/^Numpad/.test(code)) return "Num" + code.slice(6);
  return code;
}

// "Ctrl + Alt + Q" — used by the settings card and the button title. Kept out
// of the hotkey config so the stored shape stays platform-neutral.
function hotkeyLabel(config) {
  if (!config || !config.code) return "";
  const mac = /mac|iphone|ipad/i.test(
    String((typeof navigator !== "undefined" && navigator.platform) || "")
  );
  const parts = [];
  if (config.ctrl) parts.push(mac ? "⌃" : "Ctrl");
  if (config.alt) parts.push(mac ? "⌥" : "Alt");
  if (config.shift) parts.push(mac ? "⇧" : "Shift");
  if (config.meta) parts.push(mac ? "⌘" : "Win");
  parts.push(hotkeyKeyLabel(config));
  return parts.join(" + ");
}

function matchesHotkey(event, config) {
  if (!config || !config.code) return false;
  return (
    event.code === config.code &&
    !!event.ctrlKey === !!config.ctrl &&
    !!event.altKey === !!config.alt &&
    !!event.shiftKey === !!config.shift &&
    !!event.metaKey === !!config.meta
  );
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
  /* A frosted pane, not an opaque tile: the drop line lives on the same
     z-index and is mounted under the preview, so the preview samples it
     through this filter instead of cutting it off. */
  -webkit-backdrop-filter: blur(0.5px) saturate(1.15) brightness(0.78);
  backdrop-filter: blur(0.5px) saturate(1.15) brightness(0.78);
  border-radius: var(--dsw-radius-md, 6px);
  background: var(--dso-ghost-fill, rgba(24, 24, 27, 0.5)) !important;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.28), 0 2px 6px rgba(0, 0, 0, 0.16);
  transform: scale(1.03);
}
/* Glyph-only rows (session-header icons) have no surface to lift: painting the
   sidebar fill made the 28px drag preview a black rounded tile. Keep the glyph
   and the drop feedback, drop the fabricated card and its shadow. */
.dso-ghost.dso-ghost-flat {
  background: transparent !important;
  box-shadow: none !important;
  -webkit-backdrop-filter: none;
  backdrop-filter: none;
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
body.dso-dragging [data-dso-more-key],
body.dso-dragging [data-dso-ctx-more-key] { pointer-events: none !important; }
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
/* The hotkey header holds the bind control; its mode row owns the divider. */
.dso-config-card-hotkey .dso-config-card-head { border-bottom: none; }
/* The context-menu card is a single header row as well. */
.dso-config-card-context .dso-config-card-head { border-bottom: none; }
.dso-config-hotkey-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
}
.dso-config-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: none;
}
.dso-config-hotkey {
  flex: none;
  padding: 2px 8px;
  border: 1px solid var(--dsw-alias-border-secondary, rgba(255, 255, 255, 0.16));
  border-radius: 6px;
  background: transparent;
  color: var(--dsw-alias-label-secondary, rgba(235, 235, 245, 0.62));
  font: inherit;
  font-size: 11px;
  line-height: 16px;
  cursor: pointer;
}
.dso-config-hotkey:hover,
.dso-config-hotkey:focus-visible {
  border-color: var(--dsw-alias-border-primary, rgba(255, 255, 255, 0.3));
  color: var(--dsw-alias-label-primary, #ebebf5);
}
.dso-config-hotkey.is-bound { color: var(--dsw-alias-label-primary, #ebebf5); }
.dso-config-hotkey.is-recording {
  border-color: var(--dsw-alias-state-business-primary, #4d6bfe);
  color: var(--dsw-alias-state-business-primary, #4d6bfe);
}
.dso-config-hotkey:focus-visible {
  outline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary, #4d6bfe));
  outline-offset: 1px;
}
.dso-config-hotkey-modes {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
  padding: 7px 12px;
  border-top: 1px solid var(--dsw-alias-border-secondary, rgba(255, 255, 255, 0.08));
}
.dso-config-switch.is-disabled {
  opacity: 0.4;
  cursor: default;
}
.dso-config-switch.is-disabled:hover { color: var(--dsw-alias-label-secondary, rgba(235, 235, 245, 0.62)); }
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
/* Fallback divider for a host menu that ships no separator to clone. The real
   build copies the host's own separator; this only keeps the feature from
   silently drawing nothing if a future build renames those classes. */
.dso-ctx-divider {
  flex: none;
  height: 1px;
  margin: 4px 8px;
  background: var(--dsw-alias-border-l2, rgba(255, 255, 255, 0.12));
  pointer-events: none;
}
/* ---------------------------------------------------------- context More --
   A right-click menu has no host-owned "More" row, so the anchor is a flex
   item appended to the menu viewport with a late order. The popup that lists
   the tucked rows hangs off the same menu element instead of <body>, so the
   host's outside-click closer still reads a click in it as "inside the menu".
   Margins stay 0: the host viewport already spaces its rows, and any extra
   padding here showed up as a gap under the last real row. */
.dso-ctx-more {
  display: flex;
  flex: none;
  box-sizing: border-box;
  padding: 0;
  margin: 0;
}
/* The armed anchor keeps the full "drop here" feedback — it shrinks to 0.94 and
   breathes, as the sidebar targets do. Hit-testing measures the wrapper
   ([data-dso-ctx-more]), which never scales, so the shrink cannot move the drop
   target out from under the pointer: the class also toggles at most once per
   gesture (markDropMore is idempotent), so the scale transition never restarts
   on pointermove. */
/* Row geometry is copied from the host's own menu item
   (._item_1p5el_105: min-height 34, padding 6px 8px, gap 6, radius md,
   13px/20px), so the anchor sits in the list with the same rhythm as the rows
   the host paints itself. */
.dso-ctx-more-trigger {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1 1 auto;
  width: 100%;
  min-height: 34px;
  padding: 6px 8px;
  border: 0;
  border-radius: var(--dsw-radius-md, 6px);
  background: transparent;
  color: var(--dsw-alias-label-primary, #ebebf5);
  font-family: inherit;
  font-size: 13px;
  line-height: 20px;
  text-align: left;
  cursor: pointer;
  -webkit-user-select: none;
  user-select: none;
}
.dso-ctx-more-trigger:hover,
.dso-ctx-more-trigger[aria-expanded="true"] {
  background: var(--dsw-alias-interactive-bg-hover, rgba(255, 255, 255, 0.08));
}
.dso-ctx-more-dots {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 14px;
  height: 14px;
  color: var(--dsw-alias-menu-icon, var(--dsw-alias-label-secondary, rgba(235, 235, 245, 0.62)));
  font-size: 13px;
  line-height: 14px;
  text-align: center;
  letter-spacing: 1px;
}
.dso-ctx-more-label { flex: 1 1 auto; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.dso-ctx-more-chevron {
  flex: none;
  margin-left: auto;
  color: var(--dsw-alias-label-caption, rgba(235, 235, 245, 0.4));
  font-size: 15px;
  line-height: 16px;
}
/* Same surface recipe as the host menu and as dsh-sidebar-row-menu's submenu,
   which mounts the host's MenuSurface + MenuItemButton primitives:
     ._list_1p5el_7,._submenu_1p5el_8 { padding:4px; display:flex; column;
       gap:0; border:0; box-shadow: var(--dsw-elevation-prominent);
       --dsw-elevation-stroke-color: var(--dsw-alias-border-l1) }
     ._material_1w4el_21 { background: var(--dsw-menu-surface-fill);
       backdrop-filter: var(--dsw-menu-backdrop-filter) }
   The host splits the fill into an absolutely positioned backing layer; a single
   fixed panel only needs the same two properties on itself. */
.dso-ctx-panel {
  position: fixed;
  z-index: 2147482601;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 0;
  min-width: 180px;
  max-width: 300px;
  max-height: min(380px, 64vh);
  overflow-x: hidden;
  overflow-y: auto;
  padding: 4px;
  border: 0;
  border-radius: var(--dsw-radius-lg, 12px);
  background: var(--dsw-menu-surface-fill, var(--dsw-specific-sidebar-fill, #202024));
  -webkit-backdrop-filter: var(--dsw-menu-backdrop-filter, none);
  backdrop-filter: var(--dsw-menu-backdrop-filter, none);
  /* dsh-sidebar-row-menu's panel (MenuSurface + 'dsrm-submenu', no '_list_'
     class) measures box-shadow: none — the translucent fill alone carries the
     edge. Matching it keeps the two submenus indistinguishable. */
  box-shadow: none;
  --dsh-scrollbar-thumb: var(--dsw-alias-scrollbar-bg-l2);
  --dsh-scrollbar-thumb-hover: var(--dsw-alias-scrollbar-hover-l2);
}
/* dsh-sidebar-row-menu's MenuSurface ships display:block, so an inline
   style.order would be ignored. Once the user arranges one of its panes we
   turn the pane itself into a flex column; the host's absolutely positioned
   material layer leaves the flow, and its own left/top/size stay untouched. */
.dsrm-menu-surface.dso-rm-pane,
.dsrm-submenu.dso-rm-pane {
  display: flex !important;
  flex-direction: column;
}
/* Submenus scroll (max-height 64vh); without this the rows would shrink to
   fit instead of overflowing. */
.dso-rm-pane > * { flex: 0 0 auto; }
/* 1:1 with the host's menu item (._item_1p5el_105). */
.dso-ctx-panel-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: none;
  width: 100%;
  min-height: 34px;
  padding: 6px 8px;
  border: 0;
  border-radius: var(--dsw-radius-md, 6px);
  background: transparent;
  color: var(--dsw-alias-label-primary, #ebebf5);
  font-family: inherit;
  font-size: 13px;
  line-height: 20px;
  text-align: left;
  cursor: pointer;
  -webkit-user-select: none;
  user-select: none;
}
.dso-ctx-panel-row[aria-disabled="true"] {
  cursor: default;
  opacity: 0.4;
}
.dso-ctx-panel-row:hover:not(:disabled):not([aria-disabled="true"]),
.dso-ctx-panel-row:focus-visible {
  background: var(--dsw-alias-interactive-bg-hover, rgba(255, 255, 255, 0.08));
  outline: none;
}
/* Host icon slot (._itemIcon_1p5el_165): 14x14, menu-icon colour. */
.dso-ctx-panel-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 14px;
  height: 14px;
  color: var(--dsw-alias-menu-icon, var(--dsw-alias-label-secondary, rgba(235, 235, 245, 0.62)));
}
.dso-ctx-panel-icon svg { width: 14px; height: 14px; }
/* The cloned host icon box keeps its own size; do not let it squash the glyph. */
.dso-ctx-panel-icon > svg,
.dso-ctx-panel-icon > img,
.dso-ctx-panel-icon > span { flex: none; max-width: 14px; max-height: 14px; }
.dso-ctx-panel-icon-empty { visibility: hidden; }
.dso-ctx-panel-label { flex: 1 1 auto; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
/* The host fades its menu when the menu mounts or unmounts, but only on its own
   direct children (._surface[data-menu-phase] > *). A customized menu flattens
   the viewport/footer blocks with display:contents, so the rows they hold no
   longer inherit that fade. Those rows get the fade back through these two
   classes, applied per element by the runtime — never as a class on the menu,
   which would also hit the host's still-animated direct children and restart
   their animation every time the class came off (the 0.9.2 flicker loop).
   The variables carry the host's OWN animation name and timing, read off an
   animated sibling when the phase flips, so the rows run the host's keyframes
   rather than a look-alike; the keyframes below only serve as a fallback. */
@keyframes dso-ctx-fade-out {
  from { opacity: 1; }
  to { opacity: 0; }
}
@keyframes dso-ctx-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
.dso-ctx-mirror-out {
  animation: dso-ctx-fade-out var(--dso-ctx-out-duration, 80ms) ease-in both;
}
.dso-ctx-mirror-in {
  animation: dso-ctx-fade-in var(--dso-ctx-in-duration, 40ms) ease-out;
}
`;

/* Persistent per-scope layout state (v3). */

// v4 adds per-scope id aliases: a row whose label carries a live count or
// status ("IP 防护：0 个黑洞") keeps the id it was first saved under instead of
// becoming an orphan every time the number changes.
const STATE_VERSION = 4;
const PREVIOUS_STATE_VERSION = 3;
const EXPORT_FORMAT = "dsh-sidebar-organizer";
const EXPORT_FILENAME = "dsh-sidebar-organizer.json";
// 0.4.x shares STORAGE_KEY but only understands the flat sidebar layout: loading
// that build rewrites the key as {version:2,order,hidden}, dropping every other
// scope and the tucked rows. Keep a full snapshot beside it so the next 0.5.x
// load can put the configuration back instead of losing it for good.
const LAYOUT_BACKUP_KEY = `${STORAGE_KEY}.v3-backup`;
let layoutCache = null;
let dragCache = null;
let hotkeyCache = null;
let contextMenuCache = null;
let rowMenuCache = null;
// The raw string the cache was parsed from, so another window writing the key
// invalidates the copy instead of being silently ignored.
let rowMenuCacheRaw = null;

function emptyScopeLayout() {
  return { order: [], hidden: [] };
}

function emptyLayoutState() {
  return { version: STATE_VERSION, scopes: {}, aliases: {} };
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

// Aliases bind a label fingerprint to the id a row was saved under, so the
// saved order survives a host rename/count change. Corrupt values are dropped
// rather than trusted: a non-string id here would silently disable hiding.
function normalizeAliases(value) {
  const out = {};
  if (!value || typeof value !== "object" || Array.isArray(value)) return out;
  for (const key of Object.keys(value)) {
    const id = value[key];
    if (!key || typeof id !== "string" || !id) continue;
    out[key] = id;
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
    const aliases = value.aliases && typeof value.aliases === "object" && !Array.isArray(value.aliases) ? value.aliases : {};
    for (const scope of Object.keys(aliases)) {
      const next = normalizeAliases(aliases[scope]);
      if (Object.keys(next).length) state.aliases[scope] = next;
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

function parseStoredState(raw) {
  if (!raw) return { status: "missing" };
  try {
    const parsed = JSON.parse(raw);
    return { status: "ok", parsed, state: normalizeLayoutState(parsed) };
  } catch (err) {
    return { status: "corrupt", raw, error: err };
  }
}

// Keep the raw value under a key writeState never touches, so a reset cannot
// destroy the only evidence of what went wrong.
function keepCorruptValue(baseKey, raw) {
  const stamp = Date.now();
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const key = `${baseKey}.corrupt-${stamp + attempt}`;
    try {
      window.localStorage.setItem(key, raw);
      return key;
    } catch (err) {
      // Quota or privacy errors will not get better under another name.
      return null;
    }
  }
  return null;
}

function warnCorruptLayout(message) {
  try {
    console.warn("[dsh-sidebar-organizer] " + message);
  } catch (err) {
    /* console may be unavailable */
  }
}

function recoverFromCorruptPrimary(raw) {
  let backup = { status: "missing" };
  try {
    backup = parseStoredState(window.localStorage.getItem(LAYOUT_BACKUP_KEY));
  } catch (err) {
    /* storage may be unavailable */
  }
  // The backup is a full snapshot written beside every save; prefer it over
  // wiping every scope and alias because the primary key lost a byte.
  if (backup.status === "ok") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(backup.state));
    } catch (err) {
      /* keep the restored copy in memory */
    }
    warnCorruptLayout("layout store was corrupt; restored the backup copy");
    layoutCache = backup.state;
    return layoutCache;
  }
  const primaryKey = keepCorruptValue(STORAGE_KEY, raw);
  let backupKey = null;
  if (backup.status === "corrupt") backupKey = keepCorruptValue(LAYOUT_BACKUP_KEY, backup.raw);
  warnCorruptLayout(
    "layout store is corrupt and the backup is unusable; resetting" +
      (primaryKey ? " (kept as " + primaryKey + ")" : "") +
      (backupKey ? " (backup kept as " + backupKey + ")" : "")
  );
  layoutCache = emptyLayoutState();
  return layoutCache;
}

function readState() {
  if (layoutCache) return layoutCache;
  let primary = { status: "missing" };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      primary = parseStoredState(raw);
    } else {
      const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacy) {
        primary = parseStoredState(legacy);
        if (primary.status === "ok") {
          try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(primary.parsed));
          } catch (err) {
            /* ignore quota / privacy errors */
          }
        }
      }
    }
  } catch (err) {
    /* localStorage unavailable; behave like an empty store */
  }
  if (primary.status === "corrupt") return recoverFromCorruptPrimary(primary.raw);
  if (primary.status !== "ok") {
    layoutCache = emptyLayoutState();
    return layoutCache;
  }
  layoutCache = restoreFromBackup(primary.parsed) || primary.state;
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
  const aliases = state.aliases && typeof state.aliases === "object" ? state.aliases : {};
  for (const scope of Object.keys(aliases)) {
    next.aliases[scope] = normalizeAliases(aliases[scope]);
  }
  return next;
}

function backupStillHasLayout() {
  try {
    const raw = window.localStorage.getItem(LAYOUT_BACKUP_KEY);
    if (!raw) return false;
    return hasLayoutContent(JSON.parse(raw));
  } catch (err) {
    return false;
  }
}

function writeState(state) {
  layoutCache = cloneState(state);
  const serialized = JSON.stringify(layoutCache);
  try {
    window.localStorage.setItem(STORAGE_KEY, serialized);
    // A failed read can hand us an empty state; trading the safety copy for it
    // would erase the last recoverable layout. A real layout (or no backup at
    // all) refreshes the backup.
    if (hasLayoutContent(layoutCache) || !backupStillHasLayout()) {
      window.localStorage.setItem(LAYOUT_BACKUP_KEY, serialized);
    }
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
  return { version: STATE_VERSION, scopes: state.scopes, aliases: state.aliases, drag };
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

function readAliases(scope) {
  const state = readState();
  const raw = state.aliases && state.aliases[scope];
  return raw ? { ...raw } : {};
}

function writeAliases(scope, aliases) {
  const state = cloneState(readState());
  const next = normalizeAliases(aliases);
  if (Object.keys(next).length) state.aliases[scope] = next;
  else delete state.aliases[scope];
  writeState(state);
}

function writeScope(scope, layout, options) {
  const state = cloneState(readState());
  const next = normalizeScopeLayout(layout);
  if (next.order.length || next.hidden.length) state.scopes[scope] = next;
  else delete state.scopes[scope];
  // Callers that reorder/hide rows pass only order+hidden; the alias table is
  // bookkeeping they know nothing about, so it survives unless explicitly set.
  if (layout && layout.aliases) {
    const aliases = normalizeAliases(layout.aliases);
    if (Object.keys(aliases).length) state.aliases[scope] = aliases;
    else delete state.aliases[scope];
  }
  writeState(state);
  // A layout the user arranged by hand is never "repaired" again: the one-shot
  // 0.5.4 fix recognises an appended row by its shape, and a deliberate move to
  // the end looks exactly like it. Marking the scope here means the fix can
  // only ever touch layouts that predate this build.
  if (options && options.user) markScopeRepaired(scope);
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

// The drag hotkey is local to this origin: it is a keyboard device preference,
// not part of the shared layout, so it never travels through the host copy.
function normalizeHotkey(value) {
  const raw = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const code = typeof raw.code === "string" ? raw.code.slice(0, 64) : "";
  return {
    code: code,
    key: typeof raw.key === "string" ? raw.key.slice(0, 24) : "",
    ctrl: !!raw.ctrl,
    alt: !!raw.alt,
    shift: !!raw.shift,
    meta: !!raw.meta,
    hold: !!raw.hold,
    toggle: !!raw.toggle,
  };
}

function readHotkey() {
  if (hotkeyCache) return hotkeyCache;
  let parsed = null;
  try {
    const raw = window.localStorage.getItem(HOTKEY_KEY);
    if (raw) parsed = JSON.parse(raw);
  } catch (err) {
    parsed = null;
  }
  hotkeyCache = normalizeHotkey(parsed);
  return hotkeyCache;
}

function writeHotkey(value) {
  hotkeyCache = normalizeHotkey(value);
  try {
    window.localStorage.setItem(HOTKEY_KEY, JSON.stringify(hotkeyCache));
  } catch (err) {
    /* keep the in-memory copy */
  }
  return hotkeyCache;
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
// readHostActions() runs inside every layout pass, and the store only changes
// when this plugin writes it, so the last parse is memoised against its raw
// string. Callers merge entries into the map before writing it back, so the
// memo is never handed out directly.
let hostActionsCacheRaw = null;
let hostActionsCache = null;

function readHostActions() {
  let raw = "";
  try {
    raw = window.localStorage.getItem(HOST_ACTION_KEY) || "";
  } catch (err) {
    return {};
  }
  if (hostActionsCache && hostActionsCacheRaw === raw) return Object.assign({}, hostActionsCache);
  const out = {};
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        for (const key of Object.keys(parsed)) {
          const info = parsed[key];
          if (!key || !info || typeof info.label !== "string") continue;
          out[key] = { label: info.label, icon: typeof info.icon === "string" ? info.icon : "" };
        }
      }
    } catch (err) {
      // A corrupted store reads as empty and is rebuilt on the next menu open.
    }
  }
  hostActionsCacheRaw = raw;
  hostActionsCache = out;
  return Object.assign({}, out);
}

function writeHostActions(map) {
  const value = map || {};
  // Keep the memo in step even if storage rejects the write: the in-memory copy
  // is what the caller just acted on.
  hostActionsCache = value;
  hostActionsCacheRaw = null;
  try {
    window.localStorage.setItem(HOST_ACTION_KEY, JSON.stringify(value));
  } catch (err) {
    /* storage may be unavailable */
  }
}

function readHostMenuOrder() {
  try {
    const raw = window.localStorage.getItem(HOST_MENU_ORDER_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const out = [];
    for (const label of parsed) {
      if (typeof label === "string" && label && out.indexOf(label) === -1) out.push(label);
    }
    return out;
  } catch (err) {
    return [];
  }
}

function writeHostMenuOrder(labels) {
  try {
    window.localStorage.setItem(HOST_MENU_ORDER_KEY, JSON.stringify(labels || []));
  } catch (err) {
    /* storage may be unavailable */
  }
}

/* ---- 0.2.2 right-click menus ------------------------------------------- */

// The menu rows belong to the host (and to other plugins); what is ours is the
// custom order and the dividers. Both live here, per menu kind, and are painted
// onto the open DOM. `dividers` holds GAP indexes: gap N means "before the Nth
// row of the saved order", so a divider keeps its place when rows move past it.
//
// Deliberately no noteLocalChange(): that marks the layout as customized and
// publishes it to the other windows, which this file must not do for a menu-only
// change (it would push the registered default order over a custom layout).
function emptyContextMenuLayout() {
  return { order: [], dividers: [], hidden: [], customized: false };
}

function normalizeContextMenuLayout(value) {
  const raw = value && typeof value === "object" ? value : {};
  const order = normalizeStringList(raw.order);
  const dividers = [];
  if (Array.isArray(raw.dividers)) {
    for (const gap of raw.dividers) {
      if (typeof gap !== "number" || !isFinite(gap)) continue;
      const next = Math.max(0, Math.floor(gap));
      if (dividers.indexOf(next) === -1) dividers.push(next);
    }
  }
  dividers.sort((a, b) => a - b);
  // 'hidden' is the tuck list behind the menu's More anchor. Older layouts
  // have no such key, so a missing or invalid value is simply an empty list.
  const hidden = normalizeStringList(raw.hidden);
  return { order, dividers, hidden, customized: raw.customized === true };
}

function readContextMenuStore() {
  if (contextMenuCache) return contextMenuCache;
  let parsed = null;
  try {
    const raw = window.localStorage.getItem(CONTEXT_MENU_KEY);
    if (raw) parsed = JSON.parse(raw);
  } catch (err) {
    parsed = null;
  }
  const store = { version: CONTEXT_MENU_VERSION, enabled: true, menus: {} };
  if (parsed && typeof parsed === "object") {
    if (parsed.enabled === false) store.enabled = false;
    if (parsed.menus && typeof parsed.menus === "object") {
      for (const kind of CONTEXT_MENU_KINDS) {
        if (!parsed.menus[kind]) continue;
        store.menus[kind] = normalizeContextMenuLayout(parsed.menus[kind]);
      }
    }
  }
  contextMenuCache = store;
  return store;
}

function writeContextMenuStore(store) {
  const next = {
    version: CONTEXT_MENU_VERSION,
    enabled: store.enabled !== false,
    menus: {},
  };
  for (const kind of CONTEXT_MENU_KINDS) {
    if (store.menus[kind]) next.menus[kind] = normalizeContextMenuLayout(store.menus[kind]);
  }
  contextMenuCache = next;
  try {
    window.localStorage.setItem(CONTEXT_MENU_KEY, JSON.stringify(next));
  } catch (err) {
    /* keep the in-memory copy */
  }
  return next;
}

function readContextMenuLayout(kind) {
  if (CONTEXT_MENU_KINDS.indexOf(kind) === -1) return emptyContextMenuLayout();
  const store = readContextMenuStore();
  return store.menus[kind] ? normalizeContextMenuLayout(store.menus[kind]) : emptyContextMenuLayout();
}

function writeContextMenuLayout(kind, layout) {
  if (CONTEXT_MENU_KINDS.indexOf(kind) === -1) return emptyContextMenuLayout();
  const store = readContextMenuStore();
  const menus = Object.assign({}, store.menus);
  const before = store.menus[kind] ? normalizeContextMenuLayout(store.menus[kind]) : emptyContextMenuLayout();
  // Merge onto the stored layout: the reorder/toggle call sites predate the
  // tuck list, and a write that only carries order+dividers must not wipe the
  // rows currently filed under More.
  menus[kind] = normalizeContextMenuLayout({
    order: layout && layout.order !== undefined ? layout.order : before.order,
    dividers: layout && layout.dividers !== undefined ? layout.dividers : before.dividers,
    customized: layout && layout.customized !== undefined ? layout.customized : before.customized,
    hidden: layout && layout.hidden !== undefined ? layout.hidden : before.hidden,
  });
  writeContextMenuStore({ version: store.version, enabled: store.enabled, menus });
  return menus[kind];
}

function readContextMenuEnabled() {
  return readContextMenuStore().enabled !== false;
}

function writeContextMenuEnabled(enabled) {
  const store = readContextMenuStore();
  writeContextMenuStore({ version: store.version, enabled: Boolean(enabled), menus: store.menus });
  return Boolean(enabled);
}

function resetContextMenuLayouts() {
  const store = readContextMenuStore();
  writeContextMenuStore({ version: store.version, enabled: store.enabled, menus: {} });
  clearRowMenuLayout();
}

/* ---- dsh-sidebar-row-menu panes ---------------------------------------- */

// row-menu rebuilds its blank-conversation menu from scratch on every open and
// on every header reorder. Its rows have no host ids, so the stable handle is
// the visible label (occasionally with a suffix when two rows share a label).
// The store only remembers the panes the user actually rearranged; an absent
// pane keeps following row-menu's own order.
function emptyRowMenuPane() {
  return { order: [] };
}

function normalizeRowMenuPane(value) {
  const raw = value && typeof value === "object" ? value : {};
  return { order: normalizeStringList(raw.order) };
}

// One promoted 更多操作 entry. The host action id is what runs; the label is
// the handle in the first-level order and what the submenu row is hidden by.
function normalizeRowMenuPromoted(value) {
  const list = [];
  if (!Array.isArray(value)) return list;
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    if (typeof item.id !== "string" || !item.id) continue;
    if (typeof item.label !== "string" || !item.label) continue;
    if (list.some((entry) => entry.label === item.label)) continue;
    list.push({
      id: item.id,
      label: item.label,
      icon: typeof item.icon === "string" ? item.icon : "",
    });
  }
  return list;
}

function normalizeRowMenuDividers(value) {
  const gaps = [];
  if (!Array.isArray(value)) return gaps;
  for (const raw of value) {
    const gap = Number(raw);
    if (!Number.isInteger(gap) || gap < 1) continue;
    if (gaps.indexOf(gap) === -1) gaps.push(gap);
  }
  gaps.sort((a, b) => a - b);
  return gaps;
}

// Presence matters: an absent pane still follows row-menu's own separators,
// while an empty array is a deliberate "no dividers at all".
function normalizeRowMenuDividerMap(value) {
  const map = {};
  if (!value || typeof value !== "object") return map;
  for (const name of ROW_MENU_PANES) {
    if (Object.prototype.hasOwnProperty.call(value, name)) {
      map[name] = normalizeRowMenuDividers(value[name]);
    }
  }
  return map;
}

function readRowMenuStore() {
  let raw = null;
  try {
    raw = window.localStorage.getItem(ROW_MENU_LAYOUT_KEY);
  } catch (err) {
    raw = null;
  }
  if (rowMenuCache && raw === rowMenuCacheRaw) return rowMenuCache;
  let parsed = null;
  try {
    if (raw) parsed = JSON.parse(raw);
  } catch (err) {
    parsed = null;
  }
  const store = {
    version: ROW_MENU_LAYOUT_VERSION,
    panes: {},
    takeover: false,
    promoted: [],
    dividers: {},
  };
  if (parsed && typeof parsed === "object" && parsed.version === ROW_MENU_LAYOUT_VERSION) {
    if (parsed.panes && typeof parsed.panes === "object") {
      for (const name of ROW_MENU_PANES) {
        if (parsed.panes[name]) store.panes[name] = normalizeRowMenuPane(parsed.panes[name]);
      }
    }
    store.takeover = parsed.takeover === true;
    store.promoted = normalizeRowMenuPromoted(parsed.promoted);
    store.dividers = normalizeRowMenuDividerMap(parsed.dividers);
    // Builds before the takeover flag already froze individual panes. Reading
    // them as a takeover keeps the old frozen order instead of letting the
    // header (and the More submenu) start overwriting one of the two halves.
    if (!store.takeover && Object.keys(store.panes).length > 0) store.takeover = true;
    // 更多操作 is row-menu's view of the header More menu, so it is arranged by
    // writing the host order key. Keeping the value we replaced lets a reset put
    // the header menu back instead of stranding that reorder forever.
    if (parsed.host && typeof parsed.host === "object" && Array.isArray(parsed.host.backup)) {
      store.host = {
        backup: normalizeStringList(parsed.host.backup),
        written: Array.isArray(parsed.host.written) ? normalizeStringList(parsed.host.written) : null,
      };
    }
  }
  rowMenuCache = store;
  rowMenuCacheRaw = raw;
  return store;
}

function writeRowMenuStore(store) {
  const next = {
    version: ROW_MENU_LAYOUT_VERSION,
    panes: {},
    takeover: store.takeover === true,
    promoted: normalizeRowMenuPromoted(store.promoted),
    dividers: normalizeRowMenuDividerMap(store.dividers),
  };
  for (const name of ROW_MENU_PANES) {
    if (store.panes[name]) next.panes[name] = normalizeRowMenuPane(store.panes[name]);
  }
  if (store.host && Array.isArray(store.host.backup)) {
    next.host = {
      backup: normalizeStringList(store.host.backup),
      written: Array.isArray(store.host.written) ? normalizeStringList(store.host.written) : null,
    };
  }
  rowMenuCache = next;
  const serialized = JSON.stringify(next);
  rowMenuCacheRaw = serialized;
  try {
    window.localStorage.setItem(ROW_MENU_LAYOUT_KEY, serialized);
  } catch (err) {
    /* keep the in-memory copy */
  }
  return next;
}

function readRowMenuPane(name) {
  if (ROW_MENU_PANES.indexOf(name) === -1) return emptyRowMenuPane();
  const store = readRowMenuStore();
  return store.panes[name] ? normalizeRowMenuPane(store.panes[name]) : emptyRowMenuPane();
}

function writeRowMenuPane(name, order) {
  if (ROW_MENU_PANES.indexOf(name) === -1) return emptyRowMenuPane();
  const store = readRowMenuStore();
  const panes = Object.assign({}, store.panes);
  panes[name] = normalizeRowMenuPane({ order });
  writeRowMenuStore({
    version: store.version,
    panes,
    host: store.host,
    takeover: store.takeover,
    promoted: store.promoted,
    dividers: store.dividers,
  });
  return panes[name];
}

function readRowMenuTakeover() {
  return readRowMenuStore().takeover === true;
}

function setRowMenuTakeover(value) {
  const store = readRowMenuStore();
  writeRowMenuStore({
    version: store.version,
    panes: store.panes,
    host: store.host,
    takeover: Boolean(value),
    promoted: store.promoted,
    dividers: store.dividers,
  });
  return Boolean(value);
}

function readRowMenuPromoted() {
  return readRowMenuStore().promoted.map((entry) => Object.assign({}, entry));
}

function writeRowMenuPromoted(list) {
  const store = readRowMenuStore();
  const promoted = normalizeRowMenuPromoted(list);
  writeRowMenuStore({
    version: store.version,
    panes: store.panes,
    host: store.host,
    takeover: store.takeover,
    promoted,
    dividers: store.dividers,
  });
  return promoted;
}

// null means "this pane still follows row-menu's own separators"; an array
// (possibly empty) is the user's own divider set.
function readRowMenuDividers(name) {
  if (ROW_MENU_PANES.indexOf(name) === -1) return null;
  const store = readRowMenuStore();
  if (!Object.prototype.hasOwnProperty.call(store.dividers, name)) return null;
  return normalizeRowMenuDividers(store.dividers[name]);
}

function writeRowMenuDividers(name, gaps) {
  if (ROW_MENU_PANES.indexOf(name) === -1) return null;
  const store = readRowMenuStore();
  const dividers = Object.assign({}, store.dividers);
  dividers[name] = normalizeRowMenuDividers(gaps);
  writeRowMenuStore({
    version: store.version,
    panes: store.panes,
    host: store.host,
    takeover: store.takeover,
    promoted: store.promoted,
    dividers,
  });
  return dividers[name];
}

function beginRowMenuHostEdit() {
  const store = readRowMenuStore();
  if (store.host) return store.host;
  const host = { backup: readHostMenuOrder(), written: null };
  writeRowMenuStore({
    version: store.version,
    panes: store.panes,
    host,
    takeover: store.takeover,
    promoted: store.promoted,
    dividers: store.dividers,
  });
  return host;
}

function recordRowMenuHostWrite(labels) {
  const store = readRowMenuStore();
  if (!store.host) return;
  writeRowMenuStore({
    version: store.version,
    panes: store.panes,
    host: { backup: store.host.backup, written: normalizeStringList(labels) },
    takeover: store.takeover,
    promoted: store.promoted,
    dividers: store.dividers,
  });
}

function endRowMenuHostEdit() {
  const store = readRowMenuStore();
  if (!store.host || !store.host.written) return;
  const current = readHostMenuOrder();
  const written = store.host.written;
  const same =
    current.length === written.length && current.every((label, index) => label === written[index]);
  // Only unwind the exact order this feature wrote. A header reorder made after
  // the drag is the user's newer decision and must survive a context-menu reset.
  if (same) writeHostMenuOrder(store.host.backup);
}

function clearRowMenuLayout() {
  endRowMenuHostEdit();
  rowMenuCache = {
    version: ROW_MENU_LAYOUT_VERSION,
    panes: {},
    takeover: false,
    promoted: [],
    dividers: {},
  };
  rowMenuCacheRaw = null;
  try {
    window.localStorage.removeItem(ROW_MENU_LAYOUT_KEY);
  } catch (err) {
    /* ignore */
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
    aliases: state.aliases,
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
  // v3 files carry no alias table; the runtime derives and backfills it.
  if (raw.version !== STATE_VERSION && raw.version !== PREVIOUS_STATE_VERSION) {
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
// When the pending push timer fires (ms since epoch), and whether it must push
// even without a user-made layout. A retry timer must not delay a new edit.
let syncPushTimerAt = 0;
let syncPushForce = false;
let syncPullTimer = 0;
let syncPushRunning = false;
let syncPushQueued = false;
let syncResetQueued = false;
let syncPullAttempts = 0;
// Bumped by startHostSync()/stopHostSync(). A request still in flight when the
// sync is torn down (hot reload, disable()) compares its captured epoch before
// every write and timer: an AbortController would only cancel the fetch, and the
// catch branch would still re-arm the retry timer.
let syncEpoch = 0;
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
// "customized" flag this whole merge rule hangs on. System repairs (id
// migration, projection write-back, appended-order fixes) write storage too,
// but they are not a new revision of the layout: publishing them would make a
// stale local copy look newer than another window's edit and overwrite it.
function noteLocalChange(options) {
  const user = Boolean(options && options.user);
  const reset = Boolean(options && options.reset === true);
  if (user) markLayoutCustomized();
  if (reset) syncResetQueued = true;
  if (!user && !reset) return;
  syncDiag.state = syncDiag.state === "idle" ? "pending" : syncDiag.state;
  writeSyncMeta(syncMeta({ updatedAt: Date.now() }));
  if ((user || syncResetQueued) && isCrossWindowEnabled()) scheduleHostPush(SYNC_PUSH_DELAY_MS);
}

function scheduleHostPush(delay, force) {
  const wait = typeof delay === "number" ? delay : SYNC_PUSH_DELAY_MS;
  const due = Date.now() + wait;
  if (syncPushTimer) {
    // A 5 s retry timer used to block every edit made during the outage, so a
    // new layout waited for the retry. Keep whichever fires first and remember
    // a force request so replacing the retry does not downgrade it.
    syncPushForce = syncPushForce || Boolean(force);
    if (syncPushTimerAt <= due) return;
    window.clearTimeout(syncPushTimer);
    syncPushTimer = 0;
  }
  syncPushForce = Boolean(force);
  syncPushTimerAt = due;
  syncPushTimer = window.setTimeout(() => {
    syncPushTimer = 0;
    syncPushTimerAt = 0;
    const forced = syncPushForce;
    syncPushForce = false;
    pushHostLayout(forced);
  }, wait);
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
  const epoch = syncEpoch;
  const meta = readSyncMeta();
  const updatedAt = Number(meta.updatedAt) || Date.now();
  try {
    const response = await fetch(SYNC_ROUTE, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ layout: stateSnapshot(), updatedAt, reset }),
      cache: "no-store",
    });
    if (epoch !== syncEpoch) return false;
    if (!response.ok) throw new Error("HTTP " + response.status);
    const body = await response.json();
    if (epoch !== syncEpoch) return false;
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
    if (epoch !== syncEpoch) return false;
    syncFailure(error);
    syncResetQueued = syncResetQueued || reset;
    scheduleHostPush(SYNC_RETRY_MS);
  } finally {
    // Once the epoch moved on a newer generation owns these flags; resetting
    // them here would unblock the push it is currently running.
    if (epoch === syncEpoch) {
      syncPushRunning = false;
      if (syncPushQueued) {
        syncPushQueued = false;
        scheduleHostPush(SYNC_PUSH_DELAY_MS);
      }
    }
  }
}

async function pullHostLayout() {
  if (!isCrossWindowEnabled()) {
    syncDiag.state = "disabled";
    return false;
  }
  const meta = readSyncMeta();
  const startedAt = Number(meta.updatedAt) || 0;
  const epoch = syncEpoch;
  try {
    const response = await fetch(SYNC_ROUTE, {
      method: "GET",
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    if (epoch !== syncEpoch) return false;
    if (!response.ok) throw new Error("HTTP " + response.status);
    const body = await response.json();
    if (epoch !== syncEpoch) return false;
    syncDiag.pulls += 1;
    syncDiag.state = "ready";
    syncDiag.lastError = null;
    syncPullAttempts = 0;
    const remoteAt = Number(body && body.updatedAt) || 0;
    // Read the local revision after the await: a drag made while the request was
    // open is newer than anything this response can carry, and must not be
    // overwritten by an older host copy.
    const localAt = Number(readSyncMeta().updatedAt) || 0;
    if (localAt !== startedAt) {
      syncDiag.state = "local-newer";
      return false;
    }

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
    if (epoch !== syncEpoch) return false;
    syncFailure(error);
    if (syncPullAttempts < SYNC_PULL_RETRY_LIMIT) {
      // The host route may not be mounted yet while the app is still booting.
      const delay = 1000 * Math.pow(2, syncPullAttempts);
      syncPullAttempts += 1;
      if (syncPullTimer) window.clearTimeout(syncPullTimer);
      syncPullTimer = window.setTimeout(() => {
        syncPullTimer = 0;
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
    const epoch = syncEpoch;
    pullHostLayout().then((adopted) => {
      if (epoch !== syncEpoch || !syncStarted) {
        syncForceAdopt = false;
        return;
      }
      syncForceAdopt = false;
      if (!adopted && isLayoutCustomized()) scheduleHostPush(SYNC_PUSH_DELAY_MS);
    });
  } else {
    // Turning sharing off also invalidates the requests already in flight, so a
    // pull or push that finishes later cannot write behind the switch.
    syncEpoch += 1;
    syncPushRunning = false;
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

// The escape hatch sets a storage key and reloads; a boot while it is set must
// not pull (and later push) a layout behind the user's back.
function pluginDisabled() {
  try {
    return (
      window.localStorage.getItem(DISABLED_KEY) === "1" ||
      window.localStorage.getItem(LEGACY_DISABLED_KEY) === "1"
    );
  } catch (error) {
    return false;
  }
}

function startHostSync() {
  if (syncStarted) return;
  if (pluginDisabled()) {
    syncDiag.state = "disabled";
    return;
  }
  syncStarted = true;
  syncEpoch += 1;
  // A push left running by a previous instance must not block this one.
  syncPushRunning = false;
  syncPushQueued = false;
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
    // disable() can run before this frame: stopHostSync() has already flipped
    // the flag, so the pending first pull must not fire.
    if (!syncStarted) return;
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
    const epoch = syncEpoch;
    pullHostLayout().then((adopted) => {
      syncClaiming = false;
      if (epoch !== syncEpoch || !syncStarted) return;
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

// Counterpart of startHostSync: a hot reload applies the plugin again into the
// same page, and the previous instance's wake listeners and retry timers must
// not survive it (they would pull/push a layout for a runtime that is gone).
function stopHostSync() {
  if (!syncStarted) return;
  syncStarted = false;
  // Invalidate the continuations of requests that are already in flight.
  syncEpoch += 1;
  document.removeEventListener("visibilitychange", onSyncWake);
  window.removeEventListener("focus", onSyncWake);
  if (syncPushTimer) {
    window.clearTimeout(syncPushTimer);
    syncPushTimer = 0;
  }
  syncPushTimerAt = 0;
  syncPushForce = false;
  if (syncPullTimer) {
    window.clearTimeout(syncPullTimer);
    syncPullTimer = 0;
  }
  syncPushRunning = false;
  syncPushQueued = false;
  syncResetQueued = false;
  syncPullAttempts = 0;
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
  const candidates = rows.filter((row) => !known.has(row.id) && !isHostAction(row.id));
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
  // `sidebar.panellist` is the slot for each panel's icon, so the outlet lives
  // INSIDE the row button. Walking out from it is the only reliable way to find
  // the panel list itself; a generic "nav with buttons" scan can otherwise pick
  // the workspace/session nav and reorder user sessions along with panels.
  const outlet = document.querySelector('[data-slot="sidebar.panellist"]');
  let container = null;
  // How the container was found is part of the structure audit: the fallbacks
  // below widen the guess, and a guess that starts being used silently is the
  // first sign that the host moved the list.
  let via = "slot";
  if (outlet) {
    const rowButton = outlet.closest("button");
    via = rowButton ? "slot-button-parent" : "slot-parent";
    container = (rowButton && rowButton.parentElement) || outlet.closest("nav") || outlet.parentElement;
    if (!rowButton && outlet.closest("nav")) via = "slot-nav";
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
  return {
    scope,
    axis: options && options.axis ? options.axis : "x",
    container,
    via: (container === outlet ? "outlet" : "outlet-parent") + (flattened ? "+flatten" : ""),
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

/* Multi-scope drag, ordering and "More" tucking runtime. */

function createRuntime(ctx) {
  const state = {
    stopped: false,
    passScheduled: false,
    passTimes: [],
    // Set by the watchdog: a backed-off pass must still run once the window
    // idles, otherwise a layout update is lost until the next DOM change.
    passRetryTimer: 0,
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
  contextFlattened: false,
    contextDividerNodes: [],
    contextTemplate: null,
    contextFrame: 0,
  scrollFrame: 0,
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
  // Tucked rows of a scope whose popup this plugin injects itself (the settings
  // nav and the session header's shipped menu). The id is the identity; the
  // label is what the row shows.
  function tuckedRowsFor(scope) {
    const found = state.found[scope];
    if (!found) return [];
    const layout = normalizedLayout(scope);
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
    const rows = tuckedRowsFor("settings");
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
    const rows = tuckedRowsFor("header");
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
    // Discovery ran before this rename. Leaving the snapshot on the old id makes
    // the next layout pass believe that id is still present, and the id
    // migration would then "restore" the relic over the fresh id.
    for (const key of Object.keys(state.found)) {
      const found = state.found[key];
      if (!found) continue;
      for (const row of found.rows) if (row.id === oldId) row.id = newId;
    }
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
    const parsed = menuKey(item);
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
      const parsed = menuKey(item);
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
    // Deep enough for a plugin slot wrapped in several display:contents layers
    // plus the host's own wrappers; the bound only exists so a detached row
    // cannot walk the whole document, and bailing out silently drops the row
    // from the menu, so keep it generous.
    while (node && node !== menu && chain.length < 64) {
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
    return { container, item };
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

  // Every separator that belongs to this menu's own grouping, wherever the host
  // nested it. A separator is not always a direct child of the viewport (the
  // row-menu pane wraps its rows, the footer is a block of its own), and a line
  // outside the scanned blocks used to survive customisation as a stray second
  // line right next to the one this plugin painted. A plugin's own submenu panel
  // and our More popup are excluded: those panes arrange their own rows.
  function contextMenuSeparators(menu) {
    if (!menu || !menu.isConnected) return [];
    const found = [];
    for (const node of menu.querySelectorAll('[role="separator"]')) {
      if (node.hasAttribute("data-dso-ctx-divider")) continue;
      if (!isContextSeparator(node)) continue;
      if (node.closest(".dsrm-submenu")) continue;
      if (node.closest("[data-dso-ctx-more],[data-dso-ctx-panel]")) continue;
      found.push(node);
    }
    return found;
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
    // A row that has not been laid out yet must not count as a row above a
    // separator: that shifted the whole divider set by one.
    const laidRects = rows.filter((row) => row.rect.height > 0).map((row) => row.rect);
    for (const node of contextMenuSeparators(menu)) {
      const rect = node.getBoundingClientRect();
      // A separator inside a submenu panel that has not been opened yet
      // measures 0x0; counting it would invent a divider above the first row.
      if (!rect.width && !rect.height) continue;
      const gap = dividerGapOfMiddle(laidRects, rect.top + rect.height / 2);
      if (gap > 0 && nativeDividers.indexOf(gap) === -1) nativeDividers.push(gap);
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
    // Remembered so the mirror step below knows whether this menu was flattened:
    // a pristine menu keeps the host's own fade and must not be touched.
    state.contextFlattened = !!contents;
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
    // Menu-wide on purpose: hiding only the separators of the viewport/footer
    // blocks left a host line that lives in a plugin's wrapper visible next to
    // the divider this plugin painted in the same seam - the "two lines under
    // one action" report.
    const separators = contextMenuSeparators(model.menu);
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
    if (!state.contextFlattened) return;
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
    state.contextFlattened = false;
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

  // The pending kind comes from the right-click that opened the menu. It is
  // consumed by the first sync that classifies a menu: a single stale hint is
  // enough to misclassify the *next* menu (and then persist its rows under the
  // wrong key), so it is never reused. The trust window only covers a menu the
  // user keeps open across re-renders.
  function resolveContextKind(model) {
    const pending = state.contextPendingKind;
    if (pending) {
      const at = state.contextPendingAt;
      state.contextPendingKind = "";
      state.contextPendingAt = 0;
      if (Date.now() - at < CONTEXT_PENDING_TTL) return pending;
    }
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

  // A pane is a rounded surface with a few pixels of padding, and the seam a
  // divider lives in belongs to that padding - not to any row. A right-click
  // aimed at the LINE therefore lands on the pane background, where
  // rowMenuPaneElement() finds nothing and the event used to be dropped. Resolve
  // the pane from the pointer instead, so that seam clicks are understood.
  function rowMenuPaneAt(x, y) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    for (const pane of rowMenuPanes()) {
      const rect = pane.getBoundingClientRect();
      if (!rect.width || !rect.height) continue;
      if (x < rect.left || x > rect.right) continue;
      if (y < rect.top || y > rect.bottom) continue;
      return pane;
    }
    return null;
  }

  // A divider is a hairline inside a ~7px seam, so aiming at the line almost
  // always lands on the seam instead of the line. Anything inside that seam
  // counts as hitting the divider between the two rows around it; a click that
  // is inside a row is not a seam click and is left to the row rule.
  function dividerGapAtPoint(rects, y) {
    if (!Number.isFinite(y)) return 0;
    const laid = rects
      .filter((rect) => rect && rect.height > 0)
      .slice()
      .sort((a, b) => a.top - b.top);
    let gap = 0;
    for (const rect of laid) {
      if (rect.top + rect.height / 2 < y) gap += 1;
    }
    if (gap <= 0 || gap >= laid.length) return 0;
    const above = laid[gap - 1];
    const below = laid[gap];
    if (y > above.top + above.height - 0.5 && y < below.top + 0.5) return gap;
    return 0;
  }

  // A row-menu divider owns the hairline it is drawn at, whether it is painted
  // by this plugin or shipped by row-menu. A click on that hairline must toggle
  // that divider instead of the row whose wrapper happens to contain it.
  function rowMenuLineGap(info, y, tolerance) {
    if (!info || !Number.isFinite(y)) return 0;
    const candidates = [];
    if (info.pane) {
      for (const child of Array.from(info.pane.children)) {
        if (!child.hasAttribute(ROW_MENU_DIVIDER_ATTR)) continue;
        const gap = Number(child.getAttribute(ROW_MENU_DIVIDER_ATTR));
        if (!gap) continue;
        const rect = child.getBoundingClientRect();
        if (rect.height <= 0) continue;
        candidates.push({ gap, y: rect.top });
      }
    }
    const painted = rowMenuVisualRows(info);
    for (let gap = 1; gap < painted.length; gap += 1) {
      let lineY = null;
      for (const sep of rowMenuRowSeparators(painted[gap])) {
        if (!sep.isConnected) continue;
        const rect = sep.getBoundingClientRect();
        if (rect.height <= 0) continue;
        lineY = rect.top;
        break;
      }
      if (lineY === null) {
        const above = painted[gap - 1].rect;
        const below = painted[gap].rect;
        lineY = below.top > above.top + above.height ? (above.top + above.height + below.top) / 2 : below.top;
      }
      candidates.push({ gap, y: lineY });
    }
    return nearestLineGap(candidates, y, tolerance);
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

  // Row-menu renders a separator as a sibling of the row it groups, but the
  // header-toolbar menu nests each separator inside that row's own wrapper
  // (wrapper = hairline + item). Walking only the pane's children therefore
  // never saw those separators: they were neither counted as native gaps nor
  // hidden once the pane was customised, so right-clicking one drew a second
  // line while the original stayed on screen.
  function rowMenuNestedSeparators(rowNode, pane) {
    const found = [];
    if (!rowNode || typeof rowNode.querySelectorAll !== "function") return found;
    for (const node of Array.from(rowNode.querySelectorAll('[role="separator"], .dsrm-sep'))) {
      if (node.hasAttribute(ROW_MENU_DIVIDER_ATTR)) continue;
      if (node.getAttribute("aria-hidden") === "true") continue;
      // A nested submenu paints its own separators; they follow that popup.
      const menu = node.closest('[role="menu"]');
      if (menu && menu !== pane) continue;
      found.push(node);
    }
    return found;
  }

  // Every separator that groups a row, however row-menu rendered it.
  function rowMenuRowSeparators(row) {
    if (!row) return [];
    return (row.seps || []).concat(row.nestedSeps || []);
  }

  // One row per direct child of the pane. The material layer is aria-hidden;
  // native separators are direct children too and belong to the row below them,
  // exactly as row-menu renders them. The nested submenu lives inside its
  // trigger's wrapper, so querySelector() finds the trigger first and never
  // mistakes a submenu entry for a first-level row.
  // Row-menu has no host ids either, but its labels are just as volatile (a
  // status suffix, a translation). The stored handle is therefore a fingerprint
  // id ("row:<slug>"), and `aliases` on the pane hands a renamed row its old id
  // back. `legacyId` is the raw-label handle older builds wrote, kept so those
  // saved orders still apply and can be migrated in place.






  // One-shot hand-over of a pane saved by the label-based build, and of any
  // pane whose saved id an earlier rename orphaned. Adoption keeps the stored
  // slot: the row takes the saved id, the alias makes that stick, and the order
  // array is not reshuffled.


  function rowMenuPaneInfo(pane) {
    if (!pane || !pane.isConnected) return null;
    const name = rowMenuPaneName(pane);
    const rows = [];
    const pending = [];
    const seen = new Map();
    for (const child of Array.from(pane.children)) {
      if (child.getAttribute("aria-hidden") === "true") continue;
      // Our injected divider is a flex child of the pane, so it must not be
      // mistaken for a row-menu separator (those are hidden while custom
      // dividers are painted).
      if (child.hasAttribute(ROW_MENU_DIVIDER_ATTR)) continue;
      // A 更多操作 entry that was pulled out to the first level stays in the
      // submenu's DOM but must not count as a row (or drag) any more.
      if (child.hasAttribute(ROW_MENU_HIDDEN_ATTR)) {
        pending.length = 0;
        continue;
      }
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
        nestedSeps: rowMenuNestedSeparators(child, pane),
      });
    }
    return { pane, name, rows, trailingSeps: pending, rect: pane.getBoundingClientRect() };
  }

  function rowMenuVisualRows(info) {
    const measured = info.rows.filter((row) => row.rect && (row.rect.width > 0 || row.rect.height > 0));
    return measured.slice().sort((a, b) => a.rect.top - b.rect.top);
  }

  function rowMenuFirstPane() {
    return document.querySelector("[" + ROW_MENU_ATTR + "] .dsrm-menu-surface");
  }

  function rowMenuMoreWrap() {
    return document.querySelector("[" + ROW_MENU_ATTR + "] .dsrm-openwith.dsrm-more");
  }

  // The glass of the fiber bridge into row-menu's own React tree. Neither menu
  // exposes a public API for its rows: the 更多操作 controller (items/onSelect)
  // is the only way to both read the host action id of a row and run it later.
  function rowMenuFiberOf(node) {
    if (!node || typeof node !== "object") return null;
    for (const key of Object.keys(node)) {
      if (key.indexOf("__reactFiber$") === 0 || key.indexOf("__reactInternalInstance$") === 0) {
        return node[key];
      }
    }
    return null;
  }

  function rowMenuMoreProps(node) {
    let fiber = rowMenuFiberOf(node);
    let hops = 0;
    let controller = null;
    let onClose = null;
    while (fiber && hops < 24) {
      const props = fiber.memoizedProps;
      if (props && typeof props === "object") {
        if (!controller && props.controller && typeof props.controller.onSelect === "function") {
          controller = props.controller;
        }
        if (!onClose && typeof props.onClose === "function") onClose = props.onClose;
      }
      if (controller && onClose) break;
      fiber = fiber.return;
      hops += 1;
    }
    return controller ? { controller, onClose } : null;
  }

  function rowMenuMoreEntryForRow(rowEl) {
    const wrap = rowEl.closest(".dsrm-openwith.dsrm-more");
    if (!wrap) return null;
    const menuitem = rowEl.querySelector('[role="menuitem"]') || rowEl;
    const label = rowEl.getAttribute(ROW_MENU_ID_ATTR) || rowMenuRowLabel(rowEl, menuitem);
    if (!label) return null;
    const props = rowMenuMoreProps(wrap);
    if (!props) return null;
    const items = Array.isArray(props.controller.items) ? props.controller.items : [];
    const wanted = label.trim();
    let entry = null;
    for (const item of items) {
      if (!item || item.label === undefined || item.label === null) continue;
      if (String(item.label).trim() === wanted) {
        entry = item;
        break;
      }
    }
    if (!entry) return null;
    const icon = rowEl.querySelector(".dsrm-header-icon");
    return {
      id: entry.id,
      label: String(entry.label).replace(/\s+/g, " ").trim(),
      icon: icon ? icon.innerHTML : "",
    };
  }

  // Runs a promoted row's host action. row-menu closes the menu before it
  // invokes the controller, so mirror that order: closing unmounts the wrapper,
  // but the controller object we captured stays callable.
  function selectPromotedRowMenuEntry(label) {
    const entry = readRowMenuPromoted().find((item) => item.label === label);
    if (!entry) return false;
    const wrap = rowMenuMoreWrap();
    const info = wrap ? rowMenuMoreProps(wrap) : null;
    if (!info) return false;
    try {
      if (info.onClose) info.onClose();
    } catch (error) {
      /* the menu may already be closing */
    }
    try {
      info.controller.onSelect(entry.id);
    } catch (error) {
      console.warn("[dsh-sidebar-organizer] promoted menu action failed:", error);
      return false;
    }
    return true;
  }

  // The first row-menu edit freezes the whole menu: from then on the header
  // toolbar keeps following its own order without dragging this menu along.
  // Snapshot every open pane before the edit writes anything.
  function ensureRowMenuTakeover() {
    if (readRowMenuTakeover()) return false;
    const snapshots = {};
    for (const pane of rowMenuPanes()) {
      const info = rowMenuPaneInfo(pane);
      if (!info || !info.rows.length) continue;
      snapshots[info.name] = rowMenuVisualRows(info).map((row) => row.id);
    }
    if (!snapshots.first) return false;
    if (!snapshots.more) snapshots.more = readHostMenuOrder();
    setRowMenuTakeover(true);
    for (const name of Object.keys(snapshots)) writeRowMenuPane(name, snapshots[name]);
    return true;
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

  function rowMenuTemplateRow(pane) {
    for (const child of Array.from(pane.children)) {
      if (child.hasAttribute(ROW_MENU_PROMOTED_ATTR)) continue;
      if (child.hasAttribute(ROW_MENU_DIVIDER_ATTR)) continue;
      if (child.hasAttribute(ROW_MENU_HIDDEN_ATTR)) continue;
      if (child.getAttribute("role") === "separator" || child.classList.contains("dsrm-sep")) continue;
      if (child.querySelector(".dsrm-openwith")) continue;
      if (!child.querySelector('[role="menuitem"]')) continue;
      return child;
    }
    return null;
  }

  // A promoted row is a copy of a real first-level row, rewired to invoke the
  // 更多操作 action by its host entry id. React owns the original rows, so this
  // clone is never touched by row-menu's render pass.
  function createPromotedRow(template, entry) {
    if (!template || !entry) return null;
    const wrapper = template.cloneNode(true);
    wrapper.removeAttribute("style");
    wrapper.removeAttribute(ROW_MENU_ID_ATTR);
    wrapper.removeAttribute(ROW_MENU_SEP_ATTR);
    wrapper.removeAttribute("data-dso-ctx-item");
    wrapper.setAttribute(ROW_MENU_PROMOTED_ATTR, entry.label);
    for (const node of Array.from(wrapper.children)) {
      if (node.getAttribute && node.getAttribute("role") === "separator") node.remove();
    }
    const button = wrapper.querySelector('[role="menuitem"]');
    if (!button) return null;
    const iconClass = (wrapper.querySelector('[class*="itemIcon"]') || {}).className || "";
    const labelClass = (wrapper.querySelector('[class*="itemLabel"]') || {}).className || "";
    button.removeAttribute("id");
    button.removeAttribute("aria-haspopup");
    button.removeAttribute("aria-expanded");
    button.removeAttribute("aria-controls");
    button.removeAttribute("aria-describedby");
    button.removeAttribute("aria-checked");
    button.removeAttribute("aria-disabled");
    button.removeAttribute("disabled");
    button.removeAttribute("data-state");
    button.textContent = "";
    if (entry.icon) {
      const icon = document.createElement("span");
      icon.className = iconClass || "dsrm-header-icon";
      icon.innerHTML = entry.icon;
      button.appendChild(icon);
    }
    const label = document.createElement("span");
    label.className = labelClass || "dsrm-host-label-text";
    label.textContent = entry.label;
    button.appendChild(label);
    button.addEventListener(
      "click",
      (event) => {
        event.preventDefault();
        event.stopPropagation();
        selectPromotedRowMenuEntry(entry.label);
      },
      true
    );
    return wrapper;
  }

  function materializePromotedRows(pane) {
    if (!pane || !pane.isConnected) return;
    const promoted = readRowMenuPromoted();
    const labels = new Set(promoted.map((entry) => entry.label));
    const existing = new Set();
    for (const child of Array.from(pane.children)) {
      const label = child.getAttribute(ROW_MENU_PROMOTED_ATTR);
      if (label === null) continue;
      if (labels.has(label)) {
        existing.add(label);
        continue;
      }
      child.remove();
    }
    if (!promoted.length) return;
    const template = rowMenuTemplateRow(pane);
    if (!template) return;
    for (const entry of promoted) {
      if (existing.has(entry.label)) continue;
      const node = createPromotedRow(template, entry);
      if (node) pane.appendChild(node);
    }
  }

  function hideRowMenuNode(node) {
    if (!node) return;
    node.setAttribute(ROW_MENU_HIDDEN_ATTR, "");
    node.style.display = "none";
  }

  function showRowMenuNode(node) {
    if (!node) return;
    node.removeAttribute(ROW_MENU_HIDDEN_ATTR);
    node.style.removeProperty("display");
    node.style.removeProperty("order");
  }

  // Keeps the 更多操作 submenu rows for promoted entries in the DOM but out of
  // sight: React must still own them, otherwise closing the menu would throw.
  function paintHiddenMoreRows(pane) {
    if (!pane || !pane.isConnected) return;
    for (const child of Array.from(pane.children)) {
      if (child.hasAttribute(ROW_MENU_HIDDEN_ATTR)) showRowMenuNode(child);
    }
    const promoted = readRowMenuPromoted();
    if (!promoted.length) return;
    const labels = new Set(promoted.map((entry) => entry.label));
    const pending = [];
    for (const child of Array.from(pane.children)) {
      if (child.hasAttribute(ROW_MENU_DIVIDER_ATTR)) continue;
      if (child.getAttribute("role") === "separator" || child.classList.contains("dsrm-sep")) {
        pending.push(child);
        continue;
      }
      const menuitem = child.querySelector('[role="menuitem"]');
      if (!menuitem) {
        pending.length = 0;
        continue;
      }
      const label = rowMenuRowLabel(child, menuitem);
      if (labels.has(label)) {
        for (const sep of pending) hideRowMenuNode(sep);
        hideRowMenuNode(child);
      }
      pending.length = 0;
    }
  }

  function rowMenuNativeGaps(info) {
    const gaps = [];
    const rows = rowMenuVisualRows(info);
    for (let index = 1; index < rows.length; index += 1) {
      const shown = rowMenuRowSeparators(rows[index]).some(
        (sep) => sep.isConnected && sep.style.display !== "none" && sep.getBoundingClientRect().height > 0
      );
      if (shown) gaps.push(index);
    }
    return gaps;
  }

  function createRowMenuDivider(gap) {
    // Not a clone of the host separator: the host stylesheet hides a separator
    // that directly follows another one ("X + X { display: none }"), so two
    // injected lines in a row made the later one invisible. row-menu's own
    // .dsrm-sep is a standalone hairline and carries no such sibling rule.
    const node = document.createElement("div");
    node.className = "dsrm-sep dso-rm-divider";
    node.setAttribute("role", "separator");
    node.setAttribute(ROW_MENU_DIVIDER_ATTR, String(gap));
    return node;
  }

  // Row-menu renders each separator as a sibling in front of the row it groups,
  // and applyRowMenuPane() parks it at "the slot above its row". That is right
  // while the rows keep their places, but the moment one is dragged the marker
  // travels with the row it was rendered in - the reported "the divider follows
  // the row" bug. A host context menu solves the same problem by freezing the
  // shipped separators into gap indexes on the first edit, so this does the
  // same for a pane, right before the first arrangement moves anything: the
  // grouping on screen becomes a set of gap indexes, and from then on a divider
  // is a position. A pane without separators has nothing to freeze and keeps
  // following row-menu.
  function materializeRowMenuDividers(info) {
    if (!info || !info.pane || !info.pane.isConnected) return false;
    // An empty array is a deliberate "no dividers"; an absent entry follows the
    // menu's own separators, so the check must be null and not falsy.
    if (readRowMenuDividers(info.name) !== null) return false;
    // run before the arrangement, so the gaps are read from the order that is on
    // screen right now - the shipment's own grouping. A menu with no separators
    // has nothing to freeze and keeps following row-menu.
    const gaps = rowMenuNativeGaps(info);
    if (!gaps.length) return false;
    writeRowMenuDividers(info.name, gaps);
    return true;
  }

  // Dividers are painted as pane-level flex children, so they can sit between
  // rows that React renders. Native separators are hidden while the pane is
  // customised; otherwise both sets would show.
  function applyRowMenuDividers(info) {
    if (!info || !info.pane.isConnected) return;
    const pane = info.pane;
    const injected = [];
    for (const child of Array.from(pane.children)) {
      if (child.hasAttribute(ROW_MENU_DIVIDER_ATTR)) injected.push(child);
    }
    const gaps = readRowMenuDividers(info.name);
    if (!gaps) {
      for (const node of injected) node.remove();
      for (const row of info.rows) {
        for (const sep of rowMenuRowSeparators(row)) {
          if (sep.style.display === "none") sep.style.display = "";
        }
      }
      for (const sep of info.trailingSeps) {
        if (sep.style.display === "none") sep.style.display = "";
      }
      return;
    }
    // Painted dividers are flex children: the pane has to be a column, and the
    // host class that makes it one is the same class the arrangement adds.
    info.pane.classList.add(ROW_MENU_PANE_CLASS);
    // A gap at or past the last row has nothing below it, so painting it would
    // draw a line under the whole menu. The stored value is kept (not pruned):
    // the divider comes back if the rows that belong to it come back.
    const rows = info.rows.length;
    const paintedGaps = gaps.filter((gap) => gap > 0 && gap < rows);
    const used = new Set();
    for (const gap of paintedGaps) {
      let node = null;
      for (const candidate of injected) {
        if (used.has(candidate) || !candidate.isConnected) continue;
        if (Number(candidate.getAttribute(ROW_MENU_DIVIDER_ATTR)) === gap) {
          node = candidate;
          break;
        }
      }
      if (!node) {
        node = createRowMenuDivider(gap);
        pane.appendChild(node);
      }
      used.add(node);
      node.setAttribute(ROW_MENU_DIVIDER_ATTR, String(gap));
      setOrder(node, gap * 2 - 1);
      if (node.style.display === "none") node.style.display = "";
    }
    for (const node of injected) {
      if (!used.has(node) && node.isConnected) node.remove();
    }
    for (const row of info.rows) {
      for (const sep of rowMenuRowSeparators(row)) {
        // A separator nested in its row's wrapper is ours to hide but not to
        // reorder; the marker lets the reset path give the line back.
        if (sep.getAttribute(ROW_MENU_SEP_ATTR) !== "") sep.setAttribute(ROW_MENU_SEP_ATTR, "");
        sep.style.display = "none";
      }
    }
    for (const sep of info.trailingSeps) sep.style.display = "none";
  }

  function toggleRowMenuDividerGap(info, gap) {
    if (!info || !gap) return false;
    const painted = rowMenuVisualRows(info);
    // The last row has no gap below it: a divider there would be trailing.
    if (gap <= 0 || gap >= painted.length) return false;
    ensureRowMenuTakeover();
    const stored = readRowMenuDividers(info.name);
    const gaps = stored ? stored.slice() : rowMenuNativeGaps(info);
    const at = gaps.indexOf(gap);
    if (at === -1) gaps.push(gap);
    else gaps.splice(at, 1);
    gaps.sort((a, b) => a - b);
    writeRowMenuDividers(info.name, gaps);
    const fresh = rowMenuPaneInfo(info.pane);
    if (fresh) {
      applyRowMenuPane(fresh, readRowMenuPane(info.name).order, true);
      applyRowMenuDividers(fresh);
    }
    return true;
  }

  // Right-clicking a row toggles the line underneath it (the same gap the host
  // context menu uses).
  function toggleRowMenuDivider(info, row) {
    if (!info || !row) return false;
    const painted = rowMenuVisualRows(info);
    const index = painted.findIndex((candidate) => candidate.id === row.id);
    if (index === -1) return false;
    return toggleRowMenuDividerGap(info, index + 1);
  }

  function promoteRowMenuEntry(gesture, beforeId) {
    const entry = gesture && gesture.rowMenuMoreEntry;
    const firstPane = rowMenuFirstPane();
    if (!entry || !firstPane || !rowMenuTemplateRow(firstPane)) return false;
    ensureRowMenuTakeover();
    const promoted = readRowMenuPromoted().filter((item) => item.label !== entry.label);
    promoted.push({ id: entry.id, label: entry.label, icon: entry.icon || "" });
    writeRowMenuPromoted(promoted);
    const first = readRowMenuPane("first").order.slice();
    const ids = first.filter((id) => id !== entry.label);
    let at = beforeId ? ids.indexOf(beforeId) : ids.length;
    if (at === -1) at = ids.length;
    ids.splice(at, 0, entry.label);
    writeRowMenuPane("first", ids);
    const moreStored = readRowMenuPane("more").order;
    const more = (moreStored.length ? moreStored : readHostMenuOrder()).filter((label) => label !== entry.label);
    writeRowMenuPane("more", more);
    syncRowMenus(true);
    return true;
  }

  function demoteRowMenuEntry(gesture) {
    const label = gesture && gesture.id;
    if (!label) return false;
    const promoted = readRowMenuPromoted();
    const entry = promoted.find((item) => item.label === label);
    if (!entry) return false;
    writeRowMenuPromoted(promoted.filter((item) => item.label !== label));
    writeRowMenuPane("first", readRowMenuPane("first").order.filter((id) => id !== label));
    const moreStored = readRowMenuPane("more").order;
    const more = moreStored.length ? moreStored.slice() : readHostMenuOrder();
    if (more.indexOf(entry.label) === -1) more.push(entry.label);
    writeRowMenuPane("more", more);
    syncRowMenus(true);
    return true;
  }

  function syncRowMenus(force) {
    if (state.stopped) return;
    if (!contextMenuEnabled()) {
      clearRowMenuStyles();
      return;
    }
    // Rewrite the React-owned rows first (promoted clones / hidden submenu
    // entries), then measure every pane, then write styles. Interleaving the
    // measurements forced one synchronous reflow per pane.
    const panes = [];
    for (const pane of rowMenuPanes()) {
      const rect = pane.getBoundingClientRect();
      if (!rect.width && !rect.height) continue;
      const name = rowMenuPaneName(pane);
      if (name === "first") materializePromotedRows(pane);
      if (name === "more") paintHiddenMoreRows(pane);
      panes.push(pane);
    }
    const infos = [];
    for (const pane of panes) {
      const info = rowMenuPaneInfo(pane);
      if (!info || !info.rows.length) continue;
      infos.push(info);
    }
    const takeover = readRowMenuTakeover();
    for (const info of infos) {
      // Until the first row-menu edit, 更多操作 mirrors the host's More popup
      // key; after the user customises this menu the plugin owns it outright.
      let saved;
      if (info.name === "more") {
        const stored = readRowMenuPane("more").order;
        saved = takeover && stored.length ? stored : readHostMenuOrder();
      } else {
        saved = readRowMenuPane(info.name).order;
      }
      // Freeze the grouping before the arrangement touches it, then arrange: a
      // pane that owns dividers must also own the row order, otherwise the
      // painted lines (flex order 2n-1) would sort below rows that are still at
      // their default order 0.
      const frozen = materializeRowMenuDividers(info);
      const owned = frozen || readRowMenuDividers(info.name) !== null;
      applyRowMenuPane(info, saved, force || owned);
      applyRowMenuDividers(info);
    }
  }

  function clearRowMenuStyles() {
    const nodes = document.querySelectorAll(
      "[" + ROW_MENU_ID_ATTR + "], [" + ROW_MENU_SEP_ATTR + "], ." + ROW_MENU_PANE_CLASS +
        ", [" + ROW_MENU_HIDDEN_ATTR + "]"
    );
    for (const node of nodes) {
      if (node.hasAttribute(ROW_MENU_HIDDEN_ATTR)) showRowMenuNode(node);
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
    for (const node of document.querySelectorAll("[" + ROW_MENU_DIVIDER_ATTR + "]")) node.remove();
    for (const node of document.querySelectorAll("[" + ROW_MENU_PROMOTED_ATTR + "]")) node.remove();
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
    // Any reorder is a row-menu edit: freeze the menu before this drop lands so
    // the header toolbar can no longer reshuffle it behind the user's back.
    ensureRowMenuTakeover();
    // Rows that have not been laid out (a collapsed group) measure 0x0 at
    // (0,0); sorting them with the rest put them first and persisted that order.
    const measured = info.rows.filter((row) => row.rect && (row.rect.width > 0 || row.rect.height > 0));
    const unmeasured = info.rows.filter((row) => measured.indexOf(row) === -1);
    const visual = measured.slice().sort((a, b) => a.rect.top - b.rect.top);
    const from = visual.findIndex((row) => row.id === gesture.id);
    if (from === -1) return false;
    const dragged = visual[from];
    const rest = visual.filter((row, at) => at !== from);
    let at = beforeId ? rest.findIndex((row) => row.id === beforeId) : rest.length;
    if (at === -1) at = rest.length;
    rest.splice(at, 0, dragged);
    // Keep the unmeasured rows, in their stored relative order, at the end:
    // dropping them here would erase their entries from the saved order.
    const finalIds = rest.map((row) => row.id).concat(unmeasured.map((row) => row.id));
    if (info.name === "more") {
      // After takeover the 更多操作 order lives in our store. Keep the labels
      // row-menu does not list right now at the end so the stored ranking stays
      // complete instead of losing entries on every drag.
      const labels = rest.map((row) => row.label);
      for (const label of readRowMenuPane("more").order) {
        if (labels.indexOf(label) === -1) labels.push(label);
      }
      for (const label of readHostMenuOrder()) {
        if (labels.indexOf(label) === -1) labels.push(label);
      }
      writeRowMenuPane("more", labels);
    } else {
      writeRowMenuPane(info.name, finalIds);
    }
    syncRowMenus(true);
    return true;
  }

  // A snapshot in the shape the generic drag pipeline expects. `found` is null
  // on purpose: every `found` consumer is null-guarded, and the menu's own rect
  // replaces the container/cross rects.
  function contextVisibleItems(model) {
    const hidden = new Set(readContextMenuLayout(state.contextKind).hidden);
    const items = [];
    for (const row of model.rows) {
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
  // Fresh rects for the rows the menu actually paints, measured at call time.
  // The model's own rects are a snapshot from when the menu opened.
  function contextLiveRects(model) {
    if (!model) return [];
    const rects = [];
    for (const row of contextPaintedRows(model)) {
      if (!row.item || !row.item.isConnected) continue;
      const rect = row.item.getBoundingClientRect();
      if (rect.height > 0) rects.push(rect);
    }
    return rects;
  }

  // The divider set a menu SHIPS with, resolved from the geometry on screen.
  // The model freezes its own copy when the menu opens, but the menu is still
  // settling then (row-menu registers its 打开方式 rows a moment later), so that
  // copy can number a line one gap off - and a first right-click on the line
  // then ADDED a divider next to it instead of removing it. Recomputing here
  // makes the initial set and the line the user pointed at agree by
  // construction.
  function contextNativeDividers(model) {
    if (!model || !model.menu) return [];
    const rects = contextLiveRects(model);
    const gaps = [];
    for (const node of contextMenuSeparators(model.menu)) {
      const rect = node.getBoundingClientRect();
      if (!rect.width || !rect.height) continue;
      if (getComputedStyle(node).display === "none") continue;
      const gap = dividerGapOfMiddle(rects, rect.top + rect.height / 2);
      if (gap > 0 && gap < rects.length && gaps.indexOf(gap) === -1) gaps.push(gap);
    }
    gaps.sort((a, b) => a - b);
    return gaps;
  }

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
    if (!model) return false;
    const painted = contextPaintedRows(model);
    const index = painted.indexOf(row);
    if (index === -1) return false;
    return toggleContextDividerGap(index + 1);
  }

  function toggleContextDividerGap(gap) {
    const model = state.contextRows;
    const kind = state.contextKind;
    if (!model || !kind || !contextMenuEnabled()) return false;
    const painted = contextPaintedRows(model);
    if (gap <= 0 || gap >= painted.length) return false;
    const current = readContextMenuLayout(kind);
    const rows = model.rows;
    const layout = {
      // First toggle: take the host's document order, not the measured order.
      // A menu that just re-rendered can measure a row at 0px and sorting by
      // rect would persist that glitch as the user's order.
      order: current.customized
        ? current.order.slice()
        : rows.slice().sort((a, b) => a.dom - b.dom).map((item) => item.id),
      dividers: current.customized ? current.dividers.slice() : contextNativeDividers(model),
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
    // Painting moved every row below the toggled line, so the snapshot taken
    // above is already stale: re-measure for the next click, drag or drop.
    state.contextRows = contextMenuModel(model.menu) || next;
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
      if (!row || seen.has(id)) continue;
      seen.add(id);
      out.push(row);
    }
    // A row hidden by an older layout (or by another window) may not be listed
    // first; append it in document order so it never disappears from the popup.
    for (const row of model.rows) {
      if (!hidden.has(row.id) || seen.has(row.id)) continue;
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
    // A menu whose scroll viewport we cannot identify still takes the anchor:
    // hanging it off the menu root is all the placement needs, and refusing to
    // inject it here would silently disable the whole drag-to-More affordance.
    if (!model || !model.menu) return;
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

  // A host row can be disabled ("disabled" here means the host dimmed it with
  // aria-disabled; the menu body still shows it because the host renders it).
  // The injected copy has no state of its own, so it has to carry that flag or
  // it would offer an action the host refuses.
  function contextRowDisabled(row) {
    const host = row && (row.menuitem || row.item);
    return !!host && host.getAttribute("aria-disabled") === "true";
  }

  function buildContextMoreRow(row) {
    const disabled = contextRowDisabled(row);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "dso-ctx-panel-row";
    button.setAttribute("role", "menuitem");
    button.setAttribute("data-dso-ctx-more-key", row.id);
    if (disabled) button.setAttribute("aria-disabled", "true");
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
      if (contextRowDisabled(row)) return;
      invokeContextMoreRow(row.id);
    });
    return button;
  }

  function renderContextMorePanel(model, tucked) {
    const signature = tucked.map((row) => row.id + (contextRowDisabled(row) ? "!" : "")).join("|");
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
    const rows = model.rows;
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
    const rows = model.rows;
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
    // dsh-sidebar-row-menu's own panes (the blank-conversation menu and its
    // submenus) are arranged by this plugin too, so a right-click there toggles
    // one of OUR dividers instead of the browser/host menu.
    const rowPane =
      rowMenuPaneElement(target) || rowMenuPaneAt(event.clientX, event.clientY);
    if (rowPane) {
      if (!contextMenuEnabled()) return;
      const info = rowMenuPaneInfo(rowPane);
      if (info) {
        const onLine = target.closest('[role="separator"], .dsrm-sep') !== null;
        // A line always beats the row it is nested in. Without this, a
        // separator shipped inside a row's wrapper resolved to that row, and
        // the toggle drew a new line at the same seam while the original one
        // stayed - the reported "it added a divider instead of removing it".
        const lineGap = rowMenuLineGap(info, event.clientY, onLine ? Infinity : 4);
        let row = null;
        if (!lineGap) {
          for (const candidate of info.rows) {
            if (candidate.item === target || candidate.item.contains(target)) {
              row = candidate;
              break;
            }
          }
        }
        if (row) {
          toggleRowMenuDivider(info, row);
        } else if (lineGap) {
          toggleRowMenuDividerGap(info, lineGap);
        }
      }
      // Always swallow the event: a right-click on a divider or on empty pane
      // space must not fall through to the host's menu.
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    const menu = target.closest("[data-context-menu]");
    if (menu) {
      if (menu !== state.contextMenu || !state.contextRows) {
        // Not measured yet: park the intent, keep this menu open, and let the
        // next frame's sync act on the complete row list.
        // A line is not the row it is nested in: parking a row toggle here
        // would toggle the adjacent gap once the menu finishes measuring.
        const button = target.closest('[role="separator"]')
          ? null
          : target.closest('[role="menuitem"]');
        const label = button ? contextRowLabel(button) : "";
        if (label) state.contextPendingToggle = { menu, label, at: Date.now() };
        event.preventDefault();
        event.stopPropagation();
        scheduleContextSync();
        return;
      }
      // A host separator is sometimes nested INSIDE a row's wrapper (the
      // row-menu pane wraps its rows, and the host's own item wrappers do too),
      // so the row lookup below used to claim a click that was aimed at the
      // line and toggle the divider under the FOLLOWING row: the line stayed
      // and a new one appeared next to it, which is exactly the report. A
      // pointer on a visible line always toggles that line.
      const onLine = target.closest('[role="separator"]') !== null;
      const measured = contextLiveRects(state.contextRows);
      const lineGap = contextDividerLineGap(
        state.contextRows.menu,
        measured,
        event.clientY,
        onLine ? Infinity : 4
      );
      const row = lineGap ? null : contextRowAt(state.contextRows, target);
      if (row) toggleContextDivider(row);
      else {
        // Same seam rule as the row-menu panes: the hairline sits in padding
        // that belongs to the menu surface, not to a row. Measured live, never
        // from the model snapshot: a stale snapshot resolved the seam to the
        // NEIGHBOURING gap, so a line the user aimed at stayed while another
        // one appeared next to it.
        const seam = lineGap || dividerGapAtPoint(measured, event.clientY);
        if (seam) toggleContextDividerGap(seam);
      }
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

  // Release this plugin's takeover of dsh-sidebar-row-menu: drop the saved
  // order/dividers/promotions and let row-menu map the header toolbar again.
  function resetRowMenu() {
    clearRowMenuLayout();
    clearRowMenuStyles();
    scheduleContextSync();
    notify();
    return true;
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
      if (!isSameOrder(visible, hostVisible)) return true;
      if (layout.hidden.some((id) => hostIds.indexOf(id) !== -1)) return true;
    }
    return false;
  }

  function applyFound(found) {
    if (!found || !found.rows.length) return;
    const scope = found.scope;
    // A layout saved by an older build keys rows by their raw label; hand those
    // ids to the fingerprint ids this build derives before anything reads the
    // layout, so a hand-made arrangement survives the upgrade without a re-drag.
    migrateScopeIds(found);
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
      // empty shelf the extra control would just be another dead row. Count
      // only rows that still exist: a tucked row the host has since removed
      // left its id in the saved list and kept an empty "More" chip alive.
      const showMore = scope === "settings" ? layout.hidden.some((id) => byId.has(id)) : true;
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
      if (!state.passRetryTimer) {
        state.passRetryTimer = window.setTimeout(() => {
          state.passRetryTimer = 0;
          if (state.stopped) return;
          state.passTimes = [];
          schedulePass();
        }, PASS_RETRY_MS);
      }
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
        // Drop the previous snapshot: a stale container keeps being treated as
        // "still connected" by relevantMutation and canHide/buildSnapshot, so
        // keeping it made every later mutation look significant.
        state.found[def.key] = null;
        warnOnce(`missing:${def.key}`, `no rows found for scope "${def.key}"`);
        continue;
      }
      if (!found.rows.length && def.key !== "header") {
        state.found[def.key] = null;
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

  function placeIndex(scope, list, id, index, beforeId) {
    const others = list.filter((key) => key !== id);
    // The drop line names the row it was painted in front of, so prefer that
    // identity over the numeric index: the index counts the rows the user can
    // see, while the saved order also holds rows that are mounted but measure
    // 0x0 (a slot wrapper with display:contents). Every such entry before the
    // gap shifted the splice, and when it shifted back onto the row itself the
    // drop looked accepted but nothing moved.
    if (beforeId) {
      const at = others.indexOf(beforeId);
      if (at !== -1) return at;
    }
    const here = presentIds(scope, others);
    const at = Math.max(0, Math.min(here.length, typeof index === "number" ? index : here.length));
    if (at < here.length) return others.indexOf(here[at]);
    if (!here.length) return others.length;
    // Last visible slot: stay in front of any absent entries tailing the order.
    return others.indexOf(here[here.length - 1]) + 1;
  }

  function reveal(scope, id, index, beforeId) {
    const found = state.found[scope];
    const row = rowFor(found, id);
    if (!row) return false;
    const layout = normalizedLayout(scope);
    if (layout.hidden.indexOf(id) === -1) return false;
    const hidden = layout.hidden.filter((key) => key !== id);
    const visible = layout.order.filter((key) => hidden.indexOf(key) === -1);
    visible.splice(placeIndex(scope, visible, id, index, beforeId), 0, id);
    writeScope(scope, { order: visible.concat(hidden), hidden }, { user: true });
    refreshScope(scope);
    notify();
    return true;
  }

  function reorder(scope, id, index, beforeId) {
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
    others.splice(placeIndex(scope, visible, id, index, beforeId), 0, id);
    writeScope(scope, { order: others.concat(layout.hidden), hidden: layout.hidden }, { user: true });
    refreshScope(scope);
    notify();
    return true;
  }

  function reorderHidden(scope, id, index, beforeId) {
    const layout = normalizedLayout(scope);
    const from = layout.hidden.indexOf(id);
    if (from === -1) return false;
    const others = layout.hidden.filter((key) => key !== id);
    others.splice(placeIndex(scope, layout.hidden, id, index, beforeId), 0, id);
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
      const found = state.found[key];
      if (!found) {
        if (layout.hidden.length) return true;
        continue;
      }
      // Compare only rows the host currently exposes: remembered ids for
      // temporarily absent rows are not a customization, and a tucked row the
      // host has removed must not keep the scope "customized" forever.
      const present = new Set(found.rows.map((row) => row.id));
      if (layout.hidden.some((id) => present.has(id))) return true;
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
    // swallowing it here would only strand the recorder in a dead dialog. The
    // recorder still receives it, because the settings page is also rendered
    // inline in the plugin detail where no dialog exists to close.
    if (event.key === "Escape") {
      if (event.type === "keydown") {
        const cancelHandler = state.hotkeyCaptureHandler;
        if (cancelHandler) cancelHandler(event);
      }
      return;
    }
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
      const present = new Set(found ? found.rows.map((row) => row.id) : []);
      scopes[def.key] = {
        found: !!found,
        rows: found ? found.rows.map((row) => ({ id: row.id, label: row.label, fingerprint: row.fingerprint || "", hidden: layout.hidden.indexOf(row.id) !== -1, pinned: !!row.pinned, fixed: !!row.fixed })) : [],
        hidden: layout.hidden.slice(),
        // Diagnostics for a real-host report: how many bindings are remembered,
        // and which saved ids no current row claims (an unrecoverable orphan).
        ids: {
          aliases: Object.keys(readAliases(def.key)).length,
          orphaned: found ? layout.order.filter((id) => !present.has(id)) : layout.order.slice(),
        },
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
      let rect = row.unit.getBoundingClientRect();
      // A slot child rendered with display:contents has no box of its own even
      // though the button inside it is plainly visible. Dropping such a row from
      // the snapshot moved the gap between its neighbours onto the glyph itself,
      // and the drop line painted across the icon being dragged.
      if (!rect.width && !rect.height) rect = dragSourceBox(row.unit) || rect;
      if (!rect || (!rect.width && !rect.height)) continue;
      items.push({ id: row.id, unit: row.unit, target: row.target, rect });
    }
    items.sort((a, b) => visualOrder(a, b, found.axis));
    if (gesture.source === "row" && items.every((item) => item.id !== gesture.id)) items.length = 0;

    const menuItems = [];
    if (gesture.source === "menu") {
      for (const node of document.querySelectorAll("[data-dso-more-key]")) {
        const parsed = menuKey(node);
        if (!parsed || parsed.scope !== gesture.scope) continue;
        const rect = node.getBoundingClientRect();
        // A row the menu has not laid out yet (a submenu still collapsed)
        // measures 0x0 at (0,0) and used to stretch the drop area over the whole
        // viewport; it must not take part in hit-testing.
        if (!rect.width && !rect.height) continue;
        menuItems.push({ id: parsed.id, element: node, rect });
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
    clone.classList.remove("dso-dragging", "dso-ghost-armed");
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
      gesture.element.classList.remove("dso-dragging");
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
    const middle = (rect) => (axis === "x" ? rect.left + rect.width / 2 : rect.top + rect.height / 2);
    // Compare against a VISUALLY sorted list, never the array as handed in: a
    // strip is re-laid-out with CSS order, so the items can arrive in DOM order
    // while the rows are painted in another one. Scanning an unsorted list
    // stopped advancing as soon as the pointer passed a row that sat later in
    // the array, which pinned the drop line to an earlier gap (pointer far
    // right, line still left of the search icon).
    const sorted = items.slice().sort((a, b) => middle(a.rect) - middle(b.rect));
    // The source row is removed from the list but still occupies its layout
    // slot; the full list supplies the REAL neighbouring gap.
    const all = (allItems && allItems.length ? allItems : items).slice().sort((a, b) => middle(a.rect) - middle(b.rect));
    const coordinate = axis === "x" ? x : y;
    const next = sorted.find((item) => coordinate < middle(item.rect)) || null;
    if (next) {
      // Match by reference, not by id: header slots may share an empty id, and a
      // findIndex that fell back to 0 made the previous neighbour null, which
      // collapsed the gap to the row's leading edge (the line sat ON the icon).
      const at = all.indexOf(next);
      const previous = at > 0 ? all[at - 1].rect : null;
      return { index: items.indexOf(next), boundary: gapBoundary(axis, previous, next.rect) };
    }
    const last = sorted[sorted.length - 1];
    const atLast = all.indexOf(last);
    const after = atLast >= 0 && atLast + 1 < all.length ? all[atLast + 1].rect : null;
    return { index: items.length, boundary: gapBoundary(axis, last.rect, after) };
  }

  // Dropping a row back into the slot it already occupies changes nothing. When
  // the source sits BETWEEN its two neighbours, the midpoint of the gap that
  // contains it falls inside the still-rendered source box, so the drop line is
  // painted straight through the dragged row (header icons: a blue bar across
  // the glyph). A no-op slot is not worth a line; treat it as no target at all.
  function sourceSlotBoundary(items, id, boundary, axis, element, container) {
    const source = items.find((item) => item.id === id);
    // The snapshot drops rows that measure 0x0 (a slot child rendered with
    // display:contents wraps its button without a box of its own), so the source
    // can be missing from `items`; the element it was dragged from still has a
    // visible box somewhere inside. Only trust that inner box when the pressed
    // element really belongs to the strip being sorted — a drag that pulls a row
    // in from elsewhere (a shipped menu action onto the header) has a source box
    // that has nothing to do with the gaps of the target strip.
    let rect = source ? source.rect : null;
    const sameStrip = !!(container && element && container.contains(element));
    if ((!rect || (!rect.width && !rect.height)) && sameStrip) {
      rect = dragSourceBox(element) || rect;
    }
    if (!rect) return false;
    return axis === "x"
      ? boundary > rect.left && boundary < rect.right
      : boundary > rect.top && boundary < rect.bottom;
  }

  // No drop line may be painted THROUGH a row. Whatever the geometry math
  // concluded, a boundary strictly inside a visible row box means the line would
  // cross that row's glyph (the header "blue bar across the icon" case). Snap it
  // to the nearer edge of every row box it falls inside; a boundary that sits on
  // an edge is a real gap and is left alone.
  // A drop past either end of a strip still means "that end": the pointer only
  // has to stay in the strip's own row. Without this, dragging an icon to the far
  // right (the natural way to say "put it last") fell outside the strip box, the
  // target was dropped, and the release did nothing at all.
  // The snapshot stores a measured rect for most strips, an element for others,
  // so accept either: calling getBoundingClientRect on a rect object threw and
  // silently killed the whole pointermove, which dropped every drop target
  // outside the strip box.
  function stripRect(container) {
    if (!container) return null;
    return typeof container.getBoundingClientRect === "function" ? container.getBoundingClientRect() : container;
  }
  function nearStrip(container, x, y, axis, pad) {
    const rect = stripRect(container);
    if (!rect) return false;
    if (!rect.width && !rect.height) return false;
    const slack = Math.max(40, (axis === "x" ? rect.width : rect.height) * 0.5);
    if (axis === "x") {
      return y >= rect.top - pad && y <= rect.bottom + pad && x >= rect.left - pad - slack && x <= rect.right + pad + slack;
    }
    return x >= rect.left - pad && x <= rect.right + pad && y >= rect.top - pad - slack && y <= rect.bottom + pad + slack;
  }
  function boundaryClearOfRows(boundary, axis, rects) {
    let at = boundary;
    for (let pass = 0; pass < 4; pass += 1) {
      let moved = false;
      for (const rect of rects || []) {
        if (!rect || (!rect.width && !rect.height)) continue;
        const lo = axis === "x" ? rect.left : rect.top;
        const hi = axis === "x" ? rect.right : rect.bottom;
        if (hi - lo < 3) continue;
        if (at > lo + 1 && at < hi - 1) {
          at = at - lo <= hi - at ? lo : hi;
          moved = true;
        }
      }
      if (!moved) break;
    }
    return at;
  }
  // The box the user actually sees: a slot child rendered with display:contents
  // has no rect of its own even though the button inside it is plainly painted.
  function visibleBox(element) {
    if (!element || !element.getBoundingClientRect) return null;
    const own = element.getBoundingClientRect();
    if (own.width || own.height) return own;
    if (!element.querySelectorAll) return null;
    for (const child of element.querySelectorAll("*")) {
      const rect = child.getBoundingClientRect();
      if (rect.width || rect.height) return rect;
    }
    return null;
  }

  // The pressed unit can be a box-less wrapper. Walk into it to find the box the
  // user actually sees, so "the drop line is inside the row I am dragging" keeps
  // meaning the glyph under the pointer.
  function dragSourceBox(element) {
    return visibleBox(element);
  }

  // Everything the host paints inside a strip — including the controls discovery
  // deliberately skips (a segmented widget, a wrapper with no clickable, an
  // overflow anchor) and any row whose label-derived id drifted away from its
  // layout entry, which keeps its old style.order and stays painted mid-strip.
  // The snapshot's item list cannot answer "what is on screen": it is a model of
  // the SORTABLE rows, so a control it does not know about leaves a hole in it.
  // The drop line is therefore measured against these boxes, not against items.
  function paintedStripEntries(found, axis, items) {
    const container = found && found.container;
    if (!container || !container.isConnected || !container.children) return [];
    // Wrapped strips paint several lines; only the line the rows sit on matters,
    // or a box from the line below blocks a gap that is visibly free.
    const span = { lo: Infinity, hi: -Infinity };
    for (const item of items || []) {
      const rect = item.rect;
      if (!rect) continue;
      const lo = axis === "x" ? rect.top : rect.left;
      const hi = axis === "x" ? rect.bottom : rect.right;
      if (lo < span.lo) span.lo = lo;
      if (hi > span.hi) span.hi = hi;
    }
    const measured = span.lo < span.hi;
    const boxes = [];
    const add = (element, depth) => {
      if (!element || element.nodeType !== 1 || depth > 3) return;
      if (element.classList && (element.classList.contains("dso-ghost") || element.classList.contains("dso-indicator"))) return;
      if (element.closest && element.closest(".dso-config")) return;
      const rect = element.getBoundingClientRect();
      // A display:contents child paints nothing of its own but its children are
      // on screen (the session header's slot outlet is exactly this), so a 0x0
      // child stands for its children rather than for one box.
      if (!rect.width && !rect.height) {
        for (const nested of elementChildren(element)) add(nested, depth + 1);
        return;
      }
      if (measured) {
        const center = axis === "x" ? (rect.top + rect.bottom) / 2 : (rect.left + rect.right) / 2;
        if (center < span.lo - 8 || center > span.hi + 8) return;
      }
      boxes.push({ rect, element });
    };
    for (const child of elementChildren(container)) add(child, 0);
    boxes.sort((a, b) => (axis === "x" ? a.rect.left - b.rect.left : a.rect.top - b.rect.top));
    return boxes;
  }

  function paintedStripBoxes(found, axis, items) {
    return paintedStripEntries(found, axis, items).map((entry) => entry.rect);
  }

  // ---------------------------------------------------------------- audit
  // The invariant this plugin depends on is "the model's rows match what the
  // host paints". When the two drift apart the symptoms are a line through an
  // icon or a row nobody can grab, and both stay invisible until a user
  // reports them. audit() turns that invariant into a value: boxes painted that
  // no row owns, and rows the host no longer paints.
  function boxOverlap(a, b) {
    const left = Math.max(a.left, b.left);
    const right = Math.min(a.right, b.right);
    const top = Math.max(a.top, b.top);
    const bottom = Math.min(a.bottom, b.bottom);
    if (right <= left || bottom <= top) return 0;
    const area = (right - left) * (bottom - top);
    const smaller = Math.min(a.width * a.height, b.width * b.height);
    return smaller > 0 ? area / smaller : 0;
  }

  function boxName(element) {
    if (!element) return "?";
    const label = cleanLabel(
      (element.getAttribute && (element.getAttribute("aria-label") || element.getAttribute("title"))) || ""
    );
    if (label) return label;
    const named = (element.getAttribute && (element.getAttribute("data-testid") || element.getAttribute("id"))) || "";
    if (named) return named;
    const cls = String((element.getAttribute && element.getAttribute("class")) || "").split(/\s+/).filter(Boolean)[0] || "";
    return cls || element.tagName;
  }

  // A box nobody owns is only alarming when the model SHOULD have owned it: a
  // segmented widget is deliberately unsortable, host chrome has no clickable
  // at all, and our own injected anchor is plumbing. Anything left over means
  // discovery missed a sortable control.
  function classifyBox(element, container) {
    if (!element) return "unknown";
    if (element.matches && element.matches("[data-dso-more-key], .dso-settings-more")) return "own-anchor";
    // Ask the box itself: it is either a single control (a row discovery should
    // have taken), a group of controls (deliberately unsortable) or no control
    // at all (host chrome). Walking up to the container would ask the outlet and
    // call every box "split".
    const self = element.matches && element.matches('button, a, [role="tab"], [role="menuitem"]') ? 1 : 0;
    const nested = element.querySelectorAll ? element.querySelectorAll('button, a, [role="tab"], [role="menuitem"]').length : 0;
    const clickables = Math.max(self, nested);
    if (clickables > 1) return "split-widget";
    if (clickables === 0) return "host-chrome";
    return "unknown";
  }

  function auditScope(scope) {
    const found = state.found[scope];
    const def = scopeDef(scope);
    const axis = (found && found.axis) || (def && def.axis) || "x";
    const report = {
      scope,
      found: !!found,
      containerVia: (found && found.via) || null,
      axis,
      rows: 0,
      hiddenRows: 0,
      painted: 0,
      unmatched: [],
      hollow: [],
      clean: false,
    };
    if (!found || !found.container || !found.container.isConnected) {
      // A scope the host does not render on this route is not an anomaly.
      report.clean = !found;
      return report;
    }
    const hiddenSet = new Set(readScope(scope).hidden);
    const visible = [];
    for (const row of found.rows) {
      if (hiddenSet.has(row.id)) {
        report.hiddenRows += 1;
        continue;
      }
      let rect = row.unit.getBoundingClientRect();
      if (!rect.width && !rect.height) rect = dragSourceBox(row.unit);
      if (!rect || (!rect.width && !rect.height)) {
        report.hollow.push({ id: row.id, reason: "no-box" });
        continue;
      }
      report.rows += 1;
      visible.push({ id: row.id, rect });
    }
    const entries = paintedStripEntries(found, axis, visible);
    report.painted = entries.length;
    // A row the host stopped painting (its wrapper left the DOM while the saved
    // layout entry stayed) is the mirror image of an unowned box.
    for (const row of visible) {
      if (!entries.some((entry) => boxOverlap(row.rect, entry.rect) > 0.5)) report.hollow.push({ id: row.id, reason: "unpainted" });
    }
    const moreTarget = found.moreTarget || found.more;
    const moreRect = moreTarget ? moreTarget.getBoundingClientRect() : null;
    const tails = (found.tails || []).map((element) => element.getBoundingClientRect());
    for (const entry of entries) {
      if (visible.some((row) => boxOverlap(row.rect, entry.rect) > 0.5)) continue;
      if (moreRect && boxOverlap(moreRect, entry.rect) > 0.5) continue;
      if (tails.some((rect) => boxOverlap(rect, entry.rect) > 0.5)) continue;
      report.unmatched.push({
        name: boxName(entry.element),
        reason: classifyBox(entry.element, found.container),
        left: Math.round(entry.rect.left),
        right: Math.round(entry.rect.right),
        top: Math.round(entry.rect.top),
        bottom: Math.round(entry.rect.bottom),
      });
    }
    report.clean = report.hollow.length === 0 && report.unmatched.every((item) => item.reason !== "unknown");
    return report;
  }

  function auditAll() {
    const scopes = {};
    for (const def of SCOPE_DEFS) scopes[def.key] = auditScope(def.key);
    return { version: VERSION, scopes };
  }

  // The line is a 2px bar centred on the boundary, so it covers
  // [boundary - 1, boundary + 1]. Crossing a painted box is the bug the user
  // reports as "blue bar through the icon"; every candidate position is checked
  // against the real boxes instead of trusting a model-derived midpoint.
  function lineCrossesBox(boundary, axis, boxes) {
    for (const box of boxes || []) {
      const lo = axis === "x" ? box.left : box.top;
      const hi = axis === "x" ? box.right : box.bottom;
      if (hi - lo < 3) continue;
      if (boundary + 1 > lo + 0.5 && boundary - 1 < hi - 0.5) return true;
    }
    return false;
  }

  // 8px gaps make the midpoint of two sortable neighbours exactly the centre of
  // whatever sits between them, which is why a missing row turned into a line
  // through that row's glyph. Place the line in the free gap that PRECEDES the
  // item the release will insert before, so line and drop always agree, and give
  // back null when the layout leaves no honest position (the caller then draws no
  // line at all rather than an overlapping one).
  function paintedDropLine(boundary, axis, boxes, targetRect, lastRect, pointerPos) {
    if (!boxes || !boxes.length) return null;
    const startOf = (rect) => (axis === "x" ? rect.left : rect.top);
    const endOf = (rect) => (axis === "x" ? rect.right : rect.bottom);
    let lo;
    let hi;
    if (targetRect) {
      // Insert before this row: the free gap that ends at its own leading edge.
      const targetStart = startOf(targetRect);
      let prevEnd = null;
      for (const box of boxes) {
        const end = endOf(box);
        if (end <= targetStart + 0.5 && (prevEnd === null || end > prevEnd)) prevEnd = end;
      }
      lo = prevEnd === null ? targetStart - 8 : prevEnd;
      hi = targetStart;
    } else {
      // Insert last: the drop lands after every remaining row, and the dragged
      // row keeps painting its own old slot, which is often the very next box.
      // While the hand is still inside that gap the line belongs there (a no-op
      // drop reads as "stays put"). Once the pointer has moved past the slot the
      // gap is behind it, and pinning the line to it looked frozen for the whole
      // rightward drag, so follow the hand out to the painted end of the strip.
      const lastEnd = lastRect ? endOf(lastRect) : null;
      let nextStart = null;
      for (const box of boxes) {
        const start = startOf(box);
        if (lastEnd !== null && start > lastEnd - 0.5 && (nextStart === null || start < nextStart)) nextStart = start;
      }
      const pastSlot = nextStart !== null && pointerPos != null && pointerPos > nextStart + 1;
      if (lastEnd === null) {
        lo = boundary - 3;
        hi = boundary + 3;
      } else if (nextStart === null) {
        lo = lastEnd + 1;
        hi = lastEnd + 7;
      } else if (pastSlot) {
        let end = lastEnd;
        for (const box of boxes) {
          const edge = endOf(box);
          if (edge > end) end = edge;
        }
        lo = end + 1;
        hi = end + 7;
      } else {
        lo = lastEnd;
        hi = nextStart;
      }
    }
    let at;
    if (hi - lo >= 3) {
      at = boundary < lo || boundary > hi ? lo + (hi - lo) / 2 : boundary;
      at = Math.min(Math.max(at, lo + 1.5), hi - 1.5);
    } else {
      at = (lo + hi) / 2;
    }
    return lineCrossesBox(at, axis, boxes) ? null : at;
  }

  // ---- menus -------------------------------------------------------------
  // Vertical menus have the same invariant as the header strip: the line may
  // only sit in a gap that is actually empty on screen. Menus carry dividers,
  // group headings and a mirror row that fades out while the popup closes; none
  // of them is a drop target, but all of them are painted, and a midpoint taken
  // from the sortable rows alone can land on any of them.
  const MENU_SURFACE_HINT = '[role="menu"], [data-dso-ctx-menu], .dsrm-submenu';

  function menuSurfaceOf(element) {
    let node = element || null;
    let fallback = null;
    for (let depth = 0; node && node.parentElement && depth < 5; depth += 1) {
      const parent = node.parentElement;
      if (parent.matches && parent.matches(MENU_SURFACE_HINT)) return parent;
      if (!fallback && parent.children && parent.children.length >= 2) fallback = parent;
      node = parent;
    }
    return fallback;
  }

  function menuBoxPaints(element) {
    if (!element) return false;
    const cls = element.classList;
    if (cls && (cls.contains("dso-ghost") || cls.contains("dso-indicator") || cls.contains("dso-ctx-mirror-out"))) return false;
    if (element.hasAttribute && (element.hasAttribute("hidden") || element.getAttribute("data-dso-hidden") === "1")) return false;
    const style = getComputedStyle(element);
    return style.display !== "none" && style.visibility !== "hidden";
  }
  function paintedMenuBoxes(surface) {
    const boxes = [];
    if (!surface) return boxes;
    // A menu surface paints a glass / backdrop layer as its first child: one
    // node spanning the whole surface that carries no row of its own. It is
    // paint, not a gap, but this box list decides whether a seam is free, and a
    // box covering every seam made every position look occupied - the drop line
    // then never showed at all. Geometry, not a class name, is the rule: a node
    // that covers the entire surface cannot be one row of a multi-row menu.
    const surfaceRect = surface.getBoundingClientRect();
    const spansSurface = (rect) => surfaceRect.width > 0 && surfaceRect.height > 0
      && rect.width >= surfaceRect.width - 1 && rect.height >= surfaceRect.height - 1;
    const add = (element) => {
      if (!menuBoxPaints(element)) return;
      const rect = element.getBoundingClientRect();
      if (spansSurface(rect)) return;
      const children = Array.from(element.children).filter(menuBoxPaints);
      // A wrapper - the host's scroll viewport, a stacked group - owns no row
      // of its own; its children are the rows that paint. A row's icon and
      // label sit side by side instead of on top of each other, so a row keeps
      // its own box and the line cannot slip between two spans of one row.
      let stacked = children.length >= 2;
      let prevBottom = -Infinity;
      for (const child of children) {
        const childRect = child.getBoundingClientRect();
        if (childRect.top < prevBottom - 1) {
          stacked = false;
          break;
        }
        prevBottom = childRect.bottom;
      }
      if (stacked) {
        for (const child of children) add(child);
        return;
      }
      if (rect.width > 0 || rect.height > 0) {
        boxes.push(rect);
        return;
      }
      // display:contents has no box of its own; its children are what paints.
      for (const child of children) add(child);
    };
    for (const child of surface.children) add(child);
    boxes.sort((a, b) => a.top - b.top);
    return boxes;
  }

  // Menu rows stack edge to edge, so a seam has no free gap a 2px bar could
  // occupy: paintedDropLine() then refuses every position between two rows and
  // the line would blink out for most of the menu. A seam is still the right
  // place to draw it - it may cover one pixel of each neighbour, but it must
  // never run through a row's text.
  function menuLineThroughRow(at, boxes) {
    for (const box of boxes) {
      if (box.bottom - box.top < 3) continue;
      if (at > box.top + 1 && at < box.bottom - 1) return true;
    }
    return false;
  }
  function placeMenuLine(gesture, surface, boundary, targetRect, lastRect, pointerPos) {
    const boxes = paintedMenuBoxes(surface);
    let at = boxes.length ? paintedDropLine(boundary, "y", boxes, targetRect, lastRect, pointerPos) : null;
    if (at === null && boxes.length) {
      const rect = surface.getBoundingClientRect();
      const seam = Math.min(Math.max(boundary, rect.top + 1), rect.bottom - 1);
      if (!menuLineThroughRow(seam, boxes)) at = seam;
    }
    if (at === null) {
      hideIndicator(gesture);
      return false;
    }
    const rect = surface.getBoundingClientRect();
    showIndicator(gesture, "y", at, rect, rect);
    return true;
  }

  // Shared by every vertical branch: same target/last semantics as the strips,
  // so the line and the release decision can never disagree.
  function menuDrop(gesture, surface, boundary, others, index, pointerPos) {
    // A list with nothing left to reorder against has no gap to point at: the
    // drop can only mean "stays put", so the line sits on the list's leading
    // edge (the pre-rewrite behaviour for this degenerate case) instead of
    // disappearing, which reads as "drag is broken".
    if (!others.length) {
      if (surface) {
        const rect = surface.getBoundingClientRect();
        showIndicator(gesture, "y", boundary, rect, rect);
      } else hideIndicator(gesture);
      return true;
    }
    const target = others[index] || null;
    const last = others[others.length - 1];
    return placeMenuLine(gesture, surface, boundary, target ? target.rect : null, last ? last.rect : null, pointerPos);
  }

  function menuSurfaceFromItems(items) {
    for (const item of items || []) {
      const surface = menuSurfaceOf(item && (item.unit || item.target || item.element));
      if (surface) return surface;
    }
    return null;
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
      // Pulling a 更多操作 entry out of its submenu: the submenu closes ~160ms
      // after the pointer leaves it, so the drop target is the first-level pane
      // rather than the (possibly already unmounted) submenu.
      if (gesture.rowMenuMoreEntry) {
        const firstPane = rowMenuFirstPane();
        const firstInfo = firstPane ? rowMenuPaneInfo(firstPane) : null;
        if (firstInfo && firstInfo.rows.length && pointIn(firstInfo.rect, x, y, 8)) {
          const live = firstInfo.rows
            .filter((row) => row.rect.width || row.rect.height)
            .map((row) => ({ id: row.id, unit: row.item, target: row.item, rect: row.rect }))
            .sort((a, b) => a.rect.top - b.rect.top);
          const hit = indexAt(live, x, y, "y", live);
          gesture.target = {
            kind: "rm-promote",
            beforeId: live[hit.index] ? live[hit.index].id : null,
          };
          menuDrop(gesture, firstPane, hit.boundary, live, hit.index, y);
          return;
        }
      }
      // A promoted row dropped back on 更多操作 returns to the submenu.
      if (gesture.rowMenuPromoted) {
        const moreWrap = rowMenuMoreWrap();
        const moreRect = moreWrap ? moreWrap.getBoundingClientRect() : null;
        if (moreRect && moreRect.width && pointIn(moreRect, x, y, 0)) {
          gesture.target = { kind: "rm-demote" };
          // Demote stays a "drop on this row" cue rather than an insertion gap,
          // but its width follows the pane so it reads like every other line.
          const moreSurface = menuSurfaceOf(moreWrap) || moreWrap.parentElement;
          const moreSurfaceRect = moreSurface ? moreSurface.getBoundingClientRect() : moreRect;
          showIndicator(gesture, "y", moreRect.bottom, moreSurfaceRect, moreSurfaceRect);
          return;
        }
      }
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
      if (sourceSlotBoundary(live, gesture.id, hit.boundary, "y", gesture.element, gesture.rowMenuPane)) return;
      gesture.target = {
        kind: "rowmenu",
        index: hit.index,
        beforeId: others[hit.index] ? others[hit.index].id : null,
      };
      menuDrop(gesture, pane, hit.boundary, others, hit.index, y);
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
            menuDrop(gesture, state.ctxMorePanel, hit.boundary, others, hit.index, y);
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
      const menuSurface = (model && model.menu && model.menu.isConnected ? model.menu : null) || menuSurfaceFromItems(list);
      menuDrop(gesture, menuSurface, hit.boundary, others, hit.index, y);
      return;
    }

    if (gesture.source === "menu" && snapshot.menuRect && pointIn(snapshot.menuRect, x, y)) {
      const targets = snapshot.menuTargets || snapshot.menuItems;
      const others = targets.filter((item) => item.id !== gesture.id);
      const hit = indexAt(others, x, y, "y", targets);
      gesture.target = { kind: "menu", index: hit.index, beforeId: others[hit.index] ? others[hit.index].id : null };
      menuDrop(gesture, menuSurfaceFromItems(targets), hit.boundary, others, hit.index, y);
      return;
    }

    if (snapshot.moreRect && pointIn(snapshot.moreRect, x, y, 2)) {
      gesture.target = { kind: "hide" };
      dropMore = true;
      return;
    }

    // Only horizontal strips get the extended band: a vertical list keeps its old
    // "outside the box cancels" behaviour so dragging a row below the sidebar
    // still means nothing instead of silently meaning "move to the end".
    const outsideStrip = !pointIn(snapshot.container, x, y, 10)
      && !(snapshot.axis === "x" && nearStrip(snapshot.container, x, y, snapshot.axis, 10));
    if (outsideStrip) return;
    const others = snapshot.items.filter((item) => item.id !== gesture.id);
    const hit = indexAt(others, x, y, snapshot.axis, snapshot.items);
    const strip = snapshot.found ? snapshot.found.container : null;
    if (sourceSlotBoundary(snapshot.items, gesture.id, hit.boundary, snapshot.axis, gesture.element, strip)) return;
    gesture.target = { kind: "place", index: hit.index, beforeId: others[hit.index] ? others[hit.index].id : null };
    // The line has to describe the slot the release will use, and it has to stay
    // out of everything the host paints in this strip. Items know the slot; only
    // measured boxes know the paint. Measure first, fall back to the item-only
    // clearance when the host re-rendered the strip mid-drag, and draw no line
    // rather than an overlapping one when neither yields a free position.
    const boxes = paintedStripBoxes(snapshot.found, snapshot.axis, snapshot.items);
    const target = others[hit.index] || null;
    const last = others.length && !target ? others[others.length - 1] : null;
    const pointerPos = snapshot.axis === "x" ? x : y;
    let boundary = boxes.length
      ? paintedDropLine(hit.boundary, snapshot.axis, boxes, target ? target.rect : null, last ? last.rect : null, pointerPos)
      : null;
    if (boundary === null) {
      boundary = boundaryClearOfRows(hit.boundary, snapshot.axis, snapshot.items.map((item) => item.rect));
      if (boxes.length && lineCrossesBox(boundary, snapshot.axis, boxes)) boundary = null;
    }
    if (boundary === null) hideIndicator(gesture);
    else showIndicator(gesture, snapshot.axis, boundary, snapshot.container, snapshot.crossRect);
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
    // The drop line is mounted BEFORE the drag preview on purpose: both use
    // GHOST_Z because that is exactly the row-menu surface's level (nothing
    // lower would clear the open menu), and at equal z-index the element later
    // in the tree paints on top. Appending the line second drew it straight
    // across the ghost whenever the drop gap fell inside the dragged row.
    gesture.indicator = createIndicator();
    gesture.ghost = createGhost(element, rect);
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
          // The flight was interrupted (Escape, window blur, dispose). The drop
          // never happened, so its commit must not run behind a closed menu.
          if (state.gesture === gesture) cancelGesture();
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
      if (target.kind === "rm-promote") {
        if (!promoteRowMenuEntry(gesture, target.beforeId)) {
          shakeGhost(gesture);
          return;
        }
        gesture.keepMenu = true;
        endGesture(true);
        return;
      }
      if (target.kind === "rm-demote") {
        if (!demoteRowMenuEntry(gesture)) {
          shakeGhost(gesture);
          return;
        }
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
          ? model.rows.filter((row) => hidden.indexOf(row.id) === -1).length
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
      const moved = gesture.source === "menu"
        ? reveal(gesture.scope, gesture.id, target.index, target.beforeId)
        : reorder(gesture.scope, gesture.id, target.index, target.beforeId);
      if (moved === false) shakeGhost(gesture);
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
      startGesture(rowEl, ROW_MENU_SCOPE, rowId, "rowmenu", event, {
        pane: rowMenuPane,
        paneName: rowMenuPaneName(rowMenuPane),
      });
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
      const parsed = menuKey(menuRow);
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
      rowMenuPaneName: meta && meta.paneName ? meta.paneName : "",
      rowMenuMoreEntry: null,
      rowMenuPromoted: false,
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
    if (scope === ROW_MENU_SCOPE) {
      gesture.rowMenuPromoted = element.hasAttribute(ROW_MENU_PROMOTED_ATTR);
      // A 更多操作 row can only be pulled out if row-menu's controller tells us
      // which host action it runs; the menu closes before that action executes.
      if (gesture.rowMenuPaneName === "more") gesture.rowMenuMoreEntry = rowMenuMoreEntryForRow(element);
    }
    state.gesture = gesture;
    gesture.timer = window.setTimeout(() => {
      if (source === "row") element.classList.remove("dso-dragging");
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
        if (gesture.element) gesture.element.classList.remove("dso-dragging");
        if (gesture.timer) window.clearTimeout(gesture.timer);
        cancelGesture();
      }
      return;
    }
    event.preventDefault();
    positionGhost(gesture);
    updateDragTarget(gesture, event.clientX, event.clientY);
  }

  // A cancelled pointer (touch scroll, pen leaving range) is not a drop: the
  // user never released over a target. Treat it like Escape.
  function onPointerCancel() {
    if (state.gesture) cancelGesture();
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
    // Auto-repeat would rewrite the whole layout dozens of times a second (and
    // refocus the row on every tick). One row per deliberate press.
    if (event.repeat) {
      event.preventDefault();
      return;
    }
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
    // A scrolling page fires several scroll events per frame, and rebuilding the
    // snapshot measures every row; one rebuild per frame is enough.
    if (state.scrollFrame) return;
    const rebuild = () => {
      state.scrollFrame = 0;
      const live = state.gesture;
      if (!live || !live.started) return;
      const snapshot = buildSnapshot(live);
      if (snapshot) live.snapshot = snapshot;
      positionGhost(live);
      updateDragTarget(live, live.x, live.y);
    };
    if (typeof window.requestAnimationFrame === "function") {
      state.scrollFrame = window.requestAnimationFrame(rebuild);
    } else {
      rebuild();
    }
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
        // Mark the runtime dead as well: the host keeps calling refresh()/pass()
        // through the plugin handle (and the settings page), and a runtime that
        // only skipped start() still applied every layout pass.
        state.stopped = true;
        return;
      }
    } catch (err) {
      /* ignore */
    }

    addListener(document, "pointerdown", onPointerDown, true);
    addListener(document, "pointermove", onPointerMove, { capture: true, passive: false });
    addListener(document, "pointerup", onPointerUp, true);
    addListener(document, "pointercancel", onPointerCancel, true);
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
        // With no menu on screen at all, skip the repaint (it costs three
        // document-wide queries) after one cheap check.
        if (
          layoutChanged ||
          state.contextMenu ||
          state.ctxMoreOpen ||
          document.querySelector('[role="menu"], [' + ROW_MENU_ATTR + "]")
        ) {
          scheduleContextSync();
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
    scheduleContextSync();
  }

  function stop() {
    if (state.stopped) return;
    state.stopped = true;
    if (state.passFrame) window.cancelAnimationFrame(state.passFrame);
    state.passFrame = 0;
    state.passScheduled = false;
    state.passDeferred = false;
    state.passTimes = [];
    if (state.passRetryTimer) {
      window.clearTimeout(state.passRetryTimer);
      state.passRetryTimer = 0;
    }
    cancelContextMoreTimer();
    // Shortcuts adopted out of the host menu are our DOM; leaving them behind
    // keeps dead buttons in the header after a hot reload or plugin disable.
    clearHostActionButtons();
    if (state.contextFrame) {
      window.cancelAnimationFrame(state.contextFrame);
      window.clearTimeout(state.contextFrame);
      state.contextFrame = 0;
    }
    if (state.scrollFrame) {
      window.cancelAnimationFrame(state.scrollFrame);
      state.scrollFrame = 0;
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
    state.guardUntil = 0;
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
    // Pure identity helpers, exposed so the layout harness (and a live console)
    // can assert the derivation rules without mutating a host row's label.
    identity: { canonicalLabel, fingerprintOf, idFingerprint, fingerprintAffinity },
    audit: (scope) => (scope ? auditScope(scope) : auditAll()),
    contextMenu: {
      supported: contextMenusSupported(),
      enabled: readContextMenuEnabled,
      setEnabled: setContextMenuEnabled,
      reset: resetContextMenus,
      resetRowMenu,
      rowMenu: {
        takeover: readRowMenuTakeover,
        promoted: readRowMenuPromoted,
        dividers: readRowMenuDividers,
      },
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
      // Without a dependency list this ran on *every* render, scanning the whole
      // menu for rows each time. The runtime notification (force) and the entry
      // list are what actually change the folded rows.
    }, [region, props && props.entries, force, runtimeInstance]);

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

/*
 * Navigation glyphs. DSH 0.2.2's `settings.section.icon` slot hands the
 * component { size, active } and colours it with the nav row's currentColor,
 * so the shape only needs to own the 16px grid: 1.5 stroke, round caps, same
 * weight as the host's own outline icons. `active` is intentionally ignored —
 * the host's shipped icons do not swap to a filled variant either.
 *
 * One variant is active (SETTINGS_NAV_ICON in constants.js); the rest stay here
 * as documented alternatives for the next redesign.
 */
const SETTINGS_NAV_GLYPHS = {
  // A narrow left rail plus a split main area.
  split: [
    ["rect", { x: 2.5, y: 2.5, width: 11, height: 11, rx: 2 }],
    ["path", { d: "M6.5 2.5V13.5" }],
    ["path", { d: "M6.5 8H13.5" }],
  ],
  // Four slots, the last one dashed: a panel waiting to be dropped somewhere.
  grid: [
    ["rect", { x: 2.5, y: 2.5, width: 4.6, height: 4.6, rx: 1.2 }],
    ["rect", { x: 8.9, y: 2.5, width: 4.6, height: 4.6, rx: 1.2 }],
    ["rect", { x: 2.5, y: 8.9, width: 4.6, height: 4.6, rx: 1.2 }],
    [
      "rect",
      {
        x: 8.9,
        y: 8.9,
        width: 4.6,
        height: 4.6,
        rx: 1.2,
        strokeDasharray: "1.5 1.5",
      },
    ],
  ],
  // A panel with its drag handle on the left.
  drag: [
    ["rect", { x: 4.5, y: 2.5, width: 9, height: 11, rx: 1.6 }],
    ["circle", { cx: 2.6, cy: 5, r: 0.82, fill: "currentColor", stroke: "none" }],
    ["circle", { cx: 2.6, cy: 8, r: 0.82, fill: "currentColor", stroke: "none" }],
    ["circle", { cx: 2.6, cy: 11, r: 0.82, fill: "currentColor", stroke: "none" }],
  ],
  // Two panels with a vertical double arrow: swap this side for that one.
  swap: [
    ["rect", { x: 2.5, y: 2.5, width: 3.6, height: 11, rx: 1.3 }],
    ["rect", { x: 9.9, y: 2.5, width: 3.6, height: 11, rx: 1.3 }],
    ["path", { d: "M8 4.8V11.2" }],
    ["path", { d: "M6.7 6.1 8 4.8l1.3 1.3" }],
    ["path", { d: "M6.7 9.9 8 11.2l1.3-1.3" }],
  ],
  // Three rows with drag dots: the nav list itself, in order.
  rows: [
    ["circle", { cx: 3.1, cy: 4, r: 0.72, fill: "currentColor", stroke: "none" }],
    ["circle", { cx: 4.9, cy: 4, r: 0.72, fill: "currentColor", stroke: "none" }],
    ["path", { d: "M7 4h6.5" }],
    ["circle", { cx: 3.1, cy: 8, r: 0.72, fill: "currentColor", stroke: "none" }],
    ["circle", { cx: 4.9, cy: 8, r: 0.72, fill: "currentColor", stroke: "none" }],
    ["path", { d: "M7 8h6.5" }],
    ["circle", { cx: 3.1, cy: 12, r: 0.72, fill: "currentColor", stroke: "none" }],
    ["circle", { cx: 4.9, cy: 12, r: 0.72, fill: "currentColor", stroke: "none" }],
    ["path", { d: "M7 12h6.5" }],
  ],
};

function createSettingsNavIcon(variant) {
  const React = sharedReact;
  if (!React) return null;
  const h = React.createElement;
  const glyph = SETTINGS_NAV_GLYPHS[variant] || SETTINGS_NAV_GLYPHS.split;
  return function SettingsNavIcon(props) {
    const size = (props && props.size) || 16;
    return h(
      "svg",
      {
        width: size,
        height: size,
        viewBox: "0 0 16 16",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 1.5,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        "aria-hidden": "true",
        focusable: "false",
      },
      glyph.map((node, index) => h(node[0], { key: index, ...node[1] }))
    );
  };
}

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
        className:
          "dso-config-switch" +
          (props.enabled ? " is-on" : "") +
          (props.disabled ? " is-disabled" : ""),
        disabled: props.disabled,
        title: props.disabled
          ? text.hotkeyNeedKey
          : props.enabled
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

  // Optional keyboard gate in front of the long-press drag. Unbound means the
  // old behaviour, so the two mode switches stay disabled until a key exists.
  function HotkeyCard(props) {
    const text = props.text;
    const runtime = runtimeInstance;
    const config = runtime.hotkey();
    const [recording, setRecording] = React.useState(false);

    React.useEffect(() => {
      if (!recording) {
        runtime.setHotkeyCapture(false);
        return undefined;
      }
      runtime.setHotkeyCapture(true);
      function onRecord(event) {
        // Escape: the host closes its dialog on it, but this card is also shown
        // inline in the plugin detail, where nothing closes and the recorder
        // would keep swallowing every key. Stop waiting here either way; it is
        // never a binding.
        if (event.key === "Escape") {
          setRecording(false);
          return;
        }
        if (event.key === "Backspace" || event.key === "Delete") {
          runtime.setHotkey({ code: "", key: "", ctrl: false, alt: false, shift: false, meta: false });
          setRecording(false);
          return;
        }
        // Modifier-only presses cannot be a binding: keep listening.
        if (isHotkeyModifier(event.key)) return;
        if (!event.code) return;
        runtime.setHotkey({
          code: event.code,
          key: event.key,
          ctrl: !!event.ctrlKey,
          alt: !!event.altKey,
          shift: !!event.shiftKey,
          meta: !!event.metaKey,
        });
        setRecording(false);
      }
      runtime.setHotkeyCaptureHandler(onRecord);
      // Pressing anywhere else means "not this key": stop waiting instead of
      // swallowing the next keystroke on another page.
      function onOutside(event) {
        const target = event.target;
        if (target && target.nodeType === 1 && target.closest(".dso-config-hotkey")) return;
        setRecording(false);
      }
      window.addEventListener("pointerdown", onOutside, true);
      return () => {
        runtime.setHotkeyCaptureHandler(null);
        window.removeEventListener("pointerdown", onOutside, true);
        runtime.setHotkeyCapture(false);
      };
    }, [recording]);

    const bound = !!config.code;

    return h(
      "section",
      { className: "dso-config-card dso-config-card-hotkey" },
      h(
        "header",
        { className: "dso-config-card-head" },
        h("h4", { className: "dso-config-card-title" }, text.hotkey),
        h(
          "div",
          { className: "dso-config-hotkey-actions" },
          h(
            "button",
            {
              type: "button",
              className:
                "dso-config-hotkey" +
                (recording ? " is-recording" : "") +
                (bound ? " is-bound" : ""),
              title: text.hotkeyBindHint,
              onClick: () => setRecording((value) => !value),
            },
            recording
              ? text.hotkeyRecording
              : bound
              ? hotkeyLabel(config)
              : text.hotkeyUnbound
          ),
          bound && !recording
            ? h(
                "button",
                {
                  type: "button",
                  className: "dso-config-reset",
                  title: text.hotkeyClear,
                  onClick: () =>
                    runtime.setHotkey({
                      code: "",
                      key: "",
                      ctrl: false,
                      alt: false,
                      shift: false,
                      meta: false,
                    }),
                },
                text.hotkeyClear
              )
            : null
        )
      ),
      h(
        "div",
        { className: "dso-config-hotkey-modes" },
        h(DragSwitch, {
          text,
          label: text.hotkeyHold,
          enabled: !!config.hold,
          disabled: !bound,
          titleOn: text.hotkeyHoldOn,
          titleOff: text.hotkeyHoldOff,
          onToggle: () => runtime.setHotkey({ hold: !config.hold }),
        }),
        h(DragSwitch, {
          text,
          label: text.hotkeyToggle,
          enabled: !!config.toggle,
          disabled: !bound,
          titleOn: text.hotkeyToggleOn,
          titleOff: text.hotkeyToggleOff,
          onToggle: () => runtime.setHotkey({ toggle: !config.toggle }),
        })
      )
    );
  }

  // A switch whose value another window can also change. The copy lives in
  // localStorage, which only notifies same-origin windows, and the desktop
  // window has its own origin; re-read it whenever this window wakes instead.
  function useSharedFlag(read) {
    const [value, setValue] = React.useState(read);
    React.useEffect(() => {
      const refresh = () => setValue(read());
      window.addEventListener("storage", refresh);
      window.addEventListener("focus", refresh);
      document.addEventListener("visibilitychange", refresh);
      return () => {
        window.removeEventListener("storage", refresh);
        window.removeEventListener("focus", refresh);
        document.removeEventListener("visibilitychange", refresh);
      };
    }, []);
    return [value, setValue];
  }

  // The escape hatch for the cross-window copy: off means every window keeps
  // the layout it has locally and nothing is uploaded (pre-0.7.2 behaviour).
  function SyncCard(props) {
    const text = props.text;
    const [enabled, setEnabled] = useSharedFlag(isCrossWindowEnabled);
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

  // Session and workspace right-click menus. The card does not exist at all on
  // 0.2.1: there is no contextual Menu to manage there, and a switch that does
  // nothing is worse than no switch.
  function ContextMenuCard(props) {
    const runtime = runtimeInstance;
    const text = props.text;
    const [enabled, setEnabled] = useSharedFlag(readContextMenuEnabled);
    if (!contextMenusSupported()) return null;
    return h(
      "section",
      { className: "dso-config-card dso-config-card-context" },
      h(
        "header",
        { className: "dso-config-card-head" },
        h(
          "div",
          { className: "dso-config-card-heading" },
          h("h4", { className: "dso-config-card-title" }, text.contextMenu),
          h(DragSwitch, {
            text,
            label: "",
            enabled,
            titleOn: text.contextMenuOn,
            titleOff: text.contextMenuOff,
            onToggle: () => {
              const next = !enabled;
              setEnabled(next);
              if (runtime) runtime.contextMenu.setEnabled(next);
            },
          })
        ),
        h(
          "div",
          { className: "dso-config-actions" },
          h(
            "button",
            {
              type: "button",
              className: "dso-config-reset",
              title: text.resetRowMenuHint,
              onClick: () => {
                if (runtime) runtime.contextMenu.resetRowMenu();
              },
            },
            text.resetRowMenu
          ),
          h(
            "button",
            {
              type: "button",
              className: "dso-config-reset",
              title: text.resetScopeHint,
              onClick: () => {
                if (runtime) runtime.contextMenu.reset();
              },
            },
            text.resetScope
          )
        )
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
    const dropAfterRef = React.useRef(false);
    const indexById = new Map();
    visible.forEach((row, index) => indexById.set(row.id, index));

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

    // `at` is an insertion index in the visible list counted with the source
    // row still in it; reorder() expects the index after the source is removed.
    function place(source, at) {
      const sourceIndex = visible.findIndex((row) => row.id === source);
      if (sourceIndex === -1) return;
      if (sourceIndex < at) at -= 1;
      if (at === sourceIndex) return;
      runtime.reorder(scope.scope, source, at);
    }

    // Dropping on a row's lower half puts the row after it; dropping on the
    // empty area below the list moves it to the end (there was no way to reach
    // the last slot before, because a drop always landed *before* its target).
    function dropOn(targetId, after) {
      const source = dragRef.current;
      if (!source) return;
      if (!targetId) {
        place(source, visible.length);
        return;
      }
      if (source === targetId) return;
      const targetIndex = visible.findIndex((row) => row.id === targetId);
      if (targetIndex === -1) return;
      place(source, targetIndex + (after ? 1 : 0));
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
        {
          className: "dso-config-list",
          onDragOver: (event) => {
            // An empty area under the rows must still accept the drop.
            if (dragRef.current) event.preventDefault();
          },
          onDrop: (event) => {
            event.preventDefault();
            setOver(null);
            dropOn(null, false);
          },
        },
        rows.map((row) => {
          // O(1) lookup: indexOf() inside the render loop made this quadratic.
          const index = row.hidden ? -1 : (indexById.has(row.id) ? indexById.get(row.id) : -1);
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
                  const box = event.currentTarget.getBoundingClientRect();
                  dropAfterRef.current = event.clientY > box.top + box.height / 2;
                  setOver((value) => (value === row.id ? value : row.id));
                }
              },
              onDragLeave: (event) => {
                // Moving between a row's own children fires dragleave on the
                // row too; only a real exit should clear the highlight.
                const next = event.relatedTarget;
                if (next && event.currentTarget.contains(next)) return;
                setOver((value) => (value === row.id ? null : value));
              },
              onDrop: (event) => {
                event.preventDefault();
                event.stopPropagation();
                setOver(null);
                dropOn(row.id, dropAfterRef.current);
              },
            },
            row.fixed
              ? h("span", { className: "dso-config-grip is-fixed", title: text.fixed }, h(Icon, { name: "grip" }))
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
      h(HotkeyCard, { text }),
      h(ContextMenuCard, { text }),
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

/** The host version the boot payload advertises, or "" when unavailable. */
function hostReleaseVersion() {
  try {
    const boot = window.__DSH_BOOT__;
    const release = boot && boot.release;
    return release && typeof release.version === "string" ? release.version : "";
  } catch (error) {
    return "";
  }
}

/**
 * Compare a host version against major.minor.patch. Prerelease suffixes are
 * ignored on purpose: 0.2.2-rc.1 already ships the settings icon slot, so it
 * must pass a `>= 0.2.2` gate. Returns null when the string is unparseable.
 */
function versionAtLeast(value, major, minor, patch) {
  const match = /^(\d+)\.(\d+)\.(\d+)/.exec(String(value || ""));
  if (!match) return null;
  const have = [Number(match[1]), Number(match[2]), Number(match[3])];
  const want = [major, minor, patch];
  for (let i = 0; i < 3; i += 1) {
    if (have[i] > want[i]) return true;
    if (have[i] < want[i]) return false;
  }
  return true;
}

/**
 * `settings.section.icon` exists from 0.2.2 on. When the version cannot be
 * read (older boot payloads, tests) try anyway: an unknown slot throws inside
 * the try/catch around inject, which is the same path 0.2.1 takes.
 */
function supportsSettingsIcons() {
  const supported = versionAtLeast(hostReleaseVersion(), 0, 2, 2);
  return supported === null ? true : supported;
}

/**
 * Right-click menus are the shared contextual Menu surface, added in 0.2.2.
 * 0.2.1 has no `[data-context-menu]` to manage, so the feature (and its
 * settings card) switches itself off there instead of half-working.
 */
function contextMenusSupported() {
  const supported = versionAtLeast(hostReleaseVersion(), 0, 2, 2);
  return supported === null ? true : supported;
}

function apply(ctx) {
  // Which build the page is actually running. The host can serve a client.js
  // from an earlier build right after a sync, so verification reads this
  // stamp instead of assuming the newest file is what executed.
  window.__DSO_BUILD__ = "0.10.1+309dec674a";
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
      stopHostSync();
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

    // 0.2.2 looks the icon up by section id. Registering against an older host
    // throws for the undeclared slot, so the version gate skips it there and
    // try/catch still guards the "version unknown" attempt.
    const SettingsNavIcon = createSettingsNavIcon(SETTINGS_NAV_ICON);
    if (SettingsNavIcon && supportsSettingsIcons()) {
      try {
        ctx.slots.inject(SETTINGS_ICON_SLOT, () =>
          ctx.slots.register(
            {
              name: SETTINGS_ICON_SLOT,
              id: SETTINGS_ID,
              order: 35,
              registrant: REGISTRANT,
            },
            SettingsNavIcon
          )
        );
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn("[dsh-sidebar-organizer] cannot add the settings nav icon", error);
      }
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
    settingsNavIcon: SETTINGS_NAV_ICON,
    pass: () => runtime && runtime.pass(),
    refresh: () => runtime && runtime.refresh(),
    snapshot: () => (runtime ? runtime.snapshot() : []),
    // Structure audit: rows the model knows about vs boxes the host paints.
    audit: (scope) => (runtime ? runtime.audit(scope) : null),
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
    hotkey: () => (runtime ? runtime.hotkey() : null),
    setHotkey: (patch) => (runtime ? runtime.setHotkey(patch) : null),
    disable: () => {
      try {
        window.localStorage.setItem(DISABLED_KEY, "1");
      } catch (error) {
        /* ignore */
      }
      if (runtime) runtime.stop();
      stopHostSync();
    },
    dispose: () => {
      if (runtime) runtime.stop();
      runtime = null;
      runtimeInstance = null;
      stopHostSync();
    },
    // Pure id-derivation rules; see src/scopes.js. Useful in a live console too.
    identity: () =>
      runtime ? runtime.identity : { canonicalLabel: null, fingerprintOf: null, idFingerprint: null, fingerprintAffinity: null },
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
    // 0.2.2 right-click menus (session rows / workspace rows). `supported` is a
    // plain value so a console can answer "does this host have the feature"
    // without a runtime.
    contextMenu: {
      supported: contextMenusSupported(),
      enabled: () => contextMenusSupported() && readContextMenuEnabled(),
      setEnabled: (enabled) => {
        if (runtime) return runtime.contextMenu.setEnabled(Boolean(enabled));
        return writeContextMenuEnabled(Boolean(enabled));
      },
      reset: () => {
        if (runtime) runtime.contextMenu.reset();
        else resetContextMenuLayouts();
      },
      resetRowMenu: () => {
        if (runtime) return runtime.contextMenu.resetRowMenu();
        clearRowMenuLayout();
        return true;
      },
      read: (kind) => readContextMenuLayout(kind),
      set: (kind, layout) => {
        if (runtime) runtime.contextMenu.set(kind, layout);
        else writeContextMenuLayout(kind, layout);
      },
      refresh: () => {
        if (runtime) runtime.contextMenu.refresh();
        else scheduleContextSync();
      },
      rowMenu: {
        takeover: () => readRowMenuTakeover(),
        promoted: () => readRowMenuPromoted(),
        dividers: (name) => readRowMenuDividers(name),
      },
    },
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
