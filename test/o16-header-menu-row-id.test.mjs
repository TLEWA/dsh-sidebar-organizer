import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { createClientEnv } from "./helpers/client-env.mjs";

// The shipped popup tags its row id on the inner button, never on the viewport
// child that carries the flex order. Reading only the child found zero rows, so
// the saved order round-tripped through storage and was never applied - the
// reported "drag updates nothing" popup. The lookup is pinned here with plain
// node-shaped objects: one that owns the id, one carrying it on a descendant,
// and one that has neither.
async function geometryEnv() {
  return createClientEnv({ modules: ["context-geometry.js"] });
}

function node(self, inner) {
  const child = inner ? { dataset: { dsoHostId: inner } } : null;
  return {
    dataset: self ? { dsoHostId: self } : {},
    querySelector: (selector) => (selector === "[data-dso-host-id]" ? child : null),
  };
}

function idOf(env, value) {
  env.sandbox.__node = value;
  return vm.runInContext("headerMenuRowIdOf(__node)", env.context);
}

test("O-16: a row id on the viewport child itself is used", async () => {
  const env = await geometryEnv();
  assert.equal(idOf(env, node("dso-host-a", "")), "dso-host-a");
});

test("O-16: a row id on the tagged inner button is found through the wrapper", async () => {
  const env = await geometryEnv();
  assert.equal(idOf(env, node("", "dso-host-h6646f15c")), "dso-host-h6646f15c");
});

test("O-16: rows without an id (the tucked shelf) and junk nodes answer empty", async () => {
  const env = await geometryEnv();
  assert.equal(idOf(env, node("", "")), "");
  assert.equal(idOf(env, null), "");
  env.sandbox.__node = {};
  assert.equal(vm.runInContext("headerMenuRowIdOf(__node)", env.context), "");
});
