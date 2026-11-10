import test from "node:test";
import assert from "node:assert/strict";
import { createClientEnv } from "./helpers/client-env.mjs";

const DISABLED_KEY = "dsh.sidebar-organizer.disabled";
const CUSTOMIZED_KEY = "dsh.sidebar-organizer.customized.v1";

function boot(seed) {
  const runtime = {
    started: 0,
    stopped: 0,
    start() {
      this.started += 1;
    },
    stop() {
      this.stopped += 1;
    },
    pass() {},
    refresh() {},
  };
  const cleanups = [];
  const env = createClientEnv({
    modules: ["constants.js", "storage.js", "sync.js", "plugin.js"],
    seed,
    globals: {
      CSS: "",
      createMenuEntry: () => null,
      createSettingsPage: () => null,
      createSettingsNavIcon: () => null,
      createRuntime: () => runtime,
    },
  });
  env.dso.apply({
    logger: { debug() {}, info() {}, warn() {}, error() {} },
    effect: (fn) => cleanups.push(fn()),
    slots: undefined,
  });
  return { env, runtime };
}

test("O-03: disable() stops pending pushes and wake pulls", async () => {
  const { env, runtime } = boot({ [CUSTOMIZED_KEY]: "1" });
  env.setFetchHandler(async () => ({
    ok: true,
    status: 200,
    json: async () => ({ ok: true, updatedAt: 0, layout: null }),
  }));
  env.advance(20);
  await env.flush();
  assert.equal(env.fetchCalls.length, 1, "the first pull did not run");
  env.takeFetchCalls();

  env.sandbox.__dshSidebarOrganizer.disable();
  assert.equal(runtime.stopped, 1, "disable() did not stop the runtime");
  env.advance(5000);
  await env.flush();
  assert.equal(env.fetchCalls.length, 0, "disabled plugin kept pushing or pulling");
  assert.equal(env.listenerCount("window", "focus"), 0, "wake listener survived disable()");
});

test("O-03: a window that boots disabled does not sync at all", async () => {
  const { env } = boot({ [DISABLED_KEY]: "1" });
  env.advance(1000);
  await env.flush();
  assert.equal(env.fetchCalls.length, 0, "a disabled plugin pulled the host layout");
});
