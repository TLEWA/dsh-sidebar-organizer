import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { createClientEnv } from "./helpers/client-env.mjs";

// The drag-only More anchor of a right-click menu must never grow the surface:
// as an extra real row it made the host re-place the whole menu mid-gesture
// (measured ~300px up, away from the pointer). The three decisions that keep it
// from doing that are pure and pinned here, because getting them wrong is
// invisible until a menu near the viewport edge jumps under the pointer. The
// fourth keeps the host's own separators where they were while the drag hides
// the row that is about to be tucked.
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

function pinned(env, options) {
  env.sandbox.__pin = options;
  return vm.runInContext("contextMoreAnchorPinned(__pin)", env.context);
}

// The sandbox has its own Array prototype, so the result is serialized back
// before comparison: deepStrictEqual would reject two structurally equal arrays
// that came from different realms.
function frozenDividers(env, frozen, measured) {
  env.sandbox.__frozen = frozen;
  env.sandbox.__measured = measured;
  return JSON.parse(vm.runInContext("JSON.stringify(contextNativeDividersWhileHidden(__frozen, __measured))", env.context));
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

test("O-14: the first drag keeps the anchor inside the menu, in the slot the dragged row freed", async () => {
  const env = await geometryEnv();
  assert.equal(
    pinned(env, { dragging: true, tuckedCount: 0, visibleCount: 7 }),
    true,
    "a row that is really being dragged can stand in for the anchor: same height, control inside the panel"
  );
  assert.equal(pinned(env, { dragging: true, tuckedCount: 0, visibleCount: 2 }), true, "two rows left is still a usable drop list");
});

test("O-14: pinning never applies without a drag, after a tuck, or when it would empty the menu", async () => {
  const env = await geometryEnv();
  assert.equal(pinned(env, { dragging: false, tuckedCount: 0, visibleCount: 7 }), false, "an idle menu grows nothing: no anchor at all");
  assert.equal(pinned(env, { dragging: true, tuckedCount: 1, visibleCount: 6 }), false, "a menu that already tucks rows is in flow anyway");
  assert.equal(
    pinned(env, { dragging: true, tuckedCount: 0, visibleCount: 1 }),
    false,
    "the last visible action cannot be tucked, so the anchor has to stay out of flow"
  );
  assert.equal(pinned(env, null), false);
  assert.equal(pinned(env, undefined), false);
});

test("O-14: a hidden source row never shifts the host separators the first commit writes", async () => {
  const env = await geometryEnv();
  assert.deepEqual(frozenDividers(env, null, [2]), [2], "no drag snapshot: the measured grouping stands");
  assert.deepEqual(
    frozenDividers(env, [2], [1]),
    [2],
    "the row is display:none, so the re-measure lost it and counted one row less: the frozen set wins"
  );
  assert.deepEqual(frozenDividers(env, [], [1]), [], "a frozen empty grouping is a real snapshot, not a missing one");
  assert.deepEqual(frozenDividers(env, null, undefined), [], "an unmeasurable menu degrades to no dividers");
  env.sandbox.__measured = [2];
  const kept = vm.runInContext(
    "(function () { const result = contextNativeDividersWhileHidden(null, __measured); result.push(3); return __measured.length; })()",
    env.context
  );
  assert.equal(kept, 1, "the caller gets a copy: the model's own array must not be mutated");
});
