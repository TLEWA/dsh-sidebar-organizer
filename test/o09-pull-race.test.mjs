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

function seedLocal(env, order, updatedAt) {
  env.storage.setItem(
    LAYOUT_KEY,
    JSON.stringify({ version: 4, scopes: { sidebar: { order, hidden: [] } }, aliases: {} })
  );
  env.storage.setItem(SYNC_KEY, JSON.stringify({ updatedAt, client: "seed", syncedAt: 1 }));
  env.storage.setItem(CUSTOMIZED_KEY, "1");
}

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

test("O-09: a pull does not adopt the host layout when the user drags while it is in flight", async () => {
  const env = createClientEnv({ modules: ["constants.js", "storage.js", "sync.js"] });
  seedLocal(env, ["local-row"], 100);
  const pending = deferred();
  env.setFetchHandler(() => pending.promise);

  const pulled = env.dso.pullHostLayout();
  await env.flush();

  // The drag happens while the GET is still open: it writes a newer layout and
  // raises the sync timestamp (noteLocalChange).
  env.advance(50);
  env.dso.writeScope("sidebar", { order: ["dragged"], hidden: [] }, { user: true });
  const draggedAt = env.dso.readSyncMeta().updatedAt;
  assert.ok(draggedAt > 100, "the drag did not raise the sync timestamp");

  pending.resolve({
    ok: true,
    status: 200,
    json: async () => ({ ok: true, updatedAt: 200, layout: HOST_LAYOUT }),
  });
  const adopted = await pulled;

  assert.equal(adopted, false, "the older host copy was adopted over the drag made during the request");
  assert.deepEqual(Array.from(env.dso.readScope("sidebar").order), ["dragged"], "the drag was overwritten");
  assert.equal(env.dso.readSyncMeta().updatedAt, draggedAt, "the sync timestamp was rolled back to the host copy");
  assert.equal(env.dso.syncStatus().state, "local-newer");
});

test("O-09: a pull still adopts the host layout when nothing changed in flight", async () => {
  const env = createClientEnv({ modules: ["constants.js", "storage.js", "sync.js"] });
  seedLocal(env, ["local-row"], 100);
  env.setFetchHandler(async () => ({
    ok: true,
    status: 200,
    json: async () => ({ ok: true, updatedAt: 200, layout: HOST_LAYOUT }),
  }));

  assert.equal(await env.dso.pullHostLayout(), true);
  assert.deepEqual(Array.from(env.dso.readScope("sidebar").order), ["host-row"]);
});
