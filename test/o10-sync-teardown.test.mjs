import test from "node:test";
import assert from "node:assert/strict";
import { createClientEnv } from "./helpers/client-env.mjs";

const LAYOUT_KEY = "dsh.sidebar-organizer.layout.v1";
const SYNC_KEY = "dsh.sidebar-organizer.sync.v1";
const CUSTOMIZED_KEY = "dsh.sidebar-organizer.customized.v1";

const HOST_LAYOUT = {
  version: 4,
  scopes: { sidebar: { order: ["host-row"], hidden: [] } },
  aliases: {},
  drag: { sidebar: true },
};

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

// Boot the cross-window sync and let the first pull (queued on a frame) start.
async function boot(env) {
  env.dso.startHostSync();
  env.advance(20);
  await env.flush();
}

test("O-10: a pull that lands after stopHostSync does not write storage", async () => {
  const env = createClientEnv({ modules: ["constants.js", "storage.js", "sync.js"] });
  const pending = deferred();
  env.setFetchHandler(() => pending.promise);

  await boot(env);
  assert.equal(env.fetchCalls.length, 1, "the boot pull did not start");

  env.dso.stopHostSync();
  pending.resolve({
    ok: true,
    status: 200,
    json: async () => ({ ok: true, updatedAt: 500, layout: HOST_LAYOUT }),
  });
  await env.flush();

  assert.equal(env.dso.syncStatus().adopted, 0, "a pull that finished after teardown adopted the host layout");
  assert.equal(env.storage.getItem(LAYOUT_KEY), null, "the torn-down sync wrote a layout");
  assert.equal(env.storage.getItem(CUSTOMIZED_KEY), null, "the torn-down sync marked the window customized");
});

test("O-10: a pull that fails after stopHostSync does not re-arm the retry timer", async () => {
  const env = createClientEnv({ modules: ["constants.js", "storage.js", "sync.js"] });
  const pending = deferred();
  env.setFetchHandler(() => pending.promise);

  await boot(env);
  assert.equal(env.fetchCalls.length, 1, "the boot pull did not start");

  env.dso.stopHostSync();
  pending.reject(new Error("offline"));
  await env.flush();

  assert.equal(env.clock.pending(), 0, "a retry timer survived teardown");
  assert.equal(env.fetchCalls.length, 1, "the failed pull retried after teardown");
});

test("O-10: turning the sharing switch off cancels an in-flight pull", async () => {
  const env = createClientEnv({ modules: ["constants.js", "storage.js", "sync.js"] });
  const pending = deferred();
  env.setFetchHandler(() => pending.promise);

  await boot(env);
  assert.equal(env.fetchCalls.length, 1, "the boot pull did not start");

  env.dso.setCrossWindowEnabled(false);
  pending.resolve({
    ok: true,
    status: 200,
    json: async () => ({ ok: true, updatedAt: 500, layout: HOST_LAYOUT }),
  });
  await env.flush();

  assert.equal(env.dso.syncStatus().adopted, 0, "a pull that finished after the switch was turned off adopted the host layout");
  assert.equal(env.storage.getItem(LAYOUT_KEY), null, "the disabled sync wrote a layout");
});

test("O-10: a push that lands after stopHostSync does not write sync metadata", async () => {
  const env = createClientEnv({ modules: ["constants.js", "storage.js", "sync.js"] });
  env.setFetchHandler(async () => ({
    ok: true,
    status: 200,
    json: async () => ({ ok: true, updatedAt: 0, layout: null }),
  }));
  await boot(env);
  env.takeFetchCalls();

  env.storage.setItem(
    LAYOUT_KEY,
    JSON.stringify({ version: 4, scopes: { sidebar: { order: ["local-row"], hidden: [] } }, aliases: {} })
  );
  env.storage.setItem(SYNC_KEY, JSON.stringify({ updatedAt: 100, client: "seed", syncedAt: 0 }));
  env.storage.setItem(CUSTOMIZED_KEY, "1");

  const pending = deferred();
  env.setFetchHandler(() => pending.promise);
  const pushed = env.dso.pushHostLayout(true);
  await env.flush();

  env.dso.stopHostSync();
  pending.resolve({ ok: true, status: 200, json: async () => ({ ok: true, updatedAt: 100 }) });
  await pushed;
  await env.flush();

  assert.equal(env.dso.readSyncMeta().syncedAt, 0, "the torn-down push wrote sync metadata");
});

test("O-10: a push that fails after stopHostSync does not re-arm the retry timer", async () => {
  const env = createClientEnv({ modules: ["constants.js", "storage.js", "sync.js"] });
  env.setFetchHandler(async () => ({
    ok: true,
    status: 200,
    json: async () => ({ ok: true, updatedAt: 0, layout: null }),
  }));
  await boot(env);
  env.takeFetchCalls();

  env.storage.setItem(CUSTOMIZED_KEY, "1");
  const pending = deferred();
  env.setFetchHandler(() => pending.promise);
  const pushed = env.dso.pushHostLayout(true);
  await env.flush();

  env.dso.stopHostSync();
  pending.reject(new Error("offline"));
  await pushed;
  await env.flush();

  assert.equal(env.clock.pending(), 0, "a push retry timer survived teardown");
});
