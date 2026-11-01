/**
 * dsh-modmenu — host half.
 *
 * Everything this plugin does happens in the browser. The client bundle
 * (`./client`) reads the sidebar's panel projection read-only and reorders the
 * rendered rows through inline CSS `order` (plus a long-press drag layer).
 * It never registers or mutates slots. The host half only needs to exist so the
 * bundle patch can load a package.
 */

export const name = "dsh-modmenu";

export const inject = [];

export function apply(ctx) {
  ctx.logger?.debug?.("[dsh-modmenu] client-only plugin loaded");
}
