import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { createClientEnv } from "./helpers/client-env.mjs";

const ENTRY = "[data-sidebar-right-guide-entry]";

function classListOf(attrs) {
  const names = String(attrs.class || "").split(/\s+/).filter(Boolean);
  return {
    contains(name) {
      return names.includes(name);
    },
  };
}

function matchOne(node, selector) {
  const sel = selector.trim();
  if (!sel) return false;
  if (sel.startsWith(".")) return node.classList.contains(sel.slice(1));
  if (sel.startsWith("[")) {
    const match = sel.match(/^\[([^\]=*^$]+)(?:([*^$]?=)"?([^"\]]*)"?)?\]$/);
    if (!match) return false;
    const value = node.getAttribute(match[1]);
    if (value === null || value === undefined) return false;
    if (!match[2]) return true;
    const want = match[3] || "";
    if (match[2] === "=") return String(value) === want;
    if (match[2] === "*=") return String(value).includes(want);
    return false;
  }
  const roleMatch = sel.match(/^([a-z]+)?\[role="([^"]+)"\]$/);
  if (roleMatch) {
    if (roleMatch[1] && node.tagName !== roleMatch[1].toUpperCase()) return false;
    return node.getAttribute("role") === roleMatch[2];
  }
  return node.tagName === sel.toUpperCase();
}

function matches(node, selector) {
  return String(selector)
    .split(",")
    .some((part) => matchOne(node, part));
}

function element(tag, attrs = {}, children = []) {
  const node = {
    nodeType: 1,
    tagName: tag.toUpperCase(),
    id: attrs.id || "",
    children,
    parentElement: null,
    classList: classListOf(attrs),
    textContent: attrs.text || "",
    getAttribute(name) {
      return Object.prototype.hasOwnProperty.call(attrs, name) ? attrs[name] : null;
    },
    matches(selector) {
      return matches(node, selector);
    },
    querySelector(selector) {
      for (const child of node.children) {
        if (child.nodeType !== 1) continue;
        if (child.matches(selector)) return child;
        const nested = child.querySelector(selector);
        if (nested) return nested;
      }
      return null;
    },
    querySelectorAll(selector) {
      const found = [];
      for (const child of node.children) {
        if (child.nodeType !== 1) continue;
        if (child.matches(selector)) found.push(child);
        found.push(...child.querySelectorAll(selector));
      }
      return found;
    },
    closest(selector) {
      let current = node;
      while (current) {
        if (current.matches(selector)) return current;
        current = current.parentElement;
      }
      return null;
    },
    contains(other) {
      let current = other;
      while (current) {
        if (current === node) return true;
        current = current.parentElement;
      }
      return false;
    },
  };
  for (const child of children) child.parentElement = node;
  return node;
}

function card(kind, id, label, title) {
  const children = title ? [element("span", { id: id + "-title", class: "cardTitle", text: title })] : [];
  const main = element("button", { id: id + "-main", "aria-label": label || kind }, children);
  return element("div", { id, class: "card", "data-sidebar-right-guide-entry": kind }, [main]);
}

function moreSlot() {
  const button = element("button", {
    id: "guide-more",
    "data-guide-more": "true",
    "aria-label": "更多",
    "aria-haspopup": "menu",
  });
  return element("div", { id: "moreSlot", class: "moreSlot" }, [button]);
}

function collect(env) {
  const json = vm.runInContext(
    `JSON.stringify((() => {
      const found = collectRight();
      if (!found) return null;
      return {
        container: found.container && found.container.id,
        via: found.via,
        grid: found.grid,
        columns: found.columns,
        rows: found.rows.map((row) => ({
          unit: row.unit && row.unit.id,
          target: row.target && row.target.id,
          mark: row.mark && row.mark.id,
          label: row.label,
          id: row.id,
        })),
        tails: found.tails.map((node) => node.id),
        more: found.more && found.more.id,
        moreTarget: found.moreTarget && found.moreTarget.id,
      };
    })())`,
    env.context
  );
  return JSON.parse(json);
}

function installRoot(env, root) {
  env.document.querySelector = (selector) => (selector === "[data-sidebar-right-guide]" ? root : null);
}

test("O-18: a two-column guide exposes the cards as rows, not the .guide wrapper", () => {
  const files = card("files", "card-files", "文件 浏览工作区文件树，点开即预览或编辑", "文件");
  const terminal = card("terminal", "card-terminal", "新建终端");
  const browser = card("browser", "card-browser", "浏览器");
  const sidechat = card("sidechat", "card-sidechat", "侧边对话");
  const more = moreSlot();
  const grid = element("div", { id: "grid", class: "grid gridTwo" }, [files, more, terminal, browser, sidechat]);
  const guide = element("div", { id: "guide", class: "guide" }, [grid]);
  const root = element("div", { id: "root", "data-sidebar-right-guide": "" }, [guide]);

  const env = createClientEnv({
    modules: ["constants.js", "scopes.js"],
    globals: {
      getComputedStyle: (node) => ({
        gridTemplateColumns: node.id === "grid" ? "252px 252px" : "none",
        columnGap: "12px",
        rowGap: "12px",
      }),
    },
  });
  installRoot(env, root);
  const found = collect(env);

  assert.equal(found.grid, true);
  assert.equal(found.via, "right-guide-grid");
  assert.equal(found.container, "grid");
  assert.equal(found.columns, 2, "the computed tracks decide the grid's column count");
  assert.deepEqual(
    found.rows.map((row) => [row.unit, row.target, row.mark, row.id]),
    [
      ["card-files", "card-files-main", "card-files", "files"],
      ["card-terminal", "card-terminal-main", "card-terminal", "terminal"],
      ["card-browser", "card-browser-main", "card-browser", "browser"],
      ["card-sidechat", "card-sidechat-main", "card-sidechat", "sidechat"],
    ]
  );
  assert.equal(found.rows[0].label, "文件", "the short card title labels the More-menu row, not the full aria-label");
  assert.equal(found.more, "moreSlot", "the More wrapper is the grid item, not the button");
  assert.equal(found.moreTarget, "guide-more");
});

test("O-18: a ghost card left over from a drag is not discovered again", () => {
  const files = card("files", "card-files", "文件");
  const ghost = card("terminal", "ghost-card", "新建终端");
  ghost.classList = classListOf({ class: "card dso-ghost" });
  const grid = element("div", { id: "grid", class: "grid" }, [files, ghost]);
  const root = element("div", { id: "root", "data-sidebar-right-guide": "" }, [grid]);

  const env = createClientEnv({ modules: ["constants.js", "scopes.js"] });
  installRoot(env, root);
  const found = collect(env);

  assert.deepEqual(found.rows.map((row) => row.id), ["files"]);
});

test("O-18: the shipped flat guide keeps the old cell geometry", () => {
  const filesButton = element("button", { id: "files-button", "data-sidebar-right-guide-entry": "files" });
  const filesCell = element("div", { id: "files-cell", class: "entryCell" }, [filesButton]);
  const terminalButton = element("button", {
    id: "terminal-button",
    "data-sidebar-right-guide-entry": "terminal",
  });
  const terminalCell = element("div", { id: "terminal-cell", class: "entryCell" }, [terminalButton]);
  const moreButton = element("button", { id: "more-button", "aria-label": "更多工具", "aria-haspopup": "menu" });
  const moreCell = element("div", { id: "more-cell", class: "entryCell" }, [moreButton]);
  const root = element("div", { id: "root", "data-sidebar-right-guide": "" }, [filesCell, terminalCell, moreCell]);

  const env = createClientEnv({ modules: ["constants.js", "scopes.js"] });
  installRoot(env, root);
  const found = collect(env);

  assert.equal(found.grid, false);
  assert.equal(found.via, "right-guide");
  assert.equal(found.container, "root");
  assert.equal(found.columns, 1, "a flat guide has one column");
  assert.deepEqual(
    found.rows.map((row) => [row.unit, row.target, row.mark]),
    [
      ["files-cell", "files-button", null],
      ["terminal-cell", "terminal-button", null],
    ]
  );
  // The flat guide keeps its own More cell (the host renders our tucked items
  // there); it is not a grid tail.
  assert.equal(found.more, "more-cell");
  assert.deepEqual(found.tails, []);
});

function rect(top, left, width = 100, height = 56) {
  return { top, left, width, height, bottom: top + height, right: left + width };
}

function geometryEnv() {
  return createClientEnv({ modules: ["right-grid.js"] });
}

function dropIndex(env, items, x, y, allItems, columns) {
  env.sandbox.__items = items;
  env.sandbox.__x = x;
  env.sandbox.__y = y;
  env.sandbox.__all = allItems;
  env.sandbox.__columns = columns;
  return JSON.parse(
    vm.runInContext("JSON.stringify(gridIndexAt(__items, __x, __y, __all, __columns))", env.context)
  );
}

test("O-18: gridOrder reads the grid row by row", () => {
  const env = geometryEnv();
  const items = [
    { id: "c", rect: rect(72, 0) },
    { id: "a", rect: rect(0, 0) },
    { id: "d", rect: rect(72, 120) },
    { id: "b", rect: rect(0, 120) },
  ];
  env.sandbox.__items = items;
  const order = vm.runInContext("JSON.stringify(__items.slice().sort(gridOrder).map((item) => item.id))", env.context);
  assert.deepEqual(JSON.parse(order), ["a", "b", "c", "d"]);
});

test("O-18: the drop index follows the pointer's row and column", () => {
  const env = geometryEnv();
  const a = { id: "a", rect: rect(0, 0) };
  const b = { id: "b", rect: rect(0, 120) };
  const c = { id: "c", rect: rect(72, 0) };
  const d = { id: "d", rect: rect(72, 120) };
  const items = [a, b, c, d];

  assert.deepEqual(dropIndex(env, items, 10, 20), {
    index: 0,
    slot: { row: { top: 0, bottom: 56, items: [a, b] }, before: a, horizontal: true },
  });
  const second = dropIndex(env, items, 130, 20);
  assert.equal(second.index, 1);
  assert.equal(second.slot.before.id, "b");
  assert.equal(second.slot.horizontal, false);
  // Past the last card of row 0: the insertion point is the start of row 1.
  assert.equal(dropIndex(env, items, 400, 20, items, 2).index, 2);
  assert.equal(dropIndex(env, items, 400, 20, items, 2).slot.horizontal, true, "a full row wraps");
  // Gutter between rows: the nearer row owns the line.
  assert.equal(dropIndex(env, items, 10, 68).index, 2);
  assert.equal(dropIndex(env, items, 130, 68).index, 3);
  assert.equal(dropIndex(env, items, 10, -10).index, 0);
  assert.equal(dropIndex(env, items, 10, 400).index, 4);
});

test("O-18: a partial last row keeps the line inside the row", () => {
  const env = geometryEnv();
  const a = { id: "a", rect: rect(0, 0) };
  const b = { id: "b", rect: rect(0, 120) };
  const c = { id: "c", rect: rect(72, 0) };
  const items = [a, b, c];

  // Past the only card in row 1: the insertion point is after it, but the
  // second track is still empty, so the card lands beside it, not below it.
  const beside = dropIndex(env, items, 400, 80, items, 2);
  assert.equal(beside.index, 3);
  assert.equal(beside.slot.horizontal, false);
  // Below the whole grid: same partial row, same in-row insertion.
  const below = dropIndex(env, items, 10, 400, items, 2);
  assert.equal(below.index, 3);
  assert.equal(below.slot.horizontal, false);
});

test("O-18: an empty grid anchors the line on the first measured card", () => {
  const env = geometryEnv();
  const first = { id: "a", rect: rect(0, 0) };
  const hit = dropIndex(env, [], 42, 42, [first]);
  assert.equal(hit.index, 0);
  assert.deepEqual(hit.slot, { row: { top: 0, bottom: 56, items: [] }, before: null, horizontal: true });
});

test("O-18: the measured slot maps to the same cell in the full order", () => {
  const env = geometryEnv();
  const files = { id: "files", rect: rect(0, 0) };
  const forge = { id: "forge", rect: rect(0, 120) };
  const terminal = { id: "terminal", rect: rect(72, 0) };
  const context = { id: "context", rect: rect(72, 120) };
  const items = [files, forge, terminal, context];
  const others = [forge, terminal, context];

  // Dropping on terminal while dragging files: gridIndexAt(others) names the
  // gap before terminal at index 1, but files must finish at terminal's slot 2.
  const hit = dropIndex(env, others, 10, 80, items, 2);
  assert.equal(hit.index, 1);
  assert.equal(hit.slot.before.id, "terminal");
  env.sandbox.__items = items;
  env.sandbox.__slot = hit.slot;
  const slotIndex = vm.runInContext("JSON.stringify(gridSlotIndex(__items, __slot))", env.context);
  assert.equal(JSON.parse(slotIndex), 2);

  // Dragging the other direction maps straight back to the target's slot.
  const back = dropIndex(env, [files, forge, context], 10, 20, items, 2);
  env.sandbox.__slot = back.slot;
  assert.equal(JSON.parse(vm.runInContext("JSON.stringify(gridSlotIndex(__items, __slot))", env.context)), 0);

  // Past the end of a full row: one slot after its tail.
  env.sandbox.__slot = { row: { top: 0, bottom: 56, items: [files, forge] }, before: null, horizontal: true };
  assert.equal(JSON.parse(vm.runInContext("JSON.stringify(gridSlotIndex(__items, __slot))", env.context)), 2);

  // Empty order has nowhere to go but the first slot.
  env.sandbox.__items = [];
  env.sandbox.__slot = null;
  assert.equal(JSON.parse(vm.runInContext("JSON.stringify(gridSlotIndex(__items, __slot))", env.context)), 0);
});
