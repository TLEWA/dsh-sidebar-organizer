/* Slot helpers: read registrations without ever writing to the host registry. */

function describeEntry(entry) {
  const options = entry && entry.options ? entry.options : entry || {};
  const id = typeof options.id === "string" ? options.id : null;
  let label = options.label;
  if (typeof label === "function") {
    try {
      label = label();
    } catch (err) {
      label = undefined;
    }
  }
  return { id, label: typeof label === "string" ? label : null };
}

function readEntries(ctx, slot) {
  try {
    const slots = ctx && ctx.slots;
    if (!slots || typeof slots.entriesOfSlot !== "function") return [];
    const entries = slots.entriesOfSlot(slot);
    return Array.isArray(entries) ? entries : [];
  } catch (err) {
    return [];
  }
}

function readPanelEntries(ctx) {
  return readEntries(ctx, PANEL_SLOT);
}
