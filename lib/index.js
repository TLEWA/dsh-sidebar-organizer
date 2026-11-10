/**
 * Host half of dsh-sidebar-organizer.
 *
 * The layout used to live only in the browser's localStorage, which is keyed by
 * origin. The desktop window runs on the dsh-app:// scheme while a browser tab
 * on http://127.0.0.1:<port> is a different origin whose port changes on every
 * restart, so a drag done in one window never reached the other one.
 *
 * This half keeps one JSON copy under $DSH_HOME/storages/dsh-sidebar-organizer/
 * and serves it on /api/dsh-sidebar-organizer/layout, so every window reads and
 * writes the same layout. The client keeps localStorage as its synchronous read
 * path and reconciles with this copy on start, on every local change, and
 * whenever it regains focus.
 *
 * Wire shape:
 *   GET  -> { ok, updatedAt, layout: { version, scopes, aliases, drag } | null }
 *   POST <- { layout: { version, scopes, aliases, drag }, updatedAt, reset?: boolean }
 *        -> { ok, updatedAt, layout?, replaced } — layout is present when the
 *           stored copy is newer (or the push carried nothing), so the client
 *           can adopt it instead of overwriting.
 */
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { randomUUID } from "node:crypto";

export const name = "dsh-sidebar-organizer";
export const inject = [];

const ROUTE_PATH = "/api/dsh-sidebar-organizer/layout";
const DOC_VERSION = 1;
const MAX_BODY_BYTES = 1024 * 1024;

// Set from apply(); lets storage problems reach the host log instead of being
// swallowed by the route handler.
let logger = null;

function storageRoot() {
  const home = process.env.DSH_HOME?.trim() || join(homedir(), ".dsh");
  return resolve(home, "storages", "dsh-sidebar-organizer");
}

function storageFile() {
  return join(storageRoot(), "layout.json");
}

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status: status || 200,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

// v4 stores one label -> id table per scope. It is as much part of the saved
// layout as the order itself: dropping it on the way through the host makes a
// row renamed by the host look like a different row to every other window.
function normalizeAliases(value) {
  const out = {};
  if (!value || typeof value !== "object" || Array.isArray(value)) return out;
  for (const scope of Object.keys(value)) {
    const entries = value[scope];
    if (!entries || typeof entries !== "object" || Array.isArray(entries)) continue;
    const next = {};
    for (const key of Object.keys(entries)) {
      const id = entries[key];
      if (!key || typeof id !== "string" || !id) continue;
      next[key] = id;
    }
    if (Object.keys(next).length) out[scope] = next;
  }
  return out;
}

function normalizeLayout(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const scopes = value.scopes && typeof value.scopes === "object" && !Array.isArray(value.scopes) ? value.scopes : {};
  const drag = value.drag && typeof value.drag === "object" && !Array.isArray(value.drag) ? value.drag : {};
  const version = Number(value.version);
  return {
    version: Number.isFinite(version) && version > 0 ? version : 3,
    scopes,
    aliases: normalizeAliases(value.aliases),
    drag,
  };
}

function hasContent(layout) {
  if (!layout) return false;
  const scopes = layout.scopes || {};
  for (const key of Object.keys(scopes)) {
    const scope = scopes[key];
    if (scope && Array.isArray(scope.order) && scope.order.length) return true;
    if (scope && Array.isArray(scope.hidden) && scope.hidden.length) return true;
  }
  return false;
}

// Keep the original bytes before anything may overwrite them. Returns the
// backup path, or null when the file was already renamed by a concurrent
// request (ENOENT) or cannot be moved (permissions).
async function quarantineCorruptFile() {
  const target = storageFile();
  const stamp = Date.now();
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const backup = target + ".corrupt-" + (stamp + attempt);
    try {
      await rename(target, backup);
      return backup;
    } catch (error) {
      if (error && error.code === "ENOENT") return null;
      // Windows refuses to move a file onto an existing name; try the next
      // millisecond instead of overwriting an earlier backup.
      if (error && (error.code === "EEXIST" || error.code === "EPERM")) continue;
      throw error;
    }
  }
  return null;
}

// A file that parses but has no usable layout is as corrupt as a truncated
// one: both must be reported instead of looking like "no layout yet", or the
// next push silently overwrites the only copy of the user's layout.
async function quarantineCorruptLayout(reason) {
  let backup = null;
  try {
    backup = await quarantineCorruptFile();
  } catch (error) {
    logger?.warn?.(
      "[dsh-sidebar-organizer] could not quarantine the corrupt layout: " +
        String((error && error.message) || error)
    );
  }
  logger?.warn?.(
    "[dsh-sidebar-organizer] " +
      reason +
      (backup ? "; kept the file as " + backup : "; leaving it in place")
  );
  return { status: "corrupt", code: "layout-corrupt", backup };
}

async function readStored() {
  let raw;
  try {
    raw = await readFile(storageFile(), "utf8");
  } catch (error) {
    if (error && error.code === "ENOENT") return { status: "missing" };
    logger?.warn?.(
      "[dsh-sidebar-organizer] stored layout is unreadable: " + String((error && error.message) || error)
    );
    return { status: "error", code: "layout-unreadable" };
  }
  let parsed = null;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    return quarantineCorruptLayout("stored layout is not JSON: " + String((error && error.message) || error));
  }
  const layout = normalizeLayout(parsed && parsed.layout);
  if (!layout) return quarantineCorruptLayout("stored layout has no valid layout object");
  const updatedAt = Number(parsed && parsed.updatedAt);
  return { status: "ok", version: DOC_VERSION, layout, updatedAt: Number.isFinite(updatedAt) ? updatedAt : 0 };
}

async function writeStored(doc) {
  const dir = storageRoot();
  await mkdir(dir, { recursive: true });
  const target = storageFile();
  const temp = join(dir, "." + randomUUID() + ".tmp");
  try {
    await writeFile(temp, JSON.stringify(doc), "utf8");
    await rename(temp, target);
  } catch (error) {
    await rm(temp, { force: true }).catch(() => {});
    throw error;
  }
}

async function readBody(request) {
  // The route already buffers the body, so checking the declared length first
  // is the only way to refuse an oversized push before it is parsed.
  try {
    const declared = Number(request.headers && request.headers.get ? request.headers.get("content-length") : NaN);
    if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) return { error: "body too large" };
  } catch (err) {
    /* a missing header is fine */
  }
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) return { error: "body too large" };
  try {
    return { body: JSON.parse(text) };
  } catch (error) {
    return { error: "body is not JSON" };
  }
}

async function handleGet() {
  const stored = await readStored();
  if (stored.status === "missing") return json({ ok: true, updatedAt: 0, layout: null });
  if (stored.status !== "ok") {
    return json(
      {
        ok: false,
        error: stored.status === "corrupt" ? "stored layout is corrupt" : "stored layout is unreadable",
        code: stored.code,
        backup: stored.backup || null,
      },
      500
    );
  }
  return json({ ok: true, updatedAt: stored.updatedAt, layout: stored.layout });
}

// Two windows can push at the same moment. Both handlers would read the same
// stored copy before either writes, so without an in-process chain the write
// that finishes last wins even when its updatedAt is older. Serialize the
// whole read-modify-write, and let each push observe the previous one.
let writeChain = Promise.resolve();

function serializeWrite(task) {
  const result = writeChain.then(task);
  writeChain = result.then(
    () => undefined,
    () => undefined
  );
  return result;
}

async function handlePost(request) {
  const parsed = await readBody(request);
  if (parsed.error) return json({ ok: false, error: parsed.error }, 400);
  const body = parsed.body && typeof parsed.body === "object" ? parsed.body : {};
  const layout = normalizeLayout(body.layout);
  if (!layout) return json({ ok: false, error: "missing layout" }, 400);
  const incomingAt = Number(body.updatedAt);
  const updatedAt = Number.isFinite(incomingAt) && incomingAt > 0 ? incomingAt : Date.now();
  const reset = body.reset === true;
  return serializeWrite(() => commitLayout(layout, updatedAt, reset));
}

async function commitLayout(layout, updatedAt, reset) {
  const stored = await readStored();

  // Only a missing file may be created here. A corrupt or unreadable one was
  // already quarantined by readStored(); answer 5xx once so the bytes are not
  // replaced without anyone noticing.
  if (stored.status === "corrupt") {
    return json(
      { ok: false, error: "stored layout is corrupt", code: stored.code, backup: stored.backup || null },
      500
    );
  }
  if (stored.status === "error") {
    return json({ ok: false, error: "stored layout is unreadable", code: stored.code }, 500);
  }

  // An older push never wins: answer with the stored copy so the client can
  // adopt what the other window saved.
  if (stored.status === "ok" && stored.updatedAt > updatedAt) {
    return json({ ok: true, updatedAt: stored.updatedAt, layout: stored.layout, replaced: false });
  }
  // A window that has nothing yet must not blank a saved layout. Only an
  // explicit reset (or a newer timestamp on content) may clear it.
  if (stored.status === "ok" && hasContent(stored.layout) && !hasContent(layout) && !reset) {
    return json({ ok: true, updatedAt: stored.updatedAt, layout: stored.layout, replaced: false });
  }

  await writeStored({ version: DOC_VERSION, updatedAt, layout });
  return json({ ok: true, updatedAt, replaced: true });
}

async function handle(request) {
  const method = String(request.method || "GET").toUpperCase();
  try {
    if (method === "GET" || method === "HEAD") return await handleGet();
    if (method === "POST") return await handlePost(request);
    return json({ ok: false, error: "method not allowed" }, 405);
  } catch (error) {
    return json({ ok: false, error: String((error && error.message) || error) }, 500);
  }
}

export function apply(ctx) {
  logger = ctx.logger || null;
  ctx.inject(["connection"], (inner) => {
    const connection = inner.get("connection");
    const register = connection && connection.fetch && connection.fetch.register;
    if (typeof register !== "function") {
      ctx.logger?.debug?.("[dsh-sidebar-organizer] host: no fetch route service; cross-window sync stays off");
      return;
    }
    const bind = register.bind(connection.fetch);
    inner.effect(
      () =>
        bind({
          path: ROUTE_PATH,
          methods: ["GET", "POST"],
          requestBody: "buffered",
          fetch: handle,
        }),
      "dsh-sidebar-organizer: layout route"
    );
    ctx.logger?.debug?.(`[dsh-sidebar-organizer] host: layout route ${ROUTE_PATH} -> ${storageFile()}`);
  });
}
