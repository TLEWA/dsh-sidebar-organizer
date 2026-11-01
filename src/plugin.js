/* Plugin entry: styles, module lookup, apply(). */

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

  // Register the More-menu row exactly once. It never re-registers, so it cannot
  // feed back into the sidebar's slot subscriptions.
  const menuEntry = createMenuEntry();
  if (menuEntry && ctx.slots && typeof ctx.slots.inject === "function") {
    try {
      ctx.slots.inject(ACTIONS_SLOT, () =>
        ctx.slots.register(
          {
            name: ACTIONS_SLOT,
            id: "panel-organizer",
            order: 100,
            registrant: REGISTRANT,
          },
          menuEntry
        )
      );
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn("[dsh-sidebar-organizer] cannot add the More-menu row", error);
    }
  }

  window.__dshSidebarOrganizer = {
    version: VERSION,
    pass: () => runtime && runtime.pass(),
    reset: () => runtime && runtime.reset(),
    hide: (key) => runtime && runtime.hide(key),
    reveal: (key) => runtime && runtime.reveal(key),
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
    status: () => ({
      version: VERSION,
      order: readLayout().order,
      hidden: readLayout().hidden,
      entries: readPanelEntries(ctx).length,
      nav: Boolean(runtime && runtime.state.nav),
      navLabel: runtime && runtime.state.nav ? runtime.state.nav.getAttribute("aria-label") : null,
      rows: Array.from(document.querySelectorAll("[data-dso-key]")).map((element) => ({
        key: element.getAttribute("data-dso-key"),
        hidden: element.getAttribute("data-dso-hidden") === "1",
      })),
      dragging: Boolean(runtime && runtime.state.gesture),
    }),
  };
  // backward-compatible handle for consoles/docs written before the rename
  window.__dshModmenu = window.__dshSidebarOrganizer;
}
