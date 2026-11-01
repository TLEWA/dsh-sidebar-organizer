/* Read-only access to the sidebar panel slot projection. */

function describeEntry(entry) {
  const options = entry && entry.options ? entry.options : entry || {};
  const id = typeof options.id === "string" ? options.id : null;
  let label = options.label;
  if (typeof label === "function") {
    try {
      label = label();
    } catch (error) {
      label = undefined;
    }
  }
  return { id, label: typeof label === "string" ? label : null };
}

/** Read the slot projection once per pass; failure is non-fatal. */
function readPanelEntries(ctx) {
  try {
    const slots = ctx && ctx.slots;
    if (!slots || typeof slots.entriesOfSlot !== "function") return [];
    const entries = slots.entriesOfSlot(PANEL_SLOT);
    return Array.isArray(entries) ? entries : [];
  } catch (error) {
    return [];
  }
}
