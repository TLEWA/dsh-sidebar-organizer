/* Injected stylesheet. Kept as a string: the client bundle must load offline
   without extra network requests. */

const CSS = `
/* Host compatibility: the shipped right-guide ends with a spacer pseudo-element
   (.guide::after, flex: 0 10%) that must stay last to bias the list upward.
   Our rows carry explicit order values, so the spacer (order 0) would sort
   between the compass and the first card — opening a blank band that grows
   with the pane height. Pin it past every row we order. */
[data-sidebar-right-guide][data-sidebar-right-guide]::after {
  order: 2147483647;
}

.dso-ghost {
  position: fixed !important;
  margin: 0 !important;
  box-sizing: border-box;
  pointer-events: none;
  z-index: ${GHOST_Z};
  opacity: 0.96;
  border-radius: var(--dsw-radius-md, 6px);
  background: var(--dsw-specific-sidebar-fill, rgba(24, 24, 27, 0.92));
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.28), 0 2px 6px rgba(0, 0, 0, 0.16);
  transform: scale(1.03);
}
/* Glyph-only rows (session-header icons) have no surface to lift: painting the
   sidebar fill made the 28px drag preview a black rounded tile. Keep the glyph
   and the drop feedback, drop the fabricated card and its shadow. */
.dso-ghost.dso-ghost-flat {
  background: transparent !important;
  box-shadow: none !important;
}
.dso-indicator {
  position: fixed;
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  border-radius: 2px;
  background: var(--dsw-alias-state-business-primary, #4d6bfe);
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.06);
  pointer-events: none;
  z-index: ${GHOST_Z};
  opacity: 0;
  transition: opacity 120ms ease;
}
.dso-indicator[data-visible="1"] { opacity: 1; }
/* The drag source always stays in the layout as a dimmed placeholder: the row
   in the sidebar and the row inside the "More" popup must both read as "the
   thing I am moving is still here". */
[data-dso-key].dso-dragging,
.dso-menu-item.dso-dragging { opacity: 0.35; }
[data-dso-key] { -webkit-user-select: none; user-select: none; }
/* The "More" anchor, armed: it breathes a ring and shrinks as a whole (icon and
   label together) to read as "release here and this row drops into me". */
.dso-drop-more {
  outline: 2px dashed var(--dsw-alias-state-business-primary, #4d6bfe);
  outline-offset: -2px;
  background: var(--dsw-alias-interactive-bg-hover, rgba(255, 255, 255, 0.08));
  transform: scale(0.94);
  transition: transform 160ms ease;
  animation: dso-more-breathe 1100ms ease-in-out infinite;
}
@keyframes dso-more-breathe {
  0%, 100% { box-shadow: 0 0 0 0 rgba(77, 107, 254, 0.38); }
  55% { box-shadow: 0 0 0 8px rgba(77, 107, 254, 0); }
  100% { box-shadow: 0 0 0 0 rgba(77, 107, 254, 0); }
}
@keyframes dso-more-receive {
  0% { transform: scale(1); }
  35% { transform: scale(0.86); }
  70% { transform: scale(1.06); }
  100% { transform: scale(1); }
}
.dso-drop-receive { animation: dso-more-receive 260ms cubic-bezier(0.2, 0.7, 0.3, 1); }
@keyframes dso-drop-reject {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-4px); }
  40% { transform: translateX(4px); }
  60% { transform: translateX(-3px); }
  80% { transform: translateX(2px); }
}
.dso-drop-reject { animation: dso-drop-reject 240ms ease; }
/* Carrying a row towards the anchor: the ghost dims and shrinks a little, so
   its eventual absorption does not feel like a jump. */
.dso-ghost.dso-ghost-armed {
  opacity: 0.82;
  transform: scale(0.94);
  transition: transform 140ms ease, opacity 140ms ease;
}
@media (prefers-reduced-motion: reduce) {
  .dso-drop-more,
  .dso-drop-receive,
  .dso-drop-reject { animation: none !important; }
  .dso-drop-more { transform: none !important; transition: none !important; }
  .dso-ghost,
  .dso-ghost.dso-ghost-armed { transition: none !important; }
}
body.dso-dragging,
body.dso-dragging * { cursor: grabbing !important; }
/* While a drag is in flight the rows under the pointer must not react at all:
   no :hover highlight, no tooltip. Hit-testing is done from rects, not events. */
body.dso-dragging [data-dso-key],
body.dso-dragging [data-dso-more-key] { pointer-events: none !important; }
body.dso-dragging [data-dso-key]:hover { background: transparent !important; }

/* rows appended to the shipped "More" menu */
.dso-menu-caption {
  padding: 6px 10px 2px;
  font-size: 12px;
  line-height: 18px;
  color: var(--dsw-alias-label-secondary, rgba(235, 235, 245, 0.6));
  -webkit-user-select: none;
  user-select: none;
}
.dso-menu-item { display: block; }
/* Rows injected into the shipped "More actions" menu of the session header.
   Kept on the same 32px row metrics as the native items so the menu does not
   grow a seam; the caption uses the same quiet styling as every other shelf. */
.dso-header-tucked { display: block; padding: 2px 0 2px; }
.dso-header-tucked .dso-menu-caption { padding-top: 2px; }
/* Shortcut buttons for shipped-menu actions pulled onto the header strip. They
   must look like the host's 28px icon buttons, not like our menu rows. */
.dso-host-action {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
}
.dso-host-action:hover { background: var(--dsw-alias-bg-layer-hover, rgba(255, 255, 255, 0.08)); }
.dso-host-action svg { width: 16px; height: 16px; }
.dso-host-action-text {
  max-width: 56px;
  overflow: hidden;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
/* Kept in the layout (so the menu does not jump) and dimmed like a sidebar
   row; the placeholder rule above owns the opacity. */
/* icon wrapper handed to MenuItemButton: same 16px footprint as the shipped rows */
.dso-menu-icon {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  overflow: hidden;
  color: inherit;
}
.dso-menu-icon svg,
.dso-menu-row svg {
  width: 16px;
  height: 16px;
  flex: none;
  display: block;
}
/* the styled fallback row, used only when the primitives package is missing */
.dso-menu-row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-height: 32px;
  margin: 0;
  padding: 6px 10px;
  border: none;
  border-radius: var(--dsw-radius-md, 6px);
  background: transparent;
  color: var(--dsw-alias-label-primary, #ebebf5);
  font: inherit;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
}
.dso-menu-row:hover,
.dso-menu-row:focus-visible {
  background: var(--dsw-alias-interactive-bg-hover, rgba(255, 255, 255, 0.08));
}
.dso-menu-row:focus-visible {
  outline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary, #4d6bfe));
}
.dso-menu-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Settings navigation: the organizer injects a "More" row at the end and a
   popup that lists tucked settings entries. Geometry mirrors the host nav cells
   (40px tall, 12px radius) without relying on hashed host class names. */
.dso-settings-more {
  display: flex;
  align-items: center;
  gap: 8px;
  box-sizing: border-box;
  width: 100%;
  height: 40px;
  margin: 0;
  padding: 9px 12px;
  border: none;
  border-radius: 12px;
  background: transparent;
  color: var(--dsw-alias-label-secondary, rgba(235, 235, 245, 0.62));
  font: inherit;
  font-size: 14px;
  text-align: left;
  cursor: pointer;
}
.dso-settings-more:hover,
.dso-settings-more:focus-visible {
  background: var(--dsw-alias-interactive-bg-hover, rgba(255, 255, 255, 0.08));
  color: var(--dsw-alias-label-primary, #ebebf5);
}
.dso-settings-more:focus-visible {
  outline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary, #4d6bfe));
}
.dso-settings-more-menu {
  position: fixed;
  z-index: 2147482600;
  box-sizing: border-box;
  max-height: 320px;
  overflow: auto;
  padding: 4px;
  border: 1px solid var(--dsw-alias-border-secondary, rgba(255, 255, 255, 0.1));
  border-radius: 10px;
  background: var(--dsw-specific-sidebar-fill, rgba(24, 24, 27, 0.98));
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.24), 0 2px 8px rgba(0, 0, 0, 0.16);
}
.dso-settings-more-item {
  display: flex;
  align-items: center;
  box-sizing: border-box;
  width: 100%;
  min-height: 34px;
  margin: 0;
  padding: 6px 10px;
  border: none;
  border-radius: 7px;
  background: transparent;
  color: var(--dsw-alias-label-primary, #ebebf5);
  font: inherit;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
}
.dso-settings-more-item:hover,
.dso-settings-more-item:focus-visible {
  background: var(--dsw-alias-interactive-bg-hover, rgba(255, 255, 255, 0.08));
}
.dso-settings-more-item:focus-visible {
  outline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary, #4d6bfe));
}

/* Settings page / plugin-detail page */
.dso-config {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
  max-width: 760px;
  padding: 4px 0 28px;
  color: var(--dsw-alias-label-primary, #ebebf5);
  font-size: 13px;
  box-sizing: border-box;
}
.dso-config * { box-sizing: border-box; }
.dso-config-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 30px;
}
.dso-config-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 2px;
  margin-left: auto;
}
.dso-config-notice {
  margin: -8px 0 -6px;
  font-size: 12px;
  line-height: 18px;
  color: var(--dsw-alias-label-secondary, rgba(235, 235, 245, 0.62));
}
.dso-config-notice[data-tone="ok"] {
  color: var(--dsw-alias-state-success-primary, #3fb950);
}
.dso-config-notice[data-tone="error"] {
  color: var(--dsw-alias-state-error-primary, #f85149);
}
.dso-config-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  line-height: 22px;
}
.dso-config-card {
  border: 1px solid var(--dsw-alias-border-secondary, rgba(255, 255, 255, 0.1));
  border-radius: 10px;
  background: var(--dsw-alias-bg-secondary, rgba(255, 255, 255, 0.025));
  overflow: hidden;
}
.dso-config-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 12px;
  background: var(--dsw-alias-bg-tertiary, rgba(255, 255, 255, 0.035));
  border-bottom: 1px solid var(--dsw-alias-border-secondary, rgba(255, 255, 255, 0.08));
}
.dso-config-card-heading {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.dso-config-card-title {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  line-height: 18px;
  color: var(--dsw-alias-label-primary, #ebebf5);
}
.dso-config-switch {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 6px;
  margin: 0;
  padding: 1px 0;
  border: none;
  background: transparent;
  color: var(--dsw-alias-label-secondary, rgba(235, 235, 245, 0.62));
  font: inherit;
  font-size: 11px;
  line-height: 16px;
  cursor: pointer;
  border-radius: 4px;
}
.dso-config-switch:hover,
.dso-config-switch:focus-visible { color: var(--dsw-alias-label-primary, #ebebf5); }
.dso-config-switch:focus-visible {
  outline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary, #4d6bfe));
  outline-offset: 2px;
}
.dso-config-switch-track {
  position: relative;
  display: inline-block;
  width: 22px;
  height: 13px;
  flex: none;
  border-radius: 999px;
  background: var(--dsw-alias-border-secondary, rgba(255, 255, 255, 0.16));
  transition: background 120ms ease;
}
.dso-config-switch-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--dsw-alias-label-secondary, rgba(235, 235, 245, 0.72));
  transition: transform 120ms ease, background 120ms ease;
}
.dso-config-switch.is-on .dso-config-switch-track {
  background: var(--dsw-alias-state-business-primary, #4d6bfe);
}
.dso-config-switch.is-on .dso-config-switch-thumb {
  transform: translateX(9px);
  background: #fff;
}
.dso-config-reset,
.dso-config-action {
  flex: none;
  border: none;
  background: transparent;
  padding: 2px 4px;
  color: var(--dsw-alias-label-secondary, rgba(235, 235, 245, 0.62));
  font: inherit;
  font-size: 12px;
  line-height: 18px;
  cursor: pointer;
  border-radius: 4px;
}
.dso-config-reset:hover,
.dso-config-reset:focus-visible,
.dso-config-action:hover,
.dso-config-action:focus-visible {
  color: var(--dsw-alias-label-primary, #ebebf5);
  background: var(--dsw-alias-interactive-bg-hover, rgba(255, 255, 255, 0.08));
}
.dso-config-reset:focus-visible,
.dso-config-action:focus-visible {
  outline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary, #4d6bfe));
  outline-offset: 1px;
}
.dso-config-list { display: flex; flex-direction: column; }
.dso-config-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 34px;
  padding: 4px 8px 4px 10px;
  background: transparent;
  transition: background 120ms ease;
}
.dso-config-row + .dso-config-row {
  border-top: 1px solid var(--dsw-alias-border-secondary, rgba(255, 255, 255, 0.06));
}
.dso-config-row:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(255, 255, 255, 0.05)); }
.dso-config-row.is-hidden { opacity: 0.62; }
.dso-config-row.is-drop {
  box-shadow: inset 0 2px 0 var(--dsw-alias-state-business-primary, #4d6bfe);
}
.dso-config-grip {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 20px;
  color: var(--dsw-alias-label-tertiary, rgba(235, 235, 245, 0.38));
  cursor: grab;
}
.dso-config-grip.is-pinned,
.dso-config-grip.is-fixed { cursor: default; opacity: 0.4; }
.dso-config-row:active .dso-config-grip { cursor: grabbing; }
.dso-config-label {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 20px;
}
.dso-config-chip {
  flex: none;
  padding: 0 6px;
  border-radius: 999px;
  background: var(--dsw-alias-bg-tertiary, rgba(255, 255, 255, 0.06));
  color: var(--dsw-alias-label-secondary, rgba(235, 235, 245, 0.62));
  font-size: 11px;
  line-height: 18px;
}
.dso-config-btn {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--dsw-alias-label-secondary, rgba(235, 235, 245, 0.62));
  cursor: pointer;
}
.dso-config-btn:hover,
.dso-config-btn:focus-visible {
  color: var(--dsw-alias-label-primary, #ebebf5);
  background: var(--dsw-alias-interactive-bg-hover, rgba(255, 255, 255, 0.08));
}
.dso-config-btn:focus-visible {
  outline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary, #4d6bfe));
  outline-offset: 1px;
}
.dso-config-btn:disabled { opacity: 0.3; cursor: default; background: transparent; }
.dso-config-empty {
  padding: 12px;
  color: var(--dsw-alias-label-secondary, rgba(235, 235, 245, 0.5));
  font-size: 12px;
  line-height: 18px;
}
`;
