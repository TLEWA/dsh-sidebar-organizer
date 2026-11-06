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
