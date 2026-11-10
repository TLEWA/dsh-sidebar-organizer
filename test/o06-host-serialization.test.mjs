import test from "node:test";
import assert from "node:assert/strict";
import { createHostEnv } from "./helpers/host-env.mjs";

function layout(tag) {
  return {
    version: 4,
    scopes: { sidebar: { order: [tag], hidden: [] } },
    aliases: {},
    drag: { sidebar: true },
  };
}

test("O-06: concurrent pushes are applied in updatedAt order", async () => {
  const env = await createHostEnv();
  try {
    // All requests read before any write when the read-modify-write is not
    // serialized, so the oldest push can finish last and win the file.
    const pending = [];
    for (let at = 50; at >= 1; at -= 1) {
      pending.push(env.request("POST", { layout: layout("s" + at), updatedAt: at }));
    }
    const responses = await Promise.all(pending);
    const bodies = await Promise.all(responses.map((response) => response.json()));

    const saved = JSON.parse(await env.readLayoutFile());
    assert.equal(saved.updatedAt, 50);
    assert.deepEqual(saved.layout.scopes.sidebar.order, ["s50"]);

    const replaced = bodies.filter((body) => body.replaced === true);
    assert.equal(replaced.length, 1, "more than one push claimed to replace the stored layout");
    assert.equal(replaced[0].updatedAt, 50);
  } finally {
    await env.cleanup();
  }
});

test("O-06: an older push after a newer one never overwrites it", async () => {
  const env = await createHostEnv();
  try {
    const first = await env.request("POST", { layout: layout("new"), updatedAt: 200 });
    assert.equal((await first.json()).replaced, true);
    const stale = await env.request("POST", { layout: layout("old"), updatedAt: 100 });
    const body = await stale.json();
    assert.equal(body.replaced, false);
    assert.equal(body.updatedAt, 200);
    assert.deepEqual(body.layout.scopes.sidebar.order, ["new"]);
    const saved = JSON.parse(await env.readLayoutFile());
    assert.equal(saved.updatedAt, 200);
  } finally {
    await env.cleanup();
  }
});
