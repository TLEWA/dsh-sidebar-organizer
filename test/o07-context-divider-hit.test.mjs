import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { createClientEnv } from "./helpers/client-env.mjs";

// The real session menu stacks eight 34px rows; these are that geometry.
const ROW_TOPS = [468, 502, 536, 570, 604, 638, 672, 706];
const rects = () => ROW_TOPS.map((top) => ({ top, height: 34, width: 180, left: 0, right: 180 }));

function separator(options) {
  const opts = options || {};
  const attributes = new Set();
  const dataset = {};
  if (typeof opts.gap === "number") {
    attributes.add("data-dso-ctx-divider");
    dataset.dsoCtxGap = String(opts.gap);
  }
  const height = opts.height === undefined ? 1 : opts.height;
  return {
    nodeType: 1,
    isConnected: true,
    dataset,
    __display: opts.display || "block",
    matches: (selector) => selector === '[role="separator"]',
    querySelector: (selector) => (opts.wrapsRow && selector === '[role="menuitem"]' ? { nodeType: 1 } : null),
    hasAttribute: (name) => attributes.has(name),
    getBoundingClientRect: () => ({ top: opts.mid - height / 2, height, width: 180, left: 0, right: 180 }),
  };
}

function menu(nodes) {
  return { isConnected: true, querySelectorAll: () => nodes };
}

async function geometryEnv() {
  return createClientEnv({
    modules: ["context-geometry.js"],
    globals: {
      getComputedStyle: (node) => ({ display: node.__display || "block" }),
    },
  });
}

async function lineGap(env, nodes, y, tolerance) {
  env.sandbox.__menu = menu(nodes);
  env.sandbox.__rects = rects();
  env.sandbox.__y = y;
  env.sandbox.__tolerance = tolerance;
  return vm.runInContext("contextDividerLineGap(__menu, __rects, __y, __tolerance)", env.context);
}

test("O-07: a line's gap counts the rows above it, not the row under the pointer", async () => {
  const env = await geometryEnv();
  const gapOf = (middle) => {
    env.sandbox.__rects = rects();
    env.sandbox.__middle = middle;
    return vm.runInContext("dividerGapOfMiddle(__rects, __middle)", env.context);
  };
  assert.equal(gapOf(573), 3);
  assert.equal(gapOf(648), 5);
  assert.equal(gapOf(722), 7);
  assert.equal(gapOf(Number.NaN), 0);
});

// The reported bug: right-clicking the line under "在文件夹显示" painted a NEW
// line under "用 Visual Studio Code 打开" and left the clicked one alone, because
// the host nests that separator inside the following row's wrapper, so a row
// hit-test resolved gap 6 and the toggle appended it.
test("O-07: clicking a line resolves that line's own gap, never the next seam", async () => {
  const env = await geometryEnv();
  assert.equal(await lineGap(env, [separator({ mid: 648, gap: 5 })], 648, 4), 5);
  // Wrapped in the following row: the pointer is still ON the line.
  assert.equal(await lineGap(env, [separator({ mid: 648, gap: 5 })], 651, Infinity), 5);
});

test("O-07: a host separator keeps the gap the rows give it", async () => {
  const env = await geometryEnv();
  assert.equal(await lineGap(env, [separator({ mid: 648 })], 648, 4), 5);
});

test("O-07: only a line under the pointer is hit, and the nearest one wins", async () => {
  const env = await geometryEnv();
  const line = separator({ mid: 648 });
  assert.equal(await lineGap(env, [line], 651, 4), 5, "3px away still counts as the line");
  assert.equal(await lineGap(env, [line], 660, 4), 0, "12px away is empty space");
  const near = separator({ mid: 660 });
  const farther = separator({ mid: 700 });
  assert.equal(await lineGap(env, [farther, near], 655, 50), 6, "nearest line wins");
});

test("O-07: hidden separators and row wrappers are not divider targets", async () => {
  const env = await geometryEnv();
  assert.equal(await lineGap(env, [separator({ mid: 648, display: "none" })], 648, 4), 0);
  assert.equal(await lineGap(env, [separator({ mid: 648, wrapsRow: true })], 648, 4), 0);
});

test("O-07: a line past the last row is not a divider", async () => {
  const env = await geometryEnv();
  assert.equal(await lineGap(env, [separator({ mid: 900, height: 1 })], 900, 4), 0);
});
