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
        // Escape belongs to the host here: it closes the settings dialog, which
        // also ends the recording. Clicking anywhere else cancels as well.
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

  // Session and workspace right-click menus. The card does not exist at all on
  // 0.2.1: there is no contextual Menu to manage there, and a switch that does
  // nothing is worse than no switch.
  function ContextMenuCard(props) {
    const runtime = runtimeInstance;
    const text = props.text;
    const [enabled, setEnabled] = React.useState(readContextMenuEnabled());
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
          "button",
          {
            type: "button",
            className: "dso-config-reset",
            onClick: () => {
              if (runtime) runtime.contextMenu.reset();
            },
          },
          text.resetScope
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
      h(HotkeyCard, { text }),
      h(ContextMenuCard, { text }),
      scopes.map((scope) => h(ScopeCard, { key: scope.scope, scope, text }))
    );
  }

  return SettingsPage;
}
