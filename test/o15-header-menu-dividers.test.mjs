import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { createClientEnv } from "./helpers/client-env.mjs";

// The shipped "more actions" popup hardcodes its separators in DOM order, so a
// reordered popup used to leave both lines jammed under the first row (the
// reported 多个分割线重叠). Its seams are now positional, exactly like the
// right-click menus: gap N is the seam under the Nth visible row. The rules that
// map the host's own separators onto those seams are pure and pinned here,
// because getting them wrong is invisible until the popup is reopened.
async function geometryEnv() {
  return createClientEnv({ modules: ["context-geometry.js"] });
}

function nativeGaps(env, kinds) {
  env.sandbox.__kinds = kinds;
  return Array.from(vm.runInContext("headerMenuGapsFromKinds(__kinds)", env.context));
}

function normalize(env, gaps, rows) {
  env.sandbox.__gaps = gaps;
  env.sandbox.__rows = rows;
  return Array.from(vm.runInContext("normalizeHeaderMenuGaps(__gaps, __rows)", env.context));
}

function toggle(env, gaps, gap, rows) {
  env.sandbox.__gaps = gaps;
  env.sandbox.__gap = gap;
  env.sandbox.__rows = rows;
  return Array.from(vm.runInContext("toggleHeaderMenuGap(__gaps, __gap, __rows)", env.context));
}

test("O-15: the host's separators become the seams under the rows it painted above them", async () => {
  const env = await geometryEnv();
  // The live popup: tucked shelf, copy, download, separator, open-in-app,
  // separator, feedback.
  assert.deepEqual(nativeGaps(env, ["row", "row", "row", "separator", "row", "separator", "row"]), [3, 4]);
  assert.deepEqual(nativeGaps(env, ["row", "separator", "row"]), [1]);
  assert.deepEqual(nativeGaps(env, ["row", "row"]), []);
});

test("O-15: a separator above every row has no seam and is dropped", async () => {
  const env = await geometryEnv();
  assert.deepEqual(nativeGaps(env, ["separator", "row", "row"]), []);
  assert.deepEqual(nativeGaps(env, ["separator", "separator", "row", "separator", "row"]), [1]);
  // Nothing to measure: an empty or malformed sequence must not invent a seam.
  assert.deepEqual(nativeGaps(env, []), []);
  assert.deepEqual(nativeGaps(env, null), []);
});

test("O-15: seams only exist between two rows", async () => {
  const env = await geometryEnv();
  assert.deepEqual(normalize(env, [2, 1], 3), [1, 2], "sorted, both interior seams kept");
  assert.deepEqual(normalize(env, [0, 3], 3), [], "above the first row and below the last row are not seams");
  assert.deepEqual(normalize(env, [2, 2, 1], 3), [1, 2], "duplicates collapse");
  assert.deepEqual(normalize(env, [1.9, "2", NaN, Infinity], 3), [1], "non-integers and junk are ignored");
  assert.deepEqual(normalize(env, [2], Infinity), [2], "an unknown row count keeps what it was given");
});

test("O-15: right-clicking a row toggles the seam below it", async () => {
  const env = await geometryEnv();
  assert.deepEqual(toggle(env, [], 2, 4), [2], "a first right-click adds the seam under row 2");
  assert.deepEqual(toggle(env, [2], 2, 4), [], "the same seam toggles back off");
  assert.deepEqual(toggle(env, [1, 3], 2, 4), [1, 2, 3], "a new seam is kept in row order");
  // The last row has nothing below it, so that click is a no-op rather than a
  // request to hide every line.
  assert.deepEqual(toggle(env, [2], 4, 4), [2]);
  assert.deepEqual(toggle(env, [], 4, 4), []);
});
