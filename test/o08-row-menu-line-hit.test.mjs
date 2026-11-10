import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { createClientEnv } from "./helpers/client-env.mjs";

// The header-toolbar menu renders each separator inside the wrapper of the row
// it groups (wrapper = hairline + item), so the line's own y is the only honest
// answer to "which divider did the pointer hit". These cover that rule.

async function geometryEnv() {
  return createClientEnv({ modules: ["context-geometry.js"] });
}

function nearest(env, candidates, y, tolerance) {
  env.sandbox.__candidates = candidates;
  env.sandbox.__y = y;
  env.sandbox.__tolerance = tolerance;
  return vm.runInContext("nearestLineGap(__candidates, __y, __tolerance)", env.context);
}

test("O-08: a hairline is hit by its own y, not by the row that wraps it", async () => {
  const env = await geometryEnv();
  const candidates = [
    { gap: 2, y: 475 },
    { gap: 3, y: 516 },
    { gap: 7, y: 658 },
  ];
  assert.equal(nearest(env, candidates, 475, Infinity), 2);
  assert.equal(nearest(env, candidates, 516, Infinity), 3);
  assert.equal(nearest(env, candidates, 658, Infinity), 7);
});

test("O-08: a row click away from every line stays a row click", async () => {
  const env = await geometryEnv();
  const candidates = [
    { gap: 2, y: 475 },
    { gap: 3, y: 516 },
  ];
  assert.equal(nearest(env, candidates, 496, 4), 0);
  // 475 - 4 is still the line; one pixel further is a row click again.
  assert.equal(nearest(env, candidates, 470, 4), 0);
});

test("O-08: four pixels around a line still count as the line", async () => {
  const env = await geometryEnv();
  const candidates = [{ gap: 5, y: 600 }];
  assert.equal(nearest(env, candidates, 596, 4), 5);
  assert.equal(nearest(env, candidates, 604, 4), 5);
  assert.equal(nearest(env, candidates, 605, 4), 0);
});

test("O-08: the nearest line wins when two are close", async () => {
  const env = await geometryEnv();
  const candidates = [
    { gap: 2, y: 471 },
    { gap: 3, y: 475 },
  ];
  assert.equal(nearest(env, candidates, 474, 4), 3);
  assert.equal(nearest(env, candidates, 472, 4), 2);
  // A tie keeps the first candidate, so a repaint cannot flip the answer.
  assert.equal(nearest(env, candidates, 473, 4), 2);
});

test("O-08: gap zero and unusable candidates cannot be returned", async () => {
  const env = await geometryEnv();
  const candidates = [
    null,
    { gap: 0, y: 500 },
    { gap: 4, y: Number.NaN },
    { gap: 6, y: 640 },
  ];
  assert.equal(nearest(env, candidates, 500, 4), 0);
  assert.equal(nearest(env, candidates, 640, 4), 6);
  assert.equal(nearest(env, [], 640, 4), 0);
  assert.equal(nearest(env, candidates, Number.NaN, 4), 0);
});
