import test from "node:test";
import assert from "node:assert/strict";
import { createClientEnv } from "./helpers/client-env.mjs";

const PRIMARY = "dsh.sidebar-organizer.layout.v1";
const BACKUP = PRIMARY + ".v3-backup";
const GOOD = JSON.stringify({
  version: 4,
  scopes: { sidebar: { order: ["saved-a", "saved-b"], hidden: ["saved-b"] } },
  aliases: { sidebar: { fingerprint: "saved-a" } },
});

function client(seed) {
  return createClientEnv({ modules: ["constants.js", "storage.js"], seed });
}

test("O-05: a corrupt primary key is restored from the good backup", () => {
  const env = client({ [PRIMARY]: "{not json", [BACKUP]: GOOD });
  try {
    assert.deepEqual(Array.from(env.dso.readScope("sidebar").order), ["saved-a", "saved-b"]);
    assert.deepEqual({ ...env.dso.readAliases("sidebar") }, { fingerprint: "saved-a" });
    const rewritten = JSON.parse(env.storage.getItem(PRIMARY));
    assert.deepEqual(Array.from(rewritten.scopes.sidebar.order), ["saved-a", "saved-b"]);
  } finally {
    env.context = null;
  }
});

test("O-05: when both keys are corrupt the bad values are kept before reset", () => {
  const env = client({ [PRIMARY]: "{broken", [BACKUP]: "]}broken" });
  try {
    env.dso.readState();
    const dump = env.storage.dump();
    const primaryKept = Object.keys(dump).filter((key) => key.startsWith(PRIMARY + ".corrupt-"));
    const backupKept = Object.keys(dump).filter((key) => key.startsWith(BACKUP + ".corrupt-"));
    assert.equal(primaryKept.length, 1);
    assert.equal(dump[primaryKept[0]], "{broken");
    assert.equal(backupKept.length, 1);
    assert.equal(dump[backupKept[0]], "]}broken");
    assert.ok(
      env.logs.some(([level, args]) => level === "warn" && String(args[0]).includes("corrupt")),
      "a corrupt store reset silently"
    );
  } finally {
    env.context = null;
  }
});

test("O-05: writeState does not trade a good backup for an empty layout", () => {
  const env = client({ [PRIMARY]: "{not json", [BACKUP]: GOOD });
  try {
    env.dso.writeState({ version: 4, scopes: {}, aliases: {} });
    assert.equal(env.storage.getItem(BACKUP), GOOD);
  } finally {
    env.context = null;
  }
});
