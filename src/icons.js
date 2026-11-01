/* Icon markup helpers: serialize a rendered glyph and scope its element ids so
   that references like url(#mask) keep pointing at the copy inside the menu. */

let iconSeq = 0;

/**
 * Give every id inside a serialised <svg> a fresh prefix (including url(#…)
 * and href="#…" references). Icons such as dsh-context's draw themselves with
 * a per-instance <mask id>; reusing the original id made the copy resolve
 * `url(#…)` to the mask that lives inside the *hidden* original row, so the
 * menu icon came out blank.
 */
function scopeMarkupIds(markup, prefix) {
  const ids = [];
  const re = /\bid="([^"]+)"/g;
  let match;
  while ((match = re.exec(markup)) !== null) ids.push(match[1]);
  let out = markup;
  for (const id of ids) {
    const next = `${prefix}-${id}`;
    out = out.split(`id="${id}"`).join(`id="${next}"`);
    out = out.split(`url(#${id})`).join(`url(#${next})`);
    out = out.split(`href="#${id}"`).join(`href="#${next}"`);
  }
  return out;
}
