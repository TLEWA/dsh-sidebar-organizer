/* Pure geometry for the right guide's card grid.

   The start page used to be a single column of full-width cells, so one
   vertical midpoint scan was enough. better-sidebar renders the same entries as
   a two-column grid: the reading order is row-major, and a pointer in the right
   column must not resolve to a gap in the left column. Keeping the math here
   (and out of createRuntime) lets the node test suite pin it with plain rects. */

function gridOrder(a, b) {
  const ar = a.rect;
  const br = b.rect;
  const rowA = Math.round(ar.top / 8);
  const rowB = Math.round(br.top / 8);
  if (rowA !== rowB) return ar.top - br.top;
  return ar.left - br.left;
}

// A two-column grid cannot use the 1-D midpoint scan: that compares y only,
// so the pointer in the right column still resolved to the left column's gap.
// Group the cards into visual rows, pick the row under the pointer, then pick
// the gap inside that row by x. The returned slot describes the line to draw:
// a vertical bar between two cards, or a horizontal bar above/below a row.
function gridIndexAt(items, x, y, allItems, columns) {
  if (!items.length) {
    const all = allItems && allItems.length ? allItems : items;
    const anchor = all.length ? all[0].rect : null;
    return {
      index: 0,
      slot: anchor ? { row: { top: anchor.top, bottom: anchor.bottom, items: [] }, before: null, horizontal: true } : null,
    };
  }
  const rows = [];
  for (const item of items.slice().sort((a, b) => a.rect.top - b.rect.top || a.rect.left - b.rect.left)) {
    const last = rows[rows.length - 1];
    if (last && Math.abs(item.rect.top - last.top) <= 8) {
      last.items.push(item);
      last.bottom = Math.max(last.bottom, item.rect.bottom);
    } else {
      rows.push({ top: item.rect.top, bottom: item.rect.bottom, items: [item] });
    }
  }
  for (const row of rows) row.items.sort((a, b) => a.rect.left - b.rect.left);
  // A partial last row must not get a full-width bar: the card would land in
  // that row, not below it. The caller passes the real track count; without it
  // the widest row is the best available hint.
  const widest = rows.reduce((max, row) => Math.max(max, row.items.length), 1);
  const columnCount = Math.max(1, Number(columns) || widest);
  if (y < rows[0].top) {
    const first = rows[0].items[0];
    return { index: items.indexOf(first), slot: { row: rows[0], before: first, horizontal: true } };
  }
  const lastRow = rows[rows.length - 1];
  if (y > lastRow.bottom) {
    return {
      index: items.length,
      slot: { row: lastRow, before: null, horizontal: lastRow.items.length >= columnCount },
    };
  }
  let target = null;
  for (const row of rows) {
    if (y >= row.top - 1 && y <= row.bottom + 1) {
      target = row;
      break;
    }
  }
  if (!target) {
    // The pointer sits in the gutter between two rows. Both neighbours name
    // the same insertion point; the nearer band owns the line.
    let best = Infinity;
    for (const row of rows) {
      const distance = y < row.top ? row.top - y : y - row.bottom;
      if (distance < best) {
        best = distance;
        target = row;
      }
    }
  }
  let before = null;
  for (const item of target.items) {
    if (x < item.rect.left + item.rect.width / 2) {
      before = item;
      break;
    }
  }
  if (before) {
    return {
      index: items.indexOf(before),
      slot: { row: target, before, horizontal: before === target.items[0] },
    };
  }
  const tail = target.items[target.items.length - 1];
  return {
    index: items.indexOf(tail) + 1,
    slot: { row: target, before: null, horizontal: target.items.length >= columnCount },
  };
}

// gridIndexAt() measures against the list it is given, which the drag code
// builds by removing the card under the finger. That index cannot be used as
// the final slot directly: with the card still in the list, a slot before
// target T is T's own index, not T's index after the removal. Convert the
// measured slot against the complete visual order so the preview line and the
// committed position always name the same cell.
function gridSlotIndex(items, slot) {
  if (!items || !items.length) return 0;
  if (slot && slot.before) {
    const before = items.findIndex((item) => item.id === slot.before.id);
    if (before !== -1) return before;
  }
  if (slot && slot.row && slot.row.items && slot.row.items.length) {
    const rowItems = slot.row.items;
    const tail = rowItems[rowItems.length - 1];
    const index = items.findIndex((item) => item.id === tail.id);
    if (index !== -1) return index + 1;
  }
  return 0;
}

// gridSlotIndex() names a cell of the complete visual order, and the drop commits
// that cell as the card's final index. How far that index may go depends on
// whether the dragged card is one of those cells: a card taken out of the grid
// leaves a hole, so the last legal slot is the one in front of the final card
// (index length - 1). A card dragged in from the tucked "More" menu never was in
// that order, so the grid it joins is one cell longer and the last legal slot is
// one past the final card, where a null beforeId appends. Clamping both cases to
// length - 1 used to save the wrong order: the line was drawn after the last
// card, but the card was inserted in front of it, and with a single visible card
// a restored card could only land at the very front.
function gridPlaceIndex(items, slot, hasSource) {
  const total = items && items.length ? items.length : 0;
  const limit = hasSource ? Math.max(0, total - 1) : total;
  return Math.max(0, Math.min(limit, gridSlotIndex(items, slot)));
}
