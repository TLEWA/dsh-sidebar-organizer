import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { createClientEnv } from "./helpers/client-env.mjs";

const HEADER_SLOT = '[data-slot="conversation.session.header.utilities"]';
const CLICKABLE = 'button, a, [role="tab"], [role="menuitem"]';

function descendants(node) {
  return node.children.flatMap((child) => [child, ...descendants(child)]);
}

function element(tag, attrs = {}, children = []) {
  const classes = String(attrs.class || "").split(/\s+/).filter(Boolean);
  const node = {
    nodeType: 1,
    tagName: tag.toUpperCase(),
    id: attrs.id || "",
    children,
    parentElement: null,
    classList: { contains: (name) => classes.includes(name) },
    textContent: attrs.text || "",
    getAttribute(name) {
      return Object.prototype.hasOwnProperty.call(attrs, name) ? attrs[name] : null;
    },
    matches(selector) {
      if (selector === '[aria-haspopup="menu"]') return attrs["aria-haspopup"] === "menu";
      if (selector === CLICKABLE) {
        return (
          tag.toLowerCase() === "button" ||
          tag.toLowerCase() === "a" ||
          attrs.role === "tab" ||
          attrs.role === "menuitem"
        );
      }
      if (selector === '[role="tab"]') return attrs.role === "tab";
      if (selector === '[role="menuitem"]') return attrs.role === "menuitem";
      if (selector[0] === ".") return classes.includes(selector.slice(1));
      return false;
    },
    closest(selector) {
      let current = this;
      while (current) {
        if (selector === "nav" && current.tagName === "NAV") return current;
        if (selector === "button" && current.tagName === "BUTTON") return current;
        if (selector === ".dso-config" && current.classList.contains("dso-config")) return current;
        current = current.parentElement;
      }
      return null;
    },
    querySelector(selector) {
      if (selector === '[class*="entryTitle"]') return null;
      const found = descendants(node).find((child) => child.matches(selector));
      return found || null;
    },
    querySelectorAll(selector) {
      return descendants(node).filter((child) => child.matches(selector));
    },
  };
  for (const child of children) child.parentElement = node;
  return node;
}

function installHeader(env, { outlet, container }) {
  env.document.querySelector = (selector) => (selector === HEADER_SLOT ? outlet : null);
  env.sandbox.getComputedStyle = (target) => ({
    display: target === outlet && container ? "contents" : "inline-flex",
  });
}

function collectHeader(env) {
  const json = vm.runInContext(
    `JSON.stringify((() => {
      const found = discoverScope(null, "header");
      if (!found) return null;
      return {
        via: found.via,
        rows: found.rows.map((row) => ({
          unit: row.unit && (row.unit.id || row.unit.tagName),
          target: row.target && (row.target.id || row.target.tagName),
          label: row.label,
        })),
        tails: (found.tails || []).map((tail) => tail.id || tail.tagName),
        more: found.more && (found.more.id || found.more.tagName),
        moreIsRow: !!found.moreIsRow,
        hasChromeFlag: Object.prototype.hasOwnProperty.call(found, "moreIsChrome"),
        moreTarget: found.moreTarget && found.moreTarget.id,
      };
    })())`,
    env.context
  );
  return JSON.parse(json);
}

function headerEnv() {
  return createClientEnv({ modules: ["constants.js", "storage.js", "scopes.js"] });
}

test("O-12: the header's More trigger is a row again, not pinned host chrome", () => {
  const panelRow = element("button", { id: "row-panel", "aria-label": "展开底部面板" });
  const findRow = element("button", { id: "row-find", "aria-label": "查找" });
  const more = element("button", {
    id: "row-more",
    "aria-label": "更多操作",
    "aria-haspopup": "menu",
    "aria-expanded": "false",
  });
  const outlet = element("div", { id: "outlet", "data-slot": "conversation.session.header.utilities" }, [
    panelRow,
    findRow,
  ]);
  const container = element("div", { id: "utilities", class: "headerUtilities" }, [outlet, more]);

  const env = headerEnv();
  installHeader(env, { outlet, container });
  const found = collectHeader(env);

  assert.equal(found.via, "outlet-parent");
  assert.deepEqual(found.rows, [
    { unit: "row-panel", target: "row-panel", label: "展开底部面板" },
    { unit: "row-find", target: "row-find", label: "查找" },
    { unit: "row-more", target: "row-more", label: "更多操作" },
  ]);
  assert.equal(found.more, "row-more");
  assert.equal(found.moreIsRow, true);
  assert.equal(found.hasChromeFlag, false, "the pinned-chrome flag is gone; More sorts like any row");
  assert.equal(found.moreTarget, "row-more", "the trigger still anchors the tuck menu");
  assert.deepEqual(found.tails, [], "the trigger is no longer re-ordered as a tail");
});

test("O-12: a More control wrapped in a span keeps the wrapper as its row unit", () => {
  const panelRow = element("button", { id: "row-panel", "aria-label": "展开底部面板" });
  const outlet = element("div", { id: "outlet", "data-slot": "conversation.session.header.utilities" }, [panelRow]);
  const trigger = element("button", { id: "more-trigger", "aria-label": "更多", "aria-haspopup": "menu" });
  const more = element("span", { id: "more-anchor", class: "moreAnchor" }, [trigger]);
  const container = element("div", { id: "utilities" }, [outlet, more]);

  const env = headerEnv();
  installHeader(env, { outlet, container });
  const found = collectHeader(env);

  assert.deepEqual(found.rows[found.rows.length - 1], {
    unit: "more-anchor",
    target: "more-trigger",
    label: "更多",
  });
  assert.equal(found.moreIsRow, true);
  assert.equal(found.moreTarget, "more-trigger");
});

test("O-12: a More trigger rendered inside the slot is a row as well", () => {
  const panelRow = element("button", { id: "row-panel", "aria-label": "展开底部面板" });
  const more = element("button", { id: "row-more", "aria-label": "更多", "aria-haspopup": "menu" });
  const outlet = element("div", { id: "outlet", "data-slot": "conversation.session.header.utilities" }, [
    panelRow,
    more,
  ]);

  const env = headerEnv();
  installHeader(env, { outlet, container: null });
  const found = collectHeader(env);

  assert.deepEqual(found.rows, [
    { unit: "row-panel", target: "row-panel", label: "展开底部面板" },
    { unit: "row-more", target: "row-more", label: "更多" },
  ]);
  assert.equal(found.moreIsRow, true);
  assert.equal(found.moreTarget, "row-more");
});

test("O-12: outlets without fixedMore keep their More control out of the rows", () => {
  const action = element("button", { id: "action", "aria-label": "设置" });
  const more = element("button", { id: "footer-more", "aria-label": "更多", "aria-haspopup": "menu" });
  const outlet = element("div", { id: "outlet", "data-slot": "sidebar.footer.action" }, [action]);

  const env = headerEnv();
  env.document.querySelector = (selector) => (selector === '[data-slot="sidebar.footer.action"]' ? outlet : null);
  env.sandbox.getComputedStyle = () => ({ display: "contents" });

  const json = vm.runInContext(
    `JSON.stringify((() => {
      const found = collectOutlet("footer", '[data-slot="sidebar.footer.action"]', { axis: "x" });
      return {
        rows: found.rows.map((row) => row.target.id),
        more: found.more && found.more.id,
        moreIsRow: !!found.moreIsRow,
      };
    })())`,
    env.context
  );
  const found = JSON.parse(json);
  // collectOutlet reaches the More control through isMoreTrigger on a sibling;
  // the footer has no sibling here, so this test pins the "no fixedMore, no
  // promotion" contract on the rows and flags only.
  assert.deepEqual(found.rows, ["action"]);
  assert.equal(found.moreIsRow, false);
});
