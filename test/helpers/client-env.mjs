import vm from "node:vm";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC_DIR = join(HERE, "..", "..", "src");

const STORAGE_NAMES = [
  "readState",
  "writeState",
  "readScope",
  "writeScope",
  "readAliases",
  "writeAliases",
  "resetScopeState",
  "forgetLayout",
  "importConfigSnapshot",
  "exportConfigSnapshot",
  "readDragEnabled",
  "writeDragEnabled",
  "isLayoutCustomized",
  "markLayoutCustomized",
  "stateSnapshot",
  "hasLayoutContent",
];

const SYNC_NAMES = [
  "noteLocalChange",
  "syncStatus",
  "pullHostLayout",
  "pushHostLayout",
  "startHostSync",
  "stopHostSync",
  "adoptHostLayout",
  "setCrossWindowEnabled",
  "isCrossWindowEnabled",
  "readSyncMeta",
  "writeSyncMeta",
  "syncMeta",
];

function eventTarget() {
  const listeners = new Map();
  return {
    addEventListener(type, handler) {
      if (typeof handler !== "function") return;
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(handler);
    },
    removeEventListener(type, handler) {
      const set = listeners.get(type);
      if (set) set.delete(handler);
    },
    dispatch(type, event) {
      const set = listeners.get(type);
      if (!set) return;
      for (const handler of Array.from(set)) handler(event || { type, preventDefault() {}, stopPropagation() {} });
    },
    count(type) {
      const set = listeners.get(type);
      return set ? set.size : 0;
    },
  };
}

function createClock() {
  let now = Date.now();
  let seq = 0;
  const timers = new Map();

  function schedule(fn, ms, repeat, args) {
    const id = (seq += 1);
    const wait = Math.max(0, Number(ms) || 0);
    timers.set(id, {
      at: now + wait,
      fn,
      args: args || [],
      repeat: repeat ? Math.max(1, wait) : 0,
    });
    return id;
  }

  function clear(id) {
    timers.delete(id);
  }

  function advance(ms) {
    const target = now + Math.max(0, Number(ms) || 0);
    for (;;) {
      let nextId = 0;
      let next = null;
      for (const [id, timer] of timers) {
        if (timer.at > target) continue;
        if (!next || timer.at < next.at || (timer.at === next.at && id < nextId)) {
          next = timer;
          nextId = id;
        }
      }
      if (!next) break;
      const at = next.at;
      if (next.repeat) next.at += next.repeat;
      else timers.delete(nextId);
      now = at;
      next.fn(...next.args);
    }
    now = target;
  }

  return {
    now: () => now,
    setTimeout: (fn, ms, ...args) => schedule(fn, ms, false, args),
    clearTimeout: (id) => clear(id),
    setInterval: (fn, ms, ...args) => schedule(fn, ms, true, args),
    clearInterval: (id) => clear(id),
    requestAnimationFrame: (fn) => schedule(() => fn(now), 16, false, []),
    cancelAnimationFrame: (id) => clear(id),
    advance,
    pending: () => timers.size,
  };
}

function createStorage(seed) {
  const map = new Map(Object.entries(seed || {}));
  return {
    getItem(key) {
      return map.has(key) ? map.get(key) : null;
    },
    setItem(key, value) {
      map.set(key, String(value));
    },
    removeItem(key) {
      map.delete(key);
    },
    clear() {
      map.clear();
    },
    key(index) {
      return Array.from(map.keys())[index] ?? null;
    },
    get length() {
      return map.size;
    },
    dump() {
      return Object.fromEntries(map);
    },
  };
}

function createDocument(target, clock) {
  return {
    visibilityState: "visible",
    addEventListener: target.addEventListener,
    removeEventListener: target.removeEventListener,
    querySelector: () => null,
    querySelectorAll: () => [],
    createElement(tag) {
      return {
        tagName: String(tag || "").toUpperCase(),
        dataset: {},
        style: {},
        setAttribute() {},
        removeAttribute() {},
        appendChild() {},
        removeChild() {},
        addEventListener() {},
        removeEventListener() {},
      };
    },
    head: { appendChild() {} },
    body: { appendChild() {} },
    documentElement: {},
  };
}

function flushMicrotasks() {
  return new Promise((resolve) => setImmediate(resolve));
}

/**
 * Evaluate selected src modules in one vm context with hand-written browser
 * stubs. The modules are the same files scripts/build.mjs concatenates, in the
 * same order, so top-level function declarations stay reachable across files.
 */
export function createClientEnv(options) {
  const opts = options || {};
  const modules = opts.modules || ["constants.js", "storage.js", "sync.js"];
  const clock = createClock();
  const windowEvents = eventTarget();
  const documentEvents = eventTarget();
  const document = createDocument(documentEvents, clock);
  const storage = createStorage(opts.seed);
  const fetchCalls = [];
  const logs = [];
  let fetchHandler = async () => ({
    ok: true,
    status: 200,
    json: async () => ({ ok: true, updatedAt: 0, layout: null }),
  });

  const consoleStub = {
    log: (...args) => logs.push(["log", args]),
    info: (...args) => logs.push(["info", args]),
    warn: (...args) => logs.push(["warn", args]),
    error: (...args) => logs.push(["error", args]),
    debug: (...args) => logs.push(["debug", args]),
  };

  const fetchStub = async (url, init) => {
    const call = { url: String(url), init: init || {}, at: clock.now() };
    fetchCalls.push(call);
    return fetchHandler(call);
  };

  class VirtualDate extends Date {
    constructor(...args) {
      if (args.length === 0) super(clock.now());
      else super(...args);
    }
    static now() {
      return clock.now();
    }
  }

  const sandbox = {
    console: consoleStub,
    localStorage: storage,
    document,
    fetch: fetchStub,
    setTimeout: clock.setTimeout,
    clearTimeout: clock.clearTimeout,
    setInterval: clock.setInterval,
    clearInterval: clock.clearInterval,
    requestAnimationFrame: clock.requestAnimationFrame,
    cancelAnimationFrame: clock.cancelAnimationFrame,
    Date: VirtualDate,
    addEventListener: windowEvents.addEventListener,
    removeEventListener: windowEvents.removeEventListener,
  };
  Object.assign(sandbox, opts.globals || {});
  sandbox.window = sandbox;

  const context = vm.createContext(sandbox);
  const source = modules
    .map((file) => readFileSync(join(SRC_DIR, file), "utf8"))
    .join("\n;\n");
  vm.runInContext(source, context, { filename: "dso-client-test-bundle.js" });

  const exposed = [];
  if (modules.includes("storage.js")) exposed.push(...STORAGE_NAMES);
  if (modules.includes("sync.js")) exposed.push(...SYNC_NAMES);
  if (modules.includes("plugin.js")) exposed.push("apply");
  vm.runInContext("globalThis.__dso = { " + exposed.join(", ") + " };", context);

  return {
    sandbox,
    context,
    document,
    clock,
    storage,
    fetchCalls,
    logs,
    dso: sandbox.__dso,
    advance(ms) {
      clock.advance(ms);
    },
    async flush() {
      for (let i = 0; i < 8; i += 1) await flushMicrotasks();
    },
    setFetchHandler(handler) {
      fetchHandler = handler;
    },
    dispatchWindow(type) {
      windowEvents.dispatch(type);
    },
    dispatchDocument(type) {
      documentEvents.dispatch(type);
    },
    listenerCount(target, type) {
      return (target === "document" ? documentEvents : windowEvents).count(type);
    },
    takeFetchCalls() {
      return fetchCalls.splice(0, fetchCalls.length);
    },
  };
}
