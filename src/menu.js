/* Region-aware "More" menu rows: one component per host menu region. */

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

    const runtime = runtimeInstance;
    if (!runtime) return null;
    const text = strings();
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
