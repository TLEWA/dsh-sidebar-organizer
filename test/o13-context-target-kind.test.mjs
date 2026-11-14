import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { createClientEnv } from "./helpers/client-env.mjs";

// The conversation body menu is opened by dsh-sidebar-row-menu through the
// host's contextMenus service. Unlike the sidebar row menus it has no row-key
// and no label of its own, so the only trustworthy signal is the target the
// host is currently showing. These cases pin every accessor the host store has
// used, so a store rename degrades to "unknown" instead of misclassifying a
// menu (which would persist its rows under the wrong key).
async function kindEnv() {
  return createClientEnv({ modules: ["context-geometry.js"] });
}

function kind(env, service) {
  env.sandbox.__service = service;
  return vm.runInContext("contextMenuTargetKind(__service)", env.context);
}

test("O-13: the conversation body menu is recognised from the host target", async () => {
  const env = await kindEnv();
  assert.equal(kind(env, { active: { getSnapshot: () => ({ kind: "conversation" }) } }), "conversation");
  assert.equal(kind(env, { active: { get: () => ({ kind: "conversation" }) } }), "conversation");
  assert.equal(kind(env, { active: { snapshot: () => ({ kind: "conversation" }) } }), "conversation");
  assert.equal(kind(env, { active: { value: { kind: "conversation" } } }), "conversation");
});

test("O-13: other targets and empty snapshots leave the label path in charge", async () => {
  const env = await kindEnv();
  assert.equal(kind(env, { active: { getSnapshot: () => ({ kind: "session" }) } }), "");
  assert.equal(kind(env, { active: { getSnapshot: () => ({ kind: "workspace" }) } }), "");
  assert.equal(kind(env, { active: { getSnapshot: () => ({ kind: "file" }) } }), "");
  assert.equal(kind(env, { active: { getSnapshot: () => null } }), "");
  assert.equal(kind(env, { active: null }), "");
  assert.equal(kind(env, null), "");
  assert.equal(kind(env, undefined), "");
});

test("O-13: a throwing snapshot accessor degrades to unknown instead of a wrong kind", async () => {
  const env = await kindEnv();
  const broken = {
    active: {
      getSnapshot: () => {
        throw new Error("store gone");
      },
    },
  };
  assert.equal(kind(env, broken), "");
  assert.ok(env.logs.some((entry) => entry[0] === "warn"), "the failure is logged, not swallowed");
});
