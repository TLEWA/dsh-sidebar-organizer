import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { createClientEnv } from "./helpers/client-env.mjs";

// A drag only writes a flex order; the viewport children stay where they were.
// Reading the row list in DOM order therefore names the wrong seam, and the
// reported popup lost its dividers entirely when the row that had been dragged to
// the top was right-clicked. The paint order is pinned here with plain entries:
// rows carry the order the plugin assigned, and an unstyled row (order 0 in CSS)
// sorts above them instead of last.
async function geometryEnv() {
  return createClientEnv({ modules: ["context-geometry.js"] });
}

function sorted(env, entries) {
  env.sandbox.__entries = entries;
  return Array.from(vm.runInContext("sortHeaderMenuRowIndexes(__entries)", env.context));
}

test("O-17: rows are read back in their flex order, not their child order", async () => {
  const env = await geometryEnv();
  // "feedback" was dragged to the top: it is child 3 but paints first.
  const entries = [
    { index: 0, order: 2 },
    { index: 1, order: 4 },
    { index: 2, order: 6 },
    { index: 3, order: 0 },
  ];
  assert.deepEqual(sorted(env, entries), [3, 0, 1, 2]);
});

test("O-17: an unstyled row sorts first, matching the CSS default of order 0", async () => {
  const env = await geometryEnv();
  const entries = [
    { index: 0, order: 2 },
    { index: 1, order: null },
    { index: 2, order: 4 },
  ];
  assert.deepEqual(sorted(env, entries), [1, 0, 2]);
});

test("O-17: nothing ordered yet keeps the plain child order", async () => {
  const env = await geometryEnv();
  const entries = [
    { index: 0, order: null },
    { index: 1, order: null },
  ];
  assert.deepEqual(sorted(env, entries), [0, 1]);
});

test("O-17: equal orders fall back to child order and junk input answers empty", async () => {
  const env = await geometryEnv();
  assert.deepEqual(
    sorted(env, [
      { index: 2, order: 4 },
      { index: 0, order: 4 },
      { index: 1, order: 4 },
    ]),
    [0, 1, 2]
  );
  assert.deepEqual(sorted(env, null), []);
  assert.deepEqual(sorted(env, [null, {}]), []);
});
