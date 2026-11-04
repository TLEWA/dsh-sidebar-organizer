/* Constants, locale strings and the module-level shared handles. */

// Replaced at build time from package.json by scripts/build.mjs.
const VERSION = "__VERSION__";

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
