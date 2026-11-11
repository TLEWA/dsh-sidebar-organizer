import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { createClientEnv } from "./helpers/client-env.mjs";

const UNION = '[data-slot="sidebar.panellist"], [data-slot="sidebar.panel.icon"]';

function descendants(node) {
  return node.children.flatMap((child) => [child, ...descendants(child)]);
}

function element(tag, attrs = {}, children = []) {
  const node = {
    nodeType: 1,
    tagName: tag.toUpperCase(),
    id: attrs.id || "",
    children,
    parentElement: null,
    getAttribute(name) {
      return Object.prototype.hasOwnProperty.call(attrs, name) ? attrs[name] : null;
    },
    matches(selector) {
      if (selector === "button") return tag.toLowerCase() === "button";
      if (selector === '[aria-haspopup="menu"]') return attrs["aria-haspopup"] === "menu";
      return false;
    },
    querySelector(selector) {
      if (selector === ":scope > button[aria-label]") {
        return children.find((child) => child.tagName === "BUTTON" && child.getAttribute("aria-label")) || null;
      }
      if (selector === ':scope > button[aria-haspopup="menu"]') {
        return children.find(
          (child) => child.tagName === "BUTTON" && child.getAttribute("aria-haspopup") === "menu"
        ) || null;
      }
      if (selector === '[aria-haspopup="menu"]' || selector === "button") {
        const found = descendants(node).find((child) =>
          selector === "button" ? child.tagName === "BUTTON" : child.getAttribute("aria-haspopup") === "menu"
        );
        return found || null;
      }
      return null;
    },
    querySelectorAll() {
      return [];
    },
    closest(selector) {
      let current = this;
      while (current) {
        if (selector === "nav" && current.tagName === "NAV") return current;
        if (selector === "button" && current.tagName === "BUTTON") return current;
        current = current.parentElement;
      }
      return null;
    },
  };
  for (const child of children) child.parentElement = node;
  return node;
}

function installDom(env, { outlet, nav }) {
  const requested = [];
  env.document.querySelector = (selector) => {
    requested.push(selector);
    if (selector === UNION) return outlet;
    if (selector === 'nav[class*="panelList"], [class*="panelList"]') return nav;
    return null;
  };
  return requested;
}

function collect(env) {
  const json = vm.runInContext(
    `JSON.stringify((() => {
      const found = collectSidebar(null);
      if (!found) return null;
      return {
        container: found.container && found.container.id,
        via: found.via,
        rows: found.rows.map((row) => ({
          unit: row.unit && row.unit.id,
          target: row.target && row.target.id,
          label: row.label,
        })),
        more: found.more && found.more.id,
        moreTarget: found.moreTarget && found.moreTarget.id,
      };
    })())`,
    env.context
  );
  return JSON.parse(json);
}

test("O-11: rc.2 panelList finds the nav above div.panelEntry wrappers", () => {
  const rowA = element("button", { id: "row-a", "aria-label": "插件" });
  const unpinA = element("button", { id: "unpin-a", "aria-label": "取消固定" });
  const entryA = element("div", { id: "entry-a", class: "panelEntry" }, [rowA, unpinA]);
  const rowB = element("button", { id: "row-b", "aria-label": "计划" });
  const entryB = element("div", { id: "entry-b", class: "panelEntry" }, [rowB]);
  const moreButton = element("button", {
    id: "more-button",
    "aria-label": "更多",
    "aria-haspopup": "menu",
  });
  const more = element("span", { id: "more", class: "moreAnchor" }, [moreButton]);
  const nav = element("nav", { id: "nav", class: "_panelList_abc" }, [entryA, entryB, more]);
  const outlet = element("span", { id: "outlet", "data-slot": "sidebar.panel.icon" });
  rowA.children.push(outlet);
  outlet.parentElement = rowA;

  const env = createClientEnv({ modules: ["constants.js", "scopes.js"] });
  const requested = installDom(env, { outlet, nav });
  const found = collect(env);

  assert.equal(requested[0], UNION, "the outlet selector must cover both rc.1 and rc.2 slot names");
  assert.equal(found.via, "slot-nav");
  assert.equal(found.container, "nav");
  assert.deepEqual(found.rows, [
    { unit: "entry-a", target: "row-a", label: "插件" },
    { unit: "entry-b", target: "row-b", label: "计划" },
  ]);
  // The unpin button is a second button in the entry and must not become a row.
  assert.equal(found.rows.some((row) => row.target === "unpin-a"), false);
  // rc.2 renders the More menu as a span inside nav; the span is the flex item.
  assert.equal(found.more, "more");
  assert.equal(found.moreTarget, "more-button");
});

test("O-11: rc.1 rows stay direct nav buttons after the nav-first change", () => {
  const rowA = element("button", { id: "row-a", "aria-label": "插件" });
  const rowB = element("button", { id: "row-b", "aria-label": "计划" });
  const moreButton = element("button", {
    id: "more-button",
    "aria-label": "更多",
    "aria-haspopup": "menu",
  });
  const nav = element("nav", { id: "nav" }, [rowA, rowB, moreButton]);
  const outlet = element("span", { id: "outlet", "data-slot": "sidebar.panellist" });
  rowA.children.push(outlet);
  outlet.parentElement = rowA;

  const env = createClientEnv({ modules: ["constants.js", "scopes.js"] });
  installDom(env, { outlet, nav });
  const found = collect(env);

  assert.equal(found.via, "slot-nav");
  assert.equal(found.container, "nav");
  assert.deepEqual(found.rows, [
    { unit: "row-a", target: "row-a", label: "插件" },
    { unit: "row-b", target: "row-b", label: "计划" },
  ]);
  assert.equal(found.more, "more-button");
  assert.equal(found.moreTarget, "more-button");
});

test("O-11: the panelList class fallback still finds the sidebar nav", () => {
  const rowA = element("button", { id: "row-a", "aria-label": "插件" });
  const entryA = element("div", { id: "entry-a", class: "panelEntry" }, [rowA]);
  const rowB = element("button", { id: "row-b", "aria-label": "计划" });
  const entryB = element("div", { id: "entry-b", class: "panelEntry" }, [rowB]);
  const moreButton = element("button", {
    id: "more-button",
    "aria-label": "更多",
    "aria-haspopup": "menu",
  });
  const more = element("span", { id: "more", class: "moreAnchor" }, [moreButton]);
  const nav = element("nav", { id: "nav", class: "_panelList_abc" }, [entryA, entryB, more]);

  const env = createClientEnv({ modules: ["constants.js", "scopes.js"] });
  installDom(env, { outlet: null, nav });
  const found = collect(env);

  assert.equal(found.via, "panellist-class");
  assert.equal(found.container, "nav");
  assert.deepEqual(found.rows, [
    { unit: "entry-a", target: "row-a", label: "插件" },
    { unit: "entry-b", target: "row-b", label: "计划" },
  ]);
  assert.equal(found.more, "more");
  assert.equal(found.moreTarget, "more-button");
});
