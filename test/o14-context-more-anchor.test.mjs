import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { createClientEnv } from "./helpers/client-env.mjs";

// The drag-only More anchor of a right-click menu is laid out OUTSIDE the menu
// box: as a real row it grew the surface, and the host re-placed the whole menu
// mid-gesture (measured ~300px up, away from the pointer). Both decisions that
// keep it out of the way are pure and pinned here, because getting them wrong
// is invisible until a menu near the viewport edge jumps under the pointer.
async function geometryEnv() {
  return createClientEnv({ modules: ["context-geometry.js"] });
}

function floats(env, tucked) {
  env.sandbox.__tucked = tucked;
  return vm.runInContext("contextMoreAnchorFloats(__tucked)", env.context);
}

function side(env, options) {
  env.sandbox.__menu = options;
  return vm.runInContext("contextMoreAnchorSide(__menu)", env.context);
}

test("O-14: the anchor floats only until the menu has tucked its first row", async () => {
  const env = await geometryEnv();
  assert.equal(floats(env, 0), true, "nothing tucked yet: the anchor must not grow the menu");
  assert.equal(floats(env, "0"), true, "a string count from a DOM read still means zero");
  assert.equal(floats(env, 1), false, "one tucked row: the anchor is a real row inside the frame again");
  assert.equal(floats(env, 3), false);
  assert.equal(floats(env, undefined), true, "an unmeasured count falls back to the drag-only anchor");
});

test("O-14: the anchor sits below the menu while a full row plus its gap fits", async () => {
  const env = await geometryEnv();
  assert.equal(side(env, { menuTop: 564, menuBottom: 700, viewportHeight: 802 }), "below");
  // 34px anchor + 8px gap = 42px: exactly that much room still counts as room.
  assert.equal(side(env, { menuTop: 564, menuBottom: 760, viewportHeight: 802 }), "below");
});

test("O-14: a menu near the bottom edge moves the anchor above itself", async () => {
  const env = await geometryEnv();
  const options = { menuTop: 564, menuBottom: 761, viewportHeight: 802 };
  assert.equal(side(env, options), "above");
  // The measured case from the desktop app: the menu ended 19px above the edge.
  assert.equal(side(env, { menuTop: 564, menuBottom: 783, viewportHeight: 802 }), "above");
});

test("O-14: no room above either keeps the anchor below instead of clipping it", async () => {
  const env = await geometryEnv();
  assert.equal(side(env, { menuTop: 40, menuBottom: 761, viewportHeight: 802 }), "below");
  assert.equal(side(env, { menuTop: 42, menuBottom: 761, viewportHeight: 802 }), "below", "the space above must fit the row, not just touch it");
});

test("O-14: the row height and gap drive the decision, and junk measurements keep the default", async () => {
  const env = await geometryEnv();
  assert.equal(side(env, { menuTop: 300, menuBottom: 740, viewportHeight: 802, height: 50, margin: 8 }), "below");
  assert.equal(side(env, { menuTop: 300, menuBottom: 745, viewportHeight: 802, height: 50, margin: 8 }), "above");
  assert.equal(side(env, { menuTop: 300, menuBottom: 745, viewportHeight: 802, height: -4, margin: -1 }), "below", "junk sizes fall back to 34/8");
  assert.equal(side(env, { menuBottom: 745, viewportHeight: 802 }), "below", "a missing top measurement is not guessed");
  assert.equal(side(env, null), "below");
  assert.equal(side(env, undefined), "below");
});
