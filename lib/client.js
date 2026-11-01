/**
 * dsh-modmenu — client half.
 *
 * The left sidebar renders its panel list from the `sidebar.panellist` slot:
 * every registrant owns one cell (one icon button) and the rendered order comes
 * from that entry's `order`, while the sidebar owns the button itself. To make
 * those buttons draggable we shadow each cell at a lower priority (the slots
 * contract documents "register at a different priority to shadow it (lowest
 * renders)") and put a thin wrapper around the original icon component. The
 * wrapper receives the exact same props as the original entry, forwards them
 * verbatim, and tags the enclosing `button.panelRow` with the panel id so the
 * drag layer can identify rows without guessing at another plugin's DOM.
 *
 * Everything else here is plain DOM gesture handling: long press, ghost,
 * drop indicator, and persisting the user's layout to localStorage.
 */

window.__ModuleLoader__.load({
	id: "dsh-modmenu",
	factory: (require) => {
		"use strict";

		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

		const React = require("react");
		const primitives = require("@deepseek-ai/dsh-client-ui-primitives");

		/** Locale namespace owned by this plugin. */
		const NS = "modmenu";
		/** Registrant stamp used to tell our shadow entries from the originals. */
		const REGISTRANT = "dsh-modmenu";
		const PANEL_SLOT = "sidebar.panellist";
		const ACTIONS_SLOT = "sidebar.panellist.actions";
		/** localStorage record holding the user's custom layout. */
		const STORAGE_KEY = "dsh.modmenu.layout.v1";
		/** The plugin-manager panel is the way back into plugin management; never hideable. */
		const FIXED_PANEL = "plugins";
		/** Long press before a press turns into a drag. */
		const LONG_PRESS_MS = 300;
		/** Movement (px) that cancels a pending long press — keeps plain clicks/scrolls working. */
		const MOVE_TOLERANCE = 10;
		/** Window (ms) in which the click that follows a drop is swallowed. */
		const CLICK_GUARD_MS = 500;
		/** Above every shell layer, including portaled menus. */
		const OVERLAY_Z = 2147483000;

		const en = {
			hint: "Press and hold a panel icon to reorder it. Drop it on More to hide it there.",
			hidden: "Hidden panels",
			reset: "Reset panel order",
		};
		const zh = {
			hint: "长按面板图标可拖动排序，拖到「更多」上即可收起。",
			hidden: "已收起的面板",
			reset: "恢复默认排序",
		};

		const CSS = [
			".modmenu-anchor{display:contents}",
			'button.panelRow[data-modmenu-hidden="1"]{display:none!important}',
			'nav > *:has(> button.panelRow[data-modmenu-hidden="1"]){display:none!important}',
			"body.modmenu-drag-active{cursor:grabbing;-webkit-user-select:none;user-select:none}",
			"body.modmenu-drag-active *{cursor:grabbing!important}",
			".modmenu-ghost{position:fixed;z-index:" + OVERLAY_Z + ";box-sizing:border-box;pointer-events:none;overflow:hidden;" +
				"border-radius:var(--dsw-radius-md,8px);background:var(--dsw-alias-button-elevated-fill,#2b2b2b);" +
				"box-shadow:0 10px 28px rgba(0,0,0,.32),0 0 0 1px var(--dsw-alias-border-l3,rgba(255,255,255,.12));opacity:.97}",
			".modmenu-indicator{position:fixed;z-index:" + OVERLAY_Z + ";height:2px;border-radius:2px;pointer-events:none;" +
				"background:var(--dsw-alias-state-business-primary,#4d6bfe)}",
			"button.panelRow.modmenu-drop-more{background:var(--dsw-alias-interactive-bg-hover)!important;" +
				"outline:2px dashed var(--dsw-alias-state-business-primary,#4d6bfe);outline-offset:-2px}",
			".modmenu-more-item{display:contents}",
			".modmenu-more-caption{padding:6px 12px 2px;font-size:11px;line-height:16px;color:var(--dsw-alias-label-secondary,#8a8a8a)}",
			".modmenu-more-hint{padding:2px 12px 8px;font-size:11px;line-height:16px;color:var(--dsw-alias-label-secondary,#8a8a8a)}",
			".modmenu-menu-row{display:flex;box-sizing:border-box;width:100%;align-items:center;gap:8px;padding:6px 10px;" +
				"border:0;border-radius:6px;background:none;color:var(--dsw-alias-label-primary,inherit);font:inherit;" +
				"line-height:20px;text-align:left;cursor:pointer}",
			".modmenu-menu-row:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.08))}",
			".modmenu-menu-row svg{flex:none}",
		].join("\n");

		// ------------------------------------------------------------------
		// small helpers
		// ------------------------------------------------------------------

		function readLayout() {
			try {
				const raw = window.localStorage.getItem(STORAGE_KEY);
				if (!raw) return { order: [], hidden: [] };
				const parsed = JSON.parse(raw);
				const strings = (value) => (Array.isArray(value) ? value.filter((item) => typeof item === "string") : []);
				return { order: strings(parsed?.order), hidden: strings(parsed?.hidden) };
			} catch (error) {
				console.warn("[dsh-modmenu] cannot read the saved layout:", error);
				return { order: [], hidden: [] };
			}
		}

		function writeLayout(layout) {
			try {
				window.localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
			} catch (error) {
				console.warn("[dsh-modmenu] cannot persist the layout:", error);
			}
		}

		/** Install the stylesheet once; the returned function removes the tag. */
		function ensureStyles() {
			const tagId = "dsh-modmenu/panel-drag.css";
			const selector = 'style[data-plugin-css="' + tagId + '"]';
			const existing = document.querySelector(selector);
			if (existing) return () => existing.remove();
			const tag = document.createElement("style");
			tag.dataset.plugin = NS;
			tag.dataset.pluginCss = tagId;
			tag.textContent = CSS;
			document.head.appendChild(tag);
			return () => tag.remove();
		}

		/** Fallback row used only if the primitives bundle stops exporting MenuItemButton. */
		function FallbackMenuRow(props) {
			return React.createElement(
				"button",
				{ type: "button", className: "modmenu-menu-row", onClick: props.onSelect },
				props.icon ? React.createElement("span", { className: "modmenu-anchor" }, props.icon) : null,
				React.createElement("span", null, props.children),
			);
		}

		const MenuRow = primitives && typeof primitives.MenuItemButton === "function" ? primitives.MenuItemButton : FallbackMenuRow;

		// ------------------------------------------------------------------
		// controller: owns the layout, the shadow registrations and the More rows
		// ------------------------------------------------------------------

		function createController(ctx, fallbackT) {
			const layout = readLayout();
			/** id -> { component, label, locale, inject, baseOrder, rev } of the original cell owners. */
			const originals = new Map();
			/** id -> disposer of our shadow registration. */
			const overrides = new Map();
			let appliedSignature = "";
			let revision = 0;
			let applying = false;
			let menuDismiss = null;

			function isHidden(id) {
				return layout.hidden.includes(id);
			}

			function visibleIds() {
				return layout.order.filter((id) => !isHidden(id));
			}

			function originalOf(id) {
				return originals.get(id);
			}

			function labelOf(id) {
				const original = originals.get(id);
				const label = original ? original.label : id;
				try {
					return typeof label === "function" ? label() : label ?? id;
				} catch (error) {
					return id;
				}
			}

			function hiddenIds() {
				return layout.order.filter((id) => isHidden(id));
			}

			/** Rendered order the sidebar would use without our overrides. */
			function defaultOrder() {
				const ids = [];
				for (const entry of ctx.slots.entries(PANEL_SLOT)) {
					const options = entry.options || {};
					if (!options.id || options.registrant === REGISTRANT) continue;
					if (!originals.has(options.id) || ids.includes(options.id)) continue;
					ids.push(options.id);
				}
				return ids;
			}

			function isCustomized() {
				if (layout.hidden.length > 0) return true;
				const visible = visibleIds();
				const defaults = defaultOrder();
				if (visible.length !== defaults.length) return true;
				return visible.some((id, index) => defaults[index] !== id);
			}

			function collectOriginals() {
				const next = new Map();
				for (const entry of ctx.slots.entries(PANEL_SLOT)) {
					const options = entry.options || {};
					const id = options.id;
					if (!id || options.registrant === REGISTRANT) continue;
					// Raw entries are sorted by (priority, order): the first hit per id is the
					// current winner of that cell, i.e. the component actually being rendered.
					if (next.has(id)) continue;
					const previous = originals.get(id);
					const unchanged = previous
						&& previous.component === entry.component
						&& previous.label === options.label
						&& previous.locale === options.locale
						&& previous.inject === options.inject;
					next.set(id, {
						component: entry.component,
						label: options.label,
						locale: options.locale,
						inject: options.inject,
						baseOrder: options.order ?? 0,
						rev: unchanged ? previous.rev : ++revision,
					});
				}
				originals.clear();
				for (const [id, value] of next) originals.set(id, value);
			}

			/** Drop stale ids, append panels that registered after the layout was saved. */
			function normalizeLayout() {
				const known = new Set(originals.keys());
				const ordered = layout.order.filter((id) => known.has(id));
				const knownOrder = defaultOrder();
				for (const id of knownOrder) {
					if (!ordered.includes(id)) ordered.push(id);
				}
				const hidden = layout.hidden.filter((id) => known.has(id) && id !== FIXED_PANEL);
				const changed = ordered.length !== layout.order.length
					|| ordered.some((id, index) => layout.order[index] !== id)
					|| hidden.length !== layout.hidden.length
					|| hidden.some((id, index) => layout.hidden[index] !== id);
				layout.order = ordered;
				layout.hidden = hidden;
				if (changed) writeLayout(layout);
			}

			function layoutSignature() {
				return JSON.stringify({
					order: layout.order,
					hidden: layout.hidden,
					revs: layout.order.map((id) => [id, originals.get(id)?.rev ?? -1]),
				});
			}

			/** Lowest priority currently used by *other* registrants per id. */
			function priorityFloors() {
				const floors = new Map();
				for (const entry of ctx.slots.entries(PANEL_SLOT)) {
					const options = entry.options || {};
					const id = options.id;
					if (!id || options.registrant === REGISTRANT) continue;
					const priority = options.priority ?? 0;
					const current = floors.get(id);
					floors.set(id, current === undefined ? priority : Math.min(current, priority));
				}
				return floors;
			}

			/** Wrap the original icon so its row can be identified and animated. */
			function makePanelWrapper(id, Original) {
				function ModmenuPanel(props) {
					const anchorRef = React.useRef(null);
					React.useEffect(() => {
						const node = anchorRef.current;
						const row = node ? node.closest("button.panelRow") : null;
						if (!row) return undefined;
						row.dataset.modmenuId = id;
						if (isHidden(id)) row.dataset.modmenuHidden = "1";
						else delete row.dataset.modmenuHidden;
						return () => {
							if (row.dataset.modmenuId === id) delete row.dataset.modmenuId;
							delete row.dataset.modmenuHidden;
						};
					});
					return React.createElement(
						"span",
						{ ref: anchorRef, className: "modmenu-anchor" },
						React.createElement(Original, props),
					);
				}
				ModmenuPanel.displayName = "ModmenuPanel(" + id + ")";
				return ModmenuPanel;
			}

			/** Replace (or refresh) our shadow registrations when the desired layout changed. */
			function applyRegistrations() {
				if (applying) return;
				const signature = layoutSignature();
				if (signature === appliedSignature) return;
				applying = true;
				try {
					for (const dispose of overrides.values()) {
						try {
							dispose();
						} catch (error) {
							console.warn("[dsh-modmenu] panel dispose failed:", error);
						}
					}
					overrides.clear();
					const floors = priorityFloors();
					layout.order.forEach((id, index) => {
						const original = originals.get(id);
						if (!original) return;
						const options = {
							name: PANEL_SLOT,
							id,
							order: (index + 1) * 10,
							priority: (floors.get(id) ?? 0) - 1,
							label: original.label === undefined ? id : original.label,
							registrant: REGISTRANT,
						};
						if (original.locale !== undefined) options.locale = original.locale;
						if (original.inject !== undefined) options.inject = original.inject;
						try {
							overrides.set(id, ctx.slots.register(options, makePanelWrapper(id, original.component)));
						} catch (error) {
							console.error('[dsh-modmenu] cannot take over panel "' + id + '":', error);
						}
					});
				} finally {
					applying = false;
					appliedSignature = signature;
				}
			}

			function sync() {
				try {
					collectOriginals();
					normalizeLayout();
					applyRegistrations();
				} catch (error) {
					console.error("[dsh-modmenu] layout sync failed:", error);
				}
			}

			function applyLayout(visible) {
				const hidden = layout.order.filter((id) => isHidden(id));
				layout.order = visible.concat(hidden);
				writeLayout(layout);
				applyRegistrations();
			}

			/** Move a visible panel to `index` among the other visible panels. */
			function place(id, index) {
				const visible = visibleIds();
				const from = visible.indexOf(id);
				if (from < 0) return;
				visible.splice(from, 1);
				const to = Math.max(0, Math.min(index, visible.length));
				visible.splice(to, 0, id);
				applyLayout(visible);
			}

			/** Move a panel into the More menu. */
			function hide(id) {
				if (id === FIXED_PANEL || isHidden(id)) return;
				layout.hidden = layout.hidden.concat([id]);
				applyLayout(visibleIds());
			}

			/** Bring a hidden panel back into the list at `index`. */
			function reveal(id, index) {
				if (!isHidden(id)) return;
				layout.hidden = layout.hidden.filter((item) => item !== id);
				const visible = visibleIds().filter((item) => item !== id);
				const to = Math.max(0, Math.min(index, visible.length));
				visible.splice(to, 0, id);
				applyLayout(visible);
			}

			function reset() {
				layout.order = defaultOrder();
				layout.hidden = [];
				writeLayout(layout);
				applyRegistrations();
			}

			function setMenuDismiss(handler) {
				menuDismiss = typeof handler === "function" ? handler : null;
			}

			function dismissMenu() {
				const handler = menuDismiss;
				if (!handler) return;
				try {
					handler();
				} catch (error) {
					console.warn("[dsh-modmenu] cannot close the More menu:", error);
				}
			}

			function attachPanels() {
				sync();
				const unsubscribe = ctx.slots.subscribe(PANEL_SLOT, sync);
				return () => {
					unsubscribe();
					for (const dispose of overrides.values()) {
						try {
							dispose();
						} catch (error) {
							console.warn("[dsh-modmenu] panel dispose failed:", error);
						}
					}
					overrides.clear();
					appliedSignature = "";
				};
			}

			function MoreMenuContent(props) {
				const t = typeof props.t === "function" ? props.t : fallbackT;
				const hidden = hiddenIds();
				const customized = isCustomized();
				const nodes = [];

				React.useEffect(() => {
					setMenuDismiss(props.onDismiss);
					return () => setMenuDismiss(null);
				}, [props.onDismiss]);

				if (hidden.length > 0) {
					nodes.push(React.createElement("div", { key: "modmenu-caption", className: "modmenu-more-caption" }, t("hidden")));
					for (const id of hidden) {
						const original = originals.get(id);
						if (!original) continue;
						nodes.push(React.createElement(
							"div",
							{ key: id, className: "modmenu-more-item", "data-modmenu-more-id": id },
							React.createElement(
								MenuRow,
								{
									icon: React.createElement(original.component, { size: 16 }),
									onSelect: () => {
										if (typeof props.onDismiss === "function") props.onDismiss();
										if (typeof props.onOpen === "function") props.onOpen(id);
									},
								},
								labelOf(id),
							),
						));
					}
				}

				nodes.push(React.createElement("div", { key: "modmenu-hint", className: "modmenu-more-hint" }, t("hint")));

				if (customized) {
					nodes.push(React.createElement(
						MenuRow,
						{
							key: "modmenu-reset",
							separatorBefore: true,
							onSelect: () => {
								if (typeof props.onDismiss === "function") props.onDismiss();
								reset();
							},
						},
						t("reset"),
					));
				}

				return React.createElement(React.Fragment, null, nodes);
			}

			function attachActions() {
				return ctx.slots.register({
					name: ACTIONS_SLOT,
					id: "modmenu-organizer",
					order: -10,
					locale: NS,
					registrant: REGISTRANT,
				}, MoreMenuContent);
			}

			return {
				attachPanels,
				attachActions,
				isHidden,
				place,
				hide,
				reveal,
				reset,
				dismissMenu,
			};
		}

		// ------------------------------------------------------------------
		// drag layer: long press → ghost + drop indicator → commit
		// ------------------------------------------------------------------

		function createDragger(controller) {
			const state = { pending: null, active: null };
			let suppressClickUntil = 0;
			let gesturesBound = false;

			function isElement(value) {
				return typeof Element !== "undefined" && value instanceof Element;
			}

			/** The nav that owns the panel list (the right sidebar has its own nav). */
			function panelNav() {
				const row = document.querySelector("button.panelRow[data-modmenu-id]");
				if (row) {
					const nav = row.closest("nav");
					if (nav) return nav;
					return row.parentElement;
				}
				return null;
			}

			function stripDragMarkers(node) {
				node.removeAttribute("data-modmenu-id");
				node.removeAttribute("data-modmenu-more-id");
				node.removeAttribute("aria-current");
				for (const child of node.querySelectorAll("[data-modmenu-id],[data-modmenu-more-id],[id]")) {
					child.removeAttribute("data-modmenu-id");
					child.removeAttribute("data-modmenu-more-id");
					child.removeAttribute("id");
				}
			}

			function moveGhost(event) {
				const active = state.active;
				if (!active) return;
				active.x = event.clientX;
				active.y = event.clientY;
				active.ghost.style.left = (event.clientX - active.offsetX) + "px";
				active.ghost.style.top = (event.clientY - active.offsetY) + "px";
			}

			function updateTarget(event) {
				const active = state.active;
				const nav = active ? active.nav : null;
				if (!active || !nav) return;

				const rows = [];
				for (const row of nav.querySelectorAll("button.panelRow[data-modmenu-id]")) {
					if (row.dataset.modmenuId === active.id) continue;
					if (row.offsetParent === null) continue;
					rows.push(row);
				}
				rows.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
				active.rows = rows;

				let index = rows.length;
				for (let i = 0; i < rows.length; i += 1) {
					const rect = rows[i].getBoundingClientRect();
					if (event.clientY < rect.top + rect.height / 2) {
						index = i;
						break;
					}
				}

				const navRect = nav.getBoundingClientRect();
				const inside = event.clientX >= navRect.left - 16 && event.clientX <= navRect.right + 16;

				const moreButton = nav.querySelector('button.panelRow[aria-haspopup="menu"]');
				let overMore = false;
				if (moreButton && active.kind === "nav" && active.id !== FIXED_PANEL) {
					const rect = moreButton.getBoundingClientRect();
					overMore = event.clientX >= rect.left - 6 && event.clientX <= rect.right + 6
						&& event.clientY >= rect.top - 6 && event.clientY <= rect.bottom + 6;
				}

				if (overMore) {
					active.target = { kind: "hide" };
					active.indicator.style.display = "none";
					moreButton.classList.add("modmenu-drop-more");
					return;
				}
				if (moreButton) moreButton.classList.remove("modmenu-drop-more");

				if (!inside) {
					active.target = null;
					active.indicator.style.display = "none";
					return;
				}

				active.target = { kind: "place", index };
				const reference = index < rows.length ? rows[index] : rows[rows.length - 1];
				if (!reference) {
					active.indicator.style.display = "none";
					return;
				}
				const rect = reference.getBoundingClientRect();
				active.indicator.style.display = "block";
				active.indicator.style.left = rect.left + "px";
				active.indicator.style.width = rect.width + "px";
				active.indicator.style.top = (index < rows.length ? rect.top - 1 : rect.bottom + 1) + "px";
			}

			function activate() {
				const pending = state.pending;
				if (!pending || state.active) return;
				state.pending = null;
				clearTimeout(pending.timer);
				const element = pending.element;
				if (!element || !element.isConnected) {
					unbindGestures();
					return;
				}
				const visual = pending.kind === "nav" ? element : (element.querySelector("button") || element);
				const rect = visual.getBoundingClientRect();
				if (rect.width === 0 && rect.height === 0) {
					unbindGestures();
					return;
				}

				const ghost = visual.cloneNode(true);
				ghost.classList.add("modmenu-ghost");
				stripDragMarkers(ghost);
				ghost.style.left = rect.left + "px";
				ghost.style.top = rect.top + "px";
				ghost.style.width = rect.width + "px";
				ghost.style.height = rect.height + "px";

				const indicator = document.createElement("div");
				indicator.className = "modmenu-indicator";
				indicator.style.display = "none";

				document.body.append(ghost, indicator);
				document.body.classList.add("modmenu-drag-active");
				visual.style.opacity = "0.35";

				state.active = {
					kind: pending.kind,
					id: pending.id,
					element,
					visual,
					nav: pending.nav || panelNav(),
					ghost,
					indicator,
					rows: [],
					target: null,
					x: pending.x,
					y: pending.y,
					offsetX: pending.startX - rect.left,
					offsetY: pending.startY - rect.top,
				};
				updateTarget({ clientX: pending.x, clientY: pending.y });
			}

			function cancelPending() {
				const pending = state.pending;
				state.pending = null;
				if (!pending) return;
				clearTimeout(pending.timer);
				if (!state.active) unbindGestures();
			}

			function endDrag() {
				const active = state.active;
				state.active = null;
				unbindGestures();
				if (!active) return;
				document.body.classList.remove("modmenu-drag-active");
				active.ghost.remove();
				active.indicator.remove();
				if (active.visual) active.visual.style.opacity = "";
				const moreButton = active.nav ? active.nav.querySelector('button.panelRow[aria-haspopup="menu"]') : null;
				if (moreButton) moreButton.classList.remove("modmenu-drop-more");
			}

			function onPointerDown(event) {
				if (event.isPrimary === false) return;
				if (event.pointerType === "mouse" && event.button !== 0) return;
				if (state.active) return;
				if (!isElement(event.target)) return;

				const row = event.target.closest("button.panelRow[data-modmenu-id]");
				const moreItem = row ? null : event.target.closest("[data-modmenu-more-id]");
				if (!row && !moreItem) return;

				if (state.pending) cancelPending();
				const element = row || moreItem;
				const kind = row ? "nav" : "more";
				const id = row ? row.dataset.modmenuId : moreItem.dataset.modmenuMoreId;
				if (!id) return;

				state.pending = {
					kind,
					id,
					element,
					nav: element.closest("nav") || panelNav(),
					startX: event.clientX,
					startY: event.clientY,
					x: event.clientX,
					y: event.clientY,
					timer: window.setTimeout(activate, LONG_PRESS_MS),
				};
				bindGestures();
			}

			function onPointerMove(event) {
				if (state.active) {
					if (event.buttons === 0 && event.pointerType === "mouse") {
						endDrag();
						return;
					}
					moveGhost(event);
					updateTarget(event);
					return;
				}
				const pending = state.pending;
				if (!pending) return;
				const dx = event.clientX - pending.startX;
				const dy = event.clientY - pending.startY;
				if (Math.hypot(dx, dy) > MOVE_TOLERANCE) cancelPending();
			}

			function onPointerUp() {
				const active = state.active;
				if (!active) {
					cancelPending();
					return;
				}
				const target = active.target;
				try {
					if (target && target.kind === "hide") {
						controller.hide(active.id);
					} else if (target && target.kind === "place") {
						if (active.kind === "nav") controller.place(active.id, target.index);
						else controller.reveal(active.id, target.index);
						if (active.kind === "more") controller.dismissMenu();
					}
				} catch (error) {
					console.error("[dsh-modmenu] drop failed:", error);
				} finally {
					suppressClickUntil = Date.now() + CLICK_GUARD_MS;
					endDrag();
				}
			}

			function onPointerCancel() {
				cancelPending();
				endDrag();
			}

			function onKeyDown(event) {
				if (event.key !== "Escape") return;
				if (!state.pending && !state.active) return;
				event.preventDefault();
				event.stopPropagation();
				cancelPending();
				endDrag();
			}

			function onContextMenu(event) {
				if (!state.pending && !state.active) return;
				event.preventDefault();
				event.stopPropagation();
			}

			function onDragStart(event) {
				if (!state.pending && !state.active) return;
				event.preventDefault();
			}

			function onWindowBlur() {
				cancelPending();
				endDrag();
			}

			function onClickCapture(event) {
				if (Date.now() >= suppressClickUntil) return;
				suppressClickUntil = 0;
				event.preventDefault();
				event.stopPropagation();
			}

			function bindGestures() {
				if (gesturesBound) return;
				gesturesBound = true;
				window.addEventListener("pointermove", onPointerMove, true);
				window.addEventListener("pointerup", onPointerUp, true);
				window.addEventListener("pointercancel", onPointerCancel, true);
				window.addEventListener("keydown", onKeyDown, true);
				window.addEventListener("contextmenu", onContextMenu, true);
				window.addEventListener("dragstart", onDragStart, true);
				window.addEventListener("blur", onWindowBlur);
			}

			function unbindGestures() {
				if (!gesturesBound) return;
				gesturesBound = false;
				window.removeEventListener("pointermove", onPointerMove, true);
				window.removeEventListener("pointerup", onPointerUp, true);
				window.removeEventListener("pointercancel", onPointerCancel, true);
				window.removeEventListener("keydown", onKeyDown, true);
				window.removeEventListener("contextmenu", onContextMenu, true);
				window.removeEventListener("dragstart", onDragStart, true);
				window.removeEventListener("blur", onWindowBlur);
			}

			function install() {
				document.addEventListener("pointerdown", onPointerDown, true);
				document.addEventListener("click", onClickCapture, true);
				return () => {
					document.removeEventListener("pointerdown", onPointerDown, true);
					document.removeEventListener("click", onClickCapture, true);
					cancelPending();
					endDrag();
				};
			}

			return { install };
		}

		// ------------------------------------------------------------------
		// plugin entry
		// ------------------------------------------------------------------

		const inject = ["slots", "locale"];

		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, { en, zh }));
			ctx.effect(() => ensureStyles());

			const t = ctx.locale.bind(NS);
			const controller = createController(ctx, t);
			const dragger = createDragger(controller);

			ctx.effect(() => dragger.install());
			ctx.slots.inject(PANEL_SLOT, () => controller.attachPanels());
			ctx.slots.inject(ACTIONS_SLOT, () => controller.attachActions());
		}

		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	},
});
