/* The single row this plugin registers into the sidebar's "More" menu. */

function createMenuEntry() {
  const React = sharedReact;
  if (!React) return null;

  function Row(props) {
    // Mirror the shipped rows ("Browse plugins" / "Create your plugin"): they
    // hand their glyph to MenuItemButton through the `icon` prop, and the
    // component owns the icon column, spacing and alignment.
    //
    // The glyph must reach React as markup, never as a live DOM node: React 18
    // throws "Objects are not valid as a React child" for host nodes, the slot
    // error boundary then abdicates this entry, and the whole "已收纳" group
    // silently disappears from the menu (0.3.2 regression).
    const runtime = runtimeInstance;
    const markup = props.icon === false || !runtime ? null : runtime.iconFor(props.id);
    const icon = markup
      ? React.createElement("span", {
          className: "dso-menu-icon",
          dangerouslySetInnerHTML: { __html: markup },
        })
      : undefined;

    if (sharedMenuButton) {
      return React.createElement(
        sharedMenuButton,
        { key: props.id, icon, onSelect: props.onSelect },
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

  /**
   * Degraded list used if anything in the styled rows ever throws at render
   * time. A thrown error would otherwise let the slot error boundary abdicate
   * this entry and the whole "已收纳" group would vanish without a trace.
   */
  function PlainRows(props) {
    const { runtime, text, onOpen, onDismiss } = props;
    const hidden = runtime.hiddenKeys();
    const children = [];
    if (hidden.length > 0) {
      children.push(
        React.createElement(
          "div",
          { key: "caption", className: "dso-menu-caption" },
          text.hidden
        )
      );
      for (const id of hidden) {
        children.push(
          React.createElement(
            "div",
            { key: id, className: "dso-menu-item", "data-dso-more-key": id },
            React.createElement(
              "button",
              {
                type: "button",
                className: "dso-menu-row",
                onClick: () => {
                  if (onDismiss) onDismiss();
                  if (onOpen) onOpen(id);
                },
              },
              runtime.labelFor(id)
            )
          )
        );
      }
    }
    if (runtime.isCustomized()) {
      children.push(
        React.createElement(
          "button",
          {
            key: "reset",
            type: "button",
            className: "dso-menu-row",
            onClick: () => {
              runtime.reset();
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

  function ModmenuMenuContent(props) {
    const [, force] = React.useState(0);
    React.useEffect(() => {
      const runtime = runtimeInstance;
      if (!runtime) return undefined;
      return runtime.subscribeMenu(() => force((value) => value + 1));
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
    const hidden = runtime.hiddenKeys();
    const children = [];

    if (hidden.length > 0) {
      children.push(
        React.createElement(
          "div",
          { key: "caption", className: "dso-menu-caption" },
          text.hidden
        )
      );
      for (const id of hidden) {
        // Use the row's own rendered label ("插件"), never the raw slot id
        // ("plugins"): the sidebar's More-menu projection deliberately drops the
        // plugins entry, so ids alone leave that row untranslated.
        const label = runtime.labelFor(id);
        children.push(
          React.createElement(
            "div",
            { key: id, className: "dso-menu-item", "data-dso-more-key": id },
            React.createElement(Row, {
              id,
              label,
              // Open the panel and keep it tucked away: the More menu is a
              // launcher, not a "restore" action. Restoring is done by dragging
              // the row back onto the sidebar.
              onSelect: () => {
                if (props && props.onDismiss) props.onDismiss();
                if (props && props.onOpen) props.onOpen(id);
              },
            })
          )
        );
      }
    }

    if (runtime.isCustomized()) {
      children.push(
        React.createElement(Row, {
          key: "reset",
          id: "__reset",
          label: text.reset,
          icon: false,
          onSelect: () => {
            runtime.reset();
            if (props && props.onDismiss) props.onDismiss();
          },
        })
      );
    }

    if (children.length === 0) return null;
    return React.createElement(
      MenuBoundary,
      { fallback: React.createElement(PlainRows, { runtime, text, onOpen: props && props.onOpen, onDismiss: props && props.onDismiss }) },
      React.createElement(React.Fragment, null, children)
    );
  }

  return ModmenuMenuContent;
}
