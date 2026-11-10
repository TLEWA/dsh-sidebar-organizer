import test from "node:test";
import assert from "node:assert/strict";
import { createHostEnv } from "./helpers/host-env.mjs";

const CORRUPT = '{"version":1,"updatedAt":7,"layout":{"version":4,"scopes":{"sidebar":{"order":["a"';
const LAYOUT = {
  version: 4,
  scopes: { sidebar: { order: ["a", "b"], hidden: [] } },
  aliases: {},
  drag: { sidebar: true },
};

test("O-04: a corrupt file is reported, not served as an empty layout", async () => {
  const env = await createHostEnv();
  try {
    await env.writeLayoutFile(CORRUPT);
    const response = await env.request("GET");
    assert.equal(response.status, 500);
    const body = await response.json();
    assert.equal(body.ok, false);
    assert.equal(body.code, "layout-corrupt");

    const names = await env.listLayoutDir();
    const backups = names.filter((name) => /^layout\.json\.corrupt-\d+$/.test(name));
    assert.equal(backups.length, 1, "the corrupt file was not quarantined");
    assert.equal(await env.readLayoutFile().catch(() => null), null, "the corrupt file was left in place");
  } finally {
    await env.cleanup();
  }
});

test("O-04: a push cannot silently overwrite a corrupt file", async () => {
  const env = await createHostEnv();
  try {
    await env.writeLayoutFile(CORRUPT);
    const first = await env.request("POST", { layout: LAYOUT, updatedAt: 5 });
    assert.equal(first.status, 500);
    assert.equal((await first.clone().json().catch(() => ({}))).code, "layout-corrupt");

    const names = await env.listLayoutDir();
    const backup = names.find((name) => /^layout\.json\.corrupt-\d+$/.test(name));
    assert.ok(backup, "the corrupt file was overwritten without a backup");
    const kept = await env.readLayoutFile().catch(() => null);
    assert.equal(kept, null);

    const second = await env.request("POST", { layout: LAYOUT, updatedAt: 6 });
    assert.equal(second.status, 200);
    const body = await second.json();
    assert.equal(body.replaced, true);
    const saved = JSON.parse(await env.readLayoutFile());
    assert.deepEqual(saved.layout.scopes.sidebar.order, ["a", "b"]);
  } finally {
    await env.cleanup();
  }
});
