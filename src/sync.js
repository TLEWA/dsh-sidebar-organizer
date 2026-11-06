/* Cross-origin layout sharing.
 *
 * The layout used to live only in window.localStorage, which is per-origin. The
 * desktop window runs on dsh-app://app while a browser tab on
 * http://127.0.0.1:<port> is a different origin whose port changes on every
 * restart, so the two kept separate copies and a drag done in one window never
 * showed up in the other.
 *
 * The host half of this plugin keeps one copy under
 * $DSH_HOME/storages/dsh-sidebar-organizer/layout.json and serves it on
 * /api/dsh-sidebar-organizer/layout. Every window starts from that copy and
 * publishes its own edits; localStorage stays the fast, synchronous read the
 * projection pass uses, the host copy is what makes the windows agree.
 *
 * Who wins is decided by one question: has this origin ever been rearranged by
 * the user (`isLayoutCustomized`)? The projection pass writes a layout on every
 * boot, so a fresh window cannot key off "local copy exists" — a default order
 * recorded there must never overwrite the layout another window is showing:
 *
 *   host empty + local customized      -> publish local
 *   host empty + local untouched       -> stay local, publish nothing
 *   host has copy + local untouched    -> adopt host (whatever timestamps say)
 *   host has copy + local customized   -> newer timestamp wins
 *
 * Publishing only happens on real edits, so a window that merely opened and
 * registered the defaults stays invisible to the other window.
 */

const SYNC_KEY = "dsh.sidebar-organizer.sync.v1";
const SYNC_ROUTE = "api/dsh-sidebar-organizer/layout";
const SYNC_PUSH_DELAY_MS = 350;
const SYNC_RETRY_MS = 5000;
const SYNC_WAKE_THROTTLE_MS = 800;
const SYNC_PULL_RETRY_LIMIT = 5;

let syncClientId = "";
let syncStarted = false;
let syncClaiming = false;
// Set while the settings switch turns sharing back on: the host copy wins even
// though edits made while sharing was off are newer locally, otherwise flipping
// the switch would immediately publish those private edits over the other window.
let syncForceAdopt = false;
let syncPushTimer = 0;
// When the pending push timer fires (ms since epoch), and whether it must push
// even without a user-made layout. A retry timer must not delay a new edit.
let syncPushTimerAt = 0;
let syncPushForce = false;
let syncPullTimer = 0;
let syncPushRunning = false;
let syncPushQueued = false;
let syncResetQueued = false;
let syncPullAttempts = 0;
let syncLastWakeAt = 0;
const syncDiag = {
  state: "idle",
  pushes: 0,
  pulls: 0,
  adopted: 0,
  route: SYNC_ROUTE,
  lastError: null,
};

function syncClient() {
  if (syncClientId) return syncClientId;
  syncClientId = Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  return syncClientId;
}

function readSyncMeta() {
  try {
    const raw = window.localStorage.getItem(SYNC_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch (err) {
    return {};
  }
}

function writeSyncMeta(meta) {
  try {
    window.localStorage.setItem(SYNC_KEY, JSON.stringify(meta));
  } catch (err) {
    /* storage may be unavailable */
  }
}

function syncMeta(overrides) {
  const current = readSyncMeta();
  return {
    updatedAt: Number(current.updatedAt) || 0,
    client: current.client || syncClient(),
    syncedAt: Number(current.syncedAt) || 0,
    ...(overrides || {}),
  };
}

function syncFailure(error) {
  syncDiag.state = "offline";
  syncDiag.lastError = String((error && error.message) || error || "sync failed");
}

// Called by every local mutation (storage.js). `options.user` marks a change the
// user made; only those are worth publishing, and only they flip the
// "customized" flag this whole merge rule hangs on.
function noteLocalChange(options) {
  const user = Boolean(options && options.user);
  if (user) markLayoutCustomized();
  syncDiag.state = syncDiag.state === "idle" ? "pending" : syncDiag.state;
  writeSyncMeta(syncMeta({ updatedAt: Date.now() }));
  if (options && options.reset === true) syncResetQueued = true;
  if ((user || syncResetQueued) && isCrossWindowEnabled()) scheduleHostPush(SYNC_PUSH_DELAY_MS);
}

function scheduleHostPush(delay, force) {
  const wait = typeof delay === "number" ? delay : SYNC_PUSH_DELAY_MS;
  const due = Date.now() + wait;
  if (syncPushTimer) {
    // A 5 s retry timer used to block every edit made during the outage, so a
    // new layout waited for the retry. Keep whichever fires first and remember
    // a force request so replacing the retry does not downgrade it.
    syncPushForce = syncPushForce || Boolean(force);
    if (syncPushTimerAt <= due) return;
    window.clearTimeout(syncPushTimer);
    syncPushTimer = 0;
  }
  syncPushForce = Boolean(force);
  syncPushTimerAt = due;
  syncPushTimer = window.setTimeout(() => {
    syncPushTimer = 0;
    syncPushTimerAt = 0;
    const forced = syncPushForce;
    syncPushForce = false;
    pushHostLayout(forced);
  }, wait);
}

async function pushHostLayout(force) {
  if (!isCrossWindowEnabled()) {
    syncResetQueued = false;
    syncDiag.state = "disabled";
    return;
  }
  if (syncPushRunning) {
    syncPushQueued = true;
    return;
  }
  const reset = syncResetQueued;
  if (!force && !reset && !isLayoutCustomized()) {
    // Nothing the user made here yet: do not publish the registered defaults.
    return;
  }
  syncPushRunning = true;
  syncResetQueued = false;
  const meta = readSyncMeta();
  const updatedAt = Number(meta.updatedAt) || Date.now();
  try {
    const response = await fetch(SYNC_ROUTE, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ layout: stateSnapshot(), updatedAt, reset }),
      cache: "no-store",
    });
    if (!response.ok) throw new Error("HTTP " + response.status);
    const body = await response.json();
    syncDiag.pushes += 1;
    syncDiag.state = "ready";
    syncDiag.lastError = null;
    const remoteAt = Number(body && body.updatedAt) || 0;
    if (body && body.layout && remoteAt > updatedAt) {
      // Another window wrote while this request was in flight; its copy wins.
      adoptHostLayout(body.layout, remoteAt);
      return;
    }
    writeSyncMeta(syncMeta({ updatedAt: remoteAt || updatedAt, syncedAt: Date.now() }));
  } catch (error) {
    syncFailure(error);
    syncResetQueued = syncResetQueued || reset;
    scheduleHostPush(SYNC_RETRY_MS);
  } finally {
    syncPushRunning = false;
    if (syncPushQueued) {
      syncPushQueued = false;
      scheduleHostPush(SYNC_PUSH_DELAY_MS);
    }
  }
}

async function pullHostLayout() {
  if (!isCrossWindowEnabled()) {
    syncDiag.state = "disabled";
    return false;
  }
  const meta = readSyncMeta();
  try {
    const response = await fetch(SYNC_ROUTE, {
      method: "GET",
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) throw new Error("HTTP " + response.status);
    const body = await response.json();
    syncDiag.pulls += 1;
    syncDiag.state = "ready";
    syncDiag.lastError = null;
    syncPullAttempts = 0;
    const remoteAt = Number(body && body.updatedAt) || 0;
    const localAt = Number(meta.updatedAt) || 0;

    if (!body || !body.layout || !hasLayoutContent(body.layout)) {
      // A host without a copy never overrides what this window already shows.
      syncDiag.state = isLayoutCustomized() ? "push-pending" : "empty-host";
      return false;
    }
    const customized = isLayoutCustomized();
    if (syncClaiming) {
      // This window holds a hand-made layout from before host sync existed;
      // publish it instead of letting a later copy from another window win.
      syncDiag.state = "local-newer";
      return false;
    }
    if (customized && remoteAt <= localAt && !syncForceAdopt) {
      syncDiag.state = "local-newer";
      return false;
    }
    return adoptHostLayout(body.layout, remoteAt);
  } catch (error) {
    syncFailure(error);
    if (syncPullAttempts < SYNC_PULL_RETRY_LIMIT) {
      // The host route may not be mounted yet while the app is still booting.
      const delay = 1000 * Math.pow(2, syncPullAttempts);
      syncPullAttempts += 1;
      if (syncPullTimer) window.clearTimeout(syncPullTimer);
      syncPullTimer = window.setTimeout(() => {
        syncPullTimer = 0;
        pullHostLayout();
      }, delay);
    }
    return false;
  }
}

function adoptHostLayout(snapshot, updatedAt) {
  if (!snapshot || typeof snapshot !== "object") return false;
  const state = normalizeLayoutState(snapshot);
  layoutCache = state;
  const serialized = JSON.stringify(state);
  try {
    window.localStorage.setItem(STORAGE_KEY, serialized);
    window.localStorage.setItem(LAYOUT_BACKUP_KEY, serialized);
  } catch (err) {
    /* keep the in-memory copy */
  }

  const source = snapshot.drag && typeof snapshot.drag === "object" && !Array.isArray(snapshot.drag) ? snapshot.drag : null;
  if (source) {
    const drag = {};
    for (const scope of SCOPE_KEYS) drag[scope] = source[scope] !== false;
    dragCache = drag;
    try {
      window.localStorage.setItem(DRAG_KEY, JSON.stringify(drag));
    } catch (err) {
      /* keep the in-memory copy */
    }
  }

  // The adopted order is a deliberate snapshot; the one-shot 0.5.4 migration
  // must not reorder it on the next projection pass.
  for (const scope of SCOPE_KEYS) markScopeRepaired(scope);
  // From now on this window holds a layout the user cares about, so a later
  // edit here is worth publishing.
  markLayoutCustomized();

  writeSyncMeta(syncMeta({ updatedAt: Number(updatedAt) || 0, syncedAt: Date.now() }));
  syncDiag.adopted += 1;
  syncDiag.state = "ready";
  if (runtimeInstance) {
    try {
      runtimeInstance.refresh();
    } catch (err) {
      /* the next pass still applies the new layout */
    }
  }
  return true;
}

function onSyncWake() {
  if (document.visibilityState === "hidden") return;
  const now = Date.now();
  if (now - syncLastWakeAt < SYNC_WAKE_THROTTLE_MS) return;
  syncLastWakeAt = now;
  pullHostLayout();
}

// Settings-page switch. Turning sharing off leaves the local layout untouched
// and simply stops talking to the host (the pre-0.7.2 behaviour); turning it
// back on adopts the host copy, or publishes this window's layout when the host
// has nothing yet.
function setCrossWindowEnabled(enabled) {
  const next = enabled !== false;
  writeCrossWindowEnabled(next);
  if (next) {
    syncDiag.state = "idle";
    syncForceAdopt = true;
    pullHostLayout().then((adopted) => {
      syncForceAdopt = false;
      if (!adopted && isLayoutCustomized()) scheduleHostPush(SYNC_PUSH_DELAY_MS);
    });
  } else {
    if (syncPushTimer) {
      window.clearTimeout(syncPushTimer);
      syncPushTimer = 0;
    }
    syncPushQueued = false;
    syncResetQueued = false;
    syncDiag.state = "disabled";
  }
  return next;
}

function startHostSync() {
  if (syncStarted) return;
  syncStarted = true;
  document.addEventListener("visibilitychange", onSyncWake);
  window.addEventListener("focus", onSyncWake);
  if (!isCrossWindowEnabled()) {
    syncDiag.state = "disabled";
    return;
  }
  // The first projection pass is queued on a frame; wait for it so the row
  // order the host registered is known before deciding whether this window
  // holds a hand-made layout (see layoutArrangedByUser).
  const begin = () => {
    const meta = readSyncMeta();
    // A window that never synced may still hold a hand-made layout: 0.7.1 and
    // older had nowhere else to put one, so its copy is the only surviving
    // record of that work. Such a layout differs from the host's own
    // registration order (a boot-time registration always matches it) and is
    // claimed, i.e. published instead of being overwritten by a copy another
    // window pushed while the host route was missing.
    const preSyncWork = !Number(meta.syncedAt) && typeof layoutArrangedByUser === "function" && layoutArrangedByUser();
    if (preSyncWork) {
      markLayoutCustomized();
      syncClaiming = true;
    }
    writeSyncMeta(syncMeta());
    pullHostLayout().then((adopted) => {
      syncClaiming = false;
      if (adopted) return;
      if (preSyncWork) {
        scheduleHostPush(SYNC_PUSH_DELAY_MS, true);
        return;
      }
      if (isLayoutCustomized()) scheduleHostPush(SYNC_PUSH_DELAY_MS);
    });
  };
  if (typeof requestAnimationFrame === "function") requestAnimationFrame(() => begin());
  else begin();
}

// Counterpart of startHostSync: a hot reload applies the plugin again into the
// same page, and the previous instance's wake listeners and retry timers must
// not survive it (they would pull/push a layout for a runtime that is gone).
function stopHostSync() {
  if (!syncStarted) return;
  syncStarted = false;
  document.removeEventListener("visibilitychange", onSyncWake);
  window.removeEventListener("focus", onSyncWake);
  if (syncPushTimer) {
    window.clearTimeout(syncPushTimer);
    syncPushTimer = 0;
  }
  syncPushTimerAt = 0;
  syncPushForce = false;
  if (syncPullTimer) {
    window.clearTimeout(syncPullTimer);
    syncPullTimer = 0;
  }
  syncPushQueued = false;
  syncResetQueued = false;
  syncPullAttempts = 0;
}


function syncStatus() {
  const meta = readSyncMeta();
  return {
    state: syncDiag.state,
    route: SYNC_ROUTE,
    enabled: isCrossWindowEnabled(),
    customized: isLayoutCustomized(),
    updatedAt: Number(meta.updatedAt) || 0,
    syncedAt: Number(meta.syncedAt) || 0,
    client: meta.client || "",
    pushes: syncDiag.pushes,
    pulls: syncDiag.pulls,
    adopted: syncDiag.adopted,
    lastError: syncDiag.lastError,
  };
}
