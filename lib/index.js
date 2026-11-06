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
 *   GET  -> { ok, updatedAt, layout: { version, scopes, drag } | null }
 *   POST <- { layout: { version, scopes, drag }, updatedAt, reset?: boolean }
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

function normalizeLayout(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const scopes = value.scopes && typeof value.scopes === "object" && !Array.isArray(value.scopes) ? value.scopes : {};
  const drag = value.drag && typeof value.drag === "object" && !Array.isArray(value.drag) ? value.drag : {};
  const version = Number(value.version);
  return {
    version: Number.isFinite(version) && version > 0 ? version : 3,
    scopes,
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

async function readStored() {
  try {
    const raw = await readFile(storageFile(), "utf8");
    const parsed = JSON.parse(raw);
    const layout = normalizeLayout(parsed && parsed.layout);
    if (!layout) return null;
    const updatedAt = Number(parsed && parsed.updatedAt);
    return { version: DOC_VERSION, layout, updatedAt: Number.isFinite(updatedAt) ? updatedAt : 0 };
  } catch (error) {
    if (error && error.code === "ENOENT") return null;
    // A corrupt or half-written file must not look like "no layout yet": the
    // client would treat the empty answer as authoritative and overwrite it.
    logger?.warn?.(
      "[dsh-sidebar-organizer] stored layout is unreadable, keeping the file: " +
        String((error && error.message) || error)
    );
    return null;
  }
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
  if (!stored) return json({ ok: true, updatedAt: 0, layout: null });
  return json({ ok: true, updatedAt: stored.updatedAt, layout: stored.layout });
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
  const stored = await readStored();

  // An older push never wins: answer with the stored copy so the client can
  // adopt what the other window saved.
  if (stored && stored.updatedAt > updatedAt) {
    return json({ ok: true, updatedAt: stored.updatedAt, layout: stored.layout, replaced: false });
  }
  // A window that has nothing yet must not blank a saved layout. Only an
  // explicit reset (or a newer timestamp on content) may clear it.
  if (stored && hasContent(stored.layout) && !hasContent(layout) && !reset) {
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
