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
