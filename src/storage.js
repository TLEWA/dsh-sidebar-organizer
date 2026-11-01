/* Layout persistence (localStorage) with an in-memory cache. */

let layoutCache = null;

function readLayout() {
  if (layoutCache) return layoutCache;
  try {
    let raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // one-time migration from the plugin's pre-rename key
      const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacy) {
        raw = legacy;
        try {
          window.localStorage.setItem(STORAGE_KEY, legacy);
        } catch (error) {
          /* keep using the legacy value in memory if the write is refused */
        }
      }
    }
    if (!raw) {
      layoutCache = { order: [], hidden: [] };
      return layoutCache;
    }
    const parsed = JSON.parse(raw);
    const order = Array.isArray(parsed && parsed.order)
      ? parsed.order.filter((key) => typeof key === "string")
      : [];
    const hidden = Array.isArray(parsed && parsed.hidden)
      ? parsed.hidden.filter((key) => typeof key === "string")
      : [];
    layoutCache = { order, hidden };
    return layoutCache;
  } catch (error) {
    layoutCache = { order: [], hidden: [] };
    return layoutCache;
  }
}

function forgetLayout() {
  layoutCache = null;
}

function writeLayout(layout) {
  layoutCache = { order: layout.order.slice(), hidden: layout.hidden.slice() };
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 2,
        order: layout.order,
        hidden: layout.hidden,
      })
    );
  } catch (error) {
    /* storage may be unavailable; the layout then only lasts for this page */
  }
}

function isSameOrder(a, b) {
  if (a.length !== b.length) return false;
  for (let index = 0; index < a.length; index += 1) {
    if (a[index] !== b[index]) return false;
  }
  return true;
}

function setOrder(element, value) {
  if (!element) return;
  if (element.style.order !== value) element.style.order = value;
}
