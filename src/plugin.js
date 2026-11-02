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
  };
  // backward-compatible handle for consoles/docs written before the rename
  window.__dshModmenu = window.__dshSidebarOrganizer;
}
