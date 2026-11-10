import test from "node:test";
import assert from "node:assert/strict";
import { createHostEnv } from "./helpers/host-env.mjs";
import { createClientEnv } from "./helpers/client-env.mjs";

const ALIASES = { sidebar: { "session:old-label": "row:chat" } };
const SNAPSHOT = {
  version: 4,
  scopes: { sidebar: { order: ["row:chat"], hidden: [] } },
  aliases: ALIASES,
  drag: { sidebar: true },
};

test("O-02: the host keeps the alias table it was given", async () => {
  const env = await createHostEnv();
  try {
    await env.request("POST", { layout: SNAPSHOT, updatedAt: 10 });
    const body = await (await env.request("GET")).json();
    assert.deepEqual(body.layout.aliases, ALIASES);
  } finally {
    await env.cleanup();
  }
});

test("O-02: adopting a host layout keeps its alias table", () => {
  const env = createClientEnv({ modules: ["constants.js", "storage.js", "sync.js"] });
  assert.equal(env.dso.adoptHostLayout(SNAPSHOT, 500), true);
  assert.deepEqual({ ...env.dso.readAliases("sidebar") }, ALIASES.sidebar);
});
