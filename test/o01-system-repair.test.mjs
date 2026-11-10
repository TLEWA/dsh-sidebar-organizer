import test from "node:test";
import assert from "node:assert/strict";
import { createClientEnv } from "./helpers/client-env.mjs";

const HOST_LAYOUT = {
  version: 4,
  scopes: { sidebar: { order: ["b", "a"], hidden: [] } },
  aliases: {},
  drag: { sidebar: true },
};

function seed(env, order, updatedAt) {
  env.storage.setItem(
    "dsh.sidebar-organizer.layout.v1",
    JSON.stringify({ version: 4, scopes: { sidebar: { order, hidden: [] } }, aliases: {} })
  );
  env.storage.setItem(
    "dsh.sidebar-organizer.sync.v1",
    JSON.stringify({ updatedAt, client: "seed", syncedAt: 1 })
  );
  env.storage.setItem("dsh.sidebar-organizer.customized.v1", "1");
}

test("O-01: a system repair does not make the local layout look newer", async () => {
  const env = createClientEnv({ modules: ["constants.js", "storage.js", "sync.js"] });
  seed(env, ["a", "b"], 100);
  env.setFetchHandler(async () => ({
    ok: true,
    status: 200,
    json: async () => ({ ok: true, updatedAt: 200, layout: HOST_LAYOUT }),
  }));

  // The projection pass writes its repaired order without options.user; it is
  // not a version of the layout and must not raise the sync timestamp.
  env.dso.writeScope("sidebar", { order: ["a", "b"], hidden: [] });
  assert.equal(env.dso.readSyncMeta().updatedAt, 100, "system repair raised the sync timestamp");

  const adopted = await env.dso.pullHostLayout();
  assert.equal(adopted, true, "the newer host copy was refused as local-newer");
  assert.deepEqual(Array.from(env.dso.readScope("sidebar").order), ["b", "a"]);
});

test("O-01: a user edit still raises the timestamp and schedules a push", async () => {
  const env = createClientEnv({ modules: ["constants.js", "storage.js", "sync.js"] });
  seed(env, ["a", "b"], 100);
  env.setFetchHandler(async () => ({
    ok: true,
    status: 200,
    json: async () => ({ ok: true, updatedAt: 0, replaced: true }),
  }));

  env.dso.writeScope("sidebar", { order: ["b", "a"], hidden: [] }, { user: true });
  assert.ok(env.dso.readSyncMeta().updatedAt > 200, "user edit did not raise the sync timestamp");

  env.advance(400);
  await env.flush();
  const calls = env.takeFetchCalls();
  assert.equal(calls.length, 1, "user edit did not schedule exactly one push");
  assert.equal(calls[0].init.method, "POST");
});
