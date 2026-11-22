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

// The tucked shelf is the grid's own More popup, and better-sidebar renders it
// as a portal: it hangs outside the grid container yet usually floats over it.
// A plain grid hit test therefore reads a shelf row dragged onto its own menu as
// "put this card back in that cell". Decide the region before any grid math: a
// drag that started in the shelf belongs to the menu while the pointer stays on
// its rows, then to the More card, and only outside both is it a grid drop.
function gridDragRegion(boxes, source, x, y) {
  const inside = (rect, pad) => Boolean(rect)
    && x >= rect.left - pad && x <= rect.right + pad
    && y >= rect.top - pad && y <= rect.bottom + pad;
  if (source === "menu" && inside(boxes && boxes.menuRect, 0)) return "menu";
  if (inside(boxes && boxes.moreRect, 2)) return "more";
  if (inside(boxes && boxes.container, 10)) return "grid";
  return "outside";
}

// Reordering inside that shelf is the same 1-D midpoint scan the other menus
// use, kept pure so it can be pinned without a DOM. The source row leaves the
// insertion list but keeps its place in the geometry the gap is measured
// against, so the line lands in the real seam instead of across the row under
// the finger. A drop that would reinsert the row where it already sits is not a
// target at all: nothing changes and the line would cut through that row.
function tuckedMenuTarget(targets, id, y) {
  const list = (targets || []).slice().sort((a, b) => a.rect.top - b.rect.top);
  if (!list.length) return null;
  const others = list.filter((item) => item.id !== id);
  if (!others.length) return { index: 0, beforeId: null, boundary: list[0].rect.top };
  const middle = (rect) => rect.top + rect.height / 2;
  const next = others.find((item) => y < middle(item.rect)) || null;
  let index = others.length;
  let boundary;
  if (next) {
    index = others.indexOf(next);
    const at = list.indexOf(next);
    const previous = at > 0 ? list[at - 1].rect : null;
    boundary = previous ? (previous.bottom + next.rect.top) / 2 : next.rect.top;
  } else {
    const last = others[others.length - 1];
    const at = list.indexOf(last);
    const after = at >= 0 && at + 1 < list.length ? list[at + 1].rect : null;
    boundary = after ? (last.rect.bottom + after.top) / 2 : last.rect.bottom;
  }
  const source = list.find((item) => item.id === id);
  if (source && index === list.indexOf(source)) return null;
  return { index, beforeId: next ? next.id : null, boundary };
}

