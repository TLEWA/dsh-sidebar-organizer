/* Constants, locale strings and the module-level shared handles. */

// Replaced at build time from package.json by scripts/build.mjs.
const VERSION = "__VERSION__";

const PANEL_SLOT = "sidebar.panellist";
const ACTIONS_SLOT = "sidebar.panellist.actions";
const STORAGE_KEY = "dsh.sidebar-organizer.layout.v1";
const DISABLED_KEY = "dsh.sidebar-organizer.disabled";
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
  },
  en: {
    hidden: "Hidden panels",
    reset: "Reset layout",
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
