/* Constants, locale strings and the module-level shared handles. */

// Replaced at build time from package.json by scripts/build.mjs.
const VERSION = "__VERSION__";

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
// session row menu, the workspace row menu and, since dsh-sidebar-row-menu 1.13
// on rc.2+, the conversation body menu (kind "conversation"): its rows are
// host-rendered too, because row-menu registers the body menu through the same
// ctx.contextMenus service. The end user asked for all three to drag the same
// way. Each kind keeps its own order and its own dividers, applied to the open
// DOM and remembered here. Dividers are stored as GAP indexes, never attached
// to a row: the user asked for a separator that stays where it was placed when
// rows move across it.
const CONTEXT_MENU_KEY = "dsh.sidebar-organizer.context-menu.v1";
const CONTEXT_MENU_KINDS = ["session", "workspace", "conversation"];
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
