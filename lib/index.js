/**
 * dsh-modmenu — host half.
 *
 * Everything this plugin does happens in the browser: the client bundle
 * (`./client`) re-registers the left sidebar's panel list so the rows can be
 * long-pressed, dragged, re-ordered, and toggled into/out of the "More" menu.
 * The host half only needs to exist so the bundle patch can load a package.
 */

export const name = "dsh-modmenu";

export const inject = [];

export function apply(ctx) {
  ctx.logger?.debug?.("[dsh-modmenu] client-only plugin loaded");
}
